import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Animated,
  ScrollView
} from 'react-native';
import { CustomAlert, createCustomAlert } from '../ui/CustomAlert';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArtStyleType } from '../../types/artStyles';
import { useAuth } from '../../providers/AuthProvider';
import { supabase } from '../../lib/supabase';
import { useTokens } from '../../hooks/tokens';
import MiraeTokenModal from '../../iap/MiraeTokenModal';
import {
  responsiveHeight,
  responsiveWidth,
  responsiveFontSize
} from 'react-native-responsive-dimensions';

type StoryStyleType = 'dr_seuss' | 'build_your_own_adventure' | 'eric_carle' | 'maurice_sendak' | 'roald_dahl' | 'shel_silverstein' | 'the_heros_journal' | 'dear_diary' | 'comic_quest' | 'epic_adventure' | 'story_in_verse' | 'choose_your_path';

interface StoryElement {
  id: string;
  name: string;
  description: string;
}

interface CustomCharacter {
  id: string;
  name: string;
  image_url: string;
}

interface StoryConfirmationNewRNProps {
  formData: {
    child_name: string;
    child_gender: string;
    child_age: number;
    story_setting: string;
    story_style: StoryStyleType;
    art_style: ArtStyleType;
  };
  selectedHero: StoryElement | null;
  selectedMonster: StoryElement | null;
  selectedCustomCharacter?: CustomCharacter | null;
  onConfirm?: () => void;
  onBack: () => void;
}

const STORY_COST = 100; // tokens per story

