-- Location-Based Filtering Migration
-- Adds latitude and longitude columns to profiles table

-- Add location columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add index for better performance on location queries
CREATE INDEX IF NOT EXISTS idx_profiles_location 
ON profiles(latitude, longitude);

-- Add comment for documentation
COMMENT ON COLUMN profiles.latitude IS 'User latitude for distance calculation';
COMMENT ON COLUMN profiles.longitude IS 'User longitude for distance calculation';
