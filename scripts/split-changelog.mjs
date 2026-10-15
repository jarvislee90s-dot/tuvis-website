// scripts/split-changelog.mjs —— 双源同步：CHANGELOG.md + docs/capabilities.json
//   → src/content/{changelog,capabilities}.json（产物入 git 作离线兜底）。
// 用法：
//   node scripts/split-changelog.mjs                  # 默认：api.github.com contents 通道拉双源
//   node scripts/split-changelog.mjs --in <本地md>     # changelog 走本地文件（capabilities 仍走网络）
//   node scripts/split-changelog.mjs --offline         # 全离线：跳过网络，保留现有产物
// 失败语义：任一源失败 → 警告并保留上次同步产物，退出码 0（dev / build 不被打断）。
//
// ── 双语条目格式约定（主仓 CHANGELOG.md 的写法契约，tuvis#157 定案）──────────
// 条目默认中文；需要英文翻译的条目，在中文行（含其缩进续行）写完后，紧跟一行 `EN: …`：
//
//   ### Added
//
//   - 子 Agent 运行 chip 与观察台
//     EN: Sub-agent run chips and an observatory
//   - 纯中文条目照旧，不写 EN 行（站点英文页对它逐条标注 English in progress）
//
// 规则：① `EN:` 半角冒号、冒号前无空格，行首允许缩进（与列表项文字对齐最自然；全角
// 「EN：」、「EN :」、「En:」等近失形态不符合契约，构建日志会告警且该行按中文续行解析）；② EN 行必须紧跟
// 某条中文条目——节首孤儿 EN 行按旧行为丢弃；③ EN 行之后的缩进续行并入英文，直到
// 下一个条目 / 分区标题 / 版本标题；④ `- EN: …`（写成列表项）不识别为英文，会按中文
// 条目原文解析——这是格式错误，GitHub 上它会渲染成一颗子弹，肉眼可见。
// 解析产物：每条目 { zh, en? }——en 键仅在写过 EN 行时存在（缺省即「未翻译」信号，
// 不用空串表达）。
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

