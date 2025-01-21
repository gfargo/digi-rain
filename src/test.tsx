import test from 'ava'
import { render } from 'ink-testing-library'
import React from 'react'
import App from './app.js'

test('basic test', (t) => {
  const { lastFrame } = render(<App />)
  t.is(lastFrame(), 'TODO: Build App')
})
