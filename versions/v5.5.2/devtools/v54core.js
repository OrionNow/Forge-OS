/* ===== v5.3.0 basic pass: item right-click menu, weapon-bound targeter, one-button All-Out Attack / Defense ===== */
/* ---- one context-menu component (the v5.2 sheet-tab menu, generalized): items {l,tip,run,on,dis} ---- */
let MENU_BACK=null;
function ctxClose(refocus){const m=$('tabmenu');if(!m)return;m.remove();const f=MENU_BACK;MENU_BACK=null;if(refocus&&f){try{const el=f();if(el)el.focus()}catch(e){}}}
function ctxOpen(anchor,title,items,x,y,back){ctxClose(false);if(!anchor||!items.length)return;MENU_BACK=back||(()=>anchor);
 const m=document.createElement('div');m.id='tabmenu';m.className='tabmenu';m.setAttribute('role','menu');m.setAttribute('aria-label',title);
 m.innerHTML=`<div class=tmh aria-hidden=true>${esc(title)}</div>`+items.map((it,i)=>it.sep?'<div class=tms aria-hidden=true></div>':`<button type=button role=${it.on!=null?'menuitemradio':'menuitem'} ${it.on!=null?`aria-checked=${!!it.on}`:''} data-i=${i} title="${esc(it.tip||it.l)}" ${it.dis?'aria-disabled=true class=dis':''}>${it.on?'\u25cf ':it.on!=null?'\u25cb ':''}${esc(it.l)}</button>`).join('');
 document.body.appendChild(m);const r=anchor.getBoundingClientRect(),bx=m.getBoundingClientRect();let L=x!=null?x:r.left,T=y!=null?y:r.bottom+2;if(L+bx.width>innerWidth-8)L=innerWidth-bx.width-8;if(T+bx.height>innerHeight-8)T=Math.max(8,(y!=null?y:r.top)-bx.height-2);m.style.left=Math.max(8,L)+'px';m.style.top=Math.max(8,T)+'px';
 m.addEventListener('click',e=>{const b=e.target.closest('button[data-i]');if(!b)return;e.stopPropagation();const it=items[+b.dataset.i];if(it.dis){audioEvent('fail');if(it.why)reject('[FAIL] '+it.why);return}ctxClose(true);it.run()});
 m.addEventListener('keydown',e=>{const bs=[...m.querySelectorAll('button')],i=bs.indexOf(document.activeElement);if(e.key==='Escape'||e.key==='Tab'){e.preventDefault();e.stopPropagation();ctxClose(true)}else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();e.stopPropagation();bs[(i+(e.key==='ArrowDown'?1:bs.length-1))%bs.length].focus()}else if(e.key==='Home'||e.key==='End'){e.preventDefault();bs[e.key==='Home'?0:bs.length-1].focus()}});
 audioEvent('panelOpen');const f=m.querySelector('button[aria-checked=true]')||m.querySelector('button');if(f)f.focus()}
function tabMenuClose(refocus){ctxClose(refocus)}
function tabMenuOpen(t,x,y){if(!t)return;const acts=[...t.querySelectorAll('[data-act]')],on=t.classList.contains('on'),key=tabKey(t),items=[];
 items.push(on?{l:'Cycle outline color',tip:'Cycle the tab outline color (also themes the paper doll)',run:()=>tabMenuRun(key,'go')}:{l:'Switch to this sheet',tip:'Make this the active sheet',run:()=>tabMenuRun(key,'go')});
 acts.forEach(a=>items.push({l:a.dataset.label||a.textContent,tip:a.title||a.dataset.label||'',run:()=>tabMenuRun(key,a.dataset.act)}));
 ctxOpen(t,((t.querySelector('.stn')||{}).textContent||'SHEET').trim(),items,x,y,()=>tabFind(key))}
function tabMenuRun(key,act){const t=tabFind(key);if(!t)return;if(act==='go'){t.click();return}const el=t.querySelector(`[data-act="${act}"]`);if(!el)return;
 if(act==='assign'&&typeof mpAssign==='function'){mpAssign({stopPropagation(){},preventDefault(){},currentTarget:t},t.dataset.uid);return}el.click()}
