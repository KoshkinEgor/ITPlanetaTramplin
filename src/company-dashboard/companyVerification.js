function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

export function parseCompanyVerificationData(value) {
  const rawValue = normalizeText(value);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue);
    const record = normalizeRecord(parsed);

    if (!record) {
      return { legacyText: rawValue };
    }

    const snapshot = normalizeRecord(record.snapshot);
    const contact = normalizeRecord(record.contact);
    const document = normalizeRecord(record.document);
    const hasStructuredPayload = Boolean(snapshot || contact || document || normalizeText(record.submittedAt));

    if (!hasStructuredPayload) {
      return { legacyText: rawValue };
    }

    return {
      snapshot: snapshot
        ? {
            companyName: normalizeText(snapshot.companyName),
            inn: normalizeText(snapshot.inn),
            legalAddress: normalizeText(snapshot.legalAddress),
          }
        : null,
      contact: contact
        ? {
            name: normalizeText(contact.name),
            role: normalizeText(contact.role),
            phone: normalizeText(contact.phone),
            email: normalizeText(contact.email),
          }
        : null,
      document: document
        ? {
            originalName: normalizeText(document.originalName),
            contentType: normalizeText(document.contentType),
            sizeBytes: Number(document.sizeBytes) || 0,
            storageKey: normalizeText(document.storageKey),
          }
        : null,
      submittedAt: normalizeText(record.submittedAt),
      legacyText: "",
    };
  } catch {
    return { legacyText: rawValue };
  }
}

export function formatCompanyVerificationDate(value) {
  const rawValue = normalizeText(value);
  if (!rawValue) {
    return "";
  }

  const parsed = new Date(rawValue);
  if (Number.isNaN(parsed.getTime())) {
    return rawValue;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export function formatCompanyVerificationFileSize(sizeBytes) {
  const normalizedSize = Number(sizeBytes);
  if (!Number.isFinite(normalizedSize) || normalizedSize <= 0) {
    return "";
  }

  if (normalizedSize >= 1024 * 1024) {
    return `${(normalizedSize / 1024 / 1024).toFixed(1)} MB`;
  }

  if (normalizedSize >= 1024) {
    return `${Math.round(normalizedSize / 1024)} KB`;
  }

  return `${normalizedSize} B`;
}

export function hasStructuredCompanyVerification(value) {
  const parsed = parseCompanyVerificationData(value);
  return Boolean(parsed?.document?.storageKey);
}
