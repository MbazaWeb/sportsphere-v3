import { apiFetch } from '@/lib/api';
'use client';

import { useState } from 'react';
import { type ProfileTypeConfig, type ProfileTypeId } from './profileConfig';
import ProfileHeader from './ProfileHeader';
import { ProfileTabs } from './ProfileTabs';
import TabContent from './TabContent';
import { motion } from 'framer-motion';

interface ProfilePageProps {
  config: ProfileTypeConfig;
  onBack?: () => void;
  initialTab?: string;
}

export default function ProfilePage({ config, onBack, initialTab }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState(initialTab || 'overview');
  const [isFollowing, setIsFollowing] = useState(false);

  const handleAction = (actionId: string) => {
    if (actionId === 'follow' || actionId === 'join') {
      setIsFollowing(!isFollowing);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <motion.div
        key={config.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col"
      >
        {/* Header - shared across all profiles (includes 4-counter stats for players) */}
        <div className="pb-4">
          <ProfileHeader
            config={config}
            onBack={onBack}
            onAction={handleAction}
            isFollowing={isFollowing}
          />
        </div>

        {/* Tabs */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl">
          <ProfileTabs
            tabs={config.tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Tab Content */}
        <TabContent
          config={config}
          tabId={activeTab}
        />
      </motion.div>
    </div>
  );
}