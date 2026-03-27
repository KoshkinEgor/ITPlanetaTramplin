import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  acceptCandidateFriendRequest,
  acceptCandidateProjectInvite,
  cancelCandidateProjectInvite,
  declineCandidateFriendRequest,
  declineCandidateProjectInvite,
  deleteCandidateContact,
  getCandidateContacts,
  getCandidateFriendRequests,
  getCandidateFriends,
  getCandidateProjectInvites,
} from "../api/candidate";
import { useAuthSession } from "../auth/api";
import {
  buildSocialProfileHref,
  getFriendRequestDirection,
  getIncomingFriendRequests,
  getProjectInviteDirection,
  mapSocialUserToCard,
  normalizeRelationship,
} from "./social";
import { formatLongDate } from "./mappers";
import { Alert, Avatar, Button, Card, EmptyState, Loader, SegmentedControl, Tabs, Tag } from "../shared/ui";
import { CandidateSectionHeader } from "./shared";

function normalizeTab(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return ["contacts", "friends", "incoming", "project-invites"].includes(normalized) ? normalized : "contacts";
}

function SocialHubCard({ title, subtitle, meta, tags = [], badge, href, actions = [] }) {
  const initials = String(title ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "К";

  return (
    <Card className="candidate-social-card">
      <div className="candidate-social-card__head">
        <div className="candidate-social-card__identity">
          <Avatar initials={initials} shape="rounded" className="candidate-social-card__avatar" />
          <div className="candidate-social-card__copy">
            <strong>{title}</strong>
            {subtitle ? <span>{subtitle}</span> : null}
          </div>
        </div>
        {badge ? <Tag tone={badge.tone}>{badge.label}</Tag> : null}
      </div>

      {meta ? <p className="candidate-social-card__meta">{meta}</p> : null}

      {tags.length ? (
        <div className="candidate-social-card__tags">
          {tags.map((tag) => (
            <Tag key={tag} tone="accent">
              {tag}
            </Tag>
          ))}
        </div>
      ) : null}

      <div className="candidate-social-card__actions">
        <Button href={href} variant="secondary" className="candidate-social-card__action">
          Открыть профиль
        </Button>
        {actions.filter(Boolean).map((action) => (
          <Button
            key={action.key}
            type="button"
            variant={action.variant ?? "primary"}
            className="candidate-social-card__action"
            loading={action.loading}
            disabled={action.disabled}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}

export function CandidateContactsApp() {
  const authSession = useAuthSession();
  const authUser = authSession.status === "authenticated" ? authSession.user : null;
  const [searchParams, setSearchParams] = useSearchParams();
  const [inviteFilter, setInviteFilter] = useState("pending");
  const [busyKey, setBusyKey] = useState("");
  const [state, setState] = useState({
    status: "loading",
    contacts: [],
    friends: [],
    friendRequests: [],
    projectInvites: [],
    error: null,
  });

  const currentTab = normalizeTab(searchParams.get("tab"));

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const [contacts, friends, friendRequests, projectInvites] = await Promise.all([
          getCandidateContacts(controller.signal),
          getCandidateFriends(controller.signal),
          getCandidateFriendRequests(controller.signal),
          getCandidateProjectInvites(controller.signal),
        ]);

        setState({
          status: "ready",
          contacts: Array.isArray(contacts) ? contacts : [],
          friends: Array.isArray(friends) ? friends : [],
          friendRequests: Array.isArray(friendRequests) ? friendRequests : [],
          projectInvites: Array.isArray(projectInvites) ? projectInvites : [],
          error: null,
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            status: "error",
            contacts: [],
            friends: [],
            friendRequests: [],
            projectInvites: [],
            error,
          });
        }
      }
    }

    load();
    return () => controller.abort();
  }, []);

  async function reload() {
    setState((current) => ({ ...current, status: "loading" }));

    try {
      const [contacts, friends, friendRequests, projectInvites] = await Promise.all([
        getCandidateContacts(),
        getCandidateFriends(),
        getCandidateFriendRequests(),
        getCandidateProjectInvites(),
      ]);

      setState({
        status: "ready",
        contacts: Array.isArray(contacts) ? contacts : [],
        friends: Array.isArray(friends) ? friends : [],
        friendRequests: Array.isArray(friendRequests) ? friendRequests : [],
        projectInvites: Array.isArray(projectInvites) ? projectInvites : [],
        error: null,
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        status: "error",
        error,
      }));
    }
  }

  function changeTab(nextTab) {
    setSearchParams((current) => {
      const nextParams = new URLSearchParams(current);
      nextParams.set("tab", nextTab);
      return nextParams;
    }, { replace: true });
  }

  async function runCardAction(actionKey, callback) {
    try {
      setBusyKey(actionKey);
      await callback();
      await reload();
    } finally {
      setBusyKey("");
    }
  }

  const contactCards = useMemo(
    () => state.contacts
      .filter((item) => normalizeRelationship(item.relationship).friendState !== "friends")
      .map(mapSocialUserToCard),
    [state.contacts]
  );

  const friendCards = useMemo(
    () => state.friends.map(mapSocialUserToCard),
    [state.friends]
  );

  const incomingRequests = useMemo(
    () => getIncomingFriendRequests(state.friendRequests, authUser?.id),
    [authUser?.id, state.friendRequests]
  );

  const filteredProjectInvites = useMemo(() => {
    const invites = Array.isArray(state.projectInvites) ? state.projectInvites : [];

    if (inviteFilter === "pending") {
      return invites.filter((item) => item.status === "pending");
    }

    if (inviteFilter === "history") {
      return invites.filter((item) => item.status !== "pending");
    }

    return invites;
  }, [inviteFilter, state.projectInvites]);

  const contactsContent = contactCards.length ? (
    <div className="candidate-page-grid candidate-page-grid--two">
      {contactCards.map((card) => (
        <SocialHubCard
          key={card.id}
          title={card.name}
          subtitle={card.email || "Сохранённый контакт"}
          meta="Пользователь уже добавлен в вашу сеть контактов."
          tags={card.skills}
          badge={card.badge}
          href={card.href}
          actions={card.userId ? [{
            key: "remove-contact",
            label: "Удалить из контактов",
            variant: "ghost",
            loading: busyKey === `delete-contact-${card.userId}`,
            onClick: () => runCardAction(`delete-contact-${card.userId}`, () => deleteCandidateContact(card.userId)),
          }] : []}
        />
      ))}
    </div>
  ) : (
    <Card>
      <EmptyState
        eyebrow="Пока пусто"
        title="Сохранённых контактов пока нет"
        description="Добавляйте пользователей в контакты из их публичного профиля."
        tone="neutral"
      />
    </Card>
  );

  const friendsContent = friendCards.length ? (
    <div className="candidate-page-grid candidate-page-grid--two">
      {friendCards.map((card) => (
        <SocialHubCard
          key={card.id}
          title={card.name}
          subtitle={card.email || "Подтверждённый друг"}
          meta="Пользователь подтвердил дружбу и теперь находится в отдельном friend-листе."
          tags={card.skills}
          badge={card.badge}
          href={card.href}
        />
      ))}
    </div>
  ) : (
    <Card>
      <EmptyState
        eyebrow="Пока пусто"
        title="Друзей пока нет"
        description="Когда другая сторона подтвердит заявку, контакт появится в этом разделе."
        tone="neutral"
      />
    </Card>
  );

  const incomingContent = incomingRequests.length ? (
    <div className="candidate-page-grid candidate-page-grid--two">
      {incomingRequests.map((request) => {
        const card = mapSocialUserToCard(request.counterparty);

        return (
          <SocialHubCard
            key={request.id}
            title={card.name}
            subtitle={card.email || "Входящая заявка в друзья"}
            meta={request.createdAt ? `Получена ${formatLongDate(request.createdAt)}` : "Пользователь хочет добавить вас в друзья."}
            tags={card.skills}
            badge={{ label: "Заявка", tone: "soft" }}
            href={card.href}
            actions={[
              {
                key: "accept",
                label: "Принять",
                loading: busyKey === `accept-friend-${request.id}`,
                onClick: () => runCardAction(`accept-friend-${request.id}`, () => acceptCandidateFriendRequest(request.id)),
              },
              {
                key: "decline",
                label: "Отклонить",
                variant: "secondary",
                loading: busyKey === `decline-friend-${request.id}`,
                onClick: () => runCardAction(`decline-friend-${request.id}`, () => declineCandidateFriendRequest(request.id)),
              },
            ]}
          />
        );
      })}
    </div>
  ) : (
    <Card>
      <EmptyState
        eyebrow="Тихо"
        title="Новых заявок в друзья нет"
        description="Все входящие действия будут появляться здесь и в колокольчике header."
        tone="neutral"
      />
    </Card>
  );

  const projectInvitesContent = (
    <div className="candidate-page-stack">
      <div className="candidate-social-filter-row">
        <SegmentedControl
          items={[
            { value: "pending", label: "Ожидают" },
            { value: "history", label: "История" },
            { value: "all", label: "Все" },
          ]}
          value={inviteFilter}
          onChange={setInviteFilter}
          ariaLabel="Фильтр приглашений в проекты"
        />
      </div>

      {filteredProjectInvites.length ? (
        <div className="candidate-page-grid candidate-page-grid--two">
          {filteredProjectInvites.map((invite) => {
            const card = mapSocialUserToCard(invite.counterparty);
            const direction = getProjectInviteDirection(invite, authUser?.id);
            const isIncoming = direction === "incoming";
            const isPending = invite.status === "pending";
            const metaParts = [
              invite.projectTitle ? `Проект: ${invite.projectTitle}` : "Приглашение в проект",
              invite.role ? `Роль: ${invite.role}` : "",
              invite.createdAt ? `Обновлено ${formatLongDate(invite.createdAt)}` : "",
            ].filter(Boolean);

            return (
              <SocialHubCard
                key={invite.id}
                title={card.name}
                subtitle={card.email || "Приглашение в проект"}
                meta={metaParts.join(" · ")}
                tags={card.skills}
                badge={{
                  label: isIncoming ? "Входящий инвайт" : isPending ? "Исходящий инвайт" : "Инвайт",
                  tone: isIncoming ? "warning" : "neutral",
                }}
                href={card.href}
                actions={[
                  isIncoming && isPending ? {
                    key: "accept",
                    label: "Принять",
                    loading: busyKey === `accept-invite-${invite.id}`,
                    onClick: () => runCardAction(`accept-invite-${invite.id}`, () => acceptCandidateProjectInvite(invite.id)),
                  } : null,
                  isIncoming && isPending ? {
                    key: "decline",
                    label: "Отклонить",
                    variant: "secondary",
                    loading: busyKey === `decline-invite-${invite.id}`,
                    onClick: () => runCardAction(`decline-invite-${invite.id}`, () => declineCandidateProjectInvite(invite.id)),
                  } : null,
                  !isIncoming && isPending ? {
                    key: "cancel",
                    label: "Отменить",
                    variant: "secondary",
                    loading: busyKey === `cancel-invite-${invite.id}`,
                    onClick: () => runCardAction(`cancel-invite-${invite.id}`, () => cancelCandidateProjectInvite(invite.id)),
                  } : null,
                ]}
              />
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            eyebrow="Пока пусто"
            title="Приглашений в проекты нет"
            description="Отправляйте их из публичного профиля контактов и друзей."
            tone="neutral"
          />
        </Card>
      )}
    </div>
  );

  const tabs = [
    { value: "contacts", label: "Контакты", badge: contactCards.length, content: contactsContent },
    { value: "friends", label: "Друзья", badge: friendCards.length, content: friendsContent },
    { value: "incoming", label: "Входящие", badge: incomingRequests.length, content: incomingContent },
    { value: "project-invites", label: "Приглашения в проекты", badge: filteredProjectInvites.length, content: projectInvitesContent },
  ];

  return (
    <section className="candidate-page-section candidate-social-hub" data-testid="candidate-contacts-app">
      <CandidateSectionHeader
        title="Контакты и связи"
        description="Управляйте сохранёнными контактами, друзьями и входящими действиями из одного места."
      />

      {state.status === "loading" ? <Loader label="Загружаем social hub" surface /> : null}

      {state.status === "error" ? (
        <Alert tone="error" title="Не удалось загрузить social hub" showIcon>
          {state.error?.message ?? "Попробуйте обновить страницу позже."}
        </Alert>
      ) : null}

      {state.status === "ready" ? (
        <Tabs
          value={currentTab}
          onChange={changeTab}
          tabListLabel="Разделы social hub"
          items={tabs}
          className="candidate-social-tabs"
        />
      ) : null}
    </section>
  );
}
