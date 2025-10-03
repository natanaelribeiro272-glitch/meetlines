-- Primeiro, limpar dados órfãos (registros que referenciam user_ids que não existem mais)

-- Deletar comentários órfãos
DELETE FROM public.event_comments
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Deletar likes órfãos
DELETE FROM public.event_likes
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Deletar registrations órfãos
DELETE FROM public.event_registrations
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Deletar followers órfãos
DELETE FROM public.followers
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Deletar notifications órfãos
DELETE FROM public.notifications
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Deletar projects órfãos
DELETE FROM public.projects
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Deletar generations órfãos
DELETE FROM public.generations
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Agora adicionar constraints com ON DELETE CASCADE

-- Atualizar foreign key em profiles
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Atualizar foreign key em organizers
ALTER TABLE public.organizers
DROP CONSTRAINT IF EXISTS organizers_user_id_fkey;

ALTER TABLE public.organizers
ADD CONSTRAINT organizers_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Atualizar foreign key em notifications
ALTER TABLE public.notifications
DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

ALTER TABLE public.notifications
ADD CONSTRAINT notifications_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Atualizar foreign key em followers
ALTER TABLE public.followers
DROP CONSTRAINT IF EXISTS followers_user_id_fkey;

ALTER TABLE public.followers
ADD CONSTRAINT followers_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Atualizar foreign key em event_registrations
ALTER TABLE public.event_registrations
DROP CONSTRAINT IF EXISTS event_registrations_user_id_fkey;

ALTER TABLE public.event_registrations
ADD CONSTRAINT event_registrations_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Atualizar foreign key em event_likes
ALTER TABLE public.event_likes
DROP CONSTRAINT IF EXISTS event_likes_user_id_fkey;

ALTER TABLE public.event_likes
ADD CONSTRAINT event_likes_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Atualizar foreign key em event_comments
ALTER TABLE public.event_comments
DROP CONSTRAINT IF EXISTS event_comments_user_id_fkey;

ALTER TABLE public.event_comments
ADD CONSTRAINT event_comments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Atualizar foreign key em projects
ALTER TABLE public.projects
DROP CONSTRAINT IF EXISTS projects_user_id_fkey;

ALTER TABLE public.projects
ADD CONSTRAINT projects_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Atualizar foreign key em generations
ALTER TABLE public.generations
DROP CONSTRAINT IF EXISTS generations_user_id_fkey;

ALTER TABLE public.generations
ADD CONSTRAINT generations_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;