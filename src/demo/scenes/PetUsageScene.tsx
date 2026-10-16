import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLang } from "@/i18n/useLang";
import { useDemo } from "../store";
import { formatUnits } from "../ledgerData";
import { CloseIcon } from "../../components/Icons";
import { PlayerFrame } from "../PlayerFrame";
import { DesktopStage } from "../DesktopStage";
import { NotificationCard } from "../NotificationCard";
import { frameStyle, PETS, ANIM, type PetAnim, type PetId } from "../petAnimations";
import { SwitchPetDialog, ImportPetDialog, type SwitchPetEntry } from "../PetDialogs";
import { d4Steps, d4Reset } from "../steps-d4";

/** 在线仓库行：真实素材宠物缩略（P18：不再做 filter 换色假条目）+ 名字 + 导入态 ✓ */
function PetRepoRow({ pet, label, ok }: {
  pet: PetId; label: string; ok: boolean;
}) {
  return (
    <li className="flex items-center gap-2">
      <span className="overflow-hidden rounded-md border border-app-line" aria-hidden="true">
        <span className="block" style={frameStyle("idle", 0, 0.12, pet)} />
      </span>
      <span className={`truncate text-[11px] ${ok ? "font-medium text-app-ink" : "text-app-mut"}`}>{label}</span>
      {ok && <span className="ml-auto text-[10px] font-semibold text-ok" aria-hidden="true">✓</span>}
    </li>
  );
}

/** token 详情浮窗数值（对照 pet-window.png 真机；语言无关纯数字，渲染经 formatUnits(v, lang) 出本语言单位：
 *  zh 亿/万、en K/M/B——原「1.76亿」这类中文单位整句已拆为数字 + COPY 模板，插值见 fill） */
const USAGE = {
  reqInput: 176_000_000,      // 1.76亿 / 176.00 M
  cacheHit: 170_000_000,      // 1.70亿 / 170.00 M
  output: 1_351_800,          // 135.18万 / 1.35 M（en 判档按绝对值：≥1e6 落 M）
  toolZCode: 175_000_000,     // 1.75亿 / 175.00 M
  toolCodex: 717_100,         // 71.71万 / 717.10 K
  sessionZCode: 43_049_800,   // 4304.98万 / 43.05 M
} as const;

/** 批次 3 COPY 模式（B3-T8；模板说明见 copy.parity.test.ts 头注释）：
 *  场景内随语言变化的文案收进 COPY.{zh,en}，渲染处按语言取；en 以 `: typeof ZH` 标注互校；
 *  zh 逐字保留现状（红线），en 为产品英文版 UI 口径。
 *  语言无关项不入 COPY：宠物名/卡片标签/菜单/双弹窗走既有 i18n 键 pet.*；截断号按各自排版惯例
 *  （zh 「…」 / en "..."，parity ②b 禁 en 用省略号）；命中率 97.0% 为现状字面量（不从数值重算）。 */
const ZH = {
  /** 头顶常驻卡 1（ZCode Bondtoolbox 扫描任务）：标题 / 两种状态 / 次行结果 */
  scanTitle: "ZCode Bondtoolbox 扫描 E:\\LLMproject 下 G…",
  scanRunning: "运行中",
  scanWaiting: "等待操作",
  scanResult: "qwen-code 清理完成：已释放约 0.5 GB…",
  /** 头顶常驻卡 2（Kimi Code 消息 + 状态） */
  kimiTitle: "Kimi Code zh 你好",
  kimiDone: "已完成",
  /** token 详情浮窗四行（{{名}} = formatUnits(v, lang) 插值；术语对齐 i18n usage.metric.*） */
  usageReq: "请求输入 {{v}} · 命中率 97.0%",
  usageCache: "缓存命中 {{cache}} · 产出 {{output}}",
  usageByTool: "按工具 请求输入：ZCode {{zcode}} · Codex {{codex}} · Kim…",
  usageSession: "本会话 ZCode {{v}} · 无标题",
};
const EN: typeof ZH = {
  scanTitle: "ZCode Bondtoolbox scanning E:\\LLMproject for G...",
  scanRunning: "Running",
  scanWaiting: "Waiting for input",
  scanResult: "qwen-code cleanup complete: freed ~0.5 GB...",
  kimiTitle: "Kimi Code en Hello",
  kimiDone: "Done",
  usageReq: "Request input {{v}} · hit rate 97.0%",
  usageCache: "Cache hits {{cache}} · output {{output}}",
  usageByTool: "Request input by tool: ZCode {{zcode}} · Codex {{codex}} · Kim...",
  usageSession: "This session ZCode {{v}} · Untitled",
};
export const COPY = { zh: ZH, en: EN } as const;

