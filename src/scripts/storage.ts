export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide 图标名称
  color: string; // 莫兰迪分类色彩标识
  order: number;
}

export interface Link {
  id: string;
  categoryId: string;
  title: string;
  url: string;
  description: string;
  icon: string; // Lucide 图标名称
  clicks: number;
  order: number;
}

// 默认种子数据
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: '常用推荐', icon: 'star', color: 'blue', order: 1 },
  { id: 'cat-2', name: '开发设计', icon: 'code-xml', color: 'green', order: 2 },
  { id: 'cat-3', name: '效率工具', icon: 'wrench', color: 'purple', order: 3 },
  { id: 'cat-4', name: '摸鱼休闲', icon: 'coffee', color: 'pink', order: 4 }
];

const DEFAULT_LINKS: Link[] = [
  // 常用推荐
  { id: 'link-1', categoryId: 'cat-1', title: 'GitHub', url: 'https://github.com', description: '全球最大的开源及软件项目托管平台。', icon: 'github', clicks: 0, order: 1 },
  { id: 'link-2', categoryId: 'cat-1', title: 'V2EX', url: 'https://v2ex.com', description: '一个关于创意、科技、工作和生活互动的社区。', icon: 'message-square-more', clicks: 0, order: 2 },
  { id: 'link-3', categoryId: 'cat-1', title: 'Astro 官网', url: 'https://astro.build', description: '致力于构建快如闪电的现代内容站点的 Web 框架。', icon: 'rocket', clicks: 0, order: 3 },
  
  // 开发设计
  { id: 'link-4', categoryId: 'cat-2', title: 'MDN Web Docs', url: 'https://developer.mozilla.org', description: '详尽的 Web 开发技术文档与教程。', icon: 'file-text', clicks: 0, order: 1 },
  { id: 'link-5', categoryId: 'cat-2', title: 'Can I Use', url: 'https://caniuse.com', description: '查询前端技术在各浏览器版本的兼容性。', icon: 'chrome', clicks: 0, order: 2 },
  { id: 'link-6', categoryId: 'cat-2', title: 'Dribbble', url: 'https://dribbble.com', description: '全球顶尖设计师的作品分享和创意社区。', icon: 'palette', clicks: 0, order: 3 },
  { id: 'link-7', categoryId: 'cat-2', title: 'Figma', url: 'https://www.figma.com', description: '新一代跨平台实时协作的界面设计工具。', icon: 'framer', clicks: 0, order: 4 },

  // 效率工具
  { id: 'link-8', categoryId: 'cat-3', title: 'Notion', url: 'https://notion.so', description: '集笔记、任务、知识库及项目管理于一身的多功能工作台。', icon: 'notebook-tabs', clicks: 0, order: 1 },
  { id: 'link-9', categoryId: 'cat-3', title: 'DeepL 翻译', url: 'https://www.deepl.com/translator', description: '公认极其准确的人工智能翻译工具。', icon: 'languages', clicks: 0, order: 2 },
  { id: 'link-10', categoryId: 'cat-3', title: 'TinyPNG', url: 'https://tinypng.com', description: '优秀的在线图片无损压缩工具。', icon: 'image-minus', clicks: 0, order: 3 },

  // 摸鱼休闲
  { id: 'link-11', categoryId: 'cat-4', title: '哔哩哔哩', url: 'https://www.bilibili.com', description: '国内知名的高质量视频弹幕社区。', icon: 'play', clicks: 0, order: 1 },
  { id: 'link-12', categoryId: 'cat-4', title: '少数派', url: 'https://sspai.com', description: '致力于提升数字生活品质的内容平台。', icon: 'compass', clicks: 0, order: 2 },
  { id: 'link-13', categoryId: 'cat-4', title: '豆瓣', url: 'https://douban.com', description: '图书、电影、音乐的个性化生活社区。', icon: 'ticket', clicks: 0, order: 3 }
];

export interface AppearanceConfig {
  bgStyle: 'morandi-glow' | 'solid-cream' | 'dark-slate' | 'custom-url' | 'custom-file';
  customBgUrl: string;
  cardOpacity: number;
  cardBlur: number;
  primaryColor: string; // blue, green, purple, pink, orange, yellow
  fontStyle: 'morandi-sans' | 'system-sans' | 'custom-link' | 'custom-file';
  fontCustomLink?: string;
  fontFamilyName?: string;
}

const KEY_CATEGORIES = 'nav_categories';
const KEY_LINKS = 'nav_links';
const KEY_APPEARANCE = 'nav_appearance';

const DEFAULT_APPEARANCE: AppearanceConfig = {
  bgStyle: 'morandi-glow',
  customBgUrl: '',
  cardOpacity: 0.65,
  cardBlur: 20,
  primaryColor: 'blue',
  fontStyle: 'system-sans',
  fontCustomLink: '',
  fontFamilyName: ''
};

