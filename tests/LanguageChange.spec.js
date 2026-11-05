
import { test, expect } from '@playwright/test';

test('Amazon Language Settings Test', async ({ page }) => {

    // TC_35: Open Amazon homepage
    await page.goto('https://www.amazon.in/');

    // Print URL before clicking
    console.log('Before clicking:', page.url());

    // Verify homepage URL
    await expect(page).toHaveURL('https://www.amazon.in/');

    // TC_36: Locate language link
    const languageOption = page.locator(
        'a[href*="customer-preferences/edit"][href*="topnav_lang"]'
    ).filter({ visible: true });

    // Verify language link
    await expect(languageOption).toBeVisible();

    // Click language option
    await languageOption.click();

    // TC_37: Print URL after clicking
    console.log('After clicking:', page.url());

    // Verify Language Settings URL
    await expect(page).toHaveURL(/customer-preferences\/edit/);

    // TC_38: Verify Language Settings heading
    await expect(
        page.getByText('Language Settings', { exact: true })
    ).toBeVisible();

    // TC_39: Verify language description
    await expect(
        page.getByText(
            'Select the language you prefer for browsing, shopping and communications.',
            { exact: true }
        )
    ).toBeVisible();

    // Helper to find a visible language option
    const visibleLanguage = (language) =>
        page.getByText(language, { exact: false }).filter({ visible: true });

    // TC_40: Verify English option
    await expect(visibleLanguage('English - EN')).toBeVisible();

    // TC_41: Verify Hindi option
    await expect(visibleLanguage('हिन्दी - HI')).toBeVisible();

    // TC_42: Verify Tamil option
    await expect(visibleLanguage('தமிழ் - TA')).toBeVisible();

    // TC_43: Verify Telugu option
    await expect(visibleLanguage('తెలుగు - TE')).toBeVisible();

    // TC_44: Verify Kannada option
    await expect(visibleLanguage('ಕನ್ನಡ - KN')).toBeVisible();

    // TC_45: Verify Malayalam option
    await expect(visibleLanguage('മലയാളം - ML')).toBeVisible();

    // TC_46: Verify Bengali option
    await expect(visibleLanguage('বাংলা - BN')).toBeVisible();

    // TC_47: Verify Marathi option
    await expect(visibleLanguage('मराठी - MR')).toBeVisible();

    // TC_48: Select Hindi
    await visibleLanguage('हिन्दी - HI').click();

    // Print selection message
    console.log('Hindi language option clicked');

    // TC_49: Select Tamil
    await visibleLanguage('தமிழ் - TA').click();

    console.log('Tamil language option clicked');

    // TC_50: Select English
    await visibleLanguage('English - EN').click();

    console.log('English language option clicked');

    // TC_51: Verify Cancel link
    const cancelLink = page.getByRole('link', {
        name: 'Cancel'
    });

    await expect(cancelLink).toBeVisible();

});

