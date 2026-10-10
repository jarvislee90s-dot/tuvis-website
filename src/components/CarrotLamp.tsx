import type { CSSProperties } from "react";

export type LampState = "green" | "yellow" | "red";

/** 品牌冻结色——仅品牌物料使用；Demo 产品卡状态色走台账软色（见 P7 令牌表）。 */
export const LAMP_FROZEN: Record<LampState, string> = {
  green: "#36BB7B",
  yellow: "#EAB53D",
  red: "#DE5656",
};

/**
 * 胡萝卜状态灯：主体换色（品牌规则），叶随主题弱色（currentColor），高光刻线为中性白。
 * 简洁现代扁平风：无描边、无渐变、圆头刻线。
 */
export function CarrotLamp({ state, size = 120, className = "", style }: {
  state: LampState; size?: number; className?: string; style?: CSSProperties;
}) {
  return (
    <svg viewBox="0 0 120 170" width={size} height={Math.round((size * 170) / 120)}
      role="img" aria-hidden="true" className={className} style={style}>
      <g fill="none" stroke="currentColor" strokeWidth={5} strokeLinecap="round">
        <path d="M53 50 C50 36 44 29 36 25" />
        <path d="M60 48 C60 33 60 26 60 17" />
        <path d="M67 50 C70 36 76 29 84 25" />
      </g>
      <path d="M60 52 C76 52 84 62 82 76 C80 96 70 132 62 152 C61.2 154.5 58.8 154.5 58 152 C50 132 40 96 38 76 C36 62 44 52 60 52 Z"
        fill={LAMP_FROZEN[state]} />
      <g fill="none" stroke="rgba(255,255,255,.45)" strokeWidth={3.5} strokeLinecap="round">
        <path d="M50 84 C56 88 64 88 70 84" />
        <path d="M52 108 C58 112 62 112 68 108" />
      </g>
    </svg>
  );
}
