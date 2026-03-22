(function () {
  const FILTER_KEYS = ["skills", "salary", "format", "type", "level"];
  const TYPE_LABELS = {
    vacancy: "Вакансия",
    internship: "Стажировка",
    event: "Мероприятие",
  };

  const COMPANY_MARK_CLASS = {
    "Киберполигон": "company-mark--orange",
    "Трамплин Platform": "company-mark--google",
    "Север Digital": "company-mark--vk",
    "Product Lab": "company-mark--orange",
    "НейроКампус": "company-mark--google",
    "Edge Security": "company-mark--vk",
    "Signal Hub": "company-mark--orange",
    "Research Point": "company-mark--google",
    "Cloud Orbit": "company-mark--vk",
  };

  const opportunities = [
    {
      id: "junior-security-analyst",
      title: "Junior Security Analyst",
      company: "Киберполигон",
      companyShort: "К",
      type: "vacancy",
      format: "Гибрид",
      city: "Москва",
      salary: "от 90 000 ₽",
      salaryBand: "60-120",
      level: "Junior",
      tags: ["SOC", "SIEM", "Mentor"],
      skills: ["Python", "SQL", "Cybersecurity"],
      description:
        "Стартовая роль в SOC-команде с наставником, живыми кейсами и понятным планом роста.",
      contacts: ["МС", "ИД", "ОП"],
      x: 55,
      y: 46,
      online: false,
      favorite: false,
      deadline: "31 марта",
      relation: "Есть 2 контакта в компании",
    },
    {
      id: "backend-platform",
      title: "Backend Developer",
      company: "Трамплин Platform",
      companyShort: "T",
      type: "vacancy",
      format: "Онлайн",
      city: "Москва",
      salary: "от 120 000 ₽",
      salaryBand: "120+",
      level: "Junior",
      tags: ["Python", "FastAPI", "SQL"],
      skills: ["Python", "SQL", "Аналитика"],
      description:
        "Разработка сервисов и API для продуктовой платформы, внутренней аналитики и рекомендаций.",
      contacts: ["АК", "НС"],
      x: 58,
      y: 44,
      online: true,
      favorite: false,
      deadline: "24 марта",
      relation: "Тёплый маршрут через карьерный клуб",
    },
    {
      id: "product-analytics-internship",
      title: "Стажировка в Product Analytics",
      company: "Signal Hub",
      companyShort: "S",
      type: "internship",
      format: "Гибрид",
      city: "Москва",
      salary: "60 000 ₽ / мес",
      salaryBand: "60-120",
      level: "Без опыта",
      tags: ["SQL", "BI", "Growth"],
      skills: ["SQL", "Аналитика", "Research"],
      description:
        "Практика в продуктовой команде с реальными метриками, ревью гипотез и карьерным ментором.",
      contacts: ["МС", "ЕГ"],
      x: 53,
      y: 43,
      online: false,
      favorite: true,
      deadline: "29 марта",
      relation: "Популярно среди студентов",
    },
    {
      id: "cyber-hackathon",
      title: "Cyber Career Hackathon",
      company: "Edge Security",
      companyShort: "E",
      type: "event",
      format: "Гибрид",
      city: "Москва",
      salary: null,
      salaryBand: null,
      level: "Без опыта",
      tags: ["Хакатон", "Hiring", "Команды"],
      skills: ["Cybersecurity", "Research"],
      description:
        "Однодневный хакатон с командами, HR-скорингом и быстрыми собеседованиями после трека.",
      contacts: ["ОП"],
      x: 57,
      y: 47,
      online: false,
      favorite: false,
      deadline: "27 марта",
      relation: "Скоро дедлайн регистрации",
    },
    {
      id: "ux-research-junior",
      title: "Junior UX Researcher",
      company: "Research Point",
      companyShort: "R",
      type: "vacancy",
      format: "Гибрид",
      city: "Санкт-Петербург",
      salary: "от 85 000 ₽",
      salaryBand: "60-120",
      level: "Junior",
      tags: ["Research", "Interviews", "CJM"],
      skills: ["Research", "Аналитика", "Дизайн"],
      description:
        "Исследования пользовательских сценариев, интервью, полевые сессии и совместная работа с продактом.",
      contacts: ["МС", "ЛП"],
      x: 40,
      y: 31,
      online: false,
      favorite: false,
      deadline: "2 апреля",
      relation: "Подходит по навыкам на 87%",
    },
    {
      id: "design-bootcamp",
      title: "Design Bootcamp",
      company: "Product Lab",
      companyShort: "P",
      type: "internship",
      format: "Онлайн",
      city: "Санкт-Петербург",
      salary: "Стипендия 35 000 ₽",
      salaryBand: "0-60",
      level: "Без опыта",
      tags: ["UI Kit", "Portfolio", "Review"],
      skills: ["Дизайн", "Research"],
      description:
        "Онлайн-программа с дизайн-ревью, рабочими макетами и менторскими сессиями каждую неделю.",
      contacts: ["ДС", "АК"],
      x: 42,
      y: 33,
      online: true,
      favorite: false,
      deadline: "6 апреля",
      relation: "Есть контакты выпускников потока",
    },
    {
      id: "data-lab-kazan",
      title: "Data Lab Intern",
      company: "Signal Hub",
      companyShort: "S",
      type: "internship",
      format: "Офис",
      city: "Казань",
      salary: "50 000 ₽ / мес",
      salaryBand: "0-60",
      level: "Без опыта",
      tags: ["SQL", "Python", "Data"],
      skills: ["Python", "SQL", "Аналитика"],
      description:
        "Стажировка с фокусом на чистку данных, дашборды и первые продуктовые исследования.",
      contacts: ["ИА"],
      x: 46,
      y: 57,
      online: false,
      favorite: false,
      deadline: "4 апреля",
      relation: "Рядом с кампусом",
    },
    {
      id: "cloud-camp-innopolis",
      title: "Cloud Camp",
      company: "Cloud Orbit",
      companyShort: "C",
      type: "internship",
      format: "Гибрид",
      city: "Иннополис",
      salary: "70 000 ₽ / мес",
      salaryBand: "60-120",
      level: "Junior",
      tags: ["Cloud", "DevOps", "Kubernetes"],
      skills: ["Python", "Cybersecurity"],
      description:
        "Учебный трек по облачной инфраструктуре, контейнерам и наблюдаемости с выходом в офферный пул.",
      contacts: ["ОП", "ЮС"],
      x: 49,
      y: 60,
      online: false,
      favorite: false,
      deadline: "9 апреля",
      relation: "Сильный карьерный интенсив",
    },
    {
      id: "career-day-ekb",
      title: "Career Day: Security & Product",
      company: "Edge Security",
      companyShort: "E",
      type: "event",
      format: "Офис",
      city: "Екатеринбург",
      salary: null,
      salaryBand: null,
      level: "Без опыта",
      tags: ["Meetup", "Networking", "Hiring"],
      skills: ["Research", "Аналитика"],
      description:
        "Оффлайн-день с разбором карьерных траекторий, нетворкингом и микрособеседованиями.",
      contacts: ["ОП", "ИД"],
      x: 66,
      y: 54,
      online: false,
      favorite: true,
      deadline: "30 марта",
      relation: "Есть знакомые спикеры",
    },
    {
      id: "frontend-trainee",
      title: "Frontend Trainee",
      company: "Трамплин Platform",
      companyShort: "T",
      type: "vacancy",
      format: "Гибрид",
      city: "Новосибирск",
      salary: "от 70 000 ₽",
      salaryBand: "60-120",
      level: "Junior",
      tags: ["React", "UI", "Design System"],
      skills: ["Дизайн", "Python"],
      description:
        "Роль на стыке интерфейсов и платформенной команды: UI, внутренний кабинет и дизайн-система.",
      contacts: ["АК", "ДС"],
      x: 77,
      y: 64,
      online: false,
      favorite: false,
      deadline: "7 апреля",
      relation: "Гибридный офис рядом с вузами",
    },
    {
      id: "ai-planet",
      title: "АйТи Планета",
      company: "НейроКампус",
      companyShort: "Н",
      type: "event",
      format: "Гибрид",
      city: "Москва",
      salary: null,
      salaryBand: null,
      level: "Без опыта",
      tags: ["Форум", "Практика", "Комьюнити"],
      skills: ["Аналитика", "Research", "Дизайн"],
      description:
        "Большое карьерное событие с лекциями, подборками работодателей и авторскими рекомендациями.",
      contacts: ["МС", "ИД", "ЮС"],
      x: 60,
      y: 48,
      online: true,
      favorite: false,
      deadline: "12 апреля",
      relation: "В подборке для студентов",
    },
    {
      id: "devrel-assistant",
      title: "DevRel Assistant",
      company: "Трамплин Platform",
      companyShort: "T",
      type: "vacancy",
      format: "Онлайн",
      city: "Москва",
      salary: "от 80 000 ₽",
      salaryBand: "60-120",
      level: "Junior",
      tags: ["Community", "Events", "Writing"],
      skills: ["Research", "Аналитика"],
      description:
        "Роль для тех, кто умеет собирать комьюнити, курировать события и вести карьерные программы.",
      contacts: ["АК", "ЛП"],
      x: 61,
      y: 45,
      online: true,
      favorite: false,
      deadline: "5 апреля",
      relation: "Есть прямой контакт в команде",
    },
  ];

  const params = new URLSearchParams(window.location.search);
  const forcedParam = params.get("state");
  const allowedModes = new Set(["loading", "empty", "error"]);
  const state = {
    auth: params.get("auth") === "user" ? "user" : "guest",
    forcedMode: allowedModes.has(forcedParam) ? forcedParam : null,
    query: "",
    filters: createEmptyFilters(),
    draftFilters: createEmptyFilters(),
    selectedId: null,
    pendingScrollId: null,
    preview: null,
    favorites: new Set(),
  };

  const elements = {
    body: document.body,
    guestAuth: document.querySelector(".app-home-auth--guest"),
    userAuth: document.querySelector(".app-home-auth--user"),
    searchForm: document.getElementById("search-form"),
    searchInput: document.getElementById("app-home-search-input"),
    clearSearch: document.getElementById("clear-search"),
    quickFilterButtons: document.querySelectorAll("[data-filter-key]"),
    activeFiltersBar: document.getElementById("active-filters-bar"),
    workspaceStatus: document.getElementById("workspace-status"),
    resultsCount: document.getElementById("results-count"),
    resultsNote: document.getElementById("results-note"),
    resultsList: document.getElementById("results-list"),
    resultsScroll: document.getElementById("results-scroll"),
    mapMarkers: document.getElementById("map-markers"),
    mapPreview: document.getElementById("map-preview"),
    mapState: document.getElementById("map-state"),
    searchPanel: document.querySelector(".app-home-search-panel"),
    openDrawerButtons: [
      document.getElementById("open-filter-drawer"),
      document.getElementById("open-filter-drawer-inline"),
    ],
    drawer: document.getElementById("filter-drawer"),
    closeDrawerButton: document.getElementById("close-filter-drawer"),
    closeDrawerBackdrop: document.getElementById("close-filter-drawer-backdrop"),
    applyFilters: document.getElementById("apply-filters"),
    resetFilters: document.getElementById("reset-filters"),
    drawerActiveFilters: document.getElementById("drawer-active-filters"),
    draftFilterButtons: document.querySelectorAll("[data-draft-filter-key]"),
    presetButtons: document.querySelectorAll(".app-home-preset"),
  };

  state.favorites = loadFavorites();
  state.draftFilters = cloneFilters(state.filters);
  syncAuth();
  bindEvents();
  if (state.forcedMode === "loading") {
    window.setTimeout(() => {
      clearForcedMode();
      render();
    }, 1400);
  }
  render();

  function bindEvents() {
    elements.searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      state.query = elements.searchInput.value.trim();
      state.pendingScrollId = null;
      render();
    });

    let searchDebounceId = 0;
    elements.searchInput.addEventListener("input", () => {
      elements.clearSearch.hidden = elements.searchInput.value.length === 0;
      window.clearTimeout(searchDebounceId);
      searchDebounceId = window.setTimeout(() => {
        state.query = elements.searchInput.value.trim();
        render();
      }, 180);
    });

    elements.clearSearch.addEventListener("click", () => {
      elements.searchInput.value = "";
      elements.clearSearch.hidden = true;
      state.query = "";
      render();
      elements.searchInput.focus();
    });

    elements.quickFilterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        if (state.forcedMode === "loading") {
          return;
        }

        toggleFilter(state.filters, button.dataset.filterKey, button.dataset.filterValue);
        state.draftFilters = cloneFilters(state.filters);
        state.pendingScrollId = null;
        render();
      });
    });

    elements.openDrawerButtons.forEach((button) => {
      button.addEventListener("click", openDrawer);
    });

    elements.closeDrawerButton.addEventListener("click", closeDrawer);
    elements.closeDrawerBackdrop.addEventListener("click", closeDrawer);

    elements.applyFilters.addEventListener("click", () => {
      state.filters = cloneFilters(state.draftFilters);
      state.pendingScrollId = null;
      closeDrawer();
      render();
    });

    elements.resetFilters.addEventListener("click", () => {
      state.filters = createEmptyFilters();
      state.draftFilters = createEmptyFilters();
      state.query = "";
      elements.searchInput.value = "";
      elements.clearSearch.hidden = true;
      clearForcedMode();
      closeDrawer();
      render();
    });

    elements.draftFilterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        toggleFilter(
          state.draftFilters,
          button.dataset.draftFilterKey,
          button.dataset.draftFilterValue,
        );
        renderDrawerState();
      });
    });

    elements.resultsList.addEventListener("click", (event) => {
      const favoriteButton = event.target.closest("[data-action='toggle-favorite']");
      if (favoriteButton) {
        event.stopPropagation();
        toggleFavorite(favoriteButton.dataset.id);
        return;
      }

      const filterButton = event.target.closest("[data-action='remove-filter']");
      if (filterButton) {
        event.stopPropagation();
        removeFilter(filterButton.dataset.key, filterButton.dataset.value);
        return;
      }

      const retryButton = event.target.closest("[data-action='retry']");
      if (retryButton) {
        clearForcedMode();
        render();
        return;
      }

      const resetButton = event.target.closest("[data-action='reset-all']");
      if (resetButton) {
        resetAllFilters();
        return;
      }

      const showAllButton = event.target.closest("[data-action='show-all']");
      if (showAllButton) {
        clearForcedMode();
        state.selectedId = null;
        render();
      }

      const card = event.target.closest("[data-result-id]");
      if (!card) {
        return;
      }

      selectOpportunity(card.dataset.resultId, false, true);
    });

    elements.resultsList.addEventListener("dblclick", (event) => {
      const card = event.target.closest("[data-result-id]");
      if (!card) {
        return;
      }

      openOpportunity(card.dataset.resultId);
    });

    elements.mapMarkers.addEventListener("click", (event) => {
      event.stopPropagation();
      const target = event.target.closest("[data-marker-id], [data-cluster-id]");
      if (!target) {
        return;
      }

      if (target.dataset.markerId) {
        const item = getOpportunity(target.dataset.markerId);
        selectOpportunity(item.id, true, true);
        state.preview = {
          kind: "item",
          id: item.id,
          pinned: true,
          anchorX: item.x,
          anchorY: item.y,
        };
      } else if (target.dataset.clusterId) {
        const ids = target.dataset.clusterIds.split(",");
        state.preview = {
          kind: "cluster",
          ids,
          pinned: true,
          anchorX: Number(target.dataset.anchorX),
          anchorY: Number(target.dataset.anchorY),
        };
      }

      renderPreview();
    });

    elements.mapMarkers.addEventListener("dblclick", (event) => {
      const marker = event.target.closest("[data-marker-id]");
      if (!marker) {
        return;
      }

      openOpportunity(marker.dataset.markerId);
    });

    elements.mapMarkers.addEventListener("mouseover", (event) => {
      const marker = event.target.closest("[data-marker-id]");
      const cluster = event.target.closest("[data-cluster-id]");

      if (marker) {
        const item = getOpportunity(marker.dataset.markerId);
        state.preview = {
          kind: "item",
          id: item.id,
          pinned: false,
          anchorX: item.x,
          anchorY: item.y,
        };
        renderPreview();
        return;
      }

      if (cluster) {
        state.preview = {
          kind: "cluster",
          ids: cluster.dataset.clusterIds.split(","),
          pinned: false,
          anchorX: Number(cluster.dataset.anchorX),
          anchorY: Number(cluster.dataset.anchorY),
        };
        renderPreview();
      }
    });

    elements.mapMarkers.addEventListener("mouseout", (event) => {
      if (!state.preview || state.preview.pinned) {
        return;
      }

      const nextTarget = event.relatedTarget;
      if (
        nextTarget &&
        (nextTarget.closest(".app-map-preview-card") ||
          nextTarget.closest("[data-marker-id]") ||
          nextTarget.closest("[data-cluster-id]"))
      ) {
        return;
      }

      state.preview = null;
      renderPreview();
    });

    elements.mapPreview.addEventListener("click", (event) => {
      event.stopPropagation();
      const closeButton = event.target.closest("[data-action='close-preview']");
      if (closeButton) {
        state.preview = null;
        renderPreview();
        return;
      }

      const favoriteButton = event.target.closest("[data-action='toggle-favorite']");
      if (favoriteButton) {
        toggleFavorite(favoriteButton.dataset.id);
        return;
      }

      const clusterSelect = event.target.closest("[data-action='cluster-select']");
      if (clusterSelect) {
        selectOpportunity(clusterSelect.dataset.id, true, true);
        state.preview = {
          kind: "item",
          id: clusterSelect.dataset.id,
          pinned: true,
          anchorX: getOpportunity(clusterSelect.dataset.id).x,
          anchorY: getOpportunity(clusterSelect.dataset.id).y,
        };
        renderPreview();
      }
    });

    elements.mapPreview.addEventListener("mouseleave", (event) => {
      if (state.preview && !state.preview.pinned) {
        const nextTarget = event.relatedTarget;
        if (nextTarget && nextTarget.closest("[data-marker-id]")) {
          return;
        }
        state.preview = null;
        renderPreview();
      }
    });

    elements.presetButtons.forEach((button) => {
      button.addEventListener("click", () => {
        applyPreset(button.dataset.preset);
      });
    });

    document.addEventListener("click", (event) => {
      if (
        state.preview &&
        !event.target.closest(".app-map-panel") &&
        !event.target.closest(".app-map-preview-card")
      ) {
        state.preview = null;
        renderPreview();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeDrawer();
        if (state.preview && state.preview.pinned) {
          state.preview = null;
          renderPreview();
        }
      }
    });

    window.addEventListener("resize", () => {
      renderPreview();
    });
  }

  function render() {
    const items = getVisibleOpportunities();
    syncSearchUI();
    renderQuickFilterState();
    renderActiveFilters();
    renderWorkspaceStatus(items);
    renderMap(items);
    renderResults(items);
    renderDrawerState();
  }

  function renderQuickFilterState() {
    elements.quickFilterButtons.forEach((button) => {
      const key = button.dataset.filterKey;
      const value = button.dataset.filterValue;
      button.classList.toggle("is-active", state.filters[key].includes(value));
      button.classList.toggle(
        "is-muted",
        state.filters[key].length > 0 && !state.filters[key].includes(value),
      );
    });
  }

  function renderActiveFilters() {
    const activeFilters = collectActiveFilters(state.filters);
    if (!activeFilters.length && !state.query) {
      elements.activeFiltersBar.innerHTML =
        '<span class="chip">Нет активных фильтров. Показаны все возможности.</span>';
      return;
    }

    const queryPart = state.query
      ? `<span class="app-active-filter">Запрос: “${escapeHtml(state.query)}” <button type="button" data-action="remove-filter" data-key="query" data-value="">×</button></span>`
      : "";

    elements.activeFiltersBar.innerHTML =
      queryPart +
      activeFilters
        .map(
          (filter) => `
            <span class="app-active-filter">
              ${escapeHtml(filter.label)}
              <button type="button" data-action="remove-filter" data-key="${filter.key}" data-value="${escapeHtml(filter.value)}">×</button>
            </span>
          `,
        )
        .join("");

    elements.activeFiltersBar
      .querySelectorAll("[data-action='remove-filter']")
      .forEach((button) => {
        button.addEventListener("click", () => {
          if (button.dataset.key === "query") {
            state.query = "";
            elements.searchInput.value = "";
            elements.clearSearch.hidden = true;
            render();
            return;
          }
          removeFilter(button.dataset.key, button.dataset.value);
        });
      });
  }

  function renderWorkspaceStatus(items) {
    const statusBits = [
      `<span class="app-home-status-pill">${items.length} результатов</span>`,
      `<span class="app-home-status-pill">${state.favorites.size} в избранном</span>`,
      state.auth === "user"
        ? '<span class="app-home-status-pill">Избранное в аккаунте</span>'
        : '<span class="app-home-status-pill">Избранное хранится локально</span>',
    ];

    if (state.forcedMode === "loading") {
      statusBits.push('<span class="app-home-status-pill">Обновляем данные</span>');
    } else if (state.forcedMode === "error") {
      statusBits.push('<span class="app-home-status-pill">Ошибка загрузки</span>');
    }

    elements.workspaceStatus.innerHTML = statusBits.join("");
  }

  function renderMap(items) {
    if (state.forcedMode === "error") {
      elements.mapMarkers.innerHTML = "";
      elements.mapState.hidden = false;
      elements.mapState.innerHTML = `
        <div class="app-map-panel__state-card">
          <span class="tag tag-warm">Ошибка</span>
          <h4>Данные карты не удалось загрузить</h4>
          <p>Повторите попытку. Карта и список используют один и тот же источник данных.</p>
          <div class="app-map-panel__state-actions">
            <button class="button button-primary" type="button" data-action="retry">Повторить</button>
          </div>
        </div>
      `;
      bindMapStateActions();
      renderPreview();
      return;
    }

    if (state.forcedMode === "loading") {
      elements.mapMarkers.innerHTML = "";
      elements.mapState.hidden = false;
      elements.mapState.innerHTML =
        '<div class="app-map-loading">Загружаем карту и маркеры</div>';
      renderPreview();
      return;
    }

    elements.mapState.hidden = true;

    if (!items.length) {
      elements.mapMarkers.innerHTML = "";
      elements.mapState.hidden = false;
      elements.mapState.innerHTML = `
        <div class="app-map-panel__state-card">
          <span class="tag">Ничего не найдено</span>
          <h4>На карте нет подходящих точек</h4>
          <p>Измените запрос или сбросьте фильтры, чтобы вернуть возможности в выдачу.</p>
          <div class="app-map-panel__state-actions">
            <button class="button button-secondary" type="button" data-action="reset-all">Сбросить фильтры</button>
            <button class="button button-primary" type="button" data-action="show-all">Показать все возможности</button>
          </div>
        </div>
      `;
      bindMapStateActions();
      renderPreview();
      return;
    }

    const expandedIds = new Set();
    if (state.selectedId) {
      expandedIds.add(state.selectedId);
    }
    if (state.preview && state.preview.kind === "item") {
      expandedIds.add(state.preview.id);
    }

    const clusters = buildClusters(items, expandedIds);
    elements.mapMarkers.innerHTML = clusters
      .map((entry) => {
        if (entry.kind === "cluster") {
          return `
            <button
              class="app-map-cluster"
              style="--x: ${entry.x}%; --y: ${entry.y}%"
              type="button"
              aria-label="${entry.ids.length} возможностей в одном кластере"
              data-cluster-id="${entry.id}"
              data-cluster-ids="${entry.ids.join(",")}"
              data-anchor-x="${entry.x}"
              data-anchor-y="${entry.y}"
            >
              <span class="app-map-cluster__count">${entry.ids.length}</span>
            </button>
          `;
        }

        const item = entry.item;
        const isSelected = item.id === state.selectedId;
        const isFavorite = state.favorites.has(item.id);
        const isHovered =
          state.preview && state.preview.kind === "item" && state.preview.id === item.id;

        return `
          <button
            class="app-map-marker app-map-marker--${item.type} ${isSelected ? "is-selected" : ""} ${isHovered ? "is-hovered" : ""} ${isFavorite ? "is-favorite" : ""} ${item.online ? "is-online" : ""}"
            style="--x: ${item.x}%; --y: ${item.y}%"
            type="button"
            aria-label="${escapeHtml(item.title)}, ${escapeHtml(item.company)}"
            data-marker-id="${item.id}"
          >
            <span class="app-map-marker__pin" aria-hidden="true"></span>
            <span class="app-map-marker__tail" aria-hidden="true"></span>
            ${isFavorite ? '<span class="app-map-marker__badge" aria-hidden="true">♥</span>' : ""}
            ${item.online ? '<span class="app-map-marker__label" aria-hidden="true">Онлайн</span>' : ""}
          </button>
        `;
      })
      .join("");

    renderPreview();
  }

  function renderPreview() {
    if (!state.preview || state.forcedMode === "loading" || state.forcedMode === "error") {
      elements.mapPreview.hidden = true;
      elements.mapPreview.innerHTML = "";
      return;
    }

    elements.mapPreview.hidden = false;
    if (state.preview.kind === "item") {
      const item = getOpportunity(state.preview.id);
      if (!item) {
        elements.mapPreview.hidden = true;
        elements.mapPreview.innerHTML = "";
        return;
      }

      const favoriteClass = state.favorites.has(item.id) ? "is-active" : "";
      elements.mapPreview.innerHTML = `
        <article class="app-map-preview-card" data-preview-kind="item">
          <div class="app-map-preview-card__head">
            <div>
              <p class="app-map-preview-card__company">${escapeHtml(item.company)}</p>
              <strong>${escapeHtml(item.title)}</strong>
            </div>
            <button
              class="icon-button app-map-preview-card__close"
              type="button"
              aria-label="Закрыть мини-карточку"
              data-action="close-preview"
            >
              ×
            </button>
          </div>

          <p class="app-map-preview-card__description">${escapeHtml(item.description)}</p>

          <div class="app-map-preview-card__meta">
            <span class="chip">${TYPE_LABELS[item.type]}</span>
            <span class="chip">${escapeHtml(item.format)}</span>
            ${item.salary ? `<span class="chip">${escapeHtml(item.salary)}</span>` : ""}
          </div>

          <div class="app-map-preview-card__tags">
            ${item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>

          <div class="app-map-preview-card__head">
            <div class="app-map-preview-card__contacts">
              ${
                item.contacts.length
                  ? `<div class="app-avatar-stack">${item.contacts
                      .slice(0, 3)
                      .map((contact) => `<span>${escapeHtml(contact)}</span>`)
                      .join("")}</div>`
                  : ""
              }
              <span class="chip">${escapeHtml(item.relation)}</span>
            </div>

            <button
              class="icon-button app-map-preview-card__favorite ${favoriteClass}"
              type="button"
              aria-label="Сохранить в избранное"
              data-action="toggle-favorite"
              data-id="${item.id}"
            >
              ${state.favorites.has(item.id) ? "♥" : "♡"}
            </button>
          </div>
        </article>
      `;
      positionPreview(item.x, item.y, 320, 230);
      return;
    }

    const clusterItems = state.preview.ids.map(getOpportunity).filter(Boolean);
    elements.mapPreview.innerHTML = `
      <article class="app-map-preview-card" data-preview-kind="cluster">
        <div class="app-map-preview-card__head">
          <div>
            <p class="app-map-preview-card__company">Кластер на карте</p>
            <strong>${clusterItems.length} возможностей в одной области</strong>
          </div>
          <button
            class="icon-button app-map-preview-card__close"
            type="button"
            aria-label="Закрыть кластер"
            data-action="close-preview"
          >
            ×
          </button>
        </div>

        <p class="app-map-preview-card__description">
          Выберите карточку из кластера, чтобы закрепить конкретную возможность и подсветить её в списке.
        </p>

        <div class="app-map-preview-card__cluster-list">
          ${clusterItems
            .slice(0, 4)
            .map(
              (item) => `
                <button
                  class="chip"
                  type="button"
                  data-action="cluster-select"
                  data-id="${item.id}"
                >
                  ${escapeHtml(item.title)}
                </button>
              `,
            )
            .join("")}
        </div>
      </article>
    `;
    positionPreview(state.preview.anchorX, state.preview.anchorY, 320, 200);
  }

  function renderResults(items) {
    elements.resultsCount.textContent = `${items.length} ${pluralize(items.length)}`;
    elements.resultsNote.textContent = getResultsNote(items.length);

    if (state.forcedMode === "loading") {
      elements.resultsList.innerHTML = `
        <div class="app-results-skeleton">
          <article class="app-skeleton-card"><span></span><span></span><span></span><span></span></article>
          <article class="app-skeleton-card"><span></span><span></span><span></span><span></span></article>
          <article class="app-skeleton-card"><span></span><span></span><span></span><span></span></article>
          <article class="app-skeleton-card"><span></span><span></span><span></span><span></span></article>
        </div>
      `;
      elements.searchPanel.classList.add("is-loading");
      return;
    }

    elements.searchPanel.classList.remove("is-loading");

    if (state.forcedMode === "error") {
      elements.resultsList.innerHTML = `
        <article class="app-results-state">
          <span class="tag tag-warm">Ошибка</span>
          <h4>Данные не удалось загрузить</h4>
          <p>Попробуйте повторить запрос. Пустой результат и ошибка разделены, чтобы не путать пользователя.</p>
          <div class="app-results-state__actions">
            <button class="button button-primary" type="button" data-action="retry">Повторить</button>
          </div>
        </article>
      `;
      return;
    }

    if (!items.length) {
      elements.resultsList.innerHTML = `
        <article class="app-results-state">
          <span class="tag">Ничего не найдено</span>
          <h4>Ничего не найдено</h4>
          <p>Измените запрос, ослабьте фильтры или верните весь список возможностей.</p>
          <div class="app-results-state__actions">
            <button class="button button-secondary" type="button" data-action="reset-all">Сбросить фильтры</button>
            <button class="button button-primary" type="button" data-action="show-all">Показать все возможности</button>
          </div>
        </article>
      `;
      return;
    }

    elements.resultsList.innerHTML = items
      .map((item) => {
        const isSelected = item.id === state.selectedId;
        const isFavorite = state.favorites.has(item.id);
        const companyMarkClass = COMPANY_MARK_CLASS[item.company] || "company-mark--orange";

        return `
          <article class="app-result-card ${isSelected ? "is-selected" : ""}" data-result-id="${item.id}">
            <div class="app-result-card__head">
              <div class="app-result-card__title-wrap">
                <div class="app-result-card__meta">
                  <span class="company-mark ${companyMarkClass}" aria-hidden="true">${escapeHtml(item.companyShort)}</span>
                  <div class="app-result-card__chips">
                    <span class="chip">${TYPE_LABELS[item.type]}</span>
                    <span class="chip">${escapeHtml(item.format)}</span>
                    ${item.online && item.format !== "Онлайн" ? '<span class="chip">Онлайн</span>' : ""}
                  </div>
                </div>
                <h4 class="app-result-card__title">${escapeHtml(item.title)}</h4>
                <p class="app-result-card__company">${escapeHtml(item.company)}</p>
              </div>

              <button
                class="icon-button app-result-card__favorite ${isFavorite ? "is-active" : ""}"
                type="button"
                aria-label="Сохранить в избранное"
                data-action="toggle-favorite"
                data-id="${item.id}"
              >
                ${isFavorite ? "♥" : "♡"}
              </button>
            </div>

            <div class="app-result-card__meta">
              <p class="app-result-card__city">${escapeHtml(item.city)}</p>
              ${item.salary ? `<p class="app-result-card__salary">${escapeHtml(item.salary)}</p>` : ""}
              <span class="chip">${escapeHtml(item.level)}</span>
            </div>

            <div class="app-result-card__tags">
              ${item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
            </div>
          </article>
        `;
      })
      .join("");

    if (state.pendingScrollId) {
      const card = elements.resultsList.querySelector(`[data-result-id="${state.pendingScrollId}"]`);
      if (card) {
        card.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
      state.pendingScrollId = null;
    }
  }

  function renderDrawerState() {
    elements.draftFilterButtons.forEach((button) => {
      const key = button.dataset.draftFilterKey;
      const value = button.dataset.draftFilterValue;
      button.classList.toggle("is-active", state.draftFilters[key].includes(value));
    });

    const draftActive = collectActiveFilters(state.draftFilters);
    elements.drawerActiveFilters.innerHTML = draftActive.length
      ? draftActive
          .map(
            (filter) =>
              `<span class="app-active-filter">${escapeHtml(filter.label)}</span>`,
          )
          .join("")
      : '<span class="chip">Пока ничего не выбрано</span>';
  }

  function selectOpportunity(id, shouldPin, shouldScroll) {
    const item = getOpportunity(id);
    if (!item) {
      return;
    }

    state.selectedId = id;
    if (shouldPin) {
      state.preview = {
        kind: "item",
        id,
        pinned: true,
        anchorX: item.x,
        anchorY: item.y,
      };
    }
    if (shouldScroll) {
      state.pendingScrollId = id;
    }
    render();
  }

  function toggleFavorite(id) {
    if (state.favorites.has(id)) {
      state.favorites.delete(id);
    } else {
      state.favorites.add(id);
    }

    saveFavorites();
    render();
  }

  function applyPreset(preset) {
    clearForcedMode();
    state.filters = createEmptyFilters();
    state.query = "";
    elements.searchInput.value = "";
    elements.clearSearch.hidden = true;

    if (preset === "skills-match") {
      state.filters.skills = ["SQL", "Research", "Аналитика"];
      state.filters.level = ["Junior"];
    }

    if (preset === "students") {
      state.filters.type = ["internship", "event"];
      state.filters.level = ["Без опыта"];
    }

    if (preset === "contacts") {
      state.query = "контакт";
      elements.searchInput.value = "контакт";
    }

    if (preset === "deadlines") {
      state.filters.type = ["vacancy", "event"];
      state.query = "март";
      elements.searchInput.value = "март";
    }

    if (preset === "nearby") {
      state.filters.format = ["Гибрид", "Офис"];
      state.query = "Москва";
      elements.searchInput.value = "Москва";
    }

    state.draftFilters = cloneFilters(state.filters);
    document.getElementById("workspace").scrollIntoView({ behavior: "smooth", block: "start" });
    render();
  }

  function getVisibleOpportunities() {
    if (state.forcedMode === "error" || state.forcedMode === "loading") {
      return opportunities.slice();
    }

    if (state.forcedMode === "empty") {
      return [];
    }

    return opportunities.filter((item) => {
      if (!matchesQuery(item, state.query)) {
        return false;
      }

      return FILTER_KEYS.every((key) => matchesFilter(item, key, state.filters[key]));
    });
  }

  function matchesQuery(item, query) {
    if (!query) {
      return true;
    }

    const haystack = [
      item.title,
      item.company,
      item.city,
      item.description,
      item.relation,
      TYPE_LABELS[item.type],
      item.format,
      item.level,
      item.tags.join(" "),
      item.skills.join(" "),
      item.deadline,
      item.online ? "онлайн" : "",
      item.contacts.length ? "контакт" : "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query.toLowerCase());
  }

  function matchesFilter(item, key, values) {
    if (!values.length) {
      return true;
    }

    if (key === "skills") {
      return values.some((value) => item.skills.includes(value));
    }

    if (key === "salary") {
      return item.salaryBand ? values.includes(item.salaryBand) : false;
    }

    if (key === "format") {
      return values.includes(item.format);
    }

    if (key === "type") {
      return values.includes(item.type);
    }

    if (key === "level") {
      return values.includes(item.level);
    }

    return true;
  }

  function buildClusters(items, expandedIds) {
    const groups = [];
    const freeItems = [];

    items.forEach((item) => {
      if (expandedIds.has(item.id)) {
        freeItems.push({ kind: "item", item });
        return;
      }

      const group = groups.find(
        (candidate) =>
          Math.abs(candidate.x - item.x) <= 6 &&
          Math.abs(candidate.y - item.y) <= 6 &&
          candidate.type === item.type,
      );

      if (group) {
        group.ids.push(item.id);
        group.items.push(item);
        group.x = average(group.items.map((entry) => entry.x));
        group.y = average(group.items.map((entry) => entry.y));
      } else {
        groups.push({
          id: `cluster-${item.type}-${item.id}`,
          type: item.type,
          ids: [item.id],
          items: [item],
          x: item.x,
          y: item.y,
        });
      }
    });

    const compactGroups = groups.flatMap((group) => {
      if (group.ids.length >= 3) {
        return {
          kind: "cluster",
          id: group.id,
          ids: group.ids,
          x: Number(group.x.toFixed(1)),
          y: Number(group.y.toFixed(1)),
        };
      }

      return group.items.map((item) => ({ kind: "item", item }));
    });

    return freeItems.concat(compactGroups);
  }

  function removeFilter(key, value) {
    if (key === "query") {
      state.query = "";
      elements.searchInput.value = "";
      elements.clearSearch.hidden = true;
      render();
      return;
    }

    state.filters[key] = state.filters[key].filter((entry) => entry !== value);
    state.draftFilters = cloneFilters(state.filters);
    render();
  }

  function resetAllFilters() {
    state.filters = createEmptyFilters();
    state.draftFilters = createEmptyFilters();
    state.query = "";
    state.selectedId = null;
    state.preview = null;
    elements.searchInput.value = "";
    elements.clearSearch.hidden = true;
    clearForcedMode();
    render();
  }

  function positionPreview(anchorX, anchorY, preferredWidth, preferredHeight) {
    const surface = document.querySelector(".app-map-panel__surface");
    const previewCard = elements.mapPreview.querySelector(".app-map-preview-card");
    if (!surface || !previewCard) {
      return;
    }

    const rect = surface.getBoundingClientRect();
    const leftPx = (anchorX / 100) * rect.width;
    const topPx = (anchorY / 100) * rect.height;
    const width = Math.min(preferredWidth, rect.width - 28);
    const left = clamp(leftPx + 18, 14, rect.width - width - 14);
    const top = clamp(topPx - preferredHeight - 14, 14, rect.height - preferredHeight - 14);
    previewCard.style.left = `${left}px`;
    previewCard.style.top = `${top}px`;
  }

  function openDrawer() {
    state.draftFilters = cloneFilters(state.filters);
    elements.drawer.hidden = false;
    elements.body.classList.add("is-drawer-open");
    renderDrawerState();
  }

  function closeDrawer() {
    elements.drawer.hidden = true;
    elements.body.classList.remove("is-drawer-open");
  }

  function syncAuth() {
    const guestVisible = state.auth !== "user";
    elements.guestAuth.hidden = !guestVisible;
    elements.userAuth.hidden = guestVisible;
  }

  function syncSearchUI() {
    elements.clearSearch.hidden = elements.searchInput.value.length === 0;
  }

  function bindMapStateActions() {
    elements.mapState.querySelectorAll("[data-action='retry']").forEach((button) => {
      button.addEventListener("click", () => {
        clearForcedMode();
        render();
      });
    });

    elements.mapState.querySelectorAll("[data-action='reset-all']").forEach((button) => {
      button.addEventListener("click", resetAllFilters);
    });

    elements.mapState.querySelectorAll("[data-action='show-all']").forEach((button) => {
      button.addEventListener("click", () => {
        clearForcedMode();
        state.filters = createEmptyFilters();
        state.draftFilters = createEmptyFilters();
        state.query = "";
        elements.searchInput.value = "";
        elements.clearSearch.hidden = true;
        render();
      });
    });
  }

  function clearForcedMode() {
    state.forcedMode = null;
    params.delete("state");
    const query = params.toString();
    const newUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;
    window.history.replaceState({}, "", newUrl);
  }

  function loadFavorites() {
    try {
      const stored = window.localStorage.getItem(getFavoritesKey());
      const parsed = stored
        ? JSON.parse(stored)
        : opportunities.filter((item) => item.favorite).map((item) => item.id);
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      return new Set(opportunities.filter((item) => item.favorite).map((item) => item.id));
    }
  }

  function saveFavorites() {
    try {
      window.localStorage.setItem(getFavoritesKey(), JSON.stringify(Array.from(state.favorites)));
    } catch (error) {
      return;
    }
  }

  function getFavoritesKey() {
    return state.auth === "user"
      ? "tramplin:user:favorites"
      : "tramplin:guest:favorites";
  }

  function getOpportunity(id) {
    return opportunities.find((item) => item.id === id);
  }

  function createEmptyFilters() {
    return {
      skills: [],
      salary: [],
      format: [],
      type: [],
      level: [],
    };
  }

  function cloneFilters(filters) {
    return FILTER_KEYS.reduce((accumulator, key) => {
      accumulator[key] = filters[key].slice();
      return accumulator;
    }, createEmptyFilters());
  }

  function toggleFilter(filters, key, value) {
    const bucket = filters[key];
    if (!bucket) {
      return;
    }

    if (bucket.includes(value)) {
      filters[key] = bucket.filter((entry) => entry !== value);
      return;
    }

    filters[key] = bucket.concat(value);
  }

  function collectActiveFilters(filters) {
    return FILTER_KEYS.flatMap((key) =>
      filters[key].map((value) => ({
        key,
        value,
        label: key === "type" ? TYPE_LABELS[value] : value,
      })),
    );
  }

  function openOpportunity(id) {
    window.location.href = `../opportunities/opportunity-detail.html?opportunity=${encodeURIComponent(id)}`;
  }

  function pluralize(count) {
    if (count % 10 === 1 && count % 100 !== 11) {
      return "возможность";
    }

    if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
      return "возможности";
    }

    return "возможностей";
  }

  function getResultsNote(count) {
    if (state.forcedMode === "loading") {
      return "Загружаем список и карту";
    }

    if (state.forcedMode === "error") {
      return "Не удалось получить актуальные данные";
    }

    if (!count) {
      return "Подборку можно расширить через поиск или фильтры";
    }

    if (state.query || collectActiveFilters(state.filters).length) {
      return "Карта и список синхронизированы по текущему запросу";
    }

    return "Показаны все доступные результаты";
  }

  function average(values) {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }
})();
