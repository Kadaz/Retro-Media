const gamesBySystem = { nes: [], snes: [], gb: [], gbc: [], gba: [] };
const social = [
  ["YouTube", "https://www.youtube.com/@Tolis_TMG"],
  ["Facebook", "https://www.facebook.com/"],
  ["Instagram", "https://www.instagram.com/"],
  ["TikTok", "https://www.tiktok.com/"],
  ["X / Twitter", "https://x.com/"],
  ["Discord", "https://discord.com/"]
];

const system = document.querySelector("#system");
const gameSelect = document.querySelector("#gameSelect");
const launch = document.querySelector("#launch");
const gameContainer = document.querySelector("#game");
const status = document.querySelector("#status");
const localGba = document.querySelector("#localGba");
const localGbaLabel = document.querySelector("#localGbaLabel");

const extensions = {
  nes: [".nes", ".fds", ".unif", ".unf"],
  snes: [".sfc", ".smc", ".fig", ".gd3", ".gd7", ".dx2", ".bsx", ".swc"],
  gb: [".gb"],
  gbc: [".gbc"],
  gba: [".gba"]
};

function refreshGames() {
  gameSelect.innerHTML = '<option value="">Choose a ROM…</option>';
  for (const g of gamesBySystem[system.value] || []) {
    const option = document.createElement("option");
    option.value = g.url;
    option.textContent = g.title;
    gameSelect.appendChild(option);
  }

  const isGba = system.value === "gba";
  localGbaLabel.hidden = !isGba;
  localGba.hidden = !isGba;
  status.textContent = `${gamesBySystem[system.value]?.length || 0} ROM(s) found.`;
}

function getGitHubRepo() {
  const host = location.hostname;
  const parts = location.pathname.split("/").filter(Boolean);
  if (!host.endsWith(".github.io")) return null;

  const owner = host.slice(0, -".github.io".length);
  const repo = parts[0] || `${owner}.github.io`;
  return { owner, repo };
}

async function githubContents(path) {
  const repo = getGitHubRepo();
  if (!repo) throw new Error("This automatic ROM scanner works on GitHub Pages.");

  const url = `https://api.github.com/repos/${encodeURIComponent(repo.owner)}/${encodeURIComponent(repo.repo)}/contents/${path}`;
  const response = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  if (!response.ok) throw new Error(`GitHub API ${response.status}`);
  return response.json();
}

async function scanRomFolder(key) {
  const items = await githubContents(`roms/${key}`);
  if (!Array.isArray(items)) return [];

  return items
    .filter(item => item.type === "file")
    .filter(item => extensions[key].some(ext => item.name.toLowerCase().endsWith(ext)))
    .map(item => ({ title: item.name.replace(/\.[^.]+$/, ""), url: item.download_url }));
}

async function autoScanRoms() {
  status.textContent = "Scanning ROM folders…";

  await Promise.all(Object.keys(gamesBySystem).map(async key => {
    try {
      gamesBySystem[key] = await scanRomFolder(key);
    } catch (_) {
      gamesBySystem[key] = [];
    }
  }));

  refreshGames();
  const total = Object.values(gamesBySystem).reduce((n, list) => n + list.length, 0);
  status.textContent = total
    ? `Automatic scan complete — ${total} ROM(s) found.`
    : "No ROMs found in the roms/ folders.";
}

function startEmulator(url, core) {
  window.EJS_player = "#game";
  window.EJS_core = core;
  window.EJS_gameUrl = url;
  window.EJS_pathtodata = "vendor/emulatorjs/data/";
  window.EJS_mouse = false;
  window.EJS_multitap = false;

  gameContainer.innerHTML = "";
  const old = document.getElementById("emulatorjs-loader");
  if (old) old.remove();

  const script = document.createElement("script");
  script.id = "emulatorjs-loader";
  script.src = "vendor/emulatorjs/data/loader.js";
  script.onload = () => { status.textContent = "Emulator started."; };
  script.onerror = () => { status.textContent = "Could not load EmulatorJS."; };
  document.body.appendChild(script);
}

system.addEventListener("change", refreshGames);

launch.addEventListener("click", () => {
  const url = gameSelect.value;
  if (!url) {
    alert("Choose a game first.");
    return;
  }
  startEmulator(url, system.value);
});

localGba.addEventListener("change", () => {
  const file = localGba.files?.[0];
  if (!file) return;
  if (!file.name.toLowerCase().endsWith(".gba")) {
    alert("Please choose a .gba ROM.");
    localGba.value = "";
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  gameSelect.value = "";
  status.textContent = `Local GBA ROM selected: ${file.name}`;
  startEmulator(objectUrl, "gba");
});

social.forEach(([name, url]) => {
  const a = document.createElement("a");
  a.className = "social-card";
  a.target = "_blank";
  a.rel = "noopener";
  a.href = url;
  a.innerHTML = `${name}<small>Open on PS5</small>`;
  document.querySelector("#socialGrid").appendChild(a);
});

refreshGames();
autoScanRoms();
