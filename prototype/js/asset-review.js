import {createMarinaBaySands} from './marina-bay-sands.js';
import {createMerlion} from './merlion.js';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {clone as cloneSkinned} from 'three/addons/utils/SkeletonUtils.js';
import {createVehicle} from './vehicles.js';
import {prepareCharacter,createActor,poseWalking,poseAim} from './characters.js';
import {dressPolice,updatePoliceAccessories} from './police.js';
import {stepHead} from './motion.js';
import {buildReviewCatalog,clipView} from './review-catalog.js';

const $=id=>document.getElementById(id),canvas=$('review-canvas');
const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;renderer.autoClear=false;
const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.04).texture;room.dispose();pmrem.dispose();
const loader=new GLTFLoader(),loads=new Map(),entries=[];
const CDN='https://cdn.jsdelivr.net/gh/mrdoob/three.js@r170/examples/models/gltf/';
let paused=false,dirty=true,previous=performance.now(),loadedCount=0,failedCount=0;
const params={size:2.1,mass:2.8,hz:1.6,amp:3.8};
function load(url){if(!loads.has(url))loads.set(url,loader.loadAsync(url));return loads.get(url);}
function element(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text)node.textContent=text;return node;}
function link(parent,label,url){const a=element('a','',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';parent.append(a);}
function makeCard(item){
 const card=element('article',item.id==='marina-bay-sands'?'model-card landmark-hero':'model-card'),top=element('div','model-top'),title=element('div'),h=element('h3','',item.name);h.id=item.id;card.setAttribute('aria-labelledby',h.id);
 title.append(h,element('span','origin',item.origin));const turn=element('button','','Turn');turn.setAttribute('aria-label','Turn '+item.name);turn.disabled=true;top.append(title,turn);
 const view=element('div','model-view');view.tabIndex=0;view.setAttribute('role','img');view.setAttribute('aria-label',item.name+' 3D preview. Drag or use left and right arrows to rotate.');
 const loading=element('div','loading','Loading model…');view.append(loading);
 const info=element('div','model-info'),budget=element('p','budget','Preparing…'),links=element('div','model-links');info.append(budget,element('p','',item.notes),links);
 if(item.source)link(links,'Source',item.source);if(item.licenseUrl)link(links,'License',item.licenseUrl);
 card.append(top,view,info);$({car:'cars',human:'people',landmark:'landmarks',building:'buildings',tree:'trees'}[item.kind]).append(card);
 const scene=new T.Scene();scene.background=new T.Color('#bdcbb8');scene.environment=environment;scene.add(new T.HemisphereLight('#e4efff','#7a6953',1.15));
 const light=new T.DirectionalLight('#fff3df',2.1);scene.add(light,light.target);
 const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:'#a4b399',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.025;scene.add(floor);
 const e={item,card,view,loading,info,budget,links,turn,scene,light,floor,camera:new T.PerspectiveCamera(39,1,.05,300),yaw:.72,pitch:.32,ready:false,clip:'auto'};entries.push(e);
 turn.onclick=()=>{e.yaw+=Math.PI/4;dirty=true;};
 let drag;
 view.addEventListener('pointerdown',event=>{drag={x:event.clientX,y:event.clientY};view.setPointerCapture(event.pointerId);});
 view.addEventListener('pointermove',event=>{if(!drag)return;e.yaw-=(event.clientX-drag.x)*.012;e.pitch=T.MathUtils.clamp(e.pitch+(event.clientY-drag.y)*.006,-.05,1.05);drag.x=event.clientX;drag.y=event.clientY;dirty=true;});
 view.addEventListener('pointerup',()=>drag=null);view.addEventListener('pointercancel',()=>drag=null);
 view.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();e.yaw+=(event.key==='ArrowLeft'?1:-1)*Math.PI/8;dirty=true;});
 return e;
}
function measure(root){let triangles=0;root.traverse(o=>{if(o.isMesh)triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);});return Math.round(triangles);}
function setClip(e){
 if(!e.mixer)return;const shared=$('motion').value,wanted=e.clip==='auto'?({Back:'Run_Back'}[shared]||shared):e.clip;
 e.mixer.stopAllAction();const clip=e.clips.find(c=>c.name===wanted)||e.clips.find(c=>c.name==='Idle');
 if(clip)e.mixer.clipAction(clip).reset().play();e.mixer.update(0);if(e.head){e.headQ??=e.head.quaternion.clone();e.headQ.copy(e.head.quaternion);}dirty=true;
}
function environmentModel(e,index){
 const root=e.environmentAsset.clone(true),item=e.item;
 if(item.kind==='tree'){const variants=[...root.getObjectByName('RootNode').children];variants.forEach((o,i)=>{if(i!==index)o.removeFromParent();});}
 let bounds=new T.Box3().setFromObject(root);const size=bounds.getSize(new T.Vector3());root.scale.multiplyScalar(item.height/size.y);
 root.updateMatrixWorld(true);bounds.setFromObject(root);const center=bounds.getCenter(new T.Vector3());root.position.add(new T.Vector3(-center.x,-bounds.min.y,-center.z));
 e.focusY=item.height*.46;e.radius=Math.max(item.height,new T.Box3().setFromObject(root).getSize(new T.Vector3()).length())*1.35;
 return root;
}
async function populate(e){
 try{
  const item=e.item;let root;
  if(item.id==='marina-bay-sands'){root=createMarinaBaySands().root;e.focusY=105;e.radius=490;e.camera.far=2000;}
  else if(item.kind==='landmark'){const asset=await load('./assets/merlion/merlion.glb');e.landmark=createMerlion(asset.scene.clone(true));root=e.landmark.root;}
  else if(item.kind==='building'||item.kind==='tree'){
   const asset=await load('./assets/environment/'+item.file);e.environmentAsset=asset.scene;
   root=environmentModel(e,0);
   if(item.kind==='tree'){
    const variants=asset.scene.getObjectByName('RootNode').children.map(o=>o.name);
    const label=element('label','clip-label','Tree variant'),select=element('select');select.setAttribute('aria-label',item.name+' variant');
    variants.forEach((name,i)=>select.add(new Option('Variant '+(i+1),String(i))));label.append(select);e.info.append(label);
    select.onchange=()=>{e.scene.remove(e.root);e.root=environmentModel(e,Number(select.value));e.scene.add(e.root);e.budget.textContent=measure(e.root).toLocaleString()+' triangles · '+variants.length+' variants in pack';dirty=true;};
   }
  }
  else if(item.vehicle){e.car=createVehicle(item.vehicle);root=e.car.root;}
  else{
   const asset=await load(item.rig?CDN+item.rig+'.glb':'./assets/candidates/'+item.file);const model=cloneSkinned(asset.scene);
   if(item.rig){prepareCharacter(model);e.actor=createActor(model,{name:item.name});root=e.actor.root;if(item.id==='yard-ranger')dressPolice(e.actor);poseWalking(e.actor,0,params);}
   else{
    root=model;e.clips=asset.animations;
    if(e.clips.length){e.mixer=new T.AnimationMixer(root);setClip(e);}
    let bounds=new T.Box3().setFromObject(root),size=bounds.getSize(new T.Vector3());root.scale.multiplyScalar((item.kind==='human'?1.73:4.1)/(item.kind==='human'?size.y:Math.max(size.x,size.z)));
    root.updateMatrixWorld(true);bounds.setFromObject(root);const center=bounds.getCenter(new T.Vector3());root.position.add(new T.Vector3(-center.x,-bounds.min.y,-center.z));
    root.traverse(o=>{if(o.isBone&&o.name==='Head')e.head=o;});e.headScale=e.head?.scale.clone();
   }
  }
  e.root=root;e.scene.add(root);root.updateMatrixWorld(true);
  e.radius??=item.kind==='landmark'?18:item.kind==='human'?3.65:Math.max(5.6,new T.Box3().setFromObject(root).getSize(new T.Vector3()).length()*1.08);
  e.budget.textContent=`${measure(root).toLocaleString()} triangles${item.bytes?' · '+Math.round(item.bytes/1024).toLocaleString()+' KB':''}${e.clips?.length?' · '+e.clips.length+' clips':''}`;
  if(item.id==='marina-bay-sands'){const button=element('button','','SkyPark view');e.roofButton=button;button.onclick=()=>{e.roofView=!e.roofView;e.pitch=e.roofView?1.05:.32;e.focusY=e.roofView?190:105;e.radius=e.roofView?330:490;e.yaw=e.roofView?.12:.72;button.textContent=e.roofView?'Tower view':'SkyPark view';dirty=true;};e.links.append(button);}
  if(e.clips?.length){
   const label=element('label','clip-label','Animation'),select=element('select');select.setAttribute('aria-label',item.name+' animation');select.add(new Option('Follow shared controls','auto'));for(const clip of e.clips)select.add(new Option(clip.name,clip.name));label.append(select);e.info.append(label);select.onchange=()=>{e.clip=select.value;setClip(e);};
  }
  if(e.actor?.police){const button=element('button','','Preview firing');button.setAttribute('aria-pressed','false');button.onclick=()=>{e.previewFire=!e.previewFire;e.fireClock=0;button.textContent=e.previewFire?'Stop firing':'Preview firing';button.setAttribute('aria-pressed',String(e.previewFire));dirty=true;};e.links.append(button);}
  if(e.car?.playerUsable){const button=element('button','','Open door');button.setAttribute('aria-label','Open door on '+item.name);button.onclick=()=>{e.doorOpen=!e.doorOpen;e.car.setDoor(e.doorOpen?1:0);button.textContent=e.doorOpen?'Close door':'Open door';button.setAttribute('aria-label',button.textContent+' on '+item.name);dirty=true;};e.links.append(button);}
  e.ready=true;e.turn.disabled=false;e.loading.hidden=true;loadedCount++;dirty=true;
 }catch(error){e.loading.textContent='Model unavailable. Reload to retry.';e.budget.textContent='Could not load';failedCount++;console.error(e.item.name,error);}
 $('load-status').textContent=`${loadedCount} of ${entries.length} models ready${failedCount?' · '+failedCount+' unavailable':''}`;
}
function update(e,dt){
 if(e.landmark){if(!paused)e.landmarkTime=(e.landmarkTime||0)+dt;e.landmark.update(e.landmarkTime||0);}
 if(e.actor){
  const motion=$('motion').value,a=e.actor,speed=motion==='Run'?3.7:motion==='Idle'?0:1.35;
  a.speed=speed;a.mode=motion==='Run'?'fleeing':speed?'walk':'idle';if(!paused)a.root.position.z+=speed*dt*(motion==='Back'?-1:1);
  params.size=$('big-head').checked?2.1:1;if(e.headSize!==params.size){a.poseDirty=true;e.headSize=params.size;}if(!paused||a.poseDirty)poseWalking(a,paused?0:dt,params);if(a.police){
   a.aiming=!!e.previewFire;
   if(e.previewFire){if(!paused)e.fireClock=(e.fireClock||0)+dt;const beat=e.fireClock%2.1,shot=beat<.54?beat%.18:1;a.recoil=Math.max(0,1-shot*10);a.flashTime=shot<.045?1:0;a.aimTarget=new T.Vector3(0,1.2,a.root.position.z+8);poseAim(a,a.aimTarget,{recoil:a.recoil});}
   else{a.recoil=a.flashTime=0;}
   updatePoliceAccessories(a);
  }
 }else if(e.mixer){
  if(e.head&&e.headScale){e.head.scale.copy(e.headScale);if(e.headQ)e.head.quaternion.copy(e.headQ);}if(!paused)e.mixer.update(dt);if(e.head){e.headQ??=e.head.quaternion.clone();e.headQ.copy(e.head.quaternion);}if(e.head&&$('big-head').checked)e.head.scale.multiplyScalar(2.1);if(e.head&&!paused){e.wobble??={x:0,z:0,vx:0,vz:0,phase:0};stepHead(e.wobble,dt,$('motion').value==='Run'?3.7:$('motion').value==='Idle'?0:1.35,params);e.head.rotation.x+=e.wobble.x;e.head.rotation.z+=e.wobble.z;}
 }
 const z=e.actor?.root.position.z||0,y=e.focusY??(e.item.kind==='landmark'?4.0:e.item.kind==='human'?1.04:.75);
 e.camera.position.set(Math.sin(e.yaw)*e.radius,y+Math.sin(e.pitch)*e.radius,z+Math.cos(e.yaw)*e.radius);e.camera.lookAt(0,y,z);
 e.floor.position.z=z;e.light.position.set(-3,7,z+5);e.light.target.position.set(0,0,z);
}
$('motion').onchange=()=>{for(const e of entries)setClip(e);dirty=true;};$('big-head').onchange=()=>dirty=true;
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'Play animation':'Pause animation';$('pause').setAttribute('aria-pressed',String(paused));dirty=true;};
$('reset-views').onclick=()=>{for(const e of entries){e.yaw=.72;e.pitch=.32;if(e.roofButton){e.roofView=false;e.focusY=105;e.radius=490;e.roofButton.textContent='SkyPark view';}}dirty=true;};
for(const button of document.querySelectorAll('[data-filter]'))button.onclick=()=>{
 for(const b of document.querySelectorAll('[data-filter]'))b.setAttribute('aria-pressed',String(b===button));
 for(const [kind,id] of [['car','cars-section'],['human','people-section'],['landmark','landmarks-section'],['building','buildings-section'],['tree','trees-section']])$(id).hidden=button.dataset.filter!=='all'&&button.dataset.filter!==kind;dirty=true;
};
function resize(){renderer.setSize(innerWidth,innerHeight,false);dirty=true;}addEventListener('resize',resize);addEventListener('scroll',()=>dirty=true,{passive:true});addEventListener('visibilitychange',()=>{previous=performance.now();dirty=true;});resize();
function frame(now){
 requestAnimationFrame(frame);const dt=Math.min((now-previous)/1000,.05);previous=now;if(document.hidden)return;
 if(paused&&!dirty)return;dirty=false;
 renderer.setScissorTest(false);renderer.setClearColor(0,0);renderer.clear();renderer.setScissorTest(true);
 for(const e of entries){
  if(!e.ready||e.card.closest('section').hidden)continue;
  const rect=e.view.getBoundingClientRect(),clip=clipView(rect,innerWidth,innerHeight);if(!clip)continue;
  update(e,dt);e.camera.aspect=rect.width/rect.height;e.camera.updateProjectionMatrix();
  renderer.setViewport(rect.left,innerHeight-rect.bottom,rect.width,rect.height);renderer.setScissor(clip.x,clip.y,clip.width,clip.height);renderer.render(e.scene,e.camera);
 }
}requestAnimationFrame(frame);
try{
 const response=await fetch('./assets/candidates/catalog.json');if(!response.ok)throw new Error('Catalog unavailable');const environmentResponse=await fetch('./assets/environment/catalog.json');if(!environmentResponse.ok)throw new Error('Environment catalog unavailable');const items=buildReviewCatalog(await response.json(),await environmentResponse.json());
 for(const button of document.querySelectorAll('[data-filter]')){const kind=button.dataset.filter;button.textContent=(kind==='all'?'All':kind==='car'?'Cars':kind==='landmark'?'Landmarks':kind==='building'?'Buildings':kind==='tree'?'Trees':'People')+' '+items.filter(i=>kind==='all'||i.kind===kind).length;}
 for(const item of items)makeCard(item);await Promise.all(entries.map(populate));
}catch(error){$('load-status').textContent='Catalog unavailable. Run npm start and reload.';console.error(error);}
