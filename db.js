/**
 * Base de Dades per Ruta dels Pessebres 2026
 * Suporta emmagatzematge al núvol amb Supabase i sincronització en temps real.
 * Si no s'han configurat les claus de Supabase a config.js, funciona amb localStorage.
 */

const DB_KEYS = {
  USERS: 'pessebres_2026_users',
  POINTS: 'pessebres_2026_nativity_points',
  VISITS: 'pessebres_2026_visits',
  CURRENT_USER: 'pessebres_2026_current_user'
};

// Dades inicials per defecte (Seed Data per a mode offline / inicial)
const SEED_USERS = [
  { id: 'usr_admin', username: 'admin', email: 'admin@pessebres.cat', password: 'admin', role: 'ADMIN', created_at: '2026-01-01T10:00:00Z' },
  { id: 'usr_marc', username: 'Marc', email: 'marc@gmail.com', password: '123', role: 'USER', created_at: '2026-01-02T11:00:00Z' },
  { id: 'usr_anna', username: 'Anna', email: 'anna@gmail.com', password: '123', role: 'USER', created_at: '2026-01-02T12:00:00Z' },
  { id: 'usr_jordi', username: 'Jordi', email: 'jordi@gmail.com', password: '123', role: 'USER', created_at: '2026-01-03T09:30:00Z' },
  { id: 'usr_pau', username: 'Pau', email: 'pau@gmail.com', password: '123', role: 'USER', created_at: '2026-01-03T14:15:00Z' },
  { id: 'usr_laura', username: 'Laura', email: 'laura@gmail.com', password: '123', role: 'USER', created_at: '2026-01-04T08:00:00Z' },
  { id: 'usr_miquel', username: 'Miquel', email: 'miquel@gmail.com', password: '123', role: 'USER', created_at: '2026-01-04T16:20:00Z' }
];