export function parseChangelog(md) {
  const out = [];
  let cur = null;
  let sec = null;
  let enMode = false; // EN 行之后的续行归英文（直到下一个条目/标题）
  for (const line of md.split(/\r?\n/)) {
    const v = line.match(/^## \[([^\]]+)\]\s*-\s*(\d{4}-\d{2}-\d{2})/);
    if (v) { cur = { version: v[1], date: v[2], sections: {} }; out.push(cur); sec = null; enMode = false; continue; }
    if (!cur) continue;
    const h = line.match(/^###\s+(.+)/);
    if (h) { sec = h[1].trim(); cur.sections[sec] = cur.sections[sec] ?? []; enMode = false; continue; }
    if (!sec) continue;
    const en = line.match(/^\s*EN:\s*(.*)$/);
    if (en) {
      const text = en[1].trim();
      if (text) {
        const items = cur.sections[sec];
        const last = items[items.length - 1];
        if (last) {
          last.en = last.en ? `${last.en} ${text}` : text;
          enMode = true;
        }
      }
      continue;
    }
    // 近失兜底：全角「EN：」、「EN :」、「En:」等不匹配契约（严格 EN:），会静默并入中文续行——构建日志点破
    if (/^\s*EN\s*[:：]/i.test(line)) console.warn(`[sync] changelog 条目出现近失「${line.trim()}」——契约要求严格「EN:」，该行已按中文续行解析`);
    if (/^- /.test(line)) { cur.sections[sec].push({ zh: line.replace(/^- /, "").trim() }); enMode = false; }
    else if (line.trim() && cur.sections[sec].length) {
      const last = cur.sections[sec][cur.sections[sec].length - 1];
      if (enMode) last.en += " " + line.trim();
      else last.zh += " " + line.trim();
    }
  }
  return out;
}

/** api.github.com contents 响应 → utf8 文本（content 为带换行的 base64） */
export function decodeContent(payload) {
  if (!payload || typeof payload.content !== "string") {
    throw new Error("unexpected contents payload: missing .content");
  }
  return Buffer.from(payload.content.replace(/\n/g, ""), "base64").toString("utf8");
}

/** 工具键合法性基准：从 src/demo/tools.ts 的 TOOLS 里提取（I2——上游改键名时闸门先拦，
 *  读文件 + 正则，不引 TS）。注意：不能用 new URL(字面量, import.meta.url) 定位——Vite/vitest
 *  会把它当静态资源改写导致读盘失败；用 fileURLToPath(import.meta.url) 拼真实路径。
 *  读不到时返回空集 = 跳过键名合法性校验（不阻塞其它校验）。 */
let _knownToolsCache = null;
function knownToolKeys() {
  if (_knownToolsCache !== null) return _knownToolsCache;
  try {
    const toolsPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/demo/tools.ts");
    const src = readFileSync(toolsPath, "utf8");
    _knownToolsCache = new Set([...src.matchAll(/key:\s*"([^"]+)"/g)].map((m) => m[1]));
  } catch {
    _knownToolsCache = new Set();
  }
  return _knownToolsCache;
}

const SUPPORT_VALUES = new Set(["yes", "partial", "experimental", "no"]);

/** capabilities 结构闸门（I2 补齐）：通过才允许落盘（半拉取/HTML 错误页防混入）。
 *  ① tools 为非空数组且每个键都能对上 src/demo/tools.ts 的 TOOLS（数量不再硬锁 8——渲染数据驱动）；
 *  ② 每行 support 覆盖全部 tools（缺键拒绝）且取值 ∈ yes/partial/experimental/no（未知取值拒绝）。 */
export function validateCapabilities(data) {
  if (data === null || typeof data !== "object"
    || !Array.isArray(data.tools) || data.tools.length < 1
    || !Array.isArray(data.groups) || data.groups.length < 1) return null;
  const known = knownToolKeys();
  for (const tool of data.tools) {
    if (typeof tool !== "string") return null;
    if (known && !known.has(tool)) return null;
  }
  const toolSet = new Set(data.tools);
  for (const g of data.groups) {
    if (!Array.isArray(g.rows)) return null;
    for (const r of g.rows) {
      if (!r || typeof r.name !== "string" || !r.support || typeof r.support !== "object") return null;
      for (const tool of data.tools) {
        if (!(tool in r.support)) return null;                       // 覆盖校验：缺键拒绝
        if (!SUPPORT_VALUES.has(r.support[tool])) return null;       // 取值域校验：未知取值拒绝
      }
    }
  }
  return data;
}

const API_BASE = "https://api.github.com/repos/jarvislee90s-dot/tuvis/contents";
const SOURCES = [
  { key: "changelog", path: "CHANGELOG.md", out: "src/content/changelog.json" },
  { key: "capabilities", path: "docs/capabilities.json", out: "src/content/capabilities.json" },
];

/** contents 拉取：3 次重试（schannel 吊销检查偶发失败）；403/429 限流直接放弃重试 */
async function fetchSource(src, { attempts = 3, timeoutMs = 5000 } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, i * 600));
    try {
      const headers = { "User-Agent": "tuvis-website-sync", Accept: "application/vnd.github+json" };
      if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;   // I1：与 sync-user-manual 对齐，deploy.yml 注释的限额承诺兑现
      const res = await fetch(`${API_BASE}/${src.path}`, {
        headers,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.status === 403 || res.status === 429) {
        throw Object.assign(new Error(`rate-limited (HTTP ${res.status})`), { noRetry: true });
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return decodeContent(await res.json());
    } catch (err) {
      lastErr = err;
      if (err?.noRetry) break;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

// CLI 入口
if (process.argv[1]?.endsWith("split-changelog.mjs")) {
  const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
  const inp = arg("--in", null);
  const offline = process.argv.includes("--offline");
  const jobs = offline ? [] : SOURCES.filter((s) => !(s.key === "changelog" && inp));
  const results = await Promise.allSettled(jobs.map(async (s) => ({ s, text: await fetchSource(s) })));
  for (const r of results) {
    if (r.status === "rejected") { console.warn(`[sync] ${r.reason.message}：保留上次同步的产物`); continue; }
    const { s, text } = r.value;
    try {
      if (s.key === "changelog") {
        writeFileSync(arg("--out", s.out), JSON.stringify(parseChangelog(text), null, 2));
      } else {
        const data = validateCapabilities(JSON.parse(text));
        if (!data) { console.warn("::warning::[sync] capabilities 结构校验未过（键名/覆盖/取值域）：保留上次同步的产物"); continue; }
        writeFileSync(s.out, JSON.stringify(data, null, 2));
      }
      console.log(`[sync] ${s.path} -> ${s.out}`);
    } catch (e) {
      console.warn(`[sync] ${s.key} 写入失败（${e.message}），保留上次同步的产物`);
    }
  }
  if (inp) {   // 本地回退通道：离线改稿/链路排查用（网络 changelog 已被跳过，不双写）
    try {
      const md = readFileSync(inp, "utf8");
      writeFileSync(arg("--out", "src/content/changelog.json"), JSON.stringify(parseChangelog(md), null, 2));
      console.log(`[sync] changelog(local) ${inp} -> src/content/changelog.json`);
    } catch {
      console.warn(`[sync] --in 输入不存在（${inp}），保留现有 src/content/changelog.json`);
    }
  }
}
