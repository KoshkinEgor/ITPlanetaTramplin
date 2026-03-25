import { useEffect, useMemo, useState } from "react";
import { getCandidateContacts } from "../api/candidate";
import { ApiError } from "../lib/http";
import { Alert, Card, EmptyState, Loader } from "../shared/ui";
import { mapContactToCard } from "./mappers";
import { CandidateContactCard, CandidateSearchBar, CandidateSectionHeader } from "./shared";

export function CandidateContactsApp() {
  const [state, setState] = useState({ status: "loading", contacts: [], error: null });
  const [query, setQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const contacts = await getCandidateContacts(controller.signal);

        setState({
          status: "ready",
          contacts: Array.isArray(contacts) ? contacts : [],
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: error instanceof ApiError && error.status === 401 ? "unauthorized" : "error",
          contacts: [],
          error,
        });
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const items = state.contacts.map(mapContactToCard);

    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) => `${item.name} ${item.summary} ${item.tags.join(" ")}`.toLowerCase().includes(normalizedQuery));
  }, [query, state.contacts]);

  return (
    <section className="candidate-page-section">
      <CandidateSectionHeader title="РљРѕРЅС‚Р°РєС‚С‹" description="РЎРїРёСЃРѕРє С‚РµРїРµСЂСЊ Р·Р°РіСЂСѓР¶Р°РµС‚СЃСЏ РёР· backend, Р±РµР· Р»РѕРєР°Р»СЊРЅС‹С… РєР°СЂС‚РѕС‡РµРє Рё РґРµРјРѕ-РґР°РЅРЅС‹С…." />

      {state.status === "loading" ? <Loader label="Р—Р°РіСЂСѓР¶Р°РµРј РєРѕРЅС‚Р°РєС‚С‹" surface /> : null}

      {state.status === "unauthorized" ? (
        <Card>
          <EmptyState
            eyebrow="Р”РѕСЃС‚СѓРї РѕРіСЂР°РЅРёС‡РµРЅ"
            title="РќСѓР¶РЅРѕ РІРѕР№С‚Рё РєР°Рє РєР°РЅРґРёРґР°С‚"
            description="РљРѕРЅС‚Р°РєС‚С‹ РґРѕСЃС‚СѓРїРЅС‹ С‚РѕР»СЊРєРѕ Р°РІС‚РѕСЂРёР·РѕРІР°РЅРЅРѕРјСѓ РєР°РЅРґРёРґР°С‚Сѓ."
            tone="warning"
          />
        </Card>
      ) : null}

      {state.status === "error" ? (
        <Alert tone="error" title="РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РєРѕРЅС‚Р°РєС‚С‹" showIcon>
          {state.error?.message ?? "РџРѕРїСЂРѕР±СѓР№С‚Рµ РѕР±РЅРѕРІРёС‚СЊ СЃС‚СЂР°РЅРёС†Сѓ РїРѕР·Р¶Рµ."}
        </Alert>
      ) : null}

      {state.status === "ready" ? (
        <>
          <CandidateSearchBar value={query} onChange={setQuery} placeholder="РџРѕРёСЃРє РєРѕРЅС‚Р°РєС‚РѕРІ" />

          {visibleItems.length ? (
            <div className="candidate-page-grid candidate-page-grid--two">
              {visibleItems.map((contact) => (
                <CandidateContactCard key={contact.id} contact={contact} />
              ))}
            </div>
          ) : (
            <Card>
              <EmptyState
                eyebrow="РџСѓСЃС‚Рѕ"
                title="РљРѕРЅС‚Р°РєС‚С‹ РЅРµ РЅР°Р№РґРµРЅС‹"
                description={query ? "РЎР±СЂРѕСЃСЊС‚Рµ РїРѕРёСЃРє РёР»Рё РґРѕР±Р°РІСЊС‚Рµ РЅРѕРІС‹Рµ РєРѕРЅС‚Р°РєС‚С‹ С‡РµСЂРµР· СЂРµР°Р»СЊРЅС‹Рµ СЃС†РµРЅР°СЂРёРё РїР»Р°С‚С„РѕСЂРјС‹." : "РЈ РєР°РЅРґРёРґР°С‚Р° РїРѕРєР° РЅРµС‚ СЃРѕС…СЂР°РЅРµРЅРЅС‹С… РєРѕРЅС‚Р°РєС‚РѕРІ."}
                tone="neutral"
              />
            </Card>
          )}
        </>
      ) : null}
    </section>
  );
}
