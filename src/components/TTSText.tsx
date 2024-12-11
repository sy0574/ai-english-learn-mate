import React, { useEffect } from 'react';
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
  transition: all 0.3s ease-in-out;
  transform-origin: center;
  position: relative;
  z-index: ${({ isPlaying }) => isPlaying ? 1 : 'auto'};

  ${({ isPlaying }) => isPlaying && css`
    background-color: var(--tts-highlight-color, #ffd700);
    transform: scale(var(--tts-font-size-scale, 1.2));
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  `}
`;

export const TTSText: React.FC<TTSTextProps> = ({ text, id, isPlaying }) => {
  useEffect(() => {
    if (isPlaying) {
      console.log(`TTSText [${id}] is now playing`);
    }
  }, [isPlaying, id]);

  console.log(`TTSText rendering: id=${id}, isPlaying=${isPlaying}`);

  return (
    <TextSpan
      isPlaying={isPlaying}
      data-id={id}
    >
      {text}
    </TextSpan>
  );
};
