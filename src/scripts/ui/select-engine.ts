import { storage } from '../storage';

export type CustomSelectType = 'plain' | 'color' | 'category';

const CREATABLE_CATEGORY_SELECT_IDS = new Set(['linkCatId']);

// 安全地触发 Lucide 图标渲染
function refreshSelectIcons() {
  if (typeof window !== 'undefined' && (window as any).lucide) {
    try {
      (window as any).lucide.createIcons();
    } catch (err) {
      console.error('Lucide select rendering failed:', err);
    }
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isCreatableCategorySelect(select: HTMLSelectElement, type: CustomSelectType) {
  return type === 'category' && CREATABLE_CATEGORY_SELECT_IDS.has(select.id);
}

function getPendingCategoryName(select: HTMLSelectElement) {
  return select.dataset.pendingCategoryName?.trim() || '';
}

function clearPendingCategoryState(select: HTMLSelectElement) {
  delete select.dataset.pendingCategoryName;
  delete select.dataset.categorySearchQuery;
}

function getCategorySearchQuery(select: HTMLSelectElement) {
  return select.dataset.categorySearchQuery ?? getPendingCategoryName(select);
}

// 转换默认 Select 为自定义 Select 触发器与面板
export function convertSelectToCustom(
  selectOrId: string | HTMLSelectElement,
  type: CustomSelectType = 'plain'
) {
  const select = typeof selectOrId === 'string'
    ? document.getElementById(selectOrId) as HTMLSelectElement
    : selectOrId;
  if (!select) return;

  // 检测是否已经存在转换过的自定义外壳
  const existingWrapper = select.parentElement?.classList.contains('custom-select-wrapper')
    ? select.parentElement as HTMLElement
    : null;

  if (existingWrapper) {
    // 仅刷新选项容器与触发器
    const container = existingWrapper.querySelector('.custom-options-container');
    if (container) {
      container.innerHTML = generateOptionsMarkup(select, type);
      bindOptionsEvents(existingWrapper, select, type);
    }
    updateTriggerDisplay(existingWrapper, select, type);
    return;
  }

  // 首次转换：静默隐藏原 select
  select.style.display = 'none';

  // 创建外壳容器并包裹 select
  const wrapper = document.createElement('div');
  wrapper.className = 'custom-select-wrapper';
  if (isCreatableCategorySelect(select, type)) {
    wrapper.classList.add('is-searchable-category');
  }
  select.parentNode?.insertBefore(wrapper, select);
  wrapper.appendChild(select);

  // 创建显示当前选中的触发器
  const trigger = document.createElement('div');
  trigger.className = 'custom-select-trigger';
  trigger.innerHTML = `
    <div class="custom-select-trigger-content"></div>
    <i data-lucide="chevron-down" class="chevron-icon"></i>
  `;
  wrapper.appendChild(trigger);

  // 创建下拉菜单容器
  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'custom-options-container';
  optionsContainer.innerHTML = generateOptionsMarkup(select, type);
  wrapper.appendChild(optionsContainer);

  // 点击触发器展开或收起下拉面板
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();

    // 互斥关闭其它下拉框
    document.querySelectorAll('.custom-select-wrapper').forEach(w => {
      if (w !== wrapper) w.classList.remove('open');
    });

    // 智能判断弹出方向以防遮挡截断 (如在表格这类小高度容器中)
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const selectMenuHeight = 220;
    if (spaceBelow < selectMenuHeight && rect.top > selectMenuHeight) {
      wrapper.classList.add('open-up');
    } else {
      wrapper.classList.remove('open-up');
    }

    wrapper.classList.toggle('open');

    if (wrapper.classList.contains('open') && isCreatableCategorySelect(select, type)) {
      const searchInput = wrapper.querySelector('.custom-select-search-input') as HTMLInputElement | null;
      if (searchInput) {
        window.setTimeout(() => {
          searchInput.focus();
          searchInput.select();
        }, 10);
      }
    }
  });

  bindOptionsEvents(wrapper, select, type);
  updateTriggerDisplay(wrapper, select, type);

  // 联动表单 reset 事件
  const form = select.form;
  if (form && !form.dataset.hasResetSelectListener) {
    form.dataset.hasResetSelectListener = 'true';
    form.addEventListener('reset', () => {
      setTimeout(() => {
        form.querySelectorAll('select').forEach(sel => {
          const s = sel as HTMLSelectElement;
          clearPendingCategoryState(s);
          const w = s.parentElement?.classList.contains('custom-select-wrapper')
            ? s.parentElement as HTMLElement
            : null;
          if (w) {
            let t: CustomSelectType = 'plain';
            if (s.id.toLowerCase().includes('color')) {
              t = 'color';
            } else if (s.id.toLowerCase().includes('cat') && s.id !== 'editCatId' && s.id !== 'catId') {
              t = 'category';
            }
            const container = w.querySelector('.custom-options-container');
            if (container) {
              container.innerHTML = generateOptionsMarkup(s, t);
              bindOptionsEvents(w, s, t);
            }
            updateTriggerDisplay(w, s, t);

            // 同步高亮选中项
            w.querySelectorAll('.custom-option').forEach(opt => {
              const val = opt.getAttribute('data-value') || '';
              opt.classList.toggle('selected', val === s.value);
            });
          }
        });
      }, 10);
    });
  }
}

