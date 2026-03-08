import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { mediaAssetsService, getPublicUrl } from '@/services/mediaAssets';
import { useAuth } from '@/contexts/AuthContext';

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  storagePath: string;
  type: string;
  size: number;
  dimensions?: { width: number; height: number };
  uploadedAt: Date;
  thumbnailUrl?: string;
}

/** Read image dimensions from a File (best-effort, images only) */
function readImageDimensions(file: File): Promise<{ width: number; height: number } | undefined> {
  return new Promise(resolve => {
    if (!file.type.startsWith('image/')) { resolve(undefined); return; }
    const img = new Image();
    img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(img.src); };
    img.onerror = () => { resolve(undefined); URL.revokeObjectURL(img.src); };
    img.src = URL.createObjectURL(file);
  });
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
    url: getPublicUrl(row.storage_path),
    storagePath: row.storage_path,
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

  // Upload — real storage upload
  const uploadMedia = useCallback(async (file: File, onProgress?: (progress: number) => void): Promise<MediaItem> => {
    if (!user) throw new Error('Not authenticated');

    // Validate
    if (file.size > 100 * 1024 * 1024) {
      throw new Error('File size exceeds 100MB limit');
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not supported. Please upload JPG, PNG, GIF, WebP, MP4, or MOV files');
    }

    // Simulate initial progress (Supabase SDK doesn't expose upload progress)
    onProgress?.(10);

    // Read dimensions for images
    const dimensions = await readImageDimensions(file);
    onProgress?.(20);

    const row = await mediaAssetsService.upload(user.id, file, { dimensions });
    onProgress?.(100);

    const item = toMediaItem(row);
    setMediaItems(prev => [item, ...prev]);
    toast.success('Media uploaded');
    return item;
  }, [user]);

  // Delete — removes storage file + DB row
  const deleteMedia = useCallback(async (id: string): Promise<void> => {
    const item = mediaItems.find(m => m.id === id);
    await mediaAssetsService.remove(id, item?.storagePath);
    setMediaItems(prev => prev.filter(m => m.id !== id));
    toast.success('Media deleted');
  }, [mediaItems]);

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
