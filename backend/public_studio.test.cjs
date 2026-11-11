const {test}=require('node:test');
const assert=require('node:assert/strict');
const express=require('express');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const studio=require('./public_studio');
class FakeDB{
 constructor(){this.control={owner_id:null,worker_until:0};this.users=new Map([['1',{id:1,email:'martinjara580@gmail.com'}],['2',{id:2,email:'a@example.invalid'}],['3',{id:3,email:'b@example.invalid'}]]);this.access=new Map();this.jobs=new Map();this.tail=Promise.resolve();}
 async getConnection(){const before=this.tail;let release;this.tail=new Promise(resolve=>{release=resolve;});await before;const snapshot={control:{...this.control},access:new Map([...this.access].map(([k,v])=>[k,{...v}])),jobs:new Map([...this.jobs].map(([k,v])=>[k,{...v}]))};return {query:this.query.bind(this),beginTransaction:async()=>{},commit:async()=>{},rollback:async()=>{Object.assign(this,snapshot);},release};}
 async query(sql,p=[]){
  const q=sql.replace(/\s+/g,' ').trim();const rows=value=>[value];const changed=n=>[{affectedRows:n}];
  if(q.startsWith('CREATE TABLE')||q.startsWith('INSERT IGNORE INTO studio_control'))return rows([]);
  if(q.startsWith('UPDATE studio_control SET owner_id=')){if(this.control.owner_id===null)this.control.owner_id=String([...this.users.values()].find(user=>user.email.toLowerCase()===p[0])?.id??'');return changed(1);}
  if(q.startsWith('SELECT owner_id,worker_until'))return rows([{...this.control}]);
  if(q==='SELECT id FROM studio_control WHERE id=1 FOR UPDATE')return rows([{id:1}]);
  if(q.startsWith('UPDATE studio_control SET worker_until=')){this.control.worker_until=p[0];return changed(1);}
  if(q.startsWith("UPDATE studio_jobs SET status='failed',error='La conexión")){for(const job of this.jobs.values())if(job.status==='running'&&job.lease_until<p[1]||job.status==='queued'&&job.created_at<p[2])Object.assign(job,{status:'failed',error:'Conexión terminada',updated_at:p[0]});return changed(1);}
  if(q.startsWith('UPDATE studio_access a JOIN')){for(const access of this.access.values())if(this.jobs.get(access.reserved_job)?.status==='failed')access.reserved_job=null;return changed(1);}
  if(q.startsWith('INSERT IGNORE INTO studio_access')){if(!this.access.has(p[0]))this.access.set(p[0],{used_count:0,reserved_job:null});return changed(1);}
  if(q.startsWith('SELECT used_count,reserved_job'))return rows(this.access.has(p[0])?[{...this.access.get(p[0])}]:[]);
  if(q.startsWith('SELECT COUNT(*) AS total'))return rows([{total:[...this.jobs.values()].filter(job=>['queued','running'].includes(job.status)).length}]);
  if(q.startsWith('INSERT INTO studio_jobs')){this.jobs.set(p[0],{id:p[0],user_id:p[1],status:'queued',payload:p[2],created_at:p[3],updated_at:p[4],progress:0});return changed(1);}
  if(q.startsWith('UPDATE studio_access SET reserved_job=?')){this.access.get(p[1]).reserved_job=p[0];return changed(1);}
  if(q.startsWith('SELECT id,user_id,status,payload')){
   if(q.includes('WHERE id=? AND user_id=?')){const job=this.jobs.get(p[0]);return rows(job&&job.user_id===p[1]?[{...job}]:[]);}
   return rows([...this.jobs.values()].filter(job=>job.user_id===p[0]).sort((a,b)=>b.created_at-a.created_at).slice(0,1).map(job=>({...job})));
  }
  if(q.startsWith("SELECT id FROM studio_jobs WHERE status='running'"))return rows([...this.jobs.values()].filter(job=>job.status==='running').slice(0,1));
  if(q.startsWith("SELECT id,payload FROM studio_jobs WHERE status='queued'"))return rows([...this.jobs.values()].filter(job=>job.status==='queued').sort((a,b)=>a.created_at-b.created_at).slice(0,1));
  if(q.startsWith("UPDATE studio_jobs SET status='running'")){Object.assign(this.jobs.get(p[3]),{status:'running',lease_hash:p[0],lease_until:p[1],updated_at:p[2]});return changed(1);}
  if(q.startsWith('UPDATE studio_jobs SET lease_until=')){const job=this.jobs.get(p[3]);if(!job||job.status!=='running'||job.lease_hash!==p[4]||job.lease_until<=p[5])return changed(0);Object.assign(job,{lease_until:p[0],updated_at:p[1],progress:p[2]});return changed(1);}
  if(q.startsWith('SELECT id,user_id,payload FROM studio_jobs')||q.startsWith('SELECT id,user_id FROM studio_jobs')){const job=this.jobs.get(p[0]);return rows(job&&job.status==='running'&&job.lease_hash===p[1]&&(!q.includes('lease_until>?')||job.lease_until>p[2])?[{...job}]:[]);}
  if(q.startsWith("UPDATE studio_jobs SET status='succeeded'")){Object.assign(this.jobs.get(p[2]),{status:'succeeded',image:p[0],updated_at:p[1],progress:100,lease_hash:null});return changed(1);}
  if(q.startsWith('UPDATE studio_access SET used_count=')){const access=this.access.get(p[0]);if(access?.reserved_job===p[1]){access.used_count++;access.reserved_job=null;}return changed(1);}
  if(q.startsWith('SELECT image FROM studio_jobs')){const job=this.jobs.get(p[0]);return rows(job&&job.user_id===p[1]&&job.status==='succeeded'?[{image:job.image}]:[]);}
  if(q.startsWith("UPDATE studio_jobs SET status='failed',error=?")){Object.assign(this.jobs.get(p[2]),{status:'failed',error:p[0],updated_at:p[1],lease_hash:null});return changed(1);}
  if(q.startsWith('UPDATE studio_access SET reserved_job=NULL WHERE')){const access=this.access.get(p[0]);if(access?.reserved_job===p[1])access.reserved_job=null;return changed(1);}
  throw Error('Unexpected SQL: '+q);
 }
}
test('public trial: login required, offline quota, concurrent reservation, ownership, leases, success limit, owner bypass and failure recovery',async()=>{
 const db=new FakeDB();const app=express();app.use(express.json());app.use('/api/studio',studio(db,async(req,res)=>{const user=db.users.get(req.headers['x-test-user']);if(!user){res.status(401).json({error:'Login required'});return null;}return user;}));
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));const base=`http://127.0.0.1:${server.address().port}/api/studio/`;
 const call=(route,user,body,extra={})=>fetch(base+route,{method:body!==undefined?'POST':'GET',headers:{...(user?{'x-test-user':user}:{}),'Content-Type':Buffer.isBuffer(body)?'image/png':'application/json',...extra},...(body!==undefined?{body:Buffer.isBuffer(body)?body:JSON.stringify(body)}:{})});
 const png=fs.readFileSync(path.join(__dirname,'../frontend/public/demo/landscape.png'));
 const claim=async()=>{const r=await call('worker/claim','1',{});assert.equal(r.status,200);return (await r.json()).job;};
 const complete=job=>call(`worker/${job.id}/complete`,'1',png,{'x-worker-lease':job.lease});
 try{
  assert.equal((await call('access')).status,401);assert.equal((await call('jobs',null,{prompt:'landscape'})).status,401);
  assert.equal((await call('jobs','2',{prompt:'landscape'},{Origin:'https://attacker.invalid'})).status,403);
  assert.equal((await call('jobs','2',{prompt:'landscape'})).status,503);assert.equal(db.access.size,0);
  assert.equal((await call('worker/claim','2',{})).status,403);assert.equal(await claim(),null);
  const created=await Promise.all([call('jobs','2',{prompt:'mountain lake',email:'martinjara580@gmail.com',owner:true}),call('jobs','2',{prompt:'another landscape'})]);
  assert.deepEqual(created.map(r=>r.status).sort(),[202,409]);assert.equal(db.jobs.size,1);
  const job=await claim();assert.ok(job);assert.equal(db.access.get('2').used_count,0);
  assert.equal((await call(`jobs/${job.id}`,'3')).status,404);assert.equal((await call(`jobs/${job.id}/image`,'3')).status,404);
  assert.equal((await call(`worker/${job.id}/complete`,'2',png,{'x-worker-lease':job.lease})).status,403);
  assert.equal((await call(`worker/${job.id}/heartbeat`,'1',{lease:'wrong',progress:50})).status,409);
  assert.equal((await complete({...job,lease:crypto.randomBytes(32).toString('hex')})).status,409);
  assert.equal((await complete(job)).status,200);assert.equal(db.access.get('2').used_count,1);
  assert.equal((await complete(job)).status,409);assert.equal(db.access.get('2').used_count,1);
  assert.equal((await call('jobs','2',{prompt:'second image'})).status,403);
  assert.equal((await (await call('access','2')).json()).finished,true);
  assert.equal((await call(`jobs/${job.id}/image`,'2')).status,200);assert.equal((await call(`jobs/${job.id}/image`,'3')).status,404);
  for(let index=0;index<2;index++){assert.equal((await call('jobs','1',{prompt:'owner landscape'})).status,202);assert.equal((await complete(await claim())).status,200);}
  assert.equal((await (await call('access','1')).json()).finished,false);assert.equal(db.access.get('1').used_count,2);
  assert.equal((await call('jobs','3',{prompt:'test retry'})).status,202);const failed=await claim();
  assert.equal((await call(`worker/${failed.id}/fail`,'1',{lease:failed.lease,code:'generation_failed'})).status,200);
  assert.equal(db.access.get('3').used_count,0);assert.equal(db.access.get('3').reserved_job,null);
  assert.equal((await call('jobs','3',{prompt:'retry landscape'})).status,202);const expired=await claim();db.jobs.get(expired.id).lease_until=1;
  await call('access','3');assert.equal(db.access.get('3').reserved_job,null);assert.equal(db.access.get('3').used_count,0);
  db.users.get('1').email='changed@example.invalid';db.users.get('3').email='martinjara580@gmail.com';
  assert.equal((await (await call('access','3')).json()).owner,false);assert.equal((await (await call('access','1')).json()).owner,true);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
