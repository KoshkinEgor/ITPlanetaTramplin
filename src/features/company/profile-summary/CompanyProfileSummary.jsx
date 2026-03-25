import { Avatar, Card, PlaceholderAction, StatusBadge, Tag } from "../../../shared/ui";
import "./CompanyProfileSummary.css";

function getCompanyInitials(profile) {
  const source = profile?.companyName || "К";

  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "К";
}

export function CompanyProfileSummary({
  profile,
  stats = [],
  verification,
  variant = "default",
}) {
  const description = profile?.description?.trim() || "Краткое описание компании появится после заполнения основного контента.";
  const verificationLabel = verification?.label || "На проверке";
  const verificationTone = verification?.tone || "pending";

  return (
    <Card className={`company-profile-summary ${variant === "default" ? "company-profile-summary--default" : ""}`.trim()}>
      <div className="company-profile-summary__cover">
        <PlaceholderAction
          className="company-profile-summary__cover-action"
          label="Слот шапки компании"
          description="Общий uploader/cover control появится здесь."
        />
      </div>

      <div className="company-profile-summary__body">
        <div className="company-profile-summary__identity">
          <Avatar initials={getCompanyInitials(profile)} size="xl" shape="rounded" tone="neutral" className="company-profile-summary__avatar" />

          <div className="company-profile-summary__copy">
            <div className="company-profile-summary__badges">
              <Tag tone="accent">Кабинет компании</Tag>
              <StatusBadge statusKey={verificationTone}>{verificationLabel}</StatusBadge>
            </div>

            <h1 className="ui-type-h1 company-profile-summary__title">{profile?.companyName || "Кабинет компании"}</h1>
            <p className="ui-type-body company-profile-summary__description">{description}</p>

            <dl className="company-profile-summary__facts">
              <div>
                <dt>Юридический адрес</dt>
                <dd>{profile?.legalAddress || "Будет заполнен в разделе компании."}</dd>
              </div>
              <div>
                <dt>Соцсети и ссылки</dt>
                <dd>{profile?.socials || "Подключаются через раздел компании."}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="company-profile-summary__aside">
          <div className="company-profile-summary__panel">
            <span className="company-profile-summary__panel-label">Статус профиля</span>
            <strong>{verification?.statusText || "Готов к заполнению"}</strong>
            <p>{verification?.note || "Контент и media-блоки управляются из отдельных cabinet sections."}</p>
          </div>

          <div className="company-profile-summary__stats">
            {stats.map((item) => (
              <div key={item.label} className="company-profile-summary__stat">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
