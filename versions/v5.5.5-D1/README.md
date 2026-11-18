# FORGE-OS 5.5.5-D1 (desktop UI)

> **DEPLOY FIRST: apply `migrations/0003_forge_member_colors.sql` before deploying.** Without it every enter and poll fails (the member query selects `color`).

5.5.5-D1 is 5.5.5 with a desktop-style interface. Every function is its own window, every unit is live at once in tabbed unit windows, and the console is a window toggled from the taskbar. Rules, multiplayer, security and colour behaviour are unchanged from 5.5.5. See the [changelog](CHANGELOG-v5.5.5-D1.md). `?classic` (or SETTINGS > CLASSIC LAYOUT) gives the exact 5.5.5 layout.

## Installing the overlay

This folder is a **patch overlay**. Copy a complete project (for example [`v5.0-stable/`](../v5.0-stable/)) and copy these files into it:

| File in this folder | Destination in the complete project |
|---|---|
| `host/package.json` | `package.json` |
| `host/package-lock.json` | `package-lock.json` |
| `host/index.tsx` | `src/routes/index.tsx` |
| `terminal.html` | `public/terminal.html` |
| `terminal-ui.css` | `public/terminal-ui.css` |
| `terminal-ui.js` | `public/terminal-ui.js` |
| `forge-hook.js` | `public/forge-hook.js` |
| `mp-bridge.js` | `public/mp-bridge.js` |
| `desk.js` | `public/desk.js` (the desktop; `terminal.html` loads it) |
| `server/room.server.ts` | `src/lib/forge/room.server.ts` (keep the `server/` mirror too if you maintain it) |
| `migrations/0003_forge_member_colors.sql` | `migrations/0003_forge_member_colors.sql` |

Then `npm install` and `npm run dev` (Node.js 22.12+) and open http://localhost:8080. `npm run build` applies migrations when `DATABASE_URL` is set; the local PGLite fallback applies them at startup and resets when the server stops. A complete runnable archive is distributed separately as `forge-os-v5.5.5-D1.zip`.

## Controls

- **Login screen:** shown on every connect (page load and every logout). Enter a callsign and colour (pre-filled with the last ones), then LOGIN for the live table or WORK OFFLINE for solo. LAYOUT switches between DESKTOP and CLASSIC.
- **Desktop icons:** down the left, 戦 ENCOUNTER, 機 UNITS (new unit group window), 造 ASSEMBLY and 整 SERVICE. Down the top right, 設 SETTINGS, 監 OVERSEER (key), 典 CATALOGUE (key) and 録 CHANGELOG. ASSEMBLY, SERVICE, CATALOGUE and OVERSEER open as workstation windows without touching the encounter. Each has a status strip with its last message and any fault; RELOAD is one click on a fault and asks to confirm otherwise.
- **Windows:** drag the title bar; resize from any edge or corner; _ minimises to the taskbar, □ maximises, × closes. Click a taskbar tab to raise, minimise or restore.
- **Unit windows:** each unit is a tab. A unit first opens in the window for its tab colour. Drag a tab to another unit window, or onto the desktop for a window of its own. Every unit stays live. The filled ▶ tab is the acting unit, which console commands use, and the status bar shows it as ACTING. Each section has [-] to collapse in place and ⇱ to pop out into its own window; the popped window's ⇲ docks it back. Skill inputs sit collapsed inside ROLLS // SKILLS // HEAT; click SKILL INPUTS to open them. The title bar shows the pilot next to the mech name. The ▣ LG / ▭ SM button left of the status badge cycles LARGE (full sheet, 1120 wide so the doll is side by side) and SMALL (doll-focused, 620 wide). Right-click an ENCOUNTER tab and choose "Open sheet window (LARGE)".
- **Unit groups:** the ▾ TAB COLOUR picker sits at the top of the right-hand mini-doll sidebar, above the cards. Each card shows a mini paper doll, the mech name, the pilot name (same colour rules as the unit window; omitted if there is no pilot) and condition. Click a card to show its paper doll and impact resolution in the SELECTED UNIT area beside them. [OPEN ↗] or a double-click opens its unit tab (SMALL, 620 wide, so the doll is side by side).
- **Console:** the ▤ button at the far right of the taskbar toggles the console window. If the console is covered, the button brings it to the front. Move and resize it like any window; × hides it.
- **Damage, rolls, sheets, users:** as in 5.5.5, inside the unit windows and the console.

## Editing the UI

`terminal-ui.css` and `terminal-ui.js` are embedded into `terminal.html`. After editing, run `node tools/embed-v553-ui.cjs <release-dir>` and copy the regenerated `terminal.html` into `public/`.
