export const APPLICATION_RESPONSE_TONE_BY_KEY = Object.freeze({
  sent: "info",
  viewed: "info",
  invited: "lime",
  confirmed: "success",
  completed: "neutral",
  rejected: "warning",
  blocked: "violet",
});

export const TEMPORARY_STATUS_TONE_BY_KEY = Object.freeze({
  viewed: "info",
  completed: "warning",
  reserve: "violet",
  invited: "lime",
  active: "success",
  waiting: "neutral",
});

export const SYSTEM_FEEDBACK_TONE_BY_KEY = Object.freeze({
  success: "success",
  error: "warning",
  saving: "info",
});

export const STATUS_TONE_BY_KEY = Object.freeze({
  info: "info",
  neutral: "neutral",
  warning: "warning",
  violet: "violet",
  lime: "lime",
  success: "success",
  pending: "neutral",
  review: "neutral",
  sent: APPLICATION_RESPONSE_TONE_BY_KEY.sent,
  viewed: TEMPORARY_STATUS_TONE_BY_KEY.viewed,
  saving: SYSTEM_FEEDBACK_TONE_BY_KEY.saving,
  completed: APPLICATION_RESPONSE_TONE_BY_KEY.completed,
  waiting: TEMPORARY_STATUS_TONE_BY_KEY.waiting,
  approved: "success",
  active: TEMPORARY_STATUS_TONE_BY_KEY.active,
  confirmed: APPLICATION_RESPONSE_TONE_BY_KEY.confirmed,
  invited: APPLICATION_RESPONSE_TONE_BY_KEY.invited,
  blocked: APPLICATION_RESPONSE_TONE_BY_KEY.blocked,
  reserve: TEMPORARY_STATUS_TONE_BY_KEY.reserve,
  revision: "violet",
  rejected: APPLICATION_RESPONSE_TONE_BY_KEY.rejected,
  deleted: "warning",
  error: SYSTEM_FEEDBACK_TONE_BY_KEY.error,
});

export function resolveStatusTone({ tone, statusKey }) {
  return tone ?? STATUS_TONE_BY_KEY[statusKey] ?? "neutral";
}
