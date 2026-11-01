# FORGE-OS v5.4: Overseer feedback pass

Built on v5.3.1. Fixes and polish only. Desktop only. AA contrast kept.
Files: `terminal.html` (APP_VERSION 5.4.0) and `mp-bridge.js` (v20). The server is unchanged.

## Changes
1. **Full owner names on tabs.** Inactive sheet tabs show the owner's full name instead of one letter. Closed tabs read "Closed".
2. **DMG per shot.** The collapsed part of a roll line lists each shot, e.g. `DMG 7, 9, 4`. Very long lists are cut at 62 characters and end in `… (n)`.
3. **HEAT +2 checkbox** beside SKILL MOD (`S.pilot.hx`). It adds +2 to every roll and to TOTAL MOD. It shows as `HEAT +2` in the SL breakdown and the roll label. The same checkbox is mirrored in the targeter panel.
4. **All-Out Defense removed.** The button, menu, rule effects (+2 / Double Defense / no-attack refusal), CSS and the AoA/AoD exclusion are all gone. Old sheets that still carry `aod`/`aodl` load cleanly. Those values are ignored and not exported.
5. **Defense button label** is just the type: `[DODGE ▾]`, `[PARRY ▾]`, `[TURN BLOW ▾]` or `[BLOCK ▾]`. The right-click menu is unchanged.
6. **Targeter as a dropdown.** It is no longer its own section. It opens as a panel directly under the selected weapon's row: `└ TARGETER // weapon`, TOTAL MOD summary, RoF, mods, HEAT and AoA.
7. **Gold selected-component box removed** from above IMPACT RESOLUTION. [REPAIR] / [REPAIR ALL] moved into the IMPACT RESOLUTION row.
8. **Paper-doll shield row** uses the tab colour theme, like the other zones.
9. **[UNDO] moved** to the left of [SAVE STATE], for solo and table. There is now 14px between the doll and that row, so it no longer overlaps the crew-cabin stats when there is no shield.
10. **Tab owner editing (host).** Clicking the owner text no longer opens the pilot dropdown; that is now only under right-click > Assign pilot…. For the host, the click opens an inline text box. Enter saves and Esc or blur cancels. Input is escaped and capped at 28 characters.
    - A seated callsign assigns that seat.
    - Any other name creates a named owner, stored in sheet data `own` and synced to every seat. It is auto-assigned when that callsign joins.
    - An empty name closes the unit.
11. **Frame ID only.** Frame Model is gone from the ID tab, statblock, tab titles, roll lines and the compiled filename. Old sheets and manifests get Frame ID = `ID + ' ' + Model`, trimmed and with empty/PENDING parts skipped.
12. **Roster toggle in the top bar**, left of CORE EMPIRE (`[USERS n]` / `[USERS –]`). It is hidden solo. The old button in the roster box is removed, and a collapsed roster hides completely. The top bar stays one line at 1280px.
13. **Console filter** `[ALL LINES]` / `[DATA ONLY]` in the console header. DATA ONLY hides flavour: transition/boot sequence lines, progress bars and `[SYS]` ambient lines. It keeps rolls, results, damage, chat, errors and command output. The setting persists in `forge_ui_v1` (`lf`).
14. **Catalogue tags.** The [TWO-HANDED] / [SHOULDER] tags in the catalogue (list and editor) use the header text colour (`--cyan`). They are cyan by default and follow the active theme.

## Interpretation calls
- There is one Heat state, shared by the SKILL MOD checkbox and the targeter checkbox.
- The repair buttons survive the removal of the gold box by moving into IMPACT RESOLUTION.
- "Flavour" means typed sequence lines, progress bars and `[SYS]` heartbeat lines. Everything else counts as load-bearing.
- Owner names live in the sheet data, so no server change was needed.

## Tests
New: `devtools/check-v54.js`, `check-v54-mp.js`, `check-v54-mp-sync.js`. Updated for the removed UI (AoD, targeter section, gold box, Frame Model, `PB-7 KAGE` lookups), with short checks per item.
Build scripts: `devtools/patch_v54.py` (terminal) and `devtools/patch_v54_bridge.py` (bridge).
