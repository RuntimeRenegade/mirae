import { useState, useEffect } from 'react';
import { StyleSheet, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';

// Components
import MiraeLibrary from '../../../components/mirae/MiraeLibrary';
import { GlassErrorBoundary } from '../../../components/ui/GlassErrorBoundary';
import { EnchantedVideoIntro } from '../../../components/mirae/EnchantedVideoIntro';
import { CustomSafeAreaView } from '@/components/ui';
/**
 * Mirae Library Page (React Native)
 * 
 * Main library page for the mobile app that displays the user's story collection
 * Uses the production-ready MiraeLibrary component
 */
export default function LibraryPage() {
  const router = useRouter();
  const [forceRefresh] = useState(0);
  const [showVideoIntro, setShowVideoIntro] = useState(true);

  // Reset video intro state every time the screen is focused/accessed
  useFocusEffect(
    useCallback(() => {
      setShowVideoIntro(true);
    }, [])
  );

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      router.back();
      return true;
    });

    return () => backHandler.remove();
  }, [router]);

  // Handle navigation functions
  const handleCreateNew = () => {
    router.push('/mirae/create');
  };

  const handleShowProgress = (bookId: string) => {
    // Navigate to progress page if you have one, or show modal
    console.log('📊 Showing progress for book:', bookId);
    // router.push(`/mirae/progress/${bookId}`);
  };

  const handleReaderOpen = (bookId: string) => {
    router.push(`/mirae/reader?bookId=${bookId}`);
    console.log('📖 Story reader opened for book:', bookId);
  };

  const handleReaderClose = () => {
    console.log('📖 Story reader closed');
  };

  return (
    <GlassErrorBoundary>
      {showVideoIntro ? (
        <EnchantedVideoIntro onComplete={() => setShowVideoIntro(false)} />
      ) : (
         <CustomSafeAreaView style={styles.container} showTopBarImage={true}
      showBottomBarImage={true}>
          <StatusBar style="light" backgroundColor="transparent" translucent />
          
          <MiraeLibrary
            onCreateNew={handleCreateNew}
            onShowProgress={handleShowProgress}
            onReaderOpen={handleReaderOpen}
            onReaderClose={handleReaderClose}
            forceRefresh={forceRefresh}
          />
        </CustomSafeAreaView>
      
      )}
    </GlassErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Black background to match the app theme
  },
});
