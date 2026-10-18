import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const assert = (ok, message) => { if (!ok) throw new Error(message); };
const safe = (path) => {
  assert(typeof path === "string" && !path.includes(String.fromCharCode(92)), "Invalid relative path");
  const full = resolve(root, path);
  assert(full.startsWith(root + sep), "Path leaves package: " + path);
  return full;
};
const json = async (path) => JSON.parse(await readFile(safe(path), "utf8"));
const manifest = await json("manifest.json");
const scene = await json("scene.json");
const content = await json("content/world.zh.json");
assert([manifest, scene, content].every(v => v.schemaVersion === 1), "Unsupported schema");
const finite = (v) => typeof v === "number" && Number.isFinite(v);
const point = (p) => Array.isArray(p) && p.length === 2 && p.every(finite);
for (const [id, a] of Object.entries(manifest.assets)) {
  const data = await readFile(safe(a.path));
  assert(createHash("sha256").update(data).digest("hex") === a.sha256, "Image hash mismatch: " + id);
  assert(data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])), "Not PNG: " + id);
  assert(data.readUInt32BE(16) === a.width && data.readUInt32BE(20) === a.height, "Dimensions mismatch: " + id);
  assert(!a.alpha || [4,6].includes(data[25]), "Alpha channel missing: " + id);
}
for (const [id, f] of Object.entries(manifest.frames)) {
  const a = manifest.assets[f.asset];
  const [x,y,w,h] = f.sourceRect;
  assert(a && [x,y,w,h].every(finite) && x >= 0 && y >= 0 && w > 0 && h > 0 && x+w <= a.width && y+h <= a.height, "Bad frame: " + id);
  assert(point(f.anchor) && f.anchor.every(v => v >= 0 && v <= 1), "Bad anchor: " + id);
}
const inside = ([x,y], poly) => {
  let c = false;
  for (let i=0,j=poly.length-1;i<poly.length;j=i++) {
    const a=poly[i],b=poly[j];
    if ((a[1]>y)!==(b[1]>y) && x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) c=!c;
  }
  return c;
};
const distance = (p,a,b) => {
  const dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;
  const t=length ? Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length)) : 0;
  return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);
};
const cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
const intersects=(a,b,c,d)=>{
  const c1=cross(a,b,c),c2=cross(a,b,d),c3=cross(c,d,a),c4=cross(c,d,b);
  if (c1*c2<0 && c3*c4<0) return true;
  return [[c1,c,a,b],[c2,d,a,b],[c3,a,c,d],[c4,b,c,d]].some(([v,p,x,y])=>Math.abs(v)<1e-8 && distance(p,x,y)<1e-8);
};
const segmentDistance=(a,b,c,d)=>intersects(a,b,c,d)?0:Math.min(distance(a,c,d),distance(b,c,d),distance(c,a,b),distance(d,a,b));
const free=(p)=>point(p) && inside(p,scene.walkable) && scene.obstacles.every(poly=>!inside(p,poly)&&poly.every((a,i)=>distance(p,a,poly[(i+1)%poly.length])>=scene.footRadius-1e-7));
const clear=(a,b)=>free(a)&&free(b)&&scene.walkable.every((p,i)=>!intersects(a,b,p,scene.walkable[(i+1)%scene.walkable.length]))&&scene.obstacles.every(poly=>poly.every((p,i)=>segmentDistance(a,b,p,poly[(i+1)%poly.length])>=scene.footRadius-1e-7));
assert(scene.size[0]===1536 && scene.size[1]===1024 && scene.footRadius===12, "Scene contract changed");
for (const [id,p] of Object.entries(scene.nav.nodes)) assert(free(p),"Invalid nav node: "+id);
for (const [a,b] of scene.nav.edges) assert(clear(scene.nav.nodes[a],scene.nav.nodes[b]),"Invalid nav edge: "+a+" / "+b);
const reached=new Set(["spawn"]);
for(let i=0;i<Object.keys(scene.nav.nodes).length;i++)for(const [a,b] of scene.nav.edges){if(reached.has(a))reached.add(b);if(reached.has(b))reached.add(a);}
assert(reached.size===Object.keys(scene.nav.nodes).length,"Disconnected navigation");
assert(new Set(scene.hotspots.map(h=>h.id)).size===scene.hotspots.length,"Duplicate hotspot");
for(const h of scene.hotspots)assert(free(h.approach)&&Object.values(scene.nav.nodes).some(p=>p[0]===h.approach[0]&&p[1]===h.approach[1]),"Unreachable hotspot: "+h.id);
for(const p of scene.props)assert(manifest.frames[p.frame],"Missing prop frame");
for(const p of Object.values(scene.actions))assert(manifest.frames[p.frame],"Missing action frame");
assert(content.equipment.length===4 && content.stories.length===3 && content.quest.modules.length===3,"Content counts");
for(const id of manifest.coreAssets)assert(manifest.assets[id],"Missing core asset: "+id);
for(const id of [content.heroAsset,content.cityAsset,content.workshopPreviewAsset,scene.background])assert(manifest.assets[id],"Missing page/background asset: "+id);
assert(manifest.contentPath==="content/world.zh.json" && manifest.scenePath==="scene.json","Data entry paths");
const modules=new Set(content.quest.modules.map(m=>m.id));
assert(modules.size===3 && scene.assembly.modules.length===3,"Module ids");
for(const m of scene.assembly.modules)assert(modules.has(m.id)&&manifest.frames[m.frame],"Missing assembly module/frame");
for(const f of [scene.assembly.body.frame,scene.assembly.complete.frame,scene.rackDisplay.frame])assert(manifest.frames[f],"Missing assembly/rack frame");
for(const h of scene.hotspots){
  if(h.moduleId)assert(modules.has(h.moduleId),"Unknown module at hotspot");
  if(h.kind==="world")assert(content.world.some(c=>c.id===h.contentId),"Unknown world content");
  if(h.kind==="door")assert(content.doors.some(c=>c.id===h.contentId),"Unknown door content");
}
const desk=scene.props.find(p=>p.frame==="deskChair");
assert(scene.actions.sit.depth>desk.depth,"Seated depth must render in front of chair");
for(const a of [...content.equipment,...content.world,...content.stories])assert(manifest.assets[a.asset],"Missing content image");
const sums=await json("checksums.json");
for(const [path,sha] of Object.entries(sums.files)){const data=await readFile(safe(path));assert(createHash("sha256").update(data).digest("hex")===sha,"File checksum mismatch: "+path);}
console.log("PASS: "+Object.keys(manifest.assets).length+" images, "+Object.keys(manifest.frames).length+" frames, "+scene.hotspots.length+" hotspots, "+reached.size+" connected nodes, "+Object.keys(sums.files).length+" checked files.");
console.log("Static resource verification only; website implementation and browser acceptance remain in the plan.");
