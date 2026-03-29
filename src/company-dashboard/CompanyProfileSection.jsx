import { useEffect, useMemo, useRef, useState } from "react";
import {
  getCompanyOpportunities,
  getCompanyProfile,
  updateCompanyProfile,
} from "../api/company";
import { buildOpportunityDetailRoute, routes } from "../app/routes";
import { OpportunityBlockRail } from "../components/opportunities";
import { ApiError } from "../lib/http";
import { getOpportunityCardPresentation } from "../shared/lib/opportunityPresentation";
import {
  Alert,
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
  Loader,
  Modal,
  Textarea,
} from "../shared/ui";
import { CabinetContentSection } from "../widgets/layout";
import { CompanyGalleryPanel } from "./CompanyGalleryPanel";
import { CompanyHeroMediaPanel } from "./CompanyHeroMediaPanel";
import { CompanyPortfolioCarousel } from "./CompanyPortfolioCarousel";
import { CompanyVerificationSection } from "./CompanyVerificationSection";
import {
  createCompanyCaseStudyDraft,
  createCompanyGalleryItemDraft,
  createCompanyHeroMediaDraft,
  normalizeCompanyCaseStudies,
  normalizeCompanyGallery,
  normalizeCompanyHeroMedia,
  readCompanyMediaFileAsDataUrl,
  serializeCompanyCaseStudies,
  serializeCompanyGallery,
  serializeCompanyHeroMedia,
} from "./companyProfileMedia";
import "./company-dashboard.css";

const CASE_STUDY_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const CASE_STUDY_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

function translateEmploymentType(value) {
  switch (String(value ?? "").trim().toLowerCase()) {
    case "remote":
      return "Удаленно";
    case "hybrid":
      return "Гибрид";
    case "office":
    case "onsite":
    case "on-site":
      return "Офис";
    case "online":
      return "Онлайн";
    default:
      return String(value ?? "").trim();
  }
}

function shortenText(value, maxLength = 96) {
  const normalized = String(value ?? "").trim().replace(/\s+/g, " ");

  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}…`;
}

function formatSalary(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const numericValue = Number(value);

  if (Number.isFinite(numericValue)) {
    return new Intl.NumberFormat("ru-RU").format(numericValue);
  }

  return String(value).trim();
}

function createOpportunityAccent(item, employmentLabel) {
  const salaryFrom = formatSalary(item?.salaryFrom);
  const salaryTo = formatSalary(item?.salaryTo);

  if (salaryFrom && salaryTo) {
    return `${salaryFrom} – ${salaryTo} ₽`;
  }

  if (salaryFrom) {
    return `от ${salaryFrom} ₽`;
  }

  if (salaryTo) {
    return `до ${salaryTo} ₽`;
  }

  if (String(item?.duration ?? "").trim()) {
    return `Длительность: ${String(item.duration).trim()}`;
  }

  if (Number.isFinite(Number(item?.registrationCount))) {
    return `${Number(item.registrationCount)} регистраций`;
  }

  return String(item?.locationAddress ?? "").trim() || employmentLabel;
}

function createCompanyOpportunityCardItem(item) {
  const presentation = getOpportunityCardPresentation(item);

  return {
    id: item.id,
    ...presentation,
    status: "Активно",
    statusTone: "success",
    title: item?.title ?? "",
    note: presentation.note || shortenText(item?.description),
    chips: Array.isArray(item?.tags) ? item.tags.slice(0, 4) : [],
    detailHref: buildOpportunityDetailRoute(item.id),
  };
}

function createLocalId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function withStableId(item, prefix) {
  return {
    ...item,
    id: item.id || createLocalId(prefix),
  };
}

function createProfileDraft(profile) {
  return {
    companyName: profile?.companyName ?? "",
    legalAddress: profile?.legalAddress ?? "",
    description: profile?.description ?? "",
    heroMedia: createCompanyHeroMediaDraft(normalizeCompanyHeroMedia(profile?.heroMediaJson)),
    caseStudies: normalizeCompanyCaseStudies(profile?.caseStudiesJson).map((item) =>
      withStableId(item, "case")
    ),
    gallery: normalizeCompanyGallery(profile?.galleryJson).map((item) =>
      withStableId(item, "gallery")
    ),
  };
}

function createBasicProfileDraft(profile) {
  return {
    companyName: profile?.companyName ?? "",
    legalAddress: profile?.legalAddress ?? "",
    description: profile?.description ?? "",
  };
}

function createCaseStudyForm() {
  return {
    description: "",
    sourceUrl: "",
    previewUrl: "",
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
      return Object.values(parsedValue)
        .map((item) => String(item ?? "").trim())
        .filter(Boolean);
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
  const normalizedItems = items.map((item) => item.trim()).filter(Boolean);
  return JSON.stringify(normalizedItems);
}

function formatCaseStudyFileSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} КБ`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function createCaseStudyItemFromForm(form, index) {
  const description = form.description.trim();

  return withStableId(
    createCompanyCaseStudyDraft({
      title: description || `Проект ${index + 1}`,
      description,
      previewUrl: form.previewUrl.trim(),
      sourceUrl: form.sourceUrl.trim(),
      mediaType: "image",
    }),
    "case"
  );
}

