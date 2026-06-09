import { storage, supabase, isSupabaseConfigured } from '../storage';
import { showToast, setPendingToast } from '../ui/toast';
import { showConfirm } from '../ui/confirm';
import { convertSelectToCustom, updateTriggerDisplay, refreshCustomSelect } from '../ui/select-engine';
import { initIconPicker } from '../ui/icon-picker-engine';
import { renderLucideIconsSafe, refreshLucideIcons } from '../ui/icons';
import { createAdminRenderers } from '../admin/admin-renderers';
import { validateRequiredForm } from '../utils/form';
import {
  clearQuickAddDraft,
  getQuickAddHostLabel,
  getSuggestedLinkTitle,
  readQuickAddDraft,
  fetchUrlMetadata,
  normalizeUrlCandidate,
} from '../utils/link-quick-add';

function validateForm(form: HTMLFormElement): boolean {
  const inputs = form.querySelectorAll('input[required], select[required]');
  for (const input of Array.from(inputs)) {
    const element = input as HTMLInputElement | HTMLSelectElement;

    if (element.tagName.toLowerCase() === 'select') {
      const select = element as HTMLSelectElement;
      if (select.dataset.pendingCategoryName?.trim()) {
        continue;
      }
    }

    if (!element.value.trim()) {
      return validateRequiredForm(form, (message) => showToast(message, 'error'));
    }
  }

  return true;
}