const MENUS={item:(el,x,y)=>itemMenu(+el.dataset.item,el,x,y),aoa:(el,x,y)=>aoaMenu(el,x,y),def:(el,x,y)=>defMenu(el,x,y)};
const menuBack=sel=>()=>document.querySelector(sel);
document.addEventListener('contextmenu',e=>{const t=e.target&&e.target.closest&&e.target.closest('[data-menu]');if(!t||e.target.closest('input,select'))return;const f=MENUS[t.dataset.menu];if(!f)return;e.preventDefault();f(t,e.clientX,e.clientY)});
document.addEventListener('keydown',e=>{const ae=document.activeElement;if(!ae||!ae.dataset||!ae.dataset.menu)return;if(e.key==='ContextMenu'||(e.shiftKey&&e.key==='F10')){e.preventDefault();e.stopImmediatePropagation();MENUS[ae.dataset.menu](ae);return}
 if(ae.dataset.menu==='item'&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.stopImmediatePropagation();itemClick(+ae.dataset.item)}},true);
/* ---- items: left-click a weapon binds the targeter; right-click = Info + hand/station ---- */
function itemClick(i){const x=S.items[i];if(!x)return;const k=weapons().indexOf(x);if(S.view!='sortie'||k<0)return;awBind(k);R();const el=document.querySelector(`[data-item="${i}"]`);if(el)el.focus({preventScroll:true})}
function itemMenu(i,el,x,y){const it=S.items[i];if(!it)return;const items=[],k=weapons().indexOf(it);
 if(S.view=='sortie'&&k>=0)items.push({l:awK()===k?'Targeter bound to this weapon':'Open targeter for this weapon',tip:'Bind the targeter and All-Out Attack to '+it.n+' (same as left-click)',run:()=>itemClick(i)});
 items.push({l:'Info',tip:'Open the catalogue entry for '+it.n,run:()=>sheetOpen(i)});
 if(isMech()&&it.c=='U'){const cur=normalizeUH(it.hardpoint)||defaultUH(it);items.push({sep:1});['BACK','LEGS'].forEach(o=>items.push({l:'Hardpoint: '+o,on:cur===o,tip:'Mount this utility on the '+o.toLowerCase()+' hardpoint',run:()=>setHardpoint(i,o)}))}
 else if(isMech()&&mountable(it)){const opts=isShield(it)?['LH','RH','BL','BR']:it.th?['BH','BL','BR']:['LH','RH','BL','BR'];items.push({sep:1});
  items.push({l:'Station: none (stowed)',on:!it.mount,tip:'Release the station; the item is carried but not held',run:()=>setMount(i,'')});
  opts.forEach(o=>items.push({l:'Station: '+SL[o]+(mountBlocked(i,o)?' (swap)':''),on:it.mount===o,tip:mountBlocked(i,o)?'Occupied: selecting it swaps the two items':'Hold or mount it at '+SL[o],run:()=>setMount(i,o)}))}
 ctxOpen(el,it.n,items,x,y,menuBack(`[data-item="${i}"]`))}
