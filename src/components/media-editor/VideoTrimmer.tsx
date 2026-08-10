'use client';

import { useRef, useState, useEffect } from 'react';
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
    if (videoRef.current) {
      videoRef.current.onloadedmetadata = () => {
        const dur = videoRef.current!.duration;
        setDuration(dur);
        if (dur > MAX_DURATION) {
          setEndTime(MAX_DURATION);
        } else {
          setEndTime(dur);
        }
      };
    }
  }, [objectUrl, file.type, type]);

  useEffect(() => {
    if (videoRef.current && isPlaying) {
      if (currentTime >= endTime) {
        videoRef.current.pause();
        setIsPlaying(false);
        setCurrentTime(endTime);
      }
    }
  }, [currentTime, endTime, isPlaying]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (currentTime >= endTime) {
        videoRef.current.currentTime = startTime;
        setCurrentTime(startTime);
      }
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    setCurrentTime(time);
    if (isPlaying && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleMouseDown = (trimType: 'start' | 'end') => (e: React.MouseEvent) => {
    e.preventDefault();
    if (trimType === 'start') setIsDraggingStart(true);
    else setIsDraggingEnd(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const newTime = Math.max(0, Math.min(duration, x * duration));

      if (isDraggingStart) {
        const clamped = Math.min(newTime, endTime - 0.5);
        setStartTime(clamped);
        if (videoRef.current && videoRef.current.currentTime < clamped) {
          videoRef.current.currentTime = clamped;
          setCurrentTime(clamped);
        }
      } else if (isDraggingEnd) {
        const clamped = Math.max(newTime, startTime + 0.5);
        setEndTime(Math.min(clamped, MAX_DURATION));
        if (videoRef.current && videoRef.current.currentTime > clamped) {
          videoRef.current.currentTime = clamped;
          setCurrentTime(clamped);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingStart(false);
      setIsDraggingEnd(false);
    };

    if (isDraggingStart || isDraggingEnd) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingStart, isDraggingEnd, duration, startTime, endTime, type]);

  // --- Trim using MediaRecorder + canvas capture (browser-native, no FFmpeg needed) ---
  const handleTrimAndSave = async () => {
    const isTrimmed = startTime > 0.1 || endTime < duration - 0.1;
    
    if (!isTrimmed) {
      onSave(file);
      return;
    }

    setIsProcessing(true);
    setProcessingMsg('Preparing video trimmer...');

    try {
 const trimDuration = endTime - startTime;
  const video = document.createElement('video');
  video.src = objectUrl;
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Failed to load video'));
  });

  video.currentTime = startTime;
  await new Promise<void>(resolve => { video.onseeked = () => resolve(); });

  setProcessingMsg('Trimming video...');

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  const ctx = canvas.getContext('2d')!;

  // Use the best available codec
  let mimeType = 'video/webm;codecs=vp9,opus';
  if (typeof MediaRecorder !== 'undefined' && !MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm;codecs=vp8,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4';
      }
    }
  }

  const stream = canvas.captureStream(30);

  // Try to capture audio from the original video
  try {
 const audioCtx = new AudioContext();
    const source = audioCtx.createMediaElementSource(video);
    const dest = audioCtx.createMediaStreamDestination();
    source.connect(dest);
    source.connect(audioCtx.destination);
    dest.stream.getAudioTracks().forEach(track => stream.addTrack(track));
  } catch {
    // Audio capture may fail (e.g. CORS) — continue without audio
  }

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 2500000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const blob = await new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      resolve(new Blob(chunks, { type: mimeType }));
    };
    recorder.onerror = () => reject(new Error('Recording failed'));
    recorder.start(100); // collect data every 100ms

    video.play();

    const checkEnd = () => {
      if (video.currentTime >= endTime || video.ended) {
        video.pause();
        recorder.stop();
        stream.getTracks().forEach(t => t.stop());
      } else {
        requestAnimationFrame(checkEnd);
      }
    };
    requestAnimationFrame(checkEnd);
  });

  const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
  const trimmedFile = new File([blob], file.name.replace(/\.[^.]+$/, `.${ext}`), { type: mimeType });
  setIsProcessing(false);
  setProcessingMsg('');
  onSave(trimmedFile);

    } catch (err) {
      console.error('Trim processing error:', err);
      // Fallback: pass original file through if trimming fails
      setIsProcessing(false);
      setProcessingMsg('');
      onSave(file);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getTrimPercentage = (time: number) => (duration > 0 ? (time / duration) * 100 : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-surface-elevated rounded-2xl border border-surface-border overflow-hidden shadow-2xl">
        
        <div className="p-4 border-b border-surface-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="h-4 w-4 text-gold" />
            <h3 className="text-lg font-bold text-white">Trim Video</h3>
            <span className="text-xs text-muted-foreground ml-1">({Math.round(endTime - startTime)}s)</span>
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
                if (!containerRef.current) return;
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
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 h-4 w-2 bg-gold rounded-sm cursor-ew-resize z-10 hover:scale-125 transition-transform",
                    isDraggingStart && "scale-125 ring-2 ring-gold/50"
                  )}
                  style={{ left: `${getTrimPercentage(startTime)}%` }}
                />
                <div
                  onMouseDown={handleMouseDown('end')}
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 h-4 w-2 bg-gold rounded-sm cursor-ew-resize z-10 hover:scale-125 transition-transform",
                    isDraggingEnd && "scale-125 ring-2 ring-gold/50"
                  )}
                  style={{ left: `${getTrimPercentage(endTime)}%` }}
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
                  Apply & Continue
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
