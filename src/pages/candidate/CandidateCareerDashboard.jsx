import { useMemo, useState } from "react";
import { buildCandidatePublicProfileRoute, buildOpportunityDetailRoute, routes, withSearch } from "../../app/routes";
import { getCandidateDisplayName, getCandidateSkills } from "../../candidate-portal/mappers";
import { mapSocialUserToCard } from "../../candidate-portal/social";
import { OpportunityBlockSlider } from "../../components/opportunities";
import { OpportunityBlockCard } from "../../components/opportunities/OpportunityCard";
import { getOpportunityCardPresentation } from "../../shared/lib/opportunityPresentation";
import { useFavoriteOpportunity } from "../../features/favorites/useFavoriteOpportunity";
import { cn } from "../../lib/cn";
import { normalizeOpportunityType } from "../../shared/lib/opportunityTypes";
import {
  Alert,
  Button,
  Card,
  CareerCourseCard,
  CareerMentorCard,
  CareerPeerCard,
  CareerSalaryPanel,
  CareerSkillsPanel,
  CareerStatsPanel,
  FilterPill,
  HeartIcon,
  InfoIcon,
  Loader,
  SectionHeader,
  SparkIcon,
  StatusBadge,
  Tag,
} from "../../shared/ui";

const COURSE_SLIDER_ARIA_LABEL = "Career courses slider";
const OPPORTUNITY_SLIDER_ARIA_LABEL = "Career opportunities slider";
const COURSE_ACTION_TARGET = "_blank";
const COURSE_ACTION_REL = "noreferrer";
const MENTOR_CATALOG_HREF = `${routes.opportunities.catalog}?type=mentoring`;

const RECOMMENDATION_TABS = [
  { value: "all", label: "Все" },
  { value: "vacancy", label: "Вакансии" },
  { value: "internship", label: "Стажировки" },
  { value: "mentoring", label: "Менторские программы" },
  { value: "event", label: "Мероприятия" },
];

const SALARY_TRACKS = {
  design: [
    { level: "Джуниор веб-дизайнер", range: "44-56 тыс. ₽", progress: 0.32 },
    { level: "Мид веб-дизайнер", range: "52-59 тыс. ₽", progress: 0.5 },
    { level: "Сеньор веб-дизайнер", range: "106-459 тыс. ₽", progress: 1 },
  ],
  analytics: [
    { level: "Junior аналитик", range: "48-72 тыс. ₽", progress: 0.35 },
    { level: "Middle аналитик", range: "82-135 тыс. ₽", progress: 0.6 },
    { level: "Senior аналитик", range: "148-310 тыс. ₽", progress: 1 },
  ],
  development: [
    { level: "Junior frontend-разработчик", range: "65-95 тыс. ₽", progress: 0.42 },
    { level: "Middle frontend-разработчик", range: "120-180 тыс. ₽", progress: 0.68 },
    { level: "Senior frontend-разработчик", range: "220-420 тыс. ₽", progress: 1 },
  ],
  default: [
    { level: "Стартовый уровень", range: "45-70 тыс. ₽", progress: 0.36 },
    { level: "Уверенный уровень", range: "70-120 тыс. ₽", progress: 0.6 },
    { level: "Экспертный уровень", range: "120-260 тыс. ₽", progress: 1 },
  ],
};

const TRACK_SKILLS = {
  design: ["UX", "UI", "Research", "Figma", "Презентации", "Вёрстка", "Графический дизайн", "User experience", "Sketch", "User interface", "Adobe Photoshop", "Usability"],
  analytics: ["SQL", "Python", "Research", "BI", "Data Visualization", "Презентации", "Excel", "Power BI", "A/B тесты", "Метрики", "Статистика", "Дашборды"],
  development: ["JavaScript", "React", "TypeScript", "HTML", "CSS", "Git", "REST API", "UI", "Figma", "Адаптивная вёрстка", "Тестирование", "State management"],
  default: ["SQL", "Python", "Research", "Figma", "Презентации", "Коммуникация", "Analytics", "UI", "Проектная работа", "A/B тесты", "Usability", "Вёрстка"],
};

const COURSE_CATALOG = [
  {
    id: "ai-design",
    title: "Нейросети для дизайна",
    provider: "Яндекс Практикум",
    meta: "Короткий курс · 2 месяца · онлайн",
    monthly: "Можно платить ежемесячно",
    href: "https://practicum.yandex.ru/ai-tools-for-designers/",
    tags: ["Figma", "UX", "UI", "User experience", "User interface", "Research", "Usability"],
  },
  {
    id: "illustrator",
    title: "Adobe Illustrator",
    provider: "Skillbox",
    meta: "С нуля · 1 месяц · онлайн",
    price: "4 210 ₽/мес",
    oldPrice: "7 655 ₽/мес",
    monthly: "Рассрочка на 6 месяцев",
    href: "https://skillbox.ru/course/illustrator/",
    tags: ["Adobe Photoshop", "Графический дизайн", "Figma", "UI", "Вёрстка"],
  },
  {
    id: "typography",
    title: "Шрифт в дизайне",
    provider: "Skillbox",
    meta: "С нуля · 3 месяца · онлайн",
    price: "5 214 ₽/мес",
    oldPrice: "9 480 ₽/мес",
    monthly: "Рассрочка на 12 месяцев",
    href: "https://skillbox.ru/course/paratype/",
    tags: ["Вёрстка", "Графический дизайн", "UI", "CSS", "HTML"],
  },
  {
    id: "graphic-design",
    title: "Графический дизайнер с нуля",
    provider: "Skillbox",
    meta: "С нуля · 6 месяцев · онлайн",
    price: "4 475 ₽/мес",
    oldPrice: "9 945 ₽/мес",
    monthly: "Рассрочка на 24 месяца",
    href: "https://skillbox.ru/course/graphic-design/",
    tags: ["Adobe Photoshop", "Графический дизайн", "Figma", "UX", "UI", "Sketch"],
  },
  {
    id: "product-analytics",
    title: "Продуктовый аналитик",
    provider: "Яндекс Практикум",
    meta: "Профессия · онлайн",
    price: "8 000 ₽/мес",
    monthly: "Можно платить ежемесячно",
    href: "https://practicum.yandex.ru/product-analyst/",
    tags: ["SQL", "Python", "A/B тесты", "Метрики", "Статистика", "Дашборды", "Research", "Excel", "BI", "Power BI"],
  },
  {
    id: "frontend",
    title: "React. Разработка сложных клиентских приложений",
    provider: "HTML Academy",
    meta: "Профессиональный курс · онлайн",
    price: "44 700 ₽",
    oldPrice: "89 400 ₽",
    monthly: "Лайт-формат · доступ на 2 года",
    href: "https://htmlacademy.ru/intensive/react",
    tags: ["React", "JavaScript", "TypeScript", "Git", "State management", "HTML", "CSS", "REST API", "Тестирование"],
  },
  {
    id: "brand-identity",
    title: "Айдентика: от идеи к визуальному воплощению",
    provider: "Bang Bang Education",
    meta: "С нуля · 3 месяца · онлайн",
    href: "https://bangbangeducation.ru/course/id-from-idea-to-image",
    tags: ["Графический дизайн", "Презентации", "UI", "Research"],
  },
  {
    id: "motion-design",
    title: "Профессия моушн-дизайнер с нуля до ПРО",
    provider: "Contented",
    meta: "18 месяцев · онлайн",
    price: "5 200 ₽/мес",
    oldPrice: "8 667 ₽/мес",
    monthly: "Рассрочка на 36 месяцев",
    href: "https://contented.ru/edu/motion-designer-pro",
    tags: ["Motion-design", "UI", "UX", "User interface", "Figma"],
  },
];

