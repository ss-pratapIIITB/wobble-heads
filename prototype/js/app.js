import {createMerlion} from './merlion.js';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {clone as cloneSkinned} from 'three/addons/utils/SkeletonUtils.js';
import {createVehicle} from './vehicles.js';
import {prepareCharacter,createActor,poseWalking,poseBoarding,setHipWorld,poseReaction,poseStrike,poseAim} from './characters.js';
import {clamp,smooth,wrap,boardingPose,trafficGap,stepSprint} from './motion.js';
import {batchRigidMeshes,renderQuality,FrameMeter} from './performance.js';
import {chaseTarget,followYaw,segmentBox} from './camera.js';
import {sweptVehicleHit,beginImpact,stepReaction,advanceImpulse} from './impacts.js';
import {BloodEffects} from './effects.js';
import {createNativeActor,poseNative} from './native-characters.js';
import {PoliceSystem,dressPolice,updatePoliceAccessories} from './police.js';
import {PoliceIntro} from './police-intro.js';

const $=id=>document.getElementById(id),V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
const canvas=$('c'),renderer=new T.WebGLRenderer({canvas,antialias:true});
let quality=renderQuality('performance',devicePixelRatio);
renderer.setPixelRatio(quality.pixelRatio);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;
const scene=new T.Scene();scene.background=new T.Color('#b7c7ce');scene.fog=new T.Fog('#b7c7ce',42,110);
const pmrem=new T.PMREMGenerator(renderer),env=new RoomEnvironment();scene.environment=pmrem.fromScene(env,.04).texture;env.dispose();pmrem.dispose();
scene.add(new T.HemisphereLight('#e4efff','#7a6953',1.15));
const sun=new T.DirectionalLight('#fff3df',2.1);sun.position.set(-12,20,8);sun.castShadow=true;sun.shadow.mapSize.set(quality.shadowSize,quality.shadowSize);sun.shadow.normalBias=.025;
Object.assign(sun.shadow.camera,{left:-25,right:25,top:25,bottom:-25,near:.5,far:65});scene.add(sun);
const camera=new T.PerspectiveCamera(55,1,.1,180);
const cam={yaw:0,height:3.05,back:5.2,zoom:1,inspect:null,orbitUntil:0,heightOffset:0};
const stage=new T.Group();stage.name="static-yard";scene.add(stage);
function addMesh(g,m,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.receiveShadow=true;stage.add(o);return o;}
const materials=new Map();const mat=(color,roughness=.9)=>{const key=color+roughness;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness}));return materials.get(key);};
addMesh(new T.PlaneGeometry(260,260),mat('#8c9787')).rotation.x=-Math.PI/2;
const pad=addMesh(new T.CircleGeometry(12.8,96),mat('#737a79'),0,.012,0);pad.rotation.x=-Math.PI/2;
const ring=addMesh(new T.RingGeometry(14,20,128),mat('#41494b'),0,.025,0);ring.rotation.x=-Math.PI/2;
for(const r of [14.15,19.85]){const line=addMesh(new T.RingGeometry(r,r+.07,128),mat('#d4d5bc'),0,.03,0);line.rotation.x=-Math.PI/2;}
const stripeMat=mat('#dedcc6');for(let i=0;i<64;i++){const a=i*Math.PI*2/64;const dash=addMesh(new T.BoxGeometry(.07,.01,.64),stripeMat,Math.cos(a)*17,.045,Math.sin(a)*17);dash.rotation.y=-a;}
// Quiet parking markings give the car shapes a scale reference.
for(const x of [-5.0,-1.4,1.4,5])addMesh(new T.BoxGeometry(.055,.01,5.1),stripeMat,x,.035,3.3);
for(const x of [-3.2,3.2])addMesh(new T.BoxGeometry(3.6,.01,.055),stripeMat,x,.035,5.85);
for(let i=0;i<18;i++){
 const a=i*Math.PI*2/18,r=23.5;
 const planter=addMesh(new T.CylinderGeometry(.55,.42,.44,12),mat('#93998e'),Math.cos(a)*r,.22,Math.sin(a)*r);planter.castShadow=true;
 const shrub=addMesh(new T.IcosahedronGeometry(.75,1),mat(i%2?'#667858':'#526c52'),Math.cos(a)*r,.94,Math.sin(a)*r);shrub.scale.y=1.25;shrub.castShadow=true;
}
batchRigidMeshes(stage);
const blood=new BloodEffects(scene),meter=new FrameMeter(),police=new PoliceSystem(scene,blood);
const intro=new PoliceIntro(scene,{onSkip:()=>finishIntro(),reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});
let introSeen=false,introReturn=0,introReturning=false;
const introView={},introLastView={},introOrigin=V(),introLook=V();
function finishIntro(){if(!intro.active)return;intro.cancel();introReturn=0;introReturning=true;document.body.classList.remove('is-police-intro');for(const k in keys)keys[k]=false;canvas.focus();}
function startIntro(cop){if(!intro.start(cop))return;intro.camera(introLastView);introSeen=true;introReturning=false;cam.inspect=null;cop.introHeading=Math.atan2(player.root.position.x-cop.root.position.x,player.root.position.z-cop.root.position.z);cop.aiming=true;cop.fireCooldown=.65;cop.burstRemaining=0;document.body.classList.add('is-police-intro');for(const k in keys)keys[k]=false;walkDemo=runDemo=demoDrive=0;}
let merlion;
const cars=[],actors=[],traffic=[],trafficAngles=new Float64Array(6);
let player,selected,trafficEnabled=true,walkDemo=0,runDemo=0,elapsed=0,demoDrive=0,lastVictim=null,simulationSpeed=1;
const impactDelta={x:0,z:0},cameraView={},cameraAnchor=V(),cameraDesired=V(),cameraLook=V();
function parked(type,x,z,heading){const c=createVehicle(type);c.root.position.set(x,0,z);c.heading=heading;c.root.rotation.y=heading;c.spawn={x,z,heading};c.name=type==='jeep'?'Trail / open 4×4':type==='sports'?'Veloce / racing coupe':'Coast / cabrio';scene.add(c.root);cars.push(c);return c;}
const jeep=parked('jeep',-3.2,3.2,Math.PI),mini=parked('mini',3.2,3.2,Math.PI),sports=parked('sports',8,3.2,Math.PI);
for(const [i,type] of ['sedan','hatch','van','sedan','hatch','van'].entries()){
 const c=createVehicle(type,['#667f90','#c5a751','#c7c4b7','#774e46','#829681','#627475'][i]);
 c.angle=i*Math.PI/3;c.radius=18.35;c.cruise=2.0+(i%3)*.2;c.npc=true;c.speed=0;traffic.push(c);scene.add(c.root);placeTraffic(c);

}
function placeTraffic(c){c.root.position.set(Math.cos(c.angle)*c.radius,0,Math.sin(c.angle)*c.radius);c.heading=-c.angle;c.root.rotation.y=c.heading;}
function strikeWithVehicle(car,from,to,speed){
 if(Math.abs(speed)<.9)return;
 const direction={x:Math.sin(car.heading)*Math.sign(speed),z:Math.cos(car.heading)*Math.sign(speed)};
 for(const actor of actors){
  if(actor===car.driver||actor.vehicle||actor.board||actor.y>.7)continue;
  if(sweptVehicleHit(car,from,to,actor.root.position)&&beginImpact(actor,direction,Math.abs(speed),from)){
   actor.reaction.car=car;lastVictim=actor;if(car.driver===player)police.wanted=true;
   blood.burst(actor.root.position.x,.85,actor.root.position.z,direction.x,direction.z);
   car.speed*=.82;if(car===player?.vehicle)demoDrive=0;
  }
 }
}
function stepTraffic(dt){
 for(let i=0;i<traffic.length;i++)trafficAngles[i]=traffic[i].angle;
 for(const c of traffic){
  let target=trafficEnabled?c.cruise:0;
  for(let i=0;i<traffic.length;i++)if(c!==traffic[i]&&trafficGap(c.angle,trafficAngles[i],c.radius)<6.2)target=0;
  const sx=Math.sin(c.heading),cz=Math.cos(c.heading);
  function yieldsTo(pos){const dx=pos.x-c.root.position.x,dz=pos.z-c.root.position.z,along=dx*sx+dz*cz,side=Math.abs(dx*cz-dz*sx);return along>0&&along<6&&side<1.8;}
  for(const a of actors)if(!a.vehicle&&yieldsTo(a.root.position))target=0;
  for(const other of cars)if(yieldsTo(other.root.position))target=0;
  c.speed+=clamp(target-c.speed,-3.5*dt,1.5*dt);
  const from={x:c.root.position.x,z:c.root.position.z};
  c.angle=(c.angle+c.speed*dt/c.radius)%(Math.PI*2);placeTraffic(c);
  strikeWithVehicle(c,from,c.root.position,c.speed);c.animateWheels(c.speed*dt,-Math.atan(c.wheelbase/c.radius));
 }
}
const keys={};let dragging=false;
addEventListener('pointerdown',()=>police.audio.unlock());
addEventListener('keydown',e=>{
 police.audio.unlock();if(intro.active||introReturning){if(e.code==='Escape'){e.preventDefault();finishIntro();}if(e.code==='Tab'||(['Enter','Space'].includes(e.code)&&e.target.closest?.('.police-intro__skip')))return;e.preventDefault();return;}
 if(e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement)return;
 if(['KeyW','KeyA','KeyS','KeyD','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();cam.inspect=null;walkDemo=0;runDemo=0;}
 keys[e.code]=true;if(e.code==='KeyE'&&!e.repeat)interact();if(e.code==='KeyF'&&!e.repeat)strike();if(e.code==='KeyR'&&!e.repeat&&player?.dead)reset();
});
addEventListener('keyup',e=>keys[e.code]=false);
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;dragging=false;});
canvas.addEventListener('pointerdown',e=>{if(intro.active||introReturning)return;dragging=true;canvas.setPointerCapture(e.pointerId);canvas.focus();});
canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
canvas.addEventListener('pointermove',e=>{if(dragging){cam.yaw-=e.movementX*.006;cam.orbitUntil=elapsed+2.5;cam.heightOffset=clamp(cam.heightOffset+e.movementY*.018,-.6,2.5);if(cam.inspect)cam.height=clamp(cam.height+e.movementY*.018,2.3,8);}});
canvas.addEventListener('wheel',e=>{e.preventDefault();if(intro.active||introReturning)return;cam.zoom=clamp(cam.zoom+e.deltaY*.001,.7,1.8);cam.back=clamp(cam.back+e.deltaY*.01,4.5,18);},{passive:false});
const settings={mass:2.8,hz:1.6,amp:3.8,size:2.1};
for(const id of ['mass','hz','amp','size'])$(id).oninput=()=>{settings[id]=+$(id).value;$(id+'V').textContent=$(id).value;};
function reset(){
 if(!player)return;
 intro.cancel();introSeen=false;introReturning=false;introReturn=0;document.body.classList.remove('is-police-intro');
 police.reset(player);blood.clear();lastVictim=null;player.sprintTime=0;player.tripCooldown=0;$('death').hidden=true;
 for(const a of actors)if(a.police){a.fireCooldown=.8;a.burstRemaining=0;a.recoil=0;a.flashTime=0;a.aiming=false;}
 const c=player.vehicle||player.board?.car;if(c){c.driver=null;c.speed=0;c.setDoor(0);}
 player.reaction=null;player.attack=null;player.hitCooldown=0;player.poseDirty=true;demoDrive=0;player.vehicle=null;player.board=null;player.mode='idle';player.speed=0;player.y=player.vy=0;player.grounded=true;player.heading=0;
 player.root.position.set(0,0,-1.6);player.root.rotation.set(0,0,0);player.head={x:0,z:0,vx:0,vz:0,phase:0};player.phase=.25;player.gait=null;
 cam.inspect=null;cam.yaw=0;cam.height=3.05;cam.back=5.2;cam.zoom=1;cam.heightOffset=0;cam.orbitUntil=0;walkDemo=0;runDemo=0;
 for(const k in keys)keys[k]=false;
}
$('reset').onclick=reset;
function inspect(c){
 if(!player)return;reset();selected=c;cam.inspect=c;cam.yaw=c.heading+Math.PI+.65;cam.height=3.9;cam.back=7;cam.zoom=1;
 c.root.updateMatrixWorld(true);player.root.position.copy(c.board.getWorldPosition(V()));player.heading=c.heading-Math.PI/2;player.root.rotation.y=player.heading;
 $('vehicle-name').textContent=c.name;$('vehicle-description').textContent=c.type==='jeep'?'Open cabin · roll cage · all-terrain tires':c.type==='sports'?'Racing coupe · 86 km/h top speed · quick acceleration':'Open cabin · four seats · folded soft top';
}
$('jeep').onclick=()=>inspect(jeep);$('mini').onclick=()=>inspect(mini);$('sports').onclick=()=>inspect(sports);
$('traffic').onclick=()=>{trafficEnabled=!trafficEnabled;$('traffic').textContent=trafficEnabled?'Pause traffic':'Resume traffic';$('traffic').setAttribute('aria-pressed',String(!trafficEnabled));};
$('walk-demo').onclick=()=>{reset();walkDemo=8;};
$('run-demo').onclick=()=>{reset();player.root.position.set(0,0,-6);player.heading=Math.PI;runDemo=6.5;};
$('interact').onclick=()=>interact();
function nearest(){if(!player)return null;let best=null,d=3.2;for(const c of cars){if(!c.playerUsable)continue;if(c.driver&&c.driver!==player)continue;const next=c.board.getWorldPosition(V()).distanceTo(player.root.position);if(next<d){best=c;d=next;}}return best;}
function interact(){
 if(intro.active||introReturning||!player||player.dead||player.board||player.reaction||!player.grounded)return;
 if(player.vehicle){
  const c=player.vehicle;if(Math.abs(c.speed)>.15){$('status').textContent='Release drive controls and stop before exiting';return;}
  c.speed=0;player.board={car:c,kind:'exit',phase:'motion',t:0};player.vehicle=null;player.mode='exit';
 }else{
  const c=nearest();if(!c)return;c.driver=player;c.speed=0;player.board={car:c,kind:'enter',phase:'approach',t:0};player.mode='enter';selected=c;
 }
 walkDemo=0;player.attack=null;player.poseDirty=true;
}
function carPenetration(c,pos,padding=.22){
 const dx=pos.x-c.root.position.x,dz=pos.z-c.root.position.z,sy=Math.sin(c.heading),cy=Math.cos(c.heading);
 return Math.min(c.width/2+padding-Math.abs(dx*cy-dz*sy),c.length/2+padding-Math.abs(dx*sy+dz*cy));
}
function obstaclesAt(pos,ignore){if(merlion?.blocks(pos,.3))return true;for(const c of cars)if(c!==ignore&&carPenetration(c,pos)>0)return true;for(const c of traffic)if(c!==ignore&&carPenetration(c,pos)>0)return true;return false;}
function canMoveActor(from,to){
 if(merlion?.blocks(to,.25)&&!merlion.blocks(from,.25))return false;
 // An actor thrown into an overlap may move out of it, never farther into it.
 for(const list of [cars,traffic])for(const c of list){const next=carPenetration(c,to);if(next>0&&next>=carPenetration(c,from)-1e-5)return false;}return true;
}
function moveActor(a,direction,dt,runSpeed=1.35){
 const px=a.root.position.x,pz=a.root.position.z;
 if(direction.lengthSq()>.001){
  const target=Math.atan2(direction.x,direction.z),delta=wrap(target-a.heading);
  a.heading+=clamp(delta,-6*dt,6*dt);
  const speed=runSpeed*(1-.6*Math.min(1,Math.abs(delta)/1.5));
  const next=V(px+Math.sin(a.heading)*speed*dt,a.root.position.y,pz+Math.cos(a.heading)*speed*dt);
  if(canMoveActor(a.root.position,next))a.root.position.copy(next);
 }
 a.root.rotation.set(0,a.heading,0);a.speed=Math.hypot(a.root.position.x-px,a.root.position.z-pz)/dt;
}
function approach(a,job,dt){
 const c=job.car,goal=c.board.getWorldPosition(V()),local=c.root.worldToLocal(a.root.position.clone());
 // Route around the nose/tail before approaching the door if starting across the body.
 let waypoint=goal;
 const half=c.width/2+.47,end=c.length/2+.55;
 if(local.x<half){
  const endZ=(local.z>=0?1:-1)*end;
  if(Math.abs(local.z)<end-.1)waypoint=c.root.localToWorld(V(local.x,0,endZ));
  else waypoint=c.root.localToWorld(V(half+.35,0,local.z));
 }
 const delta=waypoint.clone().sub(a.root.position);delta.y=0;
 if(goal.distanceTo(a.root.position)<.055){a.root.position.copy(goal);a.speed=0;job.phase='align';return;}
 // Approach is a positional waypoint follower, with orientation independently eased.
 const previous=a.root.position.clone(),d=delta.length(),step=Math.min(d,dt*1.35);
 if(d>.001){const next=a.root.position.clone().addScaledVector(delta,step/d);if(!obstaclesAt(next,c))a.root.position.copy(next);a.heading+=clamp(wrap(Math.atan2(delta.x,delta.z)-a.heading),-dt*4.5,dt*4.5);}
 a.root.rotation.y=a.heading;a.speed=a.root.position.distanceTo(previous)/dt;
}
function stepBoard(a,dt,p){
 const job=a.board,c=job.car;c.speed=0;
 if(job.phase==='approach'){approach(a,job,dt);poseWalking(a,dt,p);return;}
 if(job.phase==='align'){
  const target=c.heading-Math.PI/2,delta=wrap(target-a.heading);a.heading+=clamp(delta,-3.5*dt,3.5*dt);a.root.rotation.y=a.heading;a.speed=0;poseWalking(a,dt,p);
  if(Math.abs(delta)<.015){job.phase='motion';job.t=0;}
  return;
 }
 job.t+=dt;const progress=clamp(job.t/(job.kind==='enter'?3.6:3.4)),u=job.kind==='enter'?progress:1-progress;
 const pose=boardingPose(u);c.setDoor(pose.door);c.root.updateMatrixWorld(true);
 const start=c.board.getWorldPosition(V());start.y+=a.local.Hips.y;
 const end=c.seat.getWorldPosition(V());
 const pelvis=start.lerp(end,pose.seat);pelvis.y-=pose.duck*.075;
 const heading=c.heading-Math.PI/2*(1-pose.turn);
 setHipWorld(a,pelvis,heading);poseBoarding(a,c,pose,p,dt);
 $('status').textContent=job.kind==='enter'?pose.label:'Getting out · '+(u>.74?'open and turn':u>.34?'step onto ground':'stand and close');
 if(progress>=1){
  a.board=null;c.setDoor(0);a.speed=0;
  if(job.kind==='enter'){a.mode='seated';a.vehicle=c;cam.inspect=null;cam.orbitUntil=0;cam.heightOffset=0;}
  else{a.mode='idle';c.driver=null;a.root.position.copy(c.board.getWorldPosition(V()));a.y=a.vy=0;a.grounded=true;}
 }
}
function drive(c,dt){
 let throttle=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0),steer=(keys.KeyA||keys.ArrowLeft?1:0)-(keys.KeyD||keys.ArrowRight?1:0);
 if(demoDrive>0){throttle=1;steer=0;demoDrive=Math.max(0,demoDrive-dt);}
 const braking=throttle&&Math.sign(throttle)!==Math.sign(c.speed)&&Math.abs(c.speed)>.3;
 c.speed+=throttle*(braking?12:c.acceleration)*dt;c.speed*=Math.exp(-(throttle?.24:2.8)*dt);c.speed=clamp(c.speed,-c.reverseSpeed,c.maxSpeed);
 if(Math.abs(c.speed)<.035&&!throttle)c.speed=0;
 const angle=steer*.45/(1+Math.abs(c.speed)*.035),turn=c.speed/c.wheelbase*Math.tan(angle)*dt;
 const next=c.root.position.clone().add(V(Math.sin(c.heading+turn)*c.speed*dt,0,Math.cos(c.heading+turn)*c.speed*dt));
 let blocked=!!merlion?.blocks(next,c.length*.5);
 for(const other of [...cars,...traffic])if(other!==c&&next.distanceTo(other.root.position)<(c.length+other.length)*.40)blocked=true;
 if(!blocked){const from={x:c.root.position.x,z:c.root.position.z};c.heading+=turn;strikeWithVehicle(c,from,next,c.speed);c.root.position.copy(next);}else c.speed=0;
 c.root.rotation.y=c.heading;c.root.updateMatrixWorld(true);c.animateWheels(c.speed*dt,angle);
}
function updateReaction(a,dt){
 const before=a.reaction,r=stepReaction(a,dt);
 if(!r){if(before){a.root.rotation.set(0,a.heading,0);a.root.position.y=0;a.y=0;a.wait=1;a.poseDirty=true;}return false;}
 a.y=0;a.vy=0;a.grounded=true;
 if(r.phase==='falling'||r.phase==='down'){
  advanceImpulse(r,dt,impactDelta);const next=V(a.root.position.x+impactDelta.x,a.root.position.y,a.root.position.z+impactDelta.z);
  if(canMoveActor(a.root.position,next))a.root.position.copy(next);
 }
 if(r.phase==='down'&&!r.groundBlood&&!r.trip){r.groundBlood=true;blood.burst(a.root.position.x+r.dx*.9,.08,a.root.position.z+r.dz*.9,r.dx*.2,r.dz*.2);}
 if(r.phase==='fleeing'){
  a.root.position.y=0;a.root.rotation.set(0,a.heading,0);
  const angle=Math.atan2(a.root.position.x-r.sourceX,a.root.position.z-r.sourceZ);
  const direction=V();
  for(const offset of [0,.55,-.55,1.1,-1.1,1.7,-1.7,Math.PI]){
   const x=Math.sin(angle+offset),z=Math.cos(angle+offset),next=V(a.root.position.x+x*.45,0,a.root.position.z+z*.45);
   if(canMoveActor(a.root.position,next)){direction.set(x,0,z);break;}
  }
  moveActor(a,direction,dt,3.7);a.mode='fleeing';
 }
 return true;
}
function strike(){
 if(intro.active||introReturning||!player||player.dead||player.vehicle||player.board||player.reaction||player.attack)return;
 const direction=V(Math.sin(player.heading),0,Math.cos(player.heading));let target=null,nearestDistance=1.5;
 for(const a of actors){if(a===player||a.vehicle||a.board)continue;const dx=a.root.position.x-player.root.position.x,dz=a.root.position.z-player.root.position.z,d=Math.hypot(dx,dz);if(d<nearestDistance&&(dx*direction.x+dz*direction.z)/Math.max(d,.001)>.15){target=a;nearestDistance=d;}}
 const point=target?target.root.position.clone():player.root.position.clone().add(direction);point.y=1.18;
 player.attack={time:0,target,point,landed:false};player.poseDirty=true;
}
function impactDemo(){
 if(!player||actors.length<2)return;reset();blood.clear();
 const c=jeep;c.root.position.set(-3.2,0,3.2);c.heading=Math.PI;c.root.rotation.y=c.heading;c.speed=0;c.setDoor(0);c.root.updateMatrixWorld(true);
 c.driver=player;player.vehicle=c;player.mode='seated';setHipWorld(player,c.seat.getWorldPosition(V()),c.heading);cam.yaw=c.heading;cam.inspect=null;
 const target=actors[2]||actors[1];
 for(let i=1;i<actors.length;i++){const other=actors[i];if(other===target)continue;other.reaction=null;other.attack=null;other.hitCooldown=0;other.root.position.set(6+i,0,-4+i*2);other.root.rotation.set(0,0,0);other.y=other.vy=0;other.wait=12;other.waypoint=null;other.poseDirty=true;}
 target.reaction=null;target.hitCooldown=0;target.mode='idle';target.poseDirty=true;target.wait=20;target.waypoint=null;target.heading=0;target.root.rotation.set(0,0,0);target.root.position.set(-2.12,0,-2.5);
 target.y=target.vy=0;lastVictim=target;demoDrive=2.5;
}
$('impact-demo').onclick=impactDemo;
$('police-demo').onclick=()=>{if(!player)return;reset();const cop=actors.find(a=>a.police);if(cop){cop.reaction=null;cop.hitCooldown=0;cop.root.position.set(0,0,8.5);cop.heading=Math.PI;cop.root.rotation.set(0,Math.PI,0);cop.y=0;cop.fireCooldown=2;cop.poseDirty=true;}police.wanted=true;};
$('restart').onclick=reset;
$('sound').onclick=()=>{police.audio.enabled=!police.audio.enabled;$('sound').textContent=police.audio.enabled?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(police.audio.enabled));};
$('simulation-speed').onchange=()=>simulationSpeed=+$('simulation-speed').value;
function stepActor(a,dt){
 if(updateReaction(a,dt))return;
 if(a.dead){a.speed=0;return;}
 if(a.board){stepBoard(a,dt,settings);return;}
 if(a.vehicle){const c=a.vehicle;drive(c,dt);setHipWorld(a,c.seat.getWorldPosition(V()),c.heading);a.mode='seated';return;}
 if(a.attack){
  a.attack.time+=dt;
  if(!a.attack.landed&&a.attack.time>=.16){a.attack.landed=true;const target=a.attack.target;
   if(target&&Math.hypot(target.root.position.x-a.root.position.x,target.root.position.z-a.root.position.z)<1.65&&beginImpact(target,{x:Math.sin(a.heading),z:Math.cos(a.heading)},2.4,a.root.position)){lastVictim=target;police.wanted=true;blood.burst(target.root.position.x,1.1,target.root.position.z,Math.sin(a.heading),Math.cos(a.heading));}}
  if(a.attack.time>.42){a.attack=null;a.poseDirty=true;}
 }
 if(a.player){
  let forward=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0),turn=(keys.KeyA||keys.ArrowLeft?1:0)-(keys.KeyD||keys.ArrowRight?1:0);
  if(walkDemo>0){walkDemo-=dt;forward=walkDemo>5?1:walkDemo>2?-1:0;turn=0;}
  if(runDemo>0){runDemo-=dt;forward=1;turn=.45;}
  const sprint=(keys.ShiftLeft||keys.ShiftRight||runDemo>0)&&a.grounded,speed=sprint?3.7:1.35;
  a.heading+=turn*2.6*dt;
  const next=V(a.root.position.x+Math.sin(a.heading)*forward*speed*dt,a.root.position.y,a.root.position.z+Math.cos(a.heading)*forward*speed*dt);
  a.speed=canMoveActor(a.root.position,next)?Math.abs(forward)*speed:0;if(a.speed)a.root.position.copy(next);
  a.root.rotation.set(0,a.heading,0);
  if(stepSprint(a,dt,a.speed,turn)&&beginImpact(a,{x:Math.sin(a.heading)*Math.sign(forward),z:Math.cos(a.heading)*Math.sign(forward)},a.speed,a.root.position)){a.reaction.trip=true;lastVictim=a;runDemo=0;return;}
  if(keys.Space&&a.grounded){a.vy=4.8;a.grounded=false;keys.Space=false;}
 }else{
  const direction=V();
  if(a.police&&police.wanted&&player&&!player.dead&&a.root.position.distanceTo(player.root.position)<26){a.speed=0;return;}
  if(a.wait>0)a.wait-=dt;
  else{
   if(!a.waypoint){const angle=Math.random()*Math.PI*2,r=5+Math.random()*5;a.waypoint=V(Math.cos(angle)*r,0,Math.sin(angle)*r);}
   direction.copy(a.waypoint).sub(a.root.position);direction.y=0;
   if(direction.length()<.35){a.waypoint=null;a.wait=1+Math.random()*2;direction.set(0,0,0);}
  }
  moveActor(a,direction.normalize(),dt);
  if(a.waypoint&&a.speed<.05){a.waypoint=null;a.wait=.6;}
 }
 a.vy-=14*dt;a.y=Math.max(0,a.y+a.vy*dt);if(a.y===0){a.vy=0;a.grounded=true;}
 a.root.position.y=a.y;a.mode=!a.grounded?'air':a.speed>2.5?'run':a.speed>.035?'walk':'idle';
}
function updatePoses(dt){
 for(const a of actors){
  if(a.board)continue;
  if(intro.active&&a!==intro.actor)continue;
  a.poseTime=(a.poseTime||0)+dt;
  const d=a.root.position.distanceToSquared(camera.position),interval=a.player?0:d>22*22?.1:d>10*10?1/quality.npcHz:0;
  if(a.poseTime<interval&&!a.poseDirty)continue;
  const poseDt=a.poseTime;a.poseTime=0;
  if(a.native)poseNative(a,poseDt,settings);
  else if(a.reaction&&a.reaction.phase!=='fleeing')poseReaction(a,settings);
  else if(a.vehicle)poseBoarding(a,a.vehicle,boardingPose(1),settings,poseDt);
  else poseWalking(a,poseDt,settings);
  if(a.attack)poseStrike(a,a.attack.point,a.attack.time/.42);
  if(a.police){if(a.aiming&&player){const target=a.aimTarget||player.root.position.clone().add(V(0,1.12,0));poseAim(a,target,{recoil:a.recoil||0,raise:intro.active?smooth(intro.progress/.65):1});}updatePoliceAccessories(a);}
 }
}
function avoidCars(desired,look,ignore=null){
 let fraction=1;
 for(const list of [cars,traffic])for(const c of list){if(c===ignore||c===player?.board?.car)continue;
  const sy=Math.sin(c.heading),cy=Math.cos(c.heading),convert=p=>{const dx=p.x-c.root.position.x,dz=p.z-c.root.position.z;return {x:dx*cy-dz*sy,y:p.y,z:dx*sy+dz*cy};};
  const hit=segmentBox(convert(look),convert(desired),{x:-c.width/2-.15,y:0,z:-c.length/2-.2},{x:c.width/2+.15,y:2.1,z:c.length/2+.2});
  if(hit!==null)fraction=Math.min(fraction,Math.max(.18,hit-.06));
 }
 desired.lerpVectors(look,desired,fraction);
}
function follow(dt){
 const driving=player?.vehicle;
 if(intro.active){
  intro.camera(introView);camera.fov=48;camera.updateProjectionMatrix();
  cameraDesired.set(introView.x,introView.y,introView.z);cameraLook.set(introView.lookX,introView.lookY,introView.lookZ);
  avoidCars(cameraDesired,cameraLook);
  Object.assign(introLastView,{x:cameraDesired.x,y:cameraDesired.y,z:cameraDesired.z,lookX:cameraLook.x,lookY:cameraLook.y,lookZ:cameraLook.z});
  camera.position.copy(cameraDesired);camera.lookAt(cameraLook);return;
 }
 if(meter.active){
  camera.fov=45;cameraAnchor.set(0,0,-1.6);chaseTarget(cameraAnchor,-.45,false,1,cameraView);
  cameraView.x=-Math.sin(-.45)*10;cameraView.z=-1.6-Math.cos(-.45)*10;cameraView.y=6.2;cameraView.lookX=0;cameraView.lookY=1;cameraView.lookZ=-1.6;
 }else if(cam.inspect){
  camera.fov=55;const target=cam.inspect.root.position,back=cam.back*Math.min(1.9,Math.max(1,.85/camera.aspect));
  Object.assign(cameraView,{x:target.x-Math.sin(cam.yaw)*back,y:cam.height,z:target.z-Math.cos(cam.yaw)*back,lookX:target.x,lookY:cam.inspect.lookHeight??.9,lookZ:target.z});
 }else{
  camera.fov=55;const heading=driving?driving.heading:player?.heading||0;
  if(!dragging&&elapsed>cam.orbitUntil){cam.yaw=followYaw(cam.yaw,heading,dt);cam.heightOffset*=Math.exp(-3*dt);}
  cameraAnchor.copy(driving?driving.root.position:player?.root.position||V());cameraAnchor.y=player&&!driving?player.y:0;
  chaseTarget(cameraAnchor,cam.yaw,!!driving,cam.zoom*Math.min(1.45,Math.max(1,.65/camera.aspect)),cameraView);cameraView.y+=cam.heightOffset;
 }
 camera.updateProjectionMatrix();
 cameraDesired.set(cameraView.x,cameraView.y,cameraView.z);cameraLook.set(cameraView.lookX,cameraView.lookY,cameraView.lookZ);
 if(!cam.inspect&&!meter.active)avoidCars(cameraDesired,cameraLook,driving);

 if(introReturning){
  introReturn=Math.min(intro.returnDuration,introReturn+dt);const t=smooth(introReturn/intro.returnDuration);
  introOrigin.set(introLastView.x,introLastView.y,introLastView.z);introLook.set(introLastView.lookX,introLastView.lookY,introLastView.lookZ);camera.position.lerpVectors(introOrigin,cameraDesired,t);camera.lookAt(introLook.lerp(cameraLook,t));
  if(t>=1)introReturning=false;
 }else{camera.position.lerp(cameraDesired,1-Math.exp(-8*dt));camera.lookAt(cameraLook);}
}
function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}addEventListener('resize',resize);resize();camera.position.set(0,3.05,-6.8);

