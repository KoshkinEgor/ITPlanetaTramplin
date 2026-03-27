import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { routes } from "../../app/routes";
import { getModerationDashboard } from "../../api/moderation";
import { SessionLogoutButton } from "../../auth/SessionLogoutButton";
import { HEADER_NAV, SIDEBAR_ITEMS } from "../../moderator-dashboard/config";
import { ModeratorProfileSummary } from "../../features/moderator";
import { useBodyClass } from "../../shared/lib/useBodyClass";
import { Card, Loader } from "../../shared/ui";
import { CabinetShell, CabinetSidebar, PortalHeader } from "../../widgets/layout";
import "../../moderator-dashboard/moderator-dashboard.css";

function resolveModeratorActiveKey(pathname) {
  if (pathname.startsWith(routes.moderator.opportunities)) {
    return "opportunities";
  }

  if (pathname.startsWith(routes.moderator.invitations)) {
    return "invitations";
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
        <Loader label="Загружаем обзор кабинета модератора" surface />
      </Card>
    );
  }

  return (
    <Card>
      <p className="ui-type-body">Обзор временно недоступен. Разделы кабинета и рабочие маршруты продолжают работать.</p>
    </Card>
  );
}

export function ModeratorCabinetPage() {
  useBodyClass("moderator-dashboard-react-body");

  const location = useLocation();
  const activeKey = resolveModeratorActiveKey(location.pathname);
  const [state, setState] = useState({ status: activeKey === "dashboard" ? "loading" : "idle", dashboard: null });

  useEffect(() => {
    if (activeKey !== "dashboard") {
      setState({ status: "idle", dashboard: null });
      return undefined;
    }

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
  }, [activeKey]);

  const summary =
    activeKey !== "dashboard"
      ? null
      : state.status === "ready"
        ? (
          <ModeratorProfileSummary
            summary={{
              eyebrow: "Кабинет модератора",
              title: "Модерация платформы",
              description: "Следите за очередью проверок, приглашайте новых модераторов и держите под контролем ключевые процессы платформы.",
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
          navItems={HEADER_NAV}
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
          footerSummary={<SessionLogoutButton />}
        />
      )}
      summary={summary}
      data-testid="moderator-cabinet-shell"
    >
      <Outlet />
    </CabinetShell>
  );
}

