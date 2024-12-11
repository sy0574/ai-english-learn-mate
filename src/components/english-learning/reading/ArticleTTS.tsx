import React, { forwardRef } from 'react';
import TTSController, { TTSControllerRef } from '@/components/common/tts/TTSController';

interface ArticleTTSProps {
  sentences: string[];
  onSentenceHighlight?: (sentence: string) => void;
}

const ArticleTTS = forwardRef<TTSControllerRef, ArticleTTSProps>(({
  sentences,
  onSentenceHighlight,
}, ref) => {
  return (
    <TTSController
      ref={ref}
      text={sentences}
      onTextHighlight={onSentenceHighlight}
      position="fixed"
      showSettings={true}
    />
  );
});

ArticleTTS.displayName = 'ArticleTTS';

export default ArticleTTS;
