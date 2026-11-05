

import { test as base, chromium } from '@playwright/test';
import path from 'path';

const userDataDir = path.resolve('amazon-user-data');

export const test = base.extend({

    context: async ({}, use) => {

        console.log('Launching persistent Chromium profile...');

        const context = await chromium.launchPersistentContext(
            userDataDir,
            {
                headless: false,
                slowMo: 1000,
                viewport: {
                    width: 1366,
                    height: 768
                }
            }
        );

        console.log('Persistent browser launched.');

        await use(context);

        await context.close();

        console.log('Persistent browser closed.');
    },

    page: async ({ context }, use) => {

        const pages = context.pages();

        const page = pages.length > 0
            ? pages[0]
            : await context.newPage();

        await use(page);
    }

});
