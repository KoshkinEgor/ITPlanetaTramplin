import { useEffect, useId, useState } from "react";
import "./ui-kit.css";
import {
  ActionSelect,
  Button,
  Card,
  Checkbox,
  ComplaintCard,
  CompanyVacancyTile,
  ConfirmActionSelect,
  ContentRail,
  CareerCourseCard,
  CareerMentorCard,
  CareerOpportunityCard,
  CareerPeerCard,
  CareerSalaryPanel,
  CareerSkillsPanel,
  CareerStatsPanel,
  DashboardActivityCard,
  DashboardFocusCard,
  DashboardPageHeader,
  DashboardQueueCard,
  DashboardSectionHeader,
  FilterPill,
  FormField,
  Input,
  ModerationActionDialog,
  OpportunityMiniCard,
  PlaceholderAction,
  PlaceholderBlock,
  PlaceholderMedia,
  PillButton,
  MapMarker,
  Radio,
  SearchInput,
  SectionHeader,
  SegmentedControl,
  Select,
  SettingsSectionCard,
  Switch,
  Textarea,
} from "../shared/ui";
import {
  CandidatePortfolioProjectCard,
  CandidatePortfolioSwitcher,
  CandidateResumeMiniCard,
  CandidateResumeProfileCard,
  CandidateResumeRecord,
  CandidateResumeSection,
} from "../candidate-portal/portfolio-kit";
import { CompanyPortfolioCarousel } from "../company-dashboard/CompanyPortfolioCarousel";
import { CandidateSectionHeader } from "../candidate-portal/shared";
import { OpportunityBlockCard, OpportunityBlockRail, OpportunityBlockSlider, OpportunityFilterSidebar, OpportunityRowCard } from "../components/opportunities";
import { formatComplaintDate, moderatorComplaintActionOptions, moderatorComplaintExamples } from "../moderator-dashboard/complaints.mock";
import { OpportunityDetailPreview } from "../opportunity-detail-card/OpportunityDetailCardApp";

const UI_KIT_BODY_CLASS = "ui-kit-react-body";

const sectionLinks = [
  { id: "ui-kit-foundation", label: "Foundation" },
  { id: "ui-kit-buttons", label: "Buttons" },
  { id: "ui-kit-map-markers", label: "Map" },
  { id: "ui-kit-actions", label: "Actions" },
  { id: "ui-kit-complaints", label: "Complaint Card" },
  { id: "ui-kit-form-controls", label: "Form Controls" },
  { id: "ui-kit-navigation", label: "Navigation" },
  { id: "ui-kit-form-field", label: "FormField" },
  { id: "ui-kit-placeholders", label: "Placeholders" },
  { id: "ui-kit-career", label: "Career" },
  { id: "ui-kit-candidate-portfolio", label: "Resume / Portfolio" },
  { id: "ui-kit-assemblies", label: "Assemblies" },
];

const colorTokens = [
  { label: "Background", token: "--ui-color-bg", value: "#F4F7FB" },
  { label: "Elevated background", token: "--ui-color-bg-elevated", value: "#FBFCFF" },
  { label: "Surface", token: "--ui-color-surface-strong", value: "#FFFFFF" },
  { label: "Text", token: "--ui-color-text", value: "#181D2D" },
  { label: "Muted text", token: "--ui-color-text-muted", value: "#687187" },
  { label: "Accent", token: "--ui-color-accent", value: "#2F80FF" },
  { label: "Lime", token: "--ui-color-lime", value: "#C9FF1F" },
  { label: "Danger", token: "--ui-color-danger", value: "#DE6544" },
];

const spacingTokens = [
  ["XS", "--ui-space-1", "4px"],
  ["SM", "--ui-space-2", "8px"],
  ["MD", "--ui-space-4", "16px"],
  ["LG", "--ui-space-6", "24px"],
  ["XL", "--ui-space-8", "32px"],
  ["2XL", "--ui-space-12", "48px"],
];

const radiusTokens = [
  ["SM", "--ui-radius-sm", "12px"],
  ["MD", "--ui-radius-md", "18px"],
  ["LG", "--ui-radius-lg", "24px"],
  ["XL", "--ui-radius-xl", "32px"],
  ["2XL", "--ui-radius-2xl", "40px"],
  ["Pill", "--ui-radius-pill", "999px"],
];

const shadowTokens = [
  ["Soft", "--ui-shadow-soft"],
  ["Strong", "--ui-shadow-strong"],
  ["Accent", "--ui-shadow-accent"],
];

const typographyRows = [
  { tag: "Display", utility: ".ui-type-display", className: "ui-type-display" },
  { tag: "H1", utility: ".ui-type-h1", className: "ui-type-h1" },
  { tag: "H2", utility: ".ui-type-h2", className: "ui-type-h2" },
  { tag: "H3", utility: ".ui-type-h3", className: "ui-type-h3" },
  { tag: "H4", utility: ".ui-type-h4", className: "ui-type-h4" },
  { tag: "H5", utility: ".ui-type-h5", className: "ui-type-h5" },
  { tag: "H6", utility: ".ui-type-h6", className: "ui-type-h6" },
  { tag: "Body LG", utility: ".ui-type-body-lg", className: "ui-type-body-lg ui-color-text-primary" },
  { tag: "Body", utility: ".ui-type-body", className: "ui-type-body ui-color-text-primary" },
  { tag: "Caption", utility: ".ui-type-caption", className: "ui-type-caption ui-color-text-primary" },
  { tag: "Small", utility: ".ui-type-small", className: "ui-type-small" },
  { tag: "Micro", utility: ".ui-type-micro", className: "ui-type-micro" },
  { tag: "Overline", utility: ".ui-type-overline", className: "ui-type-overline" },
];

const selectOptions = [
  { value: "design", label: "UI / UX" },
  { value: "frontend", label: "Frontend" },
  { value: "analytics", label: "Analytics" },
  { value: "qa", label: "QA" },
];

const formatOptions = [
  { value: "office", label: "Office" },
  { value: "hybrid", label: "Hybrid" },
  { value: "remote", label: "Remote" },
];

const settingsVisibilityOptions = [
  { value: "employers-and-contacts", label: "Employers and contacts" },
  { value: "contacts", label: "Contacts only" },
  { value: "everyone", label: "Everyone" },
];

const segmentOptions = [
  { value: "resume", label: "Резюме" },
  { value: "portfolio", label: "Портфолио" },
];

const mapMarkerToneOptions = [
  { value: "orange", label: "Orange" },
  { value: "green", label: "Green" },
  { value: "blue", label: "Blue" },
];

const mapMarkerSizeOptions = [
  { value: "sm", label: "28px" },
  { value: "md", label: "32px" },
  { value: "lg", label: "40px" },
];

const mapMarkerCountOptions = [
  { value: "3", label: "3" },
  { value: "8", label: "8" },
  { value: "12", label: "12" },
];

const actionSelectOptions = [
  { value: "block", label: "Заблокировать" },
  { value: "delete", label: "Удалить", tone: "danger" },
];

const confirmActionSelectOptions = [
  {
    value: "approved",
    label: "Одобрить",
    tone: "approve",
    confirmationTone: "success",
    confirmationButtonLabel: "Одобрить",
    confirmationButtonVariant: "primary",
  },
  {
    value: "revision",
    label: "Отправить на доработку",
    tone: "revision",
    confirmationTone: "warning",
    confirmationButtonLabel: "Отправить",
    confirmationButtonVariant: "secondary",
  },
  {
    value: "rejected",
    label: "Отклонить",
    tone: "reject",
    confirmationTone: "warning",
    confirmationButtonLabel: "Отклонить",
    confirmationButtonVariant: "danger",
  },
];

const complaintExampleOptions = moderatorComplaintExamples.map((item) => ({
  value: item.id,
  label: item.title,
}));

const complaintSizeOptions = [
  { value: "lg", label: "lg" },
  { value: "md", label: "md" },
];

const opportunityShowcaseRow = {
  type: "Вакансия",
  title: "Junior Security Analyst",
  company: "ООО Компания · Москва · Удаленно",
  accent: "Удаленно",
  note: "Команда ищет начинающего аналитика, которому нужен ясный стартовый стек и реальный production-контекст.",
  chips: ["Без опыта", "Можно удаленно"],
};

const opportunityShowcaseRail = [
  {
    id: "feature",
    type: "Вакансия",
    status: "Подходит на 85%",
    statusTone: "success",
    title: "Junior Security Analyst",
    company: "ООО Компания · Москва · онлайн",
    accentPrefix: "от",
    accent: "90 000 ₽",
    chips: ["Junior", "SOC", "SIEM"],
  },
  {
    id: "event",
    type: "Мероприятие",
    title: "IT-Планета",
    company: "IT-Планета · Москва · онлайн",
    accent: "155",
    valueSuffix: "регистраций",
    chips: ["Студенты", "Мероприятие"],
  },
  {
    id: "internship",
    type: "Стажировка",
    title: "Mobile UI/UX",
    company: "White Tiger Soft · онлайн",
    accentPrefix: "старт",
    accent: "в апреле",
    chips: ["Дизайн", "Оплачиваемая"],
  },
];

const opportunityShowcaseBlock = {
  id: "block-vacancy",
  type: "Vacancy",
  status: "Urgent",
  statusTone: "warning",
  title: "Frontend Developer (React)",
  company: "Neon Systems · Kazan · hybrid",
  accent: "from 140 000 ₽",
  note: "Product team with mentorship and fast delivery cycles on real features.",
  chips: ["React", "TypeScript", "Middle"],
};

const opportunityShowcaseSliderItems = [
  {
    id: "slider-security",
    type: "Vacancy",
    status: "Open",
    statusTone: "success",
    title: "Junior Security Analyst",
    company: "Acme Security · Moscow + remote",
    accent: "from 90 000 ₽",
    chips: ["Junior", "SOC", "SIEM"],
  },
  {
    id: "slider-event",
    type: "Event",
    status: "Registration",
    statusTone: "warning",
    title: "IT Planet",
    company: "IT Planet · online",
    accent: "155 registrations",
    chips: ["Students", "Community"],
  },
  {
    id: "slider-design",
    type: "Internship",
    status: "Soon",
    statusTone: "neutral",
    title: "Mobile UI/UX",
    company: "White Tiger Soft · hybrid",
    accent: "8 weeks",
    chips: ["Design", "Paid"],
  },
  {
    id: "slider-frontend",
    type: "Vacancy",
    status: "Remote",
    statusTone: "success",
    title: "Junior Frontend Developer",
    company: "Neon Systems · remote",
    accent: "from 110 000 ₽",
    chips: ["React", "TypeScript", "Mentorship"],
  },
  {
    id: "slider-analytics",
    type: "Internship",
    status: "Open",
    statusTone: "success",
    title: "Data Analyst Intern",
    company: "Orbit Lab · Kazan + hybrid",
    accent: "part-time",
    chips: ["SQL", "Python", "Growth"],
  },
];

const recommendedOpportunityRailItems = [
  {
    id: "candidate-recommendation-security",
    type: "Вакансия",
    status: "Опубликовано",
    statusTone: "success",
    title: "Junior Security Analyst",
    company: "Acme Security · Москва · удалённо",
    accent: "Удалённо",
    chips: ["Junior", "SOC", "SIEM"],
  },
  {
    id: "candidate-recommendation-design",
    type: "Стажировка",
    status: "Опубликовано",
    statusTone: "success",
    title: "Mobile UI/UX",
    company: "White Tiger Soft · Казань · гибрид",
    accent: "Гибрид",
    chips: ["Дизайн", "Оплачиваемая", "8 недель"],
  },
  {
    id: "candidate-recommendation-event",
    type: "Мероприятие",
    status: "Опубликовано",
    statusTone: "success",
    title: "IT-Планета",
    company: "IT-Планета · онлайн",
    accent: "Онлайн",
    chips: ["Студенты", "Комьюнити", "Регистрация"],
  },
];

