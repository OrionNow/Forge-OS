> **Catalogue v1 note.** Copied from `concepts-batch2.md` (revision 2 with round-2 fixes). Stats in the RAW blocks below are batch-2 v0; the current lines are in `../items/batch2-v1-raw.txt` (see `changelog-v1.md`). The 'armor divisor (5) reserved for Reman TL10' and 'setting licence' wording is superseded by `divisor-derivation.md` and `divisor-proposals.md`.

# FORGE-OS Catalog Concepts, Batch 2, revision 2 with round-2 fixes (50 concepts)

**Round-2 fixes applied (Ryuji, `review-batch2-r2.md`, 46/50 pass).** The pre-fix files are kept as `concepts-batch2-r2pre.md` / `concepts-batch2-raw-r2pre.txt`. Canon renames (Remun, Oleum-Vis, Crown, Torso, Republic) are **not** applied yet; they wait on Overseer (see `concepts-batch2-roll20.md`, section C).

- **105mm SIEGE MORTAR**: Spotted indirect fire -4 to -2.
- **SUNSPIKE THERMITE PROJECTOR**: Cap reworded: cannot raise target to half cap or above (matches the sheet's heat*2 >= cap test).
- **SALVAGE PLATING KIT**: Tiers PLATE:10/15/20, PLATE-HP:full (tier 2 no longer dominates Sacrificial Plating).
- **BURST CRUNCHER FIRE CONTROL**: EP 0 to +1 (was strictly worse than Standard Fire Control).
- **KAGEBOSHI REMOTE BITS**: RCL 0 to 1 (baseline minimum; the hits-per-burst rule divides by Rcl).
- **HIKARI PARTICLE LANCE**: RCL 0 to 1 (baseline minimum; the hits-per-burst rule divides by Rcl).
- **HAKKEI DEFLECTOR SHIELD**: ROLE, flavor and intent no longer say the hand stays free (it is held, per the Block interlock).
- **CASTELLAN SUPERHEAVY FRAME**: Stale text for a removed mechanic deleted (BULK / immobilize / pull / 6 blocks / volley).
- **TL8-TECHNICAL RAIDER**: Stale text for a removed mechanic deleted (BULK / immobilize / pull / 6 blocks / volley).
- **GRAPPLING HARPOON**: Stale text for a removed mechanic deleted (BULK / immobilize / pull / 6 blocks / volley).
- **REACTIVE ARMOR BRICKS**: Stale text for a removed mechanic deleted (BULK / immobilize / pull / 6 blocks / volley).
- **DRESSED-LINE FIRE CONTROL**: Stale text for a removed mechanic deleted (BULK / immobilize / pull / 6 blocks / volley).
- **BREACHER SCATTERGUN**: Re-derived from the canon 90mm via UT Shotshell (damage unchanged 6dx6); RNG 40/150 to 75/250, mass 0.8 to 1.6 t, EP 2 to 3.

Text and ideas only. Nothing in `terminal.html` or any code was edited. The previous version is kept as `concepts-batch2-v1.md` / `concepts-batch2-raw-v1.txt`. Every line uses the 13-field RAW format `CAT|NAME|EP|STATS|CLASS|MASS|LABEL|LABEL-VALUE|ROLE|FLAVOR|TWO-HANDED|TL|EXPERIMENTAL`. (The parser also reads an optional 14th field, SHOULDER-FIREABLE; 13-field lines load with it off, like the accepted pass-5 lines.)

Revision 2 does three things:
1. Re-grounds every number in Overseer's books, with Pyramid 3/51 "Modular Mecha" as the main reference.
2. Keeps complexity at the level of the current sheet: no new mechanics or stat fields. Every item uses live tokens or a short GM note that relies on a roll the sheet already has.
3. Folds in Ryuji's balance review (`review-batch2.md`) and the corrected heat model.

**Validation (script `work/build2.py`): PASS.** It checks:
- 50 lines, all with 13 fields; CAT is in ADUFTRG and EP is an integer.
- No backticks or `<>`. Every STATS token is LABEL:VALUE with no commas.
- Frames carry all six frame tokens, and chassis MASS is [DATA_NOT_FOUND].
- No name collides with the baseline (47 lines) or pass 5 (14 lines). TL matches the faction.
- (5) appears on Reman items only, and Empire/Rebel divisors are (3) or (4). AVG arithmetic is correct. Every RNG max is 750 or less.

New lean-scope checks in this revision:
- Every weapon with AMMO has an explicit SPARE.
- Weapon class groups are only BALLISTIC, ROCKET/MISSILE, MELEE or BEAM.
- No counter or status tokens the sheet ignores: USES, RAD, BULK, RUGGED, FRAGILE, AIRTIME, SPINUP, VOLLEY, SKIRT, BREACH or BRITTLE.
- No ACC-RANGED and no "torso". No flat DR on D/U items. No ACC-* tokens outside the G slot.
- Any D item with shield HP has SHIELD in its name, so the sheet's `isShield` treats it as a shield.
- Reactor VENT is 1-3, and no heat cost is above +4.

The old "no per-turn heat of 3 or less" rule is removed.

**Terminal parser check (Node, `work/nodecheck.js`):** I ran the terminal's own `rebuildDB`, `statsOK`, `frameOK` and `safeField`, extracted from `terminal.html`, over all 50 lines and the 3 TIER entries. The result was 0 rejects, and both shield items are recognised by `isShield`.

Mix:
- By faction: Empire 17, Rebel 16, Reman 17.
- By category: A 16, D 8, U 12, F 5, R 3, T 3, G 3.
- Oleum Vis items (4): OLEUM BREACHING TORCH, OLEUM SLURRY COOLANT FLUSH, OLEUM SPIKE CELL, ONMYO OLEUM HEAT-SINK FINS.
- Tiered items (3): FIELD WORKSHOP RIG, SALVAGE PLATING KIT, SHINOBI SIGNATURE DAMPERS.

## Heat model (verified in the code)

I read the following lines, which are identical in `/workspace/forge-os/terminal.html` and `/workspace/forge-os/from-grok/FORGE-OS-sortie-app/public/terminal.html`. (The second path includes `/public/`; the path in the brief was missing it.)

- **Line 984** (`heatCap`, `ventBase`): HEAT and VENT are read from the installed reactor, or from the frame on a General Chassis.
- **Line 779** (`heatDanger`, `heatFull`): the danger zone starts when `heat*2 >= cap`, and redline starts when `heat >= cap`. Heat is clamped to the cap.
- **Line 782** (`ZONE_TXT`): danger zone = DR x0.75 / Dodge +1 / Move +1. Redline = DR x0.5 / Dodge +2 / Move +2.
- **Lines 786-788** (`heatVent`): venting is an ENGINEERING roll with `step = max(1, VENT)`. A success sheds `1 + degrees of success`, with one degree for every VENT points of margin. A failure sheds nothing.

Consequences:
- Heat never bleeds off on its own.
- **A lower VENT is better.** VENT 1 is best (HEAVY FUSION CORE, TAMASHII). VENT 3 is worst (LIGHT FISSION CELL, ANCESTRAL).
- Every `HEAT:+N` in this batch is a manual, permanent addition until the pilot spends a turn venting. Ryuji's table puts that at about 2.5 heat per vent at Engineering 14 on VENT 2.

So heat costs here are mostly +1 or +2. Ryuji's explicit values are kept where he set them: Hailstorm +3 per burst, Longbow +4 per bolt, Shukuchi +4 per use. The only other cost above +2 is the Particle Lance at +4.

## Source alignment (Pyramid 3/51 as the main reference)

**The 3/51 method.** David Pulver's "Eidetic Memory: Modular Mecha" (Pyramid 3/51, pp.23-27) does not give a damage formula. It gives fixed tables:
- **Standard Mecha Statistics (p.24):** ST/HP, Hnd/SR, SM, and front and rear DR. All armor is laminate, which doubles DR against shaped charges and plasma.
- **Design-feature trades (p.25):** for example ST/HP +50, DR +30 to the whole mecha, Handling +1, Move +5 and High Maintenance (-2 to repair) are each about 1 design point.
- **Ranged Weapon Table (p.27):** missile pods, beams and railguns.
- **Mecha Shield Table (p.27).**
- **Melee:** 3/51 defers to Low-Tech Companion 2 for sizing (pp.20-21) and to Ultra-Tech p.164 for vibroblade and monomolecular divisors.

Where 3/51 has no entry, I use the books it builds on:
- High-Tech's gun tables and ammo multipliers (pp.137-141, 167-170).
- Ultra-Tech's warhead tables (pp.152-155) and beam tables (pp.116, 123).

**What 3/51 covers, and how the baseline matches it:**

| Baseline item | Baseline value | Published match | Fit |
|---|---|---|---|
| SMALL / MEDIUM / LARGE / TOWER SHIELD | 160/60, 180/90, 200/120, 240/180 | 3/51 Mecha Shield Table, DR/HP column 320/120, 360/180, 400/240, 480/360 (p.27) | **Exactly half.** FORGE uses the second (HP) figure as its second DR value and sets its own shield HP (40-500), which 3/51 doesn't have. |
| LIGHT / MEDIUM / HEAVY FRAME HP | 125 / 150 / 175 | 3/51 Light / Medium / Heavy 145 / 170 / 200 (p.24) | -20 / -20 / -25. TL8 against TL10. |
| Frame front DR | 400 / 500 / 700 | 3/51 900 / 1,050 / 1,200 laminate (p.24) | 44% / 48% / 58%, roughly half. |
| Frame SM / Hnd | +6/+6/+7, Hnd +2/+2/+1 | +3/+4/+5, Hnd +4/+3/+2 | FORGE frames are bigger and clumsier. That is a setting choice, not a derivation. |
| 60mm MISSILE POD 4dx12(4) | AVG 168 | Ultra-Tech HEMP 64mm 6dx8(10) = 168 (p.155), written with the x12 of the 3/51 Light Missile Pod (p.27) | **Exact** on average |
| 80mm ROCKET LAUNCHER 5dx18(4) | AVG 315 | 3/51 Heavy Missile Pod 6dx15(10) = 315 (p.27) | **Exact** on average |
| 120mm ROCKET CANNON 6dx30(4) | AVG 630 | Same dice as the 3/51 64mm Railgun 6dx30(3) (p.27). The UT HEMP trend at 120mm is only about 6dx14 (p.155). | It matches a 3/51 number, but it is about 2x the shaped-charge table: **the one outlier.** |
| 20mm 6dx4(3), ACC 6, 1800/7200 | | High-Tech Oerlikon 20mm 6dx3, Acc 6, 1,700/6,400 (p.137), x1.3 APDS (p.167) = 6dx3.9 | Within 4%. The range is the unscaled High-Tech figure: the one line not on the lower scale. |
| 30mm / 45mm / 90mm (3) | 6dx9, 9dx9 (6dx13.5), 9dx15 (6dx22.5) | High-Tech calibre rule (below): 6dx8.2 / 6dx12.2 (x1.7 APFSDSDU), 6dx21.6 (x1.5 APFSDS) | Baseline is 10% / 10% / 4% above. Read literally, the 30mm's "APDS" label would predict 6dx6, which is 45% low, so the baseline behaves like DU sabot rounds. |
| VIBROBLADES (3) | 64d / 76d / 88d | Ultra-Tech vibroblade (3) (p.164) | The divisor is exact. The dice have no published source in the folder, because Low-Tech Companion 2 is missing. |

**Published methods used for every new weapon.** Each Derivation line names its source.
- **Kinetic guns.** Two High-Tech guns give the same base of **6d x 0.16 per mm of calibre**: the M242 25mm at 6dx4 (p.137) and the D-81TM 125mm, whose APFSDS is 6dx30(2) (pp.140-141), which works back to a base of 6dx20.
  - Multiply by the High-Tech ammo factor: APDS x1.3, APFSDS x1.5, APFSDSDU x1.7 (pp.167-169).
  - The straight-line interpolation between the two guns is mine.
  - Divisor: High-Tech gives (2). FORGE uses (3), the divisor 3/51 gives its railguns (p.27).
- **Shaped-charge and HEMP rockets and canisters.** Ultra-Tech HEMP Warhead Table (p.155): 25/40/64/100mm = 6dx3/6dx5/6dx8/6dx12 (10).
  - Divisor (10) becomes FORGE (4): 3/51 laminate doubles DR against shaped charges (pp.24, 26), so (10) acts like (5), and FORGE steps that down for TL8.
  - Where a 3/51 entry exists (Light pod 6dx12, Heavy pod 6dx15), it is used directly.
- **Railguns and beams.** 3/51 p.27 entries are adopted directly:
  - Longbow = 40mm Railgun 6dx25.
  - Particle Lance = Particle Beam 5dx20(5).
  - Salvaged Laser = Ultra-Tech TL10 Laser Cannon 6dx10(2) (p.116), with divisor (3) as on the 3/51 Rainbow Laser.
  - 3/51 beams draw on an energy bank of 15/30/60 shots (p.27). FORGE turns that bank into HEAT.
- **Shotshell.** Ultra-Tech Shotshell rule (p.154): damage /4, half range, RoF x9, Rcl 1.
- **Indirect fire.** High-Tech p.139: -10 for unobserved fire, reduced by a Forward Observer, and the gunner gets no Acc. Simplified to one SENSORS roll by an ally.
- **Design features used as published models:**
  - Active Defense System (3/51 p.25), for KAESHI.
  - Smoke dischargers (3/51 p.24; High-Tech p.229).
  - High Maintenance -2 to repair (3/51 p.25), which replaces the "x2 repair time" text on Reman items.
  - Volatile (3/51 p.26), for the HORNET cook-off.
  - Stealth -6 (3/51 p.26), matching SHINOBI tier 3.
  - One weapon per turn, two with All-Out Attack (3/51 p.26), for the KAGEBOSHI bits.

**What stays extrapolated (labelled in each Derivation):**
- **Lower-scale RNG.** 3/51 ranges are in thousands of yards, and no single factor maps them onto the baseline. The 90mm's 150/500 is exactly the 3/51 64mm railgun's 12,000/40,000 divided by 80, but the 60mm pod's 75/375 is the Light Missile Pod's range divided by 13-16. New ranges interpolate the baseline by calibre.
- **ACC.** It is capped at the FORGE ceiling of about 6. 3/51 uses Acc 5-18, and x2/3 for handheld weapons (p.27).
- **Melee dice.** They use the baseline fit dice = 79 + 13 ln(t).

**What it means for balance.** FORGE puts 3/51-sized damage figures against armor that is about half of 3/51's. A 90mm round puts 306 through a Medium's front, while the 3/51 40mm railgun puts 175 through a 3/51 Medium. FORGE hits are therefore about twice as decisive as in 3/51. That is a baseline property, and new items stay on the baseline's scale.

**3/51 divergences kept as setting licence** (Ryuji flagged these):
- Reman (5) on the Longbow. 3/51 railguns are (3), and Ultra-Tech's (5) dart is TL11.
- The SKYFALL's (4), in pass 5.
- The accepted Reman (5) blades. These *are* published: an Ultra-Tech superfine vibroblade is (5) (p.164).

**Pyramid 3/40, "Mecha Operations" (pp.4-8): conflicts checked.**
- **Scale.** 3/40 is written for GURPS Spaceships (dDR, systems). FORGE follows 3/51's vehicle stat blocks instead. That is a different scale, not a contradiction.
- **Melee.** 3/40 scales Ultra-Tech melee damage with Low-Tech Companion 2's multiplier, for example an SM +5 force sword at 6dx10(5) (p.5). FORGE keeps Overseer's no-multiplier melee dice. **This is a known conflict, kept by design.**
- **Agreements:**
  - Laminate doubles DR against shaped charges and plasma (p.5), which supports FORGE's (10) to (4).
  - Ejectable equipment packs with their own DR, destroyed by any penetrating hit (p.6), support the PLATE-style items.
  - The Compact Power Plant, which doubles power but becomes volatile (p.6), models the OLEUM SPIKE CELL.
  - Doubling ground Move is "realistic for running" (Enhanced Ground Move, p.7), which supports capping MOVE bonuses at +100%.

## How Ryuji's review was folded in

Every fix was applied except the following. Each is changed because a source or the verified code says otherwise, or because the re-derivation moved the numbers.

- **105mm SIEGE MORTAR, EP.** Ryuji priced it at 5 EP for 483 damage. Re-derived from the Ultra-Tech HEMP table it is 6dx13 (273), so mass and EP fall to 1.8 t and 3 EP. His spotter, ACC 0 and SPARE:0 fixes are applied.
- **HORNET.** Re-anchored on the same 80mm round as the baseline launcher, which is the 3/51 Heavy Missile Pod's 6dx15. That raises it from 6dx14 to 6dx15 and from 3 EP to 4 EP.
- **SUNSPIKE target heat.** Ryuji capped it at +2 per turn and cap - 1. It is now +1 per turn, and it can never raise a target to half its cap or above (round 2: the sheet's danger test is heat x2 >= cap). That way it can only bring a target to the edge of the danger zone, because his own table shows how hard the zone multiplies team damage.
- **HIKARI PARTICLE LANCE.** It uses 3/51's exact 5dx20 rather than his 6dx17 (both average about 350). Heat is +4 rather than +5, since the damage dropped 21%.
- **HAKKEI.** It must be renamed to "...SHIELD", because the sheet's `isShield` matches on the name, and it must be held, because of the Block interlock at line 905. "Hand stays free" is impossible on the sheet. DR is capped at 240/180 (half the 3/51 Large shield), and heat is +2 per Block, as he suggested.
- **MANTLET SHIELD** is cut rather than folded into TOWER SHIELD tiers, because that would edit a baseline TIER entry. It is replaced by IMPERIAL HEATER SHIELD.
- **CROWN-GRADE SPALL LINER** becomes percent barding rather than `PLATE:15`, because the batch already has two PLATE items (SALVAGE PLATING and his REDUNDANT HARNESS proposal).
- **New weapon classes and Linked FC.** I can't add classes to the baseline LINKED TIER without editing it. So EM weapons (LONGBOW, BITS) and the SUNSPIKE are mapped to BALLISTIC. 3/51 itself lists railguns under Gunner (Cannon) with ordinary guns. Only BEAM remains (LASER CARBINE, PARTICLE LANCE). **Data change proposed to Overseer, not made:** add `ACC-BEAM:-1` to each LINKED FIRE CONTROL tier.
- **Shelved items.** OLEUM CHELATION INJECTOR and KAGURA OLEUM LANTERN (which need a rads counter) are replaced by OLEUM SLURRY COOLANT FLUSH and ONMYO OLEUM HEAT-SINK FINS. Both are Oleum items that use the existing vent mechanics, so the Oleum count stays at 4.

## EP logic (unchanged from v1)

- **Mass hardware:** EP is about 2.5 x sqrt(t), rounded half-up. This is a least-squares fit over the 21 baseline items with a mass, RMS error 0.57.
- **Shields:** EP is about 3 x sqrt(t).
- **Electronics:** EP = sustained kW. The ECM and SENSOR suites match this exactly. When an item has both mass and draw, EP = max(mass term, kW).
- **Energy per shot or use** is paid as HEAT, not EP.
- **Frames:** (HP - 87.5) / 12.5.
- **Vehicles:** 2 + HP/20.
- **Reactors:** ST/HP% / 15.
- **Thrusters:** MOVE% / 12.
- **Targeting:** 1 - 1.5 x ACC-ALL.

Cross-check against 3/51's design-point economy (p.25): ST/HP +50, DR +30, Handling +1 and Move +5 each cost 1 DP. This is the same kind of trade-table that FORGE's EP expresses.

## Core Empire (TL8): antiquated, reliable, slow, hardy

### 1. 105mm SIEGE MORTAR (Empire, A, EP 3)

```
A|105mm SIEGE MORTAR|3|ROF:1 DMG:6dx13(4) AVG:273 ACC:0 RCL:4 RNG:131/656 AMMO:4(1) SPARE:0 INDIRECT:-2_if_an_ally_with_LOS_made_a_SENSORS_roll_this_turn_else_-10 NOTE:indirect_fire_only NOTE:minimum_range_25|ROCKET/MISSILE // BREECH MORTAR|1.8 t|AMMO|105mm top-attack HEAT bombs, 4-rd rack|Indirect fire with a spotter|The mortar does not care whether its crew can see the enemy, only whether somebody can. Imperial doctrine pairs every mortar knight with a scout who is expected to be brave, patient and very well hidden.|0|8|1
```

- **Design intent:** A squad weapon that only works when a teammate spots for it, in line with the Empire's combined-arms doctrine.
- **Balance:** 273(4) puts 148 through DR 500 per bomb, 4 bombs, against 190 per round (2 rounds, direct fire) for the 80mm ROCKET LAUNCHER at the same 3 EP. It pays with -2 (spotted) or -10 (blind) to hit and ACC 0, and it buys fire from behind cover. It is in ROCKET/MISSILE on purpose: 3/51's Active Defense System also intercepts indirect artillery (p.25), so anti-rocket gear applies. Round 2: spotted fire is -2, not -4 (Ryuji; High-Tech p.139 lets a forward observer work the penalty down toward 0).
- **EP logic:** 1.8 t gives 2.5 x sqrt(1.8) = 3.35, so EP 3.
- **Derivation:** Ultra-Tech HEMP Warhead Table (p.155): 25/40/64/100mm = 6dx3/6dx5/6dx8/6dx12 (10) cr inc, about +0.12 multiplier per mm between rows (linear interpolation is mine). FORGE divisor (4): 3/51 armor is laminate, which doubles DR against shaped charges (Pyramid 3/51 p.24 and p.26; Pyramid 3/40 p.5), so (10) behaves like (5); FORGE steps that down one notch for TL8, matching the baseline rockets. 105mm sits just past the 100mm row: 6dx12 + 5 x 0.12 = 6dx12.6, rounded to 6dx13 (273). Indirect fire: High-Tech p.139 (observed indirect fire at -10, and the gunner gets no Acc), simplified to one SENSORS roll by an ally with line of sight (Ryuji). RNG keeps the baseline rocket pattern 1.25d/6.25d (the 60mm 75/375 and 120mm 150/750 fit it exactly); extrapolated.
- **Revision 2:** Damage re-derived from UT HEMP table (483 to 273), so mass/EP drop; Ryuji fixes: one-roll spotter, ACC 0, SPARE:0.

### 2. 35mm GARRISON AUTOCANNON (Empire, A, EP 3)

```
A|35mm GARRISON AUTOCANNON|3|ROF:4 DMG:6dx10(3) AVG:210(840) ACC:4 RCL:2 RNG:120/478 AMMO:16(1) SPARE:1 RELIABLE:crit_fail_is_a_miss_not_a_malfunction|BALLISTIC // CHAIN AUTOCANNON|1.6 t|AMMO|35mm APFSDS-DU, 16-rd box|Dependable mid-range anti-armor|Our quartermasters keep a garrison cannon that has fired in eleven campaigns on two barrels. It is not exciting, and that is the point.|0|8|0
```

- **Design intent:** The Empire's dependable workhorse gun. It gets slightly better penetration than the 30mm instead of more rate of fire, and it never jams.
- **Balance:** Against DR 500 it puts up to 4 x 43 = 172 through per turn (a ceiling: every round must hit), against 5 x 22 = 110 for the 30mm AUTOCANNON (3 EP). With SPARE:1 it carries 32 rounds (8 bursts), against the 30mm's 45 rounds (default 2 spares). It weighs 1.6 t against 1.1 t.
- **EP logic:** 1.6 t gives 2.5 x sqrt(1.6) = 3.2, so EP 3.
- **Derivation:** HT anchors: M242 25mm 6dx4 pi++ (High-Tech p.137) and D-81TM 125mm APFSDS 6dx30(2) (High-Tech p.140-141) both give a base of 6d x 0.16 per mm of calibre; ammo multipliers from High-Tech pp.167-169 (APDS x1.3, APFSDS x1.5, APFSDSDU x1.7). The straight-line calibre scaling between those two published guns is my interpolation, not a published formula. Divisor: High-Tech gives (2); FORGE uses (3), the divisor 3/51 gives its TL10 railguns (Pyramid 3/51 p.27). 35mm: 0.16 x 35 = 5.6, x1.7 APFSDSDU = 9.5, so 6dx10 (210). RNG has no published conversion to the lower scale; interpolated by calibre between the baseline 30mm (113/458) and 45mm (135/518). Extrapolated.
- **Revision 2:** Re-derived via High-Tech calibre/ammo method (same 6dx10); RNG re-interpolated; SPARE:1.

### 3. IMPACT MAUL (Empire, A, EP 4)

```
A|IMPACT MAUL|4|ROF:X DMG:94d(3) AVG:329 NOTE:any_penetrating_hit_forces_the_target_to_make_a_Stability_check|MELEE // POWER MAUL|3.2 t|POWER|Hydraulic head accumulator, ~30 min|Toppling knights, breaking formations|The maul was meant to retire with the old foot knights. It refused. A knight on the ground is a knight out of the fight, and nothing puts one there faster.|1|8|0
```

- **Design intent:** A crushing weapon that hooks into the sheet's existing STABILITY CHECK, so it can knock frames down rather than just cut them.
- **Balance:** It puts 329 - 167 = 162 through DR 500, against 141 for the VIBROBLADE (HEAVY) (3 EP, 2.1 t), for 1 more EP and 1.1 t more mass. The payoff is the existing Stability check on every penetrating hit.
- **EP logic:** 3.2 t gives 2.5 x sqrt(3.2) = 4.5, so EP 4.
- **Derivation:** No published mass-to-dice rule is in the supplied books: 3/51 (p.27) and 3/40 (p.5) both point to Low-Tech Companion 2 pp.20-21, which is not in the folder. Dice therefore use the baseline fit dice = 79 + 13 ln(t), rounded to nearest (extrapolated from the baseline vibroblades 64d/76d/88d), no multiplier, AVG = dice x 3.5. 3.2 t gives 94.1, so 94d. Divisor (3): Ultra-Tech gives a crushing maul no divisor (vibro effects are for cutting/impaling, UT p.164), so (3) is parity with the baseline melee floor, a setting licence. The Stability check stands in for GURPS knockback.
- **Revision 2:** Deleted the "-1 after a miss" status (scope creep); derivation relabelled.

### 4. 60mm RIPPLE ROCKET BATTERY (Empire, A, EP 3)

```
A|60mm RIPPLE ROCKET BATTERY|3|ROF:6 DMG:4dx12(4) AVG:168(1008) ACC:5 RCL:4 RNG:75/375 AMMO:12(2) SPARE:0 NOTE:+2_Active_Defense_vs_missiles NOTE:fires_two_6-rocket_salvos|ROCKET/MISSILE // SALVO BATTERY|1.2 t|AMMO|60mm fin-stabilized HEAT, 12 tubes|Sustained area suppression|Same rocket as the pod, twice the tubes, half the glamour. Line regiments like it because a second salvo is a second chance.|0|8|0
```

- **Design intent:** A mass-produced partner to the 60mm pod: the same rocket, but two salvos instead of one burst.
- **Balance:** Each salvo puts 6x43 = 258 through DR 500, and the full load does 516, against a single 344 salvo from the 60mm MISSILE POD (2 EP, 0.6 t). It costs 1 more EP for twice the mass and has 1 less ACC.
- **EP logic:** 1.2 t gives 2.5 x sqrt(1.2) = 2.7, so EP 3.
- **Derivation:** Same round as the baseline 60mm MISSILE POD. Ultra-Tech HEMP Warhead Table (p.155): 25/40/64/100mm = 6dx3/6dx5/6dx8/6dx12 (10) cr inc, about +0.12 multiplier per mm between rows (linear interpolation is mine). FORGE divisor (4): 3/51 armor is laminate, which doubles DR against shaped charges (Pyramid 3/51 p.24 and p.26; Pyramid 3/40 p.5), so (10) behaves like (5); FORGE steps that down one notch for TL8, matching the baseline rockets. The baseline 4dx12 averages 168, which is exactly the UT HEMP 64mm row (6dx8 = 168), written with the 3/51 Light Missile Pod's x12 multiplier (p.27). RNG uses the baseline rocket pattern (75/375).
- **Revision 2:** Added SPARE:0; derivation now cites UT HEMP 64mm.

### 5. OLEUM BREACHING TORCH (Empire, A, EP 2)

```
A|OLEUM BREACHING TORCH|2|ROF:X DMG:76d(4) AVG:266 HEAT:+2/hit NOTE:requires_OLEUM_VIS_CORE NOTE:close_combat_only|MELEE // PLASMA CUTTER|0.8 t|FUEL|Oleum Vis bleed line from the core|Breaching hulls and bunkers|Sappers used it on vault doors long before anyone thought to swing it at a knight. The cockpit dosimeter clicks every time it bites.|0|8|1
```

- **Design intent:** An Oleum-fed cutter. It is the Empire's one high-penetration melee tool, and the pilot pays for it in heat.
- **Balance:** It puts 266 - 125 = 141 through DR 500, against 99 for the VIBROBLADE (MEDIUM) (2 EP, 266 at (3)). It costs +2 heat per hit, which never bleeds off: five hits fill a Standard core.
- **EP logic:** 0.8 t gives 2.5 x sqrt(0.8) = 2.2, so EP 2. Its energy comes from the core, so that cost shows up as HEAT, not EP.
- **Derivation:** No published mass-to-dice rule is in the supplied books: 3/51 (p.27) and 3/40 (p.5) both point to Low-Tech Companion 2 pp.20-21, which is not in the folder. Dice therefore use the baseline fit dice = 79 + 13 ln(t), rounded to nearest (extrapolated from the baseline vibroblades 64d/76d/88d), no multiplier, AVG = dice x 3.5. 0.8 t gives 76.1, so 76d. Divisor (4): this is the hand-held cousin of the 3/51 Plasma Lance, 6dx20(10) burn exp (p.27). Laminate doubles DR against plasma (p.24/p.27), so (10) acts like (5), and FORGE steps that down to (4) for an Empire item.
- **Revision 2:** Dropped the rads token; heat cut from +3 to +2 per hit.

### 6. IMPERIAL HEATER SHIELD (Empire, D, EP 4)

```
D|IMPERIAL HEATER SHIELD|4|DR:200 HP:200|SHIELD // HEATER SHIELD|2.0 t|MATERIAL|Laminated steel-ceramic heater|Large-shield armor at a lower EP|Every Imperial knight is issued one at investiture, and the old ones go to the chapel walls. Nobody re-paints the dents.|0|8|0
```

- **Design intent:** Fills the gap between the MEDIUM SHIELD (3 EP) and the LARGE SHIELD (5 EP): it has Large-shield DR with less structure.
- **Balance:** It has DR 200/120 and HP 200 for 4 EP, against the MEDIUM SHIELD's 180/90 and HP 160 (3 EP) and the LARGE SHIELD's 200/120 and HP 300 (5 EP).
- **EP logic:** Shield curve: 2.0 t gives 3 x sqrt(2.0) = 4.2, so EP 4. DR 200/120 is half of the 3/51 Medium Shield's 400/240 (p.27), the same halving every baseline shield follows.
- **Revision 2:** REPLACES MANTLET SHIELD: duplicate of the TOWER SHIELD's deployable stands and created a free-standing cover object (Ryuji). The slot becomes a plain mid-size shield.

### 7. CROWN-GRADE TOURNEY BARDING (Empire, D, EP 4)

```
D|CROWN-GRADE TOURNEY BARDING|4|DR:+20% MOVE:-10% HND:-1 NOTE:does_not_stack_with_other_percent_armor|ARMOR // HEAVY BARDING|2.8 t|MATERIAL|Layered steel barding over the frame|Maximum passive armor for line knights|Tourney barding was meant for parades. Then the Crown noticed that the knights wearing it kept coming home.|0|8|0
```

- **Design intent:** The Empire's heaviest percent armor: more DR than any other plating, paid for in speed and handling.
- **Balance:** +20% takes a Medium frame from DR 500 to 600, against 550 for REINFORCED ARMOR (+10%, 3 EP) and 575 for LACQUERED O-YOROI (+15%, 4 EP, Reman). It costs 10% MOVE (9L becomes 8L) and 1 HND, both applied by the sheet through armStats. The largest percentage wins, so it never stacks with the others.
- **EP logic:** 2.8 t gives 2.5 x sqrt(2.8) = 4.2, so EP 4. Cross-check: 3/51 sells DR +30 to the whole mecha for 1 design point (p.25); +100 DR on a Medium is about 3 such steps, at the cost of Handling -1, which is itself a 1-point feature.
- **Revision 2:** REPLACES CROWN-GRADE SPALL LINER: flat DR:+60 and a "torso" location are not parsed by the sheet. Replaced by a percent-armor item that uses only live armStats tokens.

### 8. SMOKE DISCHARGERS (Empire, D, EP 1)

```
D|SMOKE DISCHARGERS|1|EFFECT:Ready_attacks_into_or_out_of_your_smoke_use_Targeter_COVER_-3_until_your_next_turn HEAT:+1/use NOTE:SENSOR_SUITE_tier_3_ignores|ECM // SMOKE MORTARS|0.3 t|AMMO|Multispectral smoke grenades|Breaking line of sight|The oldest countermeasure we own and still the one the Remans complain about.|0|8|0
```

- **Design intent:** A low-tech screen that uses the sheet's existing COVER modifier, for anyone who needs to break line of fire.
- **Balance:** One Ready gives -3 to attacks into or out of the smoke until your next turn, for +1 heat. Compare COUNTERMEASURE POD (2 EP), which only cancels ACC bonuses. The 3/51 standard mecha already carries smoke dischargers (p.24), so this is a cheap TL8 equivalent.
- **EP logic:** 0.3 t gives 2.5 x sqrt(0.3) = 1.4, so EP 1. Smoke dischargers: High-Tech p.229.
- **Revision 2:** Counters (USES, 3-turn duration) and the beam-divisor rule replaced by the existing COVER modifier plus +1 heat.

### 9. FIELD WORKSHOP RIG (Empire, U, EP 2)

```
U|FIELD WORKSHOP RIG|2|TIER:1 REPAIR:5%_of_location_max_HP EFFECT:Ready_plus_ENGINEERING_roll_restores_HP_to_one_location_self_or_adjacent_ally HEAT:+2/use NOTE:cannot_restore_a_disabled_location|SUPPORT // FIELD WORKSHOP|0.4-1.6 t|POWER|2-6 kW welder and tool arm|Squad repair|Every Imperial lance carries one knight who is secretly a blacksmith. The others pretend not to notice until they need her.|0|8|0
```

TIER entry:
```
"FIELD WORKSHOP RIG":[[2, "TIER:1 REPAIR:5%_of_location_max_HP EFFECT:Ready_plus_ENGINEERING_roll_restores_HP_to_one_location_self_or_adjacent_ally HEAT:+2/use NOTE:cannot_restore_a_disabled_location", "0.4 t", "Hip tool arm, ~2 kW", "A welding arm and a parts bin: enough to keep a lance walking home."], [4, "TIER:2 REPAIR:10%_of_location_max_HP EFFECT:Ready_plus_ENGINEERING_roll_restores_HP_to_one_location_self_or_adjacent_ally HEAT:+2/use NOTE:cannot_restore_a_disabled_location", "0.9 t", "Shoulder workshop, ~4 kW", "A full field kit on a shoulder hardpoint. Squires fight over who gets to carry it."], [6, "TIER:3 REPAIR:15%_of_location_max_HP EFFECT:Ready_plus_ENGINEERING_roll_restores_HP_to_one_location_self_or_adjacent_ally HEAT:+2/use NOTE:cannot_restore_a_disabled_location", "1.6 t", "Back-mounted forge, ~6 kW", "A walking forge. The lance that brings one fights a second day."]]
```

- **Design intent:** A tiered squad repair tool. It runs on the sheet's ENGINEERING roll and costs heat, so it is reliable but slow.
- **Balance:** Tier 2 restores 10% of a location's max HP per success (about 22 on a Medium/Standard full location, 11 on a limb) for +2 heat. Heat, not a use counter, limits it. The TSUKUROI NANITE MENDER uses the same REPAIR token with no roll.
- **EP logic:** Powered electronics follow EP = kW (the ECM SUITE is 2/4/6 kW for 2/4/6 EP; the SENSOR SUITE is 3/5/7 kW for 3/5/7 EP). Here 2/4/6 kW gives 2/4/6 EP, which beats the mass term (0.4/0.9/1.6 t gives 1.6/2.4/3.2).
- **Revision 2:** USES and the off-sheet Mechanic roll replaced by an ENGINEERING roll plus +2 heat per use; repair rescaled to a % of location HP.

### 10. HERALDIC COMMAND MAST (Empire, U, EP 2)

```
U|HERALDIC COMMAND MAST|2|EFFECT:designate_1_target/turn_allies_with_LOS_to_the_mast_add_+1_ROLL_MOD_vs_it RADIUS:300m NOTE:does_not_stack_with_other_ally-granted_bonuses NOTE:bearer_+2_to_enemy_detection NOTE:lost_if_head_destroyed|SUPPORT // COMMAND BANNER|0.5 t|POWER|IFF and laser designator, ~2 kW|Lance command, focus fire|The banner tells your lance where to shoot. It also tells the enemy exactly which knight to kill first, which is why we issue it to the proud ones.|0|8|0
```

- **Design intent:** Feudal focus-fire. One knight makes the whole lance better and becomes the priority target.
- **Balance:** +1 for every ally against one designated target, typed into the existing ROLL MOD field. It does not stack with other ally-granted bonuses, which keeps the focus-fire ceiling near +5. The bearer is +2 to be detected.
- **EP logic:** 0.5 t and 2 kW give max(1.8, 2), so EP 2.
- **Revision 2:** Will bonus deleted; designation becomes a +1 ally ROLL MOD that does not stack with other ally-granted bonuses.

### 11. OLEUM SLURRY COOLANT FLUSH (Empire, U, EP 2)

```
U|OLEUM SLURRY COOLANT FLUSH|2|NOTE:+2_to_ENGINEERING_vent_rolls NOTE:requires_OLEUM_VIS_CORE NOTE:refilled_by_Imperial_maintenance_crews_between_sorties|UTILITY // COOLANT FLUSH|0.6 t|FUEL|Oleum slurry coolant loop|Faster venting for Oleum-fed knights|The Crown never trusted Oleum, so it built the plumbing first. Imperial Oleum knights vent faster than anyone, and they are reminded of why every time they do.|0|8|1
```

- **Design intent:** An Empire answer to Oleum heat that uses the sheet's own vent roll: a flat +2 to the ENGINEERING vent roll.
- **Balance:** At Engineering 14 on the OLEUM VIS CORE (VENT 2), +2 moves the expected shed per vent action from about 2.5 to about 3.5 heat. The OLEUM PURGE VALVE dumps all heat once; this is a steady edge on every vent.
- **EP logic:** 0.6 t gives 2.5 x sqrt(0.6) = 1.9, so EP 2.
- **Revision 2:** REPLACES OLEUM CHELATION INJECTOR: rads, FP, DX and USES are not tracked by the sheet (Ryuji: shelve until the rads counter ships).

### 12. RECOVERY TOW WINCH (Empire, U, EP 1)

```
U|RECOVERY TOW WINCH|1|EFFECT:tow_one_disabled_ally_at_half_MOVE NOTE:lost_when_the_Utility_location_is_disabled|SUPPORT // RECOVERY WINCH|0.3 t|POWER|Torso winch, 60 m cable|Dragging allies out of the fire|Leave no knight on the field. The winch is how that oath gets kept on a Tuesday.|0|8|0
```

- **Design intent:** A pure rescue tool: it gets a disabled ally home.
- **Balance:** It does one thing: a disabled ally comes home at half MOVE. For 1 EP it is a pure campaign-economy item with no combat stats.
- **EP logic:** 0.3 t gives 1.4, so EP 1.
- **Revision 2:** Deleted cable HP and the ST-contest snag; the winch is lost when Utility is disabled.

### 13. CASTELLAN SUPERHEAVY FRAME (Empire, F, EP 9)

```
F|CASTELLAN SUPERHEAVY FRAME|9|ST/HP:200 DR:800/400 MOVE:5L/10S SM:+7 HND:0 SR:3|FRAME // MECH|[DATA_NOT_FOUND]|ORIGIN|Imperial arsenal foundries, line-built|Breakthrough, holding the line|Castellans are older than most noble houses and better maintained. They do not charge; they arrive.|0|8|1
```

- **Design intent:** A walking fortress beyond the Heavy frame. It is slow, very hard to kill, and holds a lot.
- **Balance:** Against the HEAVY FRAME (7 EP, 175 HP, DR 700/350, 7L/14S) it gets +14% HP and DR and +2 EP. In exchange it loses 29% Move and 1 HND. An Icarus frame circles it easily.
- **EP logic:** The baseline mech frames follow EP = (ST/HP - 87.5) / 12.5 (125/150/175 give 3/5/7, exact). 200 HP gives 9.
- **Revision 2:** Deleted BULK; HND 0 already lowers Dodge through the sheet.

### 14. TL8-ARMORED CARRIER (Empire, F, EP 5)

```
F|TL8-ARMORED CARRIER|5|ST/HP:110 DR:280/160 MOVE:4L/- SM:+4 HND:+1 SR:3 CREW:driver_and_commander CARGO:6_infantry_or_2_downed_pilots|FRAME // VEHICLE|[DATA_NOT_FOUND]|CREW|Driver, commander, troop bay|Moving infantry and rescuing pilots|The carrier has no glory and no enemies; nobody bothers to shoot it until it has already unloaded.|0|8|0
```

- **Design intent:** A support vehicle for mixed infantry and mech tables, and for recovering pilots.
- **Balance:** Against the TL8-TANK (8 EP, 120 HP, DR 300/180, 3L) it trades a little armor and 3 EP of capacity for +1 Move and a troop bay.
- **EP logic:** Vehicle rule 2 + HP/20 = 2 + 5.5 = 7.5, minus 2 for the troop bay = 5.5, rounded down to 5 (vehicles round down, so the bay is never free).
- **Revision 2:** Rounding stated: 2 + 110/20 = 7.5, minus 2 for the troop bay = 5.5, rounded down to 5.

### 15. ANCESTRAL THERMAL-MASS CORE (Empire, R, EP 3)

```
R|ANCESTRAL THERMAL-MASS CORE|3|ST/HP:+40% HEAT:15 VENT:3 HND:-1|REACTOR // THERMAL-MASS FISSION PILE|[DATA_NOT_FOUND]|FUEL|Graphite-moderated pile, decades per load|Soaking heat in long fights|It runs warm for an hour before battle and keeps running long after newer cores have tripped their breakers.|0|8|0
```

- **Design intent:** A huge heat pool that is slow to empty: Empire knights can soak heat all day but pay dearly to shed it.
- **Balance:** HEAT 15 (danger at 8) against the STANDARD FUSION CORE's 10 (danger at 5), but VENT 3 is the worst vent step: about 1.8 heat per vent action at Engineering 14, against 2.5 for VENT 2 and 4.6 for the HEAVY core's VENT 1. It costs 40% ST/HP against 50% for the Standard core at the same 3 EP.
- **EP logic:** Reactor rule ST/HP% / 15 = 40/15 = 2.7, so 3. The large pool is paid for with the worst VENT and HND -1.
- **Revision 2:** VENT polarity fixed (VENT 1 to VENT 3, since lower is better); RUGGED deleted.

### 16. LONG-SERVICE THRUSTERS (Empire, T, EP 2)

```
T|LONG-SERVICE THRUSTERS|2|MOVE:+20% HND:-1 SR:+2|THRUSTER // GARRISON THRUSTERS|[DATA_NOT_FOUND]|FUEL|Standard Imperial blend|Reliable repositioning|Rated for a century of service. Two of the sets in our depot have already done it.|0|8|0
```

- **Design intent:** Dependable thrusters that keep the frame steady, at the cost of speed and handling.
- **Balance:** Against STANDARD THRUSTERS (2 EP, +25%) it gives up 5% Move and 1 HND for SR +2.
- **EP logic:** The baseline thrusters follow EP = MOVE% / 12 (15/25/40% give 1.25/2.1/3.3 against 1/2/3), and HND/SR swaps net to zero. 20% gives 1.7, so EP 2.
- **Revision 2:** Deleted RUGGED (the sheet has no crit table).

### 17. DRESSED-LINE FIRE CONTROL (Empire, G, EP -1)

```
G|DRESSED-LINE FIRE CONTROL|-1|ACC-ALL:+1 ACC-FAR:+1|TARGETING // LINE FIRE NET|[DATA_NOT_FOUND]|LINK|Lance fire-direction net|Long-range line fire|Imperial line doctrine is simple: stand still, stand together, shoot far. The suite only makes the last part easier.|0|8|0
```

- **Design intent:** An Imperial line suite tuned for long-range volleys, with no dependence on allies.
- **Balance:** +1 to everything and +2 in the FAR band, against STANDARD FIRE CONTROL (+1, 0 EP) and MULTI-ROLE (+2 everywhere, -2 EP). It sits between them at -1 EP.
- **EP logic:** Targeting rule 1 - 1.5 x ACC-ALL = -0.5; the FAR-only +1 adds about half a step, giving -1.
- **Revision 2:** VOLLEY (counting allies on one target) replaced by a range-band bonus.

## Rebels (TL8): performance, firepower, fragility

### 18. HAILSTORM 40mm ROTARY CANNON (Rebel, A, EP 4)

```
A|HAILSTORM 40mm ROTARY CANNON|4|ROF:5 DMG:6dx11(3) AVG:231(1155) ACC:3 RCL:3 RNG:128/498 AMMO:15(2) SPARE:1 HEAT:+3/burst|BALLISTIC // ROTARY CANNON|3.0 t|AMMO|40mm AP-T, 15-rd drum|Burst damage at mid range|It spins up like a turbine and empties like a promise. Every Rebel cell wants one, and the ones who have one want more ammunition.|1|8|1
```

- **Design intent:** Rebel raw burst: big per-turn damage, fast ammo burn and heat that piles up.
- **Balance:** Up to 5 x 64 = 320 through DR 500 per turn (a ceiling; about 2-3 hits is typical at RCL 3), against 306 per 90mm HEAVY RIFLE hit. No single 64-point hit trips a Medium location's stability threshold. SPARE:1 gives 6 bursts, but +3 heat per burst redlines a Standard core in 4 bursts without venting, so heat is the real limit.
- **EP logic:** 3.0 t gives 4.3, so EP 4.
- **Derivation:** HT anchors: M242 25mm 6dx4 pi++ (High-Tech p.137) and D-81TM 125mm APFSDS 6dx30(2) (High-Tech p.140-141) both give a base of 6d x 0.16 per mm of calibre; ammo multipliers from High-Tech pp.167-169 (APDS x1.3, APFSDS x1.5, APFSDSDU x1.7). The straight-line calibre scaling between those two published guns is my interpolation, not a published formula. Divisor: High-Tech gives (2); FORGE uses (3), the divisor 3/51 gives its TL10 railguns (Pyramid 3/51 p.27). 40mm: 0.16 x 40 = 6.4, x1.7 APFSDSDU = 10.9, so 6dx11 (231). RNG has no published conversion to the lower scale; interpolated by calibre between the baseline 30mm (113/458) and 45mm (135/518). Extrapolated.
- **Revision 2:** Deleted SPINUP and the feed-destroyed status; SPARE:1; re-derived via High-Tech.

### 19. BREACHER SCATTERGUN (Rebel, A, EP 3)

```
A|BREACHER SCATTERGUN|3|ROF:6 DMG:6dx6(3) AVG:126(756) ACC:2 RCL:1 RNG:75/250 AMMO:4(1) SPARE:1 NOTE:6_slugs_per_shot_counted_as_ROF NOTE:best_vs_REAR|BALLISTIC // CANISTER GUN|1.6 t|AMMO|90mm slug canister, 4 shells|Flanking, ambushing vehicles|Rebel mechanics call it a door-knocker. The door, in practice, is the back of a knight.|0|8|0
```

- **Design intent:** A flanker's gun. The physics means it cannot get through a Medium frame's front armor, so the player has to get behind the target.
- **Balance:** Against the front (DR 500) the slugs barely penetrate (126 - 167 < 0). With the REAR flag (x0.5 DR) each slug puts 43 through, up to 258 per shot. 8 shells with SPARE:1. Round 2 moves it to 3 EP and 75/250 because the honest parent gun is a 1.6 t 90mm, not a 0.8 t 140mm.
- **EP logic:** 1.6 t gives 2.5 x sqrt(1.6) = 3.2, so EP 3.
- **Derivation:** Set by rule, not by target: the parent is the canon 90mm (Overseer's Weapon List 9dx15(3), the baseline 90mm HEAVY RIFLE). Ultra-Tech Shotshell (p.154): divide damage by 4, halve range, RoF x9, Rcl 1. 9dx15 / 4 = 9dx3.75 = 6dx5.6, rounded to 6dx6 (126). Range: half the 90mm's 150/500 = 75/250. RoF: 1 x 9 = 9, trimmed to 6 heavier slugs (the stated deviation Ryuji accepted in round 1). Mass and EP: Overseer's calibre table (Weapon List, Mecha p.67) gives a 90mm cannon 3,600 lb = 1.6 t, so 2.5 x sqrt(1.6) = 3.2, EP 3. The round-1 '140mm' figure was reverse-engineered to hit 6dx6 and is withdrawn.
- **Revision 2:** Re-derived with the Ultra-Tech shotshell rule (damage /4, Rcl 1); SPARE:1.

### 20. RIPSAW CHAIN BLADE (Rebel, A, EP 3)

```
A|RIPSAW CHAIN BLADE|3|ROF:X DMG:83d(3) AVG:290.5 NOTE:crit_fail_throws_the_chain_and_destroys_it|MELEE // CHAIN BLADE|1.4 t|POWER|Overdriven motor, ~10 min|One-handed brawling|Imperial blades sing. This one screams, and it keeps screaming right up until it throws its chain into the pilot's own cockpit glass.|0|8|0
```

- **Design intent:** Heavy-blade damage in one hand, with a chance of destroying itself.
- **Balance:** It puts 290.5 - 167 = 123.5 through DR 500, against 99 for the VIBROBLADE (MEDIUM) (2 EP) and 141 for the HEAVY (3 EP, 2.1 t). The crit-fail destruction is its Rebel drawback.
- **EP logic:** 1.4 t gives 3.0, so EP 3.
- **Derivation:** No published mass-to-dice rule is in the supplied books: 3/51 (p.27) and 3/40 (p.5) both point to Low-Tech Companion 2 pp.20-21, which is not in the folder. Dice therefore use the baseline fit dice = 79 + 13 ln(t), rounded to nearest (extrapolated from the baseline vibroblades 64d/76d/88d), no multiplier, AVG = dice x 3.5. 1.4 t gives 83.4, so 83d. Divisor (3) = Ultra-Tech vibroblade (p.164).
- **Revision 2:** Deleted the jam status; dice rounded to nearest (83.4 to 83d).

### 21. SUNSPIKE THERMITE PROJECTOR (Rebel, A, EP 3)

```
A|SUNSPIKE THERMITE PROJECTOR|3|ROF:1 DMG:6dx12(4) AVG:252 ACC:3 RCL:1 RNG:25/100 AMMO:5(1) SPARE:0 HEAT:+2/shot TARGET-HEAT:+1_on_penetrating_hit_max_+1_per_target_per_turn_cannot_raise_target_to_half_cap_or_above|BALLISTIC // THERMITE CANISTER GUN|1.1 t|AMMO|100mm thermite canisters, 5 rounds|Cooking enemy cores|Rebels figured out what we never wanted to admit: a knight running hot is already half beaten.|0|8|1
```

- **Design intent:** A heat-warfare weapon. A penetrating hit pushes the target toward its danger zone, which hooks into the heat-zone DR penalty.
- **Balance:** 252 - 125 = 127 through DR 500, against 190 for the 80mm ROCKET LAUNCHER (3 EP) at four times the range. Its edge is +1 heat on the target, at most +1 per target per turn, and it can never raise the target to half its cap or above. The sheet's danger test is heat x2 >= cap, so on a cap-10 core the Sunspike stops at 4 and on a cap-7 core at 3: it brings a target to the edge of the danger zone, and the target's own weapons have to push it over. 5 rounds, no spares.
- **EP logic:** 1.1 t gives 2.6, so EP 3.
- **Derivation:** Ultra-Tech HEMP Warhead Table (p.155) 100mm row: 6dx12(10) cr inc, the same figure as the 3/51 Light Missile Pod (p.27). The warhead is fired from a short gun rather than a rocket, so it is BALLISTIC. Divisor (10) to FORGE (4) for the laminate reason (3/51 p.24). RNG 25/100 is extrapolated (a low-velocity canister); 3/51's Plasma Lance is the closest short-range entry at 20/200 (p.27). The target heat is a GM-added +1 using the sheet's heat buttons.
- **Revision 2:** Re-derived as a UT HEMP thermite canister (now BALLISTIC, so Linked FC applies); target heat capped; tank rupture deleted; heat +3 to +2; SPARE:0.

### 22. HORNET 80mm ALPHA POD (Rebel, A, EP 4)

```
A|HORNET 80mm ALPHA POD|4|ROF:4 DMG:6dx15(4) AVG:315(1260) ACC:4 RCL:5 RNG:100/450 AMMO:4(1) SPARE:0 NOTE:one_salvo_no_reload NOTE:+2_Active_Defense_vs_missiles NOTE:if_its_location_takes_a_hit_over_the_stability_threshold_while_loaded_the_pod_cooks_off_for_6dx10(3)_to_that_location|ROCKET/MISSILE // ALPHA-STRIKE POD|2.6 t|AMMO|80mm HEAT, 4 tubes, single salvo|Opening alpha strike|Four rockets, one chance, and a pod that would very much like to explode. Rebel doctrine in a single sentence.|0|8|1
```

- **Design intent:** The Rebel all-in opening shot, with a cook-off risk while it is loaded.
- **Balance:** One salvo of up to 4 x 190 = 760 through DR 500, against 2 x 190 = 380 over two turns for the 80mm ROCKET LAUNCHER (3 EP) and 344 for the 60mm MISSILE POD (2 EP). It fires once per sortie, has ACC 4, and cooks off when its location takes a big hit (3/51's Volatile feature, p.26).
- **EP logic:** 2.6 t gives 2.5 x sqrt(2.6) = 4.0, so EP 4.
- **Derivation:** Same 80mm round as the baseline 80mm ROCKET LAUNCHER, whose 5dx18 (AVG 315) equals the 3/51 Heavy Missile Pod's 6dx15(10) exactly (p.27). Written 6dx15 at FORGE (4) for the laminate reason (p.24). RNG copies the baseline 80mm (100/450). The cook-off uses UT HEMP 64mm-class damage (6dx8, p.155), rounded up to 6dx10 for the propellant.
- **Revision 2:** Re-anchored on the baseline 80mm round (3/51 Heavy Missile Pod damage), so 6dx14 becomes 6dx15 and EP rises from 3 to 4; cook-off tied to the existing stability threshold.

### 23. SALVAGED LASER CARBINE (Rebel, A, EP 3)

```
A|SALVAGED LASER CARBINE|3|ROF:3 DMG:6dx10(3) AVG:210(630) ACC:6 RCL:1 RNG:150/500 HEAT:+1/shot NOTE:no_ammo|BEAM // PULSE LASER|1.2 t|POWER|Core-fed, ~600 kJ per pulse|Accurate sustained fire|Pieced together from a downed Reman lance and three civilian mining rigs. It works. Nobody knows for how long.|0|8|1
```

- **Design intent:** Salvaged Reman TL10 tech: no ammo and very accurate, paid for in heat.
- **Balance:** Up to 3 x 43 = 129 through DR 500 per turn for +3 heat, against 110 for the 30mm AUTOCANNON (3 EP), which has to reload. Its edge is ACC 6 and no magazine; its cost is heat that never bleeds off.
- **EP logic:** 1.2 t gives 2.7, so EP 3. Power comes from the core, so it shows up as HEAT.
- **Derivation:** Ultra-Tech Laser Cannon (TL10) 6dx10(2) burn, Acc 18 (Ultra-Tech p.116): a salvaged Reman emitter. Divisor (2) to FORGE (3), which is the 3/51 Rainbow Laser's divisor (p.27). ACC is capped at the FORGE ceiling of 6. 3/51 runs beams on an energy bank (p.27, 15/30/60 shots); FORGE turns that bank into HEAT. RNG is extrapolated.
- **Revision 2:** Re-anchored on the Ultra-Tech TL10 Laser Cannon (6dx11 to 6dx10); heat +2 to +1 per shot; lens and weather notes deleted.

### 24. SALVAGE PLATING KIT (Rebel, D, EP 1)

```
D|SALVAGE PLATING KIT|1|TIER:1 PLATE:10 PLATE-USES:1 PLATE-HP:full|ARMOR // SCRAP PLATING|0.3-1.0 t|MATERIAL|Welded hull scrap|Cheap, fast survivability|Rebel knights wear the armor of whatever they killed last week. It shows.|0|8|0
```

TIER entry:
```
"SALVAGE PLATING KIT":[[1, "TIER:1 PLATE:10 PLATE-USES:1 PLATE-HP:full", "0.3 t", "Door panels and hope", "A few welded panels over the worst gaps."], [2, "TIER:2 PLATE:15 PLATE-USES:1 PLATE-HP:full", "0.6 t", "Truck hull sections", "Proper scrap plate, welded at awkward angles."], [3, "TIER:3 PLATE:20 PLATE-USES:1 PLATE-HP:full", "1.0 t", "Captured Imperial plate", "Imperial plate, repainted, still wearing someone else's heraldry underneath."]]
```

- **Design intent:** Cheap Rebel ablative plate built on the sheet's own sacrificial-plating tokens.
- **Balance:** Tiers take 10% / 15% / 20% off the first penetrating hit on each full-HP component, once, for 1 / 2 / 3 EP. The baseline SACRIFICIAL PLATING is PLATE:25 on the same full-HP rule for 4 EP, so every scrap tier now sits below it on both value and price, and none dominates it. The sheet uses only the single largest PLATE item, so it does not stack with Sacrificial Plating.
- **EP logic:** 0.3/0.6/1.0 t gives 1.4/1.9/2.5, so 1/2/3 EP. Each tonne buys more DR than REINFORCED ARMOR because the plating strips away under fire.
- **Revision 2:** Flat DR and the per-hit DR strip (not parsed) replaced by the native PLATE tokens per tier.

### 25. REACTIVE ARMOR BRICKS (Rebel, D, EP 3)

```
D|REACTIVE ARMOR BRICKS|3|EFFECT:+2_armor_divisor_steps_vs_shaped_charge/rockets NOTE:does_not_stack_with_SPACED_ARMOR_PANELS NOTE:no_effect_vs_kinetic_beam_or_melee|ARMOR // EXPLOSIVE REACTIVE|1.0 t|MATERIAL|Explosive reactive tiles|Defeating rockets|Rebels bolt explosives to their armor and call it protection. Disturbingly, it is.|0|8|1
```

- **Design intent:** A stronger, non-stacking cousin of SPACED ARMOR PANELS against HEAT and rockets.
- **Balance:** Two divisor steps against shaped charges (so FORGE (4) becomes (2)) for 3 EP, against SPACED ARMOR PANELS' one step for 2 EP. It doesn't stack with Spaced Armor, and the KAESHI change removes the third anti-rocket layer.
- **EP logic:** 1.0 t gives 2.5, rounded half-up to EP 3.
- **Revision 2:** Per-location first-hit tracking, USES and ally splash replaced with a non-stacking SPACED-ARMOR-style divisor step.

### 26. GRAPPLING HARPOON (Rebel, U, EP 1)

```
U|GRAPPLING HARPOON|1|JUMP:reel_up_to_100m_to_terrain NOTE:Piloting_roll_to_land_cleanly|MOBILITY // HARPOON REEL|0.3 t|POWER|Gas launcher, 4 harpoons|Vertical movement, ambush|Code-named 'the Zipline' by a cell that had no right to survive that canyon.|0|8|0
```

- **Design intent:** Cheap 3D mobility for rooftops and canyons.
- **Balance:** A reel to a point within 100m for 1 EP, against JUMP JETS (SHORT) (2 EP, up to half MOVE). It needs anchoring terrain and uses the same Piloting roll.
- **EP logic:** 0.3 t gives 1.4, so EP 1.
- **Revision 2:** Cable HP and the ST contest replaced with the JUMP-JET pattern.

### 27. DECOY BEACON DROP (Rebel, U, EP 2)

```
U|DECOY BEACON DROP|2|EFFECT:Ready_the_next_ranged_attack_on_you_or_an_adjacent_ally_this_turn_must_win_SENSORS_vs_your_EW_or_miss HEAT:+2/use|EW // DECOY BEACONS|0.4 t|POWER|Throwable emitter, ~2 kW|Covering a teammate|It screams 'I am a knight' on every band we know of. Half our pilots now wear one as a joke. The other half are still alive because of it.|0|8|0
```

- **Design intent:** Electronic warfare that can pull one attack off you or a neighbour, using the sheet's SENSORS and EW skills.
- **Balance:** One Ready forces one Quick Contest of SENSORS against your EW, for +2 heat. COUNTERMEASURE POD (2 EP) only removes ACC bonuses; this can make an attack miss outright, but only one attack per use, and only if the attacker loses the contest.
- **EP logic:** 0.4 t and 2 kW give max(1.6, 2), so EP 2.
- **Revision 2:** Beacon object HP, duration and USES replaced by a SENSORS vs EW contest (both sheet skills) plus +2 heat.

### 28. JURY-RIG FIELD KIT (Rebel, U, EP 1)

```
U|JURY-RIG FIELD KIT|1|EFFECT:Ready_plus_ENGINEERING-2_restores_a_disabled_limb_to_1_HP HEAT:+2/use NOTE:fail_by_5+_the_limb_is_WRECKED NOTE:self_or_adjacent_ally|SUPPORT // JURY-RIG|0.2 t|MATERIAL|Clamps, cable, tape|Getting a limb working again|Imperial manuals say a crippled limb needs a depot. Rebel mechanics say it needs a clamp and a positive attitude.|0|8|0
```

- **Design intent:** A high-risk repair that hooks into the crippling rules.
- **Balance:** It brings a disabled limb back to 1 HP, so that arm's weapon works again (wDisabled clears), but the next hit disables it. The risk (failing by 5+ wrecks the limb) is the Rebel price.
- **EP logic:** 0.2 t gives 1.1, so EP 1.
- **Revision 2:** USES and the off-sheet Mechanic roll replaced by ENGINEERING-2 plus +2 heat; works on disabled limbs (assumption A1).

### 29. MESH NET RELAY (Rebel, U, EP 2)

```
U|MESH NET RELAY|2|EFFECT:counts_as_SENSOR_SUITE_one_tier_higher_max_tier_2_while_an_allied_SENSOR_SUITE_is_within_500m NOTE:+1_to_enemy_detection|EW // MESH RELAY|0.3 t|POWER|Burst-mesh radio, ~2 kW|Sharing sensors|Democratic warfare: everyone sees what the best-equipped cell sees, and everyone goes blind together.|0|8|0
```

- **Design intent:** A cheap Rebel way to borrow a friend's sensors, changing only the bearer's own sheet.
- **Balance:** At most tier 2, so KITSUNE MIRAGE FIELD is halved rather than negated, SHINOBI tier 3 still works, and tier-3 effects (DECOY, SMOKE) are never reached. For 2 EP it is half the cost of a tier-1 suite upgrade (3 EP to 5 EP), and it needs a friend nearby.
- **EP logic:** 0.3 t and 2 kW give max(1.4, 2), so EP 2.
- **Revision 2:** Squad-wide shared sensor tier replaced by a personal +1 tier (max tier 2) while an allied suite is near (Ryuji).

### 30. TL8-TECHNICAL RAIDER (Rebel, F, EP 5)

```
F|TL8-TECHNICAL RAIDER|5|ST/HP:65 DR:150/80 MOVE:8L/- SM:+3 HND:+3 SR:2 CREW:driver_and_gunner|FRAME // VEHICLE|[DATA_NOT_FOUND]|CREW|Driver, gunner|Raids, scouting, harassment|A cargo truck, a welded mount and a gunner with nothing to lose. Rebels field more of these than knights.|0|8|0
```

- **Design intent:** A cheap, fast, fragile Rebel vehicle for players without mechs.
- **Balance:** Against the TL8-TANK (8 EP, 120 HP, DR 300/180, 3L) it has about half the toughness for 8L Move and HND +3.
- **EP logic:** The vehicle rule 2 + HP/20 at 65 HP gives 5.25, so EP 5.
- **Revision 2:** Deleted FRAGILE; 65 HP and DR 150 are already fragile, and a disabled Locomotion location already immobilizes it.

### 31. OLEUM SPIKE CELL (Rebel, R, EP 3)

```
R|OLEUM SPIKE CELL|3|ST/HP:+40% HEAT:10 VENT:2 HND:+1 NOTE:radiation_signature_+3_to_enemy_sensor_detection NOTE:Oleum_rads_per_the_OLEUM_VIS_CORE_once_the_rads_counter_ships|REACTOR // BOOTLEG OLEUM CELL|[DATA_NOT_FOUND]|FUEL|Unshielded Oleum Vis slurry|Light Oleum power for raiders|The Empire rations Oleum to knights it can afford to lose slowly. The Rebels hand it to anyone brave enough and call the dosimeter a suggestion.|0|8|1
```

- **Design intent:** A hot, hand-built Rebel core: standard-core heat handling and better handling, at the cost of structure and a glowing signature.
- **Balance:** HEAT 10 / VENT 2 like the STANDARD FUSION CORE (3 EP), with HND +1 for 10% less ST/HP, and enemies get +3 to detect it. Against the LIGHT FISSION CELL (2 EP, 30%, HEAT 7, VENT 3), it vents better and holds more for 1 EP.
- **EP logic:** Reactor rule 40/15 = 2.7, so 3. The HND +1 is paid for by the detection penalty. 3/40's Compact Power Plant (p.6) is the published model for a hot, volatile core.
- **Revision 2:** VENT 3 to VENT 2 (lower is better); BREACH roll and per-turn rads deleted until the rads counter ships.

### 32. POGO-JET HOP THRUSTERS (Rebel, T, EP 0)

```
T|POGO-JET HOP THRUSTERS|0|MOVE:+10% JUMP:free_hop_up_to_1/4_MOVE_once_per_turn SR:-1|THRUSTER // HOP JETS|[DATA_NOT_FOUND]|FUEL|Hydrazine blend|Climbing over cover, dodging|Cheap enough to replace after every raid, which is good, because they will need replacing after every raid.|0|8|0
```

- **Design intent:** Vertical agility instead of speed. It is fragile.
- **Balance:** LIGHTWEIGHT THRUSTERS (1 EP) give +15%. These give up 1 EP and 5% Move for a free quarter-Move hop every turn, at SR -1.
- **EP logic:** The thruster rule gives 10% / 12 = 0.8, about 1. The free hop is worth about 1 (half of JUMP JETS' 2 EP for half the jump), so EP 0.
- **Revision 2:** Deleted FRAGILE (the sheet has no crit table).

### 33. BURST CRUNCHER FIRE CONTROL (Rebel, G, EP 1)

```
G|BURST CRUNCHER FIRE CONTROL|1|ACC-BALLISTIC:+1 ACC-ROCKET_MISSILE:-1|TARGETING // BURST CALCULATOR|[DATA_NOT_FOUND]|LINK|Bootleg ballistic chip|Making bursts land|Rebel code: brilliant, undocumented, and allergic to conserving anything.|0|8|0
```

- **Design intent:** A bootleg Rebel ballistic chip: a cheap, half-strength LINKED FIRE CONTROL.
- **Balance:** +1 ballistic and -1 rockets (melee and beam unmodified) for +1 EP of capacity, against STANDARD FIRE CONTROL (+1 to everything, 0 EP). A pure-gun build gets the same ballistic bonus as Standard plus one extra EP; anyone using rockets, beams or melee is better off with Standard.
- **EP logic:** Targeting rule 1 - 1.5 x ACC-ALL: ballistic-only +1 with -1 on rockets is worth about ACC-ALL 0, giving +1.
- **Revision 2:** Manual RoF-step override and double-ammo rule replaced by a light ballistic specialisation.

## Remans (TL10): bushido tech that is overpowered but beatable

### 34. HAGANE-YUMI GAUSS LONGBOW (Reman, A, EP 5)

```
A|HAGANE-YUMI GAUSS LONGBOW|5|ROF:1 DMG:6dx25(5) AVG:525 ACC:6 RCL:2 RNG:200/640 AMMO:4(1) SPARE:1 HEAT:+4/shot DRAW:an_Aim_maneuver_is_required_before_every_shot|BALLISTIC // COIL LONGBOW|3.6 t|POWER|Coil capacitors, hyperdense bolts|Duelling at long range|The archer draws, breathes, and waits for the target to choose its own moment. Reman marksmen say the bow is only a way of listening.|1|10|1
```

- **Design intent:** A Reman TL10 sniper weapon. Its weakness is tempo: it has to Aim before every shot, and taking damage breaks the Aim.
- **Balance:** 425 through DR 500 per bolt, against 400 for SKYFALL (5 EP, (4)) and 306 for the 90mm. It has 8 bolts with SPARE:1. +4 heat per bolt never bleeds off, so bolt 2 is in a Standard core's danger zone, and every shot needs an Aim turn (in which it can neither attack nor vent).
- **EP logic:** 3.6 t gives 4.7, so EP 5. Capacitor energy shows up as HEAT.
- **Derivation:** 3/51 Railgun 40mm 6dx25(3) pi+ (Pyramid 3/51 p.27), adopted directly; 3/51 lists railguns under Gunner (Cannon) with ordinary guns, so it is BALLISTIC. The (5) is a Reman setting licence: 3/51 gives (3), and Ultra-Tech's (5) dart (APHD) is TL11. RNG 200/640 is extrapolated (3/51's 8,000/29,000 has no published lower-scale conversion). ACC 6 is the FORGE cap (3/51 gives Acc 8, x2/3 when handheld, p.27).
- **Revision 2:** Accepted. Damage now cited to 3/51's 40mm railgun (6dx25); SPARE:1; class mapped to BALLISTIC so Linked FC applies; (5) documented as Reman setting licence.

### 35. NAGINATA HIGH-FREQUENCY GLAIVE (Reman, A, EP 3)

```
A|NAGINATA HIGH-FREQUENCY GLAIVE|3|ROF:X DMG:80d(4) AVG:280|MELEE // REMAN POLEARM|1.1 t|POWER|HF emitter, ~20 min|Two-handed melee damage|The naginata keeps the enemy where the Reman wants them: one step too far away to answer.|1|10|0
```

- **Design intent:** A two-handed Reman polearm: more damage than a heavy vibroblade, both hands committed.
- **Balance:** 280 - 125 = 155 through DR 500, two-handed, against 141 for the VIBROBLADE (HEAVY) (3 EP, one-handed). It is a plain Reman polearm.
- **EP logic:** 1.1 t gives 2.6, so EP 3.
- **Derivation:** No published mass-to-dice rule is in the supplied books: 3/51 (p.27) and 3/40 (p.5) both point to Low-Tech Companion 2 pp.20-21, which is not in the folder. Dice therefore use the baseline fit dice = 79 + 13 ln(t), rounded to nearest (extrapolated from the baseline vibroblades 64d/76d/88d), no multiplier, AVG = dice x 3.5. 1.1 t gives 80.2, so 80d. Divisor (4) is a step between the Ultra-Tech vibroblade (3) and superfine vibroblade (5) (p.164).
- **Revision 2:** Deleted REACH and the sweep (the sheet has no reach and the sweep is an extra roll).

### 36. WAKIZASHI GUARD BLADE (Reman, A, EP 2)

```
A|WAKIZASHI GUARD BLADE|2|ROF:X DMG:67d(4) AVG:234.5 NOTE:one-handed_off-hand_blade_Parries_normally|MELEE // REMAN SHORT BLADE|0.4 t|EDGE|Monomolecular laminate|Off-hand parrying|The short sword is the one a Reman keeps when everything else is gone. Our duelists learned to respect the second blade the hard way.|0|10|0
```

- **Design intent:** A one-handed parry weapon for duels. It does nothing against guns.
- **Balance:** 234.5 - 125 = 109.5 through DR 500 at 2 EP, against 99 for the VIBROBLADE (MEDIUM) (2 EP, 0.9 t). It is a light Reman off-hand blade that Parries with the sheet's normal melee Parry. It no longer undercuts the KAGEROU TACHI's (5).
- **EP logic:** 0.4 t gives 1.6, so EP 2.
- **Derivation:** No published mass-to-dice rule is in the supplied books: 3/51 (p.27) and 3/40 (p.5) both point to Low-Tech Companion 2 pp.20-21, which is not in the folder. Dice therefore use the baseline fit dice = 79 + 13 ln(t), rounded to nearest (extrapolated from the baseline vibroblades 64d/76d/88d), no multiplier, AVG = dice x 3.5. 0.4 t gives 67.1, so 67d. Divisor (4) as for the Naginata.
- **Revision 2:** Divisor (5) to (4); deleted the free riposte and the unparsed Parry token.

### 37. HIKARI PARTICLE LANCE (Reman, A, EP 5)

```
A|HIKARI PARTICLE LANCE|5|ROF:1 DMG:5dx20(5) AVG:350 ACC:6 RCL:1 RNG:120/400 HEAT:+4/shot NOTE:no_ammo|BEAM // CHARGED-PARTICLE CANNON|3.6 t|POWER|Core-fed, ~2.5 MJ per shot|Heavy beam fire|Light, the Remans call it, and they do not mean it poetically. Our sensor crews call it the reason to stand in the smoke.|1|10|1
```

- **Design intent:** A TL10 heavy beam with unlimited shots, limited by heat.
- **Balance:** 250 through DR 500 per shot with no magazine, for +4 heat, against 425 per Longbow bolt (5 EP, 8 bolts, Aim required) and 306 for the 90mm. Three shots fill a Standard core.
- **EP logic:** 3.6 t gives 4.7, so EP 5. Power comes from the core, so it shows up as HEAT.
- **Derivation:** 3/51 Particle Beam 5dx20(5) burn sur, Acc 15 (Pyramid 3/51 p.27), adopted directly. 3/51 feeds beams from the energy bank (15/30/60 shots by mecha size, p.27); FORGE converts the bank into HEAT. ACC 6 is the FORGE cap. RNG is extrapolated.
- **Revision 2:** Accepted. Damage set to the 3/51 Particle Beam exactly (6dx21 to 5dx20); heat +5 to +4; weather clause deleted.

### 38. KAGEBOSHI REMOTE BITS (Reman, A, EP 4)

```
A|KAGEBOSHI REMOTE BITS|4|ROF:4 DMG:6dx7(3) AVG:147(588) ACC:4 RCL:1 RNG:100/400 AMMO:16(2) SPARE:0 HEAT:+2/turn_used REAR:apply_the_REAR_flag NOTE:firing_the_bits_is_the_attack_for_that_turn NOTE:cannot_combine_with_GAP NOTE:ECM_SUITE_tier_2+_in_radius_grounds_the_bits NOTE:lost_when_the_Utility_location_is_disabled|BALLISTIC // REMOTE WEAPON BITS|0.8 t|POWER|4 coil-gun bits, 25mm, 4 volleys|Attacking from every angle|Shadow-children, the Reman pilots call them. Four small guns, one mind, and no safe facing anywhere on the field.|0|10|1
```

- **Design intent:** Gundam-style bits that hit rear armor from any facing, limited by ammo, heat and the ECM ladder.
- **Balance:** With the REAR flag, up to 4 x 64 = 256 through a Medium per volley (120 against a Heavy), 4 volleys a sortie, +2 heat each. It replaces your attack that turn, as in 3/51 (one weapon per turn, p.26). That compares with 110 per turn for the 30mm AUTOCANNON against the front.
- **EP logic:** 0.8 t and 4 kW give max(2.2, 4), so EP 4.
- **Derivation:** HT anchors: M242 25mm 6dx4 pi++ (High-Tech p.137) and D-81TM 125mm APFSDS 6dx30(2) (High-Tech p.140-141) both give a base of 6d x 0.16 per mm of calibre; ammo multipliers from High-Tech pp.167-169 (APDS x1.3, APFSDS x1.5, APFSDSDU x1.7). The straight-line calibre scaling between those two published guns is my interpolation, not a published formula. Divisor: High-Tech gives (2); FORGE uses (3), the divisor 3/51 gives its TL10 railguns (Pyramid 3/51 p.27). 25mm coil darts: 0.16 x 25 = 4.0, x1.7 = 6.8, so 6dx7 (147). That is the High-Tech M242 25mm (6dx4, p.137) with DU sabot. RNG extrapolated.
- **Revision 2:** Bit HP and the undefined EW roll deleted; AMMO 16 with SPARE:0, +2 heat per turn used, and firing them counts as the turn's attack; re-derived via High-Tech.

### 39. HAKKEI DEFLECTOR SHIELD (Reman, D, EP 5)

```
D|HAKKEI DEFLECTOR SHIELD|5|DR:240 HP:250 HEAT:+2/Block NOTE:hand-held_emitter_held_like_any_shield NOTE:collapses_while_HEAT_is_in_redline|SHIELD // BEAM DEFLECTOR|0.8 t|POWER|Forearm emitter, ~5 kW|Heat-limited heavy blocking at low mass|A Reman beam shield weighs less than our bucklers and blocks like our tower walls. Our engineers have measured the field three times and stopped believing the readings.|0|10|1
```

- **Design intent:** A light Reman beam shield, held like any other shield, that blocks like a Tower Shield and is limited by heat and the redline.
- **Balance:** TOWER SHIELD DR (240/180) and half its HP (250) at 5 EP and 0.8 t, against the Tower's 7 EP and 5.2 t. Each Block adds +2 heat, so five Blocks fill a Standard core, and it collapses at redline.
- **EP logic:** Electronics rule: a ~5 kW emitter gives EP 5. DR 240/180 is half of the 3/51 Large Shield (480/360, p.27), the same halving as every baseline shield.
- **Revision 2:** Renamed ...SHIELD so the sheet treats it as a shield; it must be held (Block interlock); DR capped at 240 (3/51 half rule); heat +3 to +2 per Block.

### 40. LACQUERED O-YOROI PLATING (Reman, D, EP 4)

```
D|LACQUERED O-YOROI PLATING|4|DR:+15% NOTE:does_not_stack_with_other_percent_armor LOGISTICS:without_Reman_lacquer_between_sorties_drops_to_+5%|ARMOR // LAMELLAR PLATING|2.0 t|MATERIAL|Lacquered TL10 lamellae|Durable armor with a supply chain|Every plate is lacquered by hand at a temple-foundry. Captured suits rust within a season. We have tried six lacquers.|0|10|0
```

- **Design intent:** Better percentage armor that degrades without Reman logistics.
- **Balance:** REINFORCED ARMOR (3 EP, 1.2 t) gives +10%. This gives +15% (+75 on a Medium frame) for 4 EP and 2.0 t, and drops to +5% if it misses its Reman maintenance.
- **EP logic:** 2.0 t gives 3.5, rounded half-up to EP 4.
- **Revision 2:** Accepted by Ryuji; unchanged.

### 41. KAESHI POINT-DEFENSE LASER (Reman, D, EP 3)

```
D|KAESHI POINT-DEFENSE LASER|3|DEF:+2_Dodge_vs_ROCKET/MISSILE HEAT:+2/turn_used NOTE:no_effect_vs_kinetic_beam_or_melee|ECM // POINT-DEFENSE LASER|0.5 t|POWER|Turret laser, ~3 kW|Swatting rockets|Kaeshi: the return. Rebel rocket crews have learned to fire everything at once.|0|10|0
```

- **Design intent:** An active anti-rocket defense. Salvos overwhelm it.
- **Balance:** +2 to Dodge against rockets and missiles, the same size as the baseline 60mm pod's +2 Active Defense note, for +2 heat each turn it is used. It no longer negates hits, so with REACTIVE BRICKS it is two layers, not three.
- **EP logic:** Electronics rule: ~3 kW gives EP 3. The 3/51 Active Defense System (p.25, intercept on 13 or less) is the published model; FORGE turns its roll into a Dodge bonus to avoid an extra roll.
- **Revision 2:** Per-turn intercept roll replaced by the baseline +Active Defense pattern (Dodge +2 vs rockets) at +2 heat.

### 42. SHUKUCHI FLASH-STEP (Reman, U, EP 3)

```
U|SHUKUCHI FLASH-STEP|3|DEF:+3_to_one_Dodge_per_turn_declared_before_rolling HEAT:+4/use NOTE:no_effect_vs_area_or_salvo_attacks|MOBILITY // FLASH-STEP JETS|0.6 t|POWER|Micro-thruster ring, ~3 kW|Avoiding killing shots|Shukuchi: shrinking the earth. It is there on the sensor, and then it is five meters to the left and smiling.|0|10|1
```

- **Design intent:** A declared Dodge boost paid for in heat. Salvos and area attacks ignore it.
- **Balance:** +3 to one Dodge a turn for +4 heat. Two uses put a Standard core in the danger zone (which itself gives Dodge +1 and costs DR x0.75). Heat is the only limit, and it bites quickly.
- **EP logic:** 0.6 t and 3 kW give max(1.9, 3), so EP 3.
- **Revision 2:** USES and the second Dodge after a hit replaced with a declared Dodge bonus at +4 heat.

### 43. TSUKUROI NANITE MENDER (Reman, U, EP 3)

```
U|TSUKUROI NANITE MENDER|3|REPAIR:10%_of_location_max_HP EFFECT:Ready_restores_HP_to_one_location_self_or_adjacent_ally_no_roll HEAT:+2/use NOTE:cannot_restore_a_disabled_location|SUPPORT // NANITE REPAIR|0.5 t|POWER|Nanite reservoir, ~3 kW|Squad repair without a roll|Tsukuroi: mending. The swarm repairs a wound the way a monk repairs a robe, slowly and with great care.|0|10|0
```

- **Design intent:** Reliable Reman squad repair with limited supply.
- **Balance:** The same 10% as the FIELD WORKSHOP RIG at tier 2 (4 EP), with no roll, at 3 EP. Both cost +2 heat per use. The Reman edge is reliability, not size.
- **EP logic:** 0.5 t and 3 kW give max(1.8, 3), so EP 3.
- **Revision 2:** USES and shrine refill replaced by +2 heat per use; shares the REPAIR % token with the FIELD WORKSHOP RIG.

### 44. ONMYO OLEUM HEAT-SINK FINS (Reman, U, EP 2)

```
U|ONMYO OLEUM HEAT-SINK FINS|2|EFFECT:a_Ready_maneuver_sheds_2_HEAT_with_no_roll NOTE:requires_OLEUM_VIS_CORE NOTE:extended_fins_+1_to_enemy_detection|UTILITY // HEAT-SINK FINS|0.6 t|POWER|Lattice fins on the back plate|Reliable venting for Oleum-fed knights|The fins open like a fan behind the shoulders and glow faintly blue. Reman pilots call it the bow before the strike.|0|10|1
```

- **Design intent:** A Reman vent that never fails: a Ready sheds a flat 2 heat with no roll, as an alternative to the Engineering vent.
- **Balance:** A guaranteed 2 heat per Ready, against an expected 1.6 (Engineering 12) or 2.5 (Engineering 14) from a VENT 2 vent roll on the OLEUM VIS CORE. It is best for low-Engineering pilots, and the open fins are +1 to detect.
- **EP logic:** 0.6 t gives 2.5 x sqrt(0.6) = 1.9, so EP 2.
- **Revision 2:** REPLACES KAGURA OLEUM LANTERN: squad radius and rads tracking are not on the sheet, and its VENT -1 was a buff (Ryuji: shelve until rads ship).

### 45. SHINOBI SIGNATURE DAMPERS (Reman, U, EP 2)

```
U|SHINOBI SIGNATURE DAMPERS|2|TIERS:3 DETECT:-2/-4/-6 NOTE:a_SENSOR_SUITE_of_equal_or_higher_tier_ignores NOTE:offline_while_HEAT_is_in_danger_zone_or_redline|EW // SIGNATURE DAMPERS|0.2-0.7 t|POWER|2-4 kW emission scrubbers|Stealth approach|Our sensors hear a Reman knight the way you hear a held breath.|0|10|0
```

TIER entry:
```
"SHINOBI SIGNATURE DAMPERS":[[2, "TIER:1 DETECT:-2 NOTE:a_SENSOR_SUITE_of_equal_or_higher_tier_ignores NOTE:offline_while_HEAT_is_in_danger_zone_or_redline", "0.2 t", "Exhaust baffles, ~2 kW", "Baffled exhaust and quiet actuators."], [3, "TIER:2 DETECT:-4 NOTE:a_SENSOR_SUITE_of_equal_or_higher_tier_ignores NOTE:offline_while_HEAT_is_in_danger_zone_or_redline", "0.4 t", "Emission scrubbers, ~3 kW", "Scrubbed emissions across the radar and thermal bands."], [4, "TIER:3 DETECT:-6 NOTE:a_SENSOR_SUITE_of_equal_or_higher_tier_ignores NOTE:offline_while_HEAT_is_in_danger_zone_or_redline", "0.7 t", "Full shinobi suite, ~4 kW", "A knight-sized absence on every screen."]]
```

- **Design intent:** Tiered self-stealth. The matching Sensor tier beats it, and heat shuts it off.
- **Balance:** The ECM SUITE (2/4/6 EP) gives -4/-8/-12 to detection over an area. This gives -2/-4/-6 to the user only, for 2/3/4 EP, and stops working once the user runs hot.
- **EP logic:** The tiers use 2/3/4 kW, so EP 2/3/4 (the mass term at 0.2/0.4/0.7 t is 1.1/1.6/2.1).
- **Revision 2:** Accepted by Ryuji; unchanged.

### 46. TENGU-CLASS SKY FRAME (Reman, F, EP 3)

```
F|TENGU-CLASS SKY FRAME|3|ST/HP:125 DR:450/225 MOVE:8L/30S SM:+6 HND:+3 SR:1 NOTE:+2_HEAT_per_turn_airborne NOTE:High_Maintenance_-2_to_repair_rolls|FRAME // MECH|[DATA_NOT_FOUND]|ORIGIN|Reman mountain foundry, TL10|Aerial skirmishing, high ground|The Tengu does not fly so much as decline to land. Pilots train for a decade before their first sortie.|0|10|1
```

- **Design intent:** A flying Reman mech. Its weaknesses are low capacity, limited air time and logistics.
- **Balance:** Against the LIGHT FRAME (3 EP) it has +50 DR, +1 HND and 30S air MOVE, but every airborne turn adds +2 heat, so flight comes out of the heat pool. High Maintenance (3/51 p.25) gives -2 to repair rolls.
- **EP logic:** The frame rule gives (125 - 87.5) / 12.5 = 3, so EP 3. The extra DR and flight are paid for in heat while airborne and High Maintenance (3/51 p.25).
- **Revision 2:** AIRTIME counter replaced by +2 heat per airborne turn; LOGISTICS uses 3/51 High Maintenance.

### 47. TL10-KAGO HOVER TANK (Reman, F, EP 9)

```
F|TL10-KAGO HOVER TANK|9|ST/HP:140 DR:480/300 MOVE:6L/- SM:+4 HND:+2 SR:3 CREW:driver_gunner_commander NOTE:Locomotion_disabled_halves_MOVE_instead_of_stopping_it NOTE:High_Maintenance_-2_to_repair_rolls|FRAME // VEHICLE|[DATA_NOT_FOUND]|CREW|Driver, gunner, commander|Fast armored support|It crosses rivers our tanks must bridge and fields our tanks must bypass. Its lift fans, thankfully, are made of cloth-weave and pride.|0|10|1
```

- **Design intent:** A Reman hover tank, twice as fast as Imperial armor, that limps rather than stops when its lift is hit.
- **Balance:** Against the TL8-TANK (8 EP, 120 HP, DR 300/180, 3L) it gets +17% HP, +60% DR, double Move and +1 EP. A disabled Locomotion location halves its Move, and High Maintenance gives -2 to repair rolls.
- **EP logic:** The vehicle rule gives 2 + 140/20 = 9, so EP 9.
- **Revision 2:** Skirt sub-location HP replaced by the vehicle Locomotion location; High Maintenance replaces LOGISTICS.

### 48. TAMASHII RESONANCE CORE (Reman, R, EP 4)

```
R|TAMASHII RESONANCE CORE|4|ST/HP:+55% HEAT:11 VENT:1 SHUTDOWN:ECM_SUITE_tier_3_in_radius_raises_VENT_to_3 NOTE:High_Maintenance_-2_to_repair_rolls|REACTOR // RESONANCE CORE|[DATA_NOT_FOUND]|FUEL|Resonant lattice, TL10|Clean TL10 power|Tamashii: soul. The core hums a note that Reman engineers tune by ear. Imperial jammers, it turns out, sing off-key.|0|10|1
```

- **Design intent:** A Reman core that vents best of all, until a tier-3 jammer knocks its resonance out of tune.
- **Balance:** VENT 1 (about 4.6 heat per vent at Engineering 14) like the HEAVY FUSION CORE (5 EP, 70%, HEAT 12), at 4 EP for 55% and HEAT 11. Against an enemy tier-3 ECM it drops to VENT 3, the worst in the catalog.
- **EP logic:** The reactor rule gives 55% / 15 = 3.7, so EP 4.
- **Revision 2:** VENT polarity fixed (VENT 3 to VENT 1); the ECM shutdown now worsens VENT to 3.

### 49. KAZE-NO-MAI VECTOR THRUSTERS (Reman, T, EP 2)

```
T|KAZE-NO-MAI VECTOR THRUSTERS|2|MOVE:+30% HND:+2 SR:-1 NOTE:High_Maintenance_-2_to_repair_rolls|THRUSTER // VECTOR THRUSTERS|[DATA_NOT_FOUND]|FUEL|TL10 vectored plasma jets|Duelling agility|Kaze-no-mai: wind dance. The jets turn the knight the way a fan turns in a dancer's hand.|0|10|0
```

- **Design intent:** Agile TL10 thrusters. Their weakness is logistics and stability.
- **Balance:** Against STANDARD THRUSTERS (2 EP, +25%) it gets +5% Move and +2 HND at SR -1, with slow repairs.
- **EP logic:** The thruster rule gives 30% / 12 = 2.5. The extra HND point costs about 0.5, so EP 2.
- **Revision 2:** Accepted; LOGISTICS uses 3/51 High Maintenance.

### 50. ZANSHIN PREDICTIVE LINK (Reman, G, EP -2)

```
G|ZANSHIN PREDICTIVE LINK|-2|ACC-MELEE:+3 ACC-BALLISTIC:-1 ACC-ROCKET_MISSILE:-1 ACC-BEAM:-1|TARGETING // DUELIST LINK|[DATA_NOT_FOUND]|LINK|Neural predictive sync, TL10|Melee duelling|Zanshin: the remaining mind. The pilot's attention stays on the opponent after the cut. The link only makes it literal.|0|10|0
```

- **Design intent:** A bushido melee targeting suite. Running hot breaks the pilot's focus.
- **Balance:** +3 melee and -1 to every ranged class the catalog uses (BALLISTIC, ROCKET_MISSILE, BEAM), against LINKED FIRE CONTROL (MELEE) +2/-1/-1 at -1 EP.
- **EP logic:** Targeting rule: +3 in one class and -1 in the others is worth about +1.3 ACC-ALL, so 1 - 2 = -1 by formula. EP stays -2, priced as one ACC step above LINKED FIRE CONTROL (MELEE) at -1 (+3 against +2 melee, same off-class penalties); at -1 it would beat Linked Melee outright for any build without beam weapons. No TL or faction surcharge (catalogue v1, Ryuji's TL review).
- **Revision 2:** ACC-RANGED (never applied) replaced by live per-class penalties; the unparsed Parry token deleted.

## RAW only (paste-ready, 50 lines)

```
A|105mm SIEGE MORTAR|3|ROF:1 DMG:6dx13(4) AVG:273 ACC:0 RCL:4 RNG:131/656 AMMO:4(1) SPARE:0 INDIRECT:-2_if_an_ally_with_LOS_made_a_SENSORS_roll_this_turn_else_-10 NOTE:indirect_fire_only NOTE:minimum_range_25|ROCKET/MISSILE // BREECH MORTAR|1.8 t|AMMO|105mm top-attack HEAT bombs, 4-rd rack|Indirect fire with a spotter|The mortar does not care whether its crew can see the enemy, only whether somebody can. Imperial doctrine pairs every mortar knight with a scout who is expected to be brave, patient and very well hidden.|0|8|1
A|35mm GARRISON AUTOCANNON|3|ROF:4 DMG:6dx10(3) AVG:210(840) ACC:4 RCL:2 RNG:120/478 AMMO:16(1) SPARE:1 RELIABLE:crit_fail_is_a_miss_not_a_malfunction|BALLISTIC // CHAIN AUTOCANNON|1.6 t|AMMO|35mm APFSDS-DU, 16-rd box|Dependable mid-range anti-armor|Our quartermasters keep a garrison cannon that has fired in eleven campaigns on two barrels. It is not exciting, and that is the point.|0|8|0
A|IMPACT MAUL|4|ROF:X DMG:94d(3) AVG:329 NOTE:any_penetrating_hit_forces_the_target_to_make_a_Stability_check|MELEE // POWER MAUL|3.2 t|POWER|Hydraulic head accumulator, ~30 min|Toppling knights, breaking formations|The maul was meant to retire with the old foot knights. It refused. A knight on the ground is a knight out of the fight, and nothing puts one there faster.|1|8|0
A|60mm RIPPLE ROCKET BATTERY|3|ROF:6 DMG:4dx12(4) AVG:168(1008) ACC:5 RCL:4 RNG:75/375 AMMO:12(2) SPARE:0 NOTE:+2_Active_Defense_vs_missiles NOTE:fires_two_6-rocket_salvos|ROCKET/MISSILE // SALVO BATTERY|1.2 t|AMMO|60mm fin-stabilized HEAT, 12 tubes|Sustained area suppression|Same rocket as the pod, twice the tubes, half the glamour. Line regiments like it because a second salvo is a second chance.|0|8|0
A|OLEUM BREACHING TORCH|2|ROF:X DMG:76d(4) AVG:266 HEAT:+2/hit NOTE:requires_OLEUM_VIS_CORE NOTE:close_combat_only|MELEE // PLASMA CUTTER|0.8 t|FUEL|Oleum Vis bleed line from the core|Breaching hulls and bunkers|Sappers used it on vault doors long before anyone thought to swing it at a knight. The cockpit dosimeter clicks every time it bites.|0|8|1
D|IMPERIAL HEATER SHIELD|4|DR:200 HP:200|SHIELD // HEATER SHIELD|2.0 t|MATERIAL|Laminated steel-ceramic heater|Large-shield armor at a lower EP|Every Imperial knight is issued one at investiture, and the old ones go to the chapel walls. Nobody re-paints the dents.|0|8|0
D|CROWN-GRADE TOURNEY BARDING|4|DR:+20% MOVE:-10% HND:-1 NOTE:does_not_stack_with_other_percent_armor|ARMOR // HEAVY BARDING|2.8 t|MATERIAL|Layered steel barding over the frame|Maximum passive armor for line knights|Tourney barding was meant for parades. Then the Crown noticed that the knights wearing it kept coming home.|0|8|0
D|SMOKE DISCHARGERS|1|EFFECT:Ready_attacks_into_or_out_of_your_smoke_use_Targeter_COVER_-3_until_your_next_turn HEAT:+1/use NOTE:SENSOR_SUITE_tier_3_ignores|ECM // SMOKE MORTARS|0.3 t|AMMO|Multispectral smoke grenades|Breaking line of sight|The oldest countermeasure we own and still the one the Remans complain about.|0|8|0
U|FIELD WORKSHOP RIG|2|TIER:1 REPAIR:5%_of_location_max_HP EFFECT:Ready_plus_ENGINEERING_roll_restores_HP_to_one_location_self_or_adjacent_ally HEAT:+2/use NOTE:cannot_restore_a_disabled_location|SUPPORT // FIELD WORKSHOP|0.4-1.6 t|POWER|2-6 kW welder and tool arm|Squad repair|Every Imperial lance carries one knight who is secretly a blacksmith. The others pretend not to notice until they need her.|0|8|0
U|HERALDIC COMMAND MAST|2|EFFECT:designate_1_target/turn_allies_with_LOS_to_the_mast_add_+1_ROLL_MOD_vs_it RADIUS:300m NOTE:does_not_stack_with_other_ally-granted_bonuses NOTE:bearer_+2_to_enemy_detection NOTE:lost_if_head_destroyed|SUPPORT // COMMAND BANNER|0.5 t|POWER|IFF and laser designator, ~2 kW|Lance command, focus fire|The banner tells your lance where to shoot. It also tells the enemy exactly which knight to kill first, which is why we issue it to the proud ones.|0|8|0
U|OLEUM SLURRY COOLANT FLUSH|2|NOTE:+2_to_ENGINEERING_vent_rolls NOTE:requires_OLEUM_VIS_CORE NOTE:refilled_by_Imperial_maintenance_crews_between_sorties|UTILITY // COOLANT FLUSH|0.6 t|FUEL|Oleum slurry coolant loop|Faster venting for Oleum-fed knights|The Crown never trusted Oleum, so it built the plumbing first. Imperial Oleum knights vent faster than anyone, and they are reminded of why every time they do.|0|8|1
U|RECOVERY TOW WINCH|1|EFFECT:tow_one_disabled_ally_at_half_MOVE NOTE:lost_when_the_Utility_location_is_disabled|SUPPORT // RECOVERY WINCH|0.3 t|POWER|Torso winch, 60 m cable|Dragging allies out of the fire|Leave no knight on the field. The winch is how that oath gets kept on a Tuesday.|0|8|0
F|CASTELLAN SUPERHEAVY FRAME|9|ST/HP:200 DR:800/400 MOVE:5L/10S SM:+7 HND:0 SR:3|FRAME // MECH|[DATA_NOT_FOUND]|ORIGIN|Imperial arsenal foundries, line-built|Breakthrough, holding the line|Castellans are older than most noble houses and better maintained. They do not charge; they arrive.|0|8|1
F|TL8-ARMORED CARRIER|5|ST/HP:110 DR:280/160 MOVE:4L/- SM:+4 HND:+1 SR:3 CREW:driver_and_commander CARGO:6_infantry_or_2_downed_pilots|FRAME // VEHICLE|[DATA_NOT_FOUND]|CREW|Driver, commander, troop bay|Moving infantry and rescuing pilots|The carrier has no glory and no enemies; nobody bothers to shoot it until it has already unloaded.|0|8|0
R|ANCESTRAL THERMAL-MASS CORE|3|ST/HP:+40% HEAT:15 VENT:3 HND:-1|REACTOR // THERMAL-MASS FISSION PILE|[DATA_NOT_FOUND]|FUEL|Graphite-moderated pile, decades per load|Soaking heat in long fights|It runs warm for an hour before battle and keeps running long after newer cores have tripped their breakers.|0|8|0
T|LONG-SERVICE THRUSTERS|2|MOVE:+20% HND:-1 SR:+2|THRUSTER // GARRISON THRUSTERS|[DATA_NOT_FOUND]|FUEL|Standard Imperial blend|Reliable repositioning|Rated for a century of service. Two of the sets in our depot have already done it.|0|8|0
G|DRESSED-LINE FIRE CONTROL|-1|ACC-ALL:+1 ACC-FAR:+1|TARGETING // LINE FIRE NET|[DATA_NOT_FOUND]|LINK|Lance fire-direction net|Long-range line fire|Imperial line doctrine is simple: stand still, stand together, shoot far. The suite only makes the last part easier.|0|8|0
A|HAILSTORM 40mm ROTARY CANNON|4|ROF:5 DMG:6dx11(3) AVG:231(1155) ACC:3 RCL:3 RNG:128/498 AMMO:15(2) SPARE:1 HEAT:+3/burst|BALLISTIC // ROTARY CANNON|3.0 t|AMMO|40mm AP-T, 15-rd drum|Burst damage at mid range|It spins up like a turbine and empties like a promise. Every Rebel cell wants one, and the ones who have one want more ammunition.|1|8|1
A|BREACHER SCATTERGUN|3|ROF:6 DMG:6dx6(3) AVG:126(756) ACC:2 RCL:1 RNG:75/250 AMMO:4(1) SPARE:1 NOTE:6_slugs_per_shot_counted_as_ROF NOTE:best_vs_REAR|BALLISTIC // CANISTER GUN|1.6 t|AMMO|90mm slug canister, 4 shells|Flanking, ambushing vehicles|Rebel mechanics call it a door-knocker. The door, in practice, is the back of a knight.|0|8|0
A|RIPSAW CHAIN BLADE|3|ROF:X DMG:83d(3) AVG:290.5 NOTE:crit_fail_throws_the_chain_and_destroys_it|MELEE // CHAIN BLADE|1.4 t|POWER|Overdriven motor, ~10 min|One-handed brawling|Imperial blades sing. This one screams, and it keeps screaming right up until it throws its chain into the pilot's own cockpit glass.|0|8|0
A|SUNSPIKE THERMITE PROJECTOR|3|ROF:1 DMG:6dx12(4) AVG:252 ACC:3 RCL:1 RNG:25/100 AMMO:5(1) SPARE:0 HEAT:+2/shot TARGET-HEAT:+1_on_penetrating_hit_max_+1_per_target_per_turn_cannot_raise_target_to_half_cap_or_above|BALLISTIC // THERMITE CANISTER GUN|1.1 t|AMMO|100mm thermite canisters, 5 rounds|Cooking enemy cores|Rebels figured out what we never wanted to admit: a knight running hot is already half beaten.|0|8|1
A|HORNET 80mm ALPHA POD|4|ROF:4 DMG:6dx15(4) AVG:315(1260) ACC:4 RCL:5 RNG:100/450 AMMO:4(1) SPARE:0 NOTE:one_salvo_no_reload NOTE:+2_Active_Defense_vs_missiles NOTE:if_its_location_takes_a_hit_over_the_stability_threshold_while_loaded_the_pod_cooks_off_for_6dx10(3)_to_that_location|ROCKET/MISSILE // ALPHA-STRIKE POD|2.6 t|AMMO|80mm HEAT, 4 tubes, single salvo|Opening alpha strike|Four rockets, one chance, and a pod that would very much like to explode. Rebel doctrine in a single sentence.|0|8|1
A|SALVAGED LASER CARBINE|3|ROF:3 DMG:6dx10(3) AVG:210(630) ACC:6 RCL:1 RNG:150/500 HEAT:+1/shot NOTE:no_ammo|BEAM // PULSE LASER|1.2 t|POWER|Core-fed, ~600 kJ per pulse|Accurate sustained fire|Pieced together from a downed Reman lance and three civilian mining rigs. It works. Nobody knows for how long.|0|8|1
D|SALVAGE PLATING KIT|1|TIER:1 PLATE:10 PLATE-USES:1 PLATE-HP:full|ARMOR // SCRAP PLATING|0.3-1.0 t|MATERIAL|Welded hull scrap|Cheap, fast survivability|Rebel knights wear the armor of whatever they killed last week. It shows.|0|8|0
D|REACTIVE ARMOR BRICKS|3|EFFECT:+2_armor_divisor_steps_vs_shaped_charge/rockets NOTE:does_not_stack_with_SPACED_ARMOR_PANELS NOTE:no_effect_vs_kinetic_beam_or_melee|ARMOR // EXPLOSIVE REACTIVE|1.0 t|MATERIAL|Explosive reactive tiles|Defeating rockets|Rebels bolt explosives to their armor and call it protection. Disturbingly, it is.|0|8|1
U|GRAPPLING HARPOON|1|JUMP:reel_up_to_100m_to_terrain NOTE:Piloting_roll_to_land_cleanly|MOBILITY // HARPOON REEL|0.3 t|POWER|Gas launcher, 4 harpoons|Vertical movement, ambush|Code-named 'the Zipline' by a cell that had no right to survive that canyon.|0|8|0
U|DECOY BEACON DROP|2|EFFECT:Ready_the_next_ranged_attack_on_you_or_an_adjacent_ally_this_turn_must_win_SENSORS_vs_your_EW_or_miss HEAT:+2/use|EW // DECOY BEACONS|0.4 t|POWER|Throwable emitter, ~2 kW|Covering a teammate|It screams 'I am a knight' on every band we know of. Half our pilots now wear one as a joke. The other half are still alive because of it.|0|8|0
U|JURY-RIG FIELD KIT|1|EFFECT:Ready_plus_ENGINEERING-2_restores_a_disabled_limb_to_1_HP HEAT:+2/use NOTE:fail_by_5+_the_limb_is_WRECKED NOTE:self_or_adjacent_ally|SUPPORT // JURY-RIG|0.2 t|MATERIAL|Clamps, cable, tape|Getting a limb working again|Imperial manuals say a crippled limb needs a depot. Rebel mechanics say it needs a clamp and a positive attitude.|0|8|0
U|MESH NET RELAY|2|EFFECT:counts_as_SENSOR_SUITE_one_tier_higher_max_tier_2_while_an_allied_SENSOR_SUITE_is_within_500m NOTE:+1_to_enemy_detection|EW // MESH RELAY|0.3 t|POWER|Burst-mesh radio, ~2 kW|Sharing sensors|Democratic warfare: everyone sees what the best-equipped cell sees, and everyone goes blind together.|0|8|0
F|TL8-TECHNICAL RAIDER|5|ST/HP:65 DR:150/80 MOVE:8L/- SM:+3 HND:+3 SR:2 CREW:driver_and_gunner|FRAME // VEHICLE|[DATA_NOT_FOUND]|CREW|Driver, gunner|Raids, scouting, harassment|A cargo truck, a welded mount and a gunner with nothing to lose. Rebels field more of these than knights.|0|8|0
R|OLEUM SPIKE CELL|3|ST/HP:+40% HEAT:10 VENT:2 HND:+1 NOTE:radiation_signature_+3_to_enemy_sensor_detection NOTE:Oleum_rads_per_the_OLEUM_VIS_CORE_once_the_rads_counter_ships|REACTOR // BOOTLEG OLEUM CELL|[DATA_NOT_FOUND]|FUEL|Unshielded Oleum Vis slurry|Light Oleum power for raiders|The Empire rations Oleum to knights it can afford to lose slowly. The Rebels hand it to anyone brave enough and call the dosimeter a suggestion.|0|8|1
T|POGO-JET HOP THRUSTERS|0|MOVE:+10% JUMP:free_hop_up_to_1/4_MOVE_once_per_turn SR:-1|THRUSTER // HOP JETS|[DATA_NOT_FOUND]|FUEL|Hydrazine blend|Climbing over cover, dodging|Cheap enough to replace after every raid, which is good, because they will need replacing after every raid.|0|8|0
G|BURST CRUNCHER FIRE CONTROL|1|ACC-BALLISTIC:+1 ACC-ROCKET_MISSILE:-1|TARGETING // BURST CALCULATOR|[DATA_NOT_FOUND]|LINK|Bootleg ballistic chip|Making bursts land|Rebel code: brilliant, undocumented, and allergic to conserving anything.|0|8|0
A|HAGANE-YUMI GAUSS LONGBOW|5|ROF:1 DMG:6dx25(5) AVG:525 ACC:6 RCL:2 RNG:200/640 AMMO:4(1) SPARE:1 HEAT:+4/shot DRAW:an_Aim_maneuver_is_required_before_every_shot|BALLISTIC // COIL LONGBOW|3.6 t|POWER|Coil capacitors, hyperdense bolts|Duelling at long range|The archer draws, breathes, and waits for the target to choose its own moment. Reman marksmen say the bow is only a way of listening.|1|10|1
A|NAGINATA HIGH-FREQUENCY GLAIVE|3|ROF:X DMG:80d(4) AVG:280|MELEE // REMAN POLEARM|1.1 t|POWER|HF emitter, ~20 min|Two-handed melee damage|The naginata keeps the enemy where the Reman wants them: one step too far away to answer.|1|10|0
A|WAKIZASHI GUARD BLADE|2|ROF:X DMG:67d(4) AVG:234.5 NOTE:one-handed_off-hand_blade_Parries_normally|MELEE // REMAN SHORT BLADE|0.4 t|EDGE|Monomolecular laminate|Off-hand parrying|The short sword is the one a Reman keeps when everything else is gone. Our duelists learned to respect the second blade the hard way.|0|10|0
A|HIKARI PARTICLE LANCE|5|ROF:1 DMG:5dx20(5) AVG:350 ACC:6 RCL:1 RNG:120/400 HEAT:+4/shot NOTE:no_ammo|BEAM // CHARGED-PARTICLE CANNON|3.6 t|POWER|Core-fed, ~2.5 MJ per shot|Heavy beam fire|Light, the Remans call it, and they do not mean it poetically. Our sensor crews call it the reason to stand in the smoke.|1|10|1
A|KAGEBOSHI REMOTE BITS|4|ROF:4 DMG:6dx7(3) AVG:147(588) ACC:4 RCL:1 RNG:100/400 AMMO:16(2) SPARE:0 HEAT:+2/turn_used REAR:apply_the_REAR_flag NOTE:firing_the_bits_is_the_attack_for_that_turn NOTE:cannot_combine_with_GAP NOTE:ECM_SUITE_tier_2+_in_radius_grounds_the_bits NOTE:lost_when_the_Utility_location_is_disabled|BALLISTIC // REMOTE WEAPON BITS|0.8 t|POWER|4 coil-gun bits, 25mm, 4 volleys|Attacking from every angle|Shadow-children, the Reman pilots call them. Four small guns, one mind, and no safe facing anywhere on the field.|0|10|1
D|HAKKEI DEFLECTOR SHIELD|5|DR:240 HP:250 HEAT:+2/Block NOTE:hand-held_emitter_held_like_any_shield NOTE:collapses_while_HEAT_is_in_redline|SHIELD // BEAM DEFLECTOR|0.8 t|POWER|Forearm emitter, ~5 kW|Heat-limited heavy blocking at low mass|A Reman beam shield weighs less than our bucklers and blocks like our tower walls. Our engineers have measured the field three times and stopped believing the readings.|0|10|1
D|LACQUERED O-YOROI PLATING|4|DR:+15% NOTE:does_not_stack_with_other_percent_armor LOGISTICS:without_Reman_lacquer_between_sorties_drops_to_+5%|ARMOR // LAMELLAR PLATING|2.0 t|MATERIAL|Lacquered TL10 lamellae|Durable armor with a supply chain|Every plate is lacquered by hand at a temple-foundry. Captured suits rust within a season. We have tried six lacquers.|0|10|0
D|KAESHI POINT-DEFENSE LASER|3|DEF:+2_Dodge_vs_ROCKET/MISSILE HEAT:+2/turn_used NOTE:no_effect_vs_kinetic_beam_or_melee|ECM // POINT-DEFENSE LASER|0.5 t|POWER|Turret laser, ~3 kW|Swatting rockets|Kaeshi: the return. Rebel rocket crews have learned to fire everything at once.|0|10|0
U|SHUKUCHI FLASH-STEP|3|DEF:+3_to_one_Dodge_per_turn_declared_before_rolling HEAT:+4/use NOTE:no_effect_vs_area_or_salvo_attacks|MOBILITY // FLASH-STEP JETS|0.6 t|POWER|Micro-thruster ring, ~3 kW|Avoiding killing shots|Shukuchi: shrinking the earth. It is there on the sensor, and then it is five meters to the left and smiling.|0|10|1
U|TSUKUROI NANITE MENDER|3|REPAIR:10%_of_location_max_HP EFFECT:Ready_restores_HP_to_one_location_self_or_adjacent_ally_no_roll HEAT:+2/use NOTE:cannot_restore_a_disabled_location|SUPPORT // NANITE REPAIR|0.5 t|POWER|Nanite reservoir, ~3 kW|Squad repair without a roll|Tsukuroi: mending. The swarm repairs a wound the way a monk repairs a robe, slowly and with great care.|0|10|0
U|ONMYO OLEUM HEAT-SINK FINS|2|EFFECT:a_Ready_maneuver_sheds_2_HEAT_with_no_roll NOTE:requires_OLEUM_VIS_CORE NOTE:extended_fins_+1_to_enemy_detection|UTILITY // HEAT-SINK FINS|0.6 t|POWER|Lattice fins on the back plate|Reliable venting for Oleum-fed knights|The fins open like a fan behind the shoulders and glow faintly blue. Reman pilots call it the bow before the strike.|0|10|1
U|SHINOBI SIGNATURE DAMPERS|2|TIERS:3 DETECT:-2/-4/-6 NOTE:a_SENSOR_SUITE_of_equal_or_higher_tier_ignores NOTE:offline_while_HEAT_is_in_danger_zone_or_redline|EW // SIGNATURE DAMPERS|0.2-0.7 t|POWER|2-4 kW emission scrubbers|Stealth approach|Our sensors hear a Reman knight the way you hear a held breath.|0|10|0
F|TENGU-CLASS SKY FRAME|3|ST/HP:125 DR:450/225 MOVE:8L/30S SM:+6 HND:+3 SR:1 NOTE:+2_HEAT_per_turn_airborne NOTE:High_Maintenance_-2_to_repair_rolls|FRAME // MECH|[DATA_NOT_FOUND]|ORIGIN|Reman mountain foundry, TL10|Aerial skirmishing, high ground|The Tengu does not fly so much as decline to land. Pilots train for a decade before their first sortie.|0|10|1
F|TL10-KAGO HOVER TANK|9|ST/HP:140 DR:480/300 MOVE:6L/- SM:+4 HND:+2 SR:3 CREW:driver_gunner_commander NOTE:Locomotion_disabled_halves_MOVE_instead_of_stopping_it NOTE:High_Maintenance_-2_to_repair_rolls|FRAME // VEHICLE|[DATA_NOT_FOUND]|CREW|Driver, gunner, commander|Fast armored support|It crosses rivers our tanks must bridge and fields our tanks must bypass. Its lift fans, thankfully, are made of cloth-weave and pride.|0|10|1
R|TAMASHII RESONANCE CORE|4|ST/HP:+55% HEAT:11 VENT:1 SHUTDOWN:ECM_SUITE_tier_3_in_radius_raises_VENT_to_3 NOTE:High_Maintenance_-2_to_repair_rolls|REACTOR // RESONANCE CORE|[DATA_NOT_FOUND]|FUEL|Resonant lattice, TL10|Clean TL10 power|Tamashii: soul. The core hums a note that Reman engineers tune by ear. Imperial jammers, it turns out, sing off-key.|0|10|1
T|KAZE-NO-MAI VECTOR THRUSTERS|2|MOVE:+30% HND:+2 SR:-1 NOTE:High_Maintenance_-2_to_repair_rolls|THRUSTER // VECTOR THRUSTERS|[DATA_NOT_FOUND]|FUEL|TL10 vectored plasma jets|Duelling agility|Kaze-no-mai: wind dance. The jets turn the knight the way a fan turns in a dancer's hand.|0|10|0
G|ZANSHIN PREDICTIVE LINK|-2|ACC-MELEE:+3 ACC-BALLISTIC:-1 ACC-ROCKET_MISSILE:-1 ACC-BEAM:-1|TARGETING // DUELIST LINK|[DATA_NOT_FOUND]|LINK|Neural predictive sync, TL10|Melee duelling|Zanshin: the remaining mind. The pilot's attention stays on the opponent after the cut. The link only makes it literal.|0|10|0
```

### TIER entries (merge into the `let TIER={...}` object)

```
"FIELD WORKSHOP RIG":[[2, "TIER:1 REPAIR:5%_of_location_max_HP EFFECT:Ready_plus_ENGINEERING_roll_restores_HP_to_one_location_self_or_adjacent_ally HEAT:+2/use NOTE:cannot_restore_a_disabled_location", "0.4 t", "Hip tool arm, ~2 kW", "A welding arm and a parts bin: enough to keep a lance walking home."], [4, "TIER:2 REPAIR:10%_of_location_max_HP EFFECT:Ready_plus_ENGINEERING_roll_restores_HP_to_one_location_self_or_adjacent_ally HEAT:+2/use NOTE:cannot_restore_a_disabled_location", "0.9 t", "Shoulder workshop, ~4 kW", "A full field kit on a shoulder hardpoint. Squires fight over who gets to carry it."], [6, "TIER:3 REPAIR:15%_of_location_max_HP EFFECT:Ready_plus_ENGINEERING_roll_restores_HP_to_one_location_self_or_adjacent_ally HEAT:+2/use NOTE:cannot_restore_a_disabled_location", "1.6 t", "Back-mounted forge, ~6 kW", "A walking forge. The lance that brings one fights a second day."]],
"SALVAGE PLATING KIT":[[1, "TIER:1 PLATE:10 PLATE-USES:1 PLATE-HP:full", "0.3 t", "Door panels and hope", "A few welded panels over the worst gaps."], [2, "TIER:2 PLATE:15 PLATE-USES:1 PLATE-HP:full", "0.6 t", "Truck hull sections", "Proper scrap plate, welded at awkward angles."], [3, "TIER:3 PLATE:20 PLATE-USES:1 PLATE-HP:full", "1.0 t", "Captured Imperial plate", "Imperial plate, repainted, still wearing someone else's heraldry underneath."]],
"SHINOBI SIGNATURE DAMPERS":[[2, "TIER:1 DETECT:-2 NOTE:a_SENSOR_SUITE_of_equal_or_higher_tier_ignores NOTE:offline_while_HEAT_is_in_danger_zone_or_redline", "0.2 t", "Exhaust baffles, ~2 kW", "Baffled exhaust and quiet actuators."], [3, "TIER:2 DETECT:-4 NOTE:a_SENSOR_SUITE_of_equal_or_higher_tier_ignores NOTE:offline_while_HEAT_is_in_danger_zone_or_redline", "0.4 t", "Emission scrubbers, ~3 kW", "Scrubbed emissions across the radar and thermal bands."], [4, "TIER:3 DETECT:-6 NOTE:a_SENSOR_SUITE_of_equal_or_higher_tier_ignores NOTE:offline_while_HEAT_is_in_danger_zone_or_redline", "0.7 t", "Full shinobi suite, ~4 kW", "A knight-sized absence on every screen."]]
```

## Sources

All of these are Overseer's files in `/workspace/forge-os/gurps/`. Page numbers were read from the page footers in the text files.

- David L. Pulver, "Eidetic Memory: Modular Mecha," *Pyramid* 3/51 (Jan 2013), pp.23-27:
  - Standard Mecha Statistics and laminate (p.24).
  - Smoke dischargers on the standard mecha (p.24).
  - Design Feature Table: Active Defense System, High Maintenance, DR +30 and others (p.25).
  - Radar Jammer, Stealth, Volatile, one weapon per turn, and the missile-pod descriptions (p.26).
  - Ranged Weapon Table, energy bank, Mecha Shield Table, handheld Acc x2/3, and giant melee pointing to Low-Tech Companion 2 and Ultra-Tech p.164 (p.27).
- *GURPS High-Tech*:
  - Oerlikon 20mm and M242 25mm (p.137).
  - Using Artillery: indirect fire (p.139).
  - Cannon table, D-81TM 125mm (p.140), and its APFSDS text (p.141).
  - 120mm mortar (p.146). Rocket launchers (p.148). Guided missiles (p.152).
  - AP, APDS and APFSDS (p.167). DU rounds (p.169). HEAT (p.170). Smoke dischargers (p.229).
- *GURPS Ultra-Tech*:
  - Laser Cannon (p.116). Blaster Cannon (p.123). Flamers (p.127).
  - APDS and APEP (p.152). HEC and Shaped Charge tables, and Shotshell (p.154). HEMP Warhead Table (p.155).
  - Superfine blade (p.163). Vibroblade (p.164).
- Pyramid 3/40, "Mecha Operations" (pp.4-8): melee scaling, laminate, equipment packs, Compact Power Plant, Enhanced Ground Move.
- `terminal.html` v5.0.1 (read-only): heat code (lines 779, 782, 786-788, 984), `statWith` / `armStats` (lines 973-981), `isShield` (line 611), Block interlock (line 905), `tgtBonus` (line 798), and TOKEN_REF.
- `review-batch2.md` (Ryuji).

**No web sources are used in this revision.** The v1 secondary sources (Cole, Baughn, the RPG.net wiki, blogs) have been dropped. Everything they supported is now either cited to a book above or labelled as an extrapolation from the baseline.
