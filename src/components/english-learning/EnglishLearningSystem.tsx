import { useState } from 'react';
import { Book, Library } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Article } from '@/types/article';
import type { AIAnalysisResult } from '@/lib/api/types';
import { useArticles } from '@/lib/articles';
import { analyzeArticle } from '@/lib/articleAnalysis';
import { toast } from 'sonner';
import { useCourseStore } from '@/stores/courseStore';
import ReadingSection from './reading/ReadingSection';
import AnalysisSection from './reading/AnalysisSection';
import ReadingLibrary from './reading/ReadingLibrary';

export default function EnglishLearningSystem() {
  const [selectedWord, setSelectedWord] = useState<string>();
  const [selectedSentence, setSelectedSentence] = useState<string>();
  const { saveArticle } = useArticles();
  
  const { 
    aiGeneratedContent,
    setAiGeneratedContent,
    selectedArticle,
    setSelectedArticle,
    activeTab,
    setActiveTab,
  } = useCourseStore();

  const analysis = selectedArticle ? analyzeArticle(selectedArticle.content) : null;
  const aiAnalysis = selectedArticle ? aiGeneratedContent[selectedArticle.id] as AIAnalysisResult : null;

  const handleArticleUpload = async (articleData: Omit<Article, 'id' | 'createdAt'>) => {
    const newArticle: Article = {
      ...articleData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    const success = await saveArticle(newArticle);
    if (success) {
      setSelectedArticle(newArticle);
      toast.success('添加成功');
    } else {
      toast.error('添加失败');
    }
  };

  const handleArticleSelect = (article: Article) => {
    setSelectedArticle(article);
    setActiveTab('reading');
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
    <div className="h-[calc(100vh-4rem)] overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="px-4 sm:px-6 lg:px-8 border-b">
          <TabsList className="w-full justify-start bg-transparent">
            <TabsTrigger 
              value="reading" 
              className="data-[state=active]:text-primary data-[state=active]:border-b-2 
                         data-[state=active]:border-primary rounded-none px-6"
            >
              <Book className="w-4 h-4 mr-2" />
              深度学习
            </TabsTrigger>
            <TabsTrigger 
              value="library"
              className="data-[state=active]:text-primary data-[state=active]:border-b-2 
                         data-[state=active]:border-primary rounded-none px-6"
            >
              <Library className="w-4 h-4 mr-2" />
              知识文库
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="reading" className="flex-1 overflow-hidden p-4 sm:p-6 lg:p-8">
          <div className="h-full flex gap-6">
            <div className="flex-1 min-w-0">
              <ReadingSection 
                currentArticle={selectedArticle}
                onArticleUpload={handleArticleUpload}
                onAnalysisComplete={() => {}}
                onWordSelect={handleWordSelect}
                onSentenceSelect={handleSentenceSelect}
                selectedSentence={selectedSentence}
              />
            </div>
            <AnalysisSection 
              selectedText={selectedArticle?.content || ''}
              analysis={analysis}
              aiAnalysis={aiAnalysis}
              onAiAnalysisComplete={handleAiAnalysisComplete}
              selectedWord={selectedWord}
              selectedSentence={selectedSentence}
            />
          </div>
        </TabsContent>

        <TabsContent value="library" className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <ReadingLibrary onSelectReading={handleArticleSelect} />
        </TabsContent>
      </Tabs>
    </div>
  );
}