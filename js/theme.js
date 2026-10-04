const ThemeManager = {
  defaultTheme: {
    fontName: '',
    fontBase64: '',
    h3FontName: '',
    h3FontBase64: '',
    bodyFontName: '',
    bodyFontBase64: '',
    bgBase64: '',
    strokeWidth: '1px',
    strokeColor: '#141634',
    shadowX: '2px',
    shadowY: '3px',
    shadowBlur: '0px',
    shadowColor: '#141634',
    h3StrokeWidth: '',
    h3StrokeColor: '',
    h3ShadowX: '',
    h3ShadowY: '',
    h3ShadowBlur: '',
    h3ShadowColor: '',
    bodyStrokeWidth: '',
    bodyStrokeColor: '',
    bodyShadowX: '',
    bodyShadowY: '',
    bodyShadowBlur: '',
    bodyShadowColor: ''
  },
  
  init() {
    this.applyTheme();
  },

  getTheme() {
    return JSON.parse(localStorage.getItem('brawl_theme')) || this.defaultTheme;
  },

  saveTheme(theme) {
    localStorage.setItem('brawl_theme', JSON.stringify(theme));
    this.applyTheme();
  },

  applyTheme() {
    const t = this.getTheme();
    let style = document.getElementById('dynamic-theme');
    if (!style) {
      style = document.createElement('style');
      style.id = 'dynamic-theme';
      document.head.appendChild(style);
    }

    let css = '';
    // Apply custom font if available
    if (t.fontBase64 && t.fontName) {
      css += `
        @font-face {
          font-family: 'CustomAdminFont';
          src: url(${t.fontBase64});
        }
        :root {
          --font-header: 'CustomAdminFont', 'SVN-Whimsy', cursive, sans-serif !important;
        }
      `;
    }

          // Apply custom H3 font if available
      if (t.h3FontBase64 && t.h3FontName) {
        css += `
          @font-face {
            font-family: 'CustomH3Font';
            src: url(${t.h3FontBase64});
          }
          h3, .empty-state h3 {
            font-family: 'CustomH3Font', 'SVN-Whimsy', cursive, sans-serif !important;
          }
        `;
      }

      // Apply custom body font if available
      if (t.bodyFontBase64 && t.bodyFontName) {
        css += `
          @font-face {
            font-family: 'CustomBodyFont';
            src: url(${t.bodyFontBase64});
          }
          :root {
            --font-body: 'CustomBodyFont', sans-serif !important;
          }
        `;
      }

      // Apply custom background if available
    if (t.bgBase64) {
      css += `
        body {
          background-image: url(${t.bgBase64}) !important;
        }
      `;
    }

    // Apply stroke and shadow text effects
    const h3SW = t.h3StrokeWidth || t.strokeWidth;
    const h3SC = t.h3StrokeColor || t.strokeColor;
    const h3SX = t.h3ShadowX || t.shadowX;
    const h3SY = t.h3ShadowY || t.shadowY;
    const h3SB = t.h3ShadowBlur || t.shadowBlur;
    const h3SHC = t.h3ShadowColor || t.shadowColor;
    
    const bodySW = t.bodyStrokeWidth || '0px';
    const bodySC = t.bodyStrokeColor || 'transparent';
    const bodySX = t.bodyShadowX || '0px';
    const bodySY = t.bodyShadowY || '0px';
    const bodySB = t.bodyShadowBlur || '0px';
    const bodySHC = t.bodyShadowColor || 'transparent';

    css += `
      h1, h2, .bs-header, .tournament-title, .modal-title, .dashboard-header h1, .section-title, .champion-name {
        -webkit-text-stroke: ${t.strokeWidth} ${t.strokeColor} !important;
        text-shadow: ${t.shadowX} ${t.shadowY} ${t.shadowBlur} ${t.shadowColor}, 0 6px 10px rgba(0,0,0,0.4) !important;
      }
      h3, .empty-state h3 {
        -webkit-text-stroke: ${h3SW} ${h3SC} !important;
        text-shadow: ${h3SX} ${h3SY} ${h3SB} ${h3SHC}, 0 6px 10px rgba(0,0,0,0.4) !important;
      }
      body, p, span, a, label, .stat-label, input, button, select {
        ${bodySW !== '0px' && bodySW !== '0' && bodySW !== '' ? `-webkit-text-stroke: ${bodySW} ${bodySC} !important;` : ''}
        ${bodySX !== '0px' && bodySX !== '0' && bodySX !== '' ? `text-shadow: ${bodySX} ${bodySY} ${bodySB} ${bodySHC} !important;` : ''}
      }
      .stat-value {
        -webkit-text-stroke: ${t.strokeWidth} ${t.strokeColor} !important;
        text-shadow: calc(${t.shadowX} + 1px) calc(${t.shadowY} + 1px) ${t.shadowBlur} ${t.shadowColor}, 0 6px 10px rgba(0,0,0,0.4) !important;
      }
    `;

    style.innerHTML = css;
  },
  
  resetTheme() {
    localStorage.removeItem('brawl_theme');
    this.applyTheme();
  }
};

ThemeManager.init();

