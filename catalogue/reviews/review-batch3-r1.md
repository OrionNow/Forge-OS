# Ryuji: batch 3 v0, round 1

Inputs: `items/batch3-v0-raw.txt` (28 lines), `items/batch3-v0-companion.md`, `notes/oleum-reactor-pass.md`, `notes/batch3-design-notes.md`. Standing rulings applied. Scores are B/S/U/F = mean; 7.0 or higher passes.

## Verdict: REVISE (round 2 after must-fixes)
The ask is met: every reactor, thruster and frame has a non-stat trait, and the Oleum curve works without code. Six items fall below 7, and the curve gives Oleum a free heat exit that standard reactors lack. Fix the list below and most of this ships.

## Must-fix (one-line fixes)
1. **Standard reactors need SCRAM.** As written, Oleum SCRAM drops a cap-12 core from 12 to 5 in one action. A standard vent sheds 2-3, so Oleum strictly wins on heat. Fix: give every reactor SCRAM at redline (HEAT drops to just below half cap, no attacks, MOVE halved) and keep SURGE, bloom and Overflow Oleum-only. CFOR's no-MOVE-penalty scram stays as its edge.
2. **Surge counter is scope creep.** "HT at -1 per earlier surge this sortie" adds a per-sortie counter. Fix: flat HT-2 per surge, no counter.
3. **Hellion double surge.** Two surges a turn take a (3) beam to (5) and roughly triple its output, and RUNAWAY can nearly kill your own Core in one turn. Fix: keep the double surge but make the second one cost +50 RAD, and make RUNAWAY 6dx5(3) to the Core instead of 6dx10(3).
4. **Malware CATALYTIC-INFUSOR** scales with the reactor cap, so a Bastion's HEAT 16 gives 320 burn per turn with no roll. It also rewards parking at redline. Fix: burn = HEAT×20, max 240, and the target may roll to break free at the start of each of its turns.
5. **Autopod** gives a free attack every round with no roll, has no hit location, and nothing stops you mounting three. Fix: it rolls Gunnery-4 with a random hit location, and only one AUTONOMOUS item per mech.
6. **Herald 20mm Gauss** dominates the 90mm Heavy Rifle. It hits nearly as hard (295 vs 306 through DR 500) for 1 EP less, with 20 shots against 9, longer range, and OVERPEN on top. Fix: AMMO:5(1) SPARE:1 and HEAT:+2/shot. Keep the canon 6dx20 damage and the in-band TL9 (4).
7. **Dragon's Breath PERSIST** has no cap on the target heat it adds, unlike the batch-2 Sunspike rule. Its burning line is also a zone that someone has to track. Fix: add `target_HEAT_cannot_rise_to_half_cap_or_above` and make the line last only until the end of your next turn (as now), with no stacking.
8. **Remora SYMBIOSIS** has the host using your skill and you mirroring the host's heat. That is cross-sheet shared state. Fix: drop both and use "+1 HEAT per turn latched".
9. **CFOR dominates the existing OLEUM VIS CORE**: same EP, HP, HEAT and VENT, less RAD, plus a clean scram. Fix: CFOR to ST/HP:+50%, or the Vis Core gains the same scram.
10. **Mizuchi breaks the Reman ruling.** BLUE-GLOW's +1 to hit it is an off-brand drawback on Reman tech. Without that drawback, Overflow -2 plus halved RAD at VENT 1 dominates. Fix: remove the +1 to hit (keep +3 to detect as flavor) and set Overflow back to the standard -1. The halved RAD is its edge.
11. **Daimyo Buster Blade** (3 EP) outdamages the Naginata (3 EP) and also carries a shield with DR 100 and HP 250. Fix: 4 EP. Also note that canon is 76d(6). The (5) is in band, so the choice between (5) and (6) is the Overseer's.
12. **Pegasus FAILSAFE** "HEAT cap -3 for the rest of the sortie" changes the cap mid-sortie, and the sheet can't track that. Fix: drop that clause; once per sortie is the cost.
13. **Flash-Boiler BOIL-OFF** is dead text, because a vent is a full action and you don't move that turn. Fix: "+20% MOVE on your next turn".
14. **Hellion Wake Stack** "no burn HEAT" is undefined. If it covers Wings or boosters, it makes them free in bloom. Fix: delete the clause and keep +40% MOVE.

