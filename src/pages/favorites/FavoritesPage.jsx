import { PUBLIC_HEADER_NAV_ITEMS, buildOpportunityDetailRoute, routes } from "../../app/routes";
import { PortalHeader } from "../../widgets/layout";
import { Button, DashboardPageHeader, EmptyState, OpportunityMiniCard } from "../../shared/ui";
import "./favorites-page.css";

const headerNav = PUBLIC_HEADER_NAV_ITEMS;

const FAVORITE_PLACEHOLDERS = [
  {
    id: "favorite-uiux-01",
    type: "Стажировка",
    status: "Активно",
    statusTone: "success",
    title: "UI/UX дизайнер (заглушка)",
    company: "Компания-партнер",
    accent: "Длительность: 8 недель",
    chips: ["Удаленно", "Junior", "Портфолио"],
  },
  {
    id: "favorite-frontend-02",
    type: "Практика",
    status: "Скоро старт",
    statusTone: "warning",
    title: "Frontend разработчик (заглушка)",
    company: "Технологический центр",
    accent: "Старт: через 5 дней",
    chips: ["React", "Наставник", "Гибкий график"],
  },
  {
    id: "favorite-analytics-03",
    type: "Курс",
    status: "Открыт набор",
    statusTone: "info",
    title: "Аналитик данных (заглушка)",
    company: "Образовательная платформа",
    accent: "Длительность: 6 недель",
    chips: ["SQL", "Python", "Сертификат"],
  },
];

export function FavoritesPage() {
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
            description="Сохраненные возможности собраны в одном месте. Сейчас раздел заполнен заглушками."
          />

          <div className="favorites-page__grid">
            {FAVORITE_PLACEHOLDERS.map((item) => (
              <OpportunityMiniCard
                key={item.id}
                item={item}
                detailAction={{
                  href: buildOpportunityDetailRoute(item.id),
                  label: "Открыть карточку",
                  variant: "secondary",
                }}
              />
            ))}
          </div>

          <EmptyState
            className="favorites-page__empty-state"
            eyebrow="Скоро здесь будут ваши реальные сохранения"
            title="Добавляйте новые возможности в избранное"
            description="Нажимайте на иконку сердца в карточках, чтобы быстро возвращаться к важным предложениям."
            actions={<Button href={routes.opportunities.catalog}>Перейти в каталог возможностей</Button>}
          />
        </section>
      </div>
    </main>
  );
}

