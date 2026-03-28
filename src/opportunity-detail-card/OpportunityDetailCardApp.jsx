import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { AppLink } from "../app/AppLink";
import { PUBLIC_HEADER_NAV_ITEMS, buildCompanyPublicRoute, buildOpportunityDetailRoute } from "../app/routes";
import { createCandidateRecommendation, getCandidateContacts } from "../api/candidate";
import { applyToOpportunity, getOpportunity, getOpportunities } from "../api/opportunities";
import {
  refreshCandidateApplications,
  upsertCandidateApplication,
} from "../candidate-portal/candidate-applications-store";
import { mapSocialUserToCard } from "../candidate-portal/social";
import { useFavoriteOpportunity } from "../features/favorites/useFavoriteOpportunity";
import { ApiError } from "../lib/http";
import { cn } from "../lib/cn";
import { getOpportunityApplyLabel, isEventOpportunity, translateOpportunityType as translateSharedOpportunityType } from "../shared/lib/opportunityTypes";
import { PortalHeader } from "../widgets/layout/PortalHeader/PortalHeader";
import { Alert, Avatar, Button, Card, EmptyState, IconButton, Loader, Modal, OpportunityMiniCard, Tag } from "../shared/ui";
import "./opportunity-detail-card.css";

const BODY_CLASS = "opportunity-card-react-body";

const NAV_ITEMS = PUBLIC_HEADER_NAV_ITEMS;

const DEMO_OPPORTUNITIES = {
  "design-ui-ux": { id: "design-ui-ux", title: "Дизайнер интерфейсов мобильных приложений UI/UX", companyName: "White Tiger Soft", locationCity: "Москва", locationAddress: "Йошкар-Ола", opportunityType: "internship", employmentType: "Hybrid", moderationStatus: "approved", publishAt: "2026-02-27", description: "Стажировка для студентов и junior-специалистов: работа с Figma, UI-китами, прототипами и дизайном мобильных интерфейсов.", contactsJson: "{\"email\":\"hello@whitetigersoft.ru\",\"telegram\":\"@whitetigersoft\"}", mediaContentJson: "[{\"title\":\"Программа стажировки\"}]", tags: ["Figma", "UI / UX", "Мобильные приложения"] },
  "mobile-ui-ux-designer": { id: "mobile-ui-ux-designer", title: "Дизайнер интерфейсов мобильных приложений UI/UX", companyName: "White Tiger Soft", locationCity: "Москва", locationAddress: "Йошкар-Ола", opportunityType: "internship", employmentType: "Hybrid", moderationStatus: "approved", publishAt: "2026-02-27", description: "Стажировка с упором на мобильные сценарии, дизайн-системы и пользовательские исследования.", contactsJson: "{\"email\":\"hello@whitetigersoft.ru\",\"telegram\":\"@whitetigersoft\"}", mediaContentJson: "[{\"title\":\"Программа стажировки\"}]", tags: ["Figma", "UI / UX", "Прототипирование"] },
  "junior-security-analyst": { id: "junior-security-analyst", title: "Младший аналитик информационной безопасности", companyName: "Shield Ops", locationCity: "Москва", locationAddress: "Ленинградский проспект 39", opportunityType: "vacancy", employmentType: "Remote", moderationStatus: "approved", publishAt: "2026-03-10", description: "Стартовая позиция для кандидатов без опыта: мониторинг событий, работа с SOC/SIEM и обучение внутри команды информационной безопасности.", contactsJson: "{\"email\":\"jobs@shieldops.ru\"}", mediaContentJson: "[{\"title\":\"Стартовый трек\"}]", tags: ["Junior", "SOC", "SIEM"] },
  "it-planeta-event": { id: "it-planeta-event", title: "IT-Планета", companyName: "IT-Планета", locationCity: "Москва", locationAddress: "онлайн", opportunityType: "event", employmentType: "On-site", moderationStatus: "approved", publishAt: "2026-03-15", description: "Карьерное мероприятие с регистрацией, встречами с работодателями и практическими активностями для студентов и начинающих специалистов.", contactsJson: "{\"telegram\":\"@itplaneta_event\"}", mediaContentJson: "[{\"title\":\"Программа мероприятия\"}]", tags: ["Студенты", "Мероприятие", "Нетворкинг"] },
};

