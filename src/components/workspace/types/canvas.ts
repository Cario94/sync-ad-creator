// ── Structured config models for each node type ──

export type CampaignObjective = 'awareness' | 'traffic' | 'engagement' | 'leads' | 'app_promotion' | 'sales';
export type BudgetType = 'daily' | 'lifetime';
export type BidStrategy = 'lowest_cost' | 'cost_cap' | 'bid_cap';
export type BuyingType = 'auction' | 'reach_frequency';
export type NodeStatus = 'draft' | 'active' | 'paused' | 'archived';
export type OptimizationGoal = 'clicks' | 'impressions' | 'reach' | 'conversions' | 'video_views';
export type Gender = 'all' | 'male' | 'female';
export type CallToAction = 'learn_more' | 'shop_now' | 'sign_up' | 'book_now' | 'contact_us' | 'download' | 'apply_now' | 'get_offer';

export interface CampaignConfig {
  objective: CampaignObjective;
  status: NodeStatus;
  budgetType: BudgetType;
  budget: number;
  bidStrategy: BidStrategy;
  buyingType: BuyingType;
  specialAdCategory: boolean;
  startDate?: string;   // "YYYY-MM-DD"
  endDate?: string;     // "YYYY-MM-DD"
  notes: string;
  // Legacy fields kept for backward compat
  budgetOptimization?: boolean;
  adStrategyType?: string;
  placementStrategy?: boolean;
  campaignSpendingLimit?: number;
  abTesting?: boolean;
}

export interface AdSetConfig {
  budgetType: BudgetType;
  budget: number;
  optimizationGoal: OptimizationGoal;
  bidStrategy: BidStrategy;
  placements: string[];
  locations: string[];
  ageMin: number;
  ageMax: number;
  gender: Gender;
  startDate?: string;   // "YYYY-MM-DD"
  endDate?: string;     // "YYYY-MM-DD"
  notes: string;
  // Optional parent hint (also tracked by edges)
  campaignId?: string;
}

export interface AdConfig {
  primaryText: string;
  headline: string;
  description: string;
  callToAction: CallToAction;
  destinationUrl: string;
  displayUrl: string;
  mediaAssetId: string;
  imageUrl: string;       // resolved URL for display
  trackingPixel: string;
  notes: string;
  // Optional parent hint
  adSetId?: string;
}

// ── Default factories ──

export const defaultCampaignConfig = (): CampaignConfig => ({
  objective: 'awareness',
  status: 'draft',
  budgetType: 'daily',
  budget: 50,
  bidStrategy: 'lowest_cost',
  buyingType: 'auction',
  specialAdCategory: false,
  notes: '',
});

export const defaultAdSetConfig = (): AdSetConfig => ({
  budgetType: 'daily',
  budget: 20,
  optimizationGoal: 'clicks',
  bidStrategy: 'lowest_cost',
  placements: [],
  locations: ['United States'],
  ageMin: 18,
  ageMax: 65,
  gender: 'all',
  notes: '',
});

export const defaultAdConfig = (): AdConfig => ({
  primaryText: '',
  headline: '',
  description: '',
  callToAction: 'learn_more',
  destinationUrl: 'https://',
  displayUrl: '',
  mediaAssetId: '',
  imageUrl: '',
  trackingPixel: '',
  notes: '',
});

// ── Hydration helpers: merge stored (possibly old/partial) config with defaults ──

export function hydrateCampaignConfig(raw: Record<string, unknown> = {}): CampaignConfig {
  const d = defaultCampaignConfig();
  return {
    objective: (raw.objective as CampaignObjective) ?? d.objective,
    status: (raw.status as NodeStatus) ?? d.status,
    budgetType: (raw.budgetType as BudgetType) ?? d.budgetType,
    budget: typeof raw.budget === 'number' ? raw.budget : d.budget,
    bidStrategy: (raw.bidStrategy as BidStrategy) ?? d.bidStrategy,
    buyingType: (raw.buyingType as BuyingType) ?? d.buyingType,
    specialAdCategory: typeof raw.specialAdCategory === 'boolean' ? raw.specialAdCategory : d.specialAdCategory,
    startDate: typeof raw.startDate === 'string' ? raw.startDate : d.startDate,
    endDate: typeof raw.endDate === 'string' ? raw.endDate : d.endDate,
    notes: typeof raw.notes === 'string' ? raw.notes : d.notes,
    // Preserve legacy
    budgetOptimization: raw.budgetOptimization as boolean | undefined,
    adStrategyType: raw.adStrategyType as string | undefined,
    placementStrategy: raw.placementStrategy as boolean | undefined,
    campaignSpendingLimit: raw.campaignSpendingLimit as number | undefined,
    abTesting: raw.abTesting as boolean | undefined,
  };
}

export function hydrateAdSetConfig(raw: Record<string, unknown> = {}): AdSetConfig {
  const d = defaultAdSetConfig();
  return {
    budgetType: (raw.budgetType as BudgetType) ?? d.budgetType,
    budget: typeof raw.budget === 'number' ? raw.budget : d.budget,
    optimizationGoal: (raw.optimizationGoal as OptimizationGoal) ?? d.optimizationGoal,
    bidStrategy: (raw.bidStrategy as BidStrategy) ?? d.bidStrategy,
    placements: Array.isArray(raw.placements) ? raw.placements : d.placements,
    locations: Array.isArray(raw.locations) ? raw.locations : d.locations,
    ageMin: typeof raw.ageMin === 'number' ? raw.ageMin : d.ageMin,
    ageMax: typeof raw.ageMax === 'number' ? raw.ageMax : d.ageMax,
    gender: (raw.gender as Gender) ?? d.gender,
    startDate: typeof raw.startDate === 'string' ? raw.startDate : d.startDate,
    endDate: typeof raw.endDate === 'string' ? raw.endDate : d.endDate,
    notes: typeof raw.notes === 'string' ? raw.notes : d.notes,
    campaignId: raw.campaignId as string | undefined,
  };
}

export function hydrateAdConfig(raw: Record<string, unknown> = {}): AdConfig {
  const d = defaultAdConfig();
  return {
    primaryText: typeof raw.primaryText === 'string' ? raw.primaryText : d.primaryText,
    headline: typeof raw.headline === 'string' ? raw.headline : d.headline,
    description: typeof raw.description === 'string' ? raw.description : d.description,
    callToAction: (raw.callToAction as CallToAction) ?? d.callToAction,
    destinationUrl: typeof raw.destinationUrl === 'string' ? raw.destinationUrl : d.destinationUrl,
    displayUrl: typeof raw.displayUrl === 'string' ? raw.displayUrl : d.displayUrl,
    mediaAssetId: typeof raw.mediaAssetId === 'string' ? raw.mediaAssetId : d.mediaAssetId,
    imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : d.imageUrl,
    trackingPixel: typeof raw.trackingPixel === 'string' ? raw.trackingPixel : d.trackingPixel,
    notes: typeof raw.notes === 'string' ? raw.notes : d.notes,
    adSetId: raw.adSetId as string | undefined,
  };
}

// ── Canvas element (unchanged shape, config now typed at usage sites) ──

export interface CanvasElement {
  id: string;
  type: 'campaign' | 'adset' | 'ad';
  name: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
}

export interface ElementPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