function mountTag(i){const x=S.items[i];if(!x||!isMech())return'';if(x.c=='U')return'';if(!mountable(x))return'';return`<span class="mtag${x.mount?'':' dim'}" title="Station. Right-click the item to change it.">${x.mount?SL[x.mount]:'STOWED'}</span>`}
/* ---- active weapon (local to this seat, one per sheet). The targeter, RoF max and All-Out Attack follow it ---- */
const awKey=()=>{const sh=S.sheets&&S.sheets[S.cur];return sh&&sh.uid?'u'+sh.uid:'i'+(S.cur||0)};
function awK(){const a=(UI.aw||{})[awKey()];if(!a)return -1;const W=weapons();if(W[a.k]&&W[a.k].n===a.n)return a.k;const j=W.findIndex(w=>w.n===a.n);return j}
const awW=()=>{const k=awK();return k>=0?weapons()[k]:null};
const rofMax=()=>{const w=awW();return !w?30:hasRng(w)?Math.min(30,wRof(w)):1};
const rofEffNow=()=>{const w=awW();return w?effRof(w):Math.max(1,Math.floor(+S.dmgN||1))};
function rofClamp(v){return Math.max(1,Math.min(rofMax(),Math.floor(+v||1)))}
function awBind(k,quiet){const w=weapons()[k];if(!w)return;const was=awK();UI.aw=UI.aw||{};UI.aw[awKey()]={k,n:w.n};UI.sh.TG=true;
 const n0=Math.floor(+S.dmgN||1),n1=rofClamp(n0);if(n1!==n0)S.dmgN=n1;
 const a=aoaNow();let msg='';if(a&&!aoaValid(w).includes(a)){S.pilot.aoa='0';msg=' // ALL-OUT ATTACK ('+AOA[a][1]+') CLEARED: not valid for this weapon'}
 if(was!==k&&isMech()&&!w.mount&&mountable(w)){const h=weapons().find(x=>x!==w&&x.n===w.n&&x.mount);note('[ !! ] STOWED COPY :: this '+esc(w.n)+' is not held, so it cannot attack'+(h?'; the held copy is at '+esc(wStn(h)):'')+'. Right-click the row to assign a station.','warn','TARGETER')}
 if(was!==k&&!quiet)note('[ -- ] TARGETER BOUND :: '+esc(wName(w))+' // RoF MAX '+rofMax()+(n1!==n0?' // RoF '+n0+' -> '+n1:'')+msg,msg?'warn':'dim','TARGETER');else if(msg)note('[ -- ]'+msg,'warn','AOA')}
const awTitle=()=>{const w=awW();return w?' // '+esc(wName(w)):''};
function tgtBody(){const w=awW();if(!w)return`<div class="tgv tghint" onclick="event.stopPropagation()"><span class=dim>${weapons().length?'No weapon selected :: left-click a weapon in ARMAMENT to open its targeter under it.':'No weapons in this loadout.'}</span></div>`;
 return tgtGrid()+aoaCtl(w)}
/* ---- All-Out Attack (B365): one button, right-click for the type. Melee: Determined/Double/Feint/Strong/Long; ranged: Determined, Suppression if ROF 5+ ---- */
const aoaValid=w=>!w?[]:hasRng(w)?[1].concat(wRof(w)>=5?[6]:[]):[1,2,3,4,5];
const aoaLab=v=>v==1?'DETERMINED':AOA[v][1];
function aoaTip(v,w){if(v==1)return w&&hasRng(w)?'Determined: +1 to hit at range':'Determined: +4 to hit in melee';return AOA[v][2]}
function aoaCtl(w){const a=aoaNow(),dis=false;return`<div class=aoactl onclick="event.stopPropagation()"><button type=button class="aoabtn${a?' on':''}" data-menu=aoa aria-haspopup=menu aria-pressed=${a?'true':'false'} onclick="aoaToggle()" title="${a?'All-Out Attack ('+aoaLab(a)+') is set: click to switch it off. ':'Click: All-Out Attack ('+aoaLab(aoaPick(w))+'). '}Right-click or Shift+F10: choose the type. Any All-Out Attack removes your active defenses.">[ALL-OUT ATTACK: ${a?aoaLab(a):'OFF'} \u25be]</button> <span class=dim>${a?esc(aoaTip(a,w))+' // <b class=bad>NO ACTIVE DEFENSE</b>':'right-click to choose the type'+(dis?' // All-Out Defense is set':'')}</span></div>`}
function aoaPick(w){const v=Math.floor(pNum('aoal')||0),ok=aoaValid(w);return ok.includes(v)?v:1}
function aoaToggle(){const w=awW();if(aoaNow())return setAoa(0);setAoa(aoaPick(w))}
function aoaMenu(el,x,y){const w=awW();if(!w)return;const a=aoaNow(),items=[{l:'Off (normal attack)',on:!a,tip:'Normal attack: active defenses allowed',run:()=>setAoa(0)}];
 aoaValid(w).forEach(v=>items.push({l:aoaLab(v)+(v==1?(hasRng(w)?' (+1 ranged)':' (+4 melee)'):''),on:a===v,tip:aoaTip(v,w),run:()=>setAoa(v)}));
 ctxOpen(el,'ALL-OUT ATTACK // '+w.n,items,x,y,menuBack('.aoabtn'))}
