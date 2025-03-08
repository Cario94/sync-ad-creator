
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

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

// This would typically come from an API
const mockMediaItems: MediaItem[] = [
  {
    id: 'media-1',
    name: 'product-demo.jpg',
    url: 'https://placehold.co/600x400/png',
    type: 'image/jpeg',
    size: 2400000,
    dimensions: { width: 1200, height: 800 },
    uploadedAt: new Date('2023-06-15'),
    thumbnailUrl: 'https://placehold.co/100x100/png'
  },
  {
    id: 'media-2',
    name: 'banner-ad.png',
    url: 'https://placehold.co/800x400/png',
    type: 'image/png',
    size: 1800000,
    dimensions: { width: 800, height: 400 },
    uploadedAt: new Date('2023-07-20'),
    thumbnailUrl: 'https://placehold.co/100x50/png'
  },
  {
    id: 'media-3',
    name: 'promo-video.mp4',
    url: 'https://example.com/video.mp4',
    type: 'video/mp4',
    size: 15000000,
    uploadedAt: new Date('2023-08-10'),
    thumbnailUrl: 'https://placehold.co/100x100/png'
  }
];

export function useMediaLibrary() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load media items
  useEffect(() => {
    // This would typically be an API call
    const fetchMedia = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        setMediaItems(mockMediaItems);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load media files');
        setIsLoading(false);
        console.error('Error loading media:', err);
      }
    };
    
    fetchMedia();
  }, []);
  
  // Upload a new media file
  const uploadMedia = async (file: File, onProgress?: (progress: number) => void): Promise<MediaItem> => {
    // This would typically send the file to an API endpoint
    try {
      // Validate file
      if (file.size > 100 * 1024 * 1024) {
        throw new Error('File size exceeds 100MB limit');
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('File type not supported. Please upload JPG, PNG, MP4, or MOV files');
      }
      
      // Simulate upload progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        if (onProgress) onProgress(Math.min(progress, 100));
        if (progress >= 100) clearInterval(progressInterval);
      }, 300);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create new media item
      const newMediaItem: MediaItem = {
        id: `media-${Date.now()}`,
        name: file.name,
        url: URL.createObjectURL(file), // In a real app, this would be a server URL
        type: file.type,
        size: file.size,
        uploadedAt: new Date(),
        thumbnailUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : 'https://placehold.co/100x100/png'
      };
      
      // Add to media items state
      setMediaItems(prev => [newMediaItem, ...prev]);
      
      toast.success('Media uploaded successfully');
      return newMediaItem;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload media';
      toast.error(errorMessage);
      throw err;
    }
  };
  
  // Delete a media item
  const deleteMedia = async (id: string): Promise<void> => {
    try {
      // This would typically be an API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setMediaItems(prev => prev.filter(item => item.id !== id));
      toast.success('Media deleted successfully');
    } catch (err) {
      toast.error('Failed to delete media');
      throw err;
    }
  };
  
  // Filter media items
  const filterMedia = (searchQuery: string): MediaItem[] => {
    if (!searchQuery) return mediaItems;
    
    const query = searchQuery.toLowerCase();
    return mediaItems.filter(item => {
      return item.name.toLowerCase().includes(query) || 
             item.type.toLowerCase().includes(query);
    });
  };
  
  // Sort media items
  const sortMedia = (
    items: MediaItem[], 
    sortBy: 'name' | 'date' | 'size' | 'type' = 'date',
    order: 'asc' | 'desc' = 'desc'
  ): MediaItem[] => {
    return [...items].sort((a, b) => {
      let result = 0;
      
      switch (sortBy) {
        case 'name':
          result = a.name.localeCompare(b.name);
          break;
        case 'date':
          result = a.uploadedAt.getTime() - b.uploadedAt.getTime();
          break;
        case 'size':
          result = a.size - b.size;
          break;
        case 'type':
          result = a.type.localeCompare(b.type);
          break;
      }
      
      return order === 'asc' ? result : -result;
    });
  };
  
  return {
    mediaItems,
    isLoading,
    error,
    uploadMedia,
    deleteMedia,
    filterMedia,
    sortMedia
  };
}
