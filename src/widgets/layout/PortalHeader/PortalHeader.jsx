import { useEffect, useMemo, useRef, useState } from "react";
import {
  acceptCandidateFriendRequest,
  acceptCandidateProjectInvite,
  declineCandidateFriendRequest,
  declineCandidateProjectInvite,
  getCandidateFriendRequests,
  getCandidateProjectInvites,
} from "../../../api/candidate";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../../../api/notifications";
import { AppLink } from "../../../app/AppLink";
import { buildCandidateContactsRoute, routes } from "../../../app/routes";
import { useAuthSession } from "../../../auth/api";
import {
  buildSocialProfileHref,
  getIncomingFriendRequests,
  getIncomingProjectInvites,
  getPendingNotificationCount,
} from "../../../candidate-portal/social";
import { AuthAccountMenu } from "../../../auth/AuthAccountMenu";
import { ChatDrawerTrigger } from "../../../chat";
import { cn } from "../../../shared/lib/cn";
import { Button, IconButton } from "../../../shared/ui";
import "./PortalHeader.css";

function HeartIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 16.2s-5.2-3.5-6.7-6.6C2.1 7.2 3.2 4.5 6 4.5c1.5 0 2.7.8 4 2.3 1.3-1.5 2.5-2.3 4-2.3 2.8 0 3.9 2.7 2.7 5.1-1.5 3.1-6.7 6.6-6.7 6.6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 3.5a4 4 0 0 0-4 4v1.3c0 .8-.2 1.6-.7 2.2L4.3 12a1 1 0 0 0 .7 1.7h10a1 1 0 0 0 .7-1.7l-1-.9a3.4 3.4 0 0 1-.7-2.2V7.5a4 4 0 0 0-4-4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.2 15.5a2 2 0 0 0 3.6 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4.2 5.4c0-1 0.8-1.8 1.8-1.8h8c1 0 1.8.8 1.8 1.8v5.3c0 1-.8 1.8-1.8 1.8H9.2L5 16v-3.5H6c-1 0-1.8-.8-1.8-1.8V5.4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M7.4 7.4h5.2M7.4 9.8h3.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function GuestProfileIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="6.7" r="3.1" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.5 16c1-2.5 3-4 5.5-4s4.5 1.5 5.5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 6h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 14h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const DEFAULT_ICON_BUTTONS = [
  { key: "favorites", label: "Избранное", href: routes.favorites, icon: <HeartIcon /> },
  { key: "messages", label: "Сообщения", icon: <MessageIcon /> },
  { key: "notifications", label: "Уведомления", icon: <BellIcon /> },
];

function isMissingSocialEndpoint(error) {
  return Number(error?.status) === 404;
}

function getDefaultNotificationHref(authUser) {
  switch (authUser?.role) {
    case "candidate":
      return routes.candidate.responses;
    case "company":
      return routes.company.dashboard;
    case "moderator":
      return routes.moderator.dashboard;
    default:
      return routes.home;
  }
}

function formatNotificationDate(value) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

const NOTIFICATION_SECTIONS = [
  { key: "actions", title: "Требуют действия" },
  { key: "applications", title: "Отклики" },
  { key: "moderation", title: "Модерация и жалобы" },
  { key: "system", title: "Системные" },
];

function getStoredNotificationSectionKey(notification) {
  const type = String(notification?.type ?? notification?.Type ?? "").toLowerCase();

  if (type.includes("application")) {
    return "applications";
  }

  if (
    type.includes("complaint") ||
    type.includes("moderation") ||
    type.includes("company") ||
    type.includes("opportunity") ||
    type.includes("candidate")
  ) {
    return "moderation";
  }

  return "system";
}

function buildNotificationSections(items) {
  return NOTIFICATION_SECTIONS
    .map((section) => ({
      ...section,
      items: items.filter((item) => item.sectionKey === section.key),
    }))
    .filter((section) => section.items.length > 0);
}

