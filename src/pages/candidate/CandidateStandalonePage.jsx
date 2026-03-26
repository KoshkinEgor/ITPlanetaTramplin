import { PUBLIC_HEADER_NAV_ITEMS, routes } from "../../app/routes";
import "../../candidate-portal/candidate-portal.css";
import { PortalHeader } from "../../widgets/layout";

const headerNav = PUBLIC_HEADER_NAV_ITEMS;

export function CandidateStandalonePage({ children }) {
  return (
    <main className="candidate-portal" data-testid="candidate-standalone-shell">
      <div className="candidate-portal__shell">
        <PortalHeader
          navItems={headerNav}
          currentKey="career"
          actionHref={routes.candidate.profile}
          actionLabel="Профиль"
          className="candidate-portal__header"
        />

        <div className="candidate-portal__content candidate-portal__content--standalone">
          {children}
        </div>
      </div>
    </main>
  );
}
