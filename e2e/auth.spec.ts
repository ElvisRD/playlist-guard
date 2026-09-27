import { test, expect } from '@playwright/test';

const loggedInProfile = {
  email: 'test@example.com',
  name: 'Test User',
  picture: 'https://example.com/avatar.png',
};

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

  test('should show the user after a successful Google login', async ({ page }) => {
    // Simula el popup de Google Identity Services sin depender de credenciales reales
    await page.addInitScript(() => {
      (window as unknown as Record<string, unknown>).google = {
        accounts: {
          oauth2: {
            initCodeClient: (config: {
              callback?: (response: { code?: string; error?: string }) => void;
            }) => ({
              requestCode: () => {
                if (config.callback) {
                  config.callback({ code: 'stub-code' });
                }
              },
            }),
          },
        },
      };
    });

    // La primera carga devuelve null (sin sesión); tras el intercambio de code, el perfil real
    let profileCalls = 0;
    await page.route('**/google-auth/profile**', (route) => {
      profileCalls += 1;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(profileCalls > 1 ? loggedInProfile : null),
      });
    });

    await page.route('**/google-auth/code**', (route) =>
      route.fulfill({ status: 200 }),
    );

    await page.goto('/');

    const loginButton = page.getByRole('button', { name: /iniciar sesión|login|google/i });
    await expect(loginButton).toBeVisible();
    await loginButton.click();

    await expect(
      page.getByRole('button', { name: /cerrar sesión/i }),
    ).toBeVisible({ timeout: 10000 });
    await expect(loginButton).not.toBeVisible();
  });

  test('should log out and return to the login button', async ({ page }) => {
    // Usuario autenticado al cargar
    await page.route('**/google-auth/profile**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(loggedInProfile),
      }),
    );
    await page.route('**/google-auth/logout**', (route) =>
      route.fulfill({ status: 200 }),
    );

    await page.goto('/');

    const logoutButton = page.getByRole('button', { name: /cerrar sesión/i });
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole('button', { name: /iniciar sesión|login|google/i }),
    ).toBeVisible({ timeout: 10000 });
  });
});