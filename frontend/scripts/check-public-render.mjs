import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
const require=createRequire(new URL('../package.json',import.meta.url));
const React=require('react'),{renderToString}=require('react-dom/server'),{MemoryRouter}=require('react-router-dom'),assert=require('node:assert/strict');
const fs=require('node:fs');
globalThis.window={location:{hostname:'mystikal-ai.vercel.app'},addEventListener:()=>{},removeEventListener:()=>{},matchMedia:()=>({matches:true,addEventListener:()=>{},removeEventListener:()=>{}})};
globalThis.localStorage={getItem:()=>null};globalThis.sessionStorage={getItem:key=>key==='mystikal_guest'?'true':null};
const server=await createServer({root:fileURLToPath(new URL('..',import.meta.url)),server:{middlewareMode:true},appType:'custom'});
const render=Component=>renderToString(React.createElement(MemoryRouter,null,React.createElement(Component)));
try{
 const {default:Showcase}=await server.ssrLoadModule('/src/pages/VisualShowcase.tsx');
 const showcase=render(Showcase);assert.match(showcase,/MUESTRA VISUAL/);assert.match(showcase,/Luz de jardín/);assert.match(showcase,/Ciudad entre islas/);assert.doesNotMatch(showcase,/<textarea|<select|<form/);
 const {default:Trial}=await server.ssrLoadModule('/src/pages/PublicTrial.tsx');
 const trial=render(Trial);assert.match(trial,/Crear mi cuenta/);assert.match(trial,/Iniciar sesión/);assert.doesNotMatch(trial,/<textarea/);
 const {default:Home}=await server.ssrLoadModule('/src/LocalHome.tsx');const home=render(Home);assert.match(home,/Lo imaginas\./);assert.match(home,/Lo haces imagen\./);assert.doesNotMatch(home,/Tu universo anime/);
 const config=JSON.parse(fs.readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));assert.ok(config.rewrites.some(rule=>rule.source==='/api/studio/:path*'));assert.ok(config.rewrites.some(rule=>rule.source==='/muestra-visual'));
 console.log('PASS: muestra visual sin formulario, prueba requiere cuenta, home de imaginación y rutas Vercel.');
}finally{await server.close();}
