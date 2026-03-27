import { useMemo, useState } from "react";
import { buildOpportunityDetailRoute, routes } from "../../app/routes";
import { getCandidateDisplayName, getCandidateSkills } from "../../candidate-portal/mappers";
import { OpportunityBlockSlider } from "../../components/opportunities";
import {
  Alert,
  CareerCourseCard,
  CareerMentorCard,
  CareerPeerCard,
  CareerSalaryPanel,
  CareerSkillsPanel,
  CareerStatsPanel,
  FilterPill,
  SectionHeader,
} from "../../shared/ui";

const COURSE_SLIDER_ARIA_LABEL = "Career courses slider";
const OPPORTUNITY_SLIDER_ARIA_LABEL = "Career opportunities slider";

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
  { id: "ai-design", title: "Нейросети для дизайна", provider: "Яндекс Практикум", meta: "Продвинутый · 3 мес + онлайн", price: "40 000 ₽", oldPrice: "82 000 ₽", monthly: "2325 ₽ в месяц", tags: ["design", "default"] },
  { id: "illustrator", title: "Adobe Illustrator с нуля", provider: "Skillbox", meta: "С нуля · 2 мес + онлайн", price: "25 000 ₽", oldPrice: "82 000 ₽", monthly: "825 ₽ в месяц", tags: ["design", "default"] },
  { id: "typography", title: "Типографика и вёрстка: внимание к типу", provider: "Skillbox", meta: "С нуля · 1 мес + онлайн", price: "20 000 ₽", oldPrice: "82 000 ₽", monthly: "755 ₽ в месяц", tags: ["design", "development"] },
  { id: "graphic-design", title: "Ускоренный курс по графическому дизайну", provider: "Skillbox", meta: "С нуля · 4 мес + онлайн", price: "78 000 ₽", oldPrice: "82 000 ₽", monthly: "3755 ₽ в месяц", tags: ["design", "default"] },
  { id: "product-analytics", title: "Продуктовая аналитика", provider: "Practicum", meta: "База · 3 мес + онлайн", price: "58 000 ₽", oldPrice: "81 000 ₽", monthly: "4100 ₽ в месяц", tags: ["analytics", "default"] },
  { id: "frontend", title: "Frontend-разработка с React", provider: "HTML Academy", meta: "Интенсив · 4 мес + онлайн", price: "69 000 ₽", oldPrice: "94 000 ₽", monthly: "5200 ₽ в месяц", tags: ["development", "default"] },
  { id: "brand-identity", title: "\u0411\u0440\u0435\u043d\u0434-\u0434\u0438\u0437\u0430\u0439\u043d \u0438 \u0430\u0439\u0434\u0435\u043d\u0442\u0438\u043a\u0430", provider: "Bang Bang Education", meta: "\u0421 \u043d\u0443\u043b\u044f \u00b7 3 \u043c\u0435\u0441 + \u043e\u043d\u043b\u0430\u0439\u043d", price: "54 000 \u20bd", oldPrice: "71 000 \u20bd", monthly: "2250 \u20bd \u0432 \u043c\u0435\u0441\u044f\u0446", tags: ["design", "default"] },
  { id: "motion-design", title: "\u041c\u043e\u0443\u0448\u043d-\u0434\u0438\u0437\u0430\u0439\u043d \u0434\u043b\u044f digital-\u043f\u0440\u043e\u0435\u043a\u0442\u043e\u0432", provider: "Contented", meta: "\u0421 \u043d\u0443\u043b\u044f \u00b7 2 \u043c\u0435\u0441 + \u043e\u043d\u043b\u0430\u0439\u043d", price: "47 000 \u20bd", oldPrice: "68 000 \u20bd", monthly: "1960 \u20bd \u0432 \u043c\u0435\u0441\u044f\u0446", tags: ["design", "default"] },
];

