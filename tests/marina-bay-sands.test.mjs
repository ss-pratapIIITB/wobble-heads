import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {createMarinaBaySands,MBS_DIMENSIONS} from '../prototype/js/marina-bay-sands.js';
test('Marina Bay Sands has finite geometry, hotel-scale proportions and a bounded draw budget',()=>{
 const {root}=createMarinaBaySands(),bounds=new T.Box3().setFromObject(root),size=bounds.getSize(new T.Vector3());
 assert.ok(size.x>320&&size.x<360);assert.ok(size.y>205&&size.y<220);assert.equal(MBS_DIMENSIONS.poolLength,150);
 let triangles=0,meshes=0;root.traverse(o=>{if(!o.isMesh)return;meshes++;const p=o.geometry.attributes.position;triangles+=p.count/3;for(const v of p.array)assert.ok(Number.isFinite(v));});
 assert.ok(meshes<=10);assert.ok(triangles<60000);assert.ok(root.getObjectByName('MBS water'));assert.ok(root.getObjectByName('MBS green'));
});
