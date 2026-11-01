# Batch 2 v1: TL band divisor review (Ryuji)
**Date:** Nov 1, 2026.
**Source:** `catalogue/items/batch2-v1-raw.txt`, all 64 lines: 50 batch-2 items plus 14 pass-5 items. 18 of them are weapons with a divisor.
**Status:** text only. No item, sheet or release file was edited.

## Overseer's rules (Nov 1)
- FORGE TL8 is the core catalog's base tech level. It is GURPS-inspired, not strict GURPS.
- The core catalog stays exactly as it is.
- Additions are power increases over the comparable core item:
  - **TL8:** match the core item.
  - **TL9:** 0 to +2 steps.
  - **TL10:** +1 to +3 steps.
- Damage types don't matter. EP is not charged for TL.

**The ladder** (as written in `notes/divisor-derivation.md`): **(3) → (4) → (5) → (6)**, one step each.

**Core divisors:**

| Divisor | Core items |
|---|---|
| (3) | 30mm Autocannon, 45mm Hand Cannon, 90mm Heavy Rifle, Vibroblade L/M/H |
| (4) | 60mm Missile Pod, 80mm Rocket Launcher, 120mm Rocket Cannon, Pile Bunker |

No core item sits at the top step. Every TL10 band therefore fits: (4)-(6) over a (3) item, (5)-(6) over a (4) item. **The cap problem appears only if the ladder tops out at (5)**, the old "B" ladder. Then a TL10 addition over a (4) core item has exactly one legal value, (5). No batch-2 item hits that case today: every TL10 weapon is compared against a (3) item.

## Per-item check (weapons)

| # | Item | TL | Comparable core item (divisor) | Item's divisor | Band | Verdict |
|---|---|---|---|---|---|---|
| 1 | 105mm Siege Mortar | 8 | 80mm Rocket Launcher (4) | (4) | (4) | ✅ |
| 2 | 35mm Garrison Autocannon | 8 | 30mm Autocannon (3) | (3) | (3) | ✅ |
| 3 | Impact Maul | 8 | Vibroblade Heavy (3) | (3) | (3) | ✅ |
| 4 | 60mm Ripple Rocket Battery | 8 | 60mm Missile Pod (4) | (4) | (4) | ✅ |
| 5 | Oleum Breaching Torch | 8 | Pile Bunker (4), as a breaching tool. *The Medium Vibro (3) is the dice match.* | (4) | (4) | ✅ if the Pile Bunker is the comparable; **borderline**, see decision 2 |
| 6 | **Skyfall Capacitor Railgun** | 8 | 90mm Heavy Rifle (3) | **(4)** | (3) | ❌ **+1 over the core item at TL8** |
| 7 | Hailstorm 40mm Rotary Cannon | 8 | 30mm Autocannon (3) | (3) | (3) | ✅ |
| 8 | Breacher Scattergun | 8 | 45mm Hand Cannon (3) | (3) | (3) | ✅ |
| 9 | Ripsaw Chain Blade | 8 | Vibroblade Heavy (3) | (3) | (3) | ✅ |
| 10 | Sunspike Thermite Projector | 8 | 80mm Rocket Launcher (4) | (4) | (4) | ✅ |
| 11 | Hornet 80mm Alpha Pod | 8 | 80mm Rocket Launcher (4) | (4) | (4) | ✅ |
| 12 | Salvaged Laser Carbine | 8 | 30mm Autocannon (3) | (3) | (3) | ✅ |
| 13 | **Kagerou Monomolecular Tachi** | 10 | Vibroblade Heavy (3) | (5), **dulls to (3)** | (4)-(6) | ✅ at (5); ❌ **while dulled** |
| 14 | **Hagane-Yumi Gauss Longbow** | 10 | 90mm Heavy Rifle (3) | (5) | (4)-(6) | ✅ |
| 15 | Naginata HF Glaive | 10 | Vibroblade Heavy (3) | (4) | (4)-(6) | ✅ |
| 16 | Wakizashi Guard Blade | 10 | Vibroblade Medium (3) | (4) | (4)-(6) | ✅ |
| 17 | **Hikari Particle Lance** | 10 | 90mm Heavy Rifle (3) | (5) | (4)-(6) | ✅ |
| 18 | **Kageboshi Remote Bits** | 10 | 30mm Autocannon (3) | **(3)** | (4)-(6) | ❌ **+0, below the TL10 floor** |

