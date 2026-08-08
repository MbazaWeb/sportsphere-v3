/**
 * Avatar — circular avatar with sports badge support
 * Uses expo-image for fast, cached, blur-up loading.
 */

import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@sportsphere/design-system/tokens';

interface AvatarProps {
  url?: string | null;
  size?: number;
  /** Show a thin gold ring around the avatar (verified users, pros) */
  goldRing?: boolean;
}

export default function Avatar({ url, size = 44, goldRing = false }: AvatarProps) {
  const resolvedSize = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View
      style={[
        resolvedSize,
        goldRing && styles.goldRing,
        { backgroundColor: colors.backgroundSecondary },
      ]}
    >
      {url ? (
        <Image
          source={url}
          style={resolvedSize}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  goldRing: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
});
