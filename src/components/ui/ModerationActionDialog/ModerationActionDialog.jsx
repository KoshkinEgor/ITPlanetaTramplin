import { useState } from "react";
import { cn } from "../../../lib/cn";
import { Button } from "../Button/Button";
import { FormField } from "../FormField/FormField";
import { Input } from "../Input/Input";

const variantClassMap = {
  approve: "ui-moderation-action-dialog--approve",
  revision: "ui-moderation-action-dialog--revision",
  reject: "ui-moderation-action-dialog--reject",
};

const variantDefaults = {
  approve: {
    actionLabel: "Одобрить заявку",
    confirmLabel: "Одобрить",
  },
  revision: {
    actionLabel: "Отправить заявку на доработку",
    confirmLabel: "Отправить на доработку",
  },
  reject: {
    actionLabel: "Отклонить заявку",
    confirmLabel: "Отклонить",
  },
};

const sizeClassMap = {
  md: "ui-moderation-action-dialog--md",
  lg: "ui-moderation-action-dialog--lg",
};

export function ModerationActionDialog({
  variant = "approve",
  size = "md",
  actionLabel,
  question = "Вы уверены?",
  description,
  confirmLabel,
  cancelLabel = "Отменить действие",
  onConfirm,
  onCancel,
  busy = false,
  disabled = false,
  className,
  reasonLabel,
  reasonValue,
  defaultReasonValue = "",
  reasonPlaceholder = "",
  reasonResetLabel = "Сбросить",
  onReasonChange,
  onReasonReset,
  reasonRequired = false,
}) {
  const resolvedVariant = variantClassMap[variant] ? variant : "approve";
  const resolvedSize = sizeClassMap[size] ? size : "md";
  const defaults = variantDefaults[resolvedVariant];
  const [internalReason, setInternalReason] = useState(defaultReasonValue);
  const isReasonControlled = reasonValue !== undefined;
  const currentReason = String(isReasonControlled ? reasonValue ?? "" : internalReason ?? "");
  const showReasonField =
    Boolean(reasonLabel) ||
    Boolean(reasonPlaceholder) ||
    Boolean(defaultReasonValue) ||
    reasonRequired;
  const isConfirmDisabled = disabled || busy || (showReasonField && reasonRequired && !currentReason.trim());

  const handleReasonChange = (nextValue) => {
    if (!isReasonControlled) {
      setInternalReason(nextValue);
    }

    onReasonChange?.(nextValue);
  };

  const handleReasonReset = () => {
    if (!isReasonControlled) {
      setInternalReason("");
    }

    onReasonChange?.("");
    onReasonReset?.();
  };

  return (
    <section className={cn("ui-moderation-action-dialog", sizeClassMap[resolvedSize], variantClassMap[resolvedVariant], className)}>
      <div className="ui-moderation-action-dialog__badge">{actionLabel ?? defaults.actionLabel}</div>

      <div className="ui-moderation-action-dialog__copy">
        <h3 className="ui-moderation-action-dialog__question">{question}</h3>
        {description ? <p className="ui-moderation-action-dialog__description">{description}</p> : null}
      </div>

      {showReasonField ? (
        <FormField
          label={reasonLabel ?? "Причина отказа"}
          action={
            <button
              type="button"
              className="ui-field__action-button ui-field__action-button--quiet"
              disabled={disabled || busy || !currentReason}
              onClick={handleReasonReset}
            >
              {reasonResetLabel}
            </button>
          }
          className="ui-moderation-action-dialog__field"
        >
          <Input
            value={currentReason}
            onValueChange={handleReasonChange}
            placeholder={reasonPlaceholder}
            disabled={disabled || busy}
          />
        </FormField>
      ) : null}

      <div className="ui-moderation-action-dialog__actions">
        <Button
          variant="secondary"
          className="ui-moderation-action-dialog__button"
          disabled={disabled || busy}
          onClick={onCancel}
        >
          {cancelLabel}
        </Button>
        <Button
          variant="secondary"
          className="ui-moderation-action-dialog__button ui-moderation-action-dialog__confirm"
          disabled={isConfirmDisabled}
          loading={busy}
          onClick={() =>
            onConfirm?.({
              variant: resolvedVariant,
              reason: currentReason.trim(),
            })
          }
        >
          {confirmLabel ?? defaults.confirmLabel}
        </Button>
      </div>
    </section>
  );
}
