'use client';
import { apiFetch } from '@/lib/api';

import { useState, useRef } from 'react';
import { Camera, X, Plus, AlertCircle } from 'lucide-react';
import { MediaEditor } from '@/components/media-editor/MediaEditor';

interface PhotoUploadProps {
  mediaUrls: string[];
  onChange: (urls: string[]) => void;
}

const MAX_PHOTOS = 4;
const MAX_FILE_SIZE_MB = 10;

export function PhotoUpload({ mediaUrls, onChange }: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const createdUrls = useRef<string[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setError('');

    // Validate type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WebP, GIF).');
      e.target.value = '';
      return;
    }
    // Validate size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`Image is too large. Max ${MAX_FILE_SIZE_MB} MB.`);
      e.target.value = '';
      return;
    }
    // Validate count
    if (mediaUrls.length >= MAX_PHOTOS) {
      setError(`Maximum ${MAX_PHOTOS} photos per post.`);
      e.target.value = '';
      return;
    }

    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setObjectUrl(url);
    setShowEditor(true);
    e.target.value = '';
  };

  const handleEditorSave = async (file: File) => {
    setUploading(true);
    setUploadProgress(10);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate incremental progress while the request is in flight.
      // The browser doesn't expose upload progress on fetch() without
      // XMLHttpRequest, so we approximate.
      const progressTimer = setInterval(() => {
        setUploadProgress(p => (p < 90 ? p + 5 : p));
      }, 200);

      const res = await apiFetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressTimer);
      setUploadProgress(100);

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Upload failed. Please try again.');
      } else if (data.url) {
        onChange([...mediaUrls, data.url]);
      } else {
        setError('Upload succeeded but no URL was returned.');
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setTimeout(() => setUploadProgress(0), 400);
      setUploading(false);
      setShowEditor(false);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setSelectedFile(null);
      setObjectUrl('');
    }
  };

  const handleEditorCancel = () => {
    setShowEditor(false);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setSelectedFile(null);
    setObjectUrl('');
  };

  const removeMedia = (index: number) => {
    const removed = mediaUrls[index];
    if (createdUrls.current.includes(removed)) {
      URL.revokeObjectURL(removed);
      createdUrls.current = createdUrls.current.filter(u => u !== removed);
    }
    onChange(mediaUrls.filter((_, i) => i !== index));
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Upload progress bar */}
        {uploading && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Uploading photo…</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
              <div
                className="h-full bg-gold transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {mediaUrls.length > 0 && (
          <div className={`grid gap-2 ${mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {mediaUrls.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-surface border border-surface-border">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => removeMedia(i)}
                  className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors"
                  aria-label="Remove photo"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {mediaUrls.length < MAX_PHOTOS && !uploading && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-surface-border hover:border-gold/40 transition-colors">
                <Plus className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Add more</span>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </label>
            )}
          </div>
        )}

        {mediaUrls.length === 0 && !uploading && (
          <label className="flex h-48 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-surface-border hover:border-gold/40 transition-colors bg-surface/30">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10">
              <Camera className="h-7 w-7 text-gold" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white">Tap to select photo</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                JPG, PNG, WebP, GIF · max {MAX_FILE_SIZE_MB} MB · up to {MAX_PHOTOS} photos
              </p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </label>
        )}
      </div>

      {/* Editor Modal */}
      {showEditor && selectedFile && objectUrl && (
        <MediaEditor
          type="photo"
          file={selectedFile}
          objectUrl={objectUrl}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
        />
      )}
    </>
  );
}
