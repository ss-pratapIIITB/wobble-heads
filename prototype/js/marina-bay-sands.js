import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
// Original reference-based interpretation. Units are metres; +Z faces the bay.
export const MBS_DIMENSIONS=Object.freeze({skyparkLength:340,skyparkWidth:38,towerHeight:196,poolLength:150});
export function createMarinaBaySands(){
 const root=new T.Group();root.name='Marina Bay Sands';
 const colors={stone:'#c8c8bd',glass:'#426d7b',trim:'#ddd8c8',deck:'#ae9270',water:'#28afb8',green:'#477144',trunk:'#695444',dark:'#283e42'};
 const batches=new Map(Object.keys(colors).map(k=>[k,[]]));
 function add(g,key,x=0,y=0,z=0,rx=0,ry=0,rz=0){g.rotateX(rx);g.rotateY(ry);g.rotateZ(rz);g.translate(x,y,z);batches.get(key).push(g);}
 function box(w,h,d,key,x,y,z){add(new T.BoxGeometry(w,h,d),key,x,y,z);}
 // Each tower is a pair of slender curved plates, spreading into an atrium below.
 const towerX=[-104,-14,76],H=196;
 const zAt=(t,side,spread)=>side*(7+spread*Math.pow(1-t,2.4));
 function plate(cx,side,spread){
  const pos=[],indices=[],width=48,depth=11;
  for(let i=0;i<=56;i++){const t=i/56,y=4+t*(H-4),z=zAt(t,side,spread),w=width*(1-.045*t);
   pos.push(cx-w/2,y,z-depth/2,cx+w/2,y,z-depth/2,cx+w/2,y,z+depth/2,cx-w/2,y,z+depth/2);
  }
  for(let i=0;i<56;i++)for(let j=0;j<4;j++){const a=i*4+j,b=i*4+(j+1)%4,c=b+4,d=a+4;indices.push(a,c,b,a,d,c);}
  indices.push(0,1,2,0,2,3,224,226,225,224,227,226);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(indices);g.computeVertexNormals();add(g,'glass');
  // Exposed horizontal slabs and vertical pale fins read from street distance.
  for(let floor=0;floor<=56;floor++){
   const t=floor/56,y=4+t*(H-4),z=zAt(t,side,spread),w=48*(1-.045*t);
   box(w+.8,.46,11.9,'trim',cx,y,z);
  }
  for(let col=0;col<=16;col++){
   const x=cx-24+col*3;
   for(let i=0;i<14;i++){
    const t=(i+.5)/14,y=4+t*(H-4),z=zAt(t,side,spread)+side*5.85;
    const a=zAt(i/14,side,spread),b=zAt((i+1)/14,side,spread),dy=(H-4)/14;
    add(new T.BoxGeometry(.36,Math.hypot(dy,b-a)+.1,.48),'stone',x*(1-.045*t)+cx*.045*t,y,z,Math.atan2(b-a,dy));
   }
  }
 }
 towerX.forEach((x,i)=>{const spread=[22,17,12][i];plate(x,-1,spread);plate(x,1,spread);
  box(49,4,26,'dark',x,198,0);
  box(51,2,27,'trim',x,201,0);
  // Glazed lobby between the splayed legs.
  box(42,15,spread*2+12,'glass',x,9,0);
 });
 box(252,5,40,'stone',-14,2.5,0);
 for(let x=-132;x<105;x+=6)box(.45,12,1,'trim',x,10,25);
 box(254,.8,12,'trim',-14,16,25);
 // Smooth asymmetric boat-shaped SkyPark, with long north cantilever.
 function outline(inset=0){const s=new T.Shape();s.moveTo(-151+inset,-14+inset);s.bezierCurveTo(-165,-13,-170,2,-157,13-inset);s.bezierCurveTo(-140,22-inset,102,22-inset,150,12-inset);s.bezierCurveTo(180-inset,7,177-inset,-5,156,-12+inset);s.bezierCurveTo(110,-21+inset,-126,-19+inset,-151+inset,-14+inset);return s;}
 function deck(shape,depth,key,y){const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:key==='stone',bevelThickness:1.5,bevelSize:1.5,bevelSegments:3,curveSegments:24});g.rotateX(-Math.PI/2);add(g,key,0,y,0);}
 deck(outline(),3,'stone',202);deck(outline(1.2),.6,'deck',206.5);
 const railPoints=outline(.3).getPoints(100);
 for(let i=1;i<railPoints.length;i++){
  const a=railPoints[i-1],b=railPoints[i],dx=b.x-a.x,dz=-(b.y-a.y),len=Math.hypot(dx,dz);
  add(new T.BoxGeometry(len,.32,.32),'trim',(a.x+b.x)/2,208.8,-(a.y+b.y)/2,0,-Math.atan2(dz,dx));
  if(i%2===0)box(.18,1.6,.18,'trim',a.x,208,-a.y);
 }
 // West-facing infinity pool and timber deck, with loungers and garden islands.
 box(154,.45,12,'trim',-48,207.3,8);box(150,.18,10,'water',-48,207.6,8);
 box(150,.18,.26,'water',-48,207.15,14.1);
 for(let i=0;i<30;i++){
  const x=-121+i*5;box(1.5,.45,2.8,'trim',x,207.6,-1);add(new T.BoxGeometry(1.5,.22,1),'trim',x,208,-2.1,-.4);
 }
 for(let i=0;i<13;i++){
  const x=-132+i*19,z=-10+(i%2)*2;
  box(8,.6,5,'green',x,207.7,z);
  add(new T.CylinderGeometry(.24,.4,4,6),'trunk',x,210,z);
  add(new T.IcosahedronGeometry(2.1,1),'green',x,212.4,z);
 }
 // Low rooftop pavilions; keep the north observation deck open.
 box(30,3.2,12,'glass',60,209,-4);box(33,.5,14,'trim',60,210.85,-4);
 for(let i=0;i<8;i++)box(.25,3.5,12.3,'trim',47+i*4,209,-4);
 // Landscape plinth reads as a display base, not a reconstruction of the resort.
 box(306,.6,105,'stone',-10,-.3,0);
 for(const [key,geometries] of batches){
  const material=new T.MeshStandardMaterial({color:colors[key],roughness:key==='glass'?.25:key==='water'?.2:.78,metalness:key==='glass'?.45:key==='water'?.25:.05});
  const geometry=mergeGeometries(geometries.map(g=>{g.deleteAttribute('uv');return g.index?g.toNonIndexed():g;}));const mesh=new T.Mesh(geometry,material);mesh.name='MBS '+key;mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);
  geometries.forEach(g=>g.dispose());
 }
 return {root,lookHeight:105};
}
