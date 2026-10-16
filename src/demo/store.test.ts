import { describe, expect, it, vi } from "vitest";
import { QA_MULTI, QA_SINGLE, pickedDisplayText, submittedDisplayText } from "./qa";
import { REMOTE_INIT, QUEUED_MSG, SEED_MSGS, msgDisplayText, useDemo, type QuestionState } from "./store";
import { d1Reset, d1Steps } from "./steps-d1";
import { d2Reset, d2Steps } from "./steps-d2";
import { d4Reset, d4Steps } from "./steps-d4";
import { resSteps } from "./steps-res";
import type { Step } from "./types";

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
  it("QA 选项表 id 非空、唯一、不等于显示串（zh/en 两侧）、不是下标", () => {
    for (const { options } of [QA_SINGLE, QA_MULTI]) {
      const ids = options.map((o) => o.id);
      for (const o of options) {
        expect(o.id.trim()).not.toBe("");
        expect(o.id).not.toBe(o.title.zh);
        expect(o.id).not.toBe(o.title.en);
        expect(o.id).not.toMatch(/^\d+$/);
      }
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("题面/选项 title/desc 双语形态：en 零 CJK、zh 非空（T3.3 题卡数据门禁）", () => {
    for (const { question, options } of [QA_SINGLE, QA_MULTI]) {
      expect(question.en, "question.en").not.toMatch(/[\u4e00-\u9fff]/);
      expect(question.zh.trim(), "question.zh").not.toBe("");
      for (const o of options) {
        expect(o.title.en, `${o.id}.title.en`).not.toMatch(/[\u4e00-\u9fff]/);
        expect(o.title.zh.trim(), `${o.id}.title.zh`).not.toBe("");
        if (o.desc) {
          expect(o.desc.en, `${o.id}.desc.en`).not.toMatch(/[\u4e00-\u9fff]/);
          expect(o.desc.zh.trim(), `${o.id}.desc.zh`).not.toBe("");
        }
      }
    }
  });

  it("单选 id → 对应显示串；未登记 id 原样回退且 DEV 告警（M4，线上行为不变）", () => {
    expect(pickedDisplayText({ kind: "single", picked: "finance" }, "zh")).toBe("金融/信用评级");
    expect(pickedDisplayText({ kind: "single", picked: null }, "zh")).toBe("");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(pickedDisplayText({ kind: "single", picked: "未登记" }, "zh")).toBe("未登记");
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("未登记"));
    warn.mockRestore();
  });

  it("多选 id 列表 → 显示串按语言 join 且按语言取题（zh「、」/ en「, 」）", () => {
    const q: { kind: "multi"; picked: string[] } = { kind: "multi", picked: ["finance", "investing"] };
    expect(pickedDisplayText(q, "zh")).toBe("金融/信用评级、投资理财常识");
    expect(pickedDisplayText(q, "en")).toBe("Finance / credit ratings, Personal investing");
  });

  it("空 picked → 显示串与提交回显整行均为空串（M5，防悬空「已提交：」）", () => {
    expect(pickedDisplayText({ kind: "multi", picked: [] }, "zh")).toBe("");
    expect(pickedDisplayText({ kind: "single", picked: null }, "en")).toBe("");
    expect(submittedDisplayText("已提交", { kind: "multi", picked: [] }, "zh")).toBe("");
    expect(submittedDisplayText("Submitted", { kind: "multi", picked: ["chat"] }, "en")).toBe("Submitted: Chat about this");
    expect(submittedDisplayText("已提交", { kind: "single", picked: "finance" }, "zh")).toBe("已提交：金融/信用评级");
  });

  it("全脚本种子巡检：任何步骤种下的 question.picked ⊆ 选项表且可解析（表驱动，M4）", () => {
    const scripts: { name: string; steps: Step[]; reset?: () => void }[] = [
      { name: "d1", steps: d1Steps, reset: d1Reset },
      { name: "d2", steps: d2Steps, reset: d2Reset },
      { name: "d4", steps: d4Steps, reset: d4Reset },
      { name: "d3", steps: resSteps },   // resSteps 仅派发 CustomEvent（jsdom 无监听即 no-op）
    ];
    let seeded = 0;
    let d2s6: QuestionState = null;
    for (const { name, steps, reset } of scripts) {
      useDemo.setState({ remote: { ...REMOTE_INIT } });      // 防上一脚本残留的 question 误判归属
      reset?.();
      for (const step of steps) {
        step.enter?.();
        if (step.detailKey === "demo.detail.d2s6") d2s6 = useDemo.getState().remote.question;
        const q = useDemo.getState().remote.question;
        if (!q) continue;
        seeded += 1;
        const table = q.kind === "single" ? QA_SINGLE.options : QA_MULTI.options;
        const ids = q.kind === "single" ? (q.picked === null ? [] : [q.picked]) : q.picked;
        for (const id of ids) {
          expect(table.some((o) => o.id === id), `${name}/${step.detailKey} 悬空 picked id: ${id}`).toBe(true);
          expect(pickedDisplayText({ kind: q.kind, picked: [id] }, "zh")).toBe(table.find((o) => o.id === id)?.title.zh);
        }
      }
    }
    expect(seeded).toBeGreaterThan(0);                        // 巡检非空转：确有脚本种子题卡
    // D2 第 6 拍提交回显种子：非空且提交态（否则回显行整行消失，M5 语义下会被静默吞掉）
    expect(d2s6?.kind).toBe("multi");
    expect(d2s6?.submitted).toBe(true);
    expect(d2s6 !== null && d2s6.kind === "multi" ? d2s6.picked.length : 0).toBeGreaterThan(0);
  });
});
