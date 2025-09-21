import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  getChannels,
  createChannel,
  getChannelMessages,
  getChannelMembers,
  createChannelMessage,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User, Send, Loader2, Video, Plus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import { useToast } from '@/components/ui/use-toast';
import CreateChannelModal from '@/components/CreateChannelModal';
import ManageChannelMembersModal from '@/components/ManageChannelMembersModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useWebSocket } from '@/hooks/use-websocket';

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
    profile_picture_url?: string;
    presence_status: string;
  };
}

interface UserPresence {
  [key: number]: 'online' | 'offline';
}

interface ActiveVideoCall {
  room_name: string;
  livekit_token: string;
  livekit_url: string;
}

const InternalChatPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(null);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isCreateChannelModalOpen, setCreateChannelModalOpen] = useState(false);
  const [isManageMembersModalOpen, setManageMembersModalOpen] = useState(false);
  const [userPresences, setUserPresences] = useState<UserPresence>({});
  const [activeVideoCallInfo, setActiveVideoCallInfo] = useState<ActiveVideoCall | null>(null);
  const { toast } = useToast();

  const wsUrl = selectedChannel?.id
    ? `${(import.meta.env.VITE_API_URL || 'http://localhost:8000').replace('http', 'ws')}/api/v1/ws/wschat/${selectedChannel.id}?token=${localStorage.getItem('accessToken')}`
    : null;

  useWebSocket(wsUrl, {
    onMessage: (event) => {
      const wsMessage = JSON.parse(event.data);
      if (wsMessage.type === 'new_message') {
        const newMessage = wsMessage.payload;
        queryClient.setQueryData<ChatMessage[]>(['channelMessages', selectedChannel!.id], (oldMessages = []) => {
          if (oldMessages.some(msg => msg.id === newMessage.id)) {
            return oldMessages;
          }
          return [...oldMessages, newMessage];
        });
      } else if (wsMessage.type === 'presence_update') {
        const { user_id, status } = wsMessage.payload;
        setUserPresences(prevPresences => ({
          ...prevPresences,
          [user_id]: status,
        }));
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: 'WebSocket Error',
        description: 'Failed to connect to real-time chat. Please refresh.',
        variant: 'destructive',
      });
    }
  });

  // Fetch channels
  const {
    data: channels,
    isLoading: isLoadingChannels,
    error: channelsError,
  } = useQuery<ChatChannel[], Error>({ queryKey: ['chatChannels'], queryFn: getChannels });

  const { data: channelMembers } = useQuery<any[], Error>({
    queryKey: ['channelMembers', selectedChannel?.id],
    queryFn: () => getChannelMembers(selectedChannel!.id),
    enabled: !!selectedChannel?.id,
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
    onSuccess: (data) => {
      console.log("Messages after successful fetch:", data);
      const presences: UserPresence = {};
      data.forEach(msg => {
        presences[msg.sender.id] = msg.sender.presence_status as 'online' | 'offline';
      });
      setUserPresences(presences);
      scrollToBottom();
    },
  });

  // Create channel mutation
  const createChannelMutation = useMutation({
    mutationFn: (channelData: { name: string; description: string }) => createChannel({
      name: channelData.name,
      description: channelData.description,
      channel_type: 'TEAM', // Default to team channel for now
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatChannels'] });
      setCreateChannelModalOpen(false);
      toast({
        title: 'Channel Created',
        description: 'Your new channel has been created successfully.',
      });
    },
    onError: (err) => {
      console.error('Failed to create channel:', err);
      toast({
        title: 'Error',
        description: 'Failed to create channel. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const createMessageMutation = useMutation({
    mutationFn: ({ channelId, content }: { channelId: number; content: string }) =>
      createChannelMessage(channelId, content),
    onSuccess: () => {
      // The message will be added via WebSocket, so we don't need to invalidate here.
      // queryClient.invalidateQueries({ queryKey: ['channelMessages', selectedChannel?.id] });
    },
    onError: (err) => {
      console.error('Failed to send message:', err);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Initiate video call mutation
  const initiateVideoCallMutation = useMutation({
    mutationFn: async (channelId: number) => {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('accessToken');
      const endpoint = `${API_URL}/api/v1/video-calls/channels/${channelId}/initiate`;

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
      console.error('Failed to initiate video call:', err);
      alert('Failed to initiate video call. Please try again.');
    },
  });

  const handleSendMessage = () => {
    if (inputValue.trim() && selectedChannel?.id) {
      createMessageMutation.mutate({ channelId: selectedChannel.id, content: inputValue.trim() });
      setInputValue('');
    }
  };

  const handleCreateChannel = (name: string, description: string) => {
    createChannelMutation.mutate({ name, description });
  };

  const handleVideoCallAction = () => {
    if (activeVideoCallInfo) {
      navigate(
        `/internal-video-call?roomName=${activeVideoCallInfo.room_name}&livekitToken=${activeVideoCallInfo.livekit_token}&livekitUrl=${activeVideoCallInfo.livekit_url}&channelId=${selectedChannel?.id}`
      );
    } else if (selectedChannel?.id) {
      initiateVideoCallMutation.mutate(selectedChannel.id);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
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
    <TooltipProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
        {/* Left Sidebar: Channel List */}
        <Card className="w-80 flex-shrink-0 border-r dark:border-gray-800 rounded-none bg-white dark:bg-gray-900">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <CardTitle className="text-xl font-bold">Channels</CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setCreateChannelModalOpen(true)}>
                  <Plus className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create Channel</p>
              </TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-80px)]">
              {channels?.map((channel) => (
                <div
                  key={channel.id}
                  className={cn(
                    'flex items-center p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200',
                    selectedChannel?.id === channel.id &&
                      'bg-blue-50 dark:bg-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/50'
                  )}
                  onClick={() => setSelectedChannel(channel)}
                >
                  <Avatar className="h-10 w-10 mr-4">
                    <AvatarFallback className="bg-blue-500 text-white font-bold">
                      {channel.name ? channel.name[0].toUpperCase() : '#'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-md">{channel.name || 'Direct Message'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {channel.description || 'No description'}
                    </p>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
          {selectedChannel ? (
            <>
              <CardHeader className="flex flex-row items-center justify-between p-4 border-b dark:border-gray-700">
                <div>
                  <CardTitle className="text-2xl font-bold">{selectedChannel.name || 'Direct Message'}</CardTitle>
                  <div className="flex items-center mt-2">
                    <div className="flex -space-x-2 overflow-hidden">
                      {channelMembers?.slice(0, 3).map((member: any) => (
                        <Avatar key={member.user?.id} className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-gray-800">
                          <AvatarImage src={member.user?.profile_picture_url} />
                          <AvatarFallback>{member.user?.first_name?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400">{channelMembers?.length} members</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setManageMembersModalOpen(true)}
                      >
                        <Users className="h-6 w-6" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Manage Members</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleVideoCallAction}
                        disabled={initiateVideoCallMutation.isLoading}
                        className="bg-green-500 hover:bg-green-600 text-white rounded-full w-12 h-12"
                      >
                        {initiateVideoCallMutation.isLoading ? (
                          <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                          <Video className="h-6 w-6" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{activeVideoCallInfo ? "Join Call" : "Start Call"}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-6 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-6">
                    {isLoadingMessages ? (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
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
                            'flex w-full items-end gap-3',
                            msg.sender_id === user?.id ? 'justify-end' : 'justify-start'
                          )}
                        >
                          {msg.sender_id !== user?.id && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={msg.sender?.profile_picture_url} />
                              <AvatarFallback>{msg.sender?.first_name?.[0] || 'U'}</AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={cn(
                              'max-w-[70%] p-4 rounded-2xl',
                              msg.sender_id === user?.id
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-none'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none'
                            )}
                          >
                            <div className="flex items-center justify-between gap-4 mb-2">
                              <span className="text-sm font-bold">
                                {msg.sender_id === user?.id
                                  ? 'You'
                                  : msg.sender?.first_name || msg.sender?.email}
                              </span>
                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                {new Date(msg.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <div className="prose prose-sm max-w-full dark:prose-invert text-white">
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
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Type your message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 p-4 rounded-full bg-gray-100 dark:bg-gray-700 border-transparent focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    onClick={handleSendMessage}
                    className="rounded-full w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Send className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xl">
              <p>Select a channel to start chatting</p>
            </div>
          )}
        </div>
      </div>
      <CreateChannelModal
        isOpen={isCreateChannelModalOpen}
        onClose={() => setCreateChannelModalOpen(false)}
        onSubmit={handleCreateChannel}
        isLoading={createChannelMutation.isLoading}
      />
      {selectedChannel && (
        <ManageChannelMembersModal
          isOpen={isManageMembersModalOpen}
          onClose={() => setManageMembersModalOpen(false)}
          channelId={selectedChannel.id}
          userPresences={userPresences}
        />
      )}
    </TooltipProvider>
  );
};

export default InternalChatPage;
