import { useState, useRef } from 'react';
import { Loader2, Trash2, Upload } from 'lucide-react';
import api from '../../lib/api';
import Button from '../ui/Button';

interface ImageUploaderProps {
  value: string;          // Current image URL
  onChange: (url: string) => void;
  folder?: string;        // Cloudinary folder
  label?: string;
  className?: string;
}

/**
 * Reusable image uploader component.
 * - Uploads file directly to Cloudinary via /api/upload/single
 * - Shows preview of current image
 * - Replaces manual URL text fields across all admin forms
 */
export default function ImageUploader({ value, onChange, folder = 'abpatel-hardware/general', label = 'Image', className = '' }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', folder);
      const res = await api.post('/upload/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(res.data.url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleRemove = () => {
    onChange('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-text mb-1.5">{label}</label>

      {value ? (
        // Preview mode
        <div className="relative group w-full rounded-lg border border-border overflow-hidden bg-bg-alt">
          <img src={value} alt="Preview" className="w-full h-40 object-contain bg-white p-2" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
            <Button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-3 py-1.5 bg-white text-text text-xs font-medium rounded-md cursor-pointer hover:bg-bg-alt transition-colors"
            >
              Replace
            </Button>
            <Button
              type="button"
              onClick={handleRemove}
              className="p-1.5 bg-error text-white rounded-md cursor-pointer hover:bg-error/80 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        // Upload mode
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !uploading && fileRef.current?.click()}
          className="w-full h-32 border-2 border-dashed border-border hover:border-accent/40 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors bg-bg"
        >
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 text-accent animate-spin mb-1" />
              <span className="text-xs text-text-muted">Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6 text-text-muted mb-1" />
              <span className="text-xs text-text-muted">Click or drag image here</span>
              <span className="text-[10px] text-text-muted/60 mt-0.5">Max 5MB · JPG, PNG, WebP</span>
            </>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
        disabled={uploading}
      />

      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
}
