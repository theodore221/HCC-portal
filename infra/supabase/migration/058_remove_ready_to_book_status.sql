-- Migration 058: Remove ready_to_book enquiry status
-- Pipeline simplifies to: new → in_discussion → quoted → converted_to_booking | lost
-- Any enquiries in ready_to_book are moved back to quoted

UPDATE enquiries SET status = 'quoted' WHERE status = 'ready_to_book';
