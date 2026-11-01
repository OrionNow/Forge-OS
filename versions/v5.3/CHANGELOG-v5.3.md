# FORGE-OS 5.3.0 (basic pass, built on 5.2.1)

Files: terminal.html (v5.3.0), mp-bridge.js (v18), forge-hook.js (unchanged), server/room.server.ts (one optional field on console lines).
New UI is marked **[UI]**.

## Reverts / removals
- DONE: The font is back to the original Consolas stack and sizes. The JetBrains Mono web font and the fonts/ folder are gone.
- DONE: The HUD sortie header is back to the compact one-line readout. The BRITTLE and AOA tags stay. At 1280px the top bar fits on one line: flex nowrap, the brand truncates with an ellipsis, and the theme label is shorter.
- DONE: The full-health paper doll uses the theme color again, slightly desaturated (`--c-full`), so it still looks different from the ok, dmg and crit colors.
- DONE: The RAD tracker UI (the pilot rads line and buttons) is removed. A stored `pilot.rad` still loads and is kept, but it isn't shown.

## Items / weapons [UI]
- DONE: Left-clicking an item no longer opens its catalogue entry. Right-click (or Shift+F10 / the ContextMenu key) opens a menu with Info and the hand or station choices. The hand dropdown is gone, and the row shows a read-only mount tag. The menu reuses the 5.2 tab context menu.
- DONE: Left-clicking a weapon (or pressing Enter on its row) makes it the active weapon. The targeter title shows `TARGETER // <weapon>`, and the targeter and All-Out Attack are bound to that weapon. Only one weapon is active at a time. This is local UI state, so it isn't synced.
- DONE (RoF cap, Overseer's addendum): The targeter RoF input max is the active weapon's RoF, and melee is 1. The value is clamped on input and when you switch weapons. TOTAL MOD and the ROF bonus use the clamped value, which fixes the +2 readout mismatch.

## All-Out Attack [UI]
- DONE: AoA is now one button in the targeter that toggles it on or off and shows the current type. Right-click it to change the type. The menu lists only types valid for the weapon: melee gets Determined, Double, Feint, Strong and Long; ranged gets Determined, plus Suppression at RoF 5 or more. An invalid type is cleared when you switch weapons. The amber `AOA: ... // NO DEFENSE` header tag stays.

## Defense [UI]
- DONE: The PILOTING box has one DEFENSE button showing the current type (Dodge, Parry, Block or Turn Blow). Right-click changes the type. Parry is listed only with a melee weapon held, and Block only with a held shield. Retreat still gives Dodge its bonus and now also gives +1 to Parry, Block and Turn Blow.
- DONE: The ALL-OUT DEFENSE button works the same way (per B366, minimal). Right-click to pick Increased Dodge, Parry, Block or Turn Blow (+2 to that defense), or Double Defense (noted on the roll). AoD refuses ATK. AoA and AoD cancel each other, and AoA still disables every defense button.

## Console / log (addenda)
- DONE [UI]: Commands run only when they start with `/` (`/help`, `/undo`, `/roll 1 x2`, `/mp whoami`, `/mp reset-local confirm`). Text without `/` is a chat message to everyone at the table, shown in the sender's seat color (mpTint). It travels on the existing log channel as plain data (`rc:{k:'chat',t}`) and is rendered with textContent on every seat, never as HTML. Solo or offline, it echoes locally with a one-time hint. Help text, tab completion and console hints now use `/`.
- DONE [UI]: An attack roll is ONE line: `USER / FRAME · WEAPON · N HITS` (or MISS, with CRIT SUCCESS or CRIT FAIL called out). Click it, or press Enter or Space while it's focused (role=button, aria-expanded), to expand the to-hit roll, the target SL, the margin, the recoil degrees and the hits. The DMG roll folds into the same line (`· DMG n`) and its open details, instead of adding a new line.
- DONE [UI]: Every other skill roll uses the same compact line, `User / Mech / Action / Result`. The result is `+n DoS` or `-n DoF`, with crits called out. A damage roll with no attack line gets its own card.
- DONE: Remote seats get the roll as structured data (`rc:{k:'roll',id,f,a,r,o,d[]}`), not HTML, and can expand it themselves. Every string is escaped with esc() when shown. The server validates the field with zod: id `^rc[a-z0-9]{1,20}$`, at most 40 detail lines of 300 chars, chat at most 500 chars. Older clients still get a plain-text fallback line.
- DONE: Timestamps are no longer shown in the log. They are kept in `data-ts` only.
- DONE: The `[CLEAR]` and `[COPY LOG]` buttons are removed. `/clear` still works, and on a live table it clears the shared log only for the host (unchanged).
- DONE [UI]: The grey available-commands hint text under the input is gone in both console sizes. The command input is a single line, the same height expanded and minimized. `/help` still lists the commands.

## Server
- `room.server.ts`: `logSchema` gains an optional `rc` card (schema above), stored on the roll record as is. The actor is still the server-side callsign. Nothing else changed.

## Tests (all pass)
- Syntax: `node --check` passes for the inline script and mp-bridge.js. Server `tsc --noEmit` passes, and eslint shows only the warning that was already there.
- `devtools/check-v53.js` (solo, 1280px, 67 checks) covers: fonts and HUD reverted; top bar on one line; paper doll color; RAD UI gone; item left-click and right-click; keyboard menu; RoF max, clamp and TOTAL MOD; AoA button, menus and validity; Defense, Retreat and AoD; `/` gating; local chat escaping; `/help`; cards collapsed by default, expanding on click, Enter and Space; DMG folding into the attack line; DoS/DoF and crit fail; no timestamps; CLEAR and COPY gone; no hint text; input row height the same expanded and minimized; plus the 5.2 regressions (Core +0, damage roll count, vent floors, tooltips, tab menu).
- `devtools/check-v53-mp.js` (two seats on a fresh dev server) runs the 5.2.1 cases with `/mp` commands (Bug A, RESET-LOCAL/RESYNC confirm, 413, RoF cap). It adds: a host chat round-trip with `<b>`/`<img onerror>` (literal text, same seat color on both seats); pilot text without `/` arriving at the host as chat; `/mp whoami` running locally and not sent as chat; the host seeing and expanding the pilot's attack card from data; DMG folding into the host's line; a DoS/DoF card for a dodge; no remote timestamps.
- `devtools/check-v53-mp-sync.js` (the 5.2 sync and guard checks with `/mp`), `server-api-test*.mjs` (the v53 file adds checks that chat and cards round-trip and that a bad id or overlong chat is refused) and `check-brittle.js` also pass.
- Screenshots in `shots/`: v53-top-1280, v53-item-menu, v53-aoa-menu, v53-targeter-aoa, v53-defense-piloting, v53-console-cards, v53-mp-console, v53-mp-aoa-tag, v53-sheet-full.
