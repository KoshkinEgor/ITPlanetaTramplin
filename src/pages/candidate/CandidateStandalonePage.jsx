import { routes } from "../../app/routes";
import "../../candidate-portal/candidate-portal.css";
import { PortalHeader } from "../../widgets/layout";

const headerNav = [
  { key: "opportunities", label: "Возможности", href: routes.opportunities.catalog },
  { key: "career", label: "Карьера", href: routes.candidate.profile },
  { key: "about", label: "О платформе", href: routes.homeAbout },
];

export function CandidateStandalonePage({ children }) {
  return (
    <main className="candidate-portal" data-testid="candidate-standalone-shell">
      <div className="candidate-portal__shell">
        <PortalHeader
          navItems={headerNav}
          currentKey="opportunities"
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
