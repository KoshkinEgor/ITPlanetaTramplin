import { useMemo, useState } from "react";
import { buildOpportunityDetailRoute, routes } from "../../app/routes";
import { getCandidateDisplayName, getCandidateSkills } from "../../candidate-portal/mappers";
import { Alert, Avatar, Button, Card, FilterPill, IconButton, SectionHeader, Tag } from "../../shared/ui";

const SALARY_TRACKS = {
  design: [
    { level: "Джуниор веб-дизайнер", range: "44–56 тыс. ₽", progress: 0.32 },
    { level: "Мид веб-дизайнер", range: "52–59 тыс. ₽", progress: 0.5 },
    { level: "Сеньор веб-дизайнер", range: "106–459 тыс. ₽", progress: 1 },
  ],
  analytics: [
    { level: "Junior аналитик", range: "48–72 тыс. ₽", progress: 0.35 },
    { level: "Middle аналитик", range: "82–135 тыс. ₽", progress: 0.6 },
    { level: "Senior аналитик", range: "148–310 тыс. ₽", progress: 1 },
  ],
  development: [
    { level: "Junior frontend-разработчик", range: "65–95 тыс. ₽", progress: 0.42 },
    { level: "Middle frontend-разработчик", range: "120–180 тыс. ₽", progress: 0.68 },
    { level: "Senior frontend-разработчик", range: "220–420 тыс. ₽", progress: 1 },
  ],
  default: [
    { level: "Стартовый уровень", range: "45–70 тыс. ₽", progress: 0.36 },
    { level: "Уверенный уровень", range: "70–120 тыс. ₽", progress: 0.6 },
    { level: "Экспертный уровень", range: "120–260 тыс. ₽", progress: 1 },
  ],
};

const TRACK_SKILLS = {
  design: ["UX", "UI", "Research", "Figma", "Презентации", "Верстка", "Графический дизайн", "User experience", "Sketch", "User interface", "Adobe Photoshop", "Usability"],
  analytics: ["SQL", "Python", "Research", "BI", "Data Visualization", "Презентации", "Excel", "Power BI", "A/B тесты", "Метрики", "Статистика", "Дашборды"],
  development: ["JavaScript", "React", "TypeScript", "HTML", "CSS", "Git", "REST API", "UI", "Figma", "Адаптивная верстка", "Тестирование", "State management"],
  default: ["SQL", "Python", "Research", "Figma", "Презентации", "Коммуникация", "Analytics", "UI", "Проектная работа", "A/B тесты", "Usability", "Верстка"],
};

const COURSE_CATALOG = [
  { id: "ai-design", title: "Нейросети для дизайна", provider: "Яндекс Практикум", meta: "Продвинутый · 3 мес + онлайн", price: "40 000 ₽", oldPrice: "82 000 ₽", monthly: "2325 ₽ в месяц", tags: ["design", "default"] },
  { id: "illustrator", title: "Adobe Illustrator с нуля", provider: "Skillbox", meta: "С нуля · 2 мес + онлайн", price: "25 000 ₽", oldPrice: "82 000 ₽", monthly: "825 ₽ в месяц", tags: ["design", "default"] },
  { id: "typography", title: "Типографика и верстка: внимание к типу", provider: "Skillbox", meta: "С нуля · 1 мес + онлайн", price: "20 000 ₽", oldPrice: "82 000 ₽", monthly: "755 ₽ в месяц", tags: ["design", "development"] },
  { id: "graphic-design", title: "Ускоренный курс по графическому дизайну", provider: "Skillbox", meta: "С нуля · 4 мес + онлайн", price: "78 000 ₽", oldPrice: "82 000 ₽", monthly: "3755 ₽ в месяц", tags: ["design", "default"] },
  { id: "product-analytics", title: "Продуктовая аналитика", provider: "Practicum", meta: "База · 3 мес + онлайн", price: "58 000 ₽", oldPrice: "81 000 ₽", monthly: "4100 ₽ в месяц", tags: ["analytics", "default"] },
  { id: "frontend", title: "Frontend-разработка с React", provider: "HTML Academy", meta: "Интенсив · 4 мес + онлайн", price: "69 000 ₽", oldPrice: "94 000 ₽", monthly: "5200 ₽ в месяц", tags: ["development", "default"] },
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

function HeartIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 16.2s-5.2-3.5-6.7-6.6C2.1 7.2 3.2 4.5 6 4.5c1.5 0 2.7.8 4 2.3 1.3-1.5 2.5-2.3 4-2.3 2.8 0 3.9 2.7 2.7 5.1-1.5 3.1-6.7 6.6-6.7 6.6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
  if (!isRecord(item)) return null;
  const opportunityId = item.id ?? item.opportunityId ?? null;
  return {
    id: opportunityId ?? `${item.title ?? "career"}-${item.companyName ?? "item"}`,
    type: mapOpportunityTypeLabel(item.opportunityType ?? item.type ?? "internship"),
    status: item.moderationStatus === "approved" ? "Активно" : (item.statusLabel ?? "Активно"),
    statusTone: item.moderationStatus === "approved" ? "success" : "success",
    title: item.title ?? item.opportunityTitle ?? "Карьерная возможность",
    company: item.companyName || "Компания",
    accent: item.duration ?? (item.locationCity ? `Локация: ${item.locationCity}` : item.employmentType ?? "Длительность уточняется"),
    chips: safeArray(item.tags).filter(Boolean).slice(0, 2),
    href: opportunityId ? buildOpportunityDetailRoute(opportunityId) : routes.opportunities.catalog,
  };
}

