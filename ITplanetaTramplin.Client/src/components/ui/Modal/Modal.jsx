import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../../lib/cn";

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
  if (tone === "success") {
    return (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3.5 8.2 6.4 11.1 12.5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (tone === "warning") {
    return (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 2.3 14 13H2L8 2.3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 5.8V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11.1" r=".8" fill="currentColor" />
      </svg>
    );
  }

  if (tone === "error") {
    return (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="5.75" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 5.1V8.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="11.1" r=".8" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7.1V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="4.8" r=".8" fill="currentColor" />
    </svg>
  );
}

function DismissIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4.5 4.5 11.5 11.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M11.5 4.5 4.5 11.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function Modal({
  open = false,
  onClose,
  title,
  description,
  size = "md",
  tone = "default",
  showIcon = false,
  icon,
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
  const previousActiveElementRef = useRef(null);

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
        onClose?.();
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
  }, [open, onClose, closeOnEscape, initialFocusRef]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="ui-modal"
      role="presentation"
      onMouseDown={(event) => {
        if (closeOnOverlayClick && event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div
        ref={dialogRef}
        className={cn("ui-modal__dialog", sizeClassMap[size], toneClassMap[tone], className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
      >
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
          <button
            type="button"
            className="ui-modal__dismiss"
            aria-label={closeLabel}
            onClick={() => onClose?.()}
          >
            <DismissIcon />
          </button>
        </div>
        <div className="ui-modal__content">{children}</div>
        {actions ? <div className="ui-modal__footer">{actions}</div> : null}
      </div>
    </div>,
    document.body
  );
}
