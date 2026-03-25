import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { CabinetContentSection, CabinetShell, CabinetSidebar } from "./CabinetShell";

describe("CabinetShell", () => {
  it("renders header, sidebar, summary, and content regions", () => {
    render(
      <MemoryRouter>
        <CabinetShell
          header={<div>Header slot</div>}
          sidebar={(
            <CabinetSidebar
              title="Cabinet navigation"
              items={[{ key: "profile", label: "Profile", href: "/profile" }]}
              activeKey="profile"
              footerSummary={<div>Sidebar footer</div>}
            />
          )}
          summary={<div>Summary slot</div>}
        >
          <CabinetContentSection title="Content title">
            <div>Main content</div>
          </CabinetContentSection>
        </CabinetShell>
      </MemoryRouter>
    );

    expect(screen.getByText("Header slot")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Profile" })).toBeInTheDocument();
    expect(screen.getByText("Sidebar footer")).toBeInTheDocument();
    expect(screen.getByText("Summary slot")).toBeInTheDocument();
    expect(screen.getByText("Content title")).toBeInTheDocument();
    expect(screen.getByText("Main content")).toBeInTheDocument();
  });
});
