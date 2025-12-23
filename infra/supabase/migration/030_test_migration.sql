-- Test script for migration 030
-- Run this AFTER applying the migration to verify everything works

-- 1. Verify new columns exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'minors'
  ) THEN
    RAISE EXCEPTION 'Column minors not found in bookings table';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'whole_centre'
  ) THEN
    RAISE EXCEPTION 'Column whole_centre not found in bookings table';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'accommodation_requests'
  ) THEN
    RAISE EXCEPTION 'Column accommodation_requests not found in bookings table';
  END IF;

  RAISE NOTICE 'All required columns exist';
END $$;

-- 2. Verify 'Whole Centre Day Hire' is inactive
DO $$
DECLARE
  space_active boolean;
BEGIN
  SELECT active INTO space_active
  FROM spaces
  WHERE id = 'Whole Centre Day Hire';

  IF space_active THEN
    RAISE EXCEPTION 'Whole Centre Day Hire space should be inactive';
  END IF;

  RAISE NOTICE 'Whole Centre Day Hire space is correctly inactive';
END $$;

-- 3. Test RPC with minors flag
DO $$
DECLARE
  test_booking_id uuid;
  test_minors boolean;
BEGIN
  test_booking_id := upsert_booking_snapshot('{
    "v": 3,
    "bookingId": "TEST_MINORS_001",
    "formResponseId": "form_minors_001",
    "email": "test.minors@example.com",
    "org": "Test Minors Organization",
    "contactName": "Test Contact",
    "contactPhone": "0400111111",
    "eventType": "Youth Camp",
    "headcount": 30,
    "minors": true,
    "whole_centre": false,
    "range": {
      "start": "2025-06-15T14:00:00",
      "end": "2025-06-17T10:00:00",
      "nights": 2
    },
    "overnight": true,
    "spaces": ["Chapel", "Corbett"],
    "accommodation": {
      "singleBB": 5,
      "doubleBB": 10,
      "doubleEnsuite": 3,
      "studySuite": 0,
      "byo_linen": false
    },
    "catering": {
      "required": true,
      "meals": []
    },
    "notes": "Test booking with minors"
  }'::jsonb);

  SELECT minors INTO test_minors
  FROM bookings
  WHERE id = test_booking_id;

  IF NOT test_minors THEN
    RAISE EXCEPTION 'Minors flag not set correctly';
  END IF;

  RAISE NOTICE 'Minors flag test PASSED (booking_id: %)', test_booking_id;
END $$;

-- 4. Test RPC with whole_centre flag
DO $$
DECLARE
  test_booking_id uuid;
  test_whole_centre boolean;
  spaces_count int;
  active_spaces_count int;
BEGIN
  -- Count active spaces (excluding Whole Centre Day Hire)
  SELECT COUNT(*) INTO active_spaces_count
  FROM spaces
  WHERE active = true AND id <> 'Whole Centre Day Hire';

  test_booking_id := upsert_booking_snapshot('{
    "v": 3,
    "bookingId": "TEST_WHOLE_CENTRE_001",
    "formResponseId": "form_whole_001",
    "email": "test.whole@example.com",
    "org": "Test Whole Centre Org",
    "contactName": "Test Contact",
    "contactPhone": "0400222222",
    "eventType": "Conference",
    "headcount": 100,
    "minors": false,
    "whole_centre": true,
    "range": {
      "start": "2025-07-01",
      "end": "2025-07-03"
    },
    "overnight": true,
    "spaces": [],
    "accommodation": {
      "singleBB": 20,
      "doubleBB": 30,
      "doubleEnsuite": 10,
      "studySuite": 5,
      "byo_linen": false
    },
    "catering": {
      "required": true,
      "meals": []
    },
    "notes": "Test booking with whole centre flag"
  }'::jsonb);

  SELECT whole_centre INTO test_whole_centre
  FROM bookings
  WHERE id = test_booking_id;

  IF NOT test_whole_centre THEN
    RAISE EXCEPTION 'Whole centre flag not set correctly';
  END IF;

  -- Check that ALL active spaces are reserved
  SELECT COUNT(DISTINCT space_id) INTO spaces_count
  FROM space_reservations
  WHERE booking_id = test_booking_id;

  IF spaces_count <> active_spaces_count THEN
    RAISE EXCEPTION 'Whole centre flag should reserve all % active spaces, but only % were reserved',
      active_spaces_count, spaces_count;
  END IF;

  RAISE NOTICE 'Whole centre flag test PASSED (booking_id: %, reserved % spaces)',
    test_booking_id, spaces_count;
