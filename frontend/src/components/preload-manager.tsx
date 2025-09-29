'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PreloadManagerProps {
  songs?: Array<{
    id: string;
    title: string;
    audioUrl?: string;
    coverUrl?: string;
  }>;
  onPreloadComplete?: () => void;
}

export function PreloadManager({ songs = [], onPreloadComplete }: PreloadManagerProps) {
  // 不执行任何操作，因为我们已经移除了缓存功能
  return null;
}