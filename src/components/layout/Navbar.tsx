import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SubscriptionManager } from '@/lib/api/subscriptionManager';
import { PRICING_PLANS } from '@/lib/types/subscription';

export default function Navbar() {
  const currentTier = SubscriptionManager.getInstance().getCurrentTier();
  const currentPlan = PRICING_PLANS[currentTier];

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold">
              AI智学
            </Link>
            <div className="ml-10 flex items-center space-x-4">
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/member-center">
              <Button variant="outline" className="gap-2">
                <Crown className="w-4 h-4" />
                <span>{currentPlan.name}</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
