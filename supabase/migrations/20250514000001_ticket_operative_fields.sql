-- Campos operativos adicionales en tickets (modelo, ubicación usuario final, acción, partes).
CREATE TYPE public.ticket_parts_received AS ENUM ('recibida', 'pendiente', 'no_aplica');

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS equipment_model text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS end_user_location text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS action_taken text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS parts_received_status public.ticket_parts_received NOT NULL DEFAULT 'pendiente';

COMMENT ON COLUMN public.tickets.equipment_model IS 'Modelo del equipo';
COMMENT ON COLUMN public.tickets.end_user_location IS 'Ubicación / domicilio del usuario final';
COMMENT ON COLUMN public.tickets.action_taken IS 'Acción tomada en campo / resolución';
COMMENT ON COLUMN public.tickets.parts_received_status IS 'Estado de partes recibidas (ticket)';
