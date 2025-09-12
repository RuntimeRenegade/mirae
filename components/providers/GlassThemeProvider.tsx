import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import { GlassTheme, GlassThemeContextType, DeviceCapabilities, GlassOptimizationConfig } from '../types/glass-theme';

// Default glass theme configuration
const defaultGlassTheme: GlassTheme = {
  colors: {
    pearl: {
      50: '#fefefe',
      100: '#fdfdfd',
      200: '#fafafa',
      300: '#f7f7f7',
      400: '#f4f4f4',
      500: '#f0f0f0',
      600: '#ebebeb',
      700: '#e6e6e6',
      800: '#e1e1e1',
      900: '#dcdcdc',
    },
    lavender: {
      50: '#f8f6ff',
      100: '#f1ecff',
      200: '#e4d9ff',
      300: '#d1bfff',
      400: '#b899ff',
      500: '#9d6fff',
      600: '#8b5cf6',
      700: '#7c3aed',
      800: '#6d28d9',
      900: '#5b21b6',
    },
    mint: {
      50: '#f0fdf9',
      100: '#ccfbef',
      200: '#99f6e0',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',
      600: '#0f766e',
      700: '#0d5d56',
      800: '#0a4d47',
      900: '#083d38',
    },
    rose: {
      50: '#fdf2f8',
      100: '#fce7f3',
      200: '#fbcfe8',
      300: '#f9a8d4',
      400: '#f472b6',
      500: '#ec4899',
    },
    glass: {
      white: 'rgba(255, 255, 255, 0.25)',
      pearl: 'rgba(254, 254, 254, 0.20)',
      lavender: 'rgba(157, 111, 255, 0.15)',
      mint: 'rgba(20, 184, 166, 0.15)',
      border: 'rgba(255, 255, 255, 0.18)',
      shadow: 'rgba(31, 38, 135, 0.37)',
    }
  },
  blur: {
    light: '4px',
    medium: '8px',
    heavy: '16px'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  },
  borderRadius: {
    sm: '12px',
    md: '16px',
    lg: '24px'
  },
  shadows: {
    sm: '0 4px 16px 0 rgba(31, 38, 135, 0.25)',
    md: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    lg: '0 12px 48px 0 rgba(31, 38, 135, 0.45)',
    inset: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.4)'
  }
};

// Device capability detection
const detectDeviceCapabilities = (): DeviceCapabilities => {
  // In a real implementation, you'd detect actual device capabilities
  // For now, we'll use basic defaults optimized for React Native
  return {
    supportsBackdropFilter: true,
    supportsBlur: true,
    performanceLevel: 'medium',
    screenSize: 'mobile'
  };
};

// Create context
const GlassThemeContext = createContext<GlassThemeContextType | undefined>(undefined);

interface GlassThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: Partial<GlassTheme>;
  optimizationConfig?: GlassOptimizationConfig;
}

export const GlassThemeProvider: React.FC<GlassThemeProviderProps> = ({
  children,
  initialTheme,
  optimizationConfig = {
    enableBlur: true,
    enableAnimations: true,
    enableShadows: true,
    performanceMode: 'auto'
  }
}) => {
  const [theme, setTheme] = useState<GlassTheme>({
    ...defaultGlassTheme,
    ...initialTheme
  });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [deviceCapabilities] = useState<DeviceCapabilities>(detectDeviceCapabilities);

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDarkMode(colorScheme === 'dark');
    });

    // Set initial theme
    setIsDarkMode(Appearance.getColorScheme() === 'dark');

    return () => subscription?.remove();
  }, []);

  // Optimize theme based on device capabilities
  useEffect(() => {
    if (deviceCapabilities.performanceLevel === 'low') {
      // Reduce effects for low-performance devices
      updateTheme({
        blur: {
          light: '2px',
          medium: '4px', 
          heavy: '6px'
        }
      });
    }
  }, [deviceCapabilities.performanceLevel]);

  const updateTheme = (updates: Partial<GlassTheme>) => {
    setTheme(prevTheme => ({
      ...prevTheme,
      ...updates,
      colors: updates.colors ? { ...prevTheme.colors, ...updates.colors } : prevTheme.colors
    }));
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // You could implement dark mode theme adjustments here
  };

  const contextValue: GlassThemeContextType = {
    theme,
    updateTheme,
    isDarkMode,
    toggleDarkMode
  };

  return (
    <GlassThemeContext.Provider value={contextValue}>
      {children}
    </GlassThemeContext.Provider>
  );
};

// Custom hook to use glass theme
export const useGlassTheme = (): GlassThemeContextType => {
  const context = useContext(GlassThemeContext);
  if (context === undefined) {
    throw new Error('useGlassTheme must be used within a GlassThemeProvider');
  }
  return context;
};

export default GlassThemeProvider;
