import { useApp, useInput, useStdout } from 'ink'
import { random } from 'node-emoji'
import { useEffect, useRef, useState } from 'react'

interface Droplet {
  pos: number // x in vertical mode, y in horizontal mode
  head: number // y in vertical mode, x in horizontal mode
  trail: string[]
  speed: number
}

function generateChar(
  charSet: 'ascii' | 'binary' | 'braille' | 'emoji' | 'katakana'
): string {
  switch (charSet) {
    case 'ascii':
      return String.fromCharCode(Math.floor(Math.random() * 94) + 33)
    case 'binary':
      return Math.round(Math.random()).toString()
    case 'braille':
      return String.fromCharCode(Math.floor(Math.random() * 256) + 0x2800)
    case 'emoji':
      return random().emoji || '🌈'
    case 'katakana':
      return String.fromCharCode(Math.floor(Math.random() * 96) + 0x30a0)
  }
}

function generateMatrixFrame(
  numCols: number,
  numRows: number,
  charSet: 'ascii' | 'binary' | 'braille' | 'emoji' | 'katakana',
  drops: Droplet[],
  direction: 'vertical' | 'horizontal',
  color: string
): { frame: string; newDrops: Droplet[] } {
  let output = ''
  const newDrops = drops.map((drop) => {
    // Generate new character for the head
    const newChar = generateChar(charSet)
    const trail = [newChar, ...drop.trail].slice(0, 15) // Keep trail length manageable

    // Move the droplet
    const newHead = drop.head + drop.speed
    const maxDim = direction === 'vertical' ? numRows : numCols

    // Reset if out of bounds
    if (newHead >= maxDim) {
      return {
        pos: drop.pos,
        head: 0,
        trail: [],
        speed: Math.random() * 0.5 + 0.5, // Random speed between 0.5 and 1
      }
    }

    return {
      ...drop,
      head: newHead,
      trail,
    }
  })

  // Generate frame output
  newDrops.forEach((drop) => {
    const [headChar, ...trailChars] = drop.trail

    // Draw head (white)
    const [x, y] =
      direction === 'vertical' ? [drop.pos, drop.head] : [drop.head, drop.pos]
    output += `\x1b[${y + 1};${x + 1}H\x1b[37m${headChar}`

    // Draw trail (in specified color)
    trailChars.forEach((char, i) => {
      const [trailX, trailY] =
        direction === 'vertical'
          ? [drop.pos, drop.head - i - 1]
          : [drop.head - i - 1, drop.pos]
      if (trailY >= 0 && trailX >= 0) {
        output += `\x1b[${trailY + 1};${trailX + 1}H\x1b[${color}m${char}`
      }
    })
  })

  return { frame: output, newDrops }
}

interface Props {
  direction?: 'vertical' | 'horizontal'
  color?: string
  charset?: 'ascii' | 'binary' | 'braille' | 'emoji' | 'katakana'
}

const App = ({
  direction = 'vertical',
  color = 'green',
  charset: initialCharset = 'ascii',
}: Props) => {
  const { stdout } = useStdout()
  const { exit } = useApp()
  const [columns, setColumns] = useState(0)
  const [rows, setRows] = useState(0)
  const [drops, setDrops] = useState<Droplet[]>([])
  const [charSet, setCharSet] = useState(initialCharset)
  const frameRef = useRef('') // Use a ref to avoid unnecessary re-renders

  // Convert color name to ANSI color code
  const colorCode =
    {
      black: '30',
      red: '31',
      green: '32',
      yellow: '33',
      blue: '34',
      magenta: '35',
      cyan: '36',
      white: '37',
    }[color] || '32' // Default to green if invalid color

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      exit()
    }
    if (input === '1') setCharSet('ascii')
    if (input === '2') setCharSet('binary')
    if (input === '3') setCharSet('braille')
    if (input === '4') setCharSet('emoji')
    if (input === '5') setCharSet('katakana')
  })

  // Initialize and handle resize
  useEffect(() => {
    const handleResize = () => {
      const newColumns = stdout.columns || 0
      const newRows = stdout.rows || 0
      setColumns(newColumns)
      setRows(newRows)

      console.log('newColumns:', newColumns)
      console.log('newRows:', newRows)

      // Initialize drops based on direction
      const numDrops = direction === 'vertical' ? newColumns : newRows
      const maxPos = direction === 'vertical' ? newRows : newColumns

      setDrops(
        Array(Math.floor(numDrops / 2)) // Use half the columns/rows for better spacing
          .fill(0)
          .map((_, i) => ({
            pos: i * 2, // Space out the drops
            head: Math.floor(Math.random() * maxPos),
            trail: [],
            speed: Math.random() * 0.5 + 0.5,
          }))
      )
    }

    handleResize()
    stdout.on('resize', handleResize)
    return () => {
      stdout.off('resize', handleResize)
    }
  }, [direction])

  // Animation loop
  useEffect(() => {
    if (columns === 0 || rows === 0) return

    // Clear screen on start
    process.stdout.write('\x1b[2J\x1b[0f')

    const intervalId = setInterval(() => {
      setDrops((prevDrops) => {
        const { frame, newDrops } = generateMatrixFrame(
          columns,
          rows,
          charSet,
          prevDrops,
          direction,
          colorCode
        )
        frameRef.current = frame
        return newDrops
      })
    }, 50) // Slightly slower than original for better readability

    return () => clearInterval(intervalId)
  }, [columns, rows, charSet, direction, colorCode])

  // Render frame
  useEffect(() => {
    process.stdout.write(frameRef.current)
  }, [drops])

  return null
}

export default App
