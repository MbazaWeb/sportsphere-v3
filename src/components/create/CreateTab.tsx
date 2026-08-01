'use client';

import { useAppStore } from '@/store/useAppStore';
import { motion } from 'framer-motion';
import { FileText, ImageIcon, Video, Play, BarChart3, Target, X } from 'lucide-react';

const createOptions = [
  {
    id: 'post',
    label: 'Post',
    description: 'Text, media, hashtags, mentions',
    icon: FileText,
    color: 'text-sport-green',
  },
  {
    id: 'photo',
    label: 'Photo',
    description: 'Single or carousel images',
    icon: ImageIcon,
    color: 'text-blue-400',
  },
  {
    id: 'video',
    label: 'Video',
    description: 'Upload and share videos',
    icon: Video,
    color: 'text-purple-400',
  },
  {
    id: 'spotlight',
    label: 'Spotlight',
    description: 'Short-form vertical video',
    icon: Play,
    color: 'text-pink-400',
  },
  {
    id: 'poll',
    label: 'Poll',
    description: 'Ask questions, get votes',
    icon: BarChart3,
    color: 'text-yellow-400',
  },
  {
    id: 'prediction',
    label: 'Prediction',
    description: 'Predict match outcomes',
    icon: Target,
    color: 'text-orange-400',
  },
];

export default function CreateTab() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const setLoginModalOpen = useAppStore((s) => s.setLoginModalOpen);
  const setLoginTrigger = useAppStore((s) => s.setLoginTrigger);
  const createModalOpen = useAppStore((s) => s.createModalOpen);
  const setCreateModalOpen = useAppStore((s) => s.setCreateModalOpen);
  const activeCreateType = useAppStore((s) => s.activeCreateType);
  const setActiveCreateType = useAppStore((s) => s.setActiveCreateType);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-6 pt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm rounded-3xl bg-surface-elevated border border-surface-border p-8 text-center"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-sport-green/10">
            <svg className="h-8 w-8 text-sport-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-bold text-white">Join SportSphere</h2>
          <p className="mb-8 text-sm text-muted-foreground">
            Create posts, videos, polls and predictions. Connect with millions of sports fans worldwide.
          </p>

          <div className="flex flex-col gap-3">
            <button className="flex h-12 items-center justify-center gap-3 rounded-xl bg-surface border border-surface-border text-sm font-semibold text-white transition-colors hover:bg-surface-elevated">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
            <button className="flex h-12 items-center justify-center gap-3 rounded-xl bg-surface border border-surface-border text-sm font-semibold text-white transition-colors hover:bg-surface-elevated">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 21.99 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 21.99C7.79 22.03 6.8 20.68 5.96 19.47C4.25 16.97 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
              </svg>
              Continue with Apple
            </button>
            <button className="flex h-12 items-center justify-center gap-3 rounded-xl bg-surface border border-surface-border text-sm font-semibold text-white transition-colors hover:bg-surface-elevated">
              <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Continue with Email
            </button>
          </div>

          <div className="mt-6">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <button
                onClick={() => {
                  setLoginTrigger('create');
                  setLoginModalOpen(true);
                }}
                className="text-sport-green font-semibold hover:underline"
              >
                Sign In
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Authenticated - show create options
  return (
    <div className="mx-auto max-w-lg">
      {/* Modal overlay when a create type is selected */}
      {createModalOpen && activeCreateType && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="w-full max-w-lg rounded-t-3xl bg-surface-elevated border-t border-surface-border p-6"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white capitalize">{activeCreateType}</h2>
              <button
                onClick={() => {
                  setCreateModalOpen(false);
                  setActiveCreateType(null);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface hover:bg-surface-border transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <textarea
              className="w-full min-h-[120px] resize-none rounded-xl bg-surface border border-surface-border p-4 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-sport-green"
              placeholder={
                activeCreateType === 'post'
                  ? 'What\'s on your mind?'
                  : activeCreateType === 'prediction'
                  ? 'Make your prediction...'
                  : activeCreateType === 'poll'
                  ? 'Ask a question...'
                  : 'Add a caption...'
              }
            />

            <div className="mt-3 flex items-center gap-3">
              <button className="flex h-10 items-center gap-2 rounded-xl bg-surface border border-surface-border px-4 text-sm text-muted-foreground hover:text-white transition-colors">
                <ImageIcon className="h-4 w-4" />
                <span>Photo</span>
              </button>
              <button className="flex h-10 items-center gap-2 rounded-xl bg-surface border border-surface-border px-4 text-sm text-muted-foreground hover:text-white transition-colors">
                <Video className="h-4 w-4" />
                <span>Video</span>
              </button>
              <button className="flex h-10 items-center gap-2 rounded-xl bg-surface border border-surface-border px-4 text-sm text-muted-foreground hover:text-white transition-colors">
                <BarChart3 className="h-4 w-4" />
                <span>Poll</span>
              </button>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => {
                  setCreateModalOpen(false);
                  setActiveCreateType(null);
                }}
                className="flex-1 rounded-xl bg-surface border border-surface-border py-3 text-sm font-semibold text-muted-foreground hover:text-white transition-colors"
              >
                Draft
              </button>
              <button
                onClick={() => {
                  setCreateModalOpen(false);
                  setActiveCreateType(null);
                }}
                className="flex-1 rounded-xl bg-sport-green py-3 text-sm font-bold text-black hover:bg-sport-green/90 transition-colors"
              >
                Post
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create options grid */}
      <div className="p-4">
        <h2 className="mb-1 text-xl font-bold text-white">Create</h2>
        <p className="mb-6 text-sm text-muted-foreground">Share your sports content with the world</p>

        <div className="grid grid-cols-2 gap-3">
          {createOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                setActiveCreateType(option.id);
                setCreateModalOpen(true);
              }}
              className="flex flex-col items-center gap-3 rounded-2xl bg-surface-elevated border border-surface-border p-6 text-left transition-all hover:border-surface-border/80 hover:bg-surface"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-surface ${option.color}`}>
                <option.icon className="h-6 w-6" />
              </div>
              <div className="w-full">
                <p className="text-sm font-semibold text-white">{option.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{option.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
