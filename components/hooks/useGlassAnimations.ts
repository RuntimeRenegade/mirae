import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * Glass Animation Hooks and Utilities
 * 
 * Provides smooth animations optimized for glass morphism effects including
 * entrance animations, glass effect transitions, and performance-optimized
 * animation configurations.
 */

// Animation configuration constants
export const GLASS_ANIMATIONS = {
  // Entrance animations
  fadeIn: {
    duration: 600,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true
  },
  slideUp: {
    duration: 500,
    easing: Easing.out(Easing.back(1.2)),
    useNativeDriver: true
  },
  scaleIn: {
    duration: 400,
    easing: Easing.out(Easing.circle),
    useNativeDriver: true
  },
  
  // Glass effect transitions
  glassBlur: {
    duration: 300,
    easing: Easing.inOut(Easing.ease),
    useNativeDriver: false // backdrop-filter requires layout animations
  },
  glassShimmer: {
    duration: 2000,
    easing: Easing.inOut(Easing.sin),
    useNativeDriver: true
  },
  
  // Interactive animations
  pressScale: {
    duration: 150,
    easing: Easing.out(Easing.quad),
    useNativeDriver: true
  },
  springBack: {
    duration: 200,
    easing: Easing.elastic(1.2),
    useNativeDriver: true
  }
} as const;

/**
 * Hook for fade-in entrance animation
 * Used for cards and elements appearing on screen
 */
export const useFadeInAnimation = (delay: number = 0) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        ...GLASS_ANIMATIONS.fadeIn,
        delay: delay
      }).start();
    }, 100); // Small delay to ensure smooth mounting

    return () => clearTimeout(timer);
  }, [fadeAnim, delay]);

  return fadeAnim;
};

/**
 * Hook for slide-up entrance animation
 * Perfect for navigation cards and content sections
 */
export const useSlideUpAnimation = (delay: number = 0) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          ...GLASS_ANIMATIONS.slideUp,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          ...GLASS_ANIMATIONS.fadeIn,
        })
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [slideAnim, opacityAnim, delay]);

  return { 
    transform: [{ translateY: slideAnim }], 
    opacity: opacityAnim 
  };
};

/**
 * Hook for scale-in entrance animation
 * Great for buttons and interactive elements
 */
export const useScaleInAnimation = (delay: number = 0) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          ...GLASS_ANIMATIONS.scaleIn,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [scaleAnim, opacityAnim, delay]);

  return { 
    transform: [{ scale: scaleAnim }], 
    opacity: opacityAnim 
  };
};

/**
 * Hook for glass shimmer effect animation
 * Adds a subtle shimmer overlay for premium feel
 */
export const useGlassShimmerAnimation = () => {
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          ...GLASS_ANIMATIONS.glassShimmer,
        }),
        Animated.delay(1000), // Pause between animations
      ]).start(() => animate()); // Loop the animation
    };

    animate();
  }, [shimmerAnim]);

  return shimmerAnim;
};

/**
 * Hook for press animation with scale feedback
 * Provides tactile feedback for touchable elements
 */
export const usePressAnimation = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      ...GLASS_ANIMATIONS.pressScale,
    }).start();
  };

  const animateOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      ...GLASS_ANIMATIONS.springBack,
    }).start();
  };

  return {
    style: { transform: [{ scale: scaleAnim }] },
    onPressIn: animateIn,
    onPressOut: animateOut
  };
};

/**
 * Hook for staggered entrance animations
 * Perfect for grid layouts and card collections
 */
export const useStaggeredAnimation = (items: any[], baseDelay: number = 0) => {
  const animations = useRef(
    items.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const staggeredAnimations = animations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        ...GLASS_ANIMATIONS.fadeIn,
        delay: baseDelay + (index * 100), // Stagger by 100ms
      })
    );

    Animated.parallel(staggeredAnimations).start();
  }, [animations, baseDelay]);

  return animations;
};

/**
 * Glass transition utilities for page navigation
 */
export const createGlassTransition = (type: 'fade' | 'slide' | 'blur') => {
  switch (type) {
    case 'fade':
      return {
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        transitionSpec: {
          open: {
            animation: 'timing',
            config: {
              duration: 300,
              easing: Easing.out(Easing.poly(4)),
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 250,
              easing: Easing.in(Easing.poly(4)),
            },
          },
        },
        cardStyleInterpolator: ({ current }: any) => ({
          cardStyle: {
            opacity: current.progress,
          },
        }),
      };
    
    case 'slide':
      return {
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        transitionSpec: {
          open: {
            animation: 'spring',
            config: {
              stiffness: 1000,
              damping: 500,
              mass: 3,
              overshootClamping: true,
              restDisplacementThreshold: 0.01,
              restSpeedThreshold: 0.01,
            },
          },
          close: {
            animation: 'timing',
            config: {
              duration: 200,
              easing: Easing.in(Easing.quad),
            },
          },
        },
      };
    
    default:
      return {};
  }
};

// Performance optimization utilities
export const shouldReduceMotion = () => {
  // In a real implementation, you'd check accessibility settings
  // For now, return false to enable all animations
  return false;
};

export const getOptimizedAnimationConfig = (baseConfig: any) => {
  if (shouldReduceMotion()) {
    return {
      ...baseConfig,
      duration: 0,
      useNativeDriver: true
    };
  }
  return baseConfig;
};
