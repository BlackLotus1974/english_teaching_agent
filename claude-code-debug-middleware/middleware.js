import { spawn } from "child_process";
import { DebugLogger } from "./debug-logger.js";
import fs from "fs";
import path from "path";

class ClaudeCodeDebugMiddleware {
  constructor() {
    this.logger = new DebugLogger();
    this.sessionId = null;
    this.currentContext = null;
    this.debuggingActive = false;
  }

  async start() {
    console.log("🚀 Starting Claude Code Debug Middleware...");
    
    // Ensure logs directory exists
    const logsDir = path.join(process.cwd(), "logs", "debugging-sessions");
    fs.mkdirSync(logsDir, { recursive: true });

    // Spawn Claude Code MCP process
    const claudeCode = spawn("npx", ["@anthropic/claude-code-mcp"], {
      stdio: ["pipe", "pipe", "pipe"]
    });

    console.log("📡 Claude Code MCP process started");

    // Handle Claude Code output
    claudeCode.stdout.on("data", async (data) => {
      const output = data.toString();
      await this.processOutput(output);
      
      // Forward output to parent process
      process.stdout.write(data);
    });

    // Handle Claude Code errors
    claudeCode.stderr.on("data", async (data) => {
      const error = data.toString();
      await this.processError(error);
      
      // Forward error to parent process
      process.stderr.write(data);
    });

    // Handle input from parent process
    process.stdin.on("data", (data) => {
      const input = data.toString();
      this.processInput(input);
      
      // Forward input to Claude Code
      claudeCode.stdin.write(data);
    });

    claudeCode.on("close", (code) => {
      console.log(`Claude Code process exited with code ${code}`);
      if (this.sessionId) {
        this.logger.finalizeSession(this.sessionId);
      }
    });

    // Handle process termination
    process.on("SIGINT", () => {
      console.log("🛑 Shutting down middleware...");
      if (this.sessionId) {
        this.logger.finalizeSession(this.sessionId);
      }
      claudeCode.kill();
      process.exit(0);
    });
  }

  async processInput(input) {
    try {
      const message = JSON.parse(input);
      
      // Start new session if needed
      if (!this.sessionId) {
        this.sessionId = this.logger.startSession();
        console.log(`🔍 Started debugging session: ${this.sessionId}`);
      }

      // Capture context for potential debugging
      this.currentContext = {
        timestamp: new Date().toISOString(),
        input: message,
        userIntent: this.extractUserIntent(message)
      };

      // Check if this is a manual debug request
      if (message.type === "debug_request") {
        await this.generateDebugLog({
          type: "manual_debug",
          context: message.context || "Manual debug request",
          manual: true
        });
      }

    } catch (error) {
      // Input might not be JSON, that's okay for non-MCP communication
    }
  }

  async processOutput(output) {
    try {
      const message = JSON.parse(output);
      
      // Check if this looks like an error or debugging scenario
      if (this.isDebuggingScenario(message)) {
        console.log("🐛 Debugging scenario detected, generating log...");
        await this.generateDebugLog(message);
      }

    } catch (error) {
      // Output might not be JSON, check for error patterns in plain text
      if (this.containsErrorPatterns(output)) {
        console.log("⚠️ Error pattern detected in output");
        await this.generateDebugLog({
          type: "text_error",
          content: output,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  async processError(error) {
    console.log("❌ Error detected:", error.substring(0, 100) + "...");
    
    if (this.sessionId && this.currentContext) {
      await this.generateDebugLog({
        type: "stderr_error",
        error: error,
        context: this.currentContext,
        timestamp: new Date().toISOString()
      });
    }
  }

  isDebuggingScenario(message) {
    // Detect if this is a debugging scenario based on message content
    const debugKeywords = [
      "error", "exception", "failed", "failure", "bug", "issue", 
      "unexpected", "crash", "crashed", "broken", "fix", "debug",
      "traceback", "stack trace", "syntax error", "runtime error",
      "compilation error", "build failed", "test failed"
    ];
    
    const messageStr = JSON.stringify(message).toLowerCase();
    return debugKeywords.some(keyword => messageStr.includes(keyword));
  }

  containsErrorPatterns(text) {
    const errorPatterns = [
      /error:/i,
      /exception:/i,
      /failed/i,
      /traceback/i,
      /syntax error/i,
      /runtime error/i,
      /compilation error/i,
      /build failed/i,
      /test failed/i,
      /\[error\]/i,
      /\berror\b.*\bline\b/i
    ];
    
    return errorPatterns.some(pattern => pattern.test(text));
  }

  async generateDebugLog(errorMessage) {
    if (this.debuggingActive) {
      return; // Prevent recursive debugging
    }

    this.debuggingActive = true;
    
    try {
      const debugPrompt = this.createDebugPrompt(errorMessage);
      
      // Log the debug session
      await this.logger.logDebuggingSession(this.sessionId, {
        context: this.currentContext,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        debugPrompt: debugPrompt
      });

      console.log("📝 Debug log generated and saved");
      
    } catch (error) {
      console.error("Failed to generate debug log:", error.message);
    } finally {
      this.debuggingActive = false;
    }
  }

  createDebugPrompt(errorMessage) {
    const timestamp = new Date().toISOString();
    const userIntent = this.currentContext?.userIntent || "Unknown";
    
    return `
# Claude Code Debugging Log Generation Request

Generate a comprehensive debugging log for this session using the structured Markdown format.

## Session Information
- **Session ID:** ${this.sessionId}
- **Timestamp:** ${timestamp}
- **User Intent:** ${userIntent}

## Error/Issue Details
\`\`\`json
${JSON.stringify(errorMessage, null, 2)}
\`\`\`

## Context Information
\`\`\`json
${JSON.stringify(this.currentContext, null, 2)}
\`\`\`

## Required Output Format
Please create a debugging log with the following sections:

### Debugging Log
**Date/Time:** ${timestamp}
**Issue:** [Brief, clear description of the problem]
**Context:** [Environment details, versions, user intent, relevant configuration]
**Diagnosis:** [Root cause analysis with reasoning steps]
**Attempts & Results:** [Each solution approach tried and its outcome]
**Resolution:** [Final working solution or current status if unresolved]
**Lessons Learned:** [Key insights, patterns, and future prevention strategies]

## Instructions
1. Focus on actionable insights that will help prevent similar issues
2. Include specific code snippets, commands, or configuration changes
3. Explain the reasoning behind each diagnostic step
4. Suggest improvements to workflows or prompts to avoid this issue
5. Keep the language clear and technical but accessible

Generate the debugging log now:
    `;
  }

  extractUserIntent(message) {
    // Extract user intent from various message types
    if (message.content) {
      return message.content.substring(0, 150) + (message.content.length > 150 ? "..." : "");
    }
    
    if (message.prompt) {
      return message.prompt.substring(0, 150) + (message.prompt.length > 150 ? "..." : "");
    }
    
    if (message.text) {
      return message.text.substring(0, 150) + (message.text.length > 150 ? "..." : "");
    }
    
    if (message.type) {
      return `Action: ${message.type}`;
    }
    
    return "Unknown intent - no recognizable content";
  }
}

// Start the middleware
const middleware = new ClaudeCodeDebugMiddleware();
middleware.start().catch(error => {
  console.error("Failed to start middleware:", error);
  process.exit(1);
});