import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import { searchAddressSuggestions } from "../../../api/addresses";
import { cn } from "../../../lib/cn";

function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m3.5 5.75 4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function findNextIndex(options, currentIndex, direction) {
  if (!options.length) {
    return -1;
  }

  let nextIndex = currentIndex;

  for (let step = 0; step < options.length; step += 1) {
    nextIndex = (nextIndex + direction + options.length) % options.length;

    if (options[nextIndex]) {
      return nextIndex;
    }
  }

  return -1;
}

function getKindLabel(kind) {
  switch (kind) {
    case "house":
      return "Дом";
    case "street":
      return "Улица";
    case "city":
      return "Город";
    case "flat":
      return "Квартира";
    default:
      return "Адрес";
  }
}

function buildOptionGroups(result) {
  return [
    {
      id: "suggestions",
      title: "",
      options: Array.isArray(result?.suggestions) ? result.suggestions : [],
    },
    {
      id: "nearby",
      title: "Ближайшие дома",
      options: Array.isArray(result?.nearbyStreetMatches) ? result.nearbyStreetMatches : [],
    },
  ].filter((group) => group.options.length > 0);
}

function flattenOptionGroups(optionGroups) {
  return optionGroups.flatMap((group) =>
    group.options.map((option) => ({
      groupId: group.id,
      option,
      optionId: `${group.id}-${option.fiasId || option.streetFiasId || option.unrestrictedValue || option.label}`,
    }))
  );
}

function matchesQuery(option, query) {
  const normalizedQuery = String(query ?? "").trim().toLowerCase();

  if (!normalizedQuery) {
    return false;
  }

  return [option.label, option.value, option.unrestrictedValue]
    .filter(Boolean)
    .some((value) => String(value).trim().toLowerCase() === normalizedQuery);
}

