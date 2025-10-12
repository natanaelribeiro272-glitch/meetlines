-- Add auto-generation support to platform_events
ALTER TABLE public.platform_events
ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS source_data JSONB;

-- Create index for faster queries on approval status
CREATE INDEX IF NOT EXISTS idx_platform_events_approval_status ON public.platform_events(approval_status);

-- Update RLS policies to allow viewing pending events
CREATE POLICY "Admins can view pending events"
ON public.platform_events
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR approval_status = 'approved'
);