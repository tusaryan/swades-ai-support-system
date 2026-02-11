import { defineConfig } from 'vitest/config';

export default defineConfig({
    cacheDir: 'node_modules/.vitest',
    test: {
        environment: 'node',
        include: ['src/**/*.test.ts', '__tests__/**/*.test.ts'],
        testTimeout: 30000,


        coverage: {
            enabled: false,
            reportsDirectory: 'coverage',
        },
    },
});
