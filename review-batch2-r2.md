# FORGE-OS Batch 2, Revision 2: Balance Review (Round 2)
**Reviewer:** Ryuji, Balance Critic. **Reviewed:** `concepts-batch2.md` (rev 2), `pass5-heat-revisions.md`, `catalog-additions-pass5.txt` (the Skyfall line), and `roll20/lonely-void-mechs.txt`.
**Rubric:** unchanged from round 1.
- Four axes: B/S/U/F (Balance, Setting, Usability, Function). Overall is the mean. Accept at 7.0 or higher.
- Scope-creep hard rule applies.
- Corrected heat model: heat accumulates, Vent is an Engineering full action, lower VENT is better. Danger zone starts at heat×2 ≥ cap; redline at heat = cap.
- Lower range scale. No-multiplier melee.

**Fixed decisions from Overseer (not penalised)**
- The Skyfall range is **RNG 200/750**. This replaces the 250/900 he approved earlier. Only the Skyfall's heat and SPARE are scored.
- The baseline 20mm Light Autocannon rescale to **100/400** is confirmed (8.25).

**Open questions, still unanswered:** the second DR value, the heat cap, and A1-A5. Current assumptions are kept. Section 7 checks them against Overseer's Roll20 material.

---

## 0. Summary

| | Count |
|---|---|
| Batch-2 items accepted (≥7.0) | **46** |
| Batch-2 items to revise | **4**, all [lean] |
| Pass-5 retunes accepted as drafted | 3: Skyfall*, Kitsune, Afterburner |
| Pass-5 retunes to revise as drafted | 2: Wings, Purge Valve (scope trims not applied) |

\*The Skyfall gets 7.5 only if the draft's heat and SPARE changes reach the catalog. The current `catalog-additions-pass5.txt` line still has HEAT +4, no SPARE and the arm note, which scores **6.75**. See §4.

**Items still under 7, each with its single key fix**

| Item | Score | Key fix |
|---|---|---|
| 105mm SIEGE MORTAR | 6.75 | Change spotted indirect fire from `-4` to `-2` |
| SUNSPIKE | 6.75 | Change "cannot raise target above half cap" to "**below** half cap" (off-by-one, §2) |
| SALVAGE PLATING | 6.75 | Change the tiers to `PLATE:10/15/20 PLATE-HP:full`. Tier 2 currently strictly dominates baseline Sacrificial Plating at half the EP |
| BURST CRUNCHER | 6.75 | Set EP to **+1**. At 0 EP it is strictly worse than Standard Fire Control |

**The four departures:** all four are **accepted**. Hikari's reasoning holds each time. See §2.
- The Mortar and Sunspike still need one token each, for reasons separate from the departures.
- The Hakkei needs a text-only fix.

---

## 1. Spot-checks against `/workspace/forge-os/gurps/` (10 checked; 9 confirmed, 1 partly verified)

| # | Her citation | Source line | Result |
|---|---|---|---|
| 1 | UT HEMP table: 25/40/64/100mm = 6dx3 / 6dx5 / 6dx8 / 6dx12 (10) | UT .txt l.10390-10402 (p.155) | ✅ Exact. The +0.12 per mm interpolation to 105mm gives 6dx12.6, which rounds to 6dx13. |
| 2 | UT Laser Cannon (TL10) 6dx10(2), Acc 18 | UT l.7975 | ✅ |
| 3 | HT Oerlikon Typ S 20mm 6dx3, Acc 6, 1,700/6,400 | HT l.9771 | ✅ |
| 4 | HT M242 25mm 6dx4 | HT l.9783 (Acc 6+3, 2,400/3,300) | ✅ |
| 5 | HT D-81TM APFSDS 6dx30(2) | HT l.10086 | ✅ It also lists APFSDSDU at 6dx33(2), so DU/APFSDS = 1.10. Her ×1.7 / ×1.5 = 1.13 is consistent. I could not find the ×1.3 / ×1.5 / ×1.7 ammo-factor table itself in the .txt: **partly verified**. |
| 6 | UT Shotshell: damage ÷4, half range, RoF ×9, Rcl 1 | UT l.10304-10308 (p.154) | ✅ She cut the RoF from ×9 to 6. That is a stated deviation and acceptable. |
| 7 | 3/51 Heavy pod 6dx15(10) = 315, the anchor for the 80mm and the Hornet | 3/51 weapon table | ✅ 6 × 3.5 × 15 = 315 |
| 8 | 3/51 Active Defense System intercepts "indirect fire artillery" at 13 or less, -1 per extra projectile | 3/51 l.1576-1581 | ✅ This supports keeping the Mortar in ROCKET/MISSILE. Kaeshi's +2 Dodge is a fair sheet translation. |
| 9 | 3/51 High Maintenance: -2 to repair and maintain | 3/51 l.1569-1570 | ✅ Tengu, Kago and Kaze apply it correctly. |
| 10 | 3/51 shields "DR/HP" 320/120 … 480/360, and FORGE shields are exactly half | 3/51 l.1675-1679; sheet l.236-239 | ✅ Numerically. **But see systemic issue S1**: the second number is HP in 3/51, yet the sheet reads it as the shield's effective DR. |

