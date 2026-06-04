import { storage } from '../storage';
import { refreshLucideIcons } from '../ui/icons';

export function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const clockTime = document.getElementById('clockTime');
  const clockDate = document.getElementById('clockDate');
  const sidebarNav = document.getElementById('sidebarNav');
  const weatherWidget = document.getElementById('weatherWidget');

  const isSidebarOpen = localStorage.getItem('nav_sidebar_open') === 'true';
  if (isSidebarOpen && sidebar && sidebarToggle) {
    sidebar.classList.add('open');
    sidebarToggle.style.left = '270px';
    sidebarToggle.innerHTML = `<i data-lucide="x" class="toggle-icon"></i>`;
  }

  sidebarToggle?.addEventListener('click', () => {
    const isOpen = sidebar?.classList.toggle('open');
    localStorage.setItem('nav_sidebar_open', String(isOpen));

    if (isOpen) {
      sidebarToggle.innerHTML = `<i data-lucide="x" class="toggle-icon"></i>`;
      sidebarToggle.style.left = '270px';
    } else {
      sidebarToggle.innerHTML = `<i data-lucide="menu" class="toggle-icon"></i>`;
      sidebarToggle.style.left = '20px';
    }

    refreshLucideIcons();
  });

  function updateClock() {
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const secs = String(now.getSeconds()).padStart(2, '0');
    if (clockTime) clockTime.textContent = `${hrs}:${mins}:${secs}`;

    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const day = days[now.getDay()];
    if (clockDate) clockDate.textContent = `${year}年${month}月${date}日 ${day}`;
  }

  updateClock();
  setInterval(updateClock, 1000);

  const weatherQuotes = [
    '“静水流深，晴空万里。”',
    '“林下清风，心旷神怡。”',
    '“和风细雨，润物无声。”',
    '“微风轻拂，云卷云舒。”',
    '“晓看红湿处，花重锦官城。”',
    '“山气日夕佳，飞鸟相与还。”'
  ];

  const weatherData = [
    { temp: '22°C', status: '微风拂面', wind: '舒适', icon: 'wind' },
    { temp: '18°C', status: '多云转晴', wind: '和煦', icon: 'sun-dim' },
    { temp: '20°C', status: '和风细雨', wind: '润泽', icon: 'cloud-drizzle' },
    { temp: '24°C', status: '晴空朗朗', wind: '明媚', icon: 'sun' }
  ];

  function rotateWeather() {
    const randomWeather = weatherData[Math.floor(Math.random() * weatherData.length)];
    const randomQuote = weatherQuotes[Math.floor(Math.random() * weatherQuotes.length)];

    const tempEl = document.getElementById('weatherTemp');
    const statusEl = document.getElementById('weatherStatus');
    const windEl = document.getElementById('weatherWind');
    const quoteEl = document.getElementById('weatherQuote');
    const iconEl = document.getElementById('weatherIcon');

    if (tempEl) tempEl.textContent = randomWeather.temp;
    if (statusEl) statusEl.textContent = randomWeather.status;
    if (windEl) windEl.textContent = randomWeather.wind;
    if (quoteEl) quoteEl.textContent = randomQuote;
    if (iconEl) {
      iconEl.setAttribute('data-lucide', randomWeather.icon);
      refreshLucideIcons();
    }
  }

  rotateWeather();
  weatherWidget?.addEventListener('click', rotateWeather);

  function renderNav() {
    if (!sidebarNav) return;
    sidebarNav.innerHTML = '';

    const categories = storage.getCategories().sort((a, b) => a.order - b.order);

    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'nav-item';
      btn.setAttribute('type', 'button');
      btn.setAttribute('style', `--theme-color: var(--theme-${cat.color})`);
      btn.innerHTML = `
        <i data-lucide="${cat.icon}" class="nav-item-icon"></i>
        <span>${cat.name}</span>
      `;

      btn.addEventListener('click', () => {
        const target = document.getElementById(cat.id);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
          btn.classList.add('active');
        }
      });

      sidebarNav.appendChild(btn);
    });

    refreshLucideIcons();
  }

  renderNav();
  window.addEventListener('categories-updated', renderNav);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSidebar);
} else {
  initSidebar();
}
