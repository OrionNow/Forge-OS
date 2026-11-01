# Versions

| Folder | Status | What it is |
|---|---|---|
| `v5.0-stable/` | **Stable** | The complete app (terminal + server), as it was in the MECHA project's Main chat. Setup: `SETUP.txt`. |
| `v5.2/` | Playtest build | Basic pass on the playtest feedback, plus the desync fixes. Changelog inside the folder. |
| `v5.3/` | In progress | The next round of UI feedback. Not reviewed or approved yet. |

## Using a newer build

v5.2 and later only include the files that changed. To try one:

1. Make a copy of `v5.0-stable/`.
2. Copy the build's `terminal.html`, `mp-bridge.js` and `forge-hook.js` into the copy's `public/` folder.
3. Copy the build's `server/room.server.ts` over `src/lib/forge/room.server.ts`.
4. Run it the same way as v5.0 (`npm install`, then `npm run dev`).

`shots/` folders hold screenshots from the team's test runs.
