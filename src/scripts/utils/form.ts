export function validateRequiredForm(form: HTMLFormElement, onError: (message: string) => void): boolean {
  const inputs = form.querySelectorAll('input[required], select[required]');
  for (const input of Array.from(inputs)) {
    const element = input as HTMLInputElement | HTMLSelectElement;
    if (!element.value.trim()) {
      const formGroup = element.closest('.form-group');
      const label = formGroup?.querySelector('label')?.textContent || '必填字段';
      onError(`请填写「${label}」！`);
      element.focus();

      const originalBorder = element.style.borderColor;
      const originalShadow = element.style.boxShadow;
      element.style.borderColor = '#c47575';
      element.style.boxShadow = '0 0 0 3px rgba(196, 117, 117, 0.22)';

      setTimeout(() => {
        element.style.borderColor = originalBorder;
        element.style.boxShadow = originalShadow;
      }, 2000);

      return false;
    }
  }

  return true;
}
