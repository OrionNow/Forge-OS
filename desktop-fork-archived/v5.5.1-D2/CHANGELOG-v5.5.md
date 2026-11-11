# FORGE-OS v5.5: Overseer feedback pass 2

Built on v5.4. Fixes and polish only. Desktop only. AA contrast kept.

Files changed: `terminal.html` (APP_VERSION 5.5.0), `mp-bridge.js` (v21) and `server/room.server.ts` (owner field rules).

## Overseer feedback

### Targeter
- **Close by clicking again.** Clicking the selected weapon again closes its targeter dropdown, and clicking it once more reopens it. Only one dropdown is open at a time.
- **Per-weapon settings.** Each weapon keeps its own targeter settings: range, speed, cover, ROLL MOD, target size, ACC, RoF, Heat and All-Out Attack (type and last type). They are stored with the sheet in `tgw` and keyed by weapon name + station. A weapon with no saved settings starts clean.
- **One-line controls.** The ACC button, the targeter [HEAT] button and the All-Out Attack button sit on one line. The All-Out Attack description only shows in the button's hover text.
- **Menu entry removed.** The weapon right-click menu no longer has a targeter entry; the targeter opens only by left-clicking the weapon.

### Heat and modifiers
- **Separate Heat buttons.** The SKILL MOD [HEAT] gives +2 to skills and active defenses: Dodge, Parry, Block and Turn Blow. The targeter [HEAT] gives +2 to attacks only (and shows in TOTAL MOD).
- **Heat as a button.** Each Heat toggle is a `[HEAT]` button. When it's on, the modifier shows in gold next to it (`+2`).
- **Parry/Block modifier.** Parry and Block now use the SKILL MOD box. The targeter ROLL MOD affects attacks only.

### VENT
VENT is the base heat vented per vent action.
- **Fail:** vents VENT.
- **Success:** vents max(VENT + 1, VENT + degrees of success).
- **Degrees of success** are counted in steps of 1 for every reactor.
- The base values are the existing stats:

| Reactor | VENT | Fail | Success | 4 degrees of success |
|---|---|---|---|---|
| Light Fission Cell | 1 | 1 | at least 2 | 5 |
| Standard Fusion Core | 2 | 2 | at least 3 | 6 |
| Heavy Fusion Core | 3 | 3 | at least 4 | 7 |

- The button reads `[VENT n]`. The tooltip and the catalogue legend explain the rule.

### Impact resolution
Effective DR now sits on line 2 together with [REPAIR] / [REPAIR ALL]. The stability damage-threshold indicator is removed.

### Table
- **Tab owner colour.** A custom (host-typed) owner name on a tab is shown in the tab's outline colour.
- **Tab menus.** Players cannot open the right-click menu on units they don't own. The host keeps full access.
- **Viewing other units.** Players can open other units and see their loadout, paper doll and impact resolution, with a "VIEW ONLY" note. Roll buttons, skill inputs, skill buttons and the targeter are hidden. Right-click Info still works.
- **Chat colour.** Remote seats render chat in the sender's colour. The line carries the sender's colour; if it is missing, the colour comes from the server-set seat id, then the callsign, then the seat's default.
- **Off-table chat.** Text without `/` echoes locally as chat in the user's colour (cyan off-table, the seat colour when linked). `/` still runs commands.
- **USERS toggle.** It moved to the right end of the OPERATOR CONSOLE header. When opened, the user list is a panel on the right side of the console and the log/command area shrinks to fit. The top bar stays one line at 1280px.

## Misaki v5.4 review
1. The server trims the unit owner field (`d.own`) and caps it at 28 characters.
2. The server drops owner-name writes (upsert or rest) from non-host seats and keeps the stored value. Auto-assign therefore only uses names the host typed.
3. DATA ONLY now hides the boot and transition lines (KERNEL ONLINE, SYNCING ISB FLIGHT RECORDER, DECRYPTING SORTIE DATA…). Cause: the audio wrapper on `type()` dropped the flavour flag.
4. The top-bar collision between [THEME] and CLEARANCE at 1280px is fixed by moving USERS out of the top bar. A check confirms the gap.
5. Typing in RoF no longer logs a stray `BASE SKILL SET` line. The 'Assign pilot…' menu hover text now reads "Pick a seat to pilot this unit, or mark it closed".

## Interpretation calls
- **VENT success** is max(VENT+1, VENT+DoS). This keeps the old formula's shape: "1 for success + DoS, minimum 2" becomes "VENT + DoS, minimum VENT + 1".
- **Per-weapon settings** cover every targeter field, including range and speed. [ATK] on a different weapon switches to that weapon's settings.
- **View-only** hides the whole PILOTING box, because it holds only skills, skill rolls and heat actions.
- **Chat colour bug.** The grey chat did not reproduce on a fresh two-seat table. The colour path was hardened (seat colour always sent, seat-id fallback on the receiving side), and a two-seat check covers it.

## Tests
- New: `devtools/check-v55.js`, `check-v55-mp.js`, `check-v55-mp-sync.js` and `server-api-test-v55.mjs`.
- Build scripts: `devtools/patch_v55.py`, `patch_v55_bridge.py` and `patch_v55_server.py`.
