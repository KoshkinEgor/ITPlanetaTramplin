import { Children, forwardRef, isValidElement, useEffect, useId, useImperativeHandle, useMemo, useRef, useState } from "react";
import { cn } from "../../../lib/cn";
import { getFontWeightClassName, getWidthClassName } from "../sharedProps";

function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m3.5 5.75 4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function normalizeOptions(options, children, placeholder) {
  const childOptions = Children.toArray(children)
    .filter(isValidElement)
    .map((child) => ({
      value: String(child.props.value ?? ""),
      label: child.props.children,
      disabled: Boolean(child.props.disabled),
      tone: child.props.tone ?? "default",
    }));

  const baseOptions = childOptions.length
    ? childOptions
    : options.map((option) => ({
        value: String(option.value ?? ""),
        label: option.label,
        disabled: Boolean(option.disabled),
        tone: option.tone ?? "default",
      }));

  if (!placeholder) {
    return baseOptions;
  }

  return [
    {
      value: "",
      label: placeholder,
      disabled: false,
      tone: "default",
      isPlaceholder: true,
    },
    ...baseOptions,
  ];
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

export const ActionSelect = forwardRef(function ActionSelect(
  {
    id,
    name,
    value,
    defaultValue = "",
    onChange,
    onValueChange,
    options = [],
    children,
    placeholder,
    hovered = false,
    focused = false,
    disabled = false,
    fontWeight,
    tone,
    shellClassName,
    className,
    width,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    "aria-required": ariaRequired,
    ...props
  },
  ref
) {
  const nativeSelectRef = useRef(null);
  const rootRef = useRef(null);
  const listboxId = useId();
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? String(value ?? "") : String(internalValue ?? "");
  const normalizedOptions = useMemo(() => normalizeOptions(options, children, placeholder), [children, options, placeholder]);
  const selectedIndex = normalizedOptions.findIndex((option) => option.value === currentValue);
  const [highlightedIndex, setHighlightedIndex] = useState(selectedIndex >= 0 ? selectedIndex : findFirstEnabledIndex(normalizedOptions));
  const selectedOption = selectedIndex >= 0 ? normalizedOptions[selectedIndex] : normalizedOptions[0];
  const resolvedTone = tone ?? (selectedOption?.isPlaceholder ? "default" : selectedOption?.tone ?? "default");
  const sharedClassName = cn(getFontWeightClassName(fontWeight), getWidthClassName(width));

  useImperativeHandle(ref, () => nativeSelectRef.current);

  useEffect(() => {
    if (!open) {
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
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (selectedIndex >= 0 && !normalizedOptions[selectedIndex]?.disabled) {
      setHighlightedIndex(selectedIndex);
      return;
    }

    setHighlightedIndex(findFirstEnabledIndex(normalizedOptions));
  }, [normalizedOptions, open, selectedIndex]);

  const dispatchChangeEvent = (nextValue) => {
    if (!nativeSelectRef.current || typeof window === "undefined") {
      return;
    }

    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value");
    descriptor?.set?.call(nativeSelectRef.current, nextValue);
    nativeSelectRef.current.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const selectValue = (nextValue) => {
    dispatchChangeEvent(nextValue);
    setOpen(false);
  };

  return (
    <span ref={rootRef} className={cn("ui-action-select-shell", sharedClassName, shellClassName)}>
      <select
        ref={nativeSelectRef}
        className="ui-visually-hidden"
        name={name}
        value={currentValue}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          if (!isControlled) {
            setInternalValue(event.target.value);
          }

          onValueChange?.(event.target.value);
          onChange?.(event);
        }}
        {...props}
      >
        {normalizedOptions.map((option) => (
          <option key={`${option.value}-${String(option.label)}`} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        id={id}
        type="button"
        disabled={disabled}
        className={cn(
          "ui-action-select",
          `ui-action-select--${resolvedTone}`,
          hovered && "is-hovered",
          focused && "is-focused",
          open && "is-open",
          selectedOption?.isPlaceholder && "ui-action-select--placeholder",
          sharedClassName,
          className
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        aria-required={ariaRequired}
        onClick={() => {
          if (!disabled) {
            setOpen((currentOpen) => !currentOpen);
          }
        }}
        onKeyDown={(event) => {
          if (disabled) {
            return;
          }

          if (event.key === "ArrowDown") {
            event.preventDefault();

            if (!open) {
              const nextIndex =
                selectedIndex >= 0
                  ? findNextEnabledIndex(normalizedOptions, selectedIndex, 1)
                  : findFirstEnabledIndex(normalizedOptions);
              setHighlightedIndex(nextIndex);
              setOpen(true);
              return;
            }

            setHighlightedIndex((currentIndex) => findNextEnabledIndex(normalizedOptions, currentIndex, 1));
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();

            if (!open) {
              const nextIndex =
                selectedIndex >= 0
                  ? findNextEnabledIndex(normalizedOptions, selectedIndex, -1)
                  : findFirstEnabledIndex(normalizedOptions);
              setHighlightedIndex(nextIndex);
              setOpen(true);
              return;
            }

            setHighlightedIndex((currentIndex) => findNextEnabledIndex(normalizedOptions, currentIndex, -1));
          }

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();

            if (!open) {
              setOpen(true);
              return;
            }

            const option = normalizedOptions[highlightedIndex];

            if (option && !option.disabled) {
              selectValue(option.value);
            }
          }

          if (event.key === "Escape" && open) {
            event.preventDefault();
            setOpen(false);
          }

          if (event.key === "Tab" && open) {
            setOpen(false);
          }
        }}
      >
        <span className="ui-action-select__label">{selectedOption?.label ?? placeholder ?? ""}</span>
        <span className="ui-action-select__chevron" aria-hidden="true">
          <ChevronIcon />
        </span>
      </button>

      {open ? (
        <div className="ui-action-select__menu" role="listbox" id={listboxId}>
          {normalizedOptions.map((option, index) => {
            const isSelected = option.value === currentValue;

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
                  index === highlightedIndex && "is-highlighted",
                  option.isPlaceholder && "is-placeholder"
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
                    selectValue(option.value);
                  }
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </span>
  );
});
