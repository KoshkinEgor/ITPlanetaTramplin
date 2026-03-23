import { Children, cloneElement, isValidElement, useId } from "react";
import { cn } from "../../../lib/cn";

export function FormField({
  as = "label",
  htmlFor,
  label,
  meta,
  action,
  hint,
  error,
  success = false,
  disabled = false,
  required = false,
  className,
  children,
}) {
  const usesWrappingLabel = as === "label" && !action;
  const Element = usesWrappingLabel ? "label" : as === "label" ? "div" : as;
  const instanceId = useId();
  const stateClass = error ? "is-error" : success ? "is-success" : disabled ? "is-disabled" : "";
  const child = Children.count(children) === 1 ? Children.only(children) : children;
  const isSingleElementChild = isValidElement(child);
  const controlId = htmlFor || (isSingleElementChild ? child.props.id : undefined) || `ui-field-${instanceId}`;
  const message = error || hint;
  const messageId = message ? `${controlId}-message` : undefined;
  const existingDescribedBy =
    isSingleElementChild && typeof child.props["aria-describedby"] === "string"
      ? child.props["aria-describedby"]
      : undefined;
  const describedBy = [existingDescribedBy, messageId].filter(Boolean).join(" ") || undefined;

  const resolvedChild = isSingleElementChild
    ? cloneElement(child, {
        id: child.props.id ?? controlId,
        disabled: child.props.disabled ?? disabled,
        required: child.props.required ?? required,
        "aria-invalid": error ? true : child.props["aria-invalid"],
        "aria-describedby": describedBy,
        "aria-required": required || child.props["aria-required"] ? true : undefined,
      })
    : child;

  return (
    <Element className={cn("ui-field", stateClass, className)}>
      {label || meta || action ? (
        <div className="ui-field__head">
          {label ? usesWrappingLabel ? (
            <span className="ui-label">
              {label}
              {required ? <span aria-hidden="true"> *</span> : null}
            </span>
          ) : (
            <label className="ui-label" htmlFor={controlId}>
              {label}
              {required ? <span aria-hidden="true"> *</span> : null}
            </label>
          ) : <span />}
          {meta || action ? (
            <div className="ui-field__side">
              {meta ? <span className="ui-field__meta">{meta}</span> : null}
              {action ? <span className="ui-field__action">{action}</span> : null}
            </div>
          ) : null}
        </div>
      ) : null}
      {resolvedChild}
      {error ? (
        <span id={messageId} className="ui-error">
          {error}
        </span>
      ) : success && hint ? (
        <span id={messageId} className="ui-success">
          {hint}
        </span>
      ) : hint ? (
        <span id={messageId} className="ui-hint">
          {hint}
        </span>
      ) : null}
    </Element>
  );
}
