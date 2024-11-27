// Environment variables
export const env = {
  OPENROUTER_API_URL: import.meta.env.VITE_OPENROUTER_API_URL,
  OPENROUTER_API_KEY: import.meta.env.VITE_OPENROUTER_API_KEY,
  STEP_API_URL: import.meta.env.VITE_STEP_API_URL || 'https://api.stepfun.com/v1/chat/completions',
  STEP_API_KEY: import.meta.env.VITE_STEP_API_KEY
} as const;