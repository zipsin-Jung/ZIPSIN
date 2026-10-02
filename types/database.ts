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
