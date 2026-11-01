> **Catalogue v1 note.** The final pass-5 block here is lines 1-14 of batch-2 v0 (unchanged in v1 except grouping). Tachi EP: Ryuji withdrew the "(5) needs EP 5" option under Overseer's rule that TL alone costs no EP. EP 4 stands as a damage price (VIBROBLADE (HEAVY) 3 EP plus one damage step), not a TL price. Dropping the dulling counter is proposed in `divisor-proposals.md` and still needs Overseer. Note: the old root file `catalog-additions-pass5.txt` is stale (HEAT +4, no SPARE, arm note, ELECTROMAGNETIC class); use `../items/`.

# Pass-5 accepted items: heat revisions (draft for Overseer)

This is a draft only. `catalog-additions-pass5.txt` is **not** overwritten, and the revised lines below are for review.

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

```
A|SKYFALL CAPACITOR RAILGUN|5|ROF:1 DMG:6dx25(4) AVG:525 ACC:5 RCL:3 RNG:200/750 AMMO:3(1) SPARE:0 HEAT:+3/shot NOTE:capacitor_recharge_cannot_fire_on_consecutive_turns NOTE:crit_fail_on_attack_roll_destroys_weapon|ELECTROMAGNETIC // CAPACITOR RAILGUN|3.2 t|POWER|Capacitor bank, 3 charges|Long-range kill shots|Rebel railguns are hand-wound and they leak. Every one we've captured has killed something first.|1|8|1
A|KAGEROU MONOMOLECULAR TACHI|4|ROF:X DMG:84d(5) AVG:294 NOTE:edge_dulls_to_(3)_after_3_hits NOTE:restore_between_sorties_or_1_full_turn_plus_Mechanic_roll|MELEE // REMAN TACHI|1.8 t|EDGE|Monomolecular laminate, 3 clean strikes|Duelling, armor cutting|Reman blades go through our best plate like paper for about three passes. After that they are just very expensive swords.|1|10|1
D|REDUNDANT ACTUATOR HARNESS|3|EFFECT:first_crippling_hit_per_limb_leaves_it_working NOTE:arm_-2_to_hit_with_its_weapons_and_melee NOTE:leg_-2_Piloting_and_half_MOVE NOTE:next_damaging_hit_to_that_limb_cripples_normally NOTE:no_effect_on_head_or_torso_or_destruction|STRUCTURE // BACKUP ACTUATORS|1.4 t|POWER|Parallel servo loop, ~1 kW|Holding the line after heavy hits|Imperial doctrine assumes the arm will be hit. The harness assumes the pilot still needs it afterward.|0|8|0
D|KITSUNE MIRAGE FIELD|4|EFFECT:enemy_ranged_attacks_-2 HEAT:+1/turn_active NOTE:SENSOR_SUITE_tier_2_halves_to_-1_tier_3_negates NOTE:no_effect_in_melee NOTE:drops_for_1_turn_after_any_hit_of_100+_penetrating|ECM // HOLOGRAPHIC DECOYS|0.7 t|POWER|Lattice emitters, ~8 kW|Duelist screening, closing the distance|The gun cameras show three of them. The wreckage shows one. Fox-spirit tricks, the Reman pilots call it, and they bow before switching it on.|0|10|1
U|ICARUS OVERDRIVE WINGS|3|MOVE:+100%_1_turn_per_burn HND:+1_while_active HEAT:+3/activation DEF:-1_active_defenses_that_turn HP:20 NOTE:ground_frames_powered_leap_lands_end_of_turn NOTE:air_frames_boosts_existing_air_MOVE_only NOTE:any_penetrating_rear_hit_destroys_wings NOTE:lost_mid-leap/flight_Piloting-2_or_crash_land NOTE:percent_MOVE_bonuses_add_not_multiply|MOBILITY // REBEL OVERDRIVE RIG|0.9 t|FUEL|Hydrazine-boosted, limited by heat|Flanking, hit-and-run|The fastest rig our test pilots have flown, and the only one that came back from trials in more pieces than it left with.|0|8|1
U|BASTION SIEGE ANCHOR|2|SR:+2_while_anchored ACC:+1_ranged_while_anchored EFFECT:-1_RCL_all_weapons_while_anchored NOTE:deploy_and_retract_are_each_a_Ready_maneuver_no_attack NOTE:MOVE:0_and_Dodge_-2_while_anchored NOTE:mechs_and_tanks_only NOTE:stacks_with_targeting_suites|TARGETING // GROUND SPADES|1.6 t|POWER|Hydraulic spades, ~2 kW|Gun-line and siege fire|Imperial knights were never meant to dance. Plant the spades, and the line holds.|0|8|0
U|SHRINE-GRADE COCKPIT SHIELDING|3|HND:-1 EFFECT:divide_Oleum_Vis_rads_by_5 NOTE:TL10_only|UTILITY // RADIATION SHIELDING|3.5 t|SHIELD|Dense lattice liner, passive|Makes Oleum Vis livable|The Remans run Oleum Vis cores for years without a sick pilot. Our engineers have taken this liner apart three times and still can't say why it works.|0|10|1
U|OLEUM PURGE VALVE|2|EFFECT:once_per_sortie_reset_HEAT_to_0 RAD:+50_pilot NOTE:requires_OLEUM_VIS_CORE NOTE:every_pilot_within_50m_friend_or_foe_takes_10_rads NOTE:next_turn_no_attacks_may_still_move_and_defend|UTILITY // EMERGENCY VENT|0.4 t|POWER|Explosive burst valve, single use|Escaping redline in a crisis|Field manuals say to pull the purge only when the alternative is death. The pilots who have pulled it tend to agree, eventually.|0|8|0
R|OLEUM VIS CORE|4|ST/HP:+60% HEAT:12 VENT:2 RAD:25/sortie NOTE:+10_rads/turn_ending_in_danger_zone_+25_in_redline NOTE:log_rads_on_pilot_sheet_(B435) NOTE:no_fuel_or_FP_costs_but_boosters_still_cost_heat NOTE:radiation_signature_+2_to_enemy_sensor/detection_checks|REACTOR // EXOTIC FUEL CORE|[DATA_NOT_FOUND]|FUEL|Oleum Vis slurry, indefinite burn|Long patrols, siege endurance, heavy draw|Oleum Vis does not run out. The pilots do. Imperial crews rotate on dosimeter, not on fuel state.|0|8|1
T|ICARUS AFTERBURNER STACK|0|MOVE:+60% HND:+1 SR:-1 HEAT:+1/turn_at_full_MOVE|THRUSTER // AFTERBURNER STACK|[DATA_NOT_FOUND]|FUEL|Rebel hydrazine blend|Pursuit, escape|Imperial thrusters are tuned to last a century. Rebel stacks are tuned to last until the next depot.|0|8|1
G|SHINGAN MIND'S-EYE SUITE|-3|ACC-ALL:+2 EFFECT:ignores_ECM_SUITE_tier_1 NOTE:tier_2+_ECM_applies_normally|TARGETING // REMAN SPIRIT-LINK|[DATA_NOT_FOUND]|LINK|Neural-optic sync, TL10|Precision fire through light jamming|Reman pilots say the suite doesn't see the target; it lets the pilot see it. Our technicians reported a headache and declined to elaborate.|0|10|1
F|ICARUS-PATTERN SKIRMISH FRAME|5|ST/HP:110 DR:300/150 MOVE:13L/26S SM:+6 HND:+3 SR:1|FRAME // MECH|[DATA_NOT_FOUND]|ORIGIN|Rebel field workshops, unlicensed|Raiding, flanking|Rebel frames are built to win the first exchange. There is no plan for the second.|0|8|1
F|MUSHA-CLASS KNIGHT FRAME|6|ST/HP:165 DR:650/325 MOVE:10L/20S SM:+6 HND:+2 SR:2 BRITTLE:-1_SR_below_half_HP NOTE:repairs_take_x2_time_without_Reman_crews_and_parts|FRAME // MECH|[DATA_NOT_FOUND]|ORIGIN|Reman foundry-temple, TL10 composite|Duelling, line-breaking|Every Musha we've recovered came with its pilot's name lacquered inside the cockpit. Our mechanics stopped scraping it off after the third one wouldn't start.|0|10|1
F|TL8-SIEGE CRAWLER|10|ST/HP:160 DR:450/300 MOVE:2L/- SM:+5 HND:0 SR:5|FRAME // VEHICLE|[DATA_NOT_FOUND]|CREW|Driver, gunner, commander|Artillery platform, breakthrough|The Crawler has outlived three dynasties and two of its replacements. It will probably outlive us.|0|8|0
```

