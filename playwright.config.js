
import { defineConfig } from '@playwright/test';

export default defineConfig({

    // Test files location
    testDir: './tests',

    // Run tests one after another
    fullyParallel: false,

    // Use one worker
    workers: 1,

    // Prevent test.only in CI
    forbidOnly: !!process.env.CI,

    // Retry failed tests in CI
    retries: process.env.CI ? 2 : 0,

    // HTML report
    reporter: 'html',

    // Common browser settings
    use: {
        baseURL: 'https://www.amazon.in/',
        headless: false,
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
    },

    // Browser project
    projects: [
        {
            name: 'chromium',
            use: {
                browserName: 'chromium',
            },
        },
    ],
});
