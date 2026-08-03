import { ShareSheet } from './ShareSheet';
import { CommentSheet } from './CommentSheet';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigationStore } from '@/store/navigationStore';
import { motion } from 'framer-motion';
import { HomeHeader } from './HomeHeader';
import { SportlightsTab } from './SportlightsTab';
import { TrendingTab } from './TrendingTab';

export default function HomeTab() {
  const homeSubTab = useNavigationStore((s) => s.homeSubTab);
  const [shareId, setShareId] = useState<string | null>(null);
  const [commentId, setCommentId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="mx-auto max-w-lg">
      
      <HomeHeader 
        isSearchOpen={isSearchOpen} 
        setIsSearchOpen={setIsSearchOpen} 
        isCartOpen={isCartOpen} 
        setIsCartOpen={setIsCartOpen} 
      />

      <motion.div key={homeSubTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
        {homeSubTab === 'for-you' && (
          <SportlightsTab 
            onShare={setShareId} 
            onComment={setCommentId} 
          />
        )}
        {homeSubTab === 'trending' && <TrendingTab />}
      </motion.div>

      <AnimatePresence>
        {shareId !== null && <ShareSheet onClose={() => setShareId(null)} />}
        {commentId !== null && <CommentSheet itemId={commentId} onClose={() => setCommentId(null)} />}
      </AnimatePresence>
    </div>
  );
}
