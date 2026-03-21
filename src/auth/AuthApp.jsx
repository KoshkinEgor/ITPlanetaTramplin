import { useMemo, useState } from "react";
import { Alert, Button, Checkbox, ChoiceGroup, FormField, Input, Textarea } from "../components/ui";
import { AuthCodeInput, AuthHero, AuthList, AuthMetric, AuthNote, AuthOptionCard, AuthStage, AuthSurface, AuthTopBar } from "../components/auth";
import {
  AUTH_DELAY_MS,
  companyExtendedAside,
  companyQuickAside,
  companySizeOptions,
  getConfirmView,
  hiringFocusOptions,
  loginRoleOptions,
  loginRoleViews,
} from "./content";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getSearchParam(name) {
  if (typeof window === "undefined") {
    return null;
  }

  return new URLSearchParams(window.location.search).get(name);
}

function getInitialRole(defaultRole = "candidate") {
  const role = getSearchParam("role");
  return role === "employer" || role === "company" ? "employer" : defaultRole;
}

function redirectWithDelay(target, setLoading) {
  setLoading(true);
  window.setTimeout(() => {
    window.location.href = target;
  }, AUTH_DELAY_MS);
}

function isEmployerIdentifierValid(value) {
  const normalizedValue = value.trim();
  return emailPattern.test(normalizedValue) || /^\d{10,12}$/.test(normalizedValue);
}

function LoginScreen() {
  const [role, setRole] = useState(() => getInitialRole("candidate"));
  const [loading, setLoading] = useState(false);
  const currentView = loginRoleViews[role];

  return (
    <AuthStage layout="compact" className="auth-stage--login">
      <div className="auth-stage__shell auth-stage__shell--compact">
        <AuthSurface className="auth-screen-card--compact auth-login-card">
          <AuthTopBar backHref="../home/index.html" backLabel="Вернуться на главную" />
          <AuthHero
            centered
            className="auth-login-hero"
            badge="Личный кабинет"
            title="Вход"
            description="Выберите роль, чтобы продолжить работу с вакансиями, откликами и карьерным профилем."
          />

          <form
            className="auth-screen__form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              redirectWithDelay(`login-details.html?role=${role}`, setLoading);
            }}
          >
            <ChoiceGroup
              as="div"
              role="radiogroup"
              legend="Выбор роли"
              className="auth-screen__choice-group auth-login-choice-group"
              contentClassName="auth-screen__stack"
            >
              {loginRoleOptions.map((option) => (
                <AuthOptionCard
                  key={option.value}
                  title={option.title}
                  description={option.description}
                  icon={option.icon}
                  compact
                  showIndicator={false}
                  className="auth-login-option"
                  checked={role === option.value}
                  onSelect={() => setRole(option.value)}
                />
              ))}
            </ChoiceGroup>


            <div className="auth-screen__actions auth-login-actions">
              <Button type="submit" loading={loading} className="auth-login-button">
                Войти
              </Button>
              <Button as="a" href={currentView.registerHref} variant="secondary" className="auth-login-button auth-login-button--secondary">
                Зарегистрироваться
              </Button>
            </div>
          </form>
        </AuthSurface>
      </div>
    </AuthStage>
  );
}

