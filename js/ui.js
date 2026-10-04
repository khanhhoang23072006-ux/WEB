// ============================================================
// ui.js - UI Rendering & Components (GAMING/ANIME Edition)
// ============================================================

const UI = (() => {
  const getApp = () => document.getElementById('app');

  // ── Helpers ─────────────────────────────────────────────────

  function _esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function _formatDate(isoOrDate) {
    if (!isoOrDate) return '';
    try {
      const d = new Date(isoOrDate);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return isoOrDate;
    }
  }

  function _formatLabel(format) {
    const labels = {
      single_elimination: '⚡ Loại trực tiếp',
      round_robin: '🔄 Vòng tròn',
      group_stage: '📋 Chia bảng'
    };
    return labels[format] || format;
  }

  function _statusLabel(status) {
    const labels = {
      draft: '📝 Chuẩn bị',
      in_progress: '🔥 LIVE',
      completed: '🏆 Hoàn thành'
    };
    return labels[status] || status;
  }

  function _statusClass(status) {
    const classes = { draft: 'badge-draft', in_progress: 'badge-active', completed: 'badge-completed' };
    return classes[status] || 'badge-draft';
  }

  function _getTeamById(tournament, teamId) {
    return tournament.teams.find(t => t.id === teamId);
  }

  function _roundName(round, totalRounds) {
    if (round === totalRounds) return '🏆 GRAND FINAL';
    if (round === totalRounds - 1 && totalRounds > 2) return '⚔️ SEMI FINAL';
    if (round === totalRounds - 2 && totalRounds > 3) return '🗡️ TỨ KẾT';
    return `VÒNG ${round}`;
  }

  // ── Dashboard ───────────────────────────────────────────────

  // Trạng thái filter/sort/search
  let _filterStatus = 'all';
  let _sortBy = 'newest';
  let _searchQuery = '';
  let _themeEditorState = {};
  let _activeThemeTarget = 'main';

  function renderDashboard() {
    const all = Storage.getAll();
    const active    = all.filter(t => t.status === 'in_progress').length;
    const completed = all.filter(t => t.status === 'completed').length;
    const draft     = all.filter(t => t.status === 'draft').length;
    
    const isSearch = window.location.hash === '#/search';
    let html = '<div class="dashboard animate-in">';

    if (isSearch) {
      html += `
        <div class="dashboard-header">
          <div>
            <h1>🔍 TÌM KIẾM</h1>
            <p>Khám phá các giải đấu trong hệ thống</p>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="search-bar">
          <span class="search-bar-icon"><svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>
          <input type="text" id="search-input" placeholder="🔍 Tìm kiếm giải đấu..." value="${_esc(_searchQuery)}"
            oninput="UI._handleSearch(this.value)">
        </div>

        <!-- Filter + Sort -->
        <div class="filter-row">
          <button class="btn ${_filterStatus==='all'?'btn-blue':'btn-grey'}" onclick="UI._setFilter('all')" style="padding: 0.4rem 0.8rem; font-size: 1rem;">🎮 Tất cả (${all.length})</button>
          <button class="btn ${_filterStatus==='in_progress'?'btn-red':'btn-grey'}" onclick="UI._setFilter('in_progress')" style="padding: 0.4rem 0.8rem; font-size: 1rem;">🔥 Live (${active})</button>
          <button class="btn ${_filterStatus==='completed'?'btn-yellow':'btn-grey'}" onclick="UI._setFilter('completed')" style="padding: 0.4rem 0.8rem; font-size: 1rem;">🏆 Xong (${completed})</button>
          <button class="btn ${_filterStatus==='draft'?'btn-green':'btn-grey'}" onclick="UI._setFilter('draft')" style="padding: 0.4rem 0.8rem; font-size: 1rem;">📝 Chuẩn bị (${draft})</button>
          
          <div class="btn btn-primary" style="padding: 0; margin-left: auto; position: relative;">
            <select onchange="UI._setSort(this.value)" style="background: transparent; border: none; padding: 0.4rem 0.8rem; font-size: 1rem; color: white; font-family: var(--font-header); font-weight: 800; outline: none; cursor: pointer; text-transform: uppercase;">
              <option style="background: #1a1a2e;" value="newest"  ${_sortBy==='newest'?'selected':''}>🕐 Mới nhất</option>
              <option style="background: #1a1a2e;" value="oldest"  ${_sortBy==='oldest'?'selected':''}>🕰️ Cũ nhất</option>
              <option style="background: #1a1a2e;" value="name"    ${_sortBy==='name'?'selected':''}>🔤 Tên A-Z</option>
              <option style="background: #1a1a2e;" value="teams"   ${_sortBy==='teams'?'selected':''}>⚔️ Nhiều đội</option>
            </select>
          </div>
        </div>

        <!-- Tournament List -->
        <div id="tournament-list-container">
          ${_renderTournamentList(all)}
        </div>
      `;
    } else {
      const recent = [...all].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);
      html += `
        <div class="dashboard-header">
          <div>
            <h1>⚔️ CHIẾN TRƯỜNG</h1>
            <p>Chinh phục mọi giải đấu · Trở thành huyền thoại</p>
          </div>
          <a href="#/create" class="btn btn-green text-3d-title" style="padding: 1.2rem 3rem;">TẠO GIẢI ĐẤU</a>
        </div>

        <div class="stats-grid-wrapper" style="position: relative;">
          <div style="position: absolute; right: 0; top: -30px;">
            <button class="btn btn-sm btn-icon" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #fff; padding: 4px 8px; font-size: 0.8rem; cursor: pointer;" onclick="UI._cycleStatEffect()" title="Đổi hiệu ứng chữ">✨ Đổi Effect</button>
          </div>
          <div class="stats-grid">
            <div class="stat-card stat-card--blue">
              <div class="stat-icon sticker-icon">🎮</div>
              <span class="stat-value">${all.length}</span>
              <span class="stat-label">Giải đấu</span>
            </div>
            <div class="stat-card stat-card--orange">
              <div class="stat-icon sticker-icon">🔥</div>
              <span class="stat-value">${active}</span>
              <span class="stat-label">Đang Live</span>
            </div>
            <div class="stat-card stat-card--yellow">
              <div class="stat-icon sticker-icon">🏆</div>
              <span class="stat-value">${completed}</span>
              <span class="stat-label">Hoàn thành</span>
            </div>
            <div class="stat-card stat-card--red">
              <div class="stat-icon sticker-icon">⚔️</div>
              <span class="stat-value">${all.reduce((s, t) => s + t.teams.length, 0)}</span>
              <span class="stat-label">Đội tham chiến</span>
            </div>
          </div>
        </div>

        <div class="section-header" style="margin-top: 2.5rem; margin-bottom: 1.5rem;">
          <h2 class="section-title">🕒 GIẢI ĐẤU GẦN ĐÂY</h2>
          <a href="#/search" class="btn btn-secondary btn-sm" style="font-size: 1rem; padding: 0.4rem 0.8rem; border-radius: 6px;">Xem tất cả &rarr;</a>
        </div>
        
        ${recent.length > 0 ? `
          <div class="tournament-grid">
            ${recent.map(t => _renderTournamentCard(t)).join('')}
          </div>
        ` : `
          <div class="empty-state">
            <div class="empty-state-icon">🏟️</div>
            <h3>Chưa có giải đấu nào</h3>
            <p>Hãy tạo giải đấu đầu tiên và bắt đầu cuộc chiến!</p>
            <a href="#/create" class="btn btn-green btn-lg">⚡ KHAI MỞ GIẢI ĐẤU</a>
          </div>
        `}
      `;
    }

    html += '</div>';
    getApp().innerHTML = html;
  }

  function _renderTournamentList(all) {
    let list = [...all];

    // Filter by status
    if (_filterStatus !== 'all') list = list.filter(t => t.status === _filterStatus);

    // Filter by search
    if (_searchQuery.trim()) {
      const q = _searchQuery.trim().toLowerCase();
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        (t.sport || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
      );
    }

    // Sort
    switch (_sortBy) {
      case 'oldest': list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
      case 'name':   list.sort((a, b) => a.name.localeCompare(b.name, 'vi')); break;
      case 'teams':  list.sort((a, b) => b.teams.length - a.teams.length); break;
      default:       list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    if (list.length === 0) {
      return _searchQuery || _filterStatus !== 'all' ? `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <h3>Không tìm thấy</h3>
          <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          <button class="btn btn-secondary" onclick="UI._clearFilters()">↩️ Xóa bộ lọc</button>
        </div>
      ` : `
        <div class="empty-state">
          <div class="empty-state-icon">🏟️</div>
          <h3>Chưa có giải đấu nào</h3>
          <p>Hãy tạo giải đấu đầu tiên và bắt đầu cuộc chiến!</p>
          <a href="#/create" class="btn btn-green btn-lg">⚡ KHAI MỞ GIẢI ĐẤU</a>
        </div>
      `;
    }

    return `
      <div class="section-header">
        <h2 class="section-title">📋 ${list.length} giải đấu</h2>
      </div>
      <div class="tournament-grid">
        ${list.map(t => _renderTournamentCard(t)).join('')}
      </div>
    `;
  }

  function _handleSearch(val) {
    _searchQuery = val;
    const all = Storage.getAll();
    const container = document.getElementById('tournament-list-container');
    if (container) container.innerHTML = _renderTournamentList(all);
  }

  function _setFilter(status) {
    _filterStatus = status;
    renderDashboard();
    // Restore search focus
    setTimeout(() => { const el = document.getElementById('search-input'); if (el) el.focus(); }, 50);
  }

  function _setSort(val) {
    _sortBy = val;
    const all = Storage.getAll();
    const container = document.getElementById('tournament-list-container');
    if (container) container.innerHTML = _renderTournamentList(all);
  }

  function _clearFilters() {
    _filterStatus = 'all';
    _searchQuery = '';
    _sortBy = 'newest';
    renderDashboard();
  }

  function _renderTournamentCard(t) {
    const champion = t.champion ? _getTeamById(t, t.champion) : null;
    const totalMatches = t.matches ? t.matches.filter(m => m.status !== 'bye').length : 0;
    const doneMatches  = t.matches ? t.matches.filter(m => m.status === 'completed').length : 0;
    const pct = totalMatches > 0 ? Math.round((doneMatches / totalMatches) * 100) : 0;
    const isDone = t.status === 'completed';

    const stars = isDone ? 3 : pct >= 50 ? 2 : pct > 0 ? 1 : 0;
    const starsHtml = t.status !== 'draft' ? `
      <div class="stars-row">
        ${'★★★'.split('').map((_, i) => `<span class="star ${i < stars ? '' : 'empty'}">⭐</span>`).join('')}
      </div>
    ` : '';

    return `
      <div class="tournament-card" onclick="App.navigate('#/tournament/${t.id}')">
        <div class="tournament-card-header">
          <div>
            <div class="tournament-card-name">${_esc(t.name)}</div>
            ${t.sport ? `<div class="tournament-card-sport">${_esc(t.sport)}</div>` : ''}
          </div>
        </div>
        ${t.description ? `<p style="font-size:0.85rem;color:var(--text-muted);margin-top:0.35rem">${_esc(t.description)}</p>` : ''}
        <div class="tournament-card-meta">
          <span class="badge badge-format">${_formatLabel(t.format)}</span>
          <span class="badge ${_statusClass(t.status)}">${_statusLabel(t.status)}</span>
          <span class="badge badge-team-count">⚔️ ${t.teams.length} đội</span>
        </div>
        ${champion ? `
          <div style="margin-top:0.5rem;font-size:0.9rem;color:var(--neon-yellow)">
            🏆 Champion: <strong>${_esc(champion.emoji)} ${_esc(champion.name)}</strong>
          </div>
        ` : ''}
        ${starsHtml}
        ${t.status !== 'draft' && totalMatches > 0 ? `
          <div class="tc-progress-wrap">
            <div class="tc-progress-label">
              <span>Tiến độ</span>
              <span>${doneMatches}/${totalMatches} trận</span>
            </div>
            <div class="tc-progress-bar">
              <div class="tc-progress-fill ${isDone ? 'done' : ''}" style="width:${pct}%"></div>
            </div>
          </div>
        ` : ''}
        <div class="tournament-card-footer">
          <span class="tournament-card-date">${t.startDate ? '📅 ' + _formatDate(t.startDate) : '📅 ' + _formatDate(t.createdAt)}</span>
        </div>
      </div>
    `;
  }




  // ── Admin Theme Manager ──────────────────────────────────────
  function renderAdminTheme() {
    const t = ThemeManager.getTheme();
    _themeEditorState = JSON.parse(JSON.stringify(t));
    _activeThemeTarget = 'main';

    const sw = _themeEditorState.strokeWidth || '1px';
    const sc = _themeEditorState.strokeColor || '#141634';
    const sx = _themeEditorState.shadowX || '2px';
    const sy = _themeEditorState.shadowY || '3px';
    const sb = _themeEditorState.shadowBlur || '0px';
    const shc = _themeEditorState.shadowColor || '#141634';
    
    const h3SW = _themeEditorState.h3StrokeWidth || sw;
    const h3SC = _themeEditorState.h3StrokeColor || sc;
    const h3SX = _themeEditorState.h3ShadowX || sx;
    const h3SY = _themeEditorState.h3ShadowY || sy;
    const h3SB = _themeEditorState.h3ShadowBlur || sb;
    const h3SHC = _themeEditorState.h3ShadowColor || shc;
    
    const bodySW = _themeEditorState.bodyStrokeWidth || '0px';
    const bodySC = _themeEditorState.bodyStrokeColor || 'transparent';
    const bodySX = _themeEditorState.bodyShadowX || '0px';
    const bodySY = _themeEditorState.bodyShadowY || '0px';
    const bodySB = _themeEditorState.bodyShadowBlur || '0px';
    const bodySHC = _themeEditorState.bodyShadowColor || 'transparent';

    getApp().innerHTML = `
      <div class="create-overlay" onclick="if(event.target === this) window.location.hash = '#/'">
        <div class="wood-board animate-bounce-in" style="max-width: 650px;">
          <div class="ribbon-header">🎨 TÙY CHỈNH GIAO DIỆN</div>
          <div class="wood-board-paper">
            <a href="#/" class="btn btn-red btn-back"><span style="font-family: var(--font-header); font-size:1.8rem; line-height:1; -webkit-text-stroke: 0.5px #7a0000; text-shadow: 1px 1px 3px rgba(0,0,0,0.5);">X</span></a>
            <div class="form-card board-form" style="max-height: 65vh;">
              
              <!-- Khu vực Preview -->
              <style id="preview-font-style"></style>
              <div style="background: rgba(0,0,0,0.5); padding: 2rem; border-radius: 8px; text-align: center; margin-bottom: 1.5rem; overflow: hidden; position: relative;">
                <div style="margin-bottom:0.5rem;"><small style="color:rgba(255,255,255,0.6)">👇 Bấm vào text bên dưới để chọn font cần chỉnh hiệu ứng</small></div>
                <div id="theme-preview-main-container" style="outline: 2px dashed #fed035; padding: 0.5rem; border-radius: 8px; cursor: pointer; transition: all 0.2s;" onclick="UI._selectThemeTarget('main')">
                  <h1 id="theme-preview-text" style="
                    font-family: var(--font-header);
                    color: white; 
                    font-size: 3rem; 
                    margin: 0;
                    -webkit-text-stroke: ${sw} ${sc};
                    text-shadow: ${sx} ${sy} ${sb} ${shc};
                    position: relative; z-index: 2;
                  ">PREVIEW H1/H2</h1>
                </div>
                <div id="theme-preview-h3-container" style="outline: none; padding: 0.5rem; border-radius: 8px; cursor: pointer; transition: all 0.2s; margin-top: 0.5rem;" onclick="UI._selectThemeTarget('h3')">
                  <h3 id="theme-preview-h3" style="
                    font-family: ${t.h3FontName ? "'CustomH3Font', 'SVN-Whimsy', cursive, sans-serif" : 'var(--font-header)'};
                    color: var(--bs-yellow);
                    font-size: 1.6rem;
                    margin: 0;
                    -webkit-text-stroke: ${h3SW} ${h3SC};
                    text-shadow: ${h3SX} ${h3SY} ${h3SB} ${h3SHC};
                    position: relative; z-index: 2;
                  ">Preview H3 — Tên giải đấu</h3>
                </div>
                <div id="theme-preview-body-container" style="outline: none; padding: 0.5rem; border-radius: 8px; cursor: pointer; transition: all 0.2s; margin-top: 0.5rem;" onclick="UI._selectThemeTarget('body')">
                  <p id="theme-preview-body" style="
                    font-family: ${t.bodyFontName ? "'CustomBodyFont', sans-serif" : 'var(--font-body)'};
                    color: rgba(255,255,255,0.75);
                    font-size: 0.95rem;
                    margin: 0;
                    ${bodySW !== '0px' && bodySW !== '0' && bodySW !== '' ? `-webkit-text-stroke: ${bodySW} ${bodySC};` : ''}
                    ${bodySX !== '0px' && bodySX !== '0' && bodySX !== '' ? `text-shadow: ${bodySX} ${bodySY} ${bodySB} ${bodySHC};` : ''}
                    position: relative; z-index: 2;
                  ">Preview text nhỏ — mô tả, nhãn, nội dung</p>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label board-label">Hình nền (Background)</label>
                  <input type="file" id="t-bg-file" accept="image/*" class="form-input board-input" style="padding:0.5rem;">
                </div>
                <div class="form-group">
                  <label class="form-label board-label">Font Tiêu đề H1/H2 (TTF/OTF/WOFF)</label>
                  <input type="file" id="t-font-file" accept=".ttf,.otf,.woff" class="form-input board-input" style="padding:0.5rem;" onchange="UI._updateThemePreview()">
                  ${t.fontName ? `<small style="color: var(--bs-yellow); display:block; margin-top:0.3rem;">✅ Hiện tại: ${t.fontName} — <button type="button" onclick="UI._clearMainFont()" style="background:none;border:none;color:#ff4444;cursor:pointer;text-decoration:underline;font-size:0.8rem;">Xóa font H1/H2</button></small>` : '<small style="color: rgba(255,255,255,0.5); display:block; margin-top:0.3rem;">Chưa có font H1/H2 tùy chỉnh</small>'}
                </div>
              </div>

              <div class="form-row">
                <div class="form-group" style="grid-column: 1 / -1;">
                  <label class="form-label board-label">🔤 Font Tiêu đề H3 (TTF/OTF/WOFF)</label>
                  <input type="file" id="t-h3-font-file" accept=".ttf,.otf,.woff" class="form-input board-input" style="padding:0.5rem;" onchange="UI._updateThemePreview()">
                  ${t.h3FontName ? `<small style="color: var(--bs-yellow); display:block; margin-top:0.3rem;">✅ Hiện tại: ${t.h3FontName} — <button type="button" onclick="UI._clearH3Font()" style="background:none;border:none;color:#ff4444;cursor:pointer;text-decoration:underline;font-size:0.8rem;">Xóa font H3</button></small>` : '<small style="color: rgba(255,255,255,0.5); display:block; margin-top:0.3rem;">Chưa có font H3 tùy chỉnh (dùng chung với H1/H2)</small>'}
                </div>
              </div>

              <div class="form-row">
                <div class="form-group" style="grid-column: 1 / -1;">
                  <label class="form-label board-label">📝 Font Text nhỏ / Body (TTF/OTF/WOFF)</label>
                  <input type="file" id="t-body-font-file" accept=".ttf,.otf,.woff" class="form-input board-input" style="padding:0.5rem;" onchange="UI._updateThemePreview()">
                  ${t.bodyFontName ? `<small style="color: var(--bs-yellow); display:block; margin-top:0.3rem;">✅ Hiện tại: ${t.bodyFontName} — <button type="button" onclick="UI._clearBodyFont()" style="background:none;border:none;color:#ff4444;cursor:pointer;text-decoration:underline;font-size:0.8rem;">Xóa font body</button></small>` : '<small style="color: rgba(255,255,255,0.5); display:block; margin-top:0.3rem;">Chưa có font body tùy chỉnh (dùng font hệ thống)</small>'}
                </div>
              </div>

              <hr style="border-color: rgba(255,255,255,0.1); margin: 1rem 0;">
              
              <div id="theme-target-label" style="text-align:center; font-family:var(--font-header); font-size:1.5rem; color:var(--bs-yellow); margin-bottom:1rem;">Đang chỉnh sửa: Tiêu đề H1/H2</div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label board-label">Độ dày viền (Stroke)</label>
                  <div style="display: flex; gap: 0.5rem;">
                    <button type="button" class="btn btn-blue" style="padding: 0 1rem; font-size: 1.5rem;" onclick="UI._adjustThemeValue('t-stroke-width', -0.5)">-</button>
                    <input type="text" id="t-stroke-width" class="form-input board-input" style="text-align: center;" value="${sw}" placeholder="vd: 1px" oninput="UI._updateThemePreview()">
                    <button type="button" class="btn btn-red" style="padding: 0 1rem; font-size: 1.5rem;" onclick="UI._adjustThemeValue('t-stroke-width', 0.5)">+</button>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label board-label">Màu viền</label>
                  <input type="color" id="t-stroke-color" class="form-input board-input" value="${sc}" style="height:48px; padding:2px;" oninput="UI._updateThemePreview()">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label board-label">Bóng đổ X (Offset X)</label>
                  <div style="display: flex; gap: 0.5rem;">
                    <button type="button" class="btn btn-blue" style="padding: 0 1rem; font-size: 1.5rem;" onclick="UI._adjustThemeValue('t-shadow-x', -0.5)">-</button>
                    <input type="text" id="t-shadow-x" class="form-input board-input" style="text-align: center;" value="${sx}" placeholder="vd: 2px" oninput="UI._updateThemePreview()">
                    <button type="button" class="btn btn-red" style="padding: 0 1rem; font-size: 1.5rem;" onclick="UI._adjustThemeValue('t-shadow-x', 0.5)">+</button>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label board-label">Bóng đổ Y (Offset Y)</label>
                  <div style="display: flex; gap: 0.5rem;">
                    <button type="button" class="btn btn-blue" style="padding: 0 1rem; font-size: 1.5rem;" onclick="UI._adjustThemeValue('t-shadow-y', -0.5)">-</button>
                    <input type="text" id="t-shadow-y" class="form-input board-input" style="text-align: center;" value="${sy}" placeholder="vd: 3px" oninput="UI._updateThemePreview()">
                    <button type="button" class="btn btn-red" style="padding: 0 1rem; font-size: 1.5rem;" onclick="UI._adjustThemeValue('t-shadow-y', 0.5)">+</button>
                  </div>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label board-label">Độ nhòe (Blur)</label>
                  <div style="display: flex; gap: 0.5rem;">
                    <button type="button" class="btn btn-blue" style="padding: 0 1rem; font-size: 1.5rem;" onclick="UI._adjustThemeValue('t-shadow-blur', -0.5)">-</button>
                    <input type="text" id="t-shadow-blur" class="form-input board-input" style="text-align: center;" value="${sb}" placeholder="vd: 0px" oninput="UI._updateThemePreview()">
                    <button type="button" class="btn btn-red" style="padding: 0 1rem; font-size: 1.5rem;" onclick="UI._adjustThemeValue('t-shadow-blur', 0.5)">+</button>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label board-label">Màu bóng</label>
                  <input type="color" id="t-shadow-color" class="form-input board-input" value="${shc}" style="height:48px; padding:2px;" oninput="UI._updateThemePreview()">
                </div>
              </div>

              <div class="board-actions" style="gap:1rem;">
                <button class="btn btn-danger" onclick="ThemeManager.resetTheme(); UI.showToast('Đã khôi phục giao diện gốc!', 'success'); setTimeout(()=>window.location.reload(), 500);">Xóa Tùy Chỉnh</button>
                <button class="btn btn-green" onclick="UI._handleSaveTheme()">LƯU GIAO DIỆN</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function _selectThemeTarget(target) {
    _activeThemeTarget = target;
    
    const mContainer = document.getElementById('theme-preview-main-container');
    const hContainer = document.getElementById('theme-preview-h3-container');
    const bContainer = document.getElementById('theme-preview-body-container');
    if (mContainer) mContainer.style.outline = target === 'main' ? '2px dashed #fed035' : 'none';
    if (hContainer) hContainer.style.outline = target === 'h3' ? '2px dashed #fed035' : 'none';
    if (bContainer) bContainer.style.outline = target === 'body' ? '2px dashed #fed035' : 'none';
    
    const t = _themeEditorState;
    if (target === 'main') {
      document.getElementById('t-stroke-width').value = t.strokeWidth || '1px';
      document.getElementById('t-stroke-color').value = t.strokeColor || '#141634';
      document.getElementById('t-shadow-x').value = t.shadowX || '2px';
      document.getElementById('t-shadow-y').value = t.shadowY || '3px';
      document.getElementById('t-shadow-blur').value = t.shadowBlur || '0px';
      document.getElementById('t-shadow-color').value = t.shadowColor || '#141634';
      document.getElementById('theme-target-label').innerText = 'Đang chỉnh sửa: Tiêu đề H1/H2';
    } else if (target === 'h3') {
      document.getElementById('t-stroke-width').value = t.h3StrokeWidth || t.strokeWidth || '1px';
      document.getElementById('t-stroke-color').value = t.h3StrokeColor || t.strokeColor || '#141634';
      document.getElementById('t-shadow-x').value = t.h3ShadowX || t.shadowX || '2px';
      document.getElementById('t-shadow-y').value = t.h3ShadowY || t.shadowY || '3px';
      document.getElementById('t-shadow-blur').value = t.h3ShadowBlur || t.shadowBlur || '0px';
      document.getElementById('t-shadow-color').value = t.h3ShadowColor || t.shadowColor || '#141634';
      document.getElementById('theme-target-label').innerText = 'Đang chỉnh sửa: Tiêu đề H3';
    } else if (target === 'body') {
      document.getElementById('t-stroke-width').value = t.bodyStrokeWidth || '0px';
      document.getElementById('t-stroke-color').value = t.bodyStrokeColor || '#000000';
      document.getElementById('t-shadow-x').value = t.bodyShadowX || '0px';
      document.getElementById('t-shadow-y').value = t.bodyShadowY || '0px';
      document.getElementById('t-shadow-blur').value = t.bodyShadowBlur || '0px';
      document.getElementById('t-shadow-color').value = t.bodyShadowColor || '#000000';
      document.getElementById('theme-target-label').innerText = 'Đang chỉnh sửa: Text Nhỏ / Body';
    }
  }

  function _updateThemePreview() {
    const sw = document.getElementById('t-stroke-width').value;
    const sc = document.getElementById('t-stroke-color').value;
    const sx = document.getElementById('t-shadow-x').value;
    const sy = document.getElementById('t-shadow-y').value;
    const sb = document.getElementById('t-shadow-blur').value;
    const shc = document.getElementById('t-shadow-color').value;
    
    const previewText = document.getElementById('theme-preview-text');
    const previewH3 = document.getElementById('theme-preview-h3');
    const previewBody = document.getElementById('theme-preview-body');
    
    if (_activeThemeTarget === 'main') {
      _themeEditorState.strokeWidth = sw;
      _themeEditorState.strokeColor = sc;
      _themeEditorState.shadowX = sx;
      _themeEditorState.shadowY = sy;
      _themeEditorState.shadowBlur = sb;
      _themeEditorState.shadowColor = shc;
      if (previewText) {
        previewText.style.webkitTextStroke = `${sw} ${sc}`;
        previewText.style.textShadow = `${sx} ${sy} ${sb} ${shc}`;
      }
    } else if (_activeThemeTarget === 'h3') {
      _themeEditorState.h3StrokeWidth = sw;
      _themeEditorState.h3StrokeColor = sc;
      _themeEditorState.h3ShadowX = sx;
      _themeEditorState.h3ShadowY = sy;
      _themeEditorState.h3ShadowBlur = sb;
      _themeEditorState.h3ShadowColor = shc;
      if (previewH3) {
        previewH3.style.webkitTextStroke = `${sw} ${sc}`;
        previewH3.style.textShadow = `${sx} ${sy} ${sb} ${shc}`;
      }
    } else if (_activeThemeTarget === 'body') {
      _themeEditorState.bodyStrokeWidth = sw;
      _themeEditorState.bodyStrokeColor = sc;
      _themeEditorState.bodyShadowX = sx;
      _themeEditorState.bodyShadowY = sy;
      _themeEditorState.bodyShadowBlur = sb;
      _themeEditorState.bodyShadowColor = shc;
      if (previewBody) {
        if (sw !== '0px' && sw !== '0' && sw !== '') {
          previewBody.style.webkitTextStroke = `${sw} ${sc}`;
        } else {
          previewBody.style.webkitTextStroke = '0px transparent';
        }
        
        if (sx !== '0px' && sx !== '0' && sx !== '') {
          previewBody.style.textShadow = `${sx} ${sy} ${sb} ${shc}`;
        } else {
          previewBody.style.textShadow = 'none';
        }
      }
    }
    
    const previewStyle = document.getElementById('preview-font-style');
    if (!previewStyle) return;
    
    let fontCss = '';

    // Preview H1/H2 font
    const fontFile = document.getElementById('t-font-file')?.files[0];
    if (fontFile) {
      const url = URL.createObjectURL(fontFile);
      fontCss += `@font-face { font-family: 'PreviewFont'; src: url(${url}); }\n`;
      if (previewText) previewText.style.fontFamily = "'PreviewFont', 'SVN-Whimsy', cursive, sans-serif";
    }

    // Preview H3 font
    const h3FontFile = document.getElementById('t-h3-font-file')?.files[0];
    if (h3FontFile && previewH3) {
      const urlH3 = URL.createObjectURL(h3FontFile);
      fontCss += `@font-face { font-family: 'PreviewH3Font'; src: url(${urlH3}); }\n`;
      previewH3.style.fontFamily = "'PreviewH3Font', 'SVN-Whimsy', cursive, sans-serif";
    }

    // Preview Body font
    const bodyFontFile = document.getElementById('t-body-font-file')?.files[0];
    const previewBodyEl = document.getElementById('theme-preview-body');
    if (bodyFontFile && previewBodyEl) {
      const urlBody = URL.createObjectURL(bodyFontFile);
      fontCss += `@font-face { font-family: 'PreviewBodyFont'; src: url(${urlBody}); }\n`;
      previewBodyEl.style.fontFamily = "'PreviewBodyFont', sans-serif";
    }
    
    previewStyle.innerHTML = fontCss;
  }

  function _clearMainFont() {
    const theme = ThemeManager.getTheme();
    theme.fontName = '';
    theme.fontBase64 = '';
    ThemeManager.saveTheme(theme);
    UI.showToast('Đã xóa font H1/H2!', 'success');
    setTimeout(() => UI.renderAdminTheme(), 300);
  }

  function _clearH3Font() {
    const theme = ThemeManager.getTheme();
    theme.h3FontName = '';
    theme.h3FontBase64 = '';
    ThemeManager.saveTheme(theme);
    UI.showToast('Đã xóa font H3!', 'success');
    setTimeout(() => UI.renderAdminTheme(), 300);
  }

  function _clearBodyFont() {
    const theme = ThemeManager.getTheme();
    theme.bodyFontName = '';
    theme.bodyFontBase64 = '';
    ThemeManager.saveTheme(theme);
    UI.showToast('Đã xóa font body!', 'success');
    setTimeout(() => UI.renderAdminTheme(), 300);
  }

  function _adjustThemeValue(inputId, amount) {
    const el = document.getElementById(inputId);
    if (!el) return;
    let val = el.value.replace(/[^0-9.-]/g, '');
    let num = parseFloat(val) || 0;
    num += amount;
    if ((inputId === 't-stroke-width' || inputId === 't-shadow-blur') && num < 0) num = 0;
    el.value = num + 'px';
    _updateThemePreview();
  }

  function _handleSaveTheme() {
    const fontFile = document.getElementById('t-font-file')?.files[0];
    const h3FontFile = document.getElementById('t-h3-font-file')?.files[0];
    const bodyFontFile = document.getElementById('t-body-font-file')?.files[0];
    const bgFile = document.getElementById('t-bg-file')?.files[0];
    
    const current = ThemeManager.getTheme();
    const newTheme = {
      ..._themeEditorState,
      fontName: current.fontName,
      fontBase64: current.fontBase64,
      h3FontName: current.h3FontName,
      h3FontBase64: current.h3FontBase64,
      bodyFontName: current.bodyFontName,
      bodyFontBase64: current.bodyFontBase64,
      bgBase64: current.bgBase64
    };

    let filesToRead = 0;
    function done() {
      if (filesToRead === 0) {
        ThemeManager.saveTheme(newTheme);
        UI.showToast('Đã lưu giao diện thành công!', 'success');
      }
    }

    if (fontFile) filesToRead++;
    if (h3FontFile) filesToRead++;
    if (bodyFontFile) filesToRead++;
    if (bgFile) filesToRead++;
    if (filesToRead === 0) return done();

    if (fontFile) {
      const r1 = new FileReader();
      r1.onload = (e) => {
        newTheme.fontName = fontFile.name;
        newTheme.fontBase64 = e.target.result;
        filesToRead--;
        done();
      };
      r1.readAsDataURL(fontFile);
    }

    if (h3FontFile) {
      const rh3 = new FileReader();
      rh3.onload = (e) => {
        newTheme.h3FontName = h3FontFile.name;
        newTheme.h3FontBase64 = e.target.result;
        filesToRead--;
        done();
      };
      rh3.readAsDataURL(h3FontFile);
    }

    if (bodyFontFile) {
      const rBody = new FileReader();
      rBody.onload = (e) => {
        newTheme.bodyFontName = bodyFontFile.name;
        newTheme.bodyFontBase64 = e.target.result;
        filesToRead--;
        done();
      };
      rBody.readAsDataURL(bodyFontFile);
    }

    if (bgFile) {
      const r2 = new FileReader();
      r2.onload = (e) => {
        newTheme.bgBase64 = e.target.result;
        filesToRead--;
        done();
      };
      r2.readAsDataURL(bgFile);
    }
  }

  // ── Create Form ─────────────────────────────────────────────

  function renderCreateForm() {
    const allEmojis = TournamentManager.TEAM_EMOJIS;
    getApp().innerHTML = `
      <div class="create-overlay" onclick="if(event.target === this) window.location.hash = '#/'">
        <div class="wood-board animate-bounce-in">
          <div class="ribbon-header">TẠO GIẢI ĐẤU</div>
          <div class="wood-board-paper">
            <a href="#/" class="btn btn-red btn-back">
              <span style="font-family: var(--font-header); font-size:1.8rem; line-height:1; -webkit-text-stroke: 0.5px #7a0000; text-shadow: 1px 1px 3px rgba(0,0,0,0.5);">X</span>
            </a>
            <div class="form-card board-form">
              <p class="board-desc">Thiết lập chiến trường cho các đội thi đấu</p>

              <div class="form-group">
                <label class="form-label board-label">Tên giải đấu *</label>
                <input type="text" class="form-input board-input" id="f-name" placeholder="VD: Giải bóng đá mùa hè 2025" maxlength="100">
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label board-label">Môn thi đấu</label>
                  <input type="text" class="form-input board-input" id="f-sport" placeholder="VD: Bóng đá, PUBG...">
                </div>
                <div class="form-group">
                  <label class="form-label board-label">Ngày khai mạc</label>
                  <input type="date" class="form-input board-input" id="f-date">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label board-label">Mô tả</label>
                <textarea class="form-textarea board-input" id="f-desc" placeholder="Mô tả ngắn..." maxlength="300"></textarea>
              </div>

              <div class="form-group">
                <label class="form-label board-label">Thể thức thi đấu *</label>
                <div class="format-grid" id="format-grid">
                  <div class="format-card selected" data-format="single_elimination" onclick="UI._selectFormat(this)">
                    <div class="format-card-icon">⚡</div>
                    <div class="format-card-name" style="color:white;-webkit-text-stroke:1px #141634;text-shadow:0 2px 0 #141634;">Loại trực tiếp</div>
                    <div class="format-card-desc">Thua = Out. Tốc chiến tốc thắng.</div>
                  </div>
                  <div class="format-card" data-format="round_robin" onclick="UI._selectFormat(this)">
                    <div class="format-card-icon">🔄</div>
                    <div class="format-card-name" style="color:white;-webkit-text-stroke:1px #141634;text-shadow:0 2px 0 #141634;">Vòng tròn</div>
                    <div class="format-card-desc">Đấu tất cả. Ai mạnh nhất lộ diện.</div>
                  </div>
                  <div class="format-card" data-format="group_stage" onclick="UI._selectFormat(this)">
                    <div class="format-card-icon">📋</div>
                    <div class="format-card-name" style="color:white;-webkit-text-stroke:1px #141634;text-shadow:0 2px 0 #141634;">Chia bảng</div>
                    <div class="format-card-desc">Chia bảng, chiến trong bảng. Kinh điển.</div>
                  </div>
                </div>
              </div>

              <div class="form-group hidden" id="groups-config">
                <label class="form-label board-label">Số bảng đấu</label>
                <select class="form-select board-input" id="f-groups">
                  <option value="2">2 bảng</option>
                  <option value="3">3 bảng</option>
                  <option value="4">4 bảng</option>
                </select>
              </div>

              <div class="board-actions">
                <button class="btn btn-start" onclick="UI._handleCreateTournament()">🚀 KHỞI TẠO GIẢI</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }


  function _selectFormat(el) {
    document.querySelectorAll('.format-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');

    const groupsConfig = document.getElementById('groups-config');
    if (el.dataset.format === 'group_stage') {
      groupsConfig.classList.remove('hidden');
    } else {
      groupsConfig.classList.add('hidden');
    }
  }

  function _handleCreateTournament() {
    const name = document.getElementById('f-name').value.trim();
    const sport = document.getElementById('f-sport').value.trim();
    const date = document.getElementById('f-date').value;
    const desc = document.getElementById('f-desc').value.trim();
    const formatEl = document.querySelector('.format-card.selected');
    const format = formatEl ? formatEl.dataset.format : 'single_elimination';
    const numGroups = parseInt(document.getElementById('f-groups').value) || 2;

    if (!name) {
      showToast('Nhập tên giải đấu đã!', 'error');
      document.getElementById('f-name').focus();
      return;
    }

    const tournament = TournamentManager.create({
      name, description: desc, sport, format, startDate: date, numGroups
    });

    showToast('Giải đấu đã được khởi tạo! ⚡', 'success');
    App.navigate(`#/tournament/${tournament.id}`);
  }

  // ── Tournament Detail ───────────────────────────────────────

  let _activeTab = 'teams';

  function renderTournamentDetail(id) {
    const tournament = Storage.getById(id);
    if (!tournament) {
      getApp().innerHTML = `
        <div class="empty-state animate-in">
          <div class="empty-state-icon">💀</div>
          <h3>KHÔNG TÌM THẤY</h3>
          <p>Giải đấu này không tồn tại hoặc đã bị hủy.</p>
          <a href="#/" class="btn btn-primary">← VỀ CHIẾN TRƯỜNG</a>
        </div>
      `;
      return;
    }

    const champion = tournament.champion ? _getTeamById(tournament, tournament.champion) : null;

    getApp().innerHTML = `
      <div class="tournament-detail animate-in">
        <div class="tournament-header">
          <div>
            <div class="tournament-title">${_esc(tournament.name)}</div>
            ${tournament.sport || tournament.description ? `
              <div class="tournament-subtitle">
                ${tournament.sport ? _esc(tournament.sport) : ''}
                ${tournament.sport && tournament.description ? ' · ' : ''}
                ${tournament.description ? _esc(tournament.description) : ''}
              </div>
            ` : ''}
            <div class="tournament-badges">
              <span class="badge badge-format">${_formatLabel(tournament.format)}</span>
              <span class="badge ${_statusClass(tournament.status)}">${_statusLabel(tournament.status)}</span>
              <span class="badge badge-team-count">⚔️ ${tournament.teams.length} đội</span>
              ${tournament.startDate ? `<span class="badge badge-draft">📅 ${_formatDate(tournament.startDate)}</span>` : ''}
            </div>
          </div>
          <div class="tournament-actions">
            <button class="btn btn-danger btn-sm" onclick="UI._confirmDeleteTournament('${tournament.id}')">🗑️ Xóa</button>
          </div>
        </div>

        ${champion ? `
          <div class="champion-banner" style="position:relative; margin-top:1.5rem; padding: 2rem;">
            <div class="trophy">🏆</div>
            <h2>✦ NHÀ VÔ ĐỊCH ✦</h2>
            <div class="champion-name">${_renderAvatar(champion)} ${_esc(champion.name)}</div>
            <button class="btn btn-special" style="margin-top:1.5rem; font-size: 1.3rem; padding: 0.6rem 1.2rem;" onclick="UI.triggerConfetti()">🎉 ĂN MỪNG 🎉</button>
          </div>
        ` : ''}

        <div class="tabs">
          <button class="tab ${_activeTab === 'teams' ? 'active' : ''}" onclick="UI._switchTab('teams', '${id}')">⚔️ ĐỘI TUYỂN (${tournament.teams.length})</button>
          <button class="tab ${_activeTab === 'wheel' ? 'active' : ''}" onclick="UI._switchTab('wheel', '${id}')">🎰 BỐC THĂM</button>
          <button class="tab ${_activeTab === 'schedule' ? 'active' : ''}" onclick="UI._switchTab('schedule', '${id}')" ${tournament.status === 'draft' ? 'disabled style="opacity:0.3;cursor:not-allowed"' : ''}>📋 LỊCH ĐẤU</button>
          ${tournament.format === 'group_stage' ? `<button class="tab ${_activeTab === 'knockout' ? 'active' : ''}" onclick="UI._switchTab('knockout', '${id}')" ${tournament.status === 'draft' ? 'disabled style="opacity:0.3;cursor:not-allowed"' : ''}>🔥 LOẠI TRỰC TIẾP</button>` : ''}
          <button class="tab ${_activeTab === 'standings' ? 'active' : ''}" onclick="UI._switchTab('standings', '${id}')" ${tournament.status === 'draft' ? 'disabled style="opacity:0.3;cursor:not-allowed"' : ''}>📊 BXH</button>
        </div>

        <div class="tab-content" id="tab-content"></div>
      </div>
    `;

    // Reset wheel memory when navigating to a new tournament
    if (window._currentTournamentId !== id) {
      _wheelExcludedTeams = [];
      window._currentTournamentId = id;
    }

    _renderTabContent(tournament);
  }

  let _wheelExcludedTeams = [];

  function _switchTab(tab, id) {
    _activeTab = tab;
    const tournament = Storage.getById(id);
    if (!tournament) return;

    // Use event.currentTarget if event exists, otherwise relying on document query might be risky, but we can just re-render the whole view if it's easier.
    // We already re-render the content. For the tabs, let's just re-render the tournament detail to keep active states in sync easily.
    // But since it's a DOM event, we just let renderTournamentDetail run again.
    // Wait, the previous code didn't re-render the whole tournament detail, just updated tab active class.
    if (window.event && window.event.currentTarget) {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      window.event.currentTarget.classList.add('active');
    }

    _renderTabContent(tournament);
  }

  function _renderTabContent(tournament) {
    const container = document.getElementById('tab-content');
    if (!container) return;

    switch (_activeTab) {
      case 'teams':
        container.innerHTML = _renderTeamsTab(tournament);
        break;
      case 'schedule':
        container.innerHTML = _renderScheduleTab(tournament);
        break;
      case 'knockout':
        container.innerHTML = _renderKnockoutTab(tournament);
        break;
      case 'standings':
        container.innerHTML = _renderStandingsTab(tournament);
        break;
      case 'wheel':
        container.innerHTML = _renderWheelTab(tournament);
        setTimeout(() => UI._drawWheel(tournament), 0);
        break;
    }
  }

  // ── Wheel Tab ────────────────────────────────────────────────
  
  function _renderWheelTab(tournament) {
    const availableTeams = tournament.teams.filter(t => !_wheelExcludedTeams.includes(t.id));

    if (availableTeams.length < 2) {
      return `
        <div class="empty-state animate-in">
          <div class="empty-state-icon">⚠️</div>
          <h3>KHÔNG THỂ BỐC THĂM</h3>
          <p>Cần ít nhất 2 đội chưa bị loại để quay vòng bốc thăm.</p>
          <button class="btn btn-yellow mt-2" onclick="UI._resetWheel()">🔄 Làm mới vòng quay</button>
          ${tournament.status === 'draft' && tournament.teams.length >= 2 ? `
            <div style="margin-top:1.5rem">
              <button class="btn btn-green btn-block" onclick="UI._handleStartTournament('${tournament.id}')">TIẾP THEO: XẾP LỊCH THI ĐẤU 🚀</button>
            </div>
          ` : ''}
        </div>
      `;
    }

    return `
      <div class="form-card animate-in text-center">
        <h2 class="mb-1" style="font-size: 2.5rem;">VÒNG QUAY NHÂN PHẨM</h2>
        <p class="text-muted mb-2" style="font-size: 1.2rem; font-weight: bold;">Bốc thăm ngẫu nhiên một đội để trao thưởng hoặc xếp cặp.</p>
        
        <div style="position: relative; width: 320px; height: 320px; margin: 2rem auto;">
          <!-- Pointer -->
          <div style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 20px solid transparent; border-right: 20px solid transparent; border-top: 30px solid var(--bs-yellow); z-index: 10; filter: drop-shadow(0 4px 0 var(--border-black)) drop-shadow(0 -4px 0 var(--border-black)) drop-shadow(4px 0 0 var(--border-black)) drop-shadow(-4px 0 0 var(--border-black));"></div>
          
          <!-- Wheel Canvas -->
          <canvas id="wheelCanvas" data-rotation="0" width="320" height="320" style="border-radius: 50%; border: var(--border-width) solid var(--paper-border); box-shadow: var(--shadow-hard); transform: rotate(0deg);"></canvas>
        </div>
        
        <div id="wheelResult" style="font-family: var(--font-header); font-size: 2rem; color: var(--text-primary); min-height: 3rem; margin-bottom: 1.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--highlight-green); padding: 0.5rem 1.5rem; border: var(--border-width) solid var(--paper-border); border-radius: var(--radius); width: fit-content; margin-left: auto; margin-right: auto; box-shadow: var(--shadow-sm);">
          <span>SẴN SÀNG!</span>
        </div>
        
        <div style="display:flex; gap:1rem; justify-content:center; align-items:center;">
          <button class="btn btn-primary" id="spinBtn" onclick="UI._spinWheel('${tournament.id}')" style="font-size: 1.8rem; padding: 1rem 3rem;">🎲 QUAY NGAY</button>
          ${_wheelExcludedTeams.length > 0 ? `<button class="btn btn-yellow" onclick="UI._resetWheel()">🔄 Reset</button>` : ''}
        </div>

        ${tournament.status === 'draft' ? `
          <div style="margin-top:2.5rem; padding-top:2rem; border-top:1px solid rgba(255,255,255,0.1)">
            <p style="color:var(--neon-green); margin-bottom:1rem; font-weight:bold;">Bốc thăm xong rồi? Tạo lịch thi đấu thôi!</p>
            <button class="btn btn-green btn-block" onclick="UI._handleStartTournament('${tournament.id}')">TIẾP THEO: XẾP LỊCH THI ĐẤU 🚀</button>
          </div>
        ` : ''}
      </div>
    `;
  }

  function _resetWheel() {
    _wheelExcludedTeams = [];
    const tournament = Storage.getById(window._currentTournamentId);
    if(tournament) _renderTabContent(tournament);
  }

  function _drawWheel(tournament) {
    const canvas = document.getElementById('wheelCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const center = width / 2;
    const radius = center;
    const teams = tournament.teams.filter(t => !_wheelExcludedTeams.includes(t.id));
    const numSlices = teams.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    ctx.clearRect(0, 0, width, height);

    // Brawl Stars Colors: Blue, Orange, Yellow, Green, Red
    const colors = ['#3a6ceb', '#f37825', '#fed035', '#59d538', '#ea3a3d'];

    for (let i = 0; i < numSlices; i++) {
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, i * sliceAngle, (i + 1) * sliceAngle);
      ctx.closePath();
      
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#2a1f2c'; 
      ctx.stroke();

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(i * sliceAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.font = '20px "Baloo 2", sans-serif';
      
      const teamName = teams[i].name.length > 12 ? teams[i].name.substring(0, 10) + '...' : teams[i].name;
      const textToDraw = teams[i].emoji + ' ' + teamName;
      
      // Black stroke
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#14151a';
      ctx.strokeText(textToDraw, radius - 15, 8);
      
      // White fill
      ctx.fillStyle = '#ffffff'; 
      ctx.fillText(textToDraw, radius - 15, 8);
      
      ctx.restore();
    }
    
    const currentRot = parseInt(canvas.dataset.rotation || '0', 10);
    canvas.style.transition = 'none';
    canvas.style.transform = `rotate(${currentRot}deg)`;
    void canvas.offsetWidth; 
  }

  function _spinWheel(tournamentId) {
    const tournament = Storage.getById(tournamentId);
    if (!tournament) return;
    
    const canvas = document.getElementById('wheelCanvas');
    const resultDiv = document.getElementById('wheelResult');
    const spinBtn = document.getElementById('spinBtn');
    if (!canvas || !resultDiv || !spinBtn) return;

    spinBtn.disabled = true;
    spinBtn.style.opacity = '0.5';
    resultDiv.innerHTML = '<span>ĐANG QUAY... 🌀</span>';
    resultDiv.style.background = 'var(--paper-dark)';

    const availableTeams = tournament.teams.filter(t => !_wheelExcludedTeams.includes(t.id));
    const numSlices = availableTeams.length;
    const sliceAngleDeg = 360 / numSlices;
    
    let currentRot = parseInt(canvas.dataset.rotation || '0', 10);
    const spins = Math.floor(Math.random() * 4) + 5; 
    const randomAngle = Math.floor(Math.random() * 360);
    
    currentRot += (spins * 360) + randomAngle;
    canvas.dataset.rotation = currentRot;

    canvas.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
    canvas.style.transform = `rotate(${currentRot}deg)`;

    setTimeout(() => {
      const normalizedRotation = currentRot % 360;
      const pointingAngle = (360 - normalizedRotation + 270) % 360;
      const winningIndex = Math.floor(pointingAngle / sliceAngleDeg);
      
      const winner = availableTeams[winningIndex];
      
      resultDiv.innerHTML = `
        <span>🎉 ${_renderAvatar(winner)} ${_esc(winner.name)} 🎉</span>
        <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
          <button class="btn btn-green btn-sm" onclick="UI._wheelAction('remove', '${winner.id}')">✅ Thêm vào lịch thi đấu</button>
          <button class="btn btn-yellow btn-sm" onclick="UI._wheelAction('keep')">🔄 Giữ lại</button>
        </div>
      `;
      resultDiv.style.background = 'var(--highlight-green)';
      
      spinBtn.disabled = false;
      spinBtn.style.opacity = '1';
      
      resultDiv.style.transform = 'scale(1.1)';
      resultDiv.style.transition = 'transform 0.2s';
      setTimeout(() => {
        resultDiv.style.transform = 'scale(1)';
      }, 300);

    }, 4000);
  }

  function _wheelAction(action, teamId) {
    if (action === 'remove' && teamId) {
      _wheelExcludedTeams.push(teamId);
      showToast('Đã thêm vào lịch và xóa khỏi vòng quay', 'success');
    }
    const tournament = Storage.getById(window._currentTournamentId);
    if(tournament) _renderTabContent(tournament);
  }

  function _renderTeamsTab(tournament) {
    const isDraft = tournament.status === 'draft';
    const allEmojis = TournamentManager.TEAM_EMOJIS;
    let selectedEmoji = allEmojis[tournament.teams.length % allEmojis.length];

    let html = '';

    if (isDraft) {
      html += `
        <div class="add-team-form" style="flex-direction:column;gap:0.75rem">
          <label class="form-label" style="margin:0">⚔️ Thêm đội tham chiến</label>
          <!-- Emoji Picker Removed -->
          <div style="display:flex;gap:0.5rem;margin-bottom:0.75rem;align-items:center;">
            <input type="file" id="team-logo-upload" accept="image/*" style="display:none;" onchange="UI._handleLogoUpload(this)">
            <button class="btn btn-blue btn-sm" onclick="document.getElementById('team-logo-upload').click()">🖼️ Tải logo lên</button>
            <div id="team-logo-preview" style="width:32px; height:32px; border-radius:50%; background:var(--bg-dark); display:none; background-size:cover; background-position:center; border:2px solid #fff;"></div>
          </div>
          <div style="display:flex;gap:0.5rem">
            <input type="text" class="form-input" id="team-name-input" placeholder="Nhập tên đội..." maxlength="50"
              onkeypress="if(event.key==='Enter') UI._handleAddTeam('${tournament.id}')">
            <button class="btn btn-green" onclick="UI._handleAddTeam('${tournament.id}')">➕ THÊM</button>
          </div>
        </div>
      `;
    }

    if (tournament.teams.length === 0) {
      html += `
        <div class="empty-state">
          <div class="empty-state-icon">⚔️</div>
          <h3>Chưa có đội nào</h3>
          <p>Triệu hồi ít nhất 2 đội để bắt đầu cuộc chiến</p>
        </div>
      `;
    } else {
      html += `<div class="teams-list">`;
      tournament.teams.forEach(team => {
        html += `
          <div class="team-item">
            <div class="team-avatar" style="background:${team.color}">${_renderAvatar(team)}</div>
            <span class="team-name">
              ${_esc(team.name)}
              <span style="margin-left:8px; font-size:0.8rem; vertical-align:middle; -webkit-text-stroke:0; text-shadow:none;">
                ${_getTeamRankBadge(team.name)}
              </span>
            </span>
            ${isDraft ? `
              <div class="team-actions">
                <button class="btn btn-red btn-icon btn-sm" title="Xóa" onclick="UI._handleRemoveTeam('${tournament.id}','${team.id}')">✕</button>
              </div>
            ` : ''}
          </div>
        `;
      });
      html += `</div>`;

      if (isDraft) {
        html += `
          <div style="margin-top:2.5rem;text-align:center;padding-top:2rem;border-top:1px solid rgba(255,255,255,0.08)">
            ${tournament.teams.length < 2 ? `
              <p class="text-muted mb-2" style="text-transform:uppercase;letter-spacing:1px">Cần ít nhất 2 đội để tham chiến</p>
            ` : `
              <p style="color:var(--neon-green);margin-bottom:1rem;text-transform:uppercase;letter-spacing:2px;font-weight:700">
                ⚡ ${tournament.teams.length} đội sẵn sàng! Hãy bốc thăm trước khi tạo lịch.
              </p>
            `}
            <button class="btn btn-yellow btn-block" onclick="UI._switchTab('wheel', '${tournament.id}')"
              ${tournament.teams.length < 2 ? 'disabled style="opacity:0.3;cursor:not-allowed;animation:none"' : ''}>
              🎰 TIẾP THEO: BỐC THĂM 
            </button>
          </div>
        `;
      }
    }

    return html;
  }

  let _pickedEmoji = null;
  let _pickedLogo = null;

  function _renderAvatar(team) {
    if (!team) return '';
    if (team.customLogo) return `<img class="team-logo-img" src="${team.customLogo}">`;
    return team.emoji || '';
  }

  function _handleLogoUpload(input) {
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
          const canvas = document.createElement('canvas');
          const max_size = 128;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          _pickedLogo = canvas.toDataURL('image/png');
          
          const preview = document.getElementById('team-logo-preview');
          preview.style.backgroundImage = `url(${_pickedLogo})`;
          preview.style.display = 'block';
          _pickedEmoji = null;
        }
        img.src = e.target.result;
      }
      reader.readAsDataURL(input.files[0]);
    }
  }

  function _selectEmoji(el, idx) {
    document.querySelectorAll('.emoji-opt').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    _pickedEmoji = TournamentManager.TEAM_EMOJIS[idx];
    _pickedLogo = null;
    const preview = document.getElementById('team-logo-preview');
    if (preview) preview.style.display = 'none';
  }


  function _handleAddTeam(tournamentId) {
    const input = document.getElementById('team-name-input');
    const name = input.value.trim();

    if (!name) {
      showToast('Nhập tên đội đã!', 'error');
      input.focus();
      return;
    }

    const team = TournamentManager.addTeam(tournamentId, { 
      name, 
      emoji: _pickedEmoji || undefined,
      customLogo: _pickedLogo || undefined
    });
    _pickedEmoji = null;
    _pickedLogo = null;
    if (team) {
      showToast(`${_renderAvatar(team)} ${name} đã tham chiến!`, 'success');
      renderTournamentDetail(tournamentId);
      setTimeout(() => {
        const newInput = document.getElementById('team-name-input');
        if (newInput) newInput.focus();
      }, 100);
    } else {
      showToast('Không thể thêm đội', 'error');
    }
  }


  function _handleRemoveTeam(tournamentId, teamId) {
    TournamentManager.removeTeam(tournamentId, teamId);
    showToast('Đội đã bị loại bỏ', 'info');
    renderTournamentDetail(tournamentId);
  }

  function _handleStartTournament(tournamentId) {
    const result = TournamentManager.start(tournamentId);
    if (result.ok) {
      _activeTab = 'schedule';
      showToast('GIẢI ĐẤU BẮT ĐẦU! LET\'S GO! 🔥', 'success');
      renderTournamentDetail(tournamentId);
    } else {
      showToast(result.error || 'Không thể bắt đầu giải đấu', 'error');
    }
  }

  // ── Schedule Tab ────────────────────────────────────────────

  function _renderScheduleTab(tournament) {
    if (tournament.format === 'single_elimination') {
      return _renderBracketView(tournament);
    } else if (tournament.format === 'group_stage') {
      return _renderGroupStageSchedule(tournament);
    } else {
      return _renderRoundRobinSchedule(tournament);
    }
  }

  // Single Elimination Bracket
  function _renderBracketView(tournament) {
    const matches = tournament.matches;
    if (!matches.length) return '<p class="text-muted">Chưa có lịch thi đấu</p>';

    const maxRound = Math.max(...matches.map(m => m.round));
    let html = '<div class="bracket-container"><div class="bracket">';

    for (let round = 1; round <= maxRound; round++) {
      const roundMatches = matches.filter(m => m.round === round).sort((a, b) => a.position - b.position);

      html += `
        <div class="bracket-round">
          <div class="bracket-round-title">${_roundName(round, maxRound)}</div>
          <div class="bracket-matches">
      `;

      roundMatches.forEach(match => {
        const t1 = match.team1Id ? _getTeamById(tournament, match.team1Id) : null;
        const t2 = match.team2Id ? _getTeamById(tournament, match.team2Id) : null;
        const isBye = match.status === 'bye';
        const isCompleted = match.status === 'completed';
        const isClickable = match.team1Id && match.team2Id && match.status === 'pending';

        html += `
          <div class="bracket-match-wrapper">
            <div class="bracket-match ${isBye ? 'bye' : ''} ${isCompleted ? 'completed' : ''}"
              ${isClickable ? `onclick="UI._openScoreModal('${tournament.id}','${match.id}')" style="cursor:pointer"` : ''}>
              <div class="bracket-team ${match.winnerId === match.team1Id && isCompleted ? 'winner' : ''} ${!t1 ? 'tbd' : ''} ${isCompleted && match.winnerId !== match.team1Id ? 'loser' : ''}">
                ${_renderTeamSelect(match, tournament, 1)}
                ${match.score1 !== null && !isBye ? `<span class="bracket-team-score">${match.score1}</span>` : ''}
              </div>
              <div class="bracket-team ${match.winnerId === match.team2Id && isCompleted ? 'winner' : ''} ${!t2 ? 'tbd' : ''} ${isCompleted && match.winnerId !== match.team2Id ? 'loser' : ''}">
                ${_renderTeamSelect(match, tournament, 2)}
                ${match.score2 !== null && !isBye ? `<span class="bracket-team-score">${match.score2}</span>` : ''}
              </div>
            </div>
          </div>
        `;
      });

      html += `</div></div>`;

      if (round < maxRound) {
        html += `<div class="bracket-connector"></div>`;
      }
    }

    html += '</div></div>';
    return html;
  }

  // Round Robin Schedule
  function _renderRoundRobinSchedule(tournament) {
    const matches = tournament.matches;
    if (!matches.length) return '<p class="text-muted">Chưa có lịch thi đấu</p>';

    const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b);
    let html = '';

    rounds.forEach(round => {
      const roundMatches = matches.filter(m => m.round === round);
      html += `<div class="round-header">⚔️ VÒNG ${round}</div>`;
      html += '<div class="match-list">';
      roundMatches.forEach((match, idx) => {
        html += _renderMatchCard(match, tournament, idx + 1);
      });
      html += '</div>';
    });

    return html;
  }

  // Group Stage Schedule
  function _renderGroupStageSchedule(tournament) {
    if (!tournament.groups.length) return '<p class="text-muted">Chưa có lịch thi đấu</p>';

    let html = '';

    tournament.groups.forEach(group => {
      const groupMatches = tournament.matches.filter(m => m.group === group.name);
      html += `
        <div class="group-section">
          <div class="group-title"><span class="group-badge">BẢNG ${group.name}</span></div>
          <div class="match-list">
            ${groupMatches.map((m, idx) => _renderMatchCard(m, tournament, idx + 1)).join('')}
          </div>
        </div>
      `;
    });

    return html;
  }

  // Knockout Tab
  function _renderKnockoutTab(tournament) {
    const knockoutMatches = tournament.matches.filter(m => !m.group);
    if (!knockoutMatches.length) return '<p class="text-muted">Chưa có lịch thi đấu vòng loại</p>';

    const fakeTournament = { ...tournament, matches: knockoutMatches };
    return `
      <div class="animate-in">
        <div style="text-align: center; margin-bottom: 2rem; margin-top: 1rem;">
          <span class="group-badge" style="background: var(--neon-magenta); color: #fff; font-size: 1.8rem; padding: 0.75rem 2rem; box-shadow: 0 0 20px rgba(255, 0, 255, 0.4);">🔥 VÒNG LOẠI TRỰC TIẾP 🔥</span>
        </div>
        ${_renderBracketView(fakeTournament)}
      </div>
    `;
  }

  // Individual Match Card
  function _renderMatchCard(match, tournament, num) {
    const t1 = match.team1Id ? _getTeamById(tournament, match.team1Id) : null;
    const t2 = match.team2Id ? _getTeamById(tournament, match.team2Id) : null;
    const isCompleted = match.status === 'completed';
    const isClickable = t1 && t2 && match.status === 'pending';

    return `
      <div class="match-card ${isCompleted ? 'completed' : ''}">
        <div class="match-number">#${num}</div>
        <div class="match-teams">
          <div class="match-team ${isCompleted && match.winnerId === match.team1Id ? 'winner' : ''} ${isCompleted && match.winnerId && match.winnerId !== match.team1Id ? 'loser' : ''}">
            ${_renderTeamSelect(match, tournament, 1)}
            <span class="match-team-score">${match.score1 !== null ? match.score1 : '-'}</span>
          </div>
          <div class="match-team ${isCompleted && match.winnerId === match.team2Id ? 'winner' : ''} ${isCompleted && match.winnerId && match.winnerId !== match.team2Id ? 'loser' : ''}">
            ${_renderTeamSelect(match, tournament, 2)}
            <span class="match-team-score">${match.score2 !== null ? match.score2 : '-'}</span>
          </div>
        </div>
        <div class="match-actions">
          ${isCompleted ? `
            <span class="match-badge completed">✓ DONE</span>
            <button class="btn btn-ghost btn-sm" onclick="UI._handleResetMatch('${tournament.id}','${match.id}')">↩️</button>
          ` : isClickable ? `
            <button class="btn btn-primary btn-sm" onclick="UI._openScoreModal('${tournament.id}','${match.id}')">📝 NHẬP</button>
          ` : `
            <span class="match-badge pending">WAIT</span>
          `}
        </div>
      </div>
    `;
  }

  // ── Standings Tab ───────────────────────────────────────────

  function _renderTeamSelect(match, tournament, teamSlot) {
    const t = match[`team${teamSlot}Id`] ? _getTeamById(tournament, match[`team${teamSlot}Id`]) : null;
    
    // Only Admin can edit, and only pending matches of ROUND 1 in normal SE.
    // Inner rounds (> 1) are strictly auto-filled.
    // If it's a Group Stage tournament, ALL knockout matches are auto-filled, so disable dropdowns completely.
    const isGroupKnockout = tournament.format === 'group_stage' && !match.group;
    if (!Auth.isAdmin() || match.status !== 'pending' || match.round > 1 || isGroupKnockout) {
      return `<span class="bracket-team-name match-team-name" style="display:flex;align-items:center;gap:4px;">${t ? `${_renderAvatar(t)} ${_esc(t.name)}` : '???'}</span>`;
    }

    const currentTeamId = match[`team${teamSlot}Id`];
    let options = `<option value="">-- Trống --</option>`;
    tournament.teams.forEach(team => {
      options += `<option value="${team.id}" ${team.id === currentTeamId ? 'selected' : ''}>${_renderAvatar(team)} ${_esc(team.name)}</option>`;
    });

    return `
      <select class="form-input team-select-dropdown" style="padding:2px 4px; font-size:0.9rem; margin-right:8px; max-width:140px; background:var(--paper-dark); color:var(--text-primary); border-radius:4px; font-family:var(--font-body);" 
        onclick="event.stopPropagation()" 
        onchange="UI._updateMatchTeam('${tournament.id}', '${match.id}', ${teamSlot}, this.value)">
        ${options}
      </select>
    `;
  }

  function _updateMatchTeam(tournamentId, matchId, teamSlot, newTeamId) {
    const tournament = Storage.getById(tournamentId);
    if (!tournament) return;
    const match = tournament.matches.find(m => m.id === matchId);
    if (!match) return;

    match[`team${teamSlot}Id`] = newTeamId || null;
    Storage.save(tournament);
    showToast('Đã cập nhật đội thi đấu!', 'success');
    _renderTabContent(tournament);
  }

  // ── Standings Tab ───────────────────────────────────────────

  function _renderStandingsTab(tournament) {
    if (tournament.format === 'single_elimination') {
      return _renderSEProgress(tournament);
    } else if (tournament.format === 'group_stage') {
      return _renderGroupStandings(tournament);
    } else {
      return _renderStandingsTable(TournamentManager.getAllStandings(tournament));
    }
  }

  function _renderSEProgress(tournament) {
    const maxRound = Math.max(...tournament.matches.map(m => m.round));

    const teamProgress = tournament.teams.map(team => {
      const teamMatches = tournament.matches.filter(m =>
        (m.team1Id === team.id || m.team2Id === team.id) && m.status !== 'bye'
      );
      const completedMatches = teamMatches.filter(m => m.status === 'completed');
      const lastRound = completedMatches.length > 0 ? Math.max(...completedMatches.map(m => m.round)) : 0;
      const isChampion = tournament.champion === team.id;
      const wonLast = completedMatches.length > 0 && completedMatches.find(m => m.round === lastRound)?.winnerId === team.id;

      return {
        ...team,
        lastRound,
        eliminated: !wonLast && !isChampion && completedMatches.length > 0,
        isChampion,
        result: isChampion ? '🏆 CHAMPION' :
                lastRound === maxRound ? '🥈 Á quân' :
                lastRound > 0 ? `💀 OUT vòng ${lastRound}` : '⏳ Chưa thi đấu'
      };
    }).sort((a, b) => {
      if (a.isChampion) return -1;
      if (b.isChampion) return 1;
      return b.lastRound - a.lastRound;
    });

    let html = `
      <div class="standings-table-container">
        <table class="standings-table">
          <thead>
            <tr>
              <th class="center">#</th>
              <th>Đội</th>
              <th>Kết quả</th>
            </tr>
          </thead>
          <tbody>
    `;

    teamProgress.forEach((team, idx) => {
      html += `
        <tr>
          <td class="standings-rank ${idx < 3 ? 'rank-' + (idx + 1) : ''}">${idx + 1}</td>
          <td>
            <div class="standings-team">
              <div class="standings-team-avatar" style="background:${team.color}">${_renderAvatar(team)}</div>
              <span class="standings-team-name">${_esc(team.name)}</span>
            </div>
          </td>
          <td style="${team.isChampion ? 'color:var(--neon-yellow);font-weight:800;text-shadow:0 0 8px rgba(255,230,0,0.4)' : ''}">${team.result}</td>
        </tr>
      `;
    });

    html += '</tbody></table></div>';
    return html;
  }

  function _renderGroupStandings(tournament) {
    const groupStandings = TournamentManager.getGroupStandings(tournament);
    let html = '';

    Object.keys(groupStandings).sort().forEach(groupName => {
      html += `
        <div class="group-section">
          <div class="group-title"><span class="group-badge">BẢNG ${groupName}</span></div>
          ${_renderStandingsTable(groupStandings[groupName])}
        </div>
      `;
    });

    return html;
  }

  function _renderStandingsTable(standings) {
    if (!standings.length) return '<p class="text-muted">Chưa có dữ liệu</p>';

    return `
      <div class="standings-table-container">
        <table class="standings-table">
          <thead>
            <tr>
              <th class="center">#</th>
              <th>Đội</th>
              <th class="center">Trận</th>
              <th class="center">W</th>
              <th class="center">D</th>
              <th class="center">L</th>
              <th class="center">BT</th>
              <th class="center">BB</th>
              <th class="center">HS</th>
              <th class="center">PTS</th>
            </tr>
          </thead>
          <tbody>
            ${standings.map((s, idx) => `
              <tr>
                <td class="standings-rank ${idx < 3 ? 'rank-' + (idx + 1) : ''}">${idx + 1}</td>
                <td>
                  <div class="standings-team">
                    <div class="standings-team-avatar" style="background:${s.teamColor}">${s.teamEmoji}</div>
                    <span class="standings-team-name">${_esc(s.teamName)}</span>
                  </div>
                </td>
                <td class="center">${s.played}</td>
                <td class="center" style="color:var(--neon-green);text-shadow:0 0 5px rgba(0,255,136,0.3)">${s.won}</td>
                <td class="center">${s.drawn}</td>
                <td class="center" style="color:var(--neon-magenta)">${s.lost}</td>
                <td class="center">${s.gf}</td>
                <td class="center">${s.ga}</td>
                <td class="center" style="color:${s.gd > 0 ? 'var(--neon-green)' : s.gd < 0 ? 'var(--neon-magenta)' : 'var(--text-muted)'}">${s.gd > 0 ? '+' : ''}${s.gd}</td>
                <td class="center standings-points">${s.points}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ── Score Modal ─────────────────────────────────────────────

  function _openScoreModal(tournamentId, matchId) {
    const tournament = Storage.getById(tournamentId);
    const match = tournament.matches.find(m => m.id === matchId);
    if (!match) return;

    const t1 = _getTeamById(tournament, match.team1Id);
    const t2 = _getTeamById(tournament, match.team2Id);
    if (!t1 || !t2) return;

    const isSE = tournament.format === 'single_elimination';

    const content = `
      <div class="modal-header">
        <span class="modal-title">⚔️ NHẬP KẾT QUẢ</span>
        <button class="modal-close" onclick="UI.hideModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="score-input-group">
          <div class="score-team">
            <span class="score-team-emoji">${_renderAvatar(t1)}</span>
            <div class="score-team-name">${_esc(t1.name)}</div>
            <input type="number" class="score-input" id="score-1" min="0" max="999" value="0"
              onfocus="this.select()">
          </div>
          <div class="score-vs">VS</div>
          <div class="score-team">
            <span class="score-team-emoji">${_renderAvatar(t2)}</span>
            <div class="score-team-name">${_esc(t2.name)}</div>
            <input type="number" class="score-input" id="score-2" min="0" max="999" value="0"
              onfocus="this.select()">
          </div>
        </div>

        ${isSE ? `
          <div class="winner-selector hidden" id="winner-selector">
            <p>⚠️ Hòa! Chọn đội thắng (penalty / overtime):</p>
            <div class="winner-options">
              <button class="winner-option" data-winner="${t1.id}" onclick="UI._selectWinner(this)">
                ${_renderAvatar(t1)} ${_esc(t1.name)}
              </button>
              <button class="winner-option" data-winner="${t2.id}" onclick="UI._selectWinner(this)">
                ${_renderAvatar(t2)} ${_esc(t2.name)}
              </button>
            </div>
          </div>
        ` : ''}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="UI.hideModal()">HỦY</button>
        <button class="btn btn-primary" onclick="UI._handleSaveScore('${tournamentId}','${matchId}', ${isSE})">💾 XÁC NHẬN</button>
      </div>
    `;

    showModal(content);

    if (isSE) {
      const s1 = document.getElementById('score-1');
      const s2 = document.getElementById('score-2');
      const checkTie = () => {
        const selector = document.getElementById('winner-selector');
        if (selector) {
          if (s1.value === s2.value) {
            selector.classList.remove('hidden');
          } else {
            selector.classList.add('hidden');
          }
        }
      };
      s1.addEventListener('input', checkTie);
      s2.addEventListener('input', checkTie);
    }
  }

  let _selectedWinner = null;

  function _selectWinner(el) {
    document.querySelectorAll('.winner-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    _selectedWinner = el.dataset.winner;
  }

  function _handleSaveScore(tournamentId, matchId, isSE) {
    const s1 = parseInt(document.getElementById('score-1').value) || 0;
    const s2 = parseInt(document.getElementById('score-2').value) || 0;

    if (isSE && s1 === s2) {
      if (!_selectedWinner) {
        showToast('Hòa! Chọn đội thắng penalty', 'error');
        return;
      }
    }

    const winnerId = (isSE && s1 === s2) ? _selectedWinner : null;
    TournamentManager.updateMatchResult(tournamentId, matchId, s1, s2, winnerId);
    _selectedWinner = null;

    hideModal();
    showToast('Kết quả đã được ghi nhận! ⚡', 'success');
    renderTournamentDetail(tournamentId);
  }

  function _handleResetMatch(tournamentId, matchId) {
    showModal(`
      <div class="modal-header">
        <span class="modal-title">↩️ HỦY KẾT QUẢ</span>
        <button class="modal-close" onclick="UI.hideModal()">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size:1rem">Bạn có chắc muốn hủy kết quả trận đấu này?</p>
        <p class="text-muted mt-1" style="font-size:0.85rem">⚠️ Với thể thức loại trực tiếp, các trận sau cũng sẽ bị hủy.</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="UI.hideModal()">KHÔNG</button>
        <button class="btn btn-danger" onclick="UI._confirmResetMatch('${tournamentId}','${matchId}')">XÁC NHẬN HỦY</button>
      </div>
    `);
  }

  function _confirmResetMatch(tournamentId, matchId) {
    TournamentManager.resetMatch(tournamentId, matchId);
    hideModal();
    showToast('Đã hủy kết quả trận đấu', 'info');
    renderTournamentDetail(tournamentId);
  }

  // ── Delete Tournament ───────────────────────────────────────

  function _confirmDeleteTournament(id) {
    showModal(`
      <div class="modal-header">
        <span class="modal-title">💀 XÓA GIẢI ĐẤU</span>
        <button class="modal-close" onclick="UI.hideModal()">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size:1rem">Bạn có chắc muốn xóa giải đấu này?</p>
        <p class="text-muted mt-1" style="font-size:0.85rem">⚠️ Hành động này không thể hoàn tác.</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="UI.hideModal()">GIỮ LẠI</button>
        <button class="btn btn-danger" onclick="UI._executeDeleteTournament('${id}')">💀 XÓA VĨNH VIỄN</button>
      </div>
    `);
  }

  function _executeDeleteTournament(id) {
    TournamentManager.deleteTournament(id);
    hideModal();
    showToast('Giải đấu đã bị hủy diệt! 💀', 'info');
    App.navigate('#/');
  }

  // ── Modal ───────────────────────────────────────────────────

  function showModal(contentHTML) {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal-content');
    modal.innerHTML = contentHTML;
    overlay.classList.add('visible');
  }

  function hideModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('visible');
    _selectedWinner = null;
  }

  // ── Toast ───────────────────────────────────────────────────

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || ''}</span> ${_esc(message)}`;

    toast.style.animationDuration = '3s';
    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 3000);
  }

  // ── Stats Page ──────────────────────────────────────────────

  function renderStatsPage() {
    const all = Storage.getAll();
    const total     = all.length;
    const live      = all.filter(t => t.status === 'in_progress').length;
    const completed = all.filter(t => t.status === 'completed').length;
    const draft     = all.filter(t => t.status === 'draft').length;
    const totalTeams  = all.reduce((s, t) => s + t.teams.length, 0);
    const totalMatches = all.reduce((s, t) => s + (t.matches ? t.matches.filter(m => m.status !== 'bye').length : 0), 0);
    const doneMatches  = all.reduce((s, t) => s + (t.matches ? t.matches.filter(m => m.status === 'completed').length : 0), 0);

    // Format breakdown
    const formatCount = { single_elimination: 0, round_robin: 0, group_stage: 0 };
    all.forEach(t => { if (formatCount[t.format] !== undefined) formatCount[t.format]++; });

    // Recent champions
    const champions = all
      .filter(t => t.champion)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    getApp().innerHTML = `
      <div class="animate-in">
        <h1 style="font-size:2.5rem;margin-bottom:0.5rem">📊 THỐNG KÊ</h1>
        <p style="color:rgba(255,255,255,0.5);margin-bottom:2rem">Tổng quan toàn bộ hoạt động giải đấu</p>

        <div class="stats-grid" style="margin-bottom:1.5rem">
          <div class="stat-card stat-card--blue">
            <div class="stat-icon sticker-icon">🎮</div>
            <span class="stat-value">${total}</span><span class="stat-label">Tổng giải đấu</span>
          </div>
          <div class="stat-card stat-card--orange">
            <div class="stat-icon sticker-icon">🔥</div>
            <span class="stat-value">${live}</span><span class="stat-label">Đang diễn ra</span>
          </div>
          <div class="stat-card stat-card--yellow">
            <div class="stat-icon sticker-icon">⚔️</div>
            <span class="stat-value">${totalTeams}</span><span class="stat-label">Tổng đội</span>
          </div>
          <div class="stat-card stat-card--red">
            <div class="stat-icon sticker-icon">📋</div>
            <span class="stat-value">${doneMatches}</span><span class="stat-label">Trận đã đấu</span>
          </div>
        </div>

        <!-- Format breakdown -->
        <div class="form-card" style="margin-bottom:1.5rem">
          <h3 style="font-size:1.5rem;margin-bottom:1rem">📐 Thể thức phổ biến</h3>
          ${[['single_elimination','⚡ Loại trực tiếp','#6c63ff'],['round_robin','🔄 Vòng tròn','#f37825'],['group_stage','📋 Chia bảng','#fed035']].map(([key, label, color]) => {
            const cnt = formatCount[key];
            const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
            return `
              <div style="margin-bottom:1rem">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-weight:700">
                  <span>${label}</span><span style="color:${color}">${cnt} giải (${pct}%)</span>
                </div>
                <div class="tc-progress-bar">
                  <div class="tc-progress-fill" style="width:${pct}%;background:${color};box-shadow:0 0 8px ${color}40"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Match progress -->
        <div class="form-card" style="margin-bottom:1.5rem">
          <h3 style="font-size:1.5rem;margin-bottom:0.75rem">📈 Tiến độ thi đấu</h3>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-weight:700">
            <span>Trận hoàn thành</span><span style="color:#6c63ff">${doneMatches}/${totalMatches}</span>
          </div>
          <div class="tc-progress-bar" style="height:14px;border-radius:7px">
            <div class="tc-progress-fill ${doneMatches===totalMatches&&totalMatches>0?'done':''}" style="width:${totalMatches>0?Math.round(doneMatches/totalMatches*100):0}%"></div>
          </div>
        </div>

        <!-- Recent champions -->
        ${champions.length > 0 ? `
          <div class="form-card">
            <h3 style="font-size:1.5rem;margin-bottom:1rem">🏆 Nhà vô địch gần đây</h3>
            <div class="teams-list">
              ${champions.map(t => {
                const champ = _getTeamById(t, t.champion);
                return champ ? `
                  <div class="team-item">
                    <div class="team-avatar" style="background:${champ.color}">${_renderAvatar(champ)}</div>
                    <div style="flex:1;padding:0 0.75rem">
                      <div style="font-weight:700;font-size:1.1rem">${_esc(champ.name)}</div>
                      <div style="font-size:0.8rem;color:rgba(255,255,255,0.5)">${_esc(t.name)}</div>
                    </div>
                    <div style="color:#fed035;font-size:1.5rem">🏆</div>
                  </div>
                ` : '';
              }).join('')}
            </div>
          </div>
        ` : ''}

        <div style="margin-top:1.5rem;text-align:center">
          <a href="#/" class="btn btn-blue">← Về Chiến Trường</a>
        </div>
      </div>
    `;
  }

  // ── Search Page ─────────────────────────────────────────────

  function renderSearchPage() {
    _filterStatus = 'all';
    _searchQuery = '';
    _sortBy = 'newest';
    renderDashboard();
    setTimeout(() => {
      const el = document.getElementById('search-input');
      if (el) { el.focus(); el.select(); }
    }, 100);
  }

  // ── Public API ──────────────────────────────────────────────

  // ── Auth Methods ────────────────────────────────────────────────
  
  function updateAuthUI() {
    const authSection = document.getElementById('auth-section');
    const createNavBtn = document.getElementById('nav-create-btn');
    const bnavCreate = document.getElementById('bnav-create');
    const currentUser = Auth.getCurrentUser();
    
    if (authSection) {
      if (currentUser) {
        authSection.innerHTML = `
          <div style="display:flex; align-items:center; gap:0.5rem;">
            ${currentUser.role === 'admin' ? '<a href="#/admin-theme" class="btn btn-yellow btn-sm" style="padding: 0.2rem 0.5rem; font-size: 0.9rem;">🎨 Tùy chỉnh Theme</a>' : ''}
            <a href="#/profile" class="btn btn-blue btn-sm" style="padding: 0.3rem 0.8rem; font-size: 1rem; border-radius: 8px;">
              ${currentUser.role === 'admin' ? '👑' : '👤'} ${currentUser.username}
            </a>
            <button class="btn btn-danger btn-sm" onclick="UI._handleLogout()">Thoát</button>
          </div>
        `;
      } else {
        authSection.innerHTML = `
          <button class="btn btn-yellow btn-sm" onclick="UI._openAuthModal()">Đăng nhập</button>
        `;
      }
    }
    
    // Toggle Create buttons
    const isAdmin = Auth.isAdmin();
    if (createNavBtn) createNavBtn.style.display = isAdmin ? 'inline-block' : 'none';
    if (bnavCreate) bnavCreate.style.display = isAdmin ? 'flex' : 'none';
  }

  function _openAuthModal() {
    const html = `
      <div class="modal-header">
        <h3 class="modal-title">🔐 ĐĂNG NHẬP / ĐĂNG KÝ</h3>
        <button class="modal-close" onclick="UI.hideModal()">×</button>
      </div>
      <div class="modal-body">
        <p style="color:var(--text-muted); margin-bottom:1rem; font-size:0.9rem;">
          Mặc định đã có tài khoản:<br>
          - <b>admin</b> / pass: 123 (Có quyền Tạo Giải)<br>
          - <b>player</b> / pass: 123 (Chỉ xem)
        </p>
        <div class="form-group">
          <label class="form-label">Tài khoản</label>
          <input type="text" class="form-input" id="auth-username" placeholder="Nhập tên đăng nhập">
        </div>
        <div class="form-group">
          <label class="form-label">Mật khẩu</label>
          <input type="password" class="form-input" id="auth-password" placeholder="Nhập mật khẩu">
        </div>
        <div class="form-actions" style="margin-top:1.5rem;">
          <button class="btn btn-yellow" onclick="UI._handleAuth('register')">Đăng ký mới</button>
          <button class="btn btn-green" onclick="UI._handleAuth('login')">🚀 Đăng nhập</button>
        </div>
      </div>
    `;
    showModal(html);
  }

  function _handleAuth(action) {
    const un = document.getElementById('auth-username').value.trim();
    const pw = document.getElementById('auth-password').value.trim();
    if(!un || !pw) return showToast('Vui lòng nhập đủ thông tin!', 'error');

    if (action === 'login') {
      if (Auth.login(un, pw)) {
        showToast(`Đăng nhập thành công! Chào ${un}`, 'success');
        hideModal();
        updateAuthUI();
        window.location.reload();
      } else {
        showToast('Tài khoản hoặc mật khẩu không đúng!', 'error');
      }
    } else {
      if (Auth.register(un, pw)) {
        showToast(`Đăng ký thành công! Chào ${un}`, 'success');
        hideModal();
        updateAuthUI();
        window.location.reload();
      } else {
        showToast('Tài khoản đã tồn tại!', 'error');
      }
    }
  }

  function _handleLogout() {
    Auth.logout();
  }

  function renderProfilePage() {
    const user = Auth.getCurrentUser();
    if (!user) {
      window.location.hash = '#/';
      return;
    }

    const balanceStr = new Intl.NumberFormat('vi-VN').format(user.balance || 0);
    const avatarSrc = user.avatar || 'img/icon-play.png';
    
    getApp().innerHTML = `
      <div class="dashboard animate-in">
        <div class="brawl-profile-container" style="display: flex; height: 70vh; min-height: 480px; max-height: 650px; border-radius: 12px; overflow: visible; box-shadow: 0 10px 30px rgba(0,0,0,0.8); background: #262c5b; border: 4px solid #141634; margin: 0 auto; max-width: 900px; position: relative;">
          <button onclick="window.location.hash='#/'" style="position: absolute; top: -15px; right: -15px; width: 44px; height: 44px; background: #e32636; border: 3px solid #141634; border-radius: 8px; color: white; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: inset 0 -3px 0 rgba(0,0,0,0.3), 0 4px 0 #141634; z-index: 20; text-shadow: var(--text-outline); -webkit-text-stroke: 0; padding-bottom: 2px;">✖</button>
          <!-- Left Side: Character / Big Avatar -->
          <div style="flex: 1.2; background: linear-gradient(180deg, #00d2ff 0%, #3a7bd5 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; border-right: 4px solid #141634; position: relative; border-radius: 8px 0 0 8px;">
            <div style="font-family: var(--font-header); font-size: 2.5rem; position: absolute; top: 1rem; left: 1rem; color: white; -webkit-text-stroke: 0; text-shadow: var(--text-outline);">PROFILE</div>
            
            <!-- User can click this huge area or the avatar to upload an image -->
            <div class="brawl-avatar-upload" onclick="document.getElementById('avatar-upload').click()" style="width: 250px; height: 250px; border-radius: 50%; border: 6px solid #141634; overflow: hidden; cursor: pointer; box-shadow: 0 10px 0 rgba(0,0,0,0.3); background: #141634; position: relative; display: flex; align-items: center; justify-content: center;">
              <img id="profile-big-avatar" src="${avatarSrc}" style="width: 100%; height: 100%; object-fit: cover;">
              <div style="position: absolute; bottom: 15px; background: rgba(0,0,0,0.7); color: white; padding: 5px 15px; border-radius: 20px; font-family: var(--font-header); font-size: 1.2rem;">📸 UPLOAD</div>
            </div>
            <input type="file" id="avatar-upload" accept="image/*" style="display:none;" onchange="UI._handleAvatarUpload(event)">
            
            <div style="margin-top: 2.5rem; background: #141634; color: white; padding: 0.5rem 2rem; border-radius: 20px; font-family: var(--font-header); font-size: 1.5rem; -webkit-text-stroke: 0; text-shadow: var(--text-outline);">
              HỒ SƠ CỦA ${_esc(user.username)}
            </div>
          </div>

          <!-- Right Side: Stats -->
          <div style="flex: 2; background: linear-gradient(180deg, #3c428e 0%, #292d64 100%); padding: 2rem; display: flex; flex-direction: column; position: relative; border-radius: 0 8px 8px 0;">
            
            <!-- Top row: Avatar + Name + Trophy -->
            <div style="display: flex; gap: 1.5rem; align-items: center; margin-bottom: 2rem;">
              <div style="width: 100px; height: 100px; border: 4px solid #141634; border-radius: 12px; overflow: hidden; background: #141634; flex-shrink: 0; box-shadow: inset 0 2px 0 rgba(255,255,255,0.4), 0 4px 0 #141634;">
                <img id="profile-small-avatar" src="${avatarSrc}" style="width: 100%; height: 100%; object-fit: cover;">
              </div>
              
              <div style="flex: 1;">
                <!-- Editable Username -->
                <div style="display: flex; align-items: center; gap: 0.5rem; background: #1f2345; padding: 0.4rem 1rem; border: 3px solid #141634; border-radius: 8px; margin-bottom: 0.5rem; box-shadow: inset 0 2px 0 rgba(255,255,255,0.1), 0 4px 0 #141634;">
                  <span style="font-size: 1.6rem; filter: drop-shadow(0 2px 0 #141634); display: flex; align-items: center;">${user.role === 'admin' ? '👑' : '🪄'}</span>
                  <input type="text" id="prof-username" value="${_esc(user.username)}" style="background: transparent; border: none; outline: none; color: white; font-family: var(--font-header); font-size: 1.8rem; width: 100%; -webkit-text-stroke:0; text-shadow: var(--text-outline); line-height: 1;">
                  <button onclick="UI._handleUpdateProfileName()" style="background: #39e639; border: 2px solid #141634; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 0 #141634; flex-shrink: 0; padding-bottom: 2px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; filter: drop-shadow(0 2px 0 rgba(0,0,0,0.3));"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </button>
                </div>
                
                <!-- Trophy Bar -->
                <div style="background: linear-gradient(180deg, #ffdf00 0%, #ff9500 100%); border: 3px solid #141634; border-radius: 6px; padding: 0.2rem 1rem; display: flex; align-items: center; gap: 0.5rem; box-shadow: inset 0 2px 0 rgba(255,255,255,0.4), 0 4px 0 #141634;">
                  <span style="font-size: 1.6rem; filter: drop-shadow(0 2px 0 rgba(0,0,0,0.6)); display: flex; align-items: center; justify-content: center; line-height: 1;">🏆</span>
                  <span style="font-family: var(--font-header); font-size: 1.5rem; color: white; -webkit-text-stroke:0; text-shadow: var(--text-outline); display: flex; align-items: center; line-height: 1; padding-top: 2px;">${user.balance || 0} PTS</span>
                </div>
              </div>
            </div>
            
            <!-- Stats Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.8rem; margin-bottom: 2rem;">
              ${_renderProfileStat('VAI TRÒ', '🛡️', user.role.toUpperCase())}
              ${_renderProfileStat('GIẢI ĐÃ TẠO', '🏆', Storage.getAll().length)}
              ${_renderProfileStat('ĐỘI ĐÃ THÊM', '⚔️', Storage.getAll().reduce((sum, t) => sum + t.teams.length, 0))}
              ${_renderProfileStat('TRẬN HOÀN THÀNH', '💀', Storage.getAll().reduce((sum, t) => sum + t.matches.filter(m => m.status === 'completed').length, 0))}
              ${_renderProfileStat('TỔNG BÀN THẮNG', '⚽', '3534')}
              ${_renderProfileStat('NGÀY THAM GIA', '📅', 'Hôm nay')}
            </div>
            
            <!-- Club / Info -->
            <div style="background: #1f2345; border: 3px solid #141634; border-radius: 8px; padding: 0.8rem 1rem; display: flex; align-items: center; gap: 1rem; margin-bottom: auto; box-shadow: 0 4px 0 #141634;">
              <div style="font-size: 2.8rem; filter: drop-shadow(0 2px 0 #141634); display: flex; align-items: center; line-height: 1;">👑</div>
              <div style="display: flex; flex-direction: column; justify-content: center;">
                <div style="font-family: var(--font-header); font-size: 1.6rem; color: white; -webkit-text-stroke:0; text-shadow: var(--text-outline); line-height: 1;">Arena Club</div>
                <div style="font-weight: bold; color: #8e8c95; font-size: 1.1rem; line-height: 1; margin-top: 0.3rem;">Thành viên ${user.role === 'admin' ? 'Sáng lập' : 'Cấp cao'}</div>
              </div>
            </div>
            
            <!-- Logout / Save buttons -->
            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
              <button class="btn btn-blue" style="flex: 1;" onclick="UI._openDepositModal()">💎 NẠP TIỀN</button>
              <button class="btn btn-danger" style="flex: 1;" onclick="UI._handleLogout()">🚪 ĐĂNG XUẤT</button>
            </div>
            
          </div>
        </div>
      </div>
    `;
  }

  function _renderProfileStat(title, icon, value) {
    return `
      <div style="text-align: center;">
        <div style="font-family: var(--font-header); font-size: 0.85rem; color: white; -webkit-text-stroke:0; text-shadow: var(--text-outline); margin-bottom: 0.2rem; text-transform: uppercase;">${title}</div>
        <div style="background: #141634; border-radius: 6px; padding: 0.35rem 0.5rem; display: flex; align-items: center; justify-content: center; gap: 0.4rem; box-shadow: inset 0 2px 0 rgba(255,255,255,0.1);">
          <span style="font-size: 1.3rem; display: flex; align-items: center; line-height: 1; filter: drop-shadow(0 2px 0 rgba(0,0,0,0.8)); margin-bottom: 2px;">${icon}</span>
          <span style="font-family: var(--font-header); font-size: 1.3rem; color: white; -webkit-text-stroke:0; text-shadow: var(--text-outline); display: flex; align-items: center; line-height: 1; padding-top: 2px;">${value}</span>
        </div>
      </div>
    `;
  }

  function _handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check size limit (e.g., 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('Ảnh quá lớn, vui lòng chọn ảnh < 2MB', 'error');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64 = e.target.result;
      if (Auth.updateProfile({ avatar: base64 })) {
        document.getElementById('profile-big-avatar').src = base64;
        document.getElementById('profile-small-avatar').src = base64;
        updateAuthUI();
        showToast('Cập nhật ảnh đại diện thành công!', 'success');
      }
    };
    reader.readAsDataURL(file);
  }

  function _handleUpdateProfileName() {
    const newUsername = document.getElementById('prof-username').value.trim();
    if (!newUsername) {
      showToast('Tên hiển thị không được để trống!', 'error');
      return;
    }
    if (Auth.updateProfile({ username: newUsername })) {
      showToast('Đã lưu tên hiển thị mới!', 'success');
      updateAuthUI();
      // Render again to update top header if needed, but the input is already there
    } else {
      showToast('Lỗi cập nhật tên!', 'error');
    }
  }

  function _openDepositModal() {
    const html = `
      <div class="modal-header" style="justify-content: center; border-bottom: none;">
        <h2 class="modal-title" style="color: var(--bs-yellow); font-size: 2.2rem; -webkit-text-stroke: 1px #141634; text-shadow: 2px 3px 0 #141634;">💎 NẠP TIỀN</h2>
        <button onclick="UI.hideModal()" style="position: absolute; top: -15px; right: -15px; width: 44px; height: 44px; background: #e32636; border: 3px solid #141634; border-radius: 8px; color: white; font-size: 1.5rem; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: inset 0 -3px 0 rgba(0,0,0,0.3), 0 4px 0 #141634; z-index: 20; text-shadow: var(--text-outline); -webkit-text-stroke: 0; padding-bottom: 2px;">✖</button>
      </div>
      
      <div class="brawl-scroll" style="max-height: 55vh; overflow-y: auto; padding-right: 0.5rem;">
        <div style="text-align: center; margin-bottom: 0.5rem;">
          
          <!-- Khung 1: Chọn mệnh giá -->
          <div style="background: linear-gradient(180deg, #00d2ff 0%, #3a7bd5 100%); padding: 1.2rem; border-radius: 12px; border: 4px solid #141634; box-shadow: inset 0 2px 0 rgba(255,255,255,0.1), 0 6px 0 #141634; margin-bottom: 1.5rem;">
            <p style="font-family: var(--font-header); font-size: 1.3rem; color: white; -webkit-text-stroke: 0; text-shadow: var(--text-outline); margin-bottom: 1rem; text-transform: uppercase;">1. Chọn mệnh giá</p>
            
            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 0.6rem; margin-bottom: 1rem;">
              <button class="btn btn-blue" onclick="UI._generateDepositQR(20000)">20K</button>
              <button class="btn btn-blue" onclick="UI._generateDepositQR(50000)">50K</button>
              <button class="btn btn-blue" onclick="UI._generateDepositQR(100000)">100K</button>
              <button class="btn btn-blue" onclick="UI._generateDepositQR(200000)">200K</button>
              <button class="btn btn-blue" onclick="UI._generateDepositQR(500000)">500K</button>
            </div>

            <div style="display: flex; justify-content: center; gap: 0.5rem; margin-top: 1rem;">
              <input type="number" id="deposit-custom-amount" class="form-input" placeholder="Nhập số khác..." style="max-width: 160px; text-align: center; font-family: var(--font-header); font-size: 1.2rem; margin: 0; border: 3px solid #141634;">
              <button class="btn btn-green" onclick="UI._generateDepositQR(document.getElementById('deposit-custom-amount').value)">Tạo Mã</button>
            </div>
          </div>

          <!-- Khung 2: Hiển thị QR -->
          <div id="deposit-qr-container" style="display: none; background: linear-gradient(180deg, #3c428e 0%, #292d64 100%); padding: 1.2rem; border-radius: 12px; border: 4px solid var(--border-black); box-shadow: 0 6px 0 rgba(0,0,0,0.5); margin-left: auto; margin-right: auto; max-width: 300px; position: relative;">
            <p style="font-family: var(--font-header); font-size: 1.3rem; color: var(--bs-yellow); -webkit-text-stroke: 0; text-shadow: var(--text-outline); margin-bottom: 1rem; text-transform: uppercase;">2. Quét mã QR</p>
            
            <div style="background: white; padding: 0.5rem; border-radius: 8px; display: inline-block; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);">
              <img id="deposit-qr-image" src="" alt="QR Code Thanh Toán" style="width: 100%; max-width: 240px; height: auto; display: block; border-radius: 4px;">
            </div>
            
            <div style="color: var(--bs-green); font-weight: bold; font-family: var(--font-header); margin-top: 1rem; font-size: 2.2rem; -webkit-text-stroke: 1px #141634; text-shadow: 2px 3px 0 #141634;" id="deposit-amount-text"></div>
            
            <button id="confirm-deposit-btn" class="btn btn-special" style="margin-top: 1rem; width: 100%; font-size: 1.2rem; padding: 0.8rem;" onclick="">XÁC NHẬN CHUYỂN KHOẢN</button>
          </div>

        </div>
      </div>
    `;
    showModal(html);
  }

  function _generateDepositQR(amount) {
    const num = parseInt(amount);
    if (!num || num < 10000) {
      showToast('Số tiền tối thiểu là 10.000đ!', 'error');
      return;
    }
    
    const user = Auth.getCurrentUser();
    const username = user ? user.username : 'GUEST';
    
    // Config MB Bank info for VietQR
    const BANK_ID = 'MB';
    const ACCOUNT_NO = '11102372006';
    const ACCOUNT_NAME = 'HOANG GIA KHANH';
    
    // Create addInfo
    const cleanName = username.replace(/[^a-zA-Z0-9]/g, '');
    const addInfo = `NAPTIEN${cleanName}`;
    
    // Generate dynamic QR using VietQR API
    const qrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.jpg?amount=${num}&addInfo=${addInfo}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;
    
    document.getElementById('deposit-qr-image').src = qrUrl;
    document.getElementById('deposit-qr-container').style.display = 'block';
    
    const moneyStr = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
    document.getElementById('deposit-amount-text').innerText = moneyStr;
    
    document.getElementById('confirm-deposit-btn').setAttribute('onclick', `UI._handleDeposit(${num})`);
    
    // Tự động cuộn xuống dưới cùng để thấy rõ QR code
    setTimeout(() => {
      document.getElementById('deposit-qr-container').scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  }

  function _handleDeposit(amount) {
    if (Auth.updateBalance(amount)) {
      const amountStr = new Intl.NumberFormat('vi-VN').format(amount);
      showToast('Đã nạp thành công ' + amountStr + 'đ!', 'success');
      hideModal();
      renderProfilePage();
      triggerConfetti();
    }
  }

  function _openDonateModal() {
    const user = Auth.getCurrentUser();
    const balanceStr = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(user.balance || 0);
    const html = `
      <div class="modal-header">
        <h2 class="modal-title" style="color: #ff5cfa;">💖 DONATE ADMIN</h2>
        <button class="modal-close" onclick="UI.hideModal()">×</button>
      </div>
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <p style="font-family: var(--font-body); font-weight: 700; margin-bottom: 0.5rem; color: rgba(255,255,255,0.8);">Cảm ơn bạn đã ủng hộ để duy trì dự án ARENA!</p>
        <p style="color: var(--bs-green); font-family: var(--font-header); font-size: 1.4rem; -webkit-text-stroke: var(--text-stroke-light);">Số dư hiện tại: ${balanceStr}</p>
        
        <div class="form-group" style="text-align: left; margin-top: 1.5rem;">
          <label class="form-label" style="font-size: 1.2rem;">Nhập số tiền muốn quyên góp (VNĐ):</label>
          <input type="number" id="donate-amount" class="form-input" placeholder="Ví dụ: 50000" min="1000" step="1000">
        </div>
      </div>
      <div style="display: flex; gap: 0.5rem;">
        <button class="btn btn-ghost" style="flex:1;" onclick="UI.hideModal()">HỦY</button>
        <button class="btn btn-special" style="flex:1;" onclick="UI._handleDonate()">GỬI DONATE</button>
      </div>
    `;
    showModal(html);
  }

  function _handleDonate() {
    const input = document.getElementById('donate-amount');
    if (!input) return;
    const amount = parseInt(input.value);
    
    if (isNaN(amount) || amount <= 0) {
      showToast('Vui lòng nhập số tiền hợp lệ!', 'error');
      return;
    }
    
    const user = Auth.getCurrentUser();
    if ((user.balance || 0) < amount) {
      showToast('Số dư không đủ! Vui lòng nạp thêm.', 'error');
      return;
    }
    
    if (Auth.updateBalance(-amount)) {
      const amountStr = new Intl.NumberFormat('vi-VN').format(amount);
      showToast('Cảm ơn bạn đã donate ' + amountStr + 'đ! ❤️', 'success');
      hideModal();
      renderProfilePage();
      
      setTimeout(triggerConfetti, 100);
      setTimeout(triggerConfetti, 300);
      setTimeout(triggerConfetti, 500);
    }
  }

  // ─────────────────────────────────────────────────────────────────

  const AudioEngine = (() => {
    let audioCtx = null;
    function init() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    function playClick() {
      if(!audioCtx) return;
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
      } catch(e) {}
    }
    return { init, playClick };
  })();

  document.addEventListener('click', () => AudioEngine.init(), {once:true});
  document.addEventListener('click', (e) => {
    if (e.target.closest('.btn, .filter-chip, .tab, .nav-link, .emoji-opt, .format-card, .bracket-match')) {
      AudioEngine.playClick();
    }
  });

  function triggerConfetti() {
    if (typeof confetti !== 'undefined') {
      var duration = 3000;
      var end = Date.now() + duration;
      (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#ff0f7b', '#f89b29', '#fed035', '#59d538'] });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#ff0f7b', '#f89b29', '#fed035', '#59d538'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      }());
    }
  }

  function _getTeamStats(teamName) {
    const all = Storage.getAll();
    let wins = 0, trophies = 0;
    all.forEach(tour => {
      const localTeam = tour.teams.find(t => t.name.trim().toLowerCase() === teamName.trim().toLowerCase());
      if (!localTeam) return;
      tour.matches.forEach(m => {
        if (m.status === 'completed' && m.winnerId === localTeam.id) wins++;
      });
      if (tour.status === 'completed' && tour.championId === localTeam.id) trophies++;
    });
    return { wins, trophies };
  }

  function _getTeamRankBadge(teamName) {
    const stats = _getTeamStats(teamName);
    const score = stats.wins + (stats.trophies * 5);
    if (score >= 20) return `<span class="rank-badge rank-legendary" title="Huyền Thoại (${score} Đ)">🌟 Huyền Thoại</span>`;
    if (score >= 10) return `<span class="rank-badge rank-mythic" title="Cao Thủ (${score} Đ)">🔥 Cao Thủ</span>`;
    if (score >= 5)  return `<span class="rank-badge rank-gold" title="Vàng (${score} Đ)">🥇 Vàng</span>`;
    if (score >= 2)  return `<span class="rank-badge rank-silver" title="Bạc (${score} Đ)">🥈 Bạc</span>`;
    return `<span class="rank-badge rank-bronze" title="Đồng (${score} Đ)">🥉 Đồng</span>`;
  }

  return {
    renderDashboard,
    renderCreateForm,
    renderTournamentDetail,
    renderStatsPage,
    renderSearchPage,
    renderProfilePage,
    renderAdminTheme,
    showToast,
    showModal,
    hideModal,
    updateAuthUI,
    _openAuthModal,
    _handleAuth,
    _handleLogout,
    _handleAvatarUpload,
    _handleUpdateProfileName,
    _handleSaveTheme,
    _selectThemeTarget,
    _updateThemePreview,
    _adjustThemeValue,
    _clearMainFont,
    _clearH3Font,
    _clearBodyFont,
    _selectFormat,
    _handleCreateTournament,
    _handleLogoUpload,
    _handleAddTeam,
    _handleRemoveTeam,
    _handleStartTournament,
    _switchTab,
    _drawWheel,
    _spinWheel,
    _wheelAction,
    _resetWheel,
    _updateMatchTeam,
    _openScoreModal,
    _selectWinner,
    _handleSaveScore,
    _handleResetMatch,
    _confirmResetMatch,
    _confirmDeleteTournament,
    _executeDeleteTournament,
    _handleSearch,
    _setFilter,
    _setSort,
    _clearFilters,
    _selectEmoji,
    _openDepositModal,
    _generateDepositQR,
    _handleDeposit,
    _openDonateModal,
    _handleDonate,
    triggerConfetti,
  };
})();






