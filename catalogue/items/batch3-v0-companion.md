# FORGE-OS batch 3 v0: readable companion

One row per item, same order as `batch3-v0-raw.txt`. The RAW line is authoritative; key stats are abridged. Status: **v0, awaiting Ryuji review.** Oleum-curve rules are in `../notes/oleum-reactor-pass.md`; derivations are in `../notes/batch3-design-notes.md`.


## Reactors (R)

| Name | Faction | EP | TL | Key stats | Trait | GURPS damage cite |
|---|---|---|---|---|---|---|
| COLD FUSION OLEUM REACTOR (CFOR) [EXP] | Core Empire | 4 | 8 | `ST/HP:+60% HEAT:12 VENT:2 RAD:15/sortie` | Oleum curve; CLEAN SCRAM (no MOVE penalty); RAD 15/sortie | n/a (reactor) |
| OLEUM BASTION PILE [EXP] | Core Empire | 5 | 8 | `ST/HP:+70% HEAT:16 VENT:3 HND:-1 SR:+1 RAD:25/sortie` | Oleum curve; +2 Stability while blooming; SLOW-RODS scram lands a turn late | n/a |
| PEGASUS FAILSAFE TWIN CORE | Core Empire | 3 | 8 | `ST/HP:+45% HEAT:10 VENT:2` | FAILSAFE: first redline of the sortie drops to half cap, cap -3 after | n/a |
| HELLION BLOOM-BURNER [EXP] | Crow Republic | 3 | 8 | `ST/HP:+45% HEAT:10 VENT:2 HND:+1 SR:-1 RAD:25/sortie` | Oleum curve; double SURGE (+2 steps); RUNAWAY 6dx10(3) to Core on a bad fail | RUNAWAY 6dx10(3): same figure as the HORNET cook-off (batch 2), i.e. a 100mm HEMP-class blast, UT p.155 |
| DRIP-FEED OLEUM CELL [EXP] | Crow Republic | 1 | 8 | `ST/HP:+25% HEAT:8 VENT:3 RAD:25/sortie` | Oleum curve; LEAKY: starts every sortie already blooming | n/a |
| FLASH-BOILER CELL | Crow Republic | 2 | 8 | `ST/HP:+30% HEAT:8 VENT:1 HND:+1 SR:-1` | BOIL-OFF: a successful vent gives +20% MOVE this turn | n/a |
| MIZUCHI OLEUM SPIRIT CORE [EXP] | Reman | 5 | 10 | `ST/HP:+65% HEAT:12 VENT:1 RAD:10/sortie` | Oleum curve; bloom discount -2; RAD halved; BLUE-GLOW +1 to be hit while hot | n/a |
| DIVINE ENGINE LIGHT REACTOR (DELR) [EXP] | Reman | 5 | 10 | `ST/HP:+55% HEAT:11 VENT:1` | REST: once per sortie a still turn sets HEAT to 0, no roll | n/a |

## Thrusters (T)

| Name | Faction | EP | TL | Key stats | Trait | GURPS damage cite |
|---|---|---|---|---|---|---|
| LINE-HOLDER REVERSE THRUSTERS | Core Empire | 2 | 8 | `MOVE:+15% SR:+1` | BACKSTOP: +2 to first Stability check each turn | n/a |
| CONVOY THRUSTER HARNESS | Core Empire | 2 | 8 | `MOVE:+10%` | ESCORT: an adjacent ally gets +20% MOVE | n/a |
| HELLION WAKE STACK [EXP] | Crow Republic | 2 | 8 | `MOVE:+10% HND:+1 SR:-1` | WAKE: +40% MOVE and no burn heat while the Oleum core blooms | n/a |
| SPACEBORN BURST JETS | Crow Republic | 1 | 8 | `MOVE:+15% SR:-1` | SPACEBORN: free 9 yd burst flight for +1 HEAT, land or fall | n/a |
| SUISEN WATER-STRIDER JETS | Reman | 3 | 10 | `MOVE:+25%` | STRIDE over terrain/water; SURE-FOOT: failed Stability = slide, not knockdown | n/a |
| TSUBAME RETURN THRUSTERS [EXP] | Reman | 3 | 10 | `MOVE:+20% HND:+1` | TSUBAME: free 1-hex step away after a melee attack | n/a |

## Frames (F)

