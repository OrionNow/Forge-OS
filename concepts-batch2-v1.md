# FORGE-OS Catalog Concepts, Batch 2 (50 concepts)

Text and ideas only. Nothing in `terminal.html` was edited. Every line uses the 13-field RAW format `CAT|NAME|EP|STATS|CLASS|MASS|LABEL|LABEL-VALUE|ROLE|FLAVOR|TWO-HANDED|TL|EXPERIMENTAL`. One thing to know: the v5.0.1 parser (`rebuildDB`) also reads an optional 14th field, `SHOULDER-FIREABLE` (`p[13]`), and every baseline line carries it. 13-field lines load with shoulder-fire off, the same as the accepted pass-5 lines. Add `|1` to the end of any launcher that should be shoulder-fireable.

Validation (script): **PASS**. All 50 lines have 13 fields, CAT is in ADUFTRG, EP is an integer, there are no backticks or `<>`, every STATS token is LABEL:VALUE with no commas, frames carry all six frame tokens and no extra token starts with a frame-token name, chassis MASS is [DATA_NOT_FOUND], no names collide with the baseline (47) or pass 5 (14), AVG arithmetic is correct, (5) appears only on Reman items, Empire/Rebel divisors are (3)/(4), every RNG max is 750 or less, and no per-turn heat cost is 3 or less. The lines and TIER entries were also parsed with the terminal's own `rebuildDB`, `statsOK`, `frameOK` and `safeField` logic in Node: 0 rejects.

## EP logic (inferred from the baseline before any EP was set)

EP stands for the weight and energy of mounting an item. The baseline follows three regularities, and every new EP below cites the one it uses.

1. **Mass-limited hardware (weapons, armor, mobility gear): EP is about 2.5 x sqrt(mass in t)**, rounded half-up. A least-squares fit over the 21 baseline items with a listed mass (20mm through the Pile Bunker, the shields, the armor and the mobility gear) gives EP = -0.23 + 2.54 x sqrt(t), with an RMS error of 0.57 EP. Some checks: 90mm 4.8 t gives 5.3 (listed 5); 120mm 5.5 t gives 5.7 (5); 45mm 2.3 t gives 3.6 (3); Vibroblade H 2.1 t gives 3.5 (3); Pile Bunker 3.6 t gives 4.6 (4). Rapid-fire guns sit about 1 EP above the curve (20mm: 1.4 against 2; 30mm: 2.4 against 3), which reads as feed and drive power.
   - **Shields** run on a steeper curve, **EP is about 3 x sqrt(t)**: 0.5/1.4/2.9/5.2 t give 2.1/3.5/5.1/6.8, against 2/3/5/7 listed.
2. **Power-limited electronics: EP equals the sustained kW draw.** The ECM SUITE is 2/4/6 kW for 2/4/6 EP, and the SENSOR SUITE is 3/5/7 kW for 3/5/7 EP, both exact. When an item has mass and draw, **EP = max(mass term, kW)**: for ECM tier 1, max(1.4, 2) = 2.
3. **Energy spent per shot or per use is HEAT, not EP.** Baseline vibroblades list a power cell but are priced by mass. The Pile Bunker pays 1 heat per charge. So beam weapons, Oleum-fed tools and active defenses price their mass in EP and their energy in HEAT.

**Chassis components (EP is capacity, or a signed modifier):**
- Mech frames: **EP = (ST/HP - 87.5) / 12.5**. Light/Medium/Heavy at 125/150/175 HP give 3/5/7, exact. The Musha (165 HP) gives 6.2, so 6, which also fits. The Icarus frame (110 HP, 5 EP) is the deliberate exception, buying capacity with its DR.
- Vehicles: **EP = 2 + HP/20**. TANK 120 gives 8, Crawler 160 gives 10, Fighter 90 gives 6.5, Helo 80 gives 6.
- Reactors: **EP = ST/HP% / 15**. Light 30% gives 2, Standard 50% gives 3.3, Heavy 70% gives 4.7, Oleum 60% gives 4. HEAT, VENT, HND and SR are traded around that.
- Thrusters: **EP = MOVE% / 12**. 15/25/40% give 1.25/2.1/3.3, against 1/2/3. An HND +1 / SR -1 swap nets to zero.
- Targeting: **EP = 1 - 1.5 x ACC-ALL**. +0 gives 1, +1 gives -0.5 (0), +2 gives -2. A specialist +2/-1 package runs about -1.

## Damage logic (how DMG, divisor, RNG and ACC were derived)

**Kinetic rounds** use Douglas Cole's formula from Pyramid, "Interior and Terminal Ballistics for GURPS": damage points = sqrt(KE^1.04 / Xsect^0.314) / 13.3926, with KE in joules and Xsect as the penetrator cross-section in m^2. Points are converted to `6dxM` with M = points / 21. The formula reproduces 9mm = 2d+2 (9.4 points), which is its own anchor.

**Range** uses Samuel Baughn's simplified GURPS formulas: 1/2D (yd) = sqrt(m) x v^1.5 x 2.5 / calibre(mm), and Max = sqrt(1/2D) x 120 + 1/2D. Dividing the result by 15 lands on the baseline's lower-scale numbers.

**Baseline back-check.** The projectile assumptions are mine unless marked. The 30mm mass and velocity come from Wikipedia's GAU-8 page.

| Baseline item | Assumed projectile | Cole points | Baseline AVG | Delta | Baughn/15 RNG | Baseline RNG |
|---|---|---|---|---|---|---|
| 20mm (6dx4(3)) | 0.13 kg @ 850 m/s, 20mm | 71 | 84 | -15% | 74/342 | 1800/7200 (this is the one line still on the old unscaled ranges) |
| 30mm (6dx9(3)) | PGU-14/B API 0.395 kg @ 1,010 m/s (Wikipedia), 16mm DU core assumed | 163 | 189 | -14% | 112/440 | 113/458 |
| 45mm (9dx9(3)) | 1.4 kg @ 900 m/s, 24mm core (fictional calibre) | 246 | 283.5 | -13% | 118/455 | 135/518 |
| 90mm (9dx15(3)) | 7.6 kg HVAP-class @ 1,020 m/s, 45mm core | 553 | 472.5 | +17% | 166/566 | 150/500 |

The baseline KE guns land within about 17% of Cole on plausible rounds, and the lower range scale is about Baughn / 15 (the 30mm is within 1-4%). New KE weapons use Cole directly, and their ranges use Baughn / 15.

**Shaped charge (HEAT).** GURPS gives HEAT very high divisors with modest dice. The fan-transcribed GURPS Weapons 35 table on the RPG.net wiki lists 122/125mm HEAT at 6dx8(10) and 152/155mm HEAT at 6dx9(10). FORGE compresses that (10) to (4) and scales up the dice. Fitting the three baseline rockets gives **penetration P = 672 x (d/60)^1.9** (60mm: 672 = 168x4, exact; 80mm: 1,161 against 1,260; 120mm: 2,508 against 2,520), **DMG = P/4 at (4)**, and **RNG = 1.25d / 6.25d**, which matches the baseline 75/375 and 150/750 exactly. This is an extrapolation from the baseline pattern, not a published formula.

**FORGE divisor mapping** (inferred from the baseline plus the user rules):
- GURPS AP, APDS or tungsten/DU (2) or less becomes FORGE **(3)**. Every baseline KE gun is (3), so (3) is the floor for any mech-rated weapon.
- GURPS (10) shaped charge or plasma jet becomes FORGE **(4)**.
- Ultra-Tech TL10 (5) stays FORGE **(5)**, Reman only. That covers blasters, hyperdense EM rounds and monomolecular edges.
- Electromagnetic guns default to (3) in Ultra-Tech, and hyperdense ammo replaces that with (5). Lasers are tight-beam burning (2) and lose effect in smoke, rain and fog.

**Beams.** No verified published formula converts beam energy to damage in a way I could check. I applied Cole's energy term to the shot energy with the beam spot as Xsect, and I mark that as an **extrapolation** wherever it is used.

**Melee.** No published GURPS rule scales mech-size vibroblades. The baseline fits **dice = 79 + 13 x ln(mass t)**: 0.3/0.9/2.1 t give 63/78/89 against 64/76/88, and the 1.8 t Tachi gives 87 against 84. Notation stays no-multiplier (`84d(3)`, AVG = dice x 3.5).

**ACC** is extrapolated from the baseline pattern: long guns 4, rockets 5, high-volume pods 6. Lasers and blasters get 6, following Ultra-Tech's high-accuracy beams. Indirect or spread weapons get 2-3.

## Core Empire (TL8): antiquated, reliable, slow, hardy

### 1. 105mm SIEGE MORTAR (Empire, A, EP 4)

```
A|105mm SIEGE MORTAR|4|ROF:1 DMG:6dx23(4) AVG:483 ACC:2 RCL:4 RNG:131/656 AMMO:4(1) INDIRECT:-10_without_spotter NOTE:spotter_Forward_Observer_margin_reduces_the_-10 NOTE:indirect_fire_only NOTE:minimum_range_25|ROCKET/MISSILE // BREECH MORTAR|3.0 t|AMMO|105mm top-attack HEAT bombs, 4-rd rack|Indirect fire with a spotter|The mortar does not care whether its crew can see the enemy, only whether somebody can. Imperial doctrine pairs every mortar knight with a scout who is expected to be brave, patient and very well hidden.|0|8|1
```

- **Design intent:** A squad weapon that only works when a teammate spots for it, in line with the Empire's combined-arms doctrine.
- **Balance:** Its 483(4) puts about 358 through DR 500, against 306 for the 90mm HEAVY RIFLE (5 EP), at 1 EP less. The catch is the High-Tech indirect-fire penalty of -10 without a Forward Observer, plus ACC 2, no direct fire and only 4 rounds.
- **EP logic:** 3.0 t gives 2.5 x sqrt(3.0) = 4.3, so EP 4.
- **Derivation:** Shaped-charge (HEAT) pattern fitted to the baseline rockets: penetration P = 672 x (d/60)^1.9 (60mm gives 672 = 168x4, exact; 80mm gives 1,161 against the baseline 1,260; 120mm gives 2,508 against 2,520). For d = 105, P = 1,946, so DMG = P/4 = 486, rounded to 6dx23 (483) at FORGE (4). GURPS gives HEAT (10) (see the GURPS Weapons 35 artillery table: 122/125mm HEAT 6dx8(10)), and FORGE compresses this to (4). RNG uses the baseline rocket rule of 1.25d/6.25d. The indirect-fire -10 and Forward Observer margin come from the GURPS High-Tech artillery rules (artillery.pdf). ACC is extrapolated from the baseline pattern.

### 2. 35mm GARRISON AUTOCANNON (Empire, A, EP 3)

```
A|35mm GARRISON AUTOCANNON|3|ROF:4 DMG:6dx10(3) AVG:210(840) ACC:4 RCL:2 RNG:142/512 AMMO:16(1) RELIABLE:crit_fail_is_a_miss_not_a_malfunction|BALLISTIC // CHAIN AUTOCANNON|1.6 t|AMMO|35mm APDS-T, 16-rd box|Dependable mid-range anti-armor|Our quartermasters keep a garrison cannon that has fired in eleven campaigns on two barrels. It is not exciting, and that is the point.|0|8|0
```

- **Design intent:** The Empire's dependable workhorse gun. It gets slightly better penetration than the 30mm instead of more rate of fire, and it never jams.
- **Balance:** Against DR 500 it puts about 4x43 = 172 through per turn, versus 5x22 = 110 for the 30mm AUTOCANNON (3 EP). Its total burst is lower, at 840 versus 945, and it weighs 1.6 t against 1.1 t. A Medium frame takes very little from it, which fits modest Empire numbers.
- **EP logic:** 1.6 t gives 2.5 x sqrt(1.6) = 3.2, so EP 3.
- **Derivation:** Cole formula on an assumed 0.55 kg APDS-T projectile with an 18mm tungsten core at 1,175 m/s (KE 380 kJ): 218 points, so 6dx10 (210). The tungsten sub-calibre core is GURPS AP (2), Cole tungsten 1.9; FORGE rounds every KE AP round up to its floor of (3), as the baseline does for the 20mm, 30mm, 45mm and 90mm. RNG uses the Baughn simplified formula (yards) / 15, giving 142/512 (the full-bore projectile and 35mm calibre feed the range term).

### 3. IMPACT MAUL (Empire, A, EP 4)

```
A|IMPACT MAUL|4|ROF:X DMG:94d(3) AVG:329 EFFECT:any_penetrating_hit_forces_a_STABILITY_check NOTE:-1_to_hit_on_the_turn_after_a_miss|MELEE // POWER MAUL|3.2 t|POWER|Hydraulic head accumulator, ~30 min|Toppling knights, breaking formations|The maul was meant to retire with the old foot knights. It refused. A knight on the ground is a knight out of the fight, and nothing puts one there faster.|1|8|0
```

