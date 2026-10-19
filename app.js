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

  // GESTIÓ DE CAPES DE MAPA (OFICIAL VS SATÈL·LIT)
  let currentMapType = localStorage.getItem('pessebres_map_type') || 'streets';
  let streetLayer = null;
  let satelliteLayerGroup = null;

  if (currentMapType === 'satellite') {
    document.body.classList.add('map-mode-satellite');
  }

  function initMap() {
    // Inicialitzem el mapa
    map = L.map('map', {
      center: [41.9461, 2.0211],
      zoom: 14.5,
      zoomControl: true
    });

    // 1. Capa Oficial: Esri World Street Map
    streetLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Mapes &copy; <a href="https://www.esri.com/">Esri</a> | Ruta dels Pessebres 2026',
      maxZoom: 19,
      crossOrigin: true
    });

    // 2. Capa Satèl·lit d'alta resolució: Imatgeria aèria + Etiquetes de carrers i camins (Híbrid)
    const satImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Imatges &copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics',
      maxZoom: 19,
      crossOrigin: true
    });

    const satLabels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      crossOrigin: true
    });

    satelliteLayerGroup = L.layerGroup([satImagery, satLabels]);

    // Apliquem la capa triada (o la guardada a localStorage)
    if (currentMapType === 'satellite') {
      satelliteLayerGroup.addTo(map);
      document.body.classList.add('map-mode-satellite');
    } else {
      streetLayer.addTo(map);
      document.body.classList.remove('map-mode-satellite');
    }

    markersGroup = L.layerGroup().addTo(map);

    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 250);

    // Configurar commutador de capes (Oficial vs Satèl·lit)
    window.setMapLayer = function(type) {
      if (!map || !streetLayer || !satelliteLayerGroup) return;
      currentMapType = type;
      localStorage.setItem('pessebres_map_type', type);

      const btnStreets = document.getElementById('btn-layer-streets');
      const btnSatellite = document.getElementById('btn-layer-satellite');

      if (type === 'satellite') {
        if (map.hasLayer(streetLayer)) map.removeLayer(streetLayer);
        if (!map.hasLayer(satelliteLayerGroup)) map.addLayer(satelliteLayerGroup);
        if (btnStreets) btnStreets.classList.remove('active');
        if (btnSatellite) btnSatellite.classList.add('active');
        document.body.classList.add('map-mode-satellite');
        showToast('🛰️ Vista de Satèl·lit activada');
      } else {
        if (map.hasLayer(satelliteLayerGroup)) map.removeLayer(satelliteLayerGroup);
        if (!map.hasLayer(streetLayer)) map.addLayer(streetLayer);
        if (btnSatellite) btnSatellite.classList.remove('active');
        if (btnStreets) btnStreets.classList.add('active');
        document.body.classList.remove('map-mode-satellite');
        showToast('🗺️ Mapa Oficial activat');
      }
    };

    const btnLayerStreets = document.getElementById('btn-layer-streets');
    const btnLayerSatellite = document.getElementById('btn-layer-satellite');

    if (currentMapType === 'satellite') {
      if (btnLayerStreets) btnLayerStreets.classList.remove('active');
      if (btnLayerSatellite) btnLayerSatellite.classList.add('active');
    } else {
      if (btnLayerSatellite) btnLayerSatellite.classList.remove('active');
      if (btnLayerStreets) btnLayerStreets.classList.add('active');
    }

    if (btnLayerStreets) {
      btnLayerStreets.addEventListener('click', () => window.setMapLayer('streets'));
    }
    if (btnLayerSatellite) {
      btnLayerSatellite.addEventListener('click', () => window.setMapLayer('satellite'));
    }

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

  let openPopupPointId = null;
  let isRebuildingMarkers = false;

  // EFECTE NADALENC: Neu que cau de la bola de Nadal i balanceig festiu
  function triggerChristmasSnowEffect(targetEl) {
    if (!targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    // 1. Balanceig / jiggle nadalenc a la bola clicada
    targetEl.classList.remove('bauble-swing');
    void targetEl.offsetWidth; // Forçar reflow per reiniciar animació
    targetEl.classList.add('bauble-swing');

    // 2. Anell d'espurnes daurat que s'expandeix des de la bola
    const ring = document.createElement('div');
    ring.className = 'bauble-sparkle-ring';
    ring.style.left = `${originX}px`;
    ring.style.top = `${originY}px`;
    document.body.appendChild(ring);
    setTimeout(() => { if (ring.parentNode) ring.parentNode.removeChild(ring); }, 650);

    // 3. Flocs de neu i cristall que cauen suaument cap avall
    const flakes = ['❄', '❅', '✻', '❆', '✨', '•', '·', '❄', '✨'];
    const count = 22;

    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'xmas-snow-particle';
      const symbol = flakes[Math.floor(Math.random() * flakes.length)];
      p.textContent = symbol;

      const size = (symbol === '•' || symbol === '·')
        ? Math.floor(Math.random() * 8 + 10)
        : Math.floor(Math.random() * 12 + 13);
      const vx = (Math.random() - 0.5) * 80; // deriva horitzontal (-40px a +40px)
      const vy = Math.random() * 95 + 45;   // caiguda vertical (45px a 140px)
      const duration = (Math.random() * 0.6 + 0.85).toFixed(2);
      const delay = (Math.random() * 0.15).toFixed(2);
      const rot = Math.floor((Math.random() - 0.5) * 360);

      const isGold = symbol === '✨';
      const color = isGold ? '#fadb14' : (Math.random() > 0.3 ? '#ffffff' : '#e0f2fe');
      const shadow = isGold 
        ? '0 0 8px rgba(250, 219, 20, 0.9), 0 0 12px rgba(245, 106, 0, 0.6)'
        : '0 0 6px rgba(255, 255, 255, 0.95), 0 0 10px rgba(184, 20, 20, 0.5)';

      p.style.cssText = `
        left: ${originX}px;
        top: ${originY}px;
        font-size: ${size}px;
        color: ${color};
        text-shadow: ${shadow};
        --vx: ${vx}px;
        --vy: ${vy}px;
        --rot: ${rot}deg;
        animation: xmasSnowFall ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}s forwards;
      `;

      document.body.appendChild(p);
      setTimeout(() => { if (p.parentNode) p.parentNode.removeChild(p); }, (parseFloat(duration) + parseFloat(delay) + 0.2) * 1000);
    }
  }

  // 2. RENDERITZAR MARCADORS NUMERATS I GESTIÓ D'ACCÉS (SENSE TANCAR EL POPUP)
  function renderApprovedMarkers(skipFitBounds = false) {
    const approvedPoints = window.db.getApprovedPoints();
    const currentUser = window.db.getCurrentUser();
    const bounds = [];

    const indexUl = document.getElementById('index-panel-ul');
    if (indexUl) indexUl.innerHTML = '';

    const currentApprovedIds = new Set(approvedPoints.map(p => p.id));

    // Netejar marcadors que ja no estan aprovats o eliminats
    Object.keys(markerMap).forEach(id => {
      if (!currentApprovedIds.has(id)) {
        if (markersGroup.hasLayer(markerMap[id])) {
          markersGroup.removeLayer(markerMap[id]);
        }
        delete markerMap[id];
      }
    });

    approvedPoints.forEach((point, idx) => {
      const number = idx + 1;
      const visitCount = window.db.getVisitCountForPoint(point.id);
      const isVisited = currentUser ? window.db.hasUserVisited(currentUser.id, point.id) : false;
      const userRating = currentUser ? window.db.getUserRatingForPoint(currentUser.id, point.id) : 0;
      const ratingStats = window.db.getPointRatingStats(point.id);

      bounds.push([point.latitude, point.longitude]);

      // Boles de Nadal (1 a 5) per valorar el pessebre (no influeix al rànquing)
      let ballsHtml = '';
      for (let b = 1; b <= 5; b++) {
        const isActive = currentUser ? (b <= userRating) : (b <= Math.round(ratingStats.average));
        const activeClass = isActive ? 'bauble-active' : 'bauble-inactive';
        const clickAttr = currentUser
          ? `onclick="handleRateClick('${point.id}', ${b}, event)"`
          : `onclick="window.openAuthModal()"`;
        ballsHtml += `
          <button type="button" class="bauble-btn ${activeClass}" ${clickAttr} title="${b} ${b === 1 ? 'bola de Nadal' : 'boles de Nadal'}" data-ball="${b}">
            <span class="bauble-cap"></span>
            <span class="bauble-globe"><span class="bauble-shine"></span></span>
          </button>
        `;
      }

      const ratingSummaryText = ratingStats.count > 0
        ? `<strong>${ratingStats.average}</strong> / 5 (${ratingStats.count} ${ratingStats.count === 1 ? 'vot' : 'vots'})`
        : ' Sigues el primer a valorar-lo!';

      const userRatingLabel = currentUser
        ? (userRating > 0 ? `La teva valoració: <strong>${userRating} / 5 🔴</strong>` : ' Toca les boles de Nadal per valorar (1-5):')
        : ' Identifica\'t per posar boles de Nadal:';

      const ratingSectionHtml = `
        <div class="pessebre-bauble-rating-box">
          <div class="bauble-rating-label">${userRatingLabel}</div>
          <div class="bauble-balls-row">${ballsHtml}</div>
          <div class="bauble-rating-avg">🔴 Mitjana: ${ratingSummaryText}</div>
        </div>
      `;

      // SI NO ESTÀ REGISTRAT: NOMÉS VEUEN EL PESSEBRE I EL NÚMERO, NO PODEN VALIDAR
      let actionButtonsHtml = '';
      if (!currentUser) {
        actionButtonsHtml = `
          <div class="pessebre-popup-lock-msg">
            <span>🔒 Identifica't per poder validar o valorar aquest pessebre</span>
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
          ${ratingSectionHtml}
          ${actionButtonsHtml}
          ${currentUser && currentUser.role === 'ADMIN' ? `
            <div class="pessebre-popup-admin-actions" style="margin-top:10px; padding-top:8px; border-top:1px dashed rgba(122,26,18,0.3); display:flex; gap:6px; justify-content:flex-end;">
              <button type="button" class="btn-popup-admin-edit" onclick="adminOpenEditModal('${point.id}')" style="background:#fdfbf7; border:1px solid #7a1a12; color:#7a1a12; font-size:0.75rem; font-weight:700; padding:4px 8px; border-radius:3px; cursor:pointer;">✏️ EDITAR</button>
              <button type="button" class="btn-popup-admin-delete" onclick="adminDeletePoint('${point.id}')" style="background:#fee; border:1px solid #c00; color:#c00; font-size:0.75rem; font-weight:700; padding:4px 8px; border-radius:3px; cursor:pointer;">🗑️ ELIMINAR</button>
            </div>
          ` : ''}
        </div>
      `;

      const markerIcon = createNumberedMarkerIcon(number, isVisited);
      let marker = markerMap[point.id];

      if (marker && markersGroup.hasLayer(marker)) {
        // Marcador ja existent al mapa: actualitzem icona i contingut SENSE tancar el popup
        marker.setIcon(markerIcon);
        marker.setPopupContent(popupContent);
      } else {
        // Marcador nou
        marker = L.marker([point.latitude, point.longitude], { icon: markerIcon });
        markerMap[point.id] = marker;
        marker.bindPopup(popupContent);
        marker.on('popupopen', () => { openPopupPointId = point.id; });
        marker.on('popupclose', () => {
          if (!isRebuildingMarkers && openPopupPointId === point.id) {
            openPopupPointId = null;
          }
        });
        markersGroup.addLayer(marker);
      }

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

    if (!skipFitBounds && bounds.length > 0) {
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

    if (openPopupPointId && markerMap[openPopupPointId]) {
      if (!markerMap[openPopupPointId].isPopupOpen()) {
        markerMap[openPopupPointId].openPopup();
      }
    }

    updateTopStats();
  }

  // 3. ACCIÓ "HI HE ANAT" I VALORACIÓ AMB BOLES DE NADAL (SENSE TANCAR LA PESTANYA)
  window.handleVisitClick = async function(pointId) {
    const currentUser = window.db.getCurrentUser();
    
    if (!currentUser) {
      showToast('⚠️ Has d\'iniciar sessió o registrar-te per marcar un pessebre!');
      window.openAuthModal();
      return;
    }

    try {
      openPopupPointId = pointId;
      const result = await window.db.toggleVisit(currentUser.id, pointId);
      renderApprovedMarkers(true);
      updateTopStats();
      renderRankingTable();
      renderUserProfile();
      
      if (result.visited) {
        checkTrophyStatus(true);
        showToast('🎉 Has marcat aquest pessebre com a visitat!');
      } else {
        checkTrophyStatus(false);
        showToast('❌ Has desmarcat aquest pessebre.');
      }
    } catch (err) {
      showToast('⚠️ ' + err.message);
    }
  };

  window.handleRateClick = async function(pointId, rating, event) {
    if (event) {
      if (typeof event.stopPropagation === 'function') event.stopPropagation();
      if (typeof event.preventDefault === 'function') event.preventDefault();
    }
    const currentUser = window.db.getCurrentUser();
    if (!currentUser) {
      showToast('⚠️ Identifica\'t o registra\'t per valorar amb les boles de Nadal!');
      window.openAuthModal();
      return;
    }

    const clickedBtn = event && event.currentTarget ? event.currentTarget : null;
    if (clickedBtn) {
      // 1. Efecte de caiguda de neu nadalenca i balanceig de la bola
      triggerChristmasSnowEffect(clickedBtn);

      // 2. Actualització visual immediata dins del popup obert (sense tancar la pestanya)
      const ballsRow = clickedBtn.closest('.bauble-balls-row');
      if (ballsRow) {
        const btns = ballsRow.querySelectorAll('.bauble-btn');
        btns.forEach((btn, idx) => {
          const ballNum = idx + 1;
          if (ballNum <= rating) {
            btn.classList.add('bauble-active');
            btn.classList.remove('bauble-inactive');
          } else {
            btn.classList.remove('bauble-active');
            btn.classList.add('bauble-inactive');
          }
        });
      }
      const ratingBox = clickedBtn.closest('.pessebre-bauble-rating-box');
      if (ratingBox) {
        const labelEl = ratingBox.querySelector('.bauble-rating-label');
        if (labelEl) {
          labelEl.innerHTML = `La teva valoració: <strong>${rating} / 5 🔴</strong>`;
        }
      }
    }

    try {
      openPopupPointId = pointId;
      await window.db.ratePoint(currentUser.id, pointId, rating);
      renderApprovedMarkers(true);
      updateTopStats();
      renderRankingTable();
      renderUserProfile();
      checkTrophyStatus(true);
      showToast(`🔴 Has valorat aquest pessebre amb ${rating} ${rating === 1 ? 'bola' : 'boles'} de Nadal!`);
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
    if (badge) {
      if (pendingCount > 0) {
        badge.textContent = pendingCount;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }

    // Comprovem l'estat del Trofeu Oficial
    checkTrophyStatus(false);
  }

  // 🏆 GESTIÓ I CELEBRACIÓ DEL TROFEU OFICIAL RUTA DELS PESSEBRES
  function triggerVictoryConfetti() {
    const symbols = ['🎉', '✨', '⭐', '🌟', '🏆', '❄', '🟡', '🔴'];
    const colors = ['#ffd700', '#ffb703', '#ffffff', '#e63946', '#2a9d8f'];
    const total = 80;

    for (let i = 0; i < total; i++) {
      const p = document.createElement('span');
      p.className = 'victory-confetti-particle';
      const isSymbol = Math.random() > 0.45;
      if (isSymbol) {
        p.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        p.style.fontSize = Math.floor(Math.random() * 16 + 14) + 'px';
      } else {
        p.style.width = Math.floor(Math.random() * 8 + 8) + 'px';
        p.style.height = Math.floor(Math.random() * 12 + 10) + 'px';
        p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      }

      const startX = window.innerWidth / 2 + (Math.random() - 0.5) * 350;
      const startY = window.innerHeight * 0.35 + (Math.random() - 0.5) * 150;
      const cx = (Math.random() - 0.5) * window.innerWidth * 0.95;
      const cy = Math.random() * window.innerHeight * 0.65 + 120;
      const crot = Math.floor((Math.random() - 0.5) * 720);
      const duration = (Math.random() * 1.5 + 1.8).toFixed(2);
      const delay = (Math.random() * 0.4).toFixed(2);

      p.style.left = `${startX}px`;
      p.style.top = `${startY}px`;
      p.style.setProperty('--cx', `${cx}px`);
      p.style.setProperty('--cy', `${cy}px`);
      p.style.setProperty('--crot', `${crot}deg`);
      p.style.animationDuration = `${duration}s`;
      p.style.animationDelay = `${delay}s`;

      document.body.appendChild(p);
      setTimeout(() => { if (p.parentNode) p.parentNode.removeChild(p); }, (parseFloat(duration) + parseFloat(delay) + 0.3) * 1000);
    }
  }

  // ❄️🎉 EFECTES CONTINUS PER AL GUANYADOR: NEU I CONFETI TOT EL RATO (OPTIMITZAT 60 FPS)
  let victoryEffectsRunning = false;
  let victoryEffectsCanvas = null;
  let victoryEffectsCtx = null;
  let victoryParticlesSnow = [];
  let victoryParticlesConfetti = [];
  let victoryEffectsAnimId = null;

  function startContinuousVictoryEffects() {
    if (victoryEffectsRunning) return;
    victoryEffectsRunning = true;

    victoryEffectsCanvas = document.getElementById('victory-effects-canvas');
    if (!victoryEffectsCanvas) {
      victoryEffectsCanvas = document.createElement('canvas');
      victoryEffectsCanvas.id = 'victory-effects-canvas';
      document.body.appendChild(victoryEffectsCanvas);
    }

    victoryEffectsCtx = victoryEffectsCanvas.getContext('2d');

    function resizeEffectsCanvas() {
      if (!victoryEffectsCanvas) return;
      victoryEffectsCanvas.width = window.innerWidth;
      victoryEffectsCanvas.height = window.innerHeight;
    }
    resizeEffectsCanvas();
    window.removeEventListener('resize', resizeEffectsCanvas);
    window.addEventListener('resize', resizeEffectsCanvas);

    const confettiColors = ['#ffd700', '#ffb703', '#ffffff', '#e63946', '#2a9d8f', '#ff0055', '#48cae4', '#9d4edd'];
    const isMobile = window.innerWidth <= 768;
    const totalSnow = isMobile ? 18 : 28;
    const totalConfetti = isMobile ? 18 : 26;

    victoryParticlesSnow = [];
    for (let i = 0; i < totalSnow; i++) {
      victoryParticlesSnow.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        radius: Math.random() * 2.2 + 1.2,
        speedY: Math.random() * 1.2 + 0.6,
        speedX: (Math.random() - 0.5) * 0.7,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.03 + 0.01
      });
    }

    victoryParticlesConfetti = [];
    for (let i = 0; i < totalConfetti; i++) {
      victoryParticlesConfetti.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        w: Math.random() * 8 + 5,
        h: Math.random() * 10 + 6,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        speedY: Math.random() * 2.2 + 1.2,
        speedX: (Math.random() - 0.5) * 1.2,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.08,
        tilt: Math.random() * Math.PI * 2,
        tiltSpeed: Math.random() * 0.07 + 0.03
      });
    }

    function renderVictoryEffects() {
      if (!victoryEffectsRunning || !victoryEffectsCtx || !victoryEffectsCanvas) {
        victoryEffectsAnimId = null;
        return;
      }
      if (document.hidden) {
        victoryEffectsAnimId = requestAnimationFrame(renderVictoryEffects);
        return;
      }

      const W = victoryEffectsCanvas.width;
      const H = victoryEffectsCanvas.height;
      victoryEffectsCtx.clearRect(0, 0, W, H);

      // 1. NEU ULTRA RÀPIDA: Dibuixada en un sol path per a 0 lag (sense shadowBlur ni fonts)
      victoryEffectsCtx.beginPath();
      victoryEffectsCtx.fillStyle = 'rgba(255, 255, 255, 0.82)';
      for (let i = 0; i < victoryParticlesSnow.length; i++) {
        const p = victoryParticlesSnow[i];
        p.wobble += p.wobbleSpeed;
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.wobble) * 0.5;

        if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; }
        if (p.x > W + 10) p.x = -10;
        else if (p.x < -10) p.x = W + 10;

        victoryEffectsCtx.moveTo(p.x + p.radius, p.y);
        victoryEffectsCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      }
      victoryEffectsCtx.fill();

      // 2. CONFETI LLEUGER I FLUID (Directe i ràpid)
      for (let i = 0; i < victoryParticlesConfetti.length; i++) {
        const p = victoryParticlesConfetti[i];
        p.rot += p.rotSpeed;
        p.tilt += p.tiltSpeed;
        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y > H + 15) { p.y = -15; p.x = Math.random() * W; }
        if (p.x > W + 15) p.x = -15;
        else if (p.x < -15) p.x = W + 15;

        victoryEffectsCtx.save();
        victoryEffectsCtx.translate(p.x, p.y);
        victoryEffectsCtx.rotate(p.rot);
        const scaleY = Math.cos(p.tilt);
        victoryEffectsCtx.scale(1, scaleY);
        victoryEffectsCtx.fillStyle = p.color;
        victoryEffectsCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        victoryEffectsCtx.restore();
      }

      victoryEffectsAnimId = requestAnimationFrame(renderVictoryEffects);
    }

    if (!victoryEffectsAnimId) {
      victoryEffectsAnimId = requestAnimationFrame(renderVictoryEffects);
    }
  }

  function stopContinuousVictoryEffects() {
    victoryEffectsRunning = false;
    if (victoryEffectsAnimId) {
      cancelAnimationFrame(victoryEffectsAnimId);
      victoryEffectsAnimId = null;
    }
    if (victoryEffectsCanvas && victoryEffectsCtx) {
      victoryEffectsCtx.clearRect(0, 0, victoryEffectsCanvas.width, victoryEffectsCanvas.height);
    }
  }

  // 3D VIEWER PER AL TROFEU SOTA EL TÍTOL (Three.js OBJLoader permanent optimitzat)
  let headerTrophy3DInitialized = false;
  let headerTrophyScene, headerTrophyCamera, headerTrophyRenderer, headerTrophyModel;
  let headerTrophyAnimId = null;

  function animateHeaderTrophy() {
    const badge = document.getElementById('trophy-title-badge');
    if (!badge || badge.style.display === 'none' || document.hidden) {
      headerTrophyAnimId = null;
      return; // Pausar per no consumir GPU innecessàriament
    }
    headerTrophyAnimId = requestAnimationFrame(animateHeaderTrophy);
    if (headerTrophyModel) {
      headerTrophyModel.rotation.y += 0.018; // Donar voltes contínues
    }
    if (headerTrophyRenderer && headerTrophyScene && headerTrophyCamera) {
      headerTrophyRenderer.render(headerTrophyScene, headerTrophyCamera);
    }
  }

  function startHeaderTrophyLoop() {
    if (!headerTrophyAnimId && headerTrophy3DInitialized) {
      headerTrophyAnimId = requestAnimationFrame(animateHeaderTrophy);
    }
  }

  function initHeaderTrophy3D() {
    if (headerTrophy3DInitialized) {
      startHeaderTrophyLoop();
      return;
    }
    const container = document.getElementById('trophy-header-3d-container');
    const loadingEl = document.getElementById('trophy-header-3d-loading');
    if (!container || !window.THREE || !window.THREE.OBJLoader) return;

    try {
      const width = container.clientWidth || 140;
      const height = container.clientHeight || 165;

      headerTrophyScene = new THREE.Scene();
      headerTrophyCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      headerTrophyCamera.position.set(0, 0, 3.4);

      headerTrophyRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
      headerTrophyRenderer.setSize(width, height);
      headerTrophyRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      if (THREE.sRGBEncoding) headerTrophyRenderer.outputEncoding = THREE.sRGBEncoding;

      const existingCanvas = container.querySelector('canvas');
      if (existingCanvas) existingCanvas.remove();
      container.appendChild(headerTrophyRenderer.domElement);

      // Il·luminació daurada que fa ressaltar els detalls
      const ambientLight = new THREE.AmbientLight(0xfff5e6, 1.4);
      headerTrophyScene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
      keyLight.position.set(3, 5, 4);
      headerTrophyScene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xffd700, 1.8);
      fillLight.position.set(-3, 2, 3);
      headerTrophyScene.add(fillLight);

      const rimLight = new THREE.DirectionalLight(0xffe680, 1.8);
      rimLight.position.set(0, -3, -4);
      headerTrophyScene.add(rimLight);

      startHeaderTrophyLoop();

      const objLoader = new THREE.OBJLoader();
      objLoader.load(
        'trofeu_model/trofeu.obj',
        (obj) => {
          const goldMaterial = new THREE.MeshStandardMaterial({
            color: 0xf5c342,
            metalness: 0.88,
            roughness: 0.22,
            flatShading: false
          });

          obj.traverse((child) => {
            if (child.isMesh) {
              child.geometry.computeVertexNormals();
              child.material = goldMaterial;
            }
          });

          const box = new THREE.Box3().setFromObject(obj);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2.1 / (maxDim || 1);

          obj.scale.set(scale, scale, scale);
          obj.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

          const pivot = new THREE.Group();
          pivot.add(obj);
          headerTrophyScene.add(pivot);
          headerTrophyModel = pivot;

          if (loadingEl) {
            loadingEl.style.opacity = '0';
            setTimeout(() => { if (loadingEl && loadingEl.parentNode) loadingEl.remove(); }, 300);
          }
          headerTrophy3DInitialized = true;
        },
        undefined,
        (err) => {
          console.warn("No s'ha pogut carregar l'OBJ al títol:", err);
        }
      );
    } catch (e) {
      console.warn("Error inicialitzant trofeu 3D del títol:", e);
    }
  }

  function checkTrophyStatus(canCelebrate = false) {
    const trophyBadge = document.getElementById('trophy-title-badge');
    if (!trophyBadge) return;

    const currentUser = window.db.getCurrentUser();
    const approvedPoints = window.db.getApprovedPoints();

    if (!currentUser || approvedPoints.length === 0) {
      trophyBadge.style.display = 'none';
      stopContinuousVictoryEffects();
      return;
    }

    const visitedCount = approvedPoints.filter(p => window.db.hasUserVisited(currentUser.id, p.id)).length;
    const isCompleted = visitedCount >= approvedPoints.length;

    if (isCompleted) {
      trophyBadge.style.display = 'inline-flex';

      // 1. Activar el trofeu 3D girant continu sota el títol
      initHeaderTrophy3D();

      // 2. Activar la caiguda contínua de confeti i bolves de neu per tota la pantalla
      startContinuousVictoryEffects();

      // Actualitzem les dades del modal del Trofeu
      const totalPointsEl = document.getElementById('trophy-total-points');
      if (totalPointsEl) totalPointsEl.textContent = approvedPoints.length;
      const userNameEl = document.getElementById('trophy-user-name');
      if (userNameEl) userNameEl.textContent = (currentUser?.username || 'Pessebrista').replace(/^@+/, '');

      // Si és el moment en què ha marcat l'últim pessebre, fem la gran celebració automàtica
      const celebrationKey = `pessebres_trophy_celebrated_${currentUser.id}`;
      const alreadyCelebrated = localStorage.getItem(celebrationKey);

      if (canCelebrate && !alreadyCelebrated) {
        localStorage.setItem(celebrationKey, 'true');
        setTimeout(() => {
          triggerVictoryConfetti();
          showModal('modal-trophy');
          initTrophy3D();
          showToast(`🏆 ENHORABONA @${currentUser.username}! HAS GUANYAT EL TROFEU DELS PESSEBRES 2026!`);
        }, 500);
      }
    } else {
      trophyBadge.style.display = 'none';
      stopContinuousVictoryEffects();
      if (headerTrophyAnimId) {
        cancelAnimationFrame(headerTrophyAnimId);
        headerTrophyAnimId = null;
      }
    }
  }

  // 3D VIEWER PER AL TROFEU OFICIAL (Three.js OBJLoader optimitzat)
  let trophy3DInitialized = false;
  let trophy3DScene, trophy3DCamera, trophy3DRenderer, trophy3DControls, trophy3DModel;
  let trophy3DAnimId = null;

  function animateTrophyModal() {
    const modalEl = document.getElementById('modal-trophy');
    if (!modalEl || !modalEl.classList.contains('active') || document.hidden) {
      trophy3DAnimId = null;
      return; // Pausar quan el modal està tancat
    }
    trophy3DAnimId = requestAnimationFrame(animateTrophyModal);
    if (trophy3DControls) {
      trophy3DControls.update();
    }
    if (trophy3DModel) {
      trophy3DModel.rotation.y += 0.015;
    }
    if (trophy3DRenderer && trophy3DScene && trophy3DCamera) {
      trophy3DRenderer.render(trophy3DScene, trophy3DCamera);
    }
  }

  function startTrophyModalLoop() {
    if (!trophy3DAnimId && trophy3DInitialized) {
      trophy3DAnimId = requestAnimationFrame(animateTrophyModal);
    }
  }

  function initTrophy3D() {
    if (trophy3DInitialized) {
      startTrophyModalLoop();
      return;
    }
    const container = document.getElementById('trophy-3d-canvas-container');
    const loadingEl = document.getElementById('trophy-3d-loading');
    const hintEl = document.getElementById('trophy-3d-hint');
    if (!container || !window.THREE || !window.THREE.OBJLoader) return;

    try {
      const width = container.clientWidth || 260;
      const height = container.clientHeight || 320;

      trophy3DScene = new THREE.Scene();
      trophy3DCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      trophy3DCamera.position.set(0, 0, 3.4);

      trophy3DRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
      trophy3DRenderer.setSize(width, height);
      trophy3DRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      if (THREE.sRGBEncoding) trophy3DRenderer.outputEncoding = THREE.sRGBEncoding;
      
      // Afegir el canvas al contenidor (sense esborrar el loading)
      const existingCanvas = container.querySelector('canvas');
      if (existingCanvas) existingCanvas.remove();
      container.appendChild(trophy3DRenderer.domElement);

      if (window.THREE.OrbitControls) {
        trophy3DControls = new THREE.OrbitControls(trophy3DCamera, trophy3DRenderer.domElement);
        trophy3DControls.enableDamping = true;
        trophy3DControls.dampingFactor = 0.05;
        trophy3DControls.enableZoom = true;
        trophy3DControls.minDistance = 1.8;
        trophy3DControls.maxDistance = 5.5;
      }

      // Il·luminació artística per destacar els relleus i reflexos daurats del trofeu
      const ambientLight = new THREE.AmbientLight(0xfff5e6, 1.4);
      trophy3DScene.add(ambientLight);

      // Llum principal intensa per als reflexos especulars
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
      keyLight.position.set(3, 5, 4);
      trophy3DScene.add(keyLight);

      // Llum càlida daurada de farciment
      const fillLight = new THREE.DirectionalLight(0xffd700, 1.6);
      fillLight.position.set(-3, 2, 3);
      trophy3DScene.add(fillLight);

      // Llum de contorn (rim light) des de darrere
      const rimLight = new THREE.DirectionalLight(0xffe680, 1.8);
      rimLight.position.set(0, -3, -4);
      trophy3DScene.add(rimLight);

      // Llum puntual d'espurna brillant
      const sparkleLight = new THREE.PointLight(0xffffff, 1.2, 10);
      sparkleLight.position.set(1.5, 2, 2.5);
      trophy3DScene.add(sparkleLight);

      startTrophyModalLoop();

      // Carregar el model OBJ directament amb material daurat polit
      const objLoader = new THREE.OBJLoader();
      objLoader.load(
        'trofeu_model/trofeu.obj',
        (obj) => {
          // Material or polit amb reflexos metàl·lics
          const goldMaterial = new THREE.MeshStandardMaterial({
            color: 0xf5c342,
            metalness: 0.88,
            roughness: 0.22,
            flatShading: false
          });

          obj.traverse((child) => {
            if (child.isMesh) {
              child.geometry.computeVertexNormals();
              child.material = goldMaterial;
            }
          });

          // Centrar el model exactament a l'eix (0, 0, 0) dins d'un grup pivot per girar netament
          const box = new THREE.Box3().setFromObject(obj);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2.1 / (maxDim || 1);

          obj.scale.set(scale, scale, scale);
          obj.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

          const pivot = new THREE.Group();
          pivot.add(obj);
          trophy3DScene.add(pivot);
          trophy3DModel = pivot;

          // Esvaïr indicador de càrrega
          if (loadingEl) {
            loadingEl.style.opacity = '0';
            setTimeout(() => { if (loadingEl && loadingEl.parentNode) loadingEl.remove(); }, 400);
          }
          if (hintEl) hintEl.style.display = 'block';
          trophy3DInitialized = true;
        },
        (xhr) => {
          if (xhr.lengthComputable && loadingEl) {
            const pct = Math.round((xhr.loaded / xhr.total) * 100);
            const span = loadingEl.querySelector('span');
            if (span) span.textContent = `Carregant escultura 3D... ${pct}%`;
          }
        },
        (err) => {
          console.warn("No s'ha pogut carregar l'arxiu OBJ del trofeu:", err);
          if (loadingEl) {
            const span = loadingEl.querySelector('span');
            if (span) span.textContent = "Model 3D llest";
          }
        }
      );
    } catch (e) {
      console.warn("Error inicialitzant visor 3D Three.js:", e);
    }
  }

  // Pre-carregar en segon pla el model 3D per assegurar càrrega immediata
  setTimeout(() => {
    if (window.fetch) {
      fetch('trofeu_model/trofeu.obj', { cache: 'force-cache' }).catch(() => {});
    }
  }, 1500);

  // Clic a la insígnia sota el títol per obrir el trofeu a gran pantalla
  const trophyBadgeEl = document.getElementById('trophy-title-badge');
  if (trophyBadgeEl) {
    trophyBadgeEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentUser = window.db.getCurrentUser();
      const approvedPoints = window.db.getApprovedPoints();
      const totalPointsEl = document.getElementById('trophy-total-points');
      if (totalPointsEl) totalPointsEl.textContent = approvedPoints.length;
      const userNameEl = document.getElementById('trophy-user-name');
      if (userNameEl) userNameEl.textContent = (currentUser?.username || 'Pessebrista').replace(/^@+/, '');
      triggerVictoryConfetti();
      showModal('modal-trophy');
      initTrophy3D();
    });
  }

  const btnTrophyOk = document.getElementById('btn-trophy-ok');
  if (btnTrophyOk) {
    btnTrophyOk.addEventListener('click', () => {
      hideAllModals();
      showToast('🏆 Trofeu Oficial exhibit amb èxit sota el títol!');
    });
  }

  // 📜 GENERADOR DE DIPLOMA OFICIAL D'HONOR EN PDF D'ALTA DEFINICIÓ
  // 📜 GENERADOR DE DIPLOMA OFICIAL D'HONOR EN PDF D'ALTA DEFINICIÓ (CLUB EXCURSIONISTA BANDOLERS)
  window.downloadDiplomaPDF = async function() {
    const btn = document.getElementById('btn-download-diploma');
    const originalText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> Generant Diploma Oficial...';
    }
    showToast('📜 Preparant el teu Diploma Oficial de Màster Pessebrista...');

    try {
      const currentUser = window.db.getCurrentUser();
      const rawName = currentUser ? currentUser.username : 'Pessebrista d\'Honor';
      const cleanName = rawName.replace(/^@+/, '').trim() || 'Pessebrista d\'Honor';
      const approvedCount = window.db.getApprovedPoints().length || 19;

      const mesos = ['de gener', 'de febrer', 'de març', 'd\'abril', 'de maig', 'de juny', 'de juliol', 'd\'agost', 'de setembre', 'd\'octubre', 'de novembre', 'de desembre'];
      const avui = new Date();
      const dataText = `${avui.getDate()} ${mesos[avui.getMonth()]} de ${avui.getFullYear()}`;

      // Funció auxiliar per carregar imatges de forma asíncrona i segura
      function loadImage(src) {
        return new Promise((resolve) => {
          if (!src) return resolve(null);
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = src;
        });
      }

      // 1. OBTENIR LA CAPTURA DE LA COPA 3D SEMPRE DE CARA (ALTA DEFINICIÓ)
      let trophyImg = null;
      const activeModel = trophy3DModel || headerTrophyModel;
      const activeScene = trophy3DScene || headerTrophyScene;

      if (activeModel && activeScene && window.THREE) {
        try {
          const offRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
          offRenderer.setSize(900, 1400);
          offRenderer.setPixelRatio(2);
          if (THREE.sRGBEncoding) offRenderer.outputEncoding = THREE.sRGBEncoding;

          const offCamera = new THREE.PerspectiveCamera(38, 900 / 1400, 0.1, 100);
          offCamera.position.set(0, 0, 3.25);
          offCamera.lookAt(0, 0, 0);

          const prevRotY = activeModel.rotation.y;
          activeModel.rotation.set(0, 0, 0); // SEMPRE EXACTAMENT DE CARA!
          offRenderer.render(activeScene, offCamera);
          const dataUrl = offRenderer.domElement.toDataURL('image/png');
          activeModel.rotation.y = prevRotY;
          offRenderer.dispose();

          trophyImg = await loadImage(dataUrl);
        } catch (e) {
          console.warn("Error renderitzant trofeu 3D frontal:", e);
        }
      }

      // Si no s'ha pogut renderitzar en segon pla, intentar capturar del canvas actiu
      if (!trophyImg) {
        const trophyCanvas = document.querySelector('#trophy-3d-canvas-container canvas') || document.querySelector('#trophy-header-3d-container canvas');
        if (trophyCanvas) {
          try {
            trophyImg = await loadImage(trophyCanvas.toDataURL('image/png'));
          } catch (e) {}
        }
      }

      // Carregar el logotip oficial del Club Excursionista Bandolers
      const bandolersLogo = await loadImage(window.BANDOLERS_LOGO_BASE64 || 'logo_bandolers.png');

      // 2. CREACIÓ DEL CANVAS A4 HORITZONTAL D'ALTA DEFINICIÓ (2400 x 1700 px = ~300 DPI)
      const canvas = document.createElement('canvas');
      canvas.width = 2400;
      canvas.height = 1700;
      const ctx = canvas.getContext('2d');

      // A. FONS DE PERGAMÍ NOBLE AMB TEXTURA ARTESANAL DE PAPER
      const bgGrad = ctx.createRadialGradient(1500, 850, 150, 1200, 850, 1500);
      bgGrad.addColorStop(0, '#fefbf3');
      bgGrad.addColorStop(0.35, '#fbf4df');
      bgGrad.addColorStop(0.75, '#f4e7c7');
      bgGrad.addColorStop(1, '#e8d4a9');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 2400, 1700);

      // Generació de textura de fibres i gra de paper artesanal perquè no quedi gens "soso"
      const prng = (function() {
        let seed = 1234567;
        return function() {
          seed = (seed * 9301 + 49297) % 233280;
          return seed / 233280;
        };
      })();

      ctx.save();
      // Pigments microscòpics de textura de cotó
      for (let i = 0; i < 9500; i++) {
        const px = prng() * 2400;
        const py = prng() * 1700;
        const r = prng() * 1.5 + 0.5;
        const alpha = prng() * 0.045 + 0.015;
        ctx.fillStyle = prng() > 0.5 ? `rgba(130, 90, 35, ${alpha})` : `rgba(255, 255, 255, ${alpha * 1.6})`;
        ctx.fillRect(px, py, r, r);
      }
      // Fibres manuals subtils de pergamí
      for (let i = 0; i < 450; i++) {
        const fx = prng() * 2300 + 50;
        const fy = prng() * 1600 + 50;
        const fl = prng() * 26 + 6;
        const fa = prng() * Math.PI * 2;
        ctx.strokeStyle = `rgba(140, 95, 35, ${prng() * 0.035 + 0.01})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx + Math.cos(fa) * fl, fy + Math.sin(fa) * fl);
        ctx.stroke();
      }
      // Ombrejat de vinyeta envellida per les vores
      const edgeVignette = ctx.createRadialGradient(1200, 850, 950, 1200, 850, 1600);
      edgeVignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      edgeVignette.addColorStop(0.7, 'rgba(120, 75, 20, 0.05)');
      edgeVignette.addColorStop(1, 'rgba(80, 40, 10, 0.22)');
      ctx.fillStyle = edgeVignette;
      ctx.fillRect(0, 0, 2400, 1700);
      ctx.restore();

      // B. MARCS ORNAMENTALS I CANTONADES NOBLES
      // Marc exterior vermell granat / bordeaux
      ctx.lineWidth = 26;
      ctx.strokeStyle = '#5a120c';
      ctx.strokeRect(34, 34, 2332, 1632);

      // Marc interior daurat or polit
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#d4af37';
      ctx.strokeRect(58, 58, 2284, 1584);

      // Filigrana fina interior
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#8f670e';
      ctx.strokeRect(74, 74, 2252, 1552);

      // Cantonades ornamentals daurades
      function drawCornerOrnament(x, y, flipX, flipY) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(flipX, flipY);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(10, 50);
        ctx.lineTo(10, 10);
        ctx.lineTo(50, 10);
        ctx.stroke();

        ctx.fillStyle = '#b38b1b';
        ctx.beginPath();
        ctx.arc(20, 20, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#b38b1b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(35, 35, 12, Math.PI, 1.5 * Math.PI);
        ctx.stroke();
        ctx.restore();
      }
      drawCornerOrnament(84, 84, 1, 1);
      drawCornerOrnament(2316, 84, -1, 1);
      drawCornerOrnament(84, 1616, 1, -1);
      drawCornerOrnament(2316, 1616, -1, -1);

      // C. COLUMNA DIVISÒRIA DAURADA ENTRE LATERAL ESQUERRE I DRET
      ctx.save();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#d4af37';
      ctx.beginPath();
      ctx.moveTo(820, 120);
      ctx.lineTo(820, 1580);
      ctx.stroke();

      ctx.lineWidth = 1;
      ctx.strokeStyle = '#8f670e';
      ctx.beginPath();
      ctx.moveTo(828, 140);
      ctx.lineTo(828, 1560);
      ctx.stroke();

      [120, 1580].forEach(y => {
        ctx.fillStyle = '#7a1a12';
        ctx.beginPath();
        ctx.arc(820, y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
      ctx.restore();

      // =========================================================================
      // D. LATERAL ESQUERRE: LA COPA SEMPRE DE CARA SUPER GROSSA OCUPANT TOT L'ALT
      // =========================================================================
      const leftCenterX = 450;

      // Aura daurada radiant i celestial de fons
      ctx.save();
      const aura = ctx.createRadialGradient(leftCenterX, 750, 50, leftCenterX, 750, 420);
      aura.addColorStop(0, 'rgba(255, 235, 140, 0.65)');
      aura.addColorStop(0.35, 'rgba(235, 190, 60, 0.35)');
      aura.addColorStop(0.75, 'rgba(212, 175, 55, 0.12)');
      aura.addColorStop(1, 'rgba(212, 175, 55, 0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(leftCenterX, 750, 420, 0, Math.PI * 2);
      ctx.fill();

      // Raigs de llum daurada estil gravat
      ctx.strokeStyle = 'rgba(255, 225, 100, 0.18)';
      ctx.lineWidth = 2;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 16) {
        ctx.beginPath();
        ctx.moveTo(leftCenterX + Math.cos(a) * 80, 750 + Math.sin(a) * 80);
        ctx.lineTo(leftCenterX + Math.cos(a) * 390, 750 + Math.sin(a) * 390);
        ctx.stroke();
      }
      ctx.restore();

      // Dibuixar la copa 3D frontal super grossa
      if (trophyImg) {
        const targetTh = 1150; // Ocupa pràcticament tot l'alt del full
        const targetTw = Math.round((trophyImg.width / (trophyImg.height || 1)) * targetTh);
        ctx.drawImage(trophyImg, leftCenterX - targetTw / 2, 120, targetTw, targetTh);
      } else {
        ctx.font = '340px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏆', leftCenterX, 850);
      }

      // Placa noble daurada sota el trofeu
      ctx.save();
      const plX = 140;
      const plY = 1380;
      const plW = 620;
      const plH = 130;
      const plGrad = ctx.createLinearGradient(plX, plY, plX + plW, plY + plH);
      plGrad.addColorStop(0, '#7a1a12');
      plGrad.addColorStop(0.5, '#992218');
      plGrad.addColorStop(1, '#5a120c');
      ctx.fillStyle = plGrad;
      ctx.fillRect(plX, plY, plW, plH);

      ctx.lineWidth = 4;
      ctx.strokeStyle = '#d4af37';
      ctx.strokeRect(plX, plY, plW, plH);

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#fff0a0';
      ctx.strokeRect(plX + 6, plY + 6, plW - 12, plH - 12);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff4c8';
      ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.letterSpacing = '3px';
      ctx.fillText('★ ESCULTURA OFICIAL 2026 ★', leftCenterX, plY + 45);

      ctx.font = '800 20px Georgia, serif';
      ctx.fillStyle = '#d4af37';
      ctx.fillText('MÀSTER PESSEBRISTA DE SANT FELIU', leftCenterX, plY + 80);

      ctx.font = '600 15px -apple-system, sans-serif';
      ctx.fillStyle = '#e8d4a9';
      ctx.fillText('TROFEU EN METALL DAURAT 3D', leftCenterX, plY + 107);
      ctx.restore();

      // =========================================================================
      // E. LATERAL DRET: DIPLOMA, TEXTOS INSTITUCIONALS I SEGELL DELS BANDOLERS
      // =========================================================================
      const rightCenterX = 1590;

      // 1. Logotip del Club Excursionista Bandolers a la capçalera
      if (bandolersLogo) {
        const logoW = 220;
        const logoH = Math.round((bandolersLogo.height / (bandolersLogo.width || 1)) * logoW);
        ctx.drawImage(bandolersLogo, rightCenterX - logoW / 2, 105, logoW, logoH);
      }

      // 2. Capçalera del Club Excursionista Bandolers
      ctx.textAlign = 'center';
      ctx.font = '900 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#6b140d';
      ctx.letterSpacing = '4px';
      ctx.fillText('CLUB EXCURSIONISTA BANDOLERS', rightCenterX, 280);

      ctx.font = '700 21px Georgia, serif';
      ctx.fillStyle = '#8f670e';
      ctx.letterSpacing = '3px';
      ctx.fillText('SANT FELIU SASSERRA · RUTA DELS PESSEBRES', rightCenterX, 315);

      // Divisor daurat sota la capçalera
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(1020, 340);
      ctx.lineTo(2160, 340);
      ctx.stroke();

      // Diamant central
      ctx.fillStyle = '#7a1a12';
      ctx.beginPath();
      ctx.moveTo(rightCenterX, 332);
      ctx.lineTo(rightCenterX + 10, 340);
      ctx.lineTo(rightCenterX, 348);
      ctx.lineTo(rightCenterX - 10, 340);
      ctx.closePath();
      ctx.fill();

      // 3. Títol principal del Diploma
      ctx.font = '900 88px "Bodoni Moda", "Playfair Display", Georgia, serif';
      ctx.fillStyle = '#7a1a12';
      ctx.shadowColor = 'rgba(212, 175, 55, 0.45)';
      ctx.shadowBlur = 12;
      ctx.fillText('DIPLOMA D\'HONOR', rightCenterX, 450);
      ctx.shadowBlur = 0;

      ctx.font = '800 38px "Bodoni Moda", "Playfair Display", Georgia, serif';
      ctx.fillStyle = '#b38b1b';
      ctx.fillText('MÀSTER PESSEBRISTA · EDICIÓ OFICIAL 2026', rightCenterX, 515);

      // Estrelles daurades
      ctx.font = '32px sans-serif';
      ctx.fillStyle = '#d4af37';
      ctx.fillText('★   ★   ★   ★   ★', rightCenterX, 565);

      // 4. Presentació
      ctx.font = 'italic 30px Georgia, serif';
      ctx.fillStyle = '#5c3f0c';
      ctx.fillText('Per la present es certifica oficialment amb el màxim mèrit i reconeixement a:', rightCenterX, 635);

      // 5. Nom del participant destacat
      ctx.font = '900 88px "Bodoni Moda", "Playfair Display", Georgia, serif';
      ctx.fillStyle = '#221105';
      ctx.fillText(cleanName, rightCenterX, 740);

      // Subratllat d'honor
      const nameWidth = Math.min(ctx.measureText(cleanName).width + 80, 1100);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#d4af37';
      ctx.beginPath();
      ctx.moveTo(rightCenterX - nameWidth / 2, 765);
      ctx.lineTo(rightCenterX + nameWidth / 2, 765);
      ctx.stroke();

      ctx.fillStyle = '#7a1a12';
      ctx.beginPath();
      ctx.arc(rightCenterX, 765, 6, 0, Math.PI * 2);
      ctx.fill();

      // 6. Text oficial d'assoliment amb data d'avui i nombre de pessebres
      ctx.font = '400 28px Georgia, serif';
      ctx.fillStyle = '#3a2610';
      ctx.fillText(`Per haver completat amb èxit i constància a data de ${dataText}`, rightCenterX, 840);
      ctx.fillText(`la totalitat dels ${approvedCount} pessebres que configuren la Ruta dels Pessebres de Sant Feliu Sasserra,`, rightCenterX, 888);
      ctx.fillText(`demostrant una exemplar passió per la muntanya, compromís amb la nostra terra`, rightCenterX, 936);
      ctx.fillText(`i la preservació de la tradició viva pessebrista del Club Excursionista Bandolers.`, rightCenterX, 984);

      // 7. Data d'expedició i codi de verificació (a la part inferior esquerra del bloc dret)
      ctx.textAlign = 'left';
      ctx.fillStyle = '#4a3215';
      ctx.font = '700 24px Georgia, serif';
      ctx.fillText(`Data d'expedició: ${dataText}`, 920, 1140);

      ctx.font = '400 20px monospace';
      ctx.fillStyle = '#7a5a30';
      const hash = Math.abs(cleanName.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(16).toUpperCase().padStart(8, '0');
      ctx.fillText(`Codi oficial de registre: SFS-BANDOLERS-2026-${hash}`, 920, 1180);

      // Signatura oficial
      ctx.textAlign = 'center';
      ctx.font = 'italic 34px "Brush Script MT", "Playfair Display", cursive, serif';
      ctx.fillStyle = '#301807';
      ctx.fillText('Club Excursionista Bandolers', 1230, 1330);
      ctx.strokeStyle = '#8f670e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(1010, 1345);
      ctx.lineTo(1450, 1345);
      ctx.stroke();
      ctx.font = '700 18px -apple-system, sans-serif';
      ctx.fillStyle = '#6b4923';
      ctx.fillText('COMISSIÓ ORGANITZADORA DE LA RUTA', 1230, 1375);
      ctx.font = '600 15px -apple-system, sans-serif';
      ctx.fillStyle = '#8f670e';
      ctx.fillText('SANT FELIU SASSERRA', 1230, 1400);

      // =========================================================================
      // F. EL NOU SEGELL OFICIAL DAURAT I EMBLEMA DELS BANDOLERS (MOLT MÉS MACO)
      // =========================================================================
      const sealX = 1980;
      const sealY = 1300;
      const sealR = 145;

      // 1. Cintes de seda vermella que pengen sota el segell
      ctx.save();
      ctx.fillStyle = '#7a1a12';
      // Cinta esquerra
      ctx.beginPath();
      ctx.moveTo(sealX - 55, sealY + 80);
      ctx.lineTo(sealX - 85, sealY + 230);
      ctx.lineTo(sealX - 45, sealY + 205);
      ctx.lineTo(sealX - 10, sealY + 230);
      ctx.lineTo(sealX - 20, sealY + 95);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Cinta dreta
      ctx.beginPath();
      ctx.moveTo(sealX + 20, sealY + 95);
      ctx.lineTo(sealX + 10, sealY + 230);
      ctx.lineTo(sealX + 45, sealY + 205);
      ctx.lineTo(sealX + 85, sealY + 230);
      ctx.lineTo(sealX + 55, sealY + 80);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // 2. Medalló exterior daurat amb 36 puntes festonades
      ctx.save();
      ctx.beginPath();
      const points = 36;
      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points;
        const r = i % 2 === 0 ? sealR + 10 : sealR;
        const px = sealX + Math.cos(angle) * r;
        const py = sealY + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      const outerSealGrad = ctx.createRadialGradient(sealX - 30, sealY - 30, 20, sealX, sealY, sealR + 10);
      outerSealGrad.addColorStop(0, '#fff6c8');
      outerSealGrad.addColorStop(0.4, '#e6be44');
      outerSealGrad.addColorStop(0.8, '#b88618');
      outerSealGrad.addColorStop(1, '#664c13');
      ctx.fillStyle = outerSealGrad;
      ctx.shadowColor = 'rgba(60, 30, 10, 0.4)';
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;

      // 3. Disc interior daurat
      const innerSealGrad = ctx.createRadialGradient(sealX - 25, sealY - 25, 10, sealX, sealY, sealR - 15);
      innerSealGrad.addColorStop(0, '#fffde6');
      innerSealGrad.addColorStop(0.5, '#e4ba39');
      innerSealGrad.addColorStop(0.85, '#a67c1e');
      innerSealGrad.addColorStop(1, '#5a400e');
      ctx.fillStyle = innerSealGrad;
      ctx.beginPath();
      ctx.arc(sealX, sealY, sealR - 15, 0, Math.PI * 2);
      ctx.fill();

      // Anells concèntrics decoratius
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#fff8b0';
      ctx.stroke();

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#4a360c';
      ctx.beginPath();
      ctx.arc(sealX, sealY, sealR - 32, 0, Math.PI * 2);
      ctx.stroke();

      // 4. Emblema del Club Bandolers al cor del segell
      if (bandolersLogo) {
        const logoW = 145;
        const logoH = Math.round((bandolersLogo.height / (bandolersLogo.width || 1)) * logoW);
        ctx.drawImage(bandolersLogo, sealX - logoW / 2, sealY - 60, logoW, logoH);
      }

      // 5. Gravat del segell
      ctx.textAlign = 'center';
      ctx.fillStyle = '#3a2807';
      ctx.font = '900 13px -apple-system, sans-serif';
      ctx.letterSpacing = '1px';
      ctx.fillText('★ CLUB EXCURSIONISTA ★', sealX, sealY - 95);
      ctx.font = '900 14px -apple-system, sans-serif';
      ctx.fillText('BANDOLERS', sealX, sealY - 79);

      ctx.font = '900 30px "Bodoni Moda", serif';
      ctx.fillStyle = '#2d1c03';
      ctx.fillText('2026', sealX, sealY + 54);

      ctx.font = '800 13px -apple-system, sans-serif';
      ctx.fillStyle = '#4a360c';
      ctx.fillText('MÀSTER PESSEBRISTA', sealX, sealY + 76);

      ctx.font = '700 11px -apple-system, sans-serif';
      ctx.fillStyle = '#6b4923';
      ctx.fillText('SEGELL D\'HONOR OFICIAL', sealX, sealY + 94);
      ctx.restore();

      // 8. DESCARREGA DEL FITXER PDF EN ALTA QUALITAT
      const safeFilename = `Diploma_Master_Pessebrista_Bandolers_${cleanName.replace(/[^a-zA-Z0-9_-]/g, '_')}_2026`;

      if (window.jspdf && window.jspdf.jsPDF) {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
        const imgData = canvas.toDataURL('image/jpeg', 0.96);
        pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210);
        pdf.save(`${safeFilename}.pdf`);
        showToast('📜 Diploma Oficial en PDF descarregat amb èxit!');
      } else {
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${safeFilename}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast('📜 Diploma Oficial descarregat com a imatge!');
        });
      }
    } catch (err) {
      console.error('Error generant el diploma PDF:', err);
      showToast('❌ Error generant el diploma: ' + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }
  };

  const btnDownloadDiploma = document.getElementById('btn-download-diploma');
  if (btnDownloadDiploma) {
    btnDownloadDiploma.addEventListener('click', () => {
      window.downloadDiplomaPDF();
    });
  }

  // 5. GESTIÓ DE MODALS
  function showModal(modalId) {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    const target = document.getElementById(modalId);
    if (target) {
      target.classList.add('active');
      if (modalId === 'modal-trophy' && typeof startTrophyModalLoop === 'function') {
        startTrophyModalLoop();
      }
    }
  }

  function hideAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    if (trophy3DAnimId) {
      cancelAnimationFrame(trophy3DAnimId);
      trophy3DAnimId = null;
    }
  }

  // Pausar o reprendre bucles quan la pestanya es minimitza o torna a primer pla
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      if (victoryEffectsRunning && !victoryEffectsAnimId) {
        startContinuousVictoryEffects();
      }
      const badge = document.getElementById('trophy-title-badge');
      if (badge && badge.style.display !== 'none' && !headerTrophyAnimId) {
        startHeaderTrophyLoop();
      }
      const modalEl = document.getElementById('modal-trophy');
      if (modalEl && modalEl.classList.contains('active') && !trophy3DAnimId) {
        startTrophyModalLoop();
      }
    }
  });

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
              const ballsStr = v.rating ? '🔴'.repeat(Number(v.rating)) : '';
              li.innerHTML = `
                <div>
                  <strong>🎄 ${escapeHTML(pt.name)}</strong>
                  ${ballsStr ? `<div style="font-size:0.75rem; margin-top:2px;">${ballsStr}</div>` : ''}
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

  let currentAuthMode = 'register';

  function setAuthMode(mode) {
    currentAuthMode = mode;
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
        const res = await window.db.loginOrRegisterDirect(u, p, currentAuthMode);
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

  // 10. PANEL D'ADMINISTRACIÓ (ACCEPTAR / REBUTJAR / EDITAR / ELIMINAR / USUARIS)
  const btnOpenAdmin = document.getElementById('btn-open-admin');
  const adminTabPending = document.getElementById('admin-tab-pending');
  const adminTabApproved = document.getElementById('admin-tab-approved');
  const adminTabUsers = document.getElementById('admin-tab-users');
  const adminViewPending = document.getElementById('admin-view-pending');
  const adminViewApproved = document.getElementById('admin-view-approved');
  const adminViewUsers = document.getElementById('admin-view-users');

  btnOpenAdmin.addEventListener('click', () => {
    renderAdminPanel();
    showModal('modal-admin');
  });

  adminTabPending.addEventListener('click', () => {
    adminTabPending.classList.add('active');
    adminTabApproved.classList.remove('active');
    if (adminTabUsers) adminTabUsers.classList.remove('active');
    adminViewPending.style.display = 'block';
    adminViewApproved.style.display = 'none';
    if (adminViewUsers) adminViewUsers.style.display = 'none';
  });

  adminTabApproved.addEventListener('click', () => {
    adminTabApproved.classList.add('active');
    adminTabPending.classList.remove('active');
    if (adminTabUsers) adminTabUsers.classList.remove('active');
    adminViewApproved.style.display = 'block';
    adminViewPending.style.display = 'none';
    if (adminViewUsers) adminViewUsers.style.display = 'none';
  });

  if (adminTabUsers) {
    adminTabUsers.addEventListener('click', () => {
      adminTabUsers.classList.add('active');
      adminTabPending.classList.remove('active');
      adminTabApproved.classList.remove('active');
      if (adminViewUsers) adminViewUsers.style.display = 'block';
      adminViewPending.style.display = 'none';
      adminViewApproved.style.display = 'none';
    });
  }

  function renderAdminPanel() {
    const pendingPoints = window.db.getPendingPoints();
    const allPoints = window.db.getPoints();
    const allUsers = window.db.getUsers().filter(u => u.role !== 'ADMIN' && u.username.toLowerCase() !== 'admin');

    document.getElementById('count-pending').textContent = pendingPoints.length;
    document.getElementById('count-all').textContent = allPoints.length;
    const countUsersEl = document.getElementById('count-users');
    if (countUsersEl) countUsersEl.textContent = allUsers.length;

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
            👤 Per @${escapeHTML(pt.submitted_by)} | 📅 ${new Date(pt.created_at).toLocaleDateString()}
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

      const rStats = window.db.getPointRatingStats(pt.id);
      const rBadge = rStats.count > 0 ? ` | 🔴 <strong>${rStats.average}</strong>/5 (${rStats.count})` : '';

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div class="admin-proposal-title">🎄 ${escapeHTML(pt.name)}</div>
          <div>${statusBadge}</div>
        </div>
        <div class="admin-proposal-meta">
          👤 @${escapeHTML(pt.submitted_by)}${rBadge}
        </div>
        <div class="admin-actions">
          <button class="btn-edit" onclick="adminOpenEditModal('${pt.id}')">✏️ EDITAR</button>
          <button class="btn-delete" onclick="adminDeletePoint('${pt.id}')">🗑️ ELIMINAR</button>
        </div>
      `;
      approvedContainer.appendChild(card);
    });

    // Render Usuaris Registrats
    const usersContainer = document.getElementById('admin-users-container');
    if (usersContainer) {
      usersContainer.innerHTML = '';
      if (allUsers.length === 0) {
        usersContainer.innerHTML = `<p style="color:var(--text-muted); font-size:0.9rem; padding:12px 0;">Encara no hi ha cap participant registrat.</p>`;
      } else {
        allUsers.forEach(u => {
          const userVisitsCount = window.db.getUserVisits(u.id).length;
          const dateStr = u.created_at ? new Date(u.created_at).toLocaleDateString() : '-';
          const card = document.createElement('div');
          card.className = 'admin-proposal-card';
          card.style.display = 'flex';
          card.style.justifyContent = 'space-between';
          card.style.alignItems = 'center';
          card.style.gap = '12px';
          card.innerHTML = `
            <div>
              <div class="admin-proposal-title">🎅 ${escapeHTML(u.username)}</div>
              <div class="admin-proposal-meta" style="margin-bottom:0;">
                🎄 <strong>${userVisitsCount}</strong> pessebres visitats | 📅 Registrat: ${dateStr}
              </div>
            </div>
            <button class="btn-reject" onclick="adminDeleteUser('${u.id}', '${escapeHTML(u.username).replace(/'/g, "\\'")}')">🗑️ ESBORRAR</button>
          `;
          usersContainer.appendChild(card);
        });
      }
    }
  }

  // ACCIONS ADMIN
  window.adminApprovePoint = function(id) {
    window.db.updatePointStatus(id, 'APPROVED');
    showToast('✅ Pessebre acceptat! Ara apareix al mapa públic.');
    renderApprovedMarkers(true);
    renderAdminPanel();
  };

  window.adminRejectPoint = function(id) {
    window.db.updatePointStatus(id, 'REJECTED');
    showToast('❌ Pessebre rebutjat.');
    renderApprovedMarkers(true);
    renderAdminPanel();
  };

  window.adminDeletePoint = async function(id) {
    const pt = window.db.getPointById(id);
    const name = pt ? pt.name : 'aquest pessebre';
    if (confirm(`Estàs segur que vols eliminar definitivament el pessebre "${name}"?`)) {
      try {
        await window.db.deletePoint(id);
        showToast('🗑️ Pessebre eliminat definitivament.');
        if (map) map.closePopup();
        renderApprovedMarkers(true);
        renderAdminPanel();
        renderRankingTable();
        updateTopStats();
      } catch (err) {
        showToast('⚠️ Error eliminant el pessebre: ' + err.message);
      }
    }
  };

  window.adminDeleteUser = async function(userId, username) {
    if (confirm(`Estàs segur que vols esborrar l'usuari "${username}" i totes les seves visites i valoracions?`)) {
      await window.db.deleteUser(userId);
      showToast(`🗑️ Usuari "${username}" eliminat correctament.`);
      renderApprovedMarkers(true);
      renderAdminPanel();
      renderRankingTable();
      updateTopStats();
      renderUserProfile();
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
    renderApprovedMarkers(true);
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
    const reserved = 24 + 70 + (header ? header.offsetHeight + 12 : 0) + (pdfBtn ? pdfBtn.offsetHeight + 12 : 0);
    const avail = window.innerHeight - reserved;
    if (ul.scrollHeight <= avail) return;

    ul.classList.add('is-multicol');
    ul.style.gridTemplateRows = `repeat(${Math.ceil(ul.children.length / 2)}, auto)`;
    for (let fs = 15; fs >= 8; fs -= 0.5) {
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

