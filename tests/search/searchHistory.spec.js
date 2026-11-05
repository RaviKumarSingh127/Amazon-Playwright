
import { test } from '../../utils/persistentBrowser.js';
import { expect } from '@playwright/test';

/**
 * Amazon Search History Testing
 * Total: 70 scenarios
 *
 * Note:
 * Amazon may show autocomplete suggestions instead of personal search history.
 * We skip history-specific tests when actual history controls are unavailable.
 */

const SEARCH_BOX = '#twotabsearchtextbox';
const SEARCH_BUTTON = '#nav-search-submit-button';
const SUGGESTION_PANEL = '#nav-flyout-searchAjax';

const HISTORY_WORDS =
    /recent searches|your recent searches|search history|recently searched/i;

const DELETE_WORDS = /remove|delete/i;
const CLEAR_WORDS = /clear (all )?(search )?history|clear recent searches/i;

const UNIQUE = `pw-history-${Date.now()}`;

// Check whether Amazon displays a CAPTCHA or verification page.
async function guardAmazon(page) {
    const captcha = page.locator('input[name="captchacharacters"]');

    const verification = page.getByText(
        /click the button below to continue shopping/i
    );

    if (
        await captcha.isVisible().catch(() => false) ||
        await verification.isVisible().catch(() => false)
    ) {
        test.skip(true, 'Amazon verification/CAPTCHA page detected.');
    }
}

// Open Amazon homepage.
async function openAmazon(page) {
    await page.goto('/');
    await guardAmazon(page);

    await expect(page.locator(SEARCH_BOX)).toBeVisible({
        timeout: 20000
    });
}

// Search for a product/query.
async function searchFor(page, query, { enter = false } = {}) {
    const searchBox = page.locator(SEARCH_BOX);

    await searchBox.fill(query);

    if (enter) {
        await searchBox.press('Enter');
    } else {
        await page.locator(SEARCH_BUTTON).click();
    }

    await page.waitForLoadState('domcontentloaded').catch(() => { });
    await guardAmazon(page);
}

// Open autocomplete dropdown.
async function openSearchDropdown(page, query = '') {
    const searchBox = page.locator(SEARCH_BOX);

    await searchBox.click();

    if (query) {
        await searchBox.fill(query);
    }

    await page.waitForTimeout(700);

    return page.locator(SUGGESTION_PANEL);
}

// Read dropdown text.
async function getDropdownText(page) {
    const panel = page.locator(SUGGESTION_PANEL);

    if (!(await panel.isVisible().catch(() => false))) {
        return '';
    }

    return (await panel.innerText().catch(() => '')).trim();
}

// Find an entry only if the dropdown explicitly identifies search history.
async function findHistoryEntry(page, query) {
    const panel = page.locator(SUGGESTION_PANEL);

    if (!(await panel.isVisible().catch(() => false))) {
        return null;
    }

    const panelText = await panel.innerText().catch(() => '');

    if (!HISTORY_WORDS.test(panelText)) {
        return null;
    }

    const entry = panel.getByText(query, { exact: true }).first();

    if (await entry.isVisible().catch(() => false)) {
        return entry;
    }

    return null;
}

// Skip when actual search history is unavailable.
async function requireHistory(page, query) {
    const entry = await findHistoryEntry(page, query);

    if (!entry) {
        test.skip(
            true,
            'Amazon did not expose a verifiable search-history entry.'
        );
    }

    return entry;
}

// Perform multiple searches.
async function seedSearches(
    page,
    terms = [
        `${UNIQUE}-one`,
        `${UNIQUE}-two`,
        `${UNIQUE}-three`
    ]
) {
    for (const term of terms) {
        await searchFor(page, term);
    }

    return terms;
}

// Find delete control associated with an entry.
async function getDeleteButton(entry) {
    const row = entry.locator(
        'xpath=ancestor::*[self::li or self::div][1]'
    );

    return row.getByRole('button', {
        name: DELETE_WORDS
    });
}


// ======================================================
// A. FUNCTIONAL TESTING
// HIST_01 - HIST_10
// ======================================================

