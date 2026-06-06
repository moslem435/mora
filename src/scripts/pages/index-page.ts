import { storage } from '../storage';
import { renderLucideIconsSafe } from '../ui/icons';

export function initMainPage() {
  const gridSection = document.getElementById('gridSection');
  if (!gridSection) return;

  const emptyState = document.getElementById('emptyState');

  function getDomain(urlStr: string) {
    try {
      const url = new URL(urlStr);
      return url.hostname;
    } catch (e) {
      return '';
    }
  }

  const workbenchSection = document.getElementById('workbenchSection');
  const navModeBtn = document.getElementById('navModeBtn');
  const workbenchModeBtn = document.getElementById('workbenchModeBtn');
  const modeSlider = document.getElementById('modeSlider');
  const greetingHeader = document.getElementById('greetingHeader');
  const searchSection = document.getElementById('searchSection');

  function switchMode(mode: 'nav' | 'workbench') {
    if (!gridSection || !workbenchSection || !navModeBtn || !workbenchModeBtn || !modeSlider) return;

    if (mode === 'nav') {
      gridSection.style.display = 'flex';
      workbenchSection.style.display = 'none';
      if (greetingHeader) greetingHeader.style.display = 'block';
      if (searchSection) searchSection.style.display = 'block';
      navModeBtn.classList.add('active');
      workbenchModeBtn.classList.remove('active');
      modeSlider.style.transform = 'translateX(0)';
      renderMainGrid(); 
    } else {
      gridSection.style.display = 'none';
      emptyState!.style.display = 'none';
      workbenchSection.style.display = 'block';
      if (greetingHeader) greetingHeader.style.display = 'none';
      if (searchSection) searchSection.style.display = 'none';
      navModeBtn.classList.remove('active');
      workbenchModeBtn.classList.add('active');
      modeSlider.style.transform = 'translateX(calc(100% + 4px))';
    }
    
    renderLucideIconsSafe();
  }

  navModeBtn?.addEventListener('click', () => switchMode('nav'));
  workbenchModeBtn?.addEventListener('click', () => switchMode('workbench'));

  // 绑定新的顶栏侧边栏按钮逻辑
  const topSidebarToggle = document.getElementById('sidebarToggleCopy');
  const originalToggle = document.getElementById('sidebarToggle');
  if (topSidebarToggle && originalToggle) {
    topSidebarToggle.addEventListener('click', () => {
      originalToggle.click(); // 触发原有的侧边栏逻辑
    });
  }

  function renderSkeleton() {
    if (!gridSection) return;
    gridSection.innerHTML = `
      <div class="skeleton-block">
        <div class="skeleton-title"></div>
        <div class="skeleton-grid">
          ${'<div class="skeleton-card"></div>'.repeat(6)}
        </div>
      </div>
      <div class="skeleton-block">
        <div class="skeleton-title"></div>
        <div class="skeleton-grid">
          ${'<div class="skeleton-card"></div>'.repeat(3)}
        </div>
      </div>
    `;
  }

  function renderMainGrid() {
    if (!gridSection) return;
    
    const categories = storage.getCategories().sort((a, b) => a.order - b.order);
    const links = storage.getLinks().sort((a, b) => a.order - b.order);

    if (categories.length === 0) {
      gridSection.innerHTML = '';
      emptyState!.style.display = 'flex';
      return;
    } else {
      emptyState!.style.display = 'none';
    }

    gridSection.innerHTML = '';
    categories.forEach(cat => {
      const catLinks = links.filter(l => l.categoryId === cat.id);
      if (catLinks.length === 0) return;

      const catBlock = document.createElement('div');
      catBlock.className = 'category-block';
      catBlock.id = cat.id;
      catBlock.setAttribute('style', `--cat-color: var(--theme-${cat.color})`);

      catBlock.innerHTML = `
        <div class="category-title-wrapper">
          <i data-lucide="${cat.icon}" class="category-icon"></i>
          <h2 class="category-name">${cat.name}</h2>
          <span class="category-badge">${catLinks.length}</span>
        </div>
        <div class="links-grid"></div>
      `;

      const grid = catBlock.querySelector('.links-grid');

      catLinks.forEach(link => {
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

        const cardHtml = `
          <a
            href="${link.url}"
            target="_blank"
            rel="noopener noreferrer"
            class="link-card"
            data-id="${link.id}"
            style="--theme-color: var(--theme-${cat.color});"
          >
            <div class="card-inner">
              <div class="card-header">
                <div class="header-main-info">
                  <div class="icon-wrapper">
                    ${!skipFavicon && faviconUrl ? `
                    <img
                      src="${faviconUrl}"
                      class="card-favicon"
                      ${showImgDirectly ? '' : `onload="window.handleFaviconSuccess && window.handleFaviconSuccess(this, '${domain}')" onerror="window.handleFaviconError && window.handleFaviconError(this, '${domain}')"`}
                      style="${showImgDirectly ? 'display: block;' : 'display: none;'} width: 28px; height: 28px; border-radius: 6px; object-fit: contain;"
                      alt=""
                    />
                    ` : ''}
                    <i data-lucide="${link.icon || 'external-link'}" class="card-icon" style="${showImgDirectly ? 'display: none;' : ''}"></i>
                  </div>
                  <h3 class="card-title">${link.title}</h3>
                </div>
                <div class="theme-tag"></div>
              </div>
              <div class="card-content">
                <p class="card-desc" title="${link.description}">${link.description}</p>
              </div>
            </div>
            <div class="card-watermark">
              ${!skipFavicon && faviconUrl ? `
              <img
                src="${showImgDirectly ? faviconUrl : ''}"
                class="watermark-favicon"
                style="${showImgDirectly ? 'display: block;' : 'display: none;'} width: 100%; height: 100%; object-fit: contain;"
                alt=""
              />
              ` : ''}
              <i data-lucide="${link.icon || 'external-link'}" style="${showImgDirectly ? 'display: none;' : ''}"></i>
            </div>
          </a>
        `;
        grid!.insertAdjacentHTML('beforeend', cardHtml);
      });

      gridSection.appendChild(catBlock);
    });

    renderLucideIconsSafe();

    // 渲染完成后，根据当前输入框内容进行过滤
    if (searchInput) {
      const query = searchInput.value.trim().toLowerCase();
      filterCards(query);
    }
  }

  const searchInput = document.getElementById('searchInput') as HTMLInputElement;

  function filterCards(query: string) {
    const cards = document.querySelectorAll('.link-card');
    const categories = document.querySelectorAll('.category-block');
    let totalVisible = 0;

    cards.forEach(card => {
      const title = card.querySelector('.card-title')?.textContent?.toLowerCase() || '';
      const desc = card.querySelector('.card-desc')?.textContent?.toLowerCase() || '';
      const url = card.getAttribute('href')?.toLowerCase() || '';

      const matches = title.includes(query) || desc.includes(query) || url.includes(query);
      if (matches) {
        (card as HTMLElement).style.display = '';
        totalVisible++;
      } else {
        (card as HTMLElement).style.display = 'none';
      }
    });

    categories.forEach(block => {
      const blockCards = block.querySelectorAll('.link-card');
      let visibleInBlock = 0;
      blockCards.forEach(card => {
        if ((card as HTMLElement).style.display !== 'none') {
          visibleInBlock++;
        }
      });

      if (visibleInBlock === 0) {
        (block as HTMLElement).style.display = 'none';
      } else {
        (block as HTMLElement).style.display = '';
        const badge = block.querySelector('.category-badge');
        if (badge) badge.textContent = String(visibleInBlock);
      }
    });

    if (emptyState) {
      if (totalVisible === 0) {
        emptyState.style.display = 'flex';
      } else {
        emptyState.style.display = 'none';
      }
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.trim().toLowerCase();
      filterCards(query);
    });
  }

  // 初始渲染逻辑
  if (storage.getCategories().length === 0) {
    renderSkeleton();
  } else {
    renderMainGrid();
  }

  storage.syncFromCloud().then(updated => {
    if (updated) {
      renderMainGrid();
      window.dispatchEvent(new CustomEvent('appearance-updated'));
    }
  }).catch(e => console.error('Silent background sync failed:', e));

  gridSection?.addEventListener('click', (e) => {
    const card = (e.target as HTMLElement).closest('.link-card');
    if (card) {
      const id = card.getAttribute('data-id');
      if (id) {
        storage.recordClick(id);
      }
    }
  });

  window.addEventListener('focus', () => {
    storage.syncFromCloud().then(updated => {
      if (updated) {
        renderMainGrid();
        window.dispatchEvent(new CustomEvent('appearance-updated'));
      }
    }).catch(e => console.error('Focus background sync failed:', e));
  });
}

document.addEventListener('astro:page-load', initMainPage);
