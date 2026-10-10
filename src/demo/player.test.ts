import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScriptPlayer, timeline, overallProgress } from "./player";
import { useDemo } from "./store";
import { d1Steps, d1Reset } from "./steps-d1";
import { d2Steps, d2Reset } from "./steps-d2";
import type { Step } from "./types";

const steps: Step[] = [
  { dur: 100, enter: vi.fn(), label: { zh: "a", en: "a" }, detailKey: "x" },
  { dur: 300, enter: vi.fn(), label: { zh: "b", en: "b" }, detailKey: "x" },
  { dur: 200, enter: vi.fn(), label: { zh: "c", en: "c" }, detailKey: "x" },
];

describe("timeline（纯函数）", () => {
  it("偏移与总时长", () => {
    expect(timeline(steps)).toEqual({ offsets: [0, 100, 400], total: 600 });
  });
  it("整体进度边界", () => {
    expect(overallProgress(steps, -1, 0)).toBe(0);
    expect(overallProgress(steps, 1, 0.5)).toBeCloseTo((100 + 150) / 600);
    expect(overallProgress(steps, 2, 1)).toBe(1);
  });
});

describe("useScriptPlayer v2", () => {
  beforeEach(() => { vi.useFakeTimers(); steps.forEach((s) => vi.mocked(s.enter!).mockClear()); });
  afterEach(() => vi.useRealTimers());

  it("初始 idle：不触发任何 enter（默认不自动演示）", () => {
    renderHook(() => useScriptPlayer(steps));
    expect(steps[0].enter).not.toHaveBeenCalled();
  });
  it("play 从第 0 段起播并随时间推进段落", () => {
    const { result } = renderHook(() => useScriptPlayer(steps));
    act(() => result.current.play());
    expect(steps[0].enter).toHaveBeenCalledTimes(1);
    act(() => { vi.advanceTimersByTime(150); });     // 越过段 0
    expect(steps[1].enter).toHaveBeenCalledTimes(1);
    expect(result.current.seg).toBe(1);
  });
  it("pause 停住，play 从当前位置续播", () => {
    const { result } = renderHook(() => useScriptPlayer(steps));
    act(() => result.current.play());
    act(() => { vi.advanceTimersByTime(150); });
    act(() => result.current.pause());
    const frac = result.current.frac;
    act(() => { vi.advanceTimersByTime(200); });     // 暂停中不走表
    expect(result.current.frac).toBe(frac);
    act(() => result.current.play());
    act(() => { vi.advanceTimersByTime(50); });
    expect(result.current.seg).toBe(1);
  });
  it("seek(i)：reset+重放 enter(0..i) 并处于 paused", () => {
    const reset = vi.fn();
    const { result } = renderHook(() => useScriptPlayer(steps, reset));
    act(() => result.current.seek(2));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(steps[2].enter).toHaveBeenCalledTimes(1);
    expect(result.current.phase).toBe("paused");
    expect(result.current.seg).toBe(2);
    // d1 终态断言：seek(6) 后 toolWin === "zcode"、notify === false、claude === running
    const d1 = renderHook(() => useScriptPlayer(d1Steps, d1Reset));
    act(() => d1.result.current.seek(6));
    const w = useDemo.getState().windows;
    expect(w.toolWin).toBe("zcode");
    expect(w.notify).toBe(false);
    expect(useDemo.getState().sessions.claude.state).toBe("running");
    // d2 终态断言：seek(6) 后 files 开、题卡退出剧本（question null，B28 逐拍聚焦）、messages 含 queued 项
    const d2 = renderHook(() => useScriptPlayer(d2Steps, d2Reset));
    act(() => d2.result.current.seek(6));
    const r = useDemo.getState().remote;
    expect(r.files).toBe(true);
    expect(r.question).toBe(null);
    expect(r.messages.some((m) => m.queued)).toBe(true);
  });
  it("整条播完回绕初始态（reset + idle + 进度归零）", () => {
    const reset = vi.fn();
    const { result } = renderHook(() => useScriptPlayer(steps, reset));
    act(() => result.current.play());
    // 逐拍推进：fake timers 会把整段 advance 批处理进一次渲染（浏览器里每个 interval
    // 回调是独立宏任务，逐 50ms 步进即等价该节奏；一次性 advance 只能前进一段）
    for (let i = 0; i < 14; i++) act(() => { vi.advanceTimersByTime(50); });
    expect(reset).toHaveBeenCalled();
    expect(result.current.phase).toBe("idle");
    expect(result.current.progress).toBe(0);
  });
});
