
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Archive, 
  Star, 
  Clock, 
  User, 
  Send,
  Paperclip,
  MoreHorizontal,
  Tag,
  Phone,
  Video,
  UserPlus,
  Mail
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Conversation {
  id: string;
  customer: {
    name: string;
    email: string;
    avatar?: string;
  };
  status: 'open' | 'pending' | 'resolved' | 'snoozed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  lastMessage: string;
  timestamp: string;
  assignedAgent?: string;
  tags: string[];
  unreadCount: number;
}

interface Message {
  id: string;
  sender: 'customer' | 'agent';
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'file';
}

const mockConversations: Conversation[] = [
  {
    id: "1",
    customer: { name: "John Smith", email: "john@example.com" },
    status: "open",
    priority: "high",
    lastMessage: "I need help with my account",
    timestamp: "2 min ago",
    assignedAgent: "Sarah Johnson",
    tags: ["billing", "urgent"],
    unreadCount: 3
  },
  {
    id: "2",
    customer: { name: "Emily Davis", email: "emily@example.com" },
    status: "pending",
    priority: "medium",
    lastMessage: "Thanks for the help!",
    timestamp: "1 hour ago",
    tags: ["support"],
    unreadCount: 0
  }
];

const mockMessages: Message[] = [
  {
    id: "1",
    sender: "customer",
    content: "Hi, I'm having trouble accessing my account",
    timestamp: "10:30 AM",
    type: "text"
  },
  {
    id: "2",
    sender: "agent",
    content: "I'd be happy to help you with that. Can you provide your email address?",
    timestamp: "10:32 AM",
    type: "text"
  },
  {
    id: "3",
    sender: "customer",
    content: "Sure, it's john@example.com",
    timestamp: "10:33 AM",
    type: "text"
  }
];

export const ConversationManager = () => {
  const [selectedConversation, setSelectedConversation] = useState<string>("1");
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-gray-100 text-gray-800";
      case "snoozed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const selectedConv = mockConversations.find(c => c.id === selectedConversation);

  return (
    <div className="h-[800px] flex bg-white rounded-lg border overflow-hidden shadow-xl">
      {/* Conversations List */}
      <div className="w-1/3 border-r bg-gradient-to-b from-gray-50 to-white">
        <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Live Conversations</h3>
          </div>
          
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-blue-200 focus:border-blue-400 transition-colors"
            />
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4 text-xs bg-white/70 backdrop-blur-sm">
              <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">All</TabsTrigger>
              <TabsTrigger value="open" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white">Open</TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">Pending</TabsTrigger>
              <TabsTrigger value="resolved" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-gray-500 data-[state=active]:to-slate-500 data-[state=active]:text-white">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="overflow-y-auto h-full">
          {mockConversations.map((conv) => (
            <div
              key={conv.id}
              className={`p-4 border-b cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ${
                selectedConversation === conv.id ? 'bg-gradient-to-r from-blue-100 to-purple-100 border-l-4 border-l-blue-500 shadow-md' : ''
              }`}
              onClick={() => setSelectedConversation(conv.id)}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                      {conv.customer.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getPriorityColor(conv.priority)} shadow-lg`}></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm truncate">{conv.customer.name}</h4>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{conv.timestamp}</span>
                  </div>
                  
                  <p className="text-sm text-gray-600 truncate mb-2">{conv.lastMessage}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs shadow-sm ${getStatusColor(conv.status)}`}>
                        {conv.status}
                      </Badge>
                      {conv.tags.map((tag) => (
                        <span key={tag} className="text-xs bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 px-2 py-1 rounded-full shadow-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                    {conv.unreadCount > 0 && (
                      <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs animate-pulse shadow-lg">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-b from-white to-gray-50">
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-gradient-to-r from-white to-gray-50 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-blue-200 shadow-md">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                      {selectedConv.customer.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{selectedConv.customer.name}</h3>
                    <p className="text-sm text-gray-600">{selectedConv.customer.email}</p>
                  </div>
                  <Badge className={`${getStatusColor(selectedConv.status)} shadow-sm`}>
                    {selectedConv.status}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="hover:bg-green-50 hover:border-green-300 transition-colors">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="hover:bg-blue-50 hover:border-blue-300 transition-colors">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="hover:bg-purple-50 hover:border-purple-300 transition-colors">
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="hover:bg-gray-50 transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-blue-50">
              {mockMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'agent' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-md ${
                      msg.sender === 'agent'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${
                      msg.sender === 'agent' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-white shadow-inner">
              <div className="flex items-end gap-2">
                <Button size="sm" variant="outline" className="hover:bg-gray-50 transition-colors">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <Textarea
                    placeholder="Type your message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[60px] resize-none border-gray-200 focus:border-blue-400 transition-colors"
                  />
                </div>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <MessageSquare className="h-12 w-12 text-blue-600" />
              </div>
              <p className="text-lg font-medium text-gray-700">Select a conversation to start chatting</p>
              <p className="text-sm text-gray-500 mt-2">Choose from your active conversations to begin messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Customer Details Sidebar */}
      <div className="w-80 border-l bg-gradient-to-b from-gray-50 to-white p-4">
        {selectedConv && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h4 className="font-medium mb-3 text-gray-800">Customer Details</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{selectedConv.customer.name}</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{selectedConv.customer.email}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h4 className="font-medium mb-3 text-gray-800">Quick Actions</h4>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start hover:bg-blue-50 hover:border-blue-300 transition-colors">
                  <Tag className="h-4 w-4 mr-2" />
                  Add Tags
                </Button>
                <Button variant="outline" className="w-full justify-start hover:bg-green-50 hover:border-green-300 transition-colors">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Assign Agent
                </Button>
                <Button variant="outline" className="w-full justify-start hover:bg-yellow-50 hover:border-yellow-300 transition-colors">
                  <Clock className="h-4 w-4 mr-2" />
                  Snooze
                </Button>
                <Button variant="outline" className="w-full justify-start hover:bg-gray-50 transition-colors">
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h4 className="font-medium mb-3 text-gray-800">Previous Conversations</h4>
              <div className="space-y-2">
                <div className="p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border text-sm">
                  <p className="text-gray-600">No previous conversations found</p>
                  <p className="text-xs text-gray-500 mt-1">This is their first interaction</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
