# Batch 3 v1 design notes: unique traits

Hikari, Catalog Ideator. Status: **v1, Ryuji round 2.** Current lines: `../items/batch3-v1-raw.txt`; v0 is kept for diff. There are 28 lines: 8 reactors (5 Oleum), 6 thrusters, 6 frames, 5 weapons and 3 gear. Text only, and nothing in `terminal.html`, `versions/` or program files was touched.

## The Overseer's ask
"Implement more nonstandard effects to gear like what was present in the roll20 where some frames have unique traits ... have the damage values line up with their equivalent in the gurps rulebooks ... do a pass on oleum reactors ... theorycraft some unique traits for the reactors, thrusters, and frames that are a bit different than just stat tweaks."

## Trait philosophy
1. **One signature trait per item, two at most.** Each one reads like a Roll20 subsystem line ("One Man's Trash", "A Coffin for a Friend"). If a trait needs a paragraph, it is too big.
2. **Hook into a roll or state the sheet already tracks:** heat band (cold, danger zone, redline), the Stability check, the Engineering vent roll, grapples, Retreat, Dodge, RAD, and repair. That is why most traits are triggers ("when you vent...", "while blooming...") and not flat bonuses.
3. **Stat tokens wherever the sheet can carry them.** HEAT, VENT, ST/HP%, MOVE%, HND and SR are live, so the base numbers sit there. The conditional part goes into a named display token (`WAKE:`, `YURAGI:`, `FAILSAFE:` and so on). **No conditional key begins with a live key** (HEAT, SR, DR, MOVE, HND, ST/HP, VENT), because the sheet's `(?:^| )KEY:` parser would read it. I checked every key by script.
4. **Faction voice through mechanics:**
   - **Core Empire:** forgiving and hardy. FAILSAFE, BACKSTOP, ESCORT, CLEAN SCRAM, OLEUM-PLUMBED.
   - **Crow Republic:** high output with a way to blow up (Icarus). RUNAWAY, LEAKY, the Remora's latch heat, EXPLOSIVE VENTS hitting allies.
   - **Reman:** no drawbacks, but each item has a readable counter. YURAGI only works when the Oni is hot, and hot means .75 DR. The DELR's REST costs a whole still turn. (v1: the Mizuchi's +1-to-hit glow was removed as an off-brand drawback.)
