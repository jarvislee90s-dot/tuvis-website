import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router";
import i18n from "i18next"; // 语言切换（RemoteDetail.test 先例）：同一单例，@/i18n 已对其 init
import "@/i18n"; // 侧效应导入：FilePreview 的 useTranslation 需要全局 i18next 资源
import en from "@/i18n/en.json";
import { COPY as WORKBUDDY_COPY, WorkBuddyAppWindow } from "./WorkBuddyAppWindow";
import { COPY as ZCODE_COPY, ZCodeTaskWindow } from "./ZCodeTaskWindow";
import { COPY as KIMI_COPY, KimiShellTui } from "./KimiShellTui";
import { COPY as OPENCODE_COPY, OpenCodeTui } from "./OpenCodeTui";
import { COPY as FILE_PREVIEW_COPY, FilePreview } from "./remote/FilePreview";

/** 「关着的窗」/en 直挂零 Han 门禁（PR#3 代码审查 Important 缺口）
 *  ====================================================================
 *  背景：以下五窗只被 copy.parity（纯数据断言）与场景渲染引用，而场景里它们仅在
 *  store.windows.toolWin / remote.files 开窗时挂载——/en/demo idle（默认关窗）下整页不可达，
 *  en-cjk-gate 的整页零 Han 扫不到它们；未来有人在窗内 JSX 直写中文，三层既有门禁全绿放行。
 *  本门禁把每个窗以 en 语言直挂（MemoryRouter /:lang，Brand.test / RemoteDetail.test 先例——
 *  五窗 props 全可选、无 store 装配依赖，直挂成本远低于剧本播放驱动），对真实渲染 DOM 断零 Han。
 *
 *  覆盖集合（grep 裁定：仅被 copy.parity.test.ts 数据引用 + 无任何 DOM 挂载/路由渲染测试可达）：
 *    WorkBuddyAppWindow / ZCodeTaskWindow / KimiShellTui / OpenCodeTui / remote/FilePreview。
 *  排除：CodexAppWindow 与 ClaudeTui 已有 /en 挂载测试（Brand.test.tsx / ClaudeTui.test.tsx）。
 *
 *  字符类 = Han 区 /[\u4e00-\u9fff]/，与 en-cjk-gate 同源：全角「＋」「·」、箭头/几何装饰字形
 *  （aria-hidden 口径）不拦。文本面（textContent）之外连 innerHTML 属性面（aria-label/title/
 *  placeholder）一并扫——同 Han 字符类，不会误伤上述装饰字形。
 *  防假绿：每例先断特征锚点在场（窗确实渲染且取的是 en 文案表——锚点串取自各组件 COPY.en，
 *  zh 表对应文案必含 Han、渲染错表时零 Han 断言自己会红，两锁互证）再断零 Han，防空树/静默空转。
 *  FilePreview 的 t() 走 i18next 实例语言（隔离挂载无 LangLayout effect 兜底），用例内显式切 en
 *  补偿（RemoteDetail.test 同款）；其窗体 chrome 走 demo.fp.* i18n 键，仿真文件内文走组件 COPY——
 *  总列表帧只盖 chrome，故再点行驱动 code（源码/渲染两视图）与 md（渲染视图）详情帧盖全 COPY 面。 */

const HAN = /[\u4e00-\u9fff]/;

/** 挂到 /:lang 路由下（useLang 的 useParams 需要路由参数；Brand.test / RemoteDetail.test 同款） */
function mountAt(entry: string, el: ReactNode) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/:lang" element={el} />
      </Routes>
    </MemoryRouter>,
  );
}

/** /en 零 Han 断言：锚点先证「确实渲染且取的是 en 表」，再扫文本面 + 属性面零 Han */
function expectEnOnly(container: HTMLElement, ...anchors: string[]): void {
  for (const a of anchors) {
    expect(container.textContent, `特征锚点缺失（窗未渲染或取错语言表）：${a}`).toContain(a);
  }
  expect(container.textContent).not.toMatch(HAN);
  expect(container.innerHTML).not.toMatch(HAN);
}

