import {bodyHit} from './boxing.js';
import * as T from 'three';
import {makeShot,shotHits,damagePlayer,resetHealth,stepBurst} from './combat.js';
import {segmentBox} from './camera.js';
import {beginImpact} from './impacts.js';
import {poseAim} from './characters.js';
import {GunEffects,ShotAudio} from './gun-effects.js';

const point=new T.Vector3(),aimPoint=new T.Vector3();
export function dressPolice(actor){
 actor.police=true;actor.name='Police officer';actor.fireCooldown=.8;actor.recoil=0;actor.flashTime=0;
 const gold=new T.MeshStandardMaterial({color:'#d9b764',metalness:.6,roughness:.35});
 actor.policeBadge=new T.Mesh(new T.BoxGeometry(.07,.09,.015),gold);actor.root.add(actor.policeBadge);
 const steel=new T.MeshStandardMaterial({color:'#303840',metalness:.7,roughness:.3}),gripMat=new T.MeshStandardMaterial({color:'#171d23',roughness:.9});
 actor.gun=new T.Group();actor.gun.name='police-sidearm';actor.root.add(actor.gun);
 const part=(w,h,d,m,x,y,z)=>{const p=new T.Mesh(new T.BoxGeometry(w,h,d),m);p.position.set(x,y,z);actor.gun.add(p);return p;};
 actor.slide=part(.075,.075,.26,steel,0,.015,.10);part(.068,.045,.22,gripMat,0,-.043,.075);const grip=part(.064,.14,.09,gripMat,0,-.102,.01);grip.rotation.x=-.20;
 part(.012,.017,.025,gripMat,0,.06,.20);part(.045,.013,.025,gripMat,0,.06,-.005);
 const barrel=new T.Mesh(new T.CylinderGeometry(.017,.017,.035,10),gripMat);barrel.rotation.x=Math.PI/2;barrel.position.set(0,.015,.244);actor.gun.add(barrel);
 actor.muzzle=new T.Object3D();actor.muzzle.position.set(0,.015,.27);actor.gun.add(actor.muzzle);
 actor.muzzleFlash=new T.Group();actor.muzzleFlash.name='muzzle-flash';actor.muzzle.add(actor.muzzleFlash);
 const flashMat=new T.MeshBasicMaterial({color:'#ffe7a0',transparent:true,opacity:.9,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,toneMapped:false});
 for(const [radius,length] of [[.065,.27],[.035,.16]]){const flash=new T.Mesh(new T.ConeGeometry(radius,length,5,1,true),flashMat);flash.rotation.x=Math.PI/2;flash.position.z=length/2;actor.muzzleFlash.add(flash);}actor.muzzleFlash.visible=false;
}
export function updatePoliceAccessories(actor){
 const spine=actor.bones.Spine1||actor.bones.Spine;if(spine){spine.getWorldPosition(point);actor.policeBadge.position.copy(actor.root.worldToLocal(point));actor.policeBadge.position.add(new T.Vector3(-.10,0,.13));}
 const hand=actor.bones.RightHand;if(hand){hand.getWorldPosition(point);actor.gun.position.copy(actor.root.worldToLocal(point));}else actor.gun.position.set(0,1.3,.5);
 actor.gun.rotation.set(actor.aiming?0:.75,0,0);
 if(actor.aiming&&actor.aimTarget){actor.gun.updateWorldMatrix(true,false);actor.gun.lookAt(actor.aimTarget);actor.gun.rotateX(-actor.recoil*.12);}
 actor.slide.position.z=.10-actor.recoil*.028;actor.muzzleFlash.visible=actor.flashTime>0;
 actor.root.updateMatrixWorld(true);
}
export function coverFraction(from,to,cars){
 let fraction=1;
 for(const car of cars){const s=Math.sin(car.heading),c=Math.cos(car.heading),local=p=>{const x=p.x-car.root.position.x,z=p.z-car.root.position.z;return {x:x*c-z*s,y:p.y,z:x*s+z*c};};
  const hit=segmentBox(local(from),local(to),{x:-car.width/2,y:0,z:-car.length/2},{x:car.width/2,y:car.openTop?.90:1.85,z:car.length/2});if(hit!==null)fraction=Math.min(fraction,hit);
 }return fraction;
}
function targetPoint(player,out){return out.set(player.root.position.x,player.root.position.y+(player.reaction?.phase==='down'?.32:1.12),player.root.position.z);}
export class PoliceSystem{
 constructor(scene,blood,{random=Math.random}={}){this.wanted=false;this.blood=blood;this.shots=0;this.hits=0;this.effects=new GunEffects(scene);this.audio=new ShotAudio();this.random=random;}
 reset(player){this.wanted=false;this.sparring=false;this.shots=this.hits=0;resetHealth(player);this.effects.clear();}
 findObserver(actors,player,cars){
  if(this.sparring||!this.wanted||!player||player.dead)return null;
  targetPoint(player,aimPoint);
  for(const cop of actors){if(!cop.police||cop.reaction||cop.board||cop.vehicle)continue;point.set(cop.root.position.x,1.48,cop.root.position.z);if(point.distanceTo(aimPoint)<=26&&coverFraction(point,aimPoint,cars)>.999)return cop;}
  return null;
 }
 update(dt,actors,player,cars,{suspended=false}={}){
  this.effects.update(dt);
  for(const cop of actors)if(cop.police){cop.recoil=Math.max(0,(cop.recoil||0)-dt*7);cop.flashTime=Math.max(0,(cop.flashTime||0)-dt);if(cop.muzzleFlash)cop.muzzleFlash.visible=cop.flashTime>0;}
  if(!player||suspended)return;
  for(const cop of actors){if(!cop.police)continue;cop.aiming=false;
   const target=targetPoint(player,aimPoint).clone(),distance=cop.root.position.distanceTo(target);
   const ready=!this.sparring&&this.wanted&&!player.dead&&!cop.reaction&&!cop.board&&!cop.vehicle&&!cop.attack&&!(cop.hitstun>0)&&distance<26&&coverFraction({x:cop.root.position.x,y:cop.root.position.y+1.4,z:cop.root.position.z},target,cars)>.999;
   if(!ready){stepBurst(cop,dt,false,this.random);continue;}
   cop.heading=Math.atan2(target.x-cop.root.position.x,target.z-cop.root.position.z);cop.root.rotation.y=cop.heading;cop.aiming=true;cop.aimTarget=target;cop.speed=0;cop.poseDirty=true;
   if(!stepBurst(cop,dt,true,this.random))continue;
   // Pose the arms before sampling the muzzle so shots originate at the weapon,
   // including the first frame of an encounter and throttled NPC pose updates.
   if(cop.bones.RightHand)poseAim(cop,target,{recoil:cop.recoil});updatePoliceAccessories(cop);
   const origin=cop.muzzle.getWorldPosition(point).clone(),barrelTarget=origin.clone().addScaledVector(cop.muzzle.getWorldDirection(new T.Vector3()),30),shot=makeShot(origin,barrelTarget,this.random,1+(cop.recoil||0)*1.2);let cover=coverFraction(origin,shot.end,cars);
   if(shot.end.y<0&&origin.y>0)cover=Math.min(cover,origin.y/(origin.y-shot.end.y));
   let contact=null;for(const candidate of new Set([...actors,player])){if(candidate===cop||candidate.dead)continue;const entry=bodyHit(origin,shot.end,candidate);if(entry&&entry.fraction<cover&&(!contact||entry.fraction<contact.fraction))contact={...entry,actor:candidate};}
   const hit=!!contact;this.shots++;
   const end=hit?contact.point:{x:origin.x+(shot.end.x-origin.x)*cover,y:origin.y+(shot.end.y-origin.y)*cover,z:origin.z+(shot.end.z-origin.z)*cover};
   this.effects.shot(origin,end,!hit&&cover<1);this.audio.play(distance);cop.recoil=1;cop.flashTime=.045;cop.muzzleFlash.visible=true;
   if(hit&&contact.actor!==player){const victim=contact.actor;victim.health=Math.max(1,(victim.health??100)-18);victim.attack=null;victim.hitstun=.45;victim.fireCooldown=.8;this.blood.burst(end.x,end.y,end.z,Math.sin(cop.heading)*.3,Math.cos(cop.heading)*.3);if(victim.health<35){victim.hitCooldown=0;beginImpact(victim,{x:Math.sin(cop.heading),z:Math.cos(cop.heading)},2.5,cop.root.position);}}
   if(hit&&contact.actor===player&&damagePlayer(player)){
    this.hits++;player.hurt={x:Math.sin(cop.heading),z:Math.cos(cop.heading),time:.35};this.blood.burst(end.x,end.y,end.z,Math.sin(cop.heading),Math.cos(cop.heading));
    if(player.dead){
     const car=player.vehicle||player.board?.car;if(car){car.speed=0;car.driver=null;car.setDoor(0);player.root.position.copy(car.board.getWorldPosition(point));}
     player.vehicle=null;player.board=null;player.attack=null;player.reaction=null;player.hitCooldown=0;
     player.dead=false;beginImpact(player,{x:Math.sin(cop.heading),z:Math.cos(cop.heading)},3,cop.root.position);player.dead=true;player.mode='dead';
    }
   }
  }
 }
}