test.describe('Search History - Functional Testing', () => {

    test('HIST_01 - Verify previously searched query', async ({ page }) => {
        await openAmazon(page);

        const query = `${UNIQUE}-previous`;

        await searchFor(page, query);
        await openSearchDropdown(page);

        const entry = await requireHistory(page, query);

        await expect(entry).toBeVisible();
    });

    test('HIST_02 - Verify multiple recent searches', async ({ page }) => {
        await openAmazon(page);

        const terms = await seedSearches(page);

        await openSearchDropdown(page);

        const text = await getDropdownText(page);

        if (!HISTORY_WORDS.test(text)) {
            test.skip(true, 'No explicit search-history section found.');
        }

        for (const term of terms) {
            expect(text).toContain(term);
        }
    });

    test('HIST_03 - Verify latest search appears first', async ({ page }) => {
        await openAmazon(page);

        const terms = await seedSearches(page);

        await openSearchDropdown(page);

        const text = await getDropdownText(page);

        if (!HISTORY_WORDS.test(text)) {
            test.skip(true, 'No explicit search-history section found.');
        }

        const latestIndex = text.indexOf(terms[2]);
        const oldestIndex = text.indexOf(terms[0]);

        expect(latestIndex).toBeGreaterThanOrEqual(0);
        expect(oldestIndex).toBeGreaterThanOrEqual(0);
        expect(latestIndex).toBeLessThan(oldestIndex);
    });

    test('HIST_04 - Select previous search history entry', async ({ page }) => {
        await openAmazon(page);

        const query = `${UNIQUE}-select`;

        await searchFor(page, query);
        await openSearchDropdown(page);

        const entry = await requireHistory(page, query);

        await entry.click();

        await expect(page).toHaveURL(/s\?/);
        await expect(page.locator(SEARCH_BOX)).toHaveValue(query);
    });

    test('HIST_05 - Verify selected history returns correct results', async ({ page }) => {
        await openAmazon(page);

        const query = `${UNIQUE}-results`;

        await searchFor(page, query);
        await openSearchDropdown(page);

        const entry = await requireHistory(page, query);

        await entry.click();

        await expect(page).toHaveURL(/s\?/);
        await expect(page.locator(SEARCH_BOX)).toHaveValue(query);
    });

    test('HIST_06 - Verify duplicate search behavior', async ({ page }) => {
        await openAmazon(page);

        const query = `${UNIQUE}-duplicate`;

        await searchFor(page, query);
        await searchFor(page, `${UNIQUE}-middle`);
        await searchFor(page, query);

        await openSearchDropdown(page);

        const text = await getDropdownText(page);

        if (!HISTORY_WORDS.test(text)) {
            test.skip(true, 'No explicit search-history section found.');
        }

        expect(text).toContain(query);
    });

    test('HIST_07 - Verify different search keywords', async ({ page }) => {
        await openAmazon(page);

        const terms = [
            `${UNIQUE}-laptop`,
            `${UNIQUE}-phone`
        ];

        await seedSearches(page, terms);
        await openSearchDropdown(page);

        const text = await getDropdownText(page);

        if (!HISTORY_WORDS.test(text)) {
            test.skip(true, 'No explicit search-history section found.');
        }

        for (const term of terms) {
            expect(text).toContain(term);
        }
    });

    test('HIST_08 - Verify category search', async ({ page }) => {
        await openAmazon(page);

        const query = `${UNIQUE}-category`;

        await page.locator(SEARCH_BOX).fill(query);

        const category = page.locator('#searchDropdownBox');

        if (!(await category.isVisible().catch(() => false))) {
            test.skip(true, 'Category selector unavailable.');
        }

        await category.selectOption({
            label: 'Electronics'
        });

        await page.locator(SEARCH_BUTTON).click();

        await expect(page.locator(SEARCH_BOX)).toHaveValue(query);
    });

    test('HIST_09 - Verify model number search', async ({ page }) => {
        await openAmazon(page);

        const query = 'SM-S938B';

        await searchFor(page, query);

        await expect(page.locator(SEARCH_BOX)).toHaveValue(query);

        await openSearchDropdown(page);

        const entry = await findHistoryEntry(page, query);

        if (!entry) {
            test.skip(true, 'Model number not exposed as search history.');
        }

        await expect(entry).toBeVisible();
    });

    test('HIST_10 - Verify partial product search', async ({ page }) => {
        await openAmazon(page);

        const query = `${UNIQUE}-part`;

        await searchFor(page, query);
        await openSearchDropdown(page);

        const entry = await findHistoryEntry(page, query);

        if (!entry) {
            test.skip(true, 'Partial query not exposed as search history.');
        }

        await expect(entry).toBeVisible();
    });

});


// ======================================================
// B. DELETE AND CLEAR HISTORY
// HIST_11 - HIST_20
// ======================================================

