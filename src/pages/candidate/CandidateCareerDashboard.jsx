import { useMemo, useState } from "react";
import { buildCandidatePublicProfileRoute, buildOpportunityDetailRoute, routes, withSearch } from "../../app/routes";
import { getCandidateDisplayName, getCandidateSkills } from "../../candidate-portal/mappers";
import { mapSocialUserToCard } from "../../candidate-portal/social";
import { OpportunityBlockSlider } from "../../components/opportunities";
import { OpportunityBlockCard } from "../../components/opportunities/OpportunityCard";
import { getOpportunityCardPresentation } from "../../shared/lib/opportunityPresentation";
import { useFavoriteOpportunity } from "../../features/favorites/useFavoriteOpportunity";
import { cn } from "../../lib/cn";
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
  Tag,
} from "../../shared/ui";

const COURSE_SLIDER_ARIA_LABEL = "Career courses slider";
const OPPORTUNITY_SLIDER_ARIA_LABEL = "Career opportunities slider";
const COURSE_ACTION_TARGET = "_blank";
const COURSE_ACTION_REL = "noreferrer";
const MENTOR_CATALOG_HREF = `${routes.opportunities.catalog}?type=mentoring`;

const AI_RECOMMENDATION_TABS = [
  { value: "all", label: "Все" },
  { value: "vacancy", label: "Вакансии" },
  { value: "internship", label: "Стажировки" },
  { value: "event", label: "Мероприятия" },
  { value: "mentoring", label: "Менторство" },
  { value: "course", label: "Курсы" },
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

function normalizeOpportunityType(value) {
  const normalized = String(value ?? "").trim().toLowerCase();

  if (["job", "vacancy"].includes(normalized)) return "vacancy";
  if (normalized === "internship") return "internship";
  if (normalized === "event") return "event";
  if (["mentor", "mentoring"].includes(normalized)) return "mentoring";
  if (["course", "courses"].includes(normalized)) return "course";
  if (normalized === "fallback") return "fallback";

  return "other";
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
      return "Менторство";
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
      const key = type === "other" ? "vacancy" : type;

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

  return Object.values(
    merged.reduce((acc, item) => {
      const type = normalizeOpportunityType(item.card.opportunityType);
      const key = type === "other" ? "vacancy" : type;

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
          <span className="candidate-career-ai-panel__badge">AI · план</span>
          <h3 className="ui-type-h3">Мини-план на 7 дней</h3>
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
        <span className="candidate-career-ai-panel__badge">AI · план</span>
        <h3 className="ui-type-h3">Мини-план на 7 дней</h3>
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

// OpportunityAiReason removed. AI match and fit are now rendered directly inside OpportunityBlockCard.

function CareerAiRecommendationTabs({ sections, courses, activeTab, onTabChange, aiStatus }) {
  const visibleTabs = AI_RECOMMENDATION_TABS.filter((tab) => {
    if (tab.value === "all") {
      return true;
    }

    if (tab.value === "course") {
      return courses.length > 0;
    }

    return sections.some((section) => normalizeOpportunityType(section.type) === tab.value && section.items.length > 0);
  });

  const selectedTab = visibleTabs.some((tab) => tab.value === activeTab) ? activeTab : "all";
  const visibleSections = selectedTab === "all"
    ? sections
    : sections.filter((section) => normalizeOpportunityType(section.type) === selectedTab);
  const showCourses = courses.length > 0 && (selectedTab === "all" || selectedTab === "course");

  return (
    <Card className="candidate-career-ai-recommendations">
      <div className="candidate-career-ai-recommendations__head">
        <div>
          <span className="candidate-career-ai-panel__badge">AI · подбор</span>
          <h2 className="ui-type-h2">Рекомендованные возможности</h2>
          <p className="ui-type-body">Подбор сгруппирован по типам, чтобы быстрее выбрать следующий шаг.</p>
        </div>
      </div>

      {aiStatus === "loading" ? (
        <div className="candidate-career-ai-recommendations__sections" style={{ minHeight: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Loader label="ИИ подбирает подходящие вакансии, стажировки и мероприятия..." surface />
        </div>
      ) : (
        <>
          <div className="candidate-career-ai-recommendations__tabs" role="tablist" aria-label="AI категории рекомендаций">
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
            {visibleSections.map((section) => (
              <section key={section.type} className="candidate-career-ai-recommendations__section">
                <OpportunityBlockSlider
                  ariaLabel={`${section.title || section.type} AI slider`}
                  items={section.items}
                  className="candidate-career-dashboard__opportunities-slider"
                  itemWidth="var(--candidate-career-dashboard-opportunity-slide-width)"
                  gap="var(--candidate-career-dashboard-opportunity-slide-gap)"
                  cardPropsBuilder={(item) => ({
                    detailAction: {
                      href: item.card.href ?? routes.opportunities.catalog,
                      label: getOpportunityActionLabel(item.card.opportunityType),
                      variant: "secondary",
                    },
                  })}
                  renderItem={(item, _index, { className, cardProps }) => (
                    <OpportunityBlockCard
                      item={item.card}
                      surface="plain"
                      size="md"
                      className={cn("candidate-career-opportunity-ai-card", className)}
                      aiItem={item.aiItem}
                      {...cardProps}
                    />
                  )}
                />
              </section>
            ))}

            {showCourses ? (
              <section className="candidate-career-ai-recommendations__section">
                <SectionHeader
                  title="Рекомендованные курсы (ИИ)"
                  size="md"
                  actions={<a href="#career-courses" className="candidate-career-dashboard__section-link">К разделу курсов →</a>}
                />
                <OpportunityBlockSlider
                  ariaLabel="AI courses slider"
                  items={courses.slice(0, 4)}
                  className="candidate-career-dashboard__courses-slider"
                  itemWidth="var(--candidate-career-dashboard-course-slide-width)"
                  gap="var(--candidate-career-dashboard-course-slide-gap)"
                  renderItem={(course, _index, { className }) => (
                    <CareerCourseCard
                      {...course}
                      aiRecommended
                      className={[className, "candidate-career-dashboard__course-card"].filter(Boolean).join(" ")}
                    />
                  )}
                />
              </section>
            ) : null}

            {!visibleSections.length && !showCourses ? (
              <Alert tone="info" title="Пока нет доступных рекомендаций" showIcon>
                Когда появятся подходящие вакансии, стажировки или мероприятия, они будут показаны здесь.
              </Alert>
            ) : null}
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
          Откликнуться
        </Button>
      </div>
    </div>
  );
}

export function CandidateCareerDashboard({ profile, dashboardState, onRefreshAiRecommendations }) {
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
  const aiRecommendationSections = useMemo(() => {
    const sections = getAiRecommendationSections(dashboardState.aiRecommendations, dashboardState.opportunities);

    if (sections.length) {
      return sections;
    }

    return getBaseRecommendationSections(
      dashboardState.recommendations,
      dashboardState.opportunities,
      normalizeAiRecommendationItems(dashboardState.aiRecommendations)
    );
  }, [dashboardState.aiRecommendations, dashboardState.opportunities, dashboardState.recommendations]);
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

  return (
    <div className="candidate-career-dashboard">
      <section className="candidate-career-dashboard__hero">
        <SectionHeader
          eyebrow="Карьерные возможности"
          title="Карьера"
          description="Не знаешь куда двигаться? Тогда этот блок именно для тебя. Получи свою траекторию развития для усиления навыков и перехода к следующей цели."
          className="candidate-career-dashboard__intro"
        />
        {showCtaCard && (
          <CareerCtaCard profile={profile} opportunity={featuredOpportunity} matchPercentage={matchPercentage} />
        )}

        <div className="candidate-career-dashboard__top-grid">
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
        </div>

        <CareerAiInsightPanel
          aiRecommendations={dashboardState.aiRecommendations}
          status={dashboardState.aiStatus}
          error={dashboardState.aiError}
          onRefresh={onRefreshAiRecommendations}
        />
        <CareerAiPlanPanel aiRecommendations={dashboardState.aiRecommendations} status={dashboardState.aiStatus} />
      </section>

      {dashboardState.degraded ? (
        <Alert tone="warning" title="Часть данных временно недоступна" showIcon>
          Страница открыта, но некоторые персональные данные не загрузились. Часть блоков может быть неполной.
        </Alert>
      ) : null}

      <section id="career-courses" className="candidate-career-dashboard__section">
        <div className="candidate-career-courses-header">
          <div className="candidate-career-courses-header__title-row">
            <h2 className="ui-type-h2">
              Для получения больших возможностей и приглашений на стажировку или работу вам не хватает таких навыков:
            </h2>
            <a href={routes.opportunities.catalog} className="candidate-career-dashboard__section-link">
              Все курсы →
            </a>
          </div>

          {suggestedSkills.length > 0 && (
            <div className="candidate-career-courses-header__skills">
              {suggestedSkills.map((skill) => (
                <Tag key={skill} variant="surface">
                  {skill}
                </Tag>
              ))}
            </div>
          )}

          <p className="candidate-career-courses-header__description ui-type-body">
            Развивайтесь в данных направлениях для повышения шансов на собеседовании.
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
              className={[className, "candidate-career-dashboard__course-card"].filter(Boolean).join(" ")}
            />
          )}
        />
      </section>

      <CareerAiRecommendationTabs
        sections={aiRecommendationSections}
        courses={courses}
        activeTab={aiRecommendationTab}
        onTabChange={setAiRecommendationTab}
        aiStatus={dashboardState.aiStatus}
      />

      <section className="candidate-career-dashboard__section" id="mentors">
        <SectionHeader
          title="Менторские программы"
          description="Программы долгосрочного развития от компаний и экспертов."
          size="md"
          actions={(
            <a href={MENTOR_CATALOG_HREF} className="candidate-career-dashboard__section-link">
              Все программы →
            </a>
          )}
        />
        {mentoringPrograms.length ? (
          <OpportunityBlockSlider
            ariaLabel="Mentoring programs slider"
            items={mentoringPrograms}
            className="candidate-career-dashboard__opportunities-slider"
            itemWidth="var(--candidate-career-dashboard-opportunity-slide-width)"
            gap="var(--candidate-career-dashboard-opportunity-slide-gap)"
            cardPropsBuilder={(item) => ({
              detailAction: {
                href: item.href ?? routes.opportunities.catalog,
                label: "Подробнее",
                variant: "secondary",
              },
            })}
          />
        ) : (
          <Alert tone="info" title="Пока нет доступных менторских программ" showIcon>
            Когда компании опубликуют новые программы менторства, они появятся здесь.
          </Alert>
        )}
      </section>

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
