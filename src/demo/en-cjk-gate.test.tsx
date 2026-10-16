import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router";
import { BASE, routes } from "@/router";
import { stubIntersectionObserver } from "@/test/domStubs";
import changelog from "@/content/changelog.json";
import cap from "@/content/capabilities.json";
import en from "@/i18n/en.json";
import zh from "@/i18n/zh.json";

/**
 * B3 收官总门禁（T3.6）：/en 零 Han + /zh 护栏
 * ===========================================
 * 走真实 routes（@/router 命名导出）+ createMemoryRouter，断言的是接线后的整页 DOM——
 * 组件单测/parity 门禁已管不到的「漏 COPY 化区块」在这里现形（B3-T8 实测 /en/demo 整页零 Han，此处固化为常驻测试）。
 *
 * 字符类 = Han 区 /[\u4e00-\u9fff]/（全角「＋」属 aria-hidden 装饰字形、「…」属英文排版，
 * 均不拦；B3-T6/T3.7 审查裁决，与 copy.parity 的 ②/②b 同源）。
 *
 * 本页例外（豁免须在此登记 + 指向上游依据，不得就地放宽字符类）：
 *   ① /en/changelog —— changelog.json 条目是`{zh, en?}`混合（HEAD 内 14 版 175 条零 en，2026-10-16 上游
 *      发版同步后 15 版 191 条里 26 条有 en），未译条目按产品「诚实降级」口径回落中文原文 + 徽章标注。
 *      故零 Han 断言换成：标题/英文说明在 + 「English in progress」徽章数 = 未译条目数（降级机制在岗）。
 *   ② /en 首页矩阵区——组名/行名取主仓 capabilities.json 的 nameEn ?? name，nameEn 未补时（tuvis#160
 *      缺口 C，HEAD 内 JSON 全缺）该区必然中文。豁免粒度 = 矩阵「数据组卡」容器（CompatMatrix.tsx 的
 *      div.mt-4.space-y-4，正好只包上游 JSON 驱动的组名/行名/备注文本），section 自身的 i18n chrome
 *      （标题/描述/图例/列头/脚注）不在豁免内。豁免随数据自动开关（MATRIX_NAME_EN_GAP）：缺则豁免并
 *      断言「组卡确实含 Han」（防豁免空转），补全则整体并入整页硬红线。剩余盲区仅在缺口支存在 =
 *      组卡内数据文本；补全支已由补全分支关闭。
 */

const HAN = /[\u4e00-\u9fff]/;
const WAIT = { timeout: 3000 };

/** changelog 条目总数 / 未译条数（徽章数 = 后者；本条随数据漂移自动跟随，不写死） */
const ITEM_COUNT = changelog.reduce(
  (n, rel) => n + Object.values(rel.sections).reduce((m, items) => m + items.length, 0),
  0,
);
const UNTRANSLATED = changelog.reduce(
  (n, rel) => n + Object.values(rel.sections).reduce((m, items) => m + items.filter((it) => !it.en).length, 0),
  0,
);

/** 矩阵区文本缺口：任一 组/行 缺 nameEn 即该区必然渲染中文（tuvis#160 缺口 C）。
 *  判缺按渲染语义 `nameEn ?? name` 对齐——只认 undefined（JSON 未给键）；空串 nameEn 渲染空串、无 Han，
 *  不算缺口。空串 noteEn 会在 title/aria-label 属性层回落中文，但属性不在本门禁的文本字符面。 */
const MATRIX_NAME_EN_GAP = cap.groups.some((g) => g.nameEn === undefined || g.rows.some((r) => r.nameEn === undefined));

/** body 全部文本节点拼接（= 门禁口径）；exclude 子树内的节点跳过（首页矩阵豁免用） */
function bodyText(exclude?: Element | null): string {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let text = "";
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (exclude && exclude.contains(n)) continue;
    text += n.nodeValue ?? "";
  }
  return text;
}

function mountAt(path: string): void {
  const router = createMemoryRouter(routes, {
    basename: BASE,
    initialEntries: [`${BASE}${path}`],
  });
  render(<RouterProvider router={router} />);
}

/** 零 Han 防假绿：空树/崩进 RR 默认 ErrorBoundary（整页测试已知失败模式，见 domStubs 注释）时零 Han 恒真——
 *  先证明整页确实渲染：LangLayout 常驻外壳（页脚 slogan）在 + 无 RR 错误文案。 */
function expectRealPage(): void {
  const text = bodyText();
  expect(text, "页面未渲染或崩进 ErrorBoundary——零 Han 断言会假绿").toContain(en["footer.slogan"]);
  expect(text).not.toContain("Unexpected Application Error");
}

