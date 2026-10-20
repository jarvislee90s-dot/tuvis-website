// scripts/split-changelog.mjs —— 三源同步：CHANGELOG.md + CHANGELOG.en.md + docs/capabilities.json
//   → src/content/{changelog,changelog.en,capabilities}.json（产物入 git 作离线兜底）。
// 用法：
//   node scripts/split-changelog.mjs                            # 默认：api.github.com contents 通道拉三源
//   node scripts/split-changelog.mjs --in <zh.md> --in-en <en.md>
//                                                               # 两份 changelog 走本地文件（capabilities 仍走网络）
//   node scripts/split-changelog.mjs --offline                  # 全离线：跳过网络，保留现有产物
// 失败语义：任一源失败 → 警告并保留上次同步产物，退出码 0（dev / build 不被打断）。
//
// ── 中英分文件契约（主仓 2026-10-17 拆分，用户裁决；「同文件内嵌 EN: 行」旧契约作废）────
// 主仓 `CHANGELOG.md` = 纯中文、`CHANGELOG.en.md` = 纯英文，两份各自单语：版本标题 / 日期 /
// 分区与条目顺序逐条对齐（分区名如「工程」↔ `Engineering`），未译条目只在中文版存在——
// 英文版直接不写，不留占位。站点据此分家：/zh/changelog 只读中文产物、/en/changelog 只读
// 英文产物，两边都不做跨语言回落。
// 解析器每文件单语 `parseChangelog(md, lang)`；任一份文件里再出现 `EN:` / `EN：` / `EN :` 行即
// 「旧契约违规」——构建日志点名告警，该行按本文件语言的正文续行处理（不静默丢弃；节首孤儿行
// 无上一条目可并入，照旧丢弃——与拆分前行为一致）。
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

/** 语言 ↔ 主仓文件名（解析告警点名 + 闸门定位用；两份文件各自单语，一一对应） */
export const SRC_FILE = { zh: "CHANGELOG.md", en: "CHANGELOG.en.md" };

