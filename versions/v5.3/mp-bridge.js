/* Sortie link. Shares the terminal's script scope through window.Forge.
   v15 (FORGE-OS 5.1): remote console HTML rebuilt from an allow-list (R7); unsent edits survive polls and
   409s via a 3-way merge with one tie rule, host wins / last write while the host is away (R1/R2); undo sends
   additive inverse impacts and keeps queued hits (R3); queued hits and lines are never dropped (R4); the
   revision is frozen in the frame editor (R5); reconnect, backoff, hidden-tab polling and [RE-AUTH] (R6);
   only the host clears the shared log (R9); no seat is taken on the login screen. See SERVER-CONTRACT.md.
   v16 (FORGE-OS 5.2): tab actions in a context menu (data-act); a console line or name the server would refuse
   no longer blocks every later push; the owner's value wins collisions on their own unit (both sides agree); empty table copies
   never wipe local skills/loadout/heat; seat-mismatch notices; console MP WHOAMI / MP RESYNC / MP RESET-LOCAL.
   v18 (FORGE-OS 5.3): commands need a leading '/', other input is table chat (data, rendered with textContent);
   roll cards travel as structured data (rc) and are rebuilt with esc() on every seat; no log timestamps.
   v19 (FORGE-OS 5.3.1): card updates accepted only from the card's author (server actorId); default seat colors. */
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
    rtt: null,
    fails: 0,
    looping: false,
    stuck: false,
    confAt: 0,
    features: null,
    popped: new Set(),
    lastSt: "",
    badPush: 0,
    told: new Set(),
  };

  function esc(t) {
    return Forge.esc(t == null ? "" : String(t));
  }

  const SAFE_TAG = /^(SPAN|B|I|U|EM|STRONG|SMALL|BR|DIV|SUP|SUB)$/;
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
            if (n === "class") ok = /^[\w -]{0,80}$/.test(v);
            else if (n === "data-ev" || n === "data-undo-of") ok = /^[\w-]{1,40}$/.test(v);
            else if (n === "title") ok = v.length < 200;
            else if (n === "style") ok = /^\s*color\s*:\s*(#[0-9a-fA-F]{3,8}|var\(--[\w-]+\))\s*;?\s*$/.test(v);
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
  /* the server refuses a push whose console line is over 8000 chars (zod); long multi-hit damage rolls
     could reach that, and the refused push used to be retried forever with every later edit queued behind it */
  function capHtml(h) {
    const s = String(h || "");
    if (s.length <= 7800) return s;
    const box = document.createElement("template");
    box.innerHTML = s;
    const txt = (box.content.textContent || "").replace(/\s+/g, " ");
    return esc(txt.slice(0, 7000)) + " … [LINE TRUNCATED FOR THE TABLE]";
  }

  function safeTone(k) { return /^(ok|bad|warn|dim)$/.test(String(k || "")) ? k : "dim"; }

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
      name: String(sh.name || "").slice(0, 28),
      col: sh.col || 0,
      hidden: !!sh.hidden,
      closed: !!sh.closed,
      ownerId: sh.ownerId || null,
      d: sh.d || null,
    };
  }

  function metaOf(sh) {
    return { uid: sh.uid, name: String(sh.name || "").slice(0, 28), col: sh.col || 0, hidden: !!sh.hidden, closed: !!sh.closed, ownerId: sh.ownerId || null };
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
    MP.kick = setTimeout(() => { flush().catch((e) => { MP.error = String((e && e.message) || e); }); }, Math.max(220, (MP.holdUntil || 0) - Date.now()));
  }

  async function api(body) {
    const prefix = (location.pathname.match(/^\/hds-[a-z0-9]+-\d+-[a-z0-9]+/i) || [""])[0];
    const res = await fetch(prefix + "/api/forge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({ error: "bad response" }));
    if (data && Array.isArray(data.features)) MP.features = new Set(data.features);
    else if (data && data.ok && !Array.isArray(data.features)) MP.features = new Set();
    if (res.status === 409 && data && data.snapshot) {
      const err = new Error("conflict");
      err.conflict = data;
      throw err;
    }
    if (!res.ok) {
      const err = new Error(data.error || "link " + res.status);
      err.ended = res.status === 404;
      err.rejected = res.status === 403;
      err.invalid = res.status === 400 || res.status === 413;
      err.status = res.status;
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
      if (sh.uid === cur) {
        const owner = (MP.members || []).find((m) => m.id === prev.ownerId);
        tellOnce("unowned:" + sh.uid, "[ !! ] EDITS NOT SAVED :: " + esc(prev.name || "this unit") + " is assigned to " + esc(owner ? shownName(owner) + " " + seatTag(owner.id) : prev.ownerId ? "seat " + seatTag(prev.ownerId) : "nobody") + "; this tab is " + esc(MP.callsign) + " " + seatTag(MP.selfId) + ". Ask the host to assign it to you, or type /MP WHOAMI.");
      }
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
          if (typeof logKind === "function") d.dataset.k = logKind(html);
          if (typeof logTs === "function") d.dataset.ts = logTs();
          d.innerHTML = `<span class="${safeTone(tone)}">${html || ""}</span>`;
          log.appendChild(d);
          while (log.children.length > 160) log.removeChild(log.firstChild);
          log.scrollTop = log.scrollHeight;
          return;
        }
        if (typeof audioEvent === "function" && /\[ ROLL \]|roll-total|\bd6\b/.test(String(html))) audioEvent("dice");
        const wrapped = `<span class="${safeTone(tone)}">${html || ""}</span>`;
        if (typeof type === "function") await type(log, wrapped);
        else {
          const d = document.createElement("div");
          d.className = safeTone(tone);
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
      if (catchup && rolls.length - rolls.indexOf(r) > 30) continue;
      if (r.nonce && MP.nonces.has(r.nonce)) continue;
      // v5.3: structured console data. Chat and roll cards are rebuilt from plain strings (textContent/esc), never from HTML.
      if (r.rc && r.rc.k === "chat") {
        if (typeof chatShow === "function") chatShow(String(r.actor || "?"), actorColor(r.actor, r.color), String(r.rc.t || ""));
        continue;
      }
      if (r.rc && r.rc.k === "roll" && typeof rcRemote === "function") {
        const card = rcRemote(r.rc, r.actor, actorColor(r.actor, r.color), r.unit, r.actorId || "");
        if (card !== "") {
          if (card) speakRemote(card, safeTone(r.tone), catchup);
          if (!catchup && / DMG \d/.test(" " + String(r.rc.r || "")) && typeof announceHit === "function") { try { announceHit(String(r.actor || "Another seat")); } catch (e) { /* best effort */ } }
          continue;
        }
      }
      const who = `<span style="color:${actorColor(r.actor, r.color)}">${esc(r.actor)}</span> <span class=dim>//</span> <span style="color:${unitColor(r.uid)}">${esc(r.unit)}</span> `;
      const body = cleanHtml(r.html || "");
      speakRemote(who + body, safeTone(r.tone), catchup);
      if (catchup) continue;
      try {
        const plain = body.replace(/<[^>]*>/g, "");
        if (/DAMAGE|penetrates/i.test(plain) && typeof announceHit === "function") announceHit(String(r.actor || "Another seat"));
        const uo = /data-undo-of="([\w-]{1,40})"/.exec(body);
        if (uo && typeof markUndone === "function") setTimeout(() => markUndone(uo[1]), 60);
      } catch (e) { /* announcements are best effort */ }
    }
    if (catchup) MP.heard = true;
  }

  function applyRemote(view) {
    if (!view || !view.snapshot) return;
    try { Forge.save(); } catch (e) { /* sheet not ready */ }
    const S = Forge.state();
    const incoming = (view.snapshot.sheets || []).map(pack).filter((s) => !(MP.dropped && MP.dropped.has(s.uid)));
    const fp = stable(incoming.map((s) => ({ ...s, d: split(s.d) })));
    let dirty = [];
    const baseShadow = MP.shadow || [];
    try { if (MP.ready) dirty = JSON.parse(JSON.stringify(dirtyWritable((S.sheets || []).filter((s) => s && s.uid).map(pack)))); } catch (e) { dirty = []; }
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
    try { seatCheck(incoming); } catch (e) { /* advisory only */ }
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
      if (dirty.length) { try { mergeDirty(S.sheets, baseShadow, dirty); } catch (e) { console.error("[forge] merge", e); } }
      try { keepNonEmpty(S.sheets, localBy); } catch (e) { console.error("[forge] guard", e); }
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
      if (i < 0 && MP.role !== "host") i = S.sheets.findIndex((s) => !s.hidden && s.ownerId === MP.selfId);
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

  /* v5.2 guard: never let an empty table copy wipe non-empty local skills, loadout or heat on a unit this seat
     writes. The local values are kept (and re-sent by the next push, which repairs the stored copy). */
  function emptyObj(v) { return !v || typeof v !== "object" || !Object.keys(v).some((k) => v[k] !== "" && v[k] != null); }
  function keepNonEmpty(sheets, localBy) {
    for (const sh of sheets || []) {
      if (!sh || !sh.d) continue;
      /* only units this seat owns (or unowned units, for the host): the owner's own deliberate clear is local */
      if (!(sh.ownerId === MP.selfId || (MP.role === "host" && !sh.ownerId))) continue;
      const loc = localBy.get(sh.uid);
      if (!loc || !loc.d) continue;
      const kept = [];
      if (emptyObj(sh.d.pilot) && !emptyObj(loc.d.pilot)) { sh.d.pilot = JSON.parse(JSON.stringify(loc.d.pilot)); kept.push("skills"); }
      if ((!Array.isArray(sh.d.items) || !sh.d.items.length) && Array.isArray(loc.d.items) && loc.d.items.length) { sh.d.items = JSON.parse(JSON.stringify(loc.d.items)); kept.push("loadout"); }
      if (loc.d.tel && (!sh.d.tel || sh.d.tel.heat == null) && loc.d.tel.heat != null) {
        if (!sh.d.tel) sh.d.tel = JSON.parse(JSON.stringify(loc.d.tel));
        else sh.d.tel.heat = loc.d.tel.heat;
        kept.push("heat");
      }
      if (kept.length) tellOnce("guard:" + sh.uid + kept.join(), "[ !! ] SYNC GUARD :: the table copy of " + esc(sh.name || "this unit") + " arrived with empty " + kept.join(", ") + "; your local values were kept and will be re-sent. Type /MP RESYNC to take the table copy instead.");
    }
  }
  function tellOnce(key, m) { if (MP.told.has(key)) return; MP.told.add(key); noteLocal(m); }
  function seatTag(id) { return id ? "#" + String(id).slice(0, 4) : "#----"; }
  /* a pilot who re-entered while their old seat was still online (second tab, lost token, shared browser) got a
     second seat with the same callsign; their unit stayed with the old seat, so every edit was discarded */
  function seatCheck(incoming) {
    if (MP.role === "host" || !MP.selfId) return;
    const mine = (incoming || []).some((s) => s.ownerId === MP.selfId);
    if (mine) return;
    const me = String(MP.callsign || "").toUpperCase();
    const twin = (MP.members || []).find((m) => m.id !== MP.selfId && String(m.callsign || "").toUpperCase() === me);
    if (!twin) return;
    const unit = (incoming || []).find((s) => s.ownerId === twin.id);
    if (!unit) return;
    tellOnce("twin:" + twin.id, "[ !! ] SEAT MISMATCH :: " + esc(unit.name || "a unit") + " belongs to an older seat with your callsign (" + seatTag(twin.id) + "); this tab is seat " + seatTag(MP.selfId) + ", so your edits there cannot be saved. Type /MP RESET-LOCAL to release this seat and reclaim it, or ask the host to assign the unit to you.");
  }

  function isTyping() {
    const el = document.activeElement;
    if (!el || el === document.body) return false;
    if (!/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return false;
    if (el.id === "CI") return false;
    return true;
  }

  function merge3(base, mine, theirs, path, pick, numeric, uid) {
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
    return pick({ uid, path: path.replace(/^\./, ""), base, mine, theirs });
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
    const keepMine0 = MP.role === "host" || !MP.hostOnline;
    for (const m of dirty) {
      const sh = (sheets || []).find((s) => s.uid === m.uid);
      const b = byBase.get(m.uid);
      if (!sh || !sh.d || !b) continue;
      /* v5.2: on a unit owned by another seat that is online, that pilot's value wins (skills, loadout, heat);
         the host used to win here, so a host with the pilot's tab open could overwrite the pilot's edits */
      const ownerOn = MP.role === "host" && b.ownerId && b.ownerId !== MP.selfId && (MP.members || []).some((x) => x.id === b.ownerId && x.online);
      const keepMine = (keepMine0 && !ownerOn) || b.ownerId === MP.selfId;
      const B = split(b.d), M = split(m.d), T = split(sh.d);
      const hits = [];
      const pick = (c) => { hits.push(Object.assign(c, { owner: ownerOn, mineUnit: MP.role !== "host" && b.ownerId === MP.selfId })); return keepMine ? c.mine : c.theirs; };
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
      const rule = c.owner ? "OWNER VALUE KEPT" : c.mineUnit ? "YOUR VALUE KEPT (YOUR UNIT)" : MP.role === "host" ? "HOST VALUE KEPT" : !MP.hostOnline ? "LAST WRITE KEPT (HOST OFFLINE)" : "HOST/TABLE VALUE KEPT // re-enter yours to override";
      noteLocal("[ -- ] CONFLICT " + label + " :: TABLE=" + fmtV(c.theirs) + " vs YOU=" + fmtV(c.mine) + " => " + rule);
    }
    if (found.length > 6) noteLocal("[ -- ] CONFLICT :: " + (found.length - 6) + " more field(s) settled by the same rule");
  }

  function trimLocal(level) {
    const S = Forge.state();
    try { Forge.save(); } catch (e) {}
    const mine = (S.sheets || []).filter((sh) => sh.d && (MP.role === "host" || sh.ownerId === MP.selfId));
    for (const sh of mine) {
      if (Array.isArray(sh.d.undo) && sh.d.undo.length > 8) sh.d.undo = sh.d.undo.slice(-8);
      if (level >= 2 && sh.d.importReport) sh.d.importReport = null;
    }
    if (Array.isArray(S.undo) && S.undo.length > 8) S.undo = S.undo.slice(-8);
    if (level >= 2 && S.importReport) S.importReport = null;
    return level >= 2 ? "undo history trimmed to 8 steps and the import report dropped" : "undo history trimmed to 8 steps";
  }
  function noteLocal(m) { setTimeout(() => { MP.applying = true; try { Forge.say(m, "warn"); } finally { MP.applying = false; } }, 0); }

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
    /* rest blobs are merged field by field inside applyRemote() (mergeDirty) */
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
      MP.stuck = false;
      MP.badPush = 0;
      MP.holdUntil = 0;
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
      }
      if (err.invalid) {
        /* v5.2.1: a refused update (400, or 413 = too large) is reported every time, trimmed, and retried with
           backoff (1s, 2s, 4s .. 15s) instead of 32 silent retries in 6s */
        MP.badPush = (MP.badPush || 0) + 1;
        const big = err.status === 413;
        MP.logs = MP.logs.filter((l) => !payload.logs.includes(l));
        let what = "its console lines were kept local only";
        if (big) what = trimLocal(MP.badPush) + "; its console lines were kept local only";
        if (MP.badPush >= 2) { MP.impacts = MP.impacts.filter((i) => !payload.impacts.includes(i)); what += "; its queued hits were dropped (apply them again by hand)"; }
        const wait = Math.min(15000, 1000 * 2 ** (MP.badPush - 1));
        MP.holdUntil = Date.now() + wait;
        if (MP.badPush <= 3 || MP.badPush % 5 === 0)
          noteLocal("[ !! ] LINK REFUSED AN UPDATE" + (big ? " (TOO LARGE)" : "") + " :: " + esc(err.message || "invalid") + " :: " + what + "; retrying in " + Math.round(wait / 1000) + "s. Type /MP WHOAMI if this repeats.");
        MP.error = "update refused: " + (err.message || "invalid");
        setTimeout(schedule, wait);
        return false;
      }
      throw err;
    }
  }

  async function flush(force) {
    if (!force && (MP.holdUntil || 0) > Date.now()) return;
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
      if (typeof res.revision === "number" && !MP.on && !MP.editing) MP.rev = res.revision;
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
    MP.sheetFp = "";
    MP.memFp = "";
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
  };

  function mpLine(m, k) { MP.applying = true; try { Forge.say(m, k || "dim"); } finally { MP.applying = false; } }
  function pendingInfo() {
    let edits = 0;
    try { edits = dirtyWritable(localSheets()).length; } catch (e) { edits = 0; }
    const forced = MP.forceState ? MP.forceState.size : 0;
    const n = MP.impacts.length + MP.logs.length + edits + forced;
    const txt = MP.impacts.length + " HIT(S), " + MP.logs.length + " LINE(S), " + (edits + forced) + " UNIT EDIT(S)";
    return { n, txt };
  }
  async function flushNow() {
    clearTimeout(MP.kick);
    for (let i = 0; i < 6 && pendingInfo().n; i++) {
      if (pushing) { await new Promise((r) => setTimeout(r, 150)); continue; }
      try { await flush(true); } catch (e) { MP.error = String((e && e.message) || e); break; }
      if (!MP.ready) break;
    }
    return pendingInfo();
  }
  async function mpCommand(sub) {
    const S = Forge.state();
    const me = (MP.members || []).find((m) => m.id === MP.selfId);
    if (sub === "whoami" || sub === "diag" || sub === "") {
      const sh = S.sheets && S.sheets[S.cur];
      const owner = sh ? (MP.members || []).find((m) => m.id === sh.ownerId) : null;
      const writable = !!sh && (MP.role === "host" || sh.ownerId === MP.selfId);
      const mine = (S.sheets || []).filter((s) => s.ownerId === MP.selfId).map((s, i) => esc(s.name || "UNIT " + (i + 1)));
      mpLine("[ -- ] SEAT :: " + esc(MP.callsign) + " " + seatTag(MP.selfId) + " // " + MP.role.toUpperCase() + (me ? "" : " // NOT IN ROSTER") + " // LINK " + esc(MP.status) + " // REV " + MP.rev + " // QUEUE " + MP.impacts.length + " HIT(S), " + MP.logs.length + " LINE(S)" + (MP.error ? " // LAST ERROR " + esc(MP.error) : ""), "ok");
      mpLine("[ -- ] CURRENT UNIT :: " + (sh ? esc(sh.name || "UNIT") + " // OWNER " + (owner ? esc(shownName(owner)) + " " + seatTag(owner.id) : sh.ownerId ? "UNKNOWN SEAT " + seatTag(sh.ownerId) : "NONE") + " // " + (writable ? "YOUR EDITS ARE SAVED" : "READ ONLY FOR THIS SEAT") : "none"), writable ? "ok" : "warn");
      mpLine("[ -- ] YOUR UNITS :: " + (mine.length ? mine.join(", ") : "none") + " // /MP RESYNC = take the table copy // /MP RESET-LOCAL = release this seat and re-enter your callsign", "dim");
      Forge.render();
      return;
    }
    if (/^(resync|reset-local|reset)( confirm| force)?$/.test(sub)) {
      const reset = !/^resync/.test(sub), word = reset ? "RESET-LOCAL" : "RESYNC";
      const confirm = / confirm$/.test(sub), force = / force$/.test(sub);
      mpLine("[ -- ] " + word + " :: sending pending changes first...", "dim");
      Forge.render();
      const p = await flushNow();
      const left = p.n ? "UNSENT: " + p.txt + " could not be sent (link " + esc(MP.status) + (MP.error ? ", " + esc(MP.error) : "") + ")" : "all changes sent and acknowledged";
      if (!reset && !p.n && !confirm && !force) { doResync(); return; }
      if (!confirm && !force) {
        mpLine("[ !! ] " + word + " :: " + left + ". Type /MP " + word + " CONFIRM to " + (reset ? "release this seat and re-enter your callsign" : "drop them and load the table copy") + ".", p.n ? "bad" : "warn");
        Forge.render();
        return;
      }
      if (p.n && !force && reset) {
        mpLine("[ !! ] " + word + " REFUSED :: " + left + ". Wait for LINK ONLINE and try again, or type /MP RESET-LOCAL FORCE to discard them.", "bad");
        Forge.render();
        return;
      }
      if (reset) doReset(); else doResync(p.n);
      return;
    }
    mpLine("[ -- ] MP COMMANDS :: /MP WHOAMI (seat and unit ownership) // /MP RESYNC (send pending changes, then take the table copy) // /MP RESET-LOCAL (send pending changes, then release this seat and re-enter your callsign; asks for CONFIRM)", "dim");
    Forge.render();
  }

  function doResync(dropped) {
    MP.shadow = [];
    MP.sheetFp = "";
    MP.forceState.clear();
    MP.rev = -1;
    MP.badPush = 0;
    MP.holdUntil = 0;
    MP.told.clear();
    mpLine("[ -- ] RESYNC :: " + (dropped ? "unsent sheet edits dropped; " : "") + "loading the table copy", "warn");
    Forge.render();
    void loop();
  }
  function doReset() {
    const token = MP.token, code = MP.code;
    MP.impacts = [];
    MP.logs = [];
    MP.forceState.clear();
    MP.drops = [];
    MP.dropped = new Set();
    MP.popped = new Set();
    MP.told.clear();
    MP.holdUntil = 0;
    const done = () => window.mpReauth();
    if (token) api({ op: "leave", code: code || "TABLE", token }).then(done, done);
    else done();
  }

  let installed = false;
  function install() {
    if (installed) return;
    installed = true;
    Forge.wrapSay((prev, m, k) => {
      const live = MP.on && MP.ready && !MP.applying && m;
      const s0 = m == null ? "" : String(m);
      if (s0.indexOf("data-rcid=") >= 0) return prev(s0, k); // roll cards travel as data via mpCard()
      const s = live && typeof evTag === "function" ? String(evTag(s0, k) ?? "") : s0;
      const synced = !!(live && s && !/^\[FAIL\]/.test(s0) && /\[ ROLL \]|\[ DMG \]|roll-total|\bd6\b|penetrates|UNDO |REPAIR|HEAT |VENT |OVERRIDE|STABILITY|MOUNT |AMMO|RELOAD|PLATING|DAMAGE |RADS /.test(s));
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
        html: capHtml(s),
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
        id: rid(),
        kind: "hit",
        uid,
        loc,
        delta: hp1 - hp0,
        floor: Forge.isLimb(Forge.locs()[loc] || "") ? -Forge.maxOf(loc) : 0,
        sacInc: Math.max(0, sac1 - sac0),
        undo: undo && undo.l ? { l: String(undo.l).slice(0, 200), id: undo.id || null, by: undo.by || MP.selfId, t: String(undo.t || "").slice(0, 40000), s: undo.s ? String(undo.s).slice(0, 20000) : null } : null,
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
      ["radAdj", "RADS"],
    ];
    for (const [name, label] of blocked) Forge.wrap(name, (prev) => guard(prev, label, false));
    Forge.wrap("undoLast", (prev) => function () {
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
      const t = String(raw || "").trim();
      let view = "", role = "";
      try { view = Forge.state().view || ""; role = Forge.state().role || ""; } catch (e) { view = ""; }
      const pre = !role || ["login", "pw", "researchPw", "mpw", "deny", "lock"].includes(view);
      // v5.3: only "/..." is a command; anything else is chat to the table
      if (t && t[0] !== "/" && !pre && MP.on && MP.ready) { sendChat(t); return; }
      const c = t.replace(/^\//, "").trim().toLowerCase();
      if (t[0] === "/" && /^mp( |$)/.test(c) && MP.linked) { mpCommand(c.slice(2).trim()); return; }
      if (t[0] === "/" && (c === "clear" || c === "cls") && view !== "sortie") broadcastClear();
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
      const st = syncState();
      h = h.replace('<b class=lnk id=sync data-s=local>[LOCAL]</b>', `<b class=lnk id=sync data-s="${st}">${esc(syncText(st))}</b>`);

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
        ? `<span class=stx data-act=rename data-label="Rename unit" title="Rename this unit" onclick="event.stopPropagation();mpRename('${sh.uid}')" onpointerdown="event.stopPropagation()">[R]</span>`
        : "";
      const assign = !role && MP.role !== "host"
        ? ""
        : sh.closed && MP.role !== "host"
          ? ""
          : MP.role === "host"
            ? `<span class="stx asg" data-assign="1" data-act=assign data-label="Assign pilot…" style="color:${roleCol}" title="Assign this unit to a seat, or mark it closed" onpointerdown="mpAssign(event,'${sh.uid}')" onmousedown="event.stopPropagation()" onclick="event.stopPropagation();event.preventDefault()">[${esc(role || "+")}]</span>`
            : `<span class=stx style="color:${roleCol}">[${esc(role)}]</span>`;
      const kill = (MP.role === "host" || sh.ownerId === MP.selfId)
        ? `<span class=stx data-act=close data-label="Delete unit" title="Delete this unit from the sortie" onclick="event.stopPropagation();mpClose('${sh.uid}')" onpointerdown="event.stopPropagation()">[X]</span>`
        : "";
      const holdWord = on ? (held ? "Sortie" : "Hold") : (held ? "S" : "H");
      const dupWord = on ? "Dupe" : "D";
      const hostBtns = MP.role === "host"
        ? `<span class=stx data-act=hold data-label="${held ? "Deploy to the sortie" : "Move to the holding bay"}" title="${held ? "Deploy this unit to the sortie (pilots see it)" : "Hold this unit back (pilots do not see it)"}" onclick="event.stopPropagation();mpHold('${sh.uid}', ${held ? "false" : "true"})" onpointerdown="event.stopPropagation()">[${holdWord}]</span><span class=stx data-act=dup data-label="Duplicate unit" title="Duplicate this unit into a new tab" onclick="event.stopPropagation();mpDup('${sh.uid}')" onpointerdown="event.stopPropagation()">[${dupWord}]</span>${kill}`
        : kill;
      const c = tabColor(sh.col);
      const style = c
        ? ` style="border-color:${c};color:${c}${on ? `;box-shadow:0 0 0 1px ${c},0 0 8px ${c}66` : ""}"`
        : "";
      const hint = (on && canPaint(sh) ? "Click again to cycle this color. Drag the tab to reorder." : "Click to open. Drag the tab to reorder.") + (owner ? " Pilot: " + shownName(owner) + "." : "") + " Right-click or Shift+F10 for unit actions.";
      return `<span class="stab${on ? " on" : ""}" data-uid="${esc(sh.uid)}" tabindex=0 role=button aria-haspopup=menu${style} title="${esc(hint)}" onclick="mpGo('${sh.uid}')" onpointerdown="mpDown(event,'${sh.uid}')" onmousedown="mpDown(event,'${sh.uid}')" onselectstart="return false" ondragstart="return false">${titleHtml}${rename}${assign}${hostBtns}</span>`;
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
    style.textContent = "#mpfriends{position:fixed;z-index:40;left:0;top:0;width:210px;max-height:100vh;box-sizing:border-box;overflow:auto;background-color:var(--bg);background-image:repeating-linear-gradient(#0000 0 2px,#0003 3px);border-right:1px solid var(--line);color:var(--fg);font-family:inherit;font-size:var(--fs-l,12.5px);line-height:1.4;padding:8px}#mpfriends.min{width:42px;overflow:hidden}#mpfriends .mph{display:flex;justify-content:space-between;align-items:center;gap:6px;color:var(--cyan);letter-spacing:.08em;margin-bottom:8px}#mpfriends.min .mph{margin-bottom:0}#mpfriends.min .mph span,#mpfriends.min .mprow{display:none}#mpfriends button{background:transparent;color:var(--cyan);border:1px solid var(--line)}#mpfriends button:hover{background:var(--hover);color:var(--fg)}.mprow{padding:5px 0;border-bottom:1px solid var(--line);color:var(--fg)}.mprow b{color:var(--fg);font-weight:normal}.mprow b.tint{cursor:pointer}.mprow.host b{color:#ffb400}.mprow.dark{opacity:.72}.mprow .dim{color:var(--muted)}.mprow .bad{color:var(--c-bad,#f65)}.mprow .onl{color:var(--cyan)}.stabs .mpsor{margin-left:auto;display:inline-flex;align-items:center}.stab .asg{cursor:pointer;white-space:nowrap}#mpassign,#mptint{position:fixed;z-index:500;background:var(--bg);border:1px solid var(--cyan);color:var(--fg);min-width:168px;padding:4px;box-shadow:0 8px 24px #000a}#mpassign button,#mptint button{display:block;width:100%;text-align:left;margin:0;background:transparent;color:var(--fg);border:0;padding:3px 6px}#mpassign button:hover{background:var(--hover);color:var(--cyan)}#mptint input{background:var(--bg);border:1px solid var(--line);width:100%;max-width:none}body.mp-linked{padding-left:210px}body.mp-linked.mp-friends-min{padding-left:42px}";
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

  // v5.3.1: untinted pilots get a default seat color (same on every screen: slot from the seat id, collisions
  // resolved in seat-id order), so chat and roll lines never look like system text. The host keeps amber.
  const SEAT_PAL = ["#5fd7ff", "#ff87d7", "#d7afff", "#87afff", "#5fffd7", "#ffaf87", "#afd75f", "#ffd7af"];
  function seatHash(id) { let h = 0; for (const ch of String(id || "")) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h % SEAT_PAL.length; }
  function defaultTint(m) {
    if (!m || !m.id) return SEAT_PAL[0];
    const ids = (MP.members || []).filter((x) => x && x.id && x.role !== "host").map((x) => x.id);
    if (!ids.includes(m.id)) ids.push(m.id);
    ids.sort();
    const used = new Set();
    for (const id of ids) {
      let slot = seatHash(id);
      for (let i = 0; i < SEAT_PAL.length && used.has(slot); i++) slot = (slot + 1) % SEAT_PAL.length;
      used.add(slot);
      if (id === m.id) return SEAT_PAL[slot];
    }
    return SEAT_PAL[seatHash(m.id)];
  }

  function memberColor(m) {
    const tint = memberHex(m);
    if (tint) return tint;
    if (m && m.role === "host") return "#ffb400";
    if (m) return defaultTint(m);
    return "var(--fg)";
  }

  function selfColor() {
    const m = (MP.members || []).find((x) => x.id === MP.selfId);
    return memberHex(m) || safeHex(MP.tints && MP.tints[MP.selfId]) || (m ? safeHex(memberColor(m)) : "");
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
    if (MP.role !== "host") { noteLocal("[ -- ] CONSOLE CLEARED ON THIS SCREEN ONLY :: the shared sortie log is cleared by the host"); return; }
    MP.clearPending = true;
    MP.clearUntil = Date.now() + 1800;
    schedule();
  }

  function meMember() { return (MP.members || []).find((x) => x.id === MP.selfId); }
  function sendChat(text) {
    const t = String(text).slice(0, 500);
    const me = meMember();
    if (typeof chatShow === "function") chatShow(me ? shownName(me) : (MP.callsign || "YOU"), memberColor(me), t);
    const nonce = rid();
    MP.nonces.add(nonce);
    const line = { nonce, uid: null, tone: "dim", html: capHtml(esc(t)), rc: { k: "chat", t } };
    const color = selfColor();
    if (color) line.color = color;
    MP.logs.push(line);
    schedule();
  }
  window.mpWho = function () {
    if (!(MP.on && MP.ready)) return null;
    const me = meMember();
    return { u: me ? shownName(me) : (MP.callsign || "YOU"), c: memberColor(me), id: MP.selfId || "local" };
  };
  window.mpCard = function (rc, up) {
    if (!rc || !(MP.on && MP.ready && !MP.applying)) return;
    const s = (v, n) => String(v == null ? "" : v).slice(0, n);
    const tone = ["ok", "bad", "warn", "dim"].includes(rc.o) ? rc.o : "dim";
    const nonce = rid();
    MP.nonces.add(nonce);
    const line = {
      nonce,
      uid: curUid(),
      tone,
      html: capHtml(esc(s(rc.a, 160) + " :: " + s(rc.r, 80))),
      rc: { k: "roll", id: s(rc.id, 22), f: s(rc.f, 80), a: s(rc.a, 160), r: s(rc.r, 80), o: tone, d: (rc.d || []).slice(0, 40).map((x) => s(x, 300)), up: !!up },
    };
    const color = selfColor();
    if (color) line.color = color;
    MP.logs.push(line);
    schedule();
  };

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

  function syncState() {
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
    if (st === "off") return "[OFFLINE \u00b7 " + q + " QUEUED]";
    if (st === "err") return "[LINK ERR // RE-AUTH]";
    if (st === "conf") return MP.stuck ? "[RESYNC \u00b7 " + q + " QUEUED]" : "[CONFLICT // RESYNCED]";
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
      if (MP.lastSt && st !== "lag" && MP.lastSt !== "lag" && typeof announce === "function") announce("Link " + syncText(st).replace(/[\[\]]/g, "").toLowerCase());
      MP.lastSt = st;
    }
  }

  function shownName(m) {
    const n = String((m && m.callsign) || "").trim();
    if (!n || n.toUpperCase() === "USER UNKNOWN") return "user unknown";
    const twins = (MP.members || []).filter((x) => String(x.callsign || "").trim().toUpperCase() === n.toUpperCase()).length;
    return twins > 1 ? n + " " + seatTag(m.id) : n;
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
    const click = canTint ? ` onclick="mpTint(event,'${m.id}')" title="Change this seat's color (seat ${seatTag(m.id)})"` : ` title="Seat ${seatTag(m.id)}"`;
    const tintClass = canTint ? " tint" : "";
    return `<div class="mprow${host}${dark}"><b class="${tintClass}"${nameStyle}${click}>${esc(name)}</b>${you}${place}</div>`;
    }).join("");
    const sync = syncHtml();
    const html = `<div class=mph><span>LINK ${sync}</span><button type=button onclick="mpSeats()" title="${MP.seatsOpen ? "Collapse the table roster" : "Expand the table roster"}">${MP.seatsOpen ? "[–]" : "[" + members.length + "]"}</button></div>${MP.seatsOpen ? `<div class=mpbody>${rows || `<div class=dim>no seats</div>`}</div>` : ""}`;
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
    window.__forgeSelf = MP.selfId;
    if (!MP.members) MP.members = [];
    try { MP.seatsOpen = localStorage.getItem("forge_mp_seats_min") !== "1"; } catch (e) { MP.seatsOpen = true; }
    install();
    ensureChrome();
    paintFriends();
    if (!MP.timer && !MP.looping) void loop();
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
      rememberSeat(data, kept);
      startLink({
        code: data.code || "TABLE",
        token: data.token,
        id: data.you.id,
        role: data.you.role === "host" ? "host" : "player",
        callsign: kept,
      });
    } catch (e) {
      MP.quietFails = (MP.quietFails || 0) + 1;
      setTimeout(connectQuiet, Math.min(30000, 2000 * Math.pow(2, MP.quietFails - 1)));
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
