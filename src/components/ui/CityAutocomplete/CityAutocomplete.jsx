import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import { searchCityOptions, mergeCityOptions, normalizeCityName } from "../../../api/cities";
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

export function CityAutocomplete({
  value = "",
  selectedOption = null,
  selectedOptionId,
  onValueChange,
  onSelectOption,
  fallbackOptions = [],
  placeholder = "Выберите город",
  searchPlaceholder = "Начните вводить город",
  loadingLabel = "Ищем города…",
  emptyLabel = "Ничего не найдено",
  errorLabel = "Не удалось загрузить города. Можно выбрать один из доступных вариантов.",
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
  const [remoteOptions, setRemoteOptions] = useState([]);
  const deferredQuery = useDeferredValue(query);
  const normalizedQuery = normalizeCityName(deferredQuery);
  const resolvedSelectedOptionId = selectedOptionId ?? selectedOption?.id ?? "";

  const localOptions = useMemo(
    () => mergeCityOptions(selectedOption ? [selectedOption] : value ? [{ name: value }] : [], fallbackOptions),
    [fallbackOptions, selectedOption, value]
  );

  const visibleOptions = useMemo(() => {
    if (!normalizedQuery) {
      return mergeCityOptions(remoteOptions, localOptions);
    }

    const filteredLocalOptions = localOptions.filter((option) => {
      const searchLabel = [option.name, option.admin1, option.country].filter(Boolean).join(" ");
      return normalizeCityName(searchLabel).includes(normalizedQuery);
    });

    return mergeCityOptions(remoteOptions, filteredLocalOptions);
  }, [localOptions, normalizedQuery, remoteOptions]);

  const [highlightedIndex, setHighlightedIndex] = useState(visibleOptions.length ? 0 : -1);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!isOpen || disabled) {
      return undefined;
    }

    if (!normalizedQuery) {
      setRemoteOptions([]);
      setStatus("idle");
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setStatus("loading");
        const options = await searchCityOptions(deferredQuery, { signal: controller.signal });
        setRemoteOptions(options);
        setStatus("ready");
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        setRemoteOptions([]);
        setStatus("error");
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [deferredQuery, disabled, isOpen, normalizedQuery]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const selectedIndex = visibleOptions.findIndex((option) =>
      resolvedSelectedOptionId ? option.id === resolvedSelectedOptionId : normalizeCityName(option.name) === normalizeCityName(value)
    );

    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : visibleOptions.length ? 0 : -1);
  }, [isOpen, resolvedSelectedOptionId, value, visibleOptions]);

  const commitSelection = (option) => {
    if (!option) {
      return;
    }

    setQuery(option.name);
    setIsOpen(false);
    onValueChange?.(option.name);
    onSelectOption?.(option);
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery(value);
  };

  const activeOption = highlightedIndex >= 0 ? visibleOptions[highlightedIndex] : null;

  return (
    <div
      ref={rootRef}
      className={cn("ui-city-autocomplete", isOpen && "is-open", disabled && "is-disabled", className)}
      onBlurCapture={() => {
        window.requestAnimationFrame(() => {
          if (!rootRef.current?.contains(document.activeElement)) {
            handleClose();
          }
        });
      }}
    >
      {name ? <input type="hidden" name={name} value={value} /> : null}

      <div className="ui-city-autocomplete__control">
        <input
          ref={inputRef}
          id={id}
          type="text"
          className={cn("ui-input", "ui-city-autocomplete__input", inputClassName)}
          value={query}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          aria-required={ariaRequired}
          aria-activedescendant={activeOption ? `${listboxId}-${activeOption.id}` : undefined}
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
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              inputRef.current?.blur();
              handleClose();
              return;
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();

              if (!isOpen) {
                setIsOpen(true);
                return;
              }

              setHighlightedIndex((currentIndex) => findNextIndex(visibleOptions, currentIndex, 1));
              return;
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();

              if (!isOpen) {
                setIsOpen(true);
                return;
              }

              setHighlightedIndex((currentIndex) => findNextIndex(visibleOptions, currentIndex, -1));
              return;
            }

            if (event.key === "Enter") {
              event.preventDefault();

              const normalizedEnteredValue = normalizeCityName(query);
              const highlightedMatch =
                activeOption && normalizeCityName(activeOption.name) === normalizedEnteredValue ? activeOption : null;
              const selectedMatch = visibleOptions.find((option) =>
                option.id === resolvedSelectedOptionId && normalizeCityName(option.name) === normalizedEnteredValue
              );
              const exactMatch = visibleOptions.find((option) => normalizeCityName(option.name) === normalizedEnteredValue);

              commitSelection(highlightedMatch ?? selectedMatch ?? exactMatch ?? activeOption ?? visibleOptions[0] ?? null);
            }
          }}
        />

        <button
          type="button"
          className="ui-city-autocomplete__toggle"
          aria-label={isOpen ? "Скрыть список городов" : "Показать список городов"}
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
          <ChevronIcon />
        </button>
      </div>

      {isOpen ? (
        <div className={cn("ui-city-autocomplete__menu", menuClassName)} id={listboxId} role="listbox" aria-label="Список городов">
          {status === "loading" ? <div className="ui-city-autocomplete__state">{loadingLabel}</div> : null}

          {status === "error" ? <div className="ui-city-autocomplete__state">{errorLabel}</div> : null}

          {visibleOptions.length > 0 ? (
            visibleOptions.map((option, index) => {
              const isSelected = resolvedSelectedOptionId
                ? option.id === resolvedSelectedOptionId
                : normalizeCityName(option.name) === normalizeCityName(value);
              const isHighlighted = index === highlightedIndex;

              return (
                <button
                  key={option.id}
                  id={`${listboxId}-${option.id}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "ui-city-autocomplete__option",
                    isSelected && "is-selected",
                    isHighlighted && "is-highlighted",
                    optionClassName
                  )}
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onMouseEnter={() => {
                    setHighlightedIndex(index);
                  }}
                  onClick={() => {
                    commitSelection(option);
                  }}
                >
                  <span className="ui-city-autocomplete__option-title">{option.name}</span>
                  {option.label && option.label !== option.name ? (
                    <span className="ui-city-autocomplete__option-meta">{option.label}</span>
                  ) : null}
                </button>
              );
            })
          ) : status !== "loading" ? (
            <div className="ui-city-autocomplete__state">{emptyLabel}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
