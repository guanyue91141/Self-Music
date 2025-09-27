"use client";

import { useState, useRef, ChangeEvent } from 'react';
import AdminLayout from '@/components/admin-layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileAudio, CheckCircle, AlertCircle, UploadCloud } from 'lucide-react';
import { adminAPI } from '@/lib/admin-api';

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<{ filename: string; url: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 检查文件类型是否为音频文件
      if (!file.type.startsWith('audio/')) {
        setUploadError('请选择音频文件（如 MP3, WAV, FLAC 等）');
        return;
      }
      
      setSelectedFile(file);
      setFileName(file.name);
      setFileSize(file.size);
      setUploadSuccess(null);
      setUploadError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('请先选择一个音频文件');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadError(null);

      // 模拟上传进度
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 10;
        });
      }, 200);

      // 实际上传文件
      const response = await adminAPI.uploadFile(selectedFile);
      
      clearInterval(interval);
      setUploadProgress(100);

      if (response.success && response.data) {
        setUploadSuccess(response.data);
        setUploadError(null);
      } else {
        throw new Error(response.message || '上传失败');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error instanceof Error ? error.message : '上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const resetForm = () => {
    setSelectedFile(null);
    setFileName('');
    setFileSize(0);
    setUploadSuccess(null);
    setUploadError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">文件上传</h1>
            <p className="text-muted-foreground">上传音频文件到服务器</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadCloud className="h-5 w-5" />
              音频文件上传
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* 文件选择区域 */}
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('file-upload')?.click()}>
                  <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-1">点击上传音频文件</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    支持 MP3, WAV, FLAC, M4A 等音频格式
                  </p>
                  <Button variant="secondary" className="flex items-center gap-2">
                    <FileAudio className="h-4 w-4" />
                    选择文件
                  </Button>
                  <Input
                    id="file-upload"
                    type="file"
                    accept="audio/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* 文件信息显示 */}
                {fileName && (
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileAudio className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium truncate max-w-xs">{fileName}</p>
                          <p className="text-sm text-muted-foreground">{formatFileSize(fileSize)}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={resetForm}
                      >
                        重新选择
                      </Button>
                    </div>
                  </div>
                )}

                {/* 上传进度 */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>上传进度</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}

                {/* 上传成功提示 */}
                {uploadSuccess && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                      <div className="font-medium">上传成功！</div>
                      <div className="mt-1">
                        <div>文件名: {uploadSuccess.filename}</div>
                        <div className="mt-1">
                          访问地址: 
                          <a 
                            href={uploadSuccess.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline ml-2"
                          >
                            {uploadSuccess.url}
                          </a>
                        </div>
                        <div className="mt-2 text-sm">
                          提示: 您现在可以在 <a 
                            href="/admin/songs" 
                            className="text-blue-600 hover:underline"
                            onClick={(e) => {
                              e.preventDefault();
                              window.location.href = "/admin/songs";
                            }}
                          >
                            歌曲管理
                          </a> 页面创建歌曲记录并使用此文件作为音频源。
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* 错误提示 */}
                {uploadError && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">
                      {uploadError}
                    </AlertDescription>
                  </Alert>
                )}

                {/* 上传按钮 */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    disabled={isUploading}
                  >
                    重置
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || isUploading}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {isUploading ? '上传中...' : '上传文件'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 上传说明 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileAudio className="h-5 w-5" />
              使用说明
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
              <li>支持 MP3, WAV, FLAC, M4A 等常见音频格式</li>
              <li>上传的文件会保存到服务器的 uploads 目录中</li>
              <li>上传成功后，您可以在歌曲管理页面使用该音频文件URL</li>
              <li>建议上传高质量音频文件以获得更好的播放体验</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}