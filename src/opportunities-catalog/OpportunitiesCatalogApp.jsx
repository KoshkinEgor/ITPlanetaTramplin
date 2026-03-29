import { useEffect, useMemo, useRef, useState } from "react";
import { PUBLIC_HEADER_NAV_ITEMS, buildCompanyPublicRoute, buildOpportunityDetailRoute } from "../app/routes";
import { useLocation } from "react-router-dom";
import { AppLink } from "../app/AppLink";
import { DEFAULT_CITY_NAME, FALLBACK_CITY_OPTIONS, getFallbackCityOption } from "../api/cities";
import { getCandidateProfile } from "../api/candidate";
import { getPublicCompany } from "../api/company";
import { getOpportunities } from "../api/opportunities";
import { OpportunityBlockSlider, OpportunityFilterSidebar, OpportunityRowCard } from "../components/opportunities";
import { parseSocialLinks } from "../features/company/socialLinks";
import {
  readFavoriteCompanyIds,
  readFavoriteOpportunityIds,
  subscribeToFavorites,
  toggleFavoriteCompany,
} from "../features/favorites/storage";
import { HomeOpportunityMap } from "../home/HomeOpportunityMap";
import { scheduleHashScroll } from "../shared/lib/scrollToHashTarget";
import { getOpportunityApplyLabel, translateOpportunityType as translateSharedOpportunityType } from "../shared/lib/opportunityTypes";
import { getOpportunityCardPresentation } from "../shared/lib/opportunityPresentation";
import { PortalHeader } from "../widgets/layout/PortalHeader/PortalHeader";
import {
  Alert,
  Avatar,
  Button,
  Card,
  EmptyState,
  IconButton,
  Loader,
  PillButton,
  SearchInput,
  SectionHeader,
  SegmentedControl,
  Tag,
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

const VIEW_ITEMS = [
  { value: "list", label: "Список" },
  { value: "map", label: "Карта" },
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

function FilterIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 6h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7 10h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 14h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

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
  const companyHref = company.employerId ? buildCompanyPublicRoute(company.employerId) : "";
  const links = getCompanyLinks(profile);
  const description = getCompanyDescription(company, profile);
  const address = getCompanyAddress(company, profile);

  return (
    <Card className="company-spotlight opportunities-browser__company-spotlight">
      <div className="company-spotlight__company">
        <Avatar
          size="lg"
          name={company.name}
          initials={getCompanyInitial(company.name)}
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
        <div className="opportunity-story-card__intro">
          {links.map((link) => (
            <AppLink key={link.id} href={link.href} className="opportunity-card-page__more-link">
              {link.label}
            </AppLink>
          ))}
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
    };

    companyEntry.count += 1;
    companyEntry.sampleAddress ||= String(item.locationAddress ?? "").trim();
    companyEntry.sampleDescription ||= String(item.description ?? "").trim();
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
    incomeFrom: "",
    payoutPeriod: "",
    education: [],
  });
  const [view, setView] = useState("list");
  const [favoritesDisplay, setFavoritesDisplay] = useState("all");
  const [filtersDropdownOpen, setFiltersDropdownOpen] = useState(false);
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  const [favoriteOpportunityIds, setFavoriteOpportunityIds] = useState(() => readFavoriteOpportunityIds());
  const [favoriteCompanyIds, setFavoriteCompanyIds] = useState(() => readFavoriteCompanyIds());
  const [selectedMapItemId, setSelectedMapItemId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(3);
  const [companyCity, setCompanyCity] = useState("");
  const [companyProfiles, setCompanyProfiles] = useState({});

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
        const [items, candidate] = await Promise.all([
          getOpportunities(controller.signal),
          getCandidateProfile(controller.signal).catch((error) => {
            if (error?.status === 401 || error?.status === 403) {
              return null;
            }

            return null;
          }),
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
  }, [filters.query, filters.activeType, filters.city, filters.specialization, filters.employmentTypes]);

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
      employmentTypes: uniqueOptions(state.items.map((item) => translateEmploymentType(item.employmentType)))
        .filter(Boolean)
        .map((value) => ({ value, label: value })),
    }),
    [state.items]
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalize(filters.query);
    const normalizedSpecialization = normalize(filters.specialization);
    const selectedEmploymentTypes = filters.employmentTypes.map((value) => normalize(value));

    return state.items.filter((item) => {
      const matchesType = filters.activeType === "all" || item.opportunityType === filters.activeType;
      const matchesCity = !filters.city || normalize(item.locationCity) === normalize(filters.city);
      const matchesSpecialization =
        !normalizedSpecialization || (Array.isArray(item.tags) ? item.tags.some((tag) => normalize(tag) === normalizedSpecialization) : false);
      const matchesEmployment =
        selectedEmploymentTypes.length === 0 || selectedEmploymentTypes.includes(normalize(translateEmploymentType(item.employmentType)));
      const haystack = normalize([item.title, item.companyName, item.locationCity, item.description, ...(item.tags ?? [])].join(" "));
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);

      return matchesType && matchesCity && matchesSpecialization && matchesEmployment && matchesQuery;
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
  const visibleResults = filteredItems.slice(0, visibleCount);
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
      filteredItems
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
    [favoriteCompanyIdSet, favoriteOpportunityIdSet, favoritesDisplay, filteredItems]
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
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleResetSection = (section) => {
    setFilters((current) => {
      switch (section) {
        case "city":
          return { ...current, city: DEFAULT_CITY_NAME };
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

  const handleResetAll = () => {
    setFilters({
      query: "",
      activeType: "all",
      city: DEFAULT_CITY_NAME,
      specialization: "",
      employmentTypes: [],
      incomeFrom: "",
      payoutPeriod: "",
      education: [],
    });
    setFavoritesDisplay("all");
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

  const renderTypeFilters = (className) => (
    <div className={className}>
      {TYPE_FILTERS.map((filter) => (
        <PillButton
          key={filter.value}
          size="lg"
          active={filter.value === filters.activeType}
          onClick={() => handleFilterChange("activeType", filter.value)}
        >
          {filter.label}
        </PillButton>
      ))}
    </div>
  );

  return (
    <main className="opportunities-browser">
      <div className="opportunities-browser__shell ui-page-shell">
        <PortalHeader
          navItems={NAV_ITEMS}
          currentKey="opportunities"
          actionHref="/candidate/profile"
          actionLabel="Профиль"
          className="opportunities-browser__header"
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
                <div className="opportunities-browser__section-head">
                  <Tag tone="accent">Возможности</Tag>
                  <SectionHeader
                    size="md"
                    title="Возможности"
                    description="Находи стажировки, вакансии, компании и мероприятия по своим предпочтениям."
                  />
                </div>

                {view === "list" ? (
                  <>
                    <div className="opportunities-browser__controls">
                      <div className="opportunities-browser__controls-main">
                        <SegmentedControl
                          items={VIEW_ITEMS}
                          value={view}
                          onChange={handleViewChange}
                          stretch
                          ariaLabel="Режим каталога возможностей"
                          className="opportunities-browser__view-switch"
                        />

                        <div ref={filtersAnchorRef} className="opportunities-browser__filters-anchor">
                          <Button
                            variant="secondary"
                            size="lg"
                            iconStart={<FilterIcon />}
                            className="opportunities-browser__filter-button"
                            onClick={() => setFiltersDropdownOpen((current) => !current)}
                          >
                            {"Фильтры"}
                          </Button>

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
                        </div>
                      </div>

                      <SearchInput
                        value={filters.query}
                        onValueChange={(value) => handleFilterChange("query", value)}
                        placeholder="Поиск по названию, действию или дате"
                        clearLabel="Очистить поиск"
                        appearance="elevated"
                        size="lg"
                        width="full"
                        className="opportunities-browser__search"
                      />

                      <div className="opportunities-browser__toolbar">
                        {renderTypeFilters("opportunities-browser__type-filters")}

                        <div className="opportunities-browser__sort">
                          <button type="button" disabled className="opportunities-browser__sort-button">
                            {"По возрастанию зарплат"}
                          </button>
                          <p>{"Сортировка появится после подключения зарплатных данных."}</p>
                        </div>
                      </div>
                    </div>

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
                              href: buildOpportunityDetailRoute(item.id),
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
                      <div className="opportunities-browser__map-header">
                        <div className="opportunities-browser__map-copy">
                          <Tag tone="accent">{"Карта возможностей"}</Tag>
                          <SectionHeader
                            size="md"
                            title="Большая карта каталога"
                            description={mapResultsDescription}
                          />
                        </div>

                        <div className="opportunities-browser__map-actions">
                          <Button
                            variant="secondary"
                            size="lg"
                            iconStart={<FilterIcon />}
                            className="opportunities-browser__map-filter-button"
                            onClick={() => setFiltersDrawerOpen(true)}
                          >
                            {"Фильтры карты"}
                          </Button>

                          <SegmentedControl
                            items={VIEW_ITEMS}
                            value={view}
                            onChange={handleViewChange}
                            stretch
                            ariaLabel="Режим карты возможностей"
                            className="opportunities-browser__map-view-switch"
                          />
                        </div>
                      </div>

                      <div className="opportunities-browser__map-toolbar">
                        <SearchInput
                          value={filters.query}
                          onValueChange={(value) => handleFilterChange("query", value)}
                          placeholder="Поиск по названию, действию или дате"
                          clearLabel="Очистить поиск"
                          appearance="elevated"
                          size="lg"
                          width="full"
                          className="opportunities-browser__map-search"
                        />

                        <div className="opportunities-browser__map-meta">
                          {renderTypeFilters("opportunities-browser__type-filters opportunities-browser__type-filters--map")}

                          <div className="opportunities-browser__map-legend" aria-label="Легенда карты">
                            {MAP_LEGEND_ITEMS.map((item) => (
                              <span key={item.tone} className="opportunities-browser__map-legend-chip">
                                <span className={`opportunities-browser__map-dot opportunities-browser__map-dot--${item.tone}`} aria-hidden="true" />
                                {item.label}
                              </span>
                            ))}
                          </div>
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




