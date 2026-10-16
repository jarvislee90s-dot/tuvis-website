// 手册文章页：左侧目录（13 页 5 组）+ 正文（react-markdown 渲染 public/manual 下的
// MD，生成物由 sync:manual 从兔维斯仓 docs/user-manual 同步而来）+ 上一页/下一页
// pager + 「编辑本页」直达真值 MD。语言策略：URL /:lang 权威；en 为骨架稿（正文
// 占位见 docs.missing 文案），zh 为全量正式稿。
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePageMeta } from "@/utils/usePageMeta";
import { Link, useParams } from "react-router";
import { useLang } from "@/i18n/useLang";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MANUAL_FLAT, MANUAL_GROUPS } from "@/content/manual";

const BASE = import.meta.env.BASE_URL; // "/tuvis-website/"

export default function DocsArticlePage() {
  const { t } = useTranslation();
  const params = useParams();
  // /:lang 归一统一走 useLang（en* → en，缺失/非法 → zh；与替换前的 params.lang?.startsWith 等价）
  const lang = useLang();
  const slug = params.slug ?? "01-overview";

  const [md, setMd] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let alive = true;
    setMd(null);
    setMissing(false);
    const tryFetch = (l: string) =>
      fetch(`${BASE}manual/${l}/${slug}.md`).then((r) => (r.ok ? r.text() : Promise.reject()));
    tryFetch(lang)
      .then((text) => {
        if (alive) setMd(text);
      })
      .catch(() =>
        // 本语言缺页 → 取另一语言内容兜底（骨架期 en 缺文的正文不会白屏）
        tryFetch(lang === "zh" ? "en" : "zh")
          .then((text) => {
            if (alive) setMd(text);
          })
          .catch(() => {
            if (alive) setMissing(true);
          })
      );
    return () => {
      alive = false;
    };
  }, [lang, slug]);

  const idx = MANUAL_FLAT.findIndex((p) => p.slug === slug);
  const meta = idx >= 0 ? MANUAL_FLAT[idx] : undefined;
  const prev = idx > 0 ? MANUAL_FLAT[idx - 1] : undefined;
  const next = idx < MANUAL_FLAT.length - 1 ? MANUAL_FLAT[idx + 1] : undefined;
  const title = meta && lang === "zh" ? meta.zh : (meta?.en ?? slug);
  // 页签标题取 manual.ts 元数据（同步可得，md 加载前后都正确），不走 i18n；
  // 页签统一带品牌后缀（与 Home/Demo/Changelog 的「页面名 — Tuvis」模式一致），未知 slug 回退同带
  usePageMeta({ title: `${title} — Tuvis`, description: t("meta.docs.desc") });

  // 图片引用：MD 里 `../img/…`（双语章节同源共享 img/，GitHub 上直接看也成立）
  // → 站点绝对路径；正文首行 `# 标题` 剥掉——标题位由页面头部承担（与侧栏/
  // 着陆卡同源 manual.ts）
  const body = (md ?? "")
    .replace(/\]\((?:\.\.\/)?img\//g, `](${BASE}manual/img/`)
    .replace(/^#\s+.*\n+/, "");

  return (
    <div className="px-5 py-10">
      <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-12">
        <aside className="mb-10 lg:mb-0">
          <nav className="space-y-6 lg:sticky lg:top-20">
            {MANUAL_GROUPS.map((g) => (
              <div key={g.zh}>
                <div className="mb-1.5 text-xs font-semibold tracking-[0.15em] text-inkdim uppercase">
                  {lang === "zh" ? g.zh : g.en}
                </div>
                <ul className="space-y-1">
                  {g.pages.map((p) => (
                    <li key={p.slug}>
                      <Link
                        to={`/${lang}/docs/${p.slug}`}
                        className={`text-sm hover:text-hud ${
                          p.slug === slug ? "text-hud font-medium" : "text-inkdim"
                        }`}
                      >
                        {lang === "zh" ? p.zh : p.en}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <article className="min-w-0 max-w-3xl">
          {missing ? (
            <>
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="mt-8 rounded-[14px] border border-line bg-card p-5 text-inkdim">
                {t("docs.missing")}
              </p>
              <p className="mt-6 text-sm">
                <Link to={`/${lang}/docs/01-overview`} className="text-hud hover:underline">
                  ← {t("docs.backToDocs")}
                </Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold">{title}</h1>
              {md === null ? (
                <p className="mt-8 text-inkdim">{t("docs.loading")}</p>
              ) : (
                <div className="manual-doc mt-8">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    // 章节互链：真值 MD 里的相对 `.md` 链接（GitHub 上可点）→ 站内
                    // 路由跳转；其余外链安全开新窗
                    components={{
                      a: ({ href, children }) => {
                        const m = href?.match(/^(?:\.\/)?(\d{2}-[a-z-]+)\.md$/i);
                        if (m) return <Link to={`/${lang}/docs/${m[1]}`}>{children}</Link>;
                        void m;
                        return (
                          <a
                            href={href}
                            target={href?.startsWith("http") ? "_blank" : undefined}
                            rel="noopener noreferrer"
                          >
                            {children}
                          </a>
                        );
                      },
                      // P18：竖版截图（高>宽）自动加 portrait 类限高居中，不再整屏铺开
                      img: ({ src, alt }) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={typeof src === "string" ? src : undefined}
                          alt={alt ?? ""}
                          loading="lazy"
                          onLoad={(e) => {
                            const el = e.currentTarget;
                            if (el.naturalHeight > el.naturalWidth) el.classList.add("portrait");
                          }}
                        />
                      ),
                    }}
                  >
                    {body}
                  </ReactMarkdown>
                </div>
              )}
              <p className="mt-10 text-xs text-inkdim">
                <a
                  className="text-hud hover:underline"
                  href={`https://github.com/jarvislee90s-dot/tuvis/blob/main/docs/user-manual/${lang}/${slug}.md`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("docs.editPage")}
                </a>
                {" · "}
                <Link to={`/${lang}/demo`} className="text-hud hover:underline">
                  {t("docs.playDemo")}
                </Link>
              </p>
              <div className="mt-4 flex justify-between gap-6 border-t border-line pt-4">
                {prev ? (
                  <Link
                    to={`/${lang}/docs/${prev.slug}`}
                    className="text-sm text-inkdim hover:text-hud"
                  >
                    ← {lang === "zh" ? prev.zh : prev.en}
                  </Link>
                ) : (
                  <span />
                )}
                {next ? (
                  <Link
                    to={`/${lang}/docs/${next.slug}`}
                    className="text-sm text-inkdim hover:text-hud"
                  >
                    {lang === "zh" ? next.zh : next.en} →
                  </Link>
                ) : (
                  <span />
                )}
              </div>
            </>
          )}
        </article>
      </div>
    </div>
  );
}