export function parseChangelog(md, lang = "zh") {
  const out = [];
  let cur = null;
  let sec = null;
  for (const line of md.split(/\r?\n/)) {
    const v = line.match(/^## \[([^\]]+)\]\s*-\s*(\d{4}-\d{2}-\d{2})/);
    if (v) { cur = { version: v[1], date: v[2], sections: {} }; out.push(cur); sec = null; continue; }
    if (!cur) continue;
    const h = line.match(/^###\s+(.+)/);
    if (h) { sec = h[1].trim(); cur.sections[sec] = cur.sections[sec] ?? []; continue; }
    if (!sec) continue;
    // 旧契约残迹：`EN:` / `EN：` / `EN :`（含缩进）一律告警——新契约两份文件各自单语。
    // 该行不作特殊处理：按本文件语言的正文续行走下去（不静默丢弃、构建日志点破；节首孤儿行仍丢弃）
    if (/^\s*EN\s*[:：]/i.test(line)) {
      console.warn(`[sync] ${SRC_FILE[lang] ?? lang} 出现旧契约的「${line.trim()}」行——中英已分文件，该行按本文件语言的正文续行处理`);
    }
    if (/^- /.test(line)) cur.sections[sec].push({ [lang]: line.replace(/^- /, "").trim() });
    else if (line.trim() && cur.sections[sec].length) {
      const last = cur.sections[sec][cur.sections[sec].length - 1];
      last[lang] += " " + line.trim();
    }
  }
  return out;
}

/** 英文产物的语言纯度字符类：Han 区 + CJK 标点（\u3000-\u303f）+ 全角形（\uff00-\uffef）。
 *  刻意不含曲引号 / 省略号（U+2018-201D / U+2026）：英文正文用它们是正常排版，误报会把
 *  干净的英文文件挡在门外（i18n 文案的零 CJK 闸门更严，因为那是我们自己写的字）。 */
const EN_FORBIDDEN = /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/;

/** 单语产物闸门：en 产物的版本号 / 分区名 / 条目文本出现 Han 或中文排版字符 → 返回违规定位
 *  （空数组 = 通过）。zh 产物不设对照闸门：中文正文本就含 Han，且中文条目里夹英文术语
 *  （macOS / codex / GitHub）是正常写法。 */
export function langViolations(data, lang) {
  if (lang !== "en") return [];
  const bad = [];
  for (const rel of data) {
    if (EN_FORBIDDEN.test(rel.version)) bad.push(`v${rel.version}`);
    for (const [sec, items] of Object.entries(rel.sections)) {
      if (EN_FORBIDDEN.test(sec)) bad.push(`v${rel.version}/${sec}`);
      for (const it of items) {
        const text = it.en ?? "";
        if (EN_FORBIDDEN.test(text)) bad.push(`v${rel.version}/${sec}: ${text.slice(0, 40)}`);
      }
    }
  }
  return bad;
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
  { key: "changelog", lang: "zh", path: SRC_FILE.zh, out: "src/content/changelog.json" },
  { key: "changelog-en", lang: "en", path: SRC_FILE.en, out: "src/content/changelog.en.json" },
  { key: "capabilities", path: "docs/capabilities.json", out: "src/content/capabilities.json" },
];

/** changelog 落盘：解析 → 空产物 / 语言纯度两道闸门 → 写产物。
 *  不过闸 = 告警 + 保留上次产物：截断响应会把日志页清空，夹中文的英文日志比一份旧快照更糟
 *  （/en 的零 Han 硬红线挂在产物上，脏数据不该有机会上线）。返回是否已写入。 */
function writeChangelog(text, src) {
  const data = parseChangelog(text, src.lang);
  if (!data.length) {
    console.warn(`::warning::[sync] ${src.path} 解析出 0 个版本（截断响应 / 错误页？）：保留上次同步的产物`);
    return false;
  }
  const bad = langViolations(data, src.lang);
  if (bad.length) {
    console.warn(`::warning::[sync] ${src.path} 出现与本文件语言不符的字符（${bad.slice(0, 3).join("；")}${bad.length > 3 ? ` 等 ${bad.length} 处` : ""}）：保留上次同步的产物`);
    return false;
  }
  writeFileSync(src.out, JSON.stringify(data, null, 2));
  return true;
}

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
  const local = { zh: arg("--in", null), en: arg("--in-en", null) };   // 本地回退通道：给出即跳过该源的网络拉取
  const offline = process.argv.includes("--offline");
  const jobs = offline ? [] : SOURCES.filter((s) => !(s.lang && local[s.lang]));
  const results = await Promise.allSettled(jobs.map(async (s) => ({ s, text: await fetchSource(s) })));
  for (const r of results) {
    if (r.status === "rejected") { console.warn(`[sync] ${r.reason.message}：保留上次同步的产物`); continue; }
    const { s, text } = r.value;
    try {
      if (s.lang) {
        if (writeChangelog(text, s)) console.log(`[sync] ${s.path} -> ${s.out}`);
      } else {
        const data = validateCapabilities(JSON.parse(text));
        if (!data) { console.warn("::warning::[sync] capabilities 结构校验未过（键名/覆盖/取值域）：保留上次同步的产物"); continue; }
        writeFileSync(s.out, JSON.stringify(data, null, 2));
        console.log(`[sync] ${s.path} -> ${s.out}`);
      }
    } catch (e) {
      console.warn(`[sync] ${s.key} 写入失败（${e.message}），保留上次同步的产物`);
    }
  }
  // 本地回退通道（离线改稿 / 链路排查用；网络侧对应源已跳过，不双写）
  for (const s of SOURCES.filter((x) => x.lang && local[x.lang])) {
    const flag = s.lang === "en" ? "--in-en" : "--in";
    try {
      const md = readFileSync(local[s.lang], "utf8");
      if (writeChangelog(md, s)) console.log(`[sync] ${s.path}(local) ${local[s.lang]} -> ${s.out}`);
    } catch {
      console.warn(`[sync] ${flag} 输入不存在（${local[s.lang]}），保留现有 ${s.out}`);
    }
  }
}
