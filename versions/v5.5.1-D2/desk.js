/* FORGE-OS desktop shell D2 "Modular Cockpit" (v5.5.1-D2, on D1). Classic script loaded after mp-bridge.js, so its
   R wrapper is outermost. Shell only: R() stays the single renderer, S is never mutated for display, nothing syncs.
   Layout: forge_ui_v1 -> UI.desk2 (D1's UI.desk is read once, never written). */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const ACC = ["var(--cyan)", "#ffb347", "#ff6bd6", "#a3e635", "#b48cff"];
  const PT = { doll: "PAPER DOLL", bus: "EP / HEAT BUS", impact: "IMPACT RESOLUTION", skills: "SKILL INPUTS", rolls: "ROLLS // SENSORS · ENG", arms: "ARMAMENT", frame: "FRAME STATS" };
  const PSHORT = { doll: "DOLL", bus: "BUS", impact: "IMP", skills: "SKL", rolls: "ROLL", arms: "ARMS", frame: "FRM" };
  const KINDS = ["doll", "sheet", "console", "roster", "float"];
  const css = `
body.desk{overflow:hidden}
body.desk #wrap{max-width:none;height:100vh;box-sizing:border-box;display:flex;flex-direction:column;padding:6px 8px}
body.desk #wrap>main{display:none}
#deskroot{display:none}
body.desk #deskroot{display:flex;flex-direction:column;flex:1;min-height:0;gap:6px;margin-top:6px}
#deskarea{position:relative;flex:1;min-height:0;isolation:isolate;overflow:hidden}
#deskarea.snapping{background-image:radial-gradient(color-mix(in srgb,var(--cyan) 35%,transparent) 1px,transparent 1px);background-size:8px 8px}
#desktb{flex:none;height:40px;box-sizing:border-box;display:flex;align-items:center;gap:4px;border:1px solid var(--line);padding:0 6px;z-index:1000;background:var(--bg);font-size:12px;overflow:hidden}
#desktb button{all:unset;cursor:pointer;white-space:nowrap;padding:3px 6px;border:1px solid var(--line);color:var(--fg);font-size:12px}
#desktb button:hover,#desktb button:focus-visible{color:var(--cyan);border-color:var(--cyan)}
#desktb button[aria-pressed=true]{color:var(--cyan);border-color:var(--cyan);background:var(--hover,#0c2a22)}
#desktb .tbchips{flex:1;min-width:0;display:flex;gap:4px;overflow:hidden}
#desktb .chip2{border-bottom:2px solid var(--a,var(--cyan))!important;max-width:170px;overflow:hidden;text-overflow:ellipsis}
#desktb .chip2.min{opacity:.6}
#desktb .slot.sel{color:var(--bg)!important;background:var(--cyan)!important}
#desktb .sep{width:1px;height:24px;background:var(--line);margin:0 2px}
#dkmenu{position:fixed;z-index:1400;background:var(--bg);border:1px solid var(--cyan);display:flex;flex-direction:column;padding:4px;gap:2px}
#dkmenu button{all:unset;cursor:pointer;padding:3px 8px;color:var(--fg)}#dkmenu button:hover,#dkmenu button:focus-visible{color:var(--cyan);background:var(--hover,#0c2a22)}
.win{position:absolute;display:flex;flex-direction:column;box-sizing:border-box;border:1px solid var(--line);background:var(--bg);min-width:160px;min-height:28px;resize:both;overflow:hidden;padding:0;--a:var(--cyan)}
.win[data-k=doll]{border-color:var(--a)}
.win.live{box-shadow:inset 0 0 0 2px var(--bg),inset 0 0 0 3px var(--c-ok,#4ade80)}
.win.col{height:28px!important;min-height:28px;resize:none}
.win.col>.win-b{display:none}
.win.min{display:none}
.win.max{left:0!important;top:0!important;width:100%!important;height:100%!important;resize:none}
.win.pin{resize:none}.win.pin>.win-t{cursor:default}
.win.vmax{left:0!important;top:0!important;width:var(--vw,60%)!important;height:100%!important}
.win-t{flex:none;height:26px;display:flex;align-items:center;gap:4px;padding:0 4px 0 6px;background:#081812;color:var(--fg);font-size:13px;letter-spacing:.04em;cursor:move;user-select:none;border-bottom:1px solid var(--line)}
.win[data-k=doll]>.win-t .wt{color:var(--a)}
.win.focus>.win-t{background:var(--hover,#0c2a22);color:var(--cyan);border-bottom-color:var(--cyan)}
.win-t .wt{flex:1;min-width:48px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.win-t button{all:unset;cursor:pointer;min-width:16px;padding:0 2px;height:20px;text-align:center;font-size:12px;color:var(--fg);border:1px solid var(--line);white-space:nowrap}
.win-t button:hover,.win-t button:focus-visible{color:var(--cyan);border-color:var(--cyan)}
.win-t .wsel{background:var(--bg);color:var(--a);border:1px solid var(--a);font:inherit;font-size:12px;max-width:72px;flex:none}
.win-t .ltag{color:var(--bg);background:var(--c-ok,#4ade80);padding:0 4px;font-weight:bold;font-size:12px}
.win-t .lnk{color:var(--cyan);font-size:12px}
.win-b{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}
.win-b>#bar{flex:none;padding:3px 6px 0}
.win #bar>.panel{margin:0!important;padding:4px 6px}
.win-b>#con,.win-b>#sh{flex:1;min-height:0;overflow-y:auto;border:0;margin:0}
body.dk-sortie .win-b>#con{display:none}
.win-b>#cb{flex:1;min-height:0;display:flex;flex-direction:column;border:0;margin:0}
.win-b>#cb #log{flex:1;height:auto;min-height:40px}
.pbs{flex:1;min-height:0;display:flex;flex-wrap:wrap;align-content:stretch;overflow:auto;gap:4px;padding:4px}
body:not(.dk-sortie) .pbs{display:none}
.pn{flex:1 1 230px;min-width:0;min-height:120px;display:flex;flex-direction:column;border:1px solid var(--line);container-type:inline-size;max-height:100%}
.pn[data-t=doll]{flex:2 1 300px}
.ph{flex:none;display:flex;gap:4px;align-items:center;padding:1px 4px;font-size:12px;color:var(--cyan);border-bottom:1px solid var(--line);letter-spacing:.05em}
.ph span{flex:1}
.ph button{all:unset;cursor:pointer;padding:0 4px;border:1px solid var(--line);font-size:12px}
.pb{flex:1;min-height:0;overflow:auto;padding:4px}
.pb>.sorhead{position:static}
.mbar{flex:none;font-size:12px;padding:2px 4px;color:var(--gold,#e8c35a);border-bottom:1px dashed var(--gold,#e8c35a);display:flex;gap:6px;align-items:center}
.mbar[hidden]{display:none}.mbar span{flex:1}.mbar button{all:unset;cursor:pointer;border:1px solid var(--gold,#e8c35a);padding:0 4px}
.pn[data-s=mirror] .pb,.pn[data-s=copy] .pb{filter:saturate(.35) brightness(.8)}
.pn[data-s=none] .pb{color:var(--muted,#7a8);display:flex;align-items:center;justify-content:center}
@container (max-width:215px){.pb .mechmap svg,.pb .mechmap .mmfig{display:none}}
.win[data-k=roster]{min-width:40px}
.win[data-k=roster] #mpfriends{position:static!important;display:block!important;width:auto!important;height:100%;margin:0;border:0;overflow:auto;max-height:none}
.win[data-k=roster][data-rm=rail] #mpfriends .mpn,.win[data-k=roster][data-rm=rail] #mpfriends .mpw{display:none}
.win[data-k=roster][data-rm=compact] #mpfriends li,.win[data-k=roster][data-rm=compact] #mpfriends .mprow{line-height:20px;max-height:20px;overflow:hidden}
.win.drag{will-change:transform;opacity:.92}
body.desk #mpveil{position:fixed;inset:0;z-index:2000}
body.desk #toast{z-index:1200}body.desk #hudfx{z-index:1100}
body.desk #mpassign,body.desk #mptint{z-index:1300}body.desk #clog{z-index:1500}
@media (prefers-reduced-motion:reduce){.win,.win *{transition:none!important}}`;
  const st = document.createElement("style"); st.id = "deskcss"; st.textContent = css; document.head.appendChild(st);
  const MIRCSS = `.mirc{position:relative;pointer-events:none}.mirc::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(135deg,transparent 0 9px,color-mix(in srgb,var(--gold,#e8c35a) 18%,transparent) 9px 11px)}.mirc button,.mirc input,.mirc select,.mirc textarea{border-style:dashed!important;cursor:not-allowed}`;
  let mirSheet = null;
  function mirStyles() {
    if (mirSheet) return mirSheet;
    let txt = "";
    for (const ss of document.styleSheets) { try { if (ss.ownerNode && ss.ownerNode.id === "deskcss") continue; for (const r of ss.cssRules) txt += r.cssText + "\n"; } catch (e) {} }
    mirSheet = new CSSStyleSheet(); mirSheet.replaceSync(txt.replace(/\bbody\b/g, ":host") + MIRCSS); return mirSheet;
  }

  /* ---------- state ---------- */
  let area, tb, built = false, ready = false, noWrite = false, undoL = null, undoT = 0, selSlot = 1, menuEl = null;
  const cache = {}; let lastLive = null, ownerKey = null; let liveHost = {}; // t -> panel element (live host)
  const home = {};
  function D() {
    if (!UI.desk2 || typeof UI.desk2 !== "object" || UI.desk2.v !== 2) {
      const old = UI.desk && UI.desk.v === 1 ? UI.desk : null; // D1, read-only
      UI.desk2 = { v: 2, on: old ? old.on !== false : true, L: {}, slots: {} };
      if (old && old.L) for (const p of ["solo", "table"]) if (old.L[p]) UI.desk2.L[p] = migrate(old.L[p]);
    }
    if (!UI.desk2.L || typeof UI.desk2.L !== "object") UI.desk2.L = {};
    if (!UI.desk2.slots || typeof UI.desk2.slots !== "object") UI.desk2.slots = {};
    return UI.desk2;
  }
  const prof = () => (document.body.classList.contains("mp-linked") ? "table" : "solo");
  function save(keepAuto) { if (!keepAuto && ready) { const d = UI.desk2, l = d && d.L && d.L[prof()]; if (l && l.auto) delete l.auto; } if (noWrite) return; try { uiSave(); } catch (e) {} }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rosterOK = () => !!window.mpD2Roster; // set by the approved bridge patch (bridge-patch-d2.diff)
  function L() { const d = D(), p = prof(); if (!d.L[p] || typeof d.L[p] !== "object" || !Array.isArray(d.L[p].wins)) d.L[p] = preset("def"); return d.L[p]; }

  /* ---------- sheet keys ---------- */
  function shKey(i) { const sh = S.sheets && S.sheets[i]; if (!sh) return null; if (sh.uid) return String(sh.uid); const d = i == S.cur ? S : sh.d || {}; try { return "fid:" + (fidJoin(d.id, d.cs) || "SHEET" + i); } catch (e) { return "fid:SHEET" + i; } }
  function liveKey() { if (typeof S === "undefined" || !S.sheets || !S.sheets.length) return S && S.ch ? "fid:LOCAL" : null; return shKey(S.cur); }
  function keyIdx(k) { if (!S.sheets) return -1; for (let i = 0; i < S.sheets.length; i++) if (shKey(i) === k) return i; return -1; }
  function keyName(k) { const i = keyIdx(k); if (i >= 0) try { return shLabel(i); } catch (e) {} return k === "fid:LOCAL" && typeof idline === "function" ? idline() : "—"; }
  const short = (k) => { const n = keyName(k) || "?"; const m = /^([A-Z]{2,4})-?\d*/i.exec(n); return (m ? m[1] : n.slice(0, 3)).toUpperCase(); };

  /* ---------- presets, migration, sanitize ---------- */
  function preset(name, keys) {
    const ks = keys || ((typeof S !== "undefined" && S.sheets) ? S.sheets.map((_, i) => shKey(i)) : []);
    const live = liveKey(), other = ks.find((k) => k && k !== live);
    const ro = rosterOK() && document.body.classList.contains("mp-linked"), x0 = ro ? 0.074 : 0;
    const w = [], P = (...t) => t.map((x) => ({ t: x }));
    if (ro) w.push({ k: "roster", mech: null, x: 0, y: 0, w: 0.07, h: 1, rm: "rail", P: [] });
    if (name === "trio") {
      const k3 = [live].concat(ks.filter((k) => k && k !== live)).slice(0, 3);
      const n = Math.max(1, k3.length), cw = (0.6 - x0) / n;
      k3.forEach((k, i) => w.push({ k: "doll", mech: k || null, acc: i, x: x0 + i * cw, y: 0, w: cw - 0.004, h: 1, P: P("doll", "bus", "impact", "skills", "rolls") }));
      w.push({ k: "sheet", mech: "@live", x: 0.605, y: 0, w: 0.395, h: 0.6, P: [] }, { k: "console", x: 0.605, y: 0.61, w: 0.395, h: 0.39, P: [] });
    } else if (name === "table") {
      w.push({ k: "doll", mech: live, acc: 0, x: x0, y: 0, w: 0.5 - x0, h: 1, P: P("doll", "bus", "impact") });
      w.push({ k: "float", mech: "@live", x: 0.505, y: 0, w: 0.495, h: 0.66, P: P("skills", "rolls", "arms") });
      w.push({ k: "sheet", mech: "@live", x: 0.505, y: 0.67, w: 0.2, h: 0.33, min: true, P: [] });
      w.push({ k: "console", x: 0.505, y: 0.67, w: 0.495, h: 0.33, P: [] });
    } else {
      // live doll keeps the full left column (sortie header stays one compact readout at 1280+);
      // the mirror doll sits bottom-right beside a narrower console
      w.push({ k: "doll", mech: live, acc: 0, x: x0, y: 0, w: 0.597 - x0, h: 0.6, P: P("doll", "bus") });
      if (other) w.push({ k: "doll", mech: other, acc: 1, x: 0.6, y: 0.605, w: 0.17, h: 0.395, P: P("doll", "bus") });
      w.push({ k: "float", mech: "@live", x: x0, y: 0.605, w: 0.597 - x0, h: 0.395, P: P("impact", "skills", "rolls") });
      w.push({ k: "sheet", mech: "@live", x: 0.6, y: 0, w: 0.4, h: 0.6, P: [] });
      w.push(other ? { k: "console", x: 0.772, y: 0.605, w: 0.228, h: 0.395, P: [] } : { k: "console", x: 0.6, y: 0.605, w: 0.4, h: 0.395, P: [] });
    }
    const o = sanitize({ v: 2, snap: true, grid: 8, wins: w, seen: {} }).L; if (ks.length < 2) o.auto = ks.length + 1; return o;
  }
  function migrate(o) { // D1 {tele,sheet,con} -> D2 windows (read-only)
    const g = (k, d) => Object.assign({}, d, o && o[k] && typeof o[k] === "object" ? o[k] : {});
    const t = g("tele", { x: 0, y: 0, w: 0.6, h: 1 }), s = g("sheet", { x: 0.605, y: 0, w: 0.395, h: 0.6 }), c = g("con", { x: 0.605, y: 0.61, w: 0.395, h: 0.39 });
    return sanitize({ v: 2, snap: true, wins: [
      { k: "doll", mech: null, acc: 0, x: t.x, y: t.y, w: t.w, h: t.h, col: !!t.col, min: !!t.min, P: [{ t: "doll" }, { t: "bus" }, { t: "impact" }, { t: "skills" }, { t: "rolls" }] },
      { k: "sheet", mech: "@live", x: s.x, y: s.y, w: s.w, h: s.h, col: !!s.col, min: !!s.min, P: [] },
      { k: "console", x: c.x, y: c.y, w: c.w, h: c.h, col: !!c.col, P: [] }] }).L;
  }
  function sanitize(lay) {
    const rep = { dropped: 0, relinked: 0 };
    if (!lay || typeof lay !== "object" || !Array.isArray(lay.wins)) return { L: null, rep };
    const haveSheets = typeof S !== "undefined" && S.sheets && S.sheets.length > 0;
    const out = []; let seq = 0, nCon = 0, nRos = 0;
    for (const w0 of lay.wins) {
      if (!w0 || typeof w0 !== "object" || !KINDS.includes(w0.k)) { rep.dropped++; continue; }
      const w = { k: w0.k, mech: w0.mech == null ? null : String(w0.mech), acc: Math.abs(Math.floor(+w0.acc || 0)) % 5, rm: ["compact", "rail", "full"].includes(w0.rm) ? w0.rm : "compact" };
      if (w.k === "console") { if (nCon++) { rep.dropped++; continue; } w.mech = null; }
      if (w.k === "roster") { if (nRos++ || !rosterOK()) { rep.dropped++; continue; } w.mech = null; }
      if (w.k === "doll") { if (w.mech === "@live") w.mech = null; if (haveSheets && w.mech && keyIdx(w.mech) < 0) { rep.dropped++; continue; } }
      if ((w.k === "float" || w.k === "sheet") && w.mech !== "@live") { if (!w.mech || (haveSheets && keyIdx(w.mech) < 0)) { if (w.mech) rep.relinked++; w.mech = "@live"; } }
      const seen = new Set(); w.P = [];
      for (const p of Array.isArray(w0.P) ? w0.P : []) { if (!p || !PT[p.t] || seen.has(p.t)) continue; seen.add(p.t); w.P.push({ t: p.t, home: p.home || null }); }
      if (w.k === "float" && !w.P.length) { rep.dropped++; continue; }
      const n = (v, d) => (Number.isFinite(+v) ? +v : d);
      w.w = clamp(n(w0.w, 0.3), 0.03, 1); w.h = clamp(n(w0.h, 0.4), 0.03, 1); w.x = clamp(n(w0.x, 0), 0, 1 - Math.min(w.w, 1)); w.y = clamp(n(w0.y, 0), 0, 1 - w.h);
      w.z = clamp(Math.floor(n(w0.z, 10)), 10, 799); w.pin = !!w0.pin; w.col = !!w0.col; w.min = !!w0.min; w.max = !!w0.max;
      out.push(w);
    }
    if (!out.some((w) => w.k === "doll")) out.unshift({ k: "doll", mech: null, acc: 0, rm: "compact", x: 0, y: 0, w: 0.6, h: 0.6, z: 10, pin: false, col: false, min: false, max: false, P: [{ t: "doll", home: null }, { t: "bus", home: null }] });
    if (!out.some((w) => w.k === "console")) out.push({ k: "console", mech: null, acc: 0, rm: "compact", x: 0.6, y: 0.6, w: 0.4, h: 0.4, z: 10, pin: false, col: false, min: false, max: false, P: [] });
    out.forEach((w) => { w.id = "w" + ++seq; });
    out.forEach((w) => w.P.forEach((p) => { const h = out.find((x) => x.id === p.home); p.id = "p" + ++seq; p.home = h ? h.id : w.id; }));
    const L2 = { v: 2, snap: lay.snap !== false, grid: 8, seq, wins: out, seen: lay.seen && typeof lay.seen === "object" ? lay.seen : {} }; if (lay.auto) L2.auto = +lay.auto || 1;
    return { L: L2, rep };
  }

  /* ---------- window DOM ---------- */
  function winEl(id) { return area && area.querySelector('.win[data-id="' + id + '"]'); }
  function W(id) { return L().wins.find((w) => w.id === id); }
  function resolve(w) { if (w.k === "doll") return w.mech || liveKey(); if (w.mech === "@live") return liveKey(); return w.mech; }
  function nid() { const l = L(); l.seq = (l.seq || 0) + 1; return l.seq; }
  function chrome(w) {
    const pinB = `<button type=button data-a=pin title="${w.pin ? "Unpin (allow moving and resizing)" : "Pin: lock position and size, keep on top"}" aria-label="${w.pin ? "Unpin window" : "Pin window"}" aria-pressed=${w.pin}>⌖</button>`;
    const rmB = w.k === "roster" ? `<button type=button data-a=rm title="Cycle the user list: compact, icon rail, full" aria-label="Cycle user list size">◧</button>` : "";
    const close = w.k === "doll" || w.k === "float" || w.k === "sheet" || w.k === "roster" ? `<button type=button data-a=close title="Close window" aria-label="Close window">✕</button>` : "";
    const lead = w.k === "doll" ? `<span class=wlead></span><select class=wsel aria-label="Mech shown in this doll window"></select>` : w.mech === "@live" ? `<span class=lnk title="LINKED: follows the live doll">⛓ LINKED</span>` : "";
    return `<div class=win-t>${lead}<span class=wt id="wt-${w.id}"></span><span class=wmk></span>${rmB}${pinB}<button type=button data-a=col title="Collapse window" aria-label="Collapse window" aria-expanded=true>–</button><button type=button data-a=min title="Minimize to the taskbar" aria-label="Minimize to the taskbar">_</button><button type=button data-a=max title="Maximize" aria-label="Maximize">□</button>${close}</div><div class=win-b></div>`;
  }
  function build() {
    if (built) return; built = true;
    const root = document.createElement("div"); root.id = "deskroot";
    root.innerHTML = `<div id=deskarea></div><nav id=desktb role=toolbar aria-label="Taskbar"></nav>`;
    $("wrap").appendChild(root); area = $("deskarea"); tb = $("desktb");
    tb.innerHTML = `<button type=button data-l=doll title="Open another paper doll window (Ctrl+Alt+N)">[+ DOLL]</button><button type=button data-l=sheet title="Show the frame sheet window">SHEET</button><button type=button data-l=console title="Show the operator console">CONSOLE</button><button type=button data-l=users title="Show or hide the user list">USERS</button><button type=button data-l=panels title="Open a panel type as its own window" aria-haspopup=menu>PANELS ▴</button><span class=sep></span><span class=tbchips></span><span class=sep></span><button type=button id=dkSnap title="Snap windows to an 8px grid and to window edges while dragging">SNAP</button>${[1, 2, 3, 4, 5].map((n) => `<button type=button class=slot data-s=${n} title="Layout slot ${n}: select, then SAVE or LOAD (double-click loads; Ctrl+Alt+${n} loads, Ctrl+Alt+Shift+${n} saves)">${n}</button>`).join("")}<button type=button id=dkSave title="Save the current layout into the selected slot (Ctrl+Alt+Shift+1..5)">SAVE</button><button type=button id=dkLoad title="Load the selected slot (Ctrl+Alt+1..5, or double-click a slot)">LOAD</button><button type=button id=deskReset title="Reset to the default layout (UNDO for 8 s)">DEF</button>`;
    tb.addEventListener("click", tbClick); tb.addEventListener("dblclick", (e) => { const s = e.target.closest(".slot"); if (s) loadSlot(+s.dataset.s); });
    const hc = document.querySelector("header .hctl");
    if (hc && !$("deskBtn")) { const t = document.createElement("button"); t.id = "deskBtn"; t.type = "button"; t.className = "audio-btn"; t.onclick = () => setOn(!D().on); hc.insertBefore(t, hc.firstChild); hc.insertBefore(document.createTextNode(" "), t.nextSibling); }
    window.addEventListener("resize", () => { if (D().on) placeAll(); });
    document.addEventListener("keydown", keys, true);
    document.addEventListener("pointerdown", (e) => { if (menuEl && !menuEl.contains(e.target)) closeMenu(); }, true);
    const mo = new MutationObserver(() => schedule());
    ["out", "sh"].forEach((id) => { const n = $(id); if (n) mo.observe(n, { childList: true, subtree: true }); });
    window.__deskMO = mo;
  }
  function renderWins() {
    const l = L();
    // park persistent containers before rebuilding
    const park = $("dkpark") || Object.assign(document.createElement("div"), { id: "dkpark", hidden: true });
    if (!park.parentNode) document.body.appendChild(park);
    ["bar", "con", "sh", "cb"].forEach((id) => { const n = $(id); if (n && area.contains(n)) park.appendChild(n); });
    const mpf = $("mpfriends"); if (mpf && area.contains(mpf)) { const cb = $("cb"); if (cb) cb.appendChild(mpf); }
    area.querySelectorAll(".pb").forEach(emptyPb);
    area.innerHTML = ""; liveHost = {};
    for (const w of l.wins) {
      const el = document.createElement("section");
      el.className = "win panel"; el.dataset.id = w.id; el.dataset.k = w.k; el.style.setProperty("--a", ACC[w.acc || 0]);
      if (w.k === "roster") el.dataset.rm = w.rm || "compact";
      el.setAttribute("role", "region"); el.setAttribute("aria-labelledby", "wt-" + w.id);
      el.innerHTML = chrome(w);
      const b = el.querySelector(".win-b");
      if (w.k === "console") { const cb = $("cb"); if (cb) b.appendChild(cb); }
      else if (w.k === "sheet") { const sh = $("sh"); if (sh) b.appendChild(sh); }
      else if (w.k === "roster") { /* filled by Desk.rosterHost() via the bridge patch */ }
      else {
        const pbs = document.createElement("div"); pbs.className = "pbs"; b.appendChild(pbs);
        for (const p of w.P) {
          const pn = document.createElement("div"); pn.className = "pn"; pn.dataset.t = p.t; pn.dataset.p = p.id;
          pn.innerHTML = `<div class=ph><span>${PT[p.t]}</span>${p.home && p.home !== w.id ? `<button type=button data-pa=home title="Dock back to its home window" aria-label="Dock panel back">⇲</button>` : ""}${w.P.length > 1 ? `<button type=button data-pa=tear title="Tear off into its own window" aria-label="Tear panel off">⇱</button>` : ""}</div><div class=mbar hidden></div><div class=pb></div>`;
          pbs.appendChild(pn);
        }
      }
      el.addEventListener("pointerdown", () => focusWin(w.id), true);
      const t = el.querySelector(".win-t");
      t.addEventListener("pointerdown", (e) => dragStart(e, w.id));
      t.addEventListener("dblclick", (e) => { if (!e.target.closest("button,select")) act(w.id, "max"); });
      t.querySelectorAll("button").forEach((x) => x.addEventListener("click", (e) => { e.stopPropagation(); act(w.id, x.dataset.a); }));
      const sel = t.querySelector(".wsel"); if (sel) sel.addEventListener("change", () => { if (sel.disabled) return; w.mech = sel.value; save(); harvest(true); paint(); });
      el.addEventListener("click", (e) => { const b2 = e.target.closest("[data-pa],[data-ml],[data-go]"); if (!b2) return; e.stopPropagation(); if (b2.dataset.pa === "tear") tear(w.id, b2.closest(".pn").dataset.p); else if (b2.dataset.pa === "home") dockHome(w.id, b2.closest(".pn").dataset.p); else if (b2.dataset.ml) makeLive(b2.dataset.ml); else if (b2.dataset.go) focusWin(b2.dataset.go, true); });
      el.addEventListener("pointerup", () => sizeCommit(w.id));
      area.appendChild(el);
    }
    area.dataset.prof = prof(); placeAll();
    if (ready) { harvest(true); setTimeout(rerender, 0); }
  }

  /* ---------- harvest ---------- */
  let sch = 0;
  function schedule() { if (sch || !ready || !D().on) return; sch = requestAnimationFrame(() => { sch = 0; harvest(false); }); }
  function restoreLive() { // hand harvested live nodes back to #out / #sh so a window rebuild never loses the render
    const out = $("out"), sh = $("sh"); if (!out || out.querySelector(":scope>.sorhead")) return;
    const pick = (t) => { const pn = liveHost[t]; return pn && pn.isConnected ? pn.querySelector(".pb") : null; };
    const rolls = pick("rolls"), dk = rolls && rolls.querySelector(".dkrolls");
    for (const t of ["doll", "bus", "impact", "skills"]) { const pb = pick(t); if (!pb) continue; [...pb.children].forEach((n) => { if (!n.classList.contains("mirhost")) out.appendChild(n); }); }
    const pil = out.querySelector(":scope>.pilot"); if (dk && pil) [...dk.children].forEach((n) => pil.appendChild(n));
    if (sh) for (const t of ["frame", "arms"]) { const pb = pick(t), d = pb && pb.querySelector(".dksec"); if (d) { const dv = sh.querySelector(":scope>.dv"); [...d.children].forEach((n) => sh.insertBefore(n, dv || null)); } }
  }
  function rerender() { if (!D().on || (typeof busy !== "undefined" && busy)) return setTimeout(rerender, 150); try { R(); } catch (e) {} }
  function emptyPb(pb) { pb._src = null; while (pb.firstChild) pb.firstChild.remove(); }
  function strip(html) {
    const t = document.createElement("template"); t.innerHTML = html;
    t.content.querySelectorAll("*").forEach((e) => { for (const a of [...e.attributes]) if (/^(id|for|name|data-menu|data-item|on.*)$/i.test(a.name)) e.removeAttribute(a.name); if (/^(BUTTON|INPUT|SELECT|TEXTAREA)$/.test(e.tagName)) { e.setAttribute("disabled", ""); e.setAttribute("tabindex", "-1"); } if (e.hasAttribute("tabindex") && e.getAttribute("tabindex") !== "-1") e.setAttribute("tabindex", "-1"); });
    const d = document.createElement("div"); d.appendChild(t.content); return d.innerHTML;
  }
  function shadowSet(pb, html) {
    const hasHost = pb.firstElementChild && pb.firstElementChild.classList.contains("mirhost") && pb.children.length === 1;
    if (pb._src === html && hasHost) return; pb._src = html;
    if (!hasHost) { while (pb.firstChild) pb.firstChild.remove(); const h = document.createElement("div"); h.className = "mirhost"; pb.appendChild(h); }
    const host = pb.firstElementChild, sr = host.shadowRoot || host.attachShadow({ mode: "open" });
    try { sr.adoptedStyleSheets = [mirStyles()]; } catch (e) {}
    sr.innerHTML = `<div class=mirc inert>${html}</div>`;
  }
  const hhmm = () => { const d = new Date(); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
  function classify(n) {
    const c = n.classList || { contains: () => false };
    if (c.contains("heatbox")) return "bus";
    if (c.contains("damagebox") || c.contains("stabbox")) return "impact";
    if (c.contains("pilot")) return "skills";
    return "doll";
  }
  function sheetGroup(sh, re) { // a #sh section: its .sec header row and the siblings up to the next .sec
    const hs = [...sh.children].filter((e) => e.classList.contains("sec")); const h = hs.find((e) => re.test(e.textContent)); if (!h) return null;
    const g = [h]; let n = h.nextElementSibling; while (n && !n.classList.contains("sec") && !n.classList.contains("dv")) { g.push(n); n = n.nextElementSibling; } return g;
  }
  function harvest(force) {
    if (!built || !D().on || !area) return;
    { const lk = liveKey(); if (lastLive && lk !== lastLive && ownerKey === lastLive) { snapshot(lastLive); ownerKey = null; } }
    if (area.dataset.prof !== prof()) return renderWins();
    if (L().auto && S.sheets && S.sheets.length >= L().auto) { D().L[prof()] = preset("def"); return renderWins(); }
    const l = L(), live = liveKey(), sortie = typeof S !== "undefined" && S.view === "sortie";
    // focus survival
    const fid = focusSnap() || pendF; pendF = null;
    // live doll window: first doll bound to the live mech; #bar always goes there (or to the first doll window)
    const dolls = l.wins.filter((w) => w.k === "doll");
    dolls.forEach((w) => { if (!w.mech && live) w.mech = live; });
    const liveDoll = dolls.find((w) => resolve(w) === live) || null, barWin = liveDoll || dolls[0];
    area.querySelectorAll(".win").forEach((e) => e.classList.remove("live"));
    if (liveDoll) winEl(liveDoll.id).classList.add("live");
    const bw = barWin && winEl(barWin.id);
    if (bw) { const b = bw.querySelector(".win-b"), bar = $("bar"), con = $("con"); if (bar && bar.parentNode !== b) b.insertBefore(bar, b.firstChild); if (con && con.parentNode !== b) b.appendChild(con); }
    // live -> mirror stamp
    // single-instance assignment
    const assign = {}; // t -> pn
    const pnState = [];
    for (const w of l.wins) { const el = winEl(w.id); if (!el) continue; for (const p of w.P) { const pn = el.querySelector('.pn[data-p="' + p.id + '"]'); if (!pn) continue; const k = resolve(w); let s; if (k === live && !assign[p.t]) { assign[p.t] = pn; s = "live"; } else if (k === live) s = "copy"; else s = cache[k] && cache[k][p.t] != null ? "mirror" : "none"; pnState.push([pn, s, w, p, k]); } }
    liveHost = assign;
    const out = $("out"), wrapEl = out && (out.querySelector(":scope>.sorhead") ? out : out.firstElementChild), fresh = sortie && wrapEl && wrapEl.querySelector(":scope>.sorhead");
    document.body.classList.toggle("dk-sortie", !!(sortie && (fresh || (assign.doll && assign.doll.querySelector(".pb>.sorhead")))));
    if (fresh) {
      const groups = { doll: [], bus: [], impact: [], skills: [], rolls: [] };
      [...wrapEl.children].forEach((n) => groups[classify(n)].push(n));
      const pil = groups.skills[0], pbot = pil && pil.querySelector(":scope>.pbot");
      if (pbot && assign.rolls) groups.rolls.push(pbot);
      for (const t of Object.keys(groups)) {
        const host = assign[t] || assign.doll; if (!host) continue;
        const pb = host.querySelector(".pb");
        if (assign[t]) emptyPb(pb);
        if (t === "rolls" && groups.rolls.length) { const d = document.createElement("div"); d.className = "pilot dkrolls"; groups.rolls.forEach((n) => d.appendChild(n)); pb.appendChild(d); continue; }
        groups[t].forEach((n) => pb.appendChild(n));
      }
      if (!assign.doll) document.body.classList.remove("dk-sortie");
      let idl = ""; try { idl = idline(); } catch (e) {} const shd = groups.doll.find((n) => n.classList && n.classList.contains("sorhead"));
      ownerKey = shd && idl && shd.textContent.includes(idl) ? live : null;
    }
    const sh = $("sh");
    if (sh) for (const [t, re] of [["arms", /ARMAMENT/], ["frame", /CHASSIS/]]) { if (!assign[t]) continue; const g = sheetGroup(sh, re); if (!g) continue; const pb = assign[t].querySelector(".pb"); emptyPb(pb); const d = document.createElement("div"); d.className = "sheet dksec"; g.forEach((n) => d.appendChild(n)); pb.appendChild(d); }
    // copies / mirrors / not-yet-viewed
    for (const [pn, s, w, p, k] of pnState) {
      pn.dataset.s = s; const pb = pn.querySelector(".pb"), mb = pn.querySelector(".mbar");
      if (s === "live") { pb.querySelectorAll(":scope>.mirhost").forEach((x) => x.remove()); pb._src = null; mb.hidden = true; continue; }
      if (s === "copy") { const src = assign[p.t]; const hw = src && src.closest(".win"); mb.hidden = false; mb.innerHTML = `<span>◇ COPY · LIVE IN ${esc2(hw ? hw.querySelector(".wt").textContent : "?")}</span><button type=button data-go="${hw ? hw.dataset.id : ""}" title="Go to the live panel">GO</button>`; shadowSet(pb, src ? strip(src.querySelector(".pb").innerHTML) : ""); continue; }
      if (s === "mirror") { mb.hidden = false; mb.innerHTML = `<span>◇ MIRROR · ${esc2(l.seen[k] || "--:--")} · MAKE LIVE TO EDIT</span><button type=button data-ml="${esc2(k)}" title="Make this mech the live sheet">◆ MAKE LIVE</button>`; shadowSet(pb, cache[k][p.t]); continue; }
      mb.hidden = false; mb.innerHTML = `<span>◇ NOT YET VIEWED</span><button type=button data-ml="${esc2(k || "")}" title="Make this mech the live sheet">◆ MAKE LIVE</button>`; shadowSet(pb, `<div class=dim style="padding:12px">NOT YET VIEWED · MAKE LIVE ONCE TO CACHE</div>`);
    }
    lastLive = live;
    if (fid) { const n = focusFind(fid); if (n && n !== document.activeElement) { n.focus(); try { if (fid.v != null && n.value !== fid.v && n.type !== "number") n.value = fid.v; if (fid.s != null) n.setSelectionRange(fid.s, fid.e); } catch (e) {} } }
    paint();
  }
  const esc2 = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function snapshot(k) {
    if (!k) return; const c = cache[k] || (cache[k] = {});
    for (const t of Object.keys(liveHost)) { const pn = liveHost[t]; if (pn && pn.isConnected && pn.dataset.s === "live") c[t] = strip(pn.querySelector(".pb").innerHTML); }
    L().seen[k] = hhmm();
  }
  function makeLive(k) { const i = keyIdx(k); if (i < 0) return toast2("MAKE LIVE :: that mech is not on this table"); snapshot(liveKey()); if (i !== S.cur) shGo(i); harvest(true); }

  let pendF = null;
  const FQ = "input,select,textarea,button";
  function focusSnap() {
    const ae = document.activeElement; if (!(ae && area && area.contains(ae) && ae !== document.body)) return null;
    let a = null, b = null; try { a = ae.selectionStart; b = ae.selectionEnd; } catch (e) {}
    const pn = ae.closest(".pn"), win = ae.closest(".win"); let t = null, ix = -1;
    if (pn) { t = pn.dataset.t; ix = Array.from(pn.querySelector(".pb").querySelectorAll(FQ)).indexOf(ae); }
    else if (win) { t = "@" + win.dataset.k; ix = Array.from(win.querySelector(".win-b").querySelectorAll(FQ)).indexOf(ae); }
    return { id: ae.id || null, t, ix, v: ae.value, s: a, e: b };
  }
  function focusFind(f) {
    if (f.id) { const n = $(f.id); if (n) return n; }
    if (!f.t || f.ix < 0) return null;
    let root = null;
    if (f.t[0] === "@") { const w = area.querySelector(`.win[data-k="${f.t.slice(1)}"] .win-b`); root = w; }
    else { const pn = liveHost[f.t]; root = pn && pn.isConnected && pn.dataset.s === "live" ? pn.querySelector(".pb") : null; }
    return root ? root.querySelectorAll(FQ)[f.ix] || null : null;
  }
  /* ---------- geometry ---------- */
  function place(id) {
    const w = W(id), el = winEl(id); if (!w || !el) return;
    const A = area.getBoundingClientRect(); if (!A.width) return;
    const hh = Math.min(Math.round(w.h * A.height), A.height), ww = Math.min(Math.round(w.w * A.width), A.width);
    el.style.width = ww + "px"; el.style.height = hh + "px";
    el.style.left = clamp(Math.round(w.x * A.width), 0, Math.max(0, A.width - ww)) + "px";
    el.style.top = clamp(Math.round(w.y * A.height), 0, Math.max(0, A.height - hh)) + "px";
    el.style.zIndex = (w.pin ? 900 : 0) + (w.z || 10);
    el.classList.toggle("col", !!w.col); el.classList.toggle("min", !!w.min); el.classList.toggle("max", !!w.max); el.classList.toggle("pin", !!w.pin);
  }
  function placeAll() { if (!area) return; L().wins.forEach((w) => place(w.id)); paint(); }
  function commit(id) { const w = W(id), el = winEl(id), A = area.getBoundingClientRect(); if (!w || !el || !A.width) return; const r = (n) => Math.round(n * 1e5) / 1e5; w.x = r(el.offsetLeft / A.width); w.y = r(el.offsetTop / A.height); w.w = r(el.offsetWidth / A.width); w.h = r(el.offsetHeight / A.height); save(); }
  function sizeCommit(id) { const w = W(id), el = winEl(id); if (!w || !el || w.col || w.max || w.pin) return; const A = area.getBoundingClientRect(); if (Math.abs(w.w * A.width - el.offsetWidth) > 2 || Math.abs(w.h * A.height - el.offsetHeight) > 2) commit(id); }
  function focusWin(id, show) {
    const l = L(), w = W(id); if (!w) return;
    if (show && (w.min || w.col)) { w.min = false; w.col = false; place(id); }
    area.querySelectorAll(".win").forEach((e) => { const on = e.dataset.id === id; e.classList.toggle("focus", on); if (on) e.setAttribute("aria-current", "true"); else e.removeAttribute("aria-current"); });
    const top = Math.max(10, ...l.wins.map((x) => x.z || 10));
    if ((w.z || 10) < top || l.wins.filter((x) => (x.z || 10) === top).length > 1) { w.z = top + 1; if (w.z > 799) { let z = 10; l.wins.slice().sort((a, b) => (a.z || 10) - (b.z || 10)).forEach((x) => { x.z = ++z; }); } l.wins.forEach((x) => { const e = winEl(x.id); if (e) e.style.zIndex = (x.pin ? 900 : 0) + x.z; }); }
    paint(); // never promotes: only makeLive() calls shGo()
  }
  function act(id, a) {
    const w = W(id); if (!w) return;
    if (a === "col") w.col = !w.col;
    else if (a === "min") w.min = true;
    else if (a === "max") { w.max = !w.max; w.col = false; }
    else if (a === "pin") w.pin = !w.pin;
    else if (a === "rm") { const o = ["compact", "rail", "full"]; w.rm = o[(o.indexOf(w.rm) + 1) % 3]; const W0 = { compact: 124, rail: 40, full: 176 }[w.rm], A = area.getBoundingClientRect(); w.w = Math.round((W0 / A.width) * 1000) / 1000; winEl(id).dataset.rm = w.rm; }
    else if (a === "close") return kill(id);
    save(); place(id); paint();
    if (a === "min") { const c = tb.querySelector('.chip2[data-id="' + id + '"]'); if (c) c.focus(); }
  }
  function spawn(w) { const l = L(); w.id = "w" + nid(); w.z = Math.max(10, ...l.wins.map((x) => x.z || 10)) + 1; w.P = (w.P || []).map((p) => ({ t: p.t, id: "p" + nid(), home: p.home || w.id })); l.wins.push(w); save(); renderWins(); focusWin(w.id); return w; }
  function kill(id) { const l = L(), w = W(id); if (!w) return; if (w.k === "console") return; if (w.k === "doll" && l.wins.filter((x) => x.k === "doll").length < 2) return toast2("DESK :: at least one paper doll window stays open"); l.wins = l.wins.filter((x) => x.id !== id); save(); renderWins(); }
  function tear(id, pid) { const w = W(id); if (!w || w.P.length < 2) return; const p = w.P.find((x) => x.id === pid); if (!p) return; w.P = w.P.filter((x) => x !== p); const el = winEl(id); spawn({ k: "float", mech: w.k === "doll" ? w.mech : w.mech || "@live", x: clamp(w.x + 0.03, 0, 0.7), y: clamp(w.y + 0.05, 0, 0.6), w: 0.28, h: 0.36, P: [{ t: p.t, home: p.home || id }] }); }
  function dockHome(id, pid) { const w = W(id), p = w && w.P.find((x) => x.id === pid), h = p && W(p.home); if (!p || !h || h === w) return; if (!h.P.some((x) => x.t === p.t)) h.P.push({ t: p.t, id: p.id, home: p.home }); w.P = w.P.filter((x) => x !== p); if (!w.P.length && w.k === "float") L().wins = L().wins.filter((x) => x !== w); save(); renderWins(); }
  function dockInto(src, dst) { // drop a window's title on another window's title strip
    const a = W(src), b = W(dst); if (!a || !b || a === b || ["console", "roster"].includes(a.k) || ["console", "roster", "sheet"].includes(b.k)) return false;
    if (a.k === "sheet") { if (!b.P.some((x) => x.t === "frame")) b.P.push({ t: "frame", id: "p" + nid(), home: b.id }); if (!b.P.some((x) => x.t === "arms")) b.P.push({ t: "arms", id: "p" + nid(), home: b.id }); }
    else a.P.forEach((p) => { if (!b.P.some((x) => x.t === p.t)) b.P.push(p); });
    if (a.k === "doll" && L().wins.filter((x) => x.k === "doll").length < 2) return false;
    L().wins = L().wins.filter((x) => x !== a); save(); renderWins(); return true;
  }

  /* ---------- drag + snap ---------- */
  let drag = null;
  function dragStart(e, id) {
    if (e.button !== 0 || e.target.closest("button,select")) return;
    const w = W(id), el = winEl(id); if (!w || w.max || w.pin) return;
    drag = { id, el, x0: e.clientX, y0: e.clientY, l: el.offsetLeft, t: el.offsetTop, dx: 0, dy: 0 }; el.classList.add("drag"); if (L().snap) area.classList.add("snapping");
    const t = el.querySelector(".win-t"); try { t.setPointerCapture(e.pointerId); } catch (x) {}
    const mv = (ev) => { if (!drag) return; drag.dx = ev.clientX - drag.x0; drag.dy = ev.clientY - drag.y0; drag.cx = ev.clientX; drag.cy = ev.clientY; el.style.transform = `translate(${drag.dx}px,${drag.dy}px)`; };
    const up = () => {
      t.removeEventListener("pointermove", mv); t.removeEventListener("pointerup", up); t.removeEventListener("pointercancel", up);
      area.classList.remove("snapping"); if (!drag) return; const d = drag; drag = null;
      el.style.transform = ""; el.classList.remove("drag");
      if (d.dx || d.dy) {
        // dropped on another title strip -> dock
        el.style.visibility = "hidden"; const hit = document.elementFromPoint(d.cx, d.cy); el.style.visibility = "";
        const ot = hit && hit.closest && hit.closest(".win-t"), ow = ot && ot.closest(".win");
        if (ow && ow !== el && dockInto(id, ow.dataset.id)) return;
        const A = area.getBoundingClientRect(); let X = d.l + d.dx, Y = d.t + d.dy;
        if (L().snap) { const sn = snapXY(id, X, Y, el.offsetWidth, el.offsetHeight, A); X = sn[0]; Y = sn[1]; }
        el.style.left = clamp(X, 0, Math.max(0, A.width - el.offsetWidth)) + "px"; el.style.top = clamp(Y, 0, Math.max(0, A.height - el.offsetHeight)) + "px";
        commit(id);
      }
    };
    t.addEventListener("pointermove", mv); t.addEventListener("pointerup", up); t.addEventListener("pointercancel", up);
  }
  function snapXY(id, X, Y, w, h, A) {
    const G = 8, T = 8; let x = Math.round(X / G) * G, y = Math.round(Y / G) * G;
    const ex = [0, A.width], ey = [0, A.height];
    area.querySelectorAll(".win:not(.min)").forEach((e) => { if (e.dataset.id === id) return; ex.push(e.offsetLeft, e.offsetLeft + e.offsetWidth); ey.push(e.offsetTop, e.offsetTop + e.offsetHeight); });
    for (const v of ex) { if (Math.abs(X - v) <= T) x = v; else if (Math.abs(X + w - v) <= T) x = v - w; }
    for (const v of ey) { if (Math.abs(Y - v) <= T) y = v; else if (Math.abs(Y + h - v) <= T) y = v - h; }
    return [x, y];
  }

  /* ---------- taskbar ---------- */
  function tbClick(e) {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.l) return launch(b.dataset.l, b);
    if (b.classList.contains("chip2")) return chipClick(b.dataset.id);
    if (b.classList.contains("slot")) { selSlot = +b.dataset.s; return paint(); }
    if (b.id === "dkSave") return saveSlot(selSlot);
    if (b.id === "dkLoad") return loadSlot(selSlot);
    if (b.id === "deskReset") return undoL && Date.now() < undoT ? undoDef() : def();
    if (b.id === "dkSnap") { L().snap = !L().snap; save(); paint(); }
  }
  function launch(k, btn) {
    const l = L();
    if (k === "doll") return newDoll();
    if (k === "sheet") { const w = l.wins.find((x) => x.k === "sheet"); return w ? focusWin(w.id, true) : spawn({ k: "sheet", mech: "@live", x: 0.6, y: 0, w: 0.4, h: 0.6, P: [] }); }
    if (k === "console") { const w = l.wins.find((x) => x.k === "console"); return w && focusWin(w.id, true); }
    if (k === "users") {
      if (rosterOK() && document.body.classList.contains("mp-linked")) { const w = l.wins.find((x) => x.k === "roster"); return w ? focusWin(w.id, true) : spawn({ k: "roster", x: 0, y: 0, w: 0.07, h: 1, rm: "rail", P: [] }); }
      if (window.mpSeats && document.body.classList.contains("mp-linked")) { const c = l.wins.find((x) => x.k === "console"); if (c) focusWin(c.id, true); return window.mpSeats(); }
      return toast2("USERS :: link to a table first");
    }
    if (k === "panels") return openMenu(btn, Object.keys(PT).map((t) => ({ l: PT[t] + (liveHost[t] ? " · open" : ""), run: () => { const h = liveHost[t]; if (h) focusWin(h.closest(".win").dataset.id, true); else spawn({ k: "float", mech: "@live", x: 0.3, y: 0.2, w: 0.3, h: 0.4, P: [{ t }] }); } })));
  }
  function newDoll() { const l = L(), shown = new Set(l.wins.filter((x) => x.k === "doll").map(resolve)); const ks = (S.sheets || []).map((_, i) => shKey(i)); const k = ks.find((x) => !shown.has(x)) || liveKey(); const n = l.wins.filter((x) => x.k === "doll").length; spawn({ k: "doll", mech: k, acc: n % 5, x: clamp(0.05 * n, 0, 0.6), y: clamp(0.04 * n, 0, 0.4), w: 0.3, h: 0.55, P: [{ t: "doll" }, { t: "bus" }] }); }
  function chipClick(id) { const w = W(id), el = winEl(id); if (!w) return; if (w.min) { w.min = false; place(id); return focusWin(id); } if (el.classList.contains("focus")) return act(id, "min"); focusWin(id, true); }
  function openMenu(btn, items) { closeMenu(); menuEl = document.createElement("div"); menuEl.id = "dkmenu"; menuEl.setAttribute("role", "menu"); items.forEach((it) => { const b = document.createElement("button"); b.type = "button"; b.setAttribute("role", "menuitem"); b.textContent = it.l; b.onclick = () => { closeMenu(); it.run(); }; menuEl.appendChild(b); }); document.body.appendChild(menuEl); const r = btn.getBoundingClientRect(); menuEl.style.left = r.left + "px"; menuEl.style.top = Math.max(4, r.top - menuEl.offsetHeight - 4) + "px"; const f = menuEl.querySelector("button"); if (f) f.focus(); }
  function closeMenu() { if (menuEl) { menuEl.remove(); menuEl = null; } }
  function toast2(m) { try { toast(m); } catch (e) {} }

  /* ---------- slots ---------- */
  function slots() { const d = D(), p = prof(); if (!d.slots[p] || typeof d.slots[p] !== "object") d.slots[p] = {}; return d.slots[p]; }
  function saveSlot(n) { const l = L(), A = area.getBoundingClientRect(); slots()[n] = { v: 2, name: l.wins.filter((w) => w.k === "doll").length + " DOLL · " + l.wins.length + " WIN", saved: new Date().toISOString(), area: { w: Math.round(A.width), h: Math.round(A.height) }, layout: JSON.parse(JSON.stringify(l)) }; noWrite = false; save(); selSlot = n; paint(); toast2("LAYOUT SLOT " + n + " SAVED :: " + slots()[n].name); }
  function loadSlot(n) {
    const s = slots()[n]; selSlot = n;
    if (!s) return toast2("LAYOUT SLOT " + n + " IS EMPTY");
    if (!s || typeof s !== "object" || s.v !== 2 || !s.layout) return toast2("LAYOUT SLOT " + n + " REJECTED :: unknown or future format; layout unchanged");
    const r = sanitize(s.layout); if (!r.L) return toast2("LAYOUT SLOT " + n + " REJECTED :: corrupt; layout unchanged");
    D().L[prof()] = r.L; save(); renderWins();
    toast2("LAYOUT SLOT " + n + " LOADED" + (r.rep.dropped || r.rep.relinked ? " :: " + r.rep.dropped + " dropped, " + r.rep.relinked + " relinked" : ""));
  }
  function def() { undoL = JSON.parse(JSON.stringify(L())); undoT = Date.now() + 8000; D().L[prof()] = preset("def"); noWrite = false; save(); renderWins(); setTimeout(paint, 8100); }
  function undoDef() { const r = sanitize(undoL); undoL = null; undoT = 0; if (r.L) { D().L[prof()] = r.L; save(); renderWins(); } }

  /* ---------- keys ---------- */
  function keys(e) {
    if (!D().on || !(e.ctrlKey && e.altKey)) return;
    const dg = /^Digit([1-5])$/.exec(e.code);
    if (dg) { e.preventDefault(); e.stopPropagation(); e.__deskOwned = true; return e.shiftKey ? saveSlot(+dg[1]) : loadSlot(+dg[1]); }
    if (e.code === "KeyN") { e.preventDefault(); e.stopPropagation(); e.__deskOwned = true; newDoll(); }
  }

  /* ---------- paint (titles, chips) ---------- */
  function paint() {
    const on = D().on, b = $("deskBtn");
    if (b) { b.textContent = on ? "[CLASSIC]" : "[DESK]"; b.title = on ? "Switch to the classic two-panel layout" : "Switch to the desktop layout (windows)"; b.setAttribute("aria-pressed", on ? "true" : "false"); }
    if (!built || !on || !area) return;
    const l = L(), live = liveKey(), view = typeof S !== "undefined" ? S.view : "";
    const mod = view === "sortie" || view === "intel" ? "" : view === "catalog" || view === "catalogEdit" ? "COMPONENT REGISTRY" : view === "main" || view === "chassis" ? "FRAME ASSEMBLY" : "ACCESS ROUTER";
    const ks = (S.sheets || []).map((_, i) => shKey(i));
    const chips = [];
    for (const w of l.wins) {
      const el = winEl(w.id); if (!el) continue;
      const k = resolve(w), isLive = w.k === "doll" && el.classList.contains("live"), isBar = el.querySelector(":scope>.win-b>#bar");
      let title;
      if (w.k === "console") title = "OPERATOR CONSOLE";
      else if (w.k === "roster") title = "USERS";
      else if (w.k === "sheet") title = (k ? keyName(k) + " // " : "") + "FRAME SHEET";
      else if (w.k === "doll") title = (isBar && mod ? mod : (k ? keyName(k) + " // " : "") + "PAPER DOLL") + (isBar && window.MP && window.MP.editing ? " // BENCH" : "");
      else title = w.P.map((p) => PT[p.t]).join(" + ");
      const t = el.querySelector(".wt"); if (t.textContent !== title) t.textContent = title;
      el.dataset.m = k || ""; el.dataset.live = isLive ? "1" : "";
      el.classList.toggle("vmax", !!(isBar && mod));
      const lead = el.querySelector(".wlead"); if (lead) { const lh = isLive ? `<span class=ltag title="This doll shows the live sheet">◆ LIVE</span>` : `<button type=button data-ml="${esc2(k || "")}" title="Make this mech the live sheet" aria-label="Make live">◆ MAKE LIVE</button>`; if (lead.dataset.h !== lh) { lead.innerHTML = lh; lead.dataset.h = lh; } }
      const sel = el.querySelector(".wsel");
      if (sel) { const want = ks.map((x) => `<option value="${esc2(x)}"${x === k ? " selected" : ""}>${esc2(keyName(x))}</option>`).join("") || `<option>${esc2(keyName(k))}</option>`; if (sel.dataset.h !== want) { sel.innerHTML = want; sel.dataset.h = want; } sel.disabled = isLive; sel.title = isLive ? "Locked: this is the live doll. Use MAKE LIVE on another doll, or a sheet tab, to switch." : "Show another mech in this mirror window (does not make it live)"; }
      const cb = el.querySelector("[data-a=col]"); cb.textContent = w.col ? "+" : "–"; cb.title = cb.ariaLabel = w.col ? "Expand window" : "Collapse window"; cb.setAttribute("aria-expanded", w.col ? "false" : "true");
      const mb = el.querySelector("[data-a=max]"); mb.title = mb.ariaLabel = w.max ? "Restore size" : "Maximize";
      const pb = el.querySelector("[data-a=pin]"); pb.setAttribute("aria-pressed", w.pin ? "true" : "false");
      const st = w.k === "doll" ? (isLive ? "◆" : "◇") : w.mech === "@live" ? "⛓" : w.k === "float" ? "◇" : "";
      const ty = w.k === "doll" || w.k === "float" ? w.P.map((p) => PSHORT[p.t]).join("+") || "DOLL" : w.k.toUpperCase();
      const g = w.min ? "_" : w.col ? "–" : w.pin ? "⌖" : "●";
      chips.push(`<button type=button class="chip2${w.min ? " min" : ""}" data-id="${w.id}" style="--a:${ACC[w.acc || 0]}" title="${esc2(title)} (click: focus; again: minimize)" aria-pressed=${!w.min}>${g} ${st}${k && w.k !== "console" && w.k !== "roster" ? esc2(short(k)) + "·" : ""}${ty}</button>`);
      if (w.k === "doll" && !isLive) { const fz = el.querySelector(".wlead button"); if (fz) fz.disabled = !k || keyIdx(k) < 0; }
    }
    const tc = tb.querySelector(".tbchips"), html = chips.join(""); if (tc.dataset.h !== html) { tc.innerHTML = html; tc.dataset.h = html; }
    tb.querySelectorAll(".slot").forEach((s) => { const n = +s.dataset.s, v = slots()[n]; s.classList.toggle("sel", n === selSlot); s.setAttribute("aria-pressed", n === selSlot ? "true" : "false"); s.dataset.full = v ? "1" : ""; });
    const sn = $("dkSnap"); if (sn) sn.setAttribute("aria-pressed", l.snap ? "true" : "false");
    const dr = $("deskReset"); if (dr) { const u = undoL && Date.now() < undoT; dr.textContent = u ? "UNDO" : "DEF"; dr.title = u ? "Undo the reset (8 s)" : "Reset to the default layout (UNDO for 8 s)"; }
    const ub = tb.querySelector("[data-l=users]"); if (ub) ub.setAttribute("aria-pressed", window.MP && window.MP.seatsOpen ? "true" : "false");
  }

  /* ---------- CLASSIC / DESK ---------- */
  function hostIn() { ["bar", "con", "sh", "cb"].forEach((id) => { const n = $(id); if (n && !home[id]) home[id] = { p: n.parentNode, nx: n.nextSibling }; }); renderWins(); }
  function hostOut() {
    ["bar", "con", "sh", "cb"].forEach((id) => { const n = $(id), h = home[id]; if (!n || !h) return; if (h.nx && h.nx.parentNode === h.p) h.p.insertBefore(n, h.nx); else h.p.appendChild(n); });
    const mpf = $("mpfriends"), cb = $("cb"); if (mpf && cb && mpf.parentElement !== cb) cb.appendChild(mpf);
    if (area) { area.querySelectorAll(".pb").forEach(emptyPb); area.innerHTML = ""; }
    liveHost = {}; document.body.classList.remove("dk-sortie");
  }
  function setOn(on) {
    D().on = !!on; noWrite = false; save(true);
    if (on) { document.body.classList.add("desk"); hostIn(); } else { hostOut(); document.body.classList.remove("desk"); }
    try { _Rdesk(); } catch (e) {}
    if (on) harvest(true);
    paint(); const s = $("sr"); if (s) s.textContent = on ? "Desktop layout" : "Classic layout";
  }

  const _Rdesk = R;
  R = function () { try { const f = focusSnap(); if (f) pendF = f; } catch (e) {} const r = _Rdesk.apply(this, arguments); try { if (ready && D().on && built) harvest(false); } catch (e) { console.warn(e); } return r; };
  window.Desk = {
    on: () => !!D().on, set: setOn, preset: (n) => { D().L[prof()] = preset(n); save(); renderWins(); }, reset: def, layout: () => L(), harvest: () => harvest(true), makeLive, focus: focusWin, act, spawn, kill, tear, dockHome, dockInto, saveSlot, loadSlot, sanitize, shKey, liveKey, liveHost: () => liveHost, cache: () => cache,
    rosterHost() { if (!D().on || !built || !rosterOK()) return null; const w = L().wins.find((x) => x.k === "roster"); const el = w && winEl(w.id); return el ? el.querySelector(".win-b") : null; },
    ownsBar() { const b = $("bar"); return !!(D().on && built && area && b && area.contains(b)); },
  };
  function boot() {
    let bad = false;
    try { const raw = JSON.parse(localStorage.getItem(typeof UIKEY !== "undefined" ? UIKEY : "forge_ui_v1") || "null"); if (raw && raw.desk2 && (typeof raw.desk2 !== "object" || raw.desk2.v > 2)) bad = true; } catch (e) { bad = true; }
    if (bad) { noWrite = true; UI.desk2 = { v: 2, on: true, L: {}, slots: {} }; setTimeout(() => toast2("DESK LAYOUT :: stored layout unreadable or from a newer build; default loaded, store untouched until you SAVE or press DEF"), 1500); }
    else { const p = prof(), d = D(); if (d.L[p]) { const r = sanitize(d.L[p]); d.L[p] = r.L || preset("def"); } }
    build(); ready = true;
    if (D().on) setOn(true); else paint();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
