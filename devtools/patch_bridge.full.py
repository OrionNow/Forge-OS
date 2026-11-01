# Builds out/mp-bridge.js from the original. Never edits the original.
import sys
SRC='/workspace/forge-os/mp-bridge.js'; DST='/workspace/forge-os/out/mp-bridge.js'
t=open(SRC,encoding='utf-8').read()
def rep(old,new,count=1):
    global t
    n=t.count(old)
    if n!=count: sys.exit(f'PATCH FAIL ({n} matches, want {count}): {old[:100]!r}')
    t=t.replace(old,new)

rep('/* Sortie link. Shares the terminal\'s script scope through window.Forge. */',
    '/* Sortie link. Shares the terminal\'s script scope through window.Forge.\n   v15 (FORGE-OS 5.1): sanitised remote lines (R7), 3-way merge on 409 (R1/R2), inverse-impact undo (R3),\n   no silent queue drops (R4), frozen revision in the frame editor (R5), reconnect/backoff/hidden-tab polling (R6),\n   real link states, focus presence, turn tracker + rads sync. See SERVER-CONTRACT.md. */')
rep('''    clearUntil: 0,
  };''','''    clearUntil: 0,
    rtt: null,
    fails: 0,
    looping: false,
    stuck: false,
    conflicts: [],
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
      speakRemote(who + body, safeTone(r.tone));
      try {
        const plain = body.replace(/<[^>]*>/g, "");
        const tm = /\\[ TURN \\] (?:SORTIE (\\d+) \\/\\/ )?ROUND (\\d+) \\/\\/ (.+?) ACTIVE/.exec(plain);
        if (tm && typeof forgeTurnRemote === "function") forgeTurnRemote(tm[1] ? +tm[1] : 0, +tm[2], tm[3]);
        if (/DAMAGE|penetrates/i.test(plain) && typeof announceHit === "function") announceHit(String(r.actor || "Another seat"));
      } catch (e) { /* announcements are best effort */ }''')

