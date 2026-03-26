import { ProtectedRoute } from "../../auth/route-guards";
import { AUTH_ROLES, getLoginRouteForRole } from "../../auth/session-utils";

export function CompanyAccessGuard() {
  return (
    <ProtectedRoute
      allowedRoles={[AUTH_ROLES.company]}
      guestRedirectTo={getLoginRouteForRole(AUTH_ROLES.company)}
    />
  );
}
