const SYSTEMS = {
  nes: {
    name: "NES",
    core: "nestopia",
    extensions: [".nes", ".fds", ".unif", ".unf"]
  },

  snes: {
    name: "SNES",
    core: "snes9x",
    extensions: [".sfc", ".smc", ".fig", ".swc", ".bsx"]
  },

  gb: {
    name: "Game Boy",
    core: "gambatte",
    extensions: [".gb"]
  },

  gbc: {
    name: "Game Boy Color",
    core: "gambatte",
    extensions: [".gbc"]
  },

  gba: {
    name: "Game Boy Advance",
    core: "mgba",
    extensions: [".gba"]
  }
};


/*
============================================================
REPOSITORY
============================================================
*/

const REPOSITORY = {
  owner: "Kadaz",
  repo: "Retro-Media",
  branch: "main"
};


const gamesBySystem = {
  nes: [],
  snes: [],
  gb: [],
  gbc: [],
  gba: []
};


/*
============================================================
ELEMENTS
============================================================
*/

const systemSelect =
  document.getElementById("system");

const gameSelect =
  document.getElementById("game-select");

const launchButton =
  document.getElementById("launch");

const resetButton =
  document.getElementById("reset");

const status =
  document.getElementById("status");

const gameContainer =
  document.getElementById("game");


/*
============================================================
PS5 DETECTION
============================================================
*/

function isPS5Browser() {

  const ua =
    navigator.userAgent.toLowerCase();

  return (
    ua.includes("playstation 5") ||
    ua.includes("playstation") ||
    ua.includes("ps5")
  );
}


const PS5_MODE = isPS5Browser();


/*
============================================================
SOCIAL LINKS
============================================================
*/

const social = [
  ["YouTube", "https://www.youtube.com/@Tolis_TMG"],
  ["Facebook", "https://www.facebook.com/"],
  ["Instagram", "https://www.instagram.com/"],
  ["TikTok", "https://www.tiktok.com/"],
  ["X / Twitter", "https://x.com/"],
  ["Discord", "https://discord.com/"]
];


const socialGrid =
  document.getElementById("socialGrid");


if (socialGrid) {

  social.forEach(([name, url]) => {

    const a =
      document.createElement("a");

    a.className =
      "social-card";

    a.target =
      "_blank";

    a.rel =
      "noopener";

    a.href =
      url;

    a.innerHTML =
      `${name}<small>Open on PS5</small>`;

    socialGrid.appendChild(a);

  });

}


/*
============================================================
ROM SYSTEM DETECTION
============================================================
*/

function systemForPath(path) {

  const lower =
    path
      .toLowerCase()
      .split("?")[0]
      .split("#")[0];

  for (
    const [key, system]
    of Object.entries(SYSTEMS)
  ) {

    if (
      system.extensions.some(
        ext => lower.endsWith(ext)
      )
    ) {

      return key;

    }

  }

  return null;
}


/*
============================================================
ROM TITLE
============================================================
*/

function titleFromPath(path) {

  const file =
    path.split("/").pop() || path;

  return file
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .trim();
}


/*
============================================================
ADD ROM
============================================================
*/

function addGame(system, path) {

  const rawUrl =
    `https://raw.githubusercontent.com/` +
    `${REPOSITORY.owner}/` +
    `${REPOSITORY.repo}/` +
    `${REPOSITORY.branch}/` +
    path
      .split("/")
      .map(encodeURIComponent)
      .join("/");

  gamesBySystem[system].push({

    title:
      titleFromPath(path),

    url:
      rawUrl,

    path:
      path

  });

}


/*
============================================================
REFRESH GAME LIST
============================================================
*/

function refreshGames() {

  const system =
    systemSelect.value;

  const list =
    gamesBySystem[system] || [];

  gameSelect.innerHTML = "";

  const first =
    document.createElement("option");

  first.value = "";

  first.textContent =
    list.length
      ? `Choose a ${SYSTEMS[system].name} game…`
      : "No ROMs found";

  gameSelect.appendChild(first);


  list.sort(
    (a, b) =>
      a.title.localeCompare(
        b.title,
        undefined,
        {
          numeric: true,
          sensitivity: "base"
        }
      )
  );


  for (const game of list) {

    const option =
      document.createElement("option");

    option.value =
      game.url;

    option.textContent =
      game.title;

    gameSelect.appendChild(option);

  }


  launchButton.disabled =
    list.length === 0;

}


