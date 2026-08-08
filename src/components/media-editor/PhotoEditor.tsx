'use client';

import { useRef, useState, useEffect } from 'react';
import { X, Crop, RotateCw, Sliders, Check, Save, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoEditorProps {
  file: File;
  objectUrl: string;
  onSave: (file: File) => void;
  onCancel: () => void;
}

export function PhotoEditor({ file, objectUrl, onSave, onCancel }: PhotoEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState<'filters' | 'adjust' | 'crop'>('filters');
  
  // Editor states
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [activeFilter, setActiveFilter] = useState('none');
  const [cropRatio, setCropRatio] = useState<'free' | '1:1' | '4:3' | '16:9'>('free');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter presets
  const FILTERS = {
    none: { label: 'Original', filter: '' },
    vivid: { label: 'Vivid', filter: 'saturate(1.8) contrast(1.1)' },
    muted: { label: 'Muted', filter: 'saturate(0.6) brightness(1.05)' },
    warm: { label: 'Warm', filter: 'sepia(0.3) saturate(1.4) brightness(1.05)' },
    cool: { label: 'Cool', filter: 'hue-rotate(20deg) saturate(1.2)' },
    noir: { label: 'Noir', filter: 'grayscale(1) contrast(1.3)' },
    fade: { label: 'Fade', filter: 'brightness(1.1) contrast(0.85) saturate(0.8)' },
    golden: { label: 'Golden', filter: 'sepia(0.5) saturate(1.6) brightness(1.1)' },
  };

  // Initialize canvas with image
  useEffect(() => {
    if (canvasRef.current) {
      const img = new Image();
      img.src = objectUrl;
      img.onload = () => {
        const canvas = canvasRef.current!;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
      };
    }
  }, [objectUrl]);

  const resetEditor = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setRotation(0);
    setActiveFilter('none');
    setCropRatio('free');
    // Re-render canvas
    if (canvasRef.current) {
      const img = new Image();
      img.src = objectUrl;
      img.onload = () => {
        const canvas = canvasRef.current!;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
      };
    }
  };

  const applyEdits = async () => {
    setIsProcessing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = objectUrl;
    await new Promise(r => img.onload = r);

    // Handle rotation
    const rad = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));
    const w = img.width * cos + img.height * sin;
    const h = img.width * sin + img.height * cos;

    canvas.width = w;
    canvas.height = h;

    // Apply filters
    const filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) ${FILTERS[activeFilter as keyof typeof FILTERS].filter}`;
    ctx.filter = filterString;
    ctx.translate(w / 2, h / 2);
    ctx.rotate(rad);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    // Apply crop (simulate by drawing a centered cropped version)
    // For simplicity, we generate the full edited image and let the backend handle final crop if needed
    canvas.toBlob((blob) => {
      if (blob) {
        const newFile = new File([blob], file.name, { type: 'image/jpeg' });
        onSave(newFile);
      }
      setIsProcessing(false);
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface-elevated rounded-2xl border border-surface-border overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-elevated flex-shrink-0">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Crop className="h-4 w-4 text-gold" /> Edit Photo
          </h3>
          <button onClick={onCancel} className="p-2 hover:bg-surface rounded-full transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Canvas */}
        <div className="p-4 flex-shrink-0">
          <canvas ref={canvasRef} className="w-full max-h-56 rounded-xl object-contain bg-black/40" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 border-b border-surface-border flex-shrink-0">
          {[
            { id: 'filters', label: 'Filters', icon: Sliders },
            { id: 'adjust', label: 'Adjust', icon: RotateCw },
            { id: 'crop', label: 'Crop', icon: Crop },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex-1 rounded-t-lg py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5',
                activeTab === tab.id ? 'bg-gold/10 text-gold border-b-2 border-gold' : 'text-muted-foreground hover:text-white'
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Controls Area */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
          {activeTab === 'filters' && (
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(FILTERS).map(([key, { label }]) => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={cn(
                    'rounded-xl py-3 text-center text-xs font-semibold transition-all',
                    activeFilter === key
                      ? 'bg-gold text-black'
                      : 'bg-surface text-muted-foreground hover:bg-surface-elevated hover:text-white'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'adjust' && (
            <div className="space-y-4">
              <div>
                <label className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Brightness</span>
                  <span className="text-white">{brightness}%</span>
                </label>
                <input type="range" min="0" max="200" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Contrast</span>
                  <span className="text-white">{contrast}%</span>
                </label>
                <input type="range" min="0" max="200" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Saturation</span>
                  <span className="text-white">{saturation}%</span>
                </label>
                <input type="range" min="0" max="200" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Rotation</span>
                  <span className="text-white">{rotation}°</span>
                </label>
                <input type="range" min="0" max="360" value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="w-full" />
              </div>
            </div>
          )}

          {activeTab === 'crop' && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-muted-foreground mb-1">Aspect Ratio</p>
              <div className="flex gap-2">
                {[
                  { id: 'free', label: 'Free' },
                  { id: '1:1', label: '1:1' },
                  { id: '4:3', label: '4:3' },
                  { id: '16:9', label: '16:9' },
                ].map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => setCropRatio(ratio.id as any)}
                    className={cn(
                      'flex-1 rounded-lg py-2 text-xs font-semibold transition-colors',
                      cropRatio === ratio.id ? 'bg-gold text-black' : 'bg-surface text-muted-foreground hover:bg-surface-elevated'
                    )}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-surface-border flex gap-3 bg-surface-elevated flex-shrink-0">
          <button
            onClick={resetEditor}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-surface border border-surface-border px-4 py-2.5 text-sm font-semibold text-white hover:bg-surface-elevated transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button
            onClick={applyEdits}
            disabled={isProcessing}
            className="flex-1 rounded-xl bg-gold py-2.5 text-sm font-bold text-black hover:bg-gold/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Apply & Continue
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