Also re-confirmed: Particle Beam 5dx20(5), 40mm railgun 6dx25(3), Plasma Lance 6dx20(10) 20/200, Rainbow Laser 6dx25(3), and the 90mm 150/500 equal to the 64mm railgun's 12,000/40,000 ÷ 80.

**One derivation flag.** The 140mm calibre for the Scattergun looks reverse-engineered: 0.16 × 140 ÷ 4 = 5.6, which rounds to 6dx6, the target number. The HT calibre rule is for long-barrel guns. The result is acceptable, but it should be described as "set to 6dx6, sanity-checked against the shotshell rule", not as derived from it.

---

## 2. The four departures from my round-1 review

**Mortar at EP 3: ACCEPT the departure.**
- Re-deriving from UT HEMP 100mm gives 6dx13(4), AVG 273. That is 148 through DR 500, below the 80mm launcher's 190 at the same 3 EP.
- At 1.8 t the mass rule gives about 3.35 EP. Her logic holds.
- What stays wrong is separate from the EP: at ACC 0 and -4 even when spotted, it almost never hits. HT allows a forward observer to whittle the penalty down to 0.
- Fix: spotted indirect fire at **-2**.

**Hornet re-anchored to 6dx15 at 4 EP: ACCEPT.**
- It is the same 80mm round as the baseline launcher, which equals the 3/51 Heavy pod (spot-check 7).
- 760 through per salvo, with SPARE 0 and a cook-off keyed to the existing stability threshold, is a fair 4 EP alpha strike.

**Sunspike with the tighter cap: ACCEPT the logic. There is a boundary bug.**
- The sheet's danger test is `heat×2 ≥ cap`. On a cap-10 core, a target at exactly 5 **is** in the danger zone.
- So "cannot raise target above half cap" still lets the Sunspike push a target *into* danger, which is the opposite of her stated intent.
- Fix: write "below half cap", or "to at most ceil(cap/2) − 1".

**Hakkei as a held shield: ACCEPT.**
- Her code reading is correct: `isShield` matches on the name, and the Block interlock (around sheet line 905) requires the shield to be held.
- Text fix only: the ROLE field ("Blocking while both hands stay armed") and the "open hand" flavor contradict the held design.

---

## 3. Batch-2 items: full scores (B/S/U/F = overall)