const FALLBACK_OPPORTUNITIES = [
  { id: "design-mobile-internship", type: "Стажировка", status: "Активно", statusTone: "success", title: "Дизайнер интерфейсов мобильных приложений UI/UX (Junior/Middle)", company: "White Tiger Soft", accent: "Длительность: 8 недель", chips: ["Студенты", "Без опыта"], href: routes.opportunities.catalog },
  { id: "web-designer-internship", type: "Стажировка", status: "Активно", statusTone: "success", title: "Веб-дизайнер", company: "ГАУЗ Республиканский медицинский центр", accent: "Длительность: 4 недели", chips: ["Студенты", "Без опыта"], href: routes.opportunities.catalog },
  { id: "graphic-design-internship", type: "Стажировка", status: "Активно", statusTone: "success", title: "Графический дизайнер", company: "Leonards space", accent: "Длительность: 12 недель", chips: ["Студенты", "Без опыта"], href: routes.opportunities.catalog },
  { id: "product-design-internship", type: "Стажировка", status: "Активно", statusTone: "success", title: "Дизайнер цифровых продуктов", company: "White Tiger Soft", accent: "Длительность: 6 недель", chips: ["Студенты", "Junior"], href: routes.opportunities.catalog },
];

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

const PEER_FALLBACKS = [
  { id: "peer-morova", name: "Александра Морева", sharedSkills: ["Web-design", "UX", "Figma"] },
  { id: "peer-sokolova", name: "Анастасия Соколова", sharedSkills: ["Figma", "UX", "Research"] },
  { id: "peer-ilina", name: "Мария Ильина", sharedSkills: ["Figma", "UX"] },
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

function mapOpportunityTypeLabel(value) {
  switch (String(value ?? "").toLowerCase()) {
    case "internship":
      return "Стажировка";
    case "vacancy":
      return "Вакансия";
    case "event":
      return "Мероприятие";
    default:
      return value || "Возможность";
  }
}

function mapOpportunityCard(item) {
  if (!isRecord(item)) {
    return null;
  }

  const opportunityId = item.id ?? item.opportunityId ?? null;

  return {
    id: opportunityId ?? `${item.title ?? "career"}-${item.companyName ?? "item"}`,
    type: mapOpportunityTypeLabel(item.opportunityType ?? item.type ?? "internship"),
    status: item.moderationStatus === "approved" ? "Активно" : item.statusLabel ?? "Активно",
    statusTone: "success",
    title: item.title ?? item.opportunityTitle ?? "Карьерная возможность",
    company: item.companyName || "Компания",
    accent: item.duration ?? (item.locationCity ? `Локация: ${item.locationCity}` : item.employmentType ?? "Длительность уточняется"),
    chips: safeArray(item.tags).filter(Boolean).slice(0, 2),
    href: opportunityId ? buildOpportunityDetailRoute(opportunityId) : routes.opportunities.catalog,
  };
}

function getOpportunityCards(recommendations, opportunities) {
  const primary = safeArray(recommendations).map(mapOpportunityCard).filter(Boolean);
  const secondary = safeArray(opportunities).map(mapOpportunityCard).filter(Boolean);
  const merged = [];
  const seenIds = new Set();

  [primary, secondary, FALLBACK_OPPORTUNITIES].forEach((group) => {
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
  const preferred = COURSE_CATALOG.filter((course) => course.tags.includes(track));

  return [...preferred, ...COURSE_CATALOG.filter((course) => !preferred.includes(course))].slice(0, 6);
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
    href: routes.opportunities.catalog,
    actionLabel: "Перейти к курсу",
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
  const dynamic = safeArray(contacts).map((contact) => {
    const sharedSkills = safeArray(contact?.skills).filter((skill) => skillSet.has(normalizeKey(skill))).slice(0, 3);
    const fallbackSkills = safeArray(contact?.skills).slice(0, 3);
    const name = contact?.name || contact?.email || "Контакт";

    return {
      id: contact?.contactProfileId ?? contact?.id ?? contact?.email ?? contact?.name,
      name,
      initials: buildInitials(name),
      sharedSkills: sharedSkills.length ? sharedSkills : (fallbackSkills.length ? fallbackSkills : ["Совпадение по интересам"]),
      href: routes.candidate.contacts,
    };
  }).filter((contact) => contact.id);

  return (dynamic.length
    ? dynamic
    : PEER_FALLBACKS.map((contact) => ({
        ...contact,
        initials: buildInitials(contact.name),
        href: routes.candidate.contacts,
      }))).slice(0, 3);
}

function countByStatus(items, status) {
  return items.filter((item) => item?.status === status).length;
}

export function CandidateCareerDashboard({ profile, dashboardState }) {
  const [mentorFilter, setMentorFilter] = useState(MENTOR_FILTERS[0].value);

  const primarySkills = getPrimarySkills(profile);
  const suggestedSkills = getSuggestedSkills(profile);
  const courses = pickCourses(profile).map(mapCourseCard);
  const opportunities = getOpportunityCards(dashboardState.recommendations, dashboardState.opportunities);
  const salaryTrack = SALARY_TRACKS[resolveTrackKey(profile)] ?? SALARY_TRACKS.default;
  const sharedContacts = getSharedContacts(profile, dashboardState.contacts);
  const mentors = useMemo(
    () => MENTORS.filter((mentor) => mentor.focus.includes(mentorFilter)).slice(0, 3),
    [mentorFilter]
  );

  const statsPanel = {
    title: "Твоя карьера",
    metaTitle: getCandidateDisplayName(profile) || "Кандидат",
    metaDescription: getProfileMeta(profile),
    stats: [
      { value: String(dashboardState.applications.length), label: "Отклики" },
      { value: String(countByStatus(dashboardState.applications, "reviewing")), label: "Рассмотрение" },
      { value: String(countByStatus(dashboardState.applications, "invited")), label: "Приглашения", tone: "success" },
    ],
    description: "Чтобы повысить шансы на собеседование, можно обратиться к менторам: они помогут усилить профиль и подготовить следующий шаг.",
    cta: { href: routes.candidate.resume, label: "Подготовиться к собеседованию" },
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
      </section>

      {dashboardState.degraded ? (
        <Alert tone="warning" title="Часть данных временно недоступна" showIcon>
          Страница открыта, но некоторые персональные рекомендации собраны из fallback-подборок.
        </Alert>
      ) : null}

      <section id="career-courses" className="candidate-career-dashboard__section">
        <SectionHeader
          title="Курсы по навыкам"
          size="md"
          actions={<a href={routes.opportunities.catalog} className="candidate-career-dashboard__section-link">Все курсы →</a>}
        />
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

      <section className="candidate-career-dashboard__section">
        <SectionHeader
          title="Пройди стажировку и совершенствуй свои навыки"
          size="md"
          actions={<a href={routes.opportunities.catalog} className="candidate-career-dashboard__section-link">Все возможности →</a>}
        />
        <OpportunityBlockSlider
          ariaLabel={OPPORTUNITY_SLIDER_ARIA_LABEL}
          items={opportunities}
          variant="leading-featured"
          className="candidate-career-dashboard__opportunities-slider"
          itemWidth="var(--candidate-career-dashboard-opportunity-slide-width)"
          featuredWidth="var(--candidate-career-dashboard-opportunity-featured-width)"
          gap="var(--candidate-career-dashboard-opportunity-slide-gap)"
          cardPropsBuilder={(item) => ({
            detailAction: {
              href: item.href ?? routes.opportunities.catalog,
              label: "\u041f\u043e\u0434\u0440\u043e\u0431\u043d\u0435\u0435",
              variant: "secondary",
            },
          })}
        />
      </section>

      <section className="candidate-career-dashboard__section">
        <SectionHeader
          title="Есть вопросы? Обратись к нашим менторам!"
          size="md"
          actions={<a href={routes.candidate.contacts} className="candidate-career-dashboard__section-link">Все менторы →</a>}
        />
        <div className="candidate-career-dashboard__mentor-filters" role="tablist" aria-label="Сценарии консультаций">
          {MENTOR_FILTERS.map((filter) => (
            <FilterPill key={filter.value} type="button" active={filter.value === mentorFilter} onClick={() => setMentorFilter(filter.value)}>
              {filter.label}
            </FilterPill>
          ))}
        </div>
        <div className="candidate-career-dashboard__card-grid candidate-career-dashboard__card-grid--mentors">
          {mentors.map((mentor) => (
            <CareerMentorCard key={mentor.id} {...mentor} href={routes.candidate.contacts} />
          ))}
        </div>
      </section>

      <section className="candidate-career-dashboard__section">
        <SectionHeader
          title="У вас есть общие интересы"
          description="Вы можете найти единомышленников и погрузиться в профессиональную среду. Работайте над проектами совместно и развивайте не только профильные навыки."
          size="md"
          actions={<a href={routes.candidate.contacts} className="candidate-career-dashboard__section-link">Найти единомышленников →</a>}
        />
        <div className="candidate-career-dashboard__peer-grid">
          {sharedContacts.map((contact) => (
            <CareerPeerCard key={contact.id} {...contact} />
          ))}
        </div>
      </section>
    </div>
  );
}
