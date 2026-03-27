import { OpportunityBlockCard } from "../components/opportunities";
import { Card, SectionHeader, Tag } from "../components/ui";
import { OVERVIEW_OPPORTUNITIES, RECENT_ACTIONS, RECOMMENDED_CONTACTS } from "./data";
import { CandidateContactCard, CandidateFrame, CandidateProfileHero } from "./shared";

export function CandidateOverviewApp() {
  return (
    <CandidateFrame activeKey="overview" hero={<CandidateProfileHero />}>
      <section className="candidate-page-section">
        <SectionHeader
          title="Рекомендуемые возможности"
          size="md"
          actions={
            <a href="../opportunities/opportunities-catalog.html" className="candidate-page-link">
              Все возможности
            </a>
          }
        />

        <div className="candidate-opportunity-rail" aria-label="Рекомендуемые возможности">
          {OVERVIEW_OPPORTUNITIES.map((item, index) => (
            <OpportunityBlockCard
              key={`${item.title}-${index}`}
              item={item}
              surface="panel"
              size="md"
              className="candidate-opportunity-rail__card"
              detailAction={{
                href: "../opportunities/opportunity-detail-card.html",
                label: "Подробнее",
                variant: "secondary",
              }}
            />
          ))}
        </div>
      </section>

      <div className="candidate-page-grid candidate-page-grid--two">
        <Card className="candidate-info-panel">
          <div className="candidate-info-panel__head">
            <Tag tone="accent">Рекомендуемые контакты</Tag>
            <a href="./candidate-contacts.html" className="candidate-page-link">
              Все рекомендации →
            </a>
          </div>

          <div className="candidate-info-panel__stack">
            {RECOMMENDED_CONTACTS.map((contact) => (
              <CandidateContactCard key={contact.id} contact={contact} variant="compact" />
            ))}
          </div>
        </Card>

        <Card className="candidate-info-panel">
          <div className="candidate-info-panel__head">
            <Tag tone="accent">Последние действия</Tag>
          </div>

          <div className="candidate-activity-list">
            {RECENT_ACTIONS.map((item) => (
              <a key={item} href="./candidate-responses.html" className="candidate-activity-list__item">
                {item}
              </a>
            ))}
          </div>
        </Card>
      </div>
    </CandidateFrame>
  );
}
