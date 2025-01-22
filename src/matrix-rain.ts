import chalk, { ChalkInstance } from 'chalk'
import { random } from 'node-emoji'
import process from 'process'
import readline from 'readline'

interface Droplet {
  pos: number // x in vertical mode, y in horizontal mode
  head: number // y in vertical mode, x in horizontal mode
  trail: string[]
  speed: number
}

interface Cell {
  char: string
  color: ChalkInstance
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
  // Color palettes
  private palettes = {
    green: {
      head: chalk.bold.white,
      bright: chalk.bold.green,
      medium: chalk.green,
      dim: chalk.rgb(0, 100, 0)
    },
    blue: {
      head: chalk.bold.white,
      bright: chalk.bold.blue,
      medium: chalk.blue,
      dim: chalk.rgb(0, 0, 100)
    },
    purple: {
      head: chalk.bold.white,
      bright: chalk.bold.magenta,
      medium: chalk.magenta,
      dim: chalk.rgb(100, 0, 100)
    },
    yellow: {
      head: chalk.bold.black,
      bright: chalk.bold.yellow,
      medium: chalk.yellow,
      dim: chalk.rgb(100, 100, 0)
    },
    cyan: {
      head: chalk.bold.white,
      bright: chalk.bold.cyan,
      medium: chalk.cyan,
      dim: chalk.rgb(0, 100, 100)
    },
    red:{
      head: chalk.bold.white,
      bright: chalk.bold.red,
      medium: chalk.red,
      dim: chalk.rgb(100, 0, 0)
    }, 
    white:{
      head: chalk.bold.black,
      bright: chalk.bold.white,
      medium: chalk.white,
      dim: chalk.rgb(100, 100, 100)
    },
    rainbow: {
      head: chalk.bold.white,
      bright: chalk.bold.green,
      medium: chalk.hex('#00ff00'),
      dim: chalk.hex('#004400')
    }
  }

  private currentPalette: keyof typeof this.palettes = 'green'
  private density: number
  private intervalId?: NodeJS.Timeout
  private isRunning: boolean = false