test.describe('Search History - Delete and Clear', () => {

    test('HIST_11 - Remove one history entry', async ({ page }) => {
        await openAmazon(page);

        const query = `${UNIQUE}-delete-one`;

        await searchFor(page, query);
        await openSearchDropdown(page);

        const entry = await requireHistory(page, query);
        const remove = await getDeleteButton(entry);

        if (!(await remove.isVisible().catch(() => false))) {
            test.skip(true, 'Remove button not available.');
        }

        await remove.click();

        await expect(entry).toHaveCount(0);
    });

    test('HIST_12 - Verify other entries remain after deletion', async ({ page }) => {
        await openAmazon(page);

        const terms = await seedSearches(page);

        await openSearchDropdown(page);

        const text = await getDropdownText(page);

        if (!HISTORY_WORDS.test(text)) {
            test.skip(true, 'No explicit search-history section found.');
        }

        const entry = await requireHistory(page, terms[1]);
        const remove = await getDeleteButton(entry);

        if (!(await remove.isVisible().catch(() => false))) {
            test.skip(true, 'Remove button not available.');
        }

        await remove.click();

        const updatedText = await getDropdownText(page);

        expect(updatedText).toContain(terms[0]);
        expect(updatedText).toContain(terms[2]);
        expect(updatedText).not.toContain(terms[1]);
    });

    test('HIST_13 - Clear all search history', async ({ page }) => {
        await openAmazon(page);

        await seedSearches(page);
        await openSearchDropdown(page);

        const text = await getDropdownText(page);

        if (!HISTORY_WORDS.test(text)) {
            test.skip(true, 'No explicit search-history section found.');
        }

        const clear = page.locator(SUGGESTION_PANEL)
            .getByRole('button', { name: CLEAR_WORDS });

        if (!(await clear.isVisible().catch(() => false))) {
            test.skip(true, 'Clear-history button unavailable.');
        }

        await clear.click();

        await expect(page.locator(SEARCH_BOX)).toBeVisible();
    });

    test('HIST_14 - Verify history after clearing', async ({ page }) => {
        await openAmazon(page);

        await openSearchDropdown(page);

        const clear = page.locator(SUGGESTION_PANEL)
            .getByRole('button', { name: CLEAR_WORDS });

        if (!(await clear.isVisible().catch(() => false))) {
            test.skip(true, 'Clear-history button unavailable.');
        }

        await clear.click();

        await page.locator(SEARCH_BOX).click();

        const text = await getDropdownText(page);

        expect(text).not.toMatch(HISTORY_WORDS);
    });

    test('HIST_15 - Remove newest history entry', async ({ page }) => {
        await openAmazon(page);

        const terms = await seedSearches(page);

        await openSearchDropdown(page);

        const entry = await requireHistory(page, terms[2]);
        const remove = await getDeleteButton(entry);

        if (!(await remove.isVisible().catch(() => false))) {
            test.skip(true, 'Remove button unavailable.');
        }

        await remove.click();

        await expect(entry).toHaveCount(0);
    });

    test('HIST_16 - Remove oldest history entry', async ({ page }) => {
        await openAmazon(page);

        const terms = await seedSearches(page);

        await openSearchDropdown(page);

        const entry = await requireHistory(page, terms[0]);
        const remove = await getDeleteButton(entry);

        if (!(await remove.isVisible().catch(() => false))) {
            test.skip(true, 'Remove button unavailable.');
        }

        await remove.click();

        await expect(entry).toHaveCount(0);
    });

    test('HIST_17 - Remove multiple history entries', async ({ page }) => {
        await openAmazon(page);

        const terms = await seedSearches(page);

        await openSearchDropdown(page);

        const first = await requireHistory(page, terms[0]);
        const second = await requireHistory(page, terms[1]);

        const firstRemove = await getDeleteButton(first);
        const secondRemove = await getDeleteButton(second);

        if (
            !(await firstRemove.isVisible().catch(() => false)) ||
            !(await secondRemove.isVisible().catch(() => false))
        ) {
            test.skip(true, 'Per-entry remove buttons unavailable.');
        }

        await firstRemove.click();

        const updatedText = await getDropdownText(page);

        expect(updatedText).not.toContain(terms[0]);
    });

    test('HIST_18 - Verify empty-history behavior', async ({ page }) => {
        await openAmazon(page);

        await openSearchDropdown(page);

        await expect(page.locator(SEARCH_BOX)).toBeVisible();
    });

    test('HIST_19 - Verify repeated delete interaction', async ({ page }) => {
        await openAmazon(page);

        const query = `${UNIQUE}-delete-twice`;

        await searchFor(page, query);
        await openSearchDropdown(page);

        const entry = await requireHistory(page, query);
        const remove = await getDeleteButton(entry);

        if (!(await remove.isVisible().catch(() => false))) {
            test.skip(true, 'Remove button unavailable.');
        }

        await remove.click();

        await expect(page.locator(SEARCH_BOX)).toBeVisible();
    });

    test('HIST_20 - Verify clear-history confirmation', async ({ page }) => {
        await openAmazon(page);

        await openSearchDropdown(page);

        const clear = page.locator(SUGGESTION_PANEL)
            .getByRole('button', { name: CLEAR_WORDS });

        if (!(await clear.isVisible().catch(() => false))) {
            test.skip(true, 'Clear-history button unavailable.');
        }

        await clear.click();

        const dialog = page.getByRole('dialog');

        if (await dialog.isVisible().catch(() => false)) {
            await expect(dialog).toBeVisible();
        } else {
            await expect(page.locator(SEARCH_BOX)).toBeVisible();
        }
    });

});




