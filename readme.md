# 🌧 Matrinks Rain

Transform your terminal into the iconic Matrix digital rain effect. A highly customizable animation built with TypeScript and Chalk.

[![npm version](https://badge.fury.io/js/matrinks-rain.svg)](https://www.npmjs.com/package/matrinks-rain)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Quick Start

Run instantly with npx:
```bash
npx matrinks-rain
```

Or install globally for repeated use:
```bash
npm install -g matrinks-rain
matrix-rain
```

## Features

- 🎨 Multiple color themes (green, blue, purple, rainbow)
- 📝 Various character sets (ASCII, Binary, Braille, Emoji, Katakana)
- ↕️ Vertical and horizontal rain directions
- 🎚️ Adjustable density and speed
- 🌈 Smooth color transitions and fading effects
- ⌨️ Interactive keyboard controls

## Configuration Parameters

Customize your rain effect using these command-line flags:

### `--direction, -d`
- Controls the direction of the rain effect
- Options: `vertical`, `horizontal`
- Default: `vertical`
- Example: `matrix-rain --direction horizontal`

### `--charset, -c`
- Sets the character set used for the rain drops
- Options: `ascii`, `binary`, `braille`, `emoji`, `katakana`
- Default: `ascii`
- Example: `matrix-rain --charset katakana`

### `--color`
- Changes the color of the rain effect
- Options: `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`
- Default: `green`
- Example: `matrix-rain --color cyan`

### `--density`
- Controls how dense the rain appears (affects number of gaps)
- Range: `0.0` to `1.0` (higher values = fewer gaps)
- Default: `1.0`
- Example: `matrix-rain --density 0.5`

### Combined Examples

Create your perfect Matrix rain by combining multiple parameters:

```bash
# Horizontal cyan katakana characters
matrix-rain --direction horizontal --charset katakana --color cyan

# Sparse purple binary rain
matrix-rain --charset binary --color magenta --density 0.3

# Dense emoji rain in yellow
matrix-rain --charset emoji --color yellow --density 1.0

# Horizontal braille characters in blue with medium density
matrix-rain -d horizontal -c braille --color blue --density 0.7
```

## Interactive Controls

While the animation is running, you can use the following keyboard controls:

| Key | Action |
|-----|--------|
| `1-5` | Switch character sets (1:ASCII, 2:Binary, 3:Braille, 4:Emoji, 5:Katakana) |
| `v/h` | Toggle between vertical and horizontal directions |
| `g` | Switch to green theme |
| `b` | Switch to blue theme |
| `p` | Switch to purple theme |
| `r` | Switch to rainbow theme |
| `q` | Quit the animation |


## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the iconic digital rain effect from The Matrix
- Built with [Chalk](https://github.com/chalk/chalk) for terminal styling
- Uses [node-emoji](https://github.com/omnidan/node-emoji) for emoji support
