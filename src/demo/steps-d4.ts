// steps-d4.ts —— D4 桌宠剧本（P13 四段用户故事；场景本地 state 经 "tuvis-d4" 事件驱动绝对状态，seek 幂等）
import type { Step } from "./types";
import { useDemo } from "./store";

const fire = (action: string) => window.dispatchEvent(new CustomEvent("tuvis-d4", { detail: action }));
const P = () => useDemo.getState().setPetRun;

export const d4Steps: Step[] = [
  { dur: 3600, enter: () => { fire("reset"); fire("import"); },
    label: { zh: "导入宠物——从 petdex 在线仓库挑一只新伙伴", en: "Import a pet — pick a new buddy from the petdex store" },
    detailKey: "demo.detail.d4s1" },
  { dur: 3600, enter: () => { P()({ card: null, notify: false }); fire("switch"); },
    label: { zh: "切换宠物——两张卡对照真实设置界面", en: "Switch pets — both dialogs mirror the real settings UI" },
    detailKey: "demo.detail.d4s2" },
  { dur: 3600, enter: () => { P()({ card: "approval", notify: true }); fire("approval"); },
    label: { zh: "审批来了——头顶消息卡黄变红，手机托盘同步知道", en: "An approval lands — the head card flips yellow to red, phone and tray in sync" },
    detailKey: "demo.detail.d4s3" },
  { dur: 3600, enter: () => { P()({ card: null, notify: false }); fire("token"); },
    label: { zh: "token 详情浮窗——只在鼠标悬浮或此刻出现", en: "The token detail popover — hover-only, or right now" },
    detailKey: "demo.detail.d4s4" },
];

export const d4Reset = () => {
  useDemo.setState({ petRun: { card: null, notify: false } });
  fire("reset");
};
