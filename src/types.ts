export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
}

export interface MenuCategory {
  id: string;
  title: string;
  items: MenuItem[];
}

export interface WordPressConfig {
  siteUrl: string;
  username: string;
  applicationPassword: string;
  targetPageId?: string;
  syncMode?: 'full' | 'comments' | 'id' | 'class' | 'placeholder';
  customSelector?: string;
}

export type AppState = 'dashboard' | 'upload' | 'processing' | 'editor' | 'preview' | 'history' | 'account' | 'wordpressSyncReview' | 'wordpressSettings' | 'manualTest';

export interface MenuData {
  categories: MenuCategory[];
  categoryPrices: Record<string, string>;
  wordpressConfig: WordPressConfig;
}
