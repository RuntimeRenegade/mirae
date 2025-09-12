import { useState, useEffect } from 'react';
import { View, ScrollView, Text, Dimensions, Animated, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { AppText, AppHeading1 } from '../AppText';
import { useFadeInAnimation, useStaggeredAnimation } from '../../hooks/useGlassAnimations';
import { getArtStyleById, ArtStyleType } from '../../types/artStyles';
import { getStoryStyleById, StoryStyleType } from '../../types/storyStyles';

interface StoryElement {
  id: string;
  name: string;
  display_name?: string;
  description: string;
  icon_url: string;
  category: string;
}

interface StoryElementCategory {
  category: string;
  category_display_name: string;
  category_description: string;
  category_icon_url: string;
  elements: StoryElement[];
}

interface CategorizedStoryElements {
  monsters: StoryElementCategory[];
  heroes: StoryElementCategory[];
}

interface SimplifiedSelectionProps {
  categorizedElements: CategorizedStoryElements;
  selectedMonster?: StoryElement | null;
  selectedHero?: StoryElement | null;
  onMonsterSelect: (monster: StoryElement) => void;
  onHeroSelect: (hero: StoryElement) => void;
  onNext: () => void;
  onBack: () => void;
  // Additional story settings
  selectedWorld?: string;
  selectedArtStyle?: string;
  selectedAuthorStyle?: string;
  childAge?: number;
  childName?: string;
  tokenCost?: number;
}

type SelectionStep = 'monster-selection' | 'hero-selection' | 'confirmation';

export default function SimplifiedSelectionRN({
  categorizedElements,
  selectedMonster,
  selectedHero,
  onMonsterSelect,
  onHeroSelect,
  onNext,
  onBack,
  selectedWorld = "",
  selectedArtStyle = "",
  selectedAuthorStyle = "",
  childAge = 8,
  childName = "Alex",
  tokenCost = 100,
}: SimplifiedSelectionProps) {
  const { width: screenWidth } = Dimensions.get('window');
  const [currentStep, setCurrentStep] = useState<SelectionStep>('monster-selection');
  const [confirmedMonster, setConfirmedMonster] = useState<StoryElement | null>(null);
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({});
  const [imageErrorStates, setImageErrorStates] = useState<Record<string, boolean>>({});

  // Helper functions to get display names
  const getArtStyleDisplayName = (artStyleId: string): string => {
    if (!artStyleId) return 'Not selected';
    const artStyle = getArtStyleById(artStyleId as ArtStyleType);
    return artStyle ? artStyle.name : artStyleId;
  };

  const getStoryStyleDisplayName = (storyStyleId: string): string => {
    if (!storyStyleId) return 'Not selected';
    const storyStyle = getStoryStyleById(storyStyleId as StoryStyleType);
    return storyStyle ? storyStyle.name : storyStyleId;
  };

  const getWorldDisplayName = (worldId: string): string => {
    if (!worldId) return 'Not selected';
    
    // Map of world setting IDs to display names
    const settingMap: Record<string, string> = {
      'enchanted_forest': 'Enchanted Forest',
      'magical_castle': 'Magical Castle', 
      'underwater_kingdom': 'Underwater Kingdom',
      'space_station': 'Space Station',
      'floating_islands': 'Floating Islands',
      'crystal_caves': 'Crystal Caves',
      'cloud_city': 'Cloud City',
      'dragon_valley': 'Dragon Valley',
      'fairy_garden': 'Fairy Garden',
      'pirate_ship': 'Pirate Ship',
      'wizard_tower': 'Wizard Tower',
      'arctic_wonderland': 'Arctic Wonderland',
      'magical_forest': 'Magical Forest',
      'fantasy_realm': 'Fantasy Realm'
    };
    
    // Return mapped name or format the ID as fallback
    return settingMap[worldId] || worldId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Determine if we're on a tablet
  const isTablet = screenWidth >= 768;

  // Flatten all monsters and heroes into single arrays
  const allMonsters = categorizedElements.monsters.flatMap(category => category.elements);
  const allHeroes = categorizedElements.heroes.flatMap(category => category.elements);

  // Animations
  const headerFadeAnim = useFadeInAnimation(0);
  const cardAnimations = useStaggeredAnimation(
    currentStep === 'monster-selection' ? allMonsters : allHeroes, 
    400
  );
  const [shimmerAnim] = useState(() => new Animated.Value(0));

  // Auto-advance if monster is already selected
  useEffect(() => {
    if (selectedMonster && !confirmedMonster) {
      setConfirmedMonster(selectedMonster);
      setCurrentStep('hero-selection');
    }
  }, [selectedMonster, confirmedMonster]);

  // Auto-advance to confirmation step when hero is selected
  useEffect(() => {
    if (selectedHero && currentStep === 'hero-selection') {
      const timer = setTimeout(() => {
        setCurrentStep('confirmation');
      }, 2000); // 2 second delay to show selection
      
      return () => clearTimeout(timer);
    }
  }, [selectedHero, currentStep]);

  // Animate shimmer
  useEffect(() => {
    const animateShimmer = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };
    
    animateShimmer();
  }, [shimmerAnim]);

  const handleConfirmHero = () => {
    if (selectedHero) {
      onNext();
    }
  };

  const handleImageLoadStart = (imageId: string) => {
    // Set loading state to true when starting to load
    setImageLoadingStates(prev => ({ ...prev, [imageId]: true }));
    setImageErrorStates(prev => ({ ...prev, [imageId]: false }));
  };

  const handleImageLoadEnd = (imageId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [imageId]: false }));
  };

  const handleImageError = (imageId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [imageId]: false }));
    setImageErrorStates(prev => ({ ...prev, [imageId]: true }));
  };

  const handleMainBack = () => {
    if (currentStep === 'monster-selection') {
      onBack();
    } else if (currentStep === 'hero-selection') {
      if (selectedHero) {
        onHeroSelect(null as any);
      }
      setConfirmedMonster(null);
      onMonsterSelect(null as any);
      setCurrentStep('monster-selection');
    } else if (currentStep === 'confirmation') {
      setCurrentStep('hero-selection');
    }
  };

  const getGridConfig = () => {
    if (isTablet) {
      return {
        columns: 3,
        cardWidth: (screenWidth - 80) / 3 - 8, // Account for gap
        gap: 16
      };
    }
    return {
      columns: 3,
      cardWidth: (screenWidth - 60) / 3 - 6, // Account for gap  
      gap: 8
    };
  };

  const gridConfig = getGridConfig();
  const currentElements = currentStep === 'monster-selection' ? allMonsters : allHeroes;
  const selectedElement = currentStep === 'monster-selection' ? selectedMonster : selectedHero;
  const onElementSelect = currentStep === 'monster-selection' ? onMonsterSelect : onHeroSelect;

  // Shimmer skeleton component
  const renderShimmerSkeleton = () => {
    const translateX = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-100, 100],
    });

    return (
      <View style={styles.shimmerContainer}>
        <Animated.View style={[styles.shimmerGradient, { transform: [{ translateX }] }]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      </View>
    );
  };

  const renderElementCard = (element: StoryElement, index: number) => {
    const isSelected = selectedElement?.id === element.id;
    const isLoading = imageLoadingStates[element.id] === undefined || imageLoadingStates[element.id] === true; // Show shimmer by default and when loading
    const hasError = imageErrorStates[element.id];
    const cardStyle = isSelected 
      ? { ...styles.elementCard, ...styles.selectedElementCard }
      : styles.elementCard;
    
    return (
      <Animated.View
        key={element.id}
        style={{
          width: gridConfig.cardWidth,
          marginBottom: gridConfig.gap,
          opacity: cardAnimations[index]
        }}
      >
        {/* Display Name above the card */}
        <AppText style={styles.elementDisplayName}>
          {element.display_name || element.name}
        </AppText>
        <TouchableOpacity
          onPress={() => onElementSelect(element)}
          activeOpacity={0.8}
        >
          <GlassCard
            variant={isSelected ? "diamond" : "ultraClear"}
            blurIntensity="heavy"
            style={cardStyle}
          >
          {/* Element Image - Fill Container */}
          <View style={styles.elementImageContainer}>
            {isLoading && renderShimmerSkeleton()}
            <Image
              source={{ uri: element.icon_url }}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 8,
                opacity: isLoading ? 0 : 1
              }}
              resizeMode="cover"
              onLoadStart={() => handleImageLoadStart(element.id)}
              onLoadEnd={() => handleImageLoadEnd(element.id)}
              onError={() => handleImageError(element.id)}
            />
            {hasError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>⚠️</Text>
              </View>
            )}
            {selectedElement?.id === element.id && (
              <View style={styles.selectedIndicator}>
                <Text style={styles.selectedIndicatorText}>✓</Text>
              </View>
            )}
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
};

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeAreaContainer}>
        {/* Main scrollable content */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Spacers for floating headers */}
          <View style={styles.progressSpacer} />
          <View style={styles.headerSpacer} />

       
          {/* Content based on current step */}
          {currentStep === 'confirmation' ? (
            // Enhanced confirmation content
            <View style={styles.confirmationContainer}>
              <AppHeading1 style={styles.confirmationTitle}>Story Summary</AppHeading1>
              <AppText style={styles.confirmationSubtitle}>
                Review your adventure details and create your personalized story
              </AppText>
              
              <View style={styles.confirmationCards}>
                {/* Single comprehensive glass card containing all story details */}
                <GlassCard variant="liquid" blurIntensity="ultra" style={styles.comprehensiveCard}>
                  {/* Characters Section */}
                  <View style={styles.charactersSection}>
                    <AppHeading1 style={styles.sectionTitle}>Your Adventure Team</AppHeading1>
                    
                    {confirmedMonster && (
                      <View style={styles.characterRow}>
                        <Image 
                          source={{ uri: confirmedMonster.icon_url }}
                          style={styles.confirmationImage}
                          resizeMode="cover"
                        />
                        <View style={styles.confirmationInfo}>
                          <AppText style={styles.confirmationLabel}>Your Friend</AppText>
                          <AppHeading1 style={styles.confirmationName}>
                            {confirmedMonster.display_name || confirmedMonster.name}
                          </AppHeading1>
                          <AppText style={styles.confirmationDescription}>
                            {confirmedMonster.description}
                          </AppText>
                        </View>
                      </View>
                    )}
                    
                    {selectedHero && (
                      <View style={styles.characterRow}>
                        <Image 
                          source={{ uri: selectedHero.icon_url }}
                          style={styles.confirmationImage}
                          resizeMode="cover"
                        />
                        <View style={styles.confirmationInfo}>
                          <AppText style={styles.confirmationLabel}>Your Hero</AppText>
                          <AppHeading1 style={styles.confirmationName}>
                            {selectedHero.display_name || selectedHero.name}
                          </AppHeading1>
                          <AppText style={styles.confirmationDescription}>
                            {selectedHero.description}
                          </AppText>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Divider */}
                  <View style={styles.divider} />

                  {/* Story Settings Section */}
                  <View style={styles.settingsInCardSection}>
                    <AppHeading1 style={styles.sectionTitle}>Story Settings</AppHeading1>
                    
                    <View style={styles.settingsGrid}>
                      <View style={styles.settingRow}>
                        <AppText style={styles.settingLabel}>World Setting</AppText>
                        <AppText style={styles.settingValue}>{getWorldDisplayName(selectedWorld)}</AppText>
                      </View>
                      
                      <View style={styles.settingRow}>
                        <AppText style={styles.settingLabel}>Art Style</AppText>
                        <AppText style={styles.settingValue}>{getArtStyleDisplayName(selectedArtStyle)}</AppText>
                      </View>
                      
                      <View style={styles.settingRow}>
                        <AppText style={styles.settingLabel}>Author Style</AppText>
                        <AppText style={styles.settingValue}>{getStoryStyleDisplayName(selectedAuthorStyle)}</AppText>
                      </View>
                      
                      <View style={styles.settingRow}>
                        <AppText style={styles.settingLabel}>Child's Info</AppText>
                        <AppText style={styles.settingValue}>{childName}, {childAge} years old</AppText>
                      </View>
                      
                      <View style={styles.tokenCostRow}>
                        <AppText style={styles.settingLabel}>Generation Cost</AppText>
                        <AppText style={styles.tokenCostValue}>{tokenCost} Tokens</AppText>
                      </View>
                    </View>
                  </View>
                </GlassCard>
              </View>
            </View>
          ) : (
            // Elements Grid for selection steps
            <View style={styles.gridContainer}>
              {/* Loading message for character images */}
              {(Object.keys(imageLoadingStates).length === 0 || Object.values(imageLoadingStates).some(loading => loading)) && (
                <View style={styles.loadingMessageContainer}>
                  <AppText style={styles.loadingMessageText}>
                    {currentStep === 'monster-selection' 
                      ? '✨ Loading your magical friends...' 
                      : '🦸 Loading your brave heroes...'
                    }
                  </AppText>
                </View>
              )}
              
              <View 
                style={[styles.gridRow, { gap: gridConfig.gap }]}
              >
                {currentElements.map((element, index) => renderElementCard(element, index))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Sticky Navigation Buttons */}
        <BlurView intensity={25} tint="systemMaterialLight" style={styles.navigationOverlay}>
          <View style={currentStep === 'confirmation' ? styles.navigationContainerConfirmation : styles.navigationContainer}>
            {currentStep === 'confirmation' ? (
              <>
                <GlassButton
                  title={`Continue`}
                  variant="primary"
                  size="medium"
                  onPress={handleConfirmHero}
                  style={styles.confirmButton}
                />
                <GlassButton
                  title="← Back"
                  variant="secondary"
                  size="medium"
                  onPress={handleMainBack}
                  style={styles.confirmBackButton}
                />
              </>
            ) : (
              <GlassButton
                title="← Back"
                variant="secondary"
                size="medium"
                onPress={handleMainBack}
                style={styles.centeredBackButton}
              />
            )}
          </View>
        </BlurView>

        {/* Floating Progress Header */}
      
            <Animated.View 
            style={[styles.headerContainer, { opacity: headerFadeAnim }]}
          >
            <AppHeading1 style={styles.headerTitle}>
              {currentStep === 'monster-selection' ? 'Choose Your Friend' : 
               currentStep === 'hero-selection' ? 'Choose Your Hero' : 'Confirm Your Story'}
            </AppHeading1>
            <AppText style={styles.headerSubtitle}>
              {currentStep === 'monster-selection' 
                ? 'Select a friendly companion to join your adventure'
                : currentStep === 'hero-selection'
                ? 'Pick the brave character who will save the day'
                : 'Review your selections and create your story'
              }
            </AppText>
          </Animated.View>
             {/* Current Selection Display */}
    

       

        {/* Floating Header Section */}
     
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  safeAreaContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra padding for sticky navigation
  },
  // Spacers for floating headers
  progressSpacer: {
    height: 15, // Space for progress overlay
  },
  headerSpacer: {
    height: 35, // Space for header overlay
  },
  // Floating overlays
  progressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    borderWidth: 2,
    borderRadius: 15,
    backgroundColor: 'transparent',
    borderColor: 'rgba(243, 243, 243, 0.13)',
  },
  headerOverlay: {
    position: 'absolute',
    backgroundColor: 'transparent',
    top: 80, // Below progress overlay
    left: 0,
    right: 0,
    zIndex: 4,

    borderRadius: 32,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  navigationOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 6,
    borderTopWidth: 1,
      backgroundColor: 'transparent',
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  progressCard: {
    padding: 20,
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 8,
  },
  progressStepActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  progressStepCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
  },
  progressStepInactive: {
    backgroundColor: 'rgba(107, 114, 128, 0.3)',
  },
  progressStepIcon: {
    fontSize: 20,
  },
  progressStepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  progressArrow: {
    marginHorizontal: 16,
  },
  progressArrowText: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.6,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  currentSelectionContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  currentSelectionCard: {
    padding: 20,
  },
  currentSelectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  currentSelectionImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  currentSelectionInfo: {
    flex: 1,
  },
  currentSelectionLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  currentSelectionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  headerContainer: {
    position: 'absolute',
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  gridContainer: {
    paddingHorizontal: 24,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  elementCard: {
    padding: 4,
    aspectRatio: 1,
    minHeight: 120,
  },
  selectedElementCard: {
    transform: [{ scale: 1.02 }],
  },
  elementImageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    backgroundColor: '#22c55e',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  selectedIndicatorText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    gap: 16,
  },
  backButton: {
    flex: 0.4,
  },
  continueButton: {
    flex: 0.6,
  },
  // New styles for confirmation and shimmer
  navigationContainerConfirmation: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
    gap: 12,
  },
  centeredBackButton: {
    alignSelf: 'center',
    minWidth: 120,
  },
  confirmButton: {
    minWidth: 200,
  },
  confirmBackButton: {
    minWidth: 200,
  },
  confirmationContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  confirmationSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  confirmationCards: {
    gap: 16,
  },
  confirmationCard: {
    padding: 20,
    marginBottom: 8,
  },
  confirmationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  confirmationImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  confirmationInfo: {
    flex: 1,
  },
  confirmationLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  confirmationName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  confirmationDescription: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    lineHeight: 18,
    textAlign: 'center', // Center the description text
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  elementDisplayName: {
    fontSize: 14,
    color: '#6c09ecff',
    opacity: 1,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '800',
    
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  shimmerGradient: {
    position: 'absolute',
    top: 0,
    left: '-100%',
    right: 0,
    bottom: 0,
    width: '200%',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  errorText: {
    fontSize: 24,
    opacity: 0.6,
  },
  // Settings section styles
  settingsSection: {
    marginTop: 24,
    gap: 12,
  },
  settingsSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  settingCard: {
    padding: 16,
    marginBottom: 4,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  settingValue: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  tokenCostCard: {
    padding: 16,
    marginBottom: 4,
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  tokenCostValue: {
    fontSize: 18,
    color: '#22c55e',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  // New comprehensive card styles
  comprehensiveCard: {
    padding: 24,
    marginBottom: 8,
  },
  charactersSection: {
    marginBottom: 12, // Reduced from 20 to 12
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  characterRow: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 12, // Reduced from 20 to 12
  },
  settingsInCardSection: {
    marginTop: 4,
  },
  settingsGrid: {
    gap: 12,
  },
  settingRow: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tokenCostRow: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  // Loading message styles
  loadingMessageContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  loadingMessageText: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.8,
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
