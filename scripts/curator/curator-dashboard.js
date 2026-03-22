(function () {
  const moderationItems = [
    {
      id: "moderation-1",
      title: "Стажировка в продуктовой аналитике",
      company: "Signal Hub",
      type: "internship",
      date: "19 марта 2026",
      status: "pending",
      description:
        "Стажировка для студентов 3–4 курса: продуктовые метрики, SQL, A/B-тесты и работа с наставником в growth-команде.",
      format: "Гибрид",
      salary: "60 000 ₽ / мес",
      tags: ["SQL", "BI", "Growth"],
      media: ["Превью лендинга", "Программа стажировки"],
      priority: "Высокий",
      curatorComment: "",
    },
    {
      id: "moderation-2",
      title: "Junior Security Analyst",
      company: "Киберполигон",
      type: "vacancy",
      date: "18 марта 2026",
      status: "pending",
      description:
        "Стартовая роль в SOC-команде: мониторинг инцидентов, SIEM, наставник на старте и понятная траектория роста внутри компании.",
      format: "Офис / гибрид",
      salary: "от 90 000 ₽",
      tags: ["SOC", "SIEM", "InfoSec"],
      media: ["Обложка вакансии", "Скрин требований"],
      priority: "Высокий",
      curatorComment: "",
    },
    {
      id: "moderation-3",
      title: "AI Product Sprint",
      company: "Трамплин Platform",
      type: "event",
      date: "17 марта 2026",
      status: "revision",
      description:
        "Двухдневный спринт с продуктовой командой и кураторами платформы. Требуется доработать описание трека и уточнить дедлайн регистрации.",
      format: "Онлайн + Москва",
      salary: "Регистрация",
      tags: ["AI", "Product", "Спринт"],
      media: ["Баннер события", "План программы"],
      priority: "Средний",
      curatorComment: "Нужно уточнить дедлайн регистрации и состав спикеров.",
    },
    {
      id: "moderation-4",
      title: "Frontend Trainee",
      company: "Cloud Orbit",
      type: "vacancy",
      date: "15 марта 2026",
      status: "approved",
      description:
        "Практика на стыке интерфейсов и платформенной команды: дизайн-система, React, поддержка внутренних кабинетов.",
      format: "Гибрид",
      salary: "от 70 000 ₽",
      tags: ["React", "UI", "Design System"],
      media: ["Карточка компании", "Скрин стека"],
      priority: "Низкий",
      curatorComment: "",
    },
    {
      id: "moderation-5",
      title: "Design Bootcamp",
      company: "Product Lab",
      type: "internship",
      date: "14 марта 2026",
      status: "rejected",
      description:
        "Онлайн-программа с интенсивом по UI и портфолио. Отклонена из-за недостаточно прозрачных условий и отсутствия контакта ответственного.",
      format: "Онлайн",
      salary: "Стипендия 35 000 ₽",
      tags: ["UI", "Portfolio", "Review"],
      media: ["Постер", "Описание трека"],
      priority: "Низкий",
      curatorComment: "Нет подтверждения ответственного лица и условий отбора.",
    },
    {
      id: "moderation-6",
      title: "Data Lab Intern",
      company: "Data Forge",
      type: "internship",
      date: "19 марта 2026",
      status: "pending",
      description:
        "Стажировка в data-команде с фокусом на очистку данных, дашборды и первые продуктовые исследования вместе с аналитиками.",
      format: "Офис",
      salary: "50 000 ₽ / мес",
      tags: ["Data", "Python", "SQL"],
      media: ["План стажировки", "Превью дашборда"],
      priority: "Средний",
      curatorComment: "",
    },
    {
      id: "moderation-7",
      title: "DevRel Assistant",
      company: "Трамплин Platform",
      type: "vacancy",
      date: "18 марта 2026",
      status: "pending",
      description:
        "Роль для тех, кто умеет собирать комьюнити, вести события и работать с карьерными программами платформы.",
      format: "Онлайн",
      salary: "от 80 000 ₽",
      tags: ["Community", "Events", "Writing"],
      media: ["Описание роли", "Команда DevRel"],
      priority: "Высокий",
      curatorComment: "",
    },
    {
      id: "moderation-8",
      title: "MLOps Practice Track",
      company: "Orbit Labs",
      type: "internship",
      date: "17 марта 2026",
      status: "revision",
      description:
        "Практика по ML-инфраструктуре: контейнеризация моделей, пайплайны и работа с observability. Нужно уточнить наставника и формат занятости.",
      format: "Гибрид",
      salary: "65 000 ₽ / мес",
      tags: ["MLOps", "Docker", "Kubernetes"],
      media: ["Программа трека", "Схема пайплайна"],
      priority: "Средний",
      curatorComment: "Уточнить длительность трека и формат участия в офисные дни.",
    },
    {
      id: "moderation-9",
      title: "Cyber Career Meetup",
      company: "Edge Security",
      type: "event",
      date: "16 марта 2026",
      status: "approved",
      description:
        "Оффлайн-встреча по карьерным трекам в кибербезопасности с быстрыми собеседованиями и карьерной консультацией.",
      format: "Москва",
      salary: "Регистрация",
      tags: ["Meetup", "Security", "Networking"],
      media: ["Постер", "Список спикеров"],
      priority: "Низкий",
      curatorComment: "",
    },
  ];

  const companies = [
    {
      id: "company-1",
      name: "Север Digital",
      status: "pending",
      date: "19 марта 2026",
      site: "https://severdigital.ru",
      email: "career@severdigital.ru",
      socials: ["Telegram", "VK"],
      description:
        "Продуктовая IT-команда из Санкт-Петербурга. Публикует вакансии по аналитике и frontend, ищет студентов для стажировок.",
      siteExists: true,
      domainMatch: true,
      socialsExists: true,
      documents: ["ИНН.pdf", "ОГРН.pdf"],
    },
    {
      id: "company-2",
      name: "Neuro Campus",
      status: "needs-data",
      date: "18 марта 2026",
      site: "https://neurocampus.team",
      email: "team@neurocampus.team",
      socials: ["Telegram"],
      description:
        "Образовательный стартап с карьерными интенсивами. Запрошены дополнительные данные по юридическому лицу и домену сайта.",
      siteExists: true,
      domainMatch: false,
      socialsExists: true,
      documents: ["Презентация.pdf"],
    },
    {
      id: "company-3",
      name: "Data Forge",
      status: "verified",
      date: "16 марта 2026",
      site: "https://dataforge.ru",
      email: "jobs@dataforge.ru",
      socials: ["VK", "Сайт"],
      description:
        "Команда аналитических платформ, уже верифицирована и публикует вакансии в контуре работодателей.",
      siteExists: true,
      domainMatch: true,
      socialsExists: true,
      documents: ["ИНН.pdf", "ОГРН.pdf", "Реквизиты.pdf"],
    },
    {
      id: "company-4",
      name: "Edge Security",
      status: "rejected",
      date: "13 марта 2026",
      site: "https://edge-security.io",
      email: "jobs@edgesec.io",
      socials: [],
      description:
        "Запрос отклонён: сайт не подтверждает организацию, юридические данные не совпадают с почтовым доменом.",
      siteExists: false,
      domainMatch: false,
      socialsExists: false,
      documents: [],
    },
    {
      id: "company-5",
      name: "Orbit Labs",
      status: "pending",
      date: "19 марта 2026",
      site: "https://orbitlabs.ai",
      email: "careers@orbitlabs.ai",
      socials: ["Telegram", "LinkedIn"],
      description:
        "Команда инфраструктуры AI-продуктов, ищет стажёров и junior-специалистов в data и MLOps-направлениях.",
      siteExists: true,
      domainMatch: true,
      socialsExists: true,
      documents: ["ИНН.pdf", "ОГРН.pdf", "Брендбук.pdf"],
    },
    {
      id: "company-6",
      name: "Mentor Space",
      status: "pending",
      date: "18 марта 2026",
      site: "https://mentor-space.ru",
      email: "hello@mentor-space.ru",
      socials: ["Telegram", "VK"],
      description:
        "Карьерный сервис с менторскими программами и онлайн-мероприятиями. Подали заявку на публикацию компании и событий.",
      siteExists: true,
      domainMatch: true,
      socialsExists: true,
      documents: ["ИНН.pdf"],
    },
    {
      id: "company-7",
      name: "Code River",
      status: "verified",
      date: "14 марта 2026",
      site: "https://coderiver.dev",
      email: "hr@coderiver.dev",
      socials: ["VK", "Сайт"],
      description:
        "Разработчики B2B-сервисов. Компания подтверждена и уже публикует вакансии для backend и frontend направления.",
      siteExists: true,
      domainMatch: true,
      socialsExists: true,
      documents: ["ИНН.pdf", "ОГРН.pdf"],
    },
  ];

  const users = [
    {
      id: "user-1",
      name: "Алина Петрова",
      role: "candidate",
      status: "active",
      date: "19 марта 2026",
      summary: "4 курс, аналитика продукта, отклики в Signal Hub и Трамплин Platform.",
      team: "МГТУ им. Баумана",
      lastSeen: "10 минут назад",
    },
    {
      id: "user-2",
      name: "Илья Смирнов",
      role: "candidate",
      status: "blocked",
      date: "18 марта 2026",
      summary: "Аккаунт ограничен после повторных жалоб на спам в откликах.",
      team: "ИТМО",
      lastSeen: "2 часа назад",
    },
    {
      id: "user-3",
      name: "ООО КОМПАНИ",
      role: "employer",
      status: "active",
      date: "18 марта 2026",
      summary: "Верифицированный работодатель, активны 3 возможности и 12 новых откликов.",
      team: "Информационная безопасность",
      lastSeen: "30 минут назад",
    },
    {
      id: "user-4",
      name: "Cloud Orbit HR",
      role: "employer",
      status: "review",
      date: "17 марта 2026",
      summary: "Ожидает подтверждения прав на управление компанией и публикацией новых вакансий.",
      team: "Cloud Orbit",
      lastSeen: "вчера",
    },
    {
      id: "user-5",
      name: "Мария Новикова",
      role: "candidate",
      status: "active",
      date: "16 марта 2026",
      summary: "Backend trainee, активен профиль и портфолио с 3 pet-проектами.",
      team: "МИФИ",
      lastSeen: "сегодня",
    },
    {
      id: "user-6",
      name: "Research Point HR",
      role: "employer",
      status: "deleted",
      date: "12 марта 2026",
      summary: "Учётная запись удалена после закрытия компании в каталоге платформы.",
      team: "Research Point",
      lastSeen: "3 дня назад",
    },
    {
      id: "user-7",
      name: "Егор Иванов",
      role: "candidate",
      status: "review",
      date: "19 марта 2026",
      summary: "Профиль отправлен на ручную проверку после правки контактных данных и смены резюме.",
      team: "ВШЭ",
      lastSeen: "1 час назад",
    },
    {
      id: "user-8",
      name: "Елизавета Соколова",
      role: "candidate",
      status: "active",
      date: "17 марта 2026",
      summary: "UX researcher, активно откликается на мероприятия и добавила новое портфолио.",
      team: "СПбГУ",
      lastSeen: "сегодня",
    },
    {
      id: "user-9",
      name: "Signal Hub HR",
      role: "employer",
      status: "active",
      date: "19 марта 2026",
      summary: "Владелец компании Signal Hub, активны 2 новые публикации и 8 свежих откликов.",
      team: "Signal Hub",
      lastSeen: "15 минут назад",
    },
    {
      id: "user-10",
      name: "Neuro Campus Admin",
      role: "employer",
      status: "review",
      date: "18 марта 2026",
      summary: "Ожидает ручной проверки прав на домен и подтверждение аккаунта администратора компании.",
      team: "Neuro Campus",
      lastSeen: "сегодня",
    },
  ];

  const reports = [
    {
      id: "report-1",
      object: "Junior Security Analyst",
      reason: "Недостоверная зарплата",
      date: "19 марта 2026",
      count: 6,
      status: "review",
      summary: "Жалобы объединены по одной вакансии: пользователи указывают на некорректную зарплатную вилку в описании.",
    },
    {
      id: "report-2",
      object: "Аккаунт Ильи Смирнова",
      reason: "Спам в откликах",
      date: "18 марта 2026",
      count: 4,
      status: "blocked",
      summary: "Жалобы связаны с массовыми откликами без релевантного сопроводительного текста. Аккаунт уже ограничен.",
    },
    {
      id: "report-3",
      object: "AI Product Sprint",
      reason: "Неполное описание мероприятия",
      date: "17 марта 2026",
      count: 3,
      status: "pending",
      summary: "Пользователи не понимают условия участия. Жалобы объединены и переданы в модерацию возможностей.",
    },
    {
      id: "report-4",
      object: "Product Lab",
      reason: "Нет подтверждения компании",
      date: "15 марта 2026",
      count: 2,
      status: "pending",
      summary: "Жалобы поступили на карточку работодателя: пользователи не находят юридические данные и официальный сайт.",
    },
    {
      id: "report-5",
      object: "Signal Hub HR",
      reason: "Дублирующиеся сообщения кандидатам",
      date: "19 марта 2026",
      count: 5,
      status: "review",
      summary: "Группа жалоб на массовые приглашения в отклики без персонализации. Требуется сверка шаблонов рассылки.",
    },
    {
      id: "report-6",
      object: "MLOps Practice Track",
      reason: "Нет контакта куратора",
      date: "18 марта 2026",
      count: 3,
      status: "pending",
      summary: "Студенты не находят контакт ответственного за трек. Жалобы объединены и переданы в карточку модерации.",
    },
    {
      id: "report-7",
      object: "Orbit Labs",
      reason: "Не подтверждён Telegram-канал",
      date: "16 марта 2026",
      count: 2,
      status: "pending",
      summary: "Пользователи пожаловались на ссылку в карточке компании. Нужно перепроверить соцсети и домен.",
    },
  ];

  const tags = [
    { id: "tag-1", name: "SQL", type: "skill", usage: 126 },
    { id: "tag-2", name: "Product Analytics", type: "topic", usage: 68 },
    { id: "tag-3", name: "Гибрид", type: "format", usage: 152 },
    { id: "tag-4", name: "InfoSec", type: "topic", usage: 47 },
    { id: "tag-5", name: "React", type: "skill", usage: 83 },
    { id: "tag-6", name: "Онлайн", type: "format", usage: 174 },
    { id: "tag-7", name: "Python", type: "skill", usage: 149 },
    { id: "tag-8", name: "MLOps", type: "topic", usage: 24 },
    { id: "tag-9", name: "Офис", type: "format", usage: 118 },
    { id: "tag-10", name: "UX Research", type: "topic", usage: 39 },
    { id: "tag-11", name: "Docker", type: "skill", usage: 57 },
    { id: "tag-12", name: "Событие", type: "format", usage: 64 },
  ];

  const systemRules = [
    {
      id: "rule-1",
      title: "Автоподсказка тегов",
      text: "Система предлагает теги по заголовку и описанию возможности перед ручной проверкой.",
      state: "Активно",
    },
    {
      id: "rule-2",
      title: "Стоп-слова публикаций",
      text: "Ключевые слова срабатывают как триггер для ручной доработки до публикации.",
      state: "18 правил",
    },
    {
      id: "rule-3",
      title: "Приоритет жалоб",
      text: "При повторной жалобе на один объект карточка поднимается в начало очереди.",
      state: "Высокий",
    },
    {
      id: "rule-4",
      title: "Ручная проверка доменов",
      text: "Все компании без совпадения почтового домена автоматически попадают в отдельный контур верификации.",
      state: "9 в очереди",
    },
    {
      id: "rule-5",
      title: "Шаблоны отклонений",
      text: "Кураторы используют согласованные причины отклонения и доработки для единообразной коммуникации.",
      state: "6 шаблонов",
    },
  ];

  const logs = [
    {
      id: "log-1",
      title: "Создана вакансия Signal Hub",
      text: "Компания отправила на проверку стажировку в продуктовой аналитике.",
      date: "19 марта · 11:20",
      level: "info",
      type: "возможность",
    },
    {
      id: "log-2",
      title: "Профиль компании обновлён",
      text: "Cloud Orbit HR изменил описание команды и контактное лицо.",
      date: "19 марта · 10:45",
      level: "info",
      type: "компания",
    },
    {
      id: "log-3",
      title: "Заблокирован пользователь",
      text: "Аккаунт Ильи Смирнова ограничен по повторным жалобам на спам.",
      date: "18 марта · 18:10",
      level: "warning",
      type: "пользователь",
    },
    {
      id: "log-4",
      title: "Требуется повторная проверка",
      text: "AI Product Sprint отправлен на доработку по описанию условий участия.",
      date: "18 марта · 16:30",
      level: "warning",
      type: "модерация",
    },
    {
      id: "log-5",
      title: "Подтверждена компания",
      text: "Data Forge завершила проверку сайта, домена и документов.",
      date: "16 марта · 15:05",
      level: "info",
      type: "компания",
    },
    {
      id: "log-6",
      title: "Поступили новые жалобы",
      text: "По карточке Signal Hub HR объединено 5 обращений в один кейс.",
      date: "19 марта · 12:10",
      level: "warning",
      type: "жалобы",
    },
    {
      id: "log-7",
      title: "Создан запрос на данные",
      text: "Для Neuro Campus отправлен запрос на подтверждение домена и юридических реквизитов.",
      date: "19 марта · 11:55",
      level: "info",
      type: "компания",
    },
    {
      id: "log-8",
      title: "Тег обновлён",
      text: "В системном справочнике скорректирован тег Product Analytics.",
      date: "19 марта · 10:20",
      level: "info",
      type: "теги",
    },
    {
      id: "log-9",
      title: "Карточка отправлена на доработку",
      text: "MLOps Practice Track возвращён работодателю с комментарием по формату участия.",
      date: "18 марта · 17:40",
      level: "warning",
      type: "модерация",
    },
    {
      id: "log-10",
      title: "Система отметила риск",
      text: "Автопроверка домена выявила расхождение в карточке Orbit Labs.",
      date: "18 марта · 14:05",
      level: "error",
      type: "система",
    },
  ];

  const TYPE_LABELS = {
    vacancy: "Вакансия",
    internship: "Стажировка",
    event: "Событие",
  };

  const ROLE_LABELS = {
    candidate: "Соискатель",
    employer: "Работодатель",
  };

  const TAG_LABELS = {
    skill: "Навык",
    format: "Формат",
    topic: "Тематика",
  };

  const params = new URLSearchParams(window.location.search);
  const allowedModes = new Set(["loading", "empty", "error"]);
  const allowedSections = {
    dashboard: "curator-section-dashboard",
    moderation: "curator-section-moderation",
    companies: "curator-section-companies",
    users: "curator-section-users",
    reports: "curator-section-reports",
    tags: "curator-section-tags",
    logs: "curator-section-logs",
    settings: "curator-section-settings",
  };

  const state = {
    forcedMode: allowedModes.has(params.get("state")) ? params.get("state") : null,
    moderationQuery: "",
    moderationStatus: "all",
    companyQuery: "",
    companyStatus: "all",
    userQuery: "",
    userRole: "all",
    reportSort: "count",
    tagQuery: "",
    tagType: "all",
    selectedModerationId: moderationItems[0].id,
    moderationDecision: null,
    moderationComment: "",
    selectedCompanyId: companies[0].id,
    selectedUserId: users[0].id,
    tagDraft: createEmptyTagDraft(),
    pendingConfirm: null,
  };

  const elements = {
    sectionInputs: document.querySelectorAll("input[name='curator-section']"),
    dashboardMetrics: document.getElementById("dashboard-metrics"),
    dashboardQueue: document.getElementById("dashboard-queue"),
    dashboardQueueCount: document.getElementById("dashboard-queue-count"),
    dashboardActivity: document.getElementById("dashboard-activity"),
    dashboardFocus: document.getElementById("dashboard-focus"),
    moderationSearch: document.getElementById("moderation-search"),
    moderationSummary: document.getElementById("moderation-summary"),
    moderationCountChip: document.getElementById("moderation-count-chip"),
    moderationRows: document.getElementById("moderation-rows"),
    moderationDetail: document.getElementById("moderation-detail"),
    moderationStatusButtons: document.querySelectorAll("[data-moderation-status]"),
    companiesSearch: document.getElementById("companies-search"),
    companiesSummary: document.getElementById("companies-summary"),
    companiesCountChip: document.getElementById("companies-count-chip"),
    companiesRows: document.getElementById("companies-rows"),
    companyDetail: document.getElementById("company-detail"),
    companyStatusButtons: document.querySelectorAll("[data-company-status]"),
    usersSearch: document.getElementById("users-search"),
    usersSummary: document.getElementById("users-summary"),
    usersCountChip: document.getElementById("users-count-chip"),
    usersRows: document.getElementById("users-rows"),
    userDetail: document.getElementById("user-detail"),
    userRoleButtons: document.querySelectorAll("[data-user-role]"),
    reportsSummary: document.getElementById("reports-summary"),
    reportsCountChip: document.getElementById("reports-count-chip"),
    reportsList: document.getElementById("reports-list"),
    reportSortButtons: document.querySelectorAll("[data-report-sort]"),
    tagsSearch: document.getElementById("tags-search"),
    tagsSummary: document.getElementById("tags-summary"),
    tagsCountChip: document.getElementById("tags-count-chip"),
    tagsRows: document.getElementById("tags-rows"),
    tagTypeButtons: document.querySelectorAll("[data-tag-type]"),
    tagCreateButton: document.getElementById("tag-create-button"),
    tagForm: document.getElementById("tag-form"),
    tagEditorTitle: document.getElementById("tag-editor-title"),
    tagName: document.getElementById("tag-name"),
    tagType: document.getElementById("tag-type"),
    tagUsage: document.getElementById("tag-usage"),
    tagResetButton: document.getElementById("tag-reset-button"),
    logsList: document.getElementById("logs-list"),
    logsSummary: document.getElementById("logs-summary"),
    systemRules: document.getElementById("system-rules"),
    sidebarDashboardCount: document.getElementById("sidebar-dashboard-count"),
    sidebarModerationCount: document.getElementById("sidebar-moderation-count"),
    sidebarCompaniesCount: document.getElementById("sidebar-companies-count"),
    sidebarUsersCount: document.getElementById("sidebar-users-count"),
    sidebarReportsCount: document.getElementById("sidebar-reports-count"),
    sidebarTagsCount: document.getElementById("sidebar-tags-count"),
    sidebarSummaryCount: document.getElementById("sidebar-summary-count"),
    sidebarSummaryText: document.getElementById("sidebar-summary-text"),
    confirmDialog: document.getElementById("confirm-dialog"),
    confirmDialogTitle: document.getElementById("confirm-dialog-title"),
    confirmDialogText: document.getElementById("confirm-dialog-text"),
  };

  bindEvents();
  hydrateSectionFromUrl();
  initFigmaCapture();

  if (state.forcedMode === "loading") {
    window.setTimeout(() => {
      clearForcedMode();
      render();
    }, 1200);
  }

  render();

  function bindEvents() {
    elements.sectionInputs.forEach((input) => {
      input.addEventListener("change", syncUrlState);
    });

    elements.moderationSearch.addEventListener("input", () => {
      state.moderationQuery = elements.moderationSearch.value.trim().toLowerCase();
      renderModeration();
    });

    elements.companiesSearch.addEventListener("input", () => {
      state.companyQuery = elements.companiesSearch.value.trim().toLowerCase();
      renderCompanies();
    });

    elements.usersSearch.addEventListener("input", () => {
      state.userQuery = elements.usersSearch.value.trim().toLowerCase();
      renderUsers();
    });

    elements.tagsSearch.addEventListener("input", () => {
      state.tagQuery = elements.tagsSearch.value.trim().toLowerCase();
      renderTags();
    });

    bindFilterButtons(elements.moderationStatusButtons, "moderationStatus", renderModeration);
    bindFilterButtons(elements.companyStatusButtons, "companyStatus", renderCompanies);
    bindFilterButtons(elements.userRoleButtons, "userRole", renderUsers);
    bindFilterButtons(elements.reportSortButtons, "reportSort", renderReports);
    bindFilterButtons(elements.tagTypeButtons, "tagType", renderTags);

    elements.moderationRows.addEventListener("click", handleModerationTableClick);
    elements.moderationDetail.addEventListener("click", handleModerationDetailClick);
    elements.moderationDetail.addEventListener("input", handleModerationDetailInput);
    elements.companiesRows.addEventListener("click", handleCompaniesTableClick);
    elements.companyDetail.addEventListener("click", handleCompanyDetailClick);
    elements.usersRows.addEventListener("click", handleUsersTableClick);
    elements.userDetail.addEventListener("click", handleUserDetailClick);
    elements.reportsList.addEventListener("click", handleReportsClick);
    elements.tagsRows.addEventListener("click", handleTagsTableClick);
    elements.tagCreateButton.addEventListener("click", () => {
      state.tagDraft = createEmptyTagDraft();
      renderTags();
    });
    elements.tagResetButton.addEventListener("click", () => {
      state.tagDraft = createEmptyTagDraft();
      renderTags();
    });

    elements.tagForm.addEventListener("submit", handleTagSubmit);
    [elements.tagName, elements.tagType, elements.tagUsage].forEach((field) => {
      field.addEventListener("input", syncTagDraftFromForm);
      field.addEventListener("change", syncTagDraftFromForm);
    });

    elements.confirmDialog.addEventListener("close", () => {
      if (elements.confirmDialog.returnValue === "confirm" && typeof state.pendingConfirm === "function") {
        state.pendingConfirm();
      }

      state.pendingConfirm = null;
    });

    document.body.addEventListener("click", (event) => {
      const retryButton = event.target.closest("[data-action='retry']");
      if (retryButton) {
        clearForcedMode();
        render();
        return;
      }

      const openButton = event.target.closest("[data-open-section]");
      if (!openButton) {
        return;
      }

      openSection(
        openButton.dataset.openSection,
        openButton.dataset.openKind || "",
        openButton.dataset.openId || "",
      );
    });
  }

  function bindFilterButtons(buttons, stateKey, callback) {
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const value = Object.values(button.dataset)[0];
        state[stateKey] = value;
        updateActiveButtons(buttons, button);
        callback();
      });
    });
  }

  function initFigmaCapture() {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const captureId = hash.get("figmacapture");
    const endpoint = hash.get("figmaendpoint");

    if (!captureId || !endpoint || window.__figmaCaptureTriggered) {
      return;
    }

    const delay = Number(hash.get("figmadelay") || "1000");
    const selector = hash.get("figmaselector") || "body";

    const triggerCapture = () => {
      if (!window.figma || typeof window.figma.captureForDesign !== "function") {
        window.setTimeout(triggerCapture, 250);
        return;
      }

      window.__figmaCaptureTriggered = true;
      window.figma.captureForDesign({
        captureId,
        endpoint,
        selector,
      });
    };

    window.setTimeout(triggerCapture, delay);
  }

  function handleModerationTableClick(event) {
    const approveButton = event.target.closest("[data-moderation-action='approve']");
    if (approveButton) {
      applyModerationDecision(approveButton.dataset.id, "approved", "");
      return;
    }

    const rejectButton = event.target.closest("[data-moderation-action='reject']");
    if (rejectButton) {
      state.selectedModerationId = rejectButton.dataset.id;
      state.moderationDecision = "rejected";
      state.moderationComment = "";
      renderModeration();
      return;
    }

    const rowButton = event.target.closest("[data-open-kind='moderation']");
    if (!rowButton) {
      return;
    }

    state.selectedModerationId = rowButton.dataset.openId;
    state.moderationDecision = null;
    state.moderationComment = "";
    renderModeration();
  }

  function handleModerationDetailClick(event) {
    const decisionButton = event.target.closest("[data-moderation-decision]");
    if (decisionButton) {
      state.moderationDecision = decisionButton.dataset.moderationDecision;

      if (state.moderationDecision !== "rejected") {
        state.moderationComment = "";
      }

      renderModerationDetail();
      return;
    }

    const submitButton = event.target.closest("[data-moderation-submit]");
    if (!submitButton) {
      return;
    }

    const item = getItemById(moderationItems, state.selectedModerationId);
    if (!item || !state.moderationDecision) {
      return;
    }

    if (state.moderationDecision === "rejected" && state.moderationComment.trim().length === 0) {
      return;
    }

    applyModerationDecision(item.id, state.moderationDecision, state.moderationComment.trim());
  }

  function handleModerationDetailInput(event) {
    if (event.target.id !== "moderation-comment") {
      return;
    }

    state.moderationComment = event.target.value;
    const submitButton = elements.moderationDetail.querySelector("[data-moderation-submit]");
    if (submitButton) {
      submitButton.disabled = state.moderationComment.trim().length === 0;
    }
  }

  function handleCompaniesTableClick(event) {
    const actionButton = event.target.closest("[data-company-action]");
    if (actionButton) {
      applyCompanyAction(actionButton.dataset.id, actionButton.dataset.companyAction);
      return;
    }

    const rowButton = event.target.closest("[data-open-kind='company']");
    if (!rowButton) {
      return;
    }

    state.selectedCompanyId = rowButton.dataset.openId;
    renderCompanies();
  }

  function handleCompanyDetailClick(event) {
    const actionButton = event.target.closest("[data-company-detail-action]");
    if (!actionButton) {
      return;
    }

    applyCompanyAction(actionButton.dataset.id, actionButton.dataset.companyDetailAction);
  }

  function handleUsersTableClick(event) {
    const actionButton = event.target.closest("[data-user-action]");
    if (actionButton) {
      handleUserAction(actionButton.dataset.id, actionButton.dataset.userAction);
      return;
    }

    const rowButton = event.target.closest("[data-open-kind='user']");
    if (!rowButton) {
      return;
    }

    state.selectedUserId = rowButton.dataset.openId;
    renderUsers();
  }

  function handleUserDetailClick(event) {
    const actionButton = event.target.closest("[data-user-detail-action]");
    if (!actionButton) {
      return;
    }

    handleUserAction(actionButton.dataset.id, actionButton.dataset.userDetailAction);
  }

  function handleReportsClick(event) {
    const actionButton = event.target.closest("[data-report-action]");
    if (!actionButton) {
      return;
    }

    const report = getItemById(reports, actionButton.dataset.id);
    if (!report) {
      return;
    }

    if (actionButton.dataset.reportAction === "ignore") {
      report.status = "ignored";
      logAction("Жалоба проигнорирована", "Куратор закрыл жалобу без дополнительных действий.", "info", "жалобы");
      render();
      return;
    }

    if (actionButton.dataset.reportAction === "remove") {
      openConfirm(
        "Удалить контент",
        `Удалить контент по объекту «${report.object}» и зафиксировать действие в журнале?`,
        () => {
          report.status = "resolved";
          logAction("Контент удалён", `Объект «${report.object}» скрыт по итогам жалоб.`, "warning", "жалобы");
          render();
        },
      );
      return;
    }

    openConfirm(
      "Заблокировать автора",
      `Подтвердить блокировку автора по объекту «${report.object}»?`,
      () => {
        report.status = "blocked";
        logAction("Автор заблокирован", `По жалобе на «${report.object}» применена блокировка автора.`, "warning", "жалобы");
        render();
      },
    );
  }

  function handleTagsTableClick(event) {
    const editButton = event.target.closest("[data-tag-action='edit']");
    if (editButton) {
      const tag = getItemById(tags, editButton.dataset.id);
      if (!tag) {
        return;
      }

      state.tagDraft = {
        id: tag.id,
        name: tag.name,
        type: tag.type,
        usage: String(tag.usage),
      };
      renderTags();
      return;
    }

    const deleteButton = event.target.closest("[data-tag-action='delete']");
    if (!deleteButton) {
      return;
    }

    const tag = getItemById(tags, deleteButton.dataset.id);
    if (!tag) {
      return;
    }

    openConfirm("Удалить тег", `Удалить тег «${tag.name}» из справочника?`, () => {
      const index = tags.findIndex((item) => item.id === tag.id);
      if (index >= 0) {
        tags.splice(index, 1);
      }

      if (state.tagDraft.id === tag.id) {
        state.tagDraft = createEmptyTagDraft();
      }

      logAction("Удалён тег", `Из системного справочника удалён тег «${tag.name}».`, "info", "теги");
      render();
    });
  }

  function handleTagSubmit(event) {
    event.preventDefault();
    syncTagDraftFromForm();

    const usage = Math.max(0, Number(state.tagDraft.usage || 0));
    const payload = {
      name: state.tagDraft.name.trim(),
      type: state.tagDraft.type,
      usage,
    };

    if (!payload.name) {
      return;
    }

    if (state.tagDraft.id) {
      const existing = getItemById(tags, state.tagDraft.id);
      if (existing) {
        existing.name = payload.name;
        existing.type = payload.type;
        existing.usage = payload.usage;
        logAction("Обновлён тег", `Тег «${payload.name}» отредактирован куратором.`, "info", "теги");
      }
    } else {
      tags.unshift({
        id: `tag-${Date.now()}`,
        name: payload.name,
        type: payload.type,
        usage: payload.usage,
      });
      logAction("Создан новый тег", `В системный справочник добавлен тег «${payload.name}».`, "info", "теги");
    }

    state.tagDraft = createEmptyTagDraft();
    render();
  }

  function syncTagDraftFromForm() {
    state.tagDraft = {
      id: state.tagDraft.id,
      name: elements.tagName.value,
      type: elements.tagType.value,
      usage: elements.tagUsage.value,
    };
  }

  function render() {
    renderSidebar();
    renderDashboard();
    renderModeration();
    renderCompanies();
    renderUsers();
    renderReports();
    renderTags();
    renderLogs();
    syncUrlState();
  }

  function renderSidebar() {
    const moderationPending = moderationItems.filter((item) => item.status === "pending").length;
    const companyPending = companies.filter((item) => item.status === "pending" || item.status === "needs-data").length;
    const userFlagged = users.filter((item) => item.status === "blocked" || item.status === "review").length;
    const openReports = reports.filter((item) => item.status === "pending" || item.status === "review").length;

    elements.sidebarDashboardCount.textContent = String(moderationPending + companyPending + openReports);
    elements.sidebarModerationCount.textContent = String(moderationPending);
    elements.sidebarCompaniesCount.textContent = String(companyPending);
    elements.sidebarUsersCount.textContent = String(userFlagged);
    elements.sidebarReportsCount.textContent = String(openReports);
    elements.sidebarTagsCount.textContent = String(tags.length);
    elements.sidebarSummaryCount.textContent = `${moderationPending + companyPending + openReports} задач`;
    elements.sidebarSummaryText.textContent =
      moderationPending > 0
        ? `На очереди ${moderationPending} возможностей, ${companyPending} компании и ${openReports} жалобы.`
        : "Очередь разгружена: в приоритете только точечные проверки и повторные жалобы.";
  }

  function renderDashboard() {
    if (state.forcedMode === "loading") {
      elements.dashboardMetrics.innerHTML = new Array(4).fill(createMetricSkeleton()).join("");
      elements.dashboardQueue.innerHTML = createStackSkeleton(4);
      elements.dashboardActivity.innerHTML = createStackSkeleton(3);
      elements.dashboardFocus.innerHTML = createStackSkeleton(3);
      elements.dashboardQueueCount.textContent = "…";
      return;
    }

    const metrics = getDashboardMetrics();
    elements.dashboardMetrics.innerHTML = metrics.map(createMetricCard).join("");
    elements.dashboardQueueCount.textContent = String(getTaskQueue().length);

    if (state.forcedMode === "error") {
      elements.dashboardQueue.innerHTML = createErrorState("Не удалось загрузить очередь", "Попробуйте повторить запрос к очереди задач.");
      elements.dashboardActivity.innerHTML = createErrorState("Журнал временно недоступен", "Последние действия не загрузились.");
      elements.dashboardFocus.innerHTML = createErrorState("Нет связи с контуром", "Попробуйте повторить запрос к сводке смены.");
      return;
    }

    const queue = getTaskQueue();
    elements.dashboardQueue.innerHTML = queue.length
      ? queue.map(createQueueItem).join("")
      : createEmptyState("Нет задач в очереди", "Все приоритетные проверки закрыты. Можно переключиться к точечным разделам.");

    elements.dashboardActivity.innerHTML = logs.length
      ? logs.slice(0, 4).map(createActivityItem).join("")
      : createEmptyState("Нет последних действий", "Как только в системе появятся новые события, они отобразятся здесь.");

    elements.dashboardFocus.innerHTML = createFocusCards(metrics).join("");
  }

  function renderModeration() {
    const items = getFilteredModeration();
    elements.moderationCountChip.textContent = state.forcedMode === "loading" ? "…" : String(items.length);
    elements.moderationSummary.textContent =
      state.forcedMode === "empty"
        ? "Пустая очередь возможностей."
        : `Показываем ${items.length} записей по текущим фильтрам.`;

    if (state.forcedMode === "loading") {
      elements.moderationRows.innerHTML = createTableSkeleton(5, 6);
      elements.moderationDetail.innerHTML = createDetailSkeleton();
      return;
    }

    if (state.forcedMode === "error") {
      elements.moderationRows.innerHTML = wrapStateRow(createErrorState("Ошибка загрузки", "Не удалось получить список возможностей."), 6);
      elements.moderationDetail.innerHTML = createErrorState("Карточка недоступна", "Детали возможности не загрузились.");
      return;
    }

    if (!items.length) {
      elements.moderationRows.innerHTML = wrapStateRow(createEmptyState("Нет данных", "По текущим фильтрам возможности не найдены."), 6);
      elements.moderationDetail.innerHTML = createEmptyState("Нечего проверять", "Выберите другой статус или снимите поисковый фильтр.");
      return;
    }

    if (!items.some((item) => item.id === state.selectedModerationId)) {
      state.selectedModerationId = items[0].id;
      state.moderationDecision = null;
      state.moderationComment = "";
    }

    elements.moderationRows.innerHTML = items.map(createModerationRow).join("");
    renderModerationDetail();
  }

  function renderModerationDetail() {
    const item = getItemById(moderationItems, state.selectedModerationId);
    if (!item || state.forcedMode === "loading" || state.forcedMode === "error" || state.forcedMode === "empty") {
      return;
    }

    const commentRequired = state.moderationDecision === "rejected";
    const canSubmit =
      Boolean(state.moderationDecision) &&
      (!commentRequired || state.moderationComment.trim().length > 0);

    elements.moderationDetail.innerHTML = `
      <div class="curator-detail-card__shell">
        <div class="curator-detail-card__head">
          <div>
            <span class="tag">Карточка</span>
            <h2>Детальная проверка</h2>
          </div>
          ${createStatusBadge(item.status)}
        </div>

        <section class="curator-detail-block">
          <span class="curator-detail-block__eyebrow">Возможность</span>
          <h3 class="curator-detail-title">${escapeHtml(item.title)}</h3>
          <div class="curator-detail-meta">
            <div><span>Компания</span><strong>${escapeHtml(item.company)}</strong></div>
            <div><span>Формат</span><strong>${escapeHtml(item.format)}</strong></div>
            <div><span>Зарплата</span><strong>${escapeHtml(item.salary)}</strong></div>
            <div><span>Дата</span><strong>${escapeHtml(item.date)}</strong></div>
          </div>
          <p>${escapeHtml(item.description)}</p>
          <div class="curator-chip-list">${item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
        </section>

        <section class="curator-detail-block">
          <span class="curator-detail-block__eyebrow">Медиа</span>
          <div class="curator-media-grid">
            ${item.media.map((label) => `<article class="curator-media-card"><span>${escapeHtml(label)}</span></article>`).join("")}
          </div>
        </section>

        <section class="curator-detail-block">
          <span class="curator-detail-block__eyebrow">Блок модерации</span>
          <div class="curator-detail-actions">
            <button class="button button-secondary ${state.moderationDecision === "approved" ? "is-active" : ""}" type="button" data-moderation-decision="approved">Одобрить</button>
            <button class="button button-secondary ${state.moderationDecision === "rejected" ? "is-active" : ""}" type="button" data-moderation-decision="rejected">Отклонить</button>
            <button class="button button-secondary ${state.moderationDecision === "revision" ? "is-active" : ""}" type="button" data-moderation-decision="revision">На доработку</button>
          </div>
          ${
            state.moderationDecision === "rejected"
              ? `
                <label class="curator-field">
                  <span>Комментарий к отклонению</span>
                  <textarea id="moderation-comment" placeholder="Укажите, что именно нужно исправить, чтобы повторная подача прошла проверку.">${escapeHtml(state.moderationComment)}</textarea>
                </label>
                <p class="curator-helper-text">Комментарий обязателен. Без него отклонение не применяется.</p>
              `
              : state.moderationDecision === "revision"
                ? `<p class="curator-note">Для доработки можно отправить карточку без обязательного комментария, но с фиксацией статуса.</p>`
                : ""
          }
          ${
            item.curatorComment
              ? `<div class="curator-note">Последний комментарий: ${escapeHtml(item.curatorComment)}</div>`
              : ""
          }
          <button class="button button-primary" type="button" data-moderation-submit ${canSubmit ? "" : "disabled"}>Применить решение</button>
        </section>
      </div>
    `;
  }

  function renderCompanies() {
    const items = getFilteredCompanies();
    elements.companiesCountChip.textContent = state.forcedMode === "loading" ? "…" : String(items.length);
    elements.companiesSummary.textContent =
      state.forcedMode === "empty" ? "Нет заявок на проверку компаний." : `Показываем ${items.length} карточек компаний.`;

    if (state.forcedMode === "loading") {
      elements.companiesRows.innerHTML = createTableSkeleton(4, 5);
      elements.companyDetail.innerHTML = createDetailSkeleton();
      return;
    }

    if (state.forcedMode === "error") {
      elements.companiesRows.innerHTML = wrapStateRow(createErrorState("Ошибка загрузки", "Список компаний не ответил."), 5);
      elements.companyDetail.innerHTML = createErrorState("Проверка недоступна", "Детальная карточка компании временно недоступна.");
      return;
    }

    if (!items.length) {
      elements.companiesRows.innerHTML = wrapStateRow(createEmptyState("Нет данных", "Компании по текущему фильтру не найдены."), 5);
      elements.companyDetail.innerHTML = createEmptyState("Нечего проверять", "Снимите фильтры или дождитесь новых заявок.");
      return;
    }

    if (!items.some((item) => item.id === state.selectedCompanyId)) {
      state.selectedCompanyId = items[0].id;
    }

    elements.companiesRows.innerHTML = items.map(createCompanyRow).join("");

    const item = getItemById(companies, state.selectedCompanyId);
    elements.companyDetail.innerHTML = createCompanyDetail(item);
  }

  function renderUsers() {
    const items = getFilteredUsers();
    elements.usersCountChip.textContent = state.forcedMode === "loading" ? "…" : String(items.length);
    elements.usersSummary.textContent =
      state.forcedMode === "empty" ? "Пустой список пользователей." : `Показываем ${items.length} аккаунтов в текущем разрезе.`;

    if (state.forcedMode === "loading") {
      elements.usersRows.innerHTML = createTableSkeleton(5, 5);
      elements.userDetail.innerHTML = createDetailSkeleton();
      return;
    }

    if (state.forcedMode === "error") {
      elements.usersRows.innerHTML = wrapStateRow(createErrorState("Ошибка загрузки", "Не удалось получить список пользователей."), 5);
      elements.userDetail.innerHTML = createErrorState("Профиль недоступен", "Попробуйте повторить запрос позже.");
      return;
    }

    if (!items.length) {
      elements.usersRows.innerHTML = wrapStateRow(createEmptyState("Нет данных", "По выбранной роли нет пользователей."), 5);
      elements.userDetail.innerHTML = createEmptyState("Профиль не выбран", "Выберите пользователя в таблице, чтобы увидеть детали.");
      return;
    }

    if (!items.some((item) => item.id === state.selectedUserId)) {
      state.selectedUserId = items[0].id;
    }

    elements.usersRows.innerHTML = items.map(createUserRow).join("");
    elements.userDetail.innerHTML = createUserDetail(getItemById(users, state.selectedUserId));
  }

  function renderReports() {
    const items = getFilteredReports();
    elements.reportsCountChip.textContent = state.forcedMode === "loading" ? "…" : String(items.length);
    elements.reportsSummary.textContent =
      state.forcedMode === "empty" ? "Нет открытых жалоб." : `Отсортировано ${items.length} карточек жалоб.`;

    if (state.forcedMode === "loading") {
      elements.reportsList.innerHTML = createStackSkeleton(4);
      return;
    }

    if (state.forcedMode === "error") {
      elements.reportsList.innerHTML = createErrorState("Жалобы не загрузились", "Не удалось получить очередь жалоб.");
      return;
    }

    if (!items.length) {
      elements.reportsList.innerHTML = createEmptyState("Нет жалоб", "Сейчас нет активных жалоб в системе.");
      return;
    }

    elements.reportsList.innerHTML = items.map(createReportCard).join("");
  }

  function renderTags() {
    const items = getFilteredTags();
    elements.tagsCountChip.textContent = state.forcedMode === "loading" ? "…" : String(items.length);
    elements.tagsSummary.textContent =
      state.forcedMode === "empty" ? "Справочник тегов пуст." : `Показываем ${items.length} тегов по текущему фильтру.`;

    renderSystemRules();

    if (state.forcedMode === "loading") {
      elements.tagsRows.innerHTML = createTableSkeleton(5, 4);
      renderTagEditor();
      return;
    }

    if (state.forcedMode === "error") {
      elements.tagsRows.innerHTML = wrapStateRow(createErrorState("Ошибка загрузки", "Справочник тегов не ответил."));
      renderTagEditor(true);
      return;
    }

    elements.tagsRows.innerHTML = items.length
      ? items.map(createTagRow).join("")
      : wrapStateRow(createEmptyState("Нет данных", "Теги по выбранной категории не найдены."), 4);

    renderTagEditor();
  }

  function renderTagEditor(isError) {
    elements.tagEditorTitle.textContent = state.tagDraft.id ? "Редактирование тега" : "Новый тег";
    elements.tagName.value = state.tagDraft.name;
    elements.tagType.value = state.tagDraft.type;
    elements.tagUsage.value = state.tagDraft.usage;

    if (isError) {
      elements.systemRules.innerHTML = createErrorState("Система недоступна", "Системные правила не удалось загрузить.");
    }
  }

  function renderSystemRules() {
    elements.systemRules.innerHTML = systemRules
      .map(
        (rule) => `
          <article class="curator-system-rule">
            <span class="curator-system-rule__state">${escapeHtml(rule.state)}</span>
            <strong>${escapeHtml(rule.title)}</strong>
            <p>${escapeHtml(rule.text)}</p>
          </article>
        `,
      )
      .join("");
  }

  function renderLogs() {
    if (state.forcedMode === "loading") {
      elements.logsList.innerHTML = createStackSkeleton(4);
      elements.logsSummary.innerHTML = createStackSkeleton(3);
      return;
    }

    if (state.forcedMode === "error") {
      elements.logsList.innerHTML = createErrorState("Журнал недоступен", "Служебные записи не удалось получить.");
      elements.logsSummary.innerHTML = createErrorState("Контуры недоступны", "Нет ответа от системной сводки.");
      return;
    }

    elements.logsList.innerHTML = logs.length
      ? logs.map(createLogItem).join("")
      : createEmptyState("Нет записей", "Когда появятся новые действия, они отобразятся в журнале.");

    const summaryCards = [
      {
        title: "Модерация",
        text: `${moderationItems.filter((item) => item.status === "pending").length} элементов ожидают решения.`,
        badge: "В норме",
      },
      {
        title: "Компании",
        text: `${companies.filter((item) => item.status === "pending" || item.status === "needs-data").length} компаний в проверке.`,
        badge: "Под контролем",
      },
      {
        title: "Жалобы",
        text: `${reports.filter((item) => item.status === "pending" || item.status === "review").length} активных карточек требуют внимания.`,
        badge: "Приоритет",
      },
    ];

    elements.logsSummary.innerHTML = summaryCards
      .map(
        (item) => `
          <article class="curator-status-card">
            <span class="status-badge status-badge--pending">${escapeHtml(item.badge)}</span>
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.text)}</p>
          </article>
        `,
      )
      .join("");
  }

  function getDashboardMetrics() {
    if (state.forcedMode === "empty") {
      return [
        { label: "Возможности на проверке", value: 0, note: "Очередь пуста", icon: "tasks" },
        { label: "Компании на верификации", value: 0, note: "Новых заявок нет", icon: "company" },
        { label: "Жалобы", value: 0, note: "Нет активных кейсов", icon: "reports" },
        { label: "Активные пользователи", value: 0, note: "Нет активности", icon: "users" },
      ];
    }

    return [
      {
        label: "Возможности на проверке",
        value: moderationItems.filter((item) => item.status === "pending").length,
        note: "В очереди приоритетные вакансии и стажировки",
        icon: "tasks",
      },
      {
        label: "Компании на верификации",
        value: companies.filter((item) => item.status === "pending" || item.status === "needs-data").length,
        note: "Проверяем сайт, домен и документы",
        icon: "company",
      },
      {
        label: "Жалобы",
        value: reports.filter((item) => item.status === "pending" || item.status === "review").length,
        note: "Жалобы сгруппированы по объектам",
        icon: "reports",
      },
      {
        label: "Активные пользователи",
        value: users.filter((item) => item.status === "active").length,
        note: "Онлайн и готовые к взаимодействию профили",
        icon: "users",
      },
    ];
  }

  function getTaskQueue() {
    if (state.forcedMode === "empty") {
      return [];
    }

    const queue = [];

    moderationItems
      .filter((item) => item.status === "pending" || item.status === "revision")
      .forEach((item) => {
        queue.push({
          section: "moderation",
          kind: "moderation",
          id: item.id,
          type: TYPE_LABELS[item.type],
          title: item.title,
          description: `${item.company} · ${item.priority} приоритет`,
          date: item.date,
        });
      });

    companies
      .filter((item) => item.status === "pending" || item.status === "needs-data")
      .forEach((item) => {
        queue.push({
          section: "companies",
          kind: "company",
          id: item.id,
          type: "Компания",
          title: item.name,
          description: item.status === "needs-data" ? "Нужно запросить недостающие данные" : "Требуется верификация компании",
          date: item.date,
        });
      });

    reports
      .filter((item) => item.status === "pending" || item.status === "review")
      .forEach((item) => {
        queue.push({
          section: "reports",
          kind: "report",
          id: item.id,
          type: "Жалоба",
          title: item.object,
          description: `${item.reason} · ${item.count} жалоб`,
          date: item.date,
        });
      });

    return queue.sort((a, b) => {
      if (a.type === "Жалоба" && b.type !== "Жалоба") {
        return -1;
      }

      if (a.type !== "Жалоба" && b.type === "Жалоба") {
        return 1;
      }

      return 0;
    });
  }

  function getFilteredModeration() {
    if (state.forcedMode === "empty") {
      return [];
    }

    return moderationItems.filter((item) => {
      const matchesStatus = state.moderationStatus === "all" ? true : item.status === state.moderationStatus;
      const haystack = `${item.title} ${item.company} ${item.tags.join(" ")}`.toLowerCase();
      const matchesQuery = state.moderationQuery ? haystack.includes(state.moderationQuery) : true;
      return matchesStatus && matchesQuery;
    });
  }

  function getFilteredCompanies() {
    if (state.forcedMode === "empty") {
      return [];
    }

    return companies.filter((item) => {
      const matchesStatus = state.companyStatus === "all" ? true : item.status === state.companyStatus;
      const haystack = `${item.name} ${item.site} ${item.email}`.toLowerCase();
      const matchesQuery = state.companyQuery ? haystack.includes(state.companyQuery) : true;
      return matchesStatus && matchesQuery;
    });
  }

  function getFilteredUsers() {
    if (state.forcedMode === "empty") {
      return [];
    }

    return users.filter((item) => {
      const matchesRole = state.userRole === "all" ? true : item.role === state.userRole;
      const haystack = `${item.name} ${item.team} ${ROLE_LABELS[item.role]}`.toLowerCase();
      const matchesQuery = state.userQuery ? haystack.includes(state.userQuery) : true;
      return matchesRole && matchesQuery;
    });
  }

  function getFilteredReports() {
    if (state.forcedMode === "empty") {
      return [];
    }

    const items = reports.slice();
    items.sort((left, right) => {
      if (state.reportSort === "date") {
        return right.date.localeCompare(left.date);
      }

      return right.count - left.count;
    });
    return items;
  }

  function getFilteredTags() {
    if (state.forcedMode === "empty") {
      return [];
    }

    return tags.filter((item) => {
      const matchesType = state.tagType === "all" ? true : item.type === state.tagType;
      const haystack = `${item.name} ${TAG_LABELS[item.type]}`.toLowerCase();
      const matchesQuery = state.tagQuery ? haystack.includes(state.tagQuery) : true;
      return matchesType && matchesQuery;
    });
  }

  function createMetricCard(metric) {
    return `
      <article class="card curator-metric-card">
        <div class="curator-metric-card__top">
          <div class="curator-metric-card__icon" aria-hidden="true">${createIcon(metric.icon)}</div>
          <strong>${metric.value}</strong>
        </div>
        <span>${escapeHtml(metric.label)}</span>
        <p>${escapeHtml(metric.note)}</p>
      </article>
    `;
  }

  function createQueueItem(item) {
    return `
      <article class="curator-queue-item">
        <div class="curator-queue-item__top">
          <span class="curator-queue-item__type">${escapeHtml(item.type)}</span>
          <span class="curator-log-item__date">${escapeHtml(item.date)}</span>
        </div>
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.description)}</p>
        <div class="curator-inline-actions">
          <button class="button button-primary curator-inline-button" type="button" data-open-section="${item.section}" data-open-kind="${item.kind}" data-open-id="${item.id}">Перейти</button>
        </div>
      </article>
    `;
  }

  function createActivityItem(item) {
    return `
      <article class="curator-activity-item">
        <div class="curator-activity-item__top">
          <span class="curator-activity-item__type">${escapeHtml(item.type)}</span>
          <span class="curator-log-item__date">${escapeHtml(item.date)}</span>
        </div>
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.text)}</p>
      </article>
    `;
  }

  function createFocusCards(metrics) {
    return metrics.slice(0, 3).map(
      (metric) => `
        <article class="curator-focus-item">
          <strong>${escapeHtml(metric.label)}</strong>
          <p>${escapeHtml(metric.note)}</p>
          <span class="${metric.value > 0 ? "status-badge status-badge--pending" : "status-badge status-badge--muted"}">${metric.value > 0 ? `${metric.value} в работе` : "Пусто"}</span>
        </article>
      `,
    );
  }

  function createModerationRow(item) {
    return `
      <tr class="${item.id === state.selectedModerationId ? "is-selected" : ""}">
        <td>
          <button class="curator-row-button" type="button" data-open-section="moderation" data-open-kind="moderation" data-open-id="${item.id}">${escapeHtml(item.title)}</button>
          <div class="curator-row-meta">${escapeHtml(item.priority)} приоритет · ${escapeHtml(item.format)}</div>
        </td>
        <td>${escapeHtml(item.company)}</td>
        <td><span class="chip">${escapeHtml(TYPE_LABELS[item.type])}</span></td>
        <td>${escapeHtml(item.date)}</td>
        <td>${createStatusBadge(item.status)}</td>
        <td>
          <div class="curator-inline-actions">
            <button class="button button-primary curator-inline-button" type="button" data-moderation-action="approve" data-id="${item.id}" ${item.status === "approved" ? "disabled" : ""}>Одобрить</button>
            <button class="button button-secondary curator-inline-button" type="button" data-moderation-action="reject" data-id="${item.id}">Отклонить</button>
          </div>
        </td>
      </tr>
    `;
  }

  function createCompanyRow(item) {
    return `
      <tr class="${item.id === state.selectedCompanyId ? "is-selected" : ""}">
        <td>
          <button class="curator-row-button" type="button" data-open-section="companies" data-open-kind="company" data-open-id="${item.id}">${escapeHtml(item.name)}</button>
          <div class="curator-row-meta">${escapeHtml(item.email)}</div>
        </td>
        <td>${createStatusBadge(item.status)}</td>
        <td>${escapeHtml(item.date)}</td>
        <td><a href="${escapeHtml(item.site)}">${escapeHtml(item.site.replace("https://", ""))}</a></td>
        <td>
          <div class="curator-inline-actions">
            <button class="button button-primary curator-inline-button" type="button" data-company-action="verify" data-id="${item.id}" ${item.status === "verified" ? "disabled" : ""}>Подтвердить</button>
            <button class="button button-secondary curator-inline-button" type="button" data-company-action="request" data-id="${item.id}">Запросить данные</button>
          </div>
        </td>
      </tr>
    `;
  }

  function createCompanyDetail(item) {
    return `
      <div class="curator-detail-card__shell">
        <div class="curator-detail-card__head">
          <div>
            <span class="tag">Компания</span>
            <h2>Карточка проверки</h2>
          </div>
          ${createStatusBadge(item.status)}
        </div>

        <section class="curator-detail-block">
          <h3 class="curator-detail-title">${escapeHtml(item.name)}</h3>
          <p>${escapeHtml(item.description)}</p>
          <div class="curator-detail-meta">
            <div><span>Сайт</span><a href="${escapeHtml(item.site)}">${escapeHtml(item.site)}</a></div>
            <div><span>Email</span><strong>${escapeHtml(item.email)}</strong></div>
            <div><span>Соцсети</span><strong>${item.socials.length ? escapeHtml(item.socials.join(", ")) : "Нет"}</strong></div>
            <div><span>Документы</span><strong>${item.documents.length ? escapeHtml(item.documents.join(", ")) : "Не приложены"}</strong></div>
          </div>
        </section>

        <section class="curator-detail-block">
          <span class="curator-detail-block__eyebrow">Проверка данных</span>
          <div class="curator-check-list">
            ${createCheckItem("Есть сайт", item.siteExists)}
            ${createCheckItem("Совпадает домен", item.domainMatch)}
            ${createCheckItem("Есть соцсети", item.socialsExists)}
          </div>
        </section>

        <section class="curator-detail-block">
          <span class="curator-detail-block__eyebrow">Действия</span>
          <div class="curator-detail-actions">
            <button class="button button-primary" type="button" data-company-detail-action="verify" data-id="${item.id}" ${item.status === "verified" ? "disabled" : ""}>Подтвердить</button>
            <button class="button button-secondary" type="button" data-company-detail-action="request" data-id="${item.id}">Запросить данные</button>
            <button class="button button-secondary" type="button" data-company-detail-action="reject" data-id="${item.id}">Отклонить</button>
          </div>
        </section>
      </div>
    `;
  }

  function createUserRow(item) {
    return `
      <tr class="${item.id === state.selectedUserId ? "is-selected" : ""}">
        <td>
          <button class="curator-row-button" type="button" data-open-section="users" data-open-kind="user" data-open-id="${item.id}">${escapeHtml(item.name)}</button>
          <div class="curator-row-meta">${escapeHtml(item.team)}</div>
        </td>
        <td><span class="chip">${escapeHtml(ROLE_LABELS[item.role])}</span></td>
        <td>${createStatusBadge(item.status)}</td>
        <td>${escapeHtml(item.date)}</td>
        <td>
          <div class="curator-inline-actions">
            <button class="button button-secondary curator-inline-button" type="button" data-user-action="view" data-id="${item.id}">Просмотр</button>
            <button class="button button-secondary curator-inline-button" type="button" data-user-action="block" data-id="${item.id}" ${item.status === "blocked" ? "disabled" : ""}>Блокировка</button>
            <button class="button button-secondary curator-inline-button" type="button" data-user-action="delete" data-id="${item.id}" ${item.status === "deleted" ? "disabled" : ""}>Удаление</button>
          </div>
        </td>
      </tr>
    `;
  }

  function createUserDetail(item) {
    return `
      <div class="curator-detail-card__shell">
        <div class="curator-detail-card__head">
          <div>
            <span class="tag">Профиль</span>
            <h2>Детали пользователя</h2>
          </div>
          ${createStatusBadge(item.status)}
        </div>

        <section class="curator-detail-block">
          <h3 class="curator-detail-title">${escapeHtml(item.name)}</h3>
          <div class="curator-detail-meta">
            <div><span>Роль</span><strong>${escapeHtml(ROLE_LABELS[item.role])}</strong></div>
            <div><span>Команда / вуз</span><strong>${escapeHtml(item.team)}</strong></div>
            <div><span>Последний вход</span><strong>${escapeHtml(item.lastSeen)}</strong></div>
            <div><span>Дата</span><strong>${escapeHtml(item.date)}</strong></div>
          </div>
          <p>${escapeHtml(item.summary)}</p>
        </section>

        <section class="curator-detail-block">
          <span class="curator-detail-block__eyebrow">Действия</span>
          <div class="curator-detail-actions">
            <button class="button button-secondary" type="button" data-user-detail-action="view" data-id="${item.id}">Открыть</button>
            <button class="button button-secondary" type="button" data-user-detail-action="block" data-id="${item.id}" ${item.status === "blocked" ? "disabled" : ""}>Блокировка</button>
            <button class="button button-secondary" type="button" data-user-detail-action="delete" data-id="${item.id}" ${item.status === "deleted" ? "disabled" : ""}>Удаление</button>
          </div>
        </section>
      </div>
    `;
  }

  function createReportCard(item) {
    return `
      <article class="card curator-report-card">
        <div class="curator-report-card__top">
          <div>
            <span class="tag tag-warm">Жалоба</span>
            <h2>${escapeHtml(item.object)}</h2>
          </div>
          <div class="curator-report-card__count">${item.count}</div>
        </div>
        <div class="curator-report-card__meta">
          <span class="chip">${escapeHtml(item.reason)}</span>
          <span class="chip">${escapeHtml(item.date)}</span>
          ${createStatusBadge(item.status)}
        </div>
        <p>${escapeHtml(item.summary)}</p>
        <div class="curator-report-card__actions">
          <button class="button button-secondary" type="button" data-report-action="ignore" data-id="${item.id}">Игнорировать</button>
          <button class="button button-secondary" type="button" data-report-action="remove" data-id="${item.id}">Удалить контент</button>
          <button class="button button-primary" type="button" data-report-action="block" data-id="${item.id}">Заблокировать</button>
        </div>
      </article>
    `;
  }

  function createTagRow(item) {
    return `
      <tr>
        <td><strong>${escapeHtml(item.name)}</strong></td>
        <td><span class="chip">${escapeHtml(TAG_LABELS[item.type])}</span></td>
        <td>${item.usage}</td>
        <td>
          <div class="curator-inline-actions">
            <button class="button button-secondary curator-inline-button" type="button" data-tag-action="edit" data-id="${item.id}">Редактировать</button>
            <button class="button button-secondary curator-inline-button" type="button" data-tag-action="delete" data-id="${item.id}">Удалить</button>
          </div>
        </td>
      </tr>
    `;
  }

  function createLogItem(item) {
    return `
      <article class="curator-log-item ${item.level === "warning" ? "is-warning" : item.level === "error" ? "is-error" : ""}">
        <div class="curator-log-item__top">
          <span class="curator-log-item__type">${escapeHtml(item.type)}</span>
          <span class="curator-log-item__date">${escapeHtml(item.date)}</span>
        </div>
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.text)}</p>
      </article>
    `;
  }

  function createCheckItem(label, passed) {
    return `
      <article class="curator-check-item">
        <div class="curator-check-item__top">
          <strong>${escapeHtml(label)}</strong>
          <span class="curator-check-item__state ${passed ? "is-yes" : "is-no"}">${passed ? "Да" : "Нет"}</span>
        </div>
      </article>
    `;
  }

  function createStatusBadge(status) {
    const labelMap = {
      pending: "На проверке",
      approved: "Одобрено",
      rejected: "Отклонено",
      revision: "Доработка",
      verified: "Подтверждена",
      needsData: "Нужны данные",
      needsdata: "Нужны данные",
      "needs-data": "Нужны данные",
      active: "Активен",
      blocked: "Заблокирован",
      review: "На контроле",
      deleted: "Удалён",
      ignored: "Игнор",
      resolved: "Решено",
    };

    const classMap = {
      pending: "pending",
      approved: "approved",
      rejected: "rejected",
      revision: "revision",
      verified: "verified",
      "needs-data": "needs-data",
      active: "active",
      blocked: "blocked",
      review: "review",
      deleted: "deleted",
      ignored: "ignored",
      resolved: "resolved",
    };

    const normalized = String(status);
    const css = classMap[normalized] || "muted";
    const label = labelMap[normalized] || normalized;
    return `<span class="status-badge status-badge--${css}">${escapeHtml(label)}</span>`;
  }

  function createMetricSkeleton() {
    return `
      <article class="curator-skeleton-metric">
        <div class="curator-skeleton-lines">
          <span class="curator-skeleton-line curator-skeleton-line--short"></span>
          <span class="curator-skeleton-line curator-skeleton-line--medium"></span>
          <span class="curator-skeleton-line curator-skeleton-line--long"></span>
        </div>
      </article>
    `;
  }

  function createStackSkeleton(length) {
    return `<div class="curator-skeleton-stack">${new Array(length).fill('<article class="curator-skeleton-card"></article>').join("")}</div>`;
  }

  function createTableSkeleton(rows, columns) {
    return new Array(rows)
      .fill("")
      .map(
        () => `
          <tr>
            <td colspan="${columns}">
              <article class="curator-skeleton-row"></article>
            </td>
          </tr>
        `,
      )
      .join("");
  }

  function createDetailSkeleton() {
    return `<div class="curator-loading-state"><strong>Загружаем карточку</strong><p>Подтягиваем поля и действия для выбранной записи.</p></div>`;
  }

  function createEmptyState(title, text) {
    return `
      <div class="curator-empty-state">
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(text)}</p>
      </div>
    `;
  }

  function createErrorState(title, text) {
    return `
      <div class="curator-error-state">
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(text)}</p>
        <button class="button button-primary" type="button" data-action="retry">Повторить</button>
      </div>
    `;
  }

  function wrapStateRow(content, columns) {
    return `<tr><td colspan="${columns}">${content}</td></tr>`;
  }

  function createIcon(kind) {
    const icons = {
      tasks: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M4 12h10M4 17h7M18 12l2 2 4-4" /></svg>',
      company: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 20h16M6 20V8l6-3 6 3v12M9 12h1m4 0h1m-6 4h1m4 0h1" /></svg>',
      reports: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 4h11l-1 6 1 6H6v4H4V4h2Zm2 2v8h6.6l-.7-4 .7-4H8Z" /></svg>',
      users: '<svg viewBox="0 0 24 24" fill="none"><path d="M16 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM8 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.3 0-6 1.8-6 4v1h12v-1c0-2.2-2.7-4-6-4Zm8 0c-.6 0-1.2.1-1.8.3 1.1.8 1.8 1.9 1.8 3.2V20h6v-1c0-2.2-2.7-4-6-4Z" /></svg>',
    };

    return icons[kind] || icons.tasks;
  }

  function handleUserAction(id, action) {
    const user = getItemById(users, id);
    if (!user) {
      return;
    }

    if (action === "view") {
      state.selectedUserId = id;
      renderUsers();
      return;
    }

    if (action === "block") {
      openConfirm("Заблокировать пользователя", `Подтвердить блокировку пользователя «${user.name}»?`, () => {
        user.status = "blocked";
        state.selectedUserId = user.id;
        logAction("Пользователь заблокирован", `Для пользователя «${user.name}» применена блокировка.`, "warning", "пользователь");
        render();
      });
      return;
    }

    openConfirm("Удалить пользователя", `Удалить пользователя «${user.name}» из системы?`, () => {
      user.status = "deleted";
      state.selectedUserId = user.id;
      logAction("Пользователь удалён", `Аккаунт «${user.name}» удалён из рабочей базы.`, "warning", "пользователь");
      render();
    });
  }

  function applyCompanyAction(id, action) {
    const company = getItemById(companies, id);
    if (!company) {
      return;
    }

    if (action === "verify") {
      company.status = "verified";
      logAction("Компания подтверждена", `Компания «${company.name}» успешно прошла верификацию.`, "info", "компания");
      render();
      return;
    }

    if (action === "request") {
      company.status = "needs-data";
      logAction("Запрошены данные компании", `По компании «${company.name}» отправлен запрос на доп. данные.`, "warning", "компания");
      render();
      return;
    }

    openConfirm("Отклонить компанию", `Отклонить заявку компании «${company.name}»?`, () => {
      company.status = "rejected";
      logAction("Компания отклонена", `Заявка «${company.name}» отклонена после проверки.`, "warning", "компания");
      render();
    });
  }

  function applyModerationDecision(id, decision, comment) {
    const item = getItemById(moderationItems, id);
    if (!item) {
      return;
    }

    item.status = decision;
    item.curatorComment = comment;
    state.selectedModerationId = item.id;
    state.moderationDecision = null;
    state.moderationComment = "";

    const actionLabel = {
      approved: "возможность одобрена",
      rejected: "возможность отклонена",
      revision: "возможность отправлена на доработку",
    };

    logAction(
      "Решение по модерации",
      `Для «${item.title}» ${actionLabel[decision] || "обновлён статус"}.`,
      decision === "approved" ? "info" : "warning",
      "модерация",
    );
    render();
  }

  function openConfirm(title, text, onConfirm) {
    elements.confirmDialogTitle.textContent = title;
    elements.confirmDialogText.textContent = text;
    state.pendingConfirm = onConfirm;
    elements.confirmDialog.showModal();
  }

  function openSection(section, kind, id) {
    const inputId = allowedSections[section];
    if (!inputId) {
      return;
    }

    const input = document.getElementById(inputId);
    if (input) {
      input.checked = true;
    }

    if (kind === "moderation") {
      state.selectedModerationId = id;
      state.moderationDecision = null;
      state.moderationComment = "";
    } else if (kind === "company") {
      state.selectedCompanyId = id;
    } else if (kind === "user") {
      state.selectedUserId = id;
    }

    syncUrlState();
    render();
  }

  function hydrateSectionFromUrl() {
    const section = params.get("section");
    if (!section || !allowedSections[section]) {
      return;
    }

    const input = document.getElementById(allowedSections[section]);
    if (input) {
      input.checked = true;
    }
  }

  function syncUrlState() {
    const query = new URLSearchParams(window.location.search);
    const activeSection = getActiveSection();
    query.set("section", activeSection);

    if (state.forcedMode) {
      query.set("state", state.forcedMode);
    } else {
      query.delete("state");
    }

    history.replaceState(null, "", `${window.location.pathname}?${query.toString()}`);
  }

  function clearForcedMode() {
    state.forcedMode = null;
  }

  function updateActiveButtons(buttons, activeButton) {
    buttons.forEach((button) => {
      button.classList.toggle("is-active", button === activeButton);
    });
  }

  function getActiveSection() {
    const entry = Object.entries(allowedSections).find(([, inputId]) => {
      const input = document.getElementById(inputId);
      return input && input.checked;
    });

    return entry ? entry[0] : "dashboard";
  }

  function getItemById(items, id) {
    return items.find((item) => item.id === id) || null;
  }

  function createEmptyTagDraft() {
    return {
      id: null,
      name: "",
      type: "skill",
      usage: "0",
    };
  }

  function logAction(title, text, level, type) {
    logs.unshift({
      id: `log-${Date.now()}`,
      title,
      text,
      date: "сейчас",
      level,
      type,
    });

    if (logs.length > 12) {
      logs.length = 12;
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
})();
