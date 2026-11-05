
import { test, expect } from '@playwright/test';

test('Amazon Account & Lists Test', async ({ page }) => {

    // TC_01: Open Amazon India
    await page.goto('https://www.amazon.in/');

    // TC_02: Locate Account & Lists
    const accountLink = page.locator('#nav-link-accountList');

    // TC_03: Verify Account & Lists visibility
    await expect(accountLink).toBeVisible();

    // TC_04: Verify Account & Lists is enabled
    await expect(accountLink).toBeEnabled();

    // TC_05: Verify Account text
    await expect(accountLink).toContainText('Account');

    // TC_06: Click Account & Lists
    await accountLink.click();

    // TC_07: Verify sign-in page URL
    await expect(page).toHaveURL(/signin/);

    // TC_08: Verify sign-in heading
    const heading = page.getByRole('heading', {
        name: 'Sign in or create account'
    });

    await expect(heading).toBeVisible();

    // TC_09: Locate email/mobile input
    const emailInput = page.getByLabel(
        'Enter mobile number or email'
    );

    // TC_10: Verify input visibility
    await expect(emailInput).toBeVisible();

    // TC_11: Verify input is enabled
    await expect(emailInput).toBeEnabled();

    // TC_12: Verify input is editable
    await expect(emailInput).toBeEditable();

    // TC_13: Locate Continue button
    const continueButton = page.locator('#continue');

    // TC_14: Verify Continue button visibility
    await expect(continueButton).toBeVisible();

    // TC_15: Verify Continue button is enabled
    await expect(continueButton).toBeEnabled();

    // TC_16: Verify Amazon logo
    const amazonLogo = page.locator('.a-icon-logo');

    await expect(amazonLogo).toBeVisible();

    // TC_17: Verify sign-in heading text
    await expect(heading).toHaveText('Sign in or create account');

    // TC_18: Verify mobile/email label
    const emailLabel = page.getByText(
        'Enter mobile number or email',
        { exact: true }
    );

    await expect(emailLabel).toBeVisible();

    // TC_19: Verify input field placeholder attribute
    const placeholder = await emailInput.getAttribute('placeholder');

    console.log('Input placeholder:', placeholder);

    // TC_20: Verify input field is editable
    await expect(emailInput).toBeEditable();

    // TC_21: Enter valid email format
    await emailInput.fill('kumarsinghravi127@gmail.com');

    await expect(emailInput).toHaveValue(
        'kumarsinghravi127@gmail.com'
    );

    // TC_22: Enter valid mobile number format
    await emailInput.fill('9876543210');

    await expect(emailInput).toHaveValue('9876543210');

    // TC_23: Enter invalid email format
    await emailInput.fill('invalidemail');

    await expect(emailInput).toHaveValue('invalidemail');

    // Click Continue
    await continueButton.click();

    // Verify invalid email validation message
    const invalidEmailError = page.getByText(
        'Invalid email address',
        { exact: true }
    );

    await expect(invalidEmailError).toBeVisible();

    // TC_24: Enter alphabetic characters
    await expect(emailInput).toBeVisible();

    await emailInput.fill('abcdef');

    await expect(emailInput).toHaveValue('abcdef');

    // Click Continue
    await continueButton.click();

    // Verify invalid input response
    await expect(
        page.getByText('Invalid email address', { exact: true })
    ).toBeVisible();

    // TC_25: Enter special characters
    await emailInput.fill('@@@###');

    await expect(emailInput).toHaveValue('@@@###');

    // Click Continue
    await continueButton.click();

    // Verify invalid input response
    await expect(
        page.getByText('Invalid email address', { exact: true })
    ).toBeVisible();

    // TC_26: Submit empty input
    await emailInput.clear();

    await expect(emailInput).toHaveValue('');

    // Click Continue
    await continueButton.click();

    // Verify required-field validation
    await expect(
        page.getByText('Enter your mobile number or email', {
            exact: true
        })
    ).toBeVisible();

    // TC_27: Verify Continue button
    await expect(continueButton).toBeVisible();

    await expect(continueButton).toBeEnabled();

    // TC_28: Verify Conditions of Use link
    const conditionsLink = page.getByRole('link', {
        name: 'Conditions of Use'
    });

    await expect(conditionsLink.first()).toBeVisible();

    // TC_29: Verify Privacy Notice link
    const privacyLink = page.getByRole('link', {
        name: 'Privacy Notice'
    });

    await expect(privacyLink.first()).toBeVisible();

    // TC_30: Verify Buying for work section
    await expect(
        page.getByText('Buying for work?', {
            exact: true
        })
    ).toBeVisible();

    // TC_31: Verify Create a free business account
    await expect(
        page.getByRole('link', {
            name: 'Create a free business account'
        })
    ).toBeVisible();

    // TC_32: Verify footer Conditions of Use
    await expect(conditionsLink.last()).toBeVisible();

    // TC_33: Verify footer Privacy Notice
    await expect(privacyLink.last()).toBeVisible();

    // TC_34: Verify Help link
    await expect(
        page.getByRole('link', {
            name: 'Help',
            exact: true
        })
    ).toBeVisible();

});
