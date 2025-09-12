import React from 'react';
import { TouchableOpacity, View, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { AppText } from '../AppText';

export interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'adventure' | 'library' | 'libraryVariant2';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
  children?: React.ReactNode;
}

/**
 * GlassButton Component
 * 
 * A reusable button component with glass morphism effects, smooth touch feedback,
 * and loading states. Supports multiple variants and sizes optimized for touch interfaces.
 * 
 * Features:
 * - Three variants: primary, secondary, accent
 * - Three sizes: small, medium, large with proper touch targets
 * - Smooth press animations and visual feedback
 * - Loading state with activity indicator
 * - Accessibility support and proper touch targets (44pt minimum)
 * - TypeScript type safety
 */
export const GlassButton: React.FC<GlassButtonProps & { 
  loading?: boolean; 
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  children,
  iconLeft,
  iconRight,
  ...props
}) => {
  // Get variant-specific styles
  const getVariantStyles = (): ViewStyle => {
    const variants = {
      primary: styles.primaryVariant,
      secondary: styles.secondaryVariant,
      accent: styles.accentVariant,
      adventure: styles.adventureVariant,
      library: styles.libraryVariant,
      libraryVariant2: styles.libraryVariant2
    };
    return variants[variant];
  };

  // Get size-specific styles
  const getSizeStyles = (): ViewStyle => {
    const sizes = {
      small: styles.smallSize,
      medium: styles.mediumSize,
      large: styles.largeSize
    };
    return sizes[size];
  };

  // Get text color based on variant
  const getTextColor = (): TextStyle => {
    const colors = {
      primary: styles.primaryText,
      secondary: styles.secondaryText,
      accent: styles.accentText,
      adventure: styles.adventureText,
      library: styles.libraryText,
      libraryVariant2: styles.libraryVariant2Text
    };
    return colors[variant];
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      onPress();
    }
  };

  const buttonStyle = [
    styles.base,
    getVariantStyles(),
    getSizeStyles(),
    disabled || loading ? styles.disabled : null,
    style
  ];

  const textStyle = [
    styles.text,
    getTextColor()
  ];

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      style={buttonStyle}
      activeOpacity={0.8}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={disabled ? 'Button is disabled' : undefined}
      {...props}
    >
      {/* Left icon */}
      {iconLeft && !loading && (
        <View style={styles.iconLeft}>
          {iconLeft}
        </View>
      )}
      
      {/* Loading indicator */}
      {loading && (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? '#7c3aed' : variant === 'accent' ? '#0d9488' : '#4b5563'} 
          style={styles.iconLeft}
        />
      )}
      
      {/* Button text or children */}
      {children ? (
        children
      ) : (
        <AppText style={textStyle}>
          {title}
        </AppText>
      )}
      
      {/* Right icon */}
      {iconRight && !loading && (
        <View style={styles.iconRight}>
          {iconRight}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  // Variant styles
  primaryVariant: {
    backgroundColor: 'rgba(124, 58, 237, 0.66)',
    borderColor: 'rgba(6, 7, 7, 0.94)',
  },
  libraryVariant: {
    backgroundColor: 'rgba(171, 150, 206, 0.3)',
    borderColor: 'rgba(6, 7, 7, 0.94)',
  },
  libraryVariant2: {
    backgroundColor: 'rgba(221, 54, 76, 0.27)',
    borderColor: 'rgba(6, 7, 7, 0.94)',
  },
  secondaryVariant: {
    backgroundColor: 'rgba(39, 199, 106, 0.65)',
   borderColor: 'rgba(19, 20, 20, 0.94)',
  },
  adventureVariant: {
    backgroundColor: 'rgba(185, 48, 78, 0.65)',
   borderColor: 'rgba(0, 0, 0, 0.94)',
  },
  accentVariant: {
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    borderColor: 'rgba(13, 148, 136, 0.3)',
  },
  // Size styles
  smallSize: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  mediumSize: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 44,

  },

  largeSize: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    minHeight: 52,
  },
  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: '#faf8ffff',
    fontSize: 16,
  },
  libraryText: {
    color: '#e9d5ffff',
    fontSize: 16,
  },
  libraryVariant2Text: {
    color: '#ffffff',
    fontSize: 16,
  },
  secondaryText: {
    color: '#ffffffff',
    fontSize: 16,
  },
  accentText: {
    color: '#0f766e',
    fontSize: 16,
  },
  adventureText: {
    color: '#ffffff',
    fontSize: 16,
  },
  // Icon styles
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  // State styles
  disabled: {
    opacity: 0.5,
  },
});

/**
 * GlassButton Variants
 * 
 * Pre-configured button components for common use cases
 */

// Primary glass button with lavender accent
export const GlassButtonPrimary: React.FC<Omit<GlassButtonProps, 'variant'> & { 
  loading?: boolean; 
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}> = (props) => (
  <GlassButton variant="primary" {...props} />
);

// Secondary glass button with neutral styling
export const GlassButtonSecondary: React.FC<Omit<GlassButtonProps, 'variant'> & { 
  loading?: boolean; 
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}> = (props) => (
  <GlassButton variant="secondary" {...props} />
);

// Secondary glass button with neutral styling
export const GlassButtonAdventure: React.FC<Omit<GlassButtonProps, 'variant'> & { 
  loading?: boolean; 
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}> = (props) => (
  <GlassButton variant="adventure" {...props} />
);

// Accent glass button with mint/teal styling
export const GlassButtonAccent: React.FC<Omit<GlassButtonProps, 'variant'> & { 
  loading?: boolean; 
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}> = (props) => (
  <GlassButton variant="accent" {...props} />
);

export const GlassButtonLibrary: React.FC<Omit<GlassButtonProps, 'variant'> & { 
  loading?: boolean; 
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}> = (props) => (
  <GlassButton variant="library" {...props} />
);

export const GlassButtonLibrary2: React.FC<Omit<GlassButtonProps, 'variant'> & { 
  loading?: boolean; 
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}> = (props) => (
  <GlassButton variant="libraryVariant2" {...props} />
);

export default GlassButton;
