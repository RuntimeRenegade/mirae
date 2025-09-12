import { useEffect, useState, useRef } from 'react';
import { View, ScrollView, Text, Dimensions, Animated, StyleSheet, TouchableOpacity, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { BlurView } from 'expo-blur';
import CelticMaskedVideo from '../../components/mirae/MiraeMaskedView';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { GlassErrorBoundary } from '../../components/ui/GlassErrorBoundary';
import { useFadeInAnimation } from '../../hooks/useGlassAnimations';
import { useFonts } from '../../hooks/useFonts';
import { AppHeading1, AppSubtitle1 } from '../../components/AppText';
import { responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { useAuth } from '../../providers/AuthProvider';

import { useTokens } from '../../hooks/tokens';
import AuthModal from '../../components/ui/AuthModal';
import MiraeTokenModal from '../../iap/MiraeTokenModal';
import AdventureModeIntro from '../../components/mirae/AdventureModeIntro';
import { Ionicons } from '@expo/vector-icons';
import { Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Settings Modal Component
 */
interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  user: any;
  tokens: number | null;
  onSignOut: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  onRefreshTokens: () => Promise<void>;
  onShowAuth: () => void;
}

function SettingsModal({ visible, onClose, user, tokens, onSignOut, onDeleteAccount, onRefreshTokens, onShowAuth }: SettingsModalProps) {
  const [showTokenModal, setShowTokenModal] = useState(false);
  
  const handleSignOut = async () => {
    try {
      await onSignOut();
      onClose();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await onDeleteAccount();
      onClose();
    } catch (error) {
      console.error('Delete account error:', error);
    }
  };

  const handleRefreshTokens = async () => {
    try {
      await onRefreshTokens();
    } catch (error) {
      console.error('Refresh tokens error:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={90} tint="dark" style={settingsModalStyles.modalOverlay}>
        <TouchableOpacity
          style={settingsModalStyles.backdrop}
          onPress={onClose}
          activeOpacity={1}
        />
        <View style={settingsModalStyles.modalContainer}>
          <GlassCard variant="ultraClear" blurIntensity="medium" style={settingsModalStyles.modalContent}>
            {/* Header */}
            <View style={settingsModalStyles.header}>
              <Text style={settingsModalStyles.title}>Settings</Text>
              <TouchableOpacity onPress={onClose} style={settingsModalStyles.closeButton}>
                <Ionicons name="close" size={24} color="rgba(255, 255, 255, 0.8)" />
              </TouchableOpacity>
            </View>

            {/* User Info Section */}
            {user ? (
              <View style={settingsModalStyles.userSection}>
                <View style={settingsModalStyles.userInfo}>
                  <Ionicons name="person-circle" size={32} color="rgba(50, 145, 201, 0.8)" />
                  <View style={settingsModalStyles.userDetails}>
                    <Text style={settingsModalStyles.userName}>
                      {user.user_metadata?.full_name || user.email || 'User'}
                    </Text>
                    <Text style={settingsModalStyles.userEmail}>
                      {user.email}
                    </Text>
                  </View>
                </View>

                {/* Token Balance */}
                <View style={settingsModalStyles.tokenSection}>
                  <View style={settingsModalStyles.tokenInfo}>
                    <Ionicons name="diamond" size={20} color="#3b82f6" />
                    <Text style={settingsModalStyles.tokenLabel}>Token Balance</Text>
                    <TouchableOpacity onPress={handleRefreshTokens} style={settingsModalStyles.refreshButton}>
                      <Ionicons name="refresh" size={16} color="rgba(105, 94, 207, 0.6)" />
                    </TouchableOpacity>
                  </View>
                  <Text style={settingsModalStyles.tokenAmount}>
                    {tokens !== null ? `${tokens} tokens` : 'Loading...'}
                  </Text>
                  <GlassButton
                    title="Purchase Tokens"
                    variant="primary"
                    size="small"
                    onPress={() => setShowTokenModal(true)}
                    style={settingsModalStyles.purchaseButton}
                  />
                </View>
              </View>
            ) : (
              <View style={settingsModalStyles.guestSection}>
                <Ionicons name="person-outline" size={32} color="rgba(42, 178, 212, 1)" />
                <Text style={settingsModalStyles.guestText}>Not signed in</Text>
                <Text style={settingsModalStyles.guestSubtext}>
                  Sign in to save your stories and track your token balance
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={settingsModalStyles.actions}>
              {user ? (
                <>
                  <GlassButton
                    title="Sign Out"
                    variant="secondary"
                    size="medium"
                    onPress={handleSignOut}
                    style={settingsModalStyles.actionButton}
                  />
                  <GlassButton
                    title="Delete Account"
                    variant="secondary"
                    size="medium"
                    onPress={handleDeleteAccount}
                    style={settingsModalStyles.deleteButton}
                  />
                </>
              ) : (
                <GlassButton
                  title="Sign In"
                  variant="primary"
                  size="medium"
                  onPress={() => {
                    onClose();
                    onShowAuth();
                  }}
                  style={settingsModalStyles.actionButton}
                />
              )}
            </View>

            {/* Privacy and Terms Links */}
            <View style={settingsModalStyles.footer}>
              <View style={settingsModalStyles.legalLinks}>
                <TouchableOpacity
                  onPress={() => Linking.openURL('https://notgpt.net/privacy')}
                  style={settingsModalStyles.legalLink}
                >
                  <Text style={settingsModalStyles.legalLinkText}>Privacy Policy</Text>
                </TouchableOpacity>
                <Text style={settingsModalStyles.legalSeparator}>•</Text>
                <TouchableOpacity
                  onPress={() => Linking.openURL('https://notgpt.net/terms')}
                  style={settingsModalStyles.legalLink}
                >
                  <Text style={settingsModalStyles.legalLinkText}>Terms of Service</Text>
                </TouchableOpacity>
              </View>
            </View>
          </GlassCard>
        </View>
      </BlurView>
      
      {/* Purchase Tokens Modal */}
      <MiraeTokenModal 
        visible={showTokenModal}
        onClose={() => {
          setShowTokenModal(false);
          // Refresh tokens after modal closes
          handleRefreshTokens();
        }}
      />
    </Modal>
  );
}

// Settings Modal Styles
const settingsModalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
 
      width: responsiveWidth(80),
    height: responsiveHeight(80),

  },
  modalContent: {
    padding: 24,
        width: responsiveWidth(80),
    height: responsiveHeight(80),
    borderRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'rgba(64, 112, 245, 0.7)',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'rgba(64, 112, 245, 0.7)',
  },
  closeButton: {
    padding: 4,
  },
  userSection: {
    marginBottom: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userDetails: {
    marginLeft: 12,
    color: 'rgba(64, 112, 245, 0.7)',
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(64, 112, 245, 0.7)',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(64, 112, 245, 0.7)',
  },
  tokenSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tokenInfo: {
    color: 'rgba(64, 112, 245, 0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tokenLabel: {
    fontSize: 16,
   color: 'rgba(64, 112, 245, 0.7)',
    marginLeft: 8,
    flex: 1,
  },
  refreshButton: {
    padding: 4,
  },
  tokenAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  guestSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  guestText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(64, 112, 245, 0.7)',
    marginTop: 12,
    marginBottom: 8,
  },
  guestSubtext: {
    fontSize: 14,
    color: 'rgba(64, 112, 245, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButton: {
    width: '100%',
  },
  purchaseButton: {
    marginTop: 12,
    width: '100%',
  },
  deleteButton: {
    width: '100%',
    marginTop: 12,
    backgroundColor: 'rgba(220, 53, 69, 0.2)',
    borderColor: 'rgba(220, 53, 69, 0.5)',
    marginBottom: responsiveHeight(24),
  },
  footer: {
    marginTop: 20,
    paddingTop: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
     textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 2,
    gap: 15,
  },
  legalLink: {
     textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 2,
    padding: 4,
  },
  legalLinkText: {
    fontSize: 15,
     textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 2,
    color: 'rgba(0, 0, 0, 0.7)',
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.3)',
  },
});

/**
 * Enhanced Entry Page with Full Glass UI System
 * 
 * This is the main entry point that showcases all glass components with
 * animations, performance monitoring, and error handling.
 */

interface NavigationCard {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  color: 'pearl' | 'lavender' | 'mint';
}

export default function EnhancedAppEntryPage() {
  const router = useRouter();
  const { width: screenWidth } = Dimensions.get('window');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [authAction, setAuthAction] = useState<'create' | 'library'>('create');
  const [showAdventureIntro, setShowAdventureIntro] = useState(false);
  
  // Settings button animation
  const settingsButtonScale = useRef(new Animated.Value(1)).current;
  
  // Auth context
  const { user, signOut, deleteAccount } = useAuth();
  
  // Token context
  const { tokens, fetchTokenBalance } = useTokens();
  
  // Font loading
  const [fontsLoaded, fontError] = useFonts();
  
  // Determine if we're on a tablet
  const isTablet = screenWidth >= 768;

  // Navigation cards configuration
  const navigationCards: NavigationCard[] = [
    {
      id: 'stories',
      title: 'Interactive Stories',
      subtitle: 'Create and read magical stories',
      icon: '📚',
      route: '/mirae',
      color: 'lavender'
    },
    {
      id: 'gallery',
      title: 'Art Gallery',
      subtitle: 'Story illustrations',
      icon: '🎨',
      route: '/mirae/art',
      color: 'mint'
    },
    {
      id: 'profile',
      title: 'Profile',
      subtitle: 'Your reading journey',
      icon: '👤',
      route: '/mirae/profile',
      color: 'pearl'
    }
  ];

  // Animations
  const headerFadeAnim = useFadeInAnimation(0);

  // Load tokens when settings modal opens
  useEffect(() => {
    if (showSettingsModal && user) {
      fetchTokenBalance();
    }
  }, [showSettingsModal, user, fetchTokenBalance]);

  // Settings button pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(settingsButtonScale, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(settingsButtonScale, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    
    return () => pulse.stop();
  }, [settingsButtonScale]);
  

  // Don't render until fonts are loaded
  if (!fontsLoaded && !fontError) {
    return null;
  }

  const handleCreateStory = () => {
    if (user) {
      // User is authenticated, proceed to story creation
      router.push('/mirae/create');
    } else {
      // User not authenticated, show auth modal
      setAuthAction('create');
      setShowAuthModal(true);
    }
  };

  const handleLibraryAccess = () => {
    if (user) {
      // User is authenticated, proceed to library
      router.push('/mirae/library');
    } else {
      // User not authenticated, show auth modal
      setAuthAction('library');
      setShowAuthModal(true);
    }
  };

  const handleAdventureModePress = () => {
    if (user) {
      // Always show adventure intro since feature is coming soon
      setShowAdventureIntro(true);
    } else {
      // User not authenticated, show auth modal
      setAuthAction('library');
      setShowAuthModal(true);
    }
  };

  const handleAuthSuccess = () => {
    // After successful authentication, always stay on index page
    // Don't navigate anywhere - user remains on the home screen
    console.log('Auth successful, staying on index page');
  };

  const handleCardPress = (route: string) => {
    router.push(route as any);
  };

  const getCardStyle = (color: 'pearl' | 'lavender' | 'mint') => {
    const baseStyle = styles.navigationCard;
    const colorStyle = color === 'pearl' ? styles.navigationCardpearl :
                      color === 'lavender' ? styles.navigationCardlavender :
                      styles.navigationCardmint;
    return { ...baseStyle, ...colorStyle };
  };

  // Calculate grid dimensions
  const getGridConfig = () => {
    if (isTablet) {
      return {
        columns: 3,
        cardWidth: (screenWidth - 80) / 3,
        gap: 16
      };
    }
    return {
      columns: 2,
      cardWidth: (screenWidth - 60) / 2,
      gap: 12
    };
  };

  const gridConfig = getGridConfig();

  return (
    <GlassErrorBoundary>
      <View style={styles.container}>
        {/* Mirae Masked Video Background */}
        <View style={styles.backgroundContainer}>
          <CelticMaskedVideo 
            width={screenWidth} 
            height={Dimensions.get('window').height} 
            shouldPlay={true}
            style={[
              styles.maskedVideo,
              Platform.OS === 'android' && styles.androidMaskedVideo
            ]}
          />
        </View>
        
        {/* Content with Glass Effect */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <SafeAreaView style={styles.safeAreaContainer}>
          {/* Animated Header Section */}
          <Animated.View 
            style={[styles.headerContainer, { opacity: headerFadeAnim }]}
          ><LinearGradient colors={['#dad8d80a', 'rgba(255, 255, 255, 0)', 'rgba(236, 226, 226, 0.02)', 'rgba(236, 226, 226, 0.05)']} style={styles.headerGradient}>
            <BlurView intensity={15} tint='extraLight' style={styles.headerCard}>
              <View style={styles.headerCardContent}>
              <View style={styles.headerTextContainer}>
                <AppHeading1 style={styles.welcomeTitle}>
               Mirae
                </AppHeading1>
                  <AppHeading1 style={styles.welcomeTitle}>
               Immersive Stories for Young Readers
                </AppHeading1>
                <AppSubtitle1 style={styles.welcomeSubtitle}>
                 Powered by Dreams
                </AppSubtitle1>
              </View>
              
               
              </View>
               <GlassButton
              title="✨ Create New Story"
              variant="primary"
              size="large"
              onPress={handleCreateStory}
              style={styles.createStoryButton}
              />
              
              <GlassButton
              title="📚 Enchanted Library"
              variant="secondary"
              size="large"
              onPress={handleLibraryAccess}
              style={styles.libraryButton}
              />

              <GlassButton
              title="⚔️ Adventure Mode"
              variant="adventure"
              size="large"
              onPress={handleAdventureModePress}
              style={styles.libraryButton}
              />
             </BlurView>
            </LinearGradient>

           
      
            {/* Main Action Buttons */}
           

        
          </Animated.View>
          </SafeAreaView>
          </ScrollView>
      </View>
      
      {/* Settings Button - Fixed Position */}
      <View style={styles.settingsButtonContainer}>
        <Animated.View style={{ transform: [{ scale: settingsButtonScale }] }}>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => setShowSettingsModal(true)}
            activeOpacity={0.8}
          >
            <BlurView intensity={50} tint="light" style={styles.settingsButtonBlur}>
              <Ionicons name="settings-outline" size={20} color="rgba(24, 22, 22, 0.8)" />
            </BlurView>
          </TouchableOpacity>
        </Animated.View>
      </View>
      
      {/* Auth Modal */}
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        title={authAction === 'library' ? "Sign in to Access Library" : "Sign in to Create Stories"}
        description={authAction === 'library' ? "Create an account or sign in to access your magical story library" : "Create an account or sign in to start creating magical stories"}
      />

      {/* Settings Modal */}
      <SettingsModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        user={user}
        tokens={tokens}
        onSignOut={signOut}
        onDeleteAccount={deleteAccount}
        onRefreshTokens={fetchTokenBalance}
        onShowAuth={() => setShowAuthModal(true)}
      />

      {/* Adventure Mode Intro */}
      <AdventureModeIntro
        isVisible={showAdventureIntro}
        onComplete={() => setShowAdventureIntro(false)}
        onStartAdventure={() => {
          setShowAdventureIntro(false);
          // Adventure mode not implemented yet - just close the intro
        }}
      />
    </GlassErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Black background for video
    
  },
  backgroundContainer: {
    position: 'absolute',
    top: '4%',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    justifyContent: Platform.OS === 'android' ? 'flex-start' : 'flex-start',
    alignItems: 'center',
    backgroundColor: Platform.OS === 'android' ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
  },
  maskedVideo: {
    position: 'absolute',
  },
  androidMaskedVideo: {
    // Center the smaller masked video on Android
    top: '20%',
    alignSelf: 'center',
  },
  contentContainer: {
    flex: 1,
        width: responsiveWidth(80),
    height: responsiveHeight(80),
    backgroundColor: 'transparent',
  },
  safeAreaContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  headerContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingTop: 32,
    borderRadius: 55,
        overflow: 'hidden',
    paddingBottom: 24,
  },
  headerCard: {
    padding: 24,
    backgroundColor: 'transparent',
    overflow: 'hidden',
   
  },
  headerCardContent: {
    flexDirection: 'row',
    
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    alignContent: 'center',
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#ffffffff', // lavender-800
    marginBottom: 8,
    textAlign: 'center',
  },
  
  welcomeSubtitle: {
    fontSize: 18,
    color: '#eef5ffff', // gray-600
    textAlign: 'center',
  },
  debugText: {
    fontSize: 12,
    color: '#848b97ff', // gray-400
    marginTop: 8,
  },
  headerIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#e0e7ff', // lavender-100
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEmoji: {
    fontSize: 30,
  },
  actionButtonsContainer: {
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 32,
    marginTop: responsiveHeight(2),
  },
  createStoryButton: {
    width: '100%',
    marginTop: responsiveHeight(4),
    marginBottom: responsiveHeight(4),
    paddingVertical: 20,
  },
  libraryButton: {
    width: '100%',
    marginBottom: responsiveHeight(4) ,
    paddingVertical: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f0f6ffff', // gray-800
    marginBottom: 16,
  },
  gridContainer: {
    paddingHorizontal: 24,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  navigationCard: {
    padding: 24,
    height: 128,
    justifyContent: 'space-between',
  },
  navigationCardpearl: {
    backgroundColor: '#f8fafc10', // pearl background
  },
  navigationCardlavender: {
    backgroundColor: '#7c2cd157', // lavender background
  },
  navigationCardmint: {
    backgroundColor: '#7ce9b641', // mint background
  },
  cardContent: {
    flex: 1,
  },
  cardIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#efeff0ff', // gray-800
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#ffffffff', // gray-600
  },
  cardButton: {
    alignSelf: 'flex-start',
  },
  recentActivityContainer: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  recentBookCard: {
    padding: 24,
  },
  recentBookContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerGradient: {
   
    borderRadius: 32,
  },
  // Recent Book Styles
  bookCover: {
    width: 64,
    height: 80,
    backgroundColor: '#e0e7ff', // lavender-100
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookCoverEmoji: {
    fontSize: 24,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fdfdfdff', // gray-800
    marginBottom: 4,
  },
  bookChapter: {
    fontSize: 14,
    color: '#fafafaff', // gray-600
    marginBottom: 8,
  },
  progressBarBackground: {
    backgroundColor: '#e0e7ff', // lavender-100
    borderRadius: 9999,
    height: 8,
    marginBottom: 8,
  },
  progressBarFill: {
    backgroundColor: '#8b5cf6', // lavender-500
    borderRadius: 9999,
    height: 8,
    width: '75%',
  },
  progressText: {
    fontSize: 12,
    color: '#ffffffff', // gray-500
  },
  // Settings Button Styles
  settingsButtonContainer: {
    position: 'absolute',
    bottom: 40,
    right: 20,

    zIndex: 10,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  settingsButtonBlur: {
    flex: 1,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});
