# FORGE-OS 5.2.0: playtest pass (built on out/ v5.1.0, which is untouched)
These files go in the app's public/ folder (`terminal.html`, `mp-bridge.js` v16, `forge-hook.js` v8) plus `server/room.server.ts`.
The desktop shell isn't built. VENT values are as deployed. No new game systems were added.

| # | Item | Status | Interpretation / notes |
|---|---|---|---|
| 1 | Tab context menu | done | Right-click a sheet tab, or focus it (Tab key) and press Shift+F10 or the Menu key. Arrow keys move through the menu, Enter runs an action, Escape closes it and returns focus to the tab. The actions are the same ones as before, now with full labels and tooltips: switch / cycle colour, rename, duplicate, close. In the live table: assign pilot, hold/deploy, delete. The one-letter [R][D][X][H][S] buttons are hidden. The coloured pilot badge stays visible as an owner marker. |
| 2 | One DEFENSE section | done | New **DEFENSE // ALL-OUT ATTACK** section directly under the targeter. It holds Dodge (+ Retreat), Turn Blow (mechs; the sheet's name for it), Parry for each melee weapon and Block for each shield. These were moved from the weapon rows ([PRY]/[BLK]) and the PILOTING box; the PILOTING box now shows the Dodge SL and points to the section. The same functions and SLs are used, with no new mechanics. |
| 3 | All-Out Attack | done | One choice per turn (radio buttons, not checkboxes): NONE, DETERMINED, DOUBLE, FEINT, STRONG, LONG, SUPPRESSION. **Why radio:** GURPS B324/B365 has you pick one All-Out Attack option per turn, and combining them isn't legal. Determined adds +4 melee / +1 ranged to the attack SL, its breakdown and the attack log line (TOTAL MOD shows a note, because the bonus is per weapon). Strong adds +2 or +1/die, whichever is better, to each melee damage roll, before the ×multiplier, since the dice notation is per die. Double, Feint and Long are labels only (roll them yourself). Suppression is only selectable at targeter RoF 5+. Any option shows **NO ACTIVE DEFENSE** and disables the defense buttons until you set NONE. It's stored as `pilot.aoa` (0–6), and the manifest keeps it. |
| 4 | More tooltips | done | Every visible button gets a `title`. Explicit titles were added to tabs, menu items, defense and AoA controls, and roster names/toggle. A small fallback fills any untitled button (sheet, catalogue, console, roster) from a label table. The test found 0 untitled visible buttons. |
| 5 | Core to-hit +0 | done | `hitMod()`: Core is +0. Crew Cabin stays -8. Disabled arms/legs no longer add a stacking bonus. |
| 6 | Damage-roll count | done | **Interpretation:** "degrees" = the sheet's existing attack degrees of success = margin ÷ the weapon's Recoil (RCL:), which is GURPS B373 rapid-fire logic. A successful [ATK] records hits = 1 + degrees, capped at the rounds actually fired (targeter RoF, limited by ammo). Melee is RoF 1, so 1 hit. [DMG] then makes that many damage rolls. A miss records 0 hits and [DMG] refuses. With no attack roll recorded, [DMG] makes 1 roll. The console `ROLL n x` still forces a count. |
| 7 | Vent floor | done | `heatVent()`: at least 2 heat vented on a success and 1 on a failure (the failure is now an undoable action). The success formula is otherwise unchanged (1 + degrees of the VENT step). VENT values are not changed. |
| Bug | "One player's armament/skills/heat reset" | fixed what was clearly a bug; guarded the rest | See `out-v5.2/DESYNC-FINDINGS.md` (causes ranked). Owner wins collisions on their own unit (on both seats). Empty table copies never wipe local skills/loadout/heat. A refused update no longer blocks every later push. Duplicate-callsign seats are refused and re-take prefers the seat that owns the unit. Re-auth now reloads the sheets. Seat-mismatch / not-saved notices. Console: `MP WHOAMI`, `MP RESYNC`, `MP RESET-LOCAL`. |

**Server (room.server.ts):**
- Entering with a callsign that is online right now returns 409, so no second seat is created.
- Re-take prefers the unit-owning seat.
- `resume` with a token issued to a different callsign returns 403.
- `leave` marks the seat offline at once.
- The feature flag `seat2` is added.
- Everything else is as in 5.1, so 5.1 clients keep working.

**Validation:**
- `node --check` passes on all scripts, including the inline terminal script.
- `tsc --noEmit` is clean. eslint reports 0 errors (1 old warning).
- `server-api-test.mjs` (5.1): ALL PASS.
- `server-api-test-v52.mjs`: ALL PASS.
- `check-brittle.js`: ALL PASS.
- `check-v52.js` (solo, 24 checks: boot with no console errors, items 1–7): ALL PASS.
- `check-v52-mp.js` (host + pilot on a fresh dev server: menu, sync, guard, whoami, duplicate refusal, reset-local re-take, owner-wins collision, no console errors): ALL PASS.

Screenshots are in `out-v5.2/shots/`.