| # | Item | B/S/U/F = Overall | Verdict | Scope | Note |
|---|---|---|---|---|---|
| 1 | 105mm SIEGE MORTAR | 6/8/6/7 = **6.75** | REVISE [lean] | Minor creep (spotter SENSORS roll on another sheet) | -4 → -2 when spotted |
| 2 | 35mm GARRISON | 8/8/8/7 = **7.75** | ACCEPT | OK | 120/478 sits on the calibre line |
| 3 | IMPACT MAUL | 7/8/7/7 = **7.25** | ACCEPT | OK (reuses the stability check) | |
| 4 | RIPPLE | 7/8/8/7 = **7.5** | ACCEPT | OK | |
| 5 | TORCH | 7/9/8/7 = **7.75** | ACCEPT | OK (rads dropped) | |
| 6 | IMPERIAL HEATER SHIELD (new) | 8/7/9/9 = **8.25** | ACCEPT | OK | Effective DR 120, the same as the Large Shield, with HP 200 vs 300, at 4 EP vs 5. Fills the gap cleanly. |
| 7 | CROWN-GRADE TOURNEY BARDING (new) | 7/9/9/9 = **8.5** | ACCEPT | OK | Verified: `armStats` collects DR:+N% items, and MOVE% and HND are applied from them. "Crown" is not a canon name (§8). |
| 8 | SMOKE | 7/9/7/7 = **7.5** | ACCEPT | OK | The COVER -3 has to be applied by both sides' Targeters; say so |
| 9 | WORKSHOP | 7/8/7/6 = **7.0** | ACCEPT | Minor (the REPAIR:% token is manual) | **Flips with A5** |
| 10 | MAST | 7/9/6/6 = **7.0** | ACCEPT | Minor (an ally types the +1) | The smallest viable squad effect |
| 11 | OLEUM SLURRY COOLANT FLUSH (new) | 7/8/8/8 = **7.75** | ACCEPT | OK | Verified: Engineering 14 → 16 at VENT 2 raises expected shed from 2.52 to **3.50**; at VENT 1, from 4.57 to 6.50 |
| 12 | WINCH | 7/8/8/8 = **7.75** | ACCEPT | OK | |
| 13 | CASTELLAN | 7/9/8/8 = **8.0** | ACCEPT | OK | Stale text: the balance line still says "1 Dodge (BULK)" |
| 14 | CARRIER | 7/8/8/7 = **7.5** | ACCEPT | OK | |
| 15 | ANCESTRAL | 8/8/9/9 = **8.5** | ACCEPT | OK | +5 pool against a slower vent (1.84 vs 2.52 per action) is a good trade |
| 16 | LONG-SERVICE | 7/8/8/8 = **7.75** | ACCEPT | OK | |
| 17 | DRESSED-LINE | 7/7/9/8 = **7.75** | ACCEPT | OK | On the 1 − 1.5×ACC formula it prices correctly. It strictly beats baseline Autotargeter SNIPER (-2 EP), but that is the baseline's fault (S3). The "volley" flavor no longer matches the function. |
| 18 | HAILSTORM | 7/9/8/8 = **8.0** | ACCEPT | OK (spin-up removed) | 128/498 sits on the calibre line |
| 19 | SCATTERGUN | 7/8/8/8 = **7.75** | ACCEPT | OK | See the derivation flag in §1. **Possible flip with the second DR value** (S5). |
| 20 | RIPSAW | 7/8/8/8 = **7.75** | ACCEPT | OK | |
| 21 | SUNSPIKE | 7/8/6/6 = **6.75** | REVISE [lean] | Minor (writes heat to another sheet) | Fix the half-cap wording |
| 22 | HORNET | 7/8/6/7 = **7.0** | ACCEPT | Minor (cook-off) | |
| 23 | LASER CARBINE | 6/8/8/8 = **7.5** | ACCEPT | OK | +3 heat per turn means danger on turn 2 on a Standard core, so it is under-tuned for "sustained". Optional: `HEAT:+2/turn`. |
| 24 | SALVAGE PLATING | 3/8/8/8 = **6.75** | REVISE [lean] | OK | Tier 2 (2 EP, 25%, any HP) strictly dominates baseline Sacrificial Plating (4 EP, 25%, full HP only). `plate()` takes only the single largest item, so stacking is fine. |
| 25 | REACTIVE | 7/8/8/8 = **7.75** | ACCEPT | OK | It holds a Hornet salvo to about 260. Strong but countered. Stale text: "6 blocks" in the label. |
| 26 | HARPOON | 7/8/8/8 = **7.75** | ACCEPT | OK | Stale text: the intent line still says "pull an enemy" |
| 27 | DECOY | 7/8/6/7 = **7.0** | ACCEPT | Minor (a Quick Contest) | |
| 28 | JURY-RIG | 7/8/7/7 = **7.25** | ACCEPT | OK | **Depends on A1**; see §7 (no flip) |
| 29 | MESH NET | 7/8/7/6 = **7.0** | ACCEPT | Minor (allied-suite proximity) | Define the no-suite case ("counts as tier 1"). Tier 1 + Mesh = 5 EP, the same as a tier-2 suite, so it only saves EP for a bearer with no suite. |
| 30 | TECHNICAL | 7/8/8/8 = **7.75** | ACCEPT | OK | Stale text: "immobilize" |
| 31 | OLEUM SPIKE | 7/8/8/8 = **7.75** | ACCEPT | OK | Now close to a Standard core (-10% HP, +1 HND, +3 detection). Thin identity but sound. |
| 32 | POGO | 7/8/8/7 = **7.5** | ACCEPT | OK | |
| 33 | BURST CRUNCHER | 2/8/9/8 = **6.75** | REVISE [lean] | OK | Standard FC gives +1 to every class, including BALLISTIC, at 0 EP. Her note "beats Standard for a pure-gun build" is wrong. Set EP to +1. |
| 34 | LONGBOW | 6/9/8/8 = **7.75** | ACCEPT | OK | 8 bolts against the Skyfall's 3 is fine: at +4 heat, redline arrives first |
| 35 | NAGINATA | 7/9/9/9 = **8.5** | ACCEPT | OK | Her note is wrong: the baseline Heavy Vibroblade is also two-handed. Parity still holds (155 vs 141 through DR 500). |
| 36 | WAKIZASHI | 7/9/9/9 = **8.5** | ACCEPT | OK | |
| 37 | LANCE | 7/9/9/9 = **8.5** | ACCEPT | OK | RCL 0: see S6 |
| 38 | BITS | 7/9/7/7 = **7.5** | ACCEPT | Minor (ECM grounding) | Set RCL 0 → **1**: the hits formula divides by Rcl. Flips with the second DR value and the REAR flag (S5). |
| 39 | HAKKEI DEFLECTOR SHIELD | 7/8/7/7 = **7.25** | ACCEPT | OK | Effective DR 180, the same as the Tower, with HP 250 vs 500, at 5 EP vs 7, plus heat per Block. Fix the text. |
| 40 | O-YOROI (unchanged) | 7/9/8/7 = **7.75** | ACCEPT (quick pass) | OK | |
| 41 | KAESHI | 7/9/8/7 = **7.75** | ACCEPT | OK | Stacks with the 60mm pod's +2 for +4 Dodge. Acceptable. |
| 42 | SHUKUCHI | 7/9/8/8 = **8.0** | ACCEPT | OK | |
| 43 | MENDER | 5/9/7/7 = **7.0** | ACCEPT | OK | Dominates Workshop tier 2 (10%, no roll, 3 vs 4 EP). Suggest REPAIR 5%. **Flips with A5.** |
| 44 | ONMYO OLEUM HEAT-SINK FINS (new) | 7/8/8/8 = **7.75** | ACCEPT | OK (uses the heat buttons) | A guaranteed 2 per Ready, against 2.52 expected per vent action |
| 45 | SHINOBI (unchanged) | 7/9/8/6 = **7.5** | ACCEPT (quick pass) | OK | |
| 46 | TENGU | 7/9/8/8 = **8.0** | ACCEPT | OK | |
| 47 | KAGO | 7/9/8/8 = **8.0** | ACCEPT | OK | |
| 48 | TAMASHII | 7/9/8/8 = **8.0** | ACCEPT | OK | A fair sidegrade to the Heavy core |
| 49 | KAZE | 7/9/8/8 = **8.0** | ACCEPT | OK | |
| 50 | ZANSHIN | 7/9/9/7 = **8.0** | ACCEPT | OK | The Skyfall's ELECTROMAGNETIC class escapes the -1 (S4) |

