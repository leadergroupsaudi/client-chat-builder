import React from 'react';
import { Zap, BrainCircuit, Cloud, Code } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Tool, KnowledgeBase } from '@/types';

const DraggableNode = ({ type, label, icon, resourceId, toolType, mcpServerUrl }) => {
  const onDragStart = (event, nodeType, id, label, toolType, mcpServerUrl) => {
    const data = JSON.stringify({ nodeType, id, label, toolType, mcpServerUrl });
    event.dataTransfer.setData('application/reactflow', data);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="flex flex-col items-center p-4 m-2 border rounded-lg shadow-md cursor-grab bg-white hover:shadow-lg transition-shadow"
      onDragStart={(event) => onDragStart(event, type, resourceId, label, toolType, mcpServerUrl)}
      draggable
    >
      {icon}
      <span className="mt-2 font-semibold text-sm">{label}</span>
    </div>
  );
};

export const AgentComponentSidebar = () => {
  const { authFetch } = useAuth();

  const { data: tools, isLoading: isLoadingTools } = useQuery<Tool[]>({ 
    queryKey: ['tools'], 
    queryFn: async () => {
      const response = await authFetch(`/api/v1/tools/`);
      if (!response.ok) throw new Error('Failed to fetch tools');
      return response.json();
    }
  });

  const { data: knowledgeBases, isLoading: isLoadingKnowledgeBases } = useQuery<KnowledgeBase[]>({ 
    queryKey: ['knowledgeBases'], 
    queryFn: async () => {
      const response = await authFetch(`/api/v1/knowledge-bases/`);
      if (!response.ok) throw new Error('Failed to fetch knowledge bases');
      return response.json();
    }
  });

  const getToolIcon = (toolType) => {
    switch (toolType) {
      case 'mcp':
        return <Cloud className="text-blue-500" size={32} />;
      case 'custom':
        return <Code className="text-green-500" size={32} />;
      default:
        return <Zap className="text-orange-500" size={32} />;
    }
  };

  return (
    <aside className="w-64 p-4 bg-gray-50 border-r overflow-y-auto">
      <h3 className="text-lg font-bold mb-4">Components</h3>
      <div>
        <h4 className="text-md font-semibold my-2">Tools</h4>
        {isLoadingTools ? (
          <p>Loading tools...</p>
        ) : (
          tools?.map(tool => (
            <DraggableNode 
              key={`tool-${tool.id}`} 
              type="tools" 
              label={tool.name} 
              icon={getToolIcon(tool.tool_type)} 
              resourceId={tool.id} 
              toolType={tool.tool_type} 
              mcpServerUrl={tool.mcp_server_url}
            />
          ))
        )}
      </div>
      <div>
        <h4 className="text-md font-semibold my-2">Knowledge Bases</h4>
        {isLoadingKnowledgeBases ? (
          <p>Loading knowledge bases...</p>
        ) : (
          knowledgeBases?.map(kb => (
            <DraggableNode 
              key={`kb-${kb.id}`} 
              type="knowledge" 
              label={kb.name} 
              icon={<BrainCircuit className="text-indigo-500" size={32} />} 
              resourceId={kb.id} 
            />
          ))
        )}
      </div>
    </aside>
  );
};