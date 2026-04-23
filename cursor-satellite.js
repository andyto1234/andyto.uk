(function () {
  const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!hasFinePointer.matches || prefersReducedMotion.matches || !document.body) {
    return;
  }

  const aboutSun = document.querySelector(".about-header__sun");

  const cursorSatellite = document.createElement("div");
  cursorSatellite.className = "cursor-satellite";
  cursorSatellite.setAttribute("aria-hidden", "true");

  const satelliteImage = document.createElement("img");
  satelliteImage.className = "cursor-satellite__image";
  satelliteImage.src = "./images/cursor/hinode-cursor.png";
  satelliteImage.alt = "";
  satelliteImage.width = 58;
  satelliteImage.height = 46;
  satelliteImage.decoding = "async";

  const rasterPanel = document.createElement("div");
  rasterPanel.className = "cursor-satellite__raster";

  const rasterFrame = document.createElement("div");
  rasterFrame.className = "cursor-satellite__raster-frame";

  const rasterViewport = document.createElement("div");
  rasterViewport.className = "cursor-satellite__raster-viewport";

  const rasterImage = document.createElement("img");
  rasterImage.className = "cursor-satellite__raster-image";
  rasterImage.src = "./images/easter-eggs/eis-raster-pixel.png";
  rasterImage.alt = "";
  rasterImage.width = 26;
  rasterImage.height = 27;
  rasterImage.decoding = "async";

  const rasterSlit = document.createElement("span");
  rasterSlit.className = "cursor-satellite__raster-slit";
  rasterSlit.setAttribute("aria-hidden", "true");

  rasterViewport.appendChild(rasterImage);
  rasterViewport.appendChild(rasterSlit);
  rasterFrame.appendChild(rasterViewport);
  rasterPanel.appendChild(rasterFrame);
  cursorSatellite.appendChild(satelliteImage);
  cursorSatellite.appendChild(rasterPanel);
  document.body.appendChild(cursorSatellite);

  let pointerX = window.innerWidth * 0.5;
  let pointerY = window.innerHeight * 0.5;
  let satelliteX = pointerX;
  let satelliteY = pointerY;
  let isVisible = false;
  let lastMoveTime = performance.now();

  const easterEgg = {
    active: false,
    hoverTimer: null,
    isHoveringSun: false,
    playedThisHover: false,
    startTime: 0
  };

  const scanTiming = {
    hoverDelay: 220,
    fadeIn: 140,
    scan: 1180,
    linger: 320,
    fadeOut: 240
  };

  const updateRasterSide = () => {
    const needsLeftPanel = pointerX > window.innerWidth - 170;
    cursorSatellite.classList.toggle("is-raster-left", needsLeftPanel);
  };

  const showSatellite = () => {
    if (!isVisible) {
      cursorSatellite.classList.add("is-visible");
      isVisible = true;
    }
  };

  const hideSatellite = () => {
    cursorSatellite.classList.remove("is-visible");
    isVisible = false;
    resetEasterEgg(true);
  };

  const clearHoverTimer = () => {
    if (easterEgg.hoverTimer) {
      window.clearTimeout(easterEgg.hoverTimer);
      easterEgg.hoverTimer = null;
    }
  };

  const setSunHovering = (isHovering) => {
    if (!aboutSun || easterEgg.isHoveringSun === isHovering) {
      return;
    }

    easterEgg.isHoveringSun = isHovering;

    if (isHovering) {
      clearHoverTimer();
      if (!easterEgg.playedThisHover) {
        easterEgg.hoverTimer = window.setTimeout(
          startEasterEgg,
          scanTiming.hoverDelay
        );
      }
      return;
    }

    clearHoverTimer();
    easterEgg.playedThisHover = false;

    if (!easterEgg.active) {
      aboutSun.classList.remove("is-scanning");
      aboutSun.style.removeProperty("--sun-scan-x");
    }
  };

  const resetRasterReveal = () => {
    rasterViewport.style.setProperty("--raster-mask-left", "100%");
    rasterSlit.style.opacity = "0";
  };

  const resetEasterEgg = (resetHoverState = false) => {
    clearHoverTimer();
    easterEgg.active = false;
    easterEgg.startTime = 0;

    if (resetHoverState) {
      easterEgg.isHoveringSun = false;
      easterEgg.playedThisHover = false;
    }

    cursorSatellite.classList.remove("is-eis-active");
    rasterPanel.style.removeProperty("opacity");
    aboutSun?.classList.remove("is-scanning");
    aboutSun?.style.removeProperty("--sun-scan-x");
    resetRasterReveal();
  };

  const startEasterEgg = () => {
    if (!aboutSun || easterEgg.active || easterEgg.playedThisHover) {
      return;
    }

    easterEgg.active = true;
    easterEgg.playedThisHover = true;
    easterEgg.startTime = performance.now();
    cursorSatellite.classList.add("is-eis-active");
    aboutSun.classList.add("is-scanning");
  };

  const updateTarget = (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    lastMoveTime = performance.now();
    updateRasterSide();
    showSatellite();

    if (aboutSun) {
      const rect = aboutSun.getBoundingClientRect();
      const hitInset = 16;
      const isHoveringSun =
        event.clientX >= rect.left - hitInset &&
        event.clientX <= rect.right + hitInset &&
        event.clientY >= rect.top - hitInset &&
        event.clientY <= rect.bottom + hitInset;

      setSunHovering(isHoveringSun);
    }
  };

  const updateEasterEgg = (time) => {
    if (!aboutSun || !easterEgg.active) {
      return;
    }

    const elapsed = time - easterEgg.startTime;
    const total =
      scanTiming.fadeIn + scanTiming.scan + scanTiming.linger + scanTiming.fadeOut;

    if (elapsed >= total) {
      resetEasterEgg();
      return;
    }

    const scanElapsed = Math.max(0, elapsed - scanTiming.fadeIn);
    const scanProgress = Math.min(1, scanElapsed / scanTiming.scan);
    const revealPercent = Math.max(0, Math.min(100, scanProgress * 100));
    const maskLeft = 100 - revealPercent;

    rasterViewport.style.setProperty("--raster-mask-left", `${maskLeft}%`);
    rasterSlit.style.opacity =
      revealPercent > 0 && revealPercent < 100 ? "1" : "0";

    const sunScanX = 24 + 46 * (1 - revealPercent / 100);
    aboutSun.style.setProperty("--sun-scan-x", `${sunScanX}%`);

    let opacity = 1;
    if (elapsed < scanTiming.fadeIn) {
      opacity = elapsed / scanTiming.fadeIn;
    } else if (elapsed > scanTiming.fadeIn + scanTiming.scan + scanTiming.linger) {
      const fadeElapsed =
        elapsed - (scanTiming.fadeIn + scanTiming.scan + scanTiming.linger);
      opacity = 1 - fadeElapsed / scanTiming.fadeOut;
    }

    rasterPanel.style.opacity = `${Math.max(0, Math.min(1, opacity))}`;
  };

  const animateSatellite = (time) => {
    const idleTime = Math.max(0, time - lastMoveTime);
    const idleStrength = Math.min(1, Math.max(0, (idleTime - 120) / 1200));
    const targetX = pointerX + 13;
    const targetY = pointerY + 10;
    satelliteX += (targetX - satelliteX) * 0.17;
    satelliteY += (targetY - satelliteY) * 0.15;

    const velocityX = targetX - satelliteX;
    const velocityY = targetY - satelliteY;
    const driftX =
      Math.sin(time / 560) * (1.8 + idleStrength * 1.9) +
      Math.cos(time / 1240) * (0.6 + idleStrength * 0.7);
    const driftY =
      Math.cos(time / 720) * (1.5 + idleStrength * 2.1) +
      Math.sin(time / 1100) * (0.45 + idleStrength * 0.55);
    const tilt =
      Math.max(-7, Math.min(7, velocityX * 0.18)) +
      velocityY * 0.05 +
      Math.sin(time / 900) * (0.7 + idleStrength * 0.9);
    const scale =
      1 +
      Math.min(0.03, Math.hypot(velocityX, velocityY) * 0.0026) +
      idleStrength * 0.012;

    cursorSatellite.style.transform = `translate3d(${satelliteX + driftX}px, ${
      satelliteY + driftY
    }px, 0) rotate(${tilt}deg) scale(${scale})`;

    updateEasterEgg(time);
    window.requestAnimationFrame(animateSatellite);
  };

  document.addEventListener("pointermove", updateTarget, { passive: true });
  document.addEventListener("pointerdown", updateTarget, { passive: true });
  window.addEventListener("resize", updateRasterSide);
  window.addEventListener("blur", hideSatellite);
  window.addEventListener("mouseout", (event) => {
    if (!event.relatedTarget) {
      hideSatellite();
    }
  });

  if (aboutSun) {
    aboutSun.addEventListener("pointerenter", () => {
      setSunHovering(true);
    });

    aboutSun.addEventListener("pointerleave", () => {
      setSunHovering(false);
    });

    aboutSun.addEventListener("mouseenter", () => {
      setSunHovering(true);
    });

    aboutSun.addEventListener("mouseleave", () => {
      setSunHovering(false);
    });
  }

  resetRasterReveal();
  updateRasterSide();
  window.requestAnimationFrame(animateSatellite);
})();