function setAoa(v){S.pilot=S.pilot||{};v=Math.floor(+v||0);const w=awW();
 if(v&&!w){audioEvent('fail');return reject('[FAIL] ALL-OUT ATTACK :: left-click a weapon first; the option depends on the weapon.')}
 if(v&&!aoaValid(w).includes(v)){audioEvent('fail');return reject('[FAIL] ALL-OUT ATTACK ('+AOA[v][1]+') IS NOT VALID FOR '+esc(w.n)+(v==6?' :: Suppression Fire needs a weapon rated ROF 5 or more.':hasRng(w)?' :: ranged weapons take Determined or Suppression Fire.':' :: melee weapons take Determined, Double, Feint, Strong or Long.'))}
 let extra='';if(v==6&&Math.floor(+S.dmgN||1)<5){S.dmgN=5;extra=' // TARGETER RoF SET TO 5'}
 S.pilot.aoa=String(v);if(v)S.pilot.aoal=String(v);audioEvent(v?'ok':'panelClose');
 note(v?'[ -- ] ALL-OUT ATTACK ('+aoaLab(v)+') :: '+esc(aoaTip(v,w))+' :: NO ACTIVE DEFENSE UNTIL CLEARED'+extra:'[ -- ] ALL-OUT ATTACK CLEARED :: ACTIVE DEFENSES AVAILABLE',v?'warn':'dim','AOA');R()}
function sitSum(){const a=aoaNow(),w=awW(),ab=a==1&&w?aoaHit(w):0;return`<span title="range/speed + cover + size + RoF bonus (capped at the weapon ROF) + roll mod${ab?' + All-Out Attack (Determined)':''}">TOTAL MOD <b class=n-gd>${sg(tgtTotal()+ab)}</b>${a?` <b class=warn>AOA ${aoaLab(a)}${ab?' '+sg(ab):''}</b>`:''}</span>`}
/* ---- defense: one button (type on right-click), Retreat (B366). Stored as numbers in S.pilot ---- */
function defKinds(){const W=weapons(),SH=shields(),usable=x=>!wDisabled(x)&&(!isMech()||heldIn(x)),r=[{c:0,i:-1,l:'DODGE',spec:'dod|pil',kind:'dod',roll:()=>dodgeRoll(),tip:'Dodge: half Piloting + HND (+3 with Retreat, plus the heat-zone bonus)'}];
 if(isMech())r.push({c:1,i:-1,l:'TURN BLOW',spec:'def|pil',kind:'tb',roll:()=>turnBlowRoll(),tip:'Turn Blow: on a success the pilot picks the hit location of the incoming attack'});
 W.forEach((w,k)=>{if(/MELEE/.test(wLab(w))&&usable(w))r.push({c:2,i:k,l:'PARRY '+w.n,spec:'def|'+wKey(w),kind:'pry',roll:()=>parryRoll(k),tip:'Parry with '+w.n+': half weapon skill + HND'})});
 SH.forEach((x,k)=>{if(usable(x))r.push({c:3,i:k,l:'BLOCK '+x.n,spec:'def|'+wKey(x),kind:'blk',roll:()=>blockRoll(k),tip:'Block with '+x.n+': half shield skill + HND'})});return r}
function defCur(){const K=defKinds(),c=Math.floor(pNum('dft')||0),i=pNum('dfw');return K.find(d=>d.c===c&&(d.i<0||d.i===i))||K.find(d=>d.c===c)||K[0]}
const kindOfK=k=>k==='pil'?'tb':shields().some(x=>wKey(x)===k)?'blk':'pry';
/* v5.4: All-Out Defense removed; old sheets may still carry pilot.aod / aodl, which are ignored */
const defMods=k=>(pNum('ret')==1?1:0);
const DEFK={dod:'DODGE',tb:'TURN BLOW',pry:'PARRY',blk:'BLOCK'};
function defCtl(){const a=aoaNow(),d=defCur(),off=a?'disabled title="No active defense: All-Out Attack is set this turn"':'',sl=s=>`<span class=dim data-sl="${s}" title="${esc(slBreak(s))}">${slTxt(s)}</span>`;
 return`<span class=dfctl onclick="event.stopPropagation()"><span class=dfb><button type=button class=defbtn data-menu=def aria-haspopup=menu onclick="defRoll()" ${off||`title="${esc(d.tip)}. Click: roll it. Right-click or Shift+F10: choose Dodge, Turn Blow, Parry or Block."`}>[${DEFK[d.kind]||esc(d.l)} \u25be]</button>${sl(d.spec)}</span>`
 +`<label class="fxchk rtr" title="Retreat: +3 to Dodge, +1 to Parry, Block and Turn Blow">RETREAT<input type=checkbox ${pNum('ret')==1?'checked':''} ${a?'disabled':''} onchange="togRetreat(this.checked)"><span class=bx></span></label>`
 +(a?' <b class=bad>NO ACTIVE DEFENSE (ALL-OUT ATTACK)</b>':'')+`</span>`}
