// Minimal in-memory stand-in for /api/forge, written ONLY for local testing of the client.
// It mimics the behaviour the client code implies (see SERVER-CONTRACT.md); it is NOT the real server.
const http=require('http'),fs=require('fs'),path=require('path');
const root=process.argv[2]||'.',port=+(process.argv[3]||8822);
const T={revision:0,sheets:[],members:[],rolls:[],seq:0,clearSeq:0,tokens:{}};
const now=()=>Date.now();
function view(you){const m=T.members.map(x=>({id:x.id,callsign:x.callsign,role:x.role,online:now()-x.seen<5000,place:x.place,color:x.color,focus:x.focus||null}));
 return{revision:T.revision,snapshot:{sheets:T.sheets,clearSeq:T.clearSeq},members:m,roster:[],hostOnline:m.some(x=>x.role==='host'&&x.online),rolls:T.rolls.slice(-40),you};}
function meBy(tok){return T.members.find(m=>m.token===tok)}
function handle(b){
 if(b.op==='enter'){const id='m'+(T.members.length+1),token='t'+Math.random().toString(36).slice(2);const role=T.members.length?'player':'host';const m={id,token,callsign:b.callsign,role,seen:now(),place:'Welcome'};T.members.push(m);return[200,{token,code:'TABLE',you:{id,role,callsign:b.callsign}}]}
 const me=meBy(b.token);if(!me)return[403,{error:'seat rejected'}];me.seen=now();
 if(b.op==='resume'){if(b.callsign)me.callsign=b.callsign;return[200,{code:'TABLE',you:{id:me.id,role:me.role,callsign:me.callsign}}]}
 if(b.op==='poll'){if(b.place)me.place=b.place;if(b.seatColor)me.color=b.seatColor;me.focus=b.focus||null;const v=view();if(!(b.since<T.revision)||b.since<0&&false)delete v.snapshot;if(b.since<0)v.snapshot={sheets:T.sheets,clearSeq:T.clearSeq};return[200,v]}
 if(b.op==='push'){if(b.baseRevision!==T.revision){return[409,view()]}
  const by=id=>T.sheets.find(s=>s.uid===id);
  for(const u of b.upserts||[])if(!by(u.uid))T.sheets.push(u);
  if(b.meta)T.sheets=b.meta.map(m=>Object.assign(by(m.uid)||{},m)).filter(s=>s.uid);
  for(const p of b.paints||[]){const s=by(p.uid);if(s)s.col=p.col}
  for(const r of b.rests||[]){const s=by(r.uid);if(s)s.d=Object.assign({},s.d||{},r.rest)}
  for(const st of b.states||[]){const s=by(st.uid);if(s&&s.d){s.d.tel=st.tel;s.d.undo=st.undo;s.d.stab=st.stab}}
  for(const im of b.impacts||[]){const s=by(im.uid);if(!s||!s.d||!s.d.tel)continue;const t=s.d.tel;t.hp[im.loc]=Math.max(im.floor,(t.hp[im.loc]||0)+im.delta);if(im.sacInc&&t.sac)t.sac[im.loc]=(t.sac[im.loc]||0)+im.sacInc;if(im.undo){s.d.undo=s.d.undo||[];s.d.undo.push(im.undo)}if(im.pop&&s.d.undo&&s.d.undo.length)s.d.undo.pop()}
  for(const d of b.drops||[])T.sheets=T.sheets.filter(s=>s.uid!==d);
  if(b.order){const m=new Map(T.sheets.map(s=>[s.uid,s]));T.sheets=b.order.map(i=>m.get(i)).filter(Boolean)}
  for(const l of b.logs||[])T.rolls.push(Object.assign({},l,{seq:++T.seq,actor:me.callsign,unit:(by(l.uid)||{}).name||'SORTIE'}));
  if(b.clear)T.clearSeq++;
  T.revision++;return[200,view()]}
 return[400,{error:'bad op'}]}
const types={'.html':'text/html','.js':'text/javascript','.woff2':'font/woff2','.png':'image/png','.txt':'text/plain'};
http.createServer((q,r)=>{const u=q.url.split('?')[0];
 if(u.endsWith('/api/forge')&&q.method==='POST'){let s='';q.on('data',c=>s+=c);q.on('end',()=>{let b={};try{b=JSON.parse(s)}catch(e){}const[c,o]=handle(b);r.writeHead(c,{'content-type':'application/json'});r.end(JSON.stringify(o))});return}
 if(u==='/__state'){r.writeHead(200,{'content-type':'application/json'});r.end(JSON.stringify(T));return}
 const f=path.join(root,u==='/'?'/terminal.html':u);fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return}r.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream'});r.end(d)})}).listen(port,()=>console.log('mock on',port));
