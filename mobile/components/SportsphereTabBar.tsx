/**
 * SportsphereTabBar — branded bottom navigation
 * ---------------------------------------------
 * Replicates the web BottomNav look:
 *   - dark navy translucent background with blur
 *   - gold active tint, muted-foreground inactive
 *   - 5 evenly-spaced icon + label buttons
 *   - active tab gets a gold top border indicator
 *
 * Built directly on top of @react-navigation/bottom-tabs so we get full
 * accessibility + keyboard handling for free.
 */

import { Pressable, View, Text, Platform, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import type { LucideIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { colors, typography } from '@sportsphere/design-system/tokens';

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
                <View style={{ position: 'relative' }}>
                  <Icon
                    color={isFocused ? colors.primary : colors.mutedForeground}
                    size={route.name === 'create' ? 26 : 22}
                  />
                </View>
                <Text
                  style={[
                    styles.label,
                    { color: isFocused ? colors.primary : colors.mutedForeground },
                  ]}
                >
                  {title}
                </Text>
                <ActiveIndicator visible={isFocused} />
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

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10, 22, 40, 0.95)',
    borderTopColor: colors.cardBorder,
    borderTopWidth: 1,
    // RN does not support backdrop-filter; on iOS we could use a BlurView,
    // but the 95%-opaque background reads as the same brand surface.
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
    fontFamily: typography.fontFamily.body.split(',')[0].replace(/'/g, ''),
    fontSize: 10,
    fontWeight: '600',
  },
  indicator: {
    position: 'absolute',
    top: -10,
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.primary,
  },
});
