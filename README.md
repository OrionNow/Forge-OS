# FORGE-OS

FORGE-OS is an in-world mech sheet and terminal for a GURPS mecha campaign. It looks and behaves like a research-division database: you build and load frames, track damage, heat and ammo on a paper doll, roll attacks, and run **multiplayer sorties** where the host and pilots share one live table.

## Where things are

| Folder | What's in it |
|---|---|
| [`versions/`](versions/) | Every build of the app. Start here. |
| [`versions/v5.0-stable/`](versions/v5.0-stable/) | **Stable v5.0**: the full app (terminal + server). |
| [`catalogue/`](catalogue/) | Catalogue items (frames, weapons, systems) and the notes behind them. |
| [`ui/`](ui/) | UI design notes and proposals (not builds; those are in versions/). |
| [`devtools/`](devtools/) | The team's build/patch scripts and automated checks. |

## Which version should I use?

- **Stable:** [`versions/v5.0-stable/`](versions/v5.0-stable/)
- **Latest:** the highest number in [`versions/`](versions/). Newer builds contain only the files that changed (`terminal.html`, `mp-bridge.js`, `forge-hook.js`, `server/room.server.ts`) and are dropped into a copy of v5.0-stable. See [`versions/README.md`](versions/README.md).

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
