# FORGE-OS 5.5.4

> **DEPLOY FIRST: apply `migrations/0003_forge_member_colors.sql` before deploying this build.**
> The server's member query selects `color` (`room.server.ts` `loadMembers`). If migration 0003 is skipped, every **enter** and **poll** fails and nobody can join the table. `npm run build` applies it when `DATABASE_URL` is set; local PGLite applies it at startup. On any other database, run the SQL by hand first.

5.5.3 plus the Overseer-approved fixes. Fixes only; no new features. Everything from 5.5.3 that is not listed here is unchanged (including rename, saved-name auto-connect, the crawling roster text and the welcome crest).

## Fixes

1. **Roll-line spoofing (restored v5.5.2 fixes).**
   - Server: in the `msg.logs` loop a roll card on a unit is dropped unless the sender owns the unit or is the host (`server/room.server.ts`).
   - Client: roll lines name the unit owner and add **"(via SEAT)"** when another seat sent the roll; host rolls on unassigned units stay unlabelled. A roll card with no unit names the sending seat, not the viewer's own sheet. With no owner name, multiplayer falls back to the sender's callsign (`mp-bridge.js` `rollIdentity` / `rollOwner`).
   - Solo rolls with no owner name read **LOCAL** (closed frames still read Unknown). The roll author name cap is now 80 characters so "(via …)" is not cut off (`terminal.html` `rcWho`, `rcRemote`).
2. **DEPLOY FIRST** note for migration 0003 (above, and in the README).
3. **Shields with two DR numbers** (e.g. `DR:160/60`) use the **first** number. Code only; catalogue rows unchanged.
4. **Vent (Overseer ruling):** failure vents **VENT**; success vents **VENT + 1 + degrees of success**. A higher VENT vents more. The old dead vent function was deleted; the button tooltip and the catalogue help text match.
5. **Phone/narrow layouts removed** (the 1100px, 900px and 560px blocks in `terminal-ui.css`, and the embedded copy in `terminal.html`, regenerated with `tools/embed-v553-ui.cjs`). The login/welcome-crest sizing rules are kept. Two small narrow-screen rules inherited from 5.5.2's base stylesheet are untouched.
6. **DoS and damage numbers are always gold** on roll lines (`+N DoS` and the numbers after `DMG`).
7. **Parry degree step:** Parry used the weapon's RCL as its degree step; it now uses the normal step of 1 (success and failure), like Block.
8. **Heat-zone DR penalty and shields:** confirmed the danger/redline DR multiplier applies only to frame locations, never to shield DR. No code change needed; covered by a new test.
9. **A LOST frame cannot attack.** ATTACK is refused (no ammo spent) while the frame status is LOST (Core/Chassis or Crew Cabin at 0 HP or below).
10. **RoF bonus uses rounds actually fired.** Same FORGE-OS table (+1 at 3–4, +2 at 5–8, …), but computed from the rounds fired rather than the requested RoF, e.g. a magazine with 2 rounds left firing at RoF 5 gets +0, not +2. The attack line notes "N RDS FIRED" when fewer than requested.

Version string 5.5.4 (APP_VERSION, header, exported manifests, host package and iframe cache key).

## Unchanged by decision

Negative limb HP; login tied to the browser; Retreat during Move+Atk; Rapid Strike + Move+Atk stacking; Rapid Strike single roll; Evaluate +2/+4/+6; no All-Out Attack weapon exclusions; right-click DMG (available to everyone); ACC on ranged Move+Atk. On hold: the RoF bonus table/cap itself.

## Known issues carried from 5.5.3

- `/MP` help text still says RESET-LOCAL lets you "re-enter your callsign" (it reconnects the saved name).

## Changed files

`terminal.html`, `terminal-ui.css`, `terminal-ui.js` (header comment), `mp-bridge.js`, `server/room.server.ts`, `host/package.json`, `host/package-lock.json`, `host/index.tsx`, `CHANGELOG-v5.5.4.md`, `README.md`.

## Tests

Each suite ran on its own freshly started dev server (Chromium, local PGLite, migrations 0002 + 0003).

| Suite | Result |
|---|---|
| Headless page load (1600px, 390px, host `/`), console errors | 4/4, no errors |
| New 5.5.4 fix checks (`check-v554-fixes.js`: items 3, 4, 6, 7, 8, 9, 10) | 10/10 |
| Solo (`check-v554-solo.js`) | 119/119 |
| BRITTLE | 13/13 |
| Two-seat (`check-v554-2seat.js`) | 59/59 |
| Two-seat sync (`check-v554-sync.js`) | 11/11 |
| v552-misaki two-seat spoof / (via SEAT) / LOCAL check | 8/8 |
| Three-seat spoof API | 12/12 |
| API base / v53 / v55 | 18/18, 10/10, 7/7 |
| API v52 | 9/11 (both failures are the intended 5.5.3 resume/poll-rename change: resume no longer refuses another callsign, and the test's poll-rename setup no longer renames) |
| Branch UI checks (`check-v554-ui.cjs`) | 25/25 |
| Branch workflow checks (`check-v554-workflows.cjs`) | 9/9 (390/320px phone checks retired with the phone layouts) |
| Unadapted `check-v552-misaki.js` (reference) | 114/119: the 5 failures are intended (version 5.5.4, new vent ruling ×2, 41px 5.5.3 header ×2) |

Adapted for intended changes only: version 5.5.4; vent expectations (VENT + 1 + DoS); header height 41px from the 5.5.3 restyle; RESET-LOCAL reconnects the saved username (5.5.3); phone-width checks removed; a 2.5s wait before the force-damage count in the branch UI check (test race).
