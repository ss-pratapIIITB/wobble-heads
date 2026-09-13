import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';import {solveLimb} from '../prototype/js/characters.js';
test('limb targeting respects lengths on rotated rigs and reaches the contact point',()=>{
 for(const angle of [0,Math.PI,.73]){
 const root=new T.Group();root.rotation.y=angle;root.scale.setScalar(.85);
 const hip=new T.Bone(),knee=new T.Bone(),ankle=new T.Bone();root.add(hip);hip.add(knee);knee.add(ankle);hip.position.y=1;knee.position.y=-.5;ankle.position.y=-.5;
 root.updateMatrixWorld(true);const target=new T.Vector3(.1,.3,.4).applyAxisAngle(new T.Vector3(0,1,0),angle);
 solveLimb(hip,knee,ankle,target,new T.Vector3(0,1,2));root.updateMatrixWorld(true);
 const h=hip.getWorldPosition(new T.Vector3()),k=knee.getWorldPosition(new T.Vector3()),a=ankle.getWorldPosition(new T.Vector3());
 assert.ok(a.distanceTo(target)<.0001);assert.ok(Math.abs(h.distanceTo(k)-.425)<.0001);assert.ok(Math.abs(k.distanceTo(a)-.425)<.0001);
 }
});
