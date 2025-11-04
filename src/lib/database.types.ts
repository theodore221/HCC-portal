export type ProfileRole = "admin" | "staff" | "caterer" | "customer";

export interface ProfileRecord {
  id: string;
  email: string | null;
  full_name: string | null;
  role: ProfileRole;
  booking_reference: string | null;
  guest_token: string | null;
  caterer_id: string | null;
  created_at: string;
  password_initialized_at: string | null;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRecord;
        Insert: Partial<ProfileRecord>;
        Update: Partial<ProfileRecord>;
      };
    };
    Functions: {
      ensure_profile_for_current_user: {
        Args: Record<string, never>;
        Returns: ProfileRecord;
      };
      set_password_initialized_at: {
        Args: Record<string, never>;
        Returns: ProfileRecord;
      };
    };
  };
};
