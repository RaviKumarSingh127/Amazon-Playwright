
import { test } from '../../utils/persistentBrowser.js';
import { expect } from '@playwright/test';

// ==================================================
// TEST SUITE: AMAZON HOMEPAGE
// ==================================================

test.describe('Amazon Homepage Test Suite', () => {

    // ==================================================
    // BEFORE EACH TEST
    // ==================================================

    test.beforeEach(async ({ page }) => {

        console.log('\n======================================');
        console.log('STARTING AMAZON HOMEPAGE TEST');
        console.log('======================================');

        // Step 1: Navigate to Amazon
        console.log('Step 1: Opening Amazon India...');

        await page.goto('https://www.amazon.in/', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        console.log('Navigation completed.');
        console.log('Current URL:', page.url());
        console.log('Page title:', await page.title());

        // Step 2: Check verification page
        console.log('Step 2: Checking verification page...');

        const verificationMessage = page.getByText(
            /click the button below to continue shopping/i
        );

        if (await verificationMessage.isVisible().catch(() => false)) {

            console.log('SKIPPED: Amazon verification page detected.');

            test.skip(true, 'Amazon verification page detected.');
        }

        // Step 3: Check CAPTCHA
        console.log('Step 3: Checking CAPTCHA...');

        const captcha = page.locator(
            'input[name="captchacharacters"]'
        );

        if (await captcha.isVisible().catch(() => false)) {

            console.log('SKIPPED: Amazon CAPTCHA detected.');

            test.skip(true, 'Amazon CAPTCHA requires manual verification.');
        }

        // Step 4: Check homepage search box
        console.log('Step 4: Checking homepage search box...');

        const searchBox = page.locator('#twotabsearchtextbox');

        const searchBoxCount = await searchBox.count();

        console.log('Search box count:', searchBoxCount);

        if (searchBoxCount === 0) {
            console.log('ERROR: Search box was not found.');
            console.log('Current URL:', page.url());
            console.log('Page title:', await page.title());
        }

        await expect(searchBox).toBeVisible();

        console.log('PASS: Normal Amazon homepage loaded.');
    });


    // ==================================================
    // POSITIVE TEST CASES
    // ==================================================

    // POS_01 - Verify homepage title
    test('POS_01 - Verify homepage title', async ({ page }) => {

        console.log('\nRunning POS_01...');

        const actualTitle = await page.title();

        console.log('Actual title:', actualTitle);

        await expect(page).toHaveTitle(/Amazon/i);

        console.log('PASS: Homepage title verified.');
    });


    // POS_02 - Verify Amazon logo visibility
    test('POS_02 - Verify Amazon logo visibility', async ({ page }) => {

        console.log('\nRunning POS_02...');

        const logo = page.locator('#nav-logo');

        console.log('Logo count:', await logo.count());

        await expect(logo).toBeVisible();

        console.log('PASS: Amazon logo is visible.');
    });


    // POS_03 - Verify search box visibility
    test('POS_03 - Verify search box visibility', async ({ page }) => {

        console.log('\nRunning POS_03...');

        const searchBox = page.locator('#twotabsearchtextbox');

        console.log('Search box count:', await searchBox.count());

        await expect(searchBox).toBeVisible();

        console.log('PASS: Search box is visible.');
    });


    // POS_04 - Verify search button visibility
    test('POS_04 - Verify search button visibility', async ({ page }) => {

        console.log('\nRunning POS_04...');

        const searchButton = page.locator('#nav-search-submit-button');

        console.log('Search button count:', await searchButton.count());

        await expect(searchButton).toBeVisible();

        console.log('PASS: Search button is visible.');
    });


    // POS_05 - Verify search box is enabled
    test('POS_05 - Verify search box is enabled', async ({ page }) => {

        console.log('\nRunning POS_05...');

        const searchBox = page.locator('#twotabsearchtextbox');

        await expect(searchBox).toBeEnabled();

        console.log('PASS: Search box is enabled.');
    });


    // POS_06 - Verify search box is editable
    test('POS_06 - Verify search box is editable', async ({ page }) => {

        console.log('\nRunning POS_06...');

        const searchBox = page.locator('#twotabsearchtextbox');

        console.log('Search box count:', await searchBox.count());

        await expect(searchBox).toBeEditable();

        console.log('PASS: Search box is editable.');
    });


    // POS_07 - Verify search button is enabled
    test('POS_07 - Verify search button is enabled', async ({ page }) => {

        console.log('\nRunning POS_07...');

        const searchButton = page.locator('#nav-search-submit-button');

        await expect(searchButton).toBeEnabled();

        console.log('PASS: Search button is enabled.');
    });


    // POS_08 - Verify shopping cart visibility
    test('POS_08 - Verify shopping cart visibility', async ({ page }) => {

        console.log('\nRunning POS_08...');

        const cart = page.locator('#nav-cart');

        console.log('Cart count:', await cart.count());

        await expect(cart).toBeVisible();

        console.log('PASS: Shopping cart is visible.');
    });


    // POS_09 - Verify category dropdown visibility
    test('POS_09 - Verify category dropdown visibility', async ({ page }) => {

        console.log('\nRunning POS_09...');

        const categoryDropdown = page.locator('#searchDropdownBox');

        console.log('Dropdown count:', await categoryDropdown.count());

        await expect(categoryDropdown).toBeVisible();

        console.log('PASS: Category dropdown is visible.');
    });


    // POS_10 - Verify category dropdown is enabled
    test('POS_10 - Verify category dropdown is enabled', async ({ page }) => {

        console.log('\nRunning POS_10...');

        const categoryDropdown = page.locator('#searchDropdownBox');

        await expect(categoryDropdown).toBeEnabled();

        console.log('PASS: Category dropdown is enabled.');
    });


    // POS_11 - Verify search box accepts user input
    test('POS_11 - Verify search box accepts user input', async ({ page }) => {

        console.log('\nRunning POS_11...');

        const searchBox = page.locator('#twotabsearchtextbox');

        const searchText = 'Samsung mobile';

        console.log('Entering search text:', searchText);

        await searchBox.fill(searchText);

        const actualValue = await searchBox.inputValue();

        console.log('Expected value:', searchText);
        console.log('Actual value:', actualValue);

        expect(actualValue).toBe(searchText);

        console.log('PASS: Search box accepts user input.');
    });


    // ==================================================
    // INITIAL STATE TEST CASE
    // ==================================================

    // NEG_01 - Verify search box is initially empty
    test('NEG_01 - Verify search box is initially empty', async ({ page }) => {

        console.log('\nRunning NEG_01...');

        const searchBox = page.locator('#twotabsearchtextbox');

        const actualValue = await searchBox.inputValue();

        console.log('Initial search box value:', actualValue);

        expect(actualValue).toBe('');

        console.log('PASS: Search box is initially empty.');
    });

});
