-- Clear all swipes and matches (for testing)
-- Run this in Supabase SQL Editor

-- Delete all matches
DELETE FROM matches;

-- Delete all swipes
DELETE FROM swipes;

-- Optional: Delete all messages (if you want a fresh start)
DELETE FROM messages;

-- Verify deletion
SELECT COUNT(*) as swipes_count FROM swipes;
SELECT COUNT(*) as matches_count FROM matches;
SELECT COUNT(*) as messages_count FROM messages;
