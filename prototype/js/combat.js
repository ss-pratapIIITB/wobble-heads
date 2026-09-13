// Small deterministic combat functions; callers own presentation and hostility.
export function resetHealth(actor){actor.health=100;actor.dead=false;actor.shotsTaken=0;}
export function damagePlayer(actor){
 if(actor.dead)return false;
 actor.shotsTaken=(actor.shotsTaken||0)+1;actor.health=Math.max(0,(actor.health??100)-18);actor.dead=actor.health===0;return true;
}
export function makeShot(origin,target,random=Math.random){
 const dx=target.x-origin.x,dy=target.y-origin.y,dz=target.z-origin.z;
 const yaw=Math.atan2(dx,dz)+(random()-.5)*.16,pitch=Math.atan2(dy,Math.hypot(dx,dz))+(random()-.5)*.10;
 const range=30;return {origin:{...origin},end:{x:origin.x+Math.sin(yaw)*Math.cos(pitch)*range,y:origin.y+Math.sin(pitch)*range,z:origin.z+Math.cos(yaw)*Math.cos(pitch)*range},range};
}
export function shotHits(shot,target,coverFraction=1,radius=.32){
 const a=shot.origin,b=shot.end,dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,length2=dx*dx+dy*dy+dz*dz;
 const t=((target.x-a.x)*dx+(target.y-a.y)*dy+(target.z-a.z)*dz)/length2;
 return t>=0&&t<=Math.min(1,coverFraction)&&Math.hypot(a.x+dx*t-target.x,a.y+dy*t-target.y,a.z+dz*t-target.z)<=radius;
}
