# FORGE-OS Balance Review: Batch 2 (50 concepts), by Ryuji, Balance Critic

Inputs: `concepts-batch2.md` / `concepts-batch2-raw.txt` (Hikari), baseline RAW/TIER in `terminal.html` v5.0.1, the accepted lines in `catalog-additions-pass5.txt`, and Overseer's sources in `gurps/` (Pyramid 3/51 *Tech and Toys III* "Modular Mecha" is the primary reference; also B, High-Tech, Ultra-Tech, Pyramid 3/40).

Format, as before: **Balance / Setting / Usability / Function = overall**. Accept at 7.0 or higher. Every item also carries a **Scope** tag. Under Overseer's new hard rule, scope creep counts as a review failure: any new counter, sub-location HP, status effect, extra roll, or squad-wide shared state lowers Usability and Function sharply. Severe creep caps both at about 4 or 5. A single extra status or roll caps them at about 5 or 6.

**Result: 12 accepted, 38 to revise.** Most of the revisions are cheap. 26 of the 38 are marked **[lean]**: one or two token deletions or swaps, and the item should pass on resubmission. The other 12 are marked **[rework]**.

Hikari is re-deriving the batch against 3/51. So this review sticks to scores, specific problems, and lean fixes. It doesn't rewrite every RAW line.

---

## 0. Ground truth I used (read from the sheet code, not inferred)

What the sortie app actually implements, so you can check the Scope tags:

- **Heat** (corrected model, per the 4.7.5 changelog and the `heatAdd`/`heatVent` code). Heat accumulates and is never shed passively. Players add it by hand with the [+1]/[+5] buttons. Weapon `HEAT:` tokens are not applied automatically.
  - **Vent** is an ENGINEERING roll. A success sheds 1, plus 1 for every VENT-sized step of margin, so a **lower VENT is better**.
  - **Danger zone** starts at heat ≥ cap/2: DR x0.75, Dodge +1, Move +1. **Redline** starts at heat = cap: DR x0.5, Dodge +2, Move +2.
  - The pool **clamps at cap**. There is no "redline lock" and no overflow effect. Heat beyond the cap is simply lost.
  - **Expected heat shed per vent action** (my 3d6 calculation, with 17-18 failing):

    | ENGINEERING | VENT 1 | VENT 2 | VENT 3 |
    |---|---|---|---|
    | 12 | 2.8 | 1.6 | 1.2 |
    | 14 | 4.6 | 2.5 | 1.8 |

  - The exchange rate I use below: **one turn spent venting ≈ 2.5 heat on a Standard core (Eng 14).**
- **HP per location.** Head, Core, and Crew Cabin get full frame HP. Arms, legs, and Utility get half. A Medium frame with a Standard core has 225 per full location and 113 per limb. The stability check fires when one hit's penetration exceeds half of a location's HP. Hit modifiers: Core -4, Cabin -8.
- **DR.** Every location uses the **first** DR number (`ARMOR_REF` is all 0), so the second DR value is currently unused. REAR and GAP are manual checkboxes worth x0.5 each. `DR:+N%` (the largest one wins) and `PLATE:N PLATE-USES:n PLATE-HP:` are the only armor tokens the sheet parses. **Flat `DR:+N` on an item does nothing.**
- **Ammo.** The sheet parses `AMMO:n(reload)`. **SPARE defaults to 2 extra magazines** when the token is absent. Only A-category items track ammo. Generic `USES:` is not tracked anywhere.
- **Targeting.** The sheet parses `ACC-ALL`, `ACC-<weapon class>` (BALLISTIC, ROCKET_MISSILE, MELEE, ELECTROMAGNETIC, BEAM, INCENDIARY…) and `ACC-CLOSE/MEDIUM/FAR` from the G slot only. A weapon's own ACC is added only when the ACC (Aim) toggle is on. The RoF bonus comes from `rofBon` (3-4: +1, 5-8: +2, 9-12: +3).
- **Other sheet mechanics:** Parry with held melee weapons, shield Block, Dodge (which includes HND), stability check (PILOTING + HND), weapons disabled when their location is disabled (`wDisabled`), and tiers. There is **no** crit table, no rads counter, no FP/DX tracking, no reach, no area/duration effects, and no cross-sheet state other than what players type in by hand.

**Assumptions for Overseer** (not documented anywhere, so I inferred them):
- **[ASSUMPTION A1] Crippling.** I treat "crippled" as a limb at HP ≤ 0 (sheet state DEAD/disabled) and "destroyed" as HP ≤ -max (WRECK), following `cond()`. Items that say "uncripple" or "first crippling hit" are read that way.
- **[ASSUMPTION A2] EP budget.** Max EP = frame EP + R + T + G modifiers. A typical Medium build (Medium 5 + Standard core 3 + Standard thrusters 2 + Standard FC 0) has **10 EP** of equipment, and a Heavy/Heavy build has about 15. "Cheap" and "dear" below are judged against those numbers.
- **[ASSUMPTION A3] Hits per burst.** Hikari's per-turn figures assume every RoF round hits. Under GURPS (1 + margin/Rcl), they are **ceilings**. I quote ceilings where she did and note expected values where it matters.

---

## 1. Priority six (full review)

### 1) 105mm SIEGE MORTAR (Empire) — **B5 / S8 / U4 / F5 = 5.5 → REVISE [rework]**
**Scope: CREEP.** It adds a Forward Observer roll (FO is not a sheet skill), an indirect-fire mode, and a minimum range.

- **Per-hit numbers.** 483(4) puts 358 through DR 500, against 306 for the 90mm HEAVY RIFLE (5 EP), at 1 EP less. Against Heavy-frame DR 700 it puts **308** through, enough to destroy a Heavy-frame/Heavy-core Core location (297.5 HP) in one hit. The 90mm does 239 there and can't.
- **The -10 is not the gate Hikari thinks.** High-Tech's own rule (the indirect fire box) lets the FO "whittle the -10 down to 0" over repeated rolls, and a critical success zeroes it at once. Give the FO the sheet's SENSORS skill plus a tier-3 suite (CHECKS +6) and the penalty is gone in one or two rolls. With the MESH NET RELAY, every squadmate is a qualified spotter.
- **The rule cuts the other way too, and the line ignores it.** HT says the indirect gunner **doesn't benefit from his gun's Acc**, so `ACC:2` is dead text in its only legal mode.
- **No SPARE token**, so the sheet hands it 2 spare racks: **12 bombs, not 4.**
- **Spotting depends on another sheet.** The spotter's state lives on someone else's sheet, and the sheet can't see it.
- **Derivation:** the HEAT fit at 105mm gives P = 1,946, so 486, so 6dx23 (483). ✔ It is consistent with the baseline rocket curve. In 3/51, shaped charges are (10) against laminate that doubles DR, which nets to about (5). FORGE's (4) is a fair compression.

