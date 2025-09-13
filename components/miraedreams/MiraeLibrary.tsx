/**
 * MiraeLibrary Component (React Native)
 * 
 * User's book collection with detailed modal views and reading progress tracking
 * Production-ready version with real API integration
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Modal,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { CustomAlert, createCustomAlert } from '../ui/CustomAlert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';

// Components
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { GlassErrorBoundary } from '../ui/GlassErrorBoundary';
import { LoadingIndicator } from '../LoadingIndicator';
import { AppText, AppHeading1 } from '../AppText';
import CustomSafeAreaViewInner from '../ui/CustomSafeAreaViewInner';

import AdvancedParticleEffect from './AdvancedParticleEffect';
import BookGenerationPoller from './BookGenerationPoller';

// Types
import { Book } from '../../types/mirae';

// Hooks
import { useAuth } from '../../providers/AuthProvider';
import { useIsTablet } from '../../providers/DeviceProvider';
import { responsiveHeight, responsiveFontSize, responsiveWidth } from 'react-native-responsive-dimensions';

// Component to render multicolor text
const MultiColorText = ({ text, style }: { text: string; style: any }) => {
  const colors = [
    '#ffffffff', // lavender
    '#ffdcedff', // pink
    '#54ffccff', // teal
    '#a1e4ffff', // purple
    '#98d0f5ff', // bright pink
    '#faa0faff', // sky blue
    '#ffffffff', // light purple
    '#ffdcedff', // pink
    '#54ffccff', // teal
    '#a1e4ffff', // purple
    '#98d0f5ff', // bright pink
    '#faa0faff', // sky blue
    '#ffffffff', // light purple
  ];
  
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
      {text.split('').map((char, index) => (
        <Text
          key={index}
          style={[
            style,
            {
              color: colors[index % colors.length]
            }
          ]}
        >
          {char}
        </Text>
      ))}
    </View>
  );
};

interface MiraeLibraryProps {
  onCreateNew: () => void;
  onShowProgress?: (bookId: string) => void;
  onReaderOpen?: (bookId: string) => void;
  onReaderClose?: () => void;
  forceRefresh?: number;
}

interface BookModalData extends Book {
  pageCount?: number;
  estimatedReadTime?: number;
  lastReadPage?: number;
  readingProgress?: ReadingProgress;
  fixed_title?: boolean;
}

interface ReadingProgress {
  id: string;
  user_id: string;
  book_id: string;
  current_page: number;
  total_pages_read: number;
  reading_time_minutes: number;
  completion_percentage: number;
  last_read_at: string;
  reading_sessions: number;
  words_learned?: number;
  created_at: string;
  updated_at: string;
}

interface ReadingStats {
  totalBooksRead: number;
  totalReadingTime: number;
  averageCompletionRate: number;
  currentlyReading: number;
}

interface Pagination {
  offset: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

/**
 * Mirae Library Component (React Native)
 * 
 * User's book collection with detailed views and reading progress tracking.
 * Equivalent to the web library.tsx but optimized for React Native.
 */