| Name | Faction | EP | TL | Key stats | Trait | GURPS damage cite |
|---|---|---|---|---|---|---|
| GREAT WHITE [EXP] | Core Empire | 7 | 8 | `ST/HP:160 DR:550/275 MOVE:9L/18S SM:+6 HND:+2 SR:2` | OLEUM-PLUMBED: halves all Oleum RAD; heated seat | n/a |
| MALWARE (HAMMER HEAD) [EXP] | Faction open (Roll20 silent); filed Crow Republic | 6 | 8 | `ST/HP:145 DR:450/225 MOVE:10L/20S SM:+6 HND:+2 SR:2` | CATALYTIC-INFUSOR: grappled target takes HEAT x20 burn (3) each turn; +2 grapple | HEAT x20(3): 3/51 beam multiplier family (x20, p.27); peaks at 240-320, about one vibroblade |
| WHALE [EXP] | Faction open (Roll20 silent); filed Core Empire | 12 | 9 | `ST/HP:240 DR:850/425 MOVE:4L/8S SM:+8 HND:-1 SR:4` | TITANIC-FORCE: unarmed/grapple 100d(3), Stability -2; cannot hold a shield | 100d(3) = Roll20 Colossal Talon; melee fit 79+13 ln(t) gives 100d at ~5 t of fist |
| ONI UNION [EXP] | Core Empire | 6 | 9 | `ST/HP:155 DR:550/275 MOVE:10L/20S SM:+6 HND:+3 SR:2` | HYBRID-LINEAGE: Reman parts lose High Maintenance and LOGISTICS penalties | n/a |
| AKEDA ONI [EXP] | Reman | 7 | 10 | `ST/HP:170 DR:650/325 MOVE:11L/22S SM:+6 HND:+3 SR:2` | YURAGI: when hot, ranged attacks vs it -1 and adjacent enemies cannot Retreat | n/a |
| REMORA [EXP] | Crow Republic | 2 | 8 | `ST/HP:100 DR:300/150 MOVE:12L/24S SM:+5 HND:+3 SR:1` | SYMBIOSIS: latches onto a larger ally, -2 to be hit, lends SENSORS/EW, shares heat gain | n/a |

## Weapons (A)

| Name | Faction | EP | TL | Key stats | Trait | GURPS damage cite |
|---|---|---|---|---|---|---|
| OLEUM PLASMA LANCE [EXP] | Core Empire | 4 | 9 | `ROF:1 DMG:6dx20(5) ACC:3 RNG:20/100 HEAT:+3/shot` | BLAST 1/3 damage within 1 hex; Oleum core only | 3/51 Plasma Lance 6dx20(10) burn exp (p.27); (10) halved by laminate = (5), TL9 +1 step over the 120mm Rocket (4) |
| HERALD 20mm GAUSS CARBINE | Core Empire | 4 | 9 | `ROF:1 DMG:6dx20(4) ACC:4 RNG:180/600 AMMO:10(1) HEAT:+1/shot` | OVERPEN: excess damage hits the next unit in line within 10 yd | Overseer Weapon List, Gauss 20mm 6dx20(3) (Mecha p.67); UT Gauss guns p.141; TL9 +1 step over the 30mm (3) |
| DIVINE DRAGON'S BREATH [EXP] | Reman | 5 | 10 | `ROF:1 DMG:6dx15(5) ACC:3 RNG:40/120 HEAT:+4/shot` | LINE: every unit in a 40 yd line; PERSIST: burning line adds target heat | 3/51 Plasma Lance 6dx20 (p.27) x3/4 for line spread = 6dx15; (5) Reman TL10; canon Roll20 10dx20(3) range 120 kept as range only |
| AUTOPOD [EXP] | Crow Republic | 3 | 8 | `ROF:1 DMG:6dx8(4) RNG:75/300 AMMO:6(2)` | AUTONOMOUS: free reaction shot at whoever ends a move in range, no attack roll | UT HEMP 64mm 6dx8(10) (p.155) to FORGE (4), level with the core 60mm pod |
| DIVINE DAIMYO BUSTER BLADE [EXP] | Reman | 3 | 10 | `ROF:X DMG:76d(5)` | AURA-GUARD: blocks as a DR 100 / HP 250 shield | Canon Medium 76d; UT superfine vibroblade (5) (p.164), which 3/51 p.27 names for giant blades |

## Gear (U)

| Name | Faction | EP | TL | Key stats | Trait | GURPS damage cite |
|---|---|---|---|---|---|---|
| GLINTUS COCKPIT COMFORT KIT | Core Empire | 1 | 8 | `` | +1 to SURGE/Stun HT rolls; no cold penalties; seat warmer, two cupholders | n/a |
| ARMAMENT REDUNDANCY RIG | Crow Republic | 2 | 8 | `` | Once per full repair, a weapon survives its own destruction | n/a |
| EXPLOSIVE VENTS [EXP] | Crow Republic | 2 | 8 | `` | Venting out of the danger zone or scramming blasts 8dx2(3) and +2 target heat at 1 hex | 3/51 Light Missile Pod linked 8dx2 cr ex (p.27) |
