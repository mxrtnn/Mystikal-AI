const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const ts=require('typescript');
const root=path.join(__dirname,'../src/services');
function storage(){const data=new Map();return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,String(value)),removeItem:key=>data.delete(key)};}
function load(source,context){const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;vm.runInNewContext(js,context);return context.exports;}
function runtime(hostname){return load(fs.readFileSync(path.join(root,'runtime.ts'),'utf8').replace('import.meta.env.VITE_AUTH_API_URL','undefined'),{exports:{},window:{location:{hostname}}});}
(async()=>{
 const publicRuntime=runtime('mystikal-ai.vercel.app');assert.equal(publicRuntime.LOGIN_URL,'/api/login');assert.equal(publicRuntime.REGISTER_URL,'/api/register');
 const localRuntime=runtime('127.0.0.1');assert.equal(localRuntime.LOGIN_URL,'/api/auth/login');assert.equal(localRuntime.REGISTER_URL,'https://mystikal-ai.onrender.com/api/register');
 assert.equal(runtime('localhost.attacker.invalid').IS_LOCAL_STUDIO,false);
 const source=fs.readFileSync(path.join(root,'session.ts'),'utf8');
 const localStorage=storage(),sessionStorage=storage();
 const publicSession=load(source,{exports:{},require:()=>publicRuntime,localStorage,sessionStorage,crypto:{randomUUID:()=>String(Math.random())},fetch:()=>{throw Error('A public guest must not call the local backend');}});
 assert.equal(await publicSession.syncSession(),false);
 await publicSession.continueAsGuest();assert.equal(publicSession.isGuest(),true);assert.equal(await publicSession.syncSession(),true);
 await publicSession.endSession();assert.equal(await publicSession.syncSession(),false);
 localStorage.setItem('user',JSON.stringify({name:'Test',email:'test@example.invalid'}));assert.equal(await publicSession.syncSession(),true);
 await publicSession.endSession();assert.equal(publicSession.readUser(),null);
 let calls=0;const localSession=load(source,{exports:{},require:()=>localRuntime,localStorage:storage(),sessionStorage:storage(),crypto:{randomUUID:()=>String(Math.random())},fetch:async(url)=>{calls++;assert.equal(url,'/api/auth/session');return {ok:false};}});
 assert.equal(await localSession.syncSession(),false);assert.equal(calls,1);
 const config=JSON.parse(fs.readFileSync(path.join(__dirname,'../vercel.json'),'utf8'));
 for(const name of ['login','register'])assert.equal(config.rewrites.find(rule=>rule.source==='/api/'+name).destination,'https://mystikal-ai.onrender.com/api/'+name);
 console.log('PASS: URLs de cuentas, invitado público sin Python, cierre de sesión, guard local y rewrites de Vercel.');
})().catch(error=>{console.error(error.message);process.exit(1);});