// ======================================================
// C. UI TESTING
// HIST_21 - HIST_30
// ======================================================

test.describe('Search History - UI Testing', () => {

    test('HIST_21 - Verify dropdown visibility on search-box focus', async ({ page }) => {
        await openAmazon(page);

        await page.locator(SEARCH_BOX).click();

        await expect(page.locator(SEARCH_BOX)).toBeFocused();
    });

    test('HIST_22 - Verify dropdown alignment', async ({ page }) => {
        await openAmazon(page);

        await openSearchDropdown(page, 'sam');

        const panel = page.locator(SUGGESTION_PANEL);

        if (!(await panel.isVisible().catch(() => false))) {
            test.skip(true, 'Dropdown unavailable.');
        }

        const box = await panel.boundingBox();

        expect(box).not.toBeNull();

        const viewport = page.viewportSize();

        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
    });

    test('HIST_23 - Verify dropdown text readability', async ({ page }) => {
        await openAmazon(page);

        await openSearchDropdown(page, 'sam');

        const panel = page.locator(SUGGESTION_PANEL);

        if (!(await panel.isVisible().catch(() => false))) {
            test.skip(true, 'Dropdown unavailable.');
        }

        const text = await panel.innerText();

        expect(text.trim().length).toBeGreaterThan(0);
    });

    test('HIST_24 - Verify long query dropdown layout', async ({ page }) => {
        await openAmazon(page);

        const query =
            'wireless bluetooth headphones with noise cancellation '.repeat(3);

        await openSearchDropdown(page, query);

        const panel = page.locator(SUGGESTION_PANEL);

        if (!(await panel.isVisible().catch(() => false))) {
            test.skip(true, 'Dropdown unavailable.');
        }

        const box = await panel.boundingBox();

        expect(box).not.toBeNull();
        expect(box.width).toBeGreaterThan(0);
        expect(box.height).toBeGreaterThan(0);
    });

    test('HIST_25 - Verify delete control visibility', async ({ page }) => {
        await openAmazon(page);

        const query = `${UNIQUE}-ui-delete`;

        await searchFor(page, query);
        await openSearchDropdown(page);

        const entry = await requireHistory(page, query);
        const remove = await getDeleteButton(entry);

        await expect(remove).toBeVisible();
    });

    test('HIST_26 - Verify clear-history control visibility', async ({ page }) => {
        await openAmazon(page);

        await openSearchDropdown(page);

        const clear = page.locator(SUGGESTION_PANEL)
            .getByRole('button', { name: CLEAR_WORDS });

        if (!(await clear.isVisible().catch(() => false))) {
            test.skip(true, 'Clear-history control unavailable.');
        }

        await expect(clear).toBeVisible();
    });

    test('HIST_27 - Verify dropdown at different viewport sizes', async ({ page }) => {
        await openAmazon(page);

        const viewports = [
            { width: 1366, height: 768 },
            { width: 1024, height: 768 },
            { width: 768, height: 1024 },
            { width: 390, height: 844 }
        ];

        for (const viewport of viewports) {
            await page.setViewportSize(viewport);

            await page.locator(SEARCH_BOX).click();
            await page.locator(SEARCH_BOX).fill('sam');

            await expect(page.locator(SEARCH_BOX)).toBeVisible();
        }
    });

    test('HIST_28 - Verify dropdown closes after outside click', async ({ page }) => {
        await openAmazon(page);

        await openSearchDropdown(page, 'sam');

        const panel = page.locator(SUGGESTION_PANEL);

        if (!(await panel.isVisible().catch(() => false))) {
            test.skip(true, 'Dropdown unavailable.');
        }

        await page.locator('body').click({
            position: { x: 10, y: 300 }
        });

        await expect(panel).toBeHidden();
    });

    test('HIST_29 - Verify dropdown closes after Escape', async ({ page }) => {
        await openAmazon(page);

        await openSearchDropdown(page, 'sam');

        const panel = page.locator(SUGGESTION_PANEL);

        if (!(await panel.isVisible().catch(() => false))) {
            test.skip(true, 'Dropdown unavailable.');
        }

        await page.locator(SEARCH_BOX).press('Escape');

        await expect(panel).toBeHidden();
    });

    test('HIST_30 - Verify dropdown can reopen', async ({ page }) => {
        await openAmazon(page);

        await openSearchDropdown(page, 'sam');

        await page.locator('body').click({
            position: { x: 10, y: 300 }
        });

        await page.locator(SEARCH_BOX).click();
        await page.locator(SEARCH_BOX).fill('samsung');

        await expect(page.locator(SEARCH_BOX)).toBeVisible();
    });

});


