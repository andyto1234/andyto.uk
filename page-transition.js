(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!document.body || prefersReducedMotion.matches) {
    return;
  }

  const transitionDelayMs = 190;
  const resetDelayMs = 520;
  let isTransitioning = false;
  let resetTimer = 0;

  const isNavigableAsset = (pathname) =>
    !/\.(pdf|png|jpe?g|gif|svg|webp|mp4|mov)$/i.test(pathname);

  const getTransitionTarget = (link, event) => {
    if (
      !link ||
      isTransitioning ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      link.hasAttribute("download")
    ) {
      return null;
    }

    const target = link.getAttribute("target");
    if (target && target !== "_self") {
      return null;
    }

    const href = link.getAttribute("href");
    if (
      !href ||
      href.startsWith("#") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("javascript:")
    ) {
      return null;
    }

    const url = new URL(link.href, window.location.href);

    if (url.origin !== window.location.origin || !isNavigableAsset(url.pathname)) {
      return null;
    }

    if (
      url.pathname === window.location.pathname &&
      url.search === window.location.search
    ) {
      return null;
    }

    return url;
  };

  const clearLeavingState = () => {
    isTransitioning = false;
    document.body.classList.remove("is-leaving");
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    const url = getTransitionTarget(link, event);

    if (!url) {
      return;
    }

    event.preventDefault();
    isTransitioning = true;
    document.body.classList.add("is-leaving");
    window.clearTimeout(resetTimer);

    window.setTimeout(() => {
      window.location.href = url.href;
    }, transitionDelayMs);

    resetTimer = window.setTimeout(clearLeavingState, resetDelayMs);
  });

  window.addEventListener("pageshow", clearLeavingState);
})();
