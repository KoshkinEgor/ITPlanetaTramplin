import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AppLink } from "../app/AppLink";
import { PUBLIC_HEADER_NAV_ITEMS, buildOpportunityDetailRoute } from "../app/routes";
import { applyToOpportunity, getOpportunity, getOpportunities } from "../api/opportunities";
import { cn } from "../lib/cn";
import { PortalHeader } from "../widgets/layout/PortalHeader/PortalHeader";
import { Alert, Avatar, Button, Card, EmptyState, IconButton, Loader, OpportunityMiniCard, Tag } from "../shared/ui";
import "./opportunity-detail-card.css";

const BODY_CLASS = "opportunity-card-react-body";

const NAV_ITEMS = PUBLIC_HEADER_NAV_ITEMS;

const PRESETS = {
  design: {
    rating: "4.2",
    reviews: "3 отзыва",
    kind: "IT-компания",
    kindInitials: "IT",
    note: "У работодателя есть аккредитация",
    watchers: 8,
    media: "Программа стажировки",
    summary: "Стажировка с Figma, UI-китами, гипотезами и плотной работой с наставником.",
    facts: ["30 000 ₽ / мес", "2 раза / мес", "Не требуется", "5/2 или гибкий старт", "8 ч", "офис, онлайн"],
    intro: [
      "{companyName} развивает цифровые продукты и ищет начинающего дизайнера для реальных задач, а не учебных кейсов.",
      "Роль рассчитана на быстрый рост через ревью, компонентное мышление и работу рядом с продуктовой командой.",
    ],
    sections: [
      ["Основные задачи", ["Мобильные экраны и UI-киты в Figma.", "Прототипы и пользовательские сценарии.", "Поддержка дизайн-системы и презентационных материалов."]],
      ["Что мы ожидаем", ["Базовый опыт в Figma или Adobe XD.", "Понимание UI/UX для мобильных интерфейсов.", "Портфолио с учебными или личными кейсами."]],
      ["Что предлагаем", ["Наставничество и регулярные разборы работ.", "Плавный вход в продуктовую команду.", "Гибкий график и понятные шаги роста."]],
    ],
    skills: ["Adobe Photoshop", "Веб-дизайн", "Дизайн интерфейсов", "UX", "UI", "Adobe XD", "Прототипирование", "Sketch"],
    card: ["от", "30 000 ₽", "/ мес"],
  },
  frontend: {
    rating: "4.7",
    reviews: "12 отзывов",
    kind: "Продуктовая команда",
    kindInitials: "IT",
    note: "Есть roadmap роста и mentorship-программа",
    watchers: 11,
    media: "Стек и onboarding",
    summary: "Junior frontend-роль с shared-компонентами, релизами и работой рядом с дизайном.",
    facts: ["от 90 000 ₽", "2 раза / мес", "6-12 месяцев", "5/2", "8 ч", "офис, онлайн"],
    intro: [
      "{companyName} усиливает frontend-команду и ищет специалиста, который хочет расти через реальные релизы и код-ревью.",
      "Фокус роли — аккуратные компоненты, API-интеграции и консистентность интерфейса на production-экранах.",
    ],
    sections: [
      ["Основные задачи", ["React-экраны и shared UI-kit.", "Фикс адаптива и сложных состояний.", "Согласование изменений с дизайном и продуктом."]],
      ["Что мы ожидаем", ["Опыт с React и современными компонентами.", "Уверенные JavaScript, HTML и CSS.", "Готовность быстро учиться на ревью."]],
      ["Что предлагаем", ["Понятные задачи на стартовые 90 дней.", "Работу с реальным дизайн-системным слоем.", "Рост по прозрачным критериям."]],
    ],
    skills: ["React", "TypeScript", "JavaScript", "CSS", "Design systems", "Git"],
    card: ["от", "90 000 ₽", ""],
  },
  systems: {
    rating: "4.9",
    reviews: "9 отзывов",
    kind: "Платформенная команда",
    kindInitials: "DS",
    note: "Команда ведет дизайн-систему и продуктовый слой одновременно",
    watchers: 6,
    media: "Компонентная карта",
    summary: "Роль на стыке frontend и design systems: токены, API компонентов и документация.",
    facts: ["от 150 000 ₽", "2 раза / мес", "2+ года", "5/2", "8 ч", "распределенная команда"],
    intro: [
      "{companyName} ищет инженера, который умеет выстраивать мост между дизайн-китом и production-реализацией.",
      "Главная ценность роли — системность: токены, документация, миграции и стабильный DX для команды.",
    ],
    sections: [
      ["Основные задачи", ["Token-пайплайн и библиотека компонентов.", "Выравнивание API React-компонентов с design kit.", "Accessibility и migration-планы."]],
      ["Что мы ожидаем", ["Сильный React и TypeScript.", "Понимание design tokens и variant API.", "Умение объяснять trade-off между DX и скоростью релизов."]],
      ["Что предлагаем", ["Высокое влияние на UI-platform слой.", "Ownership компонентной модели.", "Отдельное время на техдолг и DX."]],
    ],
    skills: ["Design systems", "React", "Accessibility", "Tokens", "TypeScript", "Storybook"],
    card: ["от", "150 000 ₽", ""],
  },
  security: {
    rating: "4.5",
    reviews: "6 отзывов",
    kind: "SOC-команда",
    kindInitials: "SOC",
    note: "Стартовая роль с внутренним обучением и живыми сменами",
    watchers: 9,
    media: "Стартовый трек",
    summary: "Стартовая позиция: мониторинг событий, SOC/SIEM и обучение внутри команды безопасности.",
    facts: ["от 70 000 ₽", "2 раза / мес", "Не требуется", "2/2 или 5/2", "8-12 ч", "онлайн"],
    intro: [
      "{companyName} открывает стартовую security-позицию для кандидатов, которым нужен структурный вход в SOC.",
      "Роль учит дисциплине расследований, работе с очередью алертов и аккуратной эскалации инцидентов.",
    ],
    sections: [
      ["Основные задачи", ["Мониторинг очереди событий.", "Работа с SOC/SIEM под руководством наставника.", "Короткие отчеты по инцидентам и эскалация сложных кейсов."]],
      ["Что мы ожидаем", ["Интерес к безопасности и расследованиям.", "Спокойствие при большом потоке событий.", "Готовность быстро учиться у старших аналитиков."]],
      ["Что предлагаем", ["Внутреннюю программу обучения.", "Маршрут роста из junior в analyst.", "Доступ к лабораторным стендам и тренажерам."]],
    ],
    skills: ["Junior", "SOC", "SIEM", "Blue Team", "Логи", "Триаж"],
    card: ["от", "70 000 ₽", ""],
  },
  event: {
    rating: "4.9",
    reviews: "18 отзывов",
    kind: "Карьерное мероприятие",
    kindInitials: "IT",
    note: "Регистрация открыта, участие бесплатное",
    watchers: 26,
    media: "Программа мероприятия",
    summary: "Карьерное событие с работодателями, ревью портфолио и короткими интервью.",
    facts: ["155 регистраций", "Апрель 2026", "Бесплатно", "Студенты и junior", "Онлайн и офлайн", "карьерный трек"],
    intro: [
      "{companyName} собирает работодателей, студентов и начинающих специалистов в одном карьерном сценарии.",
      "На площадке можно получить фидбек по портфолио, познакомиться с командами и быстро понять следующий шаг.",
    ],
    sections: [
      ["Что будет в программе", ["Выступления команд и hiring-менеджеров.", "Портфолио-ревью и карьерные консультации.", "Короткие интервью и нетворкинг."]],
      ["Кому подойдет", ["Студентам, выходящим на рынок стажировок.", "Junior-специалистам, которым нужен карьерный разгон.", "Тем, кто хочет прямой фидбек от работодателей."]],
      ["Что вы получите", ["Контакты компаний и следующий шаг.", "Рекомендации по профилю и портфолио.", "Понимание, какие роли сейчас реально активны."]],
    ],
    skills: ["Студенты", "Мероприятие", "Нетворкинг", "Frontend", "Портфолио"],
    card: ["", "155", "регистраций"],
  },
};

