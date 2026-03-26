import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLink } from "../app/AppLink";
import { buildAuthLoginRoute, buildConfirmEmailRoute, buildForgotPasswordRoute, buildResetPasswordRoute, routes } from "../app/routes";
import "./auth.css";
import { Alert, Button, Checkbox, ChoiceGroup, FormField, Input, Textarea } from "../shared/ui";
import { AuthCodeInput, AuthHero, AuthList, AuthMetric, AuthNote, AuthOptionCard, AuthStage, AuthSurface, AuthTopBar } from "../components/auth";
import { ApiError } from "../lib/http";
import {
  confirmEmailVerification,
  lookupEmployerInn,
  requestPasswordReset,
  resendEmailVerification,
  submitLogin,
  submitPasswordReset,
  submitRegistration,
} from "./api";
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
import { useBodyClass } from "../shared/lib/useBodyClass";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const innPattern = /^\d{10,12}$/;
const quickAside = companyQuickAside;

function validateRegistrationPassword(password) {
  if (password.length < 8) {
    return "Пароль должен содержать минимум 8 символов";
  }

  if (!/[A-Z]/.test(password)) {
    return "Добавьте хотя бы одну заглавную букву";
  }

  if (!/[a-z]/.test(password)) {
    return "Добавьте хотя бы одну строчную букву";
  }

  if (!/\d/.test(password)) {
    return "Добавьте хотя бы одну цифру";
  }

  return "";
}

function getSearchParam(name) {
  if (typeof window === "undefined") {
    return null;
  }

  return new URLSearchParams(window.location.search).get(name);
}

function getInitialRole(defaultRole = "candidate") {
  const role = getSearchParam("role");
  if (role === "employer" || role === "company") {
    return "employer";
  }

  if (role === "curator" || role === "moderator") {
    return "curator";
  }

  return defaultRole;
}

function buildConfirmationTarget({ role, flow, email }) {
  return buildConfirmEmailRoute({ role, flow, email: email.trim() });
}

function normalizeInnInput(value) {
  return value.replace(/\D/g, "").slice(0, 12);
}

function maskEmail(email) {
  const [localPart = "", domain = ""] = email.trim().split("@");

  if (!localPart || !domain) {
    return email;
  }

  if (localPart.length <= 2) {
    return `${localPart[0] ?? ""}***@${domain}`;
  }

  return `${localPart.slice(0, 2)}***${localPart.slice(-1)}@${domain}`;
}

function getEmailDomain(email) {
  const parts = email.trim().toLowerCase().split("@");
  return parts.length === 2 && parts[1] ? parts[1] : "";
}

function getCompanyLookupEmails(lookup) {
  if (!Array.isArray(lookup?.emails)) {
    return [];
  }

  return [...new Set(lookup.emails.filter((value) => typeof value === "string" && value.trim()).map((value) => value.trim().toLowerCase()))];
}

function getCompanyEmailMismatchReason(email, lookup) {
  if (!lookup || !emailPattern.test(email.trim())) {
    return "";
  }

  const normalizedEmail = email.trim().toLowerCase();
  const knownEmails = getCompanyLookupEmails(lookup);

  if (!knownEmails.length) {
    return "В DaData для этой компании нет корпоративной почты, поэтому сверка ИНН и email сейчас невозможна.";
  }

  if (knownEmails.includes(normalizedEmail)) {
    return "";
  }

  const requestedDomain = getEmailDomain(normalizedEmail);
  const knownDomains = [...new Set(knownEmails.map((value) => getEmailDomain(value)).filter(Boolean))];

  if (requestedDomain && knownDomains.includes(requestedDomain)) {
    return "";
  }

  if (knownDomains.length) {
    return `Почта не совпадает с данными DaData для этого ИНН. Используйте корпоративный email на одном из доменов: ${knownDomains.join(", ")}.`;
  }

  return "Почта не совпадает с данными DaData для указанного ИНН.";
}

function redirectWithDelay(target, setLoading, navigate) {
  setLoading(true);
  window.setTimeout(() => {
    navigate(target);
  }, AUTH_DELAY_MS);
}

function navigateTo(target, navigate) {
  navigate(target);
}

function getSubmitErrorMessage(error, fallbackMessage) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

function getApiErrorData(error) {
  return error instanceof ApiError && error.data && typeof error.data === "object" ? error.data : null;
}

async function submitAndNavigate({ action, target, resolveTarget, onSuccess, navigate, setLoading, setSubmitError, fallbackMessage }) {
  setLoading(true);
  setSubmitError("");

  try {
    const result = await action();
    onSuccess?.(result);

    const nextTarget = typeof resolveTarget === "function" ? resolveTarget(result) : target;
    if (nextTarget) {
      navigateTo(nextTarget, navigate);
    } else {
      setLoading(false);
    }

    return result;
  } catch (error) {
    setLoading(false);
    setSubmitError(getSubmitErrorMessage(error, fallbackMessage));
    return null;
  }
}

function buildEmployerVerificationData(payload) {
  return JSON.stringify(payload);
}

function isEmployerInnValid(value) {
  return innPattern.test(value.trim());
}

function isEmployerRole(role) {
  return role === "employer";
}

function buildEmailVerificationMessage(result) {
  const baseMessage =
    typeof result?.message === "string" && result.message.trim()
      ? result.message
      : "Проверьте почту и папку со спамом, если письмо не появилось сразу.";

  if (typeof result?.debugCode === "string" && result.debugCode.trim()) {
    return `${baseMessage} Код для локальной разработки: ${result.debugCode}.`;
  }

  return baseMessage;
}

function buildPasswordResetMessage(result) {
  const baseMessage =
    typeof result?.message === "string" && result.message.trim()
      ? result.message
      : "Проверьте почту и папку со спамом, если письмо не появилось сразу.";

  if (typeof result?.debugCode === "string" && result.debugCode.trim()) {
    return `${baseMessage} Код для локальной разработки: ${result.debugCode}.`;
  }

  return baseMessage;
}

function LoginScreen() {
  const navigate = useNavigate();
  const [role, setRole] = useState(() => getInitialRole("candidate"));
  const [loading, setLoading] = useState(false);
  const currentView = loginRoleViews[role];

  return (
    <AuthStage layout="compact" className="auth-stage--login">
      <div className="auth-stage__shell auth-stage__shell--compact">
        <AuthSurface className="auth-screen-card--compact auth-login-card">
          <AuthTopBar backHref={routes.home} backLabel="Вернуться на главную" backButtonSize="md" />
          <AuthHero
            centered
            className="auth-login-hero"
            badge="Личный кабинет"
            title="Вход"
            description="Выберите роль, чтобы продолжить работу с вакансиями, откликами и карьерным профилем."
            titleClassName="ui-type-h2"
            descriptionClassName="ui-type-body"
          />

          <form
            className="auth-screen__form"
            noValidate
            onSubmit={async (event) => {
              event.preventDefault();
              redirectWithDelay(buildAuthLoginRoute({ role, step: "details" }), setLoading, navigate);
            }}
          >
            <ChoiceGroup
              as="div"
              role="radiogroup"
              legend="Выбор роли"
              compact
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
              <Button type="submit" size="sm" loading={loading} className="auth-login-button">
                Войти
              </Button>
              {currentView.registerHref ? (
                <Button as="a" href={currentView.registerHref} variant="secondary" size="sm" className="auth-login-button auth-login-button--secondary">
                  Зарегистрироваться
                </Button>
              ) : null}
            </div>
          </form>
        </AuthSurface>
      </div>
    </AuthStage>
  );
}

