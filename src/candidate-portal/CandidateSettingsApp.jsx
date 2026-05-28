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
import { uploadImage } from "../api/uploads";
import { getTags } from "../api/tags";
import { refreshAuthSession } from "../auth/api";
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
  ArrowIcon,
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
const PROFILE_AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const PROFILE_AVATAR_ACCEPT = "image/png,image/jpeg,image/webp";

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
  {
    id: "settings-mentor",
    eyebrow: "Менторство",
    title: "Кабинет ментора",
    summary: "Настройка статуса ментора, направлений консультаций и свободного времени.",
  },
].filter(section => section.id !== "settings-mentor");

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

const CHAT_AUDIENCE_OPTIONS = [
  { value: "everyone", label: "Все пользователи" },
  { value: "contacts", label: "Только контакты" },
  { value: "friends", label: "Только друзья" },
  { value: "nobody", label: "Никому" },
];

const MOCK_DB_KEY = "tramplin_mentor_mock_db";

function getMentorLocalData(mentorUserId) {
  try {
    const db = JSON.parse(localStorage.getItem(MOCK_DB_KEY) || "{}");
    return db[mentorUserId] || { slots: [], bookings: [], applications: [] };
  } catch {
    return { slots: [], bookings: [], applications: [] };
  }
}

function saveMentorLocalData(mentorUserId, data) {
  try {
    const db = JSON.parse(localStorage.getItem(MOCK_DB_KEY) || "{}");
    db[mentorUserId] = data;
    localStorage.setItem(MOCK_DB_KEY, JSON.stringify(db));
  } catch {}
}

function createIdleSaveState() {
  return { status: "idle", error: "" };
}