/*
============================================================
SCAN GITHUB REPOSITORY
============================================================
*/

async function scanRepository() {

  status.textContent =
    `Scanning ${REPOSITORY.owner}/${REPOSITORY.repo}/roms/…`;


  /*
  ------------------------------------------------------------
  PRIMARY: jsDelivr manifest
  ------------------------------------------------------------
  */

  const manifestUrl =
    `https://data.jsdelivr.com/v1/package/gh/` +
    `${REPOSITORY.owner}/` +
    `${REPOSITORY.repo}@` +
    `${REPOSITORY.branch}/flat`;


  try {

    const response =
      await fetch(
        manifestUrl,
        {
          cache: "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        `Manifest request failed (${response.status})`
      );

    }


    const data =
      await response.json();


    if (!Array.isArray(data.files)) {

      throw new Error(
        "Invalid ROM manifest."
      );

    }


    for (const item of data.files) {

      const path =
        (item.name || "")
          .replace(/^\/+/, "");


      if (
        !/^roms\//i.test(path)
      ) {
        continue;
      }


      if (
        item.type === "directory"
      ) {
        continue;
      }


      const system =
        systemForPath(path);


      if (!system) {
        continue;
      }


      addGame(
        system,
        path
      );

    }


    if (
      Object.values(gamesBySystem)
        .some(list => list.length > 0)
    ) {

      refreshGames();

      const total =
        Object.values(gamesBySystem)
          .reduce(
            (n, list) =>
              n + list.length,
            0
          );

      status.textContent =
        `${total} ROM${total === 1 ? "" : "s"} found automatically.`;

      return;

    }

  } catch (error) {

    console.warn(
      "jsDelivr ROM scan failed:",
      error
    );

  }


  /*
  ------------------------------------------------------------
  FALLBACK: GITHUB TREE API
  ------------------------------------------------------------
  */

  try {

    const treeUrl =
      `https://api.github.com/repos/` +
      `${REPOSITORY.owner}/` +
      `${REPOSITORY.repo}/git/trees/` +
      `${REPOSITORY.branch}?recursive=1`;


    const response =
      await fetch(
        treeUrl,
        {
          cache: "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        `GitHub tree request failed (${response.status})`
      );

    }


    const data =
      await response.json();


    if (!Array.isArray(data.tree)) {

      throw new Error(
        "Invalid GitHub tree."
      );

    }


    for (const item of data.tree) {

      const path =
        item.path || "";


      if (
        !/^roms\//i.test(path)
      ) {
        continue;
      }


      if (
        item.type !== "blob"
      ) {
        continue;
      }


      const system =
        systemForPath(path);


      if (!system) {
        continue;
      }


      addGame(
        system,
        path
      );

    }


    refreshGames();


    const total =
      Object.values(gamesBySystem)
        .reduce(
          (n, list) =>
            n + list.length,
          0
        );


    status.textContent =
      total
        ? `${total} ROM${total === 1 ? "" : "s"} found automatically.`
        : "No compatible ROMs found under roms/";


  } catch (error) {

    console.error(
      "ROM scan failed:",
      error
    );


    refreshGames();


    status.textContent =
      `ROM scan error: ${error.message}`;

  }

}


/*
============================================================
STOP CURRENT EMULATOR
============================================================
*/

function stopCurrentEmulator() {

  try {

    if (
      typeof window.EJS_terminate ===
      "function"
    ) {

      window.EJS_terminate();

    }

  } catch (_) {}


  document
    .querySelectorAll(
      "#emulatorjs-loader"
    )
    .forEach(
      el => el.remove()
    );


  gameContainer.innerHTML =
    "";


  delete window.EJS_player;
  delete window.EJS_gameUrl;
  delete window.EJS_gameName;
  delete window.EJS_core;
  delete window.EJS_pathtodata;
  delete window.EJS_startOnLoaded;
  delete window.EJS_mouse;
  delete window.EJS_multitap;
  delete window.EJS_askBeforeExit;
  delete window.EJS_threads;
  delete window.EJS_forceLegacyCores;
  delete window.EJS_browserMode;
  delete window.EJS_noAutoFocus;
  delete window.EJS_disableLocalStorage;

}


/*
============================================================
BROWSER CAPABILITY CHECK
============================================================
*/

