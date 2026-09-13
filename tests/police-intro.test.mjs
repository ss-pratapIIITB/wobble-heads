import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {PoliceIntro} from '../prototype/js/police-intro.js';

function actorAt(x=2,y=0,z=-3){const root=new THREE.Group();root.position.set(x,y,z);return {root,health:100,wanted:true};}

test('police introduction lasts 3.6 seconds and completes exactly one orbit',()=>{
 const scene=new THREE.Scene(),intro=new PoliceIntro(scene),actor=actorAt();
 assert.equal(intro.start(actor),true);assert.equal(intro.active,true);assert.equal(intro.progress,0);
 const start=intro.camera({}),startHeight=start.y;
 intro.update(1.8);const halfway=intro.camera({});
 assert.ok(Math.hypot(start.x-halfway.x,start.z-halfway.z)>7,'half orbit should reach the opposite side');
 assert.notEqual(halfway.y,startHeight,'orbit should include a dynamic height change');
 intro.update(1.799);assert.equal(intro.active,true);
 intro.update(.001-5e-10);assert.equal(intro.active,true,'intro must not finish before exactly 3.6 seconds');
 intro.update(5e-10);assert.equal(intro.active,false);assert.equal(intro.progress,1);
 const end=intro.camera({});
 assert.ok(Math.hypot(start.x-end.x,start.z-end.z)<1e-9,'one orbit must end at its starting azimuth');
 assert.deepEqual([end.lookX,end.lookY,end.lookZ],[start.lookX,start.lookY,start.lookZ]);
 assert.equal(intro.returnDuration,.6);
});

test('intro owns only visuals and reuses a bounded spark pool',()=>{
 const scene=new THREE.Scene(),intro=new PoliceIntro(scene),actor=actorAt();
 const position=actor.root.position.clone(),quaternion=actor.root.quaternion.clone(),state={health:actor.health,wanted:actor.wanted};
 assert.equal(intro.sparkMesh.count,32);const buffer=intro.sparkMesh.instanceMatrix.array;
 intro.start(actor);intro.update(1.25);intro.camera({});intro.update(.5);
 assert.strictEqual(intro.sparkMesh.instanceMatrix.array,buffer,'updates must reuse the instance buffer');
 assert.ok(actor.root.position.equals(position));assert.ok(actor.root.quaternion.equals(quaternion));
 assert.deepEqual({health:actor.health,wanted:actor.wanted},state);
 intro.cancel();assert.equal(intro.active,false);assert.equal(intro.actor,null);assert.equal(intro.sparkMesh.visible,false);
});

test('start validates actors, resets state, and cancel is idempotent',()=>{
 const intro=new PoliceIntro(new THREE.Scene());
 assert.equal(intro.start(null),false);assert.equal(intro.start({}),false);
 const first=actorAt(),second=actorAt(8,0,4);
 assert.equal(intro.start(first),true);intro.update(2);assert.ok(intro.progress>.5);
 assert.equal(intro.start(second),true);assert.equal(intro.actor,second);assert.equal(intro.progress,0);
 intro.cancel();intro.cancel();assert.equal(intro.active,false);assert.equal(intro.overlay,null,'Node tests must not require a DOM');
});

test('reduced motion uses a short static reveal',()=>{
 const intro=new PoliceIntro(new THREE.Scene(),{reducedMotion:true}),actor=actorAt();intro.start(actor);
 const start=intro.camera({});intro.update(.4);const middle=intro.camera({});
 assert.deepEqual([middle.x,middle.y,middle.z],[start.x,start.y,start.z]);
 assert.equal(intro.active,true);intro.update(.4);assert.equal(intro.active,false);assert.equal(intro.progress,1);
});

test('camera keeps its start target even if the actor later moves',()=>{
 const intro=new PoliceIntro(new THREE.Scene()),actor=actorAt();intro.start(actor);const before=intro.camera({});
 actor.root.position.set(30,4,20);intro.update(1);const after=intro.camera({});
 assert.deepEqual([after.lookX,after.lookY,after.lookZ],[before.lookX,before.lookY,before.lookZ]);
});

test('DOM overlay has exact titles, parent-owned skip, and safe visibility lifecycle',()=>{
 class FakeElement{
  constructor(tag){this.tag=tag;this.children=[];this.listeners={};this.hidden=false;this.classList={toggle:()=>{}};}
  setAttribute(name,value){this[name]=value;}
  addEventListener(name,fn){this.listeners[name]=fn;}
  append(...children){this.children.push(...children);}
 }
 const previous=globalThis.document,body=new FakeElement('body');
 globalThis.document={body,createElement:tag=>new FakeElement(tag)};
 try{
  let skips=0;const intro=new PoliceIntro(new THREE.Scene(),{onSkip:()=>skips++}),actor=actorAt();
  assert.equal(intro.overlay.children[1].textContent,'POLICE');
  assert.equal(intro.overlay.children[2].textContent,'YOU HAVE THEIR ATTENTION');
  intro.start(actor);assert.equal(intro.overlay.hidden,false);
  intro.overlay.children[3].listeners.click();assert.equal(skips,1);assert.equal(intro.active,true,'skip callback leaves cancellation to parent');
  intro.cancel();assert.equal(intro.overlay.hidden,true);
 }finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
