import { useState } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import CelticMaskedVideo from '../../../components/mirae/MiraeMaskedView';
import MiraeStoryCreationCompleteRN from '../../../components/mirae/MiraeStoryCreationCompleteRN';
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';


export default function StoryCreationPage() {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Mock initial form data - this could come from onboarding or user preferences
  const initialFormData = {
    child_name: 'Alex',
    child_gender: 'they/them',
    child_age: 8,
    story_setting: 'magical_forest',
    story_style: 'build_your_own_adventure' as const
  };

  const handleStoryCreated = (storyId: string) => {
    console.log('Story created with ID:', storyId);
    // In a real app, you would:
    // 1. Navigate to the story reading page
    // 2. Or show a success screen
    // 3. Or redirect to the library
    // For now, we'll just log it
  };

  const handleBack = () => {
    // This will go back to the index page
    // The router.back() is handled in MiraeStoryCreationRN
  };

  return (
    <View style={styles.container}>
      {/* Background Video - same as index for continuity */}
      <View style={styles.backgroundContainer}>
        <CelticMaskedVideo 
          width={screenWidth} 
          height={screenHeight} 
          shouldPlay={true}
          style={styles.maskedVideo}
        />
      </View>

      {/* Story Creation Flow */}
      <View style={styles.contentContainer}>
        <MiraeStoryCreationCompleteRN
          onComplete={handleStoryCreated}
          onCancel={handleBack}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: responsiveWidth(100),
    height:  responsiveHeight(100),
    backgroundColor: 'white', // Keep white as requested
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  maskedVideo: {
    position: 'absolute',
  },
  contentContainer: {
    flex: 1,
  width: responsiveWidth(100),
    height:  responsiveHeight(100),
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Restore some visibility
    zIndex: 1,
  },
});
