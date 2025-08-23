import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  getChannels,
  createChannel,
  getChannelMessages,
  sendMessage,
  joinChannel,
} from '@/services/chatService';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, Send, Loader2, Video, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';

// Define types for chat data
interface ChatChannel {
  id: number;
  name: string | null;
  description: string | null;
  channel_type: string;
  team_id: number | null;
  creator_id: number | null;
  created_at: string;
  participants: { user_id: number }[];
  messages: ChatMessage[];
}

interface ChatMessage {
  id: number;
  sender_id: number;
  content: string;
  created_at: string;
  sender: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    presence_status: string;
  };
}

const InternalChatPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(null);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newChannelName, setNewChannelName] = useState('');
  const ws = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  // WebSocket connection for real-time chat
  useEffect(() => {
    if (!selectedChannel?.id || !user?.id) {
      ws.current?.close();
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const token = localStorage.getItem('accessToken');
    const wsUrl = `${API_URL.replace('http', 'ws')}/api/v1/ws/chat/${selectedChannel.id}?token=${token}`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log(`Connected to WebSocket for channel ${selectedChannel.id}`);
    };

    ws.current.onmessage = (event) => {
      const newMessage = JSON.parse(event.data);
      // Invalidate query to refetch messages and update UI
      queryClient.invalidateQueries(['channelMessages', selectedChannel.id]);
      // Optionally, show a toast notification for new message
      if (newMessage.sender_id !== user.id) {
        toast({
          title: `New message in ${selectedChannel.name || 'Direct Message'}`,
          description: `${newMessage.sender.first_name || newMessage.sender.email}: ${newMessage.content}`,
        });
      }
    };

    ws.current.onclose = () => {
      console.log(`Disconnected from WebSocket for channel ${selectedChannel.id}`);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: 'WebSocket Error',
        description: 'Failed to connect to real-time chat. Please refresh.',
        variant: 'destructive',
      });
    };

    return () => {
      ws.current?.close();
    };
  }, [selectedChannel?.id, user?.id, queryClient, toast]);

  // Fetch channels
  const {
    data: channels,
    isLoading: isLoadingChannels,
    error: channelsError,
  } = useQuery<ChatChannel[], Error>({ queryKey: ['chatChannels'], queryFn: getChannels });

  // Query to check for active video call
  const { data: activeVideoCall } = useQuery({
    queryKey: ['activeVideoCall', selectedChannel?.id],
    queryFn: async () => {
      if (!selectedChannel?.id) return null;
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('accessToken');
      try {
        const response = await axios.get(
          `${API_URL}/api/v1/video-calls/channels/${selectedChannel.id}/active`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        return response.data; // Expecting { room_name, livekit_token, livekit_url } or similar
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return null; // No active call found
        }
        console.error('Error checking for active video call:', error);
        return null;
      }
    },
    enabled: !!selectedChannel?.id,
    refetchInterval: 5000, // Poll every 5 seconds to check for active calls
  });

  // Fetch messages for selected channel
  const {
    data: messages,
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useQuery<ChatMessage[], Error>({
    queryKey: ['channelMessages', selectedChannel?.id],
    queryFn: () => getChannelMessages(selectedChannel!.id),
    enabled: !!selectedChannel?.id,
    onSuccess: () => {
      scrollToBottom();
    },
  });

  // Create channel mutation
  const createChannelMutation = useMutation({
    mutationFn: createChannel,
    onSuccess: () => {
      queryClient.invalidateQueries(['chatChannels']);
      setNewChannelName('');
    },
    onError: (err) => {
      console.error('Failed to create channel:', err);
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => sendMessage(selectedChannel!.id, content),
    onSuccess: () => {
      queryClient.invalidateQueries(['channelMessages', selectedChannel?.id]);
      setInputValue('');
    },
    onError: (err) => {
      console.error('Failed to send message:', err);
    },
  });

  // Initiate video call mutation
  const initiateVideoCallMutation = useMutation({
    mutationFn: async (channelId: number) => {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('accessToken');
      const endpoint = activeVideoCall ? 
        `${API_URL}/api/v1/video-calls/channels/${channelId}/join` : 
        `${API_URL}/api/v1/video-calls/channels/${channelId}/initiate`;

      const response = await axios.post(
        endpoint,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      const { room_name, livekit_token, livekit_url } = data;
      navigate(
        `/internal-video-call?roomName=${room_name}&livekitToken=${livekit_token}&livekitUrl=${livekit_url}&channelId=${selectedChannel?.id}`
      );
    },
    onError: (err) => {
      console.error('Failed to initiate/join video call:', err);
      alert('Failed to initiate/join video call. Please try again.');
    },
  });

  const handleSendMessage = () => {
    if (inputValue.trim() && selectedChannel?.id) {
      sendMessageMutation.mutate(inputValue.trim());
    }
  };

  const handleCreateChannel = () => {
    if (newChannelName.trim()) {
      createChannelMutation.mutate({
        name: newChannelName.trim(),
        channel_type: 'TEAM', // Default to team channel for now
      });
    }
  };

  const handleVideoCallAction = () => {
    if (selectedChannel?.id) {
      initiateVideoCallMutation.mutate(selectedChannel.id);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (isLoadingChannels)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  if (channelsError)
    return (
      <div className="text-red-500 text-center p-4">
        Error loading channels: {channelsError.message}
      </div>
    );

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Left Sidebar: Channel List */}
      <Card className="w-80 flex-shrink-0 border-r dark:border-gray-700 rounded-none">
        <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
          <CardTitle className="text-lg">Channels</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => {}}>
            <Plus className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-2">
            <Input
              placeholder="New channel name"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateChannel()}
            />
            <Button
              onClick={handleCreateChannel}
              className="w-full mt-2"
              disabled={createChannelMutation.isLoading}
            >
              {createChannelMutation.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Create Channel'
              )}
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-180px)]">
            {channels?.map((channel) => (
              <div
                key={channel.id}
                className={cn(
                  'flex items-center p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800',
                  selectedChannel?.id === channel.id &&
                    'bg-blue-100 dark:bg-blue-900 hover:bg-blue-100 dark:hover:bg-blue-900'
                )}
                onClick={() => setSelectedChannel(channel)}
              >
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarFallback className="bg-blue-500 text-white">
                    {channel.name ? channel.name[0].toUpperCase() : '#'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{channel.name || 'Direct Message'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {channel.description || 'No description'}
                  </p>
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2 border-b dark:border-gray-700">
              <CardTitle className="text-xl">
                {selectedChannel.name || 'Direct Message'}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleVideoCallAction}
                disabled={initiateVideoCallMutation.isLoading}
              >
                {initiateVideoCallMutation.isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Video className="h-5 w-5" />
                )}
                {activeVideoCall ? "Join Call" : "Start Call"}
              </Button>
            </CardHeader>
            <CardContent className="flex-1 p-4 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {isLoadingMessages ? (
                    <div className="flex justify-center items-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : messagesError ? (
                    <div className="text-red-500 text-center p-4">
                      Error loading messages: {messagesError.message}
                    </div>
                  ) : (
                    messages?.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          'flex w-full',
                          msg.sender_id === user?.id ? 'justify-end' : 'justify-start'
                        )}
                      >
                        <div
                          className={cn(
                            'max-w-[85%] p-3 rounded-lg',
                            msg.sender_id === user?.id
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                          )}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="bg-transparent text-xs">
                                  {msg.sender_id === user?.id ? (
                                    <User size={14} />
                                  ) : (
                                    <Bot size={14} />
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-semibold">
                                {msg.sender_id === user?.id
                                  ? 'You'
                                  : msg.sender.first_name || msg.sender.email}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="prose prose-sm max-w-full dark:prose-invert">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
            <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  disabled={sendMessageMutation.isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={sendMessageMutation.isLoading}
                >
                  {sendMessageMutation.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Select a channel to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default InternalChatPage;