const SEED_POINTS = [
  { id: 'pt_1', name: 'EL DEL SENGLAR', municipality: 'Sant Feliu Sasserra', latitude: 41.9560, longitude: 2.0080, description: 'Pessebre a la solana de la muntanya.', submitted_by: 'Marc', status: 'APPROVED', created_at: '2026-01-02T10:00:00Z' },
  { id: 'pt_2', name: 'LES GUILLERIES', municipality: 'Sant Feliu Sasserra', latitude: 41.9580, longitude: 2.0120, description: 'Ubicat al camí de les Guilleries.', submitted_by: 'Anna', status: 'APPROVED', created_at: '2026-01-02T12:30:00Z' },
  { id: 'pt_3', name: 'BALMA DE LES PASTORELLES', municipality: 'Sant Feliu Sasserra', latitude: 41.9565, longitude: 2.0200, description: 'Dins la bauma natural de les pastorelles.', submitted_by: 'Jordi', status: 'APPROVED', created_at: '2026-01-03T09:00:00Z' },
  { id: 'pt_4', name: 'BARRACA HORTA DE FONTARMONA', municipality: 'Sant Feliu Sasserra', latitude: 41.9500, longitude: 2.0170, description: 'Junt a la vinya i l\'horta antiga.', submitted_by: 'Pau', status: 'APPROVED', created_at: '2026-01-03T14:00:00Z' },
  { id: 'pt_5', name: 'SANTA MAGDALENA', municipality: 'Sant Feliu Sasserra', latitude: 41.9485, longitude: 2.0120, description: 'Pessebre rústic als peus del turó.', submitted_by: 'Laura', status: 'APPROVED', created_at: '2026-01-04T08:30:00Z' },
  { id: 'pt_6', name: 'ESGLÉSIA DE SANT FELIU SASSERRA', municipality: 'Sant Feliu Sasserra', latitude: 41.9455, longitude: 2.0210, description: 'Pessebre del nucli antic del poble.', submitted_by: 'Marc', status: 'APPROVED', created_at: '2026-01-04T10:00:00Z' },
  { id: 'pt_7', name: 'BAUMA DEL CÀNTIR', municipality: 'Sant Feliu Sasserra', latitude: 41.9460, longitude: 2.0175, description: 'Amagat a la bauma del càntir.', submitted_by: 'Miquel', status: 'APPROVED', created_at: '2026-01-04T15:00:00Z' },
  { id: 'pt_8', name: 'FONT FORRIOLA', municipality: 'Sant Feliu Sasserra', latitude: 41.9440, longitude: 2.0150, description: 'Als peus del rajaire de la font.', submitted_by: 'Anna', status: 'APPROVED', created_at: '2026-01-05T09:15:00Z' },
  { id: 'pt_9', name: 'ROURE CENTENÀRI', municipality: 'Sant Feliu Sasserra', latitude: 41.9420, longitude: 2.0130, description: 'Sota l\'ombra del roure centenari.', submitted_by: 'Jordi', status: 'APPROVED', created_at: '2026-01-05T11:45:00Z' },
  { id: 'pt_10', name: 'FONT DE LA CORDA', municipality: 'Sant Feliu Sasserra', latitude: 41.9405, longitude: 2.0195, description: 'Costat de la font de la corda.', submitted_by: 'Laura', status: 'APPROVED', created_at: '2026-01-05T14:20:00Z' },
  { id: 'pt_11', name: 'BAUMA SERRAT DEL MOLÍ DE BADIA', municipality: 'Sant Feliu Sasserra', latitude: 41.9390, longitude: 2.0240, description: 'Pessebre al molí de Badia.', submitted_by: 'Marc', status: 'APPROVED', created_at: '2026-01-05T15:00:00Z' },
  { id: 'pt_12', name: 'PUIGLLUSÀ', municipality: 'Sant Feliu Sasserra', latitude: 41.9520, longitude: 2.0250, description: 'Al cim de Puigllusà.', submitted_by: 'Pau', status: 'APPROVED', created_at: '2026-01-05T15:30:00Z' },
  { id: 'pt_13', name: 'BAUMA DE PAHONELLAS', municipality: 'Sant Feliu Sasserra', latitude: 41.9540, longitude: 2.0280, description: 'Pessebre tradicional en rocateres.', submitted_by: 'Miquel', status: 'APPROVED', created_at: '2026-01-05T16:00:00Z' },
  { id: 'pt_14', name: 'SERRAT LLOBATER', municipality: 'Sant Feliu Sasserra', latitude: 41.9490, longitude: 2.0300, description: 'Pessebre a la cresta del serrat.', submitted_by: 'Anna', status: 'APPROVED', created_at: '2026-01-05T16:30:00Z' },
  { id: 'pt_15', name: 'FONT PERDUDA', municipality: 'Sant Feliu Sasserra', latitude: 41.9430, longitude: 2.0310, description: 'Prop de la font perduda.', submitted_by: 'Jordi', status: 'APPROVED', created_at: '2026-01-05T17:00:00Z' },
  { id: 'pt_16', name: 'MOLÍ DE LA RIBA', municipality: 'Sant Feliu Sasserra', latitude: 41.9380, longitude: 2.0290, description: 'Al vell molí de la riba.', submitted_by: 'Laura', status: 'APPROVED', created_at: '2026-01-05T17:30:00Z' },
  { id: 'pt_17', name: 'XUP DE LES SALERES DELS ARNAUS', municipality: 'Sant Feliu Sasserra', latitude: 41.9350, longitude: 2.0220, description: 'Pessebre a la zona del xup.', submitted_by: 'Marc', status: 'APPROVED', created_at: '2026-01-05T18:00:00Z' },
  { id: 'pt_18', name: 'FARIGOLA', municipality: 'Sant Feliu Sasserra', latitude: 41.9340, longitude: 2.0180, description: 'Envoltat de farigola del bosc.', submitted_by: 'Pau', status: 'APPROVED', created_at: '2026-01-05T18:30:00Z' },
  { id: 'pt_19', name: 'L\'OLIVERA DE CAL PRIM / CAL BASTÓ', municipality: 'Sant Feliu Sasserra', latitude: 41.9320, longitude: 2.0140, description: 'Al peu de l\'olivera centenària.', submitted_by: 'Miquel', status: 'APPROVED', created_at: '2026-01-05T19:00:00Z' }
];

