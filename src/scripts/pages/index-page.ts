import { storage } from '../storage';
import { renderLucideIconsSafe } from '../ui/icons';
import { showToast } from '../ui/toast';

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
      scheduleWorkbenchLayoutRefresh();
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
  const previewFrame = document.getElementById('widgetPreviewFrame') as HTMLIFrameElement | null;
  const refreshPreviewBtn = document.getElementById('refreshWidgetPreview') as HTMLButtonElement | null;
  const templateCards = document.querySelectorAll<HTMLElement>('.widget-template-card');
  const sizeButtons = document.querySelectorAll<HTMLElement>('.widget-size-btn');
  const widgetViewer = document.getElementById('widgetViewer');
  const widgetViewerFrame = document.getElementById('widgetViewerFrame') as HTMLIFrameElement | null;
  const widgetViewerTitle = document.getElementById('widgetViewerTitle');
  const widgetViewerIcon = document.getElementById('widgetViewerIcon');
  const refreshWidgetViewer = document.getElementById('refreshWidgetViewer');
  const editWidgetViewer = document.getElementById('editWidgetViewer');
  const toggleWidgetViewerFullscreen = document.getElementById('toggleWidgetViewerFullscreen');
  const closeWidgetViewer = document.getElementById('closeWidgetViewer');
  const lockWorkbenchBtn = document.getElementById('lockWorkbenchBtn');
  const resetWorkbenchBtn = document.getElementById('resetWorkbenchBtn');
  const exportWorkbenchBtn = document.getElementById('exportWorkbenchBtn');
  const importWorkbenchBtn = document.getElementById('importWorkbenchBtn');
  const importWorkbenchInput = document.getElementById('importWorkbenchInput') as HTMLInputElement | null;
  const widgetContextMenu = document.getElementById('widgetContextMenu');
  let activeViewerWidget: Widget | null = null;
  let contextMenuWidget: Widget | null = null;

  const WIDGET_TEMPLATES: Record<string, { name: string; icon: string; size: 'normal' | 'wide'; html: string; css: string; js: string }> = {
    clock: {
      name: '数字时钟',
      icon: 'clock-3',
      size: 'normal',
      html: '<div class="clock-widget"><div id="clockTime">00:00:00</div><div id="clockDate">2026-06-09</div></div>',
      css: 'body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;background:linear-gradient(135deg,#f8f7f4,#fff);color:#202020}.clock-widget{text-align:center}#clockTime{font-size:42px;font-weight:700;letter-spacing:.06em}#clockDate{margin-top:10px;font-size:12px;color:#6b6b6b}',
      js: 'const timeEl=document.getElementById("clockTime");const dateEl=document.getElementById("clockDate");function tick(){const now=new Date();if(timeEl) timeEl.textContent=now.toLocaleTimeString("zh-CN",{hour12:false});if(dateEl) dateEl.textContent=now.toLocaleDateString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",weekday:"long"});}tick();setInterval(tick,1000);'
    },
    note: {
      name: '便签',
      icon: 'sticky-note',
      size: 'normal',
      html: '<div class="note-widget"><h4>今日重点</h4><p>把最重要的一件事放在这里。</p></div>',
      css: 'body{margin:0;padding:0;display:flex;height:100vh;font-family:system-ui;background:#fff8e8;color:#433a2e}.note-widget{padding:20px}.note-widget h4{margin:0 0 12px;font-size:18px}.note-widget p{margin:0;font-size:14px;line-height:1.7}',
      js: ''
    },
    countdown: {
      name: '倒计时',
      icon: 'timer',
      size: 'wide',
      html: '<div class="countdown-widget"><div id="countdownTitle">目标日</div><div id="countdownDays">00</div><div class="countdown-sub">天</div></div>',
      css: 'body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;background:linear-gradient(135deg,#f3f8ff,#ffffff);color:#1d2b3a}.countdown-widget{text-align:center}#countdownTitle{font-size:14px;color:#5a6b7b;letter-spacing:.08em;text-transform:uppercase}#countdownDays{margin-top:12px;font-size:48px;font-weight:800;line-height:1}.countdown-sub{margin-top:8px;font-size:12px;color:#6d7d8c}',
      js: 'const daysEl=document.getElementById("countdownDays");const target=new Date();target.setDate(target.getDate()+30);function tick(){const now=new Date();const diff=Math.max(0,Math.ceil((target-now)/86400000));if(daysEl) daysEl.textContent=String(diff).padStart(2,"0");}tick();setInterval(tick,1000*60*10);'
    },
    blank: {
      name: '新建小组件',
      icon: 'code-2',
      size: 'normal',
      html: '<div class="blank-widget">在这里开始你的组件。</div>',
      css: 'body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;background:#fff;color:#333}.blank-widget{padding:20px;font-size:14px;color:#666}',
      js: ''
    }
  };

  function getEditorValues() {
    return {
      name: nameInput?.value || '',
      icon: iconInput?.value || 'code-2',
      size: (sizeInput?.value as 'normal' | 'wide') || 'normal',
      html: htmlEditor?.value || '',
      css: cssEditor?.value || '',
      js: jsEditor?.value || ''
    };
  }

  function buildPreviewSrcDoc() {
    return buildWidgetSrcDoc(getEditorValues(), 'Preview Error');
  }

  function syncPreviewFrame() {
    if (previewFrame) previewFrame.srcdoc = buildPreviewSrcDoc();
  }

  function applyTemplate(templateKey: string) {
    const template = WIDGET_TEMPLATES[templateKey] || WIDGET_TEMPLATES.blank;
    if (nameInput) nameInput.value = template.name;
    if (iconInput) iconInput.value = template.icon;
    if (sizeInput) sizeInput.value = template.size;
    if (htmlEditor) htmlEditor.value = template.html;
    if (cssEditor) cssEditor.value = template.css;
    if (jsEditor) jsEditor.value = template.js;
    templateCards.forEach((card) => card.classList.toggle('active', card.dataset.template === templateKey));
    sizeButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.size === template.size));
    syncPreviewFrame();
  }

  function syncSizeButtons(size: 'normal' | 'wide') {
    sizeButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.size === size));
  }

  function debounce<T extends (...args: any[]) => void>(fn: T, delay = 250) {
    let timer = 0;
    return (...args: Parameters<T>) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => fn(...args), delay);
    };
  }

  const debouncedSyncPreviewFrame = debounce(syncPreviewFrame, 220);

  function sanitizeWidgetValues() {
    const values = getEditorValues();
    return {
      name: values.name.trim(),
      icon: values.icon.trim() || 'code-2',
      size: values.size === 'wide' ? 'wide' : 'normal',
      html: values.html.trim(),
      css: values.css,
      js: values.js
    };
  }

  function validateWidget(values: ReturnType<typeof sanitizeWidgetValues>) {
    if (!values.name) return '请填写组件名称';
    if (!values.html && !values.css && !values.js) return '请至少填写 HTML、CSS 或 JS 中的一项';
    if (!/^[a-z0-9-]+$/i.test(values.icon)) return '图标名只能包含字母、数字和连字符';
    return '';
  }

  function closeWidgetEditor() {
    if (widgetEditor) widgetEditor.style.display = 'none';
  }

  function persistWidgetsSafely(widgets: Widget[]) {
    try {
      saveWidgets(widgets);
      return true;
    } catch (e) {
      console.error('Save custom widgets failed:', e);
      showToast('保存失败，浏览器本地存储空间可能不足', 'error');
      return false;
    }
  }

  function setActiveEditorTab(type: string | null) {
    tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === type));
    htmlEditor.style.display = type === 'html' ? 'block' : 'none';
    cssEditor.style.display = type === 'css' ? 'block' : 'none';
    jsEditor.style.display = type === 'js' ? 'block' : 'none';
  }

  templateCards.forEach((card) => {
    card.addEventListener('click', () => applyTemplate(card.dataset.template || 'blank'));
  });

  sizeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const size = btn.dataset.size === 'wide' ? 'wide' : 'normal';
      sizeInput.value = size;
      syncSizeButtons(size);
      debouncedSyncPreviewFrame();
    });
  });

  sizeInput?.addEventListener('change', () => syncSizeButtons(sizeInput.value === 'wide' ? 'wide' : 'normal'));
  refreshPreviewBtn?.addEventListener('click', syncPreviewFrame);
  [nameInput, iconInput, htmlEditor, cssEditor, jsEditor].forEach((input) => {
    input?.addEventListener('input', debouncedSyncPreviewFrame);
  });

  lockWorkbenchBtn?.addEventListener('click', () => {
    isWorkbenchLocked = !isWorkbenchLocked;
    localStorage.setItem('workbench_locked', String(isWorkbenchLocked));
    syncWorkbenchLockState();
    showToast(isWorkbenchLocked ? '布局已锁定' : '布局已解锁', 'success');
  });
  resetWorkbenchBtn?.addEventListener('click', resetWorkbenchLayout);
  exportWorkbenchBtn?.addEventListener('click', exportWorkbenchData);
  importWorkbenchBtn?.addEventListener('click', () => importWorkbenchInput?.click());
  importWorkbenchInput?.addEventListener('change', () => {
    const file = importWorkbenchInput.files?.[0];
    if (file) importWorkbenchData(file);
  });

  let editingWidgetId: string | null = null;
  let workbenchLayoutMode: 'arrange' | 'drag' = localStorage.getItem('workbench_layout_mode') === 'drag' ? 'drag' : 'arrange';
  let isWorkbenchLocked = localStorage.getItem('workbench_locked') === 'true';

  const CUSTOM_WIDGETS_KEY = 'custom_widgets';
  const WORKBENCH_LAYOUT_KEY = 'workbench_layout';
  const WIDGET_COLUMN_GAP = 24;
  const WIDGET_ROW_GAP = 12;
  const GRID_COLUMN_WIDTH = 220;
  const GRID_ROW_HEIGHT = 6;
  const DEFAULT_WIDGET_WIDTH = 300;
  const DEFAULT_WIDGET_HEIGHT = 180;
  const MIN_WIDGET_HEIGHT = 108;
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

  function syncWorkbenchLockState() {
    workbenchGrid?.classList.toggle('layout-locked', isWorkbenchLocked);
    lockWorkbenchBtn?.classList.toggle('active', isWorkbenchLocked);
    lockWorkbenchBtn?.setAttribute('title', isWorkbenchLocked ? '解锁布局' : '锁定布局');
    const icon = lockWorkbenchBtn?.querySelector('i');
    icon?.setAttribute('data-lucide', isWorkbenchLocked ? 'lock' : 'lock-open');
    renderLucideIconsSafe();
  }

  function deleteWidget(widget: Widget) {
    const filtered = getSavedWidgets().filter((w) => w.id !== widget.id);
    const layouts = getWorkbenchLayouts();
    delete layouts[widget.id];
    if (!persistWidgetsSafely(filtered)) return false;
    saveWorkbenchLayouts(layouts);
    document.querySelector(`[data-widget-id="${widget.id}"]`)?.remove();
    if (activeViewerWidget?.id === widget.id) closeWidgetViewerDialog();
    positionDragLayoutItems();
    showToast('小组件已删除', 'success');
    return true;
  }

  function duplicateWidget(widget: Widget) {
    const copy: Widget = {
      ...widget,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: `${widget.name || '未命名组件'} 副本`,
      x: undefined,
      y: undefined
    };
    const saved = getSavedWidgets();
    saved.push(copy);
    if (!persistWidgetsSafely(saved)) return;
    renderWidgetCard(copy);
    scheduleWorkbenchLayoutRefresh();
    showToast('小组件已复制', 'success');
  }

  function resetCardLayout(card: HTMLElement, widget?: Widget) {
    const id = getCardLayoutId(card);
    if (id) {
      const layouts = getWorkbenchLayouts();
      delete layouts[id];
      saveWorkbenchLayouts(layouts);
    }
    if (widget) {
      delete widget.width;
      delete widget.height;
      widget.size = widget.size === 'wide' ? 'wide' : 'normal';
      updateSavedWidget(widget);
    }
    card.style.left = '';
    card.style.top = '';
    card.style.width = '';
    card.style.height = '';
    card.style.minHeight = '';
    applySavedLayout(card, widget);
  }

  function resetWorkbenchLayout() {
    if (!confirm('确定要重置工作台布局吗？组件内容不会被删除。')) return;
    saveWorkbenchLayouts({});
    const saved = getSavedWidgets().map((widget) => {
      const next = { ...widget };
      delete next.width;
      delete next.height;
      delete next.x;
      delete next.y;
      return next;
    });
    persistWidgetsSafely(saved);
    workbenchGrid?.querySelectorAll<HTMLElement>('.widget-card').forEach((card) => {
      card.style.left = '';
      card.style.top = '';
      card.style.width = '';
      card.style.height = '';
      card.style.minHeight = '';
      applySavedLayout(card);
    });
    scheduleWorkbenchLayoutRefresh();
    showToast('布局已重置', 'success');
  }

  function exportWorkbenchData() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      widgets: getSavedWidgets(),
      layouts: getWorkbenchLayouts(),
      layoutMode: workbenchLayoutMode,
      locked: isWorkbenchLocked
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mora-workbench-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('工作台已导出', 'success');
  }

  function importWorkbenchData(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result || '{}'));
        if (!Array.isArray(data.widgets) || typeof data.layouts !== 'object' || !data.layouts) {
          showToast('导入文件格式不正确', 'error');
          return;
        }
        if (!confirm('导入会覆盖当前自定义组件和工作台布局，是否继续？')) return;
        if (!persistWidgetsSafely(data.widgets)) return;
        saveWorkbenchLayouts(data.layouts);
        if (data.layoutMode === 'drag' || data.layoutMode === 'arrange') workbenchLayoutMode = data.layoutMode;
        isWorkbenchLocked = !!data.locked;
        localStorage.setItem('workbench_layout_mode', workbenchLayoutMode);
        localStorage.setItem('workbench_locked', String(isWorkbenchLocked));
        workbenchGrid?.querySelectorAll('.custom-code-widget').forEach((node) => node.remove());
        loadSavedWidgets();
        setWorkbenchLayoutMode(workbenchLayoutMode);
        syncWorkbenchLockState();
        showToast('工作台已导入', 'success');
      } catch (e) {
        console.error('Import workbench failed:', e);
        showToast('导入失败，请检查 JSON 文件', 'error');
      } finally {
        if (importWorkbenchInput) importWorkbenchInput.value = '';
      }
    };
    reader.readAsText(file);
  }

  function getCardLayoutId(card: HTMLElement) {
    return card.dataset.widgetId || card.dataset.builtin || null;
  }

  function getCardDefaultWidth(card: HTMLElement) {
    return card.classList.contains('wide-widget') ? WIDE_WIDGET_WIDTH : DEFAULT_WIDGET_WIDTH;
  }

  function getRestoredWidth(card: HTMLElement, width?: number) {
    const defaultWidth = getCardDefaultWidth(card);
    if (!width || width < defaultWidth) return defaultWidth;
    return width;
  }

  function getMaxGridColumns() {
    const gridWidth = workbenchGrid?.clientWidth || GRID_COLUMN_WIDTH;
    return Math.max(1, Math.floor((gridWidth + WIDGET_COLUMN_GAP) / (GRID_COLUMN_WIDTH + WIDGET_COLUMN_GAP)));
  }

  function getWidgetGridMetrics(width: number, height: number) {
    const maxCols = getMaxGridColumns();
    const nextWidth = Math.max(220, Math.round(width));
    const nextHeight = Math.max(MIN_WIDGET_HEIGHT, Math.round(height));
    const colSpan = Math.max(1, Math.min(maxCols, Math.round((nextWidth + WIDGET_COLUMN_GAP) / (GRID_COLUMN_WIDTH + WIDGET_COLUMN_GAP))));
    const rowSpan = Math.max(5, Math.ceil((nextHeight + WIDGET_ROW_GAP) / (GRID_ROW_HEIGHT + WIDGET_ROW_GAP)));
    const appliedWidth = colSpan * GRID_COLUMN_WIDTH + (colSpan - 1) * WIDGET_COLUMN_GAP;
    const appliedHeight = rowSpan * GRID_ROW_HEIGHT + (rowSpan - 1) * WIDGET_ROW_GAP;

    return { nextWidth, nextHeight, colSpan, rowSpan, appliedWidth, appliedHeight };
  }

  function applyCardSize(card: HTMLElement, width?: number, height?: number) {
    const metrics = getWidgetGridMetrics(width || getCardDefaultWidth(card), height || DEFAULT_WIDGET_HEIGHT);
    const appliedWidth = workbenchLayoutMode === 'arrange' ? metrics.appliedWidth : metrics.nextWidth;
    const appliedHeight = workbenchLayoutMode === 'arrange' ? metrics.appliedHeight : metrics.nextHeight;

    card.style.setProperty('--widget-width', `${appliedWidth}px`);
    card.style.setProperty('--widget-height', `${appliedHeight}px`);
    card.style.setProperty('--widget-col-span', String(metrics.colSpan));
    card.style.setProperty('--widget-row-span', String(metrics.rowSpan));
  }

  function applyLiveCardSize(card: HTMLElement, width: number, height: number) {
    card.style.width = `${Math.max(220, Math.round(width))}px`;
    card.style.height = `${Math.max(MIN_WIDGET_HEIGHT, Math.round(height))}px`;
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
    applyCardSize(card, getRestoredWidth(card, widget?.width || layout?.width), widget?.height || layout?.height);
  }

  function refreshWorkbenchCardLayouts() {
    if (!workbenchGrid) return;

    const savedWidgets = getSavedWidgets();
    workbenchGrid.querySelectorAll<HTMLElement>('.widget-card').forEach((card) => {
      const widgetId = card.dataset.widgetId;
      const widget = widgetId ? savedWidgets.find((item) => item.id === widgetId) : undefined;
      applySavedLayout(card, widget);
    });

    if (workbenchLayoutMode === 'drag') positionDragLayoutItems();
  }

  function scheduleWorkbenchLayoutRefresh() {
    requestAnimationFrame(() => {
      requestAnimationFrame(refreshWorkbenchCardLayouts);
    });
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
          y += rowHeight + WIDGET_ROW_GAP;
          rowHeight = 0;
        }
        if (id) layouts[id] = { ...layout, x, y, width, height };
        x += width + WIDGET_COLUMN_GAP;
        rowHeight = Math.max(rowHeight, height);
      }

      const current = id ? layouts[id] : layout;
      card.style.left = `${Math.max(0, current?.x || 0)}px`;
      card.style.top = `${Math.max(0, current?.y || 0)}px`;
      applyCardSize(card, current?.width || width, current?.height || height);
      maxBottom = Math.max(maxBottom, (current?.y || 0) + (current?.height || height));
    });

    saveWorkbenchLayouts(layouts);
    workbenchGrid.style.setProperty('--workbench-drag-height', `${maxBottom + DEFAULT_WIDGET_HEIGHT + WIDGET_ROW_GAP}px`);
    workbenchGrid.style.setProperty('--workbench-add-top', `${maxBottom + WIDGET_ROW_GAP}px`);
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
          item.style.height = '';
          item.style.minHeight = '';
        }
      }
    });

    scheduleWorkbenchLayoutRefresh();
  }

  arrangeModeBtn?.addEventListener('click', () => setWorkbenchLayoutMode('arrange'));
  dragModeBtn?.addEventListener('click', () => setWorkbenchLayoutMode('drag'));

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      setActiveEditorTab(tab.getAttribute('data-tab'));
    });
  });

  function openEditor(widget?: Widget) {
    setActiveEditorTab('html');
    if (widget) {
      editingWidgetId = widget.id;
      editorModalTitle!.textContent = '编辑小组件';
      nameInput.value = widget.name;
      iconInput.value = widget.icon || 'code-2';
      sizeInput.value = widget.size === 'wide' ? 'wide' : 'normal';
      htmlEditor.value = widget.html;
      cssEditor.value = widget.css;
      jsEditor.value = widget.js;
      templateCards.forEach((card) => card.classList.remove('active'));
      syncSizeButtons(sizeInput.value as 'normal' | 'wide');
    } else {
      editingWidgetId = null;
      editorModalTitle!.textContent = '新建小组件';
      applyTemplate('clock');
    }
    widgetEditor!.style.display = 'flex';
    syncPreviewFrame();
  }

  addWidgetBtn?.addEventListener('click', () => openEditor());
  closeEditor?.addEventListener('click', closeWidgetEditor);
  cancelWidget?.addEventListener('click', closeWidgetEditor);
  widgetEditor?.addEventListener('click', (e) => {
    if (e.target === widgetEditor) closeWidgetEditor();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (widgetViewer?.classList.contains('open')) {
      closeWidgetViewerDialog();
      return;
    }
    if (widgetEditor?.style.display === 'flex') closeWidgetEditor();
  });

  function bindWidgetInteractions(card: HTMLElement, widget?: Widget) {
    const handle = card.querySelector('.resize-handle') as HTMLElement | null;
    handle?.addEventListener('pointerdown', (e) => {
      if (isWorkbenchLocked) return;
      e.preventDefault();
      e.stopPropagation();
      card.classList.add('resizing');

      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = Number.parseFloat(card.style.getPropertyValue('--widget-width')) || card.offsetWidth;
      const startHeight = Number.parseFloat(card.style.getPropertyValue('--widget-height')) || card.offsetHeight;
      const startMetrics = getWidgetGridMetrics(startWidth, startHeight);
      const startColSpan = startMetrics.colSpan;
      const startRowSpan = startMetrics.rowSpan;
      const wasArrangeMode = workbenchLayoutMode === 'arrange';
      const previousInlineWidth = card.style.width;
      const previousInlineHeight = card.style.height;
      const previousInlineMinHeight = card.style.minHeight;

      if (wasArrangeMode) {
        card.style.width = `${startWidth}px`;
        card.style.height = `${startHeight}px`;
      }

      let pendingWidth = startWidth;
      let pendingHeight = startHeight;
      let rafId = 0;

      const commitResize = () => {
        rafId = 0;
        const metrics = getWidgetGridMetrics(pendingWidth, pendingHeight);
        if (wasArrangeMode) {
          applyLiveCardSize(card, pendingWidth, pendingHeight);
          if (metrics.colSpan !== startColSpan || metrics.rowSpan !== startRowSpan) {
            applyCardSize(card, pendingWidth, pendingHeight);
            positionDragLayoutItems();
          }
        } else {
          applyCardSize(card, pendingWidth, pendingHeight);
        }
      };

      const onPointerMove = (moveEvent: PointerEvent) => {
        pendingWidth = Math.max(220, startWidth + moveEvent.clientX - startX);
        pendingHeight = Math.max(MIN_WIDGET_HEIGHT, startHeight + moveEvent.clientY - startY);
        if (!rafId) rafId = requestAnimationFrame(commitResize);
      };

      const onPointerUp = () => {
        if (rafId) {
          cancelAnimationFrame(rafId);
          commitResize();
        }
        card.classList.remove('resizing');
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        if (wasArrangeMode) {
          card.style.width = previousInlineWidth;
          card.style.height = previousInlineHeight;
          card.style.minHeight = previousInlineMinHeight;
          applyCardSize(card, pendingWidth, pendingHeight);
        }
        if (widget) {
          widget.size = pendingWidth > 420 ? 'wide' : 'normal';
          widget.width = pendingWidth;
          widget.height = pendingHeight;
          updateSavedWidget(widget);
        }
        persistCardLayout(card);
      };

      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    });

    const header = card.querySelector('.widget-header') as HTMLElement | null;
    header?.addEventListener('pointerdown', (e) => {
      if (isWorkbenchLocked) return;
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

  function buildWidgetSrcDoc(widget: Pick<Widget, 'html' | 'css' | 'js'>, label = 'Widget Error', overflow: 'hidden' | 'auto' = 'hidden') {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            html, body { width: 100%; height: 100%; margin: 0; padding: 0; }
            * { box-sizing: border-box; }
            body { font-family: -apple-system, system-ui, sans-serif; overflow: ${overflow}; background: transparent; }
            ${widget.css}
          </style>
        </head>
        <body>
          ${widget.html}
          <script>
            try { ${widget.js.replace(/<\/script/gi, '<\\/script')} } catch (e) { console.error('${label}:', e); }
          </script>
        </body>
      </html>
    `;
  }

  function openWidgetViewer(widget: Widget) {
    activeViewerWidget = widget;
    if (widgetViewerTitle) widgetViewerTitle.textContent = widget.name || '未命名组件';
    if (widgetViewerIcon) widgetViewerIcon.setAttribute('data-lucide', widget.icon || 'code-2');
    if (widgetViewerFrame) widgetViewerFrame.srcdoc = buildWidgetSrcDoc(widget, 'Widget Viewer Error', 'auto');
    widgetViewer?.classList.add('open');
    widgetViewer?.setAttribute('aria-hidden', 'false');
    renderLucideIconsSafe();
  }

  function setWidgetViewerFullscreen(enabled: boolean) {
    widgetViewer?.classList.toggle('fullscreen', enabled);
    toggleWidgetViewerFullscreen?.setAttribute('title', enabled ? '退出全屏' : '全屏');
    const icon = toggleWidgetViewerFullscreen?.querySelector('i');
    icon?.setAttribute('data-lucide', enabled ? 'minimize-2' : 'maximize-2');
    renderLucideIconsSafe();
  }

  function closeWidgetViewerDialog() {
    setWidgetViewerFullscreen(false);
    widgetViewer?.classList.remove('open');
    widgetViewer?.setAttribute('aria-hidden', 'true');
    if (widgetViewerFrame) widgetViewerFrame.srcdoc = '';
    activeViewerWidget = null;
  }

  refreshWidgetViewer?.addEventListener('click', () => {
    if (activeViewerWidget && widgetViewerFrame) {
      widgetViewerFrame.srcdoc = buildWidgetSrcDoc(activeViewerWidget, 'Widget Viewer Error', 'auto');
    }
  });

  editWidgetViewer?.addEventListener('click', () => {
    if (!activeViewerWidget) return;
    const widget = activeViewerWidget;
    closeWidgetViewerDialog();
    openEditor(widget);
  });

  toggleWidgetViewerFullscreen?.addEventListener('click', () => {
    setWidgetViewerFullscreen(!widgetViewer?.classList.contains('fullscreen'));
  });

  closeWidgetViewer?.addEventListener('click', closeWidgetViewerDialog);
  widgetViewer?.addEventListener('click', (e) => {
    if (e.target === widgetViewer) closeWidgetViewerDialog();
  });

  function hideWidgetContextMenu() {
    widgetContextMenu?.classList.remove('open');
    widgetContextMenu?.setAttribute('aria-hidden', 'true');
    contextMenuWidget = null;
  }

  function showWidgetContextMenu(event: MouseEvent, widget: Widget) {
    event.preventDefault();
    contextMenuWidget = widget;
    if (!widgetContextMenu) return;

    const menuWidth = 180;
    const menuHeight = 220;
    const left = Math.min(event.clientX, window.innerWidth - menuWidth - 12);
    const top = Math.min(event.clientY, window.innerHeight - menuHeight - 12);
    widgetContextMenu.style.left = `${Math.max(12, left)}px`;
    widgetContextMenu.style.top = `${Math.max(12, top)}px`;
    widgetContextMenu.classList.add('open');
    widgetContextMenu.setAttribute('aria-hidden', 'false');
    renderLucideIconsSafe();
  }

  widgetContextMenu?.addEventListener('click', (event) => {
    const action = (event.target as HTMLElement).closest<HTMLButtonElement>('button')?.dataset.action;
    if (!action || !contextMenuWidget) return;

    const widget = contextMenuWidget;
    const card = document.querySelector<HTMLElement>(`[data-widget-id="${widget.id}"]`);
    hideWidgetContextMenu();

    if (action === 'open') openWidgetViewer(widget);
    if (action === 'edit') openEditor(widget);
    if (action === 'duplicate') duplicateWidget(widget);
    if (action === 'reset' && card) {
      resetCardLayout(card, widget);
      scheduleWorkbenchLayoutRefresh();
      showToast('组件尺寸已重置', 'success');
    }
    if (action === 'delete' && confirm('确定要删除这个组件吗？')) deleteWidget(widget);
  });

  document.addEventListener('click', (event) => {
    if (!(event.target as HTMLElement).closest('#widgetContextMenu')) hideWidgetContextMenu();
  });

  function renderWidgetCard(widget: Widget) {
    const existing = document.querySelector(`[data-widget-id="${widget.id}"]`);
    if (existing) existing.remove();

    const card = document.createElement('div');
    card.className = `widget-card ${widget.size === 'wide' ? 'wide-widget' : ''} custom-code-widget`;
    card.setAttribute('data-widget-id', widget.id);
    applySavedLayout(card, widget);
    
    const srcDoc = buildWidgetSrcDoc(widget);

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
      <button class="widget-open-surface" type="button" title="点击查看完整小组件">
        <iframe class="custom-widget-frame" sandbox="allow-scripts"></iframe>
      </button>
      <div class="resize-handle" title="拖拽调整大小">
        <i data-lucide="grip-vertical"></i>
      </div>
    `;

    const iframe = card.querySelector('iframe');
    if (iframe) iframe.srcdoc = srcDoc;

    bindWidgetInteractions(card, widget);

    card.addEventListener('contextmenu', (event) => showWidgetContextMenu(event, widget));
    card.querySelector('.widget-open-surface')?.addEventListener('click', () => openWidgetViewer(widget));
    card.querySelector('.refresh-btn')?.addEventListener('click', () => {
      const iframe = card.querySelector('iframe');
      if (iframe) iframe.srcdoc = srcDoc;
    });
    card.querySelector('.edit-btn')?.addEventListener('click', () => openEditor(widget));
    card.querySelector('.delete-btn')?.addEventListener('click', () => {
      if (confirm('确定要删除这个组件吗？')) {
        deleteWidget(widget);
      }
    });

    workbenchGrid?.insertBefore(card, addWidgetBtn);
    setWorkbenchLayoutMode(workbenchLayoutMode);
    renderLucideIconsSafe();
  }

  saveWidgetBtn?.addEventListener('click', () => {
    const values = sanitizeWidgetValues();
    const validationMessage = validateWidget(values);
    if (validationMessage) {
      showToast(validationMessage, 'error');
      return;
    }

    const previous = editingWidgetId ? getSavedWidgets().find((w) => w.id === editingWidgetId) : null;
    const widget: Widget = {
      ...previous,
      id: editingWidgetId || Date.now().toString(),
      name: values.name,
      icon: values.icon,
      size: values.size,
      html: values.html,
      css: values.css,
      js: values.js
    };
    const saved = getSavedWidgets();
    if (editingWidgetId) {
      const idx = saved.findIndex((w) => w.id === editingWidgetId);
      if (idx > -1) saved[idx] = widget;
    } else saved.push(widget);

    if (!persistWidgetsSafely(saved)) return;

    renderWidgetCard(widget);
    closeWidgetEditor();
    showToast(editingWidgetId ? '小组件已更新' : '小组件已添加', 'success');
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
  syncWorkbenchLockState();
  scheduleWorkbenchLayoutRefresh();
  renderBuiltinWidgets();
  window.addEventListener('resize', () => scheduleWorkbenchLayoutRefresh());

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
