import { RESPONSE_FILTERS, RESPONSE_ITEMS } from "./data";
import {
  CandidateFilterPill,
  CandidateFrame,
  CandidateProfileHero,
  CandidateResponseCard,
  CandidateSectionHeader,
  CandidateSortButton,
} from "./shared";

export function CandidateResponsesApp() {
  return (
    <CandidateFrame activeKey="responses" hero={<CandidateProfileHero />}>
      <section className="candidate-page-section">
        <CandidateSectionHeader eyebrow="Отклики" title="Мои отклики" description="Собери свой портфолио и резюме для точных рекомендаций." />

        <div className="candidate-filter-row">
          <div className="candidate-filter-row__group">
            {RESPONSE_FILTERS.map((filter, index) => (
              <CandidateFilterPill key={filter} label={filter} active={index === 0} />
            ))}
          </div>
          <CandidateSortButton />
        </div>

        <div className="candidate-page-stack">
          {RESPONSE_ITEMS.map((item) => (
            <CandidateResponseCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </CandidateFrame>
  );
}
