import { useCallback, useEffect, useState } from "react";
import type { Step } from "./types";

export type Phase = "idle" | "playing" | "paused";
const TICK = 50;

/** 纯函数时间轴：各段起始偏移与总时长（进度条归一化 + 单测） */
export function timeline(steps: Step[]): { offsets: number[]; total: number } {
  const offsets: number[] = [];
  let acc = 0;
  for (const s of steps) { offsets.push(acc); acc += s.dur; }
  return { offsets, total: acc };
}

/** 整体进度 0..1（已完成段偏移 + 段内比例） */
export function overallProgress(steps: Step[], seg: number, frac: number): number {
  const { offsets, total } = timeline(steps);
  if (total === 0 || seg < 0) return 0;
  return Math.min(1, (offsets[seg] + frac * steps[seg].dur) / total);
}

export function useScriptPlayer(steps: Step[], reset?: () => void) {
  const [phase, setPhase] = useState<Phase>("idle");   // 默认不自动演示（决策 5）
  const [seg, setSeg] = useState(-1);
  const [frac, setFrac] = useState(0);

  useEffect(() => {
    if (phase !== "playing" || seg < 0) return;
    const t = window.setInterval(() => setFrac((f) => f + TICK), TICK);
    return () => window.clearInterval(t);
  }, [phase, seg]);

  useEffect(() => {
    if (phase !== "playing" || seg < 0 || frac < steps[seg].dur) return;
    if (seg >= steps.length - 1) {                 // 整条播完 → 回绕初始态
      reset?.();
      setPhase("idle"); setSeg(-1); setFrac(0);
    } else {
      const next = seg + 1;
      steps[next].enter?.();
      setSeg(next); setFrac(0);
    }
  }, [frac, seg, phase, steps, reset]);

  const play = useCallback(() => {
    if (phase === "playing") return;
    if (seg < 0) { reset?.(); steps[0].enter?.(); setSeg(0); setFrac(0); }
    setPhase("playing");
  }, [phase, seg, steps, reset]);

  const pause = useCallback(() => setPhase((p) => (p === "playing" ? "paused" : p)), []);

  /** seek(i)：跳到第 i 段起点并暂停——reset 后重放 enter(0..i)，保证视觉确定（B4） */
  const seek = useCallback((i: number) => {
    reset?.();
    for (let k = 0; k <= i; k++) steps[k].enter?.();
    setSeg(i); setFrac(0); setPhase("paused");
  }, [steps, reset]);

  const stop = useCallback(() => {
    reset?.(); setPhase("idle"); setSeg(-1); setFrac(0);
  }, [reset]);

  return { phase, seg, frac, progress: overallProgress(steps, seg, frac),
    play, pause, seek, stop, toggle: () => (phase === "playing" ? pause() : play()) };
}
