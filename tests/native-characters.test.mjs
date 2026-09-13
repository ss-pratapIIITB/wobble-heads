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
