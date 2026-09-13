import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
const api=await import('../prototype/js/vehicles.js').catch(()=>({}));
test('both open cars have an empty cabin and working outward front hinges',()=>{
 assert.equal(typeof api.createVehicle,'function');
 for(const type of ['jeep','mini']){
  const c=api.createVehicle(type);c.root.updateMatrixWorld(true);
  assert.equal(c.wheels.length,4);assert.equal(c.openTop,true);
  // A downward ray through the middle of the cabin must reach seat/floor, not a roof.
  const ray=new THREE.Raycaster(new THREE.Vector3(.1,4,-.3),new THREE.Vector3(0,-1,0));
  const hits=ray.intersectObjects(c.root.children,true);
  assert.ok(hits.length>0);assert.ok(hits[0].point.y<1.2);
  const handle=c.handle.getWorldPosition(new THREE.Vector3());
  c.doorPivot.rotation.y=-1.15;c.root.updateMatrixWorld(true);
  const opened=c.handle.getWorldPosition(new THREE.Vector3());
  assert.ok(opened.x>handle.x+.5);
  assert.ok(c.board.position.x>c.width/2+.5);
  assert.ok(c.seat.position.y>c.floorY);
  for(const w of c.wheels)assert.ok(w.children.length>1,'rim and tire rotate together');
 }
});
test('traffic has three distinct closed-body models',()=>{
 assert.equal(typeof api.createVehicle,'function');
 for(const type of ['sedan','hatch','van']){
  const c=api.createVehicle(type);assert.equal(c.openTop,false);assert.equal(c.type,type);
  assert.equal(c.wheels.length,4);
 }
});
test('vehicles expose racing profiles and only cockpit cars are player usable',()=>{
 const expected={
  jeep:[8,4,3.5,true],mini:[8,4,3.5,true],sports:[24,9,5,true],
  sedan:[8,4,3.5,false],hatch:[8,4,3.5,false],van:[8,4,3.5,false]
 };
 for(const [type,[maxSpeed,acceleration,reverseSpeed,playerUsable]] of Object.entries(expected)){
  const c=api.createVehicle(type);
  assert.deepEqual([c.maxSpeed,c.acceleration,c.reverseSpeed,c.playerUsable],[maxSpeed,acceleration,reverseSpeed,playerUsable],type);
 }
});
test('sports coupe is low and wide with a usable cabin and clear door sweep',()=>{
 const c=api.createVehicle('sports',undefined,{batch:false});c.root.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(c.root),size=bounds.getSize(new THREE.Vector3());
 assert.ok(c.width>=2,'sports body should be wide');
 assert.ok(size.y<1.55,`sports silhouette should stay low; got ${size.y}`);
 assert.ok(c.seat&&c.steering&&c.handle&&c.doorPivot,'sports cabin must expose entry markers');
 assert.ok(c.seat.position.y>c.floorY);
 const seats=[];c.root.traverse(o=>{if(o.userData.vehiclePart==='seatBase')seats.push(o);});
 assert.equal(seats.length,2,'sports coupe should have a two-seat cockpit');
 const door=c.doorPivot.children.find(o=>o.name==='door');assert.ok(door);
 for(let i=0;i<=30;i++){
  c.setDoor(i/30);c.root.updateMatrixWorld(true);
  for(let j=0;j<=20;j++){
   const edge=c.doorPivot.localToWorld(new THREE.Vector3(.06,0,-1.39*j/20));
   const distance=Math.hypot(edge.x-c.board.position.x,edge.z-c.board.position.z);
   assert.ok(distance>.30,`sports: door must clear the standing body; got ${distance}`);
  }
 }
});
test('sports front side glazing opens with the door and leaves no static pane across the doorway',()=>{
 const c=api.createVehicle('sports',undefined,{batch:false}),front=[];
 c.root.traverse(o=>{if(o.userData.vehiclePart==='frontDoorWindow')front.push(o);});
 assert.equal(front.length,2,'sports should have one moving front pane per door');
 assert.ok(front.includes(c.doorPivot.children.find(o=>o.userData.vehiclePart==='frontDoorWindow')));
 c.setDoor(1);c.root.updateMatrixWorld(true);
 const ray=new THREE.Raycaster(new THREE.Vector3(c.width/2+.45,1.05,-.25),new THREE.Vector3(-1,0,0),0,.8);
 const fixedWindows=[];c.root.traverse(o=>{if(o.isMesh&&o.userData.vehiclePart==='window')fixedWindows.push(o);});
 assert.equal(ray.intersectObjects(fixedWindows,false).length,0,'static glazing must not span the open front doorway');
});
test('locked traffic uses opaque dark glazing and substantially less geometry',()=>{
 const triangles=root=>{let n=0;root.traverse(o=>{if(o.isMesh)n+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;});return n;};
 const sports=api.createVehicle('sports',undefined,{batch:false});
 for(const type of ['sedan','hatch','van']){
  const c=api.createVehicle(type,undefined,{batch:false}),windows=[];
  c.root.traverse(o=>{if(o.userData.vehiclePart==='window')windows.push(o);});
  assert.ok(windows.length>=3,`${type}: expected marked glazing`);
  for(const window of windows){
   assert.equal(window.material.transparent,false,`${type}: locked glass must be opaque`);
   assert.ok(window.material.color.getHex()<0x303030,`${type}: locked glass must be dark`);
  }
  assert.ok(triangles(c.root)<triangles(sports.root)*.8,`${type}: hidden cabin geometry should be omitted`);
 }
});
test('standing contact point stays outside the entire door sweep',()=>{
 for(const type of ['jeep','mini']){
  const c=api.createVehicle(type),door=c.doorPivot.children.find(o=>o.name==='door');
  for(let i=0;i<=30;i++){
   c.setDoor(i/30);c.root.updateMatrixWorld(true);
   for(let j=0;j<=20;j++){
    const edge=c.doorPivot.localToWorld(new THREE.Vector3(.06,0,-1.39*j/20));
    const distance=Math.hypot(edge.x-c.board.position.x,edge.z-c.board.position.z);
    assert.ok(distance>.30,`${type}: door must clear the standing body; got ${distance}`);
   }
  }
 }
});
