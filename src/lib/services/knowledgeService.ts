import { supabase } from '@/lib/supabase';

interface KnowledgeItem {
  id: string;
  topic: string;
  description: string;
  relevance: string;
  category: string;
  created_at: string;
  updated_at: string;
}

interface UserKnowledgeItem extends KnowledgeItem {
  user_id: string;
  source?: string;
}

export class KnowledgeService {
  private static instance: KnowledgeService;

  private constructor() {}

  public static getInstance(): KnowledgeService {
    if (!KnowledgeService.instance) {
      KnowledgeService.instance = new KnowledgeService();
    }
    return KnowledgeService.instance;
  }

  /**
   * Get all knowledge items for a user
   */
  async getUserKnowledge(): Promise<UserKnowledgeItem[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_knowledge')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user knowledge:', error);
      throw error;
    }
  }

  /**
   * Add a new knowledge item for the user
   */
  async addKnowledgeItem(item: Omit<UserKnowledgeItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<UserKnowledgeItem> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_knowledge')
        .insert([
          {
            ...item,
            user_id: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to add knowledge item');

      return data;
    } catch (error) {
      console.error('Error adding knowledge item:', error);
      throw error;
    }
  }

  /**
   * Update a knowledge item
   */
  async updateKnowledgeItem(id: string, updates: Partial<Omit<UserKnowledgeItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<UserKnowledgeItem> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_knowledge')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Knowledge item not found');

      return data;
    } catch (error) {
      console.error('Error updating knowledge item:', error);
      throw error;
    }
  }

  /**
   * Delete a knowledge item
   */
  async deleteKnowledgeItem(id: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_knowledge')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting knowledge item:', error);
      throw error;
    }
  }
}

export const knowledgeService = KnowledgeService.getInstance();
