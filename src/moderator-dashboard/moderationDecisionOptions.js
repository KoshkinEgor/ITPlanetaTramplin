export const MODERATION_DECISION_OPTIONS = [
  {
    value: "approved",
    label: "Одобрить",
    tone: "approve",
    confirmationTone: "success",
    confirmationButtonLabel: "Одобрить",
    confirmationButtonVariant: "primary",
  },
  {
    value: "revision",
    label: "Отправить на доработку",
    tone: "revision",
    confirmationTone: "warning",
    confirmationButtonLabel: "Отправить",
    confirmationButtonVariant: "secondary",
  },
  {
    value: "rejected",
    label: "Отклонить",
    tone: "reject",
    confirmationTone: "warning",
    confirmationButtonLabel: "Отклонить",
    confirmationButtonVariant: "danger",
  },
];
