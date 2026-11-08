/* FORGE-OS 5.5.3: presentation and navigation only.
   Existing command, component and multiplayer handlers remain authoritative. */
(function () {
  'use strict';
  const storageKey = 'forgeUi553';
  const smallScreen = matchMedia('(max-width: 900px)');
  let prefs = { density: 'compact', effects: true };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (saved.density === 'roomy') prefs.density = 'roomy';
    if (saved.effects === false) prefs.effects = false;
  } catch (_) { /* A private browser can still use all controls. */ }
  let pane = 'workspace', lastView = '', sheetQuery = '', pendingFocus = null;
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
  function button(text, label, run, className = '') {
    const el = create('button', className, text);
    el.type = 'button'; el.title = label; el.setAttribute('aria-label', label);
    el.addEventListener('click', e => { e.stopPropagation(); run(el); });
    return el;
  }
  const toolbar = create('div', 'uxbar'); toolbar.id = 'uxbar';
  const context = create('span', 'ux-context'); toolbar.append(context);
  const nav = create('nav', 'ux-panes'); nav.setAttribute('aria-label', 'Terminal panels');
  const paneLabels = { workspace: 'WORKSPACE', sheet: 'LOADOUT', console: 'CONSOLE' };
  for (const [name, label] of Object.entries(paneLabels)) {
    const el = button(label, 'Show ' + label.toLowerCase() + ' panel', () => setPane(name, true));
    el.dataset.pane = name; el.setAttribute('aria-controls', { workspace: 'con', sheet: 'sh', console: 'cb' }[name]);
    nav.append(el);
  }
  toolbar.append(nav);
  const display = button('[DISPLAY ▾]', 'Display options: density and terminal effects', openDisplay);
  display.id = 'uxDisplay'; display.setAttribute('aria-haspopup', 'menu'); toolbar.append(display);
  const helpButton = button('[HELP]', 'Show help for the current screen', () => {
    help.hidden = !help.hidden; helpButton.setAttribute('aria-expanded', String(!help.hidden));
  });
  helpButton.id = 'uxHelp'; helpButton.setAttribute('aria-expanded', 'false'); helpButton.setAttribute('aria-controls', 'uxhelp');
  toolbar.append(helpButton);
  const help = create('div', 'ux-help'); help.id = 'uxhelp'; help.hidden = true;
  help.setAttribute('role', 'region'); help.setAttribute('aria-label', 'Help for this screen');
  document.querySelector('#wrap > header').after(toolbar, help);

  function applyDisplay() {
    document.body.dataset.density = prefs.density;
    document.body.classList.toggle('ux-reduced', !prefs.effects);
    try { localStorage.setItem(storageKey, JSON.stringify(prefs)); } catch (_) {}
  }
  function openDisplay(anchor) {
    ctxOpen(anchor, 'DISPLAY OPTIONS', [
      { l: 'Compact controls', on: prefs.density === 'compact', run: () => { prefs.density = 'compact'; applyDisplay(); } },
      { l: 'Roomy controls', on: prefs.density === 'roomy', tip: 'Larger controls with more spacing', run: () => { prefs.density = 'roomy'; applyDisplay(); } },
      { sep: true },
      { l: 'Terminal effects', on: prefs.effects, tip: 'Typing and scanlines; reduced-motion system preferences still apply', run: () => { prefs.effects = true; applyDisplay(); } },
      { l: 'Reduced effects', on: !prefs.effects, tip: 'Immediate text, still readouts and no scanlines', run: () => { prefs.effects = false; applyDisplay(); } }
    ]);
  }
  const originalReducedMotion = reducedMotion;
  reducedMotion = function () { return !prefs.effects || originalReducedMotion(); };
  applyDisplay();

  function setPane(name, focus) {
    pane = name;
    document.body.dataset.pane = pane;
    for (const el of nav.children) el.setAttribute('aria-pressed', String(el.dataset.pane === pane));
    if (focus && smallScreen.matches) {
      const target = byId({ workspace: 'con', sheet: 'sh', console: 'CI' }[pane]);
      target.focus({ preventScroll: true });
      toolbar.scrollIntoView({ block: 'start' });
    }
  }
  for (const [id, label] of [['con', 'Workspace'], ['sh', 'Frame loadout'], ['cb', 'Operator console']]) {
    const el = byId(id); el.tabIndex = -1; el.setAttribute('role', 'region'); el.setAttribute('aria-label', label);
  }
  function viewName() {
    return ({ login: 'ACCESS ROUTER', chassis: 'FRAME ASSEMBLY', main: 'LOADOUT BUILDER',
      sortie: 'LIVE SORTIE', intel: 'SORTIE TERMINAL', mechanic: 'SERVICE BAY', catalog: 'CATALOGUE',
      catalogEdit: 'CATALOGUE EDITOR', mpw: 'SHARED TABLE ACCESS', pw: 'DIRECTORATE ACCESS',
      researchPw: 'RESEARCH ACCESS', deny: 'ACCESS DENIED', lock: 'TERMINAL LOCKED' })[S.view] || 'FORGE TERMINAL';
  }
  function helpText() {
    if (S.view === 'login') return 'BUILD A SHEET // Choose GUEST. EDIT A MANIFEST // Choose MECHANIC. RUN AN ENCOUNTER // Choose IMPERIAL INTELLIGENCE for solo play, or LIVE DATA INTERCEPT for a shared table. Tab moves between choices; Enter or Space selects.';
    if (S.view === 'chassis') return 'ASSEMBLE // Select a frame, reactor, thruster and targeting system, then confirm. The loadout preview updates as you choose. INFO opens the record without selecting it. Tab, Enter and Space work on every choice.';
    if (S.view === 'main') return 'BUILD // Browse Armament, Defense and Utility. Click a record to install it; INFO opens its full dossier. Search by name, class or tag. Set a designation, then SAVE / COMPILE MANIFEST to download the sheet.';
    if (S.view === 'sortie') return 'ENCOUNTER // Select a component on the paper doll or in TARGET, enter incoming damage and its armor divisor, then APPLY. ACTIONS opens repair controls. Click a weapon to open its targeter. Gold ATK / DMG marks a ready roll. Small ▾ buttons open additional options. UNDO reverses the last change. On a shared table, use / before console commands; plain text is chat.';
    if (S.view === 'catalog' || S.view === 'catalogEdit') return 'CATALOGUE // Search to find a record. NEW COMPONENT starts an entry; EDIT opens an existing one. Save each record, then export the catalogue or build a package to keep your changes.';
    return 'TERMINAL // Import a saved .txt frame manifest to continue. The loadout panel shows the current sheet; the console holds rolls and commands. DISPLAY changes control spacing and terminal effects.';
  }
  function updateContext() {
    document.body.dataset.view = S.view;
    context.textContent = '// ' + viewName();
    help.textContent = helpText();
    nav.querySelector('[data-pane=sheet]').textContent = S.view === 'login' ? 'BRIEFING' : 'LOADOUT';
    if (lastView !== S.view) {
      // A navigation action always reveals its destination on a narrow display.
      setPane('workspace', false); lastView = S.view; sheetQuery = '';
    } else setPane(pane, false);
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
  function addMenuButton(anchor, label, run) {
    if (anchor.dataset.uxMenu) return;
    anchor.dataset.uxMenu = '1';
    const el = button('[▾]', label, () => run(anchor), 'ux-menu');
    el.setAttribute('aria-haspopup', 'menu');
    anchor.after(el);
  }
  function decorateMenus() {
    document.querySelectorAll('button[data-menu]').forEach(anchor => {
      const kind = anchor.dataset.menu;
      const names = { aoa: 'Maneuver options', def: 'Choose active defense', evl: 'Evaluate options', rsm: 'Rapid Strike options', dmg: 'Damage roll options' };
      if (names[kind] && MENUS[kind]) addMenuButton(anchor, names[kind], el => MENUS[kind](el));
    });
    document.querySelectorAll('.row[data-menu=item]').forEach(row => {
      if (row.querySelector('.ux-item-menu')) return;
      const name = row.querySelector('.nm'); if (!name) return;
      const menu = button('[▾]', 'Equipment options for ' + name.textContent, () => MENUS.item(row), 'ux-menu ux-item-menu');
      menu.setAttribute('aria-haspopup', 'menu'); name.after(menu);
    });
  }
  function decorateDamage() {
    const box = document.querySelector('.damagebox'); if (!box || box.querySelector('.damage-target')) return;
    const target = create('div', 'damage-target');
    const label = create('label', '', 'TARGET // '), select = create('select'); select.id = 'uxDamageTarget';
    select.setAttribute('aria-label', 'Incoming damage target');
    locs().forEach((name, i) => { const option = create('option', '', dn(name)); option.value = String(i); select.append(option); });
    select.value = String(S.dmg.loc || 0);
    select.addEventListener('change', () => {
      pendingFocus = { view: S.view, id: 'uxDamageTarget' };
      selectDamageTarget(+select.value);
    });
    label.append(select); target.append(label);
    const actions = button('[ACTIONS ▾]', 'Repair or apply damage to the selected component', () => {
      const part = document.querySelector('.mlab[data-loc="' + (+S.dmg.loc || 0) + '"]');
      if (part) MENUS.part(part);
    });
    actions.setAttribute('aria-haspopup', 'menu'); target.append(actions); box.prepend(target);
    byId('dmgIn').setAttribute('aria-label', 'Incoming damage before armor');
    const divisor = box.querySelector('input[type=number]:not(#dmgIn)');
    if (divisor) divisor.setAttribute('aria-label', 'Armor divisor');
  }
  function prioritizeChecks() {
    const pilot = document.querySelector('.pilot');
    const checks = pilot && pilot.querySelector(':scope > .pbot');
    // During play, common checks stay above the less frequent skill setup.
    if (checks && pilot.firstElementChild !== checks) pilot.prepend(checks);
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
    const active = tabs.querySelector('.stab.on');
    if (active && !document.body.classList.contains('mp-view')) {
      const menu = button('[SHEET ACTIONS ▾]', 'Actions for the active sheet', () => tabMenuOpen(tabs.querySelector('.stab.on')));
      menu.id = 'sheetMenu'; menu.setAttribute('aria-haspopup', 'menu'); tools.append(menu);
    }
    tabs.before(tools);
    const empty = create('span', 'dim', 'No matching sheets. Clear the search to show the encounter.'); empty.id = 'sheetEmpty'; empty.hidden = true; tabs.after(empty);
    filterSheets();
  }
  function restorePendingFocus() {
    if (!pendingFocus) return;
    if (pendingFocus.view !== S.view) { pendingFocus = null; return; }
    let target = pendingFocus.id ? byId(pendingFocus.id) : [...document.querySelectorAll('[data-ux-row]')].find(el => el.getAttribute('onclick') === pendingFocus.action);
    if (!target) return;
    if (smallScreen.matches && target.closest(pane === 'workspace' ? '#rt' : '#con')) { pendingFocus = null; return; }
    target.focus({ preventScroll: true });
    if (pendingFocus.selection && target.setSelectionRange) {
      try { target.setSelectionRange(...pendingFocus.selection); } catch (_) {}
    }
    pendingFocus = null;
  }
  function enhance() {
    scheduled = false;
    updateContext();
    paneHead('con', S.view === 'sortie' ? '01 // TELEMETRY & IMPACT' : '01 // ' + viewName(), S.view === 'sortie' ? 'SELECT · RESOLVE · ROLL' : 'CORE EMPIRE / R+D-117');
    paneHead('sh', S.view === 'login' ? '02 // TERMINAL BRIEFING' : '02 // FRAME LOADOUT', S.view === 'sortie' ? 'EQUIPMENT & TARGETERS' : 'LIVE PREVIEW');
    decorateRows(); decorateMenus(); decorateDamage(); prioritizeChecks(); decorateSheets(); restorePendingFocus();
  }
  function schedule() { if (!scheduled) { scheduled = true; queueMicrotask(enhance); } }
  const render = R;
  R = function () {
    const active = document.activeElement;
    if (lastView !== S.view) pendingFocus = null;
    if (lastView === S.view && active && active.closest('#wrap')) {
      if (['catq', 'fid', 'sheetQuery', 'uxDamageTarget'].includes(active.id)) {
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
  smallScreen.addEventListener('change', () => setPane(pane, false));
  enhance();
})();
