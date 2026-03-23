import { useState } from "react";
import { Button, Card, FormField, Input, Select, Switch, Tag, Textarea } from "../components/ui";
import {
  SETTINGS_CREDENTIAL_SECTIONS,
  SETTINGS_OVERVIEW_SECTIONS,
  SETTINGS_VISIBILITY_PANELS,
} from "./data";
import {
  CandidateFrame,
  CandidateProfileHero,
  CandidateSectionHeader,
  CandidateSettingsPreviewCard,
} from "./shared";

const PROFILE_FORM = {
  lastName: "Ковалёва",
  firstName: "Анна",
  middleName: "Сергеевна",
  gender: "female",
  birthDate: "07.09.2003",
  citizenship: "Россия",
  city: "Чебоксары",
  about: "Дополнительная информация",
  university: "ЧГУ им. И. Н. Ульянова",
  graduationYear: "2027",
};

const SECURITY_LOGINS = [
  {
    device: "XiaoMi M2007J20CG",
    location: "Самара",
    timestamp: "12.03.2026 / 17:00",
  },
  {
    device: "XiaoMi M2007J20CG",
    location: "Чебоксары",
    timestamp: "11.03.2026 / 14:42",
  },
];

const NOTIFICATION_SETTINGS = [
  { id: "response-status", label: "Изменения статуса отклика", enabled: true },
  { id: "recommendations", label: "Новые рекомендации", enabled: true },
  { id: "contact-invites", label: "Приглашения в контакты", enabled: true },
  { id: "new-opportunities", label: "Новые возможности", enabled: false },
];

const GENDER_OPTIONS = [
  { value: "female", label: "Женский" },
  { value: "male", label: "Мужской" },
  { value: "other", label: "Не указан" },
];

const COUNTRY_OPTIONS = [
  { value: "Россия", label: "Россия" },
  { value: "Беларусь", label: "Беларусь" },
  { value: "Казахстан", label: "Казахстан" },
];

const CITY_OPTIONS = [
  { value: "Чебоксары", label: "Чебоксары" },
  { value: "Москва", label: "Москва" },
  { value: "Казань", label: "Казань" },
];

function buildVisibilityOptions(currentValue) {
  return [
    currentValue,
    "Только работодатели",
    "Только работодатели и контакты",
    "Все авторизованные",
    "Только контакты",
  ]
    .filter((value, index, values) => value && values.indexOf(value) === index)
    .map((value) => ({ value, label: value }));
}

function SettingsChevronRightIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m6 4 4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CandidateSettingsSaveButton({ centered = false }) {
  return (
    <div className={`candidate-settings-detail__save${centered ? " is-centered" : ""}`}>
      <Button>Сохранить</Button>
    </div>
  );
}

