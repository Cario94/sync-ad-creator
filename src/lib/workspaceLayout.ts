import type { CanvasElement } from '@/components/workspace/types/canvas';
import type { WorkspaceConnection } from '@/types/workspaceGraph';

interface XY {
  x: number;
  y: number;
}

interface LaneMetrics {
  nodeHeight: number;
  rowGap: number;
}

const LANE_METRICS: Record<CanvasElement['type'], LaneMetrics> = {
  campaign: { nodeHeight: 138, rowGap: 44 },
  adset: { nodeHeight: 132, rowGap: 36 },
  ad: { nodeHeight: 124, rowGap: 30 },
};

const COL_X: Record<CanvasElement['type'], number> = {
  campaign: 100,
  adset: 450,
  ad: 800,
};

const START_Y = 100;
const GROUP_BASE_GAP = 96;
const GROUP_DENSITY_GAP = 22;
const SUBTREE_GAP = 48;

const sortElements = (elements: CanvasElement[]) =>
  [...elements].sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

const pushMap = (map: Map<string, string[]>, key: string, value: string) => {
  const next = map.get(key) ?? [];
  next.push(value);
  map.set(key, next);
};

const uniqueSorted = (ids: string[]) => [...new Set(ids)].sort();

const nodeSpan = (type: CanvasElement['type']) => LANE_METRICS[type].nodeHeight;

/**
 * Hierarchy-aware tidy layout for Campaign -> Ad Set -> Ad.
 *
 * Improvements over rigid column stacking:
 * - Uses subtree spans to vertically center parents over children.
 * - Uses per-lane spacing/height metrics (not one global gap assumption).
 * - Chooses deterministic preferred parents when nodes are partially connected to multiple parents.
 * - Handles campaign groups, orphan ad sets, orphan ads in distinct deterministic blocks.
 */
