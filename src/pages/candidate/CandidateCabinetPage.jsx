import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { PUBLIC_HEADER_NAV_ITEMS, routes } from "../../app/routes";
import {
  getCandidateAchievements,
  getCandidateContacts,
  getCandidateEducation,
  getCandidateProfile,
  getCandidateProjects,
} from "../../api/candidate";
import { SessionLogoutButton } from "../../auth/SessionLogoutButton";
import { CANDIDATE_SIDEBAR_ITEMS } from "../../candidate-portal/config";
import { useCandidateApplications } from "../../candidate-portal/candidate-applications-store";
import { getProfileCompletion } from "../../candidate-portal/mappers";
import { CandidateProgressCard } from "../../candidate-portal/shared";
import { CandidateProfileSummary } from "../../features/candidate";
import { useBodyClass } from "../../shared/lib/useBodyClass";
import { Card, Loader } from "../../shared/ui";
import { CabinetShell, CabinetSidebar, PortalHeader } from "../../widgets/layout";

const headerNav = PUBLIC_HEADER_NAV_ITEMS;

function resolveCandidateActiveKey(pathname) {
  if (pathname.startsWith("/candidate/resume") || pathname.startsWith("/candidate/projects")) {
    return "portfolio";
  }

  if (pathname.startsWith(routes.candidate.responses)) {
    return "responses";
  }

  if (pathname.startsWith(routes.candidate.contacts)) {
    return "contacts";
  }

  if (pathname.startsWith(routes.candidate.settings)) {
    return "settings";
  }

  return "overview";
}

function buildStats(education, achievements, projects, applications, contacts) {
  return [
    { value: String(applications.length), label: "Отклики" },
    { value: String(projects.length), label: "Проекты" },
    { value: String(contacts.length), label: "Контакты" },
    { value: String(education.length + achievements.length), label: "Достижения" },
  ];
}

function SummaryFallback({ status }) {
  if (status === "loading") {
    return (
      <Card>
        <Loader label="Загружаем summary кандидата" surface />
      </Card>
    );
  }

  return (
    <Card>
      <p className="ui-type-body">Summary кандидата недоступен. Контент раздела остаётся доступным отдельно.</p>
    </Card>
  );
}

export function CandidateCabinetPage() {
  useBodyClass("candidate-portal-react-body");

  const applicationsState = useCandidateApplications();
  const location = useLocation();
  const activeKey = resolveCandidateActiveKey(location.pathname);
  const [state, setState] = useState({
    status: "loading",
    profile: null,
    education: [],
    achievements: [],
    projects: [],
    contacts: [],
  });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const [profile, education, achievements, projects, contacts] = await Promise.all([
          getCandidateProfile(controller.signal),
          getCandidateEducation(controller.signal),
          getCandidateAchievements(controller.signal),
          getCandidateProjects(controller.signal),
          getCandidateContacts(controller.signal),
        ]);

        setState({
          status: "ready",
          profile,
          education: Array.isArray(education) ? education : [],
          achievements: Array.isArray(achievements) ? achievements : [],
          projects: Array.isArray(projects) ? projects : [],
          contacts: Array.isArray(contacts) ? contacts : [],
        });
      } catch {
        if (!controller.signal.aborted) {
          setState((current) => ({ ...current, status: "error" }));
        }
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const completion = useMemo(
    () => getProfileCompletion(state.profile, state.education, state.achievements, state.projects),
    [state.achievements, state.education, state.profile, state.projects]
  );

  const stats = useMemo(
    () => buildStats(state.education, state.achievements, state.projects, applicationsState.applications, state.contacts),
    [applicationsState.applications, state.achievements, state.contacts, state.education, state.projects]
  );

  const summary = state.status === "ready"
    ? (
      <CandidateProfileSummary
        profile={state.profile}
        stats={stats}
        completion={completion}
        variant={activeKey === "overview" ? "full" : "compact"}
      />
    )
    : <SummaryFallback status={state.status} />;

  return (
    <CabinetShell
      header={(
        <PortalHeader
          navItems={headerNav}
          currentKey="career"
          actionHref={routes.candidate.profile}
          actionLabel="Профиль"
        />
      )}
      sidebar={(
        <CabinetSidebar
          title="Личный кабинет"
          items={CANDIDATE_SIDEBAR_ITEMS}
          activeKey={activeKey}
          footerSummary={(
            <div className="cabinet-sidebar__footer-stack">
              <CandidateProgressCard
                value={completion}
                note="Чем полнее профиль, тем точнее рекомендации и отклики работодателей."
              />
              <SessionLogoutButton />
            </div>
          )}
        />
      )}
      summary={summary}
      data-testid="candidate-cabinet-shell"
    >
      <Outlet context={{ profile: state.profile }} />
    </CabinetShell>
  );
}
