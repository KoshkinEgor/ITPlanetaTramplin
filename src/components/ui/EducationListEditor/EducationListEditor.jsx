import { cn } from "../../../lib/cn";
import { Button } from "../Button/Button";
import { FormField } from "../FormField/FormField";
import { Input } from "../Input/Input";

function defaultItemLabel(index) {
  return index === 0 ? "Основное образование" : `Дополнительное образование ${index}`;
}

export function EducationListEditor({
  items = [],
  errorsByKey = {},
  onItemChange,
  onAddItem,
  onRemoveItem,
  addLabel = "Добавить еще образование",
  getItemLabel = defaultItemLabel,
  graduationHint = "Если еще учитесь, укажите предполагаемый год окончания.",
  className,
}) {
  return (
    <div className={cn("ui-education-editor", className)}>
      <div className="ui-education-editor__list">
        {items.map((item, index) => {
          const itemErrors = errorsByKey[item.draftKey] ?? {};

          return (
            <div key={item.draftKey} className="ui-education-editor__item">
              <div className="ui-education-editor__item-head">
                <div className="ui-education-editor__item-title">{getItemLabel(index, item)}</div>
                {items.length > 1 ? (
                  <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveItem?.(item.draftKey)}>
                    Удалить
                  </Button>
                ) : null}
              </div>

              <div className="ui-education-editor__grid">
                <FormField label="Учебное заведение" required={index === 0} error={itemErrors.institutionName}>
                  <Input
                    value={item.institutionName}
                    onValueChange={(value) => onItemChange?.(item.draftKey, "institutionName", value)}
                    placeholder="ЧГУ им. И. Н. Ульянова"
                  />
                </FormField>
              </div>

              <div className="ui-education-editor__grid ui-education-editor__grid--two">
                <FormField label="Факультет">
                  <Input
                    value={item.faculty}
                    onValueChange={(value) => onItemChange?.(item.draftKey, "faculty", value)}
                    placeholder="Информатика"
                  />
                </FormField>
                <FormField label="Специализация">
                  <Input
                    value={item.specialization}
                    onValueChange={(value) => onItemChange?.(item.draftKey, "specialization", value)}
                    placeholder="Дизайн интерфейсов"
                  />
                </FormField>
              </div>

              <div className="ui-education-editor__grid ui-education-editor__grid--graduation">
                <FormField label="Год окончания" error={itemErrors.graduationYear}>
                  <Input
                    value={item.graduationYear}
                    onValueChange={(value) => onItemChange?.(item.draftKey, "graduationYear", value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="2027"
                  />
                </FormField>
                <p className="ui-education-editor__hint">{graduationHint}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="ui-education-editor__actions">
        <Button type="button" variant="secondary" onClick={onAddItem} className="ui-education-editor__add">
          {addLabel}
        </Button>
      </div>
    </div>
  );
}
