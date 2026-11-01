# Builds out/mp-bridge.js from the original. Never edits the original.
import sys
SRC='/workspace/forge-os/from-grok/FORGE-OS-sortie-app/public/mp-bridge.js'; DST='/workspace/forge-os/out/mp-bridge.js'
t=open(SRC,encoding='utf-8').read()
def rep(old,new,count=1):
    global t
    n=t.count(old)
    if n!=count: sys.exit(f'PATCH FAIL ({n} matches, want {count}): {old[:100]!r}')
    t=t.replace(old,new)

rep('/* Sortie link. Shares the terminal\'s script scope through window.Forge. */',
    '/* Sortie link. Shares the terminal\'s script scope through window.Forge.\n   v15 (FORGE-OS 5.1): remote console HTML rebuilt from an allow-list (R7); unsent edits survive polls and\n   409s via a 3-way merge with one tie rule, host wins / last write while the host is away (R1/R2); undo sends\n   additive inverse impacts and keeps queued hits (R3); queued hits and lines are never dropped (R4); the\n   revision is frozen in the frame editor (R5); reconnect, backoff, hidden-tab polling and [RE-AUTH] (R6);\n   only the host clears the shared log (R9); no seat is taken on the login screen. See SERVER-CONTRACT.md. */')
rep('''    clearUntil: 0,
  };''','''    clearUntil: 0,
    rtt: null,
    fails: 0,
    looping: false,
    stuck: false,
    confAt: 0,
    features: null,
    popped: new Set(),
    lastSt: "",
  };''')

# ---- R7: sanitiser for any HTML that came from another seat ----
rep('''  function rid() {''','''  const SAFE_TAG = /^(SPAN|B|I|U|EM|STRONG|SMALL|BR|DIV|SUP|SUB)$/;
  function cleanHtml(html) {
    const tpl = document.createElement("template");
    tpl.innerHTML = String(html == null ? "" : html);
    const walk = (node) => {
      for (const ch of Array.from(node.childNodes)) {
        if (ch.nodeType === 1) {
          if (!SAFE_TAG.test(ch.tagName)) { ch.replaceWith(document.createTextNode(ch.textContent || "")); continue; }
          for (const a of Array.from(ch.attributes)) {
            const n = a.name.toLowerCase(), v = a.value;
            let ok = false;
            if (n === "class") ok = /^[\\w -]{0,80}$/.test(v);
            else if (n === "data-ev" || n === "data-undo-of") ok = /^[\\w-]{1,40}$/.test(v);
            else if (n === "title") ok = v.length < 200;
            else if (n === "style") ok = /^\\s*color\\s*:\\s*(#[0-9a-fA-F]{3,8}|var\\(--[\\w-]+\\))\\s*;?\\s*$/.test(v);
            if (!ok) ch.removeAttribute(a.name);
          }
          walk(ch);
        } else if (ch.nodeType !== 3) ch.remove();
      }
    };
    walk(tpl.content);
    const d = document.createElement("div");
    d.appendChild(tpl.content);
    return d.innerHTML;
  }
  function safeTone(k) { return /^(ok|bad|warn|dim)$/.test(String(k || "")) ? k : "dim"; }

  function rid() {''')
rep('''        if (silent) {
          const d = document.createElement("div");
          d.innerHTML = `<span class="${tone || "dim"}">${html || ""}</span>`;''','''        if (silent) {
          const d = document.createElement("div");
          if (typeof logKind === "function") d.dataset.k = logKind(html);
          d.innerHTML = (typeof logTs === "function" ? `<span class=ts aria-hidden=true>${logTs()}</span>` : "") + `<span class="${safeTone(tone)}">${html || ""}</span>`;''')
