import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { usePageMeta } from "@/utils/usePageMeta";
import { useLang } from "@/i18n/useLang";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import zhData from "@/content/changelog.json";
import enData from "@/content/changelog.en.json";

/** 条目内 markdown 渲染（P18：CHANGELOG 条目是 markdown——加粗/链接/图片照常渲染，
 *  release note 从此可带图；图片 lazy + 圆角边框，链接安全开新窗） */
const ITEM_MD: Components = {
  p: ({ children }) => <span className="block">{children}</span>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-hud hover:underline">{children}</a>
  ),
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy"
      className="my-2 max-w-full rounded-lg border border-line" />
  ),
};

/** 页面内部形状：单语纯文本条目（版本/日期/分区名照搬产物原文） */
type Release = { version: string; date: string; sections: Record<string, string[]> };

function mapSections<T>(sections: Record<string, T[]>, pick: (item: T) => string): Record<string, string[]> {
  return Object.fromEntries(Object.entries(sections).map(([sec, items]) => [sec, items.map(pick)]));
}

/** 同步产物「每文件单语」：中文产物条目键 `zh`、英文产物 `en`（scripts/split-changelog.mjs）。
 *  这里按语言各取各的键——编译期由两份类型桩（changelog.d.json.ts / changelog.en.d.json.ts）钉住，
 *  运行期不设跨语言回落：中英彻底分家（2026-10-17 用户裁决），缺键属数据事故，由脚本侧键集/语言
 *  纯度闸门与 scripts/split-changelog.test.mjs 的产物门禁拦。 */
const DATA = {
  zh: zhData.map((rel) => ({ ...rel, sections: mapSections(rel.sections, (it) => it.zh) })),
  en: enData.map((rel) => ({ ...rel, sections: mapSections(rel.sections, (it) => it.en) })),
} satisfies Record<"zh" | "en", Release[]>;

/** 英文页说明里的「vX.Y.Z 起」锚点 = 英文产物最老一版：随数据漂移自动跟随，不写死版本号
 *  （未译版本以后回填时，说明随之改口） */
const EN_OLDEST = enData[enData.length - 1]?.version;
const EN_FROM = EN_OLDEST ? `v${EN_OLDEST}` : "";

export default function ChangelogPage() {
  const { t } = useTranslation();
  // 语言走 useLang（en* → en，其余 → zh）：URL 权威、切语首帧不滞后；判定同 DocsArticlePage
  const en = useLang() === "en";
  usePageMeta({ title: t("meta.changelog.title"), description: t("meta.changelog.desc") });
  return (
    <main className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="text-3xl font-bold">{t("log.title")}</h1>
      {/* 英文页只列已译版本（未译版本不出现、不留占位），指路中文版取完整历史 */}
      {en && (
        <p className="mt-2 text-sm text-inkdim">
          {t("log.enNote", { from: EN_FROM })}{" "}
          <Link to="/zh/changelog" className="text-hud hover:underline">{t("log.zhLink")}</Link>
        </p>
      )}
      <div className="mt-8 space-y-10">
        {DATA[en ? "en" : "zh"].map((rel) => (
          <section key={rel.version}>
            <h2 className="text-xl font-bold">
              <span className="tabular-nums">v{rel.version}</span>
              <span className="ml-3 text-sm font-normal text-inkdim">{rel.date}</span>
            </h2>
            {Object.entries(rel.sections).map(([sec, items]) => (
              <div key={sec} className="mt-3">
                <h3 className="text-sm font-semibold text-hud">{sec}</h3>
                <ul className="mt-1 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
                  {items.map((text, i) => (
                    <li key={i}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={ITEM_MD}>
                        {text}
                      </ReactMarkdown>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
