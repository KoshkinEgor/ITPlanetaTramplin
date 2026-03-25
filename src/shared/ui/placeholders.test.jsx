import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PlaceholderAction, PlaceholderBlock, PlaceholderMedia } from "./index";

describe("shared placeholder primitives", () => {
  it("renders PlaceholderBlock, PlaceholderAction, and PlaceholderMedia from shared/ui", () => {
    render(
      <>
        <PlaceholderBlock
          eyebrow="Scaffold"
          title="Block title"
          description="Block description"
          action={<PlaceholderAction label="Nested action" description="Nested action description" />}
        >
          <div>Nested placeholder content</div>
        </PlaceholderBlock>

        <PlaceholderMedia
          eyebrow="Media"
          title="Media title"
          description="Media description"
          actionLabel="Media action"
          actionDescription="Media action description"
        />
      </>
    );

    expect(screen.getByText("Block title")).toBeInTheDocument();
    expect(screen.getByText("Block description")).toBeInTheDocument();
    expect(screen.getByText("Nested placeholder content")).toBeInTheDocument();
    expect(screen.getByText("Nested action")).toBeInTheDocument();
    expect(screen.getByText("Nested action description")).toBeInTheDocument();
    expect(screen.getByText("Media title")).toBeInTheDocument();
    expect(screen.getByText("Media description")).toBeInTheDocument();
    expect(screen.getByText("Media action")).toBeInTheDocument();
    expect(screen.getByText("Media action description")).toBeInTheDocument();
  });
});
