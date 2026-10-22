// 把兔维斯仓的「用户手册真值」（docs/user-manual：MD 正文 + img/ 共享图）整棵
// 同步到本仓 public/manual/ —— 真值在产品仓，网站消费生成物。
//
// 双通道（仿 split-changelog 惯例）：
//   默认     GitHub API：git/trees 固定 ref 列目录（1 次调用）+ git/blobs 按 SHA 逐文件下载
//   --src X  本地目录回退（离线改稿/链路排查）
//   --offline 跳过网络，保留现有产物
//   --budget N 网络阶段总预算毫秒（普通构建默认 30000；正式发布默认 180000）
// 慢代理语义：blob 单文件超时/限流都会吃预算——预算耗尽立即整体放弃 → 回退本地源 / 仓内副本
// （public/manual 已入 git），dev / build 永不被同步卡死。
// C1（部署链评审）：下载写入 public/manual.tmp 暂存目录，全量成功才原子换名——任何失败/
// 预算耗尽都不触碰现有 public/manual（CI 上没有 ../mam-worktree2 本地源也安全回退到仓内副本）；
// CI（process.env.CI）下网络同步整体失败时额外 `git checkout -- public/manual` 恢复仓内副本
// 并打 ::error:: 注解，恢复失败才非零退出。
// 正式发布设置 TUVIS_RELEASE_REF=vX.Y.Z 后固定读取该 tag；workflow 提供 checkout 时从本地 tag 树复制，
// 否则通过 Git blobs API 拉取。网络或内容失败直接退出非零，不回退仓内副本。
// 可选环境变量 GITHUB_TOKEN：存在则附带鉴权头（Actions 内提升速率上限）。
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { execFileSync, execSync } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";
import { parseStableTag } from "./release-policy.mjs";

const REPO = "jarvislee90s-dot/tuvis";
const TREE_API = (ref) => `https://api.github.com/repos/${REPO}/git/trees/${ref}?recursive=1`;
export const blobApiUrl = (sha) => `https://api.github.com/repos/${REPO}/git/blobs/${sha}`;
export const BLOB_TIMEOUT_MS = 30000;
export const MANUAL_DOWNLOAD_CONCURRENCY = 3;
const PREFIX = "docs/user-manual/";
const DIRS = ["zh", "en", "img"];
const dest = path.resolve("public/manual");

/** tree API 响应 → docs/user-manual 下带不可变 blob SHA 的文件清单 */
export function manualEntriesFromTree(tree) {
  if (!tree || !Array.isArray(tree.tree)) throw new Error("unexpected tree payload");
  return tree.tree
    .filter((e) => e.type === "blob" && e.path.startsWith(PREFIX))
    .filter((e) => DIRS.includes(e.path.slice(PREFIX.length).split("/")[0]))
    .map((e) => {
      if (typeof e.sha !== "string" || !Number.isFinite(e.size)) throw new Error(`invalid blob entry: ${e.path}`);
      return { path: e.path.slice(PREFIX.length), sha: e.sha, size: e.size };
    });
}

/** tree API 响应 → docs/user-manual 下的文件相对路径清单 */
export function manualPathsFromTree(tree) {
  return manualEntriesFromTree(tree).map((entry) => entry.path);
}

export function manualSlugsFromSource(source) {
  const slugs = [...source.matchAll(/\bslug:\s*["']([^"']+)["']/g)].map((match) => match[1]);
  if (slugs.length === 0) throw new Error("src/content/manual.ts contains no manual page slugs");
  if (new Set(slugs).size !== slugs.length) throw new Error("src/content/manual.ts contains duplicate manual page slugs");
  return slugs;
}

function requiredManualSlugs() {
  return manualSlugsFromSource(readFileSync(path.resolve("src/content/manual.ts"), "utf8"));
}

