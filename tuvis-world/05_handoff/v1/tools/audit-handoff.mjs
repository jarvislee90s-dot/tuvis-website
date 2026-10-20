import { readFile, readdir } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const project = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const packPrefix = "tuvis-world/05_handoff/v1/";
const pack = resolve(project, packPrefix);
const assert = (ok,message) => { if(!ok)throw new Error(message); };
const read = async path => readFile(resolve(project,path),"utf8");
const specPath="docs/superpowers/specs/2026-10-19-tuvis-world-website-requirements.md";
const planPath="docs/superpowers/plans/2026-10-19-tuvis-world-website-workshop.md";
const readinessPath="docs/superpowers/specs/2026-10-19-tuvis-world-readiness.md";
const spec=await read(specPath),plan=await read(planPath);
const manifest=JSON.parse(await read(packPrefix+"manifest.json"));
const scene=JSON.parse(await read(packPrefix+"scene.json"));
const content=JSON.parse(await read(packPrefix+"content/world.zh.json"));
assert(Object.keys(manifest.assets).length===24,"Asset inventory count");
for(const [id,a] of Object.entries(manifest.assets)){
  const path=packPrefix+a.path;
  await readFile(resolve(project,path));
  const row="| "+id+" | "+path+" |";
  assert(spec.includes(row)&&plan.includes(row),"Missing material use mapping: "+id);
}
const taskFiles=[...plan.matchAll(/^\*\*Files:\*\* (.+)$/gm)].map(m=>m[1]);
assert(taskFiles.length===9,"Task file lists");
const rootFiles=new Set(["package.json","pnpm-lock.yaml",".nvmrc","README.md"]);
for(const line of taskFiles){
  for(const raw of line.split(/[、；]/)){
    const item=raw.replace(/^(Create|Modify|Test)\s+/,"").trim().split(/\s+/)[0].replace(/[。；]+$/,"");
    assert(rootFiles.has(item)||/^(src|scripts|docs)\/[A-Za-z0-9_./-]+$/.test(item),"Ambiguous task file path: "+item);
  }
}
assert(plan.includes("loadWorldContent(fetcher?: typeof fetch): Promise<WorldContentBundle>"),"Homepage loader");
assert(plan.includes("Consumes WorldContentBundle、loadWorldContent"),"Homepage interface must not require scene");
assert(plan.includes("overlay: ContentOverlay | null"),"Content panel must not require workshop-only overlays");
assert(spec.includes("首页只加载 manifest 与内容 JSON"),"Homepage isolation requirement");
assert(!spec.includes("  panels/"),"Unmatched panel folder");
assert(spec.includes("pnpm 10.20.0")&&plan.includes("pnpm 10.20.0"),"Tool version mismatch");
assert(content.ui.enter==="进入兔维斯工坊"&&spec.includes("“进入兔维斯工坊”进入互动页"),"CTA copy mismatch");
assert(plan.includes("该事件仅由 Task 6 到达装备架触发"),"Ambiguous rack completion owner");
assert(scene.actions.sit.depth>scene.props.find(p=>p.frame==="deskChair").depth,"Seated depth");
assert(scene.assembly.grid&&scene.assembly.grid.rows===3&&scene.assembly.grid.cols===3&&Object.keys(scene.assembly.grid.cells).length===4,"Assembly grid contract");
assert(plan.includes("导航脚底仍保持椅子靠近点"),"Seated navigation recovery");
const docs=[specPath,planPath,readinessPath];
for(const path of docs){
  const text=await read(path);
  assert(!/\b(TODO|TBD|PLACEHOLDER)\b/.test(text),"Document placeholder: "+path);
  for(const m of text.matchAll(/\]\(([^)]+)\)/g)){
    if(m[1].includes("://")||m[1].startsWith("#"))continue;
    const full=resolve(dirname(resolve(project,path)),m[1].split("#")[0]);
    assert(full.startsWith(project+sep),"Document link escapes project");
    await readFile(full);
  }
}
const machinePath=/(?:\/Users\/|\/home\/|\/tmp\/|\/private\/|file:\/\/\/|[A-Za-z]:\\)/;
async function scan(dir){
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const full=resolve(dir,entry.name);
    if(entry.isDirectory())await scan(full);
    else if(/\.(md|json|txt)$/.test(entry.name)){
      const text=await readFile(full,"utf8");
      assert(!machinePath.test(text),"Machine-specific path: "+entry.name);
    }
  }
}
for(const path of docs)assert(!machinePath.test(await read(path)),"Machine-specific document path");
await scan(pack);
const provenance=JSON.parse(await read(packPrefix+"asset-provenance.json"));
for(const x of [...provenance.generated,...provenance.reused])if(x.prompt)await readFile(resolve(project,x.prompt));
console.log("PASS: spec/plan material mappings 24/24; 9 root-relative task file lists; loader, state-event and pose contracts aligned.");
console.log("PASS: document links, provenance prompts and portable active-package paths.");
