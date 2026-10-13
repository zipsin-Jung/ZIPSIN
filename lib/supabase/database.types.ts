// Regenerate from an applied Supabase schema before Preview deployment.
export type Json = string | number | boolean | null | {[key: string]: Json | undefined} | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {Row: {user_id: string; display_name: string | null; email: string | null; phone_e164: string | null; phone_verified_at: string | null; onboarding_state: string; user_type: string | null; created_at: string; updated_at: string}};
      signup_attributions: {Row: {id: string; user_id: string; source: string; created_at: string}};
      transfer_manifests: {Row: {id: string; owner_user_id: string; request_key: string; status: string; expected_counts_json: Json; confirmed_counts_json: Json; created_at: string; updated_at: string}};
      candidate_drafts: {Row: {id: string; owner_user_id: string; manifest_id: string | null; local_candidate_id: string; alias: string; listing_json: Json; terms_json: Json; contact_json: Json; commute_json: Json; created_at: string; updated_at: string}};
      candidate_answers: {Row: {id: string; candidate_id: string; item_id: string; status: string; source: string; memo: string | null; action_checks_json: Json}};
      candidate_photos: {Row: {id: string; candidate_id: string; local_photo_id: string | null; item_id: string; storage_path: string; bytes: number; mime: string; created_at: string}};
      transfer_items: {Row: {id: string; manifest_id: string; local_candidate_id: string; item_type: string; item_key: string; status: string; error_code: string | null; updated_at: string}};
    };
    Views: Record<string, never>;
    Functions: {
      complete_check_onboarding: {
        Args: { p_user_type: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
