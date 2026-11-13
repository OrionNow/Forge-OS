# FORGE-OS

FORGE-OS is an in-world mech sheet and terminal for a GURPS mecha campaign. It looks and behaves like a research-division database: you build and load frames, track damage, heat and ammo on a paper doll, roll attacks, and run **multiplayer sorties** where the host and pilots share one live table.

## Where things are

| Folder | What's in it |
|---|---|
| [`versions/`](versions/) | Every base build of the app. Start here. |
| [`versions/v5.5.5/`](versions/v5.5.5/) | **Current / recommended build** (patch overlay onto v5.0-stable). |
| [`versions/v5.0-stable/`](versions/v5.0-stable/) | **Stable v5.0**: the full app (terminal + server) that newer builds are applied to. |
| [`versions/v5.5.5-D1/`](versions/v5.5.5-D1/) | **Active desktop build**: v5.5.5 with a desktop-style UI (patch overlay onto v5.0-stable). |
| [`desktop-fork-archived/`](desktop-fork-archived/) | The earlier desktop-fork builds (v5.5.1-D1, v5.5.1-D2), archived for reference. |
| [`catalogue/`](catalogue/) | Catalogue items (frames, weapons, systems) and the notes behind them. |
| [`ui/`](ui/) | UI design notes and proposals (not builds; those are in versions/). |
| [`devtools/`](devtools/) | The team's build/patch scripts and automated checks. |

## Version guide

Base builds use plain numbers (v5.5.0, v5.5.1, ...). Desktop builds add `-D1`, `-D2`, ... to the base version they are built on. The active desktop build lives in `versions/`; the earlier ones are archived separately.

| Version | Summary |
|---|---|
| [v5.0-stable](versions/v5.0-stable/) | The complete stable app (terminal + server) from the MECHA project's Main chat. Setup: `SETUP.txt`. |
| [v5.2](versions/v5.2/), [v5.3](versions/v5.3/), [v5.4](versions/v5.4/) | Playtest builds: playtest feedback and desync fixes; command box and roll log rework; Overseer feedback pass. |
| [v5.5.0](versions/v5.5.0/) | Overseer feedback pass 2: per-weapon targeter settings, separate Heat buttons, owner field rules. |
| [v5.5.1](versions/v5.5.1/) | Overseer feedback pass 3: targeter accuracy header, Evaluate, auto-ticking Heat, GURPS critical labels, Move and Attack, Rapid Strike. |
| [v5.5.2](versions/v5.5.2/) | Component right-click actions, Evaluate +2/+4/+6, persistent seat colors (migration 0003), plus Misaki's review fixes (roll-spoofing protection, "(via SEAT)", solo LOCAL). |
| [v5.5.3](versions/v5.5.3/) | UI pass (refined surfaces, keyboard access, sheet search, narrow layouts) plus username rename and saved-name auto-connect. **Known issues:** branched before the 5.5.2 review fixes, so roll-spoofing protection is missing. All fixed in 5.5.4. |
| [v5.5.4](versions/v5.5.4/) | Previous. 5.5.3 plus the Overseer-approved fixes: spoofing protection restored, vent rule, shield DR, Parry degree step, LOST frames can't attack, RoF bonus from rounds fired, gold DoS/damage numbers, phone layouts removed. |
| [**v5.5.5**](versions/v5.5.5/) | **Current / recommended.** 5.5.4 plus an aspect-ratio layout: two columns below 17:10; at 17:10 or wider (min 1280 px) the OPERATOR CONSOLE becomes a full-height third column with a user strip; 963 px hard floor. |
| [v5.5.5-D1](versions/v5.5.5-D1/) | **Active desktop build.** v5.5.5 with a desktop-style UI: every function in its own window, one live window per unit with collapsible and pop-out sections, unit group windows, console in a taskbar tray, themes and layout slots in SETTINGS, lock-screen login on every connect. Same rules, multiplayer and security as v5.5.5; `?classic` gives the v5.5.5 layout. |
| [Desktop fork (archived)](desktop-fork-archived/) | v5.5.1-D1 (first desktop window shell) and v5.5.1-D2 (Modular Cockpit, shipped untested). Paused and abandoned for now. |

> **DEPLOY FIRST (v5.5.2 and later, including v5.5.5): apply `migrations/0003_forge_member_colors.sql` before deploying.** The server's member query selects `color`; without the migration every enter and poll fails and nobody can join. `npm run build` applies it when `DATABASE_URL` is set; the local PGLite fallback applies it at startup.

**Changelogs** are inside each version folder (`CHANGELOG-v*.md`; v5.5.3, v5.5.4, v5.5.5 and v5.5.5-D1 also have a README with install steps). **Zip archives** are not stored in this repo; the complete runnable archives (for example `forge-os-v5.5.5.zip`) are distributed separately by the team.

## Which version should I use?

- **For play:** [`versions/v5.5.5/`](versions/v5.5.5/). It is a patch overlay: copy [`versions/v5.0-stable/`](versions/v5.0-stable/), copy the v5.5.5 files in as its [README](versions/v5.5.5/README.md) shows, and apply migration 0003 (see DEPLOY FIRST above).
- **Desktop UI:** [`versions/v5.5.5-D1/`](versions/v5.5.5-D1/), installed the same way (its README adds `desk.js`).
- **Untouched baseline:** [`versions/v5.0-stable/`](versions/v5.0-stable/) on its own. See [`versions/README.md`](versions/README.md) for every build.

## Running the app

The full instructions are in [`versions/v5.0-stable/SETUP.txt`](versions/v5.0-stable/SETUP.txt). In short:

1. Install **Node.js 22**.
2. In the `v5.0-stable` folder, run `npm install` (once), then `npm run dev`.
3. Leave that window open and go to **http://localhost:8080**.
4. Pick **[6] LIVE DATA INTERCEPT** and enter a callsign for the shared table. The first person in is the host.

Other players on the same Wi-Fi open `http://YOUR-IP:8080`. For players in other houses, SETUP.txt suggests a tunnel (Cloudflare Tunnel or ngrok) pointed at port 8080. Stopping the server wipes the table.

## Catalogue items

The newest catalogue cut is [`catalogue/batch2-v0/`](catalogue/batch2-v0/): paste-ready lines for the catalogue block in `terminal.html`. See [`catalogue/README.md`](catalogue/README.md).

---
*This repo is synced from the team's working folder. Rulebook PDFs and zip archives are left out on purpose.*