describe("B3 总门禁：/en 四路由零 Han（豁免见文件头）+ /zh 护栏", () => {
  beforeEach(() => {
    // jsdom 不实现 scrollTo：Silent 掉 ScrollManager 回顶提示（非被测行为）
    window.scrollTo = () => {};
    // 首页 Reveal / 场景 whileInView 缺 IO 时树会崩进 RR 默认 ErrorBoundary（整页断言自此假绿）
    stubIntersectionObserver();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("/en/demo：整页零 Han（语言锚 = h1；五区块齐在证整页渲染；B3-T8 实测的常驻化）", async () => {
    mountAt("/en/demo");
    await screen.findByRole("heading", { level: 1, name: en["demo.title"] }, WAIT);
    for (const k of ["demo.d1", "demo.d2", "demo.d3", "demo.d4", "usage.title"] as const) {
      expect(screen.getByRole("heading", { level: 2, name: en[k] })).toBeInTheDocument();
    }
    expectRealPage();
    expect(bodyText()).not.toMatch(HAN);
  });

  it("/en/changelog：标题 + 英文说明在，条目数 = 数据全量，徽章数 = 未译条目数（诚实降级在岗）", async () => {
    mountAt("/en/changelog");
    await screen.findByRole("heading", { level: 1, name: en["log.title"] }, WAIT);
    expect(screen.getByText(en["log.enNote"])).toBeInTheDocument();
    // 页级互锁：整数据集渲染（不因某版 section 结构异常少渲染条目）
    expect(within(screen.getByRole("main")).getAllByRole("listitem")).toHaveLength(ITEM_COUNT);
    // 逐条降级标注：徽章数必须恰等于数据里未译条目数（多 = 误标已译条目；少 = 静默冒充英文）
    expect(screen.queryAllByText(en["log.enProgress"])).toHaveLength(UNTRANSLATED);
    expect(ITEM_COUNT).toBeGreaterThan(0);
  });

  it("/en/docs/01-overview：手册 fetch 不可得 → missing 分支零 Han，页签带品牌后缀", async () => {
    // 显式桩掉 fetch（reject）：本用例要的是「两种语言手册都取不到」的 missing 分支，
    // 不依赖 jsdom「相对 URL 必败」这一隐式行为（真实浏览器里同路径是可 200 的）。
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline: jsdom smoke"))));
    mountAt("/en/docs/01-overview");
    expect(await screen.findByText(en["docs.missing"], {}, WAIT)).toBeInTheDocument();
    await waitFor(() => expect(document.title).toContain("— Tuvis"), WAIT);
    expectRealPage();
    expect(bodyText()).not.toMatch(HAN);
  });

  it("/en 首页：整页零 Han（其余六区块齐在；矩阵数据组卡豁免随上游 nameEn 缺口自动开关，见文件头）", async () => {
    mountAt("/en");
    // 语言锚 = h1（hero.title en 恰「Tuvis」，同 Brand.test 口径）
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Tuvis"), WAIT);
    for (const k of ["features.title", "stories.title", "compare.title", "oss.title"] as const) {
      expect(screen.getByRole("heading", { level: 2, name: en[k] })).toBeInTheDocument();
    }
    const matrix = screen.getByRole("heading", { level: 2, name: en["matrix.title"] }).closest("section");
    expect(matrix).not.toBeNull();
    expectRealPage();
    // 豁免只覆盖矩阵「数据组卡」容器（CompatMatrix.tsx 唯一 div.mt-4.space-y-4，包三张组卡的组名/行名），
    // section 的 i18n chrome（标题/描述/图例/列头/脚注）留在门禁内；缺口补全后 dataGap 恒为 null = 全页硬红线
    const dataGap = MATRIX_NAME_EN_GAP ? matrix!.querySelector("div.mt-4.space-y-4") : null;
    if (MATRIX_NAME_EN_GAP) {
      expect(dataGap, "矩阵数据组卡容器未定位到（CompatMatrix 结构/类名变更？）").not.toBeNull();
      // 豁免依据在场：缺 nameEn 的组名/行名确实在渲染中文（豁免若空转 = 断言面被无谓缩小）
      expect(dataGap!.textContent).toMatch(HAN);
    }
    expect(bodyText(dataGap)).not.toMatch(HAN);
  });

  it("/zh 护栏：首页可达且中文在（h1 恰「兔维斯 Tuvis」、正文含「兔维斯」）", async () => {
    mountAt("/zh");
    await waitFor(() => expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("兔维斯 Tuvis"), WAIT);
    expect(bodyText()).toContain("兔维斯");
    expect(bodyText()).toContain(zh["matrix.title"]);
  });

  it("/zh/demo 护栏：用量看板数字走 zh 口径（万/亿 单位在 #ledger 内）", async () => {
    mountAt("/zh/demo");
    await screen.findByRole("heading", { level: 1, name: zh["demo.title"] }, WAIT);
    const ledger = document.querySelector("#ledger");
    expect(ledger).not.toBeNull();
    expect(ledger!.textContent).toMatch(/(万|亿)/);
  });
});
