# FORGE-OS 5.5.5

> **DEPLOY FIRST: apply `migrations/0003_forge_member_colors.sql` before deploying this build.**
> The server's member query selects `color` (`room.server.ts` `loadMembers`). If migration 0003 is skipped, every **enter** and **poll** fails and nobody can join the table. `npm run build` applies it when `DATABASE_URL` is set; local PGLite applies it at startup. On any other database, run the SQL by hand first.

5.5.4 plus a responsive layout. Layout only: no rules, multiplayer or server changes. Everything else is the same as 5.5.4: gold numbers with green/red labels, no phone layouts, rename, auto-connect, crawl text and crest, the spoofing fixes and the "(via SEAT)" label, and right-click DMG.

## Layout

The layout depends on the window's aspect ratio, with a hard floor on width. All values are CSS pixels at device-pixel-ratio 1, taken from the Overseer's reference windows.

| Window | Layout |
|---|---|
| Narrower than 963 px (hard floor) | Nothing shrinks or squeezes further. The page stays at its 963 px size (reference `v555b-min-floor`), and the window scrolls horizontally. |
| 963–1103 px | The 1103 px layout is zoomed to fit, from 0.873 at 963 px up to 1.0 at 1103 px. This is how the floor reference was rendered. It uses CSS `zoom`, so clicks, drag, scrolling and the right-click menus keep true coordinates. While zoomed, the stylesheet's width media queries are evaluated against the 1103 px layout. |
| Aspect ratio below 17:10, at or above the floor | **Two columns.** The sheet (telemetry, paper doll, impact resolution, skills) runs full height on the left. The loadout manifest sits above the OPERATOR CONSOLE on the right, with the user list in the console's side panel. This includes the whole band between 4:3 and 16:9. Above 1464 px the two columns keep the existing 1440 px centred maximum. |
| `@media (min-aspect-ratio:17/10) and (min-width:1280px)` | **Three columns** (reference `v555b-3col-start`): sheet, then loadout, then OPERATOR CONSOLE, all full height. Width priority: the sheet and loadout columns grow first, up to 702 px each, their two-column maximum at the 1440 px cap. Only after that does extra width go to the console, which never drops below 300 px and takes everything left over on ultrawide windows. The sheet column never drops below 529 px, its width in the 1103 px layout, so the Engineering button row always fits. Sheet/loadout/console widths: 529/393/300 px at 1280×720, 671/671/300 px at 1700×1000, 702/702/458 px at 1920×1080, and 702/702/1098 px at 2560×1080. The user list becomes a strip across the top of the console, under its header. |

Why 17:10: the switch comes just before a true 16:9 window (1.778). A maximised 1920×1080 browser window, after the browser's own chrome, is often shorter than 16:9. A 1700×1000 window (1.70) is three columns; 1680×1000 (1.68) is two.

Why 1280 px: it keeps three columns from getting cramped. At 1280 px the console gets its 300 px and the sheet and loadout columns are about 460 px each, the same as the two columns at the floor. Below 1280 px, even a wide aspect ratio (for example 1200×600) stays two columns.

### Telemetry header and skill inputs

- **ISB LINK on line 1.** The ISB LINK status, in every state (LOCAL, LINK OK, OFFLINE · N QUEUED, …), is right-aligned on line 1 of the LIVE SORTIE TELEMETRY header, on the same line as `LIVE SORTIE TELEMETRY // name`. It no longer takes its own row. A long name is cut with an ellipsis and never overlaps it.
- **VENT button.** The label is just `[VENT]`. The vent value still applies and the tooltip still shows it ("Failure: vents N (VENT) …"). `[-5] [-1] [+1] [+5] [VENT]` always stay on one row at every width and in both modes. The row does not wrap, and the Engineering box is never narrower than it. The SENSORS / PILOTING box beside it takes the remaining width.
- **SKILL INPUTS: 2 rows of 6.** The expanded grid is 6 fields wide instead of 4. Labels are about 18% smaller and the inputs fill their cells. `ROCKET/MISSILE` and `ELECTROMAGNETIC` break at `/` and `ELECTRO-` rather than mid-word. With the stock catalogue there are 11 skills, so the second row has 5.

### Sheet tabs and owner colours

- **Default outline:** with no custom tab colour, the tab outline is dull grey: `#5f6366`, or `#8a8f93` on the active tab.
- **Unit name:** the name on the tab no longer uses the tab colour. It shows the frame STATUS colour, the same classes the telemetry readout uses, and follows damage live (synced to every seat in multiplayer):

| Status | Colour |
|---|---|
| NOMINAL | `#4cf08a` |
| LIGHT | `#b4ee3c` |
| DEGRADE | `#ffd23a` |
| IMPAIR | `#ff9a1f` |
| SEVERE | `#ff5a2a` |
| CRIT | `#ff2b2b` (bold) |
| LOST | `#8a8a8a` |
| Empty sheet | muted grey |