const candidatePortfolioPreviewTabs = [
  { value: "resume", label: "Резюме", href: "#ui-kit-candidate-resume-assembly" },
  { value: "projects", label: "Портфолио", href: "#ui-kit-candidate-portfolio-assembly" },
];

const candidateResumeProfilePreview = {
  description: "UX/UI-дизайнер и исследователь. Собираю интерфейсы для образовательных продуктов, умею вести интервью и быстро упаковывать кейсы в понятное портфолио.",
  skills: ["Figma", "UX Research", "UI", "Design System", "Prototype"],
};

const candidateResumeMiniPreview = {
  title: "Веб-дизайнер",
  updatedAt: "2026-03-12",
  city: "Чебоксары",
  experience: "Опыт: не указан",
  visibility: "private",
  stats: {
    impressions: 0,
    views: 0,
    invitations: 0,
  },
};

const candidateEducationPreview = [
  {
    id: "candidate-education-1",
    title: "ЧГУ им. И. Н. Ульянова",
    description: "Факультет информатики · Прикладная информатика",
    meta: "2022 - 2026",
  },
  {
    id: "candidate-education-2",
    title: "Яндекс Практикум",
    description: "Курс UX/UI-дизайна",
    meta: "2025 - 2025",
  },
];

const candidateAchievementPreview = [
  {
    id: "candidate-achievement-1",
    title: "IT-Планета 2026",
    description: "Финалист направления по продуктовому дизайну и презентации решений.",
    meta: "19 марта 2026",
  },
  {
    id: "candidate-achievement-2",
    title: "Портфолио-ревью",
    description: "Получил рекомендации по структуре кейсов и позиционированию профиля.",
    meta: "2 февраля 2026",
  },
];

const candidatePortfolioPreviewProjects = [
  {
    id: "candidate-portfolio-project-1",
    type: "Pet-проект",
    status: "Обновлено 24 марта 2026",
    statusTone: "success",
    title: "StudyFlow",
    description: "Сервис для планирования учебной нагрузки и совместных проектных спринтов.",
    role: "Роль в проекте: UX/UI designer",
    chips: ["Figma", "Research", "Design System", "Prototype"],
  },
  {
    id: "candidate-portfolio-project-2",
    type: "Стажировка",
    status: "В работе",
    statusTone: "warning",
    title: "Career Track",
    description: "Личный кабинет соискателя с рекомендациями по вакансиям и карьерному росту.",
    role: "Роль в проекте: Product designer",
    chips: ["UI", "Analytics", "CJM", "Presentation"],
  },
];

const UI_KIT_DETAIL_LABEL = "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u0435\u0435";

const sidebarOptions = {
  cities: [
    { value: "Москва", label: "Москва" },
    { value: "Чебоксары", label: "Чебоксары" },
    { value: "Казань", label: "Казань" },
  ],
  specializations: [
    { value: "Security", label: "Security" },
    { value: "UI / UX", label: "UI / UX" },
    { value: "Frontend", label: "Frontend" },
  ],
  employmentTypes: [
    { value: "На месте работодателя", label: "На месте работодателя" },
    { value: "Удаленно", label: "Удаленно" },
    { value: "Гибрид", label: "Гибрид" },
  ],
};

const sidebarInitialValues = {
  city: "Москва",
  specialization: "Security",
  employmentTypes: ["Удаленно"],
  incomeFrom: "",
  payoutPeriod: "",
  education: [],
};

const careerStatsPanelMock = {
  title: "Твоя карьера",
  metaTitle: "Анна Иванова",
  metaDescription: "UX/UI дизайнер · Чебоксары",
  stats: [
    { value: "6", label: "Отклики" },
    { value: "2", label: "Рассмотрение" },
    { value: "1", label: "Приглашения", tone: "success" },
  ],
  description: "Чтобы повысить шансы на собеседование, можно обратиться к менторам: они помогут усилить профиль и подготовить следующий шаг.",
  cta: { href: "#career-interview", label: "Подготовиться к собеседованию" },
};

const careerSkillsPanelMock = {
  title: "Твои навыки",
  primarySkills: ["SQL", "Python", "Research", "UX", "Figma", "Презентации"],
  suggestedSkills: ["Вёрстка", "Графический дизайн", "User experience", "Sketch", "User interface", "Adobe Photoshop"],
  href: "#career-courses",
};

const careerSalaryPanelMock = {
  title: "Уровень зарплат",
  city: "Чебоксарах",
  items: [
    { level: "Джуниор веб-дизайнер", range: "44-56 тыс. ₽", progress: 0.32 },
    { level: "Мид веб-дизайнер", range: "52-59 тыс. ₽", progress: 0.5 },
    { level: "Сеньор веб-дизайнер", range: "106-459 тыс. ₽", progress: 1 },
  ],
};

const careerCourseCardMock = {
  meta: "Продвинутый · 3 мес + онлайн",
  title: "Нейросети для дизайна",
  provider: "Яндекс Практикум",
  price: "40 000 ₽",
  oldPrice: "82 000 ₽",
  monthly: "2325 ₽ в месяц",
  href: "#career-course-card",
  actionLabel: "Перейти к курсу",
};

const careerOpportunityCardMock = {
  type: "Стажировка",
  status: "Активно",
  statusTone: "success",
  title: "Веб-дизайнер",
  company: "White Tiger Soft",
  accent: "Длительность: 8 недель",
  chips: ["Студенты", "Без опыта"],
  href: "#career-opportunity-card",
};

const careerMentorCardMock = {
  name: "Мария Соколова",
  role: "Карьерный консультант",
  summary: "Сертифицированный карьерный консультант, эксперт по трудоустройству топ-менеджеров.",
  tone: "warning",
  href: "#career-mentor-card",
};

const careerPeerCardMock = {
  name: "Александра Морева",
  initials: "АМ",
  sharedSkills: ["Web-design", "UX", "Figma"],
  href: "#career-peer-card",
};

const careerCourseCardsMock = [
  careerCourseCardMock,
  {
    meta: "С нуля · 2 мес + онлайн",
    title: "Adobe Illustrator с нуля",
    provider: "Skillbox",
    price: "25 000 ₽",
    oldPrice: "82 000 ₽",
    monthly: "825 ₽ в месяц",
    href: "#career-course-illustrator",
    actionLabel: "Перейти к курсу",
  },
  {
    meta: "С нуля · 1 мес + онлайн",
    title: "Типографика и вёрстка: внимание к типу",
    provider: "Skillbox",
    price: "20 000 ₽",
    oldPrice: "82 000 ₽",
    monthly: "755 ₽ в месяц",
    href: "#career-course-typography",
    actionLabel: "Перейти к курсу",
  },
  {
    meta: "С нуля · 4 мес + онлайн",
    title: "Ускоренный курс по графическому дизайну",
    provider: "Skillbox",
    price: "78 000 ₽",
    oldPrice: "82 000 ₽",
    monthly: "3755 ₽ в месяц",
    href: "#career-course-graphic",
    actionLabel: "Перейти к курсу",
  },
];

const careerOpportunityCardsMock = [
  {
    type: "Стажировка",
    status: "Активно",
    statusTone: "success",
    title: "Дизайнер интерфейсов мобильных приложений UI/UX (Junior/Middle)",
    company: "White Tiger Soft",
    accent: "Длительность: 8 недель",
    chips: ["Студенты", "Без опыта"],
    href: "#career-opportunity-featured",
  },
  {
    type: "Стажировка",
    status: "Активно",
    statusTone: "success",
    title: "Веб-дизайнер",
    company: "ГАУЗ Республиканский медицинский центр",
    accent: "Длительность: 4 недели",
    chips: ["Студенты", "Без опыта"],
    href: "#career-opportunity-web",
  },
  {
    type: "Стажировка",
    status: "Активно",
    statusTone: "success",
    title: "Графический дизайнер",
    company: "Leonards space",
    accent: "Длительность: 12 недель",
    chips: ["Студенты", "Без опыта"],
    href: "#career-opportunity-graphic",
  },
  {
    type: "Стажировка",
    status: "Активно",
    statusTone: "success",
    title: "Дизайнер цифровых продуктов",
    company: "White Tiger Soft",
    accent: "Длительность: 6 недель",
    chips: ["Студенты", "Junior"],
    href: "#career-opportunity-product",
  },
];

const careerMentorCardsMock = [
  careerMentorCardMock,
  {
    name: "Юлия Дмитриева",
    role: "Карьерный консультант",
    summary: "Помогает настроить карьерный фокус, резюме и уверенно пройти интервью.",
    tone: "accent",
    href: "#career-mentor-julia",
  },
  {
    name: "Вероника Алексеева",
    role: "Senior Product Designer в Яндекс",
    summary: "5 лет в UX/UI-дизайне, IT-рекрутинге и продуктовых командах.",
    tone: "success",
    href: "#career-mentor-veronica",
  },
];

const careerPeerCardsMock = [
  careerPeerCardMock,
  {
    name: "Анастасия Соколова",
    initials: "АС",
    sharedSkills: ["Figma", "UX", "Research"],
    href: "#career-peer-anastasia",
  },
  {
    name: "Мария Ильина",
    initials: "МИ",
    sharedSkills: ["Figma", "UX"],
    href: "#career-peer-maria",
  },
];

function createUiKitSliderCardProps(item) {
  return {
    detailAction: {
      href: `#${item.id ?? "opportunity"}`,
      label: UI_KIT_DETAIL_LABEL,
      variant: "secondary",
    },
  };
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4.166 10h11.667" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10.833 4.167 15.833 10l-5 5.833" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 2.5 11.698 7.52 16.667 9.167l-4.969 1.646L10 15.833 8.302 10.813 3.333 9.167 8.302 7.52 10 2.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="m13.875 3.375 2.75 2.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="m5 14.875 8.75-8.75 2.25 2.25-8.75 8.75L4.5 17.5 5 14.875Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BlockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="15" height="15" rx="2.5" fill="currentColor" />
    </svg>
  );
}

function QuietResetAction({ disabled = false }) {
  return (
    <button type="button" className="ui-field__action-button ui-field__action-button--quiet" disabled={disabled}>
      Сбросить
    </button>
  );
}

function InputVariantPreview({ title, fieldValue = "", placeholder, iconPosition = "none", disabled = false }) {
  const icon = <BlockIcon />;
  const inputProps =
    iconPosition === "left"
      ? { iconStart: icon }
      : iconPosition === "right"
        ? { iconEnd: icon }
        : {};

  return (
    <div className="ui-kit-input-variant">
      <span className="ui-kit-input-variant__title">{title}</span>
      <FormField
        className="ui-kit-input-variant__field"
        label="Формат работы"
        action={<QuietResetAction disabled={disabled} />}
      >
        <Input
          value={fieldValue}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
          className="ui-kit-input-variant__control"
          {...inputProps}
        />
      </FormField>
    </div>
  );
}

