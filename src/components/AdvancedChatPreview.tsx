
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, Minimize2, X, Settings, Palette, Code, Webhook } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const AdvancedChatPreview = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState("");
  const [customization, setCustomization] = useState({
    primaryColor: "#3B82F6",
    headerTitle: "Customer Support",
    welcomeMessage: "Hi! How can I help you today?",
    position: "bottom-right",
    borderRadius: "12",
    fontFamily: "Inter"
  });
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: customization.welcomeMessage,
      sender: "bot",
      timestamp: new Date()
    }
  ]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      text: message,
      sender: "user" as const,
      timestamp: new Date()
    };

    setMessages([...messages, newMessage]);
    setMessage("");

    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: "Thanks for your message! Our team will get back to you shortly.",
        sender: "bot" as const,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const updateCustomization = (key: string, value: string) => {
    setCustomization(prev => ({ ...prev, [key]: value }));
    if (key === "welcomeMessage") {
      setMessages([{
        id: 1,
        text: value,
        sender: "bot",
        timestamp: new Date()
      }]);
    }
  };

  const generateEmbedCode = () => {
    return `<script>
  (function() {
    var config = ${JSON.stringify(customization, null, 2)};
    var script = document.createElement('script');
    script.src = 'https://agentconnect.dev/widget.js';
    script.setAttribute('data-config', JSON.stringify(config));
    document.head.appendChild(script);
  })();
</script>`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Customization Panel */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Widget Customization
          </CardTitle>
          <CardDescription>
            Customize your chat widget appearance and behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="appearance" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="behavior">Behavior</TabsTrigger>
              <TabsTrigger value="embed">Embed Code</TabsTrigger>
            </TabsList>
            
            <TabsContent value="appearance" className="space-y-4">
              <div>
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex items-center space-x-3 mt-2">
                  <input
                    type="color"
                    id="primaryColor"
                    value={customization.primaryColor}
                    onChange={(e) => updateCustomization("primaryColor", e.target.value)}
                    className="w-12 h-8 rounded border cursor-pointer"
                  />
                  <Input
                    value={customization.primaryColor}
                    onChange={(e) => updateCustomization("primaryColor", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="borderRadius">Border Radius</Label>
                <Input
                  id="borderRadius"
                  type="range"
                  min="0"
                  max="24"
                  value={customization.borderRadius}
                  onChange={(e) => updateCustomization("borderRadius", e.target.value)}
                  className="mt-2"
                />
                <span className="text-sm text-gray-500">{customization.borderRadius}px</span>
              </div>

              <div>
                <Label htmlFor="fontFamily">Font Family</Label>
                <select
                  id="fontFamily"
                  value={customization.fontFamily}
                  onChange={(e) => updateCustomization("fontFamily", e.target.value)}
                  className="w-full mt-2 p-2 border rounded-md"
                >
                  <option value="Inter">Inter</option>
                  <option value="Arial">Arial</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                </select>
              </div>
            </TabsContent>

            <TabsContent value="behavior" className="space-y-4">
              <div>
                <Label htmlFor="headerTitle">Header Title</Label>
                <Input
                  id="headerTitle"
                  value={customization.headerTitle}
                  onChange={(e) => updateCustomization("headerTitle", e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="welcomeMessage">Welcome Message</Label>
                <Input
                  id="welcomeMessage"
                  value={customization.welcomeMessage}
                  onChange={(e) => updateCustomization("welcomeMessage", e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="position">Widget Position</Label>
                <select
                  id="position"
                  value={customization.position}
                  onChange={(e) => updateCustomization("position", e.target.value)}
                  className="w-full mt-2 p-2 border rounded-md"
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </select>
              </div>
            </TabsContent>

            <TabsContent value="embed" className="space-y-4">
              <div>
                <Label>Embed Code</Label>
                <div className="mt-2 p-4 bg-gray-900 text-green-400 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{generateEmbedCode()}</pre>
                </div>
                <Button 
                  className="mt-2 w-full"
                  onClick={() => navigator.clipboard.writeText(generateEmbedCode())}
                >
                  <Code className="h-4 w-4 mr-2" />
                  Copy Embed Code
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Live Preview
          </CardTitle>
          <CardDescription>
            See how your widget will look on client websites
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-lg min-h-[500px] relative overflow-hidden"
            style={{ fontFamily: customization.fontFamily }}
          >
            {/* Simulated website background */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-4 opacity-75">
              <div className="h-3 bg-gray-200 rounded mb-3 w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded mb-3 w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
            
            {/* Chat Widget */}
            <div className={`absolute ${customization.position.includes('bottom') ? 'bottom-6' : 'top-6'} ${customization.position.includes('right') ? 'right-6' : 'left-6'}`}>
              {isExpanded ? (
                <div 
                  className="bg-white rounded-lg shadow-2xl w-80 h-96 flex flex-col animate-scale-in"
                  style={{ borderRadius: `${customization.borderRadius}px` }}
                >
                  {/* Header */}
                  <div 
                    className="text-white p-4 flex items-center justify-between"
                    style={{ 
                      backgroundColor: customization.primaryColor,
                      borderRadius: `${customization.borderRadius}px ${customization.borderRadius}px 0 0`
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback style={{ backgroundColor: `${customization.primaryColor}20` }}>
                          CS
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{customization.headerTitle}</div>
                        <div className="text-xs opacity-90">Online</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20 p-1 h-6 w-6"
                        onClick={() => setIsExpanded(false)}
                      >
                        <Minimize2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20 p-1 h-6 w-6"
                        onClick={() => setIsExpanded(false)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                            msg.sender === "user"
                              ? "text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                          style={msg.sender === "user" ? { backgroundColor: customization.primaryColor } : {}}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t">
                    <div className="flex space-x-2">
                      <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 text-sm"
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      />
                      <Button 
                        size="sm" 
                        onClick={handleSendMessage}
                        style={{ backgroundColor: customization.primaryColor }}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  className="rounded-full h-14 w-14 shadow-xl hover:scale-110 transition-transform duration-200"
                  style={{ backgroundColor: customization.primaryColor }}
                  onClick={() => setIsExpanded(true)}
                >
                  <MessageSquare className="h-6 w-6" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
