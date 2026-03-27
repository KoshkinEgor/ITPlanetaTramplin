import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CandidatePublicProfilePage } from "./CandidatePublicProfilePage";
import {
  acceptCandidateFriendRequest,
  createCandidateProjectInvite,
  deleteCandidateFriend,
  getCandidateProjects,
  getCandidatePublicProfile,
} from "../../api/candidate";
import { useAuthSession } from "../../auth/api";

vi.mock("../../api/candidate", () => ({
  getCandidatePublicProfile: vi.fn(),
  getCandidateProjects: vi.fn(),
  createCandidateContact: vi.fn(),
  createCandidateFriendRequest: vi.fn(),
  acceptCandidateFriendRequest: vi.fn(),
  deleteCandidateFriend: vi.fn(),
  declineCandidateFriendRequest: vi.fn(),
  cancelCandidateFriendRequest: vi.fn(),
  acceptCandidateProjectInvite: vi.fn(),
  declineCandidateProjectInvite: vi.fn(),
  cancelCandidateProjectInvite: vi.fn(),
  createCandidateProjectInvite: vi.fn(),
}));

vi.mock("../../auth/api", () => ({
  useAuthSession: vi.fn(() => ({ status: "guest", user: null, error: null })),
}));

function renderPage(initialEntry) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <CandidatePublicProfilePage />
    </MemoryRouter>
  );
}

describe("CandidatePublicProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthSession.mockReturnValue({ status: "guest", user: null, error: null });
    getCandidateProjects.mockResolvedValue([]);
  });

  it("renders public profile data and visible contact links", async () => {
    getCandidatePublicProfile.mockResolvedValue({
      userId: 42,
      name: "Мария",
      surname: "Соколова",
      description: "Исследую пользовательские сценарии и люблю прототипирование.",
      skills: ["Research", "UX"],
      links: {
        onboarding: {
          city: "Казань",
          goal: "Найти продуктовую стажировку",
        },
      },
      education: {
        institutionName: "КФУ",
        courseLabel: "3 курс",
        graduationYear: 2027,
      },
      projects: [],
      resumes: [],
      socialLinks: {
        telegram: "t.me/maria",
      },
      relationship: {
        contactState: "none",
        friendState: "none",
        projectInviteState: "none",
      },
      hasProjects: false,
      hasResumes: false,
      hasSocialLinks: true,
      canSeeProjects: true,
      canSeeSocialLinks: true,
    });

    renderPage("/candidate/public?userId=42");

    expect(await screen.findByRole("heading", { name: "Мария Соколова" })).toBeInTheDocument();
    expect(screen.getByText(/Найти продуктовую стажировку/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Telegram" })).toHaveAttribute("href", "https://t.me/maria");
    expect(screen.getByRole("button", { name: "Добавить в контакты" })).toBeInTheDocument();
  });

  it("handles incoming friend request actions from the public profile", async () => {
    getCandidatePublicProfile.mockResolvedValue({
      userId: 42,
      name: "Мария",
      surname: "Соколова",
      description: "",
      skills: ["Research"],
      links: { onboarding: {} },
      education: null,
      projects: [],
      resumes: [],
      socialLinks: null,
      relationship: {
        contactState: "none",
        friendState: "incoming",
        projectInviteState: "none",
        friendRequestId: 17,
      },
      hasProjects: false,
      hasResumes: false,
      hasSocialLinks: false,
      canSeeProjects: true,
      canSeeSocialLinks: false,
    });
    acceptCandidateFriendRequest.mockResolvedValue({
      id: 17,
      counterparty: {
        relationship: {
          contactState: "saved",
          friendState: "friends",
          projectInviteState: "none",
        },
      },
    });

    renderPage("/candidate/public?userId=42");

    expect(await screen.findByRole("button", { name: "Принять в друзья" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Принять в друзья" }));

    await waitFor(() => {
      expect(acceptCandidateFriendRequest).toHaveBeenCalledWith(17);
    });
  });

  it("allows removing an existing friend from the public profile", async () => {
    getCandidatePublicProfile.mockResolvedValue({
      userId: 42,
      name: "РњР°СЂРёСЏ",
      surname: "РЎРѕРєРѕР»РѕРІР°",
      description: "",
      skills: ["Research"],
      links: { onboarding: {} },
      education: null,
      projects: [],
      resumes: [],
      socialLinks: null,
      relationship: {
        contactState: "saved",
        friendState: "friends",
        projectInviteState: "none",
        canInviteToProject: true,
      },
      hasProjects: false,
      hasResumes: false,
      hasSocialLinks: false,
      canSeeProjects: true,
      canSeeSocialLinks: false,
    });
    deleteCandidateFriend.mockResolvedValue({});

    renderPage("/candidate/public?userId=42");

    fireEvent.click(await screen.findByRole("button", { name: "РЈРґР°Р»РёС‚СЊ РёР· РґСЂСѓР·РµР№" }));

    await waitFor(() => {
      expect(deleteCandidateFriend).toHaveBeenCalledWith(42);
    });
  });

  it("opens the invite modal for saved contacts and sends a project invite", async () => {
    useAuthSession.mockReturnValue({
      status: "authenticated",
      user: {
        id: 7,
        role: "candidate",
        email: "viewer@tramplin.local",
      },
      error: null,
    });

    getCandidatePublicProfile.mockResolvedValue({
      userId: 42,
      name: "Мария",
      surname: "Соколова",
      description: "",
      skills: ["Research"],
      links: { onboarding: {} },
      education: null,
      projects: [],
      resumes: [],
      socialLinks: null,
      relationship: {
        contactState: "saved",
        friendState: "none",
        projectInviteState: "none",
        canInviteToProject: true,
      },
      hasProjects: false,
      hasResumes: false,
      hasSocialLinks: false,
      canSeeProjects: true,
      canSeeSocialLinks: false,
    });
    getCandidateProjects.mockResolvedValue([
      {
        id: 9,
        title: "Исследование onboarding",
      },
    ]);
    createCandidateProjectInvite.mockResolvedValue({
      id: 5,
      status: "pending",
    });

    renderPage("/candidate/public?userId=42");

    fireEvent.click(await screen.findByRole("button", { name: "Пригласить в проект" }));

    expect(await screen.findByRole("dialog", { name: "Пригласить в проект" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Исследование onboarding" })).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Например: UX-исследователь"), {
      target: { value: "UX-исследователь" },
    });
    fireEvent.change(screen.getByPlaceholderText("Коротко объясните, зачем зовёте пользователя в проект."), {
      target: { value: "Присоединяйся к discovery-команде" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Отправить приглашение" }));

    await waitFor(() => {
      expect(createCandidateProjectInvite).toHaveBeenCalledWith({
        recipientUserId: 42,
        projectId: 9,
        role: "UX-исследователь",
        message: "Присоединяйся к discovery-команде",
      });
    });
  });
});