function initAdminConsole() {
  const categoryList = document.getElementById('categoryList');
  const categoryTabs = document.getElementById('categoryTabs');
  const linksList = document.getElementById('linksList');
  const linkCatId = document.getElementById('linkCatId') as HTMLSelectElement | null;
  const editLinkCatId = document.getElementById('editLinkCatId') as HTMLSelectElement | null;

  const addCatForm = document.getElementById('addCatForm') as HTMLFormElement | null;
  const addLinkForm = document.getElementById('addLinkForm') as HTMLFormElement | null;
  const linkTitleInput = document.getElementById('linkTitle') as HTMLInputElement | null;
  const linkUrlInput = document.getElementById('linkUrl') as HTMLInputElement | null;
  const linkDescInput = document.getElementById('linkDesc') as HTMLInputElement | null;
  const linkIconInput = document.getElementById('linkIcon') as HTMLInputElement | null;

  const identifyLinkBtn = document.getElementById('identifyLinkBtn') as HTMLButtonElement | null;
  const identifyEditLinkBtn = document.getElementById('identifyEditLinkBtn') as HTMLButtonElement | null;

  const editCatModal = document.getElementById('editCatModal');
  const editCatForm = document.getElementById('editCatForm') as HTMLFormElement | null;
  const closeCatModal = document.getElementById('closeCatModal');

  const editLinkModal = document.getElementById('editLinkModal');
  const editLinkForm = document.getElementById('editLinkForm') as HTMLFormElement | null;
  const closeLinkModal = document.getElementById('closeLinkModal');

  const openAddLinkBtn = document.getElementById('openAddLinkBtn');
  const addLinkModal = document.getElementById('addLinkModal');
  const closeAddLinkModal = document.getElementById('closeAddLinkModal');

  const authForm = document.getElementById('authForm');
  const authEmail = document.getElementById('authEmail') as HTMLInputElement | null;
  const authPassword = document.getElementById('authPassword') as HTMLInputElement | null;
  const signUpBtn = document.getElementById('signUpBtn') as HTMLButtonElement | null;

  let pendingQuickAddDraft = readQuickAddDraft();
  let hasAutoOpenedQuickAdd = false;
  let activeTabCatId = 'all';

  function refreshCategorySelectDisplay(select: HTMLSelectElement | null, type: 'color' | 'category') {
    if (!select) return;
    const wrapper = select.parentElement?.classList.contains('custom-select-wrapper')
      ? select.parentElement as HTMLElement
      : null;
    if (!wrapper) return;

    updateTriggerDisplay(wrapper, select, type);
    wrapper.querySelectorAll('.custom-option').forEach((opt) => {
      const value = opt.getAttribute('data-value') || '';
      opt.classList.toggle('selected', value === select.value);
    });
  }

  function initCustomSelects() {
    [
      { id: 'catColor', type: 'color' as const },
      { id: 'editCatColor', type: 'color' as const },
      { id: 'linkCatId', type: 'category' as const },
      { id: 'editLinkCatId', type: 'category' as const },
      { id: 'fontStyle', type: 'plain' as const },
      { id: 'primaryColor', type: 'plain' as const },
      { id: 'bgStyle', type: 'plain' as const },
    ].forEach(({ id, type }) => {
      const select = document.getElementById(id) as HTMLSelectElement | null;
      if (select) {
        convertSelectToCustom(select, type);
      }
    });
  }

  function closeAddLinkDialog(shouldReset = true) {
    addLinkModal?.classList.remove('open');

    if (shouldReset) {
      addLinkForm?.reset();
      pendingQuickAddDraft = null;
      clearQuickAddDraft();

      if (linkIconInput) {
        linkIconInput.value = 'external-link';
      }
    }

    refreshCategorySelectDisplay(linkCatId, 'category');
  }

  function fillAddLinkDraft() {
    pendingQuickAddDraft = readQuickAddDraft();
    if (!pendingQuickAddDraft) return;

    if (linkUrlInput) {
      linkUrlInput.value = pendingQuickAddDraft.url;
    }

    if (linkTitleInput && !linkTitleInput.value.trim()) {
      linkTitleInput.value = pendingQuickAddDraft.title?.trim() || getSuggestedLinkTitle(pendingQuickAddDraft.url);
    }

    if (linkIconInput && !linkIconInput.value.trim()) {
      linkIconInput.value = 'external-link';
    }

    if (linkDescInput && pendingQuickAddDraft.description && !linkDescInput.value.trim()) {
      linkDescInput.value = pendingQuickAddDraft.description;
    }

    window.setTimeout(() => {
      if (linkTitleInput?.value.trim()) {
        linkTitleInput.focus();
        linkTitleInput.select();
      } else {
        linkTitleInput?.focus();
      }
    }, 30);

    showToast(`已识别 ${getQuickAddHostLabel(pendingQuickAddDraft.url)}，网址已自动带入添加框`, 'info');
  }

  function openAddLinkDialog() {
    if (activeTabCatId !== 'all' && linkCatId) {
      linkCatId.value = activeTabCatId;
      refreshCategorySelectDisplay(linkCatId, 'category');
    }

    addLinkModal?.classList.add('open');
    fillAddLinkDraft();
  }

  async function initDashboardStats() {
    const statUsers = document.getElementById('statUsers');
    const statCategories = document.getElementById('statCategories');
    const statLinks = document.getElementById('statLinks');

    if (!isSupabaseConfigured) {
      if (statUsers) statUsers.textContent = '1';
      if (statCategories) statCategories.textContent = storage.getCategories().length.toString();
      if (statLinks) statLinks.textContent = storage.getLinks().length.toString();
      return;
    }

    try {
      if (statCategories) statCategories.textContent = storage.getCategories().length.toString();
      if (statLinks) statLinks.textContent = storage.getLinks().length.toString();

      const { count, error } = await supabase!
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (!error && count !== null && statUsers) {
        statUsers.textContent = count.toString();
      } else if (statUsers) {
        statUsers.textContent = '-';
      }
    } catch (error) {
      console.error('Failed to load dashboard stats', error);
      if (statUsers) statUsers.textContent = '-';
    }
  }

  async function renderUsersList() {
    const usersListBody = document.getElementById('usersListBody');
    if (!usersListBody) return;

    usersListBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px; color: var(--color-text-sub);">正在拉取成员列表...</td></tr>';

    try {
      const profiles = await storage.getAllProfiles();
      usersListBody.innerHTML = '';

      if (profiles.length === 0) {
        usersListBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px; color: var(--color-text-sub);">暂无注册成员数据。</td></tr>';
        return;
      }

      const { data: { user } } = await supabase!.auth.getUser();
      const currentUserId = user?.id;

      profiles.forEach((profile) => {
        const tr = document.createElement('tr');
        const joinDate = new Date(profile.created_at).toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });

        tr.innerHTML = `
          <td style="padding: 14px 20px; font-weight: 550; word-break: break-all;">${profile.email}</td>
          <td style="padding: 14px 20px; color: var(--color-text-sub);">${joinDate}</td>
          <td style="padding: 14px 20px;">
            <select class="role-select" data-id="${profile.id}">
              <option value="user" ${profile.role === 'user' ? 'selected' : ''}>普通会员</option>
              <option value="admin" ${profile.role === 'admin' ? 'selected' : ''}>超级管理员</option>
            </select>
          </td>
          <td style="padding: 14px 20px;">
            <select class="upload-select" data-id="${profile.id}">
              <option value="false" ${!profile.allow_upload ? 'selected' : ''}>禁止上传</option>
              <option value="true" ${profile.allow_upload ? 'selected' : ''}>允许上传</option>
            </select>
          </td>
        `;

        const roleSelect = tr.querySelector('.role-select') as HTMLSelectElement | null;
        const uploadSelect = tr.querySelector('.upload-select') as HTMLSelectElement | null;

        roleSelect?.addEventListener('change', async () => {
          try {
            showToast('正在修改用户角色...', 'info');
            await storage.updateUserProfileRole(profile.id, roleSelect.value as 'admin' | 'user', uploadSelect?.value === 'true');
            showToast('角色权限修改成功！', 'success');
            if (currentUserId === profile.id) window.location.reload();
          } catch (error: any) {
            showToast(`修改失败: ${error.message || error}`, 'error');
            roleSelect.value = profile.role;
            refreshCustomSelect(roleSelect, 'plain');
          }
        });

        uploadSelect?.addEventListener('change', async () => {
          try {
            showToast('正在修改上传权限...', 'info');
            await storage.updateUserProfileRole(profile.id, roleSelect?.value as 'admin' | 'user', uploadSelect.value === 'true');
            showToast('文件上传权限已更新', 'success');
          } catch (error: any) {
            showToast(`修改失败: ${error.message || error}`, 'error');
            uploadSelect.value = String(!!profile.allow_upload);
            refreshCustomSelect(uploadSelect, 'plain');
          }
        });

        usersListBody.appendChild(tr);
        if (roleSelect) convertSelectToCustom(roleSelect, 'plain');
        if (uploadSelect) convertSelectToCustom(uploadSelect, 'plain');
      });

      renderLucideIconsSafe();
    } catch (error) {
      console.error('Failed to load users', error);
      usersListBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px; color: #c47575;">载入失败，请确认您拥有超级管理员权限。</td></tr>';
    }
  }

  async function initRegistrationToggle() {
    const regCheckbox = document.getElementById('allowRegistration') as HTMLInputElement | null;
    if (!regCheckbox) return;

    const config = storage.getSiteConfig();
    regCheckbox.checked = !!config.allowRegistration;

    regCheckbox.addEventListener('change', async () => {
      const isEnabled = regCheckbox.checked;
      const toastHandle = showToast(isEnabled ? '正在开启注册入口...' : '正在关闭注册入口...', 'loading');

      try {
        await storage.saveSiteConfigCloud({ allowRegistration: isEnabled });
        toastHandle.update(isEnabled ? '全站注册入口已开启' : '全站注册入口已关闭', 'success');
      } catch (error: any) {
        toastHandle.update(`操作失败: ${error.message || error}`, 'error');
        regCheckbox.checked = !isEnabled;
      }
    });
  }

  async function updateAccountInfo() {
    const currentEmail = document.getElementById('currentEmail');
    const currentRole = document.getElementById('currentRole');
    const uploadPermission = document.getElementById('uploadPermission');
    const logoutBtn = document.getElementById('logoutBtn');

    if (!isSupabaseConfigured) {
      if (currentEmail) currentEmail.textContent = '本地离线模式';
      return;
    }

    const { data: { user } } = await supabase!.auth.getUser();
    if (!user) return;

    if (currentEmail) currentEmail.textContent = user.email || '未知用户';
    if (logoutBtn) (logoutBtn as HTMLElement).hidden = false;

    logoutBtn?.addEventListener('click', async () => {
      const ok = await showConfirm('退出登录', '确定要退出当前管理账号吗？');
      if (ok) {
        await supabase!.auth.signOut();
        window.location.reload();
      }
    });

    try {
      const profile = await storage.getProfile(user.id);
      if (!profile) return;

      if (currentRole) {
        currentRole.textContent = profile.role === 'admin' ? '超级管理员' : '普通会员';
        currentRole.className = `role-badge ${profile.role}`;
      }
      if (uploadPermission) {
        uploadPermission.textContent = `文件上传：${profile.allow_upload ? '已启用' : '未启用'}`;
        uploadPermission.className = `role-badge ${profile.allow_upload ? 'admin' : 'user'}`;
      }
    } catch {
      // ignore profile fetch errors in UI hydration
    }
  }

  function initAppearanceForm() {
    const form = document.getElementById('appearanceForm') as HTMLFormElement | null;
    if (!form) return;

    const appearance = storage.getAppearance();
    const setVal = (id: string, val: any) => {
      const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
      if (!el) return;
      if ((el as HTMLInputElement).type === 'checkbox') {
        (el as HTMLInputElement).checked = !!val;
      } else {
        el.value = val;
      }
    };

    setVal('fontStyle', appearance.fontStyle);
    setVal('fontCustomLink', appearance.fontCustomLink || '');
    setVal('fontFamilyName', appearance.fontFamilyName || '');
    setVal('primaryColor', appearance.primaryColor);
    setVal('bgStyle', appearance.bgStyle);
    setVal('customBgUrl', appearance.customBgUrl || '');
    setVal('cardOpacity', appearance.cardOpacity);
    setVal('cardBlur', appearance.cardBlur);
    setVal('scrollbarEnabled', appearance.scrollbarEnabled);
    setVal('githubUsername', appearance.githubUsername || '');

    refreshCustomSelect(document.getElementById('fontStyle') as HTMLSelectElement | null, 'plain');
    refreshCustomSelect(document.getElementById('primaryColor') as HTMLSelectElement | null, 'plain');
    refreshCustomSelect(document.getElementById('bgStyle') as HTMLSelectElement | null, 'plain');

    const opacityVal = document.getElementById('opacityVal');
    if (opacityVal) opacityVal.textContent = `${Math.round(appearance.cardOpacity * 100)}%`;
    const blurVal = document.getElementById('blurVal');
    if (blurVal) blurVal.textContent = `${appearance.cardBlur}px`;

    // 绑定预览面板中调色板的点击事件
    const paletteColors = document.querySelectorAll('.appearance-preview-palette .palette-color');
    paletteColors.forEach(el => {
      el.addEventListener('click', (e) => {
        const color = (e.currentTarget as HTMLElement).getAttribute('data-color');
        if (color) {
          const primaryColorSelect = document.getElementById('primaryColor') as HTMLSelectElement;
          if (primaryColorSelect) {
            primaryColorSelect.value = color;
            refreshCustomSelect(primaryColorSelect, 'plain');
            // 触发 change 事件以同步保存和刷新
            primaryColorSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      });
    });

    const toggleGroups = () => {
      const fontStyle = (document.getElementById('fontStyle') as HTMLSelectElement | null)?.value;
      const bgStyle = (document.getElementById('bgStyle') as HTMLSelectElement | null)?.value;

      const setDisplay = (id: string, show: boolean) => {
        const el = document.getElementById(id);
        if (el) el.style.display = show ? 'block' : 'none';
      };

      setDisplay('customFontLinkGroup', fontStyle === 'custom-link');
      setDisplay('customFontFamilyGroup', fontStyle === 'custom-link' || fontStyle === 'custom-file');
      setDisplay('customFontFileGroup', fontStyle === 'custom-file');
      setDisplay('customBgUrlGroup', bgStyle === 'custom-url');
      setDisplay('customBgFileGroup', bgStyle === 'custom-file');
    };

    toggleGroups();

    const getFormData = () => ({
      fontStyle: (document.getElementById('fontStyle') as HTMLSelectElement).value as any,
      fontCustomLink: (document.getElementById('fontCustomLink') as HTMLInputElement).value,
      fontFamilyName: (document.getElementById('fontFamilyName') as HTMLInputElement).value,
      primaryColor: (document.getElementById('primaryColor') as HTMLSelectElement).value as any,
      bgStyle: (document.getElementById('bgStyle') as HTMLSelectElement).value as any,
      customBgUrl: (document.getElementById('customBgUrl') as HTMLInputElement).value,
      cardOpacity: parseFloat((document.getElementById('cardOpacity') as HTMLInputElement).value),
      cardBlur: parseFloat((document.getElementById('cardBlur') as HTMLInputElement).value),
      scrollbarEnabled: (document.getElementById('scrollbarEnabled') as HTMLInputElement).checked,
      githubUsername: (document.getElementById('githubUsername') as HTMLInputElement).value.trim(),
    });

    // 实时拖拽更新（仅更新数值标签、本地存储和派发事件，不触发云同步）
    form.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement | HTMLSelectElement;

      if (target.id === 'cardOpacity' && opacityVal) {
        opacityVal.textContent = `${Math.round(parseFloat(target.value) * 100)}%`;
      }
      if (target.id === 'cardBlur' && blurVal) {
        blurVal.textContent = `${target.value}px`;
      }

      // 对于滑动条，实时保存到本地并刷新预览
      if (target.type === 'range') {
        const newAppearance = getFormData();
        storage.saveAppearance(newAppearance);
        window.dispatchEvent(new CustomEvent('appearance-updated'));
      }
    });

    // 表单控件改变（包含滑动条松开后的 change），触发云同步和组显隐逻辑
    form.addEventListener('change', async (event) => {
      toggleGroups();
      
      const newAppearance = getFormData();

      storage.saveAppearance(newAppearance);
      window.dispatchEvent(new CustomEvent('appearance-updated'));

      if (isSupabaseConfigured) {
        try {
          await storage.saveAppearanceCloud(newAppearance);
        } catch (error) {
          console.error('Cloud sync failed', error);
        }
      }
    });

    const handleFileUpload = (btnId: string, fileId: string, statusId: string, type: 'font' | 'bg') => {
      const btn = document.getElementById(btnId);
      const fileInput = document.getElementById(fileId) as HTMLInputElement | null;
      const status = document.getElementById(statusId);

      btn?.addEventListener('click', () => fileInput?.click());
      fileInput?.addEventListener('change', async () => {
        const file = fileInput.files?.[0];
        if (!file) return;

        if (status) status.textContent = '上传中...';
        const toastHandle = showToast(`正在上传${type === 'font' ? '字体' : '背景'}...`, 'loading');

        try {
          const url = await storage.uploadAsset(file, type === 'font' ? 'fonts' : 'backgrounds');
          if (status) status.textContent = '上传成功！';
          toastHandle.update('文件上传成功并已应用', 'success');

          if (type === 'font') {
            (document.getElementById('fontStyle') as HTMLSelectElement).value = 'custom-file';
            if (!(document.getElementById('fontFamilyName') as HTMLInputElement).value) {
              const name = file.name.split('.')[0].replace(/[-_]/g, ' ');
              (document.getElementById('fontFamilyName') as HTMLInputElement).value = name;
            }
          } else {
            (document.getElementById('bgStyle') as HTMLSelectElement).value = 'custom-url';
            (document.getElementById('customBgUrl') as HTMLInputElement).value = url;
          }

          form.dispatchEvent(new Event('change'));
        } catch (error: any) {
          if (status) status.textContent = '上传失败';
          toastHandle.update(`上传失败: ${error.message || error}`, 'error');
        }
      });
    };

    handleFileUpload('uploadFontBtn', 'fontCustomFile', 'fontUploadStatus', 'font');
    handleFileUpload('uploadBgBtn', 'bgCustomFile', 'bgUploadStatus', 'bg');
  }

  function initBackupLogic() {
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile') as HTMLInputElement | null;
    const resetBtn = document.getElementById('resetBtn');

    exportBtn?.addEventListener('click', () => {
      const data = storage.exportFullData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mora-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      showToast('备份文件已生成并下载', 'success');
    });

    importBtn?.addEventListener('click', () => importFile?.click());

    importFile?.addEventListener('change', () => {
      const file = importFile.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          const ok = await showConfirm('确认导入', '导入将覆盖现有所有数据，确定继续吗？', true);
          if (ok) {
            storage.importFullData(data);
            if (isSupabaseConfigured) {
              const toastHandle = showToast('正在同步导入数据至云端...', 'loading');
              await storage.syncToCloud();
              toastHandle.update('全站数据已成功从备份恢复并同步', 'success');
            } else {
              showToast('全站数据已从备份文件恢复', 'success');
            }
            window.location.reload();
          }
        } catch {
          showToast('解析备份文件失败，请确保格式正确', 'error');
        }
      };
      reader.readAsText(file);
    });

    resetBtn?.addEventListener('click', async () => {
      const ok = await showConfirm('危险操作', '确定要恢复出厂设置吗？这将删除所有链接和分类！', true);
      if (ok) {
        storage.resetToDefaults();
        if (isSupabaseConfigured) {
          const toastHandle = showToast('正在重置云端数据...', 'loading');
          await storage.syncToCloud();
          toastHandle.update('系统已成功恢复至初始状态', 'success');
        } else {
          showToast('已成功恢复至出厂种子配置', 'success');
        }
        window.location.reload();
      }
    });
  }

  function openEditCategory(id: string) {
    const categories = storage.getCategories();
    const cat = categories.find((item) => item.id === id);
    if (!cat) return;

    (document.getElementById('editCatId') as HTMLInputElement).value = cat.id;
    (document.getElementById('editCatName') as HTMLInputElement).value = cat.name;
    (document.getElementById('editCatIcon') as HTMLInputElement).value = cat.icon;

    const select = document.getElementById('editCatColor') as HTMLSelectElement | null;
    if (select) {
      select.value = cat.color;
      refreshCategorySelectDisplay(select, 'color');
    }

    editCatModal?.classList.add('open');
  }

  function openEditLink(id: string) {
    const links = storage.getLinks();
    const link = links.find((item) => item.id === id);
    if (!link) return;

    (document.getElementById('editLinkId') as HTMLInputElement).value = link.id;
    (document.getElementById('editLinkTitle') as HTMLInputElement).value = link.title;
    (document.getElementById('editLinkUrl') as HTMLInputElement).value = link.url;
    (document.getElementById('editLinkDesc') as HTMLInputElement).value = link.description;
    (document.getElementById('editLinkIcon') as HTMLInputElement).value = link.icon;

    if (editLinkCatId) {
      editLinkCatId.value = link.categoryId;
      refreshCategorySelectDisplay(editLinkCatId, 'category');
    }

    editLinkModal?.classList.add('open');
  }

  const { populateCategorySelects, renderCategories, renderTabs, renderLinks } = createAdminRenderers({
    categoryList,
    categoryTabs,
    linksList,
    linkCatId,
    editLinkCatId,
    getActiveTabCatId: () => activeTabCatId,
    setActiveTabCatId: (value) => {
      activeTabCatId = value;
    },
    refreshAll,
    updateTriggerDisplay,
    openEditCategory,
    openEditLink,
  });

  function refreshAll() {
    try {
      renderCategories();
    } catch (error) {
      console.error('Failed to render categories:', error);
    }

    try {
      renderTabs();
    } catch (error) {
      console.error('Failed to render tabs:', error);
    }

    try {
      renderLinks();
    } catch (error) {
      console.error('Failed to render links:', error);
    }

    try {
      populateCategorySelects();
    } catch (error) {
      console.error('Failed to populate category selects:', error);
    }

    try {
      initCustomSelects();
    } catch (error) {
      console.error('Failed to init custom selects:', error);
    }

    renderLucideIconsSafe();
  }

  function initCategoryDragAndDrop() {
    if (!categoryList) return;

    let isDragging = false;
    let draggingItem: HTMLElement | null = null;
    let longPressTimer: number | null = null;
    let startX = 0;
    let startY = 0;

    categoryList.addEventListener('dragstart', (event) => event.preventDefault());

    async function saveNewOrder() {
      const items = [...categoryList.querySelectorAll('.category-item')];
      const catIdList = items
        .map((el) => el.getAttribute('data-id'))
        .filter(Boolean) as string[];

      const currentCats = storage.getCategories();
      const updatedCats = currentCats.map((cat) => {
        const index = catIdList.indexOf(cat.id);
        return { ...cat, order: index !== -1 ? index + 1 : cat.order };
      });

      updatedCats.sort((a, b) => a.order - b.order);
      storage.saveCategories(updatedCats);
      refreshAll();
      window.dispatchEvent(new CustomEvent('categories-updated'));

      const toastHandle = showToast('正在同步分类顺序至云端...', 'loading');
      try {
        await Promise.all(updatedCats.map((cat) => storage.updateCategoryCloudSilent(cat)));
        toastHandle.update('分类顺序已成功同步至云端', 'success');
      } catch (error: any) {
        toastHandle.update(`云端同步排序失败: ${error.message || error}`, 'error');
      }
    }

    categoryList.addEventListener('pointerdown', (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      const item = (event.target as HTMLElement).closest('.category-item') as HTMLElement | null;
      if (!item) return;
      if ((event.target as HTMLElement).closest('.cat-actions')) return;

      startX = event.clientX;
      startY = event.clientY;

      longPressTimer = window.setTimeout(() => {
        isDragging = true;
        draggingItem = item;
        draggingItem.classList.add('dragging');

        if (navigator.vibrate) {
          try {
            navigator.vibrate(50);
          } catch {
            // ignore vibration errors
          }
        }
        showToast('已激活排序，上下拖动分类即可排序', 'info');
      }, 300);

      const onPointerMove = (moveEvent: PointerEvent) => {
        if (!isDragging) {
          const dist = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
          if (dist > 8 && longPressTimer) {
            clearTimeout(longPressTimer);
          }
          return;
        }

        moveEvent.preventDefault();

        const siblings = [...categoryList.querySelectorAll('.category-item:not(.dragging)')] as HTMLElement[];
        const nextSibling = siblings.find((sibling) => {
          const box = sibling.getBoundingClientRect();
          return moveEvent.clientY < box.top + box.height / 2;
        });

        if (nextSibling) {
          categoryList.insertBefore(draggingItem!, nextSibling);
        } else {
          categoryList.appendChild(draggingItem!);
        }
      };

      const onPointerUp = () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
        }
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        document.removeEventListener('pointercancel', onPointerUp);

        if (isDragging && draggingItem) {
          draggingItem.classList.remove('dragging');
          isDragging = false;
          draggingItem = null;
          void saveNewOrder();
        }
      };

      document.addEventListener('pointermove', onPointerMove, { passive: false });
      document.addEventListener('pointerup', onPointerUp);
      document.addEventListener('pointercancel', onPointerUp);
    });
  }

  function bindDashboardQuickActions() {
    const quickButtons = document.querySelectorAll<HTMLElement>('[data-admin-quick-target]');
    quickButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-admin-quick-target');
        const focusTarget = btn.getAttribute('data-admin-focus-target');
        const clickTarget = btn.getAttribute('data-admin-click-target');

        if (target) {
          const navItem = document.querySelector(`.sidebar-nav .nav-item[data-target="${target}"]`) as HTMLElement | null;
          navItem?.click();
        }

        window.setTimeout(() => {
          if (focusTarget) {
            (document.getElementById(focusTarget) as HTMLElement | null)?.focus();
          }
          if (clickTarget) {
            (document.getElementById(clickTarget) as HTMLElement | null)?.click();
          }
        }, 60);
      });
    });
  }

  function bindNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-target]');
    const adminViews = document.querySelectorAll('.admin-content-wrapper .admin-view');
    const sidebar = document.querySelector('.admin-sidebar');
    const backdrop = document.getElementById('adminSidebarBackdrop');
    const menuBtn = document.getElementById('mobileMenuBtn');

    const closeMobileSidebar = () => {
      sidebar?.classList.remove('mobile-open');
      backdrop?.classList.remove('show');
      if (backdrop) backdrop.hidden = true;
      menuBtn?.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    const openMobileSidebar = () => {
      sidebar?.classList.add('mobile-open');
      if (backdrop) backdrop.hidden = false;
      backdrop?.classList.add('show');
      menuBtn?.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };

    navItems.forEach((item) => {
      item.addEventListener('click', () => {
        navItems.forEach((nav) => {
          nav.classList.remove('active');
          nav.removeAttribute('aria-current');
        });
        item.classList.add('active');
        item.setAttribute('aria-current', 'page');

        const targetId = `view-${item.getAttribute('data-target')}`;
        adminViews.forEach((view) => {
          if (view.id === targetId) {
            view.classList.add('active');
            (view as HTMLElement).hidden = false;
            view.setAttribute('aria-hidden', 'false');
            if (item.getAttribute('data-target') === 'users') {
              void renderUsersList();
            }
          } else {
            view.classList.remove('active');
            (view as HTMLElement).hidden = true;
            view.setAttribute('aria-hidden', 'true');
          }
        });

        closeMobileSidebar();
      });
    });

    const urlParams = new URLSearchParams(window.location.search);
    const initialTab = urlParams.get('tab');
    const initialHash = window.location.hash.replace('#', '');
    if (initialTab || initialHash) {
      const target = initialTab || (initialHash === 'backup-section' ? 'backup' : null);
      if (target) {
        const navItem = document.querySelector(`.sidebar-nav .nav-item[data-target="${target}"]`) as HTMLElement | null;
        if (navItem) {
          window.setTimeout(() => navItem.click(), 100);
        }
      }
    }

    menuBtn?.addEventListener('click', () => {
      if (sidebar?.classList.contains('mobile-open')) {
        closeMobileSidebar();
      } else {
        openMobileSidebar();
      }
    });

    backdrop?.addEventListener('click', closeMobileSidebar);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && sidebar?.classList.contains('mobile-open')) {
        closeMobileSidebar();
      }
    });
  }

  async function checkAuth() {
    const authContainer = document.getElementById('authContainer');
    const adminLayout = document.querySelector('.admin-layout') as HTMLElement | null;

    const showAdmin = () => {
      if (authContainer) authContainer.hidden = true;
      if (adminLayout) adminLayout.hidden = false;
    };

    const showAuth = () => {
      if (authContainer) authContainer.hidden = false;
      if (adminLayout) adminLayout.hidden = true;
    };

    const openPendingDraftWhenReady = () => {
      if (!pendingQuickAddDraft || hasAutoOpenedQuickAdd) return;
      hasAutoOpenedQuickAdd = true;
      window.setTimeout(() => {
        openAddLinkDialog();
      }, 80);
    };

    if (!isSupabaseConfigured) {
      showAdmin();
      openPendingDraftWhenReady();
      void initDashboardStats();
      return;
    }

    const { data: { session } } = await supabase!.auth.getSession();
    if (session) {
      showAdmin();
      openPendingDraftWhenReady();
      void initDashboardStats();
      void initRegistrationToggle();
    } else {
      showAuth();
    }
  }

  const updateSignUpBtn = (config: any) => {
    if (signUpBtn) {
      signUpBtn.hidden = !config.allowRegistration;
    }
  };

  if (isSupabaseConfigured) {
    void storage.syncSiteConfigPublic().then((updatedConfig) => {
      if (updatedConfig) {
        updateSignUpBtn(updatedConfig);
      } else {
        updateSignUpBtn(storage.getSiteConfig());
      }
    });
  } else {
    updateSignUpBtn(storage.getSiteConfig());
  }

  identifyLinkBtn?.addEventListener('click', async () => {
    const url = linkUrlInput?.value.trim() || '';
    const normalizedUrl = normalizeUrlCandidate(url);
    if (!normalizedUrl) {
      showToast('请输入有效的网址', 'info');
      return;
    }

    const originalBtnText = identifyLinkBtn.textContent;
    identifyLinkBtn.textContent = '识别中...';
    identifyLinkBtn.disabled = true;

    const toastHandle = showToast('正在抓取网页信息...', 'loading');
    try {
      const metadata = await fetchUrlMetadata(normalizedUrl);
      if (metadata) {
        if (metadata.title && linkTitleInput) linkTitleInput.value = metadata.title;
        if (metadata.description && linkDescInput) linkDescInput.value = metadata.description;
        toastHandle.update('网页信息获取成功', 'success');
      } else {
        toastHandle.update('未能获取网页信息', 'info');
      }
    } catch {
      toastHandle.update('抓取失败，请检查网络或手动输入', 'error');
    } finally {
      identifyLinkBtn.textContent = originalBtnText;
      identifyLinkBtn.disabled = false;
    }
  });

  identifyEditLinkBtn?.addEventListener('click', async () => {
    const urlInput = document.getElementById('editLinkUrl') as HTMLInputElement | null;
    const titleInput = document.getElementById('editLinkTitle') as HTMLInputElement | null;
    const descInput = document.getElementById('editLinkDesc') as HTMLInputElement | null;

    const url = urlInput?.value.trim() || '';
    const normalizedUrl = normalizeUrlCandidate(url);
    if (!normalizedUrl) {
      showToast('请输入有效的网址', 'info');
      return;
    }

    const originalBtnText = identifyEditLinkBtn.textContent;
    identifyEditLinkBtn.textContent = '识别中...';
    identifyEditLinkBtn.disabled = true;

    const toastHandle = showToast('正在重新抓取网页信息...', 'loading');
    try {
      const metadata = await fetchUrlMetadata(normalizedUrl);
      if (metadata) {
        if (metadata.title && titleInput) titleInput.value = metadata.title;
        if (metadata.description && descInput) descInput.value = metadata.description;
        toastHandle.update('网页信息更新成功', 'success');
      } else {
        toastHandle.update('未能获取最新网页信息', 'info');
      }
    } catch {
      toastHandle.update('抓取失败，请检查网络或手动输入', 'error');
    } finally {
      identifyEditLinkBtn.textContent = originalBtnText;
      identifyEditLinkBtn.disabled = false;
    }
  });

  authForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = authEmail?.value.trim() || '';
    const password = authPassword?.value || '';

    if (!email || !password) return;

    const toastHandle = showToast('正在登录账号...', 'loading');
    const { error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) {
      toastHandle.update(`登录失败: ${error.message}`, 'error');
      return;
    }

    toastHandle.update('登录成功，正在加载并同步云端数据...', 'info');
    try {
      await storage.syncFromCloud();
      setPendingToast('登录成功！', 'success');
      window.location.reload();
    } catch (syncError: any) {
      toastHandle.update(`云端同步失败: ${syncError.message || syncError}`, 'error');
    }
  });

  signUpBtn?.addEventListener('click', async () => {
    const config = storage.getSiteConfig();
    if (!config.allowRegistration) {
      showToast('全站注册渠道已关闭，请联系管理员', 'error');
      return;
    }

    const email = authEmail?.value.trim() || '';
    const password = authPassword?.value || '';
    if (!email || !password) {
      showToast('请先输入邮箱和密码', 'info');
      return;
    }
    if (password.length < 6) {
      showToast('密码长度至少为 6 位', 'info');
      return;
    }

    const toastHandle = showToast('正在注册账号...', 'loading');
    const { error, data } = await supabase!.auth.signUp({ email, password });
    if (error) {
      toastHandle.update(`注册失败: ${error.message}`, 'error');
      return;
    }

    if (data?.session) {
      try {
        await storage.saveAppearanceCloud(storage.getAppearance());
        setPendingToast('注册成功并已自动登录！', 'success');
      } catch (error) {
        console.error(error);
      }
      window.location.reload();
      return;
    }

    toastHandle.update('注册成功！如果开启了邮箱验证，请查收确认邮件。', 'success');
  });

  addCatForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validateForm(addCatForm)) return;

    const name = (document.getElementById('catName') as HTMLInputElement).value.trim();
    const icon = (document.getElementById('catIcon') as HTMLInputElement).value.trim();
    const color = (document.getElementById('catColor') as HTMLSelectElement).value;

    const localCat = storage.addCategory({ name, icon, color });
    addCatForm.reset();
    const defaultIcon = document.getElementById('catIcon') as HTMLInputElement | null;
    if (defaultIcon) defaultIcon.value = 'folder';

    const catColorSelect = document.getElementById('catColor') as HTMLSelectElement | null;
    if (catColorSelect) {
      catColorSelect.value = 'blue';
      refreshCategorySelectDisplay(catColorSelect, 'color');
    }

    refreshAll();
    window.dispatchEvent(new CustomEvent('categories-updated'));
    const toastHandle = showToast('分类已在本地添加，正在同步至云端...', 'loading');
    storage.addCategoryCloudSilent(localCat)
      .then(() => toastHandle.update(`分类“${localCat.name}”已成功同步至云端`, 'success'))
      .catch((error) => toastHandle.update(`分类“${localCat.name}”云端同步失败: ${error.message || error}`, 'error'));
  });

  addLinkForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validateForm(addLinkForm)) return;

    const select = document.getElementById('linkCatId') as HTMLSelectElement;
    const pendingCategoryName = select?.dataset.pendingCategoryName?.trim() || '';
    let categoryId = select?.value || '';
    const title = (document.getElementById('linkTitle') as HTMLInputElement).value.trim();
    const url = (document.getElementById('linkUrl') as HTMLInputElement).value.trim();
    const description = (document.getElementById('linkDesc') as HTMLInputElement).value.trim();
    const icon = (document.getElementById('linkIcon') as HTMLInputElement).value.trim();

    if (pendingCategoryName) {
      const existingCategory = storage.getCategories().find((cat) => cat.name.trim().toLowerCase() === pendingCategoryName.toLowerCase());
      if (existingCategory) {
        categoryId = existingCategory.id;
        delete select.dataset.pendingCategoryName;
      } else {
        const newCategory = storage.addCategory({ name: pendingCategoryName, icon: 'folder', color: 'blue' });
        categoryId = newCategory.id;
        activeTabCatId = newCategory.id;
        delete select.dataset.pendingCategoryName;
        delete select.dataset.categorySearchQuery;
        window.dispatchEvent(new CustomEvent('categories-updated'));
        showToast(`已为你创建新分类「${newCategory.name}」`, 'success');
      }
    }

    if (!categoryId) {
      showToast('请选择一个分类', 'error');
      return;
    }

    const localLink = storage.addLink({ title, categoryId, url, description, icon });
    closeAddLinkDialog();
    refreshAll();

    const toastHandle = showToast('链接已在本地添加，正在同步至云端...', 'loading');
    storage.addLinkCloudSilent(localLink)
      .then(() => toastHandle.update(`链接“${localLink.title}”已成功同步至云端`, 'success'))
      .catch((error) => toastHandle.update(`链接“${localLink.title}”云端同步失败: ${error.message || error}`, 'error'));
  });

  editCatForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validateForm(editCatForm)) return;

    const id = (document.getElementById('editCatId') as HTMLInputElement).value;
    const name = (document.getElementById('editCatName') as HTMLInputElement).value.trim();
    const icon = (document.getElementById('editCatIcon') as HTMLInputElement).value.trim();
    const color = (document.getElementById('editCatColor') as HTMLSelectElement).value;

    const cat = storage.getCategories().find((item) => item.id === id);
    if (!cat) return;

    const updatedCat = { ...cat, name, icon, color };
    storage.updateCategory(updatedCat);
    editCatModal?.classList.remove('open');
    refreshAll();
    window.dispatchEvent(new CustomEvent('categories-updated'));

    const toastHandle = showToast('分类已在本地修改，正在同步至云端...', 'loading');
    storage.updateCategoryCloudSilent(updatedCat)
      .then(() => toastHandle.update(`分类“${updatedCat.name}”修改已同步至云端`, 'success'))
      .catch((error) => toastHandle.update(`分类“${updatedCat.name}”云端同步失败: ${error.message || error}`, 'error'));
  });

  editLinkForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validateForm(editLinkForm)) return;

    const id = (document.getElementById('editLinkId') as HTMLInputElement).value;
    const title = (document.getElementById('editLinkTitle') as HTMLInputElement).value.trim();
    const categoryId = (document.getElementById('editLinkCatId') as HTMLSelectElement).value;
    const url = (document.getElementById('editLinkUrl') as HTMLInputElement).value.trim();
    const description = (document.getElementById('editLinkDesc') as HTMLInputElement).value.trim();
    const icon = (document.getElementById('editLinkIcon') as HTMLInputElement).value.trim();

    const link = storage.getLinks().find((item) => item.id === id);
    if (!link) return;

    const updatedLink = { ...link, title, categoryId, url, description, icon };
    storage.updateLink(updatedLink);
    editLinkModal?.classList.remove('open');
    refreshAll();

    const toastHandle = showToast('链接已在本地修改，正在同步至云端...', 'loading');
    storage.updateLinkCloudSilent(updatedLink)
      .then(() => toastHandle.update(`链接“${updatedLink.title}”修改已同步至云端`, 'success'))
      .catch((error) => toastHandle.update(`链接“${updatedLink.title}”云端同步失败: ${error.message || error}`, 'error'));
  });

  closeCatModal?.addEventListener('click', () => editCatModal?.classList.remove('open'));
  closeLinkModal?.addEventListener('click', () => editLinkModal?.classList.remove('open'));
  openAddLinkBtn?.addEventListener('click', openAddLinkDialog);
  closeAddLinkModal?.addEventListener('click', () => closeAddLinkDialog());

  initIconPicker('catIconWrapper', 'catIcon');
  initIconPicker('editCatIconWrapper', 'editCatIcon');
  initIconPicker('linkIconWrapper', 'linkIcon');
  initIconPicker('editLinkIconWrapper', 'editLinkIcon');

  storage.init();
  bindNavigation();
  bindDashboardQuickActions();
  initCustomSelects();
  initAppearanceForm();
  initBackupLogic();
  void updateAccountInfo();
  initCategoryDragAndDrop();
  refreshAll();
  void checkAuth();
  refreshLucideIcons();
}

document.addEventListener('astro:page-load', () => {
  if (document.querySelector('.admin-layout')) {
    initAdminConsole();
  }
});