---

## 4. Pass-5 heat retunes

| Item | Change | B/S/U/F = Overall | Verdict | Scope |
|---|---|---|---|---|
| SKYFALL (RNG **200/750**, fixed) | HEAT +4 → +3, SPARE:0, arm note dropped | 7/8/7/8 = **7.5** | ACCEPT | OK |
| WINGS | HEAT +4 → +3, burn cap removed | 7/8/5/6 = **6.5** as drafted; **7.5** with trims | REVISE [lean] | CREEP: HP:20 and the rear-hit note remain |
| KITSUNE | HEAT +3 → +1/turn | 7/9/6/7 = **7.25** | ACCEPT | Minor: the "drops for 1 turn after 100+" timer remains |
| AFTERBURNER | HEAT +2 → +1/turn at full MOVE | 7/8/8/8 = **7.75** | ACCEPT | OK |
| PURGE VALVE | EP 1 → 2 | 7/8/4/5 = **6.0** as drafted; **7.75** with trims | REVISE [lean] | CREEP: rads splash to pilots within 50m |

**Skyfall heat at +3.**
- Standard core (cap 10): 3 / 6 / 9 over its three shots, so danger from the second shot but no redline.
- Light Fission core (cap 7): about 4.6 after three shots, counting the off-turn vents.
- The heat is real but not punitive. SPARE 0 (3 rounds total) restores the kill-shot scarcity.

**Catalog mismatch.** The current `catalog-additions-pass5.txt` line has RNG 200/750 but still `HEAT:+4/shot`, no SPARE (which defaults to 2, so 9 rounds), and the 20+ arm note. As it stands that scores 6/8/6/7 = **6.75**. The draft's heat, SPARE and note changes need to reach the catalog.

**Class.** Change the Skyfall from ELECTROMAGNETIC to BALLISTIC, as Hikari suggests (S4).

