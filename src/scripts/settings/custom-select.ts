import { refreshLucideIcons } from '../ui/icons';

export type SelectRenderType = 'plain' | 'color';

export function createSettingsSelectController() {
  function generateOptionsHtml(select: HTMLSelectElement, type: SelectRenderType) {
    return Array.from(select.options).map(opt => {
      const val = opt.value;
      const text = opt.textContent || '';
      const isSelected = opt.selected ? 'selected' : '';
      const iconHtml = type === 'color'
        ? `<div class="select-color-dot" style="background: var(--theme-${val})"></div>`
        : '';
      return `<div class="custom-option ${isSelected}" data-value="${val}">${iconHtml}<span>${text}</span></div>`;
    }).join('');
  }

  function updateTriggerDisplay(wrapper: HTMLElement, select: HTMLSelectElement, type: SelectRenderType) {
    const triggerContent = wrapper.querySelector('.custom-select-trigger-content');
    if (!triggerContent) return;
    const selectedOpt = select.options[select.selectedIndex];
    if (!selectedOpt) {
      triggerContent.innerHTML = '<span>请选择...</span>';
      return;
    }
    const val = selectedOpt.value;
    const text = selectedOpt.textContent || '';
    const iconHtml = type === 'color'
      ? `<div class="select-color-dot" style="background: var(--theme-${val})"></div>`
      : '';
    triggerContent.innerHTML = `${iconHtml}<span>${text}</span>`;
    refreshLucideIcons();
  }

  function bindOptionsEvents(wrapper: HTMLElement, select: HTMLSelectElement, type: SelectRenderType) {
    wrapper.querySelectorAll('.custom-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = opt.getAttribute('data-value') || '';
        wrapper.querySelectorAll('.custom-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        select.value = val;
        select.dispatchEvent(new Event('change'));
        updateTriggerDisplay(wrapper, select, type);
        wrapper.classList.remove('open');
      });
    });
  }

  function convertSelectToCustom(selectOrId: string | HTMLSelectElement, type: SelectRenderType = 'plain') {
    const select = typeof selectOrId === 'string'
      ? document.getElementById(selectOrId) as HTMLSelectElement
      : selectOrId;
    if (!select) return;

    const existingWrapper = select.parentElement?.classList.contains('custom-select-wrapper')
      ? select.parentElement as HTMLElement
      : null;

    if (existingWrapper) {
      const container = existingWrapper.querySelector('.custom-options-container');
      if (container) {
        container.innerHTML = generateOptionsHtml(select, type);
        bindOptionsEvents(existingWrapper, select, type);
      }
      updateTriggerDisplay(existingWrapper, select, type);
      return;
    }

    select.style.display = 'none';
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select-wrapper';
    select.parentNode?.insertBefore(wrapper, select);
    wrapper.appendChild(select);

    const trigger = document.createElement('div');
    trigger.className = 'custom-select-trigger';
    trigger.innerHTML = '<div class="custom-select-trigger-content"></div><i data-lucide="chevron-down" class="chevron-icon"></i>';
    wrapper.appendChild(trigger);

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'custom-options-container';
    optionsContainer.innerHTML = generateOptionsHtml(select, type);
    wrapper.appendChild(optionsContainer);

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.custom-select-wrapper').forEach(w => {
        if (w !== wrapper) w.classList.remove('open');
      });

      const rect = trigger.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const selectMenuHeight = 220;
      if (spaceBelow < selectMenuHeight && rect.top > selectMenuHeight) {
        wrapper.classList.add('open-up');
      } else {
        wrapper.classList.remove('open-up');
      }

      wrapper.classList.toggle('open');
    });

    bindOptionsEvents(wrapper, select, type);
    updateTriggerDisplay(wrapper, select, type);
  }

  function refreshCustomSelect(select: HTMLSelectElement | null, type: SelectRenderType = 'plain') {
    if (!select) return;
    const wrapper = select.parentElement?.classList.contains('custom-select-wrapper')
      ? select.parentElement as HTMLElement
      : null;
    if (!wrapper) return;
    updateTriggerDisplay(wrapper, select, type);
    wrapper.querySelectorAll('.custom-option').forEach(opt => {
      opt.classList.toggle('selected', opt.getAttribute('data-value') === select.value);
    });
  }

  function bindGlobalClose() {
    document.addEventListener('click', () => {
      document.querySelectorAll('.custom-select-wrapper').forEach(w => w.classList.remove('open'));
    });
  }

  return {
    convertSelectToCustom,
    refreshCustomSelect,
    updateTriggerDisplay,
    bindGlobalClose,
  };
}