function getOpportunityCards(recommendations, opportunities) {
  const primary = safeArray(recommendations).map(mapOpportunityCard).filter(Boolean);
  const fallback = safeArray(opportunities).map(mapOpportunityCard).filter(Boolean);
  const resolved = primary.length ? primary : fallback.length ? fallback : FALLBACK_OPPORTUNITIES;
  return resolved.slice(0, 4);
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
  return (profileSkills.length ? profileSkills : (TRACK_SKILLS[resolveTrackKey(profile)] ?? TRACK_SKILLS.default)).slice(0, 6);
}

function pickCourses(profile) {
  const track = resolveTrackKey(profile);
  const preferred = COURSE_CATALOG.filter((course) => course.tags.includes(track));
  return [...preferred, ...COURSE_CATALOG.filter((course) => !preferred.includes(course))].slice(0, 4);
}

function getSharedContacts(profile, contacts) {
  const skillSet = new Set(getCandidateSkills(profile).map(normalizeKey));
  const dynamic = safeArray(contacts).map((contact) => {
    const sharedSkills = safeArray(contact?.skills).filter((skill) => skillSet.has(normalizeKey(skill))).slice(0, 3);
    const fallbackSkills = safeArray(contact?.skills).slice(0, 3);
    return {
      id: contact?.contactProfileId ?? contact?.id ?? contact?.email ?? contact?.name,
      name: contact?.name || contact?.email || "Контакт",
      sharedSkills: sharedSkills.length ? sharedSkills : (fallbackSkills.length ? fallbackSkills : ["Совпадение по интересам"]),
    };
  }).filter((contact) => contact.id);

  return (dynamic.length ? dynamic : PEER_FALLBACKS).slice(0, 3);
}

function countByStatus(items, status) {
  return items.filter((item) => item?.status === status).length;
}

