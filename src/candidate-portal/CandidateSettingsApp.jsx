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
import { searchYandexCityOptions } from "../api/cities";
import {
  createCandidateEducationDraft,
  createEducationDraftListAfterRemove,
  getActiveCandidateEducationDrafts,
  getCandidateEducationDraftErrors,
} from "./education";
import { CandidateExperienceListEditor, CandidateProfessionSelector } from "./onboarding-widgets";
import { ApiError } from "../lib/http";
import {
  Alert,
  Button,
  Card,
  CityAutocomplete,
  EducationListEditor,
  EmptyState,
  FormField,
  Input,
  Loader,
  Select,
  SettingsSectionCard,
  Switch,
  TagSelector,
  Textarea,
} from "../shared/ui";
import { CandidateSectionHeader } from "./shared";
import { CANDIDATE_SKILL_SUGGESTIONS } from "./config";
import {
  buildCandidateOnboardingLinks,
  CANDIDATE_CITIZENSHIP_OPTIONS,
  CANDIDATE_GENDER_OPTIONS,
  createCandidateOnboardingDraft,
  createCandidateExperienceDraft,
  createExperienceDraftListAfterRemove,
  getCandidateProfileLinks,
} from "./onboarding";
import { getCandidateAvatarUrl } from "./mappers";

const CITIZENSHIP_OPTIONS = CANDIDATE_CITIZENSHIP_OPTIONS.map((value) => ({ value, label: value }));
const PROFILE_AVATAR_MAX_SIZE_BYTES = 3 * 1024 * 1024;
const PROFILE_AVATAR_ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml";

const SETTINGS_SECTIONS = [
  {
    id: "settings-profile",
    eyebrow: "Профиль",
    title: "Основные данные",
    summary: "Личная информация, профессии, город, навыки, образование и опыт работы.",
  },
  {
    id: "settings-contacts",
    eyebrow: "Контакты",
    title: "Контактные данные",
    summary: "Телефон и публичные ссылки, по которым с вами могут связаться.",
  },
  {
    id: "settings-security",
    eyebrow: "Безопасность",
    title: "Почта и пароль",
    summary: "Просмотр привязанных данных аккаунта и быстрый переход к смене пароля.",
  },
  {
    id: "settings-privacy",
    eyebrow: "Приватность",
    title: "Настройки видимости",
    summary: "Кто видит профиль, контакты и получает уведомления внутри платформы.",
  },
];

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
  const social = isRecord(preferences.social) ? preferences.social : {};
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
      peerVisibilityDefault: Boolean(social.peerVisibilityDefault),
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
  return SETTINGS_SECTIONS.some((item) => item.id === section) ? section : SETTINGS_SECTIONS[0].id;
}

