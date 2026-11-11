/* FORGE-OS 5.5.4: presentation and keyboard access only.
   Existing command, component and multiplayer handlers remain authoritative. */
(function () {
  'use strict';
  let lastView = '', sheetQuery = '', pendingFocus = null;
  let scheduled = false;
  const byId = id => document.getElementById(id);
  const cleanExport = cleanExportDOM;
  cleanExportDOM = function () {
    const root = cleanExport();
    root.querySelectorAll('#uxbar,#uxhelp,#tabmenu,#clog,#toast').forEach(el => el.remove());
    const body = root.querySelector('body');
    ['data-view', 'data-pane', 'data-density'].forEach(name => body.removeAttribute(name));
    body.classList.remove('ux-reduced');
    return root;
  };
  const create = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  };
  document.body.removeAttribute('data-density');
  document.body.removeAttribute('data-pane');
  document.body.classList.remove('ux-reduced');
  for (const [id, label] of [['con', 'Workspace'], ['sh', 'Frame loadout'], ['cb', 'Operator console']]) {
    const el = byId(id); el.tabIndex = -1; el.setAttribute('role', 'region'); el.setAttribute('aria-label', label);
  }
  function viewName() {
    return ({ login: 'ACCESS ROUTER', chassis: 'FRAME ASSEMBLY', main: 'LOADOUT BUILDER',
      sortie: 'LIVE SORTIE', intel: 'SORTIE TERMINAL', mechanic: 'SERVICE BAY', catalog: 'CATALOGUE',
      catalogEdit: 'CATALOGUE EDITOR', mpw: 'SHARED TABLE ACCESS', pw: 'DIRECTORATE ACCESS',
      researchPw: 'RESEARCH ACCESS', deny: 'ACCESS DENIED', lock: 'TERMINAL LOCKED' })[S.view] || 'FORGE TERMINAL';
  }
  function paneHead(id, title, meta) {
    const parent = byId(id);
    let head = parent.querySelector(':scope > .pane-head');
    if (!head) { head = create('div', 'pane-head'); parent.prepend(head); }
    head.replaceChildren(create('span', '', title), create('span', 'dim', meta));
  }
  function decorateRows() {
    document.querySelectorAll('.row[onclick]:not([data-menu])').forEach(el => {
      el.tabIndex = 0; el.setAttribute('role', 'button'); el.dataset.uxRow = '1';
    });
    document.querySelectorAll('.tabs button, .catalog-tabs button').forEach(el => {
      if (el.classList.contains('on')) el.setAttribute('aria-current', 'page');
    });
    const version = byId('ver');
    version.tabIndex = 0; version.setAttribute('role', 'button'); version.setAttribute('aria-label', 'Open version ' + APP_VERSION + ' changelog');
  }
  function filterSheets() {
    const query = sheetQuery.toLocaleLowerCase().trim();
    let matches = 0;
    document.querySelectorAll('#bar .stab').forEach(el => {
      const name = el.querySelector('.stn')?.textContent || el.querySelector('input')?.value || '';
      const owners = [...el.querySelectorAll('.asg')].map(owner => owner.textContent).join(' ');
      const show = !query || (name + ' ' + owners).toLocaleLowerCase().includes(query);
      el.hidden = !show; if (show) matches++;
    });
    const count = byId('sheetCount');
    if (count) count.textContent = query ? matches + ' / ' + S.sheets.length + ' MATCH' : S.sheets.length + ' SHEET' + (S.sheets.length === 1 ? '' : 'S');
    const empty = byId('sheetEmpty'); if (empty) empty.hidden = matches > 0;
  }
  function decorateSheets() {
    const tabs = document.querySelector('#bar .stabs'); if (!tabs || tabs.parentElement.querySelector('.sheet-tools')) return;
    const tools = create('div', 'sheet-tools');
    const count = create('span', 'dim'); count.id = 'sheetCount'; count.setAttribute('aria-live', 'polite'); tools.append(count);
    if (S.sheets.length > 3) {
      const search = create('input'); search.id = 'sheetQuery'; search.type = 'search'; search.placeholder = 'Find sheet / owner'; search.value = sheetQuery;
      search.setAttribute('aria-label', 'Filter encounter sheets by name or owner');
      search.addEventListener('input', () => { sheetQuery = search.value; filterSheets(); });
      search.addEventListener('keydown', e => {
        if (e.key === 'Escape') { e.stopPropagation(); sheetQuery = ''; search.value = ''; filterSheets(); }
      }); tools.append(search);
    }
    tabs.before(tools);
    const empty = create('span', 'dim', 'No matching sheets. Clear the search to show the encounter.'); empty.id = 'sheetEmpty'; empty.hidden = true; tabs.after(empty);
    filterSheets();
  }
  function crawlFrameLine() {
    if (S.view !== 'sortie' || busy) return;
    document.querySelectorAll('#sh .sline').forEach(line => {
      let track = line.querySelector(':scope > .ux-line-text');
      if (!track) {
        const copy = create('span', 'ux-line-copy'); copy.append(...line.childNodes);
        track = create('span', 'ux-line-text'); track.append(copy); line.append(track);
        line.classList.add('ux-line-crawl'); line.title = copy.textContent.replace(/\s+/g, ' ').trim();
      }
      const source = track.firstElementChild, width = source.getBoundingClientRect().width;
      const overflows = width > line.clientWidth + 2;
      line.classList.toggle('is-crawling', overflows);
      if (!overflows) { [...track.children].slice(1).forEach(el => el.remove()); return; }
      let gap = track.querySelector('.ux-line-gap');
      if (!gap) {
        gap = create('span', 'ux-line-gap', '   //   '); gap.setAttribute('aria-hidden', 'true');
        const duplicate = source.cloneNode(true); duplicate.setAttribute('aria-hidden', 'true');
        track.append(gap, duplicate);
      }
      const distance = width + gap.getBoundingClientRect().width;
      track.style.setProperty('--ux-crawl-distance', -distance + 'px');
      track.style.setProperty('--ux-crawl-duration', Math.max(10, distance / 30).toFixed(1) + 's');
    });
  }
  const originalShCrawl = shCrawl;
  shCrawl = function () { const result = originalShCrawl.apply(this, arguments); requestAnimationFrame(crawlFrameLine); return result; };
  window.addEventListener('resize', () => requestAnimationFrame(crawlFrameLine));
  function restorePendingFocus() {
    if (!pendingFocus) return;
    if (pendingFocus.view !== S.view) { pendingFocus = null; return; }
    let target = pendingFocus.id ? byId(pendingFocus.id) : [...document.querySelectorAll('[data-ux-row]')].find(el => el.getAttribute('onclick') === pendingFocus.action);
    if (!target) return;
    target.focus({ preventScroll: true });
    if (pendingFocus.selection && target.setSelectionRange) {
      try { target.setSelectionRange(...pendingFocus.selection); } catch (_) {}
    }
    pendingFocus = null;
  }
  function enhance() {
    scheduled = false;
    document.body.dataset.view = S.view;
    if (lastView !== S.view) { lastView = S.view; sheetQuery = ''; }
    if (S.view === 'sortie') {
      document.querySelectorAll('#con > .pane-head, #sh > .pane-head').forEach(el => el.remove());
    } else {
      paneHead('con', '01 // ' + viewName(), 'CORE EMPIRE / R+D-117');
      paneHead('sh', S.view === 'login' ? '02 // TERMINAL BRIEFING' : '02 // FRAME LOADOUT', 'LIVE PREVIEW');
    }
    decorateRows(); decorateSheets(); restorePendingFocus(); crawlFrameLine();
  }
  function schedule() { if (!scheduled) { scheduled = true; queueMicrotask(enhance); } }
  const render = R;
  R = function () {
    const active = document.activeElement;
    if (lastView !== S.view) pendingFocus = null;
    if (lastView === S.view && active && active.closest('#wrap')) {
      if (['catq', 'fid', 'sheetQuery'].includes(active.id)) {
        pendingFocus = { view: S.view, id: active.id, selection: typeof active.selectionStart === 'number' ? [active.selectionStart, active.selectionEnd] : null };
      } else if (active.dataset.uxRow) pendingFocus = { view: S.view, action: active.getAttribute('onclick') };
    }
    const result = render.apply(this, arguments); schedule(); return result;
  };
  // play() inserts rows asynchronously; watching its insertion covers animated navigation too.
  const observer = new MutationObserver(schedule);
  observer.observe(byId('out'), { childList: true });
  observer.observe(byId('sh'), { childList: true });
  observer.observe(byId('bar'), { childList: true, subtree: false });
  document.addEventListener('keydown', e => {
    const active = document.activeElement;
    if (!active || e.ctrlKey || e.metaKey || e.altKey) return;
    if ((active.dataset.uxRow || active.id === 'ver') && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault(); e.stopImmediatePropagation(); active.click();
    }
  }, true);
  document.addEventListener('contextmenu', e => e.preventDefault());
  enhance();
})();
