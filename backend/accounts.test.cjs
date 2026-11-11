const {test}=require('node:test');
const assert=require('node:assert/strict');
const express=require('express');
const accounts=require('./accounts');
test('account cookie, password verification, email uniqueness, stable identity and logout',async()=>{
 const user={id:7,name:'Test',email:'test@example.invalid',password:'test-only',avatar:'sparkles'};
 const sessions=new Map();
 const db={query:async(sql,values=[])=>{
   if(sql.startsWith('CREATE'))return [[]];
   if(sql.startsWith('SELECT u.*, p.avatar FROM users'))return [[values[0]===user.email?{...user}:null].filter(Boolean)];
   if(sql.startsWith('INSERT INTO mystikal_web_sessions')){sessions.set(values[0],{id:values[1],expiry:values[2]});return [[]];}
   if(sql.startsWith('DELETE FROM mystikal_web_sessions WHERE expires')){sessions.delete(values[1]);return [[]];}
   if(sql.startsWith('SELECT u.*, p.avatar FROM mystikal_web_sessions'))return [[sessions.has(values[0])?{...user}:null].filter(Boolean)];
   if(sql.startsWith('SELECT id FROM users'))return [[...(values[0]==='taken@example.invalid'?[{id:8}]:[])]];
   if(sql.startsWith('UPDATE users')){user.name=values[0];user.email=values[1];return [[]];}
   if(sql.startsWith('INSERT INTO mystikal_profiles')){user.avatar=values[1];return [[]];}
   if(sql.startsWith('DELETE FROM mystikal_web_sessions WHERE token_hash')){sessions.delete(values[0]);return [[]];}
   if(sql.startsWith('DELETE FROM mystikal_web_sessions WHERE user_id'))return [[]];
   throw Error('Unexpected query: '+sql);
 },getConnection:async()=>({...db,beginTransaction:async()=>{},commit:async()=>{},rollback:async()=>{},release:()=>{}})};
 const app=express();app.use(express.json());app.use(accounts(db));
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 let cookie='';
 const call=(url,body,origin)=>fetch(base+url,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...(origin?{Origin:origin}:{})},...(body?{body:JSON.stringify(body)}:{})});
 try{
  assert.equal((await call('/api/account')).status,401);
  assert.equal((await call('/api/login',{email:user.email,password:'wrong'})).status,401);
  const login=await call('/api/login',{email:user.email,password:'test-only'});assert.equal(login.status,200);
  cookie=login.headers.get('set-cookie').split(';')[0];assert.match(login.headers.get('set-cookie'),/HttpOnly/);
  assert.equal((await call('/api/account')).status,200);
  const update={name:'New name',email:'new@example.invalid',avatar:'moon',current_password:'test-only'};
  assert.equal((await call('/api/account',update,'https://attacker.invalid')).status,403);
  assert.equal((await call('/api/account',{...update,current_password:'wrong'})).status,401);
  assert.equal((await call('/api/account',{...update,email:'taken@example.invalid'})).status,409);
  const changed=await call('/api/account',update);assert.equal(changed.status,200);
  assert.deepEqual((await changed.json()).user,{id:7,name:'New name',email:'new@example.invalid',avatar:'moon'});
  assert.equal((await call('/api/account/logout',{})).status,200);
  assert.equal((await call('/api/account')).status,401);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
