import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'src/index.ts',
  sourcemap: true,
  dts: true,
  format: ['esm', 'iife'],
  target: 'node22.21',
  platform: 'node',
  globalName: 'interpreter',
  outputOptions: {
    globals: {
      acorn: 'acorn',
      'ts-blank-space': 'tsBlankSpace',
    },
  },
  define: {
    DEBUG_INT: process.env.DEBUG_INT ? 'true' : 'false',
  },
  env: {
    DEV: false,
  },
})
