import { useMemo } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { validateNode, type NodeValidationResult } from '@/lib/validation';

/** Returns validation result for a single node, reactive to elements/connections changes */
export function useNodeValidation(elementId: string): NodeValidationResult | null {
  const { elements, connections } = useWorkspace();

  return useMemo(() => {
    const el = elements.find(e => e.id === elementId);
    if (!el) return null;
    return validateNode(el, connections, elements);
  }, [elementId, elements, connections]);
}
