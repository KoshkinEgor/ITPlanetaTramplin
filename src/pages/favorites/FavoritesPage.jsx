import { useEffect, useMemo, useState } from "react";
import { getOpportunities } from "../../api/opportunities";
import { PUBLIC_HEADER_NAV_ITEMS, buildOpportunityDetailRoute, routes } from "../../app/routes";
import { OpportunityRowCard } from "../../components/opportunities";
import { readFavoriteOpportunityIds, subscribeToFavorites } from "../../features/favorites/storage";
import { PortalHeader } from "../../widgets/layout";
import { Alert, Button, DashboardPageHeader, EmptyState, Loader } from "../../shared/ui";
import "./favorites-page.css";

const headerNav = PUBLIC_HEADER_NAV_ITEMS;

function mapOpportunityType(value) {
  const normalizedType = String(value ?? "").trim().toLowerCase();

  if (normalizedType === "vacancy") return "Вакансия";
  if (normalizedType === "internship") return "Стажировка";
  if (normalizedType === "event") return "Мероприятие";

  return "Возможность";
}

function mapModerationStatus(value) {
  const normalizedStatus = String(value ?? "").trim().toLowerCase();

  if (normalizedStatus === "approved") {
    return { label: "Активно", tone: "success" };
  }

  if (normalizedStatus === "pending") {
    return { label: "На проверке", tone: "warning" };
  }

  return { label: "Актуально", tone: "neutral" };
}

function mapOpportunityToFavoriteCard(item) {
  const status = mapModerationStatus(item?.moderationStatus);

  return {
    id: String(item?.id ?? ""),
    type: mapOpportunityType(item?.opportunityType),
    status: status.label,
    statusTone: status.tone,
    title: item?.title ?? "Без названия",
    company: [item?.companyName, item?.locationCity].filter(Boolean).join(" · "),
    accent: item?.locationAddress ?? "",
    note: String(item?.description ?? "").trim(),
    chips: Array.isArray(item?.tags) ? item.tags.slice(0, 4) : [],
  };
}

export function FavoritesPage() {
  const [favoriteIds, setFavoriteIds] = useState(() => readFavoriteOpportunityIds());
  const [state, setState] = useState({ status: "idle", items: [], error: null });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    return subscribeToFavorites((ids) => {
      setFavoriteIds(ids);
    });
  }, []);

  const favoriteIdsKey = useMemo(() => favoriteIds.join("|"), [favoriteIds]);

  useEffect(() => {
    const controller = new AbortController();

    if (!favoriteIds.length) {
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

        const byId = new Map(
          (Array.isArray(allOpportunities) ? allOpportunities : [])
            .map((item) => [String(item?.id ?? ""), item])
            .filter(([id]) => id)
        );

        const resolvedItems = favoriteIds
          .map((id) => byId.get(id))
          .filter(Boolean)
          .map(mapOpportunityToFavoriteCard);

        setState({
          status: "ready",
          items: resolvedItems,
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
  }, [favoriteIds, favoriteIdsKey, reloadToken]);

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
            description={favoriteIds.length
              ? `Сохранено возможностей: ${favoriteIds.length}`
              : "Здесь появляются возможности, которые вы отметили сердцем."}
          />

          {state.status === "loading" ? <Loader label="Загружаем избранные возможности" surface /> : null}

          {state.status === "error" ? (
            <Alert tone="error" title="Не удалось загрузить избранные возможности" showIcon>
              <div className="favorites-page__error-actions">
                <p>{state.error?.message ?? "Попробуйте обновить список."}</p>
                <Button type="button" variant="secondary" onClick={() => setReloadToken((current) => current + 1)}>
                  Повторить
                </Button>
              </div>
            </Alert>
          ) : null}

          {state.status === "ready" && state.items.length ? (
            <div className="favorites-page__grid">
              {state.items.map((item) => (
                <OpportunityRowCard
                  key={item.id}
                  item={item}
                  surface="plain"
                  size="sm"
                  className="favorites-page__row-card"
                  detailAction={{
                    href: buildOpportunityDetailRoute(item.id),
                    label: "Открыть карточку",
                    variant: "secondary",
                  }}
                />
              ))}
            </div>
          ) : null}

          {state.status === "ready" && !state.items.length ? (
            <EmptyState
              className="favorites-page__empty-state"
              eyebrow="Пока здесь пусто"
              title="Добавляйте возможности в избранное"
              description="Нажимайте на иконку сердца в карточках возможностей. Мы сохраним id в localStorage для быстрого доступа."
              actions={<Button href={routes.opportunities.catalog}>Перейти в каталог возможностей</Button>}
            />
          ) : null}
        </section>
      </div>
    </main>
  );
}

