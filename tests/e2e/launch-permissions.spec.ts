import { expect, test } from '@playwright/test';

const baseUrl = process.env.LAUNCH_E2E_BASE_URL;

test.describe('launch permission boundaries', () => {
  test.skip(!baseUrl, 'LAUNCH_E2E_BASE_URL and prepared denied/ended account states are required');

  test('does not expose another house or a relationship-ended room', async ({ page }) => {
    const foreignHomeId = process.env.LAUNCH_FOREIGN_HOME_ID;
    const endedRoomId = process.env.LAUNCH_ENDED_ROOM_ID;
    test.skip(!foreignHomeId || !endedRoomId, 'foreign home and ended room IDs are required');

    await page.goto(new URL(`/homes/${foreignHomeId}`, baseUrl).toString());
    await expect(page.getByRole('alert')).toContainText('확인할 수 없습니다');
    await page.goto(new URL(`/chats/${endedRoomId}`, baseUrl).toString());
    await expect(page.getByRole('alert')).toContainText('확인할 수 없습니다');
  });
});
