'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { adminAPI } from '@/lib/admin-api';
import { UploadedFile } from '@/types';
import { RotateCcw } from 'lucide-react';

interface AudioFileSelectorProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
}

export function AudioFileSelector({ value, onChange, label = '音频文件', placeholder = '选择已上传的音频文件...' }: AudioFileSelectorProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUploadedFiles();
  }, []);

  const fetchUploadedFiles = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUploadedFiles();
      if (response.success && response.data) {
        setFiles(response.data);
      } else {
        console.error('Failed to fetch uploaded files:', response.message || '获取上传文件失败');
        alert(response.message || '获取上传文件失败');
      }
    } catch (error) {
      console.error('Failed to fetch uploaded files:', error);
      alert('获取上传文件失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {loading ? (
              <SelectItem value="loading" disabled>
                <div className="flex items-center">
                  <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                  加载中...
                </div>
              </SelectItem>
            ) : files.length === 0 ? (
              <SelectItem value="no-files" disabled>
                没有找到上传的文件
              </SelectItem>
            ) : (
              files.map((file) => (
                <SelectItem key={file.name} value={file.url}>
                  <div className="flex justify-between">
                    <div className="truncate max-w-xs">{file.name}</div>
                    <div className="text-xs text-muted-foreground ml-2">
                      {formatFileSize(file.size)} · {formatDate(file.created_at)}
                    </div>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={fetchUploadedFiles}
          disabled={loading}
        >
          <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      {value && value !== 'loading' && value !== 'no-files' && (
        <p className="text-sm text-muted-foreground">
          当前选择: {files.find(f => f.url === value)?.name || '未知文件'} 
          ({formatFileSize(files.find(f => f.url === value)?.size || 0)})
        </p>
      )}
    </div>
  );
}