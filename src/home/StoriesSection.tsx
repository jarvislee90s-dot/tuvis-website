import { useTranslation } from "react-i18next";
import { Reveal } from "@/components/Reveal";
import { SectionTitle } from "@/components/SectionTitle";

/** 三故事卡「你会这样用它」（P13：自 StoriesSection 拆出独立成区，移到对比区上方；
 *  「使用场景示意，非用户证言」注释行按用户 2026-10-12 裁决移除）。 */
const STORIES = [
  { icon: "🌙", t: "stories.night", d: "stories.night.desc" },
  { icon: "🚇", t: "stories.out", d: "stories.out.desc" },
  { icon: "📊", t: "stories.billing", d: "stories.billing.desc" },
] as const;

export function StoriesSection() {
  const { t } = useTranslation();
  return (
    <Reveal>
      <section className="py-16">
        <SectionTitle tKey="stories.title" />
        <div className="grid gap-5 md:grid-cols-3">
          {STORIES.map((s) => (
            <div key={s.t} className="rounded-[14px] border border-line bg-card p-6">
              <div className="text-2xl">{s.icon}</div>
              <h3 className="mt-3 font-semibold">{t(s.t)}</h3>
              <p className="mt-2 text-sm text-inkdim">{t(s.d)}</p>
            </div>
          ))}
        </div>
      </section>
    </Reveal>
  );
}
