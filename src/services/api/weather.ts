import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import { deflate, inflate } from 'react-native-zlib';

const TOMORROW_API_KEY = 'sSE6Qq7cNeBPZYOXV5LeA33JbNnOjdaj';

export interface WeatherInfo {
  temperature: number;    // 温度 (°C)
  humidity: number;       // 湿度 (%)
  windSpeed: number;      // 风速 (m/s)
  windDirection: string;  // 风向
  description: string;    // 天气描述
  precipitation: number;  // 降水概率 (%)
  visibility: number;     // 能见度 (km)
  uvIndex: number;       // 紫外线指数
  timestamp: number;      // 数据时间戳
}

interface WeatherCache {
  data: WeatherInfo;
  timestamp: number;
}

const CACHE_KEY = 'weather_cache';
const CACHE_DURATION = 10 * 60 * 1000; // 10分钟缓存
const STALE_DURATION = 30 * 60 * 1000; // 30分钟后数据过期

// 缓存管理
class WeatherCacheManager {
  private static instance: WeatherCacheManager;
  private cache: Map<string, WeatherCache> = new Map();
  private isInitialized = false;

  private constructor() {}

  static getInstance(): WeatherCacheManager {
    if (!WeatherCacheManager.instance) {
      WeatherCacheManager.instance = new WeatherCacheManager();
    }
    return WeatherCacheManager.instance;
  }

  // 压缩数据
  private async compressData(data: string): Promise<string> {
    try {
      const buffer = Buffer.from(data);
      const compressed = await deflate(buffer);
      return compressed.toString('base64');
    } catch (error) {
      console.error('Compression failed:', error);
      return data;
    }
  }

  // 解压数据
  private async decompressData(data: string): Promise<string> {
    try {
      const buffer = Buffer.from(data, 'base64');
      const decompressed = await inflate(buffer);
      return decompressed.toString();
    } catch (error) {
      console.error('Decompression failed:', error);
      return data;
    }
  }

  // 修改持久化缓存方法，添加压缩
  private async persistCache() {
    try {
      const cacheObject = Object.fromEntries(this.cache.entries());
      const jsonString = JSON.stringify(cacheObject);
      const compressed = await this.compressData(jsonString);
      await AsyncStorage.setItem(CACHE_KEY, compressed);
    } catch (error) {
      console.error('Failed to persist weather cache:', error);
    }
  }

  // 修改初始化方法，添加解压
  async initialize() {
    if (this.isInitialized) return;
    try {
      const savedCache = await AsyncStorage.getItem(CACHE_KEY);
      if (savedCache) {
        const decompressed = await this.decompressData(savedCache);
        const parsed = JSON.parse(decompressed);
        Object.entries(parsed).forEach(([key, value]) => {
          this.cache.set(key, value as WeatherCache);
        });
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to load weather cache:', error);
    }
  }

  // 获取缓存数据
  get(key: string): WeatherInfo | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > STALE_DURATION) {
      this.cache.delete(key);
      this.persistCache();
      return null;
    }

    return cached.data;
  }

  // 设置缓存数据
  set(key: string, data: WeatherInfo) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
    this.persistCache();
  }

  // 清理过期缓存
  cleanStaleCache() {
    const now = Date.now();
    let hasChanges = false;
    
    this.cache.forEach((value, key) => {
      if (now - value.timestamp > STALE_DURATION) {
        this.cache.delete(key);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      this.persistCache();
    }
  }

  // 获取缓存键
  static getCacheKey(latitude: number, longitude: number): string {
    return `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
  }

  // 缓存预热
  async preloadCommonLocations() {
    const commonLocations = [
      { lat: 35.6762, lon: 139.6503, name: 'Tokyo' },      // 东京
      { lat: 34.6937, lon: 135.5023, name: 'Osaka' },      // 大阪
      { lat: 35.0116, lon: 135.7681, name: 'Kyoto' },      // 京都
      { lat: 43.0618, lon: 141.3545, name: 'Sapporo' },    // 札幌
      { lat: 26.2124, lon: 127.6809, name: 'Okinawa' },    // 冲绳
    ];

    try {
      await Promise.all(
        commonLocations.map(async location => {
          const cacheKey = WeatherCacheManager.getCacheKey(location.lat, location.lon);
          if (!this.cache.has(cacheKey)) {
            console.log(`Preloading weather for ${location.name}...`);
            const weatherInfo = await getWeatherInfo(location.lat, location.lon);
            this.set(cacheKey, weatherInfo);
          }
        })
      );
      console.log('Weather cache preloading completed');
    } catch (error) {
      console.error('Weather cache preloading failed:', error);
    }
  }

  // 获取缓存统计
  getCacheStats() {
    const now = Date.now();
    const stats = {
      totalEntries: this.cache.size,
      freshEntries: 0,
      staleEntries: 0,
      averageAge: 0,
      oldestEntry: 0,
      newestEntry: now,
      totalSize: 0,
    };

    this.cache.forEach(value => {
      const age = now - value.timestamp;
      stats.averageAge += age;
      stats.oldestEntry = Math.max(stats.oldestEntry, age);
      stats.newestEntry = Math.min(stats.newestEntry, age);
      
      if (age < CACHE_DURATION) {
        stats.freshEntries++;
      } else {
        stats.staleEntries++;
      }
    });

    if (stats.totalEntries > 0) {
      stats.averageAge /= stats.totalEntries;
    }

    return stats;
  }
}

export const getWeatherInfo = async (latitude: number, longitude: number): Promise<WeatherInfo> => {
  try {
    const cacheManager = WeatherCacheManager.getInstance();
    await cacheManager.initialize();

    const cacheKey = WeatherCacheManager.getCacheKey(latitude, longitude);
    const cachedData = cacheManager.get(cacheKey);

    // 如果有有效缓存，直接返回
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return cachedData;
    }

    // 验证输入参数
    if (!isValidCoordinates(latitude, longitude)) {
      throw new Error('Invalid coordinates');
    }

    const response = await fetch(
      `https://api.tomorrow.io/v4/weather/realtime?location=${latitude},${longitude}&apikey=${TOMORROW_API_KEY}&units=metric`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      // 如果有过期缓存，在API错误时仍然返回
      if (cachedData) {
        console.log('API error, returning stale cache');
        return cachedData;
      }
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data?.values) {
      throw new Error('Invalid weather data format');
    }

    const values = data.data.values;
    const weatherInfo: WeatherInfo = {
      temperature: validateNumber(values.temperature, -100, 100),
      humidity: validateNumber(values.humidity, 0, 100),
      windSpeed: validateNumber(values.windSpeed, 0, 200),
      windDirection: getWindDirection(validateNumber(values.windDirection, 0, 360)),
      description: getWeatherDescription(values.weatherCode),
      precipitation: validateNumber(values.precipitationProbability, 0, 100),
      visibility: validateNumber(values.visibility, 0, 100),
      uvIndex: validateNumber(values.uvIndex, 0, 12),
      timestamp: Date.now(),
    };

    // 更新缓存
    cacheManager.set(cacheKey, weatherInfo);
    
    return weatherInfo;
  } catch (error) {
    console.error('Weather fetch error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch weather data');
  }
};

