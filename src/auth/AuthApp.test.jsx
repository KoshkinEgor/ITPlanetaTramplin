import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthApp } from "./AuthApp";

function renderAuth(page, pathname = "/") {
  window.history.pushState({}, "", pathname);

  return render(
    <MemoryRouter>
      <AuthApp page={page} />
    </MemoryRouter>,
  );
}

describe("company registration forms", () => {
  it("does not render an email input on the quick company registration screen", () => {
    const { container } = renderAuth("company-quick");

    expect(screen.getByRole("button", { name: /проверить инн/i })).toBeInTheDocument();
    expect(container.querySelector('input[type="email"]')).toBeNull();
  });

  it("does not render an email input on the extended company registration screen", () => {
    const { container } = renderAuth("company-extended");

    expect(screen.getByRole("button", { name: /проверить инн/i })).toBeInTheDocument();
    expect(container.querySelector('input[type="email"]')).toBeNull();
  });

  it("does not render a curator role option on the quick company registration screen", () => {
    renderAuth("company-quick", "/auth/register/company");

    expect(screen.queryByRole("radio", { name: /я курирую платформу/i })).not.toBeInTheDocument();
  });
});

describe("candidate registration roles", () => {
  it("does not render a curator role option on the candidate registration screen", () => {
    renderAuth("register", "/auth/register/candidate");

    expect(screen.queryByRole("radio", { name: /я курирую платформу/i })).not.toBeInTheDocument();
  });

  it("falls back to the candidate role when curator is passed in the query", () => {
    renderAuth("register", "/auth/register/candidate?role=curator");

    expect(screen.getByRole("radio", { name: /я ищу работу/i })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: /я ищу сотрудников/i })).toHaveAttribute("aria-checked", "false");
  });
});

describe("curator login", () => {
  it("does not render the curator access block on the details step", () => {
    renderAuth("login", "/auth/login?role=curator&step=details");

    expect(screen.queryByText(/Доступ куратора/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/demo-curator@tramplin.local/i)).not.toBeInTheDocument();
  });
});
