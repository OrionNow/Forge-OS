/* ===== FORGE-OS 5.4: Overseer feedback pass ===== */
/* Heat checkbox: +2 to every roll, shown in TOTAL MOD */
const heatX=()=>pNum('hx')==1?2:0;
function setHeatX(on){S.pilot=S.pilot||{};S.pilot.hx=on?'1':'0';audioEvent(on?'ok':'panelClose');note('[ -- ] HEAT '+(on?'+2 SET :: added to every roll and to TOTAL MOD':'CLEARED'),'dim','HEAT');R()}
const hxBox=()=>`<label class="fxchk hxchk" title="Heat: +2 to every roll (shown in TOTAL MOD)" onclick="event.stopPropagation()">HEAT +2<input type=checkbox ${pNum('hx')==1?'checked':''} onchange="setHeatX(this.checked)"><span class=bx></span></label>`;
/* Targeter: a dropdown panel under the selected weapon's row */
function tgtDrop(i){const w=awW();if(!w||weapons().indexOf(S.items[i])!==awK())return'';return`<div class=tgdrop role=region aria-label="Targeter for ${esc(wName(w))}" onclick="event.stopPropagation()"><div class=tgdh><span class=tgdt>\u2514 TARGETER // ${esc(wName(w))}</span><span id=sitsum class=dim>${sitSum()}</span></div>${tgtGrid()}<div class=tgdx>${hxBox()}${aoaCtl(w)}</div></div>`}
/* Repair buttons (moved out of the removed selected-component box into IMPACT RESOLUTION) */
function repBtns(t){const i=+S.dmg.loc,m=maxOf(i)||1,v=t.hp[i];return`<span class=selbtns><button type=button onclick="repairComp(${i})" title="Repair the component selected on the paper doll" ${v>=m&&!(sacElig(i)&&t.sac[i])?'disabled':''}>[REPAIR]</button><button type=button onclick="repairAll()" title="Repair every component" ${t.hp.every((h,j)=>h>=(maxOf(j)||1))&&!(hasSac()&&t.sac.some(Boolean))?'disabled':''}>[REPAIR ALL]</button></span>`}
/* Frame ID only: old ID / MODEL pairs are joined into one Frame ID */
function fidJoin(...a){return a.map(x=>String(x==null?'':x).trim()).filter(x=>x&&x!=='PENDING').join(' ').slice(0,48)}
const _R54=R;R=function(){if(S.cs){S.id=fidJoin(S.id,S.cs);S.cs=''}return _R54.apply(this,arguments)};
/* Console filter: show only load-bearing lines (rolls, results, damage, chat, errors, command output) */
function toggleLF(){UI.lf=UI.lf?0:1;applyUI();uiSave();audioEvent(UI.lf?'panelOpen':'panelClose')}
const _applyUI54=applyUI;applyUI=function(){const r=_applyUI54.apply(this,arguments);const c=$('cb');if(c)c.classList.toggle('lf',!!UI.lf);const b=$('lfBtn');if(b){b.textContent=UI.lf?'[DATA ONLY]':'[ALL LINES]';b.setAttribute('aria-pressed',UI.lf?'true':'false');b.title=UI.lf?'Showing only load-bearing lines (rolls, results, damage, chat, errors, command output). Click to show flavor text too.':'Showing every line. Click to hide flavor text (boot sequences, progress bars, [SYS] chatter).'}return r};
applyUI();
