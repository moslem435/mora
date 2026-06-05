import { storage } from '../storage';

export function initMainPage() {
  const gridSection = document.getElementById('gridSection');
  if (!gridSection) return;

  const greetingTitle = document.getElementById('greetingTitle');
  const greetingSubtitle = document.getElementById('greetingSubtitle');
  const emptyState = document.getElementById('emptyState');

  const greetings = [
    { hour: 5, text: '清晨好，追光者' },
    { hour: 9, text: '上午好，专注当下' },
    { hour: 12, text: '中午好，适当小憩' },
    { hour: 14, text: '下午好，保持热爱' },
    { hour: 18, text: '黄昏好，日落温柔' },
    { hour: 22, text: '夜深了，早点休息' }
  ];

  const randomSubtitles = [
    '心之所向，无问西东。',
    '行而不辍，未来可期。',
    '不乱于心，不困于情。',
    '慢品人间烟火色，闲观万事岁月长。',
    '代码有温度，生活有态度。',
    '凡是过往，皆为序章。'
  ];

  function getDomain(urlStr: string) {
    try {
      const url = new URL(urlStr);
      return url.hostname;
    } catch (e) {
      return '';
    }
  }

  function updateGreeting() {
    const hr = new Date().getHours();
    let greetText = '你好，极客';

    for (let i = greetings.length - 1; i >= 0; i--) {
      if (hr >= greetings[i].hour) {
        greetText = greetings[i].text;
        break;
      }
    }

    if (greetingTitle) greetingTitle.textContent = greetText;

    const randomSub = randomSubtitles[Math.floor(Math.random() * randomSubtitles.length)];
    if (greetingSubtitle) greetingSubtitle.textContent = randomSub;
  }
  updateGreeting();

  function renderMainGrid() {
    if (!gridSection) return;
    gridSection.innerHTML = '';

    const categories = storage.getCategories().sort((a, b) => a.order - b.order);
    const links = storage.getLinks().sort((a, b) => a.order - b.order);

    if (categories.length === 0) {
      emptyState!.style.display = 'flex';
      return;
    } else {
      emptyState!.style.display = 'none';
    }

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
        const faviconUrl = domain ? `https://api.iowen.cn/favicon/${domain}.png` : '';
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
                    ${faviconUrl ? `
                    <img
                      src="${faviconUrl}"
                      class="card-favicon"
                      onload="this.style.display='block'; this.nextElementSibling.style.display='none'; const wm = this.closest('.link-card').querySelector('.watermark-favicon'); if (wm) { wm.src = this.src; wm.style.display = 'block'; if (wm.nextElementSibling) wm.nextElementSibling.style.display = 'none'; }"
                      onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                      style="display: none; width: 28px; height: 28px; border-radius: 6px; object-fit: contain;"
                      alt=""
                    />
                    ` : ''}
                    <i data-lucide="${link.icon || 'external-link'}" class="card-icon"></i>
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
              ${faviconUrl ? `
              <img
                class="watermark-favicon"
                style="display: none; width: 100%; height: 100%; object-fit: contain;"
                alt=""
              />
              ` : ''}
              <i data-lucide="${link.icon || 'external-link'}"></i>
            </div>
          </a>
        `;
        grid!.insertAdjacentHTML('beforeend', cardHtml);
      });

      gridSection.appendChild(catBlock);
    });

    const runLucide = () => {
      if ((window as any).lucide) {
        (window as any).lucide.createIcons({ root: gridSection });
      } else {
        setTimeout(runLucide, 50);
      }
    };
    runLucide();

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

  renderMainGrid();

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
