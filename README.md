# Retro Hub — PS5 Browser Edition

A static GitHub Pages shell designed for the PS5 browser.

## What this is

The project uses EmulatorJS as the emulation layer. EmulatorJS supports NES, SNES, Game Boy, Game Boy Color and Game Boy Advance in the browser. Its core/data files are intended to be self-hosted, so the deployed site does not need to fetch emulator cores from a third-party CDN at runtime.

The included GitHub Actions workflow downloads the upstream EmulatorJS distribution during the Pages build and places it under `vendor/emulatorjs/`. This keeps the runtime self-contained while avoiding a huge binary bundle in the source repository.

## ROMs

Do not put copyrighted ROMs in this repository unless you have the rights to distribute them. Add your own legally obtained ROMs under `roms/` and list them in `games.json`.

Example:
```json
{
  "nes": [{"title":"My Game","url":"roms/mygame.nes"}],
  "snes": [],
  "gb": [],
  "gba": []
}
```

## GitHub Pages

Enable GitHub Pages using **GitHub Actions**. The workflow builds the static site and downloads the required EmulatorJS files into the final Pages artifact.

## Important PS5 note

The PS5 browser is not a normal desktop Chromium target and can be stricter about WebAssembly, audio and controller APIs. The page therefore stays deliberately simple: no framework, no ads, no analytics, no external runtime CDN, and no unnecessary UI.

## Social links

Edit the `social` array in `app.js` with your real profiles. The example links are placeholders except for the YouTube channel.

## Licensing

EmulatorJS and its cores have their own licenses. Keep the upstream license/notice files shipped by the workflow. This project does not include commercial ROMs.
