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
  statusText: "Готов к редактированию",
  note: "Компания отображается в каталоге и может обновлять контент секциями.",
};

function renderSummary() {
  return render(
    <MemoryRouter>
      <CompanyProfileSummary profile={profile} stats={stats} verification={verification} />
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

  it("shows the verification call to action for the company profile", () => {
    renderSummary();

    expect(screen.getByText("Готов к редактированию")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Перейти к редактированию" })).toHaveAttribute("href", "/company/dashboard");
  });
});
