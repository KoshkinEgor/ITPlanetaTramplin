import { useEffect, useState } from "react";
import { getCompanySettings, updateCompanySettings } from "../api/company";
import { ApiError } from "../lib/http";
import { Alert, Button, Checkbox, EmptyState, FormField, Input, Loader, Select } from "../shared/ui";
import { CabinetContentSection } from "../widgets/layout";
import "./company-dashboard.css";

const START_SECTION_OPTIONS = [
  { value: "profile", label: "Профиль компании" },
  { value: "opportunities", label: "Возможности" },
  { value: "responses", label: "Отклики" },
  { value: "settings", label: "Настройки" },
];

const RESPONSES_SORT_OPTIONS = [
  { value: "newest", label: "Новые сначала" },
  { value: "oldest", label: "Старые сначала" },
  { value: "status", label: "По статусу" },
  { value: "opportunity", label: "По возможности" },
];

function createSettingsDraft(settings = {}) {
  return {
    notificationEmail: settings.notificationEmail ?? "",
    notifyNewApplications: settings.notifyNewApplications ?? true,
    notifyModerationUpdates: settings.notifyModerationUpdates ?? true,
    notifyComplaintsAndSystem: settings.notifyComplaintsAndSystem ?? true,
    defaultStartSection: settings.defaultStartSection ?? "profile",
    defaultResponsesSort: settings.defaultResponsesSort ?? "newest",
    showArchivedOpportunities: settings.showArchivedOpportunities ?? false,
  };
}

export function CompanySettingsSection() {
  const [state, setState] = useState({ status: "loading", error: null });
  const [draft, setDraft] = useState(createSettingsDraft());
  const [saveState, setSaveState] = useState({ status: "idle", error: "" });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const settings = await getCompanySettings(controller.signal);
        setDraft(createSettingsDraft(settings));
        setState({ status: "ready", error: null });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: error instanceof ApiError && error.status === 401 ? "unauthorized" : "error",
          error,
        });
      }
    }

    load();
    return () => controller.abort();
  }, []);

  function updateField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    setSaveState((current) => (current.status === "success" ? { status: "idle", error: "" } : current));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaveState({ status: "saving", error: "" });

    try {
      const saved = await updateCompanySettings(draft);
      setDraft(createSettingsDraft(saved));
      setSaveState({ status: "success", error: "" });
    } catch (error) {
      setSaveState({
        status: "error",
        error: error?.message ?? "Не удалось сохранить настройки компании.",
      });
    }
  }

  if (state.status === "loading") {
    return <Loader label="Загружаем настройки компании" surface />;
  }

  if (state.status === "unauthorized") {
    return (
      <CabinetContentSection eyebrow="Доступ ограничен" title="Нужно войти как компания" description="Настройки доступны только работодателю.">
        <EmptyState title="Нет доступа к настройкам" description="После авторизации здесь появятся уведомления и предпочтения кабинета." tone="warning" />
      </CabinetContentSection>
    );
  }

  if (state.status === "error") {
    return (
      <Alert tone="error" title="Не удалось загрузить настройки" showIcon>
        {state.error?.message ?? "Попробуйте обновить страницу позже."}
      </Alert>
    );
  }

  return (
    <CabinetContentSection
      eyebrow="Настройки"
      title="Настройки компании"
      description="Управляйте служебными уведомлениями и поведением кабинета для команды работодателя."
    >
      {saveState.status === "error" ? (
        <Alert tone="error" title="Настройки не сохранены" showIcon>
          {saveState.error}
        </Alert>
      ) : null}

      {saveState.status === "success" ? (
        <Alert tone="success" title="Настройки сохранены" showIcon>
          Изменения применены к кабинету компании.
        </Alert>
      ) : null}

      <form className="company-dashboard-stack" onSubmit={handleSubmit} noValidate>
        <section className="company-dashboard-panel">
          <h3 className="ui-type-h3">Уведомления</h3>
          <FormField label="Email для уведомлений">
            <Input
              type="email"
              value={draft.notificationEmail}
              onValueChange={(value) => updateField("notificationEmail", value)}
              placeholder="hr@company.ru"
            />
          </FormField>

          <div className="company-dashboard-settings-checks">
            <Checkbox
              label="Новые отклики кандидатов"
              checked={draft.notifyNewApplications}
              onChange={(event) => updateField("notifyNewApplications", event.target.checked)}
            />
            <Checkbox
              label="Изменение статуса модерации"
              checked={draft.notifyModerationUpdates}
              onChange={(event) => updateField("notifyModerationUpdates", event.target.checked)}
            />
            <Checkbox
              label="Жалобы и системные уведомления"
              checked={draft.notifyComplaintsAndSystem}
              onChange={(event) => updateField("notifyComplaintsAndSystem", event.target.checked)}
            />
          </div>
        </section>

        <section className="company-dashboard-panel">
          <h3 className="ui-type-h3">Кабинет</h3>
          <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
            <FormField label="Стартовый раздел">
              <Select
                value={draft.defaultStartSection}
                onValueChange={(value) => updateField("defaultStartSection", value)}
                options={START_SECTION_OPTIONS}
              />
            </FormField>
            <FormField label="Сортировка откликов по умолчанию">
              <Select
                value={draft.defaultResponsesSort}
                onValueChange={(value) => updateField("defaultResponsesSort", value)}
                options={RESPONSES_SORT_OPTIONS}
              />
            </FormField>
          </div>

          <Checkbox
            label="Показывать архивные возможности в кабинете"
            checked={draft.showArchivedOpportunities}
            onChange={(event) => updateField("showArchivedOpportunities", event.target.checked)}
          />
        </section>

        <div className="company-dashboard-panel__actions">
          <Button type="submit" disabled={saveState.status === "saving"}>
            {saveState.status === "saving" ? "Сохраняем..." : "Сохранить настройки"}
          </Button>
        </div>
      </form>
    </CabinetContentSection>
  );
}
