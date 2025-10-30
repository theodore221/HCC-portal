export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
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
          date_range: string | null;
          catering_required: boolean;
          chapel_required: boolean;
          notes: string | null;
          status: Database["public"]["Enums"]["booking_status"];
          deposit_amount: number | null;
          deposit_status: Database["public"]["Enums"]["payment_status"];
          deposit_received_at: string | null;
          deposit_reference: string | null;
        };
        Insert: never;
        Update: never;
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
        Insert: never;
        Update: never;
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
        Insert: never;
        Update: never;
        Relationships: [];
      };
      meal_job_items: {
        Row: {
          meal_job_id: string;
          menu_item_id: string;
        };
        Insert: never;
        Update: never;
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
        Insert: never;
        Update: never;
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
        Insert: never;
        Update: never;
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
        Insert: never;
        Update: never;
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
        Insert: never;
        Update: never;
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
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      booking_status:
        | "Pending"
        | "InTriage"
        | "Approved"
        | "DepositPending"
        | "DepositReceived"
        | "InProgress"
        | "Completed"
        | "Cancelled";
      meal_type:
        | "Breakfast"
        | "Morning Tea"
        | "Lunch"
        | "Afternoon Tea"
        | "Dinner";
      meal_job_status:
        | "Draft"
        | "PendingAssignment"
        | "Assigned"
        | "Confirmed"
        | "InPrep"
        | "Served"
        | "Completed"
        | "Cancelled";
      assignment_mode: "Auto" | "Manual";
      space_res_status: "Held" | "Confirmed";
      severity: "Low" | "Moderate" | "High" | "Fatal";
      task_type: "PercolatedCoffee";
      task_status: "Open" | "Done";
      payment_kind: "Deposit" | "Balance";
      payment_status: "Pending" | "Paid" | "Failed" | "Cancelled";
    };
  };
}