rep('''        const wrapped = `<span class="${tone || "dim"}">${html || ""}</span>`;''','''        const wrapped = `<span class="${safeTone(tone)}">${html || ""}</span>`;''')
rep('''          d.className = tone || "dim";''','''          d.className = safeTone(tone);''')
rep('''      const who = `<span style="color:${actorColor(r.actor, r.color)}">${esc(r.actor)}</span> <span class=dim>//</span> <span style="color:${unitColor(r.uid)}">${esc(r.unit)}</span> `;
      speakRemote(who + (r.html || ""), r.tone || "dim");''','''      const who = `<span style="color:${actorColor(r.actor, r.color)}">${esc(r.actor)}</span> <span class=dim>//</span> <span style="color:${unitColor(r.uid)}">${esc(r.unit)}</span> `;
      const body = cleanHtml(r.html || "");
      speakRemote(who + body, safeTone(r.tone), catchup);
      if (catchup) continue;
      try {
        const plain = body.replace(/<[^>]*>/g, "");
        if (/DAMAGE|penetrates/i.test(plain) && typeof announceHit === "function") announceHit(String(r.actor || "Another seat"));
      } catch (e) { /* announcements are best effort */ }''')

# ---- R1/R2: 3-way merge after a 409 ----
rep('''  function rebase(payload) {''','''  function merge3(base, mine, theirs, path, pick, numeric, uid) {
    const sb = stable(base), sm = stable(mine), st = stable(theirs);
    if (sm === sb || sm === st) return theirs;
    if (st === sb) return mine;
    const obj = (v) => v && typeof v === "object";
    if (obj(mine) && obj(theirs) && Array.isArray(mine) === Array.isArray(theirs)) {
      const res = Array.isArray(mine) ? [] : {};
      const keys = new Set([...Object.keys(mine), ...Object.keys(theirs)]);
      for (const k of keys) res[k] = merge3(base == null ? undefined : base[k], mine[k], theirs[k], path + "." + k, pick, numeric, uid);
      return res;
    }
    if (numeric && typeof base === "number" && typeof mine === "number" && typeof theirs === "number") return theirs + (mine - base);
    return pick({ uid, path: path.replace(/^\\./, ""), base, mine, theirs });
  }

  function mergeStack(b, m, t) {
    const sb = stable(b), sm = stable(m);
    if (sm === sb) return t;
    if (stable(t) === sb) return m;
    const key = (e) => (e && (e.id || e.l + "|" + String(e.t || "").length)) || "";
    const have = new Set((t || []).map(key));
    return (t || []).concat((m || []).filter((e) => !have.has(key(e)))).slice(-40);
  }

  function unitName(uid) {
    const S = Forge.state();
    const i = (S.sheets || []).findIndex((s) => s.uid === uid);
    return i >= 0 ? sheetTitle(S.sheets[i], i) : "UNIT";
  }

  function fmtV(v) { const s = v === undefined ? "--" : JSON.stringify(v); return s.length > 28 ? s.slice(0, 27) + "~" : s; }

  /* R1/R2: local edits that have not reached the server yet survive every snapshot (polls inside
     the 220ms send delay, 409s, the host replay). Sheets this seat may write are merged 3-way
     against the last shadow: untouched fields take the table value, numeric telemetry adds both
     sides' deltas, and a real collision is settled by one rule: the host's value wins; while the
     host is offline the last writer wins. Every collision is logged with both values. */
  function dirtyWritable(mineSheets) {
    const byBase = new Map((MP.shadow || []).map((s) => [s.uid, s]));
    return mineSheets.filter((m) => {
      const b = byBase.get(m.uid);
      if (!b || !m.d || !b.d) return false;
      if (!(MP.role === "host" || b.ownerId === MP.selfId)) return false;
      return stable(split(m.d)) !== stable(split(b.d));
    });
  }

  function mergeDirty(sheets, baseShadow, dirty) {
    const byBase = new Map(baseShadow.map((s) => [s.uid, s]));
    const found = [];
    const keepMine = MP.role === "host" || !MP.hostOnline;
    for (const m of dirty) {
      const sh = (sheets || []).find((s) => s.uid === m.uid);
      const b = byBase.get(m.uid);
      if (!sh || !sh.d || !b) continue;
      const B = split(b.d), M = split(m.d), T = split(sh.d);
      const hits = [];
      const pick = (c) => { hits.push(c); return keepMine ? c.mine : c.theirs; };
      const rest = merge3(B.rest, M.rest, T.rest, "", pick, false, sh.uid);
      const telv = merge3(B.tel, M.tel, T.tel, "tel", pick, true, sh.uid);
      const d = Object.assign({}, rest, { tel: telv, undo: mergeStack(B.undo, M.undo, T.undo), stab: stable(M.stab) === stable(B.stab) ? T.stab : M.stab });
      for (const k of ["dmg", "uiHP", "info"]) if (m.d[k] !== undefined) d[k] = m.d[k];
      sh.d = d;
      found.push(...hits);
    }
    if (!found.length) return;
    MP.confAt = Date.now();
    for (const c of found.slice(0, 6)) {
      const label = unitName(c.uid) + " " + c.path;
      const rule = MP.role === "host" ? "HOST VALUE KEPT" : !MP.hostOnline ? "LAST WRITE KEPT (HOST OFFLINE)" : "HOST/TABLE VALUE KEPT // re-enter yours to override";
      noteLocal("[ -- ] CONFLICT " + label + " :: TABLE=" + fmtV(c.theirs) + " vs YOU=" + fmtV(c.mine) + " => " + rule);
    }
    if (found.length > 6) noteLocal("[ -- ] CONFLICT :: " + (found.length - 6) + " more field(s) settled by the same rule");
  }

  function noteLocal(m) { setTimeout(() => { MP.applying = true; try { Forge.say(m, "warn"); } finally { MP.applying = false; } }, 0); }

  function rebase(payload) {''')