const SEED_VISITS = [
  { id: 'v1', user_id: 'usr_marc', nativity_point_id: 'pt_1', created_at: '2026-01-02T11:30:00Z' },
  { id: 'v2', user_id: 'usr_marc', nativity_point_id: 'pt_2', created_at: '2026-01-02T14:00:00Z' },
  { id: 'v3', user_id: 'usr_marc', nativity_point_id: 'pt_3', created_at: '2026-01-03T10:00:00Z' },
  { id: 'v4', user_id: 'usr_marc', nativity_point_id: 'pt_4', created_at: '2026-01-03T16:00:00Z' },
  { id: 'v5', user_id: 'usr_marc', nativity_point_id: 'pt_5', created_at: '2026-01-04T09:00:00Z' },
  { id: 'v6', user_id: 'usr_marc', nativity_point_id: 'pt_6', created_at: '2026-01-04T12:00:00Z' },
  { id: 'v7', user_id: 'usr_marc', nativity_point_id: 'pt_7', created_at: '2026-01-04T17:00:00Z' },
  { id: 'v8', user_id: 'usr_marc', nativity_point_id: 'pt_8', created_at: '2026-01-05T10:00:00Z' },
  { id: 'v9', user_id: 'usr_marc', nativity_point_id: 'pt_9', created_at: '2026-01-05T13:00:00Z' },
  { id: 'v10', user_id: 'usr_marc', nativity_point_id: 'pt_10', created_at: '2026-01-05T15:00:00Z' },
  { id: 'v11', user_id: 'usr_anna', nativity_point_id: 'pt_1', created_at: '2026-01-02T12:00:00Z' },
  { id: 'v12', user_id: 'usr_anna', nativity_point_id: 'pt_2', created_at: '2026-01-02T15:00:00Z' },
  { id: 'v13', user_id: 'usr_anna', nativity_point_id: 'pt_4', created_at: '2026-01-03T17:00:00Z' },
  { id: 'v14', user_id: 'usr_anna', nativity_point_id: 'pt_5', created_at: '2026-01-04T10:00:00Z' },
  { id: 'v15', user_id: 'usr_anna', nativity_point_id: 'pt_6', created_at: '2026-01-04T13:00:00Z' },
  { id: 'v16', user_id: 'usr_anna', nativity_point_id: 'pt_8', created_at: '2026-01-05T11:00:00Z' },
  { id: 'v17', user_id: 'usr_anna', nativity_point_id: 'pt_10', created_at: '2026-01-05T16:00:00Z' },
  { id: 'v18', user_id: 'usr_jordi', nativity_point_id: 'pt_1', created_at: '2026-01-03T11:00:00Z' },
  { id: 'v19', user_id: 'usr_jordi', nativity_point_id: 'pt_3', created_at: '2026-01-03T12:00:00Z' },
  { id: 'v20', user_id: 'usr_jordi', nativity_point_id: 'pt_5', created_at: '2026-01-04T11:00:00Z' },
  { id: 'v21', user_id: 'usr_jordi', nativity_point_id: 'pt_7', created_at: '2026-01-04T18:00:00Z' },
  { id: 'v22', user_id: 'usr_jordi', nativity_point_id: 'pt_9', created_at: '2026-01-05T14:00:00Z' },
  { id: 'v23', user_id: 'usr_pau', nativity_point_id: 'pt_2', created_at: '2026-01-03T15:00:00Z' },
  { id: 'v24', user_id: 'usr_pau', nativity_point_id: 'pt_4', created_at: '2026-01-03T18:00:00Z' },
  { id: 'v25', user_id: 'usr_pau', nativity_point_id: 'pt_5', created_at: '2026-01-04T12:00:00Z' }
];

class PessebresDB {
  constructor() {
    this.supabase = null;
    this.isCloudEnabled = false;
    this.init();
  }

  init() {
    // 1. Inicialització LocalStorage (sempre com a cau local d'alta velocitat)
    if (!localStorage.getItem(DB_KEYS.USERS)) {
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(SEED_USERS));
    }
    
    const currentPoints = localStorage.getItem(DB_KEYS.POINTS);
    if (!currentPoints || !currentPoints.includes('SENGLAR')) {
      localStorage.setItem(DB_KEYS.POINTS, JSON.stringify(SEED_POINTS));
      localStorage.setItem(DB_KEYS.VISITS, JSON.stringify(SEED_VISITS));
    }

    if (!localStorage.getItem(DB_KEYS.VISITS)) {
      localStorage.setItem(DB_KEYS.VISITS, JSON.stringify(SEED_VISITS));
    }

