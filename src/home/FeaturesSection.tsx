import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Reveal } from "@/components/Reveal";
import { SectionTitle } from "@/components/SectionTitle";

/** 四大功能卡（P13 自 StoriesSection 拆出）：features.* key 复用，整卡可点链 demo#d1–d4；承接 id="features"（TopBar「功能」锚点）。 */
const GAUGES = [
  { icon: "📋", t: "features.board", d: "features.board.desc", to: "d1" },
  { icon: "🛰️", t: "features.remote", d: "features.remote.desc", to: "d2" },
  { icon: "🧩", t: "features.res", d: "features.res.desc", to: "d3" },
  { icon: "🦊", t: "features.pet", d: "features.pet.desc", to: "d4" },
] as const;

export function FeaturesSection() {
  const { t } = useTranslation();
  return (
    <Reveal>
      <section id="features" className="scroll-mt-20 py-16">
        <SectionTitle tKey="features.title" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GAUGES.map((g) => (
            <Link to={`demo#${g.to}`} key={g.to}
              className="group rounded-[14px] border border-line bg-card p-5 transition hover:-translate-y-0.5 hover:border-hud/50 hover:shadow-soft">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-hud/10 text-xl">{g.icon}</div>
              <h3 className="mt-3 font-semibold">{t(g.t)}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-inkdim">{t(g.d)}</p>
              <span className="mt-3 inline-block text-xs text-hud group-hover:underline">{t("features.watch")} →</span>
            </Link>
          ))}
        </div>
      </section>
    </Reveal>
  );
}
