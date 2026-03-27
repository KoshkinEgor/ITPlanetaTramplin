import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { CityAutocomplete } from "./CityAutocomplete";

vi.mock("../../../api/cities", async () => {
  const actual = await vi.importActual("../../../api/cities");

  return {
    ...actual,
    searchCityOptions: vi.fn(async (query) => {
      if (String(query).trim().toLowerCase() === "che") {
        return [
          {
            id: "cheboksary|chuvashia|ru",
            name: "Чебоксары",
            label: "Чебоксары, Чувашия",
            admin1: "Чувашия",
            country: "Россия",
            countryCode: "RU",
            latitude: 56.1439,
            longitude: 47.251942,
          },
        ];
      }

      return [];
    }),
  };
});

function ControlledCityAutocomplete() {
  const [value, setValue] = useState("Чебоксары");

  return (
    <CityAutocomplete
      value={value}
      onValueChange={setValue}
      fallbackOptions={[{ name: "Чебоксары", admin1: "Чувашия", country: "Россия", countryCode: "RU" }]}
    />
  );
}

describe("CityAutocomplete", () => {
  it("renders the current city and lets the user choose a remote suggestion", async () => {
    render(<ControlledCityAutocomplete />);

    const input = screen.getByRole("combobox");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Che" } });

    await waitFor(() => {
      expect(screen.getByRole("option", { name: /Чебоксары/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("option", { name: /Чебоксары/i }));

    expect(input).toHaveValue("Чебоксары");
  });
});
