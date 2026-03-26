import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SegmentedControl } from "./SegmentedControl";

const items = [
  { value: "resume", label: "Р РµР·СЋРјРµ" },
  { value: "portfolio", label: "РџРѕСЂС‚С„РѕР»РёРѕ" },
];

describe("SegmentedControl", () => {
  it("switches the active item in uncontrolled mode", () => {
    render(<SegmentedControl items={items} defaultValue="portfolio" ariaLabel="РџРµСЂРµРєР»СЋС‡Р°С‚РµР»СЊ РїСЂРѕС„РёР»СЏ" />);

    fireEvent.click(screen.getByRole("button", { name: "Р РµР·СЋРјРµ" }));

    expect(screen.getByRole("button", { name: "Р РµР·СЋРјРµ" })).toHaveClass("is-active");
    expect(screen.getByRole("button", { name: "РџРѕСЂС‚С„РѕР»РёРѕ" })).not.toHaveClass("is-active");
  });

  it("calls onChange and respects the controlled value", () => {
    const handleChange = vi.fn();

    const { rerender } = render(
      <SegmentedControl items={items} value="resume" onChange={handleChange} ariaLabel="РџРµСЂРµРєР»СЋС‡Р°С‚РµР»СЊ РїСЂРѕС„РёР»СЏ" />
    );

    fireEvent.click(screen.getByRole("button", { name: "РџРѕСЂС‚С„РѕР»РёРѕ" }));

    expect(handleChange).toHaveBeenCalledWith("portfolio");
    expect(screen.getByRole("button", { name: "Р РµР·СЋРјРµ" })).toHaveClass("is-active");

    rerender(<SegmentedControl items={items} value="portfolio" onChange={handleChange} ariaLabel="РџРµСЂРµРєР»СЋС‡Р°С‚РµР»СЊ РїСЂРѕС„РёР»СЏ" />);

    expect(screen.getByRole("button", { name: "РџРѕСЂС‚С„РѕР»РёРѕ" })).toHaveClass("is-active");
  });

  it("applies the shared medium font weight and full width classes", () => {
    render(<SegmentedControl items={items} fontWeight="medium" width="full" ariaLabel="РџРµСЂРµРєР»СЋС‡Р°С‚РµР»СЊ РїСЂРѕС„РёР»СЏ" />);

    const segmented = screen.getByRole("group", { name: "РџРµСЂРµРєР»СЋС‡Р°С‚РµР»СЊ РїСЂРѕС„РёР»СЏ" });

    expect(segmented).toHaveClass("ui-font-weight-medium");
    expect(segmented).toHaveClass("ui-width-full");
  });
});
