import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AppLink } from "../../app/AppLink";
import {
  PUBLIC_HEADER_NAV_ITEMS,
  buildOpportunityDetailRoute,
  routes,
} from "../../app/routes";
import { getPublicCompany, getPublicCompanyOpportunities } from "../../api/company";
import { OpportunityBlockRail } from "../../components/opportunities";
import { CompanyGalleryPanel } from "../../company-dashboard/CompanyGalleryPanel";
import { CompanyHeroMediaPanel } from "../../company-dashboard/CompanyHeroMediaPanel";
import { CompanyPortfolioCarousel } from "../../company-dashboard/CompanyPortfolioCarousel";
import {
  normalizeCompanyCaseStudies,
  normalizeCompanyGallery,
  normalizeCompanyHeroMedia,
} from "../../company-dashboard/companyProfileMedia";
import { translateVerificationStatus } from "../../company-dashboard/utils";
import { CompanyProfileSummary } from "../../features/company";
import { ApiError } from "../../lib/http";
import { getOpportunityCardPresentation } from "../../shared/lib/opportunityPresentation";
import { Alert, Button, Card, EmptyState, Loader } from "../../shared/ui";
import { PortalHeader } from "../../widgets/layout";
import "./CompanyPublicPage.css";

function shortenText(value, maxLength = 96) {
  const normalized = String(value ?? "").trim().replace(/\s+/g, " ");

  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}…`;
}

function createOpportunityRailItem(item) {
  const presentation = getOpportunityCardPresentation(item);

  return {
    id: item.id,
    ...presentation,
    status: "Активно",
    statusTone: "success",
    title: item?.title ?? "",
    note: presentation.note || shortenText(item?.description),
    chips: Array.isArray(item?.tags) ? item.tags.slice(0, 4) : [],
    detailHref: buildOpportunityDetailRoute(item.id),
  };
}

function buildPublicVerification(profile) {
  const tone = String(profile?.verificationStatus ?? "approved").trim().toLowerCase() || "approved";

  return {
    label: "Верификация",
    tone,
    statusText: translateVerificationStatus(tone),
    note: "Профиль подтвержден и уже доступен кандидатам в публичном каталоге.",
  };
}

function buildPublicStats({ opportunities, caseStudies, gallery }) {
  return [
    { value: String(opportunities.length), label: "Открытые возможности" },
    { value: String(caseStudies.length), label: "Кейсы компании" },
    { value: String(gallery.length), label: "Фото и офис" },
  ];
}

export function CompanyPublicPage() {
  const { id: companyId } = useParams();
  const [state, setState] = useState({
    status: "loading",
    profile: null,
    opportunities: [],
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setState({
        status: "loading",
        profile: null,
        opportunities: [],
        error: null,
      });

      try {
        const [profile, opportunities] = await Promise.all([
          getPublicCompany(companyId, controller.signal),
          getPublicCompanyOpportunities(companyId, controller.signal),
        ]);

        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: "ready",
          profile,
          opportunities: Array.isArray(opportunities) ? opportunities : [],
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: error instanceof ApiError && error.status === 404 ? "not-found" : "error",
          profile: null,
          opportunities: [],
          error,
        });
      }
    }

    load();
    return () => controller.abort();
  }, [companyId]);

  const heroMedia = useMemo(
    () => normalizeCompanyHeroMedia(state.profile?.heroMediaJson),
    [state.profile?.heroMediaJson]
  );
  const caseStudies = useMemo(
    () => normalizeCompanyCaseStudies(state.profile?.caseStudiesJson),
    [state.profile?.caseStudiesJson]
  );
  const gallery = useMemo(
    () => normalizeCompanyGallery(state.profile?.galleryJson),
    [state.profile?.galleryJson]
  );
  const stats = useMemo(
    () => buildPublicStats({ opportunities: state.opportunities, caseStudies, gallery }),
    [caseStudies, gallery, state.opportunities]
  );
  const opportunityRailItems = useMemo(
    () => state.opportunities.map(createOpportunityRailItem),
    [state.opportunities]
  );

  return (
    <main className="company-public-page" data-testid="company-public-page">
      <div className="company-public-page__shell ui-page-shell">
        <PortalHeader
          navItems={PUBLIC_HEADER_NAV_ITEMS}
          currentKey={undefined}
          actionHref={routes.auth.login}
          actionLabel="Войти / Регистрация"
          className="company-public-page__header"
        />

        {state.status === "loading" ? <Loader label="Загружаем страницу компании" surface /> : null}

        {state.status === "not-found" ? (
          <Card className="company-public-page__fallback">
            <EmptyState
              eyebrow="Компания не найдена"
              title="Публичная страница недоступна"
              description="Страница открывается только для подтвержденных компаний. Возможно, профиль еще на проверке или уже скрыт."
              actions={<Button href={routes.opportunities.catalog}>Вернуться в каталог</Button>}
            />
          </Card>
        ) : null}

        {state.status === "error" ? (
          <Alert tone="error" title="Не удалось загрузить страницу компании" showIcon>
            {state.error?.message ?? "Попробуйте открыть страницу позже."}
          </Alert>
        ) : null}

        {state.status === "ready" && state.profile ? (
          <div className="company-public-page__content">
            <CompanyProfileSummary
              profile={state.profile}
              stats={stats}
              verification={buildPublicVerification(state.profile)}
              mode="public"
            />

            <section className="company-public-page__about-grid">
              <CompanyHeroMediaPanel
                media={heroMedia}
                mode="viewer"
                compact
                eyebrow="О компании"
                title={heroMedia.title || "Видео-презентация и атмосфера команды"}
                description=""
              />

              <CompanyPortfolioCarousel
                mode="viewer"
                items={caseStudies}
                compact
                eyebrow="Кейсы"
                title="Портфолио компании"
                description="Здесь собраны кейсы, которые компания показывает соискателям и партнерам."
              />
            </section>

            <section className="company-public-page__section">
              <div className="company-public-page__section-top">
                <div className="company-public-page__section-copy">
                  <span className="company-public-page__section-eyebrow">Галерея</span>
                  <h2 className="company-public-page__section-title">Наш офис</h2>
                </div>
              </div>

              <CompanyGalleryPanel
                items={gallery}
                compact
                emptyTitle="Галерея пока не заполнена"
                emptyDescription="Когда компания добавит фото команды или офиса, они появятся в этой ленте."
              />
            </section>

            <section className="company-public-page__section">
              <div className="company-public-page__section-top">
                <div className="company-public-page__section-copy">
                  <span className="company-public-page__section-eyebrow">Возможности</span>
                  <h2 className="company-public-page__section-title">Возможности от компании</h2>
                </div>
                <AppLink href={routes.opportunities.catalog} className="company-public-page__section-link">
                  Все возможности →
                </AppLink>
              </div>

              {opportunityRailItems.length ? (
                <OpportunityBlockRail
                  items={opportunityRailItems}
                  className="company-public-page__opportunity-rail"
                  size="sm"
                  surface="panel"
                  cardPropsBuilder={(item) => ({
                    showSave: false,
                    detailAction: {
                      href: item.detailHref,
                      label: "Подробнее",
                      variant: "secondary",
                    },
                  })}
                />
              ) : (
                <Card className="company-public-page__empty-card">
                  <EmptyState
                    compact
                    tone="neutral"
                    title="Пока нет активных публикаций"
                    description="Когда компания разместит одобренные возможности, они автоматически появятся в этой ленте."
                  />
                </Card>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
