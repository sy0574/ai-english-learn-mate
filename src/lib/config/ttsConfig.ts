export const TTS_VOICES = {
  // 美式英语
  US: {
    MALE: 'en-US-ChristopherNeural',    // 成熟男声
    FEMALE: 'en-US-JennyNeural',        // 自然女声
    MALE_CASUAL: 'en-US-GuyNeural',     // 随意男声
    FEMALE_CASUAL: 'en-US-AriaNeural',  // 随意女声
  },
  // 英式英语
  GB: {
    MALE: 'en-GB-RyanNeural',           // 成熟男声
    FEMALE: 'en-GB-SoniaNeural',        // 自然女声
  }
} as const;

export const DEFAULT_TTS_CONFIG = {
  voice: TTS_VOICES.US.MALE,
  rate: 1.0,
  volume: 1.0,
  pitch: 1.0,
  loopMode: 'none',
  loopCount: 1,
  // 不同场景的默认配置
  article: {
    rate: 1.0,
    voice: TTS_VOICES.US.MALE,
  },
  sentence: {
    rate: 0.9,
    voice: TTS_VOICES.US.FEMALE,
  },
  word: {
    rate: 0.8,
    voice: TTS_VOICES.US.MALE,
  }
} as const;

// TTS错误消息
export const TTS_ERRORS = {
  INITIALIZATION: 'Failed to initialize TTS service',
  UNSUPPORTED: 'TTS is not supported in this environment',
  INVALID_VOICE: 'Invalid voice selection',
  NETWORK: 'Network error occurred while fetching TTS audio',
  PLAYBACK: 'Error occurred during audio playback',
} as const;
