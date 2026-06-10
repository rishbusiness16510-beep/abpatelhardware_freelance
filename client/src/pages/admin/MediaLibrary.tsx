import { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Copy, Loader2, CheckCircle2, Trash2 } from 'lucide-react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';

interface UploadedImage {
  url: string;
  publicId: string;
  name: string;
}

export default function MediaLibrary() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024);
    
    if (validFiles.length === 0) {
      setError('Please select valid image files (max 5MB each).');
      return;
    }
    
    if (validFiles.length > 10) {
      setError('You can only upload up to 10 images at once.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('folder', 'abpatel-hardware/library');
      validFiles.forEach(file => {
        formData.append('images', file);
      });

      const res = await api.post('/upload/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Map response to our state
      const newImages = res.data.map((item: any, index: number) => ({
        url: item.url,
        publicId: item.publicId,
        name: validFiles[index].name
      }));

      // Add to beginning of list
      setImages(prev => [...newImages, ...prev]);
      
      if (fileRef.current) fileRef.current.value = '';
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = (url: string, index: number) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const removeImageFromList = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-text">Media Library</h1>
        <p className="text-sm text-text-muted mt-0.5">Upload images here to generate links for your Bulk Excel sheet</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Area */}
        <div className="lg:col-span-1">
          <div className="bg-surface rounded-xl border border-border p-5 sticky top-6">
            <h2 className="font-heading font-semibold text-text mb-4">Upload Images</h2>
            
            {error && (
              <div className="bg-error/5 border border-error/20 text-error text-sm rounded-lg px-4 py-3 mb-4">
                {error}
              </div>
            )}

            <div 
              onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => !isUploading && fileRef.current?.click()}
              className="w-full h-40 border-2 border-dashed border-border hover:border-accent/40 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors bg-bg"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-8 h-8 text-accent animate-spin mb-2" />
                  <span className="text-sm font-medium text-text">Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-text-muted mb-2" />
                  <span className="text-sm font-medium text-text">Click or drag images</span>
                  <span className="text-xs text-text-muted mt-1 text-center px-4">Up to 10 images at once<br/>Max 5MB per image</span>
                </>
              )}
            </div>
            
            <input 
              ref={fileRef}
              type="file" 
              accept="image/*" 
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
              disabled={isUploading}
            />

            <div className="mt-4 pt-4 border-t border-border">
              <h3 className="text-sm font-medium text-text mb-2">Instructions</h3>
              <ul className="text-xs text-text-muted space-y-2 list-disc pl-4">
                <li>Upload your product images here.</li>
                <li>Click <strong>Copy URL</strong> next to an image.</li>
                <li>Paste that URL directly into the <strong>ImageURLs</strong> column in your Excel template.</li>
                <li>For multiple images per product, separate the URLs with a comma (,).</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Uploaded Images List */}
        <div className="lg:col-span-2">
          <div className="bg-surface rounded-xl border border-border overflow-hidden min-h-[400px]">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-heading font-semibold text-text">Recent Uploads</h2>
              <span className="text-sm text-text-muted">{images.length} items session history</span>
            </div>

            {images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <ImageIcon className="w-12 h-12 text-text-muted/30 mb-3" />
                <p className="text-sm text-text-muted">No images uploaded in this session yet.</p>
                <p className="text-xs text-text-muted mt-1">Upload images to get their URLs.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {images.map((img, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 hover:bg-bg-alt/30 transition-colors group">
                    <div className="w-16 h-16 rounded-lg border border-border overflow-hidden bg-bg shrink-0">
                      <img src={img.url} alt={img.name} className="w-full h-full object-contain p-1" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate mb-1">{img.name}</p>
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          readOnly 
                          value={img.url} 
                          className="flex-1 bg-bg border border-border rounded px-2 py-1 text-xs text-text-muted focus:outline-none"
                        />
                        <Button 
                          onClick={() => copyToClipboard(img.url, index)}
                          className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded text-xs font-medium cursor-pointer transition-colors shrink-0"
                        >
                          {copiedIndex === index ? (
                            <><CheckCircle2 className="w-3.5 h-3.5" /> Copied!</>
                          ) : (
                            <><Copy className="w-3.5 h-3.5" /> Copy URL</>
                          )}
                        </Button>
                      </div>
                    </div>

                    <Button 
                      onClick={() => removeImageFromList(index)}
                      className="p-1.5 text-text-muted hover:text-error hover:bg-error/10 rounded-md cursor-pointer transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove from this list (does not delete from cloud)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
