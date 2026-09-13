import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const review=await import('../prototype/js/review-catalog.js').catch(()=>({}));
const candidates=JSON.parse(readFileSync(new URL('../prototype/assets/candidates/catalog.json',import.meta.url)));
test('one catalog includes every current car, cast member and downloaded candidate',()=>{
 assert.equal(typeof review.buildReviewCatalog,'function');
 const all=review.buildReviewCatalog(candidates);
 assert.equal(all.length,13);assert.equal(new Set(all.map(i=>i.id)).size,13);
 assert.equal(all.filter(i=>i.kind==='landmark').length,1);assert.equal(all.filter(i=>i.kind==='car').length,6);assert.equal(all.filter(i=>i.kind==='human').length,6);
 assert.deepEqual(all.filter(i=>i.vehicle).map(i=>i.vehicle),['jeep','mini','sports','sedan','hatch','van']);
 assert.equal(all.filter(i=>i.origin==='Yard cast').length,4);assert.equal(all.some(i=>i.id==='candidate-suv'),false);
 for(const candidate of candidates.filter(c=>c.kind==='human'))assert.ok(all.some(i=>i.id==='candidate-'+candidate.id&&i.file===candidate.file));
});
test('gallery rendering clips partially visible tiles and skips hidden ones',()=>{
 assert.equal(typeof review.clipView,'function');
 assert.equal(review.clipView({left:20,right:220,top:900,bottom:1100},800,600),null);
 assert.deepEqual(review.clipView({left:20,right:220,top:-80,bottom:120},800,600),{x:20,y:480,width:200,height:120});
 assert.deepEqual(review.clipView({left:720,right:920,top:500,bottom:700},800,600),{x:720,y:0,width:80,height:100});
});
test('environment catalog keeps all nine local CC0 asset packs in the review',()=>{
 const environment=JSON.parse(readFileSync(new URL('../prototype/assets/environment/catalog.json',import.meta.url)));
 const all=review.buildReviewCatalog(candidates,environment);
 assert.equal(all.length,22);assert.equal(new Set(all.map(i=>i.id)).size,22);
 assert.equal(all.filter(i=>i.kind==='building').length,5);assert.equal(all.filter(i=>i.kind==='tree').length,4);
 for(const item of environment){
  const buffer=readFileSync(new URL('../prototype/assets/environment/'+item.file,import.meta.url));
  assert.equal(buffer.toString('ascii',0,4),'glTF');assert.equal(buffer.length,item.bytes);
  const gltf=JSON.parse(buffer.toString('utf8',20,20+buffer.readUInt32LE(12)));
  assert.ok(gltf.meshes.length>0);assert.ok(!gltf.buffers.some(b=>b.uri));
  assert.equal(item.licenseUrl,'https://creativecommons.org/publicdomain/zero/1.0/');
  if(item.kind==='tree')assert.equal(gltf.nodes.filter(n=>n.mesh!==undefined).length,5);
 }
});
