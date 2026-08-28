const SYSTEMS = {
  nes: { name: "NES", core: "nestopia", extensions: [".nes", ".fds", ".unif", ".unf"] },
  snes: { name: "SNES", core: "snes9x", extensions: [".sfc", ".smc", ".fig", ".swc", ".bsx"] },
  gb: { name: "Game Boy", core: "gambatte", extensions: [".gb"] },
  gbc: { name: "Game Boy Color", core: "gambatte", extensions: [".gbc"] },
  gba: { name: "Game Boy Advance", core: "mgba", extensions: [".gba"] }
};

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

// This project is for Kadaz/New-Test. The fallback also makes the scanner
// work while testing locally or on a non-github.io custom Pages domain.
const FALLBACK_REPOSITORY = { owner: "Kadaz", repo: "New-Test" };

function detectRepository() {
  const host = location.hostname.toLowerCase();
  const parts = location.pathname.split("/").filter(Boolean);

  if (host.endsWith(".github.io")) {
    const owner = host.split(".")[0];
    const repo = parts.length ? parts[0] : `${owner}.github.io`;
    return { owner, repo };
  }

  return FALLBACK_REPOSITORY;
}

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

function addGame(system, path, rawBase) {
  const url = `${rawBase}/${path.split("/").map(encodeURIComponent).join("/")}`;
  gamesBySystem[system].push({ title: titleFromPath(path), url, path });
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

async function scanGitHubRepository() {
  const repo = detectRepository();
  status.textContent = `Scanning ${repo.owner}/${repo.repo}/roms/…`;

  const repoUrl = `https://api.github.com/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}`;
  const repoResponse = await fetch(repoUrl, { cache: "no-store" });
  if (!repoResponse.ok) throw new Error(`GitHub repository request failed (${repoResponse.status}).`);

  const repoInfo = await repoResponse.json();
  const branch = repoInfo.default_branch || "main";
  const treeUrl = `https://api.github.com/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
  const treeResponse = await fetch(treeUrl, { cache: "no-store" });
  if (!treeResponse.ok) throw new Error(`GitHub ROM scan failed (${treeResponse.status}).`);

  const tree = await treeResponse.json();
  if (!Array.isArray(tree.tree)) throw new Error("GitHub did not return a repository tree.");

  const rawBase = `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${branch}`;

  // Accept BOTH layouts:
  // roms/gba/game.gba
  // roms/game.gba
  // The system is determined from the ROM extension, so no manual JSON is needed.
  for (const item of tree.tree) {
    if (item.type !== "blob") continue;

    const path = item.path.replace(/^\.\//, "");
    if (!/^roms\//i.test(path)) continue;

    const system = systemForPath(path);
    if (!system) continue;

    addGame(system, path, rawBase);
  }

  for (const list of Object.values(gamesBySystem)) {
    const seen = new Set();
    for (let i = list.length - 1; i >= 0; i--) {
      if (seen.has(list[i].path)) list.splice(i, 1);
      else seen.add(list[i].path);
    }
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
  delete window.EJS_core;
  delete window.EJS_pathtodata;
  delete window.EJS_startOnLoaded;
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
  script.onload = () => {
    status.textContent = `${config.name} emulator loaded.`;
  };
  script.onerror = () => {
    status.textContent = "EmulatorJS could not be loaded. Check the network connection and refresh the page.";
  };
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
scanGitHubRepository().catch(error => {
  console.error(error);
  refreshGames();
  status.textContent = `ROM scan error: ${error.message}`;
});