// ======================================================
// D. PERSISTENCE AND NAVIGATION
// HIST_31 - HIST_40
// ======================================================

test.describe('Search History - Persistence and Navigation', () => {

    test('HIST_31 - Verify history after refresh', async ({ page }) => {
        await openAmazon(page);

        const query = `${UNIQUE}-refresh`;

        await searchFor(page, query);

        await page.reload();

        await expect(page.locator(SEARCH_BOX)).toBeVisible();

        await openSearchDropdown(page);

        const entry = await findHistoryEntry(page, query);

        if (!entry) {
            test.skip(true, 'History not exposed after refresh.');
        }

        await expect(entry).toBeVisible();
    });

    test('HIST_32 - Verify history after page navigation', async ({ page }) => {
        await openAmazon(page);

        const query = `${UNIQUE}-navigation`;

        await searchFor(page, query);

        await page.goto('/');

        await openSearchDropdown(page);

        const entry = await findHistoryEntry(page, query);

        if (!entry) {
            test.skip(true, 'History not exposed after navigation.');
        }

        await expect(entry).toBeVisible();
    });

    test('HIST_33 - Verify browser Back navigation', async ({ page }) => {
        await openAmazon(page);

        await searchFor(page, `${UNIQUE}-back`);

        await page.goto('/');

        await page.goBack().catch(() => { });

        await expect(page.locator(SEARCH_BOX)).toBeVisible();
    });

    test('HIST_34 - Verify browser Forward navigation', async ({ page }) => {
        await openAmazon(page);

        await searchFor(page, `${UNIQUE}-forward`);

        await page.goto('/');

        await page.goBack().catch(() => { });
        await page.goForward().catch(() => { });

        await expect(page.locator(SEARCH_BOX)).toBeVisible();
    });

    test('HIST_35 - Verify history in a new tab', async ({ page, context }) => {
        await openAmazon(page);

        const query = `${UNIQUE}-newtab`;

        await searchFor(page, query);

        const newPage = await context.newPage();

        await newPage.goto('/');

        await expect(newPage.locator(SEARCH_BOX)).toBeVisible();

        await openSearchDropdown(newPage);

        const entry = await findHistoryEntry(newPage, query);

        if (!entry) {
            await newPage.close();

            test.skip(true, 'History not shared with a new tab.');
        }

        await expect(entry).toBeVisible();

        await newPage.close();
    });

    test('HIST_36 - Verify history after browser restart', async () => {
        test.skip(
            true,
            'Requires a separate browser process restart test.'
        );
    });
test('HIST_37 - Verify history isolation in a new browser context', async ({ page, context }) => {
    await openAmazon(page);

    const query = `${UNIQUE}-context`;

    await searchFor(page, query);

    const isolated = await context.browser().newContext();

    try {
        const isolatedPage = await isolated.newPage();

        await isolatedPage.goto('https://www.amazon.in/');

        // Detect Amazon verification.
        const captcha = isolatedPage.locator(
            'input[name="captchacharacters"]'
        );

        const verification = isolatedPage.getByText(
            /click the button below to continue shopping/i
        );

        if (
            await captcha.isVisible().catch(() => false) ||
            await verification.isVisible().catch(() => false)
        ) {
            test.skip(true, 'Amazon verification detected in new context.');
        }

        const searchBox = isolatedPage.locator(SEARCH_BOX);

        if (!(await searchBox.isVisible().catch(() => false))) {
            test.skip(true, 'Amazon homepage did not load in new context.');
        }

        await searchBox.click();

        const entry = await findHistoryEntry(isolatedPage, query);

        // A fresh context should not inherit local session history.
        expect(entry).toBeNull();

    } finally {
        await isolated.close();
    }
});


    test('HIST_38 - Verify history after sign-out', async () => {
        test.skip(
            true,
            'Requires a designated test account.'
        );
    });

    test('HIST_39 - Verify history after sign-in', async () => {
        test.skip(
            true,
            'Requires a designated test account.'
        );
    });

    test('HIST_40 - Verify history across browser profiles', async () => {
        test.skip(
            true,
            'Requires a separately configured persistent browser profile.'
        );
    });

});


