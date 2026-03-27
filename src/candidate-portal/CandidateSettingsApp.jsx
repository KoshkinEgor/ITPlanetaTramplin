import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { buildForgotPasswordRoute } from "../app/routes";
import {
  createCandidateEducation,
  deleteCandidateEducation,
  getCandidateEducation,
  getCandidateProfile,
  updateCandidateEducation,
  updateCandidateProfile,
} from "../api/candidate";
import {
  createCandidateEducationDraft,
  createEducationDraftListAfterRemove,
  getActiveCandidateEducationDrafts,
  getCandidateEducationDraftErrors,
} from "./education";
import { ApiError } from "../lib/http";
import {
  Alert,
  Button,
  Card,
  EducationListEditor,
  EmptyState,
  FormField,
  Input,
  Loader,
  Select,
  SettingsSectionCard,
  Switch,
  Tag,
  TagSelector,
  Textarea,
} from "../shared/ui";
import { CANDIDATE_SETTINGS_SECTIONS, CANDIDATE_SKILL_SUGGESTIONS } from "./config";
import {
  buildCandidateOnboardingLinks,
  CANDIDATE_CITIZENSHIP_OPTIONS,
  CANDIDATE_CITY_OPTIONS,
  CANDIDATE_GENDER_OPTIONS,
  createCandidateOnboardingDraft,
  getCandidateProfileLinks,
} from "./onboarding";
import { getCandidateAvatarUrl } from "./mappers";
import { CandidateSectionHeader } from "./shared";

const CITY_OPTIONS = CANDIDATE_CITY_OPTIONS.map((value) => ({ value, label: value }));
const CITIZENSHIP_OPTIONS = CANDIDATE_CITIZENSHIP_OPTIONS.map((value) => ({ value, label: value }));
const PROFILE_AVATAR_MAX_SIZE_BYTES = 3 * 1024 * 1024;
const PROFILE_AVATAR_ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml";

const VISIBILITY_OPTIONS = [
  { value: "everyone", label: "Все пользователи" },
  { value: "employers-and-contacts", label: "Работодатели и контакты" },
  { value: "contacts", label: "Только контакты" },
  { value: "nobody", label: "Только я" },
];

const AUDIENCE_OPTIONS = [
  { value: "everyone", label: "Все пользователи" },
  { value: "contacts", label: "Только контакты" },
  { value: "employers-and-contacts", label: "Работодатели и контакты" },
  { value: "employers", label: "Только работодатели" },
];

function createIdleSaveState() {
  return { status: "idle", error: "" };
}