# rebase no longer re-applies whole rest blobs (that was the host-vs-owner overwrite, R2)
rep('''    for (const r of payload.rests || []) {
      const sh = (S.sheets || []).find((s) => s.uid === r.uid);
      if (!sh) continue;
      sh.d = Object.assign({}, sh.d || {}, r.rest);
    }
  }''','''    /* rest blobs are merged field by field inside applyRemote() (mergeDirty) */
  }''')
rep('''      MP.conflictTries = 0;
      applyRemote(res);
      return true;
    } catch (err) {
      if (err.conflict) {
        applyRemote(err.conflict);
        rebase(payload);
        MP.conflictTries = (MP.conflictTries || 0) + 1;
        if (MP.conflictTries > 4) {
          MP.impacts = [];
          MP.logs = [];
          MP.conflictTries = 0;
          return false;
        }
        return true;
      }''','''      MP.conflictTries = 0;
      MP.stuck = false;
      applyRemote(res);
      return true;
    } catch (err) {
      if (err.conflict) {
        MP.confAt = Date.now();
        applyRemote(err.conflict);
        rebase(payload);
        MP.conflictTries = (MP.conflictTries || 0) + 1;
        if (MP.conflictTries > 4) {
          /* R4: never drop queued hits or lines; keep them and retry on the next tick */
          MP.stuck = true;
          MP.conflictTries = 0;
          return false;
        }
        return true;
      }''')

rep('''    const fp = stable(incoming.map((s) => ({ ...s, d: split(s.d) })));''','''    const fp = stable(incoming.map((s) => ({ ...s, d: split(s.d) })));
    let dirty = [];
    const baseShadow = MP.shadow || [];
    try { if (MP.ready) dirty = JSON.parse(JSON.stringify(dirtyWritable((S.sheets || []).filter((s) => s && s.uid).map(pack)))); } catch (e) { dirty = []; }''')
rep('''      S.sheets = JSON.parse(JSON.stringify(merged));''','''      S.sheets = JSON.parse(JSON.stringify(merged));
      if (dirty.length) { try { mergeDirty(S.sheets, baseShadow, dirty); } catch (e) { console.error("[forge] merge", e); } }''')
# late joiners: show the recent table log instead of skipping it
rep('''      MP.rollSeq = r.seq;
      if (catchup) continue;''','''      MP.rollSeq = r.seq;
      if (catchup && rolls.length - rolls.indexOf(r) > 30) continue;''')
# R9: only the host clears the shared console
rep('''    if (!(MP.on && MP.ready && !MP.applying)) return;
    MP.clearPending = true;''','''    if (!(MP.on && MP.ready && !MP.applying)) return;
    if (MP.role !== "host") { noteLocal("[ -- ] CONSOLE CLEARED ON THIS SCREEN ONLY :: the shared sortie log is cleared by the host"); return; }
    MP.clearPending = true;''')