- **Design intent:** A crushing weapon that hooks into the sheet's existing STABILITY CHECK, so it can knock frames down rather than just cut them.
- **Balance:** It puts 329-167 = 162 through DR 500, against 141 for the VIBROBLADE (HEAVY) (3 EP, 2.1 t). It costs 1 more EP for 1.1 t more mass. The PILE BUNKER does 400 through but needs a charge turn. Here the stability check is the payoff.
- **EP logic:** 3.2 t gives 2.5 x sqrt(3.2) = 4.5, so EP 4.
- **Derivation:** No published GURPS formula scales mech melee. The dice come from a fit to the baseline: dice = 79 + 13 x ln(mass t), which gives 63/78/89 for the 0.3/0.9/2.1 t vibroblades (baseline 64/76/88) and 87 for the 1.8 t Tachi (84). At 3.2 t that gives 94d, AVG 94 x 3.5 = 329, using the no-multiplier melee notation. The divisor stays (3), the same as the vibroblades. This is extrapolated from the baseline pattern.

### 4. 60mm RIPPLE ROCKET BATTERY (Empire, A, EP 3)

```
A|60mm RIPPLE ROCKET BATTERY|3|ROF:6 DMG:4dx12(4) AVG:168(1008) ACC:5 RCL:4 RNG:75/375 AMMO:12(2) NOTE:+2_Active_Defense_vs_missiles NOTE:fires_two_6-rocket_salvos|ROCKET/MISSILE // SALVO BATTERY|1.2 t|AMMO|60mm fin-stabilized HEAT, 12 tubes|Sustained area suppression|Same rocket as the pod, twice the tubes, half the glamour. Line regiments like it because a second salvo is a second chance.|0|8|0
```

- **Design intent:** A mass-produced partner to the 60mm pod: the same rocket, but two salvos instead of one burst.
- **Balance:** Each salvo puts 6x43 = 258 through DR 500, and the full load does 516, against a single 344 salvo from the 60mm MISSILE POD (2 EP, 0.6 t). It costs 1 more EP for twice the mass and has 1 less ACC.
- **EP logic:** 1.2 t gives 2.5 x sqrt(1.2) = 2.7, so EP 3.
- **Derivation:** Same 60mm HEAT rocket as the baseline pod, so the HEAT pattern for 60mm gives 168 at (4) and 4dx12 = 168, an exact match. RNG uses the baseline rocket rule of 1.25d/6.25d (75/375).

### 5. OLEUM BREACHING TORCH (Empire, A, EP 2)

```
A|OLEUM BREACHING TORCH|2|ROF:X DMG:76d(4) AVG:266 HEAT:+3/hit RAD:+5_pilot_per_hit NOTE:requires_OLEUM_VIS_CORE NOTE:close_combat_only|MELEE // PLASMA CUTTER|0.8 t|FUEL|Oleum Vis bleed line from the core|Breaching hulls and bunkers|Sappers used it on vault doors long before anyone thought to swing it at a knight. The cockpit dosimeter clicks every time it bites.|0|8|1
```

- **Design intent:** An Oleum-fed cutter. It is the Empire's one high-penetration melee tool, and the pilot pays for it in heat and rads.
- **Balance:** It puts 266-125 = 141 through DR 500, against 99 for the VIBROBLADE (MEDIUM) (2 EP, same 76d). Each hit costs +3 heat and 5 rads, and it needs an OLEUM VIS CORE.
- **EP logic:** 0.8 t gives 2.5 x sqrt(0.8) = 2.2, so EP 2. Its energy comes from the core, so that cost shows up as HEAT, not EP.
- **Derivation:** Dice come from the baseline melee fit (79 + 13 ln 0.8 = 76d). The divisor follows Ultra-Tech, where plasma-jet weapons (plasma lances) carry (10), as summarized by Enraged Eggplant from Pyramid #3-51. FORGE compresses (10) to (4), the same way it does for HEAT. Extrapolated.

### 6. MANTLET SHIELD (Empire, D, EP 6)

```
D|MANTLET SHIELD|6|DR:240/180 HP:400 EFFECT:plant_as_freestanding_cover_for_one_adjacent_ally NOTE:plant_or_lift_is_a_Ready NOTE:no_Block_for_the_bearer_while_planted|SHIELD // PLANTABLE MANTLET|4.0 t|MATERIAL|Spaced plate on folding stands|Covering a teammate|A tower shield that can be put down and walked away from. Imperial gun-lines leapfrog behind them like siege engineers of old.|0|8|0
```

- **Design intent:** A squad defensive item: one knight gives up its own Block to give a teammate a wall.
- **Balance:** It has the TOWER SHIELD's DR 240/180 with 400 HP instead of 500, at 6 EP and 4.0 t against 7 EP and 5.2 t. Planting it covers someone else, and while it is planted the bearer has no Block.
- **EP logic:** The baseline shields follow about 3 x sqrt(mass) (0.5/1.4/2.9/5.2 t give 2.1/3.5/5.1/6.8 against 2/3/5/7). 4.0 t gives 6.0, so EP 6.

### 7. CROWN-GRADE SPALL LINER (Empire, D, EP 2)

```
D|CROWN-GRADE SPALL LINER|2|DR:+60_torso_only EFFECT:pilot_ignores_spall_injury_from_torso_hits NOTE:stacks_with_percent_armor|ARMOR // COCKPIT LINER|0.8 t|MATERIAL|Aramid-ceramic quilting|Keeping the pilot alive|Plate keeps the knight standing. The liner keeps the knight's pilot attending court next season.|0|8|0
```

- **Design intent:** Cheap protection for the torso and pilot that stacks with percentage armor. It is unglamorous and dependable.
- **Balance:** REINFORCED ARMOR (3 EP, 1.2 t) adds +10%, about +50 on every location of a Medium frame. This adds +60 to the torso only, for 2 EP and 0.8 t.
- **EP logic:** 0.8 t gives 2.5 x sqrt(0.8) = 2.2, so EP 2.

### 8. SMOKE DISCHARGERS (Empire, D, EP 1)

```
D|SMOKE DISCHARGERS|1|EFFECT:20m_smoke_ranged_-3_into_through_or_out USES:2 DURATION:3_turns NOTE:SENSOR_SUITE_tier_2_halves_to_-1_tier_3_negates NOTE:lasers_and_beams_lose_1_divisor_step_through_smoke NOTE:deploy_is_a_free_action|ECM // SMOKE MORTARS|0.3 t|AMMO|Multispectral smoke, 2 volleys|Breaking line of sight|The oldest countermeasure we own and still the one the Remans complain about.|0|8|0
```

- **Design intent:** A low-tech counter to Reman beams and Rebel lasers, tied into the Sensor Suite tiers.
- **Balance:** The COUNTERMEASURE POD (2 EP) strips ACC bonuses once per round. Smoke is a symmetric -3 for 3 turns, 2 uses, and it also weakens beam divisors.
- **EP logic:** 0.3 t gives 1.4, so EP 1. The beam rule follows Ultra-Tech, where smoke and fog give extra DR against lasers.

### 9. FIELD WORKSHOP RIG (Empire, U, EP 2)

```
U|FIELD WORKSHOP RIG|2|TIERS:3 REPAIR:10/20/30_HP USES:2/3/4 EFFECT:Ready_plus_Mechanic_roll_restores_HP_to_one_location_self_or_adjacent_ally NOTE:cannot_uncripple_or_restore_destroyed|SUPPORT // FIELD WORKSHOP|0.4-1.6 t|POWER|2-6 kW welder and tool arm|Squad repair|Every Imperial lance carries one knight who is secretly a blacksmith. The others pretend not to notice until they need her.|0|8|0
```

TIER entry:
```
"FIELD WORKSHOP RIG":[[2, "TIER:1 REPAIR:10_HP USES:2 EFFECT:Ready_plus_Mechanic_roll_restores_HP_to_one_location_self_or_adjacent_ally NOTE:cannot_uncripple_or_restore_destroyed", "0.4 t", "Hip tool arm, ~2 kW", "A welding arm and a parts bin: enough to keep a lance walking home."], [4, "TIER:2 REPAIR:20_HP USES:3 EFFECT:Ready_plus_Mechanic_roll_restores_HP_to_one_location_self_or_adjacent_ally NOTE:cannot_uncripple_or_restore_destroyed", "0.9 t", "Shoulder workshop, ~4 kW", "A full field kit on a shoulder hardpoint. Squires fight over who gets to carry it."], [6, "TIER:3 REPAIR:30_HP USES:4 EFFECT:Ready_plus_Mechanic_roll_restores_HP_to_one_location_self_or_adjacent_ally NOTE:cannot_uncripple_or_restore_destroyed", "1.6 t", "Back-mounted forge, ~6 kW", "A walking forge. The lance that brings one fights a second day."]]
```

- **Design intent:** A tiered squad mechanic. Repair runs on a Mechanic roll and has limited uses, so it is reliable but slow.
- **Balance:** Tier 2 (4 EP) restores up to 60 HP across 3 uses with a roll. The Reman TSUKUROI NANITE MENDER (3 EP) restores 50 HP with no roll, but only refills at a shrine-depot.
- **EP logic:** Powered electronics follow EP = kW (the ECM SUITE is 2/4/6 kW for 2/4/6 EP; the SENSOR SUITE is 3/5/7 kW for 3/5/7 EP). Here 2/4/6 kW gives 2/4/6 EP, which beats the mass term (0.4/0.9/1.6 t gives 1.6/2.4/3.2).

### 10. HERALDIC COMMAND MAST (Empire, U, EP 2)

```
U|HERALDIC COMMAND MAST|2|EFFECT:designate_1_target/turn_allies_with_LOS_to_the_mast_+1_ACC_vs_it RADIUS:300m NOTE:allies_in_radius_+1_Will_vs_fear NOTE:bearer_+2_to_enemy_detection NOTE:lost_if_head_destroyed|SUPPORT // COMMAND BANNER|0.5 t|POWER|IFF and laser designator, ~2 kW|Lance command, focus fire|The banner tells your lance where to shoot. It also tells the enemy exactly which knight to kill first, which is why we issue it to the proud ones.|0|8|0
```

- **Design intent:** Feudal focus-fire. One knight makes the whole lance better and becomes the priority target.
- **Balance:** ENHANCED TARGETING SUITE (2 EP) gives +2 to the user only. This gives +1 to every ally with line of sight on one target, so 4 allies gain 4 ACC-points in total, but the bearer is +2 to detect.
- **EP logic:** 0.5 t and 2 kW give max(1.8, 2), so EP 2.

### 11. OLEUM CHELATION INJECTOR (Empire, U, EP 1)

```
U|OLEUM CHELATION INJECTOR|1|RAD:-10_per_use USES:2/sortie NOTE:each_use_costs_the_pilot_1_FP_and_-2_DX_next_turn NOTE:only_removes_rads_gained_this_sortie NOTE:refill_at_a_field_hospital|SUPPORT // PILOT MEDICAL|0.1 t|POWER|Chelating agent, 2 doses|Making Oleum survivable at TL8|It is not shielding. It is an apology delivered by needle. The pilots take it anyway.|0|8|0
```

- **Design intent:** The Empire's TL8 answer to Oleum Vis rads. It works on the pilot's body rather than as shielding, and it costs FP and DX.
- **Balance:** OLEUM VIS CORE: 25 rads per sortie. SHRINE-GRADE COCKPIT SHIELDING (3 EP, TL10 only) cuts that to 5. Two injections cut 20, so the result is the same as shielding only if the pilot never runs hot, and the extra rads from the danger zone and redline still land. Each dose costs 1 FP and -2 DX.
- **EP logic:** 0.1 t gives 0.8, so EP 1.

### 12. RECOVERY TOW WINCH (Empire, U, EP 1)

```
U|RECOVERY TOW WINCH|1|EFFECT:tow_one_disabled_ally_at_half_MOVE NOTE:snag_an_enemy_limb_at_20m_Quick_Contest_of_ST NOTE:cable_HP:15|SUPPORT // RECOVERY WINCH|0.3 t|POWER|Torso winch, 60 m cable|Dragging allies out of the fire|Leave no knight on the field. The winch is how that oath gets kept on a Tuesday.|0|8|0
```

- **Design intent:** A multiplayer rescue tool. It has a small offensive use (a ST contest) and the cable breaks easily.
- **Balance:** It is the only baseline-compatible way to move a disabled ally. At 1 EP it matches FOOT ROLLERS (1 EP). The cable has HP 15 and any hit can cut it.
- **EP logic:** 0.3 t gives 1.4, so EP 1.

### 13. CASTELLAN SUPERHEAVY FRAME (Empire, F, EP 9)

```
F|CASTELLAN SUPERHEAVY FRAME|9|ST/HP:200 DR:800/400 MOVE:5L/10S SM:+7 HND:0 SR:3 BULK:-1_Dodge|FRAME // MECH|[DATA_NOT_FOUND]|ORIGIN|Imperial arsenal foundries, line-built|Breakthrough, holding the line|Castellans are older than most noble houses and better maintained. They do not charge; they arrive.|0|8|1
```

