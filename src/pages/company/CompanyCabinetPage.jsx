import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { routes } from "../../app/routes";
import { getCompanyOpportunities, getCompanyProfile } from "../../api/company";
import { SessionLogoutButton } from "../../auth/SessionLogoutButton";
import { COMPANY_HEADER_NAV, COMPANY_SIDEBAR_ITEMS } from "../../company-dashboard/config";
import { buildCompanySummaryStats, loadCompanyApplications, translateVerificationStatus } from "../../company-dashboard/utils";
import { CompanyProfileSummary } from "../../features/company";
import { Card, Loader } from "../../shared/ui";
import { CabinetShell, CabinetSidebar, PortalHeader } from "../../widgets/layout";

function resolveCompanyActiveKey(pathname) {
  if (pathname.startsWith(routes.company.opportunities)) {
    return "opportunities";
  }

  if (pathname.startsWith(routes.company.responses)) {
    return "responses";
  }

  return "profile";
}

function SummaryFallback({ status }) {
  if (status === "loading") {
    return (
      <Card>
        <Loader label="Загружаем summary компании" surface />
      </Card>
    );
  }

  return (
    <Card>
      <p className="ui-type-body">Summary компании недоступен. Контент разделов остается доступным по route-level секциям.</p>
    </Card>
  );
}

function buildVerification(profile) {
  const status = profile?.verificationStatus ?? "pending";

  return {
    label: translateVerificationStatus(status),
    tone: status,
    statusText: status === "approved" ? "Готов к редактированию" : "Ожидает проверки",
    note: status === "approved"
      ? "Компания отображается в общем каталоге и может обновлять контент секциями."
      : "После проверки данные компании перейдут в активный режим публикации.",
  };
}

export function CompanyCabinetPage() {
  const location = useLocation();
  const activeKey = resolveCompanyActiveKey(location.pathname);
  const [state, setState] = useState({
    status: "loading",
    profile: null,
    opportunities: [],
    applications: [],
  });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const [profile, opportunities] = await Promise.all([
          getCompanyProfile(controller.signal),
          getCompanyOpportunities(controller.signal),
        ]);

        const normalizedOpportunities = Array.isArray(opportunities) ? opportunities : [];
        const applications = await loadCompanyApplications(normalizedOpportunities, controller.signal);

        setState({
          status: "ready",
          profile,
          opportunities: normalizedOpportunities,
          applications,
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

  const summary = state.status === "ready"
    ? (
      <CompanyProfileSummary
        profile={state.profile}
        stats={buildCompanySummaryStats(state)}
        verification={buildVerification(state.profile)}
      />
    )
    : <SummaryFallback status={state.status} />;

  return (
    <CabinetShell
      header={(
        <PortalHeader
          navItems={COMPANY_HEADER_NAV}
          currentKey={undefined}
          actionHref={routes.company.dashboard}
          actionLabel="Кабинет компании"
        />
      )}
      sidebar={(
        <CabinetSidebar
          title="Кабинет компании"
          items={COMPANY_SIDEBAR_ITEMS}
          activeKey={activeKey}
          footerSummary={<SessionLogoutButton />}
        />
      )}
      summary={summary}
      data-testid="company-cabinet-shell"
    >
      <Outlet />
    </CabinetShell>
  );
}
