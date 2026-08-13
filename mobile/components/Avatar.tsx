/**
 * Avatar — circular avatar matching the web implementation
 * Uses expo-image for fast, cached, blur-up loading.
 * Gold ring: 2px solid #F5C518 for verified/pro users.
 * Fallback background: #0F1D3A
 */

import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

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
        { backgroundColor: '#0F1D3A' },
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
    borderColor: '#F5C518',
  },
});
