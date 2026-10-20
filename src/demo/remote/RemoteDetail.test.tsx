import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import i18n from "i18next"; // 语言切换（CompatMatrix.test 先例）：同一单例，@/i18n 已对其 init
import "@/i18n"; // 侧效应导入：RemoteDetail 的 useTranslation 需要全局 i18next 资源
import { QA_MULTI } from "../qa";
import { REMOTE_INIT, useDemo } from "../store";
import { RemoteDetail } from "./RemoteDetail";

/** 挂到 /:lang 路由下（RemoteDetail 的 useParams 需要路由参数）。
 *  注意：隔离挂载 ≠ 真 /en 渲染——组件只从 URL 取 lang，i18next 实例语言需用例内显式切
 *  （真页由 LangLayout effect 调 applyLang，这里没走）。 */
function mountAt(entry: string, el: ReactNode) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/:lang" element={el} />
      </Routes>
    </MemoryRouter>,
  );
}

/** 显示串含正则元字符（如「金融/信用评级」的斜杠）时须转义（审查 M6） */
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** 按显示串取题卡选项钮：title 取自选项表（不硬编码文案），正则先转义 */
const option = (title: string) => screen.getByRole("button", { name: new RegExp(escapeRegExp(title)) });
/** 按 id 取当前语言的显示串（T3.3：title 双语，zh/en 各自取） */
const titleOf = (id: string, lang: "zh" | "en") => QA_MULTI.options.find((o) => o.id === id)!.title[lang];
/** 题卡提交钮：按稳定语义选择器（可见「发送」+ 提交语义，M6；可见文本必须在 aria 内，label-in-name） */
const submitAnswer = () => screen.getByRole("button", { name: i18n.t("demo.remote.submitQa") });

/** 语言隔离（M7）：每例前重置 remote 并显式对齐 i18next 到 zh，不依赖执行顺序/前例残留 */
beforeEach(async () => {
  useDemo.setState({ remote: { ...REMOTE_INIT } });
  await i18n.changeLanguage("zh");
});
afterEach(cleanup);

/** D10：RemoteDetail 用户输入写 {raw}；{raw} 在 /zh 与 /en 都显原文 */
describe("RemoteDetail send：用户输入写 {raw} 形态（D10）", () => {
  const sendDraft = (text: string) => {
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: text } });
    fireEvent.keyDown(input, { key: "Enter" });
  };

  it("发送后入列消息为 {raw} 且排队 chip 显原文（/zh）", async () => {
    mountAt("/zh", <RemoteDetail />);
    sendDraft("把 README 也更新");
    await waitFor(() => {
      const msgs = useDemo.getState().remote.messages;
      expect(msgs).toHaveLength(REMOTE_INIT.messages.length + 1);
    });
    const last = useDemo.getState().remote.messages.at(-1)!;
    expect(last).toEqual({ role: "user", text: { raw: "把 README 也更新" }, queued: true });
    expect(screen.getByText("把 README 也更新")).toBeInTheDocument();
  });

  it("切到 en（隔离挂载显式切 i18next 补偿）后仍显同一原文", async () => {
    await i18n.changeLanguage("en");
    mountAt("/en", <RemoteDetail />);
    sendDraft("把 README 也更新");
    await waitFor(() => {
      const msgs = useDemo.getState().remote.messages;
      expect(msgs).toHaveLength(REMOTE_INIT.messages.length + 1);
    });
    // 重挂到 /en（模拟切语言）：排队 chip 与气泡仍显示原文
    cleanup();
    const { container } = mountAt("/en", <RemoteDetail />);
    expect(container.textContent).toContain("把 README 也更新");
    expect(container.textContent).toContain("Queued"); // 证明确在 en 渲染而非 zh 兜底
  });
});

/** D9 交互护栏：题卡点选写 id、取消勾选走 id、提交回显按 lang 取表内 title 与分隔符 */
describe("RemoteDetail 题卡：picked 存 id、回显按 lang（D9 交互）", () => {
  beforeEach(() =>
    useDemo.setState({ remote: { ...REMOTE_INIT, question: { kind: "multi", picked: [], submitted: false } } }),
  );

  it("勾选/取消/提交全走 id；zh「已提交：…、…」/ en「Submitted: …, …」", async () => {
    const zh = mountAt("/zh", <RemoteDetail />);
    fireEvent.click(option(titleOf("finance", "zh")));
    fireEvent.click(option(titleOf("investing", "zh")));
    expect(useDemo.getState().remote.question).toEqual({ kind: "multi", picked: ["finance", "investing"], submitted: false });
    // 再点一次 = 按 id 取消勾选（toggle 语义不碰显示串）
    fireEvent.click(option(titleOf("investing", "zh")));
    expect(useDemo.getState().remote.question).toEqual({ kind: "multi", picked: ["finance"], submitted: false });
    fireEvent.click(option(titleOf("investing", "zh")));
    fireEvent.click(submitAnswer());
    expect(useDemo.getState().remote.question).toEqual({ kind: "multi", picked: ["finance", "investing"], submitted: true });
    expect(zh.container.textContent).toContain(`已提交：${titleOf("finance", "zh")}、${titleOf("investing", "zh")}`);

    // 同态切 en：前缀分隔符半角冒号 + 半角逗号 join + title 取英文侧（T3.3 双语题卡）
    cleanup();
    await i18n.changeLanguage("en");
    const en = mountAt("/en", <RemoteDetail />);
    expect(en.container.textContent).toContain(`Submitted: ${titleOf("finance", "en")}, ${titleOf("investing", "en")}`);
    expect(en.container.textContent).not.toContain("Submitted：");
  });

  it("submitted 但空 picked：整行不渲染，无「已提交：」悬空标签（M5）", () => {
    useDemo.setState({ remote: { ...REMOTE_INIT, question: { kind: "multi", picked: [], submitted: true } } });
    const { container } = mountAt("/zh", <RemoteDetail />);
    expect(container.textContent).not.toContain("已提交");
  });
});
