# FORGE-OS Batch 2 v0 release cut: quick sanity review
**Reviewer:** Ryuji. **Date:** Nov 1, 2026.
**Files reviewed** (all in `release/`): `batch2-v0-raw.txt` (current version, after the shield-DR edit), `batch2-v0-tiers.js` and `README-batch2-v0.md`.
**Code checked:** `terminal.html` and `from-grok/FORGE-OS-sortie-app/public/terminal.html`. They are identical on every line cited below.
**Scope:** blockers only. Roll20 items and canon renames are out of scope.

## Verdict: **SHIP IT**
The release raw has no blockers. Some follow-ups are needed to make the new rulings work, but they are **sheet-code and baseline-data changes, not batch-content problems** (§4).

---

## 1. Did the round-2 fixes land? (checked line by line in the release raw)

| Fix | Status | Evidence |
|---|---|---|
| Mortar: spotted fire -2 | ✅ | l.15 `INDIRECT:-2_if_an_ally_with_LOS…` |
| Sunspike wording | ✅ | l.35 `…cannot_raise_target_to_half_cap_or_above` |
| Salvage Plating 10 / 15 / 20 | ✅ | l.38 `PLATE:10 … PLATE-HP:full`. In tiers.js: tier 1 = 10, tier 2 = 15, tier 3 = 20, all `PLATE-HP:full`, at 1 / 2 / 3 EP. |
| Burst Cruncher at EP +1 | ✅ | l.47 EP field = 1 |
| Skyfall | ✅ | l.1: `BALLISTIC // CAPACITOR RAILGUN`, `HEAT:+3/shot`, `SPARE:0`, arm note gone, `RNG:200/750` |
| Wings at +3 heat | ✅ | l.5 `HEAT:+3/activation`. `HP:20` and the rear-hit note are gone, replaced by "lost when the Utility location is disabled". |
| Purge Valve at 2 EP, no splash | ✅ | l.8: EP 2, 50m splash removed. `RAD:+50_pilot` is still there: it parses but nothing reads it, so it is inert and Overseer's call. |
| RCL 1 cleanups | ✅ | Bits l.52 and Lance l.51 are both `RCL:1`. `RCL:0` appears 0 times in the file. |
| Hakkei text | ✅ | l.53: ROLE "Heat-limited heavy blocking at low mass"; flavor no longer says the hand stays free |
| Stale text | ✅ | No BULK, immobilize, "pull an enemy", "6 blocks" or "open hand" left in the RAW. The one hit is "4 volleys" on Bits, which is correct (`AMMO:16(2)`). |
| Scattergun | ✅ | l.33: 3 EP, `RNG:75/250`, 1.6 t, 90mm parent |
| Shield single DR (new ruling) | ✅ | l.20 Heater `DR:200 HP:200`; l.53 Hakkei `DR:240 HP:250`. No `DR:a/b` is left on any SHIELD line. The only remaining a/b pairs are on frames, which is correct. |

**Source sync.**
- Release lines 1-14 match the final pass-5 block in `pass5-heat-revisions.md` byte for byte.
- Release lines 15-64 match `concepts-batch2-raw.txt` byte for byte.
- The only diff from `batch2-v0-raw.txt.pre-shieldDR` is the two shield lines.

## 2. Line count and parse (checked myself, not taken from the README)
I ran a Node replica of the `saveComponent` validator in terminal.html (lines 379-430). It checks:
- category A/D/U/F/T/R/G, and `frameOK` for F lines;
- the name, and that EP is an integer;
- `statsOK` (every stat token is LABEL:VALUE);
- TL is an integer from 0 to 12;
- `safeField`, and no extra `//`;
- template-literal characters;
- duplicate names, within the file and against the 47 baseline RAW names.

Results:
- **64 lines, all 13 fields, 0 rejects, 0 duplicates.**
- Split: 14 pass-5 lines and 50 batch-2 lines.
- The three entries in `batch2-v0-tiers.js` are valid. Each name matches a RAW line, none collides with a baseline TIER entry, and every tier string parses.

## 3. The rulings, checked against the batch

**Shield DR as a single value**
- **Single-value parse: CONFIRMED.**
  - For `DR:200`, regex group 3 is undefined, so `??` falls back to group 2.
  - I ran it in Node: `DR:200 HP:200` gives 200, and `DR:240 HP:250 HEAT:+2/Block` gives 240. Both copies of the sheet behave the same at line 615.
  - Hikari is right: no code change is needed for single-value lines. This is not a blocker.
- A leftover a/b pair would still read the **second** number (`DR:200/120` gives 120). That is why the 4 baseline lines must be edited (§4).
- **Shield EP costs: NOT broken.**
  - A shield is its own hit location ("Shield: NAME"). After DR, penetration goes into its HP.
  - Almost every FORGE weapon has a divisor of (3) or more, so the DR increase is much smaller in play than on paper.
  - The HP ladder (40 / 160 / 300 / 500) still separates the shields.

