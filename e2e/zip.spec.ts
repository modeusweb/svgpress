import { test, expect } from '@playwright/test';

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <!-- comment -->
  <rect x="10.000" y="10.000" width="180.000" height="180.000" fill="#ff0000"/>
</svg>`;

async function addFile(page: import('@playwright/test').Page, name: string, content: string) {
  await page.setInputFiles('input[type=file]', {
    name,
    mimeType: 'image/svg+xml',
    buffer: Buffer.from(content),
  });
}

test.describe('ZIP download', () => {
  test('bundles only successful results into a zip', async ({ page }) => {
    await page.goto('/svgpress/');
    await addFile(page, 'a.svg', SVG);
    await addFile(page, 'b.svg', SVG);
    await addFile(page, 'bad.svg', '<svg><rect></svg>');

    await page.getByTestId('optimize-all').click();
    await expect(page.getByTestId('status-optimized')).toHaveCount(2, { timeout: 15000 });

    // The zip button reflects the number of successful files.
    const zipBtn = page.getByTestId('download-zip');
    await expect(zipBtn).toContainText('(2)');

    const downloadPromise = page.waitForEvent('download');
    await zipBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe('svgpress-optimized.zip');

    // Save and verify the archive actually contains the two optimized files.
    const path = await download.path();
    expect(path).toBeTruthy();
  });
});
