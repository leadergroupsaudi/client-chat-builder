import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toast } from "sonner";

import Sidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';
import CreateWorkflowDialog from './CreateWorkflowDialog';
import { LlmNode, ToolNode, ConditionNode, OutputNode } from './CustomNodes'; // Import custom nodes

const initialNodes = [
  {
    id: 'start-node',
    type: 'input',
    data: { label: 'Start' },
    position: { x: 250, y: 5 },
  },
];

const VisualWorkflowBuilder = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

  const reactFlowWrapper = useRef(null);

  // Define custom node types
  const nodeTypes = useMemo(() => ({ 
    llm: LlmNode, 
    tool: ToolNode, 
    condition: ConditionNode, 
    output: OutputNode 
  }), []);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/workflows/?company_id=1', {
        headers: { 'X-Company-ID': '1' },
      });
      if (!response.ok) throw new Error('Failed to fetch workflows');
      const data = await response.json();
      setWorkflows(data);
      if (data.length > 0) {
        handleWorkflowSelection(data[0]);
      }
    } catch (error) {
      toast.error("Failed to load workflows.");
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  // Keep selectedNode in sync with nodes array
  useEffect(() => {
    if (selectedNode) {
      const updatedSelectedNode = nodes.find(node => node.id === selectedNode.id);
      if (updatedSelectedNode && updatedSelectedNode !== selectedNode) {
        setSelectedNode(updatedSelectedNode);
      }
    }
  }, [nodes, selectedNode]);

  const handleWorkflowSelection = (workflow) => {
    setSelectedWorkflow(workflow);
    if (workflow) {
      // Prioritize visual_steps for rendering if available
      if (workflow.visual_steps) {
        try {
          const visualFlow = JSON.parse(workflow.visual_steps);
          setNodes(visualFlow.nodes || initialNodes);
          setEdges(visualFlow.edges || []);
        } catch (e) {
          console.error("Error parsing visual_steps:", e);
          setNodes(initialNodes);
          setEdges([]);
          toast.info("Error loading visual layout. Please redesign and save.");
        }
      } else if (workflow.steps) {
        // If no visual_steps but steps exist (old format), show initial node and prompt user
        setNodes(initialNodes);
        setEdges([]);
        toast.info("This workflow was created in an older format. Please design its visual layout.");
      } else {
        // Empty workflow
        setNodes(initialNodes);
        setEdges([]);
      }
    } else {
      setNodes(initialNodes);
      setEdges([]);
    }
  };
  
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      if (!reactFlowInstance) return;
      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;
      const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const newNode = { id: `${type}-${+new Date()}`, type, position, data: { label: `${type} node` } };
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance]
  );

  const onNodeClick = useCallback((_, node) => setSelectedNode(node), []);
  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  const deleteNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
      setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
      setSelectedNode(null);
      toast.success("Node deleted.");
    }
  }, [selectedNode, setNodes, setEdges]);

  const saveWorkflow = async () => {
    if (!selectedWorkflow) return toast.error("No workflow selected.");

    // --- Transformation Logic: Convert React Flow data to backend executable steps ---
    const backendSteps = { steps: {} };
    const nodeMap = new Map(nodes.map(node => [node.id, node]));

    // Sort nodes to ensure a somewhat logical order for step processing (e.g., by y-position)
    // This is a heuristic; a more robust solution might involve explicit step ordering in the UI
    const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y);

    sortedNodes.forEach(node => {
      // Exclude input and output nodes from backend steps as they are visual only
      if (node.type === 'input' || node.type === 'output') return; 

      const stepName = node.data.label || node.id; // Use label as step name, fallback to ID
      const toolName = node.data.tool;
      const params = node.data.params || {};

      // Find outgoing edges from this node to determine next steps
      const outgoingEdges = edges.filter(edge => edge.source === node.id);

      let next_step_on_success = null;
      let next_step_on_failure = null; // For condition nodes

      if (node.type === 'condition') {
        // For condition nodes, we expect two outgoing edges: one for 'true' and one for 'false'
        const trueEdge = outgoingEdges.find(edge => edge.sourceHandle === 'true');
        const falseEdge = outgoingEdges.find(edge => edge.sourceHandle === 'false');
        if (trueEdge) next_step_on_success = nodeMap.get(trueEdge.target)?.data?.label || trueEdge.target;
        if (falseEdge) next_step_on_failure = nodeMap.get(falseEdge.target)?.data?.label || falseEdge.target;
      } else {
        // For other nodes, assume a single next step on success
        const nextEdge = outgoingEdges[0]; // Assuming only one outgoing edge for non-condition nodes
        if (nextEdge) next_step_on_success = nodeMap.get(nextEdge.target)?.data?.label || nextEdge.target;
      }

      backendSteps.steps[stepName] = {
        tool: toolName,
        params: params,
        next_step_on_success: next_step_on_success,
        ...(node.type === 'condition' && { next_step_on_failure: next_step_on_failure })
      };
    });

    const flowVisualData = { nodes, edges };

    const updatedWorkflow = {
      ...selectedWorkflow,
      steps: backendSteps, // Backend executable steps
      visual_steps: JSON.stringify(flowVisualData) // Frontend visual data
    };

    try {
      const response = await fetch(`http://localhost:8000/api/v1/workflows/${selectedWorkflow.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-Company-ID': '1' },
          body: JSON.stringify(updatedWorkflow),
        });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Save failed');
      }
      toast.success("Workflow saved successfully.");
      setWorkflows(workflows.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w));
    } catch (error) {
      toast.error(`Save failed: ${error.message}`);
    }
  };

  const createWorkflow = async ({ name, description }) => {
    const newWorkflowPayload = {
      name,
      description,
      agent_id: 1,
      steps: { nodes: initialNodes, edges: [] }, // Initial backend steps (empty for now)
      visual_steps: JSON.stringify({ nodes: initialNodes, edges: [] }) // Initial visual steps
    };

    try {
      const response = await fetch('http://localhost:8000/api/v1/workflows/?company_id=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Company-ID': '1' },
        body: JSON.stringify(newWorkflowPayload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Creation failed');
      }
      const newWorkflow = await response.json();
      setWorkflows([...workflows, newWorkflow]);
      handleWorkflowSelection(newWorkflow);
      toast.success(`Workflow "${name}" created.`);
    } catch (error) {
      toast.error(`Creation failed: ${error.message}`);
    }
  };

  const deleteWorkflow = async () => {
    if (!selectedWorkflow) return toast.error("No workflow selected.");
    if (window.confirm(`Delete "${selectedWorkflow.name}"?`)) {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/workflows/${selectedWorkflow.id}`, {
          method: 'DELETE',
          headers: { 'X-Company-ID': '1' },
        });
        if (!response.ok) throw new Error('Deletion failed');
        toast.success("Workflow deleted.");
        const newWorkflows = workflows.filter(w => w.id !== selectedWorkflow.id);
        setWorkflows(newWorkflows);
        handleWorkflowSelection(newWorkflows.length > 0 ? newWorkflows[0] : null);
      } catch (error) {
        toast.error("Deletion failed.");
      }
    }
  };

  return (
    <>
      <CreateWorkflowDialog 
        isOpen={isCreateDialogOpen} 
        onClose={() => setCreateDialogOpen(false)} 
        onSubmit={createWorkflow} 
      />
      <div className="dndflow" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select 
            onChange={(e) => handleWorkflowSelection(workflows.find(w => w.id === parseInt(e.target.value)))}
            value={selectedWorkflow ? selectedWorkflow.id : ''}
            style={{ padding: '8px' }}
          >
            {workflows.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <button onClick={() => setCreateDialogOpen(true)} style={{ padding: '8px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}>Create New</button>
          <button onClick={saveWorkflow} style={{ padding: '8px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '5px' }}>Save Current</button>
          <button onClick={deleteWorkflow} style={{ padding: '8px', background: '#f44336', color: 'white', border: 'none', borderRadius: '5px' }}>Delete Current</button>
        </div>
        <div style={{ display: 'flex', flexGrow: 1 }}>
          <ReactFlowProvider>
            <Sidebar />
            <div className="reactflow-wrapper" style={{ flexGrow: 1, height: '100%' }} ref={reactFlowWrapper}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                fitView
                nodeTypes={nodeTypes} // Register custom node types
                deleteKeyCode={['Backspace', 'Delete']}
              >
                <Controls />
                <MiniMap />
                <Background variant="dots" gap={12} size={1} />
              </ReactFlow>
            </div>
            <div style={{ width: '300px', borderLeft: '1px solid #eee', background: '#fcfcfc' }}>
              <PropertiesPanel selectedNode={selectedNode} setNodes={setNodes} deleteNode={deleteNode} />
            </div>
          </ReactFlowProvider>
        </div>
      </div>
    </>
  );
};

export default VisualWorkflowBuilder;