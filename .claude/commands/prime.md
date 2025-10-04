# Prime Context for Claude Code

Primes Claude Code with comprehensive project context by reading key files and searching the codebase.

## Usage

```
/prime [optional-file-path]
```

## Arguments

- `[optional-file-path]` - Optional specific file to start with. If not provided, starts with standard project files.

## Steps

1. **Read Core Documentation** (in order):
   - Read `CLAUDE.md` if it exists - this contains guidance for working in this repository
   - Read `context_engineering_template.md` if it exists - project context template
   - Read `README.md` - project overview and setup instructions
   - Read `README-SETUP.md` if it exists - additional setup documentation

2. **Read Configuration Files**:
   - `package.json` - dependencies, scripts, and project metadata
   - `.env.example` - environment variable requirements
   - `vite.config.js` or build configuration files
   - `nodemon.json` or other dev tool configs if present

3. **Read Key Source Files**:
   - Main server entry point (e.g., `server.js`, `index.js`, `app.js`)
   - Main client entry points (e.g., `client/entry-server.jsx`, `client/entry-client.jsx`)
   - Core application components (e.g., `client/components/App.jsx`)
   - Shared utilities and configuration (e.g., `shared/` directory contents)

4. **Use Serena MCP for Deep Analysis**:
   - Search through the codebase using Serena MCP tools
   - If errors occur with Serena, retry with different Serena tools
   - Map out architecture and key patterns
   - Identify important abstractions and interfaces

5. **Optional Custom File**:
   - If `$ARGUMENTS` is provided, read that file first before other steps

## Implementation

Read files in the order above to build comprehensive context. Use Serena MCP's search capabilities to understand codebase structure and relationships between components.

## Example

```
/prime
```

or

```
/prime server.js
```
