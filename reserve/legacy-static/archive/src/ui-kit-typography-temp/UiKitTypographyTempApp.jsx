import { useEffect } from "react";
import "./ui-kit-typography-temp.css";

const UI_KIT_TYPOGRAPHY_TEMP_BODY_CLASS = "ui-kit-typography-temp-body";

const TYPE_SCALE_ROWS = [
  {
    label: "Display",
    className: "ui-kit-typo-type-display",
    size: "72px / 4.500rem",
    weight: "700",
    lineHeight: "0.94",
    sample: "A typography system should lead the interface, not decorate it.",
  },
  {
    label: "H1",
    className: "ui-kit-typo-type-h1",
    size: "47.78px / 2.986rem",
    weight: "700",
    lineHeight: "1.05",
    sample: "Build a strong visual hierarchy before adding any extra UI.",
  },
  {
    label: "H2",
    className: "ui-kit-typo-type-h2",
    size: "39.81px / 2.488rem",
    weight: "700",
    lineHeight: "1.08",
    sample: "Large section headers keep long product pages readable.",
  },
  {
    label: "H3",
    className: "ui-kit-typo-type-h3",
    size: "33.18px / 2.074rem",
    weight: "700",
    lineHeight: "1.12",
    sample: "Mid-level headings group related blocks without shouting.",
  },
  {
    label: "H4",
    className: "ui-kit-typo-type-h4",
    size: "27.65px / 1.728rem",
    weight: "700",
    lineHeight: "1.16",
    sample: "Use this step when cards and panels need a compact title.",
  },
  {
    label: "H5",
    className: "ui-kit-typo-type-h5",
    size: "23.04px / 1.440rem",
    weight: "700",
    lineHeight: "1.2",
    sample: "Small headers should still feel deliberate and confident.",
  },
  {
    label: "H6",
    className: "ui-kit-typo-type-h6",
    size: "19.20px / 1.200rem",
    weight: "700",
    lineHeight: "1.24",
    sample: "This is useful for labels above dense informational content.",
  },
  {
    label: "Body",
    className: "ui-kit-typo-type-body",
    size: "16px / 1rem",
    weight: "400",
    lineHeight: "1.6",
    sample: "Body copy needs enough breathing room to stay readable across long descriptions, forms, and editorial paragraphs.",
  },
  {
    label: "Small",
    className: "ui-kit-typo-type-small",
    size: "13.33px / 0.833rem",
    weight: "500",
    lineHeight: "1.5",
    sample: "Small text supports content without competing with the main message.",
  },
  {
    label: "Micro",
    className: "ui-kit-typo-type-micro",
    size: "11.11px / 0.694rem",
    weight: "700",
    lineHeight: "1.45",
    sample: "Use micro text for labels, specs, timestamps, and subtle annotations.",
  },
];

