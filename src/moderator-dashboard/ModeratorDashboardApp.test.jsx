import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthSession } from "../auth/api";
import { getModerationCompanies, getModerationOpportunities, getModerationUsers } from "../api/moderation";
import { ApiError } from "../lib/http";
import { ModeratorDashboardApp } from "./ModeratorDashboardApp";

vi.mock("../auth/api", () => ({
  useAuthSession: vi.fn(),
}));

vi.mock("../api/moderation", () => ({
  getModerationCompanies: vi.fn(),
  getModerationOpportunities: vi.fn(),
  getModerationUsers: vi.fn(),
}));

function renderDashboard() {
  return render(
    <MemoryRouter>
      <ModeratorDashboardApp />
    </MemoryRouter>
  );
}

describe("ModeratorDashboardApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getModerationCompanies.mockResolvedValue([]);
    getModerationOpportunities.mockResolvedValue([]);
    getModerationUsers.mockResolvedValue([]);
  });

  it("waits for an authenticated moderator session before loading dashboard data", async () => {
    let authSession = {
      status: "loading",
      user: null,
      error: null,
    };

    useAuthSession.mockImplementation(() => authSession);

    const view = renderDashboard();

    expect(getModerationCompanies).not.toHaveBeenCalled();
    expect(getModerationOpportunities).not.toHaveBeenCalled();
    expect(getModerationUsers).not.toHaveBeenCalled();

    authSession = {
      status: "authenticated",
      user: {
        id: 7,
        role: "moderator",
        email: "moderator@example.com",
      },
      error: null,
    };

    view.rerender(
      <MemoryRouter>
        <ModeratorDashboardApp />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getModerationCompanies).toHaveBeenCalledTimes(1);
      expect(getModerationOpportunities).toHaveBeenCalledTimes(1);
      expect(getModerationUsers).toHaveBeenCalledTimes(1);
    });
  });

  it("shows the unauthorized state on 403 responses instead of a generic dashboard error", async () => {
    useAuthSession.mockReturnValue({
      status: "authenticated",
      user: {
        id: 7,
        role: "moderator",
        email: "moderator@example.com",
      },
      error: null,
    });

    getModerationCompanies.mockRejectedValue(new ApiError("Forbidden", { status: 403 }));

    renderDashboard();

    expect(await screen.findByText(/Нужна роль модератора/i)).toBeInTheDocument();
    expect(screen.queryByText(/Не удалось загрузить дашборд/i)).not.toBeInTheDocument();
  });
});
