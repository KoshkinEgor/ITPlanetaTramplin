import { useEffect, useState } from "react";
import { getCompanyProfile, updateCompanyProfile } from "../api/company";
import { ApiError } from "../lib/http";
import { CompanyPortfolioCarousel } from "./CompanyPortfolioCarousel";
import { Alert, Button, EmptyState, FormField, Input, Loader, PlaceholderMedia, Textarea } from "../shared/ui";
import { CabinetContentSection } from "../widgets/layout";
import "./company-dashboard.css";

function createProfileDraft(profile) {
  return {
    companyName: profile?.companyName ?? "",
    legalAddress: profile?.legalAddress ?? "",
    description: profile?.description ?? "",
    socials: profile?.socials ?? "",
    verificationData: profile?.verificationData ?? "",
  };
}

export function CompanyProfileSection() {
  const [state, setState] = useState({ status: "loading", profile: null, error: null });
  const [draft, setDraft] = useState(createProfileDraft(null));
  const [saveState, setSaveState] = useState({ status: "idle", error: "" });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const profile = await getCompanyProfile(controller.signal);
        setState({ status: "ready", profile, error: null });
        setDraft(createProfileDraft(profile));
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: error instanceof ApiError && error.status === 401 ? "unauthorized" : "error",
          profile: null,
          error,
        });
      }
    }

    load();
    return () => controller.abort();
  }, []);

  function handleDraftChange(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    setSaveState((current) => (current.status === "success" ? { status: "idle", error: "" } : current));
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaveState({ status: "saving", error: "" });

    try {
      const profile = await updateCompanyProfile({
        companyName: draft.companyName.trim(),
        legalAddress: draft.legalAddress.trim() || null,
        description: draft.description.trim() || null,
        socials: draft.socials.trim() || null,
        verificationData: draft.verificationData.trim() || null,
      });

      setState((current) => ({ ...current, profile }));
      setDraft(createProfileDraft(profile));
      setSaveState({ status: "success", error: "" });
    } catch (error) {
      setSaveState({
        status: "error",
        error: error?.message ?? "Не удалось сохранить данные компании.",
      });
    }
  }

  return (
    <>
      {state.status === "loading" ? <Loader label="Загружаем данные компании" surface /> : null}

      {state.status === "unauthorized" ? (
        <CabinetContentSection eyebrow="Доступ ограничен" title="Нужно войти как компания" description="Раздел компании доступен только работодателю.">
          <EmptyState
            title="Нет доступа к данным компании"
            description="После авторизации здесь появятся основные блоки кабинета компании."
            tone="warning"
          />
        </CabinetContentSection>
      ) : null}

      {state.status === "error" ? (
        <Alert tone="error" title="Не удалось загрузить раздел компании" showIcon>
          {state.error?.message ?? "Попробуйте обновить страницу позже."}
        </Alert>
      ) : null}

      {state.status === "ready" ? (
        <>
          {saveState.status === "error" ? (
            <Alert tone="error" title="Изменения не сохранены" showIcon>
              {saveState.error}
            </Alert>
          ) : null}

          {saveState.status === "success" ? (
            <Alert tone="success" title="Профиль компании обновлен" showIcon>
              Основные данные отправлены в backend.
            </Alert>
          ) : null}

          <CabinetContentSection
            eyebrow="Страница компании"
            title="Основные данные"
            description="Блок профиля компании сохранен как отдельная cabinet section. Медиа и gallery-модули пока представлены shared placeholders."
          >
            <form className="company-dashboard-stack" onSubmit={handleSave} noValidate>
              <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                <FormField label="Название компании" required>
                  <Input value={draft.companyName} onValueChange={(value) => handleDraftChange("companyName", value)} />
                </FormField>
                <FormField label="Юридический адрес">
                  <Input value={draft.legalAddress} onValueChange={(value) => handleDraftChange("legalAddress", value)} />
                </FormField>
              </div>

              <FormField label="Описание">
                <Textarea value={draft.description} onValueChange={(value) => handleDraftChange("description", value)} rows={5} autoResize />
              </FormField>

              <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                <FormField label="Соцсети / ссылки">
                  <Textarea value={draft.socials} onValueChange={(value) => handleDraftChange("socials", value)} rows={4} autoResize />
                </FormField>
                <FormField label="Данные для верификации">
                  <Textarea value={draft.verificationData} onValueChange={(value) => handleDraftChange("verificationData", value)} rows={4} autoResize />
                </FormField>
              </div>

              <div className="company-dashboard-panel__actions">
                <Button type="submit" disabled={saveState.status === "saving"}>
                  {saveState.status === "saving" ? "Сохраняем..." : "Сохранить профиль"}
                </Button>
              </div>
            </form>
          </CabinetContentSection>

          <div className="company-dashboard-layout">
            <PlaceholderMedia
              eyebrow="О компании"
              title="Видео или hero-media"
              description="Здесь будет общий media-блок компании. Пока он зафиксирован как shared placeholder."
              actionLabel="Placeholder: video uploader"
              actionDescription="После реализации общий компонент заменит этот слот и в ui-kit, и в кабинете."
            />
            <CompanyPortfolioCarousel />
          </div>

          <CabinetContentSection eyebrow="Галерея" title="Офис и media-слоты" description="Структура раздела зафиксирована до финальных uploader-компонентов.">
            <div className="company-dashboard-media-grid">
              <PlaceholderMedia eyebrow="Офис" title="Рабочее место" actionLabel="Placeholder: photo slot" />
              <PlaceholderMedia eyebrow="Офис" title="Лаунж-зона" actionLabel="Placeholder: photo slot" />
              <PlaceholderMedia eyebrow="Офис" title="Лекторий" actionLabel="Placeholder: photo slot" />
              <PlaceholderMedia eyebrow="Офис" title="Добавить фото" actionLabel="Placeholder: photo slot" />
            </div>
          </CabinetContentSection>
        </>
      ) : null}
    </>
  );
}
