
import React from 'react';
import Campaign from './Campaign';
import AdSet from './AdSet';
import Ad from './Ad';

export interface CanvasElement {
  id: string;
  type: 'campaign' | 'adset' | 'ad';
  name: string;
  position: { x: number; y: number };
}

interface CanvasElementsProps {
  elements: CanvasElement[];
}

const CanvasElements: React.FC<CanvasElementsProps> = ({ elements }) => {
  return (
    <>
      {elements.map(element => {
        if (element.type === 'campaign') {
          return (
            <Campaign 
              key={element.id}
              id={element.id}
              name={element.name}
              initialPosition={element.position}
            />
          );
        } else if (element.type === 'adset') {
          return (
            <AdSet 
              key={element.id}
              id={element.id}
              name={element.name}
              initialPosition={element.position}
            />
          );
        } else if (element.type === 'ad') {
          return (
            <Ad 
              key={element.id}
              id={element.id}
              name={element.name}
              initialPosition={element.position}
            />
          );
        }
        return null;
      })}
    </>
  );
};

export default CanvasElements;
