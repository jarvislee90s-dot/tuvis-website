import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Assertion constants (keep all cross-file facts here, not inline in tests).
// ---------------------------------------------------------------------------

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const DOC_SPECS = {
  readme: {
    repoPath: "README.md",
    absPath: resolve(ROOT, "README.md"),
    links: [
      "docs/deploy/README.md",
      ".agents/skills/tuvis-release/SKILL.md",
    ],
  },
  deploy: {
    repoPath: "docs/deploy/README.md",
    absPath: resolve(ROOT, "docs/deploy/README.md"),
    links: [
      "../../README.md",
      "../../.agents/skills/tuvis-release/SKILL.md",
    ],
  },
  skill: {
    repoPath: ".agents/skills/tuvis-release/SKILL.md",
    absPath: resolve(ROOT, ".agents/skills/tuvis-release/SKILL.md"),
    links: ["../../../docs/deploy/README.md", "../../../README.md"],
  },
};

const README_STALE_FACTS = [
  "jarvislee90s-dot.github.io",
  "Settings → Pages",
  "GitHub Pages（子路径部署）",
];

const GH_WATCH_PATTERN = /gh run watch/;
const GH_WATCH_REQUIRED_CONTEXT = /fine-grained PAT|不支持/;

const OLD_MANUAL_PATH_PATTERN = /docs\/user-manual\//;

const PNPM_COMMAND_PATTERN = /\bpnpm\s+([a-z][a-z0-9:_-]*)/g;
const PNPM_BUILTIN_COMMANDS = new Set(["install", "exec", "dlx"]);

const WORKFLOW_FILES = [
  resolve(ROOT, ".github/workflows/deploy.yml"),
  resolve(ROOT, ".github/workflows/redeploy-latest.yml"),
];
// Only display names shaped like the two release workflows are extracted.
const WORKFLOW_NAME_PATTERN =
  /\bDeploy to [A-Z][A-Za-z0-9]*(?: [A-Z][A-Za-z0-9]*){0,4}\b|\bRedeploy [a-z][A-Za-z0-9]*(?: [a-z][A-Za-z0-9]*){1,4}\b/g;

const SECRET_NAME_PATTERN =
  /\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_(?:TOKEN|PAT|ID|KEY|SECRET)\b/g;
// Secrets that are documented only as retired; they are allowed on lines that
// explicitly say so (the current docs already carry this context inline).
const RETIRED_SECRET_NAMES = new Set(["SITE_DISPATCH_PAT"]);
const RETIRED_CONTEXT_PATTERN = /已退役/;

const CONTRACT_SECTION_PATTERN = /^## 3\. 发布命令契约[\s\S]*?(?=^## )/m;
const REQUIRED_CONTRACT_SNIPPETS = [
  "clean working tree",
  "must be newer than",
  "matching Tuvis tag",
  "already exists",
  "reuse the same SHA",
];

