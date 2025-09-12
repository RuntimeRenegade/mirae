/**
 * TypeScript type definitions for the Glass Theme System
 * Provides type safety for glass UI components and theme configuration
 */

// Color palette interfaces
export interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600?: string;
  700?: string;
  800?: string;
  900?: string;
}

export interface GlassColors {
  white: string;
  pearl: string;
  lavender: string;
  mint: string;
  border: string;
  shadow: string;
}

// Glass theme configuration
export interface GlassTheme {
  colors: {
    pearl: ColorPalette;
    lavender: ColorPalette;
    mint: ColorPalette;
    rose: ColorPalette;
    glass: GlassColors;
  };
  blur: {
    light: string;
    medium: string;
    heavy: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    inset: string;
  };
}

// Component variant types
export type GlassCardVariant = 'default' | 'elevated' | 'subtle';
export type GlassButtonVariant = 'primary' | 'secondary' | 'accent';
export type GlassInputVariant = 'default' | 'search' | 'password';
export type GlassBlurIntensity = 'light' | 'medium' | 'heavy';
export type GlassButtonSize = 'small' | 'medium' | 'large';

// Component prop interfaces
export interface GlassCardProps {
  children: React.ReactNode;
  variant?: GlassCardVariant;
  className?: string;
  blur?: GlassBlurIntensity;
  style?: object;
  testID?: string;
  accessible?: boolean;
  accessibilityRole?: string;
  [key: string]: any; // Allow other React Native View props
}

export interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: GlassButtonVariant;
  size?: GlassButtonSize;
  disabled?: boolean;
  className?: string;
  style?: object;
  children?: React.ReactNode;
}

export interface GlassInputProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  variant?: GlassInputVariant;
  icon?: React.ReactNode;
  className?: string;
  style?: object;
  disabled?: boolean;
  secureTextEntry?: boolean;
}

// Style definition interfaces
export interface GlassStyles {
  card: {
    base: string;
    variants: Record<GlassCardVariant, string>;
  };
  button: {
    base: string;
    variants: Record<GlassButtonVariant, string>;
    sizes: Record<GlassButtonSize, string>;
  };
  input: {
    base: string;
    variants: Record<GlassInputVariant, string>;
  };
}

// Animation and transition types
export interface GlassAnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

export interface GlassTransitions {
  default: GlassAnimationConfig;
  fast: GlassAnimationConfig;
  slow: GlassAnimationConfig;
}

// Theme provider context type
export interface GlassThemeContextType {
  theme: GlassTheme;
  updateTheme: (updates: Partial<GlassTheme>) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

// Utility type for glass component styling
export type GlassComponentStyle = {
  backgroundColor?: string;
  backdropFilter?: string;
  borderColor?: string;
  borderRadius?: string;
  boxShadow?: string;
  opacity?: number;
};

// Device capability detection
export interface DeviceCapabilities {
  supportsBackdropFilter: boolean;
  supportsBlur: boolean;
  performanceLevel: 'low' | 'medium' | 'high';
  screenSize: 'mobile' | 'tablet' | 'desktop';
}

// Error handling types
export interface GlassComponentError {
  component: string;
  error: Error;
  fallbackApplied: boolean;
}

export type GlassErrorHandler = (error: GlassComponentError) => void;

// Configuration for glass effects optimization
export interface GlassOptimizationConfig {
  enableBlur: boolean;
  enableAnimations: boolean;
  enableShadows: boolean;
  performanceMode: 'auto' | 'performance' | 'quality';
}