import { buildCandidatePublicProfileRoute } from "../app/routes";

const EMPTY_RELATIONSHIP = Object.freeze({
  contactState: "none",
  friendState: "none",
  projectInviteState: "none",
  friendRequestId: null,
  projectInviteId: null,
  canInviteToProject: false,
});

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeUserId(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeSkillList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

function normalizeLinkValue(value) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return "";
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  if (normalized.startsWith("@")) {
    return `https://t.me/${normalized.slice(1)}`;
  }

  if (normalized.startsWith("t.me/")) {
    return `https://${normalized}`;
  }

  if (normalized.startsWith("vk.com/")) {
    return `https://${normalized}`;
  }

  if (normalized.includes(".")) {
    return `https://${normalized}`;
  }

  return normalized;
}

export function createEmptyRelationship() {
  return { ...EMPTY_RELATIONSHIP };
}

export function normalizeRelationship(relationship) {
  if (!relationship || typeof relationship !== "object") {
    return createEmptyRelationship();
  }

  const contactState = normalizeText(relationship.contactState) || EMPTY_RELATIONSHIP.contactState;
  const friendState = normalizeText(relationship.friendState) || EMPTY_RELATIONSHIP.friendState;
  const projectInviteState = normalizeText(relationship.projectInviteState) || EMPTY_RELATIONSHIP.projectInviteState;

  return {
    contactState,
    friendState,
    projectInviteState,
    friendRequestId: normalizeUserId(relationship.friendRequestId),
    projectInviteId: normalizeUserId(relationship.projectInviteId),
    canInviteToProject: Boolean(relationship.canInviteToProject ?? (contactState === "saved" || friendState === "friends")),
  };
}

export function patchRelationship(currentRelationship, patch) {
  return normalizeRelationship({
    ...normalizeRelationship(currentRelationship),
    ...patch,
  });
}

export function isSavedContact(relationship) {
  return normalizeRelationship(relationship).contactState === "saved";
}

export function isFriend(relationship) {
  return normalizeRelationship(relationship).friendState === "friends";
}

export function canInviteCandidateToProject(relationship) {
  const normalized = normalizeRelationship(relationship);
  return normalized.canInviteToProject || normalized.contactState === "saved" || normalized.friendState === "friends";
}

export function getRelationshipBadge(relationship) {
  const normalized = normalizeRelationship(relationship);

  if (normalized.projectInviteState === "incoming" || normalized.projectInviteState === "outgoing") {
    return {
      label: "Инвайт",
      tone: "warning",
    };
  }

  if (normalized.friendState === "incoming" || normalized.friendState === "outgoing") {
    return {
      label: "Заявка",
      tone: "soft",
    };
  }

  if (normalized.friendState === "friends") {
    return {
      label: "Друг",
      tone: "success",
    };
  }

  if (normalized.contactState === "saved") {
    return {
      label: "Контакт",
      tone: "accent",
    };
  }

  return {
    label: "Профиль",
    tone: "neutral",
  };
}

export function buildSocialProfileHref(user) {
  const skills = normalizeSkillList(user?.skills);
  const userId = normalizeUserId(user?.userId ?? user?.contactProfileId ?? user?.id);

  return buildCandidatePublicProfileRoute({
    userId,
    name: normalizeText(user?.name),
    email: normalizeText(user?.email),
    skills,
  });
}

export function buildSocialLinksList(socialLinks) {
  if (!socialLinks || typeof socialLinks !== "object") {
    return [];
  }

  return [
    { key: "telegram", label: "Telegram", href: normalizeLinkValue(socialLinks.telegram) },
    { key: "vk", label: "VK", href: normalizeLinkValue(socialLinks.vk) },
    { key: "github", label: "GitHub", href: normalizeLinkValue(socialLinks.github) },
    { key: "behance", label: "Behance", href: normalizeLinkValue(socialLinks.behance) },
    { key: "portfolio", label: "Портфолио", href: normalizeLinkValue(socialLinks.portfolio) },
  ].filter((item) => item.href);
}

export function mapSocialUserToCard(user) {
  const relationship = normalizeRelationship(user?.relationship);
  const name = normalizeText(user?.name) || normalizeText(user?.email) || "Кандидат";
  const skills = normalizeSkillList(user?.skills).slice(0, 4);

  return {
    id: normalizeUserId(user?.userId ?? user?.contactProfileId ?? user?.id) ?? name,
    userId: normalizeUserId(user?.userId ?? user?.contactProfileId ?? user?.id),
    name,
    email: normalizeText(user?.email),
    skills,
    relationship,
    badge: getRelationshipBadge(relationship),
    href: buildSocialProfileHref(user),
  };
}

export function getFriendRequestDirection(request, currentUserId) {
  if (!request || currentUserId == null) {
    return "unknown";
  }

  return Number(request.senderUserId) === Number(currentUserId) ? "outgoing" : "incoming";
}

export function getProjectInviteDirection(invite, currentUserId) {
  if (!invite || currentUserId == null) {
    return "unknown";
  }

  return Number(invite.senderUserId) === Number(currentUserId) ? "outgoing" : "incoming";
}

export function getIncomingFriendRequests(requests, currentUserId) {
  return (Array.isArray(requests) ? requests : []).filter(
    (request) => normalizeText(request?.status) === "pending" && getFriendRequestDirection(request, currentUserId) === "incoming"
  );
}

export function getIncomingProjectInvites(invites, currentUserId) {
  return (Array.isArray(invites) ? invites : []).filter(
    (invite) => normalizeText(invite?.status) === "pending" && getProjectInviteDirection(invite, currentUserId) === "incoming"
  );
}

export function getPendingNotificationCount(friendRequests, projectInvites, currentUserId) {
  return getIncomingFriendRequests(friendRequests, currentUserId).length + getIncomingProjectInvites(projectInvites, currentUserId).length;
}
