(function () {
  const MARKETING_NAV = [
    { href: "#", text: "Вакансии" },
    { href: "#", text: "Стажировки" },
    { href: "#", text: "Менторы" },
    { href: "#", text: "Мероприятия" },
    { href: "#", text: "Компании" },
  ];

  const PLATFORM_NAV = [
    { href: "pages/candidate/candidate-dashboard.html", text: "Соискателю" },
    { href: "pages/company/company-dashboard.html", text: "Работодателям" },
    { href: "pages/home/index.html#info", text: "О системе" },
  ];

  const APP_HOME_NAV = [
    { href: "#workspace", text: "Возможности" },
    { href: "#how-it-works", text: "Как это работает" },
    { href: "#companies", text: "Для компаний" },
    { href: "#about", text: "О платформе" },
  ];

  const CURATOR_NAV = [
    { href: "pages/home/app-home.html#workspace", text: "Возможности" },
    { href: "pages/home/app-home.html#companies", text: "Компании" },
    { href: "pages/candidate/candidate-dashboard.html", text: "Соискатели" },
    { href: "pages/company/company-dashboard.html", text: "Работодатели" },
  ];

  const HEADER_CONFIGS = {
    index: {
      headerClasses: ["site-header"],
      innerClasses: ["container", "header-inner"],
      lead: [
        {
          type: "brand",
          href: "pages/home/index.html",
          ariaLabel: "Трамплин, главная страница",
          label: "TAMPLIN",
        },
      ],
      nav: {
        className: "main-nav",
        ariaLabel: "Основная навигация",
        items: MARKETING_NAV,
      },
      actions: {
        className: "header-actions",
        items: [
          {
            type: "iconButton",
            className: "icon-button",
            ariaLabel: "Избранное",
            icon: "♡",
          },
          {
            type: "link",
            className: "button button-primary",
            href: "pages/auth/login.html",
            text: "Войти / Регистрация",
          },
        ],
      },
    },
    "app-home": {
      headerClasses: ["site-header", "app-home-header"],
      innerClasses: ["container", "header-inner", "app-home-header__inner"],
      lead: [
        {
          type: "brand",
          href: "pages/home/app-home.html",
          ariaLabel: "Трамплин, главная страница",
          label: "Трамплин",
        },
      ],
      nav: {
        className: "main-nav app-home-nav",
        ariaLabel: "Навигация платформы",
        items: APP_HOME_NAV,
      },
      actions: {
        className: "header-actions app-home-header__actions",
        items: [
          {
            type: "link",
            className: "button button-primary app-home-auth app-home-auth--guest",
            href: "pages/auth/login.html",
            text: "Войти / Регистрация",
          },
          {
            type: "profileLink",
            className: "app-home-profile-link app-home-auth app-home-auth--user",
            href: "pages/candidate/candidate-dashboard.html",
            ariaLabel: "Перейти в личный кабинет",
            avatar: "АК",
            eyebrow: "Быстрый доступ",
            title: "Личный кабинет",
            hidden: true,
          },
        ],
      },
    },
    "candidate-dashboard": {
      headerClasses: ["site-header", "candidate-header"],
      innerClasses: ["container", "header-inner", "candidate-header__inner"],
      leadWrapperClassName: "candidate-header__lead",
      lead: [
        {
          type: "burger",
          className: "icon-button candidate-header__burger",
          targetId: "candidate-drawer",
          ariaLabel: "Открыть меню",
          icon: "☰",
        },
        {
          type: "brand",
          href: "pages/home/index.html",
          ariaLabel: "Трамплин, главная страница",
          label: "TAMPLIN",
        },
      ],
      nav: {
        className: "main-nav candidate-header__nav",
        ariaLabel: "Навигация платформы",
        items: [
          { href: "pages/candidate/candidate-dashboard.html", text: "Соискателю", current: true },
          { href: "pages/company/company-dashboard.html", text: "Работодателям" },
          { href: "pages/home/index.html#info", text: "О системе" },
        ],
      },
      actions: {
        className: "header-actions candidate-header__actions",
        items: [
          {
            type: "link",
            className: "button button-secondary",
            href: "pages/home/index.html#map-view",
            text: "Открыть карту",
          },
          {
            type: "link",
            className: "button button-secondary candidate-header__home",
            href: "pages/home/index.html",
            text: "На главную",
          },
          {
            type: "link",
            className: "button button-primary",
            href: "pages/candidate/candidate-dashboard.html",
            text: "Профиль",
          },
        ],
      },
    },
    "company-dashboard": createCompanyHeaderConfig({
      brandLabel: "Трамплин",
      primaryHref: "#",
      primaryText: "Опубликовать вакансию",
    }),
    "company-opportunity": createCompanyHeaderConfig({
      brandLabel: "TAMPLIN",
      primaryHref: "#",
      primaryText: "Опубликовать вакансию",
    }),
    "opportunity-detail": createCompanyHeaderConfig({
      brandLabel: "TAMPLIN",
      primaryHref: "pages/company/company-opportunity.html",
      primaryText: "Опубликовать возможность",
    }),
    "contact-profile": {
      headerClasses: ["site-header"],
      innerClasses: ["container", "header-inner"],
      lead: [
        {
          type: "brand",
          href: "pages/home/index.html",
          ariaLabel: "Трамплин, главная страница",
          label: "TAMPLIN",
        },
      ],
      nav: {
        className: "main-nav",
        ariaLabel: "Навигация платформы",
        items: PLATFORM_NAV,
      },
      actions: {
        className: "header-actions",
        items: [
          {
            type: "link",
            className: "button button-secondary",
            href: "pages/candidate/candidate-dashboard.html",
            text: "Назад в кабинет",
          },
        ],
      },
    },
    "curator-dashboard": {
      headerClasses: ["site-header", "curator-header"],
      innerClasses: ["container", "header-inner", "curator-header__inner"],
      leadWrapperClassName: "curator-header__lead",
      lead: [
        {
          type: "burger",
          className: "icon-button curator-header__burger",
          targetId: "curator-drawer",
          ariaLabel: "Открыть меню",
          icon: "☰",
        },
        {
          type: "brand",
          href: "pages/home/app-home.html",
          ariaLabel: "Трамплин, главная страница",
          label: "Трамплин",
        },
      ],
      nav: {
        className: "main-nav curator-header__nav",
        ariaLabel: "Навигация платформы",
        items: CURATOR_NAV,
      },
      actions: {
        className: "header-actions curator-header__actions",
        items: [
          {
            type: "link",
            className: "button button-secondary curator-header__platform-link",
            href: "pages/home/app-home.html",
            text: "На главную",
          },
          {
            type: "profileMenu",
            className: "curator-profile-menu",
            avatar: "МК",
            eyebrow: "Куратор",
            title: "Марина Котова",
            items: [
              { href: "pages/home/app-home.html", text: "На главную" },
              { href: "#curator-profile", text: "Профиль" },
              { href: "pages/auth/login.html", text: "Выйти" },
            ],
          },
        ],
      },
    },
    "opportunity-card": createCompanyHeaderConfig({
      brandLabel: "TAMPLIN",
      primaryHref: "pages/company/company-opportunity.html",
      primaryText: "Опубликовать возможность",
    }),
  };

  const mounts = document.querySelectorAll("[data-shared-header]");
  mounts.forEach((mount) => {
    const configName = mount.dataset.headerConfig;
    const basePath = mount.dataset.headerBase || "";
    const config = HEADER_CONFIGS[configName];

    if (!config) {
      console.warn("Unknown shared header config:", configName);
      return;
    }

    mount.outerHTML = renderHeader(config, basePath);
  });

  function createCompanyHeaderConfig({ brandLabel, primaryHref, primaryText }) {
    return {
      headerClasses: ["site-header"],
      innerClasses: ["container", "header-inner"],
      lead: [
        {
          type: "brand",
          href: "pages/home/index.html",
          ariaLabel: "Трамплин, главная страница",
          label: brandLabel,
        },
      ],
      nav: {
        className: "main-nav",
        ariaLabel: "Основная навигация",
        items: MARKETING_NAV,
      },
      actions: {
        className: "header-actions",
        items: [
          {
            type: "link",
            className: "button button-secondary",
            href: "pages/home/index.html",
            text: "На главную",
            icon: "←",
          },
          {
            type: "link",
            className: "button button-primary",
            href: primaryHref,
            text: primaryText,
          },
        ],
      },
    };
  }

  function renderHeader(config, basePath) {
    return [
      `<header class="${escapeAttr(joinClasses(config.headerClasses))}">`,
      `  <div class="${escapeAttr(joinClasses(config.innerClasses))}">`,
      renderLead(config, basePath),
      renderNav(config.nav, basePath),
      renderActions(config.actions, basePath),
      "  </div>",
      "</header>",
    ].join("\n");
  }

  function renderLead(config, basePath) {
    const content = renderItems(config.lead, basePath);
    if (!config.leadWrapperClassName) {
      return content;
    }

    return `    <div class="${escapeAttr(config.leadWrapperClassName)}">\n${indent(content, 3)}\n    </div>`;
  }

  function renderNav(nav, basePath) {
    return [
      `    <nav class="${escapeAttr(nav.className)}" aria-label="${escapeAttr(nav.ariaLabel)}">`,
      indent(
        nav.items
          .map((item) => {
            const current = item.current ? ' aria-current="page"' : "";
            return `<a href="${escapeAttr(resolveHref(basePath, item.href))}"${current}>${escapeHtml(item.text)}</a>`;
          })
          .join("\n"),
        3,
      ),
      "    </nav>",
    ].join("\n");
  }

  function renderActions(actions, basePath) {
    return [
      `    <div class="${escapeAttr(actions.className)}">`,
      indent(renderItems(actions.items, basePath), 3),
      "    </div>",
    ].join("\n");
  }

  function renderItems(items, basePath) {
    return items.map((item) => renderItem(item, basePath)).join("\n");
  }

  function renderItem(item, basePath) {
    if (item.type === "brand") {
      return [
        `    <a class="brand" href="${escapeAttr(resolveHref(basePath, item.href))}" aria-label="${escapeAttr(item.ariaLabel)}">`,
        '      <span class="brand-mark" aria-hidden="true"></span>',
        `      <span class="brand-label">${escapeHtml(item.label)}</span>`,
        "    </a>",
      ].join("\n");
    }

    if (item.type === "burger") {
      return [
        `    <label class="${escapeAttr(item.className)}" for="${escapeAttr(item.targetId)}" aria-label="${escapeAttr(item.ariaLabel)}">`,
        `      <span aria-hidden="true">${escapeHtml(item.icon)}</span>`,
        "    </label>",
      ].join("\n");
    }

    if (item.type === "iconButton") {
      return [
        `    <button class="${escapeAttr(item.className)}" type="button" aria-label="${escapeAttr(item.ariaLabel)}">`,
        `      <span aria-hidden="true">${escapeHtml(item.icon)}</span>`,
        "    </button>",
      ].join("\n");
    }

    if (item.type === "link") {
      const hidden = item.hidden ? " hidden" : "";
      const icon = item.icon ? `<span aria-hidden="true">${escapeHtml(item.icon)}</span>\n      ` : "";
      return `    <a class="${escapeAttr(item.className)}" href="${escapeAttr(resolveHref(basePath, item.href))}"${hidden}>${icon}${escapeHtml(item.text)}</a>`;
    }

    if (item.type === "profileLink") {
      const hidden = item.hidden ? " hidden" : "";
      return [
        `    <a class="${escapeAttr(item.className)}" href="${escapeAttr(resolveHref(basePath, item.href))}" aria-label="${escapeAttr(item.ariaLabel)}"${hidden}>`,
        `      <span class="app-home-profile-link__avatar" aria-hidden="true">${escapeHtml(item.avatar)}</span>`,
        '      <span class="app-home-profile-link__copy">',
        `        <span class="app-home-profile-link__eyebrow">${escapeHtml(item.eyebrow)}</span>`,
        `        <strong>${escapeHtml(item.title)}</strong>`,
        "      </span>",
        "    </a>",
      ].join("\n");
    }

    if (item.type === "profileMenu") {
      const links = item.items
        .map((menuItem) => `        <a href="${escapeAttr(resolveHref(basePath, menuItem.href))}">${escapeHtml(menuItem.text)}</a>`)
        .join("\n");

      return [
        `    <details class="${escapeAttr(item.className)}">`,
        '      <summary class="curator-profile-menu__summary">',
        `        <span class="curator-profile-menu__avatar" aria-hidden="true">${escapeHtml(item.avatar)}</span>`,
        '        <span class="curator-profile-menu__copy">',
        `          <span class="curator-profile-menu__eyebrow">${escapeHtml(item.eyebrow)}</span>`,
        `          <strong>${escapeHtml(item.title)}</strong>`,
        "        </span>",
        "      </summary>",
        '      <div class="card curator-profile-menu__dropdown">',
        links,
        "      </div>",
        "    </details>",
      ].join("\n");
    }

    return "";
  }

  function resolveHref(basePath, href) {
    if (!href || href === "#" || href.startsWith("#") || /^(?:[a-z]+:|\/\/)/i.test(href)) {
      return href;
    }

    return `${basePath}${href}`;
  }

  function joinClasses(classes) {
    return classes.filter(Boolean).join(" ");
  }

  function indent(text, level) {
    const prefix = "  ".repeat(level);
    return text
      .split("\n")
      .map((line) => `${prefix}${line}`)
      .join("\n");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replaceAll("'", "&#39;");
  }
})();
