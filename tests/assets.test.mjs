import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';import {createHash} from 'node:crypto';
const base=new URL('../prototype/assets/candidates/',import.meta.url),catalog=JSON.parse(readFileSync(new URL('catalog.json',base)));
test('downloaded candidates retain their identity, geometry counts and local dependencies',()=>{
 assert.equal(catalog.length,6);
 for(const item of catalog){
  const bytes=readFileSync(new URL(item.file,base));
  assert.equal(bytes.length,item.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),item.sha256);
  const doc=JSON.parse(item.file.endsWith('.glb')?bytes.subarray(20,20+bytes.readUInt32LE(12)).toString():bytes.toString());
  assert.equal(doc.asset.version,'2.0');
  for(const resource of [...doc.buffers||[],...doc.images||[]]){
   if(resource.uri&&!resource.uri.startsWith('data:')){
    assert.ok(!/^https?:/.test(resource.uri),'review must not hotlink external model dependencies');
    assert.ok(existsSync(new URL(resource.uri,base)),`${item.file}: missing ${resource.uri}`);
   }
  }
  const triangles=doc.meshes.reduce((sum,mesh)=>sum+mesh.primitives.reduce((s,p)=>s+doc.accessors[p.indices??p.attributes.POSITION].count/3,0),0);
  assert.equal(triangles,item.triangles);
  if(item.kind==='human'){assert.ok(doc.skins.length>0);assert.ok(doc.animations.some(a=>a.name==='Walk'));}
 }
 for(const file of ['KENNEY-LICENSE.txt','QUATERNIUS-LICENSE.txt'])assert.match(readFileSync(new URL(file,base),'utf8'),/CC0/);
});
