import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { CandidateProfileSummary } from "./CandidateProfileSummary";

const profile = {
  name: "Anna",
  surname: "Kovaleva",
  email: "anna@example.com",
  description: "Product-minded candidate with a strong portfolio.",
  skills: ["SQL", "UX", "Figma"],
};

const stats = [
  { value: "12", label: "Responses" },
  { value: "4", label: "Projects" },
  { value: "19", label: "Contacts" },
  { value: "6", label: "Achievements" },
];

function renderSummary(variant) {
  return render(
    <MemoryRouter>
      <CandidateProfileSummary profile={profile} stats={stats} completion={70} variant={variant} />
    </MemoryRouter>
  );
}

describe("CandidateProfileSummary", () => {
  it("renders the full variant with long description and edit action", () => {
    renderSummary("full");

    expect(screen.getByText("Product-minded candidate with a strong portfolio.")).toBeInTheDocument();
    expect(screen.getByRole("link")).toBeInTheDocument();
  });

  it("renders the compact variant without long description or edit action", () => {
    renderSummary("compact");

    expect(screen.getByText("anna@example.com")).toBeInTheDocument();
    expect(screen.queryByText("Product-minded candidate with a strong portfolio.")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
