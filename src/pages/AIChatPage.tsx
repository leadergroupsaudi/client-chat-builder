
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getAgents } from '@/services/agentService';
import { postChatMessage } from '@/services/aiChatService';
import { Agent } from '@/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: number;
  message: string;
  sender: 'user' | 'agent';
  timestamp: string;
}

const AIChatPage: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: agents, isLoading: isLoadingAgents } = useQuery<Agent[]>({ queryKey: ['agents'], queryFn: getAgents });

  const mutation = useMutation({
    mutationFn: (message: string) => postChatMessage(message, conversationId, selectedAgent?.id),
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { id: Date.now(), message: data.message, sender: 'agent', timestamp: new Date().toISOString() }]);
      if (!conversationId) {
        setConversationId(data.session_id);
      }
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      message: inputValue,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    mutation.mutate(inputValue);
    setInputValue('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-full flex bg-gray-50">
      {/* Conversation List */}
      <div className="w-1/4 border-r bg-white p-4">
        <h2 className="text-xl font-bold mb-4">Conversations</h2>
        <div className="w-full mb-4">
          <Select onValueChange={(value) => setSelectedAgent(agents?.find(a => a.id === parseInt(value)) || null)}>
            <SelectTrigger>
              <SelectValue placeholder="Select an agent (optional)" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingAgents ? (
                <SelectItem value="loading" disabled>Loading agents...</SelectItem>
              ) : (
                agents?.map(agent => (
                  <SelectItem key={agent.id} value={String(agent.id)}>{agent.name}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <ul>
          <li className="p-2 rounded-md bg-gray-100 cursor-pointer">Chat with Agent 1</li>
          <li className="p-2 rounded-md hover:bg-gray-100 cursor-pointer">Chat with Agent 2</li>
          <li className="p-2 rounded-md hover:bg-gray-100 cursor-pointer">Chat with Agent 3</li>
        </ul>
      </div>

      {/* Chat Window */}
      <div className="w-3/4 flex flex-col">
        <div className="p-4 h-full flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>AI Chat</CardTitle>
              <div className="w-64">
                <Select onValueChange={(value) => setSelectedAgent(agents?.find(a => a.id === parseInt(value)) || null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an agent (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingAgents ? (
                      <SelectItem value="loading" disabled>Loading agents...</SelectItem>
                    ) : (
                      agents?.map(agent => (
                        <SelectItem key={agent.id} value={String(agent.id)}>{agent.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden p-6">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-6">
                  {messages.map(msg => (
                    <div key={msg.id} className={cn('flex items-start gap-3', msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                      {msg.sender === 'agent' && (
                        <Avatar>
                          <AvatarFallback>{selectedAgent?.name.substring(0, 2).toUpperCase() || 'AI'}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className={cn('p-4 rounded-2xl max-w-md relative', msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none')}>
                        <p>{msg.message}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <form onSubmit={handleSendMessage} className="mt-6 flex items-center gap-3">
                <Input
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 p-4 rounded-full bg-gray-100 border-transparent focus:border-transparent focus:ring-2 focus:ring-blue-500"
                />
                <Button type="submit" disabled={mutation.isLoading} className="rounded-full w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white">
                  {mutation.isLoading ? <div className="loader"></div> : <Send className="h-6 w-6" />}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIChatPage;
