import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
const m=await import('../prototype/js/merlion.js').catch(()=>({}));
test('Merlion fountain starts at its mouth and lands inside the receiving pool',()=>{
 assert.equal(typeof m.fountainPoint,'function');const start=m.fountainPoint(0),end=m.fountainPoint(1);
 assert.ok(start.y>5&&start.y<7);assert.ok(end.y>.1&&end.y<.5);assert.ok(end.z>6&&end.z<10);
 for(let i=0;i<=100;i++){const p=m.fountainPoint(i/100);assert.ok(Number.isFinite(p.x+p.y+p.z)&&p.y>=end.y);}
});
test('Merlion water animation reuses geometry and has a bounded mesh count',()=>{
 assert.equal(typeof m.createMerlion,'function');const a=m.createMerlion(new T.Group());let meshes=0;a.root.traverse(o=>{if(o.isMesh)meshes++;});assert.ok(meshes<20);
 const children=a.root.children.length;for(let i=0;i<120;i++)a.update(i/60);assert.equal(a.root.children.length,children);
 assert.ok(a.blocks({x:0,z:0},.3));assert.ok(!a.blocks({x:12,z:0},.3));
});
