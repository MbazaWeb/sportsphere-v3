import { Share, Platform } from 'react-native';

const BASE_URL = 'https://sportsphere.app';

export async function sharePost(postId: string, content: string) {
  try {
    const url = `${BASE_URL}/p/${postId}`;
    const result = await Share.share({
      title: 'SportSphere Post',
      message: Platform.OS === 'ios' ? content : `${content}\n\n${url}`,
      url, // iOS only
    });

    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        // shared with activity type of result.activityType
      } else {
        // shared
      }
    } else if (result.action === Share.dismissedAction) {
      // dismissed
    }
  } catch (error: any) {
    console.error('Error sharing post:', error.message);
  }
}

export async function shareProfile(handle: string) {
  try {
    const url = `${BASE_URL}/u/${handle.replace('@', '')}`;
    const result = await Share.share({
      title: 'SportSphere Profile',
      message: Platform.OS === 'ios' ? `Check out this profile on SportSphere!` : `Check out this profile on SportSphere!\n\n${url}`,
      url,
    });
  } catch (error: any) {
    console.error('Error sharing profile:', error.message);
  }
}
