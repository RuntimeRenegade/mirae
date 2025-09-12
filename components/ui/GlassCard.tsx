import React from 'react';
import { View, ViewStyle, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

export interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'frost' | 'elevated' | 'crystal' | 'aurora' | 'diamond' | 'ethereal' | 'liquid' | 'ultraClear' | 'whisper' | 'pure';
  blurIntensity?: 'light' | 'medium' | 'heavy' | 'ultra';
  style?: ViewStyle;
  testID?: string;
}

/**
 * GlassCard Component - Premium Glass Morphism Design
 * 
 * A breathtaking glass-morphism card component with multiple stunning variants.
 * Features heavily frosted glass effects with beautiful depth and lighting.
 * 
 * Platform Support:
 * - iOS: Uses BlurView for authentic frosted glass effect
 * - Android: Uses LinearGradient layers to simulate glass morphism (no BlurView black tint issue)
 * 
 * Variants: frost, elevated, crystal, aurora, diamond, ethereal, liquid, ultraClear, whisper, pure
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'frost',
  blurIntensity = 'heavy',
  style,
  testID,
}) => {
  const getBlurIntensity = () => {
    // For liquid glass variants, use lower blur intensities
    if (['liquid', 'ultraClear', 'whisper', 'pure'].includes(variant || '')) {
      switch (blurIntensity) {
        case 'light': return 15;
        case 'medium': return 25;
        case 'heavy': return 40;
        case 'ultra': return 60;
        default: return 25;
      }
    }
    
    // Enhanced intensities for frosted glass effect
    switch (blurIntensity) {
      case 'light': return 40;
      case 'medium': return 70;
      case 'heavy': return 100;
      case 'ultra': return 120;
      default: return 100;
    }
  };

  const getAndroidGlassColors = (variant: string): [string, string, ...string[]] => {
    // Android-specific gradient colors that simulate glass effect
    switch (variant) {
      case 'frost':
        return [
          'rgba(255, 255, 255, 0.4)',
          'rgba(255, 255, 255, 0.2)',
          'rgba(20, 184, 166, 0.15)',
          'rgba(255, 255, 255, 0.3)',
        ];
      case 'elevated':
        return [
          'rgba(255, 255, 255, 0.3)',
          'rgba(59, 130, 246, 0.1)',
          'rgba(255, 255, 255, 0.2)',
          'rgba(59, 130, 246, 0.05)',
        ];
      case 'crystal':
        return [
          'rgba(255, 255, 255, 0.35)',
          'rgba(147, 51, 234, 0.08)',
          'rgba(255, 255, 255, 0.25)',
          'rgba(147, 51, 234, 0.12)',
        ];
      case 'aurora':
        return [
          'rgba(255, 255, 255, 0.25)',
          'rgba(34, 197, 94, 0.1)',
          'rgba(255, 255, 255, 0.2)',
          'rgba(34, 197, 94, 0.08)',
        ];
      case 'diamond':
        return [
          'rgba(255, 255, 255, 0.4)',
          'rgba(168, 85, 247, 0.12)',
          'rgba(255, 255, 255, 0.3)',
          'rgba(168, 85, 247, 0.08)',
        ];
      case 'ethereal':
        return [
          'rgba(255, 255, 255, 0.3)',
          'rgba(236, 72, 153, 0.1)',
          'rgba(255, 255, 255, 0.2)',
          'rgba(236, 72, 153, 0.08)',
        ];
      case 'liquid':
        return [
          'rgba(255, 255, 255, 0.15)',
          'rgba(255, 255, 255, 0.05)',
          'rgba(255, 255, 255, 0.1)',
          'rgba(255, 255, 255, 0.08)',
        ];
      case 'ultraClear':
        return [
          'rgba(255, 255, 255, 0.2)',
          'rgba(20, 184, 166, 0.05)',
          'rgba(255, 255, 255, 0.15)',
          'rgba(20, 184, 166, 0.08)',
        ];
      case 'whisper':
        return [
          'rgba(255, 255, 255, 0.12)',
          'rgba(255, 255, 255, 0.04)',
          'rgba(255, 255, 255, 0.08)',
          'rgba(255, 255, 255, 0.06)',
        ];
      case 'pure':
        return [
          'rgba(255, 255, 255, 0.1)',
          'rgba(255, 255, 255, 0.02)',
          'rgba(255, 255, 255, 0.06)',
          'rgba(255, 255, 255, 0.04)',
        ];
      default:
        return [
          'rgba(255, 255, 255, 0.3)',
          'rgba(255, 255, 255, 0.1)',
          'rgba(255, 255, 255, 0.2)',
          'rgba(255, 255, 255, 0.15)',
        ];
    }
  };

  const getVariantConfig = () => {
    switch (variant) {
      case 'frost':
        return {
          shadowColor: 'rgba(20, 184, 166, 0.4)',
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          style: styles.frost
        };
      case 'elevated':
        return {
          shadowColor: 'rgba(59,130,246,0.3)',
          backgroundColor: 'rgba(255,255,255,0.05)',
          style: styles.elevated
        };
      case 'crystal':
        return {
          shadowColor: 'rgba(147,51,234,0.2)',
          backgroundColor: 'rgba(255,255,255,0.15)',
          style: styles.crystal
        };
      case 'aurora':
        return {
          shadowColor: 'rgba(34,197,94,0.25)',
          backgroundColor: 'rgba(255,255,255,0.10)',
          style: styles.aurora
        };
      case 'diamond':
        return {
          shadowColor: 'rgba(168,85,247,0.3)',
          backgroundColor: 'rgba(255,255,255,0.18)',
          style: styles.diamond
        };
      case 'ethereal':
        return {
          shadowColor: 'rgba(236,72,153,0.2)',
          backgroundColor: 'rgba(255,255,255,0.14)',
          style: styles.ethereal
        };
      // NEW LIQUID GLASS VARIANTS
      case 'liquid':
        return {
          shadowColor: 'rgba(211, 7, 7, 0)',
          backgroundColor: 'transparent',
          style: styles.liquid
        };
      case 'ultraClear':
        return {
          shadowColor: 'rgba(57, 206, 89, 0.81)',
          backgroundColor: 'rgba(240, 225, 225, 0)',
          style: styles.ultraClear
        };
      case 'whisper':
        return {
          shadowColor: 'rgba(255,255,255,0.6)',
          backgroundColor: 'rgba(255,255,255,0.02)',
          style: styles.whisper
        };
      case 'pure':
        return {
          shadowColor: 'rgba(255,255,255,0.9)',
          backgroundColor: 'transparent',
          style: styles.pure
        };
      default:
        return {
          shadowColor: 'rgba(255,255,255,0.5)',
          backgroundColor: 'rgba(255,255,255,0.08)',
          style: styles.frost
        };
    }
  };

  const variantConfig = getVariantConfig();
  
  // Determine border radius based on variant
  const isLiquidVariant = ['liquid', 'ultraClear', 'whisper', 'pure'].includes(variant || '');
  const borderRadius = isLiquidVariant ? 24 : 42;

  // Platform-specific glass effect implementation
  if (Platform.OS === 'android') {
    // Android: Use LinearGradient-based glass effect (no BlurView)
    return (
      <View
        style={[
          styles.androidContainer,
          { 
            borderRadius: borderRadius,
          },
          style
        ]}
        testID={testID}
      >
        <LinearGradient
          colors={getAndroidGlassColors(variant)}
          style={[
            styles.androidGlass,
            { borderRadius: borderRadius },
          ]}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
        />
        {/* Additional glass effect layer for more depth */}
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0.4)',
            'rgba(255, 255, 255, 0.1)',
            'rgba(255, 255, 255, 0.3)',
          ]}
          style={[
            styles.androidGlass,
            { borderRadius: borderRadius, opacity: 0.6 },
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        <View
          style={[
            styles.androidBorder,
            { borderRadius: borderRadius },
            variantConfig.style,
          ]}
        />
        <View style={[
          styles.container, 
          isLiquidVariant ? styles.liquidContainer : {},
          { backgroundColor: 'transparent' }
        ]}>
          <View style={styles.content}>
            {children}
          </View>
        </View>
      </View>
    );
  }

  // iOS: Use BlurView (original implementation)
  return (
    <BlurView
      tint="light"
      intensity={getBlurIntensity()}
      style={[
        styles.blurContainer, 
        { 
          backgroundColor: variantConfig.backgroundColor,
          borderRadius: borderRadius,
        }
      ]}
    >
      <LinearGradient
        colors={[
          '#ffffffb2',
          '#ffffff83',
          '#ffffff8e',
          'rgba(255, 255, 255, 0.94)',
        ]}
        style={styles.linearContainer}
        start={{ x: 0.05, y: 5 }} 
        end={{ x: 0.95, y: 0.15 }}
      />
      <View style={[
        styles.container, 
        isLiquidVariant ? styles.liquidContainer : {},
        variantConfig.style, 
        style
      ]} testID={testID}>
        <View style={styles.content}>
          {children}
        </View>
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 42,
    overflow: 'hidden',
  },
  liquidContainer: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  blurContainer: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(20, 184, 166, 0.08)',
  },
  // Android-specific styles
  androidContainer: {
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  androidGlass: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  androidBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
  },
  // Variant Styles - Frost (Enhanced web-like frosted glass)
  frost: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: 'rgba(20, 184, 166, 0.3)',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  // Elevated - Premium floating effect with blue undertones
  elevated: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 16,
    },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 20,
    transform: [{ translateY: -4 }],
  },
  // Crystal - Ultra-clear with maximum transparency
  crystal: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#9333EA',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 16,
  },
  // Aurora - Multi-colored subtle glow effect
  aurora: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: '#22C55E',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 14,
  },
  // Diamond - Maximum luxury with strongest effects
  diamond: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#A855F7',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.35,
    shadowRadius: 40,
    elevation: 24,
    transform: [{ translateY: -6 }],
  },
  // Ethereal - Dreamy, soft appearance
  ethereal: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    shadowColor: '#EC4899',
    shadowOffset: {
      width: 0,
      height: 14,
    },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 18,
  },
  
  // LIQUID GLASS VARIANTS - Ultra Transparent without BlurView
  
  // Liquid - Perfect liquid glass effect (most transparent)
  liquid: {
     backgroundColor: 'rgba(255, 255, 255, 0.02)',

    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  linearContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  // Ultra Clear - Enhanced with teal tint to match web
  ultraClear: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  
    shadowColor: 'rgba(20, 184, 166, 0.2)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  
  // Whisper - Barely there glass with gentle highlight
  whisper: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  
  // Pure - Cleanest liquid glass effect
  pure: {
    backgroundColor: 'transparent',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: 'rgba(0, 0, 0, 0.06)',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
});
