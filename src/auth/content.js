export const AUTH_DELAY_MS = 420;

export const loginRoleOptions = [
  {
    value: "candidate",
    title: "Я ищу работу",
    description: "Профиль соискателя, вакансии и отклики",
    icon: "candidate",
  },
  {
    value: "employer",
    title: "Я ищу сотрудников",
    description: "Профиль работодателя, команды и подбор",
    icon: "employer",
  },
];

export const loginRoleViews = {
  candidate: {
    action: "../candidate/candidate-dashboard.html",
    registerHref: "candidate-registration.html?role=candidate",
    title: "Кабинет соискателя",
    description: "После входа откроется рабочее пространство с откликами, сохранёнными вакансиями и профилем.",
  },
  employer: {
    action: "../company/company-dashboard.html",
    registerHref: "candidate-registration.html?role=employer",
    title: "Кабинет работодателя",
    description: "После входа откроется кабинет компании с вакансиями, публикациями и следующими шагами верификации.",
  },
};

export const hiringFocusOptions = [
  {
    value: "interns",
    title: "Стажёров",
    description: "Первый найм, практика и рост внутри команды.",
  },
  {
    value: "juniors",
    title: "Junior+",
    description: "Быстрый набор в продукт, backend, frontend и analytics.",
  },
  {
    value: "events",
    title: "События",
    description: "Карьерные активности, стажировки и брендовые мероприятия.",
  },
];

export const companySizeOptions = [
  {
    value: "small",
    title: "До 50 человек",
    description: "Стартап, небольшая студия или продуктовая команда.",
  },
  {
    value: "medium",
    title: "50-250 человек",
    description: "Растущая компания с несколькими направлениями найма.",
  },
  {
    value: "large",
    title: "250+",
    description: "Крупный работодатель с несколькими потоками найма.",
  },
  {
    value: "education",
    title: "Образовательный проект",
    description: "Интенсивы, стажировки, карьерные события и партнёрские программы.",
  },
];

export const companyQuickAside = {
  badge: "Короткая версия",
  title: "Что будет дальше",
  description:
    "Этот сценарий быстро открывает кабинет. Данные о компании, команду и карточки вакансий можно дособрать уже после входа.",
  metric: {
    value: "5 мин",
    description: "обычно хватает, чтобы получить доступ к кабинету компании",
  },
  items: [
    {
      title: "Шаг 1. Базовые контакты",
      description: "Почта, сайт, контактное лицо и краткий фокус найма.",
    },
    {
      title: "Шаг 2. Код из письма",
      description: "Почта подтверждает, что кабинет привязан к реальному домену компании.",
    },
    {
      title: "Шаг 3. Досборка профиля",
      description: "После входа можно оформить карточку компании, добавить команду и публикации.",
    },
  ],
  note: {
    title: "Нужна верификация сразу?",
    description:
      "Перейдите в расширенную форму, если хотите приложить больше данных и пройти подтверждение компании без отдельного шага в кабинете.",
  },
};

export const companyExtendedAside = {
  badge: "Быстрая проверка",
  title: "Что лучше подготовить",
  description:
    "Чем точнее домен, контакты и описание компании, тем меньше возвратов на доработку и тем быстрее открывается публикация.",
  metric: {
    value: "1",
    description: "подтверждение почты запускает быстрый сценарий без ожидания в кабинете",
  },
  items: [
    {
      title: "Домен и почта",
      description: "Желательно использовать адрес на домене компании, а не личный email.",
    },
    {
      title: "Контакт ответственного",
      description: "Имя и роль человека, который отвечает за публикации и обратную связь.",
    },
    {
      title: "Описание деятельности",
      description: "Продукт, направления найма и формат работы помогают быстрее понять контекст.",
    },
  ],
  note: {
    title: "Практика",
    description:
      "Если вы уже знаете, какие вакансии или мероприятия будут первыми, укажите это сразу: кабинет можно открыть более точно уже на стартовом экране.",
  },
};

export function getConfirmView(role, flow) {
  const isEmployer = role === "employer";

  if (!isEmployer) {
    return {
      title: "Подтверждение регистрации",
      description: "Введите код подтверждения, который мы отправили на почту соискателя.",
      submitLabel: "Завершить регистрацию",
      action: "../candidate/candidate-dashboard.html",
      backHref: "candidate-registration.html?role=candidate",
    };
  }

  if (flow === "employer-verify") {
    return {
      title: "Подтвердите рабочий email",
      description: "Введите код из письма, чтобы продолжить верификацию компании.",
      submitLabel: "Открыть кабинет работодателя",
      action: "../company/company-dashboard.html",
      backHref: "company-registration-extended.html",
    };
  }

  if (flow === "employer-start") {
    return {
      title: "Подтвердите рабочий email",
      description: "Введите код подтверждения, который мы отправили на рабочую почту работодателя.",
      submitLabel: "Открыть кабинет работодателя",
      action: "../company/company-dashboard.html",
      backHref: "company-registration.html",
    };
  }

  return {
    title: "Подтвердите рабочий email",
    description: "Введите код подтверждения, который мы отправили на рабочую почту работодателя.",
    submitLabel: "Открыть кабинет работодателя",
    action: "../company/company-dashboard.html",
    backHref: "candidate-registration.html?role=employer",
  };
}
