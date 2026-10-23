(() => {
  "use strict";

  const body = document.body;
  if (!body?.matches("[data-cyber-page]")) return;

  const root = document.documentElement;
  const motionPreference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const preferenceKey = "vikash-portfolio-preferences-v2";
  const rippleTimers = new WeakMap();

  function userMotionMode() {
    if (["full", "reduced", "minimal"].includes(root.dataset.motion)) return root.dataset.motion;
    try {
      const preferences = JSON.parse(localStorage.getItem(preferenceKey) || "null");
      return ["full", "reduced", "minimal"].includes(preferences?.motion)
        ? preferences.motion
        : "full";
    } catch {
      return "full";
    }
  }

  function rippleAllowed() {
    return !motionPreference?.matches && !["reduced", "minimal"].includes(userMotionMode());
  }

  function buttonFrom(target) {
    return target instanceof Element ? target.closest("body[data-cyber-page] button") : null;
  }

  function setButtonPoint(button, x, y) {
    const bounds = button.getBoundingClientRect();
    const pointX = Math.min(bounds.width, Math.max(0, x));
    const pointY = Math.min(bounds.height, Math.max(0, y));
    button.style.setProperty("--button-pointer-x", `${pointX}px`);
    button.style.setProperty("--button-pointer-y", `${pointY}px`);
    return { bounds, pointX, pointY };
  }

  function playRipple(button, x, y) {
    if (!button || button.disabled || !rippleAllowed()) return;

    const { bounds, pointX, pointY } = setButtonPoint(button, x, y);
    const farthestX = Math.max(pointX, bounds.width - pointX);
    const farthestY = Math.max(pointY, bounds.height - pointY);
    const diameter = Math.ceil(Math.hypot(farthestX, farthestY) * 2);
    button.style.setProperty("--button-ripple-size", `${diameter}px`);

    const oldTimer = rippleTimers.get(button);
    if (oldTimer) window.clearTimeout(oldTimer);
    button.classList.remove("button-rippling");
    void button.offsetWidth;
    button.classList.add("button-rippling");
    rippleTimers.set(button, window.setTimeout(() => {
      button.classList.remove("button-rippling");
      rippleTimers.delete(button);
    }, 560));
  }

  document.addEventListener("pointermove", event => {
    if (event.pointerType === "touch") return;
    const button = buttonFrom(event.target);
    if (!button || button.disabled) return;
    const bounds = button.getBoundingClientRect();
    setButtonPoint(button, event.clientX - bounds.left, event.clientY - bounds.top);
  }, { passive: true });

  document.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    const button = buttonFrom(event.target);
    if (!button) return;
    const bounds = button.getBoundingClientRect();
    playRipple(button, event.clientX - bounds.left, event.clientY - bounds.top);
  }, { passive: true });

  document.addEventListener("keydown", event => {
    if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
    const button = buttonFrom(event.target);
    if (!button) return;
    const bounds = button.getBoundingClientRect();
    playRipple(button, bounds.width / 2, bounds.height / 2);
  });
})();
