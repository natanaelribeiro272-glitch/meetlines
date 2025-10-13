-- Add validated_at and validated_by columns to ticket_sales table
ALTER TABLE public.ticket_sales 
ADD COLUMN IF NOT EXISTS validated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS validated_by uuid REFERENCES auth.users(id);