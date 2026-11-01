# FORGE-OS v5.5.1 — Overseer feedback pass 3

## Targeter
- The accuracy tile (e.g. `▲ SKYFALL CAPACITOR RAILGUN +1`) is now the targeter header, replacing `TARGETER // <weapon>`. It always shows, even at +0 (`●`), and includes the weapon's ACC when ACC is on. For melee weapons it shows the Evaluate bonus.
- The ACC / Heat / All-Out Attack row only has the buttons now. Descriptive text like "no targeting bonus at this range" and "STANDARD FIRE CONTROL" is gone.
- Melee weapons: **[EVALUATE +1 ▾]** replaces ACC. Clicking it turns the bonus on or off. Right-click (or Shift+F10) picks +1, +2 or +3. The bonus is saved per weapon with the other targeter settings and is included in TOTAL MOD and the attack SL breakdown.
- Closing the targeter (clicking the weapon again) also clears the weapon's highlight and `aria-current`.

## Heat
- Heat toggles now tick automatically. A roll made with a section's Heat on (SKILL MOD Heat for skills and active defenses, targeter Heat for attacks) adds +1 heat to the mech, capped at the reactor's capacity. It also switches that section's Heat off and logs `HEAT +1 :: ... used the Heat toggle (now off)`. The change syncs with the sheet like any other heat change.

## Criticals (GURPS Basic Set B348, on effective skill after all mods)
- Critical success: a natural 3 or 4 always. A 5 at effective skill 15+, a 6 at 16+.
- Critical failure: an 18 always. A 17 unless effective skill is 16+ (then it is an ordinary failure). Any roll of effective skill + 10 or more.
- Success follows the crit result: a critical hit always succeeds and a critical fail always fails.
- Labels are now **CRITICAL HIT** / **CRITICAL FAIL**, both on the collapsed line and in the expanded detail (`3d6 [...] = n vs SL x (CRITICAL HIT)`), on every seat. No new effects; existing notes such as Skyfall's are kept.

## Console / table
- The log stays pinned to the bottom when the last line grows (DMG folding into an attack line, wrapping), as long as you were at or near the bottom. If you've scrolled up, it stays where you are.
- Remote chat colour: a chat line that reaches a seat without its structured chat card used to fall into the generic remote-line renderer. That renderer tints only the sender name and puts the text in the grey `.dim` tone. The line now renders as chat, escaped, with the name and the message body both in the sender's colour. (mp-bridge v22)
- Viewers of a unit they don't own see All-Out Attack on the paper doll update live, following the owner's active weapon. They no longer need to switch weapons, and view-only seats no longer write targeter state locally.
- The user list no longer has the `LINK OK` header.
- Version 5.5.1.

## Move and Attack (B365), item 11
- **Move and Attack** is a separate entry in the All-Out Attack button's right-click menu, listed for every weapon after that weapon's valid AoA types. It's a maneuver, so picking it clears any All-Out Attack type, and picking an AoA type (or Off) clears it.
- Ranged: a flat **-2** (Bulk isn't used). Melee: **-4**, with the adjusted attack skill capped at **9**.
- Only Dodge and Block are allowed. Parry and Turn Blow drop out of the defense menu and are refused if rolled.
- The button reads `[MOVE+ATK -2 ▾]` / `[MOVE+ATK -4 ▾]`. The paper doll shows a `MOVE+ATK // DODGE/BLOCK ONLY` tag, and viewers of the unit see it update live. TOTAL MOD includes the penalty and lists `MOVE+ATK -n`. The roll line shows `· MOVE+ATK`, and the detail shows `MOVE+ATK -n`. The setting is saved per weapon with the targeter and syncs.

## Rapid Strike (B370), item 12
- Melee weapons get **[RAPID STRIKE -6 ▾]** in the Evaluate / Heat / AoA row. Right-click (or Shift+F10) picks -6 or -3.
- While it's on, the weapon's RoF is 2 (two attacks, each at the penalty) and its RoF max is 2. Turning it off returns it to RoF 1.
- It's saved per weapon, shown in TOTAL MOD (`RAPID STRIKE -n ×2`) and on the roll line, and synced.

## Tests
- Solo 119/119, two-seat 59/59, two-seat sync 11/11, API 10 + 18 + 11 + 7 (fresh dev server), brittle 13/13, race repro OK, node --check and server typecheck clean.
