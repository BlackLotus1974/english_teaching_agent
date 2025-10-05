# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An English teaching application for children built on OpenAI's Realtime API. Uses WebRTC for real-time voice conversations between a child and an AI English tutor. The tutor provides pronunciation feedback, conversational practice, and gentle corrections. Based on the OpenAI Realtime Console with customizations for educational use.

## Development Commands

```bash
# Start development server (recommended for development)
npm run dev

# Start production server
npm start

# Build client and server
npm run build

# Lint and auto-fix
npm run lint
```

The dev server runs on http://localhost:3000 with hot-reload via nodemon and Vite.

## Architecture

### Server ([server.js](server.js))
- Express server with Vite SSR middleware for React
- Two API endpoints:
  - `GET /token` - Generates ephemeral tokens via OpenAI's `/v1/realtime/client_secrets` endpoint (used by client for authentication)
  - `POST /session` - Alternative endpoint for SDP negotiation (currently unused; client connects directly to OpenAI)
- Requires `OPENAI_API_KEY` environment variable
- Serves React app with SSR via Vite middleware

### Client Architecture
- **SSR Setup**: Uses Vite for both development and SSR rendering
  - [entry-server.jsx](client/entry-server.jsx) - SSR entry point
  - [entry-client.jsx](client/entry-client.jsx) - Client hydration
  - [vite.config.js](vite.config.js) - Configured with client root and public directory

- **Core Components**:
  - [App.jsx](client/components/App.jsx) - Main component managing WebRTC lifecycle
    - Manages RTCPeerConnection with OpenAI Realtime API
    - Handles audio track setup (microphone input and AI audio output)
    - Creates and manages RTCDataChannel for event communication
    - Event state management and client event sending
    - Detects praise keywords in AI transcript to trigger encouragement animations
  - [ToolPanel.jsx](client/components/ToolPanel.jsx) - Session configuration and UI tips
    - Listens for `session.created` event to trigger initial configuration
    - Sends `session.update` event with tutor instructions and audio settings
    - Triggers initial greeting via `response.create` event
    - Manages mode selection and topic card interactions
  - [SessionControls.jsx](client/components/SessionControls.jsx) - Connect/disconnect UI
  - [Avatar3D.jsx](client/components/Avatar3D.jsx) - Three.js 3D avatar with audio-reactive animation
    - Loads GLB avatar from `/public/avatar.glb`
    - Uses Web Audio API analyzer to detect audio levels from AI response
    - Animates morph targets (blend shapes) for lip sync based on audio frequency data
    - Supports multiple viseme naming conventions (mouthOpen, viseme_aa, etc.)
    - Displays emotions (neutral, happy, encouraging, thinking, excited, listening)
  - [StarProgress.jsx](client/components/StarProgress.jsx) - Tracks session completion with star rewards
  - [EncouragementAnimations.jsx](client/components/EncouragementAnimations.jsx) - Visual feedback (confetti, sparkles, star burst, praise banners)
  - [TopicCards.jsx](client/components/TopicCards.jsx) - Clickable conversation starter cards
  - [ModeSelector.jsx](client/components/ModeSelector.jsx) - UI for selecting tutor mode
  - [EventLog.jsx](client/components/EventLog.jsx) - Real-time event logging panel

### WebRTC Flow
1. Client calls `/token` to get ephemeral key from server
2. Creates RTCPeerConnection with microphone track via `getUserMedia`
3. Establishes data channel named "oai-events" for bidirectional event communication
4. Creates SDP offer and sends directly to OpenAI's `/v1/realtime/calls?model=gpt-realtime` endpoint using ephemeral key
5. Sets remote description from OpenAI's SDP answer
6. Data channel opens → session becomes active
7. `session.created` event triggers tutor configuration in [ToolPanel.jsx](client/components/ToolPanel.jsx)
8. Session update sent with instructions from [shared/tutorInstructions.js](shared/tutorInstructions.js)
9. Initial `response.create` event triggers AI greeting (500ms after configuration)
10. Audio responses received via `pc.ontrack` → played through dynamically created audio element
11. Audio element connected to Web Audio API analyzer for avatar lip sync animation

### Tutor Configuration
The AI tutor behavior is defined in [shared/tutorInstructions.js](shared/tutorInstructions.js) and applied via `session.update` event in [ToolPanel.jsx](client/components/ToolPanel.jsx). This is where you customize:
- Tutor personality and rules (strict English-only teaching, child-friendly)
- Pronunciation correction approach (gentle, immediate feedback with examples)
- Topic suggestions (family, school, pets, games, etc.)
- Session greeting behavior (always greets child by name first)
- Conversation topics specific to the child (sisters Tamar and Ayala, dogs Lotus and Albi)

The instructions file exports three mode-specific instruction sets:
- `happyModeInstructions` - Extra cheerful and energetic tutor
- `storyModeInstructions` - Interactive storytelling focus
- `questionModeInstructions` - Question-driven to encourage more speaking

Mode selection happens via [ModeSelector.jsx](client/components/ModeSelector.jsx) component, and the selected mode's instructions are applied during session configuration.

Key configuration in session update (sent in [ToolPanel.jsx](client/components/ToolPanel.jsx)):
- `model: "gpt-realtime"`
- `voice: "shimmer"` (female voice to match avatar)
- Turn detection with server VAD (Voice Activity Detection)
- Modalities: text and audio
- `instructions` field populated from selected mode instructions

## Environment Setup

1. Create `.env` from `.env.example`:
   ```bash
   cp .env.example .env
   ```

2. Add your OpenAI API key:
   ```
   OPENAI_API_KEY="sk-..."
   ```

## Key Technologies
- **React 18** with hooks (no React Router, single-page app)
- **Three.js** (vanilla, not React Three Fiber) with GLTFLoader for 3D avatar
- **WebRTC** for peer-to-peer real-time communication with OpenAI
- **Web Audio API** for audio analysis and lip sync animation
- **Vite** for bundling and dev server with SSR middleware
- **Express** for server-side rendering and API routes
- **Tailwind CSS** for styling (with PostCSS and nesting)

## File Watching
Nodemon watches server.js and all client files ([nodemon.json](nodemon.json)). Changes trigger automatic restart with 1s delay.

## Important Notes
- The application uses WebRTC data channels for bidirectional event communication with OpenAI
- Client connects DIRECTLY to OpenAI's API (not through server proxy) using ephemeral token
- Audio output from the AI is received via `RTCPeerConnection.ontrack` and played through a dynamically created audio element
- All events sent to OpenAI must include an `event_id` (auto-generated via `crypto.randomUUID()` if not provided)
- The tutor instructions define strict rules to keep the AI focused on English teaching only
- Session is configured AFTER connection via `session.update` event, not during initial connection
- Voice is set to "shimmer" (female) to match the female avatar character
- Avatar requires GLB file at `/public/avatar.glb` with morph targets for lip sync
- The `/session` endpoint exists but is currently unused (direct client-to-OpenAI connection is used instead)
