import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['src/**/*.test.ts', '__tests__/**/*.test.ts'],
        testTimeout: 30000,
        pool: 'forks',
        cache: {
            dir: 'node_modules/.vitest',
        },
        coverage: {
            enabled: false,
            reportsDirectory: 'coverage',
        },
    },
});
