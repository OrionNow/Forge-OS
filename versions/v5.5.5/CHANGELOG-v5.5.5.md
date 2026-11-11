# FORGE-OS 5.5.5

> **DEPLOY FIRST: apply `migrations/0003_forge_member_colors.sql` before deploying this build.**
> The server's member query selects `color` (`room.server.ts` `loadMembers`). If migration 0003 is skipped, every **enter** and **poll** fails and nobody can join the table. `npm run build` applies it when `DATABASE_URL` is set; local PGLite applies it at startup. On any other database, run the SQL by hand first.

5.5.4 plus a responsive layout. Layout only; no rules, multiplayer or server changes. Everything else is unchanged from 5.5.4: gold numbers with green/red labels, no phone layouts, rename, auto-connect, crawl text and crest, the spoofing fixes and the "(via SEAT)" label, right-click DMG.

## Layout

The widths come from the Overseer's two reference windows: 1103 px (minimum) and 1298 px (maximum). They are CSS pixels at device-pixel-ratio 1. Rendering 5.5.4 at 1103×896 and 1298×897 gives the same layout as the screenshots (41 px header, 529 px / 626 px columns).

| Window width | Layout |
|---|---|
| below 1103 px | The whole UI is laid out at 1103 px and scaled down to fit. It uses CSS `zoom` on `#wrap` (set by `terminal-ui.js`), not `transform`, so clicks, drag, scrolling, tooltips and the right-click menus keep true coordinates. While scaled, the stylesheet's width/height media queries are evaluated against the virtual 1103 px window, so the layout really is the 1103 px layout. |
| 1103–1298 px | Two columns that stretch, as in 5.5.4. |
| 1299 px and up | The sheet and loadout columns stop growing at 626 px each, their width at 1298 px. The **OPERATOR CONSOLE** (with the user list) becomes a third column on the right that takes the rest of the width (at least 240 px). The character sheet column (telemetry, paper doll, impact resolution, skills) runs full page height. The loadout manifest takes the height the console gave up. Between 1299 px and about 1550 px the console's 240 px minimum is met by shrinking the other two columns (to about 500 px each at 1299 px). |

The old ≥1700 px rule that capped the page at 1440 px is replaced by the three-column layout. Exported sheets do not carry the scaling class.

Files: `terminal-ui.css`, `terminal-ui.js`, and `terminal.html` (embedded copy regenerated with `tools/embed-v553-ui.cjs`; version, title, header link and changelog entry updated). Version string 5.5.5 (APP_VERSION, header, exported manifests, host package and iframe cache key `terminal.html?v=5.5.5`). `mp-bridge.js`, `forge-hook.js`, `server/room.server.ts` and migration 0003 are the same as in 5.5.4.

## Unchanged by decision

Negative limb HP; login tied to the browser; Retreat during Move+Atk; Rapid Strike + Move+Atk stacking; Rapid Strike single roll; Evaluate +2/+4/+6; no All-Out Attack weapon exclusions; right-click DMG (available to everyone); ACC on ranged Move+Atk. On hold: the RoF bonus table/cap itself.

## Tests (each on a freshly started dev server)

| Suite | Result |
|---|---|
| Headless page load, console errors (`check-v555-pageload.js`) | 4/4 |
| v5.5.4 fix checks (`check-v555-fixes.js`) | 12/12 |
| Solo (`check-v555-solo.js`) | 119/119 |
| BRITTLE (`check-brittle.js`) | 13/13 |
| Two-seat (`check-v555-2seat.js`) | 59/59 (one run aborted early on a seat-setup timing race; the rerun on a fresh server passed) |
| Two-seat sync (`check-v555-sync.js`) | 11/11 |
| Misaki MP (`check-v552-misaki-mp.js`) | 8/8 |
| Three-seat spoof (`server-api-test-v552-misaki.mjs`) | 12/12 |
| API: base / v52 / v53 / v55 | 18/18, 9/11 (the 2 are the intended 5.5.3 rename/auto-connect behaviour, same as 5.5.4), 10/10, 7/7 |
| Branch UI (`check-v555-ui.cjs`) / workflows (`check-v555-workflows.cjs`) | 25/25, 9/9 |
| Layout and screenshots (`check-v555-layout.js`, solo and two-seat MP at 640, 900, 1200, 1700 and 2200 px) | 166/166 |

Test adaptations (intended changes only): the version is 5.5.5 in the v5.5.5 copies. `check-v555-ui.cjs` waits 150 ms after each viewport resize before measuring the login width, because below 1103 px the scale is applied on the resize event. `check-v555-layout.js` is new.
