import type { AppearanceConfig, Category, Link, SiteConfig } from './types';
import { DEFAULT_APPEARANCE, DEFAULT_CATEGORIES, DEFAULT_LINKS, DEFAULT_SITE_CONFIG, KEY_APPEARANCE, KEY_CATEGORIES, KEY_LINKS, KEY_SITE_CONFIG } from './defaults';
import { getUserId, isSupabaseConfigured, supabase } from './supabase';
import { dbStorage } from './assets-storage';

export const storage = {
  init() {
    if (typeof window === 'undefined') return;
    
    // 如果没有分类数据，进行带唯一随机后缀的默认初始化，防止多账号主键冲突
    if (!localStorage.getItem(KEY_CATEGORIES)) {
      const suffix = Math.random().toString(36).substring(2, 8) + '-' + Date.now().toString().slice(-4);
      
      const uniqueCats = DEFAULT_CATEGORIES.map(c => ({
        ...c,
        id: `${c.id}-${suffix}`
      }));

      const catIdMap = DEFAULT_CATEGORIES.reduce((acc, c, idx) => {
        acc[c.id] = uniqueCats[idx].id;
        return acc;
      }, {} as Record<string, string>);

      const uniqueLinks = DEFAULT_LINKS.map(l => ({
        ...l,
        id: `${l.id}-${suffix}`,
        categoryId: catIdMap[l.categoryId] || l.categoryId
      }));

      localStorage.setItem(KEY_CATEGORIES, JSON.stringify(uniqueCats));
      localStorage.setItem(KEY_LINKS, JSON.stringify(uniqueLinks));
    }

    if (!localStorage.getItem(KEY_CATEGORIES)) {
      localStorage.setItem(KEY_CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    }
    if (!localStorage.getItem(KEY_LINKS)) {
      localStorage.setItem(KEY_LINKS, JSON.stringify(DEFAULT_LINKS));
    }
    if (!localStorage.getItem(KEY_APPEARANCE)) {
      localStorage.setItem(KEY_APPEARANCE, JSON.stringify(DEFAULT_APPEARANCE));
    }
    if (!localStorage.getItem(KEY_SITE_CONFIG)) {
      localStorage.setItem(KEY_SITE_CONFIG, JSON.stringify(DEFAULT_SITE_CONFIG));
    }
  },

  async syncFromCloud(): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let targetUserId = session?.user?.id || null;

      if (!targetUserId) {
        targetUserId = import.meta.env.PUBLIC_DEFAULT_ADMIN_USER_ID || null;
      }

      // 1. 始终拉取全站配置（独立于用户信息）
      const cloudSite = await this.syncSiteConfigPublic();

      // 2. 如果没有有效的 targetUserId，跳过业务数据同步，仅返回全站配置的更新状态
      if (!targetUserId || targetUserId === 'null') {
        return !!cloudSite;
      }

      // 3. 只有在有有效 UUID 时才发起业务数据查询
      const [catRes, linkRes, appRes] = await Promise.all([
        supabase.from('categories').select('*').eq('user_id', targetUserId).order('order', { ascending: true }),
        supabase.from('links').select('*').eq('user_id', targetUserId).order('order', { ascending: true }),
        supabase.from('appearance').select('*').eq('user_id', targetUserId).maybeSingle()
      ]);

      if (catRes.error || linkRes.error || appRes.error) {
        console.warn('Sync business data from cloud failed:', catRes.error, linkRes.error, appRes.error);
        return !!cloudSite;
      }

      const cloudCats = catRes.data || [];
      const cloudLinks = linkRes.data || [];
      const cloudApp = appRes.data || null;

      const localCatsStr = localStorage.getItem(KEY_CATEGORIES);
      const localLinksStr = localStorage.getItem(KEY_LINKS);
      const localAppStr = localStorage.getItem(KEY_APPEARANCE);
      const localSiteStr = localStorage.getItem(KEY_SITE_CONFIG);

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
      const siteChanged = cloudSite && (JSON.stringify(cloudSite) !== localSiteStr);

      if (catsChanged) localStorage.setItem(KEY_CATEGORIES, JSON.stringify(formattedCats));
      if (linksChanged) localStorage.setItem(KEY_LINKS, JSON.stringify(formattedLinks));
      if (appChanged && formattedApp) localStorage.setItem(KEY_APPEARANCE, JSON.stringify(formattedApp));
      if (siteChanged && cloudSite) localStorage.setItem(KEY_SITE_CONFIG, JSON.stringify(cloudSite));

      return catsChanged || linksChanged || appChanged || siteChanged;
    } catch (e) {
      console.error('Quiet cloud sync failed:', e);
      return false;
    }
  },

  async syncSiteConfigPublic(): Promise<SiteConfig | null> {
    const cloudSite = await this.fetchSiteConfigCloud();
    if (cloudSite) {
      localStorage.setItem(KEY_SITE_CONFIG, JSON.stringify(cloudSite));
      return cloudSite;
    }
    return null;
  },

  getSiteConfig(): SiteConfig {
    if (typeof window === 'undefined') return DEFAULT_SITE_CONFIG;
    const data = localStorage.getItem(KEY_SITE_CONFIG);
    try {
      return data ? JSON.parse(data) : DEFAULT_SITE_CONFIG;
    } catch (e) {
      return DEFAULT_SITE_CONFIG;
    }
  },

  saveSiteConfig(config: SiteConfig) {
    if (typeof window === 'undefined') return;
    try {
      // 仅同步至云端，本地缓存仅作极简存根
      localStorage.setItem(KEY_SITE_CONFIG, JSON.stringify(config));
      this.saveSiteConfigCloud(config).catch(err => console.error(err));
    } catch (e) {
      console.error('Failed to save site config', e);
    }
  },

  async fetchSiteConfigCloud(): Promise<SiteConfig | null> {
    if (!supabase) return null;
    try {
      // 强制请求最新的全站配置
      const { data, error } = await supabase.from('site_config').select('*');
      if (error) throw error;
      
      const config: SiteConfig = { allowRegistration: false }; // 默认设为 false
      data.forEach(item => {
        if (item.key === 'allow_registration') {
          // 兼容处理：Supabase 存的是 jsonb，可能是布尔值也可能是对象
          config.allowRegistration = typeof item.value === 'boolean' ? item.value : !!item.value;
        }
      });
      return config;
    } catch (e) {
      console.error('Failed to fetch site config from cloud', e);
      return null;
    }
  },

  async saveSiteConfigCloud(config: SiteConfig) {
    if (!supabase) return;
    try {
      // 关键修正：确保 key 名与数据库完全一致 'allow_registration'
      const { error } = await supabase.from('site_config').upsert({
        key: 'allow_registration',
        value: config.allowRegistration,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
      
      if (error) {
        console.error('Database update error:', error);
        throw error;
      }
    } catch (e) {
      console.error('Failed to save site config to cloud:', e);
      throw e;
    }
  },

  async fetchCloudData(): Promise<{ categories: Category[], links: Link[], appearance: AppearanceConfig | null } | null> {
    if (!supabase) return null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let targetUserId = session?.user?.id || null;
      if (!targetUserId) {
        targetUserId = import.meta.env.PUBLIC_DEFAULT_ADMIN_USER_ID || null;
      }
      if (!targetUserId) return null;

      const [catRes, linkRes, appRes] = await Promise.all([
        supabase.from('categories').select('*').eq('user_id', targetUserId).order('order', { ascending: true }),
        supabase.from('links').select('*').eq('user_id', targetUserId).order('order', { ascending: true }),
        supabase.from('appearance').select('*').eq('user_id', targetUserId).maybeSingle()
      ]);

      if (catRes.error) throw new Error(`拉取云端分类数据失败: ${catRes.error.message}`);
      if (linkRes.error) throw new Error(`拉取云端卡片数据失败: ${linkRes.error.message}`);
      if (appRes.error) throw new Error(`拉取云端美化配置失败: ${appRes.error.message}`);

      const formattedCats: Category[] = (catRes.data || []).map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
        order: c.order
      }));

      const formattedLinks: Link[] = (linkRes.data || []).map(l => ({
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
      if (appRes.data) {
        const cloudApp = appRes.data;
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

      return { categories: formattedCats, links: formattedLinks, appearance: formattedApp };
    } catch (e) {
      console.error('Fetch cloud data error:', e);
      throw e;
    }
  },

  checkConflict(cloudData: { categories: Category[], links: Link[], appearance: AppearanceConfig | null }): boolean {
    const localCats = this.getCategories();
    const localLinks = this.getLinks();
    const localApp = this.getAppearance();

    const catsMatch = JSON.stringify(localCats) === JSON.stringify(cloudData.categories);
    const linksMatch = JSON.stringify(localLinks) === JSON.stringify(cloudData.links);
    const appMatch = !cloudData.appearance || (JSON.stringify(localApp) === JSON.stringify(cloudData.appearance));

    return !catsMatch || !linksMatch || !appMatch;
  },

  applyCloudData(cloudData: { categories: Category[], links: Link[], appearance: AppearanceConfig | null }) {
    localStorage.setItem(KEY_CATEGORIES, JSON.stringify(cloudData.categories));
    localStorage.setItem(KEY_LINKS, JSON.stringify(cloudData.links));
    if (cloudData.appearance) {
      localStorage.setItem(KEY_APPEARANCE, JSON.stringify(cloudData.appearance));
    }
  },

  async uploadLocalData() {
    const localCats = this.getCategories();
    const localLinks = this.getLinks();
    const localApp = this.getAppearance();
    await this.importDataCloud(localCats, localLinks, localApp);
  },

  async mergeAndSyncData(cloudData: { categories: Category[], links: Link[], appearance: AppearanceConfig | null }) {
    const localCats = this.getCategories();
    const localLinks = this.getLinks();
    const localApp = this.getAppearance();

    const mergedCats = [...cloudData.categories];
    localCats.forEach(lc => {
      if (!mergedCats.some(cc => cc.id === lc.id)) {
        mergedCats.push(lc);
      }
    });
    mergedCats.forEach((c, idx) => {
      c.order = idx + 1;
    });

    const mergedLinks = [...cloudData.links];
    localLinks.forEach(ll => {
      if (!mergedLinks.some(cl => cl.id === ll.id || cl.url === ll.url)) {
        mergedLinks.push(ll);
      }
    });
    mergedLinks.forEach((l, idx) => {
      l.order = idx + 1;
    });

    const mergedApp = localApp;

    localStorage.setItem(KEY_CATEGORIES, JSON.stringify(mergedCats));
    localStorage.setItem(KEY_LINKS, JSON.stringify(mergedLinks));
    localStorage.setItem(KEY_APPEARANCE, JSON.stringify(mergedApp));

    await this.importDataCloud(mergedCats, mergedLinks, mergedApp);
  },

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

  saveCategories(categories: Category[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(KEY_CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save categories', e);
    }
  },

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

  saveLinks(links: Link[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(KEY_LINKS, JSON.stringify(links));
    } catch (e) {
      console.error('Failed to save links', e);
    }
  },

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

  saveAppearance(config: AppearanceConfig) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(KEY_APPEARANCE, JSON.stringify(config));
      this.saveAppearanceCloud(config).catch(err => console.error(err));
    } catch (e) {
      console.error('Failed to save appearance config', e);
    }
  },

  addCategory(category: Omit<Category, 'id' | 'order'>): Category {
    const list = this.getCategories();
    const id = 'cat-' + Date.now();
    const order = list.length > 0 ? Math.max(...list.map(c => c.order)) + 1 : 1;
    const newCat = { ...category, id, order };
    list.push(newCat);
    this.saveCategories(list);
    this.addCategoryCloudSilent(newCat).catch(err => console.error(err));
    return newCat;
  },

  updateCategory(category: Category) {
    const list = this.getCategories();
    const idx = list.findIndex(c => c.id === category.id);
    if (idx !== -1) {
      list[idx] = category;
      this.saveCategories(list);
      this.updateCategoryCloudSilent(category).catch(err => console.error(err));
    }
  },

  deleteCategory(catId: string) {
    let list = this.getCategories();
    list = list.filter(c => c.id !== catId);
    this.saveCategories(list);

    let links = this.getLinks();
    links = links.filter(l => l.categoryId !== catId);
    this.saveLinks(links);

    this.deleteCategoryCloudSilent(catId).catch(err => console.error(err));
  },

  addLink(link: Omit<Link, 'id' | 'order' | 'clicks'>): Link {
    const list = this.getLinks();
    const id = 'link-' + Date.now();
    const order = list.length > 0 ? Math.max(...list.map(l => l.order)) + 1 : 1;
    const newLink = { ...link, id, order, clicks: 0 };
    list.push(newLink);
    this.saveLinks(list);
    this.addLinkCloudSilent(newLink).catch(err => console.error(err));
    return newLink;
  },

  updateLink(link: Link) {
    const list = this.getLinks();
    const idx = list.findIndex(l => l.id === link.id);
    if (idx !== -1) {
      list[idx] = link;
      this.saveLinks(list);
      this.updateLinkCloudSilent(link).catch(err => console.error(err));
    }
  },

  deleteLink(linkId: string) {
    let list = this.getLinks();
    list = list.filter(l => l.id !== linkId);
    this.saveLinks(list);
    this.deleteLinkCloudSilent(linkId).catch(err => console.error(err));
  },

  recordClick(linkId: string) {
    const list = this.getLinks();
    const link = list.find(l => l.id === linkId);
    if (link) {
      link.clicks = (link.clicks || 0) + 1;
      this.saveLinks(list);
      this.updateLinkCloudSilent(link).catch(err => console.error(err));
    }
  },

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
      if (!userId) throw new Error('未获取到有效的用户 ID');
      const { error } = await supabase.from('appearance').upsert({
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
      if (error) {
        throw new Error(`更新云端美化配置失败: ${error.message}`);
      }
    } catch (e) {
      console.error('Failed to save appearance configuration to cloud:', e);
      throw e;
    }
  },

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
      if (!userId) throw new Error('未获取到有效的用户 ID');

      // 1. 先删掉旧的链接卡片（必须先删 links，再删 categories，防止外键级联约束报错）
      const delLinkRes = await supabase.from('links').delete().eq('user_id', userId);
      if (delLinkRes.error) {
        throw new Error(`删除云端旧链接失败: ${delLinkRes.error.message}`);
      }

      const delCatRes = await supabase.from('categories').delete().eq('user_id', userId);
      if (delCatRes.error) {
        throw new Error(`删除云端旧分类失败: ${delCatRes.error.message}`);
      }

      // 2. 准备分类插入数据
      const catsToInsert = categories.map(c => ({
        id: c.id,
        user_id: userId,
        name: c.name,
        icon: c.icon,
        color: c.color,
        order: c.order
      }));

      // 3. 准备链接卡片插入数据
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

      // 4. 必须先插入 categories，确保外键约束的父节点存在
      if (catsToInsert.length > 0) {
        const insertCatRes = await supabase.from('categories').insert(catsToInsert);
        if (insertCatRes.error) {
          throw new Error(`上传分类数据失败: ${insertCatRes.error.message}`);
        }
      }

      // 5. 分类插入成功后，再插入 links
      if (linksToInsert.length > 0) {
        const insertLinkRes = await supabase.from('links').insert(linksToInsert);
        if (insertLinkRes.error) {
          throw new Error(`上传链接卡片失败: ${insertLinkRes.error.message}`);
        }
      }

      // 6. 若有美化配置，则上传美化配置
      if (appearance) {
        await this.saveAppearanceCloud(appearance);
      }
    } catch (e: any) {
      console.error('Failed to import to cloud:', e);
      throw e; // 必须将错误重新抛出，以便上层能捕获到失败并向用户警示
    }
  },

  resetToDefault() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(KEY_CATEGORIES);
    localStorage.removeItem(KEY_LINKS);
    localStorage.removeItem(KEY_APPEARANCE);
    this.init();

    this.resetToDefaultCloud().catch(err => console.error(err));
    dbStorage.clear().catch(e => console.error('Failed to clear local assets:', e));
  },

  async resetToDefaultCloud() {
    if (!supabase) return;
    try {
      const userId = await getUserId();
      if (!userId) return;

      await Promise.all([
        supabase.from('categories').delete().eq('user_id', userId),
        supabase.from('appearance').delete().eq('user_id', userId)
      ]);

      await this.importDataCloud(DEFAULT_CATEGORIES, DEFAULT_LINKS, DEFAULT_APPEARANCE);
    } catch (e) {
      console.error(e);
    }
  },

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

  async getCurrentUserUploadPermission(): Promise<boolean> {
    if (!supabase) return true;
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
