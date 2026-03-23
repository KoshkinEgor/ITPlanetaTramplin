const AUTH_DELAY_MS = 420;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toArray = (value) => Array.from(value);

const setVisibility = (node, visible) => {
  if (!node) {
    return;
  }

  node.hidden = !visible;
};

const setFieldState = (field, message) => {
  const container =
    field.closest(".auth-field") ||
    field.closest(".auth-check") ||
    field.closest(".auth-inline-check");

  const form = field.form;
  const key = field.name || field.id;
  const errorNode = form?.querySelector(`[data-error-for="${key}"]`);
  const hasValue = field.type === "checkbox" ? field.checked : field.value.trim().length > 0;

  if (container) {
    container.classList.toggle("is-error", Boolean(message));
    container.classList.toggle("is-success", !message && hasValue && field.type !== "checkbox");
  }

  field.setAttribute("aria-invalid", String(Boolean(message)));

  if (errorNode) {
    errorNode.textContent = message || "";
    setVisibility(errorNode, Boolean(message));
  }
};

const getValidationMessage = (field) => {
  if (field.disabled) {
    return "";
  }

  const type = field.dataset.validate;
  const value = field.value.trim();
  const minLength = Number(field.dataset.minLength || 0);
  const fallbackMessage = field.dataset.errorMessage || "Проверьте это поле";

  switch (type) {
    case "required":
      return value ? "" : fallbackMessage;
    case "email":
      return value && emailPattern.test(value) ? "" : fallbackMessage;
    case "text":
      return value.length >= minLength ? "" : fallbackMessage;
    case "password":
      return value.length >= minLength ? "" : fallbackMessage;
    case "checkbox":
      return field.checked ? "" : fallbackMessage;
    default:
      return "";
  }
};

const validateField = (field) => {
  const message = getValidationMessage(field);
  setFieldState(field, message);
  return !message;
};

const validateForm = (form) => {
  const fields = toArray(form.querySelectorAll("[data-validate]"));
  let firstInvalidField = null;
  let isValid = true;

  fields.forEach((field) => {
    const valid = validateField(field);

    if (!valid) {
      isValid = false;
    }

    if (!valid && !firstInvalidField) {
      firstInvalidField = field;
    }
  });

  if (!isValid && firstInvalidField) {
    firstInvalidField.focus();
  }

  return isValid;
};

const setFormMessage = (form, text, kind = "error") => {
  const messageNode = form.querySelector("[data-form-message]");

  if (!messageNode) {
    return;
  }

  messageNode.classList.remove("auth-message--error", "auth-message--info", "auth-message--success");
  messageNode.classList.add(`auth-message--${kind}`);
  messageNode.textContent = text;
  setVisibility(messageNode, Boolean(text));
};

const clearFormMessage = (form) => {
  setFormMessage(form, "");
};

const setButtonLoading = (button, loading) => {
  if (!button) {
    return;
  }

  const label = button.querySelector(".auth-button__label");

  if (!button.dataset.originalLabel && label) {
    button.dataset.originalLabel = label.textContent.trim();
  }

  if (loading) {
    const nextLabel = button.dataset.loadingLabel || "Загружаем";

    button.classList.add("is-loading");
    button.disabled = true;

    if (label) {
      label.textContent = nextLabel;
    }

    return;
  }

  button.classList.remove("is-loading");
  button.disabled = false;

  if (label && button.dataset.originalLabel) {
    label.textContent = button.dataset.originalLabel;
  }
};

const withLoadingRedirect = (button, target) => {
  setButtonLoading(button, true);
  window.setTimeout(() => {
    window.location.href = target;
  }, AUTH_DELAY_MS);
};

const applyRoleSelection = (cards, role) => {
  cards.forEach((card) => {
    const input = card.querySelector('input[type="radio"]');
    const isSelected = input?.value === role;

    card.classList.toggle("is-selected", isSelected);

    if (input) {
      input.checked = isSelected;
    }
  });
};

