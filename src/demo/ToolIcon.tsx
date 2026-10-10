import { useId, type ReactNode } from "react";

/**
 * 8 工具 SVG 日/夜双形态，1:1 抄自 remote-ui 01-看板-定稿.html
 * day 组 81–134 行 / night 组 153–202 行；黑系 4 个（codex/kimi/zcode/opencode）夜间独立形态，
 * 彩色系（claude/openclaw/workbuddy/dsh）日夜同图，夜组复用日组。
 */
const DAY_PATHS: Record<string, ReactNode> = {
  /* 01 定稿 81 行 */
  codex: (
    <>
      <rect width="19" height="19" x="0.5" y="0.5" rx="5" fill="#fff" stroke="#1a1a1a" strokeWidth="1.3" />
      <path d="M5.5 12.5L9 9L5.5 5.5" stroke="#111" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 13H14.5" stroke="#10A37F" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  /* 01 定稿 88 行 */
  claude: (
    <>
      <rect width="20" height="20" rx="5" fill="#D97757" />
      <text x="10" y="14.5" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700" fontFamily="-apple-system,system-ui">C</text>
    </>
  ),
  /* 01 定稿 95 行 */
  kimi: (
    <>
      <rect width="20" height="20" rx="5" fill="#0B0E1A" />
      <path d="M17.5 10.66A7.5 7.5 0 1 1 9.34 2.5 5.83 5.83 0 0 0 17.5 10.66Z" fill="#fff" />
    </>
  ),
  /* 01 定稿 102 行 */
  zcode: (
    <>
      <rect width="20" height="20" rx="5" fill="#141413" />
      <path d="M5.5 5.5h9L6.5 14.5h9" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  /* 01 定稿 109 行 */
  openclaw: (
    <>
      <rect width="20" height="20" rx="5" fill="#D2453C" />
      <circle cx="10" cy="11" r="4.5" stroke="#fff" strokeWidth="1.5" fill="none" />
      <circle cx="8" cy="10" r="0.9" fill="#fff" />
      <circle cx="12" cy="10" r="0.9" fill="#fff" />
      <path d="M6 6.5L8 4" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M14 6.5L12 4" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
    </>
  ),
  /* 01 定稿 116 行 */
  opencode: (
    <>
      <rect width="19" height="19" x="0.5" y="0.5" rx="5" fill="#fff" stroke="#2b2b28" strokeWidth="1.3" />
      <path d="M7 6L4 10L7 14" stroke="#111" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 6L16 10L13 14" stroke="#111" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  /* 01 定稿 130 行（源文件即 24×24 viewBox） */
  dsh: (
    <>
      <rect width="24" height="24" rx="6" fill="#4D6BFE" />
      <path d="M6.8 5.5h3.4c5 0 8.3 3 8.3 6.7 0 .6-.1 1.2-.3 1.7-1 3-4.3 5.1-8 5.1H6.8c-.7 0-1.3-.6-1.3-1.3V6.8c0-.7.6-1.3 1.3-1.3z" fill="#fff" />
      <path d="M17.9 8.7c1.6-.6 2.8-1.6 3.6-3.2.1 1.5-.3 2.7-1.1 3.6.8 1 1.2 2.1 1.1 3.6-.8-1.6-2-2.6-3.6-3.2z" fill="#fff" />
      <circle cx="7.9" cy="11.5" r="1" fill="#4D6BFE" />
    </>
  ),
};

/** 夜间仅黑系 4 个需要独立形态；其余工具回退日组（01 定稿 153–202 行） */
const NIGHT_PATHS: Partial<Record<string, ReactNode>> = {
  /* 01 定稿 153 行 */
  codex: (
    <>
      <rect width="19" height="19" x="0.5" y="0.5" rx="5" fill="#1A1A1A" stroke="#ECE9E2" strokeWidth="1.2" />
      <path d="M5.5 12.5L9 9L5.5 5.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 13H14.5" stroke="#10A37F" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  /* 01 定稿 167 行 */
  kimi: (
    <>
      <rect width="20" height="20" rx="5" fill="#E8EDF8" />
      <path d="M17.5 10.66A7.5 7.5 0 1 1 9.34 2.5 5.83 5.83 0 0 0 17.5 10.66Z" fill="#0B0E1A" />
    </>
  ),
  /* 01 定稿 174 行 */
  zcode: (
    <>
      <rect width="20" height="20" rx="5" fill="#141413" stroke="#ECE9E2" strokeWidth="1.4" />
      <path d="M5.5 5.5h9L6.5 14.5h9" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  /* 01 定稿 188 行 */
  opencode: (
    <>
      <rect width="19" height="19" x="0.5" y="0.5" rx="5" fill="#1A1A1A" stroke="#ECE9E2" strokeWidth="1.2" />
      <path d="M7 6L4 10L7 14" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 6L16 10L13 14" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
};

/** WorkBuddy 渐变（01 定稿 123/195 行，日夜同色停点）；id 用 useId 防多实例重复 */
function workbuddyPaths(gid: string): ReactNode {
  return (
    <>
      <defs>
        <linearGradient id={gid} x1="3" y1="2" x2="17" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4AD06A" />
          <stop offset="1" stopColor="#0FBF8F" />
        </linearGradient>
      </defs>
      <rect width="20" height="20" rx="5" fill={`url(#${gid})`} />
      <path d="M4.6 7.2 4.2 3.4c0-.4.4-.7.8-.5l3.4 1.9a7.6 7.6 0 0 1 2.9-.57c1.1 0 2.1.2 3 .57l3.4-1.9c.4-.2.8.1.8.5l-.4 3.8c.6 1 1 2.2 1 3.4 0 4.14-3.36 6.9-7.5 6.9S4.6 14.74 4.6 10.6c0-1.2.4-2.4 1-3.4Z" fill="#fff" />
      <circle cx="8.2" cy="11.4" r="1.05" fill={`url(#${gid})`} />
      <circle cx="12.6" cy="11.4" r="1.05" fill={`url(#${gid})`} />
    </>
  );
}

export function ToolIcon({ tool, size = 19 }: { tool: string; size?: number }) {
  const gid = `wb${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const day = tool === "workbuddy" ? workbuddyPaths(`${gid}d`) : DAY_PATHS[tool];
  /* 夜组直接复用日组（彩色系日夜同图）；WorkBuddy 夜组用独立渐变 id，避免暗色下两份同 id */
  const night = NIGHT_PATHS[tool] ?? (tool === "workbuddy" ? workbuddyPaths(`${gid}n`) : day);
  return (
    <svg viewBox={tool === "dsh" ? "0 0 24 24" : "0 0 20 20"} width={size} height={size} aria-hidden="true" className="shrink-0">
      {/* 日间形态 */}
      <g className="dark:hidden">{day}</g>
      {/* 夜间形态（黑系反转：kimi 反白、zcode/opencode 亮描边、codex 深底白符；彩色系日夜同图） */}
      <g className="hidden dark:block">{night}</g>
    </svg>
  );
}
