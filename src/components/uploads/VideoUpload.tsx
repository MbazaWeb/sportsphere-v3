'use client';
import { apiFetch } from '@/lib/api';

import { useState, useRef, useCallback } from 'react';
import { Video as VideoIcon, X, Plus, AlertCircle, VideoOff, Check } from 'lucide-react';
import { MediaEditor } from '@/components/media-editor/MediaEditor';

interface VideoUploadProps {
  mediaUrls: string[];
  onChange: (urls: string[]) => void;
  type: 'video' | 'spotlight';
}

const MAX_FILE_SIZE_MB = 100;
const MAX_VIDEOS = 1;

export function VideoUpload({ mediaUrls, onChange, type }: VideoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const maxSeconds = type === 'spotlight' ? 30 : 60;

  // ── Get base URL for XHR uploads ──
  const getBaseUrl = useCallback(() => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${basePath}`;
    }
    return basePath;
  }, []);

  // ── Upload via XMLHttpRequest for real progress tracking ──
  const uploadFile = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const baseUrl = getBaseUrl();
      const xhr = new XMLHttpRequest();
      
      // Get auth token from cookies (same auth the API route expects)
      const formData = new FormData();
      formData.append('file', file);

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(pct);
        }
      });

      xhr.addEventListener('load', () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && data.url) {
            resolve(data.url);
          } else {
            reject(new Error(data.error || `Upload failed (HTTP ${xhr.status})`));
          }
        } catch {
          reject(new Error('Invalid server response'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error — check your connection'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      xhr.open('POST', `${baseUrl}/api/uploads`);
      // Include credentials (cookies) for auth
      xhr.withCredentials = true;
      xhr.send(formData);
    });
  }, [getBaseUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setError('');
    setSuccessMsg('');

    // Validate type
    const mime = (file.type || '').split(';')[0].trim().toLowerCase();
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const videoExts = ['mp4','m4v','webm','mov','3gp','3g2','avi','mpeg','mpg','mkv','ogv','ogg'];
    if (mime && !mime.startsWith('video/') && !videoExts.includes(ext)) {
      setError('Please select a video file (MP4, WebM, MOV, M4V, AVI, MKV, etc.).');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`Video is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max ${MAX_FILE_SIZE_MB} MB.`);
      e.target.value = '';
      return;
    }

    // Warn for very large files on slow connections
    if (file.size > 20 * 1024 * 1024) {
      const isSlow = typeof navigator !== 'undefined' && 
        (navigator as any).connection && 
        (navigator as any).connection.effectiveType && 
        ['slow-2g', '2g', '3g'].includes((navigator as any).connection.effectiveType);
      if (isSlow) {
        setError('Your connection seems slow. For best results, use WiFi or compress the video first.');
      }
    }

    if (mediaUrls.length >= MAX_VIDEOS) {
      setError(`Maximum ${MAX_VIDEOS} video per post.`);
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
    setUploadProgress(0);
    setError('');
    setSuccessMsg('');

    try {
      const url = await uploadFile(file);
      setUploadProgress(100);
      onChange([...mediaUrls, url]);
      setSuccessMsg('Video uploaded!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error('Video upload error:', err);
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
      setError(
        offline
          ? "You're offline. Reconnect and try again."
          : (err?.message || 'Upload failed. Try a smaller video or check your connection.')
      );
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
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

        {/* Success banner */}
        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 p-3">
            <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
            <p className="text-xs text-green-400">{successMsg}</p>
          </div>
        )}

        {/* Upload progress bar */}
        {uploading && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Uploading {type === 'spotlight' ? 'reel' : 'video'}…</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
              <div
                className="h-full bg-gold transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Keep this page open — large videos may take a moment.
            </p>
          </div>
        )}

        {mediaUrls.length > 0 && (
          <div className="grid gap-2 grid-cols-1">
            {mediaUrls.map((url, i) => (
              <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-surface border border-surface-border">
                <video 
                  src={url} 
                  className="h-full w-full object-cover" 
                  controls 
                  playsInline 
                  preload="metadata"
                  onError={(e) => { 
                    const target = e.target as HTMLVideoElement;
                    target.style.display = 'none'; 
                    target.nextElementSibling?.classList.remove('hidden'); 
                  }} 
                />
                <div className="hidden absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <VideoOff className="h-8 w-8" />
                  <span className="text-xs">Preview unavailable — video is still attached</span>
                </div>
                <button
                  onClick={() => removeMedia(i)}
                  className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors"
                  aria-label="Remove video"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {mediaUrls.length === 0 && !uploading && (
          <label className="flex h-56 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-surface-border hover:border-gold/40 transition-colors bg-surface/30">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10">
              <VideoIcon className="h-7 w-7 text-gold" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white">
                Tap to select {type === 'spotlight' ? 'reel' : 'video'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                MP4, WebM, MOV · max {MAX_FILE_SIZE_MB} MB · up to {maxSeconds}s
              </p>
              {type === 'spotlight' && (
                <p className="text-[11px] text-gold/70 mt-1">
                  Spotlights are short vertical reels — keep them punchy!
                </p>
              )}
            </div>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="video/mp4,video/webm,video/quicktime,video/3gpp,video/*" 
              onChange={handleFileSelect} 
              className="hidden" 
            />
          </label>
        )}
      </div>

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
