'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store/uiStore';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
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
import { StatsTab } from './tabs/StatsTab';
import { CareerTab } from './tabs/CareerTab';
import { SquadTab } from './tabs/SquadTab';
import { AnalystToolsTab } from './tabs/AnalystToolsTab';
import { FacilitiesTab } from './tabs/FacilitiesTab';
import { ArticlesTab } from './tabs/ArticlesTab';
import { SpotlightTab } from './tabs/SpotlightTab';

export default function UserProfileViewer() {
  const viewingHandle = useUIStore((s) => s.viewingUser?.handle);
  const viewingUser = useUIStore((s) => s.viewingUser);
  const setViewingUser = useUIStore((s) => s.setViewingUser);
  const [following, setFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [peopleListOpen, setPeopleListOpen] = useState<'followers' | 'following' | null>(null);

  const { apiUser, userPosts, loading, refresh } = useProfileData(viewingHandle);
  const { containerRef, isRefreshing, pullProgress } = usePullToRefresh({ onRefresh: refresh, threshold: 80 });

  if (!viewingUser) return null;

  const role = apiUser?.role || viewingUser?.role || 'fan';
  const tabs = getTabsForRole(role);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return \m ago;
    if (diff < 86400000) return \h ago;
    return \d ago;
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
        ref={containerRef}
      >
        <div className="mx-auto max-w-lg min-h-screen">
          <ProfileCover coverGradient={viewingUser.coverGradient} pullProgress={pullProgress} isRefreshing={isRefreshing} onBack={() => setViewingUser(null)} />
          <ProfileInfo user={viewingUser} role={role} />
          <ProfileStats followers={viewingUser.followers} following={viewingUser.following} posts={viewingUser.posts} onOpenList={setPeopleListOpen} />
          <ProfileActions role={role} following={following} setFollowing={setFollowing} />
          <ProfileTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="p-4 flex flex-col gap-3 pb-20">
            {activeTab === 'overview' && <OverviewTab apiUser={apiUser} user={viewingUser} role={role} />}
            {activeTab === 'feeds' && <FeedsTab posts={userPosts} loading={loading} avatar={viewingUser.avatar} name={viewingUser.name} verified={viewingUser.verified} formatTime={formatTime} />}
            {activeTab === 'shop' && <ShopTab />}
            {activeTab === 'about' && <AboutTab apiUser={apiUser} user={viewingUser} role={role} />}
            {activeTab === 'stats' && <StatsTab role={role} apiUser={apiUser} />}
            {activeTab === 'career' && <CareerTab />}
            {activeTab === 'squad' && <SquadTab />}
            {activeTab === 'tools' && <AnalystToolsTab />}
            {activeTab === 'facilities' && <FacilitiesTab />}
            {activeTab === 'articles' && <ArticlesTab />}
            {activeTab === 'spotlight' && <SpotlightTab />}
          </div>
        </div>
        {peopleListOpen && apiUser && <PeopleListModal userId={apiUser.id} type={peopleListOpen} onClose={() => setPeopleListOpen(null)} />}
      </motion.div>
    </AnimatePresence>
  );
}
