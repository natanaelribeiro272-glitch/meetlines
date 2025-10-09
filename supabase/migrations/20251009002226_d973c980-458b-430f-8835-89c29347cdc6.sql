-- Add foreign key to support_messages
ALTER TABLE public.support_messages
ADD CONSTRAINT support_messages_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;