**Lean fix (exact tokens):**
- `INDIRECT:-10_without_spotter` → `INDIRECT:-4_if_an_ally_with_LOS_made_a_SENSORS_roll_this_turn_else_-10`. That's one roll, on an existing skill, with a flat result and no margin arithmetic.
- Delete `NOTE:spotter_Forward_Observer_margin_reduces_the_-10`.
- `ACC:2` → `ACC:0`, which matches HT.
- Add `SPARE:0`.
- MASS 3.0 t → **4.0 t**, so EP = 2.5√4 = **5**. That keeps the mass rule intact and prices it next to the 90mm.
- Keep `minimum_range_25`. It's a range-band note, and the sheet already has range.

### 2) HAGANE-YUMI GAUSS LONGBOW (Reman) — **B6 / S9 / U7 / F7 = 7.25 → ACCEPT (with two fixes)**
**Scope: OK.** DRAW is just the Aim maneuver, which the sheet's ACC toggle already models.

- **Against the accepted SKYFALL (same 5 EP).** The Longbow has 525(5) against 525(4): 425 versus 400 through DR 500, and 385 versus 350 through DR 700. It has ACC 6 against 5, 4 bolts against 3, and no self-destruct on a critical failure.
- **The draw is mostly free.** "Must Aim before every shot" costs little in GURPS, because ACC only applies when Aiming anyway (B364). "Damage breaks the draw" is already the B364 rule: an active defense spoils the Aim and injury forces a Will roll.
- **Why it still passes: the corrected heat model gives it two real offsets.**
  - (a) The Skyfall pilot can **fire another weapon or vent** on the railgun's recharge turn. The Longbow pilot spends that turn **Aiming** and can neither attack nor vent.
  - (b) +4 per bolt never comes off mid-cycle. On a Standard core, bolt 2 puts it in the danger zone at 8/10 (DR x0.75) and bolt 3 redlines it.
  - Its range (200/640) is also shorter than the Skyfall's.
  - That is "overpowered but beatable": close the distance, or make it Dodge.
- **3/51 divergence (flag for Overseer).** 3/51's TL10 **railguns are (3)**: the 40mm railgun is 6dx25(3) with Acc 8, and the 64mm is 6dx30(3). Ultra-Tech's (5) penetrator is **APHD, which is TL11** (UT, "Armor Piercing Hyperdense Dart: armor divisor (5) and double range"). Hikari's Cole damage of 516 matches 3/51's 6dx25 very closely. The (5) is a setting license for the Remans, not a derivation.

**Fixes:**
- Add `SPARE:1`. Without a SPARE token, the sheet gives it 4 + 8 = **12 bolts**.
- Rounding: Cole gives 24.6, so 6dx25. Elsewhere Hikari rounds down (35mm 10.4 → 10, lance 21.5 → 21). Either use 6dx24 (504) or state the rounding rule.

### 3) KAGEBOSHI REMOTE BITS (Reman) — **B5 / S9 / U3 / F4 = 5.25 → REVISE [rework]**
**Scope: CREEP (severe).** It adds four bits at 10 HP each (sub-location HP), a per-turn EW roll, a "grounded" status, an implicit position for each bit, and it has no AMMO token.

