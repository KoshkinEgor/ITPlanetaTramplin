import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { AddressAutocomplete } from "./AddressAutocomplete";

vi.mock("../../../api/addresses", () => ({
  searchAddressSuggestions: vi.fn(async (query) => {
    if (String(query).trim().toLowerCase() === "тестовая") {
      return {
        suggestions: [
          {
            label: "ул Тестовая, д. 1",
            value: "ул Тестовая, д 1",
            unrestrictedValue: "г Москва, ул Тестовая, д 1",
            details: "Москва",
            city: "Москва",
            street: "Тестовая",
            house: "1",
            kind: "house",
            latitude: 55.75581,
            longitude: 37.61771,
          },
        ],
        nearbyStreetMatches: [
          {
            label: "ул Тестовая, д. 3",
            value: "ул Тестовая, д 3",
            unrestrictedValue: "г Москва, ул Тестовая, д 3",
            details: "Москва",
            city: "Москва",
            street: "Тестовая",
            house: "3",
            kind: "house",
            latitude: 55.75582,
            longitude: 37.61774,
          },
        ],
      };
    }

    return {
      suggestions: [],
      nearbyStreetMatches: [],
    };
  }),
}));

function ControlledAddressAutocomplete() {
  const [value, setValue] = useState("");

  return (
    <AddressAutocomplete
      value={value}
      city="Москва"
      onValueChange={setValue}
      onSelectOption={(option) => {
        setValue(option.label);
      }}
    />
  );
}

describe("AddressAutocomplete", () => {
  it("renders address suggestions and nearby houses and commits the selected option", async () => {
    render(<ControlledAddressAutocomplete />);

    const input = screen.getByRole("combobox");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Тестовая" } });

    await waitFor(() => {
      expect(screen.getByRole("option", { name: /ул Тестовая, д\. 1/i })).toBeInTheDocument();
    });

    expect(screen.getByText("Ближайшие дома")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: /ул Тестовая, д\. 3/i }));

    expect(input).toHaveValue("ул Тестовая, д. 3");
  });
});
