import { test, expect } from '@playwright/test';

test.describe('Playlist Detail', () => {
  test.beforeEach(async ({ page }) => {
    // Mock: usuario autenticado
    await page.route('**/google-auth/profile**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          email: 'test@example.com',
          name: 'Test User',
          picture: 'https://example.com/avatar.png',
        }),
      }),
    );

    // Mock: lista de playlists
    await page.route('**/youtube/playlists**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          playlists: [
            { id: 'PL1', title: 'Playlist 1', thumbnail: 't1', totalVideos: 10, updatedAt: '2024-01-10T00:00:00Z' },
          ],
        }),
      }),
    );

    // Mock: detalle de playlist
    await page.route('**/youtube/playlist/PL1**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'PL1',
          title: 'Playlist 1',
          description: 'Descripción',
          thumbnail: 'https://example.com/thumb.jpg',
          totalVideos: 12,
          protect: false,
          updatedAt: '2024-01-15T10:30:00Z',
          videos: Array.from({ length: 12 }, (_, i) => ({
            id: `v${i}`,
            title: `Video ${i}`,
            channelTitle: `Canal ${i}`,
            thumbnail: `https://example.com/thumb${i}.jpg`,
            publishedAt: `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
          })),
        }),
      }),
    );
  });

  test('should navigate to playlist detail', async ({ page }) => {
    await page.goto('/playlists');
    await page.waitForSelector('text=Playlist 1', { timeout: 10000 });
    await page.click('text=Playlist 1');
    await expect(page).toHaveURL(/\/playlist\//);
  });

  test('should show playlist title', async ({ page }) => {
    await page.goto('/playlist/PL1');
    await expect(page.getByText('Playlist 1').first()).toBeVisible({ timeout: 10000 });
  });

  test('should handle pagination', async ({ page }) => {
    await page.goto('/playlist/PL1');
    await page.waitForTimeout(2000);
    const content = await page.content();
    console.log('PAGE CONTENT:', content);
    await page.waitForSelector('text=Video 11', { timeout: 10000 });
    const nextButton = page.locator('button:has-text("Siguiente"), button[aria-label*="next" i]').first();
    if (await nextButton.isVisible().catch(() => false)) {
      await nextButton.click();
      await page.waitForTimeout(500);
    }
  });
});
