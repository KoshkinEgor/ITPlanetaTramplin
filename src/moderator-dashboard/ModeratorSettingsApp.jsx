import { useEffect, useMemo, useState } from "react";
import { getModeratorSettings, updateModeratorSettings } from "../api/moderation";
import { Alert, Button, Card, DashboardPageHeader, FormField, Loader, Select, Switch } from "../shared/ui";

const START_PAGE_OPTIONS = [
  { value: "/moderator", label: "Обзор" },
  { value: "/moderator/opportunities", label: "Возможности" },
  { value: "/moderator/companies", label: "Компании" },
  { value: "/moderator/complaints", label: "Жалобы" },
  { value: "/moderator/tags-system", label: "Теги и система" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Сначала новые" },
  { value: "oldest", label: "Сначала старые" },
  { value: "priority", label: "По приоритету" },
];

const PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10 на странице" },
  { value: "20", label: "20 на странице" },
  { value: "50", label: "50 на странице" },
];

function normalizePayload(payload) {
  const settings = payload?.settings ?? payload?.Settings ?? {};
  return {
    user: payload?.user ?? payload?.User ?? {},
    startPage: settings.startPage ?? settings.StartPage ?? "/moderator",
    notificationSettings: settings.notificationSettings ?? settings.NotificationSettings ?? {},
    queueSettings: settings.queueSettings ?? settings.QueueSettings ?? {},
  };
}

export function ModeratorSettingsApp() {
  const [state, setState] = useState({ status: "loading", user: null, error: null });
  const [draft, setDraft] = useState({
    startPage: "/moderator",
    notifications: { complaints: true, opportunities: true, companies: true, candidates: true, system: true },
    queue: { defaultSort: "newest", pageSize: 20, includeClosedComplaints: false },
  });
  const [saveState, setSaveState] = useState({ status: "idle", error: null });

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const payload = normalizePayload(await getModeratorSettings(controller.signal));
        setState({ status: "ready", user: payload.user, error: null });
        setDraft({
          startPage: payload.startPage,
          notifications: { complaints: true, opportunities: true, companies: true, candidates: true, system: true, ...payload.notificationSettings },
          queue: { defaultSort: "newest", pageSize: 20, includeClosedComplaints: false, ...payload.queueSettings },
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({ status: "error", user: null, error });
        }
      }
    }
    load();
    return () => controller.abort();
  }, []);

  const displayName = useMemo(() => {
    const name = state.user?.displayName ?? state.user?.DisplayName;
    return name || state.user?.email || state.user?.Email || "Куратор";
  }, [state.user]);

  const isAdministrator = state.user?.isAdministrator ?? state.user?.IsAdministrator ?? false;
  const updateNotifications = (field, value) => setDraft((current) => ({ ...current, notifications: { ...current.notifications, [field]: value } }));
  const updateQueue = (field, value) => setDraft((current) => ({ ...current, queue: { ...current.queue, [field]: value } }));

  async function handleSave() {
    setSaveState({ status: "saving", error: null });
    try {
      await updateModeratorSettings({
        startPage: draft.startPage,
        notificationSettingsJson: JSON.stringify(draft.notifications),
        queueSettingsJson: JSON.stringify(draft.queue),
      });
      setSaveState({ status: "success", error: null });
    } catch (error) {
      setSaveState({ status: "error", error });
    }
  }

  return (
    <>
      <DashboardPageHeader
        title="Настройки куратора"
        description="Персональные настройки уведомлений, очередей и стартового раздела кабинета."
      />
      {state.status === "loading" ? <Loader label="Загружаем настройки" surface /> : null}
      {state.status === "error" ? <Alert tone="error" title="Не удалось загрузить настройки" showIcon>{state.error?.message ?? "Попробуйте повторить позже."}</Alert> : null}
      {saveState.status === "error" ? <Alert tone="error" title="Не удалось сохранить настройки" showIcon>{saveState.error?.message ?? "Попробуйте повторить позже."}</Alert> : null}
      {saveState.status === "success" ? <Alert tone="success" title="Настройки сохранены" showIcon>Изменения применены к кабинету куратора.</Alert> : null}

      <div className="moderator-settings-grid moderator-fade-up moderator-fade-up--delay-1">
        <Card className="moderator-setting-card">
          <h2 className="ui-type-h2">Профиль</h2>
          <p className="ui-type-body">{displayName}</p>
          <p className="ui-type-caption">{state.user?.email ?? state.user?.Email}</p>
          <p className="ui-type-caption">{isAdministrator ? "Куратор-администратор" : "Куратор"}</p>
          <FormField label="Стартовый раздел">
            <Select value={draft.startPage} onValueChange={(value) => setDraft((current) => ({ ...current, startPage: value }))} options={START_PAGE_OPTIONS} />
          </FormField>
        </Card>

        <Card className="moderator-setting-card">
          <h2 className="ui-type-h2">Уведомления</h2>
          <Switch checked={draft.notifications.complaints} onChange={(event) => updateNotifications("complaints", event.target.checked)}><span className="ui-check__label">Новые и обработанные жалобы</span></Switch>
          <Switch checked={draft.notifications.opportunities} onChange={(event) => updateNotifications("opportunities", event.target.checked)}><span className="ui-check__label">Очередь возможностей</span></Switch>
          <Switch checked={draft.notifications.companies} onChange={(event) => updateNotifications("companies", event.target.checked)}><span className="ui-check__label">Проверка компаний</span></Switch>
          <Switch checked={draft.notifications.candidates} onChange={(event) => updateNotifications("candidates", event.target.checked)}><span className="ui-check__label">Проверка кандидатов</span></Switch>
          <Switch checked={draft.notifications.system} onChange={(event) => updateNotifications("system", event.target.checked)}><span className="ui-check__label">Системные изменения</span></Switch>
        </Card>

        <Card className="moderator-setting-card">
          <h2 className="ui-type-h2">Очереди</h2>
          <FormField label="Сортировка по умолчанию">
            <Select value={draft.queue.defaultSort} onValueChange={(value) => updateQueue("defaultSort", value)} options={SORT_OPTIONS} />
          </FormField>
          <FormField label="Размер страницы">
            <Select value={String(draft.queue.pageSize)} onValueChange={(value) => updateQueue("pageSize", Number(value))} options={PAGE_SIZE_OPTIONS} />
          </FormField>
          <Switch checked={draft.queue.includeClosedComplaints} onChange={(event) => updateQueue("includeClosedComplaints", event.target.checked)}><span className="ui-check__label">Показывать закрытые жалобы</span></Switch>
        </Card>

        <Card className="moderator-setting-card">
          <h2 className="ui-type-h2">Системный доступ</h2>
          <p className="ui-type-body">
            {isAdministrator
              ? "Доступно управление справочниками, объединение тегов и приглашение кураторов."
              : "Справочники и объединение тегов доступны только куратору-администратору."}
          </p>
          <Button type="button" onClick={handleSave} disabled={saveState.status === "saving"}>
            {saveState.status === "saving" ? "Сохраняем" : "Сохранить настройки"}
          </Button>
        </Card>
      </div>
    </>
  );
}
