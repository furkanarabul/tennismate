-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Who receives the notification
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Who triggered it
  type TEXT NOT NULL, -- 'post_like', 'post_comment', 'comment_reply'
  resource_id UUID NOT NULL, -- ID of the post or comment
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to handle new post likes
CREATE OR REPLACE FUNCTION public.handle_new_post_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't notify if user likes their own post
  IF NEW.user_id = (SELECT user_id FROM public.posts WHERE id = NEW.post_id) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, sender_id, type, resource_id)
  VALUES (
    (SELECT user_id FROM public.posts WHERE id = NEW.post_id), -- Owner of the post
    NEW.user_id, -- Liker
    'post_like',
    NEW.post_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for post likes
DROP TRIGGER IF EXISTS on_post_like ON public.post_likes;
CREATE TRIGGER on_post_like
  AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_post_like();

-- Function to handle new post comments
CREATE OR REPLACE FUNCTION public.handle_new_post_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  parent_comment_owner_id UUID;
BEGIN
  SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.post_id;

  -- 1. Notify Post Owner (if it's a direct comment and not their own)
  IF NEW.parent_id IS NULL AND NEW.user_id != post_owner_id THEN
    INSERT INTO public.notifications (user_id, sender_id, type, resource_id)
    VALUES (post_owner_id, NEW.user_id, 'post_comment', NEW.post_id);
  END IF;

  -- 2. Notify Parent Comment Owner (if it's a reply)
  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id INTO parent_comment_owner_id FROM public.post_comments WHERE id = NEW.parent_id;
    
    -- Don't notify if replying to self
    IF NEW.user_id != parent_comment_owner_id THEN
       INSERT INTO public.notifications (user_id, sender_id, type, resource_id)
       VALUES (parent_comment_owner_id, NEW.user_id, 'comment_reply', NEW.post_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for post comments
DROP TRIGGER IF EXISTS on_post_comment ON public.post_comments;
CREATE TRIGGER on_post_comment
  AFTER INSERT ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_post_comment();
