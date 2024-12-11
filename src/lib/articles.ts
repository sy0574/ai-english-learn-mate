import { useState, useEffect } from 'react';
import { Article } from '@/types/article';
import { supabase } from './supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { toast } from 'sonner';

// UUID v4 generation function
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const _STORAGE_KEY = 'english-learning-articles';
const DEFAULT_ARTICLES: Article[] = [
  {
    id: uuidv4(),
    title: 'Running from Your Protector: The Coffee Tree\'s Paradox',
    content: `I'll help translate this interesting text about coffee from a botanical perspective...`,
    difficulty: 'advanced',
    tags: ['science', 'coffee', 'dopamine', 'survival', 'plant biology'],
    readingTime: 3,
    createdAt: new Date().toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&auto=format&fit=crop'
  },
  {
    id: uuidv4(),
    title: 'DNA repair process key to memory formation',
    content: `In a recent study published in the journal Nature, researchers found...`,
    difficulty: 'advanced',
    tags: ['DNA', 'memory', 'biology'],
    readingTime: 5,
    createdAt: new Date().toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop'
  }
];

const RETRY_DELAY = 2000; // 2 seconds
const MAX_RETRIES = 3;

async function loadArticles(userId: string | undefined, retryCount = 0): Promise<Article[]> {
  try {
    if (!userId) {
      console.log('No user ID provided, using default articles');
      return DEFAULT_ARTICLES;
    }

    const { data: articles, error } = await supabase
      .from('articles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      // Network error - attempt retry
      if (error.message?.includes('fetch') && retryCount < MAX_RETRIES) {
        console.log(`Retrying fetch attempt ${retryCount + 1} of ${MAX_RETRIES}...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return loadArticles(userId, retryCount + 1);
      }
      
      throw error;
    }

    if (!articles) {
      console.log('No articles data returned from Supabase');
      return DEFAULT_ARTICLES;
    }

    return articles.map(article => ({
      id: article.id,
      title: article.title,
      content: article.content,
      difficulty: article.difficulty,
      tags: article.tags || [],
      readingTime: article.reading_time,
      createdAt: article.created_at,
      imageUrl: article.image_url
    }));
  } catch (error) {
    console.error('Error in loadArticles:', error);
    
    // Show user-friendly error message
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        toast.error('网络连接失败，已加载默认文章供您阅读');
      } else {
        toast.error('加载文章失败，已显示默认文章');
      }
    }
    
    return DEFAULT_ARTICLES;
  }
}

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await loadArticles(user?.id);
      setArticles(data);
    } catch (err) {
      console.error('Error in useArticles:', err);
      setError('无法连接到服务器，已加载默认文章供您阅读');
      setArticles(DEFAULT_ARTICLES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let retryTimeout: NodeJS.Timeout;

    if (isMounted) {
      fetchArticles();
    }

    return () => {
      isMounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [user?.id]);

  const saveArticle = async (article: Omit<Article, 'id' | 'createdAt'>) => {
    try {
      if (!user?.id) {
        throw new Error('用户未登录');
      }

      const newArticle = {
        ...article,
        id: uuidv4(),
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('articles')
        .insert([{
          id: newArticle.id,
          user_id: user.id,
          title: newArticle.title,
          content: newArticle.content,
          difficulty: newArticle.difficulty,
          tags: newArticle.tags,
          reading_time: newArticle.readingTime,
          image_url: newArticle.imageUrl,
          created_at: newArticle.created_at
        }]);

      if (error) {
        console.error('Error saving to Supabase:', error);
        toast.error('保存到云端失败，但文章已保存在本地');
        return false;
      }

      // 保存成功后重新获取文章列表
      await fetchArticles();
      
      toast.success('文章保存成功');
      return true;
    } catch (error) {
      console.error('Error saving article:', error);
      toast.error('保存文章失败，请重试');
      return false;
    }
  };

  const deleteArticle = async (articleId: string) => {
    try {
      if (!user?.id) {
        throw new Error('用户未登录');
      }

      // Optimistically update UI
      setArticles(prev => prev.filter(article => article.id !== articleId));

      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleId)
        .eq('user_id', user.id);

      if (error) {
        // Revert on error
        const data = await loadArticles(user.id);
        setArticles(data);
        throw error;
      }

      toast.success('文章已删除');
      return true;
    } catch (error) {
      console.error('Error deleting article:', error);
      toast.error('删除文章失败，请重试');
      return false;
    }
  };

  const updateArticle = async (updatedArticle: Article) => {
    try {
      if (!user?.id) {
        throw new Error('用户未登录');
      }

      // Optimistically update UI
      setArticles(prev => prev.map(article => 
        article.id === updatedArticle.id ? updatedArticle : article
      ));

      const { error } = await supabase
        .from('articles')
        .update({
          title: updatedArticle.title,
          content: updatedArticle.content,
          difficulty: updatedArticle.difficulty,
          tags: updatedArticle.tags,
          reading_time: updatedArticle.readingTime,
          image_url: updatedArticle.imageUrl || null
        })
        .eq('id', updatedArticle.id)
        .eq('user_id', user.id);

      if (error) {
        // Revert on error
        console.error('Error updating article:', error);
        const data = await loadArticles(user.id);
        setArticles(data);
        throw error;
      }

      toast.success('文章更新成功');
      return true;
    } catch (error) {
      console.error('Error updating article:', error);
      toast.error('更新文章失败，请重试');
      return false;
    }
  };

  return {
    articles,
    loading,
    error,
    saveArticle,
    deleteArticle,
    updateArticle
  };
}