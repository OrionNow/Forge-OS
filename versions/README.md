# Versions

Base builds use plain version numbers. **Use [`v5.5.5/`](v5.5.5/)** (current, recommended).

| Folder | Status | What it is |
|---|---|---|
| `v5.0-stable/` | Stable base | The complete app (terminal + server), as it was in the MECHA project's Main chat. Setup: `SETUP.txt`. |
| `v5.2/` | Playtest build | Basic pass on the playtest feedback, plus the desync fixes. |
| `v5.3/` | Playtest build | Command box and roll log rework. |
| `v5.4/` | Playtest build | Overseer feedback pass. |
| `v5.5.0/` | Playtest build | Overseer feedback pass 2: per-weapon targeter settings, separate Heat buttons, owner field rules. |
| `v5.5.1/` | Playtest build | Overseer feedback pass 3: targeter accuracy header, Evaluate, auto-ticking Heat, GURPS critical labels, Move and Attack, Rapid Strike. |
| `v5.5.2/` | Superseded | Component right-click actions (repair, plating, forced damage), Evaluate +2/+4/+6, Move+Atk default, persistent seat colors (migration 0003), plus Misaki's review fixes (roll-spoofing protection, "(via SEAT)", solo LOCAL). |
| `v5.5.3/` | Superseded, known issues | UI pass (refined surfaces, keyboard access, sheet search, narrow layouts) plus username rename, saved-name auto-connect and chat from any section. Branched before the v5.5.2 review fixes, so it lacks roll-spoofing protection; fixed in 5.5.4. |
| `v5.5.4/` | Previous | 5.5.3 plus the Overseer-approved fixes: spoofing protection restored, vent rule, shield DR, Parry degree step, LOST frames can't attack, RoF bonus from rounds fired, gold DoS/damage, phone layouts removed. |
| `v5.5.5/` | **Current / recommended** | 5.5.4 plus an aspect-ratio layout: two columns below 17:10, OPERATOR CONSOLE as a third column at 17:10 or wider (min 1280 px), 963 px hard floor. |
| `v5.5.5-D1/` | **Active desktop build** | v5.5.5 with a desktop-style UI (windows, one live window per unit, unit groups, console tray, settings, lock-screen login). Same rules and security as v5.5.5. |

> **DEPLOY FIRST (v5.5.2 and later): apply `migrations/0003_forge_member_colors.sql`** before deploying. Without it every enter and poll fails.

The earlier desktop-fork builds (v5.5.1-D1, v5.5.1-D2) are archived in [`../desktop-fork-archived/`](../desktop-fork-archived/).

## Using a newer build

v5.2 and later are patch overlays: they only include the files that changed. Each folder's `CHANGELOG-v*.md` lists the changes, and v5.5.3 / v5.5.4 / v5.5.5 have a README with the exact file-to-destination table. In short:

1. Make a copy of `v5.0-stable/`.
2. Copy the build's files into it (`terminal.html`, `mp-bridge.js`, `forge-hook.js`, and for 5.5.3+ `terminal-ui.css` / `terminal-ui.js`, into `public/`; `server/room.server.ts` over `src/lib/forge/room.server.ts`; `migrations/` into `migrations/`; for 5.5.3+ the `host/` files as that README says).
3. Run it the same way as v5.0 (`npm install`, then `npm run dev`).

`shots/` folders hold screenshots from the team's test runs.
