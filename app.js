/**
 * Controladora Principal de l'Aplicació - RUTA DELS PESSEBRES 2026
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. INICIALITZACIÓ DEL MAPA LEAFLET
  let map;
  let markersGroup;
  let isSelectingMapLocation = false;
  let tempLocationMarker = null;

  // 1. Icones numerades segons el pessebre i si l'usuari hi ha anat o no
  function createNumberedMarkerIcon(number, isVisited) {
    if (isVisited) {
      // HI HA ANAT: Verd fosc (#0d4726) amb vora daurada i check + número
      return L.divIcon({
        className: 'custom-poster-marker-visited',
        html: `
          <div class="marker-pin-visited" title="Pessebre #${number} - Visitat">
            <span class="marker-check-icon">✓</span>
            <span>${number}</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      });
    } else {
      // NO HI HA ANAT: Vermell fort (#b81414) amb número clar i visible
      return L.divIcon({
        className: 'custom-poster-marker-notvisited',
        html: `
          <div class="marker-pin-notvisited" title="Pessebre #${number}">
            ${number}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      });
    }
  }

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
      maxZoom: 18,
      crossOrigin: true
    }).addTo(map);

    markersGroup = L.layerGroup().addTo(map);

    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 250);

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

  // 2. RENDERITZAR MARCADORS NUMERATS I GESTIÓ D'ACCÉS
  function renderApprovedMarkers() {
    markersGroup.clearLayers();
    const approvedPoints = window.db.getApprovedPoints();
    const currentUser = window.db.getCurrentUser();
    const bounds = [];

    const indexUl = document.getElementById('index-panel-ul');
    if (indexUl) indexUl.innerHTML = '';

    approvedPoints.forEach((point, idx) => {
      const number = idx + 1;
      const visitCount = window.db.getVisitCountForPoint(point.id);
      const isVisited = currentUser ? window.db.hasUserVisited(currentUser.id, point.id) : false;

      const markerIcon = createNumberedMarkerIcon(number, isVisited);
      const marker = L.marker([point.latitude, point.longitude], { icon: markerIcon });
      bounds.push([point.latitude, point.longitude]);
      markerMap[point.id] = marker;

      // SI NO ESTÀ REGISTRAT: NOU REQUISIT -> NOMÉS VEUEN EL PESSEBRE I EL NÚMERO, NO PODEN VALIDAR
      let actionButtonsHtml = '';
      if (!currentUser) {
        actionButtonsHtml = `
          <div class="pessebre-popup-lock-msg">
            <span>🔒 Identifica't per poder validar aquest pessebre</span>
            <button type="button" class="btn-popup-open-auth" onclick="window.openAuthModal()">
              👤 REGISTRA'T / ENTRAR
            </button>
          </div>
        `;
      } else {
        if (isVisited) {
          actionButtonsHtml = `
            <div style="display:flex; flex-direction:column; gap:6px;">
              <button class="btn-visit btn-visit-visited" style="pointer-events:none;">
                ✓ HI HAS ANAT
              </button>
              <button class="btn-visit btn-visit-unmark" onclick="handleVisitClick('${point.id}')">
                ✕ No hi he anat (Desmarcar)
              </button>
            </div>
          `;
        } else {
          actionButtonsHtml = `
            <button class="btn-visit btn-visit-not-visited" onclick="handleVisitClick('${point.id}')">
              🎄 HI HE ANAT
            </button>
          `;
        }
      }

      const popupContent = `
        <div class="pessebre-popup">
          <div class="pessebre-popup-header">
            <div class="pessebre-popup-badge-num">PESSEBRE #${number}</div>
            <h3 class="pessebre-popup-title">${escapeHTML(point.name)}</h3>
            <div class="pessebre-popup-muni">📍 ${escapeHTML(point.municipality)}</div>
          </div>
          ${point.description ? `<p class="pessebre-popup-desc">"${escapeHTML(point.description)}"</p>` : ''}
          ${point.submitted_by && !['Organització', 'admin', 'Oficial', 'Anònim'].includes(point.submitted_by) ? `
            <div class="pessebre-popup-author">
              👤 Proposat per <strong>@${escapeHTML(point.submitted_by)}</strong>
            </div>
          ` : ''}
          <div class="pessebre-popup-stats">
            👥 <span><strong>${visitCount}</strong> persones hi han anat</span>
          </div>
          ${actionButtonsHtml}
        </div>
      `;

      marker.bindPopup(popupContent);
      markersGroup.addLayer(marker);

      if (indexUl) {
        const li = document.createElement('li');
        li.className = 'index-item';
        if (isVisited) li.classList.add('index-item-visited');
        li.innerHTML = `
          <span class="index-item-num">${number}.</span>
          <span class="index-item-name">${escapeHTML(point.name)}</span>
          ${isVisited ? '<span class="index-item-check" title="Visitat">✓</span>' : ''}
        `;
        li.addEventListener('click', () => {
          map.flyTo([point.latitude, point.longitude], 16, { duration: 1 });
          marker.openPopup();
          if (window.innerWidth <= 768) {
            collapseIndexPanel();
          }
        });
        indexUl.appendChild(li);
      }
    });

    const indexCountEl = document.getElementById('index-count');
    if (indexCountEl) indexCountEl.textContent = approvedPoints.length;

    if (approvedPoints.length === 0 && indexUl) {
      indexUl.innerHTML = '<li class="index-panel-empty"></li>';
      indexUl.firstChild.textContent = 'Cap pessebre aprovat encara';
    }

    layoutIndexColumns();

    if (bounds.length > 0) {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        map.fitBounds(bounds, {
          paddingTopLeft: [15, 92],
          paddingBottomRight: [15, 75],
          maxZoom: 16
        });
      } else {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    }

    updateTopStats();
  }

  // 3. ACCIÓ "HI HE ANAT" I "NO HI HE ANAT" (POLSADOR TOGGLE)
  window.handleVisitClick = function(pointId) {
    const currentUser = window.db.getCurrentUser();
    
    if (!currentUser) {
      showToast('⚠️ Has d\'iniciar sessió o registrar-te per marcar un pessebre!');
      window.openAuthModal();
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
      window.openAuthModal();
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

  // 9. IDENTIFICACIÓ SENZILLA I GESTIÓ D'USUARI
  window.openAuthModal = function() {
    const currentUser = window.db.getCurrentUser();
    renderUserProfile();
    showModal('modal-profile');
    if (!currentUser) {
      setTimeout(() => {
        const uInput = document.getElementById('auth-username');
        if (uInput) uInput.focus();
      }, 150);
    }
  };

  function renderUserProfile() {
    const currentUser = window.db.getCurrentUser();
    const btnOpenAuth = document.getElementById('btn-open-auth');
    const userLoggedPill = document.getElementById('user-logged-pill');
    const loggedUserName = document.getElementById('logged-user-name');
    const loggedUserVisits = document.getElementById('logged-user-visits');
    const btnOpenAdmin = document.getElementById('btn-open-admin');
    const profileViewLogged = document.getElementById('profile-view-logged');
    const profileViewAuth = document.getElementById('profile-view-auth');

    if (currentUser) {
      if (btnOpenAuth) btnOpenAuth.style.display = 'none';
      if (userLoggedPill) userLoggedPill.style.display = 'flex';
      if (loggedUserName) loggedUserName.textContent = currentUser.username;

      const userVisits = window.db.getUserVisits(currentUser.id);
      const approvedCount = window.db.getApprovedPoints().length;
      if (loggedUserVisits) {
        loggedUserVisits.textContent = `${userVisits.length} / ${approvedCount} visitats`;
      }

      // Vistes del modal
      if (profileViewLogged) profileViewLogged.style.display = 'block';
      if (profileViewAuth) profileViewAuth.style.display = 'none';

      // Omplir dades del perfil dins del modal
      const profileName = document.getElementById('profile-username');
      if (profileName) profileName.textContent = currentUser.username;

      const profileEmail = document.getElementById('profile-email');
      if (profileEmail) profileEmail.textContent = currentUser.email || '';

      const visitedCountText = document.getElementById('profile-visited-count-text');
      if (visitedCountText) {
        visitedCountText.textContent = `${userVisits.length} de ${approvedCount} pessebres visitats`;
      }

      // Ranking text
      const leaderboard = window.db.getLeaderboard();
      const myRank = leaderboard.find(u => u.id === currentUser.id);
      const rankEl = document.getElementById('profile-rank-text');
      if (rankEl) {
        rankEl.textContent = myRank ? `#${myRank.rank} al rànquing` : 'Sense rànquing';
      }

      // Llista de visitats al modal
      const visitedUl = document.getElementById('profile-visited-ul');
      if (visitedUl) {
        visitedUl.innerHTML = '';
        if (userVisits.length === 0) {
          visitedUl.innerHTML = '<li style="padding:10px; color:#888; font-size:0.85rem; text-align:center;">Encara no has visitat cap pessebre. Ves al mapa i clica a "HI HE ANAT"!</li>';
        } else {
          userVisits.forEach(v => {
            const pt = window.db.getPointById(v.nativity_point_id);
            if (pt) {
              const li = document.createElement('li');
              li.className = 'visited-list-item';
              li.innerHTML = `
                <div>
                  <strong>🎄 ${escapeHTML(pt.name)}</strong>
                  <div style="font-size:0.75rem; color:#666;">${escapeHTML(pt.municipality)}</div>
                </div>
                <span style="font-size:0.75rem; color:#0d4726; font-weight:800;">✓ Visitat</span>
              `;
              visitedUl.appendChild(li);
            }
          });
        }
      }

      // Mostrar botó Admin ÚNICAMENT a l'usuari admin autoritzat
      const isAdmin = currentUser.role === 'ADMIN' || currentUser.username.toLowerCase() === 'admin';
      if (isAdmin) {
        if (btnOpenAdmin) {
          btnOpenAdmin.style.display = 'flex';
          const pendingCount = window.db.getPendingPoints().length;
          const badge = document.getElementById('admin-pending-badge');
          if (badge) {
            badge.textContent = pendingCount;
            badge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
          }
        }
      } else {
        if (btnOpenAdmin) btnOpenAdmin.style.display = 'none';
      }
    } else {
      if (btnOpenAuth) btnOpenAuth.style.display = 'flex';
      if (userLoggedPill) userLoggedPill.style.display = 'none';
      if (btnOpenAdmin) btnOpenAdmin.style.display = 'none';

      if (profileViewLogged) profileViewLogged.style.display = 'none';
      if (profileViewAuth) profileViewAuth.style.display = 'block';
    }
  }

  // PESTANYES REGISTRAR-SE / INICIAR SESSIÓ
  const tabRegister = document.getElementById('auth-tab-register');
  const tabLogin = document.getElementById('auth-tab-login');
  const authHeaderTitle = document.getElementById('auth-header-title');
  const authHeaderSub = document.getElementById('auth-header-sub');
  const authSubmitBtn = document.getElementById('auth-submit-btn');
  const authHelpNote = document.getElementById('auth-help-note');
  const authLabelUser = document.getElementById('auth-label-username');

  function setAuthMode(mode) {
    if (mode === 'register') {
      if (tabRegister) tabRegister.classList.add('active');
      if (tabLogin) tabLogin.classList.remove('active');
      if (authHeaderTitle) authHeaderTitle.textContent = "Registra't a la Ruta";
      if (authHeaderSub) authHeaderSub.textContent = "Crea el teu compte per validar els pessebres que visites i participar al rànquing!";
      if (authSubmitBtn) authSubmitBtn.textContent = '✨ REGISTRAR-ME I ENTRAR';
      if (authLabelUser) authLabelUser.textContent = "Nom d'usuari / participant";
      if (authHelpNote) authHelpNote.innerHTML = "📝 <strong>Nou participant?</strong> Escull el teu nom i contrasenya per crear el teu perfil i començar a marcar pessebres!";
    } else {
      if (tabLogin) tabLogin.classList.add('active');
      if (tabRegister) tabRegister.classList.remove('active');
      if (authHeaderTitle) authHeaderTitle.textContent = "Inicia la teva sessió";
      if (authHeaderSub) authHeaderSub.textContent = "Introdueix el teu nom i contrasenya (o el compte d'admin) per continuar.";
      if (authSubmitBtn) authSubmitBtn.textContent = '🔑 ENTRAR / INICIAR SESSIÓ';
      if (authLabelUser) authLabelUser.textContent = "Nom d'usuari (o 'admin')";
      if (authHelpNote) authHelpNote.innerHTML = "🔑 Ja tens compte creat o ets l'administrador? Posa el teu nom i contrasenya per entrar.";
    }
  }

  if (tabRegister) {
    tabRegister.addEventListener('click', () => setAuthMode('register'));
  }
  if (tabLogin) {
    tabLogin.addEventListener('click', () => setAuthMode('login'));
  }

  // BOTÓ PER OBRIR IDENTIFICACIÓ / REGISTRE
  const btnOpenAuth = document.getElementById('btn-open-auth');
  if (btnOpenAuth) {
    btnOpenAuth.addEventListener('click', () => {
      setAuthMode('register');
      window.openAuthModal();
    });
  }

  // CLIC A LA PÍNDOLA DE L'USUARI LOGUEJAT (PERFIL)
  const userLoggedPill = document.getElementById('user-logged-pill');
  if (userLoggedPill) {
    userLoggedPill.addEventListener('click', (e) => {
      if (e.target.id === 'btn-direct-logout') return;
      showModal('modal-profile');
    });
  }

  // FORMULARI D'AUTENTICACIÓ / REGISTRE UNIFICAT
  const formUnifiedAuth = document.getElementById('form-unified-auth');
  if (formUnifiedAuth) {
    formUnifiedAuth.addEventListener('submit', async (e) => {
      e.preventDefault();
      const u = document.getElementById('auth-username').value;
      const p = document.getElementById('auth-password').value;
      try {
        const res = await window.db.loginOrRegisterDirect(u, p);
        hideAllModals();
        if (res.isAdmin) {
          showToast("⚙️ Sessió d'Administrador iniciada!");
        } else if (res.isNew) {
          showToast(`🎉 Benvingut/da, ${res.user.username}! Compte creat correctament.`);
        } else {
          showToast(`👋 Benvingut/da de nou, ${res.user.username}!`);
        }
        formUnifiedAuth.reset();
        renderUserProfile();
        renderApprovedMarkers();
        renderRankingTable();
        updateTopStats();
      } catch (err) {
        showToast('⚠️ ' + err.message);
      }
    });
  }

  // TANCAR SESSIÓ
  function doLogout() {
    window.db.logout();
    hideAllModals();
    showToast('👋 Sessió tancada.');
    renderUserProfile();
    renderApprovedMarkers();
    renderRankingTable();
    updateTopStats();
  }

  const btnDirectLogout = document.getElementById('btn-direct-logout');
  if (btnDirectLogout) {
    btnDirectLogout.addEventListener('click', (e) => {
      e.stopPropagation();
      doLogout();
    });
  }

  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', doLogout);
  }

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

  // ÍNDEX SENSE SCROLL: màxim 2 columnes; si no hi cap, es redueix la lletra
  function layoutIndexColumns() {
    const ul = document.getElementById('index-panel-ul');
    if (!ul) return;
    ul.classList.remove('is-multicol');
    ul.style.gridTemplateRows = '';
    ul.style.removeProperty('--idx-fs');
    if (window.innerWidth <= 768) return;

    const header = document.querySelector('.index-panel-header');
    const pdfBtn = document.getElementById('btn-drawer-pdf');
    const reserved = 24 + 110 + (header ? header.offsetHeight + 12 : 0) + (pdfBtn ? pdfBtn.offsetHeight + 12 : 0);
    const avail = window.innerHeight - reserved;
    if (ul.scrollHeight <= avail) return;

    ul.classList.add('is-multicol');
    ul.style.gridTemplateRows = `repeat(${Math.ceil(ul.children.length / 2)}, auto)`;
    for (let fs = 13; fs >= 8; fs -= 0.5) {
      ul.style.setProperty('--idx-fs', fs + 'px');
      if (ul.scrollHeight <= avail) break;
    }
  }

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layoutIndexColumns, 150);
  });

  // 13. GESTIÓ DEL DESPLEGABLE DE L'ÍNDEX A MÒBIL
  const indexPanel = document.getElementById('floating-index-panel');
  const indexToggle = document.getElementById('index-panel-toggle');
  const indexArrow = document.getElementById('index-toggle-arrow');

  function collapseIndexPanel() {
    if (indexPanel) {
      indexPanel.classList.add('is-collapsed');
      if (indexArrow) indexArrow.textContent = '▲';
      if (indexToggle) indexToggle.setAttribute('aria-expanded', 'false');
    }
  }

  function expandIndexPanel() {
    if (indexPanel) {
      indexPanel.classList.remove('is-collapsed');
      if (indexArrow) indexArrow.textContent = '▼';
      if (indexToggle) indexToggle.setAttribute('aria-expanded', 'true');
    }
  }

  function toggleIndexPanel() {
    if (indexPanel) {
      if (indexPanel.classList.contains('is-collapsed')) {
        expandIndexPanel();
      } else {
        collapseIndexPanel();
      }
    }
  }

  if (indexToggle) {
    indexToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleIndexPanel();
    });
  }

  // Tancar el desplegable si es clica fora d'ell a mòbil
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && indexPanel && !indexPanel.contains(e.target)) {
      collapseIndexPanel();
    }
  });

  // 14. EXPORTACIÓ DIRECTA DEL CARTELL I MAPA A4 (ULTRA RÀPID I FIABLE)
  window.exportA4Document = async function() {
    const btn = document.getElementById('btn-drawer-pdf');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> Carregant mapa i generant...';
    }
    showToast('⏳ Descarregant mapa i preparant document A4...');

    const points = window.db.getApprovedPoints();
    const today = new Date();
    const dateFormatted = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    const dateFile = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Dimensions A4 horitzontal d'alta definició (2400 x 1700 px)
    const W = 2400;
    const H = 1700;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Bounding box dinàmic que envolta tots els pessebres de Sant Feliu Sasserra
    let minLng = 2.000, maxLng = 2.038;
    let minLat = 41.928, maxLat = 41.963;

    if (points.length > 0) {
      const lats = points.map(p => Number(p.latitude)).filter(n => !isNaN(n));
      const lngs = points.map(p => Number(p.longitude)).filter(n => !isNaN(n));
      if (lats.length > 0 && lngs.length > 0) {
        const pMinLat = Math.min(...lats);
        const pMaxLat = Math.max(...lats);
        const pMinLng = Math.min(...lngs);
        const pMaxLng = Math.max(...lngs);

        const latMargin = Math.max((pMaxLat - pMinLat) * 0.12, 0.005);
        const lngMargin = Math.max((pMaxLng - pMinLng) * 0.12, 0.005);

        minLat = Number((pMinLat - latMargin).toFixed(4));
        maxLat = Number((pMaxLat + latMargin).toFixed(4));
        minLng = Number((pMinLng - lngMargin).toFixed(4));
        maxLng = Number((pMaxLng + lngMargin).toFixed(4));
      }
    }

    const mapW = 1380;
    const mapH = 1335;
    const mapX = 75;
    const mapY = 245;

    // Descarreguem la imatge del mapa mitjançant fetch per garantir que el canvas no quedi buit
    async function loadMap() {
      const primaryUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/export?bbox=${minLng},${minLat},${maxLng},${maxLat}&bboxSR=4326&imageSR=4326&size=960,880&format=jpg&f=image&_t=${Date.now()}`;
      const fallbackUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/export?bbox=${minLng},${minLat},${maxLng},${maxLat}&bboxSR=4326&imageSR=4326&size=800,600&format=jpg&f=image`;

      const tryFetch = async (url) => {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 9000);
        try {
          const res = await fetch(url, { signal: ctrl.signal });
          clearTimeout(tid);
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const blob = await res.blob();
          const objUrl = URL.createObjectURL(blob);
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ img, objUrl });
            img.onerror = () => {
              URL.revokeObjectURL(objUrl);
              resolve(null);
            };
            img.src = objUrl;
          });
        } catch (e) {
          clearTimeout(tid);
          return null;
        }
      };

      let result = await tryFetch(primaryUrl);
      if (!result) {
        result = await tryFetch(fallbackUrl);
      }
      return result;
    }

    let mapResult = null;
    try {
      mapResult = await loadMap();
    } catch (e) {
      console.warn('Error carregant mapa:', e);
    }

    try {
      // 1. Fons i marc decoratiu
      ctx.fillStyle = '#fffdfa';
      ctx.fillRect(0, 0, W, H);

      // Doble marc cartell
      ctx.strokeStyle = '#7a1a12';
      ctx.lineWidth = 10;
      ctx.strokeRect(30, 30, W - 60, H - 60);

      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 3;
      ctx.strokeRect(45, 45, W - 90, H - 90);

      // 2. Capçalera del cartell
      ctx.fillStyle = '#7a1a12';
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('🎄 RUTA OFICIAL 2026', 75, 105);

      // TÍTOL PRINCIPAL
      ctx.fillStyle = '#522415';
      ctx.font = '900 56px "Bodoni Moda", "Playfair Display", Georgia, serif';
      ctx.fillText('RUTA DELS PESSEBRES 2026', 75, 170);

      ctx.fillStyle = '#7a1a12';
      ctx.font = '900 28px "Bodoni Moda", "Playfair Display", Georgia, serif';
      ctx.fillText('SANT FELIU SASSERRA', 75, 210);

      // Meta dret
      ctx.textAlign = 'right';
      ctx.fillStyle = '#522415';
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`Total: ${points.length} Pessebres`, W - 75, 115);

      ctx.fillStyle = '#7a6555';
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`Data d'exportació: ${dateFormatted}`, W - 75, 155);

      ctx.fillStyle = '#a07855';
      ctx.font = '18px monospace';
      ctx.fillText('eloibertranscb.github.io/RUTA-PESSEBRES-2026', W - 75, 195);

      // Línia divisòria capçalera
      ctx.strokeStyle = '#7a1a12';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(75, 235);
      ctx.lineTo(W - 75, 235);
      ctx.stroke();

      // 3. Columna Esquerra: Mapa
      if (mapResult && mapResult.img && mapResult.img.naturalWidth > 0) {
        ctx.drawImage(mapResult.img, mapX, mapY, mapW, mapH);
      } else {
        ctx.fillStyle = '#eef2eb';
        ctx.fillRect(mapX, mapY, mapW, mapH);
        ctx.fillStyle = '#7a1a12';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Terme Municipal de Sant Feliu Sasserra', mapX + mapW / 2, mapY + mapH / 2);
      }

      // Marc del mapa
      ctx.strokeStyle = '#522415';
      ctx.lineWidth = 4;
      ctx.strokeRect(mapX, mapY, mapW, mapH);

      // Plot dels marcadors numerats sobre el mapa
      points.forEach((pt, idx) => {
        const num = idx + 1;
        const mx = mapX + ((pt.longitude - minLng) / (maxLng - minLng)) * mapW;
        const my = mapY + ((maxLat - pt.latitude) / (maxLat - minLat)) * mapH;

        // Ombra
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 3;

        // Cercle vermell exterior
        ctx.beginPath();
        ctx.arc(mx, my, 20, 0, Math.PI * 2);
        ctx.fillStyle = '#b81414';
        ctx.fill();

        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
        ctx.restore();

        // Número centrat
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(num), mx, my);
      });

      // 4. Columna Dreta: Índex de Pessebres
      const idxX = 1490;
      const idxY = 245;
      const idxW = 835;
      const idxH = 1335;

      ctx.fillStyle = '#fcf9f2';
      ctx.fillRect(idxX, idxY, idxW, idxH);
      ctx.strokeStyle = '#dcd3c4';
      ctx.lineWidth = 2;
      ctx.strokeRect(idxX, idxY, idxW, idxH);

      // Títol Índex
      ctx.fillStyle = '#7a1a12';
      ctx.font = '900 30px "Bodoni Moda", "Playfair Display", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('ÍNDEX DE PESSEBRES', idxX + idxW / 2, idxY + 45);

      ctx.strokeStyle = '#e0d0c4';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(idxX + 30, idxY + 60);
      ctx.lineTo(idxX + idxW - 30, idxY + 60);
      ctx.stroke();

      const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

      // Trenca el nom en línies segons l'amplada real en píxels (MAI amb '...')
      function wrapPx(text, maxW) {
        if (!text) return [''];
        const words = text.split(' ');
        const lines = [];
        let cur = '';
        for (const w of words) {
          const test = cur ? cur + ' ' + w : w;
          if (ctx.measureText(test).width <= maxW || !cur) {
            cur = test;
          } else {
            lines.push(cur);
            cur = w;
          }
        }
        if (cur) lines.push(cur);
        return lines;
      }

      // Caixa d'informació pràctica enganxada a baix (posició calculada primer)
      const infoLineSpacing = 30;
      const infoH = 74 + 8 * infoLineSpacing + 16;
      const infoY = idxY + idxH - 25 - infoH;

      // Índex dinàmic: busquem columnes + mida de lletra perquè tot hi càpiga
      const startListY = idxY + 76;
      const listAvailH = infoY - 15 - startListY;

      function buildLayout(numCols, fs) {
        const colW = (idxW - 40) / numCols;
        const badgeR = Math.round(fs * 0.95);
        const textOffset = badgeR * 2 + 8;
        const lineH = Math.round(fs * 1.25);
        const authorH = Math.round(fs * 0.8) + 4;
        const gap = Math.round(fs * 0.7);
        ctx.font = `bold ${fs}px ${FONT}`;
        const items = points.map(pt => {
          const lines = wrapPx(pt.name, colW - textOffset - 10);
          return { pt, lines, h: Math.max(lines.length * lineH + authorH, badgeR * 2) + gap };
        });
        // Repartim seqüencialment per columnes equilibrant l'altura
        const total = items.reduce((s, it) => s + it.h, 0);
        const target = total / numCols;
        const cols = [[]];
        let acc = 0;
        items.forEach(it => {
          if (acc + it.h / 2 > target * cols.length && cols.length < numCols) cols.push([]);
          cols[cols.length - 1].push(it);
          acc += it.h;
        });
        const maxColH = Math.max(...cols.map(c => c.reduce((s, it) => s + it.h, 0)));
        return { numCols, fs, colW, badgeR, textOffset, lineH, authorH, cols, fits: maxColH <= listAvailH };
      }

      let layout = null;
      outer:
      for (let fs = 15; fs >= 9; fs--) {
        for (let nc = 2; nc <= 4; nc++) {
          const l = buildLayout(nc, fs);
          if (l.fits) { layout = l; break outer; }
        }
      }
      if (!layout) layout = buildLayout(4, 9);

      let num = 0;
      layout.cols.forEach((col, colIdx) => {
        const colX = idxX + 20 + colIdx * layout.colW;
        let itemY = startListY;
        col.forEach(({ pt, lines, h }) => {
          num++;
          const { fs, badgeR, textOffset, lineH } = layout;

          // Insígnia número (cercle vermell fosc)
          const badgeCenterY = itemY + badgeR;
          ctx.beginPath();
          ctx.arc(colX + badgeR, badgeCenterY, badgeR, 0, Math.PI * 2);
          ctx.fillStyle = '#7a1a12';
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = `900 ${fs}px ${FONT}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(num), colX + badgeR, badgeCenterY);

          // Nom del pessebre
          ctx.fillStyle = '#2a1a14';
          ctx.font = `bold ${fs}px ${FONT}`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          let curTextY = itemY;
          lines.forEach(line => {
            ctx.fillText(line, colX + textOffset, curTextY);
            curTextY += lineH;
          });

          // Subtítol autor a sota, més petit
          const author = pt.submitted_by || 'Organització';
          ctx.fillStyle = '#8c5338';
          ctx.font = `600 ${Math.round(fs * 0.8)}px ${FONT}`;
          ctx.fillText(`👤 ${author}`, colX + textOffset, curTextY + 1);

          itemY += h;
        });
      });

      // Caixa d'informació pràctica
      ctx.fillStyle = '#f3ebe0';
      ctx.fillRect(idxX + 25, infoY, idxW - 50, infoH);
      ctx.strokeStyle = '#c4b49e';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(idxX + 25, infoY, idxW - 50, infoH);

      ctx.fillStyle = '#522415';
      ctx.font = '900 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('ℹ️ INFORMACIÓ PRÀCTICA I NORMES', idxX + 45, infoY + 24);

      ctx.fillStyle = '#4a382c';
      ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const lineSpacing = infoLineSpacing;
      let lineY = infoY + 74;

      const infoLines = [
        '• Ruta circular pel terme de Sant Feliu Sasserra.',
        '• Apte per fer a peu, caminant o en bicicleta (BTT).',
        '• Recomanem portar calçat de muntanya i aigua.',
        '• Respecteu els pessebres, les figures i el medi natural.',
        '• No deixeu deixalles ni malmeteu els camins.',
        '• Podeu marcar els visitats des de la web oficial:',
        '  eloibertranscb.github.io/RUTA-PESSEBRES-2026',
        '• En cas d\'emergències truqueu al 112.'
      ];

      infoLines.forEach(l => {
        ctx.fillText(l, idxX + 45, lineY);
        lineY += lineSpacing;
      });

      // 5. Descarregar fitxer directe en PDF o Imatge
      const filename = `Ruta_Pessebres_2026_Sant_Feliu_Sasserra_${dateFile}`;

      if (window.jspdf && window.jspdf.jsPDF) {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
        pdf.save(`${filename}.pdf`);
        showToast('✅ PDF A4 oficial descarregat correctament!');
      } else {
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${filename}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast('✅ Cartell i Mapa A4 descarregat!');
        }, 'image/png');
      }
    } catch (err) {
      console.error('Error generant document:', err);
      showToast('⚠️ Error al generar el document: ' + err.message);
    } finally {
      if (mapResult && mapResult.objUrl) {
        URL.revokeObjectURL(mapResult.objUrl);
      }
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>📄</span> Descarregar Mapa i Índex (A4)';
      }
    }
  };

  const btnDrawerPdf = document.getElementById('btn-drawer-pdf');
  if (btnDrawerPdf) {
    btnDrawerPdf.addEventListener('click', () => {
      window.exportA4Document();
    });
  }

  // A mòbil, per defecte l'índex comença plegat perquè es vegi el mapa
  if (window.innerWidth <= 768) {
    collapseIndexPanel();
  }

  // ENGEGAR EL MAPA I LES VISTES
  initMap();
  renderUserProfile();
  renderRankingTable();
});

