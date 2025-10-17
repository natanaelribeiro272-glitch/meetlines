/*
  # Adicionar colunas de confirmação de presença
  
  1. Novas colunas:
    - attendance_confirmed: indica se o usuário confirmou presença física
    - attendance_confirmed_at: timestamp da confirmação de presença
  
  2. Índices:
    - Índice para melhorar performance de consultas por evento e presença confirmada
*/

ALTER TABLE public.event_registrations
ADD COLUMN IF NOT EXISTS attendance_confirmed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS attendance_confirmed_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_event_registrations_attendance 
ON public.event_registrations(event_id, attendance_confirmed) 
WHERE attendance_confirmed = true;

COMMENT ON COLUMN public.event_registrations.attendance_confirmed IS 'Indicates if the user confirmed their physical presence at the event';
COMMENT ON COLUMN public.event_registrations.attendance_confirmed_at IS 'Timestamp when the user confirmed their attendance';