export const buildHierarchyLayout = (
  elements: CanvasElement[],
  connections: WorkspaceConnection[],
): Map<string, XY> => {
  const positions = new Map<string, XY>();
  const byId = new Map(elements.map(el => [el.id, el]));

  const campaigns = sortElements(elements.filter(el => el.type === 'campaign'));
  const adSets = sortElements(elements.filter(el => el.type === 'adset'));
  const ads = sortElements(elements.filter(el => el.type === 'ad'));

  const campaignParentByAdSet = new Map<string, string[]>();
  const adSetParentByAd = new Map<string, string[]>();

  for (const conn of connections) {
    const source = byId.get(conn.sourceId);
    const target = byId.get(conn.targetId);
    if (!source || !target) continue;

    if (source.type === 'campaign' && target.type === 'adset') {
      pushMap(campaignParentByAdSet, target.id, source.id);
    } else if (source.type === 'adset' && target.type === 'ad') {
      pushMap(adSetParentByAd, target.id, source.id);
    }
  }

  for (const [key, value] of campaignParentByAdSet) campaignParentByAdSet.set(key, uniqueSorted(value));
  for (const [key, value] of adSetParentByAd) adSetParentByAd.set(key, uniqueSorted(value));

  // Deterministic parent selection when there are multiple incoming parents.
  const preferredCampaignByAdSet = new Map<string, string>();
  for (const adSet of adSets) {
    const candidates = campaignParentByAdSet.get(adSet.id) ?? [];
    if (candidates.length > 0) preferredCampaignByAdSet.set(adSet.id, candidates[0]);
  }

  const preferredAdSetByAd = new Map<string, string>();
  for (const ad of ads) {
    const candidates = adSetParentByAd.get(ad.id) ?? [];
    if (candidates.length > 0) preferredAdSetByAd.set(ad.id, candidates[0]);
  }

  const adSetsByCampaign = new Map<string, string[]>();
  for (const adSet of adSets) {
    const campaignId = preferredCampaignByAdSet.get(adSet.id);
    if (!campaignId) continue;
    pushMap(adSetsByCampaign, campaignId, adSet.id);
  }

  const adsByAdSet = new Map<string, string[]>();
  for (const ad of ads) {
    const adSetId = preferredAdSetByAd.get(ad.id);
    if (!adSetId) continue;
    pushMap(adsByAdSet, adSetId, ad.id);
  }

  for (const [key, value] of adSetsByCampaign) adSetsByCampaign.set(key, uniqueSorted(value));
  for (const [key, value] of adsByAdSet) adsByAdSet.set(key, uniqueSorted(value));

  const placed = new Set<string>();
  let cursorY = START_Y;

  const placeAdSubtree = (adSetId: string, startY: number): number => {
    const adSet = byId.get(adSetId);
    if (!adSet || adSet.type !== 'adset') return 0;

    const adIds = (adsByAdSet.get(adSetId) ?? []).filter(id => byId.get(id)?.type === 'ad' && !placed.has(id));

    if (adIds.length === 0) {
      positions.set(adSet.id, { x: COL_X.adset, y: startY });
      placed.add(adSet.id);
      return nodeSpan('adset');
    }

    let adCursorY = startY;
    for (const adId of adIds) {
      positions.set(adId, { x: COL_X.ad, y: adCursorY });
      placed.add(adId);
      adCursorY += nodeSpan('ad') + LANE_METRICS.ad.rowGap;
    }

    const adsSpan = adCursorY - startY - LANE_METRICS.ad.rowGap;
    const adSetY = startY + Math.max(0, (adsSpan - nodeSpan('adset')) / 2);
    positions.set(adSet.id, { x: COL_X.adset, y: adSetY });
    placed.add(adSet.id);

    return Math.max(nodeSpan('adset'), adsSpan);
  };

  for (const campaign of campaigns) {
    const childAdSetIds = (adSetsByCampaign.get(campaign.id) ?? [])
      .filter(id => byId.get(id)?.type === 'adset' && !placed.has(id));

    if (childAdSetIds.length === 0) {
      positions.set(campaign.id, { x: COL_X.campaign, y: cursorY });
      placed.add(campaign.id);
      cursorY += nodeSpan('campaign') + GROUP_BASE_GAP;
      continue;
    }

    let adSetCursorY = cursorY;
    for (const adSetId of childAdSetIds) {
      const subtreeSpan = placeAdSubtree(adSetId, adSetCursorY);
      adSetCursorY += subtreeSpan + SUBTREE_GAP;
    }

    const groupSpan = adSetCursorY - cursorY - SUBTREE_GAP;
    const campaignY = cursorY + Math.max(0, (groupSpan - nodeSpan('campaign')) / 2);
    positions.set(campaign.id, { x: COL_X.campaign, y: campaignY });
    placed.add(campaign.id);

    const densityGap = GROUP_DENSITY_GAP * Math.min(3, childAdSetIds.length - 1);
    cursorY += Math.max(nodeSpan('campaign'), groupSpan) + GROUP_BASE_GAP + densityGap;
  }

  // Orphan Ad Set block
  const orphanAdSets = adSets.filter(adSet => !placed.has(adSet.id));
  for (const adSet of orphanAdSets) {
    const span = placeAdSubtree(adSet.id, cursorY);
    cursorY += Math.max(nodeSpan('adset'), span) + GROUP_BASE_GAP;
  }

  // Orphan Ads block
  const orphanAds = ads.filter(ad => !placed.has(ad.id));
  for (const ad of orphanAds) {
    positions.set(ad.id, { x: COL_X.ad, y: cursorY });
    placed.add(ad.id);
    cursorY += nodeSpan('ad') + LANE_METRICS.ad.rowGap;
  }

  // Defensive deterministic fallback for any remaining elements.
  for (const el of sortElements(elements)) {
    if (placed.has(el.id)) continue;
    positions.set(el.id, { x: COL_X[el.type], y: cursorY });
    placed.add(el.id);
    cursorY += nodeSpan(el.type) + LANE_METRICS[el.type].rowGap;
  }

  return positions;
};