// 验证数字是否在有效范围内
const validateNumber = (value: number, min: number, max: number): number => {
  const num = Number(value);
  if (isNaN(num) || num < min || num > max) {
    throw new Error(`Value ${value} is outside valid range [${min}, ${max}]`);
  }
  return num;
};

// 验证坐标是否有效
const isValidCoordinates = (lat: number, lon: number): boolean => {
  return !isNaN(lat) && !isNaN(lon) && 
         lat >= -90 && lat <= 90 && 
         lon >= -180 && lon <= 180;
};

// Convert degrees to cardinal directions
const getWindDirection = (degree: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degree / 45) % 8;
  return directions[index];
};

// Convert weather code to description
const getWeatherDescription = (code: number): string => {
  const weatherCodes: { [key: number]: string } = {
    1000: 'Clear',
    1100: 'Mostly Clear',
    1101: 'Partly Cloudy',
    1102: 'Mostly Cloudy',
    2000: 'Fog',
    2100: 'Light Fog',
    3000: 'Light Wind',
    3001: 'Wind',
    3002: 'Strong Wind',
    4000: 'Drizzle',
    4001: 'Rain',
    4200: 'Light Rain',
    4201: 'Heavy Rain',
    5000: 'Snow',
    5001: 'Flurries',
    5100: 'Light Snow',
    5101: 'Heavy Snow',
    6000: 'Freezing Drizzle',
    6001: 'Freezing Rain',
    6200: 'Light Freezing Rain',
    6201: 'Heavy Freezing Rain',
    7000: 'Ice Pellets',
    7101: 'Heavy Ice Pellets',
    7102: 'Light Ice Pellets',
    8000: 'Thunderstorm',
  };
  
  return weatherCodes[code] || 'Unknown';
};

// 获取空气质量信息
export const getAQI = async (latitude: number, longitude: number): Promise<number> => {
  try {
    const response = await fetch(
      `https://restapi.amap.com/v3/geocode/regeo?location=${longitude},${latitude}&key=${AMAP_KEY}`
    );
    const locationData = await response.json();
    const adcode = locationData.regeocode.addressComponent.adcode;

    const aqiResponse = await fetch(
      `https://restapi.amap.com/v3/weather/weatherInfo?city=${adcode}&key=${AMAP_KEY}&extensions=all`
    );
    const aqiData = await aqiResponse.json();
    return parseInt(aqiData.forecasts[0].casts[0].dayaqi);
  } catch (error) {
    console.error('获取空气质量信息失败:', error);
    return 0;
  }
};

// 测试 API
export const testWeatherAPI = async (): Promise<boolean> => {
  try {
    // 测试东京的天气
    const weatherInfo = await getWeatherInfo(35.6762, 139.6503);
    console.log('Weather API test result:', weatherInfo);
    return true;
  } catch (error) {
    console.error('Weather API test failed:', error);
    return false;
  }
};

// 在应用启动时预热缓存
export const initializeWeatherCache = async () => {
  const cacheManager = WeatherCacheManager.getInstance();
  await cacheManager.initialize();
  await cacheManager.preloadCommonLocations();
}; 