import { useEffect } from 'react';
import { useTTS } from '@/contexts/TTSContext';

export function useTextSelection() {
  const { setSelectedText } = useTTS();

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection) {
        const selectedText = selection.toString().trim();
        setSelectedText(selectedText);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [setSelectedText]);
}
