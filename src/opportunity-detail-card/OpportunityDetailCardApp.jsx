import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AppLink } from "../app/AppLink";
import { PUBLIC_HEADER_NAV_ITEMS, buildCompanyPublicRoute, buildOpportunityDetailRoute, routes } from "../app/routes";
import { createCandidateOpportunityShare, getCandidateEducation, getCandidateOpportunitySocialContext, getCandidateProfile } from "../api/candidate";
import { getCompanyProfile } from "../api/company";
import { applyToOpportunity, deleteOpportunity, getOpportunity, getOpportunities, updateOpportunity } from "../api/opportunities";
import { useAuthSession } from "../auth/api";
import { refreshCandidateApplications, upsertCandidateApplication } from "../candidate-portal/candidate-applications-store";
import { getCandidateOnboardingState } from "../candidate-portal/onboarding";
import { CandidateProfileGateModal } from "../candidate-portal/onboarding-widgets";
import { canShareOpportunityWithRelationship, mapSocialUserToCard } from "../candidate-portal/social";
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
    duration: "3 месяца"
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
    salaryTo: 180000
  }
};

function HeartIcon() {return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M10 16.2s-5.2-3.5-6.7-6.6C2.1 7.2 3.2 4.5 6 4.5c1.5 0 2.7.8 4 2.3 1.3-1.5 2.5-2.3 4-2.3 2.8 0 3.9 2.7 2.7 5.1-1.5 3.1-6.7 6.6-6.7 6.6Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;}
function MoreIcon() {return <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><circle cx="4.5" cy="10" r="1.7" /><circle cx="10" cy="10" r="1.7" /><circle cx="15.5" cy="10" r="1.7" /></svg>;}
function uniq(items) {return [...new Set((Array.isArray(items) ? items : []).map((item) => String(item).trim()).filter(Boolean))];}
function json(value, fallback) {if (!value || typeof value !== "string") return fallback;try {return JSON.parse(value);} catch {return fallback;}}
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
function media(value) {const parsed = json(value, []);return Array.isArray(parsed) ? parsed.map((item) => ({ title: String(item?.title ?? item?.label ?? "").trim(), url: String(item?.url ?? item?.href ?? item?.value ?? "").trim() })).filter((item) => item.title || item.url) : [];}
function socials(value) {const parsed = json(value, null);return Array.isArray(parsed) ? parsed.map((item, index) => ({ id: `social-${index}`, label: String(item?.type ?? item?.label ?? item ?? "").trim() || `social-${index}`, url: String(item?.url ?? item?.href ?? item?.value ?? item ?? "").trim() })).filter((item) => item.url) : [];}
function desc(value) {return String(value ?? "").split(/\r?\n\r?\n|\r?\n/).map((item) => item.trim()).filter(Boolean);}
function initials(name) {return String(name || "").split(/\s+/).filter(Boolean).slice(0, 2).map((item) => item[0] || "").join("").toLowerCase() || "it";}
function locationLine(item) {return [item.locationCity, item.locationAddress].filter(Boolean).join(", ");}
function demoOpportunity(id) {return DEMO[String(id)] ?? null;}
function demoRelated(id) {return Object.values(DEMO).filter((item) => String(item.id) !== String(id)).slice(0, 2);}
function numericId(value) {return /^\d+$/.test(String(value ?? "").trim());}
function applyLabel(type, status) {if (status === "saving") return "Отправляем...";if (status === "success") return isEventOpportunity(type) ? "Заявка отправлена" : "Отклик отправлен";return getOpportunityApplyLabel(type);}
function applyState(status = "idle", overrides = {}) {return { status, error: "", successTitle: "", successMessage: "", ...overrides };}
function createShareContactsState(status = "idle", overrides = {}) {return { status, items: [], error: "", ...overrides };}
function getPeerVisibilityDefaultFromProfile(profile) {
  const links = profile?.links && typeof profile.links === "object" ? profile.links : {};
  const preferences = links?.preferences && typeof links.preferences === "object" ? links.preferences : {};
  const social = preferences?.social && typeof preferences.social === "object" ? preferences.social : {};
  return Boolean(social.peerVisibilityDefault);
}
function successCopy(type, mode = "created") {const event = isEventOpportunity(type);return mode === "existing" ? { successTitle: event ? "Заявка уже отправлена" : "Отклик уже отправлен", successMessage: "Он уже есть в вашем кабинете кандидата." } : { successTitle: event ? "Заявка отправлена" : "Отклик отправлен", successMessage: "Он появился в вашем кабинете кандидата." };}

