import * as T from 'three';
import { stepHead, smooth, gaitSample } from './motion.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const Y=V(0,1,0);
function find(root,name){let bone;root.traverse(o=>{if(o.isBone&&o.name.replace(/^mixamorig:?/i,'').toLowerCase()===name.toLowerCase())bone=o;});return bone;}
// Solver scratch is private and reused; these functions are synchronous/re-entrant only
// at the actor-call level. Bone world matrices are refreshed once before posing.
const ik=Array.from({length:12},()=>new T.Vector3());
const parentQ=new T.Quaternion(),boneQ=new T.Quaternion(),deltaQ=new T.Quaternion();
const decomposeP=V(),decomposeS=V();
function position(bone,out){return out.setFromMatrixPosition(bone.matrixWorld);}
function rotation(bone,out){bone.matrixWorld.decompose(decomposeP,out,decomposeS);return out;}
function updateBone(bone){bone.updateMatrix();bone.matrixWorld.multiplyMatrices(bone.parent.matrixWorld,bone.matrix);}
function worldQuat(bone,q){rotation(bone.parent,parentQ);bone.quaternion.copy(parentQ.invert()).multiply(q);updateBone(bone);}
function aim(bone,child,target){
 const from=position(bone,ik[8]);const direction=position(child,ik[9]).sub(from).normalize();const to=ik[10].copy(target).sub(from).normalize();
 rotation(bone,boneQ);deltaQ.setFromUnitVectors(direction,to).multiply(boneQ);worldQuat(bone,deltaQ);
}
export function solveLimb(a,b,end,target,pole){
 if(!a||!b||!end)return;
 const p=position(a,ik[0]),mid=position(b,ik[1]),tip=position(end,ik[2]);
 const l1=p.distanceTo(mid),l2=mid.distanceTo(tip),axis=ik[3].copy(target).sub(p);
 const d=T.MathUtils.clamp(axis.length(),Math.abs(l1-l2)+.0001,l1+l2-.0001);axis.normalize();
 const bend=ik[4].copy(pole).sub(p);bend.addScaledVector(axis,-bend.dot(axis)).normalize();
 const along=(l1*l1-l2*l2+d*d)/(2*d),height=Math.sqrt(Math.max(0,l1*l1-along*along));
 const joint=ik[5].copy(p).addScaledVector(axis,along).addScaledVector(bend,height);
 const endGoal=ik[6].copy(p).addScaledVector(axis,d);
 aim(a,b,joint);updateBone(b);updateBone(end);aim(b,end,endGoal);updateBone(end);
}
export function prepareCharacter(model){
 const foot=find(model,'LeftFoot'),toe=find(model,'LeftToeBase');
 model.updateMatrixWorld(true);
 if(foot&&toe){const forward=toe.getWorldPosition(V()).sub(foot.getWorldPosition(V()));model.rotation.y-=Math.atan2(forward.x,forward.z);}
 model.updateMatrixWorld(true);
 let bounds=new T.Box3().setFromObject(model);const size=bounds.getSize(V());
 model.scale.multiplyScalar(1.73/size.y);model.updateMatrixWorld(true);bounds.setFromObject(model);
 const center=bounds.getCenter(V());model.position.add(V(-center.x,-bounds.min.y,-center.z));
 model.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>{m.envMapIntensity=.6;});}});
 model.updateMatrixWorld(true);
}
export function createActor(model,{name,x=0,z=0,heading=0,player=false}){
 const root=new T.Group();root.add(model);root.updateMatrixWorld(true);
 const bones={};for(const name of ['Hips','Spine','Spine1','Neck','Head','LeftUpLeg','LeftLeg','LeftFoot','RightUpLeg','RightLeg','RightFoot','LeftArm','LeftForeArm','LeftHand','RightArm','RightForeArm','RightHand'])bones[name]=find(model,name);
 const rest=[];model.traverse(o=>{if(o.isBone)rest.push({bone:o,q:o.quaternion.clone(),p:o.position.clone(),s:o.scale.clone()});});
 const local={};for(const [name,b] of Object.entries(bones))if(b)local[name]=b.getWorldPosition(V());
 const footQ={};for(const side of ['Left','Right'])footQ[side]=bones[side+'Foot']?.getWorldQuaternion(new T.Quaternion());
 const a={name,root,model,bones,rest,local,footQ,heading,player,mode:'idle',phase:0,speed:0,vy:0,y:0,grounded:true,vehicle:null,board:null,wait:0,waypoint:null,head:{x:0,z:0,vx:0,vz:0,phase:0}};
 root.position.set(x,0,z);root.rotation.y=heading;return a;
}
export function restoreActor(a){for(const r of a.rest){r.bone.quaternion.copy(r.q);r.bone.position.copy(r.p);r.bone.scale.copy(r.s);}a.root.updateMatrixWorld(true);}
export function localWorld(a,p){return p.clone().applyMatrix4(a.root.matrixWorld);}
function poseFoot(a,side,point,pole){
 const b=a.bones;solveLimb(b[side+'UpLeg'],b[side+'Leg'],b[side+'Foot'],point,pole);
 if(a.footQ[side])worldQuat(b[side+'Foot'],a.root.getWorldQuaternion(new T.Quaternion()).multiply(a.footQ[side]));
}
function poseHand(a,side,point,pole){const b=a.bones;solveLimb(b[side+'Arm'],b[side+'ForeArm'],b[side+'Hand'],point,pole);}
export function poseWalking(a,dt,params){
 const running=(a.mode==='fleeing'||a.mode==='run'),stride=running?.43:.30;
 if(!a.gait||a.gait.stride!==stride||a.gait.previous.distanceTo(a.root.position)>.75){
  a.gait={previous:a.root.position.clone(),stride,feet:{},weight:0};a.phase=.25;
 }
 const g=a.gait,dx=a.root.position.x-g.previous.x,dz=a.root.position.z-g.previous.z;
 const distance=dx*Math.sin(a.heading)+dz*Math.cos(a.heading);
 const moving=Math.hypot(dx,dz)>1e-6&&a.grounded;
 if(moving){a.phase+=distance/(4*stride);g.direction=Math.sign(distance);}
 g.previous.copy(a.root.position);
 const poseKey=`${a.mode}:${params.size}:${a.heading.toFixed(3)}`;
 if(!moving&&a.speed<.035&&a.grounded&&a.head.still>=.45&&a.lastPoseKey===poseKey&&!a.poseDirty)return;
 a.poseDirty=false;a.lastPoseKey=poseKey;
 restoreActor(a);
 g.weight+=(Number(moving)-g.weight)*(1-Math.exp(-18*dt));
 // Bend the knees enough to reach the planted foot instead of stretching the
 // straight bind-pose leg, which would otherwise drag even a correct IK target.
 const hips=a.bones.Hips;
 if(hips){const p=hips.getWorldPosition(V());p.y-=(running?.13:.065)*g.weight;hips.position.copy(hips.parent.worldToLocal(p));a.root.updateMatrixWorld(true);}
 for(const [side,offset] of [['Left',0],['Right',.5]]){
  const f=a.local[side+'Foot'];if(!f)continue;
  const sample=gaitSample(a.phase+offset,stride),sign=side==='Left'?1:-1;
  const foot=V(f.x*.85,f.y+sample.lift*g.weight,f.z+sample.z*g.weight);
  if(!a.grounded){foot.y+=side==='Left'?.18:.08;foot.z+=side==='Left'?.18:-.1;}
  let target=localWorld(a,foot),contact=g.feet[side];
  if(moving&&sample.stance){
   if(contact?.stance&&contact.contact===sample.contact&&contact.point.distanceTo(target)<.35)target.copy(contact.point);
  }
  g.feet[side]={stance:sample.stance&&a.grounded,contact:sample.contact,point:target.clone()};
  poseFoot(a,side,target,localWorld(a,V(sign*.16,.65,1)));
  const shoulder=a.local[side+'Arm'];
  if(shoulder){const hand=V(shoulder.x+sign*.06,a.local.Hips.y+.02,shoulder.z-sample.z*g.weight*.68);
   poseHand(a,side,localWorld(a,hand),localWorld(a,V(sign*.5,.9,-.5)));}
 }
 stepHead(a.head,dt,moving?a.speed:0,params);applyHead(a,params.size);
}
function applyHead(a,size){
 const head=a.bones.Head;if(!head)return;
 head.scale.multiplyScalar(size);
 const q=head.getWorldQuaternion(new T.Quaternion());
 const rotation=new T.Quaternion().setFromEuler(new T.Euler(a.head.x,0,a.head.z));
 const rq=a.root.getWorldQuaternion(new T.Quaternion());rotation.premultiply(rq).multiply(rq.clone().invert());
 worldQuat(head,rotation.multiply(q));
}
export function setHipWorld(a,point,heading){
 a.gait=null;
 a.heading=heading;a.root.rotation.set(0,heading,0);
 a.root.position.copy(point).sub(a.local.Hips.clone().applyAxisAngle(Y,heading));a.root.updateMatrixWorld(true);
}
export function poseBoarding(a,car,p,params,dt){
 const poseKey=`seat:${params.size}:${car.steering.rotation.z.toFixed(2)}`;
 const seated=p.seat===1&&p.turn===1&&p.door===0;
 if(seated&&a.head.still>=.45&&a.lastPoseKey===poseKey&&!a.poseDirty)return;
 a.poseDirty=false;a.lastPoseKey=seated?poseKey:null;
 restoreActor(a);
 const carPoint=(x,y,z)=>car.root.localToWorld(V(x,y,z));
 const seat=car.seat.position;
 // Leading foot lands before hips descend; the outside foot stays planted until then.
 for(const side of ['Left','Right']){
  const lead=side==='Right',t=lead?p.lead:p.trail;
  const sign=side==='Left'?1:-1;
  const outside=carPoint(car.board.position.x+(lead?-.10:.10),a.local[side+'Foot'].y,car.board.position.z+sign*.12);
  const inside=carPoint(seat.x+sign*.115,car.floorY+.14,.34);
  const foot=outside.lerp(inside,t);foot.y+=Math.sin(t*Math.PI)*(car.type==='jeep'?.31:.23);
  const knee=carPoint(seat.x+sign*.18,seat.y,.9);
  poseFoot(a,side,foot,knee);
  const wheel=car.steering.localToWorld(V(sign*.15,.02,0));
  const shoulder=a.bones[side+'Arm']?.getWorldPosition(V());
  if(shoulder){
   const hang=shoulder.clone().add(V(0,-.46,0));
   const door=car.handle.getWorldPosition(V());
   const reach=side==='Left'?hang.lerp(door,p.reach):hang;
   reach.lerp(wheel,smooth((p.turn-.25)/.75));
   poseHand(a,side,reach,carPoint(seat.x+sign*.43,seat.y+.12,.03));
  }
 }
 stepHead(a.head,dt,0,params);applyHead(a,params.size);
}

