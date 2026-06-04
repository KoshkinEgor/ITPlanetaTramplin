import { useMemo, useState } from "react";
import { confirmCandidateApplication, createCandidateOpportunityShare, getCandidateOpportunitySocialContext, withdrawCandidateApplication } from "../api/candidate";
import { buildOpportunityDetailRoute } from "../app/routes";
import { CandidateApplicationCard } from "./CandidateApplicationCard";
import { useCandidateApplications, upsertCandidateApplication } from "./candidate-applications-store";
import { Alert, Button, Card, EmptyState, Loader, Modal, Tag } from "../shared/ui";
import { RESPONSE_FILTERS, RESPONSE_SORT_OPTIONS } from "./config";
import { mapCandidateApplicationToCard } from "./mappers";
import { canShareOpportunityWithRelationship, mapSocialUserToCard } from "./social";
import { CandidateFilterPill, CandidateSectionHeader, CandidateSortButton } from "./shared";

function SocialContextModal({ state, onClose }) {
  return (
    <Modal
      open={state.open}
      onClose={onClose}
      title={state.title || "Связи по отклику"}
      description="Контакты компании, люди из вашей сети и другие откликнувшиеся по выбранной возможности."
      size="lg"
    >
      {state.status === "loading" ? <Loader label="Загружаем связи по отклику" /> : null}

      {state.status === "error" ? (
        <Alert tone="error" title="Не удалось загрузить связи по отклику" showIcon>
          {state.error}
        </Alert>
      ) : null}

      {state.status === "ready" ? (
        <div className="candidate-page-stack">
          <Card>
            <strong>Связаться с компанией</strong>
            {state.socialContext.companyContacts.length ? (
              <div className="candidate-application-card__social-people">
                {state.socialContext.companyContacts.map((contact) => (
                  <Tag key={`${contact.type}-${contact.value}`} tone="accent">
                    {contact.label || contact.value}
                  </Tag>
                ))}
              </div>
            ) : (
              <p className="candidate-application-card__social-value">У компании нет публичных контактов</p>
            )}
          </Card>

          <Card>
            <strong>Люди из вашей сети</strong>
            {state.socialContext.networkCandidates.length ? (
              <div className="candidate-application-card__social-people">
                {state.socialContext.networkCandidates.map((person) => (
                  <Tag key={person.id} tone="accent">
                    {person.name}
                  </Tag>
                ))}
              </div>
            ) : (
              <p className="candidate-application-card__social-value">Нет релевантных контактов</p>
            )}
          </Card>

          <Card>
            <strong>Другие откликнувшиеся</strong>
            {state.socialContext.peers.length ? (
              <div className="candidate-application-card__social-people">
                {state.socialContext.peers.map((person) => (
                  <Tag key={person.id} tone="accent">
                    {person.name}
                  </Tag>
                ))}
              </div>
            ) : (
              <p className="candidate-application-card__social-value">Пока нет откликнувшихся с открытым профилем</p>
            )}
          </Card>
        </div>
      ) : null}

      <div className="candidate-application-card__actions">
        <Button type="button" onClick={onClose}>
          Закрыть
        </Button>
      </div>
    </Modal>
  );
}

