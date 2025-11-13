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
      bookings: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          external_id: string | null;
          form_response_id: string | null;
          customer_user_id: string | null;
          customer_email: string;
          customer_name: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          reference: string | null;
          booking_type: "Group" | "Individual";
          event_type: string | null;
          is_overnight: boolean;
          headcount: number;
          arrival_date: string;
          departure_date: string;
          nights: number;
          date_range: unknown;
          catering_required: boolean;
          chapel_required: boolean;
          notes: string | null;
          status: Database["public"]["Enums"]["booking_status"];
          deposit_amount: number | null;
          deposit_status: Database["public"]["Enums"]["payment_status"];
          deposit_received_at: string | null;
          deposit_reference: string | null;
          portal_metadata: Json | null;
        };
        Insert: Partial<Database["public"]["Tables"]["bookings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["bookings"]["Row"]>;
        Relationships: [];
      };
      caterers: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          active: boolean;
          user_id: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["caterers"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["caterers"]["Row"]>;
        Relationships: [];
      };
      dietary_profiles: {
        Row: {
          id: string;
          booking_id: string;
          person_name: string;
          diet_type: string;
          allergy: string | null;
          severity: Database["public"]["Enums"]["severity"] | null;
          notes: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["dietary_profiles"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["dietary_profiles"]["Row"]>;
        Relationships: [];
      };
      meal_job_items: {
        Row: {
          meal_job_id: string;
          menu_item_id: string;
        };
        Insert: Database["public"]["Tables"]["meal_job_items"]["Row"];
        Update: Database["public"]["Tables"]["meal_job_items"]["Row"];
        Relationships: [];
      };
      meal_jobs: {
        Row: {
          id: string;
          booking_id: string;
          service_date: string;
          meal: Database["public"]["Enums"]["meal_type"];
          service_time: string | null;
          counts_total: number;
          counts_by_diet: Json;
          percolated_coffee: boolean;
          assignment_mode: Database["public"]["Enums"]["assignment_mode"];
          assigned_caterer_id: string | null;
          status: Database["public"]["Enums"]["meal_job_status"];
        };
        Insert: Partial<Database["public"]["Tables"]["meal_jobs"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["meal_jobs"]["Row"]>;
        Relationships: [];
      };
      menu_items: {
        Row: {
          id: string;
          label: string;
          allergens: string[] | null;
          dietary_tags: string[] | null;
          default_caterer_id: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["menu_items"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["menu_items"]["Row"]>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRecord;
        Insert: Partial<ProfileRecord>;
        Update: Partial<ProfileRecord>;
        Relationships: [];
      };
      room_assignments: {
        Row: {
          id: string;
          booking_id: string;
          room_id: string;
          occupant_name: string;
          bed_number: number;
          is_extra_bed: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["room_assignments"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["room_assignments"]["Row"]>;
        Relationships: [];
      };
      rooms: {
        Row: {
          id: string;
          building: string | null;
          name: string;
          base_beds: number;
          extra_bed_allowed: boolean;
          extra_bed_fee: number | null;
          active: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["rooms"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["rooms"]["Row"]>;
        Relationships: [];
      };
      space_reservations: {
        Row: {
          id: string;
          booking_id: string;
          space_id: string;
          service_date: string;
          start_time: string | null;
          end_time: string | null;
          status: Database["public"]["Enums"]["space_res_status"];
        };
        Insert: Partial<Database["public"]["Tables"]["space_reservations"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["space_reservations"]["Row"]>;
        Relationships: [];
      };
      spaces: {
        Row: {
          id: string;
          name: string;
          capacity: number | null;
          features: string[] | null;
          active: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["spaces"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["spaces"]["Row"]>;
        Relationships: [];
      };
    };
    Views: {
      v_space_conflicts: {
        Row: {
          booking_id: string | null;
          conflicts_with: string | null;
          service_date: string | null;
          space_id: string | null;
        };
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
    Enums: {
      assignment_mode: "Auto" | "Manual";
      booking_status:
        | "Pending"
        | "InTriage"
        | "Approved"
        | "DepositPending"
        | "DepositReceived"
        | "InProgress"
        | "Completed"
        | "Cancelled";
      meal_job_status:
        | "Draft"
        | "PendingAssignment"
        | "Assigned"
        | "Confirmed"
        | "InPrep"
        | "Served"
        | "Completed"
        | "Cancelled";
      meal_type:
        | "Breakfast"
        | "Morning Tea"
        | "Lunch"
        | "Afternoon Tea"
        | "Dinner";
      payment_kind: "Deposit" | "Balance";
      payment_status: "Pending" | "Paid" | "Failed" | "Cancelled";
      severity: "Low" | "Moderate" | "High" | "Fatal";
      space_res_status: "Held" | "Confirmed";
      task_status: "Open" | "Done";
      task_type: "PercolatedCoffee";
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];

export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
