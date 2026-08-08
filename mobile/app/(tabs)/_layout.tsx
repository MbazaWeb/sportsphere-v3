/**
 * Sportsphere Mobile — Tab Layout
 * -------------------------------
 * 5 tabs mirroring the web BottomNav: Home, Scores, Create, Activity, Profile.
 * Uses a custom tab bar component (SportsphereTabBar) for brand styling.
 */

import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { Home, Trophy, PlusCircle, Bell, User } from 'lucide-react-native';

import { colors } from '@sportsphere/design-system/tokens';
import SportsphereTabBar from '../../components/SportsphereTabBar';

const TABS = [
  { name: 'index',    title: 'Home',     Icon: Home },
  { name: 'scores',   title: 'Scores',   Icon: Trophy },
  { name: 'create',   title: 'Create',   Icon: PlusCircle },
  { name: 'activity', title: 'Activity', Icon: Bell },
  { name: 'profile',  title: 'Profile',  Icon: User },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: 'rgba(10, 22, 40, 0.95)',
          borderTopColor: colors.cardBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          position: 'absolute',
          elevation: 0,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarBadgeStyle: {
          backgroundColor: colors.primary,
          color: colors.primaryForeground,
        },
      }}
      tabBar={(props) => <SportsphereTabBar {...props} tabs={TABS} />}
    >
      {TABS.map(({ name, title, Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            // Icon is rendered by our custom tab bar; we still provide fallback
            tabBarIcon: ({ color, size }) => <Icon color={color} size={size} />,
          }}
        />
      ))}
    </Tabs>
  );
}
