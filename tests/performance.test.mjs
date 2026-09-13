import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
const api=await import('../prototype/js/performance.js').catch(()=>({}));
test('rigid batching cuts opaque draws without moving triangles or articulation markers',()=>{
 assert.equal(typeof api.batchRigidMeshes,'function');
 const root=new T.Group(),door=new T.Group(),material=new T.MeshStandardMaterial();root.add(door);door.position.set(2,1,3);
 for(let i=0;i<8;i++){const m=new T.Mesh(new T.BoxGeometry(1,1,1),material);m.position.set(i,0,0);root.add(m);}
 const panel=new T.Mesh(new T.BoxGeometry(.1,1,1),material);panel.position.z=-.5;door.add(panel);const marker=new T.Object3D();marker.position.z=-1;door.add(marker);
 const glass=new T.Mesh(new T.BoxGeometry(1,1,.01),new T.MeshBasicMaterial({transparent:true,opacity:.3}));root.add(glass);
 root.updateMatrixWorld(true);const before=new T.Box3().setFromObject(root),point=marker.getWorldPosition(new T.Vector3());
 api.batchRigidMeshes(root,new Set([door]));root.updateMatrixWorld(true);const after=new T.Box3().setFromObject(root);
 assert.ok(before.min.distanceTo(after.min)<1e-6&&before.max.distanceTo(after.max)<1e-6);
 assert.ok(point.distanceTo(marker.getWorldPosition(new T.Vector3()))<1e-6);
 assert.ok(root.children.includes(glass));let n=0;root.traverse(o=>{if(o.isMesh)n++});assert.ok(n<=3);
 door.rotation.y=1;root.updateMatrixWorld(true);assert.ok(point.distanceTo(marker.getWorldPosition(new T.Vector3()))>.5);
});
test('quality presets bound render pixels and shadows',()=>{
 assert.equal(typeof api.renderQuality,'function');
 const q=api.renderQuality('balanced',3);assert.ok(q.pixelRatio<=1.5);assert.ok(q.shadowSize<=1024);
 assert.ok(api.renderQuality('performance',3).pixelRatio<=1);
});
