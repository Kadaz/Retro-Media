const SYSTEMS = {
  nes: { name: "NES", core: "nestopia", extensions: [".nes", ".fds", ".unif", ".unf"] },
  snes: { name: "SNES", core: "snes9x", extensions: [".sfc", ".smc", ".fig", ".swc", ".bsx"] },
  gb: { name: "Game Boy", core: "gambatte", extensions: [".gb"] },
  gbc: { name: "Game Boy Color", core: "gambatte", extensions: [".gbc"] },
  gba: { name: "Game Boy Advance", core: "mgba", extensions: [".gba"] }
};

const REPOSITORY = { owner: "Kadaz", repo: "New-Test", branch: "main" };
const gamesBySystem = { nes: [], snes: [], gb: [], gbc: [], gba: [] };

const systemSelect = document.getElementById("system");
const gameSelect = document.getElementById("game-select");
const launchButton = document.getElementById("launch");
const resetButton = document.getElementById("reset");
const status = document.getElementById("status");
const gameContainer = document.getElementById("game");

const social = [
  ["YouTube", "https://www.youtube.com/@Tolis_TMG"],
  ["Facebook", "https://www.facebook.com/"],
  ["Instagram", "https://www.instagram.com/"],
  ["TikTok", "https://www.tiktok.com/"],
  ["X / Twitter", "https://x.com/"],
  ["Discord", "https://discord.com/"]
];

social.forEach(([name, url]) => {
  const a = document.createElement("a");
  a.className = "social-card";
  a.target = "_blank";
  a.rel = "noopener";
  a.href = url;
  a.innerHTML = `${name}<small>Open on PS5</small>`;
  document.getElementById("socialGrid").appendChild(a);
});

function systemForPath(path) {
  const lower = path.toLowerCase().split("?")[0].split("#")[0];
  for (const [key, system] of Object.entries(SYSTEMS)) {
    if (system.extensions.some(ext => lower.endsWith(ext))) return key;
  }
  return null;
}

function titleFromPath(path) {
  const file = path.split("/").pop() || path;
  return file.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
}

function addGame(system, path) {
  const rawUrl = `https://raw.githubusercontent.com/${REPOSITORY.owner}/${REPOSITORY.repo}/${REPOSITORY.branch}/${path.split("/").map(encodeURIComponent).join("/")}`;
  gamesBySystem[system].push({ title: titleFromPath(path), url: rawUrl, path });
}

function refreshGames() {
  const system = systemSelect.value;
  const list = gamesBySystem[system] || [];
  gameSelect.innerHTML = "";

  const first = document.createElement("option");
  first.value = "";
  first.textContent = list.length ? `Choose a ${SYSTEMS[system].name} game…` : "No ROMs found";
  gameSelect.appendChild(first);

  list.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: "base" }));
  for (const game of list) {
    const option = document.createElement("option");
    option.value = game.url;
    option.textContent = game.title;
    gameSelect.appendChild(option);
  }
  launchButton.disabled = list.length === 0;
}

async function scanRepository() {
  // jsDelivr provides a public file manifest for public GitHub repositories.
  // This avoids GitHub API rate limits and works from a normal GitHub Pages browser.
  const manifestUrl = `https://data.jsdelivr.com/v1/package/gh/${REPOSITORY.owner}/${REPOSITORY.repo}@${REPOSITORY.branch}/flat`;
  status.textContent = `Scanning ${REPOSITORY.owner}/${REPOSITORY.repo}/roms/…`;

  const response = await fetch(manifestUrl, { cache: "no-store" });
  if (!response.ok) throw new Error(`ROM manifest request failed (${response.status}).`);
  const data = await response.json();
  if (!Array.isArray(data.files)) throw new Error("The ROM manifest is invalid.");

  for (const item of data.files) {
    const path = (item.name || "").replace(/^\/+/, "");
    if (!/^roms\//i.test(path)) continue;
    if (!item.name || item.type === "directory") continue;

    const system = systemForPath(path);
    if (!system) continue;
    addGame(system, path);
  }

  refreshGames();
  const total = Object.values(gamesBySystem).reduce((n, list) => n + list.length, 0);
  status.textContent = total
    ? `${total} ROM${total === 1 ? "" : "s"} found automatically.`
    : "No ROMs found under roms/.";
}

function stopCurrentEmulator() {
  try {
    if (typeof window.EJS_terminate === "function") window.EJS_terminate();
  } catch (_) {}

  document.querySelectorAll("#emulatorjs-loader").forEach(el => el.remove());
  gameContainer.innerHTML = "";
  delete window.EJS_player;
  delete window.EJS_gameUrl;
  delete window.EJS_gameName;
  delete window.EJS_core;
  delete window.EJS_pathtodata;
  delete window.EJS_startOnLoaded;
  delete window.EJS_mouse;
  delete window.EJS_multitap;
  delete window.EJS_askBeforeExit;
}

function loadEmulator(url) {
  const system = systemSelect.value;
  const config = SYSTEMS[system];
  if (!url) return;

  stopCurrentEmulator();
  status.textContent = `Starting ${config.name} emulator…`;

  window.EJS_player = "#game";
  window.EJS_gameUrl = url;
  window.EJS_gameName = gameSelect.options[gameSelect.selectedIndex].textContent;
  window.EJS_core = config.core;
  window.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";
  window.EJS_startOnLoaded = true;
  window.EJS_mouse = false;
  window.EJS_multitap = false;
  window.EJS_askBeforeExit = false;

  const script = document.createElement("script");
  script.id = "emulatorjs-loader";
  script.src = "https://cdn.emulatorjs.org/stable/data/loader.js";
  script.onload = () => { status.textContent = `${config.name} emulator loaded.`; };
  script.onerror = () => { status.textContent = "EmulatorJS could not be loaded. Check the network connection and refresh the page."; };
  document.body.appendChild(script);
}

systemSelect.addEventListener("change", () => {
  stopCurrentEmulator();
  refreshGames();
});

gameSelect.addEventListener("change", () => {
  launchButton.disabled = !gameSelect.value;
});

launchButton.addEventListener("click", () => loadEmulator(gameSelect.value));

resetButton.addEventListener("click", () => {
  stopCurrentEmulator();
  status.textContent = "Emulator reset.";
});

refreshGames();
scanRepository().catch(error => {
  console.error(error);
  refreshGames();
  status.textContent = `ROM scan error: ${error.message}`;
});
