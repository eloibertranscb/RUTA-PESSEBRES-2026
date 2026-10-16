CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'USER',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_point_visit UNIQUE (user_id, nativity_point_id)
);

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

DROP POLICY IF EXISTS "Permetre desmarcar visita" ON public.visits;
CREATE POLICY "Permetre desmarcar visita" ON public.visits FOR DELETE USING (true);

INSERT INTO public.users (id, username, email, role) VALUES
  ('usr_admin', 'admin', 'admin@pessebres.cat', 'ADMIN'),
  ('usr_marc', 'Marc', 'marc@gmail.com', 'USER'),
  ('usr_anna', 'Anna', 'anna@gmail.com', 'USER'),
  ('usr_jordi', 'Jordi', 'jordi@gmail.com', 'USER'),
  ('usr_pau', 'Pau', 'pau@gmail.com', 'USER'),
  ('usr_laura', 'Laura', 'laura@gmail.com', 'USER'),
  ('usr_miquel', 'Miquel', 'miquel@gmail.com', 'USER')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.nativity_points (id, name, municipality, latitude, longitude, description, submitted_by, status) VALUES
  ('pt_1', 'EL DEL SENGLAR', 'Sant Feliu Sasserra', 41.9560, 2.0080, 'Pessebre a la solana de la muntanya.', 'Marc', 'APPROVED'),
  ('pt_2', 'LES GUILLERIES', 'Sant Feliu Sasserra', 41.9580, 2.0120, 'Ubicat al camí de les Guilleries.', 'Anna', 'APPROVED'),
  ('pt_3', 'BALMA DE LES PASTORELLES', 'Sant Feliu Sasserra', 41.9565, 2.0200, 'Dins la bauma natural de les pastorelles.', 'Jordi', 'APPROVED'),
  ('pt_4', 'BARRACA HORTA DE FONTARMONA', 'Sant Feliu Sasserra', 41.9500, 2.0170, 'Junt a la vinya i l''horta antiga.', 'Pau', 'APPROVED'),
  ('pt_5', 'SANTA MAGDALENA', 'Sant Feliu Sasserra', 41.9485, 2.0120, 'Pessebre rústic als peus del turó.', 'Laura', 'APPROVED'),
  ('pt_6', 'ESGLÉSIA DE SANT FELIU SASSERRA', 'Sant Feliu Sasserra', 41.9455, 2.0210, 'Pessebre del nucli antic del poble.', 'Marc', 'APPROVED'),
  ('pt_7', 'BAUMA DEL CÀNTIR', 'Sant Feliu Sasserra', 41.9460, 2.0175, 'Amagat a la bauma del càntir.', 'Miquel', 'APPROVED'),
  ('pt_8', 'FONT FORRIOLA', 'Sant Feliu Sasserra', 41.9440, 2.0150, 'Als peus del rajaire de la font.', 'Anna', 'APPROVED'),
  ('pt_9', 'ROURE CENTENÀRI', 'Sant Feliu Sasserra', 41.9420, 2.0130, 'Sota l''ombra del roure centenari.', 'Jordi', 'APPROVED'),
  ('pt_10', 'FONT DE LA CORDA', 'Sant Feliu Sasserra', 41.9405, 2.0195, 'Costat de la font de la corda.', 'Laura', 'APPROVED'),
  ('pt_11', 'BAUMA SERRAT DEL MOLÍ DE BADIA', 'Sant Feliu Sasserra', 41.9390, 2.0240, 'Pessebre al molí de Badia.', 'Marc', 'APPROVED'),
  ('pt_12', 'PUIGLLUSÀ', 'Sant Feliu Sasserra', 41.9520, 2.0250, 'Al cim de Puigllusà.', 'Pau', 'APPROVED'),
  ('pt_13', 'BAUMA DE PAHONELLAS', 'Sant Feliu Sasserra', 41.9540, 2.0280, 'Pessebre tradicional en rocateres.', 'Miquel', 'APPROVED'),
  ('pt_14', 'SERRAT LLOBATER', 'Sant Feliu Sasserra', 41.9490, 2.0300, 'Pessebre a la cresta del serrat.', 'Anna', 'APPROVED'),
  ('pt_15', 'FONT PERDUDA', 'Sant Feliu Sasserra', 41.9430, 2.0310, 'Prop de la font perduda.', 'Jordi', 'APPROVED'),
  ('pt_16', 'MOLÍ DE LA RIBA', 'Sant Feliu Sasserra', 41.9380, 2.0290, 'Al vell molí de la riba.', 'Laura', 'APPROVED'),
  ('pt_17', 'XUP DE LES SALERES DELS ARNAUS', 'Sant Feliu Sasserra', 41.9350, 2.0220, 'Pessebre a la zona del xup.', 'Marc', 'APPROVED'),
  ('pt_18', 'FARIGOLA', 'Sant Feliu Sasserra', 41.9340, 2.0180, 'Envoltat de farigola del bosc.', 'Pau', 'APPROVED'),
  ('pt_19', 'L''OLIVERA DE CAL PRIM / CAL BASTÓ', 'Sant Feliu Sasserra', 41.9320, 2.0140, 'Al peu de l''olivera centenària.', 'Miquel', 'APPROVED')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.visits (id, user_id, nativity_point_id) VALUES
  ('v1', 'usr_marc', 'pt_1'),
  ('v2', 'usr_marc', 'pt_2'),
  ('v3', 'usr_marc', 'pt_3'),
  ('v4', 'usr_marc', 'pt_4'),
  ('v5', 'usr_marc', 'pt_5'),
  ('v6', 'usr_marc', 'pt_6'),
  ('v7', 'usr_marc', 'pt_7'),
  ('v8', 'usr_marc', 'pt_8'),
  ('v9', 'usr_marc', 'pt_9'),
  ('v10', 'usr_marc', 'pt_10'),
  ('v11', 'usr_anna', 'pt_1'),
  ('v12', 'usr_anna', 'pt_2'),
  ('v13', 'usr_anna', 'pt_4'),
  ('v14', 'usr_anna', 'pt_5'),
  ('v15', 'usr_anna', 'pt_6'),
  ('v16', 'usr_anna', 'pt_8'),
  ('v17', 'usr_anna', 'pt_10'),
  ('v18', 'usr_jordi', 'pt_1'),
  ('v19', 'usr_jordi', 'pt_3'),
  ('v20', 'usr_jordi', 'pt_5'),
  ('v21', 'usr_jordi', 'pt_7'),
  ('v22', 'usr_jordi', 'pt_9'),
  ('v23', 'usr_pau', 'pt_2'),
  ('v24', 'usr_pau', 'pt_4'),
  ('v25', 'usr_pau', 'pt_5')
ON CONFLICT (id) DO NOTHING;
