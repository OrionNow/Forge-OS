# FORGE-OS 5.5.3

> **DEPLOY FIRST: apply `migrations/0003_forge_member_colors.sql` before deploying this build.**
> The server's member query selects `color` (`room.server.ts` `loadMembers`). If migration 0003 is skipped, every **enter** and **poll** fails and nobody can join the table. `npm run build` applies it when `DATABASE_URL` is set; local PGLite applies it at startup. On any other database, run the SQL by hand first.

> **Known security issue, fixed in 5.5.4:** 5.5.3 was branched from 5.5.2 *before* the Misaki review fixes, so it drops the server-side roll-card ownership check. Any seat can post a roll line under another pilot's unit. Use **5.5.4** for live tables.

Visual and usability update based on 5.5.2 (pre-review), plus multiplayer username changes. This changelog was rewritten after testing to describe the code as it actually ships.

## Interface (terminal.html, terminal-ui.css, terminal-ui.js)

- Refined panel surfaces, section hierarchy, selected rows/tabs and focus outlines, keeping the square-edged terminal style. Welcome crest on the access screen.
- Builder and access-router choices support Tab, Enter and Space; focus and caret are preserved through redraws.
- Encounters with more than three sheets show a name/owner search field; Escape clears it.
- At widths of 1700px and above the two-column layout is centred and capped at 1440px.
- Narrow layouts: at 900px and below the workspace, loadout and console stack vertically; at phone widths (560px and below) paper-doll labels become target tiles under the diagram. (Removed again in 5.5.4.)
- The main defense button keeps its right-click menu. No extra ▾ menu buttons, TARGET/ACTIONS selector, SHEET ACTIONS button, DISPLAY toolbar, HELP panel or WORKSPACE/LOADOUT/CONSOLE switcher ship in this build (an earlier draft had them; they were removed before release).
- Release and exported manifest version are 5.5.3.
- `terminal-ui.css` and `terminal-ui.js` are the editable sources and are embedded into `terminal.html` (so standalone catalogue HTML exports keep the UI). Regenerate with `node tools/embed-v553-ui.cjs <release-dir>`.

## Multiplayer bridge and server (mp-bridge.js, room.server.ts) — these DID change

- **Rename:** new `rename` server operation. The host can rename any seat; a pilot can rename only their own. Right-click (or Shift+F10) a name in the user list for Change username / Change color. Names stay unique (case-insensitive); `USER UNKNOWN` is refused.
- **Join:** the room revision and the username claim happen in one statement, so two seats joining at once cannot take the same name; busy retries return 409 "link busy".
- **Resume / poll:** a seat token now identifies the user on its own. Resume ignores the typed callsign and poll no longer renames the seat. The 5.5.2 refusal of a token presented under another callsign (403) was removed.
- **Saved-name auto-connect:** choosing LIVE DATA INTERCEPT with a remembered username connects straight away without showing the callsign form. A name that is unavailable (409) is forgotten and the form is shown.
- **RESET-LOCAL reconnect:** `/MP RESET-LOCAL CONFIRM` releases the seat and immediately reconnects with the saved username instead of returning to the callsign prompt.
- **Chat from any section:** a linked user can send table chat from the builder and other views without publishing the local sheet.
- **Roster:** long location text in the user list scrolls (crawls) on one line.
- **Removed (regression, fixed in 5.5.4):** the server check that dropped roll cards on a unit the sender does not own; the "(via SEAT)" roll label; naming the sender on roll cards with no unit; the solo LOCAL fallback (solo rolls read "Unknown").

## Known issues (all addressed in 5.5.4 except where noted)

- Roll-line spoofing possible (see above).
- On a shared browser, LIVE DATA INTERCEPT resumes the previous user's saved seat; there is no "use another name" path except renaming or clearing site data. (Not changed in 5.5.4: login stays tied to the browser by the Overseer's decision.)
- `/MP` help text still says RESET-LOCAL lets you "re-enter your callsign".

## Packaging

- This folder is a patch overlay onto the complete project; `host/` holds `package.json`, `package-lock.json` (version 5.5.3) and `src/routes/index.tsx` (iframe cache key 5.5.3).
- The complete runnable archive is distributed separately as `forge-os-v5.5.3.zip` (rebuilt from these final files; the earlier archive contained an older revision).
- No new migration; `0003` is inherited from 5.5.2.

## Verification (independent re-test)

Solo 114/119 (2 failures = solo LOCAL regression, 3 = intended version/header changes), BRITTLE 13/13, two-seat 58/59 after adapting for the RESET-LOCAL reconnect, sync 11/11 (adapted), API 18 + 9/11 + 10 + 7, three-seat spoof 9/12 (spoof accepted), the branch's own UI checks 24/25 (a timing race in the test) and workflow checks 19/19.
