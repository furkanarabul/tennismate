-- Chat System Database Setup
-- Run this in Supabase SQL Editor

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for fast queries
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view messages in their matches
CREATE POLICY "Users can view messages in their matches"
ON messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM matches
        WHERE (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
        AND messages.match_id = matches.id
    )
);

-- RLS Policy: Users can send messages to their matches
CREATE POLICY "Users can send messages to their matches"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
        SELECT 1 FROM matches
        WHERE (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
        AND messages.match_id = matches.id
    )
);

-- RLS Policy: Users can update read status of messages sent to them
CREATE POLICY "Users can mark messages as read"
ON messages FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM matches
        WHERE (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
        AND messages.match_id = matches.id
        AND messages.sender_id != auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM matches
        WHERE (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
        AND messages.match_id = matches.id
        AND messages.sender_id != auth.uid()
    )
);

-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
