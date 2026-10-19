/**
 * Base de Dades per Ruta dels Pessebres 2026
 * Suporta emmagatzematge al núvol amb Supabase i sincronització en temps real.
 */

const DB_KEYS = {
  USERS: 'pessebres_2026_users',
  POINTS: 'pessebres_2026_nativity_points',
  VISITS: 'pessebres_2026_visits',
  CURRENT_USER: 'pessebres_2026_current_user'
};

// 19 Pessebres oficials de Sant Feliu Sasserra
// 19 Pessebres oficials de Sant Feliu Sasserra
const SEED_POINTS = [
  { id: 'pt_1', name: 'EL DEL SENGLAR', municipality: 'Sant Feliu Sasserra', latitude: 41.9560, longitude: 2.0080, description: 'Pessebre a la solana de la muntanya.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-02T10:00:00Z' },
  { id: 'pt_2', name: 'LES GUILLERIES', municipality: 'Sant Feliu Sasserra', latitude: 41.9580, longitude: 2.0120, description: 'Ubicat al camí de les Guilleries.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-02T12:30:00Z' },
  { id: 'pt_3', name: 'BALMA DE LES PASTORELLES', municipality: 'Sant Feliu Sasserra', latitude: 41.9565, longitude: 2.0200, description: 'Dins la bauma natural de les pastorelles.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-03T09:00:00Z' },
  { id: 'pt_4', name: 'BARRACA HORTA DE FONTARMONA', municipality: 'Sant Feliu Sasserra', latitude: 41.9500, longitude: 2.0170, description: 'Junt a la vinya i l\'horta antiga.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-03T14:00:00Z' },
  { id: 'pt_5', name: 'SANTA MAGDALENA', municipality: 'Sant Feliu Sasserra', latitude: 41.9485, longitude: 2.0120, description: 'Pessebre rústic als peus del turó.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-04T08:30:00Z' },
  { id: 'pt_6', name: 'ESGLÉSIA DE SANT FELIU SASSERRA', municipality: 'Sant Feliu Sasserra', latitude: 41.9455, longitude: 2.0210, description: 'Pessebre del nucli antic del poble.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-04T10:00:00Z' },
  { id: 'pt_7', name: 'BAUMA DEL CÀNTIR', municipality: 'Sant Feliu Sasserra', latitude: 41.9460, longitude: 2.0175, description: 'Amagat a la bauma del càntir.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-04T15:00:00Z' },
  { id: 'pt_8', name: 'FONT FORRIOLA', municipality: 'Sant Feliu Sasserra', latitude: 41.9440, longitude: 2.0150, description: 'Als peus del rajaire de la font.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-05T09:15:00Z' },
  { id: 'pt_9', name: 'ROURE CENTENÀRI', municipality: 'Sant Feliu Sasserra', latitude: 41.9420, longitude: 2.0130, description: 'Sota l\'ombra del roure centenari.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-05T11:45:00Z' },
  { id: 'pt_10', name: 'FONT DE LA CORDA', municipality: 'Sant Feliu Sasserra', latitude: 41.9405, longitude: 2.0195, description: 'Costat de la font de la corda.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-05T14:20:00Z' },
  { id: 'pt_11', name: 'BAUMA SERRAT DEL MOLÍ DE BADIA', municipality: 'Sant Feliu Sasserra', latitude: 41.9390, longitude: 2.0240, description: 'Pessebre al molí de Badia.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-05T15:00:00Z' },
  { id: 'pt_12', name: 'PUIGLLUSÀ', municipality: 'Sant Feliu Sasserra', latitude: 41.9520, longitude: 2.0250, description: 'Al cim de Puigllusà.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-05T15:30:00Z' },
  { id: 'pt_13', name: 'BAUMA DE PAHONELLAS', municipality: 'Sant Feliu Sasserra', latitude: 41.9540, longitude: 2.0280, description: 'Pessebre tradicional en rocateres.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-05T16:00:00Z' },
  { id: 'pt_14', name: 'SERRAT LLOBATER', municipality: 'Sant Feliu Sasserra', latitude: 41.9490, longitude: 2.0300, description: 'Pessebre a la cresta del serrat.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-05T16:30:00Z' },
  { id: 'pt_15', name: 'FONT PERDUDA', municipality: 'Sant Feliu Sasserra', latitude: 41.9430, longitude: 2.0310, description: 'Prop de la font perduda.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-05T17:00:00Z' },
  { id: 'pt_16', name: 'MOLÍ DE LA RIBA', municipality: 'Sant Feliu Sasserra', latitude: 41.9380, longitude: 2.0290, description: 'Al vell molí de la riba.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-05T17:30:00Z' },
  { id: 'pt_17', name: 'XUP DE LES SALERES DELS ARNAUS', municipality: 'Sant Feliu Sasserra', latitude: 41.9350, longitude: 2.0220, description: 'Pessebre a la zona del xup.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-05T18:00:00Z' },
  { id: 'pt_18', name: 'FARIGOLA', municipality: 'Sant Feliu Sasserra', latitude: 41.9340, longitude: 2.0180, description: 'Envoltat de farigola del bosc.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-05T18:30:00Z' },
  { id: 'pt_19', name: 'L\'OLIVERA DE CAL PRIM / CAL BASTÓ', municipality: 'Sant Feliu Sasserra', latitude: 41.9320, longitude: 2.0140, description: 'Al peu de l\'olivera centenària.', submitted_by: 'Organització', status: 'APPROVED', created_at: '2026-01-05T19:00:00Z' }
];

