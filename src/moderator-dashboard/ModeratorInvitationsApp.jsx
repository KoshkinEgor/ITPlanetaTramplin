import { useEffect, useMemo, useState } from "react";
import { createModeratorInvitation, getModeratorInvitations } from "../api/moderation";
import { ApiError } from "../lib/http";
import {
  Alert,
  Badge,
  Button,
  Card,
  DashboardPageHeader,
  DashboardSectionHeader,
  EmptyState,
  FormField,
  Input,
  Loader,
} from "../shared/ui";

function formatInvitationDate(value) {
  if (!value) {
    return "Дата не указана";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Дата не указана";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function getInvitationStatus(item) {
  if (item?.revokedAt) {
    return { label: "Отозвано", tone: "neutral" };
  }

  if (item?.acceptedAt) {
    return { label: "Принято", tone: "success" };
  }

  const expiresAt = item?.expiresAt ? new Date(item.expiresAt) : null;
  if (!expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
    return { label: "Истекло", tone: "warning" };
  }

  return { label: "Активно", tone: "accent" };
}

function createEmptyForm() {
  return {
    email: "",
    name: "",
    surname: "",
    thirdname: "",
  };
}

export function ModeratorInvitationsApp() {
  const [state, setState] = useState({ status: "loading", invitations: [], error: null });
  const [form, setForm] = useState(createEmptyForm());
  const [saveState, setSaveState] = useState({ status: "idle", error: "", payload: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const invitations = await getModeratorInvitations(controller.signal);
        setState({
          status: "ready",
          invitations: Array.isArray(invitations) ? invitations : [],
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: error instanceof ApiError && error.status === 401 ? "unauthorized" : "error",
          invitations: [],
          error,
        });
      }
    }

    load();
    return () => controller.abort();
  }, [reloadKey]);

  const activeInvitationCount = useMemo(
    () => state.invitations.filter((item) => getInvitationStatus(item).label === "Активно").length,
    [state.invitations]
  );

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setSaveState((current) => (current.status === "success" ? { status: "idle", error: "", payload: null } : current));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.email.trim() || !form.name.trim() || !form.surname.trim()) {
      setSaveState({
        status: "error",
        error: "Заполните email, имя и фамилию будущего модератора.",
        payload: null,
      });
      return;
    }

    setSaveState({ status: "saving", error: "", payload: null });

    try {
      const payload = await createModeratorInvitation({
        email: form.email.trim(),
        name: form.name.trim(),
        surname: form.surname.trim(),
        thirdname: form.thirdname.trim() || null,
      });

      setForm(createEmptyForm());
      setSaveState({ status: "success", error: "", payload });
      setReloadKey((current) => current + 1);
    } catch (error) {
      setSaveState({
        status: "error",
        error: error?.message ?? "Не удалось создать приглашение.",
        payload: null,
      });
    }
  }

  return (
    <>
      {state.status === "loading" ? <Loader label="Загружаем приглашения модераторов" surface /> : null}

      {state.status === "unauthorized" ? (
        <Card>
          <EmptyState
            eyebrow="Доступ ограничен"
            title="Нужна роль модератора"
            description="Создавать приглашения могут только действующие модераторы платформы."
            tone="warning"
          />
        </Card>
      ) : null}

      {state.status === "error" ? (
        <Alert tone="error" title="Не удалось загрузить приглашения" showIcon>
          {state.error?.message ?? "Попробуйте обновить страницу позже."}
        </Alert>
      ) : null}

      {saveState.status === "error" ? (
        <Alert tone="error" title="Приглашение не создано" showIcon>
          {saveState.error}
        </Alert>
      ) : null}

      {saveState.status === "success" ? (
        <Alert tone={saveState.payload?.emailDeliveryFailed ? "warning" : "success"} title="Приглашение создано" showIcon>
          <span>{saveState.payload?.message || "Мы отправили письмо новому модератору."}</span>
          {saveState.payload?.invitationUrl ? (
            <>
              {" "}
              <a href={saveState.payload.invitationUrl} className="moderator-invitations__inline-link" target="_blank" rel="noreferrer">
                Открыть ссылку приглашения
              </a>
            </>
          ) : null}
        </Alert>
      ) : null}

      {state.status === "ready" ? (
        <div className="moderator-dashboard-stack">
          <DashboardPageHeader
            title="Приглашения модераторов"
            description="Приглашайте новых модераторов по email. Пользователь получит ссылку, задаст пароль и активирует доступ к кабинету."
            className="moderator-fade-up moderator-fade-up--delay-1"
          />

          <section className="moderator-invitations-layout">
            <Card className="moderator-panel moderator-panel--invite-form moderator-fade-up moderator-fade-up--delay-2">
              <DashboardSectionHeader
                eyebrow="Новый доступ"
                title="Создать приглашение"
                description="Заполните данные будущего модератора. После отправки приглашение придет на указанный email."
              />

              <form className="moderator-invitations-form" onSubmit={handleSubmit} noValidate>
                <div className="moderator-invitations-form__grid moderator-invitations-form__grid--two">
                  <FormField label="Имя" required>
                    <Input value={form.name} onValueChange={(value) => updateField("name", value)} />
                  </FormField>
                  <FormField label="Фамилия" required>
                    <Input value={form.surname} onValueChange={(value) => updateField("surname", value)} />
                  </FormField>
                </div>

                <div className="moderator-invitations-form__grid moderator-invitations-form__grid--two">
                  <FormField label="Отчество">
                    <Input value={form.thirdname} onValueChange={(value) => updateField("thirdname", value)} />
                  </FormField>
                  <FormField label="Email" required>
                    <Input type="email" value={form.email} onValueChange={(value) => updateField("email", value)} />
                  </FormField>
                </div>

                <div className="moderator-invitations-form__actions">
                  <Button type="submit" disabled={saveState.status === "saving"}>
                    {saveState.status === "saving" ? "Отправляем..." : "Отправить приглашение"}
                  </Button>
                </div>
              </form>
            </Card>

            <Card className="moderator-panel moderator-panel--invite-side moderator-fade-up moderator-fade-up--delay-3">
              <DashboardSectionHeader
                eyebrow="Правила"
                title="Как это работает"
                description="Новый модератор не регистрируется сам. Доступ появляется только после приглашения от действующего модератора."
              />

              <div className="moderator-invitations-note-list">
                <article className="moderator-invitations-note-card">
                  <strong>1. Приглашение по email</strong>
                  <p className="ui-type-body">На почту уходит персональная ссылка с ограниченным сроком действия.</p>
                </article>
                <article className="moderator-invitations-note-card">
                  <strong>2. Активация доступа</strong>
                  <p className="ui-type-body">Получатель задает пароль и сразу получает роль модератора.</p>
                </article>
                <article className="moderator-invitations-note-card">
                  <strong>3. Контроль статуса</strong>
                  <p className="ui-type-body">Внизу страницы видно, какие приглашения еще активны, а какие уже приняты.</p>
                </article>
              </div>
            </Card>
          </section>

          <Card className="moderator-panel moderator-panel--queue-stack moderator-fade-up moderator-fade-up--delay-3">
            <DashboardSectionHeader
              eyebrow="Статусы"
              title="Отправленные приглашения"
              description="Список последних приглашений с текущим статусом и сроком действия."
              counter={activeInvitationCount}
            />

            {state.invitations.length ? (
              <div className="moderator-invitations-list">
                {state.invitations.map((item) => {
                  const status = getInvitationStatus(item);

                  return (
                    <article key={item.id} className="moderator-invitations-item">
                      <div className="moderator-invitations-item__top">
                        <div className="moderator-invitations-item__copy">
                          <h3 className="ui-type-h4">{[item.name, item.surname, item.thirdname].filter(Boolean).join(" ")}</h3>
                          <p className="ui-type-body">{item.email}</p>
                        </div>
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </div>

                      <dl className="moderator-invitations-item__facts">
                        <div>
                          <dt>Пригласил</dt>
                          <dd>{item.invitedByDisplayName || "Модератор платформы"}</dd>
                        </div>
                        <div>
                          <dt>Отправлено</dt>
                          <dd>{formatInvitationDate(item.createdAt)}</dd>
                        </div>
                        <div>
                          <dt>Действует до</dt>
                          <dd>{formatInvitationDate(item.expiresAt)}</dd>
                        </div>
                      </dl>
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="Приглашений пока нет"
                description="Создайте первое приглашение через форму выше, чтобы добавить нового модератора."
                tone="neutral"
                compact
              />
            )}
          </Card>
        </div>
      ) : null}
    </>
  );
}
