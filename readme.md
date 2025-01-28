# 🌧 Digi Rain

Transform your terminal into the iconic Matrix digital rain effect. A high-performance animation built with TypeScript and optimized for smooth rendering.

[![npm version](https://badge.fury.io/js/digi-rain.svg)](https://www.npmjs.com/package/digi-rain)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Built for performance: Direct terminal manipulation for smooth 60+ FPS animation

## Quick Start

Run instantly with npx:

```bash
npx digi-rain
```

Or install globally for repeated use:

```bash
npm install -g digi-rain
digi-rain
```

## Features

- 🎨 Tons of color themes!! ('green', 'blue', 'purple', 'pink', 'yellow', 'cyan', 'red', 'white', 'sunset', 'alien', 'ocean', 'forest', 'fire', 'galaxy', 'pastel', 'neon', 'lava', 'ice', 'earthy' )
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
- Example: `digi-rain --direction horizontal`

### `--charset, -c`

- Sets the character set used for the rain drops
- Options: `ascii`, `binary`, `braille`, `emoji`, `katakana`
- Default: `ascii`
- Example: `digi-rain --charset katakana`

### `--color`

- Changes the color of the rain effect
- Options: `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`
- Default: `green`
- Example: `digi-rain --color cyan`

### `--density`

- Controls how dense the rain appears (affects number of gaps)
- Range: `0.0` to `1.0` (higher values = fewer gaps)
- Default: `1.0`
- Example: `digi-rain --density 0.5`

### Combined Examples

Create your perfect digital rain by combining multiple parameters:

```bash
# Horizontal cyan katakana characters
digi-rain --direction horizontal --charset katakana --color cyan

# Sparse purple binary rain
digi-rain --charset binary --color magenta --density 0.3

# Dense emoji rain in yellow
digi-rain --charset emoji --color yellow --density 1.0

# Horizontal braille characters in blue with medium density
digi-rain -d horizontal -c braille --color blue --density 0.7
```

## Interactive Controls

While the animation is running, you can use the following keyboard controls:

| Key | Action |
|-----|--------|
| `1-5` | Switch character sets (1:ASCII, 2:Binary, 3:Braille, 4:Emoji, 5:Katakana) |
| `v/h` | Toggle between vertical and horizontal directions |
| `↑/↓` | Switch to between color themes |
| `q` | Quit the animation |

## Using DigitalRain in Your Project

You can integrate the DigitalRain effect into your own Node.js applications. Here's how:

### Installation

```bash
npm install digi-rain
```

### Basic Integration

```typescript
import { DigitalRain } from 'digi-rain';

// Create with default settings
const rain = new DigitalRain({});

// Start the animation
rain.start();

// Clean up when your app exits
process.on('SIGINT', () => {
  rain.stop();
  process.exit();
});
```

### Custom Configuration

```typescript
const rain = new DigitalRain({
  // Choose your character set
  charset: 'katakana',
  
  // Set the direction
  direction: 'horizontal',
  
  // Pick a color theme
  color: 'blue',
  
  // Adjust the density (0.0 to 1.0)
  density: 0.8
});
```

### Handling Terminal Resizing

The DigitalRain effect automatically handles terminal resizing, but you can also manually trigger a resize:

```typescript
process.stdout.on('resize', () => {
  // Optional: Add your own resize handling
  rain.handleResize();
});
```

### Cleanup

Always stop the animation when you're done to restore the terminal state:

```typescript
// In your cleanup code
rain.stop();
```

### Example: Adding to a CLI App

```typescript
#!/usr/bin/env node
import { DigitalRain } from 'digi-rain';

// Parse your CLI arguments
const args = process.argv.slice(2);

// Create rain with custom settings
const rain = new DigitalRain({
  charset: args.includes('--katakana') ? 'katakana' : 'ascii',
  color: args.includes('--blue') ? 'blue' : 'green'
});

// Start the effect
rain.start();

// Handle cleanup
process.on('SIGINT', () => {
  rain.stop();
  process.exit();
});

// Optional: Stop after a timeout
if (args.includes('--timeout')) {
  setTimeout(() => {
    rain.stop();
    process.exit();
  }, 5000); // Stop after 5 seconds
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the iconic digital rain effect from The Matrix
- Built with direct terminal manipulation for maximum performance
- Uses [Chalk](https://github.com/chalk/chalk) for color support
- Uses [node-emoji](https://github.com/omnidan/node-emoji) for emoji support
- Special thanks to the cyberpunk genre for endless inspiration
