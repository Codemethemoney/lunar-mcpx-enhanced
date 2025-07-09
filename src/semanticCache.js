// semanticCache.js - Semantic caching for performance
/**
 * Implements semantic caching to improve response times
 * for similar queries
 */

import NodeCache from 'node-cache';
import cosineSimilarity from 'cosine-similarity';

export class SemanticCache {
  constructor(options = {}) {
    this.cache = new NodeCache({
      stdTTL: options.ttl || 3600, // 1 hour default
      checkperiod: options.checkPeriod || 600 // 10 minutes
    });
    this.similarityThreshold = options.threshold || 0.85;
    this.maxCacheSize = options.maxSize || 1000;
    this.embeddings = new Map();
  }

  /**
   * Generate simple text embedding (in production, use proper embeddings)
   * @param {string} text - Text to embed
   * @returns {Array} Embedding vector
   */
  generateEmbedding(text) {
    // Simple character frequency based embedding
    // In production, use proper sentence embeddings
    const vector = new Array(26).fill(0);
    const normalized = text.toLowerCase().replace(/[^a-z]/g, '');
        
    for (const char of normalized) {
      const index = char.charCodeAt(0) - 97;
      if (index >= 0 && index < 26) {
        vector[index]++;
      }
    }
    
    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }

  /**
   * Find similar cached query
   * @param {string} query - Query to search for
   * @returns {Object|null} Cached result or null
   */
  findSimilar(query) {
    const queryEmbedding = this.generateEmbedding(query);
    let bestMatch = null;
    let highestSimilarity = 0;
    
    for (const [cachedQuery, embedding] of this.embeddings) {
      const similarity = cosineSimilarity(queryEmbedding, embedding);
      
      if (similarity > highestSimilarity && similarity >= this.similarityThreshold) {
        highestSimilarity = similarity;
        bestMatch = cachedQuery;
      }
    }    
    if (bestMatch) {
      const cached = this.cache.get(bestMatch);
      if (cached) {
        return {
          ...cached,
          similarity: highestSimilarity,
          originalQuery: bestMatch
        };
      }
    }
    
    return null;
  }

  /**
   * Get cached result or compute and cache
   * @param {string} key - Cache key
   * @param {Function} computeFn - Function to compute result
   * @returns {any} Cached or computed result
   */
  async getCachedOrCompute(key, computeFn) {
    // Try exact match first
    let result = this.cache.get(key);
    
    if (!result) {
      // Try semantic match
      const similar = this.findSimilar(key);
      if (similar) {
        result = similar;
      }
    }    
    if (!result) {
      // Compute and cache
      result = await computeFn();
      this.set(key, result);
    }
    
    return result;
  }

  /**
   * Set cache entry
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   */
  set(key, value) {
    // Check cache size
    if (this.cache.keys().length >= this.maxCacheSize) {
      // Remove oldest entry
      const oldestKey = this.cache.keys()[0];
      this.cache.del(oldestKey);
      this.embeddings.delete(oldestKey);
    }
    
    this.cache.set(key, value);
    this.embeddings.set(key, this.generateEmbedding(key));
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.flushAll();
    this.embeddings.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    return {
      keys: this.cache.keys().length,
      hits: this.cache.getStats().hits,
      misses: this.cache.getStats().misses,
      hitRate: this.cache.getStats().hits / 
        (this.cache.getStats().hits + this.cache.getStats().misses) || 0
    };
  }
}