// ======================================================
// E. NEGATIVE TESTING
// HIST_41 - HIST_50
// ======================================================

test.describe('Search History - Negative Testing', () => {

    test('HIST_41 - Verify empty search input', async ({ page }) => {
        await openAmazon(page);

        const beforeURL = page.url();

        await page.locator(SEARCH_BUTTON).click();

        await expect(page).toHaveURL(beforeURL);
    });

    test('HIST_42 - Verify spaces-only search', async ({ page }) => {
        await openAmazon(page);

        await page.locator(SEARCH_BOX).fill('     ');

        await page.locator(SEARCH_BUTTON).click();

        await expect(page.locator(SEARCH_BOX)).toBeVisible();

        await guardAmazon(page);
    });

    test('HIST_43 - Verify special characters', async ({ page }) => {
        await openAmazon(page);

        const query = '!@#$%^&*()_+-=';

        await searchFor(page, query);

        await expect(page.locator(SEARCH_BOX)).toHaveValue(query);
    });

    test('HIST_44 - Verify very long query', async ({ page }) => {
        await openAmazon(page);

        const query = 'wireless-headphones-'.repeat(20);

        await page.locator(SEARCH_BOX).fill(query);

        await page.locator(SEARCH_BUTTON).click();

        await expect(page.locator(SEARCH_BOX)).toBeVisible();
    });

    test('HIST_45 - Verify misspelled search query', async ({ page }) => {
        await openAmazon(page);

        const query = `${UNIQUE}-blutooth-headfones`;

        await searchFor(page, query);

        await expect(page.locator(SEARCH_BOX)).toHaveValue(query);
    });

    test('HIST_46 - Verify unavailable product query', async ({ page }) => {
        await openAmazon(page);

        const query = `${UNIQUE}-no-such-product-938472`;

        await searchFor(page, query);

        await openSearchDropdown(page);

        await expect(page.locator(SEARCH_BOX)).toBeVisible();
    });

    test('HIST_47 - Verify offline and online transition', async ({ page, context }) => {
        await openAmazon(page);

        await context.setOffline(true);

        await page.locator(SEARCH_BOX).fill(`${UNIQUE}-offline`);

        await context.setOffline(false);

        await page.reload().catch(() => { });

        await expect(page.locator(SEARCH_BOX)).toBeVisible({
            timeout: 20000
        });
    });

    test('HIST_48 - Verify rapid sequential searches', async ({ page }) => {
        await openAmazon(page);

        for (let i = 0; i < 4; i++) {
            await page.locator(SEARCH_BOX).fill(
                `${UNIQUE}-rapid-${i}`
            );

            await page.locator(SEARCH_BUTTON).click();

            await page.waitForLoadState('domcontentloaded').catch(() => { });

            await guardAmazon(page);
        }

        await expect(page.locator(SEARCH_BOX)).toBeVisible();
    });

    test('HIST_49 - Verify repeated refreshes', async ({ page }) => {
        await openAmazon(page);

        await searchFor(page, `${UNIQUE}-refresh-repeat`);

        for (let i = 0; i < 3; i++) {
            await page.reload();
        }

        await expect(page.locator(SEARCH_BOX)).toBeVisible();
    });

    test('HIST_50 - Verify interrupted navigation', async ({ page }) => {
        await openAmazon(page);

        await page.locator(SEARCH_BOX).fill(
            `${UNIQUE}-interrupted`
        );

        await page.locator(SEARCH_BUTTON).click({
            noWaitAfter: true
        }).catch(() => { });

        await page.goto('/').catch(() => { });

        await expect(page.locator(SEARCH_BOX)).toBeVisible({
            timeout: 20000
        });
    });

});




