import React from 'react';

export default () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside style={{ 
      borderRight: '1px solid #eee', 
      padding: '15px 10px', 
      fontSize: '12px', 
      background: '#fcfcfc',
      width: '250px',
      boxShadow: '0 0 10px rgba(0,0,0,0.05)'
    }}>
      <div style={{ marginBottom: '20px', fontWeight: 'bold', fontSize: '16px' }}>Nodes</div>
      <div style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', cursor: 'grab' }} 
           onDragStart={(event) => onDragStart(event, 'input')} 
           draggable>
        Input Node
      </div>
      <div style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', cursor: 'grab' }} 
           onDragStart={(event) => onDragStart(event, 'default')} 
           draggable>
        Send Message
      </div>
      <div style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', cursor: 'grab' }} 
           onDragStart={(event) => onDragStart(event, 'default')} 
           draggable>
        Ask a Question
      </div>
      <div style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', cursor: 'grab' }} 
           onDragStart={(event) => onDragStart(event, 'default')} 
           draggable>
        API Call
      </div>
      <div style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', cursor: 'grab' }} 
           onDragStart={(event) => onDragStart(event, 'output')} 
           draggable>
        Output Node
      </div>
    </aside>
  );
};
