# Claude Code Debugging & Log Generation Middleware

## Overview

This middleware wraps Claude Code MCP with automatic debugging log generation, creating a continuous written record that builds institutional memory and helps Claude Code learn from mistakes.

## Debugging Log Instruction

### Core Prompt
```markdown
You are a debugging companion and logger for Claude Code. Whenever you help resolve an error, bug, or unexpected behavior, you must:

1. **Capture Context**
   - Record the exact error message, stack trace, or failing output
   - Note the environment, libraries, versions, or configuration details
   - Summarize the user's original intent (what they were trying to do)

2. **Diagnose & Reasoning**
   - Write down the suspected root cause of the issue
   - Log the diagnostic steps you took (commands run, code snippets inspected, tests performed)
   - Record hypotheses you considered, even if they were later discarded

3. **Solution Attempt**
   - Document each fix you propose, with reasoning
   - If a fix fails, log why it failed and what changed
   - If a fix succeeds, log the final working code/config and explain why it solved the issue

4. **Learning & Improvement**
   - Extract lessons learned (patterns, pitfalls, best practices)
   - Suggest how future prompts, code, or workflows could be improved to avoid the same issue

5. **Log Format**
   Use structured Markdown sections:
   ```
   ### Debugging Log
   **Date/Time:** [ISO timestamp]
   **Issue:** [Brief description of the problem]
   **Context:** [Environment, versions, user intent]
   **Diagnosis:** [Root cause analysis and reasoning]
   **Attempts & Results:** [Each solution tried and outcome]
   **Resolution:** [Final working solution]
   **Lessons Learned:** [Key insights and future improvements]
   ```

Your goal: not only to fix bugs, but also to generate a **continuous written record** that builds institutional memory and helps Claude Code learn from mistakes.
```

## Implementation Strategies

### Strategy 1: MCP Middleware Wrapper (Recommended)

Create a Node.js wrapper that intercepts Claude Code MCP communication and automatically generates debugging logs.

#### File Structure
```
claude-code-debug-middleware/
├── package.json
├── middleware.js
├── debug-logger.js
├── config.json
└── logs/
    └── debugging-sessions/
```

#### Implementation Files

**package.json**
```json
{
  "name": "claude-code-debug-middleware",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node middleware.js"
  },
  "dependencies": {
    "uuid": "^9.0.0",
    "date-fns": "^2.30.0"
  }
}
```

**middleware.js**
```javascript
import { spawn } from "child_process";
import { DebugLogger } from "./debug-logger.js";
import fs from "fs";
import path from "path";

class ClaudeCodeDebugMiddleware {
  constructor() {
    this.logger = new DebugLogger();
    this.sessionId = null;
    this.currentContext = null;
  }

  async start() {
    console.log("Starting Claude Code Debug Middleware...");
    
    // Ensure logs directory exists
    const logsDir = path.join(process.cwd(), "logs", "debugging-sessions");
    fs.mkdirSync(logsDir, { recursive: true });

    // Spawn Claude Code MCP process
    const claudeCode = spawn("npx", ["@anthropic/claude-code-mcp"], {
      stdio: ["pipe", "pipe", "pipe"]
    });

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
      this.logger.finalizeSession(this.sessionId);
    });
  }

  async processInput(input) {
    try {
      const message = JSON.parse(input);
      
      // Start new session if needed
      if (!this.sessionId) {
        this.sessionId = this.logger.startSession();
      }

      // Capture context for potential debugging
      this.currentContext = {
        timestamp: new Date().toISOString(),
        input: message,
        userIntent: this.extractUserIntent(message)
      };

    } catch (error) {
      // Input might not be JSON, that's okay
    }
  }

  async processOutput(output) {
    try {
      const message = JSON.parse(output);
      
      // Check if this looks like an error or debugging scenario
      if (this.isDebuggingScenario(message)) {
        await this.generateDebugLog(message);
      }

    } catch (error) {
      // Output might not be JSON, that's okay
    }
  }

  async processError(error) {
    if (this.sessionId && this.currentContext) {
      await this.generateDebugLog({
        type: "error",
        error: error,
        context: this.currentContext
      });
    }
  }

  isDebuggingScenario(message) {
    // Detect if this is a debugging scenario based on message content
    const debugKeywords = [
      "error", "exception", "failed", "bug", "issue", 
      "unexpected", "crash", "broken", "fix", "debug"
    ];
    
    const messageStr = JSON.stringify(message).toLowerCase();
    return debugKeywords.some(keyword => messageStr.includes(keyword));
  }

  async generateDebugLog(errorMessage) {
    const debugPrompt = this.createDebugPrompt(errorMessage);
    
    // Send debug prompt to Claude Code for log generation
    const debugRequest = {
      type: "debug_log_request",
      prompt: debugPrompt,
      session_id: this.sessionId
    };

    // Log the debug session
    await this.logger.logDebuggingSession(this.sessionId, {
      context: this.currentContext,
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }

  createDebugPrompt(errorMessage) {
    return `
