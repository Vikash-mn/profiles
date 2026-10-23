(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const storageKey = "vikash-portfolio-preferences-v2";
  const defaults = {
    theme: "dark", accent: "green", density: "comfortable", fontSize: 100,
    terminalFont: "mono", motion: "full", showMap: true,
    heartIntensity: 78, heartScale: 100, particleDensity: "balanced", liteMode: false, scanlines: true,
  };
  const allowed = {
    theme: ["system", "dark", "light"],
    accent: ["green", "red", "cyan"],
    density: ["comfortable", "compact"],
    terminalFont: ["mono", "system"],
    motion: ["full", "reduced", "minimal"],
    particleDensity: ["low", "balanced", "high"],
  };

  function loadPreferences() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) || "null");
      if (!saved || typeof saved !== "object" || Array.isArray(saved)) return { ...defaults };
      return {
        theme: allowed.theme.includes(saved.theme) ? saved.theme : defaults.theme,
        accent: allowed.accent.includes(saved.accent) ? saved.accent : defaults.accent,
        density: allowed.density.includes(saved.density) ? saved.density : defaults.density,
        fontSize: Number.isFinite(Number(saved.fontSize))
          ? Math.min(120, Math.max(90, Math.round(Number(saved.fontSize) / 5) * 5))
          : defaults.fontSize,
        terminalFont: allowed.terminalFont.includes(saved.terminalFont) ? saved.terminalFont : defaults.terminalFont,
        motion: allowed.motion.includes(saved.motion) ? saved.motion : defaults.motion,
        showMap: typeof saved.showMap === "boolean" ? saved.showMap : defaults.showMap,
        heartIntensity: Number.isFinite(Number(saved.heartIntensity)) ? Math.min(100, Math.max(20, Math.round(Number(saved.heartIntensity) / 5) * 5)) : defaults.heartIntensity,
        heartScale: Number.isFinite(Number(saved.heartScale)) ? Math.min(120, Math.max(75, Math.round(Number(saved.heartScale) / 5) * 5)) : defaults.heartScale,
        particleDensity: allowed.particleDensity.includes(saved.particleDensity) ? saved.particleDensity : defaults.particleDensity,
        liteMode: typeof saved.liteMode === "boolean" ? saved.liteMode : defaults.liteMode,
        scanlines: typeof saved.scanlines === "boolean" ? saved.scanlines : defaults.scanlines,
      };
    } catch {
      return { ...defaults };
    }
  }

  let preferences = loadPreferences();
  function savePreferences() {
    try { window.localStorage.setItem(storageKey, JSON.stringify(preferences)); } catch { /* Preferences still apply for this visit. */ }
  }
  function lightSystemTheme() { return window.matchMedia?.("(prefers-color-scheme: light)").matches ?? false; }
  function osReducesMotion() { return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false; }
  function currentThemeLabel() {
    return preferences.theme === "system" ? "system (" + (lightSystemTheme() ? "light" : "dark") + ")" : preferences.theme;
  }

  const mapPanel = document.querySelector("#atlas-section");
  const mapStatus = document.querySelector("#map-status");
  const mapCanvas = document.querySelector("#signal-map");
  const mapLines = document.querySelector("#map-lines");
  const mapList = document.querySelector("#signal-map-list");
  const projectRows = [...document.querySelectorAll(".project-row[data-slug]")];
  const filterEmpty = document.querySelector("#filter-empty");
  const filterReset = document.querySelector("#filter-reset");
  let selectedNode = "";
  let currentFilter = "";

  function applyPreferences() {
    root.dataset.theme = preferences.theme === "system" ? (lightSystemTheme() ? "light" : "dark") : preferences.theme;
    root.dataset.accent = preferences.accent;
    root.dataset.terminalFont = preferences.terminalFont;
    root.dataset.motion = osReducesMotion() ? "reduced" : preferences.motion;
    root.dataset.fontSize = String(preferences.fontSize);
    root.style.setProperty("--font-scale", String(preferences.fontSize / 100));
    root.dataset.liteMode = String(preferences.liteMode);
    root.dataset.scanlines = String(preferences.scanlines);
    body.dataset.density = preferences.density;
    if (mapPanel) mapPanel.hidden = !preferences.showMap;
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.content = root.dataset.theme === "light" ? "#e9eef1" : "#070a0b";
    window.dispatchEvent(new CustomEvent("cyber-heart:settings", { detail: {
      intensity: preferences.heartIntensity / 100,
      scale: preferences.heartScale / 100,
      density: preferences.particleDensity,
      motion: root.dataset.motion,
      liteMode: preferences.liteMode,
      scanlines: preferences.scanlines,
    } }));
    renderMapState();
  }
  function updatePreference(key, value) {
    if (!(key in defaults)) return;
    preferences = { ...preferences, [key]: value };
    applyPreferences();
    syncSettingsControls();
    savePreferences();
    const feedback = document.querySelector("#settings-feedback");
    if (feedback) feedback.textContent = "Preference saved for this browser.";
  }

  const settingsDialog = document.querySelector("#settings-dialog");
  const settingsOpen = document.querySelector("#settings-open");
  const themeSelect = document.querySelector("#theme-setting");
  const densitySelect = document.querySelector("#density-setting");
  const fontRange = document.querySelector("#font-size-setting");
  const fontValue = document.querySelector("#font-size-value");
  const terminalFontSelect = document.querySelector("#terminal-font-setting");
  const motionSelect = document.querySelector("#motion-setting");
  const mapSetting = document.querySelector("#map-setting");
  const heartIntensity = document.querySelector("#heart-intensity-setting");
  const heartIntensityValue = document.querySelector("#heart-intensity-value");
  const heartScale = document.querySelector("#heart-size-setting");
  const heartScaleValue = document.querySelector("#heart-size-value");
  const particleDensity = document.querySelector("#particle-density-setting");
  const liteModeSetting = document.querySelector("#lite-mode-setting");
  const scanlinesSetting = document.querySelector("#scanlines-setting");
  let settingsReturnFocus = settingsOpen;

  function syncSettingsControls() {
    if (!settingsDialog) return;
    themeSelect.value = preferences.theme;
    densitySelect.value = preferences.density;
    fontRange.value = String(preferences.fontSize);
    fontValue.value = preferences.fontSize + "%";
    fontValue.textContent = preferences.fontSize + "%";
    terminalFontSelect.value = preferences.terminalFont;
    motionSelect.value = preferences.motion;
    mapSetting.checked = preferences.showMap;
    heartIntensity.value = String(preferences.heartIntensity);
    heartIntensityValue.value = preferences.heartIntensity + "%";
    heartIntensityValue.textContent = preferences.heartIntensity + "%";
    heartScale.value = String(preferences.heartScale);
    heartScaleValue.value = preferences.heartScale + "%";
    heartScaleValue.textContent = preferences.heartScale + "%";
    particleDensity.value = preferences.particleDensity;
    liteModeSetting.checked = preferences.liteMode;
    scanlinesSetting.checked = preferences.scanlines;
    settingsDialog.querySelectorAll('input[name="accent"]').forEach((radio) => {
      radio.checked = radio.value === preferences.accent;
    });
  }
  function openDialog(dialog, focusTarget) {
    if (!dialog) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    focusTarget?.focus({ preventScroll: true });
  }
  function closeDialog(dialog) {
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  settingsOpen?.addEventListener("click", () => openSettings(settingsOpen));
  document.querySelector("#settings-close")?.addEventListener("click", () => closeDialog(settingsDialog));
  document.querySelector("#settings-done")?.addEventListener("click", (event) => {
    event.preventDefault();
    closeDialog(settingsDialog);
  });
  settingsDialog?.addEventListener("close", () => settingsReturnFocus?.focus({ preventScroll: true }));
  settingsDialog?.addEventListener("click", (event) => { if (event.target === settingsDialog) closeDialog(settingsDialog); });
  themeSelect?.addEventListener("change", () => {
    if (allowed.theme.includes(themeSelect.value)) updatePreference("theme", themeSelect.value);
  });
  densitySelect?.addEventListener("change", () => {
    if (allowed.density.includes(densitySelect.value)) updatePreference("density", densitySelect.value);
  });
  fontRange?.addEventListener("input", () => updatePreference("fontSize", Number(fontRange.value)));
  terminalFontSelect?.addEventListener("change", () => {
    if (allowed.terminalFont.includes(terminalFontSelect.value)) updatePreference("terminalFont", terminalFontSelect.value);
  });
  motionSelect?.addEventListener("change", () => {
    if (allowed.motion.includes(motionSelect.value)) updatePreference("motion", motionSelect.value);
  });
  heartIntensity?.addEventListener("input", () => updatePreference("heartIntensity", Number(heartIntensity.value)));
  heartScale?.addEventListener("input", () => updatePreference("heartScale", Number(heartScale.value)));
  particleDensity?.addEventListener("change", () => {
    if (allowed.particleDensity.includes(particleDensity.value)) updatePreference("particleDensity", particleDensity.value);
  });
  liteModeSetting?.addEventListener("change", () => updatePreference("liteMode", liteModeSetting.checked));
  scanlinesSetting?.addEventListener("change", () => updatePreference("scanlines", scanlinesSetting.checked));
  mapSetting?.addEventListener("change", () => updatePreference("showMap", mapSetting.checked));
  settingsDialog?.querySelectorAll('input[name="accent"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.checked && allowed.accent.includes(radio.value)) updatePreference("accent", radio.value);
    });
  });
  document.querySelector("#settings-reset")?.addEventListener("click", () => {
    preferences = { ...defaults };
    applyPreferences();
    syncSettingsControls();
    savePreferences();
    const feedback = document.querySelector("#settings-feedback");
    if (feedback) feedback.textContent = "Default preferences restored.";
  });
  window.matchMedia?.("(prefers-color-scheme: light)").addEventListener?.("change", () => {
    if (preferences.theme === "system") applyPreferences();
  });
  window.matchMedia?.("(prefers-reduced-motion: reduce)").addEventListener?.("change", applyPreferences);

  function getProjects() {
    return projectRows.map((card) => ({
      element: card,
      slug: card.dataset.slug,
      name: card.dataset.title || card.querySelector("h3")?.textContent.trim() || card.dataset.slug,
      description: card.dataset.description || card.querySelector(".project-description")?.textContent.trim() || "",
      purpose: card.dataset.purpose || "",
      stack: card.dataset.stack || [...card.querySelectorAll(".project-tags li")].map((tag) => tag.textContent.trim()).join(", "),
      status: card.dataset.status || "Project",
      source: card.dataset.source || "",
      technologies: (card.dataset.tech || "").split(/\s+/).filter(Boolean),
    }));
  }
  const projectData = getProjects();
  const projectTotal = document.querySelector("#project-total");
  const technologyTotal = document.querySelector("#technology-total");
  const technologyKeys = new Set(projectData.flatMap((project) => project.technologies));
  if (projectTotal) projectTotal.textContent = String(projectData.length).padStart(2, "0");
  if (technologyTotal) technologyTotal.textContent = String(technologyKeys.size).padStart(2, "0");
  const technologyNodes = [...document.querySelectorAll(".tech-node[data-node]")];
  const projectNodes = [...document.querySelectorAll(".project-node[data-node]")];
  if (mapList && mapCanvas) {
    mapCanvas.querySelectorAll(".map-node").forEach((node) => {
      const clone = node.cloneNode(true);
      clone.removeAttribute("style");
      mapList.append(clone);
    });
  }
  const allMapNodes = [...document.querySelectorAll(".map-node[data-node]")];
  applyPreferences();
  syncSettingsControls();

  function setNodeState() {
    allMapNodes.forEach((node) => {
      const same = node.dataset.node === selectedNode;
      node.setAttribute("aria-pressed", String(same));
    });
  }
  function renderMapLines() {
    if (!mapCanvas || !mapLines) return;
    const width = mapCanvas.clientWidth;
    const height = mapCanvas.clientHeight;
    if (!width || !height) return;
    mapLines.replaceChildren();
    mapLines.setAttribute("viewBox", "0 0 " + width + " " + height);
    const techByKey = new Map(technologyNodes.map((node) => [node.dataset.node, node]));
    const edgeRecords = [];
    projectData.forEach((project) => {
      project.technologies.forEach((key) => {
        const tech = techByKey.get(key);
        if (tech) edgeRecords.push({ project: project.slug, tech: key, a: projectNodes.find((node) => node.dataset.node === project.slug), b: tech });
      });
    });
    edgeRecords.forEach((edge) => {
      if (!edge.a || !edge.b) return;
      const ax = Number(edge.a.dataset.x) * width / 100;
      const ay = Number(edge.a.dataset.y) * height / 100;
      const bx = Number(edge.b.dataset.x) * width / 100;
      const by = Number(edge.b.dataset.y) * height / 100;
      const bend = Math.max(18, Math.abs(bx - ax) * .46);
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M " + ax + " " + ay + " C " + (ax + bend) + " " + ay + ", " + (bx - bend) + " " + by + ", " + bx + " " + by);
      path.setAttribute("class", "map-link");
      path.dataset.project = edge.project;
      path.dataset.tech = edge.tech;
      mapLines.append(path);
    });
    renderMapState();
  }
  function renderMapState() {
    setNodeState();
    if (!mapStatus) return;
    const edges = mapLines ? [...mapLines.querySelectorAll(".map-link")] : [];
    edges.forEach((edge) => {
      const active = !selectedNode || edge.dataset.project === selectedNode || edge.dataset.tech === selectedNode;
      edge.classList.toggle("is-active", Boolean(selectedNode && active));
      edge.classList.toggle("is-muted", Boolean(selectedNode && !active));
    });
    if (!selectedNode) {
      mapStatus.textContent = projectData.length + " projects · " + edges.length + " published technology links";
      return;
    }
    const techButton = technologyNodes.find((node) => node.dataset.node === selectedNode);
    if (techButton) {
      const matches = projectData.filter((project) => project.technologies.includes(selectedNode));
      mapStatus.textContent = techButton.textContent.trim() + " · " + matches.length + (matches.length === 1 ? " related project" : " related projects");
    } else {
      const project = projectData.find((item) => item.slug === selectedNode);
      mapStatus.textContent = project ? project.name + " · dossier selected" : "Map selection";
    }
  }
  function drawMap() {
    if (!mapCanvas || mapPanel?.hidden || window.matchMedia("(max-width: 520px)").matches) return;
    renderMapLines();
  }
  if (window.ResizeObserver && mapCanvas) new ResizeObserver(drawMap).observe(mapCanvas);
  window.addEventListener("resize", drawMap, { passive: true });
  requestAnimationFrame(drawMap);

  const dossierDialog = document.querySelector("#dossier-dialog");
  const dossierTitle = document.querySelector("#dossier-title");
  function openDossier(project) {
    if (!project || !dossierDialog) return;
    dossierTitle.textContent = project.name;
    document.querySelector("#dossier-type").textContent = "PROJECT DOSSIER / " + project.status.toUpperCase();
    document.querySelector("#dossier-description").textContent = project.description;
    document.querySelector("#dossier-purpose").textContent = project.purpose || "Project details as described in the public repository and portfolio.";
    document.querySelector("#dossier-stack").textContent = project.stack || "No technology list published.";
    document.querySelector("#dossier-status").textContent = project.status;
    const links = document.querySelector("#dossier-links");
    links.replaceChildren();
    const source = project.element.querySelector('.project-actions a[href]');
    if (source) {
      const anchor = document.createElement("a");
      anchor.href = source.href;
      anchor.textContent = source.textContent.trim();
      if (source.target === "_blank") { anchor.target = "_blank"; anchor.rel = "noopener noreferrer"; }
      links.append(anchor);
    }
    project.element.querySelectorAll(".project-actions a").forEach((original) => {
      if (original === source) return;
      const anchor = document.createElement("a");
      anchor.href = original.href;
      anchor.textContent = original.textContent.trim();
      if (original.target === "_blank") { anchor.target = "_blank"; anchor.rel = "noopener noreferrer"; }
      links.append(anchor);
    });
    openDialog(dossierDialog, dossierTitle);
  }
  document.querySelector("#dossier-close")?.addEventListener("click", () => closeDialog(dossierDialog));
  dossierDialog?.addEventListener("click", (event) => { if (event.target === dossierDialog) closeDialog(dossierDialog); });
  dossierDialog?.addEventListener("close", () => {
    const focused = document.activeElement;
    if (!focused || focused === document.body) document.querySelector("#projects-title")?.focus();
  });

  function applyProjectFilter(tech) {
    currentFilter = tech || "";
    let visible = 0;
    projectData.forEach((project) => {
      const show = !currentFilter || project.technologies.includes(currentFilter);
      project.element.hidden = !show;
      if (show) visible += 1;
    });
    if (filterEmpty) filterEmpty.hidden = visible > 0;
    if (mapStatus && currentFilter) {
      const node = technologyNodes.find((item) => item.dataset.node === currentFilter);
      if (node) mapStatus.textContent = node.textContent.trim() + " · " + visible + (visible === 1 ? " related project" : " related projects");
    }
  }
  function selectMapNode(node) {
    const key = node.dataset.node;
    const kind = node.dataset.kind;
    if (kind === "project") {
      selectedNode = key;
      applyProjectFilter("");
      renderMapState();
      openDossier(projectData.find((project) => project.slug === key));
      return;
    }
    selectedNode = selectedNode === key ? "" : key;
    applyProjectFilter(selectedNode ? key : "");
    renderMapState();
  }
  allMapNodes.forEach((node) => node.addEventListener("click", () => selectMapNode(node)));
  document.querySelector("#map-reset")?.addEventListener("click", () => {
    selectedNode = "";
    applyProjectFilter("");
    renderMapState();
  });
  filterReset?.addEventListener("click", () => {
    selectedNode = "";
    applyProjectFilter("");
    renderMapState();
  });
  document.addEventListener("keydown", (event) => {
    const node = event.target.closest?.(".map-node");
    if (!node || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
    const nodes = [...node.parentElement.querySelectorAll(".map-node")];
    const rect = node.getBoundingClientRect();
    const origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const vectors = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
    const [dx, dy] = vectors[event.key];
    const candidate = nodes.filter((item) => item !== node).map((item) => {
      const r = item.getBoundingClientRect();
      const x = r.left + r.width / 2 - origin.x;
      const y = r.top + r.height / 2 - origin.y;
      const forward = x * dx + y * dy;
      const side = Math.abs(x * dy - y * dx);
      return { item, forward, score: forward > 0 ? forward + side * 1.5 : Infinity };
    }).sort((a, b) => a.score - b.score)[0];
    if (candidate && Number.isFinite(candidate.score)) {
      event.preventDefault();
      candidate.item.focus();
    }
  });

  projectRows.forEach((row) => row.querySelector(".dossier-open")?.addEventListener("click", () => {
    const project = projectData.find((item) => item.element === row);
    selectedNode = project?.slug || "";
    renderMapState();
    openDossier(project);
  }));

  const terminalDialog = document.querySelector("#terminal-dialog");
  const terminalInput = document.querySelector("#terminal-input");
  const terminalOutput = document.querySelector("#terminal-output");
  const terminalSuggestion = document.querySelector("#terminal-suggestion");
  const terminalCommands = ["help", "about", "whoami", "skills", "projects", "project", "education", "contact", "resume", "theme", "settings", "history", "clear", "exit"];
  const commandHistory = [];
  let historyIndex = 0;
  let historyDraft = "";
  function appendOutput(text, className) {
    const line = document.createElement("p");
    line.className = className || "terminal-result";
    line.textContent = text;
    terminalOutput.append(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
    return line;
  }
  function appendCommand(command) {
    const line = document.createElement("p");
    line.className = "terminal-command-line";
    const prompt = document.createElement("span");
    prompt.className = "command-prompt";
    prompt.textContent = "vikash@portfolio:~$ ";
    line.append(prompt, document.createTextNode(command));
    terminalOutput.append(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }
  function normalized(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g, ""); }
  function appendProject(project) {
    appendOutput(project.name + " — " + project.description);
    const line = document.createElement("p");
    line.className = "terminal-result";
    const link = project.element.querySelector(".project-actions a[href]");
    if (link) {
      const anchor = document.createElement("a");
      anchor.href = link.href;
      anchor.textContent = link.textContent.trim();
      if (link.target === "_blank") { anchor.target = "_blank"; anchor.rel = "noopener noreferrer"; }
      line.append(anchor);
      terminalOutput.append(line);
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }
  }
  function openSettings(returnFocus) {
    if (!settingsDialog) return;
    settingsReturnFocus = returnFocus || document.activeElement || settingsOpen;
    syncSettingsControls();
    openDialog(settingsDialog, themeSelect);
  }
  function appendContact() {
    const line = document.createElement("p");
    line.className = "terminal-result";
    line.append(document.createTextNode("Email: "));
    const email = document.createElement("a");
    email.href = "mailto:vikash.e404@gmail.com";
    email.textContent = "vikash.e404@gmail.com";
    line.append(email, document.createTextNode("  |  "));
    const github = document.createElement("a");
    github.href = "https://github.com/Vikash-mn";
    github.target = "_blank";
    github.rel = "noopener noreferrer";
    github.textContent = "GitHub";
    line.append(github, document.createTextNode("  |  "));
    const linkedin = document.createElement("a");
    linkedin.href = "https://linkedin.com/in/Vikash-mn";
    linkedin.target = "_blank";
    linkedin.rel = "noopener noreferrer";
    linkedin.textContent = "LinkedIn";
    line.append(linkedin);
    terminalOutput.append(line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }
  function runCommand(rawCommand) {
    const command = rawCommand.trim();
    if (!command) return;
    commandHistory.push(command);
    historyIndex = commandHistory.length;
    historyDraft = "";
    appendCommand(command);
    const parts = command.split(/\s+/);
    const verb = parts.shift().toLowerCase();
    const argument = parts.join(" ").trim();
    switch (verb) {
      case "help":
        appendOutput("Commands: help, about, whoami, skills, projects, project <name>, education, contact, resume, theme [system|light|dark], settings, history, clear, exit");
        appendOutput("Commands run locally in this portfolio; no operating-system shell is available.");
        break;
      case "about":
      case "whoami":
        appendOutput("Vikash builds across Python applications, browser interfaces, and security tooling. Education details are not published here.");
        break;
      case "skills":
        appendOutput("Application: Python, FastAPI, Pydantic, Uvicorn. Data: MySQL. Browser: HTML, CSS, JavaScript. Tools: Docker, command-line workflows.");
        break;
      case "projects":
        projectData.forEach((project) => appendOutput(project.name + " — " + project.description));
        appendOutput("Use project <name> to show a source link and summary.");
        break;
      case "project": {
        if (!argument) { appendOutput("Usage: project <name>. Try Webscan, Questionspaper, or Portfolio."); break; }
        const query = normalized(argument);
        const project = projectData.find((item) => normalized(item.slug) === query || normalized(item.name) === query || normalized(item.name).includes(query));
        if (project) appendProject(project);
        else appendOutput("No project matched \"" + argument + "\". Try Webscan, Questionspaper, or Portfolio.");
        break;
      }
      case "education":
        appendOutput("Education details have not been published on this portfolio.");
        break;
      case "contact":
        appendContact();
        break;
      case "resume":
        appendOutput("No resume file is published here. Contact links are available with the contact command.");
        break;
      case "theme":
        if (!argument) appendOutput("Theme: " + currentThemeLabel() + "; accent: " + preferences.accent + ". Use theme system, theme light, or theme dark.");
        else if (allowed.theme.includes(argument.toLowerCase())) {
          updatePreference("theme", argument.toLowerCase());
          appendOutput("Theme set to " + currentThemeLabel() + ".");
        } else appendOutput("Usage: theme [system|light|dark].");
        break;
      case "settings":
        appendOutput("Opening appearance settings.");
        openSettings(document.activeElement);
        break;
      case "history":
        commandHistory.forEach((entry, index) => appendOutput(String(index + 1).padStart(2, "0") + "  " + entry));
        break;
      case "clear":
        terminalOutput.replaceChildren();
        break;
      case "exit":
        closeDialog(terminalDialog);
        break;
      default:
        appendOutput("Command not found: " + verb + ". Type help to see available commands.");
    }
    terminalInput.value = "";
    terminalSuggestion.textContent = "";
  }
  document.querySelector("#terminal-open")?.addEventListener("click", () => openDialog(terminalDialog, terminalInput));
  document.querySelector("#terminal-close")?.addEventListener("click", () => closeDialog(terminalDialog));
  terminalDialog?.addEventListener("close", () => document.querySelector("#terminal-open")?.focus());
  terminalDialog?.addEventListener("click", (event) => { if (event.target === terminalDialog) closeDialog(terminalDialog); });
  document.querySelector("#terminal-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    runCommand(terminalInput.value);
    if (terminalDialog?.open && !settingsDialog?.open) terminalInput.focus();
  });
  terminalInput?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (historyIndex === commandHistory.length) historyDraft = terminalInput.value;
      if (historyIndex > 0) historyIndex -= 1;
      terminalInput.value = commandHistory[historyIndex] || historyDraft;
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      if (historyIndex < commandHistory.length) historyIndex += 1;
      terminalInput.value = historyIndex === commandHistory.length ? historyDraft : commandHistory[historyIndex];
    } else if (event.key === "Tab") {
      const prefix = terminalInput.value.trim().toLowerCase();
      if (!prefix || prefix.includes(" ")) return;
      const matches = terminalCommands.filter((item) => item.startsWith(prefix));
      if (matches.length === 1) {
        event.preventDefault();
        terminalInput.value = matches[0] + (["project", "theme"].includes(matches[0]) ? " " : "");
        terminalSuggestion.textContent = "";
      } else if (matches.length > 1) {
        event.preventDefault();
        terminalSuggestion.textContent = "Matches: " + matches.join("  |  ");
      }
    }
  });
  terminalInput?.addEventListener("input", () => {
    const prefix = terminalInput.value.trim().toLowerCase();
    const matches = prefix && !prefix.includes(" ") && !terminalCommands.includes(prefix)
      ? terminalCommands.filter((item) => item.startsWith(prefix)) : [];
    terminalSuggestion.textContent = matches.length ? "Complete: " + matches.join("  |  ") : "";
  });

  const menuToggle = document.querySelector("#menu-toggle");
  const siteNav = document.querySelector("#site-nav");
  function setMenuOpen(open) {
    if (!menuToggle || !siteNav) return;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    if (open) siteNav.dataset.open = "true";
    else delete siteNav.dataset.open;
  }
  menuToggle?.addEventListener("click", () => setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true"));
  siteNav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenuOpen(false)));
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") setMenuOpen(false); });

  document.querySelectorAll(".project-actions a[href]").forEach((link) => {
    if (link.target === "_blank") link.rel = "noopener noreferrer";
  });
  document.querySelector("#contact-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();
    if (!name || !email || !message) return;
    const subject = encodeURIComponent("Portfolio message from " + name);
    const bodyText = encodeURIComponent("Name: " + name + "\nEmail: " + email + "\n\n" + message);
    document.querySelector("#contact-status").textContent = "Opening your email application. If it does not open, use the email link above.";
    window.location.href = "mailto:vikash.e404@gmail.com?subject=" + subject + "&body=" + bodyText;
  });

  if ("serviceWorker" in navigator && /^https?:$/.test(window.location.protocol)) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
})();
