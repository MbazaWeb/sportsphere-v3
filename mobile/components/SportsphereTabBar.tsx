/**
 * SportsphereTabBar — matches web BottomNav exactly
 * ---------------------------------------------
 *   - Dark background #0A1628 with top border rgba(255,255,255,0.08)
 *   - Gold (#F5C518) active tint, rgba(255,255,255,0.5) inactive
 *   - 5 tabs: Home, Scores, Create (+PlusCircle bigger), Activity, Profile
 *   - Active tab gets a gold top indicator line (2px height)
 *   - Labels shown below icons in 10px font
 *   - Height 64px + safe area padding
 */

import { Pressable, View, Text, Platform, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { LucideIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

type TabConfig = {
  name: string;
  title: string;
  Icon: LucideIcon;
};

interface Props extends BottomTabBarProps {
  tabs: TabConfig[];
}

export default function SportsphereTabBar({ state, descriptors, navigation, tabs }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 8),
          height: 64 + Math.max(insets.bottom, 8),
        },
      ]}
    >
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const tab = tabs.find((t) => t.name === route.name);
          if (!tab) return null;
          const { Icon, title } = tab;

          const { options } = descriptors[route.key];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={styles.tab}
            >
              <View style={styles.tabInner}>
                <ActiveIndicator visible={isFocused} />
                <Icon
                  color={isFocused ? '#F5C518' : 'rgba(255, 255, 255, 0.5)'}
                  size={route.name === 'create' ? 26 : 22}
                />
                <Text
                  style={[
                    styles.label,
                    { color: isFocused ? '#F5C518' : 'rgba(255, 255, 255, 0.5)' },
                  ]}
                >
                  {title}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ActiveIndicator({ visible }: { visible: boolean }) {
  const style = useAnimatedStyle(() => ({
    opacity: withSpring(visible ? 1 : 0, { stiffness: 500, damping: 30 }),
    transform: [{ scaleX: withSpring(visible ? 1 : 0.5, { stiffness: 500, damping: 30 }) }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.indicator, style]}
    />
  );
}

const GOLD = '#F5C518';
const BG = '#0A1628';
const MUTED = 'rgba(255, 255, 255, 0.5)';
const BORDER = 'rgba(255, 255, 255, 0.08)';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: BG,
    borderTopColor: BORDER,
    borderTopWidth: 1,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
    paddingVertical: 8,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    fontWeight: '600' as const,
  },
  indicator: {
    position: 'absolute',
    top: -12,
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 1,
    backgroundColor: GOLD,
  },
});