function defRoll(){if(aoaNow()){audioEvent('fail');return reject('[FAIL] NO ACTIVE DEFENSE :: All-Out Attack is set this turn; switch it off in the TARGETER first.')}defCur().roll()}
function defMenu(el,x,y){if(aoaNow())return;const d=defCur(),items=defKinds().map(k=>({l:k.l,on:k.c===d.c&&k.i===d.i,tip:k.tip,run:()=>{S.pilot.dft=String(k.c);S.pilot.dfw=String(Math.max(0,k.i));audioEvent('ok');note('[ -- ] DEFENSE SET :: '+esc(k.l),'dim','DEFENSE');R()}}));
 ctxOpen(el,'ACTIVE DEFENSE',items,x,y,menuBack('.defbtn'))}
const rowAw=i=>S.view=='sortie'&&awK()>=0&&weapons().indexOf(S.items[i])===awK();
function rowTip(i){const x=S.items[i];if(!x)return'';const w=S.view=='sortie'&&weapons().includes(x);return esc((w?'Left-click: open the targeter for '+x.n+'. ':'')+'Right-click or Shift+F10: Info'+(isMech()&&(mountable(x)||x.c=='U')?' and station':'')+'.')}
/* ---- console (v5.3 addendum): commands start with '/', anything else is table chat; compact roll cards ---- */
const PRE_VIEWS=['login','pw','researchPw','mpw','deny','lock'];
const _exec53=exec;
exec=function(raw){const t=String(raw==null?'':raw).trim();if(!t)return;if(!S.role||PRE_VIEWS.includes(S.view))return _exec53(t.replace(/^\//,''));
 if(t[0]!=='/'){chatShow('LOCAL','',t);if(!G().chatTold){G().chatTold=1;chatNote('[ -- ] NOT LINKED :: text without / is table chat; it stays on this screen. Commands start with / (try /help).')}return}
 const c=t.slice(1).trim();if(c)return _exec53(c)};
const colOk=c=>/^#[0-9a-fA-F]{6}$/.test(c||'')||/^var\(--[a-z-]+\)$/.test(c||'')?c:'';
function logAppend(d){const log=$('log');if(!log)return;log.appendChild(d);while(log.children.length>LOGCAP)log.removeChild(log.firstChild);log.scrollTop=log.scrollHeight}
function chatNote(m){const d=document.createElement('div');d.className='dim';d.dataset.k='sys';d.textContent=m;logAppend(d)}
function chatShow(name,color,text){const d=document.createElement('div'),c=colOk(color)||'var(--fg)';d.className='chat';d.dataset.k='chat';d.dataset.ts=logTs();
 const a=document.createElement('span');a.className='chn';a.style.color=c;a.textContent=String(name||'?')+': ';const b=document.createElement('span');b.className='cht';b.style.color=c;b.textContent=String(text||'').slice(0,500);d.append(a,b);logAppend(d);try{audioEvent('outLine')}catch(e){}}
const RC=new Map();
let _rcN=0;const rcId=()=>{const b=new Uint32Array(2);crypto.getRandomValues(b);return 'rc'+b[0].toString(36)+b[1].toString(36).slice(0,4)+(++_rcN).toString(36)};
function rcWho(){try{if(typeof window.mpWho==='function'){const w=window.mpWho();if(w&&w.u)return w}}catch(e){}return{u:'LOCAL',c:'',id:'local'}}
function rcNew(a,r,o,d){const w=rcWho();let f='';try{f=idline()}catch(e){}return{id:rcId(),u:w.u,c:w.c,by:w.id||'local',f,a,r,o,d}}
function rcSum(rc){return`<span class=rcu style="color:${colOk(rc.c)||'var(--cyan)'}">${esc(rc.u)}</span><span class=dim> / </span><span class=rcf>${esc(rc.f)}</span><span class=dim> \u00b7 </span><span class=rca>${esc(rc.a)}</span><span class=dim> \u00b7 </span><b class=rcr>${esc(rc.r)}</b>`}
function rcHtml(rc){return`<div class="rc ${safeT(rc.o)}" data-rcid="${esc(rc.id)}" tabindex=0 role=button aria-expanded=false title="Click, Enter or Space: show the individual rolls">${rcSum(rc)} <span class=rcx aria-hidden=true>[+]</span></div>`}
const safeT=o=>['ok','bad','warn','dim'].includes(o)?o:'dim';
function rcDetails(rc){const d=document.createElement('div');d.className='rcd';d.id='rcd-'+rc.id;(rc.d||[]).forEach(t=>{const l=document.createElement('div');l.textContent=String(t);d.appendChild(l)});return d}
function rcRefresh(id){const rc=RC.get(id);if(!rc)return false;const els=[...document.querySelectorAll(`#log .rc[data-rcid="${id}"]`)];els.forEach(el=>{el.innerHTML=rcSum(rc)+` <span class=rcx aria-hidden=true>${el.getAttribute('aria-expanded')==='true'?'[-]':'[+]'}</span>`;el.className='rc '+safeT(rc.o);if(el.getAttribute('aria-expanded')==='true'){const o=el.nextElementSibling;if(o&&o.classList.contains('rcd'))o.replaceWith(rcDetails(rc))}});return els.length>0}
function rcToggle(el){const rc=RC.get(el.dataset.rcid);if(!rc)return;const open=el.getAttribute('aria-expanded')==='true',nx=el.nextElementSibling;if(open){if(nx&&nx.classList.contains('rcd'))nx.remove();el.setAttribute('aria-expanded','false')}else{{const dd=rcDetails(rc);el.after(dd);try{dd.scrollIntoView({block:'nearest'})}catch(e){}}el.setAttribute('aria-expanded','true');el.setAttribute('aria-controls','rcd-'+rc.id)}const x=el.querySelector('.rcx');if(x)x.textContent=open?'[+]':'[-]';try{audioEvent(open?'panelClose':'panelOpen')}catch(e){}}
function rcEmit(rc,up){RC.set(rc.id,rc);if(up){rcRefresh(rc.id)}else say(rcHtml(rc),rc.o);try{if(typeof window.mpCard==='function')window.mpCard(rc,!!up)}catch(e){}}
/* remote cards arrive as data (never HTML); every string is escaped on render */
/* v5.3.1: a card can only be rewritten by its author. `by` is the server-set seat id (actorId), never a client field. */
function rcRemote(d,actor,color,unit,by){if(!d||typeof d!=='object'||!/^rc[a-z0-9]{1,20}$/.test(d.id||''))return'';const s=(v,n)=>String(v==null?'':v).slice(0,n);
 const rc={id:d.id,u:s(actor,40),c:colOk(color),by:s(by,64),f:s(d.f||unit,80),a:s(d.a,160),r:s(d.r,80),o:safeT(d.o),d:Array.isArray(d.d)?d.d.slice(0,40).map(x=>s(x,300)):[]};
 const had=RC.get(rc.id);
 if(had){if(!rc.by||had.by!==rc.by)return null;if(d.up){RC.set(rc.id,rc);rcRefresh(rc.id)}return null}
 RC.set(rc.id,rc);return rcHtml(rc)}
/* v5.3.1 race fix: a card queued behind the typewriter is drawn from the latest RC entry when it reaches the log */
const _lp53=logPost;logPost=function(d){const out=_lp53.apply(this,arguments);try{d.querySelectorAll('.rc[data-rcid]').forEach(el=>{const rc=RC.get(el.dataset.rcid);if(rc){el.innerHTML=rcSum(rc)+' <span class=rcx aria-hidden=true>[+]</span>';el.className='rc '+safeT(rc.o)}})}catch(e){}return out};
/* v5.3.1: two copies of one weapon are told apart by station */
function wTwin(w){return!!w&&weapons().filter(x=>x!==w&&x.n===w.n).length>0}
const wStn=w=>w&&w.mount?SL[w.mount]||w.mount:'STOWED';
const wName=w=>w?w.n+(wTwin(w)?' ['+wStn(w)+']':''):'';
const _isCrit=(tot,sl)=>tot<=4||(tot==5&&sl>=15)||(tot==6&&sl>=16)?'CRIT SUCCESS':(tot==18||(tot==17&&sl<=15)||tot-sl>=10)?'CRIT FAIL':'';
function rollCard53(label,spec,r,tot,sl,ok,marg,res){const q=spec.split('|'),crit=_isCrit(tot,sl),parts=String(label).split(' :: ');let a,rr,k=-1,w=null;
 if(q[0]=='atk'){k=+q[2];w=weapons()[k];a=w?wName(w):parts.slice(1).join(' ');const h=(S.hitq||{})[k]||{};rr=ok?(h.n||1)+' HIT'+(h.n==1?'':'S'):'MISS'}
 else{a=parts.map(x=>x.replace(/\s*\((MOD|RETREAT|HEAT|ALL-OUT|DOUBLE)[^)]*\)/g,'')).filter(Boolean).join(' \u00b7 ');const m=/(\d+) DEGREES? OF (SUCCESS|FAILURE)/.exec(res);const d=m?+m[1]:marg;rr=ok?'+'+d+' DoS':'-'+d+' DoF'}
 if(crit)rr=crit+' \u00b7 '+rr;
 const det=['ROLL: '+String(label).replace(/<[^>]*>/g,''),'3d6 ['+r.join(', ')+'] = '+tot+' vs SL '+sl+(crit?' ('+crit+')':''),(ok?'SUCCESS':'FAILURE')+' BY '+marg];
 String(res).replace(/^(SUCCESS|FAILURE) by \d+( :: )?/,'').split(' :: ').filter(Boolean).forEach(x=>det.push(x.replace(/<[^>]*>/g,'')));
 const rc=rcNew(a,rr,ok?'ok':'bad',det);if(q[0]=='atk'&&w&&S.hitq&&S.hitq[k])S.hitq=Object.assign({},S.hitq,{[k]:Object.assign({},S.hitq[k],{c:rc.id})});rcEmit(rc)}
function dmgCard53(w,cid,n,mult,sb,atk,why){const tot=atk.reduce((s,a)=>s+a.total,0),lines=atk.map((a,j)=>'DAMAGE'+(atk.length>1?' '+(j+1)+'/'+atk.length:'')+': '+n+'d6'+(mult>1?' x '+mult:'')+' = ['+a.rolls.join(', ')+'] = '+a.sum+(sb?' +'+sb+' STRONG':'')+' -> '+a.total);
 if(atk.length>1)lines.push('TOTAL DAMAGE: '+tot);if(why)lines.unshift('DAMAGE ROLLS: '+String(why).replace(/<[^>]*>/g,''));
 const old=cid&&RC.get(cid);if(old){old.d=old.d.concat(lines);old.r=old.r.replace(/ \u00b7 DMG .*$/,'')+' \u00b7 '+dmgList(atk);rcEmit(old,true);return}
 rcEmit(rcNew(wName(w)+' DAMAGE',dmgList(atk),'dim',lines))}
/* v5.4: the collapsed line lists every shot (DMG 7, 9, 4); the total stays in the details */
function dmgList(atk){const v=atk.map(a=>a.total);let t='DMG '+v.join(', ');if(t.length>62){let k=v.length;while(k>1&&('DMG '+v.slice(0,k).join(', ')+' \u2026 ('+v.length+')').length>62)k--;t='DMG '+v.slice(0,k).join(', ')+' \u2026 ('+v.length+')'}return t}
document.addEventListener('click',e=>{const el=e.target&&e.target.closest&&e.target.closest('#log .rc');if(el){e.stopPropagation();rcToggle(el)}},true);
document.addEventListener('keydown',e=>{const el=document.activeElement;if(el&&el.classList&&el.classList.contains('rc')&&el.closest('#log')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.stopImmediatePropagation();rcToggle(el)}},true);
