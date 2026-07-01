import { createClient } from 'redis';

let redisClient = null;

export const getRedisClient = () => redisClient;

export const initRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: { reconnectStrategy: false, connectTimeout: 3000 },
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('Redis Connected');
    });

    await redisClient.connect();
    return redisClient;
  } catch (err) {
    console.log('Redis connection unavailable:', err.code || err.message || 'ECONNREFUSED');
    return null;
  }
};

export const cacheData = async (key, data, ttl = 3600) => {
  if (!redisClient || !redisClient.isOpen) return null;
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(data));
  } catch (err) {
    console.error('Redis cache set error:', err.message);
  }
};

export const getCachedData = async (key) => {
  if (!redisClient || !redisClient.isOpen) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Redis cache get error:', err.message);
    return null;
  }
};

export const invalidateCache = async (pattern) => {
  if (!redisClient || !redisClient.isOpen) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (err) {
    console.error('Redis cache invalidate error:', err.message);
  }
};

export const publishEvent = async (channel, message) => {
  if (!redisClient || !redisClient.isOpen) return;
  try {
    await redisClient.publish(channel, JSON.stringify(message));
  } catch (err) {
    console.error('Redis publish error:', err.message);
  }
};
