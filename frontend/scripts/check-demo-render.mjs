import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
const require=createRequire(new URL('../package.json',import.meta.url));
const React=require('react');const {renderToString}=require('react-dom/server');const {MemoryRouter}=require('react-router-dom');const assert=require('node:assert/strict');
const frontendDirectory=fileURLToPath(new URL('..',import.meta.url));
globalThis.window={location:{hostname:'mystikal-ai.vercel.app'},addEventListener:()=>{},removeEventListener:()=>{},matchMedia:()=>({matches:true,addEventListener:()=>{},removeEventListener:()=>{}})};
globalThis.localStorage={getItem:()=>null};globalThis.sessionStorage={getItem:()=>null};
const server=await createServer({root:frontendDirectory,server:{middlewareMode:true},appType:'custom'});
try{
 const {default:Studio}=await server.ssrLoadModule('/src/LocalStudio.tsx');
 const demo=renderToString(React.createElement(MemoryRouter,null,React.createElement(Studio,{demo:true})));
 assert.match(demo,/DEMO INTERACTIVA/);assert.match(demo,/Cargar siguiente ejemplo/);assert.match(demo,/Ciudad entre islas/);assert.match(demo,/Luz de jardín/);assert.match(demo,/Descargar mi configuración/);assert.doesNotMatch(demo,/No se pudo conectar/);assert.match(demo,/WAI Illustrious SDXL v17/);assert.doesNotMatch(demo,/Pony Diffusion V6 XL/);assert.doesNotMatch(demo,/FLUX 1.1 Pro/);
 const local=renderToString(React.createElement(MemoryRouter,null,React.createElement(Studio)));
 assert.match(local,/Generar imagen/);assert.doesNotMatch(local,/DEMO INTERACTIVA/);
 console.log('PASS: React renderiza demo sin cuenta, dos ejemplos y exportación; modo local conserva generación.');
}finally{await server.close();}
