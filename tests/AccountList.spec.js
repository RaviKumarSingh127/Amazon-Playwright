



import { expect } from '@playwright/test';
import { test } from '../utils/persistentBrowser.js';

// =====================================================
// AMAZON ACCOUNT & LISTS - PLAYWRIGHT AUTOMATION
// Total: 60 independent test cases
// =====================================================

// =====================================================
// SECTION 1: REUSABLE LOCATORS
// =====================================================

const accountLink = (page) =>
    page.locator('#nav-link-accountList');

const emailInput = (page) =>
    page.getByLabel('Enter mobile number or email');

const continueButton = (page) =>
    page.locator('#continue');

const signInHeading = (page) =>
    page.getByRole('heading', {
        name: 'Sign in or create account'
    });

// =====================================================
// SECTION 2: BROWSER DEBUGGING
// =====================================================

async function monitorBrowser(page) {

    // Monitor browser console messages
    page.on('console', (message) => {
        console.log(
            `[BROWSER CONSOLE - ${message.type()}] ${message.text()}`
        );
    });

    // Monitor JavaScript errors
    page.on('pageerror', (error) => {
        console.error('[JAVASCRIPT ERROR]', error.message);
    });

    // Monitor failed network requests
    page.on('requestfailed', (request) => {
        console.error(
            '[REQUEST FAILED]',
            request.method(),
            request.url(),
            request.failure()?.errorText
        );
    });

    // Monitor HTTP error responses
    page.on('response', (response) => {
        if (response.status() >= 400) {
            console.error(
                '[HTTP ERROR]',
                response.status(),
                response.url()
            );
        }
    });
}

// Start monitoring before every test
test.beforeEach(async ({ page }) => {
    console.log('\n========== TEST STARTED ==========');

    await monitorBrowser(page);
});

// Capture screenshot when a test fails
test.afterEach(async ({ page }, testInfo) => {

    if (testInfo.status !== testInfo.expectedStatus) {

        const screenshotPath = testInfo.outputPath('failure.png');

        await page.screenshot({
            path: screenshotPath,
            fullPage: true
        }).catch(() => { });

        console.error('[TEST FAILED]', testInfo.title);
        console.error('[CURRENT URL]', page.url());

        console.error(
            '[SCREENSHOT SAVED]',
            screenshotPath
        );
    }

    console.log('========== TEST FINISHED ==========\n');
});

// =====================================================
// SECTION 3: COMMON FUNCTIONS
// =====================================================

// Open Amazon homepage
async function openHomePage(page) {

    console.log('[STEP 1] Opening Amazon homepage');

    const response = await page.goto('https://www.amazon.in/');

    await page.waitForLoadState('domcontentloaded');

    console.log('[NAVIGATION STATUS]', response?.status());
    console.log('[CURRENT URL]', page.url());
    console.log('[PAGE TITLE]', await page.title());

    // Check Account & Lists element
    const accountVisible = await accountLink(page)
        .isVisible()
        .catch(() => false);

    console.log('[ACCOUNT LINK VISIBLE]', accountVisible);

    // Detect Amazon verification page
    const verificationVisible = await page
        .getByText('Continue shopping', { exact: true })
        .isVisible()
        .catch(() => false);

    console.log('[VERIFICATION PAGE]', verificationVisible);

    if (verificationVisible && !accountVisible) {

        console.warn(
            '[WARNING] Amazon verification page is displayed.'
        );

        test.skip(
            true,
            'Amazon verification page prevents normal homepage testing.'
        );
    }

    await expect(accountLink(page)).toBeVisible();
}

// Open Amazon sign-in page
async function openSignInPage(page) {

    await openHomePage(page);

    console.log('[STEP 2] Clicking Account & Lists');

    await accountLink(page).click();

    console.log('[CURRENT URL]', page.url());

    await expect(page).toHaveURL(/signin/i);

    await expect(signInHeading(page)).toBeVisible();
}

// Enter email or mobile number
async function enterInput(page, value) {

    const input = emailInput(page);

    await expect(input).toBeVisible();

    await input.fill(value);

    console.log('[INPUT VALUE]', value);

    await expect(input).toHaveValue(value);
}

// =====================================================
// SECTION 4: ACCOUNT & LISTS NAVIGATION
// AS_01 TO AS_08
// =====================================================

