import { useTranslation } from "react-i18next";
import { usePageMeta } from "@/utils/usePageMeta";
import { D1Scene } from "@/demo/scenes/D1Scene";
import { RemoteScene } from "@/demo/scenes/RemoteScene";
import { PetUsageScene } from "@/demo/scenes/PetUsageScene";
import { ResourcesScene } from "@/demo/scenes/ResourcesScene";
import { LedgerSection } from "@/demo/LedgerSection";

export default function DemoPage() {
  const { t } = useTranslation();
  usePageMeta({ title: t("meta.demo.title"), description: t("meta.demo.desc") });
  return (
    /* B21 per-section 容器：<main> 退为 px-5 定位容器；D1 用 7xl，其余区块保持 5xl */
    <main className="px-5 py-14">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">{t("demo.title")}</h1>
        <p className="mt-2 text-inkdim">{t("demo.desc")}</p>
      </div>
      {/* 产品影片：先看 90 秒概览，再往下动手玩交互模拟 */}
      <section className="mx-auto mt-10 max-w-5xl">
        <h2 className="mb-4 text-xl font-semibold">{t("demo.film.title")}</h2>
        <video
          className="w-full rounded-[22px] border border-line bg-paper shadow-soft"
          src="/video/demo-reel-16x9.mp4"
          poster="/video/demo-reel-poster.jpg"
          controls
          preload="none"
          playsInline
        />
        <p className="mt-2 text-xs text-inkdim">{t("demo.film.note")}</p>
      </section>
      <section id="d1" className="mx-auto mt-10 max-w-7xl scroll-mt-20">
        <h2 className="mb-4 text-xl font-semibold">{t("demo.d1")}</h2>
        <D1Scene />
      </section>
      <section id="d2" className="mx-auto mt-10 max-w-5xl scroll-mt-20">
        <h2 className="mb-4 text-xl font-semibold">{t("demo.d2")}</h2>
        <RemoteScene />
      </section>
      <section id="d3" className="mx-auto mt-10 max-w-5xl scroll-mt-20">
        <h2 className="mb-4 text-xl font-semibold">{t("demo.d3")}</h2>
        <ResourcesScene />
      </section>
      <section id="d4" className="mx-auto mt-10 max-w-5xl scroll-mt-20">
        <h2 className="mb-4 text-xl font-semibold">{t("demo.d4")}</h2>
        <PetUsageScene />
      </section>
      <section className="mx-auto mt-10 max-w-5xl">
        <h2 className="mb-4 text-xl font-semibold">{t("usage.title")}</h2>
        <LedgerSection />
      </section>
    </main>
  );
}
