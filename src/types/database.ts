import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

// ── Row types (from DB) ──
export type Profile = Tables<'profiles'>;
export type Project = Tables<'projects'>;
export type ProjectDocument = Tables<'project_documents'>;
export type MediaAsset = Tables<'media_assets'>;
export type UserSettings = Tables<'user_settings'>;
export type ActivityLog = Tables<'activity_logs'>;

// ── Insert types ──
export type ProjectInsert = TablesInsert<'projects'>;
export type MediaAssetInsert = TablesInsert<'media_assets'>;
export type ActivityLogInsert = TablesInsert<'activity_logs'>;

// ── Canvas JSONB shape (mirrors CanvasElement from workspace types) ──
export interface CanvasNode {
  id: string;
  type: 'campaign' | 'adset' | 'ad';
  name: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
}

export interface CanvasEdge {
  id: string;
  sourceId: string;
  targetId: string;
  sourceType?: 'campaign' | 'adset' | 'ad';
  targetType?: 'campaign' | 'adset' | 'ad';
}

export interface CanvasState {
  viewport: { x: number; y: number; zoom: number };
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export const BLANK_CANVAS_STATE: CanvasState = {
  viewport: { x: 0, y: 0, zoom: 1 },
  nodes: [],
  edges: [],
};

// ── User preferences JSONB shape ──
export interface UserPreferences {
  theme?: 'light' | 'dark';
  timezone?: string;
  defaultWorkspaceView?: 'canvas' | 'list' | 'grid';
  autoSave?: boolean;
  keyboardShortcuts?: boolean;
  notifications?: {
    emailReports?: boolean;
    statusChanges?: boolean;
    push?: boolean;
  };
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  defaultWorkspaceView: 'canvas',
  autoSave: true,
  keyboardShortcuts: true,
  notifications: { emailReports: true, statusChanges: false, push: true },
};
