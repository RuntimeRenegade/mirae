import { ResizeMode, Video } from 'expo-av';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { responsiveHeight } from 'react-native-responsive-dimensions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CustomSafeAreaViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  showTopBarImage?: boolean;
  showBottomBarImage?: boolean;
  videoSource?: 'top' | 'nebula' | 'earth' | 'sparkles' | 'spotlight' | 'particles'; // New prop for video selection
  moodVideoSource?: any; // Add mood video source prop
  moodActive?: boolean; // Add mood active flag
}

export default function CustomSafeAreaView({ 
  children, 
  style, 
  showTopBarImage = true,
  showBottomBarImage = true,
  videoSource = 'top', // Default to 'top'
  moodVideoSource,
  moodActive = false
}: CustomSafeAreaViewProps) {
  const insets = useSafeAreaInsets();
  const [currentOpacity, setCurrentOpacity] = useState(0.2);
  
  // Helper function to get video source based on prop
  const getVideoSource = () => {
    switch (videoSource) {
      case 'nebula':
        return require('@/assets/video/nebula.mp4');
      case 'earth':
        return require('@/assets/video/earth.mp4');
      case 'sparkles':
        return require('@/assets/video/sparkles.mp4');
      case 'spotlight':
        return require('@/assets/video/spotlight.mp4');
      case 'particles':
        return require('@/assets/video/Particles.mp4');
      case 'top':
      default:
        return require('@/assets/video/top.mp4');

    }
  };
  
  // Video refs for controlling playback
  const topVideoRef = useRef<Video>(null);
  const bottomVideoRef = useRef<Video>(null);
  
  // Video state management for each video separately
  const [topVideoState, setTopVideoState] = useState({
    isLoaded: false,
    isFirstPlay: true,
    canSeek: false
  });
  
  const [bottomVideoState, setBottomVideoState] = useState({
    isLoaded: false,
    isFirstPlay: true,
    canSeek: false
  });

  // Debounce function to prevent rapid seek operations
  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }, []);

  // Breathing effect for opacity
  useEffect(() => {
    if (!showTopBarImage && !showBottomBarImage) return;

    const animateOpacity = () => {
      const interval = setInterval(() => {
        setCurrentOpacity(() => {
          const time = Date.now() * 0.001;
          const breathe = Math.sin(time * 0.5) * 0.3;
          return 0.7 + breathe;
        });
      }, 50);

      return () => clearInterval(interval);
    };

    const cleanup = animateOpacity();
    return cleanup;
  }, [showTopBarImage, showBottomBarImage]);

  // Safe seek function with error handling
  const safeSeek = useCallback(async (videoRef: React.RefObject<Video | null>, position: number) => {
    if (!videoRef.current) return false;
    
    try {
      await videoRef.current.setPositionAsync(position);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('Seek operation failed, will retry later:', errorMessage);
      return false;
    }
  }, []);

  // Debounced seek functions
  const debouncedTopSeek = useCallback(
    debounce((position: number) => safeSeek(topVideoRef, position), 100),
    [safeSeek]
  );
  
  const debouncedBottomSeek = useCallback(
    debounce((position: number) => safeSeek(bottomVideoRef, position), 100),
    [safeSeek]
  );

  // Handle video playback status for seamless looping
  const handlePlaybackStatusUpdate = useCallback(async (
    status: any, 
    videoRef: React.RefObject<Video | null>, 
    isTopVideo: boolean
  ) => {
    if (!status.isLoaded || !videoRef.current) return;

    const currentState = isTopVideo ? topVideoState : bottomVideoState;
    const setState = isTopVideo ? setTopVideoState : setBottomVideoState;

    // Update loaded state when video becomes ready
    if (status.isLoaded && !currentState.isLoaded) {
      setState(prev => ({ ...prev, isLoaded: true, canSeek: true }));
      
      // Wait for video to be fully ready, then set initial position
      setTimeout(async () => {
        if (currentState.isFirstPlay && videoRef.current) {
          try {
            // Only seek if video is actually ready and has sufficient duration
            if (status.durationMillis && status.durationMillis > 4000) {
              await videoRef.current.setPositionAsync(5000); // Fixed: 5 seconds, not 52 seconds
              setState(prev => ({ ...prev, isFirstPlay: false }));
              console.log('Successfully set initial position to 5 seconds');
            } else {
              setState(prev => ({ ...prev, isFirstPlay: false }));
            }
          } catch (error) {
            console.log('Initial seek failed, video will start from beginning');
            setState(prev => ({ ...prev, isFirstPlay: false }));
          }
        }
      }, 1500); // Give more time for video to fully load
      return;
    }

    // Only proceed with loop logic if video is loaded and ready
    if (!currentState.isLoaded || !currentState.canSeek || !status.durationMillis) return;

    // Simple seamless looping when video finishes
    if (status.didJustFinish) {
      try {
        // Seamless loop: restart from a middle position to avoid jarring transitions
        const loopStartPosition = Math.min(3000, status.durationMillis * 0.15); // Start from ~15% of video duration
        await videoRef.current.setPositionAsync(loopStartPosition);
        await videoRef.current.playAsync();
        console.log(`Seamless loop restart from position: ${loopStartPosition}ms`);
      } catch (error) {
        // Fallback: use built-in replay
        console.log('Loop restart failed, using built-in replay');
        try {
          await videoRef.current.replayAsync();
        } catch (replayError) {
          console.log('Replay also failed, video may need manual restart');
        }
      }
    }
  }, [topVideoState, bottomVideoState]);

  // Initialize video playback
  const handleVideoLoad = useCallback(async (videoRef: React.RefObject<Video | null>, isTopVideo: boolean) => {
    if (!videoRef.current) return;
    
    const setState = isTopVideo ? setTopVideoState : setBottomVideoState;
    
    try {
      // Mark as loaded and start playing
      setState(prev => ({ ...prev, isLoaded: true }));
      await videoRef.current.playAsync();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('Error initializing video:', errorMessage);
    }
  }, []);

  // Only apply custom safe area handling on iOS
  if (Platform.OS !== 'ios') {
    return (
      <View style={[{ flex: 1 }, style]}>
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Status bar background */}
      <View 
        style={[
          styles.statusBarBackground,
          { height: 2 }
        ]} 
      />
      
      {/* Animated top bar video overlay */}
      {showTopBarImage && (
        <Video
          ref={topVideoRef}
          source={getVideoSource()}
          style={[
            styles.topBarImage,
            { 
              top: -responsiveHeight(8),
              height: responsiveHeight(8),
              opacity: 1,
            }
          ]}
          resizeMode={ResizeMode.COVER}
          isLooping={false}
          isMuted={true}
          shouldPlay={true}
          onLoad={() => handleVideoLoad(topVideoRef, true)}
          onPlaybackStatusUpdate={(status) => handlePlaybackStatusUpdate(status, topVideoRef, true)}
        />
      )}
      
      {/* Main content area */}
      <View style={styles.contentArea}>
        {children}
      </View>
      
      {/* Bottom safe area */}
      <View 
        style={[
          styles.bottomSafeArea,
          { height: 0 }
        ]} 
      />
      
      {/* Animated bottom bar video overlay */}
      {showBottomBarImage && (
        <Video
          ref={bottomVideoRef}
          source={getVideoSource()}
          style={[
            styles.bottomBarImage,
            { 
              bottom: -responsiveHeight(5),
              height: responsiveHeight(5),
              opacity: 1,
            }
          ]}
          resizeMode={ResizeMode.COVER}
          isLooping={false}
          isMuted={true}
          shouldPlay={true}
          onLoad={() => handleVideoLoad(bottomVideoRef, false)}
          onPlaybackStatusUpdate={(status) => handlePlaybackStatusUpdate(status, bottomVideoRef, false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: responsiveHeight(6.5),
    marginBottom: responsiveHeight(5),

    backgroundColor: 'transparent',
  },
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderBottomColor: 'rgb(58, 90, 121)',
    borderBottomWidth: 1.8,
    borderRadius: 32,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  topBarImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 2,
    opacity: 0.0,
  },
  contentArea: {
    flex: 1,
    zIndex: 3,
  },
  bottomSafeArea: {
    backgroundColor: 'white',
    height: 55,
    zIndex: 1,
  },
  bottomBarImage: {
    position: 'absolute',
    borderTopColor: 'rgb(58, 90, 121)',
    borderTopWidth: 0.8,
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 2,
    opacity: 1,
  },
});
