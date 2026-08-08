'use client';

import { VideoTrimmer } from './VideoTrimmer';
import { PhotoEditor } from './PhotoEditor';

interface MediaEditorProps {
  type: 'photo' | 'video' | 'spotlight';
  file: File;
  objectUrl: string;
  onSave: (file: File) => void;
  onCancel: () => void;
}

export function MediaEditor({ type, file, objectUrl, onSave, onCancel }: MediaEditorProps) {
  if (type === 'video' || type === 'spotlight') {
    return (
      <VideoTrimmer
        file={file}
        objectUrl={objectUrl}
        type={type}
        onSave={onSave}
        onCancel={onCancel}
      />
    );
  }
  return <PhotoEditor file={file} objectUrl={objectUrl} onSave={onSave} onCancel={onCancel} />;
}