function ShareOpportunityModal({ state, onClose, onShare }) {
  return (
    <Modal
      open={state.open}
      onClose={onClose}
      title={state.title || "Поделиться возможностью"}
      description="Выберите контакт из вашей сети, которому хотите отправить возможность."
      size="md"
    >
      {state.status === "loading" ? <Loader label="Загружаем контакты для отправки" /> : null}

      {state.error ? (
        <Alert tone="error" title="Не удалось открыть список контактов" showIcon>
          {state.error}
        </Alert>
      ) : null}

      {state.status === "ready" && !state.contacts.length ? (
        <EmptyState
          eyebrow="Пока пусто"
          title="Нет контактов, с кем можно поделиться"
          description="Поделиться возможностью можно с сохранёнными контактами и друзьями."
          tone="neutral"
          compact
        />
      ) : null}

      {state.status === "ready" && state.contacts.length ? (
        <div className="opportunity-share-modal__list">
          {state.contacts.map((contact) => (
            <div key={contact.id} className="opportunity-share-modal__item">
              <div className="opportunity-share-modal__identity">
                <div className="opportunity-share-modal__copy">
                  <strong>{contact.name}</strong>
                  <span>{contact.email || "Почта не указана"}</span>
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                loading={state.busyKey === String(contact.id)}
                disabled={Boolean(state.busyKey) && state.busyKey !== String(contact.id)}
                onClick={() => onShare(contact)}
              >
                Поделиться
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </Modal>
  );
}

export function CandidateResponsesApp() {
  const applicationsState = useCandidateApplications();
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("attention");
  const [pendingAction, setPendingAction] = useState({ applicationId: null, kind: null, error: "" });
  const [withdrawConfirmState, setWithdrawConfirmState] = useState({ open: false, item: null });
  const [socialContextState, setSocialContextState] = useState({
    open: false,
    status: "idle",
    title: "",
    error: "",
    socialContext: {
      companyContacts: [],
      networkCandidates: [],
      peers: [],
    },
  });
  const [shareState, setShareState] = useState({
    open: false,
    status: "idle",
    title: "",
    opportunityId: null,
    contacts: [],
    busyKey: "",
    error: "",
  });

  const filteredItems = useMemo(() => {
    let applications = Array.isArray(applicationsState.applications) ? applicationsState.applications : [];

    if (statusFilter !== "all") {
      applications = applications.filter((item) => item.status === statusFilter);
    }

    const sorted = [...applications];

    if (sortBy === "newest") {
      sorted.sort((a, b) => new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0));
    } else if (sortBy === "oldest") {
      sorted.sort((a, b) => new Date(a.appliedAt || 0) - new Date(b.appliedAt || 0));
    } else if (sortBy === "title") {
      sorted.sort((a, b) => (a.opportunityTitle || "").localeCompare(b.opportunityTitle || "", "ru"));
    } else if (sortBy === "attention") {
      const getPriority = (status) => {
        const norm = typeof status === "string" ? status.trim().toLowerCase() : "";
        if (norm === "invited") return 0;
        if (norm === "reviewing") return 1;
        if (norm === "submitted") return 2;
        return 3;
      };
      sorted.sort((a, b) => {
        const priorityDiff = getPriority(a.status) - getPriority(b.status);
        if (priorityDiff !== 0) {
          return priorityDiff;
        }
        return new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0);
      });
    }

    return sorted.map(mapCandidateApplicationToCard);
  }, [applicationsState.applications, statusFilter, sortBy]);

  async function handleWithdraw(item) {
    setWithdrawConfirmState({ open: true, item });
  }

  async function handleConfirmWithdraw() {
    const item = withdrawConfirmState.item;
    if (!item) return;

    setWithdrawConfirmState({ open: false, item: null });
    setPendingAction({ applicationId: item.id, kind: "withdraw", error: "" });

    try {
      const updatedApplication = await withdrawCandidateApplication(item.id);
      upsertCandidateApplication(updatedApplication);
      setPendingAction({ applicationId: null, kind: null, error: "" });
    } catch (error) {
      setPendingAction({
        applicationId: null,
        kind: null,
        error: error?.message ?? "Не удалось отменить отклик.",
      });
    }
  }

  async function handleConfirm(item) {
    setPendingAction({ applicationId: item.id, kind: "confirm", error: "" });

    try {
      const updatedApplication = await confirmCandidateApplication(item.id);
      upsertCandidateApplication(updatedApplication);
      setPendingAction({ applicationId: null, kind: null, error: "" });
    } catch (error) {
      setPendingAction({
        applicationId: null,
        kind: null,
        error: error?.message ?? "Не удалось подтвердить участие.",
      });
    }
  }

  async function handleOpenSocialContext(item) {
    setSocialContextState({
      open: true,
      status: "loading",
      title: item.title,
      error: "",
      socialContext: {
        companyContacts: [],
        networkCandidates: [],
        peers: [],
      },
    });

    try {
      const socialContext = await getCandidateOpportunitySocialContext(item.opportunityId);
      setSocialContextState({
        open: true,
        status: "ready",
        title: item.title,
        error: "",
        socialContext: {
          companyContacts: Array.isArray(socialContext?.companyContacts) ? socialContext.companyContacts : [],
          networkCandidates: Array.isArray(socialContext?.networkCandidates) ? socialContext.networkCandidates : [],
          peers: Array.isArray(socialContext?.peers) ? socialContext.peers : [],
        },
      });
    } catch (error) {
      setSocialContextState({
        open: true,
        status: "error",
        title: item.title,
        error: error?.message ?? "Не удалось загрузить связи по отклику.",
        socialContext: {
          companyContacts: [],
          networkCandidates: [],
          peers: [],
        },
      });
    }
  }

  async function handleOpenShareOpportunity(item) {
    setShareState({
      open: true,
      status: "loading",
      title: item.title,
      opportunityId: item.opportunityId,
      contacts: [],
      busyKey: "",
      error: "",
    });

    try {
      const previewContacts = Array.isArray(item.socialContextPreview?.networkCandidates)
        ? item.socialContextPreview.networkCandidates.filter((contact) => canShareOpportunityWithRelationship(contact.relationship))
        : [];

      if (previewContacts.length) {
        setShareState({
          open: true,
          status: "ready",
          title: item.title,
          opportunityId: item.opportunityId,
          contacts: previewContacts,
          busyKey: "",
          error: "",
        });
        return;
      }

      const socialContext = await getCandidateOpportunitySocialContext(item.opportunityId);
      const contacts = (Array.isArray(socialContext?.networkCandidates) ? socialContext.networkCandidates : [])
        .map(mapSocialUserToCard)
        .filter((contact) => canShareOpportunityWithRelationship(contact.relationship));

      setShareState({
        open: true,
        status: "ready",
        title: item.title,
        opportunityId: item.opportunityId,
        contacts,
        busyKey: "",
        error: "",
      });
    } catch (error) {
      setShareState({
        open: true,
        status: "error",
        title: item.title,
        opportunityId: item.opportunityId,
        contacts: [],
        busyKey: "",
        error: error?.message ?? "Не удалось загрузить список контактов.",
      });
    }
  }

  async function handleShareOpportunity(contact) {
    if (!shareState.opportunityId) {
      return;
    }

    const busyKey = String(contact.id);
    const shareUrl = typeof window !== "undefined"
      ? `${window.location.origin}${buildOpportunityDetailRoute(shareState.opportunityId)}`
      : buildOpportunityDetailRoute(shareState.opportunityId);
    const shareText = `Смотри, нашёл интересную возможность: ${shareState.title}\n${shareUrl}`;

    setShareState((current) => ({ ...current, busyKey, error: "" }));

    try {
      await createCandidateOpportunityShare({
        recipientUserId: Number(contact.userId),
        opportunityId: Number(shareState.opportunityId),
        note: shareText,
      });

      if (contact?.email && typeof window !== "undefined" && typeof window.open === "function") {
        const subject = encodeURIComponent(`Поделиться возможностью: ${shareState.title}`);
        const body = encodeURIComponent(shareText);
        window.open(`mailto:${contact.email}?subject=${subject}&body=${body}`, "_self");
      }

      setShareState((current) => ({
        ...current,
        open: false,
        busyKey: "",
      }));
    } catch (error) {
      setShareState((current) => ({
        ...current,
        busyKey: "",
        error: error?.message ?? "Не удалось поделиться возможностью.",
      }));
    }
  }

  return (
    <section className="candidate-page-section">
      <CandidateSectionHeader
        eyebrow="Отклики"
        title="Мои отклики"
        description="Соберите свой портфолио и резюме для точных рекомендаций."
      />

      {pendingAction.error ? (
        <Alert tone="error" title="Не удалось обновить отклик" showIcon>
          {pendingAction.error}
        </Alert>
      ) : null}

      {applicationsState.status === "loading" && applicationsState.applications.length === 0 ? (
        <Loader label="Загружаем отклики" surface />
      ) : null}

      {applicationsState.status === "unauthorized" ? (
        <Card>
          <EmptyState
            eyebrow="Доступ ограничен"
            title="Нужно войти как кандидат"
            description="Отклики доступны только после авторизации кандидата."
            tone="warning"
          />
        </Card>
      ) : null}

      {applicationsState.status === "error" && applicationsState.applications.length === 0 ? (
        <Alert tone="error" title="Не удалось загрузить отклики" showIcon>
          {applicationsState.error?.message ?? "Попробуйте повторить позже."}
        </Alert>
      ) : null}

      {applicationsState.status === "ready" || applicationsState.applications.length ? (
        <>
          <div className="candidate-filter-row">
            <div className="candidate-filter-row__group">
              {RESPONSE_FILTERS.map((filter) => (
                <CandidateFilterPill
                  key={filter.value}
                  label={filter.label}
                  active={filter.value === statusFilter}
                  onClick={() => setStatusFilter(filter.value)}
                />
              ))}
            </div>
            <CandidateSortButton
              value={sortBy}
              onSelect={setSortBy}
              options={RESPONSE_SORT_OPTIONS}
            />
          </div>

          {filteredItems.length ? (
            <div className="candidate-page-stack">
              {filteredItems.map((item) => (
                <CandidateApplicationCard
                  key={item.id}
                  item={item}
                  isPending={pendingAction.applicationId === item.id}
                  onWithdraw={handleWithdraw}
                  onConfirm={handleConfirm}
                />
              ))}
            </div>
          ) : (
            <Card>
              <EmptyState
                eyebrow="Пока пусто"
                title="Нет откликов в выбранном статусе"
                description="Список появится после откликов на опубликованные и одобренные возможности."
                tone="neutral"
              />
            </Card>
          )}
        </>
      ) : null}

      <SocialContextModal
        state={socialContextState}
        onClose={() => setSocialContextState((current) => ({ ...current, open: false }))}
      />

      <ShareOpportunityModal
        state={shareState}
        onClose={() => setShareState((current) => ({ ...current, open: false, busyKey: "" }))}
        onShare={handleShareOpportunity}
      />

      <Modal
        open={withdrawConfirmState.open}
        onClose={() => setWithdrawConfirmState({ open: false, item: null })}
        title={withdrawConfirmState.item?.status === "invited" ? "Отклонить приглашение?" : "Отменить отклик?"}
        tone="warning"
        showIcon
        actions={
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", width: "100%" }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setWithdrawConfirmState({ open: false, item: null })}
            >
              Назад
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirmWithdraw}
            >
              {withdrawConfirmState.item?.status === "invited" ? "Да, отклонить" : "Да, отменить"}
            </Button>
          </div>
        }
      >
        <p className="ui-type-body">
          {withdrawConfirmState.item?.status === "invited"
            ? "Вы уверены, что хотите отклонить приглашение организатора? Это действие нельзя будет отменить."
            : "Вы уверены, что хотите отменить отклик? Действие нельзя будет вернуть. При повторном отправлении отклика он будет рассмотрен полностью заново."}
        </p>
      </Modal>
    </section>
  );
}
