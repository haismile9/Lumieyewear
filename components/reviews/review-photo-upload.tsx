'use client';

import { useState, useRef } from 'react';
import { Upload, X, CheckCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface UploadedPhoto {
  filename: string;
  url: string | null; // null for pending photos
  thumbnailUrl: string;
  width: number;
  height: number;
  size: number;
  blurhash?: string;
  status: 'PENDING' | 'APPROVED';
}

interface ReviewPhotoUploadProps {
  onPhotosUploaded: (photos: UploadedPhoto[]) => void;
  maxPhotos?: number;
  className?: string;
}

export function ReviewPhotoUpload({
  onPhotosUploaded,
  maxPhotos = 5,
  className,
}: ReviewPhotoUploadProps) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;
    
    // Check total count
    if (photos.length + files.length > maxPhotos) {
      alert(`Chỉ được upload tối đa ${maxPhotos} ảnh`);
      return;
    }

    // Create previews
    const newPreviews = await Promise.all(
      files.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      })
    );
    setPreviews([...previews, ...newPreviews]);

    // Upload to backend
    await uploadFiles(files);
  };

  const uploadFiles = async (files: File[]) => {
    setUploading(true);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('photos', file);
      });

      // Get token from Redux persist
      const token = getToken();
      if (!token) {
        alert('Vui lòng đăng nhập để upload ảnh');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5002/api'}/reviews/upload-photos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const data = await response.json();
      const uploadedPhotos = data.photos || [];

      setPhotos([...photos, ...uploadedPhotos]);
      onPhotosUploaded([...photos, ...uploadedPhotos]);
      
      // Reset previews after successful upload
      setPreviews([]);
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(error.message || 'Lỗi khi upload ảnh');
      setPreviews([]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    onPhotosUploaded(newPhotos);
  };

  const removePreview = (index: number) => {
    setPreviews(previews.filter((_, i) => i !== index));
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload button */}
      {photos.length < maxPhotos && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang upload...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Thêm ảnh ({photos.length}/{maxPhotos})
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Tối đa {maxPhotos} ảnh, mỗi ảnh không quá 10MB. Ảnh sẽ được kiểm duyệt trước khi hiển thị.
          </p>
        </div>
      )}

      {/* Preview uploading photos */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {previews.map((preview, index) => (
            <Card key={`preview-${index}`} className="relative aspect-square p-2">
              <div className="relative w-full h-full rounded overflow-hidden">
                <Image
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removePreview(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* Uploaded photos */}
      {photos.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Ảnh đã upload:</p>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, index) => (
              <Card key={photo.filename} className="relative aspect-square p-2">
                <div className="relative w-full h-full rounded overflow-hidden">
                  {photo.thumbnailUrl ? (
                    <Image
                      src={`http://127.0.0.1:5002${photo.thumbnailUrl}`}
                      alt={photo.filename}
                      fill
                      className="object-cover"
                      style={{
                        filter: photo.blurhash ? 'none' : 'blur(10px)',
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  {photo.status === 'PENDING' && (
                    <div className="absolute bottom-0 left-0 right-0 bg-yellow-500 text-white text-xs py-1 px-2 flex items-center justify-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Chờ duyệt
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to get token from Redux persist
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const persistRoot = localStorage.getItem('persist:root');
    if (!persistRoot) return null;
    
    const parsed = JSON.parse(persistRoot);
    if (!parsed.auth) return null;
    
    const authState = JSON.parse(parsed.auth);
    return authState.token || null;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}

