import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Reveal } from "@/components/Reveal";
import { SectionTitle } from "@/components/SectionTitle";
import { useLang } from "@/i18n/useLang";
import { DesktopStage } from "@/demo/DesktopStage";
import { AppBoard } from "@/demo/AppBoard";
import { PhoneFrame } from "@/demo/PhoneFrame";
import { RemoteBoard } from "@/demo/remote/RemoteBoard";

/** 产品形态独立单元（P13 新区块，TopBar「产品形态」锚点 id=product）：
 *  左 2/3 = 桌面看板 4 行 2 列静态窗（7 会话 + 1 空位，纯留空）；右 1/3 = 手机远程窗
 *  （固定宽 340px、屏幕比例 163.4:78.0，大小不随筛选/内容变化；点卡跳 /:lang/demo#d2）。
 *  下方 DuoUnfold 块：iframe 嵌 /duo/（public/duo/index.html，源文件
 *  docs/design/duo-unfold-lab-frame-study.html 的逐字节副本），embed 模式静态展示 +
 *  进度条交互 + 播放；高度按各断点最大内容宽实测（iframe 宽 ≈ 视口-40，
 *  内容高 430→474、639→613、727→690、983→864、1024→871），宁可留白不裁切。 */
export function ProductShowcase() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // 语言走 useLang（en* → en，其余 → zh）；原 lang ?? "zh" 裸参兜底删除（非法值不再拼进链接）
  const lang = useLang();
  const goDemoD2 = () => navigate(`/${lang}/demo#d2`);
  return (
    <Reveal>
      <section id="product" className="scroll-mt-20 py-16">
        <SectionTitle tKey="product.title" />
        <p className="-mt-6 mb-8 text-center text-xs text-inkdim">{t("product.desc")}</p>
        <div className="grid items-stretch gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="flex flex-col">
            <DesktopStage className="flex-1">
              <AppBoard interactive={false} columns={2} className="h-full" />
            </DesktopStage>
            <p className="mt-6 text-center">
              <Link
                to="demo"
                className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-6 py-2.5 text-base font-semibold text-hud shadow-soft transition hover:-translate-y-0.5 hover:border-hud/50"
              >
                {t("demo.open")} →
              </Link>
            </p>
          </div>
          <div className="flex items-start justify-center lg:justify-start">
            <PhoneFrame maxWidth="max-w-[340px]">
              <RemoteBoard onOpenDetail={goDemoD2} />
            </PhoneFrame>
          </div>
        </div>
        <div className="mt-14">
          <h3 className="text-center text-xl font-bold tracking-tight md:text-2xl">{t("product.duoHeading")}</h3>
          <iframe
            title={t("product.duoFrameTitle")}
            src={`/duo/index.html?embed=1&lang=${lang}`}
            loading="lazy"
            className="mx-auto mt-8 block h-[620px] w-full max-w-5xl rounded-[34px] border border-line bg-card sm:h-[700px] md:h-[875px] lg:h-[880px]"
          />
          <p className="mt-3 text-center text-xs text-inkdim">{t("product.duoNote")}</p>
        </div>
      </section>
    </Reveal>
  );
}
