'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaEditorProps {
  type: 'photo' | 'video' | 'spotlight';
  file: File;
  objectUrl: string;
  onSave: (file: File) => void;
  onCancel: () => void;
}

export function MediaEditor({ type, file, objectUrl, onSave, onCancel }: MediaEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [activeFilter, setActiveFilter] = useState('none');
  const [uploading, setUploading] = useState(false);

  const FILTERS: Record<string, string> = {
    none: '',
    vivid: 'saturate(1.8) contrast(1.1)',
    muted: 'saturate(0.6) brightness(1.05)',
    warm: 'sepia(0.3) saturate(1.4) brightness(1.05)',
    cool: 'hue-rotate(20deg) saturate(1.2)',
    noir: 'grayscale(1) contrast(1.3)',
    fade: 'brightness(1.1) contrast(0.85) saturate(0.8)',
    golden: 'sepia(0.5) saturate(1.6) brightness(1.1)',
    dramatic: 'contrast(1.4) saturate(1.3) brightness(0.9)',
  };

  const getFilterString = () => {
    const base = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    const preset = FILTERS[activeFilter] || '';
    return preset ? `${base} ${preset}` : base;
  };

  const resetEditor = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setRotation(0);
    setActiveFilter('none');
  };

  const handleSave = async () => {
    if (type === 'photo' && canvasRef.current) {
      setUploading(true);
      try {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const img = new Image();
          img.src = objectUrl;
          await new Promise(r => { img.onload = r; });
          
          const rad = (rotation * Math.PI) / 180;
          const sin = Math.abs(Math.sin(rad));
          const cos = Math.abs(Math.cos(rad));
          
          canvas.width = img.width * cos + img.height * sin;
          canvas.height = img.width * sin + img.height * cos;
          
          ctx.filter = getFilterString();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(rad);
          ctx.drawImage(img, -img.width / 2, -img.height / 2);
          
          const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.92));
          if (blob) {
            const newFile = new File([blob], file.name, { type: 'image/jpeg' });
            onSave(newFile);
          }
        }
      } catch (err) {
        console.error('Error editing image:', err);
        onSave(file);
      }
      setUploading(false);
    } else {
      // Video or unedited photo
      onSave(file);
    }
  };

  // Render canvas on load
  useEffect(() => {
    if (type === 'photo' && canvasRef.current) {
      const img = new Image();
      img.src = objectUrl;
      img.onload = () => {
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
          }
        }
      };
    }
  }, [objectUrl, type]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface-elevated rounded-2xl border border-surface-border overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-surface-border flex items-center justify-between sticky top-0 bg-surface-elevated">
          <h3 className="text-lg font-bold text-white">
            {type === 'photo' ? 'Edit Photo' : 'Edit Video'}
          </h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-surface rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4">
          {type === 'photo' ? (
            <div className="relative rounded-xl overflow-hidden bg-black/40">
              <canvas ref={canvasRef} className="w-full h-auto max-h-96 object-contain" />
            </div>
          ) : (
            <video
              src={objectUrl}
              className="w-full max-h-96 rounded-xl object-contain bg-black/40"
              controls
              autoPlay
              playsInline
            />
          )}

          {/* Editor Controls - Only for photos */}
          {type === 'photo' && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Brightness: {brightness}%</label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Contrast: {contrast}%</label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Saturation: {saturation}%</label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Rotation: {rotation}°</label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <button
                onClick={resetEditor}
                className="text-xs text-gold hover:text-gold/80"
              >
                Reset all
              </button>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-surface-border flex gap-3 sticky bottom-0 bg-surface-elevated">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-surface border border-surface-border text-white font-semibold hover:bg-surface-elevated transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={uploading}
            className="flex-1 py-3 rounded-xl bg-gold text-black font-bold hover:bg-gold/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              'Done ✓'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