# ---- R5: freeze the revision while the frame editor bench is open ----
rep('''      if (typeof res.revision === "number" && !MP.on) MP.rev = res.revision;''','''      if (typeof res.revision === "number" && !MP.on && !MP.editing) MP.rev = res.revision;''')
# ---- R6: reconnect, backoff, hidden-tab polling, RTT ----
rep('''  async function loop() {
    if (!MP.linked) return;
    try {
      await flush();
      await poll();
      MP.status = "online";
      MP.error = "";
    } catch (err) {
      if (err.ended || err.rejected) {
        MP.status = err.ended ? "ended" : "rejected";
        MP.error = err.message || "link closed";
        document.documentElement.classList.remove("mp-wait");
        document.body.style.visibility = "";
        report();
        return;
      }
      MP.status = "offline";
      MP.error = err.message || "link down";
      document.documentElement.classList.remove("mp-wait");
    }
    report();
    MP.timer = setTimeout(loop, MP.status === "online" ? 450 : 900);
  }''','''  async function loop() {
    clearTimeout(MP.timer);
    MP.timer = null;
    if (!MP.linked || MP.looping) return;
    MP.looping = true;
    try {
      await flush();
      const p0 = performance.now();
      await poll();
      const dt = performance.now() - p0;
      MP.rtt = MP.rtt == null ? dt : MP.rtt * 0.7 + dt * 0.3;
      MP.status = "online";
      MP.error = "";
      MP.fails = 0;
    } catch (err) {
      if (err.ended || err.rejected) {
        MP.status = err.ended ? "ended" : "rejected";
        MP.error = err.message || "link closed";
        MP.looping = false;
        document.documentElement.classList.remove("mp-wait");
        document.body.style.visibility = "";
        report();
        markSync();
        paintFriends();
        try { Forge.render(); } catch (e) { /* keep the terminal up */ }
        return;
      }
      MP.status = "offline";
      MP.error = err.message || "link down";
      MP.fails = (MP.fails || 0) + 1;
      document.documentElement.classList.remove("mp-wait");
    }
    MP.looping = false;
    report();
    markSync();
    if (!MP.linked) return;
    const delay = MP.status === "online"
      ? (document.hidden ? 4000 : (MP.stuck ? 1500 : 450))
      : Math.min(15000, 900 * Math.pow(2, Math.max(0, (MP.fails || 1) - 1)));
    MP.timer = setTimeout(loop, delay);
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && MP.linked && !MP.looping && MP.status !== "ended" && MP.status !== "rejected") void loop();
  });

  window.mpReauth = function () {
    try { localStorage.removeItem("forge_mp_token_TABLE"); } catch (e) { /* private mode */ }
    clearTimeout(MP.timer);
    MP.timer = null;
    MP.looping = false;
    MP.linked = false;
    MP.on = false;
    MP.ready = false;
    MP.token = "";
    MP.status = "offline";
    MP.error = "";
    MP.rev = -1;
    MP.shadow = [];
    MP.confAt = 0;
    document.body.classList.remove("mp-live", "mp-linked", "mp-friends-min");
    const box = document.getElementById("mpfriends");
    if (box) box.remove();
    const S = Forge.state();
    S.role = "";
    S.authRole = "";
    S.sheets = [];
    S.cur = null;
    S.view = "mpw";
    Forge.say("[ -- ] LINK RESET :: RE-ENTER YOUR CALLSIGN TO RE-AUTHENTICATE WITH THE TABLE", "warn");
    Forge.render();
  };''')

