import { useTranslation } from "react-i18next";
import { Reveal } from "@/components/Reveal";
import { AboutWindow } from "@/home/AboutWindow";
import { detectOS, matchAsset, type OS } from "@/utils/download";

/** 开源理念 + 免费下载合并卡（P13 反馈：两区合并为一张卡，id=download 保留锚点）。
 *  P14：左半加「关于」仿真窗（对照 CC Switch 关于页）——应用卡/链接行/★求 Star 横幅（可关）；
 *  右半下载（平台检测直链 + Releases 兜底，红线：API 失败回退 LATEST）。 */
const REPO = "https://github.com/jarvislee90s-dot/tuvis";
const LATEST = `${REPO}/releases/latest`;
const API = "https://api.github.com/repos/jarvislee90s-dot/tuvis/releases/latest";

async function goToInstaller(os: OS): Promise<void> {
  try {
    const res = await fetch(API, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { assets: { name: string; browser_download_url: string }[] };
    const url = matchAsset(
      data.assets.map((a) => ({ name: a.name, url: a.browser_download_url })),
      os,
    );
    if (!url) throw new Error("asset not found");
    location.href = url;
  } catch {
    window.open(LATEST, "_blank", "noopener");
  }
}

export function OpenSourceDownload() {
  const { t } = useTranslation();
  const os: OS = detectOS();
  return (
    <Reveal>
      <section id="download" className="scroll-mt-20 py-16">
        <div className="grid gap-10 rounded-[26px] border border-line bg-card p-8 md:grid-cols-2 md:gap-12 md:p-10">
          {/* 左半：开源 · 本地优先 · 无遥测 + 「关于」仿真窗（求 Star 横幅在窗内） */}
          <div className="flex flex-col items-start justify-center">
            <h2 className="text-2xl font-bold">{t("oss.title")}</h2>
            <p className="mt-2 text-sm text-inkdim">{t("oss.desc")}</p>
            <AboutWindow className="mt-5 w-full" />
          </div>
          {/* 右半：免费下载（平台检测：匹配系统的按钮高亮；P15 删除「↓ 系统」残留小字） */}
          <div className="flex flex-col items-start justify-center md:border-l md:border-line md:pl-12">
            <h2 className="text-2xl font-bold">{t("dl.title")}</h2>
            <p className="mt-2 text-sm text-inkdim">{t("dl.desc")}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => goToInstaller("windows")}
                className={`rounded-[14px] bg-btnp px-5 py-2.5 font-semibold text-btnpt transition ${os === "windows" ? "ring-2 ring-hud ring-offset-2 ring-offset-card" : ""}`}>
                {t("dl.win")}{os === "windows" && <span className="ml-1.5 text-[10px] font-normal opacity-80">{t("dl.currentOs")}</span>}
              </button>
              <button onClick={() => goToInstaller("macos")}
                className={`rounded-[14px] bg-btnp px-5 py-2.5 font-semibold text-btnpt transition ${os === "macos" ? "ring-2 ring-hud ring-offset-2 ring-offset-card" : ""}`}>
                {t("dl.mac")}{os === "macos" && <span className="ml-1.5 text-[10px] font-normal opacity-80">{t("dl.currentOs")}</span>}
              </button>
              <a href={LATEST} target="_blank" rel="noopener noreferrer"
                className="rounded-[14px] border border-line px-5 py-2.5 font-semibold hover:border-hud">{t("dl.all")}</a>
            </div>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
