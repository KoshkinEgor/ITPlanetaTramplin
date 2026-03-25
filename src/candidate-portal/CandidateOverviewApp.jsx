import { useEffect, useMemo, useState } from "react";
import { OpportunityBlockCard } from "../components/opportunities";
import { getCandidateApplications, getCandidateContacts } from "../api/candidate";
import { getOpportunities } from "../api/opportunities";
import { ApiError } from "../lib/http";
import { Alert, Card, EmptyState, Loader, Tag } from "../shared/ui";
import { mapCandidateApplicationToCard, mapContactToCard } from "./mappers";
import { CandidateContactCard, CandidateSectionHeader } from "./shared";

function mapOpportunityCard(item) {
  return {
    type: item.opportunityType || "Р’РѕР·РјРѕР¶РЅРѕСЃС‚СЊ",
    status: item.moderationStatus === "approved" ? "РћРїСѓР±Р»РёРєРѕРІР°РЅРѕ" : item.moderationStatus,
    statusTone: item.moderationStatus === "approved" ? "success" : "warning",
    title: item.title,
    company: `${item.companyName}${item.locationCity ? ` В· ${item.locationCity}` : ""}`,
    accent: item.employmentType || "",
    chips: Array.isArray(item.tags) ? item.tags.slice(0, 4) : [],
  };
}

