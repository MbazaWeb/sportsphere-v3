'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/uiStore';
import { useProfileData } from './useProfileData';
import { ProfileCover } from './ProfileCover';
import { ProfileInfo } from './ProfileInfo';
import { ProfileStats } from './ProfileStats';
import { ProfileActions } from './ProfileActions';
import { ProfileTabs, getTabsForRole } from './ProfileTabs';
import { PeopleListModal } from './PeopleListModal';
import { OverviewTab } from './tabs/OverviewTab';
import { FeedsTab } from './tabs/FeedsTab';
import { ShopTab } from './tabs/ShopTab';
import { AboutTab } from './tabs/AboutTab';
// Engine replaces the 16 RoleContentTab wrappers + StatsTab dispatch
import { RoleTabRenderer } from '@/profile-engine/RoleTabRenderer';
import type { TabId } from '@/profile-engine/types';

export default function UserProfileViewer() {
  const viewingHandle = useUIStore((s) => s.viewingUser?.handle);
  const viewingUser = useUIStore((s) => s.viewingUser);
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const [following, setFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [peopleListOpen, setPeopleListOpen] = useState<'followers' | 'following' | null>(null);

  const { apiUser, userPosts, loading, refresh } = useProfileData(viewingHandle);


  if (!viewingUser) return null;

  const role = apiUser?.role || viewingUser?.role || 'fan';
  const tabs = getTabsForRole(role);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  // Helper: render the active tab. The engine handles per-role tabs.
  // For shared tabs (overview/feeds/about/shop) we keep the existing
  // generic tab components — they're already good enough.
  const renderActiveTab = () => {
    // Shared tabs (engine returns null for these — let the existing
    // generic tab components render them)
    if (activeTab === 'overview') {
      return <OverviewTab apiUser={apiUser} user={viewingUser} role={role} />;
    }
    if (activeTab === 'feeds') {
      return (
        <FeedsTab
          posts={userPosts}
          loading={loading}
          avatar={viewingUser.avatar}
          avatarUrl={viewingUser.avatarUrl}
          name={viewingUser.name}
          verified={viewingUser.verified}
          formatTime={formatTime}
        />
      );
    }
    if (activeTab === 'shop') {
      return <ShopTab />;
    }
    if (activeTab === 'about') {
      return <AboutTab apiUser={apiUser} user={viewingUser} role={role} />;
    }

    // Per-role tabs — dispatch via the Profile Engine
    return (
      <RoleTabRenderer
        role={role}
        tabId={activeTab}
        apiUser={apiUser as any}
        viewerHandle={viewingUser.handle}
      />
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: '100%' }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: '100%' }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={(_, info) => { if (info.offset.x > 80) setViewingUser(null); }}
        className="fixed inset-0 z-40 bg-background overflow-y-auto touch-pan-y"
      >
        <div className="mx-auto max-w-lg min-h-screen">
          <ProfileCover coverGradient={viewingUser.coverGradient} onBack={() => setViewingUser(null)} />
          <ProfileInfo user={viewingUser} role={role} />
          <ProfileStats followers={viewingUser.followers} following={viewingUser.following} posts={viewingUser.posts} onOpenList={setPeopleListOpen} />
          <ProfileActions role={role} following={following} setFollowing={setFollowing} />
          <ProfileTabs tabs={tabs} activeTab={activeTab} onTabChange={(t) => setActiveTab(t as TabId)} />
          <div className="p-4 flex flex-col gap-3 pb-20">
            {renderActiveTab()}
          </div>
        </div>
        {peopleListOpen && apiUser && <PeopleListModal userId={apiUser.id} type={peopleListOpen} onClose={() => setPeopleListOpen(null)} />}
      </motion.div>
    </AnimatePresence>
  );
}