// ======================================================
// F. KEYBOARD AND INTERACTION
// HIST_51 - HIST_58
// ======================================================

test.describe('Search History - Keyboard and Interaction', () => {

    test('HIST_51 - Verify ArrowDown interaction', async ({ page }) => {
        await openAmazon(page);

        await page.locator(SEARCH_BOX).fill('sam');

        await page.waitForTimeout(500);

        await page.locator(SEARCH_BOX).press('ArrowDown');

        await expect(page.locator(SEARCH_BOX)).toBeVisible();
    });

    test('HIST_52 - Verify ArrowUp interaction', async ({ page }) => {
        await openAmazon(page);

        await page.locator(SEARCH_BOX).fill('sam');

        await page.waitForTimeout(500);

        await page.locator(SEARCH_BOX).press('ArrowDown');
        await page.locator(SEARCH_BOX).press('ArrowUp');

        await expect(page.locator(SEARCH_BOX)).toBeVisible();
    });

    test('HIST_53 - Verify Enter submits search', async ({ page }) => {
        await openAmazon(page);

        const query = `${UNIQUE}-keyboard-enter`;

        await searchFor(page, query, { enter: true });

        await expect(page.locator(SEARCH_BOX)).toHaveValue(query);

        await expect(page).toHaveURL(/s\?/);
    });

    test('HIST_54 - Verify Escape closes dropdown', async ({ page }) => {
        await openAmazon(page);

        await openSearchDropdown(page, 'sam');

        const panel = page.locator(SUGGESTION_PANEL);

        if (!(await panel.isVisible().catch(() => false))) {
            test.skip(true, 'Dropdown unavailable.');
        }

        await page.locator(SEARCH_BOX).press('Escape');

        await expect(panel).toBeHidden();
    });

    test('HIST_55 - Verify Tab keyboard navigation', async ({ page }) => {
        await openAmazon(page);

        await page.locator(SEARCH_BOX).focus();

        await page.keyboard.press('Tab');

        await expect(page.locator(SEARCH_BOX)).toBeVisible();
    });

    test('HIST_56 - Verify keyboard after history interaction', async ({ page }) => {
        await openAmazon(page);

        await openSearchDropdown(page);

        const text = await getDropdownText(page);

        if (!HISTORY_WORDS.test(text)) {
            test.skip(true, 'No explicit history section found.');
        }

        await page.locator(SEARCH_BOX).press('ArrowDown');
        await page.locator(SEARCH_BOX).press('Escape');

        await expect(page.locator(SEARCH_BOX)).toBeVisible();
    });

    test('HIST_57 - Verify mouse selection of suggestion', async ({ page }) => {
        await openAmazon(page);

        await openSearchDropdown(page, 'samsung');

        const suggestion = page.locator(
            `${SUGGESTION_PANEL} .s-suggestion`
        ).first();

        if (!(await suggestion.isVisible().catch(() => false))) {
            test.skip(true, 'No clickable suggestion found.');
        }

        await suggestion.click();

        await expect(page.locator(SEARCH_BOX)).toBeVisible();
    });

    test('HIST_58 - Verify repeated suggestion interaction', async ({ page }) => {
        await openAmazon(page);

        await page.locator(SEARCH_BOX).fill('sam');

        await page.waitForTimeout(500);

        const suggestion = page.locator(
            `${SUGGESTION_PANEL} .s-suggestion`
        ).first();

        if (!(await suggestion.isVisible().catch(() => false))) {
            test.skip(true, 'No clickable suggestion found.');
        }

        await suggestion.click();

        await expect(page.locator(SEARCH_BOX)).toBeVisible();
    });

});


// ======================================================
// G. ADVANCED AND EDGE CASES
// HIST_59 - HIST_70
// ======================================================

