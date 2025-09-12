/**
 * Interactive Story Reader Screen for React Native
 * 
 * This route/screen handles the Interactive Story Reader functionality
 * for React Native apps, maintaining identical functionality to the web version.
 * 
 * Features:
 * - Full tablet width optimization
 * - Identical API integration
 * - Touch-friendly navigation
 * - React Native optimized components
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import InteractiveStoryReader from '@/components/mirae/InteractiveStoryReader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { useAudio } from '@/providers/AudioProvider';
import { CustomSafeAreaView } from '@/components/ui';
export default function InteractiveReaderScreen() {
  const router = useRouter();
  const { requestMusicControl } = useAudio();
  const { bookId, publicMode, tempAccessToken, continueReading, initialPage } = useLocalSearchParams<{
    bookId: string;
    publicMode?: string;
    tempAccessToken?: string;
    continueReading?: string;
    initialPage?: string;
  }>();

  console.log('📖 InteractiveReaderScreen params:', {
    bookId,
    publicMode,
    continueReading,
    initialPage,
    initialPageParsed: initialPage ? parseInt(initialPage, 10) : undefined
  });

  const handleClose = () => {
    router.back();
  };

  return (
    <CustomSafeAreaView style={styles.container} videoSource="nebula">
      <InteractiveStoryReader
        bookId={bookId}
        onClose={handleClose}
        publicMode={publicMode === 'true'}
        tempAccessToken={tempAccessToken}
        continueReading={continueReading === 'true'}
        initialPage={initialPage ? parseInt(initialPage, 10) : undefined}
      />
    </CustomSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
