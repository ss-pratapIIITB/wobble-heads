import test from 'node:test';
import assert from 'node:assert/strict';
const motion = await import('../prototype/js/motion.js').catch(() => ({}));
test('walking excites the head and stopping settles exactly within half a second', () => {
  assert.equal(typeof motion.stepHead, 'function');
  for (const fps of [30, 60, 120]) {
    const s = {x:0,z:0,vx:0,vz:0,phase:0};
    let peak = 0;
    for(let i=0;i<fps*2;i++){motion.stepHead(s,1/fps,1.35,{mass:2.8,hz:1.6,amp:2.4});peak=Math.max(peak,Math.abs(s.x),Math.abs(s.z));}
    assert.ok(peak > .04 && peak < .35);
    for(let i=0;i<fps/2;i++)motion.stepHead(s,1/fps,0,{mass:2.8,hz:1.6,amp:2.4});
    assert.deepEqual([s.x,s.z,s.vx,s.vz],[0,0,0,0]);
  }
});
test('mass changes the head response',()=>{
  assert.equal(typeof motion.stepHead,'function');
  const a={x:0,z:0,vx:0,vz:0,phase:0}, b={...a};
  for(let i=0;i<30;i++){
    motion.stepHead(a,1/60,1.35,{mass:1,hz:1.6,amp:2.4});
    motion.stepHead(b,1/60,1.35,{mass:8,hz:1.6,amp:2.4});
  }
  assert.ok(Math.abs(a.x-b.x)>.01);
});
test('boarding opens before crossing the sill and closes only after seated',()=>{
  assert.equal(typeof motion.boardingPose,'function');
  const start=motion.boardingPose(0), open=motion.boardingPose(.28), end=motion.boardingPose(1);
  assert.equal(start.door,0); assert.equal(start.seat,0);
  assert.ok(open.door>.95); assert.equal(open.seat,0);
  assert.equal(end.door,0); assert.equal(end.seat,1); assert.equal(end.turn,1);
  for(let i=0;i<=100;i++){
    const p=motion.boardingPose(i/100);
    if(p.seat>.05 && p.seat<.95) assert.ok(p.door>.95);
  }
});
test('exit preserves the same door clearance and staged foot contacts',()=>{
 for(let i=0;i<=100;i++){
  const p=motion.boardingPose(1-i/100);
  assert.ok(p.lead>=p.trail);
  if(p.trail>0&&p.trail<1)assert.equal(p.door,1);
 }
});
test('traffic distance wraps around the loop without detecting cars behind',()=>{
 assert.ok(Math.abs(motion.trafficGap(6.2,.1,18)-(.1+Math.PI*2-6.2)*18)<1e-8);
 assert.ok(motion.trafficGap(.1,6.2,18)>100);
});
