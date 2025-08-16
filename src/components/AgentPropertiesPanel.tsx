import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings, Palette, KeyRound, Trash2 } from 'lucide-react';

export const AgentPropertiesPanel = ({ agent, selectedNode, onNodeDelete }) => {
  const navigate = useNavigate();

  if (!selectedNode) {
    return (
      <div className="w-80 p-4 bg-gray-50 border-l flex items-center justify-center">
        <p className="text-gray-500">Select a node to see its properties.</p>
      </div>
    );
  }

  const handleDelete = () => {
    if (onNodeDelete && selectedNode) {
      onNodeDelete(selectedNode.id);
    }
  };

  const selectedTool = selectedNode?.type === 'tools'
    ? agent.tools.find(t => t.id === selectedNode.data.id)
    : null;

  const selectedKb = selectedNode?.type === 'knowledge'
    ? agent.knowledge_bases.find(kb => kb.id === selectedNode.data.id)
    : null;

  return (
    <aside className="w-80 p-4 bg-gray-50 border-l">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">{selectedNode.data.label}</h3>
        {(selectedNode.type === 'tools' || selectedNode.type === 'knowledge') && (
          <Button size="sm" variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {selectedNode.type === 'agent' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Agent Configuration</p>
          <Button className="w-full justify-start" variant="ghost" onClick={() => navigate(`/dashboard/builder/${agent.id}/settings`)}>
            <Settings className="mr-2" />
            Settings
          </Button>
          <Button className="w-full justify-start" variant="ghost" onClick={() => navigate('/dashboard/designer')}>
            <Palette className="mr-2" />
            Designer
          </Button>
          <Button className="w-full justify-start" variant="ghost" onClick={() => navigate(`/dashboard/builder/${agent.id}/credentials`)}>
            <KeyRound className="mr-2" />
            Credentials
          </Button>
        </div>
      )}

      {selectedTool && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold">ID</p>
            <p className="text-sm text-gray-600">{selectedTool.id}</p>
          </div>
          <div>
            <p className="text-sm font-semibold">Description</p>
            <p className="text-sm text-gray-600">{selectedTool.description}</p>
          </div>
          <div>
            <p className="text-sm font-semibold">Type</p>
            <p className="text-sm text-gray-600">{selectedTool.tool_type}</p>
          </div>
          {selectedTool.tool_type === 'custom' && selectedTool.parameters && (
            <div>
              <p className="text-sm font-semibold">Parameters</p>
              <pre className="text-xs bg-gray-100 p-2 rounded">
                {JSON.stringify(selectedTool.parameters, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {selectedKb && (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold">ID</p>
            <p className="text-sm text-gray-600">{selectedKb.id}</p>
          </div>
          <div>
            <p className="text-sm font-semibold">Description</p>
            <p className="text-sm text-gray-600">{selectedKb.description}</p>
          </div>
        </div>
      )}
    </aside>
  );
};