export function AddressAutocomplete({
  value = "",
  onValueChange,
  onSelectOption,
  city = "",
  latitude = null,
  longitude = null,
  placeholder = "Введите адрес",
  searchPlaceholder = "Начните с улицы, дома или ориентира",
  loadingLabel = "Ищем адреса…",
  idleLabel = "Начните вводить улицу, дом или название места.",
  emptyLabel = "Ничего похожего рядом не нашли",
  errorLabel = "Не удалось загрузить адресные подсказки. Можно продолжить ввод вручную.",
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
  const [status, setStatus] = useState("idle");
  const [lookupResult, setLookupResult] = useState({ suggestions: [], nearbyStreetMatches: [] });
  const deferredQuery = useDeferredValue(query);
  const trimmedDeferredQuery = String(deferredQuery ?? "").trim();
  const optionGroups = useMemo(() => buildOptionGroups(lookupResult), [lookupResult]);
  const flatOptions = useMemo(() => flattenOptionGroups(optionGroups), [optionGroups]);
  const [highlightedIndex, setHighlightedIndex] = useState(flatOptions.length ? 0 : -1);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!isOpen || disabled) {
      return undefined;
    }

    if (trimmedDeferredQuery.length < 2) {
      setLookupResult({ suggestions: [], nearbyStreetMatches: [] });
      setStatus("idle");
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setStatus("loading");
        const nextLookupResult = await searchAddressSuggestions(trimmedDeferredQuery, {
          city,
          latitude,
          longitude,
          signal: controller.signal,
        });
        setLookupResult(nextLookupResult);
        setStatus("ready");
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        setLookupResult({ suggestions: [], nearbyStreetMatches: [] });
        setStatus("error");
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [city, disabled, isOpen, latitude, longitude, trimmedDeferredQuery]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setHighlightedIndex(flatOptions.length ? 0 : -1);
  }, [flatOptions, isOpen]);

  const activeOption = highlightedIndex >= 0 ? flatOptions[highlightedIndex]?.option ?? null : null;

  function commitSelection(option) {
    if (!option) {
      setIsOpen(false);
      return;
    }

    setQuery(option.label);
    setIsOpen(false);
    onValueChange?.(option.label);
    onSelectOption?.(option);
  }

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <div
      ref={rootRef}
      className={cn("ui-address-autocomplete", isOpen && "is-open", disabled && "is-disabled", className)}
      onBlurCapture={() => {
        window.requestAnimationFrame(() => {
          if (!rootRef.current?.contains(document.activeElement)) {
            closeMenu();
          }
        });
      }}
    >
      {name ? <input type="hidden" name={name} value={value} /> : null}

      <div className="ui-address-autocomplete__control">
        <input
          ref={inputRef}
          id={id}
          type="text"
          className={cn("ui-input", "ui-address-autocomplete__input", inputClassName)}
          value={query}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          aria-required={ariaRequired}
          aria-activedescendant={activeOption ? `${listboxId}-${flatOptions[highlightedIndex].optionId}` : undefined}
          placeholder={value ? placeholder : searchPlaceholder}
          disabled={disabled}
          required={required}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
            }
          }}
          onChange={(event) => {
            const nextValue = event.target.value;
            setQuery(nextValue);
            onValueChange?.(nextValue);
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              inputRef.current?.blur();
              closeMenu();
              return;
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();

              if (!isOpen) {
                setIsOpen(true);
                return;
              }

              setHighlightedIndex((currentIndex) => findNextIndex(flatOptions, currentIndex, 1));
              return;
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();

              if (!isOpen) {
                setIsOpen(true);
                return;
              }

              setHighlightedIndex((currentIndex) => findNextIndex(flatOptions, currentIndex, -1));
              return;
            }

            if (event.key === "Enter") {
              event.preventDefault();

              const exactMatch = flatOptions.find(({ option }) => matchesQuery(option, query))?.option;
              commitSelection(exactMatch ?? activeOption ?? null);
            }
          }}
        />

        <button
          type="button"
          className="ui-address-autocomplete__toggle"
          aria-label={isOpen ? "Скрыть адресные подсказки" : "Показать адресные подсказки"}
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
              closeMenu();
              return;
            }

            setIsOpen(true);
            inputRef.current?.focus();
          }}
        >
          <ChevronIcon />
        </button>
      </div>

      {isOpen ? (
        <div className={cn("ui-address-autocomplete__menu", menuClassName)} id={listboxId} role="listbox" aria-label="Список адресов">
          {status === "loading" ? <div className="ui-address-autocomplete__state">{loadingLabel}</div> : null}

          {status === "error" ? <div className="ui-address-autocomplete__state">{errorLabel}</div> : null}

          {status !== "loading" && status !== "error" && trimmedDeferredQuery.length < 2 ? (
            <div className="ui-address-autocomplete__state">{idleLabel}</div>
          ) : null}

          {optionGroups.length > 0 ? (
            optionGroups.map((group) => (
              <div key={group.id} className="ui-address-autocomplete__group" role="presentation">
                {group.title ? <div className="ui-address-autocomplete__group-title">{group.title}</div> : null}
                {group.options.map((option) => {
                  const flatIndex = flatOptions.findIndex((entry) => entry.groupId === group.id && entry.option === option);
                  const isHighlighted = flatIndex === highlightedIndex;
                  const isSelected = option.label === value;
                  const optionId = flatIndex >= 0 ? `${listboxId}-${flatOptions[flatIndex].optionId}` : `${listboxId}-${group.id}-${option.label}`;

                  return (
                    <button
                      key={optionId}
                      id={optionId}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={cn(
                        "ui-address-autocomplete__option",
                        isSelected && "is-selected",
                        isHighlighted && "is-highlighted",
                        optionClassName
                      )}
                      onMouseDown={(event) => {
                        event.preventDefault();
                      }}
                      onMouseEnter={() => {
                        if (flatIndex >= 0) {
                          setHighlightedIndex(flatIndex);
                        }
                      }}
                      onClick={() => {
                        commitSelection(option);
                      }}
                    >
                      <span className="ui-address-autocomplete__option-main">
                        <span className="ui-address-autocomplete__option-title">{option.label}</span>
                        <span className="ui-address-autocomplete__option-kind">{getKindLabel(option.kind)}</span>
                      </span>
                      {option.details ? <span className="ui-address-autocomplete__option-meta">{option.details}</span> : null}
                    </button>
                  );
                })}
              </div>
            ))
          ) : status === "ready" ? (
            <div className="ui-address-autocomplete__state">{emptyLabel}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