function CareerStatCard({ value, label, tone = "default" }) {
  return (
    <div className={`candidate-career-dashboard__metric-card candidate-career-dashboard__metric-card--${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function CourseCard({ course }) {
  return (
    <Card className="candidate-career-dashboard__course-card">
      <div className="candidate-career-dashboard__course-copy">
        <span className="candidate-career-dashboard__card-meta">{course.meta}</span>
        <h3>{course.title}</h3>
        <p>{course.provider}</p>
        <div className="candidate-career-dashboard__course-pricing">
          <strong>{course.price}</strong>
          <span>{course.oldPrice}</span>
        </div>
        <small>{course.monthly}</small>
      </div>
      <Button as="a" href={routes.opportunities.catalog} variant="secondary" width="full">Перейти к курсу</Button>
    </Card>
  );
}

function CareerOpportunityCard({ item, featured = false }) {
  return (
    <Card className={`candidate-career-dashboard__opportunity-card ${featured ? "is-featured" : ""}`.trim()}>
      <div className="candidate-career-dashboard__opportunity-top">
        <div className="candidate-career-dashboard__opportunity-tags">
          <Tag variant="surface">{item.type}</Tag>
          <Tag tone="success" size="sm">{item.status}</Tag>
        </div>
        <IconButton label="Сохранить возможность" size="sm" className="candidate-career-dashboard__opportunity-save">
          <HeartIcon />
        </IconButton>
      </div>

      <div className="candidate-career-dashboard__opportunity-copy">
        <h3>{item.title}</h3>
        <p>{item.company}</p>
        <span>{item.accent}</span>
      </div>

      <div className="candidate-career-dashboard__opportunity-chips">
        {item.chips.map((chip) => (
          <Tag key={chip} variant="surface" size="sm">{chip}</Tag>
        ))}
      </div>

      <Button as="a" href={item.href} variant="secondary" width="full">Подробнее</Button>
    </Card>
  );
}

function MentorCard({ mentor }) {
  return (
    <Card className="candidate-career-dashboard__mentor-card">
      <div className="candidate-career-dashboard__mentor-body">
        <div className="candidate-career-dashboard__mentor-head">
          <Avatar name={mentor.name} size="xl" tone={mentor.tone} className="candidate-career-dashboard__mentor-avatar" />
          <div>
            <h3>{mentor.name}</h3>
            <p>{mentor.role}</p>
          </div>
        </div>
        <p className="candidate-career-dashboard__mentor-summary">{mentor.summary}</p>
      </div>
      <Button as="a" href={routes.candidate.contacts} variant="secondary" width="full">Профиль</Button>
    </Card>
  );
}

function PeerCard({ contact }) {
  const initials = contact.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "К";

  return (
    <Card className="candidate-career-dashboard__peer-card">
      <div className="candidate-career-dashboard__peer-main">
        <Avatar initials={initials} name={contact.name} tone="warning" shape="rounded" className="candidate-career-dashboard__peer-avatar" />
        <div>
          <h3>{contact.name}</h3>
          <p>{contact.sharedSkills.length} общих навыка: {contact.sharedSkills.join(", ")}</p>
        </div>
      </div>
      <IconButton label="Добавить в контакты" size="sm" href={routes.candidate.contacts} className="candidate-career-dashboard__peer-action">
        +
      </IconButton>
    </Card>
  );
}

export function CandidateCareerDashboard({ profile, dashboardState }) {
  const [mentorFilter, setMentorFilter] = useState(MENTOR_FILTERS[0].value);

  const primarySkills = getPrimarySkills(profile);
  const suggestedSkills = getSuggestedSkills(profile);
  const courses = pickCourses(profile);
  const opportunities = getOpportunityCards(dashboardState.recommendations, dashboardState.opportunities);
  const salaryTrack = SALARY_TRACKS[resolveTrackKey(profile)] ?? SALARY_TRACKS.default;
  const sharedContacts = getSharedContacts(profile, dashboardState.contacts);
  const mentors = useMemo(() => MENTORS.filter((mentor) => mentor.focus.includes(mentorFilter)).slice(0, 3), [mentorFilter]);

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
          <Card className="candidate-career-dashboard__panel candidate-career-dashboard__panel--career">
            <div className="candidate-career-dashboard__panel-head">
              <div>
                <h2>Твоя карьера</h2>
                <p>{getCandidateDisplayName(profile) || "Кандидат"}</p>
                <span>{getProfileMeta(profile)}</span>
              </div>
            </div>

            <div className="candidate-career-dashboard__metric-grid">
              <CareerStatCard value={dashboardState.applications.length} label="Отклики" />
              <CareerStatCard value={countByStatus(dashboardState.applications, "reviewing")} label="Рассмотрение" />
              <CareerStatCard value={countByStatus(dashboardState.applications, "invited")} label="Приглашения" tone="success" />
            </div>

            <p className="candidate-career-dashboard__panel-copy">Чтобы повысить шансы на собеседование, можно обратиться к менторам: они помогут усилить профиль и подготовить следующий шаг.</p>
            <Button as="a" href={routes.candidate.resume} variant="secondary" width="full">Подготовиться к собеседованию</Button>
          </Card>

          <Card className="candidate-career-dashboard__panel candidate-career-dashboard__panel--skills">
            <div className="candidate-career-dashboard__panel-head">
              <h2>Твои навыки</h2>
            </div>
            <div className="candidate-career-dashboard__skill-cloud">
              {primarySkills.map((skill) => <Tag key={skill} tone="accent" variant="soft" className="candidate-career-dashboard__skill-tag">{skill}</Tag>)}
            </div>
            <p className="candidate-career-dashboard__panel-copy">У тебя уже есть отличный базовый набор. Вот навыки, которые помогут быстрее выйти на следующий уровень поиска работы.</p>
            <div className="candidate-career-dashboard__recommended-block">
              <span>Рекомендованные навыки</span>
              <div className="candidate-career-dashboard__skill-cloud candidate-career-dashboard__skill-cloud--soft">
                {suggestedSkills.map((skill) => <Tag key={skill} variant="surface" className="candidate-career-dashboard__recommendation-tag">{skill}</Tag>)}
              </div>
            </div>
            <a href="#career-courses" className="candidate-career-dashboard__inline-link">Курсы по рекомендованным навыкам →</a>
          </Card>

          <Card className="candidate-career-dashboard__panel candidate-career-dashboard__salary">
            <div className="candidate-career-dashboard__panel-head">
              <h2>Уровень зарплат в {getProfileCity(profile)}</h2>
            </div>
            <div className="candidate-career-dashboard__salary-list">
              {salaryTrack.map((item, index) => (
                <div key={item.level} className={`candidate-career-dashboard__salary-item ${index === salaryTrack.length - 1 ? "is-highlighted" : ""}`.trim()}>
                  <p>{item.level}</p>
                  <strong>{item.range}</strong>
                  <span className="candidate-career-dashboard__salary-track" aria-hidden="true">
                    <span style={{ width: `${Math.max(10, Math.round(item.progress * 100))}%` }} />
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {dashboardState.degraded ? (
        <Alert tone="warning" title="Часть данных временно недоступна" showIcon>
          Страница открыта, но некоторые персональные рекомендации собраны из fallback-подборок.
        </Alert>
      ) : null}

      <section id="career-courses" className="candidate-career-dashboard__section">
        <SectionHeader title="Курсы по навыкам" size="md" actions={<a href={routes.opportunities.catalog} className="candidate-career-dashboard__section-link">Все курсы →</a>} />
        <div className="candidate-career-dashboard__card-grid candidate-career-dashboard__card-grid--courses">
          {courses.map((course) => <CourseCard key={course.id} course={course} />)}
        </div>
      </section>

      <section className="candidate-career-dashboard__section">
        <SectionHeader title="Пройди стажировку и совершенствуй свои навыки" size="md" actions={<a href={routes.opportunities.catalog} className="candidate-career-dashboard__section-link">Все возможности →</a>} />
        <div className="candidate-career-dashboard__card-grid candidate-career-dashboard__card-grid--opportunities">
          {opportunities.map((item, index) => <CareerOpportunityCard key={item.id} item={item} featured={index === 0} />)}
        </div>
      </section>

      <section className="candidate-career-dashboard__section">
        <SectionHeader title="Есть вопросы? Обратись к нашим менторам!" size="md" actions={<a href={routes.candidate.contacts} className="candidate-career-dashboard__section-link">Все менторы →</a>} />
        <div className="candidate-career-dashboard__mentor-filters" role="tablist" aria-label="Сценарии консультаций">
          {MENTOR_FILTERS.map((filter) => (
            <FilterPill key={filter.value} type="button" active={filter.value === mentorFilter} onClick={() => setMentorFilter(filter.value)}>
              {filter.label}
            </FilterPill>
          ))}
        </div>
        <div className="candidate-career-dashboard__card-grid candidate-career-dashboard__card-grid--mentors">
          {mentors.map((mentor) => <MentorCard key={mentor.id} mentor={mentor} />)}
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
          {sharedContacts.map((contact) => <PeerCard key={contact.id} contact={contact} />)}
        </div>
      </section>
    </div>
  );
}
