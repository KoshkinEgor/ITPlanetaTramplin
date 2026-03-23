import { useState } from "react";
import { cn } from "../../../lib/cn";

export function SegmentedControl({
  items,
  value,
  defaultValue,
  onChange,
  stretch = false,
  className,
  itemClassName,
}) {
  const fallbackValue = items?.[0]?.value;
  const [internalValue, setInternalValue] = useState(defaultValue ?? fallbackValue);
  const currentValue = value ?? internalValue ?? fallbackValue;

  if (!items?.length) {
    return null;
  }

  return (
    <div className={cn("ui-segmented", stretch && "ui-segmented--stretch", className)} role="tablist" aria-label="Переключатель разделов">
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
            onClick={() => {
              if (value === undefined) {
                setInternalValue(item.value);
              }
              onChange?.(item.value);
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
