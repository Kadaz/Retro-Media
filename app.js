// RETRO HUB - automatic ROM scanner for GitHub Pages
const gamesBySystem = { nes: [], snes: [], gb: [], gbc: [], gba: [] };

const SYSTEMS = {
  nes:  { name: "NES", core: "nestopia", extensions: [".nes", ".fds", ".unif", ".unf"] },
  snes: { name: "SNES", core: "snes9x", extensions: [".sfc", ".smc", ".fig", ".swc"] },
  gb:   { name: "Game Boy", core: "gambatte", extensions: [".gb"] },
  gbc:  { name: "Game Boy Color", core: "gambatte", extensions: [".gbc"] },
  gba:  { name: "Game Boy Advance", core: "mgba", extensions: [".gba"] }
};

const systemSelect = document.querySelector("#system");
const gameSelect = document.querySelector("#game");
const launchButton = document.querySelector("#launch");
const gameContainer = document.querySelector("#gameContainer");
const status = document.querySelector("#status");
const socialGrid = document.querySelector("#socialGrid");

function setStatus(text) { if (status) status.textContent = text; }

function githubInfo() {
  const host = location.hostname;
  const path = location.pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  if (!host.endsWith(".github.io")) return null;
  const owner = host.split(".")[0];
  const repo = path.length ? path[0] : `${owner}.github.io`;
  return { owner, repo };
}

async function getDirectory(path) {
  const info = githubInfo();
  if (!info) throw new Error("This automatic scanner is designed for GitHub Pages.");
  const api = `https://api.github.com/repos/${encodeURIComponent(info.owner)}/${encodeURIComponent(info.repo)}/contents/${path}`;
  const response = await fetch(api, { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" });
  if (!response.ok) throw new Error(`GitHub API ${response.status}`);
  return response.json();
}

async function scanFolder(systemKey) {
  const system = SYSTEMS[systemKey];
  const root = `roms/${systemKey}`;
  const found = [];

  async function scan(path) {
    const entries = await getDirectory(path);
    for (const entry of entries) {
      if (entry.type === "dir") {
        await scan(entry.path);
      } else if (entry.type === "file") {
        const lower = entry.name.toLowerCase();
        if (system.extensions.some(ext => lower.endsWith(ext))) {
          found.push({ title: entry.name.replace(/\.[^.]+$/, ""), url: entry.download_url });
        }
      }
    }
  }

  try { await scan(root); } catch (e) {
    // A missing folder simply means there are no ROMs for this system.
    if (!String(e.message).includes("GitHub API 404")) console.warn(`Could not scan ${root}:`, e);
  }
  return found.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
}

function refreshGames() {
  gameSelect.innerHTML = '<option value="">Choose a ROM…</option>';
  for (const g of gamesBySystem[systemSelect.value] || []) {
    const option = document.createElement("option");
    option.value = g.url;
    option.textContent = g.title;
    gameSelect.appendChild(option);
  }
  setStatus(`${gamesBySystem[systemSelect.value].length} ROM(s) found.`);
}

async function scanAllROMs() {
  setStatus("Scanning GitHub ROM folders…");
  await Promise.all(Object.keys(SYSTEMS).map(async key => {
    gamesBySystem[key] = await scanFolder(key);
  }));
  refreshGames();
}

systemSelect.addEventListener("change", refreshGames);

async function startEmulator(url) {
  const key = systemSelect.value;
  const system = SYSTEMS[key];
  if (!url) return;

  gameContainer.innerHTML = "";
  document.querySelectorAll("script[data-emulatorjs]").forEach(s => s.remove());

  // EmulatorJS CDN loader. The ROM itself is served from the GitHub repository.
  window.EJS_player = "#gameContainer";
  window.EJS_core = system.core;
  window.EJS_gameUrl = url;
  window.EJS_pathtodata = "https://cdn.emulatorjs.org/stable/data/";
  window.EJS_mouse = false;
  window.EJS_multitap = false;

  setStatus(`Starting ${system.name} emulator…`);

  const script = document.createElement("script");
  script.src = "https://cdn.emulatorjs.org/stable/data/loader.js";
  script.dataset.emulatorjs = "1";
  script.onload = () => setStatus(`${system.name} emulator started.`);
  script.onerror = () => setStatus("Could not load EmulatorJS. Check the PS5 internet connection.");
  document.body.appendChild(script);
}

launchButton.addEventListener("click", () => startEmulator(gameSelect.value));

const social = [
  ["YouTube", "https://www.youtube.com/@Tolis_TMG"],
  ["Facebook", "https://www.facebook.com/"],
  ["Instagram", "https://www.instagram.com/"],
  ["TikTok", "https://www.tiktok.com/"],
  ["X / Twitter", "https://x.com/"],
  ["Discord", "https://discord.com/"]
];
for (const [name, url] of social) {
  const a = document.createElement("a");
  a.className = "social-card"; a.target = "_blank"; a.rel = "noopener"; a.href = url;
  a.innerHTML = `${name}<small>Open on PS5</small>`;
  socialGrid.appendChild(a);
}

scanAllROMs();
