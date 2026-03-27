import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PUBLIC_HEADER_NAV_ITEMS, buildOpportunityDetailRoute, routes } from "../app/routes";
import { AppLink } from "../app/AppLink";
import { getCurrentAuthUser } from "../auth/api";
import { getOpportunities } from "../api/opportunities";
import { OpportunityBlockCard, OpportunityRowCard } from "../components/opportunities";
import { ApiError } from "../lib/http";
import { Button, Card, Checkbox, IconButton, Input, Modal, SearchInput, SegmentedControl, SortControl, Tag } from "../shared/ui";
import { useBodyClass } from "../shared/lib/useBodyClass";
import { PortalHeader } from "../widgets/layout";
import { HomeOpportunityMap } from "./HomeOpportunityMap";
import "./home.css";

const heroTags = ["Вперёд к целям", "Карьера", "Новые контакты"];
const filterSelects = [
  {
    key: "type",
    label: "Тип",
    value: "Тип",
    options: ["Тип", "Вакансия", "Стажировка", "Мероприятие"],
  },
  {
    key: "format",
    label: "Формат",
    value: "Формат",
    options: ["Формат", "Офис", "Гибрид", "Онлайн"],
  },
  {
    key: "level",
    label: "Уровень",
    value: "Уровень",
    options: ["Уровень", "Без опыта", "Junior", "Middle"],
  },
  {
    key: "skills",
    label: "Навыки",
    value: "Навыки",
    options: ["Навыки", "SOC", "SIEM", "UI/UX", "Python"],
  },
  {
    key: "more",
    label: "Больше",
    value: "Больше",
    options: ["Больше", "С зарплатой", "С откликом", "С контактами"],
  },
];

const CITY_OPTIONS = ["Москва", "Чебоксары", "Казань", "Санкт-Петербург", "Нижний Новгород", "Екатеринбург", "Новосибирск"];

const SORT_OPTIONS = [
  { key: "popularity", label: "По популярности" },
  { key: "rating", label: "По рейтингу" },
  { key: "salary", label: "По зарплате" },
  { key: "responses", label: "По откликам" },
];

const visibleFilterSelects = filterSelects.filter((filter) => filter.key !== "more");
const defaultFilterValues = Object.fromEntries(filterSelects.map((filter) => [filter.key, filter.value]));

const advancedSearchSections = {
  directions: ["Вакансии", "Стажировки", "Мероприятия"],
  formats: ["Офис", "Гибрид", "Онлайн"],
  schedules: ["Полный день", "Частичная", "По выходным"],
  extras: ["Можно удаленно", "С контактами", "Быстрый отклик", "Только активные"],
};

const nearbyCards = [
  {
    eyebrow: "Вакансия",
    status: "Без опыта",
    statusTone: "neutral",
    title: "Junior Security Analyst",
    meta: "ООО Компани · Москва + онлайн",
    accent: "от 90 000 ₽",
    note: "за месяц, до вычета налогов",
    chips: ["Можно удаленно"],
    primaryAction: "Откликнуться",
    secondaryAction: "Связаться",
  },
  {
    eyebrow: "Стажировка",
    status: "Студенты",
    statusTone: "neutral",
    title: "Дизайнер интерфейсов Мобильных приложений UI/UX",
    meta: "White Tiger Soft · Москва + онлайн",
    accent: "от 30 000 ₽",
    note: "за месяц, до вычета налогов",
    chips: ["Оплачиваемая"],
    primaryAction: "Откликнуться",
    secondaryAction: "Связаться",
  },
  {
    eyebrow: "Мероприятие",
    status: "",
    statusTone: "neutral",
    title: "IT - Планета",
    meta: "IT - Планета · Москва + онлайн",
    accent: "155",
    note: "регистраций",
    chips: [],
    primaryAction: "Подать заявку",
    secondaryAction: "Связаться",
  },
];

const nearbyCardSortMeta = [
  { popularity: 94, rating: 4.8, salary: 90000, responses: 128 },
  { popularity: 87, rating: 4.6, salary: 30000, responses: 74 },
  { popularity: 91, rating: 4.7, salary: 155, responses: 196 },
];

const nearbyCardRuntimeData = [
  {
    id: "junior-security-analyst",
    city: "Москва",
    coordinates: [37.588893, 55.733842],
    extraChips: ["SOC", "SIEM"],
  },
  {
    id: "mobile-ui-ux-designer",
    city: "Москва",
    coordinates: [37.658581, 55.762994],
    extraChips: ["UI/UX"],
  },
  {
    id: "it-planeta-event",
    city: "Москва",
    coordinates: [37.541584, 55.804065],
    extraChips: ["Мероприятие"],
  },
];

const nearbyCardsCatalog = nearbyCards.map((item, index) => {
  const runtimeData = nearbyCardRuntimeData[index] ?? {};

  return {
    ...item,
    ...runtimeData,
    sortMeta: nearbyCardSortMeta[index] ?? {},
    chips: Array.from(new Set([...(runtimeData.extraChips ?? []), ...(item.chips ?? [])])),
  };
});

const popularCards = [
  ["Вакансия", "Активно", "success"],
  ["Вакансия", "Ожидание", "warning"],
  ["Вакансия", "Активно", "success"],
].map(([eyebrow, status, statusTone]) => ({
  eyebrow,
  status,
  statusTone,
  title: "Junior Security Analyst",
  meta: "ООО Компани · Москва + онлайн",
  accent: "от 90 000 ₽",
  chips: ["Junior", "SOC", "SIEM"],
}));

