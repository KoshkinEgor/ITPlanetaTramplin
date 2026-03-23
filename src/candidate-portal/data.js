export const CANDIDATE_PAGE_ROUTES = {
  overview: "./candidate-profile.html",
  resume: "./candidate-resume.html",
  resumeEditor: "./candidate-resume-editor.html",
  projects: "./candidate-projects.html",
  projectEditor: "./candidate-project-editor.html",
  responses: "./candidate-responses.html",
  contacts: "./candidate-contacts.html",
  settings: "./candidate-settings.html",
};

export const CANDIDATE_SIDEBAR_ITEMS = [
  { key: "overview", label: "Профиль", href: CANDIDATE_PAGE_ROUTES.overview },
  { key: "portfolio", label: "Портфолио / Резюме", href: CANDIDATE_PAGE_ROUTES.resume },
  { key: "responses", label: "Мои отклики", href: CANDIDATE_PAGE_ROUTES.responses },
  { key: "contacts", label: "Контакты", href: CANDIDATE_PAGE_ROUTES.contacts },
  { key: "settings", label: "Настройки профиля", href: CANDIDATE_PAGE_ROUTES.settings },
];

export const CANDIDATE_PORTFOLIO_TABS = [
  { value: "resume", label: "Резюме", href: CANDIDATE_PAGE_ROUTES.resume },
  { value: "projects", label: "Портфолио", href: CANDIDATE_PAGE_ROUTES.projects },
];

export const CANDIDATE_PROFILE = {
  initials: "АК",
  name: "Анна Ковалёва",
  meta: "МГТУ им. Баумана · Москва · 4 курс · Выпуск 2027",
  description:
    "Аналитик и начинающий product-minded специалист: люблю разбирать данные, проектировать пользовательские сценарии и собирать понятные интерфейсы для роста.",
  skills: ["SQL", "Python", "Research", "UX", "Figma", "Презентации"],
  onlineLabel: "Онлайн",
  completion: 70,
};

export const CANDIDATE_STATS = [
  { value: "12", label: "Отклики" },
  { value: "4", label: "Проекты" },
  { value: "19", label: "Контакты" },
];

export const OVERVIEW_OPPORTUNITIES = [
  {
    type: "Вакансия",
    status: "Подходит вам на 85%",
    statusTone: "success",
    title: "Junior UX Analyst",
    company: "ООО Компани · Москва + онлайн",
    accent: "от 90 000 ₽",
    chips: ["Junior", "Figma", "UX"],
  },
  {
    type: "Мероприятие",
    status: "Завершено",
    statusTone: "warning",
    title: "IT - Планета",
    company: "IT - Планета · Москва + онлайн",
    accent: "155 регистраций",
    chips: ["Junior", "Мероприятие", "Студенты"],
  },
  {
    type: "Internship",
    status: "New",
    statusTone: "success",
    title: "Product Research Intern",
    company: "Sber · Moscow + hybrid",
    accent: "from 75 000 RUB",
    chips: ["Research", "SQL", "Junior"],
  },
  {
    type: "Vacancy",
    status: "Popular",
    statusTone: "violet",
    title: "Junior Product Analyst",
    company: "VK Tech · Saint Petersburg + remote",
    accent: "from 110 000 RUB",
    chips: ["Analytics", "Python", "A/B"],
  },
  {
    type: "Event",
    status: "Recommended",
    statusTone: "warning",
    title: "Design Systems Meetup",
    company: "TRAMPLIN Community · Moscow + online",
    accent: "48 seats",
    chips: ["UX", "Figma", "Networking"],
  },
];

export const RECOMMENDED_CONTACTS = [
  {
    id: "contact-maria",
    initials: "МС",
    name: "Мария Соколова",
    summary: "3 общих навыка: SQL, UX, Research",
    tags: ["SQL", "UX", "Research"],
  },
  {
    id: "contact-ilya",
    initials: "ИД",
    name: "Илья Демин",
    summary: "Работает в компании из ваших рекомендаций",
    tags: ["Product", "Analytics"],
  },
];

