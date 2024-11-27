import { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Node,
  Background,
  Controls,
  ConnectionMode,
  Handle,
  Position,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Minus, Edit2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { ArticleAnalysis } from '@/types/article';

interface CustomNodeProps {
  data: { label: string };
  selected: boolean;
  onEdit?: (id: string, newLabel: string) => void;
  id: string;
}

interface ArticleMindMapProps {
  analysis: ArticleAnalysis;
}

function CustomNode({ data, selected, id, onEdit }: CustomNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newLabel, setNewLabel] = useState(data.label);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onEdit) {
      onEdit(id, newLabel);
    }
    setIsEditing(false);
  };

  return (
    <div className={`
      px-4 py-2 shadow-lg rounded-lg bg-card border-2
      ${selected ? 'border-primary' : 'border-border'}
      group relative
    `}>
      <Handle type="target" position={Position.Top} className="!bg-primary" />
      {isEditing ? (
        <form onSubmit={handleSubmit} className="min-w-[120px]">
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="h-6 text-sm"
            autoFocus
            onBlur={() => setIsEditing(false)}
          />
        </form>
      ) : (
        <>
          <div className="text-sm font-medium">{data.label}</div>
          <button
            className="absolute -right-2 -top-2 hidden group-hover:flex p-1 rounded-full bg-primary text-primary-foreground"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-3 w-3" />
          </button>
        </>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-primary" />
    </div>
  );
}

const nodeTypes = {
  custom: CustomNode,
};

export default function ArticleMindMap({ analysis }: ArticleMindMapProps) {
  const initialNodes = useMemo(() => {
    const mindMapData = analysis.structure.mindMap;
    const centerX = 250;
    const centerY = 100;
    const radius = 150;

    const nodes: Node[] = mindMapData.nodes.map((node, index) => {
      const angle = (2 * Math.PI * index) / mindMapData.nodes.length;
      const x = centerX + (node.type === 'main' ? 0 : radius * Math.cos(angle));
      const y = centerY + (node.type === 'main' ? 0 : radius * Math.sin(angle));

      return {
        id: node.id,
        type: 'custom',
        data: { label: node.label },
        position: { x, y },
        className: node.type === 'main' ? 'border-primary' : 'border-secondary'
      };
    });

    return nodes;
  }, [analysis]);

  const initialEdges = useMemo(() => 
    analysis.structure.mindMap.edges.map((edge) => ({
      id: `e${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
      animated: true,
      className: 'stroke-primary',
    })),
    [analysis]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeName, setNodeName] = useState('');

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleAddNode = useCallback(() => {
    if (!nodeName) return;

    const newNode: Node = {
      id: `node-${nodes.length + 1}`,
      type: 'custom',
      data: { label: nodeName },
      position: { x: Math.random() * 300, y: Math.random() * 300 },
    };

    setNodes((nds) => [...nds, newNode]);
    setNodeName('');
  }, [nodeName, nodes.length, setNodes]);

  const handleDeleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((node) => !node.selected));
    setEdges((eds) => eds.filter((edge) => 
      !edge.selected && 
      nodes.some((node) => node.id === edge.source && !node.selected) &&
      nodes.some((node) => node.id === edge.target && !node.selected)
    ));
  }, [nodes, setNodes, setEdges]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              添加节点
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>添加新节点</DialogTitle>
            </DialogHeader>
            <div className="flex gap-2">
              <Input
                value={nodeName}
                onChange={(e) => setNodeName(e.target.value)}
                placeholder="输入节点内容"
              />
              <Button onClick={handleAddNode}>添加</Button>
            </div>
          </DialogContent>
        </Dialog>
        <Button 
          size="sm" 
          variant="destructive"
          onClick={handleDeleteSelected}
          className="gap-2"
        >
          <Minus className="h-4 w-4" />
          删除所选
        </Button>
      </div>

      <div className="w-full h-[400px] bg-secondary/30 rounded-lg">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          className="bg-secondary/30"
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          deleteKeyCode="Delete"
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}