function UiKitSection({ id, eyebrow, title, description, children }) {
  return (
    <section className="ui-kit-section" id={id}>
      <div className="ui-kit-section__head">
        <div className="ui-kit-section__copy">
          <span className="ui-kit-eyebrow">{eyebrow}</span>
          <h2 className="ui-type-h1">{title}</h2>
          <p className="ui-type-body">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function UiKitFoundationCard({ title, description, children }) {
  return (
    <Card className="ui-kit-foundation-card">
      <div className="ui-kit-foundation-card__copy">
        <h3 className="ui-type-h3">{title}</h3>
        <p className="ui-type-body">{description}</p>
      </div>
      {children}
    </Card>
  );
}

function UiKitDemoCard({ eyebrow, title, description, controls, children, footer, className }) {
  return (
    <Card className={["ui-kit-specimen", className].filter(Boolean).join(" ")}>
      <div className="ui-kit-specimen__copy">
        <span className="ui-kit-eyebrow">{eyebrow}</span>
        <h3 className="ui-type-h3">{title}</h3>
        <p className="ui-type-body">{description}</p>
      </div>

      <div className="ui-kit-demo-layout">
        <div className="ui-kit-demo-preview">{children}</div>
        <div className="ui-kit-field-panel">{controls}</div>
      </div>

      {footer ? <p className="ui-type-caption">{footer}</p> : null}
    </Card>
  );
}

function UiKitControlField({ label, children }) {
  return (
    <label className="ui-kit-control">
      <span className="ui-kit-control__label">{label}</span>
      {children}
    </label>
  );
}

function UiKitTextControl({ label, value, onChange, placeholder }) {
  return (
    <UiKitControlField label={label}>
      <input className="ui-kit-control__input" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </UiKitControlField>
  );
}

function UiKitSelectControl({ label, value, onChange, options }) {
  return (
    <UiKitControlField label={label}>
      <select className="ui-kit-control__input" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </UiKitControlField>
  );
}

function UiKitColorControl({ label, value, onChange }) {
  return (
    <UiKitControlField label={label}>
      <input className="ui-kit-control__color" type="color" value={value} onChange={(event) => onChange(event.target.value)} />
    </UiKitControlField>
  );
}

function UiKitToggleControl({ label, checked, onChange }) {
  return (
    <label className="ui-kit-toggle">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function ButtonPlayground() {
  const [label, setLabel] = useState("Apply now");
  const [variant, setVariant] = useState("primary");
  const [size, setSize] = useState("md");
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [withStartIcon, setWithStartIcon] = useState(true);
  const [withEndIcon, setWithEndIcon] = useState(false);
  const [accentColor, setAccentColor] = useState("#2f80ff");

  return (
    <UiKitDemoCard
      eyebrow="Primitive"
      title="Button"
      description="Primary action styles live in one place, and this card is the manual verification point for states and spacing."
      footer="The controls update only the local preview. No product screen logic is touched."
      controls={
        <>
          <div className="ui-kit-control-grid">
            <UiKitTextControl label="Label" value={label} onChange={setLabel} placeholder="Button label" />
            <UiKitSelectControl
              label="Variant"
              value={variant}
              onChange={setVariant}
              options={[
                { value: "primary", label: "primary" },
                { value: "secondary", label: "secondary" },
                { value: "ghost", label: "ghost" },
                { value: "danger", label: "danger" },
                { value: "contrast", label: "contrast" },
              ]}
            />
            <UiKitSelectControl
              label="Size"
              value={size}
              onChange={setSize}
              options={[
                { value: "sm", label: "sm" },
                { value: "md", label: "md" },
                { value: "lg", label: "lg" },
              ]}
            />
            {variant === "contrast" ? <UiKitColorControl label="Accent color" value={accentColor} onChange={setAccentColor} /> : null}
          </div>
          <div className="ui-kit-toggle-grid">
            <UiKitToggleControl label="Loading" checked={loading} onChange={setLoading} />
            <UiKitToggleControl label="Disabled" checked={disabled} onChange={setDisabled} />
            <UiKitToggleControl label="Hovered" checked={hovered} onChange={setHovered} />
            <UiKitToggleControl label="Focused" checked={focused} onChange={setFocused} />
            <UiKitToggleControl label="Start icon" checked={withStartIcon} onChange={setWithStartIcon} />
            <UiKitToggleControl label="End icon" checked={withEndIcon} onChange={setWithEndIcon} />
          </div>
        </>
      }
    >
      <div className="ui-kit-button-row">
        <Button
          data-testid="ui-kit-button-preview"
          variant={variant}
          size={size}
          loading={loading}
          disabled={disabled}
          hovered={hovered}
          focused={focused}
          accentColor={variant === "contrast" ? accentColor : undefined}
          iconStart={withStartIcon ? <SparkIcon /> : undefined}
          iconEnd={withEndIcon ? <ArrowIcon /> : undefined}
        >
          {label || "Apply now"}
        </Button>
      </div>
      <div className="ui-kit-button-row">
        <Button size="sm">Small</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="contrast" accentColor="#3ddc72">
          Contrast
        </Button>
      </div>
    </UiKitDemoCard>
  );
}

function ActionSelectPlayground() {
  const [value, setValue] = useState("block");
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [disabled, setDisabled] = useState(false);

  return (
    <UiKitDemoCard
      eyebrow="Action System"
      title="Action Select"
      description="Contextual administrative action switcher with a dedicated destructive tone, kept separate from the regular select API."
      footer="Use this for moderation and row-level actions where the current choice itself carries semantic weight."
      controls={
        <>
          <div className="ui-kit-control-grid">
            <UiKitSelectControl label="Selected action" value={value} onChange={setValue} options={actionSelectOptions} />
          </div>
          <div className="ui-kit-toggle-grid">
            <UiKitToggleControl label="Hovered" checked={hovered} onChange={setHovered} />
            <UiKitToggleControl label="Focused" checked={focused} onChange={setFocused} />
            <UiKitToggleControl label="Disabled" checked={disabled} onChange={setDisabled} />
          </div>
        </>
      }
    >
      <div className="ui-kit-action-select-stack">
        <div className="ui-kit-action-select-frame">
          <div data-testid="ui-kit-action-select-preview">
            <ActionSelect
              value={value}
              onValueChange={setValue}
              options={actionSelectOptions}
              hovered={hovered}
              focused={focused}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="ui-kit-action-system">
          <div className="ui-kit-action-system__row">
            <span className="ui-kit-action-system__label">default</span>
            <ActionSelect value="block" options={actionSelectOptions} />
          </div>
          <div className="ui-kit-action-system__row">
            <span className="ui-kit-action-system__label">hover</span>
            <ActionSelect value="block" options={actionSelectOptions} hovered />
          </div>
          <div className="ui-kit-action-system__row">
            <span className="ui-kit-action-system__label">danger</span>
            <ActionSelect value="delete" options={actionSelectOptions} />
          </div>
        </div>
      </div>
    </UiKitDemoCard>
  );
}

function ConfirmActionSelectPlayground() {
  const [value, setValue] = useState("approved");
  const [lastApplied, setLastApplied] = useState("Одобрить");

  return (
    <UiKitDemoCard
      eyebrow="Action System"
      title="Confirm Action Select"
      description="Shared action select with a built-in confirmation modal for moderation and other high-risk flows."
      footer="Use this when the action should be chosen from a dropdown but only committed after an explicit confirmation step."
      controls={
        <div className="ui-kit-control-grid">
          <UiKitSelectControl label="Applied action" value={value} onChange={setValue} options={confirmActionSelectOptions} />
        </div>
      }
    >
      <div className="ui-kit-action-select-stack">
        <div className="ui-kit-action-select-frame">
          <div data-testid="ui-kit-confirm-action-select-preview">
            <ConfirmActionSelect
              value={value}
              options={confirmActionSelectOptions}
              onConfirm={(nextValue, option) => {
                setValue(nextValue);
                setLastApplied(option.label);
              }}
              getConfirmation={(option) => ({
                title: `Подтвердить: ${option.label}?`,
                description: "Действие будет применено после подтверждения.",
              })}
            />
          </div>
        </div>

        <div className="ui-kit-action-system">
          <div className="ui-kit-action-system__row">
            <span className="ui-kit-action-system__label">last applied</span>
            <span className="ui-kit-note">{lastApplied}</span>
          </div>
          <div className="ui-kit-action-system__row">
            <span className="ui-kit-action-system__label">disabled</span>
            <ConfirmActionSelect value="approved" options={confirmActionSelectOptions} disabled />
          </div>
        </div>
      </div>
    </UiKitDemoCard>
  );
}

function ModerationActionDialogPlayground() {
  const [revisionReason, setRevisionReason] = useState("Не указан формат мероприятия");

  return (
    <UiKitDemoCard
      eyebrow="Moderation"
      title="Moderation Action Dialog"
      description="Reusable moderation window with approve, reject, and revision variants. The revision flow can request a moderator note without inventing a separate layout."
      footer="Use the same component for embedded previews in the ui-kit and inside a real modal when the dashboard confirms a moderation decision."
      className="ui-kit-specimen--wide"
      controls={
        <>
          <UiKitTextControl label="Текст причины" value={revisionReason} onChange={setRevisionReason} placeholder="Комментарий модератора" />
          <div className="ui-kit-foundation-stack">
            <span className="ui-kit-note">
              <code>approve</code> и <code>reject</code> остаются компактными и сфокусированными на действии.
            </span>
            <span className="ui-kit-note">
              <code>revision</code> добавляет сбрасываемое поле для комментария модератора.
            </span>
          </div>
        </>
      }
    >
      <div className="ui-kit-moderation-dialog-grid" data-testid="ui-kit-moderation-action-dialogs">
        <ModerationActionDialog
          variant="reject"
          actionLabel="Отклонить заявку"
          question="Вы уверены?"
          description="Заявка будет отклонена. Возможность не будет добавлена для публичного просмотра."
          confirmLabel="Отклонить"
          onCancel={() => {}}
          onConfirm={() => {}}
        />

        <ModerationActionDialog
          variant="approve"
          actionLabel="Одобрить заявку"
          question="Вы уверены?"
          description="Заявка будет одобрена. Возможность будет добавлена для публичного просмотра."
          confirmLabel="Одобрить"
          onCancel={() => {}}
          onConfirm={() => {}}
        />

        <ModerationActionDialog
          variant="revision"
          className="ui-kit-moderation-dialog-card--center"
          actionLabel="Отправить заявку на доработку"
          question="Вы уверены?"
          description="Заявка будет отправлена на доработку. Возможность не будет добавлена для публичного просмотра до момента одобрения."
          reasonLabel="Причина отказа"
          reasonValue={revisionReason}
          onReasonChange={setRevisionReason}
          confirmLabel="Отправить на доработку"
          onCancel={() => {}}
          onConfirm={() => {}}
        />
      </div>
    </UiKitDemoCard>
  );
}

function ComplaintCardPlayground() {
  const [activeExampleId, setActiveExampleId] = useState(moderatorComplaintExamples[0]?.id ?? "");
  const [size, setSize] = useState("md");
  const [actionById, setActionById] = useState(() =>
    Object.fromEntries(moderatorComplaintExamples.map((item) => [item.id, moderatorComplaintActionOptions[0]?.value ?? ""]))
  );

  return (
    <UiKitDemoCard
      eyebrow="Moderation"
      title="Complaint Card"
      description="Universal card for grouped complaints in the curator queue: reason, date, summary, counter, and moderation action in one reusable block."
      footer="Use this card on the complaints route and in any moderation queue where several reports are merged into one decision point."
      className="ui-kit-specimen--wide"
      controls={
        <>
          <UiKitSelectControl label="Активный пример" value={activeExampleId} onChange={setActiveExampleId} options={complaintExampleOptions} />
          <UiKitSelectControl label="Размер" value={size} onChange={setSize} options={complaintSizeOptions} />
          <UiKitSelectControl
            label="Действие"
            value={actionById[activeExampleId] ?? moderatorComplaintActionOptions[0]?.value ?? ""}
            onChange={(nextValue) =>
              setActionById((current) => ({
                ...current,
                [activeExampleId]: nextValue,
              }))
            }
            options={moderatorComplaintActionOptions}
          />
        </>
      }
    >
      <div className="ui-kit-complaints-preview" data-testid="ui-kit-complaint-cards">
        {moderatorComplaintExamples.map((item) => (
          <ComplaintCard
            key={item.id}
            size={size}
            title={item.title}
            meta={[item.reason, formatComplaintDate(item.createdAt)]}
            description={item.description}
            count={item.count}
            actionOptions={moderatorComplaintActionOptions}
            actionValue={actionById[item.id]}
            onActionChange={(nextValue) =>
              setActionById((current) => ({
                ...current,
                [item.id]: nextValue,
              }))
            }
            className={item.id !== activeExampleId ? "ui-kit-complaint-card--muted" : undefined}
            data-testid={item.id === activeExampleId ? "ui-kit-complaint-card-preview" : undefined}
          />
        ))}
      </div>
    </UiKitDemoCard>
  );
}

function InputPlayground() {
  const [value, setValue] = useState("hello@tramplin.ru");
  const [clearable, setClearable] = useState(true);
  const [copyable, setCopyable] = useState(false);
  const [disabled, setDisabled] = useState(false);

  return (
    <UiKitDemoCard
      eyebrow="Primitive"
      title="Input"
      description="The 58px field block stays consistent across plain, left-icon, and right-icon variants while FormField handles the label and top action."
      footer="Figma scale note: the input block itself keeps a 58px height."
      className="ui-kit-input-specimen"
      controls={
        <>
          <UiKitTextControl label="Value" value={value} onChange={setValue} placeholder="Input value" />
          <div className="ui-kit-toggle-grid">
            <UiKitToggleControl label="Clearable" checked={clearable} onChange={setClearable} />
            <UiKitToggleControl label="Copyable" checked={copyable} onChange={setCopyable} />
            <UiKitToggleControl label="Disabled" checked={disabled} onChange={setDisabled} />
          </div>
        </>
      }
    >
      <div className="ui-kit-input-variant-grid" data-testid="ui-kit-input-variants">
        <InputVariantPreview title="Default" fieldValue="IT - Планета" disabled={disabled} />
        <InputVariantPreview title="Icon left" placeholder="Поиск возможностей" iconPosition="left" disabled={disabled} />
        <InputVariantPreview title="Icon right" placeholder="Поиск возможностей" iconPosition="right" disabled={disabled} />
      </div>
      <FormField label="Email" hint="Shared label, shell, and helper rhythm.">
        <Input
          value={value}
          onValueChange={setValue}
          placeholder="hello@tramplin.ru"
          clearable={clearable}
          copyable={copyable}
          disabled={disabled}
        />
      </FormField>
      <FormField label="Password" hint="Reveal action stays in the primitive, not in page code.">
        <Input type="password" value="Secret123" revealable readOnly />
      </FormField>
    </UiKitDemoCard>
  );
}

function SearchInputPlayground() {
  const [value, setValue] = useState("\u041F\u043E\u0438\u0441\u043A \u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E\u0441\u0442\u0435\u0439");
  const [placeholder, setPlaceholder] = useState("\u041F\u043E\u0438\u0441\u043A \u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E\u0441\u0442\u0435\u0439");
  const [appearance, setAppearance] = useState("default");
  const [size, setSize] = useState("md");
  const [disabled, setDisabled] = useState(false);

  return (
    <UiKitDemoCard
      eyebrow="Primitive"
      title="Search Input"
      description="Search bars use one shared pill shell, so catalog, discovery, and tag pickers keep the same icon rhythm and clear action."
      footer="This preview fixes the default compact search state before page-specific overrides are applied."
      className="ui-kit-search-specimen"
      controls={
        <>
          <div className="ui-kit-control-grid">
            <UiKitTextControl label="Value" value={value} onChange={setValue} placeholder="Search value" />
            <UiKitTextControl label="Placeholder" value={placeholder} onChange={setPlaceholder} placeholder="Search placeholder" />
            <UiKitSelectControl
              label="Appearance"
              value={appearance}
              onChange={setAppearance}
              options={[
                { value: "default", label: "default" },
                { value: "elevated", label: "elevated" },
              ]}
            />
            <UiKitSelectControl
              label="Size"
              value={size}
              onChange={setSize}
              options={[
                { value: "md", label: "md" },
                { value: "lg", label: "lg" },
              ]}
            />
          </div>
          <div className="ui-kit-toggle-grid">
            <UiKitToggleControl label="Disabled" checked={disabled} onChange={setDisabled} />
          </div>
        </>
      }
    >
      <div className="ui-kit-search-showcase">
        <SearchInput
          data-testid="ui-kit-search-preview"
          value={value}
          onValueChange={setValue}
          placeholder={placeholder || "\u041F\u043E\u0438\u0441\u043A \u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E\u0441\u0442\u0435\u0439"}
          clearLabel="\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u043F\u043E\u0438\u0441\u043A"
          appearance={appearance}
          size={size}
          disabled={disabled}
          className="ui-kit-search-preview"
        />
        <div className="ui-kit-search-variants">
          <SearchInput data-testid="ui-kit-search-preview-default" value="" placeholder="Default md" clearLabel="Clear search" className="ui-kit-search-preview" />
          <SearchInput
            data-testid="ui-kit-search-preview-elevated"
            value=""
            appearance="elevated"
            size="lg"
            placeholder="Elevated lg"
            clearLabel="Clear search"
            className="ui-kit-search-preview"
          />
        </div>
      </div>
    </UiKitDemoCard>
  );
}

function PillButtonPlayground() {
  const [active, setActive] = useState("all");
  const [size, setSize] = useState("lg");

  return (
    <UiKitDemoCard
      eyebrow="Primitive"
      title="Pill Button"
      description="Large and compact pill states are shared between filter groups, city choosers, and inline selectors."
      controls={(
        <UiKitControlField label="Size">
          <select className="ui-kit-control__input" value={size} onChange={(event) => setSize(event.target.value)}>
            <option value="md">md</option>
            <option value="lg">lg</option>
          </select>
        </UiKitControlField>
      )}
    >
      <div className="ui-kit-pill-stack">
        <div className="ui-kit-pill-stack__row" data-testid="ui-kit-pill-preview">
          {[
            { value: "all", label: "Все" },
            { value: "vacancies", label: "Вакансии" },
            { value: "internships", label: "Стажировки" },
          ].map((item) => (
            <PillButton key={item.value} size={size} active={active === item.value} onClick={() => setActive(item.value)}>
              {item.label}
            </PillButton>
          ))}
        </div>
        <PillButton data-testid="ui-kit-pill-preview-lg" size="lg" active>
          Крупная filter pill
        </PillButton>
      </div>
    </UiKitDemoCard>
  );
}

function MapMarkerPlayground() {
  const [tone, setTone] = useState("orange");
  const [size, setSize] = useState("md");
  const [label, setLabel] = useState("IT Planet");
  const [clusterCount, setClusterCount] = useState("3");

  return (
    <UiKitDemoCard
      eyebrow="Primitive"
      title="Map Marker"
      description="Compact discovery pins and cluster counters sized from the 32px Figma reference so they stay readable without taking over the map."
      className="ui-kit-specimen--wide"
      controls={(
        <>
          <UiKitTextControl label="Micro label" value={label} onChange={setLabel} placeholder="IT Planet" />
          <div className="ui-kit-control-grid">
            <UiKitSelectControl label="Tone" value={tone} onChange={setTone} options={mapMarkerToneOptions} />
            <UiKitSelectControl label="Size" value={size} onChange={setSize} options={mapMarkerSizeOptions} />
          </div>
          <UiKitSelectControl label="Cluster count" value={clusterCount} onChange={setClusterCount} options={mapMarkerCountOptions} />
        </>
      )}
      footer="The default marker height is 32px. Use the plain pin, the micro-label variant, and the cluster counter from one shared component."
    >
      <div className="ui-kit-map-marker-stage" data-testid="ui-kit-map-marker-preview">
        <div className="ui-kit-map-marker-stage__canvas">
          <div className="ui-kit-map-marker-stage__variant">
            <span className="ui-kit-map-marker-stage__label">Pin</span>
            <MapMarker tone={tone} size={size} ariaLabel="Plain map marker" />
          </div>

          <div className="ui-kit-map-marker-stage__variant">
            <span className="ui-kit-map-marker-stage__label">Pin + micro label</span>
            <MapMarker tone={tone} size={size} label={label || "IT Planet"} />
          </div>
        </div>

        <div className="ui-kit-map-marker-stage__rail">
          <span className="ui-kit-map-marker-stage__title">Palette</span>
          <MapMarker tone="orange" size={size} ariaLabel="Orange map marker" />
          <MapMarker tone="green" size={size} ariaLabel="Green map marker" />
          <MapMarker tone="blue" size={size} ariaLabel="Blue map marker" />
          <MapMarker variant="cluster" size={size} count={Number(clusterCount)} ariaLabel={`Cluster marker ${clusterCount}`} />
        </div>
      </div>
    </UiKitDemoCard>
  );
}

function OpportunityCatalogAssembly() {
  return (
    <Card className="ui-kit-assembly-card ui-kit-assembly-card--wide">
      <div className="ui-kit-foundation-card__copy">
        <span className="ui-kit-eyebrow">Assembly</span>
        <h3 className="ui-type-h3">Opportunities catalog blocks</h3>
        <p className="ui-type-body">Row card, featured recommendation, compact cards, and a shared content rail from the same module set.</p>
      </div>

      <div className="ui-kit-catalog-preview">
        <OpportunityRowCard
          data-testid="ui-kit-opportunity-row"
          item={opportunityShowcaseRow}
          primaryAction={{ label: "Связаться", variant: "secondary", href: "#row-opportunity" }}
          detailAction={{ label: "Откликнуться", variant: "secondary", href: "#row-opportunity" }}
        />

        <ContentRail data-testid="ui-kit-content-rail" ariaLabel="Opportunity rail showcase" itemWidth="360px">
          <OpportunityMiniCard
            data-testid="ui-kit-opportunity-mini-featured"
            variant="featured"
            item={opportunityShowcaseRail[0]}
            detailAction={{ label: "Подробнее", variant: "secondary", href: "#featured" }}
          />
          <OpportunityMiniCard
            data-testid="ui-kit-opportunity-mini-compact"
            variant="compact"
            item={opportunityShowcaseRail[1]}
            detailAction={{ label: "Подробнее", variant: "secondary", href: "#event" }}
          />
          <OpportunityMiniCard
            variant="compact"
            item={opportunityShowcaseRail[2]}
            detailAction={{ label: "Подробнее", variant: "secondary", href: "#internship" }}
          />
        </ContentRail>
        <div className="ui-kit-catalog-preview__blocks">
          <OpportunityBlockCard
            data-testid="ui-kit-opportunity-block-featured"
            item={opportunityShowcaseBlock}
            surface="panel"
            size="lg"
            detailAction={{ label: UI_KIT_DETAIL_LABEL, variant: "secondary", href: "#block-vacancy" }}
          />
        </div>
      </div>
    </Card>
  );
}

function OpportunitySliderAssembly() {
  return (
    <Card className="ui-kit-assembly-card ui-kit-assembly-card--wide">
      <div className="ui-kit-foundation-card__copy">
        <span className="ui-kit-eyebrow">Assembly</span>
        <h3 className="ui-type-h3">Opportunity block sliders</h3>
        <p className="ui-type-body">Three slider variants share the same block card: a steady medium rail, a width-led featured rail, and a raised featured rail with arrows and mouse drag.</p>
      </div>

      <div className="ui-kit-slider-showcase">
        <div className="ui-kit-slider-showcase__section">
          <div className="ui-kit-slider-showcase__copy">
            <strong>Uniform medium rail</strong>
            <p className="ui-type-body">Every item keeps the same medium footprint, which matches the homepage recommendation rows after the list view is collapsed into cards.</p>
          </div>

          <OpportunityBlockSlider
            data-testid="ui-kit-opportunity-slider-uniform"
            ariaLabel="Uniform opportunity block slider"
            items={opportunityShowcaseSliderItems}
            surface="plain"
            cardClassName="ui-kit-opportunity-slider__card"
            cardPropsBuilder={createUiKitSliderCardProps}
          />
        </div>

        <div className="ui-kit-slider-showcase__section">
          <div className="ui-kit-slider-showcase__copy">
            <strong>Leading featured rail</strong>
            <p className="ui-type-body">While you scroll, the card nearest to the left edge becomes the large block version. The rest stay medium, so only one item takes visual priority at a time.</p>
          </div>

          <OpportunityBlockSlider
            data-testid="ui-kit-opportunity-slider-featured"
            ariaLabel="Leading featured opportunity block slider"
            items={opportunityShowcaseSliderItems}
            variant="leading-featured"
            surface="plain"
            cardClassName="ui-kit-opportunity-slider__card"
            cardPropsBuilder={createUiKitSliderCardProps}
          />
        </div>

        <div className="ui-kit-slider-showcase__section">
          <div className="ui-kit-slider-showcase__copy">
            <strong>Raised featured rail</strong>
            <p className="ui-type-body">This variant removes the bottom scrollbar, moves with arrows or mouse drag, and lifts the active card both in width and height so it visually steps forward.</p>
          </div>

          <OpportunityBlockSlider
            data-testid="ui-kit-opportunity-slider-raised"
            ariaLabel="Raised featured opportunity block slider"
            items={opportunityShowcaseSliderItems}
            variant="raised-featured"
            surface="plain"
            cardClassName="ui-kit-opportunity-slider__card"
            cardPropsBuilder={createUiKitSliderCardProps}
          />
        </div>
      </div>
    </Card>
  );
}

function RecommendedOpportunitiesAssembly() {
  return (
    <Card className="ui-kit-assembly-card ui-kit-assembly-card--wide" data-testid="ui-kit-recommended-opportunities-assembly">
      <div className="ui-kit-foundation-card__copy">
        <span className="ui-kit-eyebrow">Assembly</span>
        <h3 className="ui-type-h3">Recommended opportunities rail</h3>
        <p className="ui-type-body">The candidate overview recommendation block is mirrored here as a reusable rail of panel-styled opportunity cards.</p>
      </div>

      <div className="ui-kit-recommended-opportunities">
        <SectionHeader
          eyebrow="Кабинет соискателя"
          title="Рекомендуемые возможности"
          description="Горизонтальный rail соискателя с тем же визуальным поведением карточек, что и на живой overview-странице."
          size="md"
        />

        <OpportunityBlockRail
          data-testid="ui-kit-recommended-opportunities-rail"
          ariaLabel="Recommended opportunities rail"
          items={recommendedOpportunityRailItems}
          surface="panel"
          size="md"
          cardPropsBuilder={(item) => ({
            detailAction: { href: `#${item.id}`, label: "Открыть каталог", variant: "secondary" },
          })}
        />
      </div>
    </Card>
  );
}

function CandidatePortfolioKitSection() {
  return (
    <UiKitSection
      id="ui-kit-candidate-portfolio"
      eyebrow="Candidate Portal"
      title="Resume & Portfolio"
      description="Live candidate-cabinet blocks extracted into the UI kit so resume and portfolio surfaces can be reviewed without opening the product flows."
    >
      <div className="ui-kit-candidate-grid">
        <Card className="ui-kit-specimen ui-kit-specimen--wide" data-testid="ui-kit-candidate-switcher">
          <div className="ui-kit-specimen__copy">
            <span className="ui-kit-eyebrow">Navigation</span>
            <h3 className="ui-type-h3">Portfolio switcher</h3>
            <p className="ui-type-body">The same segmented switcher used by the candidate pages, now isolated with local UI kit anchors.</p>
          </div>
          <CandidatePortfolioSwitcher value="resume" items={candidatePortfolioPreviewTabs} />
        </Card>

        <Card className="ui-kit-specimen" data-testid="ui-kit-candidate-resume-profile">
          <div className="ui-kit-specimen__copy">
            <span className="ui-kit-eyebrow">Resume block</span>
            <h3 className="ui-type-h3">Profile panel</h3>
            <p className="ui-type-body">Lead summary, skill tags, and one clear CTA stay bundled as a reusable resume surface.</p>
          </div>
          <CandidateResumeProfileCard
            description={candidateResumeProfilePreview.description}
            skills={candidateResumeProfilePreview.skills}
            actionHref="#ui-kit-candidate-resume-assembly"
          />
        </Card>

        <Card className="ui-kit-specimen" data-testid="ui-kit-candidate-resume-mini-card">
          <div className="ui-kit-specimen__copy">
            <span className="ui-kit-eyebrow">Resume block</span>
            <h3 className="ui-type-h3">Mini resume card</h3>
            <p className="ui-type-body">Compact summary for one saved resume with last edit date, weekly stats, and visibility state.</p>
          </div>
          <CandidateResumeMiniCard
            title={candidateResumeMiniPreview.title}
            updatedAt={candidateResumeMiniPreview.updatedAt}
            city={candidateResumeMiniPreview.city}
            experience={candidateResumeMiniPreview.experience}
            visibility={candidateResumeMiniPreview.visibility}
            stats={candidateResumeMiniPreview.stats}
            menuLabel="Открыть действия резюме"
          />
        </Card>

        <Card className="ui-kit-specimen" data-testid="ui-kit-candidate-resume-section">
          <div className="ui-kit-specimen__copy">
            <span className="ui-kit-eyebrow">Resume block</span>
            <h3 className="ui-type-h3">Section panel</h3>
            <p className="ui-type-body">Education and achievements reuse the same panel shell and compact record rows.</p>
          </div>
          <CandidateResumeSection
            title="Образование"
            emptyText="Образование еще не добавлено"
            items={candidateEducationPreview}
            renderItem={(item) => (
              <CandidateResumeRecord
                key={item.id}
                title={item.title}
                description={item.description}
                meta={item.meta}
              />
            )}
          />
        </Card>

        <Card className="ui-kit-specimen" data-testid="ui-kit-candidate-project-card">
          <div className="ui-kit-specimen__copy">
            <span className="ui-kit-eyebrow">Portfolio block</span>
            <h3 className="ui-type-h3">Project card</h3>
            <p className="ui-type-body">Project cards keep the same chip, status, and CTA structure between portfolio pages and editor previews.</p>
          </div>
          <CandidatePortfolioProjectCard item={candidatePortfolioPreviewProjects[0]} actionHref="#ui-kit-candidate-portfolio-assembly" />
        </Card>

        <Card className="ui-kit-assembly-card ui-kit-assembly-card--wide" data-testid="ui-kit-candidate-resume-assembly">
          <div className="ui-kit-foundation-card__copy">
            <span className="ui-kit-eyebrow">Assembly</span>
            <h3 className="ui-type-h3">Resume page assembly</h3>
            <p className="ui-type-body">The live resume page reconstructed from extracted blocks so layout, spacing, and content rhythm can be checked in one place.</p>
          </div>

          <div className="ui-kit-candidate-assembly">
            <CandidatePortfolioSwitcher value="resume" items={candidatePortfolioPreviewTabs} />
            <CandidateResumeProfileCard
              description={candidateResumeProfilePreview.description}
              skills={candidateResumeProfilePreview.skills}
              actionHref="#ui-kit-candidate-resume-assembly"
            />
            <div className="ui-kit-candidate-assembly__grid">
              <CandidateResumeSection
                title="Образование"
                emptyText="Образование еще не добавлено"
                items={candidateEducationPreview}
                renderItem={(item) => (
                  <CandidateResumeRecord
                    key={item.id}
                    title={item.title}
                    description={item.description}
                    meta={item.meta}
                  />
                )}
              />
              <CandidateResumeSection
                title="Достижения"
                emptyText="Достижения еще не добавлены"
                items={candidateAchievementPreview}
                renderItem={(item) => (
                  <CandidateResumeRecord
                    key={item.id}
                    title={item.title}
                    description={item.description}
                    meta={item.meta}
                  />
                )}
              />
            </div>
          </div>
        </Card>

        <Card className="ui-kit-assembly-card ui-kit-assembly-card--wide" data-testid="ui-kit-candidate-portfolio-assembly">
          <div className="ui-kit-foundation-card__copy">
            <span className="ui-kit-eyebrow">Assembly</span>
            <h3 className="ui-type-h3">Portfolio page assembly</h3>
            <p className="ui-type-body">Portfolio grid, page header, and project cards are now mirrored here as a reusable candidate-cabinet composition.</p>
          </div>

          <div className="ui-kit-candidate-assembly">
            <CandidatePortfolioSwitcher value="projects" items={candidatePortfolioPreviewTabs} />
            <CandidateSectionHeader
              title="Портфолио"
              description="Выложи кейсы, которые могут показать твои текущие навыки."
              actions={<Button href="#ui-kit-candidate-portfolio-assembly">Добавить проект</Button>}
            />
            <div className="candidate-page-grid candidate-page-grid--two">
              {candidatePortfolioPreviewProjects.map((item) => (
                <CandidatePortfolioProjectCard
                  key={item.id}
                  item={item}
                  actionHref="#ui-kit-candidate-portfolio-assembly"
                />
              ))}
            </div>
          </div>
        </Card>
      </div>
    </UiKitSection>
  );
}

function OpportunityDetailAssembly() {
  return (
    <Card className="ui-kit-assembly-card ui-kit-assembly-card--wide">
      <div className="ui-kit-foundation-card__copy">
        <span className="ui-kit-eyebrow">Assembly</span>
        <h3 className="ui-type-h3">Opportunity detail layout</h3>
        <p className="ui-type-body">Detail page composition reuses the same cards, buttons, avatar, tags, and mini cards as the catalog layer.</p>
      </div>

      <div className="ui-kit-detail-preview" data-testid="ui-kit-opportunity-detail-preview">
        <OpportunityDetailPreview />
      </div>
    </Card>
  );
}

function CompanyTilesAssembly() {
  return (
    <Card className="ui-kit-assembly-card">
      <div className="ui-kit-foundation-card__copy">
        <span className="ui-kit-eyebrow">Assembly</span>
        <h3 className="ui-type-h3">Company vacancy tiles</h3>
        <p className="ui-type-body">Aggregated city sections reuse one compact company tile with initials and vacancy counts.</p>
      </div>

      <div className="ui-kit-company-grid">
        <CompanyVacancyTile data-testid="ui-kit-company-tile" name="IGrids" count="20 вакансий" tone="lime" />
        <CompanyVacancyTile name="КейсСистемс" count="32 вакансии" initials="KS" tone="neutral" />
        <CompanyVacancyTile name="White Tiger Soft" count="8 вакансий" tone="neutral" />
      </div>
    </Card>
  );
}

function CompanyPortfolioAssembly() {
  return (
    <Card className="ui-kit-assembly-card ui-kit-assembly-card--wide" data-testid="ui-kit-company-portfolio-assembly">
      <div className="ui-kit-foundation-card__copy">
        <span className="ui-kit-eyebrow">Assembly</span>
        <h3 className="ui-type-h3">Company portfolio carousel</h3>
        <p className="ui-type-body">The same mini-project slider from the company cabinet is mirrored here for isolated review inside the UI kit.</p>
      </div>

      <div className="ui-kit-company-portfolio-preview">
        <CompanyPortfolioCarousel />
      </div>
    </Card>
  );
}

function CompanyPortfolioViewerAssembly() {
  return (
    <Card className="ui-kit-assembly-card ui-kit-assembly-card--wide" data-testid="ui-kit-company-portfolio-viewer-assembly">
      <div className="ui-kit-foundation-card__copy">
        <span className="ui-kit-eyebrow">Assembly</span>
        <h3 className="ui-type-h3">Company portfolio carousel, viewer mode</h3>
        <p className="ui-type-body">Public-facing version of the same carousel: users can browse projects, but the creation CTA is removed.</p>
      </div>

      <div className="ui-kit-company-portfolio-preview">
        <CompanyPortfolioCarousel mode="viewer" testId="company-profile-portfolio-slider-viewer" />
      </div>
    </Card>
  );
}

function OpportunitySidebarAssembly() {
  const [values, setValues] = useState(sidebarInitialValues);

  const updateValue = (field, value) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const resetSection = (section) => {
    setValues((current) => {
      switch (section) {
        case "city":
          return { ...current, city: "" };
        case "income":
          return { ...current, incomeFrom: "", payoutPeriod: "" };
        case "specialization":
          return { ...current, specialization: "" };
        case "employmentTypes":
          return { ...current, employmentTypes: [] };
        case "education":
          return { ...current, education: [] };
        default:
          return current;
      }
    });
  };

  return (
    <Card className="ui-kit-assembly-card">
      <div className="ui-kit-foundation-card__copy">
        <span className="ui-kit-eyebrow">Assembly</span>
        <h3 className="ui-type-h3">Opportunity filter sidebar</h3>
        <p className="ui-type-body">Sidebar composition is reusable at the opportunity layer and only consumes shared primitives plus data options.</p>
      </div>

      <OpportunityFilterSidebar
        data-testid="ui-kit-filter-sidebar"
        values={values}
        options={sidebarOptions}
        disabledSections={{ income: true, payout: true, education: true }}
        onChange={updateValue}
        onResetSection={resetSection}
        onResetAll={() => setValues(sidebarInitialValues)}
      />
    </Card>
  );
}

function TextareaPlayground() {
  const [value, setValue] = useState("Short summary about the candidate, team, or publication.");
  const [showCount, setShowCount] = useState(true);
  const [disabled, setDisabled] = useState(false);

  return (
    <UiKitDemoCard
      eyebrow="Primitive"
      title="Textarea"
      description="Long-form content keeps the same spacing and helper behavior as the rest of the form system."
      controls={
        <>
          <UiKitTextControl label="Value" value={value} onChange={setValue} placeholder="Textarea value" />
          <div className="ui-kit-toggle-grid">
            <UiKitToggleControl label="Show count" checked={showCount} onChange={setShowCount} />
            <UiKitToggleControl label="Disabled" checked={disabled} onChange={setDisabled} />
          </div>
        </>
      }
    >
      <FormField label="About" hint="Auto-resize and counters are built into the primitive.">
        <Textarea
          value={value}
          onValueChange={setValue}
          autoResize
          rows={4}
          maxLength={160}
          showCount={showCount}
          disabled={disabled}
        />
      </FormField>
    </UiKitDemoCard>
  );
}

function SelectPlayground() {
  const [value, setValue] = useState("design");
  const [clearable, setClearable] = useState(false);
  const [disabled, setDisabled] = useState(false);

  return (
    <UiKitDemoCard
      eyebrow="Primitive"
      title="Select"
      description="Shared dropdown behavior means feature screens stop rebuilding custom filter and picker shells."
      controls={
        <div className="ui-kit-toggle-grid">
          <UiKitToggleControl label="Clearable" checked={clearable} onChange={setClearable} />
          <UiKitToggleControl label="Disabled" checked={disabled} onChange={setDisabled} />
        </div>
      }
    >
      <FormField label="Track" hint="Same wrapper and helper system as other inputs.">
        <Select
          value={value}
          onValueChange={setValue}
          options={selectOptions}
          clearable={clearable}
          disabled={disabled}
        />
      </FormField>
    </UiKitDemoCard>
  );
}

function ChoiceControlsPlayground() {
  const radioName = useId();
  const [accept, setAccept] = useState(true);
  const [contactMode, setContactMode] = useState("email");
  const [publicStatus, setPublicStatus] = useState(true);

  return (
    <UiKitDemoCard
      eyebrow="Primitive"
      title="Choice Controls"
      description="Checkbox, radio, and switch stay visually aligned and accessible across flows."
      controls={<p className="ui-type-caption">These controls are fully interactive inside the preview.</p>}
    >
      <div className="ui-kit-choice-stack">
        <Checkbox checked={accept} onChange={(event) => setAccept(event.target.checked)} label="Accept platform rules" hint="Required for account setup." />
        <Radio
          name={radioName}
          value="email"
          checked={contactMode === "email"}
          onChange={() => setContactMode("email")}
          label="Email contact"
          hint="Default outreach channel."
        />
        <Radio
          name={radioName}
          value="telegram"
          checked={contactMode === "telegram"}
          onChange={() => setContactMode("telegram")}
          label="Telegram contact"
          hint="Alternative channel."
        />
        <Switch
          checked={publicStatus}
          onChange={(event) => setPublicStatus(event.target.checked)}
          label="Public profile"
          hint="Show that the profile is open to offers."
        />
      </div>
    </UiKitDemoCard>
  );
}

function SegmentedControlPlayground() {
  const [value, setValue] = useState("portfolio");
  const [size, setSize] = useState("md");
  const [stretch, setStretch] = useState(false);

  return (
    <UiKitDemoCard
      eyebrow="Navigation"
      title="Segmented Control"
      description="Shared switcher for mutually exclusive modes like resume and portfolio, without page-specific layout code."
      footer="Exported from shared/ui and ready for reuse in candidate, company, or moderator screens."
      controls={
        <>
          <div className="ui-kit-control-grid">
            <UiKitSelectControl label="Active item" value={value} onChange={setValue} options={segmentOptions} />
            <UiKitSelectControl
              label="Size"
              value={size}
              onChange={setSize}
              options={[
                { value: "md", label: "md" },
                { value: "lg", label: "lg" },
              ]}
            />
          </div>
          <div className="ui-kit-toggle-grid">
            <UiKitToggleControl label="Stretch" checked={stretch} onChange={setStretch} />
          </div>
        </>
      }
    >
      <div className="ui-kit-segmented-stack">
        <div className="ui-kit-segmented-frame">
          <SegmentedControl
            data-testid="ui-kit-segmented-preview"
            items={segmentOptions}
            value={value}
            onChange={setValue}
            stretch={stretch}
            size={size}
            ariaLabel="Переключатель между резюме и портфолио"
            className="ui-kit-segmented-preview"
          />
        </div>

        <div className="ui-kit-segmented-variants">
          <div className="ui-kit-segmented-state">
            <span className="ui-kit-segmented-state__label">Active left</span>
            <SegmentedControl items={segmentOptions} value="resume" size="md" ariaLabel="Пример с активным резюме" stretch />
          </div>
          <div className="ui-kit-segmented-state">
            <span className="ui-kit-segmented-state__label">Active right</span>
            <SegmentedControl items={segmentOptions} value="portfolio" size="md" ariaLabel="Пример с активным портфолио" stretch />
          </div>
        </div>
      </div>
    </UiKitDemoCard>
  );
}

function FormFieldPlayground() {
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [required, setRequired] = useState(true);
  const [value, setValue] = useState("");

  const hint = error
    ? "This field is required."
    : success
      ? "Looks good."
      : "One wrapper should handle labels, hints, and validation states.";

  return (
    <UiKitDemoCard
      eyebrow="Wrapper"
      title="FormField"
      description="Use one wrapper for labels, helper text, errors, and inline metadata."
      controls={
        <div className="ui-kit-toggle-grid">
          <UiKitToggleControl label="Error" checked={error} onChange={setError} />
          <UiKitToggleControl label="Success" checked={success} onChange={setSuccess} />
          <UiKitToggleControl label="Required" checked={required} onChange={setRequired} />
        </div>
      }
    >
      <FormField label="Company name" required={required} error={error ? hint : ""} hint={!error ? hint : ""} success={success}>
        <Input value={value} onValueChange={setValue} placeholder="Acme Labs" />
      </FormField>
    </UiKitDemoCard>
  );
}

function PlaceholderPlayground() {
  return (
    <div className="ui-kit-placeholder-grid">
      <PlaceholderBlock
        data-testid="ui-kit-placeholder-block"
        eyebrow="Shared scaffold"
        title="Placeholder Block"
        description="Use one shared scaffold for unfinished cabinet modules and routed placeholder sections."
        action={(
          <PlaceholderAction
            data-testid="ui-kit-placeholder-action"
            label="Placeholder action"
            description="Future button or inline control should replace this shared stub."
          />
        )}
      >
        <div className="ui-kit-placeholder-surface">
          <p className="ui-type-body">Nested scaffold content stays inside the same shared placeholder primitive.</p>
        </div>
      </PlaceholderBlock>

      <Card className="ui-kit-placeholder-card">
        <div className="ui-kit-foundation-card__copy">
          <span className="ui-kit-eyebrow">Shared action stub</span>
          <h3 className="ui-type-h3">Placeholder Action</h3>
          <p className="ui-type-body">Standalone action placeholder for missing controls, buttons, or inline commands.</p>
        </div>
        <PlaceholderAction
          label="Shared action placeholder"
          description="Replace this with the final primitive once the action enters the design system."
        />
      </Card>

      <PlaceholderMedia
        data-testid="ui-kit-placeholder-media"
        eyebrow="Media scaffold"
        title="Placeholder Media"
        description="Uploaders, cover slots, and future galleries should pass through one shared placeholder surface."
        actionLabel="Media placeholder"
        actionDescription="The final uploader or gallery trigger will replace this block."
      >
        <span className="ui-kit-placeholder-chip">Future uploader / gallery</span>
      </PlaceholderMedia>
    </div>
  );
}

function LoginAssembly() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: true,
  });

  return (
    <Card className="ui-kit-assembly-card">
      <div className="ui-kit-foundation-card__copy">
        <span className="ui-kit-eyebrow">Assembly</span>
        <h3 className="ui-type-h3">Login</h3>
        <p className="ui-type-body">Compact auth composition built only from shared primitives.</p>
      </div>
      <form className="ui-kit-form-stack" onSubmit={(event) => event.preventDefault()}>
        <FormField label="Email" required>
          <Input value={form.email} onValueChange={(email) => setForm((current) => ({ ...current, email }))} placeholder="you@tramplin.ru" />
        </FormField>
        <FormField label="Password" required>
          <Input
            type="password"
            value={form.password}
            onValueChange={(password) => setForm((current) => ({ ...current, password }))}
            revealable
            placeholder="Enter password"
          />
        </FormField>
        <Checkbox
          checked={form.remember}
          onChange={(event) => setForm((current) => ({ ...current, remember: event.target.checked }))}
          label="Remember me"
          hint="Session stays active on the next visit."
        />
        <div className="ui-kit-form-actions">
          <Button type="submit">Sign in</Button>
          <Button type="button" variant="secondary">
            Reset password
          </Button>
        </div>
      </form>
    </Card>
  );
}

function RegistrationAssembly() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    track: "design",
    bio: "",
    agree: false,
  });

  return (
    <Card className="ui-kit-assembly-card">
      <div className="ui-kit-foundation-card__copy">
        <span className="ui-kit-eyebrow">Assembly</span>
        <h3 className="ui-type-h3">Candidate registration</h3>
        <p className="ui-type-body">Reusable onboarding layout with field wrappers and shared controls.</p>
      </div>
      <form className="ui-kit-form-stack" onSubmit={(event) => event.preventDefault()}>
        <FormField label="Full name" required>
          <Input value={form.name} onValueChange={(name) => setForm((current) => ({ ...current, name }))} placeholder="Anna Kovaleva" />
        </FormField>
        <FormField label="Email" required>
          <Input value={form.email} onValueChange={(email) => setForm((current) => ({ ...current, email }))} placeholder="hello@tramplin.ru" />
        </FormField>
        <FormField label="Track">
          <Select value={form.track} onValueChange={(track) => setForm((current) => ({ ...current, track }))} options={selectOptions} />
        </FormField>
        <FormField label="About">
          <Textarea value={form.bio} onValueChange={(bio) => setForm((current) => ({ ...current, bio }))} autoResize rows={4} showCount maxLength={160} />
        </FormField>
        <Checkbox
          checked={form.agree}
          onChange={(event) => setForm((current) => ({ ...current, agree: event.target.checked }))}
          label="I agree with the platform rules"
          hint="Shared consent control."
        />
        <div className="ui-kit-form-actions">
          <Button type="submit">Create profile</Button>
        </div>
      </form>
    </Card>
  );
}