const CANONICAL_SITE_ORIGIN = "https://tuvis.app";
const URL_PATTERN = /https?:\/\/[^\s<>"'`）)，。]+/g;
const LOCAL_ADDRESS_PATTERN = /localhost|127\.0\.0\.1/;
const ONLINE_CONTEXT_PATTERN = /线上|生产|tuvis\.app/;

const SKILL_REQUIRED_FACTS = [
  "pnpm release:website",
  "Redeploy latest website release",
  "tuvis.app",
  "scripts/release-website.mjs",
];
const SKILL_STALE_PATTERNS = [
  {
    label: "旧 CHANGELOG 双语门 EN: 契约句",
    pattern: /CHANGELOG\s*双语门[：:][^\n]*EN:/,
    allowTerms: ["EN:"],
  },
  {
    label: "旧「条目后紧跟 EN:」契约句",
    pattern: /条目后紧跟[^\n]*`?EN:/,
    allowTerms: ["EN:"],
  },
  {
    label: "旧 exit 0 自动回退句",
    pattern:
      /(?:自动回退|同步脚本失败)[^\n]{0,80}\bexit 0\b|\bexit 0\b[^\n]{0,80}(?:自动回退|回退)/,
    allowTerms: ["exit 0"],
  },
];

const SKILL_GUARD_SECTION_PATTERN =
  /^## 0\. 守卫[^\n]*\n([\s\S]*?)(?=^## )/m;
const SKILL_GUARD_STRUCTURAL_ANCHORS = [
  ".github/workflows/deploy.yml",
  "scripts/release-website.mjs",
];
// In the guard section, docs/deploy/README.md may only appear inside a
// markdown link. Strip link targets first; any remaining occurrence implies an
// existence check (prose or shell command), which is what T11 forbids.
const SKILL_GUARD_DOC_PATH = "docs/deploy/README.md";
const MARKDOWN_LINK_PATTERN = /\[[^\]]*\]\([^)]*\)/g;

// Historical context exemption: a line containing
// `docs-consistency: allow <pattern>` is exempted from that literal pattern.
// Several exempted patterns may be listed after `allow`, comma-separated.
const ALLOW_MARKER = "docs-consistency: allow";

// ---------------------------------------------------------------------------
// Machine facts and document contents.
// ---------------------------------------------------------------------------

const PACKAGE_JSON = JSON.parse(
  readFileSync(resolve(ROOT, "package.json"), "utf8"),
);
const PACKAGE_SCRIPTS = new Set(Object.keys(PACKAGE_JSON.scripts ?? {}));
const WORKFLOW_TEXT = WORKFLOW_FILES.map((file) =>
  readFileSync(file, "utf8"),
).join("\n");
const RELEASE_SCRIPT = readFileSync(
  resolve(ROOT, "scripts/release-website.mjs"),
  "utf8",
);

for (const spec of Object.values(DOC_SPECS)) {
  spec.content = readFileSync(spec.absPath, "utf8");
}

const DOCS = Object.values(DOC_SPECS);

// ---------------------------------------------------------------------------
// Helpers.
// ---------------------------------------------------------------------------

function linesOf(content) {
  return content.split(/\r?\n/);
}

function allowPatternsOnLine(line) {
  const markerIndex = line.indexOf(ALLOW_MARKER);
  if (markerIndex === -1) return [];
  return line
    .slice(markerIndex + ALLOW_MARKER.length)
    .split(/[,，]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function lineIsAllowed(line, allowTerms) {
  if (!allowTerms?.length) return false;
  const allowed = allowPatternsOnLine(line);
  return allowTerms.some((term) => allowed.includes(term));
}

function findPatternViolations(content, pattern, allowTerms) {
  const violations = [];
  linesOf(content).forEach((line, index) => {
    if (!pattern.test(line)) return;
    if (lineIsAllowed(line, allowTerms)) return;
    violations.push({ line: index + 1, text: line.trim() });
  });
  return violations;
}

function describeViolations(doc, violations) {
  return [
    `修复文件：${doc.repoPath}`,
    ...violations.map((violation) => `  第 ${violation.line} 行：${violation.text}`),
  ].join("\n");
}

function extractWorkflowName(content) {
  return content.match(/^name:\s*(.+?)\s*$/m)?.[1] ?? "";
}

function extractContractSnippets(content) {
  const section = content.match(CONTRACT_SECTION_PATTERN)?.[0] ?? "";
  const snippets = [];
  for (const line of linesOf(section)) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line.split("|").map((cell) => cell.trim());
    if (cells.length < 4) continue;
    if (cells[1] === "校验项") continue;
    if (cells.slice(1, -1).every((cell) => /^:?-{3,}:?$/.test(cell))) continue;
    for (const match of cells[2].matchAll(/`([^`]+)`/g)) {
      snippets.push(match[1]);
    }
  }
  return snippets;
}

// ---------------------------------------------------------------------------
// Tests: T1-T11 from .agents/doc-division-proposal.md §7.2.
// ---------------------------------------------------------------------------

describe("documentation release-fact consistency", () => {
  it("T1: README, deploy docs and release skill link to each other with resolvable relative paths", () => {
    for (const doc of DOCS) {
      for (const link of doc.links) {
        expect(
          doc.content,
          `${doc.repoPath} 缺少指向 ${link} 的相对链接；请在该文件补上可点击的链接。`,
        ).toContain(link);

        const target = resolve(dirname(doc.absPath), link);
        expect(
          existsSync(target),
          `${doc.repoPath} 中的链接 ${link} 在磁盘上不存在；请修正 ${doc.repoPath} 的链接路径。`,
        ).toBe(true);
      }
    }
  });

  it("T2: README no longer contains stale GitHub Pages deployment facts", () => {
    for (const staleFact of README_STALE_FACTS) {
      expect(
        DOC_SPECS.readme.content,
        `修复文件：README.md\nREADME.md 仍含陈旧事实「${staleFact}」；请删除它，并把托管说明指向 docs/deploy/README.md。`,
      ).not.toContain(staleFact);
    }
  });

  it("T3: every `gh run watch` mention is qualified by fine-grained PAT or unsupported context", () => {
    for (const doc of DOCS) {
      const violations = linesOf(doc.content)
        .map((line, index) => ({ line: index + 1, text: line.trim() }))
        .filter(
          ({ text }) =>
            GH_WATCH_PATTERN.test(text) &&
            !GH_WATCH_REQUIRED_CONTEXT.test(text) &&
            !lineIsAllowed(text, ["gh run watch"]),
        );
      expect(
        violations,
        [
          `修复文件：${doc.repoPath}`,
          "`gh run watch` 只能出现在注明「fine-grained PAT / 不支持」的行；请删除无条件用法，或补上适用条件。",
          ...violations.map((v) => `  第 ${v.line} 行：${v.text}`),
        ].join("\n"),
      ).toEqual([]);
    }
  });

  it("T4: docs/user-manual/ is not presented as the current content path", () => {
    for (const doc of DOCS) {
      const violations = findPatternViolations(
        doc.content,
        OLD_MANUAL_PATH_PATTERN,
        ["docs/user-manual/"],
      );
      expect(
        violations,
        [
          `修复文件：${doc.repoPath}`,
          "`docs/user-manual/` 是旧 tag 的路径，不能作为当前路径出现；请改为 `docs/product/manual/`。",
          "若确属旧 tag 历史语境，请在该行加注释 `docs-consistency: allow docs/user-manual/`。",
          describeViolations(doc, violations),
        ].join("\n"),
      ).toEqual([]);
    }
  });

  it("T5: every `pnpm <name>` in docs is a real package.json script", () => {
    let commandCount = 0;
    for (const doc of DOCS) {
      const violations = [];
      linesOf(doc.content).forEach((line, index) => {
        for (const match of line.matchAll(PNPM_COMMAND_PATTERN)) {
          commandCount += 1;
          const name = match[1];
          if (PACKAGE_SCRIPTS.has(name) || PNPM_BUILTIN_COMMANDS.has(name)) {
            continue;
          }
          if (lineIsAllowed(line, [`pnpm ${name}`])) continue;
          violations.push({
            line: index + 1,
            text: `pnpm ${name}`,
          });
        }
      });
      expect(
        violations,
        [
          `修复文件：${doc.repoPath}`,
          `文档中的 pnpm 命令必须是 package.json 的 scripts 键（白名单：${[...PNPM_BUILTIN_COMMANDS].join(" / ")}）。`,
          `现有 scripts：${[...PACKAGE_SCRIPTS].join(", ")}`,
          ...violations.map((v) => `  第 ${v.line} 行：${v.text}`),
        ].join("\n"),
      ).toEqual([]);
    }
    expect(
      commandCount,
      "三份文档中未找到任何 `pnpm <name>` 命令；请确认文档仍给出可执行的发版/开发命令。",
    ).toBeGreaterThan(0);
  });

  it("T6: workflow display names in docs match the deploy/redeploy workflow names", () => {
    const currentNames = new Set(
      WORKFLOW_FILES.map((file) => extractWorkflowName(readFileSync(file, "utf8"))),
    );
    expect(
      [...currentNames].every(Boolean),
      `修复文件：${WORKFLOW_FILES.map((file) => file.replace(`${ROOT}/`, "")).join(", ")}\nworkflow 缺少 name: 顶层字段；请先给两个发布 workflow 补上 name。`,
    ).toBe(true);

    const observed = [];
    for (const doc of DOCS) {
      linesOf(doc.content).forEach((line, index) => {
        for (const match of line.matchAll(WORKFLOW_NAME_PATTERN)) {
          observed.push({ doc, name: match[0], line: index + 1 });
        }
      });
    }

    const unknown = observed.filter(({ name }) => !currentNames.has(name));
    expect(
      unknown,
      [
        "修复文件：文档中出现的 workflow 名与 .github/workflows/*.yml 的 name: 不一致。",
        `当前合法名称：${[...currentNames].join(" / ")}`,
        ...unknown.map(
          ({ doc, name, line }) =>
            `  ${doc.repoPath}:${line} 出现「${name}」；请改文档，或同步修改 workflow 的 name。`,
        ),
      ].join("\n"),
    ).toEqual([]);

    for (const name of currentNames) {
      const seen = DOCS.some((doc) => doc.content.includes(name));
      expect(
        seen,
        `修复文件：docs/deploy/README.md 或 .agents/skills/tuvis-release/SKILL.md\nworkflow「${name}」未在任何文档出现；请至少在一处文档引用它，避免 workflow 改名后文档失联。`,
      ).toBe(true);
    }
  });

  it("T7: every secret name in docs exists in a release workflow file", () => {
    for (const doc of DOCS) {
      const violations = [];
      linesOf(doc.content).forEach((line, index) => {
        for (const match of line.matchAll(SECRET_NAME_PATTERN)) {
          const name = match[0];
          if (WORKFLOW_TEXT.includes(`secrets.${name}`)) continue;
          if (
            RETIRED_SECRET_NAMES.has(name) &&
            RETIRED_CONTEXT_PATTERN.test(line)
          ) {
            continue;
          }
          if (lineIsAllowed(line, [name])) continue;
          violations.push({ line: index + 1, text: name });
        }
      });
      expect(
        violations,
        [
          `修复文件：${doc.repoPath}`,
          "文档中的 secret 名必须真实出现在 .github/workflows/deploy.yml 或 redeploy-latest.yml 的 secrets.* 引用中。",
          ...violations.map((v) => `  第 ${v.line} 行：${v.text}`),
        ].join("\n"),
      ).toEqual([]);
    }
  });

  it("T8: every error snippet in the deploy command contract table exists in release-website.mjs", () => {
    const snippets = extractContractSnippets(DOC_SPECS.deploy.content);
    expect(
      snippets.length,
      "修复文件：docs/deploy/README.md\n未能在「## 3. 发布命令契约」表格中解析出任何报错片段；请保留该表格与反引号片段。",
    ).toBeGreaterThan(0);

    for (const required of REQUIRED_CONTRACT_SNIPPETS) {
      expect(
        snippets.some((snippet) => snippet.includes(required)),
        `修复文件：docs/deploy/README.md\n「发布命令契约」表缺少核心报错片段「${required}」；请补回该行并确保它仍存在于 scripts/release-website.mjs。`,
      ).toBe(true);
    }

    for (const snippet of snippets) {
      expect(
        RELEASE_SCRIPT,
        `修复文件：docs/deploy/README.md（或 scripts/release-website.mjs）\n契约表引用的报错片段「${snippet}」在 scripts/release-website.mjs 中不存在；请同步文档与脚本。`,
      ).toContain(snippet);
    }
  });

  it("T9: online URLs use https://tuvis.app and local addresses are not presented as production", () => {
    for (const doc of DOCS) {
      expect(
        doc.content,
        `修复文件：${doc.repoPath}\n文档未出现线上地址 ${CANONICAL_SITE_ORIGIN}；请补上规范线上 URL。`,
      ).toContain(CANONICAL_SITE_ORIGIN);

      const urlViolations = [];
      const localViolations = [];
      linesOf(doc.content).forEach((line, index) => {
        for (const match of line.matchAll(URL_PATTERN)) {
          const url = match[0];
          if (!url.includes("tuvis.app")) continue;
          const afterOrigin = url.slice(CANONICAL_SITE_ORIGIN.length);
          if (
            !url.startsWith(CANONICAL_SITE_ORIGIN) ||
            (afterOrigin !== "" && !afterOrigin.startsWith("/")) ||
            afterOrigin.startsWith("//")
          ) {
            urlViolations.push({ line: index + 1, text: url });
          }
        }

        const localMatches = line.match(LOCAL_ADDRESS_PATTERN) ?? [];
        if (
          localMatches.length > 0 &&
          ONLINE_CONTEXT_PATTERN.test(line) &&
          !lineIsAllowed(line, localMatches)
        ) {
          localViolations.push({ line: index + 1, text: line.trim() });
        }
      });

      expect(
        urlViolations,
        [
          `修复文件：${doc.repoPath}`,
          `线上 URL 只能用 ${CANONICAL_SITE_ORIGIN}（可带路径，不得用 http、www 或双斜杠变体）。`,
          ...urlViolations.map((v) => `  第 ${v.line} 行：${v.text}`),
        ].join("\n"),
      ).toEqual([]);

      expect(
        localViolations,
        [
          `修复文件：${doc.repoPath}`,
          "localhost / 127.0.0.1 不能作为线上地址出现；请改为 https://tuvis.app，或明确标注为本地开发地址。",
          ...localViolations.map((v) => `  第 ${v.line} 行：${v.text}`),
        ].join("\n"),
      ).toEqual([]);
    }
  });

  it("T10: release skill keeps current entry points and drops stale EN:/exit-0 contracts", () => {
    for (const fact of SKILL_REQUIRED_FACTS) {
      expect(
        DOC_SPECS.skill.content,
        `修复文件：.agents/skills/tuvis-release/SKILL.md\nskill 缺少当前发版事实「${fact}」；请补回或修正措辞。`,
      ).toContain(fact);
    }

    for (const stale of SKILL_STALE_PATTERNS) {
      const violations = findPatternViolations(
        DOC_SPECS.skill.content,
        stale.pattern,
        stale.allowTerms,
      );
      expect(
        violations,
        [
          "修复文件：.agents/skills/tuvis-release/SKILL.md",
          `skill 仍含${stale.label}；请删除该旧契约表述，改为当前分文件 CHANGELOG 契约/阻断语义。`,
          ...violations.map((v) => `  第 ${v.line} 行：${v.text}`),
        ].join("\n"),
      ).toEqual([]);
    }
  });

  it("T11: release skill guard uses structural files, not docs/deploy/README.md existence", () => {
    const guardSection = DOC_SPECS.skill.content.match(
      SKILL_GUARD_SECTION_PATTERN,
    )?.[1];
    expect(
      Boolean(guardSection),
      "修复文件：.agents/skills/tuvis-release/SKILL.md\nskill 缺少「## 0. 守卫」节；请恢复该节。",
    ).toBe(true);
    const guardBody = guardSection ?? "";

    for (const anchor of SKILL_GUARD_STRUCTURAL_ANCHORS) {
      expect(
        guardBody,
        `修复文件：.agents/skills/tuvis-release/SKILL.md\n守卫节缺少结构性锚点 ${anchor}；请用它判断仓库身份。`,
      ).toContain(anchor);
    }

    const docPathLines = linesOf(guardBody)
      .map((text, index) => ({
        line: index + 1,
        text,
        withoutLinks: text.replace(MARKDOWN_LINK_PATTERN, ""),
      }))
      .filter(
        ({ text, withoutLinks }) =>
          withoutLinks.includes(SKILL_GUARD_DOC_PATH) &&
          !lineIsAllowed(text, [SKILL_GUARD_DOC_PATH]),
      )
      .map(({ line, text }) => ({ line, text: text.trim() }));
    expect(
      docPathLines,
      [
        "修复文件：.agents/skills/tuvis-release/SKILL.md",
        `守卫节不得用 ${SKILL_GUARD_DOC_PATH} 判断是否在本仓库；请改用 .github/workflows/deploy.yml 与 scripts/release-website.mjs。`,
        "（该文档路径只能作为正文链接出现在守卫节之外。）",
        ...docPathLines.map((v) => `  第 ${v.line} 行：${v.text}`),
      ].join("\n"),
    ).toEqual([]);
  });
});
