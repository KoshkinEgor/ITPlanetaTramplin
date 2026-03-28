import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  readFavoriteCompanyIds,
  readFavoriteOpportunityIds,
  subscribeToFavorites,
  writeFavoriteCompanyIds,
  writeFavoriteOpportunityIds,
} from "./storage";

describe("favorites storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores company and opportunity favorites independently", () => {
    writeFavoriteOpportunityIds(["1", "2", "2"]);
    writeFavoriteCompanyIds(["10", "10", "11"]);

    expect(readFavoriteOpportunityIds()).toEqual(["1", "2"]);
    expect(readFavoriteCompanyIds()).toEqual(["10", "11"]);
  });

  it("emits an atomic snapshot to all-scope subscribers", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToFavorites(listener, { scope: "all" });

    writeFavoriteOpportunityIds(["1"]);
    writeFavoriteCompanyIds(["10"]);

    expect(listener).toHaveBeenLastCalledWith({
      opportunityIds: ["1"],
      companyIds: ["10"],
    });

    unsubscribe();
  });

  it("supports scoped company subscriptions", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToFavorites(listener, { scope: "companies" });

    writeFavoriteCompanyIds(["42"]);

    expect(listener).toHaveBeenLastCalledWith(["42"]);

    unsubscribe();
  });
});