function PreferencesAssembly() {
  const [form, setForm] = useState({
    publicStatus: true,
    telegramAlerts: false,
    format: "hybrid",
  });

  return (
    <Card className="ui-kit-assembly-card">
      <div className="ui-kit-foundation-card__copy">
        <span className="ui-kit-eyebrow">Assembly</span>
        <h3 className="ui-type-h3">Preferences</h3>
        <p className="ui-type-body">Small settings layout for account preferences and visibility controls.</p>
      </div>
      <form className="ui-kit-form-stack" onSubmit={(event) => event.preventDefault()}>
        <Switch
          checked={form.publicStatus}
          onChange={(event) => setForm((current) => ({ ...current, publicStatus: event.target.checked }))}
          label="Public profile"
          hint="Show that the profile is open to offers."
        />
        <Checkbox
          checked={form.telegramAlerts}
          onChange={(event) => setForm((current) => ({ ...current, telegramAlerts: event.target.checked }))}
          label="Telegram alerts"
          hint="Optional notification channel."
        />
        <FormField label="Preferred work format">
          <Select value={form.format} onValueChange={(format) => setForm((current) => ({ ...current, format }))} options={formatOptions} />
        </FormField>
        <div className="ui-kit-form-actions">
          <Button type="submit">Save preferences</Button>
          <Button type="button" variant="secondary">
            Reset
          </Button>
        </div>
      </form>
    </Card>
  );
}