describe("关着的窗 /en 直挂零 Han：四工具窗（d1 开窗态在整页门禁的盲区）", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en"); // FilePreview 补偿；四窗走 COPY/useLang 不受影响，统一前置
  });
  afterEach(cleanup);

  it("WorkBuddyAppWindow：整窗零 Han（锚 = en 表 discover/chatTitle + 常量应用名）", () => {
    const { container } = mountAt("/en", <WorkBuddyAppWindow />);
    expectEnOnly(container, WORKBUDDY_COPY.en.discover, WORKBUDDY_COPY.en.chatTitle, "WorkBuddy");
  });

  it("ZCodeTaskWindow：整窗零 Han（锚 = en 表 newTask/taskTitle，侧栏+事件流全在扫）", () => {
    const { container } = mountAt("/en", <ZCodeTaskWindow />);
    expectEnOnly(container, ZCODE_COPY.en.newTask, ZCODE_COPY.en.taskTitle);
  });

  it("KimiShellTui：整窗零 Han（锚 = en 会话 user 行 + 常量欢迎盒标题）", () => {
    const { container } = mountAt("/en", <KimiShellTui />);
    expectEnOnly(container, KIMI_COPY.en.session.user, "Welcome to Kimi CLI!");
  });

  it("OpenCodeTui：整窗零 Han（锚 = en 会话 user 行 + 常量欢迎盒标题）", () => {
    const { container } = mountAt("/en", <OpenCodeTui />);
    expectEnOnly(container, OPENCODE_COPY.en.session.user, "OpenCode");
  });
});

describe("FilePreview /en 直挂零 Han：三帧交互驱动（remote.files 开屏态在整页门禁的盲区）", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en"); // 隔离挂载无 LangLayout effect：t() 的语言必须显式切
  });
  afterEach(cleanup);

  /** 点行进详情（行钮 accessible name 含文件名——文件名是语言无关常量，可当稳定选择器） */
  const openFile = (name: string) =>
    fireEvent.click(screen.getByRole("button", { name: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }));

  it("总列表帧：chrome（demo.fp.* 键）+ 六文件行零 Han", () => {
    const { container } = mountAt("/en", <FilePreview />);
    expectEnOnly(container, en["demo.fp.pill"], en["demo.fp.search"], "remote-card.html", "approve-notes.md");
  });

  it("code 详情帧：源码视图 + 渲染视图双帧零 Han（COPY.codeChip/renderChip 全盖）", () => {
    const { container } = mountAt("/en", <FilePreview />);
    openFile("remote-card.html");
    expectEnOnly(container, FILE_PREVIEW_COPY.en.codeChip, FILE_PREVIEW_COPY.en.h1Lead);
    fireEvent.click(screen.getByRole("button", { name: en["demo.fp.render"] }));
    expectEnOnly(container, FILE_PREVIEW_COPY.en.renderChip, FILE_PREVIEW_COPY.en.footNote);
  });

  it("md 详情帧：渲染视图（ReactMarkdown）零 Han", () => {
    const { container } = mountAt("/en", <FilePreview />);
    openFile("approve-notes.md");
    // md 渲染态锚 = 首行 h2 文本（自 COPY.en.md 提取，随文案漂移自动跟随）
    const mdH2 = FILE_PREVIEW_COPY.en.md.split("\n")[0]!.replace(/^##\s*/, "");
    expectEnOnly(container, mdH2);
  });
});

/** /zh 防回归锚点（既有 zh 门禁在 copy.parity / en-cjk-gate；此处各补一条证明 useLang 接线取 zh 表——
 *  若语言分支回归（如 en 表漏键兜底 zh），zh 锚点在场 + /en 零 Han 两锁互补现形） */
describe("关着的窗 /zh 锚点：语言分支取 zh 表（防回归）", () => {
  afterEach(cleanup);

  it("WorkBuddyAppWindow /zh：侧栏「发现应用」在（COPY.zh.discover）", () => {
    const { container } = mountAt("/zh", <WorkBuddyAppWindow />);
    expect(container.textContent).toContain(WORKBUDDY_COPY.zh.discover);
  });

  it("KimiShellTui /zh：用户行显中文原句（COPY.zh.session.user）", () => {
    const { container } = mountAt("/zh", <KimiShellTui />);
    expect(container.textContent).toContain(KIMI_COPY.zh.session.user);
  });
});
