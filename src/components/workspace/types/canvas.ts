
export interface CanvasElement {
  id: string;
  type: 'campaign' | 'adset' | 'ad';
  name: string;
  position: { x: number; y: number };
}

export interface ElementPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
