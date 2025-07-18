
import React from 'react';
import { Handle, Position } from 'reactflow';

const nodeStyle = {
  padding: '15px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  background: '#fff',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  minWidth: '180px',
  fontFamily: 'sans-serif',
  fontSize: '14px',
};

const headerStyle = {
  fontWeight: 'bold',
  paddingBottom: '10px',
  marginBottom: '10px',
  borderBottom: '1px solid #eee',
};

const contentStyle = {
  color: '#555',
};

// Generic Node Structure
const CustomNode = ({ data, type, children }) => {
  return (
    <div style={{ ...nodeStyle, borderLeft: `5px solid ${data.color || '#3B82F6'}` }}>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <div style={headerStyle}>{data.label || `${type} Node`}</div>
      <div style={contentStyle}>{children}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </div>
  );
};

// Specific Node Implementations
export const LlmNode = ({ data }) => (
  <CustomNode data={{...data, color: '#8B5CF6'}} type="LLM">
    {data.model || 'GPT-4'}
  </CustomNode>
);

export const ToolNode = ({ data }) => (
  <CustomNode data={{...data, color: '#10B981'}} type="Tool">
    {data.tool || 'Select a tool'}
  </CustomNode>
);

export const ConditionNode = ({ data }) => (
  <CustomNode data={{...data, color: '#F59E0B'}} type="Condition">
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>True</span>
        <Handle type="source" position={Position.Right} id="true" style={{ background: '#22C55E', top: '50%' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>False</span>
        <Handle type="source" position={Position.Right} id="false" style={{ background: '#EF4444', top: '75%' }} />
      </div>
    </div>
  </CustomNode>
);

export const OutputNode = ({ data }) => (
  <CustomNode data={{...data, color: '#6B7280'}} type="Output">
    {data.outputVar || 'End of workflow'}
  </CustomNode>
);