/** COPY 模板插值（{{key}} → 值）：数字整句的数值由调用方先经 formatUnits(v, lang) 本地化 */
function fill(tpl: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{{${k}}}`, v), tpl);
}

export function PetUsageScene() {
  const { t } = useTranslation();
  /* 双机制说明：i18n 的 t 管窗内控件（既有 pet.* 键），COPY（取 copy）管仿真通知卡与 token 浮窗内文（B3-T8） */
  const lang = useLang();
  const copy = COPY[lang];
  const petRun = useDemo((s) => s.petRun);
  const setPetRun = useDemo((s) => s.setPetRun);
  const [pet, setPet] = useState<PetId>("bell");
  const [anim, setAnim] = useState<PetAnim>("idle");
  const frame = useRef(0);
  const [, tick] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState(false);
  const [hover, setHover] = useState(false);
  const [voiceSrc, setVoiceSrc] = useState<string | null>(null);
  const lastDir = useRef<-1 | 0 | 1>(0);
  // T37.1 场景级三控件：右键菜单 / 浮动面板 / 左侧「编辑行为」卡三方共享同一组 state
  const [freq, setFreq] = useState(1);         // 动作频率倍率 0.5–2（即时生效于待机帧间隔）
  const [voice, setVoice] = useState(true);    // 语音开关（叠加 PETS[pet].voice 既有门控）
  const [pinned, setPinned] = useState(true);  // 置顶开关（光环视觉）
  const [panel, setPanel] = useState(false);   // 编辑行为浮动面板
  const [fed, setFed] = useState(false);       // 喂食迷你卡
  const [hidden, setHidden] = useState(false); // 隐藏桌宠（「唤出桌宠」恢复）
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  // T44 双弹窗 + 模拟活跃宠物条目（点卡仅移动高亮 = 模拟切换；真切换仍走头像 chips）
  const [switchOpen, setSwitchOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [activeEntry, setActiveEntry] = useState("foxbell");
  const [importedEntries, setImportedEntries] = useState<SwitchPetEntry[]>([]);
  // T44 头顶常驻消息卡 × 关闭态（常驻 = 不随剧本进出，关闭后保持隐藏）
  const [showMsg1, setShowMsg1] = useState(true);
  const [showMsg2, setShowMsg2] = useState(true);
  // P13：消息卡 1 状态（false=运行中黄 / true=等待操作红，剧本步 3 联动）+ token 浮窗剧本强制显隐
  const [msg1Alert, setMsg1Alert] = useState(false);
  const [scriptHover, setScriptHover] = useState(false);

  /* P19 剧本通道："tuvis-d4" CustomEvent → 绝对状态（seek 幂等）；浮窗互斥——开启下一个前先关上一个 */
  useEffect(() => {
    const onEvt = (e: Event) => {
      const action = (e as CustomEvent).detail as string;
      if (action === "reset") {
        setMsg1Alert(false); setScriptHover(false); setImportOpen(false); setSwitchOpen(false);
      } else if (action === "import") {
        setImportOpen(true); setSwitchOpen(false); setScriptHover(false);
      } else if (action === "switch") {
        setSwitchOpen(true); setImportOpen(false); setScriptHover(false);
      } else if (action === "approval") {
        setMsg1Alert(true);
      } else if (action === "token") {
        setScriptHover(true); setImportOpen(false); setSwitchOpen(false);
      }
    };
    window.addEventListener("tuvis-d4", onEvt);
    return () => window.removeEventListener("tuvis-d4", onEvt);
  }, []);

  useEffect(() => { frame.current = 0; }, [anim]);
  useEffect(() => {
    // 拖动中不停表：跑动帧按 120ms×freq 节拍自然快放（Step 32.2；T37.1 频率即时生效）
    const def = ANIM[anim].d;
    const t = setTimeout(() => { frame.current = (frame.current + 1) % def.length; tick((n) => n + 1); }, def[frame.current] * freq);
    return () => clearTimeout(t);
  }, [frame.current, anim, freq]);

  // 右键/按钮菜单：Esc 关闭（TuiShell 菜单模式）
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  /** 拖动方向感知（Codex Pet/shimeji 机制）：水平位移 ≥2px 且方向变化才切跑动行，避免每帧 setState */
  function dragRun(dx: number) {
    if (Math.abs(dx) < 2) return;
    const dir = dx > 0 ? 1 : -1;
    if (dir === lastDir.current) return;
    lastDir.current = dir;
    setAnim(dir > 0 ? "run-right" : "run-left");
  }

  function dragStop() {
    setDrag(false);
    lastDir.current = 0;
    setAnim((a) => (a === "run-right" || a === "run-left" ? "idle" : a));
  }

  function fire(kind: "approval" | "done") {
    setPetRun({ card: kind, notify: true });
    setAnim(kind === "approval" ? "waiting" : "jumping");
    // 语音门控（B10）：仅贝贝带语音 × T37 语音开关放行，Starry Dew 静音上场
    if (PETS[pet].voice && voice) setVoiceSrc(kind === "approval" ? "approval-chicken.m4a" : "done-success.m4a");
    window.setTimeout(() => { if (kind === "done") setAnim("idle"); }, 2600);
  }

  /** 喂食（T37.1）：跳跃 2.6s + 头顶迷你卡；期间若切走动作则不强行拉回 */
  function feed() {
    setAnim("jumping");
    setFed(true);
    window.setTimeout(() => {
      setFed(false);
      setAnim((a) => (a === "jumping" ? "idle" : a));
    }, 2600);
  }

  /** T44+P18 切换网格条目：只收真实素材——贝贝/Starry Dew 两只真宠物 + petdex 导入条目（emoji 占位，不做 CSS 换色假宠物） */
  const switchEntries: SwitchPetEntry[] = [
    { id: "foxbell", label: t("pet.bell"), sprite: "bell", version: "v2", builtin: true },
    { id: "starry", label: t("pet.starry"), sprite: "starry", version: "v2" },
    ...importedEntries,
  ];

  /** T44 petdex 模拟导入完成 → 新条目加入切换列表（emoji 占位；重复导入去重） */
  function onPetdexImported() {
    setImportedEntries((prev) => prev.some((e) => e.id === "capvolt") ? prev : [
      ...prev,
      { id: "capvolt", label: "Capvolt", emoji: "⚡", version: "v1" },
    ]);
  }

  function openMenuAt(x: number, y: number) {
    setMenu({ x: Math.min(x, window.innerWidth - 150), y: Math.min(y, window.innerHeight - 140) });
  }

  const triggerBtn = "rounded-lg border border-app-line px-3 py-1 text-xs text-app-ink hover:bg-app-accent/50";
  const petChip = (active: boolean) =>
    `flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition ${
      active ? "border-app-btnp bg-app-accent/50 font-semibold text-app-ink"
             : "border-app-line bg-app-bg font-medium text-app-mut hover:bg-app-accent/50 hover:text-app-ink"}`;
  const menuItem = "block w-full px-3 py-1.5 text-left hover:bg-app-accent/50";
  const cardCls = "rounded-[14px] border border-app-line bg-app-bg p-3";
  // 频率滑杆 / 语音+置顶 chips：左侧卡与浮动面板同一份 JSX（同源 state，天然联动）
  const freqCtrl = (
    <label className="mt-2 block text-[11px] text-app-mut">
      <span className="flex items-center justify-between">
        {t("pet.behavior.freq")}
        <span className="font-mono text-app-ink">×{Number(freq.toFixed(1))}</span>
      </span>
      <input type="range" min="0.5" max="2" step="0.1" value={freq}
        onChange={(e) => setFreq(Number(e.target.value))}
        aria-label={t("pet.behavior.freq")}
        className="mt-1 w-full accent-app-btnp" />
    </label>
  );
  const voicePinCtrl = (
    <div className="mt-2 flex gap-2">
      <button onClick={() => setVoice((v) => !v)} aria-pressed={voice} className={petChip(voice)}>{t("pet.behavior.voice")}</button>
      <button onClick={() => setPinned((p) => !p)} aria-pressed={pinned} className={petChip(pinned)}>{t("pet.behavior.pin")}</button>
    </div>
  );

  return (
    <PlayerFrame steps={d4Steps} id="d4-player" reset={d4Reset}>
      <DesktopStage className="min-h-64">
        <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
          {/* 左列：两张常驻功能卡（T37.3，375px 折叠为上卡下舞台） */}
          <div className="flex flex-col gap-3">
            {/* 卡 1：在线仓库（P18：只列真实素材宠物，不做换色假宠物；「导入宠物」开 petdex 弹窗） */}
            <div className={cardCls}>
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-app-ink">{t("pet.repo.title")}</div>
                <button type="button" onClick={() => { setImportOpen(true); setSwitchOpen(false); }}
                  className="shrink-0 text-[10px] text-app-mut transition hover:text-app-ink hover:underline">
                  {t("pet.import.title")}
                </button>
              </div>
              <p className="mt-0.5 text-[10px] text-app-mut">{t("pet.repo.desc")}</p>
              <ul className="mt-2 space-y-1.5">
                <PetRepoRow pet="bell" label={t("pet.bell")} ok />
                <PetRepoRow pet="starry" label={t("pet.starry")} ok />
              </ul>
            </div>
            {/* 卡 2：编辑行为（三控件常驻版 + 语音绑定摘要行） */}
            <div className={cardCls}>
              <div className="text-xs font-semibold text-app-ink">{t("pet.behavior.title")}</div>
              {freqCtrl}
              {voicePinCtrl}
              <p className="mt-2 text-[10px] text-app-mut" aria-live="polite">
                {voice && PETS[pet].voice ? "♪" : "🔇"} {t(PETS[pet].labelKey)}
              </p>
            </div>
          </div>
          {/* 右列：宠物切换行 + 触发排 */}
          <div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PETS) as PetId[]).map((p) => (
                <button key={p} onClick={() => setPet(p)} aria-pressed={pet === p} className={petChip(pet === p)}>
                  <span className="overflow-hidden rounded-full" aria-hidden="true">
                    <span className="block" style={frameStyle("idle", 0, 0.15, p)} />
                  </span>
                  {t(PETS[p].labelKey)}
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => { if (hidden) { setHidden(false); setAnim("idle"); } else setAnim(anim === "idle" ? "waving" : "idle"); }}
                className={`${triggerBtn} ${hidden ? "border-app-btnp bg-app-accent/50 font-semibold" : ""}`}
              >{t("pet.call")}</button>
              <button onClick={() => fire("approval")} className={triggerBtn}>{t("pet.trigger.approval")}</button>
              <button onClick={() => fire("done")} className={triggerBtn}>{t("pet.trigger.done")}</button>
              <button onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); openMenuAt(r.left, r.bottom + 4); }}
                aria-haspopup="menu" className={triggerBtn}>{t("pet.menu.open")}</button>
            </div>
          </div>
        </div>

        {/* 玻璃桌宠：可拖拽；hidden 时不渲染，既有「唤出桌宠」兼作恢复入口（T37.4） */}
        {!hidden && (
          <div
            className={`absolute bottom-16 right-10 cursor-grab select-none active:cursor-grabbing ${pinned ? "ring-2 ring-app-btnp/40 shadow-pop" : ""}`}
            style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, transition: drag ? "none" : "transform .25s", touchAction: "none" }}
            onPointerDown={(e) => { if (e.button !== 0) return; setDrag(true); lastDir.current = 0; (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
            onPointerMove={(e) => {
              if (!drag) return;
              setPos((p) => ({ x: p.x + e.movementX, y: p.y + e.movementY }));
              dragRun(e.movementX);
            }}
            onPointerUp={dragStop}
            onPointerCancel={dragStop}
            onPointerEnter={() => setHover(true)}
            onPointerLeave={() => setHover(false)}
            onContextMenu={(e) => { e.preventDefault(); openMenuAt(e.clientX, e.clientY); }}
          >
            <div style={frameStyle(anim, frame.current, 0.6, pet)} />
            {/* P13 头顶卡组（对照 pet-window.png 真机）：两张常驻消息卡（×可关；卡 1 黄=运行中 → 红=等待操作，剧本步 3 联动）；
                token 详情浮窗不再是常驻卡——只在鼠标悬浮宠物或剧本步 4 时出现（玲娜贝儿「用量」浮窗机制） */}
            <div className="pointer-events-none absolute bottom-full left-1/2 mb-1 w-56 -translate-x-1/2 space-y-1.5">
              {showMsg1 && (
                <div className="pointer-events-auto relative rounded-xl border border-app-line bg-app-bg px-2.5 py-1.5 shadow-soft">
                  <button type="button" onClick={() => setShowMsg1(false)} aria-label={t("usage.win.close")}
                    className="absolute right-1 top-1 rounded p-0.5 text-app-mut hover:bg-app-accent/50 hover:text-app-ink">
                    <CloseIcon size={10} />
                  </button>
                  <div className="flex items-center gap-1.5 pr-4">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${msg1Alert ? "animate-pulse bg-red-600" : "bg-yellow-500"}`} aria-hidden="true" />
                    <span className="truncate text-[10px] leading-tight text-app-ink">{copy.scanTitle}</span>
                  </div>
                  <div className={`text-[10px] leading-tight ${msg1Alert ? "text-red-600" : "text-yellow-800"}`}>
                    {msg1Alert ? copy.scanWaiting : copy.scanRunning}
                  </div>
                  <div className="truncate text-[10px] leading-tight text-app-mut">
                    <span className="font-semibold text-green-600">✓</span> {copy.scanResult}
                  </div>
                </div>
              )}
              {showMsg2 && (
                <div className="pointer-events-auto relative rounded-xl border border-app-line bg-app-bg px-2.5 py-1.5 shadow-soft">
                  <button type="button" onClick={() => setShowMsg2(false)} aria-label={t("usage.win.close")}
                    className="absolute right-1 top-1 rounded p-0.5 text-app-mut hover:bg-app-accent/50 hover:text-app-ink">
                    <CloseIcon size={10} />
                  </button>
                  <div className="flex items-center gap-1.5 pr-4">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-600" aria-hidden="true" />
                    <span className="truncate text-[10px] leading-tight text-app-ink">{copy.kimiTitle}</span>
                  </div>
                  <div className="text-[10px] leading-tight text-app-mut">{copy.kimiDone}</div>
                </div>
              )}
            </div>
            {/* 头顶状态卡 */}
            <AnimatePresence>
              {petRun.card && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className={`absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[14px] px-3 py-1.5 text-[11px] font-semibold ${petRun.card === "approval" ? "bg-bdg-r text-bdg-r-t" : "bg-bdg-g text-bdg-g-t"}`}>
                  {t(petRun.card === "approval" ? "pet.card.approval" : "pet.card.done")}
                </motion.div>
              )}
            </AnimatePresence>
            {/* 喂食迷你卡（T37.1，复用状态卡动效样式） */}
            <AnimatePresence>
              {fed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[14px] bg-bdg-g px-3 py-1.5 text-[11px] font-semibold text-bdg-g-t">
                  {t("pet.fed")}
                </motion.div>
              )}
            </AnimatePresence>
            {/* token 详情浮窗（P13：悬浮或剧本步 4 才出现；四行格式对照 pet-window.png 真机） */}
            {(hover || scriptHover) && (
              <div className="absolute -top-2 left-full ml-2 w-56 rounded-[14px] border border-app-line bg-app-bg px-2.5 py-2 shadow-soft">
                <div className="text-[10px] font-semibold leading-tight text-app-ink">{fill(copy.usageReq, { v: formatUnits(USAGE.reqInput, lang) })}</div>
                <div className="text-[10px] leading-tight text-app-mut">{fill(copy.usageCache, { cache: formatUnits(USAGE.cacheHit, lang), output: formatUnits(USAGE.output, lang) })}</div>
                <div className="truncate text-[10px] leading-tight text-app-mut">{fill(copy.usageByTool, { zcode: formatUnits(USAGE.toolZCode, lang), codex: formatUnits(USAGE.toolCodex, lang) })}</div>
                <div className="truncate text-[10px] leading-tight text-app-mut">{fill(copy.usageSession, { v: formatUnits(USAGE.sessionZCode, lang) })}</div>
                <button className="ml-auto mt-0.5 block text-[10px] text-app-mut hover:text-app-ink hover:underline"
                  onClick={() => document.getElementById("ledger")?.scrollIntoView({ behavior: "smooth" })}>{t("pet.detail")} »</button>
              </div>
            )}
            {/* 编辑行为浮动面板（T37.2，同 hover 浮窗样式；阻断冒泡避免误触发拖拽） */}
            {panel && (
              <div onPointerDown={(e) => e.stopPropagation()}
                className="absolute bottom-full left-1/2 mb-2 w-44 -translate-x-1/2 rounded-[14px] border border-app-line bg-app-bg p-3 shadow-soft">
                <div className="text-xs font-semibold text-app-ink">{t("pet.behavior.title")}</div>
                {freqCtrl}
                {voicePinCtrl}
              </div>
            )}
          </div>
        )}

        {/* 右键/按钮菜单（TuiShell 菜单模式：点外 / Esc 关闭，点击项即关闭 = 模拟生效） */}
        {menu && (
          <>
            <div className="fixed inset-0 z-40" onPointerDown={() => setMenu(null)}
              onContextMenu={(e) => { e.preventDefault(); setMenu(null); }} />
            <div role="menu" aria-label={t("pet.menu.open")}
              className="fixed z-50 min-w-[128px] rounded-md border border-app-line bg-app-bg py-1 text-xs text-app-ink shadow-pop"
              style={{ left: menu.x, top: menu.y }}>
              <button type="button" role="menuitem" className={menuItem}
                onClick={() => { setMenu(null); feed(); }}>{t("pet.menu.feed")}</button>
              <button type="button" role="menuitem" className={menuItem}
                onClick={() => { setMenu(null); setPanel((v) => !v); }}>{t("pet.menu.behavior")}</button>
              <button type="button" role="menuitem" className={menuItem}
                onClick={() => { setMenu(null); setImportOpen(false); setSwitchOpen(true); }}>{t("pet.menu.switch")}</button>
              <button type="button" role="menuitem" className={menuItem}
                onClick={() => { setMenu(null); setPanel(false); setHidden(true); }}>{t("pet.menu.hide")}</button>
            </div>
          </>
        )}

        {/* T44 双弹窗：切换宠物（网格卡）/ 导入宠物（三 tab，petdex 默认选中） */}
        <SwitchPetDialog open={switchOpen} onClose={() => setSwitchOpen(false)}
          entries={switchEntries} activeId={activeEntry} onPick={setActiveEntry} />
        <ImportPetDialog open={importOpen} onClose={() => setImportOpen(false)} onImported={onPetdexImported} />

        {/* 通知卡 */}
        <AnimatePresence>
          {petRun.notify && petRun.card && (
            <NotificationCard
              title={t(petRun.card === "approval" ? "pet.trigger.approval" : "pet.trigger.done")}
              body={t(petRun.card === "approval" ? "pet.card.approval" : "pet.card.done")}
              onClick={() => setPetRun({ notify: false })}
              onClose={() => setPetRun({ notify: false })}
            />
          )}
        </AnimatePresence>
        {voiceSrc && (
          <audio key={voiceSrc} autoPlay src={`${import.meta.env.BASE_URL}pet/voice/${voiceSrc}`} onEnded={() => setVoiceSrc(null)} />
        )}
      </DesktopStage>
    </PlayerFrame>
  );
}
