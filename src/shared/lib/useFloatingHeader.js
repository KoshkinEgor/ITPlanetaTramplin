import { useEffect, useRef, useState } from "react";

export function useFloatingHeader({
  floatingOffset = 88,
  topVisibleOffset = 16,
  hideOffset = 140,
  deltaThreshold = 6,
} = {}) {
  const lastScrollYRef = useRef(0);
  const [isHeaderFloating, setIsHeaderFloating] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  useEffect(() => {
    let ticking = false;

    const updateHeaderVisibility = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollYRef.current;

      setIsHeaderFloating(currentScrollY > floatingOffset);

      if (currentScrollY <= topVisibleOffset) {
        setIsHeaderVisible(true);
      } else if (Math.abs(delta) > deltaThreshold) {
        if (delta < 0) {
          setIsHeaderVisible(true);
        } else if (currentScrollY > hideOffset) {
          setIsHeaderVisible(false);
        }
      }

      lastScrollYRef.current = currentScrollY;
      ticking = false;
    };

    const handleScroll = () => {
      if (ticking) {
        return;
      }

      ticking = true;
      window.requestAnimationFrame(updateHeaderVisibility);
    };

    updateHeaderVisibility();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [deltaThreshold, floatingOffset, hideOffset, topVisibleOffset]);

  return { isHeaderFloating, isHeaderVisible };
}
