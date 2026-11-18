import { defineConfig } from 'vitest/config';
import path from 'node:path';
import os from 'node:os';

const isolatedTestUploadsDir = path.join(os.tmpdir(), 'mosque_signage_vitest_uploads');

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    fileParallelism: false,
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/global-setup.ts'],
    env: {
      DATABASE_PATH: path.resolve(__dirname, 'data/test_mosque_signage.db'),
      UPLOADS_DIR: isolatedTestUploadsDir,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
