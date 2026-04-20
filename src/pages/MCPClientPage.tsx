import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Cable, Play, Search, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const PRESETS = [
  { label: "Local MCP Server", url: "http://127.0.0.1:8002/mcp" },
  { label: "Google Drive (OAuth)", url: "https://mcp.googleapis.com/drive" },
];

interface McpTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

const MCPClientPage = () => {
  const { authFetch } = useAuth();
  const [serverUrl, setServerUrl] = useState("");
  const [tools, setTools] = useState<McpTool[]>([]);
  const [selectedTool, setSelectedTool] = useState<McpTool | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState("");
  const [inspecting, setInspecting] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [inspectError, setInspectError] = useState("");
  const [authRequired, setAuthRequired] = useState(false);

  const handleInspect = async () => {
    if (!serverUrl) return;
    setInspecting(true);
    setTools([]);
    setSelectedTool(null);
    setResult("");
    setInspectError("");
    setAuthRequired(false);

    try {
      const res = await authFetch("/api/v1/mcp/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: serverUrl }),
      });
      const data = await res.json();

      if (data.authentication_required) {
        setAuthRequired(true);
        setInspectError(data.message ?? "Authentication required.");
      } else if (!res.ok) {
        setInspectError(data.detail ?? "Failed to inspect server");
      } else {
        setTools(data.tools ?? []);
      }
    } catch (err: any) {
      setInspectError(err.message ?? "Connection failed");
    } finally {
      setInspecting(false);
    }
  };

  const handleSelectTool = (tool: McpTool) => {
    setSelectedTool(tool);
    setParamValues({});
    setResult("");
  };

  const handleExecute = async () => {
    if (!selectedTool || !serverUrl) return;
    setExecuting(true);
    setResult("");

    const props = selectedTool.parameters?.properties ?? {};
    const params: Record<string, any> = {};
    for (const [key, schema] of Object.entries(props) as [string, any][]) {
      const raw = paramValues[key] ?? "";
      if (schema.type === "number" || schema.type === "integer") {
        params[key] = raw === "" ? undefined : Number(raw);
      } else if (schema.type === "boolean") {
        params[key] = raw === "true";
      } else {
        params[key] = raw;
      }
    }

    try {
      const res = await authFetch("/api/v1/mcp/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: serverUrl,
          tool_name: selectedTool.name,
          parameters: params,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult(`Error: ${data.detail ?? "Unknown error"}`);
      } else {
        const raw = data.result;
        try {
          setResult(JSON.stringify(JSON.parse(raw), null, 2));
        } catch {
          setResult(typeof raw === "string" ? raw : JSON.stringify(raw, null, 2));
        }
      }
    } catch (err: any) {
      setResult(`Error: ${err.message}`);
    } finally {
      setExecuting(false);
    }
  };

  const selectedProps = selectedTool?.parameters?.properties ?? {};
  const hasParams = Object.keys(selectedProps).length > 0;

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2">
          MCP Client
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Connect to any MCP-compatible server and explore its tools
        </p>
      </div>

      {/* URL Input Card */}
      <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
        <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
          <CardTitle className="flex items-center gap-2 dark:text-white">
            <Cable className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            Server Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {/* Presets */}
          <div>
            <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 block">
              Quick Connect
            </Label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.url}
                  variant="outline"
                  size="sm"
                  onClick={() => setServerUrl(preset.url)}
                  className={`dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 ${
                    serverUrl === preset.url
                      ? "border-teal-500 text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20"
                      : ""
                  }`}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* URL input + Inspect button */}
          <div>
            <Label htmlFor="mcp-url" className="dark:text-gray-300">
              MCP Server URL
            </Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="mcp-url"
                type="url"
                placeholder="https://your-mcp-server.example.com/mcp"
                value={serverUrl}
                onChange={(e) => {
                  setServerUrl(e.target.value);
                  setTools([]);
                  setSelectedTool(null);
                  setResult("");
                  setInspectError("");
                  setAuthRequired(false);
                }}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white font-mono text-sm"
              />
              <Button
                onClick={handleInspect}
                disabled={inspecting || !serverUrl}
                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shrink-0"
              >
                <Search className="h-4 w-4 mr-2" />
                {inspecting ? "Inspecting…" : "Inspect"}
              </Button>
            </div>
          </div>

          {authRequired && (
            <div className="p-4 border bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="font-semibold text-yellow-800 dark:text-yellow-300 text-sm">Authentication Required</p>
              <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-1">{inspectError}</p>
            </div>
          )}

          {!authRequired && inspectError && (
            <div className="p-4 border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 rounded-lg">
              <p className="font-semibold text-red-800 dark:text-red-300 text-sm">Connection Failed</p>
              <p className="text-red-700 dark:text-red-400 text-sm mt-1">{inspectError}</p>
            </div>
          )}

          {tools.length > 0 && !inspectError && (
            <div className="p-3 border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-800 dark:text-green-300 text-sm font-semibold">
                Connected — {tools.length} tool{tools.length !== 1 ? "s" : ""} found
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tool Explorer: left panel + right panel */}
      {tools.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tool List */}
          <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800 lg:col-span-1">
            <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 py-3">
              <CardTitle className="text-sm dark:text-white">Tools</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul>
                {tools.map((tool) => (
                  <li key={tool.name}>
                    <button
                      type="button"
                      onClick={() => handleSelectTool(tool)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors ${
                        selectedTool?.name === tool.name
                          ? "bg-teal-50 dark:bg-teal-900/20 border-l-2 border-l-teal-500"
                          : ""
                      }`}
                    >
                      <div>
                        <p className="font-mono text-sm font-medium dark:text-white">{tool.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {tool.description}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 ml-2" />
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Tool Executor */}
          <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800 lg:col-span-2">
            <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 py-3">
              <CardTitle className="text-sm dark:text-white">
                {selectedTool ? (
                  <span className="font-mono">{selectedTool.name}</span>
                ) : (
                  "Select a tool"
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {!selectedTool ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                  <Cable className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>Select a tool from the list to execute it</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedTool.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">{selectedTool.description}</p>
                  )}

                  {hasParams ? (
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block">
                        Parameters
                      </Label>
                      {Object.entries(selectedProps).map(([key, schema]: [string, any]) => (
                        <div key={key}>
                          <Label htmlFor={`exec-${key}`} className="text-sm dark:text-gray-300">
                            {key}
                            {schema.description && (
                              <span className="text-xs text-slate-400 ml-1">— {schema.description}</span>
                            )}
                            {(selectedTool.parameters?.required ?? []).includes(key) && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </Label>
                          <Input
                            id={`exec-${key}`}
                            placeholder={schema.type ?? "string"}
                            value={paramValues[key] ?? ""}
                            onChange={(e) =>
                              setParamValues({ ...paramValues, [key]: e.target.value })
                            }
                            className="mt-1 dark:bg-slate-900 dark:border-slate-600 dark:text-white font-mono text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                      No parameters required.
                    </p>
                  )}

                  <Button
                    onClick={handleExecute}
                    disabled={executing}
                    className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white w-full"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {executing ? "Executing…" : "Execute"}
                  </Button>

                  {result && (
                    <div>
                      <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Result
                      </Label>
                      <Textarea
                        readOnly
                        value={result}
                        rows={10}
                        className="mt-1 font-mono text-xs dark:bg-slate-900 dark:border-slate-600 dark:text-green-400 resize-y"
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MCPClientPage;
