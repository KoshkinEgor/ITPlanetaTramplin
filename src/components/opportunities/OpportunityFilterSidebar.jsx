import { useEffect, useRef } from "react";
import { Card, Checkbox, CityAutocomplete, FormField, Input, PillButton, Select } from "../ui";
import { cn } from "../../lib/cn";
import "./OpportunityFilterSidebar.css";

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 5 15 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15 5 5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

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
  const resolvedDisplayOptions = normalizeOptions(displayOptions);
  const unsupportedHint = "Поле появится после подключения данных из backend.";

  const updateCheckboxGroup = (field, nextValue, checked) => {
    const currentValues = Array.isArray(values?.[field]) ? values[field] : [];
    const nextValues = checked ? [...currentValues, nextValue] : currentValues.filter((value) => value !== nextValue);
    onChange?.(field, nextValues);
  };

  return (
    <div className="opportunity-filter-sidebar__content">
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
        <SectionHead title="Уровень дохода" onReset={() => onResetSection?.("income")} />
        <FormField label="От" hint={unsupportedHint}>
          <Input
            value={values?.incomeFrom ?? ""}
            onValueChange={(nextValue) => onChange?.("incomeFrom", nextValue)}
            placeholder="от"
            disabled={disabledSections.income}
          />
        </FormField>
        <FormField label="Период выплат">
          <Select
            value={values?.payoutPeriod ?? ""}
            onValueChange={(nextValue) => onChange?.("payoutPeriod", nextValue)}
            placeholder="Период выплат"
            options={[]}
            disabled={disabledSections.payout}
          />
        </FormField>
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

      <div className="opportunity-filter-sidebar__section">
        <SectionHead title="Образование" onReset={() => onResetSection?.("education")} />
        <p className="opportunity-filter-sidebar__hint">{unsupportedHint}</p>
        <div className="opportunity-filter-sidebar__checks">
          {["Не требуется или не указано", "Высшее", "Среднее профессиональное"].map((label) => (
            <Checkbox key={label} checked={false} disabled={disabledSections.education} label={label} />
          ))}
        </div>
      </div>
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
  subtitle = "Используем только реальные поля каталога.",
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
