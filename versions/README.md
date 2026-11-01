# Versions

| Folder | Status | What it is |
|---|---|---|
| `v5.0-stable/` | **Stable** | The complete app (terminal + server), as it was in the MECHA project's Main chat. Setup: `SETUP.txt`. |
| `v5.2/` | Playtest build | Basic pass on the playtest feedback, plus the desync fixes. Changelog inside the folder. |
| `v5.3/` | Playtest build | Command box and roll log rework. |
| `v5.4/` | Playtest build | Overseer feedback pass. |
| `v5.5.0/` | Playtest build | Per-weapon targeters, Heat buttons, view-only units. |
| `v5.5.1/` | Playtest build | Crits, Evaluate, Move and Attack, Rapid Strike. |
| `v5.5.1-D1/` | Desktop branch | First desktop-style window layout, built on v5.5.1 (adds `desk.js`; the CLASSIC/DESK toggle restores the v5.5.1 layout). |

Desktop builds branch off a base version and are named `v5.x.y-D1`, `-D2`, and so on.

## Using a newer build

v5.2 and later only include the files that changed. To try one:

1. Make a copy of `v5.0-stable/`.
2. Copy the build's `terminal.html`, `mp-bridge.js`, `forge-hook.js` (and `desk.js` for desktop builds) into the copy's `public/` folder.
3. Copy the build's `server/room.server.ts` over `src/lib/forge/room.server.ts`.
4. Run it the same way as v5.0 (`npm install`, then `npm run dev`).

`shots/` folders hold screenshots from the team's test runs.