5. **Canon first.** Where the Roll20 journal already names a system, the item uses that name and intent:
   - CFOR, DELR, Great White, Malware (Hammer Head), Whale, Oni Union, Akeda Oni, Mother Hen, Pegasus and Glintus Minus.
   - Hellion, from "The Hellion Rebellion".
   - Divine Dragon's Breath and Divine Daimyo Buster Blade.
   - The Lancer-sheet systems: Autopod, Armament Redundancy, Explosive Vents, Spaceborn, Symbiosis (Goblin), and Catalytic Infusor and Marrow Anchors (from Reika's Hammer Head).

   The `work/roll20/raw_new.txt` drafts (Spearfish, Gupp, Uno Fish, Dozy, Fly-Fin, Grav-Seat, Recoil Arms and so on) are **not** duplicated; they stay deferred.
6. **Some imbalance is allowed, with a consistent logic.** EP follows the batch-2 rules plus about +1 EP for a strong trait:
   - Reactors: ST/HP% / 15.
   - Thrusters: MOVE% / 12.
   - Frames: (ST/HP - 87.5) / 12.5.
   - Weapons: 2.5 x sqrt(t).

## GURPS damage derivations (weapons and damaging traits)
Divisors follow the TL band ruling: TL8 is the core base, TL9 sits 0-2 steps above the comparable core item, TL10 sits 1-3 steps above it, and the ladder caps at (6). Ranges use the lower scale.

| Item | GURPS source | Raw GURPS | FORGE | Band check |
|---|---|---|---|---|
| OLEUM PLASMA LANCE | Pyramid 3/51 p.27, Plasma Lance | 6dx20(10) burn exp, Acc 8, 20/200 | 6dx20(5), ACC 3, RNG 20/100 | Laminate doubles DR against plasma (3/51 pp.26-27), so (10) acts as (5). TL9 is +1 step over the 120mm ROCKET CANNON (4). The "exp" becomes BLAST at 1/3 damage within 1 hex (GURPS explosions fall off by 3 x distance in yards, B414; Campaigns is not in `gurps/`). |
| HERALD 20mm GAUSS CARBINE | Overseer's Weapon List, Gauss 20mm 6dx20(3) Acc 18, 5,100/15,600 (Mecha p.67); UT Gauss guns p.141 | 6dx20(3) | 6dx20(4), ACC 4, RNG 180/600, AMMO 5(1), HEAT +2/shot (v1) | TL9 is +1 step over the 30mm AUTOCANNON (3). Range is trimmed under the SKYFALL's 200/750 so it does not out-range the railgun. OVERPEN stands in for gauss overpenetration. |
| DIVINE DRAGON'S BREATH | 3/51 p.27 Plasma Lance (Pulver: "a hybrid of flamer and fusion gun"); UT Flamers p.127 for the line behavior | 6dx20(10) | 6dx15(5), RNG 40/120 | A line hits every target, so damage is cut to 3/4 (6dx15). TL10 Reman (5) is +1 step over the 120mm (4). The canon Roll20 entry is 10dx20(3) at range 120. Only the 120 range is kept. **Damage pending the Overseer:** canon 10dx20(3) or GURPS-derived 6dx15(5); Ryuji backs 6dx15(5). |
| AUTOPOD | UT HEMP Warhead Table p.155, 64mm | 6dx8(10) cr inc | 6dx8(4) | (10) becomes (4) under the batch-2 laminate rule, level with the core 60mm MISSILE POD (4), TL8. v1: rolls Gunnery-4 with a random hit location, and a mech may carry only one AUTONOMOUS item. |
| DIVINE DAIMYO BUSTER BLADE | UT superfine vibroblade (5), p.164; 3/51 p.27 says giant blades need superfine vibro or monomolecular edges | n/a (melee) | 76d(5), 0.8 t, EP 4 (v1) | The dice are the canon "Medium 76d" from the Roll20 weapon list, which matches the baseline fit 79 + 13 ln(t) at about 0.8 t. TL10 Reman (5) is +2 steps over the VIBROBLADE (MEDIUM) (3). The AURA-GUARD block uses the canon HP 250 and DR 100. Canon divisor is **76d(6)** (Roll20 l.318). **Divisor pending the Overseer:** (5) or (6); both are in band. |
| EXPLOSIVE VENTS | 3/51 p.27 Light Missile Pod, linked 8dx2 cr ex | 8dx2 | 8dx2(3) burn | A small splash. The real bite is +2 target heat, capped below half cap like the SUNSPIKE. The canon Lancer text is "2 heat and 2 burn". |
| WHALE (TITANIC-FORCE) | Roll20 weapon list, Colossal Talon 100d(3) | n/a | 100d(3) | The fit 79 + 13 ln(t) gives 100d at about 5 t of fist, which is plausible for an SM +8 hand. TL9 at (3) is 0 steps. |
| MALWARE (CATALYTIC-INFUSOR) | No GURPS equivalent (a trait, not a weapon) | n/a | HEAT x20 burn (3), max 240 | Capped at 240 (v1), about one medium vibroblade per turn. The target rolls to break free at the start of each of its turns. |
| HELLION RUNAWAY | UT HEMP 40mm 6dx5 (p.155); half the batch-2 HORNET cook-off | n/a | 6dx5(3) to its own Core (v1) | Cut in v1 so one bad surge cannot nearly kill its own Core. |

## Item-by-item intent (short)
**Reactors**
- **CFOR:** canon "operate indefinitely". The Imperial take on the Oleum curve is reliability: a clean scram. v1 sets ST/HP to +50% (r1 #9 option A) so it trades HP for the scram against the OLEUM VIS CORE; the Vis Core is unchanged.
- **BASTION PILE:** a big cap means long blooms. It is a gun-line anchor, and its rods are slow.
- **PEGASUS FAILSAFE:** a once-per-sortie save from redline. The once-per-sortie limit is the whole cost (v1). Hikari's cupholder lives here.
- **HELLION BLOOM-BURNER:** a double surge at high risk. The second surge costs +50 RAD.
- **DRIP-FEED:** cheap, and always already blooming.
- **FLASH-BOILER:** venting becomes movement on your next turn. It is a non-Oleum Rebel answer to heat.
- **MIZUCHI:** the cleanest Oleum core: halved RAD at VENT 1. The glow is flavor only.
- **DELR:** canon "recharges from rest", scaled to one still turn per sortie.

**Thrusters**
- BACKSTOP and SURE-FOOT both hang off the Stability check.
- ESCORT and SYMBIOSIS are the two "team" traits.
- WAKE ties a thruster to the Oleum bloom (+40% MOVE only).
- SPACEBORN is the canon Lancer talent.
- TSUBAME gives a duelist a free disengage.

**Frames**
- Great White is the Oleum flagship.
- The Hammer Head is a grapple-and-cook frame.
- The Whale is a walking fortress whose hands are its weapons.
- The Oni Union makes captured Reman parts painless.
- The Akeda Oni is a hot-blooded duelist with a shimmer aura (Hephaestus "Genghis" precedent).
- The Remora is a parasite light frame (Goblin precedent). v1 replaces the shared skill and heat with +1 HEAT per turn latched.

## Hikari touches (within reason)
- The Pegasus cupholder.
- The Great White's heated seat, which comes free with the CFOR plumbing.
- The GLINTUS COCKPIT COMFORT KIT: seat warmer, two cupholders and a blanket clip, with a real rules hook (+1 to surge and Stun HT rolls, no cold penalties on Glintus Minus at -35 F).

## Open for the Overseer and Ryuji
1. **Factions:** the Roll20 journal is silent for the Malware (filed Crow Republic) and the Whale (filed Core Empire).
2. **Dragon's Breath damage:** the GURPS-derived 6dx15(5) differs from the canon 10dx20(3). Which one wins? (Ryuji backs 6dx15(5).)
3. **Daimyo Buster Blade divisor:** (5) or canon (6).
4. **Oleum-curve questions:** see `oleum-reactor-pass.md`.
5. **Validator (v1):** 28 lines, 0 real rejects. The only rejects are the 3 tier names, which are expected because this file has no tiered items.

## v1 fix map (Ryuji round 1, `../reviews/review-batch3-r1.md`)
| # | Item | v0 | v1 |
|---|---|---|---|
| 1 | All reactors | SCRAM was Oleum-only | Every reactor may SCRAM at redline. SURGE, bloom and Overflow stay Oleum-only. CFOR keeps a clean scram (no MOVE penalty). |
| 2 | Oleum curve | Surge HT at -1 per earlier surge this sortie | Flat HT-2 per surge, no counter |
| 3 | HELLION BLOOM-BURNER | Each surge +25 RAD; RUNAWAY 6dx10(3) | Second surge +50 RAD; RUNAWAY 6dx5(3) to its own Core |
| 4 | MALWARE (HAMMER HEAD) | HEAT x20, uncapped, no escape | Max 240; the target rolls to break free at the start of each of its turns |
| 5 | AUTOPOD | No attack roll, no location, no limit | Gunnery-4, random hit location, one AUTONOMOUS item per mech |
| 6 | HERALD 20mm GAUSS | AMMO 10(1), HEAT +1/shot | AMMO 5(1) SPARE 1, HEAT +2/shot; still 6dx20(4) |
| 7 | DIVINE DRAGON'S BREATH | PERSIST uncapped | Target heat can't rise to half cap or above; lines don't stack; lasts to the end of your next turn; 6dx15(5) pending the Overseer |
| 8 | REMORA | Host uses your skill; you mirror host heat | +1 HEAT per turn latched |
| 9 | CFOR | ST/HP +60% | ST/HP +50% (option A chosen; the OLEUM VIS CORE is unchanged) |
| 10 | MIZUCHI | +1 to be hit; Overflow -2 | +1 to be hit removed; +3 to detect kept as flavor; standard Overflow -1 |
| 11 | DIVINE DAIMYO BUSTER BLADE | 3 EP | 4 EP; (5) kept, (6) canon pending the Overseer |
| 12 | PEGASUS FAILSAFE | Cap -3 for the rest of the sortie | Clause dropped |
| 13 | FLASH-BOILER CELL | +20% MOVE this turn | +20% MOVE on your next turn |
| 14 | HELLION WAKE STACK | +40% MOVE and no burn HEAT | +40% MOVE only |
| nit | ARMAMENT REDUNDANCY RIG | Once per full repair | Once per sortie (Ryuji's stated preference) |