const DEMO_OPPORTUNITIES = {
  "design-ui-ux": { id: "design-ui-ux", title: "Дизайнер интерфейсов мобильных приложений UI/UX", companyName: "White Tiger Soft", locationCity: "Москва", locationAddress: "Йошкар-Ола", opportunityType: "internship", employmentType: "Hybrid", moderationStatus: "approved", publishAt: "2026-02-27", description: "Стажировка для студентов и junior-специалистов: работа с Figma, UI-китами, прототипами и дизайном мобильных интерфейсов.", contactsJson: "{\"email\":\"hello@whitetigersoft.ru\",\"telegram\":\"@whitetigersoft\"}", mediaContentJson: "[{\"title\":\"Программа стажировки\"}]", tags: ["Figma", "UI / UX", "Мобильные приложения"] },
  "mobile-ui-ux-designer": { id: "mobile-ui-ux-designer", title: "Дизайнер интерфейсов мобильных приложений UI/UX", companyName: "White Tiger Soft", locationCity: "Москва", locationAddress: "Йошкар-Ола", opportunityType: "internship", employmentType: "Hybrid", moderationStatus: "approved", publishAt: "2026-02-27", description: "Стажировка с упором на мобильные сценарии, дизайн-системы и пользовательские исследования.", contactsJson: "{\"email\":\"hello@whitetigersoft.ru\",\"telegram\":\"@whitetigersoft\"}", mediaContentJson: "[{\"title\":\"Программа стажировки\"}]", tags: ["Figma", "UI / UX", "Прототипирование"] },
  "junior-security-analyst": { id: "junior-security-analyst", title: "Junior Security Analyst", companyName: "Shield Ops", locationCity: "Москва", locationAddress: "Ленинградский проспект 39", opportunityType: "vacancy", employmentType: "Remote", moderationStatus: "approved", publishAt: "2026-03-10", description: "Стартовая позиция для кандидатов без опыта: мониторинг событий, работа с SOC/SIEM и обучение внутри команды информационной безопасности.", contactsJson: "{\"email\":\"jobs@shieldops.ru\"}", mediaContentJson: "[{\"title\":\"Стартовый трек\"}]", tags: ["Junior", "SOC", "SIEM"] },
  "it-planeta-event": { id: "it-planeta-event", title: "IT-Планета", companyName: "IT-Планета", locationCity: "Москва", locationAddress: "онлайн", opportunityType: "event", employmentType: "On-site", moderationStatus: "approved", publishAt: "2026-03-15", description: "Карьерное мероприятие с регистрацией, встречами с работодателями и практическими активностями для студентов и начинающих специалистов.", contactsJson: "{\"telegram\":\"@itplaneta_event\"}", mediaContentJson: "[{\"title\":\"Программа мероприятия\"}]", tags: ["Студенты", "Мероприятие", "Нетворкинг"] },
};