async function loadNotificationCollections(authUserRole, signal) {
  const notificationsResponse = await getNotifications({}, signal).catch((error) => {
    if (isMissingSocialEndpoint(error)) {
      return [];
    }

    throw error;
  });
  const notifications = Array.isArray(notificationsResponse) ? notificationsResponse : [];

  if (authUserRole !== "candidate") {
    return {
      status: "ready",
      notifications,
      friendRequests: [],
      projectInvites: [],
      error: null,
    };
  }

  try {
    const [friendRequests, projectInvites] = await Promise.all([
      getCandidateFriendRequests(signal),
      getCandidateProjectInvites(signal),
    ]);

    return {
      status: "ready",
      notifications,
      friendRequests: Array.isArray(friendRequests) ? friendRequests : [],
      projectInvites: Array.isArray(projectInvites) ? projectInvites : [],
      error: null,
    };
  } catch (error) {
    if (isMissingSocialEndpoint(error)) {
      return {
        status: "ready",
        notifications,
        friendRequests: [],
        projectInvites: [],
        error: null,
      };
    }

    throw error;
  }
}

function PortalHeaderNotifications({ authUser }) {
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const [state, setState] = useState({
    status: "loading",
    notifications: [],
    friendRequests: [],
    projectInvites: [],
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setState(await loadNotificationCollections(authUser?.role, controller.signal));
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: "error",
          notifications: [],
          friendRequests: [],
          projectInvites: [],
          error,
        });
      }
    }

    load();
    return () => controller.abort();
  }, [authUser?.id, authUser?.role]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!panelRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function reload() {
    try {
      setState(await loadNotificationCollections(authUser?.role));
    } catch (error) {
      setState((current) => ({ ...current, status: "error", error }));
    }
  }

  async function runNotificationAction(actionKey, callback) {
    try {
      setBusyKey(actionKey);
      await callback();
      await reload();
    } finally {
      setBusyKey("");
    }
  }

  function markStoredNotificationRead(notificationId) {
    return runNotificationAction(`read-notification-${notificationId}`, () => markNotificationRead(notificationId));
  }

  function markStoredNotificationsRead() {
    return runNotificationAction("read-all-notifications", markAllNotificationsRead);
  }

  const incomingFriendRequests = useMemo(
    () => getIncomingFriendRequests(state.friendRequests, authUser?.id),
    [authUser?.id, state.friendRequests]
  );

  const incomingProjectInvites = useMemo(
    () => getIncomingProjectInvites(state.projectInvites, authUser?.id),
    [authUser?.id, state.projectInvites]
  );

  const storedItems = state.notifications.map((notification) => {
    const notificationId = notification.id ?? notification.notificationId;
    const createdAt = notification.createdAt ?? notification.created_at;
    const isRead = Boolean(notification.isRead ?? notification.is_read);
    const dateLabel = formatNotificationDate(createdAt);

    return {
      id: `notification-${notificationId}`,
      kind: "stored",
      sectionKey: getStoredNotificationSectionKey(notification),
      href: notification.link || getDefaultNotificationHref(authUser),
      openLabel: "Открыть",
      title: notification.title || "Уведомление",
      description: notification.message || dateLabel || "Новое уведомление",
      createdAt,
      isRead,
      secondaryAction: isRead
        ? null
        : {
          key: `read-notification-${notificationId}`,
          label: "Прочитано",
          onClick: () => markStoredNotificationRead(notificationId),
        },
    };
  });

  const friendItems = incomingFriendRequests.map((request) => ({
    id: `friend-${request.id}`,
    kind: "candidate-action",
    sectionKey: "actions",
    href: buildSocialProfileHref(request.counterparty),
    openLabel: "Открыть профиль",
    title: `${request.counterparty?.name || request.counterparty?.email || "Кандидат"} отправил заявку в друзья`,
    description: request.createdAt ? `Получена ${new Date(request.createdAt).toLocaleDateString("ru-RU")}` : "Новая заявка в друзья",
    primaryAction: {
      key: `accept-friend-${request.id}`,
      label: "Принять",
      onClick: () => runNotificationAction(`accept-friend-${request.id}`, () => acceptCandidateFriendRequest(request.id)),
    },
    secondaryAction: {
      key: `decline-friend-${request.id}`,
      label: "Отклонить",
      onClick: () => runNotificationAction(`decline-friend-${request.id}`, () => declineCandidateFriendRequest(request.id)),
    },
    createdAt: request.createdAt,
  }));

  const inviteItems = incomingProjectInvites.map((invite) => ({
    id: `invite-${invite.id}`,
    kind: "candidate-action",
    sectionKey: "actions",
    href: buildSocialProfileHref(invite.counterparty),
    openLabel: "Открыть профиль",
    title: `${invite.counterparty?.name || invite.counterparty?.email || "Кандидат"} пригласил вас в проект`,
    description: invite.projectTitle ? `Проект: ${invite.projectTitle}` : "Новое приглашение в проект",
    primaryAction: {
      key: `accept-invite-${invite.id}`,
      label: "Принять",
      onClick: () => runNotificationAction(`accept-invite-${invite.id}`, () => acceptCandidateProjectInvite(invite.id)),
    },
    secondaryAction: {
      key: `decline-invite-${invite.id}`,
      label: "Отклонить",
      onClick: () => runNotificationAction(`decline-invite-${invite.id}`, () => declineCandidateProjectInvite(invite.id)),
    },
    createdAt: invite.createdAt,
  }));

  const notificationItems = [...storedItems, ...friendItems, ...inviteItems].sort(
    (left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0)
  );
  const notificationSections = buildNotificationSections(notificationItems);

  const unreadStoredCount = state.notifications.filter((notification) => (notification.isRead ?? notification.is_read) !== true).length;
  const badgeCount = unreadStoredCount + getPendingNotificationCount(state.friendRequests, state.projectInvites, authUser?.id);
  const hasCandidateActions = incomingFriendRequests.length || incomingProjectInvites.length;
  const deepLink = incomingFriendRequests.length
    ? buildCandidateContactsRoute({ tab: "incoming" })
    : buildCandidateContactsRoute({ tab: "project-invites" });

  return (
    <div ref={panelRef} className="portal-header__notification-shell">
      <button
        type="button"
        className={cn("portal-header__notification-button", open && "is-open")}
        aria-label="Уведомления"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
      >
        <BellIcon />
        {badgeCount ? <span className="portal-header__notification-badge">{badgeCount}</span> : null}
      </button>

      {open ? (
        <div className="portal-header__notification-panel" role="dialog" aria-label="Уведомления">
          <div className="portal-header__notification-head">
            <strong>Уведомления</strong>
            <div className="portal-header__notification-head-actions">
              {hasCandidateActions ? <AppLink href={deepLink}>Все действия</AppLink> : null}
              {unreadStoredCount ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  loading={busyKey === "read-all-notifications"}
                  onClick={markStoredNotificationsRead}
                >
                  Прочитать все
                </Button>
              ) : null}
            </div>
          </div>

          {state.status === "loading" ? <p className="portal-header__notification-empty">Загружаем уведомления...</p> : null}
          {state.status === "error" ? (
            <p className="portal-header__notification-empty">{state.error?.message ?? "Не удалось загрузить уведомления."}</p>
          ) : null}
          {state.status === "ready" && !notificationItems.length ? (
            <p className="portal-header__notification-empty">Новых уведомлений нет.</p>
          ) : null}

          {notificationSections.map((section) => (
            <section key={section.key} className="portal-header__notification-section">
              <h3 className="portal-header__notification-section-title">{section.title}</h3>
              {section.items.map((item) => (
                <article key={item.id} className={cn("portal-header__notification-item", item.isRead === false && "is-unread")}>
                  <div className="portal-header__notification-copy">
                    <strong>{item.title}</strong>
                    <span>{item.description}</span>
                  </div>
                  <div className="portal-header__notification-actions">
                    <Button href={item.href} variant="secondary" size="sm">{item.openLabel}</Button>
                    {item.primaryAction ? (
                      <Button size="sm" loading={busyKey === item.primaryAction.key} onClick={item.primaryAction.onClick}>{item.primaryAction.label}</Button>
                    ) : null}
                    {item.secondaryAction ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        loading={busyKey === item.secondaryAction.key}
                        onClick={item.secondaryAction.onClick}
                      >
                        {item.secondaryAction.label}
                      </Button>
                    ) : null}
                  </div>
                </article>
              ))}
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PortalHeader({
  navItems,
  currentKey,
  brandHref = routes.home,
  brandLabel = "Трамплин",
  actionHref,
  actionLabel,
  actionVariant = "primary",
  iconButtons = DEFAULT_ICON_BUTTONS,
  className,
  shellClassName,
  floating = false,
  visible = true,
  variant = "default",
}) {
  const mobileMenuRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const authSession = useAuthSession();
  const authUser = authSession.status === "authenticated" ? authSession.user : null;
  const isPublicProfileVariant = variant === "public-profile";
  const showActionButton = Boolean(actionHref && actionLabel && (!authUser || actionHref !== routes.auth.login));
  const showAccountMenu = Boolean(authUser) && !isPublicProfileVariant;
  const isLoginAction = actionHref === routes.auth.login;

  useEffect(() => {
    if (!mobileMenuOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!mobileMenuRef.current?.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <div className={cn("portal-header-shell", floating && "is-floating", visible ? "is-visible" : "is-hidden", shellClassName)}>
      <header className={cn("portal-header", isPublicProfileVariant && "portal-header--public-profile", className)}>
        <AppLink href={brandHref} className="portal-header__brand" aria-label="Трамплин">
          <span className="portal-header__brand-mark" aria-hidden="true" />
          <span className="portal-header__brand-text">{brandLabel}</span>
        </AppLink>

        <nav className="portal-header__nav" aria-label="Основная навигация">
          {navItems.map((item) => (
            <AppLink
              key={item.key ?? item.label}
              href={item.href}
              className={cn("portal-header__nav-link", item.key === currentKey && "is-active")}
              aria-current={item.key === currentKey ? "page" : undefined}
            >
              {item.label}
            </AppLink>
          ))}
        </nav>

        <div className="portal-header__actions">
          <div ref={mobileMenuRef} className="portal-header__mobile-menu-shell">
            <button
              type="button"
              className={cn("portal-header__mobile-menu-button", mobileMenuOpen && "is-open")}
              aria-label="Открыть меню навигации"
              aria-expanded={mobileMenuOpen}
              aria-haspopup="menu"
              onClick={() => setMobileMenuOpen((current) => !current)}
            >
              <MenuIcon />
            </button>

            {mobileMenuOpen ? (
              <nav className="portal-header__mobile-menu" aria-label="Мобильная навигация">
                {navItems.map((item) => (
                  <AppLink
                    key={`mobile-${item.key ?? item.label}`}
                    href={item.href}
                    className={cn("portal-header__mobile-menu-link", item.key === currentKey && "is-active")}
                    aria-current={item.key === currentKey ? "page" : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </AppLink>
                ))}
              </nav>
            ) : null}
          </div>

          {iconButtons.map((item) => {
            if (item.key === "messages" && authUser) {
              return (
                <ChatDrawerTrigger key={item.key} className="portal-header__notification-button">
                  <MessageIcon />
                </ChatDrawerTrigger>
              );
            }

            if (item.key === "notifications" && authUser) {
              return <PortalHeaderNotifications key={item.key} authUser={authUser} />;
            }

            return (
              <IconButton key={item.key ?? item.label} label={item.label} href={item.href} size="lg" className="portal-header__icon-button">
                {item.icon}
              </IconButton>
            );
          })}

          {showActionButton ? (
            isLoginAction ? (
              <AppLink href={actionHref} className="portal-header__icon-button portal-header__auth" aria-label={actionLabel}>
                {actionLabel}
                <GuestProfileIcon />
                <span className="ui-visually-hidden">{actionLabel}</span>
              </AppLink>
            ) : (
              <Button as="a" href={actionHref} variant={actionVariant} className="portal-header__action">
                {actionLabel}
              </Button>
            )
          ) : null}

          {showAccountMenu ? (
            <AuthAccountMenu
              user={authUser}
              className="portal-header__account-menu"
              triggerClassName="portal-header__account-trigger"
              panelClassName="portal-header__account-panel"
              showText={false}
              avatarSize="sm"
              cabinetLabel="Мой кабинет"
              logoutLabel="Выйти"
            />
          ) : null}
        </div>
      </header>
    </div>
  );
}
