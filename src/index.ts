interface Env { DB:D1Database; AI:Ai; ASSETS:Fetcher; ADMIN_PASSWORD:string; SESSION_SECRET:string; AI_MODEL?:string }
const encoder=new TextEncoder();
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const now=()=>Date.now();
const uid=()=>crypto.randomUUID();
const cookie=(req:Request,name:string)=>(req.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1);
async function digest(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('')}
async function pbkdf(value:string,salt:string){const key=await crypto.subtle.importKey('raw',encoder.encode(value),'PBKDF2',false,['deriveBits']);return new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:100000,hash:'SHA-256'},key,256))}
function equal(a:Uint8Array,b:Uint8Array){let x=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)x|=(a[i]||0)^(b[i]||0);return x===0}
async function authenticated(req:Request,env:Env){const sid=cookie(req,'kira_session');if(!sid || !/^[a-f\d-]{36}$/.test(sid))return false;const row=await env.DB.prepare('SELECT id FROM sessions WHERE id=? AND expires_at>?').bind(await digest(sid),now()).first();return !!row}
async function body(req:Request):Promise<Record<string,any>>{if(Number(req.headers.get('content-length')||0)>30000)throw Error('Richiesta troppo grande');const obj=await req.json();if(!obj||typeof obj!=='object'||Array.isArray(obj))throw Error('JSON non valido');return obj as any}
const str=(v:unknown,max=4000)=>typeof v==='string'?v.trim().slice(0,max):'';
const matches=(s:string)=>/^[a-f\d-]{36}$/.test(s);
const cookieAttrs='Path=/; HttpOnly; Secure; SameSite=Strict';
async function route(req:Request,env:Env):Promise<Response>{
 const url=new URL(req.url);const p=url.pathname;const method=req.method;
 if(!env.ADMIN_PASSWORD||!env.SESSION_SECRET||env.SESSION_SECRET.length<32)return json({error:'Configurare ADMIN_PASSWORD e SESSION_SECRET nei secret Cloudflare.'},503);
 if(p==='/api/status')return json({configured:true,authenticated:await authenticated(req,env)});
 if(p==='/api/login'&&method==='POST'){
  const ip=req.headers.get('CF-Connecting-IP')||'unknown';const iphash=await digest(ip+env.SESSION_SECRET);const block=await env.DB.prepare('SELECT attempts,locked_until FROM attempts WHERE ip_hash=?').bind(iphash).first<{attempts:number;locked_until:number}>();
  if(block&&block.locked_until>now())return json({error:'Troppi tentativi. Riprovare tra 15 minuti.'},429);
  const payload=await body(req);const attempt=str(payload.password,250);const expected=await pbkdf(env.ADMIN_PASSWORD,env.SESSION_SECRET);const actual=await pbkdf(attempt,env.SESSION_SECRET);
  if(!equal(expected,actual)){
   const count=(block?.attempts||0)+1;await env.DB.prepare('INSERT INTO attempts (ip_hash,attempts,locked_until) VALUES (?,?,?) ON CONFLICT(ip_hash) DO UPDATE SET attempts=excluded.attempts,locked_until=excluded.locked_until').bind(iphash,count>=7?0:count,count>=7?now()+900000:0).run();
   return json({error:'Password non valida'},401);
  }
  await env.DB.prepare('DELETE FROM attempts WHERE ip_hash=?').bind(iphash).run();const token=uid();await env.DB.prepare('INSERT INTO sessions VALUES(?,?,?)').bind(await digest(token),now()+7*86400000,now()).run();
  const r=json({ok:true});r.headers.append('Set-Cookie',`kira_session=${token}; ${cookieAttrs}; Max-Age=604800`);return r;
 }
 if(!await authenticated(req,env))return json({error:'Accesso richiesto'},401);
 if(p==='/api/logout'&&method==='POST'){const sid=cookie(req,'kira_session');if(sid)await env.DB.prepare('DELETE FROM sessions WHERE id=?').bind(await digest(sid)).run();const r=json({ok:true});r.headers.append('Set-Cookie',`kira_session=; ${cookieAttrs}; Max-Age=0`);return r}
 if(p==='/api/dashboard'&&method==='GET'){
  const [projects,tasks,conversations,usage]=await Promise.all([
   env.DB.prepare('SELECT COUNT(*) n FROM projects').first<{n:number}>(),env.DB.prepare('SELECT COUNT(*) n FROM tasks WHERE done=0').first<{n:number}>(),env.DB.prepare('SELECT COUNT(*) n FROM conversations').first<{n:number}>(),env.DB.prepare('SELECT calls FROM usage_daily WHERE day=?').bind(new Date().toISOString().slice(0,10)).first<{calls:number}>()]);
  return json({projects:projects?.n||0,tasks:tasks?.n||0,conversations:conversations?.n||0,aiCallsToday:usage?.calls||0});
 }
 if(p==='/api/projects'&&method==='GET')return json((await env.DB.prepare('SELECT * FROM projects ORDER BY updated_at DESC LIMIT 100').all()).results);
 if(p==='/api/projects'&&method==='POST'){const b=await body(req),title=str(b.title,120);if(!title)return json({error:'Titolo obbligatorio'},400);const id=uid(),ts=now();await env.DB.prepare('INSERT INTO projects VALUES(?,?,?,?,?)').bind(id,title,str(b.description,1500),ts,ts).run();return json({id,title},201)}
 if(p.startsWith('/api/projects/')&&method==='DELETE'){const id=p.split('/')[3];if(!matches(id))return json({error:'ID non valido'},400);await env.DB.prepare('DELETE FROM projects WHERE id=?').bind(id).run();return json({ok:true})}
 if(p==='/api/memories'&&method==='GET')return json((await env.DB.prepare('SELECT * FROM memories ORDER BY created_at DESC LIMIT 100').all()).results);
 if(p==='/api/memories'&&method==='POST'){const b=await body(req),content=str(b.content,1800);if(!content)return json({error:'Inserisci il ricordo'},400);const id=uid();await env.DB.prepare('INSERT INTO memories VALUES(?,?,?)').bind(id,content,now()).run();return json({id},201)}
 if(p.startsWith('/api/memories/')&&method==='DELETE'){const id=p.split('/')[3];if(!matches(id))return json({error:'ID non valido'},400);await env.DB.prepare('DELETE FROM memories WHERE id=?').bind(id).run();return json({ok:true})}
 if(p==='/api/tasks'&&method==='GET')return json((await env.DB.prepare('SELECT * FROM tasks ORDER BY done ASC,created_at DESC LIMIT 100').all()).results);
 if(p==='/api/tasks'&&method==='POST'){const b=await body(req),title=str(b.title,200);if(!title)return json({error:'Titolo obbligatorio'},400);const id=uid();await env.DB.prepare('INSERT INTO tasks VALUES(?,?,0,?)').bind(id,title,now()).run();return json({id},201)}
 if(p.startsWith('/api/tasks/')&&method==='PATCH'){const id=p.split('/')[3],b=await body(req);if(!matches(id))return json({error:'ID non valido'},400);await env.DB.prepare('UPDATE tasks SET done=? WHERE id=?').bind(b.done?1:0,id).run();return json({ok:true})}
 if(p.startsWith('/api/tasks/')&&method==='DELETE'){const id=p.split('/')[3];if(!matches(id))return json({error:'ID non valido'},400);await env.DB.prepare('DELETE FROM tasks WHERE id=?').bind(id).run();return json({ok:true})}
 if(p==='/api/conversations'&&method==='GET')return json((await env.DB.prepare('SELECT * FROM conversations ORDER BY updated_at DESC LIMIT 100').all()).results);
 if(p==='/api/conversations'&&method==='POST'){const b=await body(req),id=uid(),ts=now();const projectId=str(b.project_id,40)||null;if(projectId&&!await env.DB.prepare('SELECT id FROM projects WHERE id=?').bind(projectId).first())return json({error:'Progetto inesistente'},404);await env.DB.prepare('INSERT INTO conversations VALUES(?,?,?,?,?)').bind(id,projectId,str(b.title,100)||'Nuova conversazione',ts,ts).run();return json({id},201)}
 if(p.startsWith('/api/conversations/')&&method==='GET'){const id=p.split('/')[3];if(!matches(id))return json({error:'ID non valido'},400);return json((await env.DB.prepare('SELECT * FROM messages WHERE conversation_id=? ORDER BY created_at ASC LIMIT 150').bind(id).all()).results)}
 if(p==='/api/artifacts'&&method==='GET'){const projectId=url.searchParams.get('project_id')||'';if(!matches(projectId))return json({error:'Progetto richiesto'},400);return json((await env.DB.prepare('SELECT * FROM artifacts WHERE project_id=? ORDER BY created_at DESC LIMIT 100').bind(projectId).all()).results)}
 if(p==='/api/artifacts'&&method==='POST'){
  const b=await body(req),projectId=str(b.project_id,40),filename=str(b.filename,120).replace(/[^\w.\-]/g,'_'),content=typeof b.content==='string'?b.content:'';
  if(!matches(projectId)||!filename||content.length>20000)return json({error:'Dati file non validi'},400);
  if(!await env.DB.prepare('SELECT id FROM projects WHERE id=?').bind(projectId).first())return json({error:'Progetto inesistente'},404);
  const version=Number((await env.DB.prepare('SELECT MAX(version) version FROM artifacts WHERE project_id=? AND filename=?').bind(projectId,filename).first<{version:number}>())?.version||0)+1;
  const id=uid();await env.DB.prepare('INSERT INTO artifacts VALUES(?,?,?,?,?,?,?)').bind(id,projectId,filename,content,'text',version,now()).run();return json({id,version},201);
 }
 if(p==='/api/chat'&&method==='POST'){
  const b=await body(req),prompt=str(b.message,4000),conversationId=str(b.conversation_id,40);
  if(!prompt||!matches(conversationId))return json({error:'Messaggio o conversazione non validi'},400);
  const conversation=await env.DB.prepare('SELECT * FROM conversations WHERE id=?').bind(conversationId).first<{id:string;project_id:string|null;title:string}>();if(!conversation)return json({error:'Conversazione inesistente'},404);
  const day=new Date().toISOString().slice(0,10);const used=await env.DB.prepare('SELECT calls FROM usage_daily WHERE day=?').bind(day).first<{calls:number}>();
  if((used?.calls||0)>=35)return json({error:'Limite prudenziale K.I.R.A. di 35 richieste AI al giorno raggiunto per proteggere il budget zero.'},429);
  const [history,memory,project]=await Promise.all([env.DB.prepare('SELECT role,content FROM messages WHERE conversation_id=? ORDER BY created_at DESC LIMIT 12').bind(conversationId).all<{role:string;content:string}>(),env.DB.prepare('SELECT content FROM memories ORDER BY created_at DESC LIMIT 15').all<{content:string}>(),conversation.project_id?env.DB.prepare('SELECT title,description FROM projects WHERE id=?').bind(conversation.project_id).first<{title:string;description:string}>():Promise.resolve(null)]);
  const system=`Sei K.I.R.A., partner personale di progettazione e sviluppo. Rispondi in italiano, con precisione, spirito critico e passi concreti. Non inventare risultati di strumenti e non dichiarare di aver creato file se non sono stati salvati. Per richieste di codice o documenti, produci contenuti effettivamente copiabili. Hai solo una chat testuale in questa versione: niente accesso diretto al computer, webcam, CAD o internet. Memorie autorizzate: ${memory.results.map(x=>x.content).join(' | ').slice(0,3200)}. ${project?`Progetto corrente: ${project.title}. ${project.description}`:''}`;
  await env.DB.prepare('INSERT INTO usage_daily(day,calls) VALUES(?,1) ON CONFLICT(day) DO UPDATE SET calls=calls+1').bind(day).run();
  let answer='';
  try{
   const result=await env.AI.run(((!env.AI_MODEL || env.AI_MODEL === '@cf/meta/llama-3.1-8b-instruct') ? '@cf/meta/llama-3.1-8b-instruct-fp8-fast' : env.AI_MODEL) as any,{messages:[{role:'system',content:system},...history.results.reverse().map(x=>({role:x.role,content:x.content})),{role:'user',content:prompt}],max_tokens:1200} as any);
   answer=typeof (result as any)?.response==='string'?(result as any).response:'';
   if(!answer)throw new Error('Risposta vuota dal modello');
  }catch(e){return json({error:'Il servizio AI gratuito non ha risposto. Possibile limite di quota o modello indisponibile. '+String(e).slice(0,180)},503)}
  const ts=now();await env.DB.batch([env.DB.prepare('INSERT INTO messages VALUES(?,?,?,?,?)').bind(uid(),conversationId,'user',prompt,ts),env.DB.prepare('INSERT INTO messages VALUES(?,?,?,?,?)').bind(uid(),conversationId,'assistant',answer,ts+1),env.DB.prepare('UPDATE conversations SET updated_at=?,title=CASE WHEN title=? THEN ? ELSE title END WHERE id=?').bind(ts,'Nuova conversazione',prompt.slice(0,65),conversationId)]);
  return json({answer});
 }
 return json({error:'Endpoint non trovato'},404);
}
export default {async fetch(req:Request,env:Env):Promise<Response>{
 const url=new URL(req.url);
 if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(req);
 if(!['GET','POST','PATCH','DELETE'].includes(req.method))return json({error:'Metodo non consentito'},405);
 if(req.method!=='GET'&&req.headers.get('origin')!==url.origin)return json({error:'Origin non autorizzata'},403);
 try{return await route(req,env)}catch(e){return json({error:'Errore nella richiesta o database non inizializzato: '+String(e).slice(0,140)},500)}
}} satisfies ExportedHandler<Env>;
