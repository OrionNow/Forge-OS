/* Sortie link. Shares the terminal's script scope through window.Forge. */
(function () {
  if (!window.Forge || window.__forgeMP) {
    if (!window.Forge) {
      document.documentElement.classList.remove("mp-wait");
      if (document.body) document.body.style.visibility = "";
    }
    return;
  }
  window.__forgeMP = true;

  const Forge = window.Forge;
  const MP = {
    on: false,
    ready: false,
    applying: false,
    status: "offline",
    role: "player",
    code: "",
    token: "",
    selfId: "",
    callsign: "",
    rev: -1,
    rollSeq: 0,
    shadow: [],
    sheetFp: "",
    memFp: "",
    members: [],
    roster: [],
    hostOnline: true,
    impacts: [],
    logs: [],
    forceState: new Set(),
    nonces: new Set(),
    drops: [],
    dropped: new Set(),
    seatColor: null,
    editing: false,
    error: "",
    saidHello: false,
    heard: false,
    linked: false,
    seatsOpen: true,
    tints: {},
    clearPending: false,
    clearSeq: 0,
    clearReady: false,
    clearUntil: 0,
  };

  function esc(t) {
    return Forge.esc(t == null ? "" : String(t));
  }

  function rid() {
    const b = new Uint8Array(8);
    crypto.getRandomValues(b);
    return Array.from(b, (n) => n.toString(16).padStart(2, "0")).join("");
  }

  function stable(v) {
    return JSON.stringify(sortify(v));
  }

  function sortify(v) {
    if (Array.isArray(v)) return v.map(sortify);
    if (v && typeof v === "object") {
      const o = {};
      for (const k of Object.keys(v).sort()) o[k] = sortify(v[k]);
      return o;
    }
    return v;
  }

  function split(d) {
    const src = d || {};
    const rest = {};
    for (const k of Object.keys(src)) {
      if (k === "tel" || k === "undo" || k === "stab" || k === "dmg" || k === "uiHP" || k === "info") continue;
      rest[k] = src[k];
    }
    return {
      tel: src.tel ?? null,
      undo: Array.isArray(src.undo) ? src.undo : [],
      stab: src.stab ?? null,
      rest,
    };
  }

  function pack(sh) {
    return {
      uid: sh.uid,
      name: sh.name || "",
      col: sh.col || 0,
      hidden: !!sh.hidden,
      closed: !!sh.closed,
      ownerId: sh.ownerId || null,
      d: sh.d || null,
    };
  }

  function metaOf(sh) {
    return { uid: sh.uid, name: sh.name || "", col: sh.col || 0, hidden: !!sh.hidden, closed: !!sh.closed, ownerId: sh.ownerId || null };
  }

  function curUid() {
    const S = Forge.state();
    const sh = S.sheets && S.sheets[S.cur];
    return sh && sh.uid ? sh.uid : null;
  }

  function ensureUids() {
    const S = Forge.state();
    if (!S.sheets) return;
    const seen = new Set();
    for (const sh of S.sheets) {
      const fresh = !sh.uid || seen.has(sh.uid);
      if (fresh) sh.uid = rid();
      seen.add(sh.uid);
      if (sh.hidden == null) sh.hidden = false;
      if (sh.ownerId === undefined) sh.ownerId = null;
      if (sh.closed == null) sh.closed = !!(fresh && MP.on && MP.role === "host");
    }
  }

  function ensureForm() {
    const S = Forge.state();
    if (!S.dmg || typeof S.dmg !== "object") {
      S.dmg = { d: "", dv: "1", loc: 0, rear: false, chink: false, calc: null };
    }
  }

  function locked() {
    if (!MP.on || !MP.ready || MP.role === "host") return false;
    const S = Forge.state();
    const sh = S.sheets && S.sheets[S.cur];
    if (!sh) return true;
    return sh.ownerId !== MP.selfId;
  }

  function report() {
    if (window.parent === window) return;
    window.parent.postMessage(
      {
        source: "forge-mp",
        status: MP.status,
        members: MP.members,
        roster: MP.roster,
        role: MP.role,
        code: MP.code,
        revision: MP.rev,
        hostOnline: MP.hostOnline,
        error: MP.error || "",
        selfId: MP.selfId,
      },
      window.location.origin,
    );
  }

  function deny(label) {
    MP.applying = true;
    try {
      Forge.say("[FAIL] " + label + " :: ASSIGNED PILOT OR HOST ONLY. DAMAGE AND UNDO STAY OPEN.", "bad");
    } finally {
      MP.applying = false;
    }
    Forge.render();
  }

  function guard(prev, label, hostOnly) {
    return function () {
      if (MP.on && MP.ready && (hostOnly ? MP.role !== "host" : locked())) {
        deny(label);
        return;
      }
      return prev.apply(this, arguments);
    };
  }

  let pushing = false;
  let queued = false;

  function schedule() {
    if (!MP.on || !MP.ready || MP.applying) return;
    clearTimeout(MP.kick);
    MP.kick = setTimeout(() => void flush(), 220);
  }

  async function api(body) {
    const prefix = (location.pathname.match(/^\/hds-[a-z0-9]+-\d+-[a-z0-9]+/i) || [""])[0];
    const res = await fetch(prefix + "/api/forge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({ error: "bad response" }));
    if (res.status === 409 && data && data.snapshot) {
      const err = new Error("conflict");
      err.conflict = data;
      throw err;
    }
    if (!res.ok) {
      const err = new Error(data.error || "link " + res.status);
      err.ended = res.status === 404;
      err.rejected = res.status === 403;
      throw err;
    }
    return data;
  }

  function localSheets() {
    ensureUids();
    Forge.save();
    const S = Forge.state();
    return (S.sheets || []).map(pack);
  }

  function restoreUnowned() {
    if (MP.role === "host") return;
    const S = Forge.state();
    const gone = (uid) => !!(uid && ((MP.dropped && MP.dropped.has(uid)) || (MP.drops || []).includes(uid)));
    const shadow = new Map((MP.shadow || []).map((s) => [s.uid, s]));
    const cur = curUid();
    let patched = false;
    for (const sh of S.sheets || []) {
      const prev = shadow.get(sh.uid);
      if (!prev || prev.ownerId === MP.selfId || gone(sh.uid)) continue;
      const mine = split(sh.d);
      const old = split(prev.d);
      if (stable(mine.rest) === stable(old.rest) && stable(metaOf(sh)) === stable(metaOf(prev))) continue;
      const dmg = sh.d && sh.d.dmg;
      const tel = sh.d && sh.d.tel;
      const undo = sh.d && sh.d.undo;
      const stab = sh.d && sh.d.stab;
      sh.name = prev.name;
      sh.col = prev.col;
      sh.hidden = prev.hidden;
      sh.closed = !!prev.closed;
      sh.ownerId = prev.ownerId;
      sh.d = prev.d ? JSON.parse(JSON.stringify(prev.d)) : null;
      if (sh.d && MP.impacts.some((im) => im.uid === sh.uid)) {
        sh.d.tel = tel;
        sh.d.undo = undo;
        sh.d.stab = stab;
      }
      if (sh.d && dmg) sh.d.dmg = dmg;
      patched = patched || sh.uid === cur;
    }
    if ((S.sheets || []).some((s) => gone(s.uid))) {
      S.sheets = (S.sheets || []).filter((s) => !gone(s.uid));
      if (cur && !(S.sheets || []).some((s) => s.uid === cur)) {
        S.cur = (S.sheets || []).length ? 0 : null;
        if (!(S.sheets || []).length) S.view = "sortie";
        patched = true;
      }
    }
    const localLeft = (S.sheets || []).filter((s) => !gone(s.uid));
    const shadowLeft = (MP.shadow || []).filter((s) => !gone(s.uid));
    if (localLeft.length !== shadowLeft.length) {
      const own = new Map(localLeft.filter((s) => s.ownerId === MP.selfId).map((s) => [s.uid, s]));
      const shadowOwns = shadowLeft.some((s) => s.ownerId === MP.selfId);
      const pending = shadowOwns
        ? []
        : localLeft.filter((s) => s.ownerId === MP.selfId && !shadow.has(s.uid) && !gone(s.uid)).slice(0, 1);
      S.sheets = shadowLeft.map((s) => own.get(s.uid) || JSON.parse(JSON.stringify(s))).concat(pending);
      const i = S.sheets.findIndex((s) => s.uid === cur);
      S.cur = i >= 0 ? i : S.sheets.length ? 0 : null;
      patched = true;
    }
    if (patched && S.cur != null && S.sheets[S.cur]) {
      const dmg = S.dmg;
      Forge.apply(S.sheets[S.cur].d || {});
      if (dmg) S.dmg = dmg;
      ensureForm();
    }
  }

  function buildPush() {
    if (!MP.ready || MP.rev < 0) return null;
    restoreUnowned();
    const local = localSheets();
    const shadow = MP.shadow || [];
    const byS = new Map(shadow.map((s) => [s.uid, s]));
    const impacts = MP.impacts.slice(0, 12);
    const logs = MP.logs.slice(0, 8);
    const impacted = new Set(impacts.map((i) => i.uid));
    const rests = [];
    const states = [];
    const upserts = [];
    const host = MP.role === "host";

    for (const sh of local) {
      const prev = byS.get(sh.uid);
      if (!prev) {
        if (host) upserts.push(sh);
        else if (sh.ownerId === MP.selfId && !sh.hidden && !MP.dropped.has(sh.uid) && !upserts.length && !shadow.some((s) => s.ownerId === MP.selfId)) upserts.push(sh);
        continue;
      }
      const writable = host || prev.ownerId === MP.selfId;
      const forced = !!(MP.forceState && MP.forceState.has(sh.uid));
      if ((!writable && !forced) || !sh.d) continue;
      const a = split(sh.d);
      const b = split(prev.d);
      if (writable && stable(a.rest) !== stable(b.rest)) rests.push({ uid: sh.uid, rest: a.rest });
      const telDiff = stable(a.tel) !== stable(b.tel) || stable(a.undo) !== stable(b.undo) || stable(a.stab) !== stable(b.stab);
      if (forced && !telDiff) MP.forceState.delete(sh.uid);
      if ((writable || forced) && !impacted.has(sh.uid) && telDiff) {
        states.push({ uid: sh.uid, tel: a.tel, undo: a.undo, stab: a.stab });
      }
    }

    let meta = null;
    if (host && (stable(local.map(metaOf)) !== stable(shadow.map(metaOf)) || upserts.length)) meta = local.map(metaOf);
    const paints = [];
    for (const sh of local) {
      const prev = byS.get(sh.uid);
      if (!prev) continue;
      if ((host || prev.ownerId === MP.selfId) && (sh.col || 0) !== (prev.col || 0)) {
        paints.push({ uid: sh.uid, col: sh.col || 0 });
      }
    }
    let order = null;
    if (!host) {
      const localOrder = local.map((s) => s.uid);
      const shadowOrder = shadow.map((s) => s.uid);
      const sameSet = localOrder.length === shadowOrder.length && localOrder.slice().sort().join("|") === shadowOrder.slice().sort().join("|");
      if (sameSet && localOrder.join("|") !== shadowOrder.join("|")) order = localOrder;
    }
    const drops = (MP.drops || []).slice(0, 8);
    const clearing = !!MP.clearPending;
    if (!impacts.length && !logs.length && !rests.length && !states.length && !meta && !upserts.length && !paints.length && !order && !drops.length && !clearing) return null;
    return {
      op: "push",
      code: MP.code,
      token: MP.token,
      baseRevision: MP.rev,
      rollSeq: MP.rollSeq,
      impacts,
      logs,
      rests,
      states,
      meta,
      paints,
      order,
      upserts,
      drops,
      clear: clearing,
    };
  }

  function speakRemote(html, tone, silent) {
    const run = async () => {
      try {
        const log = document.getElementById("log");
        if (!log) return;
        if (silent) {
          const d = document.createElement("div");
          d.innerHTML = `<span class="${tone || "dim"}">${html || ""}</span>`;
          log.appendChild(d);
          while (log.children.length > 160) log.removeChild(log.firstChild);
          log.scrollTop = log.scrollHeight;
          return;
        }
        if (typeof audioEvent === "function" && /\[ ROLL \]|roll-total|\bd6\b/.test(String(html))) audioEvent("dice");
        const wrapped = `<span class="${tone || "dim"}">${html || ""}</span>`;
        if (typeof type === "function") await type(log, wrapped);
        else {
          const d = document.createElement("div");
          d.className = tone || "dim";
          d.innerHTML = html || "";
          log.appendChild(d);
          while (log.children.length > 160) log.removeChild(log.firstChild);
          log.scrollTop = log.scrollHeight;
        }
      } catch (e) { /* keep the console up */ }
    };
    try {
      if (typeof chain !== "undefined" && chain && typeof chain.then === "function") {
        chain = chain.then(run, run);
        return;
      }
    } catch (e) { /* console chain not in scope */ }
    void run();
  }

  function drainRolls(rolls) {
    if (!rolls) return;
    const catchup = !MP.heard;
    for (const r of rolls) {
      if (!r || !(r.seq > MP.rollSeq)) continue;
      MP.rollSeq = r.seq;
      if (catchup) continue;
      if (r.nonce && MP.nonces.has(r.nonce)) continue;
      const who = `<span style="color:${actorColor(r.actor, r.color)}">${esc(r.actor)}</span> <span class=dim>//</span> <span style="color:${unitColor(r.uid)}">${esc(r.unit)}</span> `;
      speakRemote(who + (r.html || ""), r.tone || "dim");
    }
    if (catchup) MP.heard = true;
  }

  function applyRemote(view) {
    if (!view || !view.snapshot) return;
    try { Forge.save(); } catch (e) { /* sheet not ready */ }
    const S = Forge.state();
    const incoming = (view.snapshot.sheets || []).map(pack).filter((s) => !(MP.dropped && MP.dropped.has(s.uid)));
    const fp = stable(incoming.map((s) => ({ ...s, d: split(s.d) })));
    const preserve = new Set((MP.impacts || []).map((i) => i.uid));
    if (MP.forceState) for (const id of MP.forceState) preserve.add(id);
    const localBy = new Map((Forge.state().sheets || []).filter((s) => s && s.uid).map((s) => [s.uid, s]));
    const merged = incoming.map((s) => {
      if (!preserve.has(s.uid)) return s;
      const loc = localBy.get(s.uid);
      if (!loc || !loc.d || !s.d) return s;
      const d = JSON.parse(JSON.stringify(s.d));
      d.tel = loc.d.tel;
      d.undo = loc.d.undo;
      d.stab = loc.d.stab;
      return Object.assign({}, s, { d });
    });
    MP.rev = Number(view.revision);
    const incomingIds = new Set(incoming.map((s) => s.uid));
    for (const prev of MP.shadow || []) {
      if (prev && prev.ownerId === MP.selfId && !incomingIds.has(prev.uid)) MP.dropped.add(prev.uid);
    }
    MP.shadow = JSON.parse(JSON.stringify(incoming));
    MP.members = view.members || MP.members;
    absorbMembers(MP.members);
    noteClear(view);
    MP.roster = view.roster || [];
    MP.hostOnline = !!view.hostOnline;
    const memFp = stable(MP.members);
    const sameSheets = fp === MP.sheetFp;
    const sameMem = memFp === MP.memFp;
    MP.memFp = memFp;
    drainRolls(view.rolls || []);
    paintFriends();
    if (sameSheets && (sameMem || isTyping())) return;
    MP.sheetFp = fp;
    MP.applying = true;
    try {
      const prevUid = S.sheets && S.sheets[S.cur] ? S.sheets[S.cur].uid : null;
      const keepDmg = S.dmg ? JSON.parse(JSON.stringify(S.dmg)) : null;
      const keepInfo = S.info;
      const typing = isTyping();
      const localPilot = typing ? (Forge.snap().pilot || null) : null;
      S.sheets = JSON.parse(JSON.stringify(merged));
      S.role = "IMPERIAL INTELLIGENCE";
      if (!S.sheets.length) {
        S.cur = null;
        S.view = "sortie";
        Forge.apply({
          ch: null, items: [], tel: null, id: "", cs: "",
          dmg: keepDmg || { d: "", dv: "1", loc: 0, rear: false, chink: false, calc: null },
          rolls: {}, uiHP: null, pilot: {}, natk: {}, info: null, dmgN: 1, core: null, undo: [], stab: null,
          importReport: null, importNotesHidden: true,
        });
        Forge.render();
        return;
      }
      let i = prevUid ? S.sheets.findIndex((s) => s.uid === prevUid) : -1;
      if (i < 0) i = S.sheets.findIndex((s) => !s.hidden);
      if (i < 0) i = 0;
      S.cur = i;
      S.view = "sortie";
      if (S.sheets[i].d && S.sheets[i].d.ch) S.view = "sortie";
      const d = S.sheets[i].d ? JSON.parse(JSON.stringify(S.sheets[i].d)) : {};
      if (typing && localPilot && d && (MP.role === "host" || S.sheets[i].ownerId === MP.selfId)) d.pilot = localPilot;
      Forge.apply(d);
      if (keepDmg) S.dmg = keepDmg;
      S.info = keepInfo ?? null;
      ensureForm();
      Forge.render();
    } finally {
      MP.applying = false;
    }
  }

  function isTyping() {
    const el = document.activeElement;
    if (!el || el === document.body) return false;
    if (!/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return false;
    if (el.id === "CI") return false;
    return true;
  }

  function rebase(payload) {
    if (!payload || MP.role !== "host") return;
    const S = Forge.state();
    const have = new Map((S.sheets || []).map((s) => [s.uid, s]));
    for (const up of payload.upserts || []) {
      if (!have.has(up.uid)) {
        const sh = { uid: up.uid, name: up.name, col: up.col || 0, hidden: !!up.hidden, ownerId: up.ownerId || null, d: up.d };
        S.sheets = S.sheets || [];
        S.sheets.push(sh);
        have.set(up.uid, sh);
      }
    }
    if (payload.meta && payload.meta.length) {
      const next = [];
      for (const m of payload.meta) {
        const sh = have.get(m.uid);
        if (!sh) continue;
        sh.name = m.name;
        sh.col = m.col;
        sh.hidden = m.hidden;
        sh.ownerId = m.ownerId;
        next.push(sh);
      }
      if (next.length) S.sheets = next;
    }
    for (const p of payload.paints || []) {
      const sh = (S.sheets || []).find((s) => s.uid === p.uid);
      if (!sh) continue;
      if (MP.role === "host" || sh.ownerId === MP.selfId) sh.col = p.col;
    }
    if (payload.order && payload.order.length) {
      const by = new Map((S.sheets || []).map((s) => [s.uid, s]));
      const next = [];
      for (const id of payload.order) {
        const sh = by.get(id);
        if (sh) next.push(sh);
      }
      for (const sh of S.sheets || []) if (!next.includes(sh)) next.push(sh);
      if (next.length) S.sheets = next;
    }
    for (const r of payload.rests || []) {
      const sh = (S.sheets || []).find((s) => s.uid === r.uid);
      if (!sh) continue;
      sh.d = Object.assign({}, sh.d || {}, r.rest);
    }
  }

  async function pushOnce() {
    const payload = buildPush();
    if (!payload) return false;
    try {
      const res = await api(payload);
      MP.impacts = MP.impacts.filter((i) => !payload.impacts.includes(i));
      MP.logs = MP.logs.filter((l) => !payload.logs.includes(l));
      const stillThere = new Set(((res.snapshot && res.snapshot.sheets) || []).map((s) => s.uid));
      MP.drops = (MP.drops || []).filter((id) => !(payload.drops || []).includes(id) || stillThere.has(id));
      if (payload.clear) MP.clearPending = false;
      if (MP.forceState) for (const s of payload.states || []) MP.forceState.delete(s.uid);
      MP.conflictTries = 0;
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
      }
      throw err;
    }
  }

  async function flush() {
    if (!MP.ready || pushing) {
      if (pushing) queued = true;
      return;
    }
    pushing = true;
    try {
      let spins = 0;
      do {
        queued = false;
        const sent = await pushOnce();
        spins += 1;
        if (!sent) break;
      } while ((queued || (MP.conflictTries || 0) > 0) && spins < 5);
    } finally {
      pushing = false;
      if (queued) schedule();
    }
  }

  async function poll() {
    const sentColor = MP.seatColor;
    const res = await api({
      op: "poll",
      code: MP.code,
      token: MP.token,
      since: MP.on ? MP.rev : Math.max(MP.rev, 0),
      rollSeq: MP.rollSeq,
      callsign: MP.callsign,
      place: myPlace(),
      seatColor: sentColor || undefined,
    });
    if (sentColor && MP.seatColor === sentColor) MP.seatColor = null;
    const first = MP.on && !MP.ready;
    if (first) MP.ready = true;
    if (MP.on && res.snapshot) applyRemote(res);
    else {
      MP.members = res.members || MP.members;
      absorbMembers(MP.members);
      noteClear(res);
      MP.roster = res.roster || MP.roster;
      MP.hostOnline = !!res.hostOnline;
      if (typeof res.revision === "number" && !MP.on) MP.rev = res.revision;
      if (MP.on) drainRolls(res.rolls || []);
      const memFp = stable(MP.members);
      if (memFp !== MP.memFp && MP.on && !isTyping()) {
        MP.memFp = memFp;
        if (MP.ready) Forge.render();
      } else MP.memFp = memFp;
      paintFriends();
    }
    if (first) {
      const veil = document.getElementById("mpveil");
      if (veil) veil.remove();
      document.documentElement.classList.remove("mp-wait");
      document.body.style.visibility = "";
    }
  }

  async function loop() {
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
  }

  let installed = false;
  function install() {
    if (installed) return;
    installed = true;
    Forge.wrapSay((prev, m, k) => {
      const live = MP.on && MP.ready && !MP.applying && m;
      const s = m == null ? "" : String(m);
      const synced = !!(live && s && !/^\[FAIL\]/.test(s) && /\[ ROLL \]|\[ DMG \]|roll-total|\bd6\b|penetrates|UNDO |REPAIR|HEAT |VENT |OVERRIDE|STABILITY|MOUNT |AMMO|RELOAD|PLATING|DAMAGE /.test(s));
      const shown = synced ? rollPrefix(curUid()) + s : (live ? paintLine(s) : s);
      const out = prev(shown, k);
      if (!synced) return out;
      const nonce = rid();
      MP.nonces.add(nonce);
      if (MP.nonces.size > 400) MP.nonces = new Set(Array.from(MP.nonces).slice(-200));
      const line = {
        nonce,
        uid: curUid(),
        tone: k === "ok" || k === "bad" || k === "warn" ? k : "dim",
        html: s,
      };
      const color = selfColor();
      if (color) line.color = color;
      MP.logs.push(line);
      schedule();
      return out;
    });

    Forge.wrap("R", (prev) => function () {
      if (MP.on && !MP.applying) {
        try {
          ensureUids();
          Forge.save();
        } catch (e) { /* keep the terminal up */ }
      }
      const out = prev.apply(this, arguments);
      if (MP.on) {
        const S = Forge.state();
        const bar = document.getElementById("bar");
        if (bar && (S.view === "sortie" || S.view === "intel") && !bar.querySelector(".stabs")) {
          bar.innerHTML = '<div class=panel style="margin-top:12px"><div class=stabs>' + mpTabs() + "</div></div>";
        }
      }
      if (MP.linked) paintFriends();
      if (MP.linked) markSync();
      if (MP.on && !MP.applying) schedule();
      return out;
    });

    Forge.wrap("applyDmg", (prev) => function () {
      const before = Forge.tel();
      const loc = +(Forge.state().dmg && Forge.state().dmg.loc);
      const hp0 = before && before.hp ? before.hp[loc] : null;
      const sac0 = before && before.sac ? Number(before.sac[loc]) || 0 : 0;
      const out = prev.apply(this, arguments);
      if (!MP.on || !MP.ready || MP.applying || hp0 == null) return out;
      const t = Forge.tel();
      if (!t || !t.hp) return out;
      const hp1 = t.hp[loc];
      const sac1 = t.sac ? Number(t.sac[loc]) || 0 : 0;
      if (hp1 === hp0 && sac1 === sac0) return out;
      const uid = curUid();
      if (!uid) return out;
      const undo = (Forge.state().undo || []).slice(-1)[0] || null;
      MP.impacts.push({
        uid,
        loc,
        delta: hp1 - hp0,
        floor: Forge.isLimb(Forge.locs()[loc] || "") ? -Forge.maxOf(loc) : 0,
        sacInc: Math.max(0, sac1 - sac0),
        undo: undo && undo.l ? { l: String(undo.l).slice(0, 200), t: String(undo.t || "").slice(0, 40000), s: undo.s ? String(undo.s).slice(0, 20000) : null } : null,
        stab: Forge.state().stab || null,
      });
      return out;
    });

    const blocked = [
      ["skillRoll", "SKILL ROLL"],
      ["atkRoll", "ATTACK ROLL"],
      ["parryRoll", "PARRY"],
      ["blockRoll", "BLOCK"],
      ["rollW", "DAMAGE ROLL"],
      ["heatAdd", "HEAT"],
      ["heatVent", "VENT"],
      ["setMount", "MOUNT"],
      ["setHardpoint", "HARDPOINT"],
      ["repairComp", "REPAIR"],
      ["repairAll", "REPAIR"],
      ["engHold", "OVERRIDE"],
      ["stabRoll", "STABILITY"],
      ["stabDismiss", "STABILITY"],
      ["setAmmo", "AMMO"],
      ["reloadW", "RELOAD"],
      ["setid", "DESIGNATION"],
      ["rm", "LOADOUT EDIT"],
      ["compile", "SAVE STATE"],
    ];
    for (const [name, label] of blocked) Forge.wrap(name, (prev) => guard(prev, label, false));
    Forge.wrap("undoLast", (prev) => function () {
      const uid = curUid();
      if (MP.on && MP.ready && !MP.applying && uid) {
        MP.forceState.add(uid);
        MP.impacts = MP.impacts.filter((i) => i.uid !== uid);
      }
      return prev.apply(this, arguments);
    });

    Forge.wrap("telCmd", (prev) => function (c) {
      const a = String(c || "").split(/\s+/)[0];
      if (a === "clear" || a === "cls") broadcastClear();
      if (locked()) {
        const ok = ["status", "stat", "scan", "diag", "targets", "tgts", "target", "tgt", "t", "next", "prev", "undo", "help", "clear", "cls", "ping", "sync", "theme"].includes(a);
        if (!ok) {
          deny("OTHER UNIT");
          return true;
        }
      }
      return prev.apply(this, arguments);
    });
    Forge.wrap("clearLog", (prev) => function () {
      const out = prev.apply(this, arguments);
      broadcastClear();
      return out;
    });
    Forge.wrap("exec", (prev) => function (raw) {
      const c = String(raw || "").trim().toLowerCase();
      let view = "";
      try { view = Forge.state().view || ""; } catch (e) { view = ""; }
      if ((c === "clear" || c === "cls") && view !== "sortie") broadcastClear();
      return prev.apply(this, arguments);
    });

    for (const name of ["shDup", "shClose", "shCommit", "shDrop"]) {
      Forge.wrap(name, (prev) => guard(prev, "FRAME CONTROL", true));
    }

    Forge.wrap("loadManifestFile", (prev) => async function (file) {
      if (MP.on && MP.ready && MP.role !== "host" && ownsFrame()) {
        Forge.say("[ -- ] ONE FRAME PER PILOT :: this callsign already has a unit on the table", "warn");
        return;
      }
      const before = new Set((Forge.state().sheets || []).map((s) => s.uid).filter(Boolean));
      const hold = MP.applying;
      if (MP.on && MP.role !== "host") MP.applying = true;
      try {
        await prev.apply(this, arguments);
      } finally {
        if (MP.on && MP.role !== "host") MP.applying = hold;
      }
      if (!(MP.on && MP.ready)) return;
      ensureUids();
      const S = Forge.state();
      const added = (S.sheets || []).filter((s) => s.uid && !before.has(s.uid));
      const sh = added[added.length - 1];
      if (sh) {
        if (!sh.name) sh.name = mechTitle(S);
        if (MP.role !== "host") {
          sh.ownerId = MP.selfId;
          sh.hidden = false;
          sh.closed = false;
        } else {
          sh.ownerId = null;
          sh.closed = true;
        }
      }
      Forge.render();
    });

    Forge.wrap("realSheet", (prev) => function () {
      if (locked()) {
        return `<div class=nm>CLASSIFIED // OTHER UNIT</div><div class=dim>PAPER DOLL AND IMPACT RESOLUTION ONLY. SKILLS AND THE LOADOUT MANIFEST STAY WITH THE ASSIGNED PILOT.</div>`;
      }
      return prev();
    });
    Forge.wrap("pilotView", (prev) => function () {
      return locked() ? "" : prev();
    });
    Forge.wrap("sortieView", (prev) => function () {
      if (MP.on) {
        let live = null;
        try { live = Forge.tel(); } catch (e) { live = null; }
        if (!live) return "";
      }
      let h = prev();
      if (!MP.on) return h;
      h = h.replace(/<button[^>]*onclick=chooseManifest\(\)[^>]*>\[IMPORT FRAME\]<\/button>/g, "");
      h = h.replace("[APPLY]</button>", `[APPLY]</button><button type=button onclick="undoLast()">[UNDO]</button>`);
      if (locked()) {
        h = `<div class=dim>OTHER UNIT // PAPER DOLL AND IMPACT RESOLUTION ONLY. SKILLS, WEAPONS AND THE LOADOUT STAY WITH THE ASSIGNED PILOT.</div>` + h;
        h = h.replace(/<button onclick=stabRoll\(\)>\[ROLL STABILITY\]<\/button>/g, `<span class=dim>STABILITY SEALED</span>`);
        h = h.replace(/<button onclick=stabDismiss\(\)>\[DISMISS\]<\/button>/g, "");
        h = h.replace(/<span class=selbtns>[\s\S]*?<\/span>/, `<span class=selbtns><button type=button onclick="undoLast()">[UNDO]</button></span>`);
      }
      return h;
    });
    Forge.wrap("intelView", (prev) => function () {
      if (MP.on && MP.ready) return "";
      return prev();
    });
    Forge.wrap("sheetTabs", (prev) => function () {
      if (!MP.on) return prev();
      return mpTabs();
    });
    Forge.wrap("out", (prev) => function () {
      if (!MP.on) return prev();
      MP.on = false;
      MP.ready = false;
      document.body.classList.remove("mp-live");
      const veil = document.getElementById("mpveil");
      if (veil) veil.remove();
      const menu = document.getElementById("mpassign");
      if (menu) menu.remove();
      const out = prev();
      paintFriends();
      return out;
    });
  }

  function tabColor(col) {
    const list = Forge.colors || [];
    const c = list[col || 0] || "";
    return /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : "";
  }

  function canPaint(sh) {
    if (!sh) return false;
    if (MP.role === "host") return true;
    return sh.ownerId === MP.selfId;
  }

  function mechTitle(src) {
    const S = src || {};
    const model = S.cs && String(S.cs).trim() && String(S.cs).trim() !== "PENDING" ? String(S.cs).trim() : "";
    const frame = S.ch && S.ch[0] ? String(S.ch[0]).trim() : "";
    return (model || frame || "").slice(0, 28);
  }

  function sheetTitle(sh, i) {
    if (sh && sh.name) return sh.name;
    const S = Forge.state();
    const src = i === S.cur ? S : ((sh && sh.d) || {});
    const t = mechTitle(src);
    if (t && sh) sh.name = t;
    return (sh && sh.name) || Forge.label(i);
  }

  function mpTabs() {
    ensureUids();
    const S = Forge.state();
    const members = MP.members || [];
    const tab = (sh, i, held) => {
      const on = i === S.cur;
      let st = ["--", "dim"];
      try { st = Forge.status(i); } catch (e) { /* empty sheet */ }
      const label = sheetTitle(sh, i);
      const owner = members.find((m) => m.id === sh.ownerId);
      const who = owner ? shownName(owner) : "";
      const role = sh.closed ? (on ? "Closed" : "C") : who ? (on ? who : (who.trim().charAt(0) || "?").toUpperCase()) : "";
      const roleCol = owner ? memberColor(owner) : "var(--muted)";
      const canName = MP.role === "host" || sh.ownerId === MP.selfId;
      const ed = S.shEdit === i && canName;
      const titleHtml = ed
        ? `<input id=shn maxlength=28 value="${esc(label)}" onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()" onmousedown="event.stopPropagation()" onblur="mpCommit('${sh.uid}',this.value)" onkeydown="if(event.key=='Enter')this.blur();if(event.key=='Escape'){event.preventDefault();mpCommit('${sh.uid}',null)}">`
        : `<span class="stn ${st[1]}">${esc(label)}</span>`;
      const rename = !ed && canName
        ? `<span class=stx title="Rename" onclick="event.stopPropagation();mpRename('${sh.uid}')" onpointerdown="event.stopPropagation()">[R]</span>`
        : "";
      const assign = !role && MP.role !== "host"
        ? ""
        : sh.closed && MP.role !== "host"
          ? ""
          : MP.role === "host"
            ? `<span class="stx asg" data-assign="1" style="color:${roleCol}" title="Assign" onpointerdown="mpAssign(event,'${sh.uid}')" onmousedown="event.stopPropagation()" onclick="event.stopPropagation();event.preventDefault()">[${esc(role || "+")}]</span>`
            : `<span class=stx style="color:${roleCol}">[${esc(role)}]</span>`;
      const kill = (MP.role === "host" || sh.ownerId === MP.selfId)
        ? `<span class=stx title="Delete" onclick="event.stopPropagation();mpClose('${sh.uid}')" onpointerdown="event.stopPropagation()">[X]</span>`
        : "";
      const holdWord = on ? (held ? "Sortie" : "Hold") : (held ? "S" : "H");
      const dupWord = on ? "Dupe" : "D";
      const hostBtns = MP.role === "host"
        ? `<span class=stx title="${held ? "Deploy to the sortie" : "Hold"}" onclick="event.stopPropagation();mpHold('${sh.uid}', ${held ? "false" : "true"})" onpointerdown="event.stopPropagation()">[${holdWord}]</span><span class=stx title="Duplicate" onclick="event.stopPropagation();mpDup('${sh.uid}')" onpointerdown="event.stopPropagation()">[${dupWord}]</span>${kill}`
        : kill;
      const c = tabColor(sh.col);
      const style = c
        ? ` style="border-color:${c};color:${c}${on ? `;box-shadow:0 0 0 1px ${c},0 0 8px ${c}66` : ""}"`
        : "";
      const hint = on && canPaint(sh) ? "Click again to cycle this color. Drag the tab to reorder." : "Drag the tab to reorder.";
      return `<span class="stab${on ? " on" : ""}" data-uid="${esc(sh.uid)}"${style} title="${esc(hint)}" onclick="mpGo('${sh.uid}')" onpointerdown="mpDown(event,'${sh.uid}')" onmousedown="mpDown(event,'${sh.uid}')" onselectstart="return false" ondragstart="return false">${titleHtml}${rename}${assign}${hostBtns}</span>`;
    };
    const rows = (S.sheets || []).map((sh, i) => [sh, i]);
    let h = rows.filter(([sh]) => !sh.hidden).map(([sh, i]) => tab(sh, i, false)).join("");
    if (MP.role === "host") h += `<button type=button onclick="chooseManifest()">[+ LOAD SHEET]</button>`;
    else if (!ownsFrame()) h += `<button type=button onclick="chooseManifest()">[+ LOAD MY FRAME]</button>`;
    if (MP.role === "host") h += `<span class=mpsor><button type=button onclick="mpLoadAll()">[LOAD SORTIE]</button><button type=button onclick="mpSaveAll()">[SAVE SORTIE]</button></span>`;
    const hidden = rows.filter(([sh]) => sh.hidden);
    if (MP.role === "host" && hidden.length) {
      h += `<span class=dim style="flex-basis:100%">HOLDING BAY // NOT SENT TO PILOTS</span>` + hidden.map(([sh, i]) => tab(sh, i, true)).join("");
    }
    return h;
  }

  function ownsFrame() {
    return (Forge.state().sheets || []).some((s) => s && s.ownerId === MP.selfId);
  }

  function weaponRolls() {
    const items = (Forge.state().items) || [];
    return [...items.filter((x) => x.c === "A"), ...items.filter((x) => x.c === "D"), ...items.filter((x) => x.c === "U")]
      .filter((x) => x.c === "A" && /(^| )DMG:/.test(x.s || ""));
  }

  function damageRollHtml() {
    const rolls = Forge.state().rolls || {};
    const list = weaponRolls();
    const lines = [];
    for (const key of Object.keys(rolls)) {
      const r = rolls[key];
      if (!r || !Array.isArray(r.atk) || !r.atk.length) continue;
      const name = (list[key] && list[key].n) || "WEAPON";
      const bits = r.atk.map((a) => (Array.isArray(a.rolls) ? "[" + a.rolls.join(", ") + "] = " + a.total : String(a.total)));
      lines.push(esc(name) + " :: " + bits.join(" · "));
    }
    if (!lines.length) return "";
    return `<div class="dim dmg-sync">DAMAGE ROLL // ${lines.join(" // ")}</div>`;
  }

  function ensureChrome() {
    if (document.getElementById("mpstyle")) return;
    const style = document.createElement("style");
    style.id = "mpstyle";
    style.textContent = "#mpfriends{position:fixed;z-index:40;left:0;top:0;width:210px;max-height:100vh;box-sizing:border-box;overflow:auto;background-color:var(--bg);background-image:repeating-linear-gradient(#0000 0 2px,#0003 3px);border-right:1px solid var(--line);color:var(--fg);font:12px/1.35 Consolas,monospace;padding:8px}#mpfriends.min{width:42px;overflow:hidden}#mpfriends .mph{display:flex;justify-content:space-between;align-items:center;gap:6px;color:var(--cyan);letter-spacing:.08em;margin-bottom:8px}#mpfriends.min .mph{margin-bottom:0}#mpfriends.min .mph span,#mpfriends.min .mprow{display:none}#mpfriends button{background:transparent;color:var(--cyan);border:1px solid var(--line)}#mpfriends button:hover{background:var(--hover);color:var(--fg)}.mprow{padding:5px 0;border-bottom:1px solid var(--line);color:var(--fg)}.mprow b{color:var(--fg);font-weight:normal}.mprow b.tint{cursor:pointer}.mprow.host b{color:#ffb400}.mprow.dark{opacity:.72}.mprow .dim{color:var(--muted)}.mprow .bad{color:var(--c-bad,#f65)}.mprow .onl{color:var(--cyan)}.stabs .mpsor{margin-left:auto;display:inline-flex;align-items:center}.stab .asg{cursor:pointer;white-space:nowrap}#mpassign,#mptint{position:fixed;z-index:500;background:var(--bg);border:1px solid var(--cyan);color:var(--fg);min-width:168px;padding:4px;box-shadow:0 8px 24px #000a}#mpassign button,#mptint button{display:block;width:100%;text-align:left;margin:0;background:transparent;color:var(--fg);border:0;padding:3px 6px}#mpassign button:hover{background:var(--hover);color:var(--cyan)}#mptint input{background:var(--bg);border:1px solid var(--line);width:100%;max-width:none}body.mp-linked{padding-left:210px}body.mp-linked.mp-friends-min{padding-left:42px}";
    document.head.appendChild(style);
  }

  function safeHex(c) {
    return /^#[0-9a-fA-F]{6}$/.test(String(c || "")) ? String(c) : "";
  }

  function memberByName(name) {
    const n = String(name || "").trim().toUpperCase();
    if (!n) return null;
    return (MP.members || []).find((x) => String(x.callsign || "").trim().toUpperCase() === n) || null;
  }

  function memberHex(m) {
    if (!m) return "";
    return safeHex(m.color) || safeHex(MP.tints && MP.tints[m.id]) || "";
  }

  function memberColor(m) {
    const tint = memberHex(m);
    if (tint) return tint;
    if (m && m.role === "host") return "#ffb400";
    return "var(--fg)";
  }

  function selfColor() {
    const m = (MP.members || []).find((x) => x.id === MP.selfId);
    return memberHex(m) || safeHex(MP.tints && MP.tints[MP.selfId]) || "";
  }

  function rememberTint(id, color) {
    const hex = safeHex(color);
    if (!hex || !id) return;
    if (!MP.tints) MP.tints = {};
    MP.tints[id] = hex;
  }

  function absorbMembers(list) {
    for (const m of list || []) if (m && m.color) rememberTint(m.id, m.color);
  }

  function noteClear(view) {
    const seq = Number(view && view.snapshot && view.snapshot.clearSeq) || 0;
    if (!MP.clearReady) {
      MP.clearSeq = Math.max(seq, MP.clearSeq || 0);
      MP.clearReady = true;
      return;
    }
    if (!(seq > (MP.clearSeq || 0))) return;
    MP.clearSeq = seq;
    if (MP.clearUntil && Date.now() < MP.clearUntil) return;
    const log = document.getElementById("log");
    if (log) log.innerHTML = "";
  }

  function broadcastClear() {
    const log = document.getElementById("log");
    if (log) log.innerHTML = "";
    if (!(MP.on && MP.ready && !MP.applying)) return;
    MP.clearPending = true;
    MP.clearUntil = Date.now() + 1800;
    schedule();
  }

  function rollPrefix(uid) {
    const me = (MP.members || []).find((x) => x.id === MP.selfId);
    const name = me ? shownName(me) : (MP.callsign || "user unknown");
    let unit = "SORTIE";
    let colorUid = uid;
    try {
      const S = Forge.state();
      const sheets = S.sheets || [];
      const sh = sheets.find((s) => s && s.uid === uid) || (S.cur != null ? sheets[S.cur] : null);
      if (sh) {
        colorUid = sh.uid;
        const i = sheets.indexOf(sh);
        unit = sheetTitle(sh, i) || unit;
      }
    } catch (e) { /* keep the line */ }
    return `<span style="color:${memberColor(me)}">${esc(name)}</span> <span class=dim>//</span> <span style="color:${unitColor(colorUid)}">${esc(unit)}</span> `;
  }

  function actorColor(name, hint) {
    const hinted = safeHex(hint);
    if (hinted) return hinted;
    return memberColor(memberByName(name));
  }

  function unitColor(uid) {
    let sheets = [];
    try { sheets = (Forge.state().sheets || []).concat(MP.shadow || []); } catch (e) { sheets = MP.shadow || []; }
    const sh = sheets.find((s) => s && s.uid === uid);
    return (sh && tabColor(sh.col)) || "var(--muted)";
  }

  function tintSpan(text, color) {
    const c = color || "var(--muted)";
    return `<span style="color:${c}">${esc(text)}</span>`;
  }

  function paintLine(raw) {
    const text = String(raw || "");
    if (text.includes("<")) return text;
    const names = [];
    const seen = new Set();
    const add = (label, color) => {
      const n = String(label || "").trim();
      if (n.length < 2 || seen.has(n.toUpperCase())) return;
      seen.add(n.toUpperCase());
      names.push({ n, color });
    };
    const seatTint = (m) => memberHex(m) || (m && m.role === "host" ? "#ffb400" : "");
    for (const m of MP.members || []) {
      const tint = seatTint(m);
      if (tint) add(m.callsign, tint);
    }
    let sheets = [];
    try { sheets = (Forge.state().sheets || []).concat(MP.shadow || []); } catch (e) { sheets = MP.shadow || []; }
    for (const sh of sheets) add(sh && sh.name, (sh && tabColor(sh.col)) || "var(--muted)");
    names.sort((a, b) => b.n.length - a.n.length);
    const bound = (i) => i <= 0 || i >= text.length || !/[A-Za-z0-9]/.test(text[i]);
    let html = "";
    let i = 0;
    const upper = text.toUpperCase();
    while (i < text.length) {
      let hit = null;
      if (bound(i - 1)) {
        for (const name of names) {
          const end = i + name.n.length;
          if (upper.startsWith(name.n.toUpperCase(), i) && bound(end)) { hit = name; break; }
        }
      }
      if (!hit) { html += esc(text[i]); i += 1; continue; }
      html += tintSpan(text.slice(i, i + hit.n.length), hit.color);
      i += hit.n.length;
    }
    return html;
  }

  function syncHtml() {
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
  }

  function shownName(m) {
    const n = String((m && m.callsign) || "").trim();
    if (!n || n.toUpperCase() === "USER UNKNOWN") return "user unknown";
    return n;
  }

  function myPlace() {
    let S = null;
    try { S = Forge.state(); } catch (e) { S = null; }
    const v = S && S.view;
    const role = S && S.role;
    if (v === "mechanic" || (role === "MECHANIC" && v && v !== "login")) return "Service Bay";
    if (role === "RESEARCH STAFF" || v === "catalog" || v === "catalogEdit") return "R+D Archive";
    if (MP.on || v === "intel" || v === "sortie") return "Sortie";
    if ((v === "chassis" || v === "main") && role === "OVERSEER") return "Frame Assembly*";
    if (v === "chassis" || v === "main") return "Frame Assembly";
    return "Welcome";
  }

  function paintFriends() {
    if (!MP.linked) return;
    ensureChrome();
    let box = document.getElementById("mpfriends");
    if (!box) {
      box = document.createElement("aside");
      box.id = "mpfriends";
      document.body.appendChild(box);
    }
    box.classList.toggle("min", !MP.seatsOpen);
    document.body.classList.add("mp-linked");
    document.body.classList.toggle("mp-friends-min", !MP.seatsOpen);
    const members = (MP.members || []).slice().sort((a, b) => {
      if ((a.online ? 1 : 0) !== (b.online ? 1 : 0)) return a.online ? -1 : 1;
      if (a.role === b.role) return shownName(a).localeCompare(shownName(b));
      return a.role === "host" ? -1 : 1;
    });
    const rows = members.map((m) => {
      const name = shownName(m);
      const away = !m.online && m.id !== MP.selfId;
      const where = away ? "OFFLINE" : (m.id === MP.selfId ? myPlace() : (m.place || "Welcome"));
      const dark = away ? " dark" : "";
      const tint = safeHex(m.color);
      const host = !tint && m.role === "host" ? " host" : "";
      const you = m.id === MP.selfId ? " · you" : "";
      const nameStyle = tint ? ` style="color:${tint}"` : "";
      const synced = where === "Sortie" && (m.id === MP.selfId ? MP.status === "online" : !!m.online);
      const inSortie = !away && synced;
      const place = away ? `<div class=bad>[OFFLINE]</div>` : inSortie ? `<div class=onl>[ONLINE]</div>` : `<div class=dim>[${esc(where)}]</div>`;
    const canTint = MP.role === "host" || m.id === MP.selfId;
    const click = canTint ? ` onclick="mpTint(event,'${m.id}')"` : "";
    const tintClass = canTint ? " tint" : "";
    return `<div class="mprow${host}${dark}"><b class="${tintClass}"${nameStyle}${click}>${esc(name)}</b>${you}${place}</div>`;
    }).join("");
    const sync = syncHtml();
    const html = `<div class=mph><span>LINK ${sync}</span><button type=button onclick="mpSeats()" title="${MP.seatsOpen ? "Collapse" : "Expand"}">${MP.seatsOpen ? "[–]" : "[" + members.length + "]"}</button></div>${MP.seatsOpen ? `<div class=mpbody>${rows || `<div class=dim>no seats</div>`}</div>` : ""}`;
    if (box.innerHTML !== html) box.innerHTML = html;
  }

  window.mpSeats = function () {
    MP.seatsOpen = !MP.seatsOpen;
    try { localStorage.setItem("forge_mp_seats_min", MP.seatsOpen ? "0" : "1"); } catch (e) { /* private mode */ }
    paintFriends();
  };

  window.mpTint = function (ev, id) {
    if (ev) {
      ev.stopPropagation();
      ev.preventDefault();
    }
    if (MP.role !== "host" && id !== MP.selfId) return;
    const old = document.getElementById("mptint");
    if (old) old.remove();
    const m = (MP.members || []).find((x) => x.id === id);
    const box = document.createElement("div");
    box.id = "mptint";
    box.style.left = ((ev && ev.clientX) || 48) + "px";
    box.style.top = ((ev && ev.clientY) || 48) + "px";
    box.innerHTML = `<div class=dim>NAME COLOR</div><input type=color value="${safeHex(m && m.color) || "#7fffd4"}">`;
    box.addEventListener("pointerdown", (e) => e.stopPropagation());
    const input = box.querySelector("input");
    input.addEventListener("change", () => {
      const color = safeHex(input.value);
      if (!color) return;
      if (m) m.color = color;
      rememberTint(id, color);
      MP.seatColor = { id: id, color: color };
      paintFriends();
      box.remove();
    });
    document.body.appendChild(box);
  };

  function sheetBlob() {
    Forge.save();
    const S = Forge.state();
    const keys = ["ch", "items", "tel", "id", "cs", "dmg", "rolls", "uiHP", "pilot", "natk", "info", "dmgN", "core", "undo", "stab", "importReport", "importNotesHidden"];
    const d = {};
    for (const k of keys) if (S[k] !== undefined) d[k] = JSON.parse(JSON.stringify(S[k]));
    return d;
  }

  window.mpSaveAll = function () {
    if (MP.role !== "host" || typeof dl !== "function") return;
    Forge.save();
    const S = Forge.state();
    const keep = JSON.parse(JSON.stringify(S.sheets || []));
    const cur = S.cur;
    const parts = ["FORGE ENCOUNTER", ""];
    for (const sh of keep) {
      try { Forge.apply(sh.d || {}); } catch (e) { /* skip a bad sheet */ }
      parts.push("======== " + (sh.name || "SHEET") + (sh.closed ? " // CLOSED" : "") + " ========");
      try { parts.push(typeof txt === "function" ? txt() : ""); } catch (e) { parts.push(""); }
      parts.push("");
    }
    S.sheets = keep;
    S.cur = cur;
    if (cur != null && S.sheets[cur]) {
      try { Forge.apply(S.sheets[cur].d || {}); } catch (e) { /* restore */ }
    }
    dl(parts.join("\n"), "FORGE-ENCOUNTER.txt");
    Forge.render();
  };

  window.mpEditor = function () {
    if (!MP.linked) return;
    if (MP.editing) {
      const take = window.confirm("Import the open frame into the live sortie?");
      const edited = take ? sheetBlob() : null;
      const bench = MP.bench || { sheets: [], cur: null };
      MP.editing = false;
      MP.on = true;
      MP.ready = true;
      const S = Forge.state();
      S.role = "IMPERIAL INTELLIGENCE";
      S.authRole = "";
      S.sheets = bench.sheets;
      S.cur = bench.cur;
      S.view = "sortie";
      if (take && edited) {
        let i = (S.sheets || []).findIndex((s) => s && s.ownerId === MP.selfId);
        if (i < 0 && MP.role === "host" && S.cur != null) i = S.cur;
        if (i >= 0) {
          S.sheets[i].d = edited;
          S.cur = i;
          S.view = "sortie";
        } else {
          S.sheets = [{ uid: rid(), name: MP.callsign, col: 0, hidden: false, closed: false, ownerId: MP.selfId, d: edited }];
          S.cur = 0;
          S.view = "sortie";
        }
      }
      if (S.cur != null && S.sheets && S.sheets[S.cur]) {
        try { Forge.apply(S.sheets[S.cur].d || {}); } catch (e) { /* keep the bench */ }
      }
      MP.bench = null;
      Forge.render();
      return;
    }
    if (!MP.on) return;
    Forge.save();
    const S = Forge.state();
    MP.bench = { sheets: JSON.parse(JSON.stringify(S.sheets || [])), cur: S.cur };
    const mine = (S.sheets || []).find((s) => s && s.ownerId === MP.selfId) || (S.cur != null ? S.sheets[S.cur] : null);
    MP.editing = true;
    MP.on = false;
    S.role = "GUEST";
    S.authRole = "";
    if (mine && mine.d) {
      Forge.apply(mine.d);
      S.view = "main";
    } else {
      S.view = "chassis";
      S.ch = null;
      S.items = [];
    }
    Forge.render();
  };

  window.mpAssign = function (ev, uid) {
    if (ev) {
      ev.stopPropagation();
      ev.preventDefault();
    }
    const opener = ev && ev.currentTarget && ev.currentTarget.getBoundingClientRect ? ev.currentTarget : null;
    const rect = opener ? opener.getBoundingClientRect() : null;
    const frozen = rect ? { left: rect.left, top: rect.top, bottom: rect.bottom } : null;
    openAssign(uid, frozen);
  };

  function openAssign(uid, rect) {
    const old = document.getElementById("mpassign");
    if (old && old.dataset.for === uid) {
      old.remove();
      return;
    }
    if (old) old.remove();
    const members = MP.members || [];
    const menu = document.createElement("div");
    menu.id = "mpassign";
    menu.dataset.for = uid;
    const width = 180;
    let left = rect ? rect.left : 40;
    let top = rect ? rect.bottom + 2 : 40;
    if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
    menu.style.left = Math.max(8, left) + "px";
    menu.style.top = Math.max(8, top) + "px";
    const item = (id, label, color) => `<button type=button data-id="${esc(id)}"${color ? ` style="color:${color}"` : ""}>${esc(label)}</button>`;
    menu.innerHTML = item("CLOSED", "Closed") + members.map((m) => item(m.id, shownName(m), memberColor(m))).join("");
    menu.addEventListener("pointerdown", (e) => e.stopPropagation());
    menu.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      e.stopPropagation();
      menu.remove();
      window.mpOwner(uid, btn.getAttribute("data-id") || "");
    });
    document.body.appendChild(menu);
    const box = menu.getBoundingClientRect();
    if (box.bottom > window.innerHeight - 8 && rect) {
      menu.style.top = Math.max(8, rect.top - box.height - 2) + "px";
    }
  }

  window.mpRename = function (uid) {
    const S = Forge.state();
    const i = (S.sheets || []).findIndex((s) => s && s.uid === uid);
    if (i < 0) return;
    const sh = S.sheets[i];
    if (MP.role !== "host" && sh.ownerId !== MP.selfId) return;
    S.shEdit = i;
    Forge.render();
    setTimeout(() => {
      const el = document.getElementById("shn");
      if (el) { el.focus(); el.select(); }
    }, 0);
  };

  window.mpCommit = function (uid, v) {
    const S = Forge.state();
    const i = (S.sheets || []).findIndex((s) => s && s.uid === uid);
    if (i < 0 || S.shEdit !== i) return;
    if (v != null) {
      const name = String(v).replace(/[<>]/g, "").trim().slice(0, 28);
      S.sheets[i].name = name;
    }
    S.shEdit = -1;
    Forge.render();
  };

  function splitEncounter(text) {
    const re = /^========\s+(.+?)\s+========\s*$/gm;
    const marks = [];
    let m;
    while ((m = re.exec(text))) marks.push({ name: m[1], at: m.index, end: m.index + m[0].length });
    return marks.map((mark, i) => {
      const body = text.slice(mark.end, marks[i + 1] ? marks[i + 1].at : text.length).trim();
      const closed = /\/\/\s*CLOSED\s*$/.test(mark.name);
      const name = mark.name.replace(/\s*\/\/\s*CLOSED\s*$/, "").trim();
      return { name: name, closed: closed, body: body };
    }).filter((s) => /FRAME LOADOUT MANIFEST/.test(s.body));
  }

  window.mpLoadAll = async function () {
    if (MP.role !== "host" || !MP.on) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt,text/plain";
    input.className = "filepick";
    input.onchange = async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      let text = "";
      try { text = await file.text(); } catch (e) { text = ""; }
      const parts = splitEncounter(text);
      if (!parts.length) {
        Forge.say("[FAIL] SORTIE FILE UNREADABLE :: expected a saved FORGE ENCOUNTER.", "bad");
        Forge.render();
        return;
      }
      const S = Forge.state();
      const old = (S.sheets || []).map((s) => s && s.uid).filter(Boolean);
      for (const id of old) {
        MP.drops.push(id);
        MP.dropped.add(id);
      }
      S.sheets = [];
      S.cur = null;
      S.view = "sortie";
      MP.applying = true;
      try {
        for (const part of parts) {
          const chunk = new File([part.body], (part.name || "sheet") + ".txt", { type: "text/plain" });
          await loadManifestFile(chunk);
          try { Forge.save(); } catch (e) { /* sheet not ready */ }
          const sh = S.sheets && S.sheets[S.sheets.length - 1];
          if (sh) {
            sh.name = (part.name || mechTitle(S) || sh.name || "SHEET").slice(0, 28);
            sh.closed = !!part.closed;
            sh.hidden = false;
            sh.ownerId = null;
          }
        }
      } finally {
        MP.applying = false;
      }
      if (S.sheets && S.sheets.length) {
        S.cur = 0;
        S.view = "sortie";
        try { Forge.apply(S.sheets[0].d || {}); } catch (e) { /* keep the load */ }
      }
      Forge.say("[ OK ] SORTIE LOADED :: " + ((S.sheets && S.sheets.length) || 0) + " FRAME" + ((S.sheets && S.sheets.length) === 1 ? "" : "S"), "ok");
      Forge.render();
    };
    document.body.appendChild(input);
    input.click();
    setTimeout(() => input.remove(), 0);
  };

  document.addEventListener("pointerdown", (e) => {
    const t = e.target;
    if (t && t.closest && t.closest("#mpassign,#mptint,[data-assign],[data-tint]")) return;
    const menu = document.getElementById("mpassign");
    if (menu) menu.remove();
    const tint = document.getElementById("mptint");
    if (tint) tint.remove();
  });

  window.mpGo = function (uid) {
    if (MP.suppressClick) return;
    const S = Forge.state();
    if (S.shEdit != null && S.shEdit >= 0) return;
    const i = (S.sheets || []).findIndex((s) => s.uid === uid);
    if (i < 0) return;
    if (i === S.cur) {
      const sh = S.sheets[i];
      if (!canPaint(sh)) return;
      sh.col = ((sh.col || 0) + 1) % (Forge.colors.length || 6);
      if (typeof audioEvent === "function") audioEvent("open", true);
      Forge.render();
      return;
    }
    Forge.save();
    S.cur = i;
    Forge.apply(S.sheets[i].d || {});
    ensureForm();
    if (typeof audioEvent === "function") audioEvent("open", true);
    Forge.render();
  };

  function clearDragChrome() {
    document.querySelectorAll(".stab.dragging,.stab.drop-target").forEach((n) => {
      n.classList.remove("dragging");
      n.classList.remove("drop-target");
    });
  }

  function reorderSheets(fromUid, toUid) {
    const S = Forge.state();
    const sheets = S.sheets || [];
    const a = sheets.findIndex((s) => s.uid === fromUid);
    const b = sheets.findIndex((s) => s.uid === toUid);
    if (a < 0 || b < 0 || a === b) return;
    if (MP.role !== "host" && (sheets[a].hidden || sheets[b].hidden)) return;
    Forge.save();
    const cur = sheets[S.cur];
    const [moved] = sheets.splice(a, 1);
    sheets.splice(b, 0, moved);
    const next = sheets.indexOf(cur);
    if (next >= 0) S.cur = next;
    if (typeof audioEvent === "function") audioEvent("drag", true);
    Forge.render();
  }

  function untrackDrag() {
    window.removeEventListener("pointermove", trackDrag);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);
    window.removeEventListener("mousemove", trackDrag);
    window.removeEventListener("mouseup", endDrag);
  }

  function endDrag(e) {
    const d = MP.drag;
    if (!d) return;
    untrackDrag();
    MP.drag = null;
    const over = document.querySelector(".stab.drop-target");
    clearDragChrome();
    if (!d.moved) {
      mpGo(d.uid);
      MP.suppressClick = true;
      setTimeout(() => { MP.suppressClick = false; }, 80);
      return;
    }
    MP.suppressClick = true;
    setTimeout(() => { MP.suppressClick = false; }, 80);
    let target = over && over.dataset.uid;
    if (!target && e) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const stab = el && el.closest ? el.closest(".stab[data-uid]") : null;
      target = stab && stab.dataset.uid;
    }
    if (target && target !== d.uid) reorderSheets(d.uid, target);
  }

  function trackDrag(e) {
    const d = MP.drag;
    if (!d) return;
    if (e.cancelable) e.preventDefault();
    const sel = window.getSelection && window.getSelection();
    if (sel && sel.removeAllRanges) sel.removeAllRanges();
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) return;
    d.moved = true;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const stab = el && el.closest ? el.closest(".stab[data-uid]") : null;
    clearDragChrome();
    const src = document.querySelector('.stab[data-uid="' + (window.CSS && CSS.escape ? CSS.escape(d.uid) : d.uid) + '"]');
    if (src) src.classList.add("dragging");
    if (stab && stab.dataset.uid !== d.uid) stab.classList.add("drop-target");
  }

  window.mpDown = function (e, uid) {
    if (e.button && e.button !== 0) return;
    const t = e.target;
    if (t && t.closest && t.closest("select,button,input,textarea,.stx")) return;
    if (MP.drag && MP.drag.uid === uid) return;
    if (e.cancelable) e.preventDefault();
    MP.drag = { uid: uid, x: e.clientX, y: e.clientY, moved: false };
    window.addEventListener("pointermove", trackDrag);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    window.addEventListener("mousemove", trackDrag);
    window.addEventListener("mouseup", endDrag);
  };

  window.mpHold = function (uid, hidden) {
    if (MP.role !== "host") return;
    const S = Forge.state();
    const sh = (S.sheets || []).find((s) => s.uid === uid);
    if (!sh) return;
    Forge.save();
    sh.hidden = !!hidden;
    if (typeof audioEvent === "function") audioEvent(hidden ? "panelClose" : "panelOpen", true);
    if (hidden && S.sheets[S.cur] === sh) {
      const n = S.sheets.findIndex((s) => !s.hidden);
      if (n >= 0) {
        S.cur = n;
        Forge.apply(S.sheets[n].d || {});
        ensureForm();
      }
    }
    Forge.say(hidden ? "[ -- ] UNIT MOVED TO HOLDING BAY // OMITTED FROM PILOT LINKS" : "[ -- ] UNIT DEPLOYED TO THE SORTIE", hidden ? "warn" : "ok");
    Forge.render();
  };

  window.mpOwner = function (uid, id) {
    if (MP.role !== "host") return;
    const S = Forge.state();
    const sh = (S.sheets || []).find((s) => s.uid === uid);
    if (!sh) return;
    if (!id || id === "CLOSED") {
      if (id !== "CLOSED") return;
      sh.ownerId = null;
      sh.closed = true;
    } else {
      sh.ownerId = id;
      sh.closed = false;
    }
    const found = (MP.members || []).find((x) => x.id === id);
    const label = id === "CLOSED" ? "Closed" : (found ? found.callsign : "Closed");
    Forge.say("[ OK ] UNIT ASSIGNED :: " + label, "ok");
    Forge.render();
  };

  window.mpDup = function (uid) {
    if (MP.role !== "host" || typeof shDup !== "function") return;
    const S = Forge.state();
    const i = (S.sheets || []).findIndex((s) => s.uid === uid);
    if (i >= 0) shDup(i);
  };

  window.mpClose = function (uid) {
    const S = Forge.state();
    const i = (S.sheets || []).findIndex((s) => s.uid === uid);
    if (i < 0) return;
    const sh = S.sheets[i];
    const mine = sh.ownerId === MP.selfId;
    if (MP.role !== "host" && !mine) return;
    Forge.save();
    const nm = sh.name || "SHEET";
    S.sheets.splice(i, 1);
    MP.drops.push(uid);
    MP.dropped.add(uid);
    if (typeof audioEvent === "function") audioEvent("panelClose", true);
    if (mine && MP.role !== "host") {
      S.view = "sortie";
      S.cur = null;
      S.role = "IMPERIAL INTELLIGENCE";
      Forge.say("[ -- ] SHEET CLOSED :: " + nm, "warn");
      Forge.render();
      return;
    }
    if (!S.sheets.length) {
      S.cur = null;
      S.view = "sortie";
    } else if (S.cur === i || S.cur > i) {
      S.cur = Math.max(0, Math.min(S.cur == null ? 0 : S.cur - (S.cur > i ? 1 : 0), S.sheets.length - 1));
      if (S.cur === i) S.cur = Math.min(i, S.sheets.length - 1);
      Forge.apply(S.sheets[S.cur].d || {});
    }
    Forge.say("[ -- ] SHEET CLOSED :: " + nm, "warn");
    Forge.render();
  };

  function readSeat() {
    try {
      const raw = localStorage.getItem("forge_mp_token_TABLE");
      if (!raw) return null;
      const o = JSON.parse(raw);
      if (!o || !o.token || !o.id) return null;
      return o;
    } catch (e) {
      return null;
    }
  }

  function savedCallsign() {
    try {
      const n = (localStorage.getItem("forge_mp_callsign") || "").trim();
      if (/^[A-Za-z0-9][A-Za-z0-9 ._-]{0,15}$/.test(n) && n.toUpperCase() !== "USER UNKNOWN") return n;
    } catch (e) { /* private mode */ }
    return "";
  }

  function rememberSeat(data, callsign) {
    try {
      localStorage.setItem("forge_mp_token_TABLE", JSON.stringify({ token: data.token, id: data.you.id, role: data.you.role }));
      if (callsign && callsign.toUpperCase() !== "USER UNKNOWN") localStorage.setItem("forge_mp_callsign", callsign);
    } catch (e) { /* private mode */ }
  }

  function startLink(session) {
    MP.linked = true;
    MP.code = String(session.code || "TABLE");
    MP.token = String(session.token);
    MP.selfId = String(session.id);
    MP.role = session.role === "host" ? "host" : "player";
    MP.callsign = String(session.callsign || "USER UNKNOWN");
    if (!MP.members) MP.members = [];
    try { MP.seatsOpen = localStorage.getItem("forge_mp_seats_min") !== "1"; } catch (e) { MP.seatsOpen = true; }
    install();
    ensureChrome();
    paintFriends();
    if (!MP.timer) void loop();
  }

  function enterSortie(session) {
    startLink(session);
    if (MP.on) return;
    MP.on = true;
    MP.ready = false;
    MP.heard = false;
    MP.rev = -1;
    let veil = document.getElementById("mpveil");
    if (!veil) {
      veil = document.createElement("div");
      veil.id = "mpveil";
      document.body.appendChild(veil);
    }
    veil.textContent = "LIVE DATA INTERCEPT // ESTABLISHING CHANNEL";
    document.body.classList.add("mp-live");
    const S = Forge.state();
    S.logoutRole = "";
    S.role = "IMPERIAL INTELLIGENCE";
    S.authRole = "";
    S.view = "sortie";
    S.sheets = [];
    S.cur = null;
    Forge.render();
  }

  window.mpAuth = async function () {
    if (MP.busy || MP.on) return;
    const el = document.getElementById("mpname");
    const name = (el && el.value ? el.value : "").trim();
    window.__mpDraft = name;
    if (!/^[A-Za-z0-9][A-Za-z0-9 ._-]{0,15}$/.test(name) || name.toUpperCase() === "USER UNKNOWN") {
      Forge.say("[FAIL] CALLSIGN REJECTED :: 1-16 characters. Letters, digits, spaces, periods, underscores or hyphens.", "bad");
      Forge.render();
      return;
    }
    MP.busy = true;
    try {
      const saved = MP.token ? { token: MP.token, id: MP.selfId, role: MP.role } : readSeat();
      let data = null;
      if (saved && saved.token) {
        try {
          data = await api({ op: "resume", code: "TABLE", token: saved.token, callsign: name });
          data.token = saved.token;
        } catch (err) {
          if (!err.rejected && !err.ended) throw err;
          try { localStorage.removeItem("forge_mp_token_TABLE"); } catch (e) { /* private mode */ }
          data = null;
        }
      }
      if (!data) data = await api({ op: "enter", callsign: name });
      if (!data.token || !data.you) throw new Error("the channel did not return a seat");
      rememberSeat(data, data.you.callsign || name);
      if (typeof audioEvent === "function") audioEvent("chassisSelectSuccess", true);
      enterSortie({
        code: data.code || "TABLE",
        token: data.token,
        id: data.you.id,
        role: data.you.role === "host" ? "host" : "player",
        callsign: data.you.callsign || name,
      });
    } catch (err) {
      Forge.say("[FAIL] INTERCEPT REFUSED :: " + (err.message || "channel down"), "bad");
      Forge.render();
    } finally {
      MP.busy = false;
    }
  };

  async function connectQuiet() {
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
      rememberSeat(data, kept.toUpperCase() === "USER UNKNOWN" ? "" : kept);
      startLink({
        code: data.code || "TABLE",
        token: data.token,
        id: data.you.id,
        role: data.you.role === "host" ? "host" : "player",
        callsign: kept,
      });
    } catch (e) {
      setTimeout(connectQuiet, 2000);
    }
  }

  function boot() {
    document.documentElement.classList.remove("mp-wait");
    if (document.body) document.body.style.visibility = "";
    try { localStorage.removeItem("forge_mp_live"); } catch (e) { /* stay on the access router */ }
    void connectQuiet();
  }

  boot();
})();