// 刷新自定义选择框状态并同步值
export function refreshCustomSelect(select: HTMLSelectElement | null, type: CustomSelectType = 'plain') {
  if (!select) return;
  const wrapper = select.parentElement?.classList.contains('custom-select-wrapper')
    ? select.parentElement as HTMLElement
    : null;
  if (!wrapper) return;

  const container = wrapper.querySelector('.custom-options-container');
  if (container) {
    container.innerHTML = generateOptionsMarkup(select, type);
    bindOptionsEvents(wrapper, select, type);
  }

  updateTriggerDisplay(wrapper, select, type);
  wrapper.querySelectorAll('.custom-option').forEach(opt => {
    opt.classList.toggle('selected', opt.getAttribute('data-value') === select.value);
  });
}

function generateOptionsMarkup(select: HTMLSelectElement, type: CustomSelectType) {
  if (isCreatableCategorySelect(select, type)) {
    const query = getCategorySearchQuery(select);
    return `
      <div class="custom-select-search-shell">
        <input
          type="text"
          class="custom-select-search-input"
          placeholder="搜索或新建分类..."
          value="${escapeHtml(query)}"
          autocomplete="off"
        />
      </div>
      <div class="custom-select-options-list">
        ${generateOptionsHtml(select, type, query)}
      </div>
    `;
  }

  return generateOptionsHtml(select, type);
}

// 生成下拉选项 HTML
function generateOptionsHtml(select: HTMLSelectElement, type: CustomSelectType, query = '') {
  const categories = storage.getCategories();
  const normalizedQuery = query.trim().toLowerCase();
  const options = Array.from(select.options);
  const filteredOptions = normalizedQuery && isCreatableCategorySelect(select, type)
    ? options.filter(opt => (opt.textContent || '').toLowerCase().includes(normalizedQuery))
    : options;

  const optionsHtml = filteredOptions.map(opt => {
    const val = opt.value;
    const text = opt.textContent || '';
    const isSelected = !getPendingCategoryName(select) && opt.selected ? 'selected' : '';

    if (type === 'color') {
      return `
        <div class="custom-option ${isSelected}" data-value="${val}">
          <div class="select-color-dot" style="background: var(--theme-${val})"></div>
          <span>${text}</span>
        </div>
      `;
    } else if (type === 'category') {
      const cat = categories.find(c => c.id === val);
      const icon = cat ? cat.icon : 'folder';
      const color = cat ? cat.color : 'blue';
      return `
        <div class="custom-option ${isSelected}" data-value="${val}">
          <i data-lucide="${icon}" class="select-cat-icon" style="color: var(--theme-${color})"></i>
          <span>${text}</span>
        </div>
      `;
    } else {
      // 纯文本/默认类型
      return `
        <div class="custom-option ${isSelected}" data-value="${val}">
          <span>${text}</span>
        </div>
      `;
    }
  }).join('');

  if (!isCreatableCategorySelect(select, type)) {
    return optionsHtml;
  }

  const exactMatch = options.some(opt => (opt.textContent || '').trim().toLowerCase() === normalizedQuery);
  const pendingCategoryName = getPendingCategoryName(select);
  const createOption = normalizedQuery && !exactMatch
    ? `
      <button type="button" class="custom-option custom-option-create ${pendingCategoryName.toLowerCase() === normalizedQuery ? 'selected' : ''}" data-create-category="${escapeHtml(query.trim())}">
        <i data-lucide="plus" class="select-cat-icon"></i>
        <span>创建分类「${escapeHtml(query.trim())}」</span>
      </button>
    `
    : '';

  const emptyState = !optionsHtml && !createOption
    ? '<div class="custom-select-empty">没有匹配的分类</div>'
    : '';

  return `${createOption}${optionsHtml}${emptyState}`;
}