function SettingsSectionAssembly() {
  const [isOpen, setIsOpen] = useState(true);
  const [form, setForm] = useState({
    phone: "+7 927 563 89 41",
    visibility: "employers-and-contacts",
    notifications: true,
  });

  return (
    <div className="ui-kit-settings-assembly" data-testid="ui-kit-settings-section">
      <SettingsSectionCard
        id="ui-kit-settings-section-card"
        eyebrow="Assembly"
        title="Settings section card"
        summary="Reusable collapsible surface for dense account settings, profile forms, and preference groups."
        status="Ready for shared use"
        statusTone="success"
        actionLabel="Open section"
        isOpen={isOpen}
        onToggle={() => setIsOpen((current) => !current)}
      >
        <form className="ui-kit-form-stack" onSubmit={(event) => event.preventDefault()}>
          <p className="ui-type-body">
            Use one shared accordion card when the collapsed state needs a short summary and the expanded state opens a full form.
          </p>
          <FormField label="Phone">
            <Input value={form.phone} onValueChange={(phone) => setForm((current) => ({ ...current, phone }))} />
          </FormField>
          <FormField label="Profile visibility">
            <Select
              value={form.visibility}
              onValueChange={(visibility) => setForm((current) => ({ ...current, visibility }))}
              options={settingsVisibilityOptions}
            />
          </FormField>
          <Switch
            checked={form.notifications}
            onChange={(event) => setForm((current) => ({ ...current, notifications: event.target.checked }))}
            label="Notifications"
            hint="The body can mix fields, switches, helper copy, and actions."
          />
          <div className="ui-kit-form-actions">
            <Button type="submit">Save section</Button>
          </div>
        </form>
      </SettingsSectionCard>
    </div>
  );
}