- **Damage.** It always hits the rear (the sheet's REAR flag, x0.5): 147 - (500/3 × 0.5 = 83) = 64 per bit, so **256 per turn ceiling against a Medium from any facing.** For comparison, the 30mm AUTOCANNON does 110 against the front.
  - Against a Light frame (DR 400) it's 4 × 80 = 320.
  - Against Heavy DR 700 it's 4 × 30 = 120, so it falls off against heavies. That's good.
- **It has no AMMO and no HEAT, so it's unlimited.** It's the only weapon in the batch with no consumable and no heat cost.
- **The counter costs too much.** The counter is the enemy's ECM tier 2, at 4 EP for them. The undefined "EW roll" also makes the counter unreadable at the table: what's the target number, and what happens on a failure?
- **3/51 check.** 3/51 lets an operator fire one weapon a turn (two with All-Out Attack). Bits firing every turn *on top of* the main gun break that budget.

**Lean fix:**
- Delete `NOTE:pilot_EW_roll_each_turn_to_command` and `NOTE:4_bits_HP:10_each`. The bits live in the Utility location, so they go down when Utility is disabled. `wDisabled` already handles that.
- Add `AMMO:16(2) SPARE:0`, which is four volleys.
- Add `HEAT:+2/turn_used`.
- Add `NOTE:firing_the_bits_is_the_turn's_attack`, per the 3/51 one-weapon rule.
- Keep `REAR:apply_the_REAR_flag` and `ECM_SUITE_tier_2+_in_radius_grounds_the_bits`. Both use existing sheet concepts.
- After those changes I'd expect about 7.25.

### 4) MESH NET RELAY (Rebel) — **B5 / S8 / U3 / F4 = 5.0 → REVISE [rework]**
**Scope: CREEP (severe).** It creates squad-wide shared state: one sensor tier propagated across sheets, and a net-wide drop.

- **EP math.** A four-mech lance with one tier-3 SENSOR SUITE and four relays spends 7 + 8 = 15 EP to give **everyone tier 3**. Four separate suites would cost 28.
- **It turns one 7 EP sensor into a squad-wide counter to the whole Reman stealth kit at once.** All of these key off sensor tier:
  - It **negates** KITSUNE MIRAGE FIELD (4 EP, accepted) for every relayed ally.
  - It negates SHINOBI SIGNATURE DAMPERS at all three tiers.
  - It negates DECOY BEACON DROP ("tier 3 ignores").
  - It negates SMOKE DISCHARGERS ("tier 3 negates").
  - It makes mortar spotting trivial.
- **Only enemy ECM tier 3 drops the net.** Tier 1 and 2 ECM don't, and the sensors' "full if higher tier than ECM" means relayed tier 3 also beats their ACC suppression.
- **Interaction with SHINGAN.** A Shingan user doesn't need the net against ECM tier 1, but relayed tier 3 also makes Shingan's niche (ignoring tier-1 ECM) irrelevant for the whole squad.

**Lean fix (personal, no shared state):** replace the STATS with `EFFECT:counts_as_SENSOR_SUITE_one_tier_higher_max_tier_2_while_an_allied_SENSOR_SUITE_is_within_500m NOTE:+1_to_enemy_detection`. It changes only the bearer's own sheet, caps at tier 2 (so Kitsune is halved, not negated), and drops the net-collapse rule. If Overseer wants true sharing, that's a sheet feature for the UI team, not a catalog line.

### 5) HAILSTORM 40mm ROTARY CANNON (Rebel) — **B6 / S9 / U5 / F6 = 6.5 → REVISE [lean]**
**Scope: CREEP.** It adds SPINUP (a first-turn state) and "feed destroyed" (a new status).

- **Damage.** It has a 320 per turn ceiling through DR 500 (5 × 64). Against the 90mm's 306 that looks close, but the comparison isn't like-for-like.
  - Expected hits at RCL 3 are about 2 or 3, so the realistic figure is about 130-190 per turn.
  - No single 64-point hit triggers a stability check (the Medium Core threshold is 112.5). Every 90mm hit does.
  - So it's a sustained-fire gun, not a 90mm killer. That's fine for the Rebels.
- **Ammo and heat.** `AMMO:15(2)` with no SPARE means **45 rounds, or 9 bursts**, not the "only 3 bursts" in the balance note.
  - Under the real heat model, nine bursts at +3 each is 27 heat.
  - A Light Fission cell (cap 7) is in the danger zone after burst 2 and redlined on burst 3. A Standard core redlines on burst 4.
  - So heat, not ammo, is the real limit, and it's a fair one.
- **EP consistency.** Hikari's own note says baseline rapid-fire guns sit about 1 EP above the mass curve (20mm, 30mm), yet the Hailstorm and the 35mm are priced on the curve. Either state that the feed premium is not a rule, or charge it. I accept 4 EP given the fragility.
- **Derivation:** Cole gives 237, so 6dx11. ✔ Baughn/15 at 40mm gives 128/480. ✔ Lower range scale. ✔

**Lean fix:**
- Delete `SPINUP:ROF_2_on_first_turn_firing`.
- Replace the feed note with nothing. The sheet already disables a weapon when its arm is disabled. Note that it's two-handed, so "the gun arm" was ambiguous anyway.
- Add `SPARE:1`, which gives 6 bursts.
- Keep HEAT +3 per burst.

### 6) SUNSPIKE THERMITE PROJECTOR (Rebel) — **B5 / S8 / U6 / F6 = 6.25 → REVISE [lean]**
**Scope: minor CREEP.** TARGET-HEAT writes into *another* sheet's heat pool, although it is an existing pool. Tank rupture adds a self-damage event.

- **Heat is never shed passively, so +2 per penetrating hit is a permanent debuff.** The target only removes it by spending full turns on vent rolls (about 2.5 per turn on a Standard core). Against a Standard core (cap 10, danger at 5), a target carrying 1 heat from its own shot enters the danger zone after 2 Sunspike hits.
- **The danger zone compounds with everyone's weapons, and low-damage rapid fire gains most** (Medium front DR 500):

  | Weapon | Normal | Danger zone (DR x0.75) | Redline (DR x0.5) |
  |---|---|---|---|
  | 30mm AUTOCANNON (per turn, 5 hits) | 110 | **320** (×2.9) | **530** (×4.8) |
  | 90mm HEAVY RIFLE (per hit) | 306 | 347 | 389 |
  | Sunspike itself (per hit) | 85 | 127 | 169 |

- **Two Sunspikes stack.** Four hits put any core in the danger zone and a Light Fission cell (cap 7) at redline.
- **It hard-counters the heat-gated Reman kit.** Shinobi goes offline, Zanshin loses its Parry, Hakkei collapses at redline, and an Oleum pilot takes rads every turn in the danger zone.
- **Offsets:**
  - The target gains Dodge +1/+2 and Move +1/+2.
  - Range is only 25/100.
  - The Sunspike's own **+3 per shot** is more than the +2 it inflicts. Five shots put its own Standard core at the cap (15 → clamped to 10), so it does limit itself.
  - With no SPARE token, though, it has 15 shots, not 5.
- Damage set "between 30mm and 45mm" and flamer range are extrapolated. 3/51 has no flamer, so there's nothing to check against there.

**Lean fix:**
- `TARGET-HEAT:+2_on_penetrating_hit` → `TARGET-HEAT:+2_on_penetrating_hit_max_+2_per_target_per_turn_cannot_raise_target_above_cap-1`. External heat can then push a target into the danger zone but never redline it.
- Delete the tank-rupture note. The weapon is disabled with its arm.
- Add `SPARE:0`.
- After those changes I'd expect about 7.25.

---
## 2. Quick pass on the other 44

One line each: scores, verdict, Scope tag, and the single most important fix. **[lean]** means that fix alone should get the item to 7.0 or higher.

### Core Empire
- **2. 35mm GARRISON AUTOCANNON**: 7/8/8/8 = **7.75 ACCEPT**. Scope: OK. Through DR 500 it does 172 per turn against the 30mm's 110 at the same 3 EP, which is good but not modest. Add `SPARE:1`. Its 16-round box plus 2 default spares is otherwise 48 rounds.
- **3. IMPACT MAUL**: 7/8/5/7 = 6.75 **REVISE [lean]**. Scope: CREEP (adds a "-1 after a miss" status). Delete `NOTE:-1_to_hit_on_the_turn_after_a_miss`. Forcing the existing stability check on any penetrating hit is the good part, so keep it.
- **4. 60mm RIPPLE ROCKET BATTERY**: 7/7/8/8 = **7.5 ACCEPT**. Scope: OK. It puts 516 through over two salvos (3 EP), against the 60mm pod's single 344 salvo (2 EP), so the proportions are fair. Add `SPARE:0` so it matches the pod.
- **5. OLEUM BREACHING TORCH**: 7/9/5/6 = 6.75 **REVISE [lean]**. Scope: CREEP (rads per hit, and the sheet has no rads counter). Delete `RAD:+5_pilot_per_hit`. The +3 heat per hit is now a real cost, and the 3/51 plasma lance (10) → FORGE (4) mapping is sound.
- **6. MANTLET SHIELD**: 7/8/5/6 = 6.5 **REVISE [lean]**. Scope: CREEP (creates a freestanding cover object). Replace the plant effect with `NOTE:planted_adjacent_ally_applies_Targeter_COVER_vs_attacks_through_it`, which uses the existing COVER mod. It overlaps the TOWER SHIELD's "hydraulic stands" (see Duplicates).
- **7. CROWN-GRADE SPALL LINER**: 6/8/5/4 = 5.75 **REVISE [rework]**. Scope: CREEP. Flat `DR:+60` isn't parsed, the sheet has no "torso" location, and "spall injury" is undefined. Use `PLATE:15 PLATE-USES:1 PLATE-HP:any` (existing sacrificial plating) or cut it.
- **8. SMOKE DISCHARGERS**: 7/9/5/6 = 6.75 **REVISE [lean]**. Scope: CREEP (USES counter, 3-turn duration, divisor-step change). Make it `EFFECT:Ready_attacks_into_or_out_of_smoke_use_Targeter_COVER_-3_until_your_next_turn HEAT:+1/use`, and delete the beam divisor note, which contradicts the HIKARI LANCE's "drops to (3)". The 3/51 standard mecha already carry four smoke dischargers, so the concept is sound.
- **9. FIELD WORKSHOP RIG**: 6/8/5/6 = 6.25 **REVISE [lean]**. Scope: CREEP (USES per tier, Mechanic skill isn't on the sheet). Use `EFFECT:Ready_plus_ENGINEERING_roll_restores_HP HEAT:+2/use` and drop USES. Also note that 10-30 HP is trivial against 113-300 HP locations (see Systemic).
- **10. HERALDIC COMMAND MAST**: 7/9/5/5 = 6.5 **REVISE [lean]**. Scope: CREEP (squad-wide designation state, and Will is not on the sheet). Delete `NOTE:allies_in_radius_+1_Will_vs_fear` and turn the ally bonus into an ally ROLL MOD of +1 (existing field). It stacks badly with DRESSED-LINE (see Stacking).
- **11. OLEUM CHELATION INJECTOR**: 7/8/3/3 = 5.25 **REVISE [rework]**. Scope: CREEP (rads, FP, DX and USES, none of which the sheet tracks). Shelve it until the rads counter ships.
- **12. RECOVERY TOW WINCH**: 7/8/5/6 = 6.5 **REVISE [lean]**. Scope: CREEP (cable HP is sub-location HP, and the ST contest uses a stat that isn't on the sheet). Delete `cable_HP:15` and the snag. It's cut when Utility is disabled.
- **13. CASTELLAN SUPERHEAVY FRAME**: 7/9/7/7 = **7.5 ACCEPT**. Scope: minor (BULK isn't parsed). Delete `BULK:-1_Dodge`, since HND 0 already lowers Dodge through the sheet's Dodge formula. 200 HP is 3/51's Heavy figure, and EP 9 fits (HP − 87.5)/12.5 exactly.
- **14. TL8-ARMORED CARRIER**: 7/8/7/7 = **7.25 ACCEPT**. Scope: OK (CREW/CARGO are labels). By the stated rule, 2 + 110/20 = 7.5 and the bay costs -2, which gives 5.5. Say which way it rounds.
- **15. ANCESTRAL THERMAL-MASS CORE**: 4/8/6/5 = 5.75 **REVISE [rework]**. Scope: CREEP (`RUGGED`, but there is no crit table). **VENT polarity is inverted.** VENT 1 is the *best* vent, sheding 4.6 per action against the Standard core's 2.5. So "vents slowly" is false, and with HEAT 15 at 3 EP it out-heats the 5 EP HEAVY FUSION CORE. Set `VENT:3` and delete `RUGGED`.
- **16. LONG-SERVICE THRUSTERS**: 7/8/6/6 = 6.75 **REVISE [lean]**. Scope: CREEP (`RUGGED` refers to a crit the sheet doesn't have). Delete `RUGGED:first_thruster_crit_each_sortie_ignored`. SR +2 against HND -1 nets about +1 SR, which is fine for the Empire.
- **17. DRESSED-LINE FIRE CONTROL**: 6/8/4/5 = 5.75 **REVISE [rework]**. Scope: CREEP (counts allies firing at the same target). Without VOLLEY it's just STANDARD FIRE CONTROL. Either cut it, or make it `ACC-ALL:+1 ACC-FAR:+1` at EP -1, a long-range line suite that needs no ally state.

### Rebels
- **19. BREACHER SCATTERGUN**: 7/8/8/7 = **7.5 ACCEPT**. Scope: OK (uses the existing REAR checkbox). Baughn/15 per slug gives 106/425 ✔, and the spread-limited 40/150 is a fair extrapolation. Add `SPARE:1`.
- **20. RIPSAW CHAIN BLADE**: 7/8/5/6 = 6.5 **REVISE [lean]**. Scope: CREEP (adds a jam status). Delete `NOTE:a_shield_Block_or_Parry_jams_it_until_a_Ready` and keep the crit-fail destruction. The melee fit gives 83.4, which should round to 83d (290.5), not 84d.
- **22. HORNET 80mm ALPHA POD**: 7/8/6/7 = **7.0 ACCEPT**. Scope: minor (cook-off event). The HEAT fit gives 290, so 6dx14 ✔, and it has SPARE:0 ✔. Tie the cook-off to "the pod's location takes a hit over its stability threshold", which uses the existing trigger.
- **23. SALVAGED LASER CARBINE**: 5/8/6/6 = 6.25 **REVISE [lean]**. Scope: minor CREEP (lens-crack status, weather divisor). Under real heat, +6 per turn redlines a Standard core in 2 turns, all for 192 per turn against the 45mm's 351. Set `HEAT:+1/shot` and delete the lens note. Cole on 600 kJ at a 30mm spot gives 236 ✔ (extrapolated). 3/51's rainbow laser is (3) at TL10, so (3) here is consistent.
- **24. SALVAGE PLATING KIT**: 6/8/3/3 = 5.0 **REVISE [rework]**. Scope: CREEP (flat DR isn't parsed, and stripping 25 DR per location per hit is a tracking job). Use the existing token per tier: `PLATE:15/25/35 PLATE-USES:1 PLATE-HP:any`. Also, tier 3's +75 is +15% on DR 500, which beats REINFORCED ARMOR.
- **25. REACTIVE ARMOR BRICKS**: 6/8/4/5 = 5.75 **REVISE [lean]**. Scope: CREEP (per-location first-hit tracking, USES 6, ally splash). Use `EFFECT:+2_armor_divisor_steps_vs_shaped_charge/rockets NOTE:does_not_stack_with_SPACED_ARMOR_PANELS`, which works like SPACED ARMOR with no counters.
- **26. GRAPPLING HARPOON**: 7/8/5/6 = 6.5 **REVISE [lean]**. Scope: CREEP (cable HP, ST contest). Use `JUMP:reel_up_to_100m_to_terrain NOTE:Piloting_roll_to_land_cleanly`, which reuses the JUMP JETS pattern.
- **27. DECOY BEACON DROP**: 7/8/4/5 = 6.0 **REVISE [lean]**. Scope: CREEP (beacon object HP, 3-turn duration, USES). Use `EFFECT:Ready_next_ranged_attack_on_you_or_an_adjacent_ally_this_turn_must_win_SENSORS_vs_your_EW_or_miss HEAT:+2/use`. SENSORS and EW are both sheet skills.
- **28. JURY-RIG FIELD KIT**: 7/8/5/5 = 6.25 **REVISE [lean]**. Scope: CREEP (USES, and Mechanic isn't on the sheet). Use `EFFECT:Ready_plus_ENGINEERING-2_restores_a_disabled_limb_to_1_HP NOTE:fail_by_5+_limb_WRECKED HEAT:+2/use`. "Disabled" here follows [A1].
- **30. TL8-TECHNICAL RAIDER**: 7/8/6/6 = 6.75 **REVISE [lean]**. Scope: CREEP (FRAGILE HT roll, and vehicle HT isn't tracked). Delete `FRAGILE`. 65 HP and DR 150 are fragile already, and a disabled Locomotion location already immobilizes it.
- **31. OLEUM SPIKE CELL**: 6/8/3/4 = 5.25 **REVISE [rework]**. Scope: CREEP (rads per sortie, per-turn rads, BREACH HT roll). Its VENT 3 is the *worst* vent, so "vents well" is backwards. Use `VENT:2`, drop BREACH and the per-turn rads, and keep one flat `RAD:40/sortie` only once rads ship.
- **32. POGO-JET HOP THRUSTERS**: 7/8/6/6 = 6.75 **REVISE [lean]**. Scope: minor CREEP (FRAGILE refers to a crit). Delete `FRAGILE`. The free quarter-Move hop uses the existing JUMP token.
- **33. BURST CRUNCHER FIRE CONTROL**: 6/8/6/5 = 6.25 **REVISE [rework]**. Scope: CREEP (manual RoF-step override and double ammo, while the sheet computes `rofBon` itself). It's effectively a LINKED (BALLISTIC) variant. Cut it, or make it `ACC-BALLISTIC:+1 ACC-ROCKET_MISSILE:-1` at EP 0.

### Remans
- **35. NAGINATA HIGH-FREQUENCY GLAIVE**: 7/9/5/6 = 6.75 **REVISE [lean]**. Scope: CREEP (the sheet has no reach, and the two-target sweep is an extra roll). Delete REACH and both notes. 80d(4) two-handed at 3 EP works as a plain Reman polearm (155 through DR 500). The melee fit gives 80.2 ✔.
- **36. WAKIZASHI GUARD BLADE**: 6/9/5/5 = 6.25 **REVISE [lean]**. Scope: CREEP (free riposte is an extra attack, and the Parry bonus token isn't parsed). Its (5) at 2 EP skips the dulling that the accepted KAGEROU TACHI pays for. Set the divisor to `(4)` (AVG stays 234.5) and delete the riposte.
- **37. HIKARI PARTICLE LANCE**: 6/9/6/7 = **7.0 ACCEPT**. Scope: minor (weather condition). Under real heat, +5 per shot means 2 shots redline a Standard core, so heat genuinely throttles it. Against 3/51's particle beam at **5dx20(5)** (AVG 350), FORGE's 6dx21 (441) is **26% hotter**. Hikari's Cole extrapolation overshoots the source here. Use 6dx17 (357) to match 3/51, or keep it as a Reman premium and say so. Delete the weather clause and leave smoke to SMOKE DISCHARGERS.
- **39. HAKKEI DEFLECTOR FIELD**: 7/9/7/7 = **7.5 ACCEPT**. Scope: OK (uses the shield HP and redline state the sheet already has). DR 260 is the best shield DR in the catalog at 5 EP, and it leaves the hand free. +3 per Block now accumulates, so three blocks put a Standard core at 9/10. Consider `HEAT:+2/Block`.
- **40. LACQUERED O-YOROI PLATING**: 7/9/7/8 = **7.75 ACCEPT**. Scope: OK (`DR:+15%` is a native token, and LOGISTICS is a campaign note). +15% at 4 EP against REINFORCED's +10% at 3 EP is fair.
- **41. KAESHI POINT-DEFENSE LASER**: 7/9/5/6 = 6.75 **REVISE [lean]**. Scope: CREEP (an extra intercept roll every turn). Follow the baseline pattern (`NOTE:+2_Active_Defense_vs_missiles` on the 60mm pod): `DEF:+2_Dodge_vs_ROCKET/MISSILE HEAT:+2/turn_used`.
- **42. SHUKUCHI FLASH-STEP**: 6/9/4/5 = 6.0 **REVISE [lean]**. Scope: CREEP (USES 3 per sortie, and an ambiguous second Dodge after a hit). Use `DEF:+3_to_one_Dodge_per_turn_declared_before_rolling HEAT:+4/use` and delete USES. Heat is the limiter.
- **43. TSUKUROI NANITE MENDER**: 7/9/5/6 = 6.75 **REVISE [lean]**. Scope: CREEP (USES, shrine refill). Use `HEAT:+2/use` and drop USES. It duplicates the WORKSHOP RIG (see Duplicates).
- **44. KAGURA OLEUM LANTERN**: 5/9/3/3 = 5.0 **REVISE [rework]**. Scope: CREEP (squad radius, rads). `VENT:-1_while_lit` is a **buff** under the real model, so it should be `VENT:+1_while_lit`, and the sheet doesn't parse VENT on a U item anyway. Shelve it until rads ship.
- **45. SHINOBI SIGNATURE DAMPERS**: 7/9/7/7 = **7.5 ACCEPT**. Scope: OK (DETECT copies the ECM SUITE's token, the tiers are native, and the heat gate uses the existing zone). -6 at tier 3 matches 3/51's Stealth feature (-6 vs IR/radar).
- **46. TENGU-CLASS SKY FRAME**: 6/9/5/6 = 6.5 **REVISE [lean]**. Scope: CREEP (an AIRTIME per-sortie counter). Make it `NOTE:+2_HEAT_per_turn_airborne` so flight time comes out of the heat pool. Against the LIGHT FRAME at 3 EP it has +50 DR, +1 HND and 30S air, so it's nearly a dominator, and heat is a fitting brake.
- **47. TL10-KAGO HOVER TANK**: 7/9/5/6 = 6.75 **REVISE [lean]**. Scope: CREEP (the 20 HP skirt is sub-location HP). Replace SKIRT with `NOTE:Locomotion_disabled_halves_MOVE`, since vehicles already have a Locomotion location. EP 2 + 140/20 = 9 ✔.
- **48. TAMASHII RESONANCE CORE**: 4/8/6/4 = 5.5 **REVISE [rework]**. Scope: minor (ECM is cross-sheet but text-only). **VENT polarity is inverted.** VENT 3 is the *worst* core vent, and the "shutdown" that drops VENT to 1 actually *improves* it. Set `VENT:1` and use `SHUTDOWN:ECM_SUITE_tier_3_in_radius_raises_VENT_to_3`.
- **49. KAZE-NO-MAI VECTOR THRUSTERS**: 7/9/8/8 = **8.0 ACCEPT**. Scope: OK. HND +2/SR -1 is sign-consistent with the thruster EP convention (a positive EP raises capacity, so the extra HND correctly lowers it).
- **50. ZANSHIN PREDICTIVE LINK**: 6/9/6/4 = 6.25 **REVISE [lean]**. Scope: minor (Parry token). **`ACC-RANGED` isn't a class the sheet knows, so the -1 never applies.** Use `ACC-MELEE:+3 ACC-BALLISTIC:-1 ACC-ROCKET_MISSILE:-1 ACC-ELECTROMAGNETIC:-1 ACC-BEAM:-1 ACC-INCENDIARY:-1`, and delete `DEF:+1_Parry` (it isn't parsed).

---

## 3. Derivation spot-checks (10 items recomputed from scratch)

| Item | Inputs (Hikari) | My recompute | Line | Consistent? | Primary-source (3/51) note |
|---|---|---|---|---|---|
| 35mm Garrison | 0.55 kg, 1,175 m/s, 18mm core, 35mm cal | Cole 218.1 → x10.4; Baughn/15 142/512 | 6dx10, 142/512 | ✔ | No TL8 KE gun in 3/51 |
| 40mm Hailstorm | 0.95 kg, 1,000 m/s, 20mm, 40mm | 237.1 → x11.3; 128/480 | 6dx11, 128/480 | ✔ | 3/51 TL10 40mm railgun 6dx25(3) (EM, not powder) |
| Gauss Longbow | 6 kg, 950 m/s, 30mm core, 60mm sabot | 516.1 → x24.6; 199/637 | 6dx25(5), 200/640 | ✔ dmg / ⚠ rounding up | Matches 3/51 railgun *dice*, but 3/51 is **(3)**; (5) is UT **APHD (TL11)** |
| Remote Bits | 0.4 kg, 900 m/s, 15mm | 148.3 → x7.06; 190/617 | 6dx7 | ✔ | n/a |
| Scattergun slug | 0.6 kg, 750 m/s, 25mm | 129.1 → x6.15; 106/425 | 6dx6 | ✔ | n/a |
| Laser Carbine | 600 kJ, 30mm spot | 235.7 → x11.2 | 6dx11(3) | ✔ (extrapolated) | Rainbow laser 6dx25(3) at TL10: divisor ✔ |
| Particle Lance | 2.5 MJ, 40mm | 452.4 → x21.5 | 6dx21(5) | ✔ internally | **Diverges:** 3/51 particle beam 5dx20(5) = 350 (FORGE +26%) |
| 105mm Mortar | HEAT fit d = 105 | P 1,946 → 486; 131/656 | 6dx23(4) | ✔ | 3/51 missiles (10) vs laminate (2x DR vs shaped) ≈ (5); FORGE (4) ✔ |
| Hornet 80mm | HEAT fit d = 80 | 1,161 → 290; 100/500 | 6dx14(4) | ✔ | as above |
| Melee fit (Maul 3.2 t / Ripsaw 1.4 t / Naginata 1.1 t / Wakizashi 0.4 t / Torch 0.8 t) | 79 + 13 ln t | 94.1 / 83.4 / 80.2 / 67.1 / 76.1 | 94 / **84** / 80 / 67 / 76 | ✔ except Ripsaw (83) | 3/51 points to LTC2 SM scaling plus vibro/mono (UT p.164); the FORGE fit is a stand-in |

**Verdict: the formulas were applied consistently.** I found three small deviations:
- **(a) Rounding is inconsistent.** Longbow 24.6 and Ripsaw 83.4 round up, while everything else rounds down or to nearest.
- **(b) Cole is evaluated on core diameter but Baughn on bore calibre.** That's consistent across items but consequential. Running the Longbow's Baughn on its 30mm core would give 398/1017 instead of 199/637. Hikari chose the conservative option, which is good. She should state it as a rule.
- **(c) The Cole anchor check is slightly off.** Her own claim that "9mm = 9.4 points" recomputes to 8.8, still close to 2d+2.

The EP mass rule (2.5√t) was applied exactly to all hardware. The kW rule was applied exactly to electronics, and the chassis rules were applied with stated rounding.

**Where Cole/Baughn diverge from 3/51 (the primary reference):**
- Divisors on EM guns: 3/51 has (3), FORGE gives (4)/(5).
- Beam damage: the particle lance runs +26% over 3/51.
- Ranges: 3/51 TL10 ranges run to thousands of yards. FORGE's lower scale is a deliberate compression, so that one is not a defect.
- ACC: 3/51 Acc is 5-18, and FORGE caps around 6. This is also deliberate.
- Beam ammo: 3/51 beam "shots" come from the energy bank (15/30/60). FORGE converts them to heat, which under the real model is much stricter. A Standard core takes 2 lance shots to redline, while a 3/51 medium mecha gets 30 shots.

**Fixed decisions enforced:**
- **Lower range scale ✔.** Every batch RNG is ≤ 750. The accepted SKYFALL at 250/900 now breaks the batch's own ceiling (see §6).
- **Melee without a multiplier ✔.**
- **Percent MOVE adds ✔.** No batch item multiplies.
- **Heat:** re-judged entirely under the corrected accumulate-and-vent model.

---
## 4. Cross-item stacking problems

1. **Focus-fire ACC tower.** On a designated target, a shooter can stack all of these:
   - DRESSED-LINE (+1, plus up to +2 volley)
   - HERALDIC MAST (+1)
   - ENHANCED TARGETING SUITE (+2 ranged)
   - BASTION ANCHOR (+1 ranged)
   - Aim and ACC 4-6

   That's **+7 before Aim**. Three of those sources are new or recent. Fix: delete VOLLEY (lean fix in item 17), and give the Mast's bonus the note `does_not_stack_with_other_ally-granted_bonuses`.
2. **Sensor-tier cascade.** MESH NET propagates tier 3, which negates KITSUNE, SHINOBI (all tiers), DECOY BEACON, and SMOKE together, and makes MORTAR spotting free. That's the single largest stacking problem in the batch. Fix: see item 4 (personal, max tier 2).
3. **External heat into the DR loss of the heat zones.** Two SUNSPIKES, plus the target's own weapon heat, plus enemy Kitsune/Hakkei/Shukuchi self-heat, put a Reman in the danger zone or redline fast. That multiplies every ally's damage (the 30mm gains up to x4.8 per turn at redline) and also triggers Oleum per-turn rads and collapses Hakkei. Fix: the per-turn and cap-1 limit in item 6.
4. **Anti-rocket triple layer.** SPACED ARMOR PANELS (+1 divisor step) + REACTIVE BRICKS (negate) + KAESHI (intercept on 12 or less) leaves the Hornet, the Ripple, the 60mm/80mm/120mm and the Mortar nearly worthless against one 7-EP defensive package. The rocket class is the Rebels' alpha-strike identity. Fix: reactive becomes a non-stacking SPACED variant (item 25), and Kaeshi becomes a Dodge bonus (item 41).
5. **Rear-arc doubling.** BITS (auto-REAR) + SCATTERGUN (rear specialist) + the REAR checkbox stacked with GAP (x0.25 effective DR). The sheet allows REAR and GAP at the same time. Fix: give the Bits `NOTE:cannot_combine_with_GAP`.
6. **Purge Valve + Oleum heat items.** Under the real model, a single reset to 0 is worth about 4 vent turns, and it combines with the OLEUM TORCH and any heat-gated item. See §6: the Purge Valve is under-costed.
7. **Two-weapon tempo.** The SKYFALL's off-turn can be spent firing a second weapon, so Skyfall + HAILSTORM alternate with no dead turns. 3/51 limits mecha to one weapon a turn (two with All-Out Attack). FORGE has no such limit. **[ASSUMPTION A4]**: one ranged attack per turn unless All-Out. Overseer should confirm.

## 5. Duplicates and near-duplicates

- **MANTLET SHIELD and TOWER SHIELD.** The Tower's flavor already has "hydraulic stands" and "deployable wall". Fold the Mantlet in as a Tower tier, or cut it.
- **FIELD WORKSHOP RIG and TSUKUROI NANITE MENDER** fill the same repair niche. Fine as faction variants, but give them one shared repair token so the sheet handles both.
- **BURST CRUNCHER and LINKED FIRE CONTROL (BALLISTIC).** Cut one.
- **DRESSED-LINE (without VOLLEY) and STANDARD FIRE CONTROL** would be identical.
- **REACTIVE BRICKS, SPACED ARMOR and KAESHI** all do the same anti-rocket job (see Stacking 4).
- **SCATTERGUN and KAGEBOSHI BITS** both do the rear-armor job, and the Bits obsolete the Scattergun at range.
- **SMOKE DISCHARGERS and KITSUNE.** Both are a flat ranged penalty (-3 symmetric versus -2 one-way). That's acceptable, but their beam rules **contradict each other**: smoke says beams lose 1 divisor step, the Lance says (5) drops to (3).
- **SHINOBI DAMPERS and ECM SUITE.** Different scope (self versus area). OK.
- **OLEUM SPIKE CELL and LIGHT FISSION CELL.** Both are VENT 3 light cores. With the VENT fix, the Spike Cell becomes distinct.

## 6. Systemic issues

1. **VENT polarity is inverted in four batch items** because they were written under the old "higher VENT vents more" reading: TAMASHII, ANCESTRAL, KAGURA LANTERN, and the OLEUM SPIKE intent text. Under the real model, lower is better. This is the biggest *function* bug in the batch.
2. **The missing SPARE token triples ammo.** The sheet defaults SPARE to 2, so every new weapon without `SPARE:` carries 3x its stated magazine. That includes the Mortar (12), the Longbow (12), the Sunspike (15), the Hailstorm (45 rounds) and the Garrison (48). Hikari's "only N rounds" balance claims are all off by 3x. Add an explicit SPARE to every ammo weapon. The accepted SKYFALL has the same issue (9 rounds).
3. **New weapon classes escape LINKED FIRE CONTROL penalties.** BEAM, ELECTROMAGNETIC and INCENDIARY take no -1 off-spec penalty from any LINKED suite, because the baseline penalties name only BALLISTIC, ROCKET_MISSILE and MELEE. Either add those classes to the Linked TIER entries or map the new items onto existing classes. Note also that the MORTAR sits in ROCKET/MISSILE, so it gets the Missile spec's +2 and is hit by every anti-rocket item.
4. **Counters and statuses are replacing heat as the limiter.** USES/sortie, cable HP, bit HP, skirt HP, AIRTIME, jam, lens crack, spin-up and RUGGED crit all appear in the batch. **Heat is the sheet's universal limiter**, and since it now genuinely accumulates, it is the right lean replacement for almost every one of them. `HEAT:+N/use` is the pattern I recommend throughout.
5. **Flat DR and invented locations.** `DR:+60_torso_only` and `DR:+25/+50/+75` are not parsed, and the sheet has no "torso". Only `DR:+N%` and `PLATE:` work.
6. **Repair is out of scale.** 10-30 HP repairs against 113-300 HP locations and 300+ penetrating hits are rounding error. If repair matters, express it as a fraction (for example "restore 10% of max HP") or cut it. **[ASSUMPTION A5]**: repair is meant to be minor.
7. **Ambiguous ACC wording.** A weapon's `ACC:` applies only on Aim, but `ACC:+1_ranged` on U items (BASTION, the MAST) reads like a flat bonus. Standardize: G-slot `ACC-*` tokens are flat to-hit bonuses, and nothing else should say ACC.
8. **The second frame DR value is unused** (`ARMOR_REF` is all 0). 3/51 applies the lower DR to arms, legs and non-front arcs, so a 3/51-faithful sheet would map limbs to index 1. That would change every limb-damage figure in this review by about 2x. **Flag for Overseer.**
9. **3/51 versus FORGE divisors.** 3/51 TL10 railguns are (3) and the particle beam is (5). FORGE's Rebel (4) railgun and Reman (5) gauss sit *above* the source. That's acceptable as setting license, but it should be documented as such.

## 7. Top 5 problems (in order)

1. **VENT polarity is inverted.** TAMASHII's "shutdown" is a buff, the ANCESTRAL core out-heats the Heavy core for 3 EP, and the LANTERN's -1 VENT is a buff.
2. **The MESH NET's squad-shared tier 3** negates the whole Reman stealth suite and trivializes spotting. It's also the worst scope creep in the batch.
3. **The KAGEBOSHI BITS** have unlimited ammo and no heat, put 256 per turn into rear armor from any facing, and add four sub-location HP pools plus an undefined per-turn EW roll.
4. **The missing SPARE token triples ammo** on every new weapon, which invalidates the ammo-limited balance claims (Mortar, Longbow, Sunspike, Hailstorm, Skyfall).
5. **SUNSPIKE's uncapped target heat** compounds with team fire (30mm x2.9 in the danger zone, x4.8 at redline) and hard-counters every heat-gated Reman item. Close behind: the **MORTAR's** spotter rule makes the -10 trivial, and its ACC is illegal under High-Tech.

---

## 8. Already-accepted items (pass 5): heat re-tune and scope check

Exchange rate (Standard core, Eng 14): **1 vent turn ≈ 2.5 heat.** Heat no longer bleeds off on its own.

| Item | Heat under the real model | Verdict | Suggested value | Scope | Leaner version |
|---|---|---|---|---|---|
| **ICARUS OVERDRIVE WINGS** (+4/activation) | Light Fission (cap 7): burn 1 = 4 (danger), burn 2 = 8 → **redline**. Standard: burn 3 = 12 → redline. The design goal "three burns just below danger" is unreachable. | **Over-penalized** | `HEAT:+3/activation`, with the burn cap removed | CREEP: `HP:20` (sub-location), "3 burns per sortie" (counter), rear-hit destruction (status) | Drop `HP:20`, the burns-per-sortie limit, and the rear-hit note. Wings are destroyed when the Utility location is disabled. Heat alone limits burns: Light 3/6/9 means danger on the 2nd burn and redline on the 3rd. |
| **KITSUNE MIRAGE FIELD** (+3/turn active) | Standard: danger on turn 2, redline on turn 4. From turn 2 its -2 to-hit is outweighed by its own DR x0.75. | **Over-penalized** (self-defeating) | `HEAT:+1/turn_active` (danger turn 5, redline turn 10) | Minor CREEP: "drops for 1 turn after 100+ penetrating" is a timer | `NOTE:drops_on_any_failed_stability_check` (existing event). Keep the sensor-tier lines. |
| **ICARUS AFTERBURNER STACK** (+2/turn at full MOVE) | Standard: danger on turn 3, redline on turn 5 of full-speed running. The capacity trade (0 EP against Heavy's +3) already pays most of its cost. | **Mildly over-penalized** | `HEAT:+1/turn_at_full_MOVE` (I raised it to +2 under the wrong model; reverting) | OK | none needed |
| **SKYFALL CAPACITOR RAILGUN** (+4/shot) | Shots 1-3 give 4/8/12 → redline on shot 3. Venting on recharge turns (about 2.5 each) leaves about 7 after 3 shots. With the default 2 SPARE it has **9 rounds**, not 3, so 36 heat if it empties. | **Mildly over-penalized per shot; under-limited on ammo** | `HEAT:+3/shot` with `SPARE:0` | Minor CREEP: "fired last turn" state, a 20+ arm threshold | See the full re-score below |
| **OLEUM VIS CORE** (HEAT 12, VENT 2) | Pass 4 compared it as "matching the Heavy core". Under the real model **VENT 2 is clearly worse than the Heavy core's VENT 1** (2.5 against 4.6 heat per vent at Eng 14). With no passive bleed, Oleum pilots spend more turns in the danger zone, so its +10 rads per turn becomes a real recurring cost. | **Not over-penalized on heat; rads now bite harder** | Keep `HEAT:12 VENT:2`. Reduce to `+5_rads/turn_ending_in_danger_zone` if the rads counter ships. | CREEP: rads (not on the sheet; @Kaito has the request), per-turn rad increments | `RAD:25/sortie NOTE:+25_rads_if_the_sortie_reached_redline`. That's one checkbox instead of a per-turn tally. |
| **OLEUM PURGE VALVE** (not on the parent's list, but it's affected) | Resetting to 0 is worth about 4 vent turns at Eng 14 on a Standard-class core. That's much more than was assumed when it was tuned. | **Under-costed** | `EP:2` | CREEP: rads to every pilot within 50m (squad-wide), +50 pilot rads | `EFFECT:once_per_sortie_reset_HEAT_to_0 NOTE:no_attacks_next_turn`, and drop the splash. Keep +50 rads only once the counter ships. |
| **KAGEROU TACHI** | no heat | n/a | n/a | CREEP: dulling counter (3 hits), Mechanic roll | Drop the dulling. Either (a) keep (5) and raise to **EP 5**, or (b) keep EP 4 at **(4)**, which gives 294 - 125 = 169 through DR 500. I prefer (a) for the Reman identity. |
| **MUSHA-CLASS KNIGHT FRAME** | no heat | n/a | n/a | CREEP: `BRITTLE` ("below half HP" doesn't say which location; the sheet has per-location HP only) | Drop BRITTLE and set `SR:1` flat. The logistics note can stay as campaign text. |
| **REDUNDANT ACTUATOR HARNESS** | no heat | n/a | n/a | CREEP: per-limb "first crippling hit" state, then penalties, then the next hit cripples | `PLATE:50 PLATE-USES:1 PLATE-HP:any`, the sheet's native sacrificial plating, which is exactly "survive one bad hit". Rename the effect. |
| **BASTION SIEGE ANCHOR** | no heat | n/a | n/a | Minor CREEP: "anchored" toggle | Acceptable as a manual toggle. Optionally make it a G-slot `ACC-FAR:+1 SR:+2` package with MOVE 0 noted. |
| **SHRINE-GRADE SHIELDING** | no heat | n/a | n/a | CREEP (inherited): only meaningful with rads | Park it alongside the rads counter. |
| **SHINGAN**, **ICARUS SKIRMISH FRAME**, **TL8-SIEGE CRAWLER** | no heat | n/a | n/a | OK | none |

### Full re-score: SKYFALL CAPACITOR RAILGUN (as accepted, RNG 250/900, corrected heat model)
`A|SKYFALL CAPACITOR RAILGUN|5|ROF:1 DMG:6dx25(4) AVG:525 ACC:5 RCL:3 RNG:250/900 AMMO:3(1) HEAT:+4/shot NOTE:capacitor_recharge_cannot_fire_on_consecutive_turns NOTE:crit_fail_on_attack_roll_destroys_weapon NOTE:20+_penetrating_to_mounting_arm_disables_it …`

**B6 / S8 / U6 / F7 = 6.75 → REVISE [lean]** (it was 7.25 in pass 3).

- **Range.** 250/900 is 1.67x the 90mm's 1/2D and 1.8x its max, and it **exceeds the 750 ceiling** that every batch-2 weapon respects. At 150-250 yards it still deals full damage, where the 90mm is halved.
- **Ammo.** With the default SPARE it has **9 rounds** against a stated 3, which undoes the scarcity that justified pass 3's score.
- **Heat** is now real: redline on shot 3 without venting. The off-turn vent makes that manageable, so the cost is real but no longer punitive.
- **Divisor.** 3/51's 40mm railgun is 6dx25**(3)**, so the Skyfall matches the source dice exactly and sits one divisor step above it. That's acceptable as Rebel "hand-wound" tuning, but it should be noted.
- **Usability.** The alternate-turn lockout is one more state to track (minor creep). The 20+ arm threshold duplicates the sheet's own weapon disable.

**Lean fix:** `RNG:250/900` → `RNG:200/750`, add `SPARE:0`, set `HEAT:+4/shot` → `HEAT:+3/shot`, and delete `NOTE:20+_penetrating_to_mounting_arm_disables_it`. With those changes I'd expect **7.5**.

---

*Ryuji, FORGE-OS Balance Critic. Every number above was either read from the sheet code or recomputed. Where a number is an assumption, it is tagged [A1]-[A5] for Overseer.*