| Shield | EP | DR old → new | Effective DR vs (3) | HP |
|---|---|---|---|---|
| Small | 2 | 60 → 160 | 20 → 53 | 40 |
| Medium | 3 | 90 → 180 | 30 → 60 | 160 |
| Heater (new) | 4 | 120 → 200 | 40 → 67 | 200 |
| Large | 5 | 120 → 200 | 40 → 67 | 300 |
| Hakkei (new) | 5 | 180 → 240 | 60 → 80 | 250, +2 heat per Block |
| Tower | 7 | 180 → 240 | 60 → 80 | 500 |

  - The ladder stays monotone and no shield beats another outright:
    - The Heater is Large DR with 100 less HP for 1 less EP.
    - The Hakkei is Tower DR with half the HP and a heat cost, for 2 less EP.
  - DR per EP now favours the Small Shield, but its 40 HP means it breaks on the first big hit. **No change to EP costs needed.**

**Vent minimum (fail sheds 1, success sheds at least 2)**
Expected heat shed per vent action:

| Engineering | VENT 1 (old → new) | VENT 2 (old → new) | VENT 3 (old → new) |
|---|---|---|---|
| 12 | 2.82 → 3.20 | 1.61 → 2.11 | 1.21 → 1.84 |
| 14 | 4.57 → 4.73 | 2.52 → 2.78 | 1.84 → 2.21 |

- No heat-costed item breaks. Kitsune at +1/turn, Afterburner at +1, and the +2 utilities are slightly cheaper, but not clearly so.
- Note, not a blocker: **Onmyo Heat-Sink Fins** (a Ready sheds a guaranteed 2) is now worth about nothing to an Oleum core (VENT 2) at Engineering 12 or above. A plain vent gives 2.11-2.78. Optional buff: "a Ready sheds 3".

**Damage rolls = 1 + degrees of success, capped at RoF**
- §3 of my round-2 review already scored every high-RoF item at its ceiling. That cap is unchanged, so nothing flips:
  - Hailstorm: 5 × 64 = 320 per burst.
  - Bits: 4 × 64 = 256 from the rear; 0 from the front.
  - Scattergun: 6 × 43 = 258 from the rear.
  - Ripple: 6 × 43 = 258 per salvo.
  - Hornet: 4 × 190 = 760 per salvo.
- **For Overseer:** if a "degree" means one point of margin rather than one Rcl step, then RCL is dead text on every weapon, including the baseline. Ceilings are reached far more often, but nothing exceeds them.

**Core at +0**
- No batch item depends on the Core penalty. Under Core +0, single hits that kill a Medium/Standard core outright (225 HP) are routine **across the baseline**:
  - 90mm Heavy Rifle: 306.
  - 120mm Rocket Cannon: 505.
- Batch items in the same class: Skyfall 400, Longbow 425, Lance 250 and a Hornet salvo of 760.
- This is a systemic consequence of the ruling, not a batch fault. It should be raised with Overseer, but it does not block the cut.

**Crow Republic**
- The name appears nowhere in the release.
- It doesn't affect parsing: the RAW format has no faction field. "Rebel/Rebels" appears only in flavor text, which fits "keep Rebel items".
- The README is stale on three points:
  - it labels the faction "Rebel 16";
  - it lists "Reman" spelling and a "separate Republic faction" as open questions;
  - both of those are now ruled on.
- This is a one-line README fix, not a blocker.

## 4. Follow-ups outside the batch (sheet code and baseline data; I edited nothing)

**F1. Baseline shield lines** (terminal.html l.236-239, same in the sortie copy). Change them to single values:
- `SMALL SHIELD|2|DR:160 HP:40`
- `MEDIUM SHIELD|3|DR:180 HP:160`
- `LARGE SHIELD|5|DR:200 HP:300`
- `TOWER SHIELD|7|DR:240 HP:500`

Until this is done, the sheet reads 60/90/120/180 for these four, so the baseline shields contradict the ruling.

**F2. Optional hardening of armorOf** (l.615). This makes a stray a/b shield read the first number. Replace the shield branch with:
`shOf(n)?+((/(^| )DR:(\d+)/.exec(shOf(n).s)||[0,0,0])[2])`

The one-character alternative is `'Shield':-1` in `ARMOR_REF` (l.608), which makes the index 3 − 1 = 2. It works, but it is obscure.

**F3. Vent ruling (c)** (`heatVent`, l.788). It is not implemented: success sheds `1+ds`, and failure sheds 0 ("NO HEAT SHED"). Minimal fix:
- success: `amt=Math.max(2,1+(ds||0))`;
- failure callback: shed 1 (`t.heat=Math.max(0,heatNow()-1)`).

**F4. Core ruling (a)** (`hitMod`, l.617). It is not implemented: the code still has `if(n=='Core')return -4+dead`, and Crew Cabin uses `-8+dead`. Minimal fix:
- `if(n=='Core')return 0;`
- `if(n=='Crew Cabin')return -8;`

This drops the `+dead` bonus from disabled limbs. Whether the Cabin keeps -8 is Overseer's call.

**F5. Ruling (b).** The sheet does not automate hits per burst; it is a manual GM step. No code change is needed. Overseer does need to define a "degree" (see §3).

## 5. Decisions for Overseer
1. Is a damage-roll "degree" one point of margin, or one Rcl step?
2. Core +0 makes one-hit core kills routine across the baseline. Accept that, or raise core HP or DR?
3. Does Crew Cabin keep -8 under ruling (a)?
4. Purge Valve `RAD:+50_pilot` is inert until a rads counter ships. Keep it or drop it?
5. Optional: buff the Heat-Sink Fins to "a Ready sheds 3".
