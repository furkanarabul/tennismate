-- Add comment_id to notifications
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE;

-- Update function to handle new post comments with comment_id
CREATE OR REPLACE FUNCTION public.handle_new_post_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
  parent_comment_owner_id UUID;
BEGIN
  SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.post_id;

  -- 1. Notify Post Owner (if it's a direct comment and not their own)
  IF NEW.parent_id IS NULL AND NEW.user_id != post_owner_id THEN
    INSERT INTO public.notifications (user_id, sender_id, type, resource_id, comment_id)
    VALUES (post_owner_id, NEW.user_id, 'post_comment', NEW.post_id, NEW.id);
  END IF;

  -- 2. Notify Parent Comment Owner (if it's a reply)
  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id INTO parent_comment_owner_id FROM public.post_comments WHERE id = NEW.parent_id;
    
    -- Don't notify if replying to self
    IF NEW.user_id != parent_comment_owner_id THEN
       INSERT INTO public.notifications (user_id, sender_id, type, resource_id, comment_id)
       VALUES (parent_comment_owner_id, NEW.user_id, 'comment_reply', NEW.post_id, NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
