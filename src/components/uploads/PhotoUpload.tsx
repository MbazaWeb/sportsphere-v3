'use client';

import { useState, useRef } from 'react';
import { Camera, X, Plus } from 'lucide-react';
import { MediaEditor } from '@/components/media-editor/MediaEditor';

interface PhotoUploadProps {
  mediaUrls: string[];
  onChange: (urls: string[]) => void;
}

export function PhotoUpload({ mediaUrls, onChange }: PhotoUploadProps) {
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
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setObjectUrl(url);
    setShowEditor(true);
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
                <img src={url} alt="" className="h-full w-full object-cover" />
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
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
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
              <p className="text-sm font-semibold text-white">Tap to select photo</p>
              <p className="text-xs text-muted-foreground mt-0.5">Edit before posting</p>
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
