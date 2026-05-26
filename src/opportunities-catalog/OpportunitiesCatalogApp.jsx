import { useEffect, useMemo, useRef, useState } from "react";
import { PUBLIC_HEADER_NAV_ITEMS, buildCompanyPublicRoute, buildOpportunityDetailRoute, routes } from "../app/routes";
import { useLocation } from "react-router-dom";
import { AppLink } from "../app/AppLink";
import { DEFAULT_CITY_NAME, FALLBACK_CITY_OPTIONS, getFallbackCityOption } from "../api/cities";
import { getCandidateProfile } from "../api/candidate";
import { getPublicCompany } from "../api/company";
import { getOpportunities } from "../api/opportunities";
import { FALLBACK_REFERENCE_CATEGORIES, getSystemReferences, normalizeReferenceCategories } from "../api/systemReferences";
import { OpportunityBlockSlider, OpportunityFilterSidebar, OpportunityRowCard } from "../components/opportunities";
import { parseSocialLinks } from "../features/company/socialLinks";
import {
  readFavoriteCompanyIds,
  readFavoriteOpportunityIds,
  subscribeToFavorites,
  toggleFavoriteCompany,
} from "../features/favorites/storage";
import { HomeOpportunityMap } from "../home/HomeOpportunityMap";
import { useFloatingHeader } from "../shared/lib/useFloatingHeader";
import { scheduleHashScroll } from "../shared/lib/scrollToHashTarget";
import { getOpportunityApplyLabel, translateOpportunityType as translateSharedOpportunityType } from "../shared/lib/opportunityTypes";
import { getOpportunityCardPresentation, translateExperienceLevel, translateWorkSchedule } from "../shared/lib/opportunityPresentation";
import { resolveSocialType, getSocialIcon, getSocialLabel } from "../shared/lib/socialPresentation";
import { PortalHeader } from "../widgets/layout/PortalHeader/PortalHeader";
import {
  Alert,
  Avatar,
  Button,
  Card,
  CityAutocomplete,
  EmptyState,
  IconButton,
  Loader,
  PillButton,
  SearchInput,
  SectionHeader,
  SegmentedControl,
  SortControl,
  Tag,
  HeartIcon,
  ChevronDownIcon,
  SortIcon,
  DirectionIcon,
  SlidersIcon,
  TelegramIcon,
  GlobeIcon,
  VkIcon,
  YoutubeIcon,
  GithubIcon,
  LinkIcon,
} from "../shared/ui";
import "../ui-kit/ui-kit.css";
import "./opportunities-catalog.css";

const BODY_CLASS = "opportunities-browser-react-body";
const HASH_SCROLL_OFFSET = 112;

const NAV_ITEMS = PUBLIC_HEADER_NAV_ITEMS;

const TYPE_FILTERS = [
  { value: "all", label: "Все" },
  { value: "vacancy", label: "Вакансии" },
  { value: "internship", label: "Стажировки" },
  { value: "event", label: "Мероприятия" },
  { value: "mentoring", label: "Менторские программы" },
];

const MAP_LEGEND_ITEMS = [
  { tone: "blue", label: "Вакансия" },
  { tone: "green", label: "Стажировка" },
  { tone: "orange", label: "Мероприятие" },
  { tone: "teal", label: "Менторская программа" },
];

const MAP_DISPLAY_ITEMS = [
  { value: "all", label: "\u0412\u0441\u0435" },
  { value: "favorites", label: "\u0422\u043e\u043b\u044c\u043a\u043e \u0438\u0437\u0431\u0440\u0430\u043d\u043d\u043e\u0435" },
  { value: "non-favorites", label: "\u041d\u0435 \u0438\u0437\u0431\u0440\u0430\u043d\u043d\u043e\u0435" },
];

const FILTER_ALL_VALUE = "all";
const FILTER_ALL_LABEL = "Все";

const QUICK_FILTERS = [
  { key: "type", label: "Тип" },
  { key: "format", label: "Формат" },
  { key: "level", label: "Опыт" },
  { key: "schedule", label: "График" },
  { key: "skills", label: "Навыки" },
];

const LEVEL_FILTER_ORDER = ["Без опыта", "Junior", "Middle", "Senior"];

const SORT_OPTIONS = [
  { key: "popularity", label: "По популярности" },
  { key: "date", label: "По дате публикации" },
  { key: "salary", label: "По зарплате" },
  { key: "title", label: "По названию" },
];






