import { Outlet, useLocation } from "react-router-dom";
import { routes } from "../../app/routes";
import { SessionLogoutButton } from "../../auth/SessionLogoutButton";
import { HEADER_NAV, SIDEBAR_ITEMS } from "../../moderator-dashboard/config";
import { useBodyClass } from "../../shared/lib/useBodyClass";
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

export function ModeratorCabinetPage() {
  useBodyClass("moderator-dashboard-react-body");

  const location = useLocation();
  const activeKey = resolveModeratorActiveKey(location.pathname);

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
      summary={null}
      data-testid="moderator-cabinet-shell"
    >
      <Outlet />
    </CabinetShell>
  );
}