export const storage = {
  // 初始化数据
  init() {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(KEY_CATEGORIES)) {
      localStorage.setItem(KEY_CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    }
    if (!localStorage.getItem(KEY_LINKS)) {
      localStorage.setItem(KEY_LINKS, JSON.stringify(DEFAULT_LINKS));
    }
    if (!localStorage.getItem(KEY_APPEARANCE)) {
      localStorage.setItem(KEY_APPEARANCE, JSON.stringify(DEFAULT_APPEARANCE));
    }
  },

  // 获取所有分类
  getCategories(): Category[] {
    if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
    this.init();
    const data = localStorage.getItem(KEY_CATEGORIES);
    try {
      return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
    } catch (e) {
      console.error('Failed to parse categories from localStorage, resetting to default', e);
      localStorage.setItem(KEY_CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
  },

  // 保存所有分类
  saveCategories(categories: Category[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(KEY_CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save categories', e);
    }
  },

  // 获取所有链接
  getLinks(): Link[] {
    if (typeof window === 'undefined') return DEFAULT_LINKS;
    this.init();
    const data = localStorage.getItem(KEY_LINKS);
    try {
      return data ? JSON.parse(data) : DEFAULT_LINKS;
    } catch (e) {
      console.error('Failed to parse links from localStorage, resetting to default', e);
      localStorage.setItem(KEY_LINKS, JSON.stringify(DEFAULT_LINKS));
      return DEFAULT_LINKS;
    }
  },

  // 保存所有链接
  saveLinks(links: Link[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(KEY_LINKS, JSON.stringify(links));
    } catch (e) {
      console.error('Failed to save links', e);
    }
  },

  // 获取美化配置
  getAppearance(): AppearanceConfig {
    if (typeof window === 'undefined') return DEFAULT_APPEARANCE;
    this.init();
    const data = localStorage.getItem(KEY_APPEARANCE);
    try {
      return data ? JSON.parse(data) : DEFAULT_APPEARANCE;
    } catch (e) {
      console.error('Failed to parse appearance configuration, resetting to default', e);
      localStorage.setItem(KEY_APPEARANCE, JSON.stringify(DEFAULT_APPEARANCE));
      return DEFAULT_APPEARANCE;
    }
  },

  // 保存美化配置
  saveAppearance(config: AppearanceConfig) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(KEY_APPEARANCE, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save appearance config', e);
    }
  },

  // 新增分类
  addCategory(category: Omit<Category, 'id' | 'order'>): Category {
    const list = this.getCategories();
    const id = 'cat-' + Date.now();
    const order = list.length > 0 ? Math.max(...list.map(c => c.order)) + 1 : 1;
    const newCat = { ...category, id, order };
    list.push(newCat);
    this.saveCategories(list);
    return newCat;
  },

  // 修改分类
  updateCategory(category: Category) {
    const list = this.getCategories();
    const idx = list.findIndex(c => c.id === category.id);
    if (idx !== -1) {
      list[idx] = category;
      this.saveCategories(list);
    }
  },

  // 删除分类及其下的所有链接
  deleteCategory(catId: string) {
    let list = this.getCategories();
    list = list.filter(c => c.id !== catId);
    this.saveCategories(list);

    let links = this.getLinks();
    links = links.filter(l => l.categoryId !== catId);
    this.saveLinks(links);
  },

  // 新增链接
  addLink(link: Omit<Link, 'id' | 'order' | 'clicks'>): Link {
    const list = this.getLinks();
    const id = 'link-' + Date.now();
    const order = list.length > 0 ? Math.max(...list.map(l => l.order)) + 1 : 1;
    const newLink = { ...link, id, order, clicks: 0 };
    list.push(newLink);
    this.saveLinks(list);
    return newLink;
  },

  // 修改链接
  updateLink(link: Link) {
    const list = this.getLinks();
    const idx = list.findIndex(l => l.id === link.id);
    if (idx !== -1) {
      list[idx] = link;
      this.saveLinks(list);
    }
  },

  // 删除链接
  deleteLink(linkId: string) {
    let list = this.getLinks();
    list = list.filter(l => l.id !== linkId);
    this.saveLinks(list);
  },

  // 点击计数
  recordClick(linkId: string) {
    const list = this.getLinks();
    const link = list.find(l => l.id === linkId);
    if (link) {
      link.clicks = (link.clicks || 0) + 1;
      this.saveLinks(list);
    }
  },

  // 导出全部数据为 JSON
  exportData(): string {
    const data = {
      categories: this.getCategories(),
      links: this.getLinks(),
      appearance: this.getAppearance()
    };
    return JSON.stringify(data, null, 2);
  },

  // 从 JSON 导入数据
  importData(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.categories) && Array.isArray(data.links)) {
        this.saveCategories(data.categories);
        this.saveLinks(data.links);
        if (data.appearance) {
          this.saveAppearance(data.appearance);
        }
        return true;
      }
    } catch (e) {
      console.error('Import failed', e);
    }
    return false;
  },

  // 恢复默认配置
  resetToDefault() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(KEY_CATEGORIES);
    localStorage.removeItem(KEY_LINKS);
    localStorage.removeItem(KEY_APPEARANCE);
    this.init();
    dbStorage.clear().catch(e => console.error('Failed to clear IndexedDB on reset:', e));
  }
};

const DB_NAME = 'PersonalNavDB';
const DB_VERSION = 1;
const STORE_NAME = 'assets';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported or not running in browser.'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

export const dbStorage = {
  async saveAsset(key: string, value: Blob | File): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getAsset(key: string): Promise<Blob | File | null> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  },

  async deleteAsset(key: string): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async clear(): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};

