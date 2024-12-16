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
    title: 'The Science of Learning: How Our Brain Processes New Information',
    content: `Learning a new language is one of the most fascinating journeys our brain can undertake. When we encounter new information, our brain creates neural pathways, connecting new knowledge with existing memories and experiences.

The process involves several key areas of the brain:
1. The prefrontal cortex helps with attention and decision-making
2. The hippocampus plays a crucial role in forming new memories
3. The temporal lobe assists with language processing
4. The amygdala connects emotions with learning experiences

Research shows that active learning - where we engage with the material through reading, speaking, and writing - creates stronger neural connections than passive learning. This is why interactive language learning is often more effective than simply memorizing vocabulary lists.

Tips for effective language learning:
• Practice regularly, even if just for 15 minutes a day
• Combine different learning methods (reading, listening, speaking)
• Connect new words with images or personal experiences
• Use the language in real-world contexts
• Get enough sleep to consolidate your learning

Remember: Every time you practice, you're literally rewiring your brain for success!`,
    difficulty: 'intermediate',
    tags: ['learning', 'neuroscience', 'study tips', 'brain', 'education'],
    readingTime: 4,
    createdAt: new Date().toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&auto=format&fit=crop',
    isDefault: true
  },
  {
    id: uuidv4(),
    title: 'The Art of Effective Communication',
    content: `Communication is more than just exchanging words - it's about connecting with others and sharing understanding. Whether you're learning a new language or improving your native speaking skills, effective communication is essential for success.

Key Elements of Communication:
1. Clarity - Express your thoughts precisely
2. Active Listening - Pay attention to both words and non-verbal cues
3. Empathy - Understand the perspective of others
4. Feedback - Ensure your message is understood correctly

Common Communication Challenges:
• Language barriers
• Cultural differences
• Emotional states
• Environmental distractions

Tips for Better Communication:
- Start with simple, clear sentences
- Use appropriate body language
- Practice active listening
- Ask questions when unsure
- Be patient with yourself and others

Remember: Good communication is a skill that improves with practice. Every conversation is an opportunity to learn and grow.`,
    difficulty: 'beginner',
    tags: ['communication', 'language', 'speaking', 'listening', 'social skills'],
    readingTime: 3,
    createdAt: new Date().toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&auto=format&fit=crop',
    isDefault: true
  },
  {
    id: uuidv4(),
    title: 'The Future of Language Learning: AI and Technology',
    content: `As we move further into the digital age, artificial intelligence (AI) and advanced technology are revolutionizing how we learn languages. These innovations are making language learning more personalized, efficient, and accessible than ever before.

Key Technological Advances:
1. Natural Language Processing (NLP)
- Improved speech recognition
- Real-time translation
- Grammar correction algorithms

2. Adaptive Learning Systems
- Personalized learning paths
- Progress tracking
- Intelligent feedback

3. Virtual and Augmented Reality
- Immersive learning environments
- Real-world simulation
- Interactive practice scenarios

The Impact on Language Learning:
• Immediate feedback on pronunciation
• Customized learning pace
• Access to native speakers worldwide
• Gamification of learning process
• 24/7 learning opportunities

Challenges and Considerations:
- Balance between tech and human interaction
- Digital literacy requirements
- Privacy and data security
- Quality of AI-generated content

The future of language learning will likely combine the best of human teaching with AI assistance, creating a more effective and engaging learning experience for everyone.`,
    difficulty: 'advanced',
    tags: ['technology', 'AI', 'future', 'education', 'innovation'],
    readingTime: 5,
    createdAt: new Date().toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop',
    isDefault: true
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

    const { data: userArticles, error } = await supabase
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

    if (!userArticles || userArticles.length === 0) {
      console.log('No user articles found, using default articles');
      return DEFAULT_ARTICLES;
    }

    // 合并用户文章和示例文章
    const mappedUserArticles = userArticles.map(article => ({
      id: article.id,
      title: article.title,
      content: article.content,
      difficulty: article.difficulty,
      tags: article.tags || [],
      readingTime: article.reading_time,
      createdAt: article.created_at,
      imageUrl: article.image_url,
      isDefault: false
    }));

    // 将示例文章添加到用户文章列表的末尾
    return [...mappedUserArticles, ...DEFAULT_ARTICLES];

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

  const addArticle = async (article: Omit<Article, 'id' | 'createdAt'>) => {
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
      
      toast.success('文章添加成功');
      return true;
    } catch (error) {
      console.error('Error adding article:', error);
      toast.error('添加文章失败��请重试');
      return false;
    }
  };

  const deleteArticle = async (articleId: string) => {
    try {
      // 检查是否为示例文章
      const articleToDelete = articles.find(article => article.id === articleId);
      if (articleToDelete?.isDefault) {
        toast.error('示例文章不能删除');
        return false;
      }

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
      // 检查是否为示例文章
      const articleToUpdate = articles.find(article => article.id === updatedArticle.id);
      if (articleToUpdate?.isDefault) {
        toast.error('示例文章不能修改');
        return false;
      }

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
    addArticle,
    deleteArticle,
    updateArticle
  };
}