export function CandidateOverviewApp() {
  const [state, setState] = useState({
    status: "loading",
    applications: [],
    contacts: [],
    opportunities: [],
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const [applications, contacts, opportunities] = await Promise.all([
          getCandidateApplications(controller.signal),
          getCandidateContacts(controller.signal),
          getOpportunities(controller.signal),
        ]);

        setState({
          status: "ready",
          applications: Array.isArray(applications) ? applications : [],
          contacts: Array.isArray(contacts) ? contacts : [],
          opportunities: Array.isArray(opportunities) ? opportunities : [],
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState((current) => ({
          ...current,
          status: error instanceof ApiError && error.status === 401 ? "unauthorized" : "error",
          error,
        }));
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const topOpportunities = useMemo(() => state.opportunities.slice(0, 3).map(mapOpportunityCard), [state.opportunities]);
  const topContacts = useMemo(() => state.contacts.slice(0, 3).map(mapContactToCard), [state.contacts]);
  const recentApplications = useMemo(() => state.applications.slice(0, 3).map(mapCandidateApplicationToCard), [state.applications]);

  return (
    <>
      {state.status === "loading" ? <Loader label="Р—Р°РіСЂСѓР¶Р°РµРј РїСЂРѕС„РёР»СЊ РєР°РЅРґРёРґР°С‚Р°" surface /> : null}

      {state.status === "unauthorized" ? (
        <Card>
          <EmptyState
            eyebrow="Р”РѕСЃС‚СѓРї РѕРіСЂР°РЅРёС‡РµРЅ"
            title="РќСѓР¶РЅРѕ РІРѕР№С‚Рё РєР°Рє РєР°РЅРґРёРґР°С‚"
            description="РџСЂРѕС„РёР»СЊ С‚РµРїРµСЂСЊ СЃС‚СЂРѕРёС‚СЃСЏ С†РµР»РёРєРѕРј РёР· СЂРµР°Р»СЊРЅС‹С… API Рё РЅРµ СЂРµРЅРґРµСЂРёС‚СЃСЏ Р±РµР· Р°РІС‚РѕСЂРёР·Р°С†РёРё."
            tone="warning"
          />
        </Card>
      ) : null}

      {state.status === "error" ? (
        <Alert tone="error" title="РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РїСЂРѕС„РёР»СЊ" showIcon>
          {state.error?.message ?? "РџРѕРїСЂРѕР±СѓР№С‚Рµ РѕР±РЅРѕРІРёС‚СЊ СЃС‚СЂР°РЅРёС†Сѓ РїРѕР·Р¶Рµ."}
        </Alert>
      ) : null}

      {state.status === "ready" ? (
        <>
          <section className="candidate-page-section">
            <CandidateSectionHeader
              title="Р РµРєРѕРјРµРЅРґСѓРµРјС‹Рµ РІРѕР·РјРѕР¶РЅРѕСЃС‚Рё"
              description="Р›РµРЅС‚Р° Р±РµСЂРµС‚ РґР°РЅРЅС‹Рµ РёР· РїСѓР±Р»РёС‡РЅРѕРіРѕ РєР°С‚Р°Р»РѕРіР° `/api/opportunities`."
            />

            {topOpportunities.length ? (
              <div className="candidate-opportunity-rail" aria-label="Р РµРєРѕРјРµРЅРґСѓРµРјС‹Рµ РІРѕР·РјРѕР¶РЅРѕСЃС‚Рё">
                {topOpportunities.map((item, index) => (
                  <OpportunityBlockCard
                    key={`${item.title}-${index}`}
                    item={item}
                    surface="panel"
                    size="md"
                    className="candidate-opportunity-rail__card"
                    detailAction={{ href: "/opportunities", label: "РћС‚РєСЂС‹С‚СЊ РєР°С‚Р°Р»РѕРі", variant: "secondary" }}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <EmptyState
                  eyebrow="РљР°С‚Р°Р»РѕРі РїСѓСЃС‚"
                  title="РџРѕРєР° РЅРµС‚ РѕРґРѕР±СЂРµРЅРЅС‹С… РІРѕР·РјРѕР¶РЅРѕСЃС‚РµР№"
                  description="РџРѕСЃР»Рµ РјРѕРґРµСЂР°С†РёРё РЅРѕРІС‹С… РїСѓР±Р»РёРєР°С†РёР№ РєР°СЂС‚РѕС‡РєРё РїРѕСЏРІСЏС‚СЃСЏ Р·РґРµСЃСЊ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё."
                  tone="neutral"
                />
              </Card>
            )}
          </section>

          <section className="candidate-page-section">
            <CandidateSectionHeader
              eyebrow="РђРєС‚РёРІРЅРѕСЃС‚СЊ"
              title="РџРѕСЃР»РµРґРЅРёРµ РѕС‚РєР»РёРєРё"
              description="РЎС‚Р°С‚СѓСЃС‹ Рё РєРѕРјРїР°РЅРёРё С‡РёС‚Р°СЋС‚СЃСЏ РёР· `/api/candidate/me/applications`."
            />

            {recentApplications.length ? (
              <div className="candidate-page-stack">
                {recentApplications.map((item) => (
                  <Card key={item.id} className="candidate-page-panel">
                    <div className="candidate-page-panel__stack">
                      <div className="candidate-page-panel__row">
                        <h3 className="ui-type-h3">{item.title}</h3>
                        <Tag>{item.statusLabel}</Tag>
                      </div>
                      <p className="ui-type-body">{item.company}</p>
                      <p className="ui-type-body">{item.description}</p>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <EmptyState
                  eyebrow="РџСѓСЃС‚Рѕ"
                  title="РћС‚РєР»РёРєРѕРІ РїРѕРєР° РЅРµС‚"
                  description="РљРѕРіРґР° РєР°РЅРґРёРґР°С‚ РѕС‚РєР»РёРєРЅРµС‚СЃСЏ РЅР° СЂРµР°Р»СЊРЅСѓСЋ РІРѕР·РјРѕР¶РЅРѕСЃС‚СЊ, СЃС‚Р°С‚СѓСЃ РїРѕСЏРІРёС‚СЃСЏ РІ СЌС‚РѕРј Р±Р»РѕРєРµ."
                  tone="neutral"
                />
              </Card>
            )}
          </section>

          <section className="candidate-page-section">
            <CandidateSectionHeader
              eyebrow="РљРѕРЅС‚Р°РєС‚С‹"
              title="РЎРІСЏР·Рё РєР°РЅРґРёРґР°С‚Р°"
              description="РљРѕРЅС‚Р°РєС‚С‹ Р±РµСЂСѓС‚СЃСЏ РёР· `/api/candidate/me/contacts`."
            />

            {topContacts.length ? (
              <div className="candidate-page-grid candidate-page-grid--three">
                {topContacts.map((contact) => (
                  <CandidateContactCard key={contact.id} contact={contact} variant="compact" />
                ))}
              </div>
            ) : (
              <Card>
                <EmptyState
                  eyebrow="РќРµС‚ РєРѕРЅС‚Р°РєС‚РѕРІ"
                  title="РЎРІСЏР·Рё РїРѕРєР° РЅРµ РґРѕР±Р°РІР»РµРЅС‹"
                  description="РљРѕРЅС‚Р°РєС‚С‹ РїРѕСЏРІСЏС‚СЃСЏ РїРѕСЃР»Рµ СЂРµР°Р»СЊРЅС‹С… РІР·Р°РёРјРѕРґРµР№СЃС‚РІРёР№ РєР°РЅРґРёРґР°С‚Р° СЃ РґСЂСѓРіРёРјРё РїСЂРѕС„РёР»СЏРјРё."
                  tone="neutral"
                />
              </Card>
            )}
          </section>
        </>
      ) : null}
    </>
  );
}
