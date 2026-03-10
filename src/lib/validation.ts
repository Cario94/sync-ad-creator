import type { CanvasElement } from '@/components/workspace/types/canvas';
import {
  hydrateCampaignConfig,
  hydrateAdSetConfig,
  hydrateAdConfig,
  type CampaignConfig,
  type AdSetConfig,
  type AdConfig,
} from '@/components/workspace/types/canvas';
import type { WorkspaceConnection as Connection } from '@/types/workspaceGraph';

// ── Types ──

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: ValidationSeverity;
  field?: string;
  message: string;
}

export interface NodeValidationResult {
  elementId: string;
  elementName: string;
  elementType: CanvasElement['type'];
  issues: ValidationIssue[];
}

export type ProjectReadiness = 'empty' | 'incomplete' | 'has_warnings' | 'ready';

export interface ProjectValidationResult {
  readiness: ProjectReadiness;
  nodeResults: NodeValidationResult[];
  projectIssues: ValidationIssue[];
  stats: { errors: number; warnings: number; ready: number; total: number };
}

// ── Helpers ──

const isValidUrl = (url: string): boolean => {
  if (!url || url === 'https://' || url === 'http://') return false;
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

const isDateValid = (d?: string): boolean => {
  if (!d) return false;
  return !isNaN(Date.parse(d));
};

// ── Node validators ──

function validateCampaign(el: CanvasElement, connections: Connection[], allElements: CanvasElement[]): ValidationIssue[] {
  const cfg = hydrateCampaignConfig(el.config);
  const issues: ValidationIssue[] = [];

  if (!el.name.trim()) issues.push({ severity: 'error', field: 'name', message: 'Campaign name is required.' });
  if (cfg.budget <= 0) issues.push({ severity: 'error', field: 'budget', message: 'Budget must be greater than zero.' });

  // Date validation
  if (cfg.startDate && cfg.endDate) {
    if (isDateValid(cfg.startDate) && isDateValid(cfg.endDate) && new Date(cfg.endDate) <= new Date(cfg.startDate)) {
      issues.push({ severity: 'error', field: 'endDate', message: 'End date must be after start date.' });
    }
  }
  if (cfg.budgetType === 'lifetime' && !cfg.endDate) {
    issues.push({ severity: 'warning', field: 'endDate', message: 'Lifetime budget campaigns should have an end date.' });
  }

  // Hierarchy: campaign should have at least one ad set connected
  const childAdSets = connections.filter(c => c.sourceId === el.id).map(c => allElements.find(e => e.id === c.targetId)).filter(e => e?.type === 'adset');
  if (childAdSets.length === 0) {
    issues.push({ severity: 'warning', message: 'Campaign has no Ad Sets connected. Add at least one Ad Set.' });
  }

  return issues;
}

function validateAdSet(el: CanvasElement, connections: Connection[], allElements: CanvasElement[]): ValidationIssue[] {
  const cfg = hydrateAdSetConfig(el.config);
  const issues: ValidationIssue[] = [];

  if (!el.name.trim()) issues.push({ severity: 'error', field: 'name', message: 'Ad Set name is required.' });
  if (cfg.budget <= 0) issues.push({ severity: 'error', field: 'budget', message: 'Budget must be greater than zero.' });

  // Age range
  if (cfg.ageMin < 13) issues.push({ severity: 'error', field: 'ageMin', message: 'Minimum age must be at least 13.' });
  if (cfg.ageMax > 65) issues.push({ severity: 'warning', field: 'ageMax', message: 'Maximum age exceeds 65. This targets the broadest older demographic.' });
  if (cfg.ageMin >= cfg.ageMax) issues.push({ severity: 'error', field: 'ageRange', message: 'Minimum age must be less than maximum age.' });

  // Dates
  if (cfg.startDate && cfg.endDate) {
    if (isDateValid(cfg.startDate) && isDateValid(cfg.endDate) && new Date(cfg.endDate) <= new Date(cfg.startDate)) {
      issues.push({ severity: 'error', field: 'endDate', message: 'End date must be after start date.' });
    }
  }

  // Date consistency with parent campaign
  const parentConn = connections.find(c => c.targetId === el.id);
  if (parentConn) {
    const parent = allElements.find(e => e.id === parentConn.sourceId);
    if (parent && parent.type === 'campaign') {
      const parentCfg = hydrateCampaignConfig(parent.config);
      if (parentCfg.startDate && cfg.startDate && isDateValid(parentCfg.startDate) && isDateValid(cfg.startDate)) {
        if (new Date(cfg.startDate) < new Date(parentCfg.startDate)) {
          issues.push({ severity: 'warning', field: 'startDate', message: `Ad Set starts before parent campaign (${parentCfg.startDate}).` });
        }
      }
      if (parentCfg.endDate && cfg.endDate && isDateValid(parentCfg.endDate) && isDateValid(cfg.endDate)) {
        if (new Date(cfg.endDate) > new Date(parentCfg.endDate)) {
          issues.push({ severity: 'warning', field: 'endDate', message: `Ad Set ends after parent campaign (${parentCfg.endDate}).` });
        }
      }
    }
  }

  // Locations / placements
  if (cfg.locations.length === 0) issues.push({ severity: 'warning', field: 'locations', message: 'No target locations specified.' });
  if (cfg.placements.length === 0) issues.push({ severity: 'warning', field: 'placements', message: 'No placements selected. Automatic placements will be used.' });

  // Hierarchy: should have parent campaign
  const hasParent = connections.some(c => c.targetId === el.id);
  if (!hasParent) issues.push({ severity: 'warning', message: 'Ad Set is not connected to a Campaign.' });

  // Should have child ads
  const childAds = connections.filter(c => c.sourceId === el.id).map(c => allElements.find(e => e.id === c.targetId)).filter(e => e?.type === 'ad');
  if (childAds.length === 0) issues.push({ severity: 'warning', message: 'Ad Set has no Ads connected. Add at least one Ad.' });

  return issues;
}

function validateAd(el: CanvasElement, connections: Connection[], allElements: CanvasElement[]): ValidationIssue[] {
  const cfg = hydrateAdConfig(el.config);
  const issues: ValidationIssue[] = [];

  if (!el.name.trim()) issues.push({ severity: 'error', field: 'name', message: 'Ad name is required.' });
  if (!cfg.headline.trim()) issues.push({ severity: 'error', field: 'headline', message: 'Headline is required.' });
  if (!cfg.primaryText.trim()) issues.push({ severity: 'error', field: 'primaryText', message: 'Primary text is required.' });

  // URL validation
  if (!isValidUrl(cfg.destinationUrl)) {
    issues.push({ severity: 'error', field: 'destinationUrl', message: 'A valid destination URL is required.' });
  }
  if (cfg.displayUrl && !isValidUrl(cfg.displayUrl) && cfg.displayUrl.trim() !== '') {
    issues.push({ severity: 'warning', field: 'displayUrl', message: 'Display URL does not appear to be valid.' });
  }

  // Media
  if (!cfg.mediaAssetId && !cfg.imageUrl) {
    issues.push({ severity: 'warning', field: 'media', message: 'No media attached. Ads perform better with images or video.' });
  }

  // Tracking
  if (cfg.trackingPixel && !isValidUrl(cfg.trackingPixel)) {
    issues.push({ severity: 'warning', field: 'trackingPixel', message: 'Tracking pixel URL does not appear valid.' });
  }

  // Hierarchy
  const hasParent = connections.some(c => c.targetId === el.id);
  if (!hasParent) issues.push({ severity: 'warning', message: 'Ad is not connected to an Ad Set.' });

  // Text length warnings
  if (cfg.headline.length > 40) issues.push({ severity: 'warning', field: 'headline', message: 'Headline exceeds 40 characters and may be truncated.' });
  if (cfg.primaryText.length > 125) issues.push({ severity: 'warning', field: 'primaryText', message: 'Primary text exceeds 125 characters and may be truncated.' });
  if (cfg.description.length > 30) issues.push({ severity: 'warning', field: 'description', message: 'Description exceeds 30 characters and may be truncated.' });

  return issues;
}

// ── Main validator ──

export function validateNode(el: CanvasElement, connections: Connection[], allElements: CanvasElement[]): NodeValidationResult {
  let issues: ValidationIssue[];
  switch (el.type) {
    case 'campaign': issues = validateCampaign(el, connections, allElements); break;
    case 'adset':    issues = validateAdSet(el, connections, allElements); break;
    case 'ad':       issues = validateAd(el, connections, allElements); break;
    default:         issues = [];
  }
  return { elementId: el.id, elementName: el.name, elementType: el.type, issues };
}

export function validateProject(elements: CanvasElement[], connections: Connection[]): ProjectValidationResult {
  if (elements.length === 0) {
    return {
      readiness: 'empty',
      nodeResults: [],
      projectIssues: [{ severity: 'warning', message: 'Project has no nodes. Add a Campaign to get started.' }],
      stats: { errors: 0, warnings: 0, ready: 0, total: 0 },
    };
  }

  const nodeResults = elements.map(el => validateNode(el, connections, elements));

  // Project-level structural issues
  const projectIssues: ValidationIssue[] = [];
  const campaigns = elements.filter(e => e.type === 'campaign');
  const adSets = elements.filter(e => e.type === 'adset');
  const ads = elements.filter(e => e.type === 'ad');

  if (campaigns.length === 0) projectIssues.push({ severity: 'error', message: 'Project has no Campaigns.' });
  if (adSets.length === 0 && campaigns.length > 0) projectIssues.push({ severity: 'warning', message: 'Project has Campaigns but no Ad Sets.' });
  if (ads.length === 0 && adSets.length > 0) projectIssues.push({ severity: 'warning', message: 'Project has Ad Sets but no Ads.' });

  // Orphan detection
  const orphanAdSets = adSets.filter(as => !connections.some(c => c.targetId === as.id));
  if (orphanAdSets.length > 0) projectIssues.push({ severity: 'warning', message: `${orphanAdSets.length} Ad Set(s) not connected to any Campaign.` });
  const orphanAds = ads.filter(a => !connections.some(c => c.targetId === a.id));
  if (orphanAds.length > 0) projectIssues.push({ severity: 'warning', message: `${orphanAds.length} Ad(s) not connected to any Ad Set.` });

  let totalErrors = projectIssues.filter(i => i.severity === 'error').length;
  let totalWarnings = projectIssues.filter(i => i.severity === 'warning').length;
  let readyCount = 0;

  for (const nr of nodeResults) {
    const e = nr.issues.filter(i => i.severity === 'error').length;
    const w = nr.issues.filter(i => i.severity === 'warning').length;
    totalErrors += e;
    totalWarnings += w;
    if (e === 0 && w === 0) readyCount++;
  }

  let readiness: ProjectReadiness;
  if (totalErrors > 0) readiness = 'incomplete';
  else if (totalWarnings > 0) readiness = 'has_warnings';
  else readiness = 'ready';

  return {
    readiness,
    nodeResults,
    projectIssues,
    stats: { errors: totalErrors, warnings: totalWarnings, ready: readyCount, total: elements.length },
  };
}

/** Get issue count for a single node (for badge display) */
export function getNodeIssueCounts(elementId: string, result: ProjectValidationResult): { errors: number; warnings: number } {
  const nr = result.nodeResults.find(r => r.elementId === elementId);
  if (!nr) return { errors: 0, warnings: 0 };
  return {
    errors: nr.issues.filter(i => i.severity === 'error').length,
    warnings: nr.issues.filter(i => i.severity === 'warning').length,
  };
}
