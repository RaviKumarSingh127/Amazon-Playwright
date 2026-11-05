
import { chromium } from '@playwright/test';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

async function main() {

    console.log('Launching Chrome...');

    const context = await chromium.launchPersistentContext(
        './amazon-user-data',
        {
            headless: false,
            slowMo: 1000,
            channel: 'chrome'
        }
    );

    try {

        const page = context.pages()[0] || await context.newPage();

        console.log('Opening Amazon...');

        await page.goto('https://www.amazon.in/', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        console.log('Current URL:', page.url());

        console.log('Page title:', await page.title());

        console.log('\nSUCCESS: Amazon homepage loaded.');

        console.log('Now manually perform these steps:');
        console.log('1. Click delivery location.');
        console.log('2. Click Sign in to see your addresses.');
        console.log('3. Check whether sign-in page opens.');

        // Wait for user input in terminal
        const rl = readline.createInterface({
            input,
            output
        });

        await rl.question('\nPress ENTER to close browser...');

        rl.close();

    } catch (error) {

        console.error('ERROR:', error);

    } finally {

        await context.close();

        console.log('Browser closed.');
    }
}

main().catch(console.error);