---

## 5. Baseline 20mm rescale (confirmed at 100/400, 8.25)

- Hikari proposed no number: her line 75 leaves the unscaled HT range.
- Her own calibre interpolation (30mm 113/458 to 45mm 135/518, a slope of +1.47 per mm on 1/2D and +4 per mm on Max) extrapolates the 20mm to **98/418**.
- The confirmed **100/400** is within 2% on 1/2D and 4% on Max.
- It sits below the 30mm's 113/458, as it should. Its 1/2D-to-Max ratio of 4.0 against the 30mm's 4.05 is consistent.
- No objection.

---

## 6. Systemic issues

**S1. The shield DR semantics are inverted.**
- `armorOf` reads a shield's DR as regex group `[3 + ARMOR_REF.Shield]`, which is the **second** number.
- So the effective shield DR is 60/90/120/180 for Small through Tower.
- In 3/51 the second number is **HP** (l.1675 "DR/HP"). FORGE halves it and uses it as DR, while FORGE HP is a separate figure.
- Hikari's and my balance prose quote the first number. All comparisons in §3 use the effective (second) number.
- Relative rankings hold, so no score flips. Overseer should know that this is the one place the "second DR value" is live. I am correcting my own round-1 statement that "every location uses the first number": that is true for frames, not shields.

**S2. Dominance pairs remain.**
- Salvage tier 2 over Sacrificial Plating.
- Standard FC over Burst Cruncher.
- Mender over Workshop tier 2.

**S3. Baseline Autotargeter SNIPER is overpriced.**
- At -2 EP for (+2 / -1 / -2, HND -1) it scores below 0 on the 1 − 1.5×ACC formula.
- Dressed-Line exposes it. This is a baseline fix for Overseer, not a batch fault.

**S4. ELECTROMAGNETIC is now used only by the Skyfall.**
- So the Skyfall escapes Linked and Zanshin penalties.
- Reclassify it to BALLISTIC, or add ACC-ELECTROMAGNETIC to both.

**S5. Double-dip risk if the second DR value becomes rear or limb DR.**
- If the REAR ×0.5 checkbox is also kept, Bits and Scattergun would hit roughly 4× softer targets.
- Decide one or the other.

**S6. RCL 0 on Bits and Lance.**
- The hits-per-burst formula divides by Rcl, and the baseline minimum is 1.
- It matters for Bits (RoF 4).

**S7. Stale prose.** Balance, intent and flavor lines describe removed mechanics:
- Castellan "BULK";
- Technical "immobilize";
- Hakkei "open hand";
- Harpoon "pull";
- Reactive "6 blocks";
- Dressed-Line "volleys".

This is text only, but it will mislead table rulings.

**S8. Oleum vent stacking.**
- Coolant Flush + Fins + Purge on one Oleum knight gives 3.5 per vent or a guaranteed 2 per Ready, plus a once-per-sortie reset.
- Strong, but within the heat economy. Watch it, no action yet.

---

## 7. Assumptions A1-A5 against Overseer's Roll20 material (`roll20/lonely-void-mechs.txt`)

Sections read: Notes for Mecha Design (l.263-289), Mech Stats by Tier and Age (l.291-303), Weapon List (l.305-351) and Hit Location Ideas (l.356-371).

**A1: crippled = limb HP ≤ 0; destroyed = HP ≤ −max**
- **Crippling: CONFIRMED in substance.**
  - The RAW limb rows say: "Over 1/2 hp damage is lost and limb is crippled" (l.361, legs; l.365, left arm; l.362 and l.366, "same").
  - Sheet limbs carry half the frame HP, so limb HP reaching 0 equals injury of HP/2, which is the RAW crippling point.
- **Destruction at −max: CONTRADICTED.**
  - "damage is lost" (l.361/365) means excess beyond crippling does not accumulate, so a limb cannot be driven to −max by damage.
  - Hands and feet cripple at 1/3 (l.367).
- **Caveat:** the mecha version of the table has a **blank effects column** (l.371: "with effects column blank"). This is an idea, not a ruling.
- **Flips:** none.
  - Jury-Rig (7.25) still works.
  - Its "fail by 5+ wrecks the limb" clause becomes the only route to a wrecked limb, which is a reason to keep it.
  - If Overseer adopts "excess lost", the sheet's `cond()` wreck state (v ≤ −m) for limbs becomes unreachable by damage. That is a sheet question, not a batch one.
- **Canon note:** "Torso" is the canon location name (l.259, l.363, l.371). FORGE bans the token and uses Core.

