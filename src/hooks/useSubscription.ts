import { useState, useEffect, useCallback } from 'react';
import { SubscriptionTier } from '@/lib/types/subscription';
import { SubscriptionManager } from '@/lib/api/subscriptionManager';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';

export function useSubscription() {
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Function to update subscription state
  const updateSubscriptionState = useCallback(async (tier: SubscriptionTier) => {
    console.log('=== UPDATING SUBSCRIPTION STATE ===', tier);
    console.log('Current user:', user?.id);
    
    setCurrentTier(tier);
    localStorage.setItem('subscription_tier', tier);
    
    if (user?.id) {
      const manager = SubscriptionManager.getInstance();
      await manager.initialize(user.id);
      // Force a refresh of the subscription data
      const currentTier = await manager.getCurrentTier();
      if (currentTier !== tier) {
        console.log('Subscription state mismatch, updating to:', currentTier);
        setCurrentTier(currentTier);
        localStorage.setItem('subscription_tier', currentTier);
      }
    }
  }, [user]);

  // Load initial subscription
  useEffect(() => {
    const loadSubscription = async () => {
      if (!user?.id) {
        setCurrentTier('free');
        setLoading(false);
        return;
      }

      try {
        console.log('=== LOADING SUBSCRIPTION ===');
        const manager = SubscriptionManager.getInstance();
        await manager.initialize(user.id);
        const tier = await manager.getCurrentTier();
        console.log('Current tier:', tier);
        await updateSubscriptionState(tier);
      } catch (error) {
        console.error('Failed to load subscription:', error);
        setCurrentTier('free');
      } finally {
        setLoading(false);
      }
    };

    loadSubscription();
  }, [user?.id, updateSubscriptionState]);

  // Subscribe to subscription changes
  useEffect(() => {
    if (!user?.id) return;

    console.log('=== SETTING UP SUBSCRIPTION LISTENERS ===');
    console.log('User ID:', user.id);

    // Listen for direct subscription updates
    const subscriptionChannel = supabase
      .channel('user-subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('=== SUBSCRIPTION CHANGE DETECTED ===', payload);
          if (payload.new) {
            await updateSubscriptionState(payload.new.tier as SubscriptionTier);
          }
        }
      )
      .subscribe();

    // Listen for subscription update notifications
    const updatesChannel = supabase
      .channel('subscription-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'subscription_updates',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('=== SUBSCRIPTION UPDATE NOTIFICATION ===', payload);
          if (payload.new) {
            await updateSubscriptionState(payload.new.tier as SubscriptionTier);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('=== CLEANING UP SUBSCRIPTION LISTENERS ===');
      subscriptionChannel.unsubscribe();
      updatesChannel.unsubscribe();
    };
  }, [user?.id, updateSubscriptionState]);

  const updateTier = useCallback(async (newTier: SubscriptionTier) => {
    try {
      const manager = SubscriptionManager.getInstance();
      await manager.upgradeTier(newTier);
      await updateSubscriptionState(newTier);
      return true;
    } catch (error) {
      console.error('Failed to update subscription:', error);
      return false;
    }
  }, [updateSubscriptionState]);

  return {
    currentTier,
    loading,
    updateTier,
  };
} 