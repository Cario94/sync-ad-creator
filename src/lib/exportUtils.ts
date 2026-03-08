import type { CanvasElement } from '@/components/workspace/types/canvas';
import {
  hydrateCampaignConfig,
  hydrateAdSetConfig,
  hydrateAdConfig,
} from '@/components/workspace/types/canvas';
import type { Connection } from '@/hooks/useConnections';

// ── Helpers ──

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function timestamp() {
  return new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
}

interface HierarchyNode {
  element: CanvasElement;
  children: HierarchyNode[];
}

function buildHierarchy(elements: CanvasElement[], connections: Connection[]): { roots: HierarchyNode[]; orphans: CanvasElement[] } {
  const childIds = new Set(connections.map(c => c.targetId));
  const childrenMap = new Map<string, string[]>();
  for (const c of connections) {
    const arr = childrenMap.get(c.sourceId) ?? [];
    arr.push(c.targetId);
    childrenMap.set(c.sourceId, arr);
  }
  const elMap = new Map(elements.map(e => [e.id, e]));

  function build(id: string): HierarchyNode | null {
    const el = elMap.get(id);
    if (!el) return null;
    const kids = (childrenMap.get(id) ?? []).map(build).filter(Boolean) as HierarchyNode[];
    return { element: el, children: kids };
  }

  const campaigns = elements.filter(e => e.type === 'campaign');
  const roots = campaigns.map(c => build(c.id)!).filter(Boolean);
  const inTree = new Set<string>();
  function walk(n: HierarchyNode) { inTree.add(n.element.id); n.children.forEach(walk); }
  roots.forEach(walk);
  const orphans = elements.filter(e => !inTree.has(e.id));

  return { roots, orphans };
}

// ── JSON Export ──

export function exportJSON(elements: CanvasElement[], connections: Connection[], projectName: string) {
  const data = {
    exportedAt: new Date().toISOString(),
    projectName,
    elements: elements.map(el => ({
      id: el.id,
      type: el.type,
      name: el.name,
      config: el.config,
    })),
    connections: connections.map(c => ({
      id: c.id,
      sourceId: c.sourceId,
      targetId: c.targetId,
    })),
  };
  downloadFile(JSON.stringify(data, null, 2), `${projectName}-${timestamp()}.json`, 'application/json');
}

// ── CSV Export ──

