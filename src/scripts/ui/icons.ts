export function refreshLucideIcons() {
  const lucide = (window as any).lucide;
  if (!lucide) return;

  try {
    lucide.createIcons();
  } catch (err) {
    console.error(err);
  }
}

export function renderLucideIconsSafe() {
  const runLucide = () => {
    try {
      if ((window as any).lucide) {
        (window as any).lucide.createIcons();
      } else {
        setTimeout(runLucide, 50);
      }
    } catch (err) {
      console.error('Lucide safe rendering failed:', err);
    }
  };

  runLucide();
}
