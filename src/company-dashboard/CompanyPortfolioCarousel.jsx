import { useEffect, useMemo, useState } from "react";
import { CandidatePortfolioProjectCard } from "../candidate-portal/portfolio-kit";
import { Button, Card, EmptyState } from "../shared/ui";
import "./company-dashboard.css";

const COMPANY_PORTFOLIO_DETAIL_HREF = "#company-portfolio-projects";

const PORTFOLIO_COPY = {
  editor: {
    eyebrow: "Кейсы",
    title: "Портфолио компании",
    description:
      "Тот же slider используется и в кабинете компании, и на публичной странице. Здесь он помогает быстро проверить, как выглядят кейсы после сохранения.",
    showCreateAction: true,
  },
  viewer: {
    eyebrow: "Кейсы",
    title: "Портфолио компании",
    description:
      "Компактные карточки помогают быстро посмотреть проекты и перейти по ссылке на кейс без отдельного режима редактирования.",
    showCreateAction: false,
  },
};

function escapeSvgText(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function createCompanyPortfolioCover({ eyebrow, title, accentStart, accentEnd, glow }) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="720" height="440" viewBox="0 0 720 440" fill="none">
      <defs>
        <linearGradient id="panel" x1="68" y1="40" x2="642" y2="392" gradientUnits="userSpaceOnUse">
          <stop stop-color="${accentStart}" />
          <stop offset="1" stop-color="${accentEnd}" />
        </linearGradient>
        <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(142 112) rotate(44) scale(176 176)">
          <stop stop-color="${glow}" />
          <stop offset="1" stop-color="${glow}" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="720" height="440" rx="40" fill="#EDF4FF" />
      <rect x="40" y="36" width="640" height="368" rx="34" fill="url(#panel)" />
      <rect x="40" y="36" width="640" height="368" rx="34" fill="url(#glow)" />
      <circle cx="592" cy="132" r="88" fill="rgba(255,255,255,0.22)" />
      <circle cx="506" cy="310" r="126" fill="rgba(255,255,255,0.14)" />
      <path d="M126 306C198 232 264 194 342 194C424 194 492 230 564 306" stroke="rgba(255,255,255,0.5)" stroke-width="18" stroke-linecap="round" />
      <rect x="96" y="92" width="198" height="52" rx="26" fill="rgba(255,255,255,0.68)" />
      <text x="126" y="125" fill="#245BD6" font-size="24" font-family="Manrope, Arial, sans-serif" font-weight="700">${escapeSvgText(eyebrow)}</text>
      <text x="96" y="240" fill="#102754" font-size="60" font-family="Manrope, Arial, sans-serif" font-weight="800">${escapeSvgText(title)}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const COMPANY_PORTFOLIO_PROJECTS = [
  {
    id: "company-portfolio-project-1",
    title: "Signal Desk",
    coverImageUrl: createCompanyPortfolioCover({
      eyebrow: "Security analytics",
      title: "Signal Desk",
      accentStart: "#F6FBFF",
      accentEnd: "#DCE8FF",
      glow: "#DFFF95",
    }),
  },
  {
    id: "company-portfolio-project-2",
    title: "Trust Layer",
    coverImageUrl: createCompanyPortfolioCover({
      eyebrow: "Zero-trust suite",
      title: "Trust Layer",
      accentStart: "#F7FFFB",
      accentEnd: "#DCEFE5",
      glow: "#B6F0C9",
    }),
  },
  {
    id: "company-portfolio-project-3",
    title: "Campus Shield",
    coverImageUrl: createCompanyPortfolioCover({
      eyebrow: "Education security",
      title: "Campus Shield",
      accentStart: "#FFFDF7",
      accentEnd: "#FFE6BA",
      glow: "#FFF3A8",
    }),
  },
];

function mapPortfolioItems(items) {
  return items
    .map((item, index) => {
      const title = String(item?.title ?? "").trim();
      const subtitle = String(item?.subtitle ?? "").trim();
      const previewUrl = String(item?.previewUrl ?? "").trim();
      const sourceUrl = String(item?.sourceUrl ?? "").trim();

      if (!title && !subtitle && !previewUrl) {
        return null;
      }

      return {
        id: String(item?.id ?? `company-portfolio-project-${index + 1}`),
        title: title || `Кейс ${index + 1}`,
        coverImageUrl:
          previewUrl ||
          createCompanyPortfolioCover({
            eyebrow: subtitle || "Company case",
            title: title || `Case ${index + 1}`,
            accentStart: "#F6FBFF",
            accentEnd: "#DCE8FF",
            glow: "#DFFF95",
          }),
        actionHref: sourceUrl || COMPANY_PORTFOLIO_DETAIL_HREF,
        actionLabel: sourceUrl ? "Открыть проект" : "Подробнее",
      };
    })
    .filter(Boolean);
}

export function CompanyPortfolioCarousel({
  mode = "editor",
  items,
  testId = "company-profile-portfolio-slider",
  showCreateAction,
  emptyTitle = "Кейсы пока не добавлены",
  emptyDescription = "После заполнения карточек здесь появится slider с проектами компании.",
  eyebrow,
  title,
  description,
  compact = false,
  ctaLabel = "Добавить проект",
  onCtaClick,
  ctaHref,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const portfolioItems = useMemo(
    () => (items === undefined ? COMPANY_PORTFOLIO_PROJECTS : mapPortfolioItems(items)),
    [items]
  );
  const totalItems = portfolioItems.length;
  const canMoveBackward = activeIndex > 0;
  const canMoveForward = activeIndex < totalItems - 1;
  const copy = PORTFOLIO_COPY[mode] ?? PORTFOLIO_COPY.editor;
  const shouldShowCreateAction =
    typeof showCreateAction === "boolean" ? showCreateAction : copy.showCreateAction;

  useEffect(() => {
    setActiveIndex((currentIndex) => Math.min(currentIndex, Math.max(totalItems - 1, 0)));
  }, [totalItems]);

  const resolvedEyebrow = eyebrow ?? copy.eyebrow;
  const resolvedTitle = title ?? copy.title;
  const resolvedDescription = description ?? copy.description;

  return (
    <Card
      className={[
        "company-dashboard-portfolio",
        compact ? "company-dashboard-portfolio--compact" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-testid={testId}
    >
      <div className="company-dashboard-portfolio__head">
        <div className="company-dashboard-portfolio__copy">
          {resolvedEyebrow ? (
            <span className="company-dashboard-portfolio__eyebrow">{resolvedEyebrow}</span>
          ) : null}
          {resolvedTitle ? <h2 className="company-dashboard-portfolio__title">{resolvedTitle}</h2> : null}
          {resolvedDescription ? (
            <p className="company-dashboard-portfolio__description">{resolvedDescription}</p>
          ) : null}
        </div>

        {totalItems ? (
          <div className="company-dashboard-portfolio__controls">
            <span className="company-dashboard-portfolio__counter" aria-live="polite">
              {String(activeIndex + 1).padStart(2, "0")} / {String(totalItems).padStart(2, "0")}
            </span>
            <div className="company-dashboard-portfolio__actions">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveIndex((index) => Math.max(index - 1, 0))}
                disabled={!canMoveBackward}
              >
                Назад
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveIndex((index) => Math.min(index + 1, totalItems - 1))}
                disabled={!canMoveForward}
              >
                Дальше
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {totalItems ? (
        <div className="company-dashboard-portfolio__viewport">
          <div
            className="company-dashboard-portfolio__track"
            data-testid="company-profile-portfolio-track"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {portfolioItems.map((item) => (
              <div key={item.id} className="company-dashboard-portfolio__slide">
                <CandidatePortfolioProjectCard
                  item={item}
                  variant="media"
                  actionHref={item.actionHref}
                  actionLabel={item.actionLabel}
                  className="company-dashboard-portfolio__card"
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState compact tone="neutral" title={emptyTitle} description={emptyDescription} />
      )}

      {shouldShowCreateAction ? (
        <Button
          type="button"
          href={ctaHref}
          onClick={onCtaClick}
          width="full"
          className="company-dashboard-portfolio__cta"
        >
          {ctaLabel}
        </Button>
      ) : null}
    </Card>
  );
}
