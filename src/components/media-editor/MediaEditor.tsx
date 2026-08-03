'use client';

import { useState } from 'react';
import { VideoTrimmer } from './VideoTrimmer';
import { PhotoEditor } from './PhotoEditor';
import { cn } from '@/lib/utils';
import { X, Download, Check, Loader2, Camera, Video, Wand2 } from 'lucide-react';

interface MediaEditorProps {
  type: 'photo' | 'video' | 'spotlight';
  file: File;
  objectUrl: string;
  onSave: (file: File) => void;
  onCancel: () => void;
}

export function MediaEditor({ type, file, objectUrl, onSave, onCancel }: MediaEditorProps) {
  // State for tracking active tab within the editor
  const [activeTab, setActiveTab] = useState<'edit' | 'filters' | 'crop'>('edit');
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle the final save action
  const handleSave = async (editedFile: File) => {
    setIsProcessing(true);
    try {
      await onSave(editedFile);
    } finally {
      setIsProcessing(false);
    }
  };

  // If it's a video, launch the VideoTrimmer
  if (type === 'video' || type === 'spotlight') {
    return (
      <VideoTrimmer
        file={file}
        objectUrl={objectUrl}
        onSave={handleSave}
        onCancel={onCancel}
      />
    );
  }

  // If it's a photo, launch the PhotoEditor with full toolset
  return (
    <PhotoEditor
      file={file}
      objectUrl={objectUrl}
      onSave={handleSave}
      onCancel={onCancel}
    />
  );
}
