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
| `@media (min-aspect-ratio:17/10) and (min-width:1280px)` | **Three columns** (reference `v555b-3col-start`): sheet, then loadout, then OPERATOR CONSOLE, all full height. The sheet and loadout columns stop growing at 626 px each. The console takes the rest, at least 300 px. The user list becomes a strip across the top of the console, under its header. |

Why 17:10: the switch comes just before a true 16:9 window (1.778). A maximised 1920×1080 browser window, after the browser's own chrome, is often shorter than 16:9. A 1700×1000 window (1.70) is three columns; 1680×1000 (1.68) is two.

Why 1280 px: it keeps three columns from getting cramped. At 1280 px the console gets its 300 px and the sheet and loadout columns are about 460 px each, the same as the two columns at the floor. Below 1280 px, even a wide aspect ratio (for example 1200×600) stays two columns.

### Telemetry header and skill inputs

- **ISB LINK on line 1.** The ISB LINK status, in every state (LOCAL, LINK OK, OFFLINE · N QUEUED, …), is right-aligned on line 1 of the LIVE SORTIE TELEMETRY header, on the same line as `LIVE SORTIE TELEMETRY // name`. It no longer takes its own row. A long name is cut with an ellipsis and never overlaps it.
- **SKILL INPUTS: 2 rows of 6.** The expanded grid is 6 fields wide instead of 4. Labels are about 18% smaller and the inputs fill their cells. `ROCKET/MISSILE` and `ELECTROMAGNETIC` break at `/` and `ELECTRO-` rather than mid-word. With the stock catalogue there are 11 skills, so the second row has 5.

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
| Branch UI (`check-v555-ui.cjs`) / workflows (`check-v555-workflows.cjs`) | 25/25, 9/9 |
| Layout (`check-v555-layout.js`, solo + two-seat MP at 963×904, 800×700, 1280×960, 1680×1000, 1700×1000, 1920×1080, 2560×1080, one fresh server each) | 231/231 |
| Close-ups (`check-v555-closeup.js`: ISB LINK on line 1 in every state, long name, skills 2×6, at 963×904 and 1920×1080) | 23/23 |

Test adaptations (intended changes only):
- The version is 5.5.5 in the v5.5.5 copies.
- `check-v555-ui.cjs`: below the 963 px floor the login page may be 963 px wide and scroll, and the test waits 150 ms after each resize because the zoom and floor are applied on the resize event.
- `check-v555-layout.js` asserts the new rules: zoom values, the floor and horizontal scroll, two columns below 17:10, three columns at 17:10 or wider and at least 1280 px, the console user strip, and hit-testing.
- `check-v555-closeup.js` is new.
