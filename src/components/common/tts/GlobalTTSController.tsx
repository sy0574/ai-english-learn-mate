import React from 'react';
import TTSController from './TTSController';
import { useTTS } from '@/contexts/TTSContext';

/**
 * 全局 TTS 控制器组件
 * 用于监听全局文本选择并提供 TTS 功能
 * 
 * @example
 * // 在应用根组件中使用
 * <GlobalTTSController />
 */
export function GlobalTTSController() {
  const { selectedText } = useTTS();

  if (!selectedText) {
    return null;
  }

  return (
    <TTSController
      text={selectedText}
      position="fixed"
      showSettings={true}
    />
  );
} 