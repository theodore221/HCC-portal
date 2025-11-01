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
  };
};
