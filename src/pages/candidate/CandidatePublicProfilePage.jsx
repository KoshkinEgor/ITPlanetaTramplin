import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  acceptCandidateFriendRequest,
  acceptCandidateProjectInvite,
  cancelCandidateFriendRequest,
  cancelCandidateProjectInvite,
  createCandidateContact,
  createCandidateFriendRequest,
  createCandidateProjectInvite,
  declineCandidateFriendRequest,
  declineCandidateProjectInvite,
  getCandidateProjects,
  getCandidatePublicProfile,
} from "../../api/candidate";
import { PUBLIC_HEADER_NAV_ITEMS, buildCandidatePublicProfileRoute, routes } from "../../app/routes";
import { useAuthSession } from "../../auth/api";
import {
  getCandidateAvatarUrl,
  getCandidateDisplayName,
  getCandidateInitials,
  getCandidateSkills,
  mapCandidateProjectToCard,
} from "../../candidate-portal/mappers";
import { getCandidateOnboardingData, getCandidateProfileLinks } from "../../candidate-portal/onboarding";
import { CandidatePortfolioProjectCard, CandidateResumeMiniCard } from "../../candidate-portal/portfolio-kit";
import "../../candidate-portal/candidate-portal.css";
import {
  buildSocialLinksList,
  canInviteCandidateToProject,
  createEmptyRelationship,
  normalizeRelationship,
} from "../../candidate-portal/social";
import { CandidateSectionHeader } from "../../candidate-portal/shared";
import { useBodyClass } from "../../shared/lib/useBodyClass";
import { Alert, Avatar, Button, Card, EmptyState, FormField, Input, Loader, Modal, Select, Tag, Textarea } from "../../shared/ui";
import { PortalHeader } from "../../widgets/layout";
import "./candidate-public-profile.css";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function splitSkills(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeString(item)).filter(Boolean);
  }

  return normalizeString(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildPreviewProfile({ userId, name, email, skills = [] }) {
  const displayName = normalizeString(name) || normalizeString(email) || "Кандидат";
  const [firstName = "", ...rest] = displayName.split(/\s+/).filter(Boolean);
  const surname = rest.join(" ");

  return {
    userId: userId ?? null,
    name: firstName || displayName,
    surname,
    thirdname: "",
    email: normalizeString(email),
    description: "",
    skills: splitSkills(skills),
    links: {
      onboarding: {},
      resumes: [],
    },
  };
}

function getProfilePreview(location) {
  const searchParams = new URLSearchParams(location.search);
  const statePreview = isRecord(location.state?.profilePreview) ? location.state.profilePreview : {};
  const merged = {
    userId: statePreview.userId ?? searchParams.get("userId"),
    name: statePreview.name ?? searchParams.get("name"),
    email: statePreview.email ?? searchParams.get("email"),
    skills: Array.isArray(statePreview.skills) && statePreview.skills.length ? statePreview.skills : splitSkills(searchParams.get("skills")),
    projects: Array.isArray(statePreview.projects) ? statePreview.projects : [],
    education: Array.isArray(statePreview.education) ? statePreview.education : [],
  };

  if (!normalizeString(merged.name) && !normalizeString(merged.email) && !normalizeString(merged.userId)) {
    return null;
  }

  return {
    userId: toNumber(merged.userId) ?? merged.userId,
    profile: buildPreviewProfile(merged),
    projects: merged.projects,
    education: merged.education,
  };
}

function getResumeExperienceLabel(source) {
  const experience = isRecord(source?.experience) ? source.experience : {};

  if (experience.noExperience || (!experience.company && !experience.role && !experience.period)) {
    return "Опыт не указан";
  }

  if (normalizeString(experience.period)) {
    return normalizeString(experience.period);
  }

  if (normalizeString(experience.role)) {
    return normalizeString(experience.role);
  }

  return "Опыт указан";
}

function buildResumeStats(stats) {
  const source = isRecord(stats) ? stats : {};

  return {
    impressions: Number.isFinite(Number(source.impressions)) ? Number(source.impressions) : 0,
    views: Number.isFinite(Number(source.views)) ? Number(source.views) : 0,
    invitations: Number.isFinite(Number(source.invitations)) ? Number(source.invitations) : 0,
  };
}

function getResumeVisibility(value) {
  const normalized = normalizeString(value).toLowerCase();
  return normalized === "employers" ? "employers" : "private";
}

function buildFallbackResume(profile) {
  const onboarding = getCandidateOnboardingData(profile);

  return {
    id: "resume-primary",
    title: normalizeString(onboarding.profession) || "Резюме кандидата",
    updatedAt: onboarding.completedAt ?? null,
    city: normalizeString(onboarding.city) || "Город не указан",
    experience: getResumeExperienceLabel(onboarding),
    visibility: "private",
    stats: buildResumeStats(),
  };
}

function buildResumeItems(profile, explicitResumes = []) {
  const resumeList = Array.isArray(explicitResumes) && explicitResumes.length
    ? explicitResumes.filter(isRecord)
    : (Array.isArray(getCandidateProfileLinks(profile).resumes) ? getCandidateProfileLinks(profile).resumes.filter(isRecord) : []);

  if (!resumeList.length) {
    return [];
  }

  return resumeList.map((resume, index) => {
    const fallbackResume = buildFallbackResume(profile);

    return {
      id: normalizeString(resume.id) || `resume-${index + 1}`,
      title: normalizeString(resume.title) || normalizeString(resume.profession) || fallbackResume.title,
      updatedAt: resume.updatedAt ?? resume.updatedDate ?? resume.lastModifiedAt ?? fallbackResume.updatedAt,
      city: normalizeString(resume.city) || fallbackResume.city,
      experience: normalizeString(resume.experienceLabel) || getResumeExperienceLabel(resume) || fallbackResume.experience,
      visibility: getResumeVisibility(resume.visibility),
      stats: buildResumeStats(resume.stats),
      downloadUrl: normalizeString(resume.downloadUrl) || normalizeString(resume.fileUrl) || normalizeString(resume.url),
    };
  });
}

function buildPublicMeta(profile, educationItems = []) {
  const onboarding = getCandidateOnboardingData(profile);
  const education = Array.isArray(educationItems) && educationItems.length && isRecord(educationItems[0])
    ? educationItems[0]
    : isRecord(onboarding.education)
      ? onboarding.education
      : {};

  const courseLabel = normalizeString(education.courseLabel) || normalizeString(education.course);
  const graduation = education.graduationYear ? `Выпуск ${education.graduationYear}` : "";

  return [
    normalizeString(education.institutionName),
    normalizeString(onboarding.city),
    courseLabel,
    graduation,
  ].filter(Boolean).join(" · ");
}

function getProfileGoal(profile) {
  return normalizeString(getCandidateOnboardingData(profile).goal);
}

function normalizePublicState(payload) {
  const profile = {
    userId: payload?.userId ?? null,
    name: normalizeString(payload?.name),
    surname: normalizeString(payload?.surname),
    thirdname: normalizeString(payload?.thirdname),
    description: normalizeString(payload?.description),
    skills: Array.isArray(payload?.skills) ? payload.skills : [],
    links: isRecord(payload?.links) ? payload.links : {},
  };

  return {
    status: "ready",
    mode: "public",
    error: null,
    profile,
    education: payload?.education ? [payload.education] : [],
    projects: Array.isArray(payload?.projects) ? payload.projects : [],
    resumes: Array.isArray(payload?.resumes) ? payload.resumes : [],
    socialLinks: buildSocialLinksList(payload?.socialLinks),
    relationship: normalizeRelationship(payload?.relationship),
    access: {
      hasProjects: Boolean(payload?.hasProjects),
      hasResumes: Boolean(payload?.hasResumes),
      hasSocialLinks: Boolean(payload?.hasSocialLinks),
      canSeeProjects: Boolean(payload?.canSeeProjects),
      canSeeSocialLinks: Boolean(payload?.canSeeSocialLinks),
    },
  };
}

function createPreviewState(preview, error = null) {
  return {
    status: "ready",
    mode: "preview",
    error,
    profile: preview.profile,
    education: Array.isArray(preview.education) ? preview.education : [],
    projects: Array.isArray(preview.projects) ? preview.projects : [],
    resumes: [],
    socialLinks: [],
    relationship: createEmptyRelationship(),
    access: {
      hasProjects: Array.isArray(preview.projects) && preview.projects.length > 0,
      hasResumes: false,
      hasSocialLinks: false,
      canSeeProjects: false,
      canSeeSocialLinks: false,
    },
  };
}

function createDemoState() {
  const profile = {
    userId: null,
    name: "Анна",
    surname: "Ковалёва",
    description:
      "Аналитик и начинающий product-minded специалист: люблю разбирать данные, проектировать пользовательские сценарии и собирать понятные интерфейсы для роста.",
    skills: ["SQL", "Python", "Research", "UX", "Figma", "Презентации"],
    links: {
      onboarding: {
        profession: "UX/UI дизайнер",
        city: "Москва",
        goal: "Пройти стажировку на должность UX/UI дизайнера",
        completedAt: "2026-03-12T09:00:00.000Z",
        education: {
          institutionName: "МГТУ им. Баумана",
          courseLabel: "4 курс",
          graduationYear: 2027,
        },
      },
      resumes: [
        {
          id: "resume-demo",
          title: "Веб-дизайнер",
          updatedAt: "2026-03-12T09:00:00.000Z",
          city: "Чебоксары",
          visibility: "private",
          stats: {
            impressions: 0,
            views: 0,
            invitations: 0,
          },
        },
      ],
    },
  };

  return {
    status: "ready",
    mode: "demo",
    error: null,
    profile,
    education: [
      {
        institutionName: "МГТУ им. Баумана",
        courseLabel: "4 курс",
        graduationYear: 2027,
      },
    ],
    projects: [
      {
        id: "project-demo-1",
        projectType: "Проект",
        updatedAt: "2026-03-12T09:00:00.000Z",
        title: "Исследование onboarding-сценария",
        shortDescription: "Провела интервью, собрала CJM и предложила улучшения onboarding-flow для учебного сервиса.",
        role: "исследователь и фасилитатор команды",
        tags: ["Research", "FigJam", "Презентация"],
      },
      {
        id: "project-demo-2",
        projectType: "Проект",
        updatedAt: "2026-03-12T09:00:00.000Z",
        title: "Редизайн образовательного кабинета",
        shortDescription: "Пересобрала основные сценарии навигации и сократила путь до ключевых действий.",
        role: "UX/UI дизайнер",
        tags: ["UX", "Research", "Figma"],
      },
    ],
    resumes: profile.links.resumes,
    socialLinks: [
      { key: "telegram", label: "Telegram", href: "https://t.me/tramplin_candidate_demo" },
      { key: "portfolio", label: "Портфолио", href: "https://example.com/demo-portfolio" },
    ],
    relationship: createEmptyRelationship(),
    access: {
      hasProjects: true,
      hasResumes: true,
      hasSocialLinks: true,
      canSeeProjects: true,
      canSeeSocialLinks: true,
    },
  };
}

function createInitialInviteDraft() {
  return {
    projectId: "",
    role: "",
    message: "",
  };
}

function getFeedbackTone(status) {
  if (status === "success") {
    return "success";
  }

  if (status === "error") {
    return "error";
  }

  return "info";
}

export function CandidatePublicProfilePage() {
  useBodyClass("candidate-portal-react-body");

  const location = useLocation();
  const authSession = useAuthSession();
  const authUser = authSession.status === "authenticated" ? authSession.user : null;
  const preview = useMemo(() => getProfilePreview(location), [location]);
  const publicUserId = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return toNumber(searchParams.get("userId"));
  }, [location.search]);

  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState(() => (publicUserId ? { status: "loading", mode: "public", error: null } : createDemoState()));
  const [busyAction, setBusyAction] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteDraft, setInviteDraft] = useState(createInitialInviteDraft);
  const [inviteProjectsState, setInviteProjectsState] = useState({
    status: "idle",
    items: [],
    error: "",
  });

  useEffect(() => {
    setFeedback(null);
    setInviteModalOpen(false);
    setInviteDraft(createInitialInviteDraft());
    setInviteProjectsState({
      status: "idle",
      items: [],
      error: "",
    });
  }, [publicUserId, location.search]);

  useEffect(() => {
    if (!publicUserId) {
      setState(createDemoState());
      return undefined;
    }

    const controller = new AbortController();

    async function load() {
      try {
        const payload = await getCandidatePublicProfile(publicUserId, controller.signal);

        if (!controller.signal.aborted) {
          setState(normalizePublicState(payload));
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        if (preview) {
          setState(createPreviewState(preview, error));
          return;
        }

        setState({
          status: "error",
          mode: "public",
          error,
        });
      }
    }

    setState((current) => ({
      ...current,
      status: "loading",
      mode: "public",
      error: null,
    }));
    load();

    return () => controller.abort();
  }, [preview, publicUserId, reloadKey]);

  const profile = state.profile ?? null;
  const relationship = normalizeRelationship(state.relationship);
  const isSelfPublicView = Boolean(publicUserId && authUser?.id && Number(authUser.id) === Number(publicUserId));
  const skills = useMemo(() => getCandidateSkills(profile).slice(0, 8), [profile]);
  const meta = useMemo(() => buildPublicMeta(profile, state.education ?? []), [profile, state.education]);
  const goal = useMemo(() => getProfileGoal(profile), [profile]);
  const resumes = useMemo(() => buildResumeItems(profile, state.resumes), [profile, state.resumes]);
  const primaryResume = resumes[0] ?? null;
  const projectCards = useMemo(
    () => (Array.isArray(state.projects) ? state.projects.map(mapCandidateProjectToCard) : []),
    [state.projects]
  );
  const socialLinks = Array.isArray(state.socialLinks) ? state.socialLinks : [];
  const currentProfileHref = useMemo(
    () => buildCandidatePublicProfileRoute({
      userId: publicUserId,
      name: getCandidateDisplayName(profile),
      skills,
    }),
    [profile, publicUserId, skills]
  );

  const shouldShowInviteButton = !isSelfPublicView
    && state.mode === "public"
    && relationship.projectInviteState !== "incoming"
    && relationship.projectInviteState !== "outgoing"
    && relationship.projectInviteState !== "accepted"
    && canInviteCandidateToProject(relationship);

  async function refreshPublicProfile() {
    if (publicUserId) {
      setReloadKey((current) => current + 1);
    }
  }

  async function ensureInviteProjectsLoaded() {
    if (inviteProjectsState.status === "loading" || inviteProjectsState.status === "ready") {
      return;
    }

    try {
      setInviteProjectsState({
        status: "loading",
        items: [],
        error: "",
      });

      const projects = await getCandidateProjects();
      const normalizedProjects = Array.isArray(projects)
        ? projects.filter((item) => item && item.id && normalizeString(item.title))
        : [];

      setInviteProjectsState({
        status: "ready",
        items: normalizedProjects,
        error: "",
      });

      if (normalizedProjects.length) {
        setInviteDraft((current) => ({
          ...current,
          projectId: current.projectId || String(normalizedProjects[0].id),
        }));
      }
    } catch (error) {
      setInviteProjectsState({
        status: "error",
        items: [],
        error: error?.message ?? "Не удалось загрузить проекты для приглашения.",
      });
    }
  }

  async function handleAddToContacts() {
    if (!publicUserId || busyAction) {
      return;
    }

    try {
      setBusyAction("contact");
      await createCandidateContact({ userId: publicUserId });
      setFeedback({
        status: "success",
        title: "Контакт добавлен",
        message: "Пользователь сохранён в вашей сети контактов.",
      });
      await refreshPublicProfile();
    } catch (error) {
      setFeedback({
        status: "error",
        title: "Не удалось добавить в контакты",
        message: error?.message ?? "Попробуйте ещё раз.",
      });
    } finally {
      setBusyAction("");
    }
  }

  async function handleFriendRequest(action) {
    if (!publicUserId || busyAction) {
      return;
    }

    try {
      setBusyAction(action);

      if (action === "send-friend-request") {
        await createCandidateFriendRequest({ userId: publicUserId });
      }

      if (action === "accept-friend-request" && relationship.friendRequestId) {
        await acceptCandidateFriendRequest(relationship.friendRequestId);
      }

      if (action === "decline-friend-request" && relationship.friendRequestId) {
        await declineCandidateFriendRequest(relationship.friendRequestId);
      }

      if (action === "cancel-friend-request" && relationship.friendRequestId) {
        await cancelCandidateFriendRequest(relationship.friendRequestId);
      }

      setFeedback({
        status: "success",
        title: "Статус дружбы обновлён",
        message: "Изменения сохранены.",
      });
      await refreshPublicProfile();
    } catch (error) {
      setFeedback({
        status: "error",
        title: "Не удалось обновить заявку в друзья",
        message: error?.message ?? "Попробуйте ещё раз.",
      });
    } finally {
      setBusyAction("");
    }
  }

  async function handleProjectInviteAction(action) {
    if (!publicUserId || busyAction) {
      return;
    }

    try {
      setBusyAction(action);

      if (action === "accept-project-invite" && relationship.projectInviteId) {
        await acceptCandidateProjectInvite(relationship.projectInviteId);
      }

      if (action === "decline-project-invite" && relationship.projectInviteId) {
        await declineCandidateProjectInvite(relationship.projectInviteId);
      }

      if (action === "cancel-project-invite" && relationship.projectInviteId) {
        await cancelCandidateProjectInvite(relationship.projectInviteId);
      }

      setFeedback({
        status: "success",
        title: "Статус приглашения обновлён",
        message: "Изменения сохранены.",
      });
      await refreshPublicProfile();
    } catch (error) {
      setFeedback({
        status: "error",
        title: "Не удалось обновить приглашение",
        message: error?.message ?? "Попробуйте ещё раз.",
      });
    } finally {
      setBusyAction("");
    }
  }

  async function handleInviteSubmit(event) {
    event.preventDefault();

    if (!publicUserId || !inviteDraft.projectId || busyAction) {
      return;
    }

    try {
      setBusyAction("send-project-invite");

      await createCandidateProjectInvite({
        recipientUserId: publicUserId,
        projectId: Number(inviteDraft.projectId),
        role: normalizeString(inviteDraft.role) || undefined,
        message: normalizeString(inviteDraft.message) || undefined,
      });

      setInviteModalOpen(false);
      setInviteDraft(createInitialInviteDraft());
      setFeedback({
        status: "success",
        title: "Приглашение отправлено",
        message: "Теперь пользователь увидит его во входящих действиях.",
      });
      await refreshPublicProfile();
    } catch (error) {
      setFeedback({
        status: "error",
        title: "Не удалось отправить приглашение",
        message: error?.message ?? "Попробуйте ещё раз.",
      });
    } finally {
      setBusyAction("");
    }
  }

  function handleOpenInviteModal() {
    setInviteModalOpen(true);
    void ensureInviteProjectsLoaded();
  }

  function renderHeroActions() {
    if (isSelfPublicView) {
      return (
        <div className="candidate-public-profile__hero-status">
          <Tag tone="neutral">Это ваш публичный профиль</Tag>
        </div>
      );
    }

    if (state.mode !== "public") {
      return (
        <div className="candidate-public-profile__hero-status">
          <Tag tone="neutral">Preview-режим</Tag>
        </div>
      );
    }

    if (relationship.projectInviteState === "incoming") {
      return (
        <>
          <Button size="lg" loading={busyAction === "accept-project-invite"} onClick={() => handleProjectInviteAction("accept-project-invite")}>
            Принять приглашение
          </Button>
          <Button variant="secondary" size="lg" loading={busyAction === "decline-project-invite"} onClick={() => handleProjectInviteAction("decline-project-invite")}>
            Отклонить
          </Button>
        </>
      );
    }

    if (relationship.projectInviteState === "outgoing") {
      return (
        <>
          <Button size="lg" disabled>
            Приглашение отправлено
          </Button>
          <Button variant="secondary" size="lg" loading={busyAction === "cancel-project-invite"} onClick={() => handleProjectInviteAction("cancel-project-invite")}>
            Отменить приглашение
          </Button>
        </>
      );
    }

    if (relationship.projectInviteState === "accepted") {
      return (
        <div className="candidate-public-profile__hero-status">
          <Tag tone="success">Приглашение принято</Tag>
        </div>
      );
    }

    if (relationship.friendState === "incoming") {
      return (
        <>
          <Button size="lg" loading={busyAction === "accept-friend-request"} onClick={() => handleFriendRequest("accept-friend-request")}>
            Принять в друзья
          </Button>
          <Button variant="secondary" size="lg" loading={busyAction === "decline-friend-request"} onClick={() => handleFriendRequest("decline-friend-request")}>
            Отклонить
          </Button>
        </>
      );
    }

    if (relationship.friendState === "outgoing") {
      return (
        <>
          <Button size="lg" disabled>
            Заявка отправлена
          </Button>
          <Button variant="secondary" size="lg" loading={busyAction === "cancel-friend-request"} onClick={() => handleFriendRequest("cancel-friend-request")}>
            Отменить заявку
          </Button>
        </>
      );
    }

    if (relationship.friendState === "friends") {
      return (
        <>
          {shouldShowInviteButton ? (
            <Button size="lg" onClick={handleOpenInviteModal}>
              Пригласить в проект
            </Button>
          ) : null}
          <div className="candidate-public-profile__hero-status">
            <Tag tone="success">В друзьях</Tag>
          </div>
        </>
      );
    }

    if (relationship.contactState === "saved") {
      return (
        <>
          {shouldShowInviteButton ? (
            <Button size="lg" onClick={handleOpenInviteModal}>
              Пригласить в проект
            </Button>
          ) : null}
          <Button variant="secondary" size="lg" loading={busyAction === "send-friend-request"} onClick={() => handleFriendRequest("send-friend-request")}>
            Отправить заявку в друзья
          </Button>
          <div className="candidate-public-profile__hero-status">
            <Tag tone="neutral">Уже в контактах</Tag>
          </div>
        </>
      );
    }

    return (
      <>
        <Button size="lg" loading={busyAction === "contact"} onClick={handleAddToContacts}>
          Добавить в контакты
        </Button>
        <Button variant="secondary" size="lg" loading={busyAction === "send-friend-request"} onClick={() => handleFriendRequest("send-friend-request")}>
          Отправить заявку в друзья
        </Button>
      </>
    );
  }

  function renderSocialLinks() {
    if (socialLinks.length) {
      return (
        <div className="candidate-public-profile__contact-links">
          <span className="candidate-public-profile__contact-title">Связаться</span>
          <div className="candidate-public-profile__contact-grid">
            {socialLinks.map((item) => (
              <Button key={item.key} href={item.href} variant="secondary" size="sm" target="_blank" rel="noreferrer">
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      );
    }

    if (state.mode === "public" && state.access?.hasSocialLinks && !state.access?.canSeeSocialLinks) {
      return (
        <div className="candidate-public-profile__contact-links candidate-public-profile__contact-links--placeholder">
          <span className="candidate-public-profile__contact-title">Связаться</span>
          <p>Контактные ссылки скрыты настройками приватности и откроются только тем, кому разрешён доступ.</p>
        </div>
      );
    }

    if (state.mode === "public") {
      return (
        <div className="candidate-public-profile__contact-links candidate-public-profile__contact-links--placeholder">
          <span className="candidate-public-profile__contact-title">Связаться</span>
          <p>У пользователя пока нет публичных внешних контактов.</p>
        </div>
      );
    }

    return null;
  }

  function renderResumeContent() {
    if (primaryResume) {
      return (
        <CandidateResumeMiniCard
          title={primaryResume.title}
          updatedAt={primaryResume.updatedAt}
          city={primaryResume.city}
          experience={primaryResume.experience}
          stats={primaryResume.stats}
          visibility={primaryResume.visibility}
          showMenu={false}
        />
      );
    }

    if (state.mode === "public" && state.access?.hasResumes) {
      return (
        <EmptyState
          eyebrow="Доступ ограничен"
          title="Резюме скрыто настройками приватности"
          description="У пользователя есть резюме, но сейчас у вас нет прав на его просмотр."
          tone="neutral"
        />
      );
    }

    return (
      <EmptyState
        eyebrow="Пока пусто"
        title="Публичных резюме пока нет"
        description="Когда пользователь опубликует резюме, оно появится в этом разделе."
        tone="neutral"
      />
    );
  }

  function renderProjectsContent() {
    if (projectCards.length) {
      return (
        <>
          <div className="candidate-page-grid candidate-page-grid--two candidate-public-profile__project-grid">
            {projectCards.slice(0, 2).map((item) => (
              <CandidatePortfolioProjectCard
                key={item.id}
                item={item}
                actionHref={currentProfileHref}
                className="candidate-public-profile__project-card"
              />
            ))}
          </div>

          {projectCards.length > 2 ? (
            <Button variant="secondary" width="full" size="lg" href={`${currentProfileHref}#portfolio`} className="candidate-public-profile__more-projects">
              Больше проектов
            </Button>
          ) : null}
        </>
      );
    }

    if (state.mode === "public" && state.access?.hasProjects && !state.access?.canSeeProjects) {
      return (
        <Card>
          <EmptyState
            eyebrow="Доступ ограничен"
            title="Портфолио скрыто настройками приватности"
            description="У пользователя есть проекты в портфолио, но они не открыты для вашего уровня связи."
            tone="neutral"
          />
        </Card>
      );
    }

    return (
      <Card>
        <EmptyState
          eyebrow="Пока пусто"
          title="Публичных проектов пока нет"
          description="Когда пользователь откроет проекты в портфолио, они появятся в этом разделе."
          tone="neutral"
        />
      </Card>
    );
  }

  if (state.status === "loading") {
    return (
      <main className="candidate-public-profile" data-testid="candidate-public-profile-page">
        <div className="candidate-public-profile__shell ui-page-shell">
          <PortalHeader
            navItems={PUBLIC_HEADER_NAV_ITEMS}
            currentKey="opportunities"
            actionHref={routes.candidate.profile}
            actionLabel="Профиль"
            className="candidate-public-profile__header"
          />
          <Loader label="Загружаем публичный профиль" surface />
        </div>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="candidate-public-profile" data-testid="candidate-public-profile-page">
        <div className="candidate-public-profile__shell ui-page-shell">
          <PortalHeader
            navItems={PUBLIC_HEADER_NAV_ITEMS}
            currentKey="opportunities"
            actionHref={routes.candidate.profile}
            actionLabel="Профиль"
            className="candidate-public-profile__header"
          />
          <Alert tone="error" title="Не удалось открыть публичный профиль" showIcon>
            {state.error?.message ?? "Попробуйте обновить страницу позже."}
          </Alert>
        </div>
      </main>
    );
  }

  return (
    <main className="candidate-public-profile" data-testid="candidate-public-profile-page">
      <div className="candidate-public-profile__shell ui-page-shell">
        <PortalHeader
          navItems={PUBLIC_HEADER_NAV_ITEMS}
          currentKey="opportunities"
          actionHref={routes.candidate.profile}
          actionLabel="Профиль"
          className="candidate-public-profile__header"
        />

        <div className="candidate-public-profile__content">
          <Card className="candidate-public-profile__hero">
            <div className="candidate-public-profile__hero-cover" />

            <div className="candidate-public-profile__hero-body">
              <Avatar
                src={getCandidateAvatarUrl(profile) || undefined}
                alt={`Фото профиля ${getCandidateDisplayName(profile)}`}
                initials={getCandidateInitials(profile)}
                size="xl"
                shape="rounded"
                tone="neutral"
                className="candidate-public-profile__avatar"
              />

              <div className="candidate-public-profile__hero-main">
                <div className="candidate-public-profile__hero-badges">
                  <Tag tone="neutral">Не в сети</Tag>
                  <Tag tone={isSelfPublicView ? "neutral" : getStatusTag(relationship).tone}>{isSelfPublicView ? "Ваш профиль" : getStatusTag(relationship).label}</Tag>
                </div>

                <div className="candidate-public-profile__hero-copy">
                  <h1 className="ui-type-h1 candidate-public-profile__title">{getCandidateDisplayName(profile)}</h1>
                  {meta ? <p className="ui-type-body-lg candidate-public-profile__meta">{meta}</p> : null}
                </div>

                {goal ? (
                  <p className="ui-type-body candidate-public-profile__goal">
                    <strong>Цель:</strong> {goal}
                  </p>
                ) : null}

                {normalizeString(profile?.description) ? (
                  <p className="ui-type-body candidate-public-profile__description">{normalizeString(profile.description)}</p>
                ) : null}

                {skills.length ? (
                  <div className="candidate-public-profile__skills" aria-label="Навыки кандидата">
                    {skills.map((skill) => (
                      <Tag key={skill} tone="accent">
                        {skill}
                      </Tag>
                    ))}
                  </div>
                ) : null}

                {feedback ? (
                  <Alert tone={getFeedbackTone(feedback.status)} title={feedback.title} showIcon>
                    {feedback.message}
                  </Alert>
                ) : null}
              </div>

              <div className="candidate-public-profile__hero-actions">
                {renderSocialLinks()}
                {renderHeroActions()}
              </div>
            </div>
          </Card>

          <Card className="candidate-public-profile__panel" id="resume">
            <CandidateSectionHeader
              eyebrow="Портфолио"
              title="Резюме"
              description="Доступные резюме и версии профиля появляются здесь с учётом настроек приватности."
              actions={primaryResume?.downloadUrl ? (
                <Button href={primaryResume.downloadUrl} variant="secondary" size="lg">
                  Скачать резюме
                </Button>
              ) : null}
            />

            {renderResumeContent()}
          </Card>

          <section className="candidate-page-section candidate-public-profile__portfolio" id="portfolio">
            <CandidateSectionHeader
              title="Портфолио"
              description="Изучите проекты пользователя и роли, в которых он работал."
            />
            {renderProjectsContent()}
          </section>
        </div>
      </div>

      <Modal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Пригласить в проект"
        description="Выберите свой проект и отправьте пользователю формальный инвайт."
        actions={(
          <>
            <Button variant="secondary" onClick={() => setInviteModalOpen(false)}>
              Отменить
            </Button>
            <Button
              type="submit"
              form="candidate-public-profile-invite-form"
              loading={busyAction === "send-project-invite"}
              disabled={!inviteDraft.projectId || inviteProjectsState.status !== "ready" || !inviteProjectsState.items.length}
            >
              Отправить приглашение
            </Button>
          </>
        )}
      >
        {inviteProjectsState.status === "loading" ? <Loader label="Загружаем ваши проекты" surface /> : null}

        {inviteProjectsState.status === "error" ? (
          <Alert tone="error" title="Не удалось загрузить проекты" showIcon>
            {inviteProjectsState.error}
          </Alert>
        ) : null}

        {inviteProjectsState.status === "ready" ? (
          inviteProjectsState.items.length ? (
            <form id="candidate-public-profile-invite-form" className="candidate-public-profile__invite-form" onSubmit={handleInviteSubmit}>
              <FormField label="Проект">
                <Select
                  value={inviteDraft.projectId}
                  onValueChange={(value) => setInviteDraft((current) => ({ ...current, projectId: value }))}
                  options={inviteProjectsState.items.map((project) => ({
                    value: String(project.id),
                    label: project.title,
                  }))}
                  placeholder="Выберите проект"
                />
              </FormField>

              <FormField label="Роль в проекте">
                <Input
                  value={inviteDraft.role}
                  onValueChange={(value) => setInviteDraft((current) => ({ ...current, role: value }))}
                  placeholder="Например: UX-исследователь"
                />
              </FormField>

              <FormField label="Сообщение">
                <Textarea
                  value={inviteDraft.message}
                  onValueChange={(value) => setInviteDraft((current) => ({ ...current, message: value }))}
                  placeholder="Коротко объясните, зачем зовёте пользователя в проект."
                  autoResize
                />
              </FormField>
            </form>
          ) : (
            <EmptyState
              eyebrow="Нет проектов"
              title="Сначала создайте проект"
              description="Отправить инвайт можно только из уже существующего проекта кандидата."
              tone="neutral"
            />
          )
        ) : null}
      </Modal>
    </main>
  );
}

  return (
    <main className="candidate-public-profile" data-testid="candidate-public-profile-page">
      <div className="candidate-public-profile__shell ui-page-shell">
        <PortalHeader
          navItems={PUBLIC_HEADER_NAV_ITEMS}
          currentKey="opportunities"
          actionHref={routes.candidate.profile}
          actionLabel="Профиль"
          className="candidate-public-profile__header"
        />

        <div className="candidate-public-profile__content">
          {state.status === "loading" ? <Loader label="Загружаем публичный профиль" surface /> : null}

          {state.status === "error" ? (
            <Alert tone="error" title="Не удалось загрузить публичный профиль" showIcon>
              {state.error?.message ?? "Попробуйте обновить страницу позже."}
            </Alert>
          ) : null}

          {feedback ? (
            <Alert tone={getFeedbackTone(feedback.status)} title={feedback.title} showIcon onDismiss={() => setFeedback(null)}>
              {feedback.message}
            </Alert>
          ) : null}

          {state.mode === "preview" && state.error ? (
            <Alert tone="warning" title="Показываем preview профиля" showIcon>
              Не удалось получить актуальные публичные данные, поэтому отображается карточка из локального preview.
            </Alert>
          ) : null}

          {state.status === "ready" && profile ? (
            <>
              <Card className="candidate-public-profile__hero">
                <div className="candidate-public-profile__hero-cover" />

                <div className="candidate-public-profile__hero-body">
                  <Avatar
                    src={getCandidateAvatarUrl(profile) || undefined}
                    alt={`Фото профиля ${getCandidateDisplayName(profile)}`}
                    initials={getCandidateInitials(profile)}
                    size="xl"
                    shape="rounded"
                    tone="neutral"
                    className="candidate-public-profile__avatar"
                  />

                  <div className="candidate-public-profile__hero-main">
                    <div className="candidate-public-profile__hero-badges">
                      <Tag tone="neutral">{state.mode === "public" ? "Публичный профиль" : state.mode === "preview" ? "Preview" : "Демо"}</Tag>
                      {relationship.friendState === "friends" ? <Tag tone="success">Друг</Tag> : null}
                      {relationship.contactState === "saved" && relationship.friendState !== "friends" ? <Tag tone="accent">Контакт</Tag> : null}
                    </div>

                    <div className="candidate-public-profile__hero-copy">
                      <h1 className="ui-type-h1 candidate-public-profile__title">{getCandidateDisplayName(profile)}</h1>
                      {meta ? <p className="ui-type-body-lg candidate-public-profile__meta">{meta}</p> : null}
                    </div>

                    {goal ? (
                      <p className="ui-type-body candidate-public-profile__goal">
                        <strong>Цель:</strong> {goal}
                      </p>
                    ) : null}

                    {normalizeString(profile.description) ? (
                      <p className="ui-type-body candidate-public-profile__description">{normalizeString(profile.description)}</p>
                    ) : null}

                    {skills.length ? (
                      <div className="candidate-public-profile__skills" aria-label="Навыки кандидата">
                        {skills.map((skill) => (
                          <Tag key={skill} tone="accent">
                            {skill}
                          </Tag>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="candidate-public-profile__hero-actions">
                    {renderHeroActions()}
                    {renderSocialLinks()}
                  </div>
                </div>
              </Card>

              <Card className="candidate-public-profile__panel" id="resume">
                <CandidateSectionHeader
                  eyebrow="Портфолио"
                  title="Резюме"
                  description="Просматривайте открытые резюме пользователя и оценивайте актуальность его профиля."
                  actions={primaryResume?.downloadUrl ? (
                    <Button href={primaryResume.downloadUrl} variant="secondary" size="lg" target="_blank" rel="noreferrer">
                      Скачать резюме
                    </Button>
                  ) : null}
                />

                {renderResumeContent()}
              </Card>

              <section className="candidate-page-section candidate-public-profile__portfolio" id="portfolio">
                <CandidateSectionHeader
                  title="Портфолио"
                  description="Здесь показываются проекты, которые пользователь открыл для просмотра."
                />

                {renderProjectsContent()}
              </section>
            </>
          ) : null}
        </div>
      </div>

      <Modal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Пригласить в проект"
        description="Выберите свой проект и при необходимости уточните роль или сообщение для кандидата."
        size="lg"
      >
        {inviteProjectsState.status === "loading" ? (
          <Loader label="Загружаем ваши проекты" surface />
        ) : null}

        {inviteProjectsState.status === "error" ? (
          <Alert tone="error" title="Не удалось загрузить проекты" showIcon>
            {inviteProjectsState.error}
          </Alert>
        ) : null}

        {inviteProjectsState.status === "ready" && !inviteProjectsState.items.length ? (
          <EmptyState
            eyebrow="Нет проектов"
            title="Сначала создайте проект"
            description="После создания проекта вы сможете приглашать в него контакты и друзей."
            tone="neutral"
            actions={<Button href={routes.candidate.projectEdit}>Создать проект</Button>}
          />
        ) : null}

        {inviteProjectsState.status === "ready" && inviteProjectsState.items.length ? (
          <form className="candidate-public-profile__invite-form" onSubmit={handleInviteSubmit}>
            <FormField label="Проект" required>
              <Select
                value={inviteDraft.projectId}
                onValueChange={(value) => setInviteDraft((current) => ({ ...current, projectId: value }))}
                options={inviteProjectsState.items.map((item) => ({
                  value: String(item.id),
                  label: item.title,
                }))}
              />
            </FormField>

            <FormField label="Роль в проекте">
              <Input
                value={inviteDraft.role}
                onValueChange={(value) => setInviteDraft((current) => ({ ...current, role: value }))}
                placeholder="Например, UX researcher"
              />
            </FormField>

            <FormField label="Сообщение">
              <Textarea
                value={inviteDraft.message}
                onValueChange={(value) => setInviteDraft((current) => ({ ...current, message: value }))}
                placeholder="Коротко объясните, зачем приглашаете пользователя."
                autoResize
              />
            </FormField>

            <div className="candidate-public-profile__invite-actions">
              <Button type="button" variant="secondary" onClick={() => setInviteModalOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" loading={busyAction === "send-project-invite"} disabled={!inviteDraft.projectId}>
                Отправить приглашение
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </main>
  );
}
