import type { CanvasElement } from '@/components/workspace/types/canvas';
import type { WorkspaceConnection } from '@/types/workspaceGraph';

interface XY {
  x: number;
  y: number;
}

const NODE_HEIGHT: Record<CanvasElement['type'], number> = {
  campaign: 140,
  adset: 130,
  ad: 120,
};

const COL_X: Record<CanvasElement['type'], number> = {
  campaign: 100,
  adset: 440,
  ad: 780,
};

const ROW_GAP = 40;
const ADSET_GAP = 55;
const GROUP_GAP = 90;
const START_Y = 100;

const sortElements = (elements: CanvasElement[]) =>
  [...elements].sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

const appendSorted = (map: Map<string, string[]>, key: string, value: string) => {
  const existing = map.get(key) ?? [];
  existing.push(value);
  map.set(key, existing);
};

const uniqueSorted = (ids: string[]) => [...new Set(ids)].sort();

/**
 * Hierarchy-aware tidy layout for Campaign -> Ad Set -> Ad.
 * - Campaign groups are laid out top-to-bottom.
 * - Ad Sets and Ads are vertically grouped under their real parents.
 * - Orphan Ad Sets (no campaign) and orphan Ads (no ad set) are placed in separate deterministic lanes.
 */
export const buildHierarchyLayout = (
  elements: CanvasElement[],
  connections: WorkspaceConnection[],
): Map<string, XY> => {
  const pos = new Map<string, XY>();
  const byId = new Map(elements.map(el => [el.id, el]));

  const campaigns = sortElements(elements.filter(el => el.type === 'campaign'));
  const adSets = sortElements(elements.filter(el => el.type === 'adset'));
  const ads = sortElements(elements.filter(el => el.type === 'ad'));

  const adSetsByCampaign = new Map<string, string[]>();
  const adsByAdSet = new Map<string, string[]>();

  for (const conn of connections) {
    const source = byId.get(conn.sourceId);
    const target = byId.get(conn.targetId);
    if (!source || !target) continue;

    if (source.type === 'campaign' && target.type === 'adset') {
      appendSorted(adSetsByCampaign, source.id, target.id);
    }

    if (source.type === 'adset' && target.type === 'ad') {
      appendSorted(adsByAdSet, source.id, target.id);
    }
  }

  for (const [k, ids] of adSetsByCampaign) adSetsByCampaign.set(k, uniqueSorted(ids));
  for (const [k, ids] of adsByAdSet) adsByAdSet.set(k, uniqueSorted(ids));

  let cursorY = START_Y;
  const placed = new Set<string>();

  const layoutAdSetSubtree = (adSetId: string, startY: number): number => {
    const adSet = byId.get(adSetId);
    if (!adSet || adSet.type !== 'adset') return 0;

    const adIds = (adsByAdSet.get(adSetId) ?? []).filter(id => byId.get(id)?.type === 'ad' && !placed.has(id));
    if (adIds.length === 0) {
      pos.set(adSet.id, { x: COL_X.adset, y: startY });
      placed.add(adSet.id);
      return NODE_HEIGHT.adset;
    }

    let adCursor = startY;
    for (const adId of adIds) {
      pos.set(adId, { x: COL_X.ad, y: adCursor });
      placed.add(adId);
      adCursor += NODE_HEIGHT.ad + ROW_GAP;
    }

    const adsSpan = adCursor - startY - ROW_GAP;
    const adSetY = startY + Math.max(0, adsSpan - NODE_HEIGHT.adset) / 2;
    pos.set(adSet.id, { x: COL_X.adset, y: adSetY });
    placed.add(adSet.id);

    return Math.max(NODE_HEIGHT.adset, adsSpan);
  };

  for (const campaign of campaigns) {
    const childAdSetIds = (adSetsByCampaign.get(campaign.id) ?? [])
      .filter(id => byId.get(id)?.type === 'adset' && !placed.has(id));

    if (childAdSetIds.length === 0) {
      pos.set(campaign.id, { x: COL_X.campaign, y: cursorY });
      placed.add(campaign.id);
      cursorY += NODE_HEIGHT.campaign + GROUP_GAP;
      continue;
    }

    let adSetCursor = cursorY;
    for (const adSetId of childAdSetIds) {
      const used = layoutAdSetSubtree(adSetId, adSetCursor);
      adSetCursor += used + ADSET_GAP;
    }

    const groupSpan = adSetCursor - cursorY - ADSET_GAP;
    const campaignY = cursorY + Math.max(0, groupSpan - NODE_HEIGHT.campaign) / 2;
    pos.set(campaign.id, { x: COL_X.campaign, y: campaignY });
    placed.add(campaign.id);

    cursorY += Math.max(NODE_HEIGHT.campaign, groupSpan) + GROUP_GAP;
  }

  // Orphan Ad Sets (with or without Ads)
  for (const adSet of adSets) {
    if (placed.has(adSet.id)) continue;
    const used = layoutAdSetSubtree(adSet.id, cursorY);
    cursorY += (used || NODE_HEIGHT.adset) + GROUP_GAP;
  }

  // Orphan Ads
  for (const ad of ads) {
    if (placed.has(ad.id)) continue;
    pos.set(ad.id, { x: COL_X.ad, y: cursorY });
    placed.add(ad.id);
    cursorY += NODE_HEIGHT.ad + ROW_GAP;
  }

  // Any leftovers (defensive, deterministic)
  for (const el of sortElements(elements)) {
    if (placed.has(el.id)) continue;
    pos.set(el.id, { x: COL_X[el.type], y: cursorY });
    placed.add(el.id);
    cursorY += NODE_HEIGHT[el.type] + ROW_GAP;
  }

  return pos;
};