// Integració oficial de tots els pessebres de la prova (20 a 60) al normal
const NOM_TEMPLATES = [
  'FONT DEL ROURE',
  'CAL MASOVER DE LA SERRA ALTA',
  'BAUMA GRAN',
  'PLA DE LES ERES',
  'MOLÍ VELL DEL TORRENT DE LA COMA',
  'CAN PUJOL',
  'ERMITA DE SANT JOAN',
  'BARRACA DE PEDRA SECA DEL CAMÍ RAL'
];

for (let i = 20; i <= 60; i++) {
  const nomBase = NOM_TEMPLATES[(i - 20) % NOM_TEMPLATES.length];
  SEED_POINTS.push({
    id: `pt_${i}`,
    name: `${nomBase} ${i}`,
    municipality: 'Sant Feliu Sasserra',
    latitude: Number((41.932 + (((i - 1) * 37) % 100) / 100 * 0.026).toFixed(4)),
    longitude: Number((2.006 + (((i - 1) * 61) % 100) / 100 * 0.028).toFixed(4)),
    description: 'Pessebre tradicional integrat a la ruta de Sant Feliu Sasserra.',
    submitted_by: 'Organització',
    status: 'APPROVED',
    created_at: new Date(1736000000000 + i * 3600000).toISOString()
  });
}

const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'adminpessebres3726c9b'
};

class PessebresDB {
  constructor() {
    this.supabase = null;
    this.isCloudEnabled = false;
    this.init();
  }

