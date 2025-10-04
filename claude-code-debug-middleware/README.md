# Claude Code Debug Middleware

Automatic debugging log generation middleware for Claude Code MCP sessions.

## Quick Start

1. **Install dependencies:**
   ```bash
   cd claude-code-debug-middleware
   npm install
   ```

2. **Start the middleware:**
   ```bash
   npm start
   ```

3. **The middleware will automatically:**
   - Detect debugging scenarios
   - Generate structured debugging logs
   - Save logs to `logs/debugging-sessions/`

## Features

- 🔍 **Automatic Error Detection**: Detects errors, exceptions, and debugging scenarios
- 📝 **Structured Logging**: Generates comprehensive debugging logs in Markdown format
- 🎯 **Context Capture**: Records user intent, environment details, and session context
- 📊 **Session Analytics**: Tracks debugging patterns and success rates
- 💾 **Persistent Storage**: Saves logs for future reference and learning
- 🔄 **Real-time Processing**: Processes debugging scenarios as they occur

## How It Works

The middleware wraps Claude Code MCP and:

1. **Monitors Communication**: Intercepts input/output between you and Claude Code
2. **Detects Issues**: Uses keywords and patterns to identify debugging scenarios
3. **Captures Context**: Records user intent, environment, and session details
4. **Generates Logs**: Creates structured debugging logs with diagnosis and solutions
5. **Builds Memory**: Accumulates institutional knowledge over time

## Log Structure

Each debugging log includes:

```markdown
### Debugging Log
**Date/Time:** [ISO timestamp]
**Issue:** [Brief description of the problem]
**Context:** [Environment, versions, user intent]
**Diagnosis:** [Root cause analysis and reasoning]
**Attempts & Results:** [Each solution tried and outcome]
**Resolution:** [Final working solution]
**Lessons Learned:** [Key insights and future improvements]
```

## Configuration

Edit `config.json` to customize:

- **Error Detection**: Keywords and patterns for automatic detection
- **Logging Options**: Output formats, retention policies
- **Performance**: Timeouts, memory limits, concurrent sessions

## Manual Triggering

Send a debug request manually:

```json
{
  "type": "debug_request",
  "context": "Describe what you want to debug"
}
```

## Output Files

The middleware generates:

- **Session Logs**: Complete debugging sessions with multiple entries
- **Individual Entries**: Standalone logs for each debugging scenario
- **Session Summaries**: Analytics and patterns from each session

## Integration with Kiro

The middleware is configured in your `.mcp.json`:

```json
{
  "mcpServers": {
    "claude-code-debug": {
      "type": "stdio",
      "command": "node",
      "args": ["claude-code-debug-middleware/middleware.js"],
      "env": {
        "DEBUG_MODE": "true",
        "LOG_LEVEL": "verbose"
      },
      "autoApprove": ["debug_log_request", "debug_request"]
    }
  }
}
```

## Troubleshooting

**Middleware won't start:**
- Check Node.js version (16+ required)
- Verify dependencies are installed: `npm install`
- Check if Claude Code MCP is available: `npx @anthropic/claude-code-mcp --version`

**No logs generated:**
- Verify the `logs/` directory exists and is writable
- Check if debugging scenarios are being detected (look for console output)
- Try manual triggering with a debug request

**Performance issues:**
- Adjust timeouts in `config.json`
- Reduce log retention period
- Limit concurrent sessions

## Development

**File Structure:**
```
claude-code-debug-middleware/
├── middleware.js      # Main middleware logic
├── debug-logger.js    # Logging and file management
├── config.json       # Configuration settings
├── package.json      # Dependencies and scripts
├── install.js        # Installation script
└── logs/             # Generated debugging logs
    ├── debugging-sessions/     # Session logs
    └── individual-entries/     # Individual debug entries
```

**Key Classes:**
- `ClaudeCodeDebugMiddleware`: Main middleware orchestration
- `DebugLogger`: Log generation and file management

## Contributing

To extend the middleware:

1. **Add Detection Patterns**: Update `config.json` error keywords/patterns
2. **Enhance Log Format**: Modify `generateMarkdownLog()` in `debug-logger.js`
3. **Add Integrations**: Extend hooks in `config.json`
4. **Improve Analytics**: Enhance pattern recognition in `identifyPatterns()`

## License

MIT License - see the main project license for details.