import { test, expect } from '@playwright/test';

test.describe('Playlists', () => {
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
  });

  test('should display playlists page when authenticated', async ({ page }) => {
    await page.goto('/playlists');
    await expect(page).toHaveURL(/\/playlists/);
    await expect(page.getByText('Playlist 1')).toBeVisible({ timeout: 10000 });
  });

  test('should show loading state', async ({ page }) => {
    // Retrasar la respuesta para ver el estado de carga
    await page.route('**/youtube/playlists**', async (route) => {
      await new Promise((r) => setTimeout(r, 2000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ playlists: [] }),
      });
    });

    await page.goto('/playlists');
    // El indicador de carga debe aparecer brevemente
    await expect(page.locator('text=Obteniendo playlists').first()).toBeVisible({ timeout: 5000 });
  });
});
