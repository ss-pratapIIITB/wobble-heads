import {wrap} from './motion.js';
export function followYaw(current,target,dt){return current+wrap(target-current)*(1-Math.exp(-4.5*dt));}
export function chaseTarget(position,heading,driving,zoom=1,out={}){
 const back=(driving?7:5.2)*zoom,sy=Math.sin(heading),cy=Math.cos(heading);
 out.x=position.x-sy*back;out.z=position.z-cy*back;out.y=position.y+(driving?3.45:3.05);
 out.lookX=position.x+sy*(driving?1.8:.5);out.lookZ=position.z+cy*(driving?1.8:.5);out.lookY=position.y+(driving?1.25:1.48);
 return out;
}
// Segment/slab test also works when the camera is initially inside an obstruction.
export function segmentBox(start,end,min,max){
 let lo=0,hi=1;
 for(const axis of ['x','y','z']){
  const d=end[axis]-start[axis];
  if(Math.abs(d)<1e-8){if(start[axis]<min[axis]||start[axis]>max[axis])return null;continue;}
  let a=(min[axis]-start[axis])/d,b=(max[axis]-start[axis])/d;if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);if(lo>hi)return null;
 }
 return lo;
}