## Scores
| Item | B/S/U/F = mean | Verdict |
|---|---|---|
| CFOR | 6/9/8/8 = 7.75 | pass after #9 |
| Oleum Bastion Pile | 7/8/7/8 = 7.5 | pass |
| Pegasus Failsafe | 7/8/6/7 = 7.0 | pass, needs #12 |
| Hellion Bloom-Burner | 5/9/6/7 = 6.75 | **revise** (#2, #3) |
| Drip-Feed Oleum Cell | 7/8/7/7 = 7.25 | pass |
| Flash-Boiler Cell | 7/8/7/5 = 6.75 | **revise** (#13) |
| Mizuchi Spirit Core | 5/8/7/8 = 7.0 | pass, needs #10 |
| DELR | 7/9/8/8 = 8.0 | pass |
| Line-Holder Reverse | 8/8/8/8 = 8.0 | pass |
| Convoy Harness | 7/8/7/7 = 7.25 | pass |
| Hellion Wake Stack | 6/8/6/7 = 6.75 | **revise** (#14) |
| Spaceborn Burst Jets | 7/8/7/7 = 7.25 | pass |
| Suisen Water-Strider | 7/8/8/8 = 7.75 | pass |
| Tsubame Return | 8/8/8/8 = 8.0 | pass |
| Great White | 7/9/8/8 = 8.0 | pass |
| Malware | 5/8/6/7 = 6.5 | **revise** (#4) |
| Whale | 7/9/7/8 = 7.75 | pass |
| Oni Union | 8/9/8/7 = 8.0 | pass |
| Akeda Oni | 7/9/8/8 = 8.0 | pass |
| Remora | 7/8/4/6 = 6.25 | **revise** (#8) |
| Oleum Plasma Lance | 7/8/8/8 = 7.75 | pass |
| Herald 20mm Gauss | 5/8/7/8 = 7.0 | pass, needs #6 |
| Dragon's Breath | 6/9/6/7 = 7.0 | pass, needs #7 |
| Autopod | 4/8/5/6 = 5.75 | **revise** (#5) |
| Daimyo Buster Blade | 5/9/8/8 = 7.5 | pass, needs #11 |
| Glintus Comfort Kit | 8/9/9/8 = 8.5 | pass |
| Armament Redundancy Rig | 7/8/7/8 = 7.5 | pass (prefer "once per sortie" over "per full repair") |
| Explosive Vents | 7/8/7/6 = 7.0 | pass. 8dx2 (avg 56) can't beat mech DR, so in practice it's a heat AoE |

Six items revise. Every TL9/TL10 divisor is in band, including the Plasma Lance (5) over the 120mm (4), the Herald (4) over the 30mm (3), the Dragon (5) and the Daimyo (5). None takes a TL EP surcharge.

## Cite and damage spot-checks
- Herald 6dx20: OK. Roll20 l.343 lists the Gauss 20mm at 6dx20(3) (Mecha p.67), and (4) is TL9 +1.
- Dragon's Breath: canon (Roll20 l.327) is **10dx20(3)**, average 700, which is 533 through DR 500 to every unit in the line. Hikari's 6dx15(5) is 3/51's Plasma Lance 6dx20 ×3/4 (arithmetic OK), giving 215 through. The Overseer's own canon is 2.5× harder. Overseer decision: canon or GURPS-derived. I back 6dx15(5); canon would one-shot a lined-up lance.
- Plasma Lance: 3/51 l.1650, 6dx20(10). OK.
- Autopod: UT HEMP 6dx8(10), p.155. OK.
- Explosive Vents: 3/51 l.1644, Light Missile Pod linked 8dx2 cr ex. OK.
- Whale 100d(3): Roll20 Colossal Talon, l.328. OK.
- Daimyo 76d: Roll20 l.318 gives 76d(**6**). See #11.
- Malware ×20: no GURPS equivalent. The "beam multiplier family" is a label, not a cite. That's acceptable for a trait, but not as a damage source.
- B435 (radiation) is in Basic Set *Campaigns*, which isn't among the .txt copies, so I couldn't verify it.

## Focus answers
1. **Hellion double surge:** keep it as the Crow Republic's Icarus core, but it's too swingy as written. Use a flat HT-2 per surge with no counter, +50 RAD on the second surge, and a smaller RUNAWAY (#2, #3). Surge applies only to POWER/FUEL weapons, so autocannons don't gain from it, which caps the abuse.
2. **Malware HEAT×20:** trackable, since it reads the Malware's own HEAT. It isn't anchored to GURPS, and it's uncapped with high-cap cores. Cap it at 240 and allow a break-free roll (#4).
3. **Autopod:** a free attack with no roll, at no action cost and with no limit on how many you mount, breaks one-attack-per-turn. Add a roll, a random hit location, and a limit of one per mech (#5).
4. **Oleum curve, dominance:** sticky heat (DR stays ×0.75) roughly balances Overflow and SURGE. SCRAM is the dominant piece, because it's a guaranteed 6-7 heat dump that standard reactors can't match (#1).
   **Oleum curve, trackability:** bloom, redline, Overflow and the sticky floor all read the existing heat band, so they're fine. RAD at +10 per turn in bloom and +25 per surge is a pilot-sheet tally the sheet doesn't count. Given Oleum's radiation lore, that's tolerable as the clock. The per-sortie surge counter is not tolerable (#2), and neither is Pegasus's cap change (#12).
5. **Standard reactors and SCRAM:** yes. Give them SCRAM without SURGE, so Oleum keeps its bloom, Overflow and SURGE identity and loses only the monopoly on a heat exit (#1).
6. **GURPS damage alignment:** good overall. The weapons match their GURPS sources, and every divisor is in band. The one real conflict is canon versus GURPS on Dragon's Breath (and the Daimyo's (6)). That's for the Overseer.

## Overseer decisions
- Dragon's Breath: canon 10dx20(3) or GURPS-derived 6dx15(5).
- Daimyo divisor: (5) or (6).
- Oleum open question 1: v0 applies Overflow to all POWER/FUEL gear. I'd keep that, since it's simplest.
