import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      DATABASE_URL: 'mongodb://127.0.0.1:1/umc-test',
      DATABASE_SERVER_SELECTION_TIMEOUT_MS: '200',
      // Test-only values; never reuse them outside the test runner.
      JWT_ACCESS_SECRET: 'test-access-secret-0123456789abcdef0123456789',
      JWT_REFRESH_SECRET: 'test-refresh-secret-0123456789abcdef0123456789',
      BCRYPT_SALT_ROUNDS: '10',
    },
  },
});