## Ryuji's optional scope trims (not applied; for Overseer to choose)

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

## Update (Oct 26, 08:42)
- Skyfall range set to RNG:200/750 on Overseer's instruction (relayed via Grok Bot, Oct 26), replacing 250/900. Ryuji score 7.25.
- Baseline 20mm LIGHT AUTOCANNON: proposed RNG:100/400, replacing 1800/7200 to match the lower scale. Ryuji confirmed it at 8.25. This is an edit to a baseline RAW line in terminal.html, which Overseer applies himself.

## Round 2 (Ryuji, `review-batch2-r2.md` section 4): FINAL pass-5 block

Applied here only. `catalog-additions-pass5.txt` is **not** edited; the pre-round-2 copy of this file is `pass5-heat-revisions-r2pre.md`.

| Item | Round-2 change | Ryuji r2 |
|---|---|---|
| SKYFALL CAPACITOR RAILGUN | Keeps RNG 200/750 (Overseer), HEAT +3/shot, SPARE:0, arm note dropped. **Class ELECTROMAGNETIC to `BALLISTIC // CAPACITOR RAILGUN`** (S4: 3/51 lists railguns under Gunner (Cannon); Linked FC and Zanshin now apply). | 7.5 ACCEPT |
| ICARUS OVERDRIVE WINGS | Drops `HP:20` and `NOTE:any_penetrating_rear_hit_destroys_wings`; adds `NOTE:lost_when_the_Utility_location_is_disabled` (the wording batch 2 already uses, per Ryuji's trim). HEAT +3/activation kept. | 7.5 with trims |
| OLEUM PURGE VALVE | Drops the 50m rads splash (`NOTE:every_pilot_within_50m_friend_or_foe_takes_10_rads`). EP 2 kept. `RAD:+50_pilot` is **kept** (the brief said drop the splash only); Ryuji would also park it until the rads counter ships. Overseer's call. | 7.75 with trims |
| KITSUNE MIRAGE FIELD | Unchanged from the draft (HEAT +1/turn). | 7.25 ACCEPT |
| ICARUS AFTERBURNER STACK | Unchanged from the draft (HEAT +1/turn at full MOVE). | 7.75 ACCEPT |

The other nine lines are identical to the draft above. Still open for Overseer (not applied): the Tachi option (dulling rule, or (5) at 5 EP, or (4) at 4 EP), Musha BRITTLE, Redundant Harness as PLATE:50, Oleum core rads simplification.

**Validation:** 14 lines, 13 fields each; terminal `rebuildDB`/`statsOK`/`frameOK`/`safeField` (`work/nodecheck2.js`): **0 rejects**. Max RNG 750.

### Ready-to-paste final block (all 14 pass-5 lines, round 2 applied)

```
A|SKYFALL CAPACITOR RAILGUN|5|ROF:1 DMG:6dx25(4) AVG:525 ACC:5 RCL:3 RNG:200/750 AMMO:3(1) SPARE:0 HEAT:+3/shot NOTE:capacitor_recharge_cannot_fire_on_consecutive_turns NOTE:crit_fail_on_attack_roll_destroys_weapon|BALLISTIC // CAPACITOR RAILGUN|3.2 t|POWER|Capacitor bank, 3 charges|Long-range kill shots|Rebel railguns are hand-wound and they leak. Every one we've captured has killed something first.|1|8|1
A|KAGEROU MONOMOLECULAR TACHI|4|ROF:X DMG:84d(5) AVG:294 NOTE:edge_dulls_to_(3)_after_3_hits NOTE:restore_between_sorties_or_1_full_turn_plus_Mechanic_roll|MELEE // REMAN TACHI|1.8 t|EDGE|Monomolecular laminate, 3 clean strikes|Duelling, armor cutting|Reman blades go through our best plate like paper for about three passes. After that they are just very expensive swords.|1|10|1
D|REDUNDANT ACTUATOR HARNESS|3|EFFECT:first_crippling_hit_per_limb_leaves_it_working NOTE:arm_-2_to_hit_with_its_weapons_and_melee NOTE:leg_-2_Piloting_and_half_MOVE NOTE:next_damaging_hit_to_that_limb_cripples_normally NOTE:no_effect_on_head_or_torso_or_destruction|STRUCTURE // BACKUP ACTUATORS|1.4 t|POWER|Parallel servo loop, ~1 kW|Holding the line after heavy hits|Imperial doctrine assumes the arm will be hit. The harness assumes the pilot still needs it afterward.|0|8|0
D|KITSUNE MIRAGE FIELD|4|EFFECT:enemy_ranged_attacks_-2 HEAT:+1/turn_active NOTE:SENSOR_SUITE_tier_2_halves_to_-1_tier_3_negates NOTE:no_effect_in_melee NOTE:drops_for_1_turn_after_any_hit_of_100+_penetrating|ECM // HOLOGRAPHIC DECOYS|0.7 t|POWER|Lattice emitters, ~8 kW|Duelist screening, closing the distance|The gun cameras show three of them. The wreckage shows one. Fox-spirit tricks, the Reman pilots call it, and they bow before switching it on.|0|10|1
U|ICARUS OVERDRIVE WINGS|3|MOVE:+100%_1_turn_per_burn HND:+1_while_active HEAT:+3/activation DEF:-1_active_defenses_that_turn NOTE:ground_frames_powered_leap_lands_end_of_turn NOTE:air_frames_boosts_existing_air_MOVE_only NOTE:lost_when_the_Utility_location_is_disabled NOTE:lost_mid-leap/flight_Piloting-2_or_crash_land NOTE:percent_MOVE_bonuses_add_not_multiply|MOBILITY // REBEL OVERDRIVE RIG|0.9 t|FUEL|Hydrazine-boosted, limited by heat|Flanking, hit-and-run|The fastest rig our test pilots have flown, and the only one that came back from trials in more pieces than it left with.|0|8|1
U|BASTION SIEGE ANCHOR|2|SR:+2_while_anchored ACC:+1_ranged_while_anchored EFFECT:-1_RCL_all_weapons_while_anchored NOTE:deploy_and_retract_are_each_a_Ready_maneuver_no_attack NOTE:MOVE:0_and_Dodge_-2_while_anchored NOTE:mechs_and_tanks_only NOTE:stacks_with_targeting_suites|TARGETING // GROUND SPADES|1.6 t|POWER|Hydraulic spades, ~2 kW|Gun-line and siege fire|Imperial knights were never meant to dance. Plant the spades, and the line holds.|0|8|0
U|SHRINE-GRADE COCKPIT SHIELDING|3|HND:-1 EFFECT:divide_Oleum_Vis_rads_by_5 NOTE:TL10_only|UTILITY // RADIATION SHIELDING|3.5 t|SHIELD|Dense lattice liner, passive|Makes Oleum Vis livable|The Remans run Oleum Vis cores for years without a sick pilot. Our engineers have taken this liner apart three times and still can't say why it works.|0|10|1
U|OLEUM PURGE VALVE|2|EFFECT:once_per_sortie_reset_HEAT_to_0 RAD:+50_pilot NOTE:requires_OLEUM_VIS_CORE NOTE:next_turn_no_attacks_may_still_move_and_defend|UTILITY // EMERGENCY VENT|0.4 t|POWER|Explosive burst valve, single use|Escaping redline in a crisis|Field manuals say to pull the purge only when the alternative is death. The pilots who have pulled it tend to agree, eventually.|0|8|0
R|OLEUM VIS CORE|4|ST/HP:+60% HEAT:12 VENT:2 RAD:25/sortie NOTE:+10_rads/turn_ending_in_danger_zone_+25_in_redline NOTE:log_rads_on_pilot_sheet_(B435) NOTE:no_fuel_or_FP_costs_but_boosters_still_cost_heat NOTE:radiation_signature_+2_to_enemy_sensor/detection_checks|REACTOR // EXOTIC FUEL CORE|[DATA_NOT_FOUND]|FUEL|Oleum Vis slurry, indefinite burn|Long patrols, siege endurance, heavy draw|Oleum Vis does not run out. The pilots do. Imperial crews rotate on dosimeter, not on fuel state.|0|8|1
T|ICARUS AFTERBURNER STACK|0|MOVE:+60% HND:+1 SR:-1 HEAT:+1/turn_at_full_MOVE|THRUSTER // AFTERBURNER STACK|[DATA_NOT_FOUND]|FUEL|Rebel hydrazine blend|Pursuit, escape|Imperial thrusters are tuned to last a century. Rebel stacks are tuned to last until the next depot.|0|8|1
G|SHINGAN MIND'S-EYE SUITE|-3|ACC-ALL:+2 EFFECT:ignores_ECM_SUITE_tier_1 NOTE:tier_2+_ECM_applies_normally|TARGETING // REMAN SPIRIT-LINK|[DATA_NOT_FOUND]|LINK|Neural-optic sync, TL10|Precision fire through light jamming|Reman pilots say the suite doesn't see the target; it lets the pilot see it. Our technicians reported a headache and declined to elaborate.|0|10|1
F|ICARUS-PATTERN SKIRMISH FRAME|5|ST/HP:110 DR:300/150 MOVE:13L/26S SM:+6 HND:+3 SR:1|FRAME // MECH|[DATA_NOT_FOUND]|ORIGIN|Rebel field workshops, unlicensed|Raiding, flanking|Rebel frames are built to win the first exchange. There is no plan for the second.|0|8|1
F|MUSHA-CLASS KNIGHT FRAME|6|ST/HP:165 DR:650/325 MOVE:10L/20S SM:+6 HND:+2 SR:2 BRITTLE:-1_SR_below_half_HP NOTE:repairs_take_x2_time_without_Reman_crews_and_parts|FRAME // MECH|[DATA_NOT_FOUND]|ORIGIN|Reman foundry-temple, TL10 composite|Duelling, line-breaking|Every Musha we've recovered came with its pilot's name lacquered inside the cockpit. Our mechanics stopped scraping it off after the third one wouldn't start.|0|10|1
F|TL8-SIEGE CRAWLER|10|ST/HP:160 DR:450/300 MOVE:2L/- SM:+5 HND:0 SR:5|FRAME // VEHICLE|[DATA_NOT_FOUND]|CREW|Driver, gunner, commander|Artillery platform, breakthrough|The Crawler has outlived three dynasties and two of its replacements. It will probably outlive us.|0|8|0
```
