import { Database } from "./database.types";

// Check keys
type Tables = Database["public"]["Tables"];
type Keys = keyof Tables;
const keyCheck: Keys = "room_status_logs"; // Should pass

// Check Insert type
type LogsInsert = Tables["room_status_logs"]["Insert"];
const insertCheck: LogsInsert = { randomField: 123 }; // Should pass if any

// Check Row type
type LogsRow = Tables["room_status_logs"]["Row"];
const rowCheck: LogsRow = {
  id: "1",
  room_id: "1",
  action_type: "cleaned",
  action_date: "2023-01-01",
  performed_by: "user",
  performed_at: "now",
  booking_id: null,
  notes: null,
};
