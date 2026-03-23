import { useState } from "react";
import { CONTACT_ITEMS } from "./data";
import { CandidateContactCard, CandidateFrame, CandidateProfileHero, CandidateSearchBar, CandidateSectionHeader } from "./shared";

export function CandidateContactsApp() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const visibleItems = CONTACT_ITEMS.filter((item) => {
    if (!normalizedQuery) {
      return true;
    }

    return `${item.name} ${item.summary} ${item.tags.join(" ")}`.toLowerCase().includes(normalizedQuery);
  });

  return (
    <CandidateFrame activeKey="contacts" hero={<CandidateProfileHero />}>
      <section className="candidate-page-section">
        <CandidateSectionHeader title="Контакты" />
        <CandidateSearchBar value={query} onChange={setQuery} placeholder="Поиск контактов" />

        <div className="candidate-page-grid candidate-page-grid--two">
          {visibleItems.map((contact) => (
            <CandidateContactCard key={contact.id} contact={contact} />
          ))}
        </div>
      </section>
    </CandidateFrame>
  );
}
