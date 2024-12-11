import { useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CollapsibleContainerProps {
  children: ReactNode;
  className?: string;
}

export default function CollapsibleContainer({ 
  children,
  className 
}: CollapsibleContainerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={cn(
      'w-[600px] transition-all duration-300 ease-in-out',
      isCollapsed ? 'w-0' : '',
      className
    )}>
      <div className="relative h-full">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'absolute right-2 top-4 h-8 w-8',
            'hover:bg-accent hover:text-accent-foreground',
            'rounded-full border border-input bg-background',
            'shadow-sm z-10'
          )}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
        <div className={cn(
          'h-full transition-all duration-300 overflow-hidden',
          isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-full'
        )}>
          {children}
        </div>
      </div>
    </div>
  );
}