Generate a Debugging Log for this session using the structured Markdown format.

Context Information:
- Session ID: ${this.sessionId}
- Timestamp: ${new Date().toISOString()}
- User Intent: ${this.currentContext?.userIntent || "Unknown"}
- Error/Issue: ${JSON.stringify(errorMessage, null, 2)}

Please create a debugging log with the following sections:
### Debugging Log
**Date/Time:** ${new Date().toISOString()}
**Issue:** [Brief description of the problem]
**Context:** [Environment, versions, user intent]
**Diagnosis:** [Root cause analysis and reasoning]
**Attempts & Results:** [Each solution tried and outcome]
**Resolution:** [Final working solution or current status]
**Lessons Learned:** [Key insights and future improvements]

Focus on creating actionable insights that will help prevent similar issues in the future.
    `;
  }

  extractUserIntent(message) {
    // Simple heuristic to extract user intent from message
    if (message.content) {
      return message.content.substring(0, 100) + "...";
    }
    return "Unknown intent";
  }
}

// Start the middleware
const middleware = new ClaudeCodeDebugMiddleware();
middleware.start().catch(console.error);
```

**debug-logger.js**
```javascript
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";

export class DebugLogger {
  constructor() {
    this.sessions = new Map();
    this.logsPath = path.join(process.cwd(), "logs", "debugging-sessions");
  }

  startSession() {
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      startTime: new Date(),
      logs: [],
      status: "active"
    };
    
    this.sessions.set(sessionId, session);
    console.log(`Started debugging session: ${sessionId}`);
    
    return sessionId;
  }

  async logDebuggingSession(sessionId, logData) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error(`Session ${sessionId} not found`);
      return;
    }

    session.logs.push(logData);
    
    // Write to file immediately for persistence
    await this.writeSessionLog(sessionId, session);
  }

  async writeSessionLog(sessionId, session) {
    const filename = `debug-session-${sessionId}-${format(session.startTime, "yyyy-MM-dd-HH-mm-ss")}.md`;
    const filepath = path.join(this.logsPath, filename);
    
    const markdown = this.generateMarkdownLog(session);
    
    try {
      await fs.promises.writeFile(filepath, markdown, "utf8");
      console.log(`Debug log written to: ${filepath}`);
    } catch (error) {
      console.error(`Failed to write debug log: ${error.message}`);
    }
  }

  generateMarkdownLog(session) {
    const header = `# Claude Code Debugging Session

**Session ID:** ${session.id}
**Start Time:** ${session.startTime.toISOString()}
**Status:** ${session.status}
**Total Logs:** ${session.logs.length}

---

`;

    const logs = session.logs.map((log, index) => {
      return `## Debug Entry ${index + 1}

### Debugging Log
**Date/Time:** ${log.timestamp}
**Issue:** ${this.extractIssue(log)}
**Context:** ${this.formatContext(log.context)}
**Diagnosis:** ${this.extractDiagnosis(log)}
**Attempts & Results:** ${this.formatAttempts(log)}
**Resolution:** ${this.extractResolution(log)}
**Lessons Learned:** ${this.extractLessons(log)}

---

`;
    }).join("");

    return header + logs;
  }

  extractIssue(log) {
    if (log.error?.type) {
      return log.error.type;
    }
    return "Unknown issue";
  }

  formatContext(context) {
    if (!context) return "No context available";
    
    return `