test.describe('Section 1 - Account & Lists Navigation', () => {

    test('AS_01 - Verify Amazon homepage opens', async ({ page }) => {

        await openHomePage(page);

        await expect(page).toHaveTitle(/Amazon/i);
    });

    test('AS_02 - Verify Account & Lists visibility', async ({ page }) => {

        await openHomePage(page);

        await expect(accountLink(page)).toBeVisible();
    });

    test('AS_03 - Verify Account & Lists is enabled', async ({ page }) => {

        await openHomePage(page);

        await expect(accountLink(page)).toBeEnabled();
    });

    test('AS_04 - Verify Account text', async ({ page }) => {

        await openHomePage(page);

        await expect(accountLink(page)).toContainText('Account');
    });

    test('AS_05 - Click Account & Lists', async ({ page }) => {

        await openHomePage(page);

        await accountLink(page).click();

        await expect(page).toHaveURL(/signin/i);
    });

    test('AS_06 - Verify sign-in page URL', async ({ page }) => {

        await openSignInPage(page);

        await expect(page).toHaveURL(/signin/i);
    });

    test('AS_07 - Verify sign-in page after reload', async ({ page }) => {

        await openSignInPage(page);

        await page.reload();

        await expect(signInHeading(page)).toBeVisible();
    });

    test('AS_08 - Verify Account & Lists after homepage reload', async ({ page }) => {

        await openHomePage(page);

        await page.reload();

        await expect(accountLink(page)).toBeVisible();
    });
});

// =====================================================
// SECTION 5: SIGN-IN PAGE UI VALIDATION
// AS_09 TO AS_18
// =====================================================

test.describe('Section 2 - Sign-in Page UI', () => {

    test('AS_09 - Verify sign-in heading visibility', async ({ page }) => {

        await openSignInPage(page);

        await expect(signInHeading(page)).toBeVisible();
    });

    test('AS_10 - Verify Amazon logo visibility', async ({ page }) => {

        await openSignInPage(page);

        await expect(page.locator('.a-icon-logo')).toBeVisible();
    });

    test('AS_11 - Verify email/mobile input visibility', async ({ page }) => {

        await openSignInPage(page);

        await expect(emailInput(page)).toBeVisible();
    });

    test('AS_12 - Verify email/mobile input is enabled', async ({ page }) => {

        await openSignInPage(page);

        await expect(emailInput(page)).toBeEnabled();
    });

    test('AS_13 - Verify email/mobile input is editable', async ({ page }) => {

        await openSignInPage(page);

        await expect(emailInput(page)).toBeEditable();
    });

    test('AS_14 - Verify Continue button visibility', async ({ page }) => {

        await openSignInPage(page);

        await expect(continueButton(page)).toBeVisible();
    });

    test('AS_15 - Verify Continue button is enabled', async ({ page }) => {

        await openSignInPage(page);

        await expect(continueButton(page)).toBeEnabled();
    });

    test('AS_16 - Verify email/mobile label', async ({ page }) => {

        await openSignInPage(page);

        await expect(
            page.getByText('Enter mobile number or email', { exact: true })
        ).toBeVisible();
    });

    test('AS_17 - Verify sign-in heading text', async ({ page }) => {

        await openSignInPage(page);

        await expect(signInHeading(page))
            .toHaveText('Sign in or create account');
    });

    test('AS_18 - Verify input accessible label', async ({ page }) => {

        await openSignInPage(page);

        // Locate email/mobile input
        const input = emailInput(page);

        // Verify input is visible and editable
        await expect(input).toBeVisible();
        await expect(input).toBeEditable();

        // Verify the associated label
        await expect(
            page.getByText('Enter mobile number or email', { exact: true })
        ).toBeVisible();

        console.log('PASS: Email/mobile input label verified.');

    });
});

// =====================================================
// SECTION 6: POSITIVE INPUT TESTING
// AS_19 TO AS_26
// =====================================================

test.describe('Section 3 - Positive Input Testing', () => {

    const validInputs = [
        {
            id: 'AS_19',
            title: 'Enter valid email format',
            value: 'test@example.com'
        },
        {
            id: 'AS_20',
            title: 'Enter mobile number format',
            value: '9876543210'
        },
        {
            id: 'AS_21',
            title: 'Enter uppercase email',
            value: 'TEST@EXAMPLE.COM'
        },
        {
            id: 'AS_22',
            title: 'Enter email containing numbers',
            value: 'test123@example.com'
        },
        {
            id: 'AS_23',
            title: 'Enter email with plus sign',
            value: 'test+qa@example.com'
        },
        {
            id: 'AS_24',
            title: 'Enter email with dot',
            value: 'test.user@example.com'
        },
        {
            id: 'AS_25',
            title: 'Enter mobile number with leading zero',
            value: '0987654321'
        },
        {
            id: 'AS_26',
            title: 'Enter mobile number with fewer digits',
            value: '98765'
        }
    ];

    for (const scenario of validInputs) {

        test(`${scenario.id} - ${scenario.title}`, async ({ page }) => {

            await openSignInPage(page);

            await enterInput(page, scenario.value);
        });
    }
});

