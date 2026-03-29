import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { buildOpportunityDetailRoute } from "../app/routes";
import {
  acceptCandidateFriendRequest,
  acceptCandidateProjectInvite,
  cancelCandidateFriendRequest,
  cancelCandidateProjectInvite,
  createCandidateContact,
  createCandidateFriendRequest,
  declineCandidateFriendRequest,
  declineCandidateProjectInvite,
  deleteCandidateContact,
  deleteCandidateFriend,
  getCandidateApplications,
  getCandidateContactSuggestions,
  getCandidateContacts,
  getCandidateDirectory,
  getCandidateFriendRequests,
  getCandidateFriends,
  getCandidateOpportunityShares,
  getCandidateProfile,
  getCandidateProjectInvites,
} from "../api/candidate";
import { getOpportunity } from "../api/opportunities";
import { useAuthSession } from "../auth/api";
import {
  getIncomingFriendRequests,
  getIncomingProjectInvites,
  getProjectInviteDirection,
  getRelationshipActionState,
  getRelationshipPrimaryAction,
  getRelationshipSecondaryAction,
  mapSocialUserToCard,
  normalizeRelationship,
} from "./social";
import { formatLongDate } from "./mappers";
import { Alert, Avatar, Button, Card, EmptyState, Loader, OpportunityMiniCard, SearchInput, SegmentedControl, Select, Tabs, Tag } from "../shared/ui";
import { CandidateSectionHeader } from "./shared";

