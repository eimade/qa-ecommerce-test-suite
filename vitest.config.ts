import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['shop-demo/test/**/*.test.ts', 'tools/**/*.test.js'],
    reporters: ['default', 'junit'],
    outputFile: { junit: 'reports/unit/junit.xml' },
  },
});
