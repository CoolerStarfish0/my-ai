# Axon Desktop Companion (Phase 1)

A small Windows desktop app for opt-in live screen understanding and voice conversation.

## What it does

- Captures a selected screen/window only after **Start live screen** is pressed.
- Samples fresh frames at 1 or 2 frames per second. It does not record or replay a video.
- Sends each sampled JPEG directly to the local Axon bridge at `http://127.0.0.1:3000/api/chat`.
- Uses the local bridge secret entered in the app; the secret is kept in memory only.
- Provides a separate manual microphone toggle and speaks replies with the operating system's available speech synthesis voices.
- Stops screen capture and microphone recognition when their controls are switched off or the app closes.

## Privacy and current limitations

- Screen frames are sent only to the loopback bridge on this PC. This desktop companion does not send screen images through Vercel.
- Frames are not written to disk by this app.
- Chromium speech recognition is used for microphone transcription when available. Depending on the Electron/Chromium build, its recognition provider may process audio online. The UI warns about this and the microphone is never enabled automatically. An offline transcription engine can replace it in a later phase.
- The local bridge must expose `GET /health` and `POST /api/chat`, accept the existing `Authorization: Bearer <LOCAL_AI_SECRET>` header, and accept the existing `{ prompt, system, images } ` request shape.
- The bridge currently chooses its own configured vision model. Configure its vision model as `qwen3-vl:8b` if that model is supported by the installed bridge version. The app does not assume an undocumented model override field.
- The app uses the local bridge directly, so no Vercel API change is required for screen frames. Keeping the capture path local is intentional.

## Install and run

Requires Node.js and npm on Windows.

```powershell
cd path\to\my-ai\desktop-companion
npm install
npm start
```

Start the existing local AI bridge before using the companion. Paste the bridge's `LOCAL_AI_SECRET` into the password field, check the bridge, choose a screen/window, and press **Start live screen**.

## Current phase

This is the first functional scaffold. It deliberately has no mascot, overlay graphics, soundboard, or Myinstants integration. Offline speech-to-text and a more advanced commentary policy are later steps.
