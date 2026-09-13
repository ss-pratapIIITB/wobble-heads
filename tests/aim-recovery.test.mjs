import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createActor,poseAim,poseReaction} from '../prototype/js/characters.js';
const params={size:1};
function actor(){
 const model=new T.Group();
 const bone=(name,parent,x,y,z=0)=>{const b=new T.Bone();b.name=name;b.position.set(x,y,z);parent.add(b);return b;};
 const hips=bone('Hips',model,0,.95),spine=bone('Spine',hips,0,.3);bone('Head',spine,0,.3);
 for(const [side,s] of [['Left',1],['Right',-1]]){
  const arm=bone(side+'Arm',spine,s*.18,.1),fore=bone(side+'ForeArm',arm,s*.28,0);bone(side+'Hand',fore,s*.25,0);
  const thigh=bone(side+'UpLeg',hips,s*.12,0),leg=bone(side+'Leg',thigh,0,-.43);bone(side+'Foot',leg,0,-.43,.03);
 }
 return createActor(model,{name:'test'});
}
test('aim turns the torso toward a target behind or beside the officer',()=>{
 for(const angle of [0,Math.PI/2,Math.PI,-2]){
  const a=actor(),target=new T.Vector3(Math.sin(angle)*5,1.2,Math.cos(angle)*5);
  poseAim(a,target);a.root.updateMatrixWorld(true);
  const forward=new T.Vector3(0,0,1).applyQuaternion(a.root.quaternion);
  assert.ok(forward.dot(target.clone().setY(0).normalize())>.99,'body must face target before arms reach');
  for(const side of ['Left','Right']){
   const hand=a.bones[side+'Hand'].getWorldPosition(new T.Vector3()).sub(a.root.position);
   assert.ok(hand.dot(forward)>.2,'hand remains in front of the chest');
  }
 }
});
test('recovery keeps palms supported early, plants unequal feet, and finishes upright',()=>{
 const a=actor();a.reaction={phase:'gettingUp',time:0,fallTime:.8,dx:0,dz:1,height:0,severity:.6,roll:.1};
 const read=()=>{a.root.updateMatrixWorld(true);return Object.fromEntries(['Hips','LeftHand','RightHand','LeftFoot','RightFoot'].map(n=>[n,a.bones[n].getWorldPosition(new T.Vector3())]));};
 poseReaction(a,params);const start=read();
 a.reaction.time=.35;poseReaction(a,params);const supported=read();
 assert.ok(supported.LeftHand.distanceTo(start.LeftHand)<.10,'palms support the first push rather than swing upward');
 a.reaction.time=.85;poseReaction(a,params);const kneel=read();
 assert.ok(Math.abs(kneel.LeftFoot.z-kneel.RightFoot.z)>.15,'one foot leads the kneeling recovery');
 a.reaction.time=1.45;poseReaction(a,params);const end=read();
 assert.ok(Math.abs(end.Hips.y-.95)<.02);assert.ok(Math.abs(a.root.rotation.x)<.001);
});
test('recovery is continuous at the fallen pose and keeps enlarged heads clear',()=>{
 for(const heading of [0,.8,Math.PI]){
  const a=actor();a.reaction={phase:'down',time:0,fallTime:.8,dx:Math.sin(heading),dz:Math.cos(heading),height:0,severity:.6,roll:.12};
  poseReaction(a,{size:2.1});a.root.updateMatrixWorld(true);const start=a.bones.Head.getWorldPosition(new T.Vector3());
  a.reaction.phase='gettingUp';poseReaction(a,{size:2.1});a.root.updateMatrixWorld(true);
  assert.ok(start.distanceTo(a.bones.Head.getWorldPosition(new T.Vector3()))<.002);
  for(let i=0;i<=60;i++){
   a.reaction.time=i*1.45/60;poseReaction(a,{size:2.1});a.root.updateMatrixWorld(true);
   const head=a.bones.Head.getWorldPosition(new T.Vector3());assert.ok(head.y>=.13*2.1,`head clips ground at ${i}: ${head.y}`);
  }
 }
});
test('impact begins in the current facing direction and buckles the legs asymmetrically',()=>{
 const a=actor();a.heading=Math.PI;a.root.rotation.y=Math.PI;
 a.reaction={phase:'falling',time:0,fallTime:.8,startHeading:Math.PI,dx:0,dz:1,height:0,severity:.6,roll:.1};
 poseReaction(a,params);const forward=new T.Vector3(0,0,1).applyQuaternion(a.root.quaternion);assert.ok(forward.z<-.99,'hit must not instantly flip the character');
 a.reaction.time=.3;poseReaction(a,params);a.root.updateMatrixWorld(true);
 const l=a.bones.LeftLeg.quaternion.angleTo(a.rest.find(x=>x.bone===a.bones.LeftLeg).q),r=a.bones.RightLeg.quaternion.angleTo(a.rest.find(x=>x.bone===a.bones.RightLeg).q);
 assert.ok(Math.abs(l-r)>.04,'knees should not collapse like a rigid symmetric hinge');
});