function HeartIcon() {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 16.2s-5.2-3.5-6.7-6.6C2.1 7.2 3.2 4.5 6 4.5c1.5 0 2.7.8 4 2.3 1.3-1.5 2.5-2.3 4-2.3 2.8 0 3.9 2.7 2.7 5.1-1.5 3.1-6.7 6.6-6.7 6.6Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function MoreIcon() {
  return <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><circle cx="4.5" cy="10" r="1.7" /><circle cx="10" cy="10" r="1.7" /><circle cx="15.5" cy="10" r="1.7" /></svg>;
}

function MailIcon() {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><rect x="2.5" y="4.5" width="15" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.6" /><path d="m4.5 7 5.5 4 5.5-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function uniqueItems(items) {
  return [...new Set((Array.isArray(items) ? items : []).map((item) => String(item).trim()).filter(Boolean))];
}

function parseJsonSafe(value, fallback) {
  if (!value || typeof value !== "string") return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getOpportunityContacts(value) {
  const parsed = parseJsonSafe(value, []);

  if (Array.isArray(parsed)) {
    return parsed
      .map((item) => ({
        type: String(item?.type || "").trim().toLowerCase(),
        value: String(item?.value || "").trim(),
      }))
      .filter((item) => item.value);
  }

  if (parsed && typeof parsed === "object") {
    return Object.entries(parsed)
      .map(([key, entryValue]) => {
        const normalizedValue = String(entryValue || "").trim();
        if (!normalizedValue) {
          return null;
        }

        if (key.toLowerCase().includes("mail")) {
          return { type: "email", value: normalizedValue };
        }

        if (key.toLowerCase().includes("phone") || key.toLowerCase().includes("tel")) {
          return { type: "phone", value: normalizedValue };
        }

        if (key.toLowerCase().includes("telegram") && !/^https?:\/\//i.test(normalizedValue)) {
          return { type: "link", value: `https://t.me/${normalizedValue.replace(/^@/, "")}` };
        }

        return { type: "link", value: normalizedValue };
      })
      .filter(Boolean);
  }

  return [];
}

function getDemoOpportunity(opportunityId) {
  return DEMO_OPPORTUNITIES[String(opportunityId)] ?? null;
}

function getDemoRelatedOpportunities(opportunityId) {
  return Object.values(DEMO_OPPORTUNITIES).filter((item) => String(item.id) !== String(opportunityId)).slice(0, 2);
}

function isNumericOpportunityId(value) {
  return /^\d+$/.test(String(value ?? "").trim());
}

function translateOpportunityType(value) {
  return translateSharedOpportunityType(value);
/*
  switch (String(value || "").toLowerCase()) {
    case "vacancy":
      return "Вакансия";
    case "internship":
      return "Стажировка";
    case "event":
      return "Мероприятие";
    default:
      return "Возможность";
  }
*/
}

function translateEmploymentType(value) {
  const normalized = String(value || "").trim().toLowerCase();

  switch (normalized) {
    case "remote":
    case "удаленно":
    case "удалённо":
      return "Удаленно";
    case "hybrid":
    case "гибрид":
      return "Гибрид";
    case "office":
    case "on-site":
    case "onsite":
    case "на месте работодателя":
      return "Офис";
    case "online":
    case "онлайн":
      return "Онлайн";
    case "unspecified":
    case "":
      return "Не указан";
    default:
      return String(value).trim();
  }
}

function formatDate(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(parsed);
}

function formatLocationLine(item) {
  return [item.locationCity, item.locationAddress].filter(Boolean).join(", ");
}

function getCompanyInitials(name) {
  const parts = String(name || "")
    .split(" ")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!parts.length) return "it";

  return parts
    .slice(0, 2)
    .map((item) => item[0] || "")
    .join("")
    .toLowerCase();
}

function getMediaEntries(value) {
  const parsed = parseJsonSafe(value, []);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((item) => {
      if (typeof item === "string") {
        const title = item.trim();
        return title ? { title, url: "" } : null;
      }

      if (!item || typeof item !== "object") {
        return null;
      }

      const title = String(item.title ?? item.label ?? "").trim();
      const url = String(item.url ?? item.href ?? item.value ?? "").trim();

      if (!title && !url) {
        return null;
      }

      return {
        title: title || url,
        url,
      };
    })
    .filter(Boolean);
}

function parseCompanySocialLinks(value) {
  const parsed = parseJsonSafe(value, null);

  if (Array.isArray(parsed)) {
    return parsed
      .map((item, index) => {
        if (typeof item === "string") {
          const url = item.trim();
          return url ? { id: `social-${index}`, label: url, url } : null;
        }

        if (!item || typeof item !== "object") {
          return null;
        }

        const url = String(item.url ?? item.href ?? item.value ?? item.link ?? "").trim();
        const type = String(item.type ?? "").trim();
        const label = type || url;

        return url ? { id: `social-${index}`, label, url } : null;
      })
      .filter(Boolean);
  }

  if (parsed && typeof parsed === "object") {
    return Object.entries(parsed)
      .map(([key, entryValue]) => {
        const url = String(entryValue ?? "").trim();
        return url ? { id: key, label: key, url } : null;
      })
      .filter(Boolean);
  }

  return [];
}

function splitDescription(value) {
  return String(value ?? "")
    .split(/\r?\n\r?\n|\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getContactAction(contacts) {
  const primaryEmail = contacts.find((item) => item.type === "email");
  if (primaryEmail) {
    return { href: `mailto:${primaryEmail.value}`, label: "Написать компании" };
  }

  const primaryLink = contacts.find((item) => item.type === "link");
  if (primaryLink) {
    return { href: primaryLink.value, label: "Открыть контакты компании" };
  }

  return { href: "#contacts", label: "Открыть контакты" };
}

function getPublishedLabel(typeLabel, publishedAt, city) {
  const dateLabel = formatDate(publishedAt);
  if (!dateLabel) return `${typeLabel} опубликована`;
  if (typeLabel === "Мероприятие") return `${typeLabel} опубликовано ${dateLabel}${city ? ` в ${city}` : ""}`;
  return `${typeLabel} опубликована ${dateLabel}${city ? ` в ${city}` : ""}`;
}

function getExpiresLabel(expireAt) {
  const dateLabel = formatDate(expireAt);
  return dateLabel ? `До ${dateLabel}` : "Срок не указан";
}

function getApplyButtonLabel(type, status) {
  if (status === "saving") return "Отправляем...";
  if (status === "success") return isEventOpportunity(type) ? "Заявка отправлена" : "Отклик отправлен";
  return getOpportunityApplyLabel(type);
}

function getComplaintTitle(type) {
  return isEventOpportunity(type) ? "Пожаловаться на событие" : "Пожаловаться на возможность";
}

function createApplyState(status = "idle", overrides = {}) {
  return {
    status,
    error: "",
    successTitle: "",
    successMessage: "",
    ...overrides,
  };
}

function createShareContactsState(status = "idle", overrides = {}) {
  return {
    status,
    items: [],
    error: "",
    ...overrides,
  };
}

function buildApplySuccessCopy(type, mode = "created") {
  const isEvent = isEventOpportunity(type);

  if (mode === "existing") {
    return {
      successTitle: isEvent ? "Заявка уже отправлена" : "Отклик уже отправлен",
      successMessage: "Он уже есть в вашем кабинете кандидата и обновлен в списке откликов.",
    };
  }

  return {
    successTitle: isEvent ? "Заявка отправлена" : "Отклик отправлен",
    successMessage: "Он сразу появился в вашем кабинете кандидата со статусом отправки.",
  };
}

function buildOpportunityViewModel(item) {
  const contacts = getOpportunityContacts(item.contactsJson);
  const mediaItems = getMediaEntries(item.mediaContentJson);
  const socialLinks = parseCompanySocialLinks(item.companySocials);
  const typeLabel = translateOpportunityType(item.opportunityType);
  const employmentLabel = translateEmploymentType(item.employmentType);
  const metaLine = [item.companyName, item.locationCity, employmentLabel === "Не указан" ? "" : employmentLabel.toLowerCase()].filter(Boolean).join(" • ");
  const descriptionParagraphs = splitDescription(item.description);
  const intro = descriptionParagraphs.length
    ? descriptionParagraphs
    : ["Описание возможности пока не заполнено."];
  const primarySocialLink = socialLinks[0] ?? null;

  return {
    typeLabel,
    metaLine,
    summary: item.description || "Описание возможности пока не заполнено.",
    intro,
    skills: uniqueItems(item.tags).slice(0, 12),
    published: getPublishedLabel(typeLabel, item.publishAt, item.locationCity),
    expires: getExpiresLabel(item.expireAt),
    locationLine: formatLocationLine(item),
    contacts,
    mediaItems,
    socialLinks,
    company: {
      initials: getCompanyInitials(item.companyName),
      description: String(item.companyDescription ?? "").trim(),
      legalAddress: String(item.companyLegalAddress ?? "").trim(),
    },
    publicCompanyHref: item?.employerId ? buildCompanyPublicRoute(item.employerId) : "",
    contactAction: getContactAction(contacts),
    companyAction: primarySocialLink,
    complaint: typeLabel === "Мероприятие" ? "Пожаловаться на событие" : "Пожаловаться на возможность",
  };
}

function mapRelatedOpportunity(item) {
  const viewModel = buildOpportunityViewModel(item);
  const isEvent = isEventOpportunity(item?.opportunityType);

  return {
    id: item?.id,
    type: viewModel.typeLabel,
    status: isEvent ? "Ожидание" : "Активно",
    statusTone: isEvent ? "neutral" : "success",
    title: item.title,
    meta: [item.companyName, item.locationCity, translateEmploymentType(item.employmentType).toLowerCase()].filter(Boolean).join(" • "),
    accent: translateEmploymentType(item.employmentType),
    note: item.locationAddress || "",
    chips: uniqueItems(item.tags).slice(0, 3),
  };
}

function OpportunityDetailLayout({
  item,
  related,
  applyState,
  onApply,
  menuOpen = false,
  menuRef = null,
  onMenuToggle,
  onShare,
  onComplaint,
  buildDetailHref = (entry) => buildOpportunityDetailRoute(entry.id),
  catalogHref = "/opportunities",
  animated = true,
  embedded = false,
}) {
  const viewModel = useMemo(() => buildOpportunityViewModel(item), [item]);
  const relatedItems = (Array.isArray(related) ? related : []).slice(0, 2);
  const applyLabel = getApplyButtonLabel(item.opportunityType, applyState.status);
  const { opportunityId: favoriteOpportunityId, isFavorite, toggleFavorite } = useFavoriteOpportunity(item?.id);

  return (
    <div className={cn("opportunity-card-page__grid", embedded && "opportunity-card-page__grid--embedded")}>
      <div className="opportunity-card-page__main">
        <Card className={cn("opportunity-focus-card", animated && "opportunity-card-fade-up")}>
          <div className="opportunity-focus-card__eyebrow">
            <Tag>{viewModel.typeLabel}</Tag>
            <div className="opportunity-focus-card__toolbar">
              <IconButton
                type="button"
                  label={isFavorite ? "Убрать возможность из избранного" : "Сохранить возможность"}
                size="xl"
                className="opportunity-focus-card__toolbar-button ui-opportunity-mini-card__favorite"
                aria-pressed={isFavorite}
                active={isFavorite}
                data-opportunity-id={favoriteOpportunityId ?? undefined}
                onClick={() => {
                  toggleFavorite();
                }}
              >
                <HeartIcon />
              </IconButton>
              <div ref={menuRef} className={cn("opportunity-focus-card__menu", menuOpen && "is-open")}>
                <IconButton
                  type="button"
                  label="Ещё действия"
                  size="xl"
                  className="opportunity-focus-card__toolbar-button"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={onMenuToggle}
                >
                  <MoreIcon />
                </IconButton>
                {menuOpen ? (
                  <div className="opportunity-focus-card__menu-popover" role="menu" aria-label="Действия с карточкой">
                    <button type="button" className="opportunity-focus-card__menu-action" role="menuitem" onClick={onComplaint}>
                      Пожаловаться
                    </button>
                    <button type="button" className="opportunity-focus-card__menu-action" role="menuitem" onClick={onShare}>
                      Поделиться
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="opportunity-focus-card__copy">
            <h1 className="ui-type-h2">{item.title}</h1>
            <p className="ui-type-body">{viewModel.metaLine}</p>
          </div>

          <p className="ui-type-body opportunity-focus-card__summary">{viewModel.summary}</p>

          {uniqueItems(item.tags).length ? (
            <div className="opportunity-focus-card__chips">
              {uniqueItems(item.tags).map((tag) => (
                <Tag key={tag} tone="accent">{tag}</Tag>
              ))}
            </div>
          ) : null}

          <div className="opportunity-focus-card__footer">
            <div className="opportunity-focus-card__actions">
              <Button type="button" className="opportunity-focus-card__apply" onClick={onApply} disabled={applyState.status === "saving" || applyState.status === "success"}>
                {applyLabel}
              </Button>
            </div>
          </div>
        </Card>

        {applyState.status === "error" ? <Alert tone="error" title="Не удалось отправить заявку" showIcon>{applyState.error}</Alert> : null}
        {applyState.status === "success" ? <Alert tone="success" title={applyState.successTitle} showIcon>{applyState.successMessage}</Alert> : null}


        <Card className={cn("opportunity-story-card", animated && "opportunity-card-fade-up opportunity-card-fade-up--delay-2")}>
          <section className="opportunity-story-section">
            <div className="opportunity-story-section__header"><h2 className="ui-type-h3">О публикации</h2></div>
            <ul className="opportunity-story-list">
              <li>{viewModel.published}</li>
              <li>{viewModel.locationLine || "Локация не указана."}</li>
              <li>{viewModel.expires}</li>
            </ul>
          </section>

          {viewModel.contacts.length ? (
            <section className="opportunity-story-section">
              <div className="opportunity-story-section__header"><h2 className="ui-type-h3">Контакты</h2></div>
              <ul className="opportunity-story-list">
                {viewModel.contacts.map((entry) => (
                  <li key={`${entry.type}-${entry.value}`}>
                    {entry.type === "email" ? (
                      <AppLink href={`mailto:${entry.value}`}>{entry.value}</AppLink>
                    ) : entry.type === "phone" ? (
                      <AppLink href={`tel:${entry.value.replace(/\s+/g, "")}`}>{entry.value}</AppLink>
                    ) : (
                      <AppLink href={entry.value}>{entry.value}</AppLink>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <p className="ui-type-caption">{viewModel.published}</p>
        </Card>

                <Card className={cn("opportunity-media-panel", animated && "opportunity-card-fade-up opportunity-card-fade-up--delay-1")}>
          <div className="opportunity-media-panel__header">
            <h2 className="ui-type-h4">Медиа</h2>
            <p className="ui-type-caption">Материалы, которые компания приложила к карточке возможности.</p>
          </div>
          {viewModel.mediaItems.length ? (
            <div className="opportunity-story-card__intro">
              {viewModel.mediaItems.map((entry, index) => (
                entry.url ? (
                  <AppLink key={`${entry.title}-${index}`} href={entry.url} className="opportunity-card-page__more-link">
                    {entry.title}
                  </AppLink>
                ) : (
                  <p key={`${entry.title}-${index}`} className="ui-type-body">{entry.title}</p>
                )
              ))}
            </div>
          ) : (
            <p className="ui-type-body">Компания пока не добавила медиа-материалы к этой карточке.</p>
          )}
        </Card>
      </div>

      <aside className="opportunity-card-page__side">
        <Card className={cn("company-spotlight", animated && "opportunity-card-fade-up opportunity-card-fade-up--delay-1")}>
          <div className="company-spotlight__company">
            <Avatar size="lg" initials={viewModel.company.initials} className="company-spotlight__avatar company-spotlight__avatar--brand" />
            <div className="company-spotlight__copy">
              {viewModel.publicCompanyHref ? (
                <AppLink href={viewModel.publicCompanyHref} className="opportunity-card-page__more-link">
                  <h2 className="ui-type-h4">{item.companyName}</h2>
                </AppLink>
              ) : (
                <h2 className="ui-type-h4">{item.companyName}</h2>
              )}
              <p className="ui-type-body">{viewModel.company.description || "Описание компании пока не заполнено."}</p>
            </div>
          </div>
        </Card>

        <div className="opportunity-card-page__matches">
          <p className="ui-type-caption opportunity-card-page__matches-label">Вам могут подойти</p>
          {relatedItems.length ? (
            relatedItems.map((relatedItem, index) => (
              <OpportunityMiniCard
                key={relatedItem.id}
                variant="compact"
                item={mapRelatedOpportunity(relatedItem)}
                className={cn("related-opportunity-entry", animated && `opportunity-card-fade-up opportunity-card-fade-up--delay-${index + 2}`)}
                detailAction={{ href: buildDetailHref(relatedItem), label: "Подробнее", variant: "secondary" }}
              />
            ))
          ) : (
            <Card><EmptyState title="Пока нет похожих публикаций" description="Другие возможности появятся здесь автоматически, когда каталог станет шире." tone="neutral" compact /></Card>
          )}

          <AppLink href={catalogHref} className="opportunity-card-page__more-link">Еще возможности в каталоге</AppLink>
        </div>
      </aside>
    </div>
  );
}

export function OpportunityDetailPreview() {
  const previewItem = getDemoOpportunity("design-ui-ux");
  if (!previewItem) return null;

  return (
    <OpportunityDetailLayout
      item={previewItem}
      related={getDemoRelatedOpportunities(previewItem.id)}
      applyState={createApplyState()}
      onApply={() => {}}
      buildDetailHref={(entry) => `#${entry.id}`}
      catalogHref="#catalog"
      animated={false}
      embedded
    />
  );
}

export function OpportunityDetailCardApp() {
  const params = useParams();
  const opportunityId = params.id;
  const [state, setState] = useState({ status: "loading", item: null, related: [], error: null, source: "api" });
  const [applyState, setApplyState] = useState(createApplyState());
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareContactsState, setShareContactsState] = useState(createShareContactsState());
  const [shareBusyKey, setShareBusyKey] = useState("");
  const menuRef = useRef(null);

  useEffect(() => {
    document.body.classList.add(BODY_CLASS);
    return () => document.body.classList.remove(BODY_CLASS);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      const demoItem = getDemoOpportunity(opportunityId);
      if (demoItem) {
        setState({ status: "ready", item: demoItem, related: getDemoRelatedOpportunities(opportunityId), error: null, source: "demo" });
        return;
      }

      if (!isNumericOpportunityId(opportunityId)) {
        setState({ status: "error", item: null, related: [], error: new Error("Карточка возможности не найдена."), source: "api" });
        return;
      }

      try {
        const [item, allOpportunities] = await Promise.all([getOpportunity(opportunityId, controller.signal), getOpportunities(controller.signal)]);
        setState({
          status: "ready",
          item,
          related: (Array.isArray(allOpportunities) ? allOpportunities : []).filter((entry) => String(entry.id) !== String(opportunityId)).slice(0, 2),
          error: null,
          source: "api",
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({ status: "error", item: null, related: [], error, source: "api" });
        }
      }
    }

    setApplyState(createApplyState());
    setMenuOpen(false);
    setShareModalOpen(false);
    setShareContactsState(createShareContactsState());
    setShareBusyKey("");
    load();
    return () => controller.abort();
  }, [opportunityId]);

  async function handleApply() {
    setApplyState(createApplyState("saving"));
    if (state.source === "demo") {
      setApplyState(createApplyState("success", buildApplySuccessCopy(state.item?.opportunityType)));
      return;
    }

    try {
      const application = await applyToOpportunity(opportunityId);
      upsertCandidateApplication(application);
      setApplyState(createApplyState("success", buildApplySuccessCopy(state.item?.opportunityType)));
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        await refreshCandidateApplications({ force: true }).catch(() => {});

        setApplyState(createApplyState("success", buildApplySuccessCopy(state.item?.opportunityType, "existing")));
        return;
      }

      setApplyState(createApplyState("error", { error: error?.message ?? "Не удалось отправить отклик." }));
    }
  }

  async function openShareModal() {
    setShareModalOpen(true);
    setShareBusyKey("");

    if (shareContactsState.status === "ready" || shareContactsState.status === "loading") {
      return;
    }

    setShareContactsState(createShareContactsState("loading"));

    try {
      const contacts = await getCandidateContacts();
      const items = (Array.isArray(contacts) ? contacts : [])
        .map(mapSocialUserToCard)
        .filter((item) => item?.id && item?.name);

      setShareContactsState(createShareContactsState("ready", { items }));
    } catch (error) {
      setShareContactsState(createShareContactsState("error", {
        error: error?.message ?? "Не удалось загрузить список контактов.",
      }));
    }
  }

  async function handleShareWithContact(contact) {
    const currentUrl =
      typeof window !== "undefined"
        ? window.location.href
        : buildOpportunityDetailRoute(opportunityId);
    const shareTitle = String(state.item?.title || "Возможность").trim();
    const shareText = `Смотри, нашёл интересную возможность: ${shareTitle}\n${currentUrl}`;
    const contactKey = String(contact?.id ?? contact?.email ?? contact?.name ?? "contact");
    const candidateId = Number(contact?.userId);

    setShareBusyKey(contactKey);

    try {
      if (!Number.isFinite(candidateId) || !state.item?.id) {
        throw new Error("Не удалось определить получателя рекомендации.");
      }

      await createCandidateRecommendation({
        candidateId,
        opportunityId: Number(state.item.id),
        message: shareText,
      });

      if (contact?.email) {
        const subject = encodeURIComponent(`Поделиться возможностью: ${shareTitle}`);
        const body = encodeURIComponent(shareText);

        if (typeof window !== "undefined" && typeof window.open === "function") {
          window.open(`mailto:${contact.email}?subject=${subject}&body=${body}`, "_self");
        }

        setShareModalOpen(false);
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        setShareModalOpen(false);
        return;
      }

      setShareModalOpen(false);
    } finally {
      setShareBusyKey("");
    }
  }
  function handleComplaint() {}

  return (
    <main className="opportunity-card-page" data-testid="opportunity-detail-page">
      <div className="opportunity-card-page__shell ui-page-shell">
        <PortalHeader navItems={NAV_ITEMS} currentKey="opportunities" actionHref="/candidate/profile" actionLabel="Профиль" className="opportunity-card-header opportunity-card-fade-up" />
        {state.status === "loading" ? <Loader label="Загружаем карточку возможности" surface /> : null}
        {state.status === "error" ? <Alert tone="error" title="Не удалось загрузить карточку" showIcon>{state.error?.message ?? "Попробуйте открыть возможность позже."}</Alert> : null}
        {state.status === "ready" && state.item ? (
          <OpportunityDetailLayout
            item={state.item}
            related={state.related}
            applyState={applyState}
            onApply={handleApply}
            menuOpen={menuOpen}
            menuRef={menuRef}
            onMenuToggle={() => setMenuOpen((current) => !current)}
            onShare={async () => {
              setMenuOpen(false);
              await openShareModal();
            }}
            onComplaint={() => {
              setMenuOpen(false);
              handleComplaint();
            }}
          />
        ) : null}
        <Modal
          open={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setShareBusyKey("");
          }}
          title="Поделиться возможностью"
          description="Выберите контакт, которому хотите отправить карточку публикации."
          size="md"
          className="opportunity-share-modal"
        >
          {shareContactsState.status === "loading" ? <Loader label="Загружаем контакты" /> : null}
          {shareContactsState.status === "error" ? (
            <Alert tone="error" title="Не удалось загрузить контакты" showIcon>
              {shareContactsState.error}
            </Alert>
          ) : null}
          {shareContactsState.status === "ready" && !shareContactsState.items.length ? (
            <EmptyState
              eyebrow="Пока пусто"
              title="Список контактов пока пуст"
              description="Добавьте контакты в кабинете кандидата, и они появятся здесь для быстрого шаринга."
              tone="neutral"
              compact
            />
          ) : null}
          {shareContactsState.status === "ready" && shareContactsState.items.length ? (
            <div className="opportunity-share-modal__list">
              {shareContactsState.items.map((contact) => (
                <div key={contact.id} className="opportunity-share-modal__item">
                  <div className="opportunity-share-modal__identity">
                    <Avatar initials={String(contact.name || "").slice(0, 2).toUpperCase() || "К"} shape="rounded" className="opportunity-share-modal__avatar" />
                    <div className="opportunity-share-modal__copy">
                      <strong>{contact.name}</strong>
                      <span>{contact.email || "Контакт без email"}</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    loading={shareBusyKey === String(contact.id)}
                    disabled={Boolean(shareBusyKey) && shareBusyKey !== String(contact.id)}
                    onClick={() => {
                      handleShareWithContact(contact);
                    }}
                  >
                    Поделиться
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </Modal>
      </div>
    </main>
  );
}

