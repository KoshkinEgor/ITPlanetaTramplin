import { useState } from "react";
import { CandidatePortfolioProjectCard } from "../candidate-portal/portfolio-kit";
import { Button, Card } from "../shared/ui";
import "./company-dashboard.css";

const COMPANY_PORTFOLIO_DETAIL_HREF = "#company-portfolio-projects";
const PORTFOLIO_COPY = {
  editor: {
    description: "Мини-версии карточек пролистываются прямо в кабинете компании, чтобы кейсы можно было быстро просматривать внутри блока портфолио.",
    showCreateAction: true,
  },
  viewer: {
    description: "Компактные карточки кейсов помогают быстро просмотреть проекты компании без перехода в режим редактирования.",
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

export function CompanyPortfolioCarousel({ mode = "editor", testId = "company-profile-portfolio-slider" }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const totalItems = COMPANY_PORTFOLIO_PROJECTS.length;
  const canMoveBackward = activeIndex > 0;
  const canMoveForward = activeIndex < totalItems - 1;
  const copy = PORTFOLIO_COPY[mode] ?? PORTFOLIO_COPY.editor;

  return (
    <Card className="company-dashboard-portfolio" data-testid={testId}>
      <div className="company-dashboard-portfolio__head">
        <div className="company-dashboard-portfolio__copy">
          <span className="company-dashboard-portfolio__eyebrow">Кейсы</span>
          <h2 className="company-dashboard-portfolio__title">Портфолио компании</h2>
          <p className="company-dashboard-portfolio__description">{copy.description}</p>
        </div>

        <div className="company-dashboard-portfolio__controls">
          <span className="company-dashboard-portfolio__counter" aria-live="polite">
            {String(activeIndex + 1).padStart(2, "0")} / {String(totalItems).padStart(2, "0")}
          </span>
          <div className="company-dashboard-portfolio__actions">
            <Button variant="secondary" size="sm" onClick={() => setActiveIndex((index) => Math.max(index - 1, 0))} disabled={!canMoveBackward}>
              Назад
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setActiveIndex((index) => Math.min(index + 1, totalItems - 1))} disabled={!canMoveForward}>
              Дальше
            </Button>
          </div>
        </div>
      </div>

      <div className="company-dashboard-portfolio__viewport">
        <div
          className="company-dashboard-portfolio__track"
          data-testid="company-profile-portfolio-track"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {COMPANY_PORTFOLIO_PROJECTS.map((item) => (
            <div key={item.id} className="company-dashboard-portfolio__slide">
              <CandidatePortfolioProjectCard
                item={item}
                variant="media"
                actionHref={COMPANY_PORTFOLIO_DETAIL_HREF}
                className="company-dashboard-portfolio__card"
              />
            </div>
          ))}
        </div>
      </div>

      {copy.showCreateAction ? (
        <Button type="button" width="full" className="company-dashboard-portfolio__cta">
          Добавить проект
        </Button>
      ) : null}
    </Card>
  );
}
