import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useDemo, setStateOf } from "../store";
import type { Bilingual } from "../types";
import { PlayerFrame } from "../PlayerFrame";
import { DesktopStage } from "../DesktopStage";
import { ClaudeTui } from "../ClaudeTui";
import { KimiShellTui } from "../KimiShellTui";
import { OpenCodeTui } from "../OpenCodeTui";
import { CodexAppWindow } from "../CodexAppWindow";
import { WorkBuddyAppWindow } from "../WorkBuddyAppWindow";
import { ZCodeTaskWindow } from "../ZCodeTaskWindow";
import { NotificationCard } from "../NotificationCard";
import { AppBoard } from "../AppBoard";
import { d1Steps, d1Reset } from "../steps-d1";

/** 六窗统一定高（P13 反馈：以 Kimi 窗为基准统一——高的缩略、矮的补全；576px 经浏览器实测=最高两窗自然高，仅 md+ 生效） */

/** 单窗互斥切换的进出过渡（spring：opacity/scale/y） */
const SPRING = {
  initial: { opacity: 0, scale: 0.96, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96 },
  transition: { type: "spring", stiffness: 320, damping: 26 },
} as const;

const closeWin = () => useDemo.getState().setWindows({ toolWin: null });

/** 批次 3 COPY 模式（B3-T8；模板说明见 copy.parity.test.ts 头注释）：
 *  场景内随语言变化的文案收进 COPY.{zh,en}，渲染处按语言取；en 以 `: typeof ZH` 标注互校；
 *  zh 逐字保留现状（红线），en 为产品英文版 UI 口径。
 *  本场景语言相关文案只剩 ClaudeTui 右下 toast 正文一处——通知卡文案与工具卡标签走既有 i18n 键。 */
const ZH = {
  /** ClaudeTui toast 正文（B3-T5 披露的遗留硬编码；契约 = Bilingual，见 ClaudeTui） */
  toastBody: "tuvis-app · 等待批准",
};
const EN: typeof ZH = {
  toastBody: "tuvis-app · awaiting approval",
};
export const COPY = { zh: ZH, en: EN } as const;

/** toast 契约（Bilingual，B3-T8）：zh/en 双支同源 COPY，ClaudeTui 侧按 lang 取（标题为语言无关产品名） */
const TOAST_BODY: Bilingual = { zh: ZH.toastBody, en: EN.toastBody };

export function D1Scene() {
  const { t } = useTranslation();
  const windows = useDemo((s) => s.windows);
  const setWindows = useDemo((s) => s.setWindows);
  const claude = useDemo((s) => s.sessions.claude);

  const openFromNotify = () => {
    setWindows({ notify: false, toolWin: "claude" });
    setStateOf("claude", "running");
  };

  return (
    <PlayerFrame steps={d1Steps} id="d1-player" reset={d1Reset}>
      <DesktopStage className="h-full">
        {/* 左右两窗各约 4:3 双列（决策 6），移动端单列；外层舞台 PlayerFrame 定高内滚防跳动 */}
        <div className="grid items-start gap-6 p-1 md:grid-cols-2">
          <AppBoard />
          {/* 右侧六工具原生窗：单槽互斥切换（AnimatePresence mode="wait"），统一定高（P13，576=最高窗 WorkBuddy/ZCode 自然高；Kimi 等矮窗补全），红绿灯关窗 */}
          <div className="flex flex-col gap-3 md:h-[576px]">
            <AnimatePresence mode="wait">
              {windows.toolWin === "claude" && (
                <motion.div key="claude" {...SPRING} className="h-full">
                  <ClaudeTui mode="session" className="h-full" waiting={claude.state === "waiting"}
                    toast={{ title: "Claude", body: TOAST_BODY }}
                    onClose={closeWin} />
                </motion.div>
              )}
              {windows.toolWin === "codex" && (
                <motion.div key="codex" {...SPRING} className="h-full">
                  <CodexAppWindow className="h-full" onClose={closeWin} />
                </motion.div>
              )}
              {windows.toolWin === "opencode" && (
                <motion.div key="opencode" {...SPRING} className="h-full">
                  <OpenCodeTui className="h-full" onClose={closeWin} />
                </motion.div>
              )}
              {windows.toolWin === "kimi" && (
                <motion.div key="kimi" {...SPRING} className="h-full">
                  <KimiShellTui className="h-full" onClose={closeWin} />
                </motion.div>
              )}
              {windows.toolWin === "workbuddy" && (
                <motion.div key="workbuddy" {...SPRING} className="h-full">
                  <WorkBuddyAppWindow className="h-full" onClose={closeWin} />
                </motion.div>
              )}
              {windows.toolWin === "zcode" && (
                <motion.div key="zcode" {...SPRING} className="h-full">
                  <ZCodeTaskWindow className="h-full" onClose={closeWin} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <AnimatePresence>
          {windows.notify && (
            <NotificationCard title={t("demo.notify.title")} body={t("demo.notify.body")}
              onClick={openFromNotify} onClose={() => setWindows({ notify: false })} />
          )}
        </AnimatePresence>
      </DesktopStage>
    </PlayerFrame>
  );
}
