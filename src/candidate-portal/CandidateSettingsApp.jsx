import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { buildForgotPasswordRoute } from "../app/routes";
import { getCandidateProfile, updateCandidateProfile } from "../api/candidate";
import { ApiError } from "../lib/http";
import { Alert, Button, Card, EmptyState, FormField, Input, Loader, TagSelector, Textarea } from "../shared/ui";
import { CANDIDATE_SETTINGS_SECTIONS, CANDIDATE_SKILL_SUGGESTIONS } from "./config";
import { getCandidateSkills } from "./mappers";
import { CandidateSectionHeader, CandidateSettingsPreviewCard } from "./shared";

function createDraft(profile) {
  return {
    name: profile?.name ?? "",
    surname: profile?.surname ?? "",
    thirdname: profile?.thirdname ?? "",
    description: profile?.description ?? "",
    skills: getCandidateSkills(profile),
  };
}

function getOpenSection(searchParams) {
  const section = searchParams.get("section");
  return CANDIDATE_SETTINGS_SECTIONS.some((item) => item.id === section)
    ? section
    : CANDIDATE_SETTINGS_SECTIONS[0]?.id;
}

function CandidateSettingsSaveButton({ disabled, label = "РЎРѕС…СЂР°РЅРёС‚СЊ" }) {
  return (
    <div className="candidate-settings-detail__save">
      <Button type="submit" disabled={disabled}>
        {label}
      </Button>
    </div>
  );
}

function CandidateProfileSettingsForm({ draft, errors, isSaving, saveError, saveSuccess, onChange, onSave }) {
  return (
    <form className="candidate-settings-detail" onSubmit={onSave} noValidate>
      <section className="candidate-settings-detail__section">
        <h4 className="candidate-settings-detail__section-title">РћСЃРЅРѕРІРЅР°СЏ РёРЅС„РѕСЂРјР°С†РёСЏ</h4>

        {saveError ? (
          <Alert tone="error" title="РќРµ СѓРґР°Р»РѕСЃСЊ СЃРѕС…СЂР°РЅРёС‚СЊ РїСЂРѕС„РёР»СЊ" showIcon>
            {saveError}
          </Alert>
        ) : null}

        {saveSuccess ? (
          <Alert tone="success" title="РџСЂРѕС„РёР»СЊ РѕР±РЅРѕРІР»РµРЅ" showIcon>
            Р”Р°РЅРЅС‹Рµ СЃРѕС…СЂР°РЅРµРЅС‹ РІ backend Рё СѓР¶Рµ РёСЃРїРѕР»СЊР·СѓСЋС‚СЃСЏ РЅР° СЃС‚СЂР°РЅРёС†Р°С… РєР°РЅРґРёРґР°С‚Р°.
          </Alert>
        ) : null}

        <div className="candidate-settings-detail__grid">
          <FormField label="Р¤Р°РјРёР»РёСЏ" required error={errors.surname}>
            <Input value={draft.surname} onValueChange={(value) => onChange("surname", value)} />
          </FormField>
          <FormField label="РРјСЏ" required error={errors.name}>
            <Input value={draft.name} onValueChange={(value) => onChange("name", value)} />
          </FormField>
          <FormField label="РћС‚С‡РµСЃС‚РІРѕ">
            <Input value={draft.thirdname} onValueChange={(value) => onChange("thirdname", value)} />
          </FormField>
        </div>

        <FormField label="Рћ СЃРµР±Рµ">
          <Textarea value={draft.description} onValueChange={(value) => onChange("description", value)} autoResize rows={5} />
        </FormField>

        <div className="candidate-settings-detail__section">
          <div className="candidate-settings-detail__subtitle">РќР°РІС‹РєРё</div>
          <TagSelector
            className="candidate-project-editor-tag-selector"
            title="РљР»СЋС‡РµРІС‹Рµ РЅР°РІС‹РєРё"
            value={draft.skills}
            suggestions={CANDIDATE_SKILL_SUGGESTIONS}
            suggestionsLabel="РџРѕРґСЃРєР°Р·РєРё"
            searchPlaceholder="РџРѕРёСЃРє РЅР°РІС‹РєРѕРІ"
            clearLabel="РћС‡РёСЃС‚РёС‚СЊ РїРѕРёСЃРє"
            saveLabel="РЎРѕС…СЂР°РЅРёС‚СЊ РЅР°РІС‹РєРё"
            onSave={(nextSkills) => onChange("skills", nextSkills)}
          />
          {errors.skills ? <span className="ui-error">{errors.skills}</span> : null}
        </div>
      </section>

      <CandidateSettingsSaveButton disabled={isSaving} label={isSaving ? "РЎРѕС…СЂР°РЅСЏРµРј..." : "РЎРѕС…СЂР°РЅРёС‚СЊ"} />
    </form>
  );
}

