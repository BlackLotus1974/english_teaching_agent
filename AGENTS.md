# Repository Guidelines

## Project Structure & Module Organization
The Express server lives in `server.js`, orchestrating Vite in middleware mode and exposing `/session` and `/token`. React source sits in `client/` with entry files (`entry-client.jsx`, `entry-server.jsx`), page shells under `client/pages`, and shared UI in `client/components`. Static assets (e.g., `public/avatar.glb`) are served from `public/`. Build outputs go to `dist/` (gitignored). Configuration resides in root `vite.config.js`, `tailwind.config.js`, and `.prettierrc`.

## Build, Test, and Development Commands
Use `npm install` after syncing dependencies. `npm run dev` starts the nodemon-powered Express server plus live Vite client at http://localhost:3000. `npm run start` runs the compiled server against the prebuilt client (ensure `dist/` exists). `npm run build` orchestrates `build:client` and `build:server` to regenerate SSR bundles. Run `npm run lint` to apply ESLint/Prettier fixes before committing.

## Coding Style & Naming Conventions
The repo standardizes on Prettier defaults in `.prettierrc`: two-space indentation, double quotes, trailing commas, and required semicolons. React components and hooks use PascalCase filenames (e.g., `ToolPanel.jsx`) and should export a single default component per file. Prefer modern ES modules, arrow functions for callbacks, and keep client state hooks grouped at the top of components.

## Testing Guidelines
There is no bundled test runner yet; prioritize high-value manual checks. Before sending a PR, run through a mock tutoring session to confirm the WebRTC handshake, avatar rendering, and log panel updates. When adding features, include exploratory notes or console capture in the PR, and consider adding Vite-friendly component tests (Vitest/Testing Library) if the surface area grows.

## Commit & Pull Request Guidelines
Follow the existing concise, imperative commit style visible in `git log` (e.g., `shave some lines`, `update for GA`). Keep commits scoped and explain intent, not implementation minutiae. Pull requests must outline the problem, the solution, manual verification steps, and reference any tracked issues. Include screenshots or short clips when UI changes affect the tutoring console.

## Agent Configuration Tips
Define `OPENAI_API_KEY` in `.env` (copy from `.env.example`) before running any realtime flows. Adjust tutoring behavior in `server.js` by editing the `sessionConfig` instructions block; keep the child-friendly rules intact unless product sign-off approves changes. Avoid logging full API keys or student data; strip values before committing and document any new environment switches in `.env.example`.
