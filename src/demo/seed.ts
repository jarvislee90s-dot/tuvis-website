import type { Session } from "./types";

/** 七会话种子（P13：全部 tuvis 生态项目语境 + 新增 opencode——桌面 4×2 / 演示 3×3 各留空位） */
export function seedSessions(): Record<string, Session> {
  const list: Session[] = [
    { id: "claude", tool: "claude", project: "tuvis-app", slug: "add-remote-approve", branch: "feat/remote-approve", messages: ["⏸ Permission needed: pnpm install", "  waiting for your approval…"], minutes: 32, cpu: 12, agents: 3, state: "waiting" },
    { id: "codex", tool: "codex", project: "tuvis-website", slug: "refactor-nav", branch: "main", messages: ["refactor: nav layout", "  editing src/nav/Layout.tsx"], minutes: 12, cpu: 8, agents: 1, state: "running" },
    { id: "opencode", tool: "opencode", project: "tuvis-app", slug: "tray-icon-states", branch: "feat/tray-icon", messages: ["feat: tray icon states", "  wiring Tauri tray menu"], minutes: 18, cpu: 6, agents: 2, state: "running" },
    { id: "kimi", tool: "kimi", project: "tuvis-app", slug: "fix-hook-trust", branch: "fix/hook-trust", messages: ["fix: trust dialog flake", "  regression green ×3"], minutes: 47, cpu: 3, agents: 0, state: "idle" },
    { id: "workbuddy", tool: "workbuddy", project: "tuvis-website", slug: "hero-copy", branch: "main", messages: ["copy: hero section", "  draft v3 ready for review"], minutes: 5, cpu: 5, agents: 1, state: "running" },
    { id: "zcode", tool: "zcode", project: "tuvis-app", slug: "ledger-trend", branch: "dev", messages: ["feat: usage trend line", "  idle — awaiting next prompt"], minutes: 21, cpu: 2, agents: 0, state: "idle" },
    { id: "dsh", tool: "dsh", project: "tuvis-docs", slug: "manual-watch", branch: "main", messages: ["watch: docs build", "  quiet — all pages green"], minutes: 8, cpu: 4, agents: 0, state: "idle" },
  ];
  return Object.fromEntries(list.map((s) => [s.id, s]));
}
