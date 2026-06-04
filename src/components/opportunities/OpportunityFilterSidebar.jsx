import { useEffect, useRef } from "react";
import { Card, Checkbox, CityAutocomplete, FormField, Input, PillButton, Select } from "../ui";
import { cn } from "../../lib/cn";
import "./OpportunityFilterSidebar.css";
import { CloseIcon } from "../../shared/ui";

function SectionHead({ title, onReset }) {
  return (
    <div className="opportunity-filter-sidebar__section-head">
      <span>{title}</span>
      {onReset ? (
        <button type="button" onClick={onReset}>
          Сбросить
        </button>
      ) : null}
    </div>
  );
}

function normalizeOptions(options) {
  return Array.isArray(options) ? options : [];
}

function OpportunityFilterSidebarContent({
  values,
  options,
  displayOptions,
  displayValue,
  disabledSections,
  onDisplayChange,
  onResetDisplay,
  onChange,
  onResetSection,
}) {
  const specializationOptions = normalizeOptions(options?.specializations);
  const employmentOptions = normalizeOptions(options?.employmentTypes);
  const typeOptions = normalizeOptions(options?.types);
  const levelOptions = normalizeOptions(options?.levels);
  const scheduleOptions = normalizeOptions(options?.schedules);
  const extraOptions = normalizeOptions(options?.extras);
  const resolvedDisplayOptions = normalizeOptions(displayOptions);

  const updateCheckboxGroup = (field, nextValue, checked) => {
    const currentValues = Array.isArray(values?.[field]) ? values[field] : [];
    const nextValues = checked ? [...currentValues, nextValue] : currentValues.filter((value) => value !== nextValue);
    onChange?.(field, nextValues);
  };

  return (
    <div className="opportunity-filter-sidebar__content">
      {typeOptions.length ? (
        <div className="opportunity-filter-sidebar__section">
          <SectionHead title="Тип" onReset={() => onResetSection?.("activeType")} />
          <Select
            value={values?.activeType ?? "all"}
            onValueChange={(nextValue) => onChange?.("activeType", nextValue)}
            options={typeOptions}
          />
        </div>
      ) : null}

      <div className="opportunity-filter-sidebar__section">
        <SectionHead title="Регион" onReset={() => onResetSection?.("city")} />
        <FormField label="Город">
          <CityAutocomplete
            value={values?.city ?? ""}
            onValueChange={(nextValue) => onChange?.("city", nextValue)}
            placeholder="Поиск региона"
            fallbackOptions={options?.cities}
          />
        </FormField>
      </div>

      <div className="opportunity-filter-sidebar__section">
        <SectionHead title="Компания" onReset={() => onResetSection?.("company")} />
        <FormField label="Название">
          <Input
            value={values?.company ?? ""}
            onValueChange={(nextValue) => onChange?.("company", nextValue)}
            placeholder="Название компании"
          />
        </FormField>
      </div>

      <div className="opportunity-filter-sidebar__section">
        <SectionHead title="Уровень дохода" onReset={() => onResetSection?.("income")} />
        <div className="opportunity-filter-sidebar__grid">
          <FormField label="От">
            <Input
              value={values?.incomeFrom ?? ""}
              onValueChange={(nextValue) => onChange?.("incomeFrom", nextValue)}
              placeholder="от"
              inputMode="numeric"
              disabled={disabledSections.income}
            />
          </FormField>
          <FormField label="До">
            <Input
              value={values?.incomeTo ?? ""}
              onValueChange={(nextValue) => onChange?.("incomeTo", nextValue)}
              placeholder="до"
              inputMode="numeric"
              disabled={disabledSections.income}
            />
          </FormField>
        </div>
      </div>

      <div className="opportunity-filter-sidebar__section">
        <SectionHead title="Специализация" onReset={() => onResetSection?.("specialization")} />
        <FormField label="Направление">
          <Select
            value={values?.specialization ?? ""}
            onValueChange={(nextValue) => onChange?.("specialization", nextValue)}
            placeholder="Поиск специальности"
            options={specializationOptions}
          />
        </FormField>
      </div>

      <div className="opportunity-filter-sidebar__section">
        <SectionHead title="Формат работы" onReset={() => onResetSection?.("employmentTypes")} />
        <div className="opportunity-filter-sidebar__checks">
          {employmentOptions.map((option) => (
            <Checkbox
              key={option.value}
              checked={Array.isArray(values?.employmentTypes) ? values.employmentTypes.includes(option.value) : false}
              onChange={(event) => updateCheckboxGroup("employmentTypes", option.value, event.target.checked)}
              label={option.label}
            />
          ))}
        </div>
      </div>

      {levelOptions.length ? (
        <div className="opportunity-filter-sidebar__section">
          <SectionHead title="Опыт" onReset={() => onResetSection?.("level")} />
          <Select
            value={values?.level ?? "all"}
            onValueChange={(nextValue) => onChange?.("level", nextValue)}
            options={levelOptions}
          />
        </div>
      ) : null}

      {scheduleOptions.length ? (
        <div className="opportunity-filter-sidebar__section">
          <SectionHead title="График" onReset={() => onResetSection?.("schedule")} />
          <Select
            value={values?.schedule ?? "all"}
            onValueChange={(nextValue) => onChange?.("schedule", nextValue)}
            options={scheduleOptions}
          />
        </div>
      ) : null}

      {extraOptions.length ? (
        <div className="opportunity-filter-sidebar__section">
          <SectionHead title="Дополнительно" onReset={() => onResetSection?.("extras")} />
          <div className="opportunity-filter-sidebar__checks">
            {extraOptions.map((option) => (
              <Checkbox
                key={option.value}
                checked={Array.isArray(values?.extras) ? values.extras.includes(option.value) : false}
                onChange={(event) => updateCheckboxGroup("extras", option.value, event.target.checked)}
                label={option.label}
              />
            ))}
          </div>
        </div>
      ) : null}

      {resolvedDisplayOptions.length ? (
        <div className="opportunity-filter-sidebar__section">
          <SectionHead title="Отображение" onReset={onResetDisplay} />
          <div className="opportunity-filter-sidebar__pills">
            {resolvedDisplayOptions.map((option) => (
              <PillButton
                key={option.value}
                active={displayValue === option.value}
                onClick={() => onDisplayChange?.(option.value)}
              >
                {option.label}
              </PillButton>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function OpportunityFilterSidebar({
  mode = "static",
  open = true,
  onOpenChange,
  boundaryRef,
  values,
  options,
  displayOptions = [],
  displayValue = "all",
  disabledSections = {},
  drawerBackdrop = true,
  onDisplayChange,
  onResetDisplay,
  onChange,
  onResetSection,
  onResetAll,
  title = "Фильтры",
  subtitle = "Выберите параметры, которые важны для поиска.",
  headerActions = null,
  className,
  ...props
}) {
  const rootRef = useRef(null);
  const isStatic = mode === "static";
  const isDropdown = mode === "dropdown";
  const isDrawer = mode === "drawer";
  const isOpen = isStatic || open;

  useEffect(() => {
    if (!isOpen || isStatic) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange?.(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isStatic, onOpenChange]);

  useEffect(() => {
    if (!isOpen || !isDropdown) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      const boundaryElement = boundaryRef?.current ?? rootRef.current;

      if (boundaryElement && !boundaryElement.contains(event.target)) {
        onOpenChange?.(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [boundaryRef, isDropdown, isOpen, onOpenChange]);

  if (!isOpen) {
    return null;
  }

  const surface = (
    <Card className="opportunity-filter-sidebar__surface">
      <div className="opportunity-filter-sidebar__head">
        <div>
          <p className="opportunity-filter-sidebar__title">{title}</p>
          <p className="opportunity-filter-sidebar__subtitle">{subtitle}</p>
        </div>
        <div className="opportunity-filter-sidebar__head-actions">
          {headerActions}
          <button type="button" className="opportunity-filter-sidebar__reset-all" onClick={onResetAll}>
            Сбросить все
          </button>
          {!isStatic ? (
            <button
              type="button"
              className="opportunity-filter-sidebar__close"
              onClick={() => onOpenChange?.(false)}
              aria-label="Закрыть фильтры"
            >
              <CloseIcon />
            </button>
          ) : null}
        </div>
      </div>

      <OpportunityFilterSidebarContent
        values={values}
        options={options}
        displayOptions={displayOptions}
        displayValue={displayValue}
        disabledSections={disabledSections}
        onDisplayChange={onDisplayChange}
        onResetDisplay={onResetDisplay}
        onChange={onChange}
        onResetSection={onResetSection}
      />
    </Card>
  );

  if (isDrawer) {
    return (
      <div className="opportunity-filter-sidebar__drawer-shell">
        {drawerBackdrop ? (
          <button
            type="button"
            className="opportunity-filter-sidebar__drawer-backdrop"
            aria-label="Закрыть фильтры"
            onClick={() => onOpenChange?.(false)}
          />
        ) : null}
        <aside
          ref={rootRef}
          className={cn("opportunity-filter-sidebar", "opportunity-filter-sidebar--drawer", className)}
          aria-label={title}
          {...props}
        >
          {surface}
        </aside>
      </div>
    );
  }

  if (isDropdown) {
    return (
      <div
        ref={rootRef}
        className={cn("opportunity-filter-sidebar", "opportunity-filter-sidebar--dropdown", className)}
        {...props}
      >
        {surface}
      </div>
    );
  }

  return (
    <aside
      ref={rootRef}
      className={cn("opportunity-filter-sidebar", "opportunity-filter-sidebar--static", className)}
      {...props}
    >
      {surface}
    </aside>
  );
}
