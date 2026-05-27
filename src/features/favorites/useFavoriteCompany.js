import { useCallback, useEffect, useState } from "react";
import {
  isFavoriteCompany,
  normalizeCompanyId,
  subscribeToFavorites,
  toggleFavoriteCompany,
} from "./storage";

export function useFavoriteCompany(companyId, initiallyPressed = false) {
  const normalizedCompanyId = normalizeCompanyId(companyId);
  const [isFavorite, setIsFavorite] = useState(() => (
    Boolean(initiallyPressed) || (normalizedCompanyId ? isFavoriteCompany(normalizedCompanyId) : false)
  ));

  useEffect(() => {
    setIsFavorite(Boolean(initiallyPressed) || (normalizedCompanyId ? isFavoriteCompany(normalizedCompanyId) : false));
  }, [initiallyPressed, normalizedCompanyId]);

  useEffect(() => {
    return subscribeToFavorites((ids) => {
      if (!normalizedCompanyId) {
        setIsFavorite(Boolean(initiallyPressed));
        return;
      }

      setIsFavorite(Boolean(initiallyPressed) || ids.includes(normalizedCompanyId));
    }, { scope: "companies" });
  }, [initiallyPressed, normalizedCompanyId]);

  const toggleFavorite = useCallback(() => {
    if (!normalizedCompanyId) {
      return false;
    }

    const nextState = toggleFavoriteCompany(normalizedCompanyId);
    setIsFavorite(nextState);
    return nextState;
  }, [normalizedCompanyId]);

  return {
    companyId: normalizedCompanyId,
    isFavorite,
    toggleFavorite,
  };
}
