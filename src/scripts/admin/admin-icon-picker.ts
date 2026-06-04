export function createAdminIconPicker() {
  const POPULAR_LUCIDE_ICONS = [
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

  function initIconPicker(wrapperId: string, inputId: string) {
    const wrapper = document.getElementById(wrapperId);
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (!wrapper || !input) return;

    const dropdown = wrapper.querySelector('.icon-picker-dropdown') as HTMLElement;
    const searchInput = wrapper.querySelector('.icon-picker-search') as HTMLInputElement;
    const grid = wrapper.querySelector('.icon-picker-grid') as HTMLElement;

    if (!dropdown || !searchInput || !grid) return;

    renderIconGrid('');

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

    dropdown.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    searchInput.addEventListener('input', () => {
      const val = searchInput.value.trim().toLowerCase();
      renderIconGrid(val);
    });

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
          input.dispatchEvent(new Event('input'));
          input.dispatchEvent(new Event('change'));
          wrapper.querySelectorAll('.icon-picker-item').forEach(btn => btn.classList.remove('active'));
          item.classList.add('active');
          wrapper.classList.remove('open');
          searchInput.value = '';
          renderIconGrid('');
        });

        grid.appendChild(item);
      });

      if ((window as any).lucide) {
        try {
          (window as any).lucide.createIcons({
            attrs: {
              class: 'lucide-icon'
            },
            node: grid
          });
        } catch (err) {
          console.error('Lucide picker rendering failed:', err);
        }
      }
    }
  }

  return {
    initIconPicker,
  };
}
