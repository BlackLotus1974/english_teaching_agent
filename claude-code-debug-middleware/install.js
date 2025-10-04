#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

console.log("🚀 Installing Claude Code Debug Middleware...");

// Check if Node.js version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 16) {
  console.error("❌ Node.js 16 or higher is required. Current version:", nodeVersion);
  process.exit(1);
}

console.log("✅ Node.js version check passed:", nodeVersion);

// Install dependencies
try {
  console.log("📦 Installing dependencies...");
  execSync("npm install", { stdio: "inherit", cwd: process.cwd() });
  console.log("✅ Dependencies installed successfully");
} catch (error) {
  console.error("❌ Failed to install dependencies:", error.message);
  process.exit(1);
}

// Create logs directory structure
const logsDir = path.join(process.cwd(), "logs", "debugging-sessions");
const individualDir = path.join(logsDir, "individual-entries");

try {
  fs.mkdirSync(logsDir, { recursive: true });
  fs.mkdirSync(individualDir, { recursive: true });
  console.log("✅ Created logs directory structure");
} catch (error) {
  console.error("❌ Failed to create logs directory:", error.message);
  process.exit(1);
}

// Create a sample test file
const testFile = `# Claude Code Debug Middleware Test

This file was created during installation to verify the middleware is working correctly.

**Installation Date:** ${new Date().toISOString()}
**Node.js Version:** ${nodeVersion}
**Working Directory:** ${process.cwd()}

## Next Steps

1. Start the middleware: \`npm start\`
2. Test with a debug request
3. Check the logs directory for generated debugging logs

## Manual Test

You can manually trigger a debug log by sending a JSON message:

\`\`\`json
{
  "type": "debug_request",
  "context": "Testing the debug middleware installation"
}
\`\`\`
`;

try {
  fs.writeFileSync(path.join(logsDir, "installation-test.md"), testFile);
  console.log("✅ Created test file");
} catch (error) {
  console.error("❌ Failed to create test file:", error.message);
}

// Check if Claude Code MCP is available
try {
  console.log("🔍 Checking Claude Code MCP availability...");
  execSync("npx @anthropic/claude-code-mcp --version", { stdio: "pipe" });
  console.log("✅ Claude Code MCP is available");
} catch (error) {
  console.warn("⚠️ Claude Code MCP not found. You may need to install it:");
  console.warn("   npm install -g @anthropic/claude-code-mcp");
}

console.log(`
🎉 Installation completed successfully!

📁 Files created:
   - middleware.js (main middleware)
   - debug-logger.js (logging system)
   - config.json (configuration)
   - logs/ (output directory)

🚀 To start the middleware:
   npm start

📝 Logs will be saved to:
   ${logsDir}

🔧 Configuration can be modified in:
   config.json

📖 For more information, see:
   Claude-Code-Debugging-Middleware.md
`);