  constructor(config: MatrixConfig) {
    this.charset = config.charset || 'ascii'
    this.direction = config.direction || 'vertical'
    this.density = config.density ?? 1.0 // Default to full density
    this.currentPalette = (config.color || 'green') as keyof typeof this.palettes

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
        // Direction switching
        case 'v': 
          if (this.direction !== 'vertical') {
            this.direction = 'vertical'
            this.handleResize() // Reset drops for new direction
          }
          break
        case 'h':
          if (this.direction !== 'horizontal') {
            this.direction = 'horizontal'
            this.handleResize() // Reset drops for new direction
          }
          break
        // Color switching
        case 'g': this.currentPalette = 'green'; break
        case 'b': this.currentPalette = 'blue'; break
        case 'p': this.currentPalette = 'purple'; break
        case 'r': this.currentPalette = 'rainbow'; break
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

  private createDrop(pos: number, _maxPos: number, startAtTop: boolean = false): Droplet {
    return {
      pos, // This is the fixed column/row position
      head: startAtTop ? -Math.floor(Math.random() * 10) : -20, // Always start above screen with some randomness
      trail: [],
      speed: Math.random() * 0.5 + 0.5 // Speed between 0.5 and 1.0 for more consistent flow
    }
  }

  private handleResize(): void {
    this.columns = process.stdout.columns || 0
    this.rows = process.stdout.rows || 0

    // Initialize drops based on direction
    const numColumns = this.direction === 'vertical' ? this.columns : this.rows
    const maxPos = this.direction === 'vertical' ? this.rows : this.columns

    // Create multiple drops per column with staggered starts
    this.drops = []
    for (let i = 0; i < numColumns; i++) {
      // Number of drops per column based on density (1-3 drops)
      const dropsPerColumn = Math.floor(Math.random() * 2 * this.density) + 1
      
      for (let j = 0; j < dropsPerColumn; j++) {
        // Stagger drops vertically within the column
        const drop = this.createDrop(i, maxPos, true)
        drop.head -= j * Math.floor(maxPos * 0.3) // Space drops apart vertically
        this.drops.push(drop)
      }
    }
  }

  private renderFrame(): void {
    // Create a buffer for the frame
    const buffer: Cell[][] = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.columns }, () => ({
        char: ' ',
        color: chalk.green,
        intensity: 0
      }))
    )

    // Occasionally add new drops to keep density dynamic
    if (Math.random() < 0.02 * this.density) {
      const maxDim = this.direction === 'vertical' ? this.rows : this.columns
      const numColumns = this.direction === 'vertical' ? this.columns : this.rows
      const randomColumn = Math.floor(Math.random() * numColumns)
      const newDrop = this.createDrop(randomColumn, maxDim, true)
      this.drops.push(newDrop)
    }

    // Update and render each droplet
    this.drops = this.drops.map(drop => {
      // Generate new character for the head
      const newChar = this.generateChar()
      
      // Move the droplet
      const newHead = drop.head + drop.speed
      const maxDim = this.direction === 'vertical' ? this.rows : this.columns
      
      // Small chance for drops near the top to reset (creates some variation)
      // Only affects drops in the top 20% of the screen and probability decreases with density
      if (newHead < maxDim * 0.2 && Math.random() < 0.005 * (1 - this.density)) {
        return {
          ...drop,
          head: -Math.floor(Math.random() * 10),
          trail: []
        }
      }
      
      // Reset individual drops when they reach the bottom
      if (newHead >= maxDim) {
        // Move drop back to top with a random delay
        return {
          ...drop,
          head: -Math.floor(Math.random() * 20), // Longer random delay before reappearing
          trail: [] // Clear this drop's trail
        }
      }

      // Calculate and limit trail length
      const maxTrailLength = Math.min(maxDim * 0.4, 15)
      
      // Add new character to trail with chance for spaces
      let trail: string[]
      if (this.charset === 'katakana') {
        // Katakana looks good with dense trails
        trail = [newChar, ...drop.trail]
      } else {
        // Other charsets need spaces for visual separation
        const shouldAddSpace = Math.random() < 0.3 // 30% chance for space
        trail = [shouldAddSpace ? ' ' : newChar, ...drop.trail]
        
        // Also add occasional spaces in the trail
        trail = trail.map(char => 
          char === ' ' ? ' ' : (Math.random() < 0.1 ? ' ' : char)
        )
      }

      // Limit trail length
      while (trail.length > maxTrailLength) {
        trail.pop()
      }
      
      // Chance to shorten trail while falling
      // Trail shortening less likely with higher density
      if (Math.random() < 0.1 * (1 - this.density)) {
        trail.pop()
      }
      
      // Remove consecutive spaces
      trail = trail.filter((char, i) => 
        char !== ' ' || (i > 0 && trail[i - 1] !== ' ')
      )
      
      return {
        ...drop,
        head: newHead,
        trail
      }
    })

    // Remove drops that are too far off screen (cleanup)
    this.drops = this.drops.filter(drop => drop.head > -50)

    // Limit total number of drops to prevent performance issues
    const maxDrops = Math.floor((this.rows + this.columns) * this.density)
    if (this.drops.length > maxDrops) {
      this.drops = this.drops
        .sort((a, b) => b.head - a.head) // Sort by position (keep visible drops)
        .slice(0, maxDrops)
    }

    // Fill buffer with droplet data
    this.drops.forEach(drop => {
      const [headChar, ...trailChars] = drop.trail
      
      // Calculate position based on direction
      const [x, y] = this.direction === 'vertical' 
        ? [drop.pos, Math.floor(drop.head)]
        : [Math.floor(drop.head), drop.pos]
      
      // Calculate if head is about to go off screen
      const isHeadNearBoundary = this.direction === 'vertical'
        ? drop.head >= this.rows - 1
        : drop.head >= this.columns - 1

      const palette = this.palettes[this.currentPalette] // Get current color palette

      // Draw head (white) only if not near boundary
      if (y >= 0 && y < this.rows && x >= 0 && x < this.columns && 
          headChar && buffer[y] && buffer[y][x] && !isHeadNearBoundary) {
        buffer[y][x] = { char: headChar, color: palette.head, intensity: 1 }
      }
      
      // Draw trail with better fade out
      trailChars.forEach((char, i) => {
        const [trailX, trailY] = this.direction === 'vertical'
          ? [drop.pos, Math.floor(drop.head) - i - 1]
          : [Math.floor(drop.head) - i - 1, drop.pos]
        
        if (trailY >= 0 && trailY < this.rows && trailX >= 0 && trailX < this.columns && 
            buffer[trailY] && buffer[trailY][trailX]) {
          // Calculate intensity based on position in trail and proximity to screen boundary
          const fadeStart = Math.floor(trailChars.length * 0.3) // Start fading after 30% of trail
          const fadeLength = trailChars.length - fadeStart
          let intensity = i < fadeStart 
            ? 1 
            : Math.max(0, 1 - ((i - fadeStart) / fadeLength))

          // Additional fade out when near screen boundary
          if (isHeadNearBoundary) {
            const distanceFromHead = i
            const boundaryFade = Math.max(0, 1 - (distanceFromHead / 3)) // Quick fade over 3 characters
            intensity *= boundaryFade
          }

          // Only draw if not completely faded out
          if (intensity > 0) {
            // Choose color based on position in trail
            const color = isHeadNearBoundary && i === 0 
              ? palette.medium 
              : intensity > 0.7 
                ? palette.bright
                : intensity > 0.3
                  ? palette.medium
                  : palette.dim

            buffer[trailY][trailX] = {
              char,
              color,
              intensity: intensity < 0.5 ? 2 : 1
            }
          }
        }
      })
    })

    // Render buffer to screen
    if (this.isRunning) {
      let output = ''
      let lastPos = ''

      for (let y = 0; y < buffer.length; y++) {
        const row = buffer[y]
        if (row) {
          for (let x = 0; x < row.length; x++) {
            const cell = row[x]
            if (cell && cell.char !== ' ') {
              const pos = `\x1b[${y + 1};${x + 1}H`
              
              // Only output position when it changes
              output += (pos !== lastPos ? pos : '') +
                       cell.color(cell.char)
              
              lastPos = pos
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
    process.stdout.write(`\x1b[${this.rows};1H${chalk.bold.white('Press 1-5 to change charset, v/h for direction, g/b/p/r for colors, q to quit')}`)
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