import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { routes } from "../../app/routes";
import { getModerationDashboard } from "../../api/moderation";
import { HEADER_NAV, MODERATOR_SUMMARY, SIDEBAR_ITEMS } from "../../moderator-dashboard/config";
import { ModeratorProfileSummary } from "../../features/moderator";
import { Card, Loader } from "../../shared/ui";
import { CabinetShell, CabinetSidebar, PortalHeader } from "../../widgets/layout";
import "../../moderator-dashboard/moderator-dashboard.css";

function resolveModeratorActiveKey(pathname) {
  if (pathname.startsWith(routes.moderator.opportunities)) {
    return "opportunities";
  }

  if (pathname.startsWith(routes.moderator.companies)) {
    return "companies";
  }

  if (pathname.startsWith(routes.moderator.users)) {
    return "users";
  }

  if (pathname.startsWith(routes.moderator.complaints)) {
    return "complaints";
  }

  if (pathname.startsWith(routes.moderator.tagsSystem)) {
    return "tags-system";
  }

  if (pathname.startsWith(routes.moderator.logs)) {
    return "logs";
  }

  if (pathname.startsWith(routes.moderator.settings)) {
    return "settings";
  }

  return "dashboard";
}

function SummaryFallback({ status }) {
  if (status === "loading") {
    return (
      <Card>
        <Loader label="Загружаем summary модератора" surface />
      </Card>
    );
  }

  return (
    <Card>
      <p className="ui-type-body">Summary модератора недоступен. Структура кабинета и route-level разделы остаются на месте.</p>
    </Card>
  );
}

export function ModeratorCabinetPage() {
  const location = useLocation();
  const activeKey = resolveModeratorActiveKey(location.pathname);
  const [state, setState] = useState({ status: "loading", dashboard: null });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const dashboard = await getModerationDashboard(controller.signal);
        setState({ status: "ready", dashboard });
      } catch {
        if (!controller.signal.aborted) {
          setState({ status: "error", dashboard: null });
        }
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const navItems = HEADER_NAV;

  const summary = state.status === "ready"
    ? (
      <ModeratorProfileSummary
        summary={{
          eyebrow: "Кабинет модератора",
          title: "Модерация платформы",
          description: "Минимальный summary-блок остается на месте при переключении между dashboard, moderation и служебными разделами.",
          status: "Активная смена",
        }}
        metrics={[
          { value: String(state.dashboard?.opportunitiesPending ?? 0), label: "На проверке", note: "Возможности и публикации." },
          { value: String(state.dashboard?.companiesPending ?? 0), label: "Компании", note: "Ожидают верификации." },
          { value: String(state.dashboard?.totalUsers ?? 0), label: "Пользователи", note: "Всего профилей в системе." },
        ]}
      />
    )
    : <SummaryFallback status={state.status} />;

  return (
    <CabinetShell
      header={(
        <PortalHeader
          navItems={navItems}
          currentKey={undefined}
          actionHref={routes.auth.login}
          actionLabel="Войти / Регистрация"
        />
      )}
      sidebar={(
        <CabinetSidebar
          title="Кабинет модератора"
          items={SIDEBAR_ITEMS}
          activeKey={activeKey}
          footerSummary={(
            <div className="moderator-sidebar__summary">
              <span className="ui-type-caption">{MODERATOR_SUMMARY.eyebrow}</span>
              <strong>{MODERATOR_SUMMARY.count}</strong>
              <p className="ui-type-body">{MODERATOR_SUMMARY.text}</p>
            </div>
          )}
        />
      )}
      summary={summary}
      data-testid="moderator-cabinet-shell"
    >
      <Outlet />
    </CabinetShell>
  );
}
