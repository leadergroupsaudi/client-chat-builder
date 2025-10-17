import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from "@/hooks/useAuth";

const VariableInput = ({ value, onChange, placeholder, availableVars }) => {
    const [showVars, setShowVars] = useState(false);
    const containerRef = useRef(null);

    const handleSelectVar = (varValue) => {
        onChange({ target: { value: varValue } });
        setShowVars(false);
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowVars(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [containerRef]);

    return (
        <div className="relative" ref={containerRef}>
            <input
                type="text"
                value={value || ''}
                onChange={onChange}
                className="w-full px-3 py-2 pr-12 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder={placeholder}
            />
            <button
                onClick={() => setShowVars(!showVars)}
                title="Select a variable"
                className="absolute right-0.5 top-0.5 bottom-0.5 border-none bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer px-3 rounded-r-md text-slate-700 dark:text-slate-300 text-sm transition-colors"
            >
                {`{...}`}
            </button>
            {showVars && (
                <ul className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 list-none p-0 mt-1 z-10 max-h-52 overflow-y-auto rounded-md shadow-lg">
                    {availableVars.length === 0 ? (
                        <li className="px-3 py-2 text-slate-500 dark:text-slate-400">No variables available</li>
                    ) : (
                        availableVars.map(v => (
                            <li
                                key={v.value}
                                onClick={() => handleSelectVar(v.value)}
                                className="px-3 py-2 cursor-pointer text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <strong className="block text-slate-900 dark:text-slate-100">{v.label}</strong>
                                <div className="text-xs text-slate-600 dark:text-slate-400">{v.value}</div>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
};

const PropertiesPanel = ({ selectedNode, nodes, setNodes, deleteNode }) => {
  const [tools, setTools] = useState([]);
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const { authFetch } = useAuth();

  // *** THE FIX: Find the most up-to-date version of the selected node from the nodes list ***
  const currentNode = useMemo(() => {
    if (!selectedNode) return null;
    return nodes.find(n => n.id === selectedNode.id);
  }, [selectedNode, nodes]);

  const availableVariables = useMemo(() => {
    if (!currentNode) return [];
    const vars = [];
    nodes.forEach(node => {
        if (node.id !== currentNode.id) {
            vars.push({
                label: `Output of "${node.data.label || node.id}"`,
                value: `{{${node.id}.output}}`
            });
        }
        if ((node.type === 'listen' || node.type === 'prompt' || node.type === 'form') && node.data.params?.save_to_variable) {
            const varName = node.data.params.save_to_variable;
            const contextVar = { label: `Variable "${varName}"`, value: `{{context.${varName}}}` };
            if (!vars.some(v => v.value === contextVar.value)) {
                vars.push(contextVar);
            }
        }
    });
    return vars;
  }, [currentNode, nodes]);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const [toolsRes, kbRes] = await Promise.all([
          authFetch('/api/v1/tools/?company_id=1'),
          authFetch('/api/v1/knowledge-bases/?company_id=1')
        ]);
        if (!toolsRes.ok) throw new Error('Failed to fetch tools');
        if (!kbRes.ok) throw new Error('Failed to fetch knowledge bases');
        const toolsData = await toolsRes.json();
        const kbData = await kbRes.json();
        setTools(toolsData);
        setKnowledgeBases(kbData);
      } catch (error) {
        toast.error("Failed to load resources.");
      }
    };
    fetchResources();
  }, [authFetch]);

  const handleDataChange = (key, value) => {
    if (!currentNode) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === currentNode.id) {
          const newData = { ...node.data, [key]: value };
          return { ...node, data: newData };
        }
        return node;
      })
    );
  };

  const handleParamsChange = (key, value) => {
    if (!currentNode) return;
    const newParams = { ...(currentNode.data.params || {}), [key]: value };
    handleDataChange('params', newParams);
  };

  const handleFieldChange = (index, key, value) => {
    const newFields = [...(currentNode.data.params?.fields || [])];
    newFields[index] = { ...newFields[index], [key]: value };
    handleParamsChange('fields', newFields);
  };

  const onToolChange = (toolName) => {
    const tool = tools.find(t => t.name === toolName);
    setNodes(nds => nds.map(n => {
      if (n.id === currentNode.id) {
        return {
          ...n,
          data: {
            ...n.data,
            tool: toolName,
            params: {
              toolParameters: tool?.parameters?.properties || {}
            }
          }
        }
      }
      return n;
    }))
  };

  const renderToolParams = () => {
    const tool = tools.find(t => t.name === currentNode.data.tool);
    if (!tool || !tool.parameters || !tool.parameters.properties) return null;

    return (
      <div style={{ marginTop: '15px' }}>
        <h4 style={{ marginBottom: '10px', fontWeight: 'bold' }}>Tool Parameters</h4>
        {Object.entries(tool.parameters.properties).map(([paramName, param]) => (
          <div key={paramName} style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>{param.title || paramName}</label>
            <VariableInput
              value={currentNode.data.params?.[paramName] || ''}
              onChange={(e) => handleParamsChange(paramName, e.target.value)}
              placeholder={param.description}
              availableVars={availableVariables}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderNodeProperties = () => {
    if (!currentNode) return <div className="text-slate-500 dark:text-slate-400 p-5">Select a node to view its properties.</div>;

    return (
      <div className="p-3">
        <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">Node Settings</h3>
          <div className="mb-4">
            <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Node Label:</label>
            <input
              type="text"
              value={currentNode.data.label || ''}
              onChange={(e) => handleDataChange('label', e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
        </div>

        {currentNode.type === 'llm' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">LLM Configuration</h3>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Model:</label>
              <select
                value={currentNode.data.model || ''}
                onChange={(e) => handleDataChange('model', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="">Select a model</option>
                <option value="groq/llama3-8b-8192">Groq Llama3 8b</option>
                <option value="gemini/gemini-pro">Gemini Pro</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Knowledge Base:</label>
              <select
                value={currentNode.data.knowledge_base_id || ''}
                onChange={(e) => handleDataChange('knowledge_base_id', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="">None</option>
                {knowledgeBases.map((kb) => (
                  <option key={kb.id} value={kb.id}>{kb.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Prompt:</label>
              <VariableInput
                value={currentNode.data.prompt || ''}
                onChange={(e) => handleDataChange('prompt', e.target.value)}
                placeholder="e.g., What is the capital of {{context.country}}?"
                availableVars={availableVariables}
              />
            </div>
          </div>
        )}

        {currentNode.type === 'tool' && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#222' }}>Tool Configuration</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Tool:</label>
              <select 
                style={commonInputStyle} 
                onChange={(e) => onToolChange(e.target.value)} 
                value={currentNode.data.tool || ''}
              >
                <option value="">Select a tool</option>
                {tools.map(tool => <option key={tool.id} value={tool.name}>{tool.name}</option>)}
              </select>
            </div>
            {renderToolParams()}
          </div>
        )}

        {currentNode.type === 'condition' && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#222' }}>Condition Logic</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Variable:</label>
              <select
                value={currentNode.data.variable || ''}
                onChange={(e) => handleDataChange('variable', e.target.value)}
                style={commonInputStyle}
              >
                <option value="">Select a variable</option>
                {availableVariables.map(v => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Operator:</label>
              <select
                value={currentNode.data.operator || 'equals'}
                onChange={(e) => handleDataChange('operator', e.target.value)}
                style={commonInputStyle}
              >
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="contains">Contains</option>
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
                <option value="is_set">Is Set (Exists)</option>
                <option value="is_not_set">Is Not Set (Doesn't Exist)</option>
              </select>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Value:</label>
              <input
                type="text"
                value={currentNode.data.value || ''}
                onChange={(e) => handleDataChange('value', e.target.value)}
                style={commonInputStyle}
                placeholder="Value to compare against"
                disabled={['is_set', 'is_not_set'].includes(currentNode.data.operator)}
              />
            </div>
          </div>
        )}

        {currentNode.type === 'knowledge' && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#222' }}>Knowledge Search</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Knowledge Base:</label>
              <select
                value={currentNode.data.knowledge_base_id || ''}
                onChange={(e) => handleDataChange('knowledge_base_id', e.target.value ? parseInt(e.target.value) : null)}
                style={commonInputStyle}
              >
                <option value="">None</option>
                {knowledgeBases.map((kb) => (
                  <option key={kb.id} value={kb.id}>{kb.name}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Query:</label>
              <VariableInput
                value={currentNode.data.query || ''}
                onChange={(e) => handleDataChange('query', e.target.value)}
                placeholder="e.g., What is the capital of {{context.country}}?"
                availableVars={availableVariables}
              />
            </div>
          </div>
        )}

        {currentNode.type === 'http_request' && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#222' }}>HTTP Request</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>URL:</label>
              <VariableInput
                value={currentNode.data.url || ''}
                onChange={(e) => handleDataChange('url', e.target.value)}
                placeholder="e.g., https://api.example.com/data"
                availableVars={availableVariables}
              />
            </div>
            <div style={{ marginBottom: '15px'}}> 
              <label style={labelStyle}>Method:</label>
              <select
                value={currentNode.data.method || 'GET'}
                onChange={(e) => handleDataChange('method', e.target.value)}
                style={commonInputStyle}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div style={{ marginBottom: '15px'}}> 
              <label style={labelStyle}>Headers (JSON):</label>
              <textarea
                value={currentNode.data.headers || ''}
                onChange={(e) => handleDataChange('headers', e.target.value)}
                placeholder='e.g., {"Content-Type": "application/json"}'
                rows={4}
                style={{ ...commonInputStyle, fontFamily: 'monospace' }}
              />
            </div>
            <div style={{ marginBottom: '15px'}}> 
              <label style={labelStyle}>Body (JSON):</label>
              <textarea
                value={currentNode.data.body || ''}
                onChange={(e) => handleDataChange('body', e.target.value)}
                placeholder='e.g., {"key": "{{context.value}}"}'
                rows={6}
                style={{ ...commonInputStyle, fontFamily: 'monospace' }}
              />
            </div>
          </div>
        )}

        {currentNode.type === 'data_manipulation' && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#222' }}>Data Manipulation</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Expression (Python):</label>
              <textarea
                value={currentNode.data.expression || ''}
                onChange={(e) => handleDataChange('expression', e.target.value)}
                placeholder="e.g., context.user_input.upper()"
                rows={5}
                style={{ ...commonInputStyle, fontFamily: 'monospace' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Output Variable Name:</label>
              <input
                type="text"
                value={currentNode.data.output_variable || ''}
                onChange={(e) => handleDataChange('output_variable', e.target.value)}
                style={commonInputStyle}
                placeholder="e.g., transformed_data"
              />
            </div>
          </div>
        )}

        {currentNode.type === 'code' && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#222' }}>Code Execution</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Python Code:</label>
              <textarea
                value={currentNode.data.code || ''}
                onChange={(e) => handleDataChange('code', e.target.value)}
                placeholder="e.g., print('Hello, World!') result = context.user_input * 2"
                rows={10}
                style={{ ...commonInputStyle, fontFamily: 'monospace' }}
              />
            </div>
          </div>
        )}

        {currentNode.type === 'listen' && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#222' }}>Listen for Input</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Save User Input to Variable:</label>
              <input
                type="text"
                value={(currentNode.data.params?.save_to_variable) || ''}
                onChange={(e) => handleParamsChange('save_to_variable', e.target.value)}
                style={commonInputStyle}
                placeholder="e.g., user_email"
              />
            </div>
          </div>
        )}

        {currentNode.type === 'prompt' && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#222' }}>Prompt for Input</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Prompt Text:</label>
              <VariableInput
                value={(currentNode.data.params?.prompt_text) || ''}
                onChange={(e) => handleParamsChange('prompt_text', e.target.value)}
                placeholder="Ask the user a question..."
                availableVars={availableVariables}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Options (comma-separated):</label>
              <input
                type="text"
                value={(currentNode.data.params?.options) || ''}
                onChange={(e) => handleParamsChange('options', e.target.value)}
                style={commonInputStyle}
                placeholder="e.g., Yes, No, Maybe"
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Save User Input to Variable:</label>
              <input
                type="text"
                value={(currentNode.data.params?.save_to_variable) || ''}
                onChange={(e) => handleParamsChange('save_to_variable', e.target.value)}
                style={commonInputStyle}
                placeholder="e.g., user_choice"
              />
            </div>
          </div>
        )}

        {currentNode.type === 'form' && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#222' }}>Form Configuration</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Form Title:</label>
              <input
                type="text"
                value={(currentNode.data.params?.title) || ''}
                onChange={(e) => handleParamsChange('title', e.target.value)}
                style={commonInputStyle}
                placeholder="e.g., Customer Information"
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Save Form Data to Variable:</label>
              <input
                type="text"
                value={(currentNode.data.params?.save_to_variable) || ''}
                onChange={(e) => handleParamsChange('save_to_variable', e.target.value)}
                style={commonInputStyle}
                placeholder="e.g., customer_data"
              />
            </div>
            
            <div>
              <h4 style={{ fontSize: '15px', marginBottom: '10px', color: '#333' }}>Form Fields</h4>
              {(currentNode.data.params?.fields || []).map((field, index) => (
                <div key={index} style={{ border: '1px solid #e0e0e0', borderRadius: '6px', padding: '10px', marginBottom: '10px', background: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <strong style={{ fontSize: '14px' }}>Field #{index + 1}</strong>
                    <button onClick={() => {
                      const newFields = [...currentNode.data.params.fields];
                      newFields.splice(index, 1);
                      handleParamsChange('fields', newFields);
                    }} style={{ color: '#d9534f', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{...labelStyle, fontSize: '13px'}}>Name (Variable Key):</label>
                    <input type="text" value={field.name} onChange={(e) => handleFieldChange(index, 'name', e.target.value)} style={{...commonInputStyle, fontSize: '13px', padding: '8px'}} placeholder="e.g., full_name" />
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{...labelStyle, fontSize: '13px'}}>Label (Display Text):</label>
                    <input type="text" value={field.label} onChange={(e) => handleFieldChange(index, 'label', e.target.value)} style={{...commonInputStyle, fontSize: '13px', padding: '8px'}} placeholder="e.g., Full Name" />
                  </div>
                  <div>
                    <label style={{...labelStyle, fontSize: '13px'}}>Type:</label>
                    <select value={field.type} onChange={(e) => handleFieldChange(index, 'type', e.target.value)} style={{...commonInputStyle, fontSize: '13px', padding: '8px'}}>
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="number">Number</option>
                      <option value="tel">Phone</option>
                      <option value="textarea">Text Area</option>
                    </select>
                  </div>
                </div>
              ))}
              <button onClick={() => {
                const newFields = [...(currentNode.data.params?.fields || []), { name: '', label: '', type: 'text' }];
                handleParamsChange('fields', newFields);
              }} style={{ width: '100%', padding: '10px', background: '#e8f0fe', border: '1px dashed #a9c7f7', borderRadius: '5px', cursor: 'pointer', color: '#3B82F6' }}>
                + Add Field
              </button>
            </div>
          </div>
        )}

        {currentNode.type === 'output' && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#222' }}>Output Node</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Output Value:</label>
              <VariableInput
                value={currentNode.data.output_value || ''}
                onChange={(e) => handleDataChange('output_value', e.target.value)}
                placeholder="e.g., {{llm_node_id.output}}"
                availableVars={availableVariables}
              />
            </div>
          </div>
        )}

        {currentNode.type === 'start' && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#222' }}>Start Node</h3>
            <p style={{ fontSize: '14px', color: '#555' }}>This node marks the beginning of your workflow.</p>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Initial Input Variable Name:</label>
              <input
                type="text"
                value={currentNode.data.initial_input_variable || 'user_message'}
                onChange={(e) => handleDataChange('initial_input_variable', e.target.value)}
                style={commonInputStyle}
                placeholder="e.g., user_query"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-5 h-full overflow-y-auto bg-white dark:bg-slate-800">
      <div className="font-bold text-base mb-5 border-b border-slate-200 dark:border-slate-700 pb-3 text-slate-900 dark:text-slate-100">Properties</div>
      {renderNodeProperties()}
      {currentNode && (
        <button
          onClick={deleteNode}
          className="mt-5 px-4 py-2.5 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white border-none rounded-lg cursor-pointer w-full transition-colors font-medium"
        >
          Delete Node
        </button>
      )}
    </div>
  );
};

export default PropertiesPanel;