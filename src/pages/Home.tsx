import { Hero } from "@/home/Hero";
import { ProductShowcase } from "@/home/ProductShowcase";
import { CompatMatrix } from "@/home/CompatMatrix";
import { FeaturesSection } from "@/home/FeaturesSection";
import { StoriesSection } from "@/home/StoriesSection";
import { WorkflowCompare } from "@/home/WorkflowCompare";
import { OpenSourceDownload } from "@/home/OpenSourceDownload";

/** 首页 per-section 容器（B21）：七区块统一 7xl 宽幅；顺序按 P13 裁决：
 *  Hero → 产品形态 → 兼容矩阵（独立区块，置于功能四卡与故事卡之前）→ 功能（四卡）→ 你会这样用它 → 没有 vs 有 → 开源+下载合并卡。 */
export default function Home() {
  return (
    <main className="px-5">
      <div className="mx-auto max-w-7xl"><Hero /></div>
      <div className="mx-auto max-w-7xl"><ProductShowcase /></div>
      <div className="mx-auto max-w-7xl"><CompatMatrix /></div>
      <div className="mx-auto max-w-7xl"><FeaturesSection /></div>
      <div className="mx-auto max-w-7xl"><StoriesSection /></div>
      <div className="mx-auto max-w-7xl"><WorkflowCompare /></div>
      <div className="mx-auto max-w-7xl"><OpenSourceDownload /></div>
    </main>
  );
}
