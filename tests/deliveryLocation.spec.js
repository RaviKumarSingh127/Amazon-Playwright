
import { test, expect } from '@playwright/test';

// Reusable helper function to open Amazon delivery location popup
async function openLocationPopup(page) {

    // Open Amazon homepage
    await page.goto('https://www.amazon.in/');

    // Locate delivery location section
    const deliveryLocation = page.locator('#glow-ingress-block');

    // Verify delivery location is visible
    await expect(deliveryLocation).toBeVisible();

    // Print current delivery location
    console.log('Delivery location:', await deliveryLocation.innerText());

    // Click delivery location
    await deliveryLocation.click();

    // Locate actual popup heading
    const popupHeading = page.getByRole('heading', {
        name: 'Choose your location',
        exact: true
    });

    // Wait for popup heading
    try {
        await expect(popupHeading).toBeVisible({
            timeout: 10000
        });
    } catch (error) {

        // Print diagnostic information if popup does not open
        console.log('Popup did not open.');

        console.log(
            'Popup heading count:',
            await popupHeading.count()
        );

        console.log(
            'PIN input count:',
            await page.locator('#GLUXZipUpdateInput').count()
        );

        console.log(
            'Current URL:',
            page.url()
        );

        console.log(
            'Page content:',
            (await page.locator('body').innerText()).slice(0, 1000)
        );

        throw error;
    }

    // Locate PIN input
    const pincodeInput = page.locator('#GLUXZipUpdateInput');

    // Verify PIN input is visible
    await expect(pincodeInput).toBeVisible();

    // Locate Apply button
    const applyButton = page.getByRole('button', {
        name: 'Apply',
        exact: true
    });

    // Locate Close button
    const closeButton = page.locator('button[aria-label="Close"]');

    // Locate PIN validation message
    const errorMessage = page.locator('#GLUXZipError');

    // Return locators
    return {
        deliveryLocation,
        popupHeading,
        pincodeInput,
        applyButton,
        closeButton,
        errorMessage
    };
}


// TC_01: Verify Amazon delivery location popup
test('Amazon Delivery Location Popup Test', async ({ page }) => {

    const {
        popupHeading,
        pincodeInput,
        applyButton,
        closeButton
    } = await openLocationPopup(page);

    // Verify popup heading
    await expect(popupHeading).toBeVisible();

    // Verify PIN input is visible
    await expect(pincodeInput).toBeVisible();

    // Verify PIN input is enabled
    await expect(pincodeInput).toBeEnabled();

    // Verify Apply button is visible
    await expect(applyButton).toBeVisible();

    // Verify Close button is visible
    await expect(closeButton).toBeVisible();

    // Close popup
    await closeButton.click();

    // Verify popup is closed
    await expect(popupHeading).toBeHidden();
});


// TC_02: Verify six-digit PIN
test('Amazon Six Digit PIN Test', async ({ page }) => {

    const {
        pincodeInput,
        applyButton,
        popupHeading
    } = await openLocationPopup(page);

    // Enter six-digit PIN
    await pincodeInput.fill('110001');

    // Verify entered PIN
    await expect(pincodeInput).toHaveValue('110001');

    // Verify PIN length
    expect((await pincodeInput.inputValue()).length).toBe(6);

    // Verify Apply button is enabled
    await expect(applyButton).toBeEnabled();

    // Click Apply
    await applyButton.click();

    // Verify popup closes after applying PIN
    await expect(popupHeading).toBeHidden({
        timeout: 10000
    });
});


// TC_03: Verify incomplete PIN
test('Amazon Incomplete PIN Validation Test', async ({ page }) => {

    const {
        pincodeInput,
        applyButton
    } = await openLocationPopup(page);

    // Enter five-digit PIN
    await pincodeInput.fill('12345');

    // Verify entered PIN
    await expect(pincodeInput).toHaveValue('12345');

    // Verify PIN length is less than six
    expect((await pincodeInput.inputValue()).length).toBeLessThan(6);

    // Click Apply
    await applyButton.click();

    // Verify validation message
    const errorMessage = page.locator('#GLUXZipError');

    await expect(errorMessage).toBeVisible();

    await expect(errorMessage).toContainText(
        'Please enter a valid pincode'
    );
});


// TC_04: Verify short PIN
test('Amazon Short PIN Validation Test', async ({ page }) => {

    const {
        pincodeInput,
        applyButton
    } = await openLocationPopup(page);

    // Enter three-digit PIN
    await pincodeInput.fill('123');

    // Verify entered PIN
    await expect(pincodeInput).toHaveValue('123');

    // Verify PIN length is less than six
    expect((await pincodeInput.inputValue()).length).toBeLessThan(6);

    // Click Apply
    await applyButton.click();

    // Verify validation message
    const errorMessage = page.locator('#GLUXZipError');

    await expect(errorMessage).toBeVisible();

    await expect(errorMessage).toContainText(
        'Please enter a valid pincode'
    );
});


// TC_05: Verify alphabetic PIN validation
test('Amazon Alphabetic PIN Validation Test', async ({ page }) => {

    const {
        pincodeInput,
        applyButton
    } = await openLocationPopup(page);

    // Enter alphabetic characters
    await pincodeInput.fill('ABCDEF');

    // Verify the actual value accepted by input
    const enteredValue = await pincodeInput.inputValue();

    console.log('Alphabetic PIN input value:', enteredValue);

    // Click Apply
    await applyButton.click();

    // Verify validation message
    const errorMessage = page.locator('#GLUXZipError');

    await expect(errorMessage).toBeVisible();

    await expect(errorMessage).toContainText(
        'Please enter a valid pincode'
    );
});
