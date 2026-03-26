import { cloneElement, isValidElement, useId } from "react";
import { cn } from "../../../lib/cn";
import { getFontWeightClassName, getWidthClassName } from "../sharedProps";

export function ChoiceGroup({
  as = "fieldset",
  legend,
  meta,
  action,
  hint,
  error,
  success = false,
  required = false,
  disabled = false,
  orientation = "vertical",
  compact = false,
  fontWeight,
  width,
  className,
  legendClassName,
  contentClassName,
  children,
  ...props
}) {
  const Element = as;
  const instanceId = useId();
  const legendId = legend ? `ui-choice-group-${instanceId}-legend` : undefined;
  const message = error || hint;
  const messageId = message ? `ui-choice-group-${instanceId}-message` : undefined;
  const stateClass = error ? "is-error" : success ? "is-success" : disabled ? "is-disabled" : "";
  const resolvedAction = disabled && isValidElement(action) ? cloneElement(action, { disabled: action.props.disabled ?? true }) : action;
  const legendContent = (
    <>
      {legend}
      {required ? <span aria-hidden="true"> *</span> : null}
    </>
  );
  const sideContent = meta || resolvedAction ? (
    <span className="ui-choice-group__side">
      {meta ? <span className="ui-choice-group__meta">{meta}</span> : null}
      {resolvedAction ? <span className="ui-choice-group__action">{resolvedAction}</span> : null}
    </span>
  ) : null;

  const content = (
    <>
      {legend ? (
        Element === "fieldset" ? (
          <legend className="ui-choice-group__legend-wrap">
            <span className="ui-choice-group__head">
              <span id={legendId} className={cn("ui-choice-group__legend", legendClassName)}>
                {legendContent}
              </span>
              {sideContent}
            </span>
          </legend>
        ) : (
          <div className="ui-choice-group__head">
            <div id={legendId} className={cn("ui-choice-group__legend", legendClassName)}>
              {legendContent}
            </div>
            {sideContent}
          </div>
        )
      ) : sideContent ? (
        <div className="ui-choice-group__head ui-choice-group__head--side-only">{sideContent}</div>
      ) : null}
      <div
        className={cn(
          "ui-choice-group__stack",
          orientation === "horizontal" && "ui-choice-group__stack--horizontal",
          compact && "ui-choice-group__stack--compact",
          contentClassName
        )}
      >
        {children}
      </div>
      {error ? (
        <p id={messageId} className="ui-choice-group__error">
          {error}
        </p>
      ) : success && hint ? (
        <p id={messageId} className="ui-choice-group__success">
          {hint}
        </p>
      ) : hint ? (
        <p id={messageId} className="ui-choice-group__hint">
          {hint}
        </p>
      ) : null}
    </>
  );

  if (Element === "fieldset") {
    return (
      <fieldset
        className={cn("ui-choice-group", stateClass, getFontWeightClassName(fontWeight), getWidthClassName(width), className)}
        disabled={disabled}
        aria-describedby={messageId}
        aria-invalid={error ? true : undefined}
        {...props}
      >
        {content}
      </fieldset>
    );
  }

  return (
    <Element
      className={cn("ui-choice-group", stateClass, getFontWeightClassName(fontWeight), getWidthClassName(width), className)}
      role={props.role ?? "group"}
      aria-labelledby={legendId}
      aria-describedby={messageId}
      aria-invalid={error ? true : undefined}
      aria-required={required || undefined}
      aria-disabled={disabled || undefined}
      {...props}
    >
      {content}
    </Element>
  );
}