function LoginDetailsScreen() {
  const navigate = useNavigate();
  const [role] = useState(() => getInitialRole("candidate"));
  const [candidateForm, setCandidateForm] = useState({
    email: "",
    password: "",
  });
  const [employerForm, setEmployerForm] = useState({
    inn: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const currentView = loginRoleViews[role];
  const activeForm = isEmployerRole(role) ? employerForm : candidateForm;

  const updateActiveForm = (field, nextValue) => {
    setSubmitError("");
    setErrors((current) => ({ ...current, [field]: "" }));

    if (isEmployerRole(role)) {
      setEmployerForm((current) => ({
        ...current,
        [field]: field === "inn" ? normalizeInnInput(nextValue) : nextValue,
      }));
      return;
    }

    setCandidateForm((current) => ({ ...current, [field]: nextValue }));
  };

  const validate = () => {
    const nextErrors = {};

    if (isEmployerRole(role)) {
      if (!isEmployerInnValid(activeForm.inn)) {
        nextErrors.inn = "Введите ИНН компании";
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
    role === "curator"
      ? "Введите Email и пароль, чтобы открыть кабинет куратора."
      : isEmployerRole(role)
      ? "Введите ИНН и пароль, чтобы открыть кабинет работодателя."
      : "Введите Email и пароль, чтобы открыть личный кабинет соискателя.";

  return (
    <AuthStage layout="compact" className="auth-stage--login-details">
      <div className="auth-stage__shell auth-stage__shell--compact">
        <AuthSurface className="auth-screen-card--compact auth-login-details-card">
          <AuthTopBar backHref={buildAuthLoginRoute({ role })} backLabel="Вернуться к выбору роли" backButtonSize="md" />
          <AuthHero
            centered
            className="auth-login-details-hero"
            title="Вход"
            description={description}
            titleClassName="ui-type-h2"
            descriptionClassName="ui-type-body"
          />

          <form
            className="auth-screen__form"
            noValidate
            onSubmit={async (event) => {
              event.preventDefault();
              const nextErrors = validate();

              if (Object.keys(nextErrors).length) {
                setErrors(nextErrors);
                setSubmitError("Проверьте введённые данные.");
                return;
              }

              setLoading(true);
              setSubmitError("");

              try {
                await submitLogin({
                  role,
                  email: activeForm.email,
                  inn: activeForm.inn,
                  password: activeForm.password,
                });

                navigateTo(currentView.action, navigate);
              } catch (error) {
                const errorData = getApiErrorData(error);

                if (errorData?.requiresEmailVerification && typeof errorData.email === "string" && errorData.email.trim()) {
                  navigateTo(
                    buildConfirmationTarget({
                      role: errorData.role || role,
                      flow: errorData.verificationFlow || (isEmployerRole(role) ? "employer-start" : "register-candidate"),
                      email: errorData.email,
                    }),
                    navigate
                  );
                  return;
                }

                setLoading(false);
                setSubmitError(getSubmitErrorMessage(error, "Не удалось выполнить вход. Проверьте данные и попробуйте снова."));
              }
            }}
          >
            <div className="auth-field-grid auth-field-grid--single auth-login-details-field-grid">
              {isEmployerRole(role) ? (
                <FormField label="ИНН" error={errors.inn} required className="auth-register-field auth-login-details-field">
                  <Input
                    value={activeForm.inn}
                    autoComplete="off"
                    inputMode="numeric"
                    className="auth-register-input auth-login-details-input"
                    placeholder="Введите ИНН"
                    onChange={(event) => updateActiveForm("inn", event.target.value)}
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

            {role === "curator" ? (
              <Alert tone="info" showIcon title="Доступ куратора">
                Учётную запись куратора выдаёт администратор. Для local dev можно использовать `demo-curator@tramplin.local` / `Curator1234`.
              </Alert>
            ) : null}

            {submitError ? (
              <Alert tone="error" showIcon title="Не удалось войти">
                {submitError}
              </Alert>
            ) : null}

            <div className="auth-screen__confirm-actions">
              <AppLink className="auth-inline-link" href={buildForgotPasswordRoute()}>
                Р—Р°Р±С‹Р»Рё РїР°СЂРѕР»СЊ?
              </AppLink>
            </div>

            <div className="auth-screen__actions auth-login-details-actions">
              <Button type="submit" size="sm" loading={loading} className="auth-register-button auth-login-details-button">
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
  const navigate = useNavigate();
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
  const [innLookup, setInnLookup] = useState(null);
  const [innLookupLoading, setInnLookupLoading] = useState(false);
  const [innLookupMessage, setInnLookupMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const _quickAsideRegister = {
    badge: "Быстрая регистрация",
    title: "Как устроен старт",
    description:
      "Короткая форма открывает кабинет после сверки ИНН и рабочей почты через DaData. Остальные данные компании можно заполнить уже после входа.",
    metric: {
      value: "3 шага",
      description: "ИНН в DaData, корпоративный email и код из письма для входа в кабинет",
    },
    items: [
      {
        title: "Шаг 1. Проверка ИНН",
        description: "Находим компанию в DaData и подтверждаем, что организация активна.",
      },
      {
        title: "Шаг 2. Сверка почты",
        description: "Рабочий email должен совпадать с корпоративной почтой или доменом компании.",
      },
      {
        title: "Шаг 3. Подтверждение кода",
        description: "После кода из письма кабинет откроется сразу, а профиль можно дополнить внутри.",
      },
    ],
    note: {
      title: "Нужно больше полей?",
      description:
        "Расширенная форма поможет сразу сохранить сайт, контакты и описание компании, но публикации всё равно настраиваются уже в кабинете.",
    },
  };
  const _quickAside = {
    badge: "Быстрая регистрация",
    title: "Как устроен старт",
    description:
      "Короткая форма открывает кабинет после сверки ИНН и рабочей почты через DaData. Остальные данные компании можно заполнить уже после входа.",
    metric: {
      value: "3 шага",
      description: "ИНН в DaData, корпоративный email и код из письма для входа в кабинет",
    },
    items: [
      {
        title: "Шаг 1. Проверка ИНН",
        description: "Находим компанию в DaData и подтверждаем, что организация активна.",
      },
      {
        title: "Шаг 2. Сверка почты",
        description: "Рабочий email должен совпадать с корпоративной почтой или доменом компании.",
      },
      {
        title: "Шаг 3. Подтверждение кода",
        description: "После кода из письма кабинет откроется сразу, а профиль можно дополнить внутри.",
      },
    ],
    note: {
      title: "Нужно больше полей?",
      description:
        "Расширенная форма поможет сразу сохранить сайт, контакты и описание компании, но публикации всё равно настраиваются уже в кабинете.",
    },
  };
  const activeForm = role === "employer" ? employerForm : candidateForm;

  const updateActiveForm = (field, nextValue) => {
    setSubmitError("");
    setErrors((current) => ({ ...current, [field]: "" }));

    if (role === "employer") {
      if (field === "inn") {
        setInnLookup(null);
        setInnLookupMessage("");
      }

      setEmployerForm((current) => ({
        ...current,
        [field]: field === "inn" ? normalizeInnInput(nextValue) : nextValue,
      }));
      return;
    }

    setCandidateForm((current) => ({ ...current, [field]: nextValue }));
  };

  const runEmployerInnLookup = async (innValue) => {
    const normalizedInn = normalizeInnInput(innValue);

    if (!innPattern.test(normalizedInn)) {
      setErrors((current) => ({ ...current, inn: "Введите ИНН компании" }));
      setInnLookup(null);
      setInnLookupMessage("");
      return null;
    }

    setInnLookupLoading(true);
    setErrors((current) => ({ ...current, inn: "" }));
    setSubmitError("");

    try {
      const result = await lookupEmployerInn(normalizedInn);
      setInnLookup(result);
      setInnLookupMessage(result.legalName ? `DaData: ${result.legalName}` : "ИНН подтвержден через DaData.");
      setEmployerForm((current) => ({
        ...current,
        inn: normalizedInn,
        companyName: current.companyName.trim() ? current.companyName : result.companyName || current.companyName,
      }));
      return result;
    } catch (error) {
      setInnLookup(null);
      setInnLookupMessage("");
      setErrors((current) => ({ ...current, inn: getSubmitErrorMessage(error, "Не удалось проверить ИНН.") }));
      return null;
    } finally {
      setInnLookupLoading(false);
    }
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

      if (![10, 12].includes(activeForm.inn.trim().length)) {
        nextErrors.inn = "Введите ИНН компании";
      }
    } else if (activeForm.displayName.trim().length < 2) {
      nextErrors.displayName = "Введите имя";
    }

    const passwordError = validateRegistrationPassword(activeForm.password);
    if (passwordError) {
      nextErrors.password = passwordError;
    }

    return nextErrors;
  };

  return (
    <AuthStage layout="compact" className="auth-stage--register">
      <div className="auth-stage__shell auth-stage__shell--compact">
        <AuthSurface className="auth-screen-card--compact auth-register-card">
          <AuthTopBar backHref="/auth/login" backLabel="Вернуться ко входу" />
          <AuthHero badge="Регистрация" title="Создайте аккаунт" description="Выберите роль и заполните короткую форму для старта." />

          <form
            className="auth-screen__form"
            noValidate
            onSubmit={async (event) => {
              event.preventDefault();
              const nextErrors = validate();

              if (Object.keys(nextErrors).length) {
                setErrors(nextErrors);
                setSubmitError("Исправьте ошибки в форме.");
                return;
              }

              const flow = role === "employer" ? "register-employer" : "register-candidate";
              await submitAndNavigate({
                action: () =>
                  submitRegistration({
                    role,
                    email: activeForm.email,
                    password: activeForm.password,
                    displayName: activeForm.displayName,
                    companyName: activeForm.companyName,
                    inn: activeForm.inn,
                  }),
                resolveTarget: (result) =>
                  buildConfirmationTarget({
                    role,
                    flow: result?.verificationFlow || flow,
                    email: result?.email || activeForm.email,
                  }),
                navigate,
                setLoading,
                setSubmitError,
                fallbackMessage: "Не удалось завершить регистрацию. Попробуйте снова.",
              });
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

              <FormField
                label="Пароль"
                error={errors.password}
                hint="Минимум 8 символов, заглавная и строчная буква, цифра."
                required
              >
                <Input
                  type="password"
                  value={activeForm.password}
                  autoComplete="new-password"
                  revealable
                  showPasswordLabel="Показать пароль"
                  hidePasswordLabel="Скрыть пароль"
                  showPasswordText="Показать"
                  hidePasswordText="Скрыть"
                  placeholder="Например, Password1"
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
  const navigate = useNavigate();
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
  const [innLookup, setInnLookup] = useState(null);
  const [innLookupLoading, setInnLookupLoading] = useState(false);
  const [innLookupMessage, setInnLookupMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const activeForm = role === "employer" ? employerForm : candidateForm;

  const updateActiveForm = (field, nextValue) => {
    setSubmitError("");
    setErrors((current) => ({ ...current, [field]: "" }));

    if (role === "employer") {
      if (field === "inn") {
        setInnLookup(null);
        setInnLookupMessage("");
      }

      setEmployerForm((current) => ({
        ...current,
        [field]: field === "inn" ? normalizeInnInput(nextValue) : nextValue,
      }));
      return;
    }

    setCandidateForm((current) => ({ ...current, [field]: nextValue }));
  };

  const runEmployerInnLookup = async (innValue) => {
    const normalizedInn = normalizeInnInput(innValue);

    if (!innPattern.test(normalizedInn)) {
      setErrors((current) => ({ ...current, inn: "Р’РІРµРґРёС‚Рµ РРќРќ РєРѕРјРїР°РЅРёРё" }));
      setInnLookup(null);
      setInnLookupMessage("");
      return null;
    }

    setInnLookupLoading(true);
    setErrors((current) => ({ ...current, inn: "" }));
    setSubmitError("");

    try {
      const result = await lookupEmployerInn(normalizedInn);
      setInnLookup(result);
      setInnLookupMessage(result.legalName ? `DaData: ${result.legalName}` : "РРќРќ РїРѕРґС‚РІРµСЂР¶РґРµРЅ С‡РµСЂРµР· DaData.");
      setEmployerForm((current) => ({
        ...current,
        inn: normalizedInn,
        companyName: current.companyName.trim() ? current.companyName : result.companyName || current.companyName,
      }));
      return result;
    } catch (error) {
      setInnLookup(null);
      setInnLookupMessage("");
      setErrors((current) => ({ ...current, inn: getSubmitErrorMessage(error, "РќРµ СѓРґР°Р»РѕСЃСЊ РїСЂРѕРІРµСЂРёС‚СЊ РРќРќ.") }));
      return null;
    } finally {
      setInnLookupLoading(false);
    }
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

      if (![10, 12].includes(activeForm.inn.trim().length)) {
        nextErrors.inn = "Введите ИНН компании";
      }
    } else if (activeForm.displayName.trim().length < 2) {
      nextErrors.displayName = "Введите имя";
    }

    const passwordError = validateRegistrationPassword(activeForm.password);
    if (passwordError) {
      nextErrors.password = passwordError;
    }

    return nextErrors;
  };

  return (
    <AuthStage layout="compact" className="auth-stage--register">
      <div className="auth-stage__shell auth-stage__shell--compact">
        <AuthSurface className="auth-screen-card--compact auth-register-card">
          <AuthTopBar backHref={routes.auth.login} backLabel="Вернуться ко входу" backButtonSize="md" />
          <AuthHero centered className="auth-register-hero" title="Регистрация" description="Выберите роль для регистрации" />

          <form
            className="auth-screen__form"
            noValidate
            onSubmit={async (event) => {
              event.preventDefault();
              const nextErrors = validate();

              if (Object.keys(nextErrors).length) {
                setErrors(nextErrors);
                setSubmitError("Исправьте ошибки в форме.");
                return;
              }

              const flow = role === "employer" ? "register-employer" : "register-candidate";
              await submitAndNavigate({
                action: () =>
                  submitRegistration({
                    role,
                    email: activeForm.email,
                    password: activeForm.password,
                    displayName: activeForm.displayName,
                    companyName: activeForm.companyName,
                    inn: activeForm.inn,
                  }),
                resolveTarget: (result) =>
                  buildConfirmationTarget({
                    role,
                    flow: result?.verificationFlow || flow,
                    email: result?.email || activeForm.email,
                  }),
                navigate,
                setLoading,
                setSubmitError,
                fallbackMessage: "Не удалось завершить регистрацию. Попробуйте снова.",
              });
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
                    setInnLookup(null);
                    setInnLookupMessage("");
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

                  <FormField
                    label="ИНН"
                    error={errors.inn}
                    hint={!errors.inn ? innLookupMessage : ""}
                    success={Boolean(innLookup && !errors.inn)}
                    action={
                      <button
                        type="button"
                        className="auth-inline-button"
                        disabled={innLookupLoading}
                        onClick={() => {
                          void runEmployerInnLookup(activeForm.inn);
                        }}
                      >
                        {innLookupLoading ? "Проверяем..." : "Проверить ИНН"}
                      </button>
                    }
                    required
                    className="auth-register-field"
                  >
                    <Input
                      value={activeForm.inn}
                      autoComplete="off"
                      inputMode="numeric"
                      className="auth-register-input"
                      placeholder="Введите ИНН"
                      onChange={(event) => updateActiveForm("inn", event.target.value)}
                      onBlur={() => {
                        if (innPattern.test(activeForm.inn.trim()) && innLookup?.inn !== activeForm.inn.trim()) {
                          void runEmployerInnLookup(activeForm.inn);
                        }
                      }}
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

              <FormField
                label="Пароль"
                error={errors.password}
                hint="Минимум 8 символов, заглавная и строчная буква, цифра."
                required
                className="auth-register-field"
              >
                <Input
                  type="password"
                  value={activeForm.password}
                  autoComplete="new-password"
                  revealable
                  showPasswordLabel="Показать пароль"
                  hidePasswordLabel="Скрыть пароль"
                  showPasswordText="Показать"
                  hidePasswordText="Скрыть"
                  className="auth-register-input"
                  placeholder="Например, Password1"
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

function CompanyQuickScreenLegacy() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: "",
    email: "",
    password: "",
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

    const passwordError = validateRegistrationPassword(form.password);
    if (passwordError) {
      nextErrors.password = passwordError;
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
          <AuthTopBar backHref={routes.auth.login} backLabel="Вернуться ко входу" backButtonSize="md" />
          <AuthHero
            badge="Регистрация компании"
            title="Быстрый старт для работодателя"
            description="Короткая форма для создания кабинета компании. После подтверждения почты можно перейти в профиль работодателя и собрать витрину по шагам."
          />

          <form
            className="auth-screen__form"
            noValidate
            onSubmit={async (event) => {
              event.preventDefault();
              const nextErrors = validate();

              if (Object.keys(nextErrors).length) {
                setErrors(nextErrors);
                setSubmitError("Исправьте ошибки в форме.");
                return;
              }

              await submitAndNavigate({
                action: () =>
                  submitRegistration({
                    role: "employer",
                    email: form.email,
                    password: form.password,
                    companyName: form.companyName,
                    inn: "",
                    legalAddress: form.city,
                    verificationData: buildEmployerVerificationData({
                      phone: form.phone,
                      website: form.website,
                      city: form.city,
                      contactName: form.contactName,
                      contactRole: form.contactRole,
                      hiringFocus: form.hiringFocus,
                    }),
                  }),
                resolveTarget: (result) =>
                  buildConfirmationTarget({
                    role: "employer",
                    flow: result?.verificationFlow || "employer-start",
                    email: result?.email || form.email,
                  }),
                navigate,
                setLoading,
                setSubmitError,
                fallbackMessage: "Не удалось создать аккаунт компании. Попробуйте снова.",
              });
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

            <FormField
              label="Пароль"
              error={errors.password}
              hint="Минимум 8 символов, заглавная и строчная буква, цифра."
              required
            >
              <Input
                type="password"
                value={form.password}
                autoComplete="new-password"
                revealable
                placeholder="Например, Password1"
                onChange={(event) => updateField("password", event.target.value)}
              />
            </FormField>

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
              <Button as="a" href="/auth/register/company/extended" variant="secondary">
                Открыть расширенную форму
              </Button>
            </div>

            <div className="auth-screen__link-row">
              <p className="ui-type-caption">
                Короткая версия создаёт кабинет быстро. Расширенная форма подходит, если хотите пройти подтверждение компании сразу.
              </p>
              <AppLink className="auth-inline-link" href="/auth/login">
                Уже есть аккаунт? Войти
              </AppLink>
            </div>
          </form>
        </AuthSurface>

        <AuthSurface aside>
          <AuthHero badge={quickAside.badge} title={quickAside.title} description={quickAside.description} />
          <AuthMetric value={quickAside.metric.value} description={quickAside.metric.description} />
          <AuthList items={quickAside.items} />
          <AuthNote title={quickAside.note.title} accent>
            {quickAside.note.description}
          </AuthNote>
        </AuthSurface>
      </div>
    </AuthStage>
  );
}

function CompanyQuickScreenRefined() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: "",
    inn: "",
    email: "",
    password: "",
    terms: true,
  });
  const [innLookup, setInnLookup] = useState(null);
  const [innLookupLoading, setInnLookupLoading] = useState(false);
  const [innLookupMessage, setInnLookupMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const quickAside = {
    badge: "Быстрая регистрация",
    title: "Как устроен старт",
    description:
      "Короткая форма открывает кабинет после сверки ИНН и рабочей почты через DaData. Остальные данные компании можно заполнить уже после входа.",
    metric: {
      value: "3 шага",
      description: "ИНН в DaData, корпоративный email и код из письма для входа в кабинет",
    },
    items: [
      {
        title: "Шаг 1. Проверка ИНН",
        description: "Находим компанию в DaData и подтверждаем, что организация активна.",
      },
      {
        title: "Шаг 2. Сверка почты",
        description: "Рабочий email должен совпадать с корпоративной почтой или доменом компании.",
      },
      {
        title: "Шаг 3. Подтверждение кода",
        description: "После кода из письма кабинет откроется сразу, а профиль можно дополнить внутри.",
      },
    ],
    note: {
      title: "Нужно больше полей?",
      description:
        "Расширенная форма поможет сразу сохранить сайт, контакты и описание компании, но публикации всё равно настраиваются уже в кабинете.",
    },
  };

  const updateField = (field, nextValue) => {
    setSubmitError("");
    setErrors((current) => ({ ...current, [field]: "" }));

    if (field === "inn") {
      setInnLookup(null);
      setInnLookupMessage("");
    }

    setForm((current) => ({
      ...current,
      [field]: field === "inn" ? normalizeInnInput(nextValue) : nextValue,
    }));
  };

  const runCompanyInnLookup = async (innValue) => {
    const normalizedInn = normalizeInnInput(innValue);

    if (!innPattern.test(normalizedInn)) {
      setErrors((current) => ({ ...current, inn: "Введите ИНН компании" }));
      setInnLookup(null);
      setInnLookupMessage("");
      return null;
    }

    setInnLookupLoading(true);
    setErrors((current) => ({ ...current, inn: "" }));
    setSubmitError("");

    try {
      const result = await lookupEmployerInn(normalizedInn);
      setInnLookup(result);
      setInnLookupMessage(result.legalName ? `DaData: ${result.legalName}` : "ИНН подтвержден через DaData.");
      setForm((current) => ({
        ...current,
        inn: normalizedInn,
        companyName: current.companyName.trim() ? current.companyName : result.companyName || current.companyName,
      }));
      return result;
    } catch (error) {
      setInnLookup(null);
      setInnLookupMessage("");
      setErrors((current) => ({ ...current, inn: getSubmitErrorMessage(error, "Не удалось проверить ИНН.") }));
      return null;
    } finally {
      setInnLookupLoading(false);
    }
  };

  const validate = () => {
    const nextErrors = {};
    const companyName = form.companyName.trim();

    if (companyName && companyName.length < 2) {
      nextErrors.companyName = "Введите название компании";
    }

    if (!innPattern.test(form.inn.trim())) {
      nextErrors.inn = "Введите ИНН компании";
    }

    if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = "Введите рабочий email";
    }

    const passwordError = validateRegistrationPassword(form.password);
    if (passwordError) {
      nextErrors.password = passwordError;
    }

    if (!form.terms) {
      nextErrors.terms = "Подтвердите, что представляете компанию";
    }

    return nextErrors;
  };

  const validateEmailAgainstInn = (emailValue, lookupValue = innLookup) => {
    const mismatchReason = getCompanyEmailMismatchReason(emailValue, lookupValue);
    if (mismatchReason) {
      setErrors((current) => ({ ...current, email: mismatchReason }));
    }

    return mismatchReason;
  };

  return (
    <AuthStage layout="flow">
      <div className="auth-stage__shell auth-stage__shell--flow">
        <AuthSurface>
          <AuthTopBar backHref={routes.auth.login} backLabel="Вернуться ко входу" />
          <AuthHero
            badge="Регистрация компании"
            title="Быстрый старт для работодателя"
            description="Короткая форма создаёт кабинет по сверке ИНН и рабочей почты через DaData. Полные данные для публикации вакансий вы заполните уже в личном кабинете."
          />

          <form
            className="auth-screen__form"
            noValidate
            onSubmit={async (event) => {
              event.preventDefault();
              const nextErrors = validate();

              if (Object.keys(nextErrors).length) {
                setErrors(nextErrors);
                setSubmitError("Исправьте ошибки в форме.");
                return;
              }

              let resolvedInnLookup = innLookup;
              if (resolvedInnLookup?.inn !== form.inn.trim()) {
                resolvedInnLookup = null;
              }

              if (!resolvedInnLookup) {
                resolvedInnLookup = await runCompanyInnLookup(form.inn);
              }

              if (!resolvedInnLookup) {
                setSubmitError("Сначала подтвердите ИНН компании через DaData.");
                return;
              }

              const emailMismatchReason = validateEmailAgainstInn(form.email, resolvedInnLookup);
              if (emailMismatchReason) {
                setSubmitError("Почта не прошла сверку с ИНН.");
                return;
              }

              await submitAndNavigate({
                action: () =>
                  submitRegistration({
                    role: "employer",
                    email: form.email,
                    password: form.password,
                    companyName: form.companyName.trim() || resolvedInnLookup.companyName || "",
                    inn: resolvedInnLookup.inn,
                    legalAddress: resolvedInnLookup.legalAddress || "",
                  }),
                resolveTarget: (result) =>
                  buildConfirmationTarget({
                    role: "employer",
                    flow: result?.verificationFlow || "employer-start",
                    email: result?.email || form.email,
                  }),
                navigate,
                setLoading,
                setSubmitError,
                fallbackMessage: "Не удалось создать аккаунт компании. Попробуйте снова.",
              });
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

              <FormField
                label="ИНН"
                error={errors.inn}
                hint={!errors.inn ? innLookupMessage : ""}
                success={Boolean(innLookup && !errors.inn)}
                action={
                  <button
                    type="button"
                    className="auth-inline-button"
                    disabled={innLookupLoading}
                    onClick={() => {
                      void runCompanyInnLookup(form.inn);
                    }}
                  >
                    {innLookupLoading ? "Проверяем..." : "Проверить ИНН"}
                  </button>
                }
                required
              >
                <Input
                  value={form.inn}
                  autoComplete="off"
                  inputMode="numeric"
                  placeholder="7701234567"
                  onChange={(event) => updateField("inn", event.target.value)}
                  onBlur={() => {
                    if (innPattern.test(form.inn.trim()) && innLookup?.inn !== form.inn.trim()) {
                      void runCompanyInnLookup(form.inn);
                    }
                  }}
                />
              </FormField>

              <FormField label="Корпоративная почта" error={errors.email} required>
                <Input
                  type="email"
                  value={form.email}
                  autoComplete="email"
                  placeholder="team@company.ru"
                  onChange={(event) => updateField("email", event.target.value)}
                  onBlur={() => {
                    const nextError = getCompanyEmailMismatchReason(form.email, innLookup);
                    if (nextError) {
                      setErrors((current) => ({ ...current, email: nextError }));
                    }
                  }}
                />
              </FormField>
            </div>

            <FormField
              label="Пароль"
              error={errors.password}
              hint="Минимум 8 символов, заглавная и строчная буква, цифра."
              required
            >
              <Input
                type="password"
                value={form.password}
                autoComplete="new-password"
                revealable
                placeholder="Например, Password1"
                onChange={(event) => updateField("password", event.target.value)}
              />
            </FormField>

            <FormField error={errors.terms} className="auth-screen__checkbox-field">
              <Checkbox
                checked={form.terms}
                onChange={(event) => updateField("terms", event.target.checked)}
                label="Подтверждаю, что представляю компанию"
                hint="Регистрация пройдёт после сверки ИНН и рабочей почты через DaData и подтверждения кода из письма."
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
              <Button as="a" href="/auth/register/company/extended" variant="secondary">
                Открыть расширенную форму
              </Button>
            </div>

            <div className="auth-screen__link-row">
              <p className="ui-type-caption">
                Короткая форма открывает доступ в кабинет после сверки ИНН и email. Данные для публикации вакансий можно дополнить уже после входа.
              </p>
              <AppLink className="auth-inline-link" href="/auth/login">
                Уже есть аккаунт? Войти
              </AppLink>
            </div>
          </form>
        </AuthSurface>

        <AuthSurface aside>
          <AuthHero badge={quickAside.badge} title={quickAside.title} description={quickAside.description} />
          <AuthMetric value={quickAside.metric.value} description={quickAside.metric.description} />
          <AuthList items={quickAside.items} />
          <AuthNote title={quickAside.note.title} accent>
            {quickAside.note.description}
          </AuthNote>
        </AuthSurface>
      </div>
    </AuthStage>
  );
}

function CompanyExtendedScreen() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: "",
    legalName: "",
    taxId: "",
    password: "",
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
  const [innLookup, setInnLookup] = useState(null);
  const [innLookupLoading, setInnLookupLoading] = useState(false);
  const [innLookupMessage, setInnLookupMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (field, nextValue) => {
    setSubmitError("");
    setErrors((current) => ({ ...current, [field]: "" }));

    if (field === "taxId") {
      setInnLookup(null);
      setInnLookupMessage("");
    }

    setForm((current) => ({
      ...current,
      [field]: field === "taxId" ? normalizeInnInput(nextValue) : nextValue,
    }));
  };

  const runCompanyInnLookup = async (innValue) => {
    const normalizedInn = normalizeInnInput(innValue);

    if (!innPattern.test(normalizedInn)) {
      setErrors((current) => ({ ...current, taxId: "Введите ИНН компании" }));
      setInnLookup(null);
      setInnLookupMessage("");
      return null;
    }

    setInnLookupLoading(true);
    setErrors((current) => ({ ...current, taxId: "" }));
    setSubmitError("");

    try {
      const result = await lookupEmployerInn(normalizedInn);
      setInnLookup(result);
      setInnLookupMessage(result.legalName ? `DaData: ${result.legalName}` : "ИНН подтвержден через DaData.");
      setForm((current) => ({
        ...current,
        taxId: normalizedInn,
        companyName: current.companyName.trim() ? current.companyName : result.companyName || current.companyName,
        legalName: current.legalName.trim() ? current.legalName : result.legalName || current.legalName,
      }));
      return result;
    } catch (error) {
      setInnLookup(null);
      setInnLookupMessage("");
      setErrors((current) => ({ ...current, taxId: getSubmitErrorMessage(error, "Не удалось проверить ИНН.") }));
      return null;
    } finally {
      setInnLookupLoading(false);
    }
  };

  const validate = () => {
    const nextErrors = {};

    if (form.companyName.trim().length < 2) {
      nextErrors.companyName = "Введите название компании";
    }

    if (!innPattern.test(form.taxId.trim())) {
      nextErrors.taxId = "Введите ИНН компании";
    }

    const passwordError = validateRegistrationPassword(form.password);
    if (passwordError) {
      nextErrors.password = passwordError;
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
          <AuthTopBar backHref={routes.auth.registerCompany} backLabel="Вернуться к короткой форме" />
          <AuthHero
            badge="Расширенная регистрация компании"
            title="Подтвердите компанию сразу"
            description="Эта версия собирает больше данных о компании и контактном лице. После сверки ИНН кабинет откроется сразу, а расширенные сведения попадут в профиль и очередь проверки."
          />

          <form
            className="auth-screen__form"
            noValidate
            onSubmit={async (event) => {
              event.preventDefault();
              const nextErrors = validate();

              if (Object.keys(nextErrors).length) {
                setErrors(nextErrors);
                setSubmitError("Исправьте ошибки в форме.");
                return;
              }

              await submitAndNavigate({
                action: () =>
                  submitRegistration({
                    role: "employer",
                    password: form.password,
                    companyName: form.companyName,
                    inn: form.taxId,
                    legalAddress: innLookup?.legalAddress || "",
                    verificationData: buildEmployerVerificationData({
                      legalName: form.legalName,
                      website: form.website,
                      phone: form.phone,
                      city: form.city,
                      contactName: form.contactName,
                      contactRole: form.contactRole,
                      companySize: form.companySize,
                      about: form.about,
                      firstPublish: form.firstPublish,
                    }),
                  }),
                target: routes.company.dashboard,
                navigate,
                setLoading,
                setSubmitError,
                fallbackMessage: "Не удалось создать аккаунт компании. Попробуйте снова.",
              });
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

              <FormField
                label="ИНН / регистрационный номер"
                error={errors.taxId}
                hint={!errors.taxId ? innLookupMessage : ""}
                success={Boolean(innLookup && !errors.taxId)}
                action={
                  <button
                    type="button"
                    className="auth-inline-button"
                    disabled={innLookupLoading}
                    onClick={() => {
                      void runCompanyInnLookup(form.taxId);
                    }}
                  >
                    {innLookupLoading ? "Проверяем..." : "Проверить ИНН"}
                  </button>
                }
              >
                <Input
                  value={form.taxId}
                  autoComplete="off"
                  inputMode="numeric"
                  placeholder="7701234567"
                  onChange={(event) => updateField("taxId", event.target.value)}
                  onBlur={() => {
                    if (innPattern.test(form.taxId.trim()) && innLookup?.inn !== form.taxId.trim()) {
                      void runCompanyInnLookup(form.taxId);
                    }
                  }}
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

            <FormField
              label="Пароль"
              error={errors.password}
              hint="Минимум 8 символов, заглавная и строчная буква, цифра."
              required
            >
              <Input
                type="password"
                value={form.password}
                autoComplete="new-password"
                revealable
                placeholder="Например, Password1"
                onChange={(event) => updateField("password", event.target.value)}
              />
            </FormField>

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
              После регистрации вы сразу попадёте в кабинет компании. Данные из этой формы сохранятся в профиле и помогут пройти ручную проверку быстрее.
            </AuthNote>

            <FormField error={errors.terms} className="auth-screen__checkbox-field">
              <Checkbox
                checked={form.terms}
                onChange={(event) => updateField("terms", event.target.checked)}
                label="Подтверждаю, что могу представлять компанию в сервисе"
                hint="Контактные данные и сведения о компании принадлежат работодателю или используются с его согласия."
              />
            </FormField>

            {submitError ? (
              <Alert tone="error" showIcon title="Форма не отправлена">
                {submitError}
              </Alert>
            ) : null}

            <div className="auth-screen__actions">
              <Button type="submit" loading={loading}>
                Создать кабинет и отправить данные на проверку
              </Button>
              <Button as="a" href="/auth/register/company" variant="secondary">
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
  const navigate = useNavigate();
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
            onSubmit={async (event) => {
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

              redirectWithDelay(view.action, setLoading, navigate);
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
              <AppLink className="auth-inline-link" href={view.backHref}>
                Вернуться к форме
              </AppLink>
            </div>
          </form>
        </AuthSurface>
      </div>
    </AuthStage>
  );
}

function ConfirmScreenRefined() {
  const navigate = useNavigate();
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const role = getInitialRole("candidate");
  const flow = getSearchParam("flow");
  const email = (getSearchParam("email") || "").trim();
  const view = useMemo(() => getConfirmView(role, flow), [flow, role]);
  const maskedEmail = email ? maskEmail(email) : "";

  return (
    <AuthStage layout="compact" className="auth-stage--confirm-refined">
      <div className="auth-stage__shell auth-stage__shell--compact">
        <AuthSurface className="auth-screen-card--compact auth-confirm-card">
          <AuthTopBar backHref={view.backHref} backLabel="Вернуться назад" />
          <AuthHero centered className="auth-confirm-hero" title={view.title} description={view.description} />

          <form
            className="auth-screen__form auth-screen__form--confirm"
            noValidate
            onSubmit={async (event) => {
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

              if (!email.trim()) {
                setMessage({
                  tone: "error",
                  title: "Не найден email",
                  text: "Вернитесь к форме входа или регистрации и запросите новый код.",
                });
                return;
              }

              setLoading(true);
              setMessage(null);

              try {
                await confirmEmailVerification({
                  email,
                  role,
                  code: digits.join(""),
                });
                navigateTo(view.action, navigate);
              } catch (error) {
                setLoading(false);
                setMessage({
                  tone: "error",
                  title: "Не удалось подтвердить email",
                  text: getSubmitErrorMessage(error, "Попробуйте еще раз."),
                });
              }
            }}
          >
            {maskedEmail ? <p className="ui-type-caption">Код отправлен на {maskedEmail}</p> : null}

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

            <div className="auth-screen__confirm-actions">
              <button
                type="button"
                className="auth-inline-button"
                disabled={resendLoading}
                onClick={async () => {
                  if (!email.trim()) {
                    setMessage({
                      tone: "error",
                      title: "Не найден email",
                      text: "Вернитесь к форме входа или регистрации и запросите новый код.",
                    });
                    return;
                  }

                  setResendLoading(true);
                  setMessage(null);

                  try {
                    const result = await resendEmailVerification({
                      email,
                      role,
                    });

                    setMessage({
                      tone: result?.emailDeliveryFailed ? "error" : "success",
                      title: result?.emailDeliveryFailed ? "Письмо не отправлено" : "Код отправлен повторно",
                      text: buildEmailVerificationMessage(result),
                    });
                  } catch (error) {
                    setMessage({
                      tone: "error",
                      title: "Не удалось отправить код",
                      text: getSubmitErrorMessage(error, "Попробуйте повторить позже."),
                    });
                  } finally {
                    setResendLoading(false);
                  }
                }}
              >
                {resendLoading ? "Отправляем..." : "Отправить код еще раз"}
              </button>
              <AppLink className="auth-inline-link" href={view.backHref}>
                Вернуться к форме
              </AppLink>
            </div>
          </form>
        </AuthSurface>
      </div>
    </AuthStage>
  );
}

function ForgotPasswordScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => (getSearchParam("email") || "").trim());
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <AuthStage layout="compact" className="auth-stage--confirm-refined">
      <div className="auth-stage__shell auth-stage__shell--compact">
        <AuthSurface className="auth-screen-card--compact auth-confirm-card">
          <AuthTopBar backHref={routes.auth.login} backLabel="Вернуться ко входу" />
          <AuthHero
            centered
            className="auth-confirm-hero"
            title="Восстановление пароля"
            description="Введите email аккаунта, и мы отправим код для сброса пароля."
          />

          <form
            className="auth-screen__form auth-screen__form--confirm"
            noValidate
            onSubmit={async (event) => {
              event.preventDefault();

              if (!emailPattern.test(email.trim())) {
                setSubmitError("Введите корректный email.");
                return;
              }

              setLoading(true);
              setSubmitError("");

              try {
                await requestPasswordReset({ email });
                navigateTo(buildResetPasswordRoute({ email: email.trim() }), navigate);
              } catch (error) {
                setLoading(false);
                setSubmitError(getSubmitErrorMessage(error, "Не удалось отправить код для сброса пароля."));
              }
            }}
          >
            <FormField label="Email" error={submitError} required>
              <Input
                type="email"
                value={email}
                autoComplete="email"
                placeholder="Введите email"
                onChange={(event) => {
                  setEmail(event.target.value);
                  setSubmitError("");
                }}
              />
            </FormField>

            <Button type="submit" size="lg" loading={loading} className="auth-confirm-button">
              Отправить код
            </Button>

            <div className="auth-screen__confirm-actions">
              <AppLink className="auth-inline-link" href={routes.auth.login}>
                Вернуться ко входу
              </AppLink>
            </div>
          </form>
        </AuthSurface>
      </div>
    </AuthStage>
  );
}

function ResetPasswordScreen() {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => ({
    email: (getSearchParam("email") || "").trim(),
    code: "",
    password: "",
  }));
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setMessage(null);
  };

  const validate = () => {
    const nextErrors = {};

    if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = "Введите корректный email";
    }

    if (!/^\d{6}$/.test(form.code.trim())) {
      nextErrors.code = "Введите 6 цифр из письма";
    }

    const passwordError = validateRegistrationPassword(form.password);
    if (passwordError) {
      nextErrors.password = passwordError;
    }

    return nextErrors;
  };

  return (
    <AuthStage layout="compact" className="auth-stage--confirm-refined">
      <div className="auth-stage__shell auth-stage__shell--compact">
        <AuthSurface className="auth-screen-card--compact auth-confirm-card">
          <AuthTopBar backHref={buildForgotPasswordRoute({ email: form.email })} backLabel="Вернуться назад" />
          <AuthHero
            centered
            className="auth-confirm-hero"
            title="Новый пароль"
            description="Введите код из письма и задайте новый пароль для входа."
          />

          <form
            className="auth-screen__form auth-screen__form--confirm"
            noValidate
            onSubmit={async (event) => {
              event.preventDefault();
              const nextErrors = validate();

              if (Object.keys(nextErrors).length) {
                setErrors(nextErrors);
                return;
              }

              setLoading(true);
              setMessage(null);

              try {
                const result = await submitPasswordReset(form);

                setMessage({
                  tone: "success",
                  title: "Пароль обновлен",
                  text:
                    typeof result?.message === "string" && result.message.trim()
                      ? result.message
                      : "Теперь можно войти с новым паролем.",
                });
                redirectWithDelay(routes.auth.login, setLoading, navigate);
              } catch (error) {
                setLoading(false);
                setMessage({
                  tone: "error",
                  title: "Не удалось обновить пароль",
                  text: getSubmitErrorMessage(error, "Попробуйте еще раз."),
                });
              }
            }}
          >
            <FormField label="Email" error={errors.email} required>
              <Input
                type="email"
                value={form.email}
                autoComplete="email"
                placeholder="Введите email"
                onChange={(event) => updateField("email", event.target.value)}
              />
            </FormField>

            <FormField label="Код из письма" error={errors.code} required>
              <Input
                value={form.code}
                autoComplete="one-time-code"
                placeholder="Введите 6-значный код"
                onChange={(event) => updateField("code", event.target.value.replace(/\D/g, "").slice(0, 6))}
              />
            </FormField>

            <FormField label="Новый пароль" error={errors.password} required>
              <Input
                type="password"
                value={form.password}
                autoComplete="new-password"
                revealable
                showPasswordLabel="Показать пароль"
                hidePasswordLabel="Скрыть пароль"
                showPasswordText="Показать"
                hidePasswordText="Скрыть"
                placeholder="Введите новый пароль"
                onChange={(event) => updateField("password", event.target.value)}
              />
            </FormField>

            {message ? (
              <Alert tone={message.tone} showIcon title={message.title}>
                {message.text}
              </Alert>
            ) : null}

            <Button type="submit" size="lg" loading={loading} className="auth-confirm-button">
              Сохранить новый пароль
            </Button>

            <div className="auth-screen__confirm-actions">
              <button
                type="button"
                className="auth-inline-button"
                disabled={resendLoading}
                onClick={async () => {
                  if (!emailPattern.test(form.email.trim())) {
                    setErrors((current) => ({ ...current, email: "Введите корректный email" }));
                    return;
                  }

                  setResendLoading(true);
                  setMessage(null);

                  try {
                    const result = await requestPasswordReset({ email: form.email });
                    setMessage({
                      tone: result?.emailDeliveryFailed ? "error" : "success",
                      title: result?.emailDeliveryFailed ? "Письмо не отправлено" : "Код отправлен повторно",
                      text: buildPasswordResetMessage(result),
                    });
                  } catch (error) {
                    setMessage({
                      tone: "error",
                      title: "Не удалось отправить код",
                      text: getSubmitErrorMessage(error, "Попробуйте повторить позже."),
                    });
                  } finally {
                    setResendLoading(false);
                  }
                }}
              >
                {resendLoading ? "Отправляем..." : "Отправить код еще раз"}
              </button>
              <AppLink className="auth-inline-link" href={routes.auth.login}>
                Вернуться ко входу
              </AppLink>
            </div>
          </form>
        </AuthSurface>
      </div>
    </AuthStage>
  );
}

function CompanyQuickScreenCompact() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: "",
    inn: "",
    password: "",
  });
  const [innLookup, setInnLookup] = useState(null);
  const [innLookupLoading, setInnLookupLoading] = useState(false);
  const [innLookupMessage, setInnLookupMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (field, nextValue) => {
    setSubmitError("");
    setErrors((current) => ({ ...current, [field]: "" }));

    if (field === "inn") {
      setInnLookup(null);
      setInnLookupMessage("");
    }

    setForm((current) => ({
      ...current,
      [field]: field === "inn" ? normalizeInnInput(nextValue) : nextValue,
    }));
  };

  const runCompanyInnLookup = async (innValue) => {
    const normalizedInn = normalizeInnInput(innValue);

    if (!innPattern.test(normalizedInn)) {
      setErrors((current) => ({ ...current, inn: "Введите ИНН компании" }));
      setInnLookup(null);
      setInnLookupMessage("");
      return null;
    }

    setInnLookupLoading(true);
    setErrors((current) => ({ ...current, inn: "" }));
    setSubmitError("");

    try {
      const result = await lookupEmployerInn(normalizedInn);
      setInnLookup(result);
      setInnLookupMessage(result.legalName ? `DaData: ${result.legalName}` : "ИНН подтвержден через DaData.");
      setForm((current) => ({
        ...current,
        inn: normalizedInn,
        companyName: current.companyName.trim() ? current.companyName : result.companyName || current.companyName,
      }));
      return result;
    } catch (error) {
      setInnLookup(null);
      setInnLookupMessage("");
      setErrors((current) => ({ ...current, inn: getSubmitErrorMessage(error, "Не удалось проверить ИНН.") }));
      return null;
    } finally {
      setInnLookupLoading(false);
    }
  };

  const validate = () => {
    const nextErrors = {};
    const companyName = (form.companyName.trim() || innLookup?.companyName || "").trim();

    if (companyName.length < 2) {
      nextErrors.companyName = "Введите название компании";
    }

    if (!innPattern.test(form.inn.trim())) {
      nextErrors.inn = "Введите ИНН компании";
    }

    const passwordError = validateRegistrationPassword(form.password);
    if (passwordError) {
      nextErrors.password = passwordError;
    }

    return nextErrors;
  };

  return (
    <AuthStage layout="compact" className="auth-stage--register">
      <div className="auth-stage__shell auth-stage__shell--compact">
        <AuthSurface className="auth-screen-card--compact auth-register-card">
          <AuthTopBar backHref={routes.auth.login} backLabel="Вернуться ко входу" />
          <AuthHero
            centered
            className="auth-register-hero"
            title="Регистрация"
            description="Выберите роль и заполните форму компании. После сверки ИНН кабинет работодателя откроется сразу."
            titleClassName="ui-type-h2"
            descriptionClassName="ui-type-body"
          />

          <form
            className="auth-screen__form"
            noValidate
            onSubmit={async (event) => {
              event.preventDefault();
              const nextErrors = validate();

              if (Object.keys(nextErrors).length) {
                setErrors(nextErrors);
                setSubmitError("Исправьте ошибки в форме.");
                return;
              }

              let resolvedInnLookup = innLookup;
              if (resolvedInnLookup?.inn !== form.inn.trim()) {
                resolvedInnLookup = null;
              }

              if (!resolvedInnLookup) {
                resolvedInnLookup = await runCompanyInnLookup(form.inn);
              }

              if (!resolvedInnLookup) {
                setSubmitError("Сначала подтвердите ИНН компании через DaData.");
                return;
              }

              await submitAndNavigate({
                action: () =>
                  submitRegistration({
                    role: "employer",
                    password: form.password,
                    companyName: form.companyName.trim() || resolvedInnLookup.companyName || "",
                    inn: resolvedInnLookup.inn,
                    legalAddress: resolvedInnLookup.legalAddress || "",
                  }),
                target: routes.company.dashboard,
                navigate,
                setLoading,
                setSubmitError,
                fallbackMessage: "Не удалось создать аккаунт компании. Попробуйте снова.",
              });
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
                  checked={option.value === "employer"}
                  onSelect={() => {
                    if (option.value === "candidate") {
                      navigateTo(routes.auth.registerCandidate, navigate);
                    }
                  }}
                />
              ))}
            </ChoiceGroup>

            <div className="auth-field-grid auth-field-grid--single auth-register-field-grid">
              <FormField
                label="Название компании"
                error={errors.companyName}
                hint={!errors.companyName && innLookup?.companyName ? `DaData: ${innLookup.companyName}` : ""}
                required
                className="auth-register-field"
              >
                <Input
                  value={form.companyName}
                  autoComplete="organization"
                  className="auth-register-input"
                  placeholder="Введите название компании"
                  onChange={(event) => updateField("companyName", event.target.value)}
                />
              </FormField>

              <FormField
                label="ИНН"
                error={errors.inn}
                hint={!errors.inn ? innLookupMessage : ""}
                success={Boolean(innLookup && !errors.inn)}
                action={
                  <button
                    type="button"
                    className="auth-inline-button"
                    disabled={innLookupLoading}
                    onClick={() => {
                      void runCompanyInnLookup(form.inn);
                    }}
                  >
                    {innLookupLoading ? "Проверяем..." : "Проверить ИНН"}
                  </button>
                }
                required
                className="auth-register-field"
              >
                <Input
                  value={form.inn}
                  autoComplete="off"
                  inputMode="numeric"
                  className="auth-register-input"
                  placeholder="Введите ИНН"
                  onChange={(event) => updateField("inn", event.target.value)}
                  onBlur={() => {
                    if (innPattern.test(form.inn.trim()) && innLookup?.inn !== form.inn.trim()) {
                      void runCompanyInnLookup(form.inn);
                    }
                  }}
                />
              </FormField>

              <FormField
                label="Пароль"
                error={errors.password}
                hint="Минимум 8 символов, заглавная и строчная буква, цифра."
                required
                className="auth-register-field"
              >
                <Input
                  type="password"
                  value={form.password}
                  autoComplete="new-password"
                  revealable
                  showPasswordLabel="Показать пароль"
                  hidePasswordLabel="Скрыть пароль"
                  showPasswordText="Показать"
                  hidePasswordText="Скрыть"
                  shellClassName="auth-register-input-shell"
                  className="auth-register-input"
                  placeholder="Введите пароль"
                  onChange={(event) => updateField("password", event.target.value)}
                />
              </FormField>
            </div>

            {submitError ? (
              <Alert tone="error" showIcon title="Проверьте данные компании">
                {submitError}
              </Alert>
            ) : null}

            <div className="auth-screen__actions auth-register-actions">
              <Button type="submit" size="sm" loading={loading} className="auth-register-button">
                Создать кабинет
              </Button>
            </div>

            <div className="auth-screen__link-row">
              <p className="ui-type-caption">
                Полное подтверждение компании и публикации вакансий настраиваются уже в личном кабинете.
              </p>
              <AppLink className="auth-inline-link" href={routes.auth.registerCompanyExtended}>
                Открыть расширенную форму
              </AppLink>
              <AppLink className="auth-inline-link" href={routes.auth.login}>
                Уже есть аккаунт? Войти
              </AppLink>
            </div>
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
  "company-quick": CompanyQuickScreenCompact,
  "company-extended": CompanyExtendedScreen,
  confirm: ConfirmScreenRefined,
  "forgot-password": ForgotPasswordScreen,
  "reset-password": ResetPasswordScreen,
};

export function AuthApp({ page = "login" }) {
  useBodyClass("auth-react-body");

  const Screen = screenMap[page] ?? LoginScreen;
  return <Screen />;
}
