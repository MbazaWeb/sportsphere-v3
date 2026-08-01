'use client';

import { useAppStore, type MockUserData, getMockUser, formatCount, MOCK_USERS } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MapPin, Calendar, ShieldCheck, Heart,
  MessageCircle, Share2, Bookmark, UserPlus, UserMinus,
  ImageIcon, Video
} from 'lucide-react';
import { useState } from 'react';

type UserContentTab = 'posts' | 'media' | 'spotlight';

const userTabs: { id: UserContentTab; label: string }[] = [
  { id: 'posts', label: 'Posts' },
  { id: 'media', label: 'Media' },
  { id: 'spotlight', label: 'Spotlight' },
];

const mockUserPosts = [
  { id: 1, content: 'What an incredible match day! The atmosphere was unreal.', time: '2h ago', likes: 234, comments: 45 },
  { id: 2, content: 'My prediction for tonight: 3-1 to the home side. Who agrees?', time: '1d ago', likes: 89, comments: 123 },
  { id: 3, content: 'Just arrived at the stadium. Buzzing for this one!', time: '3d ago', likes: 567, comments: 78 },
];

export default function UserProfileViewer() {
  const viewingUser = useAppStore((s) => s.viewingUser);
  const setViewingUser = useAppStore((s) => s.setViewingUser);
  const [activeTab, setActiveTab] = useState<UserContentTab>('posts');
  const [likesMap, setLikesMap] = useState<Record<number, boolean>>({});
  const [isFollowing, setIsFollowing] = useState(false);

  if (!viewingUser) return null;

  const user = viewingUser;

  const toggleLike = (postId: number) => {
    setLikesMap(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  return (
    <div className="fixed inset-0 z-40 bg-background overflow-y-auto scrollbar-hide">
      <motion.div
        key={user.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="mx-auto max-w-lg min-h-screen"
      >
        {/* Cover Image */}
        <div className={cn('relative h-44 w-full bg-gradient-to-b', user.coverGradient)}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

          {/* Back button */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
            <button
              onClick={() => setViewingUser(null)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-md transition-colors hover:bg-black/70"
            >
              <ArrowLeft className="h-4 w-4 text-white" />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-md transition-colors hover:bg-black/70">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="relative -mt-14 px-4">
          <div className="flex items-end gap-4">
            {/* Avatar */}
            <div className={cn(
              'relative flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full border-4 border-background text-2xl font-bold',
              user.isVerified ? 'bg-sport-green text-black' : 'bg-surface-elevated text-white'
            )}>
              {user.avatar}
              {user.isVerified && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-background">
                  <ShieldCheck className="h-5 w-5 text-sport-green" />
                </span>
              )}
            </div>

            {/* Name + Role */}
            <div className="mb-1 flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="truncate text-lg font-bold text-white">{user.name}</h1>
                {user.isVerified && <ShieldCheck className="h-4.5 w-4.5 text-sport-green flex-shrink-0" />}
              </div>
              {user.role && (
                <p className="truncate text-sm text-muted-foreground">{user.role}</p>
              )}
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="mt-3 text-sm leading-relaxed text-foreground/80">{user.bio}</p>
          )}

          {/* Meta info */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-sm text-muted-foreground">{user.handle}</span>
            {user.location && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {user.location}
              </span>
            )}
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Joined {user.joined}
            </span>
          </div>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-surface-elevated border border-surface-border p-3 text-center">
              <p className="text-sm font-bold text-white">{formatCount(user.followers)}</p>
              <p className="text-[10px] font-medium text-muted-foreground uppercase">Followers</p>
            </div>
            <div className="rounded-xl bg-surface-elevated border border-surface-border p-3 text-center">
              <p className="text-sm font-bold text-white">{formatCount(user.following)}</p>
              <p className="text-[10px] font-medium text-muted-foreground uppercase">Following</p>
            </div>
            <div className="rounded-xl bg-surface-elevated border border-surface-border p-3 text-center">
              <p className="text-sm font-bold text-white">{formatCount(user.posts)}</p>
              <p className="text-[10px] font-medium text-muted-foreground uppercase">Posts</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setIsFollowing(!isFollowing)}
              className={cn(
                'flex-1 rounded-xl py-2.5 text-sm font-semibold transition-colors',
                isFollowing
                  ? 'bg-surface border border-surface-border text-muted-foreground hover:text-white'
                  : 'bg-sport-green text-black hover:bg-sport-green/90'
              )}
            >
              {isFollowing ? (
                <span className="flex items-center justify-center gap-1.5">
                  <UserMinus className="h-4 w-4" />
                  Following
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  <UserPlus className="h-4 w-4" />
                  Follow
                </span>
              )}
            </button>
            <button className="flex items-center justify-center rounded-xl bg-surface border border-surface-border px-4 transition-colors hover:bg-surface-elevated">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="mt-4 sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-surface-border">
          <div className="flex gap-1 px-4 py-2">
            {userTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative flex-1 rounded-lg py-2 text-sm font-semibold transition-colors',
                  activeTab === tab.id
                    ? 'bg-sport-green text-black'
                    : 'bg-surface text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Posts Content */}
        <div className="p-4 flex flex-col gap-3 pb-20">
          {activeTab === 'posts' && mockUserPosts.map((post) => (
            <article key={post.id} className="rounded-xl bg-surface-elevated border border-surface-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                  user.isVerified ? 'bg-sport-green text-black' : 'bg-surface text-white'
                )}>
                  {user.avatar}
                </div>
                <span className="text-sm font-semibold text-white">{user.name}</span>
                <span className="text-xs text-muted-foreground">&middot; {post.time}</span>
              </div>
              <p className="mb-2 text-sm text-foreground/90">{post.content}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <button
                  onClick={() => toggleLike(post.id)}
                  className={cn(
                    'flex items-center gap-1 transition-colors',
                    likesMap[post.id] ? 'text-pink-400' : 'hover:text-pink-400'
                  )}
                >
                  <Heart className={cn('h-3.5 w-3.5', likesMap[post.id] && 'fill-current')} />
                  {post.likes + (likesMap[post.id] ? 1 : 0)}
                </button>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {post.comments}
                </span>
                <button className="hover:text-sport-green transition-colors">
                  <Share2 className="h-3.5 w-3.5" />
                </button>
                <button className="hover:text-sport-green transition-colors">
                  <Bookmark className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}

          {activeTab === 'media' && (
            <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square bg-surface-elevated flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'spotlight' && (
            <div className="flex flex-col items-center justify-center py-10">
              <Video className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No spotlight videos yet</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