    // Default current user if none
    if (!localStorage.getItem(DB_KEYS.CURRENT_USER)) {
      const defaultUser = SEED_USERS.find(u => u.username === 'Marc');
      localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(defaultUser));
    }

    // 2. Comprovar si tenim configurat Supabase
    const cfg = window.SUPABASE_CONFIG;
    if (cfg && cfg.url && cfg.anonKey && cfg.url.startsWith('http') && window.supabase) {
      try {
        this.supabase = window.supabase.createClient(cfg.url, cfg.anonKey);
        this.isCloudEnabled = true;
        console.log("☁️ Connectat a Supabase Cloud!");
        this.syncFromCloud();
        this.subscribeRealtime();
      } catch (err) {
        console.warn("⚠️ No s'ha pogut connectar a Supabase. S'utilitza mode local:", err);
      }
    } else {
      console.log("📁 Executant en mode LocalStorage (Configura config.js per connectar a Supabase)");
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
        localStorage.setItem(DB_KEYS.POINTS, JSON.stringify(resPoints.data));
      }
      if (!resVisits.error && resVisits.data) {
        localStorage.setItem(DB_KEYS.VISITS, JSON.stringify(resVisits.data));
      }

      // Notifiquem a l'aplicació per refrescar mapa, rànquing i estadístiques
      window.dispatchEvent(new CustomEvent('db:changed'));
    } catch (e) {
      console.warn("Error en sincronitzar des de Supabase:", e);
    }
  }

  // Subscripció en temps real (WebSockets de Supabase)
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
      console.warn("No s'ha pogut activar realtime:", e);
    }
  }

  // --- RESTAURAR DADES DE PROVA ---
  resetToDefaults() {
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(SEED_USERS));
    localStorage.setItem(DB_KEYS.POINTS, JSON.stringify(SEED_POINTS));
    localStorage.setItem(DB_KEYS.VISITS, JSON.stringify(SEED_VISITS));
    localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(SEED_USERS[1]));
    window.dispatchEvent(new CustomEvent('db:changed'));
  }

  // --- USERS ---
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

  async registerUser(username, email, password) {
    const users = this.getUsers();
    const existing = users.find(u => u.username.toLowerCase() === username.toLowerCase() || (u.email && u.email.toLowerCase() === email.toLowerCase()));
    if (existing) {
      throw new Error('Ja existeix un usuari amb aquest nom o email.');
    }
    const newUser = {
      id: 'usr_' + Date.now(),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      role: 'USER',
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
    this.setCurrentUser(newUser);

    if (this.isCloudEnabled && this.supabase) {
      await this.supabase.from('users').insert([newUser]);
    }

    return newUser;
  }

  loginUser(emailOrUsername, password) {
    const users = this.getUsers();
    const term = emailOrUsername.trim().toLowerCase();
    const user = users.find(u => (u.email && u.email.toLowerCase() === term) || u.username.toLowerCase() === term);
    if (!user) {
      throw new Error('Usuari no trobat.');
    }
    this.setCurrentUser(user);
    return user;
  }

  logout() {
    localStorage.removeItem(DB_KEYS.CURRENT_USER);
    window.dispatchEvent(new CustomEvent('db:changed'));
  }

  // --- NATIVITY_POINTS ---
  getPoints() {
    return JSON.parse(localStorage.getItem(DB_KEYS.POINTS) || '[]');
  }

  getApprovedPoints() {
    return this.getPoints().filter(p => p.status === 'APPROVED');
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
      municipality: data.municipality.trim(),
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
        municipality: updatedData.municipality.trim(),
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
    }

    window.dispatchEvent(new CustomEvent('db:changed'));
  }

  // --- VISITS ---
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

  async toggleVisit(userId, pointId) {
    if (!userId) {
      throw new Error("Cal que hagis iniciat sessió per marcar un pessebre.");
    }
    const visits = this.getVisits();
    const existingIndex = visits.findIndex(v => v.user_id === userId && v.nativity_point_id === pointId);

    if (existingIndex !== -1) {
      const removedVisit = visits[existingIndex];
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
    const users = this.getUsers();
    const uniqueMunicipalities = new Set(approvedPoints.map(p => p.municipality.trim().toLowerCase()));

    return {
      approvedCount: approvedPoints.length,
      usersCount: users.length,
      municipalitiesCount: uniqueMunicipalities.size
    };
  }

  async loginOrRegisterQuickUser(fullName, email = '') {
    const name = fullName.trim();
    if (!name) throw new Error("Cal introduir un nom vàlid.");

    const users = this.getUsers();
    const existing = users.find(u => u.username.toLowerCase() === name.toLowerCase());

    if (existing) {
      this.setCurrentUser(existing);
      return existing;
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      username: name,
      email: email ? email.trim().toLowerCase() : (name.toLowerCase().replace(/\s+/g, '.') + '@gmail.com'),
      role: 'USER',
      created_at: new Date().toISOString()
    };
    users.push(newUser);
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
    this.setCurrentUser(newUser);

    if (this.isCloudEnabled && this.supabase) {
      await this.supabase.from('users').insert([newUser]);
    }

    window.dispatchEvent(new CustomEvent('db:changed'));
    return newUser;
  }

  // --- RÀNQUINGS ---
  getLeaderboard() {
    const users = this.getUsers();
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
    const users = this.getUsers();
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
