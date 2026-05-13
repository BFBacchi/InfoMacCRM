-- CRM INFOMAC: schema, RLS, triggers, storage, realtime
-- Requires: Supabase project with auth

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE public.user_role AS ENUM ('admin', 'coordinator', 'technician');
CREATE TYPE public.base_type AS ENUM ('cliente', 'infomac');
CREATE TYPE public.client_type AS ENUM ('dell', 'lenovo', 'other');
CREATE TYPE public.task_type AS ENUM (
  'masterizacion',
  'reemplazo',
  'diagnostico',
  'relevamiento',
  'otro'
);
CREATE TYPE public.priority_level AS ENUM ('standard', 'incidencia', 'critico');
CREATE TYPE public.ticket_status AS ENUM (
  'sin_asignar',
  'asignado',
  'en_curso',
  'cerrado_operativo',
  'cerrado_definitivo'
);
CREATE TYPE public.part_status AS ENUM ('pendiente', 'recibida', 'incorrecta', 'devuelta');
CREATE TYPE public.return_status AS ENUM ('pendiente', 'en_proceso', 'completada');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  role public.user_role NOT NULL DEFAULT 'technician',
  phone text,
  avatar_url text,
  base_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX profiles_role_idx ON public.profiles (role);
CREATE INDEX profiles_base_idx ON public.profiles (base_id);

-- Helpers de rol (después de crear `profiles`; si van antes, Postgres falla con "relation does not exist")
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_coordinator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'coordinator'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_coordinator_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin() OR public.is_coordinator();
$$;

-- Bases
CREATE TABLE public.bases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  province text NOT NULL,
  type public.base_type NOT NULL DEFAULT 'infomac',
  lat double precision,
  lng double precision,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_base_fk FOREIGN KEY (base_id) REFERENCES public.bases (id) ON DELETE SET NULL;

-- Clients
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type public.client_type NOT NULL DEFAULT 'other',
  sla_hours integer NOT NULL DEFAULT 48,
  contact_email text,
  contact_phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Technicians
CREATE TABLE public.technicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  base_id uuid REFERENCES public.bases (id) ON DELETE SET NULL,
  specialty text,
  availability boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT technicians_profile_unique UNIQUE (profile_id)
);

CREATE INDEX technicians_base_idx ON public.technicians (base_id);

