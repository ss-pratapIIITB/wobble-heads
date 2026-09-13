import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const review=await import('../prototype/js/review-catalog.js').catch(()=>({}));
const candidates=JSON.parse(readFileSync(new URL('../prototype/assets/candidates/catalog.json',import.meta.url)));
test('one catalog includes every current car, cast member and downloaded candidate',()=>{
 assert.equal(typeof review.buildReviewCatalog,'function');
 const all=review.buildReviewCatalog(candidates);
 assert.equal(all.length,12);assert.equal(new Set(all.map(i=>i.id)).size,12);
 assert.equal(all.filter(i=>i.kind==='car').length,6);assert.equal(all.filter(i=>i.kind==='human').length,6);
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