function escCsv(v: unknown): string {
  const s = String(v ?? '');
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportCSV(elements: CanvasElement[], connections: Connection[], projectName: string) {
  const parentMap = new Map<string, string>();
  for (const c of connections) parentMap.set(c.targetId, c.sourceId);
  const nameMap = new Map(elements.map(e => [e.id, e.name]));

  const headers = [
    'Type', 'Name', 'Parent',
    // Campaign fields
    'Objective', 'Status', 'Budget Type', 'Budget', 'Bid Strategy', 'Buying Type', 'Start Date', 'End Date',
    // Ad Set fields
    'Optimization Goal', 'Locations', 'Placements', 'Age Min', 'Age Max', 'Gender',
    // Ad fields
    'Headline', 'Primary Text', 'Description', 'CTA', 'Destination URL', 'Display URL', 'Media Asset',
    // Common
    'Notes',
  ];

  const rows = elements.map(el => {
    const parentId = parentMap.get(el.id);
    const parentName = parentId ? nameMap.get(parentId) ?? '' : '';

    if (el.type === 'campaign') {
      const c = hydrateCampaignConfig(el.config);
      return [
        'Campaign', el.name, parentName,
        c.objective, c.status, c.budgetType, c.budget, c.bidStrategy, c.buyingType, c.startDate ?? '', c.endDate ?? '',
        '', '', '', '', '', '',
        '', '', '', '', '', '', '',
        c.notes,
      ];
    }
    if (el.type === 'adset') {
      const c = hydrateAdSetConfig(el.config);
      return [
        'Ad Set', el.name, parentName,
        '', '', c.budgetType, c.budget, c.bidStrategy, '', c.startDate ?? '', c.endDate ?? '',
        c.optimizationGoal, c.locations.join('; '), c.placements.join('; '), c.ageMin, c.ageMax, c.gender,
        '', '', '', '', '', '', '',
        c.notes,
      ];
    }
    // ad
    const c = hydrateAdConfig(el.config);
    return [
      'Ad', el.name, parentName,
      '', '', '', '', '', '', '', '',
      '', '', '', '', '', '',
      c.headline, c.primaryText, c.description, c.callToAction.replace(/_/g, ' '), c.destinationUrl, c.displayUrl, c.mediaAssetId ? 'Yes' : 'No',
      c.notes,
    ];
  });

  const csv = [headers.map(escCsv).join(','), ...rows.map(r => r.map(escCsv).join(','))].join('\n');
  downloadFile(csv, `${projectName}-${timestamp()}.csv`, 'text/csv');
}

// ── Markdown Summary Export ──

export function exportMarkdown(elements: CanvasElement[], connections: Connection[], projectName: string) {
  const { roots, orphans } = buildHierarchy(elements, connections);
  const lines: string[] = [];

  lines.push(`# ${projectName}`);
  lines.push(`_Exported ${new Date().toLocaleString()}_`);
  lines.push('');

  // Stats
  const campaigns = elements.filter(e => e.type === 'campaign').length;
  const adSets = elements.filter(e => e.type === 'adset').length;
  const ads = elements.filter(e => e.type === 'ad').length;
  lines.push(`**Summary:** ${campaigns} Campaign(s), ${adSets} Ad Set(s), ${ads} Ad(s)`);
  lines.push('');

  function renderNode(node: HierarchyNode, depth: number) {
    const el = node.element;
    const indent = '  '.repeat(depth);
    const prefix = el.type === 'campaign' ? '📢' : el.type === 'adset' ? '👥' : '🖼️';
    const typeLabel = el.type === 'adset' ? 'Ad Set' : el.type.charAt(0).toUpperCase() + el.type.slice(1);

    lines.push(`${indent}${prefix} **${typeLabel}: ${el.name}**`);

    if (el.type === 'campaign') {
      const c = hydrateCampaignConfig(el.config);
      lines.push(`${indent}  - Objective: ${c.objective} | Status: ${c.status}`);
      lines.push(`${indent}  - Budget: $${c.budget} (${c.budgetType}) | Bid: ${c.bidStrategy}`);
      if (c.startDate || c.endDate) lines.push(`${indent}  - Dates: ${c.startDate ?? '—'} → ${c.endDate ?? '—'}`);
      if (c.notes) lines.push(`${indent}  - Notes: ${c.notes}`);
    } else if (el.type === 'adset') {
      const c = hydrateAdSetConfig(el.config);
      lines.push(`${indent}  - Budget: $${c.budget} (${c.budgetType}) | Optimize: ${c.optimizationGoal}`);
      lines.push(`${indent}  - Audience: ${c.gender}, ages ${c.ageMin}–${c.ageMax}`);
      lines.push(`${indent}  - Locations: ${c.locations.join(', ') || 'None'}`);
      if (c.startDate || c.endDate) lines.push(`${indent}  - Dates: ${c.startDate ?? '—'} → ${c.endDate ?? '—'}`);
      if (c.notes) lines.push(`${indent}  - Notes: ${c.notes}`);
    } else {
      const c = hydrateAdConfig(el.config);
      lines.push(`${indent}  - Headline: ${c.headline || '(empty)'}`);
      lines.push(`${indent}  - Primary Text: ${c.primaryText || '(empty)'}`);
      if (c.description) lines.push(`${indent}  - Description: ${c.description}`);
      lines.push(`${indent}  - CTA: ${c.callToAction.replace(/_/g, ' ')} → ${c.destinationUrl || '(no URL)'}`);
      lines.push(`${indent}  - Media: ${c.mediaAssetId ? 'Attached' : 'None'}`);
      if (c.notes) lines.push(`${indent}  - Notes: ${c.notes}`);
    }

    lines.push('');
    node.children.forEach(child => renderNode(child, depth + 1));
  }

  if (roots.length > 0) {
    lines.push('## Campaign Structure');
    lines.push('');
    roots.forEach(r => renderNode(r, 0));
  }

  if (orphans.length > 0) {
    lines.push('## Unconnected Nodes');
    lines.push('');
    orphans.forEach(el => {
      renderNode({ element: el, children: [] }, 0);
    });
  }

  downloadFile(lines.join('\n'), `${projectName}-${timestamp()}.md`, 'text/markdown');
}

// ── Clipboard (structured text for pasting) ──

export function copyToClipboard(elements: CanvasElement[], connections: Connection[], projectName: string) {
  const { roots, orphans } = buildHierarchy(elements, connections);
  const lines: string[] = [];

  lines.push(`${projectName} — Campaign Plan`);
  lines.push('='.repeat(40));
  lines.push('');

  function renderFlat(node: HierarchyNode, depth: number) {
    const el = node.element;
    const indent = '  '.repeat(depth);
    const typeLabel = el.type === 'adset' ? 'Ad Set' : el.type.charAt(0).toUpperCase() + el.type.slice(1);
    lines.push(`${indent}[${typeLabel}] ${el.name}`);

    if (el.type === 'campaign') {
      const c = hydrateCampaignConfig(el.config);
      lines.push(`${indent}  Objective: ${c.objective} | Budget: $${c.budget} ${c.budgetType}`);
    } else if (el.type === 'adset') {
      const c = hydrateAdSetConfig(el.config);
      lines.push(`${indent}  Budget: $${c.budget} ${c.budgetType} | ${c.locations.join(', ')}`);
    } else {
      const c = hydrateAdConfig(el.config);
      lines.push(`${indent}  "${c.headline}" → ${c.destinationUrl || '(no URL)'}`);
    }

    node.children.forEach(child => renderFlat(child, depth + 1));
  }

  roots.forEach(r => renderFlat(r, 0));
  if (orphans.length > 0) {
    lines.push('');
    lines.push('Unconnected:');
    orphans.forEach(el => renderFlat({ element: el, children: [] }, 1));
  }

  return navigator.clipboard.writeText(lines.join('\n'));
}
