

import { test } from '../utils/persistentBrowser.js';
import { expect } from '@playwright/test';

// ======================================================
// CONFIGURATION
// ======================================================

const BASE_URL = 'https://www.amazon.in/';

const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_MOBILE = process.env.TEST_MOBILE;

const TEST_UNREGISTERED_EMAIL =
    process.env.TEST_UNREGISTERED_EMAIL ||
    'ravikumarsinghcs15@gamil.com';

// ======================================================
// LOCATORS
// ======================================================

const LOCATION_BUTTON = '#glow-ingress-line2';

const SIGNIN_BUTTON = '#nav-link-accountList';

const EMAIL_INPUT = '#ap_email, #ap_email_login';

const CONTINUE_BUTTON = '#continue';

const AMAZON_LOGO = 'a.a-link-nav-icon, .a-icon-logo';

const SIGNIN_HEADING = 'Sign in or create account';

const AUTH_ERROR = [
    '#auth-email-invalid-claim-alert',
    '#auth-error-message-box',
    '.a-alert-content',
    '.a-form-error'
].join(', ');

// ======================================================
// HELPER FUNCTIONS
// ======================================================

// Detect Amazon CAPTCHA or verification page.
async function checkAmazonVerification(page) {
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
        test.skip(true, 'Amazon verification page detected.');
    }
}

// Open Amazon homepage.
async function openAmazonHomepage(page) {
    await page.goto(BASE_URL);

    await page.waitForLoadState('domcontentloaded').catch(() => {});

    await checkAmazonVerification(page);

    await expect(page).toHaveURL(/amazon\.in/);

    await expect(
        page.locator(SIGNIN_BUTTON)
    ).toBeVisible();
}

// Navigate to Amazon sign-in page.
async function navigateToSignIn(page) {
    await page.locator(SIGNIN_BUTTON).click();

    await page.waitForURL(/\/ap\/signin/, {
        timeout: 15000
    });

    await checkAmazonVerification(page);

    await expect(
        page.locator(EMAIL_INPUT).first()
    ).toBeVisible();
}

// Open sign-in page from homepage.
async function openSignInPage(page) {
    await openAmazonHomepage(page);

    await navigateToSignIn(page);
}

// Get email/mobile input.
function getEmailInput(page) {
    return page.locator(EMAIL_INPUT).first();
}

// Get visible authentication error.
function getVisibleAuthError(page) {
    return page.locator(AUTH_ERROR).filter({
        visible: true
    });
}

// Check whether the sign-in page is still displayed.
async function isSignInPage(page) {
    return /\/ap\/signin/.test(page.url());
}

// Print diagnostics.
async function printPageDiagnostics(page, testName) {
    console.log(`\n========== ${testName} DIAGNOSTICS ==========`);

    console.log('Current URL:', page.url());

    console.log('Page title:', await page.title());

    const bodyText = await page.locator('body')
        .innerText()
        .catch(() => 'Body text unavailable');

    console.log('Page text:', bodyText.substring(0, 1500));

    console.log('============================================\n');
}

// ======================================================
// TEST SUITE
// ======================================================

