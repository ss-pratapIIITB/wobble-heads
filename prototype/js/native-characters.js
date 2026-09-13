import * as T from 'three';
import {createActor} from './characters.js';
import {stepHead} from './motion.js';

// Quaternius control rigs use detached foot controls; preserve their native clips.
export function createNativeActor(model,clips,options){
 model.updateMatrixWorld(true);let box=new T.Box3().setFromObject(model);
 model.scale.multiplyScalar(1.73/box.getSize(new T.Vector3()).y);model.updateMatrixWorld(true);box.setFromObject(model);
 const center=box.getCenter(new T.Vector3());model.position.add(new T.Vector3(-center.x,-box.min.y,-center.z));
 model.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;});
 const a=createActor(model,options);a.native={mixer:new T.AnimationMixer(model),clips,action:null,key:null};return a;
}
export function poseNative(a,dt,params){
 const n=a.native,r=a.reaction,reacting=r&&r.phase!=='fleeing';
 const head=a.bones.Head;
 if(head&&n.headQ){head.quaternion.copy(n.headQ);head.scale.copy(n.headScale);}
 const clipName=reacting?'Death':a.speed>2.5?'Run':a.speed>.035?'Walk':'Idle';
 const clip=n.clips.find(c=>c.name===clipName)||n.clips[0];if(!clip)return;
 if(n.key!==clipName){n.mixer.stopAllAction();n.action=n.mixer.clipAction(clip).reset().play();n.key=clipName;}
 if(reacting){
  const progress=r.phase==='falling'?Math.min(1,r.time/r.fallTime):r.phase==='gettingUp'?1-Math.min(1,r.time/1.45):1;
  n.action.time=Math.min(clip.duration-.001,progress*clip.duration);n.mixer.update(0);a.root.rotation.set(0,a.heading,0);a.root.position.y=r.height||0;
 }else{n.action.timeScale=clipName==='Run'?a.speed/3.7:clipName==='Walk'?a.speed/1.35:1;n.mixer.update(dt);}
 stepHead(a.head,dt,reacting?0:a.speed,params);
 if(head){n.headQ??=head.quaternion.clone();n.headScale??=head.scale.clone();n.headQ.copy(head.quaternion);head.scale.copy(n.headScale).multiplyScalar(params.size);head.rotation.x+=a.head.x;head.rotation.z+=a.head.z;}
 a.poseDirty=false;
}
