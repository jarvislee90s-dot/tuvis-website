import { describe, expect, it } from "vitest";
import { COPY as ABOUT_COPY } from "@/home/AboutWindow";
import { COPY as CLAUDE_COPY } from "./ClaudeTui";
import { COPY as CODEX_COPY } from "./CodexAppWindow";
import { COPY as KIMI_COPY } from "./KimiShellTui";
import { COPY as OPENCODE_COPY } from "./OpenCodeTui";
import { COPY as FILE_PREVIEW_COPY } from "./remote/FilePreview";
import { COPY as REMOTE_DETAIL_COPY } from "./remote/RemoteDetail";
import { COPY as WORKBUDDY_COPY } from "./WorkBuddyAppWindow";
import { COPY as ZCODE_COPY } from "./ZCodeTaskWindow";
import { COPY as D1_SCENE_COPY } from "./scenes/D1Scene";
import { COPY as PET_USAGE_COPY } from "./scenes/PetUsageScene";
import { COPY as REMOTE_SCENE_COPY } from "./scenes/RemoteScene";
import { COPY as RESOURCES_SCENE_COPY } from "./scenes/ResourcesScene";

/**
 * 批次 3 COPY 模式门禁（B3-T5 确立；B3-T6/T3.7/B3-T8 后续 13 个文件照此办理）
 * =====================================================================
 * 模式（每个窗体/文案组件文件一份，示例见 ClaudeTui.tsx）：
 *   1. 文件内 `const ZH = {...}; const EN: typeof ZH = {...}; export const COPY = { zh: ZH, en: EN } as const;`
 *      —— ZH = 语言相关文案的"现状中文"（逐字，红线）；EN 以 `: typeof ZH` 标注互校：
 *      缺键/多键/叶子类型错在编译期报错（COPY 叶子只允许 string / 数组 / 对象，不得混入函数）。
 *   2. 渲染处 `const t = COPY[useLang()]`（@/i18n/useLang，URL 权威语言），不再散落语言分支；
 *      语言无关的"真实产品英文 UI"（终端 chrome、英文导航、目录树装饰等）留普通常量，不进 COPY。
 *   3. 品牌词用 {{brand}} 占位，渲染处 `replace("{{brand}}", brandWord(lang))`（B3-T1 品牌裸词单源）。
 *   4. zh 文案逐字保留现状（防翻译顺手改稿）；en 为"产品英文版 UI"口径，术语与站点一致
 *      （会话看板 Session board / 远程注入 remote injection / 子 Agent sub-agent / 批准 approval / 排队 queued…）。
 *   5. 会话内容若来自 store 种子/剧本（已 {zh,en} 双语）不要重复翻译；数据契约见 store.test。
 * 本文件门禁（新 COPY 文件请把命名导出登记进 SECTIONS）：
 *   ① zh/en 键集合递归 deep-equal（含数组长度——少译一行的 en 会被抓出）；
 *   ② en 叶子不匹配 CJK 表意字（/[\u4e00-\u9fff]/，/en 零中文硬红线的一部分）；
 *   ②b en 叶子不匹配 CJK 标点/全角字符（加严：防 、。「」（） 等全角漏网）。覆盖范围 =
 *      CJK 标点 \u3000-\u303f + 全角形式 \uff00-\uffef + General Punctuation 区里的 CJK 排版惯用字符
 *      （曲引号 \u2018-\u201d、省略号 \u2026、中文破折号 ——；单独 em dash/dash 是地道英文用法，不禁）；
 *   ③ zh/en 叶子均非空（en 空串会在 /en 渲染开天窗）。
 * 断言失败信息带 `文件.COPY.语言.路径`（如 CodexAppWindow.COPY.en.tree[3]），便于定位。
 */

/** 递归展平 COPY 子树为「路径 → 叶子字符串」（zh/en 用同一命名空间便于键集合对比）；
 *  叶子只允许 string（数字/函数等其他类型即违规） */
function leaves(node: unknown, path: string, out: Map<string, string> = new Map()): Map<string, string> {
  if (typeof node === "string") {
    out.set(path, node);
    return out;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => leaves(v, `${path}[${i}]`, out));
    return out;
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) leaves(v, path ? `${path}.${k}` : k, out);
    return out;
  }
  throw new Error(`${path} 不是 string 叶子（COPY 只允许 string / 数组 / 对象）`);
}

/** COPY 登记表（新文件的 COPY 导出加进来即纳入门禁） */
const SECTIONS = {
  ClaudeTui: CLAUDE_COPY,
  CodexAppWindow: CODEX_COPY,
  KimiShellTui: KIMI_COPY,
  OpenCodeTui: OPENCODE_COPY,
  WorkBuddyAppWindow: WORKBUDDY_COPY,
  ZCodeTaskWindow: ZCODE_COPY,
  RemoteDetail: REMOTE_DETAIL_COPY,
  FilePreview: FILE_PREVIEW_COPY,
  AboutWindow: ABOUT_COPY,
  D1Scene: D1_SCENE_COPY,
  RemoteScene: REMOTE_SCENE_COPY,
  ResourcesScene: RESOURCES_SCENE_COPY,
  PetUsageScene: PET_USAGE_COPY,
} as const;

describe("COPY parity：批次 3 窗 zh/en 形状与语言门禁", () => {
  for (const [file, copy] of Object.entries(SECTIONS)) {
    const zh = leaves(copy.zh, "");
    const en = leaves(copy.en, "");

    it(`${file}：zh/en 键集合递归一致（含数组长度）`, () => {
      expect([...en.keys()].sort(), `${file}.COPY en 与 zh 键集合不一致（缺译/多译或数组长度不同）`)
        .toEqual([...zh.keys()].sort());
    });

    it(`${file}：en 叶子零 CJK 表意字`, () => {
      for (const [path, v] of en) {
        expect(v, `${file}.COPY.en.${path}`).not.toMatch(/[\u4e00-\u9fff]/);
      }
    });

    it(`${file}：en 叶子零 CJK 标点/全角字符`, () => {
      for (const [path, v] of en) {
        expect(v, `${file}.COPY.en.${path}`).not.toMatch(/[\u2018-\u201d\u2026\u3000-\u303f\uff00-\uffef]|——/);
      }
    });

    it(`${file}：zh/en 叶子非空`, () => {
      for (const [path, v] of zh) expect(v.trim(), `${file}.COPY.zh.${path}`).not.toBe("");
      for (const [path, v] of en) expect(v.trim(), `${file}.COPY.en.${path}`).not.toBe("");
    });
  }
});

/** 尾随空格锚点（B3-T8 rider）：COPY 叶子与同行 JSX 元素直连分词时，en 靠尾随空格——
 *  编译器不报错、格式化易抹掉，故用叶子级定值冻结（AboutWindow 的 DOM 级锚点在 Brand.test /en 用例）。 */
describe("尾随空格叶子锚点：en 承接同行元素", () => {
  it("FilePreview /en h1Link 以空格结尾（承 <em> 强调段「a 7-chapter illustrated guide」）", () => {
    expect(FILE_PREVIEW_COPY.en.h1Link).toBe("becomes ");
  });
});