export const RECENT_ACTIONS = [
  "Просмотрена вакансия Junior Product Analyst",
  "Отклик отправлен на Летнюю школу SOC",
  "Добавлен контакт Мария Соколова",
];

export const RESUME_CARD = {
  typeLabel: "Портфолио",
  title: "Мое резюме",
  description: "Собери свой портфолио и резюме для точных рекомендаций.",
  record: {
    title: "Веб-дизайнер",
    updatedAt: "Последнее редактирование: 12.03.2026",
    tags: ["Чебоксары", "Опыт: 1 год"],
    statsLabel: "Статистика за неделю",
    stats: [
      { label: "Показы", value: "0" },
      { label: "Просмотры", value: "0" },
      { label: "Приглашения", value: "0" },
    ],
  },
};

export const PROJECT_ITEMS = [
  {
    id: "project-onboarding-1",
    type: "Проект",
    status: "Обновлено 12 марта 2026",
    statusTone: "success",
    title: "Исследование onboarding-сценария",
    description: "Провела интервью, собрала CJM и предложила улучшения onboarding-flow для учебного сервиса.",
    role: "Роль в проекте: исследователь и фасилитатор команды",
    chips: ["Research", "FigJam", "Презентация"],
  },
  {
    id: "project-onboarding-2",
    type: "Проект",
    status: "Обновлено 12 марта 2026",
    statusTone: "success",
    title: "Исследование onboarding-сценария",
    description: "Провела интервью, собрала CJM и предложила улучшения onboarding-flow для учебного сервиса.",
    role: "Роль в проекте: исследователь и фасилитатор команды",
    chips: ["Research", "FigJam", "Презентация"],
  },
];

export const RESPONSE_FILTERS = ["Все", "Принятые", "Приглашение", "Собеседование", "Ожидание", "Отказ", "Удаленные", "Архив"];

export const RESPONSE_ITEMS = [
  {
    id: "response-security",
    type: "Вакансия",
    statusKey: "sent",
    statusLabel: "Отправлено",
    title: "Junior Security Analyst",
    company: "ООО Компани · Москва + онлайн",
    details: ["Дата отправления заявки: 12 марта 2026"],
    description: "Ваша заявка отправлена, ожидайте ответа от компании.",
    actions: [
      { label: "Отменить отклик", variant: "secondary" },
      { label: "Подробнее", variant: "primary" },
    ],
  },
  {
    id: "response-soc",
    type: "Стажировка",
    statusKey: "invited",
    statusLabel: "Приглашение",
    title: "Летняя школа SOC",
    company: "ООО Компани · Москва + онлайн",
    details: ["Старт: 1 июня 2026", "Дата отправления заявки: 12 марта 2026"],
    description: "Поздравляем! Ваша заявка была принята. Подтвердите ваше участие.",
    actions: [
      { label: "Подтвердить участие", variant: "primary" },
      { label: "Подробнее", variant: "secondary" },
    ],
  },
];

export const CONTACT_ITEMS = [
  {
    id: "contact-grid-1",
    initials: "МС",
    name: "Илья Демин",
    summary: "3 общих навыка: SQL, UX, Research",
    tags: ["SQL", "Python", "Research", "UX", "+2"],
  },
  {
    id: "contact-grid-2",
    initials: "МС",
    name: "Илья Демин",
    summary: "3 общих навыка: SQL, UX, Research",
    tags: ["SQL", "Python", "Research", "UX", "+2"],
  },
  {
    id: "contact-grid-3",
    initials: "МС",
    name: "Мария Соколова",
    summary: "3 общих навыка: SQL, UX, Research",
    tags: ["SQL", "Python", "Research", "UX", "+2"],
  },
  {
    id: "contact-grid-4",
    initials: "МС",
    name: "Мария Соколова",
    summary: "3 общих навыка: SQL, UX, Research",
    tags: ["SQL", "Python", "Research", "UX", "+2"],
  },
];

