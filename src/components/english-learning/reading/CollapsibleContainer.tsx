import { useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CollapsibleContainerProps {
  children: ReactNode;
  className?: string;
  direction?: 'left' | 'right';
}

export default function CollapsibleContainer({ 
  children,
  className,
  direction = 'right'
}: CollapsibleContainerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getChevronIcon = () => {
    if (direction === 'right') {
      return isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />;
    }
    return isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />;
  };

  return (
    <div className={cn(
      'transition-all duration-300 ease-in-out relative h-full',
      {
        'w-12': isCollapsed,
        'w-[700px]': !isCollapsed && !className,
        'ml-auto': direction === 'right'
      },
      className
    )}>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'absolute h-7 w-7 top-9',// 通过top 值来控制箭头按钮的垂直位置
          direction === 'right' 
            ? (isCollapsed ? '-right-10' : 'left-0.5')
            : (isCollapsed ? '-left-10' : 'right-0.5'),
          'hover:bg-accent hover:text-accent-foreground',
          'rounded-full border border-input bg-background',
          'shadow-sm z-10'
        )}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {getChevronIcon()}
      </Button>
      <div className={cn(
        'h-full transition-all duration-300 overflow-hidden',
        isCollapsed ? 'invisible w-0' : 'visible w-full'
      )}>
        {children}
      </div>
    </div>
  );
}
