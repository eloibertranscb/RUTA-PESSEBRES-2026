/**
 * Controladora Principal de l'Aplicació - RUTA DELS PESSEBRES 2026
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. INICIALITZACIÓ DEL MAPA LEAFLET
  let map;
  let markersGroup;
  let isSelectingMapLocation = false;
  let tempLocationMarker = null;

  // 1. Icones segons si l'usuari hi ha anat o no
  // NO HI HA ANAT: Vermell fort (#b81414) amb estrella blanca
  const notVisitedMarkerIcon = L.divIcon({
    className: 'custom-poster-marker-notvisited',
    html: `
      <div style="
        background: #b81414;
        border: 2.5px solid #ffffff;
        color: white;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(184, 20, 20, 0.4);
        cursor: pointer;
        font-size: 11px;
      ">
        <i class="fa-solid fa-asterisk"></i>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });

  // HI HA ANAT: Verd fosc (#0d4726) amb vora daurada i check
  const visitedMarkerIcon = L.divIcon({
    className: 'custom-poster-marker-visited',
    html: `
      <div style="
        background: #0d4726;
        border: 2.5px solid #e5b869;
        color: #e5b869;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(13, 71, 38, 0.5);
        cursor: pointer;
        font-size: 13px;
        font-weight: 900;
      ">
        ✓
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });

  const markerMap = {};

  function initMap() {
    // Inicialitzem el mapa
    map = L.map('map', {
      center: [41.9461, 2.0211],
      zoom: 14.5,
      zoomControl: true
    });

    // Capa de mapa gratuïta d'Esri World Street Map
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Mapes &copy; <a href="https://www.esri.com/">Esri</a> | Ruta dels Pessebres 2026',
      maxZoom: 18
    }).addTo(map);

    markersGroup = L.layerGroup().addTo(map);

    // Event de clic al mapa
    map.on('click', (e) => {
      if (isSelectingMapLocation) {
        const { lat, lng } = e.latlng;
        
        document.getElementById('add-lat').value = lat.toFixed(5);
        document.getElementById('add-lng').value = lng.toFixed(5);
        document.getElementById('add-coords-display').value = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

        if (tempLocationMarker) {
          map.removeLayer(tempLocationMarker);
        }

        tempLocationMarker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'temp-marker',
            html: `<div style="background:#b81414; border:2px solid white; width:24px; height:24px; border-radius:50%; box-shadow:0 0 10px red;"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        }).addTo(map);

        disableMapLocationSelection();
        showModal('modal-add-pessebre');
        showToast('📍 Ubicació seleccionada correctament!');
      }
    });

    renderApprovedMarkers();
  }

  // 2. RENDERITZAR MARCADORS (VERMELL FORT SI NO HI HA ANAT, VERD FOSC SI HI HA ANAT)
  function renderApprovedMarkers() {
    markersGroup.clearLayers();
    const approvedPoints = window.db.getApprovedPoints();
    const currentUser = window.db.getCurrentUser();
    const bounds = [];

    const indexUl = document.getElementById('index-panel-ul');
    if (indexUl) indexUl.innerHTML = '';

    approvedPoints.forEach(point => {
      const visitCount = window.db.getVisitCountForPoint(point.id);
      const isVisited = currentUser ? window.db.hasUserVisited(currentUser.id, point.id) : false;

      // Si no hi ha anat -> Vermell fort. Si hi ha anat -> Verd fosc!
      const iconToUse = isVisited ? visitedMarkerIcon : notVisitedMarkerIcon;

      const marker = L.marker([point.latitude, point.longitude], { icon: iconToUse });
      bounds.push([point.latitude, point.longitude]);
      markerMap[point.id] = marker;

      const popupContent = `
        <div class="pessebre-popup">
          <div class="pessebre-popup-header">
            <h3 class="pessebre-popup-title">${escapeHTML(point.name)}</h3>
            <div class="pessebre-popup-muni">📍 ${escapeHTML(point.municipality)}</div>
          </div>
          ${point.description ? `<p class="pessebre-popup-desc">"${escapeHTML(point.description)}"</p>` : ''}
          <div class="pessebre-popup-author">
            👤 Afegit per <strong>@${escapeHTML(point.submitted_by)}</strong>
          </div>
          <div class="pessebre-popup-stats">
            👥 <span><strong>${visitCount}</strong> persones hi han anat</span>
          </div>
          
          <div style="display:flex; flex-direction:column; gap:6px;">
            ${isVisited ? `
              <button class="btn-visit btn-visit-visited" onclick="handleVisitClick('${point.id}')">
                ✓ HI HAS ANAT
              </button>
              <button class="btn-visit" style="background:#fee2e2; color:#991b1b; border:1px solid #f87171;" onclick="handleVisitClick('${point.id}')">
                ✕ NO HI HE ANAT (Desmarcar)
              </button>
            ` : `
              <button class="btn-visit btn-visit-not-visited" onclick="handleVisitClick('${point.id}')">
                🎄 HI HE ANAT
              </button>
            `}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersGroup.addLayer(marker);

      if (indexUl) {
        const li = document.createElement('li');
        li.className = 'index-item';
        const bulletColor = isVisited ? '#0d4726' : '#b81414';
        li.innerHTML = `<span class="index-item-bullet" style="background:${bulletColor};"></span> ${escapeHTML(point.name)}`;
        li.addEventListener('click', () => {
          map.flyTo([point.latitude, point.longitude], 16, { duration: 1 });
          marker.openPopup();
        });
        indexUl.appendChild(li);
      }
    });

    if (approvedPoints.length === 0 && indexUl) {
      indexUl.innerHTML = '<li class="index-panel-empty">Cap pessebre aprovat encara</li>';
    }

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }

    updateTopStats();
  }

  // 3. ACCIÓ "HI HE ANAT" I "NO HI HE ANAT" (POLSADOR TOGGLE)
  window.handleVisitClick = function(pointId) {
    const currentUser = window.db.getCurrentUser();
    
    if (!currentUser) {
      showToast('⚠️ Has d\'iniciar sessió per marcar un pessebre!');
      showModal('modal-profile');
      return;
    }

    try {
      const result = window.db.toggleVisit(currentUser.id, pointId);
      renderApprovedMarkers();
      updateTopStats();
      renderRankingTable();
      renderUserProfile();
      
      if (result.visited) {
        showToast('🎉 Has marcat aquest pessebre com a visitat! (Marcador verd fosc)');
      } else {
        showToast('❌ Has desmarcat aquest pessebre (No hi he anat - Marcador vermell fort)');
      }
    } catch (err) {
      showToast('⚠️ ' + err.message);
    }
  };

  // 4. ACTUALITZACIÓ D'ESTADÍSTIQUES SUPERIORS
  function updateTopStats() {
    const stats = window.db.getStats();
    document.getElementById('stat-points').textContent = stats.approvedCount;
    document.getElementById('stat-users').textContent = stats.usersCount;

    // Actualitzem insígnia d'admin amb pendents
    const pendingCount = window.db.getPendingPoints().length;
    const badge = document.getElementById('admin-pending-badge');
    if (pendingCount > 0) {
      badge.textContent = pendingCount;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }

  // 5. GESTIÓ DE MODALS
  function showModal(modalId) {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    const target = document.getElementById(modalId);
    if (target) {
      target.classList.add('active');
    }
  }

  function hideAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  }

  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', hideAllModals);
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) hideAllModals();
    });
  });

  // 6. SELECCIÓ DE COORDENADES AL MAPA
  const btnSelectMapLoc = document.getElementById('btn-select-map-location');
  const btnCancelMapSelect = document.getElementById('btn-cancel-map-select');
  const mapSelectionBanner = document.getElementById('map-selection-banner');

  btnSelectMapLoc.addEventListener('click', () => {
    hideAllModals();
    enableMapLocationSelection();
  });

  btnCancelMapSelect.addEventListener('click', () => {
    disableMapLocationSelection();
    showModal('modal-add-pessebre');
  });

  function enableMapLocationSelection() {
    isSelectingMapLocation = true;
    mapSelectionBanner.style.display = 'flex';
    map.getContainer().style.cursor = 'crosshair';
  }

  function disableMapLocationSelection() {
    isSelectingMapLocation = false;
    mapSelectionBanner.style.display = 'none';
    map.getContainer().style.cursor = '';
  }

  // 7. ENVIAMENT DEL FORMULARI "AFEGEIX UN PESSEBRE"
  const formAddPessebre = document.getElementById('form-add-pessebre');
  const btnOpenAddPessebre = document.getElementById('btn-open-add-pessebre');

  btnOpenAddPessebre.addEventListener('click', () => {
    const currentUser = window.db.getCurrentUser();
    if (!currentUser) {
      showToast("⚠️ Cal que t'identifiquis o et registris per proposar un nou pessebre!");
      showModal('modal-profile');
      return;
    }
    const propInput = document.getElementById('add-proposer');
    propInput.value = currentUser.username;
    propInput.readOnly = true;
    showModal('modal-add-pessebre');
  });

  formAddPessebre.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('add-name').value;
    const municipality = document.getElementById('add-municipality').value;
    const lat = document.getElementById('add-lat').value;
    const lng = document.getElementById('add-lng').value;
    const description = document.getElementById('add-description').value;
    const proposer = document.getElementById('add-proposer').value;

    if (!lat || !lng) {
      showToast('⚠️ Cal que seleccionis la ubicació sobre el mapa.');
      return;
    }

    window.db.addPoint({
      name,
      municipality,
      latitude: lat,
      longitude: lng,
      description,
      submitted_by: proposer
    });

    formAddPessebre.reset();
    document.getElementById('add-coords-display').value = '';
    document.getElementById('add-lat').value = '';
    document.getElementById('add-lng').value = '';

    if (tempLocationMarker) {
      map.removeLayer(tempLocationMarker);
      tempLocationMarker = null;
    }

    hideAllModals();
    showToast('✨ Gràcies! El teu pessebre serà revisat abans d\'aparèixer al mapa.');
    updateTopStats();
    renderAdminPanel();
  });

  // 8. RÀNQUINGS DE PARTICIPANTS (VISITATS I CREATS)
  let currentRankingType = 'visited'; // 'visited' o 'created'
  const btnOpenRanking = document.getElementById('btn-open-ranking');
  const rankingTabVisited = document.getElementById('ranking-tab-visited');
  const rankingTabCreated = document.getElementById('ranking-tab-created');

  btnOpenRanking.addEventListener('click', () => {
    renderRankingTable();
    showModal('modal-ranking');
  });

  rankingTabVisited.addEventListener('click', () => {
    currentRankingType = 'visited';
    rankingTabVisited.classList.add('active');
    rankingTabCreated.classList.remove('active');
    document.getElementById('ranking-desc').textContent = 'Classificació ordenada per pessebres visitats.';
    document.getElementById('ranking-header-stat').textContent = 'Pessebres visitats';
    renderRankingTable();
  });

  rankingTabCreated.addEventListener('click', () => {
    currentRankingType = 'created';
    rankingTabCreated.classList.add('active');
    rankingTabVisited.classList.remove('active');
    document.getElementById('ranking-desc').textContent = 'Classificació ordenada per pessebres creats/proposats.';
    document.getElementById('ranking-header-stat').textContent = 'Pessebres creats';
    renderRankingTable();
  });

  function renderRankingTable() {
    const tbody = document.getElementById('ranking-tbody');
    const currentUser = window.db.getCurrentUser();
    let leaderboard = [];

    if (currentRankingType === 'visited') {
      leaderboard = window.db.getLeaderboard();
    } else {
      leaderboard = window.db.getCreatedLeaderboard();
    }

    tbody.innerHTML = '';

    leaderboard.forEach(item => {
      const tr = document.createElement('tr');
      if (currentUser && item.id === currentUser.id) {
        tr.classList.add('current-user-row');
      }

      let rankDisplay = `#${item.rank}`;
      if (item.rank === 1) rankDisplay = `<span class="rank-badge rank-1">🥇</span>`;
      else if (item.rank === 2) rankDisplay = `<span class="rank-badge rank-2">🥈</span>`;
      else if (item.rank === 3) rankDisplay = `<span class="rank-badge rank-3">🥉</span>`;

      const score = currentRankingType === 'visited' ? item.visitsCount : item.createdCount;

      tr.innerHTML = `
        <td style="width: 70px;">${rankDisplay}</td>
        <td><strong>${escapeHTML(item.username)}</strong> ${currentUser && item.id === currentUser.id ? '(Tu)' : ''}</td>
        <td style="font-weight: 800; color: var(--accent-red);">${score}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // 9. PERFIL DE L'USUARI I AUTHENTICATION (NOM I CONTRASENYA)
  const btnOpenProfile = document.getElementById('btn-open-profile');
  const headerUserLabel = document.getElementById('header-user-label');

  btnOpenProfile.addEventListener('click', () => {
    renderUserProfile();
    showModal('modal-profile');
  });

  function renderUserProfile() {
    const currentUser = window.db.getCurrentUser();
    const profileLoggedView = document.getElementById('profile-view-logged');
    const profileAuthView = document.getElementById('profile-view-auth');
    const btnOpenAdmin = document.getElementById('btn-open-admin');

    if (currentUser) {
      headerUserLabel.textContent = currentUser.username;
      profileLoggedView.style.display = 'block';
      profileAuthView.style.display = 'none';

      document.getElementById('profile-username').textContent = `@${currentUser.username}`;
      document.getElementById('profile-email').textContent = currentUser.email || '';

      // Mostrar botó Admin ÚNICAMENT a l'usuari admin autoritzat
      if (currentUser.role === 'ADMIN' || currentUser.username.toLowerCase() === 'admin') {
        btnOpenAdmin.style.display = 'flex';
        const pendingCount = window.db.getPendingPoints().length;
        const badge = document.getElementById('admin-pending-badge');
        if (badge) {
          badge.textContent = pendingCount;
          badge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
        }
      } else {
        btnOpenAdmin.style.display = 'none';
      }

      // Visites i rànquing
      const userVisits = window.db.getUserVisits(currentUser.id);
      const userRank = window.db.getUserRank(currentUser.id);

      document.getElementById('profile-rank-text').textContent = currentUser.role === 'ADMIN' ? '⭐ Administrador' : `Posició al rànquing: #${userRank || '-'}`;
      document.getElementById('profile-visited-count-text').textContent = `🎄 ${userVisits.length} pessebres visitats`;

      const ul = document.getElementById('profile-visited-ul');
      ul.innerHTML = '';

      if (userVisits.length === 0) {
        ul.innerHTML = `<li style="font-size:0.85rem; color:var(--text-muted); padding:8px 0;">Encara no has marcat cap pessebre com a visitat.</li>`;
      } else {
        userVisits.forEach(v => {
          const pt = window.db.getPointById(v.nativity_point_id);
          if (pt) {
            const li = document.createElement('li');
            li.className = 'visited-item';
            li.innerHTML = `
              <div>
                <strong>${escapeHTML(pt.name)}</strong>
                <div style="font-size:0.78rem; color:var(--text-muted);">${escapeHTML(pt.municipality)}</div>
              </div>
              <span style="font-size:0.8rem; color:var(--accent-green-bright); font-weight:700;">✓ Visitat</span>
            `;
            ul.appendChild(li);
          }
        });
      }
    } else {
      headerUserLabel.textContent = "Registra't / Entrar";
      btnOpenAdmin.style.display = 'none';
      profileLoggedView.style.display = 'none';
      profileAuthView.style.display = 'block';
    }
  }

  // PESTANYES LOGIN / REGISTRE
  const tabBtnLogin = document.getElementById('tab-btn-login');
  const tabBtnRegister = document.getElementById('tab-btn-register');
  const formLoginUser = document.getElementById('form-login-user');
  const formRegisterUser = document.getElementById('form-register-user');

  if (tabBtnLogin && tabBtnRegister) {
    tabBtnLogin.addEventListener('click', () => {
      tabBtnLogin.classList.add('active');
      tabBtnRegister.classList.remove('active');
      formLoginUser.style.display = 'block';
      formRegisterUser.style.display = 'none';
    });

    tabBtnRegister.addEventListener('click', () => {
      tabBtnRegister.classList.add('active');
      tabBtnLogin.classList.remove('active');
      formRegisterUser.style.display = 'block';
      formLoginUser.style.display = 'none';
    });
  }

  // SUBMIT INICI DE SESSIÓ (USUARIS I ADMIN)
  if (formLoginUser) {
    formLoginUser.addEventListener('submit', async (e) => {
      e.preventDefault();
      const u = document.getElementById('login-username').value;
      const p = document.getElementById('login-password').value;
      try {
        const user = await window.db.loginUser(u, p);
        if (user.role === 'ADMIN') {
          showToast(`⚙️ Benvingut/da, Administrador!`);
        } else {
          showToast(`👋 Benvingut/da de nou, ${user.username}!`);
        }
        hideAllModals();
        renderUserProfile();
        renderApprovedMarkers();
        renderRankingTable();
        updateTopStats();
      } catch (err) {
        showToast('⚠️ ' + err.message);
      }
    });
  }

  // SUBMIT REGISTRE DE NOU USUARI
  if (formRegisterUser) {
    formRegisterUser.addEventListener('submit', async (e) => {
      e.preventDefault();
      const u = document.getElementById('reg-username').value;
      const p = document.getElementById('reg-password').value;
      try {
        const user = await window.db.registerUser(u, p);
        showToast(`🎉 Compte creat! Benvingut/da a la Ruta dels Pessebres, ${user.username}!`);
        hideAllModals();
        renderUserProfile();
        renderApprovedMarkers();
        renderRankingTable();
        updateTopStats();
      } catch (err) {
        showToast('⚠️ ' + err.message);
      }
    });
  }

  // LOGOUT I CANVI D'USUARI
  document.getElementById('btn-logout').addEventListener('click', () => {
    window.db.logout();
    showToast('👋 Sessió tancada.');
    renderUserProfile();
    renderApprovedMarkers();
    renderRankingTable();
  });

  document.getElementById('btn-switch-user').addEventListener('click', () => {
    window.db.logout();
    renderUserProfile();
  });

  document.getElementById('btn-switch-user').addEventListener('click', () => {
    window.db.logout();
    renderUserProfile();
  });

  // 10. PANEL D'ADMINISTRACIÓ (ACCEPTAR / REBUTJAR / EDITAR / ELIMINAR)
  const btnOpenAdmin = document.getElementById('btn-open-admin');
  const adminTabPending = document.getElementById('admin-tab-pending');
  const adminTabApproved = document.getElementById('admin-tab-approved');
  const adminViewPending = document.getElementById('admin-view-pending');
  const adminViewApproved = document.getElementById('admin-view-approved');

  btnOpenAdmin.addEventListener('click', () => {
    renderAdminPanel();
    showModal('modal-admin');
  });

  adminTabPending.addEventListener('click', () => {
    adminTabPending.classList.add('active');
    adminTabApproved.classList.remove('active');
    adminViewPending.style.display = 'block';
    adminViewApproved.style.display = 'none';
  });

  adminTabApproved.addEventListener('click', () => {
    adminTabApproved.classList.add('active');
    adminTabPending.classList.remove('active');
    adminViewApproved.style.display = 'block';
    adminViewPending.style.display = 'none';
  });

  function renderAdminPanel() {
    const pendingPoints = window.db.getPendingPoints();
    const allPoints = window.db.getPoints();

    document.getElementById('count-pending').textContent = pendingPoints.length;
    document.getElementById('count-all').textContent = allPoints.length;

    // Render Pendents
    const pendingContainer = document.getElementById('admin-pending-container');
    pendingContainer.innerHTML = '';

    if (pendingPoints.length === 0) {
      pendingContainer.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem; padding:12px 0;">No hi ha propostes pendents d'aprovació.</p>`;
    } else {
      pendingPoints.forEach(pt => {
        const card = document.createElement('div');
        card.className = 'admin-proposal-card';
        card.innerHTML = `
          <div class="admin-proposal-title">🎄 ${escapeHTML(pt.name)}</div>
          <div class="admin-proposal-meta">
            📍 <strong>${escapeHTML(pt.municipality)}</strong> | 👤 Per @${escapeHTML(pt.submitted_by)} | 📅 ${new Date(pt.created_at).toLocaleDateString()}
          </div>
          ${pt.description ? `<p style="font-size:0.85rem; color:#444; margin-bottom:8px;">"${escapeHTML(pt.description)}"</p>` : ''}
          <div style="font-size:0.8rem; color:#666; margin-bottom:8px;">Coordenades: ${pt.latitude}, ${pt.longitude}</div>
          <div class="admin-actions">
            <button class="btn-approve" onclick="adminApprovePoint('${pt.id}')">✓ ACCEPTAR</button>
            <button class="btn-reject" onclick="adminRejectPoint('${pt.id}')">✕ REBUTJAR</button>
            <button class="btn-edit" onclick="adminOpenEditModal('${pt.id}')">✏️ EDITAR</button>
          </div>
        `;
        pendingContainer.appendChild(card);
      });
    }

    // Render Tots / Aprovats
    const approvedContainer = document.getElementById('admin-approved-container');
    approvedContainer.innerHTML = '';

    allPoints.forEach(pt => {
      const card = document.createElement('div');
      card.className = 'admin-proposal-card';
      let statusBadge = '';
      if (pt.status === 'APPROVED') statusBadge = `<span style="background:#2a9d8f; color:white; padding:2px 8px; border-radius:10px; font-size:0.75rem;">APPROVED</span>`;
      else if (pt.status === 'PENDING') statusBadge = `<span style="background:#e5b869; color:#0b251a; padding:2px 8px; border-radius:10px; font-size:0.75rem;">PENDING</span>`;
      else statusBadge = `<span style="background:#a31c1c; color:white; padding:2px 8px; border-radius:10px; font-size:0.75rem;">REJECTED</span>`;

      card.innerHTML = `
        <div style="display:flex; justify-space-between; align-items:center;">
          <div class="admin-proposal-title">🎄 ${escapeHTML(pt.name)}</div>
          <div>${statusBadge}</div>
        </div>
        <div class="admin-proposal-meta">
          📍 <strong>${escapeHTML(pt.municipality)}</strong> | 👤 @${escapeHTML(pt.submitted_by)}
        </div>
        <div class="admin-actions">
          <button class="btn-edit" onclick="adminOpenEditModal('${pt.id}')">✏️ EDITAR</button>
          <button class="btn-delete" onclick="adminDeletePoint('${pt.id}')">🗑️ ELIMINAR</button>
        </div>
      `;
      approvedContainer.appendChild(card);
    });
  }

  // ACCIONS ADMIN
  window.adminApprovePoint = function(id) {
    window.db.updatePointStatus(id, 'APPROVED');
    showToast('✅ Pessebre acceptat! Ara apareix al mapa públic.');
    renderApprovedMarkers();
    renderAdminPanel();
  };

  window.adminRejectPoint = function(id) {
    window.db.updatePointStatus(id, 'REJECTED');
    showToast('❌ Pessebre rebutjat.');
    renderApprovedMarkers();
    renderAdminPanel();
  };

  window.adminDeletePoint = function(id) {
    if (confirm('Estàs segur que vols eliminar aquest pessebre?')) {
      window.db.deletePoint(id);
      showToast('🗑️ Pessebre eliminat.');
      renderApprovedMarkers();
      renderAdminPanel();
      renderRankingTable();
    }
  };

  window.adminOpenEditModal = function(id) {
    const pt = window.db.getPointById(id);
    if (!pt) return;

    document.getElementById('edit-id').value = pt.id;
    document.getElementById('edit-name').value = pt.name;
    document.getElementById('edit-municipality').value = pt.municipality;
    document.getElementById('edit-lat').value = pt.latitude;
    document.getElementById('edit-lng').value = pt.longitude;
    document.getElementById('edit-description').value = pt.description || '';
    document.getElementById('edit-status').value = pt.status;

    showModal('modal-edit-pessebre');
  };

  const formEditPessebre = document.getElementById('form-edit-pessebre');
  formEditPessebre.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const name = document.getElementById('edit-name').value;
    const municipality = document.getElementById('edit-municipality').value;
    const lat = document.getElementById('edit-lat').value;
    const lng = document.getElementById('edit-lng').value;
    const description = document.getElementById('edit-description').value;
    const status = document.getElementById('edit-status').value;

    window.db.updatePoint(id, {
      name,
      municipality,
      latitude: lat,
      longitude: lng,
      description,
      status
    });

    hideAllModals();
    showToast('💾 Pessebre actualitzat correctament.');
    renderApprovedMarkers();
    renderAdminPanel();
  });

  // 11. TOAST NOTIFICACIONS
  function showToast(message) {
    const toast = document.getElementById('toast-notification');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }

  // 12. UTILITATS
  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  // Sincronització automàtica quan canvia la BD o arriba un canvi des de Supabase Cloud
  window.addEventListener('db:changed', () => {
    renderApprovedMarkers();
    updateTopStats();
    renderRankingTable();
    renderUserProfile();
    if (document.getElementById('modal-admin').classList.contains('active')) {
      renderAdminPanel();
    }
  });

  // ENGEGAR EL MAPA I LES VISTES
  initMap();
  renderUserProfile();
  renderRankingTable();
});
