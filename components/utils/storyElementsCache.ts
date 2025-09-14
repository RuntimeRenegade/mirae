import AsyncStorage from '@react-native-async-storage/async-storage'
import { 
  StoryElementsCache, 
  CacheItem, 
  StoryElementCategory, 
  StoryElement 
} from '../types/story-creation'

// Cache configuration
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds

// Create age-specific cache keys
const getCacheKeys = (ageGroup: '6-8' | '9-12' = '6-8') => ({
  HEROES: `story_heroes_cache_${ageGroup}`,
  MONSTERS: `story_monsters_cache_${ageGroup}`, 
  SETTINGS: `story_settings_cache_${ageGroup}`
})

class StoryElementsCacheManager {
  private memoryCache: Map<string, StoryElementsCache> = new Map()

  /**
   * Get memory cache for specific age group
   */
  private getMemoryCache(ageGroup: '6-8' | '9-12' = '6-8'): StoryElementsCache {
    const key = `cache_${ageGroup}`
    if (!this.memoryCache.has(key)) {
      this.memoryCache.set(key, {
        heroes: null,
        monsters: null,
        settings: null
      })
    }
    return this.memoryCache.get(key)!
  }

  /**
   * Check if cache item is valid (not expired)
   */
  private isValidCache<T>(cacheItem: CacheItem<T> | null): boolean {
    if (!cacheItem) return false
    return Date.now() < cacheItem.expiry
  }

  /**
   * Create a cache item with expiry
   */
  private createCacheItem<T>(data: T): CacheItem<T> {
    return {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + CACHE_DURATION
    }
  }

  /**
   * Get heroes from cache (memory first, then AsyncStorage)
   */
  async getHeroes(ageGroup: '6-8' | '9-12' = '6-8'): Promise<StoryElementCategory[] | null> {
    const cache = this.getMemoryCache(ageGroup)
    const cacheKeys = getCacheKeys(ageGroup)
    
    // Check memory cache first
    if (this.isValidCache(cache.heroes)) {
      console.log(`📦 Heroes loaded from memory cache (${ageGroup})`)
      return cache.heroes!.data
    }

    try {
      // Check AsyncStorage
      const cached = await AsyncStorage.getItem(cacheKeys.HEROES)
      if (cached) {
        const cacheItem: CacheItem<StoryElementCategory[]> = JSON.parse(cached)
        if (this.isValidCache(cacheItem)) {
          console.log(`📦 Heroes loaded from storage cache (${ageGroup})`)
          cache.heroes = cacheItem
          return cacheItem.data
        }
      }
    } catch (error) {
      console.error(`Error reading heroes cache (${ageGroup}):`, error)
    }

    return null
  }

  /**
   * Cache heroes data
   */
  async cacheHeroes(heroes: StoryElementCategory[], ageGroup: '6-8' | '9-12' = '6-8'): Promise<void> {
    const cache = this.getMemoryCache(ageGroup)
    const cacheKeys = getCacheKeys(ageGroup)
    const cacheItem = this.createCacheItem(heroes)
    
    // Update memory cache
    cache.heroes = cacheItem
    
    try {
      // Update AsyncStorage
      await AsyncStorage.setItem(cacheKeys.HEROES, JSON.stringify(cacheItem))
      console.log(`💾 Heroes cached successfully (${ageGroup})`)
    } catch (error) {
      console.error(`Error caching heroes (${ageGroup}):`, error)
    }
  }

  /**
   * Get monsters from cache
   */
  async getMonsters(ageGroup: '6-8' | '9-12' = '6-8'): Promise<StoryElementCategory[] | null> {
    const cache = this.getMemoryCache(ageGroup)
    const cacheKeys = getCacheKeys(ageGroup)
    
    if (this.isValidCache(cache.monsters)) {
      console.log(`📦 Monsters loaded from memory cache (${ageGroup})`)
      return cache.monsters!.data
    }

    try {
      const cached = await AsyncStorage.getItem(cacheKeys.MONSTERS)
      if (cached) {
        const cacheItem: CacheItem<StoryElementCategory[]> = JSON.parse(cached)
        if (this.isValidCache(cacheItem)) {
          console.log(`📦 Monsters loaded from storage cache (${ageGroup})`)
          cache.monsters = cacheItem
          return cacheItem.data
        }
      }
    } catch (error) {
      console.error(`Error reading monsters cache (${ageGroup}):`, error)
    }

    return null
  }

  /**
   * Cache monsters data
   */
  async cacheMonsters(monsters: StoryElementCategory[], ageGroup: '6-8' | '9-12' = '6-8'): Promise<void> {
    const cache = this.getMemoryCache(ageGroup)
    const cacheKeys = getCacheKeys(ageGroup)
    const cacheItem = this.createCacheItem(monsters)
    
    cache.monsters = cacheItem
    
    try {
      await AsyncStorage.setItem(cacheKeys.MONSTERS, JSON.stringify(cacheItem))
      console.log(`💾 Monsters cached successfully (${ageGroup})`)
    } catch (error) {
      console.error(`Error caching monsters (${ageGroup}):`, error)
    }
  }