- **Design intent:** A walking fortress beyond the Heavy frame. It is slow, very hard to kill, and holds a lot.
- **Balance:** Against the HEAVY FRAME (7 EP, 175 HP, DR 700/350, 7L/14S) it gets +14% HP and DR and +2 EP. In exchange it loses 29% Move, 1 HND and 1 Dodge (BULK). An Icarus frame circles it easily.
- **EP logic:** The baseline mech frames follow EP = (ST/HP - 87.5) / 12.5 (125/150/175 give 3/5/7, exact). 200 HP gives 9.

### 14. TL8-ARMORED CARRIER (Empire, F, EP 5)

```
F|TL8-ARMORED CARRIER|5|ST/HP:110 DR:280/160 MOVE:4L/- SM:+4 HND:+1 SR:3 CREW:driver_and_commander CARGO:6_infantry_or_2_downed_pilots|FRAME // VEHICLE|[DATA_NOT_FOUND]|CREW|Driver, commander, troop bay|Moving infantry and rescuing pilots|The carrier has no glory and no enemies; nobody bothers to shoot it until it has already unloaded.|0|8|0
```

- **Design intent:** A support vehicle for mixed infantry and mech tables, and for recovering pilots.
- **Balance:** Against the TL8-TANK (8 EP, 120 HP, DR 300/180, 3L) it trades a little armor and 3 EP of capacity for +1 Move and a troop bay.
- **EP logic:** The baseline vehicles follow EP = 2 + HP/20 (TANK 120 gives 8, Crawler 160 gives 10, Fighter 90 gives 6.5, Helo 80 gives 6). 110 HP gives 7.5, and the troop bay costs -2, so EP 5.

### 15. ANCESTRAL THERMAL-MASS CORE (Empire, R, EP 3)

```
R|ANCESTRAL THERMAL-MASS CORE|3|ST/HP:+40% HEAT:15 VENT:1 HND:-1 RUGGED:first_reactor_crit_each_sortie_ignored|REACTOR // THERMAL-MASS FISSION PILE|[DATA_NOT_FOUND]|FUEL|Graphite-moderated pile, decades per load|Soaking heat in long fights|It runs warm for an hour before battle and keeps running long after newer cores have tripped their breakers.|0|8|0
```

- **Design intent:** An antique core that soaks heat: a huge heat pool that vents slowly, and it shrugs off its first crit.
- **Balance:** Against the STANDARD FUSION CORE (3 EP, +50%, HEAT 10, VENT 2) it gives up 10% HP, 1 VENT and 1 HND for 5 more heat capacity and a free crit. The danger zone starts at 8 heat instead of 5.
- **EP logic:** The baseline reactors follow EP = ST/HP% / 15 (Light 30% gives 2, Standard 50% gives 3.3, Heavy 70% gives 4.7, Oleum 60% gives 4). 40% gives 2.7, so EP 3.

### 16. LONG-SERVICE THRUSTERS (Empire, T, EP 2)

```
T|LONG-SERVICE THRUSTERS|2|MOVE:+20% HND:-1 SR:+2 RUGGED:first_thruster_crit_each_sortie_ignored|THRUSTER // GARRISON THRUSTERS|[DATA_NOT_FOUND]|FUEL|Standard Imperial blend|Reliable repositioning|Rated for a century of service. Two of the sets in our depot have already done it.|0|8|0
```

- **Design intent:** Dependable thrusters that are stable and survive crits, at the cost of speed.
- **Balance:** Against STANDARD THRUSTERS (2 EP, +25%) it gives up 5% Move and 1 HND for SR +2 and one ignored thruster crit.
- **EP logic:** The baseline thrusters follow EP = MOVE% / 12 (15/25/40% give 1.25/2.1/3.3 against 1/2/3), and HND/SR swaps net to zero. 20% gives 1.7, so EP 2.

### 17. DRESSED-LINE FIRE CONTROL (Empire, G, EP -1)

```
G|DRESSED-LINE FIRE CONTROL|-1|ACC-ALL:+1 VOLLEY:+1_ACC_per_other_ally_with_this_suite_firing_at_the_same_target_this_turn_max_+2 NOTE:allies_within_100m|TARGETING // VOLLEY NET|[DATA_NOT_FOUND]|LINK|Lance fire-direction net|Coordinated volleys|One knight shoots. Three knights in step fire a volley. The difference has toppled dynasties.|0|8|0
```

- **Design intent:** A targeting suite that rewards squads for firing together.
- **Balance:** It matches STANDARD FIRE CONTROL (0 EP, +1) when used alone, and reaches the +2 of the MULTI-ROLE TARGETING SUITE (-2 EP) only when one ally fires at the same target. Its full +3 needs three knights coordinating.
- **EP logic:** The baseline targeting suites follow EP = 1 - 1.5 x ACC-ALL (+0 gives 1, +1 gives -0.5, which is 0, +2 gives -2). +1 gives -0.5, and the conditional volley bonus costs another 0.5, so EP -1.

## Rebels (TL8): performance, firepower, fragility

### 18. HAILSTORM 40mm ROTARY CANNON (Rebel, A, EP 4)

```
A|HAILSTORM 40mm ROTARY CANNON|4|ROF:5 DMG:6dx11(3) AVG:231(1155) ACC:3 RCL:3 RNG:128/480 AMMO:15(2) HEAT:+3/burst SPINUP:ROF_2_on_first_turn_firing NOTE:any_penetrating_hit_to_the_gun_arm_destroys_the_feed|BALLISTIC // ROTARY CANNON|3.0 t|AMMO|40mm AP-T, 15-rd drum|Burst damage at mid range|It spins up like a turbine and empties like a promise. Every Rebel cell wants one, and the ones who have one want more ammunition.|1|8|1
```

- **Design intent:** Rebel raw burst: big per-turn damage, fast ammo burn, heat, a spin-up turn, and a fragile feed.
- **Balance:** Against DR 500 it puts 5x64 = 320 through per turn, against 306 per shot for the 90mm HEAVY RIFLE (5 EP), at 1 EP less. It only gets 3 full bursts, and each adds +3 heat. On a Light Fission Cell (HEAT 7) two bursts reach the danger zone, and the feed dies to any penetrating arm hit.
- **EP logic:** 3.0 t gives 4.3, so EP 4.
- **Derivation:** Cole formula on an assumed 0.95 kg AP-T round with a 20mm core at 1,000 m/s (KE 475 kJ): 237 points, so 6dx11 (231) at the FORGE KE floor of (3). RNG is Baughn yards / 15 = 128/480. Rebel identity comes from ROF and raw damage, not divisor.

### 19. BREACHER SCATTERGUN (Rebel, A, EP 2)

```
A|BREACHER SCATTERGUN|2|ROF:6 DMG:6dx6(3) AVG:126(756) ACC:2 RCL:2 RNG:40/150 AMMO:4(1) NOTE:6_slugs_per_shot_counted_as_ROF NOTE:best_vs_rear_DR_and_vehicles|BALLISTIC // CANISTER GUN|0.8 t|AMMO|65mm slug canister, 4 shells|Flanking, ambushing vehicles|Rebel mechanics call it a door-knocker. The door, in practice, is the back of a knight.|0|8|0
```

- **Design intent:** A flanker's gun. The physics means it cannot get through a Medium frame's front armor, so the player has to get behind the target.
- **Balance:** Each slug does 126 against 167 effective front DR on a Medium frame, so nothing gets through. Against rear DR 250 it does 6x43 = 258 per shot. Against the TL8-TANK it does 6x26 = 156. The 30mm AUTOCANNON (3 EP) works from the front.
- **EP logic:** 0.8 t gives 2.2, so EP 2.
- **Derivation:** Cole formula per slug on an assumed 0.6 kg 25mm slug at 750 m/s: 129 points, so 6dx6 (126). Per-slug range by Baughn / 15 would be 106/425. Canister spread is what limits range: Gaming Ballistic notes GURPS gives 12G shot a 1/2D of 40 yd, far shorter than a slug. So 40/150 is extrapolated from that spread-limited pattern.

### 20. RIPSAW CHAIN BLADE (Rebel, A, EP 3)

```
A|RIPSAW CHAIN BLADE|3|ROF:X DMG:84d(3) AVG:294 NOTE:a_shield_Block_or_Parry_jams_it_until_a_Ready NOTE:crit_fail_throws_the_chain_and_destroys_it|MELEE // CHAIN BLADE|1.4 t|POWER|Overdriven motor, ~10 min|One-handed brawling|Imperial blades sing. This one screams, and it keeps screaming right up until it throws its chain into the pilot's own cockpit glass.|0|8|0
```

- **Design intent:** Heavy-blade damage in one hand. It jams against shields and can destroy itself.
- **Balance:** It puts 294-167 = 127 through DR 500, against 141 for the VIBROBLADE (HEAVY) (3 EP, two-handed), but this one is one-handed so a shield or gun stays in the other hand. Shields counter it hard.
- **EP logic:** 1.4 t gives 3.0, so EP 3.
- **Derivation:** Uses the baseline melee fit: 79 + 13 ln(1.4) = 83.4, rounded to 84d. AVG 84 x 3.5 = 294, at divisor (3). Extrapolated.

### 21. SUNSPIKE THERMITE PROJECTOR (Rebel, A, EP 3)

```
A|SUNSPIKE THERMITE PROJECTOR|3|ROF:1 DMG:6dx12(3) AVG:252 ACC:3 RCL:1 RNG:25/100 AMMO:5(1) HEAT:+3/shot TARGET-HEAT:+2_on_penetrating_hit NOTE:20+_penetrating_to_the_mounting_arm_ruptures_the_tank_for_4dx10(3)_to_self|INCENDIARY // THERMITE JET|1.1 t|AMMO|Thermite-gel tank, 5 shots|Cooking enemy cores|Rebels figured out what we never wanted to admit: a knight running hot is already half beaten.|0|8|1
```

- **Design intent:** A heat-warfare weapon. A penetrating hit pushes the target toward its danger zone, which hooks into the heat-zone DR penalty.
- **Balance:** It puts 252-167 = 85 through DR 500, against 117 per shot (x3) for the 45mm HAND CANNON (3 EP). On a penetrating hit it adds +2 heat to the target, and once in the danger zone the target's DR drops to x0.75. Three hits (+6) push a Standard core (HEAT 10) past its danger line of 5 on their own. The tank can rupture.
- **EP logic:** 1.1 t gives 2.6, so EP 3.
- **Derivation:** No published formula covers mech flamers. Ultra-Tech flamers do burning damage with no armor divisor (Enraged Eggplant). FORGE uses (3) as the floor for mech-rated weapons. Damage is set between the 30mm and 45mm per hit, and RNG 25/100 follows the short GURPS flamer pattern. Extrapolated from the baseline pattern.

### 22. HORNET 80mm ALPHA POD (Rebel, A, EP 3)

```
A|HORNET 80mm ALPHA POD|3|ROF:4 DMG:6dx14(4) AVG:294(1176) ACC:5 RCL:5 RNG:100/500 AMMO:4(1) SPARE:0 NOTE:one_salvo_no_reload NOTE:+2_Active_Defense_vs_missiles NOTE:a_penetrating_hit_on_the_loaded_pod_cooks_it_off_for_6dx10(3)_to_torso|ROCKET/MISSILE // ALPHA-STRIKE POD|1.6 t|AMMO|80mm HEAT, 4 tubes, single salvo|Opening alpha strike|Four rockets, one chance, and a pod that would very much like to explode. Rebel doctrine in a single sentence.|0|8|1
```

- **Design intent:** The Rebel all-in opening shot, with a cook-off risk while it is loaded.
- **Balance:** One salvo puts 4x169 = 676 through DR 500, against 380 per turn for the 80mm ROCKET LAUNCHER (3 EP, ROF 2). It has no reload, and the pod explodes if hit while loaded.
- **EP logic:** 1.6 t gives 3.2, so EP 3.
- **Derivation:** HEAT pattern at 80mm: P = 1,161, which is 290 at (4), so 6dx14 (294). The baseline 80mm is 315, so this is within 7%. RNG uses the rocket rule 1.25d/6.25d (100/500).

### 23. SALVAGED LASER CARBINE (Rebel, A, EP 3)

```
A|SALVAGED LASER CARBINE|3|ROF:3 DMG:6dx11(3) AVG:231(693) ACC:6 RCL:1 RNG:150/500 HEAT:+2/shot NOTE:no_ammo NOTE:smoke_rain_or_fog_drop_it_1_divisor_step NOTE:a_penetrating_hit_to_the_mounting_arm_cracks_the_lens_-2_ACC|BEAM // PULSE LASER|1.2 t|POWER|Core-fed, ~600 kJ per pulse|Accurate sustained fire|Pieced together from a downed Reman lance and three civilian mining rigs. It works. Nobody knows for how long.|0|8|1
```

