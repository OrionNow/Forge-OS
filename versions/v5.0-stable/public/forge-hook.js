/* Classic script. Shares the terminal's global bindings and exposes them to mp-bridge.js. */
try {
  if (!window.Forge) {
  window.Forge = {
    esc: function (t) {
      return esc(t);
    },
    state: function () {
      return S;
    },
    save: function () {
      shSave();
    },
    apply: function (d) {
      shApply(d || {});
    },
    render: function () {
      R();
    },
    say: function (m, k) {
      say(m, k);
    },
    tel: function () {
      try {
        return tel();
      } catch (e) {
        return null;
      }
    },
    locs: function () {
      try {
        return locs();
      } catch (e) {
        return [];
      }
    },
    isLimb: function (n) {
      try {
        return !!isLimb(n);
      } catch (e) {
        return false;
      }
    },
    maxOf: function (i) {
      try {
        return maxOf(i);
      } catch (e) {
        return 1;
      }
    },
    status: function (i) {
      return shStatus(i);
    },
    label: function (i) {
      return shLabel(i);
    },
    colors: SH_COL,
    snap: function () {
      return shSnap();
    },
    wrapSay: function (fn) {
      const prev = say;
      say = function (m, k) {
        return fn(prev, m, k);
      };
    },
    wrap: function (name, factory) {
      const prev = window[name];
      if (typeof prev !== "function") {
        console.warn("[forge] missing " + name);
        return;
      }
      window[name] = factory(prev);
    },
  };
}
} catch (err) {
  console.error("[forge] hook failed", err);
  document.documentElement.classList.remove("mp-wait");
}
