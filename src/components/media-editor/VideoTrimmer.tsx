'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { X, Scissors, Play, Pause, Check, Save, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoTrimmerProps {
  file: File;
  objectUrl: string;
  type: 'video' | 'spotlight';
  onSave: (file: File) => void;
  onCancel: () => void;
}

export function VideoTrimmer({ file, objectUrl, type, onSave, onCancel }: VideoTrimmerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState('');

  const MAX_DURATION = type === 'spotlight' ? 30 : 60;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleMeta = () => {
      const dur = video!.duration;
      if (!isFinite(dur) || dur <= 0) return;
      setDuration(dur);
      setEndTime(dur > MAX_DURATION ? MAX_DURATION : dur);
      setCurrentTime(0);
      setStartTime(0);
    };
    
    video.addEventListener('loadedmetadata', handleMeta);
    // If already loaded (cached)
    if (video.readyState >= 1) handleMeta();
    
    return () => video.removeEventListener('loadedmetadata', handleMeta);
  }, [objectUrl, type]);

  // Pause when reaching the trim end
  useEffect(() => {
    if (!videoRef.current || !isPlaying) return;
    if (currentTime >= endTime - 0.1) {
      videoRef.current.pause();
      setIsPlaying(false);
      setCurrentTime(endTime);
    }
  }, [currentTime, endTime, isPlaying]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      if (currentTime >= endTime) {
        video.currentTime = startTime;
        setCurrentTime(startTime);
      }
      video.play().catch(() => {
        // Autoplay blocked — user needs to interact
      });
      setIsPlaying(true);
    }
  }, [isPlaying, currentTime, endTime, startTime]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    setCurrentTime(time);
  };

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleMouseDown = (trimType: 'start' | 'end') => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (trimType === 'start') setIsDraggingStart(true);
    else setIsDraggingEnd(true);
  };

  // Touch support for trim handles
  const handleTouchStart = (trimType: 'start' | 'end') => (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (trimType === 'start') setIsDraggingStart(true);
    else setIsDraggingEnd(true);
  };

  const updateTrimFromPosition = useCallback((clientX: number) => {
    if (!containerRef.current || !duration) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = x * duration;

    if (isDraggingStart) {
      const clamped = Math.min(newTime, endTime - 0.5);
      setStartTime(Math.max(0, clamped));
      if (videoRef.current && videoRef.current.currentTime < clamped) {
        videoRef.current.currentTime = clamped;
      }
    } else if (isDraggingEnd) {
      const clamped = Math.max(newTime, startTime + 0.5);
      setEndTime(Math.min(clamped, MAX_DURATION, duration));
      if (videoRef.current && videoRef.current.currentTime > clamped) {
        videoRef.current.currentTime = clamped;
      }
    }
  }, [isDraggingStart, isDraggingEnd, duration, startTime, endTime]);

  useEffect(() => {
    if (!isDraggingStart && !isDraggingEnd) return;

    const handleMouseMove = (e: MouseEvent) => updateTrimFromPosition(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) updateTrimFromPosition(e.touches[0].clientX);
    };
    const handleEnd = () => {
      setIsDraggingStart(false);
      setIsDraggingEnd(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDraggingStart, isDraggingEnd, updateTrimFromPosition]);

  // --- Trim using MediaRecorder + canvas capture (browser-native, no FFmpeg needed) ---
  const handleTrimAndSave = async () => {
    const isTrimmed = startTime > 0.5 || endTime < duration - 0.5;
    
    // If not meaningfully trimmed, pass original file directly (safest)
    if (!isTrimmed) {
      onSave(file);
      return;
    }

    setIsProcessing(true);
    setProcessingMsg('Preparing video...');

    try {
      // Create an offscreen video element for trimming
      const trimVideo = document.createElement('video');
      trimVideo.src = objectUrl;
      trimVideo.muted = true;
      trimVideo.playsInline = true;
      trimVideo.preload = 'auto';
      
      // Cross-origin for blob URLs
      trimVideo.crossOrigin = 'anonymous';

      await new Promise<void>((resolve, reject) => {
        trimVideo.onloadedmetadata = () => resolve();
        trimVideo.onerror = () => reject(new Error('Failed to load video for trimming'));
        // Timeout after 15s
        setTimeout(() => reject(new Error('Video load timeout')), 15000);
      });

      trimVideo.currentTime = startTime;
      await new Promise<void>((resolve, reject) => {
        trimVideo.onseeked = () => resolve();
        setTimeout(() => reject(new Error('Seek timeout')), 10000);
      });

      setProcessingMsg('Trimming video...');

      // Check MediaRecorder support
      if (typeof MediaRecorder === 'undefined') {
        throw new Error('MediaRecorder not supported in this browser');
      }

      const canvas = document.createElement('canvas');
      const vw = trimVideo.videoWidth || 1280;
      const vh = trimVideo.videoHeight || 720;
      canvas.width = vw;
      canvas.height = vh;
      const ctx = canvas.getContext('2d')!;

      // Find best supported codec
      const codecCandidates = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
      ];
      let mimeType = '';
      for (const candidate of codecCandidates) {
        if (MediaRecorder.isTypeSupported(candidate)) {
          mimeType = candidate;
          break;
        }
      }
      if (!mimeType) {
        throw new Error('No supported video codec found. Try uploading without trimming.');
      }

      const stream = canvas.captureStream(30);

      // Try to capture audio (best-effort, fails silently)
      try {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaElementSource(trimVideo);
        const dest = audioCtx.createMediaStreamDestination();
        source.connect(dest);
        source.connect(audioCtx.destination);
        dest.stream.getAudioTracks().forEach(track => stream.addTrack(track));
      } catch {
        // Audio capture failed (CORS, etc.) — continue without audio
        console.warn('Audio capture failed during trim, continuing without audio');
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      setProcessingMsg('Recording trimmed clip...');

      const blob = await new Promise<Blob>((resolve, reject) => {
        const timeout = setTimeout(() => {
          recorder.stop();
          trimVideo.pause();
          stream.getTracks().forEach(t => t.stop());
          reject(new Error('Trim recording timed out'));
        }, (endTime - startTime) * 1000 + 15000); // trim duration + 15s buffer

        recorder.onstop = () => {
          clearTimeout(timeout);
          if (chunks.length === 0) {
            reject(new Error('No video data was recorded'));
            return;
          }
          resolve(new Blob(chunks, { type: mimeType }));
        };
        recorder.onerror = (e) => {
          clearTimeout(timeout);
          reject(new Error('Recording failed'));
        };
        
        recorder.start(200);
        trimVideo.play().catch(() => {});

        const checkEnd = () => {
          if (trimVideo.currentTime >= endTime || trimVideo.ended) {
            trimVideo.pause();
            // Small delay to let final frames process
            setTimeout(() => {
              if (recorder.state === 'recording') {
                recorder.stop();
              }
              stream.getTracks().forEach(t => t.stop());
            }, 300);
          } else {
            requestAnimationFrame(checkEnd);
          }
        };
        requestAnimationFrame(checkEnd);
      });

      const ext = mimeType.includes('webm') ? 'webm' : 'mp4';
      const trimmedFile = new File(
        [blob],
        file.name.replace(/\.[^.]+$/, `.${ext}`),
        { type: mimeType }
      );
      
      setIsProcessing(false);
      setProcessingMsg('');
      onSave(trimmedFile);

    } catch (err) {
      console.error('Trim processing error:', err);
      // Fallback: pass original file through untrimmed
      setIsProcessing(false);
      setProcessingMsg('');
      console.warn('Trim failed, uploading original video instead');
      onSave(file);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getTrimPercentage = (time: number) => (duration > 0 ? (time / duration) * 100 : 0);

  const trimDuration = Math.max(0, endTime - startTime);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      style={{ touchAction: 'none' }}>
      <div className="w-full max-w-2xl bg-surface-elevated rounded-2xl border border-surface-border overflow-hidden shadow-2xl"
        style={{ touchAction: 'pan-y' }}>
        
        <div className="p-4 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="h-4 w-4 text-gold" />
            <h3 className="text-lg font-bold text-white">Trim Video</h3>
            <span className="text-xs text-muted-foreground ml-1">({Math.round(trimDuration)}s)</span>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-surface rounded-full transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 bg-black/40">
          <video
            ref={videoRef}
            src={objectUrl}
            className="w-full rounded-xl aspect-video bg-black object-contain"
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            playsInline
          />
        </div>

        <div className="p-4 pt-0">
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={togglePlay}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-black hover:bg-gold/90 transition-colors flex-shrink-0"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </button>
            
            <span className="text-xs text-muted-foreground font-mono w-12 text-center">
              {formatTime(currentTime)}
            </span>

            <div 
              ref={containerRef}
              className="flex-1 relative h-8 flex items-center cursor-pointer group"
              onClick={(e) => {
                if (!containerRef.current || !duration) return;
                const rect = containerRef.current.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width;
                const time = Math.max(0, Math.min(duration, x * duration));
                if (videoRef.current) videoRef.current.currentTime = time;
                setCurrentTime(time);
              }}
            >
              <div className="w-full h-1.5 bg-surface-border rounded-full relative">
                <div 
                  className="absolute top-0 left-0 h-full bg-gold rounded-full transition-all"
                  style={{ width: `${getTrimPercentage(currentTime)}%` }}
                />
                <div 
                  className="absolute top-0 h-full bg-gold/20 rounded-full pointer-events-none"
                  style={{ 
                    left: `${getTrimPercentage(startTime)}%`, 
                    width: `${getTrimPercentage(endTime - startTime)}%` 
                  }}
                />
                <div
                  onMouseDown={handleMouseDown('start')}
                  onTouchStart={handleTouchStart('start')}
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 h-5 w-3 bg-gold rounded-sm cursor-ew-resize z-10 hover:scale-125 active:scale-125 transition-transform",
                    isDraggingStart && "scale-125 ring-2 ring-gold/50"
                  )}
                  style={{ left: `calc(${getTrimPercentage(startTime)}% - 6px)` }}
                />
                <div
                  onMouseDown={handleMouseDown('end')}
                  onTouchStart={handleTouchStart('end')}
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 h-5 w-3 bg-gold rounded-sm cursor-ew-resize z-10 hover:scale-125 active:scale-125 transition-transform",
                    isDraggingEnd && "scale-125 ring-2 ring-gold/50"
                  )}
                  style={{ left: `calc(${getTrimPercentage(endTime)}% - 6px)` }}
                />
              </div>
            </div>

            <span className="text-xs text-muted-foreground font-mono w-12 text-center">
              {formatTime(endTime)}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground px-1">
            <div className="flex items-center gap-2">
              <span>Start: <span className="text-white font-mono">{formatTime(startTime)}</span></span>
              <span className="text-surface-border">|</span>
              <span>End: <span className="text-white font-mono">{formatTime(endTime)}</span></span>
            </div>
            <div className="flex items-center gap-1 text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
              Max {MAX_DURATION}s
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => {
                setStartTime(0);
                setEndTime(Math.min(duration, MAX_DURATION));
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  setCurrentTime(0);
                }
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-surface border border-surface-border px-4 py-2.5 text-sm font-semibold text-white hover:bg-surface-elevated transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>

            <button
              onClick={handleTrimAndSave}
              disabled={isProcessing}
              className="flex-1 rounded-xl bg-gold py-2.5 text-sm font-bold text-black hover:bg-gold/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  {processingMsg || 'Processing...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {trimDuration < duration - 0.5 ? 'Apply Trim & Continue' : 'Use Original & Continue'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
