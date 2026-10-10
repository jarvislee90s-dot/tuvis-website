import { useTranslation } from "react-i18next";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import data from "@/content/changelog.json";

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

export default function ChangelogPage() {
  const { t, i18n } = useTranslation();
  return (
    <main className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="text-3xl font-bold">{t("log.title")}</h1>
      {i18n.language !== "zh" && <p className="mt-2 text-sm text-inkdim">{t("log.enNote")}</p>}
      <div className="mt-8 space-y-10">
        {data.map((rel) => (
          <section key={rel.version}>
            <h2 className="text-xl font-bold">
              <span className="tabular-nums">v{rel.version}</span>
              <span className="ml-3 text-sm font-normal text-inkdim">{rel.date}</span>
            </h2>
            {Object.entries(rel.sections).map(([sec, items]) => (
              <div key={sec} className="mt-3">
                <h3 className="text-sm font-semibold text-hud">{sec}</h3>
                <ul className="mt-1 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
                  {items.map((it, i) => (
                    <li key={i}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={ITEM_MD}>{it}</ReactMarkdown>
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