- **Design intent:** Salvaged TL9 tech: no ammo and very accurate, paid for in heat. The lens is fragile.
- **Balance:** It puts 3x64 = 192 through DR 500 per turn, against 3x117 = 351 for the 45mm HAND CANNON (3 EP), but it has ACC 6 and never runs dry. A full 3-shot turn adds +6 heat. Smoke counters it.
- **EP logic:** 1.2 t gives 2.7, so EP 3. Power comes from the core, so it shows up as HEAT.
- **Derivation:** Ultra-Tech TL9 infrared lasers do tight-beam burning damage at (2), are high-accuracy and recoilless, and get extra DR against them in rain, fog or smoke (Enraged Eggplant). That (2) rounds up to the FORGE floor of (3). Damage applies Cole's energy term to the beam (an extrapolation, since Cole wrote it for projectiles): a 600 kJ pulse on a 30mm spot gives 236, so 6dx11. RNG is capped at the 90mm lower-scale ceiling of 150/500.

### 24. SALVAGE PLATING KIT (Rebel, D, EP 1)

```
D|SALVAGE PLATING KIT|1|TIERS:3 DR:+25/+50/+75 HND:0/0/-1 NOTE:each_penetrating_hit_on_a_location_strips_25_DR_there|ARMOR // SCRAP PLATING|0.3-1.0 t|MATERIAL|Welded hull scrap|Cheap, fast survivability|Rebel knights wear the armor of whatever they killed last week. It shows.|0|8|0
```

TIER entry:
```
"SALVAGE PLATING KIT":[[1, "TIER:1 DR:+25 HND:0 NOTE:each_penetrating_hit_on_a_location_strips_25_DR_there", "0.3 t", "Door panels and hope", "A few welded panels over the worst gaps."], [2, "TIER:2 DR:+50 HND:0 NOTE:each_penetrating_hit_on_a_location_strips_25_DR_there", "0.6 t", "Truck hull sections", "Proper scrap plate, welded at awkward angles."], [3, "TIER:3 DR:+75 HND:-1 NOTE:each_penetrating_hit_on_a_location_strips_25_DR_there", "1.0 t", "Captured Imperial plate", "Imperial plate, repainted, still wearing someone else's heraldry underneath."]]
```

- **Design intent:** Tiered flat armor made from scrap. It is cheap, and it peels off under fire.
- **Balance:** Tier 3 (3 EP, 1.0 t) gives +75 flat with HND -1. REINFORCED ARMOR (3 EP, 1.2 t) gives about +50 that never strips. Every penetrating hit removes 25 DR from that location.
- **EP logic:** 0.3/0.6/1.0 t gives 1.4/1.9/2.5, so 1/2/3 EP. Each tonne buys more DR than REINFORCED ARMOR because the plating strips away under fire.

### 25. REACTIVE ARMOR BRICKS (Rebel, D, EP 3)

```
D|REACTIVE ARMOR BRICKS|3|EFFECT:negate_the_first_rocket_missile_or_shaped-charge_hit_per_location USES:6 NOTE:allies_within_5m_take_2dx10(3)_splash NOTE:no_effect_vs_kinetic_beam_or_melee|ARMOR // EXPLOSIVE REACTIVE|1.0 t|MATERIAL|Explosive tiles, 6 blocks|Defeating rockets|Rebels bolt explosives to their armor and call it protection. Disturbingly, it is.|0|8|1
```

- **Design intent:** A hard counter to HEAT that endangers nearby teammates.
- **Balance:** SPACED ARMOR PANELS (2 EP) add a divisor step against rockets. These cancel 6 rocket hits outright, which beats the 120mm ROCKET CANNON's 630, but each one sprays 2dx10 at adjacent allies.
- **EP logic:** 1.0 t gives 2.5, rounded half-up to EP 3.

### 26. GRAPPLING HARPOON (Rebel, U, EP 1)

```
U|GRAPPLING HARPOON|1|EFFECT:anchor_to_terrain_within_100m_and_reel_there_as_a_full_Move_ignoring_terrain NOTE:vs_a_mech_Quick_Contest_of_ST_to_pull_or_be_pulled NOTE:cable_HP:10|MOBILITY // HARPOON REEL|0.3 t|POWER|Gas launcher, 4 harpoons|Vertical movement, ambush|Code-named 'the Zipline' by a cell that had no right to survive that canyon.|0|8|0
```

- **Design intent:** Cheap 3D mobility for rooftops and canyons, plus a way to pull an enemy off balance.
- **Balance:** JUMP JETS (SHORT) (2 EP) give a hop of up to half MOVE. This reels up to 100m along a cable for 1 EP, but the cable has 10 HP and any hit cuts it.
- **EP logic:** 0.3 t gives 1.4, so EP 1.

### 27. DECOY BEACON DROP (Rebel, U, EP 2)

```
U|DECOY BEACON DROP|2|USES:2 EFFECT:enemy_must_win_Sensor_vs_your_EW_or_target_the_beacon NOTE:SENSOR_SUITE_tier_3_ignores NOTE:beacon_HP:5_lasts_3_turns NOTE:can_be_thrown_50m_to_cover_an_ally|EW // DECOY BEACONS|0.4 t|POWER|Throwable emitter, ~2 kW|Covering a teammate|It screams 'I am a knight' on every band we know of. Half our pilots now wear one as a joke. The other half are still alive because of it.|0|8|0
```

- **Design intent:** Squad electronic warfare that draws one attack away from a teammate. It uses a contested roll, and the Sensor Suite tiers counter it.
- **Balance:** The COUNTERMEASURE POD (2 EP) negates attacker ACC bonuses once per round. This can redirect a whole attack, but it has 2 uses and Sensor Suite tier 3 ignores it.
- **EP logic:** 0.4 t and 2 kW give max(1.6, 2), so EP 2.

### 28. JURY-RIG FIELD KIT (Rebel, U, EP 1)

```
U|JURY-RIG FIELD KIT|1|USES:2 EFFECT:Ready_plus_Mechanic-2_uncripples_one_limb_for_the_sortie NOTE:failing_by_5+_destroys_that_limb NOTE:works_on_self_or_an_adjacent_ally|SUPPORT // JURY-RIG|0.2 t|MATERIAL|Clamps, cable, tape|Getting a limb working again|Imperial manuals say a crippled limb needs a depot. Rebel mechanics say it needs a clamp and a positive attitude.|0|8|0
```

- **Design intent:** A high-risk repair that hooks into the crippling rules.
- **Balance:** The REDUNDANT ACTUATOR HARNESS (3 EP) passively keeps the first crippled limb working. This kit needs a roll at -2, can destroy the limb if that roll fails badly, and works on allies.
- **EP logic:** 0.2 t gives 1.1, so EP 1.

### 29. MESH NET RELAY (Rebel, U, EP 2)

```
U|MESH NET RELAY|2|EFFECT:allies_with_a_relay_within_500m_share_the_highest_SENSOR_SUITE_tier_in_the_net NOTE:if_any_node_is_inside_enemy_ECM_of_equal_or_higher_tier_the_whole_net_drops NOTE:each_node_+1_to_enemy_detection|EW // MESH RELAY|0.3 t|POWER|Burst-mesh radio, ~2 kW|Sharing sensors|Democratic warfare: everyone sees what the best-equipped cell sees, and everyone goes blind together.|0|8|0
```

- **Design intent:** Squad sensor sharing with one point of failure, which fits the Rebels' disjointed structure.
- **Balance:** SENSOR SUITE tier 3 costs 7 EP. A squad running one T3 plus three relays (2 EP each) gets T3 for everyone, until an enemy ECM of T3 or higher drops the whole net.
- **EP logic:** 0.3 t and 2 kW give max(1.4, 2), so EP 2.

### 30. TL8-TECHNICAL RAIDER (Rebel, F, EP 5)

```
F|TL8-TECHNICAL RAIDER|5|ST/HP:65 DR:150/80 MOVE:8L/- SM:+3 HND:+3 SR:2 CREW:driver_and_gunner FRAGILE:penetrating_hit_over_30_immobilizes_on_a_failed_HT_roll|FRAME // VEHICLE|[DATA_NOT_FOUND]|CREW|Driver, gunner|Raids, scouting, harassment|A cargo truck, a welded mount and a gunner with nothing to lose. Rebels field more of these than knights.|0|8|0
```

- **Design intent:** A cheap, fast, fragile Rebel vehicle for players without mechs.
- **Balance:** Against the TL8-TANK (8 EP, 120 HP, DR 300/180, 3L) it has about half the toughness for 8L Move and HND +3, and a hard hit can immobilize it.
- **EP logic:** The vehicle rule 2 + HP/20 at 65 HP gives 5.25, so EP 5.

### 31. OLEUM SPIKE CELL (Rebel, R, EP 3)

```
R|OLEUM SPIKE CELL|3|ST/HP:+40% HEAT:10 VENT:3 HND:+1 RAD:40/sortie BREACH:penetrating_torso_hit_over_50_needs_an_HT_roll_or_+25_rads NOTE:+15_rads/turn_ending_in_danger_zone_+40_in_redline NOTE:no_fuel_or_FP_costs NOTE:radiation_signature_+3_to_enemy_sensor/detection|REACTOR // BOOTLEG OLEUM CELL|[DATA_NOT_FOUND]|FUEL|Unshielded Oleum Vis slurry|Light Oleum power for raiders|The Empire rations Oleum to knights it can afford to lose slowly. The Rebels hand it to anyone brave enough and call the dosimeter a suggestion.|0|8|1
```

- **Design intent:** A bootleg Oleum cell: light, vents well, and very dirty.
- **Balance:** Against the OLEUM VIS CORE (4 EP, +60%, HEAT 12, VENT 2, 25 rads per sortie) it gets VENT 3 and HND +1. The price is 20% less HP, 40 rads per sortie, harsher rads in the danger zone, a +3 signature, and breach rads from big torso hits.
- **EP logic:** The reactor rule gives 40% / 15 = 2.7, so EP 3.

### 32. POGO-JET HOP THRUSTERS (Rebel, T, EP 0)

```
T|POGO-JET HOP THRUSTERS|0|MOVE:+10% JUMP:free_hop_up_to_1/4_MOVE_once_per_turn SR:-1 FRAGILE:any_thruster_crit_destroys_them|THRUSTER // HOP JETS|[DATA_NOT_FOUND]|FUEL|Hydrazine blend|Climbing over cover, dodging|Cheap enough to replace after every raid, which is good, because they will need replacing after every raid.|0|8|0
```

