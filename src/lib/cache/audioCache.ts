interface CacheItem {
  url: string;
  blob: Blob;
  lastAccessed: number;
}

class AudioCache {
  private cache: Map<string, CacheItem> = new Map();
  private maxSize: number = 50; // 最大缓存数量
  private maxAge: number = 5 * 60 * 1000; // 缓存有效期（5分钟）

  async getAudio(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    // 检查是否过期
    if (Date.now() - item.lastAccessed > this.maxAge) {
      this.cache.delete(key);
      URL.revokeObjectURL(item.url);
      return null;
    }

    // 更新访问时间
    item.lastAccessed = Date.now();
    return item.url;
  }

  async setAudio(key: string, blob: Blob): Promise<string> {
    // 如果缓存已满，删除最旧的项目
    if (this.cache.size >= this.maxSize) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;

      for (const [k, v] of this.cache.entries()) {
        if (v.lastAccessed < oldestTime) {
          oldestTime = v.lastAccessed;
          oldestKey = k;
        }
      }

      if (oldestKey) {
        const oldItem = this.cache.get(oldestKey);
        if (oldItem) {
          URL.revokeObjectURL(oldItem.url);
        }
        this.cache.delete(oldestKey);
      }
    }

    // 创建新的缓存项
    const url = URL.createObjectURL(blob);
    this.cache.set(key, {
      url,
      blob,
      lastAccessed: Date.now()
    });

    return url;
  }

  clear() {
    for (const item of this.cache.values()) {
      URL.revokeObjectURL(item.url);
    }
    this.cache.clear();
  }
}

export const audioCache = new AudioCache();