export function CompanyProfileSection() {
  const [state, setState] = useState({
    status: "loading",
    profile: null,
    opportunities: [],
    opportunitiesError: null,
    error: null,
  });
  const [draft, setDraft] = useState(createProfileDraft(null));
  const [socialLinks, setSocialLinks] = useState([""]);
  const [saveState, setSaveState] = useState({ status: "idle", error: "" });
  const [isBasicProfileEditing, setIsBasicProfileEditing] = useState(false);
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [caseStudyForm, setCaseStudyForm] = useState(createCaseStudyForm());
  const [caseStudyFormError, setCaseStudyFormError] = useState("");
  const caseStudyFileInputRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      const [profileResult, opportunitiesResult] = await Promise.allSettled([
        getCompanyProfile(controller.signal),
        getCompanyOpportunities(controller.signal),
      ]);

      if (controller.signal.aborted) {
        return;
      }

      if (profileResult.status === "rejected") {
        setState({
          status:
            profileResult.reason instanceof ApiError && profileResult.reason.status === 401
              ? "unauthorized"
              : "error",
          profile: null,
          opportunities: [],
          opportunitiesError: null,
          error: profileResult.reason,
        });
        return;
      }

      const profile = profileResult.value;
      const opportunities =
        opportunitiesResult.status === "fulfilled" && Array.isArray(opportunitiesResult.value)
          ? opportunitiesResult.value
          : [];
      const opportunitiesError =
        opportunitiesResult.status === "rejected" ? opportunitiesResult.reason : null;

      setState({
        status: "ready",
        profile,
        opportunities,
        opportunitiesError,
        error: null,
      });
      setDraft(createProfileDraft(profile));

      const links = parseSocialLinks(profile?.socials);
      setSocialLinks(links.length > 0 ? links : [""]);
      setIsBasicProfileEditing(false);
    }

    load().catch((error) => {
      if (controller.signal.aborted) {
        return;
      }

      setState({
        status: error instanceof ApiError && error.status === 401 ? "unauthorized" : "error",
        profile: null,
        opportunities: [],
        opportunitiesError: null,
        error,
      });
    });

    return () => controller.abort();
  }, []);

  const opportunityItems = useMemo(
    () => state.opportunities.map(createCompanyOpportunityCardItem),
    [state.opportunities]
  );
  const visibleSocialLinks = useMemo(
    () => socialLinks.map((link) => link.trim()).filter(Boolean),
    [socialLinks]
  );

  function markDirty() {
    setSaveState((current) =>
      current.status === "success" ? { status: "idle", error: "" } : current
    );
  }

  function handleDraftChange(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    markDirty();
  }

  function handleHeroMediaChange(field, value) {
    setDraft((current) => ({
      ...current,
      heroMedia: {
        ...current.heroMedia,
        [field]: value,
        ...(field === "sourceUrl" ? { previewUrl: "" } : {}),
      },
    }));
    markDirty();
  }

  function handleGalleryChange(galleryItemId, field, value) {
    setDraft((current) => ({
      ...current,
      gallery: current.gallery.map((item) =>
        item.id === galleryItemId ? { ...item, [field]: value } : item
      ),
    }));
    markDirty();
  }

  function handleAddGalleryItem() {
    setDraft((current) => ({
      ...current,
      gallery: [
        ...current.gallery,
        withStableId(createCompanyGalleryItemDraft(), "gallery"),
      ],
    }));
    markDirty();
  }

  function handleRemoveGalleryItem(galleryItemId) {
    setDraft((current) => ({
      ...current,
      gallery: current.gallery.filter((item) => item.id !== galleryItemId),
    }));
    markDirty();
  }

  function handleRemoveCaseStudy(caseStudyId) {
    setDraft((current) => ({
      ...current,
      caseStudies: current.caseStudies.filter((item) => item.id !== caseStudyId),
    }));
    markDirty();
  }

  function handleSocialLinkChange(index, value) {
    setSocialLinks((current) =>
      current.map((link, currentIndex) => (currentIndex === index ? value : link))
    );
    markDirty();
  }

  function handleAddSocialLink() {
    setSocialLinks((current) => [...current, ""]);
    markDirty();
  }

  function handleRemoveSocialLink(index) {
    setSocialLinks((current) => {
      if (current.length <= 1) {
        return [""];
      }

      return current.filter((_, currentIndex) => currentIndex !== index);
    });
    markDirty();
  }

  function syncBasicProfile(profile) {
    setState((current) => ({ ...current, profile }));
    setDraft((current) => ({
      ...current,
      ...createBasicProfileDraft(profile),
    }));

    const links = parseSocialLinks(profile?.socials);
    setSocialLinks(links.length > 0 ? links : [""]);
  }

  function syncFullProfile(profile) {
    setState((current) => ({ ...current, profile }));
    setDraft(createProfileDraft(profile));

    const links = parseSocialLinks(profile?.socials);
    setSocialLinks(links.length > 0 ? links : [""]);
  }

  function handleOpenBasicProfileEditor() {
    setIsBasicProfileEditing(true);
  }

  function handleCancelBasicProfileEditor() {
    const links = parseSocialLinks(state.profile?.socials);

    setDraft((current) => ({
      ...current,
      ...createBasicProfileDraft(state.profile),
    }));
    setSocialLinks(links.length > 0 ? links : [""]);
    setSaveState({ status: "idle", error: "" });
    setIsBasicProfileEditing(false);
  }

  function resetCaseStudyForm() {
    setCaseStudyForm(createCaseStudyForm());
    setCaseStudyFormError("");
  }

  function handleOpenPortfolioModal() {
    resetCaseStudyForm();
    setPortfolioModalOpen(true);
  }

  function handleClosePortfolioModal() {
    setPortfolioModalOpen(false);
    resetCaseStudyForm();
  }

  function handleCaseStudyFieldChange(field, value) {
    setCaseStudyForm((current) => ({ ...current, [field]: value }));
    setCaseStudyFormError("");
  }

  async function handleCaseStudyFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (file.size > CASE_STUDY_MAX_SIZE_BYTES) {
      setCaseStudyFormError(
        `Размер файла превышает ${formatCaseStudyFileSize(CASE_STUDY_MAX_SIZE_BYTES)}.`
      );
      return;
    }

    try {
      const previewUrl = await readCompanyMediaFileAsDataUrl(file);
      setCaseStudyForm((current) => ({ ...current, previewUrl }));
      setCaseStudyFormError("");
    } catch (error) {
      setCaseStudyFormError(error?.message ?? "Не удалось загрузить изображение проекта.");
    }
  }

  function handleCaseStudySubmit(event) {
    event.preventDefault();

    if (!caseStudyForm.previewUrl.trim()) {
      setCaseStudyFormError("Загрузите изображение проекта.");
      return;
    }

    if (!caseStudyForm.description.trim()) {
      setCaseStudyFormError("Добавьте краткое описание проекта.");
      return;
    }

    if (!caseStudyForm.sourceUrl.trim()) {
      setCaseStudyFormError("Добавьте ссылку на проект.");
      return;
    }

    setDraft((current) => ({
      ...current,
      caseStudies: [
        ...current.caseStudies,
        createCaseStudyItemFromForm(caseStudyForm, current.caseStudies.length),
      ],
    }));
    markDirty();
    handleClosePortfolioModal();
  }

  async function persistBasicProfile() {
    setSaveState({ status: "saving", error: "" });

    try {
      const profile = await updateCompanyProfile({
        companyName: draft.companyName.trim(),
        legalAddress: draft.legalAddress.trim() || null,
        description: draft.description.trim() || null,
        socials: stringifySocialLinks(socialLinks) || null,
      });

      syncBasicProfile(profile);
      setSaveState({ status: "success", error: "" });
      setIsBasicProfileEditing(false);
      return profile;
    } catch (error) {
      setSaveState({
        status: "error",
        error: error?.message ?? "Не удалось сохранить данные компании.",
      });
      return null;
    }
  }

  async function persistFullProfile() {
    setSaveState({ status: "saving", error: "" });

    try {
      const profile = await updateCompanyProfile({
        companyName: draft.companyName.trim(),
        legalAddress: draft.legalAddress.trim() || null,
        description: draft.description.trim() || null,
        socials: stringifySocialLinks(socialLinks) || null,
        heroMediaJson: serializeCompanyHeroMedia(draft.heroMedia),
        caseStudiesJson: serializeCompanyCaseStudies(draft.caseStudies),
        galleryJson: serializeCompanyGallery(draft.gallery),
      });

      syncFullProfile(profile);
      setSaveState({ status: "success", error: "" });
      return profile;
    } catch (error) {
      setSaveState({
        status: "error",
        error: error?.message ?? "Не удалось сохранить данные компании.",
      });
      return null;
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    await persistFullProfile();
  }

  if (state.status === "loading") {
    return <Loader label="Загружаем данные компании" surface />;
  }

  if (state.status === "unauthorized") {
    return (
      <CabinetContentSection
        eyebrow="Доступ ограничен"
        title="Нужно войти как компания"
        description="Раздел компании доступен только работодателю."
      >
        <EmptyState
          title="Нет доступа к данным компании"
          description="После авторизации здесь появятся основные блоки кабинета компании."
          tone="warning"
        />
      </CabinetContentSection>
    );
  }

  if (state.status === "error") {
    return (
      <Alert tone="error" title="Не удалось загрузить раздел компании" showIcon>
        {state.error?.message ?? "Попробуйте обновить страницу позже."}
      </Alert>
    );
  }

  return (
    <>
      <form className="company-dashboard-stack" onSubmit={handleSave} noValidate>
        {saveState.status === "error" ? (
          <Alert tone="error" title="Изменения не сохранены" showIcon>
            {saveState.error}
          </Alert>
        ) : null}

        {saveState.status === "success" ? (
          <Alert tone="success" title="Страница компании обновлена" showIcon>
            Основные данные, media, кейсы и галерея сохранены и уже готовы для публичной страницы.
          </Alert>
        ) : null}

        <div className="company-dashboard-priority-block">
          <CompanyVerificationSection
            profile={state.profile}
            draft={draft}
            onProfileUpdated={(profile) => setState((current) => ({ ...current, profile }))}
          />
        </div>

        <CabinetContentSection
          className="company-dashboard-section company-dashboard-section--basic"
          eyebrow="Страница компании"
          title="Основная информация"
          description="Настройте публичный профиль компании и добавьте ссылки, которые увидят кандидаты."
          actions={isBasicProfileEditing ? (
            <div className="company-dashboard-panel__actions company-dashboard-panel__actions--compact">
              <Button type="button" variant="ghost" size="sm" onClick={handleCancelBasicProfileEditor}>
                Отмена
              </Button>
              <Button type="button" size="sm" onClick={persistBasicProfile} disabled={saveState.status === "saving"}>
                {saveState.status === "saving" ? "Сохраняем..." : "Сохранить"}
              </Button>
            </div>
          ) : (
            <Button type="button" variant="secondary" size="sm" onClick={handleOpenBasicProfileEditor}>
              Редактировать
            </Button>
          )}
        >
          <div className="company-dashboard-stack">
            <Card className="company-dashboard-profile-hero-card" tone="neutral">
              <span className="company-dashboard-profile-hero-card__eyebrow">Публичный профиль</span>
              <h3 className="company-dashboard-profile-hero-card__title">
                {draft.companyName.trim() || "Название компании"}
              </h3>
              {draft.legalAddress.trim() ? (
                <p className="company-dashboard-profile-hero-card__meta">{draft.legalAddress.trim()}</p>
              ) : null}
              <p className="company-dashboard-profile-hero-card__description">
                {draft.description.trim() || "Краткое описание пока не заполнено."}
              </p>
              <div className="company-dashboard-profile-hero-card__facts">
                <span>ИНН: {state.profile?.inn || "не указан"}</span>
                <span>{visibleSocialLinks.length ? `${visibleSocialLinks.length} ссылок` : "Ссылки не добавлены"}</span>
              </div>
              {visibleSocialLinks.length ? (
                <div className="company-dashboard-profile-hero-card__links">
                  {visibleSocialLinks.map((link) => (
                    <span key={link} className="company-dashboard-profile-hero-card__link">
                      {link.replace(/^https?:\/\//i, "").replace(/^mailto:/i, "")}
                    </span>
                  ))}
                </div>
              ) : null}
            </Card>

            {isBasicProfileEditing ? (
              <>
                <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
              <FormField label="Название компании" required>
                <Input value={draft.companyName} onValueChange={(value) => handleDraftChange("companyName", value)} />
              </FormField>
              <FormField label="Юридический адрес">
                <Input
                  value={draft.legalAddress}
                  onValueChange={(value) => handleDraftChange("legalAddress", value)}
                />
              </FormField>
            </div>

            <FormField label="Описание">
              <Textarea
                value={draft.description}
                onValueChange={(value) => handleDraftChange("description", value)}
                rows={5}
                autoResize
              />
            </FormField>

            <FormField label="Соцсети / ссылки">
              <div className="company-dashboard-social-links">
                {socialLinks.map((link, index) => (
                  <div className="company-dashboard-social-links__row" key={`social-link-${index}`}>
                    <Input
                      value={link}
                      onValueChange={(value) => handleSocialLinkChange(index, value)}
                      placeholder="https://"
                    />
                    <Button type="button" variant="ghost" onClick={() => handleRemoveSocialLink(index)}>
                      Удалить
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="secondary" onClick={handleAddSocialLink}>
                  Добавить ссылку
                </Button>
              </div>
            </FormField>

              </>
            ) : null}
          </div>
        </CabinetContentSection>

        <CabinetContentSection
          eyebrow="Публичные блоки"
          title="О компании, кейсы и галерея"
          description="Эти же секции откроются на публичной странице, только без кнопок редактирования."
        >
          <div className="company-dashboard-stack">
            <div className="company-dashboard-layout">
              <CompanyHeroMediaPanel
                media={draft.heroMedia}
                mode="editor"
                compact
                eyebrow="О компании"
                title={draft.heroMedia.title || "Видео-презентация и атмосфера команды"}
                description="Оставьте подпись, описание и ссылку на фото или видео. Формат определится автоматически."
                onChange={handleHeroMediaChange}
              />

              <CompanyPortfolioCarousel
                mode="editor"
                items={draft.caseStudies}
                compact
                eyebrow="Кейсы"
                title="Портфолио компании"
                description="Готовый slider уже показывает публичные карточки. Новые проекты добавляются через кнопку внутри блока."
                onCtaClick={handleOpenPortfolioModal}
              />
            </div>

            <div className="company-dashboard-stack">
              <div className="company-dashboard-section-intro">
                <span className="company-dashboard-section-intro__eyebrow">Галерея</span>
                <h3 className="company-dashboard-section-intro__title">Наш офис и команда</h3>
                <p className="company-dashboard-section-intro__description">
                  Лента фото работает одинаково в кабинете и в публичном просмотре. В редакторе можно загружать, подписывать и удалять карточки.
                </p>
              </div>

              <CompanyGalleryPanel
                items={draft.gallery}
                mode="editor"
                compact
                onAddItem={handleAddGalleryItem}
                onRemoveItem={handleRemoveGalleryItem}
                onItemChange={handleGalleryChange}
              />
            </div>
          </div>
        </CabinetContentSection>

        <CabinetContentSection
          eyebrow="Публикации"
          title="Возможности компании"
          description="Здесь показываются ваши текущие вакансии, стажировки и мероприятия в виде общей горизонтальной ленты."
        >
          <div className="company-dashboard-stack">
            <div className="company-dashboard-section-toolbar">
              <div className="company-dashboard-section-toolbar__copy">
                <h3 className="company-dashboard-section-toolbar__title">Лента возможностей</h3>
                <p className="company-dashboard-section-toolbar__description">
                  Тот же формат карточек увидит и пользователь на публичной странице компании.
                </p>
              </div>
              <Button href={routes.company.opportunities} variant="secondary">
                Управлять публикациями
              </Button>
            </div>

            {state.opportunitiesError ? (
              <Alert tone="warning" title="Не удалось загрузить часть публикаций" showIcon>
                {state.opportunitiesError?.message ?? "Проверьте подключение и откройте раздел позже."}
              </Alert>
            ) : null}

            {opportunityItems.length ? (
              <OpportunityBlockRail
                items={opportunityItems}
                className="company-dashboard-opportunity-rail"
                size="sm"
                surface="panel"
                cardPropsBuilder={(item) => ({
                  showSave: false,
                  detailAction: {
                    href: item.detailHref,
                    label: "Подробнее",
                    variant: "secondary",
                  },
                })}
              />
            ) : (
              <Card>
                <EmptyState
                  compact
                  tone="neutral"
                  title="Пока нет активных публикаций"
                  description="Создайте вакансию, стажировку или мероприятие, и они сразу появятся в этой ленте."
                  actions={<Button href={routes.company.opportunities}>Открыть раздел публикаций</Button>}
                />
              </Card>
            )}

            <div className="company-dashboard-panel__actions">
              <Button type="submit" disabled={saveState.status === "saving"}>
                {saveState.status === "saving" ? "Сохраняем..." : "Сохранить контент страницы"}
              </Button>
            </div>
          </div>
        </CabinetContentSection>
      </form>

      <Modal
        open={portfolioModalOpen}
        onClose={handleClosePortfolioModal}
        title="Добавить проект"
        description="Загрузите изображение проекта, добавьте краткое описание и ссылку для перехода с публичной страницы."
        size="lg"
      >
        <div className="company-dashboard-project-modal">
          {draft.caseStudies.length ? (
            <div className="company-dashboard-project-modal__list" role="list" aria-label="Текущие проекты">
              {draft.caseStudies.map((item, index) => (
                <Card key={item.id} className="company-dashboard-project-modal__item" role="listitem" tone="neutral">
                  <div className="company-dashboard-project-modal__item-media">
                    {item.previewUrl ? (
                      <img src={item.previewUrl} alt={item.title || `Проект ${index + 1}`} loading="lazy" />
                    ) : null}
                  </div>
                  <div className="company-dashboard-project-modal__item-copy">
                    <strong>{item.description || item.title || `Проект ${index + 1}`}</strong>
                    {item.sourceUrl ? <span>{item.sourceUrl}</span> : null}
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveCaseStudy(item.id)}>
                    Удалить
                  </Button>
                </Card>
              ))}
            </div>
          ) : null}

          <form className="company-dashboard-project-modal__form" onSubmit={handleCaseStudySubmit}>
            <input
              ref={caseStudyFileInputRef}
              type="file"
              accept={CASE_STUDY_ACCEPT}
              className="company-dashboard-project-modal__file-input"
              onChange={handleCaseStudyFileChange}
            />

            <Card className="company-dashboard-project-modal__upload-card" tone="neutral">
              {caseStudyForm.previewUrl ? (
                <img
                  src={caseStudyForm.previewUrl}
                  alt="Превью проекта"
                  className="company-dashboard-project-modal__upload-image"
                  loading="lazy"
                />
              ) : (
                <button
                  type="button"
                  className="company-dashboard-project-modal__upload-button"
                  onClick={() => caseStudyFileInputRef.current?.click()}
                >
                  <strong>Загрузить фото проекта</strong>
                  <span>Поддерживаются PNG, JPG, WEBP и GIF.</span>
                </button>
              )}
            </Card>

            {caseStudyForm.previewUrl ? (
              <div className="company-dashboard-project-modal__upload-actions">
                <Button type="button" variant="secondary" size="sm" onClick={() => caseStudyFileInputRef.current?.click()}>
                  Заменить фото
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCaseStudyFieldChange("previewUrl", "")}
                >
                  Очистить
                </Button>
              </div>
            ) : null}

            <FormField label="Краткое описание проекта">
              <Input
                value={caseStudyForm.description}
                onValueChange={(value) => handleCaseStudyFieldChange("description", value)}
                placeholder="Например: внутренний сервис аналитики"
              />
            </FormField>

            <FormField label="Ссылка на проект">
              <Input
                value={caseStudyForm.sourceUrl}
                onValueChange={(value) => handleCaseStudyFieldChange("sourceUrl", value)}
                placeholder="https://..."
              />
            </FormField>

            {caseStudyFormError ? (
              <Alert tone="error" title="Проект не добавлен" showIcon>
                {caseStudyFormError}
              </Alert>
            ) : null}

            <div className="company-dashboard-project-modal__footer">
              <Button type="button" variant="ghost" onClick={handleClosePortfolioModal}>
                Закрыть
              </Button>
              <Button type="submit">Добавить проект</Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
