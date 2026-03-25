import { useEffect, useMemo, useState } from "react";
/* eslint-disable no-irregular-whitespace */
import { getCandidateAchievements, getCandidateEducation, getCandidateProfile, getCandidateProjects } from "../api/candidate";
import { ApiError } from "../lib/http";
import { Alert, Button, Card, EmptyState, Loader, Tag } from "../shared/ui";
import { CANDIDATE_PAGE_ROUTES, CANDIDATE_PORTFOLIO_TABS } from "./config";
import { formatLongDate, getCandidateSkills, mapCandidateProjectToCard } from "./mappers";
import { CandidateProjectCard, CandidateSectionHeader, CandidateSegmentNav } from "./shared";

function CandidatePortfolioSwitcher({ value }) {
  return (
    <Card className="candidate-switcher-card">
      <CandidateSectionHeader title="Р РµР·СЋРјРµ Рё РїРѕСЂС‚С„РѕР»РёРѕ" />
      <CandidateSegmentNav items={CANDIDATE_PORTFOLIO_TABS} value={value} />
    </Card>
  );
}

function ResumeSection({ title, emptyText, items, renderItem }) {
  return (
    <Card className="candidate-resume-panel">
      <div className="candidate-resume-panel__intro">
        <h2 className="ui-type-h2">{title}</h2>
      </div>

      {items.length ? (
        <div className="candidate-page-stack">
          {items.map(renderItem)}
        </div>
      ) : (
        <EmptyState title={emptyText} description="Р Р°Р·РґРµР» Р·Р°РїРѕР»РЅРёС‚СЃСЏ РїРѕСЃР»Рµ СЂРµР°Р»СЊРЅС‹С… РґРµР№СЃС‚РІРёР№ РєР°РЅРґРёРґР°С‚Р°." compact tone="neutral" />
      )}
    </Card>
  );
}

export function CandidateResumeApp() {
  const [state, setState] = useState({
    status: "loading",
    profile: null,
    education: [],
    achievements: [],
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const [profile, education, achievements] = await Promise.all([
          getCandidateProfile(controller.signal),
          getCandidateEducation(controller.signal),
          getCandidateAchievements(controller.signal),
        ]);

        setState({
          status: "ready",
          profile,
          education: Array.isArray(education) ? education : [],
          achievements: Array.isArray(achievements) ? achievements : [],
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: error instanceof ApiError && error.status === 401 ? "unauthorized" : "error",
          profile: null,
          education: [],
          achievements: [],
          error,
        });
      }
    }

    load();
    return () => controller.abort();
  }, []);

  return (
    <>
      <CandidatePortfolioSwitcher value="resume" />

      {state.status === "loading" ? <Loader label="Р—Р°РіСЂСѓР¶Р°РµРј СЂРµР·СЋРјРµ" surface /> : null}

      {state.status === "unauthorized" ? (
        <Card>
          <EmptyState
            eyebrow="Р”РѕСЃС‚СѓРї РѕРіСЂР°РЅРёС‡РµРЅ"
            title="РќСѓР¶РЅРѕ РІРѕР№С‚Рё РєР°Рє РєР°РЅРґРёРґР°С‚"
            description="Р РµР·СЋРјРµ С‚РµРїРµСЂСЊ СЃРѕР±РёСЂР°РµС‚СЃСЏ РёР· СЂРµР°Р»СЊРЅС‹С… РґР°РЅРЅС‹С… РїСЂРѕС„РёР»СЏ, РѕР±СЂР°Р·РѕРІР°РЅРёСЏ Рё РґРѕСЃС‚РёР¶РµРЅРёР№."
            tone="warning"
          />
        </Card>
      ) : null}

      {state.status === "error" ? (
        <Alert tone="error" title="РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ СЂРµР·СЋРјРµ" showIcon>
          {state.error?.message ?? "РџРѕРїСЂРѕР±СѓР№С‚Рµ РѕР±РЅРѕРІРёС‚СЊ СЃС‚СЂР°РЅРёС†Сѓ РїРѕР·Р¶Рµ."}
        </Alert>
      ) : null}

      {state.status === "ready" ? (
        <>
          <Card className="candidate-resume-panel">
            <div className="candidate-resume-panel__intro">
              <Tag tone="accent">Р РµР·СЋРјРµ</Tag>
              <h2 className="ui-type-h1">РџСЂРѕС„РёР»СЊ РєР°РЅРґРёРґР°С‚Р°</h2>
              <p className="ui-type-body-lg">{state.profile?.description || "РћРїРёСЃР°РЅРёРµ РїСЂРѕС„РёР»СЏ РїРѕРєР° РїСѓСЃС‚РѕРµ."}</p>
            </div>

            <div className="candidate-resume-record__tags">
              {getCandidateSkills(state.profile).length ? (
                getCandidateSkills(state.profile).map((skill) => (
                  <Tag key={skill}>{skill}</Tag>
                ))
              ) : (
                <Tag>РќР°РІС‹РєРё РїРѕРєР° РЅРµ СѓРєР°Р·Р°РЅС‹</Tag>
              )}
            </div>

            <div className="candidate-resume-panel__actions">
              <Button href={CANDIDATE_PAGE_ROUTES.resumeEditor}>Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ РґР°РЅРЅС‹Рµ</Button>
            </div>
          </Card>

          <ResumeSection
            title="РћР±СЂР°Р·РѕРІР°РЅРёРµ"
            emptyText="РћР±СЂР°Р·РѕРІР°РЅРёРµ РµС‰Рµ РЅРµ РґРѕР±Р°РІР»РµРЅРѕ"
            items={state.education}
            renderItem={(item) => (
              <article key={item.id} className="candidate-resume-record">
                <div className="candidate-resume-record__head">
                  <div className="candidate-resume-record__copy-link">
                    <h3 className="ui-type-h2">{item.institutionName}</h3>
                    <p className="ui-type-body">
                      {[item.faculty, item.specialization].filter(Boolean).join(" В· ")}
                    </p>
                  </div>
                </div>
                <div className="candidate-resume-record__stats">
                  <span>{item.startYear || "?"} вЂ” {item.graduationYear || "?"}</span>
                </div>
              </article>
            )}
          />

          <ResumeSection
            title="Р”РѕСЃС‚РёР¶РµРЅРёСЏ"
            emptyText="Р”РѕСЃС‚РёР¶РµРЅРёСЏ РµС‰Рµ РЅРµ РґРѕР±Р°РІР»РµРЅС‹"
            items={state.achievements}
            renderItem={(item) => (
              <article key={item.id} className="candidate-resume-record">
                <div className="candidate-resume-record__head">
                  <div className="candidate-resume-record__copy-link">
                    <h3 className="ui-type-h2">{item.title || "Р”РѕСЃС‚РёР¶РµРЅРёРµ"}</h3>
                    <p className="ui-type-body">{item.description || "Р‘РµР· РѕРїРёСЃР°РЅРёСЏ"}</p>
                  </div>
                </div>
                <div className="candidate-resume-record__stats">
                  <span>{formatLongDate(item.obtainDate) || "Р”Р°С‚Р° РЅРµ СѓРєР°Р·Р°РЅР°"}</span>
                </div>
              </article>
            )}
          />
        </>
      ) : null}
    </>
  );
}

