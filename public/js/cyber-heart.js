(() => {
  "use strict";

  if (window.CyberHeart || document.documentElement?.dataset.cyberHeartInitialized === "true" || !document.body) return;

  const root = document.documentElement;
  const body = document.body;
  const page = body.dataset.cyberPage || "portfolio";
  const storageKey = "vikash-portfolio-preferences-v2";
  const heartbeatEpochKey = "vikash-portfolio-heartbeat-epoch-v1";
  const localHeartbeatEpoch = Date.now();
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const lightTheme = window.matchMedia?.("(prefers-color-scheme: light)");
  root.dataset.cyberHeartInitialized = "true";

  function readPreferences() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
    } catch {
      return {};
    }
  }

  const valid = (value, options, fallback) => options.includes(value) ? value : fallback;
  const clamp = (value, min, max, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
  };
  const saved = readPreferences();
  const savedTheme = valid(saved.theme, ["system", "dark", "light"], "dark");
  root.dataset.theme = savedTheme === "system"
    ? (lightTheme?.matches ? "light" : "dark")
    : savedTheme;
  if (["green", "red", "cyan"].includes(saved.accent)) root.dataset.accent = saved.accent;

  function heartbeatElapsed() {
    const now = Date.now();
    try {
      const stored = sessionStorage.getItem(heartbeatEpochKey);
      const epoch = stored === null ? NaN : Number(stored);
      const validEpoch = Number.isFinite(epoch) && epoch <= now && epoch > now - 30 * 24 * 60 * 60 * 1000;
      if (validEpoch) return (now - epoch) / 1000;
      sessionStorage.setItem(heartbeatEpochKey, String(now));
      return 0;
    } catch { /* Keep a local per-page clock when storage is unavailable. */ }
    return (now - localHeartbeatEpoch) / 1000;
  }

  const config = {
    intensity: clamp(saved.heartIntensity, 20, 100, 78) / 100,
    scale: clamp(saved.heartScale, 75, 120, 100) / 100,
    density: valid(saved.particleDensity, ["low", "balanced", "high"], "balanced"),
    motion: valid(saved.motion, ["full", "reduced", "minimal"], "full"),
    liteMode: saved.liteMode === true,
    scanlines: saved.scanlines !== false,
  };

  const canvas = document.createElement("canvas");
  canvas.className = "cyber-heart-canvas";
  canvas.id = "cyber-heart-canvas";
  canvas.setAttribute("aria-hidden", "true");
  canvas.dataset.scene = page === "portfolio" ? "top" : page;
  body.prepend(canvas);

  let context = null;
  try { context = canvas.getContext?.("2d", { alpha: true, desynchronized: true }) || null; } catch { /* Use the image fallback. */ }

  function assetUrl() {
    const script = document.querySelector('script[src*="cyber-heart.js"]');
    return new URL("../assets/cyber-heart-core.webp", script?.src || window.location.href).href;
  }

  let hud = null;
  function installImageFallback() {
    canvas.remove();
    hud?.remove();
    document.querySelector(".hero-visual-frame")?.classList.add("cyber-heart-static-frame-fallback");
    const image = document.createElement("img");
    image.className = "cyber-heart-fallback";
    image.src = assetUrl();
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    body.prepend(image);
    window.CyberHeart = Object.freeze({ update() {}, dispose() { image.remove(); } });
  }

  if (!context) {
    installImageFallback();
    return;
  }

  hud = document.createElement("div");
  hud.className = "cyber-heart-hud";
  hud.setAttribute("aria-hidden", "true");
  hud.innerHTML = `
    <span class="cyber-heart-hud__label cyber-heart-hud__label--top">PHANTOM SIGNAL <i>//</i> CORE 01</span>
    <span class="cyber-heart-hud__label cyber-heart-hud__label--right">VASCULAR ARRAY <i>●</i></span>
    <span class="cyber-heart-hud__label cyber-heart-hud__label--bottom"><span><i></i> MECHANICAL CORE</span><span>SIMULATED PULSE</span></span>
    <span class="cyber-heart-hud__corner cyber-heart-hud__corner--tl"></span>
    <span class="cyber-heart-hud__corner cyber-heart-hud__corner--tr"></span>
    <span class="cyber-heart-hud__corner cyber-heart-hud__corner--bl"></span>
    <span class="cyber-heart-hud__corner cyber-heart-hud__corner--br"></span>
    <span class="cyber-heart-hud__rail cyber-heart-hud__rail--top"></span>
    <span class="cyber-heart-hud__rail cyber-heart-hud__rail--bottom"></span>
    <span class="cyber-heart-hud__tick cyber-heart-hud__tick--left"></span>
    <span class="cyber-heart-hud__tick cyber-heart-hud__tick--right"></span>`;
  body.append(hud);

  const heart = new Image();
  heart.decoding = "async";
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let frameId = 0;
  let previousFrame = 0;
  let frameDelta = 1 / 30;
  let elapsed = heartbeatElapsed();
  let ready = false;
  let disposed = false;
  let activeScene = "top";
  let scrollFrame = 0;
  let sectionResizeObserver = null;
  let sectionMetricsDirty = true;
  let sectionMetrics = [];
  const scrollController = {
    latestY: window.scrollY || 0,
    previousY: window.scrollY || 0,
    timestamp: 0,
  };
  const scrollMotion = { velocity: 0, activity: 0, direction: 0 };
  let meshColumns = 20;
  let meshRows = 22;
  let meshPositions = new Float32Array((meshColumns + 1) * (meshRows + 1) * 2);
  let currentPlacement = null;
  let hudWidthRatio = 0.86;
  let hudHeightRatio = 0.81;

  const ambient = Array.from({ length: 24 }, (_, index) => ({
    angle: index * 2.399,
    radiusX: 0.51 + (index % 4) * 0.025,
    radiusY: 0.54 + (index % 5) * 0.018,
    speed: 0.035 + (index % 5) * 0.009,
    size: 0.8 + (index % 3) * 0.45,
  }));

  const wideScenes = {
    top: { x: 0.73, y: 0.47, width: 0.48, height: 0.66, alpha: 0.96, energy: 1 },
    "atlas-section": { x: 0.80, y: 0.54, width: 0.42, height: 0.54, alpha: 0.26, energy: 0.68 },
    about: { x: 0.82, y: 0.50, width: 0.41, height: 0.52, alpha: 0.37, energy: 0.72 },
    projects: { x: 0.84, y: 0.49, width: 0.35, height: 0.45, alpha: 0.17, energy: 0.48 },
    skills: { x: 0.76, y: 0.52, width: 0.40, height: 0.49, alpha: 0.31, energy: 0.82 },
    contact: { x: 0.84, y: 0.55, width: 0.33, height: 0.43, alpha: 0.18, energy: 0.52 },
  };
  const compactScenes = {
    top: { x: 0.50, y: 0.84, width: 0.76, height: 0.29, alpha: 0.68, energy: 0.92 },
    "atlas-section": { x: 0.77, y: 0.82, width: 0.66, height: 0.28, alpha: 0.23, energy: 0.62 },
    about: { x: 0.76, y: 0.81, width: 0.64, height: 0.28, alpha: 0.25, energy: 0.68 },
    projects: { x: 0.78, y: 0.82, width: 0.62, height: 0.27, alpha: 0.16, energy: 0.44 },
    skills: { x: 0.74, y: 0.81, width: 0.64, height: 0.28, alpha: 0.23, energy: 0.76 },
    contact: { x: 0.78, y: 0.81, width: 0.60, height: 0.26, alpha: 0.15, energy: 0.46 },
  };
  const pageScenes = {
    store: { x: 0.78, y: 0.48, width: 0.47, height: 0.63, alpha: 0.46, energy: 0.54 },
    admin: { x: 0.80, y: 0.50, width: 0.44, height: 0.60, alpha: 0.34, energy: 0.46 },
    legal: { x: 0.78, y: 0.49, width: 0.43, height: 0.56, alpha: 0.32, energy: 0.58 },
  };

  const portfolioSections = [...document.querySelectorAll("main section[id]")];

  function refreshSectionMetrics() {
    if (page !== "portfolio" || !sectionMetricsDirty) return;
    const scrollY = window.scrollY || 0;
    sectionMetrics = portfolioSections.map((section) => {
      const rect = section.getBoundingClientRect();
      const top = rect.top + scrollY;
      return { id: section.id, top, bottom: top + rect.height, center: top + rect.height * 0.5 };
    }).filter((section) => section.id && Number.isFinite(section.center))
      .sort((a, b) => a.center - b.center);
    sectionMetricsDirty = false;
  }

  function sectionProgressAt(scrollY = window.scrollY || 0) {
    if (page !== "portfolio" || !portfolioSections.length) return null;
    refreshSectionMetrics();
    if (!sectionMetrics.length) return null;

    const focus = scrollY + height * 0.5;
    let index = 0;
    while (index < sectionMetrics.length - 1 && sectionMetrics[index + 1].center <= focus) index += 1;
    const current = sectionMetrics[index];
    const next = sectionMetrics[Math.min(index + 1, sectionMetrics.length - 1)];
    const span = next.center - current.center;
    const rawProgress = span > 0 ? clamp((focus - current.center) / span, 0, 1, 0) : 0;
    const transitionProgress = smoothstep(rawProgress);
    const sectionSpan = Math.max(1, current.bottom - current.top);
    const sectionProgress = clamp((focus - current.top) / sectionSpan, 0, 1, 0);
    const nextScene = transitionProgress < 0.5 ? current.id : next.id;
    if (nextScene !== activeScene) {
      activeScene = nextScene;
      canvas.dataset.scene = nextScene;
    }
    return { current, next, sectionProgress, transitionProgress };
  }

  function onScroll() {
    scrollController.latestY = window.scrollY || 0;
    if (!isStill() || scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      scrollController.previousY = scrollController.latestY;
      scrollController.timestamp = performance.now();
      scrollMotion.velocity = 0;
      scrollMotion.activity = 0;
      scrollMotion.direction = 0;
      sectionProgressAt(scrollController.latestY);
      if (hud && hud.dataset.scene !== activeScene) hud.dataset.scene = activeScene;
    });
  }

  function observePortfolioSections() {
    if (page !== "portfolio" || !portfolioSections.length) return;
    if ("ResizeObserver" in window) {
      sectionResizeObserver = new ResizeObserver(() => { sectionMetricsDirty = true; });
      portfolioSections.forEach((section) => sectionResizeObserver.observe(section));
    }
    sectionMetricsDirty = true;
    refreshSectionMetrics();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function cubicPoint(segment, t) {
    const inverse = 1 - t;
    return {
      x: inverse ** 3 * segment[0]
        + 3 * inverse ** 2 * t * segment[2]
        + 3 * inverse * t ** 2 * segment[4]
        + t ** 3 * segment[6],
      y: inverse ** 3 * segment[1]
        + 3 * inverse ** 2 * t * segment[3]
        + 3 * inverse * t ** 2 * segment[5]
        + t ** 3 * segment[7],
    };
  }

  function makeRoute(segments) {
    const samples = [];
    let distance = 0;
    for (const segment of segments) {
      for (let step = samples.length ? 1 : 0; step <= 48; step += 1) {
        const point = cubicPoint(segment, step / 48);
        if (samples.length) {
          const previous = samples[samples.length - 1];
          distance += Math.hypot(point.x - previous.x, point.y - previous.y);
        }
        samples.push({ ...point, distance });
      }
    }
    return { segments, samples, length: distance };
  }

  // The signal paths follow the coronary-style branches painted into the supplied heart artwork.
  const routes = [
    makeRoute([
      [0.535, 0.47, 0.49, 0.52, 0.45, 0.57, 0.405, 0.62],
      [0.405, 0.62, 0.36, 0.64, 0.34, 0.7, 0.355, 0.765],
    ]),
    makeRoute([
      [0.505, 0.53, 0.52, 0.6, 0.51, 0.7, 0.505, 0.84],
    ]),
    makeRoute([
      [0.52, 0.585, 0.59, 0.57, 0.66, 0.635, 0.725, 0.72],
      [0.725, 0.72, 0.75, 0.76, 0.77, 0.805, 0.78, 0.845],
    ]),
    makeRoute([
      [0.44, 0.59, 0.385, 0.56, 0.32, 0.59, 0.275, 0.665],
      [0.275, 0.665, 0.24, 0.72, 0.26, 0.775, 0.295, 0.82],
    ]),
  ];

  function pointAlong(route, progress) {
    const target = route.length * progress;
    let low = 0;
    let high = route.samples.length - 1;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (route.samples[middle].distance < target) low = middle + 1;
      else high = middle;
    }
    const after = route.samples[low];
    const before = route.samples[Math.max(0, low - 1)];
    const span = after.distance - before.distance;
    const amount = span ? (target - before.distance) / span : 0;
    return {
      x: before.x + (after.x - before.x) * amount,
      y: before.y + (after.y - before.y) * amount,
    };
  }

  // The exterior vessels are seeded once and then follow the live heart placement.
  const NETWORK_SAMPLE_STEPS = 10;
  let networkSeed = (Date.now() ^ (page.length * 2654435761)) >>> 0;
  function networkRandom() {
    networkSeed ^= networkSeed << 13;
    networkSeed ^= networkSeed >>> 17;
    networkSeed ^= networkSeed << 5;
    return (networkSeed >>> 0) / 4294967296;
  }

  const network = { primary: [], secondary: [], capillaries: [], sceneAlpha: 1 };
  const networkContentMasks = [];
  let nextMaskRefresh = 0;
  const primaryAnchors = [
    { u: 0.55, v: 0.21, x: 0.46, y: -0.12 },
    { u: 0.405, v: 0.62, x: -0.12, y: 1.28 },
    { u: 0.725, v: 0.72, x: 1.12, y: 0.34 },
    { u: 0.505, v: 0.84, x: 1.10, y: 1.12 },
    { u: 0.355, v: 0.765, x: -0.10, y: 0.98 },
    { u: 0.76, v: 0.47, x: 1.12, y: 0.08 },
  ];

  function createNetworkPath(tier, options = {}) {
    const segmentCount = tier === 0 ? 3 : 2;
    const sampleCount = segmentCount * NETWORK_SAMPLE_STEPS + 1;
    const bends = new Float32Array(segmentCount + 1);
    for (let index = 1; index < segmentCount; index += 1) {
      bends[index] = (networkRandom() - 0.5) * (tier === 0 ? 0.12 : 0.18);
    }
    const path = {
      tier,
      anchor: options.anchor || null,
      targetX: options.targetX || 0,
      targetY: options.targetY || 0,
      parent: options.parent || null,
      attach: options.attach || 0,
      angleOffset: options.angleOffset || 0,
      reach: options.reach || 0,
      sync: options.sync === true,
      width: tier === 0 ? 1.2 + networkRandom() * 1.05 : tier === 1 ? 0.58 + networkRandom() * 0.48 : 0.32 + networkRandom() * 0.28,
      opacity: tier === 0 ? 0.68 + networkRandom() * 0.2 : tier === 1 ? 0.55 + networkRandom() * 0.28 : 0.38 + networkRandom() * 0.3,
      speed: 0.028 + networkRandom() * 0.026,
      phase: networkRandom(),
      signalProgress: 0,
      particleSize: 1.1 + networkRandom() * 1.7,
      bends,
      segments: new Float32Array(segmentCount * 8),
      points: new Float32Array((segmentCount + 1) * 2),
      sampleX: new Float32Array(sampleCount),
      sampleY: new Float32Array(sampleCount),
      distances: new Float32Array(sampleCount),
      length: 0,
      visible: false,
      active: options.active !== false,
      activity: options.active === false ? 0 : 1,
      transition: "",
      transitionDelay: 0,
      queuedActive: false,
      pendingConfiguration: false,
      syncFlash: 0,
      probeA: { x: 0, y: 0 },
      probeB: { x: 0, y: 0 },
      particle: { x: 0, y: 0 },
    };
    path.signalProgress = path.phase;
    return path;
  }

  primaryAnchors.forEach((anchor, index) => {
    network.primary.push(createNetworkPath(0, {
      anchor,
      targetX: anchor.x + (networkRandom() - 0.5) * 0.055,
      targetY: anchor.y + (networkRandom() - 0.5) * 0.045,
      sync: index === 1 || index === 3,
    }));
  });

  function configureNetworkBranch(path, index) {
    const secondary = path.tier === 1;
    const sourceParents = secondary ? network.primary : network.secondary;
    const activeParents = sourceParents.filter((candidate) => candidate.active);
    const parents = activeParents.length ? activeParents : sourceParents;
    path.parent = parents[Math.floor(networkRandom() * parents.length)];
    path.attach = secondary ? 0.22 + networkRandom() * 0.58 : 0.25 + networkRandom() * 0.5;
    path.angleOffset = (networkRandom() < 0.5 ? -1 : 1)
      * (secondary ? 0.38 + networkRandom() * 0.78 : 0.34 + networkRandom() * 0.65);
    path.reach = secondary ? 0.18 + networkRandom() * 0.36 : 0.10 + networkRandom() * 0.22;
    path.width = secondary ? 0.58 + networkRandom() * 0.50 : 0.30 + networkRandom() * 0.30;
    path.opacity = secondary ? 0.52 + networkRandom() * 0.32 : 0.36 + networkRandom() * 0.32;
    path.speed = 0.026 + networkRandom() * 0.034;
    path.phase = networkRandom();
    path.signalProgress = path.phase;
    path.particleSize = 0.9 + networkRandom() * 1.7;
    path.sync = networkRandom() < (secondary ? 0.17 : 0.09);
    for (let bend = 1; bend < path.bends.length - 1; bend += 1) {
      path.bends[bend] = (networkRandom() - 0.5) * (secondary ? 0.2 : 0.24);
    }
    path.syncFlash = 0;
    path.configurationIndex = index;
  }

  for (let index = 0; index < 18; index += 1) {
    network.secondary.push(createNetworkPath(1, { active: false, sync: false }));
  }

  for (let index = 0; index < 16; index += 1) {
    network.capillaries.push(createNetworkPath(2, { active: false, sync: false }));
  }

  network.secondary.forEach(configureNetworkBranch);
  network.capillaries.forEach(configureNetworkBranch);
  network.nextConfigurationAt = Infinity;
  network.initialized = false;

  function networkPointAlong(path, progress, result) {
    if (!path.length) {
      result.x = path.sampleX[0];
      result.y = path.sampleY[0];
      return result;
    }
    const target = path.length * Math.max(0, Math.min(1, progress));
    let low = 0;
    let high = path.distances.length - 1;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (path.distances[middle] < target) low = middle + 1;
      else high = middle;
    }
    const before = Math.max(0, low - 1);
    const span = path.distances[low] - path.distances[before];
    const amount = span ? (target - path.distances[before]) / span : 0;
    result.x = path.sampleX[before] + (path.sampleX[low] - path.sampleX[before]) * amount;
    result.y = path.sampleY[before] + (path.sampleY[low] - path.sampleY[before]) * amount;
    return result;
  }

  function updateNetworkPath(path, startX, startY, endX, endY) {
    const segmentCount = path.segments.length / 8;
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.max(1, Math.hypot(dx, dy));
    const normalX = -dy / distance;
    const normalY = dx / distance;
    for (let index = 0; index <= segmentCount; index += 1) {
      const progress = index / segmentCount;
      const offset = path.bends[index] * distance;
      path.points[index * 2] = startX + dx * progress + normalX * offset;
      path.points[index * 2 + 1] = startY + dy * progress + normalY * offset;
    }

    for (let index = 0; index < segmentCount; index += 1) {
      const pointIndex = index * 2;
      const previousX = index === 0
        ? path.points[pointIndex] - (path.points[pointIndex + 2] - path.points[pointIndex])
        : path.points[pointIndex - 2];
      const previousY = index === 0
        ? path.points[pointIndex + 1] - (path.points[pointIndex + 3] - path.points[pointIndex + 1])
        : path.points[pointIndex - 1];
      const nextX = index + 2 >= segmentCount + 1
        ? path.points[pointIndex + 2] + (path.points[pointIndex + 2] - path.points[pointIndex])
        : path.points[pointIndex + 4];
      const nextY = index + 2 >= segmentCount + 1
        ? path.points[pointIndex + 3] + (path.points[pointIndex + 3] - path.points[pointIndex + 1])
        : path.points[pointIndex + 5];
      const segmentIndex = index * 8;
      const x0 = path.points[pointIndex];
      const y0 = path.points[pointIndex + 1];
      const x1 = path.points[pointIndex + 2];
      const y1 = path.points[pointIndex + 3];
      path.segments[segmentIndex] = x0;
      path.segments[segmentIndex + 1] = y0;
      path.segments[segmentIndex + 2] = x0 + (x1 - previousX) / 6;
      path.segments[segmentIndex + 3] = y0 + (y1 - previousY) / 6;
      path.segments[segmentIndex + 4] = x1 - (nextX - x0) / 6;
      path.segments[segmentIndex + 5] = y1 - (nextY - y0) / 6;
      path.segments[segmentIndex + 6] = x1;
      path.segments[segmentIndex + 7] = y1;
    }

    let sampleIndex = 0;
    let length = 0;
    for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex += 1) {
      const offset = segmentIndex * 8;
      const x0 = path.segments[offset];
      const y0 = path.segments[offset + 1];
      const x1 = path.segments[offset + 2];
      const y1 = path.segments[offset + 3];
      const x2 = path.segments[offset + 4];
      const y2 = path.segments[offset + 5];
      const x3 = path.segments[offset + 6];
      const y3 = path.segments[offset + 7];
      for (let step = segmentIndex ? 1 : 0; step <= NETWORK_SAMPLE_STEPS; step += 1) {
        const t = step / NETWORK_SAMPLE_STEPS;
        const inverse = 1 - t;
        const pointX = inverse ** 3 * x0 + 3 * inverse ** 2 * t * x1 + 3 * inverse * t ** 2 * x2 + t ** 3 * x3;
        const pointY = inverse ** 3 * y0 + 3 * inverse ** 2 * t * y1 + 3 * inverse * t ** 2 * y2 + t ** 3 * y3;
        if (sampleIndex) length += Math.hypot(pointX - path.sampleX[sampleIndex - 1], pointY - path.sampleY[sampleIndex - 1]);
        path.sampleX[sampleIndex] = pointX;
        path.sampleY[sampleIndex] = pointY;
        path.distances[sampleIndex] = length;
        sampleIndex += 1;
      }
    }
    path.length = length;
  }

  function updateNetworkGeometry(placement, cycle) {
    const updatePrimary = (path) => {
      const mapped = deformPoint(path.anchor.u, path.anchor.v, cycle);
      const startX = placement.x + (mapped.x - 0.5) * placement.size;
      const startY = placement.y + (mapped.y - 0.5) * placement.size;
      updateNetworkPath(path, startX, startY, width * path.targetX, height * path.targetY);
    };
    network.primary.forEach(updatePrimary);

    const updateChild = (path) => {
      const parent = path.parent;
      networkPointAlong(parent, path.attach, path.particle);
      networkPointAlong(parent, Math.max(0, path.attach - 0.018), path.probeA);
      networkPointAlong(parent, Math.min(1, path.attach + 0.018), path.probeB);
      const parentAngle = Math.atan2(path.probeB.y - path.probeA.y, path.probeB.x - path.probeA.x);
      const angle = parentAngle + path.angleOffset;
      const reach = Math.hypot(width, height) * path.reach;
      updateNetworkPath(
        path,
        path.particle.x,
        path.particle.y,
        path.particle.x + Math.cos(angle) * reach,
        path.particle.y + Math.sin(angle) * reach,
      );
    };
    network.secondary.forEach((path) => {
      if (path.active) updateChild(path);
    });
    network.capillaries.forEach((path) => {
      if (path.active && path.parent?.active) updateChild(path);
    });
  }

  function networkCounts() {
    const mobile = width < 700;
    let primary = mobile ? 5 : 6;
    let secondary = config.density === "high" ? (mobile ? 9 : 18) : config.density === "low" ? (mobile ? 3 : 5) : (mobile ? 6 : 11);
    let capillaries = config.density === "high" ? (mobile ? 6 : 16) : config.density === "low" ? (mobile ? 1 : 3) : (mobile ? 3 : 8);
    if (config.liteMode) {
      primary = Math.min(primary, mobile ? 4 : 5);
      secondary = Math.min(secondary, 3);
      capillaries = 0;
    }
    if (config.motion === "minimal") {
      secondary = Math.min(secondary, 6);
      capillaries = Math.min(capillaries, 3);
    }
    if (page === "store" || page === "admin" || page === "legal") {
      secondary = Math.ceil(secondary * 0.65);
      capillaries = Math.ceil(capillaries * 0.55);
    }
    return { primary, secondary, capillaries };
  }

  function chooseNetworkSlots(paths, count) {
    const slots = paths.map((_, index) => index);
    for (let index = slots.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(networkRandom() * (index + 1));
      [slots[index], slots[swap]] = [slots[swap], slots[index]];
    }
    return slots.slice(0, Math.min(count, slots.length));
  }

  function variedBranchCount(maximum, tier) {
    if (!maximum) return 0;
    let minimumRatio = config.density === "high" ? 0.68 : config.density === "low" ? 0.58 : 0.62;
    if (tier === 2) minimumRatio = config.density === "high" ? 0.48 : 0.46;
    if (config.motion === "minimal") minimumRatio = Math.max(0.7, minimumRatio);
    const minimum = Math.max(1, Math.floor(maximum * minimumRatio));
    const surge = tier === 1 && config.density === "high" && networkRandom() < 0.24;
    if (surge) return maximum;
    return minimum + Math.floor(networkRandom() * (maximum - minimum + 1));
  }

  function startBranchFadeOut(path, queuedActive, replace) {
    path.transition = "out";
    path.transitionDelay = networkRandom() * (config.motion === "minimal" ? 0.8 : 0.55);
    path.queuedActive = queuedActive;
    path.pendingConfiguration = replace;
  }

  function setBranchTargets(paths, count) {
    const wantedSlots = new Set(chooseNetworkSlots(paths, count));
    paths.forEach((path, index) => {
      const wanted = wantedSlots.has(index);
      if (path.active && !wanted) {
        startBranchFadeOut(path, false, false);
      } else if (path.active && wanted && networkRandom() < (config.density === "low" ? 0.13 : 0.23)) {
        startBranchFadeOut(path, true, true);
      } else if (!path.active && wanted) {
        configureNetworkBranch(path, index);
        path.active = true;
        path.activity = 0;
        path.transition = "in";
        path.transitionDelay = networkRandom() * 0.42;
      }
    });
  }

  function initializeNetwork() {
    const counts = networkCounts();
    network.primary.forEach((path, index) => {
      path.active = index < counts.primary;
      path.activity = path.active ? 1 : 0;
    });
    const secondarySlots = chooseNetworkSlots(network.secondary, counts.secondary);
    network.secondary.forEach((path, index) => {
      path.active = secondarySlots.includes(index);
      path.activity = path.active ? 1 : 0;
      if (path.active) configureNetworkBranch(path, index);
    });
    const capillarySlots = chooseNetworkSlots(network.capillaries, counts.capillaries);
    network.capillaries.forEach((path, index) => {
      path.active = capillarySlots.includes(index);
      path.activity = path.active ? 1 : 0;
      if (path.active) configureNetworkBranch(path, index);
    });
    network.nextConfigurationAt = elapsed + 4 + networkRandom() * 8;
    network.initialized = true;
  }

  function reconfigureNetwork() {
    const counts = networkCounts();
    setBranchTargets(network.secondary, variedBranchCount(counts.secondary, 1));
    setBranchTargets(network.capillaries, variedBranchCount(counts.capillaries, 2));
    network.nextConfigurationAt = elapsed + 4 + networkRandom() * 8;
  }

  function updateBranchTransitions(paths, still) {
    paths.forEach((path) => {
      if (still || !path.transition) return;
      if (path.transitionDelay > 0) {
        path.transitionDelay = Math.max(0, path.transitionDelay - frameDelta);
        return;
      }
      if (path.transition === "out") {
        path.activity = Math.max(0, path.activity - frameDelta * 1.7);
        if (path.activity > 0) return;
        path.active = false;
        if (path.pendingConfiguration) configureNetworkBranch(path, path.configurationIndex || 0);
        path.pendingConfiguration = false;
        if (path.queuedActive) {
          path.active = true;
          path.transition = "in";
          path.transitionDelay = networkRandom() * 0.28;
        } else path.transition = "";
        path.queuedActive = false;
        return;
      }
      path.activity = Math.min(1, path.activity + frameDelta * 1.35);
      if (path.activity >= 1) path.transition = "";
    });
  }

  function updateNetworkVisibility(still, placement) {
    const target = placement.energy * (width < 700 ? 0.42 : 1);
    if (still) network.sceneAlpha = target;
    else network.sceneAlpha += (target - network.sceneAlpha) * (1 - Math.exp(-3.2 * frameDelta));
    if (!still && elapsed >= network.nextConfigurationAt) reconfigureNetwork();
    updateBranchTransitions(network.secondary, still);
    updateBranchTransitions(network.capillaries, still);
    network.primary.forEach((path) => { path.visible = path.active && path.activity > 0.01; });
    network.secondary.forEach((path) => { path.visible = path.active && path.activity > 0.01; });
    network.capillaries.forEach((path) => {
      path.visible = path.active && path.activity > 0.01 && path.parent?.visible === true;
    });
  }

  function advanceNetworkSignals(delta) {
    if (isStill()) return;
    const acceleration = 1 + scrollMotion.activity * (config.motion === "minimal" ? 0.14 : 0.28);
    for (let index = 0; index < network.primary.length; index += 1) {
      const path = network.primary[index];
      path.signalProgress = (path.signalProgress + delta * path.speed * acceleration) % 1;
    }
    for (let index = 0; index < network.secondary.length; index += 1) {
      const path = network.secondary[index];
      path.signalProgress = (path.signalProgress + delta * path.speed * acceleration) % 1;
    }
    for (let index = 0; index < network.capillaries.length; index += 1) {
      const path = network.capillaries[index];
      path.signalProgress = (path.signalProgress + delta * path.speed * acceleration) % 1;
    }
  }

  function refreshNetworkContentMasks() {
    const now = performance.now();
    if (now < nextMaskRefresh) return;
    nextMaskRefresh = now + 360;
    networkContentMasks.length = 0;
    const elements = document.querySelectorAll(
      ".site-header, main h1, main h2, main h3, main p, main a, main button, main li, "
      + ".hero-actions, .hero-meta, .project-row, "
      + ".signal-panel, .contact-form, .terminal, .store-header, .product-card, .cart-container, "
      + ".modal-content, .auth-box, .sidebar",
    );
    const edge = width < 700 ? 7 : 9;
    for (let index = 0; index < elements.length && networkContentMasks.length < 72; index += 1) {
      const rect = elements[index].getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1 || rect.right < 0 || rect.left > width || rect.bottom < 0 || rect.top > height) continue;
      const left = Math.max(0, rect.left - edge);
      const top = Math.max(0, rect.top - edge);
      const right = Math.min(width, rect.right + edge);
      const bottom = Math.min(height, rect.bottom + edge);
      if (right > left && bottom > top) networkContentMasks.push({ left, top, right, bottom });
    }
  }

  function clipNetworkAwayFromContent() {
    if (!networkContentMasks.length) return;
    context.beginPath();
    context.rect(0, 0, width, height);
    for (let index = 0; index < networkContentMasks.length; index += 1) {
      const rect = networkContentMasks[index];
      context.rect(rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top);
    }
    context.clip("evenodd");
  }

  function traceNetworkPath(path) {
    context.beginPath();
    context.moveTo(path.segments[0], path.segments[1]);
    for (let index = 0; index < path.segments.length; index += 8) {
      context.bezierCurveTo(
        path.segments[index + 2], path.segments[index + 3],
        path.segments[index + 4], path.segments[index + 5],
        path.segments[index + 6], path.segments[index + 7],
      );
    }
  }

  function networkPathActivity(path) {
    if (!path.active) return 0;
    if (path.tier === 2 && path.parent) return path.activity * path.parent.activity;
    return path.activity;
  }

  function drawNetworkBackground(placement, cycle) {
    const opacity = placement.alpha * config.intensity * network.sceneAlpha;
    context.save();
    clipNetworkAwayFromContent();
    context.globalCompositeOperation = "screen";
    const drawPath = (path) => {
      if (!path.visible || path.length < 1) return;
      const beat = path.sync ? cycle.ventricular * 0.38 + cycle.recovery * 0.08 : cycle.ventricular * 0.12;
      const movementGain = path.tier === 0 ? 1 + scrollMotion.activity * 0.18 : 1;
      const gain = opacity * path.opacity * networkPathActivity(path) * (1 + beat) * movementGain;
      traceNetworkPath(path);
      context.globalAlpha = gain * (path.tier === 0 ? 0.25 : path.tier === 1 ? 0.15 : 0.10);
      context.strokeStyle = path.tier === 0 ? "#871020" : "#500712";
      context.lineWidth = path.width * (path.tier === 0 ? 3.2 : 2.1);
      context.lineCap = "round";
      context.lineJoin = "round";
      context.shadowColor = "#871020";
      context.shadowBlur = path.tier === 0 ? 4 : path.tier === 1 ? 2 : 0;
      context.stroke();

      traceNetworkPath(path);
      context.globalAlpha = gain * (path.tier === 0 ? 0.72 : path.tier === 1 ? 0.58 : 0.42);
      context.strokeStyle = path.tier === 0 ? "#E51B35" : path.tier === 1 ? "#871020" : "#500712";
      context.lineWidth = path.width;
      context.shadowBlur = path.tier === 0 ? 2.6 : 0;
      context.stroke();
    };
    network.capillaries.forEach(drawPath);
    network.secondary.forEach(drawPath);
    network.primary.forEach(drawPath);
    context.restore();
  }

  function drawNetworkSlice(path, from, to) {
    const start = path.length * Math.max(0, Math.min(1, from));
    const end = path.length * Math.max(0, Math.min(1, to));
    if (end <= start) return;
    let first = 0;
    while (first < path.distances.length - 1 && path.distances[first + 1] < start) first += 1;
    let last = first;
    while (last < path.distances.length - 1 && path.distances[last] < end) last += 1;
    context.beginPath();
    const startSpan = path.distances[first + 1] - path.distances[first];
    const startAmount = startSpan ? (start - path.distances[first]) / startSpan : 0;
    context.moveTo(
      path.sampleX[first] + (path.sampleX[first + 1] - path.sampleX[first]) * startAmount,
      path.sampleY[first] + (path.sampleY[first + 1] - path.sampleY[first]) * startAmount,
    );
    for (let index = first + 1; index < last; index += 1) context.lineTo(path.sampleX[index], path.sampleY[index]);
    const endSpan = path.distances[last] - path.distances[last - 1];
    const endAmount = endSpan ? (end - path.distances[last - 1]) / endSpan : 0;
    context.lineTo(
      path.sampleX[last - 1] + (path.sampleX[last] - path.sampleX[last - 1]) * endAmount,
      path.sampleY[last - 1] + (path.sampleY[last] - path.sampleY[last - 1]) * endAmount,
    );
    context.stroke();
  }

  function drawNetworkParticle(path, progress, size, opacity) {
    networkPointAlong(path, progress, path.particle);
    networkPointAlong(path, Math.max(0, progress - 0.006), path.probeA);
    networkPointAlong(path, Math.min(1, progress + 0.006), path.probeB);
    const angle = Math.atan2(path.probeB.y - path.probeA.y, path.probeB.x - path.probeA.x);
    const radius = Math.max(2, size * 3.4);
    const glow = context.createRadialGradient(path.particle.x, path.particle.y, 0, path.particle.x, path.particle.y, radius);
    glow.addColorStop(0, "rgba(255, 236, 229, .92)");
    glow.addColorStop(0.2, "rgba(255, 51, 77, .78)");
    glow.addColorStop(1, "rgba(229, 27, 53, 0)");
    context.globalAlpha = opacity;
    context.fillStyle = glow;
    context.fillRect(path.particle.x - radius, path.particle.y - radius, radius * 2, radius * 2);

    context.save();
    context.translate(path.particle.x, path.particle.y);
    context.rotate(angle);
    context.globalAlpha = opacity * 0.82;
    context.fillStyle = "#FF727F";
    context.beginPath();
    context.ellipse(0, 0, size * 1.75, size * 0.72, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawNetworkSignals(placement, cycle, still) {
    if (still) return;
    const opacity = placement.alpha * config.intensity * network.sceneAlpha;
    context.save();
    clipNetworkAwayFromContent();
    context.globalCompositeOperation = "screen";
    const drawPathSignal = (path, index) => {
      if (!path.visible || path.length < 1) return;
      const progress = path.signalProgress;
      const sync = path.sync ? cycle.ventricular * 0.72 + cycle.recovery * 0.16 : cycle.ventricular * 0.12;
      const scrollGain = path.tier === 0 ? 1 + scrollMotion.activity * 0.22 : 1;
      const alpha = opacity * networkPathActivity(path)
        * (path.tier === 0 ? 0.78 : path.tier === 1 ? 0.56 : 0.36) * (1 + sync) * scrollGain;
      context.globalAlpha = alpha * 0.5;
      context.strokeStyle = "#E51B35";
      context.lineWidth = path.tier === 0 ? path.width * 1.45 : path.width * 1.2;
      context.lineCap = "round";
      context.shadowColor = "#FF334D";
      context.shadowBlur = path.tier === 0 ? 5 : 2;
      drawNetworkSlice(path, progress - (path.tier === 0 ? 0.14 : 0.10), progress);
      context.globalAlpha = alpha * 0.42;
      context.strokeStyle = "#FF334D";
      context.lineWidth = path.tier === 0 ? path.width * 1.12 : path.width;
      drawNetworkSlice(path, progress - 0.045, progress);
      context.shadowBlur = 0;
      drawNetworkParticle(path, progress, path.particleSize * (1 + cycle.ventricular * 0.18), alpha * 0.9);

      if (path.sync && cycle.ventricular > 0.12) {
        const beatProgress = Math.max(0, Math.min(1, (cycle.phase - 0.58) / 0.42));
        drawNetworkParticle(path, beatProgress, path.particleSize * 1.25, opacity * cycle.ventricular * 0.68);
      }

      if (path.tier === 0 && index % 2 === 0) {
        const dropletProgress = (elapsed * (path.speed * 0.47) + path.phase + 0.31) % 1;
        const dropletWindow = smoothstep((0.5 + Math.sin(elapsed * 0.34 + path.phase * 5) * 0.5 - 0.86) / 0.14);
        if (dropletWindow > 0.01) {
          drawNetworkParticle(path, dropletProgress, path.particleSize * 1.16, alpha * 0.48 * dropletWindow);
        }
      }
    };
    network.primary.forEach(drawPathSignal);
    network.secondary.forEach((path, index) => {
      if (width >= 700 || config.density === "high" || index % 3 === 0) drawPathSignal(path, index);
    });
    network.capillaries.forEach((path, index) => {
      if (config.density === "high" && index % 3 === 0) drawPathSignal(path, index);
    });

    const junction = network.secondary.find((path) => path.visible && path.sync);
    if (junction && cycle.ventricular > 0.2) {
      networkPointAlong(junction.parent, junction.attach, junction.particle);
      const flicker = 0.5 + Math.sin(elapsed * 8.2 + junction.phase) * 0.5;
      context.globalAlpha = opacity * cycle.ventricular * 0.26 * flicker;
      context.fillStyle = "#FF334D";
      context.beginPath();
      context.arc(junction.particle.x, junction.particle.y, 2.2 + cycle.ventricular * 1.3, 0, Math.PI * 2);
      context.fill();

      const fragmentPhase = elapsed * 2.7 + junction.phase;
      context.globalAlpha = opacity * cycle.ventricular * 0.18;
      context.strokeStyle = "#FF727F";
      context.lineWidth = 0.8;
      context.beginPath();
      context.moveTo(junction.particle.x + Math.cos(fragmentPhase) * 2, junction.particle.y + Math.sin(fragmentPhase) * 2);
      context.lineTo(junction.particle.x + Math.cos(fragmentPhase) * 6, junction.particle.y + Math.sin(fragmentPhase) * 6);
      context.moveTo(junction.particle.x - Math.sin(fragmentPhase) * 2, junction.particle.y + Math.cos(fragmentPhase) * 2);
      context.lineTo(junction.particle.x - Math.sin(fragmentPhase) * 5, junction.particle.y + Math.cos(fragmentPhase) * 5);
      context.stroke();
    }
    context.restore();
  }

  function drawNetworkHeartLinks(placement, cycle) {
    const opacity = placement.alpha * config.intensity * network.sceneAlpha;
    context.save();
    context.globalCompositeOperation = "screen";
    network.primary.forEach((path) => {
      if (!path.visible) return;
      const beat = path.sync ? cycle.ventricular * 0.55 : cycle.atrial * 0.14;
      context.globalAlpha = opacity * networkPathActivity(path) * (0.38 + beat);
      context.strokeStyle = "#E51B35";
      context.lineWidth = Math.max(0.7, path.width * 0.76);
      context.lineCap = "round";
      context.shadowColor = "#FF334D";
      context.shadowBlur = 3 + beat * 4;
      drawNetworkSlice(path, 0, 0.047);

      const glowRadius = 5 + beat * 4;
      const glow = context.createRadialGradient(path.sampleX[0], path.sampleY[0], 0, path.sampleX[0], path.sampleY[0], glowRadius);
      glow.addColorStop(0, `rgba(255, 114, 127, ${0.48 + beat * 0.34})`);
      glow.addColorStop(0.35, "rgba(229, 27, 53, .42)");
      glow.addColorStop(1, "rgba(229, 27, 53, 0)");
      context.globalAlpha = opacity * networkPathActivity(path) * 0.72;
      context.fillStyle = glow;
      context.fillRect(path.sampleX[0] - glowRadius, path.sampleY[0] - glowRadius, glowRadius * 2, glowRadius * 2);
    });
    context.restore();
  }

  function smoothstep(value) {
    const amount = Math.max(0, Math.min(1, value));
    return amount * amount * (3 - 2 * amount);
  }

  function pulse(phase, start, peak, end) {
    if (phase <= start || phase >= end) return 0;
    if (phase <= peak) return smoothstep((phase - start) / (peak - start));
    return 1 - smoothstep((phase - peak) / (end - peak));
  }

  function cardiacState(time) {
    const duration = 1.12;
    const phase = ((time / duration) % 1 + 1) % 1;
    const atrial = pulse(phase, 0.43, 0.49, 0.56);
    const ventricular = pulse(phase, 0.58, 0.68, 0.82);
    const recovery = phase > 0.82 ? 1 - smoothstep((phase - 0.82) / 0.18) : 0;
    const name = phase < 0.43 ? "filling"
      : phase < 0.58 ? "atrial-contraction"
        : phase < 0.82 ? "ventricular-contraction"
          : "recovery";
    return { phase, atrial, ventricular, recovery, name };
  }

  function regionWeight(u, v, centerX, centerY, radiusX, radiusY) {
    const x = (u - centerX) / radiusX;
    const y = (v - centerY) / radiusY;
    return Math.exp(-1.9 * (x * x + y * y));
  }

  function deformPoint(u, v, cycle) {
    let dx = 0;
    let dy = 0;

    // Upper myocardial regions lead the main ventricular contraction.
    const rightAtrium = regionWeight(u, v, 0.37, 0.43, 0.20, 0.17) * cycle.atrial;
    const leftAtrium = regionWeight(u, v, 0.68, 0.44, 0.20, 0.17) * cycle.atrial;
    dx -= (u - 0.37) * rightAtrium * 0.032;
    dx -= (u - 0.68) * leftAtrium * 0.032;
    dy -= rightAtrium * 0.0038 + leftAtrium * 0.0038;
    dy -= (v - 0.43) * rightAtrium * 0.018;
    dy -= (v - 0.44) * leftAtrium * 0.018;

    // The two lower myocardial regions shorten and draw slightly toward the apex-to-base axis.
    const rightVentricle = regionWeight(u, v, 0.39, 0.70, 0.25, 0.29) * cycle.ventricular;
    const leftVentricle = regionWeight(u, v, 0.63, 0.72, 0.25, 0.30) * cycle.ventricular;
    dx -= (u - 0.39) * rightVentricle * 0.052;
    dx -= (u - 0.63) * leftVentricle * 0.058;
    dy -= (v - 0.70) * rightVentricle * 0.025;
    dy -= (v - 0.72) * leftVentricle * 0.028;
    dy -= (rightVentricle + leftVentricle) * 0.0055;

    // The aortic root and pulmonary trunk flex very slightly at their attachment zones.
    const aorticRoot = regionWeight(u, v, 0.59, 0.25, 0.27, 0.22) * cycle.ventricular;
    const pulmonaryRoot = regionWeight(u, v, 0.70, 0.38, 0.25, 0.14) * cycle.ventricular;
    dx += (u - 0.59) * aorticRoot * 0.008;
    dy += (v - 0.25) * aorticRoot * 0.006;
    dy -= pulmonaryRoot * 0.0035;

    // Scrolling adds a bounded elastic shear to the cardiac mesh. Heart-relative
    // routes use this same mapping, so signal anchors stay attached to the artwork.
    const scrollGain = scrollMotion.activity * (config.motion === "minimal" ? 0.58 : 1);
    const centeredX = u - 0.5;
    const centeredY = v - 0.5;
    dx += centeredX * scrollGain * 0.014;
    dy -= centeredY * scrollGain * 0.009;
    dx -= centeredY * scrollMotion.velocity * scrollGain * 0.012;
    dy += centeredX * scrollMotion.velocity * scrollGain * 0.004;

    return { x: u + dx, y: v + dy };
  }

  function drawTexturedTriangle(
    index0, index1, index2,
    sx0, sy0, sx1, sy1, sx2, sy2,
    sourceX, sourceY, sourceWidth, sourceHeight,
    placement,
  ) {
    const p0x = meshPositions[index0];
    const p0y = meshPositions[index0 + 1];
    const p1x = meshPositions[index1];
    const p1y = meshPositions[index1 + 1];
    const p2x = meshPositions[index2];
    const p2y = meshPositions[index2 + 1];
    const x10 = sx1 - sx0;
    const y10 = sy1 - sy0;
    const x20 = sx2 - sx0;
    const y20 = sy2 - sy0;
    const determinant = x10 * y20 - x20 * y10;
    if (!determinant) return;

    const x10d = p1x - p0x;
    const y10d = p1y - p0y;
    const x20d = p2x - p0x;
    const y20d = p2y - p0y;
    const a = (x10d * y20 - x20d * y10) / determinant;
    const c = (x10 * x20d - x20 * x10d) / determinant;
    const e = p0x - a * sx0 - c * sy0;
    const b = (y10d * y20 - y20d * y10) / determinant;
    const d = (x10 * y20d - x20 * y10d) / determinant;
    const f = p0y - b * sx0 - d * sy0;

    context.save();
    context.beginPath();
    context.moveTo(placement.x + p0x, placement.y + p0y);
    context.lineTo(placement.x + p1x, placement.y + p1y);
    context.lineTo(placement.x + p2x, placement.y + p2y);
    context.closePath();
    context.clip();
    context.setTransform(
      pixelRatio * a,
      pixelRatio * b,
      pixelRatio * c,
      pixelRatio * d,
      pixelRatio * (placement.x + e),
      pixelRatio * (placement.y + f),
    );
    context.drawImage(
      heart,
      sourceX, sourceY, sourceWidth, sourceHeight,
      sourceX, sourceY, sourceWidth, sourceHeight,
    );
    context.restore();
  }

  function drawHeartMesh(placement, cycle) {
    const imageWidth = heart.naturalWidth;
    const imageHeight = heart.naturalHeight;
    const rowStride = meshColumns + 1;
    for (let row = 0; row <= meshRows; row += 1) {
      const v = row / meshRows;
      for (let column = 0; column <= meshColumns; column += 1) {
        const u = column / meshColumns;
        const mapped = deformPoint(u, v, cycle);
        const index = (row * rowStride + column) * 2;
        meshPositions[index] = (mapped.x - 0.5) * placement.size;
        meshPositions[index + 1] = (mapped.y - 0.5) * placement.size;
      }
    }

    const cellWidth = imageWidth / meshColumns;
    const cellHeight = imageHeight / meshRows;
    for (let row = 0; row < meshRows; row += 1) {
      const sourceY = row * cellHeight;
      for (let column = 0; column < meshColumns; column += 1) {
        const sourceX = column * cellWidth;
        const p00Index = (row * rowStride + column) * 2;
        const p10Index = p00Index + 2;
        const p01Index = p00Index + rowStride * 2;
        const p11Index = p01Index + 2;
        const sourceRight = sourceX + cellWidth;
        const sourceBottom = sourceY + cellHeight;
        drawTexturedTriangle(
          p00Index, p10Index, p01Index,
          sourceX, sourceY, sourceRight, sourceY, sourceX, sourceBottom,
          sourceX, sourceY, cellWidth, cellHeight, placement,
        );
        drawTexturedTriangle(
          p10Index, p11Index, p01Index,
          sourceRight, sourceY, sourceRight, sourceBottom, sourceX, sourceBottom,
          sourceX, sourceY, cellWidth, cellHeight, placement,
        );
      }
    }
  }

  function drawAura(placement, cycle) {
    const radius = placement.size * 0.66 * (1 + cycle.ventricular * 0.035 + cycle.recovery * 0.006);
    const auraX = placement.x - scrollMotion.velocity * scrollMotion.activity * placement.size * 0.016;
    const auraY = placement.y - scrollMotion.direction * scrollMotion.activity * placement.size * 0.006;
    const glow = context.createRadialGradient(
      auraX, auraY, placement.size * 0.12,
      auraX, auraY, radius,
    );
    glow.addColorStop(0, "rgba(175, 12, 35, .16)");
    glow.addColorStop(0.48, "rgba(90, 5, 22, .075)");
    glow.addColorStop(1, "rgba(18, 2, 8, 0)");
    context.save();
    context.globalAlpha = placement.alpha * config.intensity
      * placement.energy * (0.82 + cycle.ventricular * 0.18 + cycle.recovery * 0.035
        + scrollMotion.activity * 0.08);
    context.fillStyle = glow;
    context.beginPath();
    context.ellipse(auraX, auraY, radius * 0.82, radius, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawOrbit(placement, phase) {
    if (config.motion === "reduced" || config.liteMode || width < 700) return;
    context.save();
    context.translate(placement.x, placement.y);
    context.scale(placement.size * 0.5, placement.size * 0.5);
    context.rotate(phase * 0.012);
    context.globalAlpha = placement.alpha * config.intensity * 0.23;
    context.strokeStyle = "#d34b5c";
    context.lineWidth = 1 / placement.size;
    context.setLineDash([0.025, 0.035, 0.14, 0.05]);
    context.beginPath();
    context.ellipse(0, 0, 0.52, 0.62, -0.12, 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([0.008, 0.06]);
    context.globalAlpha *= 0.52;
    context.beginPath();
    context.ellipse(0, 0, 0.57, 0.68, 0.08, 0.2, Math.PI * 1.78);
    context.stroke();
    context.restore();
  }

  function drawAmbient(placement, phase) {
    if (config.liteMode || width < 700 || config.motion === "reduced") return;
    const count = config.density === "high" ? ambient.length : config.density === "low" ? 7 : 14;
    context.save();
    context.translate(placement.x - placement.size / 2, placement.y - placement.size / 2);
    context.scale(placement.size, placement.size);
    for (let index = 0; index < count; index += 1) {
      const particle = ambient[index];
      const scrollDrift = index < 6 ? scrollMotion.direction * scrollMotion.activity * 0.055 : 0;
      const angle = particle.angle + phase * particle.speed + scrollDrift;
      const x = 0.5 + Math.cos(angle) * particle.radiusX;
      const y = 0.5 + Math.sin(angle) * particle.radiusY;
      context.globalAlpha = placement.alpha * config.intensity * (0.16 + (Math.sin(angle * 2) + 1) * 0.09);
      context.fillStyle = "#f4838b";
      context.fillRect(x, y, particle.size / placement.size, particle.size / placement.size);
    }
    context.restore();
  }

  function drawSignals(placement, cycle, still) {
    context.save();
    context.globalAlpha = placement.alpha * config.intensity;
    context.translate(placement.x - placement.size / 2, placement.y - placement.size / 2);
    context.scale(placement.size, placement.size);
    context.globalCompositeOperation = "screen";

    routes.forEach((route, index) => {
      context.beginPath();
      route.segments.forEach((segment, segmentIndex) => {
        const mapped = [];
        for (let pointIndex = 0; pointIndex < segment.length; pointIndex += 2) {
          mapped.push(deformPoint(segment[pointIndex], segment[pointIndex + 1], cycle));
        }
        if (segmentIndex === 0) context.moveTo(mapped[0].x, mapped[0].y);
        context.bezierCurveTo(
          mapped[1].x, mapped[1].y,
          mapped[2].x, mapped[2].y,
          mapped[3].x, mapped[3].y,
        );
      });
      const selectedGain = index < 2 ? 1 + scrollMotion.activity * 0.22 : 1;
      context.strokeStyle = index === 1
        ? `rgba(255, 42, 64, ${0.28 * selectedGain})`
        : `rgba(255, 44, 67, ${0.19 * selectedGain})`;
      context.lineWidth = index === 1 ? 0.0018 : 0.00125;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.shadowColor = "#ff263d";
      context.shadowBlur = placement.size * 0.009;
      context.stroke();

      if (still) return;
      const progress = (cycle.phase * 0.7 + index * 0.23) % 1;
      const basePoint = pointAlong(route, progress);
      const point = deformPoint(basePoint.x, basePoint.y, cycle);
      const radius = 0.008 + cycle.ventricular * 0.005 + (index < 2 ? scrollMotion.activity * 0.0012 : 0);
      const signal = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
      signal.addColorStop(0, "rgba(255, 249, 244, .94)");
      signal.addColorStop(0.16, "rgba(255, 83, 101, .88)");
      signal.addColorStop(1, "rgba(255, 35, 62, 0)");
      context.fillStyle = signal;
      context.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2);
    });

    if (!still) {
      context.shadowBlur = 0;
      const baseJunction = pointAlong(routes[0], 0.52);
      const junction = deformPoint(baseJunction.x, baseJunction.y, cycle);
      const flash = 0.24 + cycle.atrial * 0.10 + cycle.ventricular * 0.46 + cycle.recovery * 0.08;
      const glow = context.createRadialGradient(junction.x, junction.y, 0, junction.x, junction.y, 0.023);
      glow.addColorStop(0, `rgba(255, 232, 220, ${flash})`);
      glow.addColorStop(0.25, `rgba(255, 41, 66, ${flash * 0.72})`);
      glow.addColorStop(1, "rgba(255, 35, 62, 0)");
      context.fillStyle = glow;
      context.fillRect(junction.x - 0.023, junction.y - 0.023, 0.046, 0.046);
    }
    context.restore();
  }

  function isStill() {
    return reducedMotion?.matches || config.motion === "reduced";
  }

  function profilePlacement(profile, mobile) {
    const maxSize = mobile ? Math.min(width * 0.84, height * 0.32) : Math.min(width * 0.52, height * 0.70);
    const size = Math.min(Math.min(
      width * profile.width,
      height * profile.height,
      mobile ? 420 : 860,
    ) * config.scale * (config.liteMode ? 0.92 : 1), maxSize);
    const inset = size * 0.52 + (mobile ? 8 : 14);
    return {
      mobile,
      size,
      x: Math.max(inset, Math.min(width - inset, width * profile.x)),
      y: Math.max(inset, Math.min(height - inset, height * profile.y)),
      alpha: profile.alpha * (mobile ? 0.76 : 1),
      energy: profile.energy ?? 0.68,
    };
  }

  function targetPlacement() {
    const mobile = width < 700;
    const profiles = mobile ? compactScenes : wideScenes;
    if (page === "portfolio" && isStill()) {
      const size = Math.min(
        width * (mobile ? 0.54 : 0.36),
        height * (mobile ? 0.25 : 0.46),
        mobile ? 240 : 520,
      ) * config.scale * (config.liteMode ? 0.92 : 1);
      const inset = size * 0.52 + 10;
      return {
        mobile,
        size,
        x: Math.max(inset, Math.min(width - inset, width * (mobile ? 0.72 : 0.84))),
        y: Math.max(inset, Math.min(height - inset, height * (mobile ? 0.79 : 0.56))),
        alpha: mobile ? 0.12 : 0.17,
        energy: 0.46,
      };
    }

    if (page !== "portfolio") {
      const profile = pageScenes[page] || pageScenes.legal;
      return profilePlacement(profile, mobile);
    }

    const progress = sectionProgressAt(scrollController.latestY);
    const from = profilePlacement(profiles[progress?.current.id] || profiles.top, mobile);
    const to = profilePlacement(profiles[progress?.next.id] || profiles[progress?.current.id] || profiles.top, mobile);
    const amount = progress?.transitionProgress || 0;
    return {
      mobile,
      x: from.x + (to.x - from.x) * amount,
      y: from.y + (to.y - from.y) * amount,
      size: from.size + (to.size - from.size) * amount,
      alpha: from.alpha + (to.alpha - from.alpha) * amount,
      energy: from.energy + (to.energy - from.energy) * amount,
    };
  }

  function getPlacement() {
    const target = targetPlacement();
    if (!currentPlacement || isStill()) {
      currentPlacement = { ...target };
      return currentPlacement;
    }
    const rate = config.motion === "minimal" ? 3.7 : 5.2;
    const amount = 1 - Math.exp(-rate * frameDelta);
    currentPlacement.x += (target.x - currentPlacement.x) * amount;
    currentPlacement.y += (target.y - currentPlacement.y) * amount;
    currentPlacement.size += (target.size - currentPlacement.size) * amount;
    currentPlacement.alpha += (target.alpha - currentPlacement.alpha) * amount;
    currentPlacement.energy += (target.energy - currentPlacement.energy) * amount;
    currentPlacement.mobile = target.mobile;
    return currentPlacement;
  }

  function updateHeartHud(placement, cycle, still) {
    const widthRatio = hudWidthRatio;
    const heightRatio = hudHeightRatio;
    hud.style.setProperty("--hud-x", `${placement.x}px`);
    hud.style.setProperty("--hud-y", `${placement.y}px`);
    hud.style.setProperty("--hud-width", `${placement.size * widthRatio}px`);
    hud.style.setProperty("--hud-height", `${placement.size * heightRatio}px`);
    const pageFactor = page === "store" || page === "admin" ? 0.66 : page === "legal" ? 0.72 : 1;
    const opacity = (0.34 + placement.alpha * 0.26) * network.sceneAlpha * pageFactor
      * (0.72 + config.intensity * 0.28) * (placement.mobile ? 0.82 : 1);
    hud.style.opacity = String(opacity);
    hud.dataset.scene = activeScene;
    hud.dataset.phase = still ? "reduced" : cycle.name;
  }

  function render() {
    if (!ready || !width || !height || disposed) return;
    const still = isStill();
    const cycle = cardiacState(elapsed);
    if (still) {
      cycle.atrial = 0;
      cycle.ventricular = 0;
      cycle.recovery = 0;
    }
    canvas.dataset.phase = still ? "reduced" : cycle.name;
    const placement = getPlacement();
    updateHeartHud(placement, cycle, still);
    refreshNetworkContentMasks();

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);
    drawAura(placement, cycle);
    updateNetworkGeometry(placement, cycle);
    updateNetworkVisibility(still, placement);
    drawNetworkBackground(placement, cycle);
    drawNetworkSignals(placement, cycle, still);
    drawOrbit(placement, elapsed);
    drawAmbient(placement, elapsed);

    context.globalAlpha = placement.alpha * config.intensity;
    drawHeartMesh(placement, cycle);
    drawNetworkHeartLinks(placement, cycle);
    drawSignals(placement, cycle, still);

    if (config.scanlines && !config.liteMode) {
      context.save();
      context.globalAlpha = 0.018;
      context.strokeStyle = "#ff6872";
      context.lineWidth = 0.5 / pixelRatio;
      for (let y = 5; y < height; y += 12) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }
      context.restore();
    }
  }

  function resize() {
    const viewport = window.visualViewport;
    width = Math.max(1, viewport?.width || window.innerWidth);
    height = Math.max(1, viewport?.height || window.innerHeight);
    const compact = width < 700 || config.liteMode || (navigator.deviceMemory && navigator.deviceMemory <= 4);
    pixelRatio = Math.min(window.devicePixelRatio || 1, compact ? 1.15 : 1.5);
    const nextColumns = compact ? 12 : 16;
    const nextRows = compact ? 14 : 18;
    if (nextColumns !== meshColumns || nextRows !== meshRows) {
      meshColumns = nextColumns;
      meshRows = nextRows;
      meshPositions = new Float32Array((meshColumns + 1) * (meshRows + 1) * 2);
    }
    const canvasWidth = Math.round(width * pixelRatio);
    const canvasHeight = Math.round(height * pixelRatio);
    sectionMetricsDirty = true;
    refreshSectionMetrics();
    const frame = page === "portfolio" ? document.querySelector(".hero-visual-frame")?.getBoundingClientRect() : null;
    const mobile = width < 700;
    const referenceScene = page === "portfolio"
      ? (mobile ? compactScenes.top : wideScenes.top)
      : pageScenes[page];
    if (frame?.width > 0 && frame?.height > 0 && referenceScene) {
      const referenceSize = Math.min(
        Math.min(width * referenceScene.width, height * referenceScene.height, mobile ? 420 : 860)
          * config.scale * (config.liteMode ? 0.92 : 1),
        mobile ? Math.min(width * 0.84, height * 0.32) : Math.min(width * 0.52, height * 0.70),
      );
      if (referenceSize > 0) {
        hudWidthRatio = Math.max(0.78, Math.min(1.8, frame.width / referenceSize));
        hudHeightRatio = Math.max(0.72, Math.min(1.55, frame.height / referenceSize));
      }
    } else if (mobile) {
      hudWidthRatio = 1.46;
      hudHeightRatio = 1.18;
    } else {
      hudWidthRatio = 0.86;
      hudHeightRatio = 0.81;
    }
    if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
    }
    if (!network.initialized) initializeNetwork();
    if (isStill()) render();
  }

  function stop() {
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    previousFrame = 0;
  }

  function updateScrollController(delta, now) {
    const currentY = scrollController.latestY;
    if (!scrollController.timestamp) {
      scrollController.previousY = currentY;
      scrollController.timestamp = now;
      return;
    }
    const sampleDelta = Math.max(0.001, Math.min(0.2, (now - scrollController.timestamp) / 1000 || delta));
    const rawVelocity = clamp((currentY - scrollController.previousY) / sampleDelta / 2300, -1, 1, 0);
    scrollController.previousY = currentY;
    scrollController.timestamp = now;

    if (isStill()) {
      scrollMotion.velocity = 0;
      scrollMotion.activity = 0;
      scrollMotion.direction = 0;
      return;
    }

    const safeDelta = Math.max(0, Math.min(0.12, delta));
    const velocityAmount = 1 - Math.exp(-10 * safeDelta);
    scrollMotion.velocity += (rawVelocity - scrollMotion.velocity) * velocityAmount;
    const motionScale = config.motion === "minimal" ? 0.62 : 1;
    const targetActivity = Math.min(1, Math.abs(scrollMotion.velocity)) * motionScale;
    const activityRate = targetActivity > scrollMotion.activity ? 9 : 3.8;
    scrollMotion.activity += (targetActivity - scrollMotion.activity) * (1 - Math.exp(-activityRate * safeDelta));
    if (Math.abs(scrollMotion.velocity) > 0.012) scrollMotion.direction = Math.sign(scrollMotion.velocity);
    else if (scrollMotion.activity < 0.015) scrollMotion.direction = 0;
  }

  function tick(now) {
    if (disposed || document.hidden) {
      stop();
      return;
    }
    const frameRate = config.motion === "minimal" || config.liteMode
      ? 1000 / 16
      : width < 700 ? 1000 / 24 : 1000 / 30;
    if (!previousFrame) previousFrame = now;
    if (now - previousFrame >= frameRate) {
      frameDelta = Math.min(0.09, Math.max(0, (now - previousFrame) / 1000));
      updateScrollController(frameDelta, now);
      elapsed += frameDelta;
      advanceNetworkSignals(frameDelta);
      previousFrame = now;
      render();
    }
    frameId = requestAnimationFrame(tick);
  }

  function start() {
    stop();
    if (disposed || !ready || document.hidden) return;
    if (isStill()) {
      render();
      return;
    }
    elapsed = heartbeatElapsed();
    frameId = requestAnimationFrame(tick);
  }

  function update(next = {}) {
    config.intensity = clamp(next.intensity, 0.2, 1, config.intensity);
    config.scale = clamp(next.scale, 0.75, 1.2, config.scale);
    config.density = valid(next.density, ["low", "balanced", "high"], config.density);
    config.motion = valid(next.motion, ["full", "reduced", "minimal"], config.motion);
    config.liteMode = typeof next.liteMode === "boolean" ? next.liteMode : config.liteMode;
    config.scanlines = typeof next.scanlines === "boolean" ? next.scanlines : config.scanlines;
    if (network.initialized) network.nextConfigurationAt = Math.min(network.nextConfigurationAt, elapsed + 0.35);
    resize();
    start();
  }

  function onVisibility() {
    if (document.hidden) stop();
    else {
      resetScrollSamples();
      start();
    }
  }

  function onMotionPreference(event) {
    if (event.matches) {
      stop();
      render();
    } else start();
  }

  function onSystemTheme(event) {
    if (readPreferences().theme !== "system") return;
    root.dataset.theme = event.matches ? "light" : "dark";
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.content = event.matches ? "#e9eef1" : "#070a0b";
  }

  function dispose() {
    disposed = true;
    stop();
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
    sectionResizeObserver?.disconnect();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", resize);
    window.visualViewport?.removeEventListener("resize", resize);
    window.removeEventListener("cyber-heart:settings", onSettings);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("pageshow", onPageShow);
    reducedMotion?.removeEventListener?.("change", onMotionPreference);
    lightTheme?.removeEventListener?.("change", onSystemTheme);
    heart.onload = null;
    heart.onerror = null;
    canvas.remove();
    hud.remove();
  }

  function onSettings(event) {
    if (event.detail && typeof event.detail === "object") update(event.detail);
  }
  function resetScrollSamples() {
    const y = window.scrollY || 0;
    scrollController.latestY = y;
    scrollController.previousY = y;
    scrollController.timestamp = 0;
    scrollMotion.velocity = 0;
    scrollMotion.activity = 0;
    scrollMotion.direction = 0;
  }

  function onPageHide() { stop(); }
  function onPageShow() {
    if (disposed) return;
    resetScrollSamples();
    start();
  }

  window.CyberHeart = Object.freeze({ update, dispose });
  window.addEventListener("cyber-heart:settings", onSettings);
  window.addEventListener("resize", resize, { passive: true });
  window.visualViewport?.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("pageshow", onPageShow);
  reducedMotion?.addEventListener?.("change", onMotionPreference);
  lightTheme?.addEventListener?.("change", onSystemTheme);
  observePortfolioSections();

  heart.onload = () => {
    ready = true;
    resize();
    start();
  };
  heart.onerror = installImageFallback;
  heart.src = assetUrl();
  resize();
})();
