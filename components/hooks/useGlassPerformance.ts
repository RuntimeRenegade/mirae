import { useState, useEffect, useRef, useCallback } from 'react';
import { Dimensions } from 'react-native';
import { DeviceCapabilities, GlassOptimizationConfig } from '../types/glass-theme';

/**
 * Performance Monitoring and Optimization Utilities
 * 
 * Provides tools for monitoring glass effect performance and automatically
 * optimizing rendering based on device capabilities and performance metrics.
 */

interface PerformanceMetrics {
  frameRate: number;
  memoryUsage: number;
  renderTime: number;
  glassEffectSupport: boolean;
}

interface PerformanceConfig {
  targetFrameRate: number;
  maxMemoryUsage: number;
  enableAutoOptimization: boolean;
}

const defaultPerformanceConfig: PerformanceConfig = {
  targetFrameRate: 60,
  maxMemoryUsage: 100, // MB
  enableAutoOptimization: true
};

/**
 * Hook for monitoring glass component performance
 */
export const useGlassPerformanceMonitor = (
  componentName: string,
  config: Partial<PerformanceConfig> = {}
) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    frameRate: 60,
    memoryUsage: 0,
    renderTime: 0,
    glassEffectSupport: true
  });
  
  const [isOptimized, setIsOptimized] = useState(false);
  const performanceConfig = { ...defaultPerformanceConfig, ...config };
  const renderStartTime = useRef<number>(0);
  
  // Start performance measurement
  const startMeasurement = useCallback(() => {
    renderStartTime.current = performance.now();
  }, []);
  
  // End performance measurement
  const endMeasurement = useCallback(() => {
    const renderTime = performance.now() - renderStartTime.current;
    
    setMetrics(prev => ({
      ...prev,
      renderTime
    }));
    
    // Log performance data
    if (__DEV__) {
      console.log(`Glass Performance [${componentName}]:`, {
        renderTime: `${renderTime.toFixed(2)}ms`,
        frameRate: `${metrics.frameRate}fps`,
        memoryUsage: `${metrics.memoryUsage.toFixed(1)}MB`
      });
    }
  }, [componentName, metrics.frameRate, metrics.memoryUsage]);
  
  // Monitor frame rate (simplified)
  useEffect(() => {
    let frameCount = 0;
    let startTime = performance.now();
    
    const measureFrameRate = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - startTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - startTime));
        setMetrics(prev => ({ ...prev, frameRate: fps }));
        
        // Auto-optimize if performance is poor
        if (performanceConfig.enableAutoOptimization && fps < performanceConfig.targetFrameRate * 0.8) {
          setIsOptimized(true);
        }
        
        frameCount = 0;
        startTime = currentTime;
      }
      
      requestAnimationFrame(measureFrameRate);
    };
    
    const animationFrame = requestAnimationFrame(measureFrameRate);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [performanceConfig]);
  
  return {
    metrics,
    isOptimized,
    startMeasurement,
    endMeasurement,
    setOptimized: setIsOptimized
  };
};

/**
 * Hook for device capability detection
 */
export const useDeviceCapabilities = (): DeviceCapabilities => {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    supportsBackdropFilter: true,
    supportsBlur: true,
    performanceLevel: 'medium',
    screenSize: 'mobile'
  });
  
  useEffect(() => {
    const detectCapabilities = () => {
      // Detect screen size using React Native Dimensions
      const { width } = Dimensions.get('window');
      let screenSize: DeviceCapabilities['screenSize'] = 'mobile';
      
      if (width >= 1024) {
        screenSize = 'desktop';
      } else if (width >= 768) {
        screenSize = 'tablet';
      }
      
      // For React Native, use simplified detection
      let performanceLevel: DeviceCapabilities['performanceLevel'] = 'medium';
      
      // Basic heuristic based on screen size for mobile devices
      if (width >= 1024) {
        performanceLevel = 'high';
      } else if (width <= 375) {
        performanceLevel = 'low';
      }
      
      setCapabilities({
        supportsBackdropFilter: true, // React Native supports backdrop filters
        supportsBlur: true,
        performanceLevel,
        screenSize
      });
    };
    
    detectCapabilities();
    
    // Listen for orientation changes
    const subscription = Dimensions.addEventListener('change', detectCapabilities);
    
    return () => {
      subscription?.remove();
    };
  }, []);
  
  return capabilities;
};

