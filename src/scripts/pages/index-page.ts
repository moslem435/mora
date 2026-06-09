import { storage } from '../storage';
import { renderLucideIconsSafe } from '../ui/icons';

interface Widget {
  id: string;
  name: string;
  icon: string;
  size: 'normal' | 'wide' | 'custom';
  colSpan?: number;
  rowSpan?: number;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  html: string;
  css: string;
  js: string;
}

export function initMainPage() {
  const gridSection = document.getElementById('gridSection');
  if (!gridSection) return;

  const emptyState = document.getElementById('emptyState');

  function getDomain(urlStr: string) {
    try {
      const url = new URL(urlStr);
      return url.hostname;
    } catch (e) {
      return '';
    }
  }

  const workbenchSection = document.getElementById('workbenchSection');
  const mainContent = document.getElementById('mainContent');
  const navModeBtn = document.getElementById('navModeBtn');
  const workbenchModeBtn = document.getElementById('workbenchModeBtn');
  const modeSlider = document.getElementById('modeSlider');
  const greetingHeader = document.getElementById('greetingHeader');
  const searchSection = document.getElementById('searchSection');

  function switchMode(mode: 'nav' | 'workbench') {
    if (!gridSection || !workbenchSection || !navModeBtn || !workbenchModeBtn || !modeSlider) return;

    if (mode === 'nav') {
      gridSection.style.display = 'flex';
      workbenchSection.style.display = 'none';
      if (greetingHeader) greetingHeader.style.display = 'block';
      if (searchSection) searchSection.style.display = 'block';
      navModeBtn.classList.add('active');
      workbenchModeBtn.classList.remove('active');
      mainContent?.classList.remove('workbench-active');
      modeSlider.style.transform = 'translateX(0)';
      renderMainGrid(); 
    } else {
      gridSection.style.display = 'none';
      emptyState!.style.display = 'none';
      workbenchSection.style.display = 'block';
      if (greetingHeader) greetingHeader.style.display = 'none';
      if (searchSection) searchSection.style.display = 'none';
      navModeBtn.classList.remove('active');
      workbenchModeBtn.classList.add('active');
      mainContent?.classList.add('workbench-active');
      modeSlider.style.transform = 'translateX(calc(100% + 4px))';
      positionDragLayoutItems();
    }
    
    renderLucideIconsSafe();
  }

  navModeBtn?.addEventListener('click', () => switchMode('nav'));
  workbenchModeBtn?.addEventListener('click', () => switchMode('workbench'));

  // 绑定新的顶栏侧边栏按钮逻辑
  const topSidebarToggle = document.getElementById('sidebarToggleCopy');
  const originalToggle = document.getElementById('sidebarToggle');
  if (topSidebarToggle && originalToggle) {
    topSidebarToggle.addEventListener('click', () => {
      originalToggle.click(); // 触发原有的侧边栏逻辑
    });
  }

  // ================= 自定义小组件核心逻辑 =================
  const addWidgetBtn = document.getElementById('addWidgetBtn');
  const widgetEditor = document.getElementById('widgetEditor');
  const closeEditor = document.getElementById('closeEditor');
  const cancelWidget = document.getElementById('cancelWidget');
  const saveWidgetBtn = document.getElementById('saveWidget');
  const editorModalTitle = document.getElementById('editorModalTitle');
  const workbenchGrid = document.querySelector('.workbench-grid') as HTMLElement | null;
  const arrangeModeBtn = document.getElementById('arrangeModeBtn') as HTMLButtonElement | null;
  const dragModeBtn = document.getElementById('dragModeBtn') as HTMLButtonElement | null;
  const workbenchLayoutSlider = document.getElementById('workbenchLayoutSlider');

  const nameInput = document.getElementById('widgetNameInput') as HTMLInputElement;
  const iconInput = document.getElementById('widgetIconInput') as HTMLInputElement;
  const sizeInput = document.getElementById('widgetSizeInput') as HTMLSelectElement;
  const htmlEditor = document.getElementById('htmlEditor') as HTMLTextAreaElement;
  const cssEditor = document.getElementById('cssEditor') as HTMLTextAreaElement;
  const jsEditor = document.getElementById('jsEditor') as HTMLTextAreaElement;
  const tabs = document.querySelectorAll('.tab-btn');

  let editingWidgetId: string | null = null;
  let workbenchLayoutMode: 'arrange' | 'drag' = localStorage.getItem('workbench_layout_mode') === 'drag' ? 'drag' : 'arrange';

  const CUSTOM_WIDGETS_KEY = 'custom_widgets';
  const WORKBENCH_LAYOUT_KEY = 'workbench_layout';
  const WIDGET_GAP = 24;
  const GRID_COLUMN_WIDTH = 220;
  const GRID_ROW_HEIGHT = 24;
  const DEFAULT_WIDGET_WIDTH = 300;
  const DEFAULT_WIDGET_HEIGHT = 180;
  const WIDE_WIDGET_WIDTH = 624;

  function escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeParse<T>(key: string, fallback: T): T {
    try {
      return JSON.parse(localStorage.getItem(key) || '') || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function getSavedWidgets(): Widget[] {
    return safeParse<Widget[]>(CUSTOM_WIDGETS_KEY, []);
  }

  function saveWidgets(widgets: Widget[]) {
    localStorage.setItem(CUSTOM_WIDGETS_KEY, JSON.stringify(widgets));
  }

  function updateSavedWidget(widget: Widget) {
    const saved = getSavedWidgets();
    const idx = saved.findIndex((w) => w.id === widget.id);
    if (idx > -1) {
      saved[idx] = widget;
      saveWidgets(saved);
    }
  }

  function getWorkbenchLayouts(): Record<string, { x?: number; y?: number; width?: number; height?: number }> {
    return safeParse(WORKBENCH_LAYOUT_KEY, {});
  }

  function saveWorkbenchLayouts(layouts: Record<string, { x?: number; y?: number; width?: number; height?: number }>) {
    localStorage.setItem(WORKBENCH_LAYOUT_KEY, JSON.stringify(layouts));
  }

  function getCardLayoutId(card: HTMLElement) {
    return card.dataset.widgetId || card.dataset.builtin || null;
  }

  function getCardDefaultWidth(card: HTMLElement) {
    return card.classList.contains('wide-widget') ? WIDE_WIDGET_WIDTH : DEFAULT_WIDGET_WIDTH;
  }

  function applyCardSize(card: HTMLElement, width?: number, height?: number) {
    const nextWidth = Math.max(220, Math.round(width || getCardDefaultWidth(card)));
    const nextHeight = Math.max(140, Math.round(height || DEFAULT_WIDGET_HEIGHT));
    const colSpan = Math.max(1, Math.min(4, Math.round((nextWidth + WIDGET_GAP) / (GRID_COLUMN_WIDTH + WIDGET_GAP))));
    const rowSpan = Math.max(5, Math.ceil(nextHeight / GRID_ROW_HEIGHT));

    card.style.setProperty('--widget-width', `${nextWidth}px`);
    card.style.setProperty('--widget-height', `${nextHeight}px`);
    card.style.setProperty('--widget-col-span', String(colSpan));
    card.style.setProperty('--widget-row-span', String(rowSpan));
  }

  function persistCardLayout(card: HTMLElement) {
    const id = getCardLayoutId(card);
    if (!id) return;

    const layouts = getWorkbenchLayouts();
    layouts[id] = {
      ...layouts[id],
      x: Number.parseFloat(card.style.left) || layouts[id]?.x || 0,
      y: Number.parseFloat(card.style.top) || layouts[id]?.y || 0,
      width: Number.parseFloat(card.style.getPropertyValue('--widget-width')) || card.offsetWidth,
      height: Number.parseFloat(card.style.getPropertyValue('--widget-height')) || card.offsetHeight,
    };
    saveWorkbenchLayouts(layouts);
  }

  function applySavedLayout(card: HTMLElement, widget?: Widget) {
    const id = getCardLayoutId(card);
    const layout = id ? getWorkbenchLayouts()[id] : null;
    applyCardSize(card, widget?.width || layout?.width, widget?.height || layout?.height);
  }

  function positionDragLayoutItems() {
    if (!workbenchGrid || workbenchLayoutMode !== 'drag') return;

    const layouts = getWorkbenchLayouts();
    const cards = Array.from(workbenchGrid.querySelectorAll<HTMLElement>('.widget-card'));
    const containerWidth = Math.max(workbenchGrid.clientWidth, DEFAULT_WIDGET_WIDTH);
    let x = 0;
    let y = 0;
    let rowHeight = 0;
    let maxBottom = DEFAULT_WIDGET_HEIGHT;

    cards.forEach((card) => {
      const id = getCardLayoutId(card);
      const layout = id ? layouts[id] : null;
      const width = Math.min(layout?.width || card.offsetWidth || getCardDefaultWidth(card), containerWidth);
      const height = layout?.height || card.offsetHeight || DEFAULT_WIDGET_HEIGHT;

      if (!layout || layout.x === undefined || layout.y === undefined) {
        if (x + width > containerWidth && x > 0) {
          x = 0;
          y += rowHeight + WIDGET_GAP;
          rowHeight = 0;
        }
        if (id) layouts[id] = { ...layout, x, y, width, height };
        x += width + WIDGET_GAP;
        rowHeight = Math.max(rowHeight, height);
      }

      const current = id ? layouts[id] : layout;
      card.style.left = `${Math.max(0, current?.x || 0)}px`;
      card.style.top = `${Math.max(0, current?.y || 0)}px`;
      applyCardSize(card, current?.width || width, current?.height || height);
      maxBottom = Math.max(maxBottom, (current?.y || 0) + (current?.height || height));
    });

    saveWorkbenchLayouts(layouts);
    workbenchGrid.style.setProperty('--workbench-drag-height', `${maxBottom + DEFAULT_WIDGET_HEIGHT + WIDGET_GAP}px`);
    workbenchGrid.style.setProperty('--workbench-add-top', `${maxBottom + WIDGET_GAP}px`);
  }

  function setWorkbenchLayoutMode(mode: 'arrange' | 'drag') {
    if (!workbenchGrid) return;

    workbenchLayoutMode = mode;
    localStorage.setItem('workbench_layout_mode', mode);
    workbenchGrid.classList.toggle('drag-layout', mode === 'drag');
    arrangeModeBtn?.classList.toggle('active', mode === 'arrange');
    dragModeBtn?.classList.toggle('active', mode === 'drag');
    arrangeModeBtn?.setAttribute('aria-pressed', String(mode === 'arrange'));
    dragModeBtn?.setAttribute('aria-pressed', String(mode === 'drag'));
    if (workbenchLayoutSlider) {
      workbenchLayoutSlider.style.transform = mode === 'drag' ? 'translateX(calc(100% + 4px))' : 'translateX(0)';
    }

    const items = workbenchGrid.querySelectorAll<HTMLElement>('.widget-card, .add-widget-btn');
    items.forEach((item) => {
      if (mode === 'arrange') {
        item.style.left = '';
        item.style.top = '';
        if (item.classList.contains('widget-card')) {
          item.style.width = '';
          item.style.minHeight = '';
        }
      }
    });

    if (mode === 'drag') positionDragLayoutItems();
  }

  arrangeModeBtn?.addEventListener('click', () => setWorkbenchLayoutMode('arrange'));
  dragModeBtn?.addEventListener('click', () => setWorkbenchLayoutMode('drag'));

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const type = tab.getAttribute('data-tab');
      htmlEditor.style.display = type === 'html' ? 'block' : 'none';
      cssEditor.style.display = type === 'css' ? 'block' : 'none';
      jsEditor.style.display = type === 'js' ? 'block' : 'none';
    });
  });

  function openEditor(widget?: Widget) {
    if (widget) {
      editingWidgetId = widget.id;
      editorModalTitle!.textContent = '编辑小组件';
      nameInput.value = widget.name;
      iconInput.value = widget.icon;
      sizeInput.value = widget.size;
      htmlEditor.value = widget.html;
      cssEditor.value = widget.css;
      jsEditor.value = widget.js;
    } else {
      editingWidgetId = null;
      editorModalTitle!.textContent = '新建小组件';
      nameInput.value = '';
      iconInput.value = 'code-2';
      sizeInput.value = 'normal';
      htmlEditor.value = '';
      cssEditor.value = '';
      jsEditor.value = '';
    }
    widgetEditor!.style.display = 'flex';
  }

  addWidgetBtn?.addEventListener('click', () => openEditor());
  closeEditor?.addEventListener('click', () => widgetEditor!.style.display = 'none');
  cancelWidget?.addEventListener('click', () => widgetEditor!.style.display = 'none');

  function bindWidgetInteractions(card: HTMLElement, widget?: Widget) {
    const handle = card.querySelector('.resize-handle') as HTMLElement | null;
    handle?.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      card.classList.add('resizing');

      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = card.offsetWidth;
      const startHeight = card.offsetHeight;

      const onPointerMove = (moveEvent: PointerEvent) => {
        const nextWidth = Math.max(220, startWidth + moveEvent.clientX - startX);
        const nextHeight = Math.max(140, startHeight + moveEvent.clientY - startY);
        applyCardSize(card, nextWidth, nextHeight);
        if (widget) {
          widget.size = nextWidth > 420 ? 'wide' : 'normal';
          widget.width = nextWidth;
          widget.height = nextHeight;
        }
      };

      const onPointerUp = () => {
        card.classList.remove('resizing');
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        if (widget) updateSavedWidget(widget);
        persistCardLayout(card);
      };

      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    });

    const header = card.querySelector('.widget-header') as HTMLElement | null;
    header?.addEventListener('pointerdown', (e) => {
      if (workbenchLayoutMode !== 'drag' || (e.target as HTMLElement).closest('button')) return;
      e.preventDefault();
      card.classList.add('dragging');

      const startX = e.clientX;
      const startY = e.clientY;
      const startLeft = Number.parseFloat(card.style.left) || 0;
      const startTop = Number.parseFloat(card.style.top) || 0;
      const maxLeft = Math.max(0, (workbenchGrid?.clientWidth || card.offsetWidth) - card.offsetWidth);

      const onPointerMove = (moveEvent: PointerEvent) => {
        const nextLeft = Math.min(maxLeft, Math.max(0, startLeft + moveEvent.clientX - startX));
        const nextTop = Math.max(0, startTop + moveEvent.clientY - startY);
        card.style.left = `${nextLeft}px`;
        card.style.top = `${nextTop}px`;
      };

      const onPointerUp = () => {
        card.classList.remove('dragging');
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        persistCardLayout(card);
        positionDragLayoutItems();
      };

      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    });
  }

  function renderWidgetCard(widget: Widget) {
    const existing = document.querySelector(`[data-widget-id="${widget.id}"]`);
    if (existing) existing.remove();

    const card = document.createElement('div');
    card.className = `widget-card ${widget.size === 'wide' ? 'wide-widget' : ''} custom-code-widget`;
    card.setAttribute('data-widget-id', widget.id);
    applySavedLayout(card, widget);
    
    const srcDoc = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { margin: 0; padding: 0; font-family: -apple-system, system-ui, sans-serif; overflow: hidden; background: transparent; }
            ${widget.css}
          </style>
        </head>
        <body>
          ${widget.html}
          <script>
            try { ${widget.js.replace(/<\/script/gi, '<\\/script')} } catch (e) { console.error('Widget Error:', e); }
          </script>
        </body>
      </html>
    `;

    card.innerHTML = `
      <div class="widget-header">
        <div class="header-left">
          <i data-lucide="${escapeHtml(widget.icon || 'code-2')}"></i>
          <span>${escapeHtml(widget.name || '未命名组件')}</span>
        </div>
        <div class="widget-actions">
          <button class="action-btn refresh-btn" title="刷新"><i data-lucide="refresh-cw"></i></button>
          <button class="action-btn edit-btn" title="编辑"><i data-lucide="edit-3"></i></button>
          <button class="action-btn delete delete-btn" title="删除"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
      <div style="flex-grow:1; position:relative; overflow: hidden; border-radius: 8px; pointer-events: none;">
        <iframe class="custom-widget-frame" sandbox="allow-scripts" style="width:100%; height:100%; border:none; background:transparent;"></iframe>
      </div>
      <div class="resize-handle" title="拖拽调整大小">
        <i data-lucide="grip-vertical"></i>
      </div>
    `;

    const iframe = card.querySelector('iframe');
    if (iframe) iframe.srcdoc = srcDoc;

    bindWidgetInteractions(card, widget);

    card.querySelector('.refresh-btn')?.addEventListener('click', () => {
      const iframe = card.querySelector('iframe');
      if (iframe) iframe.srcdoc = srcDoc;
    });
    card.querySelector('.edit-btn')?.addEventListener('click', () => openEditor(widget));
    card.querySelector('.delete-btn')?.addEventListener('click', () => {
      if (confirm('确定要删除这个组件吗？')) {
        const filtered = getSavedWidgets().filter((w) => w.id !== widget.id);
        const layouts = getWorkbenchLayouts();
        delete layouts[widget.id];
        saveWidgets(filtered);
        saveWorkbenchLayouts(layouts);
        card.remove();
        positionDragLayoutItems();
      }
    });

    workbenchGrid?.insertBefore(card, addWidgetBtn);
    setWorkbenchLayoutMode(workbenchLayoutMode);
    renderLucideIconsSafe();
  }

  saveWidgetBtn?.addEventListener('click', () => {
    const previous = editingWidgetId ? getSavedWidgets().find((w) => w.id === editingWidgetId) : null;
    const widget: Widget = {
      ...previous,
      id: editingWidgetId || Date.now().toString(),
      name: nameInput.value,
      icon: iconInput.value,
      size: sizeInput.value as any,
      html: htmlEditor.value,
      css: cssEditor.value,
      js: jsEditor.value
    };
    const saved = getSavedWidgets();
    if (editingWidgetId) {
      const idx = saved.findIndex((w) => w.id === editingWidgetId);
      if (idx > -1) saved[idx] = widget;
    } else saved.push(widget);
    saveWidgets(saved);
    renderWidgetCard(widget);
    widgetEditor!.style.display = 'none';
  });

  // ================= 内置小组件加载逻辑 =================
  function renderBuiltinWidgets(retryArg: any = 0) {
    const retryCount = typeof retryArg === 'number' ? retryArg : 0;
    console.log(`[Workbench-V6] renderBuiltinWidgets execution (attempt ${retryCount + 1})`);
    
    const appearance = storage.getAppearance();
    let githubUser = appearance.githubUsername?.trim() || '';
    
    // 深度清洗：移除所有非字母数字和连字符，防止不可见字符干扰 URL
    githubUser = githubUser.replace(/[^a-zA-Z0-9-]/g, '');

    const githubWidget = document.querySelector('[data-builtin="github"]');
    
    if (!githubWidget && retryCount < 5) {
      setTimeout(() => renderBuiltinWidgets(retryCount + 1), 200);
      return;
    }

    if (githubWidget) {
      const placeholder = githubWidget.querySelector('.widget-placeholder') as HTMLElement;
      if (!placeholder) return;

      if (!githubUser) {
        placeholder.style.display = 'flex';
        placeholder.innerHTML = `
          <div style="text-align:center; opacity: 0.6; padding: 20px;">
            <p style="margin-bottom:8px; font-size: 13px;">未配置 GitHub 用户名</p>
            <a href="/admin?tab=appearance" style="color:var(--theme-color); font-size:12px; text-decoration:none; border-bottom: 1px solid var(--theme-color);">去管理后台配置 &rarr;</a>
          </div>
        `;
      } else {
        console.log('[Workbench-V6] CLEANED USER:', githubUser, 'Length:', githubUser.length);
        
        placeholder.style.background = 'transparent';
        placeholder.style.display = 'flex';
        placeholder.style.alignItems = 'center';
        placeholder.style.justifyContent = 'center';
        placeholder.style.padding = '10px';
        
        // 切换到更稳健、无需查询参数的 API：ghchart.rshah.org
        // 这个 API 直接使用路径，不依赖容易失踪的问号 ?
        const finalUrl = `https://ghchart.rshah.org/4094B3/${githubUser}`;
        
        console.log('[Workbench-V6] Final Image URL:', finalUrl);

        placeholder.innerHTML = `
          <div class="github-chart-wrapper" style="width:100%; overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch;">
            <img 
              src="${finalUrl}" 
              alt="${githubUser}'s GitHub Contributions"
              style="max-width: none; height: 110px; filter: var(--github-chart-filter); transition: opacity 0.3s;"
              onload="this.style.opacity='1'"
              onerror="this.src='https://github-contributions-canvas.vercel.app/api/v1/${githubUser}?format=svg'"
            />
          </div>
        `;
      }
    }
  }

  function loadSavedWidgets() {
    const saved = getSavedWidgets();
    saved.forEach((w: Widget) => renderWidgetCard(w));
  }
  loadSavedWidgets();

  workbenchGrid?.querySelectorAll<HTMLElement>('.widget-card').forEach((card) => {
    applySavedLayout(card);
    bindWidgetInteractions(card);
  });
  setWorkbenchLayoutMode(workbenchLayoutMode);
  renderBuiltinWidgets();
  window.addEventListener('resize', () => positionDragLayoutItems());

  function renderSkeleton() {
    if (!gridSection) return;
    gridSection.innerHTML = `
      <div class="skeleton-block">
        <div class="skeleton-title"></div>
        <div class="skeleton-grid">
          ${'<div class="skeleton-card"></div>'.repeat(6)}
        </div>
      </div>
      <div class="skeleton-block">
        <div class="skeleton-title"></div>
        <div class="skeleton-grid">
          ${'<div class="skeleton-card"></div>'.repeat(3)}
        </div>
      </div>
    `;
  }

  function renderMainGrid() {
    if (!gridSection) return;
    
    const categories = storage.getCategories().sort((a, b) => a.order - b.order);
    const links = storage.getLinks().sort((a, b) => a.order - b.order);

    if (categories.length === 0) {
      gridSection.innerHTML = '';
      emptyState!.style.display = 'flex';
      return;
    } else {
      emptyState!.style.display = 'none';
    }

    gridSection.innerHTML = '';
    categories.forEach(cat => {
      const catLinks = links.filter(l => l.categoryId === cat.id);
      if (catLinks.length === 0) return;

      const catBlock = document.createElement('div');
      catBlock.className = 'category-block';
      catBlock.id = cat.id;
      catBlock.setAttribute('style', `--cat-color: var(--theme-${cat.color})`);

      catBlock.innerHTML = `
        <div class="category-title-wrapper">
          <i data-lucide="${cat.icon}" class="category-icon"></i>
          <h2 class="category-name">${cat.name}</h2>
          <span class="category-badge">${catLinks.length}</span>
        </div>
        <div class="links-grid"></div>
      `;

      const grid = catBlock.querySelector('.links-grid');

      catLinks.forEach(link => {
        const domain = getDomain(link.url);
        const cachedFav = (window as any).getFaviconFromCache ? (window as any).getFaviconFromCache(domain) : null;

        let faviconUrl = '';
        let showImgDirectly = false;
        let skipFavicon = false;

        if (cachedFav === 'failed') {
          skipFavicon = true;
        } else if (cachedFav) {
          faviconUrl = cachedFav;
          showImgDirectly = true;
        } else {
          faviconUrl = domain ? `https://a.favicon.im/${domain}` : '';
        }

        const cardHtml = `
          <a
            href="${link.url}"
            target="_blank"
            rel="noopener noreferrer"
            class="link-card"
            data-id="${link.id}"
            style="--theme-color: var(--theme-${cat.color});"
          >
            <div class="card-inner">
              <div class="card-header">
                <div class="header-main-info">
                  <div class="icon-wrapper">
                    ${!skipFavicon && faviconUrl ? `
                    <img
                      src="${faviconUrl}"
                      class="card-favicon"
                      ${showImgDirectly ? '' : `onload="window.handleFaviconSuccess && window.handleFaviconSuccess(this, '${domain}')" onerror="window.handleFaviconError && window.handleFaviconError(this, '${domain}')"`}
                      style="${showImgDirectly ? 'display: block;' : 'display: none;'} width: 28px; height: 28px; border-radius: 6px; object-fit: contain;"
                      alt=""
                    />
                    ` : ''}
                    <i data-lucide="${link.icon || 'external-link'}" class="card-icon" style="${showImgDirectly ? 'display: none;' : ''}"></i>
                  </div>
                  <h3 class="card-title">${link.title}</h3>
                </div>
                <div class="theme-tag"></div>
              </div>
              <div class="card-content">
                <p class="card-desc" title="${link.description}">${link.description}</p>
              </div>
            </div>
            <div class="card-watermark">
              ${!skipFavicon && faviconUrl ? `
              <img
                src="${showImgDirectly ? faviconUrl : ''}"
                class="watermark-favicon"
                style="${showImgDirectly ? 'display: block;' : 'display: none;'} width: 100%; height: 100%; object-fit: contain;"
                alt=""
              />
              ` : ''}
              <i data-lucide="${link.icon || 'external-link'}" style="${showImgDirectly ? 'display: none;' : ''}"></i>
            </div>
          </a>
        `;
        grid!.insertAdjacentHTML('beforeend', cardHtml);
      });

      gridSection.appendChild(catBlock);
    });

    renderLucideIconsSafe();

    // 渲染完成后，根据当前输入框内容进行过滤
    if (searchInput) {
      const query = searchInput.value.trim().toLowerCase();
      filterCards(query);
    }
  }

  const searchInput = document.getElementById('searchInput') as HTMLInputElement;

  function filterCards(query: string) {
    const cards = document.querySelectorAll('.link-card');
    const categories = document.querySelectorAll('.category-block');
    let totalVisible = 0;

    cards.forEach(card => {
      const title = card.querySelector('.card-title')?.textContent?.toLowerCase() || '';
      const desc = card.querySelector('.card-desc')?.textContent?.toLowerCase() || '';
      const url = card.getAttribute('href')?.toLowerCase() || '';

      const matches = title.includes(query) || desc.includes(query) || url.includes(query);
      if (matches) {
        (card as HTMLElement).style.display = '';
        totalVisible++;
      } else {
        (card as HTMLElement).style.display = 'none';
      }
    });

    categories.forEach(block => {
      const blockCards = block.querySelectorAll('.link-card');
      let visibleInBlock = 0;
      blockCards.forEach(card => {
        if ((card as HTMLElement).style.display !== 'none') {
          visibleInBlock++;
        }
      });

      if (visibleInBlock === 0) {
        (block as HTMLElement).style.display = 'none';
      } else {
        (block as HTMLElement).style.display = '';
        const badge = block.querySelector('.category-badge');
        if (badge) badge.textContent = String(visibleInBlock);
      }
    });

    if (emptyState) {
      if (totalVisible === 0) {
        emptyState.style.display = 'flex';
      } else {
        emptyState.style.display = 'none';
      }
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim().toLowerCase();
      filterCards(query);
    });
  }

  // 初始渲染逻辑
  if (storage.getCategories().length === 0) {
    renderSkeleton();
  } else {
    renderMainGrid();
  }

  storage.syncFromCloud().then(updated => {
    if (updated) {
      renderMainGrid();
      renderBuiltinWidgets();
      window.dispatchEvent(new CustomEvent('appearance-updated'));
    }
  }).catch(e => console.error('Silent background sync failed:', e));

  window.addEventListener('appearance-updated', renderBuiltinWidgets);

  gridSection?.addEventListener('click', (e) => {
    const card = (e.target as HTMLElement).closest('.link-card');
    if (card) {
      const id = card.getAttribute('data-id');
      if (id) {
        storage.recordClick(id);
      }
    }
  });

  window.addEventListener('focus', () => {
    storage.syncFromCloud().then(updated => {
      if (updated) {
        renderMainGrid();
        window.dispatchEvent(new CustomEvent('appearance-updated'));
      }
    }).catch(e => console.error('Focus background sync failed:', e));
  });
}

document.addEventListener('astro:page-load', initMainPage);
