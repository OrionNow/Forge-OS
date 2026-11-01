# Divisor proposals: not applied (catalogue v1)

**Status:** proposals only. Every line in `items/` keeps its batch-2 v0 divisor until Overseer answers the root question:

> **Does FORGE "TL8" equal GURPS TL8 as labeled (A), or GURPS TL10, the basis of the 3/51 tables (B)?** Under B, FORGE TL10 = GURPS TL12.

Each column uses its own mapping. Sources and page cites are in `divisor-derivation.md`.
- **(A), Ryuji's original mapping:** GURPS none/(2) → FORGE (3); (3) → (4); (5) → (5); (10) → (6). Shaped charge and plasma are capped at (4).
- **(B), anchored on the baseline:** GURPS (3) or lower → FORGE (3); (5) → (4); (10) → (5). Shaped charge and plasma are capped at (4).
  - The baseline's (3) guns and blades already *are* GURPS TL10 (3) (APEP, UT p.152; vibroblade, UT p.164), so the baseline doesn't move.

## Batch items

| Item (FORGE TL) | v0 | (A) FORGE TL = GURPS TL | (B) FORGE TL8 = GURPS TL10 | Notes |
|---|---|---|---|---|
| SKYFALL CAPACITOR RAILGUN (8) | 6dx25(4) | **(3)**: no GURPS TL8 railgun, TL8 kinetic AP is (2) | **(3)** | GURPS TL10 railgun (3), UT p.142. Ryuji accepts this: Skyfall earns its slot on damage and range, not on its divisor |
| HAGANE-YUMI GAUSS LONGBOW (10) | 6dx25(5) | **(4)**: TL10 railgun (3); APHD (5) is TL11 | **(4)** | GURPS TL12 APHD (5) maps to FORGE (4), UT p.156. Ryuji accepts this. Under A, change the label "hyperdense bolts" to "sabot bolts" |
| KAGEBOSHI REMOTE BITS (10) | 6dx7(3) AVG:147(588) | **6dx6(4)** AVG:126(504): gauss (3) plus one damage step down | 6dx7(3), v0 | Under B, coil darts are GURPS (3), so FORGE (3) |
| KAGEROU MONOMOLECULAR TACHI (10) | 84d(5), dulls to (3) | **(5)**, drop the dulling counter, EP 4: superfine + vibro (5) | (5), same as v0 | GURPS TL12 hyperdense vibro (10) or monowire (10), so FORGE (5). The dulling counter is a separate question for Overseer |
| NAGINATA HIGH-FREQUENCY GLAIVE (10) | 80d(4) | (4): vibro (3) | (4), same as v0 | Superfine vibro (5), so FORGE (4). If hyperdense (10), FORGE (5) |
| WAKIZASHI GUARD BLADE (10) | 67d(4) | (4) | (4), same as v0 | Stays one step under the Tachi |
| HIKARI PARTICLE LANCE (10) | 5dx20(5) | (5): blaster (5) | **(4)** | Blasters are (5) at every TL (UT p.123), and (5) maps to FORGE (4). Ryuji accepts this: it sits level with the HEAT cap and keeps its beam niche |
| GARRISON 35mm, HAILSTORM 40mm (8) | (3) | (3): kinetic AP (2) | (3), same as v0 | GURPS TL10 APEP (3), so FORGE (3) |
| SALVAGED LASER CARBINE (8) | (3) | (3): laser (2) | (3), same as v0 | Laser (2) is at the floor |
| MORTAR, RIPPLE, HORNET, SUNSPIKE (8) | (4) | (4): cap | (4), same as v0 | Shaped charge (10) maps to (5), capped at (4) |
| OLEUM BREACHING TORCH (8) | (4) | (4): cap | (4), same as v0 | Plasma, capped |
| SCATTERGUN, IMPACT MAUL, RIPSAW (8) | (3) | (3) | (3), same as v0 | Shotshell, crushing and chain blade sit at the floor. 3/51's vibrowire (5)^ would give the Ripsaw (4); not proposed |

## Baseline (terminal.html, not touched)
- **Under A:** no change. The Pile Bunker `10dx15(4)` is (3) as a kinetic spike, or keeps (4) as an explosive spike. That's Overseer's call.
- **Under B:** the 20/30/45/90mm guns and the vibroblades L/M/H stay at (3).
  - **Pile Bunker:** its baseline value is **(4)**, not (3). Treated as kinetic (GURPS TL10 (3)), B gives (3), which is a change. It keeps (4) only if it counts as an explosive spike, under the shaped-charge cap. **Default stays (4)**, the baseline value, per Ryuji; going kinetic would make it (3). Overseer decides.

## EP (rule: TL alone costs no EP)
- **Tachi:** EP 4, unchanged. It is a damage price (Heavy Vibro's 3 EP plus one step), not a TL price.
- **Zanshin:** EP -2, unchanged. The "Reman edge" reasoning is replaced with "one ACC step above Linked (Melee) -1".
- **Hakkei:** stays at **EP 5**, per Ryuji. At 4 it would cost the same as the Imperial Heater Shield while beating it on DR (240 vs 200) and HP (250 vs 200).
- No other TL surcharge was found. Every other TL10 item's EP follows its mass, kW, frame, reactor or thruster rule.