/**
 * Hook for automatic glass effect optimization
 */
export const useGlassOptimization = (
  initialConfig: GlassOptimizationConfig
): [GlassOptimizationConfig, (updates: Partial<GlassOptimizationConfig>) => void] => {
  const [config, setConfig] = useState<GlassOptimizationConfig>(initialConfig);
  const capabilities = useDeviceCapabilities();
  const { metrics } = useGlassPerformanceMonitor('GlassOptimization');
  
  // Auto-optimize based on device capabilities and performance
  useEffect(() => {
    let optimizedConfig = { ...config };
    
    // Optimize for low-performance devices
    if (capabilities.performanceLevel === 'low') {
      optimizedConfig = {
        ...optimizedConfig,
        enableBlur: false,
        enableAnimations: false,
        enableShadows: false,
        performanceMode: 'performance'
      };
    }
    
    // Optimize based on frame rate
    if (metrics.frameRate < 30) {
      optimizedConfig = {
        ...optimizedConfig,
        enableAnimations: false,
        performanceMode: 'performance'
      };
    }
    
    // Only update if config actually changed
    if (JSON.stringify(optimizedConfig) !== JSON.stringify(config)) {
      setConfig(optimizedConfig);
      console.log('Glass effects auto-optimized:', optimizedConfig);
    }
  }, [capabilities, metrics.frameRate]);
  
  const updateConfig = useCallback((updates: Partial<GlassOptimizationConfig>) => {
    setConfig((prev: GlassOptimizationConfig) => ({ ...prev, ...updates }));
  }, []);
  
  return [config, updateConfig];
};

/**
 * Memory monitoring utilities (React Native compatible)
 */
export const useMemoryMonitoring = () => {
  const [memoryUsage, setMemoryUsage] = useState(0);
  
  useEffect(() => {
    const monitorMemory = () => {
      // For React Native, we'll use a simplified approach
      // In a real implementation, you might use native modules for memory info
      const estimatedUsage = Math.random() * 50 + 30; // Mock data for now
      setMemoryUsage(estimatedUsage);
      
      // Warn if memory usage is high
      if (estimatedUsage > 150) {
        console.warn(`High memory usage detected: ${estimatedUsage.toFixed(1)}MB`);
      }
    };
    
    // Monitor every 5 seconds
    const interval = setInterval(monitorMemory, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return memoryUsage;
};

/**
 * Lazy loading utilities for glass components
 */
export const useGlassLazyLoading = <T>(
  loader: () => Promise<T>,
  threshold: number = 0.1
) => {
  const [component, setComponent] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      // Fallback for environments without IntersectionObserver
      loadComponent();
      return;
    }
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadComponent();
            observerRef.current?.disconnect();
          }
        });
      },
      { threshold }
    );
    
    if (elementRef.current) {
      observerRef.current.observe(elementRef.current);
    }
    
    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold]);
  
  const loadComponent = async () => {
    if (component || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const loadedComponent = await loader();
      setComponent(loadedComponent);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load component'));
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    component,
    isLoading,
    error,
    elementRef
  };
};

/**
 * Performance reporting utilities
 */
export const reportPerformanceMetrics = (
  componentName: string,
  metrics: PerformanceMetrics
) => {
  // In a real application, you'd send this to an analytics service
  const report = {
    timestamp: new Date().toISOString(),
    component: componentName,
    metrics,
    userAgent: navigator.userAgent,
    screen: {
      width: window.screen?.width || 0,
      height: window.screen?.height || 0
    }
  };
  
  if (__DEV__) {
    console.log('Performance Report:', report);
  }
  
  // Send to analytics service here
  // Example: analytics.track('glass_component_performance', report);
};