The other 46 lines (defensive, utility, frame, reactor, thruster and targeting items) carry no armor divisor, so the band rule doesn't apply. Reactive Armor Bricks *lowers* incoming divisors, which is a separate mechanic and is fine.

## Out-of-band items and fixes
1. **SKYFALL (TL8):** change `6dx25(4)` to **(3)**. TL8 additions match the core item, and the 90mm Heavy Rifle is (3).
   - Through DR 500 it drops from 400 to 358. That is still above the 90mm's 306 at the same 5 EP, so it remains an upgrade without being a jump.
   - No change to damage or EP needed.
   - *Alternative:* retag it **TL9** and keep (4), which is in the 0-2 band. That makes the Rebel railgun a TL9 item; Overseer's call.
2. **KAGEBOSHI BITS (TL10):** change `6dx7(3) AVG:147(588)` to **`6dx6(4) AVG:126(504)`**.
   - (4) is the TL10 floor.
   - **The damage must drop too.** At 6dx7(4), rear output would be 4 × 84.5 = 338 per turn, above the Hailstorm's 320 at the same 4 EP.
   - At 6dx6(4): about 254 per turn from the rear (same as today) and about 4 from the front.
   - EP stays 4.
3. **KAGEROU TACHI (TL10):** delete `NOTE:edge_dulls_to_(3)_after_3_hits` and its restore note.
   - Dulled to (3), a TL10 blade sits at +0 against the Heavy Vibro, below the TL10 floor. The counter was also flagged as scope creep in round 1.
   - Keep **(5)** and **EP 4**.
   - *If Overseer wants the dulling flavor:* dull to **(4)** instead, which stays in band.

## Rulings on the named items
- **Skyfall:** out of band at TL8. Move to **(3)**, or retag TL9 to keep (4). Range 200/750, HEAT +3 and SPARE:0 are unchanged.
- **Longbow:** **keep (5).**
  - +2 over the 90mm Heavy Rifle, in band.
  - It beats the 90mm on damage (425 against 306 through DR 500), ACC and range, but pays +4 heat per shot and needs Aim before every shot.
  - That is the intended "TL10 is simply better" case, not domination. My earlier (4) recommendation is withdrawn; it was a GURPS-mapping argument.
- **Particle Lance:** **keep (5).** +2 over the 90mm (or +1 over the 120mm Rocket Cannon if that is the comparable), in band either way. 250 through, no ammo, +4 heat per shot.
- **Bits:** out of band. Move to **6dx6(4)**: divisor up, damage down one step to hold output.
- **Tachi:** **keep (5), EP 4.** Drop the dulling counter, or make it dull to (4). The "(5) costs EP 5" option stays withdrawn.
- **Zanshin:** no divisor, so the band rule doesn't apply. **EP -2 stands** on parity (one ACC step above Linked Melee at -1), not on TL. The v1 changelog already records that change. At -1 it would beat Linked Melee outright for builds without beam weapons.

## Dominance after the fixes
With the fixes applied, nothing dominates:
- The Longbow and Particle Lance are better than the 90mm but pay in heat (and the Longbow in Aim).
- The Skyfall at (3) is a modest step up on the 90mm.
- The Bits at 6dx6(4) hold their old output.
- The Tachi (194 through, 4 EP) costs more than the Naginata (155, 3 EP) and the Heavy Vibro (141, 3 EP).

## Decisions for Overseer
1. **Skyfall:** (3) at TL8 (my recommendation), or TL9 at (4)?
2. **Torch's comparable item:** the Pile Bunker (4), which makes it in band (my reading, as a breaching tool), or the Medium Vibro (3), which makes it out of band and would need (3)?
   - At (3) it would be the Medium Vibro plus +2 heat per hit, so it would need its heat cost removed to be worth taking.
3. **Tachi dulling:** drop it (recommended), or dull to (4)?
4. **Ladder top:** is it (6) or (5)?
   - Under (5), any future TL10 item over a (4) core item is locked at exactly (5).
   - A TL10 item over a (5) item (none exists in core) would have no legal value.
