import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, RefreshCw, Play, Server } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const MCP_SERVER_URL = "http://127.0.0.1:8002/mcp";

interface McpTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

const paramCount = (tool: McpTool): number => {
  const props = tool.parameters?.properties ?? {};
  return Object.keys(props).length;
};

const ToolCard = ({ tool }: { tool: McpTool }) => {
  const { authFetch } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState("");
  const [executing, setExecuting] = useState(false);

  const props = tool.parameters?.properties ?? {};
  const hasParams = Object.keys(props).length > 0;

  const handleExecute = async () => {
    setExecuting(true);
    setResult("");
    try {
      // Build typed parameters
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

      const res = await authFetch("/api/v1/mcp/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: MCP_SERVER_URL,
          tool_name: tool.name,
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

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-slate-500" />
            )}
          </div>
          <div>
            <p className="font-mono font-semibold text-sm text-slate-900 dark:text-white">{tool.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{tool.description}</p>
          </div>
        </div>
        <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full shrink-0 ml-3">
          {paramCount(tool)} param{paramCount(tool) !== 1 ? "s" : ""}
        </span>
      </button>

      {expanded && (
        <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          {hasParams ? (
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Parameters
              </Label>
              {Object.entries(props).map(([key, schema]: [string, any]) => (
                <div key={key}>
                  <Label htmlFor={`${tool.name}-${key}`} className="text-sm dark:text-gray-300">
                    {key}
                    {schema.description && (
                      <span className="text-xs text-slate-400 ml-1">— {schema.description}</span>
                    )}
                  </Label>
                  <Input
                    id={`${tool.name}-${key}`}
                    placeholder={schema.type ?? "string"}
                    value={paramValues[key] ?? ""}
                    onChange={(e) => setParamValues({ ...paramValues, [key]: e.target.value })}
                    className="mt-1 dark:bg-slate-800 dark:border-slate-600 dark:text-white font-mono text-sm"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">No parameters required.</p>
          )}

          <Button
            onClick={handleExecute}
            disabled={executing}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white w-full"
          >
            <Play className="h-4 w-4 mr-2" />
            {executing ? "Executing…" : "Execute Tool"}
          </Button>

          {result && (
            <div>
              <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Result
              </Label>
              <Textarea
                readOnly
                value={result}
                rows={8}
                className="mt-1 font-mono text-xs dark:bg-slate-800 dark:border-slate-600 dark:text-green-400 resize-y"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MCPServerPage = () => {
  const { authFetch } = useAuth();
  const [status, setStatus] = useState<"checking" | "online" | "offline">("checking");
  const [tools, setTools] = useState<McpTool[]>([]);
  const [error, setError] = useState("");

  const inspect = async () => {
    setStatus("checking");
    setError("");
    try {
      const res = await authFetch("/api/v1/mcp/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: MCP_SERVER_URL }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.tools)) {
        setTools(data.tools);
        setStatus("online");
      } else {
        setError(data.detail ?? "Failed to inspect server");
        setStatus("offline");
      }
    } catch (err: any) {
      setError(err.message ?? "Connection failed");
      setStatus("offline");
    }
  };

  useEffect(() => {
    inspect();
  }, []);

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            MCP Server
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Automax Incident MCP Server — admin testing panel
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500 font-mono mt-1">{MCP_SERVER_URL}</p>
        </div>
        <Button
          variant="outline"
          onClick={inspect}
          disabled={status === "checking"}
          className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${status === "checking" ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Status Card */}
      <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div
              className={`h-3 w-3 rounded-full ${
                status === "online"
                  ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.7)]"
                  : status === "offline"
                  ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.7)]"
                  : "bg-yellow-400 animate-pulse"
              }`}
            />
            <span className="font-semibold dark:text-white">
              {status === "online" ? "Server Online" : status === "offline" ? "Server Offline" : "Connecting…"}
            </span>
            {status === "online" && (
              <span className="text-sm text-slate-500 dark:text-slate-400">
                — {tools.length} tool{tools.length !== 1 ? "s" : ""} available
              </span>
            )}
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2 ml-6">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Tools List */}
      {status === "online" && tools.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800">
          <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Server className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Available Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            {tools.map((tool) => (
              <ToolCard key={tool.name} tool={tool} />
            ))}
          </CardContent>
        </Card>
      )}

      {status === "offline" && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <CardContent className="pt-6 text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/50 mb-4">
              <Server className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">Server Unreachable</h3>
            <p className="text-red-600 dark:text-red-400 mt-1 text-sm">
              Make sure the Automax MCP server is running:
            </p>
            <p className="mt-2 font-mono text-sm bg-red-100 dark:bg-red-900/50 rounded px-4 py-2 inline-block text-red-800 dark:text-red-300">
              python app/mcp/automax_mcp.py
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MCPServerPage;
