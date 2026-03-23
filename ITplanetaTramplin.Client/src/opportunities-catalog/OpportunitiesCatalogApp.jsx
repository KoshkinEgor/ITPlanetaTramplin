import { useMemo, useState } from "react";
import { PortalHeader } from "../components/layout/PortalHeader";
import { OpportunityBlockCard, OpportunityRowCard } from "../components/opportunities";
import { Button, Card, PillButton, SearchInput, Tag } from "../components/ui";

const NAV_ITEMS = [
  { key: "opportunities", label: "Возможности", href: "./opportunities-catalog.html" },
  { key: "career", label: "Карьера", href: "../candidate/candidate-profile.html" },
  { key: "about", label: "О платформе", href: "../home/index.html#about" },
];

const TYPE_FILTERS = ["Все", "Вакансии", "Стажировки", "Мероприятия"];
const TYPE_FILTER_MAP = {
  Все: null,
  Вакансии: "Вакансия",
  Стажировки: "Стажировка",
  Мероприятия: "Мероприятие",
};

const RESULT_ITEMS = [
  {
    id: "security-analyst",
    type: "Вакансия",
    title: "Junior Security Analyst",
    company: "ООО Компани · Москва + онлайн",
    accent: "от 90 000 ₽",
    note: "за месяц, до вычета налогов",
    chips: ["Без опыта", "Можно удаленно"],
    tags: [],
    salaryValue: 90000,
  },
  {
    id: "it-planet",
    type: "Мероприятие",
    title: "IT - Планета",
    company: "IT - Планета · Москва + онлайн",
    accent: "155",
    note: "регистраций",
    chips: [],
    tags: [],
    salaryValue: 155,
  },
  {
    id: "ux-internship",
    type: "Стажировка",
    title: "Дизайнер интерфейсов мобильных приложений UI/UX",
    company: "White Tiger Soft · Москва + онлайн",
    accent: "от 30 000 ₽",
    note: "за месяц, до вычета налогов",
    chips: ["Студенты", "Оплачиваемая"],
    tags: [],
    salaryValue: 30000,
  },
  {
    id: "product-intern",
    type: "Стажировка",
    title: "Product Analytics Intern",
    company: "Signal Hub · Москва + гибрид",
    accent: "60 000 ₽",
    note: "в месяц + наставник",
    chips: ["SQL", "Growth"],
    tags: [],
    salaryValue: 60000,
  },
  {
    id: "frontend-trainee",
    type: "Вакансия",
    title: "Frontend Trainee",
    company: "Cloud Orbit · Новосибирск + гибрид",
    accent: "от 70 000 ₽",
    note: "за месяц, до вычета налогов",
    chips: ["Junior", "React"],
    tags: [],
    salaryValue: 70000,
  },
];

const RECOMMENDED_ITEMS = [
  {
    id: "recommended-1",
    type: "Вакансия",
    status: "Активно",
    statusTone: "success",
    title: "Junior Security Analyst",
    company: "ООО Компани · Москва + онлайн",
    accent: "от 90 000 ₽",
    chips: ["Junior", "SOC", "SIEM"],
  },
  {
    id: "recommended-2",
    type: "Мероприятие",
    status: "Ожидание",
    statusTone: "warning",
    title: "IT - Планета",
    company: "IT - Планета · Москва + онлайн",
    accent: "155 регистраций",
    chips: ["Студенты", "Мероприятие"],
  },
  {
    id: "recommended-3",
    type: "Мероприятие",
    status: "Активно",
    statusTone: "success",
    title: "IT - Планета",
    company: "IT - Планета · Москва + онлайн",
    accent: "155 регистраций",
    chips: ["Студенты", "Мероприятие"],
  },
  {
    id: "recommended-4",
    type: "Мероприятие",
    status: "Ожидание",
    statusTone: "warning",
    title: "IT - Планета",
    company: "IT - Планета · Москва + онлайн",
    accent: "155 регистраций",
    chips: ["Студенты"],
  },
];

const CITY_COMPANIES = [
  { initials: "Ig", name: "IGrids", count: "20 вакансий", tone: "lime" },
  { initials: "KS", name: "КейсСистемс", count: "32 вакансии", tone: "neutral" },
  { initials: "Ig", name: "IGrids", count: "20 вакансий", tone: "lime" },
  { initials: "Ig", name: "IGrids", count: "20 вакансий", tone: "lime" },
  { initials: "Ig", name: "IGrids", count: "20 вакансий", tone: "lime" },
  { initials: "Ig", name: "IGrids", count: "20 вакансий", tone: "lime" },
];