# ---- R1/R2: 3-way merge after a 409 ----
rep('''  function rebase(payload) {''','''  function merge3(base, mine, theirs, path, out, numeric, uid) {
    const sb = stable(base), sm = stable(mine), st = stable(theirs);
    if (sm === sb || sm === st) return theirs;
    if (st === sb) return mine;
    const obj = (v) => v && typeof v === "object";
    if (obj(mine) && obj(theirs) && Array.isArray(mine) === Array.isArray(theirs)) {
      const res = Array.isArray(mine) ? [] : {};
      const keys = new Set([...Object.keys(mine), ...Object.keys(theirs)]);
      for (const k of keys) res[k] = merge3(base == null ? undefined : base[k], mine[k], theirs[k], path + "." + k, out, numeric, uid);
      return res;
    }
    if (numeric && typeof base === "number" && typeof mine === "number" && typeof theirs === "number") return theirs + (mine - base);
    out.push({ uid, path: path.replace(/^\\./, ""), base, mine, theirs });
    return theirs;
  }

  function mergeStack(b, m, t) {
    const sb = stable(b), sm = stable(m);
    if (sm === sb) return t;
    if (stable(t) === sb) return m;
    const key = (e) => (e && (e.id || e.l + "|" + String(e.t || "").length)) || "";
    const have = new Set((t || []).map(key));
    return (t || []).concat((m || []).filter((e) => !have.has(key(e)))).slice(-40);
  }

  function getPath(o, parts) { for (const p of parts) { if (o == null) return undefined; o = o[p]; } return o; }
  function setPath(o, parts, v) { for (let i = 0; i < parts.length - 1; i++) { if (o[parts[i]] == null || typeof o[parts[i]] !== "object") o[parts[i]] = {}; o = o[parts[i]]; } o[parts[parts.length - 1]] = v; }

  function unitName(uid) {
    const S = Forge.state();
    const i = (S.sheets || []).findIndex((s) => s.uid === uid);
    return i >= 0 ? sheetTitle(S.sheets[i], i) : "UNIT";
  }

  function applyChoice(c, which) {
    const S = Forge.state();
    const i = (S.sheets || []).findIndex((s) => s.uid === c.uid);
    if (i < 0 || !S.sheets[i].d) return;
    const parts = c.path.split(".").filter(Boolean);
    setPath(S.sheets[i].d, parts, JSON.parse(JSON.stringify(which === "mine" ? c.mine : c.theirs ?? null)));
    if (i === S.cur) { const dmg = S.dmg; Forge.apply(S.sheets[i].d); if (dmg) S.dmg = dmg; ensureForm(); }
  }

  function fmtV(v) { const s = v === undefined ? "--" : JSON.stringify(v); return s.length > 28 ? s.slice(0, 27) + "~" : s; }

  function mergeAfterConflict(baseShadow, mineSheets) {
    const S = Forge.state();
    const byBase = new Map(baseShadow.map((s) => [s.uid, s]));
    const byMine = new Map(mineSheets.map((s) => [s.uid, s]));
    const found = [];
    for (const sh of S.sheets || []) {
      const b = byBase.get(sh.uid), m = byMine.get(sh.uid);
      if (!b || !m || !m.d || !sh.d) continue;
      if (!(MP.role === "host" || b.ownerId === MP.selfId)) continue;
      const B = split(b.d), M = split(m.d), T = split(sh.d);
      const rest = merge3(B.rest, M.rest, T.rest, "", found, false, sh.uid);
      const telv = merge3(B.tel, M.tel, T.tel, "tel", found, true, sh.uid);
      const d = Object.assign({}, rest, { tel: telv, undo: mergeStack(B.undo, M.undo, T.undo), stab: stable(M.stab) === stable(B.stab) ? T.stab : M.stab });
      for (const k of ["dmg", "uiHP", "info"]) if (sh.d[k] !== undefined) d[k] = sh.d[k];
      sh.d = d;
    }
    const cur = S.sheets && S.sheets[S.cur];
    if (cur && cur.d) { const dmg = S.dmg; Forge.apply(JSON.parse(JSON.stringify(cur.d))); if (dmg) S.dmg = dmg; ensureForm(); }
    for (const c of found) {
      const label = unitName(c.uid) + " " + c.path;
      if (MP.role === "host") {
        applyChoice(c, "mine");
        noteLocal("[ -- ] CONFLICT " + label + " :: HOST=" + fmtV(c.mine) + " vs SEAT=" + fmtV(c.theirs) + " => HOST VALUE KEPT");
      } else if (!MP.hostOnline) {
        applyChoice(c, "mine");
        noteLocal("[ -- ] CONFLICT " + label + " :: YOU=" + fmtV(c.mine) + " vs TABLE=" + fmtV(c.theirs) + " => LAST WRITE (HOST OFFLINE)");
      } else {
        MP.conflicts = (MP.conflicts || []).filter((x) => !(x.uid === c.uid && x.path === c.path)).concat([c]).slice(-12);
        noteLocal("[ -- ] CONFLICT " + label + " :: TABLE=" + fmtV(c.theirs) + " vs YOU=" + fmtV(c.mine) + " // HOST HOLDS PRIORITY, choose on the conflict card");
      }
    }
    if (found.length) { MP.applying = true; try { Forge.render(); } finally { MP.applying = false; } }
  }

  function noteLocal(m) { MP.applying = true; try { Forge.say(m, "warn"); } finally { MP.applying = false; } }

  window.mpConf = function (i, which) {
    const c = (MP.conflicts || [])[i];
    if (!c) return;
    MP.conflicts.splice(i, 1);
    if (which === "mine") applyChoice(c, "mine");
    Forge.say("[ -- ] CONFLICT RESOLVED :: " + unitName(c.uid) + " " + c.path + " => " + (which === "mine" ? "YOUR VALUE (re-sent)" : "TABLE VALUE"), which === "mine" ? "warn" : "ok");
    Forge.render();
  };

  function conflictCard() {
    const list = MP.conflicts || [];
    if (!list.length) return "";
    return `<div class=mpconf role=alert><b class=bad>[CONFLICT \\u00d7${list.length}]</b>` + list.map((c, i) => `<span>${esc(unitName(c.uid))} <span class=dim>${esc(c.path)}</span> TABLE=<b>${esc(fmtV(c.theirs))}</b> YOU=<b>${esc(fmtV(c.mine))}</b> <button type=button onclick="mpConf(${i},'theirs')">[ACCEPT TABLE]</button><button type=button onclick="mpConf(${i},'mine')">[KEEP MINE]</button></span>`).join("") + `</div>`;
  }

  function rebase(payload) {''')
