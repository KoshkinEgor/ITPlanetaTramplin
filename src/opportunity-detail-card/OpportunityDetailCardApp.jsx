import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { AppLink } from "../app/AppLink";
import { PUBLIC_HEADER_NAV_ITEMS, buildCompanyPublicRoute, buildOpportunityDetailRoute } from "../app/routes";
import { createCandidateRecommendation, getCandidateContacts } from "../api/candidate";
import { getCompanyProfile } from "../api/company";
import { applyToOpportunity, deleteOpportunity, getOpportunity, getOpportunities, updateOpportunity } from "../api/opportunities";
import { useAuthSession } from "../auth/api";
import { refreshCandidateApplications, upsertCandidateApplication } from "../candidate-portal/candidate-applications-store";
import { mapSocialUserToCard } from "../candidate-portal/social";
import { useFavoriteOpportunity } from "../features/favorites/useFavoriteOpportunity";
import { ApiError } from "../lib/http";
import { cn } from "../lib/cn";
import { buildOpportunityPayload, buildOpportunityPreviewRoute, createOpportunityDraft, formatOpportunityDateTime, getOpportunityDetailPresentation, getOpportunityMiniCardPresentation, getOpportunityOwnerCapabilities, translateModerationStatus, validateOpportunityDraftForSubmit } from "../shared/lib/opportunityPresentation";
import { getOpportunityApplyLabel, isEventOpportunity } from "../shared/lib/opportunityTypes";
import { Alert, Avatar, Button, Card, Checkbox, EmptyState, FormField, IconButton, Input, Loader, Modal, OpportunityMiniCard, Select, Tag, Textarea } from "../shared/ui";
import { PortalHeader } from "../widgets/layout/PortalHeader/PortalHeader";
import { OpportunityLocationPicker } from "../company-dashboard/OpportunityLocationPicker";
import "./opportunity-detail-card.css";

const BODY_CLASS = "opportunity-card-react-body";
const NAV_ITEMS = PUBLIC_HEADER_NAV_ITEMS;

const DEMO = {
  "design-ui-ux": {
    id: "design-ui-ux",
    title: "Дизайнер интерфейсов мобильных приложений UI/UX",
    companyName: "White Tiger Soft",
    locationCity: "Москва",
    locationAddress: "Йошкар-Ола",
    opportunityType: "internship",
    employmentType: "hybrid",
    moderationStatus: "approved",
    publishAt: "2026-02-27",
    description: "Стажировка для студентов и junior-специалистов.",
    contactsJson: "{\"email\":\"hello@whitetigersoft.ru\"}",
    mediaContentJson: "[{\"title\":\"Программа стажировки\"}]",
    tags: ["Figma", "UI / UX"],
    employerId: 10,
    applicationsCount: 0,
    salaryFrom: 40000,
    salaryTo: 70000,
    duration: "3 месяца",
  },
  "junior-security-analyst": {
    id: "junior-security-analyst",
    title: "Младший аналитик информационной безопасности",
    companyName: "Shield Ops",
    locationCity: "Москва",
    locationAddress: "Ленинградский проспект 39",
    opportunityType: "vacancy",
    employmentType: "remote",
    moderationStatus: "approved",
    publishAt: "2026-03-10",
    description: "Стартовая позиция для кандидатов без опыта.",
    contactsJson: "{\"email\":\"jobs@shieldops.ru\"}",
    mediaContentJson: "[{\"title\":\"Стартовый трек\"}]",
    tags: ["Junior", "SOC", "SIEM"],
    employerId: 404,
    applicationsCount: 1,
    salaryFrom: 120000,
    salaryTo: 180000,
  },
};

