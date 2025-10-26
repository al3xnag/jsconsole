import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    uiBase: '/',
    reporters: ['default', process.env.CI && 'html'].filter((x) => x !== undefined),
    outputFile: {
      html: 'vitest-report/index.html',
    },
  },
  define: {
    DEBUG_INT: process.env.DEBUG_INT ? 'true' : 'false',
  },
})