function getProfileInitials(draft) {
  return [draft.name, draft.surname]
    .map((part) => normalizeString(part))
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "ПК";
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
      social: {
        peerVisibilityDefault: Boolean(draft.privacy.peerVisibilityDefault),
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

function CandidateSettingsSaveButton({ disabled, label = "Сохранить" }) {
  return (
    <div className="candidate-settings-detail__save">
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
  onExperienceChange,
  onExperienceAdd,
  onExperienceRemove,
  onSave,
}) {
  return (
    <form className="candidate-settings-detail" onSubmit={onSave} noValidate>
      <SectionSaveAlert
        saveState={saveState}
        successTitle="Профиль обновлён"
        successText="Личные данные, образование, навыки и опыт работы сохранены."
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
          </div>

          <div className="candidate-settings-detail__grid">
            <FormField label="Фамилия" required error={errors.surname}>
              <Input value={draft.surname} onValueChange={(value) => onChange("surname", value)} placeholder="Иванова" />
            </FormField>
            <FormField label="Отчество">
              <Input value={draft.thirdname} onValueChange={(value) => onChange("thirdname", value)} placeholder="Сергеевна" />
            </FormField>
            <FormField label="Пол">
              <Select value={draft.gender} onValueChange={(value) => onChange("gender", value)} placeholder="Выберите пол" options={CANDIDATE_GENDER_OPTIONS} />
            </FormField>
            <FormField label="Телефон">
              <Input value={draft.phone} onValueChange={(value) => onChange("phone", value)} placeholder="+7 999 000 00 00" />
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
              <CityAutocomplete
                value={draft.city}
                onValueChange={(value) => onChange("city", value)}
                searchOptions={searchYandexCityOptions}
                placeholder="Выбранный город"
                searchPlaceholder="Начните вводить город"
                loadingLabel="Ищем города через Яндекс…"
                errorLabel="Подсказки Яндекса временно недоступны. Можно ввести город вручную."
              />
            </FormField>
            <FormField label="Гражданство">
              <Select value={draft.citizenship} onValueChange={(value) => onChange("citizenship", value)} placeholder="Выберите гражданство" options={CITIZENSHIP_OPTIONS} />
            </FormField>
          </div>
        </div>

        <CandidateProfessionSelector
          profession={draft.profession}
          additionalProfessions={draft.additionalProfessions}
          onProfessionChange={(value) => onChange("profession", value)}
          onAdditionalProfessionsChange={(value) => onChange("additionalProfessions", value)}
          title="Профессии"
          description="Выберите одну основную профессию и при необходимости добавьте несколько смежных направлений."
          className="candidate-settings-detail__selector"
        />

        <FormField label="О себе">
          <Textarea value={draft.description} onValueChange={(value) => onChange("description", value)} autoResize rows={5} placeholder="Кратко расскажите о себе, сильных сторонах и направлении развития." />
        </FormField>

        <FormField label="Карьерная цель">
          <Textarea value={draft.goal} onValueChange={(value) => onChange("goal", value)} autoResize rows={3} placeholder="Например: найти первую стажировку в продуктовой команде и собрать сильное портфолио." />
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
        <EducationListEditor items={draft.educations} errorsByKey={errors.educationItems ?? {}} onItemChange={onEducationChange} onAddItem={onEducationAdd} onRemoveItem={onEducationRemove} />
      </section>

      <section className="candidate-settings-detail__section">
        <CandidateExperienceListEditor experiences={draft.experiences} noExperience={draft.noExperience} onNoExperienceChange={(value) => onChange("noExperience", value)} onExperienceChange={onExperienceChange} onExperienceAdd={onExperienceAdd} onExperienceRemove={onExperienceRemove} />
      </section>

      <CandidateSettingsSaveButton disabled={saveState.status === "saving" || isPreparingAvatar} label={saveState.status === "saving" ? "Сохраняем..." : "Сохранить"} />
    </form>
  );
}

function CandidateContactsSettingsForm({ draft, saveState, onChange, onSocialChange, onSave }) {
  return (
    <form className="candidate-settings-detail" onSubmit={onSave} noValidate>
      <SectionSaveAlert saveState={saveState} successTitle="Контакты обновлены" successText="Телефон и публичные ссылки сохранены в профиле." />

      <section className="candidate-settings-detail__section">
        <h4 className="candidate-settings-detail__section-title">Контактные данные</h4>

        <div className="candidate-settings-detail__grid candidate-settings-detail__grid--two">
          <FormField label="Телефон">
            <Input value={draft.phone} onValueChange={(value) => onChange("phone", value)} placeholder="+7 999 000 00 00" />
          </FormField>
          <FormField label="Почта" hint="Email привязан к аккаунту и меняется отдельно.">
            <Input value={draft.email} readOnly copyable />
          </FormField>
        </div>
      </section>

      <section className="candidate-settings-detail__section">
        <div className="candidate-settings-detail__subtitle">Публичные профили</div>

        <div className="candidate-settings-detail__grid candidate-settings-detail__grid--two">
          <FormField label="ВКонтакте">
            <Input value={draft.socials.vk} onValueChange={(value) => onSocialChange("vk", value)} placeholder="username" addonStart={<span className="candidate-settings-contact-prefix">vk.com/</span>} />
          </FormField>
          <FormField label="Telegram">
            <Input value={draft.socials.telegram} onValueChange={(value) => onSocialChange("telegram", value.replace(/^@/, ""))} placeholder="username" addonStart={<span className="candidate-settings-contact-prefix">t.me/</span>} />
          </FormField>
        </div>

        <div className="candidate-settings-detail__grid candidate-settings-detail__grid--two">
          <FormField label="Behance">
            <Input value={draft.socials.behance} onValueChange={(value) => onSocialChange("behance", value)} placeholder="username" addonStart={<span className="candidate-settings-contact-prefix">behance.net/</span>} />
          </FormField>
          <FormField label="Портфолио">
            <Input value={draft.socials.portfolio} onValueChange={(value) => onSocialChange("portfolio", value)} placeholder="https://portfolio.example" />
          </FormField>
        </div>
      </section>

      <CandidateSettingsSaveButton disabled={saveState.status === "saving"} label={saveState.status === "saving" ? "Сохраняем..." : "Сохранить"} />
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
      </section>

      <section className="candidate-settings-security-card">
        <div className="candidate-settings-security-card__head">
          <div>
            <h4>Смена пароля</h4>
            <p>Откроется отдельная защищённая форма восстановления пароля.</p>
          </div>
          <Button href={buildForgotPasswordRoute({ email })} variant="secondary" iconEnd={<ArrowRightIcon />}>
            Перейти
          </Button>
        </div>
      </section>

      <section className="candidate-settings-security-card">
        <div className="candidate-settings-security-card__head">
          <div>
            <h4>Последние входы</h4>
            <p>Список последних устройств, с которых вы заходили в аккаунт.</p>
          </div>
        </div>

        {lastLogins.length ? (
          <div className="candidate-settings-security-list">
            {lastLogins.map((item, index) => (
              <Card key={`${item.title}-${item.meta}-${index}`} className="candidate-settings-security-list__item">
                <div>
                  <strong>{item.title}</strong>
                  {item.meta ? <p>{item.meta}</p> : null}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="candidate-settings-security-list__item">
            <p>История входов пока недоступна.</p>
          </Card>
        )}
      </section>
    </div>
  );
}

function CandidatePrivacySettingsForm({ draft, saveState, onChange, onResetGroup, onSave }) {
  return (
    <form className="candidate-settings-detail candidate-settings-detail--privacy" onSubmit={onSave} noValidate>
      <SectionSaveAlert saveState={saveState} successTitle="Настройки приватности сохранены" successText="Новые правила видимости и уведомлений уже применяются." />

      <section className="candidate-settings-detail__section">
        <div className="candidate-settings-detail__head-inline">
          <div>
            <h4 className="candidate-settings-detail__section-title">Видимость профиля</h4>
            <p className="candidate-settings-detail__section-text">Управляйте тем, кто видит профиль, проекты и активность.</p>
          </div>
          <Button type="button" variant="ghost" onClick={() => onResetGroup("visibility")}>Сбросить</Button>
        </div>

        <div className="candidate-settings-detail__grid candidate-settings-detail__grid--three">
          <FormField label="Профиль"><Select value={draft.privacy.profileVisibility} onValueChange={(value) => onChange("profileVisibility", value)} options={VISIBILITY_OPTIONS} /></FormField>
          <FormField label="Проекты"><Select value={draft.privacy.projectsVisibility} onValueChange={(value) => onChange("projectsVisibility", value)} options={VISIBILITY_OPTIONS} /></FormField>
          <FormField label="Активность"><Select value={draft.privacy.activityVisibility} onValueChange={(value) => onChange("activityVisibility", value)} options={VISIBILITY_OPTIONS} /></FormField>
        </div>
      </section>

      <section className="candidate-settings-detail__section">
        <div className="candidate-settings-detail__head-inline">
          <div>
            <h4 className="candidate-settings-detail__section-title">Кому доступно взаимодействие</h4>
            <p className="candidate-settings-detail__section-text">Определите, кто может видеть контакты и писать вам внутри платформы.</p>
          </div>
          <Button type="button" variant="ghost" onClick={() => onResetGroup("audience")}>Сбросить</Button>
        </div>

        <div className="candidate-settings-detail__grid candidate-settings-detail__grid--three">
          <FormField label="Профиль"><Select value={draft.privacy.profileAudience} onValueChange={(value) => onChange("profileAudience", value)} options={AUDIENCE_OPTIONS} /></FormField>
          <FormField label="Контакты"><Select value={draft.privacy.contactsAudience} onValueChange={(value) => onChange("contactsAudience", value)} options={AUDIENCE_OPTIONS} /></FormField>
          <FormField label="Сообщения"><Select value={draft.privacy.messagesAudience} onValueChange={(value) => onChange("messagesAudience", value)} options={AUDIENCE_OPTIONS} /></FormField>
        </div>
      </section>

        <section className="candidate-settings-detail__section">
          <div className="candidate-settings-detail__head-inline">
            <div>
              <h4 className="candidate-settings-detail__section-title">Уведомления</h4>
              <p className="candidate-settings-detail__section-text">Выберите, какие оповещения хотите получать.</p>
          </div>
          <Button type="button" variant="ghost" onClick={() => onResetGroup("notifications")}>Сбросить</Button>
        </div>

        <div className="candidate-settings-detail__stack">
          <Card className="candidate-project-editor-switch-card"><Switch className="candidate-project-editor-switch" checked={draft.privacy.responseStatus} onChange={(event) => onChange("responseStatus", event.target.checked)}><><span className="ui-check__label">Статусы откликов</span><span className="ui-check__hint">Сообщать о переходе откликов между этапами.</span></></Switch></Card>
          <Card className="candidate-project-editor-switch-card"><Switch className="candidate-project-editor-switch" checked={draft.privacy.recommendationAlerts} onChange={(event) => onChange("recommendationAlerts", event.target.checked)}><><span className="ui-check__label">Карьерные рекомендации</span><span className="ui-check__hint">Присылать новые подборки возможностей и советы.</span></></Switch></Card>
          <Card className="candidate-project-editor-switch-card"><Switch className="candidate-project-editor-switch" checked={draft.privacy.contactInvites} onChange={(event) => onChange("contactInvites", event.target.checked)}><><span className="ui-check__label">Контакты и приглашения</span><span className="ui-check__hint">Сообщать о новых контактах и приглашениях в проекты.</span></></Switch></Card>
          <Card className="candidate-project-editor-switch-card"><Switch className="candidate-project-editor-switch" checked={draft.privacy.newOpportunities} onChange={(event) => onChange("newOpportunities", event.target.checked)}><><span className="ui-check__label">Новые возможности</span><span className="ui-check__hint">Отправлять уведомления о новых стажировках и вакансиях.</span></></Switch></Card>
          </div>
        </section>

        <section className="candidate-settings-detail__section">
          <div className="candidate-settings-detail__head-inline">
            <div>
              <h4 className="candidate-settings-detail__section-title">Peers по возможностям</h4>
              <p className="candidate-settings-detail__section-text">Управляйте значением по умолчанию для показа вас в списке других откликнувшихся.</p>
            </div>
            <Button type="button" variant="ghost" onClick={() => onChange("peerVisibilityDefault", false)}>Сбросить</Button>
          </div>

          <div className="candidate-settings-detail__stack">
            <Card className="candidate-project-editor-switch-card">
              <Switch className="candidate-project-editor-switch" checked={draft.privacy.peerVisibilityDefault} onChange={(event) => onChange("peerVisibilityDefault", event.target.checked)}>
                <>
                  <span className="ui-check__label">Показывать меня среди других откликнувшихся</span>
                  <span className="ui-check__hint">Новые отклики по умолчанию будут создаваться с разрешением на peer visibility.</span>
                </>
              </Switch>
            </Card>
          </div>
        </section>

        <CandidateSettingsSaveButton disabled={saveState.status === "saving"} label={saveState.status === "saving" ? "Сохраняем..." : "Сохранить"} />
      </form>
    );
  }

async function syncCandidateEducation(currentEducation, draftEducations) {
  const activeEducationItems = getActiveCandidateEducationDrafts(draftEducations);
  const persistedIds = new Set(activeEducationItems.map((item) => item.id).filter(Boolean));

  for (const item of activeEducationItems) {
    const payload = buildEducationPayload(item);

    if (item.id) {
      await updateCandidateEducation(item.id, payload);
    } else {
      await createCandidateEducation(payload);
    }
  }

  for (const item of currentEducation) {
    if (item?.id && !persistedIds.has(item.id)) {
      await deleteCandidateEducation(item.id);
    }
  }

  const refreshedEducation = await getCandidateEducation();
  return Array.isArray(refreshedEducation) ? refreshedEducation : currentEducation;
}

export function CandidateSettingsApp({ onSummaryChange }) {
  const avatarInputRef = useRef(null);
  const sectionSyncReadyRef = useRef(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [openSection, setOpenSection] = useState(getOpenSection(searchParams));
  const [state, setState] = useState({
    status: "loading",
    profile: null,
    education: [],
    draft: null,
    error: null,
  });
  const [saveState, setSaveState] = useState(createSaveStates);
  const [formErrors, setFormErrors] = useState({});
  const [avatarState, setAvatarState] = useState({ status: "idle", error: "" });

  useEffect(() => {
    if (!sectionSyncReadyRef.current) {
      sectionSyncReadyRef.current = true;
      return;
    }

    const section = searchParams.get("section");

    if (SETTINGS_SECTIONS.some((item) => item.id === section)) {
      setOpenSection(section);
      return;
    }

    if (section === null) {
      setOpenSection("");
    }
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const [profile, education] = await Promise.all([
          getCandidateProfile(controller.signal),
          getCandidateEducation(controller.signal),
        ]);

        if (controller.signal.aborted) {
          return;
        }

        const educationItems = Array.isArray(education) ? education : [];

        setState({
          status: "ready",
          profile,
          education: educationItems,
          draft: createDraft(profile, educationItems),
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
          draft: null,
          error,
        });
      }
    }

    load();
    return () => controller.abort();
  }, []);

  function updateDraft(updater, saveGroups = ["profile", "contacts", "privacy"]) {
    setState((current) => ({
      ...current,
      draft: typeof updater === "function" ? updater(current.draft) : updater,
    }));

    setSaveState((current) => {
      const next = { ...current };
      saveGroups.forEach((group) => {
        next[group] = createIdleSaveState();
      });
      return next;
    });
  }

  function handleRootChange(field, value) {
    updateDraft((currentDraft) => ({ ...currentDraft, [field]: value }));

    if (field === "name" || field === "surname") {
      setFormErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    }
  }

  async function handleAvatarUpload(event) {
    const [file] = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!file) {
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
      educations: currentDraft.educations.map((item) => item.draftKey === draftKey ? { ...item, [field]: value } : item),
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
  }

  function handleExperienceChange(draftKey, field, value) {
    updateDraft((currentDraft) => ({
      ...currentDraft,
      experiences: currentDraft.experiences.map((item) => {
        if (item.draftKey !== draftKey) {
          return item;
        }

        if (field === "isCurrent") {
          return { ...item, isCurrent: Boolean(value), endMonth: value ? "" : item.endMonth };
        }

        return { ...item, [field]: value };
      }),
    }), ["profile"]);
  }

  function handleExperienceAdd() {
    updateDraft((currentDraft) => ({
      ...currentDraft,
      experiences: [...currentDraft.experiences, createCandidateExperienceDraft()],
    }), ["profile"]);
  }

  function handleExperienceRemove(draftKey) {
    updateDraft((currentDraft) => ({
      ...currentDraft,
      experiences: createExperienceDraftListAfterRemove(currentDraft.experiences, draftKey),
    }), ["profile"]);
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
    setOpenSection(nextSection);

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
      const educationItems = await syncCandidateEducation(state.education, state.draft.educations);
      const refreshedProfile = await getCandidateProfile();
      const nextProfile = refreshedProfile ?? profile;

      setFormErrors({});
      setState({
        status: "ready",
        profile: nextProfile,
        education: educationItems,
        draft: createDraft(nextProfile, educationItems),
        error: null,
      });
      setAvatarState({ status: "idle", error: "" });
      onSummaryChange?.({ profile: nextProfile, education: educationItems });
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
      const refreshedProfile = await getCandidateProfile();
      const nextProfile = refreshedProfile ?? profile;

      setState((current) => ({
        ...current,
        profile: nextProfile,
        draft: createDraft(nextProfile, current.education),
      }));
      onSummaryChange?.({ profile: nextProfile });
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
      const refreshedProfile = await getCandidateProfile();
      const nextProfile = refreshedProfile ?? profile;

      setState((current) => ({
        ...current,
        profile: nextProfile,
        draft: createDraft(nextProfile, current.education),
      }));
      onSummaryChange?.({ profile: nextProfile });
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
        description="Заполните профиль кандидата и настройте видимость данных внутри платформы."
      />

      {state.status === "loading" ? <Loader label="Загружаем настройки профиля" surface /> : null}

      {state.status === "unauthorized" ? (
        <Card>
          <EmptyState eyebrow="Доступ ограничен" title="Нужно войти как кандидат" description="Настройки профиля доступны только после авторизации кандидата." tone="warning" />
        </Card>
      ) : null}

      {state.status === "error" ? (
        <Alert tone="error" title="Не удалось загрузить настройки" showIcon>
          {state.error?.message ?? "Попробуйте обновить страницу позже."}
        </Alert>
      ) : null}

      {state.status === "ready" ? (
        <div className="candidate-page-stack">
          {SETTINGS_SECTIONS.map((section) => (
            <SettingsSectionCard key={section.id} id={section.id} eyebrow={section.eyebrow} title={section.title} summary={section.summary} isOpen={openSection === section.id} onToggle={() => handleToggle(section.id)}>
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
                  onExperienceChange={handleExperienceChange}
                  onExperienceAdd={handleExperienceAdd}
                  onExperienceRemove={handleExperienceRemove}
                  onSave={handleProfileSave}
                />
              ) : null}

              {section.id === "settings-contacts" ? (
                <CandidateContactsSettingsForm draft={{ phone: state.draft.phone, email: state.profile?.email ?? "", socials: state.draft.socials }} saveState={saveState.contacts} onChange={handleRootChange} onSocialChange={handleSocialChange} onSave={handleContactsSave} />
              ) : null}

              {section.id === "settings-security" ? (
                <CandidateSecuritySettings email={state.profile?.email ?? ""} phone={state.draft.phone} lastLogins={state.draft.lastLogins} />
              ) : null}

              {section.id === "settings-privacy" ? (
                <CandidatePrivacySettingsForm draft={state.draft} saveState={saveState.privacy} onChange={handlePrivacyChange} onResetGroup={handleResetPrivacyGroup} onSave={handlePrivacySave} />
              ) : null}
            </SettingsSectionCard>
          ))}
        </div>
      ) : null}
    </section>
  );
}
