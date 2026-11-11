const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const base=path.join(__dirname,'..');
const examples=JSON.parse(fs.readFileSync(path.join(base,'src/data/demo-examples.json'),'utf8'));
assert.ok(examples.length>=2,'La demo debe ofrecer al menos dos ejemplos revisados.');
const ids=new Set();
for(const item of examples){
 assert.equal(item.nsfw,false);assert.equal(item.model,'cagliostrolab/animagine-xl-4.0');assert.ok(!ids.has(item.id));ids.add(item.id);
 assert.match(item.image_url,/^\/demo\/[a-z-]+\.png$/);assert.match(item.metadata_url,/^\/demo\/[a-z-]+\.json$/);
 assert.ok(item.provenance.includes('pregenerado'));assert.ok(item.prompt.length>0);assert.ok(item.seconds>0);assert.ok(item.peak_vram_mib>0);
 const image=fs.readFileSync(path.join(base,'public',item.image_url));assert.equal(image.toString('hex',0,8),'89504e470d0a1a0a');
 assert.equal(image.readUInt32BE(16),item.width);assert.equal(image.readUInt32BE(20),item.height);
 const metadata=JSON.parse(fs.readFileSync(path.join(base,'public',item.metadata_url),'utf8'));
 for(const key of ['prompt','negative_prompt','seed','steps','guidance','sampler','width','height','nsfw','artist'])assert.deepEqual(metadata[key],item[key],key);
 for(const forbidden of ['owner','email','password','token','token_hash'])assert.ok(!(forbidden in metadata));
}
const config=JSON.parse(fs.readFileSync(path.join(base,'vercel.json'),'utf8'));assert.ok(config.rewrites.some(rule=>rule.source==='/demo'&&rule.destination==='/index.html'));
console.log(`PASS: ${examples.length} ejemplos SFW, PNG y parámetros consistentes, sin datos de cuentas, ruta /demo configurada.`);
