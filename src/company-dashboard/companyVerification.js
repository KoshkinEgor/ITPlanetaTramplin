function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function readRecordValue(record, ...keys) {
  if (!record) {
    return undefined;
  }

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      return record[key];
    }
  }

  return undefined;
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

    const snapshot = normalizeRecord(readRecordValue(record, "snapshot", "Snapshot"));
    const contact = normalizeRecord(readRecordValue(record, "contact", "Contact"));
    const document = normalizeRecord(readRecordValue(record, "document", "Document"));
    const submittedAt = normalizeText(readRecordValue(record, "submittedAt", "SubmittedAt"));
    const hasStructuredPayload = Boolean(snapshot || contact || document || submittedAt);

    if (!hasStructuredPayload) {
      return { legacyText: rawValue };
    }

    return {
      snapshot: snapshot
        ? {
            companyName: normalizeText(readRecordValue(snapshot, "companyName", "CompanyName")),
            inn: normalizeText(readRecordValue(snapshot, "inn", "Inn")),
            legalAddress: normalizeText(readRecordValue(snapshot, "legalAddress", "LegalAddress")),
          }
        : null,
      contact: contact
        ? {
            name: normalizeText(readRecordValue(contact, "name", "Name")),
            role: normalizeText(readRecordValue(contact, "role", "Role")),
            phone: normalizeText(readRecordValue(contact, "phone", "Phone")),
            email: normalizeText(readRecordValue(contact, "email", "Email")),
          }
        : null,
      document: document
        ? {
            originalName: normalizeText(readRecordValue(document, "originalName", "OriginalName")),
            contentType: normalizeText(readRecordValue(document, "contentType", "ContentType")),
            sizeBytes: Number(readRecordValue(document, "sizeBytes", "SizeBytes")) || 0,
            storageKey: normalizeText(readRecordValue(document, "storageKey", "StorageKey")),
          }
        : null,
      submittedAt,
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
