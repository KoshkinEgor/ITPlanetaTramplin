import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  decideCompanyModeration,
  downloadModerationCompanyVerificationDocument,
  getModerationCompanies,
  getModerationCompany,
  updateModerationCompany,
} from "../api/moderation";
import { startChat } from "../api/chats";
import { routes } from "../app/routes";
import { formatCompanyVerificationDate, formatCompanyVerificationFileSize, parseCompanyVerificationData } from "../company-dashboard/companyVerification";
import { ApiError } from "../lib/http";
import {
  Alert,
  Button,
  Card,
  DashboardPageHeader,
  EmptyState,
  FormField,
  Input,
  Loader,
  Modal,
  ModerationActionDialog,
  Select,
  Tag,
  Textarea,
} from "../shared/ui";
import { ModeratorFilterPill, ModeratorSearchBar, ModeratorStatusBadge } from "./shared";

const COMPANY_FILTERS = [
  { value: "all", label: "Все" },
  { value: "pending", label: "На проверке" },
  { value: "approved", label: "Подтверждены" },
  { value: "revision", label: "Доработка" },
  { value: "rejected", label: "Отклонены" },
];

const COMPANY_DECISION_OPTIONS = [
  { value: "pending", label: "На проверке" },
  { value: "approved", label: "Подтвердить" },
  { value: "revision", label: "Вернуть на доработку" },
  { value: "rejected", label: "Отклонить" },
];

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function translateCompanyStatus(status) {
  switch (normalize(status)) {
    case "approved":
      return "Подтверждена";
    case "revision":
      return "Доработка";
    case "rejected":
      return "Отклонена";
    default:
      return "На проверке";
  }
}

function getDecisionDialogVariant(status) {
  switch (normalize(status)) {
    case "revision":
      return "revision";
    case "rejected":
      return "reject";
    default:
      return "approve";
  }
}

function getCompanyDecisionDialogContent(status) {
  switch (normalize(status)) {
    case "approved":
      return {
        actionLabel: "Подтвердить компанию",
        description: "Компания получит подтвержденный статус после подтверждения решения.",
        confirmLabel: "Подтвердить",
      };
    case "revision":
      return {
        actionLabel: "Вернуть компанию на доработку",
        description: "Компания будет переведена в статус доработки после подтверждения.",
        confirmLabel: "Отправить на доработку",
      };
    case "rejected":
      return {
        actionLabel: "Отклонить компанию",
        description: "Укажите комментарий для компании перед подтверждением отклонения.",
        confirmLabel: "Отклонить",
      };
    default:
      return {
        actionLabel: "Вернуть компанию на проверку",
        description: "Компания снова попадет в очередь модерации после подтверждения.",
        confirmLabel: "Вернуть на проверку",
      };
  }
}

