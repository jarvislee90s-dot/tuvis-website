import { useTranslation } from "react-i18next";
import { Reveal } from "@/components/Reveal";
import { useLang } from "@/i18n/useLang";
import changelog from "@/content/changelog.json";

/** 首页 Hero 单排（P13：看板+手机第二排迁出至「产品形态」区）：左 2/3 文案列（列内稍居中——
 *  徽章/大标题/slogan/描述/双 CTA/三色小灯行）+ 右 1/3 hero-poster 完整海报。
 *  徽章版本号动态取自同步产物 changelog.json 最新版本（构建时对齐 tuvis 主仓）。 */
export function Hero() {
  const { t } = useTranslation();
  const lang = useLang();
  return (
    <Reveal>
      <section className="py-14 md:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* 文案块：在左 2/3 列内稍居中（P13 反馈「靠右一点点，稍微居中」） */}
          <div className="max-w-xl lg:mx-auto">
            <span className="inline-block rounded-full border border-line px-3.5 py-1 text-[13px] text-hud">
              v{changelog[0]?.version ?? "0.0.0"} · {t("hero.badgeTag")}
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">
              {/* D1 品牌词单值：zh hero.title=「兔维斯」+ 次级色 Tuvis 尾巴（改前形态）；en hero.title 已含
                  Tuvis（D1 裁决 en 只显 Tuvis），再补尾巴会成「Tuvis Tuvis」——en 不渲染尾巴。hero.title
                  键仍服务下方海报 alt，不动 i18n。 */}
              {t("hero.title")}
              {lang === "zh" && <>{" "}<span className="text-inkdim">Tuvis</span></>}
            </h1>
            <p className="mt-3 text-xl font-semibold text-ok">{t("hero.subtitle")}</p>
            <p className="mt-3 max-w-lg text-inkdim">{t("hero.desc")}</p>
            <div className="mt-6 flex gap-3">
              <a href="#download" onClick={(e) => { e.preventDefault(); document.getElementById("download")?.scrollIntoView({ behavior: "smooth" }); }}
                className="rounded-[14px] bg-btnp px-5 py-2.5 font-semibold text-btnpt">{t("hero.cta")}</a>
              <a href="https://github.com/jarvislee90s-dot/tuvis" target="_blank" rel="noopener noreferrer"
                className="rounded-[14px] border border-line px-5 py-2.5 font-semibold hover:border-hud">{t("hero.github")}</a>
            </div>
            {/* 三色小灯行（替代原状态三灯区）：hero.lamps 按 " · " 拆三段，色点顺序固定红/黄/绿 */}
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-inkdim">
              {t("hero.lamps").split(" · ").map((label, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${["bg-red-500", "bg-yellow-500", "bg-green-500"][i]}`} />
                  {label}
                </span>
              ))}
            </div>
          </div>
          <img src="img/hero-poster.png" alt={t("hero.title")}
            className="w-full rounded-[26px] border border-line shadow-soft"
            loading="eager" decoding="async" />
        </div>
      </section>
    </Reveal>
  );
}
