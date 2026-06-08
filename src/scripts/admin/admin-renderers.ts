import { storage, type Category, type Link } from '../storage';
import { showToast } from '../ui/toast';
import { showConfirm } from '../ui/confirm';
import { refreshLucideIcons } from '../ui/icons';


export function createAdminRenderers(params: {
  categoryList: HTMLElement | null;
  categoryTabs: HTMLElement | null;
  linksList: HTMLElement | null;
  linkCatId: HTMLSelectElement | null;
  editLinkCatId: HTMLSelectElement | null;
  getActiveTabCatId: () => string;
  setActiveTabCatId: (value: string) => void;
  refreshAll: () => void;
  updateTriggerDisplay: (wrapper: HTMLElement, select: HTMLSelectElement, type: 'color' | 'category') => void;
  openEditCategory: (id: string) => void;
  openEditLink: (id: string) => void;
}) {
  const {
    categoryList,
    categoryTabs,
    linksList,
    linkCatId,
    editLinkCatId,
    getActiveTabCatId,
    setActiveTabCatId,
    refreshAll,
    updateTriggerDisplay,
    openEditCategory,
    openEditLink,
  } = params;

  function getDomain(urlStr: string) {
    try {
      const url = new URL(urlStr);
      return url.hostname;
    } catch (e) {
      return '';
    }
  }

  function populateCategorySelects() {
    const categories = storage.getCategories().sort((a, b) => a.order - b.order);
    const optionsHtml = categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');

    if (linkCatId) linkCatId.innerHTML = optionsHtml;
    if (editLinkCatId) editLinkCatId.innerHTML = optionsHtml;
  }

  function renderCategories() {
    if (!categoryList) return;
    categoryList.innerHTML = '';

    const categories = storage.getCategories().sort((a, b) => a.order - b.order);

    categories.forEach(cat => {
      const catItem = document.createElement('div');
      catItem.className = 'category-item';
      catItem.setAttribute('data-id', cat.id);
      catItem.setAttribute('style', `--theme-color: var(--theme-${cat.color})`);

      catItem.innerHTML = `
        <div class="cat-info">
          <div class="cat-icon-box" style="--theme-color: var(--theme-${cat.color})">
            <i data-lucide="${cat.icon || 'folder'}"></i>
          </div>
          <span class="cat-name-text">${cat.name}</span>
        </div>
        <div class="cat-actions">
          <button class="icon-btn edit-cat-btn" data-id="${cat.id}" title="编辑分类" aria-label="编辑分类 ${cat.name}" type="button">
            <i data-lucide="pencil"></i>
          </button>
          <button class="icon-btn delete-btn delete-cat-btn" data-id="${cat.id}" title="删除分类" aria-label="删除分类 ${cat.name}" type="button">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      `;

      catItem.querySelector('.edit-cat-btn')?.addEventListener('click', () => {
        openEditCategory(cat.id);
      });

      catItem.querySelector('.delete-cat-btn')?.addEventListener('click', async () => {
        const ok = await showConfirm(
          '删除分类',
          `确定要删除分类“${cat.name}”及其底下的所有链接卡片吗？该操作不可逆！`,
          true
        );
        if (ok) {
          storage.deleteCategory(cat.id);
          refreshAll();
          window.dispatchEvent(new CustomEvent('categories-updated'));
          const toast = showToast('正在云端同步删除分类...', 'loading');

          storage.deleteCategoryCloudSilent(cat.id).then(() => {
            toast.update(`分类“${cat.name}”已成功同步删除至云端`, 'success');
          }).catch(err => {
            toast.update(`分类“${cat.name}”云端删除同步失败: ${err.message || err}`, 'error');
          });
        }
      });

      categoryList.appendChild(catItem);
    });
  }

  function renderTabs() {
    if (!categoryTabs) return;
    categoryTabs.innerHTML = '';

    const categories = storage.getCategories().sort((a, b) => a.order - b.order);

    const allBtn = document.createElement('button');
    allBtn.className = `tab-btn ${getActiveTabCatId() === 'all' ? 'active' : ''}`;
    allBtn.setAttribute('type', 'button');
    allBtn.innerHTML = `<i data-lucide="layers"></i><span>显示全部</span>`;
    allBtn.addEventListener('click', () => {
      setActiveTabCatId('all');
      renderTabs();
      renderLinks();
      refreshLucideIcons();
    });
    categoryTabs.appendChild(allBtn);

    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = `tab-btn ${getActiveTabCatId() === cat.id ? 'active' : ''}`;
      btn.setAttribute('type', 'button');
      btn.innerHTML = `<i data-lucide="${cat.icon}"></i><span>${cat.name}</span>`;

      btn.addEventListener('click', () => {
        setActiveTabCatId(cat.id);
        renderTabs();
        renderLinks();
        refreshLucideIcons();
      });
      categoryTabs.appendChild(btn);
    });

  }

  function renderLinks() {
    if (!linksList) return;
    linksList.innerHTML = '';

    const categories = storage.getCategories();
    const allLinks = storage.getLinks().sort((a, b) => a.order - b.order);

    const filteredLinks = getActiveTabCatId() === 'all'
      ? allLinks
      : allLinks.filter(l => l.categoryId === getActiveTabCatId());

    if (filteredLinks.length === 0) {
      linksList.innerHTML = `
        <div class="admin-links-empty">
          <div class="admin-links-empty-icon">
            <i data-lucide="folder-open"></i>
          </div>
          <p>该分类下暂无任何卡片，开始创建吧！</p>
          <button class="empty-add-btn" type="button">
            <i data-lucide="plus"></i>
            <span>添加卡片</span>
          </button>
        </div>
      `;
      linksList.querySelector('.empty-add-btn')?.addEventListener('click', () => {
        const openAddLinkBtn = document.getElementById('openAddLinkBtn');
        openAddLinkBtn?.click();
      });
      if ((window as any).lucide) {
        try {
          (window as any).lucide.createIcons({ node: linksList });
        } catch (e) {
          console.error('Lucide icons for empty state failed:', e);
        }
      }
      return;
    }

    filteredLinks.forEach((link, index) => {
      const cat = categories.find(c => c.id === link.categoryId);
      const catColor = cat ? cat.color : 'blue';
      const domain = getDomain(link.url);

      const cachedFav = (window as any).getFaviconFromCache ? (window as any).getFaviconFromCache(domain) : null;
      let faviconUrl = '';
      let showImgDirectly = false;
      let skipFavicon = false;

      if (cachedFav === 'failed') {
        skipFavicon = true;
      } else if (cachedFav) {
        faviconUrl = cachedFav;
        showImgDirectly = true;
      } else {
        faviconUrl = domain ? `https://a.favicon.im/${domain}` : '';
      }

      const card = document.createElement('div');
      card.className = 'admin-link-card';
      card.setAttribute('style', `--theme-color: var(--theme-${catColor})`);
      card.style.animationDelay = `${index * 30}ms`;
      card.innerHTML = `
        <div>
          <div class="admin-link-card-header">
            <div class="admin-link-card-icon" style="--theme-color: var(--theme-${catColor})">
              ${!skipFavicon && faviconUrl ? `
              <img
                src="${faviconUrl}"
                class="admin-card-favicon"
                ${showImgDirectly ? '' : `onload="window.handleFaviconSuccess && window.handleFaviconSuccess(this, '${domain}')" onerror="window.handleFaviconError && window.handleFaviconError(this, '${domain}')"`}
                ${showImgDirectly ? '' : 'data-favicon-hidden="true"'}
                alt=""
              />
              ` : ''}
              <i data-lucide="${link.icon || 'external-link'}" class="${showImgDirectly ? 'admin-link-fallback-icon hidden' : 'admin-link-fallback-icon'}"></i>
            </div>
            <span class="admin-link-card-title">${link.title}</span>
          </div>
          <p class="admin-link-card-desc" title="${link.description}">${link.description}</p>
          <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="admin-link-card-url" title="${link.url}">${link.url}</a>
        </div>
        <div class="admin-link-card-footer">
          <span class="admin-link-card-clicks">
            <i data-lucide="mouse-pointer-click" class="clicks-icon"></i>
            ${link.clicks || 0} 次点击
          </span>
          <div class="admin-link-card-actions">
            <button class="icon-btn edit-link-btn" data-id="${link.id}" title="编辑卡片" aria-label="编辑卡片 ${link.title}" type="button">
              <i data-lucide="pencil"></i>
            </button>
            <button class="icon-btn delete-btn delete-link-btn" data-id="${link.id}" title="删除卡片" aria-label="删除卡片 ${link.title}" type="button">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </div>
      `;

      card.querySelector('.edit-link-btn')?.addEventListener('click', () => {
        openEditLink(link.id);
      });

      card.querySelector('.delete-link-btn')?.addEventListener('click', async () => {
        const ok = await showConfirm(
          '删除链接卡片',
          `确定要删除“${link.title}”卡片吗？`,
          true
        );
        if (ok) {
          storage.deleteLink(link.id);
          refreshAll();
          const toast = showToast('正在云端同步删除卡片...', 'loading');

          storage.deleteLinkCloudSilent(link.id).then(() => {
            toast.update(`链接“${link.title}”已成功同步删除至云端`, 'success');
          }).catch(err => {
            toast.update(`链接“${link.title}”云端删除同步失败: ${err.message || err}`, 'error');
          });
        }
      });

      linksList.appendChild(card);
    });
  }

  return {
    populateCategorySelects,
    renderCategories,
    renderTabs,
    renderLinks,
  };
}
