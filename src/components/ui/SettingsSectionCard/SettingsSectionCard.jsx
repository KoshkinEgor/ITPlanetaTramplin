import { cn } from "../../../lib/cn";
import { Card } from "../Card/Card";
import { Tag } from "../Tag/Tag";

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="m4 7 6 6 6-6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const statusToneClassMap = {
  success: "is-success",
  warning: "is-warning",
  neutral: "is-neutral",
};

export function SettingsSectionCard({
  id,
  eyebrow,
  title,
  summary,
  status,
  statusTone = "neutral",
  isOpen = false,
  onToggle,
  className,
  children,
}) {
  const contentId = id ? `${id}-content` : undefined;
  const hasEyebrow = Boolean(eyebrow);

  return (
    <Card className={cn("ui-settings-section", isOpen && "is-open", className)}>
      <div className={cn("ui-settings-section__head", !hasEyebrow && "is-title-only")}>
        {hasEyebrow ? <Tag className="ui-settings-section__eyebrow">{eyebrow}</Tag> : null}
        <button
          type="button"
          className="ui-settings-section__toggle"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={contentId}
        >
          <span className="ui-settings-section__title">
            <h3 className="ui-type-h2">{title}</h3>
            <span className="ui-settings-section__chevron" aria-hidden="true">
              <ChevronDownIcon />
            </span>
          </span>
        </button>
      </div>

      <div className="ui-settings-section__collapsed" hidden={isOpen}>
        <div className="ui-settings-section__body">
          {status ? (
            <span className={cn("ui-settings-section__status", statusToneClassMap[statusTone])}>
              {status}
            </span>
          ) : null}
          {summary ? <p className="ui-settings-section__summary">{summary}</p> : null}
        </div>
      </div>

      <div id={contentId} className="ui-settings-section__expanded" hidden={!isOpen} aria-hidden={!isOpen}>
        {children}
      </div>
    </Card>
  );
}
