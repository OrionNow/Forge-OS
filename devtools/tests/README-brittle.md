# Musha BRITTLE parser test

**Fixture:** `musha-brittle.manifest.txt`. It's a one-frame manifest in the format `txt()` exports (terminal.html:949). The statline is the compact `toStatline()` form of the Musha line in `catalog-additions-pass5.txt`, with the `BRITTLE:` and `NOTE:` tokens added at the end.

## What the parser does today (terminal.html, workspace v5.0.2)
- `parseManifest()` (lines 480–571) runs when `loadManifestFile()` (line 574) loads a file. In the CHASSIS section, the `[EP n] NAME` regex (around line 500) takes the **next line verbatim** as `ch.stat`. The frame line isn't tokenized; only equipment lines go through `parseFmtStats()`. So **BRITTLE is kept as plain text** in `S.ch[1]`.
- No code reads it. There is no `BRITTLE` string anywhere in terminal.html. `statWith()` (line 973) and `chStats()` (line 760) only match `ST/HP\d+`, `DR\d+/\d+`, `MOVE\S+` and `HND/SR±n/n`, so SR stays 2 at any HP. **Kept, but has no effect.**
- **It's dropped on the catalogue path.** `rebuildCH()` → `toStatline()` (lines 381–384) keeps only ST/HP, DR, MOVE, SM, HND and SR. Once the pass-5 Musha line is added to the DB, the CH entry is `ST/HP165 DR650/325 MOVE10L/20S SM+6 HND/SR+2/2`, with BRITTLE and NOTE gone. A Musha built from the catalogue then exports and re-imports with no BRITTLE at all.
- **It's misparsed in colon form.** If the frame line is written in catalogue syntax (`ST/HP:165 DR:650/325 … SR:2 BRITTLE:…`), it's still kept as-is, but none of the compact regexes match. `chStats()` then returns `{ok:false, sr:null}` and the HP/DR/MOVE math fails. Test fixtures must use the compact form.

## Expected result for this fixture (checked in jsdom against the real parseManifest)
| catalogue state | chassis[1] | frameStatus | warnings |
|---|---|---|---|
| Musha not in DB (today) | statline verbatim, including `BRITTLE:-1_SR_below_half_HP` | `missing` | "not in the active catalogue; imported statline and EP capacity retained" + "No chassis-system records…" |
| pass-5 Musha line added to DB | same | `alternate` | "differs from the active catalogue in stats; imported values retained" + "One or more chassis-system slots are missing…" |

`chassis[2]` is `6` and `chassis[3]` is `Mech`. `statWith(chassis[1],[])` returns the string unchanged, which shows BRITTLE is inert.

**Pass criteria once BRITTLE is implemented:** the token survives `toStatline()`, the catalogue state gives `frameStatus` `match`, and SR shows as 1 when Core HP < 50%.

## How to run
Manual: open terminal.html, then [2] MECHANIC → [IMPORT FRAME MANIFEST .TXT] → pick this file, and check the sheet title, SR and the import notes.

Headless (Node 22). The harness lives outside the repo, in /tmp:
```
cd /tmp/xss && npm i jsdom@24
node brittle.mjs /workspace/forge-os/terminal.html /workspace/forge-os/tests/musha-brittle.manifest.txt          # today
node brittle.mjs /workspace/forge-os/terminal.html /workspace/forge-os/tests/musha-brittle.manifest.txt withcat  # with pass-5 line
```
`brittle.mjs` does the following:
1. Loads terminal.html in JSDOM with `runScripts:'dangerously'`, with the forge-hook and mp-bridge `<script src>` tags stripped out.
2. For `withcat`, runs `DB.push(...rebuildDB(mushaLine)); rebuildCH()`.
3. Prints `parseManifest(text)` and `statWith(p.chassis[1],[])`.

A copy is at /tmp/xss/brittle.mjs on the shared box.
