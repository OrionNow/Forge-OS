# FORGE-OS 5.5.3

> **DEPLOY FIRST: apply `migrations/0003_forge_member_colors.sql` before deploying.** Without it every enter and poll fails (the member query selects `color`).

> **Use 5.5.4 for live tables:** 5.5.3 is missing the server-side roll ownership check (roll-line spoofing). See the [changelog](CHANGELOG-v5.5.3.md).

5.5.3 refines the terminal's look and keyboard access, adds a sheet search for larger encounters, and changes multiplayer usernames (rename, saved-name auto-connect). See the changelog for the exact list, including what was removed before release.

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

Then `npm install` and `npm run dev` (Node.js 22.12+) and open http://localhost:8080. `npm run build` applies migrations when `DATABASE_URL` is set; the local PGLite fallback applies them at startup and resets when the server stops. A complete runnable archive is distributed separately as `forge-os-v5.5.3.zip`.

## Controls

- **Build a sheet:** GUEST, choose a frame and required systems, then confirm. Tab, Enter and Space work on builder choices.
- **Run an encounter:** IMPERIAL INTELLIGENCE for solo, LIVE DATA INTERCEPT for the shared table. A remembered username connects directly.
- **Resolve damage:** select the component on the paper doll, enter DMG and DIV, APPLY. Right-click a component for repair/plating; UNDO uses the reversible history.
- **Alternatives:** right-click (or Shift+F10 / Menu key) on maneuver, defense, Evaluate, Rapid and DMG controls.
- **Sheets:** with more than three sheets, a name/owner search appears; Escape clears it.
- **Users:** right-click a name in the user list to change username or color (host: anyone; pilot: self).
- **Console:** commands start with `/`; ordinary text is table chat, usable from any section while linked.

## Editing the UI

`terminal-ui.css` and `terminal-ui.js` are embedded into `terminal.html`. After editing, run `node tools/embed-v553-ui.cjs <release-dir>` and copy the regenerated `terminal.html` into `public/`.
