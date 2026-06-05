import { storage } from '../storage';
import { showToast } from '../ui/toast';
import { showConfirm } from '../ui/confirm';
import { renderLucideIconsSafe } from '../ui/icons';
import { getSession, isAuthEnabled, login, signUp } from '../services/auth-service';
import { createAdminSelectController } from '../admin/admin-select';
import { createAdminIconPicker } from '../admin/admin-icon-picker';
import { createAdminRenderers } from '../admin/admin-renderers';
import { validateRequiredForm } from '../utils/form';

function initAdminConsole() {
    const { convertSelectToCustom, updateTriggerDisplay, bindGlobalClose } = createAdminSelectController();
    const { initIconPicker } = createAdminIconPicker();
    // DOM 元素获取
    const categoryList = document.getElementById('categoryList');
    const categoryTabs = document.getElementById('categoryTabs');
    const linksList = document.getElementById('linksList');
    const linkCatId = document.getElementById('linkCatId') as HTMLSelectElement;
    const editLinkCatId = document.getElementById('editLinkCatId') as HTMLSelectElement;

    const addCatForm = document.getElementById('addCatForm') as HTMLFormElement;
    const addLinkForm = document.getElementById('addLinkForm') as HTMLFormElement;


    const editCatModal = document.getElementById('editCatModal');
    const editCatForm = document.getElementById('editCatForm') as HTMLFormElement;
    const closeCatModal = document.getElementById('closeCatModal');

    const editLinkModal = document.getElementById('editLinkModal');
    const editLinkForm = document.getElementById('editLinkForm') as HTMLFormElement;
    const closeLinkModal = document.getElementById('closeLinkModal');

    const openAddLinkBtn = document.getElementById('openAddLinkBtn');
    const addLinkModal = document.getElementById('openAddLinkBtn')?.closest('.admin-section')?.querySelector('#addLinkModal') || document.getElementById('addLinkModal');
    const closeAddLinkModal = document.getElementById('closeAddLinkModal');


    // ================= Supabase 身份校验与认证管理 =================
    async function checkAuth() {
      const authContainer = document.getElementById('authContainer');
      const adminContainer = document.querySelector('.admin-container') as HTMLElement;
      
      if (!isAuthEnabled()) {
        if (authContainer) authContainer.style.display = 'none';
        if (adminContainer) adminContainer.style.display = 'block';
        return;
      }

      const session = await getSession();
      if (session) {
        if (authContainer) authContainer.style.display = 'none';
        if (adminContainer) adminContainer.style.display = 'block';
      } else {
        if (authContainer) authContainer.style.display = 'flex';
        if (adminContainer) adminContainer.style.display = 'none';
      }
    }

    const authForm = document.getElementById('authForm');
    const authEmail = document.getElementById('authEmail') as HTMLInputElement;
    const authPassword = document.getElementById('authPassword') as HTMLInputElement;
    const signUpBtn = document.getElementById('signUpBtn');

    authForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = authEmail.value.trim();
      const password = authPassword.value;
      
      if (!email || !password) return;

      showToast('正在登录...', 'info');
      const { error } = await login(email, password);
      if (error) {
        showToast(`登录失败: ${error.message}`, 'error');
      } else {
        showToast('登录成功，正在加载云端数据...', 'success');
        await storage.syncFromCloud();
        window.location.reload();
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
      } else {
        showToast('注册成功！如果开启了邮箱验证，请查收确认邮件。', 'success');
        if (data?.session) {
          await storage.saveAppearanceCloud(storage.getAppearance());
          window.location.reload();
        }
      }
    });

    checkAuth();

    // 手动表单校验，消除原生黄色/白色验证气泡，使用极致丝滑 Toast + 红色警告高亮提示
    function validateForm(form: HTMLFormElement): boolean {
      return validateRequiredForm(form, (message) => showToast(message, 'error'));
    }

    function renderIconsSafe() {
      renderLucideIconsSafe();
    }

    let activeTabCatId = 'all';

    storage.init();
    bindGlobalClose();

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

    // 刷新整个视图，对核心模块渲染进行异常隔离，保障程序健壮性
    function refreshAll() {
      try {
        renderCategories();
      } catch (e) {
        console.error('Failed to render categories:', e);
      }
      
      try {
        renderTabs();
      } catch (e) {
        console.error('Failed to render tabs:', e);
      }
      
      try {
        renderLinks();
      } catch (e) {
        console.error('Failed to render links:', e);
      }
      
      try {
        populateCategorySelects();
      } catch (e) {
        console.error('Failed to populate category selects:', e);
      }

      // 在原生 select 选项装填后，触发自定义下拉转换引擎
      const selects = [
        { id: 'catColor', type: 'color' as const },
        { id: 'editCatColor', type: 'color' as const },
        { id: 'linkCatId', type: 'category' as const },
        { id: 'editLinkCatId', type: 'category' as const }
      ];

      selects.forEach(item => {
        try {
          convertSelectToCustom(item.id, item.type);
        } catch (e) {
          console.error(`Failed to convert select "${item.id}":`, e);
        }
      });


      try {
        renderIconsSafe();
      } catch (e) {
        console.error('Failed to execute renderIconsSafe:', e);
      }
    }

    // 填充原生下拉框选项 (自定义引擎在其后拦截并渲染新界面)
    function populateCategorySelects() {
      const categories = storage.getCategories().sort((a, b) => a.order - b.order);
      
      const optionsHtml = categories.map(cat => 
        `<option value="${cat.id}">${cat.name}</option>`
      ).join('');

      if (linkCatId) linkCatId.innerHTML = optionsHtml;
      if (editLinkCatId) editLinkCatId.innerHTML = optionsHtml;
    }

    addCatForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm(addCatForm)) return;
      const name = (document.getElementById('catName') as HTMLInputElement).value.trim();
      const icon = (document.getElementById('catIcon') as HTMLInputElement).value.trim();
      const color = (document.getElementById('catColor') as HTMLSelectElement).value;

      const localCat = storage.addCategory({ name, icon, color });
      addCatForm.reset();
      
      const defaultIcon = document.getElementById('catIcon') as HTMLInputElement;
      if (defaultIcon) defaultIcon.value = 'folder';

      // 联动重设自定义下拉框
      const select = document.getElementById('catColor') as HTMLSelectElement;
      if (select) {
        const wrapper = select.parentElement?.classList.contains('custom-select-wrapper')
          ? select.parentElement as HTMLElement
          : null;
        if (wrapper) {
          select.value = 'blue';
          const triggerContent = wrapper.querySelector('.custom-select-trigger-content');
          if (triggerContent) {
            triggerContent.innerHTML = `
              <div class="select-color-dot" style="background: var(--theme-blue)"></div>
              <span>莫兰迪蓝</span>
            `;
          }
        }
      }

      refreshAll();
      window.dispatchEvent(new CustomEvent('categories-updated'));
      const toast = showToast('正在同步分类至云端...', 'loading');

      storage.addCategoryCloudSilent(localCat).then(() => {
        toast.update(`分类“${localCat.name}”已成功同步至云端`, 'success');
      }).catch(err => {
        toast.update(`分类“${localCat.name}”云端同步失败: ${err.message || err}`, 'error');
      });
    });

    addLinkForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm(addLinkForm)) return;
      const title = (document.getElementById('linkTitle') as HTMLInputElement).value.trim();
      const categoryId = (document.getElementById('linkCatId') as HTMLSelectElement).value;
      const url = (document.getElementById('linkUrl') as HTMLInputElement).value.trim();
      const description = (document.getElementById('linkDesc') as HTMLInputElement).value.trim();
      const icon = (document.getElementById('linkIcon') as HTMLInputElement).value.trim();

      const localLink = storage.addLink({ title, categoryId, url, description, icon });
      addLinkForm.reset();
      
      const defaultIcon = document.getElementById('linkIcon') as HTMLInputElement;
      if (defaultIcon) defaultIcon.value = 'external-link';

      refreshAll();

      // 成功添加后关闭弹窗
      addLinkModal?.classList.remove('open');

      // 复位自定义选择框的展示
      const select = document.getElementById('linkCatId') as HTMLSelectElement;
      if (select) {
        const wrapper = select.parentElement?.classList.contains('custom-select-wrapper')
          ? select.parentElement as HTMLElement
          : null;
        if (wrapper) {
          updateTriggerDisplay(wrapper, select, 'category');
        }
      }

      const toast = showToast('正在同步卡片至云端...', 'loading');

      storage.addLinkCloudSilent(localLink).then(() => {
        toast.update(`链接“${localLink.title}”已成功同步至云端`, 'success');
      }).catch(err => {
        toast.update(`链接“${localLink.title}”云端同步失败: ${err.message || err}`, 'error');
      });
    });

    function openEditCategory(id: string) {
      const categories = storage.getCategories();
      const cat = categories.find(c => c.id === id);
      if (!cat) return;

      (document.getElementById('editCatId') as HTMLInputElement).value = cat.id;
      (document.getElementById('editCatName') as HTMLInputElement).value = cat.name;
      (document.getElementById('editCatIcon') as HTMLInputElement).value = cat.icon;
      
      const select = document.getElementById('editCatColor') as HTMLSelectElement;
      if (select) {
        select.value = cat.color;
        // 触发自定义下拉框的同步展示
        const wrapper = select.parentElement?.classList.contains('custom-select-wrapper')
          ? select.parentElement as HTMLElement
          : null;
        if (wrapper) {
          updateTriggerDisplay(wrapper, select, 'color');
          // 同步更新选项高亮
          wrapper.querySelectorAll('.custom-option').forEach(opt => {
            const val = opt.getAttribute('data-value') || '';
            if (val === cat.color) {
              opt.classList.add('selected');
            } else {
              opt.classList.remove('selected');
            }
          });
        }
      }

      editCatModal?.classList.add('open');
    }

    editCatForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm(editCatForm)) return;
      const id = (document.getElementById('editCatId') as HTMLInputElement).value;
      const name = (document.getElementById('editCatName') as HTMLInputElement).value.trim();
      const icon = (document.getElementById('editCatIcon') as HTMLInputElement).value.trim();
      const color = (document.getElementById('editCatColor') as HTMLSelectElement).value;

      const categories = storage.getCategories();
      const cat = categories.find(c => c.id === id);
      if (cat) {
        const updatedCat = { ...cat, name, icon, color };
        storage.updateCategory(updatedCat);
        editCatModal?.classList.remove('open');
        refreshAll();
        window.dispatchEvent(new CustomEvent('categories-updated'));
        const toast = showToast('正在同步分类修改至云端...', 'loading');

        storage.updateCategoryCloudSilent(updatedCat).then(() => {
          toast.update(`分类“${updatedCat.name}”修改已同步至云端`, 'success');
        }).catch(err => {
          toast.update(`分类“${updatedCat.name}”云端同步失败: ${err.message || err}`, 'error');
        });
      }
    });

    closeCatModal?.addEventListener('click', () => {
      editCatModal?.classList.remove('open');
    });

    function openEditLink(id: string) {
      const links = storage.getLinks();
      const link = links.find(l => l.id === id);
      if (!link) return;

      (document.getElementById('editLinkId') as HTMLInputElement).value = link.id;
      (document.getElementById('editLinkTitle') as HTMLInputElement).value = link.title;
      (document.getElementById('editLinkUrl') as HTMLInputElement).value = link.url;
      (document.getElementById('editLinkDesc') as HTMLInputElement).value = link.description;
      (document.getElementById('editLinkIcon') as HTMLInputElement).value = link.icon;

      const catSelect = document.getElementById('editLinkCatId') as HTMLSelectElement;
      if (catSelect) {
        catSelect.value = link.categoryId;
        const wrapper = catSelect.parentElement?.classList.contains('custom-select-wrapper')
          ? catSelect.parentElement as HTMLElement
          : null;
        if (wrapper) {
          updateTriggerDisplay(wrapper, catSelect, 'category');
          // 同步更新选项高亮
          wrapper.querySelectorAll('.custom-option').forEach(opt => {
            const val = opt.getAttribute('data-value') || '';
            if (val === link.categoryId) {
              opt.classList.add('selected');
            } else {
              opt.classList.remove('selected');
            }
          });
        }
      }

      editLinkModal?.classList.add('open');
    }

    editLinkForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateForm(editLinkForm)) return;
      const id = (document.getElementById('editLinkId') as HTMLInputElement).value;
      const title = (document.getElementById('editLinkTitle') as HTMLInputElement).value.trim();
      const categoryId = (document.getElementById('editLinkCatId') as HTMLSelectElement).value;
      const url = (document.getElementById('editLinkUrl') as HTMLInputElement).value.trim();
      const description = (document.getElementById('editLinkDesc') as HTMLInputElement).value.trim();
      const icon = (document.getElementById('editLinkIcon') as HTMLInputElement).value.trim();

      const links = storage.getLinks();
      const link = links.find(l => l.id === id);
      if (link) {
        const updatedLink = { ...link, title, categoryId, url, description, icon };
        storage.updateLink(updatedLink);
        editLinkModal?.classList.remove('open');
        refreshAll();
        const toast = showToast('正在同步卡片修改至云端...', 'loading');

        storage.updateLinkCloudSilent(updatedLink).then(() => {
          toast.update(`链接“${updatedLink.title}”修改已同步至云端`, 'success');
        }).catch(err => {
          toast.update(`链接“${updatedLink.title}”云端同步失败: ${err.message || err}`, 'error');
        });
      }
    });

    closeLinkModal?.addEventListener('click', () => {
      editLinkModal?.classList.remove('open');
    });

    // 绑定添加新卡片弹窗的打开与关闭 (智能填充当前分类选项)
    openAddLinkBtn?.addEventListener('click', () => {
      if (activeTabCatId !== 'all') {
        const select = document.getElementById('linkCatId') as HTMLSelectElement;
        if (select) {
          select.value = activeTabCatId;
          const wrapper = select.parentElement?.classList.contains('custom-select-wrapper')
            ? select.parentElement as HTMLElement
            : null;
          if (wrapper) {
            updateTriggerDisplay(wrapper, select, 'category');
            wrapper.querySelectorAll('.custom-option').forEach(opt => {
              const val = opt.getAttribute('data-value') || '';
              if (val === activeTabCatId) {
                opt.classList.add('selected');
              } else {
                opt.classList.remove('selected');
              }
            });
          }
        }
      }
      addLinkModal?.classList.add('open');
    });

    closeAddLinkModal?.addEventListener('click', () => {
      addLinkModal?.classList.remove('open');
      addLinkForm?.reset();
      
      // 取消时复位自定义下拉选择框的展示
      const select = document.getElementById('linkCatId') as HTMLSelectElement;
      if (select) {
        const wrapper = select.parentElement?.classList.contains('custom-select-wrapper')
          ? select.parentElement as HTMLElement
          : null;
        if (wrapper) {
          updateTriggerDisplay(wrapper, select, 'category');
        }
      }
    });

    // 初始化图标选择器
    initIconPicker('catIconWrapper', 'catIcon');
    initIconPicker('editCatIconWrapper', 'editCatIcon');
    initIconPicker('linkIconWrapper', 'linkIcon');
    initIconPicker('editLinkIconWrapper', 'editLinkIcon');

    // ================= 分类长按拖拽排序逻辑 =================
    function initCategoryDragAndDrop() {
      if (!categoryList) return;

      let isDragging = false;
      let draggingItem: HTMLElement | null = null;
      let longPressTimer: any = null;
      let startX = 0;
      let startY = 0;

      // 批量同步新顺序到云端
      async function saveNewOrder() {
        const items = [...categoryList.querySelectorAll('.category-item')];
        const catIdList = items.map(el => el.getAttribute('data-id')).filter(Boolean) as string[];
        
        const currentCats = storage.getCategories();
        
        // 按照当前的 DOM 顺序重新映射排序值
        const updatedCats = currentCats.map(cat => {
          const index = catIdList.indexOf(cat.id);
          return { ...cat, order: index !== -1 ? index + 1 : cat.order };
        });

        // 重新排序并保存到本地
        updatedCats.sort((a, b) => a.order - b.order);
        storage.saveCategories(updatedCats);

        // 刷新列表和 tabs 以保持同步
        refreshAll();
        window.dispatchEvent(new CustomEvent('categories-updated'));

        const toast = showToast('正在同步分类顺序至云端...', 'loading');
        try {
          // 并发更新各分类在云端的 order
          await Promise.all(updatedCats.map(cat => storage.updateCategoryCloudSilent(cat)));
          toast.update('分类顺序已成功同步至云端', 'success');
        } catch (err: any) {
          toast.update(`云端同步排序失败: ${err.message || err}`, 'error');
        }
      }

      categoryList.addEventListener('pointerdown', (e: PointerEvent) => {
        // 仅响应鼠标左键或触屏单指按下
        if (e.button !== 0) return;

        const item = (e.target as HTMLElement).closest('.category-item') as HTMLElement;
        if (!item) return;

        // 如果点在了操作按钮（如编辑、删除）上，直接跳过拖拽逻辑
        if ((e.target as HTMLElement).closest('.cat-actions')) return;

        // 记录起点坐标
        startX = e.clientX;
        startY = e.clientY;

        // 开启 300ms 长按检测定时器
        longPressTimer = setTimeout(() => {
          isDragging = true;
          draggingItem = item;
          draggingItem.classList.add('dragging');
          
          // 移动端轻微震动反馈
          if (navigator.vibrate) {
            try {
              navigator.vibrate(50);
            } catch (err) {}
          }
          showToast('已激活排序，上下拖动分类即可排序', 'info');
        }, 300);

        const onPointerMove = (moveEvent: PointerEvent) => {
          if (!isDragging) {
            // 未激活拖拽时，若滑动距离大于 8px，判定为滚动或误触，取消长按定时器
            const dist = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
            if (dist > 8) {
              clearTimeout(longPressTimer);
            }
            return;
          }

          // 已进入拖拽状态，阻止默认事件（如页面滚动）
          moveEvent.preventDefault();

          // 寻找插入点
          const siblings = [...categoryList.querySelectorAll('.category-item:not(.dragging)')] as HTMLElement[];
          const nextSibling = siblings.find(sibling => {
            const box = sibling.getBoundingClientRect();
            // 如果指针 Y 坐标在兄弟元素的中心线以上，说明应该插入其前面
            return moveEvent.clientY < box.top + box.height / 2;
          });

          if (nextSibling) {
            categoryList.insertBefore(draggingItem!, nextSibling);
          } else {
            categoryList.appendChild(draggingItem!);
          }
        };

        const onPointerUp = () => {
          clearTimeout(longPressTimer);
          document.removeEventListener('pointermove', onPointerMove);
          document.removeEventListener('pointerup', onPointerUp);
          document.removeEventListener('pointercancel', onPointerUp);

          if (isDragging && draggingItem) {
            draggingItem.classList.remove('dragging');
            isDragging = false;
            draggingItem = null;
            saveNewOrder();
          }
        };

        document.addEventListener('pointermove', onPointerMove, { passive: false });
        document.addEventListener('pointerup', onPointerUp);
        document.addEventListener('pointercancel', onPointerUp);
      });
    }

    // 启用拖拽排序
    initCategoryDragAndDrop();

    refreshAll();
  }

document.addEventListener('astro:page-load', initAdminConsole);
