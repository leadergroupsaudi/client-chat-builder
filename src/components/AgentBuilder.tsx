
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  MessageSquare, 
  Webhook, 
  Zap, 
  Plus, 
  Trash2, 
  GripVertical,
  Settings,
  Brain,
  Globe,
  Database
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FlowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'response';
  title: string;
  content: string;
  position: { x: number; y: number };
}

export const AgentBuilder = () => {
  const [agentConfig, setAgentConfig] = useState({
    name: "New Agent",
    description: "Intelligent customer support agent",
    avatar: "",
    personality: "helpful",
    language: "en",
    timezone: "UTC"
  });

  const [webhooks, setWebhooks] = useState([
    {
      id: "1",
      name: "Slack Notification",
      url: "https://hooks.slack.com/services/...",
      trigger: "new_message",
      active: true
    },
    {
      id: "2",
      name: "CRM Integration",
      url: "https://api.hubspot.com/webhook",
      trigger: "conversation_end",
      active: false
    }
  ]);

  const [flowNodes, setFlowNodes] = useState<FlowNode[]>([
    {
      id: "1",
      type: "trigger",
      title: "User Says Hello",
      content: "greeting, hi, hello, hey",
      position: { x: 100, y: 100 }
    },
    {
      id: "2",
      type: "response",
      title: "Welcome Response",
      content: "Hi there! How can I help you today?",
      position: { x: 400, y: 100 }
    }
  ]);

  const nodeTypes = [
    { type: 'trigger', icon: Zap, label: 'Trigger', color: 'bg-yellow-500' },
    { type: 'condition', icon: Brain, label: 'Condition', color: 'bg-purple-500' },
    { type: 'action', icon: Settings, label: 'Action', color: 'bg-blue-500' },
    { type: 'response', icon: MessageSquare, label: 'Response', color: 'bg-green-500' }
  ];

  const addWebhook = () => {
    const newWebhook = {
      id: Date.now().toString(),
      name: "New Webhook",
      url: "",
      trigger: "new_message",
      active: false
    };
    setWebhooks([...webhooks, newWebhook]);
  };

  const updateWebhook = (id: string, field: string, value: string | boolean) => {
    setWebhooks(webhooks.map(webhook => 
      webhook.id === id ? { ...webhook, [field]: value } : webhook
    ));
  };

  const removeWebhook = (id: string) => {
    setWebhooks(webhooks.filter(webhook => webhook.id !== id));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-blue-600" />
            Agent Configuration
          </CardTitle>
          <CardDescription>
            Configure your agent's personality, behavior, and integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="flow">Conversation Flow</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg">
                        {agentConfig.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Label htmlFor="agentName">Agent Name</Label>
                      <Input
                        id="agentName"
                        value={agentConfig.name}
                        onChange={(e) => setAgentConfig({...agentConfig, name: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={agentConfig.description}
                      onChange={(e) => setAgentConfig({...agentConfig, description: e.target.value})}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="personality">Personality</Label>
                    <select
                      id="personality"
                      value={agentConfig.personality}
                      onChange={(e) => setAgentConfig({...agentConfig, personality: e.target.value})}
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="helpful">Helpful & Professional</option>
                      <option value="friendly">Friendly & Casual</option>
                      <option value="formal">Formal & Business</option>
                      <option value="enthusiastic">Enthusiastic & Energetic</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="language">Language</Label>
                    <select
                      id="language"
                      value={agentConfig.language}
                      onChange={(e) => setAgentConfig({...agentConfig, language: e.target.value})}
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <select
                      id="timezone"
                      value={agentConfig.timezone}
                      onChange={(e) => setAgentConfig({...agentConfig, timezone: e.target.value})}
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="flow" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Conversation Flow Builder</h3>
                <div className="flex gap-2">
                  {nodeTypes.map((nodeType) => {
                    const IconComponent = nodeType.icon;
                    return (
                      <Button
                        key={nodeType.type}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <div className={`w-3 h-3 rounded-full ${nodeType.color}`}></div>
                        <IconComponent className="h-4 w-4" />
                        {nodeType.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 min-h-[400px] bg-gray-50 relative">
                <div className="text-center text-gray-500">
                  <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Drag & Drop Flow Builder</p>
                  <p className="text-sm">Create your conversation logic by connecting nodes</p>
                </div>

                {/* Sample Flow Nodes */}
                <div className="absolute top-4 left-4 space-y-4">
                  {flowNodes.map((node) => {
                    const nodeType = nodeTypes.find(t => t.type === node.type);
                    const IconComponent = nodeType?.icon || MessageSquare;
                    return (
                      <div
                        key={node.id}
                        className="bg-white p-3 rounded-lg shadow-md border-l-4 border-blue-500 min-w-[200px] cursor-move hover:shadow-lg transition-shadow"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <IconComponent className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-sm">{node.title}</span>
                          <GripVertical className="h-4 w-4 text-gray-400 ml-auto" />
                        </div>
                        <p className="text-xs text-gray-600 truncate">{node.content}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="webhooks" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Webhook Integrations</h3>
                <Button onClick={addWebhook} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Webhook
                </Button>
              </div>

              <div className="space-y-4">
                {webhooks.map((webhook) => (
                  <Card key={webhook.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <Webhook className="h-5 w-5 text-orange-600" />
                            <Input
                              value={webhook.name}
                              onChange={(e) => updateWebhook(webhook.id, 'name', e.target.value)}
                              className="font-medium"
                              placeholder="Webhook name"
                            />
                            <Badge variant={webhook.active ? "default" : "secondary"}>
                              {webhook.active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs">Webhook URL</Label>
                              <Input
                                value={webhook.url}
                                onChange={(e) => updateWebhook(webhook.id, 'url', e.target.value)}
                                placeholder="https://api.example.com/webhook"
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Trigger Event</Label>
                              <select
                                value={webhook.trigger}
                                onChange={(e) => updateWebhook(webhook.id, 'trigger', e.target.value)}
                                className="w-full p-2 border rounded-md text-sm"
                              >
                                <option value="new_message">New Message</option>
                                <option value="conversation_start">Conversation Start</option>
                                <option value="conversation_end">Conversation End</option>
                                <option value="agent_handoff">Agent Handoff</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateWebhook(webhook.id, 'active', !webhook.active)}
                          >
                            {webhook.active ? "Disable" : "Enable"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeWebhook(webhook.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="integrations" className="space-y-6">
              <h3 className="text-lg font-semibold">Platform Integrations</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: "Slack", icon: MessageSquare, color: "bg-purple-500", connected: true },
                  { name: "Discord", icon: MessageSquare, color: "bg-indigo-500", connected: false },
                  { name: "Zapier", icon: Zap, color: "bg-orange-500", connected: true },
                  { name: "HubSpot", icon: Database, color: "bg-orange-600", connected: false },
                  { name: "Salesforce", icon: Database, color: "bg-blue-600", connected: false },
                  { name: "Custom API", icon: Globe, color: "bg-gray-500", connected: false }
                ].map((integration) => {
                  const IconComponent = integration.icon;
                  return (
                    <Card key={integration.name} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${integration.color}`}>
                              <IconComponent className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium">{integration.name}</h4>
                              <p className="text-xs text-gray-500">
                                {integration.connected ? "Connected" : "Not connected"}
                              </p>
                            </div>
                          </div>
                          <Badge variant={integration.connected ? "default" : "outline"}>
                            {integration.connected ? "Active" : "Setup"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
