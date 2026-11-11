# FORGE-OS v5.5.1-D2: desktop M2 "Modular Cockpit"

Desktop branch build on v5.5.1-D1, implementing Hikari's approved M2 spec (ui/proposals/desktop-m2/spec-desktop-m2.md).

**Status: shipped UNTESTED at the Overseer's request.** The automated suites (v5.5.1 regression, check-desktop-m1, check-desktop-d2) were not run for this build. Only syntax checks (node --check on desk.js and mp-bridge.js) were done. Use [CLASSIC] in the header to fall back to the exact v5.5.1 layout if anything misbehaves.

## Patch: classic by default
Fresh installs and first-time D2 layouts now open in **classic** view (`[DESK]` in the header turns the desktop on). An existing saved preference is kept. D1 layouts only stay on the desktop if that D1 session had desktop explicitly on.

## What's in it
- **Several paper dolls:** [+ DOLL] (Ctrl+Alt+N) opens one window per mech, each with its own accent colour. Exactly one doll is LIVE. The others are read-only MIRRORs or NOT YET VIEWED placeholders, and become live only through ◆ MAKE LIVE. The sheet tab strip sits at the top of the live doll window.
- **Bottom taskbar:** replaces the left module bay. It has launchers (+ DOLL, SHEET, CONSOLE, USERS, PANELS ▴) and a chip for each window.
- **Split windows:** panels (doll, bus, impact, skills, rolls, armament, frame) can be torn off and re-docked. PANELS ▴ opens any panel type as its own window.
- **USERS window:** compact, icon-rail and full widths, cycled with ◧.
- **Layout slots 1-5:** SAVE and LOAD on the taskbar, double-click to load, Ctrl+Alt+1..5 to load and Ctrl+Alt+Shift+1..5 to save. DEF resets to the default layout and turns into UNDO for 8 s.
- **Pin (⌖) and SNAP:** pinned windows are locked in place and kept on top. SNAP aligns windows to an 8px grid and to window edges while dragging.
- **Presets:** def, trio and table.
- The layout is saved in forge_ui_v1 under UI.desk2. D1's layout is migrated once.

## mp-bridge.js (Overseer-approved, display only)
- paintFriends() can place the roster in the USERS window (Desk.rosterHost()).
- When desk.js hosts the sheet tab strip (Desk.ownsBar()), the extra top margin is dropped.
- No sync traffic changes.

## Known gaps
- Untested. See the status note above.
- Screenshots in shots/ are from the earlier, partial build (1366x768 def, trio and table presets).
