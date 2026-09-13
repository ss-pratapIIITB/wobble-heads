import test from 'node:test';import assert from 'node:assert/strict';
test('fight camera frames the pair broadside and expands for portrait screens',async()=>{
 const {fightCameraTarget}=await import('../prototype/js/camera.js');
 const a={x:0,y:0,z:0},b={x:0,y:0,z:1},view=fightCameraTarget(a,b,0,1.7);
 assert.equal(view.lookZ,.5);assert.equal(view.z,.5);assert.ok(view.x>5);assert.ok(view.y<3);
 const portrait=fightCameraTarget(a,b,0,.5);assert.ok(portrait.x>view.x);
 const turned=fightCameraTarget(a,{x:1,y:0,z:0},Math.PI/2);assert.ok(turned.z<-5);assert.ok(Math.abs(turned.x-.5)<1e-6);
});
