const NodeCache = require('node-cache');

// Simple in-memory cache with configurable TTL
const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL || '300'), // 5 minutes default
  checkperiod: 60 // Check for expired keys every 60 seconds
});

/**
 * Get cached data
 * @param {string} key - Cache key
 * @returns {any|null} Cached data or null if not found/expired
 */
function getCachedData(key) {
  const value = cache.get(key);
  if (value === undefined) {
    return null;
  }
  return value;
}

/**
 * Set cached data
 * @param {string} key - Cache key
 * @param {any} value - Data to cache
 * @param {number} ttl - Time to live in seconds (optional, uses default if not provided)
 */
function setCachedData(key, value, ttl = undefined) {
  if (ttl !== undefined) {
    cache.set(key, value, ttl);
  } else {
    cache.set(key, value);
  }
}

/**
 * Clear specific cache key
 * @param {string} key - Cache key to clear
 */
function clearCache(key) {
  cache.del(key);
}

/**
 * Clear all cache
 */
function clearAllCache() {
  cache.flushAll();
}

module.exports = {
  getCachedData,
  setCachedData,
  clearCache,
  clearAllCache
};
