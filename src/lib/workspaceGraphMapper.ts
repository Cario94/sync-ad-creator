import type { Edge, Node } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import type { CanvasElement } from '@/components/workspace/types/canvas';
import type { CanvasState } from '@/types/database';
import type { WorkspaceConnection, WorkspaceNodeType } from '@/types/workspaceGraph';

export interface WorkspaceViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface WorkspaceDocumentModel {
  elements: CanvasElement[];
  connections: WorkspaceConnection[];
  viewport: WorkspaceViewport;
}

export type WorkspaceCanvasNodeData = {
  label: string;
  config: Record<string, unknown>;
  elementId: string;
  onEdit: (id: string, updates: Partial<CanvasElement>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  campaigns: { id: string; name: string }[];
  adSets: { id: string; name: string }[];
  [key: string]: unknown;
};

export type WorkspaceFlowNodeData = {
  label: string;
  config: Record<string, unknown>;
  elementId: string;
  [key: string]: unknown;
};

type PersistedFlowNode = {
  id: string;
  type: WorkspaceNodeType;
  position: { x: number; y: number };
  data?: {
    label?: string;
    config?: Record<string, unknown>;
  };
  // Legacy support
  name?: string;
  config?: Record<string, unknown>;
};

type PersistedFlowEdge = {
  id: string;
  source?: string;
  target?: string;
  data?: {
    sourceType?: WorkspaceNodeType;
    targetType?: WorkspaceNodeType;
  };
  // Legacy support
  sourceId?: string;
  targetId?: string;
  sourceType?: WorkspaceNodeType;
  targetType?: WorkspaceNodeType;
};

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const normalizeViewport = (viewport: unknown): WorkspaceViewport => {
  if (!viewport || typeof viewport !== 'object') return { x: 0, y: 0, zoom: 1 };
  const maybe = viewport as Partial<WorkspaceViewport>;
  return {
    x: isFiniteNumber(maybe.x) ? maybe.x : 0,
    y: isFiniteNumber(maybe.y) ? maybe.y : 0,
    zoom: isFiniteNumber(maybe.zoom) ? maybe.zoom : 1,
  };
};

const toElement = (node: PersistedFlowNode): CanvasElement => ({
  id: node.id,
  type: node.type,
  name: node.data?.label ?? node.name ?? 'Untitled',
  position: {
    x: isFiniteNumber(node.position?.x) ? node.position.x : 0,
    y: isFiniteNumber(node.position?.y) ? node.position.y : 0,
  },
  config: node.data?.config ?? node.config ?? {},
});

const toConnection = (
  edge: PersistedFlowEdge,
  elementTypeById: Map<string, WorkspaceNodeType>,
): WorkspaceConnection | null => {
  const sourceId = edge.source ?? edge.sourceId;
  const targetId = edge.target ?? edge.targetId;

  if (!sourceId || !targetId) return null;

  return {
    id: edge.id,
    sourceId,
    targetId,
    sourceType: edge.data?.sourceType ?? edge.sourceType ?? elementTypeById.get(sourceId) ?? 'campaign',
    targetType: edge.data?.targetType ?? edge.targetType ?? elementTypeById.get(targetId) ?? 'adset',
  };
};

export const canvasStateToWorkspaceDocument = (canvasState: CanvasState): WorkspaceDocumentModel => {
  const nodes = (canvasState?.nodes ?? []) as unknown as PersistedFlowNode[];
  const elements = nodes.map(toElement);
  const typeMap = new Map(elements.map(el => [el.id, el.type]));

  const connections = ((canvasState?.edges ?? []) as unknown as PersistedFlowEdge[])
    .map(edge => toConnection(edge, typeMap))
    .filter((edge): edge is WorkspaceConnection => edge !== null);

  return {
    elements,
    connections,
    viewport: normalizeViewport(canvasState?.viewport),
  };
};

export const workspaceDocumentToCanvasState = (state: WorkspaceDocumentModel): CanvasState => ({
  viewport: normalizeViewport(state.viewport),
  nodes: state.elements.map(element => ({
    id: element.id,
    type: element.type,
    position: element.position,
    data: {
      label: element.name,
      config: element.config ?? {},
    },
  })),
  edges: state.connections.map(connection => ({
    id: connection.id,
    source: connection.sourceId,
    target: connection.targetId,
    data: {
      sourceType: connection.sourceType,
      targetType: connection.targetType,
    },
  })),
});

export const workspaceElementsToReactFlowNodes = (
  elements: CanvasElement[],
  callbacks: {
    onEdit: (id: string, updates: Partial<CanvasElement>) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    campaigns: { id: string; name: string }[];
    adSets: { id: string; name: string }[];
  },
): Node<WorkspaceCanvasNodeData>[] => {
  return elements.map(el => ({
    id: el.id,
    type: el.type,
    position: { x: el.position.x, y: el.position.y },
    data: {
      label: el.name,
      config: el.config,
      elementId: el.id,
      onEdit: callbacks.onEdit,
      onDelete: callbacks.onDelete,
      onDuplicate: callbacks.onDuplicate,
      campaigns: callbacks.campaigns,
      adSets: callbacks.adSets,
    },
  }));
};

export const workspaceElementsToFlowNodes = (
  elements: CanvasElement[],
): Node<WorkspaceFlowNodeData>[] => {
  return elements.map(el => ({
    id: el.id,
    type: el.type,
    position: { x: el.position.x, y: el.position.y },
    data: {
      label: el.name,
      config: el.config,
      elementId: el.id,
    },
  }));
};

export const reactFlowNodesToWorkspaceElements = (
  nodes: Node<WorkspaceFlowNodeData>[],
): CanvasElement[] => {
  return nodes.map(node => ({
    id: node.id,
    type: (node.type as CanvasElement['type']) ?? 'campaign',
    name: node.data?.label ?? 'Untitled',
    position: {
      x: isFiniteNumber(node.position?.x) ? node.position.x : 0,
      y: isFiniteNumber(node.position?.y) ? node.position.y : 0,
    },
    config: node.data?.config ?? {},
  }));
};

export const workspaceConnectionsToReactFlowEdges = (connections: WorkspaceConnection[]): Edge[] => {
  return connections.map(c => ({
    id: c.id,
    source: c.sourceId,
    target: c.targetId,
    type: 'workspace',
    animated: false,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 18,
      height: 18,
      color: 'hsl(var(--muted-foreground) / 0.8)',
    },
    data: { sourceType: c.sourceType, targetType: c.targetType },
  }));
};

export const reactFlowEdgesToWorkspaceConnections = (
  edges: Edge[],
  nodes: Node[],
): WorkspaceConnection[] => {
  const typeMap = new Map(nodes.map(node => [node.id, node.type as WorkspaceNodeType]));

  return edges
    .filter(edge => edge.source && edge.target)
    .map(edge => ({
      id: edge.id,
      sourceId: edge.source,
      targetId: edge.target,
      sourceType: (edge.data?.sourceType as WorkspaceNodeType | undefined) ?? typeMap.get(edge.source) ?? 'campaign',
      targetType: (edge.data?.targetType as WorkspaceNodeType | undefined) ?? typeMap.get(edge.target) ?? 'adset',
    }));
};
