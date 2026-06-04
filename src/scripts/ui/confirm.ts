import { refreshLucideIcons } from './icons';

let confirmResolve: ((value: boolean) => void) | null = null;
let listenersBound = false;

function closeConfirmModal(result: boolean) {
  document.getElementById('customConfirmModal')?.classList.remove('open');
  confirmResolve?.(result);
  confirmResolve = null;
}

function bindConfirmListeners() {
  if (listenersBound) return;

  document.getElementById('confirmOkBtn')?.addEventListener('click', () => {
    closeConfirmModal(true);
  });

  document.getElementById('confirmCancelBtn')?.addEventListener('click', () => {
    closeConfirmModal(false);
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

    if (!modal || !titleEl || !msgEl) {
      resolve(false);
      return;
    }

    titleEl.textContent = title;
    msgEl.textContent = message;

    if (iconEl) {
      iconEl.setAttribute('data-lucide', danger ? 'alert-triangle' : 'help-circle');
      iconEl.style.color = danger ? '#c47575' : 'var(--theme-primary)';
    }

    modal.classList.add('open');
    refreshLucideIcons();
    confirmResolve = resolve;
  });
}
