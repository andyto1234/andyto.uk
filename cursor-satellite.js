(function () {
  const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!hasFinePointer.matches || prefersReducedMotion.matches || !document.body) {
    return;
  }

  const existing = document.querySelector(".cursor-satellite");
  const cursorSatellite = existing || document.createElement("img");

  if (!existing) {
    cursorSatellite.className = "cursor-satellite";
    cursorSatellite.src = "./images/cursor/hinode-cursor.png";
    cursorSatellite.alt = "";
    cursorSatellite.setAttribute("aria-hidden", "true");
    cursorSatellite.width = 58;
    cursorSatellite.height = 46;
    cursorSatellite.decoding = "async";
    document.body.appendChild(cursorSatellite);
  }

  let pointerX = window.innerWidth * 0.5;
  let pointerY = window.innerHeight * 0.5;
  let satelliteX = pointerX;
  let satelliteY = pointerY;
  let isVisible = false;
  let lastMoveTime = performance.now();

  const showSatellite = () => {
    if (!isVisible) {
      cursorSatellite.classList.add("is-visible");
      isVisible = true;
    }
  };

  const hideSatellite = () => {
    cursorSatellite.classList.remove("is-visible");
    isVisible = false;
  };

  const updateTarget = (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    lastMoveTime = performance.now();
    showSatellite();
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

    window.requestAnimationFrame(animateSatellite);
  };

  document.addEventListener("pointermove", updateTarget, { passive: true });
  document.addEventListener("pointerdown", updateTarget, { passive: true });
  window.addEventListener("blur", hideSatellite);
  window.addEventListener("mouseout", (event) => {
    if (!event.relatedTarget) {
      hideSatellite();
    }
  });

  window.requestAnimationFrame(animateSatellite);
})();
