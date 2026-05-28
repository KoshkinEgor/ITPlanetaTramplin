import { useEffect, useMemo, useState } from "react";
import {
  createModerationReference,
  createModerationTag,
  getModerationAuditLog,
  getModerationReferences,
  getModerationTags,
  mergeModerationTags,
  setModerationTagEnabled,
  updateModerationReference,
  updateModerationTag,
} from "../api/moderation";
import { Alert, Badge, Button, Card, EmptyState, FormField, Input, Loader, Modal, SearchInput, Select, Switch, Tabs } from "../shared/ui";

const TAG_FILTERS = [
  { value: "all", label: "Все" },
  { value: "active", label: "Активные" },
  { value: "inactive", label: "Отключенные" },
  { value: "merged", label: "Объединенные" },
];

const REFERENCE_CATEGORY_OPTIONS = [
  { value: "opportunity_types", label: "Типы возможностей" },
  { value: "employment_types", label: "Форматы работы" },
  { value: "opportunity_levels", label: "Уровни" },
  { value: "complaint_reasons", label: "Причины жалоб" },
  { value: "moderation_statuses", label: "Статусы модерации" },
];

function readArray(payload) {
  return Array.isArray(payload?.items) ? payload.items : Array.isArray(payload?.Items) ? payload.Items : Array.isArray(payload) ? payload : [];
}

function normalizeTag(item) {
  return {
    id: item.id ?? item.Id,
    name: item.name ?? item.Name ?? "",
    isActive: item.isActive ?? item.IsActive ?? true,
    usageCount: item.usageCount ?? item.UsageCount ?? 0,
    mergedIntoTagId: item.mergedIntoTagId ?? item.MergedIntoTagId ?? null,
    mergedIntoTagName: item.mergedIntoTagName ?? item.MergedIntoTagName ?? "",
  };
}

function normalizeReference(item) {
  return {
    id: item.id ?? item.Id,
    category: item.category ?? item.Category ?? "",
    key: item.key ?? item.Key ?? item.value ?? item.Value ?? "",
    label: item.label ?? item.Label ?? "",
    description: item.description ?? item.Description ?? "",
    isActive: item.isActive ?? item.IsActive ?? true,
    isSystem: item.isSystem ?? item.IsSystem ?? false,
    sortOrder: item.sortOrder ?? item.SortOrder ?? 0,
  };
}

function normalizeAuditItem(item) {
  const rawDate = item.timestamp ?? item.Timestamp ?? item.createdAt ?? item.CreatedAt;
  const parsed = rawDate ? new Date(rawDate) : null;

  return {
    id: item.id ?? item.Id,
    title: item.title ?? item.Title ?? item.action ?? item.Action ?? "Событие",
    description: item.description ?? item.Description ?? item.summary ?? item.Summary ?? "",
    kind: item.kind ?? item.Kind ?? item.entityType ?? item.EntityType ?? "system",
    timestampValue: rawDate,
    timestamp: parsed && !Number.isNaN(parsed.getTime())
      ? new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(parsed)
      : "",
  };
}

function TagEditorModal({ tag, onClose, onSubmit, busy }) {
  const [name, setName] = useState(tag?.name ?? "");

  return (
    <Modal
      open
      title={tag ? "Редактировать тег" : "Новый тег"}
      onClose={onClose}
      actions={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>Отмена</Button>
          <Button type="button" onClick={() => onSubmit({ name })} disabled={busy}>{busy ? "Сохраняем" : "Сохранить"}</Button>
        </>
      }
    >
      <FormField label="Название тега" required>
        <Input value={name} onValueChange={setName} placeholder="Например, React" autoFocus />
      </FormField>
    </Modal>
  );
}