function CandidateSecuritySettings({ email }) {
  return (
    <div className="candidate-settings-detail">
      <section className="candidate-settings-detail__section">
        <h4 className="candidate-settings-detail__section-title">Р”Р°РЅРЅС‹Рµ РґРѕСЃС‚СѓРїР°</h4>
        <div className="candidate-settings-detail__grid candidate-settings-detail__grid--two">
          <FormField label="Email">
            <Input value={email || "Email РЅРµ СѓРєР°Р·Р°РЅ"} readOnly />
          </FormField>
          <FormField label="РџР°СЂРѕР»СЊ">
            <Input value="********" readOnly type="password" />
          </FormField>
        </div>
        <p className="candidate-settings-detail__hint">
          РЎРјРµРЅР° РїР°СЂРѕР»СЏ РІС‹РЅРµСЃРµРЅР° РІ РѕС‚РґРµР»СЊРЅС‹Р№ flow РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёСЏ РґРѕСЃС‚СѓРїР° Рё РЅРµ С…СЂР°РЅРёС‚СЃСЏ РІ РєР»РёРµРЅС‚СЃРєРѕРј СЃРѕСЃС‚РѕСЏРЅРёРё.
        </p>
      </section>

      <div className="candidate-settings-detail__save">
        <Button href={buildForgotPasswordRoute({ email })} variant="secondary">
          РџРµСЂРµР№С‚Рё Рє РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёСЋ РґРѕСЃС‚СѓРїР°
        </Button>
      </div>
    </div>
  );
}

