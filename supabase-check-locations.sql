-- Check which users have location data
-- Run this in Supabase SQL Editor

-- See all users with location
SELECT 
  id,
  name,
  email,
  latitude,
  longitude,
  location
FROM profiles
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Count users with/without location
SELECT 
  COUNT(*) FILTER (WHERE latitude IS NOT NULL) as users_with_location,
  COUNT(*) FILTER (WHERE latitude IS NULL) as users_without_location,
  COUNT(*) as total_users
FROM profiles;

-- View all users and their location status
SELECT 
  name,
  email,
  location,
  CASE 
    WHEN latitude IS NOT NULL THEN '✅ Has GPS'
    ELSE '❌ No GPS'
  END as gps_status
FROM profiles
ORDER BY name;
