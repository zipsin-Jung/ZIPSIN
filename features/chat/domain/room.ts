export const CHAT_MESSAGE_MAX_LENGTH = 2000;
export const CHAT_PAGE_SIZE = 30;

export type ChatMessagePageItem = {
  id: number;
  room_id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
  sender_kind: 'user' | 'support';
  support_identity_id: string | null;
};
