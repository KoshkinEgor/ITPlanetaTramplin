import { PUBLIC_HEADER_NAV_ITEMS, routes } from "../../app/routes";
import "../../candidate-portal/candidate-portal.css";
import { useBodyClass } from "../../shared/lib/useBodyClass";
import { PortalHeader } from "../../widgets/layout";

const headerNav = PUBLIC_HEADER_NAV_ITEMS;

export function CandidateStandalonePage({ children }) {
  useBodyClass("candidate-portal-react-body");

  return (
    <main className="candidate-portal" data-testid="candidate-standalone-shell">
      <div className="candidate-portal__shell ui-page-shell">
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
