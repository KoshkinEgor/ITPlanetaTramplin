import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../../lib/cn";

import { CloseIcon, SuccessIcon, WarningIcon, ErrorIcon, InfoIcon } from "../../../shared/ui";

const sizeClassMap = {
  sm: "ui-modal__dialog--sm",
  md: "",
  lg: "ui-modal__dialog--lg",
};

const toneClassMap = {
  default: "",
  info: "ui-modal__dialog--info",
  success: "ui-modal__dialog--success",
  warning: "ui-modal__dialog--warning",
  error: "ui-modal__dialog--error",
};

function ModalIcon({ tone }) {
  if (tone === "success") return <SuccessIcon />;
  if (tone === "warning") return <WarningIcon />;
  if (tone === "error") return <ErrorIcon />;
  return <InfoIcon />;
}
export function Modal({
  open = false,
  onClose,
  title,
  description,
  ariaLabel,
  size = "md",
  tone = "default",
  showIcon = false,
  icon,
  showDismiss = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  closeLabel = "Close dialog",
  initialFocusRef,
  actions,
  className,
  children,
}) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const previousActiveElementRef = useRef(null);
  const hasHeader = Boolean(title || description || showIcon || showDismiss);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const getFocusableElements = () => {
    if (!dialogRef.current) {
      return [];
    }

    return Array.from(
      dialogRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
  };

  useEffect(() => {
    if (!open || typeof window === "undefined") {
      return undefined;
    }

    previousActiveElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (closeOnEscape && event.key === "Escape") {
        onCloseRef.current?.();
      }

      if (event.key === "Tab") {
        const focusableElements = getFocusableElements();
        if (!focusableElements.length) {
          event.preventDefault();
          dialogRef.current?.focus();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement;

        if (event.shiftKey && activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    const focusTarget = initialFocusRef?.current ?? getFocusableElements()[0] ?? dialogRef.current;
    focusTarget?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previousActiveElementRef.current?.focus?.();
    };
  }, [open, closeOnEscape, initialFocusRef]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="ui-modal"
      role="presentation"
      onMouseDown={(event) => {
        if (closeOnOverlayClick && event.target === event.currentTarget) {
          onCloseRef.current?.();
        }
      }}
    >
      <div
        ref={dialogRef}
        className={cn("ui-modal__dialog", sizeClassMap[size], toneClassMap[tone], className)}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabel ? undefined : title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
        {hasHeader ? (
          <div className="ui-modal__header">
            <div className="ui-modal__lead">
              {showIcon ? <span className="ui-modal__icon">{icon ?? <ModalIcon tone={tone} />}</span> : null}
              <div className="ui-modal__copy">
                {title ? (
                  <h2 id={titleId} className="ui-type-h3">
                    {title}
                  </h2>
                ) : null}
                {description ? (
                  <p id={descriptionId} className="ui-type-body">
                    {description}
                  </p>
                ) : null}
              </div>
            </div>
            {showDismiss ? (
              <button
                type="button"
                className="ui-modal__dismiss"
                aria-label={closeLabel}
                onClick={() => onCloseRef.current?.()}
              >
                <CloseIcon />
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="ui-modal__content">{children}</div>
        {actions ? <div className="ui-modal__footer">{actions}</div> : null}
      </div>
    </div>,
    document.body
  );
}
