import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { AppRoutes } from "./AppRouter";
import { routes } from "./routes";

vi.mock("../pages/company/index.jsx", async () => {
  const actual = await vi.importActual("../pages/company/index.jsx");

  return {
    ...actual,
    CompanyPublicPage: () => <div data-testid="company-public-route">Company public route</div>,
  };
});

function renderRoutes(path, uiKitEnabled) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes uiKitEnabled={uiKitEnabled} />
    </MemoryRouter>
  );
}

describe("AppRoutes", () => {
  it("renders the ui kit route when it is enabled", () => {
    renderRoutes(routes.uiKit, true);

    expect(screen.getByTestId("ui-kit-page")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "UI Kit Playground" })).toBeInTheDocument();
  });

  it("does not expose the ui kit route when it is disabled", () => {
    renderRoutes(routes.uiKit, false);

    expect(screen.queryByTestId("ui-kit-page")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Страница не найдена" })).toBeInTheDocument();
  });

  it("redirects the removed temporary ui kit route back to the app", () => {
    renderRoutes("/ui-kit/typography-temp", true);

    expect(screen.queryByTestId("ui-kit-page")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Построй карьеру мечты" })).toBeInTheDocument();
  });

  it("renders the not found page for unknown routes", () => {
    renderRoutes("/missing/page", false);

    expect(screen.getByRole("heading", { name: "Страница не найдена" })).toBeInTheDocument();
    expect(screen.getByLabelText("Запрошенный адрес")).toHaveTextContent("/missing/page");
    expect(screen.getByRole("button", { name: "Скопировать запрос" })).toBeInTheDocument();
  });

  it("renders the demo opportunity detail route", async () => {
    renderRoutes(routes.opportunities.detailCard, false);

    expect(await screen.findByRole("heading", { name: /UI\/UX/i, level: 1 })).toBeInTheDocument();
  });

  it("renders the public company route", () => {
    renderRoutes("/companies/42", false);

    expect(screen.getByTestId("company-public-route")).toBeInTheDocument();
  });
});
