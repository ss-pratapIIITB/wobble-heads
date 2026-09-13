import {readFileSync} from 'node:fs';
import {createVehicle} from '../prototype/js/vehicles.js';
const baseline=JSON.parse(readFileSync(new URL('../docs/benchmarks/geometry-before.json',import.meta.url)));
const rows=baseline.vehicles.map(before=>{
 const car=createVehicle(before.type);let meshes=0,triangles=0;
 car.root.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});
 return {type:before.type,beforeMeshes:before.meshes,meshes,meshReductionPercent:+(100*(1-meshes/before.meshes)).toFixed(1),beforeTriangles:before.triangles,triangles,triangleReductionPercent:+(100*(1-triangles/before.triangles)).toFixed(1)};
});
console.log(JSON.stringify(rows,null,2));
