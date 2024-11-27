import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Article } from '@/types/article'

interface CourseState {
  currentContent: string
  selectedArticle: Article | null
  aiGeneratedContent: Record<string, any>
  activeTab: string
  setCurrentContent: (content: string) => void
  setSelectedArticle: (article: Article | null) => void
  setAiGeneratedContent: (key: string, content: any) => void
  setActiveTab: (tab: string) => void
  clearContent: () => void
}

export const useCourseStore = create<CourseState>()(
  persist(
    (set) => ({
      currentContent: '',
      selectedArticle: null,
      aiGeneratedContent: {},
      activeTab: 'reading',
      setCurrentContent: (content) => set({ currentContent: content }),
      setSelectedArticle: (article) => set({ selectedArticle: article }),
      setAiGeneratedContent: (key, content) => 
        set((state) => ({
          aiGeneratedContent: {
            ...state.aiGeneratedContent,
            [key]: content
          }
        })),
      setActiveTab: (tab) => set({ activeTab: tab }),
      clearContent: () => set({ 
        currentContent: '', 
        selectedArticle: null,
        aiGeneratedContent: {},
        activeTab: 'reading'
      }),
    }),
    {
      name: 'course-storage',
    }
  )
)
