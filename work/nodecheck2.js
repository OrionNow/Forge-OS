const fs=require('fs');const h=fs.readFileSync('terminal.html','utf8');
const grab=re=>h.match(re)[0].replace(/^const (\w+)=/,"globalThis.$1=").replace(/^function (\w+)/,"globalThis.$1=function");
eval(grab(/const safeField=.*?;\};/s));eval(grab(/const frameOK=.*?;/s));eval(grab(/function rebuildDB\(raw\)\{.*?\}\)\}/s));eval(grab(/const statsOK=.*?;/s));
const isShield=x=>/SHIELD/.test(x.n);
const raw=fs.readFileSync(process.argv[2],'utf8').trim();const db=rebuildDB(raw);let bad=[];
db.forEach(x=>{const fields=['n','s','t','xl','x','r','f'];for(const k of fields){if(x[k]&&!safeField(x[k]))bad.push(x.n+' unsafe '+k)}
 if(!statsOK(x.s))bad.push(x.n+' statsOK');if(x.c=='F'&&!frameOK(x.s))bad.push(x.n+' frameOK');if(isNaN(x.e))bad.push(x.n+' EP');
 if(x.c=='D'&&/(^| )HP:\d/.test(x.s)&&!isShield(x))bad.push(x.n+' not a shield by isShield');});
const T=JSON.parse('{'+(process.argv[3]?fs.readFileSync(process.argv[3],'utf8'):'')+'}');
for(const [k,v] of Object.entries(T)){if(!db.find(x=>x.n==k))bad.push('tier name '+k);v.forEach(t=>{if(!statsOK(t[1]))bad.push(k+' tier statsOK');t.slice(1).forEach(s=>{if(!safeField(String(s)))bad.push(k+' tier unsafe')})})}
console.log('lines',db.length,'tiers',Object.keys(T).length,'shields',db.filter(x=>x.c=='D'&&isShield(x)).map(x=>x.n).join('; '),'rejects',bad.length,bad);