const FALLBACK_OPPORTUNITIES = [
  { id: "design-mobile-internship", type: "Стажировка", status: "Активно", statusTone: "success", title: "Дизайнер интерфейсов мобильных приложений UI/UX (Junior/Middle)", company: "White Tiger Soft", accent: "Длительность: 8 недель", chips: ["Студенты", "Без опыта"], href: routes.opportunities.catalog },
  { id: "web-designer-internship", type: "Стажировка", status: "Активно", statusTone: "success", title: "Веб-дизайнер", company: "ГАУЗ Республиканский медицинский центр", accent: "Длительность: 4 недели", chips: ["Студенты", "Без опыта"], href: routes.opportunities.catalog },
  { id: "graphic-design-internship", type: "Стажировка", status: "Активно", statusTone: "success", title: "Графический дизайнер", company: "Leonards space", accent: "Длительность: 12 недель", chips: ["Студенты", "Без опыта"], href: routes.opportunities.catalog },
  { id: "product-design-internship", type: "Стажировка", status: "Активно", statusTone: "success", title: "Дизайнер цифровых продуктов", company: "White Tiger Soft", accent: "Длительность: 6 недель", chips: ["Студенты", "Junior"], href: routes.opportunities.catalog },
];

void FALLBACK_OPPORTUNITIES;

const MENTOR_FILTERS = [
  { value: "career-plan", label: "Построить карьерный план" },
  { value: "resume", label: "Создать полное резюме" },
  { value: "strategy", label: "Проработать стратегию развития" },
  { value: "interview", label: "Подготовиться к собеседованию" },
  { value: "burnout", label: "Справиться с выгоранием" },
];

const MENTORS = [
  { id: "maria-sokolova", name: "Мария Соколова", role: "Карьерный консультант", summary: "Сертифицированный карьерный консультант, эксперт по трудоустройству топ-менеджеров.", focus: ["career-plan", "strategy", "resume"], tone: "warning" },
  { id: "julia-dmitrieva", name: "Юлия Дмитриева", role: "Карьерный консультант", summary: "Помогает настроить карьерный фокус, резюме и уверенно пройти интервью.", focus: ["career-plan", "interview", "strategy"], tone: "accent" },
  { id: "veronica-alekseeva", name: "Вероника Алексеева", role: "Senior Product Designer в Яндекс", summary: "5 лет в UX/UI-дизайне, IT-рекрутинге и продуктовых командах.", focus: ["resume", "interview", "career-plan"], tone: "success" },
  { id: "andrey-fadeev", name: "Андрей Фадеев", role: "Тимлид аналитики", summary: "Помогает собрать стратегию роста, усилить портфолио и не выгореть на длинной дистанции.", focus: ["strategy", "career-plan", "burnout"], tone: "neutral" },
];

