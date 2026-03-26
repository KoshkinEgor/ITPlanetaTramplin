import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { routes } from "../../app/routes";
import { Loader } from "../../shared/ui";
import { loadCandidateCareerContext } from "./candidate-access";
import "./candidate-career.css";

export function CandidateAccessGuard() {
  const [state, setState] = useState({
    status: "loading",
    data: null,
    error: null,
  });

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    loadCandidateCareerContext(controller.signal)
      .then((data) => {
        if (active) {
          setState({ status: "ready", data, error: null });
        }
      })
      .catch((error) => {
        if (active) {
          setState({ status: "error", data: null, error });
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  if (state.status === "loading") {
    return (
      <main className="candidate-career-page candidate-career-page--loading">
        <div className="candidate-career-page__shell">
          <Loader label="Проверяем доступ к карьерному профилю" surface />
        </div>
      </main>
    );
  }

  if (state.status === "error") {
    return <Navigate to={routes.candidate.career} replace />;
  }

  if (state.data?.redirectTo) {
    return <Navigate to={state.data.redirectTo} replace />;
  }

  if (state.data?.kind !== "candidate" || !state.data?.onboardingComplete) {
    return <Navigate to={routes.candidate.career} replace />;
  }

  return <Outlet />;
}
