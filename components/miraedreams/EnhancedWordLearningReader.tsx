/**
 * Enhanced WordLearningReader using the new react-native-drop-cap library
 * This demonstrates how to integrate the library with your existing interactive text component
 */

/* eslint-disable */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { DropCapWordReader } from 'rn-interactive-dropcap';
import { useAuth } from '../../providers/AuthProvider';
import { responsiveFontSize, responsiveHeight, responsiveWidth } from 'react-native-responsive-dimensions';
import { useIsTablet, useIsLandscapeMode } from '@/providers/DeviceProvider';


interface EnhancedWordLearningReaderProps {
  content: string;
  onWordClick?: (word: string) => void;
  audioEnabled?: boolean;
  useDropCap?: boolean; // Re-add drop cap prop
  textStyle?: {
    color?: string;
  };
  dropCapSize?: number;
  linesSpanned?: number;
  maxDropCapLines?: number;
}

interface ClickedWord {
  word: string;
  timestamp: number;
}

export default function EnhancedWordLearningReader({ 
  content, 
  onWordClick,
  audioEnabled = true,
  useDropCap = true, // Default to using drop cap
  textStyle = { color: '#000000' }, // Default to black text
  dropCapSize = responsiveHeight(12), // Default drop cap size
  linesSpanned = 1, // Default lines spanned
  maxDropCapLines = 5 // Default max drop cap lines
}: EnhancedWordLearningReaderProps) {
  const [loadingWord, setLoadingWord] = useState<string | null>(null);
  const [clickedWords, setClickedWords] = useState<ClickedWord[]>([]);
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  const isTablet = useIsTablet();
  // Rainbow animation for drop cap
  const rainbowAnimation = useRef(new Animated.Value(0)).current;
  const [dropCapColor, setDropCapColor] = useState('#ff0000'); // Start with red
  const isLandscape = useIsLandscapeMode();
  const { session } = useAuth();

  // Rainbow colors array for smooth transitions
  const rainbowColors = [
    // 6 shades of lavender
    '#E6E6FA', // Light lavender
    '#DDA0DD', // Plum
    '#DA70D6', // Orchid
    '#BA55D3', // Medium orchid
    '#9370DB', // Medium slate blue
    '#8A2BE2', // Blue violet
    
    // 6 shades transitioning to teal
    '#6A5ACD', // Slate blue
    '#4682B4', // Steel blue
    '#20B2AA', // Light sea green
    '#48D1CC', // Medium turquoise
    '#40E0D0', // Turquoise
    '#00CED1', // Dark turquoise
    
    // 6 shades of pink
    '#FFB6C1', // Light pink
    '#FFA0B4', // Light pink (darker)
    '#FF69B4', // Hot pink
    '#FF1493', // Deep pink
    '#DC143C', // Crimson
    '#C71585', // Medium violet red
  ];

  // Initialize rainbow animation
  useEffect(() => {
    const startRainbowAnimation = () => {
      rainbowAnimation.setValue(0);
      
      Animated.loop(
        Animated.timing(rainbowAnimation, {
          toValue: rainbowColors.length - 1,
          duration: 24555, // 6 seconds for full rainbow cycle
          useNativeDriver: false, // Color interpolation requires non-native driver
        })
      ).start();
    };

    startRainbowAnimation();
  }, [rainbowAnimation, rainbowColors.length]);

  // Update drop cap color based on animation value
  useEffect(() => {
    const listener = rainbowAnimation.addListener(({ value }) => {
      const index = Math.floor(value);
      const nextIndex = (index + 1) % rainbowColors.length;
      const progress = value - index;
      
      // Interpolate between current and next color
      const currentColor = rainbowColors[index];
      const nextColor = rainbowColors[nextIndex];
      
      // Simple RGB interpolation
      const interpolatedColor = interpolateColor(currentColor, nextColor, progress);
      setDropCapColor(interpolatedColor);
    });

    return () => {
      rainbowAnimation.removeListener(listener);
    };
  }, [rainbowAnimation, rainbowColors]);

  // Color interpolation helper function
  const interpolateColor = (color1: string, color2: string, factor: number): string => {
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);
    
    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);
    
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Enhanced fallback explanation generator with comprehensive grammatical analysis
  const createFallbackExplanation = useCallback((word: string, context: string = ''): string => {
    // Enhanced heuristics for word categorization
    const isProperName = word.charAt(0) === word.charAt(0).toUpperCase() && word.length > 1;
    const isCompound = word.includes('-');
    const hasIngSuffix = word.toLowerCase().endsWith('ing');
    const hasEdSuffix = word.toLowerCase().endsWith('ed');
    const hasLySuffix = word.toLowerCase().endsWith('ly');
    const hasErSuffix = word.toLowerCase().endsWith('er') || word.toLowerCase().endsWith('est');
    
    // Handle proper names (characters, places)
    if (isProperName) {
      return `${word} ... this word is pronounced as ${word} ..... ${word} is a PROPER NOUN - a special naming word for a person or place. Proper nouns are always capitalized because they name specific people, places, or things. You're learning grammar like a champion!`;
    }

    // Handle adverbs (how something is done)
    if (hasLySuffix) {
      return `${word} ... this word is pronounced as ${word} ..... ${word} is an ADVERB - a word that tells us how something is done. Adverbs describe the way actions happen. For example: 'They walked ${word}.' You're doing amazing with vocabulary!`;
    }

    // Handle comparative/superlative adjectives
    if (hasErSuffix) {
      return `${word} ... this word is pronounced as ${word} ..... ${word} is an ADJECTIVE - a describing word that compares things and tells us more about them. For example: 'This is ${word} than that.' Keep up the excellent reading work!`;
    }

    // Handle compound words and phrases
    if (isCompound) {
      const parts = word.split('-');
      return `${word} ... this word is pronounced as ${word} ..... ${word} combines the words ${parts.join(' and ')} together to make a new meaning. Great job learning about ${word}!`;
    }

    // Handle present tense action words
    if (hasIngSuffix) {
      return `${word} ... this word is pronounced as ${word} ..... ${word} is a VERB - an action word that tells us what someone is doing right now. When someone is ${word.replace(/ing$/, '')}ing, they are actively doing that action. For example: 'The child is ${word}.' You're becoming such a smart reader!`;
    }

    // Handle past tense action words
    if (hasEdSuffix) {
      return `${word} ... this word is pronounced as ${word} ..... ${word} is a VERB - an action word that tells us what someone did in the past. This means the action already happened. For example: 'Yesterday, they ${word}.' Fantastic job learning new words!`;
    }

    // Handle basic words with context
    if (context) {
      return `${word} ... this word is pronounced as ${word}. In our story, we read "${context.trim()}". The word ${word} is important here. Learning words like ${word} helps you become a better reader!`;
    }

    // Basic fallback for regular words with more educational content
    return `${word} ... this word is pronounced as ${word}. ${word} is the word ${word}. Every word you learn, like ${word}, helps you understand stories better. Great job learning new words!`;
  }, []);

  // Create contextual educational explanation using AI (adapted for React Native)
  const createContextualEducationalText = useCallback(async (word: string): Promise<string> => {
    try {
      console.log('🔤 Requesting AI explanation for word:', word);
      
      // IDENTICAL API CALL TO WEB VERSION
      const apiUrl = `https://www.notgpt.net/api/text-to-speech/generate-word-explanation`;
      
      console.log('🌐 Making request to:', apiUrl);
      
      // Prepare headers with authentication
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
      
      // Generate GENERIC explanation using AI (no story context for better caching)
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          word: word
        }),
      });

      console.log('📡 API response status:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ API response received:', result);
        
        if (result.explanation && result.explanation.length > 10) {
          if (result.cached) {
            console.log('✅ Using cached AI explanation for:', word);
          } else {
            console.log('✅ Using fresh AI explanation for:', word);
          }
          return result.explanation;
        } else {
          console.warn('⚠️ API returned empty/invalid explanation:', result);
          return createFallbackExplanation(word, '');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ API request failed:', response.status, response.statusText, errorText);
        
        if (response.status === 429) {
          console.log('⏱️ Rate limited, using fallback explanation');
        } else {
          console.log('🔄 API error, using fallback explanation');
        }
        return createFallbackExplanation(word, '');
      }
    } catch (error) {
      console.error('❌ Failed to generate AI explanation:', error);
      console.log('🔄 Network/parse error, using fallback explanation');
      return createFallbackExplanation(word, '');
    }
  }, [createFallbackExplanation, session]);

  // Create educational text using AI or fallback
  const createEducationalText = useCallback(async (word: string): Promise<string> => {
    // Use the contextual approach for better explanations
    return await createContextualEducationalText(word);
  }, [createContextualEducationalText]);

  // Generate pronunciation audio using React Native and your TTS API
  const generateWordPronunciation = useCallback(async (word: string, educationalText: string): Promise<void> => {
    try {
      // Stop current audio
      if (currentSound) {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
        setCurrentSound(null);
      }

      console.log('🎵 Requesting audio for:', word);
      console.log('📚 Educational text:', educationalText);

      // Prepare headers with authentication
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      // Make API request to your TTS endpoint
      const response = await fetch('https://www.notgpt.net/api/text-to-speech/deepgram', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text: educationalText,
          model: 'aura-2-thalia-en', // Child-friendly voice
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      console.log('🎵 Audio blob received for:', word, audioBlob ? `${audioBlob.size} bytes` : 'null');

      if (audioBlob) {
        // Convert blob to URI for React Native Audio
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
          reader.onload = async () => {
            try {
              const audioUri = reader.result as string;
              
              // Create and load audio with Expo AV
              const { sound } = await Audio.Sound.createAsync(
                { uri: audioUri },
                { shouldPlay: true, volume: 1.0 }
              );
              
              setCurrentSound(sound);
              
              // Set up completion handler
              sound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish) {
                  console.log('🎵 Audio playback ended for:', word);
                  sound.unloadAsync();
                  setCurrentSound(null);
                }
              });

              console.log('🔊 TTS audio playing successfully for:', word);
              resolve();
            } catch (playError) {
              console.error('🔊 Audio playback error:', playError);
              reject(playError);
            }
          };
          
          reader.onerror = () => {
            console.error('🔊 FileReader error for audio blob');
            reject(new Error('FileReader failed'));
          };
          
          reader.readAsDataURL(audioBlob);
        });
      }

      return;
    } catch (error) {
      console.error('Error generating pronunciation:', error);
      return;
    }
  }, [currentSound]);

  // Handle word click with enhanced functionality and concurrency prevention
  const handleWordClick = useCallback(async (word: string, cleanWord?: string) => {
    // If cleanWord is provided by DropCapWordReader, use it; otherwise clean the word ourselves
    const finalCleanWord = cleanWord || word.replace(/^[^\w]+|[^\w]+$/g, '').toLowerCase();
    
    // Skip empty, too short, or invalid words
    if (!finalCleanWord || finalCleanWord.length < 2 || /^[^a-zA-Z]*$/.test(finalCleanWord)) {
      console.log('🚫 Skipping invalid word:', word, '→', finalCleanWord);
      return;
    }

    // Skip if audio is disabled globally (but allow TTS for education)
    if (!audioEnabled) {
      console.log('🔊 Audio disabled, but allowing educational TTS for:', finalCleanWord);
      // Continue anyway - educational audio should work even when music is disabled
    }

    // 🚫 CONCURRENCY PREVENTION: Only allow one word explanation at a time
    if (loadingWord !== null) {
      console.log('🔄 Word explanation already in progress, ignoring click:', finalCleanWord);
      return;
    }

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Visual feedback
    setClickedWords(prev => [...prev, { word: finalCleanWord, timestamp: Date.now() }]);
    setLoadingWord(finalCleanWord);
    onWordClick?.(finalCleanWord);

    try {
      const educationalText = await createEducationalText(finalCleanWord);
      await generateWordPronunciation(finalCleanWord, educationalText);
      console.log('🔊 TTS audio playing successfully for:', finalCleanWord);
    } catch (error) {
      console.error('Error processing word:', finalCleanWord, error);
    } finally {
      console.log('🏁 Finished processing word:', finalCleanWord);
      setLoadingWord(null);
    }
  }, [onWordClick, createEducationalText, generateWordPronunciation, loadingWord, audioEnabled]);

  // Render clickable text like WordLearningReader (fallback mode)
  const renderClickableText = useCallback(() => {
    if (!content) return null;

    // Normalize whitespace to prevent excessive spacing
    const normalizedContent = content.replace(/\s+/g, ' ').trim();

    // Enhanced regex to split on whitespace AND em dashes/hyphens while preserving them
    const words = normalizedContent.split(/(\s+|—|–|-{2,}|—)/);
    
    const elements = words.map((segment, index) => {
      // Return whitespace as single space
      if (/^\s+$/.test(segment)) {
        return (
          <Text key={index} style={styles.whitespace}>
            {' '}
          </Text>
        );
      }
      
      // Return em dashes, en dashes, and double hyphens as non-clickable punctuation
      if (/^(—|–|-{2,})$/.test(segment)) {
        return (
          <Text key={index} style={styles.punctuation}>
            {segment}
          </Text>
        );
      }
      
      // Make words clickable (only segments with actual letters)
      if (/[a-zA-Z]/.test(segment)) {
        const cleanWord = segment.replace(/^[^\w]+|[^\w]+$/g, '').toLowerCase();
        
        // Skip if the cleaned word is too short or empty
        if (!cleanWord || cleanWord.length < 2) {
          return (
            <Text key={index} style={styles.regularText}>
              {segment}
            </Text>
          );
        }
        
        const isLoading = loadingWord === cleanWord;
        const wasClicked = clickedWords.some(cw => cw.word === cleanWord && Date.now() - cw.timestamp < 2000);
        
        return (
          <TouchableOpacity
            key={index}
            onPress={() => handleWordClick(segment)}
            style={styles.wordTouchable}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.clickableWord,
                wasClicked && styles.clickedWord,
                isLoading && styles.loadingWord
              ]}
            >
              {segment}
              {isLoading && (
                <ActivityIndicator 
                  size="small" 
                  color="#d97706" 
                  style={styles.loadingIndicator}
                />
              )}
            </Text>
          </TouchableOpacity>
        );
      }
      
      // Return punctuation as-is
      return (
        <Text key={index} style={styles.regularText}>
          {segment}
        </Text>
      );
    });
    
    return elements;
  }, [content, handleWordClick, loadingWord, clickedWords]);

  if (useDropCap) {
    // Use the new DropCapWordReader with built-in word clicking
    return (
      <View style={styles.container}>
        <DropCapWordReader
          onWordClick={handleWordClick}
          loadingWord={loadingWord}
          dropCapSize={dropCapSize}
          linesSpanned={linesSpanned}
          maxDropCapLines={maxDropCapLines}
          textFontSize={!isTablet && isLandscape? responsiveFontSize(1.2) : undefined }
          clickableWordStyle={{ 
            color: textStyle?.color || '#0a0303ff',
            textShadowColor: 'rgba(255, 255, 255, 0.1)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 2,
          }}
          clickedWordStyle={{ 
            backgroundColor: 'rgba(217, 119, 6, 0.3)',
            borderRadius: 4,
            paddingHorizontal: 2,
            paddingVertical: 1,
          }}
          loadingWordStyle={{ 
            backgroundColor: 'rgba(251, 190, 36, 0)',
            borderRadius: 4,
            paddingHorizontal: 2,
            paddingVertical: 1,
          }}
          loadingAnimationConfig={{
            type: 'gradient',
      
            duration: 555,
            intensity: 0.8,
            colors: ['#000000ff', '#40f1e3ff', '#fa4ea4ff', '#b049ecff', '#44e9c0ff', '#bdee36ff', '#7eeff3ff', '#9eecffff', '#f1e979ff']
          }}
          dropCapStyle={{
            // Use animated rainbow color
                  fontFamily: 'Metamorphous-Regular',
                  textShadowColor: 'rgba(243, 237, 231, 0)',
                  textShadowOffset: { width: 2, height: 2 },
                  textShadowRadius: 4,
                  }}
                  textStyle={{
                  fontSize: isTablet ? responsiveFontSize(1) : responsiveHeight(2.2),
                  fontFamily: 'Metamorphous-Regular',
                  color: textStyle?.color || '#000000',
                  lineHeight: isTablet ? responsiveHeight(3.5) : responsiveHeight(3),
                  textShadowColor: 'rgba(255, 255, 255, 0.1)',
                  textShadowOffset: { width: 1, height: 1 },
                  textShadowRadius: 2,
                  }}
                 
                 containerStyle={StyleSheet.flatten([
              styles.dropCapContainer, 
              { minWidth: isTablet ? responsiveWidth(37) : undefined }
            ])}
                >
          {content}
        </DropCapWordReader>
      </View>
    );
  }

  // Simple implementation without drop cap - just render clickable text
  return (
    <View style={styles.container}>
     
        {renderClickableText()}
  
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
   
    position: 'relative',
  },
  textContainer: {

    lineHeight: 0, // Match text line height
  },
  whitespace: {
    fontSize: 18,
    lineHeight: 28,
  },
  punctuation: {
    fontSize: 18,
    lineHeight: 28,
    color: '#374151',
    paddingHorizontal: 2,
  },
  regularText: {
    top: 40,
    fontSize: 18,
    lineHeight: 28,
    color: '#374151',
  },
  clickableWord: {
    fontSize: 18,
    lineHeight: 28,
    color: '#374151',
  },
  wordTouchable: {
    top: 40,
    left: 30,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderRadius: 3,
  },
  loadingIndicator: {
    marginLeft: 4,
  },
  clickedWord: {
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
  },
  loadingWord: {
    backgroundColor: 'rgba(251, 191, 36, 0.3)',
  },
  
  // Drop cap specific styles
  dropCapContainer: { 
    minWidth: responsiveWidth(89),
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: responsiveWidth(1),
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  dropCapStyle: {
    color: '#000000ff',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
    fontWeight: 'bold',
  },
  textStyle: {
    fontSize: 18,
    top: responsiveHeight(1),
    lineHeight: 28,
    color: '#000000ff',
    fontFamily: Platform.OS === 'ios' ? 'Times New Roman' : 'serif',
  },
  
  // Interactive overlay styles
  interactiveOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  interactiveTextContainer: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
  },
  
  // Drop cap interactive elements
  firstWordContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginRight: 4,
  },
  dropCapTouchable: {
    position: 'absolute',
    top: -8,
    left: -4,
    width: 90,
    height: 90,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  restOfFirstWordTouchable: {
    marginLeft: 70,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
    minHeight: 22,
    justifyContent: 'center',
  },
  regularWordTouchable: {
    paddingVertical: 2,
    paddingHorizontal: 2,
    borderRadius: 4,
    marginRight: 2,
    minHeight: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Visual feedback for overlays
  clickedWordOverlay: {
    backgroundColor: 'rgba(217, 119, 6, 0.3)',
  },
  loadingWordOverlay: {
    backgroundColor: 'rgba(251, 191, 36, 0.4)',
  },
  
  // Loading indicators for overlay
  dropCapLoadingIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 2,
  },
  regularWordLoadingIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 1,
  },
  
  // Global loading overlay
  loadingOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 20,
  },
  
  // Invisible text for positioning
  invisibleText: {
    opacity: 0,
    fontSize: 18,
    lineHeight: 28,
  },
});
