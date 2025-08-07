import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tool } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit, Search, Play } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

const ToolManagementPage = () => {
  const queryClient = useQueryClient();
  const companyId = 1; // Hardcoded for now
  const { authFetch } = useAuth();

  const { data: tools, isLoading: isLoadingTools } = useQuery<Tool[]>({ queryKey: ['tools', companyId], queryFn: async () => {
    const response = await authFetch(`/api/v1/tools/`);
    if (!response.ok) {
      throw new Error("Failed to fetch tools");
    }
    return response.json();
  }});

  const createToolMutation = useMutation({
    mutationFn: async (newTool: Partial<Tool>) => {
      const response = await authFetch(`/api/v1/tools/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTool),
      });
      if (!response.ok) {
        throw new Error("Failed to create tool");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools', companyId] });
    },
  });

  const updateToolMutation = useMutation({
    mutationFn: async (updatedTool: Tool) => {
      const response = await authFetch(`/api/v1/tools/${updatedTool.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedTool),
      });
      if (!response.ok) {
        throw new Error("Failed to update tool");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools', companyId] });
    },
  });

  const deleteToolMutation = useMutation({
    mutationFn: async (toolId: number) => {
      const response = await authFetch(`/api/v1/tools/${toolId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete tool");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools', companyId] });
    },
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTools = tools?.filter(tool =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [creationStep, setCreationStep] = useState<'initial' | 'custom' | 'mcp'>('initial');

  const handleCreate = (newTool: Omit<Tool, 'id'>) => {
    createToolMutation.mutate(newTool, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setCreationStep('initial');
      }
    });
  };

  const handleUpdate = (updatedTool: Tool) => {
    updateToolMutation.mutate(updatedTool, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
      }
    });
  };

  const resetCreationFlow = () => {
    setCreationStep('initial');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tool Management</h1>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={(isOpen) => {
            setIsCreateDialogOpen(isOpen);
            if (!isOpen) {
              resetCreationFlow();
            }
          }}>
            <DialogTrigger asChild>
              <Button> <Plus className="mr-2 h-4 w-4" /> Create Tool</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create a New Tool</DialogTitle>
                <DialogDescription>
                  Select the type of tool you want to create. Each type serves a different purpose.
                </DialogDescription>
              </DialogHeader>
              {creationStep === 'initial' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div
                    className="group relative p-6 border rounded-lg hover:bg-muted/50 transition-all cursor-pointer"
                    onClick={() => setCreationStep('custom')}
                  >
                    <div className="flex flex-col items-start gap-3">
                      <div className="bg-muted p-3 rounded-lg">
                        <Edit className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold">Custom Tool</h3>
                      <p className="text-sm text-muted-foreground">
                        Write your own Python code to perform any action. Best for unique, internal logic.
                      </p>
                    </div>
                  </div>
                  <div
                    className="group relative p-6 border rounded-lg hover:bg-muted/50 transition-all cursor-pointer"
                    onClick={() => setCreationStep('mcp')}
                  >
                    <div className="flex flex-col items-start gap-3">
                      <div className="bg-muted p-3 rounded-lg">
                        <Search className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold">MCP Connection</h3>
                      <p className="text-sm text-muted-foreground">
                        Connect to an external MCP server to use its library of pre-built tools.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {creationStep === 'custom' && (
                <ToolForm onSubmit={handleCreate} onBack={resetCreationFlow} />
              )}
              {creationStep === 'mcp' && (
                <McpToolForm onSubmit={handleCreate} onBack={resetCreationFlow} />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Existing Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search existing tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          {isLoadingTools ? (
            <p>Loading tools...</p>
          ) : (
            filteredTools?.map((tool) => (
              <div key={tool.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    {tool.name}
                    <span className="text-xs font-normal bg-secondary text-secondary-foreground py-0.5 px-2 rounded-full">
                      {tool.tool_type === 'mcp' ? 'MCP Connection' : 'Custom'}
                    </span>
                  </h4>
                  <p className="text-sm text-gray-500">{tool.description}</p>
                  {tool.tool_type === 'mcp' && (
                    <p className="text-xs text-gray-400 mt-1">{tool.mcp_server_url}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={isEditDialogOpen && selectedTool?.id === tool.id} onOpenChange={(isOpen) => {
                        if (!isOpen) setSelectedTool(null);
                        setIsEditDialogOpen(isOpen);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" onClick={() => setSelectedTool(tool)}><Edit className="h-4 w-4" /></Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit {tool.tool_type === 'mcp' ? 'Connection' : 'Tool'}</DialogTitle>
                          </DialogHeader>
                          {tool.tool_type === 'custom' ? (
                            <ToolForm tool={tool} onSubmit={(values) => handleUpdate({ ...tool, ...values })} onBack={() => setIsEditDialogOpen(false)} />
                          ) : (
                            <McpToolForm tool={tool} onSubmit={(values) => handleUpdate({ ...tool, ...values })} onBack={() => setIsEditDialogOpen(false)} />
                          )}
                        </DialogContent>
                      </Dialog>
                  {tool.tool_type === 'custom' && (
                      <Dialog open={isTestDialogOpen && selectedTool?.id === tool.id} onOpenChange={(isOpen) => {
                        if (!isOpen) setSelectedTool(null);
                        setIsTestDialogOpen(isOpen);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" onClick={() => setSelectedTool(tool)}><Play className="h-4 w-4" /></Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Test {tool.name}</DialogTitle>
                          </DialogHeader>
                          <TestToolDialog tool={tool} companyId={companyId} />
                        </DialogContent>
                      </Dialog>
                  )}
                  <Button variant="destructive" onClick={() => deleteToolMutation.mutate(tool.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const ToolForm = ({ tool, onSubmit, onBack }: { tool?: Tool, onSubmit: (values: any) => void, onBack: () => void }) => {
  const [values, setValues] = useState(tool || { name: "", description: "", code: "", parameters: { type: "object", properties: {}, required: [] }, tool_type: "custom" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <Input
        placeholder="Tool Name"
        value={values.name}
        onChange={(e) => setValues({ ...values, name: e.target.value })}
        required
      />
      <Textarea
        placeholder="Description"
        value={values.description}
        onChange={(e) => setValues({ ...values, description: e.target.value })}
      />
      <Textarea
        placeholder="Enter Python code here..."
        value={values.code}
        onChange={(e) => setValues({ ...values, code: e.target.value })}
        rows={10}
        className="font-mono"
      />
      {/* A simplified parameter editor could be added here in the future */}
      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>Back</Button>
        <Button type="submit">
          {tool ? "Update Tool" : "Create Tool"}
        </Button>
      </div>
    </form>
  );
};

const McpToolForm = ({ tool, onSubmit, onBack }: { tool?: Tool, onSubmit: (values: any) => void, onBack: () => void }) => {
  const [name, setName] = useState(tool?.name || "");
  const [description, setDescription] = useState(tool?.description || "");
  const [url, setUrl] = useState(tool?.mcp_server_url || "");
  const [inspected, setInspected] = useState(!!tool); // If we are editing, assume it was inspected.
  const { authFetch } = useAuth();

  const { mutate: inspect, data: inspectData, error: inspectError, isPending: isInspecting } = useMutation({
    mutationFn: async (urlToInspect: string) => {
      const response = await authFetch(`/api/v1/mcp/inspect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToInspect }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to inspect MCP server');
      }
      return response.json();
    },
    onSuccess: () => {
      setInspected(true);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description,
      mcp_server_url: url,
      tool_type: "mcp",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <Input
        placeholder="Connection Name (e.g., My Internal Tools)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Textarea
        placeholder="Description of this MCP connection"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div className="flex items-start gap-2">
        <Input
          placeholder="MCP Server URL"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setInspected(false); // Reset inspected status if URL changes
          }}
          required
          type="url"
        />
        <Button type="button" onClick={() => inspect(url)} disabled={isInspecting || !url}>
          {isInspecting ? "Inspecting..." : "Test & Inspect"}
        </Button>
      </div>

      {inspectData && inspected && (
        <div className="p-4 border bg-green-50 border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-800">Inspection Successful!</h4>
          <p className="text-sm text-green-700">Found {inspectData.tools.length} tools on this server.</p>
        </div>
      )}

      {inspectError && (
         <div className="p-4 border bg-red-50 border-red-200 rounded-lg">
          <h4 className="font-semibold text-red-800">Inspection Failed</h4>
          <p className="text-sm text-red-700">{inspectError.message}</p>
        </div>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>Back</Button>
        <Button type="submit" disabled={!inspected && !tool}>
          {tool ? "Update Connection" : "Create Connection"}
        </Button>
      </div>
    </form>
  );
};

const TestToolDialog = ({ tool, companyId }: { tool: Tool, companyId: number }) => {
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [result, setResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { authFetch } = useAuth();

  const executeMutation = useMutation({
    mutationFn: async (params: Record<string, any>) => {
      const response = await authFetch(`/api/v1/tools/${tool.id}/execute`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to execute tool");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      setIsLoading(false);
    },
    onError: (error) => {
      setResult({ error: error.message });
      setIsLoading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    executeMutation.mutate(parameters);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {tool.parameters && Object.keys(tool.parameters).map((paramName) => (
          <div key={paramName}>
            <Label htmlFor={paramName}>{tool.parameters[paramName].description}</Label>
            <Input
              id={paramName}
              type={tool.parameters[paramName].type === "integer" ? "number" : "text"}
              value={parameters[paramName] || ""}
              onChange={(e) => setParameters({ ...parameters, [paramName]: e.target.value })}
            />
          </div>
        ))}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Executing..." : "Run Test"}
        </Button>
      </form>
      {result && (
        <div>
          <h4 className="font-semibold">Result:</h4>
          <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ToolManagementPage;
