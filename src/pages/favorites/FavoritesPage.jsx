import { useEffect, useMemo, useState } from "react";
import { getOpportunities } from "../../api/opportunities";
import { PUBLIC_HEADER_NAV_ITEMS, buildCompanyPublicRoute, buildOpportunityDetailRoute, routes } from "../../app/routes";
import { OpportunityRowCard } from "../../components/opportunities";
import {
  readFavoriteCompanyIds,
  readFavoriteOpportunityIds,
  setFavoriteCompany,
  subscribeToFavorites,
} from "../../features/favorites/storage";
import { translateOpportunityType } from "../../shared/lib/opportunityTypes";
import { Alert, Button, Card, CompanyVacancyTile, DashboardPageHeader, EmptyState, Loader, SectionHeader, Tag } from "../../shared/ui";
import { PortalHeader } from "../../widgets/layout";
import "./favorites-page.css";

const headerNav = PUBLIC_HEADER_NAV_ITEMS;

function formatCount(count, [one, few, many]) {
  const absolute = Math.abs(count) % 100;
  const tail = absolute % 10;

  if (absolute > 10 && absolute < 20) {
    return `${count} ${many}`;
  }

  if (tail === 1) {
    return `${count} ${one}`;
  }

  if (tail >= 2 && tail <= 4) {
    return `${count} ${few}`;
  }

  return `${count} ${many}`;
}

function mapModerationStatus(value) {
  const normalizedStatus = String(value ?? "").trim().toLowerCase();

  if (normalizedStatus === "approved") {
    return { label: "Активно", tone: "success" };
  }

  if (normalizedStatus === "pending") {
    return { label: "На проверке", tone: "warning" };
  }

  if (normalizedStatus === "revision") {
    return { label: "Нужна доработка", tone: "warning" };
  }

  if (normalizedStatus === "rejected") {
    return { label: "Отклонено", tone: "error" };
  }

  return { label: "Актуально", tone: "neutral" };
}

function mapOpportunityToFavoriteCard(item) {
  const status = mapModerationStatus(item?.moderationStatus);

  return {
    id: String(item?.id ?? ""),
    type: translateOpportunityType(item?.opportunityType),
    status: status.label,
    statusTone: status.tone,
    title: item?.title ?? "Без названия",
    company: [item?.companyName, item?.locationCity].filter(Boolean).join(" · "),
    accent: item?.locationAddress ?? "",
    note: String(item?.description ?? "").trim(),
    chips: Array.isArray(item?.tags) ? item.tags.slice(0, 4) : [],
  };
}

function buildFavoriteCompanies(items, favoriteCompanyIds) {
  const groupedCompanies = new Map();

  (Array.isArray(items) ? items : []).forEach((item) => {
    const employerId = item?.employerId != null ? String(item.employerId) : "";

    if (!employerId || !favoriteCompanyIds.includes(employerId)) {
      return;
    }

    const entry = groupedCompanies.get(employerId) ?? {
      id: employerId,
      employerId,
      name: String(item?.companyName ?? "").trim() || `Компания #${employerId}`,
      city: String(item?.locationCity ?? "").trim(),
      opportunities: [],
    };

    entry.opportunities.push(item);
    if (!entry.city && item?.locationCity) {
      entry.city = String(item.locationCity).trim();
    }

    groupedCompanies.set(employerId, entry);
  });

  return favoriteCompanyIds.map((companyId) => {
    const entry = groupedCompanies.get(companyId);

    if (entry) {
      return {
        ...entry,
        count: entry.opportunities.length,
      };
    }

    return {
      id: companyId,
      employerId: companyId,
      name: `Компания #${companyId}`,
      city: "",
      count: 0,
      opportunities: [],
    };
  });
}

function createHeaderDescription(opportunityCount, companyCount) {
  if (!opportunityCount && !companyCount) {
    return "Здесь появляются компании и возможности, которые вы отметили сердцем.";
  }

  return [
    formatCount(opportunityCount, ["возможность", "возможности", "возможностей"]),
    formatCount(companyCount, ["компания", "компании", "компаний"]),
  ].join(" · ");
}