# ---- link states ----
rep('''  function syncHtml() {
    let view = "";
    try { view = Forge.state().view || ""; } catch (e) { view = ""; }
    if (!(MP.on || MP.editing || view === "sortie" || view === "intel")) return "";
    if (MP.on && MP.status === "online") return `<span class=ok>SYNC</span>`;
    if (MP.on) return `<span class=bad>LINK DOWN</span>`;
    return `<span class=dim>LOCAL</span>`;
  }

  function markSync() {
    const who = document.getElementById("who");
    if (!who) return;
    const old = who.querySelector(".mpsync");
    if (old) old.remove();
    const html = syncHtml();
    if (!html) return;
    const span = document.createElement("span");
    span.className = "mpsync";
    span.innerHTML = " " + html;
    who.appendChild(span);
  }''','''  function syncState() {
    if (MP.status === "ended" || MP.status === "rejected") return "err";
    if (!MP.on) return "local";
    if (MP.status !== "online") return "off";
    if (MP.stuck || (MP.confAt && Date.now() - MP.confAt < 6000)) return "conf";
    if (MP.rtt != null && MP.rtt > 600) return "lag";
    return "ok";
  }

  function syncText(st) {
    const q = (MP.impacts || []).length + (MP.logs || []).length;
    if (st === "ok") return "[LINK OK]";
    if (st === "lag") return "[LINK LAG " + Math.round((MP.rtt || 0) / 100) * 100 + "ms]";
    if (st === "off") return "[OFFLINE \\u00b7 " + q + " QUEUED]";
    if (st === "err") return "[LINK ERR // RE-AUTH]";
    if (st === "conf") return MP.stuck ? "[RESYNC \\u00b7 " + q + " QUEUED]" : "[CONFLICT // RESYNCED]";
    return "[LOCAL]";
  }

  function syncHtml() {
    let view = "";
    try { view = Forge.state().view || ""; } catch (e) { view = ""; }
    const st = syncState();
    if (!(MP.on || MP.editing || st === "err" || view === "sortie" || view === "intel")) return "";
    const cls = { ok: "ok", lag: "warn", off: "bad", err: "bad", conf: "bad" }[st] || "dim";
    let h = `<span class="${cls} mps" data-s="${st}">${esc(syncText(st))}</span>`;
    if (st === "err") h += ` <button type=button class=mpre onclick="mpReauth()" title="${esc(MP.error || "link closed")}">[RE-AUTH]</button>`;
    if (MP.on && MP.role !== "host" && !MP.hostOnline && st !== "err") h += ` <span class=warn>[HOST AWAY]</span>`;
    return h;
  }

  function markSync() {
    const who = document.getElementById("who");
    if (!who) return;
    const html = syncHtml();
    const old = who.querySelector(".mpsync");
    if (old && old.innerHTML === " " + html) { /* unchanged */ }
    else {
      if (old) old.remove();
      if (html) {
        const span = document.createElement("span");
        span.className = "mpsync";
        span.innerHTML = " " + html;
        who.appendChild(span);
      }
    }
    const st = syncState();
    const sy = document.getElementById("sync");
    if (sy && MP.on) { sy.dataset.s = st; sy.textContent = syncText(st); }
    if (st !== MP.lastSt) {
      if (MP.lastSt && st !== "lag" && MP.lastSt !== "lag" && typeof announce === "function") announce("Link " + syncText(st).replace(/[\\[\\]]/g, "").toLowerCase());
      MP.lastSt = st;
    }
  }''')
# sortie wrap: real link cell
rep('''      let h = prev();
      if (!MP.on) return h;''','''      let h = prev();
      if (!MP.on) return h;
      const st = syncState();
      h = h.replace('<b class=lnk id=sync data-s=local>[LOCAL]</b>', `<b class=lnk id=sync data-s="${st}">${esc(syncText(st))}</b>`);
''')

# ---- say wrapper: event tags; RADS lines are shared like other sheet actions ----
rep('''      const s = m == null ? "" : String(m);
      const synced = !!(live && s && !/^\\[FAIL\\]/.test(s) && /\\[ ROLL \\]|\\[ DMG \\]|roll-total|\\bd6\\b|penetrates|UNDO |REPAIR|HEAT |VENT |OVERRIDE|STABILITY|MOUNT |AMMO|RELOAD|PLATING|DAMAGE /.test(s));''','''      const s0 = m == null ? "" : String(m);
      const s = live && typeof evTag === "function" ? String(evTag(s0, k) ?? "") : s0;
      const synced = !!(live && s && !/^\\[FAIL\\]/.test(s0) && /\\[ ROLL \\]|\\[ DMG \\]|roll-total|\\bd6\\b|penetrates|UNDO |REPAIR|HEAT |VENT |OVERRIDE|STABILITY|MOUNT |AMMO|RELOAD|PLATING|DAMAGE |RADS /.test(s));''')

