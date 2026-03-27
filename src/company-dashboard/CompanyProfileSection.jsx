import { useEffect, useState } from "react";
import { getCompanyProfile, updateCompanyProfile } from "../api/company";
import { ApiError } from "../lib/http";
import { Alert, Button, Card, EmptyState, FormField, Input, Loader, Textarea } from "../shared/ui";
import { CabinetContentSection } from "../widgets/layout";
import "./company-dashboard.css";

function createProfileDraft(profile) {
  return {
    companyName: profile?.companyName ?? "",
    legalAddress: profile?.legalAddress ?? "",
    description: profile?.description ?? "",
  };
}

function parseSocialLinks(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim()).filter(Boolean);
  }

  const rawValue = String(value).trim();

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (Array.isArray(parsedValue)) {
      return parsedValue
        .map((item) => {
          if (typeof item === "string") {
            return item.trim();
          }

          if (item && typeof item === "object") {
            return String(item.url ?? item.href ?? item.value ?? item.link ?? "").trim();
          }

          return "";
        })
        .filter(Boolean);
    }

    if (parsedValue && typeof parsedValue === "object") {
      return Object.values(parsedValue).map((item) => String(item ?? "").trim()).filter(Boolean);
    }
  } catch {
    return rawValue
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function stringifySocialLinks(items) {
  const normalizedItems = items
    .map((item) => item.trim())
    .filter(Boolean);

  return JSON.stringify(normalizedItems);
}

export function CompanyProfileSection() {
  const [state, setState] = useState({ status: "loading", profile: null, error: null });
  const [draft, setDraft] = useState(createProfileDraft(null));
  const [socialLinks, setSocialLinks] = useState([""]);
  const [saveState, setSaveState] = useState({ status: "idle", error: "" });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const profile = await getCompanyProfile(controller.signal);
        setState({ status: "ready", profile, error: null });
        setDraft(createProfileDraft(profile));

        const links = parseSocialLinks(profile?.socials);
        setSocialLinks(links.length > 0 ? links : [""]);
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

  function handleSocialLinkChange(index, value) {
    setSocialLinks((current) => current.map((link, currentIndex) => (currentIndex === index ? value : link)));
    setSaveState((current) => (current.status === "success" ? { status: "idle", error: "" } : current));
  }

  function handleAddSocialLink() {
    setSocialLinks((current) => [...current, ""]);
  }

  function handleRemoveSocialLink(index) {
    setSocialLinks((current) => {
      if (current.length <= 1) {
        return [""];
      }

      return current.filter((_, currentIndex) => currentIndex !== index);
    });
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaveState({ status: "saving", error: "" });

    try {
      const profile = await updateCompanyProfile({
        companyName: draft.companyName.trim(),
        legalAddress: draft.legalAddress.trim() || null,
        description: draft.description.trim() || null,
        socials: stringifySocialLinks(socialLinks) || null,
        verificationData: null,
      });

      setState((current) => ({ ...current, profile }));
      setDraft(createProfileDraft(profile));
      const links = parseSocialLinks(profile?.socials);
      setSocialLinks(links.length > 0 ? links : [""]);
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
              Основные данные компании сохранены и уже отображаются в кабинете.
            </Alert>
          ) : null}

          <CabinetContentSection
            eyebrow="Страница компании"
            title="Основные данные"
            description="Настройте публичный профиль компании и добавьте ссылки для кандидатов."
          >
            <form className="company-dashboard-stack" onSubmit={handleSave} noValidate>
              <Card className="company-dashboard-profile-hero-card" tone="neutral">
                <span className="company-dashboard-profile-hero-card__eyebrow">Публичный профиль</span>
                <h3 className="company-dashboard-profile-hero-card__title">{draft.companyName.trim() || "Название компании"}</h3>
                {draft.legalAddress.trim() ? <p className="company-dashboard-profile-hero-card__meta">{draft.legalAddress.trim()}</p> : null}
                {draft.description.trim() ? <p className="company-dashboard-profile-hero-card__description">{draft.description.trim()}</p> : null}
              </Card>

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

              <FormField label="Соцсети / ссылки">
                <div className="company-dashboard-social-links">
                  {socialLinks.map((link, index) => (
                    <div className="company-dashboard-social-links__row" key={`social-link-${index}`}>
                      <Input value={link} onValueChange={(value) => handleSocialLinkChange(index, value)} placeholder="https://" />
                      <Button type="button" variant="ghost" onClick={() => handleRemoveSocialLink(index)}>
                        Удалить
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="secondary" onClick={handleAddSocialLink}>
                    Добавить
                  </Button>
                </div>
              </FormField>

              <div className="company-dashboard-panel__actions">
                <Button type="submit" disabled={saveState.status === "saving"}>
                  {saveState.status === "saving" ? "Сохраняем..." : "Сохранить профиль"}
                </Button>
              </div>
            </form>
          </CabinetContentSection>

          <CabinetContentSection eyebrow="Проверка" title="Верификация" description="Подтвердите данные компании, чтобы профиль выглядел надежнее для кандидатов.">
            <div className="company-dashboard-verification-block">
              <p className="ui-type-body">
                Отправьте компанию на проверку, чтобы показать кандидатам подтвержденный статус и повысить доверие к странице работодателя.
              </p>
              <Button type="button" variant="secondary">
                Отправить на верификацию
              </Button>
            </div>
          </CabinetContentSection>

          <CabinetContentSection eyebrow="Кейсы" title="Портфолио компании" description="Подборка кейсов и проектов, которые можно показать кандидатам.">
            <Card className="company-dashboard-profile-hero-card" tone="neutral">
              <span className="company-dashboard-profile-hero-card__eyebrow">Портфолио</span>
              <h3 className="company-dashboard-profile-hero-card__title">Добавьте проекты и кейсы компании</h3>
              <p className="company-dashboard-profile-hero-card__description">
                Здесь можно собрать витрину реализованных проектов, командных достижений и заметных запусков.
              </p>
              <div className="company-dashboard-panel__actions">
                <Button type="button" variant="secondary">
                  Добавить кейс
                </Button>
              </div>
            </Card>
          </CabinetContentSection>

          <CabinetContentSection eyebrow="Галерея" title="Галерея компании" description="Горизонтальная лента изображений с быстрыми действиями.">
            <div className="company-dashboard-gallery-scroll" role="list" aria-label="Галерея компании">
              {["Офис", "Команда", "Мероприятие"].map((imageTitle) => (
                <Card className="company-dashboard-gallery-card" key={imageTitle} role="listitem" tone="neutral">
                  <div className="company-dashboard-gallery-card__image" aria-hidden="true" />
                  <div className="company-dashboard-gallery-card__footer">
                    <p className="ui-type-body">{imageTitle}</p>
                    <Button type="button" variant="ghost">
                      Удалить
                    </Button>
                  </div>
                </Card>
              ))}

              <Card className="company-dashboard-gallery-card company-dashboard-gallery-card--add" role="listitem" tone="neutral">
                <div className="company-dashboard-gallery-card__add">
                  <Button type="button" variant="secondary">
                    Добавить
                  </Button>
                </div>
              </Card>
            </div>
          </CabinetContentSection>
        </>
      ) : null}
    </>
  );
}
