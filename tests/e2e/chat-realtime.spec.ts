import { expect, test } from '@playwright/test';

const baseUrl = process.env.CHAT_E2E_BASE_URL;

test.describe('chat responsive and reconnect flow', () => {
  test.skip(!baseUrl, 'CHAT_E2E_BASE_URL and an authenticated browser state are required');

  for (const width of [320, 390, 1440]) {
    test(`chat remains usable at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(new URL('/chats', baseUrl).toString());
      await expect(page.getByRole('heading', { name: '채팅' })).toBeVisible();
      await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll');
    });
  }

  test('keeps a draft through offline and retries after reconnect', async ({ page, context }) => {
    await page.goto(new URL('/chats', baseUrl).toString());
    await page.getByRole('link').filter({ hasText: /대화/ }).first().click();
    await page.getByRole('textbox', { name: '메시지' }).fill('연결 복구 확인');
    await context.setOffline(true);
    await expect(page.getByText(/인터넷 연결을 확인/)).toBeVisible();
    await context.setOffline(false);
    await expect(page.getByRole('textbox', { name: '메시지' })).toHaveValue('연결 복구 확인');
  });
});
