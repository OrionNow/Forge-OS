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
- **Desktop icons (left):** 戦 ENCOUNTER, 機 UNITS (new unit group window), 装 LOADOUT, 造 ASSEMBLY, 整 SERVICE, 典 CATALOGUE (key), 監 OVERSEER (key), 設 SETTINGS. ASSEMBLY, SERVICE, CATALOGUE and OVERSEER open as workstation windows without touching the encounter. 録 CHANGELOG is at the top right.
- **Windows:** drag the title bar; resize from any edge or corner; _ minimises to the taskbar, □ maximises, × closes. Click a taskbar tab to raise, minimise or restore.
- **Unit windows:** each unit is a tab. A unit first opens in the window for its tab colour. Drag a tab to another unit window, or onto the desktop for a window of its own. Every unit stays live, and the active tab is the acting unit. Each section has [-] to collapse in place and ⇱ to pop out into its own window; the popped window's ⇲ docks it back.
- **Unit groups:** pick a tab colour (▾ TAB COLOUR collapses the picker). The cards show a mini paper doll with name and condition. Click a card to show its paper doll and impact resolution in the SELECTED UNIT area. [OPEN ↗] or a double-click opens its unit tab.
- **Console:** the ▤ button at the far right of the taskbar toggles the console window. Move and resize it like any window; × hides it.
- **Damage, rolls, sheets, users:** as in 5.5.5, inside the unit windows and the console.

## Editing the UI

`terminal-ui.css` and `terminal-ui.js` are embedded into `terminal.html`. After editing, run `node tools/embed-v553-ui.cjs <release-dir>` and copy the regenerated `terminal.html` into `public/`.
