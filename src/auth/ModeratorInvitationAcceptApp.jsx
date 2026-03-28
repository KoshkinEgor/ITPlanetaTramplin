import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { routes } from "../app/routes";
import { Alert, Button, FormField, Input } from "../shared/ui";
import { AuthHero, AuthNote, AuthStage, AuthSurface, AuthTopBar } from "../components/auth";
import { acceptModeratorInvitation, getModeratorInvitationDetails } from "./api";
import "./auth.css";
import "./moderator-invitation-accept.css";

function validatePassword(password) {
  if (password.length < 8) {
    return "Пароль должен содержать минимум 8 символов.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Добавьте хотя бы одну заглавную букву.";
  }

  if (!/[a-z]/.test(password)) {
    return "Добавьте хотя бы одну строчную букву.";
  }

  if (!/\d/.test(password)) {
    return "Добавьте хотя бы одну цифру.";
  }

  return "";
}

export function ModeratorInvitationAcceptApp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [state, setState] = useState({ status: "loading", invitation: null, error: "" });
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [submitState, setSubmitState] = useState({ status: "idle", error: "" });

  useEffect(() => {
    if (!token) {
      setState({ status: "error", invitation: null, error: "Ссылка приглашения повреждена или неполная." });
      return;
    }

    const controller = new AbortController();

    async function load() {
      try {
        const invitation = await getModeratorInvitationDetails(token, controller.signal);
        setState({ status: "ready", invitation, error: "" });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: "error",
          invitation: null,
          error: error?.message ?? "Не удалось загрузить приглашение.",
        });
      }
    }

    load();
    return () => controller.abort();
  }, [token]);

  const isInvitationActive = useMemo(
    () => state.invitation && !state.invitation.isExpired && !state.invitation.isAccepted && !state.invitation.isRevoked,
    [state.invitation]
  );

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setSubmitState((current) => (current.status === "error" ? { status: "idle", error: "" } : current));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const passwordError = validatePassword(form.password);
    if (passwordError) {
      setSubmitState({ status: "error", error: passwordError });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setSubmitState({ status: "error", error: "Пароли должны совпадать." });
      return;
    }

    setSubmitState({ status: "saving", error: "" });

    try {
      await acceptModeratorInvitation({ token, password: form.password });
      setSubmitState({ status: "success", error: "" });
      window.setTimeout(() => {
        navigate(routes.moderator.dashboard);
      }, 600);
    } catch (error) {
      setSubmitState({
        status: "error",
        error: error?.message ?? "Не удалось принять приглашение.",
      });
    }
  }

  return (
    <AuthStage layout="compact" className="auth-stage--invite-accept">
      <div className="auth-stage__shell auth-stage__shell--compact">
        <AuthSurface className="auth-screen-card--compact auth-invite-accept-card">
          <AuthTopBar backHref={routes.auth.login} backLabel="Вернуться ко входу" />
          <AuthHero
            centered
            className="auth-invite-accept-hero"
            badge="Приглашение модератора"
            title="Активация доступа"
            description="Задайте пароль, чтобы принять приглашение и открыть кабинет модератора."
            titleClassName="ui-type-h2"
            descriptionClassName="ui-type-body"
          />

          {state.status === "loading" ? (
            <div className="auth-invite-accept__loading">
              <p className="ui-type-body">Проверяем приглашение...</p>
            </div>
          ) : null}

          {state.status === "error" ? (
            <Alert tone="error" showIcon title="Приглашение недоступно">
              {state.error}
            </Alert>
          ) : null}

          {state.status === "ready" && state.invitation ? (
            <div className="auth-invite-accept__stack">
              <AuthNote title="Кто приглашен" accent className="auth-invite-accept__note">
                {state.invitation.displayName || state.invitation.email}
              </AuthNote>

              <div className="auth-invite-accept__facts">
                <div>
                  <span className="ui-type-caption">Email</span>
                  <strong>{state.invitation.email}</strong>
                </div>
                <div>
                  <span className="ui-type-caption">Пригласил</span>
                  <strong>{state.invitation.invitedByDisplayName}</strong>
                </div>
              </div>

              {!isInvitationActive ? (
                <Alert tone="warning" showIcon title="Приглашение нельзя использовать">
                  {state.invitation.message}
                </Alert>
              ) : (
                <form className="auth-screen__form auth-invite-accept__form" onSubmit={handleSubmit} noValidate>
                  <FormField label="Новый пароль" required>
                    <Input
                      type="password"
                      value={form.password}
                      autoComplete="new-password"
                      revealable
                      showPasswordLabel="Показать пароль"
                      hidePasswordLabel="Скрыть пароль"
                      showPasswordText="Показать"
                      hidePasswordText="Скрыть"
                      onValueChange={(value) => updateField("password", value)}
                    />
                  </FormField>

                  <FormField label="Повторите пароль" required>
                    <Input
                      type="password"
                      value={form.confirmPassword}
                      autoComplete="new-password"
                      revealable
                      showPasswordLabel="Показать пароль"
                      hidePasswordLabel="Скрыть пароль"
                      showPasswordText="Показать"
                      hidePasswordText="Скрыть"
                      onValueChange={(value) => updateField("confirmPassword", value)}
                    />
                  </FormField>

                  {submitState.status === "error" ? (
                    <Alert tone="error" showIcon title="Не удалось завершить активацию">
                      {submitState.error}
                    </Alert>
                  ) : null}

                  {submitState.status === "success" ? (
                    <Alert tone="success" showIcon title="Доступ активирован">
                      Переходим в кабинет модератора...
                    </Alert>
                  ) : null}

                  <Button type="submit" size="lg" loading={submitState.status === "saving"} className="auth-invite-accept__submit">
                    Принять приглашение
                  </Button>
                </form>
              )}
            </div>
          ) : null}
        </AuthSurface>
      </div>
    </AuthStage>
  );
}