const initPasswordToggles = () => {
  toArray(document.querySelectorAll("[data-password-toggle]")).forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.getElementById(button.dataset.target);

      if (!target) {
        return;
      }

      const nextType = target.type === "password" ? "text" : "password";
      const nextLabel = nextType === "password" ? "Показать" : "Скрыть";

      target.type = nextType;
      button.textContent = nextLabel;
      button.setAttribute(
        "aria-label",
        nextType === "password" ? "Показать пароль" : "Скрыть пароль"
      );
    });
  });
};

const bindValidationEvents = (form) => {
  toArray(form.querySelectorAll("[data-validate]")).forEach((field) => {
    const handler = () => {
      validateField(field);
      clearFormMessage(form);
    };

    field.addEventListener("blur", handler);

    field.addEventListener("input", () => {
      const container = field.closest(".auth-field");

      if (container?.classList.contains("is-error") || field.type === "checkbox") {
        handler();
      } else {
        clearFormMessage(form);
      }
    });

    if (field.type === "checkbox") {
      field.addEventListener("change", handler);
    }
  });
};

const initLoginScreen = () => {
  const root = document.querySelector('[data-auth-screen="login"]');

  if (!root) {
    return;
  }

  const form = root.querySelector("[data-auth-form]");
  const roleCards = toArray(root.querySelectorAll("[data-role-card]"));
  const roleValue = root.querySelector("[data-role-value]");
  const registerLink = root.querySelector("[data-auth-register-link]");
  const submitButton = root.querySelector("[data-submit-button]");
  const roleTitle = document.querySelector("[data-login-role-title]");
  const roleCopy = document.querySelector("[data-login-role-copy]");
  const params = new URLSearchParams(window.location.search);

  const roleViews = {
    candidate: {
      action: "../candidate/candidate-profile.html",
      registerHref: "candidate-registration.html?role=candidate",
      title: "Кабинет соискателя",
      copy: "После входа откроется рабочее пространство с откликами, сохранёнными вакансиями и профилем.",
    },
    employer: {
      action: "../company/company-dashboard.html",
      registerHref: "candidate-registration.html?role=employer",
      title: "Кабинет работодателя",
      copy: "После входа откроется кабинет компании с вакансиями, публикациями и следующими шагами верификации.",
    },
  };

  const applyRole = (role) => {
    const view = roleViews[role];

    applyRoleSelection(roleCards, role);
    roleValue.value = role;
    form.dataset.action = view.action;
    registerLink.href = view.registerHref;

    if (roleTitle) {
      roleTitle.textContent = view.title;
    }

    if (roleCopy) {
      roleCopy.textContent = view.copy;
    }
  };

  roleCards.forEach((card) => {
    const input = card.querySelector('input[type="radio"]');

    input?.addEventListener("change", () => applyRole(input.value));
  });

  bindValidationEvents(form);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearFormMessage(form);

    if (!validateForm(form)) {
      setFormMessage(form, "Проверьте обязательные поля перед входом.");
      return;
    }

    withLoadingRedirect(submitButton, form.dataset.action || roleViews.candidate.action);
  });

  applyRole(params.get("role") === "employer" ? "employer" : "candidate");
};

const initRegisterScreen = () => {
  const root = document.querySelector('[data-auth-screen="register"]');

  if (!root) {
    return;
  }

  const form = root.querySelector("[data-register-form]");
  const roleCards = toArray(root.querySelectorAll("[data-role-card]"));
  const roleValue = root.querySelector("[data-role-value]");
  const submitButton = root.querySelector("[data-submit-button]");
  const params = new URLSearchParams(window.location.search);

  const applyRole = (role) => {
    applyRoleSelection(roleCards, role);
    if (roleValue) {
      roleValue.value = role;
    }
  };

  roleCards.forEach((card) => {
    const input = card.querySelector('input[type="radio"]');

    input?.addEventListener("change", () => applyRole(input.value));
  });

  bindValidationEvents(form);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearFormMessage(form);

    if (!validateForm(form)) {
      setFormMessage(form, "Заполните обязательные поля.");
      return;
    }

    const role = roleValue?.value === "employer" ? "employer" : "candidate";
    const flow = role === "employer" ? "register-employer" : "register-candidate";

    setButtonLoading(submitButton, true);
    window.setTimeout(() => {
      window.location.href = `email-confirmation.html?role=${role}&flow=${flow}`;
    }, AUTH_DELAY_MS);
  });

  applyRole(params.get("role") === "employer" ? "employer" : "candidate");
};

