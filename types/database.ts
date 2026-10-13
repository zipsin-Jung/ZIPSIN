export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      offices: {
        Row: { id: string; name: string; created_by: string; verification_status: 'pending' | 'verified' | 'rejected' | 'suspended'; created_at: string; updated_at: string };
        Insert: { id?: string; name: string; created_by: string; verification_status?: 'pending' | 'verified' | 'rejected' | 'suspended'; created_at?: string; updated_at?: string };
        Update: { name?: string; verification_status?: 'pending' | 'verified' | 'rejected' | 'suspended'; updated_at?: string };
        Relationships: [];
      };
      office_memberships: {
        Row: { id: string; office_id: string; user_id: string; office_role: 'principal_broker' | 'associate_broker' | 'assistant'; status: 'active' | 'ended'; invited_by: string | null; started_at: string; ended_at: string | null; created_at: string };
        Insert: { id?: string; office_id: string; user_id: string; office_role: 'principal_broker' | 'associate_broker' | 'assistant'; status?: 'active' | 'ended'; invited_by?: string | null; started_at?: string; ended_at?: string | null; created_at?: string };
        Update: { status?: 'active' | 'ended'; ended_at?: string | null };
        Relationships: [];
      };
      homes: {
        Row: { id: string; office_id: string | null; address_line1: string; address_detail: string | null; home_label: string | null; idempotency_key: string | null; address_fingerprint: string; created_by: string; status: 'active' | 'archived'; created_at: string; updated_at: string };
        Insert: { id?: string; office_id: string; address_line1: string; address_detail?: string | null; home_label?: string | null; idempotency_key: string; address_fingerprint: string; created_by: string; status?: 'active' | 'archived'; created_at?: string; updated_at?: string };
        Update: { address_line1?: string; address_detail?: string | null; home_label?: string | null; status?: 'active' | 'archived'; updated_at?: string };
        Relationships: [];
      };
      office_home_assignments: {
        Row: { id: string; office_id: string; home_id: string; assigned_user_id: string; assigned_by: string; status: 'active' | 'ended'; started_at: string; ended_at: string | null };
        Insert: { id?: string; office_id: string; home_id: string; assigned_user_id: string; assigned_by: string; status?: 'active' | 'ended'; started_at?: string; ended_at?: string | null };
        Update: { status?: 'active' | 'ended'; ended_at?: string | null };
        Relationships: [];
      };
      contracts: {
        Row: { id: string; home_id: string; contract_kind: 'owner_occupied' | 'jeonse' | 'monthly_rent' | 'other'; status: 'draft' | 'active' | 'ended' | 'cancelled'; starts_on: string | null; ends_on: string | null; created_by: string; created_at: string; updated_at: string };
        Insert: { id?: string; home_id: string; contract_kind: 'owner_occupied' | 'jeonse' | 'monthly_rent' | 'other'; status?: 'draft' | 'active' | 'ended' | 'cancelled'; starts_on?: string | null; ends_on?: string | null; created_by: string; created_at?: string; updated_at?: string };
        Update: { status?: 'draft' | 'active' | 'ended' | 'cancelled'; starts_on?: string | null; ends_on?: string | null; updated_at?: string };
        Relationships: [];
      };
      home_memberships: {
        Row: { id: string; home_id: string; contract_id: string | null; user_id: string; relationship_role: 'landlord' | 'tenant' | 'repairer'; status: 'pending' | 'active' | 'ended' | 'revoked'; access_scope: 'current_contract' | 'shared_history' | 'repair_event'; starts_at: string; expires_at: string | null; ended_at: string | null; created_at: string };
        Insert: { id?: string; home_id: string; contract_id?: string | null; user_id: string; relationship_role: 'landlord' | 'tenant' | 'repairer'; status?: 'pending' | 'active' | 'ended' | 'revoked'; access_scope?: 'current_contract' | 'shared_history' | 'repair_event'; starts_at?: string; expires_at?: string | null; ended_at?: string | null; created_at?: string };
        Update: { status?: 'pending' | 'active' | 'ended' | 'revoked'; ended_at?: string | null };
        Relationships: [];
      };
      invitations: {
        Row: { id: string; token_hash: string; invitation_kind: 'office_member' | 'home_member' | 'repair_event'; office_id: string | null; home_id: string | null; contract_id: string | null; intended_role: string; access_scope: 'current_contract' | 'repair_event' | null; relationship_expires_at: string | null; invited_identifier_hash: string; created_by: string; expires_at: string; revoked_at: string | null; accepted_at: string | null; accepted_by: string | null; created_at: string };
        Insert: { id?: string; token_hash: string; invitation_kind: 'office_member' | 'home_member' | 'repair_event'; office_id?: string | null; home_id?: string | null; contract_id?: string | null; intended_role: string; access_scope?: 'current_contract' | 'repair_event' | null; relationship_expires_at?: string | null; invited_identifier_hash: string; created_by: string; expires_at: string; revoked_at?: string | null; accepted_at?: string | null; accepted_by?: string | null; created_at?: string };
        Update: { revoked_at?: string | null; accepted_at?: string | null; accepted_by?: string | null; relationship_expires_at?: string | null };
        Relationships: [];
      };
      records: {
        Row: { id: string; home_id: string; office_id: string | null; contract_id: string | null; record_space: 'office_internal' | 'current_contract' | 'shared_history'; record_kind: 'note' | 'photo' | 'document' | 'repair' | 'schedule' | 'task'; title: string; body: string | null; task_status: 'todo' | 'in_progress' | 'done' | null; task_due_at: string | null; task_assigned_to: string | null; created_by: string; idempotency_key: string; occurred_at: string; created_at: string; updated_at: string };
        Insert: { id?: string; home_id: string; office_id?: string | null; contract_id?: string | null; record_space: 'office_internal' | 'current_contract' | 'shared_history'; record_kind: 'note' | 'photo' | 'document' | 'repair' | 'schedule' | 'task'; title: string; body?: string | null; task_status?: 'todo' | 'in_progress' | 'done' | null; task_due_at?: string | null; task_assigned_to?: string | null; created_by: string; idempotency_key: string; occurred_at?: string; created_at?: string; updated_at?: string };
        Update: { title?: string; body?: string | null; task_status?: 'todo' | 'in_progress' | 'done' | null; task_due_at?: string | null; task_assigned_to?: string | null; occurred_at?: string; updated_at?: string };
        Relationships: [];
      };
      attachments: {
        Row: { id: string; record_id: string; storage_path: string; original_name: string; media_type: string; byte_size: number; checksum_sha256: string | null; status: 'pending' | 'ready' | 'failed' | 'quarantined'; created_by: string; created_at: string };
        Insert: { id?: string; record_id: string; storage_path: string; original_name: string; media_type: string; byte_size: number; checksum_sha256?: string | null; status?: 'pending' | 'ready' | 'failed' | 'quarantined'; created_by: string; created_at?: string };
        Update: { status?: 'pending' | 'ready' | 'failed' | 'quarantined'; checksum_sha256?: string | null };
        Relationships: [];
      };
      chat_rooms: {
        Row: { id: string; room_type: 'direct' | 'group' | 'home_shared' | 'office_internal' | 'repair_event' | 'support'; title: string | null; office_id: string | null; home_id: string | null; contract_id: string | null; relationship_id: string | null; direct_key: string | null; relation_key: string | null; created_by: string; status: 'active' | 'closed'; created_at: string; closed_at: string | null };
        Insert: { id?: string; room_type: 'direct' | 'group' | 'home_shared' | 'office_internal' | 'repair_event' | 'support'; title?: string | null; office_id?: string | null; home_id?: string | null; contract_id?: string | null; relationship_id?: string | null; direct_key?: string | null; relation_key?: string | null; created_by: string; status?: 'active' | 'closed'; created_at?: string; closed_at?: string | null };
        Update: { title?: string | null; status?: 'active' | 'closed'; closed_at?: string | null };
        Relationships: [];
      };
      chat_room_memberships: {
        Row: { id: string; room_id: string; user_id: string; membership_role: 'owner' | 'member'; status: 'active' | 'ended'; joined_at: string; ended_at: string | null };
        Insert: { id?: string; room_id: string; user_id: string; membership_role?: 'owner' | 'member'; status?: 'active' | 'ended'; joined_at?: string; ended_at?: string | null };
        Update: { status?: 'active' | 'ended'; ended_at?: string | null };
        Relationships: [];
      };
      chat_messages: {
        Row: { id: number; room_id: string; sender_user_id: string; body: string; idempotency_key: string; created_at: string };
        Insert: { id?: never; room_id: string; sender_user_id: string; body: string; idempotency_key: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      chat_read_states: {
        Row: { room_id: string; user_id: string; last_read_message_id: number; read_at: string };
        Insert: { room_id: string; user_id: string; last_read_message_id: number; read_at?: string };
        Update: { last_read_message_id?: number; read_at?: string };
        Relationships: [];
      };
      notifications: {
        Row: { id: number; user_id: string; notification_kind: 'chat_message'; room_id: string; message_id: number; created_at: string; read_at: string | null };
        Insert: { id?: never; user_id: string; notification_kind: 'chat_message'; room_id: string; message_id: number; created_at?: string; read_at?: string | null };
        Update: { read_at?: string | null };
        Relationships: [];
      };
      access_audit_events: {
        Row: { id: number; actor_user_id: string | null; action: string; resource_type: string; resource_id: string | null; office_id: string | null; home_id: string | null; outcome: 'allowed' | 'denied'; reason_code: string; created_at: string };
        Insert: { actor_user_id?: string | null; action: string; resource_type: string; resource_id?: string | null; office_id?: string | null; home_id?: string | null; outcome: 'allowed' | 'denied'; reason_code: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      account_usernames: {
        Row: {
          user_id: string;
          username_normalized: string;
          status: 'pending' | 'active';
          created_at: string;
          activated_at: string | null;
        };
        Insert: {
          user_id: string;
          username_normalized: string;
          status?: 'pending' | 'active';
          created_at?: string;
          activated_at?: string | null;
        };
        Update: {
          status?: 'pending' | 'active';
          activated_at?: string | null;
        };
        Relationships: [];
      };
      auth_rate_limits: {
        Row: { scope: string; key_hash: string; window_start: string; attempts: number };
        Insert: { scope: string; key_hash: string; window_start: string; attempts?: number };
        Update: { attempts?: number };
        Relationships: [];
      };
      auth_cleanup_queue: {
        Row: { user_id: string; reason: string; created_at: string; resolved_at: string | null };
        Insert: { user_id: string; reason?: string; created_at?: string; resolved_at?: string | null };
        Update: { reason?: string; resolved_at?: string | null };
        Relationships: [];
      };
      profiles: {
        Row: {
          user_id: string;
          display_name: string | null;
          email: string | null;
          phone_e164: string | null;
          phone_verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          display_name?: string | null;
          email?: string | null;
          phone_e164?: string | null;
          phone_verified_at?: string | null;
        };
        Update: {
          display_name?: string | null;
          email?: string | null;
          phone_e164?: string | null;
          phone_verified_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      consent_acceptances: {
        Row: {
          id: string;
          user_id: string;
          document_type: 'terms' | 'privacy' | 'age_over_14' | 'marketing_sms' | 'marketing_email';
          document_version: string;
          accepted: boolean;
          accepted_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_type: 'terms' | 'privacy' | 'age_over_14' | 'marketing_sms' | 'marketing_email';
          document_version: string;
          accepted: boolean;
          accepted_at?: string;
        };
        Update: { accepted?: boolean; accepted_at?: string };
        Relationships: [];
      };
      phone_verification_states: {
        Row: { user_id: string; challenge_id: string; phone_e164: string; sent_at: string; expires_at: string; verified_at: string | null; consumed_at: string | null; provider_reference_hash: string | null };
        Insert: { user_id: string; challenge_id: string; phone_e164: string; sent_at?: string; expires_at: string; verified_at?: string | null; consumed_at?: string | null; provider_reference_hash?: string | null };
        Update: { challenge_id?: string; phone_e164?: string; sent_at?: string; expires_at?: string; verified_at?: string | null; consumed_at?: string | null; provider_reference_hash?: string | null };
        Relationships: [];
      };
      user_roles: {
        Row: {
          user_id: string;
          primary_role: 'principal_broker' | 'assistant' | 'landlord' | 'tenant';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          primary_role: 'principal_broker' | 'assistant' | 'landlord' | 'tenant';
        };
        Update: {
          primary_role?: 'principal_broker' | 'assistant' | 'landlord' | 'tenant';
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_active_office_member: { Args: { p_office_id: string }; Returns: boolean };
      is_principal_office_member: { Args: { p_office_id: string }; Returns: boolean };
      can_perform_office_action: { Args: { p_office_id: string; p_action: string }; Returns: boolean };
      has_active_home_access: { Args: { p_home_id: string }; Returns: boolean };
      has_active_office_home_access: { Args: { p_home_id: string }; Returns: boolean };
      can_access_office_home: { Args: { p_home_id: string }; Returns: boolean };
      can_write_office_home: { Args: { p_home_id: string }; Returns: boolean };
      can_access_contract: { Args: { p_contract_id: string }; Returns: boolean };
      can_access_record: { Args: { p_record_id: string }; Returns: boolean };
      can_create_record: { Args: { p_home_id: string; p_office_id: string | null; p_contract_id: string | null; p_record_space: string; p_record_kind: string }; Returns: boolean };
      create_office: { Args: { p_name: string }; Returns: string };
      create_home_for_office: { Args: { p_office_id: string; p_address_line1: string; p_address_detail: string; p_home_label: string; p_idempotency_key: string }; Returns: string };
      create_office_invitation: { Args: { p_office_id: string; p_role: string; p_token: string; p_expires_at: string }; Returns: string };
      accept_office_invitation: { Args: { p_token: string }; Returns: string };
      preview_office_invitation: { Args: { p_token: string }; Returns: Json };
      revoke_office_invitation: { Args: { p_invitation_id: string }; Returns: undefined };
      create_relationship_invitation: { Args: { p_home_id: string; p_contract_id: string | null; p_role: string; p_scope: string; p_token: string; p_expires_at: string; p_relationship_expires_at: string | null }; Returns: string };
      accept_relationship_invitation: { Args: { p_token: string }; Returns: string };
      preview_relationship_invitation: { Args: { p_token: string }; Returns: Json };
      end_home_relationship: { Args: { p_membership_id: string }; Returns: undefined };
      can_access_chat_room: { Args: { p_room_id: string }; Returns: boolean };
      can_send_chat_message: { Args: { p_room_id: string }; Returns: boolean };
      send_chat_message: { Args: { p_room_id: string; p_body: string; p_idempotency_key: string }; Returns: number };
      mark_chat_read: { Args: { p_room_id: string; p_last_read_message_id: number }; Returns: undefined };
      can_chat_with_user: { Args: { p_other_user_id: string }; Returns: boolean };
      create_direct_room: { Args: { p_other_user_id: string }; Returns: string };
      create_group_room: { Args: { p_title: string; p_member_ids: string[] }; Returns: string };
      create_relationship_room: { Args: { p_room_type: string; p_office_id: string | null; p_home_id: string | null; p_contract_id: string | null; p_relationship_id: string | null }; Returns: string };
      invite_chat_member: { Args: { p_room_id: string; p_user_id: string }; Returns: string };
      leave_chat_room: { Args: { p_room_id: string }; Returns: undefined };
      assign_office_member_to_home: { Args: { p_office_id: string; p_home_id: string; p_user_id: string }; Returns: string };
      end_office_home_assignment: { Args: { p_assignment_id: string }; Returns: undefined };
      create_home_record: { Args: { p_home_id: string; p_office_id: string | null; p_contract_id: string | null; p_space: string; p_kind: string; p_title: string; p_body: string; p_idempotency_key: string; p_task_due_at: string | null; p_task_assigned_to: string | null }; Returns: string };
      update_task_state: { Args: { p_record_id: string; p_status: string }; Returns: undefined };
      prepare_attachment_upload: { Args: { p_record_id: string; p_original_name: string; p_media_type: string; p_byte_size: number }; Returns: Json };
      complete_attachment_upload: { Args: { p_attachment_id: string; p_checksum_sha256: string }; Returns: undefined };
      claim_username: {
        Args: { p_username: string };
        Returns: boolean;
      };
      consume_auth_rate_limit: {
        Args: { p_scope: string; p_key: string; p_limit: number; p_window_seconds: number };
        Returns: boolean;
      };
      complete_signup: {
        Args: {
          p_display_name: string;
          p_email: string;
          p_challenge_id: string;
          p_terms_version: string;
          p_privacy_version: string;
          p_marketing_sms: boolean;
          p_marketing_email: boolean;
        };
        Returns: undefined;
      };
      set_primary_role: {
        Args: { p_primary_role: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
