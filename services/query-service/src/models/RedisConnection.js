const redis = require('redis');

class RedisConnection {
  constructor() {
    this.client = null;
  }

  async connect() {
    if (!this.client) {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.client = redis.createClient({ url: redisUrl });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        console.log('Connected to Redis');
      });

      await this.client.connect();
    }
    return this.client;
  }

  async get(key) {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key, value, ttl = 300) { // Default TTL: 5 minutes
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }
    
    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  async del(key) {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error);
      return false;
    }
  }

  async flushPattern(pattern) {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }
    
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Redis FLUSH PATTERN error:', error);
      return false;
    }
  }

  async close() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }
}

module.exports = new RedisConnection();
