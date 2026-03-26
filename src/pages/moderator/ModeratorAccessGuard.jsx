import { Navigate, Outlet } from "react-router-dom";
import { useProtectedRouteAccess } from "../../auth/route-guards";
import { AUTH_ROLES, getLoginRouteForRole } from "../../auth/session-utils";
import { Loader } from "../../shared/ui";
import "../../moderator-dashboard/moderator-dashboard.css";

export function ModeratorAccessGuard() {
  const access = useProtectedRouteAccess({
    allowedRoles: [AUTH_ROLES.moderator],
    guestRedirectTo: getLoginRouteForRole(AUTH_ROLES.moderator),
  });

  if (access.status === "checking") {
    return (
      <main className="moderator-dashboard">
        <div className="moderator-dashboard__shell ui-page-shell">
          <Loader label="Проверяем доступ к кабинету модератора" surface />
        </div>
      </main>
    );
  }

  if (access.redirectTo) {
    return <Navigate to={access.redirectTo} replace />;
  }

  return <Outlet />;
}
