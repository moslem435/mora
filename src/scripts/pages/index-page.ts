import { storage } from '../storage';
import { renderLucideIconsSafe } from '../ui/icons';

interface Widget {
  id: string;
  name: string;
  icon: string;
  size: 'normal' | 'wide' | 'custom';
  colSpan?: number;
  rowSpan?: number;
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
      modeSlider.style.transform = 'translateX(calc(100% + 4px))';
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
  const workbenchGrid = document.querySelector('.workbench-grid');

  const nameInput = document.getElementById('widgetNameInput') as HTMLInputElement;
  const iconInput = document.getElementById('widgetIconInput') as HTMLInputElement;
  const sizeInput = document.getElementById('widgetSizeInput') as HTMLSelectElement;
  const htmlEditor = document.getElementById('htmlEditor') as HTMLTextAreaElement;
  const cssEditor = document.getElementById('cssEditor') as HTMLTextAreaElement;
  const jsEditor = document.getElementById('jsEditor') as HTMLTextAreaElement;
  const tabs = document.querySelectorAll('.tab-btn');

  let editingWidgetId: string | null = null;

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

  function renderWidgetCard(widget: Widget) {
    const existing = document.querySelector(`[data-widget-id="${widget.id}"]`);
    if (existing) existing.remove();

    const card = document.createElement('div');
    card.className = `widget-card ${widget.size === 'wide' ? 'wide-widget' : ''} custom-code-widget`;
    card.setAttribute('data-widget-id', widget.id);
    
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
            try { ${widget.js} } catch (e) { console.error('Widget Error:', e); }
          </script>
        </body>
      </html>
    `;

    card.innerHTML = `
      <div class="widget-header">
        <div class="header-left">
          <i data-lucide="${widget.icon || 'code-2'}"></i>
          <span>${widget.name || '未命名组件'}</span>
        </div>
        <div class="widget-actions">
          <button class="action-btn refresh-btn" title="刷新"><i data-lucide="refresh-cw"></i></button>
          <button class="action-btn edit-btn" title="编辑"><i data-lucide="edit-3"></i></button>
          <button class="action-btn delete delete-btn" title="删除"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
      <div style="flex-grow:1; position:relative; overflow: hidden; border-radius: 8px; pointer-events: none;">
        <iframe class="custom-widget-frame" style="width:100%; height:100%; border:none; background:transparent;" srcdoc='${srcDoc.replace(/'/g, "&apos;")}'></iframe>
      </div>
      <div class="resize-handle" title="拖拽调整大小">
        <i data-lucide="grip-vertical"></i>
      </div>
    `;

    // 应用自定义尺寸
    if (widget.colSpan) card.style.gridColumn = `span ${widget.colSpan}`;
    else if (widget.size === 'wide') card.style.gridColumn = `span 2`;
    
    if (widget.rowSpan) card.style.gridRow = `span ${widget.rowSpan}`;

    // 拖拽缩放逻辑
    const handle = card.querySelector('.resize-handle') as HTMLElement;
    handle?.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const startX = e.clientX;
      const startY = e.clientY;
      const startColSpan = widget.colSpan || (widget.size === 'wide' ? 2 : 1);
      const startRowSpan = widget.rowSpan || 1;
      
      // 获取网格基础宽度（近似值）
      const gridRect = workbenchGrid!.getBoundingClientRect();
      const colWidth = 300 + 24; // min-width + gap
      const rowHeight = 180 + 24; // min-height + gap

      const onPointerMove = (moveEvent: PointerEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        
        const newColSpan = Math.max(1, Math.min(4, Math.round(startColSpan + deltaX / colWidth)));
        const newRowSpan = Math.max(1, Math.min(4, Math.round(startRowSpan + deltaY / rowHeight)));
        
        if (newColSpan !== widget.colSpan || newRowSpan !== widget.rowSpan) {
          widget.colSpan = newColSpan;
          widget.rowSpan = newRowSpan;
          card.style.gridColumn = `span ${newColSpan}`;
          card.style.gridRow = `span ${newRowSpan}`;
        }
      };

      const onPointerUp = () => {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        
        // 保存到本地存储
        const saved = JSON.parse(localStorage.getItem('custom_widgets') || '[]');
        const idx = saved.findIndex((w: any) => w.id === widget.id);
        if (idx > -1) {
          saved[idx] = widget;
          localStorage.setItem('custom_widgets', JSON.stringify(saved));
        }
      };

      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    });

    card.querySelector('.refresh-btn')?.addEventListener('click', () => {
      const iframe = card.querySelector('iframe');
      if (iframe) iframe.srcdoc = srcDoc.replace(/'/g, "&apos;");
    });
    card.querySelector('.edit-btn')?.addEventListener('click', () => openEditor(widget));
    card.querySelector('.delete-btn')?.addEventListener('click', () => {
      if (confirm('确定要删除这个组件吗？')) {
        const saved = JSON.parse(localStorage.getItem('custom_widgets') || '[]');
        const filtered = saved.filter((w: any) => w.id !== widget.id);
        localStorage.setItem('custom_widgets', JSON.stringify(filtered));
        card.remove();
      }
    });

    workbenchGrid?.insertBefore(card, addWidgetBtn);
    renderLucideIconsSafe();
  }

  saveWidgetBtn?.addEventListener('click', () => {
    const widget: Widget = {
      id: editingWidgetId || Date.now().toString(),
      name: nameInput.value,
      icon: iconInput.value,
      size: sizeInput.value as any,
      html: htmlEditor.value,
      css: cssEditor.value,
      js: jsEditor.value
    };
    const saved = JSON.parse(localStorage.getItem('custom_widgets') || '[]');
    if (editingWidgetId) {
      const idx = saved.findIndex((w: any) => w.id === editingWidgetId);
      if (idx > -1) saved[idx] = widget;
    } else saved.push(widget);
    localStorage.setItem('custom_widgets', JSON.stringify(saved));
    renderWidgetCard(widget);
    widgetEditor!.style.display = 'none';
  });

  function loadSavedWidgets() {
    const saved = JSON.parse(localStorage.getItem('custom_widgets') || '[]');
    saved.forEach((w: Widget) => renderWidgetCard(w));
  }
  loadSavedWidgets();

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
      window.dispatchEvent(new CustomEvent('appearance-updated'));
    }
  }).catch(e => console.error('Silent background sync failed:', e));

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
