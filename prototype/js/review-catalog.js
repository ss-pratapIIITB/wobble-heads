export function buildReviewCatalog(candidates){
 const cars=[['jeep','Trail / open 4×4','Roofless Rubicon-inspired design. Working door, cabin and wheels.'],['mini','Coast / cabrio','Roofless Mini-inspired design. Working door and four-seat interior.'],['sports','Veloce / racing coupe','Playable racing coupe. 86 km/h top speed and quick acceleration.'],['sedan','Yard sedan','Locked NPC traffic · dark glass · lightweight shell.'],['hatch','Yard hatchback','Locked NPC traffic · dark glass · lightweight shell.'],['van','Yard delivery van','Locked NPC traffic · dark glass · lightweight shell.']].map(([vehicle,name,notes])=>({id:'yard-'+vehicle,vehicle,name,notes,kind:'car',origin:'Yard design'}));
 const people=[['explorer','Explorer','readyplayer.me'],['dancer','Dancer','Michelle'],['ranger','Police officer','Soldier'],['friend','Friend','readyplayer.me']].map(([id,name,rig])=>({id:'yard-'+id,name,rig,kind:'human',origin:'Yard cast',notes:rig==='readyplayer.me'?'Current cast · shared Explorer/Friend model.':'Current cast · distance-driven gait.',source:'https://github.com/mrdoob/three.js/tree/r170/examples/models/gltf'}));
 return [...cars,...people,...candidates.filter(i=>i.kind==='human').map(candidate)];
}
function candidate(item){return {...item,id:'candidate-'+item.id,origin:'Downloaded · CC0',notes:item.kind==='car'?'Lightweight traffic candidate. Cabin and door adaptation required.':'Live yard NPC · 24 native animations.'};}
export function clipView(rect,width,height){
 const left=Math.max(0,rect.left),right=Math.min(width,rect.right),top=Math.max(0,rect.top),bottom=Math.min(height,rect.bottom);
 return right<=left||bottom<=top?null:{x:left,y:height-bottom,width:right-left,height:bottom-top};
}