export function validateManualTree(manualRoot, slugs) {
  const root = path.resolve(manualRoot);
  for (const language of ["zh", "en"]) {
    for (const slug of slugs) {
      const page = path.join(root, language, `${slug}.md`);
      if (!existsSync(page) || !statSync(page).isFile()) {
        throw new Error(`release manual is missing required page: ${language}/${slug}.md`);
      }
      const markdown = readFileSync(page, "utf8");
      const imageRefs = [
        ...[...markdown.matchAll(/!\[[^\]]*\]\(\s*(?:<([^>]+)>|([^\s)]+))/g)].map((match) => match[1] ?? match[2]),
        ...[...markdown.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)].map((match) => match[1]),
      ];
      for (const ref of imageRefs) {
        if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(ref)) continue;
        let localRef = ref.split(/[?#]/, 1)[0];
        try { localRef = decodeURIComponent(localRef); } catch { /* preserve the literal path for the error */ }
        const image = path.resolve(path.dirname(page), localRef);
        const relative = path.relative(root, image);
        if (relative.startsWith("..") || path.isAbsolute(relative) || !existsSync(image) || !statSync(image).isFile()) {
          throw new Error(`release manual image is missing or outside docs/user-manual: ${language}/${slug}.md → ${ref}`);
        }
      }
    }
  }
}

export function gitBlobSha(data) {
  const bytes = Buffer.from(data);
  const header = Buffer.from(`blob ${bytes.length}\0`);
  return createHash("sha1").update(header).update(bytes).digest("hex");
}

export function manualSyncBudget(strict, requested = 0) {
  if (Number.isFinite(requested) && requested > 0) return requested;
  return strict ? 180000 : 30000;
}

export async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let next = 0;
  const workerCount = Math.min(items.length, Math.max(1, Math.floor(concurrency) || 1));
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await mapper(items[index], index);
    }
  }));
  return results;
}

/** Git blobs API 拉取：2 次重试、单次 30s；403/429 限流不重试 */
export async function fetchBlob(sha, deadline, { attempts = 2, timeoutMs = BLOB_TIMEOUT_MS, fetchImpl = fetch } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 500));
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) { lastErr = new Error("budget exhausted"); break; }
    try {
      const headers = { "User-Agent": "tuvis-website-sync", Accept: "application/vnd.github.raw+json" };
      if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
      const res = await fetchImpl(blobApiUrl(sha), { headers, signal: AbortSignal.timeout(Math.min(timeoutMs, remainingMs)) });
      if (res.status === 403 || res.status === 429) {
        throw Object.assign(new Error(`rate-limited (HTTP ${res.status})`), { noRetry: true });
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const bytes = Buffer.from(await res.arrayBuffer());
      const actualSha = gitBlobSha(bytes);
      if (actualSha !== sha) throw new Error(`blob SHA mismatch: expected ${sha}, received ${actualSha}`);
      return bytes;
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
  const entries = manualEntriesFromTree(await res.json());
  if (entries.length === 0) throw new Error("docs/user-manual 下没有文件");
  console.log(`[sync-user-manual] GitHub ${ref}：通过 blob API 拉取 ${entries.length} 个文件（预算 ${Math.round(budgetMs / 1000)}s）…`);
  rmSync(stage, { recursive: true, force: true });
  const failed = [];
  let completed = 0;
  await mapWithConcurrency(entries, MANUAL_DOWNLOAD_CONCURRENCY, async (entry) => {
    const rel = entry.path;
    const target = path.join(stage, rel);
    try {
      const buf = await fetchBlob(entry.sha, deadline);
      if (buf.length !== entry.size) throw new Error(`size mismatch: expected ${entry.size}, received ${buf.length}`);
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, buf);
      completed++;
      if (completed % 10 === 0) console.log(`[sync-user-manual] 已拉取 ${completed}/${entries.length}…`);
    } catch (e) {
      failed.push(`${rel}（${e.message}）`);
    }
  });
  /* C1：全量成功才原子换名——任何缺失 → 丢弃暂存目录并抛错（dest 全程未被触碰，
     CI 上仓内已提交副本完好，不会出现「无手册站点」） */
  if (failed.length > 0) {
    rmSync(stage, { recursive: true, force: true });
    throw new Error(`${failed.length}/${entries.length} 个文件拉取失败：${failed.slice(0, 3).join("、")}`);
  }
  try {
    validateManualTree(stage, requiredManualSlugs());
  } catch (error) {
    rmSync(stage, { recursive: true, force: true });
    throw error;
  }
  rmSync(dest, { recursive: true, force: true });
  renameSync(stage, dest);
  console.log(`[sync-user-manual] GitHub ${ref} docs/user-manual → ${dest}（${entries.length} 个文件）`);
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

function countFiles(directory) {
  if (!existsSync(directory)) return 0;
  let count = 0;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const child = path.join(directory, entry.name);
    count += entry.isDirectory() ? countFiles(child) : 1;
  }
  return count;
}

