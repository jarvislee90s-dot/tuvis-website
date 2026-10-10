import { motion } from "framer-motion";

/** 模拟桌面通知：title/body 由调用方传入已翻译文案（i18n 在调用侧）。 */
export function NotificationCard({ title, body, onClick, onClose }: {
  title: string; body: string; onClick: () => void; onClose: () => void;
}) {
  return (
    <motion.div role="button" tabIndex={0} onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      initial={{ opacity: 0, x: 32, scale: 0.96 }} animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 32, scale: 0.96 }} transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="absolute right-4 top-4 z-20 w-64 cursor-pointer rounded-[14px] border border-[#333] bg-[#1A1A1A] p-3 shadow-pop"
      style={{ borderLeft: "2px solid #D97757" }}>
      <div className="flex items-start gap-2.5">
        <img src={`${import.meta.env.BASE_URL}img/appicon-dark.png`} alt="" className="mt-0.5 h-7 w-7 rounded-lg" />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-[#D8D3C8]">{title}</div>
          <div className="mt-0.5 text-[11px] leading-snug text-[#8B857A]">{body}</div>
        </div>
        <button type="button" aria-label="close" onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="-mr-1 -mt-1 px-1 text-[#8B857A] hover:text-[#D8D3C8]">×</button>
      </div>
    </motion.div>
  );
}