function EditableResumeField({ label, title, subtitle, active = false, compact = false, testId }) {
  return (
    <div className="ui-kit-editable-field">
      <span className="ui-kit-editable-field__label">{label}</span>
      <div
        className={`ui-kit-editable-field__card${active ? " is-active" : ""}${compact ? " is-compact" : ""}`}
        data-testid={testId}
      >
        <div className="ui-kit-editable-field__copy">
          <strong>{title}</strong>
          {subtitle ? <span>{subtitle}</span> : null}
        </div>
        <button type="button" className="ui-kit-editable-field__action" aria-label={`Редактировать раздел ${label}`}>
          <PencilIcon />
        </button>
      </div>
    </div>
  );
}

function EditableResumeAssembly() {
  return (
    <Card className="ui-kit-assembly-card">
      <div className="ui-kit-foundation-card__copy">
        <span className="ui-kit-eyebrow">Assembly</span>
        <h3 className="ui-type-h3">Editable resume snippets</h3>
        <p className="ui-type-body">Collapsed read-only fields with a clear selected state before inline editing opens.</p>
      </div>

      <div className="ui-kit-editable-field-showcase" data-testid="ui-kit-editable-summary">
        <div className="ui-kit-editable-field-showcase__pair">
          <EditableResumeField
            label="Образование"
            title="ЧГУ им. И. Н. Ульянова"
            subtitle="Среднее"
            testId="ui-kit-editable-card-default"
          />
          <EditableResumeField
            label="Образование"
            title="ЧГУ им. И. Н. Ульянова"
            subtitle="Среднее"
            active
            testId="ui-kit-editable-card-active"
          />
        </div>

        <EditableResumeField label="О себе" title="Дополнительная информация" compact testId="ui-kit-editable-card-compact" />
      </div>
    </Card>
  );
}

