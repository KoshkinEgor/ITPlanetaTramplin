import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "../../../lib/cn";
import { ActionSelect } from "../ActionSelect/ActionSelect";
import { ModerationActionDialog } from "../ModerationActionDialog/ModerationActionDialog";
import { Modal } from "../Modal/Modal";
import { getFontWeightClassName, getWidthClassName } from "../sharedProps";

function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m3.5 5.75 4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function findOption(options, value) {
  return options.find((option) => option.value === value) ?? null;
}

function buildDefaultConfirmation(option) {
  const label = option?.label ?? "Подтвердить";

  return {
    actionLabel: label,
    title: "Подтвердите действие",
    description: `Будет применено действие «${label}».`,
    tone: option?.confirmationTone ?? (option?.tone === "reject" ? "warning" : "default"),
    confirmLabel: option?.confirmationButtonLabel ?? label,
    confirmVariant: option?.confirmationButtonVariant ?? (option?.tone === "reject" ? "danger" : "primary"),
  };
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

function findFirstEnabledIndex(options) {
  return options.findIndex((option) => !option.disabled);
}

function findNextEnabledIndex(options, startIndex, direction) {
  if (!options.length) {
    return -1;
  }

  let index = startIndex;

  for (let step = 0; step < options.length; step += 1) {
    index = (index + direction + options.length) % options.length;

    if (!options[index]?.disabled) {
      return index;
    }
  }

  return -1;
}

export function ConfirmActionSelect({
  value,
  defaultValue,
  options,
  onConfirm,
  getConfirmation,
  disabled = false,
  busy = false,
  ariaLabel = "Выберите действие",
  toggleAriaLabel = "Открыть список действий",
  cancelLabel = "Отмена",
  split = false,
  onOpenChange,
  fontWeight,
  shellClassName,
  className,
  toggleClassName,
  width,
}) {
  const rootRef = useRef(null);
  const listboxId = useId();
  const [internalValue, setInternalValue] = useState(defaultValue ?? options[0]?.value ?? "");
  const [pendingValue, setPendingValue] = useState(null);
  const [open, setOpen] = useState(false);
  const isControlled = value !== undefined;
  const currentValue = String(isControlled ? value ?? options[0]?.value ?? "" : internalValue ?? options[0]?.value ?? "");
  const selectedIndex = options.findIndex((option) => String(option.value) === currentValue);
  const [highlightedIndex, setHighlightedIndex] = useState(selectedIndex >= 0 ? selectedIndex : findFirstEnabledIndex(options));
  const currentOption = useMemo(() => findOption(options, currentValue), [options, currentValue]);
  const pendingOption = useMemo(() => findOption(options, pendingValue), [options, pendingValue]);
  const confirmation = pendingOption
    ? {
        ...buildDefaultConfirmation(pendingOption),
        ...(getConfirmation?.(pendingOption) ?? {}),
      }
    : null;
  const sharedClassName = cn(getFontWeightClassName(fontWeight), getWidthClassName(width));

  useEffect(() => {
    onOpenChange?.(open);
  }, [onOpenChange, open]);

  useEffect(() => {
    if (!split || !open) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open, split]);

  useEffect(() => {
    if (!split || !open) {
      return;
    }

    if (selectedIndex >= 0 && !options[selectedIndex]?.disabled) {
      setHighlightedIndex(selectedIndex);
      return;
    }

    setHighlightedIndex(findFirstEnabledIndex(options));
  }, [open, options, selectedIndex, split]);

  const handleClose = () => {
    if (busy) {
      return;
    }

    setPendingValue(null);
  };

  const handleConfirm = async () => {
    if (!pendingOption) {
      return;
    }

    try {
      await onConfirm?.(pendingOption.value, pendingOption);
      if (!isControlled) {
        setInternalValue(pendingOption.value);
      }
      setPendingValue(null);
    } catch {
      // Parent components render the request error and keep the dialog open.
    }
  };

  const requestConfirmation = (nextValue) => {
    if (findOption(options, nextValue)) {
      setPendingValue(nextValue);
      setOpen(false);
    }
  };

  const renderMenu = () => (
    <div className="ui-action-select__menu" role="listbox" id={listboxId}>
      {options.map((option, index) => {
        const isSelected = String(option.value) === currentValue;

        return (
          <button
            key={`${option.value}-${String(option.label)}`}
            type="button"
            role="option"
            aria-selected={isSelected}
            disabled={option.disabled}
            className={cn(
              "ui-action-select__option",
              option.tone && option.tone !== "default" && `ui-action-select__option--${option.tone}`,
              isSelected && "is-selected",
              index === highlightedIndex && "is-highlighted"
            )}
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            onMouseEnter={() => {
              if (!option.disabled) {
                setHighlightedIndex(index);
              }
            }}
            onClick={() => {
              if (!option.disabled) {
                requestConfirmation(option.value);
              }
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {split ? (
        <span
          ref={rootRef}
          className={cn("ui-confirm-action-select-shell", "ui-confirm-action-select-shell--split", open && "is-open", sharedClassName, shellClassName)}
        >
          <span className="ui-confirm-action-select__split">
            <button
              type="button"
              disabled={disabled || busy || !currentOption}
              className={cn(
                "ui-action-select",
                "ui-confirm-action-select",
                "ui-confirm-action-select--split-main",
                currentOption?.tone && `ui-action-select--${currentOption.tone}`,
                className
              )}
              onClick={() => {
                if (currentOption) {
                  requestConfirmation(currentOption.value);
                }
              }}
            >
              <span className="ui-action-select__label">{currentOption?.label ?? ""}</span>
            </button>

            <button
              type="button"
              disabled={disabled || busy || !options.length}
              aria-label={toggleAriaLabel}
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-controls={open ? listboxId : undefined}
              className={cn(
                "ui-action-select",
                "ui-confirm-action-select",
                "ui-confirm-action-select--split-toggle",
                currentOption?.tone && `ui-action-select--${currentOption.tone}`,
                open && "is-open",
                toggleClassName
              )}
              onClick={() => {
                setOpen((currentOpen) => !currentOpen);
              }}
              onKeyDown={(event) => {
                if (disabled || busy || !options.length) {
                  return;
                }

                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setHighlightedIndex(
                    open
                      ? findNextEnabledIndex(options, highlightedIndex, 1)
                      : selectedIndex >= 0
                        ? findNextEnabledIndex(options, selectedIndex, 1)
                        : findFirstEnabledIndex(options)
                  );
                  setOpen(true);
                }

                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setHighlightedIndex(
                    open
                      ? findNextEnabledIndex(options, highlightedIndex, -1)
                      : selectedIndex >= 0
                        ? findNextEnabledIndex(options, selectedIndex, -1)
                        : findFirstEnabledIndex(options)
                  );
                  setOpen(true);
                }

                if (event.key === "Escape" && open) {
                  event.preventDefault();
                  setOpen(false);
                }
              }}
            >
              <span className="ui-action-select__chevron" aria-hidden="true">
                <ChevronIcon />
              </span>
            </button>
          </span>

          {open ? renderMenu() : null}
        </span>
      ) : (
        <ActionSelect
          value={currentValue}
          options={options}
          onValueChange={(nextValue) => {
            requestConfirmation(nextValue);
          }}
          disabled={disabled || busy || !options.length}
          aria-label={ariaLabel}
          fontWeight={fontWeight}
          shellClassName={cn("ui-confirm-action-select-shell", shellClassName)}
          className={cn("ui-confirm-action-select", className)}
          width={width}
        />
      )}

      <Modal
        open={Boolean(pendingOption)}
        onClose={handleClose}
        ariaLabel={confirmation?.title ?? confirmation?.actionLabel ?? pendingOption?.label ?? "Подтверждение действия"}
        size="lg"
        showDismiss={false}
        closeOnEscape={!busy}
        closeOnOverlayClick={!busy}
        className="ui-moderation-action-dialog-shell"
      >
        {pendingOption ? (
          <ModerationActionDialog
            variant={resolveDialogVariant(pendingOption)}
            actionLabel={confirmation?.actionLabel ?? pendingOption.label}
            question={confirmation?.title}
            description={confirmation?.description}
            confirmLabel={confirmation?.confirmLabel}
            cancelLabel={cancelLabel}
            busy={busy}
            onCancel={handleClose}
            onConfirm={handleConfirm}
          />
        ) : null}
      </Modal>
    </>
  );
}