function HeartIcon() {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 16.2s-5.2-3.5-6.7-6.6C2.1 7.2 3.2 4.5 6 4.5c1.5 0 2.7.8 4 2.3 1.3-1.5 2.5-2.3 4-2.3 2.8 0 3.9 2.7 2.7 5.1-1.5 3.1-6.7 6.6-6.7 6.6Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function MoreIcon() {
  return <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><circle cx="4.5" cy="10" r="1.7" /><circle cx="10" cy="10" r="1.7" /><circle cx="15.5" cy="10" r="1.7" /></svg>;
}

function MailIcon() {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="2.5" y="4.5" width="15" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.6" /><path d="m4.5 7 5.5 4 5.5-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function StarIcon() {
  return <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M10 2.75 12.08 7l4.67.68-3.38 3.31.8 4.68L10 13.43l-4.17 2.24.8-4.68-3.38-3.31L7.92 7 10 2.75Z" /></svg>;
}

function fillTemplate(template, values) {
  return Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, value || ""), template || "");
}

function uniqueItems(items) {
  return [...new Set((Array.isArray(items) ? items : []).map((item) => String(item).trim()).filter(Boolean))];
}

function parseJsonSafe(value, fallback) {
  if (!value || typeof value !== "string") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getDemoOpportunity(opportunityId) {
  return DEMO_OPPORTUNITIES[String(opportunityId)] ?? null;
}

function getDemoRelatedOpportunities(opportunityId) {
  return Object.values(DEMO_OPPORTUNITIES).filter((item) => String(item.id) !== String(opportunityId)).slice(0, 2);
}

function isNumericOpportunityId(value) {
  return /^\d+$/.test(String(value ?? "").trim());
}

function translateOpportunityType(value) {
  switch (String(value || "").toLowerCase()) {
    case "vacancy":
      return "Вакансия";
    case "internship":
      return "Стажировка";
    case "event":
      return "Мероприятие";
    default:
      return "Возможность";
  }
}

function translateEmploymentType(value) {
  const normalized = String(value || "").trim().toLowerCase();

  switch (normalized) {
    case "remote":
    case "удаленно":
    case "удалённо":
      return "Удаленно";
    case "hybrid":
    case "гибрид":
      return "Гибрид";
    case "office":
    case "on-site":
    case "onsite":
    case "на месте работодателя":
      return "Офис";
    case "online":
    case "онлайн":
      return "Онлайн";
    case "unspecified":
    case "":
      return "Не указан";
    default:
      return String(value).trim();
  }
}

function formatDate(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(parsed);
}

function formatLocationLine(item) {
  return [item.locationCity, item.locationAddress].filter(Boolean).join(", ");
}

function getCompanyInitials(name) {
  const parts = String(name || "")
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!parts.length) return "it";

  return parts
    .slice(0, 2)
    .map((item) => item[0] || "")
    .join("")
    .toLowerCase();
}

