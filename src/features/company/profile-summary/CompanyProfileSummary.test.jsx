import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { CompanyProfileSummary } from "./CompanyProfileSummary";

const profile = {
  companyName: 'ООО "Компани"',
  inn: "7701234567",
  legalAddress: "г. Москва, Ленинский проспект 42/23",
  description: "Команда в сфере информационной безопасности, которая развивает продукты для корпоративных клиентов.",
  socials: '[{"type":"telegram","url":"https://t.me/kompani"},{"type":"website","url":"kompani.ru"}]',
};

const stats = [
  { value: "21", label: "Открытые вакансии" },
  { value: "155", label: "Проведенные мероприятия" },
  { value: "48", label: "Сотрудников в Tramplin" },
];

const verification = {
  label: "Подтверждена",
  tone: "approved",
  statusText: "Можно редактировать",
  note: "Компания уже видна в каталоге.",
  actionLabel: "Редактировать",
};

function renderSummary(props = {}) {
  return render(
    <MemoryRouter>
      <CompanyProfileSummary profile={profile} stats={stats} verification={verification} {...props} />
    </MemoryRouter>
  );
}

describe("CompanyProfileSummary", () => {
  it("renders the company header with parsed social links", () => {
    renderSummary();

    expect(screen.getByRole("heading", { name: 'ООО "Компани"' })).toBeInTheDocument();
    expect(screen.getByText("7701234567")).toBeInTheDocument();
    expect(screen.getByText("г. Москва, Ленинский проспект 42/23")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "TG" })).toHaveAttribute("href", "https://t.me/kompani");
    expect(screen.getByRole("link", { name: "SITE" })).toHaveAttribute("href", "https://kompani.ru");
    expect(screen.queryByText(/"type":"telegram"/i)).not.toBeInTheDocument();
  });

  it("shows the verification call to action for the company cabinet", () => {
    renderSummary();

    expect(screen.getByText("Можно редактировать")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Редактировать" })).toHaveAttribute("href", "/company/dashboard");
    expect(screen.getByText("Кабинет компании")).toBeInTheDocument();
  });

  it("hides the edit call to action in public mode", () => {
    renderSummary({ mode: "public" });

    expect(screen.getAllByText("Компания").length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "Редактировать" })).not.toBeInTheDocument();
  });
});
