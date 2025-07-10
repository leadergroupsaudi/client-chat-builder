
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, MessageSquare, Settings, BarChart3, Code, Users, Bot, Palette, Webhook } from "lucide-react";
import { AgentList } from "@/components/AgentList";
import { CreateAgentDialog } from "@/components/CreateAgentDialog";
import { AdvancedChatPreview } from "@/components/AdvancedChatPreview";
import { AgentBuilder } from "@/components/AgentBuilder";
import { UserManagement } from "@/components/UserManagement";

const Dashboard = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 sticky top-0 z-40 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    AgentConnect
                  </h1>
                  <p className="text-sm text-gray-600">Next-generation chat platform</p>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)} 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Agent
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Active Agents</p>
                    <p className="text-3xl font-bold">12</p>
                    <p className="text-blue-200 text-xs mt-1">+2 this week</p>
                  </div>
                  <Bot className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Live Conversations</p>
                    <p className="text-3xl font-bold">247</p>
                    <p className="text-green-200 text-xs mt-1">Across 8 websites</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Response Rate</p>
                    <p className="text-3xl font-bold">98.5%</p>
                    <p className="text-purple-200 text-xs mt-1">+5% improvement</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Satisfaction</p>
                    <p className="text-3xl font-bold">4.9★</p>
                    <p className="text-orange-200 text-xs mt-1">Average rating</p>
                  </div>
                  <Settings className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Tabs */}
          <Tabs defaultValue="agents" className="space-y-6">
            <TabsList className="bg-white/50 backdrop-blur-sm border border-white/20 shadow-sm p-1">
              <TabsTrigger value="agents" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Bot className="h-4 w-4" />
                Agents
              </TabsTrigger>
              <TabsTrigger value="builder" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Settings className="h-4 w-4" />
                Agent Builder
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Palette className="h-4 w-4" />
                Widget Designer
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Users className="h-4 w-4" />
                Team
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="agents" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Your AI Agents</h2>
                  <p className="text-gray-600">Create and manage intelligent chat agents for your clients</p>
                </div>
              </div>
              <AgentList />
            </TabsContent>

            <TabsContent value="builder" className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Agent Builder</h2>
                  <p className="text-gray-600">Design conversation flows and configure agent behavior</p>
                </div>
              </div>
              <AgentBuilder />
            </TabsContent>

            <TabsContent value="preview" className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Widget Designer</h2>
                  <p className="text-gray-600">Customize the appearance and generate embed codes</p>
                </div>
              </div>
              <AdvancedChatPreview />
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
                  <p className="text-gray-600">Manage users, teams, and permissions</p>
                </div>
              </div>
              <UserManagement />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Card className="bg-white/50 backdrop-blur-sm border border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                    Analytics & Performance
                  </CardTitle>
                  <CardDescription>
                    Comprehensive insights into your agent performance and user engagement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Advanced Analytics Coming Soon</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Get detailed insights into conversation metrics, user satisfaction, agent performance, and more.
                    </p>
                  </div>
                </CardContent>
              </Card>
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