# rebase no longer re-applies whole rest blobs (that was the host-vs-owner overwrite, R2)
rep('''    for (const r of payload.rests || []) {
      const sh = (S.sheets || []).find((s) => s.uid === r.uid);
      if (!sh) continue;
      sh.d = Object.assign({}, sh.d || {}, r.rest);
    }
  }''','''    /* rests are merged field by field in mergeAfterConflict() */
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
        const baseShadow = JSON.parse(JSON.stringify(MP.shadow || []));
        let mineSheets = [];
        try { mineSheets = JSON.parse(JSON.stringify(localSheets())); } catch (e) { mineSheets = []; }
        applyRemote(err.conflict);
        rebase(payload);
        try { mergeAfterConflict(baseShadow, mineSheets); } catch (e) { console.error("[forge] merge", e); }
        MP.conflictTries = (MP.conflictTries || 0) + 1;
        if (MP.conflictTries > 4) {
          /* R4: never drop queued hits or lines; keep them and retry on the next tick */
          MP.stuck = true;
          MP.conflictTries = 0;
          return false;
        }
        return true;
      }''')

# ---- R5: freeze the revision while the frame editor bench is open ----
rep('''      if (typeof res.revision === "number" && !MP.on) MP.rev = res.revision;''','''      if (typeof res.revision === "number" && !MP.on && !MP.editing) MP.rev = res.revision;''')
# focus presence in poll
rep('''      seatColor: sentColor || undefined,
    });''','''      seatColor: sentColor || undefined,
      focus: focusSignal(),
    });''')
