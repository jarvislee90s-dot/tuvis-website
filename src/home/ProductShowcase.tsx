import { Link, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Reveal } from "@/components/Reveal";
import { SectionTitle } from "@/components/SectionTitle";
import { DesktopStage } from "@/demo/DesktopStage";
import { AppBoard } from "@/demo/AppBoard";
import { PhoneFrame } from "@/demo/PhoneFrame";
import { RemoteBoard } from "@/demo/remote/RemoteBoard";

/** 产品形态独立单元（P13 新区块，TopBar「产品形态」锚点 id=product）：
 *  左 2/3 = 桌面看板 4 行 2 列静态窗（7 会话 + 1 空位，纯留空）；右 1/3 = 手机远程窗
 *  （固定宽 340px、屏幕比例 163.4:78.0，大小不随筛选/内容变化；点卡跳 /:lang/demo#d2）。 */
export function ProductShowcase() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lang } = useParams();
  const goDemoD2 = () => navigate(`/${lang ?? "zh"}/demo#d2`);
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
            <p className="mt-3 text-center">
              <Link to="demo" className="text-sm font-semibold text-hud hover:underline">{t("demo.open")} →</Link>
            </p>
          </div>
          <div className="flex items-start justify-center lg:justify-start">
            <PhoneFrame maxWidth="max-w-[340px]">
              <RemoteBoard onOpenDetail={goDemoD2} />
            </PhoneFrame>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