export function UiKitTypographyTempApp() {
  useEffect(() => {
    document.body.classList.add(UI_KIT_TYPOGRAPHY_TEMP_BODY_CLASS);

    return () => {
      document.body.classList.remove(UI_KIT_TYPOGRAPHY_TEMP_BODY_CLASS);
    };
  }, []);

  return (
    <main className="ui-kit-typo-page" data-testid="ui-kit-typography-page">
      <div className="ui-kit-typo-shell">
        <header className="ui-kit-typo-hero">
          <div className="ui-kit-typo-hero__copy">
            <span className="ui-kit-typo-kicker">Temporary UI kit page</span>
            <h1 className="ui-kit-typo-type-display">Typography Playground</h1>
            <p className="ui-kit-typo-type-body">
              This page isolates the type system from the old UI kit playground. It uses only local markup and a dedicated stylesheet, so
              you can iterate on hierarchy and rhythm without touching shared styles.
            </p>
          </div>

          <div className="ui-kit-typo-metrics" aria-label="Typography metrics">
            <article className="ui-kit-typo-metric">
              <span className="ui-kit-typo-metric__label">Base</span>
              <strong className="ui-kit-typo-type-h5">16px</strong>
              <p className="ui-kit-typo-type-small">Default reading size for interface copy.</p>
            </article>
            <article className="ui-kit-typo-metric">
              <span className="ui-kit-typo-metric__label">Scale</span>
              <strong className="ui-kit-typo-type-h5">1.2</strong>
              <p className="ui-kit-typo-type-small">Modular step used for heading progression.</p>
            </article>
            <article className="ui-kit-typo-metric">
              <span className="ui-kit-typo-metric__label">Rhythm</span>
              <strong className="ui-kit-typo-type-h5">1.6</strong>
              <p className="ui-kit-typo-type-small">Line height target for readable body text.</p>
            </article>
          </div>
        </header>

        <section className="ui-kit-typo-section" aria-labelledby="ui-kit-typo-scale-title">
          <div className="ui-kit-typo-section__head">
            <span className="ui-kit-typo-kicker">Scale reference</span>
            <h2 id="ui-kit-typo-scale-title" className="ui-kit-typo-type-h2">
              Type roles
            </h2>
            <p className="ui-kit-typo-type-body">
              Each row below is styled only by the local CSS in this folder. No `Card`, no shared utility classes, and no dependency on the
              previous `ui-kit.css`.
            </p>
          </div>

          <div className="ui-kit-typo-scale" role="list" aria-label="Typography scale list">
            {TYPE_SCALE_ROWS.map((row) => (
              <article key={row.className} className="ui-kit-typo-row" role="listitem">
                <div className="ui-kit-typo-row__meta">
                  <span className="ui-kit-typo-row__label">{row.label}</span>
                  <code className="ui-kit-typo-row__class">{row.className}</code>
                </div>
                <dl className="ui-kit-typo-row__specs">
                  <div>
                    <dt>Size</dt>
                    <dd>{row.size}</dd>
                  </div>
                  <div>
                    <dt>Weight</dt>
                    <dd>{row.weight}</dd>
                  </div>
                  <div>
                    <dt>Line</dt>
                    <dd>{row.lineHeight}</dd>
                  </div>
                </dl>
                <p className={`ui-kit-typo-row__sample ${row.className}`}>{row.sample}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="ui-kit-typo-section" aria-labelledby="ui-kit-typo-specimens-title">
          <div className="ui-kit-typo-section__head">
            <span className="ui-kit-typo-kicker">Live specimens</span>
            <h2 id="ui-kit-typo-specimens-title" className="ui-kit-typo-type-h2">
              Composition checks
            </h2>
            <p className="ui-kit-typo-type-body">
              A type scale matters only when it survives real layout combinations. These blocks let you check display, article, and metadata
              patterns in one place.
            </p>
          </div>

          <div className="ui-kit-typo-specimens">
            <article className="ui-kit-typo-panel ui-kit-typo-panel--hero">
              <span className="ui-kit-typo-kicker">Hero stack</span>
              <h3 className="ui-kit-typo-type-display">Words should carry the first impression.</h3>
              <p className="ui-kit-typo-type-body">
                The opening section tests whether the display style has enough contrast against body copy and whether the transition into the
                next text block feels natural.
              </p>
            </article>

            <article className="ui-kit-typo-panel">
              <span className="ui-kit-typo-kicker">Article block</span>
              <h3 className="ui-kit-typo-type-h3">Editorial layout needs a calm hierarchy.</h3>
              <p className="ui-kit-typo-type-body">
                Long-form text should feel stable and spacious. If the paragraph density starts to look noisy here, the issue is usually the
                line-height or the gap between heading and body.
              </p>
              <p className="ui-kit-typo-type-small">
                Supporting lines can sit closer to the main paragraph, but they still need enough separation to avoid turning into a single
                undifferentiated block.
              </p>
            </article>

            <article className="ui-kit-typo-panel">
              <span className="ui-kit-typo-kicker">Metadata block</span>
              <h3 className="ui-kit-typo-type-h6">System labels and secondary information</h3>
              <div className="ui-kit-typo-meta-list">
                <div>
                  <span className="ui-kit-typo-type-micro">UPDATED</span>
                  <p className="ui-kit-typo-type-small">March 25, 2026</p>
                </div>
                <div>
                  <span className="ui-kit-typo-type-micro">TOKEN</span>
                  <p className="ui-kit-typo-type-small">Independent local stylesheet</p>
                </div>
                <div>
                  <span className="ui-kit-typo-type-micro">STATUS</span>
                  <p className="ui-kit-typo-type-small">Temporary isolated page for typography only</p>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
