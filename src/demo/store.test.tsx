import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import "@/i18n"; // 侧效应导入：RemoteDetail 的 useTranslation 需要全局 i18next 资源
import { QA_MULTI, QA_SINGLE, pickedDisplayText } from "./ClaudeTui";
import { RemoteDetail } from "./remote/RemoteDetail";
import { REMOTE_INIT, QUEUED_MSG, SEED_MSGS, msgDisplayText, useDemo } from "./store";
import { d2Reset, d2Steps } from "./steps-d2";

/** D10：种子/脚本消息必须是 {zh,en} 双语形态（用户实时输入才是 {raw}） */
describe("RemoteMsg.text 双语联合类型（D10）", () => {
  it("SEED_MSGS 全部为 {zh,en} 形态且双语非空", () => {
    expect(SEED_MSGS.length).toBeGreaterThan(0);
    for (const m of SEED_MSGS) {
      if (!("zh" in m.text)) throw new Error("种子消息必须是 {zh,en} 双语形态");
      expect(m.text.zh.trim()).not.toBe("");
      expect(m.text.en.trim()).not.toBe("");
    }
  });

  it("QUEUED_MSG 同为 {zh,en} 形态且双语非空", () => {
    if (!("zh" in QUEUED_MSG.text)) throw new Error("排队消息必须是 {zh,en} 双语形态");
    expect(QUEUED_MSG.text.zh.trim()).not.toBe("");
    expect(QUEUED_MSG.text.en.trim()).not.toBe("");
  });
});

/** D10：显示取值按形态分支——双语按语言取；{raw} 用户消息两种语言都显原文 */
describe("msgDisplayText（显示取值纯函数）", () => {
  it("双语消息：zh 取 zh、en 取 en", () => {
    const m = { text: { zh: "你好", en: "Hello" } };
    expect(msgDisplayText(m, "zh")).toBe("你好");
    expect(msgDisplayText(m, "en")).toBe("Hello");
  });

  it("{raw} 用户消息：zh / en 都返回同一原文", () => {
    const m = { text: { raw: "把 README 也更新" } };
    expect(msgDisplayText(m, "zh")).toBe("把 README 也更新");
    expect(msgDisplayText(m, "en")).toBe("把 README 也更新");
  });
});

/** D9：picked 存语言无关 id——选项表自带 id、id 唯一且不等于显示串；显示时按表解析 + 按语言 join */
describe("picked id 化（D9）", () => {
  it("QA 选项表 id 非空、唯一、不等于显示串、不是下标", () => {
    for (const { options } of [QA_SINGLE, QA_MULTI]) {
      const ids = options.map((o) => o.id);
      for (const o of options) {
        expect(o.id.trim()).not.toBe("");
        expect(o.id).not.toBe(o.title);
        expect(o.id).not.toMatch(/^\d+$/);
      }
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("单选 id → 对应显示串（未登记 id 原样回退）", () => {
    expect(pickedDisplayText({ kind: "single", picked: "finance" }, "zh")).toBe("金融/信用评级");
    expect(pickedDisplayText({ kind: "single", picked: "未登记" }, "zh")).toBe("未登记");
    expect(pickedDisplayText({ kind: "single", picked: null }, "zh")).toBe("");
  });

  it("多选 id 列表 → 显示串按语言 join（zh「、」/ en「, 」）", () => {
    const q: { kind: "multi"; picked: string[] } = { kind: "multi", picked: ["finance", "investing"] };
    expect(pickedDisplayText(q, "zh")).toBe("金融/信用评级、投资理财常识");
    expect(pickedDisplayText(q, "en")).toBe("金融/信用评级, 投资理财常识");
  });

  it("D2 第 6 拍种子 picked 全部为真实多选 id（提交回显可解析，无悬空）", () => {
    d2Reset();
    const step = d2Steps.find((s) => s.detailKey === "demo.detail.d2s6");
    expect(step?.enter).toBeTypeOf("function");
    step!.enter!();
    const q = useDemo.getState().remote.question;
    expect(q?.kind).toBe("multi");
    expect(q?.submitted).toBe(true);
    const ids = q !== null && q.kind === "multi" ? q.picked : [];
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      // 回退 = id 本身 → 说明该 id 不在多选表内（悬空种子）
      expect(pickedDisplayText({ kind: "multi", picked: [id] }, "zh")).not.toBe(id);
    }
  });
});

/** D10：RemoteDetail 用户输入写 {raw}；{raw} 在 /zh 与 /en 都显原文 */
describe("RemoteDetail send：用户输入写 {raw} 形态", () => {
  beforeEach(() => useDemo.setState({ remote: { ...REMOTE_INIT } }));
  afterEach(cleanup);

  const mountAt = (entry: string, el: ReactNode) =>
    render(
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/:lang" element={el} />
        </Routes>
      </MemoryRouter>,
    );

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

  it("/en 页仍显同一原文（用户消息语义：两种语言都显原文）", async () => {
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
  });
});