export function syncFromReleaseCheckout(ref, sourceRoot, destination = dest) {
  if (!parseStableTag(ref)) throw new Error("release manual source must use a stable vMAJOR.MINOR.PATCH tag");
  const root = path.resolve(sourceRoot);
  const git = (...args) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8", stdio: "pipe" }).trim();
  const head = git("rev-parse", "HEAD");
  const tagCommit = git("rev-parse", `${ref}^{commit}`);
  if (head !== tagCommit) throw new Error(`Tuvis source checkout is not checked out at ${ref}`);

  const source = path.join(root, "docs/user-manual");
  validateManualTree(source, requiredManualSlugs());

  const target = path.resolve(destination);
  const stage = `${target}.tmp`;
  rmSync(stage, { recursive: true, force: true });
  mkdirSync(stage, { recursive: true });
  try {
    for (const dir of DIRS) {
      const from = path.join(source, dir);
      if (countFiles(from) === 0) continue;
      const to = path.join(stage, dir);
      mkdirSync(to, { recursive: true });
      cpSync(from, to, { recursive: true });
    }
    rmSync(target, { recursive: true, force: true });
    renameSync(stage, target);
    console.log(`[sync-user-manual] Tuvis ${ref} checkout docs/user-manual → ${target}`);
  } catch (error) {
    rmSync(stage, { recursive: true, force: true });
    throw error;
  }
}

export async function runManualSync({
  ref = "main",
  strict = false,
  offline = false,
  localOverride = false,
  budgetMs,
  releaseSourceDir = "",
  src,
  ci = Boolean(process.env.CI),
  networkSync = syncFromNetwork,
  releaseSync = syncFromReleaseCheckout,
  localSync = syncFromLocal,
  restoreGit = () => {
    execSync("git checkout -- public/manual", { stdio: "pipe" });
    return existsSync(dest) && readdirSync(dest).length > 0;
  },
} = {}) {
  const effectiveBudgetMs = manualSyncBudget(strict, budgetMs);
  if (strict) {
    if (!parseStableTag(ref)) throw new Error("TUVIS_RELEASE_REF must be a stable vMAJOR.MINOR.PATCH tag");
    if (offline || localOverride) throw new Error("release sync cannot use offline mode or local fallback");
    if (releaseSourceDir) {
      await releaseSync(ref, releaseSourceDir);
      return;
    }
    await networkSync(ref, effectiveBudgetMs);
    return;
  }

  if (!offline) {
    try {
      await networkSync(ref, effectiveBudgetMs);
      return;
    } catch (error) {
      console.warn(`[sync-user-manual] 网络同步放弃（${error.message}）`);
      if (ci) {
        console.warn("::error::[sync-user-manual] 手册网络同步失败，正在从 git 恢复仓内副本…");
        try {
          if (restoreGit()) {
            console.warn("[sync-user-manual] ⚠️ 已恢复仓内副本：本次使用最近一次成功同步的手册快照");
            return;
          }
        } catch { /* 落到硬失败 */ }
        throw new Error("public/manual restore failed; refusing to build without the manual");
      }
      console.warn("[sync-user-manual] ⚠️ 本地回退已生效：本次使用本地/仓内副本，内容以最近一次成功同步为准");
    }
  }

  localSync(src);
}

// CLI 入口
if (process.argv[1]?.endsWith("sync-user-manual.mjs")) {
  const argIdx = process.argv.indexOf("--src");
  const src = path.resolve(argIdx > -1 ? process.argv[argIdx + 1] : "../mam-worktree2/docs/user-manual");
  const offline = process.argv.includes("--offline");
  const releaseRef = process.env.TUVIS_RELEASE_REF?.trim() ?? "";
  const releaseSourceDir = process.env.TUVIS_RELEASE_SOURCE_DIR?.trim() ?? "";
  const cliRef = process.argv.find((a) => /^--ref=/.test(a))?.split("=")[1] ?? "";
  const ref = releaseRef || cliRef || "main";
  const budgetIdx = process.argv.indexOf("--budget");
  const requestedBudget = budgetIdx > -1 ? Number(process.argv[budgetIdx + 1]) : 0;
  const budgetMs = manualSyncBudget(Boolean(releaseRef), requestedBudget);
  try {
    await runManualSync({
      ref,
      strict: Boolean(releaseRef),
      offline,
      localOverride: argIdx > -1,
      budgetMs,
      releaseSourceDir,
      src,
    });
  } catch (error) {
    console.error(`::error::[sync-user-manual] ${error.message}`);
    process.exitCode = 1;
  }
}
