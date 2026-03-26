import { useState } from "react";
import { cn } from "../../../lib/cn";
import { getFontWeightClassName, getWidthClassName } from "../sharedProps";

const DEFAULT_ARIA_LABEL = "Переключатель режимов";

export function SegmentedControl({
  items,
  value,
  defaultValue,
  onChange,
  stretch = false,
  fontWeight,
  size = "md",
  ariaLabel = DEFAULT_ARIA_LABEL,
  className,
  itemClassName,
  width,
  ...props
}) {
  const fallbackValue = items?.[0]?.value;
  const [internalValue, setInternalValue] = useState(defaultValue ?? fallbackValue);
  const currentValue = value ?? internalValue ?? fallbackValue;
  const isFullWidth = stretch || width === "full";

  if (!items?.length) {
    return null;
  }

  const handleSelect = (nextValue) => {
    if (value === undefined) {
      setInternalValue(nextValue);
    }

    onChange?.(nextValue);
  };

  return (
    <div
      className={cn(
        "ui-segmented",
        isFullWidth && "ui-segmented--stretch",
        size === "lg" && "ui-segmented--size-lg",
        getFontWeightClassName(fontWeight),
        getWidthClassName(width),
        className
      )}
      role="group"
      aria-label={ariaLabel}
      {...props}
    >
      {items.map((item) => {
        const isActive = item.value === currentValue;
        const commonClassName = cn("ui-segmented__item", isActive && "is-active", itemClassName, item.className);

        if (item.href) {
          return (
            <a
              key={item.value}
              href={item.href}
              className={commonClassName}
              aria-current={isActive ? "page" : undefined}
              onClick={() => handleSelect(item.value)}
            >
              {item.label}
            </a>
          );
        }

        return (
          <button
            key={item.value}
            type="button"
            className={commonClassName}
            aria-pressed={isActive}
            onClick={() => handleSelect(item.value)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