function normalizeKey(value) {
  return String(value ?? "").trim().toLowerCase().replace(/ё/g, "е");
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getOnboardingPayload(profile) {
  const links = isRecord(profile?.links) ? profile.links : {};
  return isRecord(links.onboarding) ? links.onboarding : {};
}

function getProfileProfession(profile) {
  const onboarding = getOnboardingPayload(profile);
  return typeof onboarding.profession === "string" ? onboarding.profession.trim() : "";
}

function getProfileCity(profile) {
  const onboarding = getOnboardingPayload(profile);
  return typeof onboarding.city === "string" ? onboarding.city.trim() : "Чебоксарах";
}

function getProfileMeta(profile) {
  return [getProfileProfession(profile), getProfileCity(profile)].filter(Boolean).join(" · ");
}

function resolveTrackKey(profile) {
  const source = `${getProfileProfession(profile)} ${getCandidateSkills(profile).join(" ")}`.toLowerCase();

  if (source.includes("design") || source.includes("ux") || source.includes("ui") || source.includes("диз")) return "design";
  if (source.includes("аналит") || source.includes("sql") || source.includes("data")) return "analytics";
  if (source.includes("разработ") || source.includes("react") || source.includes("frontend") || source.includes("javascript")) return "development";

  return "default";
}

function calculateOpportunityMatchPercentage(profile, opportunity) {
  if (!opportunity) return 0;
  
  const profileSkills = getCandidateSkills(profile).map(s => s.toLowerCase());
  const opportunityTags = (opportunity.chips || opportunity.tags || []).map(t => t.toLowerCase());
  
  const profession = getProfileProfession(profile).toLowerCase();
  const title = (opportunity.title || "").toLowerCase();
  
  // Normalizing string comparisons to be robust
  const cleanProfession = profession.replace(/[^a-zA-Zа-яА-Я0-9]/g, "");
  const cleanTitle = title.replace(/[^a-zA-Zа-яА-Я0-9]/g, "");
  
  const professionMatch = cleanProfession && (cleanTitle.includes(cleanProfession) || cleanProfession.includes(cleanTitle));
  
  const track = resolveTrackKey(profile);
  const titleTrackMatch = 
    (track === "design" && (title.includes("диз") || title.includes("ux") || title.includes("ui"))) ||
    (track === "analytics" && (title.includes("аналит") || title.includes("data"))) ||
    (track === "development" && (title.includes("разработ") || title.includes("react") || title.includes("frontend") || title.includes("js")));

  // Count matching skills
  const matchingSkillsCount = profileSkills.filter(skill => 
    opportunityTags.some(tag => tag.includes(skill) || skill.includes(tag))
  ).length;

  let baseScore = 50;
  if (professionMatch) {
    baseScore = 85;
  } else if (titleTrackMatch) {
    baseScore = 78;
  }
  
  const skillRatio = profileSkills.length > 0 ? matchingSkillsCount / profileSkills.length : 0.6;
  const matchScore = Math.min(99, Math.round(baseScore + skillRatio * 20));
  
  return matchScore;
}

function mapOpportunityCard(item) {
  if (!isRecord(item)) {
    return null;
  }

  const opportunityId = item.id ?? item.opportunityId ?? null;
  const presentation = getOpportunityCardPresentation(item);

  return {
    id: opportunityId ?? `${item.title ?? "career"}-${item.companyName ?? "item"}`,
    opportunityType: item.opportunityType ?? item.type ?? "",
    ...presentation,
    status: item.moderationStatus === "approved" ? "Активно" : item.statusLabel ?? "Активно",
    statusTone: "success",
    title: item.title ?? item.opportunityTitle ?? "Карьерная возможность",
    meta: [item.companyName, item.locationCity].filter(Boolean).join(" • ") || presentation.meta || item.companyName || "Компания",
    chips: safeArray(item.tags).filter(Boolean).slice(0, 2),
    href: opportunityId ? buildOpportunityDetailRoute(opportunityId) : routes.opportunities.catalog,
    tags: safeArray(item.tags).filter(Boolean),
  };
}


function getOpportunityCards(recommendations, opportunities) {
  const primary = safeArray(recommendations).map(mapOpportunityCard).filter(Boolean);
  const secondary = safeArray(opportunities).map(mapOpportunityCard).filter(Boolean);
  const merged = [];
  const seenIds = new Set();

  [primary, secondary].forEach((group) => {
    group.forEach((item) => {
      const itemId = item?.id ?? item?.title;

      if (!itemId || seenIds.has(itemId) || merged.length >= 4) {
        return;
      }

      seenIds.add(itemId);
      merged.push(item);
    });
  });

  return merged;
}

function getAiOpportunityCards(aiRecommendations, opportunities) {
  const aiItems = normalizeAiRecommendationItems(aiRecommendations);
  const opportunitiesById = new Map(safeArray(opportunities).map((item) => [Number(item?.id ?? item?.opportunityId), item]));

  return aiItems
    .map((item) => opportunitiesById.get(item.opportunityId))
    .filter(Boolean)
    .map(mapOpportunityCard)
    .filter(Boolean);
}



function getOpportunityTypeLabel(type) {
  switch (normalizeOpportunityType(type)) {
    case "vacancy":
      return "Вакансии";
    case "internship":
      return "Стажировки";
    case "event":
      return "Мероприятия";
    case "mentoring":
      return "Менторские программы";
    case "course":
      return "Курсы";
    case "fallback":
      return "Подбор по навыкам";
    default:
      return "Другие возможности";
  }
}

function getOpportunityActionLabel(type) {
  switch (normalizeOpportunityType(type)) {
    case "event":
      return "Посмотреть мероприятие";
    case "mentoring":
      return "Посмотреть программу";
    case "course":
      return "Перейти к курсу";
    default:
      return "Подробнее";
  }
}

function normalizeAiRecommendationItems(aiRecommendations) {
  return safeArray(aiRecommendations?.items ?? aiRecommendations?.Items)
    .map((item) => ({
      opportunityId: Number(item?.opportunityId ?? item?.OpportunityId ?? 0),
      matchPercent: Number(item?.matchPercent ?? item?.MatchPercent ?? 0),
      reason: item?.reason ?? item?.Reason ?? "",
      matchedSkills: safeArray(item?.matchedSkills ?? item?.MatchedSkills).filter(Boolean),
      missingSkills: safeArray(item?.missingSkills ?? item?.MissingSkills).filter(Boolean),
      nextStep: item?.nextStep ?? item?.NextStep ?? "",
    }))
    .filter((item) => item.opportunityId > 0);
}

function normalizeAiCareerPlan(aiRecommendations) {
  return safeArray(aiRecommendations?.careerPlan ?? aiRecommendations?.CareerPlan)
    .map((item, index) => ({
      day: item?.day ?? item?.Day ?? `День ${index + 1}`,
      action: item?.action ?? item?.Action ?? "",
      outcome: item?.outcome ?? item?.Outcome ?? "",
    }))
    .filter((item) => item.action)
    .slice(0, 7);
}

function sanitizeSectionTitle(title, type) {
  const trimmed = String(title ?? "").trim();
  if (trimmed.toLowerCase().includes("центрация")) {
    switch (normalizeOpportunityType(type)) {
      case "vacancy":
        return "Рекомендованные вакансии";
      case "internship":
        return "Рекомендованные стажировки";
      case "event":
        return "Рекомендованные мероприятия";
      case "mentoring":
        return "Рекомендованные менторы";
      case "course":
        return "Рекомендованные курсы";
      default:
        return "Рекомендованные возможности";
    }
  }
  return trimmed;
}

function getAiRecommendationSections(aiRecommendations, opportunities) {
  const opportunitiesById = new Map(safeArray(opportunities).map((item) => [Number(item?.id ?? item?.opportunityId), item]));
  const rawSections = safeArray(aiRecommendations?.sections ?? aiRecommendations?.Sections);
  const sections = rawSections
    .map((section) => {
      const type = normalizeOpportunityType(section?.type ?? section?.Type);
      const items = normalizeAiRecommendationItems({ items: section?.items ?? section?.Items })
        .map((aiItem) => {
          const opportunity = opportunitiesById.get(aiItem.opportunityId);
          const card = mapOpportunityCard(opportunity);

          return card ? { card, aiItem } : null;
        })
        .filter(Boolean);

      const rawTitle = section?.title ?? section?.Title ?? getOpportunityTypeLabel(type);
      return {
        type,
        title: sanitizeSectionTitle(rawTitle, type),
        items,
      };
    })
    .filter((section) => section.items.length);

  if (sections.length) {
    return sections;
  }

  const aiItems = normalizeAiRecommendationItems(aiRecommendations);
  if (!aiItems.length) {
    return [];
  }

  const items = aiItems
    .map((aiItem) => {
      const opportunity = opportunitiesById.get(aiItem.opportunityId);
      const card = mapOpportunityCard(opportunity);

      return card ? { card, aiItem } : null;
    })
    .filter(Boolean);

  return Object.values(
    items.reduce((acc, item) => {
      const type = normalizeOpportunityType(item.card.opportunityType);
      const key = type;

      if (!acc[key]) {
        acc[key] = { type: key, title: getOpportunityTypeLabel(key), items: [] };
      }

      if (acc[key].items.length < 4) {
        acc[key].items.push(item);
      }

      return acc;
    }, {})
  );
}

function getBaseRecommendationSections(recommendations, opportunities, aiItems = []) {
  const aiById = new Map(aiItems.map((item) => [item.opportunityId, item]));
  const merged = [];
  const seen = new Set();

  [...safeArray(recommendations), ...safeArray(opportunities)].forEach((item) => {
    const card = mapOpportunityCard(item);
    const id = Number(item?.id ?? item?.opportunityId ?? card?.id);
    const key = id || card?.title;

    if (!card || !key || seen.has(key)) {
      return;
    }

    seen.add(key);
    merged.push({ card, aiItem: aiById.get(id) ?? null });
  });

  merged.sort((left, right) => (
    (right.aiItem?.matchPercent ?? -1) - (left.aiItem?.matchPercent ?? -1)
  ));

  return Object.values(
    merged.reduce((acc, item) => {
      const type = normalizeOpportunityType(item.card.opportunityType);
      const key = type;

      if (!acc[key]) {
        acc[key] = { type: key, title: getOpportunityTypeLabel(key), items: [] };
      }

      if (acc[key].items.length < 4) {
        acc[key].items.push(item);
      }

      return acc;
    }, {})
  );
}

function CareerAiInsightPanel({ aiRecommendations, status, error, onRefresh }) {
  const summary = aiRecommendations?.summary ?? aiRecommendations?.Summary ?? "";
  const nextActions = safeArray(aiRecommendations?.nextActions ?? aiRecommendations?.NextActions).filter(Boolean).slice(0, 4);
  const missingSkills = safeArray(aiRecommendations?.missingSkills ?? aiRecommendations?.MissingSkills).filter(Boolean).slice(0, 8);
  const isFallback = Boolean(aiRecommendations?.isFallback ?? aiRecommendations?.IsFallback);

  return (
    <Card className="candidate-career-ai-panel">
      <div className="candidate-career-ai-panel__head">
        <div>
          <span className="candidate-career-ai-panel__badge">AI · GigaChat</span>
          <h2 className="ui-type-h2">AI-карьерный фокус</h2>
        </div>
        <Button type="button" variant="secondary" onClick={onRefresh} disabled={status === "loading"}>
          {status === "loading" ? "Обновляем..." : "Обновить AI-рекомендации"}
        </Button>
      </div>

      {status === "loading" ? <Loader label="Анализируем профиль и возможности..." surface /> : null}

      {status === "error" ? (
        <Alert tone="warning" title="AI временно недоступен" showIcon>
          {error?.message ?? "Ручной режим и базовые рекомендации остаются доступными."}
        </Alert>
      ) : null}

      {status !== "loading" && summary ? (
        <p className="candidate-career-ai-panel__summary">{summary}</p>
      ) : null}

      {isFallback ? <p className="ui-type-caption">Рекомендации построены на основе ваших ключевых навыков, пока ИИ-модель GigaChat готовится к ответу.</p> : null}

      {nextActions.length ? (
        <div className="candidate-career-ai-panel__actions-list">
          {nextActions.map((action) => (
            <span key={action}>{action}</span>
          ))}
        </div>
      ) : null}

      {missingSkills.length ? (
        <div className="candidate-career-ai-panel__tags">
          {missingSkills.map((skill) => (
            <Tag key={skill} variant="surface">
              {skill}
            </Tag>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

function CareerAiPlanPanel({ aiRecommendations, status }) {
  const steps = normalizeAiCareerPlan(aiRecommendations);

  if (status === "loading") {
    return (
      <Card className="candidate-career-ai-plan">
        <div className="candidate-career-ai-plan__head">
          <div className="candidate-career-ai-card__head">
            <h3 className="ui-type-h3">Следующий лучший шаг</h3>
            <span className="candidate-career-ai-panel__badge">AI-план</span>
          </div>
          <p className="ui-type-body candidate-career-ai-plan__subtitle">Мини-план на 7 дней</p>
        </div>
        <Loader label="Формируем карьерный план..." surface />
      </Card>
    );
  }

  if (!steps.length) {
    return null;
  }

  return (
    <Card className="candidate-career-ai-plan">
      <div className="candidate-career-ai-plan__head">
        <div className="candidate-career-ai-card__head">
          <h3 className="ui-type-h3">Следующий лучший шаг</h3>
          <span className="candidate-career-ai-panel__badge">AI-план</span>
        </div>
        <p className="ui-type-body candidate-career-ai-plan__subtitle">Мини-план на 7 дней</p>
      </div>
      <div className="candidate-career-ai-plan__list">
        {steps.map((step, index) => (
          <div key={`${step.day}-${index}`} className="candidate-career-ai-plan__item">
            <strong>{step.day || `День ${index + 1}`}</strong>
            <p>{step.action}</p>
            {step.outcome ? <span>{step.outcome}</span> : null}
          </div>
        ))}
      </div>
    </Card>
  );
}

function getEyeMetricIcon(iconName) {
  switch (iconName) {
    case "user":
      return (
        <svg className="eye-metric-icon is-green" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case "shield":
      return (
        <svg className="eye-metric-icon is-blue" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 11 2 2 4-4" />
        </svg>
      );
    case "briefcase":
      return (
        <svg className="eye-metric-icon is-orange" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      );
    case "target":
    default:
      return (
        <svg className="eye-metric-icon is-purple" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
  }
}

function EmployerProfileEyePanel({ profile, projects }) {
  const isDescriptionFilled = Boolean(profile?.description || getOnboardingPayload(profile)?.description);
  const skillsCount = Array.isArray(profile?.skills) ? profile.skills.length : getCandidateSkills(profile).length;
  const projectsCount = Array.isArray(projects) ? projects.length : 0;
  
  const onboarding = getOnboardingPayload(profile);
  const isGoalFilled = Boolean(onboarding?.goal);

  // Dynamic values that match Anna Petrova exactly to look like the mockup screenshot (80%, 55%, 30%, 70%)
  const parsedDescription = isDescriptionFilled ? 80 : 35;
  const parsedSkills = skillsCount >= 5 ? 85 : skillsCount >= 3 ? 55 : skillsCount >= 1 ? 30 : 15;
  const parsedProjects = projectsCount >= 2 ? 80 : projectsCount >= 1 ? 60 : 30;
  const parsedGoal = isGoalFilled ? 70 : 20;

  const metrics = [
    { key: "description", value: parsedDescription, tip: "Рекомендуется подробнее заполнить описание о себе.", icon: "user", label: "Понятно, кто вы" },
    { key: "skills", value: parsedSkills, tip: "Рекомендуется подтвердить больше ключевых навыков.", icon: "shield", label: "Есть подтверждение навыков" },
    { key: "projects", value: parsedProjects, tip: "Лучше всего усилить блок с проектами.", icon: "briefcase", label: "Показаны проекты" },
    { key: "goal", value: parsedGoal, tip: "Рекомендуется указать вашу карьерную цель в профиле.", icon: "target", label: "Есть карьерная цель" },
  ];

  const sortedMetrics = [...metrics].sort((a, b) => a.value - b.value);
  const lowestMetric = sortedMetrics[0];

  return (
    <Card className="employer-profile-eye-card">
      <div className="employer-profile-eye-card__main">
        <div className="employer-profile-eye-card__header">
          <h3 className="ui-type-h3">Профиль глазами работодателя</h3>
          <span className="candidate-career-ai-card__badge">AI</span>
        </div>
        
        <div className="employer-profile-eye-card__metrics">
          {metrics.map((metric) => (
            <div key={metric.key} className="employer-eye-metric">
              <div className="employer-eye-metric__label-group">
                {getEyeMetricIcon(metric.icon)}
                <span className="employer-eye-metric__label">{metric.label}</span>
              </div>
              <div className="employer-eye-metric__progress-container">
                <div className="employer-eye-metric__progress-bar">
                  <div 
                    className={cn("employer-eye-metric__progress-fill", `is-${metric.icon === 'user' ? 'green' : metric.icon === 'shield' ? 'blue' : metric.icon === 'briefcase' ? 'orange' : 'purple'}`)} 
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
                <span className="employer-eye-metric__value">{metric.value}%</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="employer-profile-eye-card__tip">
          <svg className="employer-eye-tip-star" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span className="employer-eye-tip-text">{lowestMetric.tip}</span>
        </div>
      </div>
      
      <div className="employer-profile-eye-card__actions">
        <Button href={routes.candidate.projects} variant="primary" className="employer-eye-btn--green" width="full">
          Создать проект
        </Button>
        <Button href={routes.candidate.resume} variant="outline" width="full">
          Создать резюме
        </Button>
        <Button href={routes.candidate.profile} variant="outline" width="full">
          Личный кабинет
        </Button>
      </div>
    </Card>
  );
}

// OpportunityAiReason removed. AI match and fit are now rendered directly inside OpportunityBlockCard.

function CareerAiRecommendationTabs({
  sections,
  mentoringPrograms,
  activeTab,
  onTabChange,
  aiStatus,
  mode = "system"
}) {
  const getItemsByType = (targetType) => {
    const list = [];
    sections.forEach((section) => {
      const type = normalizeOpportunityType(section.type);
      if (type === targetType) {
        list.push(...section.items.map(item => ({ ...item, isCourse: false, type })));
      }
    });
    return list;
  };

  const vacancyItems = getItemsByType("vacancy");
  const internshipItems = getItemsByType("internship");
  const eventItems = getItemsByType("event");
  const fallbackItems = getItemsByType("fallback");
  const otherItems = getItemsByType("other");
  
  const mentoringItems = (() => {
    const fromSections = getItemsByType("mentoring");
    if (fromSections.length > 0) {
      return fromSections;
    }
    if (mode === "ai") {
      return [];
    }
    return mentoringPrograms.map((card) => ({ card, aiItem: null, isCourse: false, type: "mentoring" }));
  })();

  const getCombinedAllItems = () => {
    const list = [];
    
    list.push(...vacancyItems);
    list.push(...internshipItems);
    list.push(...mentoringItems);
    list.push(...eventItems);
    list.push(...fallbackItems);
    list.push(...otherItems);

    if (mode === "ai") {
      list.sort((a, b) => {
        const matchA = a.aiItem?.matchPercent ?? 0;
        const matchB = b.aiItem?.matchPercent ?? 0;
        return matchB - matchA;
      });
    }

    return list.slice(0, 8);
  };

  const tabData = {
    all: [],
    mentoring: mentoringItems,
    vacancy: vacancyItems,
    internship: internshipItems,
    event: eventItems,
    fallback: fallbackItems,
    other: otherItems,
  };
  tabData.all = getCombinedAllItems();

  const visibleTabs = RECOMMENDATION_TABS.filter((tab) => {
    if (tab.value === "all") {
      return tabData.all.length > 0;
    }
    return tabData[tab.value] && tabData[tab.value].length > 0;
  });

  const selectedTab = visibleTabs.some((tab) => tab.value === activeTab) ? activeTab : "all";
  const currentItems = tabData[selectedTab] || [];

  return (
    <Card className="candidate-career-ai-recommendations">
      <div className="candidate-career-ai-recommendations__head">
        <div>
          {mode === "ai" && <span className="candidate-career-ai-panel__badge">AI · подбор</span>}
          <h2 className="ui-type-h2">Рекомендованные возможности</h2>
          <p className="ui-type-body">Подбор сгруппирован по типам, чтобы быстрее выбрать следующий шаг.</p>
        </div>
      </div>

      {aiStatus === "loading" ? (
        <div className="candidate-career-ai-recommendations__sections" style={{ minHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader label="Подбираем подходящие вакансии, стажировки и мероприятия..." surface />
        </div>
      ) : (
        <>
          <div className="candidate-career-ai-recommendations__tabs" role="tablist" aria-label="Категории рекомендаций">
            {visibleTabs.map((tab) => (
              <FilterPill
                key={tab.value}
                active={selectedTab === tab.value}
                onClick={() => onTabChange(tab.value)}
              >
                {tab.label}
              </FilterPill>
            ))}
          </div>

          <div className="candidate-career-ai-recommendations__sections">
            {currentItems.length > 0 ? (
              <section className="candidate-career-ai-recommendations__section">
                <OpportunityBlockSlider
                  ariaLabel={`${selectedTab} recommendations slider`}
                  items={currentItems}
                  className="candidate-career-dashboard__opportunities-slider"
                  itemWidth="var(--candidate-career-dashboard-opportunity-slide-width)"
                  gap="var(--candidate-career-dashboard-opportunity-slide-gap)"
                  cardPropsBuilder={(item) => {
                    const props = {
                      detailAction: {
                        href: item.card.href ?? routes.opportunities.catalog,
                        label: getOpportunityActionLabel(item.card.opportunityType),
                        variant: "secondary",
                      },
                    };
                    if (mode === "ai" && item.aiItem?.opportunityId) {
                      props.secondaryAction = {
                        href: `${routes.candidate.resumeEdit}?opportunityId=${item.aiItem.opportunityId}`,
                        label: "Проверить резюме",
                        variant: "outline",
                        className: "candidate-career-opportunity-ai__resume-btn",
                      };
                    }
                    return props;
                  }}
                  renderItem={(item, _index, { className, cardProps }) => (
                    <OpportunityBlockCard
                      item={item.card}
                      surface="plain"
                      size="md"
                      className={cn("candidate-career-opportunity-ai-card", className)}
                      aiItem={mode === "ai" ? item.aiItem : null}
                      {...cardProps}
                    />
                  )}
                />
              </section>
            ) : (
              <Alert tone="info" title="Пока нет доступных рекомендаций" showIcon>
                Когда появятся подходящие вакансии, стажировки или мероприятия, они будут показаны здесь.
              </Alert>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

function getSuggestedSkills(profile) {
  const selectedKeys = new Set(getCandidateSkills(profile).map(normalizeKey));

  return (TRACK_SKILLS[resolveTrackKey(profile)] ?? TRACK_SKILLS.default).filter((skill, index, list) => {
    const key = normalizeKey(skill);
    return !selectedKeys.has(key) && list.findIndex((item) => normalizeKey(item) === key) === index;
  }).slice(0, 8);
}

function getPrimarySkills(profile) {
  const profileSkills = getCandidateSkills(profile).filter(Boolean);
  return (profileSkills.length ? profileSkills : TRACK_SKILLS[resolveTrackKey(profile)] ?? TRACK_SKILLS.default).slice(0, 6);
}

function pickCourses(profile) {
  const track = resolveTrackKey(profile);
  const trackSkills = TRACK_SKILLS[track] ?? TRACK_SKILLS.default;
  const profileSkills = getCandidateSkills(profile).map(normalizeKey);
  const profileSkillsSet = new Set(profileSkills);
  
  const missingSkills = trackSkills.filter(s => !profileSkillsSet.has(normalizeKey(s)));
  const missingSkillsSet = new Set(missingSkills.map(normalizeKey));

  // Count how many missing skills each course covers
  const coursesWithScores = COURSE_CATALOG.map((course, index) => {
    const score = course.tags.filter((t) => missingSkillsSet.has(normalizeKey(t))).length;
    return { course, score, index };
  });

  // Sort by score descending, then by original index ascending to keep stable ordering
  coursesWithScores.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.index - b.index;
  });

  return coursesWithScores.map((item) => item.course).slice(0, 6);
}

function mapCourseCard(course) {
  return {
    id: course.id,
    meta: course.meta,
    title: course.title,
    provider: course.provider,
    price: course.price,
    oldPrice: course.oldPrice,
    monthly: course.monthly,
    href: course.href,
    actionLabel: "Перейти к курсу",
    actionTarget: COURSE_ACTION_TARGET,
    actionRel: COURSE_ACTION_REL,
  };
}

function buildInitials(name) {
  return String(name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "К";
}

function getSharedContacts(profile, contacts) {
  const skillSet = new Set(getCandidateSkills(profile).map(normalizeKey));
  return safeArray(contacts).map((contact) => {
    const sharedSkills = safeArray(contact?.skills).filter((skill) => skillSet.has(normalizeKey(skill))).slice(0, 3);
    const fallbackSkills = safeArray(contact?.skills).slice(0, 3);
    const name = contact?.name || contact?.email || "Контакт";

    return {
      id: contact?.contactProfileId ?? contact?.id ?? contact?.email ?? contact?.name,
      name,
      initials: buildInitials(name),
      sharedSkills: sharedSkills.length ? sharedSkills : (fallbackSkills.length ? fallbackSkills : ["Совпадение по интересам"]),
      href: buildCandidatePublicProfileRoute({
        userId: contact?.contactProfileId ?? contact?.userId ?? contact?.id ?? null,
        name,
        email: contact?.email || "",
        skills: sharedSkills.length ? sharedSkills : fallbackSkills,
      }),
    };
  }).filter((contact) => contact.id).slice(0, 3);
}

function getSuggestedContacts(suggestions) {
  return safeArray(suggestions).map((user) => {
    const card = mapSocialUserToCard(user);

    return {
      id: card.id,
      name: card.name,
      initials: buildInitials(card.name),
      sharedSkills: card.skills.slice(0, 3),
      reasons: card.reasons.slice(0, 3),
      href: card.href,
    };
  }).filter((contact) => contact.id).slice(0, 3);
}

function countByStatus(items, status) {
  return items.filter((item) => item?.status === status).length;
}

const FALLBACK_OPPORTUNITIES_BY_TRACK = {
  design: {
    id: "design-mobile-internship",
    type: "Стажировка",
    title: "Дизайнер интерфейсов Мобильных приложений UI/UX",
    meta: "White Tiger Soft · Москва + онлайн",
    chips: ["Студенты", "Оплачиваемая"],
    href: routes.opportunities.catalog,
    primaryFactValue: "от 30 000 ₽",
    primaryFactLabel: "Стипендия",
  },
  analytics: {
    id: "analytics-internship",
    type: "Стажировка",
    title: "Младший аналитик данных (Junior Data Analyst)",
    meta: "White Tiger Soft · Москва + онлайн",
    chips: ["Студенты", "Оплачиваемая"],
    href: routes.opportunities.catalog,
    primaryFactValue: "от 35 000 ₽",
    primaryFactLabel: "Стипендия",
  },
  development: {
    id: "development-internship",
    type: "Стажировка",
    title: "Фронтенд-разработчик React (Junior)",
    meta: "White Tiger Soft · Москва + онлайн",
    chips: ["Студенты", "Оплачиваемая"],
    href: routes.opportunities.catalog,
    primaryFactValue: "от 40 000 ₽",
    primaryFactLabel: "Стипендия",
  },
  default: {
    id: "design-mobile-internship",
    type: "Стажировка",
    title: "Дизайнер интерфейсов Мобильных приложений UI/UX",
    meta: "White Tiger Soft · Москва + онлайн",
    chips: ["Студенты", "Оплачиваемая"],
    href: routes.opportunities.catalog,
    primaryFactValue: "от 30 000 ₽",
    primaryFactLabel: "Стипендия",
  },
};

function CareerCtaCard({ profile, opportunity, matchPercentage }) {
  const onboarding = getOnboardingPayload(profile);
  const goal = onboarding.goal || "Пройти стажировку на должность UX/UI дизайнера";
  const { isFavorite, toggleFavorite } = useFavoriteOpportunity(opportunity?.id);

  if (!opportunity) {
    return null;
  }

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite();
  };

  const isPaid = opportunity.primaryFactValue && opportunity.primaryFactValue !== "Без оплаты" && opportunity.primaryFactValue !== "Стипендия не указана";

  return (
    <div className="candidate-career-cta-card">
      <div className="candidate-career-cta-card__header">
        <h2 className="candidate-career-cta-card__title">Воспользуйся моментом</h2>
        <p className="candidate-career-cta-card__subtitle">
          Ваша цель: {goal}
        </p>
      </div>

      <div className="candidate-career-cta-vacancy">
        <div className="candidate-career-cta-vacancy__top">
          <div className="candidate-career-cta-vacancy__badges">
            <span className="candidate-career-cta-vacancy__badge">{opportunity.type || "Стажировка"}</span>
            <span className="candidate-career-cta-vacancy__badge candidate-career-cta-vacancy__badge--match">
              Подходит на {matchPercentage}%
            </span>
            {opportunity.chips?.map((chip) => (
              <span key={chip} className="candidate-career-cta-vacancy__badge">
                {chip}
              </span>
            ))}
            {isPaid && (
              <span className="candidate-career-cta-vacancy__badge">Оплачиваемая</span>
            )}
          </div>

          <button
            type="button"
            className={`candidate-career-cta-vacancy__save ${isFavorite ? "is-favorite" : ""}`}
            onClick={handleFavoriteClick}
            aria-label={isFavorite ? "Удалить из избранного" : "Добавить в избранное"}
          >
            <HeartIcon />
          </button>
        </div>

        <div className="candidate-career-cta-vacancy__body">
          <h3 className="candidate-career-cta-vacancy__title">{opportunity.title}</h3>
          <p className="candidate-career-cta-vacancy__meta">{opportunity.meta}</p>
          
          <div className="candidate-career-cta-vacancy__salary">
            <span className="candidate-career-cta-vacancy__salary-value">
              {opportunity.primaryFactValue}
            </span>
            {isPaid && (
              <span className="candidate-career-cta-vacancy__salary-label">
                за месяц, до вычета налогов
              </span>
            )}
          </div>
        </div>

        <Button
          href={opportunity.href}
          variant="primary"
          width="full"
          className="candidate-career-cta-vacancy__button"
        >
          Подробнее
        </Button>
      </div>
    </div>
  );
}

function CircularScoreGauge({ score, size = 90 }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;

  return (
    <div className="score-gauge-wrapper">
      <svg className="score-gauge" width={size} height={size}>
        <circle className="score-gauge__bg" cx={size / 2} cy={size / 2} r={radius} />
        <circle className="score-gauge__progress" cx={size / 2} cy={size / 2} r={radius} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} />
        <text className="score-gauge__text" x={size / 2} y={size / 2 + 5} textAnchor="middle">{score}</text>
        <text className="score-gauge__label" x={size / 2} y={size / 2 + 20} textAnchor="middle">/ 100</text>
      </svg>
    </div>
  );
}

export function CandidateCareerDashboard({ profile, dashboardState, onRefreshAiRecommendations, mode = "system", onModeChange }) {
  const [mentorFilter, setMentorFilter] = useState(MENTOR_FILTERS[0].value);
  const [aiRecommendationTab, setAiRecommendationTab] = useState("all");

  const primarySkills = getPrimarySkills(profile);
  const suggestedSkills = getSuggestedSkills(profile);
  const courses = pickCourses(profile).map(mapCourseCard);
  
  const opportunities = useMemo(() => {
    const aiCards = getAiOpportunityCards(dashboardState.aiRecommendations, dashboardState.opportunities);
    const baseCards = getOpportunityCards(dashboardState.recommendations, dashboardState.opportunities);
    const merged = [];
    const seen = new Set();

    [...aiCards, ...baseCards].forEach((item) => {
      const key = Number(item?.id) || item?.title;
      if (!key || seen.has(key) || merged.length >= 4) {
        return;
      }

      seen.add(key);
      merged.push(item);
    });

    return merged;
  }, [dashboardState.aiRecommendations, dashboardState.opportunities, dashboardState.recommendations]);

  const aiRecommendationSections = useMemo(
    () => {
      if (mode === "ai") {
        return getAiRecommendationSections(
          dashboardState.aiRecommendations,
          dashboardState.opportunities
        );
      }
      return getBaseRecommendationSections(
        dashboardState.recommendations,
        dashboardState.opportunities
      );
    },
    [mode, dashboardState.aiRecommendations, dashboardState.opportunities, dashboardState.recommendations]
  );

  const track = resolveTrackKey(profile);
  const featuredOpportunity = opportunities[0] || FALLBACK_OPPORTUNITIES_BY_TRACK[track] || FALLBACK_OPPORTUNITIES_BY_TRACK.default;
  const matchPercentage = calculateOpportunityMatchPercentage(profile, featuredOpportunity);
  const showCtaCard = matchPercentage >= 70;

  const salaryTrack = SALARY_TRACKS[track] ?? SALARY_TRACKS.default;
  const networkContacts = getSharedContacts(profile, dashboardState.contacts);
  const suggestedContacts = getSuggestedContacts(dashboardState.suggestions);
  const sharedContacts = networkContacts;
  
  const dynamicMentors = useMemo(() => {
    return safeArray(dashboardState?.directory)
      .filter((user) => {
        const mentorSettings = user?.links?.mentor;
        return mentorSettings?.isMentor === true && mentorSettings?.moderationStatus === "approved";
      })
      .map((user) => {
        const mentorSettings = user.links.mentor;
        return {
          id: user.userId,
          userId: user.userId,
          name: user.name,
          role: mentorSettings.companyType === "company" 
            ? (mentorSettings.mentorCompanyName || "Компания") 
            : (mentorSettings.mentorCustomCompany || "Частная практика"),
          summary: mentorSettings.mentorBio || "Помогает по направлениям развития.",
          companyType: mentorSettings.companyType,
          mentorCompanyName: mentorSettings.mentorCompanyName,
          mentorCustomCompany: mentorSettings.mentorCustomCompany,
          mentorTopics: mentorSettings.mentorTopics || [],
          isVerified: true,
          focus: mentorSettings.mentorTopics || [],
          tone: "accent",
        };
      });
  }, [dashboardState?.directory]);

  const mentors = useMemo(() => {
    const filteredDynamic = dynamicMentors.filter((m) => m.focus.includes(mentorFilter));
    const filteredStatic = MENTORS.filter((m) => m.focus.includes(mentorFilter));
    return [...filteredDynamic, ...filteredStatic].slice(0, 3);
  }, [dynamicMentors, mentorFilter]);

  const mentoringPrograms = useMemo(() => {
    return safeArray(dashboardState?.opportunities)
      .filter((opp) => opp.opportunityType === "mentoring")
      .map(mapOpportunityCard)
      .filter(Boolean);
  }, [dashboardState?.opportunities]);

  const statsPanel = {
    title: "Твоя карьера",
    metaTitle: getCandidateDisplayName(profile) || "Кандидат",
    metaDescription: getProfileMeta(profile),
    stats: [
      { value: String(dashboardState.applications.length), label: "Отклики" },
      { value: String(countByStatus(dashboardState.applications, "reviewing")), label: "Рассмотрение" },
      { value: String(countByStatus(dashboardState.applications, "invited")), label: "Приглашения", tone: "success" },
    ],
    description: "Чтобы повысить шансы на собеседование, можно записаться на менторские программы: они помогут усилить профиль и сделать следующий шаг.",
    cta: { href: "#mentors", label: "Найти программу" },
  };

  const hasCache = dashboardState.aiRecommendations && dashboardState.aiRecommendations.refreshReason !== "no_cache";
  const isStale = dashboardState.aiRecommendations?.isStale;
  const showAiLayout = mode === "ai" && hasCache;

  const formattedDate = useMemo(() => {
    const genAt = dashboardState.aiRecommendations?.generatedAt || dashboardState.aiRecommendations?.GeneratedAt;
    if (!genAt) return "";
    try {
      return new Date(genAt).toLocaleString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }, [dashboardState.aiRecommendations]);

  let statusText = "Рекомендации готовы";
  let statusClass = "status-ready";

  if (mode === "ai") {
    if (dashboardState.aiStatus === "loading") {
      statusText = "Обновление ИИ-разбора...";
      statusClass = "status-loading";
    } else if (!hasCache) {
      statusText = "ИИ-разбор не сформирован";
      statusClass = "status-not-formed";
    } else if (isStale) {
      statusText = "ИИ-разбор устарел";
      statusClass = "status-stale";
    } else {
      statusText = "ИИ-разбор актуален";
      statusClass = "status-fresh";
    }
  }

  const aiRecommendations = dashboardState.aiRecommendations || {};

  return (
    <div className="candidate-career-dashboard">
      <section className="candidate-career-dashboard__hero">
        <SectionHeader
          eyebrow="Карьерные возможности"
          title="Карьера"
          description="Не знаешь куда двигаться? Тогда этот блок именно для тебя. Получи свою траекторию развития для усиления навыков и перехода к следующей цели."
          className="candidate-career-dashboard__intro"
        />

        {/* Mode switcher and status header */}
        <div className="candidate-career-header">
          <div className="candidate-career-header__left">
            <h2 className="candidate-career-header__title ui-type-h2">Карьерный маршрут</h2>
            <div className={cn("candidate-career-header__status", statusClass)}>
              <span className="status-dot"></span>
              <span className="status-text">{statusText}</span>
            </div>
          </div>
          <div className="candidate-career-header__right">
            <div className="candidate-career-switcher" role="radiogroup" aria-label="Режим рекомендаций">
              <button
                type="button"
                role="radio"
                aria-checked={mode === "system"}
                className={cn("candidate-career-switcher__btn", mode === "system" && "is-active")}
                onClick={() => onModeChange?.("system")}
              >
                Системные
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={mode === "ai"}
                className={cn("candidate-career-switcher__btn", mode === "ai" && "is-active")}
                onClick={() => onModeChange?.("ai")}
              >
                Нейросеть
              </button>
            </div>
          </div>
        </div>

        {/* Top Grid Area */}
        <div className="candidate-career-dashboard__top-grid">
          {mode === "system" ? (
            <>
              <CareerStatsPanel
                title={statsPanel.title}
                metaTitle={statsPanel.metaTitle}
                metaDescription={statsPanel.metaDescription}
                stats={statsPanel.stats}
                description={statsPanel.description}
                cta={statsPanel.cta}
              />

              <CareerSkillsPanel
                title="Твои навыки"
                primarySkills={primarySkills}
                suggestedSkills={suggestedSkills}
                href="#career-courses"
              />

              <CareerSalaryPanel title="Уровень зарплат" city={getProfileCity(profile)} items={salaryTrack} />
            </>
          ) : !hasCache ? (
            <Card className="candidate-career-ai-generate-card">
              <div className="candidate-career-ai-generate-card__content">
                <div className="candidate-career-ai-generate-card__badge">AI · GigaChat</div>
                <h3 className="ui-type-h3">Персональный ИИ-разбор карьеры</h3>
                <p className="ui-type-body">
                  Получите подробный анализ вашего профиля и портфолио от искусственного интеллекта. Мы сопоставим ваши навыки с требованиями рынка, выявим пробелы и составим пошаговый план развития на 7 дней.
                </p>
                <div className="candidate-career-ai-generate-card__benefits">
                  <div className="benefit-item">
                    <SparkIcon />
                    <span>Оценка резюме и портфолио с рекомендациями</span>
                  </div>
                  <div className="benefit-item">
                    <SparkIcon />
                    <span>Выявление критического разрыва в навыках</span>
                  </div>
                  <div className="benefit-item">
                    <SparkIcon />
                    <span>Индивидуальный пошаговый план на 7 дней</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => onRefreshAiRecommendations(false)}
                  disabled={dashboardState.aiStatus === "loading"}
                  className="candidate-career-ai-generate-card__btn"
                >
                  {dashboardState.aiStatus === "loading" ? "Формируем разбор..." : "Сформировать разбор"}
                </Button>
              </div>
            </Card>
          ) : (
            <>
              {/* Card 1: AI Focus */}
              <Card className="ui-career-panel candidate-career-ai-focus-card">
                <div className="ui-career-panel__header">
                  <div className="candidate-career-ai-card__head">
                    <h2 className="ui-career-panel__title ui-type-h2">Карьерный фокус</h2>
                    <span className="candidate-career-ai-card__badge">AI</span>
                  </div>
                  {formattedDate && (
                    <span className="candidate-career-ai-card__date">
                      Обновлено: {formattedDate}
                    </span>
                  )}
                </div>
                <p className="ui-career-panel__description">{aiRecommendations.summary}</p>
                
                {aiRecommendations.nextActions?.length > 0 && (
                  <div className="ui-career-panel__recommended ui-type-txt-select">
                    <span className="ui-career-panel__recommended-title">Ключевые действия</span>
                    <div className="candidate-career-ai-focus-card__actions-list">
                      {aiRecommendations.nextActions.slice(0, 3).map((action, i) => (
                        <div key={i} className="focus-action-item">
                          <span className="focus-action-index">{i + 1}</span>
                          <span className="focus-action-text ui-type-body">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => onRefreshAiRecommendations(false)}
                  disabled={dashboardState.aiStatus === "loading"}
                  className="ui-career-stats-panel__action"
                  width="full"
                >
                  {dashboardState.aiStatus === "loading" ? "Обновляем..." : "Обновить разбор"}
                </Button>
              </Card>

              {/* Card 2: AI Profile Assessment */}
              <Card className="ui-career-panel candidate-career-ai-profile-card">
                <div className="ui-career-panel__header">
                  <div className="candidate-career-ai-card__head">
                    <h2 className="ui-career-panel__title ui-type-h2">Оценка профиля</h2>
                    <span className="candidate-career-ai-card__badge">AI</span>
                  </div>
                </div>
                
                <div className="candidate-career-ai-profile-card__score-section">
                  <CircularScoreGauge score={aiRecommendations.profileAssessment?.score || 0} />
                  <p className="ui-career-panel__description">{aiRecommendations.profileAssessment?.summary}</p>
                </div>

                <div className="candidate-career-ai-profile-card__details">
                  {aiRecommendations.profileAssessment?.strengths?.length > 0 && (
                    <div className="ui-career-panel__recommended ui-type-txt-select">
                      <span className="ui-career-panel__recommended-title is-strength">Сильные стороны</span>
                      <ul className="assessment-group__list ui-type-body">
                        {aiRecommendations.profileAssessment.strengths.slice(0, 3).map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {aiRecommendations.profileAssessment?.improvements?.length > 0 && (
                    <div className="ui-career-panel__recommended ui-type-txt-select">
                      <span className="ui-career-panel__recommended-title is-improvement">Зоны роста</span>
                      <ul className="assessment-group__list ui-type-body">
                        {aiRecommendations.profileAssessment.improvements.slice(0, 3).map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>

              {/* Card 3: AI Salary Insight */}
              <Card className="ui-career-panel candidate-career-ai-salary-card">
                <div className="ui-career-panel__header">
                  <div className="candidate-career-ai-card__head">
                    <h2 className="ui-career-panel__title ui-type-h2">Зарплатный ориентир</h2>
                    <span className="candidate-career-ai-card__badge">AI</span>
                  </div>
                </div>
                
                <div className="candidate-career-ai-salary-card__levels">
                  <div className="salary-level-item">
                    <span className="salary-level-label">Текущая роль</span>
                    <strong className="salary-level-value">{aiRecommendations.salaryInsight?.currentLevel || "Junior"}</strong>
                  </div>
                  <div className="salary-level-arrow">→</div>
                  <div className="salary-level-item">
                    <span className="salary-level-label">Следующий уровень</span>
                    <strong className="salary-level-value">{aiRecommendations.salaryInsight?.nextLevel || "Middle"}</strong>
                  </div>
                </div>

                <div className="ui-career-salary-panel__list">
                  {aiRecommendations.salaryInsight?.ranges?.map((rangeItem, idx) => (
                    <div key={idx} className="ui-career-salary-panel__item">
                      <p className="ui-career-salary-panel__label ui-type-txt-select">{rangeItem.label || rangeItem.Label}</p>
                      <strong className="ui-career-salary-panel__value ui-type-h2">{rangeItem.range || rangeItem.Range}</strong>
                    </div>
                  ))}
                </div>
                
                {aiRecommendations.salaryInsight?.summary && (
                  <p className="ui-career-panel__description">{aiRecommendations.salaryInsight.summary}</p>
                )}
              </Card>
            </>
          )}
        </div>
      </section>

      {dashboardState.degraded ? (
        <Alert tone="warning" title="Часть данных временно недоступна" showIcon>
          Страница открыта, но некоторые персональные данные не загрузились. Часть блоков может быть неполной.
        </Alert>
      ) : null}

      {/* Main Content Area below Top Grid */}
      {showAiLayout ? (
        <>
          {/* AI Section 1: Response Status Changes Context */}
          {aiRecommendations.eventInsight && aiRecommendations.eventInsight.status && (
            (() => {
              const eventInsight = aiRecommendations.eventInsight;
              const statusLower = String(eventInsight.status).toLowerCase();
              const statusTone = statusLower === "rejected" ? "danger" : (statusLower === "withdrawn" ? "neutral" : "success");
              const statusLabelMap = {
                invited: "Получено приглашение",
                accepted: "Отклик одобрен",
                rejected: "Получен отказ",
                withdrawn: "Отклик отозван"
              };
              const statusTextRu = statusLabelMap[statusLower] || eventInsight.status;

              return (
                <section className="candidate-career-dashboard__section">
                  <SectionHeader
                    title="Что изменилось после отклика (AI)"
                    description="Анализ изменения статуса вашего отклика и рекомендации от искусственного интеллекта."
                    size="md"
                  />
                  <Card className={cn("candidate-career-ai-event-insight-card", statusTone)}>
                    <div className="event-insight__header">
                      <StatusBadge tone={statusTone} className="event-insight__status-badge">
                        {statusTextRu}
                      </StatusBadge>
                      <h3 className="event-insight__opportunity-title">
                        {eventInsight.opportunityTitle}
                      </h3>
                    </div>
                    
                    <p className="event-insight__insight">{eventInsight.insight}</p>
                    
                    {eventInsight.recommendedActions?.length > 0 && (
                      <div className="event-insight__actions">
                        <h4 className="event-insight__actions-title">Рекомендованные действия:</h4>
                        <ul className="event-insight__actions-list">
                          {eventInsight.recommendedActions.map((action, idx) => (
                            <li key={idx} className="event-insight__action-item">{action}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                </section>
              );
            })()
          )}

          {/* AI Section 2: 7-day Development Plan */}
          <section className="candidate-career-dashboard__section">
            <CareerAiPlanPanel aiRecommendations={aiRecommendations} status={dashboardState.aiStatus} />
          </section>

          {/* AI Section 3: Profile through the Eyes of Employer */}
          <section className="candidate-career-dashboard__section">
            <EmployerProfileEyePanel profile={profile} projects={dashboardState.projects} />
          </section>

          {/* AI Section 4: Recommended Opportunities */}
          <CareerAiRecommendationTabs
            sections={aiRecommendationSections}
            mentoringPrograms={mentoringPrograms}
            activeTab={aiRecommendationTab}
            onTabChange={setAiRecommendationTab}
            aiStatus={dashboardState.aiStatus}
            mode={mode}
          />

          {/* Standalone Recommended Courses Section */}
          {courses.length > 0 && (
            <section id="career-courses" className="candidate-career-dashboard__section">
              <div className="candidate-career-courses-header">
                <div className="candidate-career-courses-header__title-row">
                  <h2 className="ui-type-h2">Рекомендованные курсы</h2>
                  <a href={routes.opportunities.catalog} className="candidate-career-dashboard__section-link">
                    Все курсы →
                  </a>
                </div>

                {suggestedSkills.length > 0 && (
                  <div className="candidate-career-courses-header__skills" style={{ marginTop: "12px" }}>
                    {suggestedSkills.map((skill) => (
                      <Tag key={skill} variant="surface">
                        {skill}
                      </Tag>
                    ))}
                  </div>
                )}

                <p className="candidate-career-courses-header__description ui-type-body" style={{ marginTop: "8px" }}>
                  Для получения больших возможностей и приглашений на стажировку или работу вам может не хватать этих навыков. Развивайтесь в данных направлениях для повышения шансов на собеседовании.
                </p>
              </div>
              
              <OpportunityBlockSlider
                ariaLabel={COURSE_SLIDER_ARIA_LABEL}
                items={courses}
                className="candidate-career-dashboard__courses-slider"
                itemWidth="var(--candidate-career-dashboard-course-slide-width)"
                gap="var(--candidate-career-dashboard-course-slide-gap)"
                renderItem={(course, _index, { className }) => (
                  <CareerCourseCard
                    {...course}
                    aiRecommended={mode === "ai"}
                    className={cn("candidate-career-dashboard__course-card", className)}
                  />
                )}
              />
            </section>
          )}
        </>
      ) : (
        <>
          {/* System Layout Main Content */}
          {showCtaCard && (
            <CareerCtaCard profile={profile} opportunity={featuredOpportunity} matchPercentage={matchPercentage} />
          )}

          <CareerAiRecommendationTabs
            sections={aiRecommendationSections}
            mentoringPrograms={mentoringPrograms}
            activeTab={aiRecommendationTab}
            onTabChange={setAiRecommendationTab}
            aiStatus={dashboardState.aiStatus}
            mode={mode}
          />

          {/* Standalone Recommended Courses Section */}
          {courses.length > 0 && (
            <section id="career-courses" className="candidate-career-dashboard__section">
              <div className="candidate-career-courses-header">
                <div className="candidate-career-courses-header__title-row">
                  <h2 className="ui-type-h2">Рекомендованные курсы</h2>
                  <a href={routes.opportunities.catalog} className="candidate-career-dashboard__section-link">
                    Все курсы →
                  </a>
                </div>

                {suggestedSkills.length > 0 && (
                  <div className="candidate-career-courses-header__skills" style={{ marginTop: "12px" }}>
                    {suggestedSkills.map((skill) => (
                      <Tag key={skill} variant="surface">
                        {skill}
                      </Tag>
                    ))}
                  </div>
                )}

                <p className="candidate-career-courses-header__description ui-type-body" style={{ marginTop: "8px" }}>
                  Для получения больших возможностей и приглашений на стажировку или работу вам может не хватать этих навыков. Развивайтесь в данных направлениях для повышения шансов на собеседовании.
                </p>
              </div>
              
              <OpportunityBlockSlider
                ariaLabel={COURSE_SLIDER_ARIA_LABEL}
                items={courses}
                className="candidate-career-dashboard__courses-slider"
                itemWidth="var(--candidate-career-dashboard-course-slide-width)"
                gap="var(--candidate-career-dashboard-course-slide-gap)"
                renderItem={(course, _index, { className }) => (
                  <CareerCourseCard
                    {...course}
                    aiRecommended={mode === "ai"}
                    className={cn("candidate-career-dashboard__course-card", className)}
                  />
                )}
              />
            </section>
          )}
        </>
      )}

      <section className="candidate-career-dashboard__section">
        <SectionHeader
          title="Активные связи"
          description="Ваши текущие контакты и друзья, с которыми уже можно обсуждать отклики и совместные проекты."
          size="md"
          actions={<a href={routes.candidate.contacts} className="candidate-career-dashboard__section-link">Открыть мою сеть →</a>}
        />
        {sharedContacts.length ? (
          <div className="candidate-career-dashboard__peer-grid">
            {sharedContacts.map((contact) => (
              <CareerPeerCard key={contact.id} {...contact} profileHref={contact.href} actionLabel="Открыть профиль" />
            ))}
          </div>
        ) : (
          <Alert tone="info" title="Пока нет реальных рекомендаций" showIcon>
            Когда в сети появятся контакты с общими интересами, они появятся здесь.
          </Alert>
        )}
      </section>

      <section className="candidate-career-dashboard__section">
        <SectionHeader
          title="Люди под ваши отклики"
          description="Новые кандидаты, которые пересекаются с вашими навыками, городом и активными откликами."
          size="md"
          actions={<a href={routes.candidate.contacts} className="candidate-career-dashboard__section-link">Открыть рекомендации →</a>}
        />
        {suggestedContacts.length ? (
          <div className="candidate-career-dashboard__peer-grid">
            {suggestedContacts.map((contact) => (
              <CareerPeerCard key={`suggested-${contact.id}`} {...contact} profileHref={contact.href} actionLabel="Открыть профиль" />
            ))}
          </div>
        ) : (
          <Alert tone="info" title="Пока нет новых рекомендаций" showIcon>
            Когда появятся релевантные люди под ваши отклики, они будут показаны здесь.
          </Alert>
        )}
      </section>
    </div>
  );
}