function CandidateSettingsProfileDetails() {
  const [additionalEducationItems, setAdditionalEducationItems] = useState([]);

  const handleAddEducation = () => {
    setAdditionalEducationItems((currentItems) => [
      ...currentItems,
      {
        id: `education-${currentItems.length + 1}`,
        university: "",
        graduationYear: "",
      },
    ]);
  };

  return (
    <div className="candidate-settings-detail">
      <section className="candidate-settings-detail__section">
        <h4 className="candidate-settings-detail__section-title">Основная информация</h4>

        <div className="candidate-settings-detail__grid">
          <FormField label="Фамилия">
            <Input defaultValue={PROFILE_FORM.lastName} />
          </FormField>
          <FormField label="Имя">
            <Input defaultValue={PROFILE_FORM.firstName} />
          </FormField>
          <FormField label="Отчество">
            <Input defaultValue={PROFILE_FORM.middleName} />
          </FormField>
        </div>

        <div className="candidate-settings-profile-row">
          <div className="candidate-settings-photo">
            <span className="candidate-settings-photo__label">Загрузить фото профиля</span>
            <div className="candidate-settings-photo__surface" aria-hidden="true">
              <span>АК</span>
            </div>
            <button type="button" className="candidate-settings-photo__edit">
              Изменить
            </button>
          </div>

          <FormField label="Пол">
            <Select defaultValue={PROFILE_FORM.gender} options={GENDER_OPTIONS} />
          </FormField>

          <FormField label="Дата рождения">
            <Input defaultValue={PROFILE_FORM.birthDate} />
          </FormField>
        </div>

        <div className="candidate-settings-detail__grid candidate-settings-detail__grid--two">
          <FormField label="Гражданство">
            <Select defaultValue={PROFILE_FORM.citizenship} options={COUNTRY_OPTIONS} />
          </FormField>
          <FormField label="Город">
            <Select defaultValue={PROFILE_FORM.city} options={CITY_OPTIONS} />
          </FormField>
        </div>

        <FormField label="О себе">
          <Textarea defaultValue={PROFILE_FORM.about} autoResize rows={4} />
        </FormField>
      </section>

      <section className="candidate-settings-detail__section">
        <h4 className="candidate-settings-detail__section-title">Образование</h4>

        <div className="candidate-settings-detail__grid">
          <FormField label="Название">
            <Input defaultValue={PROFILE_FORM.university} />
          </FormField>
        </div>

        <div className="candidate-settings-detail__grid candidate-settings-detail__grid--graduation">
          <FormField label="Год окончания">
            <Input defaultValue={PROFILE_FORM.graduationYear} />
          </FormField>
          <p className="candidate-settings-detail__hint">Если ещё учитесь, укажите год предполагаемого окончания</p>
        </div>

        {additionalEducationItems.length ? (
          <div className="candidate-settings-education-list">
            {additionalEducationItems.map((education, index) => (
              <div key={education.id} className="candidate-settings-education-item">
                <div className="candidate-settings-education-item__head">
                  <div className="candidate-settings-detail__subtitle">{`РћР±СЂР°Р·РѕРІР°РЅРёРµ ${index + 2}`}</div>
                </div>

                <div className="candidate-settings-detail__grid">
                  <FormField label="РќР°Р·РІР°РЅРёРµ">
                    <Input defaultValue={education.university} />
                  </FormField>
                </div>

                <div className="candidate-settings-detail__grid candidate-settings-detail__grid--graduation">
                  <FormField label="Р“РѕРґ РѕРєРѕРЅС‡Р°РЅРёСЏ">
                    <Input defaultValue={education.graduationYear} />
                  </FormField>
                  <p className="candidate-settings-detail__hint">Р•СЃР»Рё РµС‰С‘ СѓС‡РёС‚РµСЃСЊ, СѓРєР°Р¶РёС‚Рµ РіРѕРґ РїСЂРµРґРїРѕР»Р°РіР°РµРјРѕРіРѕ РѕРєРѕРЅС‡Р°РЅРёСЏ</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="candidate-settings-education-actions">
          <Button type="button" variant="ghost" size="sm" className="candidate-settings-education-add" onClick={handleAddEducation}>
            Р”РѕР±Р°РІРёС‚СЊ РµС‰С‘ РѕР±СЂР°Р·РѕРІР°РЅРёРµ
          </Button>
        </div>
      </section>

      <CandidateSettingsSaveButton />
    </div>
  );
}

function CandidateSettingsSecurityDetails() {
  const securitySection = SETTINGS_CREDENTIAL_SECTIONS[1];

  return (
    <div className="candidate-settings-detail">
      <div className="candidate-settings-detail__grid candidate-settings-detail__grid--two">
        <FormField label="Телефон">
          <Input defaultValue="+7 927 563 89 41" />
        </FormField>
        <FormField label="Почта">
          <Input defaultValue="mail@gmail.com" />
        </FormField>
      </div>

      <section className="candidate-settings-detail__section">
        <div className="candidate-settings-detail__subtitle">Сменить пароль</div>
        <div className="candidate-settings-detail__grid candidate-settings-detail__grid--two">
          <FormField label="Старый пароль">
            <Input defaultValue={securitySection.email} type="password" />
          </FormField>
          <FormField label="Новый пароль">
            <Input defaultValue={securitySection.email} type="password" />
          </FormField>
        </div>
      </section>

      <section className="candidate-settings-detail__section">
        <div className="candidate-settings-detail__subtitle">Последние входы</div>
        <div className="candidate-settings-logins">
          {SECURITY_LOGINS.map((login) => (
            <button key={`${login.device}-${login.timestamp}`} type="button" className="candidate-settings-login">
              <span className="candidate-settings-login__copy">
                <strong>{login.device}</strong>
                <span>{login.location}</span>
                <span>{login.timestamp}</span>
              </span>
              <span className="candidate-settings-login__icon" aria-hidden="true">
                <SettingsChevronRightIcon />
              </span>
            </button>
          ))}
        </div>
      </section>

      <CandidateSettingsSaveButton />
    </div>
  );
}

function CandidateSettingsVisibilityCard({ panel }) {
  return (
    <Card className="candidate-settings-privacy-card">
      <div className="candidate-settings-privacy-card__head">
        <Tag>{panel.eyebrow}</Tag>
        <h4>{panel.title}</h4>
      </div>

      <div className="candidate-settings-privacy-card__fields">
        {panel.rows.map((row) => (
          <FormField
            key={row.label}
            label={row.label}
            action={
              <button type="button" className="candidate-settings-reset">
                Сбросить
              </button>
            }
          >
            <Select defaultValue={row.value} options={buildVisibilityOptions(row.value)} />
          </FormField>
        ))}
      </div>
    </Card>
  );
}

function CandidateSettingsPrivacyDetails() {
  return (
    <div className="candidate-settings-detail candidate-settings-detail--privacy">
      <div className="candidate-settings-privacy-grid">
        {SETTINGS_VISIBILITY_PANELS.slice(0, 2).map((panel) => (
          <CandidateSettingsVisibilityCard key={panel.id} panel={panel} />
        ))}
      </div>

      <Card className="candidate-settings-privacy-card candidate-settings-notifications-card">
        <div className="candidate-settings-privacy-card__head candidate-settings-privacy-card__head--center">
          <Tag>{SETTINGS_VISIBILITY_PANELS[2].eyebrow}</Tag>
          <h4>{SETTINGS_VISIBILITY_PANELS[2].title}</h4>
        </div>

        <div className="candidate-settings-switches">
          {NOTIFICATION_SETTINGS.map((item) => (
            <div key={item.id} className="candidate-settings-switch-row">
              <Switch defaultChecked={item.enabled} label={item.label} className="candidate-settings-switch" />
            </div>
          ))}
        </div>
      </Card>

      <CandidateSettingsSaveButton centered />
    </div>
  );
}

function renderSectionContent(sectionId) {
  switch (sectionId) {
    case "settings-profile":
      return <CandidateSettingsProfileDetails />;
    case "settings-security":
      return <CandidateSettingsSecurityDetails />;
    case "settings-privacy":
      return <CandidateSettingsPrivacyDetails />;
    default:
      return null;
  }
}

function getInitialOpenSections() {
  if (typeof window === "undefined") {
    return [];
  }

  const currentUrl = new URL(window.location.href);
  const requestedSection = currentUrl.searchParams.get("section") || currentUrl.hash.replace(/^#/, "");

  if (!requestedSection) {
    return [];
  }

  return SETTINGS_OVERVIEW_SECTIONS.some((section) => section.id === requestedSection) ? [requestedSection] : [];
}

export function CandidateSettingsApp() {
  const [openSections, setOpenSections] = useState(getInitialOpenSections);

  const toggleSection = (sectionId) => {
    setOpenSections((currentSections) =>
      currentSections.includes(sectionId)
        ? currentSections.filter((currentSectionId) => currentSectionId !== sectionId)
        : [...currentSections, sectionId]
    );
  };

  return (
    <CandidateFrame activeKey="settings" hero={<CandidateProfileHero />}>
      <Card className="candidate-settings-panel">
        <CandidateSectionHeader
          eyebrow="Настройки"
          title="Настройки профиля"
          description="Собери свой портфолио и резюме для точных рекомендаций."
        />

        <div className="candidate-settings-panel__cards">
          {SETTINGS_OVERVIEW_SECTIONS.map((section) => (
            <CandidateSettingsPreviewCard
              key={section.id}
              section={section}
              isOpen={openSections.includes(section.id)}
              onToggle={toggleSection}
            >
              {renderSectionContent(section.id)}
            </CandidateSettingsPreviewCard>
          ))}
        </div>
      </Card>
    </CandidateFrame>
  );
}
