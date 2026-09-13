import test from 'node:test';import assert from 'node:assert/strict';
import {startPunch,sweepPunch,receivePunch,bodyHit} from '../prototype/js/boxing.js';
const actor=(z=0)=>({root:{position:{x:0,y:0,z}},heading:0,health:100});
test('swept punch contacts once across frame rates and cannot hit behind or through cover',()=>{
 for(const hz of [15,30,60,120]){const a=actor(),b=actor(1);startPunch(a);let hits=0;for(let t=0;t<.46;t+=1/hz)if(sweepPunch(a,t,t+1/hz,[b]))hits++;assert.equal(hits,1);}
 for(const [z,cover] of [[-1,()=>1],[1,()=>0],[2,()=>1]]){const a=actor();startPunch(a);assert.equal(sweepPunch(a,0,.4,[actor(z)],cover),null);}
});
test('guard reduces damage and a heavy combination staggers before knockdown',()=>{
 const a=actor(),b=actor(1);b.heading=Math.PI;b.guard=true;b.stamina=100;const block=receivePunch(b,a,'cross');assert.ok(block.guarded);assert.ok(block.damage<10);
 b.guard=false;b.poise=0;assert.equal(receivePunch(b,a,'jab').knockdown,false);assert.equal(receivePunch(b,a,'cross').knockdown,true);assert.ok(b.health>0);assert.ok(b.fireCooldown>=.75);
});
test('stamina and hitstun reject punches, bullets resolve an entry contact',()=>{
 const a=actor();a.stamina=0;assert.equal(startPunch(a),false);a.stamina=100;a.hitstun=.2;assert.equal(startPunch(a),false);
 const hit=bodyHit({x:0,y:1.1,z:0},{x:0,y:1.1,z:10},actor(5));assert.ok(hit.fraction<.5&&hit.fraction>.4);
});
test('one attack input samples punch type and hand while retaining attack gates',async()=>{
 const {startRandomPunch}=await import('../prototype/js/boxing.js');
 for(const [roll,kind,side] of [[.1,'jab','Left'],[.9,'cross','Right']]){const a=actor();assert.ok(startRandomPunch(a,()=>roll));assert.equal(a.attack.kind,kind);assert.equal(a.attack.side,side);assert.equal(startRandomPunch(a,()=>roll),false);}
});
test('punch drive winds up, rotates the striking shoulder forward and returns to rest',async()=>{
 const {punchDrive,PUNCH}=await import('../prototype/js/boxing.js');
 for(const side of ['Left','Right']){const a={kind:'cross',side},s=PUNCH.cross,start=punchDrive(a,0),peak=punchDrive(a,s.contact),end=punchDrive(a,s.duration);
  assert.equal(start.shift,0);assert.ok(peak.shift>.04);assert.ok(Math.abs(peak.turn)>.3);assert.equal(Math.sign(peak.turn),side==='Left'?-1:1);assert.ok(Math.abs(end.turn)<1e-10);assert.ok(end.shift<1e-10);
 }
});
