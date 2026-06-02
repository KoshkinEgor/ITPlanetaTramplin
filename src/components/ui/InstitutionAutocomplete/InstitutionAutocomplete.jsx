import { useDeferredValue, useEffect, useId, useMemo, useRef, useState } from "react";
import { searchInstitutionOptions } from "../../../api/institutions";
import { cn } from "../../../lib/cn";
import { ChevronDownIcon } from "../../../shared/ui";

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

export function InstitutionAutocomplete({
  value = "",
  onValueChange,
  placeholder = "Выберите учебное заведение",
  searchPlaceholder = "Начните вводить название",
  loadingLabel = "Ищем учебные заведения…",
  emptyLabel = "Ничего не найдено",
  errorLabel = "Не удалось загрузить список.",
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
  const [options, setOptions] = useState([]);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!isOpen || disabled) {
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setStatus("loading");
        const results = await searchInstitutionOptions(deferredQuery, { limit: 10, signal: controller.signal });
        setOptions(results);
        setStatus("ready");
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }
        setOptions([]);
        setStatus("error");
      }
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [deferredQuery, disabled, isOpen]);

  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setHighlightedIndex(options.length ? 0 : -1);
  }, [isOpen, options]);

  const commitSelection = (optionValue) => {
    setQuery(optionValue);
    setIsOpen(false);
    onValueChange?.(optionValue);
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery(value);
  };

  const activeOption = highlightedIndex >= 0 ? options[highlightedIndex] : null;

  return (
    <div
      ref={rootRef}
      className={cn("ui-institution-autocomplete", isOpen && "is-open", disabled && "is-disabled", className)}
      onBlurCapture={() => {
        window.requestAnimationFrame(() => {
          if (!rootRef.current?.contains(document.activeElement)) {
            const currentValue = query.trim();
            setIsOpen(false);
            onValueChange?.(currentValue);
          }
        });
      }}
    >
      {name ? <input type="hidden" name={name} value={value} /> : null}

      <div className="ui-institution-autocomplete__control">
        <input
          ref={inputRef}
          id={id}
          type="text"
          className={cn("ui-input", "ui-institution-autocomplete__input", inputClassName)}
          value={query}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid}
          aria-required={ariaRequired}
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
              setHighlightedIndex((currentIndex) => findNextIndex(options, currentIndex, 1));
              return;
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              if (!isOpen) {
                setIsOpen(true);
                return;
              }
              setHighlightedIndex((currentIndex) => findNextIndex(options, currentIndex, -1));
              return;
            }

            if (event.key === "Enter") {
              event.preventDefault();
              if (activeOption) {
                commitSelection(activeOption.value);
              } else {
                commitSelection(query.trim());
              }
            }
          }}
        />

        <button
          type="button"
          className="ui-institution-autocomplete__toggle"
          aria-label={isOpen ? "Скрыть список" : "Показать список"}
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
        <div className={cn("ui-institution-autocomplete__menu", menuClassName)} id={listboxId} role="listbox" aria-label="Список учебных заведений">
          {status === "loading" && !options.length ? <div className="ui-institution-autocomplete__state">{loadingLabel}</div> : null}
          {status === "error" ? <div className="ui-institution-autocomplete__state">{errorLabel}</div> : null}

          {!options.length && status !== "loading" && status !== "error" ? (
            <div className="ui-institution-autocomplete__state">
              <span className="ui-institution-autocomplete__empty-text">{emptyLabel}</span>
              {query.trim() ? (
                <button
                  type="button"
                  className="ui-institution-autocomplete__create-btn"
                  onClick={() => commitSelection(query.trim())}
                >
                  Создать: "{query.trim()}"
                </button>
              ) : null}
            </div>
          ) : null}

          {options.length > 0 ? (
            <div className="ui-institution-autocomplete__options-list">
              {options.map((option, index) => {
                const isSelected = value.trim().toLowerCase() === option.value.trim().toLowerCase();
                const isHighlighted = highlightedIndex === index;

                return (
                  <button
                    key={option.value}
                    id={`${listboxId}-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      "ui-institution-autocomplete__option",
                      isSelected && "is-selected",
                      isHighlighted && "is-highlighted",
                      optionClassName
                    )}
                    onMouseDown={(event) => {
                      event.preventDefault();
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => commitSelection(option.value)}
                  >
                    <span className="ui-institution-autocomplete__option-title">{option.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
