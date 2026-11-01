/* ===== FORGE-OS 5.5.1: Overseer feedback pass 3 ===== */
const vo551=()=>typeof window.mpViewOnly==='function'&&!!window.mpViewOnly();
/* Melee Evaluate: +1 by default, right-click +1/+2/+3; saved per weapon with the targeter */
TGK.push('evl','evn');TG0.evl='0';
const evN=()=>Math.min(3,Math.max(1,Math.floor(pNum('evn')||1)));
const evBon=w=>w&&!hasRng(w)&&pNum('evl')==1?evN():0;
function setEval(on){S.pilot=S.pilot||{};S.pilot.evl=on?'1':'0';audioEvent(on?'ok':'panelClose');note('[ -- ] EVALUATE '+(on?'+'+evN()+' SET :: added to this melee attack':'CLEARED'),'dim','EVALUATE');R()}
function setEvalN(n){S.pilot=S.pilot||{};S.pilot.evn=String(n);S.pilot.evl='1';audioEvent('ok');note('[ -- ] EVALUATE +'+n+' SET :: added to this melee attack','dim','EVALUATE');R()}
function evMenu(el,x,y){const w=awW();if(!w)return;const on=pNum('evl')==1,n=evN();ctxOpen(el,'EVALUATE // '+w.n,[{l:'Off',on:!on,tip:'No Evaluate bonus',run:()=>setEval(false)}].concat([1,2,3].map(v=>({l:'+'+v,on:on&&n===v,tip:'Evaluate: +'+v+' to this melee attack',run:()=>setEvalN(v)}))),x,y,menuBack('.evbtn'))}
MENUS.evl=(el,x,y)=>evMenu(el,x,y);
const evBtn=()=>{const on=pNum('evl')==1,n=evN();return`<button type=button class="accbtn evbtn${on?' on':''}" data-menu=evl aria-haspopup=menu aria-pressed=${on?'true':'false'} title="Evaluate: +${n} to this melee attack. Right-click or Shift+F10: choose +1, +2 or +3." onclick="event.stopPropagation();setEval(${on?'false':'true'})">[EVALUATE +${n} \u25be]</button>`};
const accBtn=()=>{const on=pNum('acc')==1;return`<button type=button class="accbtn${on?' on':''}" title="add each weapon's ACC to its attack SL" onclick="togAcc()">ACC</button>`};
/* Targeter control row: ACC (Evaluate for melee), Heat, All-Out Attack only; no descriptive text */
tgtNoteInner=function(){const w=awW();if(!w)return'';return'<span class=tgline>'+(hasRng(w)?accBtn():evBtn())+tgHxBtn()+aoaCtl(w)+'</span>'};
/* Accuracy tile is the targeter header, shown even at +0 */
function tgTile(w){const g=S.core&&S.core.G,off=g?!headOK():false,mel=!hasRng(w),t=g?tgtBonus(w):0,a=mel?evBon(w):(pNum('acc')==1?accOf(w):0),b=t+a,v=b>=0?'+'+b:String(b);return`<span id=tgtile class="chip tgtile ${b>0?'pos':b<0?'neg':'zero'}" title="${mel?'Melee: targeting bonus + Evaluate':'Targeting bonus at this range'+(pNum('acc')==1?' + weapon ACC':'')}">${b>0?'\u25b2':b<0?'\u25bc':'\u25cf'} ${esc(w.n)} ${a?`<b class=accgold title="includes ${sg(a)} ${mel?'evaluate':'accuracy'}">${v}</b>`:v}${off?' <span class=bad>OFFLINE // head disabled</span>':''}</span>`}
tgtDrop=function(i){const w=awW();if(!w||tgClosed()||weapons().indexOf(S.items[i])!==awK())return'';return`<div class=tgdrop role=region aria-label="Targeter for ${esc(wName(w))}" onclick="event.stopPropagation()"><div class=tgdh><span class=tgdt>\u2514 ${tgTile(w)}</span><span id=sitsum class=dim>${sitSum()}</span></div>${tgtGrid()}</div>`};
const _pl551=pilotLive;pilotLive=function(){const r=_pl551.apply(this,arguments);const e=document.getElementById('tgtile'),w=awW();if(e&&w)e.outerHTML=tgTile(w);return r};
/* Heat toggles auto-tick: a roll with a section's Heat on adds +1 heat and switches that Heat off */
function heatTick(why){const cap=heatCap(),t=tel();if(!cap||!t)return;const b=heatNow();t.heat=Math.min(cap,b+1);say('[ -- ] HEAT +1 :: '+esc(why)+' used the Heat toggle (now off) :: HEAT '+t.heat+'/'+cap+(heatZone()?' :: '+ZONE_TXT[heatZone()]:''),'warn')}
const _sr551=skillRoll;skillRoll=function(label,spec){const q=String(spec||'').split('|'),k=q[0]=='atk'?'thx':'hx',on=(k=='thx'?tgHeat():heatX())>0&&slOf(spec)!=null;const r=_sr551.apply(this,arguments);if(on&&S.pilot){S.pilot[k]='0';heatTick(k=='thx'?'ATTACK':'SKILL ROLL');R()}return r};
/* Viewers of another unit: no local targeter writes; All-Out Attack follows the owner's active weapon live */
const _tgS551=tgSave;tgSave=function(){if(vo551())return;_tgS551();const w=awW();if(w&&S.tgw)S.tgw._a=tgSlot(w)};
const _R551=R;R=function(){if(vo551()){const o=S.tgw&&S.tgw._a&&S.tgw[S.tgw._a];S.pilot=S.pilot||{};S.pilot.aoa=o&&o.aoa?o.aoa:'0';S.pilot.aoal=o&&o.aoal?o.aoal:'';S.pilot.mna=o&&o.mna?o.mna:'0'}return _R551.apply(this,arguments)};
/* Log: stay pinned to the bottom when a line grows (DMG fold, wrapping) if the reader was at the bottom */
(function(){const lg=document.getElementById('log');if(!lg||typeof MutationObserver!=='function')return;let pin=true;lg.addEventListener('scroll',()=>{pin=lg.scrollHeight-lg.scrollTop-lg.clientHeight<48},{passive:true});const go=()=>{if(pin)lg.scrollTop=lg.scrollHeight};new MutationObserver(()=>{go();requestAnimationFrame(go)}).observe(lg,{childList:true,subtree:true,characterData:true});if(typeof ResizeObserver==='function')new ResizeObserver(go).observe(lg)})();
/* Move and Attack (B365): a maneuver in the All-Out Attack menu, so it replaces any All-Out Attack */
TGK.push('mna','rs','rsn');TG0.mna='0';TG0.rs='0';
const mnaOn=()=>pNum('mna')==1;
const mnaPen=w=>!w||!mnaOn()?0:hasRng(w)?-2:-4;
function setMna(on){S.pilot=S.pilot||{};const w=awW();if(on&&!w){audioEvent('fail');return reject('[FAIL] MOVE AND ATTACK :: left-click a weapon first.')}S.pilot.mna=on?'1':'0';if(on)S.pilot.aoa='0';const d=defCur();audioEvent(on?'ok':'panelClose');note(on?'[ -- ] MOVE AND ATTACK :: '+(hasRng(w)?'ranged -2':'melee -4, skill max 9')+' :: DODGE OR BLOCK ONLY (no Parry, no Turn Blow)':'[ -- ] MOVE AND ATTACK CLEARED',on?'warn':'dim','MOVE+ATK');R()}
const _setAoa551=setAoa;setAoa=function(v){if(S.pilot)S.pilot.mna='0';return _setAoa551.apply(this,arguments)};
const _aoaT551=aoaToggle;aoaToggle=function(){if(mnaOn())return setMna(false);return _aoaT551.apply(this,arguments)};
aoaMenu=function(el,x,y){const w=awW();if(!w)return;const a=aoaNow(),m=mnaOn(),items=[{l:'Off (normal attack)',on:!a&&!m,tip:'Normal attack: active defenses allowed',run:()=>setAoa(0)}];
 aoaValid(w).forEach(v=>items.push({l:aoaLab(v)+(v==1?(hasRng(w)?' (+1 ranged)':' (+4 melee)'):''),on:a===v&&!m,tip:aoaTip(v,w),run:()=>setAoa(v)}));
 items.push({l:'Move and Attack ('+(hasRng(w)?'-2 ranged':'-4 melee, max 9')+')',on:m,tip:'Move and Attack (B365): full move and attack. Ranged -2; melee -4 with skill max 9. Dodge or Block only.',run:()=>setMna(true)});
 ctxOpen(el,'ALL-OUT ATTACK // '+w.n,items,x,y,menuBack('.aoabtn'))};
