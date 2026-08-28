# Retro Hub

This version is configured specifically for the public GitHub repository `Kadaz/New-Test`.

## Automatic ROM detection

No PC ROM picker and no manual `games.json` editing.

The page automatically scans the public repository manifest and finds every supported ROM anywhere below `roms/`.

Supported systems:
- NES: `.nes`, `.fds`, `.unif`, `.unf`
- SNES: `.sfc`, `.smc`, `.fig`, `.swc`, `.bsx`
- Game Boy: `.gb`
- Game Boy Color: `.gbc`
- Game Boy Advance: `.gba`

Both layouts work:

`roms/game.gb`

and

`roms/gb/game.gb`

The system is detected from the ROM extension.

## Emulator

EmulatorJS is loaded at runtime from its stable distribution. No emulator files are required in the repository.

NES = Nestopia, SNES = Snes9x, GB/GBC = Gambatte, GBA = mGBA.
