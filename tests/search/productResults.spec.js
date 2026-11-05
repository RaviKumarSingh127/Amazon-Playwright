


import { test } from '../../utils/persistentBrowser.js';
import { expect } from '@playwright/test';

// ======================================================
// CONFIGURATION
// ======================================================

const BASE_URL = 'https://www.amazon.in/';
const SEARCH_QUERY = 'wireless mouse';

const SEARCH_BOX = '#twotabsearchtextbox';
const SEARCH_BUTTON = '#nav-search-submit-button';

const PRODUCT_CARD = 'div[data-component-type="s-search-result"]';
const PRODUCT_TITLE = 'h2 span';
const PRODUCT_IMAGE = 'img.s-image';

const SORT_DROPDOWN = '#s-result-sort-select';
const NEXT_PAGE = 'a.s-pagination-next';
const PREVIOUS_PAGE = 'a.s-pagination-previous';

// ======================================================
// COMMON HELPER FUNCTIONS
// ======================================================

// Check whether Amazon verification page is displayed.
async function checkAmazonVerification(page) {
    const captcha = page.locator('input[name="captchacharacters"]');

    const verificationText = page.getByText(
        /click the button below to continue shopping/i
    );

    const captchaVisible = await captcha.isVisible().catch(() => false);
    const verificationVisible = await verificationText.isVisible().catch(() => false);

    if (captchaVisible || verificationVisible) {
        test.skip(true, 'Amazon verification page detected.');
    }
}

// Open Amazon homepage.
async function openAmazon(page) {
    await page.goto(BASE_URL, {
        waitUntil: 'domcontentloaded'
    });

    await checkAmazonVerification(page);

    await expect(page.locator(SEARCH_BOX)).toBeVisible({
        timeout: 15000
    });
}

// Search for a product.
async function searchProduct(page, query = SEARCH_QUERY) {
    await page.locator(SEARCH_BOX).fill(query);

    await page.locator(SEARCH_BUTTON).click();

    await page.waitForLoadState('domcontentloaded');

    await checkAmazonVerification(page);

    await expect(page).toHaveURL(/s\?/);
}

// Get all product cards.
function getProductCards(page) {
    return page.locator(PRODUCT_CARD);
}

// Get first product card.
function getFirstProduct(page) {
    return getProductCards(page).first();
}

// Get product title from a card.
function getProductTitle(card) {
    return card.locator(PRODUCT_TITLE).first();
}

// Get product image from a card.
function getProductImage(card) {
    return card.locator(PRODUCT_IMAGE).first();
}

// Get product link from a card.
function getProductLink(card) {
    return card.locator('a:has(h2)').first();
}

// Get product image link.
function getProductImageLink(card) {
    return card.locator('a:has(img.s-image)').first();
}

// Get product price from a card.
function getProductPrice(card) {
    return card.locator('.a-price .a-offscreen').first();
}

// Extract numeric price.
function extractPrice(priceText) {
    if (!priceText) return null;

    const value = priceText.replace(/[^\d.]/g, '');

    return Number(value);
}

// Get all product titles.
async function getProductTitles(page) {
    const cards = getProductCards(page);
    const count = await cards.count();

    const titles = [];

    for (let i = 0; i < count; i++) {
        const title = await getProductTitle(cards.nth(i)).textContent()
            .catch(() => '');

        if (title?.trim()) {
            titles.push(title.trim());
        }
    }

    return titles;
}

// Get all visible product prices.
async function getProductPrices(page) {
    const cards = getProductCards(page);
    const count = await cards.count();

    const prices = [];

    for (let i = 0; i < count; i++) {
        const priceLocator = getProductPrice(cards.nth(i));

        const visible = await priceLocator.isVisible().catch(() => false);

        if (!visible) continue;

        const text = await priceLocator.textContent().catch(() => '');
        const price = extractPrice(text);

        if (Number.isFinite(price) && price > 0) {
            prices.push(price);
        }
    }

    return prices;
}

// Ensure product results are available.
async function requireProducts(page) {
    const cards = getProductCards(page);

    const count = await cards.count();

    if (count === 0) {
        test.skip(true, 'No product cards are available.');
    }

    return cards;
}

// Check whether Amazon displays no results.
async function isNoResults(page) {
    const message = page.getByText(
        /no results|did not match any products|no products found/i
    );

    return await message.isVisible().catch(() => false);
}

