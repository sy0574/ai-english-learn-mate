interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffFactor?: number;
  shouldRetry?: (error: any) => boolean;
}

const defaultOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffFactor: 2,
  shouldRetry: (error: any) => {
    // 默认只在网络错误或服务器错误时重试
    return error?.name === 'AINetworkError' || 
           (error?.message && error.message.includes('网络')) ||
           error?.message?.includes('timeout');
  }
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const finalOptions = { ...defaultOptions, ...options };
  let lastError: any;
  let delay = finalOptions.delayMs;

  for (let attempt = 1; attempt <= finalOptions.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      const shouldRetry = finalOptions.shouldRetry(error);
      const hasMoreAttempts = attempt < finalOptions.maxAttempts;
      
      if (!shouldRetry || !hasMoreAttempts) {
        throw error;
      }

      // 记录重试信息
      console.log(
        `操作失败 (尝试 ${attempt}/${finalOptions.maxAttempts})，` +
        `将在 ${delay}ms 后重试。错误: ${error?.message || '未知错误'}`
      );

      // 等待延迟时间后重试
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // 增加下次重试的延迟时间
      delay *= finalOptions.backoffFactor;
    }
  }

  throw lastError;
}