function resolvePresetKey(item) {
  const fingerprint = `${item?.id || ""} ${item?.title || ""} ${item?.opportunityType || ""}`.toLowerCase();

  if (fingerprint.includes("security")) return "security";
  if (fingerprint.includes("design systems")) return "systems";
  if (fingerprint.includes("design") || fingerprint.includes("ui/ux") || fingerprint.includes("ux")) return "design";
  if (fingerprint.includes("event") || fingerprint.includes("meetup") || fingerprint.includes("планета")) return "event";
  if (String(item?.opportunityType || "").toLowerCase() === "event") return "event";
  if (String(item?.opportunityType || "").toLowerCase() === "internship") return "design";
  return "frontend";
}

function resolveMediaLabel(mediaItems, fallback) {
  if (!Array.isArray(mediaItems) || !mediaItems.length) return fallback;
  const [firstItem] = mediaItems;
  if (typeof firstItem === "string" && firstItem.trim()) return firstItem.trim();
  if (typeof firstItem?.title === "string" && firstItem.title.trim()) return firstItem.title.trim();
  if (typeof firstItem?.label === "string" && firstItem.label.trim()) return firstItem.label.trim();
  return fallback;
}

function getContactAction(contacts) {
  if (contacts?.email) {
    return { href: `mailto:${contacts.email}`, label: "Написать компании" };
  }

  if (contacts?.telegram) {
    return { href: `https://t.me/${String(contacts.telegram).replace(/^@/, "")}`, label: "Открыть Telegram компании" };
  }

  return { href: "#contacts", label: "Открыть контакты" };
}

function getPublishedLabel(typeLabel, publishedAt, city) {
  const dateLabel = formatDate(publishedAt);
  if (!dateLabel) return `${typeLabel} опубликована`;
  if (typeLabel === "Мероприятие") return `${typeLabel} опубликовано ${dateLabel}${city ? ` в ${city}` : ""}`;
  return `${typeLabel} опубликована ${dateLabel}${city ? ` в ${city}` : ""}`;
}

function getWatchersLabel(type, watchers) {
  const nounByType = { vacancy: "вакансию", internship: "стажировку", event: "мероприятие" };
  const noun = nounByType[String(type || "").toLowerCase()] || "возможность";
  return `Сейчас эту ${noun} смотрят ${watchers} человек`;
}

function getApplyButtonLabel(type, status) {
  if (status === "saving") return "Отправляем...";
  if (status === "success") return String(type || "").toLowerCase() === "event" ? "Заявка отправлена" : "Отклик отправлен";
  return String(type || "").toLowerCase() === "event" ? "Подать заявку" : "Откликнуться";
}