# ---- impacts carry ids; undo entries keep id/by ----
rep('''      MP.impacts.push({
        uid,
        loc,''','''      MP.impacts.push({
        id: rid(),
        kind: "hit",
        uid,
        loc,''')
rep('''        undo: undo && undo.l ? { l: String(undo.l).slice(0, 200), t: String(undo.t || "").slice(0, 40000), s: undo.s ? String(undo.s).slice(0, 20000) : null } : null,''','''        undo: undo && undo.l ? { l: String(undo.l).slice(0, 200), id: undo.id || null, by: undo.by || MP.selfId, t: String(undo.t || "").slice(0, 40000), s: undo.s ? String(undo.s).slice(0, 20000) : null } : null,''')

# ---- R3: undo as inverse impacts on sheets this seat does not own ----
rep('''    Forge.wrap("undoLast", (prev) => function () {
      const uid = curUid();
      if (MP.on && MP.ready && !MP.applying && uid) {
        MP.forceState.add(uid);
        MP.impacts = MP.impacts.filter((i) => i.uid !== uid);
      }
      return prev.apply(this, arguments);
    });''','''    Forge.wrap("undoLast", (prev) => function () {
      const uid = curUid();
      if (!(MP.on && MP.ready && !MP.applying && uid)) return prev.apply(this, arguments);
      const S = Forge.state();
      if (Array.isArray(S.undo)) {
        while (S.undo.length && S.undo[S.undo.length - 1] && S.undo[S.undo.length - 1].id && MP.popped.has(S.undo[S.undo.length - 1].id)) S.undo.pop();
      }
      const top = Array.isArray(S.undo) && S.undo.length ? S.undo[S.undo.length - 1] : null;
      const shadow = (MP.shadow || []).find((s) => s.uid === uid);
      const writable = MP.role === "host" || !!(shadow && shadow.ownerId === MP.selfId);
      if (top && !writable && top.by !== MP.selfId) {
        MP.applying = true;
        try { Forge.say("[FAIL] UNDO DENIED :: the last action on this unit was made by another seat // its owner or the host can undo it", "bad"); } finally { MP.applying = false; }
        Forge.render();
        return;
      }
      const t0 = Forge.tel();
      const before = t0 ? JSON.parse(JSON.stringify({ hp: t0.hp || [], sac: t0.sac || [], rest: Object.assign({}, t0, { hp: 0, sac: 0 }), stab: S.stab || null })) : null;
      const out = prev.apply(this, arguments);
      if (top && top.id) MP.popped.add(top.id);
      const t1 = Forge.tel();
      if (!before || !t1) return out;
      const pop = !!(MP.features && MP.features.has("pop"));
      const stab1 = S.stab || null;
      const stabChanged = stable(stab1) !== stable(before.stab);
      const otherTel = stable(Object.assign({}, t1, { hp: 0, sac: 0 })) !== stable(before.rest);
      if (writable && (!pop || otherTel)) {
        /* whole-telemetry write for heat/ammo/repair state; queued hits are kept (R3) and land first */
        MP.forceState.add(uid);
        if (!pop) return out;
      }
      /* additive inverse impacts: works on any sheet this seat may undo, never overwrites other hits */
      const L = Forge.locs();
      const imps = [];
      (t1.hp || []).forEach((v, loc) => {
        const d = v - (+before.hp[loc] || 0);
        const ds = (+((t1.sac || [])[loc]) || 0) - (+before.sac[loc] || 0);
        if (d || ds) imps.push({ id: rid(), kind: "undo", of: (top && top.id) || null, pop: 0, uid, loc, delta: d, floor: Forge.isLimb(L[loc] || "") ? -Forge.maxOf(loc) : 0, sacInc: Math.max(-5, Math.min(5, ds)), undo: null });
      });
      if (!imps.length && (pop || stabChanged)) imps.push({ id: rid(), kind: "undo", of: (top && top.id) || null, pop: 0, uid, loc: 0, delta: 0, floor: 0, sacInc: 0, undo: null });
      if (imps.length) {
        if (pop) imps[0].pop = 1;
        if (stabChanged) imps[0].stab = stab1;
        MP.impacts.push(...imps);
      }
      schedule();
      return out;
    });''')
