# FORGE-OS catalogue additions: batch 2, v0 (rough cut for feedback)

**What's here**
- `batch2-v0-raw.txt`: 64 paste-ready RAW lines for the catalogue block in terminal.html.
  - Lines 1-14: the pass-5 items with all of Ryuji's round-2 fixes. The Skyfall Railgun is at 200/750 with HEAT +3, SPARE:0 and class BALLISTIC.
  - Lines 15-64: the batch-2 concepts (Empire 17, Crow Republic 16, Reman 17), with Ryuji's round-2 fixes applied.
- `batch2-v0-tiers.js`: TIER entries for the 3 tiered items (Field Workshop Rig, Salvage Plating Kit, Shinobi Signature Dampers).
- Parser check: 64 lines, 0 rejects against the v5.0.1 parser.

**Full notes** (stats derivations, flavor, balance notes) are in `../concepts-batch2.md` and `../pass5-heat-revisions.md`, and Ryuji's reviews are in `../review-batch2.md` and `../review-batch2-r2.md`.

**Not in this cut**
- Ideas from the Roll20 "A Lonely Void" campaign file. Those come next.
- Canon renames are on hold until Overseer decides:
  - The file writes "Oleum-Vis" with a hyphen.
  - "Crown" doesn't appear in the file.
  - The file calls the location "Torso", while the sheet calls it "Core".
- The 20mm light autocannon range change (1800/7200 to 100/400, confirmed by Ryuji) edits an existing baseline line, so it's not in this file.

**Open questions for Overseer:** crippling rule (A1), EP budget (A2), Kagerou Tachi divisor option, hits per burst (A3), one ranged attack per turn (A4), repair scale (A5), Reman railgun divisor (5), whether the second DR value applies to limbs and rear hits, and whether Linked Fire Control should penalize beam weapons.

**Shield DR ruling (passed on by Ryuji, Nov 1):** each shield now has a single DR value, the old first (larger) number, with the second number dropped. The Imperial Heater Shield is now DR:200 and the Hakkei Deflector is DR:240. I tested this against the current armorOf parser: a single value falls back to the first number and reads correctly, so no code fix is needed for these lines. Note that with a/b pairs, the sheet currently reads the *second* (smaller) number for shields. The 4 baseline shields in terminal.html (Small, Medium, Large, Tower) still use pairs and need the same edit (DR:160, 180, 200, 240) applied in the code.

**Sanity pass (Ryuji, Nov 1): ship it.** All round-2 fixes are confirmed, with 64 lines, 0 rejects and no duplicate names. Ryuji reports that the Rebel faction is the Crow Republic and that the Reman spelling is settled, so both open questions are removed. Not blockers, but worth a look: Purge Valve's `RAD:+50_pilot` is inert text, and Onmyo Heat-Sink Fins are weak under the new vent minimum ('A Ready sheds 3' would fix them). Full report: `../review-batch2-sanity.md`.