function buildOpportunityViewModel(item) {
  const preset = PRESETS[resolvePresetKey(item)];
  const contacts = parseJsonSafe(item.contactsJson, {});
  const mediaItems = parseJsonSafe(item.mediaContentJson, []);
  const typeLabel = translateOpportunityType(item.opportunityType);
  const employmentLabel = translateEmploymentType(item.employmentType);
  const locationLine = formatLocationLine(item);
  const metaLine = [item.companyName, item.locationCity, employmentLabel === "Не указан" ? "" : employmentLabel.toLowerCase()].filter(Boolean).join(" • ");
  const skills = uniqueItems([...(preset.skills || []), ...(item.tags || [])]).slice(0, 12);
  const infoFacts =
    typeLabel === "Мероприятие"
      ? [
          { label: "Регистрация", value: preset.facts[0] },
          { label: "Дата", value: preset.facts[1] },
          { label: "Участие", value: preset.facts[2] },
          { label: "Для кого", value: preset.facts[3] },
          { label: "Формат", value: preset.facts[4] },
          { label: "Трек", value: preset.facts[5] },
        ]
      : [
          { label: "Зарплата", value: preset.facts[0] },
          { label: "Выплаты", value: preset.facts[1] },
          { label: "Опыт работы", value: preset.facts[2] },
          { label: "График", value: preset.facts[3] },
          { label: "Рабочие часы", value: preset.facts[4] },
          { label: "Формат работы", value: employmentLabel === "Не указан" ? preset.facts[5] : `${employmentLabel}, ${preset.facts[5]}` },
        ];
  const intro = uniqueItems([
    fillTemplate(preset.intro[0], { companyName: item.companyName || "Команда" }),
    item.description || preset.summary,
    fillTemplate(preset.intro[1], { companyName: item.companyName || "Команда" }),
  ]);

  return {
    typeLabel,
    metaLine,
    summary: item.description || preset.summary,
    infoFacts,
    intro,
    sections: preset.sections,
    skills,
    published: getPublishedLabel(typeLabel, item.publishAt, item.locationCity),
    watchers: getWatchersLabel(item.opportunityType, preset.watchers),
    media: resolveMediaLabel(mediaItems, preset.media),
    company: {
      initials: getCompanyInitials(item.companyName),
      rating: preset.rating,
      reviews: preset.reviews,
      kind: preset.kind,
      kindInitials: preset.kindInitials,
      note: preset.note,
    },
    relatedCard: { prefix: preset.card[0], value: preset.card[1], suffix: preset.card[2] },
    contactAction: getContactAction(contacts),
    complaint: typeLabel === "Мероприятие" ? "Пожаловаться на событие" : "Пожаловаться на возможность",
  };
}

function mapRelatedOpportunity(item) {
  const viewModel = buildOpportunityViewModel(item);
  const isEvent = String(item?.opportunityType || "").toLowerCase() === "event";

  return {
    type: viewModel.typeLabel,
    status: isEvent ? "Ожидание" : "Активно",
    statusTone: isEvent ? "neutral" : "success",
    title: item.title,
    meta: [item.companyName, item.locationCity, translateEmploymentType(item.employmentType).toLowerCase()].filter(Boolean).join(" • "),
    valuePrefix: viewModel.relatedCard.prefix,
    accent: viewModel.relatedCard.value,
    valueSuffix: viewModel.relatedCard.suffix,
    chips: uniqueItems(item.tags).slice(0, 3),
  };
}