# guards for new actions
rep('''      ["compile", "SAVE STATE"],
    ];''','''      ["compile", "SAVE STATE"],
      ["radAdj", "RADS"],
    ];''')
# ---- one copy of the live-table CSS (terminal.html #mpstyle) ----
rep('font:12px/1.35 Consolas,monospace;padding:8px}','font-family:inherit;font-size:var(--fs-l,12.5px);line-height:1.4;padding:8px}')

# ---- startLink: identity for undo ownership; restartable loop ----
rep('''    MP.callsign = String(session.callsign || "USER UNKNOWN");''','''    MP.callsign = String(session.callsign || "USER UNKNOWN");
    window.__forgeSelf = MP.selfId;''')
rep('''    if (!MP.timer) void loop();''','''    if (!MP.timer && !MP.looping) void loop();''')

# ---- connectQuiet: never seat "USER UNKNOWN"; only resume a remembered seat ----
rep('''  async function connectQuiet() {
    if (MP.linked || MP.busy) return;
    const remembered = savedCallsign();
    const name = remembered || "USER UNKNOWN";
    try {
      const saved = readSeat();
      let data = null;
      if (saved) {
        try {
          const body = { op: "resume", code: "TABLE", token: saved.token };
          if (remembered) body.callsign = remembered;
          data = await api(body);
          data.token = saved.token;
        } catch (err) {
          if (!err.rejected && !err.ended) throw err;
          data = null;
        }
      }
      if (!data) data = await api({ op: "enter", callsign: name });
      if (!data.token || !data.you) throw new Error("no seat");
      const kept = data.you.callsign || name;
      rememberSeat(data, kept.toUpperCase() === "USER UNKNOWN" ? "" : kept);''','''  async function connectQuiet() {
    if (MP.linked || MP.busy) return;
    /* No silent seats: only a pilot who already holds a seat token and a callsign is reconnected.
       Everyone else stays local until they choose LIVE DATA INTERCEPT and enter a callsign (mpAuth). */
    const remembered = savedCallsign();
    const saved = readSeat();
    if (!saved || !remembered) return;
    const name = remembered;
    try {
      let data = null;
      try {
        data = await api({ op: "resume", code: "TABLE", token: saved.token, callsign: remembered });
        data.token = saved.token;
      } catch (err) {
        if (!err.rejected && !err.ended) throw err;
        try { localStorage.removeItem("forge_mp_token_TABLE"); } catch (e) { /* private mode */ }
        return;
      }
      if (!data.token || !data.you) throw new Error("no seat");
      const kept = data.you.callsign || name;
      rememberSeat(data, kept);''')
rep('''    } catch (e) {
      setTimeout(connectQuiet, 2000);
    }
  }''','''    } catch (e) {
      MP.quietFails = (MP.quietFails || 0) + 1;
      setTimeout(connectQuiet, Math.min(30000, 2000 * Math.pow(2, MP.quietFails - 1)));
    }
  }''')

# ---- server features: the 5.1 server advertises ["pop","ev"]; old servers send none ----
rep("""    const data = await res.json().catch(() => ({ error: "bad response" }));""","""    const data = await res.json().catch(() => ({ error: "bad response" }));
    if (data && Array.isArray(data.features)) MP.features = new Set(data.features);
    else if (data && data.ok && !Array.isArray(data.features)) MP.features = new Set();""")
rep("""        if (/DAMAGE|penetrates/i.test(plain) && typeof announceHit === "function") announceHit(String(r.actor || "Another seat"));""","""        if (/DAMAGE|penetrates/i.test(plain) && typeof announceHit === "function") announceHit(String(r.actor || "Another seat"));
        const uo = /data-undo-of="([\\w-]{1,40})"/.exec(body);
        if (uo && typeof markUndone === "function") setTimeout(() => markUndone(uo[1]), 60);""")
open(DST,'w',encoding='utf-8').write(t)
print('ok',len(t))
