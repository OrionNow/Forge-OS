# Armor-divisor derivation (catalogue v1)

Overseer's rule: higher TL gets higher armor divisors, following GURPS Ultra-Tech. This replaces the old "(5) reserved for Reman TL10" guideline. **No divisor in `items/` has changed yet:** the values hinge on the TL-scale question in `divisor-proposals.md`.

Page numbers are the printed book pages. Line numbers point into the `.txt` copies in `gurps/` (Ultra-Tech page footers sit at the bottom of each page).

## Published divisors (checked this pass)

| TL | Weapon type | GURPS divisor | Source |
|---|---|---|---|
| 7-8 | Kinetic AP (APDS, APFSDS, DU) | (2) | High-Tech pp.167-169 |
| 7-8 | HEAT shaped charge | (10) | High-Tech p.169 |
| 9 | Conventional AP ammo: APHC (2); APEP (3) | (2) / (3) | UT p.152 (UT l.10142-10162) |
| 9 | Sniper Railgun 7mm | (3) | UT p.142 (l.9524) |
| 10 | Gauss pistol, rifle and needler; Portable Railgun; Railgun 40mm 6dx25 | (3) | UT p.142 (l.9515-9546); 3/51 p.27 (40mm and 64mm railguns) |
| 11 | APHD hyperdense dart (double range) | (5) | UT p.156 (l.10456) |
| 9 | Shaped charge warhead (25mm+) | (10) | UT p.154 |
| 10 | HEMP warhead (10mm-18.5mm are (5); 25mm+ are (10)) | (5) / (10) | UT p.155 (l.10374-10402) |
| 9-10 | High-energy lasers, including the TL10 Laser Cannon 6dx10 | (2) | UT pp.114-116 |
| 11 | Rainbow laser (3); X-ray laser (5) | (3) / (5) | UT pp.116-117 |
| 12 | Graser | (10) | UT p.118 |
| 10 | Blaster Cannon 5dx10 (charged particle beam) | (5) | UT p.123; 3/51 Particle Beam 5dx20(5), p.27 |
| 9 | Plasma torch | (5) | UT p.95 |
| 10 | 3/51 Plasma Lance 6dx20 | (10) | 3/51 p.27 |
| 9 | Superfine blade | (2) | UT p.163 |
| 9^ | Monowire blade (superscience; edge only, can't cut a flat surface) | (10) | UT p.163 |
| 10 | Vibroblade (3); superfine vibroblade (5) | (3) / (5) | UT p.164; 3/51 p.10 |
| 10^ | Vibrowire blade (chainsaw-like) (5); superfine (10) | (5) / (10) | 3/51 p.10 |
| 11 | Hyperdense blade (5); hyperdense vibroblade (10) | (5) / (10) | UT p.164 |
| 11^ | Force sword (tight-beam burning) | (5) | UT p.166 |
| — | 3/51 mecha laminate armor: DR x2 vs shaped charges and plasma | halves (10) | 3/51 pp.23-24 |

## FORGE ladders (one per TL reading; see `divisor-proposals.md`)
- **(A) FORGE TL = GURPS TL (Ryuji's original):** GURPS none/(2) → FORGE **(3)**; (3) → **(4)**; (5) → **(5)**; (10) → **(6)**. The baseline is unchanged, and a TL8 APFSDS (3) is now separate from a TL10 railgun (4).
- **(B) FORGE TL8 = GURPS TL10, anchored on the baseline:** GURPS (3) or lower → **(3)**; (5) → **(4)**; (10) → **(5)**. The baseline (3) guns and blades are GURPS TL10 APEP and vibro (3).
- **Both readings:** shaped charge and plasma (10), halved by laminate, are house-capped at **(4)**. GURPS-honest would be (5).

## Points where my derivation differs from Ryuji's
1. **Kagerou Tachi.** Its name and label say "monomolecular". The literal UT match is the monowire blade at (10), giving FORGE (6) under A and (5) under B, but that is TL9^ superscience and edge-only. Ryuji's reading, superfine vibroblade (5), is the non-superscience match. I agree with (5) unless Overseer allows superscience tech.
2. **Reading B and the baseline.** Under the baseline-anchored B ladder, the baseline guns and vibroblades stay at (3). Only the Pile Bunker (baseline (4)) would drop to (3) if treated as kinetic.
3. **Ryuji's B values for Skyfall and Longbow are not what the strict B ladder gives.** The strict ladder gives Skyfall (3) and Longbow (4); Ryuji keeps them at v0 (4) and (5). Bits 6dx7(3) does follow the ladder. Under B, the Particle Lance drops from (5) to (4).
4. **Naginata and Wakizashi.** (4) is correct for a plain TL10 vibroblade. Superfine edges are already TL9 (UT p.163), so a Reman superfine vibro blade at (5) is also defensible. I've left them at (4) for blade parity under the Tachi.
