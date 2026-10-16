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

// Pessebres inicials nets: a partir d'ara només els que s'afegeixin i s'aprovin
const SEED_POINTS = [];
const SEED_VISITS = [];

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
    // 1. Neteja de dades antigues de prova si cal
    if (localStorage.getItem('pessebres_clean_v3') !== 'true') {
      localStorage.setItem(DB_KEYS.POINTS, JSON.stringify([]));
      localStorage.setItem(DB_KEYS.VISITS, JSON.stringify([]));
      localStorage.removeItem(DB_KEYS.CURRENT_USER);
      localStorage.setItem('pessebres_clean_v3', 'true');
    }

    if (!localStorage.getItem(DB_KEYS.USERS)) {
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify([
        { id: 'usr_admin', username: 'admin', email: 'admin@pessebres.cat', role: 'ADMIN', created_at: new Date().toISOString() }
      ]));
    }
    if (!localStorage.getItem(DB_KEYS.POINTS)) {
      localStorage.setItem(DB_KEYS.POINTS, JSON.stringify([]));
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
      if (!resPoints.error && resPoints.data) {
        localStorage.setItem(DB_KEYS.POINTS, JSON.stringify(resPoints.data));
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

  // --- USERS & AUTH ---
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

  async loginUser(username, password) {
    const userTerm = username.trim();
    if (!userTerm) throw new Error("Introdueix un nom d'usuari.");
    if (!password) throw new Error("Introdueix la contrasenya.");

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
        return adminUser;
      } else {
        throw new Error("Contrasenya d'administrador incorrecta.");
      }
    }

    // 2. Usuari normal
    const users = this.getUsers();
    const existing = users.find(u => u.username.toLowerCase() === userTerm.toLowerCase());
    if (!existing) {
      throw new Error("No s'ha trobat cap compte amb aquest nom. Registra't si ets nou!");
    }

    if (existing.password && existing.password !== password) {
      throw new Error("Contrasenya incorrecta.");
    }

    this.setCurrentUser(existing);
    return existing;
  }

  async registerUser(username, password) {
    const userTerm = username.trim();
    if (!userTerm) throw new Error("Cal indicar un nom d'usuari.");
    if (!password || password.length < 3) throw new Error("La contrasenya ha de tenir com a mínim 3 caràcters.");

    if (userTerm.toLowerCase() === 'admin') {
      throw new Error("El nom 'admin' està reservat.");
    }

    const users = this.getUsers();
    const existing = users.find(u => u.username.toLowerCase() === userTerm.toLowerCase());
    if (existing) {
      throw new Error("Ja existeix un compte amb aquest nom. Inicia sessió.");
    }

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
          // Si a la BD no s'ha creat la columna password, inserim sense per no fallar
          const { password: _, ...userNoPass } = newUser;
          await this.supabase.from('users').insert([userNoPass]);
        }
      } catch (err) {
        console.warn("Error en guardar usuari a Supabase:", err);
      }
    }

    window.dispatchEvent(new CustomEvent('db:changed'));
    return newUser;
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
      status: 'PENDING', // Totes les propostes comencen en PENDING fins que l'admin les aprova
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
      await this.supabase.from('visits').delete().eq('nativity_point_id', id);
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
