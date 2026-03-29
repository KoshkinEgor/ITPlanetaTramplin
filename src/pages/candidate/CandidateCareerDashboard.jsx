import { useMemo, useState } from "react";
import { buildCandidatePublicProfileRoute, buildOpportunityDetailRoute, routes } from "../../app/routes";
import { getCandidateDisplayName, getCandidateSkills } from "../../candidate-portal/mappers";
import { OpportunityBlockSlider } from "../../components/opportunities";
import { getOpportunityCardPresentation } from "../../shared/lib/opportunityPresentation";
import {
  Alert,
  Button,
  CareerCourseCard,
  CareerMentorCard,
  CareerPeerCard,
  CareerSalaryPanel,
  CareerSkillsPanel,
  CareerStatsPanel,
  FilterPill,
  Modal,
  SectionHeader,
} from "../../shared/ui";

const COURSE_SLIDER_ARIA_LABEL = "Career courses slider";
const OPPORTUNITY_SLIDER_ARIA_LABEL = "Career opportunities slider";
const COURSE_ACTION_TARGET = "_blank";
const COURSE_ACTION_REL = "noreferrer";
const MENTOR_MODAL_TITLE = "Менторы скоро появятся";
const MENTOR_MODAL_DESCRIPTION = "Раздел с менторами в разработке. Скоро здесь можно будет выбрать наставника и записаться на консультацию.";

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
    tags: ["design", "default"],
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
    tags: ["design", "default"],
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
    tags: ["design", "development"],
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
    tags: ["design", "default"],
  },
  {
    id: "product-analytics",
    title: "Продуктовый аналитик",
    provider: "Яндекс Практикум",
    meta: "Профессия · онлайн",
    price: "8 000 ₽/мес",
    monthly: "Можно платить ежемесячно",
    href: "https://practicum.yandex.ru/product-analyst/",
    tags: ["analytics", "default"],
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
    tags: ["development", "default"],
  },
  {
    id: "brand-identity",
    title: "Айдентика: от идеи к визуальному воплощению",
    provider: "Bang Bang Education",
    meta: "С нуля · 3 месяца · онлайн",
    href: "https://bangbangeducation.ru/course/id-from-idea-to-image",
    tags: ["design", "default"],
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
    tags: ["design", "default"],
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

function mapOpportunityCard(item) {
  if (!isRecord(item)) {
    return null;
  }

  const opportunityId = item.id ?? item.opportunityId ?? null;
  const presentation = getOpportunityCardPresentation(item);

  return {
    id: opportunityId ?? `${item.title ?? "career"}-${item.companyName ?? "item"}`,
    ...presentation,
    status: item.moderationStatus === "approved" ? "Активно" : item.statusLabel ?? "Активно",
    statusTone: "success",
    title: item.title ?? item.opportunityTitle ?? "Карьерная возможность",
    meta: [item.companyName, item.locationCity].filter(Boolean).join(" • ") || presentation.meta || item.companyName || "Компания",
    chips: safeArray(item.tags).filter(Boolean).slice(0, 2),
    href: opportunityId ? buildOpportunityDetailRoute(opportunityId) : routes.opportunities.catalog,
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

function countByStatus(items, status) {
  return items.filter((item) => item?.status === status).length;
}

export function CandidateCareerDashboard({ profile, dashboardState }) {
  const [mentorFilter, setMentorFilter] = useState(MENTOR_FILTERS[0].value);
  const [mentorModalOpen, setMentorModalOpen] = useState(false);

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
  const openMentorModal = () => setMentorModalOpen(true);
  const closeMentorModal = () => setMentorModalOpen(false);

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
          Страница открыта, но некоторые персональные данные не загрузились. Часть блоков может быть неполной.
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
        {opportunities.length ? (
          <OpportunityBlockSlider
            ariaLabel={OPPORTUNITY_SLIDER_ARIA_LABEL}
            items={opportunities}
            className="candidate-career-dashboard__opportunities-slider"
            itemWidth="var(--candidate-career-dashboard-opportunity-slide-width)"
            gap="var(--candidate-career-dashboard-opportunity-slide-gap)"
            cardPropsBuilder={(item) => ({
              detailAction: {
                href: item.href ?? routes.opportunities.catalog,
                label: "\u041f\u043e\u0434\u0440\u043e\u0431\u043d\u0435\u0435",
                variant: "secondary",
              },
            })}
          />
        ) : (
          <Alert tone="info" title="Пока нет доступных карточек" showIcon>
            После публикации новых вакансий и возможностей они появятся здесь.
          </Alert>
        )}
      </section>

      <section className="candidate-career-dashboard__section" id="mentors">
        <SectionHeader
          title="Есть вопросы? Обратись к нашим менторам!"
          size="md"
          actions={(
            <button type="button" className="candidate-career-dashboard__section-link" onClick={openMentorModal}>
              Все менторы →
            </button>
          )}
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
            <CareerMentorCard key={mentor.id} {...mentor} onActionClick={openMentorModal} />
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

      <Modal
        open={mentorModalOpen}
        onClose={closeMentorModal}
        title={MENTOR_MODAL_TITLE}
        description={MENTOR_MODAL_DESCRIPTION}
        tone="info"
        showIcon
        closeLabel="Закрыть окно"
        actions={(
          <Button type="button" onClick={closeMentorModal}>
            Понятно
          </Button>
        )}
      />
    </div>
  );
}
