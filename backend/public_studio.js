const express=require('express');
const crypto=require('node:crypto');
const digest=value=>crypto.createHash('sha256').update(String(value)).digest('hex');
const OWNER_EMAIL='martinjara580@gmail.com';
const PNG=Buffer.from([137,80,78,71,13,10,26,10]);
module.exports=function publicStudio(db,authenticate){
 const router=express.Router();let ready;
 const initialize=()=>ready??=(async()=>{
  await db.query('CREATE TABLE IF NOT EXISTS studio_control (id INT PRIMARY KEY, owner_id VARCHAR(100), worker_until BIGINT NOT NULL DEFAULT 0)');
  await db.query('CREATE TABLE IF NOT EXISTS studio_access (user_id VARCHAR(100) PRIMARY KEY, used_count INT NOT NULL DEFAULT 0, reserved_job VARCHAR(36))');
  await db.query('CREATE TABLE IF NOT EXISTS studio_jobs (id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(100) NOT NULL, status VARCHAR(16) NOT NULL, payload TEXT NOT NULL, created_at BIGINT NOT NULL, updated_at BIGINT NOT NULL, lease_hash VARCHAR(64), lease_until BIGINT, image MEDIUMBLOB, error VARCHAR(400), progress INT NOT NULL DEFAULT 0, INDEX studio_jobs_user(user_id), INDEX studio_jobs_queue(status,created_at))');
  await db.query('INSERT IGNORE INTO studio_control(id) VALUES (1)');
  // Pin an EXISTING account's immutable ID once. Editing an email cannot grant
  // ownership, and the browser cannot choose its own role.
  await db.query('UPDATE studio_control SET owner_id=(SELECT CAST(id AS CHAR) FROM users WHERE LOWER(email)=? ORDER BY id LIMIT 1) WHERE id=1 AND owner_id IS NULL',[(process.env.STUDIO_OWNER_EMAIL||OWNER_EMAIL).trim().toLowerCase()]);
 })().catch(error=>{ready=undefined;throw error;});
 const wrap=handler=>async(req,res)=>{
  res.set('Cache-Control','private, no-store');
  try{
   const origins=['https://mystikal-ai.vercel.app','http://127.0.0.1:5173','http://localhost:5173',...(process.env.ACCOUNT_ORIGINS||'').split(',')];
   if(req.method==='POST'&&req.headers.origin&&!origins.includes(req.headers.origin))return res.status(403).json({error:'Origen no permitido.'});
   await initialize();const user=await authenticate(req,res);if(!user)return;
   const [[control]]=await db.query('SELECT owner_id,worker_until FROM studio_control WHERE id=1');
   req.studio={user,owner:String(user.id)===String(control.owner_id),online:Number(control.worker_until)>Date.now()};
   await handler(req,res);
  }catch(error){
   if(error.status)return res.status(error.status).json({error:error.message});
   console.error('Studio request failed:',error.code||error.name);
   res.status(503).json({error:'El estudio no está disponible ahora. Tu prueba no se ha dado por completada.'});
  }
 };
 const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
 const requireOwner=req=>{if(!req.studio.owner)fail(403,'Este acceso es exclusivo del propietario del estudio.');};
 async function transaction(action){const c=await db.getConnection();try{await c.beginTransaction();const result=await action(c);await c.commit();return result;}catch(error){await c.rollback();throw error;}finally{c.release();}}
 async function expire(){
  const now=Date.now();
  await db.query("UPDATE studio_jobs SET status='failed',error='La conexión con la GPU terminó. Puedes volver a intentar tu prueba.',updated_at=? WHERE (status='running' AND lease_until<?) OR (status='queued' AND created_at<?)",[now,now,now-15*60000]);
  await db.query("UPDATE studio_access a JOIN studio_jobs j ON a.reserved_job=j.id SET a.reserved_job=NULL WHERE j.status='failed'");
 }
 const jobColumns='id,user_id,status,payload,created_at,updated_at,error,progress';
 const view=row=>({id:row.id,status:row.status,error:row.error||undefined,progress:row.progress,created_at:Number(row.created_at),image_url:row.status==='succeeded'?`/api/studio/jobs/${row.id}/image`:undefined});
 router.get('/access',wrap(async(req,res)=>{
  await expire();const user=String(req.studio.user.id);
  const [[access]]=await db.query('SELECT used_count,reserved_job FROM studio_access WHERE user_id=?',[user]);
  const [jobs]=await db.query(`SELECT ${jobColumns} FROM studio_jobs WHERE user_id=? ORDER BY created_at DESC LIMIT 1`,[user]);
  const used=access?.used_count||0;
  res.json({owner:req.studio.owner,used,limit:req.studio.owner?null:1,finished:!req.studio.owner&&used>=1,online:req.studio.online,active_job:access?.reserved_job||null,last_job:jobs[0]?view(jobs[0]):null});
 }));
 router.post('/jobs',wrap(async(req,res)=>{
  const prompt=typeof req.body?.prompt==='string'?req.body.prompt.trim():'';
  if(prompt.length<3||prompt.length>1000)fail(422,'Describe tu idea usando entre 3 y 1000 caracteres.');
  if(!req.studio.online)fail(503,'La GPU del estudio está desconectada. Tu prueba sigue disponible.');
  await expire();
  const id=crypto.randomUUID(),user=String(req.studio.user.id),now=Date.now();
  const shapes={square:[768,768],portrait:[832,1216],landscape:[1216,832]};
  const [width,height]=req.studio.owner&&Object.hasOwn(shapes,req.body.shape)?shapes[req.body.shape]:shapes.square;
  const payload={prompt:`rating:general, ${prompt}`,negative_prompt:'low quality, blurry, text, watermark, nsfw, nudity',engine:'wai',width,height,steps:req.studio.owner?28:20,guidance:5,seed:-1,count:1,nsfw:false,characters:[],artist:'',style:'original'};
  await transaction(async c=>{
   await c.query('INSERT IGNORE INTO studio_access(user_id) VALUES (?)',[user]);
   const [[access]]=await c.query('SELECT used_count,reserved_job FROM studio_access WHERE user_id=? FOR UPDATE',[user]);
   if(!req.studio.owner&&access.used_count>=1)fail(403,'Prueba terminada. Ya utilizaste tu generación.');
   if(access.reserved_job)fail(409,'Ya tienes una generación en curso.');
   await c.query('SELECT id FROM studio_control WHERE id=1 FOR UPDATE');
   const [[queue]]=await c.query("SELECT COUNT(*) AS total FROM studio_jobs WHERE status IN ('queued','running')");
   if(queue.total>=8)fail(429,'El estudio está ocupado. Tu prueba sigue disponible; vuelve en unos minutos.');
   await c.query("INSERT INTO studio_jobs(id,user_id,status,payload,created_at,updated_at) VALUES (?,?,'queued',?,?,?)",[id,user,JSON.stringify(payload),now,now]);
   await c.query('UPDATE studio_access SET reserved_job=? WHERE user_id=?',[id,user]);
  });
  res.status(202).json({id,status:'queued'});
 }));
 router.get('/jobs/:id',wrap(async(req,res)=>{
  await expire();const [[job]]=await db.query(`SELECT ${jobColumns} FROM studio_jobs WHERE id=? AND user_id=?`,[req.params.id,String(req.studio.user.id)]);
  if(!job)fail(404,'Imagen no encontrada.');res.json(view(job));
 }));
 router.get('/jobs/:id/image',wrap(async(req,res)=>{
  const [[job]]=await db.query("SELECT image FROM studio_jobs WHERE id=? AND user_id=? AND status='succeeded'",[req.params.id,String(req.studio.user.id)]);
  if(!job?.image)fail(404,'Imagen no encontrada.');res.set({'Content-Type':'image/png','X-Content-Type-Options':'nosniff','Content-Disposition':`inline; filename="mystikal-${req.params.id}.png"`});res.send(job.image);
 }));
 router.post('/worker/claim',wrap(async(req,res)=>{
  requireOwner(req);await expire();const now=Date.now();
  await db.query('UPDATE studio_control SET worker_until=? WHERE id=1',[now+60000]);
  const result=await transaction(async c=>{
   // A control-row lock serializes claimers even if two PC terminals are open.
   await c.query('SELECT id FROM studio_control WHERE id=1 FOR UPDATE');
   const [active]=await c.query("SELECT id FROM studio_jobs WHERE status='running' LIMIT 1");if(active.length)return null;
   const [[job]]=await c.query("SELECT id,payload FROM studio_jobs WHERE status='queued' ORDER BY created_at LIMIT 1 FOR UPDATE");
   if(!job)return null;
   const lease=crypto.randomBytes(32).toString('hex');
   await c.query("UPDATE studio_jobs SET status='running',lease_hash=?,lease_until=?,updated_at=? WHERE id=?",[digest(lease),now+120000,now,job.id]);
   return {id:job.id,request:JSON.parse(job.payload),lease};
  });res.json({job:result});
 }));
 router.post('/worker/:id/heartbeat',wrap(async(req,res)=>{
  requireOwner(req);const now=Date.now();
  const [result]=await db.query("UPDATE studio_jobs SET lease_until=?,updated_at=?,progress=? WHERE id=? AND status='running' AND lease_hash=? AND lease_until>?",[now+120000,now,Math.max(0,Math.min(99,Number(req.body.progress)||0)),req.params.id,digest(req.body.lease),now]);
  if(!result.affectedRows)fail(409,'La tarea ya no está asignada a este proceso.');
  await db.query('UPDATE studio_control SET worker_until=? WHERE id=1',[now+60000]);res.json({ok:true});
 }));
 router.post('/worker/:id/complete',express.raw({type:'image/png',limit:'4mb'}),wrap(async(req,res)=>{
  requireOwner(req);const image=req.body;
  if(!Buffer.isBuffer(image)||image.length<24||!image.subarray(0,8).equals(PNG))fail(422,'Archivo PNG no válido.');
  const now=Date.now();
  await transaction(async c=>{
   const [[job]]=await c.query("SELECT id,user_id,payload FROM studio_jobs WHERE id=? AND status='running' AND lease_hash=? AND lease_until>? FOR UPDATE",[req.params.id,digest(req.headers['x-worker-lease']),now]);
   if(!job)fail(409,'La tarea ya no está asignada a este proceso.');
   const params=JSON.parse(job.payload);
   if(image.readUInt32BE(16)!==params.width||image.readUInt32BE(20)!==params.height)fail(422,'La resolución no coincide con la solicitud.');
   await c.query("UPDATE studio_jobs SET status='succeeded',image=?,updated_at=?,progress=100,lease_hash=NULL WHERE id=?",[image,now,job.id]);
   await c.query('UPDATE studio_access SET used_count=used_count+1,reserved_job=NULL WHERE user_id=? AND reserved_job=?',[job.user_id,job.id]);
  });res.json({ok:true});
 }));
 router.post('/worker/:id/fail',wrap(async(req,res)=>{
  requireOwner(req);
  const message=req.body.code==='prompt_too_long'?'El prompt supera el límite del modelo. Acórtalo y vuelve a intentar.':'No se pudo completar la imagen. Tu prueba sigue disponible.';
  await transaction(async c=>{
   const [[job]]=await c.query("SELECT id,user_id FROM studio_jobs WHERE id=? AND status='running' AND lease_hash=? FOR UPDATE",[req.params.id,digest(req.body.lease)]);
   if(!job)fail(409,'La tarea ya terminó.');
   await c.query("UPDATE studio_jobs SET status='failed',error=?,updated_at=?,lease_hash=NULL WHERE id=?",[message,Date.now(),job.id]);
   await c.query('UPDATE studio_access SET reserved_job=NULL WHERE user_id=? AND reserved_job=?',[job.user_id,job.id]);
  });res.json({ok:true});
 }));
 return router;
};
