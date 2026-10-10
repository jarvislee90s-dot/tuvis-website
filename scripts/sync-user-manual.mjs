// 把兔维斯仓的「用户手册真值」（docs/user-manual：MD 正文 + img/ 共享图）整棵
// 同步到本仓 public/manual/ —— 真值在产品仓，网站消费生成物。
//
// 双通道（仿 split-changelog 惯例）：
//   默认     GitHub API：git/trees 列目录（1 次调用）+ raw.githubusercontent 逐文件下载
//   --src X  本地目录回退（离线改稿/链路排查）
//   --offline 跳过网络，保留现有产物
//   --budget N 网络阶段总预算毫秒（默认 30000；dev 传短值保证快速起服）
// 慢代理语义：raw 单文件超时/限流都会吃预算——预算耗尽立即整体放弃 → 回退本地源 / 仓内副本
// （public/manual 已入 git），dev / build 永不被同步卡死。
// C1（部署链评审）：下载写入 public/manual.tmp 暂存目录，全量成功才原子换名——任何失败/
// 预算耗尽都不触碰现有 public/manual（CI 上没有 ../mam-worktree2 本地源也安全回退到仓内副本）；
// CI（process.env.CI）下网络同步整体失败时额外 `git checkout -- public/manual` 恢复仓内副本
// 并打 ::error:: 注解，恢复失败才非零退出。
// 可选环境变量 GITHUB_TOKEN：存在则附带鉴权头（Actions 内提升速率上限）。
import { cpSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const REPO = "jarvislee90s-dot/tuvis";
const TREE_API = (ref) => `https://api.github.com/repos/${REPO}/git/trees/${ref}?recursive=1`;
const RAW = (ref, p) => `https://raw.githubusercontent.com/${REPO}/${ref}/${p}`;
const PREFIX = "docs/user-manual/";
const DIRS = ["zh", "en", "img"];
const dest = path.resolve("public/manual");

/** tree API 响应 → docs/user-manual 下的文件相对路径清单 */
export function manualPathsFromTree(tree) {
  if (!tree || !Array.isArray(tree.tree)) throw new Error("unexpected tree payload");
  return tree.tree
    .filter((e) => e.type === "blob" && e.path.startsWith(PREFIX))
    .map((e) => e.path.slice(PREFIX.length))
    .filter((rel) => DIRS.includes(rel.split("/")[0]));
}

/** raw 拉取：2 次重试、单次 10s；尝试启动前预判「本次能否在预算内完成」（dev 快速回退的关键）；403/429 限流不重试 */
async function fetchRaw(url, deadline, { attempts = 2, timeoutMs = 10000 } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    if (Date.now() + timeoutMs > deadline) { lastErr = new Error("budget exhausted"); break; }
    if (i > 0) await new Promise((r) => setTimeout(r, 500));
    try {
      const headers = { "User-Agent": "tuvis-website-sync" };
      if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(timeoutMs) });
      if (res.status === 403 || res.status === 429) {
        throw Object.assign(new Error(`rate-limited (HTTP ${res.status})`), { noRetry: true });
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      lastErr = err;
      if (err?.noRetry) break;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

async function syncFromNetwork(ref, budgetMs) {
  /* C1：全程只写 public/manual.tmp 暂存目录，dest 在原子换名前不被触碰 */
  const deadline = Date.now() + budgetMs;
  const stage = path.resolve("public/manual.tmp");
  const headers = { "User-Agent": "tuvis-website-sync", Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(TREE_API(ref), { headers, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`tree API HTTP ${res.status}`);
  const rels = manualPathsFromTree(await res.json());
  if (rels.length === 0) throw new Error("docs/user-manual 下没有文件");
  console.log(`[sync-user-manual] GitHub ${ref}：拉取 ${rels.length} 个文件（预算 ${Math.round(budgetMs / 1000)}s）…`);
  rmSync(stage, { recursive: true, force: true });
  const failed = [];
  for (let i = 0; i < rels.length; i++) {
    const rel = rels[i];
    if (Date.now() + 10000 > deadline) {
      failed.push(`…（预算耗尽，剩余 ${rels.length - i} 个未拉）`);
      break;
    }
    const target = path.join(stage, rel);
    try {
      const buf = await fetchRaw(RAW(ref, PREFIX + rel), deadline);
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, buf);
      if ((i + 1) % 10 === 0) console.log(`[sync-user-manual] 已拉取 ${i + 1}/${rels.length}…`);
    } catch (e) {
      failed.push(`${rel}（${e.message}）`);
    }
  }
  /* C1：全量成功才原子换名——任何缺失 → 丢弃暂存目录并抛错（dest 全程未被触碰，
     CI 上仓内已提交副本完好，不会出现「无手册站点」） */
  if (failed.length > 0) {
    rmSync(stage, { recursive: true, force: true });
    throw new Error(`${failed.length}/${rels.length} 个文件拉取失败：${failed.slice(0, 3).join("、")}`);
  }
  rmSync(dest, { recursive: true, force: true });
  renameSync(stage, dest);
  console.log(`[sync-user-manual] GitHub ${ref} docs/user-manual → ${dest}（${rels.length} 个文件）`);
}

function syncFromLocal(src) {
  if (!existsSync(src)) {
    console.warn(`[sync-user-manual] 本地源不存在，跳过: ${src}`);
    return;
  }
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  for (const dir of DIRS) {
    const from = path.join(src, dir);
    if (existsSync(from)) {
      mkdirSync(path.join(dest, dir), { recursive: true });
      cpSync(from, path.join(dest, dir), { recursive: true });
    }
  }
  console.log(`[sync-user-manual] ${src} → ${dest}`);
}

// CLI 入口
if (process.argv[1]?.endsWith("sync-user-manual.mjs")) {
  const argIdx = process.argv.indexOf("--src");
  const src = path.resolve(argIdx > -1 ? process.argv[argIdx + 1] : "../mam-worktree2/docs/user-manual");
  const offline = process.argv.includes("--offline");
  const ref = process.argv.find((a) => /^--ref=/.test(a))?.split("=")[1] ?? "main";
  const budgetIdx = process.argv.indexOf("--budget");
  const budgetMs = budgetIdx > -1 ? Number(process.argv[budgetIdx + 1]) || 30000 : 30000;
  if (!offline) {
    try {
      await syncFromNetwork(ref, budgetMs);
      process.exit(0);
    } catch (e) {
      console.warn(`[sync-user-manual] 网络同步放弃（${e.message}）`);
      if (process.env.CI) {
        /* C1：CI 无 ../mam-worktree2 本地源——显式从 git 恢复仓内已提交副本；
           恢复失败（副本缺失/为空）才硬失败，绝不静默部署无手册站点 */
        console.warn("::error::[sync-user-manual] 手册网络同步失败，正在从 git 恢复仓内副本…");
        try {
          execSync("git checkout -- public/manual", { stdio: "pipe" });
          if (existsSync(dest) && readdirSync(dest).length > 0) {
            console.warn("[sync-user-manual] ⚠️ 已恢复仓内副本：本次部署手册内容可能略旧（以最近一次成功同步为准）");
            process.exit(0);
          }
        } catch { /* 落到硬失败 */ }
        console.error("::error::[sync-user-manual] public/manual 恢复失败且无本地源——拒绝部署无手册站点");
        process.exit(1);
      }
      console.warn("[sync-user-manual] ⚠️ 本地回退已生效：本次使用本地/仓内副本，内容以最近一次成功同步为准");
    }
  }
  syncFromLocal(src);
}
