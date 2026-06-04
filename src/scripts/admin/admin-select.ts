import { storage } from '../storage';

export type AdminSelectType = 'color' | 'category';

export function createAdminSelectController() {
  function generateOptionsHtml(select: HTMLSelectElement, type: AdminSelectType) {
    const categories = storage.getCategories();
    return Array.from(select.options).map(opt => {
      const val = opt.value;
      const text = opt.textContent || '';
      const isSelected = opt.selected ? 'selected' : '';

      if (type === 'color') {
        return `
          <div class="custom-option ${isSelected}" data-value="${val}">
            <div class="select-color-dot" style="background: var(--theme-${val})"></div>
            <span>${text}</span>
          </div>
        `;
      }

      const cat = categories.find(c => c.id === val);
      const icon = cat ? cat.icon : 'folder';
      const color = cat ? cat.color : 'blue';
      return `
        <div class="custom-option ${isSelected}" data-value="${val}">
          <i data-lucide="${icon}" class="select-cat-icon" style="color: var(--theme-${color})"></i>
          <span>${text}</span>
        </div>
      `;
    }).join('');
  }

  function updateTriggerDisplay(wrapper: HTMLElement, select: HTMLSelectElement, type: AdminSelectType) {
    const triggerContent = wrapper.querySelector('.custom-select-trigger-content');
    if (!triggerContent) return;

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
    } else {
      const categories = storage.getCategories();
      const cat = categories.find(c => c.id === val);
      const icon = cat ? cat.icon : 'folder';
      const color = cat ? cat.color : 'blue';
      triggerContent.innerHTML = `
        <i data-lucide="${icon}" class="select-cat-icon" style="color: var(--theme-${color})"></i>
        <span>${text}</span>
      `;
    }

    if ((window as any).lucide) {
      try {
        (window as any).lucide.createIcons();
      } catch (err) {
        console.error('Lucide trigger rendering failed:', err);
      }
    }
  }

  function bindOptionsEvents(wrapper: HTMLElement, select: HTMLSelectElement, type: AdminSelectType) {
    const options = wrapper.querySelectorAll('.custom-option');
    options.forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = opt.getAttribute('data-value') || '';

        options.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');

        select.value = val;
        select.dispatchEvent(new Event('change'));

        updateTriggerDisplay(wrapper, select, type);
        wrapper.classList.remove('open');
      });
    });
  }

  function convertSelectToCustom(selectId: string, type: AdminSelectType) {
    const select = document.getElementById(selectId) as HTMLSelectElement;
    if (!select) return;

    const wrapper = select.parentElement?.classList.contains('custom-select-wrapper')
      ? select.parentElement as HTMLElement
      : null;

    if (wrapper) {
      const container = wrapper.querySelector('.custom-options-container');
      if (container) {
        container.innerHTML = generateOptionsHtml(select, type);
        bindOptionsEvents(wrapper, select, type);
      }
      updateTriggerDisplay(wrapper, select, type);
      return;
    }

    select.style.display = 'none';
    const newWrapper = document.createElement('div');
    newWrapper.className = 'custom-select-wrapper';
    select.parentNode?.insertBefore(newWrapper, select);
    newWrapper.appendChild(select);

    const trigger = document.createElement('div');
    trigger.className = 'custom-select-trigger';
    trigger.innerHTML = `
      <div class="custom-select-trigger-content"></div>
      <i data-lucide="chevron-down" class="chevron-icon"></i>
    `;
    newWrapper.appendChild(trigger);

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'custom-options-container';
    optionsContainer.innerHTML = generateOptionsHtml(select, type);
    newWrapper.appendChild(optionsContainer);

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.custom-select-wrapper').forEach(w => {
        if (w !== newWrapper) w.classList.remove('open');
      });
      newWrapper.classList.toggle('open');
    });

    bindOptionsEvents(newWrapper, select, type);
    updateTriggerDisplay(newWrapper, select, type);

    const form = select.form;
    if (form) {
      if (!form.dataset.hasResetSelectListener) {
        form.dataset.hasResetSelectListener = 'true';
        form.addEventListener('reset', () => {
          setTimeout(() => {
            form.querySelectorAll('select').forEach(sel => {
              const s = sel as HTMLSelectElement;
              const w = s.parentElement?.classList.contains('custom-select-wrapper')
                ? s.parentElement as HTMLElement
                : null;
              if (w) {
                const t = s.id.toLowerCase().includes('color') ? 'color' : 'category';
                updateTriggerDisplay(w, s, t as AdminSelectType);
                const opts = w.querySelectorAll('.custom-option');
                opts.forEach(opt => {
                  const val = opt.getAttribute('data-value') || '';
                  if (val === s.value) {
                    opt.classList.add('selected');
                  } else {
                    opt.classList.remove('selected');
                  }
                });
              }
            });
          }, 10);
        });
      }
    }
  }

  function bindGlobalClose() {
    document.addEventListener('click', () => {
      document.querySelectorAll('.custom-select-wrapper').forEach(w => {
        w.classList.remove('open');
      });
      document.querySelectorAll('.icon-picker-wrapper').forEach(w => {
        w.classList.remove('open');
      });
    });
  }

  return {
    convertSelectToCustom,
    updateTriggerDisplay,
    bindGlobalClose,
  };
}
