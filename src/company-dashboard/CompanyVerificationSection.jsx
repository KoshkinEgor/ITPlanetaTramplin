import { useRef, useState } from "react";
import { downloadCompanyVerificationDocument, submitCompanyVerificationRequest } from "../api/company";
import { Alert, Badge, Button, Card, FormField, Input, Modal } from "../shared/ui";
import { CabinetContentSection } from "../widgets/layout";
import {
  formatCompanyVerificationDate,
  formatCompanyVerificationFileSize,
  hasStructuredCompanyVerification,
  parseCompanyVerificationData,
} from "./companyVerification";

const VERIFICATION_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";
const VERIFICATION_MAX_SIZE_BYTES = 10 * 1024 * 1024;
const VERIFICATION_ALLOWED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const VERIFICATION_ALLOWED_EXTENSIONS = new Set([".pdf", ".jpg", ".jpeg", ".png", ".webp"]);

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function createVerificationDraft(profile) {
  const verification = parseCompanyVerificationData(profile?.verificationData);

  return {
    contactName: verification?.contact?.name ?? "",
    contactRole: verification?.contact?.role ?? "",
    contactPhone: verification?.contact?.phone ?? "",
    contactEmail: verification?.contact?.email ?? normalizeText(profile?.email),
  };
}

function hasUnsavedSnapshotChanges(profile, draft) {
  return normalizeText(profile?.companyName) !== normalizeText(draft?.companyName)
    || normalizeText(profile?.legalAddress) !== normalizeText(draft?.legalAddress);
}

function getVerificationPrerequisiteError(profile, draft) {
  if (hasUnsavedSnapshotChanges(profile, draft)) {
    return "Сначала сохраните название компании и юридический адрес.";
  }

  if (!normalizeText(profile?.companyName) || !normalizeText(profile?.inn) || !normalizeText(profile?.legalAddress)) {
    return "Для проверки нужны название компании, ИНН и юридический адрес.";
  }

  return "";
}

function getVerificationBadgeTone(status) {
  switch (status) {
    case "approved":
      return "success";
    case "revision":
      return "warning";
    case "rejected":
      return "danger";
    default:
      return "default";
  }
}

function getVerificationCardContent(status, hasLockedRequest) {
  if (status === "approved") {
    return {
      badge: "Подтверждена",
      title: "Компания подтверждена",
      description: "Профиль уже виден в каталоге и открыт для обновлений.",
      actionLabel: "",
      toneClassName: "approved",
    };
  }

  if (status === "revision") {
    return {
      badge: "Нужна доработка",
      title: "Обновите заявку",
      description: "Проверьте контактные данные и приложите свежий документ.",
      actionLabel: "Отправить повторно",
      toneClassName: "revision",
    };
  }

  if (status === "rejected") {
    return {
      badge: "Отклонена",
      title: "Нужна новая заявка",
      description: "После исправления данных можно отправить пакет заново.",
      actionLabel: "Новая заявка",
      toneClassName: "rejected",
    };
  }

  if (hasLockedRequest) {
    return {
      badge: "На проверке",
      title: "Заявка отправлена",
      description: "Документы уже у модератора. Пока форма доступна только для просмотра.",
      actionLabel: "",
      toneClassName: "pending",
    };
  }

  return {
    badge: "Без проверки",
    title: "Подтвердите компанию",
    description: "Нужен контакт для модератора и актуальная выписка ЕГРЮЛ.",
    actionLabel: "Отправить документы",
    toneClassName: "pending",
  };
}

function isAllowedVerificationFile(file) {
  if (!file) {
    return false;
  }

  const extension = `.${String(file.name ?? "").split(".").pop()?.toLowerCase() ?? ""}`;
  return VERIFICATION_ALLOWED_TYPES.has(file.type) || VERIFICATION_ALLOWED_EXTENSIONS.has(extension);
}

function buildVerificationFileSummary(file) {
  if (!file) {
    return null;
  }

  return {
    file,
    name: file.name,
    sizeBytes: file.size,
    contentType: file.type,
  };
}

function triggerBrowserDownload(blob, fileName) {
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = fileName || "company-verification-document";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(downloadUrl);
}

