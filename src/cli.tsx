#!/usr/bin/env node
import meow from 'meow'
import MatrixRain from './matrix.js'

const cli = meow(
  `
  Usage
    $ matrix-rain

  Options
    --direction, -d   Direction of rain (vertical or horizontal) [Default: vertical]
    --charset, -c     Character set to use (ascii, binary, braille, emoji, katakana) [Default: ascii]
    --color          Text color (green, red, blue, yellow, magenta, cyan, white) [Default: green]

  Examples
    $ matrix-rain
    $ matrix-rain --direction horizontal
    $ matrix-rain --charset katakana --color cyan
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

// Start the matrix rain
const matrix = new MatrixRain({
  direction: cli.flags.direction as 'vertical' | 'horizontal',
  charset: cli.flags.charset as 'ascii' | 'binary' | 'braille' | 'emoji' | 'katakana',
  color: cli.flags.color
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