function checkBrowserCapabilities() {

  const wasm =
    typeof WebAssembly !==
    "undefined";


  const canvas =
    document.createElement("canvas");


  const webgl1 =
    !!canvas.getContext(
      "webgl"
    );


  const webgl2 =
    !!canvas.getContext(
      "webgl2"
    );


  return {
    wasm,
    webgl1,
    webgl2
  };

}


/*
============================================================
LOAD EMULATOR
============================================================
*/

function loadEmulator(url) {

  const system =
    systemSelect.value;

  const config =
    SYSTEMS[system];


  if (!url) {
    return;
  }


  /*
  ------------------------------------------------------------
  STOP PREVIOUS INSTANCE
  ------------------------------------------------------------
  */

  stopCurrentEmulator();


  /*
  ------------------------------------------------------------
  BROWSER TEST
  ------------------------------------------------------------
  */

  const capabilities =
    checkBrowserCapabilities();


  if (!capabilities.wasm) {

    status.textContent =
      "This browser does not support WebAssembly.";

    return;

  }


  if (!capabilities.webgl1) {

    status.textContent =
      "This browser does not support WebGL.";

    return;

  }


  /*
  ------------------------------------------------------------
  START MESSAGE
  ------------------------------------------------------------
  */

  status.textContent =
    PS5_MODE
      ? `Starting ${config.name} in PS5 compatibility mode…`
      : `Starting ${config.name} emulator…`;


  /*
  ------------------------------------------------------------
  EMULATORJS CONFIGURATION
  ------------------------------------------------------------
  */


  window.EJS_player =
    "#game";


  window.EJS_gameUrl =
    url;


  window.EJS_gameName =
    gameSelect
      .options[
        gameSelect.selectedIndex
      ]
      .textContent;


  window.EJS_core =
    config.core;


  /*
  Official EmulatorJS data path.
  */

  window.EJS_pathtodata =
    "https://cdn.emulatorjs.org/stable/data/";


  /*
  IMPORTANT:
  Do NOT automatically start the emulator.

  EmulatorJS documentation warns that automatic startup
  without user interaction can freeze the emulator.
  */

  window.EJS_startOnLoaded =
    false;


  /*
  Disable threads.

  Threads require SharedArrayBuffer and COOP/COEP headers.
  GitHub Pages does not give us those headers in this setup.
  */

  window.EJS_threads =
    false;


  /*
  Force WebGL 1 on PS5.

  This is an official EmulatorJS option.
  */

  window.EJS_forceLegacyCores =
    PS5_MODE;


  /*
  Use desktop UI on PS5.
  */

  window.EJS_browserMode =
    PS5_MODE
      ? "desktop"
      : undefined;


  /*
  Do not automatically focus the emulator.
  */

  window.EJS_noAutoFocus =
    PS5_MODE;


  /*
  Avoid localStorage dependency on PS5.
  */

  window.EJS_disableLocalStorage =
    PS5_MODE;


  window.EJS_mouse =
    false;


  window.EJS_multitap =
    false;


  window.EJS_askBeforeExit =
    false;


  /*
  ------------------------------------------------------------
  LOAD EMULATORJS
  ------------------------------------------------------------
  */

  const script =
    document.createElement("script");


  script.id =
    "emulatorjs-loader";


  script.src =
    "https://cdn.emulatorjs.org/stable/data/loader.js";


  script.onload =
    () => {

      status.textContent =
        `${config.name} emulator loaded.`;

    };


  script.onerror =
    () => {

      status.textContent =
        "EmulatorJS could not be loaded. " +
        "The browser may be blocking the emulator.";

    };


  document.body.appendChild(
    script
  );

}


/*
============================================================
SYSTEM CHANGE
============================================================
*/

systemSelect.addEventListener(
  "change",
  () => {

    stopCurrentEmulator();

    refreshGames();

  }
);


/*
============================================================
GAME CHANGE
============================================================
*/

gameSelect.addEventListener(
  "change",
  () => {

    launchButton.disabled =
      !gameSelect.value;

  }
);


/*
============================================================
LAUNCH
============================================================
*/

launchButton.addEventListener(
  "click",
  () => {

    loadEmulator(
      gameSelect.value
    );

  }
);


/*
============================================================
RESET
============================================================
*/

resetButton.addEventListener(
  "click",
  () => {

    stopCurrentEmulator();

    status.textContent =
      "Emulator reset.";

  }
);


/*
============================================================
INITIALIZE
============================================================
*/

refreshGames();

scanRepository();
