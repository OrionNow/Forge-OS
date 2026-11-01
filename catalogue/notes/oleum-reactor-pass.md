# Oleum reactor pass (batch 3 v1)

Hikari's proposal for the Overseer's ask: Oleum reactors get their own danger-zone and redline behavior. Text only; nothing in `terminal.html` changes. Status: **v1, Ryuji round 2.** v1 changes (Ryuji r1): every reactor now has SCRAM; the surge roll is a flat HT-2; Mizuchi Overflow is back to -1; CFOR is ST/HP +50%.

> **DEPENDENCY: pilot rad tracker (flagged; don't build on it).** Every Oleum RAD cost in this pass (per-sortie RAD, +10 per turn in bloom, +25 or +50 per surge, RAD halving) depends on the pilot rad tracker, which the Overseer removed from the UI in v5.2. Until a tracker returns, RAD is GM bookkeeping at most. The rest of the curve still works without it: bloom, sticky heat, Overflow, the SURGE HT-2 roll and SCRAM all read the heat track. Without RAD, the costs that remain on the Oleum side are sticky heat (DR x0.75) and the surge HT roll.
>
> **Batch 3 items that reference RAD:**
> - COLD FUSION OLEUM REACTOR (CFOR): `RAD:15/sortie`
> - OLEUM BASTION PILE: `RAD:25/sortie`
> - HELLION BLOOM-BURNER: `RAD:25/sortie`, and the surge costs +25 and +50 RAD
> - DRIP-FEED OLEUM CELL: `RAD:25/sortie`
> - MIZUCHI OLEUM SPIRIT CORE: `RAD:10/sortie`, and CONTAINMENT halves RAD
> - GREAT WHITE: OLEUM-PLUMBED halves RAD
>
> These batch 2 items also reference RAD: OLEUM VIS CORE, OLEUM SPIKE CELL, OLEUM PURGE VALVE (`RAD:+50_pilot`) and SHRINE-GRADE COCKPIT SHIELDING. The GLINTUS COCKPIT COMFORT KIT touches only the surge HT roll, not RAD. Batch 4 adds nothing that relies on RAD.

## Why Oleum should behave differently
The Roll20 canon (Glintus Minus handout) says Oleum-Vis is "burning hot, always retains its heat, never changes form and produces a great deal of energy", and the CFOR lets a machine "operate indefinitely". Three design hooks fall out of that:
1. **It retains heat.** Once an Oleum core is hot, it stays hot.
2. **It makes a lot of energy.** A hot Oleum core has power to spare.
3. **It never runs out; the pilot does.** The cost is radiation, as the existing OLEUM VIS CORE already logs (B435).

So a standard reactor treats the danger zone as a place to leave. An Oleum core treats it as a gear: **the bloom**. You ride it, and you pay in rads.

## SCRAM (every reactor, v1)
Any reactor at redline may SCRAM at the start of a turn. HEAT falls to the highest value below half cap (cap 12 gives 5; cap 8 gives 3). Cost: no attacks this turn, and MOVE is halved until your next turn. Oleum cores log no RAD for that turn. An Oleum core relights by itself next turn. CFOR keeps its edge: a **clean scram** with no MOVE penalty. The Bastion pile's SLOW-RODS delays its scram by a turn.

## The Oleum curve (any reactor carrying an `OLEUM-CURVE:` token)
The sheet's standard heat effects still apply as they do today (danger zone .75DR/+1DOD/+1MOV, redline .5DR/+2DOD/+2MOV). The Oleum effects stack on top, so v0 needs **no code**.

| Heat band | Standard reactor | Oleum curve |
|---|---|---|
| **Cold** (below half cap) | Normal | Normal. Only the per-sortie RAD on the reactor line. |
| **Bloom** (half cap or more; the sheet's danger zone) | Danger-zone effects | Danger-zone effects, plus: **Sticky heat:** an Engineering vent roll cannot take HEAT below half cap; it stops there. **Overflow:** weapons and gear with LABEL POWER or FUEL cost 1 less HEAT per use (minimum 0). **Rads:** +10 RAD to the pilot for each turn that ends in bloom. |
| **Redline** (full cap) | Redline effects; may SCRAM | Redline effects; at the start of each turn the pilot may **SURGE** (Oleum only), **SCRAM** (every reactor) or ride it out. |

**SURGE (stay lit).**
- Gain: Overflow becomes -2 HEAT per use, and power- or fuel-fed attacks this turn get +1 armor-divisor step (ladder cap (6)).
- Cost: +25 RAD and a pilot HT-2 roll per surge (flat; no counter). Failure: the pilot is Stunned (the Roll20 push rule: "On failure, pilot is stunned (Health Test)").

**SCRAM** works as for every reactor (above). For an Oleum core it is the normal way out of the bloom.

**Breaking the sticky floor without a scram.** The OLEUM PURGE VALVE (reset to 0) and the OLEUM SLURRY COOLANT FLUSH (a vent roll with the flush may go below half cap) both break it. The Reman ONMYO OLEUM HEAT-SINK FINS shed heat inside the bloom but do **not** break the floor. So Imperial plumbing gets you out of the bloom, and Reman fins keep you riding it. All three existing items gain a clear job with no stat change.

## How the batch-3 Oleum reactors bend the curve
| Reactor | Faction | Twist |
|---|---|---|
| COLD FUSION OLEUM REACTOR (CFOR) | Core Empire | **Clean scram:** no MOVE penalty. Lower base RAD (15/sortie). ST/HP +50% (v1, so it no longer dominates the batch-2 OLEUM VIS CORE at +60%). |
| OLEUM BASTION PILE | Core Empire | HEAT 16, so a long bloom, with +2 to Stability checks while blooming. **Slow rods:** a scram lands at the end of your next turn. |
| HELLION BLOOM-BURNER | Crow Republic | May surge **twice** in one turn (+2 steps, HT-2 each; the first costs +25 RAD, the second +50). Failing a surge roll by 5+ is a **runaway**: 6dx5(3) to its own Core. Icarus in reactor form. |
| DRIP-FEED OLEUM CELL | Crow Republic | 1 EP and **leaky**: starts every sortie already blooming. Cheap power with no warm-up and no cold phase. |
| MIZUCHI OLEUM SPIRIT CORE | Reman | Standard Overflow (-1). Its edge is that all bloom and surge RAD is halved, with VENT 1. **Blue glow** (+3 to detect it while hot) is flavor, not a drawback, per the Reman ruling. |

Existing Oleum items read the curve too: the OLEUM VIS CORE and the OLEUM SPIKE CELL (batch 2) would take `OLEUM-CURVE:` as written. The OLEUM BREACHING TORCH and the new OLEUM PLASMA LANCE are FUEL-fed, so both get Overflow.

## Support items that touch the curve
- **GREAT WHITE** (frame): halves all bloom, redline and surge RAD.
- **HELLION WAKE STACK** (thruster): +40% MOVE and no burn heat while blooming.
- **GLINTUS COCKPIT COMFORT KIT**: +1 to the surge HT roll.
- **EXPLOSIVE VENTS**: fire on a scram (now any reactor).
- **SHRINE-GRADE COCKPIT SHIELDING** (batch 2): divides Oleum rads by 5, as before.

## Rationale and balance
- **SCRAM for all (v1).** Ryuji showed that an Oleum-only scram (cap 12 to 5 in one action) beat any standard vent, so the heat exit is now universal. Oleum keeps bloom, Overflow and SURGE as its identity.
- **Distinct, not strictly better.** Sticky heat means an Oleum knight that blooms spends the rest of the fight at .75 DR unless it scrams (losing an attack) or carries purge or flush gear. Overflow and surge pay for that with cheaper, harder-hitting beams and blades. The trade is armor and pilot health for output.
- **Heat stays moderate.** Nothing adds heat. Overflow only cuts costs, and the scram is a guaranteed exit.
- **Radiation is the real clock.** In a 10-turn fight a pilot in bloom logs about 100 RAD, plus 25 per surge. That is the GURPS sickness range (B435; Basic Set Campaigns is not in `gurps/`, so this is unverified), so Oleum pilots rotate on the dosimeter, as the existing flavor says.
- **Uses only existing tokens.** HEAT, VENT and RAD are already on the sheet; `OLEUM-CURVE:`, `SURGE:`, `SCRAM:`, `BLOOM:` and similar keys are display text. No key starts with a live key such as HEAT, SR or DR.

## Optional sheet hook (for the Overseer, only if wanted later)
A SCRAM button at redline would serve every reactor. If a reactor carries `OLEUM-CURVE:`, the sheet could also relabel DANGER ZONE as **BLOOM**, clamp vent results at half cap, and show a SURGE button. It is not needed for play; the GM applies the rules text.

## Open questions
1. Should Overflow also cover gear with HEAT costs (fins, workshop rig), or only weapons? v1 keeps anything LABEL POWER or FUEL; Ryuji agrees.
2. ~~Should standard reactors get SCRAM?~~ Settled in v1: yes (Ryuji r1 #1).
3. The OLEUM PURGE VALVE's inert `RAD:+50_pilot` line is still open from batch 2.
