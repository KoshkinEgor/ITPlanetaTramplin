import { Card, StatusBadge, Tag } from "../../../shared/ui";
import "./ModeratorProfileSummary.css";

export function ModeratorProfileSummary({
  summary,
  metrics = [],
}) {
  return (
    <Card className="moderator-profile-summary">
      <div className="moderator-profile-summary__copy">
        <div className="moderator-profile-summary__badges">
          <Tag tone="accent">{summary?.eyebrow || "Кабинет модератора"}</Tag>
          <StatusBadge statusKey="approved">{summary?.status || "Активная смена"}</StatusBadge>
        </div>

        <h1 className="ui-type-h2 moderator-profile-summary__title">{summary?.title || "Модерация платформы"}</h1>
        <p className="ui-type-body moderator-profile-summary__description">
          {summary?.description || "Краткая сводка кабинета, которая остается на месте при переключении разделов."}
        </p>
      </div>

      <div className="moderator-profile-summary__metrics">
        {metrics.map((item) => (
          <div key={item.label} className="moderator-profile-summary__metric">
            <strong>{item.value}</strong>
            <span>{item.label}</span>
            <p>{item.note}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
