
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MessageSquare, Settings, BarChart3, Code, Users, Bot, Palette, Webhook, Inbox, FileText, Sparkles, Zap, TrendingUp } from "lucide-react";
import { AgentList } from "@/components/AgentList";
import { CreateAgentDialog } from "@/components/CreateAgentDialog";
import { AdvancedChatPreview } from "@/components/AdvancedChatPreview";
import { AgentBuilder } from "@/components/AgentBuilder";
import { UserManagement } from "@/components/UserManagement";
import { ConversationManager } from "@/components/ConversationManager";
import { Reports } from "@/components/Reports";
import { Settings as SettingsComponent } from "@/components/Settings";

const Dashboard = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-br from-purple-300/20 to-pink-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-8 w-64 h-64 bg-gradient-to-br from-blue-300/20 to-cyan-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-8 right-1/3 w-48 h-48 bg-gradient-to-br from-green-300/20 to-emerald-300/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-white/30 sticky top-0 z-50 shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-lg animate-scale-in">
                  <MessageSquare className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900 bg-clip-text text-transparent">
                    AgentConnect
                  </h1>
                  <p className="text-sm text-gray-600 font-medium">Enterprise Chat Platform</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1 text-green-600 font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Live Status
                </div>
              </div>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)} 
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Agent
                <Sparkles className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Active Agents</p>
                    <p className="text-4xl font-bold mt-1">12</p>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="h-3 w-3 text-green-300" />
                      <p className="text-blue-200 text-xs">+2 this week</p>
                    </div>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Bot className="h-8 w-8 text-blue-100" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Live Conversations</p>
                    <p className="text-4xl font-bold mt-1">247</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Zap className="h-3 w-3 text-yellow-300" />
                      <p className="text-green-200 text-xs">8 websites active</p>
                    </div>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <MessageSquare className="h-8 w-8 text-green-100" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Response Rate</p>
                    <p className="text-4xl font-bold mt-1">98.5%</p>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="h-3 w-3 text-green-300" />
                      <p className="text-purple-200 text-xs">+5% improvement</p>
                    </div>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <BarChart3 className="h-8 w-8 text-purple-100" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Satisfaction</p>
                    <p className="text-4xl font-bold mt-1">4.9★</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Sparkles className="h-3 w-3 text-yellow-300" />
                      <p className="text-orange-200 text-xs">Average rating</p>
                    </div>
                  </div>
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Settings className="h-8 w-8 text-orange-100" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Tabs */}
          <Tabs defaultValue="conversations" className="space-y-6">
            <TabsList className="bg-white/60 backdrop-blur-xl border border-white/30 shadow-xl p-1 grid grid-cols-7 rounded-2xl">
              <TabsTrigger value="conversations" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 rounded-xl transition-all duration-200">
                <Inbox className="h-4 w-4" />
                <span className="hidden sm:inline">Conversations</span>
              </TabsTrigger>
              <TabsTrigger value="agents" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-purple-600 rounded-xl transition-all duration-200">
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">Agents</span>
              </TabsTrigger>
              <TabsTrigger value="builder" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-green-600 rounded-xl transition-all duration-200">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Builder</span>
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-pink-600 rounded-xl transition-all duration-200">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Designer</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-orange-600 rounded-xl transition-all duration-200">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Team</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Reports</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-gray-600 rounded-xl transition-all duration-200">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="conversations" className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-purple-900 bg-clip-text text-transparent">Live Conversations</h2>
                  <p className="text-gray-600 mt-1">Manage customer conversations in real-time with advanced features</p>
                </div>
              </div>
              <ConversationManager />
            </TabsContent>

            <TabsContent value="agents" className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-900 to-pink-900 bg-clip-text text-transparent">Your AI Agents</h2>
                  <p className="text-gray-600 mt-1">Create and manage intelligent chat agents for your clients</p>
                </div>
              </div>
              <AgentList />
            </TabsContent>

            <TabsContent value="builder" className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-green-900 to-emerald-900 bg-clip-text text-transparent">Agent Builder</h2>
                  <p className="text-gray-600 mt-1">Design conversation flows with drag-and-drop interface</p>
                </div>
              </div>
              <AgentBuilder />
            </TabsContent>

            <TabsContent value="preview" className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-900 to-red-900 bg-clip-text text-transparent">Widget Designer</h2>
                  <p className="text-gray-600 mt-1">Customize appearance and generate embed codes</p>
                </div>
              </div>
              <AdvancedChatPreview />
            </TabsContent>

            <TabsContent value="users" className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-900 to-yellow-900 bg-clip-text text-transparent">Team Management</h2>
                  <p className="text-gray-600 mt-1">Manage users, teams, and permissions</p>
                </div>
              </div>
              <UserManagement />
            </TabsContent>

            <TabsContent value="reports" className="space-y-6 animate-fade-in">
              <Reports />
            </TabsContent>

            <TabsContent value="settings" className="space-y-6 animate-fade-in">
              <SettingsComponent />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <CreateAgentDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
      />
    </div>
  );
};

export default Dashboard;
