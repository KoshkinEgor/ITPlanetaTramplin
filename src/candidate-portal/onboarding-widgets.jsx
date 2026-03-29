import { useEffect, useMemo, useState } from "react";
import { searchProfessionOptions } from "../api/professions";
import { Button, Checkbox, FormField, Input, Modal, SearchInput, Textarea } from "../shared/ui";
import { cn } from "../shared/lib/cn";
import { createEmptyCandidateExperienceDraft } from "./onboarding";
import "./onboarding-widgets.css";

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 4 12 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 4 4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function dedupeProfessionOptions(options = []) {
  const uniqueOptions = new Map();

  (Array.isArray(options) ? options : []).forEach((option) => {
    const value = String(option?.value ?? option?.label ?? "").trim();
    const label = String(option?.label ?? value).trim();

    if (!value || !label || uniqueOptions.has(value)) {
      return;
    }

    uniqueOptions.set(value, { value, label });
  });

  return [...uniqueOptions.values()];
}

export function CandidateProfessionSelector({
  profession = "",
  additionalProfessions = [],
  onProfessionChange,
  onAdditionalProfessionsChange,
  title,
  description,
  className,
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle");
  const [options, setOptions] = useState([]);
  const selectedProfessions = useMemo(
    () => dedupeProfessionOptions([
      profession ? { value: profession, label: profession } : null,
      ...additionalProfessions.map((item) => ({ value: item, label: item })),
      ...options,
    ]),
    [additionalProfessions, options, profession]
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setStatus("loading");
        const nextOptions = await searchProfessionOptions(query, { signal: controller.signal });
        setOptions(dedupeProfessionOptions(nextOptions));
        setStatus("ready");
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        setStatus("error");
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const visiblePrimaryOptions = useMemo(() => {
    if (query.trim()) {
      return selectedProfessions;
    }

    return dedupeProfessionOptions([
      profession ? { value: profession, label: profession } : null,
      ...options,
    ]);
  }, [options, profession, query, selectedProfessions]);

  const visibleAdditionalOptions = useMemo(
    () => visiblePrimaryOptions.filter((option) => option.value !== profession && !additionalProfessions.includes(option.value)),
    [additionalProfessions, profession, visiblePrimaryOptions]
  );

  function handleAdditionalAdd(value) {
    const nextValues = Array.from(new Set([...additionalProfessions, value])).filter((item) => item !== profession);
    onAdditionalProfessionsChange?.(nextValues);
  }

  function handleAdditionalRemove(value) {
    onAdditionalProfessionsChange?.(additionalProfessions.filter((item) => item !== value));
  }

  return (
    <div className={cn("candidate-onboarding-profession", className)}>
      {title || description ? (
        <div className="candidate-onboarding-profession__group">
          {title ? <h3>{title}</h3> : null}
          {description ? <p>{description}</p> : null}
        </div>
      ) : null}

      <SearchInput
        value={query}
        onValueChange={setQuery}
        placeholder="Поиск профессии"
        clearLabel="Очистить поиск профессии"
        width="full"
      />

      {status === "error" ? (
        <p className="candidate-onboarding-profession__status">
          Не удалось загрузить каталог профессий. Попробуйте ещё раз чуть позже.
        </p>
      ) : null}

      <div className="candidate-onboarding-profession__group">
        <h3>Основная профессия</h3>
        <div className="candidate-onboarding-profession__options" role="radiogroup" aria-label="Основная профессия">
          {visiblePrimaryOptions.map((option) => {
            const isSelected = option.value === profession;

            return (
              <button
                key={`primary-${option.value}`}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={cn("candidate-onboarding-profession__option", isSelected && "is-selected")}
                onClick={() => {
                  onProfessionChange?.(option.value);
                  if (additionalProfessions.includes(option.value)) {
                    onAdditionalProfessionsChange?.(additionalProfessions.filter((item) => item !== option.value));
                  }
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="candidate-onboarding-profession__group">
        <h3>Дополнительные направления</h3>
        <div className="candidate-onboarding-profession__selected">
          {additionalProfessions.length ? additionalProfessions.map((item) => (
            <span key={`selected-${item}`} className="candidate-onboarding-profession__tag">
              <span>{item}</span>
              <button type="button" aria-label={`Удалить ${item}`} onClick={() => handleAdditionalRemove(item)}>
                <CloseIcon />
              </button>
            </span>
          )) : <span className="candidate-onboarding-profession__empty">Можно выбрать несколько смежных направлений.</span>}
        </div>

        <div className="candidate-onboarding-profession__options">
          {visibleAdditionalOptions.map((option) => (
            <button
              key={`additional-${option.value}`}
              type="button"
              className="candidate-onboarding-profession__option"
              onClick={() => handleAdditionalAdd(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CandidateExperienceListEditor({
  experiences = [createEmptyCandidateExperienceDraft()],
  noExperience = false,
  onNoExperienceChange,
  onExperienceChange,
  onExperienceAdd,
  onExperienceRemove,
}) {
  const normalizedExperiences = Array.isArray(experiences) && experiences.length
    ? experiences
    : [createEmptyCandidateExperienceDraft()];

  return (
    <div className="candidate-onboarding-experience">
      <div className="candidate-onboarding-experience__header">
        <h3>Опыт работы</h3>
        <p>Можно добавить несколько мест работы, стажировок или проектных ролей.</p>
      </div>

      <Checkbox checked={noExperience} onChange={(event) => onNoExperienceChange?.(event.target.checked)}>
        <>
          <span className="ui-check__label">Пока нет опыта работы</span>
          <span className="ui-check__hint">В этом случае профиль будет использоваться для стажировок, junior-позиций и карьерных рекомендаций.</span>
        </>
      </Checkbox>

      {!noExperience ? (
        <div className="candidate-onboarding-experience__list">
          {normalizedExperiences.map((item, index) => (
            <div key={item.draftKey} className="candidate-onboarding-experience__card">
              <div className="candidate-onboarding-experience__card-head">
                <div className="candidate-onboarding-experience__header">
                  <h3>Место работы {index + 1}</h3>
                  {item.legacyPeriod && !item.startMonth ? (
                    <p className="candidate-onboarding-experience__legacy">
                      Ранее был указан период: {item.legacyPeriod}. При желании обновите его до формата месяц/год.
                    </p>
                  ) : null}
                </div>

                {normalizedExperiences.length > 1 ? (
                  <Button type="button" variant="ghost" onClick={() => onExperienceRemove?.(item.draftKey)}>
                    Удалить
                  </Button>
                ) : null}
              </div>

              <div className="candidate-onboarding-experience__grid candidate-onboarding-experience__grid--two">
                <FormField label="Компания" required>
                  <Input value={item.company} onValueChange={(value) => onExperienceChange?.(item.draftKey, "company", value)} placeholder="IT-Планета" />
                </FormField>
                <FormField label="Должность" required>
                  <Input value={item.role} onValueChange={(value) => onExperienceChange?.(item.draftKey, "role", value)} placeholder="Frontend-разработчик" />
                </FormField>
              </div>

              <div className="candidate-onboarding-experience__grid candidate-onboarding-experience__grid--two">
                <FormField label="Начало работы" required>
                  <Input type="month" value={item.startMonth} onValueChange={(value) => onExperienceChange?.(item.draftKey, "startMonth", value)} />
                </FormField>
                <FormField label="Окончание работы" required={!item.isCurrent}>
                  <Input
                    type="month"
                    value={item.endMonth}
                    disabled={item.isCurrent}
                    onValueChange={(value) => onExperienceChange?.(item.draftKey, "endMonth", value)}
                  />
                </FormField>
              </div>

              <Checkbox checked={item.isCurrent} onChange={(event) => onExperienceChange?.(item.draftKey, "isCurrent", event.target.checked)}>
                <>
                  <span className="ui-check__label">Работаю здесь сейчас</span>
                  <span className="ui-check__hint">Если включено, дату окончания можно не указывать.</span>
                </>
              </Checkbox>

              <FormField label="Чем занимались" required>
                <Textarea
                  value={item.summary}
                  onValueChange={(value) => onExperienceChange?.(item.draftKey, "summary", value)}
                  rows={4}
                  autoResize
                  placeholder="Кратко опишите задачи, зону ответственности и результат."
                />
              </FormField>
            </div>
          ))}

          <div className="candidate-onboarding-experience__footer">
            <Button type="button" variant="secondary" onClick={() => onExperienceAdd?.()}>
              Добавить место работы
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CandidateProfileGateModal({
  open = false,
  completion = 0,
  onClose,
  onContinue,
  title = "Профиль ещё не заполнен",
  description = "Карьера и отклики доступны только после заполнения обязательных полей профиля кандидата.",
  continueLabel = "Вернуться к заполнению",
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="md"
      tone="warning"
      showIcon
      actions={(
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Позже
          </Button>
          <Button type="button" onClick={onContinue}>
            {continueLabel}
          </Button>
        </>
      )}
    >
      <div className="candidate-onboarding-gate">
        <div className="candidate-onboarding-gate__meter">
          <strong>{completion}%</strong>
          <div className="candidate-onboarding-gate__bar" aria-hidden="true">
            <span style={{ width: `${Math.min(Math.max(completion, 0), 100)}%` }} />
          </div>
        </div>
        <p className="candidate-onboarding-experience__legacy">
          После заполнения обязательного минимума откроются персональные рекомендации в разделе «Карьера» и отправка откликов на возможности.
        </p>
      </div>
    </Modal>
  );
}
