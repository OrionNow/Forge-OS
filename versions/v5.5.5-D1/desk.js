/* FORGE-OS v5.5.5-D1 desktop shell (approved Overseer spec, feedback/v555-d1/SPEC.md).
   Classic script loaded after mp-bridge.js and the 5.5.3 UI script. Game logic, sync and server are unchanged:
   the shell re-hosts the engine's own containers (#bar, #con, #sh, #cb) and renders every open unit itself.
   All units are live: each unit window is rendered on every R() from its own sheet data. The unit the user last
   touched is "routed" (S.cur): its content sits in the light DOM with the real ids, so every engine handler, guard and
   bridge rule works unchanged; every other unit's content sits in a shadow root (same markup, same styles, ids scoped)
   and moves to the light DOM on the first pointer or focus touch. Rolling/editing permissions stay with the engine and
   bridge guards (host or the sheet's owner). Fallback: ?classic or Settings > CLASSIC LAYOUT. */
(function () {
  "use strict";
  const BUILD = "5.5.5-D1";
  const LS = "forge_desk_d1";
  const $ = (id) => document.getElementById(id);
  let P = {};
  try { P = JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { P = {}; }
  if (typeof P !== "object" || !P) P = {};
  P.scale = +P.scale || 1; if (P.snap == null) P.snap = true;
  if (!Array.isArray(P.wins)) P.wins = []; if (!P.slots || typeof P.slots !== "object") P.slots = {};
  const save = () => { try { localStorage.setItem(LS, JSON.stringify(P)); } catch (e) { /* private mode */ } };
  const qs = new URLSearchParams(location.search);
  const classic = qs.has("classic") || window.FORGE_CLASSIC === 1 || P.classic === true;
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  if (classic) { // fallback: the exact v5.5.5 layout, plus one header button back to the desktop
    window.Desk = { on: false, build: BUILD, classic: true };
    const h = document.querySelector("#wrap header .hctl");
    if (h && !qs.has("classic") && window.FORGE_CLASSIC !== 1) {
      const b = document.createElement("button"); b.className = "audio-btn"; b.type = "button"; b.id = "dkBack";
      b.textContent = "[DESKTOP]"; b.title = "Return to the FORGE-OS desktop";
      b.onclick = () => { P.classic = false; save(); location.reload(); };
      h.prepend(b, " ");
    }
    return;
  }

  /* ---------- names ---------- */
  const SEC = [ // unit window sections: key, kanji, English, column
    ["doll", "体", "PAPER DOLL // TELEMETRY", "a"], ["impact", "撃", "IMPACT RESOLUTION", "a"],
    ["skills", "技", "SKILL INPUTS", "a"], ["rolls", "熱", "ROLLS // HEAT", "a"],
    ["sheet", "籍", "CHARACTER SHEET", "b"], ["loadout", "装", "LOADOUT", "b"]];
  const SECN = Object.fromEntries(SEC.map((s) => [s[0], s]));
  const COLN = ["NONE", "CYAN", "VIOLET", "RED", "GOLD", "GREEN"];
  const ICONS = [ // id, kanji, label, title
    ["enc", "戦", "ENCOUNTER", "Encounter: unit tabs, load sheets, sortie state (solo or live table)"],
    ["units", "機", "UNITS", "Unit group: every unit with a chosen tab colour"],
    ["loadout", "装", "LOADOUT", "Frame loadout manifest"],
    ["guest", "造", "ASSEMBLY", "Frame assembly (GUEST clearance)"],
    ["mech", "整", "SERVICE", "Service bay (MECHANIC clearance)"],
    ["cat", "典", "CATALOGUE", "Catalogue editor (key required)"],
    ["ovr", "監", "OVERSEER", "Overseer directorate (key required)"],
    ["set", "設", "SETTINGS", "Settings: theme, audio, UI scale, layout slots"]];
  const THEME_HINT = { "": "TEAL", remus: "AMBER" };

  /* ---------- CSS ---------- */
  const st = document.createElement("style"); st.id = "dkcss"; st.textContent = "body.dk{overflow:hidden}\nhtml:has(body.dk){scrollbar-gutter:auto;overflow:hidden}\nbody.dk #wrap{display:none!important}\n#dk{position:fixed;inset:0;z-index:1;font-family:var(--font,Consolas,\"Courier New\",monospace);color:var(--dk-fg);\n --dk-bg:color-mix(in srgb,var(--bg) 82%,var(--line));--dk-grid:color-mix(in srgb,var(--line) 22%,transparent);\n --dk-win:color-mix(in srgb,var(--bg) 90%,var(--line));--dk-tb:color-mix(in srgb,var(--bg) 75%,var(--line));\n --dk-on:color-mix(in srgb,var(--line) 70%,var(--bg));--dk-on-fg:var(--cyan);--dk-fg:var(--fg);--dk-hi:var(--cyan);--dk-bd:var(--line)}\nbody:not([data-theme]) #dk{--dk-bg:#0c2325;--dk-grid:rgba(110,210,210,.07);--dk-win:#0a1c1e;--dk-tb:#0e2729;--dk-on:#1c4a4b;--dk-on-fg:#d6ffff;--dk-fg:#a8e8e6;--dk-hi:#7ff;--dk-bd:#2c6f6f}\nbody[data-theme=remus] #dk{--dk-bg:#090704;--dk-grid:rgba(230,160,40,.07);--dk-win:#0c0904;--dk-tb:#171006;--dk-on:#e6a21a;--dk-on-fg:#140d02;--dk-fg:#e3a53c;--dk-hi:#7fdcff;--dk-bd:#7a5a1c}\n#dkdesk{position:absolute;inset:0 0 28px 0;background:var(--dk-bg);background-image:linear-gradient(var(--dk-grid) 1px,transparent 1px),linear-gradient(90deg,var(--dk-grid) 1px,transparent 1px);background-size:32px 32px}\n#dkicons{position:absolute;left:8px;top:8px;bottom:8px;width:72px;display:flex;flex-direction:column;gap:6px;z-index:2}\n#dkiconsr{position:absolute;right:8px;top:8px;width:72px;z-index:2}\n.dk-ico{display:flex;flex-direction:column;align-items:center;gap:2px;width:72px;padding:5px 0;background:none;border:1px solid transparent;color:var(--dk-fg);cursor:pointer;font:inherit;min-height:0;height:auto}\n.dk-ico b{font-size:26px;line-height:30px;font-weight:400;color:var(--dk-hi);text-shadow:0 0 6px color-mix(in srgb,var(--dk-hi) 35%,transparent)}\nbody[data-theme=remus] .dk-ico b{color:var(--dk-fg)}\n.dk-ico span{font-size:9px;letter-spacing:.08em}\n.dk-ico:hover,.dk-ico:focus-visible{border-color:var(--dk-bd);background:color-mix(in srgb,var(--dk-on) 30%,transparent);outline:none}\n#dkarea{position:absolute;left:88px;right:88px;top:0;bottom:0;isolation:isolate}\n.dkw{position:absolute;display:flex;flex-direction:column;min-width:240px;min-height:90px;background:var(--dk-win);border:1px solid var(--dk-bd);box-shadow:0 6px 22px rgba(0,0,0,.45)}\n.dkw[hidden]{display:none}\n.dkw.max{left:0!important;top:0!important;width:100%!important;height:100%!important}\n.dk-t{display:flex;align-items:center;gap:6px;height:20px;flex:0 0 20px;padding:0 2px 0 6px;background:var(--dk-tb);border-bottom:1px solid var(--dk-bd);cursor:move;user-select:none;font-size:10px;letter-spacing:.06em;white-space:nowrap;overflow:hidden;color:color-mix(in srgb,var(--dk-fg) 75%,transparent)}\n.dkw.on>.dk-t{background:var(--dk-on);color:var(--dk-on-fg)}\n.dk-t .dk-k{font-size:11px}.dk-t .dk-n{overflow:hidden;text-overflow:ellipsis;flex:1}\n.dk-t .dk-sw{width:9px;height:9px;border:1px solid currentColor;flex:0 0 9px}\n.dk-t .dk-st{font-size:9px;padding:0 4px;border:1px solid currentColor}\n.dkw.on>.dk-t .dk-st{color:inherit}\n.dk-t button{width:18px;height:16px;padding:0;margin:0;border:0;background:none;color:inherit;font:inherit;font-size:11px;line-height:14px;cursor:pointer;min-height:0;box-shadow:none}\n.dk-t button:hover{background:color-mix(in srgb,var(--dk-fg) 22%,transparent)}\n.dk-b{flex:1;overflow:auto;position:relative;container-type:inline-size;padding:6px}\n.dk-h{position:absolute;z-index:3}.dk-h[data-d=n]{top:-3px;left:6px;right:6px;height:6px;cursor:ns-resize}.dk-h[data-d=s]{bottom:-3px;left:6px;right:6px;height:6px;cursor:ns-resize}\n.dk-h[data-d=e]{right:-3px;top:6px;bottom:6px;width:6px;cursor:ew-resize}.dk-h[data-d=w]{left:-3px;top:6px;bottom:6px;width:6px;cursor:ew-resize}\n.dk-h[data-d=ne]{right:-3px;top:-3px;width:10px;height:10px;cursor:nesw-resize}.dk-h[data-d=sw]{left:-3px;bottom:-3px;width:10px;height:10px;cursor:nesw-resize}\n.dk-h[data-d=nw]{left:-3px;top:-3px;width:10px;height:10px;cursor:nwse-resize}.dk-h[data-d=se]{right:-3px;bottom:-3px;width:10px;height:10px;cursor:nwse-resize}\n.dkw.max .dk-h{display:none}\n.dk-unit{display:grid;grid-template-columns:minmax(520px,1.15fr) minmax(360px,1fr);gap:6px;align-items:start}\n@container (max-width:900px){.dk-unit{grid-template-columns:minmax(0,1fr)}}\n.dk-col{display:flex;flex-direction:column;gap:6px;min-width:0}\n.dk-seg{border:1px solid var(--dk-bd);background:color-mix(in srgb,var(--bg) 92%,transparent);min-width:0}\n.dk-sh{display:flex;align-items:center;gap:6px;height:18px;padding:0 4px 0 6px;font-size:9px;letter-spacing:.1em;color:color-mix(in srgb,var(--dk-fg) 80%,transparent);border-bottom:1px solid color-mix(in srgb,var(--dk-bd) 70%,transparent);user-select:none}\n.dk-sh .dk-k{font-size:10px;color:var(--dk-hi)}.dk-sh .dk-n{flex:1}\n.dk-sh button{border:1px solid transparent;background:none;color:inherit;font:inherit;font-size:10px;padding:0 3px;cursor:pointer;min-height:0;height:15px;line-height:13px;box-shadow:none}\n.dk-sh button:hover{border-color:var(--dk-bd)}\n.dk-seg.col>.dk-sb{display:none}.dk-seg.col>.dk-sh{border-bottom:0}\n.dk-sb{padding:6px;min-width:0}\n.dk-sec{display:block;min-width:0}\n.dk-ph{font-size:11px;color:var(--muted);padding:4px 2px}\n.dkw[data-k=sec] .dk-b>.dk-sec{padding:2px}\n#dktask{position:absolute;left:0;right:0;bottom:0;height:28px;display:flex;align-items:center;gap:4px;padding:0 4px;background:color-mix(in srgb,var(--dk-bg) 70%,#000);border-top:1px solid var(--dk-bd);font-size:10px;z-index:50}\n#dktask button{font:inherit;font-size:10px;height:20px;min-height:0;padding:0 8px;background:none;color:var(--dk-fg);border:1px solid color-mix(in srgb,var(--dk-bd) 70%,transparent);cursor:pointer;white-space:nowrap;box-shadow:none}\n#dkstart{letter-spacing:.06em}\n#dktabs{flex:1;display:flex;gap:4px;overflow:hidden;min-width:0}\n#dktabs button{width:150px;min-width:60px;flex:0 1 150px;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block;justify-content:flex-start}\n#dktabs button.on{border-color:var(--dk-hi);color:var(--dk-hi);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--dk-hi) 40%,transparent)}\n#dktabs button.min{opacity:.6}\n#dkstat{display:flex;align-items:center;gap:10px;height:20px;padding:0 8px;border:1px solid color-mix(in srgb,var(--dk-bd) 70%,transparent);white-space:nowrap;color:var(--dk-fg)}\n#dkstat b{font-weight:400;color:var(--dk-hi)}#dkstat .ver{cursor:pointer}\n#dktray{position:relative;width:30px;padding:0!important;font-size:13px!important}\n#dktray.on{border-color:var(--dk-hi)!important;color:var(--dk-hi)!important;background:color-mix(in srgb,var(--dk-on) 45%,transparent)!important}\n#dktray.new::after{content:\"\";position:absolute;top:2px;right:2px;width:5px;height:5px;background:var(--dk-hi)}\n#dkfly{position:absolute;right:4px;bottom:32px;width:var(--fw,480px);height:var(--fh,440px);max-width:calc(100% - 100px);max-height:calc(100% - 40px);display:flex;flex-direction:column;background:var(--dk-win);border:1px solid var(--dk-bd);box-shadow:0 8px 28px rgba(0,0,0,.55);z-index:60}\n#dkfly[hidden]{display:none}\n#dkflyh{display:flex;align-items:center;gap:6px;height:20px;flex:0 0 20px;padding:0 6px;background:var(--dk-on);color:var(--dk-on-fg);font-size:10px;letter-spacing:.06em;user-select:none}\n#dkflyg{width:10px;height:10px;cursor:nwse-resize;border-left:1px solid currentColor;border-top:1px solid currentColor}\n#dkflyb{flex:1;min-height:0;display:flex;flex-direction:column}\n#dkflyb>#cb{flex:1;min-height:0;height:auto!important;max-height:none!important;margin:0!important;display:flex!important;flex-direction:column;border:0;position:static!important;width:auto!important}\n#dkflyb>#cb>#log{flex:1;min-height:60px;height:auto!important;max-height:none!important}\nbody.dk #con,body.dk #sh{position:static!important;height:auto!important;max-height:none!important;min-height:0!important;overflow:visible!important;width:auto!important;max-width:none!important;margin:0!important}\nbody.dk #bar>.panel{margin-top:0!important}\n.dkw[data-k=enc] .dk-b>#con:has(#out:empty){display:none}\n#dkmenu{position:absolute;left:4px;bottom:32px;min-width:240px;background:var(--dk-win);border:1px solid var(--dk-bd);z-index:70;padding:4px;display:flex;flex-direction:column;box-shadow:0 8px 24px rgba(0,0,0,.5)}\n#dkmenu button{display:flex;gap:8px;align-items:center;text-align:left;font:inherit;font-size:11px;padding:4px 8px;background:none;border:1px solid transparent;color:var(--dk-fg);cursor:pointer;min-height:0;box-shadow:none}\n#dkmenu button b{font-weight:400;color:var(--dk-hi);width:16px}\n#dkmenu button:hover,#dkmenu button:focus-visible{border-color:var(--dk-bd);background:color-mix(in srgb,var(--dk-on) 35%,transparent);outline:none}\n#dkmenu hr{border:0;border-top:1px solid var(--dk-bd);margin:3px 0}\n#dkmodal{position:absolute;inset:0;z-index:80;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center}\n#dkmodal>div{min-width:360px;max-width:520px;background:var(--dk-win);border:1px solid var(--dk-bd)}\n#dkmodal .dk-t{cursor:default;background:var(--dk-on);color:var(--dk-on-fg)}\n#dkmodal p{margin:12px;font-size:12px;line-height:1.5}#dkmodal .act{display:flex;gap:8px;justify-content:flex-end;margin:0 12px 12px}\n#dklock{position:absolute;inset:0;z-index:90;background:var(--dk-bg);background-image:radial-gradient(ellipse at 30% 30%,color-mix(in srgb,var(--dk-hi) 9%,transparent),transparent 60%),linear-gradient(var(--dk-grid) 1px,transparent 1px),linear-gradient(90deg,var(--dk-grid) 1px,transparent 1px);background-size:auto,32px 32px,32px 32px;display:flex;overflow:auto}\n#dklock[hidden]{display:none}\n#dklock .lk{margin:auto;display:grid;grid-template-columns:minmax(300px,440px) minmax(440px,660px);gap:32px;padding:32px;align-items:center}\n#dklock .lk-clock{font-size:64px;line-height:1;color:var(--dk-hi);letter-spacing:.02em}\n#dklock .lk-date{font-size:13px;margin:6px 0 22px;color:var(--dk-fg);letter-spacing:.1em}\n#dklock .lk-crest .welcome{margin:0;padding:0;border:0;background:none;text-align:left;align-items:flex-start}\n#dklock .lk-crest .ux-mark{color:var(--dk-hi);margin:0 0 10px}\n#dklock .lk-build{margin-top:18px;font-size:10px;letter-spacing:.12em;color:var(--muted)}\n#dklock .lk-r{border:1px solid var(--dk-bd);background:var(--dk-win);min-width:0}\n#dklock .lk-r>.dk-t{cursor:default;background:var(--dk-on);color:var(--dk-on-fg)}\n#dklock .lk-saved{margin:10px 12px 0;padding:8px 10px;border:1px solid var(--dk-hi);font-size:12px;cursor:pointer;display:flex;gap:10px;align-items:center;background:none;color:var(--dk-fg);font-family:inherit;width:calc(100% - 24px);text-align:left;min-height:0;height:auto}\n#dklock .lk-saved b{color:var(--dk-hi);font-weight:400}\n#dklock .lk-host{padding:8px 12px 12px}\n#dklock .lk-host>#con{border:0!important;background:none!important;box-shadow:none!important;padding:0!important}\n#dklock .lk-host>#con>.pane-head{display:none}\n.dk-grp .sw{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;align-items:center;font-size:10px}\n.dk-grp .sw button{font:inherit;font-size:10px;padding:1px 8px;background:none;color:var(--dk-fg);border:1px solid var(--dk-bd);cursor:pointer;min-height:0;height:auto;box-shadow:none}\n.dk-grp .sw button.on{background:var(--dk-on);color:var(--dk-on-fg)}\n.dk-grp .sw i{display:inline-block;width:8px;height:8px;border:1px solid currentColor;margin-right:5px;vertical-align:-1px}\n.dk-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px}\n.dk-card{display:flex;flex-direction:column;align-items:stretch;gap:2px;padding:6px;border:1px solid var(--dk-bd);background:color-mix(in srgb,var(--bg) 90%,transparent);color:var(--fg);font:inherit;font-size:11px;cursor:pointer;text-align:left;min-height:0;height:auto;box-shadow:none}\n.dk-card:hover,.dk-card:focus-visible{border-color:var(--dk-hi);outline:none}\n.dk-card .doll{height:96px;display:flex;justify-content:center}.dk-card .doll svg{height:96px;width:auto;max-width:100%;pointer-events:none}\n.dk-card .doll .ld,.dk-card .doll .dt{display:none}\n.dk-card .nm2{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--dk-hi)}\n.dk-card .cd{font-size:10px}\n.dk-set{font-size:12px}.dk-set fieldset{border:1px solid var(--dk-bd);margin:0 0 8px;padding:6px 8px}\n.dk-set legend{font-size:9px;letter-spacing:.12em;color:var(--dk-hi);padding:0 4px}\n.dk-set .row2{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:3px 0}\n.dk-set button{font:inherit;font-size:11px;padding:1px 8px;min-height:0;height:auto}\n.dk-set button.on{background:var(--dk-on);color:var(--dk-on-fg);border-color:var(--dk-hi)}\n.dk-set .slot{display:grid;grid-template-columns:24px 1fr auto auto;gap:6px;align-items:center;font-size:11px;margin:2px 0}\n.dk-set .dim2{color:var(--muted);font-size:10px}\n"; document.head.appendChild(st);

  /* ---------- shadow styles: the page's own CSS, with body/html selectors mapped onto a mirrored wrapper ---------- */
  let shSheet = null, shSig = "";
  function splitSel(s) { const out = []; let d = 0, cur = ""; for (const ch of s) { if (ch === "(" || ch === "[") d++; else if (ch === ")" || ch === "]") d--; if (ch === "," && !d) { out.push(cur); cur = ""; } else cur += ch; } out.push(cur); return out; }
  function mapSel(sel) {
    return splitSel(sel).map((p) => {
      let s = p.trim();
      if (/^:root\b/.test(s)) return s.replace(/^:root/, ":host");
      s = s.replace(/^html(?:[.\[:][^\s>+~]*)?\s*(?:>\s*)?(?=body|$)/, "");
      if (/^html\b/.test(s)) return ":host(.dk-never)";
      if (/^body\b/.test(s)) s = s.replace(/^body/, ".dk-root");
      return s || ":host";
    }).join(",");
  }
  function ruleText(r) {
    if (r instanceof CSSStyleRule) return mapSel(r.selectorText) + "{" + r.style.cssText + "}";
    if (r instanceof CSSMediaRule) return "@media " + r.media.mediaText + "{" + [...r.cssRules].map(ruleText).join("") + "}";
    if (typeof CSSSupportsRule !== "undefined" && r instanceof CSSSupportsRule) return "@supports " + r.conditionText + "{" + [...r.cssRules].map(ruleText).join("") + "}";
    if (typeof CSSFontFaceRule !== "undefined" && r instanceof CSSFontFaceRule) return "";
    if (typeof CSSImportRule !== "undefined" && r instanceof CSSImportRule) return "";
    return r.cssText;
  }
  function shadowSheet() {
    const list = [...document.styleSheets].filter((s) => s.ownerNode && s.ownerNode.id !== "dkcss");
    const sig = list.length + ":" + list.map((s) => { try { return s.cssRules.length; } catch (e) { return 0; } }).join(",") + ":" + (document.documentElement.classList.contains("ux-scaled") ? "z" : "n");
    if (shSheet && sig === shSig) return shSheet;
    let txt = "";
    for (const s of list) { let rs; try { rs = s.cssRules; } catch (e) { continue; } for (const r of rs) { try { txt += ruleText(r) + "\n"; } catch (e) { /* skip */ } } }
    txt += ":host{display:block}.dk-root{display:block;background:none!important;min-height:0!important;margin:0!important;padding:0!important;overflow:visible!important;visibility:visible!important;font-family:inherit}.dk-in{display:block}";
    if (!shSheet) shSheet = new CSSStyleSheet();
    shSheet.replaceSync(txt); shSig = sig; return shSheet;
  }
  function mirrorBody(r, ro) { const b = document.body; const c = "dk-root " + [...b.classList].filter((x) => x !== "dk" && x !== "mp-view").join(" ") + (ro ? " mp-view" : ""); if (r.className !== c) r.className = c; for (const a of ["data-theme", "data-view"]) { const v = b.getAttribute(a); if (v == null) r.removeAttribute(a); else if (r.getAttribute(a) !== v) r.setAttribute(a, v); } }

  /* ---------- DOM ---------- */
  const root = document.createElement("div"); root.id = "dk";
  root.innerHTML = `<div id=dkdesk><div id=dkicons role=toolbar aria-label="Desktop icons"></div><div id=dkiconsr></div><div id=dkarea></div></div>
<div id=dktask><button id=dkstart type=button aria-haspopup=menu title="Launch menu">起動 LAUNCH</button><div id=dktabs role=tablist aria-label="Open windows"></div><div id=dkstat aria-live=off></div><button id=dktray type=button aria-pressed=false title="Operator console (chat, rolls, user list). Click again to close." aria-label="Operator console">▤</button></div>
<div id=dkfly hidden role=dialog aria-label="Operator console"><div id=dkflyh><span id=dkflyg title="Drag to resize"></span><span>通信 OPERATOR CONSOLE</span></div><div id=dkflyb></div></div>
<div id=dklock hidden><div class=lk><div><div class=lk-clock id=dklkc></div><div class=lk-date id=dklkd></div><div class=lk-crest id=dklkcrest></div><div class=lk-build>FORGE-OS v${BUILD} // DESKTOP</div></div><div class=lk-r><div class=dk-t><span class=dk-k>鍵</span><span class=dk-n>ACCESS ROUTER // IDENTITY</span></div><div id=dklksaved></div><div class=lk-host id=dklkhost></div></div></div></div>
<div id=dkpark hidden></div>`;
  document.body.appendChild(root);
  document.body.classList.add("dk");
  const area = $("dkarea"), park = $("dkpark"), tabsEl = $("dktabs"), fly = $("dkfly");
  $("dkicons").innerHTML = ICONS.map((i) => `<button class=dk-ico type=button data-ico=${i[0]} title="${esc(i[3])}"><b aria-hidden=true>${i[1]}</b><span>${i[2]}</span></button>`).join("");
  $("dkiconsr").innerHTML = `<button class=dk-ico type=button data-ico=log title="Changelog"><b aria-hidden=true>録</b><span>CHANGELOG</span></button>`;

  /* ---------- helpers ---------- */
  const UKEY = new WeakMap(); let useq = 0;
  function ukey(sh) { if (!sh) return null; if (sh.uid) return "u:" + sh.uid; let k = UKEY.get(sh); if (!k) { k = "l:" + (++useq); UKEY.set(sh, k); } return k; }
  function sheets() { return (typeof S !== "undefined" && Array.isArray(S.sheets)) ? S.sheets : []; }
  function idxOf(k) { const a = sheets(); for (let i = 0; i < a.length; i++) if (ukey(a[i]) === k) return i; return -1; }
  function curKey() { const a = sheets(); return S.cur != null && a[S.cur] ? ukey(a[S.cur]) : null; }
  function vis(sh) { return !!sh && !sh.hidden; }
  function role() { return S.role || ""; }
  const ENCV = ["intel", "sortie"], LOCKV = ["login", "mpw"];
  const inEnc = () => role() === "IMPERIAL INTELLIGENCE";
  function toastD(m) { try { toast(m); } catch (e) { /* optional */ } }
  function el(html) { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function safeLabel(i) { try { return shLabel(i); } catch (e) { return "SHEET " + (i + 1); } }

  /* ---------- windows ---------- */
  const W = new Map(); // id -> {w, e, b}
  const GEO = P.geo && typeof P.geo === "object" ? P.geo : (P.geo = {}); // last geometry of the single engine windows
  let zTop = 10, seq = +P.seq || 0;
  const nid = () => "w" + (++seq);
  const findW = (f) => [...W.values()].find(f);
  function areaSize() { return { w: area.clientWidth || 1000, h: area.clientHeight || 600 }; }
  function persist() { P.seq = seq; P.wins = [...W.values()].map((x) => Object.assign({}, x.w)); W.forEach((x) => { if (["enc", "term", "sheet"].includes(x.w.k)) GEO[x.w.k] = { x: x.w.x, y: x.w.y, w: x.w.w, h: x.w.h, max: !!x.w.max }; }); save(); }
  function viewTitle() { return ({ chassis: "FRAME ASSEMBLY", main: "LOADOUT BUILDER", mechanic: "SERVICE BAY", catalog: "CATALOGUE", catalogEdit: "CATALOGUE EDITOR" })[S.view] || "TERMINAL"; }
  function kanjiTitle(w) {
    if (w.k === "enc") return ["戦", "ENCOUNTER" + (S.view === "intel" ? " // IMPORT FRAME" : "")];
    if (w.k === "term") { const v = S.view, r = role(), a = S.authRole;
      if (v === "deny" || v === "lock") return ["禁", "ACCESS DENIED" + (a ? " // " + a : "")];
      if (v === "pw" || r === "OVERSEER") return ["監", "OVERSEER" + (v === "pw" ? " // KEY REQUIRED" : " // " + viewTitle())];
      if (v === "researchPw" || r === "RESEARCH STAFF") return ["典", "CATALOGUE EDITOR" + (v === "researchPw" ? " // KEY REQUIRED" : "")];
      if (r === "MECHANIC") return ["整", "SERVICE BAY" + (v === "main" ? " // LOADOUT BUILDER" : "")];
      return ["造", viewTitle()]; }
    if (w.k === "sheet") return ["装", role() === "RESEARCH STAFF" ? "RECORD // TELEMETRY" : "LOADOUT // FRAME MANIFEST"];
    if (w.k === "unit") { const i = idxOf(w.u); return ["機", i >= 0 ? safeLabel(i) : "UNIT"]; }
    if (w.k === "sec") { const i = idxOf(w.u), s = SECN[w.s] || ["", "?", "?"]; return [s[1], s[2] + " // " + (i >= 0 ? safeLabel(i) : "UNIT")]; }
    if (w.k === "group") return ["隊", "UNIT GROUP // " + (COLN[w.c || 0] || "NONE")];
    if (w.k === "set") return ["設", "SETTINGS"];
    return ["", String(w.k).toUpperCase()];
  }
  function defGeo(k) {
    if (GEO[k]) return Object.assign({}, GEO[k]);
    const A = areaSize(), n = [...W.values()].filter((x) => x.w.k === k).length, o = 26 * (n % 6);
    const g = { enc: [8, 8, Math.min(900, A.w - 16), 96], term: [8, 8, Math.min(900, A.w * .6), A.h - 16],
      sheet: [Math.min(920, A.w * .6 + 16), 8, Math.max(320, A.w - Math.min(920, A.w * .6 + 16) - 8), A.h - 16],
      unit: [16 + 40 * (n % 6), 112 + 28 * (n % 6), Math.min(1000, A.w - 32), A.h - 124], sec: [A.w * .4 + o, 80 + o, 560, 420],
      group: [A.w - 560 - o, 30 + o, 540, 390], set: [A.w / 2 - 270, 40, 540, Math.min(600, A.h - 60)] }[k] || [40, 40, 600, 400];
    return { x: Math.round(g[0]), y: Math.round(g[1]), w: Math.round(g[2]), h: Math.round(Math.min(g[3], A.h)) };
  }
  function same(spec) { return (v) => v.w.k === spec.k && (spec.k === "set" || ["enc", "term", "sheet"].includes(spec.k) || (spec.k === "unit" && v.w.u === spec.u) || (spec.k === "sec" && v.w.u === spec.u && v.w.s === spec.s)); }
  function open(spec, focus) {
    let x = spec.k === "group" ? null : findW(same(spec));
    if (!x) { const w = Object.assign({ id: nid() }, defGeo(spec.k), spec); x = build(w); }
    x.w.min = false; x.e.hidden = false;
    if (focus !== false) front(x.w.id);
    if (spec.k === "sec") { const u = findW((v) => v.w.k === "unit" && v.w.u === spec.u); if (u) paintUnitChrome(u); }
    persist(); paintTabs(); return x;
  }
  function build(w) {
    const e = el(`<div class=dkw data-id="${w.id}" data-k="${w.k}" role=dialog><div class=dk-t><span class=dk-sw hidden></span><span class=dk-k aria-hidden=true></span><span class=dk-n></span><span class=dk-st hidden></span>${w.k === "sec" ? `<button type=button data-a=dock title="Dock back into the unit window" aria-label="Dock back">⇲</button>` : ""}<button type=button data-a=min title=Minimize aria-label=Minimize>_</button><button type=button data-a=max title="Maximize / restore" aria-label=Maximize>□</button><button type=button data-a=close title=Close aria-label=Close>×</button></div><div class=dk-b></div>${["n", "s", "e", "w", "ne", "nw", "se", "sw"].map((d) => `<div class=dk-h data-d=${d}></div>`).join("")}</div>`);
    const x = { w, e, b: e.querySelector(".dk-b") };
    W.set(w.id, x); area.appendChild(e); place(x);
    if (w.k === "unit") buildUnit(x);
    if (w.k === "sec") x.b.appendChild(host(w.u, w.s));
    if (w.k === "group") x.b.innerHTML = `<div class=dk-grp></div>`;
    if (w.k === "set") x.b.innerHTML = `<div class=dk-set></div>`;
    const [k, n] = kanjiTitle(w); e.querySelector(".dk-k").textContent = k; e.querySelector(".dk-n").textContent = n;
    if (w.z) zTop = Math.max(zTop, w.z);
    return x;
  }
  function place(x) { const w = x.w, A = areaSize(); w.w = Math.max(240, Math.min(w.w, A.w)); w.h = Math.max(90, Math.min(w.h, A.h)); w.x = Math.max(0, Math.min(w.x, A.w - 80)); w.y = Math.max(0, Math.min(w.y, A.h - 22));
    Object.assign(x.e.style, { left: w.x + "px", top: w.y + "px", width: w.w + "px", height: w.h + "px", zIndex: w.z || 10 }); x.e.classList.toggle("max", !!w.max); x.e.hidden = !!w.min;
    const mb = x.e.querySelector("[data-a=max]"); if (mb) { mb.textContent = w.max ? "❐" : "□"; mb.setAttribute("aria-label", w.max ? "Restore" : "Maximize"); } }
  function front(id) { const x = W.get(id); if (!x) return; if (zTop > 900) { [...W.values()].sort((a, b) => (a.w.z || 0) - (b.w.z || 0)).forEach((v, i) => { v.w.z = 10 + i; v.e.style.zIndex = v.w.z; }); zTop = 10 + W.size; }
    x.w.z = ++zTop; x.e.style.zIndex = x.w.z; W.forEach((v) => { v.e.classList.toggle("on", v === x); if (v === x) v.e.setAttribute("aria-current", "true"); else v.e.removeAttribute("aria-current"); }); paintTabs(); }
  function activeId() { let best = null; W.forEach((v) => { if (!v.e.hidden && v.e.style.display !== "none" && (!best || (v.w.z || 0) > (best.w.z || 0))) best = v; }); return best && best.w.id; }
  function detach(x) { for (const n of [...x.b.querySelectorAll("#bar,#con,#sh")]) park.appendChild(n); }
  function close(id, quiet) {
    const x = W.get(id); if (!x) return; const w = x.w;
    if (w.k === "unit") [...W.values()].filter((v) => v.w.k === "sec" && v.w.u === w.u).forEach((v) => close(v.w.id, true));
    detach(x); W.delete(id); x.e.remove();
    if (w.k === "sec") { const u = findW((v) => v.w.k === "unit" && v.w.u === w.u); if (u) paintUnitChrome(u); else HOSTS.delete(w.u + "|" + w.s); }
    if (w.k === "unit") HOSTS.forEach((h, k) => { if (k.startsWith(w.u + "|") && !h.isConnected) HOSTS.delete(k); });
    if (["enc", "term", "sheet"].includes(w.k) && !quiet) closedEngine.add(w.k);
    persist(); if (!quiet) { const a = activeId(); if (a) front(a); else paintTabs(); }
  }
  function minimize(id) { const x = W.get(id); if (!x) return; x.w.min = true; x.e.hidden = true; persist(); const a = activeId(); if (a) front(a); else paintTabs(); }
  function restore(id) { const x = W.get(id); if (!x) return; x.w.min = false; x.e.hidden = false; front(id); persist(); }
  function toggleMax(id) { const x = W.get(id); if (!x) return; x.w.max = !x.w.max; place(x); front(id); persist(); }

  /* drag by the title bar, resize from any edge or corner (scale-aware, optional 8px snap) */
  let drag = null;
  area.addEventListener("pointerdown", (e) => {
    const win = e.target.closest(".dkw"); if (!win || !area.contains(win)) return; const x = W.get(win.dataset.id); if (!x) return;
    if (!e.target.closest(".dk-t button")) front(x.w.id);
    const hd = e.target.closest(".dk-h"), tb = e.target.closest(".dk-t");
    if (e.button !== 0 || (!hd && !tb) || e.target.closest("button")) return;
    if (tb && x.w.max) return;
    e.preventDefault();
    drag = { x, d: hd ? hd.dataset.d : "move", sx: e.clientX, sy: e.clientY, g: { x: x.w.x, y: x.w.y, w: x.w.w, h: x.w.h } };
    try { (hd || tb).setPointerCapture(e.pointerId); } catch (_) { /* ok */ }
  });
  area.addEventListener("pointermove", (e) => {
    if (!drag) return; const s = P.scale || 1, dx = (e.clientX - drag.sx) / s, dy = (e.clientY - drag.sy) / s, g = drag.g, w = drag.x.w, d = drag.d;
    const sn = (v) => P.snap ? Math.round(v / 8) * 8 : Math.round(v);
    if (d === "move") { w.x = sn(g.x + dx); w.y = sn(g.y + dy); }
    else {
      if (d.includes("e")) w.w = Math.max(240, sn(g.w + dx)); if (d.includes("s")) w.h = Math.max(90, sn(g.h + dy));
      if (d.includes("w")) { const nw = Math.max(240, sn(g.w - dx)); w.x = g.x + g.w - nw; w.w = nw; }
      if (d.includes("n")) { const nh = Math.max(90, sn(g.h - dy)); w.y = g.y + g.h - nh; w.h = nh; }
    }
    place(drag.x);
  });
  const endDrag = () => { if (drag) { drag = null; persist(); } };
  area.addEventListener("pointerup", endDrag); area.addEventListener("pointercancel", endDrag);
  area.addEventListener("dblclick", (e) => { const t = e.target.closest(".dk-t"); if (t && !e.target.closest("button")) toggleMax(t.parentNode.dataset.id); });
  area.addEventListener("click", (e) => {
    const b = e.target.closest(".dk-t button,.dk-sh button"); if (!b) return; const win = b.closest(".dkw"), id = win && win.dataset.id, x = W.get(id); if (!x) return;
    const a = b.dataset.a;
    if (a === "min") minimize(id); else if (a === "max") toggleMax(id); else if (a === "close" || a === "dock") close(id);
    else if (a === "col") { const s = b.closest(".dk-seg").dataset.s; x.w.col = x.w.col || {}; x.w.col[s] = !x.w.col[s]; paintUnitChrome(x); persist(); }
    else if (a === "pop") { const s = b.closest(".dk-seg").dataset.s, A = areaSize(); open({ k: "sec", u: x.w.u, s, x: Math.min(x.w.x + 80, A.w - 560), y: Math.min(x.w.y + 50, A.h - 300) }); }
    else if (a === "dockseg") { const s = b.closest(".dk-seg").dataset.s, ex = findW((v) => v.w.k === "sec" && v.w.u === x.w.u && v.w.s === s); if (ex) close(ex.w.id); }
  });

  /* ---------- section hosts: light DOM when the unit is routed, shadow root otherwise ---------- */
  const HOSTS = new Map();
  function host(u, s) {
    const k = u + "|" + s; let h = HOSTS.get(k); if (h) return h;
    h = document.createElement("div"); h.className = "dk-sec"; h.dataset.u = u; h.dataset.s = s;
    const r = h.attachShadow({ mode: "open" }); r.adoptedStyleSheets = [shadowSheet()];
    r.innerHTML = `<div class=dk-root><div class=dk-in></div><slot></slot></div>`;
    HOSTS.set(k, h); return h;
  }
  const shIn = (h) => h.shadowRoot.querySelector(".dk-in");
  function buildUnit(x) {
    const seg = (s) => `<div class=dk-seg data-s="${s[0]}"><div class=dk-sh><span class=dk-k aria-hidden=true>${s[1]}</span><span class=dk-n>${s[2]}</span><button type=button data-a=col aria-expanded=true title="Collapse / expand">[–]</button><button type=button data-a=pop title="Pop out into its own window">⇱</button></div><div class=dk-sb></div></div>`;
    x.b.innerHTML = `<div class=dk-unit><div class=dk-col>${SEC.filter((s) => s[3] === "a").map(seg).join("")}</div><div class=dk-col>${SEC.filter((s) => s[3] === "b").map(seg).join("")}</div></div>`;
    paintUnitChrome(x);
  }
  function paintUnitChrome(x) {
    const w = x.w; w.col = w.col || {};
    x.b.querySelectorAll(".dk-seg").forEach((sg) => {
      const s = sg.dataset.s, popped = !!findW((v) => v.w.k === "sec" && v.w.u === w.u && v.w.s === s), sb = sg.querySelector(".dk-sb");
      sg.classList.toggle("col", !!w.col[s]); const cb = sg.querySelector("[data-a=col]"); cb.textContent = w.col[s] ? "[+]" : "[–]"; cb.setAttribute("aria-expanded", String(!w.col[s]));
      const pb = sg.querySelector("[data-a=pop],[data-a=dockseg]");
      if (popped) { pb.dataset.a = "dockseg"; pb.textContent = "⇲"; pb.title = "Dock back into this window"; if (!sb.querySelector(".dk-ph")) sb.innerHTML = `<div class=dk-ph>⇱ POPPED OUT INTO ITS OWN WINDOW // ⇲ docks it back</div>`; }
      else { pb.dataset.a = "pop"; pb.textContent = "⇱"; pb.title = "Pop out into its own window"; const h = host(w.u, s); if (h.parentNode !== sb) sb.replaceChildren(h); }
    });
  }

  /* ---------- unit rendering: every unit from its own sheet data, through the engine's (and bridge's) own views ---------- */
  const CACHE = new Map();
  function renderUnit(i) {
    const sh = sheets()[i], cur = i === S.cur, kc = S.cur; let keep = null;
    if (!cur) { keep = shSnap(); S.cur = i; let d; try { d = structuredClone(sh.d || {}); } catch (e) { d = JSON.parse(JSON.stringify(sh.d || {})); } shApply(d); }
    try {
      let t = null; try { t = tel(); } catch (e) { t = null; }
      if (!t || !S.ch) return { empty: true, name: safeLabel(i), col: sh.col || 0 };
      const out = S.info != null ? infoView() : sortieView();
      const shh = realSheet(); const ro = document.body.classList.contains("mp-view");
      let st = ["--", "dim"], ig = ""; try { st = frameStatus(); ig = igOf(); } catch (e) { /* empty */ }
      return { out, sh: shh, ro, st, ig, name: safeLabel(i), col: sh.col || 0 };
    } catch (e) { console.error("[desk] render", e); return { empty: true, err: String(e && e.message || e), name: safeLabel(i), col: sh.col || 0 }; }
    finally { if (!cur) { S.cur = kc; shApply(keep); } }
  }
  function splitUnit(r) {
    const o = { doll: [], impact: [], skills: [], rolls: [], sheet: [], loadout: [] };
    if (r.empty) { o.doll.push(el(`<div class=dk-ph>${r.err ? "RENDER FAULT // " + esc(r.err) : "NO TELEMETRY // load a frame manifest for this unit"}</div>`)); }
    else {
      const T = document.createElement("template"); T.innerHTML = r.out; let past = false;
      for (const n of [...T.content.childNodes]) {
        if (n.nodeType !== 1) { if (n.textContent.trim()) o.impact.push(n); continue; }
        const c = n.classList;
        if (c.contains("pilot")) { const pb = n.querySelector(":scope>.pbot"); if (pb) { const w = document.createElement("div"); w.className = "pilot"; w.appendChild(pb); o.rolls.push(w); } o.skills.push(n); }
        else if (!past && !c.contains("damagebox")) { o.doll.push(n); if (c.contains("sorfoot")) past = true; }
        else { past = true; o.impact.push(n); }
      }
      const T2 = document.createElement("template"); T2.innerHTML = r.sh || ""; let lo = false;
      for (const n of [...T2.content.childNodes]) {
        if (!lo && n.nodeType === 1 && n.classList.contains("shh")) { const k = n.querySelector(".shtl"); if (k && k.dataset.k && k.dataset.k !== "CH") lo = true; }
        (lo ? o.loadout : o.sheet).push(n);
      }
    }
    const ro = () => el(`<div class=dk-ph>VIEW ONLY // the host or this unit's assigned pilot rolls and edits here</div>`);
    if (!r.empty) { if (!o.skills.length) o.skills.push(ro()); if (!o.rolls.length) o.rolls.push(ro()); if (!o.impact.length) o.impact.push(el(`<div class=dk-ph>--</div>`)); }
    return o;
  }
  const FQ = "input,select,textarea,button,[tabindex]";
  function fsnap() {
    let a = document.activeElement, h = null;
    if (a && a.classList && a.classList.contains("dk-sec")) { h = a; a = a.shadowRoot.activeElement; } else h = a && a.closest ? a.closest(".dk-sec") : null;
    if (!h || !a) return null; const r = h.shadowRoot.contains(a) ? shIn(h) : h;
    return { k: h.dataset.u + "|" + h.dataset.s, i: [...r.querySelectorAll(FQ)].indexOf(a), skill: a.dataset ? a.dataset.skill : null, sel: typeof a.selectionStart === "number" ? [a.selectionStart, a.selectionEnd] : null };
  }
  function frestore(f) {
    if (!f) return; const ae = document.activeElement;
    if (ae && ae !== document.body && ae.isConnected && !(ae.closest && ae.closest("#dkpark")) && !ae.classList.contains("dk-sec")) return;
    const h = HOSTS.get(f.k); if (!h || !h.isConnected) return; const r = h.firstChild ? h : shIn(h);
    let t = f.skill ? r.querySelector(`[data-skill="${CSS.escape(f.skill)}"]`) : null;
    if (!t && f.i >= 0) t = [...r.querySelectorAll(FQ)][f.i];
    if (!t) return; try { t.focus({ preventScroll: true }); if (f.sel && t.setSelectionRange) t.setSelectionRange(f.sel[0], f.sel[1]); } catch (e) { /* ok */ }
  }
  const seen = new Set();
  function autoOpen() {
    const me = window.__forgeSelf || "", mp = document.body.classList.contains("mp-live");
    sheets().forEach((sh) => { const k = ukey(sh); if (!vis(sh) || seen.has(k)) return; seen.add(k);
      const n = [...W.values()].filter((v) => v.w.k === "unit").length;
      if ((mp && me && sh.ownerId === me) || n < (mp ? 2 : 3)) open({ k: "unit", u: k }, false); });
  }
  function renderUnits(pre) {
    const all = sheets();
    try { if (all.length && S.cur != null && all[S.cur]) shSave(); } catch (e) { /* ok */ }
    autoOpen();
    [...W.values()].forEach((v) => { if ((v.w.k === "unit" || v.w.k === "sec") && idxOf(v.w.u) < 0) close(v.w.id, true); });
    const ck = curKey(), need = new Set([...W.values()].filter((v) => v.w.k === "unit" || v.w.k === "sec").map((v) => v.w.u));
    const gcols = new Set([...W.values()].filter((v) => v.w.k === "group").map((v) => v.w.c || 0));
    const sheet = shadowSheet(); CACHE.clear();
    all.forEach((sh, i) => {
      const k = ukey(sh); if (!vis(sh) || (!need.has(k) && !gcols.has(sh.col || 0))) return;
      if (i === S.cur && pre && pre.k === k && pre.hp) S.uiHP = pre.hp;
      const r = renderUnit(i); CACHE.set(k, r);
      if (!need.has(k)) return;
      const parts = splitUnit(r), light = k === ck;
      for (const s of SEC) {
        const h = host(k, s[0]); if (h.shadowRoot.adoptedStyleSheets[0] !== sheet) h.shadowRoot.adoptedStyleSheets = [sheet];
        h.dataset.ro = r.ro ? "1" : ""; mirrorBody(h.shadowRoot.firstElementChild, !!r.ro);
        if (light) { shIn(h).replaceChildren(); h.replaceChildren(...parts[s[0]]); }
        else { h.replaceChildren(); shIn(h).replaceChildren(...parts[s[0]]); shIn(h).querySelectorAll(".hpfill[data-target]").forEach((f) => { f.style.width = f.dataset.target + "%"; }); }
      }
    });
    const cr = ck && CACHE.get(ck); if (cr) document.body.classList.toggle("mp-view", !!cr.ro);
    try { animateHpBars(); } catch (e) { /* ok */ }
    try { shCrawl(); } catch (e) { /* ok */ }
  }

  /* route: the touched unit becomes S.cur; nothing re-renders. Its nodes move from its shadow roots to the light DOM
     (light ids), the previous unit's nodes move back. A pointer press defers the node move to the click's capture
     phase (the click path is fixed by then) so moving the pressed node never swallows the click. */
  function settle() {
    mvPend = false; const ck = curKey();
    HOSTS.forEach((h, key) => {
      const mine = !!ck && key.startsWith(ck + "|");
      if (!mine && h.firstChild) shIn(h).replaceChildren(...h.childNodes);
      else if (mine && shIn(h).firstChild) h.replaceChildren(...shIn(h).childNodes);
    });
  }
  let mvPend = false;
  function route(k, later) {
    const i = idxOf(k); if (i < 0 || i === S.cur) { if (!later && mvPend) settle(); return false; }
    const old = curKey();
    /* commit a pending change on the old unit's field before switching, so its handler writes to the right unit */
    const ae = document.activeElement; if (old && ae && ae !== document.body) { const hh = ae.closest && ae.closest(".dk-sec"); if (hh && hh.dataset.u === old) { try { ae.blur(); } catch (e) { /* ok */ } } }
    if (i === S.cur) return false;
    try { shSave(); } catch (e) { /* ok */ }
    S.cur = i; shApply(S.sheets[i].d); S.shEdit = -1;
    if (later) mvPend = true; else settle();
    const r = CACHE.get(k); document.body.classList.toggle("mp-view", !!(r && r.ro));
    return true;
  }
  let pdown = false, pend = false;
  document.addEventListener("pointerdown", () => { pdown = true; }, true);
  document.addEventListener("click", () => { if (mvPend) settle(); }, true);
  addEventListener("pointerup", () => setTimeout(() => { if (mvPend) { const t = document.activeElement; settle(); if (t && t.isConnected && document.activeElement !== t) try { t.focus({ preventScroll: true }); } catch (_) { /* ok */ } } }, 0), true);
  function onTouch(e) {
    const path = e.composedPath ? e.composedPath() : [];
    const h = path.find((n) => n && n.classList && n.classList.contains("dk-sec")); if (!h) return;
    const t = path[0];
    if (e.type === "pointerdown") { route(h.dataset.u, true); return; }
    if (pdown && mvPend) return;
    if (route(h.dataset.u) && t && t.isConnected && document.activeElement !== t) { try { t.focus({ preventScroll: true }); } catch (_) { /* ok */ } }
  }
  document.addEventListener("pointerdown", onTouch, true);
  document.addEventListener("focusin", onTouch, true);

  /* ---------- unit group windows ---------- */
  function paintGroup(x) {
    const c = x.w.c || 0, g = x.b.querySelector(".dk-grp"); if (!g) return;
    const cols = typeof SH_COL !== "undefined" ? SH_COL : ["", "#2ee6e6", "#b57bff", "#ff5a5a", "#ffd23a", "#4ade80"];
    const sw = cols.map((h, i) => `<button type=button data-c=${i} class="${i === c ? "on" : ""}" aria-pressed=${i === c}><i style="color:${h || "#5f6366"};background:${h || "transparent"}"></i>${COLN[i] || i}</button>`).join("");
    const cards = sheets().map((sh, i) => [sh, i]).filter(([sh]) => vis(sh) && (sh.col || 0) === c).map(([sh, i]) => {
      const k = ukey(sh); let r = CACHE.get(k); if (!r && S.view === "sortie") { r = renderUnit(i); CACHE.set(k, r); } if (!r) r = { empty: true, name: safeLabel(i) };
      let svg = ""; if (!r.empty) { const T = document.createElement("template"); T.innerHTML = r.out; const s = T.content.querySelector(".mechmap svg,.vehmap svg,svg"); if (s) { s.querySelectorAll("[onclick],[data-menu],[id]").forEach((n) => { n.removeAttribute("onclick"); n.removeAttribute("data-menu"); n.removeAttribute("id"); }); svg = s.outerHTML; } }
      const st = r.st || ["--", "dim"];
      return `<button type=button class=dk-card data-u="${esc(k)}" title="Open ${esc(r.name)}"><span class=doll aria-hidden=true>${svg || "<span class=dim>NO TELEMETRY</span>"}</span><span class=nm2>${esc(r.name)}</span><span class=cd>STATUS <b class="${esc(st[1])}">${esc(st[0])}</b>${r.ig !== "" && r.ig != null ? ` <span class=dim>// INTEGRITY ${esc(r.ig)}%</span>` : ""}</span></button>`;
    });
    g.innerHTML = `<div class=sw><span class=dim>TAB COLOUR</span>${sw}</div><div class=dk-cards>${cards.join("") || `<div class=dk-ph>NO UNITS WITH THIS TAB COLOUR</div>`}</div>`;
  }
  area.addEventListener("click", (e) => {
    const g = e.target.closest(".dk-grp"); if (!g) return; const x = W.get(g.closest(".dkw").dataset.id); if (!x) return;
    const cb = e.target.closest("button[data-c]"); if (cb) { x.w.c = +cb.dataset.c; persist(); sync(); return; }
    const card = e.target.closest(".dk-card"); if (card && idxOf(card.dataset.u) >= 0) { open({ k: "unit", u: card.dataset.u }); sync(); }
  });

  /* ---------- settings ---------- */
  function paintSettings(x) {
    const s = x.b.querySelector(".dk-set"); if (!s) return; const ti = typeof themeIdx === "number" ? themeIdx : 0;
    const th = (typeof THEMES !== "undefined" ? THEMES : []).map((t, i) => `<button type=button data-th=${i} class="${i === ti ? "on" : ""}" aria-pressed=${i === ti}>${esc(t[1])}${THEME_HINT[t[0]] ? " // " + THEME_HINT[t[0]] : ""}</button>`).join("");
    const muted = typeof audioMuted !== "undefined" ? audioMuted : true;
    const sc = [0.8, 0.9, 1, 1.1, 1.25, 1.5].map((v) => `<button type=button data-sc=${v} class="${Math.abs(v - P.scale) < .01 ? "on" : ""}" aria-pressed=${Math.abs(v - P.scale) < .01}>${Math.round(v * 100)}%</button>`).join("");
    const slots = [1, 2, 3, 4, 5].map((n) => { const o = P.slots[n]; return `<div class=slot><b>${n}</b><span class=dim2>${o ? esc(o.name) : "EMPTY"}</span><button type=button data-ss=${n}>SAVE</button><button type=button data-sl=${n} ${o ? "" : "disabled"}>LOAD</button></div>`; }).join("");
    s.innerHTML = `<fieldset><legend>THEME // RESTYLES THE DESKTOP</legend><div class=row2>${th}</div></fieldset>
<fieldset><legend>AUDIO</legend><div class=row2><button type=button data-au=1 class="${muted ? "" : "on"}" aria-pressed=${!muted}>${muted ? "[AUDIO: MUTED]" : "[AUDIO: ON]"}</button><span class=dim2>terminal audio feedback</span></div></fieldset>
<fieldset><legend>UI SCALE</legend><div class=row2>${sc}</div></fieldset>
<fieldset><legend>LAYOUT SLOTS</legend>${slots}<div class=dim2>A slot keeps every open window: position, size, collapsed and popped-out sections, unit groups.</div></fieldset>
<fieldset><legend>DESKTOP</legend><div class=row2><button type=button data-snap=1 class="${P.snap ? "on" : ""}" aria-pressed=${!!P.snap}>SNAP TO 8PX GRID: ${P.snap ? "ON" : "OFF"}</button><button type=button data-reset=1>RESET LAYOUT</button><button type=button data-classic=1 title="The v5.5.5 single-page layout (reloads the page)">CLASSIC LAYOUT</button></div></fieldset>
<div class=dim2>FORGE-OS v${BUILD} // rules engine v${typeof APP_VERSION !== "undefined" ? APP_VERSION : "?"}</div>`;
  }
  area.addEventListener("click", (e) => {
    const s = e.target.closest(".dk-set"); if (!s) return; const b = e.target.closest("button"); if (!b) return; const x = W.get(s.closest(".dkw").dataset.id);
    if (b.dataset.th != null) { themeIdx = +b.dataset.th; try { localStorage.setItem("forgeTheme", themeIdx); } catch (_) { /* ok */ } applyTheme(); try { audioEvent("open", true); } catch (_) { /* ok */ } sync(); return; }
    if (b.dataset.au) toggleMute();
    else if (b.dataset.sc) { P.scale = +b.dataset.sc; save(); applyScale(); }
    else if (b.dataset.ss) saveSlot(+b.dataset.ss);
    else if (b.dataset.sl) loadSlot(+b.dataset.sl);
    else if (b.dataset.snap) { P.snap = !P.snap; save(); }
    else if (b.dataset.reset) { resetLayout(); return; }
    else if (b.dataset.classic) { P.classic = true; save(); location.reload(); return; }
    if (x) paintSettings(x);
  });
  function applyScale() { root.style.zoom = P.scale === 1 ? "" : String(P.scale); W.forEach(place); }
  function saveSlot(n) {
    const ws = [...W.values()].map((v) => JSON.parse(JSON.stringify(v.w))), u = ws.filter((w) => w.k === "unit").length, d = new Date(), p = (x) => String(x).padStart(2, "0");
    P.slots[n] = { v: 1, name: `${ws.length} WIN · ${u} UNIT · ${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`, wins: ws }; save(); toastD("LAYOUT SLOT " + n + " SAVED");
  }
  function loadSlot(n) {
    const o = P.slots[n]; if (!o || o.v !== 1 || !Array.isArray(o.wins)) { toastD("LAYOUT SLOT " + n + " :: EMPTY OR UNREADABLE"); return false; }
    [...W.keys()].forEach((id) => close(id, true)); closedEngine.clear();
    const ok = (w) => w && typeof w === "object" && ["enc", "term", "sheet", "unit", "sec", "group", "set"].includes(w.k) && ((w.k !== "unit" && w.k !== "sec") || idxOf(w.u) >= 0) && (w.k !== "sec" || SECN[w.s]);
    o.wins.filter(ok).sort((a, b) => (a.k === "sec") - (b.k === "sec")).forEach((w) => {
      if (["enc", "term", "sheet"].includes(w.k)) { GEO[w.k] = { x: w.x, y: w.y, w: w.w, h: w.h, max: !!w.max }; return; }
      if (findW(same(w)) && w.k !== "group") return;
      const c = Object.assign({}, w, { id: nid() }); build(c); });
    W.forEach((v) => { if (v.w.k === "unit") paintUnitChrome(v); });
    persist(); sync(); toastD("LAYOUT SLOT " + n + " LOADED"); return true;
  }
  function resetLayout() { [...W.keys()].forEach((id) => close(id, true)); closedEngine.clear(); for (const k in GEO) delete GEO[k]; seen.clear(); persist(); sync(); }

  /* ---------- the engine's containers: lock screen, ENCOUNTER / terminal windows, LOADOUT window, console flyout ---------- */
  const closedEngine = new Set(); let lastMode = "";
  function engineWanted(k) {
    const v = S.view; if (LOCKV.includes(v)) return false;
    if (k === "enc") return ENCV.includes(v);
    if (k === "term") return !ENCV.includes(v);
    if (k === "sheet") return !ENCV.includes(v) && !!($("sh") && $("sh").textContent.trim());
    return false;
  }
  function placeEngine() {
    const v = S.view, locked = LOCKV.includes(v), bar = $("bar"), con = $("con"), sh = $("sh"), cb = $("cb");
    const lk = $("dklock"), was = lk.hidden; lk.hidden = !locked;
    const mode = locked ? "lock" : ENCV.includes(v) ? "enc" : "term:" + role() + ":" + (S.authRole || "") + ":" + v;
    if (mode !== lastMode) { closedEngine.clear(); lastMode = mode; }
    if (locked && was) lockShow();
    if (cb && cb.parentNode !== $("dkflyb")) $("dkflyb").appendChild(cb);
    if (locked) { if (con.parentNode !== $("dklkhost")) $("dklkhost").appendChild(con); lockSaved(); }
    for (const k of ["enc", "term", "sheet"]) {
      let x = findW((q) => q.w.k === k);
      if (!engineWanted(k)) { if (x) close(x.w.id, true); continue; }
      if (!x && !closedEngine.has(k)) x = open({ k }, k !== "sheet");
      if (!x) continue;
      if (k === "sheet") { if (sh.parentNode !== x.b) x.b.appendChild(sh); }
      else { if (bar.parentNode !== x.b) x.b.prepend(bar); if (con.parentNode !== x.b) x.b.appendChild(con); }
    }
    if (!con.closest(".dkw") && !locked && con.parentNode !== park) park.appendChild(con);
    if (!bar.closest(".dkw") && bar.parentNode !== park) park.appendChild(bar);
    if (!sh.closest(".dkw") && sh.parentNode !== park) park.appendChild(sh);
    if (v === "sortie") { const o = $("out"); if (o && o.firstChild) o.replaceChildren(); if (sh.firstChild) sh.replaceChildren(); }
    W.forEach((x) => { if (x.w.k === "unit" || x.w.k === "sec") x.e.style.display = v === "sortie" ? "" : "none"; });
  }
  // play() can fill #out / #sh after R() returns (animated navigation): keep the sortie sink empty
  /* a re-render between pointerdown and click would swallow the click, so async re-renders wait for the pointer to lift */
  let qsync = 0;
  const queueSync = () => { if (pdown) { pend = true; return; } if (!qsync) qsync = requestAnimationFrame(() => { qsync = 0; sync(); }); };
  const lift = () => { setTimeout(() => { pdown = false; if (pend) { pend = false; queueSync(); } }, 0); };
  addEventListener("pointerup", lift, true); addEventListener("pointercancel", lift, true);
  const sinkObs = new MutationObserver(() => { if (S.view !== "sortie") return; const o = $("out"), sh = $("sh"); if ((o && o.firstChild) || (sh && sh.firstChild)) { if (o) o.replaceChildren(); if (sh) sh.replaceChildren(); queueSync(); } });
  sinkObs.observe($("out"), { childList: true }); sinkObs.observe($("sh"), { childList: true });

  /* ---------- lock screen (every connect: page load and every logout) ---------- */
  function lockShow() {
    const c = $("dklkcrest");
    try { c.innerHTML = welcomePanel(); c.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id")); if (typeof crawl === "function") crawl(c, 1); } catch (e) { c.textContent = "WELCOME TO THE CORE EMPIRE MILITARY DATABASE"; }
    tickLock();
  }
  function lockSaved() {
    const b = $("dklksaved"); let n = ""; try { n = (localStorage.getItem("forge_mp_callsign") || "").trim(); } catch (e) { n = ""; }
    const ok = S.view === "login" && /^[A-Za-z0-9][A-Za-z0-9 ._-]{0,15}$/.test(n) && n.toUpperCase() !== "USER UNKNOWN";
    const html = ok ? `<button type=button class=lk-saved id=dkSaved title="Connect to the live table as ${esc(n)}"><b>◆</b><span>SAVED CALLSIGN <b>${esc(n)}</b> // LIVE DATA INTERCEPT</span><span class=dim style="margin-left:auto">CONNECT ▸</span></button>` : "";
    if (b.innerHTML !== html) b.innerHTML = html;
  }
  root.addEventListener("click", (e) => { if (e.target.closest("#dkSaved")) login(6); });
  function tickLock() { if ($("dklock").hidden) return; let t = { d: "", t: "" }; try { t = sectorStamp(); } catch (e) { /* ok */ } $("dklkc").textContent = t.t.slice(0, 5); $("dklkd").textContent = String(t.d).toUpperCase() + " // SECTOR STANDARD TIME"; }

  /* ---------- taskbar ---------- */
  function paintTitles() {
    W.forEach((x) => {
      const [k, n] = kanjiTitle(x.w); x.e.querySelector(".dk-k").textContent = k; x.e.querySelector(".dk-n").textContent = n; x.e.setAttribute("aria-label", n);
      const sw = x.e.querySelector(".dk-sw"), stE = x.e.querySelector(".dk-st");
      if (["unit", "sec", "group"].includes(x.w.k)) { const i = x.w.k === "group" ? -1 : idxOf(x.w.u), col = x.w.k === "group" ? (x.w.c || 0) : (i >= 0 ? sheets()[i].col || 0 : 0), h = (typeof SH_COL !== "undefined" && SH_COL[col]) || "#5f6366"; sw.hidden = false; sw.style.background = h; sw.style.color = h; sw.title = "Tab colour " + (COLN[col] || col); }
      if (x.w.k === "unit") { const r = CACHE.get(x.w.u); if (r && r.st) { stE.hidden = false; stE.textContent = r.st[0]; stE.className = "dk-st " + r.st[1]; } }
    });
  }
  function paintTabs() {
    const a = activeId();
    tabsEl.innerHTML = [...W.values()].filter((x) => x.e.style.display !== "none").map((x) => { const [k, n] = kanjiTitle(x.w); return `<button type=button role=tab data-id="${x.w.id}" class="${x.w.id === a ? "on" : ""}${x.w.min ? " min" : ""}" aria-selected=${x.w.id === a} title="${esc(n)}">${esc(k)} ${esc(n)}</button>`; }).join("");
  }
  tabsEl.addEventListener("click", (e) => { const b = e.target.closest("button[data-id]"); if (!b) return; const id = b.dataset.id, x = W.get(id); if (!x) return; if (x.w.min) restore(id); else if (activeId() === id) minimize(id); else front(id); });
  function paintStat() {
    let t = { t: "" }; try { t = sectorStamp(); } catch (e) { /* ok */ }
    const r = role() ? (role() === "IMPERIAL INTELLIGENCE" ? "IMPERIAL TALONS" : role()) : (S.authRole ? S.authRole + " // KEY" : "NONE");
    const linked = document.body.classList.contains("mp-linked"), live = document.body.classList.contains("mp-live"), sy = $("sync");
    const isb = live ? (sy ? sy.textContent.replace(/[[\]]/g, "") : "LIVE") : linked ? "LINKED" : "LOCAL";
    let cs = ""; if (linked) { try { cs = localStorage.getItem("forge_mp_callsign") || ""; } catch (e) { cs = ""; } }
    const html = `<span>CLEARANCE <b>${esc(r)}</b></span>${cs ? `<span>CALLSIGN <b>${esc(cs)}</b></span>` : ""}<span>UNITS <b>${sheets().filter(vis).length}</b></span><span>ISB <b>${esc(isb)}</b></span><span class=ver role=button tabindex=0 title="Open the changelog">v${BUILD}</span><span><b>${esc(t.t)}</b></span>`;
    if ($("dkstat").innerHTML !== html) $("dkstat").innerHTML = html;
  }
  $("dkstat").addEventListener("click", (e) => { if (e.target.closest(".ver")) openLog(); });
  /* console: a tray flyout; only its taskbar button opens or closes it */
  function setTray(on) { fly.hidden = !on; const b = $("dktray"); b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); if (on) { b.classList.remove("new"); const lg = $("log"); if (lg) lg.scrollTop = lg.scrollHeight; } P.tray = on; save(); }
  $("dktray").addEventListener("click", () => setTray(fly.hidden));
  new MutationObserver(() => { if (fly.hidden) $("dktray").classList.add("new"); }).observe($("log"), { childList: true });
  if (P.fw) fly.style.setProperty("--fw", P.fw + "px"); if (P.fh) fly.style.setProperty("--fh", P.fh + "px");
  $("dkflyg").addEventListener("pointerdown", (e) => {
    e.preventDefault(); const s = P.scale || 1, r = fly.getBoundingClientRect(), sx = e.clientX, sy = e.clientY, w0 = r.width / s, h0 = r.height / s;
    const mv = (ev) => { P.fw = Math.max(320, Math.round(w0 - (ev.clientX - sx) / s)); P.fh = Math.max(220, Math.round(h0 - (ev.clientY - sy) / s)); fly.style.setProperty("--fw", P.fw + "px"); fly.style.setProperty("--fh", P.fh + "px"); };
    const up = () => { removeEventListener("pointermove", mv); removeEventListener("pointerup", up); save(); }; addEventListener("pointermove", mv); addEventListener("pointerup", up);
  });

  /* ---------- launch menu, icons, clearance switches ---------- */
  let menu = null;
  function closeMenu() { if (menu) { menu.remove(); menu = null; } }
  function openMenu(items, anchor) {
    closeMenu(); menu = document.createElement("div"); menu.id = "dkmenu"; menu.setAttribute("role", "menu");
    items.forEach((it) => { if (it === "-") { menu.appendChild(document.createElement("hr")); return; } const b = document.createElement("button"); b.type = "button"; b.setAttribute("role", "menuitem"); b.innerHTML = `<b aria-hidden=true>${it[0]}</b><span>${esc(it[1])}</span>`; b.onclick = () => { closeMenu(); it[2](); }; menu.appendChild(b); });
    root.appendChild(menu);
    if (anchor) { const s = P.scale || 1, r = anchor.getBoundingClientRect(); Object.assign(menu.style, { left: Math.round(r.right / s + 4) + "px", top: Math.round(r.top / s) + "px", bottom: "auto" }); }
    const f = menu.querySelector("button"); if (f) f.focus();
  }
  document.addEventListener("pointerdown", (e) => { if (menu && !menu.contains(e.target) && !e.target.closest("#dkstart,.dk-ico")) closeMenu(); }, true);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menu) closeMenu(); });
  $("dkstart").addEventListener("click", () => { if (menu) return closeMenu(); openMenu([...ICONS.map((i) => [i[1], i[2], () => icon(i[0])]), ["録", "CHANGELOG", () => openLog()], "-", ["退", "LOGOUT // LOCK SCREEN", () => askOut()]]); });
  function modal(title, text, okLabel, fn) {
    const old = $("dkmodal"); if (old) old.remove();
    const m = el(`<div id=dkmodal role=alertdialog aria-modal=true aria-label="${esc(title)}"><div><div class=dk-t><span class=dk-k>警</span><span class=dk-n>${esc(title)}</span></div><p>${text}</p><div class=act><button type=button data-ok=1>${esc(okLabel)}</button><button type=button data-no=1>CANCEL</button></div></div></div>`);
    root.appendChild(m); m.querySelector("[data-no]").focus();
    m.addEventListener("click", (e) => { if (e.target.closest("[data-ok]")) { m.remove(); fn(); } else if (e.target.closest("[data-no]")) m.remove(); });
  }
  const busySession = () => sheets().length > 0 || document.body.classList.contains("mp-live");
  function askOut() { if (busySession()) modal("LOGOUT", "End this session and return to the lock screen? Unsaved sortie state is lost; a live-table seat is released.", "LOGOUT", () => out()); else out(); }
  function clearance(n, match, label) {
    if (match()) { closedEngine.delete("term"); closedEngine.delete("enc"); sync(); const x = findW((v) => v.w.k === "term" || v.w.k === "enc"); if (x) restore(x.w.id); return; }
    const go = () => { if (role() || S.authRole) out(); login(n); };
    if (busySession() || role()) modal("SWITCH CLEARANCE // " + label, `Open <b>${esc(label)}</b>? This ends the current ${esc(role() || "terminal")} session${busySession() ? " (unsaved sortie state is lost; a live-table seat is released)" : ""}.${n === 3 || n === 5 ? " The window asks for its access key." : ""}`, "SWITCH", go);
    else go();
  }
  function icon(id) {
    if (id === "enc") { if (inEnc()) return clearance(4, () => true, "ENCOUNTER"); return modal("ENCOUNTER // CONNECT", "Start an encounter? " + (role() ? "This ends the current session and returns" : "This returns") + " to the lock screen to connect (IMPERIAL INTELLIGENCE solo, or LIVE DATA INTERCEPT for the shared table).", "CONNECT", () => out()); }
    if (id === "units") { const used = sheets().filter(vis).map((s) => s.col || 0); open({ k: "group", c: used.length ? used[0] : 0 }); return sync(); }
    if (id === "loadout") {
      if (!ENCV.includes(S.view)) { closedEngine.delete("sheet"); sync(); const x = findW((v) => v.w.k === "sheet"); if (x) restore(x.w.id); else toastD("LOADOUT :: no frame manifest is open"); return; }
      const us = sheets().map((s, i) => [s, i]).filter(([s]) => vis(s)); if (!us.length) return toastD("LOADOUT :: no units on the table");
      return openMenu(us.map(([s, i]) => ["装", safeLabel(i), () => { const k = ukey(s); open({ k: "unit", u: k }, false); open({ k: "sec", u: k, s: "loadout" }); sync(); }]), document.querySelector("[data-ico=loadout]"));
    }
    if (id === "guest") return clearance(1, () => role() === "GUEST", "FRAME ASSEMBLY");
    if (id === "mech") return clearance(2, () => role() === "MECHANIC", "SERVICE BAY");
    if (id === "cat") return clearance(3, () => role() === "RESEARCH STAFF" || S.authRole === "RESEARCH STAFF", "CATALOGUE EDITOR");
    if (id === "ovr") return clearance(5, () => role() === "OVERSEER" || S.authRole === "OVERSEER", "OVERSEER");
    if (id === "set") { open({ k: "set" }); return sync(); }
    if (id === "log") return openLog();
  }
  root.addEventListener("click", (e) => { const b = e.target.closest(".dk-ico"); if (b) icon(b.dataset.ico); });

  /* sheet tabs (ENCOUNTER window): a tab opens or raises its unit window; on an open tab the engine's colour cycle stays */
  if (typeof shClick === "function") {
    const _sc = shClick;
    shClick = function (i) {
      const sh = sheets()[i], k = ukey(sh); if (!k || S.shEdit === i) return _sc.apply(this, arguments);
      const x = findW((v) => v.w.k === "unit" && v.w.u === k);
      if (!x) { open({ k: "unit", u: k }); if (i !== S.cur) return shGo(i); return R(); }
      if (x.w.min || activeId() !== x.w.id) { restore(x.w.id); if (i !== S.cur) return shGo(i); return; }
      return _sc.apply(this, arguments);
    };
  }

  /* ---------- after every render ---------- */
  let inSync = false;
  function sync(pre, f) {
    if (inSync) return; inSync = true;
    try {
      placeEngine();
      if (S.view === "sortie") renderUnits(pre); else CACHE.clear();
      W.forEach((x) => { if (x.w.k === "group") paintGroup(x); else if (x.w.k === "set") paintSettings(x); else if (x.w.k === "unit") paintUnitChrome(x); });
      paintTitles(); paintTabs(); paintStat();
      frestore(f);
    } catch (e) { console.error("[desk] sync", e); } finally { inSync = false; }
  }
  const _R = R;
  R = function () {
    let f = null, pre = null; try { f = fsnap(); const k = curKey(); if (k) pre = { k, hp: S.uiHP ? S.uiHP.slice() : null }; } catch (e) { /* ok */ }
    const r = _R.apply(this, arguments);
    sync(pre, f);
    return r;
  };
  setInterval(() => { paintStat(); tickLock(); }, 1000);
  addEventListener("resize", () => W.forEach(place));
  const bodyObs = new MutationObserver(() => HOSTS.forEach((h) => mirrorBody(h.shadowRoot.firstElementChild, h.dataset.ro === "1")));
  bodyObs.observe(document.body, { attributes: true, attributeFilter: ["class", "data-theme", "data-view"] });

  /* boot: restore unit groups and settings; engine windows and units open on demand */
  P.wins.filter((w) => w && (w.k === "group" || w.k === "set") && typeof w.x === "number").forEach((w) => build(Object.assign({}, w, { id: nid() })));
  setTray(!!P.tray); applyScale();
  window.Desk = { on: true, build: BUILD, open, close, minimize, restore, toggleMax, front, route, sync, saveSlot, loadSlot, resetLayout, setTray, icon,
    wins: () => [...W.values()].map((x) => Object.assign({ hidden: x.e.hidden || x.e.style.display === "none" }, x.w)), curKey, ukey, idxOf, hosts: () => HOSTS,
    geo: (id, g) => { const x = W.get(id); if (!x) return; Object.assign(x.w, g); place(x); persist(); } };
  sync();
})();