-- Tickets
CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text NOT NULL UNIQUE,
  client_id uuid NOT NULL REFERENCES public.clients (id) ON DELETE RESTRICT,
  technician_id uuid REFERENCES public.technicians (id) ON DELETE SET NULL,
  coordinator_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  city text NOT NULL,
  province text NOT NULL,
  task_type public.task_type NOT NULL DEFAULT 'otro',
  description text NOT NULL DEFAULT '',
  priority public.priority_level NOT NULL DEFAULT 'standard',
  status public.ticket_status NOT NULL DEFAULT 'sin_asignar',
  sla_hours integer NOT NULL DEFAULT 48,
  received_at timestamptz,
  scheduled_at timestamptz,
  attended_at timestamptz,
  closed_at timestamptz,
  km_cliente numeric(10, 2),
  base_cliente_id uuid REFERENCES public.bases (id) ON DELETE SET NULL,
  km_infomac numeric(10, 2),
  base_infomac_id uuid REFERENCES public.bases (id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tickets_status_priority_idx ON public.tickets (status, priority);
CREATE INDEX tickets_technician_status_idx ON public.tickets (technician_id, status);
CREATE INDEX tickets_client_created_idx ON public.tickets (client_id, created_at);
CREATE INDEX tickets_province_idx ON public.tickets (province);

-- Warranty cases
CREATE TABLE public.warranty_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets (id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients (id) ON DELETE RESTRICT,
  technician_id uuid REFERENCES public.technicians (id) ON DELETE SET NULL,
  part_description text NOT NULL DEFAULT '',
  part_status public.part_status NOT NULL DEFAULT 'pendiente',
  part_received_at timestamptz,
  part_photo_url text,
  return_status public.return_status NOT NULL DEFAULT 'pendiente',
  return_date date,
  return_photo_url text,
  return_remito_url text,
  sla_complied boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX warranty_ticket_idx ON public.warranty_cases (ticket_id);
CREATE INDEX warranty_client_idx ON public.warranty_cases (client_id);

-- Ticket history
CREATE TABLE public.ticket_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.tickets (id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  action text NOT NULL,
  previous_value text,
  new_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ticket_history_ticket_idx ON public.ticket_history (ticket_id, created_at DESC);

-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  ticket_id uuid REFERENCES public.tickets (id) ON DELETE CASCADE,
  type text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_read_idx ON public.notifications (user_id, read, created_at DESC);

-- Attachments
CREATE TABLE public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES public.tickets (id) ON DELETE CASCADE,
  warranty_case_id uuid REFERENCES public.warranty_cases (id) ON DELETE CASCADE,
  url text NOT NULL,
  file_type text NOT NULL DEFAULT 'other',
  uploaded_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attachments_target_chk CHECK (
    (ticket_id IS NOT NULL)::int + (warranty_case_id IS NOT NULL)::int = 1
  )
);

CREATE INDEX attachments_ticket_idx ON public.attachments (ticket_id);

-- Notification settings (admin)
CREATE TABLE public.notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.notification_settings (key, enabled) VALUES
  ('sla_warning_80', true),
  ('assignment', true),
  ('part_pending', true),
  ('return_overdue', true),
  ('escalation', true)
ON CONFLICT (key) DO NOTHING;

-- Ticket number generator
CREATE SEQUENCE IF NOT EXISTS public.ticket_number_seq;

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  y text := to_char(now(), 'YYYY');
  n bigint;
BEGIN
  n := nextval('public.ticket_number_seq');
  RETURN 'TKT-' || y || '-' || lpad(n::text, 5, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.tickets_set_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := public.generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tickets_before_insert_number
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.tickets_set_number();

-- updated_at triggers
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER bases_updated_at BEFORE UPDATE ON public.bases FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER technicians_updated_at BEFORE UPDATE ON public.technicians FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER tickets_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER warranty_cases_updated_at BEFORE UPDATE ON public.warranty_cases FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auth: new user -> profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    'technician'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Ticket history + notifications (assignment)
CREATE OR REPLACE FUNCTION public.log_ticket_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tech_profile uuid;
  notify_enabled boolean;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.ticket_history (ticket_id, user_id, action, previous_value, new_value)
    VALUES (NEW.id, auth.uid(), 'status_changed', OLD.status::text, NEW.status::text);
  END IF;

  IF OLD.technician_id IS DISTINCT FROM NEW.technician_id THEN
    INSERT INTO public.ticket_history (ticket_id, user_id, action, previous_value, new_value)
    VALUES (
      NEW.id,
      auth.uid(),
      'assignment_changed',
      COALESCE(OLD.technician_id::text, ''),
      COALESCE(NEW.technician_id::text, '')
    );

    SELECT enabled INTO notify_enabled FROM public.notification_settings WHERE key = 'assignment';
    IF COALESCE(notify_enabled, true) AND NEW.technician_id IS NOT NULL THEN
      SELECT t.profile_id INTO tech_profile FROM public.technicians t WHERE t.id = NEW.technician_id;
      IF tech_profile IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, ticket_id, type, message, read)
        VALUES (
          tech_profile,
          NEW.id,
          'assignment',
          'Se te asignó el ticket ' || NEW.ticket_number,
          false
        );
      END IF;
    END IF;
  END IF;

  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO public.ticket_history (ticket_id, user_id, action, previous_value, new_value)
    VALUES (NEW.id, auth.uid(), 'priority_changed', OLD.priority::text, NEW.priority::text);
  END IF;

  IF OLD.description IS DISTINCT FROM NEW.description OR OLD.notes IS DISTINCT FROM NEW.notes THEN
    INSERT INTO public.ticket_history (ticket_id, user_id, action, previous_value, new_value)
    VALUES (NEW.id, auth.uid(), 'fields_updated', 'mixed', 'updated');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER tickets_after_update_log
  AFTER UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.log_ticket_update();

-- Warranty: notify coordinator on part pending (insert warranty with pendiente part)
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

CREATE TRIGGER warranty_after_insert
  AFTER INSERT ON public.warranty_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.warranty_after_insert_notify();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY profiles_select ON public.profiles FOR SELECT USING (
  id = auth.uid() OR public.is_admin() OR public.is_coordinator()
);

CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_admin ON public.profiles FOR UPDATE USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Bases
CREATE POLICY bases_select ON public.bases FOR SELECT TO authenticated USING (true);

CREATE POLICY bases_write_admin_coord ON public.bases FOR ALL TO authenticated USING (public.is_coordinator_or_admin())
  WITH CHECK (public.is_coordinator_or_admin());

-- Clients
CREATE POLICY clients_select ON public.clients FOR SELECT TO authenticated USING (true);

CREATE POLICY clients_write_admin_coord ON public.clients FOR ALL TO authenticated USING (public.is_coordinator_or_admin())
  WITH CHECK (public.is_coordinator_or_admin());

-- Technicians
CREATE POLICY technicians_select ON public.technicians FOR SELECT TO authenticated USING (
  public.is_admin() OR public.is_coordinator() OR profile_id = auth.uid()
);

CREATE POLICY technicians_insert ON public.technicians FOR INSERT TO authenticated WITH CHECK (public.is_coordinator_or_admin());

CREATE POLICY technicians_update ON public.technicians FOR UPDATE TO authenticated USING (
  public.is_coordinator_or_admin() OR profile_id = auth.uid()
) WITH CHECK (
  public.is_coordinator_or_admin() OR profile_id = auth.uid()
);

CREATE POLICY technicians_delete ON public.technicians FOR DELETE TO authenticated USING (public.is_admin());

-- Tickets: technician sees assigned via technicians.profile_id
CREATE OR REPLACE FUNCTION public.user_can_access_ticket(t public.tickets)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_admin()
    OR public.is_coordinator()
    OR EXISTS (
      SELECT 1 FROM public.technicians tech
      WHERE tech.id = t.technician_id AND tech.profile_id = auth.uid()
    );
$$;

CREATE POLICY tickets_select ON public.tickets FOR SELECT TO authenticated USING (public.user_can_access_ticket(tickets));

CREATE POLICY tickets_insert ON public.tickets FOR INSERT TO authenticated WITH CHECK (public.is_coordinator_or_admin());

CREATE POLICY tickets_update ON public.tickets FOR UPDATE TO authenticated USING (public.user_can_access_ticket(tickets))
  WITH CHECK (public.user_can_access_ticket(tickets));

CREATE POLICY tickets_delete ON public.tickets FOR DELETE TO authenticated USING (public.is_admin());

-- Warranty
CREATE POLICY warranty_select ON public.warranty_cases FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.tickets tk WHERE tk.id = warranty_cases.ticket_id AND public.user_can_access_ticket(tk))
);

