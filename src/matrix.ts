import { random } from 'node-emoji';
import process from 'process';
import readline from 'readline';

interface Droplet {
  pos: number // x in vertical mode, y in horizontal mode
  head: number // y in vertical mode, x in horizontal mode
  trail: string[]
  speed: number
}

interface MatrixConfig {
  direction?: 'vertical' | 'horizontal'
  color?: string
  charset?: 'ascii' | 'binary' | 'braille' | 'emoji' | 'katakana'
}

function generateChar(charset: string): string {
  switch (charset) {
    case 'ascii':
      return String.fromCharCode(Math.floor(Math.random() * 94) + 33)
    case 'binary':
      return Math.round(Math.random()).toString()
    case 'braille':
      return String.fromCharCode(Math.floor(Math.random() * 256) + 0x2800)
    case 'emoji':
      return random().emoji
    case 'katakana':
      return String.fromCharCode(Math.floor(Math.random() * 96) + 0x30a0)
    default:
      return String.fromCharCode(Math.floor(Math.random() * 94) + 33)
  }
}

class MatrixRain {
  private drops: Droplet[] = []
  private columns: number = 0
  private rows: number = 0
  private charset: string
  private direction: 'vertical' | 'horizontal'
  private colorCode: string
  private intervalId?: NodeJS.Timeout
  private isRunning: boolean = false

  constructor(config: MatrixConfig) {
    this.charset = config.charset || 'ascii'
    this.direction = config.direction || 'vertical'
    this.colorCode = {
      black: '30',
      red: '31',
      green: '32',
      yellow: '33',
      blue: '34',
      magenta: '35',
      cyan: '36',
      white: '37'
    }[config.color || 'green'] || '32'

    // Set up input handling
    readline.emitKeypressEvents(process.stdin)
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true)
    }

    // Handle terminal resize
    process.stdout.on('resize', () => this.handleResize())

    // Handle input
    process.stdin.on('keypress', (str, key) => {
      if (key.ctrl && key.name === 'c' || str === 'q') {
        this.stop()
        process.exit(0)
      }

      // Character set switching
      switch (str) {
        case '1': this.charset = 'ascii'; break
        case '2': this.charset = 'binary'; break
        case '3': this.charset = 'braille'; break
        case '4': this.charset = 'emoji'; break
        case '5': this.charset = 'katakana'; break
      }
    })
  }

  private handleResize() {
    this.columns = process.stdout.columns || 0
    this.rows = process.stdout.rows || 0

    // Initialize drops based on direction
    const numDrops = this.direction === 'vertical' ? this.columns : this.rows
    const maxPos = this.direction === 'vertical' ? this.rows : this.columns

    this.drops = Array(Math.floor(numDrops / 2))
      .fill(0)
      .map((_, i) => ({
        pos: i * 2,
        head: Math.floor(Math.random() * maxPos),
        trail: [],
        speed: Math.random() * 0.5 + 0.5
      }))
  }

  private renderFrame() {
    let output = ''

    // Update and render each droplet
    this.drops = this.drops.map(drop => {
      // Generate new character for the head
      const newChar = generateChar(this.charset)
      const trail = [newChar, ...drop.trail].slice(0, 15)
      
      // Move the droplet
      const newHead = drop.head + drop.speed
      const maxDim = this.direction === 'vertical' ? this.rows : this.columns
      
      // Reset if out of bounds
      if (newHead >= maxDim) {
        return {
          pos: drop.pos,
          head: 0,
          trail: [],
          speed: Math.random() * 0.5 + 0.5
        }
      }
      
      return {
        ...drop,
        head: newHead,
        trail
      }
    })

    // Generate frame output
    this.drops.forEach(drop => {
      const [headChar, ...trailChars] = drop.trail
      
      // Draw head (white)
      const [x, y] = this.direction === 'vertical' 
        ? [drop.pos, Math.floor(drop.head)]
        : [Math.floor(drop.head), drop.pos]
      
      if (y >= 0 && y < this.rows && x >= 0 && x < this.columns) {
        output += `\x1b[${y + 1};${x + 1}H\x1b[37;1m${headChar}`
      }
      
      // Draw trail
      trailChars.forEach((char, i) => {
        const [trailX, trailY] = this.direction === 'vertical'
          ? [drop.pos, Math.floor(drop.head) - i - 1]
          : [Math.floor(drop.head) - i - 1, drop.pos]
        
        if (trailY >= 0 && trailY < this.rows && trailX >= 0 && trailX < this.columns) {
          const intensity = Math.max(0, 1 - (i / trailChars.length))
          output += `\x1b[${trailY + 1};${trailX + 1}H\x1b[${this.colorCode};${intensity < 0.5 ? 2 : 1}m${char}`
        }
      })
    })

    if (this.isRunning) {
      process.stdout.write(output)
    }
  }

  public start() {
    if (this.isRunning) return

    this.isRunning = true

    // Set up terminal
    process.stdout.write('\x1b[?25l') // Hide cursor
    process.stdout.write('\x1b[2J') // Clear screen
    process.stdout.write('\x1b[3J') // Clear scrollback
    process.stdout.write('\x1b[?1049h') // Use alternate screen buffer

    // Initialize drops
    this.handleResize()

    // Start animation loop
    this.intervalId = setInterval(() => this.renderFrame(), 50)

    // Display controls
    process.stdout.write(`\x1b[${this.rows};1H\x1b[37;1mPress 1-5 to change charset, 'q' to quit`)
  }

  public stop() {
    if (!this.isRunning) return

    this.isRunning = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }

    // Restore terminal
    process.stdout.write('\x1b[?25h') // Show cursor
    process.stdout.write('\x1b[2J') // Clear screen
    process.stdout.write('\x1b[?1049l') // Restore main screen buffer
  }
}

export default MatrixRain