function createSaveStates() {
  return {
    profile: createIdleSaveState(),
    contacts: createIdleSaveState(),
    privacy: createIdleSaveState(),
    mentor: createIdleSaveState(),
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
  const mentor = isRecord(links.mentor) ? links.mentor : {};

  return {
    ...onboardingDraft,
    userId: profile?.userId,
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
    mentor: {
      isMentor: Boolean(mentor.isMentor),
      companyType: normalizeString(mentor.companyType) || "freelance",
      mentorCompanyId: mentor.mentorCompanyId ? Number(mentor.mentorCompanyId) : null,
      mentorCompanyName: normalizeString(mentor.mentorCompanyName),
      mentorCustomCompany: normalizeString(mentor.mentorCustomCompany) || "Частная практика",
      mentorBio: normalizeString(mentor.mentorBio) || "",
      mentorTopics: Array.isArray(mentor.mentorTopics) ? mentor.mentorTopics : [],
      mentorSlots: Array.isArray(mentor.mentorSlots) ? mentor.mentorSlots : [],
      mentorBookings: Array.isArray(mentor.mentorBookings) ? mentor.mentorBookings : [],
      mentorApplications: Array.isArray(mentor.mentorApplications) ? mentor.mentorApplications : [],
      companyRequests: Array.isArray(mentor.companyRequests) ? mentor.companyRequests : [],
    },
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
    mentor: {
      isMentor: Boolean(draft.mentor?.isMentor),
      companyType: draft.mentor?.companyType || "freelance",
      mentorCompanyId: draft.mentor?.mentorCompanyId || null,
      mentorCompanyName: draft.mentor?.mentorCompanyName || "",
      mentorCustomCompany: draft.mentor?.mentorCustomCompany || "Частная практика",
      mentorBio: draft.mentor?.mentorBio || "",
      mentorTopics: draft.mentor?.mentorTopics || [],
      mentorSlots: draft.mentor?.mentorSlots || [],
      mentorBookings: draft.mentor?.mentorBookings || [],
      mentorApplications: draft.mentor?.mentorApplications || [],
      companyRequests: draft.mentor?.companyRequests || [],
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
              Поддерживаются PNG, JPG и WEBP. Максимальный размер: {formatFileSize(PROFILE_AVATAR_MAX_SIZE_BYTES)}.
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
          loadSuggestions={async (query) => {
            try {
              const res = await getTags({ query, limit: 30 });
              return (res?.Items || res?.items || []).map((t) => t.Name || t.name);
            } catch (err) {
              console.error(err);
              return [];
            }
          }}
          allowCustomTags={false}
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
            <Input value={draft.socials.vk} onValueChange={(value) => onSocialChange("vk", value)} placeholder="username" addonStart={<span className="candidate-settings-contact-prefix">vk.com/</span>} shellClassName="candidate-settings-contact-shell candidate-settings-contact-shell--vk" />
          </FormField>
          <FormField label="Telegram">
            <Input value={draft.socials.telegram} onValueChange={(value) => onSocialChange("telegram", value.replace(/^@/, ""))} placeholder="username" addonStart={<span className="candidate-settings-contact-prefix">t.me/</span>} shellClassName="candidate-settings-contact-shell candidate-settings-contact-shell--telegram" />
          </FormField>
        </div>

        <div className="candidate-settings-detail__grid candidate-settings-detail__grid--two">
          <FormField label="Behance">
            <Input value={draft.socials.behance} onValueChange={(value) => onSocialChange("behance", value)} placeholder="username" addonStart={<span className="candidate-settings-contact-prefix">behance.net/</span>} shellClassName="candidate-settings-contact-shell candidate-settings-contact-shell--behance" />
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
          <Button href={buildForgotPasswordRoute({ email })} variant="secondary" iconEnd={<ArrowIcon />}>
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
          <FormField label="Сообщения"><Select value={draft.privacy.messagesAudience} onValueChange={(value) => onChange("messagesAudience", value)} options={CHAT_AUDIENCE_OPTIONS} /></FormField>
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
              <h4 className="candidate-settings-detail__section-title">Видимость среди откликнувшихся</h4>
              <p className="candidate-settings-detail__section-text">Управляйте значением по умолчанию для показа вас в списке других откликнувшихся.</p>
            </div>
            <Button type="button" variant="ghost" onClick={() => onChange("peerVisibilityDefault", false)}>Сбросить</Button>
          </div>

          <div className="candidate-settings-detail__stack">
            <Card className="candidate-project-editor-switch-card">
              <Switch className="candidate-project-editor-switch" checked={draft.privacy.peerVisibilityDefault} onChange={(event) => onChange("peerVisibilityDefault", event.target.checked)}>
                <>
                  <span className="ui-check__label">Показывать меня среди других откликнувшихся</span>
                  <span className="ui-check__hint">Для новых откликов по умолчанию будет включен показ вашего профиля среди других откликнувшихся.</span>
                </>
              </Switch>
            </Card>
          </div>
        </section>

        <CandidateSettingsSaveButton disabled={saveState.status === "saving"} label={saveState.status === "saving" ? "Сохраняем..." : "Сохранить"} />
      </form>
    );
  }

function CandidateMentorSettingsForm({ draft, saveState, onChange, onSave }) {
  const [newSlotDate, setNewSlotDate] = useState("");
  const [newSlotStart, setNewSlotStart] = useState("");
  const [newSlotEnd, setNewSlotEnd] = useState("");

  const MOCK_COMPANIES = [
    { value: "yandex", label: "Яндекс" },
    { value: "sber", label: "Сбер" },
    { value: "tinkoff", label: "Тинькофф" },
    { value: "vk", label: "VK" },
    { value: "white_tiger", label: "White Tiger Soft" },
    { value: "leonards", label: "Leonards space" },
  ];

  const TOPIC_OPTIONS = [
    { value: "career-plan", label: "Построить карьерный план" },
    { value: "resume", label: "Создать резюме" },
    { value: "strategy", label: "Проработать стратегию развития" },
    { value: "interview", label: "Подготовиться к собеседованию" },
    { value: "burnout", label: "Справиться с выгоранием" },
  ];

  const handleTopicToggle = (topicValue) => {
    const currentTopics = draft.mentor.mentorTopics || [];
    const nextTopics = currentTopics.includes(topicValue)
      ? currentTopics.filter((t) => t !== topicValue)
      : [...currentTopics, topicValue];
    onChange("mentorTopics", nextTopics);
  };

  const handleAddSlot = () => {
    if (!newSlotDate || !newSlotStart || !newSlotEnd) return;
    const newSlot = {
      id: `slot-${Date.now()}`,
      date: newSlotDate,
      startTime: newSlotStart,
      endTime: newSlotEnd,
      status: "free",
    };
    const currentSlots = draft.mentor.mentorSlots || [];
    onChange("mentorSlots", [...currentSlots, newSlot]);
    setNewSlotDate("");
    setNewSlotStart("");
    setNewSlotEnd("");
  };

  const handleRemoveSlot = (slotId) => {
    const currentSlots = draft.mentor.mentorSlots || [];
    onChange("mentorSlots", currentSlots.filter((s) => s.id !== slotId));
  };

  const handleBookingDecision = (bookingId, decision) => {
    const currentBookings = draft.mentor.mentorBookings || [];
    const nextBookings = currentBookings.map((b) => {
      if (b.id === bookingId) {
        return { ...b, status: decision };
      }
      return b;
    });
    onChange("mentorBookings", nextBookings);

    const booking = currentBookings.find((b) => b.id === bookingId);
    if (booking && booking.slotId) {
      const currentSlots = draft.mentor.mentorSlots || [];
      const nextSlots = currentSlots.map((s) => {
        if (s.id === booking.slotId) {
          return { ...s, status: decision === "approved" ? "booked" : "free" };
        }
        return s;
      });
      onChange("mentorSlots", nextSlots);
    }
  };

  const handleAppDecision = (appId, decision) => {
    const currentApps = draft.mentor.mentorApplications || [];
    const nextApps = currentApps.map((a) => {
      if (a.id === appId) {
        return { ...a, status: decision };
      }
      return a;
    });
    onChange("mentorApplications", nextApps);
  };

  const handleCompanyRequestDecision = (requestId, decision) => {
    const currentRequests = draft.mentor.companyRequests || [];
    const updatedRequests = currentRequests.map((r) => {
      if (r.id === requestId) {
        return { ...r, status: decision };
      }
      return r;
    });

    onChange("companyRequests", updatedRequests);

    const req = currentRequests.find((r) => r.id === requestId);
    if (req) {
      if (decision === "approved") {
        onChange("companyType", "company");
        onChange("mentorCompanyId", req.companyId);
        onChange("mentorCompanyName", req.companyName);
      } else if (decision === "declined") {
        if (draft.mentor.mentorCompanyId === req.companyId) {
          onChange("mentorCompanyId", null);
          onChange("mentorCompanyName", "");
        }
      }
    }

    const mentorUserId = draft.userId;
    if (mentorUserId) {
      const localData = getMentorLocalData(mentorUserId);
      localData.companyRequests = (localData.companyRequests || []).map(r => {
        if (r.id === requestId) {
          return { ...r, status: decision };
        }
        return r;
      });
      saveMentorLocalData(mentorUserId, localData);
    }
  };

  return (
    <form className="candidate-settings-detail" onSubmit={onSave} noValidate>
      <SectionSaveAlert saveState={saveState} successTitle="Настройки ментора сохранены" successText="Ваш кабинет ментора обновлен." />

      <section className="candidate-settings-detail__section">
        <div className="candidate-project-editor-switch-card">
          <Switch
            className="candidate-project-editor-switch"
            checked={Boolean(draft.mentor.isMentor)}
            onChange={(event) => onChange("isMentor", event.target.checked)}
          >
            <>
              <span className="ui-check__label">Активировать режим ментора</span>
              <span className="ui-check__hint">Ваш профиль станет доступен кандидатам в качестве ментора.</span>
            </>
          </Switch>
        </div>
      </section>

      {draft.mentor.isMentor ? (
        <>
          <section className="candidate-settings-detail__section">
            <h4 className="candidate-settings-detail__section-title">Текущая занятость ментора</h4>
            
            <div className="candidate-settings-detail__grid candidate-settings-detail__grid--two" style={{ marginBottom: "16px" }}>
              <FormField label="Тип занятости">
                <Select
                  value={draft.mentor.companyType}
                  onValueChange={(val) => onChange("companyType", val)}
                  options={[
                    { value: "company", label: "Работаю в компании" },
                    { value: "freelance", label: "Частная практика / Фриланс" },
                  ]}
                />
              </FormField>
              
              {draft.mentor.companyType === "company" ? (
                <FormField label="Компания">
                  <Select
                    value={draft.mentor.mentorCompanyName || ""}
                    onValueChange={(val) => {
                      const companyObj = MOCK_COMPANIES.find(c => c.label === val);
                      onChange("mentorCompanyName", val);
                      onChange("mentorCompanyId", companyObj ? companyObj.value : null);
                    }}
                    options={MOCK_COMPANIES}
                    placeholder="Выберите компанию"
                  />
                </FormField>
              ) : (
                <FormField label="Ваш статус / описание занятости">
                  <Input
                    value={draft.mentor.mentorCustomCompany}
                    onValueChange={(val) => onChange("mentorCustomCompany", val)}
                    placeholder="Например, Независимый консультант"
                  />
                </FormField>
              )}
            </div>
            
            <FormField label="Опыт ментора (Био)">
              <Textarea
                value={draft.mentor.mentorBio}
                onValueChange={(val) => onChange("mentorBio", val)}
                rows={4}
                autoResize
                placeholder="Расскажите подробнее о вашей специализации и о том, как вы помогаете кандидатам."
              />
            </FormField>
          </section>

          <section className="candidate-settings-detail__section">
            <h4 className="candidate-settings-detail__section-title">Направления консультаций</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
              {TOPIC_OPTIONS.map((opt) => {
                const isActive = (draft.mentor.mentorTopics || []).includes(opt.value);
                return (
                  <Button
                    key={opt.value}
                    type="button"
                    variant={isActive ? "primary" : "secondary"}
                    onClick={() => handleTopicToggle(opt.value)}
                  >
                    {opt.label}
                  </Button>
                );
              })}
            </div>
          </section>

          <section className="candidate-settings-detail__section">
            <h4 className="candidate-settings-detail__section-title">Календарь свободных слотов (1-на-1)</h4>
            
            <div className="candidate-settings-detail__grid candidate-settings-detail__grid--three" style={{ alignItems: "flex-end", gap: "8px", marginBottom: "16px" }}>
              <FormField label="Дата">
                <Input type="date" value={newSlotDate} onValueChange={setNewSlotDate} />
              </FormField>
              <FormField label="Время начала">
                <Input type="time" value={newSlotStart} onValueChange={setNewSlotStart} />
              </FormField>
              <FormField label="Время окончания">
                <Input type="time" value={newSlotEnd} onValueChange={setNewSlotEnd} />
              </FormField>
              <Button type="button" onClick={handleAddSlot} style={{ height: "42px" }}>Добавить слот</Button>
            </div>

            <div className="candidate-settings-detail__stack">
              {(draft.mentor.mentorSlots || []).length ? (
                (draft.mentor.mentorSlots || []).map((slot) => (
                  <Card key={slot.id} style={{ padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong>{slot.date}</strong> &middot; {slot.startTime} - {slot.endTime}
                      <span style={{ marginLeft: "12px", fontSize: "12px", color: slot.status === "booked" ? "var(--ui-color-success)" : "var(--ui-color-txt-secondary)" }}>
                        ({slot.status === "free" ? "Свободен" : slot.status === "booked" ? "Занят" : "Ожидает"})
                      </span>
                    </div>
                    {slot.status === "free" ? (
                      <Button type="button" variant="ghost" onClick={() => handleRemoveSlot(slot.id)}>Удалить</Button>
                    ) : null}
                  </Card>
                ))
              ) : (
                <p style={{ color: "var(--ui-color-txt-secondary)", fontSize: "14px" }}>Доступные слоты для встреч пока не настроены.</p>
              )}
            </div>
          </section>

          <section className="candidate-settings-detail__section">
            <h4 className="candidate-settings-detail__section-title">Заявки на разовые консультации</h4>
            <div className="candidate-settings-detail__stack">
              {(draft.mentor.mentorBookings || []).filter(b => b.status === "pending").length ? (
                (draft.mentor.mentorBookings || []).filter(b => b.status === "pending").map((booking) => (
                  <Card key={booking.id} style={{ padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <strong>{booking.candidateName}</strong>
                      <span style={{ fontSize: "14px", color: "var(--ui-color-txt-secondary)" }}>{booking.date} &bull; {booking.startTime}</span>
                    </div>
                    <p style={{ fontSize: "14px", margin: "4px 0" }}>Тема: {TOPIC_OPTIONS.find(t => t.value === booking.topic)?.label || booking.topic}</p>
                    {booking.message ? <p style={{ fontSize: "14px", fontStyle: "italic", margin: "4px 0" }}>💬 "{booking.message}"</p> : null}
                    <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                      <Button type="button" onClick={() => handleBookingDecision(booking.id, "approved")} size="sm">Подтвердить</Button>
                      <Button type="button" variant="ghost" onClick={() => handleBookingDecision(booking.id, "declined")} size="sm">Отклонить</Button>
                    </div>
                  </Card>
                ))
              ) : (
                <p style={{ color: "var(--ui-color-txt-secondary)", fontSize: "14px" }}>Новых заявок на консультации нет.</p>
              )}
            </div>
          </section>

          <section className="candidate-settings-detail__section">
            <h4 className="candidate-settings-detail__section-title">Заявки на программы менторства (Уровень А)</h4>
            <div className="candidate-settings-detail__stack">
              {(draft.mentor.mentorApplications || []).filter(a => a.status === "pending").length ? (
                (draft.mentor.mentorApplications || []).filter(a => a.status === "pending").map((app) => (
                  <Card key={app.id} style={{ padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <strong>{app.candidateName}</strong>
                      <span style={{ fontSize: "14px", color: "var(--ui-color-txt-secondary)" }}>{app.programTitle}</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                      <Button type="button" onClick={() => handleAppDecision(app.id, "approved")} size="sm">Одобрить участие</Button>
                      <Button type="button" variant="ghost" onClick={() => handleAppDecision(app.id, "declined")} size="sm">Отклонить</Button>
                    </div>
                  </Card>
                ))
              ) : (
                <p style={{ color: "var(--ui-color-txt-secondary)", fontSize: "14px" }}>Новых заявок на программы менторства нет.</p>
              )}
            </div>
          </section>

          <section className="candidate-settings-detail__section">
            <h4 className="candidate-settings-detail__section-title">Приглашения от компаний</h4>
            <div className="candidate-settings-detail__stack">
              {(draft.mentor.companyRequests || []).filter(r => r.status === "pending").length ? (
                (draft.mentor.companyRequests || []).filter(r => r.status === "pending").map((req) => (
                  <Card key={req.id} style={{ padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <strong>{req.companyName}</strong>
                      <span style={{ fontSize: "14px", color: "var(--ui-color-txt-secondary)" }}>Приглашение сотрудничать в качестве ментора</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                      <Button type="button" onClick={() => handleCompanyRequestDecision(req.id, "approved")} size="sm">Принять сотрудничество</Button>
                      <Button type="button" variant="ghost" onClick={() => handleCompanyRequestDecision(req.id, "declined")} size="sm">Отклонить</Button>
                    </div>
                  </Card>
                ))
              ) : (
                <p style={{ color: "var(--ui-color-txt-secondary)", fontSize: "14px" }}>Новых приглашений от компаний нет.</p>
              )}
            </div>
          </section>
        </>
      ) : null}

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

        // Sync and merge local bookings/applications for this mentor
        if (profile && profile.userId) {
          const localData = getMentorLocalData(profile.userId);
          
          const mergedSlots = (profile.links?.mentor?.mentorSlots || []).map(s => {
            const localSlot = (localData.slots || []).find(ls => ls.id === s.id);
            return localSlot ? { ...s, status: localSlot.status } : s;
          });

          const apiBookings = profile.links?.mentor?.mentorBookings || [];
          const mergedBookings = [...apiBookings];
          (localData.bookings || []).forEach(lb => {
            if (!mergedBookings.some(ab => ab.id === lb.id || ab.slotId === lb.slotId)) {
              mergedBookings.push(lb);
            }
          });

          const apiApps = profile.links?.mentor?.mentorApplications || [];
          const mergedApps = [...apiApps];
          (localData.applications || []).forEach(la => {
            if (!mergedApps.some(aa => aa.id === la.id)) {
              mergedApps.push(la);
            }
          });

          const apiRequests = profile.links?.mentor?.companyRequests || [];
          const mergedRequests = [...apiRequests];
          (localData.companyRequests || []).forEach(lr => {
            if (!mergedRequests.some(ar => ar.id === lr.id)) {
              mergedRequests.push(lr);
            }
          });

          if (!profile.links) {
            profile.links = {};
          }
          if (!profile.links.mentor) {
            profile.links.mentor = {};
          }

          if (profile.links.mentor.mentorCompanyId) {
            const stillHasApprovedLocal = (localData.companyRequests || []).some(
              r => r.companyId === profile.links.mentor.mentorCompanyId && r.status === "approved"
            );
            if (!stillHasApprovedLocal) {
              profile.links.mentor.mentorCompanyId = null;
              profile.links.mentor.mentorCompanyName = "";
            }
          }

          profile.links.mentor.mentorSlots = mergedSlots;
          profile.links.mentor.mentorBookings = mergedBookings;
          profile.links.mentor.mentorApplications = mergedApps;
          profile.links.mentor.companyRequests = mergedRequests;
        }

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

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarState({
        status: "error",
        error: "Загрузите изображение в формате JPG, PNG или WEBP.",
      });
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
      const upload = await uploadImage(file);
      if (!upload.url) {
        throw new Error("Сервер не вернул ссылку на изображение.");
      }

      updateDraft((currentDraft) => ({ ...currentDraft, avatarUrl: upload.url }), ["profile"]);
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

  function handleMentorChange(field, value) {
    updateDraft((currentDraft) => ({
      ...currentDraft,
      mentor: {
        ...currentDraft.mentor,
        [field]: value,
      },
    }), ["mentor"]);
  }

  async function handleMentorSave(event) {
    event.preventDefault();

    setSaveState((current) => ({
      ...current,
      mentor: { status: "saving", error: "" },
    }));

    try {
      const links = buildLinksPayload(state.profile, state.draft);
      const profile = await updateCandidateProfile({
        links,
      });
      const refreshedProfile = await getCandidateProfile();
      const nextProfile = refreshedProfile ?? profile;

      // Clear localStorage fields since they are now saved in DB
      if (nextProfile && nextProfile.userId) {
        saveMentorLocalData(nextProfile.userId, { slots: [], bookings: [], applications: [] });
      }

      setState((current) => ({
        ...current,
        profile: nextProfile,
        draft: createDraft(nextProfile, current.education),
      }));
      onSummaryChange?.({ profile: nextProfile });
      setSaveState((current) => ({
        ...current,
        mentor: { status: "success", error: "" },
      }));
    } catch (error) {
      setSaveState((current) => ({
        ...current,
        mentor: {
          status: "error",
          error: error?.message ?? "Не удалось сохранить настройки ментора.",
        },
      }));
    }
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
      await refreshAuthSession({ force: true }).catch(() => null);
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

              {section.id === "settings-mentor" ? (
                <CandidateMentorSettingsForm draft={state.draft} saveState={saveState.mentor || { status: "idle", error: "" }} onChange={handleMentorChange} onSave={handleMentorSave} />
              ) : null}
            </SettingsSectionCard>
          ))}
        </div>
      ) : null}
    </section>
  );
}