CREATE POLICY warranty_insert ON public.warranty_cases FOR INSERT TO authenticated WITH CHECK (
  public.is_coordinator_or_admin()
  AND EXISTS (SELECT 1 FROM public.tickets tk WHERE tk.id = ticket_id AND public.user_can_access_ticket(tk))
);

CREATE POLICY warranty_update ON public.warranty_cases FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.tickets tk WHERE tk.id = warranty_cases.ticket_id AND public.user_can_access_ticket(tk))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.tickets tk WHERE tk.id = warranty_cases.ticket_id AND public.user_can_access_ticket(tk))
);

CREATE POLICY warranty_delete ON public.warranty_cases FOR DELETE TO authenticated USING (public.is_admin());

-- Ticket history
CREATE POLICY ticket_history_select ON public.ticket_history FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.tickets tk WHERE tk.id = ticket_history.ticket_id AND public.user_can_access_ticket(tk))
);

-- Notifications: own rows only
CREATE POLICY notifications_select ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY notifications_update ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY notifications_insert_system ON public.notifications FOR INSERT TO authenticated WITH CHECK (false);

-- Inserts come from triggers as superuser bypassing RLS — triggers run as definer; actually trigger runs as owner (postgres) so RLS bypassed for INSERT from trigger. Good.

-- Attachments
CREATE POLICY attachments_select ON public.attachments FOR SELECT TO authenticated USING (
  (ticket_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.tickets tk WHERE tk.id = attachments.ticket_id AND public.user_can_access_ticket(tk)))
  OR (warranty_case_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.warranty_cases wc
    JOIN public.tickets tk ON tk.id = wc.ticket_id
    WHERE wc.id = attachments.warranty_case_id AND public.user_can_access_ticket(tk)
  ))
);

CREATE POLICY attachments_insert ON public.attachments FOR INSERT TO authenticated WITH CHECK (
  uploaded_by = auth.uid()
  AND (
    (ticket_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.tickets tk WHERE tk.id = ticket_id AND public.user_can_access_ticket(tk)))
    OR (warranty_case_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.warranty_cases wc
      JOIN public.tickets tk ON tk.id = wc.ticket_id
      WHERE wc.id = warranty_case_id AND public.user_can_access_ticket(tk)
    ))
  )
);

CREATE POLICY attachments_delete ON public.attachments FOR DELETE TO authenticated USING (
  uploaded_by = auth.uid() OR public.is_coordinator_or_admin()
);

-- Notification settings
CREATE POLICY notification_settings_select ON public.notification_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY notification_settings_write ON public.notification_settings FOR ALL TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('ticket-attachments', 'ticket-attachments', false),
  ('warranty-photos', 'warranty-photos', false),
  ('return-remitos', 'return-remitos', false),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY storage_avatars_authenticated ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'avatars' AND split_part(name, '/', 1) = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND split_part(name, '/', 1) = auth.uid()::text);

CREATE POLICY storage_ticket_attachments ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'ticket-attachments')
  WITH CHECK (bucket_id = 'ticket-attachments');

CREATE POLICY storage_warranty_photos ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'warranty-photos')
  WITH CHECK (bucket_id = 'warranty-photos');

CREATE POLICY storage_return_remitos ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'return-remitos')
  WITH CHECK (bucket_id = 'return-remitos');