function ReferenceEditorModal({ item, onClose, onSubmit, busy }) {
  const [draft, setDraft] = useState(() => ({
    category: item?.category ?? "opportunity_types",
    key: item?.key ?? "",
    label: item?.label ?? "",
    description: item?.description ?? "",
    isActive: item?.isActive ?? true,
    sortOrder: item?.sortOrder ?? 100,
  }));

  const update = (field, value) => setDraft((current) => ({ ...current, [field]: value }));

  return (
    <Modal
      open
      title={item ? "Редактировать справочник" : "Новое значение справочника"}
      onClose={onClose}
      actions={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>Отмена</Button>
          <Button type="button" onClick={() => onSubmit(draft)} disabled={busy}>{busy ? "Сохраняем" : "Сохранить"}</Button>
        </>
      }
    >
      <div className="moderator-settings-grid">
        <FormField label="Категория" required>
          <Select value={draft.category} onValueChange={(value) => update("category", value)} options={REFERENCE_CATEGORY_OPTIONS} disabled={item?.isSystem} />
        </FormField>
        <FormField label="Ключ" required>
          <Input value={draft.key} onValueChange={(value) => update("key", value)} disabled={item?.isSystem} />
        </FormField>
      </div>
      <FormField label="Название" required>
        <Input value={draft.label} onValueChange={(value) => update("label", value)} />
      </FormField>
      <FormField label="Описание">
        <Input value={draft.description} onValueChange={(value) => update("description", value)} />
      </FormField>
      <div className="moderator-settings-grid">
        <FormField label="Порядок">
          <Input type="number" value={draft.sortOrder} onValueChange={(value) => update("sortOrder", Number(value) || 0)} />
        </FormField>
        <Switch checked={draft.isActive} onChange={(event) => update("isActive", event.target.checked)}>
          <span className="ui-check__label">Активно</span>
        </Switch>
      </div>
    </Modal>
  );
}

function MergeTagsModal({ tags, onClose, onSubmit, busy }) {
  const activeTags = tags.filter((tag) => tag.isActive);
  const [sourceTagId, setSourceTagId] = useState(String(activeTags[0]?.id ?? ""));
  const [targetTagId, setTargetTagId] = useState(String(activeTags[1]?.id ?? ""));
  const options = activeTags.map((tag) => ({ value: String(tag.id), label: tag.name }));

  return (
    <Modal
      open
      title="Объединить теги"
      description="Связи с возможностями будут перенесены на целевой тег, исходный тег будет отключен."
      onClose={onClose}
      actions={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>Отмена</Button>
          <Button type="button" variant="danger" onClick={() => onSubmit({ sourceTagId: Number(sourceTagId), targetTagId: Number(targetTagId) })} disabled={busy || !sourceTagId || !targetTagId || sourceTagId === targetTagId}>
            Объединить
          </Button>
        </>
      }
    >
      <FormField label="Исходный тег">
        <Select value={sourceTagId} onValueChange={setSourceTagId} options={options} />
      </FormField>
      <FormField label="Целевой тег">
        <Select value={targetTagId} onValueChange={setTargetTagId} options={options} />
      </FormField>
    </Modal>
  );
}

