'use client';

import { useState, useRef } from 'react';
import { Camera, X, Plus } from 'lucide-react';
import { MediaEditor } from '@/components/media-editor/MediaEditor';

interface VideoUploadProps {
  mediaUrls: string[];
  onChange: (urls: string[]) => void;
  type: 'video' | 'spotlight';
}

export function VideoUpload({ mediaUrls, onChange, type }: VideoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const createdUrls = useRef<string[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // VALIDATION: Check video duration BEFORE opening editor
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      if (video.duration > 30) {
        alert(`Video must be under 30 seconds. Current: ${Math.round(video.duration)}s`);
        return;
      }
      
      // If valid, open the editor
      const url = URL.createObjectURL(file);
      setSelectedFile(file);
      setObjectUrl(url);
      setShowEditor(true);
    };
    video.src = URL.createObjectURL(file);
    e.target.value = '';
  };

  const handleEditorSave = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.url) {
        onChange([...mediaUrls, data.url]);
      } else {
        console.error('❌ No URL in response:', data);
      }
    } catch (err) {
      console.error('❌ Upload error:', err);
    }
    setUploading(false);
    setShowEditor(false);
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setSelectedFile(null);
    setObjectUrl('');
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
        {mediaUrls.length > 0 && (
          <div className={`grid gap-2 ${mediaUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {mediaUrls.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-surface border border-surface-border">
                <video src={url} className="h-full w-full object-cover" controls />
                <button
                  onClick={() => removeMedia(i)}
                  className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {mediaUrls.length < 4 && (
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-surface-border hover:border-gold/40 transition-colors">
                <Plus className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Add more</span>
                <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
              </label>
            )}
          </div>
        )}

        {mediaUrls.length === 0 && (
          <label className="flex h-48 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-surface-border hover:border-gold/40 transition-colors bg-surface/30">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10">
              <Camera className="h-7 w-7 text-gold" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white">
                Tap to select {type === 'video' ? 'video' : 'reel'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Max 30 seconds</p>
            </div>
            <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
          </label>
        )}

        <div className="flex gap-2">
          <input
            value={''}
            onChange={() => {}}
            onKeyDown={() => {}}
            placeholder="Or paste video URL..."
            className="flex-1 rounded-xl bg-surface border border-surface-border px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold"
          />
          <button className="rounded-xl bg-surface border border-surface-border px-4 text-sm font-semibold text-white hover:bg-surface-elevated">
            Add
          </button>
        </div>
      </div>

      {/* Editor Modal */}
      {showEditor && selectedFile && objectUrl && (
        <MediaEditor
          type={type}
          file={selectedFile}
          objectUrl={objectUrl}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
        />
      )}
    </>
  );
}
