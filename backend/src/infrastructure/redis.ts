import { createClient, RedisClientType } from 'redis';
import { config } from '../config';
import { logger } from './logger';

class RedisManager {
  private client: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    this.client = createClient({
      url: config.redis.url,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
      },
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      logger.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis Client Connected');
    });

    this.client.on('disconnect', () => {
      this.isConnected = false;
      logger.warn('Redis Client Disconnected');
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      if (!this.isConnected) await this.connect();
      return await this.client.get(key);
    } catch (error) {
      logger.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      if (!this.isConnected) await this.connect();
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error('Redis SET error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) await this.connect();
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis DEL error:', error);
      return false;
    }
  }

  async setJson(key: string, value: any, ttl?: number): Promise<boolean> {
    return this.set(key, JSON.stringify(value), ttl);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Redis JSON parse error:', error);
      return null;
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }
}

const redisManager = new RedisManager();

export const connectRedis = async () => {
  await redisManager.connect();
};

export const redisClient = redisManager.getClient();
export { redisManager };
