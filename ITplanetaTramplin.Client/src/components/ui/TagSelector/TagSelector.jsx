import { useEffect, useMemo, useState } from "react";
import { cn } from "../../../lib/cn";
import { Button } from "../Button/Button";
import { Card } from "../Card/Card";
import { SearchInput } from "../SearchInput/SearchInput";
import { Tag } from "../Tag/Tag";

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 4 12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 4 4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

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
  className,
  onSave,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const visibleSuggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return suggestions.filter((item) => (
      !normalized || item.toLowerCase().includes(normalized)
    ));
  }, [query, suggestions]);

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
    <Card className={cn("ui-tag-selector", className)}>
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
