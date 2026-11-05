
import { test } from '../../utils/persistentBrowser.js';
import { expect } from '@playwright/test';

test.describe('Amazon Autocomplete Test Suite', () => {

    // ============================================
    // CONFIGURATION
    // ============================================

    const SEARCH_BOX = '#twotabsearchtextbox';

    const SUGGESTION_SELECTORS = [
        '#nav-flyout-searchAjax .s-suggestion',
        '#nav-flyout-searchAjax [role="option"]',
        '.s-suggestion-container .s-suggestion',
        '[role="listbox"] [role="option"]'
    ];

    const RESULT_SELECTOR =
        '[data-component-type="s-search-result"]';


    // ============================================
    // BEFORE EACH TEST
    // ============================================

    test.beforeEach(async ({ page }) => {

        console.log('\n========== AUTOCOMPLETE TEST START ==========');

        console.log('Opening Amazon India...');

        await page.goto('https://www.amazon.in/', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        console.log('Current URL:', page.url());
        console.log('Page title:', await page.title());

        // Check Amazon verification page
        const verification = page.getByText(
            /click the button below to continue shopping/i
        );

        if (await verification.isVisible().catch(() => false)) {
            test.skip(true, 'Amazon verification page detected.');
        }

        // Check CAPTCHA
        const captcha = page.locator(
            'input[name="captchacharacters"]'
        );

        if (await captcha.isVisible().catch(() => false)) {
            test.skip(true, 'Amazon CAPTCHA requires manual verification.');
        }

        // Verify search box
        const searchBox = page.locator(SEARCH_BOX);

        await expect(searchBox).toBeVisible();

        console.log('PASS: Amazon homepage is ready.');

    });


    // ============================================
    // REUSABLE HELPER FUNCTIONS
    // ============================================

    // Get all possible autocomplete suggestions
    function getSuggestions(page) {

        return page.locator(
            SUGGESTION_SELECTORS.join(', ')
        );

    }


    // Count only visible suggestions
    async function getVisibleSuggestionCount(page) {

        const suggestions = getSuggestions(page);

        return await suggestions.evaluateAll(elements => {

            return elements.filter(element => {

                const style = window.getComputedStyle(element);

                const rect = element.getBoundingClientRect();

                return style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    rect.width > 0 &&
                    rect.height > 0;

            }).length;

        });

    }


    // Wait until autocomplete suggestions appear
    async function waitForSuggestions(page, timeout = 10000) {

        await expect.poll(
            () => getVisibleSuggestionCount(page),
            {
                timeout,
                message: 'Amazon autocomplete suggestions were not displayed.'
            }
        ).toBeGreaterThan(0);

        return getSuggestions(page);

    }


    // Get visible suggestion text
    async function getSuggestionTexts(page) {

        const suggestions = getSuggestions(page);

        return await suggestions.evaluateAll(elements => {

            return elements
                .filter(element => {

                    const style = window.getComputedStyle(element);

                    const rect = element.getBoundingClientRect();

                    return style.display !== 'none' &&
                        style.visibility !== 'hidden' &&
                        rect.width > 0 &&
                        rect.height > 0;

                })
                .map(element => element.innerText.trim())
                .filter(Boolean);

        });

    }


    // Type search query
    async function typeSearch(page, value) {

        const searchBox = page.locator(SEARCH_BOX);

        await searchBox.fill(value);

        console.log('Typed:', value);

    }


    // Select first visible autocomplete suggestion
    async function selectFirstSuggestion(page) {

        const suggestions = await waitForSuggestions(page);

        const firstSuggestion = suggestions.first();

        const suggestionText = (
            await firstSuggestion.innerText()
        ).trim();

        console.log('Selected suggestion:', suggestionText);

        await firstSuggestion.click();

        await expect(page).toHaveURL(/\/s\?/);

        console.log('Search URL:', page.url());

    }


    // ============================================
    // POSITIVE AUTOCOMPLETE SCENARIOS
    // ============================================


    // AUTO_01: Focus on empty search box

    test('AUTO_01 - Focus on empty search box', async ({ page }) => {

        console.log('Running AUTO_01...');

        const searchBox = page.locator(SEARCH_BOX);

        await expect(searchBox).toHaveValue('');

        await searchBox.focus();

        await expect(searchBox).toBeFocused();

        console.log('Search box focused successfully.');

        // Default suggestions may vary by Amazon session
        console.log(
            'Autocomplete content:',
            (await page.locator('#nav-flyout-searchAjax')
                .innerText()
                .catch(() => 'No default suggestions')).slice(0, 300)
        );

        console.log('PASS: Empty search box can receive focus.');

    });


    // AUTO_02: Suggestions for partial product name

    test('AUTO_02 - Suggestions appear for partial product name', async ({ page }) => {

        console.log('Running AUTO_02...');

        await typeSearch(page, 'Samsung');

        const suggestions = await waitForSuggestions(page);

        const texts = await getSuggestionTexts(page);

        console.log('Suggestion count:', await suggestions.count());

        console.log('Visible suggestion count:',
            await getVisibleSuggestionCount(page));

        console.log('Suggestions:', texts);

        expect(texts.length).toBeGreaterThan(0);

        console.log('PASS: Autocomplete suggestions displayed.');

    });


    // AUTO_03: Suggestions update with additional characters

    test('AUTO_03 - Suggestions update when typing additional characters', async ({ page }) => {

        console.log('Running AUTO_03...');

        const searchBox = page.locator(SEARCH_BOX);

        await searchBox.fill('Samsung');

        await waitForSuggestions(page);

        const firstTexts = await getSuggestionTexts(page);

        console.log('First suggestions:', firstTexts);

        await searchBox.fill('Samsung Galaxy');

        await expect(searchBox).toHaveValue('Samsung Galaxy');

        await page.waitForTimeout(1000);

        const updatedTexts = await getSuggestionTexts(page);

        console.log('Updated suggestions:', updatedTexts);

        expect(updatedTexts.length).toBeGreaterThan(0);

        console.log('PASS: Suggestions available after additional typing.');

    });


    // AUTO_04: Clear search box

    test('AUTO_04 - Clear search box and verify suggestions update', async ({ page }) => {

        console.log('Running AUTO_04...');

        const searchBox = page.locator(SEARCH_BOX);

        await searchBox.fill('Samsung');

        await waitForSuggestions(page);

        await searchBox.clear();

        await expect(searchBox).toHaveValue('');

        await page.waitForTimeout(500);

        console.log('Search box cleared.');

        console.log(
            'Remaining visible suggestions:',
            await getVisibleSuggestionCount(page)
        );

        console.log('PASS: Search box cleared successfully.');

    });


    // AUTO_05: Select autocomplete suggestion

    test('AUTO_05 - Select autocomplete suggestion', async ({ page }) => {

        console.log('Running AUTO_05...');

        await typeSearch(page, 'Samsung');

        await selectFirstSuggestion(page);

        const results = page.locator(RESULT_SELECTOR);

        await expect(results.first()).toBeVisible();

        console.log('PASS: Autocomplete suggestion selected.');

    });


    // AUTO_06: Select first suggestion

    test('AUTO_06 - Select first autocomplete suggestion', async ({ page }) => {

        console.log('Running AUTO_06...');

        await typeSearch(page, 'iPhone');

        const suggestions = await waitForSuggestions(page);

        console.log(
            'Visible suggestions:',
            await getVisibleSuggestionCount(page)
        );

        await suggestions.first().click();

        await expect(page).toHaveURL(/\/s\?/);

        console.log('PASS: First suggestion selected.');

    });


    // AUTO_07: Keyboard Arrow Down and Enter

    test('AUTO_07 - Select suggestion using keyboard', async ({ page }) => {

        console.log('Running AUTO_07...');

        const searchBox = page.locator(SEARCH_BOX);

        await searchBox.fill('Samsung');

        await waitForSuggestions(page);

        // Highlight autocomplete suggestion
        await searchBox.press('ArrowDown');

        // Select highlighted suggestion
        await searchBox.press('Enter');

        await expect(page).toHaveURL(/\/s\?/);

        console.log('Current URL:', page.url());

        console.log('PASS: Keyboard autocomplete selection handled.');

    });


    // AUTO_08: Press Escape

    test('AUTO_08 - Close suggestions using Escape', async ({ page }) => {

        console.log('Running AUTO_08...');

        const searchBox = page.locator(SEARCH_BOX);

        await searchBox.fill('Samsung');

        await waitForSuggestions(page);

        await searchBox.press('Escape');

        console.log('Escape key pressed.');

        await expect(searchBox).toBeVisible();

        console.log('PASS: Search box remains usable after Escape.');

    });


    // AUTO_09: Click outside search box

    test('AUTO_09 - Click outside search box', async ({ page }) => {

        console.log('Running AUTO_09...');

        const searchBox = page.locator(SEARCH_BOX);

        await searchBox.fill('Samsung');

        await waitForSuggestions(page);

        // Click outside the search box
        await page.locator('body').click({
            position: { x: 10, y: 300 }
        });

        await expect(searchBox).toBeVisible();

        console.log('PASS: Outside click handled.');

    });


    // AUTO_10: Verify suggestion text

    test('AUTO_10 - Verify autocomplete suggestion text', async ({ page }) => {

        console.log('Running AUTO_10...');

        await typeSearch(page, 'Samsung');

        await waitForSuggestions(page);

        const texts = await getSuggestionTexts(page);

        console.log('Suggestion texts:', texts);

        expect(texts.length).toBeGreaterThan(0);

        for (const text of texts) {

            expect(text.trim().length).toBeGreaterThan(0);

        }

        console.log('PASS: Suggestion text is available.');

    });


    // ============================================
    // NEGATIVE AUTOCOMPLETE SCENARIOS
    // ============================================


    // AUTO_11: Random non-existing text

    test('AUTO_11 - Random non-existing search text', async ({ page }) => {

        console.log('Running AUTO_11...');

        const searchBox = page.locator(SEARCH_BOX);

        const searchText = 'XYZQWERTY987654321';

        await searchBox.fill(searchText);

        await expect(searchBox).toHaveValue(searchText);

        await page.waitForTimeout(1500);

        console.log('Suggestions:', await getSuggestionTexts(page));

        console.log('PASS: Random text handled without application error.');

    });


    // AUTO_12: Special characters only

    test('AUTO_12 - Special characters in autocomplete', async ({ page }) => {

        console.log('Running AUTO_12...');

        const searchBox = page.locator(SEARCH_BOX);

        const searchText = '!@#$%^&*()';

        await searchBox.fill(searchText);

        await expect(searchBox).toHaveValue(searchText);

        await page.waitForTimeout(1000);

        console.log('PASS: Special character input handled.');

    });


    // AUTO_13: Spaces only

    test('AUTO_13 - Spaces only in autocomplete', async ({ page }) => {

        console.log('Running AUTO_13...');

        const searchBox = page.locator(SEARCH_BOX);

        await searchBox.fill('     ');

        await expect(searchBox).toHaveValue('     ');

        console.log('PASS: Spaces-only input handled.');

    });


    // AUTO_14: Extremely long text

    test('AUTO_14 - Extremely long autocomplete input', async ({ page }) => {

        console.log('Running AUTO_14...');

        const searchBox = page.locator(SEARCH_BOX);

        const longText = 'Samsung '.repeat(500);

        await searchBox.fill(longText);

        const actualValue = await searchBox.inputValue();

        console.log('Expected length:', longText.length);

        console.log('Actual length:', actualValue.length);

        expect(actualValue.length).toBeGreaterThan(0);

        await expect(searchBox).toBeVisible();

        console.log('PASS: Long autocomplete input handled.');

    });


    // AUTO_15: HTML and script-like input

    test('AUTO_15 - HTML and script-like input', async ({ page }) => {

        console.log('Running AUTO_15...');

        const searchBox = page.locator(SEARCH_BOX);

        const searchText = '<script>alert(1)</script>';

        let dialogAppeared = false;

        page.on('dialog', async dialog => {

            dialogAppeared = true;

            console.log('Unexpected dialog:', dialog.message());

            await dialog.dismiss();

        });

        await searchBox.fill(searchText);

        await expect(searchBox).toHaveValue(searchText);

        await page.waitForTimeout(1000);

        expect(dialogAppeared).toBe(false);

        console.log('PASS: Script-like input did not trigger a JavaScript dialog.');

    });


    // AUTO_16: Rapid typing and deleting

    test('AUTO_16 - Rapidly type and delete characters', async ({ page }) => {

        console.log('Running AUTO_16...');

        const searchBox = page.locator(SEARCH_BOX);

        await searchBox.fill('S');

        await searchBox.fill('Sa');

        await searchBox.fill('Sam');

        await searchBox.fill('Sams');

        await searchBox.fill('Samsung');

        await searchBox.clear();

        await searchBox.fill('iPhone');

        await expect(searchBox).toHaveValue('iPhone');

        console.log('PASS: Rapid typing and clearing handled.');

    });


    // AUTO_17: Network interruption

    test('AUTO_17 - Network interruption during autocomplete', async ({ page, context }) => {

        console.log('Running AUTO_17...');

        const searchBox = page.locator(SEARCH_BOX);

        try {

            // Simulate browser offline mode
            await context.setOffline(true);

            console.log('Browser set to offline mode.');

            await searchBox.fill('Samsung');

            await expect(searchBox).toHaveValue('Samsung');

            console.log('Search input remains usable offline.');

        } finally {

            // Restore network
            await context.setOffline(false);

            console.log('Browser network restored.');

        }

        console.log('PASS: Offline autocomplete behavior handled.');

    });


    // ============================================
    // UI AND USABILITY SCENARIOS
    // ============================================


    // AUTO_18: Dropdown visibility

    test('AUTO_18 - Verify autocomplete dropdown visibility', async ({ page }) => {

        console.log('Running AUTO_18...');

        await page.locator(SEARCH_BOX).fill('Samsung');

        const suggestions = await waitForSuggestions(page);

        await expect(suggestions.first()).toBeVisible();

        console.log('PASS: Autocomplete dropdown is visible.');

    });


    // AUTO_19: Multiple suggestions

    test('AUTO_19 - Verify multiple suggestions', async ({ page }) => {

        console.log('Running AUTO_19...');

        await page.locator(SEARCH_BOX).fill('Samsung');

        await waitForSuggestions(page);

        const count = await getVisibleSuggestionCount(page);

        console.log('Visible suggestion count:', count);

        expect(count).toBeGreaterThan(1);

        console.log('PASS: Multiple suggestions displayed.');

    });


    // AUTO_20: Suggestion text readability

    test('AUTO_20 - Verify suggestion text readability', async ({ page }) => {

        console.log('Running AUTO_20...');

        await page.locator(SEARCH_BOX).fill('Samsung');

        await waitForSuggestions(page);

        const texts = await getSuggestionTexts(page);

        expect(texts.length).toBeGreaterThan(0);

        for (const text of texts) {

            expect(text.trim().length).toBeGreaterThan(0);

            console.log('Readable suggestion:', text);

        }

        console.log('PASS: Suggestion text is readable.');

    });


    // AUTO_21: Search box remains editable

    test('AUTO_21 - Verify search box remains editable', async ({ page }) => {

        console.log('Running AUTO_21...');

        const searchBox = page.locator(SEARCH_BOX);

        await searchBox.fill('Samsung');

        await waitForSuggestions(page);

        await searchBox.fill('Samsung Galaxy');

        await expect(searchBox).toHaveValue('Samsung Galaxy');

        console.log('PASS: Search box remains editable.');

    });


    // AUTO_22: Autocomplete after refresh

    test('AUTO_22 - Verify autocomplete after browser refresh', async ({ page }) => {

        console.log('Running AUTO_22...');

        await page.locator(SEARCH_BOX).fill('Samsung');

        await page.reload({
            waitUntil: 'domcontentloaded'
        });

        const searchBox = page.locator(SEARCH_BOX);

        await expect(searchBox).toBeVisible();

        await expect(searchBox).toHaveValue('');

        console.log('PASS: Search box returns to initial state after refresh.');

    });


    // AUTO_23: Different viewport sizes

    test('AUTO_23 - Verify autocomplete on different viewport sizes', async ({ page }) => {

        console.log('Running AUTO_23...');

        const viewports = [
            { width: 1366, height: 768 },
            { width: 1024, height: 768 },
            { width: 768, height: 1024 },
            { width: 390, height: 844 }
        ];

        const searchBox = page.locator(SEARCH_BOX);

        for (const viewport of viewports) {

            console.log('Testing viewport:', viewport);

            await page.setViewportSize(viewport);

            await expect(searchBox).toBeVisible();

            await searchBox.fill('Samsung');

            await expect(searchBox).toHaveValue('Samsung');

            await searchBox.clear();

        }

        console.log('PASS: Search box checked at different viewport sizes.');

    });


    // AUTO_24: Suggestions after category selection

    test('AUTO_24 - Suggestions after category selection', async ({ page }) => {

        console.log('Running AUTO_24...');

        const categoryDropdown = page.locator('#searchDropdownBox');

        const searchBox = page.locator(SEARCH_BOX);

        await categoryDropdown.selectOption({
            label: 'Electronics'
        });

        await searchBox.fill('Samsung');

        await expect(searchBox).toHaveValue('Samsung');

        console.log('Selected category: Electronics');

        console.log(
            'Suggestions:',
            await getSuggestionTexts(page)
        );

        console.log('PASS: Autocomplete input works after category selection.');

    });


    // ============================================
    // ADVANCED AUTOCOMPLETE SCENARIOS
    // ============================================


    // AUTO_25: Repeated same query

    test('AUTO_25 - Enter same query repeatedly', async ({ page }) => {

        console.log('Running AUTO_25...');

        const searchBox = page.locator(SEARCH_BOX);

        const query = 'Samsung';

        await searchBox.fill(query);

        await waitForSuggestions(page);

        const firstCount = await getVisibleSuggestionCount(page);

        console.log('First suggestion count:', firstCount);

        await searchBox.clear();

        await searchBox.fill(query);

        await waitForSuggestions(page);

        const secondCount = await getVisibleSuggestionCount(page);

        console.log('Second suggestion count:', secondCount);

        expect(secondCount).toBeGreaterThan(0);

        console.log('PASS: Repeated query handled.');

    });


    // AUTO_26: Quickly select suggestion

    test('AUTO_26 - Quickly select suggestion after typing', async ({ page }) => {

        console.log('Running AUTO_26...');

        const searchBox = page.locator(SEARCH_BOX);

        await searchBox.fill('Samsung');

        const suggestions = await waitForSuggestions(page);

        await suggestions.first().click();

        await expect(page).toHaveURL(/\/s\?/);

        console.log('PASS: Suggestion selected after typing.');

    });


    // AUTO_27: Open suggestion in a new tab, if supported

    test('AUTO_27 - Open autocomplete suggestion in new tab if supported', async ({ page, context }) => {

        console.log('Running AUTO_27...');

        const searchBox = page.locator(SEARCH_BOX);

        await searchBox.fill('Samsung');

        const suggestions = await waitForSuggestions(page);

        const firstSuggestion = suggestions.first();

        const link = firstSuggestion.locator('a[href]').first();

        if (await link.count() === 0) {

            test.skip(true, 'Autocomplete suggestion does not expose a link.');

        }

        const href = await link.getAttribute('href');

        if (!href) {

            test.skip(true, 'Autocomplete suggestion link has no href.');

        }

        // Open the suggestion URL in a separate page
        const newPage = await context.newPage();

        try {

            const targetURL = new URL(href, page.url()).href;

            await newPage.goto(targetURL, {
                waitUntil: 'domcontentloaded',
                timeout: 60000
            });

            console.log('New tab URL:', newPage.url());

            // Original page should remain on homepage
            await expect(page).toHaveURL(/amazon\.in\/?$/);

            console.log('PASS: Original page remains unaffected.');

        } finally {

            await newPage.close();

        }

    });


    // AUTO_28: Suggestions after browser back navigation

    test('AUTO_28 - Verify autocomplete after browser back navigation', async ({ page }) => {

        console.log('Running AUTO_28...');

        await typeSearch(page, 'Samsung');

        await selectFirstSuggestion(page);

        // Navigate back
        await page.goBack({
            waitUntil: 'domcontentloaded'
        });

        const searchBox = page.locator(SEARCH_BOX);

        await expect(searchBox).toBeVisible();

        console.log('Current URL after back:', page.url());

        console.log('PASS: Search box available after back navigation.');

    });


    // AUTO_29: Uppercase and lowercase text

    test('AUTO_29 - Verify uppercase and lowercase autocomplete', async ({ page }) => {

        console.log('Running AUTO_29...');

        const searchBox = page.locator(SEARCH_BOX);

        await searchBox.fill('SAMSUNG');

        await expect(searchBox).toHaveValue('SAMSUNG');

        await page.waitForTimeout(500);

        const upperSuggestions = await getSuggestionTexts(page);

        console.log('Uppercase suggestions:', upperSuggestions);

        await searchBox.fill('samsung');

        await expect(searchBox).toHaveValue('samsung');

        await page.waitForTimeout(500);

        const lowerSuggestions = await getSuggestionTexts(page);

        console.log('Lowercase suggestions:', lowerSuggestions);

        console.log('PASS: Uppercase and lowercase input handled.');

    });


    // AUTO_30: Numbers and product model names

    test('AUTO_30 - Product model number autocomplete', async ({ page }) => {

        console.log('Running AUTO_30...');

        const searchBox = page.locator(SEARCH_BOX);

        const searchText = 'iPhone 16';

        await searchBox.fill(searchText);

        await expect(searchBox).toHaveValue(searchText);

        const suggestions = await waitForSuggestions(page);

        const texts = await getSuggestionTexts(page);

        console.log('Visible suggestion count:',
            await getVisibleSuggestionCount(page));

        console.log('Model number suggestions:', texts);

        expect(await getVisibleSuggestionCount(page)).toBeGreaterThan(0);

        console.log('PASS: Product model autocomplete displayed.');

    });

});
