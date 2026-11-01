# Batch 2: TL / armor-divisor / EP review (Ryuji)
**Date:** Nov 1, 2026.
**Source reviewed:** `release/batch2-v0-raw.txt`, all 64 lines (14 pass-5 items and 50 batch-2 items). `catalogue/` did not exist yet.
**Rules applied (Overseer, via Sage):**
1. Higher TL gets higher armor divisors, following GURPS High-Tech / Ultra-Tech conventions.
2. TL alone does not cost EP.

These replace my old "(5) is Reman-only" and "TL costs EP" reasoning.

Plain-text review only: no code, sheet or release edits.

## 1. GURPS reference values (checked in `/workspace/forge-os/gurps/`)

| TL | Type | GURPS divisor | Source |
|---|---|---|---|
| 7-8 | APDS, APFSDS, APDU, APFSDSDU (kinetic AP) | (2) | HT l.11977-12150 (pp.167-169); D-81TM APFSDS 6dx30(2), DU 6dx33(2) (HT l.10086-10090) |
| 7-8 | HEAT and MS-HEAT (shaped charge) | (10) | HT l.12228-12234 (p.169); D-81TM HEAT 6dx7(10) (HT l.9979) |
| 7 | EFP (self-forging) | (2) | HT l.12210-12222 |
| 9-10 | Railgun and gauss (Sniper Railgun TL9; Gauss Rifle, Portable Railgun, 40mm Railgun TL10) | (3) | UT l.9515-9555; 3/51 Railguns 40mm and 64mm (3) (3/51 l.1654-1655) |
| 10 | HEMP warhead (≥25mm) | (10) | UT l.10374-10402 (p.155) |
| 9-10 | Lasers, including the Laser Cannon | (2) | UT l.7893-7976 |
| 11 | Rainbow Laser (3); X-ray Laser (5) | (3) / (5) | UT l.7999, 8052 |
| 10-11 | Charged particle beam (Blaster Cannon TL10) | (5) | UT l.8413-8428; 3/51 Particle Beam 5dx20(5) (l.1649) |
| 10 | 3/51 Plasma Lance | (10) | 3/51 l.1650 (UT's Plasma Cannon TL10^ is (2), l.8710) |
| 11 | APHD hyperdense dart | (5), double range | UT l.10456 |
| 10 | Vibroblade (3); superfine + vibro (5) | (3) / (5) | UT l.10993-11001 (p.164) |
| 11 | Hyperdense blade (5); hyperdense + vibro (10) | (5) / (10) | UT l.10993-10999 |
| — | Laminate armor (all 3/51 mecha): **DR ×2 vs shaped charges and plasma** | effectively halves (10) | 3/51 l.1491, l.1421 |

## 2. Proposed FORGE mapping (for Overseer)
FORGE compresses GURPS onto (3)-(6) with a floor of (3). The current files map GURPS (2) and (3) **both** to FORGE (3), so a TL8 APFSDS and a TL10 railgun look identical. That breaks rule 1.

The smallest mapping that honours rule 1:

| FORGE | GURPS equivalent | Typical items |
|---|---|---|
| **(3)** | none, or (2) | TL8 kinetic AP, TL8 melee, lasers (TL9-10), shotshell, crushing |
| **(4)** | (3) | TL9-10 railgun / gauss / coil; TL10 vibro / HF blades. **House rule:** shaped charge and plasma (10), halved by laminate, are capped at (4) |
| **(5)** | (5) | Particle beams (TL10); superfine-vibro blades (TL10); APHD (TL11); X-ray (TL11) |
| **(6)** | (10), not halved | Hyperdense-vibro (TL11), monowire, nanothorn |

Under this mapping, every batch weapon except the three in §3a already sits correctly, and the baseline is untouched (§5).

## 3. Real problems: one line per fix

**(a) Divisors out of line with TL and weapon type**
1. **SKYFALL CAPACITOR RAILGUN** (TL8): change `6dx25(4)` to **(3)**. TL8 kinetic AP is (2) (HT pp.167-169), and GURPS has no TL8 railgun: the Sniper Railgun is TL9 at (3) (UT l.9524). *Alternative: keep (4) and retag it TL9.* Through DR 500: 400 → 358.
2. **HAGANE-YUMI GAUSS LONGBOW** (TL10): change `6dx25(5)` to **(4)**.
   - TL10 railgun and gauss are (3) in UT (l.9526-9546) and in 3/51 (l.1654). (5) needs APHD, which is TL11 (UT l.10456).
   - This also settles the open "Reman railgun divisor (5)" question.
   - Through DR 500: 425 → 400.
3. **KAGEBOSHI REMOTE BITS** (TL10, 25mm coil darts): change `6dx7(3)` to **6dx6(4)**.
   - The coil-gun rule gives (4).
   - Dropping one damage multiplier keeps rear output at about 254 per turn, close to today's 256. Without the cut it rises to 338, above the HAILSTORM's 320 at the same 4 EP (see §3c).
4. **KAGEROU MONOMOLECULAR TACHI** (TL10): keep **(5)**. Superfine + vibro is (5) at TL10 (UT p.164), so its divisor is correct. Close the old "(5) at 5 EP or (4) at 4 EP" option at **(5), EP 4**, and drop the dulling counter (scope creep).

The other weapons all check out:
- **Naginata and Wakizashi (4):** TL10 HF/vibro, GURPS (3).
- **Particle Lance (5):** UT Blaster Cannon TL10 (5), 3/51 (5).
- **Laser Carbine (3):** laser (2).
- **Garrison and Hailstorm (3):** APFSDS-DU (2).
- **Scattergun (3):** shotshell, floor.
- **Mortar, Ripple, Hornet and Sunspike (4):** shaped charge (10), house cap.
- **Torch (4):** the 3/51 plasma lance's (10), halved by laminate.
- **Maul and Ripsaw (3):** TL8 melee, floor.

**(b) EP surcharges that exist only because of TL or faction**

5. **KAGEROU TACHI:** drop the "(5) needs EP 5" surcharge. It is my own round-1 preference and is now withdrawn under rule 2. Keep **EP 4**, justified on blade parity: the HEAVY VIBRO's 3 EP plus one step of damage. The mass rule alone gives 3.35 → 3, so EP 4 is a damage price, not a TL price.
6. **ZANSHIN PREDICTIVE LINK:** delete "FORGE charges -2 for the Reman edge" (concepts-batch2.md l.751), but **keep -2 EP**, re-justified as one ACC step above LINKED (MELEE) at -1. Taking the surcharge off (-1) would make it beat Linked Melee outright for any build without beam weapons (+3 against +2 melee, same penalties).

I found no other TL surcharge. Every other TL10 item's EP comes from its mass, kW, frame, reactor or thruster rule. Kitsune (4 EP for about 8 kW) and Shrine Shielding (3 EP for 3.5 t) are if anything *under* their formulas. That isn't a TL surcharge, so I haven't flagged it.

**(c) Items that become dominant after the changes**

7. **BITS:** only if fix 3 is applied as (4) *without* the damage trim. 338 per turn at any facing would beat the Hailstorm per turn at the same EP. With **6dx6(4)** nothing dominates.
8. **LONGBOW at (4)** beats the baseline **90mm HEAVY RIFLE** (EP 5) on damage, ACC and range, but pays +4 heat per shot and needs Aim before every shot. Under rule 2 this is acceptable "better high-tech", not a defect. **No fix.** Noted so Overseer sees it.

Nothing else flips. The Tachi at (5) and EP 4 puts 194 through, against 141 for the Heavy Vibro (3 EP) and 155 for the Naginata (3 EP): it costs more, so it doesn't dominate.

## 4. Citation-only notes (no value change)
- **Mortar and Sunspike (TL8)** take their damage from UT **HEMP, which is TL10** (UT l.10374), not TL9 as the notes say.
  - The divisor is the same through TL7 HEAT (10), so nothing changes.
  - Re-cite them to HT HEAT for TL honesty.
  - FORGE's TL8 mecha weapons all come from 3/51's TL10 tables anyway (systemic, see §6).

## 5. Baseline TL8 items: divisor changes?
**None are needed under the proposed mapping.**
- **30mm, 45mm and 90mm (3):** TL8 kinetic AP (2), FORGE floor.
- **60mm pod, 80mm and 120mm ROCKET CANNON (4):** shaped charge (10), halved by laminate, capped at (4).
- **Vibroblades L/M/H (3):** GURPS vibro is TL10, so a TL8 blade sits at the floor.
- **The baseline has no railgun-type item.** The only one is the pass-5 Skyfall (fix 1).

One baseline item needs Overseer's call:
- **PILE BUNKER `10dx15(4)`:** a kinetic spike is TL8 (2), so FORGE (3). Keep (4) only if he treats it as an explosive or shaped-charge spike.

## 6. Decisions for Overseer
1. **Adopt the §2 mapping** ((2)→3, (3)→4, (5)→5, (10)→6, with shaped charge and plasma capped at (4))? Every fix above assumes it.
2. **The shaped-charge cap.** GURPS-honest is (10) ÷ 2 for laminate = **(5)**. That would raise every rocket, the Mortar, the Sunspike and the Torch one step, baseline included. I recommend keeping the house **(4)**.
3. **Skyfall:** (3) at TL8, or keep (4) and make it TL9?
4. **Pile Bunker:** (3) as kinetic, or (4) as explosive?
5. **The TL label scale.** FORGE "TL8" mecha weapons are built from 3/51's TL10 tables, and Overseer's Roll20 list runs (3) at almost every TL. If he intends FORGE TL8 to equal GURPS TL10, the whole ladder shifts up two TLs. The Skyfall's (4) becomes correct, and the Longbow's (5) becomes defensible as TL12. Fixes 1-3 then reverse. **This is the root decision; answer it first.**