- User Intent: ${context.userIntent}
- Timestamp: ${context.timestamp}
- Input: ${JSON.stringify(context.input, null, 2)}
    `.trim();
  }

  extractDiagnosis(log) {
    // This would be filled by Claude's response to the debug prompt
    return "Pending analysis from Claude Code";
  }

  formatAttempts(log) {
    return "Attempts will be logged as they occur";
  }

  extractResolution(log) {
    return log.resolved ? "Issue resolved" : "Resolution in progress";
  }

  extractLessons(log) {
    return "Lessons learned will be extracted after resolution";
  }

  finalizeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = "completed";
      session.endTime = new Date();
      this.writeSessionLog(sessionId, session);
      console.log(`Finalized debugging session: ${sessionId}`);
    }
  }
}
```

### Strategy 2: MCP Configuration Hook

Update your `.mcp.json` to include the debugging middleware:

```json
{
  "mcpServers": {
    "claude-code-debug": {
      "command": "node",
      "args": ["claude-code-debug-middleware/middleware.js"],
      "env": {
        "DEBUG_MODE": "true",
        "LOG_LEVEL": "verbose"
      },
      "disabled": false,
      "autoApprove": ["debug_log_request"]
    }
  }
}
```

### Strategy 3: Kiro Hook Integration

Create a Kiro hook that automatically applies debugging logs:

**File: `.kiro/hooks/claude-code-debug.js`**
```javascript
export default {
  name: "Claude Code Debug Logger",
  description: "Automatically generates debugging logs for Claude Code sessions",
  trigger: "on_error",
  
  async execute(context) {
    const debugPrompt = `
You are a debugging companion and logger for Claude Code. Generate a debugging log for this error:

Error: ${context.error}
Context: ${JSON.stringify(context, null, 2)}

Use this format:
### Debugging Log
**Date/Time:** ${new Date().toISOString()}
**Issue:** [Brief description]
**Context:** [Environment and user intent]
**Diagnosis:** [Root cause analysis]
**Attempts & Results:** [Solutions tried]
**Resolution:** [Final solution]
**Lessons Learned:** [Key insights]
    `;
    
    return {
      type: "debug_log",
      content: debugPrompt,
      save_to: `logs/debug-${Date.now()}.md`
    };
  }
};
```

## Usage Instructions

### Setup
1. Create the middleware directory structure
2. Install dependencies: `npm install`
3. Update your MCP configuration to use the middleware
4. Start the middleware: `npm start`

### Automatic Logging
The middleware will automatically:
- Detect debugging scenarios based on keywords
- Generate structured debugging logs
- Save logs to `logs/debugging-sessions/`
- Build institutional memory over time

### Manual Triggering
You can also manually trigger debug logging by sending a special message:
```json
{
  "type": "debug_request",
  "context": "Describe the issue you want to debug"
}
```

## Log Storage Options

### File System (Default)
Logs are saved as Markdown files in `logs/debugging-sessions/`

### Database Integration
For structured querying, you can extend the logger to save to:
- SQLite for local storage
- Supabase for cloud storage
- PostgreSQL for enterprise use

### Example Database Schema
```sql
CREATE TABLE debugging_logs (
  id UUID PRIMARY KEY,
  session_id UUID,
  timestamp TIMESTAMP,
  issue TEXT,
  context JSONB,
  diagnosis TEXT,
  attempts JSONB,
  resolution TEXT,
  lessons_learned TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Benefits

1. **Institutional Memory**: Every debug session becomes a knowledge artifact
2. **Pattern Recognition**: Identify recurring issues and solutions
3. **Learning Acceleration**: New team members can learn from past debugging sessions
4. **Quality Improvement**: Track resolution effectiveness over time
5. **Automated Documentation**: No manual effort required to maintain debug logs

## Future Enhancements

- AI-powered pattern recognition across debug logs
- Integration with issue tracking systems
- Automated solution suggestions based on historical data
- Performance metrics and debugging effectiveness tracking
- Team collaboration features for shared debugging knowledge