function CareerDashboardAssembly() {
  const mentorFilters = [
    "Построить карьерный план",
    "Создать полное резюме",
    "Проработать стратегию развития",
    "Подготовиться к собеседованию",
    "Справиться с выгоранием",
  ];

  return (
    <Card className="ui-kit-assembly-card ui-kit-assembly-card--wide" data-testid="ui-kit-career-assembly">
      <div className="ui-kit-foundation-card__copy">
        <span className="ui-kit-eyebrow">Career</span>
        <h3 className="ui-type-h3">Career dashboard assembly</h3>
        <p className="ui-type-body">The full career page structure rebuilt from shared career cards, panels, pills, and existing section headers.</p>
      </div>

      <div className="ui-kit-career-dashboard-preview">
        <SectionHeader
          eyebrow="Карьерные возможности"
          title="Карьера"
          description="Не знаешь куда двигаться? Тогда этот блок именно для тебя. Получи свою траекторию развития для усиления навыков и перехода к следующей цели."
          className="ui-kit-career-dashboard-preview__intro"
        />

        <div className="ui-kit-career-dashboard-preview__top-grid">
          <CareerStatsPanel {...careerStatsPanelMock} />
          <CareerSkillsPanel {...careerSkillsPanelMock} />
          <CareerSalaryPanel {...careerSalaryPanelMock} />
        </div>

        <div className="ui-kit-career-dashboard-preview__section">
          <SectionHeader
            title="Курсы по навыкам"
            size="md"
            actions={<a href="#career-courses-all" className="ui-kit-career-dashboard-preview__link">Все курсы →</a>}
          />
          <div className="ui-kit-career-dashboard-preview__grid ui-kit-career-dashboard-preview__grid--courses">
            {careerCourseCardsMock.map((course) => (
              <CareerCourseCard key={course.href} {...course} />
            ))}
          </div>
        </div>

        <div className="ui-kit-career-dashboard-preview__section">
          <SectionHeader
            title="Пройди стажировку и совершенствуй свои навыки"
            size="md"
            actions={<a href="#career-opportunities-all" className="ui-kit-career-dashboard-preview__link">Все возможности →</a>}
          />
          <div className="ui-kit-career-dashboard-preview__grid ui-kit-career-dashboard-preview__grid--opportunities">
            {careerOpportunityCardsMock.map((item, index) => (
              <CareerOpportunityCard key={item.href} featured={index === 0} {...item} />
            ))}
          </div>
        </div>

        <div className="ui-kit-career-dashboard-preview__section">
          <SectionHeader
            title="Есть вопросы? Обратись к нашим менторам!"
            size="md"
            actions={<a href="#career-mentors-all" className="ui-kit-career-dashboard-preview__link">Все менторы →</a>}
          />
          <div className="ui-kit-career-dashboard-preview__filters">
            {mentorFilters.map((filter, index) => (
              <FilterPill key={filter} active={index === 0}>
                {filter}
              </FilterPill>
            ))}
          </div>
          <div className="ui-kit-career-dashboard-preview__grid ui-kit-career-dashboard-preview__grid--mentors">
            {careerMentorCardsMock.map((mentor) => (
              <CareerMentorCard key={mentor.href} {...mentor} />
            ))}
          </div>
        </div>

        <div className="ui-kit-career-dashboard-preview__section">
          <SectionHeader
            title="У вас есть общие интересы"
            description="Вы можете найти единомышленников и погрузиться в профессиональную среду. Работайте над проектами совместно и развивайте не только профильные навыки."
            size="md"
            actions={<a href="#career-peers-all" className="ui-kit-career-dashboard-preview__link">Найти единомышленников →</a>}
          />
          <div className="ui-kit-career-dashboard-preview__peer-grid">
            {careerPeerCardsMock.map((contact) => (
              <CareerPeerCard key={contact.href} {...contact} />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function ModeratorDashboardAssembly() {
  return (
    <Card className="ui-kit-assembly-card ui-kit-assembly-card--wide" data-testid="ui-kit-dashboard-assembly">
      <div className="ui-kit-foundation-card__copy">
        <span className="ui-kit-eyebrow">Assembly</span>
        <h3 className="ui-type-h3">Moderator dashboard surfaces</h3>
        <p className="ui-type-body">Shared page header, section header, activity cards, focus cards, and queue cards used by the moderator cabinet.</p>
      </div>

      <div className="ui-kit-dashboard-assembly">
        <DashboardPageHeader
          title="Дашборд модерации"
          description="Общий список последних откликов по вакансиям и событиям с быстрым контекстом по статусу, роли и способу связи."
        />

        <div className="ui-kit-dashboard-assembly__grid">
          <div className="ui-kit-dashboard-assembly__surface">
            <DashboardSectionHeader
              eyebrow="Активность"
              title="Последние действия"
              description="Здесь представлены последние изменения, которые нуждаются в проверке."
            />

            <div className="ui-kit-dashboard-assembly__stack">
              <DashboardActivityCard
                badge="Возможность"
                timestamp="19 марта · 11:20"
                title="Создана вакансия Signal Hub"
                description="Компания отправила на проверку стажировку в продуктовой аналитике."
              />
              <DashboardActivityCard
                badge="Компания"
                timestamp="19 марта · 11:20"
                title="Профиль компании обновлён"
                description="Cloud Orbit HR изменил описание команды и контактное лицо."
              />
            </div>
          </div>

          <div className="ui-kit-dashboard-assembly__rail">
            <DashboardSectionHeader
              eyebrow="Фокус"
              title="Сводка смены"
              description="Здесь представлены незавершённые задачи, которые остаются в работе."
            />

            <div className="ui-kit-dashboard-assembly__stack">
              <DashboardFocusCard
                title="Возможности на проверке"
                description="В очереди приоритетные вакансии и стажировки."
                countLabel="4 в работе"
              />
              <DashboardFocusCard
                title="Компании на верификации"
                description="Проверяем сайт, домен и документы."
                countLabel="4 в работе"
              />
              <DashboardFocusCard
                title="Жалобы по объектам"
                description="Повторяющиеся репорты собраны в единые кейсы."
                countLabel="6 в работе"
              />
            </div>
          </div>
        </div>

        <div className="ui-kit-dashboard-assembly__surface">
          <DashboardSectionHeader
            eyebrow="Приоритет"
            title="Очередь задач"
            description="Проверьте заявки, отправленные на модерацию."
            counter={16}
          />

          <div className="ui-kit-dashboard-assembly__stack">
            <DashboardQueueCard
              badge="Жалоба"
              dateLabel="19 марта 2026"
              title="Junior Security Analyst"
              description="Недостоверная зарплата: 6 жалоб"
              actionHref="#ui-kit-assemblies"
              actionLabel="Подробнее"
              actionVariant="secondary"
            />
            <DashboardQueueCard
              badge="Вакансия"
              dateLabel="19 марта 2026"
              title="DevRel Assistant"
              description="Трамплин Platform · Высокий приоритет"
              actionHref="#ui-kit-assemblies"
              actionLabel="Подробнее"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function UiKitApp() {
  useEffect(() => {
    document.body.classList.add(UI_KIT_BODY_CLASS);

    return () => {
      document.body.classList.remove(UI_KIT_BODY_CLASS);
    };
  }, []);

  return (
    <main className="ui-kit-body" data-testid="ui-kit-page">
      <div className="ui-kit-page ui-page-shell">
        <Card className="ui-kit-hero">
          <div className="ui-kit-hero__copy">
            <span className="ui-kit-eyebrow">Shared foundation</span>
            <h1 className="ui-type-display">UI Kit Playground</h1>
            <p className="ui-type-body-lg">
              One page for shared tokens, primitives, field wrappers, and composed forms. Change the foundation once and verify it here before
              touching product screens.
            </p>
          </div>
          <div className="ui-kit-hero__meta">
            <span className="ui-kit-note">Route: /ui-kit</span>
            <span className="ui-kit-note">Dev-only</span>
            <span className="ui-kit-note">Single stylesheet</span>
          </div>
        </Card>

        <nav className="ui-kit-nav" aria-label="UI kit navigation">
          {sectionLinks.map((section) => (
            <Button key={section.id} as="a" href={`#${section.id}`} size="sm" variant="secondary">
              {section.label}
            </Button>
          ))}
        </nav>

        <UiKitSection
          id="ui-kit-foundation"
          eyebrow="Foundation"
          title="Foundation"
          description="Core tokens and shared visual language used by the rest of the frontend."
        >
          <div className="ui-kit-foundation-grid">
            <UiKitFoundationCard title="Colors" description="The shared palette for surfaces, text, accents, and status states.">
              <div className="ui-kit-token-grid">
                {colorTokens.map((item) => (
                  <div key={item.token} className="ui-kit-token">
                    <span className="ui-kit-token__swatch" style={{ backgroundColor: item.value }} aria-hidden="true" />
                    <div className="ui-kit-token__meta">
                      <strong>{item.label}</strong>
                      <code>{item.token}</code>
                      <span>{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </UiKitFoundationCard>

            <UiKitFoundationCard title="Typography" description="Semantic scale utilities generated from the shared type configuration.">
              <div className="ui-kit-scale-list">
                {typographyRows.map((row) => (
                  <div key={row.utility} className="ui-kit-scale-row">
                    <div className="ui-kit-scale-row__meta">
                      <strong>{row.tag}</strong>
                      <code>{row.utility}</code>
                    </div>
                    <span className={row.className}>The quick brown fox jumps over the lazy dog.</span>
                  </div>
                ))}
              </div>
            </UiKitFoundationCard>

            <UiKitFoundationCard title="Font" description="One font family keeps the system consistent across pages and UI primitives.">
              <div className="ui-kit-foundation-stack">
                <code>--ui-font-family-base</code>
                <p className="ui-type-body ui-color-text-primary">Manrope, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif</p>
                <p className="ui-type-h2">Aa Bb Cc 012345</p>
              </div>
            </UiKitFoundationCard>

            <UiKitFoundationCard title="Spacing" description="Shared spacing steps used in cards, forms, and layouts.">
              <div className="ui-kit-stack-list">
                {spacingTokens.map(([label, token, value]) => (
                  <div key={token} className="ui-kit-stack-row">
                    <div className="ui-kit-stack-row__meta">
                      <strong>{label}</strong>
                      <code>{token}</code>
                    </div>
                    <div className="ui-kit-stack-row__bar">
                      <span style={{ width: value }} />
                    </div>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </UiKitFoundationCard>

            <UiKitFoundationCard title="Radii" description="Corners are tokenized so surfaces and controls stay visually related.">
              <div className="ui-kit-radius-grid">
                {radiusTokens.map(([label, token, value]) => (
                  <div key={token} className="ui-kit-radius-card">
                    <div className="ui-kit-radius-card__preview" style={{ borderRadius: `var(${token})` }} />
                    <div className="ui-kit-token__meta">
                      <strong>{label}</strong>
                      <code>{token}</code>
                      <span>{value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </UiKitFoundationCard>

            <UiKitFoundationCard title="Shadows" description="Elevation tokens are reused by cards, buttons, and accent surfaces.">
              <div className="ui-kit-shadow-grid">
                {shadowTokens.map(([label, token]) => (
                  <div key={token} className="ui-kit-shadow-card">
                    <div className="ui-kit-shadow-card__preview" style={{ boxShadow: `var(${token})` }} />
                    <div className="ui-kit-token__meta">
                      <strong>{label}</strong>
                      <code>{token}</code>
                    </div>
                  </div>
                ))}
              </div>
            </UiKitFoundationCard>

            <UiKitFoundationCard title="Surfaces" description="Background and surface combinations used for layouts, elevated cards, and accents.">
              <div className="ui-kit-surface-grid">
                <div className="ui-kit-surface-card ui-kit-surface-card--default">
                  <strong>Default surface</strong>
                  <span>var(--ui-color-surface-strong)</span>
                </div>
                <div className="ui-kit-surface-card ui-kit-surface-card--muted">
                  <strong>Muted surface</strong>
                  <span>var(--ui-color-surface-muted)</span>
                </div>
                <div className="ui-kit-surface-card ui-kit-surface-card--accent">
                  <strong>Accent surface</strong>
                  <span>var(--ui-color-surface-accent)</span>
                </div>
              </div>
            </UiKitFoundationCard>
          </div>
        </UiKitSection>

        <UiKitSection
          id="ui-kit-buttons"
          eyebrow="Primitives"
          title="Buttons"
          description="Shared action styles used by auth, dashboards, and page-level flows."
        >
          <div className="ui-kit-demo-grid">
            <ButtonPlayground />
            <PillButtonPlayground />
          </div>
        </UiKitSection>

        <UiKitSection
          id="ui-kit-map-markers"
          eyebrow="Primitives"
          title="Map"
          description="Map pins, label-ready variants, and compact cluster counters for the discovery canvas."
        >
          <MapMarkerPlayground />
        </UiKitSection>

        <UiKitSection
          id="ui-kit-actions"
          eyebrow="Action System"
          title="Actions"
          description="Administrative and row-level controls where the selected action itself can be neutral or destructive."
        >
          <div className="ui-kit-demo-grid">
            <ActionSelectPlayground />
            <ConfirmActionSelectPlayground />
            <ModerationActionDialogPlayground />
          </div>
        </UiKitSection>

        <UiKitSection
          id="ui-kit-complaints"
          eyebrow="Moderation"
          title="Complaint Card"
          description="Shared complaint card for curator queues, grouped reports, and route-backed moderation lists."
        >
          <ComplaintCardPlayground />
        </UiKitSection>

        <UiKitSection
          id="ui-kit-form-controls"
          eyebrow="Primitives"
          title="Form Controls"
          description="Reusable controls that should stay independent from page structure and product-specific layouts."
        >
          <div className="ui-kit-demo-grid">
            <SearchInputPlayground />
            <InputPlayground />
            <TextareaPlayground />
            <SelectPlayground />
            <ChoiceControlsPlayground />
          </div>
        </UiKitSection>

        <UiKitSection
          id="ui-kit-navigation"
          eyebrow="Navigation"
          title="Navigation"
          description="Mode switches and segmented selectors that move between mutually exclusive states without rebuilding the shell."
        >
          <SegmentedControlPlayground />
        </UiKitSection>

        <UiKitSection
          id="ui-kit-form-field"
          eyebrow="Wrapper"
          title="FormField"
          description="The wrapper that keeps labels, helper text, and validation states consistent."
        >
          <FormFieldPlayground />
        </UiKitSection>

        <UiKitSection
          id="ui-kit-placeholders"
          eyebrow="Scaffolds"
          title="Placeholders"
          description="Shared placeholder primitives used by unfinished cabinet sections, media slots, and action stubs."
        >
          <PlaceholderPlayground />
        </UiKitSection>

        <UiKitSection
          id="ui-kit-career"
          eyebrow="Career"
          title="Career"
          description="Shared career-specific assemblies extracted from the live career page and mirrored here as reusable UI kit specimens."
        >
          <div className="ui-kit-career-grid">
            <Card className="ui-kit-specimen" data-testid="ui-kit-career-stats-panel">
              <div className="ui-kit-specimen__copy">
                <span className="ui-kit-eyebrow">Career panel</span>
                <h3 className="ui-type-h3">Stats panel</h3>
                <p className="ui-type-body">Profile state, compact metrics, and one clear CTA in the same shared surface.</p>
              </div>
              <div className="ui-kit-career-preview">
                <CareerStatsPanel {...careerStatsPanelMock} />
              </div>
            </Card>

            <Card className="ui-kit-specimen" data-testid="ui-kit-career-skills-panel">
              <div className="ui-kit-specimen__copy">
                <span className="ui-kit-eyebrow">Career panel</span>
                <h3 className="ui-type-h3">Skills panel</h3>
                <p className="ui-type-body">Primary and suggested skill pills stay in the shared system without local page markup.</p>
              </div>
              <div className="ui-kit-career-preview">
                <CareerSkillsPanel {...careerSkillsPanelMock} />
              </div>
            </Card>

            <Card className="ui-kit-specimen" data-testid="ui-kit-career-salary-panel">
              <div className="ui-kit-specimen__copy">
                <span className="ui-kit-eyebrow">Career panel</span>
                <h3 className="ui-type-h3">Salary panel</h3>
                <p className="ui-type-body">Compact salary progression with the shared progress track and accent hierarchy.</p>
              </div>
              <div className="ui-kit-career-preview">
                <CareerSalaryPanel {...careerSalaryPanelMock} />
              </div>
            </Card>

            <Card className="ui-kit-specimen" data-testid="ui-kit-career-course-card">
              <div className="ui-kit-specimen__copy">
                <span className="ui-kit-eyebrow">Career card</span>
                <h3 className="ui-type-h3">Course card</h3>
                <p className="ui-type-body">Reference element from the attached screenshots, now exposed as a reusable shared card.</p>
              </div>
              <div className="ui-kit-career-preview">
                <CareerCourseCard {...careerCourseCardMock} />
              </div>
            </Card>

            <Card className="ui-kit-specimen" data-testid="ui-kit-career-opportunity-card">
              <div className="ui-kit-specimen__copy">
                <span className="ui-kit-eyebrow">Career card</span>
                <h3 className="ui-type-h3">Opportunity card</h3>
                <p className="ui-type-body">Internships and recommendations keep the same shared save action, chips, and full-width CTA.</p>
              </div>
              <div className="ui-kit-career-preview">
                <CareerOpportunityCard featured {...careerOpportunityCardMock} />
              </div>
            </Card>

            <Card className="ui-kit-specimen" data-testid="ui-kit-career-mentor-card">
              <div className="ui-kit-specimen__copy">
                <span className="ui-kit-eyebrow">Career card</span>
                <h3 className="ui-type-h3">Mentor card</h3>
                <p className="ui-type-body">Mentor presentation supports image or avatar fallback but stays under the same body-scale typography cap.</p>
              </div>
              <div className="ui-kit-career-preview">
                <CareerMentorCard {...careerMentorCardMock} />
              </div>
            </Card>

            <Card className="ui-kit-specimen" data-testid="ui-kit-career-peer-card">
              <div className="ui-kit-specimen__copy">
                <span className="ui-kit-eyebrow">Career card</span>
                <h3 className="ui-type-h3">Peer card</h3>
                <p className="ui-type-body">Compact shared-interests card from the attached reference, extracted into the shared UI layer.</p>
              </div>
              <div className="ui-kit-career-preview">
                <CareerPeerCard {...careerPeerCardMock} />
              </div>
            </Card>
          </div>

          <CareerDashboardAssembly />
        </UiKitSection>

        <CandidatePortfolioKitSection />

        <UiKitSection
          id="ui-kit-assemblies"
          eyebrow="Assemblies"
          title="Assemblies"
          description="Reference layouts composed entirely from shared primitives and reusable opportunity widgets."
        >
          <div className="ui-kit-assembly-grid">
            <ModeratorDashboardAssembly />
            <LoginAssembly />
            <RegistrationAssembly />
            <PreferencesAssembly />
            <SettingsSectionAssembly />
            <EditableResumeAssembly />
            <OpportunityCatalogAssembly />
            <OpportunitySliderAssembly />
            <RecommendedOpportunitiesAssembly />
            <OpportunityDetailAssembly />
            <CompanyPortfolioAssembly />
            <CompanyPortfolioViewerAssembly />
            <CompanyTilesAssembly />
            <OpportunitySidebarAssembly />
          </div>
        </UiKitSection>
      </div>
    </main>
  );
}
