import { useState, useEffect } from 'react';
import { SubscriptionTier } from '@/lib/types/subscription';
import { SubscriptionManager } from '@/lib/api/subscriptionManager';

export function useSubscription() {
  const [currentTier, setCurrentTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSubscription = async () => {
      try {
        const tier = await SubscriptionManager.getInstance().getCurrentTier();
        setCurrentTier(tier);
      } catch (error) {
        console.error('Failed to load subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSubscription();
  }, []);

  const updateTier = async (newTier: SubscriptionTier) => {
    try {
      await SubscriptionManager.getInstance().upgradeTier(newTier);
      setCurrentTier(newTier);
      return true;
    } catch (error) {
      console.error('Failed to update subscription:', error);
      return false;
    }
  };

  return {
    currentTier,
    loading,
    updateTier,
  };
} 