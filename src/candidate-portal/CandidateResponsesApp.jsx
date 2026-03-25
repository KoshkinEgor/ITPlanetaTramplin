import { useEffect, useMemo, useState } from "react";
import { getCandidateApplications } from "../api/candidate";
import { ApiError } from "../lib/http";
import { Alert, Card, EmptyState, Loader } from "../shared/ui";
import { RESPONSE_FILTERS } from "./config";
import { mapCandidateApplicationToCard } from "./mappers";
import { CandidateFilterPill, CandidateResponseCard, CandidateSectionHeader, CandidateSortButton } from "./shared";

export function CandidateResponsesApp() {
  const [state, setState] = useState({ status: "loading", applications: [], error: null });
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const applications = await getCandidateApplications(controller.signal);

        setState({
          status: "ready",
          applications: Array.isArray(applications) ? applications : [],
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: error instanceof ApiError && error.status === 401 ? "unauthorized" : "error",
          applications: [],
          error,
        });
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const filteredItems = useMemo(() => {
    if (statusFilter === "all") {
      return state.applications.map(mapCandidateApplicationToCard);
    }

    return state.applications
      .filter((item) => item.status === statusFilter)
      .map(mapCandidateApplicationToCard);
  }, [state.applications, statusFilter]);

  return (
    <section className="candidate-page-section">
      <CandidateSectionHeader eyebrow="РћС‚РєР»РёРєРё" title="РњРѕРё РѕС‚РєР»РёРєРё" description="Р Р°Р·РґРµР» С‡РёС‚Р°РµС‚ СЃС‚Р°С‚СѓСЃС‹ РёР· `/api/candidate/me/applications`, Р±РµР· Р»РѕРєР°Р»СЊРЅС‹С… Р·Р°РіР»СѓС€РµРє." />

      {state.status === "loading" ? <Loader label="Р—Р°РіСЂСѓР¶Р°РµРј РѕС‚РєР»РёРєРё" surface /> : null}

      {state.status === "unauthorized" ? (
        <Card>
          <EmptyState
            eyebrow="Р”РѕСЃС‚СѓРї РѕРіСЂР°РЅРёС‡РµРЅ"
            title="РќСѓР¶РЅРѕ РІРѕР№С‚Рё РєР°Рє РєР°РЅРґРёРґР°С‚"
            description="РћС‚РєР»РёРєРё РґРѕСЃС‚СѓРїРЅС‹ С‚РѕР»СЊРєРѕ РїРѕСЃР»Рµ Р°РІС‚РѕСЂРёР·Р°С†РёРё РєР°РЅРґРёРґР°С‚Р°."
            tone="warning"
          />
        </Card>
      ) : null}

      {state.status === "error" ? (
        <Alert tone="error" title="РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РѕС‚РєР»РёРєРё" showIcon>
          {state.error?.message ?? "РџРѕРїСЂРѕР±СѓР№С‚Рµ РїРѕРІС‚РѕСЂРёС‚СЊ РїРѕР·Р¶Рµ."}
        </Alert>
      ) : null}

      {state.status === "ready" ? (
        <>
          <div className="candidate-filter-row">
            <div className="candidate-filter-row__group">
              {RESPONSE_FILTERS.map((filter) => (
                <CandidateFilterPill
                  key={filter.value}
                  label={filter.label}
                  active={filter.value === statusFilter}
                  onClick={() => setStatusFilter(filter.value)}
                />
              ))}
            </div>
            <CandidateSortButton />
          </div>

          {filteredItems.length ? (
            <div className="candidate-page-stack">
              {filteredItems.map((item) => (
                <CandidateResponseCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <Card>
              <EmptyState
                eyebrow="РџРѕРєР° РїСѓСЃС‚Рѕ"
                title="РќРµС‚ РѕС‚РєР»РёРєРѕРІ РІ РІС‹Р±СЂР°РЅРЅРѕРј СЃС‚Р°С‚СѓСЃРµ"
                description="РЎРїРёСЃРѕРє РїРѕСЏРІРёС‚СЃСЏ РїРѕСЃР»Рµ РѕС‚РєР»РёРєРѕРІ РЅР° РѕРїСѓР±Р»РёРєРѕРІР°РЅРЅС‹Рµ Рё РѕРґРѕР±СЂРµРЅРЅС‹Рµ РІРѕР·РјРѕР¶РЅРѕСЃС‚Рё."
                tone="neutral"
              />
            </Card>
          )}
        </>
      ) : null}
    </section>
  );
}
