# FORGE-OS catalogue additions

Plain-text catalogue ideas for the FORGE-OS sheet. Nothing here is implemented in `terminal.html`.

**Current version:** batch 2 **v1**, Nov 1, 2026. It has 64 items: 14 pass-5 and 50 batch-2. By faction: Core Empire 22, Crow Republic 20, Reman 22.
**Status:** polished for Overseer's review. 0 parser rejects. The TL divisor bands have been applied: TL8 is the core base, TL9 sits 0-2 steps above the comparable core item and TL10 sits 1-3 steps above it, with the ladder capped at (6).

## Batch 3 (v1, Ryuji round 2; Overseer rulings applied)
Unique traits, the Oleum curve and GURPS-cited damage, from the Overseer's Nov 1 ask. v1 applies all 14 of Ryuji's round-1 must-fixes (`reviews/review-batch3-r1.md`). Validator: 28 lines, 0 real rejects (only the 3 expected tier-name rejects).

**Overseer rulings (Nov 1):** Dragon's Breath is 6dx15(5). The Daimyo Buster Blade is 76d(6). Malware is Crow Republic and Whale is Core Empire. These are applied in place to `batch3-v1-*` and logged in `notes/batch3-design-notes.md`.

> **DEPENDENCY:** Oleum RAD costs depend on the pilot rad tracker, which the Overseer removed from the UI in v5.2. They are flagged, not built on. Batch 3 items that reference RAD: CFOR, Oleum Bastion Pile, Hellion Bloom-Burner, Drip-Feed Oleum Cell, Mizuchi Oleum Spirit Core and Great White. Details are in `notes/oleum-reactor-pass.md`.
- `items/batch3-v1-raw.txt`: 28 paste-ready RAW lines with no headers: 8 reactors (5 Oleum), 6 thrusters, 6 frames, 5 weapons and 3 gear.
- `items/batch3-v1-companion.md`: name, faction, EP, TL, key stats, trait and GURPS damage cite.
- `items/batch3-v0-raw.txt` and `items/batch3-v0-companion.md`: the v0 cut, kept for diff.
- `notes/oleum-reactor-pass.md`: SCRAM for every reactor, plus Oleum's own danger zone (bloom: sticky heat, overflow, rads) and SURGE at redline, with rationale.
- `notes/batch3-design-notes.md`: trait philosophy, GURPS damage derivations, the v1 fix map and open questions.
- `reviews/review-batch3-r1.md`: Ryuji's round 1 (revise).

## items/ (batch 2 v1 list)
- `batch2-v1-raw.txt`: 64 paste-ready RAW lines with no headers.
- `batch2-v1-grouped.txt`: the same lines under category and faction headers. Lines starting with `#` are headers; don't paste them.
- `batch2-v1-tiers.js`: TIER entries for Field Workshop Rig, Salvage Plating Kit and Shinobi Signature Dampers.
- `batch2-v1-companion.md`: a readable table with name, faction, EP, TL, key stats and role/flavor.

## notes/ (design and balance reasoning)
- `changelog-v1.md`: every change against v0.
- `divisor-derivation.md`: GURPS Ultra-Tech, High-Tech and 3/51 divisors, with page cites, and the FORGE ladder.
- `divisor-proposals.md`: earlier A/B divisor proposals, superseded by the TL band ruling.
- `batch2-design-notes.md`: per-item design intent, balance, EP logic and derivations for the 50 batch-2 items (revision 2).
- `pass5-heat-revisions.md`: heat retunes and the final block for the 14 pass-5 items.

## reviews/ (Ryuji, Balance Critic)
- `review-batch2.md` (round 1), `review-batch2-r2.md` (round 2), `review-batch2-sanity.md` (v0 ship check) `review-tl-divisors.md` (TL, divisor and EP rules) and `review-tl-bands.md` (the band check).

## reference/
- `roll20/lonely-void-mechs.txt`: Overseer's Roll20 "A Lonely Void" mechs, ships and handouts. Inspiration only; no items from it yet.
- `batch2-v0/`: the v0 release cut, kept as the changelog baseline.

## Open for Overseer
- The Breaching Torch's comparable core item, for its divisor band.
- A1-A5, Musha BRITTLE, the Purge Valve's inert `RAD:` and Onmyo Fins "sheds 3".
- Canon names: Oleum-Vis, Crown, Torso/Core.
- Shield and 20mm baseline edits.
