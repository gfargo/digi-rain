import { random } from 'node-emoji'
import readline from 'readline'
import process from 'process'

interface Droplet {
  pos: number // x in vertical mode, y in horizontal mode
  head: number // y in vertical mode, x in horizontal mode
  trail: string[]
  speed: number
}

interface Cell {
  char: string
  color: string
  intensity: number
}

interface MatrixConfig {
  direction?: 'vertical' | 'horizontal'
  charset?: 'ascii' | 'binary' | 'braille' | 'emoji' | 'katakana'
  color?: string
  density?: number // 0-1, controls gap frequency, default 1 (no gaps)
}

class MatrixRain {
  private drops: Droplet[] = []
  private columns: number = 0
  private rows: number = 0
  private charset: string
  private direction: 'vertical' | 'horizontal'
  private colorCode: string
  private density: number
  private intervalId?: NodeJS.Timeout
  private isRunning: boolean = false

  constructor(config: MatrixConfig) {
    this.charset = config.charset || 'ascii'
    this.direction = config.direction || 'vertical'
    this.density = config.density ?? 1.0 // Default to full density
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
    process.stdin.on('keypress', (str: string | undefined, key: { ctrl?: boolean, name?: string } | undefined) => {
      if ((key?.ctrl && key?.name === 'c') || str === 'q') {
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

  private generateChar(): string {
    switch (this.charset) {
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

  private createDrop(pos: number, maxPos: number): Droplet {
    return {
      pos,
      head: Math.random() < 0.5 ? 0 : Math.floor(Math.random() * maxPos), // 50% chance to start from top
      trail: [],
      speed: Math.random() * 0.7 + 0.3 // Speed between 0.3 and 1.0
    }
  }

  private handleResize(): void {
    this.columns = process.stdout.columns || 0
    this.rows = process.stdout.rows || 0

    // Initialize drops based on direction
    const numDrops = this.direction === 'vertical' ? this.columns : this.rows
    const maxPos = this.direction === 'vertical' ? this.rows : this.columns

    // Calculate number of drops based on density
    const actualDrops = Math.floor(numDrops * this.density)
    const spacing = numDrops / actualDrops

    this.drops = Array(actualDrops)
      .fill(0)
      .map((_, i) => {
        // Calculate position with minimal randomness for high density
        const basePos = Math.floor(i * spacing)
        const randomOffset = this.density >= 0.8 ? 0 : Math.floor(Math.random() * spacing * 0.5)
        return this.createDrop(basePos + randomOffset, maxPos)
      })
  }

  private renderFrame(): void {
    // Create a buffer for the frame
    const buffer: Cell[][] = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.columns }, () => ({
        char: ' ',
        color: '',
        intensity: 0
      }))
    )

    // Update and render each droplet
    this.drops = this.drops.map(drop => {
      // Generate new character for the head
      const newChar = this.generateChar()
      
      // Randomly vary the maximum trail length (between 5 and 20)
      const maxTrailLength = Math.floor(Math.random() * 15) + 5
      const trail = [newChar, ...drop.trail].slice(0, maxTrailLength)
      
      // Move the droplet
      const newHead = drop.head + drop.speed
      const maxDim = this.direction === 'vertical' ? this.rows : this.columns
      
      // Chance to make the drop disappear before reaching bottom
      // Probability decreases with higher density
      if (Math.random() < 0.01 * (1 - this.density)) {
        return this.createDrop(drop.pos, maxDim)
      }
      
      // Reset if out of bounds, with chance to leave a gap
      if (newHead >= maxDim) {
        // Gap chance decreases with higher density
        if (Math.random() < 0.3 * (1 - this.density)) {
          return {
            ...drop,
            head: -Math.floor(Math.random() * 10 * (1 - this.density)), // Shorter delays with higher density
            trail: []
          }
        }
        return this.createDrop(drop.pos, maxDim)
      }
      
      // Chance to shorten trail while falling
      // Trail shortening less likely with higher density
      if (Math.random() < 0.1 * (1 - this.density)) {
        trail.pop()
      }
      
      return {
        ...drop,
        head: newHead,
        trail
      }
    })

    // Fill buffer with droplet data
    this.drops.forEach(drop => {
      const [headChar, ...trailChars] = drop.trail
      
      // Calculate position based on direction
      const [x, y] = this.direction === 'vertical' 
        ? [drop.pos, Math.floor(drop.head)]
        : [Math.floor(drop.head), drop.pos]
      
      // Draw head (white)
      if (y >= 0 && y < this.rows && x >= 0 && x < this.columns && headChar && buffer[y] && buffer[y][x]) {
        buffer[y][x] = { char: headChar, color: '37;1', intensity: 1 }
      }
      
      // Draw trail
      trailChars.forEach((char, i) => {
        const [trailX, trailY] = this.direction === 'vertical'
          ? [drop.pos, Math.floor(drop.head) - i - 1]
          : [Math.floor(drop.head) - i - 1, drop.pos]
        
        if (trailY >= 0 && trailY < this.rows && trailX >= 0 && trailX < this.columns && buffer[trailY] && buffer[trailY][trailX]) {
          const intensity = Math.max(0, 1 - (i / trailChars.length))
          buffer[trailY][trailX] = {
            char,
            color: this.colorCode,
            intensity: intensity < 0.5 ? 2 : 1
          }
        }
      })
    })

    // Render buffer to screen
    if (this.isRunning) {
      let output = ''
      let lastColor = ''
      let lastPos = ''

      for (let y = 0; y < buffer.length; y++) {
        const row = buffer[y]
        if (row) {
          for (let x = 0; x < row.length; x++) {
            const cell = row[x]
            if (cell && cell.char !== ' ') {
              const pos = `\x1b[${y + 1};${x + 1}H`
              const colorCode = `\x1b[${cell.color}m`
              
              // Only output position and color codes when they change
              output += (pos !== lastPos ? pos : '') +
                       (cell.color !== lastColor ? colorCode : '') +
                       cell.char
              
              lastPos = pos
              lastColor = cell.color
            }
          }
        }
      }

      process.stdout.write(output)
    }
  }

  public start(): void {
    if (this.isRunning) return

    this.isRunning = true

    // Set up terminal
    process.stdout.write('\x1b[?1049h') // Use alternate screen buffer
    process.stdout.write('\x1b[?25l') // Hide cursor
    process.stdout.write('\x1b[2J') // Clear screen
    process.stdout.write('\x1b[3J') // Clear scrollback
    process.stdout.write('\x1b[H') // Move cursor to home position
    
    // Disable scrolling
    process.stdout.write('\x1b[?1007l')

    // Initialize drops
    this.handleResize()

    // Start animation loop
    this.intervalId = setInterval(() => this.renderFrame(), 50)

    // Display controls
    process.stdout.write(`\x1b[${this.rows};1H\x1b[37;1mPress 1-5 to change charset, 'q' to quit`)
  }

  public stop(): void {
    if (!this.isRunning) return

    this.isRunning = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }

    // Restore terminal
    process.stdout.write('\x1b[?25h') // Show cursor
    process.stdout.write('\x1b[?1007h') // Re-enable scrolling
    process.stdout.write('\x1b[2J') // Clear screen
    process.stdout.write('\x1b[H') // Move cursor to home
    process.stdout.write('\x1b[?1049l') // Restore main screen buffer
  }
}

export default MatrixRain