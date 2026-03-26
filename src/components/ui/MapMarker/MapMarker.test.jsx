import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MapMarker } from "./MapMarker";

describe("MapMarker", () => {
  it("renders a labeled pin marker with the selected tone", () => {
    render(<MapMarker tone="green" label="IT Planet" />);

    const marker = screen.getByLabelText("IT Planet");

    expect(marker).toHaveClass("ui-map-marker--pin");
    expect(marker).toHaveClass("ui-map-marker--green");
    expect(screen.getByText("IT Planet")).toBeInTheDocument();
  });

  it("renders a cluster marker with a count", () => {
    render(<MapMarker variant="cluster" count={8} ariaLabel="Cluster marker" />);

    const marker = screen.getByLabelText("Cluster marker");

    expect(marker).toHaveClass("ui-map-marker--cluster");
    expect(screen.getByText("8")).toBeInTheDocument();
  });
});
