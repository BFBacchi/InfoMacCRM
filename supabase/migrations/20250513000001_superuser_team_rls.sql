-- Superusuario único: gestión exclusiva de perfiles de equipo (coordinadores / técnicos).
-- Solo una fila con is_superuser = true.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_superuser boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_super_must_be_admin;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_super_must_be_admin CHECK (NOT is_superuser OR role = 'admin');

DROP INDEX IF EXISTS public.profiles_single_superuser_idx;

CREATE UNIQUE INDEX profiles_single_superuser_idx ON public.profiles (is_superuser)
  WHERE is_superuser = true;

CREATE OR REPLACE FUNCTION public.is_superuser()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_superuser = true
  );
$$;

-- Marcar el primer admin existente como superusuario (si ninguno lo es aún).
UPDATE public.profiles p
SET is_superuser = true
WHERE p.id = (
  SELECT q.id
  FROM public.profiles q
  WHERE q.role = 'admin' AND NOT EXISTS (SELECT 1 FROM public.profiles s WHERE s.is_superuser = true)
  ORDER BY q.created_at ASC NULLS LAST
  LIMIT 1
);

DROP POLICY IF EXISTS profiles_update_admin ON public.profiles;

CREATE POLICY profiles_update_super ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_superuser())
  WITH CHECK (public.is_superuser());

-- Alta de filas technician: solo superusuario (el resto del CRUD va por service role en servidor igualmente).
DROP POLICY IF EXISTS technicians_insert ON public.technicians;

CREATE POLICY technicians_insert ON public.technicians FOR INSERT TO authenticated
  WITH CHECK (public.is_superuser());

DROP POLICY IF EXISTS technicians_delete ON public.technicians;

CREATE POLICY technicians_delete ON public.technicians FOR DELETE TO authenticated
  USING (public.is_superuser());
