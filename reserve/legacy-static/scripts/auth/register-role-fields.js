(() => {
  const root = document.querySelector('[data-auth-screen="register"]');

  if (!root) {
    return;
  }

  const form = root.querySelector("[data-register-form]");
  const grid = root.querySelector("[data-register-fields]");
  const roleInputs = Array.from(root.querySelectorAll('input[name="register-role"]'));

  if (!form || !grid || !roleInputs.length) {
    return;
  }

  const slots = {
    primary: grid.querySelector('[data-register-slot="primary"]'),
    secondary: grid.querySelector('[data-register-slot="secondary"]'),
    companyTaxId: grid.querySelector('[data-register-slot="company-tax-id"]'),
    password: grid.querySelector('[data-register-slot="password"]'),
  };

  if (!slots.primary || !slots.secondary || !slots.password) {
    return;
  }

  const getFieldParts = (field) => ({
    field,
    label: field.querySelector(".auth-field__label"),
    input: field.querySelector("input"),
    error: field.querySelector(".auth-field__error"),
  });

  const fields = {
    primary: getFieldParts(slots.primary),
    secondary: getFieldParts(slots.secondary),
    password: getFieldParts(slots.password),
  };

  if (Object.values(fields).some((entry) => !entry?.input)) {
    return;
  }

  let companyTaxIdField = slots.companyTaxId ? getFieldParts(slots.companyTaxId) : null;

  const TEXT = {
    candidate: {
      primaryLabel: "Email",
      primaryPlaceholder: "name@company.ru",
      primaryError: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u044b\u0439 email",
      secondaryLabel: "\u0418\u043c\u044f",
      secondaryPlaceholder: "\u041a\u0430\u043a \u043a \u0432\u0430\u043c \u043e\u0431\u0440\u0430\u0449\u0430\u0442\u044c\u0441\u044f",
      secondaryError: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0438\u043c\u044f",
      passwordLabel: "\u041f\u0430\u0440\u043e\u043b\u044c",
      passwordPlaceholder: "\u041c\u0438\u043d\u0438\u043c\u0443\u043c 8 \u0441\u0438\u043c\u0432\u043e\u043b\u043e\u0432",
      passwordError:
        "\u041f\u0430\u0440\u043e\u043b\u044c \u0434\u043e\u043b\u0436\u0435\u043d \u0441\u043e\u0434\u0435\u0440\u0436\u0430\u0442\u044c \u043c\u0438\u043d\u0438\u043c\u0443\u043c 8 \u0441\u0438\u043c\u0432\u043e\u043b\u043e\u0432",
    },
    employer: {
      primaryLabel: "\u041a\u043e\u0440\u043f\u043e\u0440\u0430\u0442\u0438\u0432\u043d\u044b\u0439 email",
      primaryPlaceholder: "team@company.ru",
      primaryError:
        "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043a\u043e\u0440\u043f\u043e\u0440\u0430\u0442\u0438\u0432\u043d\u044b\u0439 email",
      secondaryLabel: "\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0438",
      secondaryPlaceholder: "Signal Hub",
      secondaryError:
        "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0438",
      taxLabel: "\u0418\u041d\u041d",
      taxPlaceholder: "7701234567",
      taxError: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0418\u041d\u041d \u043a\u043e\u043c\u043f\u0430\u043d\u0438\u0438",
      passwordLabel: "\u041f\u0430\u0440\u043e\u043b\u044c",
      passwordPlaceholder: "\u041c\u0438\u043d\u0438\u043c\u0443\u043c 8 \u0441\u0438\u043c\u0432\u043e\u043b\u043e\u0432",
      passwordError:
        "\u041f\u0430\u0440\u043e\u043b\u044c \u0434\u043e\u043b\u0436\u0435\u043d \u0441\u043e\u0434\u0435\u0440\u0436\u0430\u0442\u044c \u043c\u0438\u043d\u0438\u043c\u0443\u043c 8 \u0441\u0438\u043c\u0432\u043e\u043b\u043e\u0432",
    },
  };

  const formMessage = form.querySelector("[data-form-message]");
  let currentRole = "";

  const createCompanyTaxIdField = () => {
    const field = document.createElement("label");

    field.className = "auth-field";
    field.setAttribute("data-register-slot", "company-tax-id");
    field.innerHTML = `
      <span class="auth-field__label"></span>
      <input
        class="auth-input"
        id="register-company-tax-id"
        type="text"
        name="inn"
        placeholder=""
        autocomplete="off"
        inputmode="numeric"
        data-validate="text"
        data-min-length="10"
        data-error-message=""
      />
      <span class="auth-field__error" data-error-for="inn" hidden></span>
    `;

    return getFieldParts(field);
  };

  const ensureCompanyTaxIdField = () => {
    if (!companyTaxIdField) {
      companyTaxIdField = createCompanyTaxIdField();

      companyTaxIdField.input.addEventListener("input", () => {
        companyTaxIdField.input.value = companyTaxIdField.input.value.replace(/\D+/g, "").slice(0, 12);
        clearFieldState(companyTaxIdField);
      });
    }

    slots.companyTaxId = companyTaxIdField.field;
    return companyTaxIdField;
  };

  const clearFieldState = ({ field, input, error }, clearValue = false) => {
    field.classList.remove("is-error", "is-success");

    if (input) {
      if (clearValue) {
        input.value = "";
      }

      input.removeAttribute("aria-invalid");
    }

    if (error) {
      error.textContent = "";
      error.hidden = true;
    }
  };

  const setFieldMeta = (fieldParts, config) => {
    const { field, label, input, error } = fieldParts;

    if (label && Object.prototype.hasOwnProperty.call(config, "label")) {
      label.textContent = config.label;
    }

    if (Object.prototype.hasOwnProperty.call(config, "name")) {
      input.name = config.name;
    }

    if (Object.prototype.hasOwnProperty.call(config, "type")) {
      input.type = config.type;
    }

    if (Object.prototype.hasOwnProperty.call(config, "placeholder")) {
      input.placeholder = config.placeholder;
    }

    if (Object.prototype.hasOwnProperty.call(config, "autocomplete")) {
      input.autocomplete = config.autocomplete;
    } else {
      input.removeAttribute("autocomplete");
    }

    if (Object.prototype.hasOwnProperty.call(config, "inputMode")) {
      input.setAttribute("inputmode", config.inputMode);
    } else {
      input.removeAttribute("inputmode");
    }

    if (Object.prototype.hasOwnProperty.call(config, "validate")) {
      input.dataset.validate = config.validate;
    } else {
      delete input.dataset.validate;
    }

    if (Object.prototype.hasOwnProperty.call(config, "minLength")) {
      input.dataset.minLength = String(config.minLength);
    } else {
      delete input.dataset.minLength;
    }

    if (Object.prototype.hasOwnProperty.call(config, "errorMessage")) {
      input.dataset.errorMessage = config.errorMessage;
    } else {
      delete input.dataset.errorMessage;
    }

    if (Object.prototype.hasOwnProperty.call(config, "disabled")) {
      input.disabled = Boolean(config.disabled);
    }

    if (Object.prototype.hasOwnProperty.call(config, "hidden")) {
      field.hidden = Boolean(config.hidden);
    }

    if (error) {
      const errorKey = config.errorFor || input.name || input.id;

      if (errorKey) {
        error.setAttribute("data-error-for", errorKey);
      }
    }
  };

  const clearRoleSpecificValues = () => {
    clearFieldState(fields.primary, true);
    clearFieldState(fields.secondary, true);

    if (companyTaxIdField) {
      clearFieldState(companyTaxIdField, true);
    }

    if (formMessage) {
      formMessage.textContent = "";
      formMessage.hidden = true;
    }
  };

  const applyCandidateLayout = () => {
    const text = TEXT.candidate;

    setFieldMeta(fields.primary, {
      label: text.primaryLabel,
      name: "email",
      type: "email",
      placeholder: text.primaryPlaceholder,
      autocomplete: "email",
      validate: "email",
      errorMessage: text.primaryError,
      errorFor: "email",
      disabled: false,
      hidden: false,
    });

    setFieldMeta(fields.secondary, {
      label: text.secondaryLabel,
      name: "displayName",
      type: "text",
      placeholder: text.secondaryPlaceholder,
      autocomplete: "name",
      validate: "text",
      minLength: 2,
      errorMessage: text.secondaryError,
      errorFor: "displayName",
      disabled: false,
      hidden: false,
    });

    setFieldMeta(fields.password, {
      label: text.passwordLabel,
      name: "password",
      type: fields.password.input.type,
      placeholder: text.passwordPlaceholder,
      autocomplete: "new-password",
      validate: "password",
      minLength: 8,
      errorMessage: text.passwordError,
      errorFor: "password",
      disabled: false,
      hidden: false,
    });

    if (companyTaxIdField) {
      clearFieldState(companyTaxIdField, true);
      companyTaxIdField.field.remove();
    }

    grid.append(slots.primary, slots.secondary, slots.password);
  };

  const applyEmployerLayout = () => {
    const text = TEXT.employer;
    const companyTaxId = ensureCompanyTaxIdField();

    setFieldMeta(fields.secondary, {
      label: text.secondaryLabel,
      name: "companyName",
      type: "text",
      placeholder: text.secondaryPlaceholder,
      autocomplete: "organization",
      validate: "text",
      minLength: 2,
      errorMessage: text.secondaryError,
      errorFor: "companyName",
      disabled: false,
      hidden: false,
    });

    setFieldMeta(fields.primary, {
      label: text.primaryLabel,
      name: "email",
      type: "email",
      placeholder: text.primaryPlaceholder,
      autocomplete: "email",
      validate: "email",
      errorMessage: text.primaryError,
      errorFor: "email",
      disabled: false,
      hidden: false,
    });

    setFieldMeta(companyTaxId, {
      label: text.taxLabel,
      name: "inn",
      type: "text",
      placeholder: text.taxPlaceholder,
      autocomplete: "off",
      inputMode: "numeric",
      validate: "text",
      minLength: 10,
      errorMessage: text.taxError,
      errorFor: "inn",
    });

    setFieldMeta(fields.password, {
      label: text.passwordLabel,
      name: "password",
      type: fields.password.input.type,
      placeholder: text.passwordPlaceholder,
      autocomplete: "new-password",
      validate: "password",
      minLength: 8,
      errorMessage: text.passwordError,
      errorFor: "password",
      disabled: false,
      hidden: false,
    });

    grid.append(slots.secondary, slots.primary, companyTaxId.field, slots.password);
  };

  const applyRole = (role) => {
    if (currentRole && currentRole !== role) {
      clearRoleSpecificValues();
    }

    clearFieldState(fields.primary);
    clearFieldState(fields.secondary);

    if (companyTaxIdField) {
      clearFieldState(companyTaxIdField);
    }

    if (role === "employer") {
      applyEmployerLayout();
    } else {
      applyCandidateLayout();
    }

    currentRole = role;
  };

  roleInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) {
        applyRole(input.value);
      }
    });
  });

  const initialRole = roleInputs.find((input) => input.checked)?.value === "employer" ? "employer" : "candidate";

  applyRole(initialRole);
})();
