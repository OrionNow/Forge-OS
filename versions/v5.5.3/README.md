# FORGE-OS 5.5.3

5.5.3 refines the encounter tracker and frame-sheet builder from 5.5.2. It keeps the Consolas terminal, existing theme and status colors, paper doll, compact telemetry and GURPS calculations. The changes focus on finding actions, reading the sheet and using smaller screens.

The repository folder is a **patch overlay**. [Download the complete 5.5.3 archive](FORGE-OS-v5.5.3.zip) to get the application and server together; unzip that package, run `npm install`, then `npm run dev` with Node.js 22.12 or later, and open **http://localhost:8080**. The [base setup guide](../v5.0-stable/SETUP.txt) explains LAN and remote table access.

## Installing the repository overlay

Make a copy of the complete [`v5.0-stable/`](../v5.0-stable/) project, then copy these files from this folder into it. These files carry forward the 5.5.2 server, bridge and migration, so previous patch folders do not need to be applied first.

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
| `server/room.server.ts` | `src/lib/forge/room.server.ts` |
| `migrations/0003_forge_member_colors.sql` | `migrations/0003_forge_member_colors.sql` |

Keep the `server/room.server.ts` mirror as well if your working project maintains that copy. The running application uses the file under `src/lib/forge/`.

Run `npm install` and `npm run dev` in the complete project. For a production build, use `npm run build`. With `DATABASE_URL` configured, that build command applies database migrations; the local PGLite fallback applies them on startup. Migration `0003` is inherited from 5.5.2 and adds persistent seat colors; no new database schema is introduced in 5.5.3.

The default local database is in memory and resets when the server stops. A persistent PostgreSQL database retains table data and seat colors across application restarts. Existing per-callsign browser color backups remain supported.

## Controls and workflow

- **Build a sheet:** choose GUEST, select a frame and its required systems, then confirm. Browse Armament, Defense and Utility; select a record to install it or INFO to inspect it. Set the designation and save a compiled `.txt` manifest.
- **Run an encounter:** choose IMPERIAL INTELLIGENCE for solo tracking or LIVE DATA INTERCEPT for a shared table. Common skill rolls and active-defense controls appear above the less frequent skill-input setup.
- **Resolve damage:** select the component on the paper doll or in the TARGET list. Enter DMG and DIV, review the armor calculation, then APPLY. ACTIONS opens repair and plating options for that component. UNDO uses the existing reversible-action history.
- **Open alternatives:** the small ▾ buttons expose equipment, maneuver, defense, Evaluate, Rapid and damage-roll menus. Right-click and Shift+F10/Menu-key access remain available.
- **Manage sheets:** SHEET ACTIONS opens the current tab's menu. Encounters with more than three sheets also show a name/owner search. Escape clears that search.
- **Choose display settings:** DISPLAY offers Compact or Roomy controls and Terminal or Reduced effects. The choices are remembered in this browser; system reduced-motion preferences still apply.
- **Use a smaller screen:** WORKSPACE, LOADOUT and CONSOLE buttons switch between panels at widths up to 900px. At phone widths, paper-doll component labels become readable target tiles below the same interactive diagram.
- **Use the keyboard:** Tab reaches builder choices and controls; Enter or Space activates a focused choice. HELP explains the current screen. Console commands start with `/`; ordinary text is table chat.

Shared-table ownership and viewing restrictions continue to use the existing multiplayer guards. A visible menu button does not grant additional authority.

## Editing the UI and exporting a catalogue

`terminal-ui.css` and `terminal-ui.js` are the editable UI sources. Their release copies are embedded into `terminal.html`, so the catalogue's standalone HTML package export retains the 5.5.3 interface without requiring adjacent UI files.

After changing those sources, regenerate the embedded copy from the repository root:

```sh
node devtools/embed-v553-ui.cjs
```

The optional argument selects another release directory containing all three files. Copy the regenerated `terminal.html` into the complete project's `public/` folder before running or distributing it. A standalone catalogue HTML export is a solo terminal; shared tables still require the server, hook and bridge.

See the [changelog](CHANGELOG-v5.5.3.md) for the verification record and inherited test limitations.