END $$;

-- 5. Test RPC with byo_linen in accommodation
DO $$
DECLARE
  test_booking_id uuid;
  test_byo_linen boolean;
BEGIN
  test_booking_id := upsert_booking_snapshot('{
    "v": 3,
    "bookingId": "TEST_BYO_LINEN_001",
    "formResponseId": "form_byo_001",
    "email": "test.byo@example.com",
    "org": "Test BYO Linen Org",
    "contactName": "Test Contact",
    "contactPhone": "0400333333",
    "eventType": "Retreat",
    "headcount": 25,
    "minors": false,
    "whole_centre": false,
    "range": {
      "start": "2025-08-10",
      "end": "2025-08-12"
    },
    "overnight": true,
    "spaces": ["Chapel"],
    "accommodation": {
      "singleBB": 5,
      "doubleBB": 8,
      "doubleEnsuite": 2,
      "studySuite": 0,
      "byo_linen": true
    },
    "catering": {
      "required": false,
      "meals": []
    },
    "notes": "Test booking with BYO linen"
  }'::jsonb);

  SELECT (accommodation_requests->>'byo_linen')::boolean INTO test_byo_linen
  FROM bookings
  WHERE id = test_booking_id;

  IF NOT test_byo_linen THEN
    RAISE EXCEPTION 'BYO linen flag not stored correctly in accommodation_requests';
  END IF;

  RAISE NOTICE 'BYO linen flag test PASSED (booking_id: %)', test_booking_id;
END $$;

-- 6. Test that 'Whole Centre Day Hire' in spaces array is filtered out
DO $$
DECLARE
  test_booking_id uuid;
  has_whole_centre_space boolean;
BEGIN
  test_booking_id := upsert_booking_snapshot('{
    "v": 3,
    "bookingId": "TEST_FILTER_001",
    "formResponseId": "form_filter_001",
    "email": "test.filter@example.com",
    "org": "Test Filter Org",
    "contactName": "Test Contact",
    "contactPhone": "0400444444",
    "eventType": "Meeting",
    "headcount": 15,
    "minors": false,
    "whole_centre": false,
    "range": {
      "start": "2025-09-01",
      "end": "2025-09-01"
    },
    "overnight": false,
    "spaces": ["Chapel", "Whole Centre Day Hire", "Corbett"],
    "accommodation": {},
    "catering": {
      "required": false,
      "meals": []
    },
    "notes": "Test that deprecated Whole Centre Day Hire space is filtered"
  }'::jsonb);

  SELECT EXISTS (
    SELECT 1
    FROM space_reservations
    WHERE booking_id = test_booking_id
      AND space_id = 'Whole Centre Day Hire'
  ) INTO has_whole_centre_space;

  IF has_whole_centre_space THEN
    RAISE EXCEPTION 'Deprecated Whole Centre Day Hire space should not be reserved';
  END IF;

  RAISE NOTICE 'Space filtering test PASSED (booking_id: %)', test_booking_id;
END $$;

-- 7. Clean up test data and show summary
DO $$
BEGIN
  DELETE FROM bookings
  WHERE external_id IN (
    'TEST_MINORS_001',
    'TEST_WHOLE_CENTRE_001',
    'TEST_BYO_LINEN_001',
    'TEST_FILTER_001'
  );

  RAISE NOTICE 'Test data cleaned up successfully';
  RAISE NOTICE '✓ All migration tests passed! New fields are working correctly';
END $$;
