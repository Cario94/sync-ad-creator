
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  sourceType: 'campaign' | 'adset' | 'ad';
  targetType: 'campaign' | 'adset' | 'ad';
}

export const useConnections = (initialConnections: Connection[] = []) => {
  const [connections, setConnections] = useState<Connection[]>(initialConnections);
  const [isCreatingConnection, setIsCreatingConnection] = useState(false);
  const [activeConnection, setActiveConnection] = useState<{
    sourceId: string;
    sourceType: 'campaign' | 'adset' | 'ad';
  } | null>(null);

  const startConnection = useCallback((sourceId: string, sourceType: 'campaign' | 'adset' | 'ad') => {
    setIsCreatingConnection(true);
    setActiveConnection({ sourceId, sourceType });
  }, []);

  const completeConnection = useCallback((targetId: string, targetType: 'campaign' | 'adset' | 'ad') => {
    if (!activeConnection) return;

    // Don't allow connecting to the same element
    if (activeConnection.sourceId === targetId) {
      toast.error("Cannot connect an element to itself");
      setIsCreatingConnection(false);
      setActiveConnection(null);
      return;
    }

    // Only allow connections from campaign → adset or adset → ad
    const isValidConnection = 
      (activeConnection.sourceType === 'campaign' && targetType === 'adset') ||
      (activeConnection.sourceType === 'adset' && targetType === 'ad');

    if (!isValidConnection) {
      toast.error("Invalid connection type. Campaigns connect to Ad Sets, and Ad Sets connect to Ads");
      setIsCreatingConnection(false);
      setActiveConnection(null);
      return;
    }

    // Check if connection already exists
    const connectionExists = connections.some(
      conn => conn.sourceId === activeConnection.sourceId && conn.targetId === targetId
    );

    if (connectionExists) {
      toast.error("Connection already exists");
      setIsCreatingConnection(false);
      setActiveConnection(null);
      return;
    }

    // Create new connection
    const newConnection: Connection = {
      id: `conn-${Date.now()}`,
      sourceId: activeConnection.sourceId,
      targetId,
      sourceType: activeConnection.sourceType,
      targetType
    };

    setConnections(prev => [...prev, newConnection]);
    toast.success("Connection created successfully");
    setIsCreatingConnection(false);
    setActiveConnection(null);
  }, [activeConnection, connections]);

  const cancelConnection = useCallback(() => {
    setIsCreatingConnection(false);
    setActiveConnection(null);
  }, []);

  const removeConnection = useCallback((connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
    toast.success("Connection removed");
  }, []);

  return {
    connections,
    isCreatingConnection,
    activeConnection,
    startConnection,
    completeConnection,
    cancelConnection,
    removeConnection
  };
};