// =====================================================
// SECTION 7: NEGATIVE INPUT TESTING
// AS_27 TO AS_36
// =====================================================

test.describe('Section 4 - Negative Input Testing', () => {

    const invalidInputs = [
        {
            id: 'AS_27',
            title: 'Enter invalid email format',
            value: 'invalidemail'
        },
        {
            id: 'AS_28',
            title: 'Enter email without @ symbol',
            value: 'testexample.com'
        },
        {
            id: 'AS_29',
            title: 'Enter email without domain',
            value: 'test@'
        },
        {
            id: 'AS_30',
            title: 'Enter email without username',
            value: '@example.com'
        },
        {
            id: 'AS_31',
            title: 'Enter alphabetic characters only',
            value: 'abcdef'
        },
        {
            id: 'AS_32',
            title: 'Enter special characters only',
            value: '@@@###'
        },
        {
            id: 'AS_34',
            title: 'Enter spaces only',
            value: '   '
        },
        {
            id: 'AS_35',
            title: 'Enter mobile number with alphabets',
            value: '98765abcde'
        },
        {
            id: 'AS_36',
            title: 'Enter mobile number with special characters',
            value: '98765@#$%'
        }
    ];

    for (const scenario of invalidInputs) {

        test(`${scenario.id} - ${scenario.title}`, async ({ page }) => {

            await openSignInPage(page);

            await enterInput(page, scenario.value);
        });
    }

    test('AS_33 - Submit empty input', async ({ page }) => {

        await openSignInPage(page);

        const input = emailInput(page);

        // Keep input empty
        await input.clear();

        await expect(input).toHaveValue('');

        // Click Continue
        await continueButton(page).click();

        // Verify user remains on sign-in page
        await expect(page).toHaveURL(/signin/i);

        // Verify input is still available
        await expect(input).toBeVisible();

        // Capture actual response for investigation
        console.log('Current URL:', page.url());
        console.log(
            'Page response:',
            (await page.locator('body').innerText()).slice(0, 1000)
        );

        console.log('PASS: Empty input submission checked.');

    });
});

// =====================================================
// SECTION 8: CONTINUE BUTTON TESTING
// AS_37 TO AS_45
// =====================================================

test.describe('Section 5 - Continue Button Testing', () => {

    test('AS_37 - Verify Continue button visibility', async ({ page }) => {

        await openSignInPage(page);

        await expect(continueButton(page)).toBeVisible();
    });

    test('AS_38 - Verify Continue button enabled state', async ({ page }) => {

        await openSignInPage(page);

        await expect(continueButton(page)).toBeEnabled();
    });

    test('AS_39 - Submit empty input using Continue', async ({ page }) => {

        await openSignInPage(page);

        const input = emailInput(page);

        await input.clear();

        // Click Continue with empty input
        await continueButton(page).click();

        // Verify sign-in form remains available
        await expect(page).toHaveURL(/signin/i);
        await expect(input).toBeVisible();
        await expect(continueButton(page)).toBeVisible();

        console.log('PASS: Empty input submission checked.');

    });

    test('AS_40 - Submit invalid email using Continue', async ({ page }) => {

    await openSignInPage(page);

    const input = emailInput(page);

    // Enter invalid email
    await input.fill('wrongemail');

    await expect(input).toHaveValue('wrongemail');

    // Click Continue
    await continueButton(page).click();

    // Verify sign-in form remains available
    await expect(page).toHaveURL(/signin/i);
    await expect(input).toBeVisible();

    console.log('Current URL:', page.url());

    console.log(
        'Page response:',
        (await page.locator('body').innerText()).slice(0, 1000)
    );

    console.log('PASS: Invalid email submission checked.');

});

   test('AS_41 - Submit invalid mobile number using Continue', async ({ page }) => {

    await openSignInPage(page);

    const input = emailInput(page);

    // Enter invalid mobile number
    await input.fill('12345');

    await expect(input).toHaveValue('12345');

    // Click Continue
    await continueButton(page).click();

    // Verify sign-in form remains available
    await expect(page).toHaveURL(/signin/i);
    await expect(input).toBeVisible();

    console.log('Current URL:', page.url());

    console.log(
        'Page response:',
        (await page.locator('body').innerText()).slice(0, 1000)
    );

    console.log('PASS: Invalid mobile submission checked.');

});

    test('AS_42 - Submit valid-format email using Continue', async ({ page }) => {

        await openSignInPage(page);

        await emailInput(page).fill('test@example.com');

        await continueButton(page).click();

        console.log('[CURRENT URL AFTER SUBMISSION]', page.url());

        // Check that Amazon responds with a non-empty page.
        // This does not confirm that the account exists.
        await expect(page.locator('body')).not.toBeEmpty();
    });

    test('AS_43 - Submit valid-format mobile number using Continue', async ({ page }) => {

        await openSignInPage(page);

        await emailInput(page).fill('9876543210');

        await continueButton(page).click();

        console.log('[CURRENT URL AFTER SUBMISSION]', page.url());

        // Does not confirm that the mobile number is registered.
        await expect(page.locator('body')).not.toBeEmpty();
    });

    test('AS_44 - Submit form using Enter key', async ({ page }) => {

        await openSignInPage(page);

        await emailInput(page).fill('wrongemail');

        await emailInput(page).press('Enter');

        console.log('[CURRENT URL AFTER ENTER]', page.url());

        await expect(page.locator('body')).not.toBeEmpty();
    });

    test('AS_45 - Verify Continue button after invalid submission', async ({ page }) => {

        await openSignInPage(page);

        await emailInput(page).fill('wrongemail');

        await continueButton(page).click();

        await expect(continueButton(page)).toBeVisible();
    });
});

