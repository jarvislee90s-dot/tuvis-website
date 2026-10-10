import { create } from "zustand";
import type { Session, SessionState } from "./types";
import { seedSessions } from "./seed";

export interface RemoteMsg { role: "user" | "assistant"; text: string; queued?: boolean }
export type QuestionState =
  | { kind: "single"; picked: string | null; submitted: boolean }
  | { kind: "multi"; picked: string[]; submitted: boolean }
  | null;
interface RemoteState {
  page: "board" | "detail";
  filter: string | null;                 // 手机端独立筛选（不与桌面 store.filter 互扰）
  deleted: string[];                     // 垃圾桶移除的会话 id
  approval: "none" | "pending" | "approved";
  planMode: boolean;
  question: QuestionState;
  files: boolean;
  thinkingExpanded: boolean;
  messages: RemoteMsg[];
}

/** 详情页种子消息 / 排队消息（steps-d2 引用，绝对值幂等，B16）；P13 演示数据 tuvis 化 */
export const SEED_MSGS: RemoteMsg[] = [
  { role: "user", text: "你好" },
  { role: "assistant", text: "你好——看板在线：3 个会话，1 个等待批准。\n• 桌面端 Claude / Codex / Kimi 并跑中\n• 远程通道已连接（MateBook16s）" },
];
export const QUEUED_MSG: RemoteMsg = { role: "user", text: "审批通过后把托盘图标缓存也刷新", queued: true };

/** remote v2 初始值（看板页；d2Reset / d2 s1 enter 以此为准导出） */
export const REMOTE_INIT: RemoteState = {
  page: "board", filter: null, deleted: [], approval: "none", planMode: false,
  question: null, files: false, thinkingExpanded: false, messages: SEED_MSGS,
};

interface DemoState {
  sessions: Record<string, Session>;
  filter: string | null;                 // null = 全部
  setFilter: (tool: string | null) => void;
  setSession: (id: string, patch: Partial<Pick<Session, "state" | "minutes">>) => void;
  remote: RemoteState;
  setRemote: (patch: Partial<RemoteState>) => void;
  windows: { notify: boolean; toolWin: string | null };   // toolWin = tools key（五窗互斥，B12）
  setWindows: (patch: Partial<DemoState["windows"]>) => void;
  dismissed: string[];                       // 被卡片 X 收起的会话 id
  setDismissed: (ids: string[]) => void;
  petRun: { card: null | "approval" | "done"; notify: boolean };   // D4 剧本/按钮共驱
  setPetRun: (patch: Partial<DemoState["petRun"]>) => void;
}

export const useDemo = create<DemoState>((set) => ({
  sessions: seedSessions(),
  filter: null,
  setFilter: (tool) => set({ filter: tool }),
  setSession: (id, patch) =>
    set((s) => ({ sessions: { ...s.sessions, [id]: { ...s.sessions[id], ...patch } } })),
  remote: REMOTE_INIT,
  setRemote: (patch) => set((s) => ({ remote: { ...s.remote, ...patch } })),
  windows: { notify: false, toolWin: null },
  setWindows: (patch) => set((s) => ({ windows: { ...s.windows, ...patch } })),
  dismissed: [],
  setDismissed: (ids) => set({ dismissed: ids }),
  petRun: { card: null, notify: false },
  setPetRun: (patch) => set((s) => ({ petRun: { ...s.petRun, ...patch } })),
}));

export const setStateOf = (id: string, state: SessionState) =>
  useDemo.getState().setSession(id, { state });
