import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface Workflow {
  id: number;
  name: string;
  description: string;
  agent_id: number;
  steps: any; // JSON object for steps
}

interface Agent {
  id: number;
  name: string;
}

const WorkflowManagementPage: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    agent_id: '',
    steps: '{}',
  });
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);

  useEffect(() => {
    fetchWorkflows();
    fetchAgents();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/workflows/', {
        headers: {
          'X-Company-ID': '1',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch workflows');
      }
      const data = await response.json();
      setWorkflows(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load workflows.',
        variant: 'destructive',
      });
      console.error('Error fetching workflows:', error);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/agents/', {
        headers: {
          'X-Company-ID': '1',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }
      const data = await response.json();
      setAgents(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load agents.',
        variant: 'destructive',
      });
      console.error('Error fetching agents:', error);
    }
  };

  const handleCreateWorkflow = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/workflows/', {
        method: 'POST',
        headers: {
          'X-Company-ID': '1',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newWorkflow,
          agent_id: parseInt(newWorkflow.agent_id),
          steps: JSON.parse(newWorkflow.steps),
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to create workflow');
      }
      toast({
        title: 'Success',
        description: 'Workflow created successfully.',
      });
      setNewWorkflow({ name: '', description: '', agent_id: '', steps: '{}' });
      fetchWorkflows();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create workflow.',
        variant: 'destructive',
      });
      console.error('Error creating workflow:', error);
    }
  };

  const handleUpdateWorkflow = async () => {
    if (!editingWorkflow) return;
    try {
      const response = await fetch(`http://localhost:8000/api/v1/workflows/${editingWorkflow.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editingWorkflow,
          agent_id: parseInt(editingWorkflow.agent_id as any),
          steps: JSON.parse(editingWorkflow.steps as any),
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to update workflow');
      }
      toast({
        title: 'Success',
        description: 'Workflow updated successfully.',
      });
      setEditingWorkflow(null);
      fetchWorkflows();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update workflow.',
        variant: 'destructive',
      });
      console.error('Error updating workflow:', error);
    }
  };

  const handleDeleteWorkflow = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/workflows/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete workflow');
      }
      toast({
        title: 'Success',
        description: 'Workflow deleted successfully.',
      });
      fetchWorkflows();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete workflow.',
        variant: 'destructive',
      });
      console.error('Error deleting workflow:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Workflow Management</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create New Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newWorkflow.name}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                placeholder="Workflow Name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newWorkflow.description}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                placeholder="Workflow Description"
              />
            </div>
            <div>
              <Label htmlFor="agent">Agent</Label>
              <Select
                onValueChange={(value) => setNewWorkflow({ ...newWorkflow, agent_id: value })}
                value={newWorkflow.agent_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an Agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="steps">Steps (JSON)</Label>
              <Textarea
                id="steps"
                value={newWorkflow.steps}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, steps: e.target.value })}
                placeholder='e.g., {\"step1\": {\"tool\": \"search\", \"params\": {\"query\": \"example\"}}}'
                rows={5}
              />
            </div>
          </div>
          <Button onClick={handleCreateWorkflow} className="mt-4">Create Workflow</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Workflows</CardTitle>
        </CardHeader>
        <CardContent>
          {workflows.length === 0 ? (
            <p>No workflows found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflows.map((workflow) => (
                <Card key={workflow.id}>
                  <CardHeader>
                    <CardTitle>{workflow.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">{workflow.description}</p>
                    <p className="text-sm text-gray-500">Agent ID: {workflow.agent_id}</p>
                    <p className="text-sm text-gray-500">Steps: {JSON.stringify(workflow.steps)}</p>
                    <div className="mt-4 flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" onClick={() => setEditingWorkflow(workflow)}>Edit</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Edit Workflow</DialogTitle>
                          </DialogHeader>
                          {editingWorkflow && (
                            <div className="grid gap-4 py-4">
                              <div>
                                <Label htmlFor="edit-name">Name</Label>
                                <Input
                                  id="edit-name"
                                  value={editingWorkflow.name}
                                  onChange={(e) =>
                                    setEditingWorkflow({ ...editingWorkflow, name: e.target.value })
                                  }
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-description">Description</Label>
                                <Input
                                  id="edit-description"
                                  value={editingWorkflow.description}
                                  onChange={(e) =>
                                    setEditingWorkflow({ ...editingWorkflow, description: e.target.value })
                                  }
                                />
                              </div>
                              <div>
                                <Label htmlFor="edit-agent">Agent</Label>
                                <Select
                                  onValueChange={(value) =>
                                    setEditingWorkflow({ ...editingWorkflow, agent_id: parseInt(value) })
                                  }
                                  value={editingWorkflow.agent_id.toString()}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select an Agent" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {agents.map((agent) => (
                                      <SelectItem key={agent.id} value={agent.id.toString()}>
                                        {agent.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="col-span-2">
                                <Label htmlFor="edit-steps">Steps (JSON)</Label>
                                <Textarea
                                  id="edit-steps"
                                  value={typeof editingWorkflow.steps === 'string' ? editingWorkflow.steps : JSON.stringify(editingWorkflow.steps)}
                                  onChange={(e) =>
                                    setEditingWorkflow({ ...editingWorkflow, steps: e.target.value })
                                  }
                                  rows={5}
                                />
                              </div>
                            </div>
                          )}
                          <DialogFooter>
                            <Button onClick={handleUpdateWorkflow}>Save changes</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button variant="destructive" onClick={() => handleDeleteWorkflow(workflow.id)}>Delete</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowManagementPage;