export function FavoritesPage() {
  const [favoriteOpportunityIds, setFavoriteOpportunityIds] = useState(() => readFavoriteOpportunityIds());
  const [favoriteCompanyIds, setFavoriteCompanyIds] = useState(() => readFavoriteCompanyIds());
  const [state, setState] = useState({ status: "idle", items: [], error: null });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => subscribeToFavorites(setFavoriteOpportunityIds, { scope: "opportunities" }), []);
  useEffect(() => subscribeToFavorites(setFavoriteCompanyIds, { scope: "companies" }), []);

  useEffect(() => {
    const controller = new AbortController();

    if (!favoriteOpportunityIds.length && !favoriteCompanyIds.length) {
      setState({ status: "ready", items: [], error: null });
      return () => controller.abort();
    }

    async function loadFavoriteItems() {
      setState((current) => ({ ...current, status: "loading", error: null }));

      try {
        const allOpportunities = await getOpportunities(controller.signal);

        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: "ready",
          items: Array.isArray(allOpportunities) ? allOpportunities : [],
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: "error",
          items: [],
          error,
        });
      }
    }

    loadFavoriteItems();

    return () => {
      controller.abort();
    };
  }, [favoriteCompanyIds.length, favoriteOpportunityIds.length, reloadToken]);

  const favoriteOpportunities = useMemo(() => {
    const itemsById = new Map(
      state.items
        .map((item) => [String(item?.id ?? ""), item])
        .filter(([id]) => id)
    );

    return favoriteOpportunityIds
      .map((id) => itemsById.get(String(id)))
      .filter(Boolean)
      .map(mapOpportunityToFavoriteCard);
  }, [favoriteOpportunityIds, state.items]);

  const favoriteCompanies = useMemo(
    () => buildFavoriteCompanies(state.items, favoriteCompanyIds),
    [favoriteCompanyIds, state.items]
  );

  const hasFavoriteOpportunities = favoriteOpportunities.length > 0;
  const hasFavoriteCompanies = favoriteCompanies.length > 0;
  const isEmptyFavorites = !hasFavoriteOpportunities && !hasFavoriteCompanies;

  return (
    <main className="favorites-page">
      <div className="favorites-page__shell ui-page-shell">
        <PortalHeader
          navItems={headerNav}
          currentKey={undefined}
          actionHref={routes.auth.login}
          actionLabel="Войти / Регистрация"
          className="favorites-page__header"
        />

        <section className="favorites-page__content">
          <DashboardPageHeader
            title="Избранное"
            description={createHeaderDescription(favoriteOpportunities.length, favoriteCompanies.length)}
          />

          {state.status === "loading" ? <Loader label="Загружаем избранное" surface /> : null}

          {state.status === "error" ? (
            <Alert tone="error" title="Не удалось загрузить избранное" showIcon>
              <div className="favorites-page__error-actions">
                <p>{state.error?.message ?? "Попробуйте обновить список."}</p>
                <Button type="button" variant="secondary" onClick={() => setReloadToken((current) => current + 1)}>
                  Повторить
                </Button>
              </div>
            </Alert>
          ) : null}

          {state.status === "ready" ? (
            <>
              {isEmptyFavorites ? (
                <EmptyState
                  className="favorites-page__empty-state"
                  eyebrow="Пока пусто"
                  title="Соберите избранное"
                  description="Нажимайте на сердечко в карточках возможностей и компаний, чтобы быстро вернуться к ним позже."
                  actions={<Button href={routes.opportunities.catalog}>Перейти в каталог</Button>}
                />
              ) : null}

              {hasFavoriteOpportunities ? (
                <section className="favorites-page__section">
                  <div className="favorites-page__section-head">
                    <SectionHeader
                      size="md"
                      title="Избранные возможности"
                      description="Карточки, которые вы сохранили напрямую."
                    />
                    <Tag tone="accent">{formatCount(favoriteOpportunities.length, ["карточка", "карточки", "карточек"])}</Tag>
                  </div>

                  <div className="favorites-page__grid">
                    {favoriteOpportunities.map((item) => (
                      <OpportunityRowCard
                        key={item.id}
                        item={item}
                        surface="plain"
                        size="sm"
                        className="favorites-page__row-card"
                        favoritePressed
                        favoriteLabel="Убрать возможность из избранного"
                        detailAction={{
                          href: buildOpportunityDetailRoute(item.id),
                          label: "Открыть карточку",
                          variant: "secondary",
                        }}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {hasFavoriteCompanies ? (
                <section className="favorites-page__section">
                  <div className="favorites-page__section-head">
                    <SectionHeader
                      size="md"
                      title="Избранные компании"
                      description="Здесь собраны работодатели, за чьими публикациями вы хотите следить."
                    />
                    <Tag tone="accent">{formatCount(favoriteCompanies.length, ["компания", "компании", "компаний"])}</Tag>
                  </div>

                  <div className="favorites-page__company-grid">
                    {favoriteCompanies.map((company) => (
                      <Card key={company.id} className="favorites-page__company-card">
                        <CompanyVacancyTile
                          href={buildCompanyPublicRoute(company.employerId)}
                          name={company.name}
                          count={formatCount(company.count, ["публикация", "публикации", "публикаций"])}
                          showFavorite
                          favoritePressed
                          favoriteLabel="Убрать компанию из избранного"
                          onFavoriteClick={() => setFavoriteCompany(company.employerId, false)}
                        />
                        <div className="favorites-page__company-meta">
                          <p>{company.city || "Город пока не указан"}</p>
                          <p>
                            {company.opportunities.length
                              ? company.opportunities
                                  .slice(0, 2)
                                  .map((item) => item.title)
                                  .filter(Boolean)
                                  .join(" · ")
                              : "Компания появится здесь, как только у неё будут публичные карточки в текущем каталоге."}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}