const recommendedCards = [
  {
    eyebrow: "Вакансия",
    status: "Активно",
    statusTone: "success",
    title: "Junior Security Analyst",
    meta: "ООО Компани · Москва + онлайн",
    accent: "от 90 000 ₽",
    chips: ["Junior", "SOC", "SIEM"],
  },
  {
    eyebrow: "Вакансия",
    status: "Активно",
    statusTone: "success",
    title: "Junior Security Analyst",
    meta: "ООО Компани · Москва + онлайн",
    accent: "от 90 000 ₽",
    chips: ["Junior", "SOC", "SIEM"],
  },
  {
    eyebrow: "Мероприятие",
    status: "Активно",
    statusTone: "success",
    title: "IT - Планета",
    meta: "IT - Планета · Москва + онлайн",
    accent: "155 регистраций",
    chips: ["Студенты", "Мероприятие"],
  },
  {
    eyebrow: "Мероприятие",
    status: "Активно",
    statusTone: "success",
    title: "IT - Планета",
    meta: "IT - Планета · Москва + онлайн",
    accent: "155 регистраций",
    chips: ["Студенты"],
  },
];

const popularCardsWithDetails = popularCards.map((item, index) => ({
  ...item,
  id: index === 1 ? "design-ui-ux" : "junior-security-analyst",
}));

const recommendedCardsWithDetails = recommendedCards.map((item, index) => ({
  ...item,
  id: index === 0 ? "junior-security-analyst" : index === 1 ? "design-ui-ux" : "it-planeta-event",
}));

function getHomeDetailActionLabel(item) {
  if (item?.primaryAction) {
    return item.primaryAction;
  }

  const type = String(item?.eyebrow ?? item?.type ?? "").trim().toLowerCase();
  return type === "мероприятие" ? "Подать заявку" : "Откликнуться";
}

function createHomeRowActions(item) {
  return {
    primaryAction: {
      href: "/candidate/contacts",
      label: item?.secondaryAction ?? "Связаться",
      variant: "secondary",
    },
    detailAction: {
      href: buildOpportunityDetailRoute(item.id),
      label: getHomeDetailActionLabel(item),
      variant: "secondary",
    },
  };
}

function createHomeBlockDetailAction(item) {
  return {
    href: buildOpportunityDetailRoute(item.id),
    label: "РџРѕРґСЂРѕР±РЅРµРµ",
    variant: "secondary",
    width: "full",
    className: "home-opportunity-entry__action",
  };
}

const HOME_CONTACT_ACTION_LABEL = "\u0421\u0432\u044F\u0437\u0430\u0442\u044C\u0441\u044F";
const HOME_APPLY_ACTION_LABEL = "\u041E\u0442\u043A\u043B\u0438\u043A\u043D\u0443\u0442\u044C\u0441\u044F";
const HOME_EVENT_ACTION_LABEL = "\u041F\u043E\u0434\u0430\u0442\u044C \u0437\u0430\u044F\u0432\u043A\u0443";
const HOME_DETAIL_ACTION_LABEL = "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u0435\u0435";

function getSafeHomeDetailActionLabel(item) {
  const type = String(item?.eyebrow ?? item?.type ?? "").trim().toLowerCase();
  return type === "\u043C\u0435\u0440\u043E\u043F\u0440\u0438\u044F\u0442\u0438\u0435" ? HOME_EVENT_ACTION_LABEL : HOME_APPLY_ACTION_LABEL;
}

function createSafeHomeRowActions(item) {
  return {
    primaryAction: {
      href: "/candidate/contacts",
      label: HOME_CONTACT_ACTION_LABEL,
      variant: "secondary",
    },
    detailAction: {
      href: buildOpportunityDetailRoute(item.id),
      label: getSafeHomeDetailActionLabel(item),
      variant: "secondary",
    },
  };
}

