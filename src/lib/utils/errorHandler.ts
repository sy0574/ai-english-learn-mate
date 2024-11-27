// 定义API错误类型
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// 常见错误的中文提示
const ERROR_MESSAGES = {
  // API认证错误
  'auth': {
    title: 'API认证失败',
    message: '系统无法连接到AI服务。可能的原因：\n1. API密钥无效或已过期\n2. API密钥额度已用完\n请检查环境配置文件中的API密钥是否正确。'
  },
  // 网络错误
  'network': {
    title: '网络连接失败',
    message: '无法连接到AI服务器。可能的原因：\n1. 网络连接不稳定\n2. AI服务器暂时无法访问\n请检查网络连接并稍后重试。'
  },
  // 响应格式错误
  'format': {
    title: '响应格式错误',
    message: 'AI返回的数据格式不正确。这可能是临时性问题，请重试。如果问题持续存在，可能需要检查提示词设置。'
  },
  // 默认错误
  'default': {
    title: '系统错误',
    message: '发生了意外错误。请重试，如果问题持续存在，请联系技术支持。'
  }
};

export function handleAPIError(error: unknown): APIError {
  // 网络错误
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return new APIError(ERROR_MESSAGES.network.message, undefined, 'network');
  }

  // API错误
  if (error instanceof APIError) {
    // 认证错误
    if (error.status === 401 || error.status === 403) {
      return new APIError(ERROR_MESSAGES.auth.message, error.status, 'auth');
    }
    return error;
  }

  // 格式错误
  if (error instanceof SyntaxError || 
      (error instanceof Error && error.message.includes('JSON'))) {
    return new APIError(ERROR_MESSAGES.format.message, undefined, 'format');
  }

  // 其他错误
  return new APIError(
    ERROR_MESSAGES.default.message,
    undefined,
    'default'
  );
}

export function getErrorMessage(error: unknown): {
  title: string;
  message: string;
} {
  if (error instanceof APIError) {
    const errorType = error.code || 'default';
    return ERROR_MESSAGES[errorType as keyof typeof ERROR_MESSAGES];
  }
  return ERROR_MESSAGES.default;
}
