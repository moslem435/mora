import { createClient } from '@supabase/supabase-js';

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

export interface AppearanceConfig {
  bgStyle: 'morandi-glow' | 'solid-cream' | 'dark-slate' | 'custom-url' | 'custom-file';
  customBgUrl: string;
  cardOpacity: number;
  cardBlur: number;
  primaryColor: string; // blue, green, purple, pink, orange, yellow
  fontStyle: 'morandi-sans' | 'system-sans' | 'inter' | 'outfit' | 'geist' | 'custom-link' | 'custom-file';
  fontCustomLink?: string;
  fontFamilyName?: string;
  scrollbarEnabled?: boolean; // 是否启用自定义滚动条，默认为 false
}

// 默认种子数据
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: '常用推荐', icon: 'star', color: 'blue', order: 1 },
  { id: 'cat-2', name: '开发设计', icon: 'code-xml', color: 'green', order: 2 },
  { id: 'cat-3', name: '效率工具', icon: 'wrench', color: 'purple', order: 3 },
  { id: 'cat-4', name: '摸鱼休闲', icon: 'coffee', color: 'pink', order: 4 }
];

const DEFAULT_LINKS: Link[] = [
  { id: 'link-1', categoryId: 'cat-1', title: 'GitHub', url: 'https://github.com', description: '全球最大的开源及软件项目托管平台。', icon: 'github', clicks: 0, order: 1 },
  { id: 'link-2', categoryId: 'cat-1', title: 'V2EX', url: 'https://v2ex.com', description: '一个关于创意、科技、工作和生活互动的社区。', icon: 'message-square-more', clicks: 0, order: 2 },
  { id: 'link-3', categoryId: 'cat-1', title: 'Astro 官网', url: 'https://astro.build', description: '致力于构建快如闪电的现代内容站点的 Web 框架。', icon: 'rocket', clicks: 0, order: 3 },
  { id: 'link-4', categoryId: 'cat-2', title: 'MDN Web Docs', url: 'https://developer.mozilla.org', description: '详尽的 Web 开发技术文档与教程。', icon: 'file-text', clicks: 0, order: 1 },
  { id: 'link-5', categoryId: 'cat-2', title: 'Can I Use', url: 'https://caniuse.com', description: '查询前端技术在各浏览器版本的兼容性。', icon: 'chrome', clicks: 0, order: 2 },
  { id: 'link-6', categoryId: 'cat-2', title: 'Dribbble', url: 'https://dribbble.com', description: '全球顶尖设计师的作品分享和创意社区。', icon: 'palette', clicks: 0, order: 3 },
  { id: 'link-7', categoryId: 'cat-2', title: 'Figma', url: 'https://www.figma.com', description: '新一代跨平台实时协作的界面设计工具。', icon: 'framer', clicks: 0, order: 4 },
  { id: 'link-8', categoryId: 'cat-3', title: 'Notion', url: 'https://notion.so', description: '集笔记、任务、知识库及项目管理于一身的多功能工作台。', icon: 'notebook-tabs', clicks: 0, order: 1 },
  { id: 'link-9', categoryId: 'cat-3', title: 'DeepL 翻译', url: 'https://www.deepl.com/translator', description: '公认极其准确的人工智能翻译工具。', icon: 'languages', clicks: 0, order: 2 },
  { id: 'link-10', categoryId: 'cat-3', title: 'TinyPNG', url: 'https://tinypng.com', description: '优秀的在线图片无损压缩工具。', icon: 'image-minus', clicks: 0, order: 3 },
  { id: 'link-11', categoryId: 'cat-4', title: '哔哩哔哩', url: 'https://www.bilibili.com', description: '国内知名的高质量视频弹幕社区。', icon: 'play', clicks: 0, order: 1 },
  { id: 'link-12', categoryId: 'cat-4', title: '少数派', url: 'https://sspai.com', description: '致力于提升数字生活品质的内容平台。', icon: 'compass', clicks: 0, order: 2 },
  { id: 'link-13', categoryId: 'cat-4', title: '豆瓣', url: 'https://douban.com', description: '图书、电影、音乐的个性化生活社区。', icon: 'ticket', clicks: 0, order: 3 }
];

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
  fontFamilyName: '',
  scrollbarEnabled: false
};

// =========================================================================
// Supabase 客户端配置与初始化
// =========================================================================
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

// 获取当前登录用户 ID 辅助函数
async function getUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
}