export default function MiraeLibrary({
  onCreateNew,
  onShowProgress,
  onReaderOpen,
  onReaderClose,
  forceRefresh
}: MiraeLibraryProps) {
  // Real authentication integration
  const { user, session, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // 🌟 GLOBAL tablet detection - runs once at app startup
  const isTablet = useIsTablet();
  
  console.log('🎨 MiraeLibrary using global isTablet:', isTablet);

  // State management
  const [books, setBooks] = useState<BookModalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookModalData | null>(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Custom alert state
  const [customAlert, setCustomAlert] = useState<{
    visible: boolean;
    config: Omit<import('../ui/CustomAlert').CustomAlertProps, 'visible'> | null;
  }>({
    visible: false,
    config: null
  });
  
  // Helper function to show custom alerts
  const showCustomAlert = (config: Omit<import('../ui/CustomAlert').CustomAlertProps, 'visible'>) => {
    setCustomAlert({
      visible: true,
      config
    });
  };
  
  // Helper function to close custom alerts
  const closeCustomAlert = () => {
    setCustomAlert({
      visible: false,
      config: null
    });
  };


  // Offset-based pagination state
  const offsetRef = useRef(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    offset: 0,
    limit: 20,
    total: 0,
    hasMore: true
  });
  const [generatingBook, setGeneratingBook] = useState<{ bookId: string; title: string } | null>(null);
  const [readingStats, setReadingStats] = useState<ReadingStats>({
    totalBooksRead: 0,
    totalReadingTime: 0,
    averageCompletionRate: 0,
    currentlyReading: 0
  });
  const [fixingCoverTitle, setFixingCoverTitle] = useState<string | null>(null);
  const [titleFixMessage, setTitleFixMessage] = useState<string>('');
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  
  // Generation polling state
  const [generatingBooksStatus, setGeneratingBooksStatus] = useState<Record<string, {
    progress: number;
    currentStep: string;
    currentPhrase: string;
    title?: string;
  }>>({});
  const [currentFunPhraseIndex, setCurrentFunPhraseIndex] = useState<Record<string, number>>({});
  
  // Track which books we've already attempted to start generation for
  const [generationAttempts, setGenerationAttempts] = useState<Record<string, {
    attempted: boolean;
    timestamp: number;
  }>>({});
  
  // Track currently processing generation requests to prevent duplicates
  const processingGenerationRef = useRef<Set<string>>(new Set());

  // Fun phrases that cycle while generating
  const FUN_PHRASES = [
    "Starting to create your Magical Journey... ✨",
    "Sprinkling Magical Pixie Dust... 🧚‍♀️",
    "Gathering Rainbow Colors for your Story... 🌈",
    "Teaching Dragons to be Friendly... 🐉",
    "Building Candy Castles in the Clouds... 🏰",
    "Collecting Shooting Stars for Magic... ⭐",
    "Painting Butterfly Wings... 🦋",
    "Whispering Secrets to Unicorns... 🦄",
    "Making Friends with Forest Animals... 🦊",
    "Brewing Happiness Potions... 🧪",
    "Planting Seeds of Wonder... 🌱",
    "Teaching Flowers to Giggle... 🌺",
    "Wrapping Adventures in Moonbeams... 🌙",
    "Tickling the Imagination... 😄",
    "Charging up the Story Magic... ⚡",
    "Inviting Fairies to the Party... 🧚",
    "Organizing a Parade of Dreams... 🎪",
    "Baking Cookies with Wizard Elves... 🍪",
    "Dancing with Fireflies... ✨",
    "Building Bridges to Adventure... 🌉",
    "Polishing Magic Wands... 🪄",
    "Teaching Clouds to Make Funny Shapes... ☁️",
    "Collecting Giggles from Baby Dragons... 🐲",
    "Painting the Sky with Wonder... 🎨",
    "Weaving Tales with Golden Thread... 🧵",
    "Sprinkling Stardust on Every Page... ⭐",
    "Making Snow Angels in Summer... ❄️",
    "Teaching Trees to Tell Jokes... 🌳",
    "Filling Balloons with Dreams... 🎈",
    "Creating a Symphony of Smiles... 🎵",
    "Building Sandcastles in Space... 🏰",
    "Training Shooting Stars to Dance... 💫",
    "Mixing Colors That Don't Exist Yet... 🎨",
    "Teaching Sunshine to Play Hide and Seek... ☀️",
    "Collecting Dewdrops of Inspiration... 💧",
    "Making Friends with Talking Books... 📚",
    "Organizing a Tea Party for Characters... 🫖",
    "Sprinkling Courage on Every Adventure... 💪",
    "Teaching Wind to Carry Dreams... 💨",
    "Building Bridges Made of Laughter... 🌉",
    "Collecting Whispers from Wise Owls... 🦉",
    "Painting Rainbows After Every Storm... 🌈",
    "Making Magic Happen One Word at a Time... ✍️",
    "Teaching Stars Their Twinkle Dance... ⭐",
    "Wrapping Love in Every Chapter... 💝",
    "Building a Library of Wonder... 📖",
    "Sprinkling Joy Like Confetti... 🎊",
    "Teaching Mountains to Sing Lullabies... 🏔️",
    "Creating Paths Made of Possibilities... 🛤️",
    "Almost Ready for Your Grand Adventure... 🎭"
  ];

  // Helper function to separate text and emoji - simple and reliable
  const separateTextAndEmoji = (text: string) => {
    // Since all phrases end with "... [emoji]", split at the last ellipsis
    const parts = text.split('...');
    if (parts.length >= 2) {
      const textOnly = parts[0].trim() + '...';
      const emojis = [parts[1].trim()];
      return { textOnly, emojis };
    }
    
    // Fallback: no emoji found
    return { textOnly: text.trim(), emojis: [] };
  };

  // Map story style codes to display names
  const getStoryStyleDisplay = (storyStyle?: string): string | null => {
    if (!storyStyle) return null;
    
    const styleMap: Record<string, string> = {
      'dr_seuss': 'Whimsical Rhyme Style',
      'build_your_own_adventure': 'Interactive Adventure Style',
      'eric_carle': 'Collage Art Style',
      'maurice_sendak': 'Wild Adventure Style',
      'roald_dahl': 'Quirky Character Style',
      'shel_silverstein': 'Playful Poetry Style'
    };
    
    return styleMap[storyStyle] || null;
  };

  // Map art style codes to display names
  const getArtStyleDisplay = (artStyle?: string): string | null => {
    if (!artStyle) return null;
    // Simplified art style mapping - in real app this would use getArtStyleOptions()
    const artStyleMap: Record<string, string> = {
      'cartoon_friendly': 'Friendly Cartoon',
      'digital_modern': 'Modern Digital',
      'watercolor_soft': 'Soft Watercolor',
      'pencil_sketch': 'Pencil Sketch'
    };
    
    return artStyleMap[artStyle] || null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'ready':
        return {
          label: 'Ready to Read',
          color: '#10b981',
          icon: '✨'
        };
      case 'generating':
        return {
          label: 'Creating Magic...',
          color: '#f59e0b',
          icon: '🎨'
        };
      case 'failed':
        return {
          label: 'Creation Failed',
          color: '#ef4444',
          icon: '⚠️'
        };
      case 'draft':
        return {
          label: 'Draft',
          color: '#6b7280',
          icon: '📝'
        };
      default:
        return {
          label: 'Unknown',
          color: '#6b7280',
          icon: '❓'
        };
    }
  };

  const calculateReadingStats = (progressData: ReadingProgress[]): ReadingStats => {
    const completedBooks = progressData.filter(p => p.completion_percentage === 100);
    const currentlyReading = progressData.filter(p => p.completion_percentage > 0 && p.completion_percentage < 100);
    const totalReadingTime = progressData.reduce((sum, p) => sum + p.reading_time_minutes, 0);
    const averageCompletion = progressData.length > 0 
      ? progressData.reduce((sum, p) => sum + p.completion_percentage, 0) / progressData.length 
      : 0;

    return {
      totalBooksRead: completedBooks.length,
      totalReadingTime,
      averageCompletionRate: Math.round(averageCompletion),
      currentlyReading: currentlyReading.length
    };
  };

  // Helper functions to get display names for story elements
  const getSettingDisplayName = (name: string): string => {
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
      'arctic_wonderland': 'Arctic Wonderland'
    };
    return settingMap[name] || name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getFriendDisplayName = (name: string): string => {
    const friendMap: Record<string, string> = {
      'friendly_dragon': 'Friendly Dragon',
      'wise_owl': 'Wise Owl',
      'magical_unicorn': 'Magical Unicorn',
      'talking_fox': 'Talking Fox',
      'gentle_giant': 'Gentle Giant',
      'fairy_companion': 'Fairy Companion',
      'robot_buddy': 'Robot Buddy',
      'sea_creature_friend': 'Sea Creature Friend',
      'forest_spirit': 'Forest Spirit',
      'flying_companion': 'Flying Companion',
      'wise_turtle': 'Wise Turtle',
      'magical_cat': 'Magical Cat'
    };
    return friendMap[name] || name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getHeroDisplayName = (name: string): string => {
    const heroMap: Record<string, string> = {
      'brave_knight': 'Brave Knight',
      'clever_detective': 'Clever Detective',
      'magical_wizard': 'Magical Wizard',
      'space_explorer': 'Space Explorer',
      'ocean_adventurer': 'Ocean Adventurer',
      'forest_ranger': 'Forest Ranger',
      'sky_pilot': 'Sky Pilot',
      'treasure_hunter': 'Treasure Hunter',
      'nature_guardian': 'Nature Guardian',
      'time_traveler': 'Time Traveler',
      'crystal_keeper': 'Crystal Keeper',
      'star_navigator': 'Star Navigator'
    };
    return heroMap[name] || name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const startGeneration = async (bookId: string) => {
    if (!session?.access_token) {
      console.warn('⚠️ No session token available for generation');
      return null;
    }

    try {
      console.log('🚀 Starting generation for book:', bookId);
      
      const response = await fetch('https://mirae.ngrok.dev/api/mirae/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ book_id: bookId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Generation API error:', response.status, errorText);
        throw new Error(`Failed to start generation: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Generation started successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error starting generation:', error);
      return null;
    }
  };

  const fetchReadingProgress = useCallback(async () => {
    if (!user?.id || !session?.access_token) return [];

    try {
      const response = await fetch('https://www.notgpt.net/api/mirae/reading-progress', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        console.error('❌ Failed to fetch reading progress');
        return [];
      }

      const data = await response.json();
      return data.progress || [];
    } catch (error) {
      console.error('❌ Error fetching reading progress:', error);
      return [];
    }
  }, [user?.id, session?.access_token]);

  const fetchBooks = useCallback(async (isLoadMore = false) => {
    if (!session?.user?.id) return

    try {
      if (isLoadMore) {
        setLoadingMore(true)
      } else {
        setLoading(true)
        // Reset offset for fresh fetch
        offsetRef.current = 0
      }
      
      const currentOffset = isLoadMore ? offsetRef.current : 0
      const limit = 20
      
      console.log('📚 Fetching books:', { isLoadMore, currentOffset, limit })
      
      // Always fetch books first
      const booksResponse = await fetch(`https://www.notgpt.net/api/mirae/books?limit=${limit}&offset=${currentOffset}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!booksResponse.ok) {
        throw new Error('Failed to fetch books')
      }

      const booksData = await booksResponse.json()
      
      console.log('📚 Books API response:', { 
        receivedBooks: booksData.books?.length || 0, 
        pagination: booksData.pagination 
      })
      
      if (Array.isArray(booksData.books)) {
        // Update offset for next request
        const nextOffset = currentOffset + limit
        offsetRef.current = nextOffset
        
        // Update pagination info
        setPagination({
          offset: nextOffset,
          limit: limit,
          total: booksData.pagination?.total || 0,
          hasMore: booksData.pagination?.hasMore || false
        })

        // Fetch reading progress for all books (both initial and load more)
        // This ensures we always have progress data for newly loaded books
        const progressData = await fetchReadingProgress()
        
        // Create a map of reading progress by book_id for easy lookup
        const progressMap = new Map(progressData.map((p: ReadingProgress) => [p.book_id, p]))
        
        const booksWithExtras = booksData.books.map((book: Book) => {
          const progress = progressMap.get(book.id) as ReadingProgress | undefined
          return {
            ...book,
            pageCount: book.total_pages || 0,
            estimatedReadTime: book.total_pages ? Math.ceil(book.total_pages * 2) : 0,
            lastReadPage: progress?.current_page || 0,
            readingProgress: progress
          }
        })
        
        if (isLoadMore) {
          // Append new books to existing ones
          console.log('📚 Appending', booksWithExtras.length, 'new books to existing list with progress data')
          setBooks(prevBooks => [...prevBooks, ...booksWithExtras])
          
          // Update reading stats for load more as well to include any new progress
          if (progressData.length > 0) {
            const stats = calculateReadingStats(progressData)
            setReadingStats(stats)
            console.log('📊 Updated reading stats on load more:', stats)
          }
        } else {
          // Replace books for fresh fetch
          console.log('📚 Replacing with', booksWithExtras.length, 'books with progress data')
          setBooks(booksWithExtras)
          
          // Calculate reading stats on fresh fetch
          if (progressData.length > 0) {
            const stats = calculateReadingStats(progressData)
            setReadingStats(stats)
            console.log('📊 Calculated reading stats on fresh load:', stats)
          }
        }
      } else {
        console.error('❌ Invalid response format:', booksData)
        if (!isLoadMore) {
          setBooks([])
        }
      }
    } catch (error) {
      console.error('❌ Error fetching books:', error)
      if (!isLoadMore) {
        setBooks([])
      }
      showCustomAlert(createCustomAlert.error('Error', 'Failed to load your story collection. Please check your connection and try again.'))
    } finally {
      if (isLoadMore) {
        setLoadingMore(false)
      } else {
        setLoading(false)
      }
    }
  }, [session?.user?.id, session?.access_token, fetchReadingProgress])

  const loadMoreBooks = useCallback(async () => {
    if (loadingMore || !pagination.hasMore) return
    await fetchBooks(true)
  }, [fetchBooks, loadingMore, pagination.hasMore])

  const handleReadBook = (bookId: string) => {
    // Get the selected book's reading progress
    const book = selectedBook;
    const hasProgress = book?.readingProgress?.current_page && book.readingProgress.current_page > 1;
    
    console.log('📖 handleReadBook called:', {
      bookId,
      hasProgress,
      currentPage: book?.readingProgress?.current_page,
      selectedBook: book?.title
    });
    
    setSelectedBook(null);
    setShowBookModal(false);
    
    // Navigate to the interactive story reader with continue reading parameters
    const routeParams: any = { bookId: bookId };
    
    if (hasProgress && book?.readingProgress?.current_page) {
      routeParams.continueReading = 'true';
      routeParams.initialPage = book.readingProgress.current_page.toString();
      console.log('📖 Adding continue reading params:', routeParams);
    }
    
    console.log('📖 Navigating with params:', routeParams);
    router.push({
      pathname: '/mirae/reader',
      params: routeParams
    });
    onReaderOpen?.(bookId);
  };

  const handleBookSelect = async (book: BookModalData) => {
    setSelectedBook(book);
    setShowBookModal(true);
  };

  const handleGenerateBook = async (book: BookModalData) => {
    console.log('🚀 Starting generation for book:', book.id, book.title);
    
    if (!user?.id || !session?.access_token) {
      showCustomAlert(createCustomAlert.authError('Please sign in to generate books.'));
      return;
    }
    
    try {
      setGeneratingBook({ bookId: book.id, title: book.title });
      setSelectedBook(null);
      setShowBookModal(false);
      
      const response = await fetch('https://mirae.ngrok.dev/api/mirae/books/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          book_id: book.id,
          title: book.title,
          child_name: book.child_name,
          child_gender: book.child_gender,
          child_age: book.child_age,
          story_setting: book.story_setting,
          monster_type: book.monster_type,
          hero_type: book.hero_type,
          art_style: book.art_style,
          story_style: book.story_style
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start book generation');
      }

      const result = await response.json();
      
      if (result.success) {
        // Show success message
        showCustomAlert(createCustomAlert.success(
          'Generation Started',
          'Your story is being created! You can monitor the progress below.',
          'OK'
        ));
        
        // Trigger progress view
        if (onShowProgress) {
          onShowProgress(book.id);
        }
        
        // Refresh books list
        offsetRef.current = 0
        setPagination(prev => ({ ...prev, offset: 0, hasMore: true }))
        fetchBooks(false);
      } else {
        throw new Error(result.error || 'Failed to start book generation');
      }
    } catch (error) {
      console.error('❌ Error starting generation:', error);
      showCustomAlert(createCustomAlert.error('Error', 'Failed to start book generation. Please try again.'));
      setGeneratingBook(null);
    }
  };

  const handleFixCoverTitle = async (book: BookModalData) => {
    if (!user?.id || !session?.access_token || !book.cover_image_url) {
      showCustomAlert(createCustomAlert.error('Error', 'Unable to fix cover title. Please ensure you are signed in and the book has a cover image.'));
      return;
    }

    console.log('🔧 Starting title fix for book:', book.id, book.title);
    
    try {
      setFixingCoverTitle(book.id);
      setSelectedBook(null); // Close modal
      setShowBookModal(false);
      setTitleFixMessage(`Analyzing "${book.title}" cover...`);

      // First analyze the cover
      const analysisResponse = await fetch('https://www.notgpt.net/api/mirae/fix-book-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          book_id: book.id,
          analyze_only: true 
        })
      });

      const analysisResult = await analysisResponse.json();

      if (!analysisResponse.ok) {
        throw new Error(analysisResult.error || 'Failed to analyze cover');
      }

      console.log('🔍 Cover analysis:', analysisResult.analysis);

      if (!analysisResult.analysis.needsFixing) {
        setTitleFixMessage(`"${book.title}" cover looks perfect! No changes needed.`);
        setFixingCoverTitle(null);
        
        setTimeout(() => {
          setTitleFixMessage('');
        }, 3000);
        return;
      }

      // If fixing is needed, proceed with the edit
      setTitleFixMessage(`Fixing title positioning for "${book.title}"...`);

      const editResponse = await fetch('https://www.notgpt.net/api/mirae/fix-book-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          book_id: book.id,
          analyze_only: false 
        })
      });

      const editResult = await editResponse.json();

      if (!editResponse.ok) {
        throw new Error(editResult.error || 'Failed to fix cover title');
      }

      if (editResult.success && editResult.editedImageUrl) {
        // Update the book in our local state
        setBooks(prevBooks => 
          prevBooks.map(b => 
            b.id === book.id 
              ? { ...b, cover_image_url: editResult.editedImageUrl, fixed_title: true }
              : b
          )
        );

        setTitleFixMessage(`✨ "${book.title}" cover has been enhanced!`);
      } else {
        throw new Error('Cover fix completed but no edited image received');
      }

    } catch (error) {
      console.error('❌ Error fixing cover title:', error);
      setTitleFixMessage(`Failed to fix "${book.title}" cover. Please try again.`);
    } finally {
      setFixingCoverTitle(null);
      
      setTimeout(() => {
        setTitleFixMessage('');
      }, 4000);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    offsetRef.current = 0
    setPagination(prev => ({ ...prev, offset: 0, hasMore: true }))
    fetchBooks(false).finally(() => setRefreshing(false));
  };

  const handleImageLoadStart = (bookId: string) => {
    setLoadingImages(prev => new Set([...prev, bookId]));
  };

  const handleImageLoadEnd = (bookId: string) => {
    setLoadingImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(bookId);
      return newSet;
    });
  };

  // Generation status handlers for BookGenerationPoller
  const handleGenerationStatusUpdate = (bookId: string, status: {
    status: string;
    generation_progress?: number;
    current_step?: string;
    title?: string;
  }) => {
    console.log('📊 Generation status update from poller:', {
      bookId,
      status: status.status,
      progress: status.generation_progress,
      step: status.current_step
    });

    // Update local state with generation progress
    setGeneratingBooksStatus(prev => ({
      ...prev,
      [bookId]: {
        progress: status.generation_progress || 0,
        currentStep: status.current_step || 'processing',
        currentPhrase: prev[bookId]?.currentPhrase || FUN_PHRASES[0],
        title: status.title || prev[bookId]?.title || 'Unknown'
      }
    }));

    // Update the book in our books list
    setBooks(prevBooks => 
      prevBooks.map(b => 
        b.id === bookId 
          ? { 
              ...b, 
              status: status.status as 'generating' | 'completed' | 'draft' | 'error',
              generation_progress: status.generation_progress || b.generation_progress || 0,
              current_step: status.current_step || b.current_step,
              title: status.title || b.title 
            }
          : b
      )
    );
  };

  const handleGenerationComplete = (bookId: string) => {
    console.log('✅ Generation completed for book:', bookId);
    
    // Clear the generating status for this book
    setGeneratingBooksStatus(prev => {
      const updated = { ...prev };
      delete updated[bookId];
      return updated;
    });
    
    // Clear generation attempts for this book
    setGenerationAttempts(prev => {
      const updated = { ...prev };
      delete updated[bookId];
      return updated;
    });
    
    // Refresh books list to get the completed book
    fetchBooks(false);
  };

  // Effects
  


  // Auto-start generation for draft books
  useEffect(() => {
    const booksNeedingGeneration = books.filter(book => book.status === 'draft');
    
    if (booksNeedingGeneration.length === 0) return;

    console.log('📊 Auto-generation useEffect triggered:', {
      draft: booksNeedingGeneration.map(b => ({ id: b.id, title: b.title })),
      timestamp: new Date().toISOString()
    });

    const COOLDOWN_PERIOD = 60000; // 60 seconds cooldown between generation attempts (matches API rate limit)

    booksNeedingGeneration.forEach(book => {
      const now = Date.now();
      const lastAttempt = generationAttempts[book.id];
      
      // Check if we're already processing this book's generation
      if (processingGenerationRef.current.has(book.id)) {
        console.log('⏳ Already processing generation for', book.id, '- skipping');
        return;
      }
      
      // Only start generation if we haven't attempted it yet, or if enough time has passed
      const shouldAttemptGeneration = !lastAttempt || 
        (!lastAttempt.attempted || (now - lastAttempt.timestamp > COOLDOWN_PERIOD));

      if (shouldAttemptGeneration) {
        console.log('🚀 Book in draft status, starting generation:', book.id);
        
        // Mark as currently processing
        processingGenerationRef.current.add(book.id);
        
        // Mark this book as having an attempted generation
        setGenerationAttempts(prev => ({
          ...prev,
          [book.id]: {
            attempted: true,
            timestamp: now
          }
        }));

        // Start generation (async, don't wait for result)
        startGeneration(book.id).then(result => {
          if (result) {
            console.log('✅ Generation started successfully for:', book.id);
            // Update book status to generating in our local state
            setBooks(prevBooks => 
              prevBooks.map(b => 
                b.id === book.id 
                  ? { ...b, status: 'generating', current_step: 'character_generation' }
                  : b
              )
            );
          } else {
            console.log('❌ Failed to start generation for:', book.id);
            // Reset attempt status on failure so we can retry later
            setGenerationAttempts(prev => ({
              ...prev,
              [book.id]: {
                attempted: false,
                timestamp: now
              }
            }));
          }
        }).finally(() => {
          // Remove from processing set regardless of success/failure
          processingGenerationRef.current.delete(book.id);
        });
      } else {
        console.log('⏳ Skipping generation start for', book.id, '- recently attempted or cooldown active');
      }
    });
  }, [books, session?.access_token]); // REMOVED generationAttempts from dependencies!

  // Fun phrase cycling effect
  useEffect(() => {
    const generatingBooks = books.filter(book => book.status === 'generating');
    if (generatingBooks.length === 0) return;

    const interval = setInterval(() => {
      setCurrentFunPhraseIndex(prev => {
        const updated = { ...prev };
        generatingBooks.forEach(book => {
          const currentIndex = prev[book.id] || 0;
          const nextIndex = (currentIndex + 1) % FUN_PHRASES.length;
          updated[book.id] = nextIndex;
        });
        return updated;
      });

      // Update the current phrase in generating books status
      setGeneratingBooksStatus(prev => {
        const updated = { ...prev };
        generatingBooks.forEach(book => {
          if (updated[book.id]) {
            const currentIndex = currentFunPhraseIndex[book.id] || 0;
            const nextIndex = (currentIndex + 1) % FUN_PHRASES.length;
            updated[book.id] = {
              ...updated[book.id],
              currentPhrase: FUN_PHRASES[nextIndex]
            };
          } else {
            // Initialize for new generating books
            updated[book.id] = {
              progress: 0,
              currentStep: 'starting',
              currentPhrase: FUN_PHRASES[0],
              title: book.title
            };
          }
        });
        return updated;
      });
    }, 2500); // Change phrase every 2.5 seconds

    return () => clearInterval(interval);
  }, [books, currentFunPhraseIndex, FUN_PHRASES]);

  // Cleanup old generation attempts periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      const MAX_ATTEMPT_AGE = 300000; // 5 minutes
      
      setGenerationAttempts(prev => {
        const filtered: typeof prev = {};
        Object.entries(prev).forEach(([bookId, attempt]) => {
          if (now - attempt.timestamp < MAX_ATTEMPT_AGE) {
            filtered[bookId] = attempt;
          }
        });
        return filtered;
      });
    }, 60000); // Run cleanup every minute

    return () => clearInterval(cleanup);
  }, []);

  useEffect(() => {
    fetchBooks(false);
  }, [fetchBooks]);

  // Handle forced refresh trigger
  useEffect(() => {
    if (forceRefresh && forceRefresh > 0) {
      console.log('🔄 Force refreshing library due to external trigger...');
      offsetRef.current = 0
      setPagination(prev => ({ ...prev, offset: 0, hasMore: true }))
      fetchBooks(false);
    }
  }, [forceRefresh, fetchBooks]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (titleFixMessage) {
      const timer = setTimeout(() => {
        setTitleFixMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [titleFixMessage]);

  // Authentication loading state
  if (authLoading) {
    return (
      <LoadingIndicator 
        variant="fullscreen"
        message="Checking authentication..."
        size="large"
      />
    );
  }

  // Not authenticated state
  if (!user || !session) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#151817ff', '#222423ff', '#3b4140ff', '#34393affff', '#171718ff']}
          style={StyleSheet.absoluteFill}
        >
          <AppHeading1 style={styles.authErrorTitle}>Sign In Required</AppHeading1>
          <AppText style={styles.authErrorText}>Please sign in to view your magical library</AppText>
        </LinearGradient>
      </View>
    );
  }

  // Loading state
  if (loading) {
    return (
      <LoadingIndicator 
        variant="fullscreen"
        message="Loading your magical library..."
        size="large"
      />
    );
  }

  // Generating book state
  if (generatingBook) {
    return (
      <View style={styles.generatingContainer}>
        <Text style={styles.generatingTitle}>Creating Magic...</Text>
        <Text style={styles.generatingSubtitle}>"{generatingBook.title}"</Text>
        <LoadingIndicator 
          variant="default"
          size="large"
          showMessage={false}
        />
      </View>
    );
  }

  // Main render
  return (
    <GlassErrorBoundary>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        {/* Background Gradient */}
        <LinearGradient
          colors={['#1a1819ef', '#1e2138ff', '#1c1e1fff', 'rgba(20, 19, 68, 1)', '#142e3bff']}
          style={styles.backgroundGradient}
        />

        {/* Advanced Magical Background Particles */}
        <AdvancedParticleEffect 
          particleCount={12}
          colors={['rgba(15, 195, 250, 0.9)', 'rgba(51, 128, 228, 0.95)', 'rgba(85, 223, 228, 0.85)', 'rgba(255, 255, 255, 0.95)', 'rgba(255, 182, 193, 0.9)']}
          enabled={true}
        />

        {/* Sparkles Video Background */}
        <View style={styles.sparklesVideoContainer}>
          <Video
            source={require('../../assets/video/sparkles.mp4')}
            style={styles.sparklesVideo}
            shouldPlay={true}
            isLooping={true}
            isMuted={true}
            resizeMode={ResizeMode.COVER}
          />
        </View>

        {/* Book Generation Poller - Invisible component for database polling */}
        <BookGenerationPoller
          generatingBooks={books.filter(book => 
            book.status === 'generating' || book.status === 'draft'
          ).map(book => ({
            id: book.id,
            title: book.title,
            status: book.status,
            generation_progress: book.generation_progress,
            current_step: book.current_step
          }))}
          onStatusUpdate={handleGenerationStatusUpdate}
          onGenerationComplete={handleGenerationComplete}
          pollingInterval={5000} // Poll every 5 seconds
        />

        {/* Header - Absolutely Positioned */}
        <View style={[
          styles.headerContainer,
       
        ]}>
          {/* 🔍 DEBUG: Visual tablet indicator */}
          {isTablet && (
            <View style={{
              position: 'absolute',
              top: 0,
              right: 0,
              backgroundColor: 'red',
              padding: 5,
              zIndex: 9999,
              borderRadius: 5
            }}>
              
            </View>
          )}
     
            <BlurView 
              intensity={10} 
              tint="systemChromeMaterialDark" 
              style={[
                styles.headerCard,
                isTablet && {
                  minHeight: responsiveHeight(35),
                  paddingVertical: 55 // Extra top padding for tablet status bar
                }
              ]}
            >
              <View style={[
                styles.headerContent,
                isTablet && {
                  minHeight: responsiveHeight(18),
                  paddingTop: 10
                }
              ]}>
                <View style={styles.headerTitleSection}>

                  <View>
                  <AppHeading1 style={[
                    styles.headerTitle,
                    isTablet && {
                      fontSize: responsiveFontSize(2) // Larger title for tablets
                    }
                  ]}>Enchanted Library</AppHeading1>
                  <AppText style={[
                    styles.headerSubtitle,
                    isTablet && {
                      fontSize: responsiveFontSize(2), // Larger subtitle for tablets
                      marginTop: 4
                    }
                  ]}>
                    Welcome to your collection of personalized stories
                  </AppText>
                </View>
              </View>

              {/* Quick Stats */}
              <View style={[
                styles.statsContainer,
                isTablet && {
                  padding: 20, // More padding for tablets
                  marginTop: 8
                }
              ]}>
                <View style={styles.statItem}>
                  <Text style={[
                    styles.statNumber,
                    isTablet && {
                      fontSize: responsiveFontSize(1.8) // Larger numbers for tablets
                    }
                  ]}>{readingStats.totalBooksRead}</Text>
                  <Text style={[
                    styles.statLabel,
                    isTablet && {
                      fontSize: responsiveFontSize(1.8) // Larger labels for tablets
                    }
                  ]}>Completed</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[
                    styles.statNumber,
                    isTablet && {
                      fontSize: responsiveFontSize(2)
                    }
                  ]}>{readingStats.currentlyReading}</Text>
                  <Text style={[
                    styles.statLabel,
                    isTablet && {
                      fontSize: responsiveFontSize(1.7)
                    }
                  ]}>Reading</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[
                    styles.statNumber,
                    isTablet && {
                      fontSize: responsiveFontSize(1)
                    }
                  ]}>{readingStats.totalReadingTime}m</Text>
                  <Text style={[
                    styles.statLabel,
                    isTablet && {
                      fontSize: responsiveFontSize(1)
                    }
                  ]}>Time</Text>
                </View>
              </View>
            </View>
          </BlurView>
        
        </View>

     
          {/* Success Message */}
          {successMessage && (
            <BlurView 
              intensity={20} 
              tint="light" 
              style={[
                styles.successMessage,
                isTablet && {
                  top: 80, // Lower position for taller tablet header
                  left: 40,
                  right: 40
                }
              ]}
            >
              <Text style={styles.successMessageText}>✨ {successMessage}</Text>
            </BlurView>
          )}

          {/* Title Fix Message */}
          {titleFixMessage && (
            <BlurView 
              intensity={20} 
              tint="light" 
              style={[
                styles.titleFixMessage,
                isTablet && {
                  top: responsiveHeight(25), // Lower position for taller tablet header
                  left: 40,
                  right: 40
                }
              ]}
            >
              <Text style={styles.titleFixMessageText}>
                {fixingCoverTitle ? '🎨 ' : '🎨 '}{titleFixMessage}
              </Text>
            </BlurView>
          )}

          {/* Books Collection */}
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#ffffff"
                titleColor="#ffffff"
              />
            }
            contentContainerStyle={[
              styles.scrollContent,
              isTablet && {
                paddingTop: responsiveHeight(23) // More padding for taller tablet header
              }
            ]}
            onScroll={(event) => {
              const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
              const paddingToBottom = 20;
              if (layoutMeasurement.height + contentOffset.y >= 
                  contentSize.height - paddingToBottom && 
                  pagination.hasMore && 
                  !loadingMore && 
                  books.length > 0) {
                console.log('📚 Load more triggered - Books count:', books.length);
                loadMoreBooks();
              }
            }}
            scrollEventThrottle={400}
          >
            {books.length === 0 ? (
              // Empty state
              <View style={[
                styles.emptyStateContainer,
                isTablet && {
                  marginTop: -160, // Adjust for taller tablet header
                  paddingHorizontal: 60 // More padding on tablets
                }
              ]}>
                <BlurView intensity={20} tint="light" style={[
                  styles.emptyStateCard,
                  isTablet && {
                    padding: 40,
                    maxWidth: 400 // Wider card for tablets
                  }
                ]}>
                  <View style={styles.emptyStateContent}>
                    <Text style={[
                      styles.emptyStateIcon,
                      isTablet && {
                        fontSize: responsiveFontSize(2.0) // Larger icon for tablets
                      }
                    ]}>📖</Text>
                    <AppHeading1 style={[
                      styles.emptyStateTitle,
                      isTablet && {
                        fontSize: responsiveFontSize(1.2) // Larger title for tablets
                      }
                    ]}>Your Library Awaits</AppHeading1>
                    <AppText style={[
                      styles.emptyStateSubtitle,
                      isTablet && {
                        fontSize: responsiveFontSize(1.4), // Larger subtitle for tablets
                        lineHeight: 28,
                        marginBottom: 30
                      }
                    ]}>
                      Create your first personalized story and begin your magical reading journey. 
                      Each book is tailored specifically for you!
                    </AppText>
                    
                    {/* Create New Story Button - Only shown in empty state */}
                    <View style={styles.emptyStateButtonContainer}>
                      <GlassButton
                        title="Create New Story"
                        variant="primary"
                        size="large"
                        onPress={onCreateNew}
                        style={styles.emptyStateButton}
                      />
                    </View>
                  </View>
                </BlurView>
              </View>
            ) : (
              // Books grid
              <View style={[
                styles.booksGrid,
                isTablet && {
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  gap: 20
                }
              ]}>
                {books.map((book) => {
                  const badge = getStatusBadge(book.status);
                  const progress = book.readingProgress;
                  
                  return (
                    <TouchableOpacity
                      key={book.id}
                      onPress={() => book.status !== 'generating' && book.status !== 'draft' ? handleBookSelect(book) : undefined}
                      activeOpacity={0.8}
                      style={[
                        styles.bookCardContainer,
                        isTablet && {
                          width: '48%', // Two columns on tablet
                          marginBottom: 16
                        }
                      ]}
                    >
                     <BlurView intensity={20} tint="light" style={styles.bookCard}>
                        {/* Cover Image */}
                        <View style={styles.bookCover}>
                          {book.cover_image_url ? (
                            <View style={{ position: 'relative', flex: 1 }}>
                              <Image
                                source={{ uri: book.cover_image_url }}
                                style={styles.bookCoverImage}
                                resizeMode="contain"
                                onLoadStart={() => handleImageLoadStart(book.id)}
                                onLoadEnd={() => handleImageLoadEnd(book.id)}
                                onError={() => handleImageLoadEnd(book.id)}
                              />
                              {loadingImages.has(book.id) && (
                                <View style={styles.bookCoverLoading}>
                                  <LoadingIndicator 
                                    variant="inline"
                                    size="medium"
                                    message="Loading cover..."
                                    showMessage={false}
                                  />
                                </View>
                              )}
                            </View>
                          ) : (
                            <View style={styles.bookCoverPlaceholder}>
                              {book.status === 'generating' ? (
                                (() => {
                                  const currentPhrase = generatingBooksStatus[book.id]?.currentPhrase || "Starting to create your Magical Journey...";
                                  const { textOnly, emojis } = separateTextAndEmoji(currentPhrase);
                                  
                                  return (
                                    <View style={{ minWidth: responsiveWidth(5), alignItems: 'center' }}>
                                      <MultiColorText 
                                        text={textOnly.split(' ').slice(0, Math.ceil(textOnly.split(' ').length / 2)).join(' ')}
                                        style={[
                                          styles.bookCoverGeneratingText,
                                          isTablet && { fontSize: responsiveFontSize(1) }
                                        ]}
                                      />
                                      <MultiColorText 
                                        text={textOnly.split(' ').slice(Math.ceil(textOnly.split(' ').length / 2)).join(' ')}
                                        style={[
                                          styles.bookCoverGeneratingText, 
                                          { marginTop: 2 },
                                          isTablet && { fontSize: responsiveFontSize(1) }
                                        ]}
                                      />
                                      {emojis.length > 0 && (
                                        <Text style={[
                                          styles.bookCoverGeneratingText, 
                                          { 
                                            fontSize: responsiveFontSize(3.5), 
                                            marginTop: 4,
                                            ...(isTablet && { fontSize: responsiveFontSize(1) })
                                          }
                                        ]}>
                                          {emojis.join(' ')}
                                        </Text>
                                      )}
                                    </View>
                                  );
                                })()
                              ) : (
                                <Text style={[
                                  styles.bookCoverPlaceholderText,
                                  isTablet && { fontSize: responsiveFontSize(1) }
                                ]}>📖</Text>
                              )}
                            </View>
                          )}
                          
                          {/* Status Badge */}
                          <View style={[styles.statusBadge, { backgroundColor: badge.color }]}>
                            <Text style={[
                              styles.statusBadgeText,
                              isTablet && { fontSize: responsiveFontSize(1) }
                            ]}>{badge.icon}</Text>
                          </View>
                        </View>

                        {/* Book Info */}
                        <View style={styles.bookInfo}>
                          <AppHeading1 style={[
                            styles.bookTitle,
                            isTablet && { fontSize: responsiveFontSize(1) }
                          ]}>{book.title}</AppHeading1>
                          <AppText style={[
                            styles.bookMeta,
                            isTablet && { fontSize: responsiveFontSize(1) }
                          ]}>
                            {book.child_name}, age {book.child_age} • {book.pageCount || 0} pages
                          </AppText>
                          
                          {book.description && (
                            <AppText style={[
                              styles.bookDescription,
                              isTablet && { fontSize: responsiveFontSize(1) }
                            ]} numberOfLines={2}>
                              {book.description}
                            </AppText>
                          )}

                          {/* Progress Bar */}
                          {progress && (
                            <View style={styles.progressContainer}>
                              <View style={styles.progressBar}>
                                <View
                                  style={[
                                    styles.progressFill,
                                    { width: `${progress.completion_percentage}%` }
                                  ]}
                                />
                              </View>
                              <AppText style={[
                                styles.progressText,
                                isTablet && { fontSize: responsiveFontSize(1) }
                              ]}>
                                {progress.completion_percentage}% complete
                              </AppText>
                            </View>
                          )}

                          {/* Action Buttons */}
                          <View style={styles.bookActions}>
                            {book.status === 'generating' ? (
                              <View style={styles.generationProgressContainer}>
                                {/* Generation Progress Bar */}
                                <View style={styles.generationProgressBar}>
                                  <View
                                    style={[
                                      styles.generationProgressFill,
                                      { width: `${generatingBooksStatus[book.id]?.progress || 0}%` }
                                    ]}
                                  />
                                </View>
                                
                                {/* Progress Percentage */}
                                <AppText style={[
                                  styles.generationProgressText,
                                  isTablet && { fontSize: responsiveFontSize(1) }
                                ]}>
                                  {generatingBooksStatus[book.id]?.progress || 0}% complete
                                </AppText>
                              </View>
                            ) : book.status === 'draft' ? (
                              <View style={styles.generationProgressContainer}>
                                {/* Empty container - no text */}
                              </View>
                            ) : null}
                          </View>
                        </View>
                      </BlurView>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* Pagination Loading Indicator */}
            {loadingMore && pagination.hasMore && (
              <View style={styles.loadingContainer}>
                <LoadingIndicator 
                  variant="inline"
                  message="Loading more stories..."
                  size="small"
                />
              </View>
            )}
          </ScrollView>

          {/* Book Detail Modal */}
          <Modal
            visible={showBookModal && selectedBook !== null}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowBookModal(false)}
          >
            {selectedBook && (
              <View style={styles.modalContainer}>
                <LinearGradient
                 colors={['#020202d3', '#0c052bff', '#1a1d1dff', 'rgba(17, 18, 19, 1)', '#27292bff']}
                  style={styles.modalBackground}
                />
                
                <CustomSafeAreaViewInner style={styles.modalSafeArea} videoSource='mirae8'>
                  {/* Modal Header */}
                  <View style={styles.modalHeader}>
                    <AppHeading1 style={[
                      styles.modalTitle,
                      isTablet && { fontSize: responsiveFontSize(1) }
                    ]}>{selectedBook.title}</AppHeading1>
                  
                  </View>

                  {/* Modal Content */}
                  <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                    <BlurView intensity={20} tint="light" style={styles.modalCard}>
                      {/* Cover and Basic Info */}
                      <View style={styles.modalBookInfo}>
                        <View style={styles.modalCover}>
                          {selectedBook.cover_image_url ? (
                            <View style={{ position: 'relative', flex: 1 }}>
                              <Image
                                source={{ uri: selectedBook.cover_image_url }}
                                style={styles.modalCoverImage}
                                resizeMode="contain"
                                onLoadStart={() => handleImageLoadStart(selectedBook.id)}
                                onLoadEnd={() => handleImageLoadEnd(selectedBook.id)}
                                onError={() => handleImageLoadEnd(selectedBook.id)}
                              />
                              {loadingImages.has(selectedBook.id) && (
                                <View style={styles.modalCoverLoading}>
                                  <LoadingIndicator 
                                    variant="inline"
                                    size="small"
                                    message="Loading..."
                                    showMessage={false}
                                  />
                                </View>
                              )}
                            </View>
                          ) : (
                            <View style={styles.modalCoverPlaceholder}>
                              <Text style={[
                                styles.modalCoverPlaceholderText,
                                isTablet && { fontSize: responsiveFontSize(1) }
                              ]}>📖</Text>
                            </View>
                          )}
                        </View>
                        
                        <View style={styles.modalBookDetails}>
                          <AppText style={[
                            styles.modalBookMeta,
                            isTablet && { fontSize: responsiveFontSize(1) }
                          ]}>
                            For {selectedBook.child_name}, age {selectedBook.child_age}
                          </AppText>
                          <AppText style={[
                            styles.modalBookMeta,
                            isTablet && { fontSize: responsiveFontSize(1) }
                          ]}>
                            Created {formatDate(selectedBook.created_at)}
                          </AppText>
                          <AppText style={[
                            styles.modalBookMeta,
                            isTablet && { fontSize: responsiveFontSize(1) }
                          ]}>
                            {selectedBook.pageCount || 0} pages • {selectedBook.estimatedReadTime || 0} min read
                          </AppText>
                        </View>
                      </View>

                      {/* Story Details */}
                      <View style={styles.modalSection}>
                        <AppHeading1 style={[
                          styles.modalSectionTitle,
                          isTablet && { fontSize: responsiveFontSize(1) }
                        ]}>Story Details</AppHeading1>
                        {selectedBook.description && (
                          <AppText style={[
                            styles.modalSectionText,
                            isTablet && { fontSize: responsiveFontSize(1) }
                          ]}>{selectedBook.description}</AppText>
                        )}
                        
                        {selectedBook.story_outline && (
                          <View style={styles.modalDetailRow}>
                            <AppText style={[
                              styles.modalDetailLabel,
                              isTablet && { fontSize: responsiveFontSize(1) }
                            ]}>Plot:</AppText>
                            <AppText style={[
                              styles.modalDetailValue,
                              isTablet && { fontSize: responsiveFontSize(1) }
                            ]}>{selectedBook.story_outline}</AppText>
                          </View>
                        )}

                        <View style={styles.modalDetailRow}>
                          <AppText style={[
                            styles.modalDetailLabel,
                            isTablet && { fontSize: responsiveFontSize(1) }
                          ]}>Setting:</AppText>
                          <AppText style={[
                            styles.modalDetailValue,
                            isTablet && { fontSize: responsiveFontSize(1) }
                          ]}>{getSettingDisplayName(selectedBook.story_setting)}</AppText>
                        </View>

                        <View style={styles.modalDetailRow}>
                          <AppText style={[
                            styles.modalDetailLabel,
                            isTablet && { fontSize: responsiveFontSize(1) }
                          ]}>Friend:</AppText>
                          <AppText style={[
                            styles.modalDetailValue,
                            isTablet && { fontSize: responsiveFontSize(1) }
                          ]}>{getFriendDisplayName(selectedBook.monster_type)}</AppText>
                        </View>

                        <View style={styles.modalDetailRow}>
                          <AppText style={[
                            styles.modalDetailLabel,
                            isTablet && { fontSize: responsiveFontSize(1) }
                          ]}>Hero:</AppText>
                          <AppText style={[
                            styles.modalDetailValue,
                            isTablet && { fontSize: responsiveFontSize(1) }
                          ]}>{getHeroDisplayName(selectedBook.hero_type)}</AppText>
                        </View>

                        {selectedBook.story_style && getStoryStyleDisplay(selectedBook.story_style) && (
                          <View style={styles.modalDetailRow}>
                            <AppText style={[
                              styles.modalDetailLabel,
                              isTablet && { fontSize: responsiveFontSize(1) }
                            ]}>Style:</AppText>
                            <AppText style={[
                              styles.modalDetailValue,
                              isTablet && { fontSize: responsiveFontSize(1) }
                            ]}>
                              {getStoryStyleDisplay(selectedBook.story_style)}
                            </AppText>
                          </View>
                        )}

                        {selectedBook.art_style && getArtStyleDisplay(selectedBook.art_style) && (
                          <View style={styles.modalDetailRow}>
                            <AppText style={[
                              styles.modalDetailLabel,
                              isTablet && { fontSize: responsiveFontSize(1) }
                            ]}>Art Style:</AppText>
                            <AppText style={[
                              styles.modalDetailValue,
                              isTablet && { fontSize: responsiveFontSize(1) }
                            ]}>
                              {getArtStyleDisplay(selectedBook.art_style)}
                            </AppText>
                          </View>
                        )}
                      </View>

                      {/* Reading Progress */}
                      {selectedBook.readingProgress && (
                        <View style={styles.modalSection}>
                          <AppHeading1 style={[
                            styles.modalSectionTitle,
                            isTablet && { fontSize: responsiveFontSize(1) }
                          ]}>Reading Progress</AppHeading1>
                          
                          <View style={styles.progressContainer}>
                            <View style={styles.progressBar}>
                              <View
                                style={[
                                  styles.progressFill,
                                  { width: `${selectedBook.readingProgress.completion_percentage}%` }
                                ]}
                              />
                            </View>
                            <AppText style={[
                              styles.progressText,
                              isTablet && { fontSize: responsiveFontSize(1) }
                            ]}>
                              {selectedBook.readingProgress.completion_percentage}% complete
                            </AppText>
                          </View>

                          <View style={styles.modalStatsGrid}>
                            <View style={styles.modalStatItem}>
                              <Text style={[
                                styles.modalStatNumber,
                                isTablet && { fontSize: responsiveFontSize(1) }
                              ]}>
                                {selectedBook.readingProgress.current_page}
                              </Text>
                              <Text style={[
                                styles.modalStatLabel,
                                isTablet && { fontSize: responsiveFontSize(1) }
                              ]}>Current Page</Text>
                            </View>
                            <View style={styles.modalStatItem}>
                              <Text style={[
                                styles.modalStatNumber,
                                isTablet && { fontSize: responsiveFontSize(1) }
                              ]}>
                                {selectedBook.readingProgress.reading_time_minutes}m
                              </Text>
                              <Text style={[
                                styles.modalStatLabel,
                                isTablet && { fontSize: responsiveFontSize(1) }
                              ]}>Time Read</Text>
                            </View>
                            <View style={styles.modalStatItem}>
                              <Text style={[
                                styles.modalStatNumber,
                                isTablet && { fontSize: responsiveFontSize(1) }
                              ]}>
                                {selectedBook.readingProgress.reading_sessions}
                              </Text>
                              <Text style={[
                                styles.modalStatLabel,
                                isTablet && { fontSize: responsiveFontSize(1) }
                              ]}>Sessions</Text>
                            </View>
                          </View>
                        </View>
                      )}
                    </BlurView>
                  </ScrollView>

                  {/* Modal Actions */}
                  <View style={styles.modalActions}>
                    {selectedBook.status === 'completed' && (
                      <GlassButton
                        title={`${selectedBook.readingProgress?.current_page ? 'Continue Reading' : 'Start Reading'}`}
                        variant="library"
                        size="large"
                        onPress={() => handleReadBook(selectedBook.id)}
                        style={styles.modalActionButton}
                      />
                    )}
                    
                    {selectedBook.status === 'draft' && (
                      <GlassButton
                        title="Generate Book"
                        variant="primary"
                        size="large"
                        onPress={() => handleGenerateBook(selectedBook)}
                        style={styles.modalActionButton}
                      />
                    )}

                    {/* Fix Title Button - Only show for completed books with covers that haven't been fixed */}
                    {selectedBook.status === 'completed' && selectedBook.cover_image_url && !selectedBook.fixed_title && (
                      <GlassButton
                        title={fixingCoverTitle === selectedBook.id ? 'Fixing...' : 'Fix Title'}
                        variant="libraryVariant2"
                        size="large"
                        onPress={() => handleFixCoverTitle(selectedBook)}
                        style={styles.modalActionButton}
                        disabled={fixingCoverTitle === selectedBook.id}
                      />
                    )}

                    <GlassButton
                      title="Close"
                      variant="libraryVariant2"
                      size="large"
                      onPress={() => setShowBookModal(false)}
                      style={styles.modalActionButton}
                    />
                  </View>
                </CustomSafeAreaViewInner>
              </View>
            )}
          </Modal>
        
        
        {/* Swipe Back Tutorial for iOS users */}

        {/* Exit Button - Stickied at bottom */}
        <View style={styles.exitButtonContainer}>
          <TouchableOpacity 
            style={styles.exitButton}
            onPress={() => router.replace('/(app)/')}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color="white" />
            <AppText style={[
              styles.exitButtonText,
              isTablet && { fontSize: responsiveFontSize(1) }
            ]}>Exit Enchanted Library</AppText>
          </TouchableOpacity>
        </View>
        
        {/* Custom Alert */}
        {customAlert.config && (
          <CustomAlert
            visible={customAlert.visible}
            {...customAlert.config}
            onClose={() => setCustomAlert({ visible: false, config: null })}
          />
        )}
      </View>
    </GlassErrorBoundary>
  );
}

const styles = StyleSheet.create({
  // Main container styles
  container: {
    flex: 1,
    borderTopWidth: responsiveHeight(0.2),
    borderTopColor: '#3fb4d888',
    borderBottomColor: '#3fb4d888',
    borderBottomWidth: responsiveHeight(0.2),
   
  
   //
   
    backgroundColor: '#61cab5f3',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  sparklesVideoContainer: {
    position: 'absolute',
    top: responsiveHeight(-8),
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopEndRadius: 32,
    borderTopStartRadius: 32,
    left: 0,
    right: 0,
    height: 200,
    zIndex: 1,
    opacity: 1,
  },
  sparklesVideo: {
    width: '100%',
    height: '100%',
  },
  particlesContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: 'rgba(230, 19, 19, 0.8)',
    borderRadius: 4,
    shadowColor: '#ffffff',
    zIndex: 100,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  

  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
  color: '#ffffffff',
    opacity: 1,
    fontSize: responsiveFontSize(2.3),
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  authErrorTitle: {
  color: '#ffffffff',
    opacity: 1,
    fontSize: responsiveFontSize(3.0),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  authErrorText: {
   color: '#ffffffff',
    opacity: 1,
    fontSize: responsiveFontSize(2.0),
    textAlign: 'center',

    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  generatingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#047857',
  },
  generatingTitle: {
  color: '#ffffffff',
    opacity: 1,
    fontSize: responsiveFontSize(3.0),
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  generatingSubtitle: {
  color: '#ffffffff',
    opacity: 1,
    fontSize: responsiveFontSize(2.3),
    textAlign: 'center',

    marginBottom: 20,
  },
  generatingSpinner: {
    marginTop: 20,
  },

  // Success message
  successMessage: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 10,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  successMessageText: {
    color: '#10b981',
    fontSize: responsiveFontSize(2.0),
    fontWeight: '600',
    textAlign: 'center',
  },

  // Title fix message
  titleFixMessage: {
    position: 'absolute',
    top: responsiveHeight(20),
    left: 20,
    right: 20,
    zIndex: 10,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  titleFixMessageText: {
    color: '#3b82f6',
    fontSize: responsiveFontSize(2.0),
    fontWeight: '600',
    textAlign: 'center',
  },

  // Header styles
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
     borderRadius: 32,
  

  },
  headerCard: {
    borderRadius: 32,
    minHeight: responsiveHeight(15),
    paddingHorizontal: 20,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10, // For Android shadow
  },
  headerContent: {
    gap: 16,
    minHeight: responsiveHeight(15),
  },
  headerTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconText: {
    fontSize: responsiveFontSize(3.0),
  },
  headerTitle: {
    alignSelf: 'center',
    fontSize: responsiveFontSize(3.0),
    fontWeight: 'bold',
  color: '#ffffffff',
    opacity: 1,
  
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
     alignSelf: 'center',
     textAlign: 'center',
    fontSize: responsiveFontSize(2.0),
  color: '#ffffffff',
    opacity: 1,
  
   
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: responsiveFontSize(2.5),
    fontWeight: 'bold',
  color: '#ffffffff',
    opacity: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  statLabel: {
    fontSize: responsiveFontSize(1.5),
  color: '#ffffffff',
    opacity: 1,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  // Books list
  scrollContainer: {
    flex: 1,
  
  },
  scrollContent: {
    paddingTop: responsiveHeight(20), // Space for the header to allow content to scroll behind it
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Empty state
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    marginTop: -120, // Offset for the header space to center properly
  },
  emptyStateCard: {
    padding: 32,
    borderRadius: 20,
    overflow: 'hidden',
    maxWidth: 300,
  },
  emptyStateContent: {
    alignItems: 'center',
  },
  emptyStateIcon: {
    fontSize: responsiveFontSize(8.0),
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: responsiveFontSize(2.5),
    fontWeight: 'bold',
  color: '#ffffffff',
    opacity: 1,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyStateSubtitle: {
    fontSize: responsiveFontSize(2.0),
    color: '#ffffffff',
    opacity: 1,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24, // Add margin bottom to create space for button
  },
  emptyStateButtonContainer: {
    width: '100%',
    marginTop: 8,
  },
  emptyStateButton: {
    width: '100%',
  },

  // Books grid
  booksGrid: {
    gap: 16,
  },
  bookCardContainer: {
    marginBottom: 8,
  },
  bookCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },

  // Book cover
  bookCover: {
    position: 'static',
    flex: 1,
    minHeight: responsiveHeight(25),
    
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  bookCoverImage: {

    borderRadius: 48,

    height: '100%',

  },
  bookCoverPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookCoverPlaceholderText: {
    fontSize: responsiveFontSize(6.0),
  },
  bookCoverGeneratingText: {
    fontSize: responsiveFontSize(3), // Reduced from 4.5 to 4.0 (about 11% smaller)
    textAlign: 'center',
    flexWrap: 'wrap',
    minWidth: responsiveWidth(-2),
    maxWidth: responsiveWidth(15),
    fontWeight: 'bold',
    paddingHorizontal: responsiveWidth(-5),
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    lineHeight: responsiveFontSize(4.4), // Reduced proportionally
  },
  bookCoverLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 48,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
     color: '#ffffffff',
    opacity: 1,
    fontSize: responsiveFontSize(1.5),
    fontWeight: '600',
  },

  // Book info
  bookInfo: {
    padding: 16,
  },
  bookTitle: {
    fontSize: responsiveFontSize(2.3),
    fontWeight: 'bold',
      color: '#ffffffff',
    opacity: 1,
    marginBottom: 4,
  },
  bookMeta: {
    fontSize: responsiveFontSize(1.8),
     color: '#ffffffff',
    opacity: 1,
    marginBottom: 8,
  },
  bookDescription: {
    fontSize: responsiveFontSize(1.8),
  color: '#ffffffff',
    opacity: 1,
    lineHeight: 20,
    marginBottom: 12,
  },

  // Progress
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  progressText: {
    fontSize: responsiveFontSize(1.5),
    color: '#ffffffff',
    opacity: 1,
  },

  // Book actions
  bookActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    minWidth: 80,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  modalSafeArea: {
flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: responsiveFontSize(2.5),
    fontWeight: 'bold',
    color: '#fff2f2fb',
    flex: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#272424ff',
    fontSize: responsiveFontSize(2.3),
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    borderRadius: 32,
    paddingHorizontal: 20,
  },
  modalCard: {
    padding: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },

  // Modal book info
  modalBookInfo: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 16,
  },
  modalCover: {
    width: 80,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  modalCoverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  modalCoverPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCoverPlaceholderText: {
    fontSize: responsiveFontSize(4.0),
  },
  modalCoverLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  modalBookDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  modalBookMeta: {
    fontSize: responsiveFontSize(2.3),
    color: '#ffffffff',
    opacity: 1,
    marginBottom: 4,
  },

  // Modal sections
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: responsiveFontSize(2.3),
    fontWeight: 'bold',
  color: '#ffffffff',
    opacity: 1,
    marginBottom: 12,
  },
  modalSectionText: {
    fontSize: responsiveFontSize(2.0),
    color: '#ffffffff',
    opacity: 1,
    lineHeight: 22,
    marginBottom: 16,
  },
  modalDetailRow: {
    marginBottom: 8,
  },
  modalDetailLabel: {
    fontSize: responsiveFontSize(1.8),
     color: '#ffffffff',
    opacity: 1,
    marginBottom: 2,
  },
  modalDetailValue: {
    fontSize: responsiveFontSize(2.0),
     color: '#ffffffff',
    opacity: 1,
    fontWeight: '500',
  },
  modalStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  modalStatItem: {
    alignItems: 'center',
  },
  modalStatNumber: {
    fontSize: responsiveFontSize(2.3),
    fontWeight: 'bold',
      color: '#ffffffff',
    opacity: 1,
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  modalStatLabel: {
    fontSize: responsiveFontSize(1.9),
     color: '#ffffffff',
    opacity: 1,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  // Modal actions
  modalActions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  modalActionButton: {
    width: '100%',
  },

  // Generation progress styles
  generationProgressContainer: {
    width: '100%',
    marginTop: 8,
  },
  generationProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    marginBottom: 6,
    overflow: 'hidden',
  },
  generationProgressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
    minWidth: 2,
  },
  generationProgressText: {
    fontSize: responsiveFontSize(2),
    color: '#fcfffeff',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  funMessage: {
    fontSize: responsiveFontSize(1.5),
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 16,
  },

  // Exit button styles
  exitButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    zIndex: 1001,
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  exitButtonText: {
    color: 'white',
    fontSize: responsiveFontSize(2.0),
    fontWeight: '600',

    marginLeft: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.03)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