function formatDate(value) {
  if (!value) {
    return "Дата не указана";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function createCompanyDraft(item) {
  return {
    companyName: normalizeText(item?.companyName),
    legalAddress: normalizeText(item?.legalAddress),
    description: normalizeText(item?.description),
    socials: normalizeText(item?.socials),
  };
}

function triggerBrowserDownload(blob, fileName) {
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = fileName || "company-verification-document";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(downloadUrl);
}

function VerificationRequestSummary({ item, onDownload, downloadState }) {
  const verificationData = parseCompanyVerificationData(item?.verificationData);

  if (!verificationData?.snapshot && !verificationData?.contact && !verificationData?.document && !verificationData?.legacyText) {
    return (
      <div className="moderator-detail-group">
        <h4 className="ui-type-h3">Заявка на верификацию</h4>
        <p className="ui-type-body">Компания еще не отправляла структурированную заявку с документом.</p>
      </div>
    );
  }

  return (
    <section className="moderator-detail-group">
      <h4 className="ui-type-h3">Заявка на верификацию</h4>

      {verificationData.snapshot ? (
        <dl className="moderator-detail-facts moderator-detail-facts--stack">
          <div>
            <dt>Компания</dt>
            <dd>{verificationData.snapshot.companyName || "Не указана"}</dd>
          </div>
          <div>
            <dt>ИНН</dt>
            <dd>{verificationData.snapshot.inn || "Не указан"}</dd>
          </div>
          <div>
            <dt>Юридический адрес</dt>
            <dd>{verificationData.snapshot.legalAddress || "Не указан"}</dd>
          </div>
        </dl>
      ) : null}

      {verificationData.contact ? (
        <dl className="moderator-detail-facts moderator-detail-facts--stack">
          <div>
            <dt>Контактное лицо</dt>
            <dd>{verificationData.contact.name || "Не указано"}</dd>
          </div>
          <div>
            <dt>Должность</dt>
            <dd>{verificationData.contact.role || "Не указана"}</dd>
          </div>
          <div>
            <dt>Телефон</dt>
            <dd>{verificationData.contact.phone || "Не указан"}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{verificationData.contact.email || "Не указан"}</dd>
          </div>
        </dl>
      ) : null}

      {verificationData.document ? (
        <div className="company-dashboard-verification-card__document">
          <div>
            <strong>{verificationData.document.originalName || "Файл верификации"}</strong>
            <p>
              {[verificationData.document.contentType, formatCompanyVerificationFileSize(verificationData.document.sizeBytes)]
                .filter(Boolean)
                .join(" · ") || "Файл загружен"}
            </p>
            {verificationData.submittedAt ? <p>Отправлено: {formatCompanyVerificationDate(verificationData.submittedAt)}</p> : null}
          </div>
          {verificationData.document.storageKey ? (
            <Button type="button" variant="ghost" onClick={onDownload} disabled={downloadState.status === "loading"}>
              {downloadState.status === "loading" ? "Скачиваем..." : "Скачать документ"}
            </Button>
          ) : null}
        </div>
      ) : null}

      {verificationData.legacyText ? (
        <div className="moderator-detail-facts moderator-detail-facts--stack">
          <div>
            <dt>Данные из предыдущей версии</dt>
            <dd>{verificationData.legacyText}</dd>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function CompanyRow({ item, selected, onSelect }) {
  return (
    <button type="button" className={`moderator-table__row ${selected ? "is-active" : ""}`.trim()} onClick={() => onSelect(item.id)}>
      <span className="moderator-table__cell moderator-table__cell--title">{item.companyName}</span>
      <span className="moderator-table__cell">{item.email}</span>
      <span className="moderator-table__cell">{item.inn || "ИНН не указан"}</span>
      <span className="moderator-table__cell">{formatDate(item.createdAt)}</span>
      <span className="moderator-table__cell moderator-table__cell--status">
        <ModeratorStatusBadge label={translateCompanyStatus(item.verificationStatus)} tone={item.verificationStatus} />
      </span>
    </button>
  );
}

export function ModeratorCompaniesApp() {
  const navigate = useNavigate();
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ status: "loading", items: [], error: null });
  const [detailState, setDetailState] = useState({ status: "idle", detail: null, error: null });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [decision, setDecision] = useState("approved");
  const [decisionReason, setDecisionReason] = useState("");
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);
  const [saveState, setSaveState] = useState({ status: "idle", error: "" });
  const [decisionState, setDecisionState] = useState({ status: "idle", error: "" });
  const [documentState, setDocumentState] = useState({ status: "idle", error: "" });
  const [chatState, setChatState] = useState({ status: "idle", error: "" });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const items = await getModerationCompanies(controller.signal);
        const normalizedItems = Array.isArray(items) ? items : [];
        setState({ status: "ready", items: normalizedItems, error: null });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({ status: error instanceof ApiError && error.status === 401 ? "unauthorized" : "error", items: [], error });
      }
    }

    load();
    return () => controller.abort();
  }, [reloadKey]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = normalize(query);

    return state.items.filter((item) => {
      const haystack = normalize([item.companyName, item.email, item.inn, item.legalAddress, item.description].join(" "));
      const matchesFilter = statusFilter === "all" ? true : item.verificationStatus === statusFilter;
      return matchesFilter && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [query, state.items, statusFilter]);

  const activeItem = detailState.detail ?? filteredItems.find((item) => item.id === selectedId) ?? state.items.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedId) {
      setDecisionDialogOpen(false);
      setDetailState({ status: "idle", detail: null, error: null });
      setDraft(null);
      return;
    }

    const controller = new AbortController();

    async function loadDetail() {
      setDetailState({ status: "loading", detail: null, error: null });

      try {
        const detail = await getModerationCompany(selectedId, controller.signal);

        if (controller.signal.aborted) {
          return;
        }

        setDetailState({ status: "ready", detail, error: null });
        setDraft(createCompanyDraft(detail));
        setDecision(normalize(detail?.verificationStatus) || "approved");
        setDecisionReason(normalizeText(detail?.verificationReason));
        setDecisionDialogOpen(false);
        setDocumentState({ status: "idle", error: "" });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setDetailState({ status: "error", detail: null, error });
      }
    }

    loadDetail();
    return () => controller.abort();
  }, [reloadKey, selectedId]);

  useEffect(() => {
    if (selectedId === null) {
      return;
    }

    if (!state.items.some((item) => item.id === selectedId)) {
      setSelectedId(null);
    }
  }, [selectedId, state.items]);

  function handleSelect(nextId) {
    setSelectedId((current) => (current === nextId ? null : nextId));
    setDecisionDialogOpen(false);
    setSaveState({ status: "idle", error: "" });
    setDecisionState({ status: "idle", error: "" });
    setDocumentState({ status: "idle", error: "" });
  }

  function updateDraft(field, value) {
    setDraft((current) => ({ ...(current ?? {}), [field]: value }));
    setSaveState((current) => (current.status === "success" ? { status: "idle", error: "" } : current));
  }

  async function handleDocumentDownload() {
    if (!selectedId) {
      return;
    }

    setDocumentState({ status: "loading", error: "" });

    try {
      const result = await downloadModerationCompanyVerificationDocument(selectedId);
      triggerBrowserDownload(result.blob, result.fileName);
      setDocumentState({ status: "idle", error: "" });
    } catch (error) {
      setDocumentState({
        status: "error",
        error: error?.message ?? "Не удалось скачать документ верификации.",
      });
    }
  }

  async function handleSave() {
    if (!selectedId || !draft) {
      return;
    }

    if (!normalizeText(draft.companyName)) {
      setSaveState({ status: "error", error: "Укажите название компании." });
      return;
    }

    setSaveState({ status: "saving", error: "" });

    try {
      await updateModerationCompany(selectedId, {
        companyName: normalizeText(draft.companyName),
        legalAddress: normalizeText(draft.legalAddress) || null,
        description: normalizeText(draft.description) || null,
        socials: normalizeText(draft.socials) || null,
      });

      const refreshed = await getModerationCompany(selectedId);
      setDetailState({ status: "ready", detail: refreshed, error: null });
      setDraft(createCompanyDraft(refreshed));
      setSaveState({ status: "success", error: "" });
      setReloadKey((current) => current + 1);
    } catch (error) {
      setSaveState({
        status: "error",
        error: error?.message ?? "Не удалось сохранить данные компании.",
      });
    }
  }

  function handleDecisionChange(nextValue) {
    setDecision(nextValue);
    setDecisionState({ status: "idle", error: "" });
  }

  function handleOpenDecisionDialog() {
    if (!selectedId) {
      return;
    }

    setDecisionState({ status: "idle", error: "" });
    setDecisionDialogOpen(true);
  }

  function handleCloseDecisionDialog() {
    if (decisionState.status === "saving") {
      return;
    }

    setDecisionDialogOpen(false);
  }

  function handleCloseCompanyModal() {
    setDecisionDialogOpen(false);
    setSelectedId(null);
  }

  async function handleDecisionSave({ reason } = {}) {
    if (!selectedId) {
      return;
    }

    const normalizedReason = normalizeText(reason ?? decisionReason) || null;

    setDecisionState({ status: "saving", error: "" });

    try {
      await decideCompanyModeration(selectedId, {
        status: decision,
        reason: normalizedReason,
      });
      const refreshed = await getModerationCompany(selectedId);
      setDetailState({ status: "ready", detail: refreshed, error: null });
      setDraft(createCompanyDraft(refreshed));
      setDecision(normalize(refreshed?.verificationStatus) || decision);
      setDecisionReason(normalizeText(refreshed?.verificationReason) || normalizedReason || "");
      setDecisionDialogOpen(false);
      setDecisionState({ status: "success", error: "" });
      setReloadKey((current) => current + 1);
    } catch (error) {
      setDecisionState({
        status: "error",
        error: error?.message ?? "Не удалось применить решение модерации.",
      });
    }
  }

  async function handleStartCompanyChat() {
    const recipientUserId = activeItem?.userId ?? detailState.detail?.userId;
    if (!recipientUserId || chatState.status === "loading") {
      return;
    }

    try {
      setChatState({ status: "loading", error: "" });
      const thread = await startChat({
        recipientUserId,
        contextType: "company_moderation",
        contextId: activeItem?.id ?? selectedId,
        subject: activeItem?.companyName ? `Проверка: ${activeItem.companyName}` : "Проверка компании",
      });
      navigate(`${routes.moderator.messages}?thread=${thread.id}`);
    } catch (error) {
      setChatState({
        status: "error",
        error: error?.message ?? "Не удалось открыть чат с компанией.",
      });
    }
  }

  const decisionDialogContent = getCompanyDecisionDialogContent(decision);

  return (
    <>
      <DashboardPageHeader
        title="Верификация компаний"
        description="Проверка профиля работодателя и редактирование содержимого в одном рабочем потоке."
      />

      <div className="moderator-toolbar-stack">
        <ModeratorSearchBar value={query} onChange={setQuery} placeholder="Поиск по названию, email, ИНН или адресу" />
        <div className="moderator-panel__filters moderator-fade-up moderator-fade-up--delay-1">
          {COMPANY_FILTERS.map((filter) => (
            <ModeratorFilterPill
              key={filter.value}
              label={filter.label}
              active={filter.value === statusFilter}
              onClick={() => setStatusFilter(filter.value)}
            />
          ))}
        </div>
      </div>

      {state.status === "loading" ? <Loader label="Загружаем компании" surface /> : null}

      {state.status === "error" ? (
        <Alert tone="error" title="Не удалось загрузить компании" showIcon>
          {state.error?.message ?? "Попробуйте повторить позже."}
        </Alert>
      ) : null}

      {state.status === "unauthorized" ? (
        <Card>
          <EmptyState
            eyebrow="Доступ ограничен"
            title="Нужна роль модератора"
            description="Список компаний доступен только модератору."
            tone="warning"
          />
        </Card>
      ) : null}

      {state.status === "ready" ? (
        <section className="moderator-review-grid">
          <Card className="moderator-panel moderator-panel--list moderator-fade-up moderator-fade-up--delay-2">
            <div className="moderator-panel__head moderator-panel__head--queue">
              <div className="moderator-panel__copy">
                <Tag tone="accent">Компании</Tag>
                <h2 className="ui-type-h2">Список компаний</h2>
                <p className="ui-type-body">Выберите компанию из списка, чтобы открыть модалку с редактированием профиля и сменой статуса верификации.</p>
              </div>
              <span className="moderator-panel__counter">{filteredItems.length}</span>
            </div>

            {filteredItems.length ? (
              <div className="moderator-table moderator-table--companies">
                <div className="moderator-table__header">
                  <span>Название</span>
                  <span>Email</span>
                  <span>ИНН</span>
                  <span>Дата</span>
                  <span>Статус</span>
                </div>
                <div className="moderator-table__body">
                  {filteredItems.map((item) => (
                    <CompanyRow key={item.id} item={item} selected={item.id === activeItem?.id} onSelect={handleSelect} />
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="Компании не найдены" description="Попробуйте изменить фильтр или поисковый запрос." tone="neutral" compact />
            )}
          </Card>
        </section>
      ) : null}

      <Modal
        open={Boolean(activeItem)}
        onClose={handleCloseCompanyModal}
        title="Проверка компании"
        description="Редактирование профиля работодателя и применение решения модерации в одном окне."
        size="lg"
        closeLabel="Закрыть окно компании"
        className="moderator-company-modal"
      >
        {activeItem ? (
          <div className="moderator-detail-surface moderator-detail-surface--modal">
            <div className="moderator-detail-surface__top">
              <Tag tone="accent">Компания</Tag>
              <ModeratorStatusBadge label={translateCompanyStatus(activeItem.verificationStatus)} tone={activeItem.verificationStatus} />
            </div>
            <div className="company-dashboard-panel__actions">
              <Button type="button" variant="secondary" loading={chatState.status === "loading"} onClick={handleStartCompanyChat}>
                Написать компании
              </Button>
            </div>
            {chatState.status === "error" ? (
              <Alert tone="error" title="Чат недоступен" showIcon>
                {chatState.error}
              </Alert>
            ) : null}

            <div className="moderator-detail-surface__copy">
              <h3 className="ui-type-h3">{activeItem.companyName}</h3>
              <p className="ui-type-body moderator-detail-surface__description">
                {activeItem.description || "Описание компании пока не заполнено."}
              </p>
            </div>

            <dl className="moderator-detail-facts moderator-detail-facts--stack">
              <div>
                <dt>Email</dt>
                <dd>{activeItem.email}</dd>
              </div>
              <div>
                <dt>ИНН</dt>
                <dd>{activeItem.inn || "Не указан"}</dd>
              </div>
              <div>
                <dt>Метод верификации</dt>
                <dd>{activeItem.verificationMethod || "Не указан"}</dd>
              </div>
              <div>
                <dt>Публикации</dt>
                <dd>{Number.isFinite(Number(activeItem.opportunitiesCount)) ? activeItem.opportunitiesCount : 0}</dd>
              </div>
            </dl>

            {detailState.status === "loading" ? <Loader label="Загружаем карточку компании" surface /> : null}

            {detailState.status === "error" ? (
              <Alert tone="error" title="Не удалось загрузить карточку компании" showIcon>
                {detailState.error?.message ?? "Попробуйте открыть компанию ещё раз."}
              </Alert>
            ) : null}

            {saveState.status === "error" ? (
              <Alert tone="error" title="Изменения не сохранены" showIcon>
                {saveState.error}
              </Alert>
            ) : null}

            {saveState.status === "success" ? (
              <Alert tone="success" title="Профиль обновлен" showIcon>
                Данные компании сохранены без сброса текущего статуса проверки.
              </Alert>
            ) : null}

            {decisionState.status === "error" ? (
              <Alert tone="error" title="Решение не применено" showIcon>
                {decisionState.error}
              </Alert>
            ) : null}

            {decisionState.status === "success" ? (
              <Alert tone="success" title="Статус обновлен" showIcon>
                Решение модерации сохранено.
              </Alert>
            ) : null}

            {documentState.status === "error" ? (
              <Alert tone="error" title="Не удалось скачать документ" showIcon>
                {documentState.error}
              </Alert>
            ) : null}

            {detailState.status === "ready" && draft ? (
              <div className="moderator-dashboard-stack">
                <VerificationRequestSummary item={activeItem} onDownload={handleDocumentDownload} downloadState={documentState} />
                <section className="moderator-detail-group">
                  <h4 className="ui-type-h3">Редактирование профиля</h4>

                  <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                    <FormField label="Название компании" required>
                      <Input value={draft.companyName} onValueChange={(value) => updateDraft("companyName", value)} />
                    </FormField>
                    <FormField label="Юридический адрес">
                      <Input value={draft.legalAddress} onValueChange={(value) => updateDraft("legalAddress", value)} />
                    </FormField>
                  </div>

                  <FormField label="Описание">
                    <Textarea value={draft.description} onValueChange={(value) => updateDraft("description", value)} rows={5} autoResize />
                  </FormField>

                  <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                    <FormField label="Соцсети / ссылки">
                      <Textarea value={draft.socials} onValueChange={(value) => updateDraft("socials", value)} rows={4} autoResize />
                    </FormField>
                  </div>

                  <div className="company-dashboard-panel__actions">
                    <Button type="button" onClick={handleSave} disabled={saveState.status === "saving"}>
                      {saveState.status === "saving" ? "Сохраняем..." : "Сохранить профиль"}
                    </Button>
                  </div>
                </section>

                <section className="moderator-detail-group">
                  <h4 className="ui-type-h3">Решение модерации</h4>
                  <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
                    <FormField label="Статус верификации">
                      <Select value={decision} onValueChange={handleDecisionChange} options={COMPANY_DECISION_OPTIONS} />
                    </FormField>
                  </div>
                  <div className="company-dashboard-panel__actions">
                    <Button type="button" variant="secondary" onClick={handleOpenDecisionDialog} disabled={decisionState.status === "saving"}>
                      {decisionState.status === "saving" ? "Обновляем..." : "Применить решение"}
                    </Button>
                  </div>
                </section>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={decisionDialogOpen}
        onClose={handleCloseDecisionDialog}
        ariaLabel="Подтверждение решения по компании"
        showDismiss={false}
        closeOnEscape={decisionState.status !== "saving"}
        closeOnOverlayClick={decisionState.status !== "saving"}
        className="ui-moderation-action-dialog-shell"
      >
        <ModerationActionDialog
          variant={getDecisionDialogVariant(decision)}
          actionLabel={decisionDialogContent.actionLabel}
          question="Подтвердить решение?"
          description={decisionDialogContent.description}
          confirmLabel={decisionDialogContent.confirmLabel}
          busy={decisionState.status === "saving"}
          reasonLabel={decision === "rejected" ? "Комментарий модератора" : undefined}
          reasonValue={decisionReason}
          reasonPlaceholder={decision === "rejected" ? "Укажите причину отклонения компании" : undefined}
          reasonRequired={decision === "rejected"}
          onReasonChange={setDecisionReason}
          onCancel={handleCloseDecisionDialog}
          onConfirm={handleDecisionSave}
        />
      </Modal>
    </>
  );
}
