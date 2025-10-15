import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConversationDetail } from '@/components/ConversationDetail';
import { ContactProfile } from '@/components/ContactProfile';
import { useWebSocket } from '@/hooks/use-websocket';
import { toast } from '@/hooks/use-toast';
import { Session, User } from '@/types';
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Phone, Globe, Instagram, Mail, Send } from 'lucide-react'; // Icons for channels

const ConversationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, token, authFetch, isLoading: isAuthLoading } = useAuth();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const companyId = useMemo(() => user?.company_id, [user]);

  const { data: users } = useQuery<User[]>({
    queryKey: ['users', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const response = await authFetch(`/api/v1/users/`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    enabled: !!companyId,
  });

  const { data: sessions, isLoading: isLoadingSessions } = useQuery<Session[]>({
    queryKey: ['sessions', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      const response = await authFetch(`/api/v1/conversations/sessions`);
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    },
    enabled: !!companyId,
  });

  const wsUrl = companyId ? `ws://${window.location.host}/api/v1/ws/updates/ws/${companyId}?token=${token}` : null;

  // Connect to the company-wide WebSocket for real-time updates
  useWebSocket(
    wsUrl,
    {
      onMessage: (event) => {
        const eventData = JSON.parse(event.data);
        if (eventData.type === 'new_message') {
          toast({
            title: "New Message",
            description: `New message in session: ${eventData.session.conversation_id}`,
          });
          // Invalidate queries to refetch session list
          queryClient.invalidateQueries({ queryKey: ['sessions', companyId] });
          // If the updated session is the one currently selected, invalidate its messages too
          if (selectedSessionId === eventData.session.conversation_id) {
            queryClient.invalidateQueries({ queryKey: ['messages', selectedSessionId, companyId] });
          }
        }
      },
      enabled: !!wsUrl,
    }
  );

  const getAssigneeEmail = (assigneeId?: number) => {
    if (!assigneeId || !users) return 'N/A';
    const user = users.find(u => u.id === assigneeId);
    return user ? user.email : 'Unknown';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'destructive';
      case 'assigned': return 'default';
      case 'resolved': return 'outline';
      case 'active':
      default:
        return 'secondary';
    }
  };

  const getChannelIcon = (channel?: string) => {
    switch (channel) {
      case 'whatsapp': return <Phone className="h-4 w-4 text-green-500" />;
      case 'messenger': return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case 'instagram': return <Instagram className="h-4 w-4 text-pink-500" />;
      case 'gmail': return <Mail className="h-4 w-4 text-red-500" />;
      case 'telegram': return <Send className="h-4 w-4 text-blue-400" />;
      case 'web':
      default:
        return <Globe className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const activeSessions = sessions?.filter(session =>
    session.status === 'resolved' || session.status === 'archived' || session.status === 'active'
  ) || [];

  return (
    <div className="h-full w-full overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full p-4">
        {/* Left Sidebar - Conversation List */}
        <div className="md:col-span-3 h-full overflow-hidden">
          <Card className="h-full flex flex-col card-shadow-lg bg-white dark:bg-slate-800">
            <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 flex-shrink-0 py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg dark:text-white">Conversations</CardTitle>
                <Badge variant="outline" className="ml-2 dark:border-slate-600 dark:text-slate-300">
                  {activeSessions.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0 bg-white dark:bg-slate-800">
              {isLoadingSessions ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading conversations...</p>
                  </div>
                </div>
              ) : activeSessions.length > 0 ? (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {activeSessions.map((session) => (
                    <button
                      key={session.conversation_id}
                      onClick={() => setSelectedSessionId(session.conversation_id)}
                      className={`
                        w-full p-4 text-left transition-all hover:bg-slate-50 dark:hover:bg-slate-700 flex-shrink-0
                        ${selectedSessionId === session.conversation_id
                          ? 'bg-blue-50 dark:bg-blue-950 border-l-4 border-l-blue-600'
                          : 'border-l-4 border-l-transparent'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getChannelIcon(session.channel)}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-sm truncate dark:text-white">
                              {session.contact_name || session.contact_phone || 'Unknown Contact'}
                            </h4>
                            <Badge
                              variant={getStatusBadgeVariant(session.status)}
                              className="ml-2 flex-shrink-0 text-xs"
                            >
                              {session.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {new Date(Number(session.conversation_id)).toLocaleString()}
                          </p>
                          {session.status === 'assigned' && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 truncate">
                              Assigned to {getAssigneeEmail(session.assignee_id)}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full p-6">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">No active conversations</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Center - Conversation Detail */}
        <div className="md:col-span-6 h-full overflow-hidden">
          {selectedSessionId ? (
            <ConversationDetail sessionId={selectedSessionId} agentId={1} />
          ) : (
            <Card className="h-full flex items-center justify-center card-shadow-lg bg-white dark:bg-slate-800">
              <div className="text-center p-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 mb-4">
                  <MessageSquare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 dark:text-white">No conversation selected</h3>
                <p className="text-muted-foreground">
                  Select a conversation from the list to view messages
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Right Sidebar - Contact Profile */}
        <div className="md:col-span-3 h-full overflow-hidden">
          {selectedSessionId ? (
            <ContactProfile sessionId={selectedSessionId} />
          ) : (
            <Card className="h-full flex items-center justify-center card-shadow-lg bg-white dark:bg-slate-800">
              <div className="text-center p-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 mb-4">
                  <Phone className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 dark:text-white">Contact Details</h3>
                <p className="text-muted-foreground text-sm">
                  Select a conversation to view contact information
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationsPage;
