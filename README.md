# Code Clash Arena

Code Clash Arena is a polished, educational 2D multiplayer fighting game built with vanilla JavaScript, HTML Canvas, and Socket.IO. The experience is designed to feel like a premium indie fighter while remaining approachable for students learning real-time game programming.

## Features

- Online room creation and joining with shareable room codes
- Server-authoritative multiplayer simulation
- Canvas-based visuals with neon lighting and animated backgrounds
- Input-driven movement, jumping, dashing, and basic combat
- Lobby, countdown, health bars, round timer, and match state flow
- Educational comments throughout the codebase to explain key programming concepts

## Project Structure

- client/ — browser UI, canvas renderer, and game client
- server/ — express server and authoritative room simulation
- shared/ — reusable constants and utility helpers
- docs/ — additional design notes and future tasks

## Local Development

1. Install dependencies:
   npm install
2. Start the server:
   npm run dev
3. Open http://localhost:3000 in your browser.

## Deployment

### Frontend (Vercel)

- Create a Vercel project and connect the repository.
- Set the build command to none and the output directory to client.
- Ensure the client uses your production Socket.IO server URL.

### Backend (Railway / Render / Fly.io)

- Deploy the server directory with Node.js.
- Set PORT as an environment variable.
- Ensure CORS allows your frontend origin.

## Environment Variables

- PORT — server port for deployment

## Educational Notes

The code is intentionally modular and commented to teach:

- ES modules
- Canvas drawing
- State management
- Event listeners
- Game loops
- Basic physics and collision handling
- Socket.IO networking

## Future Improvements

- Full combat animations and hitboxes
- AI opponent and training mode
- Sound and particle polish
- Reconnection and rollback reconciliation
- Mobile touch controls