function OpportunityDetailLayout({
  item,
  related,
  applyState,
  onApply,
  buildDetailHref = (entry) => buildOpportunityDetailRoute(entry.id),
  catalogHref = "/opportunities",
  animated = true,
  embedded = false,
}) {
  const viewModel = useMemo(() => buildOpportunityViewModel(item), [item]);
  const relatedItems = (Array.isArray(related) ? related : []).slice(0, 2);
  const applyLabel = getApplyButtonLabel(item.opportunityType, applyState.status);

  return (
    <div className={cn("opportunity-card-page__grid", embedded && "opportunity-card-page__grid--embedded")}>
      <div className="opportunity-card-page__main">
        <Card className={cn("opportunity-focus-card", animated && "opportunity-card-fade-up")}>
          <div className="opportunity-focus-card__eyebrow">
            <Tag>{viewModel.typeLabel}</Tag>
            <div className="opportunity-focus-card__toolbar">
              <IconButton type="button" label="Сохранить возможность" size="xl" className="opportunity-focus-card__toolbar-button"><HeartIcon /></IconButton>
              <IconButton type="button" label="Еще действия" size="xl" className="opportunity-focus-card__toolbar-button"><MoreIcon /></IconButton>
            </div>
          </div>

          <div className="opportunity-focus-card__copy">
            <h1 className="ui-type-h2">{item.title}</h1>
            <p className="ui-type-body">{viewModel.metaLine}</p>
          </div>

          <dl className="opportunity-focus-card__facts">
            {viewModel.infoFacts.map((fact) => (
              <div key={fact.label} className="opportunity-focus-card__fact">
                <dt>{fact.label}:</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>

          <p className="ui-type-body opportunity-focus-card__summary">{viewModel.summary}</p>

          {uniqueItems(item.tags).length ? (
            <div className="opportunity-focus-card__chips">
              {uniqueItems(item.tags).map((tag) => (
                <Tag key={tag} tone="accent">{tag}</Tag>
              ))}
            </div>
          ) : null}

          <div className="opportunity-focus-card__footer">
            <div className="opportunity-focus-card__watchers">{viewModel.watchers}</div>
            <div className="opportunity-focus-card__actions">
              <Button type="button" className="opportunity-focus-card__apply" onClick={onApply} disabled={applyState.status === "saving" || applyState.status === "success"}>
                {applyLabel}
              </Button>
            </div>
          </div>
        </Card>

        {applyState.status === "error" ? <Alert tone="error" title="Не удалось отправить заявку" showIcon>{applyState.error}</Alert> : null}
        {applyState.status === "success" ? <Alert tone="success" title="Заявка отправлена" showIcon>Она появится в откликах работодателя после подтверждения вашей стороны.</Alert> : null}

        <Card className={cn("opportunity-media-panel", animated && "opportunity-card-fade-up opportunity-card-fade-up--delay-1")}>
          <div className="opportunity-media-panel__header">
            <h2 className="ui-type-h4">Медиа</h2>
            <p className="ui-type-caption">Компания может приложить программу, визуалы или onboarding-пакет к карточке.</p>
          </div>
          <div className="opportunity-media-panel__preview" aria-hidden="true">
            <span className="opportunity-media-panel__glow opportunity-media-panel__glow--lime" />
            <span className="opportunity-media-panel__glow opportunity-media-panel__glow--blue" />
            <Tag className="opportunity-media-panel__badge">{viewModel.media}</Tag>
          </div>
        </Card>

        <Card className={cn("opportunity-story-card", animated && "opportunity-card-fade-up opportunity-card-fade-up--delay-2")}>
          <div className="opportunity-story-card__intro">
            {viewModel.intro.map((paragraph, index) => <p key={`${paragraph}-${index}`} className="ui-type-body">{paragraph}</p>)}
          </div>

          {viewModel.sections.map(([title, items]) => (
            <section key={title} className="opportunity-story-section">
              <div className="opportunity-story-section__header"><h2 className="ui-type-h3">{title}</h2></div>
              <ul className="opportunity-story-list">{items.map((entry) => <li key={entry}>{entry}</li>)}</ul>
            </section>
          ))}

          <section className="opportunity-story-section">
            <div className="opportunity-story-section__header"><h2 className="ui-type-h2">Ключевые навыки</h2></div>
            <div className="opportunity-skill-cloud">{viewModel.skills.map((tag) => <Tag key={tag} tone="accent">{tag}</Tag>)}</div>
          </section>

          <p className="ui-type-caption">{viewModel.published}</p>
          <div className="opportunity-story-card__bottom-actions">
            <Button type="button" className="opportunity-story-card__bottom-primary" onClick={onApply} disabled={applyState.status === "saving" || applyState.status === "success"}>{applyLabel}</Button>
            <Button type="button" variant="secondary" className="opportunity-story-card__bottom-secondary">{viewModel.complaint}</Button>
          </div>
        </Card>
      </div>

      <aside className="opportunity-card-page__side">
        <Card className={cn("company-spotlight", animated && "opportunity-card-fade-up opportunity-card-fade-up--delay-1")}>
          <div className="company-spotlight__company">
            <Avatar size="lg" initials={viewModel.company.initials} className="company-spotlight__avatar company-spotlight__avatar--brand" />
            <div className="company-spotlight__copy">
              <h2 className="ui-type-h4">{item.companyName}</h2>
              <div className="company-spotlight__rating">
                <strong>{viewModel.company.rating}</strong>
                <span className="company-spotlight__stars" aria-label={`Рейтинг ${viewModel.company.rating} из 5`}>{Array.from({ length: 5 }).map((_, index) => <StarIcon key={index} />)}</span>
                <span className="company-spotlight__link">{viewModel.company.reviews}</span>
              </div>
            </div>
          </div>

          <div className="company-spotlight__company company-spotlight__company--compact">
            <Avatar size="lg" initials={viewModel.company.kindInitials} tone="neutral" className="company-spotlight__avatar" />
            <div className="company-spotlight__copy">
              <strong className="ui-type-body">{viewModel.company.kind}</strong>
              <p className="ui-type-body">{viewModel.company.note}</p>
            </div>
          </div>

          <div className="company-spotlight__footer">
            <Button type="button" variant="secondary" className="company-spotlight__recommend">Рекомендовать возможность</Button>
            <IconButton href={viewModel.contactAction.href} label={viewModel.contactAction.label} variant="outline" size="xl" className="company-spotlight__message"><MailIcon /></IconButton>
          </div>
        </Card>

        <div className="opportunity-card-page__matches">
          <p className="ui-type-caption opportunity-card-page__matches-label">Вам могут подойти</p>
          {relatedItems.length ? (
            relatedItems.map((relatedItem, index) => (
              <OpportunityMiniCard
                key={relatedItem.id}
                variant="compact"
                item={mapRelatedOpportunity(relatedItem)}
                className={cn("related-opportunity-entry", animated && `opportunity-card-fade-up opportunity-card-fade-up--delay-${index + 2}`)}
                detailAction={{ href: buildDetailHref(relatedItem), label: "Подробнее", variant: "secondary" }}
              />
            ))
          ) : (
            <Card><EmptyState title="Пока нет похожих публикаций" description="Другие возможности появятся здесь автоматически, когда каталог станет шире." tone="neutral" compact /></Card>
          )}

          <AppLink href={catalogHref} className="opportunity-card-page__more-link">Еще возможности в каталоге</AppLink>
        </div>
      </aside>
    </div>
  );
}

export function OpportunityDetailPreview() {
  const previewItem = getDemoOpportunity("design-ui-ux");
  if (!previewItem) return null;

  return (
    <OpportunityDetailLayout
      item={previewItem}
      related={getDemoRelatedOpportunities(previewItem.id)}
      applyState={{ status: "idle", error: "" }}
      onApply={() => {}}
      buildDetailHref={(entry) => `#${entry.id}`}
      catalogHref="#catalog"
      animated={false}
      embedded
    />
  );
}

export function OpportunityDetailCardApp() {
  const params = useParams();
  const opportunityId = params.id;
  const [state, setState] = useState({ status: "loading", item: null, related: [], error: null, source: "api" });
  const [applyState, setApplyState] = useState({ status: "idle", error: "" });

  useEffect(() => {
    document.body.classList.add(BODY_CLASS);
    return () => document.body.classList.remove(BODY_CLASS);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      const demoItem = getDemoOpportunity(opportunityId);
      if (demoItem) {
        setState({ status: "ready", item: demoItem, related: getDemoRelatedOpportunities(opportunityId), error: null, source: "demo" });
        return;
      }

      if (!isNumericOpportunityId(opportunityId)) {
        setState({ status: "error", item: null, related: [], error: new Error("Карточка возможности не найдена."), source: "api" });
        return;
      }

      try {
        const [item, allOpportunities] = await Promise.all([getOpportunity(opportunityId, controller.signal), getOpportunities(controller.signal)]);
        setState({
          status: "ready",
          item,
          related: (Array.isArray(allOpportunities) ? allOpportunities : []).filter((entry) => String(entry.id) !== String(opportunityId)).slice(0, 2),
          error: null,
          source: "api",
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({ status: "error", item: null, related: [], error, source: "api" });
        }
      }
    }

    setApplyState({ status: "idle", error: "" });
    load();
    return () => controller.abort();
  }, [opportunityId]);

  async function handleApply() {
    setApplyState({ status: "saving", error: "" });
    if (state.source === "demo") {
      setApplyState({ status: "success", error: "" });
      return;
    }

    try {
      await applyToOpportunity(opportunityId);
      setApplyState({ status: "success", error: "" });
    } catch (error) {
      setApplyState({ status: "error", error: error?.message ?? "Не удалось отправить отклик." });
    }
  }

  return (
    <main className="opportunity-card-page" data-testid="opportunity-detail-page">
      <div className="opportunity-card-page__shell ui-page-shell">
        <PortalHeader navItems={NAV_ITEMS} currentKey="opportunities" actionHref="/candidate/profile" actionLabel="Профиль" className="opportunity-card-header opportunity-card-fade-up" />
        {state.status === "loading" ? <Loader label="Загружаем карточку возможности" surface /> : null}
        {state.status === "error" ? <Alert tone="error" title="Не удалось загрузить карточку" showIcon>{state.error?.message ?? "Попробуйте открыть возможность позже."}</Alert> : null}
        {state.status === "ready" && state.item ? <OpportunityDetailLayout item={state.item} related={state.related} applyState={applyState} onApply={handleApply} /> : null}
      </div>
    </main>
  );
}
