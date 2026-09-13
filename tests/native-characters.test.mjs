import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {createNativeActor,poseNative} from '../prototype/js/native-characters.js';
test('native NPC head scale stays bounded through clip changes and reactions',()=>{
 const model=new T.Group(),head=new T.Bone();head.name='Head';head.position.y=1.5;model.add(head,new T.Mesh(new T.BoxGeometry(.4,1.7,.3),new T.MeshBasicMaterial()));
 const clips=['Idle','Walk','Run','Death'].map(name=>new T.AnimationClip(name,1,[new T.QuaternionKeyframeTrack('Head.quaternion',[0,1],[0,0,0,1,0,0,0,1])]));
 const a=createNativeActor(model,clips,{name:'Test NPC'}),params={size:2.1};
 for(const speed of [0,1.35,3.7]){a.speed=speed;for(let i=0;i<100;i++)poseNative(a,1/60,params);assert.ok(Math.abs(head.scale.x-2.1)<1e-6);}
 a.reaction={phase:'down',time:0,fallTime:.8,height:0};poseNative(a,.1,params);assert.equal(a.native.key,'Death');assert.equal(head.scale.x,2.1);
 a.reaction=null;a.speed=0;for(let i=0;i<60;i++)poseNative(a,1/60,params);assert.equal(a.head.x,0);assert.equal(a.head.z,0);
});
test('a held native death pose is retained on repeated down frames',()=>{
 const model=new T.Group(),body=new T.Bone();body.name='Body';model.add(body,new T.Mesh(new T.BoxGeometry(.4,1.7,.3),new T.MeshBasicMaterial()));
 const death=new T.AnimationClip('Death',1,[new T.NumberKeyframeTrack('Body.rotation[x]',[0,1],[0,1])]);
 const a=createNativeActor(model,[death],{name:'Fall'});a.reaction={phase:'down',time:0,fallTime:.8,height:0};
 poseNative(a,.1,{size:2.1});const first=body.rotation.x;poseNative(a,.1,{size:2.1});assert.ok(first>.9);assert.equal(body.rotation.x,first);
});
test('native recovery plays the grounded half of Roll forward instead of reversing Death',()=>{
 const model=new T.Group(),body=new T.Bone();body.name='Body';model.add(body,new T.Mesh(new T.BoxGeometry(.4,1.7,.3),new T.MeshBasicMaterial()));
 const death=new T.AnimationClip('Death',1,[new T.NumberKeyframeTrack('Body.rotation[x]',[0,1],[0,1])]);
 // Deliberately make Roll's midpoint disagree with Death's endpoint. The real
 // Quaternius clips have the same kind of discontinuity, so entry must blend.
 const roll=new T.AnimationClip('Roll',2,[new T.NumberKeyframeTrack('Body.rotation[x]',[0,1,2],[0,-1,0])]);
 const a=createNativeActor(model,[death,roll],{name:'Recover'}),params={size:2.1};
 a.reaction={phase:'down',time:0,fallTime:.8,height:0};poseNative(a,0,params);const heldTilt=body.rotation.x;
 a.reaction={phase:'gettingUp',time:0,fallTime:.8,height:0};poseNative(a,0,params);
 const earlyTime=a.native.action.time,earlyTilt=body.rotation.x;
 assert.equal(a.native.key,'recover:Roll');assert.ok(earlyTime>=roll.duration*.48);
 assert.ok(Math.abs(earlyTilt-heldTilt)<.01,'recovery must start from the held Death pose without a snap');
 a.reaction.time=.14;poseNative(a,0,params);assert.ok(body.rotation.x<heldTilt&&body.rotation.x>-.95,'early recovery should blend between clips');
 a.reaction.time=1.4;poseNative(a,0,params);
 assert.ok(a.native.action.time>earlyTime,'recovery animation must advance forward');
 assert.ok(a.native.action.time>roll.duration*.98,'recovery should reach Roll end before the fleeing Run transition');
 assert.ok(Math.abs(body.rotation.x)<Math.abs(earlyTilt),'the authored roll should finish upright');
});
test('a second impact restores Death weight after an earlier recovery blend',()=>{
 const model=new T.Group(),body=new T.Bone();body.name='Body';model.add(body,new T.Mesh(new T.BoxGeometry(.4,1.7,.3),new T.MeshBasicMaterial()));
 const track=(name,end)=>new T.AnimationClip(name,1,[new T.NumberKeyframeTrack('Body.rotation[x]',[0,1],[0,end])]);
 const a=createNativeActor(model,[track('Death',1),track('Roll',0),track('Run',.1)],{name:'Repeat'}),params={size:2.1};
 a.reaction={phase:'gettingUp',time:1.45,fallTime:.8,height:0};poseNative(a,0,params);
 a.reaction={phase:'fleeing',time:0,fallTime:.8,height:0};a.speed=3.7;poseNative(a,0,params);
 a.reaction={phase:'down',time:0,fallTime:.8,height:0};poseNative(a,0,params);
 assert.equal(a.native.key,'Death');assert.equal(a.native.action.getEffectiveWeight(),1);
 assert.ok(body.rotation.x>.9,'reused Death action must remain visible on the second impact');
});
test('Death-only fallback never blends an animation action with itself',()=>{
 const model=new T.Group(),body=new T.Bone();body.name='Body';model.add(body,new T.Mesh(new T.BoxGeometry(.4,1.7,.3),new T.MeshBasicMaterial()));
 const death=new T.AnimationClip('Death',1,[new T.NumberKeyframeTrack('Body.rotation[x]',[0,1],[0,1])]);
 const a=createNativeActor(model,[death],{name:'Fallback'});a.reaction={phase:'gettingUp',time:.2,fallTime:.8,height:0};
 poseNative(a,0,{size:2.1});
 assert.equal(a.native.recoveryFrom,null);assert.equal(a.native.action.getEffectiveWeight(),1);assert.ok(body.rotation.x>.9);
});
