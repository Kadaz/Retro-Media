# Retro Hub — PS5 Browser Edition

This version is designed for GitHub Pages and **does not have a PC ROM file picker**.

## Automatic ROM detection

The page reads the public GitHub repository tree automatically through the GitHub API. You do not edit `games.json` and you do not register games manually.

Put ROMs here:

- `roms/nes/` → `.nes`, `.fds`, `.unif`, `.unf`
- `roms/snes/` → `.sfc`, `.smc`, `.fig`, `.swc`, `.bsx`
- `roms/gb/` → `.gb`
- `roms/gbc/` → `.gbc`
- `roms/gba/` → `.gba`

Subfolders inside those folders are also detected.

Example:

```text
roms/
  nes/
    game.nes
  snes/
    game.sfc
  gb/
    game.gb
  gbc/
    game.gbc
  gba/
    game.gba
```

After pushing a ROM to GitHub, refresh the GitHub Pages site. The game appears automatically.

## Emulator

The page uses the stable EmulatorJS distribution from the official EmulatorJS CDN at runtime. The emulator is started with the correct core for each system:

- NES → Nestopia
- SNES → Snes9x
- Game Boy → Gambatte
- Game Boy Color → Gambatte
- Game Boy Advance → mGBA

No PC file input is used anywhere in the project.

## GitHub Pages requirement

The site must be opened from its normal GitHub Pages `*.github.io` address so the page can determine the GitHub owner and repository automatically.

## ROM rights

Only use ROMs you are legally entitled to use and distribute.
