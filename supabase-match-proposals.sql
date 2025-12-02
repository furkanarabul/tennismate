-- Create match_proposals table
CREATE TABLE IF NOT EXISTS match_proposals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    court_name TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE match_proposals ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view proposals for their matches"
    ON match_proposals FOR SELECT
    USING (
        auth.uid() = sender_id OR auth.uid() = receiver_id
    );

CREATE POLICY "Users can insert proposals for their matches"
    ON match_proposals FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
    );

CREATE POLICY "Users can update proposals for their matches"
    ON match_proposals FOR UPDATE
    USING (
        auth.uid() = sender_id OR auth.uid() = receiver_id
    );

-- Realtime
alter publication supabase_realtime add table match_proposals;