rep('''  function isTyping() {''','''  function focusSignal() {
    if (!MP.on || !isTyping()) return null;
    const el = document.activeElement;
    const f = String((el.dataset && el.dataset.f) || el.getAttribute("aria-label") || el.id || el.name || el.tagName).slice(0, 24);
    return { uid: curUid(), field: f };
  }

  function isTyping() {''')

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
    MP.conflicts = [];
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
    if ((MP.conflicts || []).length || MP.stuck) return "conf";
    if (MP.rtt != null && MP.rtt > 600) return "lag";
    return "ok";
  }

  function syncText(st) {
    const q = (MP.impacts || []).length + (MP.logs || []).length;
    if (st === "ok") return "[LINK OK]";
    if (st === "lag") return "[LINK LAG " + Math.round((MP.rtt || 0) / 100) * 100 + "ms]";
    if (st === "off") return "[OFFLINE \\u00b7 " + q + " QUEUED]";
    if (st === "err") return "[LINK ERR // RE-AUTH]";
    if (st === "conf") return "[CONFLICT \\u00d7" + ((MP.conflicts || []).length || 1) + (q ? " \\u00b7 " + q + " QUEUED" : "") + "]";
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
# sortie wrap: real link cell + conflict card
rep('''      let h = prev();
      if (!MP.on) return h;''','''      let h = prev();
      if (!MP.on) return h;
      const st = syncState();
      h = h.replace('<b class=lnk id=sync data-s=local>[LOCAL]</b>', `<b class=lnk id=sync data-s="${st}">${esc(syncText(st))}</b>`);
      h = conflictCard() + h;''')

# ---- say wrapper: event tags + sync of turn/rads lines ----
rep('''      const s = m == null ? "" : String(m);
      const synced = !!(live && s && !/^\\[FAIL\\]/.test(s) && /\\[ ROLL \\]|\\[ DMG \\]|roll-total|\\bd6\\b|penetrates|UNDO |REPAIR|HEAT |VENT |OVERRIDE|STABILITY|MOUNT |AMMO|RELOAD|PLATING|DAMAGE /.test(s));''','''      const s0 = m == null ? "" : String(m);
      const s = live && typeof evTag === "function" ? String(evTag(s0, k) ?? "") : s0;
      const synced = !!(live && s && !/^\\[FAIL\\]/.test(s0) && /\\[ ROLL \\]|\\[ DMG \\]|\\[ TURN \\]|roll-total|\\bd6\\b|penetrates|UNDO |REPAIR|HEAT |VENT |OVERRIDE|STABILITY|MOUNT |AMMO|RELOAD|PLATING|DAMAGE |RADS |OLEUM PURGE|CONFLICT RESOLVED/.test(s));''')

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
      if (top && top.by && top.by !== MP.selfId && MP.role !== "host") {
        MP.applying = true;
        try { Forge.say("[FAIL] UNDO DENIED :: THE LAST ACTION ON THIS UNIT BELONGS TO ANOTHER SEAT // ASK THE HOST", "bad"); } finally { MP.applying = false; }
        Forge.render();
        return;
      }
      const shadow = (MP.shadow || []).find((s) => s.uid === uid);
      const writable = MP.role === "host" || !!(shadow && shadow.ownerId === MP.selfId);
      const before = Forge.tel();
      const hp0 = before && Array.isArray(before.hp) ? before.hp.slice() : null;
      const out = prev.apply(this, arguments);
      if (top && top.id) MP.popped.add(top.id);
      if (writable) {
        MP.forceState.add(uid);
        MP.impacts = MP.impacts.filter((i) => i.uid !== uid);
        return out;
      }
      const after = Forge.tel();
      if (!after || !hp0) return out;
      const L = Forge.locs();
      (after.hp || []).forEach((v, loc) => {
        const d = v - hp0[loc];
        if (d) MP.impacts.push({ id: rid(), kind: "undo", of: (top && top.id) || null, pop: 1, uid, loc, delta: d, floor: Forge.isLimb(L[loc] || "") ? -Forge.maxOf(loc) : 0, sacInc: 0, undo: null, stab: null });
      });
      schedule();
      return out;
    });''')
# guards for new actions
rep('''      ["compile", "SAVE STATE"],
    ];''','''      ["compile", "SAVE STATE"],
      ["radAdj", "RADS"],
      ["radSortie", "RADS"],
      ["radZone", "RADS"],
      ["radPurge", "PURGE VALVE"],
    ];''')
rep('''    for (const name of ["shDup", "shClose", "shCommit", "shDrop"]) {''','''    for (const name of ["turnStep", "turnNewSortie"]) Forge.wrap(name, (prev) => guard(prev, "TURN TRACKER", true));
    window.forgeCanTurn = () => !(MP.on && MP.ready && MP.role !== "host");

    for (const name of ["shDup", "shClose", "shCommit", "shDrop"]) {''')

# ---- presence + turn marker in tabs ----
rep('''      return `<span class="stab${on ? " on" : ""}" data-uid="${esc(sh.uid)}"${style}''','''      const editor = (members || []).find((m) => m.id !== MP.selfId && m.online && m.focus && m.focus.uid === sh.uid);
      const edAttr = editor ? ` data-ed="${esc(shownName(editor))}"` : "";
      const turnCls = typeof forgeTurnActive === "function" && forgeTurnActive(i) ? " turn" : "";
      return `<span class="stab${on ? " on" : ""}${turnCls}" data-uid="${esc(sh.uid)}"${edAttr}${style}''')
rep('''    return `<div class="mprow${host}${dark}"><b class="${tintClass}"${nameStyle}${click}>${esc(name)}</b>${you}${place}</div>`;''','''    const ed = !away && m.focus && m.id !== MP.selfId ? `<div class=ed>[ED ${esc(String(m.focus.field || "").slice(0, 24))}]</div>` : "";
    return `<div class="mprow${host}${dark}"><b class="${tintClass}"${nameStyle}${click}>${esc(name)}</b>${you}${place}${ed}</div>`;''')

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

# ---- server features (5.1 server copy advertises them; old servers do not) ----
rep("""    const data = await res.json().catch(() => ({ error: "bad response" }));""","""    const data = await res.json().catch(() => ({ error: "bad response" }));
    if (data && Array.isArray(data.features)) MP.features = new Set(data.features);
    else if (data && data.ok && !Array.isArray(data.features)) MP.features = new Set();""")
rep("""      if (writable && stable(a.rest) !== stable(b.rest)) rests.push({ uid: sh.uid, rest: a.rest });""","""      if (writable && stable(a.rest) !== stable(b.rest)) {
        const diffs = MP.features && MP.features.has("patches") ? diffRest(b.rest, a.rest, sh.uid) : null;
        if (diffs && patches.length + diffs.length <= 48) patches.push(...diffs);
        else rests.push({ uid: sh.uid, rest: a.rest });
      }""")
rep("""    const rests = [];
    const states = [];""","""    const rests = [];
    const patches = [];
    const states = [];""")
rep("""    if (!impacts.length && !logs.length && !rests.length && !states.length""","""    if (!impacts.length && !logs.length && !rests.length && !patches.length && !states.length""")
rep("""      drops,
      clear: clearing,
    };
  }""","""      drops,
      clear: clearing,
      ...(patches.length ? { patches } : {}),
    };
  }

  /* Leaf-level diff of a sheet's rest blob, for servers that accept per-field patches.
     Arrays are atomic. Returns null when a key cannot be expressed as a patch path. */
  function diffRest(base, mine, uid) {
    const out = [];
    const KEY = /^[A-Za-z0-9_]{1,40}$/;
    const plain = (v) => v && typeof v === "object" && !Array.isArray(v);
    const walk = (b, m, path, depth) => {
      const keys = new Set([...Object.keys(b || {}), ...Object.keys(m || {})]);
      for (const k of keys) {
        if (!KEY.test(k)) return false;
        const bv = b ? b[k] : undefined, mv = m ? m[k] : undefined;
        if (stable(bv) === stable(mv)) continue;
        const p = path ? path + "." + k : k;
        if (plain(bv) && plain(mv) && depth < 5) { if (walk(bv, mv, p, depth + 1) === false) return false; continue; }
        out.push({ uid, path: p, base: bv, value: mv });
      }
      return true;
    };
    return walk(base || {}, mine || {}, "", 0) === false ? null : out;
  }

  function takeServerConflicts(res) {
    const list = (res && Array.isArray(res.conflicts)) ? res.conflicts : [];
    for (const c of list) {
      if (!c || c.by !== MP.selfId || c.resolved) continue;
      const item = { uid: c.uid, path: c.path, base: c.base, mine: c.mine, theirs: c.theirs };
      MP.conflicts = (MP.conflicts || []).filter((x) => !(x.uid === item.uid && x.path === item.path)).concat([item]).slice(-12);
      try { applyChoice(item, "theirs"); } catch (e) { /* sheet gone */ }
    }
    if (list.length) { MP.applying = true; try { Forge.render(); } finally { MP.applying = false; } }
  }""")
rep("""      MP.conflictTries = 0;
      MP.stuck = false;
      applyRemote(res);
      return true;""","""      MP.conflictTries = 0;
      MP.stuck = false;
      applyRemote(res);
      takeServerConflicts(res);
      return true;""")
rep("""        if (/DAMAGE|penetrates/i.test(plain) && typeof announceHit === "function") announceHit(String(r.actor || "Another seat"));""","""        if (/DAMAGE|penetrates/i.test(plain) && typeof announceHit === "function") announceHit(String(r.actor || "Another seat"));
        const uo = /data-undo-of="([\\w-]{1,40})"/.exec(body);
        if (uo && typeof markUndone === "function") setTimeout(() => markUndone(uo[1]), 60);""")
open(DST,'w',encoding='utf-8').write(t)
print('ok',len(t))
