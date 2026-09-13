import test from 'node:test';import assert from 'node:assert/strict';
const combat=await import('../prototype/js/combat.js').catch(()=>({}));
const motion=await import('../prototype/js/motion.js');
test('six good body shots kill, misses do not hurt, dead players cannot take further damage',()=>{
 assert.equal(typeof combat.damagePlayer,'function');const a={health:100};
 for(let i=0;i<5;i++)assert.equal(combat.damagePlayer(a),true);
 assert.ok(a.health>0);assert.equal(a.dead,false);combat.damagePlayer(a);assert.equal(a.health,0);assert.equal(a.dead,true);assert.equal(combat.damagePlayer(a),false);
 combat.resetHealth(a);assert.equal(a.health,100);assert.equal(a.dead,false);
});
test('shot spread misses, centered aim hits, vehicle cover blocks',()=>{
 assert.equal(typeof combat.makeShot,'function');
 const from={x:0,y:1.2,z:0},target={x:0,y:1.2,z:10};
 const centered=combat.makeShot(from,target,()=>.5);assert.equal(combat.shotHits(centered,target),true);
 assert.equal(combat.shotHits(combat.makeShot(from,target,()=>1),target),false);
 assert.equal(combat.shotHits(centered,target,.2),false);
 assert.equal(combat.shotHits(centered,{x:0,y:1.2,z:40}),false);
});
test('sprint trips depend on elapsed running time and reset after a fall',()=>{
 assert.equal(typeof motion.stepSprint,'function');
 const a={};for(let i=0;i<1000;i++)assert.equal(motion.stepSprint(a,.1,0,0),false);
 let trips=0;for(let i=0;i<240;i++)if(motion.stepSprint(a,1/30,3.7,0))trips++;
 assert.equal(trips,1);assert.equal(motion.stepSprint(a,.1,3.7,0),false);
});
test('running head cadence is at least twice walking cadence',()=>{
 const make=()=>({x:0,z:0,vx:0,vz:0,phase:0});const w=make(),r=make();
 motion.stepHead(w,.5,1.35);motion.stepHead(r,.5,3.7);assert.ok(r.phase/w.phase>=2);
});
const impacts=await import('../prototype/js/impacts.js');
test('fall flight lands on the ground and fatal reactions never recover',()=>{
 const a={root:{position:{x:0,z:0}}};impacts.beginImpact(a,{x:0,z:1},7,{x:0,z:0});
 assert.ok(a.reaction.vy>0);const out={};for(let i=0;i<180;i++)impacts.advanceImpulse(a.reaction,1/60,out);
 assert.equal(a.reaction.height,0);assert.equal(a.reaction.vy,0);
 a.dead=true;for(let i=0;i<1000;i++)impacts.stepReaction(a,1/60);
 assert.equal(a.reaction.phase,'down');assert.equal(a.mode,'dead');
});
test('a player trip returns control after getting up',()=>{
 const a={player:true};impacts.beginImpact(a,{x:0,z:1},3.7,{x:0,z:0});a.reaction.trip=true;
 for(let i=0;i<250;i++)impacts.stepReaction(a,1/60);
 assert.equal(a.reaction,null);assert.equal(a.mode,'idle');
});
test('running increases visible head swing as well as cadence',()=>{
 const rms=speed=>{const h={x:0,z:0,vx:0,vz:0,phase:0};let sum=0;for(let i=0;i<1200;i++){motion.stepHead(h,1/120,speed);if(i>=240)sum+=h.x*h.x+h.z*h.z;}return Math.sqrt(sum/960);};
 assert.ok(rms(3.7)>rms(1.35)*1.2);
});