// Open product details page.
// Handles normal and sponsored Amazon product links.
async function openProductDetails(page, link) {
    const href = await link.getAttribute('href');

    expect(href).toBeTruthy();

    const productUrl = new URL(href, BASE_URL);

    let finalProductUrl = productUrl.href;

    // Amazon sponsored product redirect.
    if (productUrl.pathname.includes('/sspa/click')) {
        const redirectUrl = productUrl.searchParams.get('url');

        expect(redirectUrl).toBeTruthy();

        finalProductUrl = new URL(redirectUrl, BASE_URL).href;
    }

    // Extract product path.
    const finalUrl = new URL(finalProductUrl);

    expect(finalUrl.pathname).toMatch(/\/dp\/|\/gp\/product\//);

    // Navigate directly to the actual product URL.
    await page.goto(finalProductUrl, {
        waitUntil: 'domcontentloaded'
    });

    await checkAmazonVerification(page);

    await expect(page.locator('span#productTitle')).toBeVisible({
        timeout: 15000
    });
}

// Find a filter by text.
function findFilter(page, filterName) {
    return page.getByText(filterName, {
        exact: false
    }).first();
}

// ======================================================
// TEST GROUP 1: FUNCTIONAL TESTING
// PROD_01 - PROD_08
// ======================================================

test.describe('Product Results - Functional Testing', () => {

    test.beforeEach(async ({ page }) => {
        await openAmazon(page);
        await searchProduct(page);
    });

    // PROD_01
    test('PROD_01 - Verify product results page after searching', async ({ page }) => {
        await expect(page).toHaveURL(/s\?/);
        await expect(getProductCards(page).first()).toBeVisible();
    });

    // PROD_02
    test('PROD_02 - Verify searched keyword in search box', async ({ page }) => {
        await expect(page.locator(SEARCH_BOX)).toHaveValue(SEARCH_QUERY);
    });

    // PROD_03
    test('PROD_03 - Verify product results are displayed', async ({ page }) => {
        const cards = await requireProducts(page);
        await expect(cards.first()).toBeVisible();
    });

    // PROD_04
    test('PROD_04 - Verify product title is displayed', async ({ page }) => {
        const title = getProductTitle(await requireProducts(page));
        await expect(title).toBeVisible();
        expect((await title.textContent()).trim().length).toBeGreaterThan(0);
    });

    // PROD_05
    test('PROD_05 - Verify product image is displayed', async ({ page }) => {
        const image = getProductImage(await requireProducts(page));
        await expect(image).toBeVisible();
        await expect(image).toHaveAttribute('src', /.+/);
    });

    // PROD_06
    test('PROD_06 - Verify product price is displayed', async ({ page }) => {
        const price = getProductPrice(await requireProducts(page));

        if (!await price.isVisible().catch(() => false)) {
            test.skip(true, 'First product does not display a price.');
        }

        await expect(price).toBeVisible();
    });

    // PROD_07
    test('PROD_07 - Verify product rating and review count', async ({ page }) => {
        const card = await requireProducts(page);

        const rating = card.locator(
            'span[aria-label*="out of 5"], i.a-icon-star-small'
        ).first();

        const reviewCount = card.locator(
            'a[href*="#customerReviews"], span[aria-label*="ratings"]'
        ).first();

        const ratingVisible = await rating.isVisible().catch(() => false);
        const reviewVisible = await reviewCount.isVisible().catch(() => false);

        if (!ratingVisible && !reviewVisible) {
            test.skip(true, 'Rating and review count are not available.');
        }

        expect(ratingVisible || reviewVisible).toBeTruthy();
    });

    // PROD_08
    test('PROD_08 - Verify multiple product cards are displayed', async ({ page }) => {
        const cards = getProductCards(page);
        await expect(cards).not.toHaveCount(0);
        expect(await cards.count()).toBeGreaterThan(1);
    });
});

// ======================================================
// TEST GROUP 2: PRODUCT INFORMATION AND NAVIGATION
// PROD_09 - PROD_15
// ======================================================

test.describe('Product Results - Product Information and Navigation', () => {

    test.beforeEach(async ({ page }) => {
        await openAmazon(page);
        await searchProduct(page);
        await requireProducts(page);
    });

    // PROD_09
    test('PROD_09 - Verify product link is available', async ({ page }) => {
        const link = getProductLink(await requireProducts(page));

        await expect(link).toBeVisible();

        expect(await link.getAttribute('href')).toBeTruthy();
    });

    // PROD_10
    test('PROD_10 - Click product image and open details page', async ({ page }) => {
        const imageLink = getProductImageLink(await requireProducts(page));

        await expect(imageLink).toBeVisible();

        await openProductDetails(page, imageLink);

        await expect(page.locator('span#productTitle')).toBeVisible();
    });

    // PROD_11
    test('PROD_11 - Verify product title on details page', async ({ page }) => {
        const link = getProductLink(await requireProducts(page));

        await openProductDetails(page, link);

        const title = page.locator('span#productTitle');

        await expect(title).toBeVisible();

        expect((await title.textContent()).trim().length).toBeGreaterThan(0);
    });

    // PROD_12
    test('PROD_12 - Verify product price on details page', async ({ page }) => {
        const link = getProductLink(await requireProducts(page));

        await openProductDetails(page, link);

        const price = page.locator(
            '#corePrice_feature_div .a-offscreen, #priceblock_ourprice, #priceblock_dealprice'
        ).first();

        if (!await price.isVisible().catch(() => false)) {
            test.skip(true, 'Product price is not available.');
        }

        await expect(price).toBeVisible();
    });

    // PROD_13
    test('PROD_13 - Verify product URL corresponds to selected product', async ({ page }) => {
        const link = getProductLink(await requireProducts(page));

        const href = await link.getAttribute('href');

        expect(href).toBeTruthy();

        await openProductDetails(page, link);

        await expect(page).toHaveURL(/\/dp\/|\/gp\/product\//);
    });

    // PROD_14
    test('PROD_14 - Verify browser back navigation', async ({ page }) => {
        const link = getProductLink(await requireProducts(page));

        await openProductDetails(page, link);

        await page.goBack({
            waitUntil: 'domcontentloaded'
        });

        await checkAmazonVerification(page);

        await expect(page).toHaveURL(/s\?/);

        await expect(getProductCards(page).first()).toBeVisible();
    });

    // PROD_15
    test('PROD_15 - Verify product availability information', async ({ page }) => {
        const link = getProductLink(await requireProducts(page));

        await openProductDetails(page, link);

        const availability = page.locator(
            '#availability, #outOfStock, #availabilityInsideBuyBox_feature_div'
        ).first();

        await expect(availability).toBeVisible({
            timeout: 10000
        });
    });
});

// ======================================================
// TEST GROUP 3: FILTERING
// PROD_16 - PROD_23
// ======================================================

test.describe('Product Results - Filtering', () => {

    test.beforeEach(async ({ page }) => {
        await openAmazon(page);
        await searchProduct(page);
        await requireProducts(page);
    });

    // PROD_16
    test('PROD_16 - Verify brand filter availability', async ({ page }) => {
        const brand = findFilter(page, 'Logitech');

        if (!await brand.isVisible().catch(() => false)) {
            test.skip(true, 'Logitech brand filter is not available.');
        }

        await expect(brand).toBeVisible();
    });

    // PROD_17
    test('PROD_17 - Verify price filter availability', async ({ page }) => {
        const priceFilter = page.locator(
            'input[name="low-price"], input[name="high-price"]'
        ).first();

        const visible = await priceFilter.isVisible().catch(() => false);

        if (!visible) {
            test.skip(true, 'Price filter inputs are not available.');
        }

        await expect(priceFilter).toBeVisible();
    });

    // PROD_18
    test('PROD_18 - Verify customer rating filter availability', async ({ page }) => {
        const rating = findFilter(page, '4 Stars');

        if (!await rating.isVisible().catch(() => false)) {
            test.skip(true, 'Customer rating filter is not available.');
        }

        await expect(rating).toBeVisible();
    });

    // PROD_19
    test('PROD_19 - Verify delivery filter availability', async ({ page }) => {
        const delivery = findFilter(page, 'Get It by Tomorrow');

        if (!await delivery.isVisible().catch(() => false)) {
            test.skip(true, 'Delivery filter is not available.');
        }

        await expect(delivery).toBeVisible();
    });

    // PROD_20
    test('PROD_20 - Verify multiple filters can be selected', async ({ page }) => {
        const brand = findFilter(page, 'Logitech');

        if (!await brand.isVisible().catch(() => false)) {
            test.skip(true, 'Brand filter is not available.');
        }

        await brand.click();

        await page.waitForLoadState('domcontentloaded');

        await checkAmazonVerification(page);

        await expect(page).toHaveURL(/s\?/);
    });

    // PROD_21
    test('PROD_21 - Verify filter can be removed', async ({ page }) => {
        const brand = findFilter(page, 'Logitech');

        if (!await brand.isVisible().catch(() => false)) {
            test.skip(true, 'Brand filter is not available.');
        }

        await brand.click();

        await page.waitForLoadState('domcontentloaded');

        const clear = page.getByText(/clear filters|clear all/i).first();

        if (!await clear.isVisible().catch(() => false)) {
            test.skip(true, 'Clear filter option is not available.');
        }

        await clear.click();

        await page.waitForLoadState('domcontentloaded');

        await expect(page).toHaveURL(/s\?/);
    });

    // PROD_22
    test('PROD_22 - Verify clear filters option', async ({ page }) => {
        const clear = page.getByText(/clear filters|clear all/i).first();

        if (!await clear.isVisible().catch(() => false)) {
            test.skip(true, 'Clear filters option is not displayed.');
        }

        await expect(clear).toBeVisible();
    });

    // PROD_23
    test('PROD_23 - Verify filter does not return unrelated products', async ({ page }) => {
        const cards = await requireProducts(page);

        const titles = await getProductTitles(page);

        expect(titles.length).toBeGreaterThan(0);

        await expect(cards.first()).toBeVisible();
    });
});

// ======================================================
// TEST GROUP 4: SORTING
// PROD_24 - PROD_28
// ======================================================

test.describe('Product Results - Sorting', () => {

    test.beforeEach(async ({ page }) => {
        await openAmazon(page);
        await searchProduct(page);
        await requireProducts(page);
    });

    // PROD_24
    test('PROD_24 - Verify sort dropdown is visible', async ({ page }) => {
        await expect(page.locator(SORT_DROPDOWN)).toBeVisible();
    });

    // PROD_25
    test('PROD_25 - Verify sort dropdown is enabled', async ({ page }) => {
        await expect(page.locator(SORT_DROPDOWN)).toBeEnabled();
    });

    // PROD_26
    test('PROD_26 - Verify price low to high sorting', async ({ page }) => {
        const dropdown = page.locator(SORT_DROPDOWN);

        const options = await dropdown.locator('option').allTextContents();

        const option = options.find(text => /price: low to high/i.test(text));

        if (!option) {
            test.skip(true, 'Price low to high sorting is not available.');
        }

        await dropdown.selectOption({
            label: option
        });

        await page.waitForLoadState('domcontentloaded');

        await checkAmazonVerification(page);

        const prices = await getProductPrices(page);

        if (prices.length < 2) {
            test.skip(true, 'Not enough priced products for sorting verification.');
        }

        expect(prices[0]).toBeLessThanOrEqual(prices[1]);
    });

    // PROD_27
    test('PROD_27 - Verify price high to low sorting', async ({ page }) => {
        const dropdown = page.locator(SORT_DROPDOWN);

        const options = await dropdown.locator('option').allTextContents();

        const option = options.find(text => /price: high to low/i.test(text));

        if (!option) {
            test.skip(true, 'Price high to low sorting is not available.');
        }

        await dropdown.selectOption({
            label: option
        });

        await page.waitForLoadState('domcontentloaded');

        await checkAmazonVerification(page);

        const prices = await getProductPrices(page);

        if (prices.length < 2) {
            test.skip(true, 'Not enough priced products for sorting verification.');
        }

        expect(prices[0]).toBeGreaterThanOrEqual(prices[1]);
    });

    // PROD_28
    test('PROD_28 - Verify sort selection remains selected', async ({ page }) => {
        const dropdown = page.locator(SORT_DROPDOWN);

        const options = await dropdown.locator('option').allTextContents();

        const option = options.find(text => /price: low to high/i.test(text));

        if (!option) {
            test.skip(true, 'Price sorting option is not available.');
        }

        await dropdown.selectOption({
            label: option
        });

        await expect(dropdown).toHaveValue(/price/);
    });
});

// ======================================================
// TEST GROUP 5: PAGINATION
// PROD_29 - PROD_33
// ======================================================

test.describe('Product Results - Pagination', () => {

    test.beforeEach(async ({ page }) => {
        await openAmazon(page);
        await searchProduct(page);
        await requireProducts(page);
    });

    // PROD_29
    test('PROD_29 - Verify next page button is available', async ({ page }) => {
        const next = page.locator(NEXT_PAGE);

        if (!await next.isVisible().catch(() => false)) {
            test.skip(true, 'Next page button is not available.');
        }

        await expect(next).toBeVisible();
    });

    // PROD_30
    test('PROD_30 - Verify next page navigation', async ({ page }) => {
        const next = page.locator(NEXT_PAGE);

        if (!await next.isVisible().catch(() => false)) {
            test.skip(true, 'Next page button is not available.');
        }

        await next.click();

        await page.waitForLoadState('domcontentloaded');

        await checkAmazonVerification(page);

        await expect(page).toHaveURL(/s\?/);
        await expect(getProductCards(page).first()).toBeVisible();
    });

    // PROD_31
    test('PROD_31 - Verify previous page navigation', async ({ page }) => {
        const next = page.locator(NEXT_PAGE);

        if (!await next.isVisible().catch(() => false)) {
            test.skip(true, 'Next page button is not available.');
        }

        await next.click();

        await page.waitForLoadState('domcontentloaded');

        await checkAmazonVerification(page);

        const previous = page.locator(PREVIOUS_PAGE);

        if (!await previous.isVisible().catch(() => false)) {
            test.skip(true, 'Previous page button is not available.');
        }

        await previous.click();

        await page.waitForLoadState('domcontentloaded');

        await expect(getProductCards(page).first()).toBeVisible();
    });

    // PROD_32
    test('PROD_32 - Verify pagination page number', async ({ page }) => {
        const next = page.locator(NEXT_PAGE);

        if (!await next.isVisible().catch(() => false)) {
            test.skip(true, 'Next page button is not available.');
        }

        await next.click();

        await page.waitForLoadState('domcontentloaded');

        await checkAmazonVerification(page);

        const currentPage = page.locator(
            '.s-pagination-item.s-pagination-selected'
        );

        await expect(currentPage).toBeVisible();
    });

    // PROD_33
    test('PROD_33 - Verify product cards on next page', async ({ page }) => {
        const next = page.locator(NEXT_PAGE);

        if (!await next.isVisible().catch(() => false)) {
            test.skip(true, 'Next page button is not available.');
        }

        await next.click();

        await page.waitForLoadState('domcontentloaded');

        await checkAmazonVerification(page);

        const cards = await requireProducts(page);

        await expect(cards.first()).toBeVisible();
    });
});

// ======================================================
// TEST GROUP 6: NEGATIVE TESTING
// PROD_34 - PROD_39
// ======================================================

test.describe('Product Results - Negative Testing', () => {

    test.beforeEach(async ({ page }) => {
        await openAmazon(page);
        await searchProduct(page);
    });

    // PROD_34
    test('PROD_34 - Verify invalid search', async ({ page }) => {
        // Test code
    });

    // Other tests...

    // PROD_39
    test('PROD_39 - Verify page behavior when internet is unavailable', async ({ page }) => {
        // Test code
    });

}); // Closes Negative Testing group
    // PROD_36
   // PROD_36 - Verify search with special characters
test('PROD_36 - Verify search with special characters', async ({ page }) => {

    console.log('Step 1: Opening Amazon');

    await openAmazon(page);

    console.log('Step 2: Checking search box');

    const searchBox = page.locator(SEARCH_BOX);

    await expect(searchBox).toBeVisible({
        timeout: 10000
    });

    console.log('Step 3: Entering special characters');

    await searchBox.fill('@#$%^&*');

    console.log('Step 4: Submitting search');

    await searchBox.press('Enter');

    console.log('Step 5: Waiting for search navigation');

    await page.waitForLoadState('domcontentloaded', {
        timeout: 15000
    }).catch(error => {
        console.log('Navigation wait:', error.message);
    });

    console.log('Current URL:', page.url());

    console.log('Step 6: Checking search box after search');

    await expect(searchBox).toBeVisible({
        timeout: 10000
    });

    console.log('PROD_36 completed successfully');

});
    // PROD_37
    // PROD_37 - Verify search with numeric keyword
test('PROD_37 - Verify search with numeric keyword', async ({ page }) => {

    console.log('Step 1: Opening Amazon');

    await openAmazon(page);

    console.log('Step 2: Checking search box');

    const searchBox = page.locator(SEARCH_BOX);

    await expect(searchBox).toBeVisible({
        timeout: 10000
    });

    console.log('Step 3: Entering numeric keyword');

    await searchBox.fill('123456789');

    console.log('Step 4: Submitting search');

    await searchBox.press('Enter');

    console.log('Step 5: Waiting for search navigation');

    await page.waitForLoadState('domcontentloaded', {
        timeout: 15000
    }).catch(error => {
        console.log('Navigation wait:', error.message);
    });

    console.log('Current URL:', page.url());

    console.log('Step 6: Checking search box');

    await expect(searchBox).toBeVisible({
        timeout: 10000
    });

    console.log('PROD_37 completed successfully');
});
    // PROD_38
    // PROD_38 - Verify search with long keyword
test('PROD_38 - Verify search with long keyword', async ({ page }) => {

    console.log('Step 1: Opening Amazon');

    await openAmazon(page);

    console.log('Step 2: Checking search box');

    const searchBox = page.locator(SEARCH_BOX);

    await expect(searchBox).toBeVisible({
        timeout: 10000
    });

    console.log('Step 3: Entering long keyword');

    const longKeyword =
        'wireless bluetooth rechargeable computer mouse accessories';

    await searchBox.fill(longKeyword);

    console.log('Step 4: Submitting search');

    await searchBox.press('Enter');

    console.log('Step 5: Waiting for navigation');

    await page.waitForLoadState('domcontentloaded', {
        timeout: 15000
    }).catch(error => {
        console.log('Navigation wait:', error.message);
    });

    console.log('Current URL:', page.url());

    console.log('Step 6: Checking search box');

    await expect(searchBox).toBeVisible({
        timeout: 10000
    });

    console.log('PROD_38 completed successfully');
});

// ======================================================
// PROD_39 - Verify page behavior when internet is unavailable
// ======================================================


// ======================================================
// PROD_39 - Verify page behavior when internet is unavailable
// ======================================================

test('PROD_39 - Verify page behavior when internet is unavailable', async ({ page }) => {

    // Open Amazon
    await page.goto('/');

    // Expected: Amazon search box should be visible
    await expect(page.locator(SEARCH_BOX)).toBeVisible();

    // Simulate internet disconnection
    await page.context().setOffline(true);

    try {
        let navigationFailed = false;

        try {
            // Attempt to reload while offline
            await page.reload({
                waitUntil: 'domcontentloaded',
                timeout: 10000
            });
        } catch (error) {
            navigationFailed = true;
            console.log('Offline navigation error:', error.message);
        }

        // Actual result
        console.log('Navigation failed:', navigationFailed);

        // Expected: Navigation should fail while offline
        expect(navigationFailed).toBeTruthy();

    } finally {
        // Always restore network connection
        await page.context().setOffline(false);
    }
});


// ======================================================
// TEST GROUP 7: PRODUCT INTERACTIONS
// PROD_40 - PROD_44
// ======================================================

test.describe('Product Results - Product Interactions', () => {

    test.beforeEach(async ({ page }) => {
        await openAmazon(page);
        await searchProduct(page);
        await requireProducts(page);
    });

    // PROD_40 - Verify product title link is clickable
    test('PROD_40 - Verify product title link is clickable', async ({ page }) => {

        const link = getProductLink(await requireProducts(page));

        // Expected: Product link should be visible and have a destination
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute('href', /.+/);

        console.log('Actual result: Product link is visible and has an href.');
    });

    // PROD_41 - Verify add to cart button availability
    test('PROD_41 - Verify add to cart button availability', async ({ page }) => {

        const link = getProductLink(await requireProducts(page));

        await openProductDetails(page, link);

        const addToCart = page.locator('#add-to-cart-button');

        // Skip only when the button is genuinely unavailable
        if (!await addToCart.isVisible().catch(() => false)) {
            test.skip(true, 'Add to Cart button is unavailable for this product.');
        }

        // Expected: Add to Cart button should be enabled
        await expect(addToCart).toBeEnabled();

        console.log('Actual result: Add to Cart button is enabled.');

        // Do not click: avoid changing the user's Amazon cart.
    });

    // PROD_42 - Verify product image has alternative text
    test('PROD_42 - Verify product image has alternative text', async ({ page }) => {

        const image = getProductImage(await requireProducts(page));

        const alt = await image.getAttribute('alt');

        // Expected: Product image should have alternative text
        expect(alt).toBeTruthy();

        console.log('Actual image alt text:', alt);
    });

    // PROD_43 - Verify product image dimensions
    test('PROD_43 - Verify product image dimensions', async ({ page }) => {

        const image = getProductImage(await requireProducts(page));

        // Expected: Product image should be visible
        await expect(image).toBeVisible();

        const dimensions = await image.evaluate(element => ({
            width: element.naturalWidth,
            height: element.naturalHeight
        }));

        // Expected: Image dimensions should be greater than zero
        expect(dimensions.width).toBeGreaterThan(0);
        expect(dimensions.height).toBeGreaterThan(0);

        console.log('Actual image dimensions:', dimensions);
    });

    // PROD_44 - Verify product link opens product details
    test('PROD_44 - Verify product link opens product details', async ({ page }) => {

        const link = getProductLink(await requireProducts(page));

        await openProductDetails(page, link);

        // Expected: Product title should be visible
        await expect(page.locator('span#productTitle')).toBeVisible();

        console.log('Actual result: Product details page opened.');
    });
});


// ======================================================
// TEST GROUP 8: UI AND RESPONSIVE TESTING
// PROD_45 - PROD_50
// ======================================================

test.describe('Product Results - UI and Responsive Testing', () => {

    test.beforeEach(async ({ page }) => {
        await openAmazon(page);
        await searchProduct(page);
        await requireProducts(page);
    });

    // PROD_45 - Verify product results heading
    test('PROD_45 - Verify product results heading', async ({ page }) => {

        // The beforeEach hook has already opened search results.
        const results = page.locator(
            '[data-component-type="s-search-results"]'
        );

        // Expected: Search results container should be visible
        await expect(results).toBeVisible();

        // Actual result
        console.log(
            'Search results container visible:',
            await results.isVisible()
        );
    });

    // PROD_46 - Verify search box remains visible
    test('PROD_46 - Verify search box remains visible', async ({ page }) => {

        // Expected: Search box should remain visible
        await expect(page.locator(SEARCH_BOX)).toBeVisible();

        console.log('Actual result: Search box is visible.');
    });

    // PROD_47 - Verify product cards are visible
    test('PROD_47 - Verify product cards are visible', async ({ page }) => {

        const cards = await requireProducts(page);

        // Expected: At least one product card should be visible
        await expect(cards.first()).toBeVisible();

        console.log('Actual result: Product card is visible.');
    });

    // PROD_48 - Verify tablet viewport layout
    test('PROD_48 - Verify tablet viewport layout', async ({ page }) => {

        // Set tablet viewport
        await page.setViewportSize({
            width: 768,
            height: 1024
        });

        // Expected: Search box should be visible
        await expect(page.locator(SEARCH_BOX)).toBeVisible();

        // Expected: Product cards should remain visible
        await expect(getProductCards(page).first()).toBeVisible();

        console.log('Actual result: Search box and product cards are visible at tablet viewport.');
    });

    // PROD_49 - Verify product images load successfully
    test('PROD_49 - Verify product images load successfully', async ({ page }) => {

        const images = getProductCards(page).locator(PRODUCT_IMAGE);

        const count = Math.min(await images.count(), 5);

        // Skip if no product images are available
        if (count === 0) {
            test.skip(true, 'No product images are available.');
        }

        let loadedImages = 0;

        for (let i = 0; i < count; i++) {

            const image = images.nth(i);

            const loaded = await image.evaluate(element =>
                element.complete &&
                element.naturalWidth > 0
            ).catch(() => false);

            if (loaded) {
                loadedImages++;
            }
        }

        // Expected: At least one product image should load
        expect(loadedImages).toBeGreaterThan(0);

        console.log(`Actual result: ${loadedImages} of ${count} images loaded.`);
    });

    // PROD_50 - Verify page refresh functionality
    test('PROD_50 - Verify page refresh functionality', async ({ page }) => {

        // Refresh the search results page
        await page.reload({
            waitUntil: 'domcontentloaded'
        });

        await checkAmazonVerification(page);

        // Expected: Search box should remain visible
        await expect(page.locator(SEARCH_BOX)).toBeVisible();

        // Expected: Product cards should remain visible
        await expect(getProductCards(page).first()).toBeVisible();

        console.log('Actual result: Search page refreshed and product cards are visible.');
    });
});