function HeartIcon() { return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 16.2s-5.2-3.5-6.7-6.6C2.1 7.2 3.2 4.5 6 4.5c1.5 0 2.7.8 4 2.3 1.3-1.5 2.5-2.3 4-2.3 2.8 0 3.9 2.7 2.7 5.1-1.5 3.1-6.7 6.6-6.7 6.6Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function MoreIcon() { return <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><circle cx="4.5" cy="10" r="1.7" /><circle cx="10" cy="10" r="1.7" /><circle cx="15.5" cy="10" r="1.7" /></svg>; }
function uniq(items) { return [...new Set((Array.isArray(items) ? items : []).map((item) => String(item).trim()).filter(Boolean))]; }
function json(value, fallback) { if (!value || typeof value !== "string") return fallback; try { return JSON.parse(value); } catch { return fallback; } }
function contacts(value) {
  const parsed = json(value, []);
  if (Array.isArray(parsed)) return parsed.map((item) => ({ type: String(item?.type || "link").trim().toLowerCase(), value: String(item?.value || "").trim() })).filter((item) => item.value);
  if (parsed && typeof parsed === "object") return Object.entries(parsed).map(([key, entryValue]) => {
    const normalizedValue = String(entryValue ?? "").trim();
    if (!normalizedValue) return null;
    const normalizedKey = String(key).trim().toLowerCase();
    if (normalizedKey.includes("mail")) return { type: "email", value: normalizedValue };
    if (normalizedKey.includes("phone") || normalizedKey.includes("tel")) return { type: "phone", value: normalizedValue };
    if (normalizedKey.includes("telegram") && !/^https?:\/\//i.test(normalizedValue)) return { type: "link", value: `https://t.me/${normalizedValue.replace(/^@/, "")}` };
    return { type: "link", value: normalizedValue };
  }).filter(Boolean);
  return [];
}
function media(value) { const parsed = json(value, []); return Array.isArray(parsed) ? parsed.map((item) => ({ title: String(item?.title ?? item?.label ?? "").trim(), url: String(item?.url ?? item?.href ?? item?.value ?? "").trim() })).filter((item) => item.title || item.url) : []; }
function socials(value) { const parsed = json(value, null); return Array.isArray(parsed) ? parsed.map((item, index) => ({ id: `social-${index}`, label: String(item?.type ?? item?.label ?? item ?? "").trim() || `social-${index}`, url: String(item?.url ?? item?.href ?? item?.value ?? item ?? "").trim() })).filter((item) => item.url) : []; }
function desc(value) { return String(value ?? "").split(/\r?\n\r?\n|\r?\n/).map((item) => item.trim()).filter(Boolean); }
function initials(name) { return String(name || "").split(/\s+/).filter(Boolean).slice(0, 2).map((item) => item[0] || "").join("").toLowerCase() || "it"; }
function locationLine(item) { return [item.locationCity, item.locationAddress].filter(Boolean).join(", "); }
function demoOpportunity(id) { return DEMO[String(id)] ?? null; }
function demoRelated(id) { return Object.values(DEMO).filter((item) => String(item.id) !== String(id)).slice(0, 2); }
function numericId(value) { return /^\d+$/.test(String(value ?? "").trim()); }
function applyLabel(type, status) { if (status === "saving") return "Отправляем..."; if (status === "success") return isEventOpportunity(type) ? "Заявка отправлена" : "Отклик отправлен"; return getOpportunityApplyLabel(type); }
function applyState(status = "idle", overrides = {}) { return { status, error: "", successTitle: "", successMessage: "", ...overrides }; }
function createShareContactsState(status = "idle", overrides = {}) { return { status, items: [], error: "", ...overrides }; }
function successCopy(type, mode = "created") { const event = isEventOpportunity(type); return mode === "existing" ? { successTitle: event ? "Заявка уже отправлена" : "Отклик уже отправлен", successMessage: "Он уже есть в вашем кабинете кандидата." } : { successTitle: event ? "Заявка отправлена" : "Отклик отправлен", successMessage: "Он появился в вашем кабинете кандидата." }; }

function TypeFields({ draft, onChange }) {
  if (draft.opportunityType === "vacancy") return <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two"><FormField label="Зарплата от" required><Input type="number" value={draft.salaryFrom} onValueChange={(value) => onChange("salaryFrom", value)} /></FormField><FormField label="Зарплата до" required><Input type="number" value={draft.salaryTo} onValueChange={(value) => onChange("salaryTo", value)} /></FormField></div>;
  if (draft.opportunityType === "internship") return <div className="company-dashboard-stack"><Checkbox label="Стажировка оплачиваемая" checked={Boolean(draft.isPaid)} onChange={(e) => onChange("isPaid", e.target.checked)} />{draft.isPaid !== false ? <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two"><FormField label="Стипендия от" required><Input type="number" value={draft.stipendFrom} onValueChange={(value) => onChange("stipendFrom", value)} /></FormField><FormField label="Стипендия до" required><Input type="number" value={draft.stipendTo} onValueChange={(value) => onChange("stipendTo", value)} /></FormField></div> : null}<FormField label="Длительность" required><Input value={draft.duration} onValueChange={(value) => onChange("duration", value)} /></FormField></div>;
  if (draft.opportunityType === "event") return <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two"><FormField label="Дата и время начала" required><Input type="datetime-local" value={draft.eventStartAt} onValueChange={(value) => onChange("eventStartAt", value)} /></FormField><FormField label="Дедлайн регистрации" required><Input type="datetime-local" value={draft.registrationDeadline} onValueChange={(value) => onChange("registrationDeadline", value)} /></FormField></div>;
  if (draft.opportunityType === "mentoring") return <div className="company-dashboard-stack"><FormField label="Длительность" required><Input value={draft.duration} onValueChange={(value) => onChange("duration", value)} /></FormField><div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two"><FormField label="Частота встреч" required><Input value={draft.meetingFrequency} onValueChange={(value) => onChange("meetingFrequency", value)} /></FormField><FormField label="Количество мест" required><Input type="number" value={draft.seatsCount} onValueChange={(value) => onChange("seatsCount", value)} /></FormField></div></div>;
  return null;
}

function OwnerEditor({ draft, onChange, onSaveDraft, onSubmit, onPreview, onClose, onArchive, onDelete, saving }) {
  const cap = getOpportunityOwnerCapabilities(draft, { isOwner: true });
  return <Card className="opportunity-owner-panel"><div className="company-dashboard-stack"><div className="company-dashboard-list-item__top"><div><h2 className="ui-type-h3">Управление публикацией</h2><p className="ui-type-caption">{translateModerationStatus(draft.moderationStatus)}</p></div><Tag tone="accent">{translateModerationStatus(draft.moderationStatus)}</Tag></div>{draft.moderationReason ? <Alert tone="warning" title="Причина возврата" showIcon>{draft.moderationReason}</Alert> : null}<FormField label="Название" required><Input value={draft.title} onValueChange={(value) => onChange("title", value)} /></FormField><FormField label="Описание" required><Textarea value={draft.description} onValueChange={(value) => onChange("description", value)} rows={5} autoResize /></FormField><div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two"><FormField label="Тип публикации"><Select value={draft.opportunityType} onValueChange={(value) => onChange("opportunityType", value)} options={[{ value: "vacancy", label: "Вакансия" }, { value: "internship", label: "Стажировка" }, { value: "event", label: "Мероприятие" }, { value: "mentoring", label: "Менторская программа" }]} disabled={Number(draft.applicationsCount ?? 0) > 0} /></FormField><FormField label="Формат"><Select value={draft.employmentType} onValueChange={(value) => onChange("employmentType", value)} options={[{ value: "office", label: "Офис" }, { value: "hybrid", label: "Гибрид" }, { value: "remote", label: "Удаленно" }, { value: "online", label: "Онлайн" }]} /></FormField></div><FormField label="Срок или дата"><Input type="date" value={draft.expireAt} onValueChange={(value) => onChange("expireAt", value)} /></FormField><TypeFields draft={draft} onChange={onChange} /><OpportunityLocationPicker locationCity={draft.locationCity} locationAddress={draft.locationAddress} latitude={draft.latitude} longitude={draft.longitude} onFieldChange={onChange} /><FormField label="Теги через запятую"><Input value={draft.tags} onValueChange={(value) => onChange("tags", value)} /></FormField><FormField label="Контакты / ссылки"><div className="company-dashboard-social-links">{draft.contacts.map((item, index) => <div className="company-dashboard-social-links__row" key={`contact-${index}`}><Input value={item.value} onValueChange={(value) => { const next = draft.contacts.map((entry, entryIndex) => entryIndex === index ? { ...entry, value } : entry); onChange("contacts", next); }} placeholder="team@company.ru или https://..." /><Button type="button" variant="ghost" onClick={() => onChange("contacts", draft.contacts.filter((_, entryIndex) => entryIndex !== index).length ? draft.contacts.filter((_, entryIndex) => entryIndex !== index) : [{ type: "link", value: "" }])}>Удалить</Button></div>)}<Button type="button" variant="secondary" onClick={() => onChange("contacts", [...draft.contacts, { type: "link", value: "" }])}>Добавить</Button></div></FormField><FormField label="Медиа / вложения"><div className="company-dashboard-social-links">{draft.media.map((item, index) => <div className="company-dashboard-social-links__row" key={`media-${index}`}><Input value={item.title} onValueChange={(value) => onChange("media", draft.media.map((entry, entryIndex) => entryIndex === index ? { ...entry, title: value } : entry))} placeholder="Название медиа" /><Input value={item.url} onValueChange={(value) => onChange("media", draft.media.map((entry, entryIndex) => entryIndex === index ? { ...entry, url: value } : entry))} placeholder="https://..." /><Button type="button" variant="ghost" onClick={() => onChange("media", draft.media.filter((_, entryIndex) => entryIndex !== index).length ? draft.media.filter((_, entryIndex) => entryIndex !== index) : [{ title: "", url: "" }])}>Удалить</Button></div>)}<Button type="button" variant="secondary" onClick={() => onChange("media", [...draft.media, { title: "", url: "" }])}>Добавить</Button></div></FormField><div className="company-dashboard-panel__actions"><Button type="button" onClick={onSaveDraft} disabled={saving}>Сохранить как черновик</Button>{cap.canSubmit ? <Button type="button" variant="secondary" onClick={onSubmit} disabled={saving}>Отправить на модерацию</Button> : null}{cap.canArchive ? <Button type="button" variant="secondary" onClick={onArchive} disabled={saving}>Снять с публикации/архивировать</Button> : null}<Button type="button" variant="secondary" href={onPreview} disabled={!draft.id}>Просмотр публичной версии</Button>{cap.canDelete ? <Button type="button" variant="ghost" onClick={onDelete} disabled={saving}>Удалить</Button> : null}<Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Отмена</Button></div></div></Card>;
}

function DetailLayout({
  item,
  related,
  applyState,
  onApply,
  hidePublicActions = false,
  ownerPanel = null,
  menuOpen = false,
  menuRef = null,
  onMenuToggle = () => {},
  onShare = () => {},
  onComplaint = () => {},
  buildDetailHref = (entry) => buildOpportunityDetailRoute(entry.id),
  catalogHref = "/opportunities",
  animated = true,
  embedded = false,
}) {
  const vm = useMemo(() => getOpportunityDetailPresentation(item), [item]);
  const rel = (Array.isArray(related) ? related : []).slice(0, 2);
  const applyButtonLabel = applyLabel(item.opportunityType, applyState.status);
  const intro = desc(item.description);
  const c = contacts(item.contactsJson);
  const m = media(item.mediaContentJson);
  const s = socials(item.companySocials);
  const publicCompanyHref = item?.employerId ? buildCompanyPublicRoute(item.employerId) : "";
  const { opportunityId: favoriteOpportunityId, isFavorite, toggleFavorite } = useFavoriteOpportunity(item?.id);

  return <div className={cn("opportunity-card-page__grid", embedded && "opportunity-card-page__grid--embedded")}><div className="opportunity-card-page__main"><Card className={cn("opportunity-focus-card", animated && "opportunity-card-fade-up")}><div className="opportunity-focus-card__eyebrow"><Tag>{vm.typeLabel}</Tag>{!hidePublicActions ? <div className="opportunity-focus-card__toolbar"><IconButton type="button" label={isFavorite ? "Убрать возможность из избранного" : "Сохранить возможность"} size="xl" className="opportunity-focus-card__toolbar-button ui-opportunity-mini-card__favorite" aria-pressed={isFavorite} active={isFavorite} data-opportunity-id={favoriteOpportunityId ?? undefined} onClick={toggleFavorite}><HeartIcon /></IconButton><div ref={menuRef} className={cn("opportunity-focus-card__menu", menuOpen && "is-open")}><IconButton type="button" label="Ещё действия" size="xl" className="opportunity-focus-card__toolbar-button" aria-haspopup="menu" aria-expanded={menuOpen} onClick={onMenuToggle}><MoreIcon /></IconButton>{menuOpen ? <div className="opportunity-focus-card__menu-popover" role="menu" aria-label="Действия с карточкой"><button type="button" className="opportunity-focus-card__menu-action" role="menuitem" onClick={onComplaint}>Пожаловаться</button><button type="button" className="opportunity-focus-card__menu-action" role="menuitem" onClick={onShare}>Поделиться</button></div> : null}</div></div> : null}</div><div className="opportunity-focus-card__copy"><h1 className="ui-type-h2">{item.title}</h1><p className="ui-type-body">{vm.metaLine}</p></div><dl className="opportunity-focus-card__facts"><div className="opportunity-focus-card__fact"><dt>Тип:</dt><dd>{vm.typeLabel}</dd></div><div className="opportunity-focus-card__fact"><dt>Формат:</dt><dd>{vm.employmentLabel || "Не указан"}</dd></div><div className="opportunity-focus-card__fact"><dt>Город:</dt><dd>{item.locationCity || "Не указан"}</dd></div><div className="opportunity-focus-card__fact"><dt>Адрес:</dt><dd>{item.locationAddress || "Не указан"}</dd></div><div className="opportunity-focus-card__fact"><dt>Опубликовано:</dt><dd>{formatOpportunityDateTime(item.publishAt) || "Не указано"}</dd></div><div className="opportunity-focus-card__fact"><dt>Срок:</dt><dd>{item.expireAt ? formatOpportunityDateTime(item.expireAt) : "Не указан"}</dd></div></dl>{vm.summaryAccent ? <div className="opportunity-focus-card__details"><strong className="ui-type-h3">{vm.summaryAccent}</strong>{vm.summaryNote ? <p className="ui-type-body">{vm.summaryNote}</p> : null}</div> : null}{uniq(item.tags).length ? <div className="opportunity-focus-card__chips">{uniq(item.tags).map((tag) => <Tag key={tag} tone="accent">{tag}</Tag>)}</div> : null}{!hidePublicActions ? <div className="opportunity-focus-card__footer"><div className="opportunity-focus-card__watchers">{item.expireAt ? `До ${formatOpportunityDateTime(item.expireAt)}` : "Срок не указан"}</div><div className="opportunity-focus-card__actions"><Button type="button" className="opportunity-focus-card__apply" onClick={onApply} disabled={applyState.status === "saving" || applyState.status === "success"}>{applyButtonLabel}</Button></div></div> : null}</Card>{!hidePublicActions && applyState.status === "error" ? <Alert tone="error" title="Не удалось отправить заявку" showIcon>{applyState.error}</Alert> : null}{!hidePublicActions && applyState.status === "success" ? <Alert tone="success" title={applyState.successTitle} showIcon>{applyState.successMessage}</Alert> : null}{ownerPanel}<Card className={cn("opportunity-media-panel", animated && "opportunity-card-fade-up opportunity-card-fade-up--delay-1")}><div className="opportunity-media-panel__header"><h2 className="ui-type-h4">Медиа</h2><p className="ui-type-caption">Материалы, которые компания приложила к карточке возможности.</p></div>{m.length ? <div className="opportunity-story-card__intro">{m.map((entry, index) => entry.url ? <AppLink key={`${entry.title}-${index}`} href={entry.url} className="opportunity-card-page__more-link">{entry.title}</AppLink> : <p key={`${entry.title}-${index}`} className="ui-type-body">{entry.title}</p>)}</div> : <p className="ui-type-body">Компания пока не добавила медиа-материалы к этой карточке.</p>}</Card><Card className={cn("opportunity-story-card", animated && "opportunity-card-fade-up opportunity-card-fade-up--delay-2")}><div className="opportunity-story-card__intro">{intro.map((paragraph, index) => <p key={`${paragraph}-${index}`} className="ui-type-body">{paragraph}</p>)}</div><section className="opportunity-story-section"><div className="opportunity-story-section__header"><h2 className="ui-type-h3">О публикации</h2></div><ul className="opportunity-story-list"><li>{formatOpportunityDateTime(item.publishAt) || "Дата не указана"}</li><li>{locationLine(item) || "Локация не указана."}</li><li>{item.expireAt ? `До ${formatOpportunityDateTime(item.expireAt)}` : "Срок не указан"}</li></ul></section>{c.length ? <section className="opportunity-story-section"><div className="opportunity-story-section__header"><h2 className="ui-type-h3">Контакты</h2></div><ul className="opportunity-story-list">{c.map((entry) => <li key={`${entry.type}-${entry.value}`}>{entry.type === "email" ? <AppLink href={`mailto:${entry.value}`}>{entry.value}</AppLink> : entry.type === "phone" ? <AppLink href={`tel:${entry.value.replace(/\s+/g, "")}`}>{entry.value}</AppLink> : <AppLink href={entry.value}>{entry.value}</AppLink>}</li>)}</ul></section> : null}{uniq(item.tags).length ? <section className="opportunity-story-section"><div className="opportunity-story-section__header"><h2 className="ui-type-h2">Ключевые навыки</h2></div><div className="opportunity-skill-cloud">{uniq(item.tags).map((tag) => <Tag key={tag} tone="accent">{tag}</Tag>)}</div></section> : null}{hidePublicActions ? null : <><p className="ui-type-caption">{formatOpportunityDateTime(item.publishAt)}</p><div className="opportunity-story-card__bottom-actions"><Button type="button" className="opportunity-story-card__bottom-primary" onClick={onApply} disabled={applyState.status === "saving" || applyState.status === "success"}>{applyButtonLabel}</Button><Button type="button" variant="secondary" className="opportunity-story-card__bottom-secondary" onClick={onComplaint}>{item.opportunityType === "event" ? "Пожаловаться на событие" : "Пожаловаться на возможность"}</Button></div></>}</Card></div><aside className="opportunity-card-page__side"><Card className={cn("company-spotlight", animated && "opportunity-card-fade-up opportunity-card-fade-up--delay-1")}><div className="company-spotlight__company"><Avatar size="lg" initials={initials(item.companyName)} className="company-spotlight__avatar company-spotlight__avatar--brand" /><div className="company-spotlight__copy">{publicCompanyHref ? <AppLink href={publicCompanyHref} className="opportunity-card-page__more-link"><h2 className="ui-type-h4">{item.companyName}</h2></AppLink> : <h2 className="ui-type-h4">{item.companyName}</h2>}<p className="ui-type-body">{item.companyDescription || "Описание компании пока не заполнено."}</p></div></div>{item.companyLegalAddress ? <p className="ui-type-body">{item.companyLegalAddress}</p> : null}{s.length ? <div className="opportunity-story-card__intro">{s.map((entry) => <AppLink key={entry.id} href={entry.url} className="opportunity-card-page__more-link">{entry.label}</AppLink>)}</div> : null}<div className="company-spotlight__footer">{publicCompanyHref ? <Button href={publicCompanyHref} variant="secondary" className="company-spotlight__recommend">Открыть профиль компании</Button> : null}<IconButton href={c[0]?.value ? `mailto:${c[0].value}` : "#contacts"} label="Написать компании" variant="outline" size="xl" className="company-spotlight__message"><span aria-hidden="true">✉</span></IconButton></div></Card><div className="opportunity-card-page__matches"><p className="ui-type-caption opportunity-card-page__matches-label">Вам могут подойти</p>{rel.length ? rel.map((relatedItem, index) => <OpportunityMiniCard key={relatedItem.id} variant="compact" item={{ id: relatedItem.id, ...getOpportunityMiniCardPresentation(relatedItem), company: relatedItem.companyName, note: relatedItem.locationAddress || "", chips: uniq(relatedItem.tags).slice(0, 3) }} className={cn("related-opportunity-entry", animated && `opportunity-card-fade-up opportunity-card-fade-up--delay-${index + 2}`)} detailAction={{ href: buildDetailHref(relatedItem), label: "Подробнее", variant: "secondary" }} />) : <Card><EmptyState title="Пока нет похожих публикаций" description="Другие возможности появятся здесь автоматически, когда каталог станет шире." tone="neutral" compact /></Card>}<AppLink href={catalogHref} className="opportunity-card-page__more-link">Еще возможности в каталоге</AppLink></div></aside></div>;
}


export function OpportunityDetailPreview() { const preview = demoOpportunity("design-ui-ux"); if (!preview) return null; return <DetailLayout item={preview} related={demoRelated(preview.id)} applyState={applyState()} onApply={() => {}} buildDetailHref={(entry) => `#${entry.id}`} catalogHref="#catalog" animated={false} embedded />; }

export function OpportunityDetailCardApp() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const opportunityId = params.id;
  const authSession = useAuthSession();
  const [state, setState] = useState({ status: "loading", item: null, related: [], error: null, source: "api" });
  const [apply, setApply] = useState(applyState());
  const [companyProfile, setCompanyProfile] = useState(null);
  const [ownerState, setOwnerState] = useState({ isEditing: false, draft: null, saveState: { status: "idle", error: "", message: "" } });
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
    if (!menuOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [menuOpen]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      const demoItem = demoOpportunity(opportunityId);
      if (demoItem) {
        setState({ status: "ready", item: demoItem, related: demoRelated(opportunityId), error: null, source: "demo" });
        return;
      }
      if (!numericId(opportunityId)) {
        setState({ status: "error", item: null, related: [], error: new Error("Карточка возможности не найдена."), source: "api" });
        return;
      }
      try {
        const [item, all] = await Promise.all([getOpportunity(opportunityId, controller.signal), getOpportunities(controller.signal)]);
        setState({ status: "ready", item, related: (Array.isArray(all) ? all : []).filter((entry) => String(entry.id) !== String(opportunityId)).slice(0, 2), error: null, source: "api" });
      } catch (error) {
        if (!controller.signal.aborted) setState({ status: "error", item: null, related: [], error, source: "api" });
      }
    }
    setApply(applyState());
    setMenuOpen(false);
    setShareModalOpen(false);
    setShareContactsState(createShareContactsState());
    setShareBusyKey("");
    load();
    return () => controller.abort();
  }, [opportunityId]);

  useEffect(() => {
    if (authSession.status !== "authenticated" || authSession.user?.role !== "company") {
      setCompanyProfile(null);
      return;
    }
    const controller = new AbortController();
    async function loadProfile() {
      try {
        const profile = await getCompanyProfile(controller.signal);
        if (!controller.signal.aborted) {
          setCompanyProfile(profile);
        }
      } catch {
        if (!controller.signal.aborted) {
          setCompanyProfile(null);
        }
      }
    }
    loadProfile();
    return () => controller.abort();
  }, [authSession.status, authSession.user?.role]);

  const item = state.item;
  const isOwner = Boolean(item && authSession.status === "authenticated" && authSession.user?.role === "company" && companyProfile && String(companyProfile.profileId ?? companyProfile.id ?? "") === String(item.employerId ?? ""));
  const previewMode = isOwner && searchParams.get("preview") === "public";
  const capabilities = useMemo(() => (item ? getOpportunityOwnerCapabilities(item, { isOwner }) : null), [item, isOwner]);

  useEffect(() => {
    if (item && isOwner && !previewMode && !ownerState.isEditing) {
      setOwnerState((current) => ({ ...current, draft: createOpportunityDraft(item) }));
    }
  }, [item, isOwner, previewMode, ownerState.isEditing]);

  async function handleApply() {
    setApply(applyState("saving"));
    if (state.source === "demo") {
      setApply(applyState("success", successCopy(state.item?.opportunityType)));
      return;
    }
    try {
      const application = await applyToOpportunity(opportunityId);
      upsertCandidateApplication(application);
      setApply(applyState("success", successCopy(state.item?.opportunityType)));
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        await refreshCandidateApplications({ force: true }).catch(() => {});
        setApply(applyState("success", successCopy(state.item?.opportunityType, "existing")));
        return;
      }
      setApply(applyState("error", { error: error?.message ?? "Не удалось отправить отклик." }));
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
      const nextContacts = await getCandidateContacts();
      const items = (Array.isArray(nextContacts) ? nextContacts : []).map(mapSocialUserToCard).filter((entry) => entry?.id && entry?.name);
      setShareContactsState(createShareContactsState("ready", { items }));
    } catch (error) {
      setShareContactsState(createShareContactsState("error", { error: error?.message ?? "Не удалось загрузить список контактов." }));
    }
  }

  async function handleShareWithContact(contact) {
    const currentUrl = typeof window !== "undefined" ? window.location.href : buildOpportunityDetailRoute(opportunityId);
    const shareTitle = String(state.item?.title || "Возможность").trim();
    const shareText = `Смотри, нашёл интересную возможность: ${shareTitle}
${currentUrl}`;
    const contactKey = String(contact?.id ?? contact?.email ?? contact?.name ?? "contact");
    const candidateId = Number(contact?.userId);
    setShareBusyKey(contactKey);

    try {
      if (!Number.isFinite(candidateId) || !state.item?.id) {
        throw new Error("Не удалось определить получателя рекомендации.");
      }
      await createCandidateRecommendation({ candidateId, opportunityId: Number(state.item.id), message: shareText });
      if (contact?.email && typeof window !== "undefined" && typeof window.open === "function") {
        const subject = encodeURIComponent(`Поделиться возможностью: ${shareTitle}`);
        const body = encodeURIComponent(shareText);
        window.open(`mailto:${contact.email}?subject=${subject}&body=${body}`, "_self");
        setShareModalOpen(false);
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
      }
      setShareModalOpen(false);
    } finally {
      setShareBusyKey("");
    }
  }

  function handleComplaint() {}
  function changeDraft(field, value) { setOwnerState((current) => ({ ...current, draft: { ...(current.draft ?? createOpportunityDraft(item)), [field]: value } })); }
  function changeDraftContacts(next) { setOwnerState((current) => ({ ...current, draft: { ...(current.draft ?? createOpportunityDraft(item)), contacts: next } })); }
  function changeDraftMedia(next) { setOwnerState((current) => ({ ...current, draft: { ...(current.draft ?? createOpportunityDraft(item)), media: next } })); }
  function startEditing() { setOwnerState({ isEditing: true, draft: createOpportunityDraft(item), saveState: { status: "idle", error: "", message: "" } }); }
  function stopEditing() { setOwnerState({ isEditing: false, draft: createOpportunityDraft(item), saveState: { status: "idle", error: "", message: "" } }); }

  async function saveOwner(saveMode) {
    if (!item || !ownerState.draft) return;
    const errors = saveMode === "submit" ? validateOpportunityDraftForSubmit(ownerState.draft) : [];
    if (errors.length) { setOwnerState((current) => ({ ...current, saveState: { status: "error", error: errors[0], message: "" } })); return; }
    setOwnerState((current) => ({ ...current, saveState: { status: "saving", error: "", message: "" } }));
    try {
      await updateOpportunity(item.id, { ...buildOpportunityPayload(ownerState.draft, { saveMode }), moderationStatus: saveMode === "submit" ? "pending" : ownerState.draft.moderationStatus });
      const refreshed = await getOpportunity(item.id);
      setState((current) => ({ ...current, item: refreshed }));
      setOwnerState({ isEditing: false, draft: createOpportunityDraft(refreshed), saveState: { status: "success", error: "", message: saveMode === "submit" ? "Публикация отправлена на модерацию." : "Черновик сохранен." } });
    } catch (error) {
      setOwnerState((current) => ({ ...current, saveState: { status: "error", error: error?.message ?? "Не удалось сохранить публикацию.", message: "" } }));
    }
  }

  async function archiveOwner() { if (!item) return; await updateOpportunity(item.id, { saveMode: "archive", moderationStatus: "archived" }); const refreshed = await getOpportunity(item.id); setState((current) => ({ ...current, item: refreshed })); }
  async function deleteOwner() { if (!item) return; await deleteOpportunity(item.id); setState((current) => ({ ...current, status: "ready", item: null, related: [] })); }

  const ownerPanel = item && isOwner && !previewMode ? (ownerState.isEditing ? <OwnerEditor draft={ownerState.draft} onChange={(field, value) => { if (field === "contacts") return changeDraftContacts(value); if (field === "media") return changeDraftMedia(value); changeDraft(field, value); }} onSaveDraft={() => saveOwner("draft")} onSubmit={() => saveOwner("submit")} onPreview={buildOpportunityPreviewRoute(item.id)} onClose={stopEditing} onArchive={archiveOwner} onDelete={deleteOwner} saving={ownerState.saveState.status === "saving"} /> : <Card className="opportunity-owner-panel"><div className="company-dashboard-stack"><div className="company-dashboard-list-item__top"><div><h2 className="ui-type-h3">Управление публикацией</h2><p className="ui-type-caption">{translateModerationStatus(item.moderationStatus)}</p></div><Tag tone="accent">{translateModerationStatus(item.moderationStatus)}</Tag></div>{item.moderationReason ? <Alert tone="warning" title="Причина возврата" showIcon>{item.moderationReason}</Alert> : null}{capabilities?.canViewResponses ? <Button href="/company/dashboard/responses" variant="secondary">{"Открыть отклики"}</Button> : null}<div className="company-dashboard-panel__actions"><Button type="button" onClick={startEditing}>{"Редактировать"}</Button><Button type="button" variant="secondary" onClick={() => { if (typeof window !== "undefined") { window.location.href = buildOpportunityPreviewRoute(item.id); } }}>{"Просмотр публичной версии"}</Button>{capabilities?.canArchive ? <Button type="button" variant="secondary" onClick={archiveOwner}>Снять с публикации/архивировать</Button> : null}{capabilities?.canDelete ? <Button type="button" variant="ghost" onClick={deleteOwner}>Удалить</Button> : null}</div>{ownerState.saveState.status === "error" ? <Alert tone="error" title="Операция не выполнена" showIcon>{ownerState.saveState.error}</Alert> : null}{ownerState.saveState.status === "success" ? <Alert tone="success" title="Изменения сохранены" showIcon>{ownerState.saveState.message}</Alert> : null}</div></Card>) : null;

  return <main className="opportunity-card-page" data-testid="opportunity-detail-page"><div className="opportunity-card-page__shell ui-page-shell"><PortalHeader navItems={NAV_ITEMS} currentKey="opportunities" actionHref="/candidate/profile" actionLabel={"Профиль"} className="opportunity-card-header opportunity-card-fade-up" />{state.status === "loading" ? <Loader label={"Загружаем карточку возможности"} surface /> : null}{state.status === "error" ? <Alert tone="error" title={"Не удалось загрузить карточку"} showIcon>{state.error?.message ?? "Попробуйте открыть возможность позже."}</Alert> : null}{state.status === "ready" && state.item ? <DetailLayout item={state.item} related={state.related} applyState={apply} onApply={handleApply} hidePublicActions={isOwner && !previewMode} ownerPanel={ownerPanel} menuOpen={menuOpen} menuRef={menuRef} onMenuToggle={() => setMenuOpen((current) => !current)} onShare={async () => { setMenuOpen(false); await openShareModal(); }} onComplaint={() => { setMenuOpen(false); handleComplaint(); }} buildDetailHref={(entry) => buildOpportunityDetailRoute(entry.id)} catalogHref="/opportunities" /> : null}<Modal open={shareModalOpen} onClose={() => { setShareModalOpen(false); setShareBusyKey(""); }} title={"Поделиться возможностью"} description={"Выберите контакт, кому хотите отправить карточку публикации."} size="md" className="opportunity-share-modal">{shareContactsState.status === "loading" ? <Loader label={"Загружаем контакты"} /> : null}{shareContactsState.status === "error" ? <Alert tone="error" title={"Не удалось загрузить контакты"} showIcon>{shareContactsState.error}</Alert> : null}{shareContactsState.status === "ready" && !shareContactsState.items.length ? <EmptyState eyebrow={"Пока пусто"} title={"Список контактов пока пуст"} description={"Добавьте контакты в кабинете кандидата, и они появятся здесь для быстрого шаринга."} tone="neutral" compact /> : null}{shareContactsState.status === "ready" && shareContactsState.items.length ? <div className="opportunity-share-modal__list">{shareContactsState.items.map((contact) => <div key={contact.id} className="opportunity-share-modal__item"><div className="opportunity-share-modal__identity"><Avatar initials={String(contact.name || "").slice(0, 2).toUpperCase() || "?"} shape="rounded" className="opportunity-share-modal__avatar" /><div className="opportunity-share-modal__copy"><strong>{contact.name}</strong><span>{contact.email || "Контакт без email"}</span></div></div><Button type="button" variant="secondary" loading={shareBusyKey === String(contact.id)} disabled={Boolean(shareBusyKey) && shareBusyKey !== String(contact.id)} onClick={() => { handleShareWithContact(contact); }}>{"Поделиться"}</Button></div>)}</div> : null}</Modal></div></main>;
}
