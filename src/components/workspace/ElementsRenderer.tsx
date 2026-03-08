import React from 'react';
import Campaign from './Campaign';
import AdSet from './AdSet';
import Ad from './Ad';
import { CanvasElement } from './types/canvas';
import type { Viewport } from '@/hooks/useCanvasInteraction';

interface ElementsRendererProps {
  elements: CanvasElement[];
  selectedElementIds: string[];
  isCreatingConnection: boolean;
  activeConnection: { sourceId: string; sourceType: 'campaign' | 'adset' | 'ad' } | null;
  onSelectElement: (id: string) => void;
  onStartConnection: (id: string, type: 'campaign' | 'adset' | 'ad') => void;
  onCompleteConnection: (id: string, type: 'campaign' | 'adset' | 'ad') => void;
  onUpdatePosition: (id: string, position: { x: number; y: number }) => void;
  onEditElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  getCampaigns: () => { id: string; name: string }[];
  getAdSets: () => { id: string; name: string }[];
  elementRefs: (id: string, element: HTMLDivElement | null) => void;
  viewport: Viewport;
  containerRef: React.RefObject<HTMLDivElement>;
  snapSize: number;
  onDragEnd: (id: string, pos: { x: number; y: number }) => void;
}

const ElementsRenderer: React.FC<ElementsRendererProps> = ({
  elements,
  selectedElementIds,
  isCreatingConnection,
  activeConnection,
  onSelectElement,
  onStartConnection,
  onCompleteConnection,
  onUpdatePosition,
  onEditElement,
  onDeleteElement,
  onDuplicateElement,
  getCampaigns,
  getAdSets,
  elementRefs,
  viewport,
  containerRef,
  snapSize,
  onDragEnd,
}) => {
  return (
    <>
      {elements.map(element => {
        const isSelected = selectedElementIds.includes(element.id);

        const commonProps = {
          id: element.id,
          name: element.name,
          config: element.config,
          initialPosition: element.position,
          elementRef: (el: HTMLDivElement | null) => elementRefs(element.id, el),
          isCreatingConnection,
          isSelected,
          activeConnectionId: activeConnection?.sourceId,
          onSelect: () => onSelectElement(element.id),
          onStartConnection: () => onStartConnection(element.id, element.type),
          onCompleteConnection: () => onCompleteConnection(element.id, element.type),
          onUpdatePosition: (position: { x: number; y: number }) => onUpdatePosition(element.id, position),
          onEdit: (updates: Partial<CanvasElement>) => onEditElement(element.id, updates),
          onDelete: () => onDeleteElement(element.id),
          onDuplicate: () => onDuplicateElement(element.id),
          viewport,
          containerRef,
          snapSize,
          onDragEnd,
        };

        if (element.type === 'campaign') {
          return <Campaign key={element.id} {...commonProps} />;
        } else if (element.type === 'adset') {
          return <AdSet key={element.id} {...commonProps} campaigns={getCampaigns()} />;
        } else if (element.type === 'ad') {
          return <Ad key={element.id} {...commonProps} adSets={getAdSets()} />;
        }
        return null;
      })}
    </>
  );
};

export default ElementsRenderer;
