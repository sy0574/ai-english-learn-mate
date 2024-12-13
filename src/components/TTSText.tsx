import React, { useEffect, useRef } from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';

interface TTSTextProps {
  text: string;
  id: string;
  isPlaying: boolean;
}

const TextSpan = styled.span<{ isPlaying: boolean }>`
  display: inline-block;
  padding: 2px 4px;
  margin: 2px;
  border-radius: 4px;
  line-height: 1.6;
  transition: transform 0.12s cubic-bezier(0.2, 0, 0, 1),
              background-color 0.12s cubic-bezier(0.2, 0, 0, 1);
  transform-origin: center;
  position: relative;
  z-index: ${({ isPlaying }) => isPlaying ? 1 : 'auto'};
  will-change: transform, background-color;
  backface-visibility: hidden;
  -webkit-font-smoothing: antialiased;

  ${({ isPlaying }) => isPlaying && css`
    background-color: var(--tts-highlight-color, #ffd700);
    transform: scale(var(--tts-font-size-scale, 1.2));
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  `}
`;

export const TTSText: React.FC<TTSTextProps> = ({ text, id, isPlaying }) => {
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isPlaying && spanRef.current) {
      // Force browser to acknowledge the state change immediately
      spanRef.current.style.transform = `scale(${isPlaying ? 'var(--tts-font-size-scale, 1.2)' : '1'})`;
      spanRef.current.style.backgroundColor = 'var(--tts-highlight-color, #ffd700)';
    }
  }, [isPlaying]);

  return (
    <TextSpan
      ref={spanRef}
      isPlaying={isPlaying}
      data-id={id}
      style={{
        transform: `scale(${isPlaying ? 'var(--tts-font-size-scale, 1.2)' : '1'})`,
      }}
    >
      {text}
    </TextSpan>
  );
};