function TypeFields({ draft, onChange }) {
  if (draft.opportunityType === "vacancy") return <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two"><FormField label="Зарплата от" required><Input type="number" value={draft.salaryFrom} onValueChange={(value) => onChange("salaryFrom", value)} /></FormField><FormField label="Зарплата до" required><Input type="number" value={draft.salaryTo} onValueChange={(value) => onChange("salaryTo", value)} /></FormField></div>;
  if (draft.opportunityType === "internship") return <div className="company-dashboard-stack"><Checkbox label="Стажировка оплачиваемая" checked={Boolean(draft.isPaid)} onChange={(e) => onChange("isPaid", e.target.checked)} />{draft.isPaid !== false ? <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two"><FormField label="Стипендия от" required><Input type="number" value={draft.stipendFrom} onValueChange={(value) => onChange("stipendFrom", value)} /></FormField><FormField label="Стипендия до" required><Input type="number" value={draft.stipendTo} onValueChange={(value) => onChange("stipendTo", value)} /></FormField></div> : null}<FormField label="Длительность" required><Input value={draft.duration} onValueChange={(value) => onChange("duration", value)} /></FormField></div>;
  if (draft.opportunityType === "event") return <div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two"><FormField label="Дата и время начала" required><Input type="datetime-local" value={draft.eventStartAt} onValueChange={(value) => onChange("eventStartAt", value)} /></FormField><FormField label="Дедлайн регистрации" required><Input type="datetime-local" value={draft.registrationDeadline} onValueChange={(value) => onChange("registrationDeadline", value)} /></FormField></div>;
  if (draft.opportunityType === "mentoring") return <div className="company-dashboard-stack"><FormField label="Длительность" required><Input value={draft.duration} onValueChange={(value) => onChange("duration", value)} /></FormField><div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two"><FormField label="Частота встреч" required><Input value={draft.meetingFrequency} onValueChange={(value) => onChange("meetingFrequency", value)} /></FormField><FormField label="Количество мест" required><Input type="number" value={draft.seatsCount} onValueChange={(value) => onChange("seatsCount", value)} /></FormField></div></div>;
  return null;
}

function OwnerEditor({ draft, onChange, onSaveDraft, onSubmit, onPreview, onClose, onArchive, onDelete, saving }) {
  const cap = getOpportunityOwnerCapabilities(draft, { isOwner: true });
  return <Card className="opportunity-owner-panel"><div className="company-dashboard-stack"><div className="company-dashboard-list-item__top"><div><h2 className="ui-type-h3">Управление публикацией</h2><p className="ui-type-caption">{translateModerationStatus(draft.moderationStatus)}</p></div><Tag tone="accent">{translateModerationStatus(draft.moderationStatus)}</Tag></div>{draft.moderationReason ? <Alert tone="warning" title="Причина возврата" showIcon>{draft.moderationReason}</Alert> : null}<FormField label="Название" required><Input value={draft.title} onValueChange={(value) => onChange("title", value)} /></FormField><FormField label="Описание" required><Textarea value={draft.description} onValueChange={(value) => onChange("description", value)} rows={5} autoResize /></FormField><div className="candidate-project-editor-form-grid candidate-project-editor-form-grid--two"><FormField label="Тип публикации"><Select value={draft.opportunityType} onValueChange={(value) => onChange("opportunityType", value)} options={[{ value: "vacancy", label: "Вакансия" }, { value: "internship", label: "Стажировка" }, { value: "event", label: "Мероприятие" }, { value: "mentoring", label: "Менторская программа" }]} disabled={Number(draft.applicationsCount ?? 0) > 0} /></FormField><FormField label="Формат"><Select value={draft.employmentType} onValueChange={(value) => onChange("employmentType", value)} options={[{ value: "office", label: "Офис" }, { value: "hybrid", label: "Гибрид" }, { value: "remote", label: "Удаленно" }, { value: "online", label: "Онлайн" }]} /></FormField></div><FormField label="Срок или дата"><Input type="date" value={draft.expireAt} onValueChange={(value) => onChange("expireAt", value)} /></FormField><TypeFields draft={draft} onChange={onChange} /><OpportunityLocationPicker locationCity={draft.locationCity} locationAddress={draft.locationAddress} latitude={draft.latitude} longitude={draft.longitude} onFieldChange={onChange} /><FormField label="Теги через запятую"><Input value={draft.tags} onValueChange={(value) => onChange("tags", value)} /></FormField><FormField label="Контакты / ссылки"><div className="company-dashboard-social-links">{draft.contacts.map((item, index) => <div className="company-dashboard-social-links__row" key={`contact-${index}`}><Input value={item.value} onValueChange={(value) => {const next = draft.contacts.map((entry, entryIndex) => entryIndex === index ? { ...entry, value } : entry);onChange("contacts", next);}} placeholder="team@company.ru или https://..." /><Button type="button" variant="ghost" onClick={() => onChange("contacts", draft.contacts.filter((_, entryIndex) => entryIndex !== index).length ? draft.contacts.filter((_, entryIndex) => entryIndex !== index) : [{ type: "link", value: "" }])}>Удалить</Button></div>)}<Button type="button" variant="secondary" onClick={() => onChange("contacts", [...draft.contacts, { type: "link", value: "" }])}>Добавить</Button></div></FormField><FormField label="Медиа / вложения"><div className="company-dashboard-social-links">{draft.media.map((item, index) => <div className="company-dashboard-social-links__row" key={`media-${index}`}><Input value={item.title} onValueChange={(value) => onChange("media", draft.media.map((entry, entryIndex) => entryIndex === index ? { ...entry, title: value } : entry))} placeholder="Название медиа" /><Input value={item.url} onValueChange={(value) => onChange("media", draft.media.map((entry, entryIndex) => entryIndex === index ? { ...entry, url: value } : entry))} placeholder="https://..." /><Button type="button" variant="ghost" onClick={() => onChange("media", draft.media.filter((_, entryIndex) => entryIndex !== index).length ? draft.media.filter((_, entryIndex) => entryIndex !== index) : [{ title: "", url: "" }])}>Удалить</Button></div>)}<Button type="button" variant="secondary" onClick={() => onChange("media", [...draft.media, { title: "", url: "" }])}>Добавить</Button></div></FormField><div className="company-dashboard-panel__actions"><Button type="button" onClick={onSaveDraft} disabled={saving}>Сохранить как черновик</Button>{cap.canSubmit ? <Button type="button" variant="secondary" onClick={onSubmit} disabled={saving}>Отправить на модерацию</Button> : null}{cap.canArchive ? <Button type="button" variant="secondary" onClick={onArchive} disabled={saving}>Снять с публикации/архивировать</Button> : null}<Button type="button" variant="secondary" href={onPreview} disabled={!draft.id}>Просмотр публичной версии</Button>{cap.canDelete ? <Button type="button" variant="ghost" onClick={onDelete} disabled={saving}>Удалить</Button> : null}<Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Отмена</Button></div></div></Card>;
}

const EMPTY_SOCIAL_CONTEXT = Object.freeze({
  companyContacts: [],
  networkCandidates: [],
  peers: [],
  counts: {
    peerCount: 0,
    incomingShareCount: 0,
    networkCandidateCount: 0
  }
});

function createEmptySocialContext() {
  return {
    companyContacts: [],
    networkCandidates: [],
    peers: [],
    counts: {
      peerCount: 0,
      incomingShareCount: 0,
      networkCandidateCount: 0
    }
  };
}

function normalizeCompanyContacts(items, fallbackItems = []) {
  const normalized = Array.isArray(items) ? items.filter(Boolean) : [];
  if (normalized.length) {
    return normalized;
  }

  return fallbackItems.map((entry) => ({
    type: entry.type,
    label: entry.type === "email" ? "Email компании" : entry.type === "phone" ? "Телефон компании" : "Ссылка компании",
    value: entry.value,
    href: entry.type === "email" ?
    `mailto:${entry.value}` :
    entry.type === "phone" ?
    `tel:${String(entry.value).replace(/\s+/g, "")}` :
    entry.value
  }));
}

function formatSocialPersonMeta(person) {
  return [person?.city, person?.email].filter(Boolean).join(" В· ");
}

function OpportunitySocialPersonCard({ person, onShareCandidate, shareBusyKey = "" }) {
  const shareKey = String(person?.id ?? person?.userId ?? person?.email ?? person?.name ?? "contact");
  const canShare = canShareOpportunityWithRelationship(person?.relationship);
  const meta = formatSocialPersonMeta(person);

  return (
    <div className="opportunity-social-person">
      <div className="opportunity-social-person__head">
        <div className="opportunity-social-person__identity">
          <Avatar
            initials={initials(person?.name)}
            shape="rounded"
            className="opportunity-social-person__avatar" />
          
          <div className="opportunity-social-person__copy">
            <strong>{person?.name || "Кандидат"}</strong>
            {meta ? <span>{meta}</span> : null}
          </div>
        </div>
        {person?.badge ? <Tag tone={person.badge.tone}>{person.badge.label}</Tag> : null}
      </div>

      {Array.isArray(person?.reasons) && person.reasons.length ?
      <div className="opportunity-social-person__reasons">
          {person.reasons.map((reason) =>
        <Tag key={reason} tone="neutral">
              {reason}
            </Tag>
        )}
        </div> :
      null}

      {Array.isArray(person?.skills) && person.skills.length ?
      <div className="opportunity-social-person__skills">
          {person.skills.map((skill) =>
        <Tag key={skill} tone="accent">
              {skill}
            </Tag>
        )}
        </div> :
      null}

      <div className="opportunity-social-person__actions">
        <Button href={person?.href} variant="secondary">
          Открыть профиль
        </Button>
        {canShare && onShareCandidate ?
        <Button
          type="button"
          variant="ghost"
          loading={shareBusyKey === shareKey}
          disabled={Boolean(shareBusyKey) && shareBusyKey !== shareKey}
          onClick={() => onShareCandidate(person)}>
          
            Поделиться возможностью
          </Button> :
        null}
      </div>
    </div>);

}

function OpportunitySocialSections({
  status = "idle",
  error = "",
  socialContext = EMPTY_SOCIAL_CONTEXT,
  fallbackCompanyContacts = [],
  onShareCandidate,
  shareBusyKey = "",
  showAuthHint = false
}) {
  const companyContacts = normalizeCompanyContacts(socialContext?.companyContacts, fallbackCompanyContacts);
  const networkCandidates = (Array.isArray(socialContext?.networkCandidates) ? socialContext.networkCandidates : []).map(mapSocialUserToCard);
  const peers = (Array.isArray(socialContext?.peers) ? socialContext.peers : []).map(mapSocialUserToCard);
  const incomingShareCount = Number(socialContext?.counts?.incomingShareCount ?? 0);

  return (
    <div className="opportunity-social-context">
      <div className="opportunity-social-context__header">
        <div>
          <h2 className="ui-type-h3">Люди вокруг возможности</h2>
          <p className="ui-type-body">
            Контакты компании, люди из вашей сети и peers по этой возможности собраны в одном месте.
          </p>
        </div>
        {incomingShareCount > 0 ? <Tag tone="accent">{incomingShareCount} входящих шаров</Tag> : null}
      </div>

      {status === "loading" ? <Loader label="Загружаем social-context" /> : null}
      {error ?
      <Alert tone="warning" title="Не всё удалось загрузить" showIcon>
          {error}
        </Alert> :
      null}

      <div className="opportunity-social-context__grid">
        <Card className="opportunity-social-context__section">
          <div className="opportunity-social-context__section-head">
            <h3 className="ui-type-h4">Связаться с компанией</h3>
            <Tag tone="accent">{companyContacts.length}</Tag>
          </div>

          {companyContacts.length ?
          <div className="opportunity-social-context__links">
              {companyContacts.map((contact) =>
            <AppLink
              key={`${contact.type}-${contact.value}`}
              href={contact.href || contact.value}
              className="opportunity-social-context__link">
              
                  <strong>{contact.label || "Контакт компании"}</strong>
                  <span>{contact.value}</span>
                </AppLink>
            )}
            </div> :

          <p className="opportunity-social-context__empty">У компании нет публичных контактов.</p>
          }
        </Card>

        <Card className="opportunity-social-context__section">
          <div className="opportunity-social-context__section-head">
            <h3 className="ui-type-h4">Люди из вашей сети</h3>
            <Tag tone="accent">{networkCandidates.length}</Tag>
          </div>

          {networkCandidates.length ?
          <div className="opportunity-social-context__people">
              {networkCandidates.map((person) =>
            <OpportunitySocialPersonCard
              key={person.id}
              person={person}
              onShareCandidate={onShareCandidate}
              shareBusyKey={shareBusyKey} />

            )}
            </div> :

          <p className="opportunity-social-context__empty">
              {showAuthHint && status === "idle" ?
            "Войдите как кандидат, чтобы увидеть релевантные контакты из вашей сети." :
            "Пока нет релевантных контактов из вашей сети."}
            </p>
          }
        </Card>

        <Card className="opportunity-social-context__section">
          <div className="opportunity-social-context__section-head">
            <h3 className="ui-type-h4">Другие откликнувшиеся</h3>
            <Tag tone="accent">{peers.length}</Tag>
          </div>

          {peers.length ?
          <div className="opportunity-social-context__people">
              {peers.map((person) =>
            <OpportunitySocialPersonCard
              key={person.id}
              person={person}
              onShareCandidate={canShareOpportunityWithRelationship(person.relationship) ? onShareCandidate : null}
              shareBusyKey={shareBusyKey} />

            )}
            </div> :

          <p className="opportunity-social-context__empty">
              {showAuthHint && status === "idle" ?
            "Peers доступны после входа как кандидат и только для тех, кто дал согласие на видимость." :
            "Пока нет видимых peers по этой возможности."}
            </p>
          }
        </Card>
      </div>
    </div>);

}

function DetailLayout({
  item,
  related,
  applyState,
  onApply,
  socialContext = EMPTY_SOCIAL_CONTEXT,
  socialContextStatus = "idle",
  socialContextError = "",
  allowPeerVisibility = false,
  onAllowPeerVisibilityChange = () => {},
  onShareCandidate = null,
  shareBusyKey = "",
  showAuthHint = false,
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
  embedded = false
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
  const summaryFacts = vm.summaryFacts.length ? vm.summaryFacts : [vm.compactFact].filter(Boolean);

  return (
    <div className={cn("opportunity-card-page__grid", embedded && "opportunity-card-page__grid--embedded")}>
      <div className="opportunity-card-page__main">
        <Card
          className={cn("opportunity-focus-card", animated && "opportunity-card-fade-up")}
          data-opportunity-type-tone={vm.typeTone ?? undefined}
          data-opportunity-type-key={vm.typeKey ?? undefined}>
          
          <div className="opportunity-focus-card__eyebrow">
            <Tag variant="surface" className="opportunity-focus-card__type">
              {vm.typeLabel}
            </Tag>

            {!hidePublicActions ?
            <div className="opportunity-focus-card__toolbar">
                <IconButton
                type="button"
                label={isFavorite ? "Убрать возможность из избранного" : "Сохранить возможность"}
                size="xl"
                className="opportunity-focus-card__toolbar-button ui-opportunity-mini-card__favorite"
                aria-pressed={isFavorite}
                active={isFavorite}
                data-opportunity-id={favoriteOpportunityId ?? undefined}
                onClick={toggleFavorite}>
                
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
                  onClick={onMenuToggle}>
                  
                    <MoreIcon />
                  </IconButton>

                  {menuOpen ?
                <div className="opportunity-focus-card__menu-popover" role="menu" aria-label="Действия с карточкой">
                      <button type="button" className="opportunity-focus-card__menu-action" role="menuitem" onClick={onComplaint}>
                        Пожаловаться
                      </button>
                      <button type="button" className="opportunity-focus-card__menu-action" role="menuitem" onClick={onShare}>
                        Поделиться
                      </button>
                    </div> :
                null}
                </div>
              </div> :
            null}
          </div>

          <div className="opportunity-focus-card__copy">
            <h1 className="ui-type-h2">{item.title}</h1>
            <p className="ui-type-body">{vm.metaLine}</p>
          </div>

          <dl className="opportunity-focus-card__facts">
            <div className="opportunity-focus-card__fact">
              <dt>Тип:</dt>
              <dd>{vm.typeLabel}</dd>
            </div>
            <div className="opportunity-focus-card__fact">
              <dt>Формат:</dt>
              <dd>{vm.employmentLabel || "Не указан"}</dd>
            </div>
            <div className="opportunity-focus-card__fact">
              <dt>Город:</dt>
              <dd>{item.locationCity || "Не указан"}</dd>
            </div>
            <div className="opportunity-focus-card__fact">
              <dt>Адрес:</dt>
              <dd>{item.locationAddress || "Не указан"}</dd>
            </div>
            <div className="opportunity-focus-card__fact">
              <dt>Опубликовано:</dt>
              <dd>{formatOpportunityDateTime(item.publishAt) || "Не указано"}</dd>
            </div>
            <div className="opportunity-focus-card__fact">
              <dt>Срок:</dt>
              <dd>{item.expireAt ? formatOpportunityDateTime(item.expireAt) : "Не указан"}</dd>
            </div>
          </dl>

          {vm.primaryFactValue ?
          <div className="opportunity-focus-card__summary">
              {vm.primaryFactLabel ?
            <span className="opportunity-focus-card__summary-label">{vm.primaryFactLabel}</span> :
            null}
              <strong className="opportunity-focus-card__summary-value ui-type-h3">{vm.primaryFactValue}</strong>
              {summaryFacts.length ?
            <div className="opportunity-focus-card__summary-facts">
                  {summaryFacts.map((fact, index) =>
              <span key={`${fact}-${index}`} className="opportunity-focus-card__summary-fact">
                      {fact}
                    </span>
              )}
                </div> :
            null}
            </div> :
          null}

          {uniq(item.tags).length ?
          <div className="opportunity-focus-card__chips">
              {uniq(item.tags).map((tag) =>
            <Tag key={tag} tone="accent">
                  {tag}
                </Tag>
            )}
            </div> :
          null}

          {!hidePublicActions ?
          <div className="opportunity-focus-card__footer">
              <Checkbox
              checked={allowPeerVisibility}
              onChange={(event) => onAllowPeerVisibilityChange(event.target.checked)}
              disabled={applyState.status === "saving"}
              label="Показывать мой отклик в peers по этой возможности"
              hint="Другие кандидаты увидят вас только если эта опция включена."
              className="opportunity-focus-card__peer-visibility" />
            
              <div className="opportunity-focus-card__watchers">
                {item.expireAt ? `До ${formatOpportunityDateTime(item.expireAt)}` : "Срок не указан"}
              </div>
              <div className="opportunity-focus-card__actions">
                <Button
                type="button"
                className="opportunity-focus-card__apply"
                onClick={onApply}
                disabled={applyState.status === "saving" || applyState.status === "success"}>
                
                  {applyButtonLabel}
                </Button>
                <Button type="button" variant="secondary" onClick={onShare}>
                  Поделиться возможностью
                </Button>
              </div>
            </div> :
          null}
        </Card>

        {!hidePublicActions && applyState.status === "error" ?
        <Alert tone="error" title="Не удалось отправить заявку" showIcon>
            {applyState.error}
          </Alert> :
        null}

        {!hidePublicActions && applyState.status === "success" ?
        <Alert tone="success" title={applyState.successTitle} showIcon>
            {applyState.successMessage}
          </Alert> :
        null}

        {ownerPanel}

        <Card className={cn("opportunity-media-panel", animated && "opportunity-card-fade-up opportunity-card-fade-up--delay-1")}>
          <div className="opportunity-media-panel__header">
            <h2 className="ui-type-h4">Медиа</h2>
            <p className="ui-type-caption">Материалы, которые компания приложила к карточке возможности.</p>
          </div>

          {m.length ?
          <div className="opportunity-story-card__intro">
              {m.map((entry, index) =>
            entry.url ?
            <AppLink key={`${entry.title}-${index}`} href={entry.url} className="opportunity-card-page__more-link">
                    {entry.title}
                  </AppLink> :

            <p key={`${entry.title}-${index}`} className="ui-type-body">
                    {entry.title}
                  </p>

            )}
            </div> :

          <p className="ui-type-body">Компания пока не добавила медиа-материалы к этой карточке.</p>
          }
        </Card>

        <Card className={cn("opportunity-story-card", animated && "opportunity-card-fade-up opportunity-card-fade-up--delay-2")}>
          <div className="opportunity-story-card__intro">
            {intro.map((paragraph, index) =>
            <p key={`${paragraph}-${index}`} className="ui-type-body">
                {paragraph}
              </p>
            )}
          </div>

          <section className="opportunity-story-section">
            <div className="opportunity-story-section__header">
              <h2 className="ui-type-h3">О публикации</h2>
            </div>
            <ul className="opportunity-story-list">
              <li>{formatOpportunityDateTime(item.publishAt) || "Дата не указана"}</li>
              <li>{locationLine(item) || "Локация не указана."}</li>
              <li>{item.expireAt ? `До ${formatOpportunityDateTime(item.expireAt)}` : "Срок не указан"}</li>
            </ul>
          </section>

          {c.length ?
          <section className="opportunity-story-section">
              <div className="opportunity-story-section__header">
                <h2 className="ui-type-h3">Контакты</h2>
              </div>
              <ul className="opportunity-story-list">
                {c.map((entry) =>
              <li key={`${entry.type}-${entry.value}`}>
                    {entry.type === "email" ?
                <AppLink href={`mailto:${entry.value}`}>{entry.value}</AppLink> :
                entry.type === "phone" ?
                <AppLink href={`tel:${entry.value.replace(/\s+/g, "")}`}>{entry.value}</AppLink> :

                <AppLink href={entry.value}>{entry.value}</AppLink>
                }
                  </li>
              )}
              </ul>
            </section> :
          null}

          {uniq(item.tags).length ?
          <section className="opportunity-story-section">
              <div className="opportunity-story-section__header">
                <h2 className="ui-type-h2">Ключевые навыки</h2>
              </div>
              <div className="opportunity-skill-cloud">
                {uniq(item.tags).map((tag) =>
              <Tag key={tag} tone="accent">
                    {tag}
                  </Tag>
              )}
              </div>
            </section> :
          null}

          {hidePublicActions ? null :
          <>
              <p className="ui-type-caption">{formatOpportunityDateTime(item.publishAt)}</p>
              <div className="opportunity-story-card__bottom-actions">
                <Button
                type="button"
                className="opportunity-story-card__bottom-primary"
                onClick={onApply}
                disabled={applyState.status === "saving" || applyState.status === "success"}>
                
                  {applyButtonLabel}
                </Button>
                <Button
                type="button"
                variant="secondary"
                className="opportunity-story-card__bottom-secondary"
                onClick={onShare}>
                
                  Поделиться возможностью
                </Button>
                <Button
                type="button"
                variant="ghost"
                className="opportunity-story-card__bottom-secondary"
                onClick={onComplaint}>
                
                  {item.opportunityType === "event" ? "Пожаловаться на событие" : "Пожаловаться на возможность"}
                </Button>
              </div>
            </>
          }
        </Card>

        <Card className={cn("opportunity-social-context-card", animated && "opportunity-card-fade-up opportunity-card-fade-up--delay-3")}>
          <OpportunitySocialSections
            status={socialContextStatus}
            error={socialContextError}
            socialContext={socialContext}
            fallbackCompanyContacts={c}
            onShareCandidate={onShareCandidate}
            shareBusyKey={shareBusyKey}
            showAuthHint={showAuthHint} />
          
        </Card>
      </div>

      <aside className="opportunity-card-page__side">
        <Card className={cn("company-spotlight", animated && "opportunity-card-fade-up opportunity-card-fade-up--delay-1")}>
          <div className="company-spotlight__company">
            <Avatar size="lg" initials={initials(item.companyName)} className="company-spotlight__avatar company-spotlight__avatar--brand" />
            <div className="company-spotlight__copy">
              {publicCompanyHref ?
              <AppLink href={publicCompanyHref} className="opportunity-card-page__more-link">
                  <h2 className="ui-type-h4">{item.companyName}</h2>
                </AppLink> :

              <h2 className="ui-type-h4">{item.companyName}</h2>
              }
              <p className="ui-type-body">{item.companyDescription || "Описание компании пока не заполнено."}</p>
            </div>
          </div>

          {item.companyLegalAddress ? <p className="ui-type-body">{item.companyLegalAddress}</p> : null}

          {s.length ?
          <div className="opportunity-story-card__intro">
              {s.map((entry) =>
            <AppLink key={entry.id} href={entry.url} className="opportunity-card-page__more-link">
                  {entry.label}
                </AppLink>
            )}
            </div> :
          null}

          <div className="company-spotlight__footer">
            {publicCompanyHref ?
            <Button href={publicCompanyHref} variant="secondary" className="company-spotlight__recommend">
                Открыть профиль компании
              </Button> :
            null}
            <IconButton href={c[0]?.value ? `mailto:${c[0].value}` : "#contacts"} label="Написать компании" variant="outline" size="xl" className="company-spotlight__message">
              <span aria-hidden="true">✉</span>
            </IconButton>
          </div>
        </Card>

        <div className="opportunity-card-page__matches">
          <p className="ui-type-caption opportunity-card-page__matches-label">Вам могут подойти</p>

          {rel.length ?
          rel.map((relatedItem, index) =>
          <OpportunityMiniCard
            key={relatedItem.id}
            variant="compact"
            item={{
              id: relatedItem.id,
              ...getOpportunityMiniCardPresentation(relatedItem),
              chips: uniq(relatedItem.tags).slice(0, 3)
            }}
            className={cn("related-opportunity-entry", animated && `opportunity-card-fade-up opportunity-card-fade-up--delay-${index + 2}`)}
            detailAction={{ href: buildDetailHref(relatedItem), label: "Подробнее", variant: "secondary" }} />

          ) :

          <Card>
              <EmptyState
              title="Пока нет похожих публикаций"
              description="Другие возможности появятся здесь автоматически, когда каталог станет шире."
              tone="neutral"
              compact />
            
            </Card>
          }

          <AppLink href={catalogHref} className="opportunity-card-page__more-link">
            Еще возможности в каталоге
          </AppLink>
        </div>
      </aside>
    </div>);

}


export function OpportunityDetailPreview() {
  const preview = demoOpportunity("design-ui-ux");
  if (!preview) {
    return null;
  }

  return (
    <DetailLayout
      item={preview}
      related={demoRelated(preview.id)}
      applyState={applyState()}
      onApply={() => {}}
      socialContext={createEmptySocialContext()}
      socialContextStatus="idle"
      buildDetailHref={(entry) => `#${entry.id}`}
      catalogHref="#catalog"
      animated={false}
      embedded />);


}

export function OpportunityDetailCardApp() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const opportunityId = params.id;
  const authSession = useAuthSession();
  const [state, setState] = useState({ status: "loading", item: null, related: [], error: null, source: "api" });
  const [apply, setApply] = useState(applyState());
  const [candidateApplyAccess, setCandidateApplyAccess] = useState({ status: "idle", onboardingComplete: false, mandatoryCompletion: 0, peerVisibilityDefault: false });
  const [profileGateOpen, setProfileGateOpen] = useState(false);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [ownerState, setOwnerState] = useState({ isEditing: false, draft: null, saveState: { status: "idle", error: "", message: "" } });
  const [menuOpen, setMenuOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareContactsState, setShareContactsState] = useState(createShareContactsState());
  const [shareBusyKey, setShareBusyKey] = useState("");
  const [allowPeerVisibility, setAllowPeerVisibility] = useState(false);
  const [postApplyModalOpen, setPostApplyModalOpen] = useState(false);
  const [socialContextState, setSocialContextState] = useState({
    status: "idle",
    data: createEmptySocialContext(),
    error: ""
  });
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
    setCandidateApplyAccess({ status: "idle", onboardingComplete: false, mandatoryCompletion: 0, peerVisibilityDefault: false });
    setProfileGateOpen(false);
    setMenuOpen(false);
    setShareModalOpen(false);
    setShareContactsState(createShareContactsState());
    setShareBusyKey("");
    setAllowPeerVisibility(false);
    setPostApplyModalOpen(false);
    setSocialContextState({
      status: "idle",
      data: createEmptySocialContext(),
      error: ""
    });
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
  const isCandidateViewer = authSession.status === "authenticated" && authSession.user?.role === "candidate";
  const isOwner = Boolean(item && authSession.status === "authenticated" && authSession.user?.role === "company" && companyProfile && String(companyProfile.profileId ?? companyProfile.id ?? "") === String(item.employerId ?? ""));
  const previewMode = isOwner && searchParams.get("preview") === "public";
  const capabilities = useMemo(() => item ? getOpportunityOwnerCapabilities(item, { isOwner }) : null, [item, isOwner]);

  useEffect(() => {
    if (!item || authSession.status !== "authenticated" || authSession.user?.role !== "candidate" || state.source === "demo") {
      return;
    }

    const controller = new AbortController();

    async function loadSocialContext() {
      setSocialContextState((current) => ({ ...current, status: "loading", error: "" }));

      try {
        const nextSocialContext = await getCandidateOpportunitySocialContext(item.id, controller.signal);
        if (!controller.signal.aborted) {
          setSocialContextState({
            status: "ready",
            data: {
              companyContacts: Array.isArray(nextSocialContext?.companyContacts) ? nextSocialContext.companyContacts : [],
              networkCandidates: Array.isArray(nextSocialContext?.networkCandidates) ? nextSocialContext.networkCandidates : [],
              peers: Array.isArray(nextSocialContext?.peers) ? nextSocialContext.peers : [],
              counts: nextSocialContext?.counts ?? { peerCount: 0, incomingShareCount: 0, networkCandidateCount: 0 }
            },
            error: ""
          });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setSocialContextState({
            status: "error",
            data: { companyContacts: [], networkCandidates: [], peers: [], counts: { peerCount: 0, incomingShareCount: 0, networkCandidateCount: 0 } },
            error: error?.message ?? "Не удалось загрузить social-context."
          });
        }
      }
    }

    loadSocialContext();
    return () => controller.abort();
  }, [authSession.status, authSession.user?.role, item, state.source]);

  useEffect(() => {
    if (item && isOwner && !previewMode && !ownerState.isEditing) {
      setOwnerState((current) => ({ ...current, draft: createOpportunityDraft(item) }));
    }
  }, [item, isOwner, previewMode, ownerState.isEditing]);

  async function ensureCandidateApplyAccess({ force = false } = {}) {
    if (!force && candidateApplyAccess.status === "ready") {
      return candidateApplyAccess;
    }

    setCandidateApplyAccess((current) => ({
      ...current,
      status: "loading"
    }));

    const [profile, education] = await Promise.all([
    getCandidateProfile(),
    getCandidateEducation()]
    );
    const onboardingState = getCandidateOnboardingState(profile, Array.isArray(education) ? education : []);
    const nextState = {
      status: "ready",
      onboardingComplete: onboardingState.onboardingComplete,
      mandatoryCompletion: onboardingState.mandatoryCompletion,
      peerVisibilityDefault: getPeerVisibilityDefaultFromProfile(profile)
    };

    setCandidateApplyAccess(nextState);
    setAllowPeerVisibility(getPeerVisibilityDefaultFromProfile(profile));
    return nextState;
  }

  async function handleApply() {
    if (authSession.status === "authenticated" && authSession.user?.role === "candidate") {
      try {
        const access = await ensureCandidateApplyAccess();

        if (!access.onboardingComplete) {
          setProfileGateOpen(true);
          return;
        }
      } catch {

        // If the pre-check fails, rely on the backend guard below.
      }}

    setApply(applyState("saving"));
    if (state.source === "demo") {
      setApply(applyState("success", successCopy(state.item?.opportunityType)));
      return;
    }
    try {
      const application = await applyToOpportunity(opportunityId, { allowPeerVisibility });
      upsertCandidateApplication(application);
      setApply(applyState("success", successCopy(state.item?.opportunityType)));
      setPostApplyModalOpen(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        await refreshCandidateApplications({ force: true }).catch(() => {});
        setApply(applyState("success", successCopy(state.item?.opportunityType, "existing")));
        setPostApplyModalOpen(true);
        return;
      }

      if (error instanceof ApiError && error.status === 403 && authSession.status === "authenticated" && authSession.user?.role === "candidate") {
        try {
          const access = await ensureCandidateApplyAccess({ force: true });
          setCandidateApplyAccess(access);
        } catch {
          setCandidateApplyAccess((current) => ({
            ...current,
            status: "idle"
          }));
        }

        setProfileGateOpen(true);
        setApply(applyState());
        return;
      }

      setApply(applyState("error", { error: error?.message ?? "Не удалось отправить отклик." }));
    }
  }

  async function openShareModal() {
    setShareModalOpen(true);
    setShareBusyKey("");
    if (!isCandidateViewer) {
      setShareContactsState(createShareContactsState("error", { error: "Шаринг возможностей доступен только кандидатам." }));
      return;
    }
    if (shareContactsState.status === "ready" || shareContactsState.status === "loading") {
      setShareContactsState((current) => ({ ...current, error: "" }));
      return;
    }
    setShareContactsState(createShareContactsState("loading"));
    try {
      const nextSocialContext = socialContextState.status === "ready" ?
      socialContextState.data :
      await getCandidateOpportunitySocialContext(opportunityId);
      const items = (Array.isArray(nextSocialContext?.networkCandidates) ? nextSocialContext.networkCandidates : []).
      map(mapSocialUserToCard).
      filter((entry) => entry?.id && entry?.name && canShareOpportunityWithRelationship(entry.relationship));
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
        throw new Error("Не удалось определить получателя возможности.");
      }

      await createCandidateOpportunityShare({
        recipientUserId: candidateId,
        opportunityId: Number(state.item.id),
        note: shareText
      });

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
    } catch (error) {
      setShareContactsState((current) => ({
        ...current,
        status: current.status === "loading" ? "ready" : current.status,
        error: error?.message ?? "Не удалось поделиться возможностью."
      }));
    } finally {
      setShareBusyKey("");
    }
  }

  function handleComplaint() {}
  function changeDraft(field, value) {setOwnerState((current) => ({ ...current, draft: { ...(current.draft ?? createOpportunityDraft(item)), [field]: value } }));}
  function changeDraftContacts(next) {setOwnerState((current) => ({ ...current, draft: { ...(current.draft ?? createOpportunityDraft(item)), contacts: next } }));}
  function changeDraftMedia(next) {setOwnerState((current) => ({ ...current, draft: { ...(current.draft ?? createOpportunityDraft(item)), media: next } }));}
  function startEditing() {setOwnerState({ isEditing: true, draft: createOpportunityDraft(item), saveState: { status: "idle", error: "", message: "" } });}
  function stopEditing() {setOwnerState({ isEditing: false, draft: createOpportunityDraft(item), saveState: { status: "idle", error: "", message: "" } });}

  async function saveOwner(saveMode) {
    if (!item || !ownerState.draft) return;
    const errors = saveMode === "submit" ? validateOpportunityDraftForSubmit(ownerState.draft) : [];
    if (errors.length) {setOwnerState((current) => ({ ...current, saveState: { status: "error", error: errors[0], message: "" } }));return;}
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

  async function archiveOwner() {if (!item) return;await updateOpportunity(item.id, { saveMode: "archive", moderationStatus: "archived" });const refreshed = await getOpportunity(item.id);setState((current) => ({ ...current, item: refreshed }));}
  async function deleteOwner() {if (!item) return;await deleteOpportunity(item.id);setState((current) => ({ ...current, status: "ready", item: null, related: [] }));}

  const ownerPanel = item && isOwner && !previewMode ? ownerState.isEditing ? <OwnerEditor draft={ownerState.draft} onChange={(field, value) => {if (field === "contacts") return changeDraftContacts(value);if (field === "media") return changeDraftMedia(value);changeDraft(field, value);}} onSaveDraft={() => saveOwner("draft")} onSubmit={() => saveOwner("submit")} onPreview={buildOpportunityPreviewRoute(item.id)} onClose={stopEditing} onArchive={archiveOwner} onDelete={deleteOwner} saving={ownerState.saveState.status === "saving"} /> : <Card className="opportunity-owner-panel"><div className="company-dashboard-stack"><div className="company-dashboard-list-item__top"><div><h2 className="ui-type-h3">Управление публикацией</h2><p className="ui-type-caption">{translateModerationStatus(item.moderationStatus)}</p></div><Tag tone="accent">{translateModerationStatus(item.moderationStatus)}</Tag></div>{item.moderationReason ? <Alert tone="warning" title="Причина возврата" showIcon>{item.moderationReason}</Alert> : null}{capabilities?.canViewResponses ? <Button href="/company/dashboard/responses" variant="secondary">{"Открыть отклики"}</Button> : null}<div className="company-dashboard-panel__actions"><Button type="button" onClick={startEditing}>{"Редактировать"}</Button><Button type="button" variant="secondary" onClick={() => {if (typeof window !== "undefined") {window.location.href = buildOpportunityPreviewRoute(item.id);}}}>{"Просмотр публичной версии"}</Button>{capabilities?.canArchive ? <Button type="button" variant="secondary" onClick={archiveOwner}>Снять с публикации/архивировать</Button> : null}{capabilities?.canDelete ? <Button type="button" variant="ghost" onClick={deleteOwner}>Удалить</Button> : null}</div>{ownerState.saveState.status === "error" ? <Alert tone="error" title="Операция не выполнена" showIcon>{ownerState.saveState.error}</Alert> : null}{ownerState.saveState.status === "success" ? <Alert tone="success" title="РР·РјРµРЅРµРЅРёСЏ СЃРѕС…СЂР°РЅРµРЅС‹" showIcon>{ownerState.saveState.message}</Alert> : null}</div></Card> : null;

  return (
    <main className="opportunity-card-page" data-testid="opportunity-detail-page">
      <div className="opportunity-card-page__shell ui-page-shell">
        <PortalHeader
          navItems={NAV_ITEMS}
          currentKey="opportunities"
          actionHref={authSession.user?.role === "company" ? "/company/dashboard" : "/candidate/profile"}
          actionLabel={authSession.user?.role === "company" ? "Кабинет компании" : "Профиль"}
          className="opportunity-card-header opportunity-card-fade-up" />
        

        {state.status === "loading" ? <Loader label="Загружаем карточку возможности" surface /> : null}

        {state.status === "error" ?
        <Alert tone="error" title="Не удалось загрузить карточку" showIcon>
            {state.error?.message ?? "Попробуйте открыть возможность позже."}
          </Alert> :
        null}

        {state.status === "ready" && !state.item ?
        <Card>
            <EmptyState
            eyebrow="Пусто"
            title="Публикация больше не доступна"
            description="Вернитесь в каталог возможностей или в кабинет компании."
            tone="neutral" />
          
          </Card> :
        null}

        {state.status === "ready" && state.item ?
        <DetailLayout
          item={state.item}
          related={state.related}
          applyState={apply}
          onApply={handleApply}
          socialContext={socialContextState.data}
          socialContextStatus={socialContextState.status}
          socialContextError={socialContextState.error}
          showPeerVisibilityControl={isCandidateViewer}
          allowPeerVisibility={allowPeerVisibility}
          onAllowPeerVisibilityChange={setAllowPeerVisibility}
          onShare={async () => {
            setMenuOpen(false);
            await openShareModal();
          }}
          showAuthHint={!isCandidateViewer}
          hidePublicActions={isOwner && !previewMode}
          ownerPanel={ownerPanel}
          menuOpen={menuOpen}
          menuRef={menuRef}
          onMenuToggle={() => setMenuOpen((current) => !current)}
          onComplaint={() => {
            setMenuOpen(false);
            handleComplaint();
          }}
          buildDetailHref={(entry) => buildOpportunityDetailRoute(entry.id)}
          catalogHref="/opportunities" /> :

        null}

        <CandidateProfileGateModal
          open={profileGateOpen}
          completion={candidateApplyAccess.mandatoryCompletion}
          onClose={() => setProfileGateOpen(false)}
          onContinue={() => {
            setProfileGateOpen(false);
            navigate(routes.candidate.career);
          }} />
        

        <Modal
          open={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setShareBusyKey("");
          }}
          title="Поделиться возможностью"
          description="Выберите контакт, которому хотите отправить карточку публикации."
          size="md"
          className="opportunity-share-modal">
          
          {shareContactsState.status === "loading" ? <Loader label="Загружаем контакты" /> : null}

          {shareContactsState.error ?
          <Alert tone="error" title="Не удалось открыть шаринг" showIcon>
              {shareContactsState.error}
            </Alert> :
          null}

          {shareContactsState.status === "ready" && !shareContactsState.items.length ?
          <EmptyState
            eyebrow="Пока пусто"
            title="Список контактов пока пуст"
            description="Добавьте контакты в кабинете кандидата, и они появятся здесь для быстрого шаринга."
            tone="neutral"
            compact /> :

          null}

          {shareContactsState.status === "ready" && shareContactsState.items.length ?
          <div className="opportunity-share-modal__list">
              {shareContactsState.items.map((contact) =>
            <div key={contact.id} className="opportunity-share-modal__item">
                  <div className="opportunity-share-modal__identity">
                    <Avatar
                  initials={String(contact.name || "").slice(0, 2).toUpperCase() || "?"}
                  shape="rounded"
                  className="opportunity-share-modal__avatar" />
                
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
                }}>
                
                    Поделиться
                  </Button>
                </div>
            )}
            </div> :
          null}
        </Modal>

        <Modal
          open={postApplyModalOpen}
          onClose={() => setPostApplyModalOpen(false)}
          title="С кем это обсудить"
          description="Сразу после отклика можно связаться с компанией, посмотреть релевантные контакты и peers по этой возможности."
          size="lg">
          
          <OpportunitySocialSections
            status={socialContextState.status}
            error={socialContextState.error}
            socialContext={socialContextState.data}
            fallbackCompanyContacts={item ? contacts(item.contactsJson) : []}
            onShare={async () => {
              setPostApplyModalOpen(false);
              await openShareModal();
            }} />
          

          <div className="opportunity-social-context__modal-actions">
            <Button type="button" onClick={() => setPostApplyModalOpen(false)}>
              Закрыть
            </Button>
          </div>
        </Modal>
      </div>
    </main>);

}