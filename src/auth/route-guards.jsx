import { Navigate, Outlet } from "react-router-dom";
import { routes } from "../app/routes";
import { Loader } from "../shared/ui";
import { useAuthSession } from "./api";
import { getCabinetRouteForRole, normalizeAuthRole } from "./session-utils";

function normalizeAllowedRoles(allowedRoles) {
  return Array.isArray(allowedRoles)
    ? allowedRoles
      .map((role) => normalizeAuthRole(role))
      .filter(Boolean)
    : [];
}

export function resolveProtectedRouteAccess({
  session,
  allowedRoles,
  guestRedirectTo = routes.auth.login,
}) {
  const normalizedRoles = normalizeAllowedRoles(allowedRoles);

  if (session.status === "idle" || session.status === "loading") {
    return {
      status: "checking",
      user: session.user ?? null,
      redirectTo: null,
    };
  }

  if (session.status === "authenticated" && session.user) {
    const normalizedRole = normalizeAuthRole(session.user.role);
    const hasAccess = normalizedRoles.length === 0 || normalizedRoles.includes(normalizedRole);

    return hasAccess
      ? {
        status: "allowed",
        user: session.user,
        redirectTo: null,
      }
      : {
        status: "forbidden",
        user: session.user,
        redirectTo: getCabinetRouteForRole(normalizedRole),
      };
  }

  return {
    status: "unauthenticated",
    user: null,
    redirectTo: guestRedirectTo,
  };
}

export function useProtectedRouteAccess({ allowedRoles, guestRedirectTo }) {
  const session = useAuthSession();

  return resolveProtectedRouteAccess({
    session,
    allowedRoles,
    guestRedirectTo,
  });
}

export function AuthCheckingScreen({
  className,
  shellClassName,
  label = "Проверяем доступ к разделу",
}) {
  return (
    <main className={className}>
      <div className={shellClassName}>
        <Loader label={label} surface />
      </div>
    </main>
  );
}

export function ProtectedRoute({
  allowedRoles,
  guestRedirectTo,
  loadingFallback,
}) {
  const access = useProtectedRouteAccess({ allowedRoles, guestRedirectTo });

  if (access.status === "checking") {
    return loadingFallback ?? <AuthCheckingScreen />;
  }

  if (access.redirectTo) {
    return <Navigate to={access.redirectTo} replace />;
  }

  return <Outlet />;
}

export function GuestOnlyRoute({
  loadingFallback,
}) {
  const session = useAuthSession();

  if (session.status === "idle" || session.status === "loading") {
    return loadingFallback ?? <AuthCheckingScreen label="Восстанавливаем сессию" />;
  }

  if (session.status === "authenticated" && session.user) {
    return <Navigate to={getCabinetRouteForRole(session.user.role)} replace />;
  }

  return <Outlet />;
}
