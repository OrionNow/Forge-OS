import pickle,sys
sys.path.insert(0,'.')
from items import I
L,tier_js,errs,fc,cc=pickle.load(open('out.pkl','rb'))
o=[]
w=o.append
w('# FORGE-OS Catalog Concepts, Batch 2 (50 concepts)\n')
w('Text and ideas only. Nothing in `terminal.html` was edited. Every line uses the 13-field RAW format `CAT|NAME|EP|STATS|CLASS|MASS|LABEL|LABEL-VALUE|ROLE|FLAVOR|TWO-HANDED|TL|EXPERIMENTAL`. One thing to know: the v5.0.1 parser (`rebuildDB`) also reads an optional 14th field, `SHOULDER-FIREABLE` (`p[13]`), and every baseline line carries it. 13-field lines load with shoulder-fire off, the same as the accepted pass-5 lines. Add `|1` to the end of any launcher that should be shoulder-fireable.\n')
w('Validation (script): **PASS**. All 50 lines have 13 fields, CAT is in ADUFTRG, EP is an integer, there are no backticks or `<>`, every STATS token is LABEL:VALUE with no commas, frames carry all six frame tokens and no extra token starts with a frame-token name, chassis MASS is [DATA_NOT_FOUND], no names collide with the baseline (47) or pass 5 (14), AVG arithmetic is correct, (5) appears only on Reman items, Empire/Rebel divisors are (3)/(4), every RNG max is 750 or less, and no per-turn heat cost is 3 or less. The lines and TIER entries were also parsed with the terminal\'s own `rebuildDB`, `statsOK`, `frameOK` and `safeField` logic in Node: 0 rejects.\n')
w('## EP logic (inferred from the baseline before any EP was set)\n')
w('''EP stands for the weight and energy of mounting an item. The baseline follows three regularities, and every new EP below cites the one it uses.

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
''')
w('## Damage logic (how DMG, divisor, RNG and ACC were derived)\n')
w('''**Kinetic rounds** use Douglas Cole\'s formula from Pyramid, "Interior and Terminal Ballistics for GURPS": damage points = sqrt(KE^1.04 / Xsect^0.314) / 13.3926, with KE in joules and Xsect as the penetrator cross-section in m^2. Points are converted to `6dxM` with M = points / 21. The formula reproduces 9mm = 2d+2 (9.4 points), which is its own anchor.

**Range** uses Samuel Baughn\'s simplified GURPS formulas: 1/2D (yd) = sqrt(m) x v^1.5 x 2.5 / calibre(mm), and Max = sqrt(1/2D) x 120 + 1/2D. Dividing the result by 15 lands on the baseline\'s lower-scale numbers.

**Baseline back-check.** The projectile assumptions are mine unless marked. The 30mm mass and velocity come from Wikipedia\'s GAU-8 page.

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

**Beams.** No verified published formula converts beam energy to damage in a way I could check. I applied Cole\'s energy term to the shot energy with the beam spot as Xsect, and I mark that as an **extrapolation** wherever it is used.

**Melee.** No published GURPS rule scales mech-size vibroblades. The baseline fits **dice = 79 + 13 x ln(mass t)**: 0.3/0.9/2.1 t give 63/78/89 against 64/76/88, and the 1.8 t Tachi gives 87 against 84. Notation stays no-multiplier (`84d(3)`, AVG = dice x 3.5).

**ACC** is extrapolated from the baseline pattern: long guns 4, rockets 5, high-volume pods 6. Lasers and blasters get 6, following Ultra-Tech\'s high-accuracy beams. Indirect or spread weapons get 2-3.
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
    if 'tiers' in x:
      import json
      w('TIER entry:\n```\n'+json.dumps(x['name'])+':'+json.dumps(x['tiers'],ensure_ascii=False)+'\n```\n')
    w(f'- **Design intent:** {x["intent"]}')
    w(f'- **Balance:** {x["note"]}')
    w(f'- **EP logic:** {x["eplogic"]}')
    if x.get('deriv'): w(f'- **Derivation:** {x["deriv"]}')
    w('')
w('## RAW only (paste-ready, 50 lines)\n')
w('```\n'+'\n'.join(L)+'\n```\n')
w('### TIER entries (merge into the `let TIER={...}` object)\n')
w('```\n'+tier_js+'\n```\n')
w('''## Sources

- Douglas H. Cole, "Interior and Terminal Ballistics for GURPS," Pyramid (2002). Damage formula, AP divisors, sabot rescaling: https://www.sjgames.com/pyramid/sample.html?id=2794
- Steve Jackson Games forums, "Kinetic Energy to GURPS damage" (restates Cole\'s formula): https://forums.sjgames.com/showthread.php?t=76334
- Samuel Baughn, "Simplified Ballistic Formulas for GURPS" (1/2D and Max range formulas): http://samuelbaughn.blogspot.com/2021/04/simplified-ballistic-formulas-for-gurps.html
- Gaming Ballistic, "GURPS Ballistics - The 1/2D Range" (GURPS 1/2D table values, including 12G shot at 40 yd): https://gamingballistic.com/2013/08/08/gurps-ballistics-12d-range/
- GURPS High-Tech artillery chapter excerpt (indirect fire at -10; Forward Observer margin): https://www.sjgames.com/gurps/books/High-Tech/artillery.pdf
- RPG.net wiki, "GURPS Weapons 35" (fan-transcribed artillery table: HEAT 6dx8(10) and 6dx9(10), APFSDS (2), ZU-23 APDS 7dx3(2)): https://wiki.rpg.net/index.php/GURPS_Weapons_35
- Enraged Eggplant, "Everything About Ultra-Tech Weapons" (UT lasers (2) and the smoke/fog penalty; TL10 blasters (5) burning surge, recoilless, shorter range; plasma guns (2); plasma lances (10); flamers no divisor; EM guns default (3)): https://enragedeggplant.blogspot.com/2022/03/everything-about-ultra-tech-weapons.html
- r/gurps, "Gauss Rifle in APHD (TL11)" (hyperdense (5) replaces the EM default (3); cites UT p.152): https://www.reddit.com/r/gurps/comments/fyunk2/gauss_rifle_in_aphd_tl11/
- Wikipedia, "GAU-8 Avenger" (PGU-14/B about 395 g at 1,010 m/s, used for the 30mm back-check): https://en.wikipedia.org/wiki/GAU-8_Avenger

I did not read the GURPS High-Tech, Ultra-Tech or Vehicles books themselves. Ultra-Tech conventions are cited through the secondary sources above. Everything marked "extrapolated" was fitted to the baseline, not taken from a published rule.
''')
open('../concepts-batch2.md','w').write('\n'.join(o))
print(n)
