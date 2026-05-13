-- Fix: "column reference enabled is ambiguous" en warranty_after_insert_notify
-- Ejecutá este archivo en el SQL Editor si ya aplicaste la migración inicial.

CREATE OR REPLACE FUNCTION public.warranty_after_insert_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  part_pending_enabled boolean;
  uid uuid;
BEGIN
  SELECT ns.enabled INTO part_pending_enabled
  FROM public.notification_settings AS ns
  WHERE ns.key = 'part_pending';
  IF NOT COALESCE(part_pending_enabled, true) THEN
    RETURN NEW;
  END IF;
  FOR uid IN
    SELECT p.id FROM public.profiles p WHERE p.role IN ('admin', 'coordinator')
  LOOP
    INSERT INTO public.notifications (user_id, ticket_id, type, message, read)
    VALUES (uid, NEW.ticket_id, 'part_pending', 'Caso de garantía requiere confirmación de repuesto', false);
  END LOOP;
  RETURN NEW;
END;
$$;