export const storage = {
  // 初始化本地 LocalStorage 数据
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

  // 同步静默从云端同步最新数据至本地 LocalStorage
  async syncFromCloud(): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let targetUserId = session?.user?.id || null;

      // 如果未登录，尝试使用默认配置的管理员 ID（供访客访问展示）
      if (!targetUserId) {
        targetUserId = import.meta.env.PUBLIC_DEFAULT_ADMIN_USER_ID || null;
      }

      if (!targetUserId) return false;

      // 并行请求分类、链接和外观设置
      const [catRes, linkRes, appRes] = await Promise.all([
        supabase.from('categories').select('*').eq('user_id', targetUserId).order('order', { ascending: true }),
        supabase.from('links').select('*').eq('user_id', targetUserId).order('order', { ascending: true }),
        supabase.from('appearance').select('*').eq('user_id', targetUserId).maybeSingle()
      ]);

      if (catRes.error || linkRes.error || appRes.error) {
        console.warn('Sync from cloud failed:', catRes.error, linkRes.error, appRes.error);
        return false;
      }

      const cloudCats = catRes.data || [];
      const cloudLinks = linkRes.data || [];
      const cloudApp = appRes.data || null;

      const localCatsStr = localStorage.getItem(KEY_CATEGORIES);
      const localLinksStr = localStorage.getItem(KEY_LINKS);
      const localAppStr = localStorage.getItem(KEY_APPEARANCE);

      // 格式化分类与链接为前端所需的标准格式
      const formattedCats: Category[] = cloudCats.map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        order: c.order
      }));

      const formattedLinks: Link[] = cloudLinks.map(l => ({
        id: l.id,
        categoryId: l.category_id,
        title: l.title,
        url: l.url,
        description: l.description || '',
        icon: l.icon,
        clicks: l.clicks || 0,
        order: l.order
      }));

      let formattedApp: AppearanceConfig | null = null;
      if (cloudApp) {
        formattedApp = {
          bgStyle: cloudApp.bg_style,
          customBgUrl: cloudApp.custom_bg_url || '',
          cardOpacity: Number(cloudApp.card_opacity),
          cardBlur: Number(cloudApp.card_blur),
          primaryColor: cloudApp.primary_color,
          fontStyle: cloudApp.font_style,
          fontCustomLink: cloudApp.font_custom_link || '',
          fontFamilyName: cloudApp.font_family_name || '',
          scrollbarEnabled: cloudApp.scrollbar_enabled !== undefined ? !!cloudApp.scrollbar_enabled : false
        };
      }

      const catsChanged = JSON.stringify(formattedCats) !== localCatsStr;
      const linksChanged = JSON.stringify(formattedLinks) !== localLinksStr;
      const appChanged = formattedApp && (JSON.stringify(formattedApp) !== localAppStr);

      // 数据有更新时同步写入本地
      if (catsChanged) localStorage.setItem(KEY_CATEGORIES, JSON.stringify(formattedCats));
      if (linksChanged) localStorage.setItem(KEY_LINKS, JSON.stringify(formattedLinks));
      if (appChanged && formattedApp) localStorage.setItem(KEY_APPEARANCE, JSON.stringify(formattedApp));

      return catsChanged || linksChanged || appChanged;
    } catch (e) {
      console.error('Quiet cloud sync failed:', e);
      return false;
    }
  },

  // 获取所有分类（同步返回缓存）
  getCategories(): Category[] {
    if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
    this.init();
    const data = localStorage.getItem(KEY_CATEGORIES);
    try {
      return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
    } catch (e) {
      console.error('Failed to parse categories, resetting', e);
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

  // 获取所有链接（同步返回缓存）
  getLinks(): Link[] {
    if (typeof window === 'undefined') return DEFAULT_LINKS;
    this.init();
    const data = localStorage.getItem(KEY_LINKS);
    try {
      return data ? JSON.parse(data) : DEFAULT_LINKS;
    } catch (e) {
      console.error('Failed to parse links, resetting', e);
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

  // 获取美化配置（同步返回缓存）
  getAppearance(): AppearanceConfig {
    if (typeof window === 'undefined') return DEFAULT_APPEARANCE;
    this.init();
    const data = localStorage.getItem(KEY_APPEARANCE);
    try {
      return data ? JSON.parse(data) : DEFAULT_APPEARANCE;
    } catch (e) {
      console.error('Failed to parse appearance configuration, resetting', e);
      localStorage.setItem(KEY_APPEARANCE, JSON.stringify(DEFAULT_APPEARANCE));
      return DEFAULT_APPEARANCE;
    }
  },

  // 保存美化配置到本地
  saveAppearance(config: AppearanceConfig) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(KEY_APPEARANCE, JSON.stringify(config));
      // 触发后台同步
      this.saveAppearanceCloud(config).catch(err => console.error(err));
    } catch (e) {
      console.error('Failed to save appearance config', e);
    }
  },

  // 新增分类 (同步 API 兼容)
  addCategory(category: Omit<Category, 'id' | 'order'>): Category {
    const list = this.getCategories();
    const id = 'cat-' + Date.now();
    const order = list.length > 0 ? Math.max(...list.map(c => c.order)) + 1 : 1;
    const newCat = { ...category, id, order };
    list.push(newCat);
    this.saveCategories(list);
    
    // 静默云端写入
    this.addCategoryCloudSilent(newCat).catch(err => console.error(err));
    return newCat;
  },

  // 修改分类 (同步 API 兼容)
  updateCategory(category: Category) {
    const list = this.getCategories();
    const idx = list.findIndex(c => c.id === category.id);
    if (idx !== -1) {
      list[idx] = category;
      this.saveCategories(list);
      
      // 静默云端更新
      this.updateCategoryCloudSilent(category).catch(err => console.error(err));
    }
  },

  // 删除分类及其链接 (同步 API 兼容)
  deleteCategory(catId: string) {
    let list = this.getCategories();
    list = list.filter(c => c.id !== catId);
    this.saveCategories(list);

    let links = this.getLinks();
    links = links.filter(l => l.categoryId !== catId);
    this.saveLinks(links);

    // 静默云端删除
    this.deleteCategoryCloudSilent(catId).catch(err => console.error(err));
  },

  // 新增链接 (同步 API 兼容)
  addLink(link: Omit<Link, 'id' | 'order' | 'clicks'>): Link {
    const list = this.getLinks();
    const id = 'link-' + Date.now();
    const order = list.length > 0 ? Math.max(...list.map(l => l.order)) + 1 : 1;
    const newLink = { ...link, id, order, clicks: 0 };
    list.push(newLink);
    this.saveLinks(list);

    // 静默云端写入
    this.addLinkCloudSilent(newLink).catch(err => console.error(err));
    return newLink;
  },

  // 修改链接 (同步 API 兼容)
  updateLink(link: Link) {
    const list = this.getLinks();
    const idx = list.findIndex(l => l.id === link.id);
    if (idx !== -1) {
      list[idx] = link;
      this.saveLinks(list);

      // 静默云端更新
      this.updateLinkCloudSilent(link).catch(err => console.error(err));
    }
  },

  // 删除链接 (同步 API 兼容)
  deleteLink(linkId: string) {
    let list = this.getLinks();
    list = list.filter(l => l.id !== linkId);
    this.saveLinks(list);

    // 静默云端删除
    this.deleteLinkCloudSilent(linkId).catch(err => console.error(err));
  },

  // 点击计数与云端同步 (不影响使用)
  recordClick(linkId: string) {
    const list = this.getLinks();
    const link = list.find(l => l.id === linkId);
    if (link) {
      link.clicks = (link.clicks || 0) + 1;
      this.saveLinks(list);
      
      this.updateLinkCloudSilent(link).catch(err => console.error(err));
    }
  },

  // =========================================================================
  // 强力云端写入异步 API（供 Admin 控制台操作使用，确保事务可靠性）
  // =========================================================================

  async addCategoryCloud(category: Omit<Category, 'id' | 'order'>): Promise<Category> {
    const newCat = this.addCategory(category);
    await this.addCategoryCloudSilent(newCat);
    return newCat;
  },

  async updateCategoryCloud(category: Category): Promise<void> {
    this.updateCategory(category);
    await this.updateCategoryCloudSilent(category);
  },

  async deleteCategoryCloud(catId: string): Promise<void> {
    this.deleteCategory(catId);
    await this.deleteCategoryCloudSilent(catId);
  },

  async addLinkCloud(link: Omit<Link, 'id' | 'order' | 'clicks'>): Promise<Link> {
    const newLink = this.addLink(link);
    await this.addLinkCloudSilent(newLink);
    return newLink;
  },

  async updateLinkCloud(link: Link): Promise<void> {
    this.updateLink(link);
    await this.updateLinkCloudSilent(link);
  },

  async deleteLinkCloud(linkId: string): Promise<void> {
    this.deleteLink(linkId);
    await this.deleteLinkCloudSilent(linkId);
  },

  // =========================================================================
  // 云端静默辅助方法 (底层操作)
  // =========================================================================

  async addCategoryCloudSilent(cat: Category) {
    if (!supabase) return;
    try {
      const userId = await getUserId();
      if (!userId) return;
      await supabase.from('categories').insert({
        id: cat.id,
        user_id: userId,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        order: cat.order
      });
    } catch (e) {
      console.error(e);
    }
  },

  async updateCategoryCloudSilent(cat: Category) {
    if (!supabase) return;
    try {
      const userId = await getUserId();
      if (!userId) return;
      await supabase.from('categories').update({
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        order: cat.order
      }).eq('id', cat.id).eq('user_id', userId);
    } catch (e) {
      console.error(e);
    }
  },

  async deleteCategoryCloudSilent(catId: string) {
    if (!supabase) return;
    try {
      const userId = await getUserId();
      if (!userId) return;
      await supabase.from('categories').delete().eq('id', catId).eq('user_id', userId);
    } catch (e) {
      console.error(e);
    }
  },

  async addLinkCloudSilent(link: Link) {
    if (!supabase) return;
    try {
      const userId = await getUserId();
      if (!userId) return;
      await supabase.from('links').insert({
        id: link.id,
        user_id: userId,
        category_id: link.categoryId,
        title: link.title,
        url: link.url,
        description: link.description,
        icon: link.icon,
        clicks: link.clicks,
        order: link.order
      });
    } catch (e) {
      console.error(e);
    }
  },

  async updateLinkCloudSilent(link: Link) {
    if (!supabase) return;
    try {
      const userId = await getUserId();
      if (!userId) return;
      await supabase.from('links').update({
        category_id: link.categoryId,
        title: link.title,
        url: link.url,
        description: link.description,
        icon: link.icon,
        clicks: link.clicks,
        order: link.order
      }).eq('id', link.id).eq('user_id', userId);
    } catch (e) {
      console.error(e);
    }
  },

  async deleteLinkCloudSilent(linkId: string) {
    if (!supabase) return;
    try {
      const userId = await getUserId();
      if (!userId) return;
      await supabase.from('links').delete().eq('id', linkId).eq('user_id', userId);
    } catch (e) {
      console.error(e);
    }
  },

  async saveAppearanceCloud(config: AppearanceConfig) {
    if (!supabase) return;
    try {
      const userId = await getUserId();
      if (!userId) return;
      await supabase.from('appearance').upsert({
        user_id: userId,
        bg_style: config.bgStyle,
        custom_bg_url: config.customBgUrl,
        card_opacity: config.cardOpacity,
        card_blur: config.cardBlur,
        primary_color: config.primaryColor,
        font_style: config.fontStyle,
        font_custom_link: config.fontCustomLink,
        font_family_name: config.fontFamilyName,
        scrollbar_enabled: config.scrollbarEnabled ?? false
      });
    } catch (e) {
      console.error(e);
    }
  },

  // 备份与重置
  exportData(): string {
    const data = {
      categories: this.getCategories(),
      links: this.getLinks(),
      appearance: this.getAppearance()
    };
    return JSON.stringify(data, null, 2);
  },

  importData(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.categories) && Array.isArray(data.links)) {
        this.saveCategories(data.categories);
        this.saveLinks(data.links);
        if (data.appearance) {
          this.saveAppearance(data.appearance);
        }
        
        // 异步导入云端
        this.importDataCloud(data.categories, data.links, data.appearance).catch(err => console.error(err));
        return true;
      }
    } catch (e) {
      console.error('Import failed', e);
    }
    return false;
  },

  async importDataCloud(categories: Category[], links: Link[], appearance?: AppearanceConfig) {
    if (!supabase) return;
    try {
      const userId = await getUserId();
      if (!userId) return;

      // 清除该用户原云端数据
      await Promise.all([
        supabase.from('categories').delete().eq('user_id', userId),
        supabase.from('links').delete().eq('user_id', userId)
      ]);

      // 重新插入全部数据
      const catsToInsert = categories.map(c => ({
        id: c.id,
        user_id: userId,
        name: c.name,
        icon: c.icon,
        color: c.color,
        order: c.order
      }));

      const linksToInsert = links.map(l => ({
        id: l.id,
        user_id: userId,
        category_id: l.categoryId,
        title: l.title,
        url: l.url,
        description: l.description,
        icon: l.icon,
        clicks: l.clicks,
        order: l.order
      }));

      await Promise.all([
        supabase.from('categories').insert(catsToInsert),
        supabase.from('links').insert(linksToInsert)
      ]);

      if (appearance) {
        await this.saveAppearanceCloud(appearance);
      }
    } catch (e) {
      console.error('Failed to import to cloud', e);
    }
  },

  resetToDefault() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(KEY_CATEGORIES);
    localStorage.removeItem(KEY_LINKS);
    localStorage.removeItem(KEY_APPEARANCE);
    this.init();
    
    // 异步清除云端
    this.resetToDefaultCloud().catch(err => console.error(err));
    dbStorage.clear().catch(e => console.error('Failed to clear local assets:', e));
  },

  async resetToDefaultCloud() {
    if (!supabase) return;
    try {
      const userId = await getUserId();
      if (!userId) return;
      
      // 清空分类、链接（级联删除）、外观配置
      await Promise.all([
        supabase.from('categories').delete().eq('user_id', userId),
        supabase.from('appearance').delete().eq('user_id', userId)
      ]);
      
      // 重新导入云端默认种子数据
      await this.importDataCloud(DEFAULT_CATEGORIES, DEFAULT_LINKS, DEFAULT_APPEARANCE);
    } catch (e) {
      console.error(e);
    }
  },

  // 获取当前用户的角色权限
  async getCurrentUserRole(): Promise<'admin' | 'user'> {
    if (!supabase) return 'user';
    try {
      const userId = await getUserId();
      if (!userId) return 'user';
      const { data, error } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
      if (error || !data) return 'user';
      return data.role as 'admin' | 'user';
    } catch (e) {
      console.error('Failed to get user role:', e);
      return 'user';
    }
  },

  // 获取当前用户是否拥有物理文件上传权限
  async getCurrentUserUploadPermission(): Promise<boolean> {
    if (!supabase) return true; // 离线纯本地模式默认允许
    try {
      const userId = await getUserId();
      if (!userId) return false;
      const { data, error } = await supabase.from('profiles').select('allow_upload').eq('id', userId).maybeSingle();
      if (error || !data) return false;
      return !!data.allow_upload;
    } catch (e) {
      console.error('Failed to get user upload permission:', e);
      return false;
    }
  },

  // 获取所有会员档案（仅限超级管理员角色）
  async getAllProfiles(): Promise<any[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Failed to get all profiles:', e);
      return [];
    }
  },

  // 修改会员档案权限（仅限超级管理员角色，支持更新角色和上传权限）
  async updateUserProfileRole(userId: string, role: 'admin' | 'user', allowUpload?: boolean): Promise<void> {
    if (!supabase) return;
    try {
      const updates: any = { role };
      if (allowUpload !== undefined) {
        updates.allow_upload = allowUpload;
      }
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);
      if (error) throw error;
    } catch (e) {
      console.error('Failed to update profile role:', e);
      throw e;
    }
  }
};