- **Real connected users:** a seated client's name is always drawn in that user's own member colour, on the tab and in the console (chat and roll author). Owning a unit no longer puts their name in the tab colour.
- **Mech name in the console:** in chat highlights and roll lines, the unit name uses that sheet's tab colour. If the sheet has no custom tab colour, it uses dull grey `#5f6366`, the same as the default tab outline (not the theme accent, and not the paper-doll accent, which is a slightly different hex on some colours). The name on the tab itself still follows the live STATUS colour above.
- **Custom owner (host-created NPC):** a typed owner name on a host-owned NPC sheet inherits that sheet's tab colour, on the tab and in the console. If the tab has no custom colour, the name uses dull grey `#5f6366` (the cyan theme-accent fallback was dropped).
- **Closed, Open, Unknown and LOCAL** stay muted grey (`var(--muted)`). The unassigned `[+]` control stays grey. The user list keeps member colours. A seat that owns no unit still uses its member colour in chat.

The old rule that capped the page at 1440 px from 1700 px up no longer applies in three-column mode. Exported sheets do not carry the zoom.

Files: `terminal-ui.css`, `terminal-ui.js`, and `terminal.html` (embedded copy regenerated with `tools/embed-v553-ui.cjs`; version, title, header link and changelog entry updated). Version string 5.5.5 everywhere: APP_VERSION, header, exported manifests, host package, and the iframe cache key `terminal.html?v=5.5.5`. `mp-bridge.js`, `forge-hook.js`, `server/room.server.ts` and migration 0003 are the same as 5.5.4.

## Unchanged by decision

Negative limb HP; login tied to the browser; Retreat during Move+Atk; Rapid Strike + Move+Atk stacking; Rapid Strike single roll; Evaluate +2/+4/+6; no All-Out Attack weapon exclusions; right-click DMG (available to everyone); ACC on ranged Move+Atk. On hold: the RoF bonus table/cap itself.

## Tests (each on a freshly started dev server)

| Suite | Result |
|---|---|
| Headless page load, console errors (`check-v555-pageload.js`) | 4/4 |
| v5.5.4 fix checks (`check-v555-fixes.js`) | 12/12 |
| Solo (`check-v555-solo.js`) | 119/119 |
| BRITTLE (`check-brittle.js`) | 13/13 |
| Two-seat (`check-v555-2seat.js`) / two-seat sync (`check-v555-sync.js`) | 59/59, 11/11 |
| Misaki MP (`check-v552-misaki-mp.js`) / three-seat spoof (`server-api-test-v552-misaki.mjs`) | 8/8, 12/12 |
| API: base / v52 / v53 / v55 | 18/18, 9/11 (the 2 are the intended 5.5.3 rename/auto-connect behaviour, same as 5.5.4), 10/10, 7/7 |
| Branch UI (`check-v555-ui.cjs`) / workflows (`check-v555-workflows.cjs`) | 25/25 (the "DMG rolls the recorded hit" check reads the log without waiting and fails about one run in three, a timing flake; 25/25 on rerun), 9/9 |
| Layout (`check-v555-layout.js`, 3-column width priority and VENT-row checks, solo + two-seat MP at 963×904, 800×700, 1103×900, 1280×960, 1280×720, 1680×1000, 1700×1000, 1920×1080 and 2560×1080, one fresh server each) | 336/336 |
| Tab / owner colours (`check-v555-tabs.js`: grey default outline; tab name = STATUS colour through all 7 states; real user = member colour on the tab and in chat/roll lines; console mech name = tab colour or dull grey `#5f6366`; host-created custom owner = tab colour, or dull grey when none is set; Closed/Open/Unknown/LOCAL grey; host, pilot and solo views and sync) | 63/63 |
| Close-ups (`check-v555-closeup.js`: ISB LINK on line 1 in every state, long name, skills 2×6, VENT row, at 963×904, 1700×1000 and 1920×1080) | 43/43 |

Test adaptations (intended changes only):
- The version is 5.5.5 in the v5.5.5 copies.
- `check-v555-ui.cjs`: below the 963 px floor the login page may be 963 px wide and scroll, and the test waits 150 ms after each resize because the zoom and floor are applied on the resize event.
- `check-v555-layout.js` asserts the new rules: zoom values, the floor and horizontal scroll, two columns below 17:10, three columns at 17:10 or wider and at least 1280 px, the console user strip, and hit-testing.
- `check-v555-closeup.js` and `check-v555-tabs.js` are new.
- `check-v555-2seat.js`: the host-entered custom owner is expected in the tab colour (was grey) on both seats when a tab colour is set. A real user's chat stays in that user's member colour (the sender colour is still re-read from the same message so the assertion stays stable if a later line is added).
- `check-v555-solo.js`: the VENT button label is checked as `[VENT]`, and the vent value is read from its tooltip.
- `check-v555-layout.js` checks that [VENT] has the same top as [+5] and [-5] at every size, solo and MP. It also checks the 529–702 px sheet column and that sheet and loadout reach 702 px before the console grows.
