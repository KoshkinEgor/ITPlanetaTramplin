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

export function normalizeSocialLinkType(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function normalizeSocialUrl(rawUrl, type) {
  const value = String(rawUrl ?? "").trim();
  const normalizedType = normalizeSocialLinkType(type);

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
  const type = normalizeSocialLinkType(item?.type ?? item?.kind ?? item?.name);
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
          type: "",
        }
      : null;
  }

  if (!item || typeof item !== "object") {
    return null;
  }

  const type = normalizeSocialLinkType(item.type ?? item.kind ?? item.name);
  const href = normalizeSocialUrl(item.url ?? item.href ?? item.value ?? item.link, type);

  if (!href) {
    return null;
  }

  return {
    id: `social-${index}-${type || "link"}-${href}`,
    href,
    label: getSocialLabel(item, index),
    type,
  };
}

export function parseSocialLinks(rawValue) {
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
