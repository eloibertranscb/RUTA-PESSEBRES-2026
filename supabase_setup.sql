CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT,
  email TEXT,
  role TEXT DEFAULT 'USER',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password TEXT;

CREATE TABLE IF NOT EXISTS public.nativity_points (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  municipality TEXT NOT NULL DEFAULT 'Sant Feliu Sasserra',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  description TEXT DEFAULT '',
  submitted_by TEXT DEFAULT 'Anònim',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.visits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  nativity_point_id TEXT NOT NULL REFERENCES public.nativity_points(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_point_visit UNIQUE (user_id, nativity_point_id)
);

ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);

CREATE INDEX IF NOT EXISTS idx_points_status ON public.nativity_points(status);
CREATE INDEX IF NOT EXISTS idx_visits_user ON public.visits(user_id);
CREATE INDEX IF NOT EXISTS idx_visits_point ON public.visits(nativity_point_id);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nativity_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permetre lectura pública d'usuaris" ON public.users;
CREATE POLICY "Permetre lectura pública d'usuaris" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permetre registre d'usuaris" ON public.users;
CREATE POLICY "Permetre registre d'usuaris" ON public.users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permetre actualitzar dades d'usuari" ON public.users;
CREATE POLICY "Permetre actualitzar dades d'usuari" ON public.users FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permetre eliminar usuaris" ON public.users;
CREATE POLICY "Permetre eliminar usuaris" ON public.users FOR DELETE USING (true);

DROP POLICY IF EXISTS "Permetre lectura de pessebres" ON public.nativity_points;
CREATE POLICY "Permetre lectura de pessebres" ON public.nativity_points FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permetre proposar nous pessebres" ON public.nativity_points;
CREATE POLICY "Permetre proposar nous pessebres" ON public.nativity_points FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permetre actualitzar pessebres" ON public.nativity_points;
CREATE POLICY "Permetre actualitzar pessebres" ON public.nativity_points FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permetre eliminar pessebres" ON public.nativity_points;
CREATE POLICY "Permetre eliminar pessebres" ON public.nativity_points FOR DELETE USING (true);

DROP POLICY IF EXISTS "Permetre lectura de visites" ON public.visits;
CREATE POLICY "Permetre lectura de visites" ON public.visits FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permetre marcar visita" ON public.visits;
CREATE POLICY "Permetre marcar visita" ON public.visits FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permetre actualitzar visita" ON public.visits;
CREATE POLICY "Permetre actualitzar visita" ON public.visits FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Permetre desmarcar visita" ON public.visits;
CREATE POLICY "Permetre desmarcar visita" ON public.visits FOR DELETE USING (true);

INSERT INTO public.users (id, username, password, email, role) VALUES
  ('usr_admin', 'admin', 'adminpessebres3726c9b', 'admin@pessebres.cat', 'ADMIN')
ON CONFLICT (id) DO UPDATE SET password = 'adminpessebres3726c9b', role = 'ADMIN';
