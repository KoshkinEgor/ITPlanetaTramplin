import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { routes } from "../../app/routes";
import { getCandidateEducation, getCandidateProfile } from "../../api/candidate";
import { useProtectedRouteAccess } from "../../auth/route-guards";
import { AUTH_ROLES } from "../../auth/session-utils";
import { isCandidateOnboardingComplete } from "../../candidate-portal/onboarding";
import { Loader } from "../../shared/ui";
import "./candidate-career.css";

export function CandidateAccessGuard() {
  const access = useProtectedRouteAccess({
    allowedRoles: [AUTH_ROLES.candidate],
    guestRedirectTo: routes.candidate.career,
  });
  const [state, setState] = useState({
    status: "loading",
    onboardingComplete: false,
  });

  useEffect(() => {
    if (access.status !== "allowed") {
      return undefined;
    }

    let active = true;
    const controller = new AbortController();

    setState({
      status: "loading",
      onboardingComplete: false,
    });

    Promise.all([
      getCandidateProfile(controller.signal),
      getCandidateEducation(controller.signal),
    ])
      .then(([profile, education]) => {
        if (!active) {
          return;
        }

        const educationItems = Array.isArray(education) ? education : [];

        setState({
          status: "ready",
          onboardingComplete: isCandidateOnboardingComplete(profile, educationItems),
        });
      })
      .catch(() => {
        if (active) {
          setState({
            status: "error",
            onboardingComplete: false,
          });
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [access.status]);

  if (access.status === "checking") {
    return (
      <main className="candidate-career-page candidate-career-page--loading">
        <div className="candidate-career-page__shell ui-page-shell">
          <Loader label="Проверяем доступ к карьерному профилю" surface />
        </div>
      </main>
    );
  }

  if (access.redirectTo) {
    return <Navigate to={access.redirectTo} replace />;
  }

  if (state.status === "loading") {
    return (
      <main className="candidate-career-page candidate-career-page--loading">
        <div className="candidate-career-page__shell ui-page-shell">
          <Loader label="Проверяем доступ к карьерному профилю" surface />
        </div>
      </main>
    );
  }

  if (state.status === "error" || !state.onboardingComplete) {
    return <Navigate to={routes.candidate.career} replace />;
  }

  return <Outlet />;
}
