
import React from 'react';
import { Handle, Position } from 'reactflow';
import { Bot, Cog, GitBranch, MessageSquare, Ear, HelpCircle } from 'lucide-react'; // Import HelpCircle icon

// ... (Keep existing LlmNode, ToolNode, ConditionNode, OutputNode, StartNode, ListenNode components as they are)

export const LlmNode = ({ data }) => (
  <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', background: '#eef' }}>
    <Handle type="target" position={Position.Top} />
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Bot size={16} style={{ marginRight: '5px' }} />
      <strong>{data.label}</strong>
    </div>
    <Handle type="source" position={Position.Bottom} id="output" />
  </div>
);

export const ToolNode = ({ data }) => (
  <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', background: '#efe' }}>
    <Handle type="target" position={Position.Top} />
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Cog size={16} style={{ marginRight: '5px' }} />
      <strong>{data.label}</strong>
    </div>
    <Handle type="source" position={Position.Bottom} id="output" />
  </div>
);

export const ConditionNode = ({ data }) => (
  <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', background: '#fee' }}>
    <Handle type="target" position={Position.Top} />
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <GitBranch size={16} style={{ marginRight: '5px' }} />
      <strong>{data.label}</strong>
    </div>
    <Handle type="source" position={Position.Bottom} id="true" style={{ left: '25%' }} />
    <Handle type="source" position={Position.Bottom} id="false" style={{ left: '75%' }} />
  </div>
);

export const OutputNode = ({ data }) => (
  <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', background: '#ffe' }}>
    <Handle type="target" position={Position.Top} />
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <MessageSquare size={16} style={{ marginRight: '5px' }} />
      <strong>{data.label}</strong>
    </div>
  </div>
);

export const StartNode = ({ data }) => (
    <div style={{ padding: '10px 20px', border: '2px dashed #aaa', borderRadius: '50px', background: '#fafafa' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <strong>{data.label}</strong>
      </div>
      <Handle type="source" position={Position.Bottom} id="output" />
    </div>
);

export const ListenNode = ({ data }) => (
  <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', background: '#E6F7FF' }}>
    <Handle type="target" position={Position.Top} />
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Ear size={16} style={{ marginRight: '5px' }} />
      <strong>{data.label || 'Listen for Input'}</strong>
    </div>
    <div style={{ fontSize: '12px', color: '#555', marginTop: '5px' }}>
      Pauses for user input
    </div>
    <Handle type="source" position={Position.Bottom} id="output" />
  </div>
);

export const PromptNode = ({ data }) => (
  <div style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '5px', background: '#FFFBE6' }}>
    <Handle type="target" position={Position.Top} />
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <HelpCircle size={16} style={{ marginRight: '5px' }} />
      <strong>{data.label || 'Prompt for Input'}</strong>
    </div>
    <div style={{ fontSize: '12px', color: '#555', marginTop: '5px' }}>
      Asks user a question and waits
    </div>
    <Handle type="source" position={Position.Bottom} id="output" />
  </div>
);
