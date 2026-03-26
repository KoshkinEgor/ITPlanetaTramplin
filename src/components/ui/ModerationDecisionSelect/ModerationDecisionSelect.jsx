import { useEffect, useMemo, useState } from "react";
import { cn } from "../../../lib/cn";
import { ActionSelect } from "../ActionSelect/ActionSelect";
import { Modal } from "../Modal/Modal";
import { ModerationActionDialog } from "../ModerationActionDialog/ModerationActionDialog";

function findOption(options, value) {
  return options.find((option) => option.value === value) ?? null;
}

function resolveDialogVariant(option) {
  if (option?.tone === "revision" || option?.value === "revision") {
    return "revision";
  }

  if (option?.tone === "reject" || option?.value === "rejected") {
    return "reject";
  }

  return "approve";
}

function buildDefaultDialog(option) {
  const label = option?.label ?? "Подтвердить действие";

  return {
    actionLabel: label,
    question: "Вы уверены?",
    description: `Действие «${label}» будет применено после подтверждения.`,
    confirmLabel: option?.confirmationButtonLabel ?? label,
  };
}

export function ModerationDecisionSelect({
  value,
  options,
  onConfirm,
  getDialogProps,
  disabled = false,
  busy = false,
  ariaLabel = "Выберите действие",
  cancelLabel = "Отменить действие",
  dialogSize = "md",
  shellClassName,
  className,
}) {
  const [pendingValue, setPendingValue] = useState(null);
  const [reason, setReason] = useState("");
  const currentValue = value ?? options[0]?.value ?? "";
  const pendingOption = useMemo(() => findOption(options, pendingValue), [options, pendingValue]);
  const dialogProps = pendingOption
    ? {
        ...buildDefaultDialog(pendingOption),
        ...(getDialogProps?.(pendingOption) ?? {}),
      }
    : null;
  const hasReasonField = Boolean(
    dialogProps?.reasonLabel ||
      dialogProps?.reasonPlaceholder ||
      dialogProps?.defaultReasonValue ||
      dialogProps?.reasonRequired
  );

  useEffect(() => {
    if (!pendingOption) {
      setReason("");
      return;
    }

    setReason(String(dialogProps?.defaultReasonValue ?? ""));
  }, [dialogProps?.defaultReasonValue, pendingOption]);

  const handleClose = () => {
    if (busy) {
      return;
    }

    setPendingValue(null);
    setReason("");
  };

  const handleConfirm = async (payload) => {
    if (!pendingOption) {
      return;
    }

    try {
      await onConfirm?.(pendingOption.value, pendingOption, payload);
      setPendingValue(null);
      setReason("");
    } catch {
      // Parent components render the request error and keep the dialog open.
    }
  };

  return (
    <>
      <ActionSelect
        value={currentValue}
        options={options}
        onValueChange={(nextValue) => {
          if (findOption(options, nextValue)) {
            setPendingValue(nextValue);
          }
        }}
        disabled={disabled || busy || !options.length}
        aria-label={ariaLabel}
        shellClassName={cn("ui-confirm-action-select-shell", shellClassName)}
        className={cn("ui-confirm-action-select", className)}
      />

      <Modal
        open={Boolean(pendingOption)}
        onClose={handleClose}
        ariaLabel={dialogProps?.question ?? dialogProps?.actionLabel ?? pendingOption?.label ?? "Подтверждение действия"}
        size={dialogSize === "lg" ? "lg" : "md"}
        showDismiss={false}
        closeOnEscape={!busy}
        closeOnOverlayClick={!busy}
        className={cn("ui-moderation-action-dialog-shell", dialogSize === "lg" && "ui-moderation-action-dialog-shell--lg")}
      >
        {pendingOption ? (
          <ModerationActionDialog
            size={dialogSize}
            variant={dialogProps?.variant ?? resolveDialogVariant(pendingOption)}
            actionLabel={dialogProps?.actionLabel}
            question={dialogProps?.question}
            description={dialogProps?.description}
            confirmLabel={dialogProps?.confirmLabel}
            cancelLabel={dialogProps?.cancelLabel ?? cancelLabel}
            busy={busy}
            {...(hasReasonField
              ? {
                  reasonLabel: dialogProps?.reasonLabel,
                  reasonValue: reason,
                  reasonPlaceholder: dialogProps?.reasonPlaceholder,
                  reasonResetLabel: dialogProps?.reasonResetLabel,
                  reasonRequired: dialogProps?.reasonRequired,
                  onReasonChange: setReason,
                }
              : {})}
            onCancel={handleClose}
            onConfirm={handleConfirm}
          />
        ) : null}
      </Modal>
    </>
  );
}