export function ModeratorTagsSystemApp() {
  const [state, setState] = useState({ status: "loading", tags: [], references: [], audit: [], stats: null, error: null });
  const [query, setQuery] = useState("");
  const [tagStatus, setTagStatus] = useState("all");
  const [tagModal, setTagModal] = useState(null);
  const [referenceModal, setReferenceModal] = useState(null);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const pendingCount = useMemo(() => {
    return state.stats?.pending ?? state.stats?.Pending ?? 0;
  }, [state.stats]);

  const tagFilterOptions = useMemo(() => {
    return [
      { value: "all", label: "Все" },
      { value: "pending", label: pendingCount > 0 ? `На модерации (${pendingCount})` : "На модерации" },
      { value: "active", label: "Активные" },
      { value: "inactive", label: "Отключенные" },
      { value: "merged", label: "Объединенные" },
    ];
  }, [pendingCount]);

  async function load(signal) {
    const [tagsPayload, referencesPayload, auditPayload] = await Promise.all([
      getModerationTags({ status: tagStatus }, signal),
      getModerationReferences(signal),
      getModerationAuditLog({ entityType: "all" }, signal),
    ]);

    setState({
      status: "ready",
      tags: readArray(tagsPayload).map(normalizeTag),
      references: readArray(referencesPayload).map(normalizeReference),
      audit: readArray(auditPayload).map(normalizeAuditItem),
      stats: tagsPayload?.stats ?? tagsPayload?.Stats ?? null,
      error: null,
    });
  }

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal).catch((error) => {
      if (!controller.signal.aborted) {
        setState((current) => ({ ...current, status: "error", error }));
      }
    });
    return () => controller.abort();
  }, [tagStatus]);

  const filteredTags = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return state.tags.filter((tag) => !normalized || tag.name.toLowerCase().includes(normalized));
  }, [query, state.tags]);

  const duplicateSuggestions = useMemo(() => {
    const groups = new Map();
    state.tags.forEach((tag) => {
      const key = tag.name.toLowerCase().replace(/[-_\s]+/g, "");
      groups.set(key, [...(groups.get(key) ?? []), tag]);
    });
    return [...groups.values()].filter((items) => items.length > 1);
  }, [state.tags]);

  async function reloadAfter(action) {
    setBusy(true);
    try {
      await action();
      await load();
      setTagModal(null);
      setReferenceModal(null);
      setMergeOpen(false);
    } catch (error) {
      setState((current) => ({ ...current, status: "error", error }));
    } finally {
      setBusy(false);
    }
  }

  const tagsContent = (
    <div className="moderator-settings-column">
      <Card className="moderator-panel">
        <div className="moderator-panel__head moderator-panel__head--queue">
          <div className="moderator-panel__copy">
            <h2 className="ui-type-h2">Теги возможностей</h2>
            <p className="ui-type-body">Управление активными тегами, отключением и объединением дублей.</p>
          </div>
          <Button type="button" onClick={() => setTagModal({ mode: "create" })}>Добавить тег</Button>
        </div>
        <div className="moderator-tags-toolbar">
          <SearchInput value={query} onValueChange={setQuery} placeholder="Поиск тегов" />
          <Select value={tagStatus} onValueChange={setTagStatus} options={tagFilterOptions} />
          <Button type="button" variant="secondary" onClick={() => setMergeOpen(true)} disabled={state.tags.filter((tag) => tag.isActive).length < 2}>Объединить</Button>
        </div>
        {filteredTags.length ? (
          <div className="moderator-panel__table" role="table">
            {filteredTags.map((tag) => {
              const isPending = !tag.isActive && !tag.mergedIntoTagId;
              return (
                <div key={tag.id} className={`moderator-panel__row moderator-panel__row--tags ${isPending ? 'moderator-panel__row--pending' : ''}`} role="row">
                  <div>
                    <strong>{tag.name}</strong>
                    <p className="ui-type-caption">{tag.usageCount} связей{tag.mergedIntoTagName ? `, объединен с ${tag.mergedIntoTagName}` : ""}</p>
                  </div>
                  {tag.mergedIntoTagId ? (
                    <Badge tone="neutral">Объединен</Badge>
                  ) : tag.isActive ? (
                    <Badge tone="success">Активен</Badge>
                  ) : (
                    <Badge tone="warning">На модерации</Badge>
                  )}
                  <Button type="button" variant="secondary" onClick={() => setTagModal({ mode: "edit", tag })}>Править</Button>
                  <Button type="button" variant="ghost" onClick={() => reloadAfter(() => setModerationTagEnabled(tag.id, !tag.isActive))}>
                    {tag.isActive ? "Отключить" : "Включить"}
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="Теги не найдены" description="Измените поиск или создайте новый тег." compact />
        )}
      </Card>
    </div>
  );

  const referencesContent = (
    <Card className="moderator-panel">
      <div className="moderator-panel__head moderator-panel__head--queue">
        <div className="moderator-panel__copy">
          <h2 className="ui-type-h2">Системные справочники</h2>
          <p className="ui-type-body">Эти значения используются публичными фильтрами и формами создания возможностей.</p>
        </div>
        <Button type="button" onClick={() => setReferenceModal({ mode: "create" })}>Добавить значение</Button>
      </div>
      <div className="moderator-panel__table" role="table">
        {state.references.map((item) => (
          <div key={`${item.category}-${item.key}`} className="moderator-panel__row moderator-panel__row--references" role="row">
            <div>
              <strong>{item.label}</strong>
              <p className="ui-type-caption">{item.category} / {item.key}{item.isSystem ? " / системный ключ" : ""}</p>
            </div>
            <Badge tone={item.isActive ? "success" : "neutral"}>{item.isActive ? "Активно" : "Отключено"}</Badge>
            <Button type="button" variant="secondary" onClick={() => setReferenceModal({ mode: "edit", item })}>Править</Button>
          </div>
        ))}
      </div>
    </Card>
  );

  const qualityContent = (
    <div className="moderator-settings-grid">
      <Card className="moderator-setting-card">
        <h2 className="ui-type-h2">Статистика</h2>
        <p className="ui-type-body">Всего тегов: {state.stats?.total ?? state.tags.length}</p>
        <p className="ui-type-body">Активных: {state.stats?.active ?? state.tags.filter((tag) => tag.isActive).length}</p>
        <p className="ui-type-body">Не используются: {state.stats?.unused ?? state.tags.filter((tag) => tag.usageCount === 0).length}</p>
      </Card>
      <Card className="moderator-setting-card">
        <h2 className="ui-type-h2">Возможные дубли</h2>
        {duplicateSuggestions.length ? duplicateSuggestions.map((group) => (
          <p key={group.map((item) => item.id).join("-")} className="ui-type-body">{group.map((item) => item.name).join(", ")}</p>
        )) : <p className="ui-type-body">Явных дублей не найдено.</p>}
      </Card>
    </div>
  );

  const auditContent = (
    <Card className="moderator-panel">
      <div className="moderator-panel__head">
        <div className="moderator-panel__copy">
          <h2 className="ui-type-h2">Последние системные события</h2>
          <p className="ui-type-body">Создание тегов, изменения справочников и настройки кабинета.</p>
        </div>
      </div>
      {state.audit.length ? (
        <div className="moderator-panel__table">
          {state.audit.slice(0, 12).map((item) => (
            <div key={item.id} className="moderator-panel__row moderator-panel__row--audit">
              <div>
                <strong>{item.title}</strong>
                <p className="ui-type-caption">{item.description}</p>
              </div>
              <span className="ui-type-caption">{item.timestamp}</span>
            </div>
          ))}
        </div>
      ) : <EmptyState title="Событий пока нет" description="Изменения появятся здесь после действий куратора." compact />}
    </Card>
  );

  return (
    <>
      <div className="moderator-fade-up">
        <h1 className="ui-type-display">Теги и система</h1>
        <p className="ui-type-body">Единое место для управления таксономией, справочниками и системным контролем.</p>
      </div>
      {state.status === "loading" ? <Loader label="Загружаем системный раздел" surface /> : null}
      {state.status === "error" ? <Alert tone="error" title="Не удалось выполнить действие" showIcon>{state.error?.message ?? "Попробуйте повторить позже."}</Alert> : null}
      <Tabs
        className="moderator-fade-up moderator-fade-up--delay-1"
        tabListLabel="Разделы тегов и системы"
        items={[
          { value: "tags", label: "Теги", content: tagsContent, badge: pendingCount > 0 ? pendingCount : undefined },
          { value: "references", label: "Справочники", content: referencesContent },
          { value: "quality", label: "Контроль качества", content: qualityContent },
          { value: "audit", label: "Аудит", content: auditContent },
        ]}
      />
      {tagModal ? (
        <TagEditorModal
          tag={tagModal.tag}
          busy={busy}
          onClose={() => setTagModal(null)}
          onSubmit={(payload) => reloadAfter(() => tagModal.tag ? updateModerationTag(tagModal.tag.id, payload) : createModerationTag(payload))}
        />
      ) : null}
      {referenceModal ? (
        <ReferenceEditorModal
          item={referenceModal.item}
          busy={busy}
          onClose={() => setReferenceModal(null)}
          onSubmit={(payload) => reloadAfter(() => referenceModal.item ? updateModerationReference(referenceModal.item.id, payload) : createModerationReference(payload))}
        />
      ) : null}
      {mergeOpen ? <MergeTagsModal tags={state.tags} busy={busy} onClose={() => setMergeOpen(false)} onSubmit={(payload) => reloadAfter(() => mergeModerationTags(payload))} /> : null}
    </>
  );
}
