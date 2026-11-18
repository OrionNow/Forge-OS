# FORGE-OS 5.5.6

> **DEPLOY FIRST: apply `migrations/0003_forge_member_colors.sql` before deploying.** Without it every enter and poll fails (the member query selects `color`).

5.5.6 is 5.5.5 plus the **LOADOUT TERMINAL** catalogue: category tabs taken from the catalogue's own categories, subtype filter chips, one search box across every category, compact grid cards and a right-hand detail pane with [+] ADD TO MECH. See the [5.5.6 changelog](CHANGELOG-v5.5.6.md).

5.5.5 is 5.5.4 plus an aspect-ratio layout. Below 17:10 there are two columns (the console sits under the loadout). At 17:10 or wider, and at least 1280 px wide, the OPERATOR CONSOLE becomes a full-height third column with the user list as a strip across its top. Between 963 and 1103 px the layout is zoomed to fit; 963 px is a hard floor, and narrower windows scroll. See the [changelog](CHANGELOG-v5.5.5.md).

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
| `server/room.server.ts` | `src/lib/forge/room.server.ts` (keep the `server/` mirror too if you maintain it) |
| `migrations/0003_forge_member_colors.sql` | `migrations/0003_forge_member_colors.sql` |

Then `npm install` and `npm run dev` (Node.js 22.12+) and open http://localhost:8080. `npm run build` applies migrations when `DATABASE_URL` is set; the local PGLite fallback applies them at startup and resets when the server stops. A complete runnable archive is distributed separately as `forge-os-v5.5.6.zip`.

## Controls

- **Build a sheet:** GUEST, choose a frame and required systems, then confirm. Tab, Enter and Space work on builder choices.
- **Catalogue (LOADOUT TERMINAL):** pick a category tab, narrow it with a subtype chip, or type in SEARCH (press `/`) to search every category at once. Click a card to read its full record in the detail pane, then [+] ADD TO MECH. Enter or double-click on a card adds it directly; typing a card's number still works.
- **Run an encounter:** IMPERIAL INTELLIGENCE for solo, LIVE DATA INTERCEPT for the shared table. A remembered username connects directly.
- **Resolve damage:** select the component on the paper doll, enter DMG and DIV, APPLY. Right-click a component for repair/plating; UNDO uses the reversible history.
- **Alternatives:** right-click (or Shift+F10 / Menu key) on maneuver, defense, Evaluate, Rapid and DMG controls.
- **Sheets:** with more than three sheets, a name/owner search appears; Escape clears it.
- **Users:** right-click a name in the user list to change username or color (host: anyone; pilot: self).
- **Console:** commands start with `/`; ordinary text is table chat, usable from any section while linked.

## Editing the UI

`terminal-ui.css` and `terminal-ui.js` are embedded into `terminal.html`. After editing, run `node tools/embed-v553-ui.cjs <release-dir>` and copy the regenerated `terminal.html` into `public/`.
