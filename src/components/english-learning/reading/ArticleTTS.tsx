import React, { forwardRef } from 'react';
import TTSController, { TTSControllerRef } from '@/components/common/tts/TTSController';

interface ArticleTTSProps {
  sentences: string[];
  onSentenceHighlight?: (sentence: string) => void;
  onComplete?: () => void;
}

const ArticleTTS = forwardRef<TTSControllerRef, ArticleTTSProps>(({
  sentences,
  onSentenceHighlight,
  onComplete,
}, ref) => {
  return (
    <TTSController
      ref={ref}
      text={sentences}
      onTextHighlight={onSentenceHighlight}
      onComplete={onComplete}
      position="fixed"
      showSettings={true}
    />
  );
});

ArticleTTS.displayName = 'ArticleTTS';

export default ArticleTTS;