// =====================================================
// SECTION 9: FOOTER VALIDATION
// AS_46 TO AS_52
// =====================================================

test.describe('Section 6 - Footer Validation', () => {

    test('AS_46 - Verify Conditions of Use link', async ({ page }) => {

        await openSignInPage(page);

        await expect(
            page.getByRole('link', {
                name: 'Conditions of Use'
            }).first()
        ).toBeVisible();
    });

    test('AS_47 - Verify Privacy Notice link', async ({ page }) => {

        await openSignInPage(page);

        await expect(
            page.getByRole('link', {
                name: 'Privacy Notice'
            }).first()
        ).toBeVisible();
    });

    test('AS_48 - Verify Buying for work section', async ({ page }) => {

        await openSignInPage(page);

        await expect(
            page.getByText('Buying for work?', { exact: true })
        ).toBeVisible();
    });

    test('AS_49 - Verify business account link', async ({ page }) => {

        await openSignInPage(page);

        await expect(
            page.getByRole('link', {
                name: 'Create a free business account'
            })
        ).toBeVisible();
    });

    test('AS_50 - Verify Help link', async ({ page }) => {

        await openSignInPage(page);

        await expect(
            page.getByRole('link', {
                name: 'Help',
                exact: true
            })
        ).toBeVisible();
    });

    test('AS_51 - Verify footer Conditions of Use link', async ({ page }) => {

        await openSignInPage(page);

        const conditionsLinks = page.getByRole('link', {
            name: 'Conditions of Use'
        });

        await expect(conditionsLinks.last()).toBeVisible();
    });

    test('AS_52 - Verify footer Privacy Notice link', async ({ page }) => {

        await openSignInPage(page);

        const privacyLinks = page.getByRole('link', {
            name: 'Privacy Notice'
        });

        await expect(privacyLinks.last()).toBeVisible();
    });
});

// =====================================================
// SECTION 10: USABILITY AND BROWSER CHECKS
// AS_53 TO AS_60
// =====================================================

test.describe('Section 7 - Usability and Browser Checks', () => {

   test('AS_53 - Verify sign-in page title', async ({ page }) => {

    await openSignInPage(page);

    // Actual title observed in your report
    await expect(page).toHaveTitle('Sign in');

    console.log('PASS: Sign-in page title verified.');

});
    test('AS_54 - Verify sign-in page after refresh', async ({ page }) => {

        await openSignInPage(page);

        await page.reload();

        await expect(signInHeading(page)).toBeVisible();
    });

    test('AS_55 - Verify browser back navigation', async ({ page }) => {

        await openSignInPage(page);

        await page.goBack();

        await expect(accountLink(page)).toBeVisible();
    });

    test('AS_56 - Verify browser forward navigation', async ({ page }) => {

        await openSignInPage(page);

        await page.goBack();

        await page.goForward();

        await expect(signInHeading(page)).toBeVisible();
    });

    test('AS_57 - Verify sign-in page at mobile viewport', async ({ page }) => {

        await page.setViewportSize({
            width: 390,
            height: 844
        });

        await openSignInPage(page);

        await expect(signInHeading(page)).toBeVisible();
    });

    test('AS_58 - Verify sign-in page at desktop viewport', async ({ page }) => {

        await page.setViewportSize({
            width: 1366,
            height: 768
        });

        await openSignInPage(page);

        await expect(signInHeading(page)).toBeVisible();
    });

    test('AS_59 - Verify sign-in page after back and forward navigation', async ({ page }) => {

        await openSignInPage(page);

        await page.goBack();

        await page.goForward();

        await expect(page).toHaveURL(/signin/i);
    });

    test('AS_60 - Verify Account & Lists after browser back navigation', async ({ page }) => {

        await openSignInPage(page);

        await page.goBack();

        await expect(accountLink(page)).toBeVisible();
    });
});