function normalizeTab(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return ["actual", "network", "search"].includes(normalized) ? normalized : "actual";
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSearchValue(value) {
  return normalizeText(value).toLowerCase();
}

function truncateText(value, maxLength = 160) {
  const normalized = normalizeText(value).replace(/\s+/g, " ");

  if (!normalized || normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function extractUserCity(user) {
  const links = user?.links && typeof user.links === "object" ? user.links : {};
  const onboarding = links?.onboarding && typeof links.onboarding === "object" ? links.onboarding : {};

  return [
    user?.city,
    user?.locationCity,
    user?.location,
    user?.address?.city,
    user?.profile?.city,
    onboarding?.city,
  ].map(normalizeText).find(Boolean) ?? "";
}

function getInitials(name) {
  return String(name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "К";
}

function collectApplicationTags(applications) {
  return Array.from(
    new Set(
      (Array.isArray(applications) ? applications : [])
        .flatMap((item) => (Array.isArray(item?.opportunityTags) ? item.opportunityTags : []))
        .map((item) => normalizeText(item))
        .filter(Boolean)
    )
  );
}

function extractProfileSkills(profile) {
  return Array.isArray(profile?.skills) ? profile.skills.map((item) => normalizeText(item)).filter(Boolean) : [];
}

function buildSearchReasons(user, profileSkills, profileCity, opportunityTags) {
  const reasons = [];
  const userSkills = Array.isArray(user?.skills) ? user.skills.map((item) => normalizeText(item)).filter(Boolean) : [];
  const sharedSkills = userSkills.filter((skill) => profileSkills.some((entry) => entry.localeCompare(skill, "ru", { sensitivity: "accent" }) === 0)).slice(0, 3);
  const overlappingOpportunityTags = userSkills.filter((skill) => opportunityTags.some((entry) => entry.localeCompare(skill, "ru", { sensitivity: "accent" }) === 0)).slice(0, 3);
  const userCity = extractUserCity(user);

  if (sharedSkills.length) {
    reasons.push(`Общие навыки: ${sharedSkills.join(", ")}`);
  }

  if (profileCity && userCity && profileCity.localeCompare(userCity, "ru", { sensitivity: "accent" }) === 0) {
    reasons.push("Тот же город");
  }

  if (overlappingOpportunityTags.length) {
    reasons.push("Релевантно к вашим откликам");
  }

  return reasons;
}

function formatCardMeta(entry) {
  return [
    entry.city ? `Город: ${entry.city}` : "",
    entry.email ? `Email: ${entry.email}` : "",
  ].filter(Boolean).join(" · ");
}

function getRequestDirection(request, currentUserId) {
  return Number(request?.senderUserId) === Number(currentUserId) ? "outgoing" : "incoming";
}

function SocialHubCard({
  title,
  subtitle,
  meta,
  tags = [],
  reasons = [],
  badge,
  href,
  primaryAction = null,
  secondaryAction = null,
  tertiaryAction = null,
  className = "",
}) {
  return (
    <Card className={`candidate-social-card ${className}`.trim()}>
      <div className="candidate-social-card__head">
        <div className="candidate-social-card__identity">
          <Avatar initials={getInitials(title)} shape="rounded" className="candidate-social-card__avatar" />
          <div className="candidate-social-card__copy">
            <strong>{title}</strong>
            {subtitle ? <span>{subtitle}</span> : null}
          </div>
        </div>
        {badge ? <Tag tone={badge.tone}>{badge.label}</Tag> : null}
      </div>

      {meta ? <p className="candidate-social-card__meta">{meta}</p> : null}

      {reasons.length ? (
        <div className="candidate-social-card__reasons">
          {reasons.map((reason) => (
            <Tag key={reason} tone="neutral">
              {reason}
            </Tag>
          ))}
        </div>
      ) : null}

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
        {primaryAction ? (
          <Button
            type="button"
            variant={primaryAction.variant ?? "primary"}
            className="candidate-social-card__action"
            loading={primaryAction.loading}
            disabled={primaryAction.disabled}
            onClick={primaryAction.onClick}
          >
            {primaryAction.label}
          </Button>
        ) : null}
        {secondaryAction ? (
          <Button
            type="button"
            variant={secondaryAction.variant ?? "secondary"}
            className="candidate-social-card__action"
            loading={secondaryAction.loading}
            disabled={secondaryAction.disabled}
            onClick={secondaryAction.onClick}
          >
            {secondaryAction.label}
          </Button>
        ) : null}
        {tertiaryAction ? (
          <Button
            type="button"
            variant={tertiaryAction.variant ?? "ghost"}
            className="candidate-social-card__action"
            loading={tertiaryAction.loading}
            disabled={tertiaryAction.disabled}
            onClick={tertiaryAction.onClick}
          >
            {tertiaryAction.label}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

function mapDescriptorToAction(descriptor, card, busyKey, runCardAction) {
  if (!descriptor || !card?.userId) {
    return null;
  }

  const actionKey = `${descriptor.key}-${card.userId}`;
  const isBusy = busyKey === actionKey;

  switch (descriptor.key) {
    case "save-contact":
      return {
        ...descriptor,
        loading: isBusy,
        onClick: () => runCardAction(actionKey, () => createCandidateContact({ userId: card.userId })),
      };
    case "send-friend-request":
      return {
        ...descriptor,
        loading: isBusy,
        onClick: () => runCardAction(actionKey, () => createCandidateFriendRequest({ userId: card.userId })),
      };
    case "accept-friend-request":
      return card.relationship?.friendRequestId ? {
        ...descriptor,
        loading: isBusy,
        onClick: () => runCardAction(actionKey, () => acceptCandidateFriendRequest(card.relationship.friendRequestId)),
      } : null;
    case "decline-friend-request":
      return card.relationship?.friendRequestId ? {
        ...descriptor,
        loading: isBusy,
        onClick: () => runCardAction(actionKey, () => declineCandidateFriendRequest(card.relationship.friendRequestId)),
      } : null;
    case "cancel-friend-request":
      return card.relationship?.friendRequestId ? {
        ...descriptor,
        loading: isBusy,
        onClick: () => runCardAction(actionKey, () => cancelCandidateFriendRequest(card.relationship.friendRequestId)),
      } : null;
    case "accept-project-invite":
      return card.relationship?.projectInviteId ? {
        ...descriptor,
        loading: isBusy,
        onClick: () => runCardAction(actionKey, () => acceptCandidateProjectInvite(card.relationship.projectInviteId)),
      } : null;
    case "decline-project-invite":
      return card.relationship?.projectInviteId ? {
        ...descriptor,
        loading: isBusy,
        onClick: () => runCardAction(actionKey, () => declineCandidateProjectInvite(card.relationship.projectInviteId)),
      } : null;
    case "cancel-project-invite":
      return card.relationship?.projectInviteId ? {
        ...descriptor,
        loading: isBusy,
        onClick: () => runCardAction(actionKey, () => cancelCandidateProjectInvite(card.relationship.projectInviteId)),
      } : null;
    case "friend-request-sent":
    case "project-invite-sent":
      return {
        ...descriptor,
        disabled: true,
      };
    default:
      return null;
  }
}

function buildRelationshipActions(card, busyKey, runCardAction) {
  const state = card.relationshipState ?? getRelationshipActionState(card.relationship);
  const primaryDescriptor = getRelationshipPrimaryAction(state);
  const secondaryDescriptor = getRelationshipSecondaryAction(state);

  return {
    primaryAction: mapDescriptorToAction(primaryDescriptor, card, busyKey, runCardAction),
    secondaryAction: mapDescriptorToAction(secondaryDescriptor, card, busyKey, runCardAction),
  };
}

function createSearchEntry(user, profileSkills, profileCity, opportunityTags) {
  const card = mapSocialUserToCard(user);
  const reasons = card.reasons.length ? card.reasons : buildSearchReasons(user, profileSkills, profileCity, opportunityTags);

  return {
    ...card,
    city: extractUserCity(user),
    reasons,
  };
}

function buildOpportunityShareCardItem(share, opportunity) {
  if (opportunity && typeof opportunity === "object") {
    return {
      ...opportunity,
      id: opportunity.id ?? share.opportunityId,
      detailHref: buildOpportunityDetailRoute(share.opportunityId),
      detailLabel: "К возможности",
    };
  }

  const sharedAt = share?.createdAt ? formatLongDate(share.createdAt) : "";
  const note = truncateText(share?.note, 96);
  const senderName = normalizeText(share?.counterparty?.name);

  return {
    id: share?.opportunityId ?? share?.id,
    title: normalizeText(share?.opportunityTitle) || "Возможность из вашей сети",
    meta: senderName ? `Советует ${senderName}` : "Возможность из вашей сети",
    primaryFactLabel: note ? "Комментарий" : sharedAt ? "Получено" : "",
    primaryFactValue: note || sharedAt,
    secondaryFact: note && sharedAt ? `Получено ${sharedAt}` : "",
    compactFact: note || (sharedAt ? `Получено ${sharedAt}` : "Из вашей сети"),
    chips: Array.isArray(share?.counterparty?.skills)
      ? share.counterparty.skills.map((item) => normalizeText(item)).filter(Boolean).slice(0, 3)
      : [],
    detailHref: buildOpportunityDetailRoute(share?.opportunityId),
    detailLabel: "К возможности",
  };
}

const EMPTY_SOCIAL_HUB_STATE = {
  contacts: [],
  directory: [],
  friends: [],
  friendRequests: [],
  projectInvites: [],
  opportunityShares: [],
  opportunityShareDetails: {},
  suggestions: [],
  profile: null,
  applications: [],
  degraded: false,
  degradedMessage: "",
};

async function loadOpportunityShareDetails(shares, signal) {
  const opportunityIds = Array.from(
    new Set(
      (Array.isArray(shares) ? shares : [])
        .map((item) => Number(item?.opportunityId))
        .filter((item) => Number.isFinite(item) && item > 0)
    )
  );

  if (!opportunityIds.length) {
    return {
      details: {},
      degraded: false,
    };
  }

  const results = await Promise.allSettled(opportunityIds.map((opportunityId) => getOpportunity(opportunityId, signal)));
  const details = {};

  results.forEach((result, index) => {
    if (result.status === "fulfilled" && result.value && typeof result.value === "object") {
      details[opportunityIds[index]] = result.value;
    }
  });

  return {
    details,
    degraded: results.some((result) => result.status === "rejected"),
  };
}

async function loadSocialHubCollections(signal, currentUserId) {
  const coreResults = await Promise.allSettled([
    getCandidateContacts(signal),
    getCandidateDirectory(signal),
    getCandidateProfile(signal),
    getCandidateApplications(signal),
  ]);
  const [contactsResult, directoryResult, profileResult, applicationsResult] = coreResults;
  const coreError = coreResults.find((result) => result.status === "rejected");

  if (coreError?.status === "rejected") {
    throw coreError.reason;
  }

  const optionalResults = await Promise.allSettled([
    getCandidateFriends(signal),
    getCandidateFriendRequests(signal),
    getCandidateProjectInvites(signal),
    getCandidateOpportunityShares("all", signal),
    getCandidateContactSuggestions({ source: "contacts", limit: 8 }, signal),
  ]);
  const [
    friendsResult,
    friendRequestsResult,
    projectInvitesResult,
    opportunitySharesResult,
    suggestionsResult,
  ] = optionalResults;
  const opportunityShares = opportunitySharesResult.status === "fulfilled" && Array.isArray(opportunitySharesResult.value)
    ? opportunitySharesResult.value
    : [];
  const incomingShares = currentUserId == null
    ? opportunityShares
    : opportunityShares.filter((item) => Number(item?.recipientUserId) === Number(currentUserId));
  const opportunityShareDetailsResult = await loadOpportunityShareDetails(incomingShares, signal);
  const degraded = optionalResults.some((result) => result.status === "rejected") || opportunityShareDetailsResult.degraded;

  return {
    contacts: contactsResult.status === "fulfilled" && Array.isArray(contactsResult.value) ? contactsResult.value : [],
    directory: directoryResult.status === "fulfilled" && Array.isArray(directoryResult.value) ? directoryResult.value : [],
    friends: friendsResult.status === "fulfilled" && Array.isArray(friendsResult.value) ? friendsResult.value : [],
    friendRequests: friendRequestsResult.status === "fulfilled" && Array.isArray(friendRequestsResult.value) ? friendRequestsResult.value : [],
    projectInvites: projectInvitesResult.status === "fulfilled" && Array.isArray(projectInvitesResult.value) ? projectInvitesResult.value : [],
    opportunityShares,
    opportunityShareDetails: opportunityShareDetailsResult.details,
    suggestions: suggestionsResult.status === "fulfilled" && Array.isArray(suggestionsResult.value) ? suggestionsResult.value : [],
    profile: profileResult.status === "fulfilled" && profileResult.value && typeof profileResult.value === "object" ? profileResult.value : null,
    applications: applicationsResult.status === "fulfilled" && Array.isArray(applicationsResult.value) ? applicationsResult.value : [],
    degraded,
    degradedMessage: degraded
      ? "Часть social-возможностей пока недоступна. Мы показываем только те данные, которые удалось загрузить."
      : "",
  };
}

export function CandidateContactsApp() {
  const authSession = useAuthSession();
  const authUser = authSession.status === "authenticated" ? authSession.user : null;
  const [searchParams, setSearchParams] = useSearchParams();
  const [networkFilter, setNetworkFilter] = useState("contacts");
  const [searchDraftQuery, setSearchDraftQuery] = useState("");
  const [searchAppliedQuery, setSearchAppliedQuery] = useState("");
  const [searchCity, setSearchCity] = useState("all");
  const [searchSkill, setSearchSkill] = useState("all");
  const [searchQuickFilter, setSearchQuickFilter] = useState("all");
  const [busyKey, setBusyKey] = useState("");
  const [state, setState] = useState({
    status: "loading",
    ...EMPTY_SOCIAL_HUB_STATE,
    error: null,
  });

  const currentTab = normalizeTab(searchParams.get("tab"));

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const nextState = await loadSocialHubCollections(controller.signal, authUser?.id);
        setState({
          status: "ready",
          ...nextState,
          error: null,
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            status: "error",
            ...EMPTY_SOCIAL_HUB_STATE,
            error,
          });
        }
      }
    }

    load();
    return () => controller.abort();
  }, [authUser?.id]);

  async function reload() {
    setState((current) => ({ ...current, status: "loading" }));

    try {
      const nextState = await loadSocialHubCollections(undefined, authUser?.id);
      setState({
        status: "ready",
        ...nextState,
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

  async function runCardAction(actionKey, callback) {
    try {
      setBusyKey(actionKey);
      await callback();
      await reload();
    } finally {
      setBusyKey("");
    }
  }

  function changeTab(nextTab) {
    setSearchParams((current) => {
      const nextParams = new URLSearchParams(current);
      nextParams.set("tab", nextTab);
      return nextParams;
    }, { replace: true });
  }

  function applySearch() {
    setSearchAppliedQuery(searchDraftQuery.trim());
  }

  const profileSkills = useMemo(() => extractProfileSkills(state.profile), [state.profile]);
  const profileCity = useMemo(() => extractUserCity(state.profile), [state.profile]);
  const applicationTags = useMemo(() => collectApplicationTags(state.applications), [state.applications]);
  const contactCards = useMemo(
    () => state.contacts
      .filter((item) => normalizeRelationship(item.relationship).friendState !== "friends")
      .map(mapSocialUserToCard),
    [state.contacts]
  );
  const friendCards = useMemo(() => state.friends.map(mapSocialUserToCard), [state.friends]);
  const suggestionCards = useMemo(() => state.suggestions.map(mapSocialUserToCard), [state.suggestions]);
  const directoryCards = useMemo(
    () => state.directory.map((user) => createSearchEntry(user, profileSkills, profileCity, applicationTags)),
    [applicationTags, profileCity, profileSkills, state.directory]
  );
  const friendRequests = useMemo(
    () => Array.isArray(state.friendRequests) ? state.friendRequests : [],
    [state.friendRequests]
  );
  const incomingRequests = useMemo(
    () => getIncomingFriendRequests(friendRequests, authUser?.id),
    [authUser?.id, friendRequests]
  );
  const incomingInviteCards = useMemo(
    () => getIncomingProjectInvites(state.projectInvites, authUser?.id).map((invite) => ({
      invite,
      card: mapSocialUserToCard(invite.counterparty),
    })),
    [authUser?.id, state.projectInvites]
  );
  const incomingShares = useMemo(
    () => (Array.isArray(state.opportunityShares) ? state.opportunityShares : []).filter((item) => Number(item.recipientUserId) === Number(authUser?.id)),
    [authUser?.id, state.opportunityShares]
  );
  const incomingShareEntries = useMemo(
    () => incomingShares.map((share) => ({
      share,
      sender: mapSocialUserToCard(share.counterparty),
      opportunityItem: buildOpportunityShareCardItem(share, state.opportunityShareDetails?.[share.opportunityId] ?? null),
    })),
    [incomingShares, state.opportunityShareDetails]
  );
  const incomingActionCount = incomingRequests.length + incomingInviteCards.length;
  const actualTabBadgeCount = incomingActionCount + incomingShareEntries.length;
  const networkItems = useMemo(() => {
    switch (networkFilter) {
      case "friends":
        return friendCards;
      case "requests":
        return friendRequests
          .filter((request) => normalizeText(request?.status).toLowerCase() === "pending")
          .map((request) => {
            const card = mapSocialUserToCard(request.counterparty);
            const direction = getRequestDirection(request, authUser?.id);
            const relationship = normalizeRelationship(card.relationship);

            return {
              ...card,
              relationship: {
                ...relationship,
                friendState: direction === "incoming" ? "incoming" : "outgoing",
                friendRequestId: request.id,
              },
              relationshipState: direction === "incoming" ? "friend_request_incoming" : "friend_request_outgoing",
              meta: request.createdAt ? `Заявка ${direction === "incoming" ? "получена" : "отправлена"} ${formatLongDate(request.createdAt)}` : "Заявка в друзья",
            };
          });
      case "invites":
        return state.projectInvites.map((invite) => {
          const card = mapSocialUserToCard(invite.counterparty);
          const direction = getProjectInviteDirection(invite, authUser?.id);
          const relationship = normalizeRelationship(card.relationship);

          return {
            ...card,
            relationship: {
              ...relationship,
              projectInviteState: direction === "incoming" ? "incoming" : "outgoing",
              projectInviteId: invite.id,
            },
            relationshipState: direction === "incoming" ? "project_invite_incoming" : "project_invite_outgoing",
            meta: [invite.projectTitle ? `Проект: ${invite.projectTitle}` : "", invite.role ? `Роль: ${invite.role}` : ""].filter(Boolean).join(" · "),
          };
        });
      case "contacts":
      default:
        return contactCards;
    }
  }, [authUser?.id, contactCards, friendCards, friendRequests, networkFilter, state.projectInvites]);

  const searchSkillOptions = useMemo(() => {
    const skills = Array.from(new Set(directoryCards.flatMap((entry) => entry.skills))).sort((left, right) => left.localeCompare(right, "ru"));
    return [{ value: "all", label: "Все навыки" }, ...skills.map((skill) => ({ value: skill, label: skill }))];
  }, [directoryCards]);

  const searchCityOptions = useMemo(() => {
    const cities = Array.from(new Set(directoryCards.map((entry) => entry.city).filter(Boolean))).sort((left, right) => left.localeCompare(right, "ru"));
    return [{ value: "all", label: "Все города" }, ...cities.map((city) => ({ value: city, label: city }))];
  }, [directoryCards]);

  const filteredDirectoryCards = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(searchAppliedQuery);

    return directoryCards.filter((entry) => {
      const matchesCity = searchCity === "all" || entry.city === searchCity;
      const matchesSkill = searchSkill === "all" || entry.skills.includes(searchSkill);
      const haystack = normalizeSearchValue([entry.name, entry.email, entry.city, entry.skills.join(" "), entry.reasons.join(" ")].join(" "));
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      const matchesQuickFilter = (() => {
        switch (searchQuickFilter) {
          case "applications":
            return entry.reasons.some((reason) => reason.toLowerCase().includes("отклик"));
          case "skills":
            return entry.reasons.some((reason) => reason.toLowerCase().includes("навык"));
          case "city":
            return entry.reasons.includes("Тот же город");
          case "new":
            return entry.relationshipState === "none";
          default:
            return true;
        }
      })();

      return matchesCity && matchesSkill && matchesQuery && matchesQuickFilter;
    });
  }, [directoryCards, searchAppliedQuery, searchCity, searchQuickFilter, searchSkill]);

  const actualContent = (
    <div className="candidate-page-stack">
      <section className="candidate-page-stack">
        <div className="candidate-social-section-head">
          <strong>Актуальные входящие</strong>
          <Tag tone="accent">{incomingActionCount}</Tag>
        </div>

        {incomingActionCount ? (
          <div className="candidate-page-grid candidate-page-grid--two">
            {incomingRequests.map((request) => {
              const card = mapSocialUserToCard(request.counterparty);
              const relationship = normalizeRelationship(card.relationship);
              const enrichedCard = {
                ...card,
                relationship: {
                  ...relationship,
                  friendState: "incoming",
                  friendRequestId: request.id,
                },
                relationshipState: "friend_request_incoming",
              };
              const { primaryAction, secondaryAction } = buildRelationshipActions(enrichedCard, busyKey, runCardAction);

              return (
                <SocialHubCard
                  key={`friend-request-${request.id}`}
                  title={card.name}
                  subtitle={card.email || "Входящая заявка в друзья"}
                  meta={request.createdAt ? `Получена ${formatLongDate(request.createdAt)}` : "Пользователь хочет добавить вас в друзья."}
                  tags={card.skills}
                  reasons={card.reasons}
                  badge={{ label: "Заявка", tone: "soft" }}
                  href={card.href}
                  primaryAction={primaryAction}
                  secondaryAction={secondaryAction}
                />
              );
            })}

            {incomingInviteCards.map(({ invite, card }) => {
              const relationship = normalizeRelationship(card.relationship);
              const enrichedCard = {
                ...card,
                relationship: {
                  ...relationship,
                  projectInviteState: "incoming",
                  projectInviteId: invite.id,
                },
                relationshipState: "project_invite_incoming",
              };
              const { primaryAction, secondaryAction } = buildRelationshipActions(enrichedCard, busyKey, runCardAction);

              return (
                <SocialHubCard
                  key={`project-invite-${invite.id}`}
                  title={card.name}
                  subtitle={card.email || "Входящий инвайт в проект"}
                  meta={[invite.projectTitle ? `Проект: ${invite.projectTitle}` : "", invite.role ? `Роль: ${invite.role}` : ""].filter(Boolean).join(" · ")}
                  tags={card.skills}
                  reasons={card.reasons}
                  badge={{ label: "Инвайт", tone: "warning" }}
                  href={card.href}
                  primaryAction={primaryAction}
                  secondaryAction={secondaryAction}
                />
              );
            })}

            {false && incomingShares.map((share) => {
              const card = mapSocialUserToCard(share.counterparty);

              return (
                <SocialHubCard
                  key={`share-${share.id}`}
                  title={card.name}
                  subtitle={share.opportunityTitle || "Поделился возможностью"}
                  meta={share.note || (share.createdAt ? `Отправлено ${formatLongDate(share.createdAt)}` : "Возможность из вашей сети")}
                  tags={card.skills}
                  reasons={card.reasons}
                  badge={{ label: "Возможность", tone: "accent" }}
                  href={card.href}
                  primaryAction={{
                    label: "К возможности",
                    variant: "secondary",
                    loading: false,
                    disabled: false,
                    onClick: () => {
                      window.location.href = buildOpportunityDetailRoute(share.opportunityId);
                    },
                  }}
                />
              );
            })}
          </div>
        ) : (
          <Card>
            <EmptyState
              eyebrow="Тихо"
              title="Новых входящих действий пока нет"
              description="Здесь будут появляться входящие заявки в друзья, инвайты в проекты и возможности от вашей сети."
              tone="neutral"
            />
          </Card>
        )}
      </section>

      <section className="candidate-page-stack">
        <div className="candidate-social-section-head">
          <strong>Возможности, которые вам посоветовали</strong>
          <Tag tone="accent">{incomingShareEntries.length}</Tag>
        </div>

        {incomingShareEntries.length ? (
          <div className="candidate-social-opportunity-grid">
            {incomingShareEntries.map(({ share, sender, opportunityItem }) => (
              <div key={`share-opportunity-${share.id}`} className="candidate-social-share-entry">
                <div className="candidate-social-share-entry__head">
                  <div className="candidate-social-share-entry__identity">
                    <Avatar initials={getInitials(sender.name)} shape="rounded" className="candidate-social-share-entry__avatar" />
                    <div className="candidate-social-share-entry__copy">
                      <strong>{sender.name}</strong>
                      <span>{share.createdAt ? `Посоветовал ${formatLongDate(share.createdAt)}` : "Посоветовал вам возможность"}</span>
                    </div>
                  </div>
                  <Tag tone="accent">Совет</Tag>
                </div>

                {share.note ? (
                  <p className="candidate-social-share-entry__note">{truncateText(share.note)}</p>
                ) : null}

                <OpportunityMiniCard
                  item={opportunityItem}
                  variant="compact"
                  className="candidate-social-share-entry__card"
                  detailAction={{
                    href: buildOpportunityDetailRoute(share.opportunityId),
                    label: "К возможности",
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              eyebrow="Пока пусто"
              title="Контакты пока не советовали вам возможности"
              description="Когда кто-то из вашей сети поделится вакансией, стажировкой или мероприятием, карточка появится здесь."
              tone="neutral"
            />
          </Card>
        )}
      </section>

      <section className="candidate-page-stack">
        <div className="candidate-social-section-head">
          <strong>Люди для вас</strong>
          <Tag tone="accent">{suggestionCards.length}</Tag>
        </div>

        {suggestionCards.length ? (
          <div className="candidate-page-grid candidate-page-grid--two">
            {suggestionCards.map((card) => {
              const { primaryAction, secondaryAction } = buildRelationshipActions(card, busyKey, runCardAction);

              return (
                <SocialHubCard
                  key={`suggestion-${card.id}`}
                  title={card.name}
                  subtitle={card.email || "Подходящий кандидат"}
                  meta={formatCardMeta(card)}
                  tags={card.skills}
                  reasons={card.reasons}
                  badge={card.badge}
                  href={card.href}
                  primaryAction={primaryAction}
                  secondaryAction={secondaryAction}
                />
              );
            })}
          </div>
        ) : (
          <Card>
            <EmptyState
              eyebrow="Пока пусто"
              title="Новых suggestions пока нет"
              description="Когда появятся релевантные люди по навыкам, городу и вашим откликам, они появятся здесь."
              tone="neutral"
            />
          </Card>
        )}
      </section>
    </div>
  );

  const networkContent = (
    <div className="candidate-page-stack">
      <div className="candidate-social-filter-row">
        <SegmentedControl
          value={networkFilter}
          onChange={setNetworkFilter}
          ariaLabel="Фильтр по моей сети"
          items={[
            { value: "contacts", label: "Контакты" },
            { value: "friends", label: "Друзья" },
            { value: "requests", label: "Заявки" },
            { value: "invites", label: "Инвайты" },
          ]}
        />
      </div>

      {networkItems.length ? (
        <div className="candidate-page-grid candidate-page-grid--two">
          {networkItems.map((card) => {
            const { primaryAction, secondaryAction } = buildRelationshipActions(card, busyKey, runCardAction);
            const tertiaryAction = networkFilter === "contacts" && card.userId ? {
              label: "Удалить из контактов",
              variant: "ghost",
              loading: busyKey === `delete-contact-${card.userId}`,
              disabled: false,
              onClick: () => runCardAction(`delete-contact-${card.userId}`, () => deleteCandidateContact(card.userId)),
            } : networkFilter === "friends" && card.userId ? {
              label: "Удалить из друзей",
              variant: "ghost",
              loading: busyKey === `delete-friend-${card.userId}`,
              disabled: false,
              onClick: () => runCardAction(`delete-friend-${card.userId}`, () => deleteCandidateFriend(card.userId)),
            } : null;

            return (
              <SocialHubCard
                key={`network-${networkFilter}-${card.id}`}
                title={card.name}
                subtitle={card.email || "Профиль кандидата"}
                meta={card.meta || formatCardMeta(card)}
                tags={card.skills}
                reasons={card.reasons}
                badge={card.badge}
                href={card.href}
                primaryAction={primaryAction}
                secondaryAction={secondaryAction}
                tertiaryAction={tertiaryAction}
              />
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            eyebrow="Пока пусто"
            title={
              networkFilter === "friends"
                ? "Друзей пока нет"
                : networkFilter === "requests"
                  ? "Заявок пока нет"
                  : networkFilter === "invites"
                    ? "Инвайтов пока нет"
                    : "Контактов пока нет"
            }
            description="Когда связи появятся, вы сможете управлять ими из этого раздела."
            tone="neutral"
          />
        </Card>
      )}
    </div>
  );

  const searchContent = (
    <div className="candidate-page-stack">
      <Card className="candidate-social-search">
        <div className="candidate-social-search__head">
          <div className="candidate-social-search__copy">
            <strong>Поиск по кандидатам</strong>
            <p>Ищите людей по навыкам, городу и связи с вашими текущими откликами.</p>
          </div>
          <Tag tone="accent">{filteredDirectoryCards.length} найдено</Tag>
        </div>

        <form
          className="candidate-social-search__form"
          onSubmit={(event) => {
            event.preventDefault();
            applySearch();
          }}
        >
          <div className="candidate-social-search__query-row">
            <SearchInput
              value={searchDraftQuery}
              onValueChange={setSearchDraftQuery}
              placeholder="Поиск по имени, email или навыкам"
              clearLabel="Очистить поиск"
              aria-label="Поиск кандидатов"
              className="candidate-social-search__field candidate-social-search__field--search"
            />
            <Button type="submit" className="candidate-social-search__submit">
              Найти
            </Button>
          </div>

          <div className="candidate-social-search__filters">
            <Select value={searchCity} onValueChange={setSearchCity} options={searchCityOptions} aria-label="Фильтр по городам" className="candidate-social-search__field" />
            <Select value={searchSkill} onValueChange={setSearchSkill} options={searchSkillOptions} aria-label="Фильтр по навыкам" className="candidate-social-search__field" />
          </div>

          <SegmentedControl
            value={searchQuickFilter}
            onChange={setSearchQuickFilter}
            ariaLabel="Быстрые фильтры поиска"
            items={[
              { value: "all", label: "Все" },
              { value: "applications", label: "По моим откликам" },
              { value: "skills", label: "По моим навыкам" },
              { value: "city", label: "Из моего города" },
              { value: "new", label: "Новые" },
            ]}
          />
        </form>
      </Card>

      {searchAppliedQuery === "" && searchQuickFilter === "all" && suggestionCards.length ? (
        <section className="candidate-page-stack">
          <div className="candidate-social-section-head">
            <strong>Люди для вас</strong>
            <Tag tone="accent">{suggestionCards.length}</Tag>
          </div>

          <div className="candidate-page-grid candidate-page-grid--two">
            {suggestionCards.slice(0, 4).map((card) => {
              const { primaryAction, secondaryAction } = buildRelationshipActions(card, busyKey, runCardAction);

              return (
                <SocialHubCard
                  key={`search-suggestion-${card.id}`}
                  title={card.name}
                  subtitle={card.email || "Рекомендация"}
                  meta={formatCardMeta(card)}
                  tags={card.skills}
                  reasons={card.reasons}
                  badge={card.badge}
                  href={card.href}
                  primaryAction={primaryAction}
                  secondaryAction={secondaryAction}
                  className="candidate-social-card--compact"
                />
              );
            })}
          </div>
        </section>
      ) : null}

      {filteredDirectoryCards.length ? (
        <div className="candidate-page-grid candidate-social-search-results">
          {filteredDirectoryCards.map((card) => {
            const { primaryAction, secondaryAction } = buildRelationshipActions(card, busyKey, runCardAction);

            return (
              <SocialHubCard
                key={`search-${card.id}`}
                title={card.name}
                subtitle={card.email || "Публичный профиль"}
                meta={formatCardMeta(card)}
                tags={card.skills}
                reasons={card.reasons}
                badge={card.badge}
                href={card.href}
                primaryAction={primaryAction}
                secondaryAction={secondaryAction}
                className="candidate-social-card--compact"
              />
            );
          })}
        </div>
      ) : (
        <Card>
          <EmptyState
            eyebrow="Ничего не найдено"
            title="Попробуйте изменить запрос или фильтры"
            description="Поиск учитывает ваши навыки, город и пересечение с активными откликами."
            tone="neutral"
          />
        </Card>
      )}
    </div>
  );

  const tabs = [
    {
      value: "actual",
      label: "Актуальные",
      badge: actualTabBadgeCount,
      content: actualContent,
    },
    {
      value: "network",
      label: "Моя сеть",
      badge: contactCards.length + friendCards.length,
      content: networkContent,
    },
    {
      value: "search",
      label: "Поиск",
      badge: filteredDirectoryCards.length,
      content: searchContent,
    },
  ];

  return (
    <section className="candidate-page-section candidate-social-hub" data-testid="candidate-contacts-app">
      <CandidateSectionHeader
        title="Контакты и связи"
        description="Управляйте входящими действиями, своей сетью и поиском людей вокруг ваших откликов из одного места."
      />

      {state.status === "loading" ? <Loader label="Загружаем social hub" surface /> : null}

      {state.status === "error" ? (
        <Alert tone="error" title="Не удалось загрузить social hub" showIcon>
          {state.error?.message ?? "Попробуйте обновить страницу позже."}
        </Alert>
      ) : null}

      {state.status === "ready" && state.degraded ? (
        <Alert tone="warning" title="Часть social-возможностей пока недоступна" showIcon>
          {state.degradedMessage}
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
