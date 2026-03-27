import { useCallback, useEffect, useState } from "react";
import {
  isFavoriteOpportunity,
  normalizeOpportunityId,
  subscribeToFavorites,
  toggleFavoriteOpportunity,
} from "./storage";

export function useFavoriteOpportunity(opportunityId, initiallyPressed = false) {
  const normalizedOpportunityId = normalizeOpportunityId(opportunityId);
  const [isFavorite, setIsFavorite] = useState(() => (
    Boolean(initiallyPressed) || (normalizedOpportunityId ? isFavoriteOpportunity(normalizedOpportunityId) : false)
  ));

  useEffect(() => {
    setIsFavorite(Boolean(initiallyPressed) || (normalizedOpportunityId ? isFavoriteOpportunity(normalizedOpportunityId) : false));
  }, [initiallyPressed, normalizedOpportunityId]);

  useEffect(() => {
    return subscribeToFavorites((ids) => {
      if (!normalizedOpportunityId) {
        setIsFavorite(Boolean(initiallyPressed));
        return;
      }

      setIsFavorite(Boolean(initiallyPressed) || ids.includes(normalizedOpportunityId));
    });
  }, [initiallyPressed, normalizedOpportunityId]);

  const toggleFavorite = useCallback(() => {
    if (!normalizedOpportunityId) {
      return false;
    }

    const nextState = toggleFavoriteOpportunity(normalizedOpportunityId);
    setIsFavorite(nextState);
    return nextState;
  }, [normalizedOpportunityId]);

  return {
    opportunityId: normalizedOpportunityId,
    isFavorite,
    toggleFavorite,
  };
}

