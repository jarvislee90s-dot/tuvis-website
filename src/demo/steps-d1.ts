// steps-d1.ts
import type { Step } from "./types";
import { setStateOf, useDemo } from "./store";
import { seedSessions } from "./seed";

const W = () => useDemo.getState().setWindows;

/** d1 七段（v3 节拍表）：五工具各一次跳转，enter 全部写绝对值（seek 幂等） */
export const d1Steps: Step[] = [
  { dur: 3000, enter: () => setStateOf("claude", "waiting"),
    label: { zh: "看板即全局：红灯呼吸，等你拍板", en: "The board is the overview: the red light breathes, waiting for your call" },
    detailKey: "demo.detail.d1s1" },
  { dur: 2800, enter: () => W()({ notify: true }),
    label: { zh: "桌面通知弹出，点一下直达终端", en: "A desktop notification pops — click to jump to the terminal" },
    detailKey: "demo.detail.d1s2" },
  { dur: 3000, enter: () => { W()({ notify: false, toolWin: "claude" }); setStateOf("claude", "running"); },
    label: { zh: "跳转①：Claude Code 完整会话窗", en: "Jump 1: Claude Code in full session form" },
    detailKey: "demo.detail.d1s3" },
  { dur: 2600, enter: () => { W()({ toolWin: "codex" }); setStateOf("codex", "waiting"); },
    label: { zh: "跳转②：Codex APP 任务窗（ChatGPT Work）", en: "Jump 2: the Codex app window (ChatGPT Work)" },
    detailKey: "demo.detail.d1s4" },
  { dur: 2600, enter: () => W()({ toolWin: "kimi" }),
    label: { zh: "跳转③：Kimi CLI 欢迎盒与状态栏", en: "Jump 3: the Kimi CLI welcome box and status bar" },
    detailKey: "demo.detail.d1s5" },
  { dur: 2600, enter: () => W()({ toolWin: "workbuddy" }),
    label: { zh: "跳转④：WorkBuddy APP 任务窗", en: "Jump 4: the WorkBuddy app window" },
    detailKey: "demo.detail.d1s6" },
  { dur: 3000, enter: () => W()({ toolWin: "zcode" }),
    label: { zh: "跳转⑤：ZCode 任务窗——事件流全程可溯", en: "Jump 5: the ZCode task window — the full event stream" },
    detailKey: "demo.detail.d1s7" },
  { dur: 2600, enter: () => W()({ toolWin: "opencode" }),
    label: { zh: "跳转⑥：OpenCode TUI——六窗等高切换", en: "Jump 6: the OpenCode TUI — six windows, one height" },
    detailKey: "demo.detail.d1s8" },
];

export const d1Reset = () => useDemo.setState({
  sessions: seedSessions(), filter: null, dismissed: [],
  windows: { notify: false, toolWin: null },
});
