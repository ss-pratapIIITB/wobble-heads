import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import * as motion from '../prototype/js/motion.js';
import {createActor,poseWalking,poseReaction} from '../prototype/js/characters.js';

const params={size:1,mass:2.8,hz:1.6,amp:2.4};
function actor(){
 const model=new T.Group(),hips=new T.Bone();hips.name='Hips';hips.position.y=1;model.add(hips);
 for(const [side,x] of [['Left',.13],['Right',-.13]]){
  const upper=new T.Bone(),lower=new T.Bone(),foot=new T.Bone();
  upper.name=side+'UpLeg';lower.name=side+'Leg';foot.name=side+'Foot';upper.position.x=x;lower.position.y=-.43;foot.position.y=-.43;
  hips.add(upper);upper.add(lower);lower.add(foot);
 }
 const a=createActor(model,{name:'Gait test'});a.mode='walk';a.speed=1.35;return a;
}
test('the returning foot lifts while the planted foot cancels body translation',()=>{
 assert.equal(typeof motion.gaitSample,'function');
 for(const stride of [.30,.43])for(const direction of [-1,1]){
  const distance=.003*direction,cycle=4*stride;
  const a=motion.gaitSample(.25,stride),b=motion.gaitSample(.25+distance/cycle,stride);
  assert.equal(a.lift,0);assert.equal(b.lift,0);
  assert.ok(Math.abs(distance+b.z-a.z)<1e-9,'stance foot must stay fixed in world space');
  const back=motion.gaitSample(.6,stride),front=motion.gaitSample(.9,stride);
  assert.ok(front.z>back.z && front.lift>0 && back.lift>0,'forward return must clear the floor');
 }
});
test('an actual IK foot remains planted during forward and backward travel',()=>{
 for(const direction of [-1,1])for(const fps of [30,60,120]){
  const a=actor();poseWalking(a,1/fps,params);a.root.updateMatrixWorld(true);
  const before=a.bones.LeftFoot.getWorldPosition(new T.Vector3());
  a.root.position.z+=direction*1.35/fps;poseWalking(a,1/fps,params);a.root.updateMatrixWorld(true);
  const after=a.bones.LeftFoot.getWorldPosition(new T.Vector3());
  assert.ok(before.distanceTo(after)<.001,`foot slid ${before.distanceTo(after)} at ${fps} FPS, direction ${direction}`);
 }
});
test('gait phase uses distance and stays still when movement is blocked',()=>{
 const samples=[];
 for(const fps of [10,30,60,120]){
  const a=actor();poseWalking(a,0,params);
  for(let i=0;i<fps;i++){a.root.position.z+=1.35/fps;poseWalking(a,1/fps,params);}
  samples.push(a.phase);const before=a.phase;
  for(let i=0;i<fps;i++)poseWalking(a,1/fps,params);
  assert.equal(a.phase,before,'input speed alone must not advance feet');
 }
 assert.ok(Math.max(...samples)-Math.min(...samples)<1e-9);
});
test('stopping lowers the swing foot and settles the head without cycling',()=>{
 const a=actor();poseWalking(a,0,params);a.root.position.z=.12;poseWalking(a,.1,params);const phase=a.phase;
 a.speed=0;a.mode='idle';for(let i=0;i<60;i++)poseWalking(a,1/60,params);
 assert.equal(a.phase,phase);assert.equal(a.head.x,0);assert.equal(a.head.z,0);
 a.root.updateMatrixWorld(true);
 for(const side of ['Left','Right'])assert.ok(Math.abs(a.bones[side+'Foot'].getWorldPosition(new T.Vector3()).y-a.local[side+'Foot'].y)<.002);
});

test('fallen articulated bodies settle on the ground and repeat without drift',()=>{
 for(const heading of [0,.8,Math.PI]){
  const a=actor();a.reaction={phase:'down',time:0,fallTime:.8,dx:Math.sin(heading),dz:Math.cos(heading),height:0,severity:.7,roll:.1};
  poseReaction(a,params);a.root.updateMatrixWorld(true);
  const y=a.root.position.y;
  let low=Infinity;for(const name of ['Hips','LeftFoot','RightFoot'])low=Math.min(low,a.bones[name].getWorldPosition(new T.Vector3()).y-(name==='Hips'?.14:.035));
  assert.ok(Math.abs(low-.015)<.001,`ground clearance ${low}`);
  poseReaction(a,params);assert.ok(Math.abs(a.root.position.y-y)<.001);
 }
});
