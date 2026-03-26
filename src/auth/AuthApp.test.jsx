import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AuthApp } from "./AuthApp";

function renderAuth(page) {
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
});
