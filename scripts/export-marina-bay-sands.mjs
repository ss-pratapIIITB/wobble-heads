import {mkdirSync,writeFileSync} from 'node:fs';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {createMarinaBaySands} from '../prototype/js/marina-bay-sands.js';
// Node adapter for Three's browser-oriented exporter; no textures in this asset.
globalThis.FileReader=class {readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
const {root}=createMarinaBaySands();let triangles=0,meshes=0;
root.traverse(o=>{if(o.isMesh){triangles+=o.geometry.attributes.position.count/3;meshes++;}});
const binary=await new GLTFExporter().parseAsync(root,{binary:true});
const path=new URL('../prototype/assets/marina-bay-sands/',import.meta.url);mkdirSync(path,{recursive:true});
writeFileSync(new URL('marina-bay-sands.glb',path),Buffer.from(binary));
writeFileSync(new URL('metadata.json',path),JSON.stringify({name:'Marina Bay Sands — game interpretation',triangles,meshes,bytes:binary.byteLength,source:'prototype/js/marina-bay-sands.js',reference:'https://www.safdiearchitects.com/projects/marina-bay-sands-hotel-and-skypark',note:'Original reference-based game geometry; not a surveyed architectural replica.'},null,2)+'\n');
console.log({triangles,meshes,bytes:binary.byteLength});
