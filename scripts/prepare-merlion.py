"""Convert the attributed Merlion STL to a centered, Y-up, indexed GLB.
Build-only dependencies: trimesh, fast-simplification, numpy (install in a venv).
Usage: python scripts/prepare-merlion.py /path/to/Merlion_Detailed.stl
"""
import sys, json, hashlib
from pathlib import Path
import numpy as np
import trimesh
source=Path(sys.argv[1]);out=Path(__file__).resolve().parents[1]/'prototype/assets/merlion'
mesh=trimesh.load_mesh(source,process=True)
original=len(mesh.faces)
mesh=mesh.simplify_quadric_decimation(face_count=80000)
# STL is Z-up. Preserve the original sculpt's proportions at monument scale.
mesh.apply_transform(trimesh.transformations.rotation_matrix(-np.pi/2,[1,0,0]))
mesh.apply_scale(8.6/mesh.extents[1])
bounds=mesh.bounds;mesh.apply_translation([-(bounds[0,0]+bounds[1,0])/2,-bounds[0,1],-(bounds[0,2]+bounds[1,2])/2])
normals=np.zeros_like(mesh.vertices)
face_normals=np.cross(mesh.vertices[mesh.faces[:,1]]-mesh.vertices[mesh.faces[:,0]],mesh.vertices[mesh.faces[:,2]]-mesh.vertices[mesh.faces[:,0]])
for column in range(3): np.add.at(normals,mesh.faces[:,column],face_normals)
normals/=np.maximum(np.linalg.norm(normals,axis=1,keepdims=True),1e-12)
mesh.vertex_normals=normals
# Bake a mild cavity tint into vertex colors; no runtime AO pass or texture.
sums=np.zeros_like(mesh.vertices);counts=np.zeros(len(mesh.vertices))
for i,j in [(0,1),(1,2),(2,0),(1,0),(2,1),(0,2)]:
 np.add.at(sums,mesh.faces[:,i],mesh.vertices[mesh.faces[:,j]])
 np.add.at(counts,mesh.faces[:,i],1)
lap=sums/np.maximum(counts[:,None],1)-mesh.vertices
cavity=np.clip(np.einsum('ij,ij->i',lap,normals)*12,0,.38)
shade=np.clip(1-cavity-np.maximum(0,-normals[:,1])*.12,.5,1)
colors=np.ones((len(mesh.vertices),4),dtype=np.uint8)*255
colors[:,:3]=(shade[:,None]*255).astype(np.uint8)
mesh.visual.vertex_colors=colors
scene=trimesh.Scene(mesh)
out.mkdir(parents=True,exist_ok=True)
# Include smoothed normals so stone highlights reveal the mane and face.
blob=trimesh.exchange.gltf.export_glb(scene,include_normals=True)
(out/'merlion.glb').write_bytes(blob)
(out/'metadata.json').write_text(json.dumps(dict(name='Singapore Merlion ReSculpt',creator='cymon',originalCreator='keeganTeo',source='https://www.thingiverse.com/thing:5533885',originalSource='https://www.thingiverse.com/thing:1698961',license='CC BY 4.0',licenseUrl='https://creativecommons.org/licenses/by/4.0/',sourceSHA256=hashlib.sha256(source.read_bytes()).hexdigest(),originalTriangles=original,triangles=len(mesh.faces),bytes=len(blob),height=8.6,bounds=mesh.bounds.tolist(),changes='Quadric simplification to 80k faces, Y-up orientation, centered base, uniform 8.6m scale, smooth normals and baked cavity vertex colors; game stone material and fountain added separately.'),indent=2)+'\n')
print((out/'metadata.json').read_text())
