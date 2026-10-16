// steps-d2.ts —— D2 远程完整页七段（v2 节拍表）：enter 全绝对值（seek 幂等，B16）
import type { Step } from "./types";
import { setStateOf, useDemo, REMOTE_INIT, SEED_MSGS, QUEUED_MSG } from "./store";

const R = () => useDemo.getState().setRemote;

/** detail 页公共底值（plan B 常量）：每个 enter 显式补全 approval/question/files/planMode/messages 全键，防 patch 漏键 */
const B = { page: "detail" as const, thinkingExpanded: false, deleted: [] as string[], filter: null };

export const d2Steps: Step[] = [
  { dur: 2600, enter: () => { R()({ ...REMOTE_INIT, approval: "none", question: null, files: false, planMode: false }); setStateOf("claude", "waiting"); },
    label: { zh: "远程看板页：状态 pill 一眼分区", en: "Remote board: pills sort the field at a glance" },
    detailKey: "demo.detail.d2s1" },
  { dur: 2400, enter: () => R()({ ...B, messages: SEED_MSGS, approval: "pending", question: null, files: false, planMode: false }),
    label: { zh: "点卡进详情——审批红卡已就位", en: "Tap in — the red approval card is waiting" },
    detailKey: "demo.detail.d2s2" },
  { dur: 2800, enter: () => { R()({ ...B, messages: SEED_MSGS, approval: "approved", question: null, files: false, planMode: false }); setStateOf("claude", "running"); },
    label: { zh: "「允许」——终端 ✓ Approved 续跑", en: "Allow — the terminal prints ✓ Approved" },
    detailKey: "demo.detail.d2s3" },
  { dur: 2800, enter: () => R()({ ...B, messages: [...SEED_MSGS, QUEUED_MSG], approval: "approved", question: null, files: false, planMode: false }),
    label: { zh: "发消息：气泡「已排队」，终端回显输入行", en: "Send: bubble queued, terminal echoes the input line" },
    detailKey: "demo.detail.d2s4" },
  { dur: 2600, enter: () => R()({ ...B, messages: [...SEED_MSGS, QUEUED_MSG], approval: "approved", question: null, files: false, planMode: true }),
    label: { zh: "计划模式：banner 亮起，底行切换", en: "Plan mode: banner on, mode line switches" },
    detailKey: "demo.detail.d2s5" },
  // D9：picked 存选项 id（qa.ts 的 QA_MULTI 表；勿用显示串/下标）——回显按 lang 解析文案
  { dur: 2600, enter: () => R()({ ...B, messages: [...SEED_MSGS, QUEUED_MSG], approval: "approved", question: { kind: "multi", picked: ["finance", "investing"], submitted: true }, files: false, planMode: false }),
    label: { zh: "题卡：单选/多选点选提交", en: "Question cards: pick and submit" },
    detailKey: "demo.detail.d2s6" },
  { dur: 2600, enter: () => { R()({ ...B, messages: [...SEED_MSGS, QUEUED_MSG], approval: "approved", question: null, files: true, planMode: false }); setStateOf("claude", "idle"); },
    label: { zh: "文件预览：文件树 + 着色 diff", en: "File preview: tree + colored diff" },
    detailKey: "demo.detail.d2s7" },
];

export const d2Reset = () => {
  useDemo.setState({ remote: { ...REMOTE_INIT } });
  setStateOf("claude", "waiting");   // claude 回 seed 初始态
};
