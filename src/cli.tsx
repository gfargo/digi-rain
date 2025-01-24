#!/usr/bin/env node
import meow from 'meow'
import DigitalRain from './digital-rain.js'

const cli = meow(
  `
  Usage
    $ matrix-rain

  Options
    --direction, -d   Direction of rain (vertical or horizontal) [Default: vertical]
    --charset, -c     Character set to use (ascii, binary, braille, emoji, katakana) [Default: ascii]
    --color          Text color (green, red, blue, yellow, magenta, cyan, white) [Default: green]
    --density        Drop density, 0.0-1.0 (more drops = fewer gaps) [Default: 1.0]

  Examples
    $ matrix-rain
    $ matrix-rain --direction horizontal
    $ matrix-rain --charset katakana --color cyan
    $ matrix-rain --density 0.5  # Half density, more gaps
`,
  {
    importMeta: import.meta,
    flags: {
      direction: {
        type: 'string',
        alias: 'd',
        default: 'vertical'
      },
      charset: {
        type: 'string',
        alias: 'c',
        default: 'ascii'
      },
      color: {
        type: 'string',
        default: 'green'
      },
      density: {
        type: 'number',
        default: 1.0
      }
    }
  }
)

// Validate direction
if (cli.flags.direction && !['vertical', 'horizontal'].includes(cli.flags.direction)) {
  console.error('Error: direction must be either "vertical" or "horizontal"')
  process.exit(1)
}

// Validate charset
if (cli.flags.charset && !['ascii', 'binary', 'braille', 'emoji', 'katakana'].includes(cli.flags.charset)) {
  console.error('Error: charset must be one of: ascii, binary, braille, emoji, katakana')
  process.exit(1)
}

// Validate color
if (cli.flags.color && !['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'].includes(cli.flags.color)) {
  console.error('Error: color must be one of: black, red, green, yellow, blue, magenta, cyan, white')
  process.exit(1)
}

// Validate density
if (cli.flags.density !== undefined && (cli.flags.density < 0 || cli.flags.density > 1)) {
  console.error('Error: density must be between 0.0 and 1.0')
  process.exit(1)
}

// Start the matrix rain
const matrix = new DigitalRain({
  direction: cli.flags.direction as 'vertical' | 'horizontal',
  charset: cli.flags.charset as 'ascii' | 'binary' | 'braille' | 'emoji' | 'katakana',
  color: cli.flags.color,
  density: cli.flags.density
})

// Handle cleanup on exit
process.on('SIGINT', () => {
  matrix.stop()
  process.exit(0)
})

process.on('SIGTERM', () => {
  matrix.stop()
  process.exit(0)
})

matrix.start()
