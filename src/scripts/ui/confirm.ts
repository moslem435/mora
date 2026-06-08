import { refreshLucideIcons } from './icons';

let confirmResolve: ((value: boolean) => void) | null = null;
let listenersBound = false;
let lastFocused: HTMLElement | null = null;

function closeConfirmModal(result: boolean) {
  const modal = document.getElementById('customConfirmModal');
  modal?.classList.remove('open');

  const resolve = confirmResolve;
  confirmResolve = null;
  resolve?.(result);

  // restore focus to the control that opened the dialog
  if (lastFocused && typeof lastFocused.focus === 'function') {
    lastFocused.focus();
  }
  lastFocused = null;
}

function bindConfirmListeners() {
  if (listenersBound) return;

  const modal = document.getElementById('customConfirmModal');

  document.getElementById('confirmOkBtn')?.addEventListener('click', () => {
    closeConfirmModal(true);
  });

  document.getElementById('confirmCancelBtn')?.addEventListener('click', () => {
    closeConfirmModal(false);
  });

  // click on backdrop (outside the box) cancels
  modal?.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeConfirmModal(false);
    }
  });

  // Escape cancels while the dialog is open
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && confirmResolve && modal?.classList.contains('open')) {
      event.preventDefault();
      closeConfirmModal(false);
    }
  });

  listenersBound = true;
}

export function showConfirm(title: string, message: string, danger = false): Promise<boolean> {
  bindConfirmListeners();

  return new Promise((resolve) => {
    const modal = document.getElementById('customConfirmModal');
    const titleEl = document.getElementById('confirmTitle');
    const msgEl = document.getElementById('confirmMessage');
    const iconEl = document.getElementById('confirmIcon');
    const okBtn = document.getElementById('confirmOkBtn') as HTMLButtonElement | null;

    if (!modal || !titleEl || !msgEl) {
      resolve(false);
      return;
    }

    // if a previous confirm is still pending, resolve it as cancelled first
    if (confirmResolve) {
      const prev = confirmResolve;
      confirmResolve = null;
      prev(false);
    }

    lastFocused = document.activeElement as HTMLElement | null;

    titleEl.textContent = title;
    msgEl.textContent = message;

    if (iconEl) {
      iconEl.setAttribute('data-lucide', danger ? 'alert-triangle' : 'help-circle');
      iconEl.style.color = danger ? '#c47575' : 'var(--theme-primary)';
    }

    modal.classList.add('open');
    refreshLucideIcons();
    confirmResolve = resolve;

    // move focus into the dialog for keyboard users
    window.setTimeout(() => okBtn?.focus(), 20);
  });
}
