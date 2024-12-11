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
  },
  // 澳大利亚英语
  AU: {
    MALE: 'en-AU-WilliamNeural',        // 成熟男声
    FEMALE: 'en-AU-NatashaNeural',      // 自然女声
    FEMALE_CASUAL: 'en-AU-AnnetteNeural', // 随意女声
  },
  // 加拿大英语
  CA: {
    MALE: 'en-CA-LiamNeural',           // 成熟男声
    FEMALE: 'en-CA-ClaraNeural',        // 自然女声
  },
  // 新加坡英语
  SG: {
    MALE: 'en-SG-WayneNeural',          // 成熟男声
    FEMALE: 'en-SG-LunaNeural',         // 自然女声
  },
  // 印度英语
  IN: {
    MALE: 'en-IN-PrabhatNeural',        // 成熟男声
    FEMALE: 'en-IN-NeerjaNeural',       // 自然女声
  },
  // 日语
  JP: {
    MALE: 'ja-JP-KeitaNeural',          // 成熟男声
    FEMALE: 'ja-JP-NanamiNeural',       // 自然女声
    MALE_CASUAL: 'ja-JP-DaichiNeural',  // 随意男声
    FEMALE_CASUAL: 'ja-JP-AoiNeural',   // 随意女声
  },
  // 韩语
  KR: {
    MALE: 'ko-KR-InJoonNeural',         // 成熟男声
    FEMALE: 'ko-KR-SunHiNeural',        // 自然女声
    MALE_CASUAL: 'ko-KR-BongJinNeural', // 随意男声
    FEMALE_CASUAL: 'ko-KR-JiMinNeural', // 随意女声
  },
  // 中文（普通话）
  CN: {
    MALE: 'zh-CN-YunxiNeural',          // 成熟男声
    FEMALE: 'zh-CN-XiaoxiaoNeural',     // 自然女声
    MALE_CASUAL: 'zh-CN-YunfengNeural', // 随意男声
    FEMALE_CASUAL: 'zh-CN-XiaoyiNeural', // 随意女声
  }
} as const;

// 导出用于UI选择的voice选项
export const VOICES = [
  // 美式英语
  { value: TTS_VOICES.US.MALE, label: 'US Male (Christopher)' },
  { value: TTS_VOICES.US.FEMALE, label: 'US Female (Jenny)' },
  { value: TTS_VOICES.US.MALE_CASUAL, label: 'US Male Casual (Guy)' },
  { value: TTS_VOICES.US.FEMALE_CASUAL, label: 'US Female Casual (Aria)' },
  // 英式英语
  { value: TTS_VOICES.GB.MALE, label: 'GB Male (Ryan)' },
  { value: TTS_VOICES.GB.FEMALE, label: 'GB Female (Sonia)' },
  // 澳大利亚英语
  { value: TTS_VOICES.AU.MALE, label: 'AU Male (William)' },
  { value: TTS_VOICES.AU.FEMALE, label: 'AU Female (Natasha)' },
  // 加拿大英语
  { value: TTS_VOICES.CA.MALE, label: 'CA Male (Liam)' },
  { value: TTS_VOICES.CA.FEMALE, label: 'CA Female (Clara)' },
  // 新加坡英语
  { value: TTS_VOICES.SG.MALE, label: 'SG Male (Wayne)' },
  { value: TTS_VOICES.SG.FEMALE, label: 'SG Female (Luna)' },
  // 印度英语
  { value: TTS_VOICES.IN.MALE, label: 'IN Male (Prabhat)' },
  { value: TTS_VOICES.IN.FEMALE, label: 'IN Female (Neerja)' },
  // 日语
  { value: TTS_VOICES.JP.MALE, label: 'JP Male (Keita)' },
  { value: TTS_VOICES.JP.FEMALE, label: 'JP Female (Nanami)' },
  // 韩语
  { value: TTS_VOICES.KR.MALE, label: 'KR Male (InJoon)' },
  { value: TTS_VOICES.KR.FEMALE, label: 'KR Female (SunHi)' },
  // 中文
  { value: TTS_VOICES.CN.MALE, label: 'CN Male (云希)' },
  { value: TTS_VOICES.CN.FEMALE, label: 'CN Female (晓晓)' },
  { value: TTS_VOICES.CN.MALE_CASUAL, label: 'CN Male Casual (云枫)' },
  { value: TTS_VOICES.CN.FEMALE_CASUAL, label: 'CN Female Casual (晓伊)' },
] as const;

export const DEFAULT_TTS_CONFIG = {
  voice: TTS_VOICES.US.MALE,
  rate: 1.0,
  volume: 1.0,
  pitch: 1.0,
  loopCount: 1,
  highlightFontSize: 'lg', // 新增：高亮文本的字号大小，可选值：'base'|'lg'|'xl'|'2xl'
  fontSizeScale: 2.6, // 修改：播放句子的字号缩放比例默认值为2.6（260%）
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