// 绑定选项点击事件
function bindOptionsEvents(wrapper: HTMLElement, select: HTMLSelectElement, type: CustomSelectType) {
  if (isCreatableCategorySelect(select, type)) {
    const searchInput = wrapper.querySelector('.custom-select-search-input') as HTMLInputElement | null;
    const optionsList = wrapper.querySelector('.custom-select-options-list') as HTMLElement | null;

    if (searchInput && optionsList) {
      // 增加事件防重标记，防范打字重新绑定导致的事件监听器指数膨胀卡死
      if (!searchInput.dataset.hasInputListener) {
        searchInput.dataset.hasInputListener = 'true';

        searchInput.addEventListener('click', (e) => e.stopPropagation());
        searchInput.addEventListener('keydown', (e) => {
          e.stopPropagation();
          if (e.key === 'Escape') {
            wrapper.classList.remove('open');
          }
        });
        searchInput.addEventListener('input', () => {
          select.dataset.categorySearchQuery = searchInput.value;
          optionsList.innerHTML = generateOptionsHtml(select, type, searchInput.value);
          bindOptionsEvents(wrapper, select, type);
          refreshSelectIcons();
        });
      }
    }
  }

  const options = wrapper.querySelectorAll('.custom-option[data-value]');
  options.forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = opt.getAttribute('data-value') || '';

      clearPendingCategoryState(select);
      options.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');

      select.value = val;
      select.dispatchEvent(new Event('change'));

      updateTriggerDisplay(wrapper, select, type);
      wrapper.classList.remove('open');
    });
  });

  const createOptions = wrapper.querySelectorAll('.custom-option-create');
  createOptions.forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const pendingName = opt.getAttribute('data-create-category')?.trim() || '';
      if (!pendingName) return;

      select.dataset.pendingCategoryName = pendingName;
      select.dataset.categorySearchQuery = pendingName;
      select.dispatchEvent(new Event('change'));

      updateTriggerDisplay(wrapper, select, type);
      wrapper.classList.remove('open');
    });
  });

  refreshSelectIcons();
}

// 更新显示触发器文本及组件
export function updateTriggerDisplay(wrapper: HTMLElement, select: HTMLSelectElement, type: CustomSelectType) {
  const triggerContent = wrapper.querySelector('.custom-select-trigger-content');
  if (!triggerContent) return;

  const pendingCategoryName = getPendingCategoryName(select);
  if (isCreatableCategorySelect(select, type) && pendingCategoryName) {
    triggerContent.innerHTML = `
      <i data-lucide="plus" class="select-cat-icon" style="color: var(--theme-primary)"></i>
      <span>新分类：${escapeHtml(pendingCategoryName)}</span>
    `;
    refreshSelectIcons();
    return;
  }

  const selectedOpt = select.options[select.selectedIndex];
  if (!selectedOpt) {
    triggerContent.innerHTML = '<span>请选择...</span>';
    return;
  }

  const val = selectedOpt.value;
  const text = selectedOpt.textContent || '';

  if (type === 'color') {
    triggerContent.innerHTML = `
      <div class="select-color-dot" style="background: var(--theme-${val})"></div>
      <span>${text}</span>
    `;
  } else if (type === 'category') {
    const categories = storage.getCategories();
    const cat = categories.find(c => c.id === val);
    const icon = cat ? cat.icon : 'folder';
    const color = cat ? cat.color : 'blue';
    triggerContent.innerHTML = `
      <i data-lucide="${icon}" class="select-cat-icon" style="color: var(--theme-${color})"></i>
      <span>${text}</span>
    `;
  } else {
    triggerContent.innerHTML = `<span>${text}</span>`;
  }

  refreshSelectIcons();
}

// 全局监听：点击空白关闭下拉面板
if (typeof document !== 'undefined') {
  document.addEventListener('click', () => {
    document.querySelectorAll('.custom-select-wrapper').forEach(w => {
      w.classList.remove('open');
    });
  });
}