function getVerificationSubmitErrorMessage(error) {
  if (error?.status === 404) {
    return "Сервер еще не поддерживает отправку заявок. Перезапустите backend или обновите API.";
  }

  return error?.message ?? "Не удалось отправить заявку на проверку.";
}

export function CompanyVerificationSection({ profile, draft, onProfileUpdated }) {
  const fileInputRef = useRef(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [verificationDraft, setVerificationDraft] = useState(createVerificationDraft(profile));
  const [verificationFile, setVerificationFile] = useState(null);
  const [submitState, setSubmitState] = useState({ status: "idle", error: "" });
  const [downloadState, setDownloadState] = useState({ status: "idle", error: "" });
  const [successMessage, setSuccessMessage] = useState("");

  const verificationStatus = normalizeText(profile?.verificationStatus) || "pending";
  const verificationData = parseCompanyVerificationData(profile?.verificationData);
  const hasStructuredVerification = hasStructuredCompanyVerification(profile?.verificationData);
  const isPendingVerificationLocked = verificationStatus === "pending" && hasStructuredVerification;
  const verificationCard = getVerificationCardContent(verificationStatus, isPendingVerificationLocked);
  const prerequisiteError = getVerificationPrerequisiteError(profile, draft);
  const canOpenVerificationModal = verificationStatus !== "approved" && !isPendingVerificationLocked;
  const hasVerificationMeta = Boolean(
    verificationData?.snapshot || verificationData?.contact || verificationData?.document || verificationData?.legacyText
  );

  function handleOpenModal() {
    setVerificationDraft(createVerificationDraft(profile));
    setVerificationFile(null);
    setSubmitState({ status: "idle", error: "" });
    setModalOpen(true);
  }

  function handleCloseModal() {
    if (submitState.status === "saving") {
      return;
    }

    setModalOpen(false);
    setVerificationFile(null);
    setSubmitState({ status: "idle", error: "" });
  }

  function handleDraftChange(field, value) {
    setVerificationDraft((current) => ({ ...current, [field]: value }));
    setSubmitState({ status: "idle", error: "" });
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (file.size > VERIFICATION_MAX_SIZE_BYTES) {
      setSubmitState({
        status: "error",
        error: `Размер файла превышает лимит ${formatCompanyVerificationFileSize(VERIFICATION_MAX_SIZE_BYTES)}.`,
      });
      return;
    }

    if (!isAllowedVerificationFile(file)) {
      setSubmitState({
        status: "error",
        error: "Поддерживаются только PDF, JPG, PNG и WEBP.",
      });
      return;
    }

    setVerificationFile(buildVerificationFileSummary(file));
    setSubmitState({ status: "idle", error: "" });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (prerequisiteError) {
      setSubmitState({ status: "error", error: prerequisiteError });
      return;
    }

    if (!normalizeText(verificationDraft.contactName)
      || !normalizeText(verificationDraft.contactRole)
      || !normalizeText(verificationDraft.contactPhone)
      || !normalizeText(verificationDraft.contactEmail)) {
      setSubmitState({ status: "error", error: "Заполните контакт, должность, телефон и email." });
      return;
    }

    if (!normalizeText(verificationDraft.contactEmail).includes("@")) {
      setSubmitState({ status: "error", error: "Укажите корректный email для связи." });
      return;
    }

    if (!verificationFile?.file) {
      setSubmitState({ status: "error", error: "Загрузите выписку ЕГРЮЛ." });
      return;
    }

    setSubmitState({ status: "saving", error: "" });

    try {
      const formData = new FormData();
      formData.set("contactName", normalizeText(verificationDraft.contactName));
      formData.set("contactRole", normalizeText(verificationDraft.contactRole));
      formData.set("contactPhone", normalizeText(verificationDraft.contactPhone));
      formData.set("contactEmail", normalizeText(verificationDraft.contactEmail));
      formData.set("document", verificationFile.file, verificationFile.name);

      const nextProfile = await submitCompanyVerificationRequest(formData);
      onProfileUpdated?.(nextProfile);
      setSuccessMessage("Заявка отправлена модератору.");
      setModalOpen(false);
      setVerificationFile(null);
      setSubmitState({ status: "idle", error: "" });
    } catch (error) {
      setSubmitState({
        status: "error",
        error: getVerificationSubmitErrorMessage(error),
      });
    }
  }

  async function handleDocumentDownload() {
    setDownloadState({ status: "loading", error: "" });

    try {
      const result = await downloadCompanyVerificationDocument();
      triggerBrowserDownload(result.blob, result.fileName);
      setDownloadState({ status: "idle", error: "" });
    } catch (error) {
      setDownloadState({
        status: "error",
        error: error?.message ?? "Не удалось скачать документ проверки.",
      });
    }
  }

  return (
    <>
      <CabinetContentSection
        eyebrow="Верификация"
        title="Статус компании"
        description="Подтверждение через модератора для публичного профиля."
      >
        {successMessage ? (
          <Alert tone="success" title="Заявка отправлена" showIcon>
            {successMessage}
          </Alert>
        ) : null}

        {downloadState.status === "error" ? (
          <Alert tone="error" title="Не удалось скачать документ" showIcon>
            {downloadState.error}
          </Alert>
        ) : null}

        <Card className={`company-dashboard-verification-card company-dashboard-verification-card--${verificationCard.toneClassName}`}>
          <div className="company-dashboard-verification-card__head">
            <div className="company-dashboard-verification-card__summary">
              <Badge tone={getVerificationBadgeTone(verificationStatus)} dot>
                {verificationCard.badge}
              </Badge>
              <div className="company-dashboard-verification-card__copy">
                <h3 className="company-dashboard-editor-card__title">{verificationCard.title}</h3>
                <p className="company-dashboard-editor-card__description">{verificationCard.description}</p>
              </div>
            </div>

            {canOpenVerificationModal ? (
              <Button type="button" variant="secondary" size="sm" onClick={handleOpenModal}>
                {verificationCard.actionLabel}
              </Button>
            ) : null}
          </div>

          {verificationStatus === "pending" && hasStructuredVerification ? (
            <p className="company-dashboard-verification-card__status-note">
              Редактирование формы временно заблокировано, пока модератор не завершит проверку.
            </p>
          ) : null}

          {prerequisiteError && canOpenVerificationModal ? (
            <Alert tone="warning" title="Сначала обновите профиль" showIcon>
              {prerequisiteError}
            </Alert>
          ) : null}

          {hasVerificationMeta ? (
            <div className="company-dashboard-verification-card__meta">
              {verificationData?.snapshot ? (
                <div className="company-dashboard-verification-card__group">
                  <span className="company-dashboard-verification-card__group-label">Профиль</span>
                  <div className="company-dashboard-verification-card__facts">
                    <div><span>Компания</span><strong>{verificationData.snapshot.companyName || "Не указана"}</strong></div>
                    <div><span>ИНН</span><strong>{verificationData.snapshot.inn || "Не указан"}</strong></div>
                    <div><span>Юр. адрес</span><strong>{verificationData.snapshot.legalAddress || "Не указан"}</strong></div>
                  </div>
                </div>
              ) : null}

              {verificationData?.contact ? (
                <div className="company-dashboard-verification-card__group">
                  <span className="company-dashboard-verification-card__group-label">Контакт</span>
                  <div className="company-dashboard-verification-card__facts">
                    <div><span>Контактное лицо</span><strong>{verificationData.contact.name || "Не указано"}</strong></div>
                    <div><span>Должность</span><strong>{verificationData.contact.role || "Не указана"}</strong></div>
                    <div><span>Телефон</span><strong>{verificationData.contact.phone || "Не указан"}</strong></div>
                    <div><span>Email</span><strong>{verificationData.contact.email || "Не указан"}</strong></div>
                  </div>
                </div>
              ) : null}

              {verificationData?.document ? (
                <div className="company-dashboard-verification-card__group">
                  <span className="company-dashboard-verification-card__group-label">Документ</span>
                  <div className="company-dashboard-verification-card__document">
                    <div>
                      <strong>{verificationData.document.originalName || "Файл проверки"}</strong>
                      <p>
                        {[verificationData.document.contentType, formatCompanyVerificationFileSize(verificationData.document.sizeBytes)]
                          .filter(Boolean)
                          .join(" · ") || "Файл загружен"}
                      </p>
                      {verificationData.submittedAt ? <p>Отправлено: {formatCompanyVerificationDate(verificationData.submittedAt)}</p> : null}
                    </div>
                    {verificationData.document.storageKey ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleDocumentDownload}
                        disabled={downloadState.status === "loading"}
                      >
                        {downloadState.status === "loading" ? "Скачиваем..." : "Скачать"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {verificationData?.legacyText ? (
                <div className="company-dashboard-verification-card__group">
                  <span className="company-dashboard-verification-card__group-label">Архив</span>
                  <p className="ui-type-body">{verificationData.legacyText}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </Card>
      </CabinetContentSection>

      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        title="Полная верификация компании"
        description="Проверьте данные компании, контакт для модератора и приложите актуальную выписку ЕГРЮЛ."
        size="lg"
        className="company-dashboard-verification-modal"
        closeLabel="Закрыть окно верификации компании"
      >
        <form className="company-dashboard-stack" onSubmit={handleSubmit} noValidate>
          {submitState.status === "error" ? (
            <Alert tone="error" title="Не удалось отправить заявку" showIcon>
              {submitState.error}
            </Alert>
          ) : null}

          {prerequisiteError ? (
            <Alert tone="warning" title="Сначала обновите профиль компании" showIcon>
              {prerequisiteError}
            </Alert>
          ) : null}

          <Card className="company-dashboard-verification-card company-dashboard-verification-card--modal">
            <span className="company-dashboard-verification-card__group-label">Снимок профиля</span>
            <div className="company-dashboard-verification-card__facts">
              <div><span>Компания</span><strong>{profile?.companyName || "Не указана"}</strong></div>
              <div><span>ИНН</span><strong>{profile?.inn || "Не указан"}</strong></div>
              <div><span>Юр. адрес</span><strong>{profile?.legalAddress || "Не указан"}</strong></div>
            </div>
          </Card>

          <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
            <FormField label="Контактное лицо" required>
              <Input value={verificationDraft.contactName} onValueChange={(value) => handleDraftChange("contactName", value)} />
            </FormField>
            <FormField label="Должность" required>
              <Input value={verificationDraft.contactRole} onValueChange={(value) => handleDraftChange("contactRole", value)} />
            </FormField>
          </div>

          <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two">
            <FormField label="Телефон" required>
              <Input value={verificationDraft.contactPhone} onValueChange={(value) => handleDraftChange("contactPhone", value)} />
            </FormField>
            <FormField label="Email" required>
              <Input type="email" value={verificationDraft.contactEmail} onValueChange={(value) => handleDraftChange("contactEmail", value)} />
            </FormField>
          </div>

          <Card className="company-dashboard-verification-card company-dashboard-verification-card--modal">
            <div className="company-dashboard-verification-card__head">
              <div className="company-dashboard-verification-card__copy">
                <span className="company-dashboard-verification-card__group-label">Выписка ЕГРЮЛ</span>
                <p className="company-dashboard-editor-card__description">PDF, JPG, PNG или WEBP. Максимальный размер файла: 10 MB.</p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                {verificationFile ? "Заменить файл" : "Загрузить файл"}
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={VERIFICATION_ACCEPT}
              className="company-dashboard-verification-card__file-input"
              onChange={handleFileChange}
            />

            {verificationFile ? (
              <div className="company-dashboard-verification-card__document">
                <div>
                  <strong>{verificationFile.name}</strong>
                  <p>
                    {[verificationFile.contentType, formatCompanyVerificationFileSize(verificationFile.sizeBytes)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setVerificationFile(null)}>
                  Удалить
                </Button>
              </div>
            ) : (
              <p className="ui-type-body">Файл еще не выбран.</p>
            )}
          </Card>

          <div className="company-dashboard-panel__actions">
            <Button type="button" variant="ghost" onClick={handleCloseModal} disabled={submitState.status === "saving"}>
              Отмена
            </Button>
            <Button type="submit" disabled={Boolean(prerequisiteError) || submitState.status === "saving"}>
              {submitState.status === "saving" ? "Отправляем..." : "Отправить модератору"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