  /**
   * Get story settings from cache
   */
  async getSettings(ageGroup: '6-8' | '9-12' = '6-8'): Promise<StoryElement[] | null> {
    const cache = this.getMemoryCache(ageGroup)
    const cacheKeys = getCacheKeys(ageGroup)
    
    if (this.isValidCache(cache.settings)) {
      console.log(`📦 Settings loaded from memory cache (${ageGroup})`)
      return cache.settings!.data
    }

    try {
      const cached = await AsyncStorage.getItem(cacheKeys.SETTINGS)
      if (cached) {
        const cacheItem: CacheItem<StoryElement[]> = JSON.parse(cached)
        if (this.isValidCache(cacheItem)) {
          console.log(`📦 Settings loaded from storage cache (${ageGroup})`)
          cache.settings = cacheItem
          return cacheItem.data
        }
      }
    } catch (error) {
      console.error(`Error reading settings cache (${ageGroup}):`, error)
    }

    return null
  }

  /**
   * Cache story settings data
   */
  async cacheSettings(settings: StoryElement[], ageGroup: '6-8' | '9-12' = '6-8'): Promise<void> {
    const cache = this.getMemoryCache(ageGroup)
    const cacheKeys = getCacheKeys(ageGroup)
    const cacheItem = this.createCacheItem(settings)
    
    cache.settings = cacheItem
    
    try {
      await AsyncStorage.setItem(cacheKeys.SETTINGS, JSON.stringify(cacheItem))
      console.log(`💾 Settings cached successfully (${ageGroup})`)
    } catch (error) {
      console.error(`Error caching settings (${ageGroup}):`, error)
    }
  }

  /**
   * Clear all cache data
   */
  async clearCache(): Promise<void> {
    // Clear memory cache for all age groups
    this.memoryCache.clear()

    try {
      // Clear AsyncStorage for both age groups
      const cacheKeys68 = getCacheKeys('6-8')
      const cacheKeys912 = getCacheKeys('9-12')
      
      await Promise.all([
        AsyncStorage.removeItem(cacheKeys68.HEROES),
        AsyncStorage.removeItem(cacheKeys68.MONSTERS),
        AsyncStorage.removeItem(cacheKeys68.SETTINGS),
        AsyncStorage.removeItem(cacheKeys912.HEROES),
        AsyncStorage.removeItem(cacheKeys912.MONSTERS),
        AsyncStorage.removeItem(cacheKeys912.SETTINGS)
      ])
      console.log('🧹 Cache cleared successfully for all age groups')
    } catch (error) {
      console.error('Error clearing cache:', error)
    }
  }

  /**
   * Check cache status for debugging
   */
  getCacheStatus(ageGroup: '6-8' | '9-12' = '6-8'): {
    heroes: boolean
    monsters: boolean
    settings: boolean
  } {
    const cache = this.getMemoryCache(ageGroup)
    return {
      heroes: this.isValidCache(cache.heroes),
      monsters: this.isValidCache(cache.monsters),
      settings: this.isValidCache(cache.settings)
    }
  }
}

// Export singleton instance
export const storyElementsCache = new StoryElementsCacheManager()

// Helper functions for API integration
export const loadCachedOrFetchHeroes = async (
  fetchFunction: () => Promise<StoryElementCategory[]>,
  ageGroup: '6-8' | '9-12' = '6-8'
): Promise<StoryElementCategory[]> => {
  // Try cache first
  const cached = await storyElementsCache.getHeroes(ageGroup)
  if (cached) {
    return cached
  }

  // Fetch fresh data
  console.log(`🌐 Fetching fresh heroes data (${ageGroup})...`)
  const fresh = await fetchFunction()
  await storyElementsCache.cacheHeroes(fresh, ageGroup)
  return fresh
}

export const loadCachedOrFetchMonsters = async (
  fetchFunction: () => Promise<StoryElementCategory[]>,
  ageGroup: '6-8' | '9-12' = '6-8'
): Promise<StoryElementCategory[]> => {
  const cached = await storyElementsCache.getMonsters(ageGroup)
  if (cached) {
    return cached
  }

  console.log(`🌐 Fetching fresh monsters data (${ageGroup})...`)
  const fresh = await fetchFunction()
  await storyElementsCache.cacheMonsters(fresh, ageGroup)
  return fresh
}

export const loadCachedOrFetchSettings = async (
  fetchFunction: () => Promise<StoryElement[]>,
  ageGroup: '6-8' | '9-12' = '6-8'
): Promise<StoryElement[]> => {
  const cached = await storyElementsCache.getSettings(ageGroup)
  if (cached) {
    return cached
  }

  console.log(`🌐 Fetching fresh settings data (${ageGroup})...`)
  const fresh = await fetchFunction()
  await storyElementsCache.cacheSettings(fresh, ageGroup)
  return fresh
}