function LoginDetailsScreen() {
  const [role] = useState(() => getInitialRole("candidate"));
  const [candidateForm, setCandidateForm] = useState({
    email: "",
    password: "",
  });
  const [employerForm, setEmployerForm] = useState({
    identifier: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const currentView = loginRoleViews[role];
  const activeForm = role === "employer" ? employerForm : candidateForm;

  const updateActiveForm = (field, nextValue) => {
    setSubmitError("");
    setErrors((current) => ({ ...current, [field]: "" }));

    if (role === "employer") {
      setEmployerForm((current) => ({
        ...current,
        [field]: field === "identifier" && /^\d+$/.test(nextValue) ? nextValue.slice(0, 12) : nextValue,
      }));
      return;
    }

    setCandidateForm((current) => ({ ...current, [field]: nextValue }));
  };

  const validate = () => {
    const nextErrors = {};

    if (role === "employer") {
      if (!isEmployerIdentifierValid(activeForm.identifier)) {
        nextErrors.identifier = "Введите рабочий email или ИНН";
      }
    } else if (!emailPattern.test(activeForm.email.trim())) {
      nextErrors.email = "Введите корректный email";
    }

    if (!activeForm.password.trim()) {
      nextErrors.password = "Введите пароль";
    }

    return nextErrors;
  };

  const description =
    role === "employer"
      ? "Введите Email или ИНН и пароль, чтобы открыть кабинет работодателя."
      : "Введите Email и пароль, чтобы открыть личный кабинет соискателя.";

  return (
    <AuthStage layout="compact" className="auth-stage--login-details">
      <div className="auth-stage__shell auth-stage__shell--compact">
        <AuthSurface className="auth-screen-card--compact auth-login-details-card">
          <AuthTopBar backHref={`login.html?role=${role}`} backLabel="Вернуться к выбору роли" />
          <AuthHero centered className="auth-login-details-hero" title="Вход" description={description} />

          <form
            className="auth-screen__form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              const nextErrors = validate();

              if (Object.keys(nextErrors).length) {
                setErrors(nextErrors);
                setSubmitError("Проверьте введённые данные.");
                return;
              }

              redirectWithDelay(currentView.action, setLoading);
            }}
          >
            <div className="auth-field-grid auth-field-grid--single auth-login-details-field-grid">
              {role === "employer" ? (
                <FormField label="Email или ИНН" error={errors.identifier} required className="auth-register-field auth-login-details-field">
                  <Input
                    value={activeForm.identifier}
                    autoComplete="username"
                    className="auth-register-input auth-login-details-input"
                    placeholder="Введите Email или ИНН"
                    onChange={(event) => updateActiveForm("identifier", event.target.value)}
                  />
                </FormField>
              ) : (
                <FormField label="Email" error={errors.email} required className="auth-register-field auth-login-details-field">
                  <Input
                    type="email"
                    value={activeForm.email}
                    autoComplete="email"
                    className="auth-register-input auth-login-details-input"
                    placeholder="Введите Email"
                    onChange={(event) => updateActiveForm("email", event.target.value)}
                  />
                </FormField>
              )}

              <FormField label="Пароль" error={errors.password} required className="auth-register-field auth-login-details-field">
                <Input
                  type="password"
                  value={activeForm.password}
                  autoComplete="current-password"
                  revealable
                  showPasswordLabel="Показать пароль"
                  hidePasswordLabel="Скрыть пароль"
                  showPasswordText="Показать"
                  hidePasswordText="Скрыть"
                  shellClassName="auth-register-input-shell auth-login-details-input-shell"
                  className="auth-register-input auth-login-details-input"
                  placeholder="Введите пароль"
                  onChange={(event) => updateActiveForm("password", event.target.value)}
                />
              </FormField>
            </div>

            {submitError ? (
              <Alert tone="error" showIcon title="Не удалось войти">
                {submitError}
              </Alert>
            ) : null}

            <div className="auth-screen__actions auth-login-details-actions">
              <Button type="submit" loading={loading} className="auth-register-button auth-login-details-button">
                Войти
              </Button>
            </div>
          </form>
        </AuthSurface>
      </div>
    </AuthStage>
  );
}

