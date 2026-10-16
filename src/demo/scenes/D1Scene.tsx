import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useDemo, setStateOf } from "../store";
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
                    toast={{ title: "Claude", body: { zh: "tuvis-app · 等待批准", en: "tuvis-app · awaiting approval" } }}
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
