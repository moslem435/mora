import { storage, dbStorage } from '../storage';
import { showToast } from '../ui/toast';
import { showConfirm } from '../ui/confirm';
import { refreshLucideIcons } from '../ui/icons';
import { getSession, isAuthEnabled, login, signUp, logout } from '../services/auth-service';
import { validateRequiredForm } from '../utils/form';
import { createSettingsSelectController } from '../settings/custom-select';

function initSettingsPage() {
    const { convertSelectToCustom, refreshCustomSelect, bindGlobalClose } = createSettingsSelectController();
    let userAllowUpload = false;
    let currentUserId = '';

    const authContainer = document.getElementById('authContainer') as HTMLElement;
    const settingsContainer = document.querySelector('.settings-container') as HTMLElement;
    const currentEmail = document.getElementById('currentEmail');
    const currentRole = document.getElementById('currentRole');
    const uploadPermission = document.getElementById('uploadPermission');
    const logoutBtn = document.getElementById('logoutBtn') as HTMLButtonElement;
    const usersPanel = document.getElementById('usersPanel') as HTMLElement;
    const usersListBody = document.getElementById('usersListBody');

    const authForm = document.getElementById('authForm') as HTMLFormElement;
    const authEmail = document.getElementById('authEmail') as HTMLInputElement;
    const authPassword = document.getElementById('authPassword') as HTMLInputElement;
    const signUpBtn = document.getElementById('signUpBtn');

    const fontStyleSelect = document.getElementById('fontStyle') as HTMLSelectElement;
    const fontCustomLinkInput = document.getElementById('fontCustomLink') as HTMLInputElement;
    const fontFamilyNameInput = document.getElementById('fontFamilyName') as HTMLInputElement;
    const customFontLinkGroup = document.getElementById('customFontLinkGroup') as HTMLElement;
    const customFontFamilyGroup = document.getElementById('customFontFamilyGroup') as HTMLElement;
    const customFontFileGroup = document.getElementById('customFontFileGroup') as HTMLElement;
    const fontCustomFileInput = document.getElementById('fontCustomFile') as HTMLInputElement;
    const uploadFontBtn = document.getElementById('uploadFontBtn');
    const fontUploadStatus = document.getElementById('fontUploadStatus');

    const bgStyleSelect = document.getElementById('bgStyle') as HTMLSelectElement;
    const customBgUrlInput = document.getElementById('customBgUrl') as HTMLInputElement;
    const customBgUrlGroup = document.getElementById('customBgUrlGroup') as HTMLElement;
    const customBgFileGroup = document.getElementById('customBgFileGroup') as HTMLElement;
    const bgCustomFileInput = document.getElementById('bgCustomFile') as HTMLInputElement;
    const uploadBgBtn = document.getElementById('uploadBgBtn');
    const bgUploadStatus = document.getElementById('bgUploadStatus');

    const primaryColorSelect = document.getElementById('primaryColor') as HTMLSelectElement;
    const cardOpacityInput = document.getElementById('cardOpacity') as HTMLInputElement;
    const cardBlurInput = document.getElementById('cardBlur') as HTMLInputElement;
    const opacityVal = document.getElementById('opacityVal');
    const blurVal = document.getElementById('blurVal');
    const appearanceForm = document.getElementById('appearanceForm') as HTMLFormElement;

    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile') as HTMLInputElement;
    const resetBtn = document.getElementById('resetBtn');

    async function checkAuth() {
      if (!isAuthEnabled()) {
        authContainer.style.display = 'none';
        settingsContainer.style.display = 'block';
        userAllowUpload = true;
        if (currentEmail) currentEmail.textContent = '本地离线模式';
        if (currentRole) {
          currentRole.textContent = '本地管理员';
          currentRole.className = 'role-badge admin';
        }
        if (uploadPermission) uploadPermission.textContent = '文件上传：允许';
        initAppearanceForm();
        refreshLucideIcons();
        return;
      }

      const session = await getSession();
      if (!session) {
        authContainer.style.display = 'flex';
        settingsContainer.style.display = 'none';
        refreshLucideIcons();
        return;
      }

      currentUserId = session.user.id;
      authContainer.style.display = 'none';
      settingsContainer.style.display = 'block';
      if (logoutBtn) logoutBtn.style.display = 'inline-flex';
      if (currentEmail) currentEmail.textContent = session.user.email || '已登录账号';

      const [role, allowUpload] = await Promise.all([
        storage.getCurrentUserRole(),
        storage.getCurrentUserUploadPermission()
      ]);
      userAllowUpload = allowUpload;

      if (currentRole) {
        currentRole.textContent = role === 'admin' ? '超级管理员' : '普通会员';
        currentRole.className = `role-badge ${role}`;
      }
      if (uploadPermission) {
        uploadPermission.textContent = allowUpload ? '文件上传：允许' : '文件上传：禁止';
      }
      if (role === 'admin') {
        usersPanel.style.display = 'block';
        await renderUsersList();
      }
      initAppearanceForm();
      refreshLucideIcons();
    }

    function showSyncChooseModal(cloudData: any) {
      const modal = document.getElementById('syncChooseModal');
      const useLocalBtn = document.getElementById('syncUseLocalBtn');
      const useCloudBtn = document.getElementById('syncUseCloudBtn');
      const mergeBtn = document.getElementById('syncMergeBtn');

      if (!modal) return;
      modal.classList.add('open');

      const newUseLocal = useLocalBtn?.cloneNode(true) as HTMLButtonElement;
      const newUseCloud = useCloudBtn?.cloneNode(true) as HTMLButtonElement;
      const newMerge = mergeBtn?.cloneNode(true) as HTMLButtonElement;

      if (useLocalBtn && newUseLocal) useLocalBtn.parentNode?.replaceChild(newUseLocal, useLocalBtn);
      if (useCloudBtn && newUseCloud) useCloudBtn.parentNode?.replaceChild(newUseCloud, useCloudBtn);
      if (mergeBtn && newMerge) mergeBtn.parentNode?.replaceChild(newMerge, mergeBtn);

      newUseLocal?.addEventListener('click', async () => {
        showToast('正在上传本地数据...', 'info');
        try {
          await storage.uploadLocalData();
          showToast('同步成功！', 'success');
          modal.classList.remove('open');
          window.location.href = '/admin';
        } catch (e: any) {
          showToast(`上传失败: ${e.message || e}`, 'error');
        }
      });

      newUseCloud?.addEventListener('click', () => {
        showToast('正在拉取云端数据...', 'info');
        storage.applyCloudData(cloudData);
        showToast('同步成功！', 'success');
        modal.classList.remove('open');
        window.location.href = '/admin';
      });

      newMerge?.addEventListener('click', async () => {
        showToast('正在执行双向合并与同步...', 'info');
        try {
          await storage.mergeAndSyncData(cloudData);
          showToast('双向合并同步成功！', 'success');
          modal.classList.remove('open');
          window.location.href = '/admin';
        } catch (e: any) {
          showToast(`合并失败: ${e.message || e}`, 'error');
        }
      });
    }

    authForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = authEmail.value.trim();
      const password = authPassword.value;
      if (!email || !password) return;
      showToast('正在登录...', 'info');
      const { error } = await login(email, password);
      if (error) {
        showToast(`登录失败: ${error.message}`, 'error');
        return;
      }
      
      showToast('登录成功，正在检测数据同步...', 'success');
      try {
        const cloudData = await storage.fetchCloudData();
        if (cloudData) {
          const hasConflict = storage.checkConflict(cloudData);
          if (hasConflict) {
            if (authContainer) {
              authContainer.style.display = 'none';
              authContainer.remove(); // 彻底从 DOM 中移除以防挡住同步选择弹窗
            }
            showSyncChooseModal(cloudData);
            return;
          } else {
            storage.applyCloudData(cloudData);
          }
        } else {
          await storage.uploadLocalData();
        }
        window.location.href = '/admin';
      } catch (err: any) {
        console.error('Login sync error:', err);
        showToast(`数据同步失败: ${err.message || err}`, 'error');
      }
    });

    signUpBtn?.addEventListener('click', async () => {
      const email = authEmail.value.trim();
      const password = authPassword.value;
      if (!email || !password) {
        showToast('请先输入邮箱和密码', 'info');
        return;
      }
      if (password.length < 6) {
        showToast('密码长度至少为 6 位', 'info');
        return;
      }
      showToast('正在注册...', 'info');
      const { error, data } = await signUp(email, password);
      if (error) {
        showToast(`注册失败: ${error.message}`, 'error');
        return;
      }
      showToast('注册成功！如果开启了邮箱验证，请查收确认邮件。', 'success');
      if (data?.session) {
        await storage.saveAppearanceCloud(storage.getAppearance());
        window.location.href = '/admin';
      }
    });

    logoutBtn?.addEventListener('click', async () => {
      const ok = await showConfirm('确认退出', '确定要退出当前登录并清除本地缓存吗？');
      if (!ok) return;
      await logout();
      storage.resetToDefault();
      window.location.reload();
    });

    async function renderUsersList() {
      if (!usersListBody) return;
      usersListBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:18px;">载入会员列表中...</td></tr>';
      const profiles = await storage.getAllProfiles();
      usersListBody.innerHTML = '';
      if (profiles.length === 0) {
        usersListBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:18px;">暂无注册会员数据。</td></tr>';
        return;
      }

      profiles.forEach(profile => {
        const tr = document.createElement('tr');
        const joinDate = new Date(profile.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
        tr.innerHTML = `
          <td style="font-weight: 550; min-width: 140px; word-break: break-all;">${profile.email}</td>
          <td style="color: var(--color-text-sub); min-width: 95px;">${joinDate}</td>
          <td style="min-width: 120px;">
            <select class="role-select" data-id="${profile.id}">
              <option value="user" ${profile.role === 'user' ? 'selected' : ''}>普通会员</option>
              <option value="admin" ${profile.role === 'admin' ? 'selected' : ''}>超级管理员</option>
            </select>
          </td>
          <td style="min-width: 120px;">
            <select class="upload-select" data-id="${profile.id}">
              <option value="false" ${!profile.allow_upload ? 'selected' : ''}>禁止上传</option>
              <option value="true" ${profile.allow_upload ? 'selected' : ''}>允许上传</option>
            </select>
          </td>
        `;

        const select = tr.querySelector('.role-select') as HTMLSelectElement;
        const uploadSelect = tr.querySelector('.upload-select') as HTMLSelectElement;

        select?.addEventListener('change', async () => {
          try {
            showToast('正在修改用户权限...', 'info');
            await storage.updateUserProfileRole(profile.id, select.value as 'admin' | 'user', uploadSelect.value === 'true');
            showToast('权限修改成功！', 'success');
            if (currentUserId === profile.id) window.location.reload();
          } catch (err: any) {
            showToast(`修改失败: ${err.message || err}`, 'error');
            select.value = profile.role;
            refreshCustomSelect(select, 'plain');
          }
        });

        uploadSelect?.addEventListener('change', async () => {
          try {
            showToast('正在修改文件上传权限...', 'info');
            await storage.updateUserProfileRole(profile.id, select.value as 'admin' | 'user', uploadSelect.value === 'true');
            showToast('文件上传权限修改成功！', 'success');
          } catch (err: any) {
            showToast(`修改失败: ${err.message || err}`, 'error');
            uploadSelect.value = String(!!profile.allow_upload);
            refreshCustomSelect(uploadSelect, 'plain');
          }
        });

        usersListBody.appendChild(tr);

        if (select) convertSelectToCustom(select, 'plain');
        if (uploadSelect) convertSelectToCustom(uploadSelect, 'plain');
      });
    }

    function initCustomSelects() {
      convertSelectToCustom('fontStyle', 'plain');
      convertSelectToCustom('bgStyle', 'plain');
      convertSelectToCustom('primaryColor', 'color');
    }

    bindGlobalClose();

    function saveAndApplyAppearance() {
      const config = {
        fontStyle: fontStyleSelect?.value as any || 'system-sans',
        fontCustomLink: fontCustomLinkInput?.value.trim() || '',
        fontFamilyName: fontFamilyNameInput?.value.trim() || '',
        bgStyle: bgStyleSelect?.value as any || 'morandi-glow',
        customBgUrl: customBgUrlInput?.value.trim() || '',
        primaryColor: primaryColorSelect?.value || 'blue',
        cardOpacity: cardOpacityInput ? parseFloat(cardOpacityInput.value) : 0.65,
        cardBlur: cardBlurInput ? parseFloat(cardBlurInput.value) : 20
      };
      storage.saveAppearance(config);
      window.dispatchEvent(new CustomEvent('appearance-updated'));
    }

    function syncAppearanceVisibility() {
      if (customFontLinkGroup) customFontLinkGroup.style.display = fontStyleSelect.value === 'custom-link' ? 'block' : 'none';
      if (customFontFamilyGroup) customFontFamilyGroup.style.display = (fontStyleSelect.value === 'custom-link' || fontStyleSelect.value === 'custom-file') ? 'block' : 'none';
      if (customFontFileGroup) customFontFileGroup.style.display = fontStyleSelect.value === 'custom-file' ? 'block' : 'none';
      if (customBgUrlGroup) customBgUrlGroup.style.display = bgStyleSelect.value === 'custom-url' ? 'block' : 'none';
      if (customBgFileGroup) customBgFileGroup.style.display = bgStyleSelect.value === 'custom-file' ? 'block' : 'none';
    }

    function initAppearanceForm() {
      const config = storage.getAppearance();
      if (fontStyleSelect) fontStyleSelect.value = config.fontStyle || 'system-sans';
      if (fontCustomLinkInput) fontCustomLinkInput.value = config.fontCustomLink || '';
      if (fontFamilyNameInput) fontFamilyNameInput.value = config.fontFamilyName || '';
      if (bgStyleSelect) bgStyleSelect.value = config.bgStyle;
      if (customBgUrlInput) customBgUrlInput.value = config.customBgUrl || '';
      if (primaryColorSelect) primaryColorSelect.value = config.primaryColor;
      if (cardOpacityInput) {
        cardOpacityInput.value = String(config.cardOpacity);
        if (opacityVal) opacityVal.textContent = `${Math.round(config.cardOpacity * 100)}%`;
      }
      if (cardBlurInput) {
        cardBlurInput.value = String(config.cardBlur);
        if (blurVal) blurVal.textContent = `${Math.round((config.cardBlur / 40) * 100)}%`;
      }
      syncAppearanceVisibility();
      initCustomSelects();
      dbStorage.getAsset('custom-bg-file').then(file => {
        if (bgUploadStatus) bgUploadStatus.textContent = file ? `已载入: ${(file as File).name || '已上传壁纸'}` : '未上传本地文件';
      }).catch(() => {});
      dbStorage.getAsset('custom-font-file').then(file => {
        if (fontUploadStatus) fontUploadStatus.textContent = file ? `已载入: ${(file as File).name || '已上传字体'}` : '未上传本地文件';
      }).catch(() => {});
    }

    uploadFontBtn?.addEventListener('click', () => {
      if (!userAllowUpload) {
        showToast('您暂无上传物理文件权限，请联系管理员开通', 'error');
        return;
      }
      fontCustomFileInput?.click();
    });

    uploadBgBtn?.addEventListener('click', () => {
      if (!userAllowUpload) {
        showToast('您暂无上传物理文件权限，请联系管理员开通', 'error');
        return;
      }
      bgCustomFileInput?.click();
    });

    fontCustomFileInput?.addEventListener('change', async () => {
      const file = fontCustomFileInput.files?.[0];
      if (!file) return;
      if (fontUploadStatus) fontUploadStatus.textContent = `加载中: ${file.name}...`;
      try {
        const fileUrl = await dbStorage.saveAsset('custom-font-file', file);
        if (fileUrl) {
          if (fontCustomLinkInput) fontCustomLinkInput.value = fileUrl;
          if (fontStyleSelect) fontStyleSelect.value = 'custom-link';
          if (customFontLinkGroup) customFontLinkGroup.style.display = 'block';
          if (customFontFamilyGroup) customFontFamilyGroup.style.display = 'block';
        }
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || 'LocalCustomFont';
        if (fontFamilyNameInput && !fontFamilyNameInput.value.trim()) fontFamilyNameInput.value = baseName;
        if (fontUploadStatus) fontUploadStatus.textContent = `已载入: ${file.name}`;
        syncAppearanceVisibility();
        refreshCustomSelect(fontStyleSelect, 'plain');
        saveAndApplyAppearance();
      } catch (err: any) {
        if (fontUploadStatus) fontUploadStatus.textContent = `加载失败: ${err.message || err}`;
      }
    });

    bgCustomFileInput?.addEventListener('change', async () => {
      const file = bgCustomFileInput.files?.[0];
      if (!file) return;
      if (bgUploadStatus) bgUploadStatus.textContent = `加载中: ${file.name}...`;
      try {
        const fileUrl = await dbStorage.saveAsset('custom-bg-file', file);
        if (fileUrl) {
          if (customBgUrlInput) customBgUrlInput.value = fileUrl;
          if (bgStyleSelect) bgStyleSelect.value = 'custom-url';
        }
        if (bgUploadStatus) bgUploadStatus.textContent = `已载入: ${file.name}`;
        syncAppearanceVisibility();
        refreshCustomSelect(bgStyleSelect, 'plain');
        saveAndApplyAppearance();
      } catch (err: any) {
        if (bgUploadStatus) bgUploadStatus.textContent = `加载失败: ${err.message || err}`;
      }
    });

    let dragTimeout: any = null;

    function startDragging() {
      document.documentElement.classList.add('is-dragging');
      if (dragTimeout) clearTimeout(dragTimeout);
    }

    function stopDragging() {
      if (dragTimeout) clearTimeout(dragTimeout);
      dragTimeout = setTimeout(() => {
        document.documentElement.classList.remove('is-dragging');
      }, 50);
    }

    cardOpacityInput?.addEventListener('input', () => {
      startDragging();
      const opacity = parseFloat(cardOpacityInput.value);
      if (opacityVal) opacityVal.textContent = `${Math.round(opacity * 100)}%`;
      
      const doc = document.documentElement;
      doc.style.setProperty('--card-bg-opacity', String(opacity));
      
      const bgStyle = bgStyleSelect?.value || 'morandi-glow';
      if (bgStyle === 'dark-slate') {
        doc.style.setProperty('--card-bg', `rgba(38, 41, 43, ${opacity})`);
      } else {
        doc.style.setProperty('--card-bg', `rgba(255, 255, 255, ${opacity})`);
      }
    });

    cardOpacityInput?.addEventListener('change', () => {
      saveAndApplyAppearance();
      stopDragging();
    });

    cardBlurInput?.addEventListener('input', () => {
      startDragging();
      const blur = parseFloat(cardBlurInput.value);
      if (blurVal) blurVal.textContent = `${Math.round((blur / 40) * 100)}%`;
      document.documentElement.style.setProperty('--card-blur-radius', `${blur}px`);
    });

    cardBlurInput?.addEventListener('change', () => {
      saveAndApplyAppearance();
      stopDragging();
    });

    fontStyleSelect?.addEventListener('change', () => {
      if (fontStyleSelect.value === 'custom-file' && !userAllowUpload) {
        showToast('您暂无上传物理文件权限，请联系管理员开通', 'error');
        fontStyleSelect.value = storage.getAppearance().fontStyle || 'system-sans';
        refreshCustomSelect(fontStyleSelect, 'plain');
        return;
      }
      syncAppearanceVisibility();
      saveAndApplyAppearance();
    });

    bgStyleSelect?.addEventListener('change', () => {
      if (bgStyleSelect.value === 'custom-file' && !userAllowUpload) {
        showToast('您暂无上传物理文件权限，请联系管理员开通', 'error');
        bgStyleSelect.value = storage.getAppearance().bgStyle || 'morandi-glow';
        refreshCustomSelect(bgStyleSelect, 'plain');
        return;
      }
      syncAppearanceVisibility();
      saveAndApplyAppearance();
    });

    fontCustomLinkInput?.addEventListener('input', saveAndApplyAppearance);
    fontFamilyNameInput?.addEventListener('input', saveAndApplyAppearance);
    primaryColorSelect?.addEventListener('change', saveAndApplyAppearance);
    customBgUrlInput?.addEventListener('input', saveAndApplyAppearance);
    customBgUrlInput?.addEventListener('change', saveAndApplyAppearance);
    appearanceForm?.addEventListener('submit', (e) => e.preventDefault());

    exportBtn?.addEventListener('click', () => {
      const dataStr = storage.exportData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `personal_nav_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    importBtn?.addEventListener('click', async () => {
      const ok = await showConfirm('导入备份', '导入会覆盖当前本地与云端分类、链接和美化配置。建议先导出当前备份，确定继续吗？', true);
      if (ok) importFile?.click();
    });

    importFile?.addEventListener('change', () => {
      const file = importFile.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const success = storage.importData(e.target?.result as string);
        if (success) {
          showToast('数据导入成功！', 'success');
          initAppearanceForm();
          window.dispatchEvent(new CustomEvent('appearance-updated'));
          window.dispatchEvent(new CustomEvent('categories-updated'));
        } else {
          showToast('数据解析失败，请检查备份文件是否为有效的导航页 JSON 数据！', 'error');
        }
      };
      reader.readAsText(file);
      importFile.value = '';
    });

    resetBtn?.addEventListener('click', async () => {
      const ok = await showConfirm('恢复默认', '确定要恢复默认配置吗？当前分类、链接、美化和本地上传资产将被清空。', true);
      if (!ok) return;
      storage.resetToDefault();
      initAppearanceForm();
      window.dispatchEvent(new CustomEvent('appearance-updated'));
      window.dispatchEvent(new CustomEvent('categories-updated'));
      showToast('已恢复为默认配置', 'success');
    });

    checkAuth();
  }

document.addEventListener('astro:page-load', initSettingsPage);
