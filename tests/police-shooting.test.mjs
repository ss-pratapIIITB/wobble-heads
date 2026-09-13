import test from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import * as combat from '../prototype/js/combat.js';
import {dressPolice,PoliceSystem} from '../prototype/js/police.js';
test('police equipment has a muzzle and no blue head accessory',()=>{
 const a={root:new T.Group(),bones:{}};dressPolice(a);assert.equal(a.policeCap,undefined);assert.ok(a.muzzle);assert.ok(a.muzzleFlash);assert.equal(a.muzzleFlash.visible,false);
});
test('police fire short three-shot bursts with a recovery interval at different frame rates',()=>{
 assert.equal(typeof combat.stepBurst,'function');
 for(const hz of [30,60,120]){const s={fireCooldown:.5};const times=[];for(let i=0;i<hz*2;i++)if(combat.stepBurst(s,1/hz,true,()=>.5))times.push(i/hz);
 assert.equal(times.length,3);assert.ok(times[1]-times[0]<.23);assert.ok(times[2]-times[1]<.23);
 combat.stepBurst(s,.1,false);assert.equal(s.burstRemaining,0);
 }
});
test('police notice requires line of sight and range',()=>{
 const system=new PoliceSystem(new T.Scene(),{burst(){}});system.wanted=true;
 const cop={police:true,root:new T.Group()},player={root:new T.Group()};player.root.position.z=10;
 assert.equal(system.findObserver([cop],player,[]),cop);
 const car={root:new T.Group(),heading:0,width:3,length:4,openTop:false};car.root.position.z=5;
 assert.equal(system.findObserver([cop],player,[car]),null);
 player.root.position.z=35;assert.equal(system.findObserver([cop],player,[]),null);
});
test('suspended cinematic combat never fires or damages the player',()=>{
 const system=new PoliceSystem(new T.Scene(),{burst(){}});system.wanted=true;
 const cop={police:true,root:new T.Group(),bones:{},fireCooldown:0},player={root:new T.Group(),health:100};dressPolice(cop);player.root.position.z=5;
 for(let i=0;i<300;i++)system.update(1/60,[cop],player,[],{suspended:true});
 assert.equal(system.shots,0);assert.equal(player.health,100);
});
test('visible tracers start at the weapon muzzle and effect pools stay bounded',()=>{
 const scene=new T.Scene(),system=new PoliceSystem(scene,{burst(){}},{random:()=>.5});system.wanted=true;
 const cop={root:new T.Group(),bones:{}},player={root:new T.Group(),health:100};dressPolice(cop);player.root.position.z=10;cop.fireCooldown=0;
 system.update(1/60,[cop],player,[]);assert.equal(system.shots,1);assert.ok(cop.recoil>0);assert.equal(cop.muzzleFlash.visible,true);
 const p=system.effects.lines[0].line.geometry.attributes.position,muzzle=cop.muzzle.getWorldPosition(new T.Vector3());
 assert.ok(Math.abs(p.getX(0)-muzzle.x)<1e-5);assert.ok(Math.abs(p.getY(0)-muzzle.y)<1e-5);assert.ok(Math.abs(p.getZ(0)-muzzle.z)<1e-5);
 const count=scene.children.length;for(let i=0;i<100;i++)system.effects.shot({x:0,y:1,z:0},{x:1,y:0,z:2},true);
 assert.equal(scene.children.length,count);assert.equal(system.effects.sparks.length,32);system.effects.update(1);assert.equal(system.effects.mesh.visible,false);
});
