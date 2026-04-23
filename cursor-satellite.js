(function () {
  const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!document.body || prefersReducedMotion.matches) {
    return;
  }

  const aboutSun = document.querySelector(".about-header__sun");
  const instrumentControls = Array.from(
    document.querySelectorAll("[data-cursor-instrument]")
  );
  const instrumentStorageKey = "andyto-cursor-instrument";
  const validInstruments = new Set(["none", "hinode", "iris"]);
  const spacecraftAssets = {
    none: null,
    hinode: {
      src: "./images/cursor/hinode-cursor.png",
      width: 58,
      height: 46
    },
    iris: {
      src: "./images/cursor/iris-cursor.png",
      width: 72,
      height: 34
    }
  };
  const rasterAssets = {
    hinode: {
      src: "./images/easter-eggs/eis-raster-pixel.png",
      width: 26,
      height: 27
    },
    iris: {
      src: "./images/easter-eggs/iris-sji.gif",
      width: 56,
      height: 56
    }
  };

  const scanTiming = {
    hoverDelay: 220,
    fadeIn: 140,
    scan: 1180,
    linger: 320,
    fadeOut: 240
  };

  const readStoredInstrument = () => {
    try {
      const stored = window.localStorage.getItem(instrumentStorageKey);
      return validInstruments.has(stored) ? stored : "hinode";
    } catch {
      return "hinode";
    }
  };

  const writeStoredInstrument = (value) => {
    try {
      window.localStorage.setItem(instrumentStorageKey, value);
    } catch {}
  };

  let selectedInstrument = readStoredInstrument();
  let applyDesktopInstrument = null;
  let applyMobileInstrument = null;
  let hideDesktopCompanion = null;

  const syncInstrumentControls = () => {
    instrumentControls.forEach((button) => {
      const isActive = button.dataset.cursorInstrument === selectedInstrument;
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  };

  const setRasterReveal = (viewport, slit, percent) => {
    const clampedPercent = Math.max(0, Math.min(100, percent));
    const maskLeft = 100 - clampedPercent;
    viewport.style.setProperty("--raster-mask-left", `${maskLeft}%`);
    slit.style.opacity =
      clampedPercent > 0 && clampedPercent < 100 ? "1" : "0";
  };

  const resetRasterViewport = (viewport, slit, instrument = selectedInstrument) => {
    viewport.style.setProperty("--iris-left-bar", "0%");
    viewport.style.setProperty("--iris-right-bar", "0%");
    viewport.style.setProperty("--iris-bar-opacity", "0");

    if (instrument === "hinode") {
      setRasterReveal(viewport, slit, 0);
      return;
    }

    viewport.style.setProperty("--raster-mask-left", "0%");
    slit.style.opacity = "0";
  };

  const setIrisRasterBars = (viewport, elapsed = 0) => {
    const primary = Math.sin(elapsed / 26);
    const secondary = Math.sin(elapsed / 11);
    const tertiary = Math.cos(elapsed / 18);
    const left = Math.max(
      6,
      Math.min(18, 9 + primary * 5.4 + secondary * 1.9 + tertiary * 0.8)
    );
    const right = Math.max(
      6,
      Math.min(18, 9 - primary * 5.4 + secondary * 1.4 - tertiary * 0.8)
    );

    viewport.style.setProperty("--iris-left-bar", `${left.toFixed(2)}%`);
    viewport.style.setProperty("--iris-right-bar", `${right.toFixed(2)}%`);
    viewport.style.setProperty("--iris-bar-opacity", "0.82");
  };

  const applyRasterAsset = (host, image, instrument) => {
    host.dataset.rasterMode = instrument;

    const asset = rasterAssets[instrument];
    if (!asset) {
      return;
    }

    if (image.getAttribute("src") !== asset.src) {
      image.src = asset.src;
    }

    image.width = asset.width;
    image.height = asset.height;
  };

  const restartRasterAsset = (image, instrument) => {
    const asset = rasterAssets[instrument];
    if (!asset) {
      return;
    }

    image.src = `${asset.src}?t=${Date.now()}`;
    image.width = asset.width;
    image.height = asset.height;
  };

  const clearSunScan = () => {
    if (!aboutSun) {
      return;
    }

    aboutSun.classList.remove("is-scanning");
    aboutSun.style.removeProperty("--sun-scan-x");
    aboutSun.style.removeProperty("--sun-iris-shift");
  };

  const syncSunScanMode = () => {
    if (!aboutSun) {
      return;
    }

    aboutSun.dataset.scanMode = selectedInstrument;
    if (selectedInstrument === "none") {
      clearSunScan();
    }
  };

  const updateSunScan = (percent, elapsed = 0) => {
    if (!aboutSun || selectedInstrument === "none") {
      return;
    }

    aboutSun.classList.add("is-scanning");

    if (selectedInstrument === "iris") {
      const jitter =
        Math.sin(elapsed / 30) * 2.1 +
        Math.sin(elapsed / 13) * 0.9 +
        Math.sin(elapsed / 8) * 0.35;
      aboutSun.style.setProperty("--sun-iris-shift", `${jitter.toFixed(2)}px`);
      return;
    }

    const clampedPercent = Math.max(0, Math.min(100, percent));
    const sunScanX = 24 + 46 * (1 - clampedPercent / 100);
    aboutSun.style.setProperty("--sun-scan-x", `${sunScanX}%`);
  };

  const applySelectedInstrument = () => {
    syncInstrumentControls();
    syncSunScanMode();
    applyDesktopInstrument?.();
    applyMobileInstrument?.();

    if (selectedInstrument === "none") {
      hideDesktopCompanion?.();
    }
  };

  instrumentControls.forEach((button) => {
    button.addEventListener("click", () => {
      const nextInstrument = button.dataset.cursorInstrument;
      if (
        !validInstruments.has(nextInstrument) ||
        nextInstrument === selectedInstrument
      ) {
        return;
      }

      selectedInstrument = nextInstrument;
      writeStoredInstrument(selectedInstrument);
      applySelectedInstrument();
    });
  });

  syncInstrumentControls();
  syncSunScanMode();

  if (hasFinePointer.matches) {
    const cursorSatellite = document.createElement("div");
    cursorSatellite.className = "cursor-satellite";
    cursorSatellite.setAttribute("aria-hidden", "true");

    const satelliteImage = document.createElement("img");
    satelliteImage.className = "cursor-satellite__image";
    satelliteImage.alt = "";
    satelliteImage.decoding = "async";

    const rasterPanel = document.createElement("div");
    rasterPanel.className = "cursor-satellite__raster";

    const rasterFrame = document.createElement("div");
    rasterFrame.className = "cursor-satellite__raster-frame";

    const rasterViewport = document.createElement("div");
    rasterViewport.className = "cursor-satellite__raster-viewport";

    const rasterImage = document.createElement("img");
    rasterImage.className = "cursor-satellite__raster-image";
    rasterImage.alt = "";
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

    const applyDesktopAsset = () => {
      cursorSatellite.dataset.instrument = selectedInstrument;

      const spacecraftAsset = spacecraftAssets[selectedInstrument];
      if (!spacecraftAsset) {
        return;
      }

      if (satelliteImage.getAttribute("src") !== spacecraftAsset.src) {
        satelliteImage.src = spacecraftAsset.src;
      }

      satelliteImage.width = spacecraftAsset.width;
      satelliteImage.height = spacecraftAsset.height;
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

    const concealSatellite = () => {
      cursorSatellite.classList.remove("is-visible");
      isVisible = false;
    };

    const clearHoverTimer = () => {
      if (easterEgg.hoverTimer) {
        window.clearTimeout(easterEgg.hoverTimer);
        easterEgg.hoverTimer = null;
      }
    };

    const resetDesktopEasterEgg = (resetHoverState) => {
      clearHoverTimer();
      easterEgg.active = false;
      easterEgg.startTime = 0;

      if (resetHoverState) {
        easterEgg.isHoveringSun = false;
        easterEgg.playedThisHover = false;
      }

      cursorSatellite.classList.remove("is-eis-active");
      rasterPanel.style.removeProperty("opacity");
      resetRasterViewport(rasterViewport, rasterSlit);
      clearSunScan();

      if (selectedInstrument === "none") {
        concealSatellite();
      }
    };

    const hideSatellite = () => {
      concealSatellite();
      resetDesktopEasterEgg(true);
    };

    const startDesktopEasterEgg = () => {
      if (
        !aboutSun ||
        selectedInstrument === "none" ||
        easterEgg.active ||
        easterEgg.playedThisHover
      ) {
        return;
      }

      applyRasterAsset(cursorSatellite, rasterImage, selectedInstrument);
      resetRasterViewport(rasterViewport, rasterSlit, selectedInstrument);

      if (selectedInstrument === "iris") {
        restartRasterAsset(rasterImage, "iris");
      }

      easterEgg.active = true;
      easterEgg.playedThisHover = true;
      easterEgg.startTime = performance.now();
      cursorSatellite.classList.add("is-eis-active");
      showSatellite();
      updateSunScan(0, 0);
    };

    const setSunHovering = (isHovering) => {
      if (!aboutSun || easterEgg.isHoveringSun === isHovering) {
        return;
      }

      easterEgg.isHoveringSun = isHovering;

      if (isHovering) {
        clearHoverTimer();
        if (!easterEgg.playedThisHover && selectedInstrument !== "none") {
          easterEgg.hoverTimer = window.setTimeout(
            startDesktopEasterEgg,
            scanTiming.hoverDelay
          );
        }
        return;
      }

      clearHoverTimer();
      easterEgg.playedThisHover = false;

      if (!easterEgg.active) {
        clearSunScan();
      }
    };

    const updateTarget = (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      lastMoveTime = performance.now();
      updateRasterSide();

      if (selectedInstrument !== "none" || easterEgg.active) {
        showSatellite();
      } else {
        concealSatellite();
      }

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

    const updateDesktopEasterEgg = (time) => {
      if (!easterEgg.active) {
        return;
      }

      if (selectedInstrument === "none") {
        resetDesktopEasterEgg(true);
        return;
      }

      const elapsed = time - easterEgg.startTime;
      const total =
        scanTiming.fadeIn +
        scanTiming.scan +
        scanTiming.linger +
        scanTiming.fadeOut;

      if (elapsed >= total) {
        resetDesktopEasterEgg(false);
        return;
      }

      const scanElapsed = Math.max(0, elapsed - scanTiming.fadeIn);
      const scanProgress = Math.min(1, scanElapsed / scanTiming.scan);
      const revealPercent = Math.max(0, Math.min(100, scanProgress * 100));

      if (selectedInstrument === "hinode") {
        setRasterReveal(rasterViewport, rasterSlit, revealPercent);
        updateSunScan(revealPercent, elapsed);
      } else {
        resetRasterViewport(rasterViewport, rasterSlit, "iris");
        setIrisRasterBars(rasterViewport, elapsed);
        updateSunScan(100, elapsed);
      }

      let opacity = 1;
      if (elapsed < scanTiming.fadeIn) {
        opacity = elapsed / scanTiming.fadeIn;
      } else if (
        elapsed >
        scanTiming.fadeIn + scanTiming.scan + scanTiming.linger
      ) {
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

      updateDesktopEasterEgg(time);
      window.requestAnimationFrame(animateSatellite);
    };

    applyDesktopInstrument = () => {
      resetDesktopEasterEgg(true);
      applyDesktopAsset();
      applyRasterAsset(cursorSatellite, rasterImage, selectedInstrument);
      resetRasterViewport(rasterViewport, rasterSlit, selectedInstrument);

      if (selectedInstrument === "none") {
        concealSatellite();
      }
    };

    hideDesktopCompanion = () => {
      resetDesktopEasterEgg(true);
      concealSatellite();
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

    applySelectedInstrument();
    applyRasterAsset(cursorSatellite, rasterImage, selectedInstrument);
    resetRasterViewport(rasterViewport, rasterSlit, selectedInstrument);
    updateRasterSide();
    window.requestAnimationFrame(animateSatellite);
    return;
  }

  if (!aboutSun) {
    return;
  }

  const mobileEgg = document.createElement("div");
  mobileEgg.className = "about-sun-easter-egg";
  mobileEgg.setAttribute("aria-hidden", "true");

  const mobileSatellite = document.createElement("img");
  mobileSatellite.className = "about-sun-easter-egg__satellite";
  mobileSatellite.alt = "";
  mobileSatellite.decoding = "async";

  const mobileRaster = document.createElement("div");
  mobileRaster.className = "about-sun-easter-egg__raster";

  const mobileFrame = document.createElement("div");
  mobileFrame.className = "about-sun-easter-egg__frame";

  const mobileViewport = document.createElement("div");
  mobileViewport.className = "about-sun-easter-egg__viewport";

  const mobileRasterImage = document.createElement("img");
  mobileRasterImage.className = "about-sun-easter-egg__image";
  mobileRasterImage.alt = "";
  mobileRasterImage.decoding = "async";

  const mobileSlit = document.createElement("span");
  mobileSlit.className = "about-sun-easter-egg__slit";
  mobileSlit.setAttribute("aria-hidden", "true");

  mobileViewport.appendChild(mobileRasterImage);
  mobileViewport.appendChild(mobileSlit);
  mobileFrame.appendChild(mobileViewport);
  mobileRaster.appendChild(mobileFrame);
  mobileEgg.appendChild(mobileSatellite);
  mobileEgg.appendChild(mobileRaster);
  aboutSun.appendChild(mobileEgg);

  const mobileState = {
    active: false,
    frameId: 0,
    startTime: 0
  };

  const applyMobileAsset = () => {
    mobileEgg.dataset.instrument = selectedInstrument;

    const spacecraftAsset = spacecraftAssets[selectedInstrument];
    if (spacecraftAsset) {
      if (mobileSatellite.getAttribute("src") !== spacecraftAsset.src) {
        mobileSatellite.src = spacecraftAsset.src;
      }

      mobileSatellite.width = spacecraftAsset.width;
      mobileSatellite.height = spacecraftAsset.height;
    }

    applyRasterAsset(mobileEgg, mobileRasterImage, selectedInstrument);
    resetRasterViewport(mobileViewport, mobileSlit, selectedInstrument);
  };

  const resetMobileEasterEgg = () => {
    if (mobileState.frameId) {
      window.cancelAnimationFrame(mobileState.frameId);
      mobileState.frameId = 0;
    }

    mobileState.active = false;
    mobileState.startTime = 0;
    mobileEgg.classList.remove("is-active");
    mobileEgg.style.removeProperty("opacity");
    resetRasterViewport(mobileViewport, mobileSlit, selectedInstrument);
    clearSunScan();
  };

  const updateMobileEasterEgg = (time) => {
    if (!mobileState.active) {
      return;
    }

    if (selectedInstrument === "none") {
      resetMobileEasterEgg();
      return;
    }

    const elapsed = time - mobileState.startTime;
    const total =
      scanTiming.fadeIn +
      scanTiming.scan +
      scanTiming.linger +
      scanTiming.fadeOut;

    if (elapsed >= total) {
      resetMobileEasterEgg();
      return;
    }

    const scanElapsed = Math.max(0, elapsed - scanTiming.fadeIn);
    const scanProgress = Math.min(1, scanElapsed / scanTiming.scan);
    const revealPercent = Math.max(0, Math.min(100, scanProgress * 100));

    if (selectedInstrument === "hinode") {
      setRasterReveal(mobileViewport, mobileSlit, revealPercent);
      updateSunScan(revealPercent, elapsed);
    } else {
      resetRasterViewport(mobileViewport, mobileSlit, "iris");
      setIrisRasterBars(mobileViewport, elapsed);
      updateSunScan(100, elapsed);
    }

    let opacity = 1;
    if (elapsed < scanTiming.fadeIn) {
      opacity = elapsed / scanTiming.fadeIn;
    } else if (
      elapsed >
      scanTiming.fadeIn + scanTiming.scan + scanTiming.linger
    ) {
      const fadeElapsed =
        elapsed - (scanTiming.fadeIn + scanTiming.scan + scanTiming.linger);
      opacity = 1 - fadeElapsed / scanTiming.fadeOut;
    }

    mobileEgg.style.opacity = `${Math.max(0, Math.min(1, opacity))}`;
    mobileState.frameId = window.requestAnimationFrame(updateMobileEasterEgg);
  };

  const startMobileEasterEgg = () => {
    if (selectedInstrument === "none" || mobileState.active) {
      return;
    }

    applyMobileAsset();

    if (selectedInstrument === "iris") {
      restartRasterAsset(mobileRasterImage, "iris");
    }

    mobileState.active = true;
    mobileState.startTime = performance.now();
    mobileEgg.classList.add("is-active");
    mobileEgg.style.opacity = "0";
    updateSunScan(0, 0);
    mobileState.frameId = window.requestAnimationFrame(updateMobileEasterEgg);
  };

  applyMobileInstrument = () => {
    resetMobileEasterEgg();
    applyMobileAsset();
  };

  aboutSun.addEventListener("pointerup", (event) => {
    if (event.pointerType === "mouse") {
      return;
    }

    event.preventDefault();
    startMobileEasterEgg();
  });

  aboutSun.addEventListener("click", (event) => {
    if (window.PointerEvent) {
      return;
    }

    event.preventDefault();
    startMobileEasterEgg();
  });

  applySelectedInstrument();
  applyMobileAsset();
})();
