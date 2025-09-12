import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { GlassThemeProvider } from '../../providers/GlassThemeProvider';


/**
 * App-specific Layout Component
 * 
 * This layout is specifically designed for the new glass UI entry point
 * and includes the glass theme provider with optimized settings.
 * 
 * Features:
 * - Glass theme provider with device-specific optimizations
 * - Error boundary for graceful degradation
 * - Status bar configuration for glass effects
 * - Stack navigation with fade animations
 */
export default function AppLayout() {
  return (
    <GlassThemeProvider
      optimizationConfig={{
        enableBlur: true,
        enableAnimations: true,
        enableShadows: true,
        performanceMode: 'auto'
      }}
    >
   
        <StatusBar
          barStyle="light-content"
          backgroundColor="rgba(31, 38, 135, 0.2)"
          translucent={true}
        />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            animationDuration: 300,
            gestureEnabled: true,
            contentStyle: {
              backgroundColor: 'transparent'
            }
          }}
        />
     
    </GlassThemeProvider>
  );
}
