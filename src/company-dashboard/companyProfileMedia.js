const IMAGE_FILE_PATTERN = /\.(png|jpe?g|webp|gif|bmp|svg)(?:[?#].*)?$/i;
const VIDEO_FILE_PATTERN = /\.(mp4|webm|mov|m4v|m3u8)(?:[?#].*)?$/i;
const VIDEO_HOST_PATTERN = /(youtube\.com|youtu\.be|rutube\.ru|vimeo\.com|vkvideo\.ru|tiktok\.com)/i;

function normalizeUrl(value) {
  return String(value ?? "").trim();
}

export function inferCompanyMediaTypeFromUrl(value, fallback = "image") {
  const normalizedValue = normalizeUrl(value);

  if (!normalizedValue) {
    return fallback === "video" ? "video" : "image";
  }

  if (IMAGE_FILE_PATTERN.test(normalizedValue)) {
    return "image";
  }

  if (VIDEO_FILE_PATTERN.test(normalizedValue) || VIDEO_HOST_PATTERN.test(normalizedValue)) {
    return "video";
  }

  try {
    const parsedUrl = new URL(normalizedValue);
    const host = parsedUrl.hostname;
    const path = parsedUrl.pathname;

    if (IMAGE_FILE_PATTERN.test(path)) {
      return "image";
    }

    if (VIDEO_FILE_PATTERN.test(path) || VIDEO_HOST_PATTERN.test(host)) {
      return "video";
    }
  } catch {
    return fallback === "video" ? "video" : "image";
  }

  return fallback === "video" ? "video" : "image";
}

export function resolveCompanyHeroPreviewUrl(value) {
  const media = createCompanyHeroMediaDraft(value);

  if (inferCompanyMediaTypeFromUrl(media.sourceUrl, media.type) === "image" && media.sourceUrl) {
    return media.sourceUrl;
  }

  return media.previewUrl;
}

export function createCompanyHeroMediaDraft(value = {}) {
  const sourceUrl = normalizeUrl(value?.sourceUrl);
  const previewUrl = normalizeUrl(value?.previewUrl);
  const explicitType =
    value?.type === "video" ? "video" : value?.type === "image" ? "image" : "image";

  return {
    type: inferCompanyMediaTypeFromUrl(sourceUrl || previewUrl, explicitType),
    title: String(value?.title ?? "").trim(),
    description: String(value?.description ?? "").trim(),
    previewUrl,
    sourceUrl,
  };
}

export function createCompanyCaseStudyDraft(value = {}) {
  return {
    id: String(value?.id ?? "").trim(),
    title: String(value?.title ?? "").trim(),
    subtitle: String(value?.subtitle ?? "").trim(),
    description: String(value?.description ?? "").trim(),
    mediaType: value?.mediaType === "video" ? "video" : "image",
    previewUrl: normalizeUrl(value?.previewUrl),
    sourceUrl: normalizeUrl(value?.sourceUrl),
  };
}

export function createCompanyGalleryItemDraft(value = {}) {
  return {
    id: String(value?.id ?? "").trim(),
    alt: String(value?.alt ?? "").trim(),
    imageUrl: normalizeUrl(value?.imageUrl),
  };
}

export function readCompanyMediaFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string" && reader.result) {
        resolve(reader.result);
        return;
      }

      reject(new Error("Не удалось прочитать изображение."));
    };

    reader.onerror = () => {
      reject(new Error("Не удалось прочитать изображение."));
    };

    reader.readAsDataURL(file);
  });
}

function parseJsonSafe(value, fallback) {
  if (!value) {
    return fallback;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function normalizeCompanyHeroMedia(value) {
  const parsedValue = parseJsonSafe(value, null);

  if (!parsedValue || typeof parsedValue !== "object" || Array.isArray(parsedValue)) {
    return createCompanyHeroMediaDraft();
  }

  return createCompanyHeroMediaDraft(parsedValue);
}

export function normalizeCompanyCaseStudies(value) {
  const parsedValue = parseJsonSafe(value, []);
  const items = Array.isArray(parsedValue) ? parsedValue : [];

  return items
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      return createCompanyCaseStudyDraft(item);
    })
    .filter(Boolean);
}

export function normalizeCompanyGallery(value) {
  const parsedValue = parseJsonSafe(value, []);
  const items = Array.isArray(parsedValue) ? parsedValue : [];

  return items
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      return createCompanyGalleryItemDraft(item);
    })
    .filter(Boolean);
}

export function hasCompanyHeroMediaContent(value) {
  const media = createCompanyHeroMediaDraft(value);
  return Boolean(media.title || media.description || media.previewUrl || media.sourceUrl);
}

export function serializeCompanyHeroMedia(value) {
  const media = createCompanyHeroMediaDraft(value);

  if (!hasCompanyHeroMediaContent(media)) {
    return null;
  }

  return JSON.stringify({
    type: inferCompanyMediaTypeFromUrl(media.sourceUrl || media.previewUrl, media.type),
    title: media.title,
    description: media.description,
    previewUrl: media.previewUrl || undefined,
    sourceUrl: media.sourceUrl || undefined,
  });
}

export function serializeCompanyCaseStudies(value) {
  const normalizedItems = normalizeCompanyCaseStudies(value)
    .map((item, index) => ({
      id: item.id || `case-study-${index + 1}`,
      title: item.title,
      subtitle: item.subtitle || undefined,
      description: item.description,
      mediaType: item.mediaType,
      previewUrl: item.previewUrl,
      sourceUrl: item.sourceUrl || undefined,
    }))
    .filter((item) => item.title || item.description || item.previewUrl || item.sourceUrl);

  return JSON.stringify(normalizedItems);
}

export function serializeCompanyGallery(value) {
  const normalizedItems = normalizeCompanyGallery(value)
    .map((item, index) => ({
      id: item.id || `gallery-item-${index + 1}`,
      alt: item.alt,
      imageUrl: item.imageUrl,
    }))
    .filter((item) => item.alt || item.imageUrl);

  return JSON.stringify(normalizedItems);
}