// Directional articulated fall; ground and recovery targets are expressed in the
// actor's bind-facing space, so the same pose works across the three skeletons.
export function poseReaction(a,params){
 const r=a.reaction;if(!r)return;
 a.gait=null;
 a.lastPoseKey=null;
 const falling=r.phase==='falling',rising=r.phase==='gettingUp';
 const fall=falling?smooth(r.time/r.fallTime):1;
 const rise=rising?smooth(r.time/1.45):0;
 const tilt=1.48*fall*(1-rise);
 a.heading=Math.atan2(r.dx,r.dz);
 a.root.rotation.set(0,a.heading,0);a.root.rotateX(tilt);
 a.root.rotateZ((r.roll||0)*fall*(1-rise)+Math.sin(fall*Math.PI)*.12*r.severity*(1-rise));
 a.root.position.y=(a.local.Hips?.y||.9)*(1-Math.cos(tilt))+(r.height||0);
 restoreActor(a);
 for(const [side,sign] of [['Left',1],['Right',-1]]){
  const f=a.local[side+'Foot'];if(!f)continue;
  const crouch=(rising?Math.sin(rise*Math.PI):.35*fall)*(1-rise);
  const foot=V(f.x*1.25,f.y+crouch*.34,f.z+fall*.10*(1-rise)+crouch*.18);
  poseFoot(a,side,localWorld(a,foot),localWorld(a,V(sign*.25,.55,1)));
  const shoulder=a.local[side+'Arm'];if(!shoulder)continue;
  const brace=fall*(1-rise);
  const hand=V(shoulder.x+sign*(.06+.16*brace),a.local.Hips.y+.02+.29*brace,.20*brace);
  poseHand(a,side,localWorld(a,hand),localWorld(a,V(sign*.65,1.08,-.12)));
 }
 // Small head recoil settles during the fall; no walking oscillator on the ground.
 a.head.x=falling?Math.sin(fall*Math.PI)*.12:0;a.head.z=0;a.head.vx=a.head.vz=0;
 applyHead(a,params.size);
 // Keep feet, hands and the enlarged head above the ground without a mesh scan.
 a.root.updateMatrixWorld(true);let lowest=Infinity;
 for(const name of ['Head','Hips','LeftFoot','RightFoot','LeftHand','RightHand']){
  const bone=a.bones[name];if(!bone)continue;
  const radius=name==='Head'?.13*params.size:name==='Hips'?.14:.035;
  lowest=Math.min(lowest,bone.getWorldPosition(ik[11]).y-radius);
 }
 const ground=.015+(r.height||0);
 if(Number.isFinite(lowest))a.root.position.y+=(ground-lowest)*(lowest<ground?1:fall*(1-rise));
}
export function poseStrike(a,target,progress){
 a.root.updateMatrixWorld(true);
 const weight=Math.sin(Math.min(1,progress)*Math.PI);
 const hand=a.bones.RightHand;if(!hand)return;
 const start=hand.getWorldPosition(V());start.lerp(target,weight);
 poseHand(a,'Right',start,localWorld(a,V(-.55,1.05,.5)));
 a.poseDirty=true;
}

export function poseAim(a,target){
 const forward=target.clone().sub(a.root.position);forward.y=0;forward.normalize();
 const hand=a.root.position.clone().addScaledVector(forward,.58);hand.y=1.30;
 poseHand(a,'Right',hand,localWorld(a,V(-.45,1.1,.35)));
 poseHand(a,'Left',hand.clone().add(V(.05,-.04,0)),localWorld(a,V(.45,1.1,.35)));
 a.poseDirty=true;
}
