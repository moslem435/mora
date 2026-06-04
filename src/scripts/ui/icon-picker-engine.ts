// 常用 Lucide 图标名称列表
export const POPULAR_LUCIDE_ICONS = [
  'folder', 'star', 'wrench', 'coffee', 'code-xml', 'external-link',
  'github', 'chrome', 'globe', 'compass', 'notebook-tabs', 'languages',
  'image-minus', 'play', 'ticket', 'message-square-more', 'file-text',
  'palette', 'framer', 'settings', 'user', 'search', 'home', 'arrow-left',
  'plus', 'pencil', 'trash-2', 'palette', 'download', 'upload', 'rotate-ccw',
  'help-circle', 'check-circle', 'alert-triangle', 'info', 'book', 'bookmark',
  'calendar', 'camera', 'check', 'clipboard', 'clock', 'cloud', 'database',
  'eye', 'eye-off', 'gift', 'heart', 'key', 'link', 'list', 'lock', 'mail',
  'map', 'map-pin', 'menu', 'mic', 'music', 'paperclip', 'phone', 'send',
  'share-2', 'shopping-cart', 'smile', 'terminal', 'thumbs-up', 'tv', 'video',
  'wifi', 'zap', 'alert-circle', 'bell', 'briefcase', 'activity', 'cpu', 'hard-drive',
  'monitor', 'smartphone', 'tablet', 'battery', 'bluetooth', 'wifi-off'
];

// 安全地为指定 DOM 节点渲染 Lucide 矢量图标
function renderPickerIconsSafe(gridNode: HTMLElement) {
  if (typeof window !== 'undefined' && (window as any).lucide) {
    try {
      (window as any).lucide.createIcons({
        attrs: {
          class: 'lucide-icon'
        },
        node: gridNode
      });
    } catch (err) {
      console.error('Lucide picker grid rendering failed:', err);
    }
  }
}

// 初始化可搜索的图标选择器控件
export function initIconPicker(wrapperId: string, inputId: string) {
  const wrapper = document.getElementById(wrapperId);
  const input = document.getElementById(inputId) as HTMLInputElement;
  if (!wrapper || !input) return;

  const dropdown = wrapper.querySelector('.icon-picker-dropdown') as HTMLElement;
  const searchInput = wrapper.querySelector('.icon-picker-search') as HTMLInputElement;
  const grid = wrapper.querySelector('.icon-picker-grid') as HTMLElement;

  if (!dropdown || !searchInput || !grid) return;

  // 渲染初始图标列表
  renderIconGrid('');

  // 点击/聚焦输入框时展开面板并收拢其他选择器
  input.addEventListener('focus', (e) => {
    e.stopPropagation();
    
    document.querySelectorAll('.icon-picker-wrapper').forEach(w => {
      if (w !== wrapper) w.classList.remove('open');
    });
    document.querySelectorAll('.custom-select-wrapper').forEach(w => {
      w.classList.remove('open');
    });

    wrapper.classList.add('open');
  });

  // 阻止下拉区域点击事件向外冒泡导致关闭
  dropdown.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // 输入搜索检索
  searchInput.addEventListener('input', () => {
    const val = searchInput.value.trim().toLowerCase();
    renderIconGrid(val);
  });

  // 阻止输入框本身的点击冒泡
  input.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  function renderIconGrid(query: string) {
    grid.innerHTML = '';
    const filtered = POPULAR_LUCIDE_ICONS.filter(icon => icon.includes(query));

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="icon-picker-empty">无匹配图标</div>';
      return;
    }

    filtered.forEach(icon => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'icon-picker-item';
      if (input.value.trim() === icon) {
        item.classList.add('active');
      }
      item.title = icon;
      item.innerHTML = `<i data-lucide="${icon}"></i>`;
      
      item.addEventListener('click', () => {
        input.value = icon;
        // 触发 input 及 change 事件以便 Astro 客户端脚本响应更新
        input.dispatchEvent(new Event('input'));
        input.dispatchEvent(new Event('change'));
        
        // 标记选中状态
        wrapper.querySelectorAll('.icon-picker-item').forEach(btn => btn.classList.remove('active'));
        item.classList.add('active');
        
        // 关闭弹窗并重置搜索
        wrapper.classList.remove('open');
        searchInput.value = '';
        renderIconGrid('');
      });

      grid.appendChild(item);
    });

    renderPickerIconsSafe(grid);
  }
}

// 全局监听：点击页面任意其它区域关闭图标选择器面板
if (typeof document !== 'undefined') {
  document.addEventListener('click', () => {
    document.querySelectorAll('.icon-picker-wrapper').forEach(w => {
      w.classList.remove('open');
    });
  });
}
