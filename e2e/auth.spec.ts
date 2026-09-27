import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Mock: usuario NO autenticado (perfil null)
    await page.route('**/google-auth/profile**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(null),
      }),
    );
  });

  test('should redirect unauthenticated users to home', async ({ page }) => {
    await page.goto('/playlists');
    await expect(page).toHaveURL(/\/$/);
  });

  test('should show login button on home page', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('button', { name: /iniciar sesión|login|google/i }),
    ).toBeVisible();
  });

  test('should redirect to home when accessing playlist without auth', async ({ page }) => {
    await page.goto('/playlist/PL123');
    await expect(page).toHaveURL(/\/$/);
  });
});