- **Design intent:** Vertical agility instead of speed. It is fragile.
- **Balance:** LIGHTWEIGHT THRUSTERS (1 EP) give +15%. These give up 1 EP and 5% Move for a free quarter-Move hop every turn, but any thruster crit destroys them.
- **EP logic:** The thruster rule gives 10% / 12 = 0.8, about 1. The free hop is worth about 1 (half of JUMP JETS' 2 EP for half the jump), so EP 0.

### 33. BURST CRUNCHER FIRE CONTROL (Rebel, G, EP 0)

```
G|BURST CRUNCHER FIRE CONTROL|0|ACC-ALL:+0 RAPID:ROF_hit_bonus_one_step_higher_for_ROF_4+ NOTE:bursts_of_ROF_4+_use_double_ammo|TARGETING // BURST CALCULATOR|[DATA_NOT_FOUND]|LINK|Bootleg ballistic chip|Making bursts land|Rebel code: brilliant, undocumented, and allergic to conserving anything.|0|8|0
```

- **Design intent:** Hooks into the GURPS rapid-fire bonus so autocannons hit more often, at the cost of doubled ammo use.
- **Balance:** STANDARD FIRE CONTROL (0 EP) gives +1 to everything. This gives roughly +1 only to bursts of ROF 4 or more, and halves the endurance of the 30mm, 35mm and 40mm magazines.
- **EP logic:** Under the targeting rule, ACC +0 gives 1, and the conditional rapid-fire step is worth about -1 (half of a +1 ACC-ALL step at 1.5 per +1, rounded), so EP 0.

## Remans (TL10): bushido tech that is overpowered but beatable

### 34. HAGANE-YUMI GAUSS LONGBOW (Reman, A, EP 5)

```
A|HAGANE-YUMI GAUSS LONGBOW|5|ROF:1 DMG:6dx25(5) AVG:525 ACC:6 RCL:2 RNG:200/640 AMMO:4(1) HEAT:+4/shot DRAW:an_Aim_maneuver_is_required_before_every_shot NOTE:taking_damage_while_drawing_breaks_the_Aim NOTE:near-silent_firing_gives_no_detection_bonus|ELECTROMAGNETIC // COIL LONGBOW|3.6 t|POWER|Coil capacitors, hyperdense bolts|Duelling at long range|The archer draws, breathes, and waits for the target to choose its own moment. Reman marksmen say the bow is only a way of listening.|1|10|1
```

- **Design intent:** A Reman TL10 sniper weapon. Its weakness is tempo: it has to Aim before every shot, and taking damage breaks the Aim.
- **Balance:** At (5) it puts 525-100 = 425 through DR 500, against 400 for the SKYFALL CAPACITOR RAILGUN at (4). Both fire at most every other turn. The longbow's draw can be broken by damage, it adds +4 heat per shot, and it carries only 4 bolts.
- **EP logic:** 3.6 t gives 4.7, so EP 5. Capacitor energy shows up as HEAT.
- **Derivation:** Cole formula on an assumed 6 kg hyperdense bolt with a 30mm core in a 60mm sabot at 950 m/s (KE 2.7 MJ): 516 points, so 6dx25 (525). In Ultra-Tech, electromagnetic guns default to (3), and hyperdense ammo replaces that with (5) (Enraged Eggplant; r/gurps thread citing UT p.152). That (5) is reserved for Reman TL10. RNG is Baughn / 15 = 199/637, rounded to 200/640, under the 750 rocket ceiling.

### 35. NAGINATA HIGH-FREQUENCY GLAIVE (Reman, A, EP 3)

```
A|NAGINATA HIGH-FREQUENCY GLAIVE|3|ROF:X DMG:80d(4) AVG:280 REACH:2 NOTE:sweep_two_adjacent_targets_at_-4_each NOTE:-2_to_hit_targets_inside_reach_1|MELEE // REMAN POLEARM|1.1 t|POWER|HF emitter, ~20 min|Holding reach, sweeping|The naginata keeps the enemy where the Reman wants them: one step too far away to answer.|1|10|0
```

- **Design intent:** Reman melee that wins on reach and sweeps, not divisor. It is vulnerable to anyone who gets inside its reach.
- **Balance:** It puts 280-125 = 155 through DR 500, against 141 for the VIBROBLADE (HEAVY) and 194 for the KAGEROU MONOMOLECULAR TACHI at (5). Reach 2 is its advantage, and it takes -2 against enemies inside reach 1.
- **EP logic:** 1.1 t gives 2.6, so EP 3.
- **Derivation:** Uses the baseline melee fit: 79 + 13 ln(1.1) = 80.2, so 80d, AVG 280. The high-frequency edge gets (4), one step below the Tachi's monomolecular (5). Extrapolated.

### 36. WAKIZASHI GUARD BLADE (Reman, A, EP 2)

```
A|WAKIZASHI GUARD BLADE|2|ROF:X DMG:67d(5) AVG:234.5 DEF:+2_Parry_vs_melee EFFECT:a_successful_Parry_grants_a_free_riposte_at_-2 NOTE:no_Parry_bonus_vs_ranged|MELEE // REMAN SHORT BLADE|0.4 t|EDGE|Monomolecular laminate|Off-hand parrying|The short sword is the one a Reman keeps when everything else is gone. Our duelists learned to respect the second blade the hard way.|0|10|0
```

- **Design intent:** A one-handed parry weapon for duels. It does nothing against guns.
- **Balance:** The SMALL SHIELD (2 EP) gives DR against everything. This gives +2 Parry against melee only, plus a riposte that puts 135 through DR 500. The VIBROBLADE (LIGHT) puts 57 through.
- **EP logic:** 0.4 t gives 1.6, so EP 2.
- **Derivation:** Uses the baseline melee fit: 79 + 13 ln(0.4) = 67.1, so 67d, AVG 234.5. The monomolecular edge is (5), the Reman TL10 tier. Extrapolated.

### 37. HIKARI PARTICLE LANCE (Reman, A, EP 5)

```
A|HIKARI PARTICLE LANCE|5|ROF:1 DMG:6dx21(5) AVG:441 ACC:6 RCL:0 RNG:120/400 HEAT:+5/shot NOTE:no_ammo NOTE:in_smoke_rain_or_dust_the_divisor_drops_to_(3)|BEAM // CHARGED-PARTICLE CANNON|3.6 t|POWER|Core-fed, ~2.5 MJ per shot|Heavy beam fire|Light, the Remans call it, and they do not mean it poetically. Our sensor crews call it the reason to stand in the smoke.|1|10|1
```

- **Design intent:** A TL10 heavy beam with unlimited shots, limited by heat. Imperial smoke counters it.
- **Balance:** It puts 441-100 = 341 through DR 500, against 306 for the 90mm HEAVY RIFLE, with no ammo limit. At +5 heat per shot, a Standard core (HEAT 10) reaches the danger zone after 1 shot and redline after 2. In smoke it drops to 441-167 = 274.
- **EP logic:** 3.6 t gives 4.7, so EP 5. Power comes from the core, so it shows up as HEAT.
- **Derivation:** Ultra-Tech charged-particle blasters appear at TL10 as heavy mounted cannons, do burning surge damage at (5), and are recoilless with worse range than lasers (Enraged Eggplant). Damage applies Cole's energy term to a 2.5 MJ shot on a 40mm beam (an extrapolation): 452 points, so 6dx21 (441). RNG 120/400 is set below the laser's 150/500, which is extrapolated.

### 38. KAGEBOSHI REMOTE BITS (Reman, A, EP 4)

```
A|KAGEBOSHI REMOTE BITS|4|ROF:4 DMG:6dx7(3) AVG:147(588) ACC:4 RCL:0 RNG:100/400 REAR:bits_strike_the_rear_DR_value NOTE:pilot_EW_roll_each_turn_to_command NOTE:ECM_SUITE_tier_2+_in_radius_grounds_the_bits NOTE:4_bits_HP:10_each|ELECTROMAGNETIC // REMOTE WEAPON BITS|0.8 t|POWER|4 coil-gun bits, ~4 kW link|Attacking from every angle|Shadow-children, the Reman pilots call them. Four small guns, one mind, and no safe facing anywhere on the field.|0|10|1
```

- **Design intent:** Gundam-style bits. A TL10 trick that works through flanking rather than divisor, and the ECM ladder counters it.
- **Balance:** Hitting rear DR 250 at (3), it puts 4x64 = 256 through per turn, against 110 per turn for the 30mm AUTOCANNON against the front. It needs an EW roll every turn, enemy ECM tier 2 grounds it, and each bit has 10 HP.
- **EP logic:** 0.8 t and 4 kW give max(2.2, 4), so EP 4.
- **Derivation:** Cole formula on an assumed 0.4 kg 15mm coil slug at 900 m/s: 148 points, so 6dx7 (147). Ultra-Tech electromagnetic guns default to (3) (Enraged Eggplant). Ballistic range by Baughn / 15 would be 190/617, but the control link limits it to 100/400, which is extrapolated.

### 39. HAKKEI DEFLECTOR FIELD (Reman, D, EP 5)

```
D|HAKKEI DEFLECTOR FIELD|5|DR:260/200 HP:250 HEAT:+3/Block NOTE:forearm_emitter_the_hand_stays_free NOTE:collapses_while_HEAT_is_in_redline NOTE:HP_fully_restored_between_sorties|SHIELD // BEAM DEFLECTOR|0.8 t|POWER|Forearm emitter, ~5 kW|Blocking while both hands stay armed|A Reman blocks with an open hand. Our engineers have measured the field three times and stopped believing the readings.|0|10|1
```

- **Design intent:** A Reman shield that leaves the hand free, limited by heat and the redline.
- **Balance:** The LARGE SHIELD (5 EP, 2.9 t) has DR 200/120 and HP 300. This has DR 260/200 and HP 250, with a hand free, but each Block costs +3 heat and it collapses at redline.
- **EP logic:** 5 kW beats the shield mass term of 3 x sqrt(0.8) = 2.7, so EP 5.

### 40. LACQUERED O-YOROI PLATING (Reman, D, EP 4)

```
D|LACQUERED O-YOROI PLATING|4|DR:+15% NOTE:does_not_stack_with_other_percent_armor LOGISTICS:without_Reman_lacquer_between_sorties_drops_to_+5%|ARMOR // LAMELLAR PLATING|2.0 t|MATERIAL|Lacquered TL10 lamellae|Durable armor with a supply chain|Every plate is lacquered by hand at a temple-foundry. Captured suits rust within a season. We have tried six lacquers.|0|10|0
```

- **Design intent:** Better percentage armor that degrades without Reman logistics.
- **Balance:** REINFORCED ARMOR (3 EP, 1.2 t) gives +10%. This gives +15% (+75 on a Medium frame) for 4 EP and 2.0 t, and drops to +5% if it misses its Reman maintenance.
- **EP logic:** 2.0 t gives 3.5, rounded half-up to EP 4.

### 41. KAESHI POINT-DEFENSE LASER (Reman, D, EP 3)

```
D|KAESHI POINT-DEFENSE LASER|3|EFFECT:once_per_turn_intercept_one_rocket_or_missile_hit_on_12_or_less HEAT:+3/intercept NOTE:no_effect_vs_kinetic_beam_or_melee NOTE:vs_a_salvo_stops_one_missile_only|ECM // POINT-DEFENSE LASER|0.5 t|POWER|Turret laser, ~3 kW|Swatting rockets|Kaeshi: the return. Rebel rocket crews have learned to fire everything at once.|0|10|0
```

- **Design intent:** An active anti-rocket defense. Salvos overwhelm it.
- **Balance:** SPACED ARMOR PANELS (2 EP) passively add a divisor step. This deletes one rocket per turn with about a 74% chance, at +3 heat each. The 60mm pod or the HORNET 80mm ALPHA POD lose 1 of 8 or 1 of 4 rockets.
- **EP logic:** 0.5 t and 3 kW give max(1.8, 3), so EP 3.

### 42. SHUKUCHI FLASH-STEP (Reman, U, EP 3)

```
U|SHUKUCHI FLASH-STEP|3|USES:3/sortie EFFECT:after_an_enemy_attack_roll_hits_shift_5m_and_Dodge_at_+3 HEAT:+4/use NOTE:no_effect_vs_area_or_salvo_attacks|MOBILITY // FLASH-STEP JETS|0.6 t|POWER|Micro-thruster ring, ~3 kW|Avoiding killing shots|Shukuchi: shrinking the earth. It is there on the sensor, and then it is five meters to the left and smiling.|0|10|1
```

- **Design intent:** A reactive Active Defense boost limited by uses and heat. Salvos counter it.
- **Balance:** ROCKET BOOSTERS (2 EP) give +50% Move and -1 to defense. This gives +3 Dodge against one attack, 3 times per sortie, at +4 heat each, and does nothing against area attacks or salvos.
- **EP logic:** 0.6 t and 3 kW give max(1.9, 3), so EP 3.

### 43. TSUKUROI NANITE MENDER (Reman, U, EP 3)

```
U|TSUKUROI NANITE MENDER|3|USES:2/sortie REPAIR:25_HP EFFECT:Ready_restores_one_location_self_or_adjacent_ally_no_roll NOTE:cannot_restore_crippled_or_destroyed NOTE:refills_only_at_a_Reman_shrine-depot|SUPPORT // NANITE REPAIR|0.5 t|POWER|Nanite reservoir, ~3 kW|Squad repair without a roll|Tsukuroi: mending. The swarm repairs a wound the way a monk repairs a robe, slowly and with great care.|0|10|0
```

- **Design intent:** Reliable Reman squad repair with limited supply.
- **Balance:** The FIELD WORKSHOP RIG at tier 2 (4 EP) restores 60 HP across 3 uses with a roll. This restores 50 HP with no roll, but has only 2 uses and refills only at a shrine-depot.
- **EP logic:** 0.5 t and 3 kW give max(1.8, 3), so EP 3.

### 44. KAGURA OLEUM LANTERN (Reman, U, EP 2)

```
U|KAGURA OLEUM LANTERN|2|RADIUS:50m EFFECT:allied_pilots_in_radius_halve_Oleum_Vis_rads VENT:-1_while_lit NOTE:does_not_stack_with_SHRINE-GRADE_COCKPIT_SHIELDING NOTE:a_lit_lantern_is_+2_to_enemy_detection|SUPPORT // RADIATION WARD|0.4 t|POWER|Lattice ward lamp, ~2 kW|Protecting allied pilots from rads|The lantern-bearer walks at the center of the line and the line breathes easier. Reman pilots bow to it before a battle.|0|10|1
```

- **Design intent:** A squad version of Reman shielding. The bearer loses 1 VENT and becomes easier to detect.
- **Balance:** SHRINE-GRADE COCKPIT SHIELDING (3 EP) divides rads by 5 for one pilot. This halves rads for every ally within 50m (an OLEUM VIS CORE pilot goes from 25 rads per sortie to 12.5), at -1 VENT and +2 detection.
- **EP logic:** 0.4 t and 2 kW give max(1.6, 2), so EP 2.

### 45. SHINOBI SIGNATURE DAMPERS (Reman, U, EP 2)

```
U|SHINOBI SIGNATURE DAMPERS|2|TIERS:3 DETECT:-2/-4/-6 NOTE:a_SENSOR_SUITE_of_equal_or_higher_tier_ignores NOTE:offline_while_HEAT_is_in_danger_zone_or_redline|EW // SIGNATURE DAMPERS|0.2-0.7 t|POWER|2-4 kW emission scrubbers|Stealth approach|Our sensors hear a Reman knight the way you hear a held breath.|0|10|0
```

TIER entry:
```
"SHINOBI SIGNATURE DAMPERS":[[2, "TIER:1 DETECT:-2 NOTE:a_SENSOR_SUITE_of_equal_or_higher_tier_ignores NOTE:offline_while_HEAT_is_in_danger_zone_or_redline", "0.2 t", "Exhaust baffles, ~2 kW", "Baffled exhaust and quiet actuators."], [3, "TIER:2 DETECT:-4 NOTE:a_SENSOR_SUITE_of_equal_or_higher_tier_ignores NOTE:offline_while_HEAT_is_in_danger_zone_or_redline", "0.4 t", "Emission scrubbers, ~3 kW", "Scrubbed emissions across the radar and thermal bands."], [4, "TIER:3 DETECT:-6 NOTE:a_SENSOR_SUITE_of_equal_or_higher_tier_ignores NOTE:offline_while_HEAT_is_in_danger_zone_or_redline", "0.7 t", "Full shinobi suite, ~4 kW", "A knight-sized absence on every screen."]]
```

- **Design intent:** Tiered self-stealth that counters the Oleum signature. The matching Sensor tier beats it, and heat shuts it off.
- **Balance:** The ECM SUITE (2/4/6 EP) gives -4/-8/-12 to detection over an area. This gives -2/-4/-6 to the user only, for 2/3/4 EP, and stops working once the user runs hot.
- **EP logic:** The tiers use 2/3/4 kW, so EP 2/3/4 (the mass term at 0.2/0.4/0.7 t is 1.1/1.6/2.1).

### 46. TENGU-CLASS SKY FRAME (Reman, F, EP 3)

```
F|TENGU-CLASS SKY FRAME|3|ST/HP:125 DR:450/225 MOVE:8L/30S SM:+6 HND:+3 SR:1 AIRTIME:6_turns_of_air_MOVE_per_sortie LOGISTICS:repairs_take_x2_time_without_Reman_crews|FRAME // MECH|[DATA_NOT_FOUND]|ORIGIN|Reman mountain foundry, TL10|Aerial skirmishing, high ground|The Tengu does not fly so much as decline to land. Pilots train for a decade before their first sortie.|0|10|1
```

- **Design intent:** A flying Reman mech. Its weaknesses are low capacity, limited air time and logistics.
- **Balance:** Against the LIGHT FRAME (3 EP, 125 HP, DR 400/200, 11L/22S) it gets DR +50 and 30S air Move (the TL8-FIGHTER has 27S), but only 6 turns of flight per sortie, slower ground Move, and only 3 EP.
- **EP logic:** The frame rule gives (125 - 87.5) / 12.5 = 3, so EP 3. The extra DR and flight are paid for with AIRTIME and LOGISTICS instead of capacity.

### 47. TL10-KAGO HOVER TANK (Reman, F, EP 9)

```
F|TL10-KAGO HOVER TANK|9|ST/HP:140 DR:480/300 MOVE:6L/- SM:+4 HND:+2 SR:3 CREW:driver_gunner_commander SKIRT:20_HP_a_penetrating_skirt_hit_halves_MOVE LOGISTICS:repairs_take_x2_time_without_Reman_crews|FRAME // VEHICLE|[DATA_NOT_FOUND]|CREW|Driver, gunner, commander|Fast armored support|It crosses rivers our tanks must bridge and fields our tanks must bypass. Its skirts, thankfully, are made of cloth-weave and pride.|0|10|1
```

- **Design intent:** A Reman hover tank. It is twice as fast as Imperial armor, and its weak skirt is the counterplay.
- **Balance:** Against the TL8-TANK (8 EP, 120 HP, DR 300/180, 3L) it gets +17% HP, +60% DR, double Move and +1 EP. A 20 HP skirt can halve its Move, and repairs are slow.
- **EP logic:** The vehicle rule gives 2 + 140/20 = 9, so EP 9.

### 48. TAMASHII RESONANCE CORE (Reman, R, EP 4)

```
R|TAMASHII RESONANCE CORE|4|ST/HP:+55% HEAT:11 VENT:3 SHUTDOWN:ECM_SUITE_tier_3_in_radius_drops_VENT_to_1 LOGISTICS:repairs_take_x2_time_without_Reman_crews|REACTOR // RESONANCE CORE|[DATA_NOT_FOUND]|FUEL|Resonant lattice, TL10|Clean TL10 power|Tamashii: soul. The core hums a note that Reman engineers tune by ear. Imperial jammers, it turns out, sing off-key.|0|10|1
```

- **Design intent:** A clean TL10 core with no Oleum. It vents best of any core, and heavy enemy ECM counters it.
- **Balance:** Against the STANDARD FUSION CORE (3 EP, +50%, HEAT 10, VENT 2) it gets +5% HP, +1 HEAT and +1 VENT. ECM tier 3 (6 EP for the enemy) drops its VENT to 1.
- **EP logic:** The reactor rule gives 55% / 15 = 3.7, so EP 4.

### 49. KAZE-NO-MAI VECTOR THRUSTERS (Reman, T, EP 2)

```
T|KAZE-NO-MAI VECTOR THRUSTERS|2|MOVE:+30% HND:+2 SR:-1 LOGISTICS:repairs_take_x2_time_without_Reman_parts|THRUSTER // VECTOR THRUSTERS|[DATA_NOT_FOUND]|FUEL|TL10 vectored plasma jets|Duelling agility|Kaze-no-mai: wind dance. The jets turn the knight the way a fan turns in a dancer's hand.|0|10|0
```

- **Design intent:** Agile TL10 thrusters. Their weakness is logistics and stability.
- **Balance:** Against STANDARD THRUSTERS (2 EP, +25%) it gets +5% Move and +2 HND at SR -1, with slow repairs.
- **EP logic:** The thruster rule gives 30% / 12 = 2.5. The extra HND point costs about 0.5, so EP 2.

### 50. ZANSHIN PREDICTIVE LINK (Reman, G, EP -2)

```
G|ZANSHIN PREDICTIVE LINK|-2|ACC-MELEE:+3 ACC-RANGED:-1 DEF:+1_Parry NOTE:Parry_bonus_lost_while_HEAT_is_in_danger_zone_or_redline|TARGETING // DUELIST LINK|[DATA_NOT_FOUND]|LINK|Neural predictive sync, TL10|Melee duelling|Zanshin: the remaining mind. The pilot's attention stays on the opponent after the cut. The link only makes it literal.|0|10|0
```

- **Design intent:** A bushido melee targeting suite. Running hot breaks the pilot's focus.
- **Balance:** The LINKED FIRE CONTROL SUITE melee spec (-1 EP) gives +2 melee and -1 to others. This gives +3 melee, +1 Parry and -1 ranged for -2 EP, and loses the Parry when running hot.
- **EP logic:** Using the specialist pattern (LINKED -1 for +2/-1), the extra +1 melee and +1 Parry cost about -1 more, so EP -2.

## RAW only (paste-ready, 50 lines)

```
A|105mm SIEGE MORTAR|4|ROF:1 DMG:6dx23(4) AVG:483 ACC:2 RCL:4 RNG:131/656 AMMO:4(1) INDIRECT:-10_without_spotter NOTE:spotter_Forward_Observer_margin_reduces_the_-10 NOTE:indirect_fire_only NOTE:minimum_range_25|ROCKET/MISSILE // BREECH MORTAR|3.0 t|AMMO|105mm top-attack HEAT bombs, 4-rd rack|Indirect fire with a spotter|The mortar does not care whether its crew can see the enemy, only whether somebody can. Imperial doctrine pairs every mortar knight with a scout who is expected to be brave, patient and very well hidden.|0|8|1
A|35mm GARRISON AUTOCANNON|3|ROF:4 DMG:6dx10(3) AVG:210(840) ACC:4 RCL:2 RNG:142/512 AMMO:16(1) RELIABLE:crit_fail_is_a_miss_not_a_malfunction|BALLISTIC // CHAIN AUTOCANNON|1.6 t|AMMO|35mm APDS-T, 16-rd box|Dependable mid-range anti-armor|Our quartermasters keep a garrison cannon that has fired in eleven campaigns on two barrels. It is not exciting, and that is the point.|0|8|0
A|IMPACT MAUL|4|ROF:X DMG:94d(3) AVG:329 EFFECT:any_penetrating_hit_forces_a_STABILITY_check NOTE:-1_to_hit_on_the_turn_after_a_miss|MELEE // POWER MAUL|3.2 t|POWER|Hydraulic head accumulator, ~30 min|Toppling knights, breaking formations|The maul was meant to retire with the old foot knights. It refused. A knight on the ground is a knight out of the fight, and nothing puts one there faster.|1|8|0
A|60mm RIPPLE ROCKET BATTERY|3|ROF:6 DMG:4dx12(4) AVG:168(1008) ACC:5 RCL:4 RNG:75/375 AMMO:12(2) NOTE:+2_Active_Defense_vs_missiles NOTE:fires_two_6-rocket_salvos|ROCKET/MISSILE // SALVO BATTERY|1.2 t|AMMO|60mm fin-stabilized HEAT, 12 tubes|Sustained area suppression|Same rocket as the pod, twice the tubes, half the glamour. Line regiments like it because a second salvo is a second chance.|0|8|0
A|OLEUM BREACHING TORCH|2|ROF:X DMG:76d(4) AVG:266 HEAT:+3/hit RAD:+5_pilot_per_hit NOTE:requires_OLEUM_VIS_CORE NOTE:close_combat_only|MELEE // PLASMA CUTTER|0.8 t|FUEL|Oleum Vis bleed line from the core|Breaching hulls and bunkers|Sappers used it on vault doors long before anyone thought to swing it at a knight. The cockpit dosimeter clicks every time it bites.|0|8|1
D|MANTLET SHIELD|6|DR:240/180 HP:400 EFFECT:plant_as_freestanding_cover_for_one_adjacent_ally NOTE:plant_or_lift_is_a_Ready NOTE:no_Block_for_the_bearer_while_planted|SHIELD // PLANTABLE MANTLET|4.0 t|MATERIAL|Spaced plate on folding stands|Covering a teammate|A tower shield that can be put down and walked away from. Imperial gun-lines leapfrog behind them like siege engineers of old.|0|8|0
D|CROWN-GRADE SPALL LINER|2|DR:+60_torso_only EFFECT:pilot_ignores_spall_injury_from_torso_hits NOTE:stacks_with_percent_armor|ARMOR // COCKPIT LINER|0.8 t|MATERIAL|Aramid-ceramic quilting|Keeping the pilot alive|Plate keeps the knight standing. The liner keeps the knight's pilot attending court next season.|0|8|0
D|SMOKE DISCHARGERS|1|EFFECT:20m_smoke_ranged_-3_into_through_or_out USES:2 DURATION:3_turns NOTE:SENSOR_SUITE_tier_2_halves_to_-1_tier_3_negates NOTE:lasers_and_beams_lose_1_divisor_step_through_smoke NOTE:deploy_is_a_free_action|ECM // SMOKE MORTARS|0.3 t|AMMO|Multispectral smoke, 2 volleys|Breaking line of sight|The oldest countermeasure we own and still the one the Remans complain about.|0|8|0
U|FIELD WORKSHOP RIG|2|TIERS:3 REPAIR:10/20/30_HP USES:2/3/4 EFFECT:Ready_plus_Mechanic_roll_restores_HP_to_one_location_self_or_adjacent_ally NOTE:cannot_uncripple_or_restore_destroyed|SUPPORT // FIELD WORKSHOP|0.4-1.6 t|POWER|2-6 kW welder and tool arm|Squad repair|Every Imperial lance carries one knight who is secretly a blacksmith. The others pretend not to notice until they need her.|0|8|0
U|HERALDIC COMMAND MAST|2|EFFECT:designate_1_target/turn_allies_with_LOS_to_the_mast_+1_ACC_vs_it RADIUS:300m NOTE:allies_in_radius_+1_Will_vs_fear NOTE:bearer_+2_to_enemy_detection NOTE:lost_if_head_destroyed|SUPPORT // COMMAND BANNER|0.5 t|POWER|IFF and laser designator, ~2 kW|Lance command, focus fire|The banner tells your lance where to shoot. It also tells the enemy exactly which knight to kill first, which is why we issue it to the proud ones.|0|8|0
U|OLEUM CHELATION INJECTOR|1|RAD:-10_per_use USES:2/sortie NOTE:each_use_costs_the_pilot_1_FP_and_-2_DX_next_turn NOTE:only_removes_rads_gained_this_sortie NOTE:refill_at_a_field_hospital|SUPPORT // PILOT MEDICAL|0.1 t|POWER|Chelating agent, 2 doses|Making Oleum survivable at TL8|It is not shielding. It is an apology delivered by needle. The pilots take it anyway.|0|8|0
U|RECOVERY TOW WINCH|1|EFFECT:tow_one_disabled_ally_at_half_MOVE NOTE:snag_an_enemy_limb_at_20m_Quick_Contest_of_ST NOTE:cable_HP:15|SUPPORT // RECOVERY WINCH|0.3 t|POWER|Torso winch, 60 m cable|Dragging allies out of the fire|Leave no knight on the field. The winch is how that oath gets kept on a Tuesday.|0|8|0
F|CASTELLAN SUPERHEAVY FRAME|9|ST/HP:200 DR:800/400 MOVE:5L/10S SM:+7 HND:0 SR:3 BULK:-1_Dodge|FRAME // MECH|[DATA_NOT_FOUND]|ORIGIN|Imperial arsenal foundries, line-built|Breakthrough, holding the line|Castellans are older than most noble houses and better maintained. They do not charge; they arrive.|0|8|1
F|TL8-ARMORED CARRIER|5|ST/HP:110 DR:280/160 MOVE:4L/- SM:+4 HND:+1 SR:3 CREW:driver_and_commander CARGO:6_infantry_or_2_downed_pilots|FRAME // VEHICLE|[DATA_NOT_FOUND]|CREW|Driver, commander, troop bay|Moving infantry and rescuing pilots|The carrier has no glory and no enemies; nobody bothers to shoot it until it has already unloaded.|0|8|0
R|ANCESTRAL THERMAL-MASS CORE|3|ST/HP:+40% HEAT:15 VENT:1 HND:-1 RUGGED:first_reactor_crit_each_sortie_ignored|REACTOR // THERMAL-MASS FISSION PILE|[DATA_NOT_FOUND]|FUEL|Graphite-moderated pile, decades per load|Soaking heat in long fights|It runs warm for an hour before battle and keeps running long after newer cores have tripped their breakers.|0|8|0
T|LONG-SERVICE THRUSTERS|2|MOVE:+20% HND:-1 SR:+2 RUGGED:first_thruster_crit_each_sortie_ignored|THRUSTER // GARRISON THRUSTERS|[DATA_NOT_FOUND]|FUEL|Standard Imperial blend|Reliable repositioning|Rated for a century of service. Two of the sets in our depot have already done it.|0|8|0
G|DRESSED-LINE FIRE CONTROL|-1|ACC-ALL:+1 VOLLEY:+1_ACC_per_other_ally_with_this_suite_firing_at_the_same_target_this_turn_max_+2 NOTE:allies_within_100m|TARGETING // VOLLEY NET|[DATA_NOT_FOUND]|LINK|Lance fire-direction net|Coordinated volleys|One knight shoots. Three knights in step fire a volley. The difference has toppled dynasties.|0|8|0
A|HAILSTORM 40mm ROTARY CANNON|4|ROF:5 DMG:6dx11(3) AVG:231(1155) ACC:3 RCL:3 RNG:128/480 AMMO:15(2) HEAT:+3/burst SPINUP:ROF_2_on_first_turn_firing NOTE:any_penetrating_hit_to_the_gun_arm_destroys_the_feed|BALLISTIC // ROTARY CANNON|3.0 t|AMMO|40mm AP-T, 15-rd drum|Burst damage at mid range|It spins up like a turbine and empties like a promise. Every Rebel cell wants one, and the ones who have one want more ammunition.|1|8|1
A|BREACHER SCATTERGUN|2|ROF:6 DMG:6dx6(3) AVG:126(756) ACC:2 RCL:2 RNG:40/150 AMMO:4(1) NOTE:6_slugs_per_shot_counted_as_ROF NOTE:best_vs_rear_DR_and_vehicles|BALLISTIC // CANISTER GUN|0.8 t|AMMO|65mm slug canister, 4 shells|Flanking, ambushing vehicles|Rebel mechanics call it a door-knocker. The door, in practice, is the back of a knight.|0|8|0
A|RIPSAW CHAIN BLADE|3|ROF:X DMG:84d(3) AVG:294 NOTE:a_shield_Block_or_Parry_jams_it_until_a_Ready NOTE:crit_fail_throws_the_chain_and_destroys_it|MELEE // CHAIN BLADE|1.4 t|POWER|Overdriven motor, ~10 min|One-handed brawling|Imperial blades sing. This one screams, and it keeps screaming right up until it throws its chain into the pilot's own cockpit glass.|0|8|0
A|SUNSPIKE THERMITE PROJECTOR|3|ROF:1 DMG:6dx12(3) AVG:252 ACC:3 RCL:1 RNG:25/100 AMMO:5(1) HEAT:+3/shot TARGET-HEAT:+2_on_penetrating_hit NOTE:20+_penetrating_to_the_mounting_arm_ruptures_the_tank_for_4dx10(3)_to_self|INCENDIARY // THERMITE JET|1.1 t|AMMO|Thermite-gel tank, 5 shots|Cooking enemy cores|Rebels figured out what we never wanted to admit: a knight running hot is already half beaten.|0|8|1
A|HORNET 80mm ALPHA POD|3|ROF:4 DMG:6dx14(4) AVG:294(1176) ACC:5 RCL:5 RNG:100/500 AMMO:4(1) SPARE:0 NOTE:one_salvo_no_reload NOTE:+2_Active_Defense_vs_missiles NOTE:a_penetrating_hit_on_the_loaded_pod_cooks_it_off_for_6dx10(3)_to_torso|ROCKET/MISSILE // ALPHA-STRIKE POD|1.6 t|AMMO|80mm HEAT, 4 tubes, single salvo|Opening alpha strike|Four rockets, one chance, and a pod that would very much like to explode. Rebel doctrine in a single sentence.|0|8|1
A|SALVAGED LASER CARBINE|3|ROF:3 DMG:6dx11(3) AVG:231(693) ACC:6 RCL:1 RNG:150/500 HEAT:+2/shot NOTE:no_ammo NOTE:smoke_rain_or_fog_drop_it_1_divisor_step NOTE:a_penetrating_hit_to_the_mounting_arm_cracks_the_lens_-2_ACC|BEAM // PULSE LASER|1.2 t|POWER|Core-fed, ~600 kJ per pulse|Accurate sustained fire|Pieced together from a downed Reman lance and three civilian mining rigs. It works. Nobody knows for how long.|0|8|1
D|SALVAGE PLATING KIT|1|TIERS:3 DR:+25/+50/+75 HND:0/0/-1 NOTE:each_penetrating_hit_on_a_location_strips_25_DR_there|ARMOR // SCRAP PLATING|0.3-1.0 t|MATERIAL|Welded hull scrap|Cheap, fast survivability|Rebel knights wear the armor of whatever they killed last week. It shows.|0|8|0
D|REACTIVE ARMOR BRICKS|3|EFFECT:negate_the_first_rocket_missile_or_shaped-charge_hit_per_location USES:6 NOTE:allies_within_5m_take_2dx10(3)_splash NOTE:no_effect_vs_kinetic_beam_or_melee|ARMOR // EXPLOSIVE REACTIVE|1.0 t|MATERIAL|Explosive tiles, 6 blocks|Defeating rockets|Rebels bolt explosives to their armor and call it protection. Disturbingly, it is.|0|8|1
U|GRAPPLING HARPOON|1|EFFECT:anchor_to_terrain_within_100m_and_reel_there_as_a_full_Move_ignoring_terrain NOTE:vs_a_mech_Quick_Contest_of_ST_to_pull_or_be_pulled NOTE:cable_HP:10|MOBILITY // HARPOON REEL|0.3 t|POWER|Gas launcher, 4 harpoons|Vertical movement, ambush|Code-named 'the Zipline' by a cell that had no right to survive that canyon.|0|8|0
U|DECOY BEACON DROP|2|USES:2 EFFECT:enemy_must_win_Sensor_vs_your_EW_or_target_the_beacon NOTE:SENSOR_SUITE_tier_3_ignores NOTE:beacon_HP:5_lasts_3_turns NOTE:can_be_thrown_50m_to_cover_an_ally|EW // DECOY BEACONS|0.4 t|POWER|Throwable emitter, ~2 kW|Covering a teammate|It screams 'I am a knight' on every band we know of. Half our pilots now wear one as a joke. The other half are still alive because of it.|0|8|0
U|JURY-RIG FIELD KIT|1|USES:2 EFFECT:Ready_plus_Mechanic-2_uncripples_one_limb_for_the_sortie NOTE:failing_by_5+_destroys_that_limb NOTE:works_on_self_or_an_adjacent_ally|SUPPORT // JURY-RIG|0.2 t|MATERIAL|Clamps, cable, tape|Getting a limb working again|Imperial manuals say a crippled limb needs a depot. Rebel mechanics say it needs a clamp and a positive attitude.|0|8|0
U|MESH NET RELAY|2|EFFECT:allies_with_a_relay_within_500m_share_the_highest_SENSOR_SUITE_tier_in_the_net NOTE:if_any_node_is_inside_enemy_ECM_of_equal_or_higher_tier_the_whole_net_drops NOTE:each_node_+1_to_enemy_detection|EW // MESH RELAY|0.3 t|POWER|Burst-mesh radio, ~2 kW|Sharing sensors|Democratic warfare: everyone sees what the best-equipped cell sees, and everyone goes blind together.|0|8|0
F|TL8-TECHNICAL RAIDER|5|ST/HP:65 DR:150/80 MOVE:8L/- SM:+3 HND:+3 SR:2 CREW:driver_and_gunner FRAGILE:penetrating_hit_over_30_immobilizes_on_a_failed_HT_roll|FRAME // VEHICLE|[DATA_NOT_FOUND]|CREW|Driver, gunner|Raids, scouting, harassment|A cargo truck, a welded mount and a gunner with nothing to lose. Rebels field more of these than knights.|0|8|0
R|OLEUM SPIKE CELL|3|ST/HP:+40% HEAT:10 VENT:3 HND:+1 RAD:40/sortie BREACH:penetrating_torso_hit_over_50_needs_an_HT_roll_or_+25_rads NOTE:+15_rads/turn_ending_in_danger_zone_+40_in_redline NOTE:no_fuel_or_FP_costs NOTE:radiation_signature_+3_to_enemy_sensor/detection|REACTOR // BOOTLEG OLEUM CELL|[DATA_NOT_FOUND]|FUEL|Unshielded Oleum Vis slurry|Light Oleum power for raiders|The Empire rations Oleum to knights it can afford to lose slowly. The Rebels hand it to anyone brave enough and call the dosimeter a suggestion.|0|8|1
T|POGO-JET HOP THRUSTERS|0|MOVE:+10% JUMP:free_hop_up_to_1/4_MOVE_once_per_turn SR:-1 FRAGILE:any_thruster_crit_destroys_them|THRUSTER // HOP JETS|[DATA_NOT_FOUND]|FUEL|Hydrazine blend|Climbing over cover, dodging|Cheap enough to replace after every raid, which is good, because they will need replacing after every raid.|0|8|0
G|BURST CRUNCHER FIRE CONTROL|0|ACC-ALL:+0 RAPID:ROF_hit_bonus_one_step_higher_for_ROF_4+ NOTE:bursts_of_ROF_4+_use_double_ammo|TARGETING // BURST CALCULATOR|[DATA_NOT_FOUND]|LINK|Bootleg ballistic chip|Making bursts land|Rebel code: brilliant, undocumented, and allergic to conserving anything.|0|8|0
A|HAGANE-YUMI GAUSS LONGBOW|5|ROF:1 DMG:6dx25(5) AVG:525 ACC:6 RCL:2 RNG:200/640 AMMO:4(1) HEAT:+4/shot DRAW:an_Aim_maneuver_is_required_before_every_shot NOTE:taking_damage_while_drawing_breaks_the_Aim NOTE:near-silent_firing_gives_no_detection_bonus|ELECTROMAGNETIC // COIL LONGBOW|3.6 t|POWER|Coil capacitors, hyperdense bolts|Duelling at long range|The archer draws, breathes, and waits for the target to choose its own moment. Reman marksmen say the bow is only a way of listening.|1|10|1
A|NAGINATA HIGH-FREQUENCY GLAIVE|3|ROF:X DMG:80d(4) AVG:280 REACH:2 NOTE:sweep_two_adjacent_targets_at_-4_each NOTE:-2_to_hit_targets_inside_reach_1|MELEE // REMAN POLEARM|1.1 t|POWER|HF emitter, ~20 min|Holding reach, sweeping|The naginata keeps the enemy where the Reman wants them: one step too far away to answer.|1|10|0
A|WAKIZASHI GUARD BLADE|2|ROF:X DMG:67d(5) AVG:234.5 DEF:+2_Parry_vs_melee EFFECT:a_successful_Parry_grants_a_free_riposte_at_-2 NOTE:no_Parry_bonus_vs_ranged|MELEE // REMAN SHORT BLADE|0.4 t|EDGE|Monomolecular laminate|Off-hand parrying|The short sword is the one a Reman keeps when everything else is gone. Our duelists learned to respect the second blade the hard way.|0|10|0
A|HIKARI PARTICLE LANCE|5|ROF:1 DMG:6dx21(5) AVG:441 ACC:6 RCL:0 RNG:120/400 HEAT:+5/shot NOTE:no_ammo NOTE:in_smoke_rain_or_dust_the_divisor_drops_to_(3)|BEAM // CHARGED-PARTICLE CANNON|3.6 t|POWER|Core-fed, ~2.5 MJ per shot|Heavy beam fire|Light, the Remans call it, and they do not mean it poetically. Our sensor crews call it the reason to stand in the smoke.|1|10|1
A|KAGEBOSHI REMOTE BITS|4|ROF:4 DMG:6dx7(3) AVG:147(588) ACC:4 RCL:0 RNG:100/400 REAR:bits_strike_the_rear_DR_value NOTE:pilot_EW_roll_each_turn_to_command NOTE:ECM_SUITE_tier_2+_in_radius_grounds_the_bits NOTE:4_bits_HP:10_each|ELECTROMAGNETIC // REMOTE WEAPON BITS|0.8 t|POWER|4 coil-gun bits, ~4 kW link|Attacking from every angle|Shadow-children, the Reman pilots call them. Four small guns, one mind, and no safe facing anywhere on the field.|0|10|1
D|HAKKEI DEFLECTOR FIELD|5|DR:260/200 HP:250 HEAT:+3/Block NOTE:forearm_emitter_the_hand_stays_free NOTE:collapses_while_HEAT_is_in_redline NOTE:HP_fully_restored_between_sorties|SHIELD // BEAM DEFLECTOR|0.8 t|POWER|Forearm emitter, ~5 kW|Blocking while both hands stay armed|A Reman blocks with an open hand. Our engineers have measured the field three times and stopped believing the readings.|0|10|1
D|LACQUERED O-YOROI PLATING|4|DR:+15% NOTE:does_not_stack_with_other_percent_armor LOGISTICS:without_Reman_lacquer_between_sorties_drops_to_+5%|ARMOR // LAMELLAR PLATING|2.0 t|MATERIAL|Lacquered TL10 lamellae|Durable armor with a supply chain|Every plate is lacquered by hand at a temple-foundry. Captured suits rust within a season. We have tried six lacquers.|0|10|0
D|KAESHI POINT-DEFENSE LASER|3|EFFECT:once_per_turn_intercept_one_rocket_or_missile_hit_on_12_or_less HEAT:+3/intercept NOTE:no_effect_vs_kinetic_beam_or_melee NOTE:vs_a_salvo_stops_one_missile_only|ECM // POINT-DEFENSE LASER|0.5 t|POWER|Turret laser, ~3 kW|Swatting rockets|Kaeshi: the return. Rebel rocket crews have learned to fire everything at once.|0|10|0
U|SHUKUCHI FLASH-STEP|3|USES:3/sortie EFFECT:after_an_enemy_attack_roll_hits_shift_5m_and_Dodge_at_+3 HEAT:+4/use NOTE:no_effect_vs_area_or_salvo_attacks|MOBILITY // FLASH-STEP JETS|0.6 t|POWER|Micro-thruster ring, ~3 kW|Avoiding killing shots|Shukuchi: shrinking the earth. It is there on the sensor, and then it is five meters to the left and smiling.|0|10|1
U|TSUKUROI NANITE MENDER|3|USES:2/sortie REPAIR:25_HP EFFECT:Ready_restores_one_location_self_or_adjacent_ally_no_roll NOTE:cannot_restore_crippled_or_destroyed NOTE:refills_only_at_a_Reman_shrine-depot|SUPPORT // NANITE REPAIR|0.5 t|POWER|Nanite reservoir, ~3 kW|Squad repair without a roll|Tsukuroi: mending. The swarm repairs a wound the way a monk repairs a robe, slowly and with great care.|0|10|0
U|KAGURA OLEUM LANTERN|2|RADIUS:50m EFFECT:allied_pilots_in_radius_halve_Oleum_Vis_rads VENT:-1_while_lit NOTE:does_not_stack_with_SHRINE-GRADE_COCKPIT_SHIELDING NOTE:a_lit_lantern_is_+2_to_enemy_detection|SUPPORT // RADIATION WARD|0.4 t|POWER|Lattice ward lamp, ~2 kW|Protecting allied pilots from rads|The lantern-bearer walks at the center of the line and the line breathes easier. Reman pilots bow to it before a battle.|0|10|1
U|SHINOBI SIGNATURE DAMPERS|2|TIERS:3 DETECT:-2/-4/-6 NOTE:a_SENSOR_SUITE_of_equal_or_higher_tier_ignores NOTE:offline_while_HEAT_is_in_danger_zone_or_redline|EW // SIGNATURE DAMPERS|0.2-0.7 t|POWER|2-4 kW emission scrubbers|Stealth approach|Our sensors hear a Reman knight the way you hear a held breath.|0|10|0
F|TENGU-CLASS SKY FRAME|3|ST/HP:125 DR:450/225 MOVE:8L/30S SM:+6 HND:+3 SR:1 AIRTIME:6_turns_of_air_MOVE_per_sortie LOGISTICS:repairs_take_x2_time_without_Reman_crews|FRAME // MECH|[DATA_NOT_FOUND]|ORIGIN|Reman mountain foundry, TL10|Aerial skirmishing, high ground|The Tengu does not fly so much as decline to land. Pilots train for a decade before their first sortie.|0|10|1
F|TL10-KAGO HOVER TANK|9|ST/HP:140 DR:480/300 MOVE:6L/- SM:+4 HND:+2 SR:3 CREW:driver_gunner_commander SKIRT:20_HP_a_penetrating_skirt_hit_halves_MOVE LOGISTICS:repairs_take_x2_time_without_Reman_crews|FRAME // VEHICLE|[DATA_NOT_FOUND]|CREW|Driver, gunner, commander|Fast armored support|It crosses rivers our tanks must bridge and fields our tanks must bypass. Its skirts, thankfully, are made of cloth-weave and pride.|0|10|1
R|TAMASHII RESONANCE CORE|4|ST/HP:+55% HEAT:11 VENT:3 SHUTDOWN:ECM_SUITE_tier_3_in_radius_drops_VENT_to_1 LOGISTICS:repairs_take_x2_time_without_Reman_crews|REACTOR // RESONANCE CORE|[DATA_NOT_FOUND]|FUEL|Resonant lattice, TL10|Clean TL10 power|Tamashii: soul. The core hums a note that Reman engineers tune by ear. Imperial jammers, it turns out, sing off-key.|0|10|1
T|KAZE-NO-MAI VECTOR THRUSTERS|2|MOVE:+30% HND:+2 SR:-1 LOGISTICS:repairs_take_x2_time_without_Reman_parts|THRUSTER // VECTOR THRUSTERS|[DATA_NOT_FOUND]|FUEL|TL10 vectored plasma jets|Duelling agility|Kaze-no-mai: wind dance. The jets turn the knight the way a fan turns in a dancer's hand.|0|10|0
G|ZANSHIN PREDICTIVE LINK|-2|ACC-MELEE:+3 ACC-RANGED:-1 DEF:+1_Parry NOTE:Parry_bonus_lost_while_HEAT_is_in_danger_zone_or_redline|TARGETING // DUELIST LINK|[DATA_NOT_FOUND]|LINK|Neural predictive sync, TL10|Melee duelling|Zanshin: the remaining mind. The pilot's attention stays on the opponent after the cut. The link only makes it literal.|0|10|0
```

### TIER entries (merge into the `let TIER={...}` object)

```
"FIELD WORKSHOP RIG":[[2, "TIER:1 REPAIR:10_HP USES:2 EFFECT:Ready_plus_Mechanic_roll_restores_HP_to_one_location_self_or_adjacent_ally NOTE:cannot_uncripple_or_restore_destroyed", "0.4 t", "Hip tool arm, ~2 kW", "A welding arm and a parts bin: enough to keep a lance walking home."], [4, "TIER:2 REPAIR:20_HP USES:3 EFFECT:Ready_plus_Mechanic_roll_restores_HP_to_one_location_self_or_adjacent_ally NOTE:cannot_uncripple_or_restore_destroyed", "0.9 t", "Shoulder workshop, ~4 kW", "A full field kit on a shoulder hardpoint. Squires fight over who gets to carry it."], [6, "TIER:3 REPAIR:30_HP USES:4 EFFECT:Ready_plus_Mechanic_roll_restores_HP_to_one_location_self_or_adjacent_ally NOTE:cannot_uncripple_or_restore_destroyed", "1.6 t", "Back-mounted forge, ~6 kW", "A walking forge. The lance that brings one fights a second day."]],
"SALVAGE PLATING KIT":[[1, "TIER:1 DR:+25 HND:0 NOTE:each_penetrating_hit_on_a_location_strips_25_DR_there", "0.3 t", "Door panels and hope", "A few welded panels over the worst gaps."], [2, "TIER:2 DR:+50 HND:0 NOTE:each_penetrating_hit_on_a_location_strips_25_DR_there", "0.6 t", "Truck hull sections", "Proper scrap plate, welded at awkward angles."], [3, "TIER:3 DR:+75 HND:-1 NOTE:each_penetrating_hit_on_a_location_strips_25_DR_there", "1.0 t", "Captured Imperial plate", "Imperial plate, repainted, still wearing someone else's heraldry underneath."]],
"SHINOBI SIGNATURE DAMPERS":[[2, "TIER:1 DETECT:-2 NOTE:a_SENSOR_SUITE_of_equal_or_higher_tier_ignores NOTE:offline_while_HEAT_is_in_danger_zone_or_redline", "0.2 t", "Exhaust baffles, ~2 kW", "Baffled exhaust and quiet actuators."], [3, "TIER:2 DETECT:-4 NOTE:a_SENSOR_SUITE_of_equal_or_higher_tier_ignores NOTE:offline_while_HEAT_is_in_danger_zone_or_redline", "0.4 t", "Emission scrubbers, ~3 kW", "Scrubbed emissions across the radar and thermal bands."], [4, "TIER:3 DETECT:-6 NOTE:a_SENSOR_SUITE_of_equal_or_higher_tier_ignores NOTE:offline_while_HEAT_is_in_danger_zone_or_redline", "0.7 t", "Full shinobi suite, ~4 kW", "A knight-sized absence on every screen."]]
```

## Sources

- Douglas H. Cole, "Interior and Terminal Ballistics for GURPS," Pyramid (2002). Damage formula, AP divisors, sabot rescaling: https://www.sjgames.com/pyramid/sample.html?id=2794
- Steve Jackson Games forums, "Kinetic Energy to GURPS damage" (restates Cole's formula): https://forums.sjgames.com/showthread.php?t=76334
- Samuel Baughn, "Simplified Ballistic Formulas for GURPS" (1/2D and Max range formulas): http://samuelbaughn.blogspot.com/2021/04/simplified-ballistic-formulas-for-gurps.html
- Gaming Ballistic, "GURPS Ballistics - The 1/2D Range" (GURPS 1/2D table values, including 12G shot at 40 yd): https://gamingballistic.com/2013/08/08/gurps-ballistics-12d-range/
- GURPS High-Tech artillery chapter excerpt (indirect fire at -10; Forward Observer margin): https://www.sjgames.com/gurps/books/High-Tech/artillery.pdf
- RPG.net wiki, "GURPS Weapons 35" (fan-transcribed artillery table: HEAT 6dx8(10) and 6dx9(10), APFSDS (2), ZU-23 APDS 7dx3(2)): https://wiki.rpg.net/index.php/GURPS_Weapons_35
- Enraged Eggplant, "Everything About Ultra-Tech Weapons" (UT lasers (2) and the smoke/fog penalty; TL10 blasters (5) burning surge, recoilless, shorter range; plasma guns (2); plasma lances (10); flamers no divisor; EM guns default (3)): https://enragedeggplant.blogspot.com/2022/03/everything-about-ultra-tech-weapons.html
- r/gurps, "Gauss Rifle in APHD (TL11)" (hyperdense (5) replaces the EM default (3); cites UT p.152): https://www.reddit.com/r/gurps/comments/fyunk2/gauss_rifle_in_aphd_tl11/
- Wikipedia, "GAU-8 Avenger" (PGU-14/B about 395 g at 1,010 m/s, used for the 30mm back-check): https://en.wikipedia.org/wiki/GAU-8_Avenger

I did not read the GURPS High-Tech, Ultra-Tech or Vehicles books themselves. Ultra-Tech conventions are cited through the secondary sources above. Everything marked "extrapolated" was fitted to the baseline, not taken from a published rule.
