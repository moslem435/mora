export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
}

export interface Link {
  id: string;
  categoryId: string;
  title: string;
  url: string;
  description: string;
  icon: string;
  clicks: number;
  order: number;
}

export interface AppearanceConfig {
  bgStyle: 'morandi-glow' | 'solid-cream' | 'dark-slate' | 'custom-url' | 'custom-file';
  customBgUrl: string;
  cardOpacity: number;
  cardBlur: number;
  primaryColor: string;
  fontStyle: 'morandi-sans' | 'system-sans' | 'inter' | 'outfit' | 'geist' | 'custom-link' | 'custom-file' | 'lxgw-wenkai' | 'geist-sans' | 'cormorant-serif';
  fontCustomLink?: string;
  fontFamilyName?: string;
}
