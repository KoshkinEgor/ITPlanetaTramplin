import { useState } from "react";
import { Button, Card, Checkbox, FormField, Input, Select } from "../ui";
import { cn } from "../../lib/cn";
import "./OpportunityFilterSidebar.css";

function MapTeaser() {
  return (
    <a href="/#discover" className="opportunity-filter-sidebar__teaser" aria-label="Открыть карту возможностей">
      <div className="opportunity-filter-sidebar__teaser-art" aria-hidden="true">
        <span className="opportunity-filter-sidebar__teaser-glow opportunity-filter-sidebar__teaser-glow--lime" />
        <span className="opportunity-filter-sidebar__teaser-glow opportunity-filter-sidebar__teaser-glow--blue" />
        <span className="opportunity-filter-sidebar__teaser-pin opportunity-filter-sidebar__teaser-pin--left" />
        <span className="opportunity-filter-sidebar__teaser-pin opportunity-filter-sidebar__teaser-pin--center" />
        <span className="opportunity-filter-sidebar__teaser-pin opportunity-filter-sidebar__teaser-pin--right" />
      </div>
      <Button as="span" variant="secondary" width="full" className="opportunity-filter-sidebar__teaser-action">
        Вакансии на карте
      </Button>
    </a>
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

export function OpportunityFilterSidebar({
  values,
  options,
  disabledSections = {},
  onChange,
  onResetSection,
  onResetAll,
  className,
  ...props
}) {
  const [collapsed, setCollapsed] = useState(false);
  const cityOptions = normalizeOptions(options?.cities);
  const specializationOptions = normalizeOptions(options?.specializations);
  const employmentOptions = normalizeOptions(options?.employmentTypes);
  const unsupportedHint = "Поле появится после подключения данных из backend.";

  const updateCheckboxGroup = (field, nextValue, checked) => {
    const currentValues = Array.isArray(values?.[field]) ? values[field] : [];
    const nextValues = checked ? [...currentValues, nextValue] : currentValues.filter((value) => value !== nextValue);
    onChange?.(field, nextValues);
  };

  return (
    <aside className={cn("opportunity-filter-sidebar", className)} {...props}>
      <Card className="opportunity-filter-sidebar__surface">
        <div className="opportunity-filter-sidebar__head">
          <div>
            <p className="opportunity-filter-sidebar__title">Фильтры</p>
            <p className="opportunity-filter-sidebar__subtitle">Используем только реальные поля каталога.</p>
          </div>
          <div className="opportunity-filter-sidebar__head-actions">
            <button type="button" className="opportunity-filter-sidebar__toggle" onClick={() => setCollapsed((current) => !current)}>
              {collapsed ? "Показать" : "Скрыть"}
            </button>
            <button type="button" className="opportunity-filter-sidebar__reset-all" onClick={onResetAll}>
              Сбросить все
            </button>
          </div>
        </div>

        <MapTeaser />

        <div className={cn("opportunity-filter-sidebar__content", collapsed && "is-collapsed")}>
          <div className="opportunity-filter-sidebar__section">
            <SectionHead title="Регион" onReset={() => onResetSection?.("city")} />
            <FormField label="Город">
              <Select
                value={values?.city ?? ""}
                onValueChange={(nextValue) => onChange?.("city", nextValue)}
                placeholder="Поиск региона"
                options={cityOptions}
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
      </Card>
    </aside>
  );
}
