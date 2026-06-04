import { refreshLucideIcons } from './icons';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

export interface ToastHandle {
  update: (message: string, type: 'success' | 'error' | 'info') => void;
  close: () => void;
}

export function showToast(message: string, type: ToastType = 'info'): ToastHandle {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `custom-toast ${type}`;

  const getIconName = (t: ToastType) => {
    if (t === 'success') return 'check-circle';
    if (t === 'error') return 'alert-triangle';
    if (t === 'loading') return 'loader-2'; // 采用 Lucide 的 loader-2 配合旋转动画
    return 'info';
  };

  toast.innerHTML = `<i data-lucide="${getIconName(type)}" style="width: 16px; height: 16px;"></i><span>${message}</span>`;
  container.appendChild(toast);

  refreshLucideIcons();
  requestAnimationFrame(() => toast.classList.add('show'));

  let dismissTimeout: number | undefined;

  const autoDismiss = () => {
    dismissTimeout = window.setTimeout(() => {
      close();
    }, 3000);
  };

  const close = () => {
    if (dismissTimeout) window.clearTimeout(dismissTimeout);
    toast.classList.remove('show');
    toast.classList.add('fade-out');
    const onTransitionEnd = () => {
      toast.remove();
      toast.removeEventListener('transitionend', onTransitionEnd);
    };
    toast.addEventListener('transitionend', onTransitionEnd);
  };

  if (type !== 'loading') {
    autoDismiss();
  }

  return {
    update: (newMessage: string, newType: 'success' | 'error' | 'info') => {
      if (dismissTimeout) window.clearTimeout(dismissTimeout);
      toast.className = `custom-toast ${newType} show`;
      toast.innerHTML = `<i data-lucide="${getIconName(newType)}" style="width: 16px; height: 16px;"></i><span>${newMessage}</span>`;
      refreshLucideIcons();
      autoDismiss();
    },
    close
  };
}

export function setPendingToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('pending_toast', JSON.stringify({ message, type }));
  }
}

export function checkAndShowPendingToast() {
  if (typeof window === 'undefined') return;
  const pending = sessionStorage.getItem('pending_toast');
  if (pending) {
    try {
      const { message, type } = JSON.parse(pending);
      showToast(message, type);
    } catch (e) {
      console.error('Failed to parse pending toast:', e);
    }
    sessionStorage.removeItem('pending_toast');
  }
}

// 自动在客户端环境初始化检测，保证跳转到任何页面都能检测展示
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndShowPendingToast);
  } else {
    setTimeout(checkAndShowPendingToast, 50);
  }
}

