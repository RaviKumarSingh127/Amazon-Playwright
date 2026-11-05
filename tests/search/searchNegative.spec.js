

import { test } from '../../utils/persistentBrowser.js';
import { expect } from '@playwright/test';

test.describe('Amazon Negative Search Test Suite', () => {

    // ============================================
    // BEFORE EACH TEST
    // ============================================

    test.beforeEach(async ({ page }) => {

        console.log('\n========== NEGATIVE SEARCH TEST START ==========');

        console.log('Opening Amazon India...');

        await page.goto('https://www.amazon.in/', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        console.log('Current URL:', page.url());
        console.log('Page title:', await page.title());

        // Check Amazon verification page
        const verificationMessage = page.getByText(
            /click the button below to continue shopping/i
        );

        if (await verificationMessage.isVisible().catch(() => false)) {
            console.log('Amazon verification page detected.');
            test.skip(true, 'Amazon verification page detected.');
        }

        // Check CAPTCHA
        const captcha = page.locator('input[name="captchacharacters"]');

        if (await captcha.isVisible().catch(() => false)) {
            console.log('Amazon CAPTCHA detected.');
            test.skip(true, 'Amazon CAPTCHA requires manual verification.');
        }

        // Verify search box
        const searchBox = page.locator('#twotabsearchtextbox');

        console.log('Search box count:', await searchBox.count());

        await expect(searchBox).toBeVisible();

        console.log('PASS: Amazon homepage is ready.');

    });


    // ============================================
    // REUSABLE LOCATORS AND FUNCTIONS
    // ============================================

    const searchBoxSelector = '#twotabsearchtextbox';
    const searchButtonSelector = '#nav-search-submit-button';
    const resultSelector = '[data-component-type="s-search-result"]';

    async function submitSearch(page, searchText) {

        const searchBox = page.locator(searchBoxSelector);

        await searchBox.fill(searchText);

        console.log('Entered search value:', searchText);

        await page.locator(searchButtonSelector).click();

        await page.waitForLoadState('domcontentloaded');

        console.log('Current URL:', page.url());

    }


    // ============================================
    // NEG_01: EMPTY SEARCH INPUT
    // ============================================

    test('NEG_01 - Search with empty input', async ({ page }) => {

        console.log('Running NEG_01...');

        const searchBox = page.locator(searchBoxSelector);

        // Verify search box is empty
        await expect(searchBox).toHaveValue('');

        console.log('Search box is initially empty.');

        // Click search without entering any text
        await page.locator(searchButtonSelector).click();

        await page.waitForLoadState('domcontentloaded');

        console.log('Current URL:', page.url());

        // Verify that no meaningful search query was submitted
        const currentURL = new URL(page.url());

        expect(currentURL.searchParams.get('k') || '').toBe('');

        console.log('PASS: Empty search does not submit a product query.');

    });


    // ============================================
    // NEG_02: NON-EXISTING PRODUCT
    // ============================================

    test('NEG_02 - Search non-existing product', async ({ page }) => {

        console.log('Running NEG_02...');

        const searchText = 'XYZQWERTY987654321NONEXISTINGPRODUCT';

        await submitSearch(page, searchText);

        // Check that search query is present in URL
        const currentURL = new URL(page.url());

        expect(currentURL.searchParams.get('k')).toContain(searchText);

        // Inspect no-results message
        const noResults = page.getByText(
            /no results|did not match any products|no exact matches/i
        );

        const resultCards = page.locator(resultSelector);

        const noResultsVisible = await noResults.first()
            .isVisible()
            .catch(() => false);

        const resultCount = await resultCards.count();

        console.log('No-results message visible:', noResultsVisible);
        console.log('Result count:', resultCount);

        // Amazon may show related products instead of an empty page.
        console.log('PASS: Non-existing product search submitted.');

    });


    // ============================================
    // NEG_03: SPECIAL CHARACTERS ONLY
    // ============================================

    test('NEG_03 - Search using only special characters', async ({ page }) => {

        console.log('Running NEG_03...');

        const searchText = '!@#$%^&*()';

        await submitSearch(page, searchText);

        // Verify special-character query is submitted
        const currentURL = new URL(page.url());

        expect(currentURL.searchParams.get('k')).toBe(searchText);

        console.log('PASS: Special character search handled.');

    });


    // ============================================
    // NEG_04: SPACES ONLY
    // ============================================

    test('NEG_04 - Search using only spaces', async ({ page }) => {

        console.log('Running NEG_04...');

        const searchBox = page.locator(searchBoxSelector);

        // Enter spaces only
        await searchBox.fill('     ');

        console.log('Entered spaces only.');

        // Click search
        await page.locator(searchButtonSelector).click();

        await page.waitForLoadState('domcontentloaded');

        console.log('Current URL:', page.url());

        // Verify no meaningful query was submitted
        const currentURL = new URL(page.url());

        const submittedQuery = currentURL.searchParams.get('k') || '';

        expect(submittedQuery.trim()).toBe('');

        console.log('PASS: Spaces-only search does not create a meaningful query.');

    });


    // ============================================
    // NEG_05: EXTREMELY LONG INPUT
    // ============================================

    test('NEG_05 - Search with extremely long input', async ({ page }) => {

        console.log('Running NEG_05...');

        // Generate a very long search query
        const longText = 'Samsung '.repeat(500);

        const searchBox = page.locator(searchBoxSelector);

        await searchBox.fill(longText);

        console.log('Input length:', longText.length);

        // Verify input accepted the text
        const actualValue = await searchBox.inputValue();

        console.log('Actual input length:', actualValue.length);

        expect(actualValue.length).toBeGreaterThan(0);

        // Submit search
        await page.locator(searchButtonSelector).click();

        await page.waitForLoadState('domcontentloaded');

        console.log('Current URL:', page.url());

        console.log('PASS: Extremely long input handled without script failure.');

    });


    // ============================================
    // NEG_06: HTML / SCRIPT-LIKE INPUT
    // ============================================

    test('NEG_06 - Search using HTML and script-like text', async ({ page }) => {

        console.log('Running NEG_06...');

        const searchText = '<script>alert(1)</script>';

        let dialogAppeared = false;

        // Listen for JavaScript dialogs
        page.on('dialog', async dialog => {

            dialogAppeared = true;

            console.log('Unexpected JavaScript dialog:', dialog.message());

            await dialog.dismiss();

        });

        await submitSearch(page, searchText);

        // Verify query was submitted as search text
        const currentURL = new URL(page.url());

        expect(currentURL.searchParams.get('k')).toBe(searchText);

        // Verify script-like input did not execute
        expect(dialogAppeared).toBe(false);

        console.log('PASS: Script-like search text did not trigger a JavaScript dialog.');

    });


    // ============================================
    // NEG_07: MISSPELLED PRODUCT
    // ============================================

    test('NEG_07 - Search using misspelled product name', async ({ page }) => {

        console.log('Running NEG_07...');

        const searchText = 'Samzung mobliee';

        await submitSearch(page, searchText);

        const currentURL = new URL(page.url());

        expect(currentURL.searchParams.get('k')).toBe(searchText);

        // Amazon may show spelling suggestions or related products
        const results = page.locator(resultSelector);

        console.log('Result count:', await results.count());

        console.log('PASS: Misspelled product search handled.');

    });


    // ============================================
    // NEG_08: UNAVAILABLE PRODUCT
    // ============================================

    test('NEG_08 - Search for unavailable product', async ({ page }) => {

        console.log('Running NEG_08...');

        // Search for a specific product phrase
        const searchText = 'Samsung Galaxy S25 Ultra 5G 1TB';

        await submitSearch(page, searchText);

        const results = page.locator(resultSelector);

        console.log('Result count:', await results.count());

        // Search results can include unavailable products
        // or similar alternatives.
        console.log('Search completed. Product availability requires inspection.');

        console.log('PASS: Unavailable-product search submitted.');

    });


    // ============================================
    // NEG_09: CHANGE CATEGORY WHILE SUGGESTIONS OPEN
    // ============================================

    test('NEG_09 - Change category while suggestions are open', async ({ page }) => {

        console.log('Running NEG_09...');

        const searchBox = page.locator(searchBoxSelector);

        const categoryDropdown = page.locator('#searchDropdownBox');

        // Type text to trigger autocomplete
        await searchBox.fill('Samsung');

        console.log('Typed Samsung in search box.');

        // Wait briefly for suggestions
        await page.waitForTimeout(1500);

        // Change category while suggestions may be displayed
        await categoryDropdown.selectOption({
            label: 'Electronics'
        });

        console.log('Selected Electronics category.');

        // Verify search text is retained
        await expect(searchBox).toHaveValue('Samsung');

        console.log('PASS: Category changed while autocomplete was active.');

    });


    // ============================================
    // NEG_10: REPEATED SEARCH SUBMISSION
    // ============================================

    test('NEG_10 - Submit same search repeatedly', async ({ page }) => {

        console.log('Running NEG_10...');

        const searchText = 'Samsung mobile';

        const searchBox = page.locator(searchBoxSelector);

        // First search
        await searchBox.fill(searchText);

        await page.locator(searchButtonSelector).click();

        await expect(page).toHaveURL(/\/s\?/);

        console.log('First search completed.');

        // Second search
        await searchBox.fill(searchText);

        await page.locator(searchButtonSelector).click();

        await expect(page).toHaveURL(/\/s\?/);

        console.log('Second search completed.');

        // Third search
        await searchBox.fill(searchText);

        await page.locator(searchButtonSelector).click();

        await expect(page).toHaveURL(/\/s\?/);

        console.log('Third search completed.');

        // Verify results
        const results = page.locator(resultSelector);

        await expect(results.first()).toBeVisible();

        console.log('PASS: Repeated search submission handled.');

    });


    // ============================================
    // NEG_11: NETWORK INTERRUPTION
    // ============================================

    test('NEG_11 - Network interruption during search', async ({ page }) => {

        console.log('Running NEG_11...');

        // Block Amazon search document requests
        await page.route('**/s?*', async route => {

            console.log('Simulating network interruption.');

            await route.abort('failed');

        });

        const searchBox = page.locator(searchBoxSelector);

        await searchBox.fill('Samsung mobile');

        await page.locator(searchButtonSelector).click();

        // Wait for navigation failure or timeout
        await page.waitForTimeout(3000);

        console.log('Current URL:', page.url());

        // Remove network interception
        await page.unroute('**/s?*');

        console.log('Network interception removed.');

        console.log('PASS: Network interruption simulation completed.');

    });


    // ============================================
    // NEG_12: RELOAD DURING NAVIGATION
    // ============================================

    test('NEG_12 - Reload during search navigation', async ({ page }) => {

        console.log('Running NEG_12...');

        const searchBox = page.locator(searchBoxSelector);

        await searchBox.fill('Laptop');

        console.log('Search query entered.');

        // Start search navigation
        const navigationPromise = page.waitForURL(/\/s\?/, {
            timeout: 30000
        }).catch(() => null);

        await page.locator(searchButtonSelector).click({
            noWaitAfter: true
        });

        // Reload during or immediately after navigation
        await page.reload({
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        await navigationPromise;

        console.log('Current URL:', page.url());

        // Verify browser is still in a usable state
        await expect(page.locator('body')).toBeVisible();

        console.log('PASS: Browser remained usable after reload.');

    });

});
