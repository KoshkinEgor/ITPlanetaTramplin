import { useId, useRef, useState } from "react";
import { cn } from "../../../lib/cn";

export function Tabs({
  items = [],
  value,
  defaultValue,
  onChange,
  orientation = "horizontal",
  stretch = false,
  tabListLabel = "Content sections",
  className,
  panelClassName,
  ...props
}) {
  const instanceId = useId();
  const tabRefs = useRef([]);
  const fallbackValue = items[0]?.value;
  const [internalValue, setInternalValue] = useState(defaultValue ?? fallbackValue);
  const currentValue = value ?? internalValue ?? fallbackValue;
  const activeItem = items.find((item) => item.value === currentValue) ?? items[0];

  if (!items.length) {
    return null;
  }

  const enabledIndexes = items.reduce((accumulator, item, index) => {
    if (!item.disabled) {
      accumulator.push(index);
    }
    return accumulator;
  }, []);

  const selectTab = (nextIndex) => {
    const nextItem = items[nextIndex];
    if (!nextItem || nextItem.disabled) {
      return;
    }

    if (value === undefined) {
      setInternalValue(nextItem.value);
    }

    onChange?.(nextItem.value);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div className={cn("ui-tabs", orientation === "vertical" && "ui-tabs--vertical", className)} {...props}>
      <div
        className={cn("ui-tabs__list", stretch && "ui-tabs__list--stretch")}
        role="tablist"
        aria-label={tabListLabel}
        aria-orientation={orientation}
      >
        {items.map((item) => {
          const tabId = `${instanceId}-${item.value}-tab`;
          const panelId = `${instanceId}-${item.value}-panel`;
          const isSelected = item.value === activeItem.value;
          const currentIndex = items.findIndex((candidate) => candidate.value === item.value);

          return (
            <button
              key={item.value}
              ref={(element) => {
                tabRefs.current[currentIndex] = element;
              }}
              id={tabId}
              type="button"
              role="tab"
              className="ui-tabs__tab"
              aria-selected={isSelected}
              aria-controls={panelId}
              tabIndex={isSelected ? 0 : -1}
              disabled={item.disabled}
              onKeyDown={(event) => {
                const enabledPosition = enabledIndexes.indexOf(currentIndex);
                if (enabledPosition === -1) {
                  return;
                }

                const nextKeys = orientation === "vertical" ? ["ArrowDown"] : ["ArrowRight", "ArrowDown"];
                const previousKeys = orientation === "vertical" ? ["ArrowUp"] : ["ArrowLeft", "ArrowUp"];

                if (nextKeys.includes(event.key)) {
                  event.preventDefault();
                  selectTab(enabledIndexes[(enabledPosition + 1) % enabledIndexes.length]);
                }

                if (previousKeys.includes(event.key)) {
                  event.preventDefault();
                  selectTab(enabledIndexes[(enabledPosition - 1 + enabledIndexes.length) % enabledIndexes.length]);
                }

                if (event.key === "Home") {
                  event.preventDefault();
                  selectTab(enabledIndexes[0]);
                }

                if (event.key === "End") {
                  event.preventDefault();
                  selectTab(enabledIndexes[enabledIndexes.length - 1]);
                }
              }}
              onClick={() => {
                selectTab(currentIndex);
              }}
            >
              <span className="ui-tabs__tab-copy">
                {item.icon ? <span className="ui-tabs__tab-icon" aria-hidden="true">{item.icon}</span> : null}
                <span>{item.label}</span>
              </span>
              {item.badge ? <span className="ui-tabs__tab-badge">{item.badge}</span> : null}
            </button>
          );
        })}
      </div>
      {activeItem ? (
        <div
          id={`${instanceId}-${activeItem.value}-panel`}
          role="tabpanel"
          aria-labelledby={`${instanceId}-${activeItem.value}-tab`}
          className={cn("ui-tabs__panel", panelClassName)}
        >
          {activeItem.content}
        </div>
      ) : null}
    </div>
  );
}