export const SETTINGS_CREDENTIAL_SECTIONS = [
  {
    id: "profile-security",
    eyebrow: "Профиль",
    title: "Почта и пароль",
    email: "it-planeta@tramplin.ru",
    password: "••••••••••••",
    lastLogins: [
      "XiaoMi M2007J20CG · Самара · 12.03.2026 / 17:00",
      "XiaoMi M2007J20CG · Чебоксары · 11.03.2026 / 14:42",
    ],
  },
  {
    id: "profile-safety",
    eyebrow: "Безопасность",
    title: "Почта и пароль",
    email: "it-planeta@tramplin.ru",
    password: "••••••••••••",
    lastLogins: [
      "XiaoMi M2007J20CG · Самара · 12.03.2026 / 17:00",
      "XiaoMi M2007J20CG · Чебоксары · 11.03.2026 / 14:42",
    ],
  },
];

export const SETTINGS_VISIBILITY_PANELS = [
  {
    id: "visibility-data",
    eyebrow: "Публичность",
    title: "Видимость данных",
    rows: [
      { label: "Видимость резюме", value: "Только друзья" },
      { label: "Видимость проектов", value: "Все авторизованные" },
      { label: "Видимость навыков", value: "Все авторизованные" },
    ],
  },
  {
    id: "visibility-profile",
    eyebrow: "Приватность",
    title: "Видимость профиля",
    rows: [
      { label: "Кто может писать", value: "Только друзья и работодатели" },
      { label: "Кто может приглашать", value: "Работодатели и друзья" },
      { label: "Видимость навыков", value: "Все авторизованные" },
    ],
  },
  {
    id: "visibility-notifications",
    eyebrow: "Уведомления",
    title: "Уведомления",
    rows: [
      { label: "Кто может писать", value: "Только друзья" },
      { label: "Видимость проектов", value: "Все авторизованные" },
      { label: "Видимость навыков", value: "Все авторизованные" },
    ],
  },
];

export const SETTINGS_OVERVIEW_SECTIONS = [
  {
    id: "settings-profile",
    eyebrow: "Профиль",
    title: "Личные данные",
    status: "Последние изменения 12 марта 2026",
    statusTone: "success",
    summary: "Имя, фотография профиля, вуз, город и краткая информация о себе.",
    actionLabel: "Редактировать",
  },
  {
    id: "settings-security",
    eyebrow: "Безопасность",
    title: "Почта и пароль",
    status: "Проверено 12 марта 2026",
    statusTone: "success",
    summary: "Почта, телефон, смена пароля и история последних входов в аккаунт.",
    actionLabel: "Редактировать",
  },
  {
    id: "settings-privacy",
    eyebrow: "Приватность",
    title: "Настройки приватности",
    status: "Обновлено 12 марта 2026",
    statusTone: "success",
    summary: "Видимость профиля, настройки контактов и уведомления платформы.",
    actionLabel: "Редактировать",
  },
];

export const RESUME_EDITOR = {
  title: "Мое резюме",
  completion: 80,
  summary: {
    title: "Веб-дизайнер",
    updatedAt: "Последнее редактирование: 12.03.2026",
    salary: "Ожидаемый уровень дохода: 30 000 ₽ на руки",
    employment: "Тип занятости: Постоянная работа",
    format: "Формат работы: На месте работодателя, удаленно, гибрид",
    travel: "Командировки: Не могу",
  },
  additions: ["Электронная почта", "Фото профиля", "О себе", "Опыт работы"],
  visibility: "Видно работодателям",
  visibilityOptions: ["Не видно никому", "Видно работодателям"],
  status: "Не ищу работу",
  statusOptions: ["Не ищу работу", "Рассматриваю предложения", "Активно ищу работу"],
  contacts: [
    { id: "phone", label: "Мобильный телефон", value: "+ 7 927 856 23 32" },
    { id: "email", label: "Электронная почта", value: "Не добавлена" },
  ],
  skills: ["Web-design", "Figma", "Prototype", "Photoshop", "Review", "HTML", "CSS", "Tilda"],
  recommendedSkills: ["Motion-design", "Дизайн-мышление", "Adobe After Effects", "Adobe illustrator", "A/B тесты", "Photoshop", "Scetch", "Usability"],
  education: { label: "ЧГУ им. И. Н. Ульянова", value: "Среднее" },
  about: { label: "О себе", value: "Дополнительная информация" },
  experience: { label: "Опыт работы", value: "Информации нет" },
};