export default function StoryConfirmationNewRN({
  formData,
  selectedHero,
  selectedMonster,
  selectedCustomCharacter,
  onConfirm,
  onBack
}: StoryConfirmationNewRNProps) {
  const [confirming, setConfirming] = useState(false);
  const [isTokensLoading, setIsTokensLoading] = useState(true);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [customAlertConfig, setCustomAlertConfig] = useState<any>(null);
  const router = useRouter();
  const { session } = useAuth();
  const { tokens, fetchTokenBalance, useToken } = useTokens();

  // Animation values for shimmer effect
  const shimmerAnimation = new Animated.Value(0);
  const shadowAnimation = new Animated.Value(0);

  // Start shimmer animation on mount
  useEffect(() => {
    const startShimmerAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(shimmerAnimation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    const startShadowAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shadowAnimation, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(shadowAnimation, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    startShimmerAnimation();
    startShadowAnimation();
  }, []);

  // Interpolate colors for shimmer effect
  const animatedTextColor = shimmerAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#D8B4FE', '#10B981', '#EC4899'], // lavender -> teal -> pink
  });

  // Interpolate shadow color
  const animatedShadowColor = shadowAnimation.interpolate({
    inputRange: [0, 0.33, 0.66, 1],
    outputRange: ['rgba(216, 180, 254, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(236, 72, 153, 0.8)', 'rgba(216, 180, 254, 0.8)'],
  });

  // Interpolate scale for pulsing effect
  const animatedScale = shadowAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  // Debug logging
  useEffect(() => {
    console.log('📋 StoryConfirmationNewRN received props:', {
      formData,
      selectedHero,
      selectedMonster,
      selectedCustomCharacter
    });
  }, [formData, selectedHero, selectedMonster, selectedCustomCharacter]);

  // Load tokens on mount
  useEffect(() => {
    const loadTokens = async () => {
      try {
        console.log('🔄 Starting token load process...');
        console.log('Auth session state:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
        });
        
        setIsTokensLoading(true);
        
        if (!session?.user?.id) {
          console.log('⚠️ No authenticated user found, checking anonymous tokens...');
          await fetchTokenBalance(); // This will handle anonymous tokens
          return;
        }
        
        console.log('👤 Authenticated user found, fetching tokens for:', session.user.id);
        await fetchTokenBalance();
        console.log('✅ Token fetch completed successfully');
        
      } catch (error) {
        console.error('❌ Error loading tokens:', error);
        setCustomAlertConfig(createCustomAlert.error(
          'Token Loading Error',
          'We had trouble loading your token balance. Please try again or contact support if the problem persists.',
          () => {
            setShowCustomAlert(false);
            setIsTokensLoading(true);
            fetchTokenBalance();
          }
        ));
        setShowCustomAlert(true);
      } finally {
        setIsTokensLoading(false);
      }
    };

    // Always try to load tokens, even for anonymous users
    loadTokens();
  }, [session?.user?.id, fetchTokenBalance]);

  const canCreateStory = tokens !== null && tokens >= STORY_COST;

  const handleConfirm = async () => {
    if (!canCreateStory) {
      setCustomAlertConfig({
        title: '✨ More Magic Needed!',
        subtitle: `You need ${STORY_COST - (tokens || 0)} more tokens to create ${formData.child_name}'s magical story. Your current balance is ${tokens || 0} tokens. Would you like to purchase more tokens?`,
        buttons: [
          {
            text: 'Maybe Later',
            style: 'cancel' as const,
            onPress: () => setShowCustomAlert(false)
          },
          {
            text: 'Purchase Tokens',
            style: 'default' as const,
            onPress: () => {
              setShowCustomAlert(false);
              setShowTokenModal(true);
            }
          }
        ]
      });
      setShowCustomAlert(true);
      return;
    }

    if (!session?.user?.id) {
      setCustomAlertConfig({
        title: '🔮 Sign in Required',
        subtitle: 'Please sign in to your Mirae account to create and save your magical stories!',
        buttons: [
          {
            text: 'OK',
            style: 'default' as const,
            onPress: () => setShowCustomAlert(false)
          }
        ]
      });
      setShowCustomAlert(true);
      return;
    }

    setConfirming(true);
    
    console.log('Creating story with data:', {
      child_name: formData.child_name,
      child_gender: formData.child_gender,
      child_age: formData.child_age,
      story_setting: formData.story_setting,
      story_style: formData.story_style,
      art_style: formData.art_style,
      selectedHero,
      selectedMonster,
      selectedCustomCharacter
    })
    
    try {
      // Calculate grade level based on age (age 6 = 1st grade, age 7 = 2nd grade, etc.)
      const gradeLevel = Math.max(1, formData.child_age - 5);
      
      // Create book data
      const bookData = {
        user_id: session.user.id,
        title: `${formData.child_name}'s Adventure`, // Default placeholder title
        child_name: formData.child_name,
        child_gender: formData.child_gender,
        child_age: formData.child_age,
        grade_level: gradeLevel,
        story_setting: formData.story_setting,
        story_style: formData.story_style,
        art_style: formData.art_style,
        hero_type: selectedHero?.name || '',
        monster_type: selectedMonster?.name || '',
        custom_character_id: selectedCustomCharacter?.id || null,
        status: 'draft',
        current_step: 'setup',
        created_at: new Date().toISOString()
      };

      console.log('📚 Creating book with data:', bookData);

      // Insert book into mirae_books table
      const { data: bookRecord, error: bookError } = await supabase
        .from('mirae_books')
        .insert([bookData])
        .select()
        .single();

      if (bookError) {
        console.error('❌ Error creating book:', bookError);
        throw new Error('Failed to create story. Please try again.');
      }

      console.log('✅ Book created successfully:', bookRecord);

      // Deduct tokens using useToken function
      const tokenResult = await useToken(STORY_COST);

      if (!tokenResult.success) {
        // If token deduction fails, we should clean up the book record
        await supabase
          .from('mirae_books')
          .delete()
          .eq('id', bookRecord.id);
        
        throw new Error(tokenResult.error || 'Failed to deduct tokens');
      }

      console.log('💰 Tokens deducted successfully');

      // Show success message
      setCustomAlertConfig({
        title: '✨ Congratulations! ✨\nYour Story is Ready to be Generated! ',
        subtitle: `Time to go to the Enchanted Library where our artists and writers powered by dreams will get to work on ${formData.child_name}'s magical story!\n\nStory creation takes anywhere from 5-10 minutes, and you can close the app after the story generation begins once you enter the library.\n\n${STORY_COST} tokens have been used for this creation.`,
        buttons: [
          {
        text: '📚 Go to Enchanted Library',
        style: 'default' as const,
        onPress: () => {
          setShowCustomAlert(false);
          // Call onConfirm callback if provided
          onConfirm?.();
          // Navigate to library
          router.push('/mirae/library');
        }
          }
        ]
      });
      setShowCustomAlert(true);
      
    } catch (error: any) {
      console.error('❌ Error creating story:', error);
      setCustomAlertConfig(createCustomAlert.error(
        '🪄 Magic Interrupted', 
        'Something went wrong while creating your magical story. Please try again and let the magic flow!'
      ));
      setShowCustomAlert(true);
    } finally {
      setConfirming(false);
    }
  };

  const handleBack = () => {
    onBack();
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={100} tint="light" style={styles.blurView}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
          style={styles.content}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {/* Header */}
            <View style={styles.header}>
            <Animated.View style={[
              styles.iconContainer,
              {
              shadowColor: '#c974b3ec',
              shadowOffset: { width: 1, height: 1 },
              shadowOpacity: 1,
              shadowRadius: 1,
              elevation: 8,
              }
            ]}>
              <Animated.View style={{ transform: [{ scale: animatedScale }] }}>
              <Ionicons name="sparkles" size={32} color="#e39ffdff" />
              </Animated.View>
            </Animated.View>
            <Animated.Text 
              style={[
                styles.title,
                { color: animatedTextColor, textShadowColor: animatedShadowColor }
              ]}
            >
              ✨ Almost There! ✨
            </Animated.Text>
            <Text style={styles.title2}>
              Ready to bring {formData.child_name}'s story to life?
            </Text>
          </View>

          {/* Token Cost Section */}
          <View style={styles.tokenSection}>
            <View style={styles.costContainer}>
              <Text style={styles.costLabel}>Story Creation Cost</Text>
              <Animated.Text 
                style={[
                  styles.costAmount,
                  { color: animatedTextColor, textShadowColor: animatedShadowColor }
                ]}
              >
                {String(STORY_COST)} tokens
              </Animated.Text>
              <Text style={styles.subtitle}>
                This includes personalized story generation, custom illustrations, and lifetime access in your library
              </Text>
            </View> 
            
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>Your Current Balance</Text>
              {isTokensLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#10b981" />
                  <Text style={styles.loadingText}>Loading tokens...</Text>
                </View>
              ) : tokens === null ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>Failed to load tokens</Text>
                  <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={() => {
                      setIsTokensLoading(true);
                      fetchTokenBalance();
                    }}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={[
                  styles.balanceAmount,
                  { color: canCreateStory ? '#10b981' : '#ef4444' }
                ]}>
                  {String(tokens)} tokens
                </Text>
              )}
            </View>

            {/* Insufficient tokens warning */}
            {tokens !== null && !canCreateStory && (
              <View style={styles.warningContainer}>
                <View style={styles.warningHeader}>
                  <Ionicons name="wallet" size={24} color="#7cb4d4ff" />
                  <Text style={styles.warningTitle}>Need More Tokens</Text>
                </View>
                <Text style={styles.warningText}>
                  You need {String(STORY_COST - (tokens || 0))} more tokens to create this magical story
                </Text>
                <TouchableOpacity 
                  style={styles.purchaseTokensButton}
                  onPress={() => setShowTokenModal(true)}
                >
                  <LinearGradient
                    colors={['rgba(59, 130, 246, 0.8)', 'rgba(30, 58, 138, 0.9)']}
                    style={styles.purchaseTokensGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="add-circle" size={20} color="white" />
                    <Text style={styles.purchaseTokensText}>Purchase Tokens</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {/* Confirm Button */}
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={confirming || !canCreateStory || isTokensLoading}
              style={[
                styles.confirmButton,
                (!canCreateStory || isTokensLoading) && styles.disabledButton
              ]}
            >
              <BlurView intensity={90} tint="light" style={styles.buttonBlur}>
                <LinearGradient
                  colors={
                    confirming || !canCreateStory || isTokensLoading
                      ? ['rgba(75, 85, 99, 0.8)', 'rgba(55, 65, 81, 0.9)']
                      : ['rgba(16, 185, 129, 0.9)', 'rgba(59, 130, 246, 0.9)', 'rgba(147, 51, 234, 0.9)']
                  }
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Animated.View style={[styles.buttonContent, { transform: [{ scale: animatedScale }] }]}>
                    {confirming ? (
                      <>
                        <ActivityIndicator size="small" color="white" style={styles.buttonIcon} />
                        <Text style={styles.confirmButtonText}>
                          Creating Your Magical Story...
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.confirmButtonText}>
                          Create My Story
                        </Text>
                      </>
                    )}
                  </Animated.View>
                </LinearGradient>
              </BlurView>
            </TouchableOpacity>

            {/* Back Button */}
            <TouchableOpacity
              onPress={handleBack}
              disabled={confirming}
              style={[styles.backButton, confirming && styles.disabledButton]}
            >
              <BlurView intensity={40} tint="light" style={styles.buttonBlur}>
                <View style={styles.backButtonContent}>
                  <Ionicons name="chevron-back" size={20} color="white" />
                  <Text style={styles.backButtonText}>Change Options</Text>
                </View>
              </BlurView>
            </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </BlurView>      {/* Token Purchase Modal */}
      <MiraeTokenModal 
        visible={showTokenModal}
        onClose={() => {
          setShowTokenModal(false);
          // Refresh token balance after modal closes
          if (session?.user?.id) {
            fetchTokenBalance();
          }
        }}
      />
      
      {/* Custom Alert */}
      <CustomAlert
        visible={showCustomAlert}
        {...(customAlertConfig || {})}
        onClose={() => setShowCustomAlert(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: responsiveWidth(4),
    justifyContent: 'center',
  },
  blurView: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsiveWidth(6),
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: responsiveHeight(2),
  },
  iconContainer: {
    backgroundColor: 'rgba(56, 61, 61, 0.55)',
    borderRadius: 32,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: responsiveFontSize(3.5),
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  title2: {
    fontSize: responsiveFontSize(1.4),
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: responsiveFontSize(2.2),
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: responsiveFontSize(2.8),
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  tokenSection: {
    minWidth: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0)',
    borderRadius: 20,
    paddingHorizontal: responsiveWidth(4),
    marginBottom: responsiveHeight(4),
    borderWidth: 1,
    borderColor: 'rgba(233, 236, 235, 0.3)',
  },
  costContainer: {
    alignItems: 'center',
    marginBottom: responsiveHeight(2),
  },
  costLabel: {
    fontSize: responsiveFontSize(2.2),
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  costAmount: {
    fontSize: responsiveFontSize(3.8),
    fontWeight: 'bold',
    color: '#10b981',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  balanceContainer: {
    alignItems: 'center',
    paddingTop: responsiveHeight(2),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  balanceLabel: {
    fontSize: responsiveFontSize(2),
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  balanceAmount: {
    fontSize: responsiveFontSize(2.5),
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  warningContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: responsiveHeight(2),
    paddingTop: responsiveHeight(2),
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 158, 11, 0.3)',
  },
  warningText: {
    fontSize: responsiveFontSize(1.8),
    color: '#000000ff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  buttonContainer: {
    width: '100%',
    gap: responsiveHeight(2),
  },
  confirmButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: 'rgba(16, 185, 129, 0.5)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonBlur: {
    borderRadius: 16,
  },
  buttonGradient: {
    borderRadius: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveHeight(2.2),
    paddingHorizontal: responsiveWidth(4),
  },
  buttonIcon: {
    marginRight: 8,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: responsiveFontSize(2.2),
    fontWeight: 'bold',
    textAlign: 'center',
    alignSelf: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  backButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveHeight(2),
    paddingHorizontal: responsiveWidth(4),
  },
  backButtonText: {
    color: 'white',
    fontSize: responsiveFontSize(2),
    fontWeight: '600',
    marginLeft: 4,
    textAlign: 'center',
    alignSelf: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  // New story details styles
  storyDetailsSection: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: responsiveWidth(5),
    marginBottom: responsiveHeight(3),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: responsiveFontSize(2.8),
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: responsiveHeight(3),
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  // New enhanced token modal styles
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsiveHeight(1.5),
  },
  warningTitle: {
    fontSize: responsiveFontSize(2.2),
    color: '#000000ff',
    fontWeight: 'bold',
    marginLeft: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  purchaseTokensButton: {
    marginTop: responsiveHeight(2),
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: 'rgba(59, 130, 246, 0.5)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  purchaseTokensGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveHeight(1.8),
    paddingHorizontal: responsiveWidth(6),
    borderRadius: 12,
  },
  purchaseTokensText: {
    fontSize: responsiveFontSize(2),
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  
  // Loading and error states for token display
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: responsiveFontSize(1.8),
    color: 'rgba(255, 255, 255, 0.7)',
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorText: {
    fontSize: responsiveFontSize(1.8),
    color: '#ef4444',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  retryButtonText: {
    fontSize: responsiveFontSize(1.6),
    color: '#10b981',
    fontWeight: '600',
  },
});