const initConfirmScreen = () => {
  const root = document.querySelector('[data-auth-screen="confirm"]');

  if (!root) {
    return;
  }

  const form = root.querySelector("[data-confirm-form]");
  const submitButton = root.querySelector("[data-submit-button]");
  const title = root.querySelector("[data-confirm-title]");
  const copy = root.querySelector("[data-confirm-copy]");
  const back = root.querySelector("[data-confirm-back]");
  const backLink = root.querySelector("[data-confirm-back-link]");
  const resendLink = root.querySelector("[data-confirm-resend]");
  const params = new URLSearchParams(window.location.search);
  const roleParam = params.get("role");
  const flow = params.get("flow");
  const role = roleParam === "employer" || roleParam === "company" ? "employer" : "candidate";
  const codeInputs = toArray(root.querySelectorAll(".auth-confirm-code__input"));

  const views = {
    candidate: {
      title: "Подтверждение регистрации",
      copy: "Введите код подтверждения, который мы отправили на email соискателя.",
      action: "../candidate/candidate-profile.html",
      backHref: "candidate-registration.html?role=candidate",
      submitLabel: "Завершить регистрацию",
    },
    employer: {
      title: "Подтвердите рабочий email",
      copy:
        flow === "employer-verify"
          ? "Введите код из письма, чтобы продолжить расширенную верификацию компании."
          : "Введите код подтверждения, который мы отправили на рабочий email работодателя.",
      action: "../company/company-dashboard.html",
      backHref:
        flow === "employer-verify"
          ? "company-registration-extended.html"
          : flow === "employer-start"
            ? "company-registration.html"
            : "candidate-registration.html?role=employer",
      submitLabel: "Открыть кабинет работодателя",
    },
  };

  const view = views[role];
  const label = submitButton?.querySelector(".auth-button__label");

  if (role === "candidate") {
    view.copy = "Введите код подтверждения, отправленный на почту.";
  } else if (flow === "employer-verify") {
    view.copy = "Введите код из письма, чтобы продолжить верификацию компании.";
  } else {
    view.copy = "Введите код подтверждения, отправленный на рабочую почту.";
  }

  if (title) {
    title.textContent = view.title;
  }

  if (copy) {
    copy.textContent = view.copy;
  }

  if (label) {
    label.textContent = view.submitLabel;
    submitButton.dataset.originalLabel = view.submitLabel;
  }

  form.action = view.action;

  if (back) {
    back.href = view.backHref;
  }

  if (backLink) {
    backLink.href = view.backHref;
  }

  resendLink?.addEventListener("click", (event) => {
    event.preventDefault();
    setFormMessage(form, "Новый код отправлен. Проверьте почту и папку со спамом.", "success");
  });

  const focusNext = (index) => {
    const nextInput = codeInputs[index + 1];

    if (nextInput) {
      nextInput.focus();
    }
  };

  codeInputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(0, 1);

      if (input.value) {
        focusNext(index);
      }

      clearFormMessage(form);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Backspace" && !input.value && index > 0) {
        codeInputs[index - 1].focus();
      }
    });

    input.addEventListener("paste", (event) => {
      event.preventDefault();

      const digits = event.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, codeInputs.length)
        .split("");

      digits.forEach((digit, digitIndex) => {
        if (codeInputs[digitIndex]) {
          codeInputs[digitIndex].value = digit;
        }
      });

      const nextEmpty = codeInputs.find((field) => !field.value);
      (nextEmpty || codeInputs[codeInputs.length - 1]).focus();
      clearFormMessage(form);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearFormMessage(form);

    const incomplete = codeInputs.some((input) => input.value.length !== 1);

    if (incomplete) {
      setFormMessage(form, "Введите все 4 цифры кода подтверждения.");
      const firstEmpty = codeInputs.find((input) => !input.value);
      firstEmpty?.focus();
      return;
    }

    withLoadingRedirect(submitButton, view.action);
  });

  codeInputs[0]?.focus();
};

initPasswordToggles();
initLoginScreen();
initRegisterScreen();
initConfirmScreen();
