import { useRef, useState } from "react";
import { Button, Card, EmptyState, Input } from "../shared/ui";
import {
  createCompanyGalleryItemDraft,
  normalizeCompanyGallery,
  readCompanyMediaFileAsDataUrl,
} from "./companyProfileMedia";
import "./company-dashboard.css";

const COMPANY_GALLERY_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";
const COMPANY_GALLERY_MAX_SIZE_BYTES = 5 * 1024 * 1024;

function CompanyMediaUploadIcon() {
  return (
    <svg viewBox="0 0 80 80" fill="none" aria-hidden="true">
      <path
        d="M19 19.5c0-4.694 3.806-8.5 8.5-8.5h25.86c1.262 0 2.467.53 3.317 1.46l8.14 8.9A4.9 4.9 0 0 1 66 24.64V52.5c0 4.694-3.806 8.5-8.5 8.5h-30c-4.694 0-8.5-3.806-8.5-8.5v-33Z"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <path d="M57 11v13h13" stroke="currentColor" strokeWidth="4.5" strokeLinejoin="round" />
      <circle cx="36" cy="33" r="4.5" fill="currentColor" />
      <path
        d="m24 52 11.2-12a3.2 3.2 0 0 1 4.6-.14L45 45l5.6-5.6a3.2 3.2 0 0 1 4.53 0L61 45.3"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="58" cy="58" r="13" fill="currentColor" opacity="0.14" />
      <path d="M58 50.5v15M50.5 58h15" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} КБ`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function CompanyGalleryEditorCard({ item, index, onChange, onRemove }) {
  const fileInputRef = useRef(null);
  const [uploadError, setUploadError] = useState("");
  const normalizedItem = createCompanyGalleryItemDraft(item);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (file.size > COMPANY_GALLERY_MAX_SIZE_BYTES) {
      setUploadError(`Размер файла превышает ${formatFileSize(COMPANY_GALLERY_MAX_SIZE_BYTES)}.`);
      return;
    }

    try {
      const nextImageUrl = await readCompanyMediaFileAsDataUrl(file);
      onChange?.(normalizedItem.id, "imageUrl", nextImageUrl);
      setUploadError("");
    } catch (error) {
      setUploadError(error?.message ?? "Не удалось загрузить изображение.");
    }
  }

  return (
    <Card className="company-dashboard-gallery-card company-dashboard-gallery-card--editor" role="listitem" tone="neutral">
      <button
        type="button"
        className="company-dashboard-gallery-card__remove"
        aria-label={`Удалить фото ${index + 1}`}
        onClick={() => onRemove?.(normalizedItem.id)}
      >
        ×
      </button>

      <div className="company-dashboard-gallery-card__image-shell">
        {normalizedItem.imageUrl ? (
          <img
            src={normalizedItem.imageUrl}
            alt={normalizedItem.alt || `Галерея компании ${index + 1}`}
            className="company-dashboard-gallery-card__image-media"
            loading="lazy"
          />
        ) : (
          <button
            type="button"
            className="company-dashboard-gallery-card__upload"
            onClick={() => fileInputRef.current?.click()}
          >
            <CompanyMediaUploadIcon />
            <span>Загрузить фото</span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={COMPANY_GALLERY_ACCEPT}
          className="company-dashboard-gallery-card__file-input"
          onChange={handleFileChange}
        />
      </div>

      <div className="company-dashboard-gallery-card__editor-footer">
        <Input
          value={normalizedItem.alt}
          onValueChange={(value) => onChange?.(normalizedItem.id, "alt", value)}
          placeholder="Краткое описание"
        />

        <div className="company-dashboard-gallery-card__editor-actions">
          <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
            {normalizedItem.imageUrl ? "Заменить" : "Выбрать"}
          </Button>
          {normalizedItem.imageUrl ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange?.(normalizedItem.id, "imageUrl", "")}>
              Очистить
            </Button>
          ) : null}
        </div>
      </div>

      {uploadError ? <p className="company-dashboard-gallery-card__error">{uploadError}</p> : null}
    </Card>
  );
}

export function CompanyGalleryPanel({
  items,
  mode = "viewer",
  testId = "company-gallery-panel",
  emptyTitle = "Галерея пока пустая",
  emptyDescription = "Компания еще не добавила фотографии команды, офиса или мероприятий.",
  compact = false,
  onAddItem,
  onRemoveItem,
  onItemChange,
}) {
  const galleryItems = normalizeCompanyGallery(items);
  const isEditor = mode === "editor";

  if (!galleryItems.length && !isEditor) {
    return (
      <Card className="company-dashboard-gallery-empty" data-testid={testId} tone="neutral">
        <EmptyState compact tone="neutral" title={emptyTitle} description={emptyDescription} />
      </Card>
    );
  }

  return (
    <div
      className={[
        "company-dashboard-gallery-scroll",
        compact ? "company-dashboard-gallery-scroll--compact" : "",
        isEditor ? "company-dashboard-gallery-scroll--editor" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="list"
      aria-label="Галерея компании"
      data-testid={testId}
    >
      {galleryItems.map((item, index) =>
        isEditor ? (
          <CompanyGalleryEditorCard
            key={item.id || `${item.imageUrl}-${index}`}
            item={item}
            index={index}
            onChange={onItemChange}
            onRemove={onRemoveItem}
          />
        ) : (
          <Card
            className="company-dashboard-gallery-card"
            key={item.id || `${item.imageUrl}-${index}`}
            role="listitem"
            tone="neutral"
          >
            <div className="company-dashboard-gallery-card__image-shell">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.alt || `Галерея компании ${index + 1}`}
                  className="company-dashboard-gallery-card__image-media"
                  loading="lazy"
                />
              ) : (
                <div className="company-dashboard-gallery-card__image" aria-hidden="true" />
              )}
            </div>
            <div className="company-dashboard-gallery-card__footer">
              <p className="ui-type-body">{item.alt || `Изображение ${index + 1}`}</p>
            </div>
          </Card>
        )
      )}

      {isEditor ? (
        <Card className="company-dashboard-gallery-card company-dashboard-gallery-card--add" role="listitem" tone="neutral">
          <button type="button" className="company-dashboard-gallery-card__add" onClick={onAddItem}>
            <CompanyMediaUploadIcon />
            <strong>Добавить фото</strong>
            <span>Новая карточка появится справа и сразу попадет в общую ленту.</span>
          </button>
        </Card>
      ) : null}
    </div>
  );
}
