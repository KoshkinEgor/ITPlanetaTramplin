import { Navigate, Outlet } from "react-router-dom";
import { routes } from "../../app/routes";
import { useProtectedRouteAccess } from "../../auth/route-guards";
import { AUTH_ROLES } from "../../auth/session-utils";
import { Loader } from "../../shared/ui";
import "./candidate-career.css";

export function CandidateAccessGuard() {
  const access = useProtectedRouteAccess({
    allowedRoles: [AUTH_ROLES.candidate],
    guestRedirectTo: routes.candidate.career,
  });

  if (access.status === "checking") {
    return (
      <main className="candidate-career-page candidate-career-page--loading">
        <div className="candidate-career-page__shell ui-page-shell">
          <Loader label="Проверяем доступ к кабинету кандидата" surface />
        </div>
      </main>
    );
  }

  if (access.redirectTo) {
    return <Navigate to={access.redirectTo} replace />;
  }

  return <Outlet />;
}
