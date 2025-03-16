
import React from 'react';
import Campaign from './Campaign';
import AdSet from './AdSet';
import Ad from './Ad';
import { CanvasElement } from './types/canvas';

interface ElementsRendererProps {
  elements: CanvasElement[];
  selectedElementIds: string[];
  isCreatingConnection: boolean;
  activeConnection: { sourceId: string; sourceType: 'campaign' | 'adset' | 'ad' } | null;
  onSelectElement: (id: string) => void;
  onStartConnection: (id: string, type: 'campaign' | 'adset' | 'ad') => void;
  onCompleteConnection: (id: string, type: 'campaign' | 'adset' | 'ad') => void;
  onUpdatePosition: (id: string, position: { x: number; y: number }) => void;
  elementRefs: (id: string, element: HTMLDivElement | null) => void;
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
  elementRefs
}) => {
  return (
    <>
      {elements.map(element => {
        const isSelected = selectedElementIds.includes(element.id);
        
        const commonProps = {
          key: element.id,
          id: element.id,
          name: element.name,
          initialPosition: element.position,
          elementRef: (el: HTMLDivElement | null) => elementRefs(element.id, el),
          isCreatingConnection,
          isSelected,
          activeConnectionId: activeConnection?.sourceId,
          onSelect: () => onSelectElement(element.id),
          onStartConnection: () => onStartConnection(element.id, element.type),
          onCompleteConnection: () => onCompleteConnection(element.id, element.type),
          onUpdatePosition: (position: { x: number; y: number }) => onUpdatePosition(element.id, position),
        };
        
        if (element.type === 'campaign') {
          return <Campaign {...commonProps} />;
        } else if (element.type === 'adset') {
          return <AdSet {...commonProps} />;
        } else if (element.type === 'ad') {
          return <Ad {...commonProps} />;
        }
        return null;
      })}
    </>
  );
};

export default ElementsRenderer;