function RegisterScreen() {
  const [role, setRole] = useState(() => getInitialRole("candidate"));
  const [candidateForm, setCandidateForm] = useState({
    email: "",
    displayName: "",
    password: "",
  });
  const [employerForm, setEmployerForm] = useState({
    email: "",
    companyName: "",
    inn: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const activeForm = role === "employer" ? employerForm : candidateForm;

  const updateActiveForm = (field, nextValue) => {
    setSubmitError("");
    setErrors((current) => ({ ...current, [field]: "" }));

    if (role === "employer") {
      setEmployerForm((current) => ({
        ...current,
        [field]: field === "inn" ? nextValue.replace(/\D/g, "").slice(0, 12) : nextValue,
      }));
      return;
    }

    setCandidateForm((current) => ({ ...current, [field]: nextValue }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!emailPattern.test(activeForm.email.trim())) {
      nextErrors.email = role === "employer" ? "Введите корпоративный email" : "Введите корректный email";
    }

    if (role === "employer") {
      if (activeForm.companyName.trim().length < 2) {
        nextErrors.companyName = "Введите название компании";
      }

      if (activeForm.inn.trim().length < 10) {
        nextErrors.inn = "Введите ИНН компании";
      }
    } else if (activeForm.displayName.trim().length < 2) {
      nextErrors.displayName = "Введите имя";
    }

    if (activeForm.password.trim().length < 8) {
      nextErrors.password = "Пароль должен содержать минимум 8 символов";
    }

    return nextErrors;
  };

  return (
    <AuthStage layout="compact" className="auth-stage--register">
      <div className="auth-stage__shell auth-stage__shell--compact">
        <AuthSurface className="auth-screen-card--compact auth-register-card">
          <AuthTopBar backHref="login.html" backLabel="Вернуться ко входу" />
          <AuthHero badge="Регистрация" title="Создайте аккаунт" description="Выберите роль и заполните короткую форму для старта." />

          <form
            className="auth-screen__form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              const nextErrors = validate();

              if (Object.keys(nextErrors).length) {
                setErrors(nextErrors);
                setSubmitError("Заполните обязательные поля.");
                return;
              }

              const flow = role === "employer" ? "register-employer" : "register-candidate";
              redirectWithDelay(`email-confirmation.html?role=${role}&flow=${flow}`, setLoading);
            }}
          >
            <ChoiceGroup
              as="div"
              role="radiogroup"
              legend="Выбор роли"
              className="auth-screen__choice-group"
              contentClassName="auth-screen__stack"
            >
              {loginRoleOptions.map((option) => (
                <AuthOptionCard
                  key={option.value}
                  title={option.title}
                  description={option.description}
                  icon={option.icon}
                  compact
                  checked={role === option.value}
                  onSelect={() => {
                    setRole(option.value);
                    setErrors({});
                    setSubmitError("");
                  }}
                />
              ))}
            </ChoiceGroup>

            <div className="auth-field-grid auth-field-grid--single">
              <FormField
                label={role === "employer" ? "Корпоративный email" : "Email"}
                error={errors.email}
                hint={role === "employer" ? "Используйте рабочую почту компании." : "На этот адрес придёт код подтверждения."}
                required
              >
                <Input
                  type="email"
                  value={activeForm.email}
                  autoComplete="email"
                  placeholder={role === "employer" ? "team@company.ru" : "name@company.ru"}
                  onChange={(event) => updateActiveForm("email", event.target.value)}
                />
              </FormField>

              {role === "employer" ? (
                <>
                  <FormField label="Название компании" error={errors.companyName} required>
                    <Input
                      value={activeForm.companyName}
                      autoComplete="organization"
                      placeholder="Signal Hub"
                      onChange={(event) => updateActiveForm("companyName", event.target.value)}
                    />
                  </FormField>

                  <FormField label="ИНН" error={errors.inn} required>
                    <Input
                      value={activeForm.inn}
                      autoComplete="off"
                      inputMode="numeric"
                      placeholder="7701234567"
                      onChange={(event) => updateActiveForm("inn", event.target.value)}
                    />
                  </FormField>
                </>
              ) : (
                <FormField label="Имя" error={errors.displayName} required>
                  <Input
                    value={activeForm.displayName}
                    autoComplete="name"
                    placeholder="Как к вам обращаться"
                    onChange={(event) => updateActiveForm("displayName", event.target.value)}
                  />
                </FormField>
              )}

              <FormField label="Пароль" error={errors.password} hint="Минимум 8 символов." required>
                <Input
                  type="password"
                  value={activeForm.password}
                  autoComplete="new-password"
                  revealable
                  showPasswordLabel="Показать пароль"
                  hidePasswordLabel="Скрыть пароль"
                  showPasswordText="Показать"
                  hidePasswordText="Скрыть"
                  placeholder="Минимум 8 символов"
                  onChange={(event) => updateActiveForm("password", event.target.value)}
                />
              </FormField>
            </div>

            {submitError ? (
              <Alert tone="error" showIcon title="Проверьте форму">
                {submitError}
              </Alert>
            ) : null}

            <div className="auth-screen__actions">
              <Button type="submit" loading={loading}>
                Зарегистрироваться
              </Button>
            </div>
          </form>
        </AuthSurface>
      </div>
    </AuthStage>
  );
}

function RegisterScreenRefined() {
  const [role, setRole] = useState(() => getInitialRole("candidate"));
  const [candidateForm, setCandidateForm] = useState({
    email: "",
    displayName: "",
    password: "",
  });
  const [employerForm, setEmployerForm] = useState({
    email: "",
    companyName: "",
    inn: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const activeForm = role === "employer" ? employerForm : candidateForm;

  const updateActiveForm = (field, nextValue) => {
    setSubmitError("");
    setErrors((current) => ({ ...current, [field]: "" }));

    if (role === "employer") {
      setEmployerForm((current) => ({
        ...current,
        [field]: field === "inn" ? nextValue.replace(/\D/g, "").slice(0, 12) : nextValue,
      }));
      return;
    }

    setCandidateForm((current) => ({ ...current, [field]: nextValue }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!emailPattern.test(activeForm.email.trim())) {
      nextErrors.email = role === "employer" ? "Введите корпоративный email" : "Введите корректный email";
    }

    if (role === "employer") {
      if (activeForm.companyName.trim().length < 2) {
        nextErrors.companyName = "Введите название компании";
      }

      if (activeForm.inn.trim().length < 10) {
        nextErrors.inn = "Введите ИНН компании";
      }
    } else if (activeForm.displayName.trim().length < 2) {
      nextErrors.displayName = "Введите имя";
    }

    if (activeForm.password.trim().length < 8) {
      nextErrors.password = "Пароль должен содержать минимум 8 символов";
    }

    return nextErrors;
  };

  return (
    <AuthStage layout="compact" className="auth-stage--register">
      <div className="auth-stage__shell auth-stage__shell--compact">
        <AuthSurface className="auth-screen-card--compact auth-register-card">
          <AuthTopBar backHref="login.html" backLabel="Вернуться ко входу" />
          <AuthHero centered className="auth-register-hero" title="Регистрация" description="Выберите роль для регистрации" />

          <form
            className="auth-screen__form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              const nextErrors = validate();

              if (Object.keys(nextErrors).length) {
                setErrors(nextErrors);
                setSubmitError("Заполните обязательные поля.");
                return;
              }

              const flow = role === "employer" ? "register-employer" : "register-candidate";
              redirectWithDelay(`email-confirmation.html?role=${role}&flow=${flow}`, setLoading);
            }}
          >
            <ChoiceGroup
              as="div"
              role="radiogroup"
              className="auth-screen__choice-group auth-register-choice-group"
              contentClassName="auth-screen__stack"
            >
              {loginRoleOptions.map((option) => (
                <AuthOptionCard
                  key={option.value}
                  title={option.title}
                  description={option.description}
                  icon={option.icon}
                  compact
                  showIndicator={false}
                  className="auth-register-option"
                  checked={role === option.value}
                  onSelect={() => {
                    setRole(option.value);
                    setErrors({});
                    setSubmitError("");
                  }}
                />
              ))}
            </ChoiceGroup>

            <div className="auth-field-grid auth-field-grid--single auth-register-field-grid">
              <FormField
                label={role === "employer" ? "Корпоративный Email" : "Email"}
                error={errors.email}
                required
                className="auth-register-field"
              >
                <Input
                  type="email"
                  value={activeForm.email}
                  autoComplete="email"
                  className="auth-register-input"
                  shellClassName="auth-register-input-shell"
                  placeholder={role === "employer" ? "Введите корпоративный Email" : "Введите Email"}
                  onChange={(event) => updateActiveForm("email", event.target.value)}
                />
              </FormField>

              {role === "employer" ? (
                <>
                  <FormField label="Название компании" error={errors.companyName} required className="auth-register-field">
                    <Input
                      value={activeForm.companyName}
                      autoComplete="organization"
                      className="auth-register-input"
                      placeholder="Введите название компании"
                      onChange={(event) => updateActiveForm("companyName", event.target.value)}
                    />
                  </FormField>

                  <FormField label="ИНН" error={errors.inn} required className="auth-register-field">
                    <Input
                      value={activeForm.inn}
                      autoComplete="off"
                      inputMode="numeric"
                      className="auth-register-input"
                      placeholder="Введите ИНН"
                      onChange={(event) => updateActiveForm("inn", event.target.value)}
                    />
                  </FormField>
                </>
              ) : (
                <FormField label="Имя" error={errors.displayName} required className="auth-register-field">
                  <Input
                    value={activeForm.displayName}
                    autoComplete="name"
                    className="auth-register-input"
                    placeholder="Введите отображаемое имя"
                    onChange={(event) => updateActiveForm("displayName", event.target.value)}
                  />
                </FormField>
              )}

              <FormField label="Пароль" error={errors.password} required className="auth-register-field">
                <Input
                  type="password"
                  value={activeForm.password}
                  autoComplete="new-password"
                  className="auth-register-input"
                  placeholder="Введите пароль"
                  onChange={(event) => updateActiveForm("password", event.target.value)}
                />
              </FormField>
            </div>

            {submitError ? (
              <Alert tone="error" showIcon title="Проверьте форму">
                {submitError}
              </Alert>
            ) : null}

            <div className="auth-screen__actions auth-register-actions">
              <Button type="submit" loading={loading} className="auth-register-button">
                Зарегистрироваться
              </Button>
            </div>
          </form>
        </AuthSurface>
      </div>
    </AuthStage>
  );
}

function CompanyQuickScreen() {
  const [form, setForm] = useState({
    companyName: "",
    email: "",
    phone: "",
    website: "",
    contactName: "",
    contactRole: "",
    city: "",
    hiringFocus: "interns",
    terms: true,
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (field, nextValue) => {
    setSubmitError("");
    setErrors((current) => ({ ...current, [field]: "" }));
    setForm((current) => ({ ...current, [field]: nextValue }));
  };

  const validate = () => {
    const nextErrors = {};

    if (form.companyName.trim().length < 2) {
      nextErrors.companyName = "Введите название компании";
    }

    if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = "Введите рабочий email";
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "Введите телефон компании";
    }

    if (!form.website.trim()) {
      nextErrors.website = "Укажите сайт или домен";
    }

    if (form.contactName.trim().length < 2) {
      nextErrors.contactName = "Введите контактное лицо";
    }

    if (!form.terms) {
      nextErrors.terms = "Подтвердите, что представляете компанию";
    }

    return nextErrors;
  };

  return (
    <AuthStage layout="flow">
      <div className="auth-stage__shell auth-stage__shell--flow">
        <AuthSurface>
          <AuthTopBar backHref="login.html" backLabel="Вернуться ко входу" />
          <AuthHero
            badge="Регистрация компании"
            title="Быстрый старт для работодателя"
            description="Короткая форма для создания кабинета компании. После подтверждения почты можно перейти в профиль работодателя и собрать витрину по шагам."
          />

          <form
            className="auth-screen__form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              const nextErrors = validate();

              if (Object.keys(nextErrors).length) {
                setErrors(nextErrors);
                setSubmitError("Проверьте обязательные поля перед отправкой.");
                return;
              }

              redirectWithDelay("email-confirmation.html?role=employer&flow=employer-start", setLoading);
            }}
          >
            <div className="auth-field-grid">
              <FormField label="Название компании" error={errors.companyName} required className="auth-field-grid__wide">
                <Input
                  value={form.companyName}
                  autoComplete="organization"
                  placeholder="Например, Север Digital"
                  onChange={(event) => updateField("companyName", event.target.value)}
                />
              </FormField>

              <FormField label="Корпоративная почта" error={errors.email} required>
                <Input
                  type="email"
                  value={form.email}
                  autoComplete="email"
                  placeholder="team@company.ru"
                  onChange={(event) => updateField("email", event.target.value)}
                />
              </FormField>

              <FormField label="Телефон компании" error={errors.phone} required>
                <Input
                  type="tel"
                  value={form.phone}
                  autoComplete="tel"
                  placeholder="+7 (999) 000-00-00"
                  onChange={(event) => updateField("phone", event.target.value)}
                />
              </FormField>

              <FormField label="Сайт или домен" error={errors.website} required>
                <Input
                  type="url"
                  value={form.website}
                  autoComplete="url"
                  placeholder="https://company.ru"
                  onChange={(event) => updateField("website", event.target.value)}
                />
              </FormField>

              <FormField label="Контактное лицо" error={errors.contactName} required>
                <Input
                  value={form.contactName}
                  autoComplete="name"
                  placeholder="Марина Иванова"
                  onChange={(event) => updateField("contactName", event.target.value)}
                />
              </FormField>

              <FormField label="Роль в компании">
                <Input
                  value={form.contactRole}
                  autoComplete="organization-title"
                  placeholder="HR Lead / Recruiter"
                  onChange={(event) => updateField("contactRole", event.target.value)}
                />
              </FormField>

              <FormField label="Город">
                <Input
                  value={form.city}
                  autoComplete="address-level2"
                  placeholder="Санкт-Петербург"
                  onChange={(event) => updateField("city", event.target.value)}
                />
              </FormField>
            </div>

            <ChoiceGroup
              as="div"
              role="radiogroup"
              legend="Кого планируете искать"
              hint="Можно выбрать приоритет первого найма."
              className="auth-screen__choice-group"
              contentClassName="auth-option-grid auth-option-grid--triple"
            >
              {hiringFocusOptions.map((option) => (
                <AuthOptionCard
                  key={option.value}
                  title={option.title}
                  description={option.description}
                  checked={form.hiringFocus === option.value}
                  onSelect={() => updateField("hiringFocus", option.value)}
                />
              ))}
            </ChoiceGroup>

            <FormField error={errors.terms} className="auth-screen__checkbox-field">
              <Checkbox
                checked={form.terms}
                onChange={(event) => updateField("terms", event.target.checked)}
                label="Подтверждаю, что представляю компанию"
                hint="Могу использовать корпоративную почту и домен для подтверждения кабинета работодателя."
              />
            </FormField>

            {submitError ? (
              <Alert tone="error" showIcon title="Форма не отправлена">
                {submitError}
              </Alert>
            ) : null}

            <div className="auth-screen__actions">
              <Button type="submit" loading={loading}>
                Получить код и создать кабинет
              </Button>
              <Button as="a" href="company-registration-extended.html" variant="secondary">
                Открыть расширенную форму
              </Button>
            </div>

            <div className="auth-screen__link-row">
              <p className="ui-type-caption">
                Короткая версия создаёт кабинет быстро. Расширенная форма подходит, если хотите пройти подтверждение компании сразу.
              </p>
              <a className="auth-inline-link" href="login.html">
                Уже есть аккаунт? Войти
              </a>
            </div>
          </form>
        </AuthSurface>

        <AuthSurface aside>
          <AuthHero badge={companyQuickAside.badge} title={companyQuickAside.title} description={companyQuickAside.description} />
          <AuthMetric value={companyQuickAside.metric.value} description={companyQuickAside.metric.description} />
          <AuthList items={companyQuickAside.items} />
          <AuthNote title={companyQuickAside.note.title} accent>
            {companyQuickAside.note.description}
          </AuthNote>
        </AuthSurface>
      </div>
    </AuthStage>
  );
}

function CompanyExtendedScreen() {
  const [form, setForm] = useState({
    companyName: "",
    legalName: "",
    taxId: "",
    email: "",
    website: "",
    phone: "",
    city: "",
    contactName: "",
    contactRole: "",
    companySize: "small",
    about: "",
    firstPublish: "",
    terms: true,
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (field, nextValue) => {
    setSubmitError("");
    setErrors((current) => ({ ...current, [field]: "" }));
    setForm((current) => ({
      ...current,
      [field]: field === "taxId" ? nextValue.replace(/\D/g, "").slice(0, 12) : nextValue,
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (form.companyName.trim().length < 2) {
      nextErrors.companyName = "Введите название компании";
    }

    if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = "Введите корпоративный email";
    }

    if (!form.website.trim()) {
      nextErrors.website = "Укажите сайт компании";
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "Введите телефон компании";
    }

    if (form.contactName.trim().length < 2) {
      nextErrors.contactName = "Введите контактное лицо";
    }

    if (!form.terms) {
      nextErrors.terms = "Подтвердите право представлять компанию";
    }

    return nextErrors;
  };

  return (
    <AuthStage layout="flow">
      <div className="auth-stage__shell auth-stage__shell--flow">
        <AuthSurface>
          <AuthTopBar backHref="company-registration.html" backLabel="Вернуться к короткой форме" />
          <AuthHero
            badge="Расширенная регистрация компании"
            title="Подтвердите компанию сразу"
            description="Эта версия собирает больше данных о компании и контактном лице. После подтверждения почты можно запустить экспресс-проверку без дополнительного шага в личном кабинете."
          />

          <form
            className="auth-screen__form"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              const nextErrors = validate();

              if (Object.keys(nextErrors).length) {
                setErrors(nextErrors);
                setSubmitError("Проверьте обязательные поля перед отправкой.");
                return;
              }

              redirectWithDelay("email-confirmation.html?role=employer&flow=employer-verify", setLoading);
            }}
          >
            <div className="auth-field-grid">
              <FormField label="Название компании" error={errors.companyName} required className="auth-field-grid__wide">
                <Input
                  value={form.companyName}
                  autoComplete="organization"
                  placeholder="Например, Orbit Labs"
                  onChange={(event) => updateField("companyName", event.target.value)}
                />
              </FormField>

              <FormField label="Юридическое название">
                <Input
                  value={form.legalName}
                  autoComplete="organization"
                  placeholder='ООО "Орбит Лабс"'
                  onChange={(event) => updateField("legalName", event.target.value)}
                />
              </FormField>

              <FormField label="ИНН / регистрационный номер">
                <Input
                  value={form.taxId}
                  autoComplete="off"
                  inputMode="numeric"
                  placeholder="7701234567"
                  onChange={(event) => updateField("taxId", event.target.value)}
                />
              </FormField>

              <FormField label="Корпоративная почта" error={errors.email} required>
                <Input
                  type="email"
                  value={form.email}
                  autoComplete="email"
                  placeholder="careers@orbitlabs.ai"
                  onChange={(event) => updateField("email", event.target.value)}
                />
              </FormField>

              <FormField label="Сайт компании" error={errors.website} required>
                <Input
                  type="url"
                  value={form.website}
                  autoComplete="url"
                  placeholder="https://orbitlabs.ai"
                  onChange={(event) => updateField("website", event.target.value)}
                />
              </FormField>

              <FormField label="Телефон компании" error={errors.phone} required>
                <Input
                  type="tel"
                  value={form.phone}
                  autoComplete="tel"
                  placeholder="+7 (999) 000-00-00"
                  onChange={(event) => updateField("phone", event.target.value)}
                />
              </FormField>

              <FormField label="Город">
                <Input
                  value={form.city}
                  autoComplete="address-level2"
                  placeholder="Казань"
                  onChange={(event) => updateField("city", event.target.value)}
                />
              </FormField>

              <FormField label="Контактное лицо" error={errors.contactName} required>
                <Input
                  value={form.contactName}
                  autoComplete="name"
                  placeholder="Алина Смирнова"
                  onChange={(event) => updateField("contactName", event.target.value)}
                />
              </FormField>

              <FormField label="Роль контактного лица">
                <Input
                  value={form.contactRole}
                  autoComplete="organization-title"
                  placeholder="HR BP / Recruiter"
                  onChange={(event) => updateField("contactRole", event.target.value)}
                />
              </FormField>
            </div>

            <ChoiceGroup
              as="div"
              role="radiogroup"
              legend="Размер компании"
              hint="Для калибровки профиля работодателя."
              className="auth-screen__choice-group"
              contentClassName="auth-option-grid auth-option-grid--double"
            >
              {companySizeOptions.map((option) => (
                <AuthOptionCard
                  key={option.value}
                  title={option.title}
                  description={option.description}
                  checked={form.companySize === option.value}
                  onSelect={() => updateField("companySize", option.value)}
                />
              ))}
            </ChoiceGroup>

            <div className="auth-field-grid">
              <FormField label="Чем занимается компания" className="auth-field-grid__wide">
                <Textarea
                  value={form.about}
                  autoResize
                  placeholder="Коротко опишите продукт, стек, карьерные направления и типы вакансий."
                  onChange={(event) => updateField("about", event.target.value)}
                />
              </FormField>

              <FormField label="Что хотите публиковать в первую очередь" className="auth-field-grid__wide">
                <Input
                  value={form.firstPublish}
                  placeholder="Вакансии, стажировки, мероприятия, программы амбассадоров"
                  onChange={(event) => updateField("firstPublish", event.target.value)}
                />
              </FormField>
            </div>

            <AuthNote title="Экспресс-проверка" accent>
              После подтверждения email заявка будет считаться полной: это сокращает путь до публикации и убирает отдельный шаг подтверждения компании в кабинете.
            </AuthNote>

            <FormField error={errors.terms} className="auth-screen__checkbox-field">
              <Checkbox
                checked={form.terms}
                onChange={(event) => updateField("terms", event.target.checked)}
                label="Подтверждаю, что могу представлять компанию в сервисе"
                hint="Домен, почта и контактные данные принадлежат работодателю или используются с его согласия."
              />
            </FormField>

            {submitError ? (
              <Alert tone="error" showIcon title="Форма не отправлена">
                {submitError}
              </Alert>
            ) : null}

            <div className="auth-screen__actions">
              <Button type="submit" loading={loading}>
                Подтвердить почту и отправить на проверку
              </Button>
              <Button as="a" href="company-registration.html" variant="secondary">
                Вернуться к короткой форме
              </Button>
            </div>
          </form>
        </AuthSurface>

        <AuthSurface aside>
          <AuthHero badge={companyExtendedAside.badge} title={companyExtendedAside.title} description={companyExtendedAside.description} />
          <AuthMetric value={companyExtendedAside.metric.value} description={companyExtendedAside.metric.description} />
          <AuthList items={companyExtendedAside.items} />
          <AuthNote title={companyExtendedAside.note.title}>{companyExtendedAside.note.description}</AuthNote>
        </AuthSurface>
      </div>
    </AuthStage>
  );
}

function ConfirmScreen() {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const role = getInitialRole("candidate");
  const flow = getSearchParam("flow");
  const view = useMemo(() => getConfirmView(role, flow), [flow, role]);

  return (
    <AuthStage layout="single">
      <div className="auth-stage__shell auth-stage__shell--single">
        <AuthSurface className="auth-screen-card--confirm">
          <AuthTopBar backHref={view.backHref} backLabel="Вернуться назад" />
          <AuthHero badge="Подтверждение" title={view.title} description={view.description} centered />

          <form
            className="auth-screen__form auth-screen__form--confirm"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              const incomplete = digits.some((digit) => digit.length !== 1);

              if (incomplete) {
                setMessage({
                  tone: "error",
                  title: "Код не заполнен",
                  text: "Введите все 4 цифры кода подтверждения.",
                });
                return;
              }

              redirectWithDelay(view.action, setLoading);
            }}
          >
            <AuthCodeInput
              value={digits}
              onChange={(nextDigits) => {
                setDigits(nextDigits);
                setMessage(null);
              }}
            />

            {message ? (
              <Alert tone={message.tone} showIcon title={message.title}>
                {message.text}
              </Alert>
            ) : null}

            <Button type="submit" size="lg" loading={loading}>
              {view.submitLabel}
            </Button>

            <div className="auth-screen__confirm-actions">
              <button
                type="button"
                className="auth-inline-button"
                onClick={() => {
                  setMessage({
                    tone: "success",
                    title: "Код отправлен повторно",
                    text: "Проверьте почту и папку со спамом, если письмо не появилось сразу.",
                  });
                }}
              >
                Отправить код ещё раз
              </button>
              <a className="auth-inline-link" href={view.backHref}>
                Вернуться к форме
              </a>
            </div>
          </form>
        </AuthSurface>
      </div>
    </AuthStage>
  );
}

function ConfirmScreenRefined() {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const role = getInitialRole("candidate");
  const flow = getSearchParam("flow");
  const view = useMemo(() => getConfirmView(role, flow), [flow, role]);

  return (
    <AuthStage layout="compact" className="auth-stage--confirm-refined">
      <div className="auth-stage__shell auth-stage__shell--compact">
        <AuthSurface className="auth-screen-card--compact auth-confirm-card">
          <AuthTopBar backHref={view.backHref} backLabel="Вернуться назад" />
          <AuthHero centered className="auth-confirm-hero" title={view.title} description={view.description} />

          <form
            className="auth-screen__form auth-screen__form--confirm"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              const incomplete = digits.some((digit) => digit.length !== 1);

              if (incomplete) {
                setMessage({
                  tone: "error",
                  title: "Код не заполнен",
                  text: "Введите все 4 цифры кода подтверждения.",
                });
                return;
              }

              redirectWithDelay(view.action, setLoading);
            }}
          >
            <AuthCodeInput
              className="auth-confirm-code"
              value={digits}
              onChange={(nextDigits) => {
                setDigits(nextDigits);
                setMessage(null);
              }}
            />

            {message ? (
              <Alert tone={message.tone} showIcon title={message.title}>
                {message.text}
              </Alert>
            ) : null}

            <Button type="submit" size="lg" loading={loading} className="auth-confirm-button">
              {view.submitLabel}
            </Button>
          </form>
        </AuthSurface>
      </div>
    </AuthStage>
  );
}

const screenMap = {
  login: LoginScreen,
  "login-details": LoginDetailsScreen,
  register: RegisterScreenRefined,
  "company-quick": CompanyQuickScreen,
  "company-extended": CompanyExtendedScreen,
  confirm: ConfirmScreenRefined,
};

export function AuthApp({ page = "login" }) {
  const Screen = screenMap[page] ?? LoginScreen;
  return <Screen />;
}