// =========================================================================
// IndexedDB 与 Cloud Storage 混合文件存储服务 (dbStorage)
// =========================================================================
const DB_NAME = 'MoraNavDB';
const DB_VERSION = 1;
const STORE_NAME = 'assets';

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported.'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// 辅助方法：保存至本地本地数据库
async function saveLocalAsset(key: string, value: Blob | File): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export const dbStorage = {
  // 原生本地读写
  async saveLocalAssetOnly(key: string, value: Blob | File): Promise<void> {
    await saveLocalAsset(key, value);
  },

  // 增强上传接口：上传至云端对象存储桶，返回 CDN 公开 URL；若不可用则返回 null
  async saveAsset(key: string, value: Blob | File): Promise<string | null> {
    // 依然先存本地
    await saveLocalAsset(key, value);

    if (!supabase) return null;

    try {
      const userId = await getUserId();
      if (!userId) return null;

      // 检查当前用户是否有物理文件上传权限
      const hasPermission = await storage.getCurrentUserUploadPermission();
      if (!hasPermission) {
        throw new Error('您暂无上传物理文件权限，请联系管理员开通');
      }

      // 提取文件后缀名
      let ext = 'bin';
      if (value instanceof File) {
        ext = value.name.split('.').pop() || 'bin';
      } else if (value.type) {
        ext = value.type.split('/').pop() || 'bin';
      }

      // 统一构建用户路径
      const fileName = `${userId}/${key}.${ext}`;

      // 上传到 "mora-assets" 桶，设置 upsert: true 支持覆盖
      const { error } = await supabase.storage
        .from('mora-assets')
        .upload(fileName, value, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // 获取公开 URL
      const { data: { publicUrl } } = supabase.storage
        .from('mora-assets')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (e) {
      console.error('Failed to upload asset to Supabase Storage:', e);
      return null;
    }
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
    
    // 云端静默删除
    if (supabase) {
      getUserId().then(userId => {
        if (userId) {
          // 由于后缀名不确定，暂时忽略，用户在桶里直接覆盖上传即可
        }
      }).catch(err => console.error(err));
    }

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
