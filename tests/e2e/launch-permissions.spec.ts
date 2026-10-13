import { expect, test } from '@playwright/test';

const baseUrl = process.env.LAUNCH_E2E_BASE_URL;

test.describe('launch permission boundaries', () => {
  test.skip(!baseUrl, 'LAUNCH_E2E_BASE_URL and prepared denied/ended account states are required');

  test('does not expose another house, ended chat, or ended attachment', async ({ page, request }) => {
    const foreignHomeId = process.env.LAUNCH_FOREIGN_HOME_ID;
    const endedRoomId = process.env.LAUNCH_ENDED_ROOM_ID;
    const endedAttachmentId = process.env.LAUNCH_ENDED_ATTACHMENT_ID;
    test.skip(!foreignHomeId || !endedRoomId || !endedAttachmentId, 'foreign home, ended room, and ended attachment IDs are required');

    await page.goto(new URL(`/homes/${foreignHomeId}`, baseUrl).toString());
    await expect(page.getByRole('alert')).toContainText('확인할 수 없습니다');
    await page.goto(new URL(`/chats/${endedRoomId}`, baseUrl).toString());
    await expect(page.getByRole('alert')).toContainText('확인할 수 없습니다');
    const attachment = await request.get(new URL(`/api/attachments/${endedAttachmentId}/url`, baseUrl).toString());
    expect([403, 404]).toContain(attachment.status());
  });
});
