import { useRef, useState } from "react";
import { downloadCompanyVerificationDocument, submitCompanyVerificationRequest } from "../api/company";
import { Alert, Button, Card, FormField, Input, Modal } from "../shared/ui";
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
    return "Сохраните название компании и юридический адрес перед отправкой заявки на верификацию.";
  }

  if (!normalizeText(profile?.companyName) || !normalizeText(profile?.inn) || !normalizeText(profile?.legalAddress)) {
    return "Для отправки заявки заполните название компании, ИНН и юридический адрес в сохраненном профиле.";
  }

  return "";
}

function getVerificationCardContent(status) {
  switch (status) {
    case "approved":
      return {
        eyebrow: "Подтверждено",
        title: "Компания уже прошла проверку",
        description: "Профиль выглядит подтвержденным для кандидатов и доступен публично.",
        actionLabel: "",
      };
    case "revision":
      return {
        eyebrow: "Нужна доработка",
        title: "Обновите заявку и отправьте ее повторно",
        description: "Модератор вернул компанию на доработку. Проверьте контактные данные и загрузите свежую выписку ЕГРЮЛ.",
        actionLabel: "Отправить повторно",
      };
    case "rejected":
      return {
        eyebrow: "Отклонено",
        title: "Верификация отклонена",
        description: "Можно исправить данные и отправить заявку заново, если профиль все еще актуален.",
        actionLabel: "Подать новую заявку",
      };
    default:
      return {
        eyebrow: "Проверка компании",
        title: "Пройдите полную верификацию",
        description: "Заявка с выпиской ЕГРЮЛ поможет получить подтвержденный статус и открыть публичный профиль компании.",
        actionLabel: "Пройти полную верификацию",
      };
  }
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
    return "Сервер пока не поддерживает отправку заявок на верификацию. Перезапустите backend или обновите API до последней версии.";
  }

  return error?.message ?? "Не удалось отправить заявку на верификацию.";
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
  const verificationCard = getVerificationCardContent(verificationStatus);
  const prerequisiteError = getVerificationPrerequisiteError(profile, draft);
  const isPendingVerificationLocked = verificationStatus === "pending" && hasStructuredVerification;
  const canOpenVerificationModal = verificationStatus !== "approved" && !isPendingVerificationLocked;

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
      setSubmitState({ status: "error", error: "Заполните контактное лицо, должность, телефон и email." });
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
      setSuccessMessage("Заявка отправлена модератору. Пока идет проверка, форма доступна только для просмотра.");
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
        error: error?.message ?? "Не удалось скачать документ верификации.",
      });
    }
  }

  return (
    <>
      <CabinetContentSection
        eyebrow="Проверка"
        title="Верификация"
        description="Подтвердите компанию через модератора и приложите выписку ЕГРЮЛ, чтобы профиль выглядел надежнее для кандидатов."
      >
        {successMessage ? (
          <Alert tone="success" title="Заявка на верификацию отправлена" showIcon>
            {successMessage}
          </Alert>
        ) : null}

        {downloadState.status === "error" ? (
          <Alert tone="error" title="Не удалось скачать документ" showIcon>
            {downloadState.error}
          </Alert>
        ) : null}

        <Card className="company-dashboard-verification-card">
          <div className="company-dashboard-verification-card__head">
            <div>
              <span className="company-dashboard-verification-card__eyebrow">{verificationCard.eyebrow}</span>
              <h3 className="company-dashboard-editor-card__title">{verificationCard.title}</h3>
              <p className="company-dashboard-editor-card__description">{verificationCard.description}</p>
            </div>
            {canOpenVerificationModal ? (
              <Button type="button" variant="secondary" onClick={handleOpenModal}>
                {verificationCard.actionLabel}
              </Button>
            ) : null}
          </div>

          {verificationStatus === "pending" && hasStructuredVerification ? (
            <p className="company-dashboard-verification-card__status-note">
              Заявка уже отправлена. Пока идет проверка, редактирование формы заблокировано.
            </p>
          ) : null}

          {prerequisiteError && canOpenVerificationModal ? (
            <Alert tone="warning" title="Перед отправкой заявки обновите профиль" showIcon>
              {prerequisiteError}
            </Alert>
          ) : null}

          {verificationData?.snapshot || verificationData?.contact || verificationData?.document ? (
            <div className="company-dashboard-verification-card__meta">
              {verificationData.snapshot ? (
                <div className="company-dashboard-verification-card__group">
                  <span className="company-dashboard-verification-card__group-label">Снимок профиля</span>
                  <div className="company-dashboard-verification-card__facts">
                    <div><span>Компания</span><strong>{verificationData.snapshot.companyName || "Не указана"}</strong></div>
                    <div><span>ИНН</span><strong>{verificationData.snapshot.inn || "Не указан"}</strong></div>
                    <div><span>Юр. адрес</span><strong>{verificationData.snapshot.legalAddress || "Не указан"}</strong></div>
                  </div>
                </div>
              ) : null}

              {verificationData.contact ? (
                <div className="company-dashboard-verification-card__group">
                  <span className="company-dashboard-verification-card__group-label">Контакт для модератора</span>
                  <div className="company-dashboard-verification-card__facts">
                    <div><span>Контактное лицо</span><strong>{verificationData.contact.name || "Не указано"}</strong></div>
                    <div><span>Должность</span><strong>{verificationData.contact.role || "Не указана"}</strong></div>
                    <div><span>Телефон</span><strong>{verificationData.contact.phone || "Не указан"}</strong></div>
                    <div><span>Email</span><strong>{verificationData.contact.email || "Не указан"}</strong></div>
                  </div>
                </div>
              ) : null}

              {verificationData.document ? (
                <div className="company-dashboard-verification-card__group">
                  <span className="company-dashboard-verification-card__group-label">Документ</span>
                  <div className="company-dashboard-verification-card__document">
                    <div>
                      <strong>{verificationData.document.originalName || "Файл верификации"}</strong>
                      <p>
                        {[verificationData.document.contentType, formatCompanyVerificationFileSize(verificationData.document.sizeBytes)]
                          .filter(Boolean)
                          .join(" · ") || "Файл загружен"}
                      </p>
                      {verificationData.submittedAt ? <p>Отправлено: {formatCompanyVerificationDate(verificationData.submittedAt)}</p> : null}
                    </div>
                    {verificationData.document.storageKey ? (
                      <Button type="button" variant="ghost" onClick={handleDocumentDownload} disabled={downloadState.status === "loading"}>
                        {downloadState.status === "loading" ? "Скачиваем..." : "Скачать документ"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {verificationData.legacyText ? (
                <div className="company-dashboard-verification-card__group">
                  <span className="company-dashboard-verification-card__group-label">Ранее сохраненные данные</span>
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
        description="Проверьте снимок компании, заполните контактные данные и приложите актуальную выписку ЕГРЮЛ."
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
            <span className="company-dashboard-verification-card__group-label">Снимок профиля для модератора</span>
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
              <div>
                <span className="company-dashboard-verification-card__group-label">Выписка ЕГРЮЛ</span>
                <p className="company-dashboard-editor-card__description">Поддерживаются PDF, JPG, PNG и WEBP. Максимальный размер файла: 10 MB.</p>
              </div>
              <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
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
                <Button type="button" variant="ghost" onClick={() => setVerificationFile(null)}>
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
