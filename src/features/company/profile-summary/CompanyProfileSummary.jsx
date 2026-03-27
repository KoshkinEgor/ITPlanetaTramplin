import { Card, PlaceholderAction } from "../../../shared/ui";
import "./CompanyProfileSummary.css";

const LEGAL_PREFIXES = new Set(["ООО", "АО", "ПАО", "ОАО", "ЗАО", "ИП", "LLC", "INC", "LTD"]);

const SOCIAL_LABELS = {
  telegram: "TG",
  tg: "TG",
  vk: "VK",
  vkontakte: "VK",
  website: "SITE",
  site: "SITE",
  web: "SITE",
  behance: "BE",
  github: "GH",
  linkedin: "IN",
};

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
  return String(profile?.legalAddress ?? "").trim() || "Добавьте юридический адрес в профиле компании.";
}

function getInn(profile) {
  return String(profile?.inn ?? "").trim() || "Добавьте ИНН в данные компании.";
}

function getDescription(profile) {
  return String(profile?.description ?? "").trim() || "Краткое описание компании появится после заполнения основного профиля.";
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

function normalizeSocialUrl(rawUrl, type) {
  const value = String(rawUrl ?? "").trim();
  const normalizedType = String(type ?? "").trim().toLowerCase();

  if (!value) {
    return "";
  }

  if (/^[a-z]+:\/\//i.test(value) || value.startsWith("mailto:")) {
    return value;
  }

  if (normalizedType === "telegram" || normalizedType === "tg") {
    const handle = value.replace(/^@/, "").replace(/^https?:\/\/t\.me\//i, "").replace(/^t\.me\//i, "");
    return handle ? `https://t.me/${handle}` : "";
  }

  if (value.startsWith("www.")) {
    return `https://${value}`;
  }

  if (value.includes("@") && !value.includes("/")) {
    return `mailto:${value}`;
  }

  return `https://${value}`;
}

function getSocialLabel(item, index) {
  const type = String(item?.type ?? item?.kind ?? item?.name ?? "").trim().toLowerCase();
  const explicitLabel = String(item?.label ?? "").trim();

  if (type && SOCIAL_LABELS[type]) {
    return SOCIAL_LABELS[type];
  }

  if (explicitLabel) {
    return explicitLabel.slice(0, 4).toUpperCase();
  }

  const normalizedUrl = normalizeSocialUrl(item?.url ?? item?.href ?? item?.value ?? item?.link, type);

  if (!normalizedUrl) {
    return `#${index + 1}`;
  }

  try {
    const host = new URL(normalizedUrl).hostname.replace(/^www\./i, "");

    if (host.includes("t.me")) {
      return "TG";
    }

    if (host.includes("vk.")) {
      return "VK";
    }

    if (host.includes("github.")) {
      return "GH";
    }

    if (host.includes("behance.")) {
      return "BE";
    }

    return host.split(".")[0]?.slice(0, 4).toUpperCase() || `#${index + 1}`;
  } catch {
    return String(item?.url ?? item?.href ?? item?.value ?? item?.link ?? `#${index + 1}`)
      .replace(/^https?:\/\//i, "")
      .slice(0, 4)
      .toUpperCase();
  }
}

function createSocialLink(item, index) {
  if (typeof item === "string") {
    const href = normalizeSocialUrl(item, "");

    return href
      ? {
          id: `social-${index}-${href}`,
          href,
          label: getSocialLabel({ url: item }, index),
        }
      : null;
  }

  if (!item || typeof item !== "object") {
    return null;
  }

  const type = String(item.type ?? item.kind ?? item.name ?? "").trim().toLowerCase();
  const href = normalizeSocialUrl(item.url ?? item.href ?? item.value ?? item.link, type);

  if (!href) {
    return null;
  }

  return {
    id: `social-${index}-${type || "link"}-${href}`,
    href,
    label: getSocialLabel(item, index),
  };
}

function parseSocialLinks(rawValue) {
  if (!rawValue) {
    return [];
  }

  let parsedValue = rawValue;

  if (typeof rawValue === "string") {
    const trimmed = rawValue.trim();

    if (!trimmed) {
      return [];
    }

    try {
      parsedValue = JSON.parse(trimmed);
    } catch {
      parsedValue = trimmed
        .split(/\r?\n|,/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  if (Array.isArray(parsedValue)) {
    return parsedValue.map(createSocialLink).filter(Boolean);
  }

  if (parsedValue && typeof parsedValue === "object") {
    return Object.entries(parsedValue)
      .map(([type, url], index) => createSocialLink({ type, url }, index))
      .filter(Boolean);
  }

  return [];
}

export function CompanyProfileSummary({ profile, stats = [], verification, variant = "default" }) {
  const companyName = getCompanyName(profile);
  const description = getDescription(profile);
  const verificationTone = verification?.tone || "pending";
  const presenceBadge = getPresenceBadge(verificationTone);
  const socialLinks = parseSocialLinks(profile?.socials);

  return (
    <Card className={`company-profile-summary ${variant === "default" ? "company-profile-summary--default" : ""}`.trim()}>
      <div className="company-profile-summary__cover">
        <PlaceholderAction
          className="company-profile-summary__cover-action"
          label=""
          description="После загрузки здесь появится обложка компании."
        />
      </div>

      <div className="company-profile-summary__body">
        <div className="company-profile-summary__pills" aria-label="Статусы профиля компании">
          <span className="company-profile-summary__pill company-profile-summary__pill--accent">Личный кабинет компании</span>
          <span className={`company-profile-summary__pill company-profile-summary__pill--${presenceBadge.tone}`}>{presenceBadge.label}</span>
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
                <span className="company-profile-summary__fact-label">Наименование организации</span>
                <strong className="company-profile-summary__fact-value">{companyName}</strong>
              </article>

              <article className="company-profile-summary__fact">
                <span className="company-profile-summary__fact-label">ИНН компании</span>
                <strong className="company-profile-summary__fact-value">{getInn(profile)}</strong>
              </article>

              <article className="company-profile-summary__fact">
                <span className="company-profile-summary__fact-label">Юридический адрес</span>
                <strong className="company-profile-summary__fact-value">{getLegalAddress(profile)}</strong>
              </article>

              <article className="company-profile-summary__fact company-profile-summary__fact--socials">
                <span className="company-profile-summary__fact-label">Соцсети компании</span>
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
                  <span className="company-profile-summary__fact-note">Добавьте ссылки на сайт, Telegram или VK компании.</span>
                )}
              </article>
            </div>
          </div>
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
