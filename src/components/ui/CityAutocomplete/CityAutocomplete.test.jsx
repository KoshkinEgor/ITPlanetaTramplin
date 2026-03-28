import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { CityAutocomplete } from "./CityAutocomplete";

vi.mock("../../../api/cities", async () => {
  const actual = await vi.importActual("../../../api/cities");

  return {
    ...actual,
    searchCityOptions: vi.fn(async (query) => {
      const normalizedQuery = String(query).trim().toLowerCase();

      if (normalizedQuery === "che") {
        return [
          {
            name: "Cheboksary",
            admin1: "Chuvashia",
            country: "Russia",
            countryCode: "RU",
            latitude: 56.1439,
            longitude: 47.251942,
          },
        ];
      }

      if (normalizedQuery === "spring" || normalizedQuery === "springfield") {
        return [
          {
            name: "Springfield",
            admin1: "Illinois",
            admin2: "Sangamon County",
            country: "United States",
            countryCode: "US",
            latitude: 39.78172,
            longitude: -89.65015,
          },
          {
            name: "Springfield",
            admin1: "Tennessee",
            admin2: "Shelby County",
            country: "United States",
            countryCode: "US",
            latitude: 35.48341,
            longitude: -86.46027,
          },
        ];
      }

      return [];
    }),
  };
});

function ControlledCityAutocomplete() {
  const [value, setValue] = useState("Cheboksary");
  const [selectedOption, setSelectedOption] = useState({
    name: "Cheboksary",
    admin1: "Chuvashia",
    country: "Russia",
    countryCode: "RU",
    latitude: 56.1439,
    longitude: 47.251942,
  });

  return (
    <CityAutocomplete
      value={value}
      selectedOption={selectedOption}
      selectedOptionId={selectedOption?.id}
      onValueChange={setValue}
      onSelectOption={setSelectedOption}
      fallbackOptions={[{ name: "Cheboksary", admin1: "Chuvashia", country: "Russia", countryCode: "RU" }]}
    />
  );
}

function DuplicateCityAutocomplete() {
  const [value, setValue] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);

  return (
    <>
      <CityAutocomplete
        value={value}
        selectedOption={selectedOption}
        selectedOptionId={selectedOption?.id}
        onValueChange={setValue}
        onSelectOption={setSelectedOption}
      />
      <output data-testid="selected-city-label">{selectedOption?.label ?? ""}</output>
      <output data-testid="selected-city-latitude">{selectedOption?.latitude ?? ""}</output>
      <output data-testid="selected-city-longitude">{selectedOption?.longitude ?? ""}</output>
    </>
  );
}

describe("CityAutocomplete", () => {
  it("renders the current city and lets the user choose a remote suggestion", async () => {
    render(<ControlledCityAutocomplete />);

    const input = screen.getByRole("combobox");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Che" } });

    await waitFor(() => {
      expect(screen.getByRole("option", { name: /Cheboksary/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("option", { name: /Cheboksary/i }));

    expect(input).toHaveValue("Cheboksary");
  });

  it("preserves the selected duplicate-name city by coordinates when Enter is pressed again", async () => {
    render(<DuplicateCityAutocomplete />);

    const input = screen.getByRole("combobox");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Spring" } });

    const secondaryOption = await screen.findByRole("option", { name: /Shelby County/i });
    fireEvent.click(secondaryOption);

    await waitFor(() => {
      expect(screen.getByTestId("selected-city-label")).toHaveTextContent("Shelby County");
      expect(screen.getByTestId("selected-city-latitude")).toHaveTextContent("35.48341");
      expect(screen.getByTestId("selected-city-longitude")).toHaveTextContent("-86.46027");
    });

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Springfield" } });

    await screen.findByRole("option", { name: /Shelby County/i });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByTestId("selected-city-label")).toHaveTextContent("Shelby County");
      expect(screen.getByTestId("selected-city-latitude")).toHaveTextContent("35.48341");
      expect(screen.getByTestId("selected-city-longitude")).toHaveTextContent("-86.46027");
    });
  });
});
