import { routes } from "../../../app/routes";
import { AppLink } from "../../../app/AppLink";
import { parseSocialLinks } from "../socialLinks";
import { Card } from "../../../shared/ui";
import "./CompanyProfileSummary.css";

const LEGAL_PREFIXES = new Set(["ООО", "АО", "ПАО", "ОАО", "ЗАО", "ИП", "LLC", "INC", "LTD"]);

function getCompanyName(profile) {
  return String(profile?.companyName ?? "").trim() || "Компания";
}

function getCompanyInitial(profile) {
  const companyName = getCompanyName(profile);
  const parts = companyName
    .split(/\s+/)
    .map((item) => item.replace(/[«»"'()]/g, "").trim())
    .filter(Boolean);
  const meaningfulParts = parts.filter((item) => !LEGAL_PREFIXES.has(item.toUpperCase()));
  const source = meaningfulParts[0] || parts[0] || "К";

  return source[0]?.toUpperCase() ?? "К";
}

function getLegalAddress(profile) {
  return String(profile?.legalAddress ?? "").trim() || "Юридический адрес пока не указан.";
}

function getInn(profile) {
  return String(profile?.inn ?? "").trim() || "ИНН пока не указан.";
}

function getDescription(profile) {
  return String(profile?.description ?? "").trim() || "Краткое описание компании появится после заполнения профиля.";
}

function getPresenceBadge(status) {
  switch (status) {
    case "approved":
      return { label: "Онлайн", tone: "success" };
    case "revision":
      return { label: "На доработке", tone: "warning" };
    case "rejected":
      return { label: "Ограничен", tone: "danger" };
    default:
      return { label: "На проверке", tone: "neutral" };
  }
}

function getVerificationPanelTone(status) {
  switch (status) {
    case "approved":
      return "success";
    case "revision":
      return "warning";
    case "rejected":
      return "danger";
    default:
      return "status";
  }
}

export function CompanyProfileSummary({ profile, stats = [], verification, variant = "default", mode = "cabinet" }) {
  const companyName = getCompanyName(profile);
  const description = getDescription(profile);
  const verificationTone = verification?.tone || "pending";
  const presenceBadge = getPresenceBadge(verificationTone);
  const verificationPanelTone = getVerificationPanelTone(verificationTone);
  const socialLinks = parseSocialLinks(profile?.socials);
  const isPublicMode = mode === "public";
  const verificationStatusText = String(verification?.statusText ?? "").trim() || presenceBadge.label;
  const verificationNote = String(verification?.note ?? "").trim();
  const verificationActionLabel = String(verification?.actionLabel ?? "").trim() || "Редактировать";

  return (
    <Card className={`company-profile-summary ${variant === "default" ? "company-profile-summary--default" : ""}`.trim()}>
      <div className="company-profile-summary__body">
        <div className="company-profile-summary__pills" aria-label="Статусы профиля компании">
          <span className="company-profile-summary__pill company-profile-summary__pill--accent">
            {isPublicMode ? "Компания" : "Кабинет компании"}
          </span>
          <span className={`company-profile-summary__pill company-profile-summary__pill--${presenceBadge.tone}`}>
            {presenceBadge.label}
          </span>
        </div>

        <div className="company-profile-summary__layout">
          <div className="company-profile-summary__main">
            <div className="company-profile-summary__hero">
              <div className="company-profile-summary__avatar" aria-hidden={profile?.profileImage ? undefined : "true"}>
                {profile?.profileImage ? (
                  <img src={profile.profileImage} alt={companyName} className="company-profile-summary__avatar-image" />
                ) : (
                  <div className="company-profile-summary__avatar-tile">
                    <span>{getCompanyInitial(profile)}</span>
                  </div>
                )}
              </div>

              <div className="company-profile-summary__copy">
                <h1 className="company-profile-summary__title">{companyName}</h1>
                <p className="company-profile-summary__description">{description}</p>
              </div>
            </div>

            <div className="company-profile-summary__facts">
              <article className="company-profile-summary__fact">
                <span className="company-profile-summary__fact-label">Компания</span>
                <strong className="company-profile-summary__fact-value">{companyName}</strong>
              </article>

              <article className="company-profile-summary__fact">
                <span className="company-profile-summary__fact-label">ИНН</span>
                <strong className="company-profile-summary__fact-value">{getInn(profile)}</strong>
              </article>

              <article className="company-profile-summary__fact">
                <span className="company-profile-summary__fact-label">Юр. адрес</span>
                <strong className="company-profile-summary__fact-value">{getLegalAddress(profile)}</strong>
              </article>

              <article className="company-profile-summary__fact company-profile-summary__fact--socials">
                <span className="company-profile-summary__fact-label">Ссылки</span>
                {socialLinks.length ? (
                  <div className="company-profile-summary__socials">
                    {socialLinks.map((item) => (
                      <a
                        key={item.id}
                        className="company-profile-summary__social-link"
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={item.label}
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                ) : (
                  <span className="company-profile-summary__fact-note">Ссылки пока не добавлены.</span>
                )}
              </article>
            </div>
          </div>

          {verification ? (
            <aside className="company-profile-summary__aside">
              <div className={`company-profile-summary__panel company-profile-summary__panel--${verificationPanelTone}`.trim()}>
                <span className="company-profile-summary__panel-label">{verification.label || "Статус профиля"}</span>
                <strong className="company-profile-summary__panel-value">{verificationStatusText}</strong>
                {verificationNote ? <p>{verificationNote}</p> : null}
                {!isPublicMode ? (
                  <AppLink className="company-profile-summary__panel-link" href={routes.company.dashboard}>
                    {verificationActionLabel}
                  </AppLink>
                ) : null}
              </div>
            </aside>
          ) : null}
        </div>

        {stats.length ? (
          <div className="company-profile-summary__stats">
            {stats.map((item) => (
              <div key={item.label} className="company-profile-summary__stat">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
