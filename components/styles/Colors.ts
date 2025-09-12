// Mirae Glass Theme Colors
// Used throughout the app for consistent styling

export const COLORS = {
  // Primary app colors
  primary: '#4F46E5', // indigo-600
  secondary: '#06B6D4', // cyan-500
  accent: '#10B981', // emerald-500
  
  // Background colors
  background: '#0F0F23', // Very dark navy - main app background
  surface: 'rgba(255, 255, 255, 0.05)', // Glass surface
  card: 'rgba(255, 255, 255, 0.08)', // Glass card background
  
  // Text colors
  text: {
    primary: '#FFFFFF', // white
    secondary: 'rgba(255, 255, 255, 0.8)', // white with opacity
    tertiary: 'rgba(255, 255, 255, 0.6)', // white with more opacity
    muted: 'rgba(255, 255, 255, 0.4)', // muted text
  },
  
  // Glass morphism colors
  glass: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.15)',
    heavy: 'rgba(255, 255, 255, 0.2)',
    ultra: 'rgba(255, 255, 255, 0.25)',
  },
  
  // Glass borders
  glassBorder: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.2)',
    heavy: 'rgba(255, 255, 255, 0.3)',
  },
  
  // Mirae brand colors - inspired by the teal/emerald theme
  glassTeal: {
    light: 'rgba(20, 184, 166, 0.2)', // teal with opacity
    medium: 'rgba(20, 184, 166, 0.4)',
    heavy: 'rgba(20, 184, 166, 0.6)',
    solid: '#14B8A6', // teal-500
  },
  
  // Glass lavender - secondary brand color
  glassLavender: {
    light: 'rgba(139, 92, 246, 0.2)', // violet with opacity
    medium: 'rgba(139, 92, 246, 0.4)',
    heavy: 'rgba(139, 92, 246, 0.6)',
    solid: '#8B5CF6', // violet-500
  },
  
  // Interactive states
  hover: 'rgba(255, 255, 255, 0.1)',
  pressed: 'rgba(255, 255, 255, 0.05)',
  focus: 'rgba(59, 130, 246, 0.3)', // blue focus ring
  
  // Status colors
  success: '#10B981', // emerald-500
  warning: '#F59E0B', // amber-500
  error: '#EF4444', // red-500
  info: '#3B82F6', // blue-500
  
  // Input colors
  input: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.2)',
    placeholder: 'rgba(255, 255, 255, 0.5)',
    text: '#FFFFFF',
  },
  
  // Button colors
  button: {
    primary: {
      background: 'rgba(20, 184, 166, 0.8)', // teal
      text: '#FFFFFF',
      border: 'rgba(20, 184, 166, 1)',
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.1)',
      text: '#FFFFFF',
      border: 'rgba(255, 255, 255, 0.2)',
    },
    ghost: {
      background: 'transparent',
      text: 'rgba(255, 255, 255, 0.8)',
      border: 'transparent',
    },
  },
};

// Gradient definitions for glass effects
export const GLASS_GRADIENTS = {
  card: [
    'rgba(255, 255, 255, 0.15)',
    'rgba(255, 255, 255, 0.05)',
    'rgba(255, 255, 255, 0.08)',
  ] as const,
  button: [
    'rgba(20, 184, 166, 0.8)',
    'rgba(13, 148, 136, 0.9)',
    'rgba(6, 120, 103, 1)',
  ] as const,
  social: [
    'rgba(139, 92, 246, 0.6)',
    'rgba(124, 58, 237, 0.8)',
    'rgba(109, 40, 217, 1)',
  ] as const,
  background: [
    'rgba(15, 15, 35, 1)', // Very dark navy
    'rgba(30, 27, 75, 0.8)', // Dark purple-navy
    'rgba(15, 15, 35, 1)', // Back to navy
  ] as const,
};

// Shadow configurations for glass effects
export const GLASS_SHADOWS = {
  light: {
    shadowColor: 'rgba(20, 184, 166, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  medium: {
    shadowColor: 'rgba(20, 184, 166, 0.4)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  heavy: {
    shadowColor: 'rgba(20, 184, 166, 0.5)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
};
