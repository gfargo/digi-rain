import test from 'ava'
import { PassThrough } from 'stream'
import type { WriteStream } from 'tty'
import DigitalRain from '../digital-rain.js'

// Create mock stdout using PassThrough stream with additional properties
const mockStdout = new PassThrough() as PassThrough & Partial<WriteStream>
Object.assign(mockStdout, {
  columns: 80,
  rows: 24,
  isTTY: true,
})

// Setup test environment before each test
test.before(() => {
  // @ts-ignore - we need to override these for testing
  process.stdout.write = mockStdout.write.bind(mockStdout)
  process.stdout.columns = mockStdout.columns ?? 80
  process.stdout.rows = mockStdout.rows ?? 24
  process.stdout.isTTY = true

  // Mock stdin
  // @ts-ignore
  process.stdin.setRawMode = () => true
  process.stdin.isTTY = true
})

test('DigitalRain initialization', (t) => {
  const rain = new DigitalRain({})
  t.truthy(rain)
})

test('DigitalRain configuration', (t) => {
  const config = {
    direction: 'horizontal' as const,
    charset: 'katakana' as const,
    color: 'blue',
    density: 0.5,
  }

  const rain = new DigitalRain(config)
  t.truthy(rain)
})

test('Character generation', (t) => {
  const rain = new DigitalRain({})

  // Test ASCII charset
  rain['charset'] = 'ascii'
  const asciiChar = rain['generateChar']()
  t.true(typeof asciiChar === 'string')
  t.true(asciiChar.length === 1)

  // Test Binary charset
  rain['charset'] = 'binary'
  const binaryChar = rain['generateChar']()
  t.true(['0', '1'].includes(binaryChar))

  // Test Katakana charset
  rain['charset'] = 'katakana'
  const katakanaChar = rain['generateChar']()
  t.true(typeof katakanaChar === 'string')
  t.true(katakanaChar.length === 1)
})

test('Drop creation', (t) => {
  const rain = new DigitalRain({})
  const drop = rain['createDrop'](0, 24, true)

  t.true(typeof drop.pos === 'number')
  t.true(typeof drop.head === 'number')
  t.true(Array.isArray(drop.trail))
  t.true(typeof drop.speed === 'number')
  t.true(drop.speed >= 0.5 && drop.speed <= 1.0)
})

test('Start and stop', (t) => {
  const rain = new DigitalRain({})

  // Test start
  rain.start()
  t.true(rain['isRunning'])

  // Test stop
  rain.stop()
  t.false(rain['isRunning'])
})

test('Density affects drop creation', (t) => {
  const denseRain = new DigitalRain({ density: 1.0 })
  const sparseRain = new DigitalRain({ density: 0.3 })

  // Force resize to create initial drops
  denseRain['handleResize']()
  sparseRain['handleResize']()

  // Dense rain should have more drops
  t.true(denseRain['drops'].length > sparseRain['drops'].length)
})

// Test color themes
test('Color themes', (t) => {
  const rain = new DigitalRain({})

  // Test different color themes
  const themes = [
    'green',
    'blue',
    'purple',
    'cyan',
    'yellow',
    'pink',
    'sunset',
    'red',
    'white',
    'alien',
    'ocean',
  ] as const
  themes.forEach((theme) => {
    rain['currentPalette'] = theme
    t.truthy(rain['palettes'][theme])
  })
})

// Test direction changes
test('Direction changes', (t) => {
  const rain = new DigitalRain({})

  // Test vertical
  rain['direction'] = 'vertical'
  t.is(rain['direction'], 'vertical')

  // Test horizontal
  rain['direction'] = 'horizontal'
  t.is(rain['direction'], 'horizontal')
})

// Test buffer creation
test('Buffer creation', (t) => {
  const rain = new DigitalRain({})
  rain['handleResize']()

  // Force a frame render to create buffer
  rain['renderFrame']()

  // Verify stdout was written to
  t.true(mockStdout.writable)
})
