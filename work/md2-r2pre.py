import pickle,sys,json
sys.path.insert(0,'.')
from items2 import I,CHG
L,tier_js,errs,fc,cc=pickle.load(open('out.pkl','rb'))
o=[];w=o.append
w('# FORGE-OS Catalog Concepts, Batch 2, revision 2 (50 concepts)\n')
w('Text and ideas only. Nothing in `terminal.html` or any code was edited. The previous version is kept as `concepts-batch2-v1.md` / `concepts-batch2-raw-v1.txt`. Every line uses the 13-field RAW format `CAT|NAME|EP|STATS|CLASS|MASS|LABEL|LABEL-VALUE|ROLE|FLAVOR|TWO-HANDED|TL|EXPERIMENTAL`. (The parser also reads an optional 14th field, SHOULDER-FIREABLE; 13-field lines load with it off, like the accepted pass-5 lines.)\n')
w('''Revision 2 does three things:
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
''')
w('## Heat model (verified in the code)\n')
w('''I read the following lines, which are identical in `/workspace/forge-os/terminal.html` and `/workspace/forge-os/from-grok/FORGE-OS-sortie-app/public/terminal.html`. (The second path includes `/public/`; the path in the brief was missing it.)

- **Line 984** (`heatCap`, `ventBase`): HEAT and VENT are read from the installed reactor, or from the frame on a General Chassis.
- **Line 779** (`heatDanger`, `heatFull`): the danger zone starts when `heat*2 >= cap`, and redline starts when `heat >= cap`. Heat is clamped to the cap.
- **Line 782** (`ZONE_TXT`): danger zone = DR x0.75 / Dodge +1 / Move +1. Redline = DR x0.5 / Dodge +2 / Move +2.
- **Lines 786-788** (`heatVent`): venting is an ENGINEERING roll with `step = max(1, VENT)`. A success sheds `1 + degrees of success`, with one degree for every VENT points of margin. A failure sheds nothing.

Consequences:
- Heat never bleeds off on its own.
- **A lower VENT is better.** VENT 1 is best (HEAVY FUSION CORE, TAMASHII). VENT 3 is worst (LIGHT FISSION CELL, ANCESTRAL).
- Every `HEAT:+N` in this batch is a manual, permanent addition until the pilot spends a turn venting. Ryuji's table puts that at about 2.5 heat per vent at Engineering 14 on VENT 2.

So heat costs here are mostly +1 or +2. Ryuji's explicit values are kept where he set them: Hailstorm +3 per burst, Longbow +4 per bolt, Shukuchi +4 per use. The only other cost above +2 is the Particle Lance at +4.
''')
w('## Source alignment (Pyramid 3/51 as the main reference)\n')
w('''**The 3/51 method.** David Pulver's "Eidetic Memory: Modular Mecha" (Pyramid 3/51, pp.23-27) does not give a damage formula. It gives fixed tables:
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
''')
w('## How Ryuji\'s review was folded in\n')
w('''Every fix was applied except the following. Each is changed because a source or the verified code says otherwise, or because the re-derivation moved the numbers.

- **105mm SIEGE MORTAR, EP.** Ryuji priced it at 5 EP for 483 damage. Re-derived from the Ultra-Tech HEMP table it is 6dx13 (273), so mass and EP fall to 1.8 t and 3 EP. His spotter, ACC 0 and SPARE:0 fixes are applied.
- **HORNET.** Re-anchored on the same 80mm round as the baseline launcher, which is the 3/51 Heavy Missile Pod's 6dx15. That raises it from 6dx14 to 6dx15 and from 3 EP to 4 EP.
- **SUNSPIKE target heat.** Ryuji capped it at +2 per turn and cap - 1. It is now +1 per turn, never past half the target's cap. That way it can only bring a target to the edge of the danger zone, because his own table shows how hard the zone multiplies team damage.
- **HIKARI PARTICLE LANCE.** It uses 3/51's exact 5dx20 rather than his 6dx17 (both average about 350). Heat is +4 rather than +5, since the damage dropped 21%.
- **HAKKEI.** It must be renamed to "...SHIELD", because the sheet's `isShield` matches on the name, and it must be held, because of the Block interlock at line 905. "Hand stays free" is impossible on the sheet. DR is capped at 240/180 (half the 3/51 Large shield), and heat is +2 per Block, as he suggested.
- **MANTLET SHIELD** is cut rather than folded into TOWER SHIELD tiers, because that would edit a baseline TIER entry. It is replaced by IMPERIAL HEATER SHIELD.
- **CROWN-GRADE SPALL LINER** becomes percent barding rather than `PLATE:15`, because the batch already has two PLATE items (SALVAGE PLATING and his REDUNDANT HARNESS proposal).
- **New weapon classes and Linked FC.** I can't add classes to the baseline LINKED TIER without editing it. So EM weapons (LONGBOW, BITS) and the SUNSPIKE are mapped to BALLISTIC. 3/51 itself lists railguns under Gunner (Cannon) with ordinary guns. Only BEAM remains (LASER CARBINE, PARTICLE LANCE). **Data change proposed to Overseer, not made:** add `ACC-BEAM:-1` to each LINKED FIRE CONTROL tier.
- **Shelved items.** OLEUM CHELATION INJECTOR and KAGURA OLEUM LANTERN (which need a rads counter) are replaced by OLEUM SLURRY COOLANT FLUSH and ONMYO OLEUM HEAT-SINK FINS. Both are Oleum items that use the existing vent mechanics, so the Oleum count stays at 4.
''')
w('## EP logic (unchanged from v1)\n')
w('''- **Mass hardware:** EP is about 2.5 x sqrt(t), rounded half-up. This is a least-squares fit over the 21 baseline items with a mass, RMS error 0.57.
- **Shields:** EP is about 3 x sqrt(t).
- **Electronics:** EP = sustained kW. The ECM and SENSOR suites match this exactly. When an item has both mass and draw, EP = max(mass term, kW).
- **Energy per shot or use** is paid as HEAT, not EP.
- **Frames:** (HP - 87.5) / 12.5.
- **Vehicles:** 2 + HP/20.
- **Reactors:** ST/HP% / 15.
- **Thrusters:** MOVE% / 12.
- **Targeting:** 1 - 1.5 x ACC-ALL.

Cross-check against 3/51's design-point economy (p.25): ST/HP +50, DR +30, Handling +1 and Move +5 each cost 1 DP. This is the same kind of trade-table that FORGE's EP expresses.
''')
facs=[('Empire','Core Empire (TL8): antiquated, reliable, slow, hardy'),('Rebel','Rebels (TL8): performance, firepower, fragility'),('Reman','Remans (TL10): bushido tech that is overpowered but beatable')]
n=0
for f,title in facs:
  w(f'## {title}\n')
  for x,l in zip(I,L):
    if x['fac']!=f: continue
    n+=1
    w(f'### {n}. {x["name"]} ({x["fac"]}, {x["cat"]}, EP {x["ep"]})\n')
    w('```\n'+l+'\n```\n')
    if 'tiers' in x: w('TIER entry:\n```\n'+json.dumps(x['name'])+':'+json.dumps(x['tiers'],ensure_ascii=False)+'\n```\n')
    w(f'- **Design intent:** {x["intent"]}')
    w(f'- **Balance:** {x["note"]}')
    w(f'- **EP logic:** {x["eplogic"]}')
    if x.get('deriv'): w(f'- **Derivation:** {x["deriv"]}')
    w(f'- **Revision 2:** {CHG.get(x["name"],"Accepted by Ryuji; unchanged.")}')
    w('')
w('## RAW only (paste-ready, 50 lines)\n')
w('```\n'+'\n'.join(L)+'\n```\n')
w('### TIER entries (merge into the `let TIER={...}` object)\n')
w('```\n'+tier_js+'\n```\n')
w('''## Sources

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
''')
open('../concepts-batch2.md','w').write('\n'.join(o))
print(n,len(o))
