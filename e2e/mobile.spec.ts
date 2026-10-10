import { test, expect } from '@playwright/test';

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect x="10.000" y="10.000" width="100.000" height="100.000" fill="#00ff00"/>
</svg>`;

async function addFile(page: import('@playwright/test').Page, name: string, content: string) {
  await page.setInputFiles('input[type=file]', {
    name,
    mimeType: 'image/svg+xml',
    buffer: Buffer.from(content),
  });
}

test.use({ viewport: { width: 390, height: 844 } });

test('mobile: optimize and download single file', async ({ page }) => {
  await page.goto('/svgpress/');
  await addFile(page, 'm.svg', SVG);

  await page.getByTestId('optimize-all').click();
  await expect(page.getByTestId('status-optimized')).toHaveCount(1, { timeout: 15000 });

  // Download button triggers a file download.
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download m\.svg/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('m.svg');

  // No horizontal overflow on mobile.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
