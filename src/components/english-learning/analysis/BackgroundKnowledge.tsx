import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface BackgroundKnowledgeProps {
  backgroundKnowledge?: Array<{
    topic: string;
    description: string;
    relevance: string;
  }>;
}

export default function BackgroundKnowledge({
  backgroundKnowledge = []
}: BackgroundKnowledgeProps) {
  return (
    <Card className="p-4">
      <h4 className="font-medium mb-3">背景知识</h4>
      {backgroundKnowledge.length > 0 ? (
        <ScrollArea className="h-[400px]">
          <Accordion type="single" collapsible className="space-y-2">
            {backgroundKnowledge.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-sm hover:no-underline">
                  {item.topic}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 p-3 bg-secondary rounded-lg text-sm">
                    <p>{item.description}</p>
                    <p className="text-primary">相关性：{item.relevance}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          暂无背景知识数据
        </div>
      )}
    </Card>
  );
}