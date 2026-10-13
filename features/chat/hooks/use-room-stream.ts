'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { mergeMessagePages } from '@/features/chat/services/message';
import type { ChatMessagePageItem } from '@/features/chat/domain/room';

export type RoomConnection = 'connected' | 'reconnecting' | 'offline';

export function useRoomStream(roomId: string, initialMessages: ChatMessagePageItem[]) {
  const [messages, setMessages] = useState(initialMessages);
  const [connection, setConnection] = useState<RoomConnection>(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'connected');
  const latestId = useRef(Math.max(0, ...initialMessages.map((message) => message.id)));
  const refresh = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase.from('chat_messages').select('id, room_id, sender_user_id, body, created_at').eq('room_id', roomId).gt('id', latestId.current).order('id', { ascending: false }).limit(100);
    if (data?.length) {
      latestId.current = Math.max(latestId.current, ...data.map((message) => message.id));
      setMessages((current) => mergeMessagePages(data, current));
    }
  }, [roomId]);

  useEffect(() => {
    const online = () => { setConnection('reconnecting'); void refresh().finally(() => setConnection('connected')); };
    const offline = () => setConnection('offline');
    window.addEventListener('online', online); window.addEventListener('offline', offline);
    const supabase = createBrowserSupabaseClient();
    const realtimeEnabled = process.env.NEXT_PUBLIC_PILOT_CHAT_REALTIME_ENABLED !== 'false';
    const timer = window.setInterval(() => { if (navigator.onLine) void refresh(); }, realtimeEnabled ? 15000 : 5000);
    const channel = realtimeEnabled ? supabase.channel(`chat:${roomId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, () => void refresh()).subscribe((status) => {
      if (status === 'SUBSCRIBED') setConnection('connected');
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setConnection('reconnecting');
    }) : null;
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline); window.clearInterval(timer); if (channel) void supabase.removeChannel(channel); };
  }, [refresh, roomId]);

  useEffect(() => {
    const newest = messages[0]?.id;
    if (!newest) return;
    const supabase = createBrowserSupabaseClient();
    void supabase.rpc('mark_chat_read', { p_room_id: roomId, p_last_read_message_id: newest });
  }, [messages, roomId]);
  return { messages, connection };
}
