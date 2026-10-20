import { useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import type { ContentOverlay, Rect, WorldContentBundle } from "../types";
import { assetUrl } from "../assets/loadWorldData";
import { ContentPanel } from "../content/ContentPanel";

type WorldLandingProps = {
  bundle: WorldContentBundle;
};

type CropImageProps = {
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  rect: Rect;
  alt: string;
  className?: string;
};

/** Show an exact sourceRect from an atlas without re-cutting the file. */
function CropImage({ src, naturalWidth, naturalHeight, rect, alt, className }: CropImageProps) {
  const [x, y, width, height] = rect;
  return (
    <div className={`world-crop ${className ?? ""}`} style={{ aspectRatio: `${width} / ${height}` }}>
      <img
        src={src}
        alt={alt}
        draggable={false}
        style={{
          position: "absolute",
          width: `${(naturalWidth / width) * 100}%`,
          height: `${(naturalHeight / height) * 100}%`,
          left: `${(-x / width) * 100}%`,
          top: `${(-y / height) * 100}%`,
          maxWidth: "none",
        }}
      />
    </div>
  );
}

export function WorldLanding({ bundle }: WorldLandingProps) {
  const { manifest, content } = bundle;
  const { lang } = useParams();
  const zh = lang === "en" ? "en" : "zh";
  const { t } = useTranslation();
  const [overlay, setOverlay] = useState<ContentOverlay | null>(null);
  const [selectedId, setSelectedId] = useState(content.equipment[0]?.id ?? "");
  const selected = content.equipment.find((item) => item.id === selectedId) ?? content.equipment[0];
  const workshopHref = `/${zh}/world/workshop`;

  const assetFor = (id: string) => {
    const asset = manifest.assets[id];
    return asset ? assetUrl(asset.path) : "";
  };

  return (
    <main className="world-page">
      {/* W-01 主视觉 */}
      <section className="world-hero" aria-labelledby="world-title">
        <div className="world-shell world-hero-grid">
          <div className="world-hero-copy">
            <p className="world-eyebrow">TUVIS WORLD · 兔维斯世界</p>
            <h1 id="world-title" className="world-title">Tuvis World｜<span className="world-title-cn">兔维斯世界</span></h1>
            <p className="world-lead">{content.intro}</p>
            <div className="world-actions">
              <Link className="world-btn world-btn-primary" to={workshopHref}>
                {content.ui.enter}
              </Link>
              <a className="world-btn world-btn-ghost" href="#character">
                {zh === "en" ? "Meet Tuvis" : "认识兔维斯"}
              </a>
            </div>
            {zh === "en" ? <p className="world-lang-note">{t("world.contentLanguageNote")}</p> : null}
          </div>
          <div className="world-hero-art">
            <img
              className="world-hero-city"
              src={assetFor(content.cityAsset)}
              alt={content.world.find((entry) => entry.id === "city")?.title ?? "回路城"}
              width={manifest.assets[content.cityAsset]?.width}
              height={manifest.assets[content.cityAsset]?.height}
            />
            <img
              className="world-hero-character"
              src={assetFor(content.heroAsset)}
              alt={content.character.name}
              width={manifest.assets[content.heroAsset]?.width}
              height={manifest.assets[content.heroAsset]?.height}
              fetchPriority="high"
            />
            <span className="world-hero-tag">回路城 · 发明工坊</span>
          </div>
        </div>
      </section>

      {/* W-02 认识兔维斯 */}
      <section id="character" className="world-section world-character" aria-labelledby="character-title">
        <div className="world-shell world-character-grid">
          <figure className="world-character-art">
            <img
              src={assetFor(content.heroAsset)}
              alt={content.character.name}
              loading="lazy"
              width={manifest.assets[content.heroAsset]?.width}
              height={manifest.assets[content.heroAsset]?.height}
            />
            <figcaption>{content.character.name} · {content.character.subtitle}</figcaption>
          </figure>
          <div>
            <p className="world-kicker">W-02 · 认识兔维斯</p>
            <h2 id="character-title" className="world-h2">{content.character.name}</h2>
            <p className="world-section-intro">{content.character.intro}</p>
            <ul className="world-tags">
              {content.character.tags.map((tag) => <li key={tag}>{tag}</li>)}
            </ul>
            <ul className="world-feature-grid">
              {content.character.features.map((feature) => (
                <li key={feature.title}>
                  <strong>{feature.title}</strong>
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* W-03 装备图鉴 */}
      <section id="equipment" className="world-section world-equipment" aria-labelledby="equipment-title">
        <div className="world-shell">
          <p className="world-kicker">W-03 · 装备图鉴</p>
          <h2 id="equipment-title" className="world-h2">兔维斯的四件装备</h2>
          <div className="world-equipment-grid">
            {content.equipment.map((item) => {
              const asset = manifest.assets[item.asset];
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`world-equipment-card ${selected?.id === item.id ? "is-selected" : ""}`}
                  aria-pressed={selected?.id === item.id}
                  style={{ "--equipment-color": item.color } as CSSProperties}
                  onClick={() => setSelectedId(item.id)}
                >
                  {asset ? (
                    <CropImage
                      src={assetFor(item.asset)}
                      naturalWidth={asset.width}
                      naturalHeight={asset.height}
                      rect={item.sourceRect}
                      alt={item.name}
                    />
                  ) : null}
                  <span className="world-equipment-name">{item.name}</span>
                  <span className="world-equipment-en">{item.english}</span>
                  <span className="world-equipment-code">{item.id}</span>
                </button>
              );
            })}
          </div>
          {selected ? (
            <div className="world-equipment-detail" aria-live="polite">
              <span className="world-swatch" style={{ background: selected.color }} />
              <div>
                <h3>{selected.name} <span>{selected.english}</span></h3>
                <p>{selected.description}</p>
                <p className="world-analogy">{selected.analogy}</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* W-04 世界设定 */}
      <section id="world" className="world-section world-setting" aria-labelledby="world-setting-title">
        <div className="world-shell">
          <p className="world-kicker">W-04 · 世界设定</p>
          <h2 id="world-setting-title" className="world-h2">回路城与发明工坊</h2>
          <div className="world-setting-grid">
            {content.world.filter((entry) => entry.id !== "home").map((entry) => (
              <article key={entry.id} className="world-setting-card">
                <img
                  src={assetFor(entry.asset)}
                  alt={entry.title}
                  loading="lazy"
                  width={manifest.assets[entry.asset]?.width}
                  height={manifest.assets[entry.asset]?.height}
                />
                <h3>{entry.title}</h3>
                <p>{entry.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* W-05 故事档案 */}
      <section id="stories" className="world-section world-stories" aria-labelledby="stories-title">
        <div className="world-shell">
          <p className="world-kicker">W-05 · 故事档案</p>
          <h2 id="stories-title" className="world-h2">工坊里的小故事</h2>
          <div className="world-story-grid">
            {content.stories.map((story) => (
              <article key={story.id} className="world-story-card">
                <img
                  src={assetFor(story.asset)}
                  alt={story.title}
                  loading="lazy"
                  width={manifest.assets[story.asset]?.width}
                  height={manifest.assets[story.asset]?.height}
                />
                <div className="world-story-body">
                  <span className="world-status-chip">{story.status}</span>
                  <h3>{story.title}</h3>
                  <p>{story.summary}</p>
                  <button
                    type="button"
                    className="world-btn world-btn-small"
                    onClick={() => setOverlay({ kind: "stories", id: story.id })}
                  >
                    查看简介
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* W-06 工坊体验 */}
      <section id="workshop" className="world-section world-workshop" aria-labelledby="workshop-title">
        <div className="world-shell world-workshop-grid">
          <div className="world-workshop-preview">
            <img
              src={assetFor(content.workshopPreviewAsset)}
              alt="兔维斯工坊"
              loading="lazy"
              width={manifest.assets[content.workshopPreviewAsset]?.width}
              height={manifest.assets[content.workshopPreviewAsset]?.height}
            />
            <span className="world-workshop-badge">斜俯视 · 可探索</span>
          </div>
          <div>
            <p className="world-kicker">W-06 · 工坊体验</p>
            <h2 id="workshop-title" className="world-h2">{content.quest.title}</h2>
            <p className="world-section-intro">点击地面移动，走近工作台、工具箱与窗边，找齐三个模块并修好能源匣。</p>
            <ol className="world-quest-steps">
              {content.quest.instructions.map((step) => <li key={step}>{step}</li>)}
            </ol>
            <ul className="world-help-lines">
              {content.ui.helpLines.map((line) => <li key={line}>{line}</li>)}
            </ul>
            <p className="world-desktop-note">电脑浏览器体验 · 支持鼠标操作 · 按 Esc 关闭面板</p>
            <Link className="world-btn world-btn-primary" to={workshopHref}>
              {content.ui.enter}
            </Link>
          </div>
        </div>
      </section>

      <ContentPanel overlay={overlay} bundle={bundle} onClose={() => setOverlay(null)} />
    </main>
  );
}
