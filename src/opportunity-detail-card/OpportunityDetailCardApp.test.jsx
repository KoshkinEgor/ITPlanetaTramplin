import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { OpportunityDetailCardApp } from "./OpportunityDetailCardApp";

function renderDetail(path = "/opportunities/design-ui-ux") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/opportunities/:id" element={<OpportunityDetailCardApp />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("OpportunityDetailCardApp", () => {
  it("renders the enriched demo detail page and cleans up the body class", async () => {
    const { unmount } = renderDetail();

    expect(document.body).toHaveClass("opportunity-card-react-body");
    expect(await screen.findByRole("heading", { name: /UI\/UX/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ключевые навыки" })).toBeInTheDocument();
    expect(screen.getByText("Медиа")).toBeInTheDocument();
    expect(screen.getByText("Вам могут подойти")).toBeInTheDocument();

    unmount();

    expect(document.body).not.toHaveClass("opportunity-card-react-body");
  });
});
