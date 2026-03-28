import { AppLink } from "../app/AppLink";
import { Card, EmptyState, FormField, Input, Tag, Textarea } from "../shared/ui";
import {
  createCompanyHeroMediaDraft,
  hasCompanyHeroMediaContent,
  inferCompanyMediaTypeFromUrl,
  resolveCompanyHeroPreviewUrl,
} from "./companyProfileMedia";
import "./company-dashboard.css";

const MEDIA_TYPE_LABELS = {
  image: "Изображение",
  video: "Видео",
};

function PlayBadge() {
  return (
    <span className="company-dashboard-media-panel__play" aria-hidden="true">
      <svg viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="24" fill="currentColor" opacity="0.16" />
        <path d="M20 16.5 32 24l-12 7.5v-15Z" fill="currentColor" />
      </svg>
    </span>
  );
}

export function CompanyHeroMediaPanel({
  media,
  mode = "viewer",
  eyebrow = "О компании",
  title = "Hero-media компании",
  description = "Тот же медиа-блок компании используется в кабинете и на публичной странице.",
  testId = "company-hero-media-panel",
  compact = false,
  onChange,
}) {
  const item = createCompanyHeroMediaDraft(media);
  const resolvedType = inferCompanyMediaTypeFromUrl(item.sourceUrl || item.previewUrl, item.type);
  const resolvedPreviewUrl = resolveCompanyHeroPreviewUrl(item);
  const hasPreviewImage = resolvedType === "image" && resolvedPreviewUrl;
  const hasContent = hasCompanyHeroMediaContent(item);
  const isEditor = mode === "editor";
  const shouldShowContentTitle = item.title && item.title !== title;

  return (
    <Card
      className={[
        "company-dashboard-media-panel",
        compact ? "company-dashboard-media-panel--compact" : "",
        isEditor ? "company-dashboard-media-panel--editor" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-testid={testId}
    >
      <div className="company-dashboard-media-panel__head">
        {eyebrow ? <span className="company-dashboard-media-panel__eyebrow">{eyebrow}</span> : null}
        {title ? <h2 className="company-dashboard-media-panel__title">{title}</h2> : null}
        {description ? <p className="company-dashboard-media-panel__description">{description}</p> : null}
      </div>

      {isEditor ? (
        <div className="company-dashboard-media-panel__body company-dashboard-media-panel__body--editor">
          <div className="company-dashboard-media-panel__preview company-dashboard-media-panel__preview--editor">
            {hasPreviewImage ? (
              <img src={resolvedPreviewUrl} alt={item.title || "Hero media компании"} loading="lazy" />
            ) : (
              <div className="company-dashboard-media-panel__preview-placeholder company-dashboard-media-panel__preview-placeholder--editor">
                {resolvedType === "video" ? <PlayBadge /> : null}
                <strong>Ссылка на источник определит формат автоматически</strong>
                <span>Поддерживаются прямые ссылки на фото и ссылки на видео-платформы.</span>
              </div>
            )}

            <div className="company-dashboard-media-panel__badges">
              <Tag tone="accent">{MEDIA_TYPE_LABELS[resolvedType] ?? MEDIA_TYPE_LABELS.image}</Tag>
            </div>
          </div>

          <FormField label="Подпись блока">
            <Input
              value={item.title}
              onValueChange={(value) => onChange?.("title", value)}
              placeholder="Видео-презентация и атмосфера команды"
            />
          </FormField>

          <FormField label="Описание блока">
            <Textarea
              value={item.description}
              onValueChange={(value) => onChange?.("description", value)}
              rows={4}
              autoResize
              placeholder="Коротко опишите, что увидит кандидат."
            />
          </FormField>

          <FormField
            label="Ссылка на источник"
            hint="Система сама определит, это фотография или видео. Отдельные поля preview и type не нужны."
          >
            <Input
              value={item.sourceUrl}
              onValueChange={(value) => onChange?.("sourceUrl", value)}
              placeholder="https://..."
            />
          </FormField>
        </div>
      ) : hasContent ? (
        <div className="company-dashboard-media-panel__body">
          <div className="company-dashboard-media-panel__preview">
            {hasPreviewImage ? (
              <img src={resolvedPreviewUrl} alt={item.title || "Hero media компании"} loading="lazy" />
            ) : (
              <div className="company-dashboard-media-panel__preview-placeholder">
                {resolvedType === "video" ? <PlayBadge /> : null}
              </div>
            )}

            <div className="company-dashboard-media-panel__badges">
              <Tag tone="accent">{MEDIA_TYPE_LABELS[resolvedType] ?? MEDIA_TYPE_LABELS.image}</Tag>
            </div>
          </div>

          <div className="company-dashboard-media-panel__content">
            {shouldShowContentTitle ? (
              <h3 className="company-dashboard-media-panel__content-title">{item.title}</h3>
            ) : null}
            {item.description ? <p className="company-dashboard-media-panel__content-description">{item.description}</p> : null}
            {item.sourceUrl ? (
              <AppLink href={item.sourceUrl} className="company-dashboard-media-panel__link">
                Открыть материал
              </AppLink>
            ) : null}
          </div>
        </div>
      ) : (
        <EmptyState
          compact
          tone="neutral"
          title="Hero-media пока не добавлен"
          description="После заполнения здесь появится публичный медиа-блок компании."
        />
      )}
    </Card>
  );
}
