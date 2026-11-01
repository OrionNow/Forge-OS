# Changelog: batch 2 v1 against v0 (`reference/batch2-v0/batch2-v0-raw.txt`)

## Item lines (3 changes; no stat, EP or divisor changes)
- CASTELLAN SUPERHEAVY FRAME: EXPERIMENTAL 1 → 0. The flavor says "line-built, older than most noble houses", which contradicted the [EXP] badge.
- 60mm RIPPLE ROCKET BATTERY: flavor fixed. It said "twice the tubes", but the pod has 8 and the battery has 12.
- WAKIZASHI GUARD BLADE: LABEL-VALUE changed from "Monomolecular laminate" to "HF laminate edge". This matches its (4) and the Naginata, and stops it reading like the Tachi's (5) edge.

## Layout
- The 64 lines are now grouped by category (A, D, U, F, R, T, G), then by faction (Core Empire, Crow Republic, Reman). v0 order was pass-5 first, then batch 2.
- New `batch2-v1-grouped.txt` (with headers) and `batch2-v1-companion.md` (readable table).
- Tiers are byte-identical to v0.

## Notes text (no line change)
- Zanshin EP -2: "Reman edge" surcharge reasoning replaced with "one ACC step above Linked (Melee)".
- Tachi EP 4: reasoning is now a damage price, not TL. Ryuji withdrew his EP-5 option.

## Proposed, not applied (needs Overseer: see `divisor-proposals.md`)
- Divisors for Skyfall, Longbow, Bits, Tachi, Naginata and Wakizashi, plus the Tachi dulling-counter drop. All hinge on the FORGE TL vs GURPS TL question.
- **Kageboshi Remote Bits:** damage changes from 6dx7(3) to 6dx6(4), with AVG going from 147(588) to 126(504). This follows the TL band review in `reviews/review-tl-bands.md`, where TL10 means 1-3 steps above the comparable core item.
- **Longbow (5), Particle Lance (5) and Zanshin (-2 EP):** confirmed in band and unchanged.
- **Held for Overseer:** Skyfall (drop to (3), or retag as TL9), Tachi dulling, the Breaching Torch's comparable core item, and whether the divisor ladder tops out at (5) or (6).
