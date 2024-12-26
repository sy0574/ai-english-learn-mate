import { useState, useEffect } from 'react';
import type { Article } from '@/types/article';
import type { AIAnalysisResult } from '@/lib/api/types';
import { useArticles } from '@/lib/articles';
import { analyzeArticle } from '@/lib/articleAnalysis';
import { toast } from 'sonner';
import { useCourseStore } from '@/stores/courseStore';
import ReadingSection from './reading/ReadingSection';
import AnalysisSection from './reading/AnalysisSection';
import CollapsibleContainer from './reading/CollapsibleContainer';

export default function EnglishLearningSystem() {
  const [selectedWord, setSelectedWord] = useState<string>();
  const [selectedSentence, setSelectedSentence] = useState<string>();
  const { articles, loading, addArticle } = useArticles();
  
  const { 
    aiGeneratedContent,
    setAiGeneratedContent,
    selectedArticle,
    setSelectedArticle,
  } = useCourseStore();

  useEffect(() => {
    if (!loading && articles.length > 0 && !selectedArticle) {
      setSelectedArticle(articles[0]);
    }
  }, [loading, articles, selectedArticle, setSelectedArticle]);

  const analysis = selectedArticle ? analyzeArticle(selectedArticle.content) : null;
  const aiAnalysis = selectedArticle ? aiGeneratedContent[selectedArticle.id] as AIAnalysisResult : null;

  const handleArticleUpload = async (articleData: Omit<Article, 'id' | 'createdAt'>) => {
    const newArticle: Article = {
      ...articleData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    const success = await addArticle(articleData);
    if (success) {
      setSelectedArticle(newArticle);
      toast.success('添加成功');
    } else {
      toast.error('添加失败');
    }
  };

  const handleAiAnalysisComplete = (result: AIAnalysisResult) => {
    if (selectedArticle) {
      setAiGeneratedContent(selectedArticle.id, result);
    }
  };

  const handleWordSelect = (word: string) => {
    setSelectedWord(word);
  };

  const handleSentenceSelect = (sentence: string) => {
    setSelectedSentence(sentence);
  };

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden flex bg-background">
      <div className="flex-1 flex gap-3 p-4"> 
        <CollapsibleContainer direction="left" className="w-[700px]">
          <div className="flex-1 min-w-0 h-full">
            <ReadingSection 
              currentArticle={selectedArticle}
              onArticleUpload={handleArticleUpload}
              onWordSelect={handleWordSelect}
              onSentenceSelect={handleSentenceSelect}
              selectedSentence={selectedSentence}
            />
          </div>
        </CollapsibleContainer>
        <AnalysisSection 
          selectedText={selectedArticle?.content || ''}
          analysis={analysis}
          aiAnalysis={aiAnalysis}
          onAiAnalysisComplete={handleAiAnalysisComplete}
          selectedWord={selectedWord}
          selectedSentence={selectedSentence}
        />
      </div>
    </div>
  );
}