function createSafeHomeBlockDetailAction(item) {
  return {
    href: buildOpportunityDetailRoute(item.id),
    label: HOME_DETAIL_ACTION_LABEL,
    variant: "secondary",
    width: "full",
    className: "home-opportunity-entry__action",
  };
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M10 32h38" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <path d="m36 18 18 14-18 14" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
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

function CloseTinyIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4.5 4.5 11.5 11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M11.5 4.5 4.5 11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function normalizeOptionValue(value) {
  return String(value).trim().toLowerCase();
}

function translateOpportunityType(value) {
  switch (String(value ?? "").trim().toLowerCase()) {
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
  switch (normalizeOptionValue(value)) {
    case "remote":
      return "Удаленно";
    case "hybrid":
      return "Гибрид";
    case "office":
    case "onsite":
    case "on-site":
      return "Офис";
    case "online":
      return "Онлайн";
    default:
      return value && normalizeOptionValue(value) !== "unspecified" ? String(value).trim() : "";
  }
}

function shortenText(value, maxLength = 92) {
  const text = String(value ?? "").trim();

  if (!text) {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trimEnd()}…`;
}

function createSortMeta(item, index) {
  const fingerprint = `${item?.id ?? index}-${item?.title ?? ""}-${(item?.tags ?? []).join("|")}`;
  const hash = Array.from(fingerprint).reduce((total, character, currentIndex) => (
    total + character.charCodeAt(0) * (currentIndex + 1)
  ), 0);
  const type = String(item?.opportunityType ?? "").toLowerCase();
  const baseSalary = type === "vacancy" ? 90 : type === "internship" ? 35 : 12;
  const typeBoost = type === "event" ? 18 : type === "internship" ? 11 : 7;

  return {
    popularity: 60 + (hash % 40),
    rating: 40 + (hash % 10),
    salary: baseSalary + (hash % 25),
    responses: 20 + ((hash + typeBoost) % 180),
  };
}

function deriveStatus(item) {
  const tags = Array.isArray(item?.tags) ? item.tags.map(normalizeOptionValue) : [];

  if (tags.includes("middle")) {
    return "Middle";
  }

  if (tags.includes("junior")) {
    return "Junior";
  }

  if (tags.includes("без опыта") || String(item?.opportunityType ?? "").toLowerCase() === "internship") {
    return "Без опыта";
  }

  if (String(item?.opportunityType ?? "").toLowerCase() === "event") {
    return "Открыта запись";
  }

  return "Активно";
}

function hasValidCoordinates(item) {
  return Number.isFinite(Number(item?.longitude)) && Number.isFinite(Number(item?.latitude));
}

function mapOpportunityToHomeCard(item, index) {
  if (!item || !hasValidCoordinates(item)) {
    return null;
  }

  const typeLabel = translateOpportunityType(item.opportunityType);
  const employmentLabel = translateEmploymentType(item.employmentType);

  return {
    id: String(item.id),
    eyebrow: typeLabel,
    type: typeLabel,
    status: deriveStatus(item),
    statusTone: String(item?.opportunityType ?? "").toLowerCase() === "event" ? "warning" : "neutral",
    title: item.title ?? "",
    meta: [item.companyName, item.locationCity, employmentLabel].filter(Boolean).join(" · "),
    accent: item.locationAddress ?? employmentLabel,
    note: shortenText(item.description),
    chips: Array.isArray(item.tags) ? item.tags.slice(0, 4) : [],
    primaryAction: String(item?.opportunityType ?? "").toLowerCase() === "event" ? "Подать заявку" : "Откликнуться",
    secondaryAction: "Связаться",
    city: item.locationCity ?? "",
    coordinates: [Number(item.longitude), Number(item.latitude)],
    detailHref: buildOpportunityDetailRoute(String(item.id)),
    sortMeta: createSortMeta(item, index),
  };
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function includesNormalizedValue(items, value) {
  const normalizedValue = normalizeOptionValue(value);
  return items.some((item) => normalizeOptionValue(item) === normalizedValue);
}

function removeNormalizedValue(items, value) {
  const normalizedValue = normalizeOptionValue(value);
  return items.filter((item) => normalizeOptionValue(item) !== normalizedValue);
}

function SortIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 5.5h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M4 10h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M4 14.5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="m14 4 2.5-2.5L19 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.5 1.7v13.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function SortDirectionIcon({ direction }) {
  if (direction === "asc") {
    return (
      <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="m10 5-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="m10 5 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M10 5v10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="m10 15-4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="m10 15 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M10 5v10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 17s5-4.8 5-9a5 5 0 1 0-10 0c0 4.2 5 9 5 9Z" fill="currentColor" />
      <circle cx="10" cy="8" r="2.2" fill="white" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2.5" y="4.5" width="15" height="11" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="m4.8 7 5.2 4 5.2-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 4v12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M10 4v12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M15 4v12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="5" cy="8" r="2.1" fill="currentColor" />
      <circle cx="10" cy="13" r="2.1" fill="currentColor" />
      <circle cx="15" cy="6" r="2.1" fill="currentColor" />
    </svg>
  );
}

function HomeFilterDropdown({ label, value, options, isOpen, onToggle, onSelect }) {
  return (
    <SortControl
      label={label}
      value={value}
      options={options.map((option) => ({ value: option, label: option }))}
      open={isOpen}
      onOpenChange={onToggle}
      onSelect={onSelect}
      className="home-filter-dropdown"
      triggerClassName="home-filter-dropdown__trigger"
      menuClassName="home-filter-dropdown__menu"
      optionClassName="home-filter-dropdown__option"
      triggerLabel={value}
      endIcon={<ChevronDownIcon />}
    />
  );
}

function HomeSkillsFilter({ label, value, options, isOpen, onToggle, onChange }) {
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");

  const skillOptions = useMemo(
    () => options.filter((option) => normalizeOptionValue(option) !== normalizeOptionValue(label)),
    [label, options]
  );

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeOptionValue(query);

    return skillOptions.filter((option) => (
      !normalizedQuery || normalizeOptionValue(option).includes(normalizedQuery)
    ));
  }, [query, skillOptions]);

  const trimmedQuery = query.trim();
  const canCreateSkill = Boolean(trimmedQuery)
    && !includesNormalizedValue(skillOptions, trimmedQuery)
    && !includesNormalizedValue(value, trimmedQuery);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        onToggle(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onToggle(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onToggle]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isOpen]);

  const addSkill = (skill) => {
    const nextSkill = skill.trim();

    if (!nextSkill || includesNormalizedValue(value, nextSkill)) {
      setQuery("");
      return;
    }

    onChange([...value, nextSkill]);
    setQuery("");
  };

  const toggleSkill = (skill) => {
    if (includesNormalizedValue(value, skill)) {
      onChange(removeNormalizedValue(value, skill));
      return;
    }

    onChange([...value, skill]);
    setQuery("");
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();

      const exactMatch = skillOptions.find((option) => normalizeOptionValue(option) === normalizeOptionValue(trimmedQuery));

      if (exactMatch) {
        if (!includesNormalizedValue(value, exactMatch)) {
          onChange([...value, exactMatch]);
        }
        setQuery("");
        return;
      }

      if (canCreateSkill) {
        addSkill(trimmedQuery);
      }
    }
  };

  return (
    <div ref={rootRef} className={`home-skills-filter ${isOpen ? "is-open" : ""}`.trim()}>
      <button
        type="button"
        className="home-skills-filter__trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label}
        onClick={() => onToggle(!isOpen)}
      >
        <span className={`home-skills-filter__trigger-value ${value.length ? "is-filled" : ""}`.trim()}>
          {value[0] ?? label}
        </span>
        {value.length > 1 ? <span className="home-skills-filter__trigger-count">+{value.length - 1}</span> : null}
        <ChevronDownIcon />
      </button>

      {isOpen ? (
        <div className="home-skills-filter__menu">
          <div className="home-skills-filter__selected">
            {value.length ? (
              value.map((skill) => (
                <span key={skill} className="home-skills-filter__chip">
                  <span>{skill}</span>
                  <button
                    type="button"
                    className="home-skills-filter__chip-remove"
                    aria-label={`Удалить ${skill}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onChange(removeNormalizedValue(value, skill));
                    }}
                  >
                    <CloseTinyIcon />
                  </button>
                </span>
              ))
            ) : (
              <span className="home-skills-filter__empty">Выберите навыки из списка или добавьте свой</span>
            )}
          </div>

          <SearchInput
            ref={inputRef}
            value={query}
            onValueChange={setQuery}
            onKeyDown={handleSearchKeyDown}
            placeholder="Поиск навыков"
            clearLabel="Очистить поиск"
            className="home-skills-filter__search"
          />

          <div className="home-skills-filter__list" role="listbox" aria-label={label} aria-multiselectable="true">
            {canCreateSkill ? (
              <button
                type="button"
                className="home-skills-filter__option home-skills-filter__option--create"
                onClick={() => addSkill(trimmedQuery)}
              >
                <span>Добавить "{trimmedQuery}"</span>
              </button>
            ) : null}

            {filteredOptions.length ? (
              filteredOptions.map((option) => {
                const isSelected = includesNormalizedValue(value, option);

                return (
                  <button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`home-skills-filter__option ${isSelected ? "is-selected" : ""}`.trim()}
                    onClick={() => toggleSkill(option)}
                  >
                    <span>{option}</span>
                    {isSelected ? <span className="home-skills-filter__option-mark">Выбрано</span> : null}
                  </button>
                );
              })
            ) : (
              !canCreateSkill ? <span className="home-skills-filter__empty">Ничего не найдено</span> : null
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HomeCityCombobox({ value, options, onSelect }) {
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const normalizedQuery = normalizeOptionValue(query);
  const normalizedValue = normalizeOptionValue(value);
  const shouldFilter = normalizedQuery.length > 0 && normalizedQuery !== normalizedValue;
  const filteredOptions = options.filter((option) => !shouldFilter || normalizeOptionValue(option).includes(normalizedQuery));

  const commitSelection = (nextValue) => {
    onSelect(nextValue);
    setQuery(nextValue);
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery(value);
  };

  return (
    <div
      ref={rootRef}
      className={`home-discovery__city-picker ${isOpen ? "is-open" : ""}`.trim()}
      onBlurCapture={() => {
        window.requestAnimationFrame(() => {
          if (!rootRef.current?.contains(document.activeElement)) {
            handleClose();
          }
        });
      }}
    >
      <div className="home-discovery__city-control">
        <input
          ref={inputRef}
          type="text"
          className="home-discovery__city-input"
          value={query}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="home-city-select-listbox"
          aria-label="Выбор города"
          placeholder="Выберите город"
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              inputRef.current?.blur();
              handleClose();
              return;
            }

            if (event.key === "Enter") {
              event.preventDefault();

              const exactMatch = options.find((option) => normalizeOptionValue(option) === normalizeOptionValue(query));
              const nextValue = exactMatch ?? filteredOptions[0];

              if (nextValue) {
                commitSelection(nextValue);
              } else {
                handleClose();
              }
            }
          }}
        />

        <button
          type="button"
          className="home-discovery__city-toggle"
          aria-label={isOpen ? "Скрыть список городов" : "Показать список городов"}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          onClick={() => {
            if (isOpen) {
              handleClose();
            } else {
              setIsOpen(true);
              inputRef.current?.focus();
            }
          }}
        >
          <ChevronDownIcon />
        </button>
      </div>

      {isOpen ? (
        <div className="home-discovery__city-menu" id="home-city-select-listbox" role="listbox" aria-label="Список городов">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={option === value}
                className={`home-discovery__city-option ${option === value ? "is-selected" : ""}`.trim()}
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                onClick={() => {
                  commitSelection(option);
                }}
              >
                {option}
              </button>
            ))
          ) : (
            <div className="home-discovery__city-empty">Ничего не найдено</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function HomeSortControl({ options, value, direction, onSelect, onToggleDirection }) {
  return (
    <SortControl
      label="Выбрать способ сортировки"
      value={value}
      onSelect={onSelect}
      options={options.map((option) => ({ value: option.key, label: option.label }))}
      className="home-sort-control"
      triggerClassName="home-sort-control__trigger"
      menuClassName="home-sort-control__menu"
      optionClassName="home-sort-control__option"
      startIcon={<SortIcon />}
      endIcon={<ChevronDownIcon />}
      action={(
        <IconButton
          type="button"
          className="home-sort-control__direction"
          size="2xl"
          aria-label={direction === "asc" ? "Порядок: по возрастанию" : "Порядок: по убыванию"}
          onClick={onToggleDirection}
        >
          <SortDirectionIcon direction={direction} />
        </IconButton>
      )}
      menuAlignment="end"
    />
  );
}

/* function HomeHeader({ floating, visible }) {
  const authSession = useAuthSession();
  const authUser = authSession.status === "authenticated" ? authSession.user : null;

  return (
    <div className={`home-header-shell ${floating ? "is-floating" : ""} ${visible ? "is-visible" : "is-hidden"}`.trim()}>
      <header className="home-header">
        <div className="home-header__brand">
          <span className="home-header__mark" aria-hidden="true" />
          <span className="home-header__brand-text">TRAMPLIN</span>
        </div>

        <nav className="home-header__nav" aria-label="Основная навигация">
          {PUBLIC_HEADER_NAV_ITEMS.map((item) => (
            <AppLink key={item.key} href={item.href} className="home-header__nav-link">
              {item.label}
            </AppLink>
          ))}
        </nav>

        <div className="home-header__actions">
          <IconButton type="button" size="lg" className="home-header__icon-button" aria-label="Избранное">
            <HeartIcon />
          </IconButton>
          <IconButton type="button" size="lg" className="home-header__icon-button" aria-label="Уведомления">
            <BellIcon />
          </IconButton>
          {authUser ? (
            <AuthAccountMenu
              user={authUser}
              className="home-header__account"
              triggerClassName="home-header__account-trigger"
              panelClassName="home-header__account-panel"
              showText={false}
              avatarSize="sm"
              cabinetLabel="Мой кабинет"
              logoutLabel="Выйти"
            />
          ) : (
            <AppLink href={routes.auth.login} className="home-header__icon-button home-header__auth" aria-label="Войти или зарегистрироваться">
              Войти / Регистрация
              <GuestProfileIcon />
              <span className="ui-visually-hidden">Войти или зарегистрироваться</span>
            </AppLink>
          )}
        </div>
      </header>
    </div>
  );
} */

function HubCard({ title, description }) {
  return (
    <Card className="home-hub-card">
      <div className="home-hub-card__copy">
        <h3 className="ui-type-h1">{title}</h3>
        <p className="ui-type-body">{description}</p>
      </div>

      <div className="home-hub-card__avatars" aria-hidden="true">
        <span className="home-hub-card__avatar home-hub-card__avatar--orange">G</span>
        <span className="home-hub-card__avatar home-hub-card__avatar--blue">VK</span>
        <span className="home-hub-card__avatar home-hub-card__avatar--dark">M</span>
        <span className="home-hub-card__avatar home-hub-card__avatar--count">120+</span>
      </div>
    </Card>
  );
}

function AdvancedSearchPanel({ values, onToggleValue, onChangeField, onReset }) {
  return (
    <Card className="home-advanced-search">
      <div className="home-advanced-search__header">
        <div>
          <p className="ui-type-overline">Расширенный поиск</p>
          <h3 className="ui-type-h2">Уточни параметры</h3>
        </div>
        <Button type="button" variant="ghost" className="home-advanced-search__reset" onClick={onReset}>
          Сбросить
        </Button>
      </div>

      <div className="home-advanced-search__section">
        <span className="home-advanced-search__label">Что искать</span>
        <div className="home-advanced-search__chips">
          {advancedSearchSections.directions.map((item) => (
            <button
              key={item}
              type="button"
              className={`home-advanced-search__chip ${values.directions.includes(item) ? "is-active" : ""}`.trim()}
              onClick={() => onToggleValue("directions", item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="home-advanced-search__grid">
        <div className="home-advanced-search__field">
          <span className="home-advanced-search__label">Зарплата от</span>
          <Input
            value={values.salaryFrom}
            onValueChange={(nextValue) => onChangeField("salaryFrom", nextValue)}
            placeholder="90 000 ₽"
            className="home-advanced-search__input"
          />
        </div>
        <div className="home-advanced-search__field">
          <span className="home-advanced-search__label">Зарплата до</span>
          <Input
            value={values.salaryTo}
            onValueChange={(nextValue) => onChangeField("salaryTo", nextValue)}
            placeholder="200 000 ₽"
            className="home-advanced-search__input"
          />
        </div>
      </div>

      <div className="home-advanced-search__section">
        <span className="home-advanced-search__label">Формат</span>
        <div className="home-advanced-search__chips">
          {advancedSearchSections.formats.map((item) => (
            <button
              key={item}
              type="button"
              className={`home-advanced-search__chip ${values.formats.includes(item) ? "is-active" : ""}`.trim()}
              onClick={() => onToggleValue("formats", item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="home-advanced-search__section">
        <span className="home-advanced-search__label">График</span>
        <div className="home-advanced-search__chips">
          {advancedSearchSections.schedules.map((item) => (
            <button
              key={item}
              type="button"
              className={`home-advanced-search__chip ${values.schedules.includes(item) ? "is-active" : ""}`.trim()}
              onClick={() => onToggleValue("schedules", item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="home-advanced-search__section">
        <span className="home-advanced-search__label">Дополнительно</span>
        <div className="home-advanced-search__checks">
          {advancedSearchSections.extras.map((item) => (
            <Checkbox
              key={item}
              checked={values.extras.includes(item)}
              onChange={() => onToggleValue("extras", item)}
              className="home-advanced-search__check"
            >
              <span className="home-advanced-search__check-label">{item}</span>
            </Checkbox>
          ))}
        </div>
      </div>

      <div className="home-advanced-search__footer">
        <Button type="button" width="full" className="home-advanced-search__apply">
          Показать результаты
        </Button>
      </div>
    </Card>
  );
}

export function HomeApp() {
  useBodyClass("home-react-body");

  const navigate = useNavigate();
  const [view, setView] = useState("map");
  const [query, setQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState(CITY_OPTIONS[0]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterError, setNewsletterError] = useState("");
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const [sortKey, setSortKey] = useState(SORT_OPTIONS[0].key);
  const [sortDirection, setSortDirection] = useState("desc");
  const [filterValues, setFilterValues] = useState(() => ({ ...defaultFilterValues }));
  const [openFilterKey, setOpenFilterKey] = useState(null);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [isHeaderFloating, setIsHeaderFloating] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isHeroActionLoading, setIsHeroActionLoading] = useState(false);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState(null);
  const [nearbyItemsState, setNearbyItemsState] = useState({
    status: "loading",
    items: nearbyCardsCatalog,
    error: null,
  });
  const newsletterInputRef = useRef(null);
  const resultsGridRef = useRef(null);
  const [advancedSearchValues, setAdvancedSearchValues] = useState({
    salaryFrom: "",
    salaryTo: "",
    directions: ["Вакансии"],
    formats: ["Онлайн"],
    schedules: [],
    extras: ["Только активные"],
  });

  const toggleAdvancedValue = (field, item) => {
    setAdvancedSearchValues((current) => {
      const currentItems = current[field];

      return {
        ...current,
        [field]: currentItems.includes(item) ? currentItems.filter((value) => value !== item) : [...currentItems, item],
      };
    });
  };

  const updateAdvancedField = (field, nextValue) => {
    setAdvancedSearchValues((current) => ({
      ...current,
      [field]: nextValue,
    }));
  };

  const resetAdvancedSearch = () => {
    setAdvancedSearchValues({
      salaryFrom: "",
      salaryTo: "",
      directions: ["Вакансии"],
      formats: ["Онлайн"],
      schedules: [],
      extras: ["Только активные"],
    });
  };

  const closeNewsletterModal = () => {
    setIsNewsletterOpen(false);
    setNewsletterError("");

    if (newsletterSubmitted) {
      setNewsletterSubmitted(false);
      setNewsletterEmail("");
    }
  };

  const handleNewsletterSubmit = () => {
    if (!isValidEmail(newsletterEmail)) {
      setNewsletterError("Введите корректный email");
      return;
    }

    setNewsletterError("");
    setNewsletterSubmitted(true);
  };

  useEffect(() => {
    const controller = new AbortController();

    async function loadNearbyItems() {
      try {
        const items = await getOpportunities(controller.signal);

        if (controller.signal.aborted) {
          return;
        }

        const mappedItems = (Array.isArray(items) ? items : [])
          .map(mapOpportunityToHomeCard)
          .filter(Boolean);

        setNearbyItemsState({
          status: "ready",
          items: mappedItems,
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setNearbyItemsState({
          status: "error",
          items: nearbyCardsCatalog,
          error,
        });
      }
    }

    loadNearbyItems();

    return () => {
      controller.abort();
    };
  }, []);

  const filteredNearbyCards = useMemo(() => {
    const normalizedQuery = normalizeOptionValue(query);
    const normalizedSelectedCity = normalizeOptionValue(selectedCity);
    const normalizedSelectedType = normalizeOptionValue(filterValues.type);
    const normalizedSelectedFormat = normalizeOptionValue(filterValues.format);
    const normalizedSelectedLevel = normalizeOptionValue(filterValues.level);

    return nearbyItemsState.items.filter((item) => {
      const searchContent = [
        item.title,
        item.meta,
        item.accent,
        item.note,
        item.eyebrow,
        item.status,
        item.city,
        ...item.chips,
      ].join(" ");

      const normalizedSearchContent = normalizeOptionValue(searchContent);
      const matchesQuery = !normalizedQuery || normalizedSearchContent.includes(normalizedQuery);
      const matchesCity = !normalizedSelectedCity || normalizeOptionValue(item.city) === normalizedSelectedCity;
      const matchesType = filterValues.type === defaultFilterValues.type || normalizeOptionValue(item.eyebrow).includes(normalizedSelectedType);
      const matchesFormat = filterValues.format === defaultFilterValues.format
        || normalizeOptionValue(item.meta).includes(normalizedSelectedFormat)
        || item.chips.some((chip) => normalizeOptionValue(chip).includes(normalizedSelectedFormat));
      const matchesLevel = filterValues.level === defaultFilterValues.level
        || normalizeOptionValue(item.status).includes(normalizedSelectedLevel)
        || item.chips.some((chip) => normalizeOptionValue(chip).includes(normalizedSelectedLevel));
      const matchesSkills = !selectedSkills.length
        || selectedSkills.some((skill) => normalizedSearchContent.includes(normalizeOptionValue(skill)));

      return matchesQuery && matchesCity && matchesType && matchesFormat && matchesLevel && matchesSkills;
    });
  }, [filterValues.format, filterValues.level, filterValues.type, nearbyItemsState.items, query, selectedCity, selectedSkills]);

  const sortedNearbyCards = useMemo(() => {
    const directionFactor = sortDirection === "asc" ? 1 : -1;

    return filteredNearbyCards
      .map((item, index) => ({
        item,
        meta: item.sortMeta ?? createSortMeta(item, index),
      }))
      .sort((left, right) => {
        const leftValue = left.meta[sortKey] ?? 0;
        const rightValue = right.meta[sortKey] ?? 0;

        if (leftValue === rightValue) {
          return left.item.title.localeCompare(right.item.title, "ru");
        }

        return (leftValue - rightValue) * directionFactor;
      })
      .map((entry) => entry.item);
  }, [filteredNearbyCards, sortDirection, sortKey]);

  const prioritizedNearbyCards = useMemo(() => {
    if (!selectedOpportunityId) {
      return sortedNearbyCards;
    }

    const selectedIndex = sortedNearbyCards.findIndex((item) => item.id === selectedOpportunityId);

    if (selectedIndex <= 0) {
      return sortedNearbyCards;
    }

    return [
      sortedNearbyCards[selectedIndex],
      ...sortedNearbyCards.slice(0, selectedIndex),
      ...sortedNearbyCards.slice(selectedIndex + 1),
    ];
  }, [selectedOpportunityId, sortedNearbyCards]);

  useEffect(() => {
    if (!selectedOpportunityId) {
      return;
    }

    if (!sortedNearbyCards.some((item) => item.id === selectedOpportunityId)) {
      setSelectedOpportunityId(null);
    }
  }, [selectedOpportunityId, sortedNearbyCards]);

  useEffect(() => {
    if (!selectedOpportunityId || view !== "map") {
      return;
    }

    resultsGridRef.current?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [selectedOpportunityId, view]);

  const lastScrollYRef = useRef(0);

  const handleHeroDiscoverClick = async () => {
    if (isHeroActionLoading) {
      return;
    }

    setIsHeroActionLoading(true);

    try {
      await getCurrentAuthUser();
      navigate(routes.opportunities.catalog);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        navigate(routes.auth.registerCandidate);
        return;
      }

      navigate(routes.opportunities.catalog);
    }
  };

  useEffect(() => {
    let ticking = false;

    const updateHeaderVisibility = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollYRef.current;

      setIsHeaderFloating(currentScrollY > 88);

      if (currentScrollY <= 16) {
        setIsHeaderVisible(true);
      } else if (Math.abs(delta) > 6) {
        if (delta < 0) {
          setIsHeaderVisible(true);
        } else if (currentScrollY > 140) {
          setIsHeaderVisible(false);
        }
      }

      lastScrollYRef.current = currentScrollY;
      ticking = false;
    };

    const handleScroll = () => {
      if (ticking) {
        return;
      }

      ticking = true;
      window.requestAnimationFrame(updateHeaderVisibility);
    };

    updateHeaderVisibility();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <main className="home-page">
      <div className="home-page__shell ui-page-shell">
        <PortalHeader
          navItems={PUBLIC_HEADER_NAV_ITEMS}
          actionHref={routes.auth.login}
          actionLabel="Войти / Регистрация"
          shellClassName="home-page__header-shell"
          className="home-page__header"
          floating={isHeaderFloating}
          visible={isHeaderVisible}
        />

        <section className="home-hero" aria-labelledby="home-hero-title">
          <div className="home-hero__copy">
            <h1 id="home-hero-title" className="ui-type-display home-hero__title">
              Построй
              <br />
              карьеру
              <br />
              <span>мечты</span>
              <ArrowIcon />
            </h1>

            <p className="ui-type-body home-hero__description">
              Находи стажировки, вакансии, компании и менторов в одном аккуратном интерфейсе, который помогает быстро стартовать и расти.
            </p>

            <div className="home-hero__actions">
              <Button as="a" href="#workflow" variant="secondary" className="home-hero__secondary">
                Как это работает
              </Button>
              <Button className="home-hero__primary" loading={isHeroActionLoading} onClick={handleHeroDiscoverClick}>
                Найти возможность для себя
              </Button>
            </div>
          </div>

          <div className="home-hero__visual" aria-label="Иллюстрация главной страницы">
            <span className="home-hero__shape home-hero__shape--blue" aria-hidden="true" />
            <span className="home-hero__shape home-hero__shape--lime" aria-hidden="true" />
            <span className="home-hero__shape home-hero__shape--bar-top" aria-hidden="true" />
            <span className="home-hero__shape home-hero__shape--bar-bottom" aria-hidden="true" />
            <span className="home-hero__shape home-hero__shape--triangle" aria-hidden="true" />

            <Card className="home-hero__photo-card">
              <div className="home-hero__photo-placeholder">
                <span>Место под изображение</span>
              </div>

              <div className="home-hero__photo-tags">
                {heroTags.map((tag, index) => (
                  <Tag key={tag} tone={index === 0 ? "accent" : "default"} className="home-hero__photo-tag">
                    {tag}
                  </Tag>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section className="home-discovery" id="discover">
          <div className="home-discovery__intro">
            <p className="ui-type-body">Изучай возможности на карте, сохраняй интересное и строй карьеру через контакты и отклики.</p>
          </div>

          <div className="home-discovery__header">
            <div className="home-discovery__title-row">
              <h2 className="ui-type-h1">Возможности рядом</h2>
              <HomeCityCombobox value={selectedCity} options={CITY_OPTIONS} onSelect={setSelectedCity} />
              <button type="button" className="home-discovery__city">
                {selectedCity}
                <ChevronDownIcon />
              </button>
            </div>

            <SegmentedControl
              className="home-discovery__view-switch"
              items={[
                { value: "map", label: "Карта возможностей" },
                { value: "list", label: "Список возможностей" },
              ]}
              value={view}
              onChange={setView}
              ariaLabel="Режим просмотра возможностей"
              size="md"
              stretch
            />
          </div>

          <div className="home-discovery__toolbar">
            <SearchInput value={query} onValueChange={setQuery} placeholder="Поиск возможностей" clearLabel="Очистить" className="home-discovery__search" />

            <div className="home-discovery__toolbar-icons">
              <HomeSortControl
                options={SORT_OPTIONS}
                value={sortKey}
                direction={sortDirection}
                onSelect={setSortKey}
                onToggleDirection={() => setSortDirection((current) => (current === "asc" ? "desc" : "asc"))}
              />
              <IconButton type="button" variant="accent" size="2xl" className="home-discovery__toolbar-icon" aria-label="Показать регион">
                <PinIcon />
              </IconButton>
              <IconButton
                type="button"
                variant="outline"
                size="2xl"
                className={`home-discovery__toolbar-icon home-discovery__toolbar-icon--outlined ${advancedSearchOpen ? "is-active" : ""}`.trim()}
                aria-label="Переключить расширенный поиск"
                aria-pressed={advancedSearchOpen}
                active={advancedSearchOpen}
                onClick={() => setAdvancedSearchOpen((current) => !current)}
              >
                <SlidersIcon />
              </IconButton>
            </div>
          </div>

          <div className="home-discovery__filters" aria-label="Быстрые фильтры">
            {visibleFilterSelects.map((filter) => (
              <div key={filter.key} className="home-discovery__filter-select">
                {filter.key === "skills" ? (
                  <HomeSkillsFilter
                    label={filter.label}
                    value={selectedSkills}
                    options={filter.options}
                    isOpen={openFilterKey === filter.key}
                    onToggle={(nextState) => {
                      setOpenFilterKey(nextState ? filter.key : null);
                    }}
                    onChange={setSelectedSkills}
                  />
                ) : (
                  <HomeFilterDropdown
                    label={filter.label}
                    value={filterValues[filter.key]}
                    options={filter.options}
                    isOpen={openFilterKey === filter.key}
                    onToggle={(nextState) => {
                      setOpenFilterKey(nextState ? filter.key : null);
                    }}
                    onSelect={(nextValue) => {
                      setFilterValues((current) => ({
                        ...current,
                        [filter.key]: nextValue,
                      }));
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          <div
            className={`home-discovery__grid home-discovery__grid--${view} ${advancedSearchOpen ? "is-advanced-open" : ""}`.trim()}
          >
            {view === "map" ? (
              <Card className="home-map-card">
                <div className="home-map-card__legend">
                  <Tag className="home-map-card__legend-chip"><span className="home-map-card__dot home-map-card__dot--blue" aria-hidden="true" />Вакансия</Tag>
                  <Tag className="home-map-card__legend-chip"><span className="home-map-card__dot home-map-card__dot--green" aria-hidden="true" />Стажировка</Tag>
                  <Tag className="home-map-card__legend-chip"><span className="home-map-card__dot home-map-card__dot--orange" aria-hidden="true" />Мероприятие</Tag>
                </div>

                <div className="home-map-card__surface home-map-card__surface--interactive">
                  <HomeOpportunityMap
                    items={prioritizedNearbyCards}
                    selectedCity={selectedCity}
                    activeId={selectedOpportunityId}
                    onSelectItem={setSelectedOpportunityId}
                  />
                </div>
              </Card>
            ) : null}

            {view === "map" && advancedSearchOpen ? (
              <AdvancedSearchPanel
                values={advancedSearchValues}
                onToggleValue={toggleAdvancedValue}
                onChangeField={updateAdvancedField}
                onReset={resetAdvancedSearch}
              />
            ) : (
              <div ref={resultsGridRef} className={`home-results-grid ${view === "list" ? "home-results-grid--list" : ""}`.trim()}>
                {prioritizedNearbyCards.length ? (
                  prioritizedNearbyCards.map((item) => (
                    <OpportunityRowCard
                      key={item.id ?? item.title}
                      item={item}
                      surface="plain"
                      size="sm"
                      className={`home-opportunity-entry ${selectedOpportunityId === item.id ? "is-selected" : ""}`.trim()}
                      primaryAction={createSafeHomeRowActions(item).primaryAction}
                      detailAction={createSafeHomeRowActions(item).detailAction}
                    />
                  ))
                ) : (
                  <Card className="home-results-empty">
                    <strong>Ничего не найдено</strong>
                    <p>Сбросьте часть фильтров, чтобы снова увидеть вакансии и мероприятия.</p>
                  </Card>
                )}
              </div>
            )}

            {view === "list" && advancedSearchOpen ? (
              <AdvancedSearchPanel
                values={advancedSearchValues}
                onToggleValue={toggleAdvancedValue}
                onChangeField={updateAdvancedField}
                onReset={resetAdvancedSearch}
              />
            ) : null}
          </div>

          <div className="home-discovery__more">
            <Button as="a" href="/opportunities" variant="secondary">
              Больше возможностей
            </Button>
          </div>
        </section>

        <section className="home-section">
          <div className="home-section__head">
            <h2 className="ui-type-h1">Популярные вакансии</h2>
          </div>
          <div className="home-section__rail" aria-label="РџРѕРїСѓР»СЏСЂРЅС‹Рµ РІР°РєР°РЅСЃРёРё">
            {popularCardsWithDetails.map((item, index) => (
              <OpportunityBlockCard
                key={`${item.title}-${item.status}-${index}`}
                item={item}
                surface="plain"
                size="md"
                className="home-opportunity-entry"
                detailAction={createSafeHomeBlockDetailAction(item)}
              />
            ))}
          </div>
        </section>

        <section className="home-section" id="workflow">
          <div className="home-section__head">
            <h2 className="ui-type-h1">Рекомендуемые возможности</h2>
          </div>
          <div className="home-section__rail" aria-label="Р РµРєРѕРјРµРЅРґСѓРµРјС‹Рµ РІРѕР·РјРѕР¶РЅРѕСЃС‚Рё">
            {recommendedCardsWithDetails.map((item, index) => (
              <OpportunityBlockCard
                key={`${item.title}-${index}`}
                item={item}
                surface="plain"
                size="md"
                className="home-opportunity-entry"
                detailAction={createSafeHomeBlockDetailAction(item)}
              />
            ))}
          </div>
        </section>

        <section className="home-hubs" id="companies">
          <HubCard title="Компании" description="Собранные работодатели для первой работы и уверенного карьерного старта." />
          <HubCard title="Менторы" description="Практики из продуктовых команд, которые помогают выстроить путь роста." />

          <Card
            interactive
            className="home-news-card"
            id="about"
            role="button"
            tabIndex={0}
            aria-haspopup="dialog"
            aria-expanded={isNewsletterOpen}
            onClick={() => setIsNewsletterOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setIsNewsletterOpen(true);
              }
            }}
          >
            <Tag className="home-news-card__badge">
              Раз в неделю
            </Tag>
            <div className="home-news-card__copy">
              <h2 className="ui-type-h1">Подпишись на рассылку</h2>
              <p className="ui-type-body">Новые стажировки, события и карьерные материалы без лишнего шума.</p>
            </div>
            <IconButton type="button" variant="accent" size="2xl" className="home-news-card__action" aria-label="Открыть форму подписки">
              <ArrowIcon />
            </IconButton>
            <div className="home-news-card__footer">
              <span className="home-news-card__hint">Открыть форму подписки</span>
            </div>
          </Card>
        </section>

        <Modal
          open={isNewsletterOpen}
          onClose={closeNewsletterModal}
          title={newsletterSubmitted ? "Подписка оформлена" : "Подписка на рассылку"}
          description={
            newsletterSubmitted
              ? "Раз в неделю будем присылать новые стажировки, события и карьерные материалы без лишнего шума."
              : "Оставьте email, чтобы раз в неделю получать свежую подборку стажировок, событий и полезных карьерных материалов."
          }
          initialFocusRef={newsletterSubmitted ? undefined : newsletterInputRef}
          className="home-news-modal"
          actions={newsletterSubmitted ? (
            <Button onClick={closeNewsletterModal}>Закрыть</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={closeNewsletterModal}>Позже</Button>
              <Button onClick={handleNewsletterSubmit}>Подписаться</Button>
            </>
          )}
        >
          {newsletterSubmitted ? (
            <div className="home-news-modal__success">
              <span className="home-news-modal__success-icon" aria-hidden="true">
                <MailIcon />
              </span>
              <div className="home-news-modal__chips">
                <Tag>Стажировки</Tag>
                <Tag>События</Tag>
                <Tag>Карьерные советы</Tag>
              </div>
            </div>
          ) : (
            <div className="home-news-modal__form">
              <div className="home-news-modal__chips">
                <Tag>Раз в неделю</Tag>
                <Tag>Без спама</Tag>
                <Tag>Только полезное</Tag>
              </div>

              <label className="home-news-modal__field">
                <span className="home-news-modal__label">Email</span>
                <Input
                  ref={newsletterInputRef}
                  type="email"
                  value={newsletterEmail}
                  onValueChange={(nextValue) => {
                    setNewsletterEmail(nextValue);
                    if (newsletterError) {
                      setNewsletterError("");
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleNewsletterSubmit();
                    }
                  }}
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="home-news-modal__input"
                />
              </label>

              {newsletterError ? (
                <p className="home-news-modal__error">{newsletterError}</p>
              ) : (
                <p className="home-news-modal__caption">Можно подключить реальный submit или интеграцию с email-сервисом на этом действии.</p>
              )}
            </div>
          )}
        </Modal>
      </div>
    </main>
  );
}