const loader=new GLTFLoader(),CDN='https://cdn.jsdelivr.net/gh/mrdoob/three.js@r170/examples/models/gltf/';
loader.loadAsync('./assets/merlion/merlion.glb').then(asset=>{
 merlion=createMerlion(asset.scene);merlion.root.position.set(-10,0,-32);scene.add(merlion.root);
 const button=$('merlion');button.disabled=false;button.textContent='Merlion · inspect';
 button.onclick=()=>{if(intro.active||introReturning)return;walkDemo=runDemo=0;cam.inspect=merlion;cam.yaw=Math.PI+.55;cam.height=6.2;cam.back=17;cam.zoom=1;};
}).catch(error=>{$('merlion').textContent='Merlion unavailable';console.error('Merlion could not load',error);});
async function loadPeople(){
 const results=await Promise.allSettled(['readyplayer.me','Michelle','Soldier'].map(name=>loader.loadAsync(CDN+name+'.glb')));
 const loaded=results.filter(r=>r.status==='fulfilled').map(r=>r.value);
 if(!loaded.length){$('load').textContent='Characters could not load. Check your connection and reload.';return;}
 for(let i=0;i<4;i++){
  const model=cloneSkinned(loaded[i%loaded.length].scene);prepareCharacter(model);
  const a=createActor(model,{name:['Explorer','Dancer','Ranger','Friend'][i],player:i===0,x:[0,6,-6,0][i],z:[-1.6,-2,-3,8][i],heading:0});a.home=a.root.position.clone();actors.push(a);scene.add(a.root);if(i===0){player=a;police.reset(player);}if(i===2)dressPolice(a);
 }
 const natives=await Promise.allSettled(['casual','hoodie'].map(name=>loader.loadAsync('./assets/candidates/'+name+'.gltf')));
 for(const [i,result] of natives.entries())if(result.status==='fulfilled'){const asset=result.value,a=createNativeActor(cloneSkinned(asset.scene),asset.animations,{name:i?'Hoodie NPC':'Casual NPC',x:i?5:-5,z:8});a.home=a.root.position.clone();actors.push(a);scene.add(a.root);}else console.warn('NPC model unavailable',result.reason);
 $('load').textContent='Preparing shaders…';await renderer.compileAsync(scene,camera);
 $('load').hidden=true;document.querySelectorAll('button[data-character]').forEach(b=>b.disabled=false);selected=jeep;canvas.focus();
}
loadPeople();
let last=performance.now(),hudTime=0,shadowTime=0,hidden=document.hidden;
const ui={status:$('status'),interact:$('interact'),prompt:$('prompt'),readout:$('readout'),render:$('render-info'),impact:$('impact-status')};
function text(el,value){if(el.textContent!==value)el.textContent=value;}
$('quality').onchange=()=>{
 quality=renderQuality($('quality').value,devicePixelRatio);renderer.setPixelRatio(quality.pixelRatio);
 sun.shadow.mapSize.set(quality.shadowSize,quality.shadowSize);sun.shadow.map?.dispose();sun.shadow.map=null;renderer.shadowMap.needsUpdate=true;resize();
};
$('benchmark').onclick=()=>{
 reset();blood.clear();lastVictim=null;simulationSpeed=1;$('simulation-speed').value='1';
 for(const c of cars){c.root.position.set(c.spawn.x,0,c.spawn.z);c.heading=c.spawn.heading;c.root.rotation.y=c.heading;c.speed=0;c.setDoor(0);}
 for(const a of actors){a.reaction=null;a.attack=null;a.hitCooldown=0;a.poseDirty=true;a.gait=null;a.root.position.copy(a.home);a.root.rotation.set(0,0,0);a.heading=0;a.y=a.vy=0;a.grounded=true;a.wait=0;a.waypoint=null;}
 for(let i=0;i<traffic.length;i++){traffic[i].angle=i*Math.PI/3;placeTraffic(traffic[i]);}
 meter.start(performance.now());text($('benchmark-result'),'Measuring: 1 s warm-up + 5 s sample…');
};
addEventListener('visibilitychange',()=>{hidden=document.hidden;last=performance.now();if(hidden&&meter.active){meter.active=false;text($('benchmark-result'),'Sample cancelled: keep this tab visible.');}renderer.shadowMap.needsUpdate=true;});
function animate(now){
 requestAnimationFrame(animate);const rawFrame=now-last;last=now;if(hidden)return;
 const dt=Math.min(rawFrame/1000,.1)*simulationSpeed;if(dt<=0)return;
 const cpuStart=performance.now();elapsed+=dt;
 // Small simulation steps preserve collision/cooldown behaviour during a slow frame.
 const steps=Math.ceil(dt/(1/60)),step=dt/steps;
 const allCars=[...cars,...traffic],cinematicDt=Math.min(rawFrame/1000,.1);
 if(intro.active){
  const cop=intro.actor;
  cop.heading=cop.introHeading;cop.root.rotation.set(0,cop.heading,0);cop.speed=0;cop.poseDirty=true;
  cop.aimTarget=player.root.position.clone().add(V(0,1.12,0));
  intro.update(cinematicDt);police.update(cinematicDt,actors,player,allCars,{suspended:true});
  if(!intro.active){intro.camera(introView);cameraDesired.set(introView.x,introView.y,introView.z);cameraLook.set(introView.lookX,introView.lookY,introView.lookZ);avoidCars(cameraDesired,cameraLook);Object.assign(introLastView,{x:cameraDesired.x,y:cameraDesired.y,z:cameraDesired.z,lookX:cameraLook.x,lookY:cameraLook.y,lookZ:cameraLook.z});introReturning=true;introReturn=0;document.body.classList.remove('is-police-intro');}
 }else if(!introReturning){
  for(let i=0;i<steps;i++){
   stepTraffic(step);for(const a of actors)stepActor(a,step);
   const observer=!introSeen&&!meter.active?police.findObserver(actors,player,allCars):null;
   if(observer){startIntro(observer);break;}
   police.update(step,actors,player,allCars);
  }
 }
 merlion?.update(now/1000);updatePoses(intro.active?cinematicDt:dt);if(!intro.active&&!introReturning)blood.update(dt);follow(introReturning?cinematicDt:dt);
 shadowTime+=dt;if(shadowTime>=1/quality.shadowHz){renderer.shadowMap.needsUpdate=true;shadowTime=0;}
 hudTime+=dt;
 if(player&&hudTime>=.1){
  hudTime=0;const c=player.vehicle,near=nearest();
  $('landmark-info').hidden=cam.inspect!==merlion;
  for(const id of ['vehicle-name','vehicle-description','interact'])$(id).hidden=cam.inspect===merlion;
  if(intro.active||introReturning)text(ui.status,'Police spotted you');
  else if(!player.board)text(ui.status,player.dead?'Dead · R to restart':player.reaction?player.reaction.phase:c?(Math.abs(c.speed)>.15?'Driving':'Parked · ready to exit'):player.mode==='run'?'Running · hold Shift':player.mode==='walk'?(player.gait?.direction<0?'Walking backward · heads wobble':'Walking · heads wobble'):player.mode==='air'?'Jumping':'Still · heads at rest');
  ui.interact.disabled=intro.active||introReturning||player.dead||!!player.board||!!player.reaction||(!c&&!near)||!player.grounded;
  text(ui.interact,c?'Get out · E':player.board?'Getting '+(player.board.kind==='enter'?'in…':'out…'):'Get in · E');
  const prompt=player.board||player.reaction?'':c?(Math.abs(c.speed)>.15?'Release W / S to brake':'E · get out'):near?'E · enter '+near.name:'';
  text(ui.prompt,prompt);ui.prompt.hidden=!prompt;
  text(ui.readout,`Head tilt ${(Math.hypot(player.head.x,player.head.z)*180/Math.PI).toFixed(1)}° · ${player.mode} · ${c?(Math.abs(c.speed)*3.6).toFixed(0)+' km/h':'on foot'}`);
  text(ui.impact,lastVictim?`${lastVictim.name}: ${lastVictim.reaction?({falling:'falling',down:'on the ground',gettingUp:'getting up',fleeing:'running away'}[lastVictim.reaction.phase]):'recovered'} · ${blood.active} blood drops`:'F · strike nearby person · or try the impact demo');
  text($('health'),`Health ${player.health}/100 · ${police.wanted?'Police hostile':'Police neutral'} · ${police.hits}/${police.shots} shots hit`);$('death').hidden=!player.dead;
  text(ui.render,`${Math.round(1000/Math.max(1,rawFrame))} FPS · ${renderer.info.render.triangles.toLocaleString()} triangles · ${renderer.info.render.calls} draws · ${quality.pixelRatio}× resolution`);
 }
 renderer.render(scene,camera);
 const result=meter.sample(now,rawFrame,performance.now()-cpuStart,renderer.info.render);
 if(result)text($('benchmark-result'),JSON.stringify({...result,dpr:renderer.getPixelRatio(),viewport:[canvas.clientWidth,canvas.clientHeight]}));
}
requestAnimationFrame(animate);
