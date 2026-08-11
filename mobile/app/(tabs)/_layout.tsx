/**
 * Tab Layout — 5 tabs matching web BottomNav exactly
 * Home (Home icon), Scores (Trophy), Create (PlusCircle), Activity (Bell), Profile (User)
 * Active tab is gold (#F5C518) with a gold top indicator line.
 * Inactive is muted rgba(255,255,255,0.5).
 * Tab bar has dark background (#0A1628) with top border.
 * Height 64px. Create icon slightly bigger.
 */

import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { Home, Trophy, PlusCircle, Bell, User } from 'lucide-react-native';

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
          backgroundColor: '#0A1628',
          borderTopColor: 'rgba(255, 255, 255, 0.08)',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          position: 'absolute',
          elevation: 0,
        },
        tabBarActiveTintColor: '#F5C518',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
        tabBarBadgeStyle: {
          backgroundColor: '#F5C518',
          color: '#0A1628',
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
            tabBarIcon: ({ color, size }) => <Icon color={color} size={size} />,
          }}
        />
      ))}
    </Tabs>
  );
}
