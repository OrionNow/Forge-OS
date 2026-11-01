import pickle
src,out,ch=pickle.load(open('pass5.pkl','rb'))
o=[];w=o.append
w('# Pass-5 accepted items: heat revisions (draft for Overseer)\n')
w('''This is a draft only. `catalog-additions-pass5.txt` is **not** overwritten, and the revised lines below are for review.

**Basis.** These changes apply the "Suggested value" column of Ryuji's section 8 in `review-batch2.md`, plus his SKYFALL lean fix. Everything was judged under the heat model I verified in `terminal.html` (lines 779, 782, 786-788 and 984, identical in the sortie-app copy):
- Heat never vents on its own.
- A vent is an ENGINEERING roll that sheds 1 heat, plus 1 for every VENT points of margin, so a lower VENT is better.
- The danger zone starts at half the cap (DR x0.75, Dodge +1, Move +1). Redline starts at the full cap (DR x0.5, Dodge +2, Move +2).

**Validation.** All 14 lines have 13 fields, every token is LABEL:VALUE, there are no unsafe characters, and every RNG max is 750 or less. I also ran the terminal's own `rebuildDB` / `statsOK` / `frameOK` / `safeField` over the lines: 0 line rejects.

## Changes (5 of 14 lines)

| Item | Change | Why (Ryuji, section 8) |
|---|---|---|
| SKYFALL CAPACITOR RAILGUN | RNG 250/900 to **200/750**; adds **SPARE:0**; HEAT +4 to **+3** per shot; drops `NOTE:20+_penetrating_to_mounting_arm_disables_it` | The range broke the 750 ceiling. The default spares gave it 9 rounds instead of 3. The arm note duplicates the sheet's own weapon disable. He expects a score of 7.5. |
| ICARUS OVERDRIVE WINGS | HEAT +4 to **+3** per activation; the "3 burns per sortie" cap is removed from LABEL-VALUE | Over-penalized: at +4, a Light Fission cell redlines on the 2nd burn. Heat alone now limits burns: on a Light cell, the 2nd burn is in the danger zone and the 3rd is at redline. |
| KITSUNE MIRAGE FIELD | HEAT +3 to **+1** per turn active | Self-defeating at +3: from turn 2, its own DR x0.75 outweighed its -2 to-hit. At +1, a Standard core reaches the danger zone on turn 5 and redline on turn 10. |
| ICARUS AFTERBURNER STACK | HEAT +2 to **+1** per turn at full MOVE | Mildly over-penalized. Ryuji is reverting his own earlier raise. |
| OLEUM PURGE VALVE | EP 1 to **2** | Under-costed: a reset to 0 is now worth about 4 vent turns. |

The OLEUM VIS CORE keeps HEAT 12 / VENT 2 (Ryuji: not over-penalized on heat). The other eight items have no heat and are unchanged.

## Revised RAW (all 14 lines, paste-ready)
''')
w('```\n'+'\n'.join(out)+'\n```\n')
w('''## Ryuji's optional scope trims (not applied; for Overseer to choose)

These come from the "Leaner version" column. They are scope changes rather than heat changes, so they are listed but not folded into the lines above.

- **ICARUS OVERDRIVE WINGS:** drop `HP:20`, the burns-per-sortie limit (already removed above) and the rear-hit note. The wings are destroyed when the Utility location is disabled.
- **KITSUNE MIRAGE FIELD:** replace the timer note with `NOTE:drops_on_any_failed_stability_check`.
- **OLEUM VIS CORE:** `RAD:25/sortie NOTE:+25_rads_if_the_sortie_reached_redline`, one checkbox instead of a per-turn tally. Or reduce to `+5_rads/turn_ending_in_danger_zone` if the rads counter ships.
- **OLEUM PURGE VALVE:** `EFFECT:once_per_sortie_reset_HEAT_to_0 NOTE:no_attacks_next_turn`, dropping the 50m splash. Keep +50 rads only once the counter ships.
- **KAGEROU MONOMOLECULAR TACHI:** drop the dulling counter. Then either (a) keep (5) and raise to EP 5 (Ryuji's preference), or (b) keep EP 4 at (4). Note that (5) is published for a superfine vibroblade (Ultra-Tech p.164).
- **MUSHA-CLASS KNIGHT FRAME:** drop `BRITTLE` and set `SR:1` flat.
- **REDUNDANT ACTUATOR HARNESS:** `PLATE:50 PLATE-USES:1 PLATE-HP:any`, the native sacrificial plating.
- **BASTION SIEGE ANCHOR:** acceptable as a manual toggle. Optionally, make it a G-slot `ACC-FAR:+1 SR:+2` package with MOVE 0 noted.
- **SHRINE-GRADE COCKPIT SHIELDING:** park it with the rads counter.
- **SKYFALL:** its class is `ELECTROMAGNETIC`, which no LINKED FIRE CONTROL tier penalises. To match batch 2, consider `BALLISTIC // CAPACITOR RAILGUN` (3/51 lists railguns under Gunner (Cannon), p.27).

## Assumptions Ryuji says still need Overseer to confirm

Each one is quoted word for word from `review-batch2.md`, followed by one plain-language question.

1. "[ASSUMPTION A1] Crippling. I treat "crippled" as a limb at HP ≤ 0 (sheet state DEAD/disabled) and "destroyed" as HP ≤ -max (WRECK), following `cond()`. Items that say "uncripple" or "first crippling hit" are read that way."
   **Question:** When an item says a limb is "crippled", does that mean the limb is at 0 HP or below (disabled), and does "destroyed" mean it has reached minus its max HP (wrecked)?
2. "[ASSUMPTION A2] EP budget. Max EP = frame EP + R + T + G modifiers. A typical Medium build (Medium 5 + Standard core 3 + Standard thrusters 2 + Standard FC 0) has 10 EP of equipment, and a Heavy/Heavy build has about 15. "Cheap" and "dear" below are judged against those numbers."
   **Question:** Is a mech's equipment budget the frame's EP plus the reactor, thruster and targeting EP, so that a standard Medium build has about 10 EP to spend?
3. "[ASSUMPTION A3] Hits per burst. Hikari's per-turn figures assume every RoF round hits. Under GURPS (1 + margin/Rcl), they are ceilings. I quote ceilings where she did and note expected values where it matters."
   **Question:** For rapid-fire weapons, should the number of hits follow the normal GURPS rule (1 hit plus 1 per Recoil of margin), so that "every round hits" is only a best case?
4. "[ASSUMPTION A4]: one ranged attack per turn unless All-Out. Overseer should confirm."
   **Question:** Can a pilot fire only one ranged weapon per turn, unless they take an All-Out Attack (as in Pyramid 3/51)?
5. "[ASSUMPTION A5]: repair is meant to be minor."
   **Question:** Should in-battle repair items be minor top-ups (a few percent of a location's HP) rather than a real way to undo heavy damage?
6. "3/51 divergence (flag for Overseer). 3/51's TL10 railguns are (3): the 40mm railgun is 6dx25(3) with Acc 8, and the 64mm is 6dx30(3). Ultra-Tech's (5) penetrator is APHD, which is TL11 (UT, "Armor Piercing Hyperdense Dart: armor divisor (5) and double range"). Hikari's Cole damage of 516 matches 3/51's 6dx25 very closely. The (5) is a setting license for the Remans, not a derivation."
   **Question:** Are you happy for Reman railguns such as the Gauss Longbow to keep a (5) armor divisor as a setting choice, even though Pyramid 3/51 gives railguns (3)?
7. "The second frame DR value is unused (`ARMOR_REF` is all 0). 3/51 applies the lower DR to arms, legs and non-front arcs, so a 3/51-faithful sheet would map limbs to index 1. That would change every limb-damage figure in this review by about 2x. Flag for Overseer."
   **Question:** Should the second DR number on frames (the lower one) apply to arms, legs and rear hits, as it does in Pyramid 3/51, or should every location keep using the first number as the sheet does now?
''')
open('../pass5-heat-revisions.md','w').write('\n'.join(o))
