import { useMemo, useState } from "react";
import { confirmCandidateApplication, createCandidateOpportunityShare, getCandidateOpportunitySocialContext, withdrawCandidateApplication } from "../api/candidate";
import { buildOpportunityDetailRoute } from "../app/routes";
import { CandidateApplicationCard } from "./CandidateApplicationCard";
import { useCandidateApplications, upsertCandidateApplication } from "./candidate-applications-store";
import { Alert, Avatar, Button, Card, EmptyState, Loader, Modal, Tag, MailIcon, LinkIcon, MessageIcon } from "../shared/ui";
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

function buildInitials(name) {
  return String(name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "К";
}

function ShareMethodModal({ state, onClose, onSelectChat, onShareLink, onShareMail }) {
  return (
    <Modal
      open={state.methodModalOpen}
      onClose={onClose}
      title="Поделиться возможностью"
      description="Выберите удобный способ:"
      size="sm"
      className="opportunity-share-method-modal"
    >
      {state.methodFeedback ? (
        <Alert
          tone={state.methodFeedback.type}
          title={state.methodFeedback.type === "success" ? "Успешно" : "Ошибка"}
          showIcon
          style={{ marginBottom: "16px" }}
        >
          {state.methodFeedback.message}
        </Alert>
      ) : null}

      <div className="opportunity-share-modal__list">
        <Button
          type="button"
          variant="primary"
          iconStart={<MessageIcon />}
          onClick={onSelectChat}
          style={{ justifyContent: "flex-start", width: "100%" }}
        >
          Поделиться в чате сервиса
        </Button>
        <Button
          type="button"
          variant="secondary"
          iconStart={<LinkIcon />}
          onClick={onShareLink}
          style={{ justifyContent: "flex-start", width: "100%" }}
        >
          Скопировать ссылку
        </Button>
        <Button
          type="button"
          variant="secondary"
          iconStart={<MailIcon />}
          onClick={onShareMail}
          style={{ justifyContent: "flex-start", width: "100%" }}
        >
          Отправить по почте
        </Button>
      </div>
    </Modal>
  );
}

function ShareOpportunityModal({ state, onClose, onShareChat }) {
  return (
    <Modal
      open={state.open}
      onClose={onClose}
      title="Поделиться в чате"
      description="Выберите контакт, чтобы отправить ссылку во внутреннем чате."
      size="md"
    >
      {state.feedback ? (
        <Alert
          tone={state.feedback.type}
          title={state.feedback.type === "success" ? "Успешно" : "Ошибка"}
          showIcon
          style={{ marginBottom: "16px" }}
        >
          {state.feedback.message}
        </Alert>
      ) : null}

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
                <Avatar
                  initials={buildInitials(contact.name)}
                  shape="rounded"
                  className="opportunity-share-modal__avatar"
                />
                <div className="opportunity-share-modal__copy">
                  <strong>{contact.name}</strong>
                  <span>{contact.email || "Почта не указана"}</span>
                </div>
              </div>

              <div className="opportunity-share-modal__actions">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  loading={state.busyKey === `chat-${contact.id}`}
                  disabled={Boolean(state.busyKey) && state.busyKey !== `chat-${contact.id}`}
                  onClick={() => onShareChat(contact)}
                >
                  Отправить
                </Button>
              </div>
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
    feedback: null,
    methodModalOpen: false,
    methodFeedback: null,
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
      open: false,
      status: "idle",
      title: item.title,
      opportunityId: item.opportunityId,
      contacts: [],
      busyKey: "",
      error: "",
      feedback: null,
      methodModalOpen: true,
      methodFeedback: null,
    });
  }

  async function handleSelectShareOpportunityChat() {
    setShareState((current) => ({
      ...current,
      methodModalOpen: false,
      open: true,
      status: "loading",
      contacts: [],
      error: "",
      feedback: null,
    }));

    try {
      const socialContext = await getCandidateOpportunitySocialContext(shareState.opportunityId);
      const contacts = (Array.isArray(socialContext?.networkCandidates) ? socialContext.networkCandidates : [])
        .map(mapSocialUserToCard)
        .filter((contact) => canShareOpportunityWithRelationship(contact.relationship));

      setShareState((current) => ({
        ...current,
        status: "ready",
        contacts,
      }));
    } catch (error) {
      setShareState((current) => ({
        ...current,
        status: "error",
        error: error?.message ?? "Не удалось загрузить список контактов.",
      }));
    }
  }

  async function handleGeneralCopyLink() {
    if (!shareState.opportunityId) return;

    const shareUrl = typeof window !== "undefined"
      ? `${window.location.origin}${buildOpportunityDetailRoute(shareState.opportunityId)}`
      : buildOpportunityDetailRoute(shareState.opportunityId);
    const shareText = `Смотри, нашёл интересную возможность: ${shareState.title}\n${shareUrl}`;

    setShareState((current) => ({ ...current, methodFeedback: null }));

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        setShareState((current) => ({
          ...current,
          methodFeedback: {
            type: "success",
            message: "Ссылка успешно скопирована в буфер обмена.",
          },
        }));
      } else {
        throw new Error("Копирование не поддерживается вашим браузером.");
      }
    } catch (error) {
      setShareState((current) => ({
        ...current,
        methodFeedback: {
          type: "error",
          message: error?.message ?? "Не удалось скопировать ссылку.",
        },
      }));
    }
  }

  async function handleGeneralSendMail() {
    if (!shareState.opportunityId) return;

    const shareUrl = typeof window !== "undefined"
      ? `${window.location.origin}${buildOpportunityDetailRoute(shareState.opportunityId)}`
      : buildOpportunityDetailRoute(shareState.opportunityId);
    const shareText = `Смотри, нашёл интересную возможность: ${shareState.title}\n${shareUrl}`;

    setShareState((current) => ({ ...current, methodFeedback: null }));

    try {
      if (typeof window !== "undefined" && typeof window.open === "function") {
        const subject = encodeURIComponent(`Поделиться возможностью: ${shareState.title}`);
        const body = encodeURIComponent(shareText);
        window.open(`mailto:?subject=${subject}&body=${body}`, "_self");
        setShareState((current) => ({
          ...current,
          methodFeedback: {
            type: "success",
            message: "Открыто почтовое приложение.",
          },
        }));
      } else {
        throw new Error("Не удалось открыть почтовое приложение.");
      }
    } catch (error) {
      setShareState((current) => ({
        ...current,
        methodFeedback: {
          type: "error",
          message: error?.message ?? "Не удалось отправить по почте.",
        },
      }));
    }
  }

  async function handleShareOpportunityChat(contact) {
    if (!shareState.opportunityId) {
      return;
    }

    const busyKey = `chat-${contact.id}`;
    const shareUrl = typeof window !== "undefined"
      ? `${window.location.origin}${buildOpportunityDetailRoute(shareState.opportunityId)}`
      : buildOpportunityDetailRoute(shareState.opportunityId);
    const shareText = `Смотри, нашёл интересную возможность: ${shareState.title}\n${shareUrl}`;

    setShareState((current) => ({ ...current, busyKey, feedback: null, error: "" }));

    try {
      await createCandidateOpportunityShare({
        recipientUserId: Number(contact.userId),
        opportunityId: Number(shareState.opportunityId),
        note: shareText,
      });

      setShareState((current) => ({
        ...current,
        busyKey: "",
        feedback: {
          type: "success",
          message: `Вы успешно поделились возможностью в чате с ${contact.name || "пользователем"}.`,
        },
      }));
    } catch (error) {
      setShareState((current) => ({
        ...current,
        busyKey: "",
        feedback: {
          type: "error",
          message: error?.message ?? "Не удалось поделиться возможностью.",
        },
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
        onClose={() => setShareState((current) => ({ ...current, open: false, busyKey: "", feedback: null }))}
        onShareChat={handleShareOpportunityChat}
      />

      <ShareMethodModal
        state={shareState}
        onClose={() => setShareState((current) => ({ ...current, methodModalOpen: false, methodFeedback: null }))}
        onSelectChat={handleSelectShareOpportunityChat}
        onShareLink={handleGeneralCopyLink}
        onShareMail={handleGeneralSendMail}
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
