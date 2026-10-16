/** 双语文本（M2/D10）：Step.label 与 RemoteMsg 双语支共用同一形状，批次 3 COPY 化按此铺开 */
export type Bilingual = { zh: string; en: string };

export type SessionState = "running" | "waiting" | "idle";
export interface Session {
  id: string;
  tool: string;        // tools.ts 的 key
  project: string;
  slug: string;        // 灰色 mono 标题尾（真卡顶行）
  branch: string;
  messages: [string, string];   // 中部两行消息预览（真卡）
  minutes: number;     // 时长
  cpu: number;         // CPU%
  agents: number;      // 子代理数
  state: SessionState;
}
export interface Step {
  dur: number;                    // 段时长 ms；进度条段宽 = dur/总时长（归一化）
  enter?: () => void;             // 段开始副作用——必须幂等（seek 会 reset+重放 0..i）
  label: Bilingual;              // 段内嵌简介（原 caption 文案迁入）
  detailKey: string;              // hover 详细说明 i18n key
}
