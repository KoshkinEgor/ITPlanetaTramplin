import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "../../../lib/cn";
import { ChevronDownIcon } from "../../../shared/ui";

function normalizeCompanyValue(value) {
  return String(value ?? "").trim().toLowerCase();
}

function findNextIndex(options, currentIndex, direction) {
  if (!options.length) {
    return -1;
  }

  return (currentIndex + direction + options.length) % options.length;
}

function normalizeOptions(options) {
  const seen = new Set();

  return (Array.isArray(options) ? options : [])
    .map((option) => {
      if (typeof option === "string") {
        return { value: option.trim(), label: option.trim(), meta: "" };
      }

      const label = String(option?.label ?? option?.companyName ?? option?.name ?? option?.value ?? "").trim();
      return {
        value: String(option?.value ?? label).trim(),
        label,
        meta: String(option?.meta ?? option?.description ?? "").trim(),
      };
    })
    .filter((option) => {
      const key = normalizeCompanyValue(option.value || option.label);
      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

export function CompanyAutocomplete({
  value = "",
  onValueChange,
  options = [],
  placeholder = "Выберите компанию",
  searchPlaceholder = "Начните вводить компанию",
  emptyLabel = "Такой компании пока нет на платформе",
  createLabel = "Добавить как текст",
  className,
  inputClassName,
  menuClassName,
  optionClassName,
  disabled = false,
  id,
  name,
  required,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-required": ariaRequired,
}) {
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const listboxId = useId();
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const normalizedQuery = normalizeCompanyValue(query);

  const normalizedOptions = useMemo(() => normalizeOptions(options), [options]);
  const visibleOptions = useMemo(() => {
    if (!normalizedQuery) {
      return normalizedOptions;
    }

    return normalizedOptions.filter((option) =>
      normalizeCompanyValue([option.label, option.meta].filter(Boolean).join(" ")).includes(normalizedQuery)
    );
  }, [normalizedOptions, normalizedQuery]);

  const activeOption = visibleOptions[highlightedIndex] ?? null;
  const hasExactMatch = visibleOptions.some((option) => normalizeCompanyValue(option.value) === normalizedQuery);
  const customValue = query.trim();

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const commitValue = (nextValue) => {
    const normalizedValue = String(nextValue ?? "").trim();
    setQuery(normalizedValue);
    setIsOpen(false);
    onValueChange?.(normalizedValue);
  };

  const handleClose = () => {
    commitValue(query);
  };

  return (
    <div
      ref={rootRef}
      className={cn("ui-company-autocomplete", isOpen && "is-open", disabled && "is-disabled", className)}
      onBlurCapture={() => {
        window.requestAnimationFrame(() => {
          if (!rootRef.current?.contains(document.activeElement)) {
            handleClose();
          }
        });
      }}
    >
      {name ? <input type="hidden" name={name} value={value} /> : null}

      <div className="ui-company-autocomplete__control">
        <input
          ref={inputRef}
          id={id}
          type="text"
          className={cn("ui-input", "ui-company-autocomplete__input", inputClassName)}
          value={query}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          aria-required={ariaRequired}
          aria-activedescendant={activeOption ? `${listboxId}-${highlightedIndex}` : undefined}
          placeholder={value ? placeholder : searchPlaceholder}
          disabled={disabled}
          required={required}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
            }
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              inputRef.current?.blur();
              setQuery(value);
              setIsOpen(false);
              return;
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              setIsOpen(true);
              setHighlightedIndex((currentIndex) => findNextIndex(visibleOptions, currentIndex, 1));
              return;
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setIsOpen(true);
              setHighlightedIndex((currentIndex) => findNextIndex(visibleOptions, currentIndex, -1));
              return;
            }

            if (event.key === "Enter") {
              event.preventDefault();
              commitValue(activeOption?.value ?? customValue);
            }
          }}
        />

        <button
          type="button"
          className="ui-company-autocomplete__toggle"
          aria-label={isOpen ? "Скрыть список компаний" : "Показать список компаний"}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          disabled={disabled}
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          onClick={() => {
            if (disabled) {
              return;
            }

            if (isOpen) {
              handleClose();
              return;
            }

            setIsOpen(true);
            inputRef.current?.focus();
          }}
        >
          <ChevronDownIcon />
        </button>
      </div>

      {isOpen ? (
        <div className={cn("ui-company-autocomplete__menu", menuClassName)} id={listboxId} role="listbox" aria-label="Список компаний">
          {visibleOptions.length ? (
            <div className="ui-company-autocomplete__options-list">
              {visibleOptions.map((option, index) => {
                const isSelected = normalizeCompanyValue(value) === normalizeCompanyValue(option.value);
                const isHighlighted = highlightedIndex === index;

                return (
                  <button
                    key={option.value}
                    id={`${listboxId}-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      "ui-company-autocomplete__option",
                      isSelected && "is-selected",
                      isHighlighted && "is-highlighted",
                      optionClassName
                    )}
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => commitValue(option.value)}
                  >
                    <span className="ui-company-autocomplete__option-title">{option.label}</span>
                    {option.meta ? <span className="ui-company-autocomplete__option-meta">{option.meta}</span> : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="ui-company-autocomplete__state">
              <span>{emptyLabel}</span>
              {customValue ? (
                <button type="button" className="ui-company-autocomplete__create-btn" onClick={() => commitValue(customValue)}>
                  {createLabel}: "{customValue}"
                </button>
              ) : null}
            </div>
          )}

          {customValue && !hasExactMatch && visibleOptions.length ? (
            <button type="button" className="ui-company-autocomplete__custom-option" onClick={() => commitValue(customValue)}>
              {createLabel}: "{customValue}"
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
