export function scrollToHashTarget(hash, { offset = 0, behavior = "smooth" } = {}) {
  if (typeof window === "undefined" || !hash) {
    return false;
  }

  const normalizedHash = String(hash).replace(/^#/, "");

  if (!normalizedHash) {
    return false;
  }

  const target = document.getElementById(normalizedHash);

  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const nextTop = target.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({
    top: Math.max(0, nextTop),
    behavior,
  });

  return true;
}

export function scheduleHashScroll(
  hash,
  {
    offset = 0,
    behavior = "smooth",
    attempts = 8,
    retryDelay = 120,
  } = {}
) {
  if (typeof window === "undefined" || !hash) {
    return () => {};
  }

  let frameId = 0;
  let timeoutId = 0;
  let isCancelled = false;

  const tryScroll = (remainingAttempts) => {
    if (isCancelled) {
      return;
    }

    if (scrollToHashTarget(hash, { offset, behavior }) || remainingAttempts <= 1) {
      return;
    }

    timeoutId = window.setTimeout(() => {
      tryScroll(remainingAttempts - 1);
    }, retryDelay);
  };

  frameId = window.requestAnimationFrame(() => {
    tryScroll(attempts);
  });

  return () => {
    isCancelled = true;
    window.cancelAnimationFrame(frameId);
    window.clearTimeout(timeoutId);
  };
}
