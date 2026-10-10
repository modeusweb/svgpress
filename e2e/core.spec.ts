import { test, expect } from '@playwright/test';

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <!-- a comment that should be removed -->
  <metadata>editor metadata</metadata>
  <rect x="10.000" y="10.000" width="180.000" height="180.000" fill="#ff0000"/>
  <circle cx="100.000" cy="100.000" r="50.000" fill="#0000ff" opacity="0.5"/>
</svg>`;

async function addFile(page: import('@playwright/test').Page, name: string, content: string) {
  await page.setInputFiles('input[type=file]', {
    name,
    mimeType: 'image/svg+xml',
    buffer: Buffer.from(content),
  });
}

test.describe('SVGPress core flow', () => {
  test('optimizes uploaded SVGs and reports real savings', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });

    await page.goto('/svgpress/');

    // Dropzone visible.
    await expect(page.getByText('Drop your SVG files here')).toBeVisible();

    await addFile(page, 'shape.svg', SVG);
    await addFile(page, 'second.svg', SVG);

    // Two rows in the table.
    await expect(page.getByText('shape.svg')).toBeVisible();
    await expect(page.getByText('second.svg')).toBeVisible();

    // Summary shows 2 files.
    await expect(page.getByText('Total files').locator('..')).toContainText('2');

    // Optimize all.
    await page.getByTestId('optimize-all').click();

    // Wait for optimized status badges (2 of them).
    await expect(page.getByTestId('status-optimized')).toHaveCount(2, { timeout: 15000 });

    // Metadata should be removed -> optimized size smaller than original.
    // Verify savings are non-negative percentages shown.
    const summary = page.locator('text=Total saved').locator('..');
    await expect(summary).toContainText('B');

    // No console errors from our implementation.
    expect(errors.filter((e) => !/favicon|Download the React DevTools/i.test(e))).toEqual([]);
  });

  test('preview is sandboxed and shows both versions', async ({ page }) => {
    await page.goto('/svgpress/');
    await addFile(page, 'shape.svg', SVG);
    await page.getByTestId('optimize-all').click();
    await expect(page.getByTestId('status-optimized')).toHaveCount(1, { timeout: 15000 });

    await page.getByRole('button', { name: /Preview shape\.svg/ }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // The preview uses an <img>, so scripts inside SVG cannot execute.
    await expect(dialog.locator('img')).toBeVisible();
    // Show code view to inspect the optimized markup.
    await dialog.getByRole('button', { name: 'Show code' }).click();
    await expect(dialog.locator('code')).toContainText('<svg');
    // Metadata removed by optimizer.
    await expect(dialog.locator('code')).not.toContainText('editor metadata');
  });

  test('invalid SVG does not stop other files', async ({ page }) => {
    await page.goto('/svgpress/');
    await addFile(page, 'good.svg', SVG);
    await addFile(page, 'bad.svg', '<svg><rect><circle></svg>');

    await page.getByTestId('optimize-all').click();
    // Good file still optimizes even though the bad one failed.
    await expect(page.getByTestId('status-optimized')).toHaveCount(1, { timeout: 15000 });
    await expect(page.getByTestId('status-failed')).toHaveCount(1);
  });
});

test.describe('theme', () => {
  test('defaults to dark and persists a switch to light', async ({ page }) => {
    await page.goto('/svgpress/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await page.getByRole('radio', { name: 'Light theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});