export function CandidateProjectsApp() {
  const [state, setState] = useState({
    status: "loading",
    projects: [],
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const projects = await getCandidateProjects(controller.signal);

        setState({
          status: "ready",
          projects: Array.isArray(projects) ? projects : [],
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: error instanceof ApiError && error.status === 401 ? "unauthorized" : "error",
          projects: [],
          error,
        });
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const projectItems = useMemo(() => state.projects.map(mapCandidateProjectToCard), [state.projects]);

  return (
    <>
      <CandidatePortfolioSwitcher value="projects" />

      {state.status === "loading" ? <Loader label="Р—Р°РіСЂСѓР¶Р°РµРј РїСЂРѕРµРєС‚С‹" surface /> : null}

      {state.status === "unauthorized" ? (
        <Card>
          <EmptyState
            eyebrow="Р”РѕСЃС‚СѓРї РѕРіСЂР°РЅРёС‡РµРЅ"
            title="РќСѓР¶РЅРѕ РІРѕР№С‚Рё РєР°Рє РєР°РЅРґРёРґР°С‚"
            description="РџРѕСЂС‚С„РѕР»РёРѕ РґРѕСЃС‚СѓРїРЅРѕ С‚РѕР»СЊРєРѕ Р°РІС‚РѕСЂРёР·РѕРІР°РЅРЅРѕРјСѓ РєР°РЅРґРёРґР°С‚Сѓ."
            tone="warning"
          />
        </Card>
      ) : null}

      {state.status === "error" ? (
        <Alert tone="error" title="РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РїСЂРѕРµРєС‚С‹" showIcon>
          {state.error?.message ?? "РџРѕРїСЂРѕР±СѓР№С‚Рµ РїРѕРІС‚РѕСЂРёС‚СЊ РїРѕР·Р¶Рµ."}
        </Alert>
      ) : null}

      {state.status === "ready" ? (
        <section className="candidate-page-section">
          <CandidateSectionHeader
            title="РџРѕСЂС‚С„РѕР»РёРѕ"
            description="РЎРїРёСЃРѕРє СЃС‚СЂРѕРёС‚СЃСЏ РїРѕ `/api/candidate/me/projects` Рё Р±РѕР»СЊС€Рµ РЅРµ Р·Р°РІРёСЃРёС‚ РѕС‚ localStorage."
            actions={<Button href={CANDIDATE_PAGE_ROUTES.projectEditor}>Р”РѕР±Р°РІРёС‚СЊ РїСЂРѕРµРєС‚</Button>}
          />

          {projectItems.length ? (
            <div className="candidate-page-grid candidate-page-grid--two">
              {projectItems.map((item) => (
                <CandidateProjectCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <Card>
              <EmptyState
                eyebrow="РџРѕРєР° РїСѓСЃС‚Рѕ"
                title="РџСЂРѕРµРєС‚С‹ РµС‰Рµ РЅРµ РґРѕР±Р°РІР»РµРЅС‹"
                description="Р”РѕР±Р°РІСЊС‚Рµ РїРµСЂРІС‹Р№ РєРµР№СЃ С‡РµСЂРµР· СЂРµРґР°РєС‚РѕСЂ, Рё РѕРЅ СЃСЂР°Р·Сѓ РїРѕСЏРІРёС‚СЃСЏ Р·РґРµСЃСЊ."
                tone="neutral"
                actions={<Button href={CANDIDATE_PAGE_ROUTES.projectEditor}>Р”РѕР±Р°РІРёС‚СЊ РїСЂРѕРµРєС‚</Button>}
              />
            </Card>
          )}
        </section>
      ) : null}
    </>
  );
}
