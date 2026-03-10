export type WorkspaceNodeType = 'campaign' | 'adset' | 'ad';

export interface WorkspaceConnection {
  id: string;
  sourceId: string;
  targetId: string;
  sourceType: WorkspaceNodeType;
  targetType: WorkspaceNodeType;
}