function createSaveStates() {
  return {
    profile: createIdleSaveState(),
    contacts: createIdleSaveState(),
    privacy: createIdleSaveState(),
  };
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} КБ`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string" && reader.result) {
        resolve(reader.result);
        return;
      }

      reject(new Error("Не удалось прочитать изображение."));
    };

    reader.onerror = () => {
      reject(new Error("Не удалось прочитать изображение."));
    };

    reader.readAsDataURL(file);
  });
}

function normalizeLoginItems(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isRecord)
    .map((item) => ({
      title: normalizeString(item.title) || "Неизвестное устройство",
      meta: normalizeString(item.meta),
    }))
    .filter((item) => item.title || item.meta);
}

function createDraft(profile, education = []) {
  const onboardingDraft = createCandidateOnboardingDraft({ profile, education });
  const links = getCandidateProfileLinks(profile);
  const contacts = isRecord(links.contacts) ? links.contacts : {};
  const preferences = isRecord(links.preferences) ? links.preferences : {};
  const visibility = isRecord(preferences.visibility) ? preferences.visibility : {};
  const audience = isRecord(preferences.audience) ? preferences.audience : {};
  const notifications = isRecord(preferences.notifications) ? preferences.notifications : {};
  const security = isRecord(links.security) ? links.security : {};

  return {
    ...onboardingDraft,
    description: profile?.description ?? "",
    avatarUrl: getCandidateAvatarUrl(profile),
    socials: {
      vk: normalizeString(contacts.vk),
      telegram: normalizeString(contacts.telegram),
      behance: normalizeString(contacts.behance),
      portfolio: normalizeString(contacts.portfolio),
    },
    privacy: {
      profileVisibility: normalizeString(visibility.profileVisibility) || "employers-and-contacts",
      projectsVisibility: normalizeString(visibility.projectsVisibility) || "contacts",
      activityVisibility: normalizeString(visibility.activityVisibility) || "everyone",
      profileAudience: normalizeString(audience.profileAudience) || "contacts",
      contactsAudience: normalizeString(audience.contactsAudience) || "employers-and-contacts",
      messagesAudience: normalizeString(audience.messagesAudience) || "everyone",
      responseStatus: notifications.responseStatus !== false,
      recommendationAlerts: notifications.recommendationAlerts !== false,
      contactInvites: notifications.contactInvites !== false,
      newOpportunities: Boolean(notifications.newOpportunities),
    },
    lastLogins: normalizeLoginItems(security.lastLogins),
  };
}

function getOpenSection(searchParams) {
  const section = searchParams.get("section");
  return CANDIDATE_SETTINGS_SECTIONS.some((item) => item.id === section)
    ? section
    : "";
}

function getProfileInitials(draft) {
  return [draft.name, draft.surname]
    .map((part) => normalizeString(part))
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "ПК";
}

function hasEducationData(draft) {
  return getActiveCandidateEducationDrafts(draft.educations).length > 0;
}

function buildEducationPayload(item) {
  return {
    institutionName: normalizeString(item.institutionName),
    faculty: normalizeString(item.faculty),
    specialization: normalizeString(item.specialization),
    startYear: null,
    graduationYear: item.graduationYear ? Number(item.graduationYear) : null,
    isCompleted: Boolean(item.graduationYear),
    description: null,
  };
}

function buildLinksPayload(profile, draft) {
  const baseLinks = buildCandidateOnboardingLinks(profile, draft);
  const currentContacts = isRecord(baseLinks.contacts) ? baseLinks.contacts : {};
  const currentPreferences = isRecord(baseLinks.preferences) ? baseLinks.preferences : {};

  return {
    ...baseLinks,
    contacts: {
      ...currentContacts,
      vk: normalizeString(draft.socials.vk),
      telegram: normalizeString(draft.socials.telegram),
      behance: normalizeString(draft.socials.behance),
      portfolio: normalizeString(draft.socials.portfolio),
    },
    avatarUrl: normalizeString(draft.avatarUrl) || null,
    preferences: {
      ...currentPreferences,
      visibility: {
        profileVisibility: draft.privacy.profileVisibility,
        projectsVisibility: draft.privacy.projectsVisibility,
        activityVisibility: draft.privacy.activityVisibility,
      },
      audience: {
        profileAudience: draft.privacy.profileAudience,
        contactsAudience: draft.privacy.contactsAudience,
        messagesAudience: draft.privacy.messagesAudience,
      },
      notifications: {
        responseStatus: Boolean(draft.privacy.responseStatus),
        recommendationAlerts: Boolean(draft.privacy.recommendationAlerts),
        contactInvites: Boolean(draft.privacy.contactInvites),
        newOpportunities: Boolean(draft.privacy.newOpportunities),
      },
    },
  };
}

function SectionSaveAlert({ saveState, successTitle, successText }) {
  if (saveState.status === "error") {
    return (
      <Alert tone="error" title="Не удалось сохранить изменения" showIcon>
        {saveState.error}
      </Alert>
    );
  }

  if (saveState.status === "success") {
    return (
      <Alert tone="success" title={successTitle} showIcon>
        {successText}
      </Alert>
    );
  }

  return null;
}

function CandidateSettingsSaveButton({ disabled, label = "Сохранить", centered = false }) {
  return (
    <div className={`candidate-settings-detail__save${centered ? " is-centered" : ""}`}>
      <Button type="submit" disabled={disabled}>
        {label}
      </Button>
    </div>
  );
}

function CandidateProfileSettingsForm({
  draft,
  errors,
  saveState,
  avatarInputRef,
  avatarError,
  isPreparingAvatar,
  onChange,
  onAvatarUpload,
  onAvatarClear,
  onEducationChange,
  onEducationAdd,
  onEducationRemove,
  onSave,
}) {
  return (
    <form className="candidate-settings-detail" onSubmit={onSave} noValidate>
      <SectionSaveAlert
        saveState={saveState}
        successTitle="Личные данные обновлены"
        successText="Профиль, образование и навыки сохранены и сразу используются в кабинете."
      />

      <section className="candidate-settings-detail__section">
        <h4 className="candidate-settings-detail__section-title">Основная информация</h4>

        <div className="candidate-settings-profile-row">
          <div className="candidate-settings-photo">
            <span className="candidate-settings-photo__label">Фото профиля</span>
            <div className="candidate-settings-photo__surface">
              {draft.avatarUrl ? (
                <img className="candidate-settings-photo__image" src={draft.avatarUrl} alt="Фото профиля" />
              ) : (
                <span aria-hidden="true">{getProfileInitials(draft)}</span>
              )}
            </div>
            <input
              ref={avatarInputRef}
              className="candidate-settings-photo__input"
              type="file"
              accept={PROFILE_AVATAR_ACCEPT}
              onChange={onAvatarUpload}
              aria-label="Загрузить фото профиля"
            />
            <div className="candidate-settings-photo__actions">
              <button type="button" className="candidate-settings-photo__edit" onClick={() => avatarInputRef.current?.click()} disabled={isPreparingAvatar}>
                {isPreparingAvatar ? "Загружаем..." : draft.avatarUrl ? "Загрузить новое фото" : "Загрузить фото"}
              </button>
              {draft.avatarUrl ? (
                <button type="button" className="candidate-settings-photo__reset" onClick={onAvatarClear}>
                  Удалить
                </button>
              ) : null}
            </div>
            <p className="candidate-settings-photo__hint">
              Поддерживаются PNG, JPG, WEBP, GIF и SVG. Максимальный размер: {formatFileSize(PROFILE_AVATAR_MAX_SIZE_BYTES)}.
            </p>
            {avatarError ? <p className="candidate-settings-photo__error" role="alert">{avatarError}</p> : null}
            <button type="button" className="candidate-settings-photo__edit candidate-settings-photo__edit--legacy" hidden aria-hidden="true" tabIndex={-1}>
              Загрузка аватара появится позже
            </button>
          </div>

          <div className="candidate-settings-detail__grid">
            <FormField label="Фамилия" required error={errors.surname}>
              <Input value={draft.surname} onValueChange={(value) => onChange("surname", value)} placeholder="Иванова" />
            </FormField>
            <FormField label="Отчество">
              <Input value={draft.thirdname} onValueChange={(value) => onChange("thirdname", value)} placeholder="Сергеевна" />
            </FormField>
            <FormField label="Профессия">
              <Input value={draft.profession} onValueChange={(value) => onChange("profession", value)} placeholder="Дизайнер интерфейсов" />
            </FormField>
            <FormField label="Пол">
              <Select
                value={draft.gender}
                onValueChange={(value) => onChange("gender", value)}
                placeholder="Выберите пол"
                options={CANDIDATE_GENDER_OPTIONS}
              />
            </FormField>
          </div>

          <div className="candidate-settings-detail__grid">
            <FormField label="Имя" required error={errors.name}>
              <Input value={draft.name} onValueChange={(value) => onChange("name", value)} placeholder="Анна" />
            </FormField>
            <FormField label="Дата рождения">
              <Input type="date" value={draft.birthDate} onValueChange={(value) => onChange("birthDate", value)} />
            </FormField>
            <FormField label="Город">
              <Select
                value={draft.city}
                onValueChange={(value) => onChange("city", value)}
                placeholder="Выберите город"
                options={CITY_OPTIONS}
              />
            </FormField>
            <FormField label="Гражданство">
              <Select
                value={draft.citizenship}
                onValueChange={(value) => onChange("citizenship", value)}
                placeholder="Выберите гражданство"
                options={CITIZENSHIP_OPTIONS}
              />
            </FormField>
          </div>
        </div>

        <FormField label="О себе">
          <Textarea
            value={draft.description}
            onValueChange={(value) => onChange("description", value)}
            autoResize
            rows={5}
            placeholder="Расскажите о себе, о сильных сторонах и о том, что хотите делать дальше."
          />
        </FormField>

        <FormField label="Карьерная цель">
          <Textarea
            value={draft.goal}
            onValueChange={(value) => onChange("goal", value)}
            autoResize
            rows={3}
            placeholder="Например: пройти стажировку на позицию UX/UI дизайнера."
          />
        </FormField>
      </section>

      <section className="candidate-settings-detail__section">
        <div className="candidate-settings-detail__subtitle">Ключевые навыки</div>
        <TagSelector
          className="candidate-project-editor-tag-selector"
          title="Ключевые навыки"
          value={draft.skills}
          suggestions={CANDIDATE_SKILL_SUGGESTIONS}
          suggestionsLabel="Подсказки"
          searchPlaceholder="Поиск навыков"
          clearLabel="Очистить поиск"
          saveLabel="Сохранить навыки"
          onSave={(nextSkills) => onChange("skills", nextSkills)}
        />
      </section>

      <section className="candidate-settings-detail__section">
        <h4 className="candidate-settings-detail__section-title">Образование</h4>

        <EducationListEditor
          items={draft.educations}
          errorsByKey={errors.educationItems ?? {}}
          onItemChange={onEducationChange}
          onAddItem={onEducationAdd}
          onRemoveItem={onEducationRemove}
        />
      </section>

      <CandidateSettingsSaveButton
        disabled={saveState.status === "saving" || isPreparingAvatar}
        label={saveState.status === "saving" ? "Сохраняем..." : "Сохранить"}
      />
    </form>
  );
}

function CandidateContactsSettingsForm({ draft, saveState, onChange, onSocialChange, onSave }) {
  return (
    <form className="candidate-settings-detail" onSubmit={onSave} noValidate>
      <SectionSaveAlert
        saveState={saveState}
        successTitle="Контакты обновлены"
        successText="Телефон и публичные ссылки сохранены в профиле соискателя."
      />

      <section className="candidate-settings-detail__section">
        <h4 className="candidate-settings-detail__section-title">Контактные данные</h4>

        <div className="candidate-settings-detail__grid candidate-settings-detail__grid--two">
          <FormField label="Телефон">
            <Input value={draft.phone} onValueChange={(value) => onChange("phone", value)} placeholder="+7 999 000 00 00" />
          </FormField>
          <FormField label="Почта" hint="Email берётся из аккаунта и меняется отдельно.">
            <Input value={draft.email} readOnly copyable />
          </FormField>
        </div>
      </section>

      <section className="candidate-settings-detail__section">
        <div className="candidate-settings-detail__subtitle">Публичные профили</div>

        <div className="candidate-settings-detail__grid candidate-settings-detail__grid--two">
          <FormField label="ВКонтакте">
            <Input
              value={draft.socials.vk}
              onValueChange={(value) => onSocialChange("vk", value)}
              placeholder="username"
              addonStart={<span className="candidate-settings-contact-prefix">vk.com/</span>}
            />
          </FormField>
          <FormField label="Telegram">
            <Input
              value={draft.socials.telegram}
              onValueChange={(value) => onSocialChange("telegram", value.replace(/^@/, ""))}
              placeholder="username"
              addonStart={<span className="candidate-settings-contact-prefix">t.me/</span>}
            />
          </FormField>
        </div>

        <div className="candidate-settings-detail__grid candidate-settings-detail__grid--two">
          <FormField label="Behance">
            <Input
              value={draft.socials.behance}
              onValueChange={(value) => onSocialChange("behance", value)}
              placeholder="username"
              addonStart={<span className="candidate-settings-contact-prefix">behance.net/</span>}
            />
          </FormField>
          <FormField label="Портфолио">
            <Input
              value={draft.socials.portfolio}
              onValueChange={(value) => onSocialChange("portfolio", value)}
              placeholder="https://portfolio.example"
            />
          </FormField>
        </div>
      </section>

      <CandidateSettingsSaveButton
        disabled={saveState.status === "saving"}
        label={saveState.status === "saving" ? "Сохраняем..." : "Сохранить"}
      />
    </form>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m6 4 4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CandidateSecuritySettings({ email, phone, lastLogins }) {
  return (
    <div className="candidate-settings-detail">
      <section className="candidate-settings-fields">
        <div className="candidate-settings-fields__grid">
          <FormField label="Телефон">
            <Input value={phone || "Не указан"} readOnly />
          </FormField>
          <FormField label="Почта">
            <Input value={email || "Email не указан"} readOnly copyable />
          </FormField>
          <FormField label="Пароль" hint="Смена пароля вынесена в безопасный сценарий восстановления.">
            <Input value="************" readOnly type="password" revealable />
          </FormField>
        </div>

        <div className="candidate-settings-fields__actions">
          <Button href={buildForgotPasswordRoute({ email })} variant="secondary">
            Перейти к смене пароля
          </Button>
        </div>
      </section>

      <section className="candidate-settings-fields">
        <div className="candidate-settings-fields__subhead">Последние входы</div>

        {lastLogins.length ? (
          <div className="candidate-settings-fields__logins">
            {lastLogins.map((item) => (
              <button key={`${item.title}-${item.meta}`} type="button" className="candidate-settings-fields__login">
                <span>
                  <strong>{item.title}</strong>
                  {item.meta ? ` · ${item.meta}` : ""}
                </span>
                <ArrowRightIcon />
              </button>
            ))}
          </div>
        ) : (
          <p className="candidate-settings-detail__hint">История входов появится после следующих авторизаций в аккаунт.</p>
        )}
      </section>
    </div>
  );
}

function CandidatePrivacySettingsForm({ draft, saveState, onChange, onResetGroup, onSave }) {
  return (
    <form className="candidate-settings-detail candidate-settings-detail--privacy" onSubmit={onSave} noValidate>
      <SectionSaveAlert
        saveState={saveState}
        successTitle="Настройки приватности сохранены"
        successText="Видимость профиля и уведомления обновлены."
      />

      <div className="candidate-settings-privacy-grid">
        <Card className="candidate-settings-privacy-card">
          <div className="candidate-settings-privacy-card__head">
            <Tag>Публичность</Tag>
            <button type="button" className="candidate-settings-reset" onClick={() => onResetGroup("visibility")}>
              Сбросить
            </button>
          </div>

          <div className="candidate-settings-privacy-card__fields">
            <FormField label="Видимость анкеты">
              <Select value={draft.privacy.profileVisibility} onValueChange={(value) => onChange("profileVisibility", value)} options={VISIBILITY_OPTIONS} />
            </FormField>
            <FormField label="Видимость проектов">
              <Select value={draft.privacy.projectsVisibility} onValueChange={(value) => onChange("projectsVisibility", value)} options={VISIBILITY_OPTIONS} />
            </FormField>
            <FormField label="Видимость откликов">
              <Select value={draft.privacy.activityVisibility} onValueChange={(value) => onChange("activityVisibility", value)} options={VISIBILITY_OPTIONS} />
            </FormField>
          </div>
        </Card>

        <Card className="candidate-settings-privacy-card">
          <div className="candidate-settings-privacy-card__head">
            <Tag>Приватность</Tag>
            <button type="button" className="candidate-settings-reset" onClick={() => onResetGroup("audience")}>
              Сбросить
            </button>
          </div>

          <div className="candidate-settings-privacy-card__fields">
            <FormField label="Кто видит профиль">
              <Select value={draft.privacy.profileAudience} onValueChange={(value) => onChange("profileAudience", value)} options={AUDIENCE_OPTIONS} />
            </FormField>
            <FormField label="Кто видит контакты">
              <Select value={draft.privacy.contactsAudience} onValueChange={(value) => onChange("contactsAudience", value)} options={AUDIENCE_OPTIONS} />
            </FormField>
            <FormField label="Кто может писать">
              <Select value={draft.privacy.messagesAudience} onValueChange={(value) => onChange("messagesAudience", value)} options={AUDIENCE_OPTIONS} />
            </FormField>
          </div>
        </Card>
      </div>

      <Card className="candidate-settings-privacy-card candidate-settings-notifications-card">
        <div className="candidate-settings-privacy-card__head candidate-settings-privacy-card__head--center">
          <Tag>Уведомления</Tag>
          <button type="button" className="candidate-settings-reset" onClick={() => onResetGroup("notifications")}>
            Сбросить
          </button>
        </div>

        <div className="candidate-settings-switches">
          <div className="candidate-settings-switch-row">
            <Switch
              checked={draft.privacy.responseStatus}
              onChange={(event) => onChange("responseStatus", event.target.checked)}
              className="candidate-settings-switch"
              label="Изменения статуса отклика"
            />
          </div>
          <div className="candidate-settings-switch-row">
            <Switch
              checked={draft.privacy.recommendationAlerts}
              onChange={(event) => onChange("recommendationAlerts", event.target.checked)}
              className="candidate-settings-switch"
              label="Новые рекомендации"
            />
          </div>
          <div className="candidate-settings-switch-row">
            <Switch
              checked={draft.privacy.contactInvites}
              onChange={(event) => onChange("contactInvites", event.target.checked)}
              className="candidate-settings-switch"
              label="Приглашения в контакты"
            />
          </div>
          <div className="candidate-settings-switch-row">
            <Switch
              checked={draft.privacy.newOpportunities}
              onChange={(event) => onChange("newOpportunities", event.target.checked)}
              className="candidate-settings-switch"
              label="Новые возможности"
            />
          </div>
        </div>
      </Card>

      <CandidateSettingsSaveButton
        centered
        disabled={saveState.status === "saving"}
        label={saveState.status === "saving" ? "Сохраняем..." : "Сохранить"}
      />
    </form>
  );
}

export function CandidateSettingsApp({ onSummaryChange }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const avatarInputRef = useRef(null);
  const [state, setState] = useState({
    status: "loading",
    profile: null,
    education: [],
    draft: createDraft(null, []),
    error: null,
  });
  const [formErrors, setFormErrors] = useState({});
  const [saveState, setSaveState] = useState(createSaveStates);
  const [avatarState, setAvatarState] = useState({ status: "idle", error: "" });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const [profile, education] = await Promise.all([
          getCandidateProfile(controller.signal),
          getCandidateEducation(controller.signal),
        ]);
        const educationItems = Array.isArray(education) ? education : [];

        setState({
          status: "ready",
          profile,
          education: educationItems,
          draft: createDraft(profile, educationItems),
          error: null,
        });
        setAvatarState({ status: "idle", error: "" });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: error instanceof ApiError && error.status === 401 ? "unauthorized" : "error",
          profile: null,
          education: [],
          draft: createDraft(null, []),
          error,
        });
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const openSection = getOpenSection(searchParams);

  function clearSaveFeedback(keys = ["profile", "contacts", "privacy"]) {
    setSaveState((current) => {
      const next = { ...current };
      let hasChanges = false;

      keys.forEach((key) => {
        if (current[key]?.status !== "idle") {
          next[key] = createIdleSaveState();
          hasChanges = true;
        }
      });

      return hasChanges ? next : current;
    });
  }

  function updateDraft(updater, keysToReset) {
    setState((current) => ({
      ...current,
      draft: typeof updater === "function" ? updater(current.draft) : updater,
    }));
    clearSaveFeedback(keysToReset);
  }

  function handleRootChange(field, value) {
    updateDraft((currentDraft) => ({ ...currentDraft, [field]: value }), field === "phone" ? ["profile", "contacts"] : ["profile"]);

    setFormErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleAvatarUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setAvatarState({ status: "error", error: "Загрузите изображение в формате PNG, JPG, WEBP, GIF или SVG." });
      return;
    }

    if (file.size > PROFILE_AVATAR_MAX_SIZE_BYTES) {
      setAvatarState({
        status: "error",
        error: `Файл слишком большой. Максимальный размер: ${formatFileSize(PROFILE_AVATAR_MAX_SIZE_BYTES)}.`,
      });
      return;
    }

    setAvatarState({ status: "loading", error: "" });

    try {
      const avatarUrl = await readFileAsDataUrl(file);
      updateDraft((currentDraft) => ({ ...currentDraft, avatarUrl }), ["profile"]);
      setAvatarState({ status: "idle", error: "" });
    } catch (error) {
      setAvatarState({ status: "error", error: error?.message ?? "Не удалось загрузить изображение." });
    }
  }

  function handleAvatarClear() {
    updateDraft((currentDraft) => ({ ...currentDraft, avatarUrl: "" }), ["profile"]);
    setAvatarState({ status: "idle", error: "" });
  }

  function handleEducationChange(draftKey, field, value) {
    updateDraft((currentDraft) => ({
      ...currentDraft,
      educations: currentDraft.educations.map((item) => (
        item.draftKey === draftKey
          ? { ...item, [field]: value }
          : item
      )),
    }), ["profile"]);

    setFormErrors((current) => {
      const next = { ...current };
      if (next.educationItems?.[draftKey]) {
        next.educationItems = { ...next.educationItems };
        delete next.educationItems[draftKey];
        if (!Object.keys(next.educationItems).length) {
          delete next.educationItems;
        }
      }
      return next;
    });
  }

  function handleEducationAdd() {
    updateDraft((currentDraft) => ({
      ...currentDraft,
      educations: [...currentDraft.educations, createCandidateEducationDraft()],
    }), ["profile"]);
  }

  function handleEducationRemove(draftKey) {
    updateDraft((currentDraft) => ({
      ...currentDraft,
      educations: createEducationDraftListAfterRemove(currentDraft.educations, draftKey),
    }), ["profile"]);

    setFormErrors((current) => {
      if (!current.educationItems?.[draftKey]) {
        return current;
      }

      const next = { ...current, educationItems: { ...current.educationItems } };
      delete next.educationItems[draftKey];
      if (!Object.keys(next.educationItems).length) {
        delete next.educationItems;
      }
      return next;
    });
  }

  function handleSocialChange(field, value) {
    updateDraft((currentDraft) => ({
      ...currentDraft,
      socials: {
        ...currentDraft.socials,
        [field]: value,
      },
    }), ["contacts"]);
  }

  function handlePrivacyChange(field, value) {
    updateDraft((currentDraft) => ({
      ...currentDraft,
      privacy: {
        ...currentDraft.privacy,
        [field]: value,
      },
    }), ["privacy"]);
  }

  function handleResetPrivacyGroup(group) {
    const resets = {
      visibility: {
        profileVisibility: "employers-and-contacts",
        projectsVisibility: "contacts",
        activityVisibility: "everyone",
      },
      audience: {
        profileAudience: "contacts",
        contactsAudience: "employers-and-contacts",
        messagesAudience: "everyone",
      },
      notifications: {
        responseStatus: true,
        recommendationAlerts: true,
        contactInvites: true,
        newOpportunities: false,
      },
    };

    updateDraft((currentDraft) => ({
      ...currentDraft,
      privacy: {
        ...currentDraft.privacy,
        ...resets[group],
      },
    }), ["privacy"]);
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
    const educationValidation = getCandidateEducationDraftErrors(state.draft.educations, { requireAtLeastOne: false });

    if (!normalizeString(state.draft.name)) {
      nextErrors.name = "Укажите имя.";
    }

    if (!normalizeString(state.draft.surname)) {
      nextErrors.surname = "Укажите фамилию.";
    }

    if (Object.keys(educationValidation.itemErrors).length) {
      nextErrors.educationItems = educationValidation.itemErrors;
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    setSaveState((current) => ({
      ...current,
      profile: { status: "saving", error: "" },
    }));

    try {
      const links = buildLinksPayload(state.profile, state.draft);
      const profile = await updateCandidateProfile({
        name: normalizeString(state.draft.name),
        surname: normalizeString(state.draft.surname),
        thirdname: normalizeString(state.draft.thirdname) || null,
        description: normalizeString(state.draft.description) || null,
        skills: state.draft.skills,
        links,
      });

      let educationItems = state.education;

      if (hasEducationData(state.draft) || state.education.length) {
        const activeEducationItems = getActiveCandidateEducationDrafts(state.draft.educations);
        const persistedIds = new Set(
          activeEducationItems
            .map((item) => item.id)
            .filter(Boolean)
        );

        for (const item of activeEducationItems) {
          const payload = buildEducationPayload(item);

          if (item.id) {
            await updateCandidateEducation(item.id, payload);
          } else {
            await createCandidateEducation(payload);
          }
        }

        for (const item of state.education) {
          if (item?.id && !persistedIds.has(item.id) && !activeEducationItems.some((draftItem) => draftItem.id === item.id)) {
            await deleteCandidateEducation(item.id);
          }
        }

        const refreshedEducation = await getCandidateEducation();
        educationItems = Array.isArray(refreshedEducation) ? refreshedEducation : educationItems;
      }

      setFormErrors({});
      setState({
        status: "ready",
        profile,
        education: educationItems,
        draft: createDraft(profile, educationItems),
        error: null,
      });
      setAvatarState({ status: "idle", error: "" });
      onSummaryChange?.({ profile, education: educationItems });
      setSaveState((current) => ({
        ...current,
        profile: { status: "success", error: "" },
      }));
    } catch (error) {
      setSaveState((current) => ({
        ...current,
        profile: {
          status: "error",
          error: error?.message ?? "Попробуйте повторить сохранение позже.",
        },
      }));
    }
  }

  async function handleContactsSave(event) {
    event.preventDefault();

    setSaveState((current) => ({
      ...current,
      contacts: { status: "saving", error: "" },
    }));

    try {
      const profile = await updateCandidateProfile({
        links: buildLinksPayload(state.profile, state.draft),
      });

      setState((current) => ({
        ...current,
        profile,
        draft: createDraft(profile, current.education),
      }));
      onSummaryChange?.({ profile });
      setSaveState((current) => ({
        ...current,
        contacts: { status: "success", error: "" },
      }));
    } catch (error) {
      setSaveState((current) => ({
        ...current,
        contacts: {
          status: "error",
          error: error?.message ?? "Не удалось обновить контактные данные.",
        },
      }));
    }
  }

  async function handlePrivacySave(event) {
    event.preventDefault();

    setSaveState((current) => ({
      ...current,
      privacy: { status: "saving", error: "" },
    }));

    try {
      const profile = await updateCandidateProfile({
        links: buildLinksPayload(state.profile, state.draft),
      });

      setState((current) => ({
        ...current,
        profile,
        draft: createDraft(profile, current.education),
      }));
      onSummaryChange?.({ profile });
      setSaveState((current) => ({
        ...current,
        privacy: { status: "success", error: "" },
      }));
    } catch (error) {
      setSaveState((current) => ({
        ...current,
        privacy: {
          status: "error",
          error: error?.message ?? "Не удалось сохранить настройки приватности.",
        },
      }));
    }
  }

  return (
    <section className="candidate-page-section">
      <CandidateSectionHeader
        eyebrow="Настройки"
        title="Настройки профиля"
        description="Собери свой портфолио и резюме для точных рекомендаций."
      />

      {state.status === "loading" ? <Loader label="Загружаем настройки профиля" surface /> : null}

      {state.status === "unauthorized" ? (
        <Card>
          <EmptyState
            eyebrow="Доступ ограничен"
            title="Нужно войти как кандидат"
            description="Настройки профиля доступны только после авторизации кандидата."
            tone="warning"
          />
        </Card>
      ) : null}

      {state.status === "error" ? (
        <Alert tone="error" title="Не удалось загрузить настройки" showIcon>
          {state.error?.message ?? "Попробуйте обновить страницу позже."}
        </Alert>
      ) : null}

      {state.status === "ready" ? (
        <div className="candidate-page-stack">
          {CANDIDATE_SETTINGS_SECTIONS.map((section) => (
            <SettingsSectionCard
              key={section.id}
              id={section.id}
              eyebrow={section.eyebrow}
              title={section.title}
              summary={section.summary}
              status={section.status}
              statusTone={section.statusTone}
              actionLabel={section.actionLabel}
              isOpen={openSection === section.id}
              onToggle={() => handleToggle(section.id)}
            >
              {section.id === "settings-profile" ? (
                <CandidateProfileSettingsForm
                  draft={state.draft}
                  errors={formErrors}
                  saveState={saveState.profile}
                  avatarInputRef={avatarInputRef}
                  avatarError={avatarState.error}
                  isPreparingAvatar={avatarState.status === "loading"}
                  onChange={handleRootChange}
                  onAvatarUpload={handleAvatarUpload}
                  onAvatarClear={handleAvatarClear}
                  onEducationChange={handleEducationChange}
                  onEducationAdd={handleEducationAdd}
                  onEducationRemove={handleEducationRemove}
                  onSave={handleProfileSave}
                />
              ) : null}

              {section.id === "settings-contacts" ? (
                <CandidateContactsSettingsForm
                  draft={{
                    phone: state.draft.phone,
                    email: state.profile?.email ?? "",
                    socials: state.draft.socials,
                  }}
                  saveState={saveState.contacts}
                  onChange={handleRootChange}
                  onSocialChange={handleSocialChange}
                  onSave={handleContactsSave}
                />
              ) : null}

              {section.id === "settings-security" ? (
                <CandidateSecuritySettings
                  email={state.profile?.email ?? ""}
                  phone={state.draft.phone}
                  lastLogins={state.draft.lastLogins}
                />
              ) : null}

              {section.id === "settings-privacy" ? (
                <CandidatePrivacySettingsForm
                  draft={state.draft}
                  saveState={saveState.privacy}
                  onChange={handlePrivacyChange}
                  onResetGroup={handleResetPrivacyGroup}
                  onSave={handlePrivacySave}
                />
              ) : null}
            </SettingsSectionCard>
          ))}
        </div>
      ) : null}
    </section>
  );
}
