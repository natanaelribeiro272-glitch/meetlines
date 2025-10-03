-- Sync existing profiles to organizers table manually
UPDATE public.organizers o
SET 
  avatar_url = p.avatar_url,
  page_title = COALESCE(p.display_name, o.page_title),
  updated_at = now()
FROM public.profiles p
WHERE o.user_id = p.user_id;