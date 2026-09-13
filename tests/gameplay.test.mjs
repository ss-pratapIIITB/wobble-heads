import test from 'node:test';import assert from 'node:assert/strict';
const impact=await import('../prototype/js/impacts.js').catch(()=>({}));
const camera=await import('../prototype/js/camera.js').catch(()=>({}));
test('swept vehicle contact catches a pedestrian crossed between frames',()=>{
 assert.equal(typeof impact.sweptVehicleHit,'function');
 const c={width:1.8,length:4,heading:0};
 assert.ok(impact.sweptVehicleHit(c,{x:0,z:-8},{x:0,z:8},{x:0,z:0}));
 assert.equal(impact.sweptVehicleHit(c,{x:0,z:-8},{x:0,z:8},{x:3,z:0}),false);
});
test('impact lifecycle finishes at different update rates and repeated overlap does not restart it',()=>{
 assert.equal(typeof impact.beginImpact,'function');
 for(const hz of [30,60,120]){
  const a={reaction:null,hitCooldown:0};assert.equal(impact.beginImpact(a,{x:1,z:0},5,{x:-1,z:0}),true);
  assert.equal(impact.beginImpact(a,{x:1,z:0},5,{x:-1,z:0}),false);
  const phases=new Set();for(let i=0;i<hz*12;i++){impact.stepReaction(a,1/hz);if(a.reaction)phases.add(a.reaction.phase);}
  for(const phase of ['falling','down','gettingUp','fleeing'])assert.ok(phases.has(phase));
  assert.equal(a.reaction,null);assert.ok(a.hitCooldown>=0);
 }
});
test('gentle contacts and boarding/seated targets cannot be knocked down',()=>{
 assert.equal(typeof impact.beginImpact,'function');
 assert.equal(impact.beginImpact({reaction:null},{x:1,z:0},.1,{x:0,z:0}),false);
 for(const state of [{vehicle:{}},{board:{}}])assert.equal(impact.beginImpact(state,{x:1,z:0},6,{x:0,z:0}),false);
});
test('chase camera stays behind all headings on foot and in vehicles',()=>{
 assert.equal(typeof camera.chaseTarget,'function');
 for(const heading of [0,.7,Math.PI,-2.1])for(const driving of [false,true]){
  const p={x:5,y:0,z:3},view=camera.chaseTarget(p,heading,driving);
  assert.ok((view.x-p.x)*Math.sin(heading)+(view.z-p.z)*Math.cos(heading)<-4);
  assert.ok(view.y>2.5&&view.y<4.2);assert.ok(view.lookY>1);
 }
});
test('camera recenter follows the short angular path across +/-pi',()=>{
 assert.equal(typeof camera.followYaw,'function');
 let yaw=3.1;for(let i=0;i<120;i++)yaw=camera.followYaw(yaw,-3.1,1/60);
 assert.ok(Math.abs(Math.atan2(Math.sin(yaw+3.1),Math.cos(yaw+3.1)))<.01);
});
test('blood effects reuse a fixed pool and expire completely',async()=>{
 const T=await import('three'),{BloodEffects}=await import('../prototype/js/effects.js');
 const scene=new T.Scene(),fx=new BloodEffects(scene);
 for(let i=0;i<30;i++)fx.burst(0,1,0,1,0);
 fx.update(.016);assert.ok(fx.active<=48);assert.equal(scene.children.length,1);
 fx.update(9);assert.equal(fx.active,0);assert.equal(fx.mesh.visible,false);
});
test('an impact cancels an unfinished strike',()=>{
 const actor={attack:{time:.05},reaction:null,hitCooldown:0};
 assert.equal(impact.beginImpact(actor,{x:0,z:1},4,{x:0,z:-1}),true);assert.equal(actor.attack,null);
});
test('camera boom obstruction reports intersection, not objects beside the view',()=>{
 const start={x:0,y:1.5,z:0},end={x:0,y:3,z:-6};
 assert.ok(camera.segmentBox(start,end,{x:-1,y:0,z:-4},{x:1,y:4,z:-2})<1);
 assert.equal(camera.segmentBox(start,end,{x:2,y:0,z:-4},{x:4,y:4,z:-2}),null);
});
test('reverse travel and rotated cars use the same swept contact test',()=>{
 assert.ok(impact.sweptVehicleHit({width:1.8,length:4,heading:0},{x:0,z:8},{x:0,z:-8},{x:0,z:0}));
 assert.ok(impact.sweptVehicleHit({width:1.8,length:4,heading:Math.PI/2},{x:-8,z:0},{x:8,z:0},{x:0,z:0}));
 assert.equal(impact.sweptVehicleHit({width:1.8,length:4,heading:Math.PI/2},{x:-8,z:0},{x:8,z:0},{x:0,z:3}),false);
});
test('a recovered fleeing pedestrian can react to a later hit',()=>{
 const a={reaction:null,hitCooldown:0};impact.beginImpact(a,{x:0,z:1},4,{x:0,z:-1});
 for(let i=0;i<240;i++)impact.stepReaction(a,1/60);
 assert.equal(a.reaction.phase,'fleeing');assert.equal(a.hitCooldown,0);
 assert.equal(impact.beginImpact(a,{x:1,z:0},3,{x:-1,z:0}),true);assert.equal(a.reaction.phase,'falling');
});