export function CandidateSettingsApp() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState({
    status: "loading",
    profile: null,
    draft: createDraft(null),
    error: null,
  });
  const [formErrors, setFormErrors] = useState({});
  const [saveState, setSaveState] = useState({ status: "idle", error: "" });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const profile = await getCandidateProfile(controller.signal);
        setState({
          status: "ready",
          profile,
          draft: createDraft(profile),
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: error instanceof ApiError && error.status === 401 ? "unauthorized" : "error",
          profile: null,
          draft: createDraft(null),
          error,
        });
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const openSection = getOpenSection(searchParams);
  const profileSection = CANDIDATE_SETTINGS_SECTIONS[0];
  const securitySection = CANDIDATE_SETTINGS_SECTIONS[1];

  function handleDraftChange(field, value) {
    setState((current) => ({
      ...current,
      draft: {
        ...current.draft,
        [field]: value,
      },
    }));

    setFormErrors((current) => {
      if (!(field in current)) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });

    setSaveState((current) => (current.status === "success" ? { status: "idle", error: "" } : current));
  }

  function handleToggle(sectionId) {
    const nextSection = sectionId === openSection ? "" : sectionId;

    setSearchParams((current) => {
      const next = new URLSearchParams(current);

      if (nextSection) {
        next.set("section", nextSection);
      } else {
        next.delete("section");
      }

      return next;
    }, { replace: true });
  }

  async function handleProfileSave(event) {
    event.preventDefault();

    const nextErrors = {};
    if (!state.draft.name.trim()) {
      nextErrors.name = "РЈРєР°Р¶РёС‚Рµ РёРјСЏ.";
    }
    if (!state.draft.surname.trim()) {
      nextErrors.surname = "РЈРєР°Р¶РёС‚Рµ С„Р°РјРёР»РёСЋ.";
    }
    if (!Array.isArray(state.draft.skills) || state.draft.skills.length === 0) {
      nextErrors.skills = "Р”РѕР±Р°РІСЊС‚Рµ С…РѕС‚СЏ Р±С‹ РѕРґРёРЅ РЅР°РІС‹Рє.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    setSaveState({ status: "saving", error: "" });

    try {
      const profile = await updateCandidateProfile({
        name: state.draft.name.trim(),
        surname: state.draft.surname.trim(),
        thirdname: state.draft.thirdname.trim() || null,
        description: state.draft.description.trim() || null,
        skills: state.draft.skills,
      });

      setState((current) => ({
        ...current,
        profile,
        draft: createDraft(profile),
      }));
      setSaveState({ status: "success", error: "" });
    } catch (error) {
      setSaveState({
        status: "error",
        error: error?.message ?? "РџРѕРїСЂРѕР±СѓР№С‚Рµ РїРѕРІС‚РѕСЂРёС‚СЊ СЃРѕС…СЂР°РЅРµРЅРёРµ РїРѕР·Р¶Рµ.",
      });
    }
  }

  return (
    <section className="candidate-page-section">
      <CandidateSectionHeader
        eyebrow="РќР°СЃС‚СЂРѕР№РєРё"
        title="РќР°СЃС‚СЂРѕР№РєРё РїСЂРѕС„РёР»СЏ"
        description="Р–РёРІС‹Рµ СЃРµРєС†РёРё РєР°Р±РёРЅРµС‚Р°: РїСЂРѕС„РёР»СЊ СЃРѕС…СЂР°РЅСЏРµС‚СЃСЏ С‡РµСЂРµР· API, Р±РµР·РѕРїР°СЃРЅРѕСЃС‚СЊ РІРµРґРµС‚ РІ СЂРµР°Р»СЊРЅС‹Р№ flow РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёСЏ РґРѕСЃС‚СѓРїР°."
      />

      {state.status === "loading" ? <Loader label="Р—Р°РіСЂСѓР¶Р°РµРј РЅР°СЃС‚СЂРѕР№РєРё РїСЂРѕС„РёР»СЏ" surface /> : null}

      {state.status === "unauthorized" ? (
        <Card>
          <EmptyState
            eyebrow="Р”РѕСЃС‚СѓРї РѕРіСЂР°РЅРёС‡РµРЅ"
            title="РќСѓР¶РЅРѕ РІРѕР№С‚Рё РєР°Рє РєР°РЅРґРёРґР°С‚"
            description="РќР°СЃС‚СЂРѕР№РєРё РїСЂРѕС„РёР»СЏ РґРѕСЃС‚СѓРїРЅС‹ С‚РѕР»СЊРєРѕ РїРѕСЃР»Рµ Р°РІС‚РѕСЂРёР·Р°С†РёРё РєР°РЅРґРёРґР°С‚Р°."
            tone="warning"
          />
        </Card>
      ) : null}

      {state.status === "error" ? (
        <Alert tone="error" title="РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РЅР°СЃС‚СЂРѕР№РєРё" showIcon>
          {state.error?.message ?? "РџРѕРїСЂРѕР±СѓР№С‚Рµ РѕР±РЅРѕРІРёС‚СЊ СЃС‚СЂР°РЅРёС†Сѓ РїРѕР·Р¶Рµ."}
        </Alert>
      ) : null}

      {state.status === "ready" ? (
        <div className="candidate-page-stack">
          <CandidateSettingsPreviewCard
            section={profileSection}
            isOpen={openSection === profileSection.id}
            onToggle={handleToggle}
          >
            <CandidateProfileSettingsForm
              draft={state.draft}
              errors={formErrors}
              isSaving={saveState.status === "saving"}
              saveError={saveState.status === "error" ? saveState.error : ""}
              saveSuccess={saveState.status === "success"}
              onChange={handleDraftChange}
              onSave={handleProfileSave}
            />
          </CandidateSettingsPreviewCard>

          <CandidateSettingsPreviewCard
            section={securitySection}
            isOpen={openSection === securitySection.id}
            onToggle={handleToggle}
          >
            <CandidateSecuritySettings email={state.profile?.email ?? ""} />
          </CandidateSettingsPreviewCard>
        </div>
      ) : null}
    </section>
  );
}
