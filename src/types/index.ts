export interface ToolRecommendation {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  relevance_score: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  tool_count?: number;
}

export interface Tool {
  id: number;
  name: string;
  slug: string;
  description: string;
  category_id: number;
  category?: Category;
  icon?: string;
  thumbnail_url?: string;
  external_url?: string;
  embed_url?: string;
  is_vip_only: boolean;
  is_featured: boolean;
  is_new: boolean;
  view_count: number;
  use_count: number;
  rating_avg: number;
  tags?: { id: number; name: string; slug: string }[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  tools?: ToolRecommendation[];
}

export interface User {
  id: number;
  email: string;
  username: string;
  role: 'free' | 'vip' | 'admin';
  avatar_url?: string;
  vip_expires_at?: string;
  created_at: string;
}