**A2: Medium ≈ 10 EP of equipment; Heavy/Heavy ≈ 15 EP**
- **NOT COVERED.** The file has no EP or point budget.
- Indirect support only: "Average Strike Team: 6 pilots, 3 Autocannons, 2 Missile Launchers, 1 Long Rifle" (l.267). That implies one primary weapon per mech, which is consistent with a ~10 EP Medium (one 3-5 EP gun plus support).
- No flips.

**A3: hits per burst are ceilings, 1 + margin/Rcl**
- **NOT COVERED** as a rule.
- The weapon list uses GURPS Rcl (l.308-325), and l.333 notes RoF is "crazy high … we probs wanna go a bit lower".
- **Question for Overseer:** l.383 says "RoF = Rate of Fire (Firing more shots reduces chance to hit)". That is the reverse of GURPS and of the sheet's `rofBon` (+1 / +2 / +3).
  - If he means it literally, Hailstorm (8.0), Bits (7.5) and Scattergun (7.75) lose their RoF bonus.
  - Bits and Scattergun would drop toward 7.0. **Conditional flip risk; not flipped.**

**A4: one ranged attack per turn unless All-Out Attack**
- **NOT COVERED.** No attacks-per-turn rule appears.
- Related only: the Gauss cannon needs a "Change Stance - Brace" action between shots (l.325), and the Malware cannot Parry or Block in Fly-Fin mode (l.260).
- No flips.

**A5: repair is meant to be minor**
- **NOT COVERED.** There is no repair rule. The 30-minute recharge (l.320) is for beam shots, not repair.
- Workshop (7.0) and Mender (7.0) stay flagged as flipping if Overseer wants repair to matter.

**Other Roll20 facts that bear on the open questions**
- **The second DR value: Overseer's own figures disagree with each other.**
  - "DR for medium Mechs be 500/375" (l.265-266).
  - The TL8 Medium row reads 500/250 (l.295).
  - Both are lower-DR-on-limbs readings of 3/51, which supports **applying the second value to limbs and other angles**.
  - If adopted, S5 applies: Bits and Scattergun would need the REAR checkbox dropped, or they flip down.
- **The Roll20 shield line is a transcription error.** l.326 lists "HP80 / HP 320 / HP 600 / HP 1000", but those are the 3/51 **Weight** column (3/51 l.1675-1679, "Weight … DR/HP"). Do not adopt them as HP.
- **Melee:** "actual strength of 4 times" (l.274) and vibro 64d / 76d / 88d(3) (l.315) match the FORGE baseline dice. The no-multiplier rule stands, with the ×4 already folded into the dice.
- **Jammers:** "Universal Jammers reduce effective range to 300 yards" (l.273). The lower range scale (Skyfall 200/750, 20mm 100/400) sits sensibly inside that bubble.

**Net result:** **no batch-2 score flips on the Roll20 evidence.** There are conditional flips:
- Workshop and Mender (A5);
- Bits and Scattergun (the second DR value used as limb/rear DR together with the REAR flag; the RoF-penalty reading of l.383).

---

## 8. Lore names against Roll20 canon

| Batch name | Canon | Conflict |
|---|---|---|
| **Reman / Remans / REMAN** (~70 uses) | "the **Remun** invasion" (l.194, the only occurrence) | **Spelling conflict.** Adopt "Remun", or have Overseer confirm. |
| **Oleum Vis / OLEUM_VIS** | "**Oleum-Vis**" (l.396) | Display text should be hyphenated. Tokens can stay OLEUM_VIS. |
| **Crown / Crown-grade** (9 uses) | "Core Empire", "the empire", "Imperial" (l.41, l.194, l.395). No "Crown" anywhere. | Non-canon name. Use "Imperial" or "Core Empire". |
| **Rebels** | "Rebellion" (l.33, l.51, l.218); **also a separate "Republic"** in civil war with the empire (l.194, l.324) | No direct conflict. The batch has no Republic, so check that the "Rebel" items are not meant to be Republic. |
| Japanese-styled Reman kit (Hakkei, Zanshin, Onmyo…) | Canon Japanese names belong to Raphael's "Divine" line and the "Akeda Oni" against "rival samurai" (l.208, l.318-322) | Possible conflict if the Divine/Akeda line is not Remun. Overseer to confirm. |

The canon Imperial standard-issue weapons (30mm, 45mm, 120mm rocket cannon, 90mm heavy rifle; l.308-313, l.332) match the FORGE baseline. No conflict there.
