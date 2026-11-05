
import { test } from '../../utils/persistentBrowser.js';
import { expect } from '@playwright/test';

test.describe('Amazon Positive Search Test Suite', () => {

    // ============================================
    // BEFORE EACH TEST
    // ============================================

    test.beforeEach(async ({ page }) => {

        console.log('\n========== POSITIVE SEARCH TEST START ==========');

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
    // REUSABLE SEARCH FUNCTION
    // ============================================

    async function searchProduct(page, productName) {

        console.log('Searching product:', productName);

        const searchBox = page.locator('#twotabsearchtextbox');

        await searchBox.fill(productName);

        console.log('Entered value:', await searchBox.inputValue());

        // Click search button
        await page.locator('#nav-search-submit-button').click();

        // Verify search URL
        await expect(page).toHaveURL(/\/s\?/);

        console.log('Search URL:', page.url());

        // Verify product results
        const results = page.locator(
            '[data-component-type="s-search-result"]'
        );

        await expect(results.first()).toBeVisible();

        console.log('Product result count:', await results.count());

        console.log('PASS: Search results displayed.');
    }


    // ============================================
    // POSITIVE SEARCH TEST CASES
    // ============================================


    // POS_01: Search using valid product name

    test('POS_01 - Valid product search', async ({ page }) => {

        console.log('Running POS_01...');

        await searchProduct(page, 'Samsung mobile');

        console.log('PASS: Valid product search.');
    });


    // POS_02: Search using Enter key

    test('POS_02 - Search product using Enter key', async ({ page }) => {

        console.log('Running POS_02...');

        const searchBox = page.locator('#twotabsearchtextbox');

        await searchBox.fill('iPhone 16');

        // Press Enter instead of clicking Search
        await searchBox.press('Enter');

        await expect(page).toHaveURL(/\/s\?/);

        const results = page.locator(
            '[data-component-type="s-search-result"]'
        );

        await expect(results.first()).toBeVisible();

        console.log('PASS: Search using Enter key.');
    });


    // POS_03: Search using Electronics category

    test('POS_03 - Search using Electronics category', async ({ page }) => {

        console.log('Running POS_03...');

        const categoryDropdown = page.locator('#searchDropdownBox');

        await categoryDropdown.selectOption({
            label: 'Electronics'
        });

        await searchProduct(page, 'Samsung mobile');

        console.log('PASS: Electronics category search.');
    });


    // POS_04: Change category and search

    test('POS_04 - Change category before searching', async ({ page }) => {

        console.log('Running POS_04...');

        const categoryDropdown = page.locator('#searchDropdownBox');

        // First select Electronics
        await categoryDropdown.selectOption({
            label: 'Electronics'
        });

        console.log('Selected Electronics.');

        // Change category to Books
        await categoryDropdown.selectOption({
            label: 'Books'
        });

        console.log('Changed category to Books.');

        await searchProduct(page, 'Java programming');

        console.log('PASS: Category changed before search.');
    });


    // POS_05: Search using full product name

    test('POS_05 - Full product name search', async ({ page }) => {

        console.log('Running POS_05...');

        await searchProduct(
            page,
            'Samsung Galaxy S25 Ultra 5G'
        );

        console.log('PASS: Full product name search.');
    });


    // POS_06: Search using partial product name

    test('POS_06 - Partial product name search', async ({ page }) => {

        console.log('Running POS_06...');

        await searchProduct(page, 'Samsung Galaxy');

        console.log('PASS: Partial product name search.');
    });


   
test('POS_07 - Inspect autocomplete suggestions', async ({ page }) => {

    console.log('Running POS_07...');

    const searchBox = page.locator('#twotabsearchtextbox');

    // Type a product name to trigger autocomplete
    await searchBox.fill('Samsung');

    // Wait briefly for suggestions to load
    await page.waitForTimeout(2000);

    // Possible Amazon autocomplete containers
    const selectors = [
        '#nav-flyout-searchAjax',
        '.s-suggestion',
        '.s-suggestion-container',
        '[role="listbox"]',
        '[role="option"]'
    ];

    console.log('\n========== AUTOCOMPLETE DEBUG ==========');

    for (const selector of selectors) {

        const locator = page.locator(selector);

        const count = await locator.count();

        console.log(`Selector: ${selector}`);
        console.log(`Count: ${count}`);

        if (count > 0) {
            const visibleCount = await locator.evaluateAll(elements =>
                elements.filter(element => {
                    const style = window.getComputedStyle(element);
                    return style.display !== 'none' &&
                           style.visibility !== 'hidden' &&
                           element.getBoundingClientRect().width > 0;
                }).length
            );

            console.log(`Visible elements: ${visibleCount}`);

            if (visibleCount > 0) {
                console.log(
                    'Text:',
                    (await locator.first().innerText().catch(() => '')).slice(0, 500)
                );
            }
        }
    }

    console.log('========== DEBUG COMPLETED ==========');

});


    // POS_08: Search using mixed uppercase and lowercase

    test('POS_08 - Mixed case product search', async ({ page }) => {

        console.log('Running POS_08...');

        await searchProduct(page, 'sAmSuNg MoBiLe');

        console.log('PASS: Mixed case search.');
    });


    // POS_09: Search with leading and trailing spaces

    test('POS_09 - Search with extra spaces', async ({ page }) => {

        console.log('Running POS_09...');

        const searchBox = page.locator('#twotabsearchtextbox');

        await searchBox.fill('  Samsung mobile  ');

        await searchBox.press('Enter');

        await expect(page).toHaveURL(/\/s\?/);

        const results = page.locator(
            '[data-component-type="s-search-result"]'
        );

        await expect(results.first()).toBeVisible();

        console.log('PASS: Search with leading and trailing spaces.');
    });


    // POS_10: Search product with model number

    test('POS_10 - Product name with model number', async ({ page }) => {

        console.log('Running POS_10...');

        await searchProduct(page, 'iPhone 16 128GB');

        console.log('PASS: Product search with model number.');
    });


    // POS_11: Search using multiple keywords

    test('POS_11 - Search using multiple keywords', async ({ page }) => {

        console.log('Running POS_11...');

        await searchProduct(
            page,
            'Samsung smartphone 256GB 5G'
        );

        console.log('PASS: Multiple keyword search.');
    });


    // POS_12: Search within a specific category

    test('POS_12 - Category specific product search', async ({ page }) => {

        console.log('Running POS_12...');

        const categoryDropdown = page.locator('#searchDropdownBox');

        await categoryDropdown.selectOption({
            label: 'Books'
        });

        await searchProduct(page, 'Java programming books');

        console.log('PASS: Category specific search.');
    });


    // POS_13: Navigate to next results page

    
test('POS_13 - Navigate to next search results page', async ({ page }) => {

    console.log('Running POS_13...');

    await searchProduct(page, 'Laptop');

    // Find next page button
    const nextButton = page.locator('a.s-pagination-next');

    console.log('Next button count:', await nextButton.count());

    if (await nextButton.count() > 0) {

        console.log('Next button visible:', await nextButton.isVisible());

        console.log('Next button enabled:', await nextButton.isEnabled());

        console.log('Next page URL:', await nextButton.getAttribute('href'));

        await nextButton.click();

        await page.waitForLoadState('domcontentloaded');

        console.log('Current URL after clicking:', page.url());

        const results = page.locator(
            '[data-component-type="s-search-result"]'
        );

        await expect(results.first()).toBeVisible();

        console.log('PASS: Next results page opened.');

    } else {

        console.log('FAIL: Next pagination button not found.');

        throw new Error('Amazon next pagination button not found.');
    }

});



    // POS_14: Navigate to previous results page

    test('POS_14 - Navigate to previous search results page', async ({ page }) => {

        console.log('Running POS_14...');

        await searchProduct(page, 'Laptop');

        // Navigate to page 2
        const nextButton = page.locator('a.s-pagination-next');

        await expect(nextButton).toBeVisible();

        await nextButton.click();

        await expect(page).toHaveURL(/page=2/);

        console.log('Navigated to page 2.');

        // Navigate back to page 1
        const previousButton = page.locator(
            'a.s-pagination-previous'
        );

        await expect(previousButton).toBeVisible();

        await previousButton.click();

        await expect(page).toHaveURL(/\/s\?/);

        console.log('PASS: Previous results page opened.');
    });


    // POS_15: Refresh search results page

    test('POS_15 - Refresh search results page', async ({ page }) => {

        console.log('Running POS_15...');

        await searchProduct(page, 'Wireless mouse');

        const oldURL = page.url();

        console.log('Before refresh:', oldURL);

        // Refresh browser page
        await page.reload({
            waitUntil: 'domcontentloaded'
        });

        // Verify URL remains the same
        await expect(page).toHaveURL(oldURL);

        // Verify results remain visible
        const results = page.locator(
            '[data-component-type="s-search-result"]'
        );

        await expect(results.first()).toBeVisible();

        console.log('After refresh:', page.url());

        console.log('PASS: Search results remain after refresh.');
    });

});
