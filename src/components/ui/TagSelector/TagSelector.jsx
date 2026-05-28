import { useEffect, useMemo, useState } from "react";
import { cn } from "../../../lib/cn";
import { Button } from "../Button/Button";
import { Card } from "../Card/Card";
import { SearchInput } from "../SearchInput/SearchInput";
import { Tag } from "../Tag/Tag";
import { getFontWeightClassName, getWidthClassName } from "../sharedProps";
import { CloseIcon } from "../../../shared/ui";

function RemovableChip({ label, onRemove }) {
  return (
    <span className="ui-tag-selector__chip ui-tag-selector__chip--removable">
      <span>{label}</span>
      <button type="button" className="ui-tag-selector__chip-remove" aria-label={`Удалить ${label}`} onClick={onRemove}>
        <CloseIcon />
      </button>
    </span>
  );
}

function SuggestionChip({ label, disabled, onClick }) {
  return (
    <button
      type="button"
      className={cn("ui-tag-selector__chip", disabled && "is-disabled")}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onClick}
    >
      {label}
    </button>
  );
}

export function TagSelector({
  value = [],
  suggestions = [],
  title,
  suggestionsLabel = "Рекомендованные теги",
  searchPlaceholder = "Поиск тегов",
  editLabel = "Редактировать",
  saveLabel = "Сохранить",
  cancelLabel = "Отмена",
  emptyLabel = "Пока ничего не добавлено",
  clearLabel = "Очистить поиск",
  fontWeight,
  width,
  className,
  onSave,
  loadSuggestions,
  allowCustomTags = true,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState(value);
  const [dynamicSuggestions, setDynamicSuggestions] = useState(suggestions);
  const [loading, setLoading] = useState(false);
  const sharedClassName = cn(getFontWeightClassName(fontWeight), getWidthClassName(width));

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (!isEditing) {
      setQuery("");
      return;
    }

    if (!loadSuggestions) {
      setDynamicSuggestions(suggestions);
      return;
    }

    let active = true;
    setLoading(true);

    const fetchSuggestions = async () => {
      try {
        const results = await loadSuggestions(query);
        if (active) {
          setDynamicSuggestions(results);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, isEditing, loadSuggestions, suggestions]);

  const visibleSuggestions = useMemo(() => {
    if (loadSuggestions) {
      return dynamicSuggestions;
    }
    const normalized = query.trim().toLowerCase();
    return suggestions.filter((item) => !normalized || item.toLowerCase().includes(normalized));
  }, [query, suggestions, dynamicSuggestions, loadSuggestions]);

  const canCreateTag = allowCustomTags && query.trim() && !draft.some((item) => item.toLowerCase() === query.trim().toLowerCase());

  const handleCancel = () => {
    setDraft(value);
    setQuery("");
    setIsEditing(false);
  };

  const handleSave = () => {
    onSave?.(draft);
    setQuery("");
    setIsEditing(false);
  };

  return (
    <Card className={cn("ui-tag-selector", sharedClassName, className)}>
      {isEditing ? (
        <>
          {title ? (
            <div className="ui-tag-selector__head">
              <h3 className="ui-type-h2">{title}</h3>
            </div>
          ) : null}

          <div className="ui-tag-selector__selected">
            {draft.length ? (
              draft.map((item) => (
                <RemovableChip
                  key={item}
                  label={item}
                  onRemove={() => setDraft((current) => current.filter((chip) => chip !== item))}
                />
              ))
            ) : (
              <span className="ui-tag-selector__empty">{emptyLabel}</span>
            )}
          </div>

          <SearchInput
            value={query}
            onValueChange={setQuery}
            placeholder={searchPlaceholder}
            className="ui-tag-selector__search"
            clearLabel={clearLabel}
          />

          <div className="ui-tag-selector__recommendations">
            <div className="ui-tag-selector__subtitle">{suggestionsLabel}</div>
            <div className="ui-tag-selector__list">
              {canCreateTag ? (
                <SuggestionChip
                  label={`Добавить «${query.trim()}»`}
                  onClick={() => {
                    setDraft((current) => [...current, query.trim()]);
                    setQuery("");
                  }}
                />
              ) : null}
              {visibleSuggestions.map((item) => (
                <SuggestionChip
                  key={item}
                  label={item}
                  disabled={draft.includes(item)}
                  onClick={() => setDraft((current) => [...current, item])}
                />
              ))}
            </div>
          </div>

          <div className="ui-tag-selector__actions">
            <Button variant="secondary" onClick={handleCancel}>
              {cancelLabel}
            </Button>
            <Button onClick={handleSave}>{saveLabel}</Button>
          </div>
        </>
      ) : (
        <>
          <div className="ui-tag-selector__display">
            {value.length ? (
              value.map((item) => <Tag key={item}>{item}</Tag>)
            ) : (
              <span className="ui-tag-selector__empty">{emptyLabel}</span>
            )}
          </div>
          <div className="ui-tag-selector__display-actions">
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              {editLabel}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
