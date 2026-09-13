import * as T from 'three';
import {makeShot,shotHits,damagePlayer,resetHealth} from './combat.js';
import {segmentBox} from './camera.js';
import {beginImpact} from './impacts.js';

export function dressPolice(actor){
 actor.police=true;actor.name='Police officer';actor.fireCooldown=1.6;
 const navy=new T.MeshStandardMaterial({color:'#192e4a',roughness:.8}),gold=new T.MeshStandardMaterial({color:'#edc858',metalness:.4,roughness:.4});
 const add=(geo,mat,x,y,z)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);actor.root.add(m);return m;};
 // Accessories are updated from world-space bone anchors after posing.
 actor.policeCap=add(new T.CylinderGeometry(.11,.12,.065,12),navy,0,1.7,0);
 actor.policeBadge=add(new T.BoxGeometry(.09,.11,.025),gold,-.16,1.28,.18);
 actor.gun=new T.Group();const steel=new T.MeshStandardMaterial({color:'#22282d',metalness:.5,roughness:.5});
 const barrel=new T.Mesh(new T.BoxGeometry(.065,.085,.26),steel);barrel.position.z=.09;actor.gun.add(barrel);
 const grip=new T.Mesh(new T.BoxGeometry(.06,.13,.07),steel);grip.position.y=-.075;actor.gun.add(grip);actor.root.add(actor.gun);
}
const point=new T.Vector3(),accessoryQ=new T.Quaternion(),rootQ=new T.Quaternion(),offsetPoint=new T.Vector3();
export function updatePoliceAccessories(actor,size=2.1){
 actor.policeCap.scale.set(size,1,size);
 for(const [mesh,bone,offset] of [[actor.policeCap,actor.bones.Head,[0,.10*size,0]],[actor.policeBadge,actor.bones.Spine1||actor.bones.Spine,[-.10,0,.13]],[actor.gun,actor.bones.RightHand,[0,0,.05]]]){
  if(!mesh||!bone)continue;bone.getWorldPosition(point);
  if(mesh===actor.policeCap){bone.getWorldQuaternion(accessoryQ);offsetPoint.set(...offset).applyQuaternion(accessoryQ);point.add(offsetPoint);actor.root.getWorldQuaternion(rootQ);mesh.quaternion.copy(rootQ.invert()).multiply(accessoryQ);mesh.position.copy(actor.root.worldToLocal(point));}
  else{mesh.position.copy(actor.root.worldToLocal(point));mesh.position.x+=offset[0];mesh.position.y+=offset[1];mesh.position.z+=offset[2];}
 }
}
export class PoliceSystem{
 constructor(scene,blood){
  this.wanted=false;this.blood=blood;this.shots=0;this.hits=0;this.lines=[];
  for(let i=0;i<4;i++){const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(6),3));const line=new T.Line(geometry,new T.LineBasicMaterial({color:'#ffdf80'}));line.visible=false;scene.add(line);this.lines.push({line,life:0});}
 }
 reset(player){this.wanted=false;this.shots=this.hits=0;resetHealth(player);for(const t of this.lines){t.life=0;t.line.visible=false;}}
 update(dt,actors,player,cars){
  for(const t of this.lines){t.life-=dt;t.line.visible=t.life>0;}
  if(!player)return;
  for(const cop of actors){if(!cop.police)continue;cop.aiming=false;cop.fireCooldown=Math.max(0,(cop.fireCooldown||0)-dt);
   if(!this.wanted||player.dead||cop.reaction||cop.board||cop.vehicle)continue;
   const origin={x:cop.root.position.x,y:1.3,z:cop.root.position.z},target={x:player.root.position.x,y:player.root.position.y+(player.reaction?.phase==='down'?.32:1.12),z:player.root.position.z};
   const distance=Math.hypot(origin.x-target.x,origin.z-target.z);if(distance>26)continue;
   cop.heading=Math.atan2(target.x-origin.x,target.z-origin.z);cop.root.rotation.y=cop.heading;cop.aiming=true;cop.speed=0;
   if(cop.fireCooldown>0)continue;cop.fireCooldown=1.25+Math.random()*.5;
   const shot=makeShot(origin,target);let cover=1;
   for(const car of cars){
    const s=Math.sin(car.heading),c=Math.cos(car.heading),local=p=>{const x=p.x-car.root.position.x,z=p.z-car.root.position.z;return {x:x*c-z*s,y:p.y,z:x*s+z*c};};
    // Open cabins expose the occupant above the belt line; closed NPCs provide cover.
    const hit=segmentBox(local(shot.origin),local(shot.end),{x:-car.width/2,y:0,z:-car.length/2},{x:car.width/2,y:car.openTop?.90:1.85,z:car.length/2});
    if(hit!==null)cover=Math.min(cover,hit);
   }
   const hit=shotHits(shot,target,cover);this.shots++;
   const tracer=this.lines[this.shots%this.lines.length],p=tracer.line.geometry.attributes.position;
   const end=hit?target:{x:origin.x+(shot.end.x-origin.x)*cover,y:origin.y+(shot.end.y-origin.y)*cover,z:origin.z+(shot.end.z-origin.z)*cover};
   p.setXYZ(0,origin.x,origin.y,origin.z);p.setXYZ(1,end.x,end.y,end.z);p.needsUpdate=true;tracer.line.geometry.computeBoundingSphere();tracer.life=.09;tracer.line.visible=true;
   if(hit&&damagePlayer(player)){
    this.hits++;this.blood.burst(target.x,target.y,target.z,Math.sin(cop.heading),Math.cos(cop.heading));
    if(player.dead){
     const car=player.vehicle||player.board?.car;if(car){car.speed=0;car.driver=null;car.setDoor(0);player.root.position.copy(car.board.getWorldPosition(point));}
     player.vehicle=null;player.board=null;player.attack=null;player.reaction=null;player.hitCooldown=0;
     player.dead=false;beginImpact(player,{x:Math.sin(cop.heading),z:Math.cos(cop.heading)},3,cop.root.position);player.dead=true;player.mode='dead';
    }
   }
  }
 }
}