const REGION_OPTIONS = ["Москва", "Чебоксары", "Казань", "Новосибирск"];
const SPECIALIZATION_OPTIONS = ["Аналитика", "Дизайн", "Разработка", "Кибербезопасность"];
const PAY_PERIODS = ["Период выплат", "За месяц", "За проект", "Почасово"];
const FORMAT_OPTIONS = ["На месте работодателя", "Разъездной", "Удаленно", "Гибрид"];
const EDUCATION_OPTIONS = ["Не требуется или не указано", "Высшее", "Среднее профессиональное"];

function normalize(value) {
  return String(value).trim().toLowerCase();
}

function ClearIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="m6.7 6.7 6.6 6.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="m13.3 6.7-6.6 6.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3.5v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="m5.5 9.5 2.5 3 2.5-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SidebarSelect({ label, value, resetText = "Сбросить" }) {
  return (
    <div className="opportunities-sidebar__group">
      <div className="opportunities-sidebar__group-head">
        <span>{label}</span>
        <button type="button">{resetText}</button>
      </div>
      <button type="button" className="opportunities-sidebar__select">
        <span>{value}</span>
        <ChevronDownIcon />
      </button>
    </div>
  );
}

function SidebarCheckboxGroup({ label, options, selected, onToggle }) {
  return (
    <div className="opportunities-sidebar__group">
      <div className="opportunities-sidebar__group-head">
        <span>{label}</span>
        <button type="button">Сбросить</button>
      </div>
      <div className="opportunities-sidebar__checks">
        {options.map((option) => (
          <label key={option} className="opportunities-sidebar__check">
            <input type="checkbox" checked={selected.includes(option)} onChange={() => onToggle(option)} />
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export function OpportunitiesCatalogApp() {
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState("Все");
  const [sortAscending, setSortAscending] = useState(true);
  const [visibleCount, setVisibleCount] = useState(3);
  const [selectedFormats, setSelectedFormats] = useState(["На месте работодателя", "Удаленно", "Гибрид"]);
  const [selectedEducation, setSelectedEducation] = useState(["Не требуется или не указано"]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalize(query);
    return RESULT_ITEMS.filter((item) => {
      const matchesType = TYPE_FILTER_MAP[activeType] ? item.type === TYPE_FILTER_MAP[activeType] : true;
      const haystack = normalize([item.title, item.company, item.accent, item.note].join(" "));
      return matchesType && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [activeType, query, sortAscending]);

  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMore = visibleCount < filteredItems.length;

  const toggleInList = (setter, currentValues, value) => {
    setter(currentValues.includes(value) ? currentValues.filter((item) => item !== value) : [...currentValues, value]);
  };

  return (
    <main className="opportunities-browser">
      <div className="opportunities-browser__shell">
        <PortalHeader
          navItems={NAV_ITEMS}
          currentKey="opportunities"
          actionHref="../candidate/candidate-profile.html"
          actionLabel="Профиль"
          className="opportunities-browser__header opportunities-browser-fade-up"
        />

        <div className="opportunities-browser__layout">
          <aside className="opportunities-sidebar opportunities-browser-fade-up opportunities-browser-fade-up--delay-1">
            <Card className="opportunities-sidebar__surface">
              <div className="opportunities-sidebar__map-card" aria-hidden="true">
                <span className="opportunities-sidebar__map-glow opportunities-sidebar__map-glow--lime" />
                <span className="opportunities-sidebar__map-glow opportunities-sidebar__map-glow--blue" />
                <span className="opportunities-sidebar__map-pin opportunities-sidebar__map-pin--left" />
                <span className="opportunities-sidebar__map-pin opportunities-sidebar__map-pin--center" />
                <span className="opportunities-sidebar__map-pin opportunities-sidebar__map-pin--right" />
                <Button className="opportunities-sidebar__map-button">Вакансии на карте</Button>
              </div>

              <SidebarSelect label="Регион" value="Поиск региона" />
              <div className="opportunities-sidebar__group">
                <div className="opportunities-sidebar__group-head">
                  <span>Уровень дохода</span>
                  <button type="button">Сбросить</button>
                </div>
                <div className="opportunities-sidebar__income-fields">
                  <input type="text" value="от" readOnly />
                  <button type="button" className="opportunities-sidebar__select">
                    <span>{PAY_PERIODS[0]}</span>
                    <ChevronDownIcon />
                  </button>
                </div>
              </div>
              <SidebarSelect label="Специализация" value="Поиск специальности" />
              <SidebarCheckboxGroup
                label="Формат работы"
                options={FORMAT_OPTIONS}
                selected={selectedFormats}
                onToggle={(value) => toggleInList(setSelectedFormats, selectedFormats, value)}
              />
              <SidebarCheckboxGroup
                label="Образование"
                options={EDUCATION_OPTIONS}
                selected={selectedEducation}
                onToggle={(value) => toggleInList(setSelectedEducation, selectedEducation, value)}
              />
            </Card>
          </aside>

          <div className="opportunities-browser__content">
            <section className="opportunities-browser__hero opportunities-browser-fade-up">
              <Tag tone="accent">
                Возможности
              </Tag>
              <div className="opportunities-browser__hero-copy">
                <h1 className="ui-type-display">Возможности</h1>
                <p className="ui-type-body-lg">Находи стажировки, вакансии, компании и менторов по своим предпочтениям.</p>
              </div>
            </section>

            <div className="opportunities-browser__toolbar">
              <SearchInput
                value={query}
                onValueChange={setQuery}
                placeholder="Поиск по названию, действию или дате"
                clearLabel={<ClearIcon />}
                className="opportunities-browser__search"
              />

              <div className="opportunities-browser__toolbar-row opportunities-browser-fade-up opportunities-browser-fade-up--delay-1">
                <div className="opportunities-browser__type-filters">
                  {TYPE_FILTERS.map((filter) => (
                    <PillButton
                      key={filter}
                      active={filter === activeType}
                      className="opportunities-browser__type-pill"
                      onClick={() => setActiveType(filter)}
                    >
                      {filter}
                    </PillButton>
                  ))}
                </div>

                <button
                  type="button"
                  className="opportunities-browser__sort-button"
                  onClick={() => setSortAscending((current) => !current)}
                >
                  <span>{sortAscending ? "По возрастанию зарплат" : "По убыванию зарплат"}</span>
                  <ArrowDownIcon />
                </button>
              </div>
            </div>

            <div className="opportunities-browser__results-caption opportunities-browser-fade-up opportunities-browser-fade-up--delay-1">
              Найдена 3 061 возможность
            </div>

            <section className="opportunities-browser__results opportunities-browser-fade-up opportunities-browser-fade-up--delay-2">
              {visibleItems.map((item) => (
                <OpportunityRowCard
                  key={item.id}
                  item={item}
                  surface="panel"
                  size="md"
                  className="opportunities-result-entry"
                  primaryAction={{
                    href: "./opportunity-detail-card.html",
                    label: item.type === "Мероприятие" ? "Подать заявку" : "Откликнуться",
                  }}
                  secondaryAction={{
                    href: "../contacts/contact-profile.html",
                    label: "Связаться",
                    variant: "secondary",
                  }}
                />
              ))}

              <Button
                type="button"
                variant="secondary"
                className="opportunities-browser__more-button"
                onClick={() => setVisibleCount((current) => Math.min(current + 2, filteredItems.length))}
              >
                {hasMore ? "Больше возможностей" : "Показаны все возможности"}
              </Button>
            </section>

            <section className="opportunities-browser__section" id="recommended">
              <div className="opportunities-browser__section-head">
                <h2 className="ui-type-display">Рекомендуемые возможности</h2>
              </div>
              <div className="opportunities-browser__recommended-grid">
                {RECOMMENDED_ITEMS.map((item) => (
                  <OpportunityBlockCard
                    key={item.id}
                    item={item}
                    surface="panel"
                    size="md"
                    className="opportunities-recommended-entry"
                    detailAction={{
                      href: "./opportunity-detail-card.html",
                      label: "Подробнее",
                      variant: "secondary",
                    }}
                  />
                ))}
              </div>
            </section>

            <section className="opportunities-browser__section">
              <Card className="opportunities-browser__city-panel">
                <div className="opportunities-browser__section-head">
                  <h2 className="ui-type-display">Вакансии в Чебоксарах</h2>
                </div>
                <div className="opportunities-browser__city-grid">
                  {CITY_COMPANIES.map((item, index) => (
                    <article key={`${item.name}-${index}`} className="opportunities-browser__city-card">
                      <span className={`opportunities-browser__city-avatar opportunities-browser__city-avatar--${item.tone}`.trim()}>{item.initials}</span>
                      <div className="opportunities-browser__city-copy">
                        <strong>{item.name}</strong>
                        <span>{item.count}</span>
                      </div>
                    </article>
                  ))}
                </div>
                <button type="button" className="opportunities-browser__expand">
                  Развернуть
                  <ChevronDownIcon />
                </button>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