  init() {
    // 1. Assegurar dades inicials a localStorage amb els 60 pessebres de la ruta
    const currentPoints = localStorage.getItem(DB_KEYS.POINTS);
    let pts = currentPoints ? JSON.parse(currentPoints) : [];
    if (pts.length < 60) {
      const existingIds = new Set(pts.map(p => p.id));
      SEED_POINTS.forEach(sp => {
        if (!existingIds.has(sp.id)) pts.push(sp);
      });
      localStorage.setItem(DB_KEYS.POINTS, JSON.stringify(pts));
    } else {
      const fakeAuthors = ['Marc', 'Anna', 'Jordi', 'Pau', 'Laura', 'Miquel'];
      pts = pts.map(p => ({
        ...p,
        submitted_by: fakeAuthors.includes(p.submitted_by) ? 'Organització' : (p.submitted_by || 'Organització')
      }));
      localStorage.setItem(DB_KEYS.POINTS, JSON.stringify(pts));
    }

    // Netejar usuaris inventats de localStorage i deixar participants a 0
    const storedUsers = localStorage.getItem(DB_KEYS.USERS);
    if (!storedUsers) {
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify([
        { id: 'usr_admin', username: 'admin', email: 'admin@pessebres.cat', role: 'ADMIN', created_at: new Date().toISOString() }
      ]));
    } else {
      const cleanUsers = JSON.parse(storedUsers).filter(u => u.username === 'admin');
      if (cleanUsers.length === 0) {
        cleanUsers.push({ id: 'usr_admin', username: 'admin', email: 'admin@pessebres.cat', role: 'ADMIN', created_at: new Date().toISOString() });
      }
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(cleanUsers));
    }

    if (!localStorage.getItem(DB_KEYS.VISITS)) {
      localStorage.setItem(DB_KEYS.VISITS, JSON.stringify([]));
    }

    // 2. Connectar a Supabase si s'ha configurat
    const cfg = window.SUPABASE_CONFIG;
    if (cfg && cfg.url && cfg.anonKey && cfg.url.startsWith('http') && window.supabase) {
      try {
        this.supabase = window.supabase.createClient(cfg.url, cfg.anonKey);
        this.isCloudEnabled = true;
        console.log("☁️ Connectat a Supabase Cloud!");
        this.syncFromCloud();
        this.subscribeRealtime();
      } catch (err) {
        console.warn("⚠️ Error en connectar a Supabase. S'utilitza mode local:", err);
      }
    }
  }

  // --- SINCRONITZACIÓ AMB SUPABASE ---
  async syncFromCloud() {
    if (!this.isCloudEnabled || !this.supabase) return;
    try {
      const [resUsers, resPoints, resVisits] = await Promise.all([
        this.supabase.from('users').select('*'),
        this.supabase.from('nativity_points').select('*'),
        this.supabase.from('visits').select('*')
      ]);

      if (!resUsers.error && resUsers.data) {
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(resUsers.data));
      }
      if (!resPoints.error && resPoints.data && resPoints.data.length > 0) {
        let cloudPoints = resPoints.data;
        if (cloudPoints.length < 60) {
          const cloudIds = new Set(cloudPoints.map(p => p.id));
          SEED_POINTS.forEach(sp => {
            if (!cloudIds.has(sp.id)) cloudPoints.push(sp);
          });
        }
        localStorage.setItem(DB_KEYS.POINTS, JSON.stringify(cloudPoints));
      }
      if (!resVisits.error && resVisits.data) {
        localStorage.setItem(DB_KEYS.VISITS, JSON.stringify(resVisits.data));
      }

      window.dispatchEvent(new CustomEvent('db:changed'));
    } catch (e) {
      console.warn("Error en sincronitzar des de Supabase:", e);
    }
  }

  subscribeRealtime() {
    if (!this.isCloudEnabled || !this.supabase) return;
    try {
      this.supabase.channel('public:realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'nativity_points' }, () => {
          this.syncFromCloud();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'visits' }, () => {
          this.syncFromCloud();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
          this.syncFromCloud();
        })
        .subscribe();
    } catch (e) {
      console.warn("Realtime no disponible:", e);
    }
  }

  // --- USERS & AUTH DIRECTE ---
  getUsers() {
    return JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
  }

  getCurrentUser() {
    const data = localStorage.getItem(DB_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  }

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(DB_KEYS.CURRENT_USER);
    }
    window.dispatchEvent(new CustomEvent('db:changed'));
  }

  async loginOrRegisterDirect(username, password) {
    const userTerm = username.trim();
    if (!userTerm) throw new Error("Cal escriure un nom.");
    if (!password) throw new Error("Cal escriure una contrasenya.");

    // 1. Verificació d'Administrador
    if (userTerm.toLowerCase() === ADMIN_CREDENTIALS.username) {
      if (password === ADMIN_CREDENTIALS.password) {
        const adminUser = {
          id: 'usr_admin',
          username: 'admin',
          email: 'admin@pessebres.cat',
          role: 'ADMIN',
          created_at: new Date().toISOString()
        };
        this.setCurrentUser(adminUser);
        return { user: adminUser, isNew: false, isAdmin: true };
      } else {
        throw new Error("Contrasenya d'administrador incorrecta.");
      }
    }

    // 2. Comprovar si ja existeix
    const users = this.getUsers();
    const existing = users.find(u => u.username.toLowerCase() === userTerm.toLowerCase());

    if (existing) {
      if (existing.password && existing.password !== password) {
        throw new Error("Contrasenya incorrecta per a aquest usuari.");
      }
      this.setCurrentUser(existing);
      return { user: existing, isNew: false, isAdmin: false };
    } else {
      // 3. Crear compte automàticament de forma transparent
      const newUser = {
        id: 'usr_' + Date.now(),
        username: userTerm,
        password: password,
        email: userTerm.toLowerCase().replace(/\s+/g, '.') + '@pessebres.cat',
        role: 'USER',
        created_at: new Date().toISOString()
      };

      users.push(newUser);
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
      this.setCurrentUser(newUser);

      if (this.isCloudEnabled && this.supabase) {
        try {
          const { error } = await this.supabase.from('users').insert([newUser]);
          if (error && error.message && error.message.includes('password')) {
            const { password: _, ...userNoPass } = newUser;
            await this.supabase.from('users').insert([userNoPass]);
          }
        } catch (err) {
          console.warn("Error en guardar usuari a Supabase:", err);
        }
      }

      window.dispatchEvent(new CustomEvent('db:changed'));
      return { user: newUser, isNew: true, isAdmin: false };
    }
  }

  logout() {
    localStorage.removeItem(DB_KEYS.CURRENT_USER);
    window.dispatchEvent(new CustomEvent('db:changed'));
  }

  async deleteUser(userId) {
    if (!userId || userId === 'usr_admin') return;
    let users = this.getUsers();
    users = users.filter(u => u.id !== userId);
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));

    let visits = this.getVisits();
    visits = visits.filter(v => v.user_id !== userId);
    localStorage.setItem(DB_KEYS.VISITS, JSON.stringify(visits));

    if (this.isCloudEnabled && this.supabase) {
      try {
        await this.supabase.from('visits').delete().eq('user_id', userId);
        await this.supabase.from('users').delete().eq('id', userId);
      } catch (err) {
        console.warn("Error eliminant usuari de Supabase:", err);
      }
    }

    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      localStorage.removeItem(DB_KEYS.CURRENT_USER);
    }

    window.dispatchEvent(new CustomEvent('db:changed'));
  }

  // --- NATIVITY_POINTS ---
  getPoints() {
    return JSON.parse(localStorage.getItem(DB_KEYS.POINTS) || '[]');
  }

  getApprovedPoints() {
    let pts = this.getPoints().filter(p => p.status === 'APPROVED');
    if (pts.length < 60) {
      const existingIds = new Set(pts.map(p => p.id));
      SEED_POINTS.forEach(sp => {
        if (!existingIds.has(sp.id)) pts.push(sp);
      });
    }
    pts.sort((a, b) => {
      const numA = parseInt(a.id.replace(/\D/g, ''), 10);
      const numB = parseInt(b.id.replace(/\D/g, ''), 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return (a.created_at || '').localeCompare(b.created_at || '');
    });

    // MODE PROVA RÀPIDA (Pestanya de prova amb 3 pessebres per provar el trofeu a l'instant)
    const urlParams = new URLSearchParams(window.location.search);
    const provaParam = parseInt(urlParams.get('prova') || urlParams.get('test'), 10);
    if (!isNaN(provaParam) && provaParam > 0 && provaParam < pts.length) {
      return pts.slice(0, provaParam);
    }
    if (window.location.pathname.toLowerCase().endsWith('prova.html')) {
      return pts.slice(0, 3);
    }

    return pts;
  }

  getPendingPoints() {
    return this.getPoints().filter(p => p.status === 'PENDING');
  }

  getPointById(id) {
    return this.getPoints().find(p => p.id === id);
  }

  async addPoint(data) {
    const points = this.getPoints();
    const newPoint = {
      id: 'pt_' + Date.now(),
      name: data.name.trim(),
      municipality: data.municipality ? data.municipality.trim() : 'Sant Feliu Sasserra',
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
      description: data.description ? data.description.trim() : '',
      submitted_by: data.submitted_by ? data.submitted_by.trim() : 'Anònim',
      status: 'PENDING',
      created_at: new Date().toISOString()
    };
    points.push(newPoint);
    localStorage.setItem(DB_KEYS.POINTS, JSON.stringify(points));

    if (this.isCloudEnabled && this.supabase) {
      await this.supabase.from('nativity_points').insert([newPoint]);
    }

    window.dispatchEvent(new CustomEvent('db:changed'));
    return newPoint;
  }

  async updatePointStatus(id, newStatus) {
    const points = this.getPoints();
    const index = points.findIndex(p => p.id === id);
    if (index !== -1) {
      points[index].status = newStatus;
      localStorage.setItem(DB_KEYS.POINTS, JSON.stringify(points));

      if (this.isCloudEnabled && this.supabase) {
        await this.supabase.from('nativity_points').update({ status: newStatus }).eq('id', id);
      }

      window.dispatchEvent(new CustomEvent('db:changed'));
      return points[index];
    }
    return null;
  }

  async updatePoint(id, updatedData) {
    const points = this.getPoints();
    const index = points.findIndex(p => p.id === id);
    if (index !== -1) {
      points[index] = {
        ...points[index],
        name: updatedData.name.trim(),
        municipality: updatedData.municipality ? updatedData.municipality.trim() : (points[index].municipality || 'Sant Feliu Sasserra'),
        latitude: parseFloat(updatedData.latitude),
        longitude: parseFloat(updatedData.longitude),
        description: updatedData.description ? updatedData.description.trim() : '',
        status: updatedData.status || points[index].status
      };
      localStorage.setItem(DB_KEYS.POINTS, JSON.stringify(points));

      if (this.isCloudEnabled && this.supabase) {
        await this.supabase.from('nativity_points').update({
          name: points[index].name,
          municipality: points[index].municipality,
          latitude: points[index].latitude,
          longitude: points[index].longitude,
          description: points[index].description,
          status: points[index].status
        }).eq('id', id);
      }

      window.dispatchEvent(new CustomEvent('db:changed'));
      return points[index];
    }
    return null;
  }

  async deletePoint(id) {
    let points = this.getPoints();
    points = points.filter(p => p.id !== id);
    localStorage.setItem(DB_KEYS.POINTS, JSON.stringify(points));

    let visits = this.getVisits();
    visits = visits.filter(v => v.nativity_point_id !== id);
    localStorage.setItem(DB_KEYS.VISITS, JSON.stringify(visits));

    if (this.isCloudEnabled && this.supabase) {
      await this.supabase.from('nativity_points').delete().eq('id', id);
      await this.supabase.from('visits').delete().eq('nativity_point_id', id);
    }

    window.dispatchEvent(new CustomEvent('db:changed'));
  }

  // --- VISITS & RATINGS (BOLES DE NADAL) ---
  getVisits() {
    return JSON.parse(localStorage.getItem(DB_KEYS.VISITS) || '[]');
  }

  getVisitsForPoint(pointId) {
    return this.getVisits().filter(v => v.nativity_point_id === pointId);
  }

  getVisitCountForPoint(pointId) {
    return this.getVisitsForPoint(pointId).length;
  }

  getUserVisits(userId) {
    return this.getVisits().filter(v => v.user_id === userId);
  }

  hasUserVisited(userId, pointId) {
    if (!userId) return false;
    return this.getVisits().some(v => v.user_id === userId && v.nativity_point_id === pointId);
  }

  getUserRatingForPoint(userId, pointId) {
    if (!userId) return 0;
    const visit = this.getVisits().find(v => v.user_id === userId && v.nativity_point_id === pointId);
    return visit && visit.rating ? Number(visit.rating) : 0;
  }

  getPointRatingStats(pointId) {
    const ratedVisits = this.getVisitsForPoint(pointId).filter(v => v.rating && Number(v.rating) >= 1 && Number(v.rating) <= 5);
    if (ratedVisits.length === 0) {
      return { average: 0, count: 0 };
    }
    const sum = ratedVisits.reduce((acc, v) => acc + Number(v.rating), 0);
    return {
      average: Number((sum / ratedVisits.length).toFixed(1)),
      count: ratedVisits.length
    };
  }

  async ratePoint(userId, pointId, ratingVal) {
    if (!userId) {
      throw new Error("Cal que hagis iniciat sessió per valorar un pessebre.");
    }
    const r = parseInt(ratingVal, 10);
    if (isNaN(r) || r < 1 || r > 5) {
      throw new Error("La valoració ha de ser d'1 a 5 boles de Nadal.");
    }

    const visits = this.getVisits();
    const existingIndex = visits.findIndex(v => v.user_id === userId && v.nativity_point_id === pointId);

    if (existingIndex !== -1) {
      visits[existingIndex].rating = r;
      localStorage.setItem(DB_KEYS.VISITS, JSON.stringify(visits));

      if (this.isCloudEnabled && this.supabase) {
        try {
          await this.supabase.from('visits').update({ rating: r }).eq('user_id', userId).eq('nativity_point_id', pointId);
        } catch (err) {
          console.warn("Error actualitzant valoració a Supabase:", err);
        }
      }
    } else {
      const newVisit = {
        id: 'v_' + Date.now(),
        user_id: userId,
        nativity_point_id: pointId,
        rating: r,
        created_at: new Date().toISOString()
      };
      visits.push(newVisit);
      localStorage.setItem(DB_KEYS.VISITS, JSON.stringify(visits));

      if (this.isCloudEnabled && this.supabase) {
        try {
          const { error } = await this.supabase.from('visits').insert([newVisit]);
          if (error && error.message && error.message.includes('rating')) {
            const { rating: _, ...visitNoRating } = newVisit;
            await this.supabase.from('visits').insert([visitNoRating]);
          }
        } catch (err) {
          console.warn("Error desant visita amb valoració a Supabase:", err);
        }
      }
    }

    window.dispatchEvent(new CustomEvent('db:changed'));
    return { rating: r, stats: this.getPointRatingStats(pointId) };
  }

  async toggleVisit(userId, pointId) {
    if (!userId) {
      throw new Error("Cal que hagis iniciat sessió per marcar un pessebre.");
    }
    const visits = this.getVisits();
    const existingIndex = visits.findIndex(v => v.user_id === userId && v.nativity_point_id === pointId);

    if (existingIndex !== -1) {
      visits.splice(existingIndex, 1);
      localStorage.setItem(DB_KEYS.VISITS, JSON.stringify(visits));

      if (this.isCloudEnabled && this.supabase) {
        await this.supabase.from('visits').delete().eq('user_id', userId).eq('nativity_point_id', pointId);
      }

      window.dispatchEvent(new CustomEvent('db:changed'));
      return { visited: false, visitCount: this.getVisitCountForPoint(pointId) };
    } else {
      const newVisit = {
        id: 'v_' + Date.now(),
        user_id: userId,
        nativity_point_id: pointId,
        created_at: new Date().toISOString()
      };
      visits.push(newVisit);
      localStorage.setItem(DB_KEYS.VISITS, JSON.stringify(visits));

      if (this.isCloudEnabled && this.supabase) {
        await this.supabase.from('visits').insert([newVisit]);
      }

      window.dispatchEvent(new CustomEvent('db:changed'));
      return { visited: true, visitCount: this.getVisitCountForPoint(pointId) };
    }
  }

  // --- ESTADÍSTIQUES ---
  getStats() {
    const approvedPoints = this.getApprovedPoints();
    const users = this.getUsers().filter(u => u.role !== 'ADMIN');

    return {
      approvedCount: approvedPoints.length,
      usersCount: users.length
    };
  }

  // --- RÀNQUINGS ---
  getLeaderboard() {
    const users = this.getUsers().filter(u => u.role !== 'ADMIN');
    const visits = this.getVisits();

    const userVisitCounts = {};
    users.forEach(u => {
      userVisitCounts[u.id] = 0;
    });

    visits.forEach(v => {
      if (userVisitCounts[v.user_id] !== undefined) {
        userVisitCounts[v.user_id] += 1;
      }
    });

    const leaderboard = users.map(u => ({
      id: u.id,
      username: u.username,
      visitsCount: userVisitCounts[u.id] || 0
    }));

    leaderboard.sort((a, b) => b.visitsCount - a.visitsCount);

    return leaderboard.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  }

  getCreatedLeaderboard() {
    const users = this.getUsers().filter(u => u.role !== 'ADMIN');
    const points = this.getApprovedPoints();

    const userCreatedCounts = {};
    users.forEach(u => {
      userCreatedCounts[u.id] = 0;
    });

    points.forEach(p => {
      const matchUser = users.find(u => u.username.toLowerCase() === (p.submitted_by || '').toLowerCase());
      if (matchUser) {
        userCreatedCounts[matchUser.id] += 1;
      }
    });

    const leaderboard = users.map(u => ({
      id: u.id,
      username: u.username,
      createdCount: userCreatedCounts[u.id] || 0
    }));

    leaderboard.sort((a, b) => b.createdCount - a.createdCount);

    return leaderboard.map((item, index) => ({
      ...item,
      rank: index + 1
    }));
  }

  getUserRank(userId) {
    const leaderboard = this.getLeaderboard();
    const userItem = leaderboard.find(item => item.id === userId);
    return userItem ? userItem.rank : null;
  }
}

// Instància global
window.db = new PessebresDB();