const _aoaCtl551=aoaCtl;aoaCtl=function(w){w=w||awW();if(!w)return'';if(!mnaOn())return _aoaCtl551.call(this,w);return`<button type=button class="aoabtn on mnabtn" data-menu=aoa aria-haspopup=menu aria-pressed=true onclick="event.stopPropagation();aoaToggle()" title="Move and Attack: ${hasRng(w)?'ranged -2':'melee -4, skill max 9'}; Dodge or Block only. Click to switch it off; right-click or Shift+F10 to choose.">[MOVE+ATK ${mnaPen(w)} \u25be]</button>`};
const _dk551=defKinds;defKinds=function(){const r=_dk551.apply(this,arguments);return mnaOn()?r.filter(d=>d.kind=='dod'||d.kind=='blk'):r};
const _sr551b=skillRoll;skillRoll=function(label,spec){const q=String(spec||'').split('|');if(q[0]=='def'&&mnaOn()&&kindOfK(q[1])!=='blk'){audioEvent('fail');return reject('[FAIL] NO '+(q[1]==='pil'?'TURN BLOW':'PARRY')+' :: Move and Attack allows Dodge or Block only.')}return _sr551b.apply(this,arguments)};
const _ss551=sitSum;sitSum=function(){const h=_ss551.apply(this,arguments),w=awW(),t=[];if(w&&mnaOn())t.push('MOVE+ATK '+mnaPen(w));if(w&&rsOn(w))t.push('RAPID STRIKE '+rsPen(w)+' \u00d72');return t.length?h.replace(/<\/span>$/,' <b class=warn>'+t.join(' / ')+'</b></span>'):h};
/* Rapid Strike (B370), melee only: -6 (right-click -6 or -3); RoF 2 while on */
const rsN=()=>pNum('rsn')==3?3:6;
const rsOn=w=>!!w&&!hasRng(w)&&pNum('rs')==1;
const rsPen=w=>rsOn(w)?-rsN():0;
function setRs(on,n){S.pilot=S.pilot||{};const w=awW();if(!w||hasRng(w))return;if(n)S.pilot.rsn=String(n);S.pilot.rs=on?'1':'0';S.dmgN=on?2:1;audioEvent(on?'ok':'panelClose');note(on?'[ -- ] RAPID STRIKE -'+rsN()+' :: two attacks this turn (RoF 2), each at -'+rsN():'[ -- ] RAPID STRIKE CLEARED :: RoF 1','dim','RAPID');R()}
function rsMenu(el,x,y){const w=awW();if(!w||hasRng(w))return;const on=pNum('rs')==1,n=rsN();ctxOpen(el,'RAPID STRIKE // '+w.n,[{l:'Off',on:!on,tip:'One attack',run:()=>setRs(false)},{l:'-6',on:on&&n===6,tip:'Rapid Strike: two attacks, each at -6',run:()=>setRs(true,6)},{l:'-3',on:on&&n===3,tip:'Rapid Strike: two attacks, each at -3 (Weapon Master or Trained by a Master)',run:()=>setRs(true,3)}],x,y,menuBack('.rsbtn'))}
MENUS.rsm=(el,x,y)=>rsMenu(el,x,y);
const rsBtn=()=>{const on=pNum('rs')==1,n=rsN();return`<button type=button class="accbtn rsbtn${on?' on':''}" data-menu=rsm aria-haspopup=menu aria-pressed=${on?'true':'false'} title="Rapid Strike: two melee attacks (RoF 2), each at -${n}. Right-click or Shift+F10: choose -6 or -3." onclick="event.stopPropagation();setRs(${on?'false':'true'})">[RAPID STRIKE -${n} \u25be]</button>`};
tgtNoteInner=function(){const w=awW();if(!w)return'';return'<span class=tgline>'+(hasRng(w)?accBtn():evBtn()+rsBtn())+tgHxBtn()+aoaCtl(w)+'</span>'};
