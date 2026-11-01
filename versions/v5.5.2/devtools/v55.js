/* ===== FORGE-OS 5.5: Overseer feedback pass 2 ===== */
/* Heat: two separate toggles. SKILL MOD Heat (pilot.hx) -> skills + active defenses; targeter Heat (thx, per weapon) -> attacks */
const tgHeat=()=>pNum('thx')==1?2:0;
function setHeatX(on){S.pilot=S.pilot||{};S.pilot.hx=on?'1':'0';audioEvent(on?'ok':'panelClose');note('[ -- ] SKILL HEAT '+(on?'+2 SET :: added to skills and active defenses':'CLEARED'),'dim','HEAT');R()}
function setTgHeat(on){S.pilot=S.pilot||{};S.pilot.thx=on?'1':'0';audioEvent(on?'ok':'panelClose');note('[ -- ] TARGETER HEAT '+(on?'+2 SET :: added to attacks with this weapon':'CLEARED'),'dim','HEAT');R()}
const hxBtn=(on,fn,tip)=>`<span class=hxw onclick="event.stopPropagation()"><button type=button class="hxbtn${on?' on':''}" aria-pressed=${on?'true':'false'} title="${tip}" onclick="event.stopPropagation();${fn}(${on?'false':'true'})">[HEAT]</button>${on?'<b class="n-gd hxv">+2</b>':''}</span>`;
hxBox=()=>hxBtn(heatX()>0,'setHeatX','Heat: +2 to skill rolls and active defenses (Dodge, Parry, Block, Turn Blow). Attacks use the targeter Heat.');
const tgHxBtn=()=>hxBtn(tgHeat()>0,'setTgHeat','Heat: +2 to attacks with this weapon (shown in TOTAL MOD). Skills and defenses use the SKILL MOD Heat.');
/* All-Out Attack: one button; the description only shows on hover */
aoaCtl=function(w){w=w||awW();if(!w)return'';const a=aoaNow(),tip=a?'All-Out Attack ('+aoaLab(a)+'): '+aoaTip(a,w)+' // NO ACTIVE DEFENSE this turn. Click to switch it off; right-click or Shift+F10 to choose the type.':'Click: All-Out Attack ('+aoaLab(aoaPick(w))+'): '+aoaTip(aoaPick(w),w)+'. Right-click or Shift+F10: choose the type. Any All-Out Attack removes your active defenses.';return`<button type=button class="aoabtn${a?' on':''}" data-menu=aoa aria-haspopup=menu aria-pressed=${a?'true':'false'} onclick="event.stopPropagation();aoaToggle()" title="${esc(tip)}">[ALL-OUT ATTACK: ${a?aoaLab(a):'OFF'} \u25be]</button>`};
/* Targeter: ACC, Heat and All-Out Attack share one line */
const _tni55=tgtNoteInner;tgtNoteInner=function(){const h=_tni55.apply(this,arguments),k=h.indexOf('</button>')+9;return'<span class=tgline>'+h.slice(0,k)+tgHxBtn()+aoaCtl(awW())+'</span>'+h.slice(k)};
/* Targeter dropdown: click the selected weapon again to close it; one open at a time */
const tgClosed=()=>!!(UI.tgc||{})[awKey()];
tgtDrop=function(i){const w=awW();if(!w||tgClosed()||weapons().indexOf(S.items[i])!==awK())return'';return`<div class=tgdrop role=region aria-label="Targeter for ${esc(wName(w))}" onclick="event.stopPropagation()"><div class=tgdh><span class=tgdt>\u2514 TARGETER // ${esc(wName(w))}</span><span id=sitsum class=dim>${sitSum()}</span></div>${tgtGrid()}</div>`};
itemClick=function(i){const x=S.items[i];if(!x)return;const k=weapons().indexOf(x);if(S.view!='sortie'||k<0)return;UI.tgc=UI.tgc||{};if(awK()===k&&!UI.tgc[awKey()]){UI.tgc[awKey()]=1;audioEvent('panelClose')}else{delete UI.tgc[awKey()];awBind(k)}uiSave();R();const el=document.querySelector(`[data-item="${i}"]`);if(el)el.focus({preventScroll:true})};
/* Per-weapon targeter settings, saved with the sheet (S.tgw) */
const TGK=['rng','spd','cov','mod','tsm','acc','aoa','aoal','thx'],TG0={cov:'0',acc:'0',aoa:'0',thx:'0'};
const tgSlot=w=>String(w.n)+'|'+(w.mount||'');
function tgSave(){try{const w=awW();if(!w||!S.pilot)return;S.tgw=S.tgw&&typeof S.tgw=='object'?S.tgw:{};const o={n:Math.floor(+S.dmgN||1)};TGK.forEach(k=>{o[k]=S.pilot[k]==null?'':String(S.pilot[k])});S.tgw[tgSlot(w)]=o}catch(e){}}
function tgLoad(w){S.pilot=S.pilot||{};const o=(S.tgw||{})[tgSlot(w)]||{};TGK.forEach(k=>{S.pilot[k]=o[k]!=null&&o[k]!==''?o[k]:(TG0[k]||'')});S.dmgN=Math.max(1,Math.floor(+o.n||1))}
const _awB55=awBind;awBind=function(k){const w=weapons()[k],cur=awW();if(w&&cur!==w){tgSave();tgLoad(w)}return _awB55.apply(this,arguments)};
const _pl55=pilotLive;pilotLive=function(){const r=_pl55.apply(this,arguments);if(S.view=='sortie')tgSave();return r};
const _R55=R;R=function(){if(S.view=='sortie')tgSave();return _R55.apply(this,arguments)};
/* Table: no tab menu on someone else's unit (players); the host keeps every tab */
const _tmo55=tabMenuOpen;tabMenuOpen=function(t){if(t&&typeof window.mpCanMenu==='function'&&!window.mpCanMenu(t.dataset.uid))return;return _tmo55.apply(this,arguments)};
/* VENT: base heat vented per vent action; fail = VENT, success = max(VENT + 1, VENT + degrees of success); degrees in steps of 1 */
const ventAmt=(ok,ds)=>{const v=Math.max(1,ventBase());return ok?Math.max(v+1,v+(ds||0)):v};
heatVent=function(){if(!heatCap())return;if(heatNow()<=0){audioEvent('fail');return reject('[FAIL] VENT DENIED :: heat is already at zero.')}const v=Math.max(1,ventBase());
 skillRoll('ENGINEERING ('+pilTag()+') :: VENT HEAT','full|eng',ds=>{const t=tel(),b=heatNow(),amt=ventAmt(true,ds);pushUndo('VENT HEAT');t.heat=Math.max(0,b-amt);return'VENTED '+Math.min(amt,b)+' HEAT (VENT '+v+' + '+(ds||0)+' DEGREE'+(ds==1?'':'S')+' OF SUCCESS, MINIMUM '+(v+1)+') :: HEAT '+t.heat+'/'+heatCap()+(heatZone()?' :: '+ZONE_TXT[heatZone()]:'')},1,'VENT',null,()=>{const t=tel(),b=heatNow(),amt=ventAmt(false);pushUndo('VENT HEAT');t.heat=Math.max(0,b-amt);return'VENT FAILED :: VENT '+amt+' HEAT SHED :: HEAT '+t.heat+'/'+heatCap()})};
