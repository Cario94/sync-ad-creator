import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { mediaAssetsService } from '@/services/mediaAssets';
import { useAuth } from '@/contexts/AuthContext';

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  dimensions?: { width: number; height: number };
  uploadedAt: Date;
  thumbnailUrl?: string;
}

/** Map a DB row to the UI shape */
function toMediaItem(row: {
  id: string;
  name: string;
  storage_path: string;
  file_type: string;
  file_size: number | null;
  dimensions: unknown;
  created_at: string;
}): MediaItem {
  const dims = row.dimensions as { width: number; height: number } | null;
  return {
    id: row.id,
    name: row.name,
    url: row.storage_path, // will resolve to a real URL once storage is wired
    type: row.file_type,
    size: row.file_size ?? 0,
    dimensions: dims ?? undefined,
    uploadedAt: new Date(row.created_at),
    thumbnailUrl: undefined,
  };
}

export function useMediaLibrary() {
  const { user } = useAuth();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch from DB
  useEffect(() => {
    if (!user) {
      setMediaItems([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const fetch = async () => {
      try {
        setIsLoading(true);
        const rows = await mediaAssetsService.list(user.id);
        if (!cancelled) {
          setMediaItems(rows.map(toMediaItem));
        }
      } catch (err) {
        if (!cancelled) setError('Failed to load media files');
        console.error('Error loading media:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [user]);

  // Upload – placeholder until storage bucket is created
  const uploadMedia = useCallback(async (file: File, _onProgress?: (progress: number) => void): Promise<MediaItem> => {
    if (!user) throw new Error('Not authenticated');

    // Validate
    if (file.size > 100 * 1024 * 1024) {
      throw new Error('File size exceeds 100MB limit');
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not supported. Please upload JPG, PNG, MP4, or MOV files');
    }

    // TODO: upload file to storage bucket, then persist path
    // For now, create metadata record with a placeholder path
    const row = await mediaAssetsService.create({
      user_id: user.id,
      name: file.name,
      storage_path: `pending/${user.id}/${file.name}`,
      file_type: file.type,
      file_size: file.size,
    });

    const item = toMediaItem(row);
    setMediaItems(prev => [item, ...prev]);
    toast.success('Media record created');
    return item;
  }, [user]);

  // Delete
  const deleteMedia = useCallback(async (id: string): Promise<void> => {
    await mediaAssetsService.remove(id);
    setMediaItems(prev => prev.filter(item => item.id !== id));
    toast.success('Media deleted successfully');
  }, []);

  // Filter
  const filterMedia = useCallback((searchQuery: string): MediaItem[] => {
    if (!searchQuery) return mediaItems;
    const query = searchQuery.toLowerCase();
    return mediaItems.filter(item =>
      item.name.toLowerCase().includes(query) || item.type.toLowerCase().includes(query)
    );
  }, [mediaItems]);

  // Sort
  const sortMedia = useCallback((
    items: MediaItem[],
    sortBy: 'name' | 'date' | 'size' | 'type' = 'date',
    order: 'asc' | 'desc' = 'desc'
  ): MediaItem[] => {
    return [...items].sort((a, b) => {
      let result = 0;
      switch (sortBy) {
        case 'name': result = a.name.localeCompare(b.name); break;
        case 'date': result = a.uploadedAt.getTime() - b.uploadedAt.getTime(); break;
        case 'size': result = a.size - b.size; break;
        case 'type': result = a.type.localeCompare(b.type); break;
      }
      return order === 'asc' ? result : -result;
    });
  }, []);

  return { mediaItems, isLoading, error, uploadMedia, deleteMedia, filterMedia, sortMedia };
}