function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function tokenize(value) {
  return normalize(value)
    .replace(/[^a-zа-яё0-9+#]+/gi, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function uniqueOptions(values) {
  return [...new Set(values.filter(Boolean).map((value) => String(value).trim()).filter(Boolean))].sort((left, right) =>
    left.localeCompare(right, "ru")
  );
}

function orderByKnownSequence(values, sequence) {
  const normalizedOrder = new Map(sequence.map((value, index) => [normalize(value), index]));

  return [...values].sort((left, right) => {
    const leftOrder = normalizedOrder.get(normalize(left));
    const rightOrder = normalizedOrder.get(normalize(right));

    if (leftOrder != null && rightOrder != null) {
      return leftOrder - rightOrder;
    }

    if (leftOrder != null) {
      return -1;
    }

    if (rightOrder != null) {
      return 1;
    }

    return left.localeCompare(right, "ru");
  });
}

function createFilterTriggerLabel(label, currentLabel) {
  return `${label} : ${currentLabel}`;
}

function getOpportunityLevelLabel(item) {
  if (item?.experienceLevel) {
    return translateExperienceLevel(item.experienceLevel);
  }

  const content = normalize([
    item?.title,
    item?.description,
    item?.opportunityType,
    item?.duration,
    ...(Array.isArray(item?.tags) ? item.tags : []),
  ].join(" "));

  if (/(senior|старш|ведущ)/.test(content)) {
    return "Senior";
  }

  if (/(middle|мидл)/.test(content)) {
    return "Middle";
  }

  if (/(junior|младш|стажер|стажёр)/.test(content)) {
    return "Junior";
  }

  if (/(internship|стажиров|без опыта|старт)/.test(content)) {
    return "Без опыта";
  }

  return "";
}

function createQuickFilterOptions(items, references = FALLBACK_REFERENCE_CATEGORIES) {
  const typeFilters = [
    { value: FILTER_ALL_VALUE, label: FILTER_ALL_LABEL },
    ...references.opportunityTypes.map((item) => ({ value: item.value, label: item.label })),
  ];
  const referenceEmploymentTypes = references.employmentTypes?.length
    ? references.employmentTypes.map((item) => ({ value: item.value, label: item.label }))
    : [];

  return {
    type: typeFilters.length > 1 ? typeFilters : TYPE_FILTERS,
    format: [
      { value: FILTER_ALL_VALUE, label: FILTER_ALL_LABEL },
      ...(referenceEmploymentTypes.length
        ? referenceEmploymentTypes
        : uniqueOptions(items.map((item) => translateEmploymentType(item.employmentType)))
          .filter(Boolean)
          .map((value) => ({ value, label: value }))),
    ],
    level: [
      { value: FILTER_ALL_VALUE, label: FILTER_ALL_LABEL },
      ...(references.experienceLevels?.length
        ? references.experienceLevels
        : orderByKnownSequence(uniqueOptions(items.map(getOpportunityLevelLabel)), LEVEL_FILTER_ORDER).map((value) => ({ value, label: value }))),
    ],
    schedule: [
      { value: FILTER_ALL_VALUE, label: FILTER_ALL_LABEL },
      ...(references.workSchedules?.length
        ? references.workSchedules
        : uniqueOptions(items.map((item) => translateWorkSchedule(item.schedule)).filter(Boolean)).map((value) => ({ value, label: value }))),
    ],
    skills: [
      { value: FILTER_ALL_VALUE, label: FILTER_ALL_LABEL },
      ...uniqueOptions(items.flatMap((item) => (Array.isArray(item.tags) ? item.tags : []))).map((value) => ({ value, label: value })),
    ],
  };
}

function getSortValue(item, sortKey) {
  switch (sortKey) {
    case "salary":
      return Number(item?.salaryTo ?? item?.salaryFrom ?? item?.stipendTo ?? item?.stipendFrom ?? 0);
    case "date":
      return new Date(item?.publishAt ?? item?.eventStartAt ?? item?.registrationDeadline ?? 0).getTime() || 0;
    case "title":
      return String(item?.title ?? "");
    case "popularity":
    default:
      return Number(item?.salaryTo ?? item?.salaryFrom ?? item?.stipendTo ?? item?.stipendFrom ?? 0)
        + (Array.isArray(item?.tags) ? item.tags.length : 0);
  }
}

function sortOpportunities(items, sortKey, sortDirection) {
  if (sortKey === "popularity") {
    return sortDirection === "asc" ? [...items].reverse() : [...items];
  }

  const directionFactor = sortDirection === "asc" ? 1 : -1;

  return [...items].sort((left, right) => {
    const leftValue = getSortValue(left, sortKey);
    const rightValue = getSortValue(right, sortKey);

    if (typeof leftValue === "string" || typeof rightValue === "string") {
      return String(leftValue).localeCompare(String(rightValue), "ru") * directionFactor;
    }

    if (leftValue !== rightValue) {
      return (leftValue - rightValue) * directionFactor;
    }

    return String(left.title ?? "").localeCompare(String(right.title ?? ""), "ru");
  });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function pluralize(count, [one, few, many]) {
  const abs = Math.abs(count) % 100;
  const last = abs % 10;

  if (abs > 10 && abs < 20) {
    return many;
  }

  if (last === 1) {
    return one;
  }

  if (last >= 2 && last <= 4) {
    return few;
  }

  return many;
}

function formatCount(count, words) {
  return `${new Intl.NumberFormat("ru-RU").format(count)} ${pluralize(count, words)}`;
}

function translateOpportunityType(value) {
  return translateSharedOpportunityType(value);
/*
  switch (value) {
    case "vacancy":
      return "Вакансия";
    case "internship":
      return "Стажировка";
    case "event":
      return "Мероприятие";
    default:
      return value || "Возможность";
  }*/
}

function translateEmploymentType(value) {
  switch (normalize(value)) {
    case "remote":
      return "Удаленно";
    case "hybrid":
      return "Гибрид";
    case "office":
    case "onsite":
      return "На месте работодателя";
    case "online":
      return "Онлайн";
    default:
      return value && normalize(value) !== "unspecified" ? value : "";
  }
}

function shortenText(value, maxLength = 96) {
  const text = String(value ?? "").trim();

  if (!text) {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trim()}…`;
}

function createOpportunityMeta(item) {
  return [item.companyName, item.locationCity, translateEmploymentType(item.employmentType)].filter(Boolean).join(" · ");
}

function createRowCardItem(item) {
  const presentation = getOpportunityCardPresentation(item);

  return {
    id: item.id,
    ...presentation,
    meta: createOpportunityMeta(item),
  };
}

function hasValidCoordinates(item) {
  return Number.isFinite(Number(item?.longitude)) && Number.isFinite(Number(item?.latitude));
}

function createMapCardItem(item) {
  const presentation = getOpportunityCardPresentation(item);

  return {
    id: String(item.id),
    employerId: item?.employerId != null ? String(item.employerId) : "",
    eyebrow: presentation.type,
    ...presentation,
    title: item.title,
    meta: createOpportunityMeta(item),
    coordinates: [Number(item.longitude), Number(item.latitude)],
    detailHref: buildOpportunityDetailRoute(item.id),
    isFavoriteOpportunity: Boolean(item.isFavoriteOpportunity ?? item.isFavorite),
    isFavoriteCompanyOpportunity: Boolean(item.isFavoriteCompanyOpportunity),
    isFavorite: Boolean(item.isFavorite),
  };
}

function getMapResultsDescription(filteredCount, mapPointsCount) {
  if (!filteredCount) {
    return "По текущим фильтрам нет подходящих возможностей.";
  }

  if (!mapPointsCount) {
    return `Найдено ${formatCount(filteredCount, ["возможность", "возможности", "возможностей"])}, но ни у одной нет координат для карты.`;
  }

  if (filteredCount === mapPointsCount) {
    return `На карте ${formatCount(mapPointsCount, ["возможность", "возможности", "возможностей"])}.`;
  }

  return `На карте ${formatCount(mapPointsCount, ["возможность", "возможности", "возможностей"])} из ${formatCount(filteredCount, ["возможность", "возможности", "возможностей"])}. Остальные скрыты без координат.`;
}

function scoreOpportunity(item, candidateSkills, activeType, city) {
  const haystack = [
    item.title,
    item.description,
    item.companyName,
    item.locationCity,
    ...(Array.isArray(item.tags) ? item.tags : []),
  ]
    .map((entry) => String(entry ?? ""))
    .join(" ")
    .toLowerCase();

  const matchedSkills = candidateSkills.filter((skill) => {
    const tokens = tokenize(skill);
    return tokens.length > 0 && tokens.every((token) => haystack.includes(token));
  });

  const skillBonus = Math.min(matchedSkills.length * 12, 36);
  const typeBonus = activeType !== "all" && item.opportunityType === activeType ? 4 : 0;
  const cityBonus = city && normalize(item.locationCity) === normalize(city) ? 3 : 0;

  return {
    matchedSkills,
    matchedSkillsCount: matchedSkills.length,
    score: clamp(55 + skillBonus + typeBonus + cityBonus, 55, 95),
  };
}

function createRecommendationCard(item, scoreData) {
  const cardPresentation = getOpportunityCardPresentation(item);
  const hasSkillMatch = scoreData.matchedSkillsCount > 0;

  return {
    id: item.id,
    ...cardPresentation,
    status: hasSkillMatch ? `Подходит на ${scoreData.score}%` : "",
    statusTone: hasSkillMatch ? "success" : "neutral",
    meta: createOpportunityMeta(item),
  };
}

function createRecommendationSliderCardProps(item) {
  return {
    detailAction: {
      href: buildOpportunityDetailRoute(item.id),
      label: "Подробнее",
      variant: "secondary",
    },
  };
}

function CatalogFilterDropdown({ label, value, options, isOpen, onToggle, onSelect }) {
  const resolvedOptions = options.length ? options : [{ value: FILTER_ALL_VALUE, label: FILTER_ALL_LABEL }];
  const selectedOption = resolvedOptions.find((option) => String(option.value) === String(value)) ?? resolvedOptions[0];
  const triggerLabel = createFilterTriggerLabel(label, selectedOption?.label ?? FILTER_ALL_LABEL);

  return (
    <SortControl
      label={triggerLabel}
      value={selectedOption.value}
      options={resolvedOptions}
      open={isOpen}
      onOpenChange={onToggle}
      onSelect={onSelect}
      className="opportunities-browser-filter-dropdown"
      triggerClassName="opportunities-browser-filter-dropdown__trigger"
      menuClassName="opportunities-browser-filter-dropdown__menu"
      optionClassName="opportunities-browser-filter-dropdown__option"
      triggerLabel={triggerLabel}
      endIcon={<ChevronDownIcon />}
    />
  );
}

function CatalogSortControl({ value, direction, onSelect, onToggleDirection }) {
  return (
    <SortControl
      label="Выбрать способ сортировки"
      value={value}
      onSelect={onSelect}
      options={SORT_OPTIONS.map((option) => ({ value: option.key, label: option.label }))}
      className="opportunities-browser-sort-control"
      triggerClassName="opportunities-browser-sort-control__trigger"
      menuClassName="opportunities-browser-sort-control__menu"
      optionClassName="opportunities-browser-sort-control__option"
      startIcon={<SortIcon />}
      endIcon={<ChevronDownIcon />}
      action={(
        <IconButton
          type="button"
          className="opportunities-browser-sort-control__direction"
          size="2xl"
          aria-label={direction === "asc" ? "Порядок: по возрастанию" : "Порядок: по убыванию"}
          onClick={onToggleDirection}
        >
          <DirectionIcon />
        </IconButton>
      )}
    />
  );
}

function getCompanyInitial(name) {
  return String(name ?? "").trim().slice(0, 1).toUpperCase() || "C";
}

function createCompanyFallbackDescription(company) {
  if (company.sampleDescription) {
    return shortenText(company.sampleDescription, 144);
  }

  return `Сейчас у компании ${formatCount(company.count, ["открыта возможность", "открыты возможности", "открыто возможностей"])} в ${company.locationCity}.`;
}

function getCompanyDescription(company, profile) {
  const profileDescription = String(profile?.description ?? "").trim();

  if (profileDescription) {
    return profileDescription;
  }

  return createCompanyFallbackDescription(company);
}

function getCompanyAddress(company, profile) {
  return (
    String(profile?.legalAddress ?? "").trim()
    || String(company.sampleAddress ?? "").trim()
    || String(company.locationCity ?? "").trim()
  );
}

function getCompanyLogoUrl(company, profile) {
  return (
    String(profile?.profileImage ?? profile?.ProfileImage ?? "").trim()
    || String(company.profileImage ?? company.companyProfileImage ?? company.logoUrl ?? "").trim()
  );
}

function isTelegramSocialLink(link) {
  const href = String(link?.href ?? "").trim().toLowerCase();
  const type = normalize(link?.type);

  return type === "telegram" || type === "tg" || href.includes("t.me/");
}

function isWebsiteSocialLink(link) {
  const href = String(link?.href ?? "").trim().toLowerCase();
  const type = normalize(link?.type);

  if (isTelegramSocialLink(link)) {
    return false;
  }

  return type === "website" || type === "site" || type === "web" || href.startsWith("http");
}

function getCompanyLinks(profile) {
  return parseSocialLinks(profile?.socials)
    .filter((link) => isTelegramSocialLink(link) || isWebsiteSocialLink(link))
    .sort((left, right) => Number(isTelegramSocialLink(left)) - Number(isTelegramSocialLink(right)))
    .slice(0, 2)
    .map((link) => ({
      ...link,
      label: isTelegramSocialLink(link) ? "telegram" : "website",
    }));
}

function CompanySpotlightSlide({ company, profileState, isFavorite, onToggleFavorite }) {
  const profile = profileState?.status === "ready" ? profileState.profile : null;
  const companyHref = company.employerId ? buildCompanyPublicRoute(company.employerId, { from: "opportunities" }) : "";
  const links = getCompanyLinks(profile);
  const description = getCompanyDescription(company, profile);
  const address = getCompanyAddress(company, profile);
  const logoUrl = getCompanyLogoUrl(company, profile);

  return (
    <Card className="company-spotlight opportunities-browser__company-spotlight">
      <div className="company-spotlight__company">
        <Avatar
          size="lg"
          src={logoUrl || undefined}
          name={company.name}
          initials={getCompanyInitial(company.name)}
          alt={`Логотип компании ${company.name || ""}`.trim()}
          className="company-spotlight__avatar company-spotlight__avatar--brand"
        />
        <div className="company-spotlight__copy">
          {companyHref ? (
            <AppLink href={companyHref} className="opportunity-card-page__more-link">
              <h2 className="ui-type-h4">{company.name}</h2>
            </AppLink>
          ) : (
            <h2 className="ui-type-h4">{company.name}</h2>
          )}
          <p className="ui-type-body">{description}</p>
        </div>
      </div>

      {address ? <p className="ui-type-body">{address}</p> : null}

      {links.length ? (
        <div className="opportunity-company-socials">
          {links.map((link) => {
            const type = resolveSocialType(link.label, link.href);
            return (
              <IconButton
                key={link.id}
                href={link.href}
                label={link.label}
                size="lg"
                target="_blank"
                rel="noreferrer"
                className="opportunity-company-socials__item"
              >
                {getSocialIcon(type)}
              </IconButton>
            );
          })}
        </div>
      ) : null}

      <div className="company-spotlight__footer">
        {companyHref ? (
          <Button href={companyHref} variant="secondary" className="company-spotlight__recommend">
            Открыть профиль компании
          </Button>
        ) : null}

        {company.employerId ? (
          <IconButton
            type="button"
            label={isFavorite ? "Убрать компанию из избранного" : "Сохранить компанию"}
            variant="outline"
            size="xl"
            className="opportunities-browser__company-favorite"
            aria-pressed={isFavorite}
            active={isFavorite}
            onClick={() => onToggleFavorite(company.employerId)}
          >
            <HeartIcon />
          </IconButton>
        ) : null}
      </div>
    </Card>
  );
}

function buildCompanyGroups(items) {
  const cityMap = new Map();

  items.forEach((item) => {
    const city = String(item.locationCity ?? "").trim();
    const companyName = String(item.companyName ?? "").trim();
    const employerId = item?.employerId != null ? String(item.employerId) : "";

    if (!city || !companyName) {
      return;
    }

    const cityEntry = cityMap.get(city) ?? { city, count: 0, companies: new Map() };
    const companyKey = employerId || companyName.toLowerCase();
    const companyEntry = cityEntry.companies.get(companyKey) ?? {
      id: companyKey,
      employerId,
      name: companyName,
      count: 0,
      locationCity: city,
      sampleAddress: "",
      sampleDescription: "",
      profileImage: "",
    };

    companyEntry.count += 1;
    companyEntry.sampleAddress ||= String(item.locationAddress ?? "").trim();
    companyEntry.sampleDescription ||= String(item.description ?? "").trim();
    companyEntry.profileImage ||= String(item.companyProfileImage ?? item.profileImage ?? "").trim();
    cityEntry.count += 1;
    cityEntry.companies.set(companyKey, companyEntry);
    cityMap.set(city, cityEntry);
  });

  return [...cityMap.values()]
    .map((entry) => ({
      city: entry.city,
      count: entry.count,
      companies: [...entry.companies.values()].sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, "ru")),
    }))
    .sort((left, right) => right.count - left.count || left.city.localeCompare(right.city, "ru"));
}

export function OpportunitiesCatalogApp() {
  const location = useLocation();
  const filtersAnchorRef = useRef(null);
  const { isHeaderFloating, isHeaderVisible } = useFloatingHeader();
  const [state, setState] = useState({
    status: "loading",
    items: [],
    candidate: null,
    error: null,
  });
  const [filters, setFilters] = useState({
    query: "",
    activeType: "all",
    city: DEFAULT_CITY_NAME,
    specialization: "",
    employmentTypes: [],
    level: FILTER_ALL_VALUE,
    schedule: FILTER_ALL_VALUE,
    incomeFrom: "",
    payoutPeriod: "",
    education: [],
  });
  const [view, setView] = useState("list");
  const [sortKey, setSortKey] = useState(SORT_OPTIONS[0].key);
  const [sortDirection, setSortDirection] = useState("desc");
  const [cityInputValue, setCityInputValue] = useState(() => getFallbackCityOption(DEFAULT_CITY_NAME)?.name ?? DEFAULT_CITY_NAME);
  const [openQuickFilterKey, setOpenQuickFilterKey] = useState(null);
  const [favoritesDisplay, setFavoritesDisplay] = useState("all");
  const [filtersDropdownOpen, setFiltersDropdownOpen] = useState(false);
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  const [favoriteOpportunityIds, setFavoriteOpportunityIds] = useState(() => readFavoriteOpportunityIds());
  const [favoriteCompanyIds, setFavoriteCompanyIds] = useState(() => readFavoriteCompanyIds());
  const [selectedMapItemId, setSelectedMapItemId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(3);
  const [companyCity, setCompanyCity] = useState("");
  const [companyProfiles, setCompanyProfiles] = useState({});
  const [referenceCategories, setReferenceCategories] = useState(FALLBACK_REFERENCE_CATEGORIES);

  useEffect(() => {
    document.body.classList.add(BODY_CLASS);

    return () => {
      document.body.classList.remove(BODY_CLASS);
    };
  }, []);

  useEffect(() => subscribeToFavorites(setFavoriteOpportunityIds), []);
  useEffect(() => subscribeToFavorites(setFavoriteCompanyIds, { scope: "companies" }), []);

  useEffect(() => {
    if (!location.hash || state.status !== "ready") {
      return undefined;
    }

    return scheduleHashScroll(location.hash, {
      offset: HASH_SCROLL_OFFSET,
      behavior: "smooth",
    });
  }, [location.hash, location.pathname, state.status]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const [items, candidate, references] = await Promise.all([
          getOpportunities(controller.signal),
          getCandidateProfile(controller.signal).catch((error) => {
            if (error?.status === 401 || error?.status === 403) {
              return null;
            }

            return null;
          }),
          getSystemReferences(controller.signal).then(normalizeReferenceCategories).catch(() => FALLBACK_REFERENCE_CATEGORIES),
        ]);

        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: "ready",
          items: Array.isArray(items) ? items : [],
          candidate,
          error: null,
        });
        setReferenceCategories(references);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: "error",
          items: [],
          candidate: null,
          error,
        });
      }
    }

    load();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    setVisibleCount(3);
  }, [filters.query, filters.activeType, filters.city, filters.specialization, filters.employmentTypes, filters.level, filters.schedule]);

  useEffect(() => {
    if (view === "map") {
      setFiltersDropdownOpen(false);
      return;
    }

    setFiltersDrawerOpen(false);
  }, [view]);

  const filterOptions = useMemo(
    () => ({
      cities: FALLBACK_CITY_OPTIONS,
      specializations: uniqueOptions(state.items.flatMap((item) => (Array.isArray(item.tags) ? item.tags : []))).map((value) => ({ value, label: value })),
      employmentTypes: referenceCategories.employmentTypes?.length
        ? referenceCategories.employmentTypes
        : uniqueOptions(state.items.map((item) => translateEmploymentType(item.employmentType)))
          .filter(Boolean)
          .map((value) => ({ value, label: value })),
    }),
    [referenceCategories.employmentTypes, state.items]
  );
  const quickFilterOptions = useMemo(() => createQuickFilterOptions(state.items, referenceCategories), [referenceCategories, state.items]);
  const visibleQuickFilters = useMemo(
    () => QUICK_FILTERS.filter((filter) => (
      filter.key !== "schedule"
      || state.items.some((item) => String(item?.schedule ?? "").trim())
    )),
    [state.items]
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalize(filters.query);
    const normalizedSpecialization = normalize(filters.specialization);
    const selectedEmploymentTypes = filters.employmentTypes.map((value) => normalize(value));
    const normalizedLevel = normalize(filters.level);
    const normalizedSchedule = normalize(filters.schedule);

    return state.items.filter((item) => {
      const matchesType = filters.activeType === "all" || item.opportunityType === filters.activeType;
      const matchesCity = !filters.city || normalize(item.locationCity) === normalize(filters.city);
      const matchesSpecialization =
        !normalizedSpecialization || (Array.isArray(item.tags) ? item.tags.some((tag) => normalize(tag) === normalizedSpecialization) : false);
      const matchesEmployment =
        selectedEmploymentTypes.length === 0 ||
        selectedEmploymentTypes.includes(normalize(item.employmentType)) ||
        selectedEmploymentTypes.includes(normalize(translateEmploymentType(item.employmentType)));
      const matchesLevel = filters.level === FILTER_ALL_VALUE || normalize(getOpportunityLevelLabel(item)) === normalizedLevel;
      const matchesSchedule = filters.schedule === FILTER_ALL_VALUE ||
        normalize(item.schedule) === normalizedSchedule ||
        normalize(translateWorkSchedule(item.schedule)) === normalizedSchedule;
      const haystack = normalize([item.title, item.companyName, item.locationCity, item.description, ...(item.tags ?? [])].join(" "));
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);

      return matchesType && matchesCity && matchesSpecialization && matchesEmployment && matchesLevel && matchesSchedule && matchesQuery;
    });
  }, [filters, state.items]);

  const candidateSkills = useMemo(
    () => (Array.isArray(state.candidate?.skills) ? state.candidate.skills.filter(Boolean) : []),
    [state.candidate]
  );

  const recommendationSource = filteredItems.length ? filteredItems : state.items;

  const scoredRecommendations = useMemo(
    () =>
      recommendationSource
        .map((item) => ({
          item,
          ...scoreOpportunity(item, candidateSkills, filters.activeType, filters.city),
        }))
        .sort((left, right) => right.score - left.score || left.item.title.localeCompare(right.item.title, "ru")),
    [candidateSkills, filters.activeType, filters.city, recommendationSource]
  );

  const recommendedItems = scoredRecommendations.slice(0, 4);
  const personalizedItems = scoredRecommendations.filter((entry) => entry.matchedSkillsCount > 0);
  const hasPersonalization = candidateSkills.length > 0;
  const sortedFilteredItems = useMemo(
    () => sortOpportunities(filteredItems, sortKey, sortDirection),
    [filteredItems, sortDirection, sortKey]
  );
  const visibleResults = sortedFilteredItems.slice(0, visibleCount);
  const companyGroups = useMemo(() => buildCompanyGroups(recommendationSource), [recommendationSource]);
  const favoriteOpportunityIdSet = useMemo(
    () => new Set(favoriteOpportunityIds.map((id) => String(id))),
    [favoriteOpportunityIds]
  );
  const favoriteCompanyIdSet = useMemo(
    () => new Set(favoriteCompanyIds.map((id) => String(id))),
    [favoriteCompanyIds]
  );
  const mapFilteredItems = useMemo(
    () =>
      sortedFilteredItems
        .map((item) => ({
          ...item,
          isFavoriteOpportunity: favoriteOpportunityIdSet.has(String(item.id)),
          isFavoriteCompanyOpportunity:
            item?.employerId != null && item.employerId !== ""
              ? favoriteCompanyIdSet.has(String(item.employerId))
              : false,
          isFavorite: favoriteOpportunityIdSet.has(String(item.id)),
        }))
        .filter((item) => {
          const isFavoriteMatch = item.isFavoriteOpportunity || item.isFavoriteCompanyOpportunity;

          if (favoritesDisplay === "favorites") {
            return isFavoriteMatch;
          }

          if (favoritesDisplay === "non-favorites") {
            return !isFavoriteMatch;
          }

          return true;
        }),
    [favoriteCompanyIdSet, favoriteOpportunityIdSet, favoritesDisplay, sortedFilteredItems]
  );
  const mapItems = useMemo(() => mapFilteredItems.filter(hasValidCoordinates).map(createMapCardItem), [mapFilteredItems]);
  const mapResultsDescription = useMemo(
    () => getMapResultsDescription(mapFilteredItems.length, mapItems.length),
    [mapFilteredItems.length, mapItems.length]
  );
  const selectedCityOption = useMemo(() => getFallbackCityOption(filters.city), [filters.city]);

  const preferredCompanyCity = useMemo(() => {
    if (filters.city && companyGroups.some((entry) => entry.city === filters.city)) {
      return filters.city;
    }

    return companyGroups[0]?.city ?? "";
  }, [companyGroups, filters.city]);

  useEffect(() => {
    setCompanyCity(preferredCompanyCity);
  }, [preferredCompanyCity]);

  useEffect(() => {
    if (selectedMapItemId && !mapItems.some((item) => String(item.id) === String(selectedMapItemId))) {
      setSelectedMapItemId(null);
    }
  }, [mapItems, selectedMapItemId]);

  const activeCompanyGroup = companyGroups.find((entry) => entry.city === companyCity) ?? companyGroups[0] ?? null;
  const missingActiveCompanyProfileIds = useMemo(
    () =>
      (activeCompanyGroup?.companies ?? [])
        .map((company) => company.employerId)
        .filter(Boolean)
        .filter((companyId) => !companyProfiles[companyId]),
    [activeCompanyGroup, companyProfiles]
  );
  const missingActiveCompanyProfileKey = missingActiveCompanyProfileIds.join("|");

  useEffect(() => {
    if (!missingActiveCompanyProfileIds.length) {
      return undefined;
    }

    const controller = new AbortController();

    setCompanyProfiles((current) => {
      const nextProfiles = { ...current };

      missingActiveCompanyProfileIds.forEach((companyId) => {
        if (!nextProfiles[companyId]) {
          nextProfiles[companyId] = { status: "loading", profile: null };
        }
      });

      return nextProfiles;
    });

    Promise.all(
      missingActiveCompanyProfileIds.map(async (companyId) => {
        try {
          const profile = await getPublicCompany(companyId, controller.signal);
          return { companyId, status: "ready", profile };
        } catch (error) {
          if (controller.signal.aborted) {
            return null;
          }

          return { companyId, status: "error", profile: null };
        }
      })
    ).then((results) => {
      if (controller.signal.aborted) {
        return;
      }

      setCompanyProfiles((current) => {
        const nextProfiles = { ...current };

        results.forEach((result) => {
          if (!result) {
            return;
          }

          nextProfiles[result.companyId] = {
            status: result.status,
            profile: result.profile,
          };
        });

        return nextProfiles;
      });
    });

    return () => controller.abort();
  }, [missingActiveCompanyProfileIds, missingActiveCompanyProfileKey]);

  const companySlides = useMemo(
    () =>
      (activeCompanyGroup?.companies ?? []).map((company) => ({
        ...company,
        profileState: company.employerId ? companyProfiles[company.employerId] ?? null : null,
      })),
    [activeCompanyGroup, companyProfiles]
  );

  const heroMeta = useMemo(() => {
    if (!hasPersonalization) {
      return `В каталоге сейчас ${formatCount(filteredItems.length || state.items.length, ["возможность", "возможности", "возможностей"])}.`;
    }

    if (!personalizedItems.length) {
      return "Пока точных совпадений по навыкам не нашли, но каталог уже готов к фильтрации по городу, тегам и формату работы.";
    }

    const vacancies = personalizedItems.filter((entry) => entry.item.opportunityType === "vacancy").length;
    const events = personalizedItems.filter((entry) => entry.item.opportunityType === "event").length;
    const internships = personalizedItems.filter((entry) => entry.item.opportunityType === "internship").length;
    const mentoringPrograms = personalizedItems.filter((entry) => entry.item.opportunityType === "mentoring").length;
    const parts = [];

    if (events) {
      parts.push(formatCount(events, ["мероприятие", "мероприятия", "мероприятий"]));
    }

    if (vacancies) {
      parts.push(formatCount(vacancies, ["вакансия", "вакансии", "вакансий"]));
    }

    if (internships) {
      parts.push(formatCount(internships, ["стажировка", "стажировки", "стажировок"]));
    }

    if (mentoringPrograms) {
      parts.push(formatCount(mentoringPrograms, ["менторская программа", "менторские программы", "менторских программ"]));
    }

    return `Тебе подходит ${parts.join(" и ")}.`;
  }, [filteredItems.length, hasPersonalization, personalizedItems, state.items.length]);

  const sectionCityPills = companyGroups;

  const handleFilterChange = (field, value) => {
    if (field === "city") {
      setCityInputValue(value);
    }

    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleResetSection = (section) => {
    setFilters((current) => {
      switch (section) {
        case "city":
          setCityInputValue(getFallbackCityOption(DEFAULT_CITY_NAME)?.name ?? DEFAULT_CITY_NAME);
          return { ...current, city: DEFAULT_CITY_NAME };
        case "income":
          return { ...current, incomeFrom: "", payoutPeriod: "" };
        case "specialization":
          return { ...current, specialization: "" };
        case "employmentTypes":
          return { ...current, employmentTypes: [] };
        case "level":
          return { ...current, level: FILTER_ALL_VALUE };
        case "education":
          return { ...current, education: [] };
        default:
          return current;
      }
    });
  };

  const handleResetAll = () => {
    setFilters({
      query: "",
      activeType: "all",
      city: DEFAULT_CITY_NAME,
      specialization: "",
      employmentTypes: [],
      level: FILTER_ALL_VALUE,
      schedule: FILTER_ALL_VALUE,
      incomeFrom: "",
      payoutPeriod: "",
      education: [],
    });
    setCityInputValue(getFallbackCityOption(DEFAULT_CITY_NAME)?.name ?? DEFAULT_CITY_NAME);
    setFavoritesDisplay("all");
    setOpenQuickFilterKey(null);
  };

  const handleResetMapDisplay = () => {
    setFavoritesDisplay("all");
  };

  const handleViewChange = (nextView) => {
    setView(nextView);

    if (nextView === "map") {
      setFiltersDropdownOpen(false);
      return;
    }

    setFiltersDrawerOpen(false);
  };

  const getQuickFilterValue = (key) => {
    switch (key) {
      case "type":
        return filters.activeType;
      case "format":
        return filters.employmentTypes[0] ?? FILTER_ALL_VALUE;
      case "level":
        return filters.level ?? FILTER_ALL_VALUE;
      case "schedule":
        return filters.schedule ?? FILTER_ALL_VALUE;
      case "skills":
        return filters.specialization || FILTER_ALL_VALUE;
      default:
        return FILTER_ALL_VALUE;
    }
  };

  const handleQuickFilterSelect = (key, nextValue) => {
    switch (key) {
      case "type":
        handleFilterChange("activeType", nextValue);
        break;
      case "format":
        handleFilterChange("employmentTypes", nextValue === FILTER_ALL_VALUE ? [] : [nextValue]);
        break;
      case "level":
        handleFilterChange("level", nextValue);
        break;
      case "schedule":
        handleFilterChange("schedule", nextValue);
        break;
      case "skills":
        handleFilterChange("specialization", nextValue === FILTER_ALL_VALUE ? "" : nextValue);
        break;
      default:
        break;
    }
  };

  return (
    <main className="opportunities-browser">
      <div className="opportunities-browser__shell ui-page-shell">
        <PortalHeader
          navItems={NAV_ITEMS}
          brandLabel="рамплин"
          actionHref={routes.auth.login}
          actionLabel="Войти / Регистрация"
          shellClassName="opportunities-browser__header-shell"
          className="opportunities-browser__header"
          floating={isHeaderFloating}
          visible={isHeaderVisible}
        />

        <section className="opportunities-browser__hero">
          <Tag tone="accent" size="lg">
            Возможности
          </Tag>
          <SectionHeader
            align="center"
            title={
              hasPersonalization
                ? "Мы проанализировали ваши навыки и цель и подобрали для вас подходящие возможности"
                : "Каталог возможностей для старта карьеры"
            }
            description={heroMeta}
          />
          <Button href="#catalog-results" size="lg" className="opportunities-browser__hero-action">
            Найти первую возможность
          </Button>
        </section>

        {state.status === "loading" ? <Loader label="Загружаем каталог возможностей" surface /> : null}

        {state.status === "error" ? (
          <Alert tone="error" title="Не удалось загрузить каталог" showIcon>
            {state.error?.message ?? "Попробуйте обновить страницу позже."}
          </Alert>
        ) : null}

        {state.status === "ready" ? (
          <>
            <section className="opportunities-browser__layout" id="catalog-results">
              <div className="opportunities-browser__main">
                <div className="opportunities-browser__discovery">
                  <div className="opportunities-browser__discovery-header">
                    <div className="opportunities-browser__title-row">
                      <h2 className="ui-type-h1">Возможности рядом</h2>
                      <CityAutocomplete
                        value={cityInputValue}
                        selectedOption={selectedCityOption}
                        selectedOptionId={selectedCityOption?.id}
                        onValueChange={setCityInputValue}
                        onSelectOption={(option) => {
                          const nextCity = option?.name ?? "";
                          setCityInputValue(nextCity);
                          handleFilterChange("city", nextCity);
                        }}
                        fallbackOptions={FALLBACK_CITY_OPTIONS}
                        className="opportunities-browser__city-picker"
                      />
                    </div>

                    <SegmentedControl
                      items={[
                        { value: "map", label: "Карта возможностей" },
                        { value: "list", label: "Список возможностей" },
                      ]}
                      value={view}
                      onChange={handleViewChange}
                      stretch
                      ariaLabel="Режим каталога возможностей"
                      size="md"
                      className="opportunities-browser__view-switch"
                    />
                  </div>

                  <div className="opportunities-browser__discovery-toolbar">
                    <SearchInput
                      value={filters.query}
                      onValueChange={(value) => handleFilterChange("query", value)}
                      placeholder="Поиск возможностей"
                      clearLabel="Очистить поиск"
                      className="opportunities-browser__search"
                    />

                    <div className="opportunities-browser__toolbar-icons">
                      <CatalogSortControl
                        value={sortKey}
                        direction={sortDirection}
                        onSelect={setSortKey}
                        onToggleDirection={() => setSortDirection((current) => (current === "asc" ? "desc" : "asc"))}
                      />
                      <div ref={filtersAnchorRef} className="opportunities-browser__filters-anchor">
                        <IconButton
                          type="button"
                          variant="outline"
                          size="2xl"
                          className="opportunities-browser__toolbar-icon opportunities-browser__toolbar-icon--outlined"
                          aria-label={view === "map" ? "Фильтры карты" : "Фильтры"}
                          aria-pressed={view === "map" ? filtersDrawerOpen : filtersDropdownOpen}
                          active={view === "map" ? filtersDrawerOpen : filtersDropdownOpen}
                          onClick={() => {
                            if (view === "map") {
                              setFiltersDrawerOpen((current) => !current);
                              return;
                            }

                            setFiltersDropdownOpen((current) => !current);
                          }}
                        >
                          <SlidersIcon />
                        </IconButton>

                        {view === "list" ? (
                          <OpportunityFilterSidebar
                            mode="dropdown"
                            open={filtersDropdownOpen}
                            onOpenChange={setFiltersDropdownOpen}
                            boundaryRef={filtersAnchorRef}
                            values={filters}
                            options={filterOptions}
                            disabledSections={{ income: true, payout: true, education: true }}
                            onChange={handleFilterChange}
                            onResetSection={handleResetSection}
                            onResetAll={handleResetAll}
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="opportunities-browser__quick-filters" aria-label="Быстрые фильтры">
                    {visibleQuickFilters.map((filter) => (
                      <div key={filter.key} className="opportunities-browser__quick-filter">
                        <CatalogFilterDropdown
                          label={filter.label}
                          value={getQuickFilterValue(filter.key)}
                          options={quickFilterOptions[filter.key] ?? []}
                          isOpen={openQuickFilterKey === filter.key}
                          onToggle={(nextState) => setOpenQuickFilterKey(nextState ? filter.key : null)}
                          onSelect={(nextValue) => handleQuickFilterSelect(filter.key, nextValue)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {view === "list" ? (
                  <>
                    <p className="opportunities-browser__results-caption">
                      {"Найдено"} {formatCount(filteredItems.length, ["возможность", "возможности", "возможностей"])}
                    </p>

                    {filteredItems.length ? (
                      <div className="opportunities-browser__results">
                        {visibleResults.map((item) => (
                          <OpportunityRowCard
                            key={item.id}
                            item={createRowCardItem(item)}
                            primaryAction={{
                              href: item.employerId ? buildCompanyPublicRoute(item.employerId) : buildOpportunityDetailRoute(item.id),
                              label: "Связаться",
                              variant: "secondary",
                            }}
                            detailAction={{
                              href: buildOpportunityDetailRoute(item.id),
                              label: getOpportunityApplyLabel(item.opportunityType),
                              variant: "secondary",
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <Card>
                        <EmptyState
                          eyebrow="Ничего не найдено"
                          title="Нет возможностей по текущим фильтрам"
                          description="Измените запрос, город или специализацию. Неподдержанные фильтры пока показаны только как структура."
                          tone="neutral"
                        />
                      </Card>
                    )}

                    {filteredItems.length > visibleCount ? (
                      <Button
                        variant="secondary"
                        size="lg"
                        width="full"
                        className="opportunities-browser__more-button"
                        onClick={() => setVisibleCount((current) => current + 3)}
                      >
                        {"Больше возможностей"}
                      </Button>
                    ) : null}
                  </>
                ) : (
                  <section className="opportunities-browser__map-panel" aria-label="Карта возможностей">
                    <div className="opportunities-browser__map-shell">
                      <div className="opportunities-browser__map-meta opportunities-browser__map-meta--compact">
                        <p className="opportunities-browser__map-description">{mapResultsDescription}</p>

                        <div className="opportunities-browser__map-legend" aria-label="Легенда карты">
                          {MAP_LEGEND_ITEMS.map((item) => (
                            <span key={item.tone} className="opportunities-browser__map-legend-chip">
                              <span className={`opportunities-browser__map-dot opportunities-browser__map-dot--${item.tone}`} aria-hidden="true" />
                              {item.label}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="opportunities-browser__map-surface">
                        <HomeOpportunityMap
                          items={mapItems}
                          selectedCity={filters.city}
                          selectedCityCoordinates={
                            selectedCityOption?.longitude != null && selectedCityOption?.latitude != null
                              ? [selectedCityOption.longitude, selectedCityOption.latitude]
                              : null
                          }
                          activeId={selectedMapItemId}
                          onSelectItem={setSelectedMapItemId}
                        />
                      </div>
                    </div>

                    <OpportunityFilterSidebar
                      mode="drawer"
                      open={filtersDrawerOpen}
                      onOpenChange={setFiltersDrawerOpen}
                      drawerBackdrop={false}
                      values={filters}
                      options={filterOptions}
                      displayOptions={MAP_DISPLAY_ITEMS}
                      displayValue={favoritesDisplay}
                      disabledSections={{ income: true, payout: true, education: true }}
                      onDisplayChange={setFavoritesDisplay}
                      onChange={handleFilterChange}
                      onResetDisplay={handleResetMapDisplay}
                      onResetSection={handleResetSection}
                      onResetAll={handleResetAll}
                    />
                  </section>
                )}
              </div>
            </section>

            <section className="opportunities-browser__section">
              <SectionHeader
                size="md"
                title="Рекомендуемые возможности"
                description={
                  hasPersonalization
                    ? "Показываем публикации с лучшим совпадением по навыкам, городу и выбранному типу."
                    : "Пока профиль кандидата не доступен, показываем свежие публикации из текущего каталога."
                }
              />

              {recommendedItems.length ? (
                <div className="ui-kit-slider-showcase">
                  <div className="ui-kit-slider-showcase__section">
                    <OpportunityBlockSlider
                      ariaLabel="Рекомендуемые возможности"
                      variant="leading-featured"
                      surface="plain"
                      items={recommendedItems.map((entry) => createRecommendationCard(entry.item, entry))}
                      cardClassName="ui-kit-opportunity-slider__card"
                      cardPropsBuilder={createRecommendationSliderCardProps}
                    />
                  </div>
                </div>
              ) : (
                <Card>
                  <EmptyState
                    title="Рекомендации появятся после загрузки каталога"
                    description="Пока в каталоге нет элементов, которые можно показать в горизонтальной подборке."
                    tone="neutral"
                  />
                </Card>
              )}
            </section>

            <section className="opportunities-browser__section" id="companies">
              <Card className="opportunities-browser__companies-card">
                <SectionHeader
                  size="md"
                  title={activeCompanyGroup ? `Компании в ${activeCompanyGroup.city}` : "Компании с открытыми возможностями"}
                  description="Переключайте города и просматривайте карточки работодателей, у которых сейчас есть активные публикации."
                  actions={
                    sectionCityPills.length ? (
                      <div className="opportunities-browser__city-pills">
                        {sectionCityPills.map((item) => (
                          <PillButton key={item.city} active={item.city === activeCompanyGroup?.city} onClick={() => setCompanyCity(item.city)}>
                            {item.city}
                          </PillButton>
                        ))}
                      </div>
                    ) : null
                  }
                />

                {activeCompanyGroup ? (
                  <div className="opportunities-browser__companies-slider">
                    <OpportunityBlockSlider
                      ariaLabel={activeCompanyGroup ? `Компании ${activeCompanyGroup.city}` : "Компании"}
                      items={companySlides}
                      variant="uniform"
                      itemWidth="380px"
                      gap="16px"
                      className="opportunities-browser__company-slider"
                      itemClassName="opportunities-browser__company-slider-item"
                      renderItem={(item) => (
                        <CompanySpotlightSlide
                          company={item}
                          profileState={item.profileState}
                          isFavorite={item.employerId ? favoriteCompanyIdSet.has(String(item.employerId)) : false}
                          onToggleFavorite={toggleFavoriteCompany}
                        />
                      )}
                    />
                  </div>
                ) : (
                  <EmptyState
                    title="Пока нет агрегированных компаний"
                    description="Секция появится автоматически, когда у публикаций будут заполнены компания и город."
                    tone="neutral"
                    compact
                  />
                )}
              </Card>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}







// Social helpers imported from shared/lib/socialPresentation