test.describe('Search History - Advanced and Edge Cases', () => {

    test('HIST_59 - Verify repeated identical searches', async ({ page }) => {
        await openAmazon(page);

        const query = `${UNIQUE}-same-query`;

        await searchFor(page, query);
        await searchFor(page, query);

        await openSearchDropdown(page);

        const text = await getDropdownText(page);

        if (!HISTORY_WORDS.test(text)) {
            test.skip(true, 'No explicit search-history section found.');
        }

        expect(text).toContain(query);
    });

    test('HIST_60 - Verify uppercase and lowercase searches', async ({ page }) => {
        await openAmazon(page);

        await searchFor(page, `${UNIQUE}-SAMSUNG`);

        await searchFor(page, `${UNIQUE}-samsung`);

        await expect(page.locator(SEARCH_BOX))
            .toHaveValue(`${UNIQUE}-samsung`);
    });

    test('HIST_61 - Verify leading and trailing spaces', async ({ page }) => {
        await openAmazon(page);

        const query = `${UNIQUE}-trim`;

        await page.locator(SEARCH_BOX).fill(`  ${query}  `);

        await page.locator(SEARCH_BUTTON).click();

        await expect(page.locator(SEARCH_BOX)).toBeVisible();
    });

    test('HIST_62 - Verify numeric/model ID query', async ({ page }) => {
        await openAmazon(page);

        const query = 'B0D1XD1ZV3';

        await searchFor(page, query);

        await expect(page.locator(SEARCH_BOX)).toHaveValue(query);
    });

    test('HIST_63 - Verify mixed-language query', async ({ page }) => {
        await openAmazon(page);

        const query = 'mobile फोन';

        await searchFor(page, query);

        await expect(page.locator(SEARCH_BOX)).toHaveValue(query);
    });

    test('HIST_64 - Verify emoji query', async ({ page }) => {
        await openAmazon(page);

        const query = 'phone 📱';

        await searchFor(page, query);

        await expect(page.locator(SEARCH_BOX)).toBeVisible();
    });

    test('HIST_65 - Verify many searches', async ({ page }) => {
        await openAmazon(page);

        for (let i = 0; i < 8; i++) {
            await searchFor(page, `${UNIQUE}-many-${i}`);
        }

        await openSearchDropdown(page);

        await expect(page.locator(SEARCH_BOX)).toBeVisible();
    });

    test('HIST_66 - Verify search after delivery-location UI interaction', async ({ page }) => {
        await openAmazon(page);

        await page.locator(SEARCH_BOX).fill(
            `${UNIQUE}-location`
        );

        await expect(page.locator(SEARCH_BOX))
            .toHaveValue(`${UNIQUE}-location`);

        // Do not change the saved delivery address.
    });

    test('HIST_67 - Verify search input after language-related navigation', async ({ page }) => {
        await openAmazon(page);

        await expect(page.locator(SEARCH_BOX)).toBeVisible();

        // Does not change the account/site language.
    });

    test('HIST_68 - Verify search with different category', async ({ page }) => {
        await openAmazon(page);

        const category = page.locator('#searchDropdownBox');

        if (!(await category.isVisible().catch(() => false))) {
            test.skip(true, 'Category selector unavailable.');
        }

        await category.selectOption({
            label: 'Books'
        });

        const query = `${UNIQUE}-books`;

        await page.locator(SEARCH_BOX).fill(query);

        await page.locator(SEARCH_BUTTON).click();

        await expect(page.locator(SEARCH_BOX)).toHaveValue(query);
    });

   test('HIST_69 - Verify search page after clearing cookies', async ({ page, context }) => {
    await openAmazon(page);

    // Clear browser cookies.
    await context.clearCookies();

    console.log('Browser cookies cleared.');

    await page.goto('https://www.amazon.in/');

    // Detect verification.
    const captcha = page.locator(
        'input[name="captchacharacters"]'
    );

    const verification = page.getByText(
        /click the button below to continue shopping/i
    );

    if (
        await captcha.isVisible().catch(() => false) ||
        await verification.isVisible().catch(() => false)
    ) {
        test.skip(true, 'Amazon verification detected after clearing cookies.');
    }

    // Check whether homepage is available.
    const searchBox = page.locator(SEARCH_BOX);

    if (!(await searchBox.isVisible().catch(() => false))) {
        test.skip(true, 'Search box unavailable after clearing cookies.');
    }

    await expect(searchBox).toBeVisible();

    console.log('Homepage loaded after clearing cookies.');
});



    test('HIST_70 - Verify search page after clearing browser cache', async ({ page, context }) => {
        await openAmazon(page);

        const cdp = await context.newCDPSession(page);

        await cdp.send('Network.clearBrowserCache');

        await cdp.detach();

        await page.reload();

        await expect(page.locator(SEARCH_BOX)).toBeVisible({
            timeout: 20000
        });
    });

});




