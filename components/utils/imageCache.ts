/**
 * Simple image cache utility to improve loading performance for React Native
 */

interface ImageCacheItem {
  uri: string
  timestamp: number
}

class ImageCacheManager {
  private static instance: ImageCacheManager
  private cache: Map<string, ImageCacheItem> = new Map()
  private readonly CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

  static getInstance(): ImageCacheManager {
    if (!ImageCacheManager.instance) {
      ImageCacheManager.instance = new ImageCacheManager()
    }
    return ImageCacheManager.instance
  }

  /**
   * Get optimized image URI for better caching
   * Removes cache-busting parameters that might prevent caching
   */
  getOptimizedUri(originalUri: string): string {
    if (!originalUri || !originalUri.includes('http')) {
      return originalUri
    }

    try {
      const url = new URL(originalUri)
      
      // Remove common cache-busting parameters
      url.searchParams.delete('t')
      url.searchParams.delete('timestamp')
      url.searchParams.delete('_')
      url.searchParams.delete('cache')
      url.searchParams.delete('v')
      url.searchParams.delete('version')
      
      const optimizedUri = url.toString()
      
      // Store in our memory cache for reference
      const now = Date.now()
      this.cache.set(optimizedUri, {
        uri: optimizedUri,
        timestamp: now
      })
      
      return optimizedUri
    } catch (error) {
      // If URL parsing fails, return original
      console.warn('Failed to optimize image URI:', error)
      return originalUri
    }
  }

  /**
   * Check if an image URI is likely cached
   */
  isLikelyCached(uri: string): boolean {
    if (!uri) return false
    
    const cacheItem = this.cache.get(uri)
    if (!cacheItem) return false
    
    const now = Date.now()
    return (now - cacheItem.timestamp) < this.CACHE_DURATION
  }

  /**
   * Clear expired cache entries
   */
  clearExpired(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if ((now - item.timestamp) >= this.CACHE_DURATION) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.cache.clear()
  }
}

export const imageCache = ImageCacheManager.getInstance()