test.describe('Amazon Delivery and Sign-In Address Testing', () => {

    test.beforeEach(async ({ page }) => {
        await openAmazonHomepage(page);
    });

    // ==================================================
    // SIGN-IN NAVIGATION TESTING
    // ==================================================

    // TS_01 - Verify sign-in button is visible.
    test('TS_01 - Verify sign-in button is visible', async ({ page }) => {
        await expect(
            page.locator(SIGNIN_BUTTON)
        ).toBeVisible();
    });

    // TS_02 - Verify sign-in button is enabled and clickable.
    test('TS_02 - Verify sign-in button is enabled and clickable', async ({ page }) => {
        const signInButton = page.locator(SIGNIN_BUTTON);

        await expect(signInButton).toBeVisible();
        await expect(signInButton).toBeEnabled();

        await signInButton.click();

        await expect(page).toHaveURL(/\/ap\/signin/);
    });

    // TS_03 - Verify navigation to sign-in page.
    test('TS_03 - Verify navigation to sign-in page', async ({ page }) => {
        await navigateToSignIn(page);

        await expect(page).toHaveURL(/\/ap\/signin/);
    });

    // TS_04 - Verify Amazon logo on sign-in page.
    test('TS_04 - Verify Amazon logo on sign-in page', async ({ page }) => {
        await navigateToSignIn(page);

        const logo = page.locator(AMAZON_LOGO).first();

        await expect(logo).toBeVisible();
    });

    // TS_05 - Verify sign-in heading.
    test('TS_05 - Verify sign-in heading', async ({ page }) => {
        await navigateToSignIn(page);

        await expect(
            page.getByRole('heading', {
                name: SIGNIN_HEADING
            })
        ).toBeVisible();
    });

    // ==================================================
    // SIGN-IN FORM TESTING
    // ==================================================

    // TS_06 - Verify email/mobile input is visible and enabled.
    test('TS_06 - Verify email/mobile input is visible and enabled', async ({ page }) => {
        await navigateToSignIn(page);

        const input = getEmailInput(page);

        await expect(input).toBeVisible();
        await expect(input).toBeEnabled();
    });

    // TS_07 - Verify Continue button is visible and enabled.
    test('TS_07 - Verify Continue button is visible and enabled', async ({ page }) => {
        await navigateToSignIn(page);

        const continueButton = page.locator(CONTINUE_BUTTON);

        await expect(continueButton).toBeVisible();
        await expect(continueButton).toBeEnabled();
    });

    // TS_08 - Verify registered mobile number can be entered.
    test('TS_08 - Verify registered mobile number can be entered', async ({ page }) => {
        test.skip(!TEST_MOBILE, 'Set TEST_MOBILE environment variable.');

        await navigateToSignIn(page);

        const input = getEmailInput(page);

        await input.fill(TEST_MOBILE);

        await expect(input).toHaveValue(TEST_MOBILE);
    });

    // TS_09 - Verify registered email can be entered.
    test('TS_09 - Verify registered email can be entered', async ({ page }) => {
        test.skip(!TEST_EMAIL, 'Set TEST_EMAIL environment variable.');

        await navigateToSignIn(page);

        const input = getEmailInput(page);

        await input.fill(TEST_EMAIL);

        await expect(input).toHaveValue(TEST_EMAIL);
    });

    // TS_10 - Verify Continue response for registered mobile.
    test('TS_10 - Verify Continue response for registered mobile', async ({ page }) => {
        test.skip(!TEST_MOBILE, 'Set TEST_MOBILE environment variable.');

        await navigateToSignIn(page);

        const input = getEmailInput(page);

        await input.fill(TEST_MOBILE);

        await page.locator(CONTINUE_BUTTON).click();

        await checkAmazonVerification(page);

        await printPageDiagnostics(page, 'TS_10');

        await expect(
            page.locator('#authportal-main-section')
        ).toBeVisible();
    });

    // TS_11 - Verify Continue response for registered email.
    test('TS_11 - Verify Continue response for registered email', async ({ page }) => {
        test.skip(!TEST_EMAIL, 'Set TEST_EMAIL environment variable.');

        await navigateToSignIn(page);

        const input = getEmailInput(page);

        await input.fill(TEST_EMAIL);

        await page.locator(CONTINUE_BUTTON).click();

        await checkAmazonVerification(page);

        await printPageDiagnostics(page, 'TS_11');

        await expect(
            page.locator('#authportal-main-section')
        ).toBeVisible();
    });

    // ==================================================
    // NEGATIVE SIGN-IN TESTING
    // ==================================================

    // TS_12 - Verify validation for empty input.
    test('TS_12 - Verify validation for empty input', async ({ page }) => {
        await navigateToSignIn(page);

        const input = getEmailInput(page);

        await input.clear();

        await page.locator(CONTINUE_BUTTON).click();

        await checkAmazonVerification(page);

        const error = getVisibleAuthError(page);

        const hasError = await error.first()
            .isVisible()
            .catch(() => false);

        const stillOnSignIn = await isSignInPage(page);

        expect(hasError || stillOnSignIn).toBeTruthy();
    });

    // TS_13 - Verify invalid email validation.
    test('TS_13 - Verify invalid email validation', async ({ page }) => {
        await navigateToSignIn(page);

        const input = getEmailInput(page);

        await input.fill('invalid-email');

        await page.locator(CONTINUE_BUTTON).click();

        await checkAmazonVerification(page);

        await page.waitForLoadState('domcontentloaded').catch(() => {});

        const error = getVisibleAuthError(page);

        const hasError = await error.first()
            .isVisible()
            .catch(() => false);

        const stillOnSignIn = await isSignInPage(page);

        expect(hasError || stillOnSignIn).toBeTruthy();
    });

    // TS_14 - Verify invalid mobile number validation.
    test('TS_14 - Verify invalid mobile number validation', async ({ page }) => {
        await navigateToSignIn(page);

        const input = getEmailInput(page);

        await input.fill('12345');

        await page.locator(CONTINUE_BUTTON).click();

        await checkAmazonVerification(page);

        await page.waitForLoadState('domcontentloaded').catch(() => {});

        const error = getVisibleAuthError(page);

        const hasError = await error.first()
            .isVisible()
            .catch(() => false);

        const stillOnSignIn = await isSignInPage(page);

        expect(hasError || stillOnSignIn).toBeTruthy();
    });

    // TS_15 - Verify unregistered email response.
    test('TS_15 - Verify unregistered email response', async ({ page }) => {
        await navigateToSignIn(page);

        const input = getEmailInput(page);

        await input.fill(TEST_UNREGISTERED_EMAIL);

        await page.locator(CONTINUE_BUTTON).click();

        await checkAmazonVerification(page);

        const newCustomerMessage = page.getByText(
            /it looks like you are new to amazon/i
        );

        await expect(newCustomerMessage).toBeVisible();

        await printPageDiagnostics(page, 'TS_15');
    });

    // ==================================================
    // FOOTER LINKS TESTING
    // ==================================================

    // TS_16 - Verify Conditions of Use link.
test('TS_16 - Verify Conditions of Use link', async ({ page }) => {
    await navigateToSignIn(page);

    // Select the Conditions of Use link inside the sign-in notification.
    const link = page.locator('#claim-collection-container')
        .getByRole('link', {
            name: /conditions of use/i
        });

    await expect(link).toBeVisible();

    const href = await link.getAttribute('href');

    expect(href).toContain('/gp/help/customer/display.html');
});

    // TS_17 - Verify Privacy Notice link.
test('TS_17 - Verify Privacy Notice link', async ({ page }) => {
    await navigateToSignIn(page);

    // Select the Privacy Notice link inside the sign-in notification.
    const link = page.locator('#claim-collection-container')
        .getByRole('link', {
            name: /privacy notice/i
        });

    await expect(link).toBeVisible();

    const href = await link.getAttribute('href');

    expect(href).toContain('/gp/help/customer/display.html');
});

    // TS_18 - Verify Create a free business account link.
    test('TS_18 - Verify Create a free business account link', async ({ page }) => {
        await navigateToSignIn(page);

        const link = page.getByRole('link', {
            name: /create a free business account/i
        });

        await expect(link).toBeVisible();

        const href = await link.getAttribute('href');

        expect(href).toBeTruthy();
    });

});
